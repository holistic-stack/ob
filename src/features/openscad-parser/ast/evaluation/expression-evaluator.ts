/**
 * @file expression-evaluator.ts
 * @description This file defines the core interfaces and abstract base class for expression evaluators
 * within the OpenSCAD parser's AST evaluation system. It establishes a contract for how different types
 * of expressions should be evaluated, promoting a modular and extensible design.
 *
 * @architectural_decision
 * The evaluation system is built upon the Strategy pattern, where `IExpressionEvaluator` defines the interface
 * for evaluation strategies, and `BaseExpressionEvaluator` provides common helper methods and a foundation
 * for concrete evaluators. This design allows for easy addition of new expression types and their evaluation
 * logic without modifying the core evaluation dispatcher. Each evaluator is responsible for a specific set
 * of Tree-sitter node types, ensuring a clear separation of concerns.
 *
 * @example
 * ```typescript
 * import { BaseExpressionEvaluator, IExpressionEvaluator, LiteralEvaluator } from './expression-evaluator';
 * import { ExpressionEvaluationContext } from './expression-evaluation-context';
 * import { SimpleErrorHandler } from '../../error-handling/simple-error-handler';
 * import * as TreeSitter from 'web-tree-sitter';
 *
 * // Assume Tree-sitter is initialized and language loaded
 * async function setupParser() {
 *   await TreeSitter.Parser.init();
 *   const parser = new TreeSitter.Parser();
 *   // Load OpenSCAD language here
 *   return parser;
 * }
 *
 * async function evaluateExample() {
 *   const parser = await setupParser();
 *   const errorHandler = new SimpleErrorHandler();
 *   const context = new ExpressionEvaluationContext(errorHandler);
 *
 *   // Example: Evaluate a number literal
 *   const tree = parser.parse('123');
 *   const numberNode = tree.rootNode.namedChild(0); // Assuming '123' is the first named child
 *
 *   if (numberNode) {
 *     const literalEvaluator = new LiteralEvaluator();
 *     if (literalEvaluator.canEvaluate(numberNode)) {
 *       const result = literalEvaluator.evaluate(numberNode, context);
 *       console.log(`Evaluated '${numberNode.text}': Value = ${result.value}, Type = ${result.type}`);
 *       // Expected: Evaluated '123': Value = 123, Type = number
 *     }
 *   }
 *
 *   // Example: Evaluate a boolean literal
 *   const boolTree = parser.parse('true');
 *   const boolNode = boolTree.rootNode.namedChild(0);
 *
 *   if (boolNode) {
 *     const literalEvaluator = new LiteralEvaluator();
 *     if (literalEvaluator.canEvaluate(boolNode)) {
 *       const result = literalEvaluator.evaluate(boolNode, context);
 *       console.log(`Evaluated '${boolNode.text}': Value = ${result.value}, Type = ${result.type}`);
 *       // Expected: Evaluated 'true': Value = true, Type = boolean
 *     }
 *   }
 *
 *   parser.delete();
 * }
 *
 * evaluateExample();
 * ```
 */

import type { Node as TSNode } from 'web-tree-sitter';
import type {
  EvaluationResult,
  ExpressionEvaluationContext,
} from './expression-evaluation-context.js';

/**
 * @interface IExpressionEvaluator
 * @description Defines the contract for any expression evaluator. Each evaluator is responsible
 * for a specific set of Tree-sitter node types and knows how to convert them into an `EvaluationResult`.
 */
export interface IExpressionEvaluator {
  /**
   * @method canEvaluate
   * @description Determines if this evaluator is capable of evaluating the given Tree-sitter node.
   * @param {TSNode} node - The Tree-sitter node to check.
   * @returns {boolean} `true` if the evaluator can handle the node, `false` otherwise.
   */
  canEvaluate(node: TSNode): boolean;

  /**
   * @method evaluate
   * @description Evaluates the expression represented by the given Tree-sitter node.
   * @param {TSNode} node - The Tree-sitter node to evaluate.
   * @param {ExpressionEvaluationContext} context - The evaluation context, providing access to variables, functions, and caching.
   * @returns {EvaluationResult} The result of the evaluation, including the value and its type.
   */
  evaluate(node: TSNode, context: ExpressionEvaluationContext): EvaluationResult;

  /**
   * @method getPriority
   * @description Returns the priority of this evaluator. Higher priority evaluators are considered more specific
   * and are tried before lower priority ones when multiple evaluators can handle a node.
   * @returns {number} The priority value.
   */
  getPriority(): number;
}

/**
 * @class BaseExpressionEvaluator
 * @description An abstract base class that provides common functionality and helper methods for expression evaluators.
 * Concrete evaluators should extend this class.
 */
export abstract class BaseExpressionEvaluator implements IExpressionEvaluator {
  protected supportedTypes: Set<string>;

  /**
   * @constructor
   * @description Initializes the base evaluator with a list of Tree-sitter node types it supports.
   * @param {string[]} supportedTypes - An array of Tree-sitter node type names that this evaluator can handle.
   */
  constructor(supportedTypes: string[]) {
    this.supportedTypes = new Set(supportedTypes);
  }

  /**
   * @method canEvaluate
   * @description Checks if the given Tree-sitter node's type is present in the `supportedTypes` set.
   * @param {TSNode} node - The Tree-sitter node to check.
   * @returns {boolean} `true` if the node type is supported, `false` otherwise.
   */
  canEvaluate(node: TSNode): boolean {
    return this.supportedTypes.has(node.type);
  }

  /**
   * @method evaluate
   * @description Abstract method that must be implemented by concrete evaluator classes.
   * This method contains the core logic for evaluating a specific expression type.
   * @param {TSNode} node - The Tree-sitter node to evaluate.
   * @param {ExpressionEvaluationContext} context - The evaluation context.
   * @returns {EvaluationResult} The result of the evaluation.
   */
  abstract evaluate(node: TSNode, context: ExpressionEvaluationContext): EvaluationResult;

  /**
   * @method getPriority
   * @description Abstract method that must be implemented by concrete evaluator classes.
   * @returns {number} The priority of the evaluator.
   */
  abstract getPriority(): number;

  /**
   * @method getChildByField
   * @description Helper method to safely retrieve a child Tree-sitter node by its field name.
   * This is useful when the grammar defines named fields for child nodes (e.g., 'left', 'right').
   * @param {TSNode} node - The parent Tree-sitter node.
   * @param {string} fieldName - The name of the field to retrieve the child from.
   * @returns {TSNode | null} The child node if found, otherwise `null`.
   */
  protected getChildByField(node: TSNode, fieldName: string): TSNode | null {
    return node.childForFieldName(fieldName);
  }

  /**
   * @method getChildrenByType
   * @description Helper method to retrieve all direct children of a Tree-sitter node that match a specific type.
   * @param {TSNode} node - The parent Tree-sitter node.
   * @param {string} type - The type of the child nodes to retrieve.
   * @returns {TSNode[]} An array of child nodes matching the specified type.
   */
  protected getChildrenByType(node: TSNode, type: string): TSNode[] {
    const children: TSNode[] = [];
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (child && child.type === type) {
        children.push(child);
      }
    }
    return children;
  }

  /**
   * @method createErrorResult
   * @description Helper method to create a standardized error `EvaluationResult`.
   * This is used when an evaluation fails due to unsupported operations, invalid types, or other issues.
   * @param {string} _message - The error message (currently unused, but good for future logging).
   * @param {ExpressionEvaluationContext} context - The evaluation context.
   * @returns {EvaluationResult} An `EvaluationResult` with `value: null` and `type: 'undef'`.
   */
  protected createErrorResult(
    _message: string,
    context: ExpressionEvaluationContext
  ): EvaluationResult {
    context.getOptions(); // Access context for error handling
    return {
      value: null,
      type: 'undef',
    };
  }

  /**
   * @method validateNumericOperands
   * @description Helper method to check if both operands are of type 'number' and their values are numeric.
   * @param {EvaluationResult} left - The evaluation result of the left operand.
   * @param {EvaluationResult} right - The evaluation result of the right operand.
   * @returns {boolean} `true` if both operands are valid numbers, `false` otherwise.
   */
  protected validateNumericOperands(left: EvaluationResult, right: EvaluationResult): boolean {
    return (
      left.type === 'number' &&
      right.type === 'number' &&
      typeof left.value === 'number' &&
      typeof right.value === 'number'
    );
  }

  /**
   * @method toNumber
   * @description Helper method to convert an `EvaluationResult` to a number.
   * Handles conversion from boolean and string types as per OpenSCAD's type coercion rules.
   * @param {EvaluationResult} result - The evaluation result to convert.
   * @returns {number} The numeric representation of the result.
   */
  protected toNumber(result: EvaluationResult): number {
    if (result.type === 'number' && typeof result.value === 'number') {
      return result.value;
    }
    if (result.type === 'string' && typeof result.value === 'string') {
      const num = parseFloat(result.value);
      return Number.isNaN(num) ? 0 : num;
    }
    if (result.type === 'boolean') {
      return result.value ? 1 : 0;
    }
    return 0;
  }

  /**
   * @method toBoolean
   * @description Helper method to convert an `EvaluationResult` to a boolean.
   * Handles conversion from number and string types as per OpenSCAD's type coercion rules.
   * @param {EvaluationResult} result - The evaluation result to convert.
   * @returns {boolean} The boolean representation of the result.
   */
  protected toBoolean(result: EvaluationResult): boolean {
    if (result.type === 'boolean') {
      return result.value as boolean;
    }
    if (result.type === 'number') {
      return (result.value as number) !== 0;
    }
    if (result.type === 'string') {
      return (result.value as string).length > 0;
    }
    return false;
  }

  /**
   * @method createCacheKey
   * @description Helper method to generate a unique cache key for a Tree-sitter node.
   * This is used for memoization of evaluation results.
   * @param {TSNode} node - The Tree-sitter node for which to create the key.
   * @param {string} [suffix] - An optional suffix to append to the key for further uniqueness.
   * @returns {string} The generated cache key.
   */
  protected createCacheKey(node: TSNode, suffix?: string): string {
    const base = `${node.type}:${node.text}:${node.startIndex}-${node.endIndex}`;
    return suffix ? `${base}:${suffix}` : base;
  }
}

/**
 * @class LiteralEvaluator
 * @description A concrete implementation of `IExpressionEvaluator` for evaluating literal values
 * (numbers, strings, booleans, and `undef`).
 */
export class LiteralEvaluator extends BaseExpressionEvaluator {
  /**
   * @constructor
   * @description Initializes the `LiteralEvaluator` to support Tree-sitter nodes representing literal values.
   */
  constructor() {
    super(['number', 'string', 'boolean', 'true', 'false', 'undef']);
  }

  /**
   * @method getPriority
   * @description Returns the highest priority for literal evaluators, as they are the most specific.
   * @returns {number} The priority value (100).
   */
  getPriority(): number {
    return 100; // Highest priority - most specific
  }

  /**
   * @method evaluate
   * @description Evaluates a literal Tree-sitter node and returns its corresponding JavaScript value and type.
   * Handles parsing of numbers, string unquoting, and boolean/undef values.
   * @param {TSNode} node - The Tree-sitter node representing the literal.
   * @param {ExpressionEvaluationContext} context - The evaluation context.
   * @returns {EvaluationResult} The evaluated literal value and its type.
   */
  evaluate(node: TSNode, context: ExpressionEvaluationContext): EvaluationResult {
    const cacheKey = this.createCacheKey(node);
    const cached = context.getCachedResult(cacheKey);
    if (cached) {
      return cached;
    }

    let result: EvaluationResult;

    switch (node.type) {
      case 'number': {
        const numValue = parseFloat(node.text);
        result = {
          value: Number.isNaN(numValue) ? 0 : numValue,
          type: 'number',
        };
        break;
      }

      case 'string': {
        // Remove quotes from string literals
        let stringValue = node.text;
        if (stringValue.startsWith('"') && stringValue.endsWith('"')) {
          stringValue = stringValue.slice(1, -1);
        }
        result = {
          value: stringValue,
          type: 'string',
        };
        break;
      }

      case 'boolean':
      case 'true':
        result = {
          value: true,
          type: 'boolean',
        };
        break;

      case 'false':
        result = {
          value: false,
          type: 'boolean',
        };
        break;

      case 'undef':
        result = {
          value: null,
          type: 'undef',
        };
        break;

      default:
        result = this.createErrorResult(`Unsupported literal type: ${node.type}`, context);
    }

    context.setCachedResult(cacheKey, result);
    return result;
  }
}

/**
 * @class IdentifierEvaluator
 * @description A concrete implementation of `IExpressionEvaluator` for evaluating identifier nodes,
 * typically representing variable references.
 */
export class IdentifierEvaluator extends BaseExpressionEvaluator {
  /**
   * @constructor
   * @description Initializes the `IdentifierEvaluator` to support Tree-sitter 'identifier' nodes.
   */
  constructor() {
    super(['identifier']);
  }

  /**
   * @method getPriority
   * @description Returns a high priority for identifier evaluators, as they are fundamental for variable resolution.
   * @returns {number} The priority value (90).
   */
  getPriority(): number {
    return 90;
  }

  /**
   * @method evaluate
   * @description Evaluates an identifier node by looking up its value in the provided `ExpressionEvaluationContext`.
   * If the variable is not found, it returns an `undef` result.
   * @param {TSNode} node - The Tree-sitter node representing the identifier.
   * @param {ExpressionEvaluationContext} context - The evaluation context, used to resolve the variable's value.
   * @returns {EvaluationResult} The evaluated value of the variable, or an `undef` result if the variable is not defined.
   */
  evaluate(node: TSNode, context: ExpressionEvaluationContext): EvaluationResult {
    const variableName = node.text;
    const variable = context.getVariable(variableName);

    if (variable) {
      return variable;
    }

    // Return undef for undefined variables
    return {
      value: null,
      type: 'undef',
    };
  }
}
