/**
 * @file expression-evaluator-registry.ts
 * @description This file provides the central registry and entry point for evaluating OpenSCAD expressions
 * within the Abstract Syntax Tree (AST). It dispatches evaluation requests to specialized evaluators
 * based on the type of expression node, ensuring a modular and extensible evaluation system.
 *
 * @architectural_decision
 * The `evaluateExpression` function acts as a facade for the entire expression evaluation subsystem.
 * It uses a `switch` statement to delegate to specific evaluation logic for different expression types
 * (e.g., literals, binary operations, unary operations). This registry pattern allows for easy addition
 * of new expression types and their corresponding evaluators without modifying existing code, adhering
 * to the Open/Closed Principle. Error handling is integrated to gracefully manage evaluation failures.
 *
 * @example
 * ```typescript
 * import { evaluateExpression } from './expression-evaluator-registry';
 * import { ErrorHandler } from '../../error-handling';
 * import type * as ast from '../ast-types';
 *
 * const errorHandler = new ErrorHandler();
 *
 * // Example 1: Evaluate a literal number
 * const literalNode: ast.LiteralNode = {
 *   type: 'expression',
 *   expressionType: 'literal',
 *   value: 42,
 *   location: { start: { line: 0, column: 0, offset: 0 }, end: { line: 0, column: 2, offset: 2 } }
 * };
 * const result1 = evaluateExpression(literalNode, errorHandler);
 * console.log(`Literal evaluation: ${result1}`); // Expected: 42
 *
 * // Example 2: Evaluate a binary addition expression
 * const binaryNode: ast.BinaryExpressionNode = {
 *   type: 'expression',
 *   expressionType: 'binary',
 *   operator: '+',
 *   left: {
 *     type: 'expression',
 *     expressionType: 'literal',
 *     value: 10,
 *     location: { start: { line: 0, column: 0, offset: 0 }, end: { line: 0, column: 2, offset: 2 } }
 *   },
 *   right: {
 *     type: 'expression',
 *     expressionType: 'literal',
 *     value: 5,
 *     location: { start: { line: 0, column: 4, offset: 4 }, end: { line: 0, column: 5, offset: 5 } }
 *   },
 *   location: { start: { line: 0, column: 0, offset: 0 }, end: { line: 0, column: 5, offset: 5 } }
 * };
 * const result2 = evaluateExpression(binaryNode, errorHandler);
 * console.log(`Binary addition evaluation: ${result2}`); // Expected: 15
 *
 * // Example 3: Evaluate a unary negation expression
 * const unaryNode: ast.UnaryExpressionNode = {
 *   type: 'expression',
 *   expressionType: 'unary',
 *   operator: '-',
 *   operand: {
 *     type: 'expression',
 *     expressionType: 'literal',
 *     value: 7,
 *     location: { start: { line: 0, column: 1, offset: 1 }, end: { line: 0, column: 2, offset: 2 } }
 *   },
 *   prefix: true,
 *   location: { start: { line: 0, column: 0, offset: 0 }, end: { line: 0, column: 2, offset: 2 } }
 * };
 * const result3 = evaluateExpression(unaryNode, errorHandler);
 * console.log(`Unary negation evaluation: ${result3}`); // Expected: -7
 *
 * // Example 4: Evaluation with an unsupported expression type (will log a warning)
 * const unsupportedNode: ast.ExpressionNode = {
 *   type: 'expression',
 *   expressionType: 'custom_expression',
 *   location: { start: { line: 0, column: 0, offset: 0 }, end: { line: 0, column: 0, offset: 0 } }
 * };
 * const result4 = evaluateExpression(unsupportedNode, errorHandler);
 * console.log(`Unsupported expression evaluation: ${result4}`); // Expected: null (and a warning in logs)
 * ```
 */

import type { ErrorHandler } from '../../error-handling/index.js';
import type * as ast from '../ast-types.js';
import { evaluateBinaryExpression } from './binary-expression-evaluator/binary-expression-evaluator.js';

/**
 * @function evaluateExpression
 * @description Evaluates a given OpenSCAD Abstract Syntax Tree (AST) expression node.
 * This function acts as the central dispatcher, delegating the evaluation to specialized
 * handlers based on the `expressionType` of the node.
 *
 * @param {ast.ExpressionNode} expr - The AST expression node to evaluate.
 * @param {ErrorHandler} [errorHandler] - An optional error handler instance for logging warnings or errors during evaluation.
 * @returns {number | boolean | string | null} The evaluated value of the expression. Returns `null` if the expression cannot be evaluated or an error occurs.
 *
 * @limitations
 * - Currently, only `literal`, `binary`, and `unary` expression types are fully supported.
 * - Variable references (`variable` type) are not yet implemented and will return `null` with a warning.
 * - Complex expression types like function calls, array access, etc., are not yet handled and will return `null` with a warning.
 * - Type coercion rules are basic; more sophisticated OpenSCAD-specific type handling might be needed for edge cases.
 */
export function evaluateExpression(
  expr: ast.ExpressionNode,
  errorHandler?: ErrorHandler
): number | boolean | string | null {
  if (!expr) return null;

  try {
    // Log the evaluation attempt
    if (errorHandler) {
      errorHandler.logInfo(
        `[evaluateExpression] Evaluating expression: ${expr.expressionType}`,
        'evaluateExpression'
      );
    }

    // Handle different expression types
    switch (expr.expressionType) {
      case 'literal': {
        const literalNode = expr as ast.LiteralNode;
        return literalNode.value;
      }
      case 'binary':
      case 'binary_expression': {
        // Use the dedicated binary expression evaluator
        const binaryExpr = expr as ast.BinaryExpressionNode;
        // NOTE: The `evaluateBinaryExpression` function here is a placeholder.
        // In a complete system, this would be an instance of `BinaryExpressionEvaluator`
        // from the `expression-evaluator.ts` module, which would take the `context`.
        // For now, it's assumed to directly return a value.
        const result = evaluateBinaryExpression(binaryExpr, errorHandler);

        if (errorHandler) {
          errorHandler.logInfo(
            `[evaluateExpression] Binary expression evaluation result: ${result}`,
            'evaluateExpression'
          );
        }

        return result;
      }
      case 'unary':
      case 'unary_expression': {
        const unaryNode = expr as ast.UnaryExpressionNode;
        const operandValue = evaluateExpression(unaryNode.operand, errorHandler);

        if (operandValue === null) {
          if (errorHandler) {
            errorHandler.logWarning(
              `[evaluateExpression] Cannot evaluate unary expression with null operand`,
              'evaluateExpression'
            );
          }
          return null;
        }

        switch (unaryNode.operator) {
          case '-':
            if (typeof operandValue === 'number') {
              return -operandValue;
            }
            break;
          case '!':
            if (typeof operandValue === 'boolean') {
              return !operandValue;
            } else if (typeof operandValue === 'number') {
              // OpenSCAD treats 0 as false, non-zero as true for logical NOT
              return operandValue === 0;
            }
            break;
          case '+': // Unary plus, typically no-op but included for completeness
            if (typeof operandValue === 'number') {
              return +operandValue;
            }
            break;
          default:
            if (errorHandler) {
              errorHandler.logWarning(
                `[evaluateExpression] Unsupported unary operator: ${unaryNode.operator}`,
                'evaluateExpression'
              );
            }
            return null;
        }

        if (errorHandler) {
          errorHandler.logWarning(
            `[evaluateExpression] Failed to evaluate unary expression with operator ${unaryNode.operator} and operand ${operandValue}`,
            'evaluateExpression'
          );
        }
        return null;
      }
      case 'variable': {
        // @TODO: Implement variable resolution from a symbol table or context
        if (errorHandler) {
          errorHandler.logWarning(
            `[evaluateExpression] Variable reference evaluation not yet implemented for variable: ${(expr as unknown as ast.VariableNode).name}`,
            'evaluateExpression'
          );
        }
        return null;
      }
      case 'function_call': {
        // @TODO: Implement function call evaluation, including built-in and user-defined functions
        if (errorHandler) {
          errorHandler.logWarning(
            `[evaluateExpression] Function call evaluation not yet implemented for function: ${(expr as ast.FunctionCallNode).functionName}`,
            'evaluateExpression'
          );
        }
        return null;
      }
      case 'vector_expression':
      case 'array': {
        // @TODO: Implement array/vector literal evaluation
        if (errorHandler) {
          errorHandler.logWarning(
            `[evaluateExpression] Array/Vector expression evaluation not yet implemented.`,
            'evaluateExpression'
          );
        }
        return null;
      }
      case 'conditional': {
        // @TODO: Implement conditional (ternary) expression evaluation
        if (errorHandler) {
          errorHandler.logWarning(
            `[evaluateExpression] Conditional expression evaluation not yet implemented.`,
            'evaluateExpression'
          );
        }
        return null;
      }
      // Add more cases for other expression types as they are implemented
      default: {
        // Other expression types are not yet implemented
        if (errorHandler) {
          errorHandler.logWarning(
            `[evaluateExpression] Unsupported expression type: ${expr.expressionType}`,
            'evaluateExpression'
          );
        }
        return null;
      }
    }
  } catch (error) {
    // Log any errors that occur during evaluation
    if (errorHandler) {
      errorHandler.handleError(
        error instanceof Error ? error : new Error(String(error)),
        'evaluateExpression'
      );
    }
    return null;
  }
}
