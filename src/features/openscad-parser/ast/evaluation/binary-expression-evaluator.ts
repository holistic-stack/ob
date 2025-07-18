/**
 * @file binary-expression-evaluator.ts
 * @description This file implements the `BinaryExpressionEvaluator` class, responsible for evaluating
 * binary expressions (e.g., arithmetic, comparison, logical operations) within the OpenSCAD AST.
 * It extends `BaseExpressionEvaluator` and handles various types of binary operations with proper
 * operator precedence and type coercion.
 *
 * @architectural_decision
 * The evaluation logic for binary expressions is encapsulated in a dedicated class to adhere to the
 * Single Responsibility Principle. This makes the evaluation process modular and extensible.
 * The evaluator is designed to work with Tree-sitter nodes, extracting operands and operators,
 * and then performing the corresponding operation. It also includes error handling for malformed
 * expressions and recursion depth checks to prevent stack overflows during complex evaluations.
 *
 * @example
 * ```typescript
 * import { BinaryExpressionEvaluator } from './binary-expression-evaluator';
 * import { ExpressionEvaluationContext } from './expression-evaluation-context';
 * import { OpenscadParser } from '../../openscad-parser';
 * import { SimpleErrorHandler } from '../../error-handling/simple-error-handler';
 *
 * async function evaluateBinaryExpression() {
 *   const errorHandler = new SimpleErrorHandler();
 *   const parser = new OpenscadParser(errorHandler);
 *   await parser.init();
 *
 *   const code = '10 + 5 * 2';
 *   const cst = parser.parseCST(code);
 *   if (!cst) return;
 *
 *   // Assuming the root node is the binary expression or contains it
 *   const binaryExprNode = cst.rootNode.namedChild(0); // Adjust based on actual CST structure
 *   if (!binaryExprNode) return;
 *
 *   const context = new ExpressionEvaluationContext();
 *   const evaluator = new BinaryExpressionEvaluator();
 *
 *   const result = evaluator.evaluate(binaryExprNode, context);
 *   console.log(`Evaluation Result: ${result.value} (Type: ${result.type})`);
 *   // Expected: Evaluation Result: 20 (Type: number)
 *
 *   parser.dispose();
 * }
 *
 * evaluateBinaryExpression();
 * ```
 */

import type { Node as TSNode } from 'web-tree-sitter';
import type {
  EvaluationResult,
  ExpressionEvaluationContext,
} from './expression-evaluation-context.js';
import { BaseExpressionEvaluator } from './expression-evaluator.js';

/**
 * @class BinaryExpressionEvaluator
 * @description Evaluates binary expressions in the OpenSCAD AST. It supports arithmetic, comparison, and logical operations.
 * This evaluator is designed to handle the various forms of binary expressions as parsed by Tree-sitter.
 */
export class BinaryExpressionEvaluator extends BaseExpressionEvaluator {
  /**
   * @constructor
   * @description Initializes the `BinaryExpressionEvaluator` with a list of supported Tree-sitter node types
   * that represent binary expressions or expressions that contain binary operations.
   */
  constructor() {
    super([
      'binary_expression',
      'additive_expression',
      'multiplicative_expression',
      'exponentiation_expression',
      'logical_or_expression',
      'logical_and_expression',
      'equality_expression',
      'relational_expression',
      'unary_expression',
      'accessor_expression',
      'primary_expression',
      'conditional_expression',
    ]);
  }

  /**
   * @method getPriority
   * @description Returns the priority of this evaluator. Higher priority evaluators are tried first.
   * Binary expressions typically have high priority as they are fundamental to most calculations.
   * @returns {number} The priority value (80).
   */
  override getPriority(): number {
    return 80; // High priority for binary operations
  }

  /**
   * @method canEvaluate
   * @description Determines if this evaluator can handle the given Tree-sitter node.
   * It checks if the node's type is among the supported binary expression types or if it's a generic
   * 'expression' node that contains a binary expression as a child.
   *
   * @param {TSNode} node - The Tree-sitter node to check.
   * @returns {boolean} `true` if the evaluator can handle the node, `false` otherwise.
   */
  override canEvaluate(node: TSNode): boolean {
    // Support both direct binary expression types and expressions with binary expressionType
    if (this.supportedTypes.has(node.type)) {
      return true;
    }

    // Also check for expression nodes that might have binary expressionType
    if (node.type === 'expression') {
      // Look for binary_expression descendants
      for (let i = 0; i < node.namedChildCount; i++) {
        const child = node.namedChild(i);
        if (child && this.supportedTypes.has(child.type)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * @method evaluate
   * @description Evaluates the given Tree-sitter node as a binary expression.
   * It extracts the left operand, operator, and right operand, then performs the operation.
   * Includes caching and recursion depth checks.
   *
   * @param {TSNode} node - The Tree-sitter node representing the binary expression.
   * @param {ExpressionEvaluationContext} context - The evaluation context, providing access to variables and caching.
   * @returns {EvaluationResult} The result of the evaluation (value and type), or an error result.
   */
  override evaluate(node: TSNode, context: ExpressionEvaluationContext): EvaluationResult {
    const cacheKey = this.createCacheKey(node);
    const cached = context.getCachedResult(cacheKey);
    if (cached) {
      return cached;
    }

    // Check recursion depth
    if (!context.checkRecursionDepth()) {
      return this.createErrorResult('Maximum recursion depth exceeded', context);
    }

    context.enterRecursion();

    try {
      // Handle both direct binary expressions and expressions with binary expressionType
      let leftNode: TSNode | null = null;
      let operatorNode: TSNode | null = null;
      let rightNode: TSNode | null = null;

      if (node.type === 'expression') {
        // For expression nodes created by the ExpressionVisitor, find the binary expression child
        for (let i = 0; i < node.namedChildCount; i++) {
          const child = node.namedChild(i);
          if (child && this.supportedTypes.has(child.type)) {
            // Use this child as the binary expression node
            leftNode = child.namedChild(0);
            operatorNode = child.namedChild(1);
            rightNode = child.namedChild(2);
            break;
          }
        }
      } else {
        // For direct binary expression nodes
        leftNode = this.getChildByField(node, 'left');
        operatorNode = this.getChildByField(node, 'operator');
        rightNode = this.getChildByField(node, 'right');
      }

      // If we couldn't find the nodes using fields, try by index
      if (!leftNode) leftNode = node.namedChild(0);
      if (!operatorNode && node.childCount > 1) operatorNode = node.child(1);
      if (!rightNode) rightNode = node.namedChild(2) || node.namedChild(1);

      if (leftNode && operatorNode && rightNode) {
        // Real binary expression
        const result = this.evaluateBinaryExpression(node, context);
        context.setCachedResult(cacheKey, result);
        return result;
      } else {
        // Single-value expression - delegate to child
        const result = this.evaluateSingleValueExpression(node, context);
        context.setCachedResult(cacheKey, result);
        return result;
      }
    } finally {
      context.exitRecursion();
    }
  }

  /**
   * @method evaluateBinaryExpression
   * @description Performs the actual evaluation of a binary expression.
   * It retrieves the operands and operator, then calls `performOperation`.
   *
   * @param {TSNode} node - The Tree-sitter node representing the binary expression.
   * @param {ExpressionEvaluationContext} context - The evaluation context.
   * @returns {EvaluationResult} The result of the binary operation.
   * @private
   */
  private evaluateBinaryExpression(
    node: TSNode,
    context: ExpressionEvaluationContext
  ): EvaluationResult {
    // Get operands using field names as defined in the grammar
    const leftNode = this.getChildByField(node, 'left');
    const operatorNode = this.getChildByField(node, 'operator');
    const rightNode = this.getChildByField(node, 'right');

    if (!leftNode || !operatorNode || !rightNode) {
      return this.createErrorResult(`Malformed binary expression: missing operands`, context);
    }

    const operator = operatorNode.text;

    // Evaluate operands using the main evaluator (will be injected)
    const leftResult = this.evaluateOperand(leftNode, context);
    const rightResult = this.evaluateOperand(rightNode, context);

    // Check if operands evaluated to error states
    if (leftResult.type === 'undef' && leftResult.value === null) {
      return this.createErrorResult(`Failed to evaluate left operand`, context);
    }
    if (rightResult.type === 'undef' && rightResult.value === null) {
      return this.createErrorResult(`Failed to evaluate right operand`, context);
    }

    // Perform operation based on operator
    return this.performOperation(operator, leftResult, rightResult, context);
  }

  /**
   * @method evaluateOperand
   * @description Evaluates a single operand node. This method is designed to be patched by the
   * `ExpressionEvaluatorRegistry` to ensure proper delegation to other evaluators.
   *
   * @param {TSNode} node - The Tree-sitter node representing the operand.
   * @param {ExpressionEvaluationContext} context - The evaluation context.
   * @returns {EvaluationResult} The result of the operand evaluation.
   * @private
   */
  private evaluateOperand(node: TSNode, context: ExpressionEvaluationContext): EvaluationResult {
    // This method will be patched by the ExpressionEvaluatorRegistry
    // to use the registry's evaluate method for proper delegation

    // Fallback implementation for direct usage (should not be reached when patched)
    if (node.type === 'number') {
      const value = parseFloat(node.text);
      return {
        value: Number.isNaN(value) ? 0 : value,
        type: 'number',
      };
    }

    if (node.type === 'identifier') {
      return (
        context.getVariable(node.text) ?? {
          value: null,
          type: 'undef',
        }
      );
    }

    // For complex expressions, return a default result
    // This should not be reached when the registry patches this method
    return {
      value: null,
      type: 'undef',
    };
  }

  /**
   * @method evaluateSingleValueExpression
   * @description Handles the evaluation of expressions that are not strictly binary but might be parsed
   * as such (e.g., a single number within a parenthesized expression). It delegates to the child node.
   *
   * @param {TSNode} node - The Tree-sitter node representing the single-value expression.
   * @param {ExpressionEvaluationContext} context - The evaluation context.
   * @returns {EvaluationResult} The result of the child node's evaluation.
   * @private
   */
  private evaluateSingleValueExpression(
    node: TSNode,
    context: ExpressionEvaluationContext
  ): EvaluationResult {
    // For single-value expressions, delegate to the first child
    if (node.childCount === 1) {
      const child = node.child(0);
      if (child) {
        const result = this.evaluateOperand(child, context);
        // The evaluateOperand method now always returns a result, never null
        return result;
      }
    }

    // If no child or multiple children, return error
    return this.createErrorResult(
      `Single-value expression has unexpected structure: ${node.childCount} children`,
      context
    );
  }

  /**
   * @method performOperation
   * @description Executes the specific binary operation based on the provided operator.
   * It dispatches to various private helper methods for each operator type.
   *
   * @param {string} operator - The string representation of the operator (e.g., '+', '&&').
   * @param {EvaluationResult} left - The evaluation result of the left operand.
   * @param {EvaluationResult} right - The evaluation result of the right operand.
   * @param {ExpressionEvaluationContext} context - The evaluation context.
   * @returns {EvaluationResult} The result of the operation.
   * @private
   */
  private performOperation(
    operator: string,
    left: EvaluationResult,
    right: EvaluationResult,
    context: ExpressionEvaluationContext
  ): EvaluationResult {
    switch (operator) {
      // Arithmetic operators
      case '+':
        return this.performAddition(left, right);
      case '-':
        return this.performSubtraction(left, right);
      case '*':
        return this.performMultiplication(left, right);
      case '/':
        return this.performDivision(left, right);
      case '%':
        return this.performModulo(left, right);
      case '^':
        return this.performExponentiation(left, right);

      // Comparison operators
      case '==':
        return this.performEquality(left, right);
      case '!=':
        return this.performInequality(left, right);
      case '<':
        return this.performLessThan(left, right);
      case '<=':
        return this.performLessThanOrEqual(left, right);
      case '>':
        return this.performGreaterThan(left, right);
      case '>=':
        return this.performGreaterThanOrEqual(left, right);

      // Logical operators
      case '&&':
        return this.performLogicalAnd(left, right);
      case '||':
        return this.performLogicalOr(left, right);

      default:
        return this.createErrorResult(`Unsupported operator: ${operator}`, context);
    }
  }

  /**
   * @method performAddition
   * @description Performs addition. Handles both numeric addition and string concatenation.
   * @param {EvaluationResult} left - Left operand.
   * @param {EvaluationResult} right - Right operand.
   * @returns {EvaluationResult} Result of addition/concatenation.
   * @private
   */
  private performAddition(left: EvaluationResult, right: EvaluationResult): EvaluationResult {
    if (this.validateNumericOperands(left, right)) {
      return {
        value: (left.value as number) + (right.value as number),
        type: 'number',
      };
    }

    // String concatenation
    if (left.type === 'string' || right.type === 'string') {
      return {
        value: String(left.value) + String(right.value),
        type: 'string',
      };
    }

    return { value: 0, type: 'number' };
  }

  /**
   * @method performSubtraction
   * @description Performs subtraction of two numeric operands.
   * @param {EvaluationResult} left - Left operand.
   * @param {EvaluationResult} right - Right operand.
   * @returns {EvaluationResult} Result of subtraction.
   * @private
   */
  private performSubtraction(left: EvaluationResult, right: EvaluationResult): EvaluationResult {
    return {
      value: this.toNumber(left) - this.toNumber(right),
      type: 'number',
    };
  }

  /**
   * @method performMultiplication
   * @description Performs multiplication of two numeric operands.
   * @param {EvaluationResult} left - Left operand.
   * @param {EvaluationResult} right - Right operand.
   * @returns {EvaluationResult} Result of multiplication.
   * @private
   */
  private performMultiplication(left: EvaluationResult, right: EvaluationResult): EvaluationResult {
    return {
      value: this.toNumber(left) * this.toNumber(right),
      type: 'number',
    };
  }

  /**
   * @method performDivision
   * @description Performs division of two numeric operands. Handles division by zero.
   * @param {EvaluationResult} left - Left operand.
   * @param {EvaluationResult} right - Right operand.
   * @returns {EvaluationResult} Result of division.
   * @private
   */
  private performDivision(left: EvaluationResult, right: EvaluationResult): EvaluationResult {
    const rightNum = this.toNumber(right);
    if (rightNum === 0) {
      return { value: Infinity, type: 'number' };
    }
    return {
      value: this.toNumber(left) / rightNum,
      type: 'number',
    };
  }

  /**
   * @method performModulo
   * @description Performs modulo operation of two numeric operands. Handles division by zero.
   * @param {EvaluationResult} left - Left operand.
   * @param {EvaluationResult} right - Right operand.
   * @returns {EvaluationResult} Result of modulo.
   * @private
   */
  private performModulo(left: EvaluationResult, right: EvaluationResult): EvaluationResult {
    const rightNum = this.toNumber(right);
    if (rightNum === 0) {
      return { value: NaN, type: 'number' };
    }
    return {
      value: this.toNumber(left) % rightNum,
      type: 'number',
    };
  }

  /**
   * @method performExponentiation
   * @description Performs exponentiation of two numeric operands.
   * @param {EvaluationResult} left - Base operand.
   * @param {EvaluationResult} right - Exponent operand.
   * @returns {EvaluationResult} Result of exponentiation.
   * @private
   */
  private performExponentiation(left: EvaluationResult, right: EvaluationResult): EvaluationResult {
    return {
      value: this.toNumber(left) ** this.toNumber(right),
      type: 'number',
    };
  }

  /**
   * @method performEquality
   * @description Performs strict equality comparison (===).
   * @param {EvaluationResult} left - Left operand.
   * @param {EvaluationResult} right - Right operand.
   * @returns {EvaluationResult} Boolean result of equality.
   * @private
   */
  private performEquality(left: EvaluationResult, right: EvaluationResult): EvaluationResult {
    return {
      value: left.value === right.value,
      type: 'boolean',
    };
  }

  /**
   * @method performInequality
   * @description Performs strict inequality comparison (!==).
   * @param {EvaluationResult} left - Left operand.
   * @param {EvaluationResult} right - Right operand.
   * @returns {EvaluationResult} Boolean result of inequality.
   * @private
   */
  private performInequality(left: EvaluationResult, right: EvaluationResult): EvaluationResult {
    return {
      value: left.value !== right.value,
      type: 'boolean',
    };
  }

  /**
   * @method performLessThan
   * @description Performs less than comparison (<).
   * @param {EvaluationResult} left - Left operand.
   * @param {EvaluationResult} right - Right operand.
   * @returns {EvaluationResult} Boolean result.
   * @private
   */
  private performLessThan(left: EvaluationResult, right: EvaluationResult): EvaluationResult {
    return {
      value: this.toNumber(left) < this.toNumber(right),
      type: 'boolean',
    };
  }

  /**
   * @method performLessThanOrEqual
   * @description Performs less than or equal to comparison (<=).
   * @param {EvaluationResult} left - Left operand.
   * @param {EvaluationResult} right - Right operand.
   * @returns {EvaluationResult} Boolean result.
   * @private
   */
  private performLessThanOrEqual(
    left: EvaluationResult,
    right: EvaluationResult
  ): EvaluationResult {
    return {
      value: this.toNumber(left) <= this.toNumber(right),
      type: 'boolean',
    };
  }

  /**
   * @method performGreaterThan
   * @description Performs greater than comparison (>).
   * @param {EvaluationResult} left - Left operand.
   * @param {EvaluationResult} right - Right operand.
   * @returns {EvaluationResult} Boolean result.
   * @private
   */
  private performGreaterThan(left: EvaluationResult, right: EvaluationResult): EvaluationResult {
    return {
      value: this.toNumber(left) > this.toNumber(right),
      type: 'boolean',
    };
  }

  /**
   * @method performGreaterThanOrEqual
   * @description Performs greater than or equal to comparison (>=).
   * @param {EvaluationResult} left - Left operand.
   * @param {EvaluationResult} right - Right operand.
   * @returns {EvaluationResult} Boolean result.
   * @private
   */
  private performGreaterThanOrEqual(
    left: EvaluationResult,
    right: EvaluationResult
  ): EvaluationResult {
    return {
      value: this.toNumber(left) >= this.toNumber(right),
      type: 'boolean',
    };
  }

  /**
   * @method performLogicalAnd
   * @description Performs logical AND operation (&&).
   * @param {EvaluationResult} left - Left operand.
   * @param {EvaluationResult} right - Right operand.
   * @returns {EvaluationResult} Boolean result.
   * @private
   */
  private performLogicalAnd(left: EvaluationResult, right: EvaluationResult): EvaluationResult {
    return {
      value: this.toBoolean(left) && this.toBoolean(right),
      type: 'boolean',
    };
  }

  /**
   * @method performLogicalOr
   * @description Performs logical OR operation (||).
   * @param {EvaluationResult} left - Left operand.
   * @param {EvaluationResult} right - Right operand.
   * @returns {EvaluationResult} Boolean result.
   * @private
   */
  private performLogicalOr(left: EvaluationResult, right: EvaluationResult): EvaluationResult {
    return {
      value: this.toBoolean(left) || this.toBoolean(right),
      type: 'boolean',
    };
  }
}
