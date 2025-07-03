/**
 * @file Expression Evaluation Context
 *
 * Provides context and caching for expression evaluation.
 * Supports variable resolution, function calls, and memoization.
 */

import { Node as TSNode } from 'web-tree-sitter';
import * as ast from '../ast-types.js';
import { ErrorHandler } from '../../error-handling/index.js';

/**
 * Evaluation result with type information
 */
export interface EvaluationResult {
  value: ast.ParameterValue;
  type: 'number' | 'string' | 'boolean' | 'vector' | 'undef' | 'expression';
  cached?: boolean;
}

/**
 * Variable scope for expression evaluation
 */
export interface VariableScope {
  [name: string]: EvaluationResult;
}

/**
 * Function definition for expression evaluation
 */
export interface FunctionDefinition {
  name: string;
  parameters: string[];
  body?: TSNode | ast.ExpressionNode; // Optional for built-in functions
  evaluator: (args: EvaluationResult[], context: ExpressionEvaluationContext) => EvaluationResult;
}

/**
 * Evaluation options for controlling behavior
 */
export interface EvaluationOptions {
  /** Enable memoization for performance */
  enableMemoization?: boolean;
  /** Use lazy evaluation where possible */
  useLazyEvaluation?: boolean;
  /** Maximum recursion depth */
  maxRecursionDepth?: number;
  /** Strict type checking */
  strictTypes?: boolean;
  /** Allow undefined variables */
  allowUndefinedVariables?: boolean;
}

/**
 * Context for expression evaluation with caching and variable resolution
 */
export class ExpressionEvaluationContext {
  private variableScopes: VariableScope[] = [{}]; // Stack of scopes
  private functions: Map<string, FunctionDefinition> = new Map();
  private memoCache: Map<string, EvaluationResult> = new Map();
  private recursionDepth = 0;

  constructor(
    private errorHandler: ErrorHandler,
    private options: EvaluationOptions = {}
  ) {
    // Set default options
    this.options = {
      enableMemoization: true,
      useLazyEvaluation: false,
      maxRecursionDepth: 100,
      strictTypes: false,
      allowUndefinedVariables: false,
      ...options
    };

    // Register built-in functions
    this.registerBuiltinFunctions();
  }

  /**
   * Push a new variable scope
   */
  pushScope(initialVariables: VariableScope = {}): void {
    this.variableScopes.push({ ...initialVariables });
  }

  /**
   * Pop the current variable scope
   */
  popScope(): VariableScope | undefined {
    if (this.variableScopes.length <= 1) {
      this.errorHandler.logWarning('Cannot pop global scope');
      return undefined;
    }
    return this.variableScopes.pop();
  }

  /**
   * Set a variable in the current scope
   */
  setVariable(name: string, result: EvaluationResult): void {
    const currentScope = this.variableScopes[this.variableScopes.length - 1]!;
    currentScope[name] = result;
  }

  /**
   * Get a variable from any scope (searches from current to global)
   */
  getVariable(name: string): EvaluationResult | undefined {
    for (let i = this.variableScopes.length - 1; i >= 0; i--) {
      const scope = this.variableScopes[i]!;
      if (name in scope) {
        return scope[name];
      }
    }

    if (!this.options.allowUndefinedVariables) {
      this.errorHandler.logWarning(`Undefined variable: ${name}`);
    }

    return undefined;
  }

  /**
   * Register a function for evaluation
   */
  registerFunction(definition: FunctionDefinition): void {
    this.functions.set(definition.name, definition);
  }

  /**
   * Get a function definition
   */
  getFunction(name: string): FunctionDefinition | undefined {
    return this.functions.get(name);
  }

  /**
   * Get cached evaluation result
   */
  getCachedResult(key: string): EvaluationResult | undefined {
    if (!this.options.enableMemoization) {
      return undefined;
    }
    return this.memoCache.get(key);
  }

  /**
   * Cache evaluation result
   */
  setCachedResult(key: string, result: EvaluationResult): void {
    if (this.options.enableMemoization) {
      this.memoCache.set(key, { ...result, cached: true });
    }
  }

  /**
   * Create cache key for a node
   */
  createCacheKey(node: TSNode): string {
    return `${node.type}:${node.text}:${node.startIndex}-${node.endIndex}`;
  }

  /**
   * Check recursion depth
   */
  checkRecursionDepth(): boolean {
    return this.recursionDepth < (this.options.maxRecursionDepth ?? 100);
  }

  /**
   * Enter recursion
   */
  enterRecursion(): void {
    this.recursionDepth++;
  }

  /**
   * Exit recursion
   */
  exitRecursion(): void {
    this.recursionDepth = Math.max(0, this.recursionDepth - 1);
  }

  /**
   * Get current options
   */
  getOptions(): EvaluationOptions {
    return { ...this.options };
  }

  /**
   * Clear all caches
   */
  clearCaches(): void {
    this.memoCache.clear();
  }

  /**
   * Register built-in functions
   */
  private registerBuiltinFunctions(): void {
    // Math functions
    this.registerFunction({
      name: 'max',
      parameters: ['a', 'b'],
      evaluator: (args) => {
        if (args.length !== 2) {
          throw new Error('max() requires exactly 2 arguments');
        }
        const a = args[0]!.value as number;
        const b = args[1]!.value as number;
        return { value: Math.max(a, b), type: 'number' };
      }
    });

    this.registerFunction({
      name: 'min',
      parameters: ['a', 'b'],
      evaluator: (args) => {
        if (args.length !== 2) {
          throw new Error('min() requires exactly 2 arguments');
        }
        const a = args[0]!.value as number;
        const b = args[1]!.value as number;
        return { value: Math.min(a, b), type: 'number' };
      }
    });

    this.registerFunction({
      name: 'abs',
      parameters: ['x'],
      evaluator: (args) => {
        if (args.length !== 1) {
          throw new Error('abs() requires exactly 1 argument');
        }
        const x = args[0]!.value as number;
        return { value: Math.abs(x), type: 'number' };
      }
    });

    // Trigonometric functions (degrees)
    this.registerFunction({
      name: 'sin',
      parameters: ['x'],
      evaluator: (args) => {
        if (args.length !== 1) {
          throw new Error('sin() requires exactly 1 argument');
        }
        const x = args[0]!.value as number;
        return { value: Math.sin(x * Math.PI / 180), type: 'number' };
      }
    });

    this.registerFunction({
      name: 'cos',
      parameters: ['x'],
      evaluator: (args) => {
        if (args.length !== 1) {
          throw new Error('cos() requires exactly 1 argument');
        }
        const x = args[0]!.value as number;
        return { value: Math.cos(x * Math.PI / 180), type: 'number' };
      }
    });

    this.registerFunction({
      name: 'tan',
      parameters: ['x'],
      evaluator: (args) => {
        if (args.length !== 1) {
          throw new Error('tan() requires exactly 1 argument');
        }
        const x = args[0]!.value as number;
        return { value: Math.tan(x * Math.PI / 180), type: 'number' };
      }
    });

    this.registerFunction({
      name: 'asin',
      parameters: ['x'],
      evaluator: (args) => {
        if (args.length !== 1) {
          throw new Error('asin() requires exactly 1 argument');
        }
        const x = args[0]!.value as number;
        return { value: Math.asin(x) * 180 / Math.PI, type: 'number' };
      }
    });

    this.registerFunction({
      name: 'acos',
      parameters: ['x'],
      evaluator: (args) => {
        if (args.length !== 1) {
          throw new Error('acos() requires exactly 1 argument');
        }
        const x = args[0]!.value as number;
        return { value: Math.acos(x) * 180 / Math.PI, type: 'number' };
      }
    });

    this.registerFunction({
      name: 'atan',
      parameters: ['x'],
      evaluator: (args) => {
        if (args.length !== 1) {
          throw new Error('atan() requires exactly 1 argument');
        }
        const x = args[0]!.value as number;
        return { value: Math.atan(x) * 180 / Math.PI, type: 'number' };
      }
    });

    this.registerFunction({
      name: 'atan2',
      parameters: ['y', 'x'],
      evaluator: (args) => {
        if (args.length !== 2) {
          throw new Error('atan2() requires exactly 2 arguments');
        }
        const y = args[0]!.value as number;
        const x = args[1]!.value as number;
        return { value: Math.atan2(y, x) * 180 / Math.PI, type: 'number' };
      }
    });
  }
}
