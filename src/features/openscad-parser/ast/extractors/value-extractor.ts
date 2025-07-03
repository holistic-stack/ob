/**
 * @file Value extraction utilities for OpenSCAD parser
 *
 * This module provides utilities for extracting and converting values from Tree-sitter CST nodes
 * into typed ParameterValue objects for AST generation. It handles various OpenSCAD data types
 * including numbers, strings, booleans, vectors, and complex expressions.
 *
 * The value extractor supports two extraction modes:
 * - Basic extraction: Direct value extraction from simple nodes
 * - Enhanced extraction: Expression evaluation for complex mathematical expressions
 *
 * Key features:
 * - Type-safe value extraction with proper TypeScript typing
 * - Support for all OpenSCAD primitive types (number, string, boolean, vector)
 * - Complex expression evaluation with arithmetic operations
 * - Error handling and recovery for malformed expressions
 * - Recursive extraction for nested expression hierarchies
 * - Vector and array literal processing
 *
 * @example Basic value extraction
 * ```typescript
 * import { extractValue } from './value-extractor';
 *
 * // Extract a number
 * const numberValue = extractValue(numberNode); // Returns: 42
 *
 * // Extract a string
 * const stringValue = extractValue(stringNode); // Returns: "hello"
 *
 * // Extract a vector
 * const vectorValue = extractValue(arrayNode); // Returns: [1, 2, 3]
 * ```
 *
 * @example Enhanced expression extraction
 * ```typescript
 * import { extractValueEnhanced } from './value-extractor';
 *
 * // Extract complex expression like "10 + 5 * 2"
 * const result = extractValueEnhanced(expressionNode, errorHandler);
 * // Returns: 20 (with proper operator precedence)
 * ```
 *
 * @module value-extractor
 * @since 0.1.0
 */

import { Node as TSNode } from 'web-tree-sitter';
import * as ast from '../ast-types.js';
import { findDescendantOfType } from '../utils/node-utils.js';
import { extractVector } from '../utils/vector-utils.js';
import { getLocation } from '../utils/location-utils.js';
import { ErrorHandler } from '../../error-handling/index.js';
import { evaluateExpression } from '../evaluation/expression-evaluator-registry.js';

/**
 * Determines if a Tree-sitter node represents a complex expression requiring evaluation.
 *
 * This function identifies nodes that contain mathematical or logical expressions
 * that need to be evaluated rather than simply extracted as literal values.
 * Complex expressions include arithmetic operations, logical operations, and
 * nested expressions with multiple operands.
 *
 * @param node - The Tree-sitter node to analyze
 * @returns True if the node represents a complex expression, false otherwise
 *
 * @example Detecting arithmetic expressions
 * ```typescript
 * // For OpenSCAD code: "10 + 5 * 2"
 * const isComplex = isComplexExpression(additive_expression_node);
 * // Returns: true (requires evaluation)
 *
 * // For OpenSCAD code: "42"
 * const isSimple = isComplexExpression(number_node);
 * // Returns: false (direct extraction)
 * ```
 *
 * @example Complex expression types detected
 * ```typescript
 * // These node types are considered complex when they have multiple children:
 * // - additive_expression: "a + b", "x - y"
 * // - multiplicative_expression: "a * b", "x / y"
 * // - logical_or_expression: "a || b"
 * // - logical_and_expression: "a && b"
 * // - equality_expression: "a == b", "x != y"
 * // - relational_expression: "a < b", "x >= y"
 * ```
 *
 * @since 0.1.0
 * @category Expression Analysis
 */
function isComplexExpression(node: TSNode): boolean {
  const complexTypes = new Set([
    'additive_expression',
    'multiplicative_expression',
    'exponentiation_expression',
    'logical_or_expression',
    'logical_and_expression',
    'equality_expression',
    'relational_expression',
    'binary_expression',
  ]);

  // Check if it's a complex type with multiple children (actual expression)
  if (complexTypes.has(node.type) && node.childCount > 1) {
    console.log(
      `[isComplexExpression] Detected complex expression: ${node.type} with ${node.childCount} children`
    );
    return true;
  }

  // Also check for arguments and argument nodes that might contain complex expressions
  if (node.type === 'arguments' || node.type === 'argument') {
    // Look for complex expressions in children
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (child && isComplexExpression(child)) {
        console.log(
          `[isComplexExpression] Found complex child in ${node.type}: ${child.type}`
        );
        return true;
      }
    }
  }

  return false;
}

/**
 * Enhanced value extraction with support for complex expression evaluation.
 *
 * This function extends the basic value extraction capabilities with the ability
 * to evaluate complex mathematical and logical expressions. It automatically
 * detects when a node contains expressions that require evaluation and applies
 * the appropriate evaluation strategy.
 *
 * The enhanced extractor handles:
 * - Arithmetic expressions: addition, subtraction, multiplication, division, modulo
 * - Nested expressions with proper operator precedence
 * - Binary operations with recursive operand evaluation
 * - Fallback to basic extraction for simple values
 * - Error handling and recovery for malformed expressions
 *
 * @param node - The Tree-sitter node to extract value from
 * @param errorHandler - Optional error handler for logging and error collection
 * @returns The extracted and potentially evaluated value
 *
 * @example Evaluating arithmetic expressions
 * ```typescript
 * import { extractValueEnhanced } from './value-extractor';
 *
 * // For OpenSCAD code: "10 + 5"
 * const result = extractValueEnhanced(additive_expression_node, errorHandler);
 * // Returns: 15
 *
 * // For OpenSCAD code: "2 * 3 + 4"
 * const complex = extractValueEnhanced(complex_expression_node, errorHandler);
 * // Returns: 10 (with proper precedence: (2 * 3) + 4)
 * ```
 *
 * @example Fallback to basic extraction
 * ```typescript
 * // For simple values, falls back to basic extraction
 * const number = extractValueEnhanced(number_node); // Returns: 42
 * const string = extractValueEnhanced(string_node); // Returns: "hello"
 * const vector = extractValueEnhanced(array_node);  // Returns: [1, 2, 3]
 * ```
 *
 * @example Error handling
 * ```typescript
 * const errorHandler = new SimpleErrorHandler();
 * const result = extractValueEnhanced(malformed_expression, errorHandler);
 *
 * if (errorHandler.getErrors().length > 0) {
 *   console.log('Expression evaluation errors:', errorHandler.getErrors());
 * }
 * ```
 *
 * @since 0.1.0
 * @category Value Extraction
 */
export function extractValueEnhanced(
  node: TSNode,
  errorHandler?: ErrorHandler
): ast.ParameterValue {
  console.log(
    `[extractValueEnhanced] Attempting to extract from node: type='${
      node.type
    }', text='${node.text.substring(0, 50)}'`
  );

  // Check if this is a complex expression that needs evaluation
  if (isComplexExpression(node) && errorHandler) {
    console.log(
      `[extractValueEnhanced] Detected complex expression: ${node.type}`
    );

    try {
      // Simplified direct evaluation approach for binary expressions
      const evaluateBinaryExpression = (node: TSNode): number | undefined => {
        console.log(
          `[evaluateBinaryExpression] Evaluating binary expression: ${node.type} - "${node.text}"`
        );

        // Get left, operator, and right nodes - using a simplified approach
        // This focuses on the most common structure in tree-sitter grammar
        const leftNode = node.child(0);
        const operatorNode = node.child(1);
        const rightNode = node.child(2);

        console.log(
          `[evaluateBinaryExpression] Found nodes: left=${leftNode?.text}, op=${operatorNode?.text}, right=${rightNode?.text}`
        );

        if (!leftNode || !operatorNode || !rightNode) {
          console.warn(
            `[evaluateBinaryExpression] Could not find all parts of the binary expression`
          );
          return undefined;
        }

        // Recursively evaluate operands
        let leftValue: number | undefined;
        let rightValue: number | undefined;

        // Handle nested expressions
        if (isComplexExpression(leftNode)) {
          leftValue = evaluateBinaryExpression(leftNode);
        } else {
          const extractedLeft = extractValueEnhanced(leftNode, errorHandler);
          leftValue =
            typeof extractedLeft === 'number' ? extractedLeft : undefined;
        }

        if (isComplexExpression(rightNode)) {
          rightValue = evaluateBinaryExpression(rightNode);
        } else {
          const extractedRight = extractValueEnhanced(rightNode, errorHandler);
          rightValue =
            typeof extractedRight === 'number' ? extractedRight : undefined;
        }

        console.log(
          `[evaluateBinaryExpression] Evaluated operands: left=${leftValue}, right=${rightValue}`
        );

        if (leftValue === undefined || rightValue === undefined) {
          console.warn(
            `[evaluateBinaryExpression] Could not evaluate operands`
          );
          return undefined;
        }

        // Perform the operation
        let result: number;
        switch (operatorNode.text) {
          case '+':
            result = leftValue + rightValue;
            break;
          case '-':
            result = leftValue - rightValue;
            break;
          case '*':
            result = leftValue * rightValue;
            break;
          case '/':
            result = leftValue / rightValue;
            break;
          case '%':
            result = leftValue % rightValue;
            break;
          default:
            console.warn(
              `[evaluateBinaryExpression] Unsupported operator: ${operatorNode.text}`
            );
            return undefined;
        }

        console.log(
          `[evaluateBinaryExpression] Result: ${leftValue} ${operatorNode.text} ${rightValue} = ${result}`
        );
        return result;
      };

      // Handle different expression types
      if (
        node.type === 'binary_expression' ||
        node.type === 'additive_expression' ||
        node.type === 'multiplicative_expression'
      ) {
        const result = evaluateBinaryExpression(node);
        if (result !== undefined) {
          return result;
        }
      }

      console.warn(
        `[extractValueEnhanced] Could not evaluate expression directly`
      );
      // Fall back to simple extraction
    } catch (error) {
      console.warn(
        `[extractValueEnhanced] Expression evaluation failed: ${error}`
      );
      // Fall back to simple extraction
    }
  }

  // Fall back to the original simple extraction logic
  return extractValue(node);
}

/**
 * Extracts values from Tree-sitter CST nodes and converts them to typed ParameterValue objects.
 *
 * This is the core value extraction function that handles the conversion of Tree-sitter
 * syntax nodes into typed values suitable for AST generation. It supports all OpenSCAD
 * primitive types and handles various expression hierarchies through recursive extraction.
 *
 * Supported value types:
 * - Numbers: integers and floating-point values
 * - Strings: quoted string literals with proper unescaping
 * - Booleans: true/false literals and identifiers
 * - Vectors: array literals like [1, 2, 3]
 * - Variables: identifier references
 * - Expressions: nested expression hierarchies
 *
 * The function handles Tree-sitter's expression hierarchy by recursively unwrapping
 * expression nodes until it reaches concrete values. It also provides fallback
 * mechanisms for complex expressions that may require evaluation.
 *
 * @param node - The Tree-sitter node to extract value from
 * @returns The extracted value as a ParameterValue, or undefined if extraction fails
 *
 * @example Extracting primitive values
 * ```typescript
 * import { extractValue } from './value-extractor';
 *
 * // Extract number
 * const num = extractValue(numberNode); // Returns: 42
 *
 * // Extract string
 * const str = extractValue(stringNode); // Returns: "hello world"
 *
 * // Extract boolean
 * const bool = extractValue(booleanNode); // Returns: true
 * ```
 *
 * @example Extracting complex values
 * ```typescript
 * // Extract vector
 * const vector = extractValue(arrayLiteralNode); // Returns: [1, 2, 3]
 *
 * // Extract variable reference
 * const variable = extractValue(identifierNode);
 * // Returns: { type: 'expression', expressionType: 'variable', name: 'myVar' }
 * ```
 *
 * @example Handling expression hierarchies
 * ```typescript
 * // Tree-sitter creates nested expression nodes like:
 * // expression -> conditional_expression -> logical_or_expression -> ... -> number
 *
 * const value = extractValue(expressionNode);
 * // Automatically unwraps the hierarchy to extract the final value
 * ```
 *
 * @since 0.1.0
 * @category Value Extraction
 */
export function extractValue(node: TSNode): ast.ParameterValue {
  console.log(
    `[extractValue] Attempting to extract from node: type='${
      node.type
    }', text='${node.text.substring(0, 50)}'`
  );

  switch (node.type) {
    case 'expression': {
      console.log(
        `[extractValue] Unwrapping 'expression', calling extractValue on child: type='${
          node.child(0)?.type
        }', text='${node.child(0)?.text.substring(0, 50)}'`
      );
      // Unwrap the expression and extract from its first child
      const firstChild = node.child(0);
      return node.childCount > 0 && firstChild
        ? extractValue(firstChild)
        : undefined;
    }
    case 'number': {
      const numValue = parseFloat(node.text);
      console.log(`[extractValue] Extracted number: ${numValue}`);
      return numValue;
    }
    case 'string_literal':
    case 'string': {
      // Remove quotes from string literals
      const stringValue = node.text.substring(1, node.text.length - 1);
      console.log(
        `[extractValue] Extracted string from ${node.type}: "${stringValue}"`
      );
      return stringValue;
    }
    case 'boolean':
    case 'true':
      console.log(`[extractValue] Extracted boolean: true`);
      return true;
    case 'false':
      console.log(`[extractValue] Extracted boolean: false`);
      return false;
    case 'array_literal':
      console.log(
        `[extractValue] Calling extractVector for array_literal: ${node.text.substring(
          0,
          20
        )}`
      ); // DEBUG
      return extractVector(node);
    case 'array_expression':
      console.log(
        `[extractValue] Calling extractVector for array_expression: ${node.text.substring(
          0,
          20
        )}`
      ); // DEBUG
      return extractVector(node);
    case 'vector_expression':
      console.log(
        `[extractValue] Calling extractVector for vector_expression: ${node.text.substring(
          0,
          20
        )}`
      ); // DEBUG
      return extractVector(node);
    case 'unary_expression': {
      console.log(
        `[extractValue] Processing unary_expression with ${node.childCount} children: '${node.text}'`
      );

      // Handle actual unary operators (-, +)
      if (node.childCount === 2) {
        const operatorNode = node.child(0);
        const operandNode = node.child(1);
        if (operatorNode && operandNode) {
          const operator = operatorNode.text;
          const operandValue = extractValue(operandNode);
          if (operator === '-' && typeof operandValue === 'number') {
            console.log(`[extractValue] Applied unary minus: -${operandValue}`);
            return -operandValue;
          }
          if (operator === '+' && typeof operandValue === 'number') {
            console.log(`[extractValue] Applied unary plus: +${operandValue}`);
            return operandValue;
          }
        }
      }

      // Handle single child (wrapped value)
      if (node.childCount === 1) {
        const child = node.child(0);
        if (child) {
          console.log(
            `[extractValue] Single child in unary_expression: type='${child.type}', text='${child.text}'`
          );
          return extractValue(child);
        }
      }

      // Try to parse the text directly for simple values
      const text = node.text.trim();

      // Check for numbers
      const num = parseFloat(text);
      if (!isNaN(num)) {
        console.log(
          `[extractValue] Parsed unary_expression text '${text}' as number: ${num}`
        );
        return num;
      }

      // Check for strings
      if (text.startsWith('"') && text.endsWith('"')) {
        const stringValue = text.substring(1, text.length - 1);
        console.log(
          `[extractValue] Extracted string from unary_expression: "${stringValue}"`
        );
        return stringValue;
      }

      // Check for booleans
      if (text === 'true') {
        console.log(
          `[extractValue] Extracted boolean from unary_expression: true`
        );
        return true;
      }
      if (text === 'false') {
        console.log(
          `[extractValue] Extracted boolean from unary_expression: false`
        );
        return false;
      }

      console.warn(
        `[extractValue] Unhandled unary_expression: ${node.text.substring(
          0,
          30
        )}`
      );
      return undefined;
    }
    case 'logical_or_expression':
    case 'logical_and_expression':
    case 'equality_expression':
    case 'relational_expression':
    case 'additive_expression':
    case 'multiplicative_expression':
    case 'exponentiation_expression': {
      console.log(
        `[extractValue] Processing ${node.type} with ${node.childCount} children`
      );

      // These expression types often wrap simpler values, so try to extract from children
      if (node.childCount === 1) {
        const child = node.child(0);
        if (child) {
          console.log(
            `[extractValue] Single child in ${node.type}: type='${child.type}', text='${child.text}'`
          );
          return extractValue(child);
        }
      }

      // For complex expressions with multiple children, this is likely a binary operation
      // that should be handled by the expression evaluator
      if (node.childCount > 1) {
        console.log(
          `[extractValue] Complex ${node.type} with ${node.childCount} children - attempting enhanced extraction`
        );

        // Try to use enhanced extraction if this is a complex expression
        if (isComplexExpression(node)) {
          console.log(
            `[extractValue] Using enhanced extraction for complex ${node.type}`
          );
          // Create a minimal error handler for this extraction
          const tempErrorHandler = new ErrorHandler();

          const enhancedResult = extractValueEnhanced(node, tempErrorHandler);
          if (enhancedResult !== undefined) {
            console.log(
              `[extractValue] Enhanced extraction succeeded: ${enhancedResult}`
            );
            return enhancedResult;
          }
        }
      }

      // For simple cases, try to parse as number first
      const potentialNumText = node.text.trim();
      const num = parseFloat(potentialNumText);
      if (!isNaN(num)) {
        console.log(
          `[extractValue] Parsed ${node.type} text '${potentialNumText}' as number: ${num}`
        );
        return num;
      }

      // Check for string literals in the text
      if (potentialNumText.startsWith('"') && potentialNumText.endsWith('"')) {
        const stringValue = potentialNumText.substring(
          1,
          potentialNumText.length - 1
        );
        console.log(
          `[extractValue] Extracted string from ${node.type}: "${stringValue}"`
        );
        return stringValue;
      }

      // Check for boolean literals
      if (potentialNumText === 'true') {
        console.log(`[extractValue] Extracted boolean from ${node.type}: true`);
        return true;
      }
      if (potentialNumText === 'false') {
        console.log(
          `[extractValue] Extracted boolean from ${node.type}: false`
        );
        return false;
      }

      console.warn(
        `[extractValue] Unhandled ${node.type}: '${node.text.substring(
          0,
          30
        )}' - consider using extractValueEnhanced`
      );
      return undefined;
    }
    case 'identifier': {
      if (node.text === 'true') return true;
      if (node.text === 'false') return false;
      return {
        type: 'expression',
        expressionType: 'variable',
        name: node.text,
        location: getLocation(node),
      } as ast.VariableNode;
    }
    case 'conditional_expression': {
      console.log(
        `[extractValue] Processing conditional_expression: '${node.text.substring(
          0,
          30
        )}'`
      );
      // Check if this is a wrapper for an array_literal
      if (node.text.startsWith('[') && node.text.endsWith(']')) {
        // Try to find an array_literal in the descendants
        const arrayLiteralNode = findDescendantOfType(node, 'array_literal');
        if (arrayLiteralNode) {
          console.log(
            `[extractValue] Found array_literal in conditional_expression: '${arrayLiteralNode.text.substring(
              0,
              30
            )}'`
          );
          return extractVector(arrayLiteralNode);
        }
      }

      // If not an array literal, try to extract from the first child
      if (node.childCount > 0) {
        const firstChild = node.child(0);
        if (firstChild) {
          console.log(
            `[extractValue] Trying to extract from first child of conditional_expression: '${firstChild.type}'`
          );
          return extractValue(firstChild);
        }
      }

      // Fallback to parsing as number or returning text
      const potentialCondExprText = node.text.trim();
      const condExprNum = parseFloat(potentialCondExprText);
      if (!isNaN(condExprNum)) {
        console.log(
          `[extractValue] Parsed conditional_expression text '${potentialCondExprText}' as number: ${condExprNum}`
        );
        return condExprNum;
      }
      console.warn(
        `[extractValue] Returning raw text for conditional_expression: '${node.text.substring(
          0,
          30
        )}'`
      );
      return node.text;
    }
    case 'accessor_expression':
    case 'primary_expression': {
      console.log(
        `[extractValue] Processing ${node.type} with ${node.childCount} children: '${node.text}'`
      );

      // Handle single child (wrapped value)
      if (node.childCount === 1) {
        const child = node.child(0);
        if (child) {
          console.log(
            `[extractValue] Single child in ${node.type}: type='${child.type}', text='${child.text}'`
          );
          return extractValue(child);
        }
      }

      // Try to parse the text directly for simple values
      const text = node.text.trim();

      // Check for numbers
      const num = parseFloat(text);
      if (!isNaN(num)) {
        console.log(
          `[extractValue] Parsed ${node.type} text '${text}' as number: ${num}`
        );
        return num;
      }

      // Check for strings
      if (text.startsWith('"') && text.endsWith('"')) {
        const stringValue = text.substring(1, text.length - 1);
        console.log(
          `[extractValue] Extracted string from ${node.type}: "${stringValue}"`
        );
        return stringValue;
      }

      // Check for booleans
      if (text === 'true') {
        console.log(`[extractValue] Extracted boolean from ${node.type}: true`);
        return true;
      }
      if (text === 'false') {
        console.log(
          `[extractValue] Extracted boolean from ${node.type}: false`
        );
        return false;
      }

      console.warn(
        `[extractValue] Unhandled ${node.type}: ${node.text.substring(0, 30)}`
      );
      return undefined;
    }
    case 'argument': {
      console.log(
        `[extractValue] Processing argument node with ${node.childCount} children`
      );

      // Check if this is a named argument (contains '=')
      if (node.text.includes('=')) {
        console.log(
          `[extractValue] Detected named argument in value-extractor, should be handled by extractArgument. Returning undefined.`
        );
        return undefined;
      }

      // For positional arguments, look for the actual expression inside
      for (let i = 0; i < node.childCount; i++) {
        const child = node.child(i);
        if (
          child &&
          child.type !== ',' &&
          child.type !== '(' &&
          child.type !== ')' &&
          child.type !== '='
        ) {
          console.log(
            `[extractValue] Found expression child in argument: type='${child.type}', text='${child.text}'`
          );
          return extractValue(child);
        }
      }

      console.warn(
        `[extractValue] No expression found in argument node: '${node.text}'`
      );
      return undefined;
    }
    case 'arguments': {
      console.log(
        `[extractValue] Processing arguments node with ${node.childCount} children`
      );

      // Arguments node is a container - look for the actual expression inside
      for (let i = 0; i < node.childCount; i++) {
        const child = node.child(i);
        if (
          child &&
          child.type !== ',' &&
          child.type !== '(' &&
          child.type !== ')'
        ) {
          console.log(
            `[extractValue] Found expression child in arguments: type='${child.type}', text='${child.text}'`
          );
          return extractValue(child);
        }
      }

      console.warn(
        `[extractValue] No expression found in arguments node: '${node.text}'`
      );
      return undefined;
    }
    default:
      console.warn(
        `[extractValue] Unhandled node type: '${
          node.type
        }', text: '${node.text.substring(0, 30)}'`
      );
      return undefined;
  }
}
