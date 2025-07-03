/**
 * @file Tree-sitter node utility functions for OpenSCAD parser
 *
 * This module provides utility functions for working with Tree-sitter nodes in the OpenSCAD parser.
 * These utilities help navigate the Concrete Syntax Tree (CST) structure, find specific node types,
 * and extract information from nodes during AST generation.
 *
 * The utilities are designed to work with the Tree-sitter node structure and provide common
 * operations needed throughout the parsing and AST generation process:
 * - Node traversal and searching (descendants, ancestors)
 * - Type-specific node finding and filtering
 * - Node information extraction (function names, identifiers)
 * - Tree structure navigation helpers
 *
 * These functions are used extensively by visitors and extractors to locate and process
 * specific parts of the syntax tree during AST generation.
 *
 * @example Finding specific nodes
 * ```typescript
 * import { findDescendantOfType, getFunctionName } from './node-utils';
 *
 * // Find the first array literal in a node
 * const arrayNode = findDescendantOfType(node, 'array_literal');
 *
 * // Get function name from module instantiation
 * const functionName = getFunctionName(moduleNode); // Returns: "cube"
 * ```
 *
 * @example Tree traversal
 * ```typescript
 * import { findAllDescendantsOfType, findAncestorOfType } from './node-utils';
 *
 * // Find all number nodes in an expression
 * const numbers = findAllDescendantsOfType(expressionNode, 'number');
 *
 * // Find the containing module definition
 * const moduleDefNode = findAncestorOfType(node, 'module_definition');
 * ```
 *
 * @module node-utils
 * @since 0.1.0
 */

import { Node as TSNode } from 'web-tree-sitter';

/**
 * Finds the first descendant node of a specific type using depth-first search.
 *
 * This function recursively searches through the node tree to find the first node
 * that matches the specified type. It performs a depth-first traversal, checking
 * the current node first, then recursively searching through all children.
 *
 * This is useful for finding specific syntax elements within a larger structure,
 * such as finding an array literal within an expression or locating a specific
 * identifier within a complex statement.
 *
 * @param node - The Tree-sitter node to search within
 * @param type - The node type to search for (e.g., 'array_literal', 'identifier')
 * @returns The first descendant node of the specified type, or null if not found
 *
 * @example Finding array literals
 * ```typescript
 * // For OpenSCAD code: cube([10, 20, 30])
 * const arrayNode = findDescendantOfType(cubeNode, 'array_literal');
 * // Returns the node representing [10, 20, 30]
 * ```
 *
 * @example Finding identifiers
 * ```typescript
 * // For OpenSCAD code: translate([x, y, z])
 * const identifierNode = findDescendantOfType(translateNode, 'identifier');
 * // Returns the first identifier node (likely 'x')
 * ```
 *
 * @example Checking for specific constructs
 * ```typescript
 * // Check if a module contains any function calls
 * const functionCall = findDescendantOfType(moduleNode, 'function_call');
 * if (functionCall) {
 *   console.log('Module contains function calls');
 * }
 * ```
 *
 * @since 0.1.0
 * @category Tree Traversal
 */
export function findDescendantOfType(
  node: TSNode,
  type: string
): TSNode | null {
  if (node.type === type) {
    return node;
  }

  for (let i = 0; i < node.childCount; i++) {
    const child = node.child(i);
    if (!child) continue;

    const result = findDescendantOfType(child, type);
    if (result) {
      return result;
    }
  }

  return null;
}

/**
 * Finds all descendant nodes of a specific type using depth-first search.
 *
 * This function recursively searches through the entire node tree and collects
 * all nodes that match the specified type. Unlike findDescendantOfType which
 * returns only the first match, this function returns all matching nodes in
 * the order they are encountered during depth-first traversal.
 *
 * This is particularly useful for collecting all instances of a particular
 * syntax element, such as all variable references, all function calls, or
 * all numeric literals within a complex expression or module.
 *
 * @param node - The Tree-sitter node to search within
 * @param type - The node type to search for (e.g., 'number', 'identifier')
 * @returns An array of all descendant nodes of the specified type (may be empty)
 *
 * @example Finding all numbers in an expression
 * ```typescript
 * // For OpenSCAD code: cube([10, 20, 30])
 * const numbers = findAllDescendantsOfType(cubeNode, 'number');
 * // Returns array of nodes representing: 10, 20, 30
 * ```
 *
 * @example Finding all identifiers in a module
 * ```typescript
 * // For OpenSCAD code: translate([x, y, z]) cube(size)
 * const identifiers = findAllDescendantsOfType(moduleNode, 'identifier');
 * // Returns array of nodes for: x, y, z, size
 * ```
 *
 * @example Counting specific constructs
 * ```typescript
 * // Count how many function calls are in a module
 * const functionCalls = findAllDescendantsOfType(moduleNode, 'function_call');
 * console.log(`Found ${functionCalls.length} function calls`);
 * ```
 *
 * @since 0.1.0
 * @category Tree Traversal
 */
export function findAllDescendantsOfType(node: TSNode, type: string): TSNode[] {
  const results: TSNode[] = [];

  if (node.type === type) {
    results.push(node);
  }

  for (let i = 0; i < node.childCount; i++) {
    const child = node.child(i);
    if (!child) continue;

    const childResults = findAllDescendantsOfType(child, type);
    results.push(...childResults);
  }

  return results;
}

/**
 * Finds the first ancestor node of a specific type by traversing up the tree.
 *
 * This function walks up the parent chain from the given node to find the first
 * ancestor that matches the specified type. It starts with the immediate parent
 * and continues upward until it finds a match or reaches the root of the tree.
 *
 * This is useful for finding the containing context of a node, such as finding
 * the module definition that contains a particular statement, or finding the
 * function call that contains a specific parameter.
 *
 * @param node - The Tree-sitter node to start the search from
 * @param type - The ancestor node type to search for (e.g., 'module_definition')
 * @returns The first ancestor node of the specified type, or null if not found
 *
 * @example Finding containing module
 * ```typescript
 * // For a node inside: module myModule() { cube(10); }
 * const moduleNode = findAncestorOfType(cubeNode, 'module_definition');
 * // Returns the module_definition node for myModule
 * ```
 *
 * @example Finding containing function call
 * ```typescript
 * // For a parameter inside: translate([10, 20, 30])
 * const callNode = findAncestorOfType(numberNode, 'function_call');
 * // Returns the function_call node for translate
 * ```
 *
 * @example Context-aware processing
 * ```typescript
 * // Check if we're inside a conditional block
 * const ifNode = findAncestorOfType(currentNode, 'if_statement');
 * if (ifNode) {
 *   console.log('Processing node within conditional context');
 * }
 * ```
 *
 * @since 0.1.0
 * @category Tree Traversal
 */
export function findAncestorOfType(node: TSNode, type: string): TSNode | null {
  let current = node.parent;

  while (current) {
    if (current.type === type) {
      return current;
    }
    current = current.parent;
  }

  return null;
}

/**
 * Extracts the function name from a module instantiation node.
 *
 * This function specifically handles module instantiation nodes (function calls
 * in OpenSCAD) and extracts the name of the function being called. It uses
 * Tree-sitter's field-based access to get the 'name' field from the module
 * instantiation node structure.
 *
 * Module instantiation nodes represent function calls like cube(), sphere(),
 * translate(), etc. This utility makes it easy to identify which function
 * is being called without manually parsing the node structure.
 *
 * @param node - The Tree-sitter node representing a module instantiation
 * @returns The function name as a string, or null if not a module instantiation or name not found
 *
 * @example Extracting function names
 * ```typescript
 * // For OpenSCAD code: cube(10)
 * const functionName = getFunctionName(moduleInstantiationNode);
 * // Returns: "cube"
 *
 * // For OpenSCAD code: translate([1, 2, 3])
 * const transformName = getFunctionName(translateNode);
 * // Returns: "translate"
 * ```
 *
 * @example Visitor pattern usage
 * ```typescript
 * visitModuleInstantiation(node: TSNode): ASTNode | null {
 *   const functionName = getFunctionName(node);
 *
 *   switch (functionName) {
 *     case 'cube':
 *       return this.processCube(node);
 *     case 'sphere':
 *       return this.processSphere(node);
 *     default:
 *       return this.processGenericFunction(node, functionName);
 *   }
 * }
 * ```
 *
 * @example Error handling
 * ```typescript
 * const functionName = getFunctionName(node);
 * if (!functionName) {
 *   console.warn('Could not extract function name from node');
 *   return null;
 * }
 * ```
 *
 * @since 0.1.0
 * @category Node Information
 */
export function getFunctionName(node: TSNode): string | null {
  if (node.type !== 'module_instantiation') return null;

  const nameNode = node.childForFieldName('name');
  if (!nameNode) return null;

  return nameNode.text;
}
