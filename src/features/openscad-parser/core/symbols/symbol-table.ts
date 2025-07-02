/**
 * @file Symbol Table Implementation
 *
 * Comprehensive symbol table management for OpenSCAD constructs including
 * variables, functions, and modules with proper scope resolution and
 * identifier management.
 *
 * Following TypeScript 5.8, DRY, and SRP principles.
 */

import { createLogger } from '../../../../shared/services/logger.service.js';
import type { Result } from '../../../../shared/utils/functional/result.js';
import { error, success } from '../../../../shared/utils/functional/result.js';
import type {
  ASTNode,
  FunctionDefinitionNode,
  ModuleDefinitionNode,
  SourceLocation,
} from '../ast-types.js';

const _logger = createLogger('SymbolTable');

/**
 * OpenSCAD symbol types
 */
export type SymbolType =
  | 'variable'
  | 'function'
  | 'module'
  | 'parameter'
  | 'builtin_function'
  | 'builtin_module';

/**
 * Symbol information stored in the symbol table
 */
export interface OpenSCADSymbol {
  readonly name: string;
  readonly type: SymbolType;
  readonly location: SourceLocation;
  readonly scope: string[];
  readonly parameters?: string[];
  readonly returnType?: string;
  readonly value?: unknown;
  readonly isBuiltIn: boolean;
  readonly node?: ASTNode;
}

/**
 * Scope information for managing nested scopes
 */
export interface Scope {
  readonly name: string;
  readonly parent?: Scope;
  readonly symbols: Map<string, OpenSCADSymbol>;
  readonly children: Scope[];
  readonly level: number;
}

/**
 * Symbol resolution result
 */
export interface SymbolResolution {
  readonly symbol: OpenSCADSymbol;
  readonly scope: Scope;
  readonly distance: number; // How many scopes up the symbol was found
}

/**
 * Symbol table error
 */
export interface SymbolTableError {
  readonly message: string;
  readonly code: string;
  readonly location?: SourceLocation;
}

/**
 * Built-in OpenSCAD functions and modules
 */
const BUILTIN_FUNCTIONS: OpenSCADSymbol[] = [
  // Mathematical functions
  {
    name: 'abs',
    type: 'builtin_function',
    location: { start: { line: 0, column: 0, offset: 0 }, end: { line: 0, column: 0, offset: 0 } },
    scope: ['global'],
    parameters: ['x'],
    returnType: 'number',
    isBuiltIn: true,
  },
  {
    name: 'sin',
    type: 'builtin_function',
    location: { start: { line: 0, column: 0, offset: 0 }, end: { line: 0, column: 0, offset: 0 } },
    scope: ['global'],
    parameters: ['angle'],
    returnType: 'number',
    isBuiltIn: true,
  },
  {
    name: 'cos',
    type: 'builtin_function',
    location: { start: { line: 0, column: 0, offset: 0 }, end: { line: 0, column: 0, offset: 0 } },
    scope: ['global'],
    parameters: ['angle'],
    returnType: 'number',
    isBuiltIn: true,
  },
  {
    name: 'tan',
    type: 'builtin_function',
    location: { start: { line: 0, column: 0, offset: 0 }, end: { line: 0, column: 0, offset: 0 } },
    scope: ['global'],
    parameters: ['angle'],
    returnType: 'number',
    isBuiltIn: true,
  },
  {
    name: 'sqrt',
    type: 'builtin_function',
    location: { start: { line: 0, column: 0, offset: 0 }, end: { line: 0, column: 0, offset: 0 } },
    scope: ['global'],
    parameters: ['x'],
    returnType: 'number',
    isBuiltIn: true,
  },
  {
    name: 'pow',
    type: 'builtin_function',
    location: { start: { line: 0, column: 0, offset: 0 }, end: { line: 0, column: 0, offset: 0 } },
    scope: ['global'],
    parameters: ['base', 'exponent'],
    returnType: 'number',
    isBuiltIn: true,
  },
  {
    name: 'min',
    type: 'builtin_function',
    location: { start: { line: 0, column: 0, offset: 0 }, end: { line: 0, column: 0, offset: 0 } },
    scope: ['global'],
    parameters: ['...values'],
    returnType: 'number',
    isBuiltIn: true,
  },
  {
    name: 'max',
    type: 'builtin_function',
    location: { start: { line: 0, column: 0, offset: 0 }, end: { line: 0, column: 0, offset: 0 } },
    scope: ['global'],
    parameters: ['...values'],
    returnType: 'number',
    isBuiltIn: true,
  },

  // String functions
  {
    name: 'str',
    type: 'builtin_function',
    location: { start: { line: 0, column: 0, offset: 0 }, end: { line: 0, column: 0, offset: 0 } },
    scope: ['global'],
    parameters: ['...values'],
    returnType: 'string',
    isBuiltIn: true,
  },
  {
    name: 'len',
    type: 'builtin_function',
    location: { start: { line: 0, column: 0, offset: 0 }, end: { line: 0, column: 0, offset: 0 } },
    scope: ['global'],
    parameters: ['value'],
    returnType: 'number',
    isBuiltIn: true,
  },

  // Vector functions
  {
    name: 'norm',
    type: 'builtin_function',
    location: { start: { line: 0, column: 0, offset: 0 }, end: { line: 0, column: 0, offset: 0 } },
    scope: ['global'],
    parameters: ['vector'],
    returnType: 'number',
    isBuiltIn: true,
  },
  {
    name: 'cross',
    type: 'builtin_function',
    location: { start: { line: 0, column: 0, offset: 0 }, end: { line: 0, column: 0, offset: 0 } },
    scope: ['global'],
    parameters: ['a', 'b'],
    returnType: 'vector',
    isBuiltIn: true,
  },

  // Utility functions
  {
    name: 'echo',
    type: 'builtin_function',
    location: { start: { line: 0, column: 0, offset: 0 }, end: { line: 0, column: 0, offset: 0 } },
    scope: ['global'],
    parameters: ['...values'],
    returnType: 'undef',
    isBuiltIn: true,
  },
  {
    name: 'assert',
    type: 'builtin_function',
    location: { start: { line: 0, column: 0, offset: 0 }, end: { line: 0, column: 0, offset: 0 } },
    scope: ['global'],
    parameters: ['condition', 'message'],
    returnType: 'undef',
    isBuiltIn: true,
  },
];

const BUILTIN_MODULES: OpenSCADSymbol[] = [
  // 3D primitives
  {
    name: 'cube',
    type: 'builtin_module',
    location: { start: { line: 0, column: 0, offset: 0 }, end: { line: 0, column: 0, offset: 0 } },
    scope: ['global'],
    parameters: ['size', 'center'],
    isBuiltIn: true,
  },
  {
    name: 'sphere',
    type: 'builtin_module',
    location: { start: { line: 0, column: 0, offset: 0 }, end: { line: 0, column: 0, offset: 0 } },
    scope: ['global'],
    parameters: ['r', 'd'],
    isBuiltIn: true,
  },
  {
    name: 'cylinder',
    type: 'builtin_module',
    location: { start: { line: 0, column: 0, offset: 0 }, end: { line: 0, column: 0, offset: 0 } },
    scope: ['global'],
    parameters: ['h', 'r', 'r1', 'r2', 'd', 'd1', 'd2', 'center'],
    isBuiltIn: true,
  },
  {
    name: 'polyhedron',
    type: 'builtin_module',
    location: { start: { line: 0, column: 0, offset: 0 }, end: { line: 0, column: 0, offset: 0 } },
    scope: ['global'],
    parameters: ['points', 'faces', 'convexity'],
    isBuiltIn: true,
  },

  // 2D primitives
  {
    name: 'circle',
    type: 'builtin_module',
    location: { start: { line: 0, column: 0, offset: 0 }, end: { line: 0, column: 0, offset: 0 } },
    scope: ['global'],
    parameters: ['r', 'd'],
    isBuiltIn: true,
  },
  {
    name: 'square',
    type: 'builtin_module',
    location: { start: { line: 0, column: 0, offset: 0 }, end: { line: 0, column: 0, offset: 0 } },
    scope: ['global'],
    parameters: ['size', 'center'],
    isBuiltIn: true,
  },
  {
    name: 'polygon',
    type: 'builtin_module',
    location: { start: { line: 0, column: 0, offset: 0 }, end: { line: 0, column: 0, offset: 0 } },
    scope: ['global'],
    parameters: ['points', 'paths', 'convexity'],
    isBuiltIn: true,
  },

  // Transformations
  {
    name: 'translate',
    type: 'builtin_module',
    location: { start: { line: 0, column: 0, offset: 0 }, end: { line: 0, column: 0, offset: 0 } },
    scope: ['global'],
    parameters: ['v'],
    isBuiltIn: true,
  },
  {
    name: 'rotate',
    type: 'builtin_module',
    location: { start: { line: 0, column: 0, offset: 0 }, end: { line: 0, column: 0, offset: 0 } },
    scope: ['global'],
    parameters: ['a', 'v'],
    isBuiltIn: true,
  },
  {
    name: 'scale',
    type: 'builtin_module',
    location: { start: { line: 0, column: 0, offset: 0 }, end: { line: 0, column: 0, offset: 0 } },
    scope: ['global'],
    parameters: ['v'],
    isBuiltIn: true,
  },
  {
    name: 'mirror',
    type: 'builtin_module',
    location: { start: { line: 0, column: 0, offset: 0 }, end: { line: 0, column: 0, offset: 0 } },
    scope: ['global'],
    parameters: ['v'],
    isBuiltIn: true,
  },

  // CSG operations
  {
    name: 'union',
    type: 'builtin_module',
    location: { start: { line: 0, column: 0, offset: 0 }, end: { line: 0, column: 0, offset: 0 } },
    scope: ['global'],
    parameters: [],
    isBuiltIn: true,
  },
  {
    name: 'difference',
    type: 'builtin_module',
    location: { start: { line: 0, column: 0, offset: 0 }, end: { line: 0, column: 0, offset: 0 } },
    scope: ['global'],
    parameters: [],
    isBuiltIn: true,
  },
  {
    name: 'intersection',
    type: 'builtin_module',
    location: { start: { line: 0, column: 0, offset: 0 }, end: { line: 0, column: 0, offset: 0 } },
    scope: ['global'],
    parameters: [],
    isBuiltIn: true,
  },
  {
    name: 'hull',
    type: 'builtin_module',
    location: { start: { line: 0, column: 0, offset: 0 }, end: { line: 0, column: 0, offset: 0 } },
    scope: ['global'],
    parameters: [],
    isBuiltIn: true,
  },
  {
    name: 'minkowski',
    type: 'builtin_module',
    location: { start: { line: 0, column: 0, offset: 0 }, end: { line: 0, column: 0, offset: 0 } },
    scope: ['global'],
    parameters: ['convexity'],
    isBuiltIn: true,
  },
];

/**
 * Comprehensive symbol table for OpenSCAD constructs
 * Manages symbols with proper scope resolution and nesting
 */
export class SymbolTable {
  private readonly logger = createLogger('SymbolTable');
  private readonly globalScope: Scope;
  private currentScope: Scope;

  constructor() {
    this.logger.debug('SymbolTable initialized');

    // Create global scope with built-in symbols
    this.globalScope = {
      name: 'global',
      symbols: new Map(),
      children: [],
      level: 0,
    };

    this.currentScope = this.globalScope;

    // Add built-in functions and modules
    this.initializeBuiltins();
  }

  /**
   * Initialize built-in functions and modules
   */
  private initializeBuiltins(): void {
    // Add built-in functions
    for (const symbol of BUILTIN_FUNCTIONS) {
      this.globalScope.symbols.set(symbol.name, symbol);
    }

    // Add built-in modules
    for (const symbol of BUILTIN_MODULES) {
      this.globalScope.symbols.set(symbol.name, symbol);
    }

    this.logger.debug(
      `Initialized ${BUILTIN_FUNCTIONS.length} built-in functions and ${BUILTIN_MODULES.length} built-in modules`
    );
  }

  /**
   * Enter a new scope
   * @param name - Name of the new scope
   * @returns The new scope
   */
  enterScope(name: string): Scope {
    const newScope: Scope = {
      name,
      parent: this.currentScope,
      symbols: new Map(),
      children: [],
      level: this.currentScope.level + 1,
    };

    this.currentScope.children.push(newScope);
    this.currentScope = newScope;

    this.logger.debug(`Entered scope: ${name} (level ${newScope.level})`);
    return newScope;
  }

  /**
   * Exit the current scope
   * @returns The parent scope, or null if already at global scope
   */
  exitScope(): Scope | null {
    if (this.currentScope === this.globalScope) {
      this.logger.warn('Cannot exit global scope');
      return null;
    }

    const exitedScope = this.currentScope;
    if (this.currentScope.parent) {
      this.currentScope = this.currentScope.parent;
    }

    this.logger.debug(`Exited scope: ${exitedScope.name} (level ${exitedScope.level})`);
    return exitedScope;
  }

  /**
   * Get the current scope
   */
  getCurrentScope(): Scope {
    return this.currentScope;
  }

  /**
   * Get the global scope
   */
  getGlobalScope(): Scope {
    return this.globalScope;
  }

  /**
   * Define a new symbol in the current scope
   * @param symbol - Symbol to define
   * @returns Success or error result
   */
  defineSymbol(symbol: OpenSCADSymbol): Result<OpenSCADSymbol, SymbolTableError> {
    // Check if symbol already exists in current scope
    if (this.currentScope.symbols.has(symbol.name)) {
      // Symbol exists, we already checked with has()
      const existingSymbol = this.currentScope.symbols.get(symbol.name);
      if (!existingSymbol) {
        // This should never happen since we checked with has()
        throw new Error('Symbol should exist but was not found');
      }
      const symbolError: SymbolTableError = {
        message: `Symbol '${symbol.name}' is already defined in scope '${this.currentScope.name}'`,
        code: 'SYMBOL_ALREADY_DEFINED',
        location: symbol.location,
      };

      this.logger.error(`Symbol definition error: ${symbolError.message}`);
      return error(symbolError);
    }

    // Add symbol to current scope
    this.currentScope.symbols.set(symbol.name, symbol);

    this.logger.debug(
      `Defined symbol '${symbol.name}' of type '${symbol.type}' in scope '${this.currentScope.name}'`
    );
    return success(symbol);
  }

  /**
   * Resolve a symbol by name, searching up the scope chain
   * @param name - Symbol name to resolve
   * @returns Symbol resolution result or null if not found
   */
  resolveSymbol(name: string): SymbolResolution | null {
    let currentScope: Scope | undefined = this.currentScope;
    let distance = 0;

    while (currentScope) {
      const symbol = currentScope.symbols.get(name);
      if (symbol) {
        this.logger.debug(
          `Resolved symbol '${name}' in scope '${currentScope.name}' at distance ${distance}`
        );
        return {
          symbol,
          scope: currentScope,
          distance,
        };
      }

      currentScope = currentScope.parent;
      distance++;
    }

    this.logger.debug(`Symbol '${name}' not found in any scope`);
    return null;
  }

  /**
   * Check if a symbol exists in the current scope (not searching parent scopes)
   * @param name - Symbol name to check
   * @returns True if symbol exists in current scope
   */
  hasSymbolInCurrentScope(name: string): boolean {
    return this.currentScope.symbols.has(name);
  }

  /**
   * Get all symbols in the current scope
   * @returns Array of symbols in current scope
   */
  getSymbolsInCurrentScope(): OpenSCADSymbol[] {
    return Array.from(this.currentScope.symbols.values());
  }

  /**
   * Get all symbols accessible from the current scope (including parent scopes)
   * @returns Array of accessible symbols
   */
  getAccessibleSymbols(): OpenSCADSymbol[] {
    const symbols: OpenSCADSymbol[] = [];
    let currentScope: Scope | undefined = this.currentScope;

    while (currentScope) {
      symbols.push(...currentScope.symbols.values());
      currentScope = currentScope.parent;
    }

    return symbols;
  }

  /**
   * Define a function symbol
   * @param node - Function definition node
   * @returns Success or error result
   */
  defineFunction(node: FunctionDefinitionNode): Result<OpenSCADSymbol, SymbolTableError> {
    const symbol: OpenSCADSymbol = {
      name: node.name,
      type: 'function',
      location: node.location || {
        start: { line: 0, column: 0, offset: 0 },
        end: { line: 0, column: 0, offset: 0 },
      },
      scope: this.getScopePath(),
      parameters: node.parameters,
      returnType: 'unknown', // Would be inferred through type analysis
      isBuiltIn: false,
      node,
    };

    return this.defineSymbol(symbol);
  }

  /**
   * Define a module symbol
   * @param node - Module definition node
   * @returns Success or error result
   */
  defineModule(node: ModuleDefinitionNode): Result<OpenSCADSymbol, SymbolTableError> {
    const symbol: OpenSCADSymbol = {
      name: node.name,
      type: 'module',
      location: node.location || {
        start: { line: 0, column: 0, offset: 0 },
        end: { line: 0, column: 0, offset: 0 },
      },
      scope: this.getScopePath(),
      parameters: node.parameters,
      isBuiltIn: false,
      node,
    };

    return this.defineSymbol(symbol);
  }

  /**
   * Define a variable symbol
   * @param name - Variable name
   * @param location - Source location
   * @param value - Variable value (optional)
   * @returns Success or error result
   */
  defineVariable(
    name: string,
    location: SourceLocation,
    value?: unknown
  ): Result<OpenSCADSymbol, SymbolTableError> {
    const symbol: OpenSCADSymbol = {
      name,
      type: 'variable',
      location,
      scope: this.getScopePath(),
      value,
      isBuiltIn: false,
    };

    return this.defineSymbol(symbol);
  }

  /**
   * Define a parameter symbol
   * @param name - Parameter name
   * @param location - Source location
   * @returns Success or error result
   */
  defineParameter(
    name: string,
    location: SourceLocation
  ): Result<OpenSCADSymbol, SymbolTableError> {
    const symbol: OpenSCADSymbol = {
      name,
      type: 'parameter',
      location,
      scope: this.getScopePath(),
      isBuiltIn: false,
    };

    return this.defineSymbol(symbol);
  }

  /**
   * Get the current scope path as an array of scope names
   * @returns Array of scope names from global to current
   */
  private getScopePath(): string[] {
    const path: string[] = [];
    let currentScope: Scope | undefined = this.currentScope;

    while (currentScope) {
      path.unshift(currentScope.name);
      currentScope = currentScope.parent;
    }

    return path;
  }

  /**
   * Get scope statistics for debugging
   * @returns Scope statistics
   */
  getStatistics(): {
    totalScopes: number;
    currentScopeLevel: number;
    totalSymbols: number;
    symbolsByType: Record<SymbolType, number>;
  } {
    const stats = {
      totalScopes: this.countScopes(this.globalScope),
      currentScopeLevel: this.currentScope.level,
      totalSymbols: this.countSymbols(this.globalScope),
      symbolsByType: {
        variable: 0,
        function: 0,
        module: 0,
        parameter: 0,
        builtin_function: 0,
        builtin_module: 0,
      } as Record<SymbolType, number>,
    };

    // Count symbols by type
    this.countSymbolsByType(this.globalScope, stats.symbolsByType);

    return stats;
  }

  /**
   * Count total number of scopes recursively
   */
  private countScopes(scope: Scope): number {
    let count = 1; // Count current scope
    for (const child of scope.children) {
      count += this.countScopes(child);
    }
    return count;
  }

  /**
   * Count total number of symbols recursively
   */
  private countSymbols(scope: Scope): number {
    let count = scope.symbols.size;
    for (const child of scope.children) {
      count += this.countSymbols(child);
    }
    return count;
  }

  /**
   * Count symbols by type recursively
   */
  private countSymbolsByType(scope: Scope, counts: Record<SymbolType, number>): void {
    for (const symbol of scope.symbols.values()) {
      counts[symbol.type]++;
    }

    for (const child of scope.children) {
      this.countSymbolsByType(child, counts);
    }
  }
}
