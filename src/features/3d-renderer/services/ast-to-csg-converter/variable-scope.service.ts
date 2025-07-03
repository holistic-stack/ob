/**
 * Variable Scope Service
 *
 * Service for managing variable assignments and scope resolution
 * during AST-to-CSG conversion with support for nested scopes.
 */

import { createLogger } from '../../../../shared/services/logger.service.js';
import type { Result } from '../../../../shared/types/result.types.js';
import { error, success } from '../../../../shared/utils/functional/result.js';

const logger = createLogger('VariableScopeService');

/**
 * Variable binding with value and metadata
 */
export interface VariableBinding {
  readonly name: string;
  readonly value: unknown;
  readonly scopeLevel: number;
  readonly location?:
    | {
        readonly line: number;
        readonly column: number;
      }
    | undefined;
}

/**
 * Scope frame for variable management
 */
interface ScopeFrame {
  readonly name: string;
  readonly level: number;
  readonly variables: Map<string, VariableBinding>;
  readonly parent?: ScopeFrame;
}

/**
 * Variable scope management service
 */
export class VariableScopeService {
  private scopeStack: ScopeFrame[] = [];
  private currentScope: ScopeFrame;

  constructor() {
    // Initialize with global scope
    this.currentScope = {
      name: 'global',
      level: 0,
      variables: new Map(),
    };
    this.scopeStack.push(this.currentScope);

    logger.init('VariableScopeService initialized with global scope');
  }

  /**
   * Enter a new scope
   */
  enterScope(scopeName: string): void {
    logger.debug(`Entering scope: ${scopeName}`);

    const newScope: ScopeFrame = {
      name: scopeName,
      level: this.currentScope.level + 1,
      variables: new Map(),
      parent: this.currentScope,
    };

    this.scopeStack.push(newScope);
    this.currentScope = newScope;

    logger.debug(`Entered scope '${scopeName}' at level ${newScope.level}`);
  }

  /**
   * Exit the current scope
   */
  exitScope(): Result<void, string> {
    if (this.scopeStack.length <= 1) {
      return error('Cannot exit global scope');
    }

    const exitedScope = this.scopeStack.pop();
    if (!exitedScope) {
      return error('No scope to exit');
    }

    const parentScope = this.scopeStack[this.scopeStack.length - 1];
    if (!parentScope) {
      return error('Parent scope not found');
    }

    this.currentScope = parentScope;

    logger.debug(
      `Exited scope '${exitedScope.name}' (level ${exitedScope.level}), returned to '${this.currentScope.name}' (level ${this.currentScope.level})`
    );
    return success(undefined);
  }

  /**
   * Define a variable in the current scope
   */
  defineVariable(
    name: string,
    value: unknown,
    location?: { line: number; column: number }
  ): Result<void, string> {
    logger.debug(`Defining variable '${name}' in scope '${this.currentScope.name}'`);

    if (this.currentScope.variables.has(name)) {
      return error(`Variable '${name}' is already defined in scope '${this.currentScope.name}'`);
    }

    const binding: VariableBinding = {
      name,
      value,
      scopeLevel: this.currentScope.level,
      location: location ?? undefined,
    };

    this.currentScope.variables.set(name, binding);

    logger.debug(
      `Variable '${name}' defined in scope '${this.currentScope.name}' with value: ${String(value)}`
    );
    return success(undefined);
  }

  /**
   * Resolve a variable by name, searching up the scope chain
   */
  resolveVariable(name: string): VariableBinding | null {
    let scope: ScopeFrame | undefined = this.currentScope;

    while (scope) {
      const binding = scope.variables.get(name);
      if (binding) {
        logger.debug(`Resolved variable '${name}' in scope '${scope.name}' (level ${scope.level})`);
        return binding;
      }

      scope = scope.parent;
    }

    logger.debug(`Variable '${name}' not found in any scope`);
    return null;
  }

  /**
   * Get the current scope name
   */
  getCurrentScopeName(): string {
    return this.currentScope.name;
  }

  /**
   * Get the current scope level
   */
  getCurrentScopeLevel(): number {
    return this.currentScope.level;
  }

  /**
   * Get all variables in the current scope
   */
  getCurrentScopeVariables(): ReadonlyMap<string, VariableBinding> {
    return new Map(this.currentScope.variables);
  }

  /**
   * Get all variables accessible from the current scope
   */
  getAllAccessibleVariables(): ReadonlyMap<string, VariableBinding> {
    const allVariables = new Map<string, VariableBinding>();
    let scope: ScopeFrame | undefined = this.currentScope;

    // Walk up the scope chain, with inner scopes taking precedence
    const scopeChain: ScopeFrame[] = [];
    while (scope) {
      scopeChain.push(scope);
      scope = scope.parent;
    }

    // Add variables from outermost to innermost scope
    for (let i = scopeChain.length - 1; i >= 0; i--) {
      const currentScopeFrame = scopeChain[i];
      if (currentScopeFrame) {
        for (const [name, binding] of currentScopeFrame.variables) {
          allVariables.set(name, binding);
        }
      }
    }

    return allVariables;
  }

  /**
   * Clear all scopes and reset to global scope
   */
  reset(): void {
    logger.debug('Resetting variable scope service to global scope');

    this.scopeStack = [];
    this.currentScope = {
      name: 'global',
      level: 0,
      variables: new Map(),
    };
    this.scopeStack.push(this.currentScope);

    logger.debug('Variable scope service reset to global scope');
  }

  /**
   * Get the scope stack depth
   */
  getScopeDepth(): number {
    return this.scopeStack.length;
  }
}

/**
 * Default variable scope service instance
 */
export const variableScope = new VariableScopeService();
