/**
 * @file Variable handling utilities for OpenSCAD parser
 *
 * This module provides utilities for working with variables in OpenSCAD code during AST generation.
 * It handles variable name validation, special variable detection, and variable extraction from
 * Tree-sitter nodes. Variables are fundamental to OpenSCAD's parametric design capabilities.
 *
 * OpenSCAD supports several types of variables:
 * - User-defined variables: `myVar`, `size`, `angle`
 * - Special variables: `$fn`, `$fa`, `$fs`, `$t`, `$vpr`, etc.
 * - Built-in constants and functions
 * - Module parameters and local variables
 *
 * Key features:
 * - Variable name validation according to OpenSCAD syntax rules
 * - Special variable detection and classification
 * - Safe variable name extraction from Tree-sitter nodes
 * - Built-in special variable registry and lookup
 * - Type-safe variable handling with proper error checking
 *
 * Variable naming rules in OpenSCAD:
 * - Must start with a letter (a-z, A-Z) or underscore (_)
 * - Can contain letters, digits (0-9), and underscores
 * - Special variables start with dollar sign ($)
 * - Case-sensitive naming
 *
 * @example Variable validation
 * ```typescript
 * import { isValidVariableName, isSpecialVariable } from './variable-utils';
 *
 * // Validate user variable names
 * const isValid = isValidVariableName('myVariable'); // Returns: true
 * const isInvalid = isValidVariableName('123invalid'); // Returns: false
 *
 * // Check for special variables
 * const isSpecial = isSpecialVariable(dollarFnNode); // Returns: true for $fn
 * ```
 *
 * @example Variable extraction
 * ```typescript
 * import { extractVariableName, isBuiltinSpecialVariable } from './variable-utils';
 *
 * // Extract variable name from identifier node
 * const varName = extractVariableName(identifierNode); // Returns: "myVar"
 *
 * // Check if it's a built-in special variable
 * const isBuiltin = isBuiltinSpecialVariable('$fn'); // Returns: true
 * ```
 *
 * @example OpenSCAD usage scenarios
 * ```typescript
 * // For OpenSCAD code: cube(size)
 * const varName = extractVariableName(sizeNode); // Returns: "size"
 *
 * // For OpenSCAD code: cylinder($fn=20, r=5)
 * const specialVar = extractVariableName(fnNode); // Returns: "$fn"
 * const isSpecial = isBuiltinSpecialVariable('$fn'); // Returns: true
 * ```
 *
 * @module openscad-parser/ast/utils/variable-utils
 * @since 0.1.0
 */

import { Node as TSNode } from 'web-tree-sitter';

/**
 * Determines if a Tree-sitter node represents a special OpenSCAD variable.
 *
 * Special variables in OpenSCAD are system variables that start with a dollar sign ($)
 * and control various aspects of rendering and behavior. This function identifies
 * nodes that contain such variables by checking the text content and validating
 * the variable name format.
 *
 * Special variables include:
 * - Resolution control: `$fn`, `$fa`, `$fs`
 * - Animation: `$t`
 * - Viewport: `$vpr`, `$vpt`, `$vpd`
 * - Module system: `$children`
 * - User-defined special variables
 *
 * @param node - The Tree-sitter node to examine
 * @returns True if the node represents a special variable, false otherwise
 *
 * @example Detecting special variables
 * ```typescript
 * // For OpenSCAD code: cylinder($fn=20, r=5)
 * const isSpecial = isSpecialVariable(fnNode); // Returns: true
 *
 * // For OpenSCAD code: cube(size)
 * const isNormal = isSpecialVariable(sizeNode); // Returns: false
 * ```
 *
 * @example Usage in AST generation
 * ```typescript
 * if (isSpecialVariable(parameterNode)) {
 *   // Handle special variable with system-specific logic
 *   return processSpecialVariable(parameterNode);
 * } else {
 *   // Handle regular user variable
 *   return processUserVariable(parameterNode);
 * }
 * ```
 *
 * @since 0.1.0
 * @category Variable Detection
 */
export function isSpecialVariable(node: TSNode): boolean {
  const text = node.text.trim();
  return text.startsWith('$') && /^\$[a-zA-Z_][a-zA-Z0-9_]*$/.test(text);
}

/**
 * Extract variable name from an identifier node
 * @param node The identifier node
 * @returns The variable name or null if invalid
 */
export function extractVariableName(node: TSNode): string | null {
  if (node.type !== 'identifier') {
    return null;
  }

  const name = node.text.trim();
  return name.length > 0 ? name : null;
}

/**
 * Check if a variable name is valid according to OpenSCAD rules
 * @param name The variable name to validate
 * @returns True if the name is valid
 */
export function isValidVariableName(name: string): boolean {
  // OpenSCAD variable names must start with letter or underscore,
  // followed by letters, digits, or underscores
  return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name);
}

/**
 * Get the list of built-in OpenSCAD special variables
 * @returns Array of special variable names
 */
export function getSpecialVariables(): string[] {
  return [
    '$fn',    // Number of fragments for circles
    '$fa',    // Minimum angle for fragments
    '$fs',    // Minimum size for fragments
    '$t',     // Animation time variable
    '$vpr',   // Viewport rotation
    '$vpt',   // Viewport translation
    '$vpd',   // Viewport distance
    '$children', // Number of child modules
  ];
}

/**
 * Check if a variable is a built-in special variable
 * @param name The variable name to check
 * @returns True if it's a built-in special variable
 */
export function isBuiltinSpecialVariable(name: string): boolean {
  return getSpecialVariables().includes(name);
}
