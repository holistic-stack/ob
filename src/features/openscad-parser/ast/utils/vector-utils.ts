/**
 * @file Vector processing utilities for OpenSCAD parser
 *
 * This module provides utilities for extracting and processing vector data from Tree-sitter CST nodes.
 * Vectors are fundamental data types in OpenSCAD, used for coordinates, dimensions, rotations, and
 * other geometric operations. This module handles the conversion from various CST node representations
 * to typed Vector2D and Vector3D objects.
 *
 * The vector extraction system supports multiple input formats:
 * - Array literals: `[1, 2, 3]`, `[x, y]`
 * - Expression nodes containing array literals
 * - Text-based vector parsing with regex patterns
 * - Unary expressions: `[-1, +2, 3]`
 * - Variable references (with placeholder values)
 * - Single values expanded to uniform vectors
 *
 * Key features:
 * - Type-safe vector creation with proper TypeScript typing
 * - Support for both 2D and 3D vectors with automatic detection
 * - Robust error handling and fallback mechanisms
 * - Comprehensive logging for debugging vector extraction issues
 * - Integration with the value extraction system
 *
 * @example Basic vector extraction
 * ```typescript
 * import { extractVector } from './vector-utils';
 *
 * // Extract 3D vector from array literal
 * const vector3D = extractVector(arrayLiteralNode); // Returns: [1, 2, 3]
 *
 * // Extract 2D vector
 * const vector2D = extractVector(twoDArrayNode); // Returns: [10, 20]
 *
 * // Handle single value (creates uniform vector)
 * const uniform = extractVector(singleValueNode); // Returns: [5, 5, 5]
 * ```
 *
 * @example OpenSCAD usage scenarios
 * ```typescript
 * // For OpenSCAD code: cube([10, 20, 30])
 * const size = extractVector(sizeNode); // Returns: [10, 20, 30]
 *
 * // For OpenSCAD code: translate([x, y, z])
 * const translation = extractVector(translationNode); // Returns vector with variable handling
 *
 * // For OpenSCAD code: rotate([0, 0, 45])
 * const rotation = extractVector(rotationNode); // Returns: [0, 0, 45]
 * ```
 *
 * @module vector-utils
 * @since 0.1.0
 */

import { Node as TSNode } from 'web-tree-sitter';
import * as ast from '../ast-types.js';
import { extractValue } from '../extractors/value-extractor.js';
import { findDescendantOfType } from './node-utils.js';

/**
 * Extracts a vector (2D or 3D) from various Tree-sitter node types.
 *
 * This is the main entry point for vector extraction, handling multiple node types
 * and extraction strategies. It automatically detects the appropriate extraction
 * method based on the node type and structure.
 *
 * The function supports several extraction strategies:
 * - Direct array literal processing for nodes like `[1, 2, 3]`
 * - Descendant search for array literals within expression nodes
 * - Text-based parsing as a fallback mechanism
 * - Automatic type detection for 2D vs 3D vectors
 *
 * @param node - The Tree-sitter node to extract vector data from
 * @returns A typed Vector2D or Vector3D object, or undefined if extraction fails
 *
 * @example Array literal extraction
 * ```typescript
 * // For OpenSCAD code: [10, 20, 30]
 * const vector = extractVector(arrayLiteralNode);
 * // Returns: [10, 20, 30] as Vector3D
 * ```
 *
 * @example Expression node extraction
 * ```typescript
 * // For complex expressions containing vectors
 * const vector = extractVector(expressionNode);
 * // Automatically finds and extracts the array literal within
 * ```
 *
 * @example Error handling
 * ```typescript
 * const vector = extractVector(node);
 * if (!vector) {
 *   console.warn('Failed to extract vector from node');
 *   return defaultVector;
 * }
 * ```
 *
 * @since 0.1.0
 * @category Vector Extraction
 */
export function extractVector(
  node: TSNode
): ast.Vector2D | ast.Vector3D | undefined {
  // const numbers: number[] = []; // Unused variable

  // Handle different node types
  if (node.type === 'array_literal') {
    // Process array_literal node
    return extractVectorFromArrayLiteral(node);
  } else if (node.type === 'expression') {
    // Try to find array_literal in expression
    const arrayLiteralNode = findDescendantOfType(node, 'array_literal');
    if (arrayLiteralNode) {
      return extractVectorFromArrayLiteral(arrayLiteralNode);
    }

    // If no array_literal found, try to extract from text
    return extractVectorFromText(node.text);
  } else if (node.type === 'accessor_expression') {
    // Try to find array_literal in accessor_expression
    const arrayLiteralNode = findDescendantOfType(node, 'array_literal');
    if (arrayLiteralNode) {
      return extractVectorFromArrayLiteral(arrayLiteralNode);
    }

    // If no array_literal found, try to extract from text
    return extractVectorFromText(node.text);
  } else {
    // For other node types, try to extract from text
    return extractVectorFromText(node.text);
  }
}

/**
 * Extracts vector data from an array_literal Tree-sitter node.
 *
 * This function processes array_literal nodes by iterating through their children
 * and extracting numeric values. It handles various child node types including
 * expressions, direct numbers, identifiers, and unary expressions.
 *
 * The extraction process:
 * 1. Iterates through all child nodes of the array literal
 * 2. Processes each child based on its type (expression, number, identifier, etc.)
 * 3. Handles unary expressions like negative numbers
 * 4. Uses placeholder values for identifiers (variables)
 * 5. Creates a typed vector from the collected numbers
 *
 * @param node - The array_literal Tree-sitter node to process
 * @returns A typed Vector2D or Vector3D object, or undefined if extraction fails
 *
 * @example Processing simple array
 * ```typescript
 * // For OpenSCAD code: [10, 20, 30]
 * const vector = extractVectorFromArrayLiteral(arrayLiteralNode);
 * // Returns: [10, 20, 30] as Vector3D
 * ```
 *
 * @example Processing array with expressions
 * ```typescript
 * // For OpenSCAD code: [x + 5, -10, 20]
 * const vector = extractVectorFromArrayLiteral(complexArrayNode);
 * // Returns vector with evaluated expressions and unary handling
 * ```
 *
 * @since 0.1.0
 * @category Vector Processing
 * @internal
 */
function extractVectorFromArrayLiteral(
  node: TSNode
): ast.Vector2D | ast.Vector3D | undefined {
  const numbers: number[] = [];
  const elementsToProcess = node.children || [];

  console.log(
    `[extractVectorFromArrayLiteral] Processing array_literal node: ${node.text.substring(
      0,
      30
    )}, children count: ${elementsToProcess.length}`
  );

  // Process each element
  for (const elementNode of elementsToProcess) {
    if (!elementNode) continue;

    console.log(
      `[extractVectorFromArrayLiteral] Iterating child: type='${
        elementNode.type
      }', text='${elementNode.text.substring(0, 20)}'`
    );

    if (elementNode.type === 'expression') {
      // Process expression node
      const value = extractValue(elementNode);
      if (typeof value === 'number') {
        numbers.push(value);
      }
    } else if (elementNode.type === 'number') {
      // Process number node directly
      const numValue = parseFloat(elementNode.text);
      if (!isNaN(numValue)) {
        numbers.push(numValue);
      }
    } else if (elementNode.type === 'identifier') {
      // For identifiers, we can't determine the value at parse time
      // For now, use 0 as a placeholder
      numbers.push(0);
    } else if (elementNode.type === 'unary_expression') {
      // Process unary expression (like -5)
      const operatorNode = elementNode.child(0);
      const operandNode = elementNode.child(1);

      if (operatorNode && operandNode && operandNode.type === 'number') {
        const operator = operatorNode.text;
        const operand = parseFloat(operandNode.text);

        if (!isNaN(operand)) {
          if (operator === '-') {
            numbers.push(-operand);
          } else if (operator === '+') {
            numbers.push(operand);
          }
        }
      }
    } else {
      console.log(
        `[extractVectorFromArrayLiteral] Skipping child of array_literal: type='${elementNode.type}'`
      );
    }
  }

  return createVectorFromNumbers(numbers, node.text);
}

/**
 * Extracts vector data from a text string using regex pattern matching.
 *
 * This function serves as a fallback mechanism when Tree-sitter node traversal
 * fails to extract vector data. It uses regular expressions to identify and
 * parse vector patterns in text format, supporting both 2D and 3D vectors.
 *
 * The function attempts extraction in order of complexity:
 * 1. First tries to match 3D vector pattern: `[x, y, z]`
 * 2. Falls back to 2D vector pattern: `[x, y]`
 * 3. Handles various number formats including decimals and signs
 *
 * This is particularly useful for handling edge cases where the CST structure
 * doesn't provide clear node boundaries or when dealing with malformed syntax
 * that still contains recognizable vector patterns.
 *
 * @param text - The text string to parse for vector patterns
 * @returns A typed Vector2D or Vector3D object, or undefined if no pattern matches
 *
 * @example 3D vector extraction
 * ```typescript
 * const vector3D = extractVectorFromText('[10.5, -20, 30]');
 * // Returns: [10.5, -20, 30] as Vector3D
 * ```
 *
 * @example 2D vector extraction
 * ```typescript
 * const vector2D = extractVectorFromText('[100, 200]');
 * // Returns: [100, 200] as Vector2D
 * ```
 *
 * @example Handling various number formats
 * ```typescript
 * const vector = extractVectorFromText('[+1.5, -2.0, 3]');
 * // Returns: [1.5, -2.0, 3] as Vector3D
 * ```
 *
 * @since 0.1.0
 * @category Vector Processing
 * @internal
 */
function extractVectorFromText(
  text: string
): ast.Vector2D | ast.Vector3D | undefined {
  console.log(
    `[extractVectorFromText] Trying to extract vector from text: ${text}`
  );

  // Try to extract 3D vector
  const matches = text.match(
    /\[\s*([\d.+-]+)\s*,\s*([\d.+-]+)\s*,\s*([\d.+-]+)\s*\]/
  );
  if (matches && matches.length === 4 && matches[1] && matches[2] && matches[3]) {
    const vector = [
      parseFloat(matches[1]),
      parseFloat(matches[2]),
      parseFloat(matches[3]),
    ];
    console.log(
      `[extractVectorFromText] Extracted 3D vector from text: ${JSON.stringify(
        vector
      )}`
    );
    return vector as ast.Vector3D;
  }

  // Try to extract 2D vector
  const matches2D = text.match(/\[\s*([\d.+-]+)\s*,\s*([\d.+-]+)\s*\]/);
  if (matches2D && matches2D.length === 3 && matches2D[1] && matches2D[2]) {
    const vector = [parseFloat(matches2D[1]), parseFloat(matches2D[2])];
    console.log(
      `[extractVectorFromText] Extracted 2D vector from text: ${JSON.stringify(
        vector
      )}`
    );
    return vector as ast.Vector2D;
  }

  return undefined;
}

/**
 * Creates a typed vector from an array of extracted numbers.
 *
 * This function takes an array of numbers and creates the appropriate vector type
 * based on the count of valid numbers. It handles various edge cases and provides
 * intelligent defaults for common scenarios.
 *
 * Vector creation logic:
 * - 1 number: Creates uniform 3D vector `[n, n, n]` (useful for cube size)
 * - 2 numbers: Creates 2D vector `[x, y]`
 * - 3 numbers: Creates 3D vector `[x, y, z]`
 * - Other counts: Returns undefined with detailed error logging
 *
 * The function filters out invalid values (null, undefined, NaN) before
 * determining the vector type, ensuring robust handling of malformed input.
 *
 * @param numbers - Array of extracted numbers (may contain invalid values)
 * @param originalText - Original text for debugging and error reporting
 * @returns A typed Vector2D or Vector3D object, or undefined if creation fails
 *
 * @example Creating 3D vector
 * ```typescript
 * const vector3D = createVectorFromNumbers([10, 20, 30], '[10, 20, 30]');
 * // Returns: [10, 20, 30] as Vector3D
 * ```
 *
 * @example Creating 2D vector
 * ```typescript
 * const vector2D = createVectorFromNumbers([100, 200], '[100, 200]');
 * // Returns: [100, 200] as Vector2D
 * ```
 *
 * @example Creating uniform vector
 * ```typescript
 * const uniform = createVectorFromNumbers([5], '5');
 * // Returns: [5, 5, 5] as Vector3D (useful for cube(5))
 * ```
 *
 * @example Error handling
 * ```typescript
 * const invalid = createVectorFromNumbers([1, NaN, null], '[1, invalid, null]');
 * // Returns: undefined (logs detailed error information)
 * ```
 *
 * @since 0.1.0
 * @category Vector Processing
 * @internal
 */
function createVectorFromNumbers(
  numbers: number[],
  originalText: string
): ast.Vector2D | ast.Vector3D | undefined {
  // Filter out null, undefined, and NaN values
  const validNumbers = numbers.filter(n => n !== null && n !== undefined && !isNaN(n));

  if (validNumbers.length === 2) {
    console.log(
      `[createVectorFromNumbers] Returning 2D vector: ${JSON.stringify([
        validNumbers[0],
        validNumbers[1],
      ])}`
    );
    return [validNumbers[0], validNumbers[1]] as ast.Vector2D;
  } else if (validNumbers.length === 3) {
    console.log(
      `[createVectorFromNumbers] Returning 3D vector: ${JSON.stringify([
        validNumbers[0],
        validNumbers[1],
        validNumbers[2],
      ])}`
    );
    return [validNumbers[0], validNumbers[1], validNumbers[2]] as ast.Vector3D;
  } else if (validNumbers.length === 1) {
    // Single value - create uniform vector
    console.log(
      `[createVectorFromNumbers] Returning uniform 3D vector: ${JSON.stringify([
        validNumbers[0],
        validNumbers[0],
        validNumbers[0],
      ])}`
    );
    return [validNumbers[0], validNumbers[0], validNumbers[0]] as ast.Vector3D;
  }

  // This warning will now be more specific about failure.
  console.warn(
    `[createVectorFromNumbers] FAILURE: Extracted ${
      validNumbers.length
    } valid numbers from '${originalText.substring(
      0,
      30
    )}'. Expected 1, 2 or 3. Valid numbers: ${JSON.stringify(validNumbers)}. Original numbers: ${JSON.stringify(numbers)}.`
  );
  return undefined;
}
