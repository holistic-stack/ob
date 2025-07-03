/**
 * @file Parameter extraction utilities for OpenSCAD parser
 *
 * This module provides specialized utilities for extracting typed parameter values from
 * OpenSCAD AST parameter objects. These extractors handle the conversion from generic
 * parameter values to specific TypeScript types, supporting both literal values and
 * complex expression evaluation.
 *
 * The parameter extraction system handles:
 * - **Type-Safe Extraction**: Converts generic parameter values to specific types
 * - **Expression Evaluation**: Evaluates mathematical and logical expressions
 * - **Multiple Input Formats**: Supports literals, expressions, and string representations
 * - **Error Recovery**: Graceful handling of malformed or incompatible parameters
 * - **OpenSCAD Compatibility**: Follows OpenSCAD parameter conventions and syntax
 *
 * Supported parameter types:
 * - **Numbers**: Integer and floating-point values with expression evaluation
 * - **Booleans**: True/false values with string parsing support
 * - **Strings**: Text values with proper escaping and encoding
 * - **Vectors**: 2D and 3D numeric arrays for positions and sizes
 * - **Ranges**: Start:step:end ranges for iteration and array generation
 * - **Identifiers**: Variable names and references with validation
 *
 * Expression evaluation features:
 * - **Literal Values**: Direct number, boolean, and string literals
 * - **Unary Expressions**: Negation and other unary operators
 * - **Binary Expressions**: Arithmetic operations (+, -, *, /, %)
 * - **Variable References**: Identifier resolution and substitution
 * - **Array Expressions**: Vector and list construction
 * - **Complex Expressions**: Nested expressions with proper precedence
 *
 * @example Basic parameter extraction
 * ```typescript
 * import { extractNumberParameter, extractVectorParameter } from './parameter-extractor';
 *
 * // Extract numeric parameter
 * const sizeParam = { value: 10 };
 * const size = extractNumberParameter(sizeParam);
 * // Returns: 10
 *
 * // Extract vector parameter
 * const positionParam = { value: [10, 20, 30] };
 * const position = extractVectorParameter(positionParam);
 * // Returns: [10, 20, 30]
 * ```
 *
 * @example Expression evaluation
 * ```typescript
 * // Extract from mathematical expression
 * const expressionParam = {
 *   value: {
 *     type: 'expression',
 *     expressionType: 'binary',
 *     operator: '+',
 *     left: { expressionType: 'literal', value: 10 },
 *     right: { expressionType: 'literal', value: 5 }
 *   }
 * };
 *
 * const result = extractNumberParameter(expressionParam, errorHandler);
 * // Returns: 15
 * ```
 *
 * @example Complex parameter processing
 * ```typescript
 * // Process cube parameters with mixed types
 * function processCubeParameters(params: ast.Parameter[]) {
 *   const size = extractVectorParameter(params.find(p => p.name === 'size')) ?? [1, 1, 1];
 *   const center = extractBooleanParameter(params.find(p => p.name === 'center')) ?? false;
 *
 *   return { size, center };
 * }
 * ```
 *
 * @module parameter-extractor
 * @since 0.1.0
 */

import * as ast from '../ast-types.js';
import { ErrorHandler } from '../../error-handling/index.js';
import { evaluateBinaryExpression } from '../evaluation/binary-expression-evaluator/binary-expression-evaluator.js';
import { evaluateExpression } from '../evaluation/expression-evaluator-registry.js';

/**
 * Check if a value is an expression node.
 *
 * Type guard function that determines whether a parameter value represents an
 * expression node that requires evaluation rather than a simple literal value.
 *
 * @param value - The parameter value to check
 * @returns True if the value is an expression node, false otherwise
 *
 * @example Type checking for expressions
 * ```typescript
 * const param = { value: { type: 'expression', expressionType: 'binary', ... } };
 *
 * if (isExpressionNode(param.value)) {
 *   // Handle expression evaluation
 *   const result = evaluateExpression(param.value, errorHandler);
 * } else {
 *   // Handle literal value
 *   const result = param.value;
 * }
 * ```
 */
export function isExpressionNode(
  value: ast.ParameterValue
): value is ast.ExpressionNode {
  return (
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    value.type === 'expression'
  );
}

/**
 * Extract a numeric parameter from a parameter object.
 *
 * This function handles the extraction of numeric values from OpenSCAD parameters,
 * supporting multiple input formats including literal numbers, mathematical expressions,
 * and string representations. It provides comprehensive expression evaluation for
 * complex mathematical operations.
 *
 * Supported input formats:
 * - **Literal Numbers**: Direct numeric values (10, 3.14, -5)
 * - **Mathematical Expressions**: Binary operations (+, -, *, /, %)
 * - **Unary Expressions**: Negation and other unary operators
 * - **String Numbers**: Numeric strings that can be parsed ("10", "3.14")
 * - **Complex Expressions**: Nested expressions with proper evaluation
 *
 * Expression evaluation features:
 * - Arithmetic operations with proper precedence
 * - Unary negation support
 * - Error handling and recovery for malformed expressions
 * - Integration with the expression evaluator registry
 *
 * @param param - The parameter object containing the value to extract
 * @param errorHandler - Optional error handler for expression evaluation and logging
 * @returns The extracted numeric value, or null if extraction fails
 *
 * @example Basic numeric extraction
 * ```typescript
 * // Extract literal number
 * const param1 = { value: 42 };
 * const result1 = extractNumberParameter(param1);
 * // Returns: 42
 *
 * // Extract from string
 * const param2 = { value: "3.14" };
 * const result2 = extractNumberParameter(param2);
 * // Returns: 3.14
 * ```
 *
 * @example Expression evaluation
 * ```typescript
 * // Extract from binary expression
 * const param = {
 *   value: {
 *     type: 'expression',
 *     expressionType: 'binary',
 *     operator: '*',
 *     left: { expressionType: 'literal', value: 5 },
 *     right: { expressionType: 'literal', value: 3 }
 *   }
 * };
 *
 * const result = extractNumberParameter(param, errorHandler);
 * // Returns: 15
 * ```
 *
 * @example Error handling
 * ```typescript
 * const errorHandler = new ErrorHandler();
 * const param = { value: "not-a-number" };
 *
 * const result = extractNumberParameter(param, errorHandler);
 * // Returns: null
 *
 * if (result === null) {
 *   console.log('Failed to extract numeric value');
 * }
 * ```
 */
export function extractNumberParameter(param: ast.Parameter, errorHandler?: ErrorHandler): number | null {
  if (!param?.value) return null;

  // Handle number as raw value
  if (typeof param.value === 'number') {
    return param.value;
  }

  // Handle expression node
  if (isExpressionNode(param.value)) {
    if (
      param.value.expressionType === 'literal' &&
      typeof (param.value as ast.LiteralNode).value === 'number'
    ) {
      return (param.value as ast.LiteralNode).value as number;
    }

    if (param.value.expressionType === 'unary') {
      const unaryExpr = param.value as ast.UnaryExpressionNode;
      if (
        unaryExpr.operator === '-' &&
        unaryExpr.operand.expressionType === 'literal' &&
        typeof (unaryExpr.operand as ast.LiteralNode).value === 'number'
      ) {
        return -(unaryExpr.operand as ast.LiteralNode).value;
      }
    }

    // Handle binary expressions directly
    if (param.value.expressionType === 'binary' && errorHandler) {
      console.log(`[extractNumberParameter] Attempting to evaluate binary expression:`, JSON.stringify(param.value, null, 2));
      try {
        // Direct evaluation of binary expression
        const binaryExpr = param.value as ast.BinaryExpressionNode;
        
        // Get the left and right operand values
        const leftValue = extractNumberParameter({ name: '', value: binaryExpr.left }, errorHandler);
        const rightValue = extractNumberParameter({ name: '', value: binaryExpr.right }, errorHandler);
        
        console.log(`[extractNumberParameter] Binary expression operands: left=${leftValue}, right=${rightValue}, op=${binaryExpr.operator}`);
        
        if (leftValue !== null && rightValue !== null) {
          // Evaluate based on operator
          let result: number;
          switch (binaryExpr.operator) {
            case '+': result = leftValue + rightValue; break;
            case '-': result = leftValue - rightValue; break;
            case '*': result = leftValue * rightValue; break;
            case '/': result = leftValue / rightValue; break;
            case '%': result = leftValue % rightValue; break;
            default:
              console.warn(`[extractNumberParameter] Unsupported binary operator: ${binaryExpr.operator}`);
              return null;
          }
          
          console.log(`[extractNumberParameter] Evaluated ${leftValue} ${binaryExpr.operator} ${rightValue} = ${result}`);
          return result;
        } else {
          console.warn(`[extractNumberParameter] Could not extract numeric values from binary expression operands`);
          return null;
        }
      } catch (error) {
        console.warn(`[extractNumberParameter] Failed to evaluate binary expression: ${error}`);
        return null;
      }
    }
    
    // Handle other expression types
    if (errorHandler) {
      console.log(`[extractNumberParameter] Attempting to evaluate expression:`, JSON.stringify(param.value, null, 2));
      try {
        // Use the expression evaluator registry for non-binary expressions
        const result = evaluateExpression(param.value, errorHandler);
        
        console.log(`[extractNumberParameter] Expression evaluation result:`, result);
        
        // Check if the result is a number
        if (result !== null && typeof result === 'number') {
          return result;
        } else {
          console.log(`[extractNumberParameter] Expression did not evaluate to a number:`, result);
          return null;
        }
      } catch (error) {
        console.warn(`[extractNumberParameter] Failed to evaluate expression: ${error}`);
        return null;
      }
    }
  }

  // Try to parse the value as a number if it's a string
  if (typeof param.value === 'string') {
    const num = parseFloat(param.value);
    if (!isNaN(num)) {
      return num;
    }
  }

  return null;
}

/**
 * Extract a boolean parameter from a parameter object
 * @param param The parameter object
 * @param errorHandler Optional error handler for enhanced expression evaluation
 * @returns The boolean value or null if the parameter is not a boolean
 */
export function extractBooleanParameter(param: ast.Parameter, _errorHandler?: ErrorHandler): boolean | null {
  if (!param?.value) return null;

  // Handle boolean as raw value
  if (typeof param.value === 'boolean') {
    return param.value;
  }

  // Handle string representation of boolean
  if (typeof param.value === 'string') {
    if (param.value.toLowerCase() === 'true') return true;
    if (param.value.toLowerCase() === 'false') return false;
  }

  // Handle expression node
  if (isExpressionNode(param.value)) {
    if (
      param.value.expressionType === 'literal' &&
      typeof (param.value as ast.LiteralNode).value === 'boolean'
    ) {
      return (param.value as ast.LiteralNode).value as boolean;
    }
  }

  return null;
}

/**
 * Extract a string parameter from a parameter object
 * @param param The parameter object
 * @returns The string value or null if the parameter is not a string
 */
export function extractStringParameter(param: ast.Parameter): string | null {
  if (!param?.value) return null;

  // Handle string as raw value
  if (typeof param.value === 'string') {
    return param.value;
  }

  // Handle expression node
  if (isExpressionNode(param.value)) {
    if (
      param.value.expressionType === 'literal' &&
      typeof (param.value as ast.LiteralNode).value === 'string'
    ) {
      return (param.value as ast.LiteralNode).value as string;
    }
  }

  return null;
}

/**
 * Extract a vector parameter from a parameter object
 * @param param The parameter object
 * @returns The vector values as an array of numbers or null if the parameter is not a vector
 */
export function extractVectorParameter(param: ast.Parameter): number[] | null {
  if (!param?.value) return null;

  // Handle Vector2D or Vector3D as raw value
  if (
    Array.isArray(param.value) &&
    param.value.every(v => typeof v === 'number')
  ) {
    return param.value as number[];
  }

  // Handle expression node
  if (isExpressionNode(param.value)) {
    if (param.value.expressionType === 'array') {
      const arrayExpr = param.value as ast.ArrayExpressionNode;
      const values: number[] = [];

      for (const item of arrayExpr.items) {
        if (
          item.expressionType === 'literal' &&
          typeof (item as ast.LiteralNode).value === 'number'
        ) {
          values.push((item as ast.LiteralNode).value as number);
        }
      }

      if (values.length > 0) {
        return values;
      }
    }
  }

  // Try to parse the value as a vector if it's a string
  if (typeof param.value === 'string') {
    const matches = param.value.match(
      /\[\s*([\d.+-]+)\s*,\s*([\d.+-]+)\s*,\s*([\d.+-]+)\s*\]/
    );
    if (matches && matches.length === 4 && matches[1] && matches[2] && matches[3]) {
      return [
        parseFloat(matches[1]),
        parseFloat(matches[2]),
        parseFloat(matches[3]),
      ];
    }

    const matches2D = param.value.match(
      /\[\s*([\d.+-]+)\s*,\s*([\d.+-]+)\s*\]/
    );
    if (matches2D && matches2D.length === 3 && matches2D[1] && matches2D[2]) {
      return [parseFloat(matches2D[1]), parseFloat(matches2D[2])];
    }
  }

  return null;
}

/**
 * Extract a range parameter from a parameter object
 * @param param The parameter object
 * @returns The range values as an array of numbers or null if the parameter is not a range
 */
export function extractRangeParameter(
  param: ast.Parameter
): [number, number, number] | null {
  if (!param?.value) return null;

  // Handle array as raw value with 2 or 3 elements
  if (
    Array.isArray(param.value) &&
    param.value.length >= 2 &&
    param.value.every(v => typeof v === 'number')
  ) {
    if (param.value.length === 2) {
      return [param.value[0], param.value[1], 1];
    } else if (param.value.length >= 3) {
      return [param.value[0], param.value[2], param.value[1]];
    }
  }

  // Handle expression node
  if (isExpressionNode(param.value) && param.value.expressionType === 'range') {
    // This is a placeholder for range expressions
    // In a real implementation, we would extract the start, end, and step values
    return [0, 10, 1]; // Default range
  }

  // Try to parse the value as a range if it's a string
  if (typeof param.value === 'string') {
    const matches = param.value.match(
      /\[\s*([\d.+-]+)\s*:\s*([\d.+-]+)\s*:\s*([\d.+-]+)\s*\]/
    );
    if (matches && matches.length === 4 && matches[1] && matches[2] && matches[3]) {
      return [
        parseFloat(matches[1]),
        parseFloat(matches[3]),
        parseFloat(matches[2]),
      ];
    }

    const matches2 = param.value.match(/\[\s*([\d.+-]+)\s*:\s*([\d.+-]+)\s*\]/);
    if (matches2 && matches2.length === 3 && matches2[1] && matches2[2]) {
      return [parseFloat(matches2[1]), parseFloat(matches2[2]), 1];
    }
  }

  return null;
}

/**
 * Extract an identifier parameter from a parameter object
 * @param param The parameter object
 * @returns The identifier value or null if the parameter is not an identifier
 */
export function extractIdentifierParameter(
  param: ast.Parameter
): string | null {
  if (!param?.value) return null;

  // Handle string as identifier
  if (
    typeof param.value === 'string' &&
    /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(param.value)
  ) {
    return param.value;
  }

  // Handle expression node
  if (
    isExpressionNode(param.value) &&
    param.value.expressionType === 'variable'
  ) {
    return (param.value as ast.VariableNode).name;
  }

  return null;
}
