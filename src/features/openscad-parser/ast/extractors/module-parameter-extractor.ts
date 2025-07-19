/**
 * @file module-parameter-extractor.ts
 * @description This module provides utilities for extracting module parameters from Tree-sitter CST nodes.
 * It handles both parameters with and without default values, and supports various data types for defaults.
 *
 * @architectural_decision
 * The extraction of module parameters is encapsulated in this module to centralize the logic for parsing
 * OpenSCAD's module and function definitions. It distinguishes between named parameters and those with
 * default values, converting them into a structured `ModuleParameter` format for the AST. The `extractModuleParametersFromText`
 * function is provided specifically for testing and demonstrates a more robust text-based parsing approach for parameters
 * that handles nested structures like vectors.
 *
 * @example
 * ```typescript
 * import { extractModuleParameters } from './module-parameter-extractor';
 * import { OpenscadParser } from '../../openscad-parser';
 * import { SimpleErrorHandler } from '../../error-handling/simple-error-handler';
 * import * as TreeSitter from 'web-tree-sitter';
 *
 * async function demonstrateModuleParameterExtraction() {
 *   const errorHandler = new SimpleErrorHandler();
 *   const parser = new OpenscadParser(errorHandler);
 *   await parser.init();
 *
 *   // Example 1: Module with parameters and default values
 *   let code = 'module my_module(size = 10, color = [1, 0, 0]) {}\n';
 *   let cst = parser.parseCST(code);
 *   // Assuming the CST structure allows direct access to the parameter_list node
 *   const moduleDefinitionNode = cst?.rootNode.namedChild(0); // module_definition
 *   const paramListNode = moduleDefinitionNode?.childForFieldName('parameters');
 *
 *   if (paramListNode) {
 *     const params = extractModuleParameters(paramListNode);
 *     console.log('Extracted Module Parameters:', params);
 *     // Expected output:
 *     // [
 *     //   { name: 'size', defaultValue: 10 },
 *     //   { name: 'color', defaultValue: [1, 0, 0] }
 *     // ]
 *   }
 *
 *   // Example 2: Module with parameters without default values
 *   code = 'module another_module(width, height) {}\n';
 *   cst = parser.parseCST(code);
 *   const anotherModuleDefinitionNode = cst?.rootNode.namedChild(0);
 *   const anotherParamListNode = anotherModuleDefinitionNode?.childForFieldName('parameters');
 *
 *   if (anotherParamListNode) {
 *     const params = extractModuleParameters(anotherParamListNode);
 *     console.log('Extracted Module Parameters (no defaults):', params);
 *     // Expected output:
 *     // [
 *     //   { name: 'width' },
 *     //   { name: 'height' }
 *     // ]
 *   }
 *
 *   parser.dispose();
 * }
 *
 * demonstrateModuleParameterExtraction();
 *
 * // Example using extractModuleParametersFromText (for testing/simulated scenarios)
 * import { extractModuleParametersFromText } from './module-parameter-extractor';
 * const textParams = "a, b = 5, c = [1,2,3]";
 * const extractedFromText = extractModuleParametersFromText(textParams);
 * console.log('Extracted from text:', extractedFromText);
 * ```
 */

import type { Node as TSNode } from 'web-tree-sitter';
import type * as ast from '../ast-types.js';
import { getLocation } from '../utils/location-utils.js';

/**
 * @function extractModuleParameters
 * @description Extracts module parameters from a Tree-sitter `parameter_list` node.
 * It iterates through child `parameter` nodes, extracting their names and optional default values.
 *
 * @param {TSNode | null} paramListNode - The Tree-sitter node representing the parameter list.
 * @returns {ast.ModuleParameter[]} An array of `ModuleParameter` objects.
 */
export function extractModuleParameters(paramListNode: TSNode | null): ast.ModuleParameter[] {
  if (!paramListNode) return [];
  const moduleParameters: ast.ModuleParameter[] = [];

  // Process each parameter in the list
  for (let i = 0; i < paramListNode.namedChildCount; i++) {
    const paramNode = paramListNode.namedChild(i);
    if (!paramNode || paramNode.type !== 'parameter') continue;

    const paramName = paramNode.childForFieldName('name')?.text;
    if (!paramName) continue;

    // Check for default value
    const defaultValueNode = paramNode.childForFieldName('default_value');
    if (defaultValueNode) {
      // Parameter with default value
      const defaultValue = extractDefaultValue(defaultValueNode);
      moduleParameters.push({
        type: 'module_parameter',
        name: paramName,
        ...(defaultValue !== undefined &&
          defaultValue !== null && { defaultValue: defaultValue as ast.ASTNode }),
      });
    } else {
      // Parameter without default value
      moduleParameters.push({
        type: 'module_parameter',
        name: paramName,
      });
    }
  }
  return moduleParameters;
}

/**
 * @function extractModuleParametersFromText
 * @description Extracts module parameters from a raw text string. This function is primarily
 * intended for testing or scenarios where a CST node is not available. It manually parses
 * the string to identify parameter names and default values, including basic support for vectors.
 *
 * @param {string} paramsText - The text string containing the parameters (e.g., "a, b = 5, c = [1,2,3]").
 * @returns {ast.ModuleParameter[]} An array of `ModuleParameter` objects.
 *
 * @limitations
 * - This function performs text-based parsing and is not as robust as CST-based parsing.
 * - It has limited error handling and might not correctly parse all complex OpenSCAD expressions.
 * - Primarily used for simplified testing scenarios.
 */
export function extractModuleParametersFromText(paramsText: string): ast.ModuleParameter[] {
  if (!paramsText || paramsText.trim() === '') return [];
  const moduleParameters: ast.ModuleParameter[] = [];

  // Handle vector parameters specially
  // We need to parse the parameters more carefully to handle vectors like [10, 20, 30]
  // which would be incorrectly split by a simple split(',')

  // First, find all parameter definitions
  const params: string[] = [];
  let currentParam = '';
  let bracketCount = 0;

  for (let i = 0; i < paramsText.length; i++) {
    const char = paramsText[i];

    if (char === '[') {
      bracketCount++;
      currentParam += char;
    } else if (char === ']') {
      bracketCount--;
      currentParam += char;
    } else if (char === ',' && bracketCount === 0) {
      // Only split on commas outside of brackets
      params.push(currentParam.trim());
      currentParam = '';
    } else {
      currentParam += char;
    }
  }

  // Add the last parameter
  if (currentParam.trim()) {
    params.push(currentParam.trim());
  }

  // Process each parameter
  for (const param of params) {
    if (param.includes('=')) {
      // Parameter with default value
      const equalIndex = param.indexOf('=');
      const paramName = param.substring(0, equalIndex).trim();
      const defaultValueText = param.substring(equalIndex + 1).trim();
      const defaultValue = parseDefaultValueText(defaultValueText);
      moduleParameters.push({
        type: 'module_parameter',
        name: paramName,
        ...(defaultValue !== undefined &&
          defaultValue !== null && { defaultValue: defaultValue as ast.ASTNode }),
      });
    } else {
      // Parameter without default value
      moduleParameters.push({
        type: 'module_parameter',
        name: param,
      });
    }
  }
  return moduleParameters;
}

/**
 * @function extractDefaultValue
 * @description Extracts the default value from a Tree-sitter `default_value` node.
 * It handles various literal types (numbers, strings, booleans) and array literals.
 *
 * @param {TSNode} defaultValueNode - The Tree-sitter node representing the default value.
 * @returns {ast.ParameterValue} The extracted default value.
 */
function extractDefaultValue(defaultValueNode: TSNode): ast.ParameterValue {
  // Handle different types of default values
  switch (defaultValueNode.type) {
    case 'number':
      return parseFloat(defaultValueNode.text);

    case 'string':
      // Remove quotes from string
      return defaultValueNode.text.replace(/^["']|["']$/g, '');

    case 'true':
      return true;

    case 'false':
      return false;

    case 'array_literal':
      return extractArrayLiteral(defaultValueNode);

    case 'expression':
      return {
        type: 'expression',
        expressionType: 'literal',
        value: defaultValueNode.text,
        location: getLocation(defaultValueNode),
      };

    default:
      // For other types, return the text as is
      return defaultValueNode.text;
  }
}

/**
 * @function extractArrayLiteral
 * @description Extracts values from a Tree-sitter `array_literal` node and converts them into a vector (2D or 3D).
 * It handles numeric elements within the array.
 *
 * @param {TSNode} arrayNode - The Tree-sitter node representing the array literal.
 * @returns {ast.Vector2D | ast.Vector3D} The extracted array values as a 2D or 3D vector.
 */
function extractArrayLiteral(arrayNode: TSNode): ast.Vector2D | ast.Vector3D {
  const values: number[] = [];

  // Process each element in the array
  for (let i = 0; i < arrayNode.namedChildCount; i++) {
    const elementNode = arrayNode.namedChild(i);
    if (!elementNode) continue;

    if (elementNode.type === 'number') {
      values.push(parseFloat(elementNode.text));
    } else if (elementNode.type === 'expression' && elementNode.text.match(/^-?\d+(\.\d+)?$/)) {
      // Handle expressions that are just numbers
      values.push(parseFloat(elementNode.text));
    }
  }

  // Return as Vector2D or Vector3D based on the number of elements
  if (values.length === 2) {
    return values as ast.Vector2D;
  } else if (values.length >= 3) {
    return [values[0], values[1], values[2]] as ast.Vector3D;
  } else if (values.length === 1) {
    // If only one value, duplicate it for x, y, z
    return [values[0], values[0], values[0]] as ast.Vector3D;
  } else {
    // Default to [0, 0, 0] if no valid values found
    return [0, 0, 0] as ast.Vector3D;
  }
}

/**
 * @function parseDefaultValueText
 * @description Parses a text string representing a default value into an `ast.ParameterValue`.
 * This is a helper function used by `extractModuleParametersFromText`.
 *
 * @param {string} defaultValueText - The text string to parse.
 * @returns {ast.ParameterValue} The parsed default value.
 */
function parseDefaultValueText(defaultValueText: string): ast.ParameterValue {
  // Try to parse as number
  if (!Number.isNaN(Number(defaultValueText))) {
    return Number(defaultValueText);
  }

  // Check for boolean values
  if (defaultValueText === 'true') {
    return true;
  } else if (defaultValueText === 'false') {
    return false;
  }

  // Check for string values (remove quotes)
  if (
    (defaultValueText.startsWith('"') && defaultValueText.endsWith('"')) ||
    (defaultValueText.startsWith("'") && defaultValueText.endsWith("'"))
  ) {
    return defaultValueText.substring(1, defaultValueText.length - 1);
  }

  // Check for array/vector values
  if (defaultValueText.startsWith('[') && defaultValueText.endsWith(']')) {
    const vectorText = defaultValueText.substring(1, defaultValueText.length - 1);
    const vectorParts = vectorText.split(',');
    const vectorValues = vectorParts.map((v) => parseFloat(v.trim()));

    // Filter out NaN values
    const validValues = vectorValues.filter((v) => !Number.isNaN(v));

    if (validValues.length === 2) {
      return validValues as ast.Vector2D;
    } else if (validValues.length >= 3) {
      return [validValues[0], validValues[1], validValues[2]] as ast.Vector3D;
    } else if (validValues.length === 1) {
      return [validValues[0], validValues[0], validValues[0]] as ast.Vector3D;
    }
  }

  // If all else fails, return the text as is
  return defaultValueText;
}
