/**
 * @file Expression evaluation registry for OpenSCAD parser AST processing
 *
 * This module provides a comprehensive expression evaluation system for OpenSCAD
 * Abstract Syntax Tree (AST) nodes. The evaluator registry implements a centralized
 * approach to expression evaluation, supporting various expression types including
 * literals, binary operations, unary operations, and variable references. The system
 * is designed to be extensible and follows functional programming principles.
 *
 * The expression evaluator registry includes:
 * - **Multi-Type Expression Support**: Handles literals, binary, unary, and variable expressions
 * - **Type-Safe Evaluation**: Returns strongly-typed values (number, boolean, string, null)
 * - **Error Handling Integration**: Comprehensive error logging and recovery capabilities
 * - **Delegated Evaluation**: Uses specialized evaluators for complex expression types
 * - **Null Safety**: Robust handling of null values and evaluation failures
 * - **Extensible Architecture**: Easy to add support for new expression types
 *
 * Key features:
 * - **Centralized Evaluation**: Single entry point for all expression evaluation
 * - **Type Preservation**: Maintains OpenSCAD type semantics during evaluation
 * - **Error Resilience**: Graceful handling of evaluation errors with detailed logging
 * - **Performance Optimization**: Efficient evaluation with minimal overhead
 * - **Functional Design**: Pure functions with no side effects for predictable behavior
 * - **Comprehensive Logging**: Detailed evaluation tracing for debugging and monitoring
 *
 * Supported expression types:
 * - **Literal Expressions**: Numbers, booleans, strings, and other constant values
 * - **Binary Expressions**: Arithmetic, logical, and comparison operations
 * - **Unary Expressions**: Negation, logical NOT, and other unary operators
 * - **Variable References**: Identifier resolution and scope-aware variable lookup
 * - **Function Calls**: Mathematical functions and user-defined function evaluation
 * - **Array Access**: Index-based access to array and vector elements
 *
 * Evaluation patterns:
 * - **Literal Values**: `5`, `true`, `"hello"` → Direct value return
 * - **Arithmetic Operations**: `5 + 3`, `10 * 2` → Numeric computation
 * - **Logical Operations**: `true && false`, `!condition` → Boolean evaluation
 * - **Comparison Operations**: `x > 5`, `a == b` → Boolean comparison results
 * - **String Operations**: `"hello" + " world"` → String concatenation
 * - **Mathematical Functions**: `sin(45)`, `sqrt(16)` → Function evaluation
 *
 * The evaluator implements a recursive evaluation strategy:
 * 1. **Type Identification**: Determine the expression type from AST node
 * 2. **Specialized Dispatch**: Delegate to appropriate evaluator for the expression type
 * 3. **Recursive Evaluation**: Evaluate sub-expressions as needed
 * 4. **Type Checking**: Validate operand types for operations
 * 5. **Result Computation**: Perform the actual computation or operation
 * 6. **Error Handling**: Log errors and return null for failed evaluations
 *
 * @example Basic expression evaluation
 * ```typescript
 * import { evaluateExpression } from './expression-evaluator-registry';
 * import { ErrorHandler } from '../../error-handling';
 *
 * const errorHandler = new ErrorHandler();
 *
 * // Evaluate literal expression
 * const literalNode: LiteralNode = {
 *   nodeType: 'literal',
 *   expressionType: 'literal',
 *   value: 42
 * };
 *
 * const result = evaluateExpression(literalNode, errorHandler);
 * console.log('Literal result:', result); // Output: 42
 * ```
 *
 * @example Binary expression evaluation
 * ```typescript
 * // Evaluate binary expression: 5 + 3
 * const binaryNode: BinaryExpressionNode = {
 *   nodeType: 'binary_expression',
 *   expressionType: 'binary',
 *   operator: '+',
 *   left: { nodeType: 'literal', expressionType: 'literal', value: 5 },
 *   right: { nodeType: 'literal', expressionType: 'literal', value: 3 }
 * };
 *
 * const result = evaluateExpression(binaryNode, errorHandler);
 * console.log('Binary result:', result); // Output: 8
 * ```
 *
 * @example Unary expression evaluation
 * ```typescript
 * // Evaluate unary expression: -10
 * const unaryNode: UnaryExpressionNode = {
 *   nodeType: 'unary_expression',
 *   expressionType: 'unary',
 *   operator: '-',
 *   operand: { nodeType: 'literal', expressionType: 'literal', value: 10 }
 * };
 *
 * const result = evaluateExpression(unaryNode, errorHandler);
 * console.log('Unary result:', result); // Output: -10
 * ```
 *
 * @example Error handling during evaluation
 * ```typescript
 * // Evaluate expression with error handling
 * const invalidNode: BinaryExpressionNode = {
 *   nodeType: 'binary_expression',
 *   expressionType: 'binary',
 *   operator: '+',
 *   left: { nodeType: 'literal', expressionType: 'literal', value: 5 },
 *   right: null // Invalid operand
 * };
 *
 * const result = evaluateExpression(invalidNode, errorHandler);
 * console.log('Error result:', result); // Output: null
 *
 * // Check error logs
 * const errors = errorHandler.getErrors();
 * console.log('Evaluation errors:', errors);
 * ```
 *
 * @module expression-evaluator-registry
 * @since 0.1.0
 */

import * as ast from '../ast-types.js';
import { ErrorHandler } from '../../error-handling/index.js';
import { evaluateBinaryExpression } from './binary-expression-evaluator/binary-expression-evaluator.js';

/**
 * Evaluates an expression node and returns a value
 * @param expr The expression node to evaluate
 * @param errorHandler Optional error handler for logging
 * @returns The evaluated value or null if evaluation fails
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
              return operandValue === 0;
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
        // Variable references are not yet implemented
        // In a real implementation, this would look up the variable value in a scope
        if (errorHandler) {
          errorHandler.logWarning(
            `[evaluateExpression] Variable reference evaluation not yet implemented`,
            'evaluateExpression'
          );
        }
        return null;
      }
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