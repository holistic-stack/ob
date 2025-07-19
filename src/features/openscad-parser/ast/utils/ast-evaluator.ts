/**
 * @file ast-evaluator.ts
 * @description This module provides pure utility functions for evaluating AST expressions
 * that do not directly produce geometry but need to be resolved to values for downstream
 * processing (e.g., for parameter evaluation, conditional logic). These utilities adhere
 * to the Single Responsibility Principle (SRP) by offering focused evaluation functions
 * for specific expression types.
 *
 * @architectural_decision
 * The evaluation logic is separated into pure functions to ensure predictability and testability.
 * This module focuses on evaluating expressions that can be resolved to a primitive value (number, string, boolean).
 * Complex evaluation scenarios (like variable lookups, function calls, or side effects) are handled by a broader
 * expression evaluation system (e.g., `ExpressionEvaluationContext` and `IExpressionEvaluator` implementations).
 * This layered approach allows for a clear distinction between simple, direct evaluations and more complex, context-dependent ones.
 *
 * @example
 * ```typescript
 * import { evaluateBinaryExpression, evaluationSuccess, evaluationError, isLiteralExpression, extractLiteralValue } from './ast-evaluator';
 * import type { BinaryExpressionNode, LiteralNode } from '../ast-types';
 *
 * // Example 1: Evaluate a simple binary expression (10 + 5)
 * const binaryExpr: BinaryExpressionNode = {
 *   type: 'expression',
 *   expressionType: 'binary',
 *   operator: '+',
 *   left: { type: 'expression', expressionType: 'literal', value: 10 },
 *   right: { type: 'expression', expressionType: 'literal', value: 5 },
 *   location: { start: { line: 0, column: 0, offset: 0 }, end: { line: 0, column: 0, offset: 0 } }
 * };
 * const result = evaluateBinaryExpression(binaryExpr);
 * console.log('Binary Expression Result:', result); // Expected: { success: true, value: 15 }
 *
 * // Example 2: Check if a node is a literal and extract its value
 * const literalNode: LiteralNode = {
 *   type: 'expression',
 *   expressionType: 'literal',
 *   value: "hello",
 *   location: { start: { line: 0, column: 0, offset: 0 }, end: { line: 0, column: 0, offset: 0 } }
 * };
 * if (isLiteralExpression(literalNode)) {
 *   const value = extractLiteralValue(literalNode);
 *   console.log('Extracted Literal Value:', value); // Expected: "hello"
 * }
 *
 * // Example 3: Error case for binary expression (non-literal operand)
 * const invalidBinaryExpr: BinaryExpressionNode = {
 *   type: 'expression',
 *   expressionType: 'binary',
 *   operator: '+',
 *   left: { type: 'expression', expressionType: 'literal', value: 10 },
 *   right: { type: 'expression', expressionType: 'variable', name: 'x' }, // Variable is not a literal
 *   location: { start: { line: 0, column: 0, offset: 0 }, end: { line: 0, column: 0, offset: 0 } }
 * };
 * const errorResult = evaluateBinaryExpression(invalidBinaryExpr);
 * console.log('Error Result:', errorResult); // Expected: { success: false, value: null, error: 'Cannot evaluate binary expression with non-literal operands' }
 * ```
 */

import type {
  ASTNode,
  BinaryExpressionNode,
  BinaryOperator,
  ExpressionNode,
  ListComprehensionExpressionNode,
  ParenthesizedExpressionNode,
  SpecialVariableNode,
} from '../ast-types.js';

/**
 * @interface EvaluationResult
 * @description Represents the outcome of an expression evaluation, indicating success or failure
 * and holding the evaluated value or an error message.
 *
 * @property {boolean} success - `true` if the evaluation was successful, `false` otherwise.
 * @property {number | string | boolean | null} value - The evaluated value if `success` is `true`, otherwise `null`.
 * @property {string} [error] - An optional error message if `success` is `false`.
 */
export interface EvaluationResult {
  success: boolean;
  value: number | string | boolean | null;
  error?: string;
}

/**
 * @function evaluationSuccess
 * @description Creates an `EvaluationResult` object indicating a successful evaluation.
 *
 * @param {number | string | boolean | null} value - The successfully evaluated value.
 * @returns {EvaluationResult} A success result object.
 */
export function evaluationSuccess(value: number | string | boolean | null): EvaluationResult {
  return { success: true, value };
}

/**
 * @function evaluationError
 * @description Creates an `EvaluationResult` object indicating a failed evaluation.
 *
 * @param {string} error - The error message describing the reason for failure.
 * @returns {EvaluationResult} An error result object.
 */
export function evaluationError(error: string): EvaluationResult {
  return { success: false, value: null, error };
}

/**
 * @function isLiteralExpression
 * @description Checks if a given `ExpressionNode` represents a literal value (number, string, or boolean).
 *
 * @param {ExpressionNode} node - The expression node to check.
 * @returns {boolean} `true` if the node is a literal expression with a defined value, `false` otherwise.
 */
export function isLiteralExpression(node: ExpressionNode): boolean {
  return node.expressionType === 'literal' && typeof node.value !== 'undefined';
}

/**
 * @function extractLiteralValue
 * @description Extracts the raw literal value from an `ExpressionNode` if it is a literal expression.
 *
 * @param {ExpressionNode} node - The expression node from which to extract the literal value.
 * @returns {number | string | boolean | null} The literal value, or `null` if the node is not a literal expression or its value is undefined.
 */
export function extractLiteralValue(node: ExpressionNode): number | string | boolean | null {
  if (isLiteralExpression(node) && typeof node.value !== 'undefined') {
    return node.value;
  }
  return null;
}

/**
 * @function evaluateBinaryExpression
 * @description Evaluates a `BinaryExpressionNode` if both its left and right operands are literal numbers.
 * It performs the specified arithmetic or logical operation.
 *
 * @param {BinaryExpressionNode} node - The binary expression node to evaluate.
 * @returns {EvaluationResult} The result of the binary operation, or an error result if operands are not numeric literals or the operation fails.
 *
 * @limitations
 * - This function only supports evaluation when both operands are simple numeric literals.
 *   For more complex scenarios (e.g., operands being variables or other expressions), a full
 *   expression evaluator (like `ExpressionEvaluationContext` and `IExpressionEvaluator` implementations)
 *   is required.
 */
export function evaluateBinaryExpression(node: BinaryExpressionNode): EvaluationResult {
  const leftValue = extractLiteralValue(node.left);
  const rightValue = extractLiteralValue(node.right);

  // Only evaluate if both operands are literal numbers
  if (typeof leftValue === 'number' && typeof rightValue === 'number') {
    try {
      const result = evaluateBinaryOperation(node.operator, leftValue, rightValue);
      return evaluationSuccess(result);
    } catch (error) {
      return evaluationError(`Binary operation failed: ${error}`);
    }
  }

  // If operands are not both numeric literals, return fallback
  return evaluationError('Cannot evaluate binary expression with non-literal operands');
}

/**
 * @function evaluateBinaryOperation
 * @description Performs a binary arithmetic or logical operation on two numeric operands.
 *
 * @param {BinaryOperator} operator - The binary operator to apply.
 * @param {number} left - The left-hand side operand.
 * @param {number} right - The right-hand side operand.
 * @returns {number | boolean} The result of the operation.
 * @throws {Error} If division or modulo by zero occurs, or if an unsupported operator is provided.
 * @private
 */
function evaluateBinaryOperation(
  operator: BinaryOperator,
  left: number,
  right: number
): number | boolean {
  switch (operator) {
    case '+':
      return left + right;
    case '-':
      return left - right;
    case '*':
      return left * right;
    case '/':
      if (right === 0) {
        throw new Error('Division by zero');
      }
      return left / right;
    case '%':
      if (right === 0) {
        throw new Error('Modulo by zero');
      }
      return left % right;
    case '==':
      return left === right;
    case '!=':
      return left !== right;
    case '<':
      return left < right;
    case '<=':
      return left <= right;
    case '>':
      return left > right;
    case '>=':
      return left >= right;
    case '&&':
      return Boolean(left) && Boolean(right);
    case '||':
      return Boolean(left) || Boolean(right);
    default:
      throw new Error(`Unsupported binary operator: ${operator}`);
  }
}

/**
 * @function evaluateSpecialVariable
 * @description Evaluates a `SpecialVariableNode`. For rendering purposes, it currently returns `0`.
 * In a full OpenSCAD implementation, these would be resolved from the global context.
 *
 * @param {SpecialVariableNode} _node - The special variable node to evaluate (parameter is currently unused).
 * @returns {EvaluationResult} A success result with a value of `0`.
 * @limitations
 * - This is a placeholder implementation. Real OpenSCAD special variables (`$fn`, `$fa`, etc.)
 *   have dynamic values that depend on the environment or configuration.
 */
export function evaluateSpecialVariable(_node: SpecialVariableNode): EvaluationResult {
  // For rendering purposes, treat all special variables as 0
  // In a full implementation, these would be resolved from the OpenSCAD context
  return evaluationSuccess(0);
}

/**
 * @function evaluateParenthesizedExpression
 * @description Handles the evaluation of a `ParenthesizedExpressionNode`.
 * This function indicates that the inner expression should be processed.
 *
 * @param {ParenthesizedExpressionNode} _node - The parenthesized expression node (parameter is currently unused).
 * @returns {EvaluationResult} An error result indicating that the inner expression needs to be evaluated.
 * @limitations
 * - This function does not perform the actual evaluation of the inner expression.
 *   It serves as a signal that the evaluation should delegate to the contained expression.
 */
export function evaluateParenthesizedExpression(
  _node: ParenthesizedExpressionNode
): EvaluationResult {
  // For parenthesized expressions, we don't evaluate here but indicate
  // that the inner expression should be processed
  return evaluationError('Parenthesized expression should delegate to inner expression');
}

/**
 * @function evaluateListComprehension
 * @description Handles the evaluation of a `ListComprehensionExpressionNode`.
 * Currently returns `null` as a placeholder, as list comprehensions do not directly produce geometry.
 *
 * @param {ListComprehensionExpressionNode} _node - The list comprehension expression node (parameter is currently unused).
 * @returns {EvaluationResult} A success result with a `null` value.
 * @limitations
 * - This is a placeholder implementation. Full evaluation of list comprehensions
 *   would involve iterating and evaluating the contained expression for each item in the range.
 */
export function evaluateListComprehension(
  _node: ListComprehensionExpressionNode
): EvaluationResult {
  // List comprehensions are complex and don't produce geometry directly
  // Return empty array as placeholder
  return evaluationSuccess(null);
}

/**
 * @function isFunctionLiteral
 * @description Checks if an `ASTNode` represents a function literal or a function call.
 *
 * @param {ASTNode} node - The AST node to check.
 * @returns {boolean} `true` if the node is a function literal or call, `false` otherwise.
 * @limitations
 * - This is a basic check and might need refinement as the AST structure for functions evolves.
 */
export function isFunctionLiteral(node: ASTNode): boolean {
  // Function literals would have a specific structure
  // For now, we check for function-like properties
  return (
    node.type === 'expression' &&
    'expressionType' in node &&
    (node.expressionType === 'function_literal' || node.expressionType === 'function_call')
  );
}

/**
 * @function processFunctionLiteral
 * @description Processes a function literal node. Currently, it returns `null` as function literals
 * do not directly produce geometry.
 *
 * @param {ASTNode} _node - The function literal node to process (parameter is currently unused).
 * @returns {EvaluationResult} A success result with a `null` value.
 * @limitations
 * - This is a placeholder. In a full implementation, this would involve storing the function definition
 *   in a symbol table for later invocation.
 */
export function processFunctionLiteral(_node: ASTNode): EvaluationResult {
  // Function literals don't produce geometry
  // Return a reference indicator
  return evaluationSuccess(null);
}

/**
 * @function tryEvaluateExpression
 * @description Attempts to evaluate various types of `ExpressionNode`s to a primitive value.
 * This serves as a fallback or a primary evaluation mechanism for simpler expressions.
 *
 * @param {ExpressionNode} node - The expression node to evaluate.
 * @returns {EvaluationResult} The result of the evaluation, or an error result if the expression type is not supported.
 * @limitations
 * - This function uses a `switch` statement to dispatch to specific evaluators.
 *   For a more extensible system, a registry pattern (like `ExpressionEvaluatorRegistry`)
 *   is preferred for managing evaluators.
 * - It directly calls other evaluation functions within this module, which might lead to
 *   tight coupling if not managed carefully.
 */
export function tryEvaluateExpression(
  node: ExpressionNode | SpecialVariableNode
): EvaluationResult {
  // Handle SpecialVariableNode which has type property instead of expressionType
  if ('type' in node && node.type === 'special_variable') {
    return evaluateSpecialVariable(node as SpecialVariableNode);
  }

  // Handle ExpressionNode which has expressionType property
  const expressionNode = node as ExpressionNode;
  switch (expressionNode.expressionType) {
    case 'literal':
      return evaluationSuccess(extractLiteralValue(expressionNode));

    case 'binary':
    case 'binary_expression':
      return evaluateBinaryExpression(expressionNode as BinaryExpressionNode);

    case 'parenthesized_expression':
      return evaluateParenthesizedExpression(
        expressionNode as unknown as ParenthesizedExpressionNode
      );

    case 'list_comprehension_expression':
      return evaluateListComprehension(
        expressionNode as unknown as ListComprehensionExpressionNode
      );

    default:
      return evaluationError(`Cannot evaluate expression type: ${expressionNode.expressionType}`);
  }
}

/**
 * @function createDefaultValue
 * @description Creates a default numeric `EvaluationResult` for unknown expressions.
 *
 * @param {number} [fallbackValue=0] - The numeric value to use as a fallback. Defaults to `0`.
 * @returns {EvaluationResult} A success result with the specified fallback value.
 */
export function createDefaultValue(fallbackValue: number = 0): EvaluationResult {
  return evaluationSuccess(fallbackValue);
}
