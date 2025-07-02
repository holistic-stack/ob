/**
 * @file Scope Manager Implementation
 *
 * Advanced scope management for OpenSCAD constructs with automatic
 * scope handling, symbol resolution, and dependency tracking.
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
import {
  type OpenSCADSymbol,
  type Scope,
  type SymbolResolution,
  SymbolTable,
  type SymbolTableError,
} from './symbol-table.js';

const _logger = createLogger('ScopeManager');

/**
 * Create a default source location for cases where location is not available
 */
function createDefaultLocation(): SourceLocation {
  return {
    start: { line: 0, column: 0, offset: 0 },
    end: { line: 0, column: 0, offset: 0 },
  };
}

/**
 * Scope context for tracking nested scopes during AST traversal
 */
export interface ScopeContext {
  readonly scope: Scope;
  readonly symbolTable: SymbolTable;
  readonly parentContext?: ScopeContext;
}

/**
 * Symbol dependency tracking
 */
export interface SymbolDependency {
  readonly from: OpenSCADSymbol;
  readonly to: OpenSCADSymbol;
  readonly type: 'calls' | 'references' | 'inherits';
  readonly location: SourceLocation;
}

/**
 * Scope analysis result
 */
export interface ScopeAnalysisResult {
  readonly symbolTable: SymbolTable;
  readonly dependencies: SymbolDependency[];
  readonly unresolvedReferences: string[];
  readonly scopeTree: Scope;
  readonly errors: SymbolTableError[];
}

/**
 * Advanced scope manager for OpenSCAD constructs
 * Provides automatic scope handling and symbol resolution during AST traversal
 */
export class ScopeManager {
  private readonly logger = createLogger('ScopeManager');
  private readonly symbolTable: SymbolTable;
  private readonly dependencies: SymbolDependency[] = [];
  private readonly unresolvedReferences: string[] = [];
  private readonly errors: SymbolTableError[] = [];

  constructor() {
    this.logger.debug('ScopeManager initialized');
    this.symbolTable = new SymbolTable();
  }

  /**
   * Analyze AST nodes and build symbol table with scope management
   * @param nodes - AST nodes to analyze
   * @returns Scope analysis result
   */
  analyzeAST(nodes: ASTNode[]): Result<ScopeAnalysisResult, SymbolTableError> {
    this.logger.debug(`Starting scope analysis of ${nodes.length} AST nodes`);

    try {
      // Clear previous analysis results
      this.dependencies.length = 0;
      this.unresolvedReferences.length = 0;
      this.errors.length = 0;

      // Process each top-level node
      for (const node of nodes) {
        this.processNode(node);
      }

      const result: ScopeAnalysisResult = {
        symbolTable: this.symbolTable,
        dependencies: [...this.dependencies],
        unresolvedReferences: [...this.unresolvedReferences],
        scopeTree: this.symbolTable.getGlobalScope(),
        errors: [...this.errors],
      };

      this.logger.debug(
        `Scope analysis completed: ${this.dependencies.length} dependencies, ${this.unresolvedReferences.length} unresolved references, ${this.errors.length} errors`
      );

      return success(result);
    } catch (err) {
      const analysisError: SymbolTableError = {
        message: `Scope analysis failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
        code: 'SCOPE_ANALYSIS_FAILURE',
      };

      this.logger.error(`Scope analysis failed: ${analysisError.message}`);
      return error(analysisError);
    }
  }

  /**
   * Process a single AST node
   * @param node - AST node to process
   */
  private processNode(node: ASTNode): void {
    this.logger.debug(`Processing node: ${node.type}`);

    switch (node.type) {
      case 'function_definition':
        this.processFunctionDefinition(node);
        break;
      case 'module_definition':
        this.processModuleDefinition(node);
        break;
      case 'variable':
        this.processVariableReference(node);
        break;
      case 'assignment':
        this.processAssignment(node);
        break;
      default:
        // Process children if they exist
        this.processChildren(node);
    }
  }

  /**
   * Process function definition
   * @param node - Function definition node
   */
  private processFunctionDefinition(node: FunctionDefinitionNode): void {
    this.logger.debug(`Processing function definition: ${node.name}`);

    // Define function in current scope
    const result = this.symbolTable.defineFunction(node);
    if (!result.success) {
      this.errors.push(result.error);
      return;
    }

    // Enter function scope
    const _functionScope = this.symbolTable.enterScope(node.name);

    // Define parameters in function scope
    for (const param of node.parameters) {
      const paramResult = this.symbolTable.defineParameter(
        param,
        node.location || createDefaultLocation()
      );
      if (!paramResult.success) {
        this.errors.push(paramResult.error);
      }
    }

    // Process function body
    this.processNode(node.body);

    // Exit function scope
    this.symbolTable.exitScope();

    this.logger.debug(`Completed function definition: ${node.name}`);
  }

  /**
   * Process module definition
   * @param node - Module definition node
   */
  private processModuleDefinition(node: ModuleDefinitionNode): void {
    this.logger.debug(`Processing module definition: ${node.name}`);

    // Define module in current scope
    const result = this.symbolTable.defineModule(node);
    if (!result.success) {
      this.errors.push(result.error);
      return;
    }

    // Enter module scope
    const _moduleScope = this.symbolTable.enterScope(node.name);

    // Define parameters in module scope
    for (const param of node.parameters) {
      const paramResult = this.symbolTable.defineParameter(
        param,
        node.location || createDefaultLocation()
      );
      if (!paramResult.success) {
        this.errors.push(paramResult.error);
      }
    }

    // Process module body
    for (const bodyNode of node.body) {
      this.processNode(bodyNode);
    }

    // Exit module scope
    this.symbolTable.exitScope();

    this.logger.debug(`Completed module definition: ${node.name}`);
  }

  /**
   * Process variable reference
   * @param node - Variable reference node
   */
  private processVariableReference(node: ASTNode): void {
    if ('name' in node && typeof node.name === 'string') {
      this.logger.debug(`Processing variable reference: ${node.name}`);

      // Try to resolve the symbol
      const resolution = this.symbolTable.resolveSymbol(node.name);
      if (!resolution) {
        this.unresolvedReferences.push(node.name);
        this.logger.warn(`Unresolved reference: ${node.name}`);
      } else {
        // Track dependency
        const currentScope = this.symbolTable.getCurrentScope();

        // Create a simplified dependency tracking
        // In practice, we'd need to track the current function/module context better
        const dependency: SymbolDependency = {
          from: {
            name: `${currentScope.name}_context`,
            type: 'variable',
            location: node.location || createDefaultLocation(),
            scope: [currentScope.name],
            isBuiltIn: false,
          },
          to: resolution.symbol,
          type: 'references',
          location: node.location || createDefaultLocation(),
        };

        this.dependencies.push(dependency);
        this.logger.debug(`Tracked dependency: ${dependency.from.name} -> ${dependency.to.name}`);
      }
    }
  }

  /**
   * Process assignment (variable definition)
   * @param node - Assignment node
   */
  private processAssignment(node: ASTNode): void {
    if ('name' in node && typeof node.name === 'string') {
      this.logger.debug(`Processing assignment: ${node.name}`);

      // Extract the actual value from the AST node if it's a literal
      let actualValue: unknown;
      if ('value' in node && typeof node.value === 'object' && node.value !== null) {
        const valueNode = node.value as ASTNode;
        if (valueNode.type === 'literal' && 'value' in valueNode) {
          actualValue = valueNode.value;
        } else {
          actualValue = node.value;
        }
      } else if ('value' in node) {
        actualValue = node.value;
      }

      // Define variable in current scope
      const result = this.symbolTable.defineVariable(
        node.name,
        node.location || createDefaultLocation(),
        actualValue
      );
      if (!result.success) {
        this.errors.push(result.error);
      }

      // Process the value expression if it exists
      if ('value' in node && typeof node.value === 'object' && node.value !== null) {
        this.processNode(node.value as ASTNode);
      }
    }
  }

  /**
   * Process child nodes
   * @param node - Parent node
   */
  private processChildren(node: ASTNode): void {
    // Process children if they exist
    if ('children' in node && Array.isArray(node.children)) {
      for (const child of node.children) {
        this.processNode(child);
      }
    }

    // Process body if it exists
    if ('body' in node && Array.isArray(node.body)) {
      for (const bodyNode of node.body) {
        this.processNode(bodyNode);
      }
    }
  }

  /**
   * Get symbol table
   * @returns Current symbol table
   */
  getSymbolTable(): SymbolTable {
    return this.symbolTable;
  }

  /**
   * Get current scope context
   * @returns Current scope context
   */
  getCurrentContext(): ScopeContext {
    return {
      scope: this.symbolTable.getCurrentScope(),
      symbolTable: this.symbolTable,
    };
  }

  /**
   * Resolve symbol with detailed information
   * @param name - Symbol name to resolve
   * @returns Symbol resolution or null if not found
   */
  resolveSymbol(name: string): SymbolResolution | null {
    return this.symbolTable.resolveSymbol(name);
  }

  /**
   * Check if symbol exists in current scope
   * @param name - Symbol name to check
   * @returns True if symbol exists in current scope
   */
  hasSymbolInCurrentScope(name: string): boolean {
    return this.symbolTable.hasSymbolInCurrentScope(name);
  }

  /**
   * Get all accessible symbols from current scope
   * @returns Array of accessible symbols
   */
  getAccessibleSymbols(): OpenSCADSymbol[] {
    return this.symbolTable.getAccessibleSymbols();
  }

  /**
   * Get symbols by type
   * @param type - Symbol type to filter by
   * @returns Array of symbols of the specified type
   */
  getSymbolsByType(type: string): OpenSCADSymbol[] {
    return this.getAccessibleSymbols().filter((symbol) => symbol.type === type);
  }

  /**
   * Get function symbols
   * @returns Array of function symbols
   */
  getFunctions(): OpenSCADSymbol[] {
    return this.getSymbolsByType('function').concat(this.getSymbolsByType('builtin_function'));
  }

  /**
   * Get module symbols
   * @returns Array of module symbols
   */
  getModules(): OpenSCADSymbol[] {
    return this.getSymbolsByType('module').concat(this.getSymbolsByType('builtin_module'));
  }

  /**
   * Get variable symbols
   * @returns Array of variable symbols
   */
  getVariables(): OpenSCADSymbol[] {
    return this.getSymbolsByType('variable');
  }

  /**
   * Get parameter symbols
   * @returns Array of parameter symbols
   */
  getParameters(): OpenSCADSymbol[] {
    return this.getSymbolsByType('parameter');
  }

  /**
   * Check for circular dependencies
   * @returns Array of circular dependency chains
   */
  findCircularDependencies(): string[][] {
    const graph = new Map<string, string[]>();
    const cycles: string[][] = [];

    // Build dependency graph
    for (const dep of this.dependencies) {
      if (!graph.has(dep.from.name)) {
        graph.set(dep.from.name, []);
      }
      graph.get(dep.from.name)?.push(dep.to.name);
    }

    // DFS to detect cycles
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const dfs = (node: string, path: string[]): void => {
      visited.add(node);
      recursionStack.add(node);
      path.push(node);

      const neighbors = graph.get(node) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          dfs(neighbor, [...path]);
        } else if (recursionStack.has(neighbor)) {
          // Found a cycle
          const cycleStart = path.indexOf(neighbor);
          if (cycleStart !== -1) {
            cycles.push(path.slice(cycleStart));
          }
        }
      }

      recursionStack.delete(node);
    };

    for (const node of graph.keys()) {
      if (!visited.has(node)) {
        dfs(node, []);
      }
    }

    if (cycles.length > 0) {
      this.logger.warn(`Found ${cycles.length} circular dependencies`);
    }

    return cycles;
  }

  /**
   * Get scope statistics
   * @returns Detailed scope statistics
   */
  getStatistics(): {
    symbolTable: ReturnType<SymbolTable['getStatistics']>;
    dependencies: number;
    unresolvedReferences: number;
    errors: number;
    circularDependencies: number;
  } {
    return {
      symbolTable: this.symbolTable.getStatistics(),
      dependencies: this.dependencies.length,
      unresolvedReferences: this.unresolvedReferences.length,
      errors: this.errors.length,
      circularDependencies: this.findCircularDependencies().length,
    };
  }
}
