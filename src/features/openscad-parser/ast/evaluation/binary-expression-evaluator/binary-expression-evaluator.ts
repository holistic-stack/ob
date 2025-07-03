/**
 * Binary Expression Evaluator
 * 
 * This module provides a dedicated evaluator for binary expressions in OpenSCAD.
 * It follows the Single Responsibility Principle by focusing only on evaluating
 * binary expressions with different operators.
 * 
 * @module lib/openscad-parser/ast/evaluation/binary-expression-evaluator
 */

import * as ast from '../../ast-types.js';
import { ErrorHandler } from '../../../error-handling/index.js';

/**
 * Evaluates a binary expression node and returns the result
 * @param node The binary expression node to evaluate
 * @param errorHandler The error handler to use for reporting errors
 * @returns The evaluated result or null if evaluation fails
 */
export function evaluateBinaryExpression(
  node: ast.BinaryExpressionNode,
  errorHandler?: ErrorHandler
): number | boolean | null {
  try {
    // Log the evaluation attempt
    if (errorHandler) {
      errorHandler.logInfo(
        `[BinaryExpressionEvaluator] Evaluating binary expression: ${node.operator}`,
        'BinaryExpressionEvaluator.evaluate'
      );
    }

    // Get the left and right operand values
    const leftValue = evaluateExpressionNode(node.left, errorHandler);
    const rightValue = evaluateExpressionNode(node.right, errorHandler);

    // Log the operand values
    if (errorHandler) {
      errorHandler.logInfo(
        `[BinaryExpressionEvaluator] Left value: ${leftValue}, Right value: ${rightValue}`,
        'BinaryExpressionEvaluator.evaluate'
      );
    }

    // If either operand is null, we can't evaluate the expression
    if (leftValue === null || rightValue === null) {
      if (errorHandler) {
        errorHandler.logWarning(
          `[BinaryExpressionEvaluator] Cannot evaluate binary expression with null operands`,
          'BinaryExpressionEvaluator.evaluate'
        );
      }
      return null;
    }

    // Evaluate based on operator and operand types
    return evaluateOperator(node.operator, leftValue, rightValue, errorHandler);
  } catch (error) {
    // Log any errors that occur during evaluation
    if (errorHandler) {
      errorHandler.handleError(
        error instanceof Error ? error : new Error(String(error)),
        'BinaryExpressionEvaluator.evaluate'
      );
    }
    return null;
  }
}

/**
 * Evaluates an expression node and returns its value
 * @param node The expression node to evaluate
 * @param errorHandler The error handler to use for reporting errors
 * @returns The evaluated value or null if evaluation fails
 */
function evaluateExpressionNode(
  node: ast.ExpressionNode,
  errorHandler?: ErrorHandler
): number | boolean | null {
  try {
    // Handle different expression types
    switch (node.expressionType) {
      case 'literal': {
        const literalNode = node as ast.LiteralNode;
        // Check the type of the value directly
        if (typeof literalNode.value === 'number') {
          return literalNode.value;
        } else if (typeof literalNode.value === 'boolean') {
          return literalNode.value;
        }
        return null;
      }
      case 'binary':
      case 'binary_expression': {
        return evaluateBinaryExpression(node as ast.BinaryExpressionNode, errorHandler);
      }
      case 'unary':
      case 'unary_expression': {
        const unaryNode = node as ast.UnaryExpressionNode;
        const operandValue = evaluateExpressionNode(unaryNode.operand, errorHandler);
        if (operandValue === null) return null;

        switch (unaryNode.operator) {
          case '-':
            if (typeof operandValue === 'number') {
              return -operandValue;
            }
            return null;
          case '!':
            if (typeof operandValue === 'boolean') {
              return !operandValue;
            } else if (typeof operandValue === 'number') {
              return operandValue === 0;
            }
            return null;
          default:
            return null;
        }
      }
      default:
        return null;
    }
  } catch (error) {
    // Log any errors that occur during evaluation
    if (errorHandler) {
      errorHandler.handleError(
        error instanceof Error ? error : new Error(String(error)),
        'BinaryExpressionEvaluator.evaluateExpressionNode'
      );
    }
    return null;
  }
}

/**
 * Evaluates a binary operator with the given operands
 * @param operator The binary operator to evaluate
 * @param left The left operand value
 * @param right The right operand value
 * @param errorHandler The error handler to use for reporting errors
 * @returns The evaluated result or null if evaluation fails
 */
function evaluateOperator(
  operator: ast.BinaryOperator,
  left: number | boolean,
  right: number | boolean,
  errorHandler?: ErrorHandler
): number | boolean | null {
  try {
    // Handle arithmetic operators (require number operands)
    if (['+', '-', '*', '/', '%'].includes(operator)) {
      if (typeof left !== 'number' || typeof right !== 'number') {
        if (errorHandler) {
          errorHandler.logWarning(
            `[BinaryExpressionEvaluator] Arithmetic operator '${operator}' requires number operands`,
            'BinaryExpressionEvaluator.evaluateOperator'
          );
        }
        return null;
      }

      switch (operator) {
        case '+': return left + right;
        case '-': return left - right;
        case '*': return left * right;
        case '/': return left / right;
        case '%': return left % right;
      }
    }

    // Handle comparison operators (work with number operands, return boolean)
    if (['==', '!=', '<', '<=', '>', '>='].includes(operator)) {
      if (typeof left !== 'number' || typeof right !== 'number') {
        if (errorHandler) {
          errorHandler.logWarning(
            `[BinaryExpressionEvaluator] Comparison operator '${operator}' requires number operands`,
            'BinaryExpressionEvaluator.evaluateOperator'
          );
        }
        return null;
      }

      switch (operator) {
        case '==': return left === right;
        case '!=': return left !== right;
        case '<': return left < right;
        case '<=': return left <= right;
        case '>': return left > right;
        case '>=': return left >= right;
      }
    }

    // Handle logical operators (work with boolean operands, return boolean)
    if (['&&', '||'].includes(operator)) {
      if (typeof left !== 'boolean' || typeof right !== 'boolean') {
        if (errorHandler) {
          errorHandler.logWarning(
            `[BinaryExpressionEvaluator] Logical operator '${operator}' requires boolean operands`,
            'BinaryExpressionEvaluator.evaluateOperator'
          );
        }
        return null;
      }

      switch (operator) {
        case '&&': return left && right;
        case '||': return left || right;
      }
    }

    // Unsupported operator
    if (errorHandler) {
      errorHandler.logWarning(
        `[BinaryExpressionEvaluator] Unsupported binary operator: ${operator}`,
        'BinaryExpressionEvaluator.evaluateOperator'
      );
    }
    return null;
  } catch (error) {
    // Log any errors that occur during evaluation
    if (errorHandler) {
      errorHandler.handleError(
        error instanceof Error ? error : new Error(String(error)),
        'BinaryExpressionEvaluator.evaluateOperator'
      );
    }
    return null;
  }
}