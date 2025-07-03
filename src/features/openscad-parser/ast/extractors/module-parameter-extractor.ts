import { Node as TSNode } from 'web-tree-sitter';
import * as ast from '../ast-types.js';
import { getLocation } from '../utils/location-utils.js';

/**
 * Extracts module parameters from a parameter list node
 *
 * @file Defines utilities for extracting module parameters from parameter list nodes
 * @example
 * ```
 * // Extract parameters from a module definition
 * const parameters = extractModuleParameters(paramListNode);
 * ```
 */

/**
 * Extract module parameters from a parameter list node
 * @param paramListNode The parameter list node
 * @returns An array of module parameters
 */
export function extractModuleParameters(
  paramListNode: TSNode | null
): ast.ModuleParameter[] {
  if (!paramListNode) return [];

  console.log(
    `[extractModuleParameters] Processing parameter list node: ${paramListNode.text}`
  );
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
        name: paramName,
        defaultValue,
      });
    } else {
      // Parameter without default value
      moduleParameters.push({
        name: paramName,
      });
    }
  }

  console.log(
    `[extractModuleParameters] Extracted ${moduleParameters.length} parameters`
  );
  return moduleParameters;
}

/**
 * Extract module parameters from a text string (for testing purposes)
 * @param paramsText The parameters text
 * @returns An array of module parameters
 */
export function extractModuleParametersFromText(
  paramsText: string
): ast.ModuleParameter[] {
  if (!paramsText || paramsText.trim() === '') return [];

  console.log(
    `[extractModuleParametersFromText] Processing parameters text: ${paramsText}`
  );
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
        name: paramName,
        defaultValue,
      });
    } else {
      // Parameter without default value
      moduleParameters.push({
        name: param,
      });
    }
  }

  console.log(
    `[extractModuleParametersFromText] Extracted ${moduleParameters.length} parameters`
  );
  return moduleParameters;
}

/**
 * Extract a default value from a default value node
 * @param defaultValueNode The default value node
 * @returns The default value
 */
function extractDefaultValue(defaultValueNode: TSNode): ast.ParameterValue {
  console.log(
    `[extractDefaultValue] Processing default value node: ${defaultValueNode.text}`
  );

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
 * Extract an array literal from an array literal node
 * @param arrayNode The array literal node
 * @returns The array values as a Vector2D or Vector3D
 */
function extractArrayLiteral(arrayNode: TSNode): ast.Vector2D | ast.Vector3D {
  console.log(
    `[extractArrayLiteral] Processing array literal node: ${arrayNode.text}`
  );

  const values: number[] = [];

  // Process each element in the array
  for (let i = 0; i < arrayNode.namedChildCount; i++) {
    const elementNode = arrayNode.namedChild(i);
    if (!elementNode) continue;

    if (elementNode.type === 'number') {
      values.push(parseFloat(elementNode.text));
    } else if (
      elementNode.type === 'expression' &&
      elementNode.text.match(/^-?\d+(\.\d+)?$/)
    ) {
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
 * Parse a default value text string
 * @param defaultValueText The default value text
 * @returns The parsed default value
 */
function parseDefaultValueText(defaultValueText: string): ast.ParameterValue {
  console.log(
    `[parseDefaultValueText] Parsing default value text: ${defaultValueText}`
  );

  // Try to parse as number
  if (!isNaN(Number(defaultValueText))) {
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
    const vectorText = defaultValueText.substring(
      1,
      defaultValueText.length - 1
    );
    const vectorParts = vectorText.split(',');
    const vectorValues = vectorParts.map(v => parseFloat(v.trim()));

    // Filter out NaN values
    const validValues = vectorValues.filter(v => !isNaN(v));

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
