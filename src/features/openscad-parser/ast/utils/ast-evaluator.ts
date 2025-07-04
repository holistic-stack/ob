/**
 * @file AST Evaluator Utilities
 *
 * This module provides pure utility functions for evaluating AST expressions
 * that don't produce geometry but need to be resolved to values for downstream
 * processing. These utilities follow the Single Responsibility Principle (SRP)
 * by providing focused evaluation functions for specific expression types.
 *
 * Key responsibilities:
 * - Evaluate binary expressions when both operands are literals
 * - Handle special variable references
 * - Process parenthesized expressions
 * - Provide fallback evaluation for complex expressions
 *
 * @since 0.1.0
 */

import type {
  ASTNode,
  BinaryExpressionNode,
  BinaryOperator,
  ExpressionNode,
  ListComprehensionExpressionNode,
  LiteralNode,
  ParenthesizedExpressionNode,
  SpecialVariableNode,
} from '../ast-types.js';

/**
 * Result of expression evaluation
 */
export interface EvaluationResult {
  success: boolean;
  value: number | string | boolean | null;
  error?: string;
}

/**
 * Success result helper
 */
export function evaluationSuccess(value: number | string | boolean | null): EvaluationResult {
  return { success: true, value };
}

/**
 * Error result helper
 */
export function evaluationError(error: string): EvaluationResult {
  return { success: false, value: null, error };
}

/**
 * Check if an expression node represents a literal value
 */
export function isLiteralExpression(node: ExpressionNode): boolean {
  return node.expressionType === 'literal' && typeof node.value !== 'undefined';
}

/**
 * Extract literal value from an expression node
 */
export function extractLiteralValue(node: ExpressionNode): number | string | boolean | null {
  if (isLiteralExpression(node) && typeof node.value !== 'undefined') {
    return node.value;
  }
  return null;
}

/**
 * Evaluate a binary expression when both operands are literals
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
 * Perform binary arithmetic or logical operation
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
 * Evaluate a special variable reference
 * Returns 0 as a placeholder value for rendering purposes
 */
export function evaluateSpecialVariable(node: SpecialVariableNode): EvaluationResult {
  // For rendering purposes, treat all special variables as 0
  // In a full implementation, these would be resolved from the OpenSCAD context
  return evaluationSuccess(0);
}

/**
 * Evaluate a parenthesized expression by delegating to the inner expression
 */
export function evaluateParenthesizedExpression(
  node: ParenthesizedExpressionNode
): EvaluationResult {
  // For parenthesized expressions, we don't evaluate here but indicate
  // that the inner expression should be processed
  return evaluationError('Parenthesized expression should delegate to inner expression');
}

/**
 * Evaluate a list comprehension expression
 * Returns empty array as placeholder since these don't produce geometry
 */
export function evaluateListComprehension(node: ListComprehensionExpressionNode): EvaluationResult {
  // List comprehensions are complex and don't produce geometry directly
  // Return empty array as placeholder
  return evaluationSuccess(null);
}

/**
 * Check if a node represents a function literal
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
 * Process a function literal by storing reference (no geometry)
 */
export function processFunctionLiteral(node: ASTNode): EvaluationResult {
  // Function literals don't produce geometry
  // Return a reference indicator
  return evaluationSuccess(null);
}

/**
 * Attempt to evaluate any expression node to a primitive value
 * This is a fallback function that handles various expression types
 */
export function tryEvaluateExpression(node: ExpressionNode): EvaluationResult {
  switch (node.expressionType) {
    case 'literal':
      return evaluationSuccess(extractLiteralValue(node));

    case 'special_variable':
      return evaluateSpecialVariable(node as SpecialVariableNode);

    case 'binary':
    case 'binary_expression':
      return evaluateBinaryExpression(node as BinaryExpressionNode);

    case 'parenthesized_expression':
      return evaluateParenthesizedExpression(node as ParenthesizedExpressionNode);

    case 'list_comprehension_expression':
      return evaluateListComprehension(node as ListComprehensionExpressionNode);

    default:
      return evaluationError(`Cannot evaluate expression type: ${node.expressionType}`);
  }
}

/**
 * Create a default numeric value for unknown expressions
 */
export function createDefaultValue(fallbackValue: number = 0): EvaluationResult {
  return evaluationSuccess(fallbackValue);
}
