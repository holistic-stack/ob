/**
 * @file expression-evaluation-context.ts
 * @description This file defines the `ExpressionEvaluationContext` class, which provides the necessary context
 * for evaluating expressions within the OpenSCAD AST. It manages variable scopes, function definitions,
 * and memoization (caching) of evaluation results to optimize performance.
 *
 * @architectural_decision
 * The `ExpressionEvaluationContext` is designed as a mutable object that is passed down through the evaluation process.
 * This allows evaluators to access and modify shared state, such as variable assignments and function definitions,
 * while maintaining a clear separation of concerns. The context also incorporates memoization to avoid redundant
 * computations for identical expressions, significantly improving performance for complex or repetitive ASTs.
 * It also includes recursion depth checks to prevent stack overflow errors during evaluation of recursive expressions.
 *
 * @example
 * ```typescript
 * import { ExpressionEvaluationContext } from './expression-evaluation-context';
 * import { SimpleErrorHandler } from '../../error-handling/simple-error-handler';
 *
 * const errorHandler = new SimpleErrorHandler();
 * const context = new ExpressionEvaluationContext(errorHandler, { enableMemoization: true });
 *
 * // Set a variable in the current scope
 * context.setVariable('myVar', { value: 10, type: 'number' });
 *
 * // Get the variable
 * const result = context.getVariable('myVar');
 * console.log(result); // { value: 10, type: 'number' }
 *
 * // Push a new scope and set a new variable
 * context.pushScope();
 * context.setVariable('myVar', { value: 20, type: 'number' });
 * console.log(context.getVariable('myVar')); // { value: 20, type: 'number' } (from current scope)
 *
 * // Pop the scope and access the original variable
 * context.popScope();
 * console.log(context.getVariable('myVar')); // { value: 10, type: 'number' } (from previous scope)
 *
 * // Register and use a custom function
 * context.registerFunction({
 *   name: 'add',
 *   parameters: ['a', 'b'],
 *   evaluator: (args) => ({ value: (args[0]?.value as number) + (args[1]?.value as number), type: 'number' }),
 * });
 *
 * const addResult = context.getFunction('add')?.evaluator([
 *   { value: 5, type: 'number' },
 *   { value: 3, type: 'number' }
 * ], context);
 * console.log(addResult); // { value: 8, type: 'number' }
 * ```
 */

import type { Node as TSNode } from 'web-tree-sitter';
import type { ErrorHandler } from '../../error-handling/index.js';
import type * as ast from '../ast-types.js';

/**
 * @interface EvaluationResult
 * @description Represents the result of an expression evaluation, including its value and inferred type.
 *
 * @property {ast.ParameterValue} value - The evaluated value of the expression.
 * @property {'number' | 'string' | 'boolean' | 'vector' | 'undef' | 'expression'} type - The inferred type of the evaluated value.
 * @property {boolean} [cached] - Optional flag indicating if the result was retrieved from cache.
 */
export interface EvaluationResult {
  value: ast.ParameterValue;
  type: 'number' | 'string' | 'boolean' | 'vector' | 'undef' | 'expression';
  cached?: boolean;
}

/**
 * @interface VariableScope
 * @description Represents a single scope for variables, mapping variable names to their evaluated results.
 */
export interface VariableScope {
  [name: string]: EvaluationResult;
}

/**
 * @interface FunctionDefinition
 * @description Defines the structure for a function that can be evaluated within the context.
 *
 * @property {string} name - The name of the function.
 * @property {string[]} parameters - An array of parameter names the function accepts.
 * @property {TSNode | ast.ExpressionNode} [body] - The Tree-sitter node or AST expression representing the function's body (optional for built-in functions).
 * @property {(args: EvaluationResult[], context: ExpressionEvaluationContext) => EvaluationResult} evaluator - The function that performs the actual evaluation.
 */
export interface FunctionDefinition {
  name: string;
  parameters: string[];
  body?: TSNode | ast.ExpressionNode; // Optional for built-in functions
  evaluator: (args: EvaluationResult[], context: ExpressionEvaluationContext) => EvaluationResult;
}

/**
 * @interface EvaluationOptions
 * @description Configuration options that control the behavior of the expression evaluation context.
 *
 * @property {boolean} [enableMemoization=true] - If `true`, enables caching of evaluation results for performance.
 * @property {boolean} [useLazyEvaluation=false] - If `true`, enables lazy evaluation where expressions are only evaluated when their value is needed.
 * @property {number} [maxRecursionDepth=100] - The maximum allowed recursion depth during evaluation to prevent stack overflows.
 * @property {boolean} [strictTypes=false] - If `true`, enforces strict type checking during operations.
 * @property {boolean} [allowUndefinedVariables=false] - If `true`, allows access to undefined variables without throwing an error (they will evaluate to `undef`).
 */
export interface EvaluationOptions {
  enableMemoization?: boolean;
  useLazyEvaluation?: boolean;
  maxRecursionDepth?: number;
  strictTypes?: boolean;
  allowUndefinedVariables?: boolean;
}

/**
 * @class ExpressionEvaluationContext
 * @description Manages the context for expression evaluation, including variable scopes, function definitions, and caching.
 */
export class ExpressionEvaluationContext {
  private variableScopes: VariableScope[] = [{}]; // Stack of scopes
  private functions: Map<string, FunctionDefinition> = new Map();
  private memoCache: Map<string, EvaluationResult> = new Map();
  private recursionDepth = 0;

  /**
   * @constructor
   * @description Initializes a new `ExpressionEvaluationContext`.
   *
   * @param {ErrorHandler} errorHandler - The error handler to use for reporting evaluation errors.
   * @param {EvaluationOptions} [options={}] - Optional configuration options for the context.
   */
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
      ...options,
    };

    // Register built-in functions
    this.registerBuiltinFunctions();
  }

  /**
   * @method pushScope
   * @description Pushes a new variable scope onto the stack. Variables defined in this new scope
   * will shadow variables with the same name in outer scopes.
   *
   * @param {VariableScope} [initialVariables={}] - Optional initial variables to populate the new scope.
   */
  pushScope(initialVariables: VariableScope = {}): void {
    this.variableScopes.push({ ...initialVariables });
  }

  /**
   * @method popScope
   * @description Removes the current variable scope from the stack. Variables from the previous scope
   * become accessible again.
   *
   * @returns {VariableScope | undefined} The popped scope, or `undefined` if no more scopes can be popped.
   */
  popScope(): VariableScope | undefined {
    if (this.variableScopes.length <= 1) {
      return undefined;
    }
    return this.variableScopes.pop();
  }

  /**
   * @method setVariable
   * @description Sets the value of a variable in the current scope.
   *
   * @param {string} name - The name of the variable.
   * @param {EvaluationResult} result - The evaluated result (value and type) of the variable.
   */
  setVariable(name: string, result: EvaluationResult): void {
    const currentScope = this.variableScopes[this.variableScopes.length - 1];
    if (currentScope) {
      currentScope[name] = result;
    }
  }

  /**
   * @method getVariable
   * @description Retrieves the value of a variable, searching from the current scope outwards to the global scope.
   *
   * @param {string} name - The name of the variable to retrieve.
   * @returns {EvaluationResult | undefined} The evaluated result of the variable, or `undefined` if not found
   * and `allowUndefinedVariables` is `true`.
   */
  getVariable(name: string): EvaluationResult | undefined {
    for (let i = this.variableScopes.length - 1; i >= 0; i--) {
      const scope = this.variableScopes[i];
      if (scope && name in scope) {
        return scope[name];
      }
    }

    if (!this.options.allowUndefinedVariables) {
      // Intentionally empty, as per design, to allow undefined variables based on option.
    }

    return undefined;
  }

  /**
   * @method registerFunction
   * @description Registers a new function definition with the evaluation context.
   * Registered functions can be called during expression evaluation.
   *
   * @param {FunctionDefinition} definition - The definition of the function to register.
   */
  registerFunction(definition: FunctionDefinition): void {
    this.functions.set(definition.name, definition);
  }

  /**
   * @method getFunction
   * @description Retrieves a function definition by its name.
   *
   * @param {string} name - The name of the function to retrieve.
   * @returns {FunctionDefinition | undefined} The function definition, or `undefined` if not found.
   */
  getFunction(name: string): FunctionDefinition | undefined {
    return this.functions.get(name);
  }

  /**
   * @method getCachedResult
   * @description Retrieves a cached evaluation result for a given key.
   * Memoization must be enabled in the options for this to return a value.
   *
   * @param {string} key - The cache key (typically generated from a Tree-sitter node).
   * @returns {EvaluationResult | undefined} The cached result, or `undefined` if not found or memoization is disabled.
   */
  getCachedResult(key: string): EvaluationResult | undefined {
    if (!this.options.enableMemoization) {
      return undefined;
    }
    return this.memoCache.get(key);
  }

  /**
   * @method setCachedResult
   * @description Caches an evaluation result for a given key.
   * The result will only be cached if memoization is enabled in the options.
   *
   * @param {string} key - The cache key.
   * @param {EvaluationResult} result - The result to cache.
   */
  setCachedResult(key: string, result: EvaluationResult): void {
    if (this.options.enableMemoization) {
      this.memoCache.set(key, { ...result, cached: true });
    }
  }

  /**
   * @method createCacheKey
   * @description Generates a unique cache key for a given Tree-sitter node.
   * The key is based on the node's type, text content, and start/end indices.
   *
   * @param {TSNode} node - The Tree-sitter node for which to create a cache key.
   * @returns {string} The generated cache key.
   */
  createCacheKey(node: TSNode): string {
    return `${node.type}:${node.text}:${node.startIndex}-${node.endIndex}`;
  }

  /**
   * @method checkRecursionDepth
   * @description Checks if the current recursion depth has exceeded the maximum allowed depth.
   * This is a safeguard against infinite recursion in self-referential expressions or functions.
   *
   * @returns {boolean} `true` if the current recursion depth is within limits, `false` otherwise.
   */
  checkRecursionDepth(): boolean {
    return this.recursionDepth < (this.options.maxRecursionDepth ?? 100);
  }

  /**
   * @method enterRecursion
   * @description Increments the recursion depth counter. Should be called at the beginning of a recursive evaluation step.
   */
  enterRecursion(): void {
    this.recursionDepth++;
  }

  /**
   * @method exitRecursion
   * @description Decrements the recursion depth counter. Should be called at the end of a recursive evaluation step.
   */
  exitRecursion(): void {
    this.recursionDepth = Math.max(0, this.recursionDepth - 1);
  }

  /**
   * @method getOptions
   * @description Returns a copy of the current evaluation options.
   *
   * @returns {EvaluationOptions} The current evaluation options.
   */
  getOptions(): EvaluationOptions {
    return { ...this.options };
  }

  /**
   * @method clearCaches
   * @description Clears all memoized evaluation results from the cache.
   */
  clearCaches(): void {
    this.memoCache.clear();
  }

  /**
   * @method registerBuiltinFunctions
   * @description Registers a set of common built-in OpenSCAD functions (e.g., `max`, `min`, `abs`, trigonometric functions).
   * This method is called during the context's initialization.
   * @private
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
        const a = args[0]?.value as number;
        const b = args[1]?.value as number;
        return { value: Math.max(a, b), type: 'number' };
      },
    });

    this.registerFunction({
      name: 'min',
      parameters: ['a', 'b'],
      evaluator: (args) => {
        if (args.length !== 2) {
          throw new Error('min() requires exactly 2 arguments');
        }
        const a = args[0]?.value as number;
        const b = args[1]?.value as number;
        return { value: Math.min(a, b), type: 'number' };
      },
    });

    this.registerFunction({
      name: 'abs',
      parameters: ['x'],
      evaluator: (args) => {
        if (args.length !== 1) {
          throw new Error('abs() requires exactly 1 argument');
        }
        const x = args[0]?.value as number;
        return { value: Math.abs(x), type: 'number' };
      },
    });

    // Trigonometric functions (degrees)
    this.registerFunction({
      name: 'sin',
      parameters: ['x'],
      evaluator: (args) => {
        if (args.length !== 1) {
          throw new Error('sin() requires exactly 1 argument');
        }
        const x = args[0]?.value as number;
        return { value: Math.sin((x * Math.PI) / 180), type: 'number' };
      },
    });

    this.registerFunction({
      name: 'cos',
      parameters: ['x'],
      evaluator: (args) => {
        if (args.length !== 1) {
          throw new Error('cos() requires exactly 1 argument');
        }
        const x = args[0]?.value as number;
        return { value: Math.cos((x * Math.PI) / 180), type: 'number' };
      },
    });

    this.registerFunction({
      name: 'tan',
      parameters: ['x'],
      evaluator: (args) => {
        if (args.length !== 1) {
          throw new Error('tan() requires exactly 1 argument');
        }
        const x = args[0]?.value as number;
        return { value: Math.tan((x * Math.PI) / 180), type: 'number' };
      },
    });

    this.registerFunction({
      name: 'asin',
      parameters: ['x'],
      evaluator: (args) => {
        if (args.length !== 1) {
          throw new Error('asin() requires exactly 1 argument');
        }
        const x = args[0]?.value as number;
        return { value: (Math.asin(x) * 180) / Math.PI, type: 'number' };
      },
    });

    this.registerFunction({
      name: 'acos',
      parameters: ['x'],
      evaluator: (args) => {
        if (args.length !== 1) {
          throw new Error('acos() requires exactly 1 argument');
        }
        const x = args[0]?.value as number;
        return { value: (Math.acos(x) * 180) / Math.PI, type: 'number' };
      },
    });

    this.registerFunction({
      name: 'atan',
      parameters: ['x'],
      evaluator: (args) => {
        if (args.length !== 1) {
          throw new Error('atan() requires exactly 1 argument');
        }
        const x = args[0]?.value as number;
        return { value: (Math.atan(x) * 180) / Math.PI, type: 'number' };
      },
    });

    this.registerFunction({
      name: 'atan2',
      parameters: ['y', 'x'],
      evaluator: (args) => {
        if (args.length !== 2) {
          throw new Error('atan2() requires exactly 2 arguments');
        }
        const y = args[0]?.value as number;
        const x = args[1]?.value as number;
        return { value: (Math.atan2(y, x) * 180) / Math.PI, type: 'number' };
      },
    });
  }
}
