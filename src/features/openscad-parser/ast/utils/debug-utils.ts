/**
 * @file Debug utilities for Tree-sitter node inspection and analysis
 *
 * This module provides debugging utilities for inspecting and analyzing Tree-sitter
 * nodes during OpenSCAD parsing and AST generation. These utilities are essential
 * for understanding the structure of the Concrete Syntax Tree (CST) and debugging
 * parsing issues.
 *
 * The debug utilities help with:
 * - **Node Structure Inspection**: Visualizing the hierarchical structure of CST nodes
 * - **Field Analysis**: Understanding named fields and their relationships
 * - **Content Examination**: Inspecting node text content and types
 * - **Tree Traversal**: Navigating parent-child relationships in the syntax tree
 * - **Development Support**: Providing clear output for parser development and debugging
 *
 * Key features:
 * - **Hierarchical Display**: Shows tree structure with proper indentation
 * - **Depth Control**: Configurable maximum depth to prevent overwhelming output
 * - **Child Limiting**: Limits number of children displayed to keep output manageable
 * - **Field Information**: Shows named fields for better understanding of node structure
 * - **Text Preview**: Displays truncated node text content for context
 * - **Named vs Regular Children**: Distinguishes between different child types
 *
 * These utilities are particularly useful when:
 * - Developing new visitor implementations
 * - Debugging parsing issues with specific OpenSCAD constructs
 * - Understanding the CST structure for new language features
 * - Investigating Tree-sitter grammar behavior
 * - Troubleshooting AST generation problems
 *
 * @example Basic node structure inspection
 * ```typescript
 * import { printNodeStructure } from './debug-utils';
 *
 * // Parse OpenSCAD code and inspect the resulting CST
 * const parser = new OpenSCADParser();
 * await parser.init();
 * const tree = parser.parseCode('cube(10);');
 *
 * // Print the structure with default settings
 * printNodeStructure(tree.rootNode);
 * // Output:
 * // Node: source_file, Text: "cube(10);"
 * //   Child 0:
 * //     Node: statement, Text: "cube(10);"
 * //       Child 0:
 * //         Node: expression_statement, Text: "cube(10);"
 * ```
 *
 * @example Customized debugging output
 * ```typescript
 * // Inspect with custom depth and child limits
 * printNodeStructure(
 *   tree.rootNode,
 *   0,        // starting depth
 *   5,        // maximum depth
 *   3         // maximum children per level
 * );
 *
 * // For complex nodes, limit output to prevent overwhelming information
 * const complexNode = tree.rootNode.child(0);
 * printNodeStructure(complexNode, 0, 2, 2);
 * ```
 *
 * @example Debugging specific parsing issues
 * ```typescript
 * // When debugging a specific construct that's not parsing correctly
 * const problematicCode = 'translate([10, 0, 0]) { cube(5); sphere(3); }';
 * const tree = parser.parseCode(problematicCode);
 *
 * // Inspect the structure to understand how Tree-sitter parsed it
 * printNodeStructure(tree.rootNode, 0, 4, 10);
 *
 * // Look for specific node types or field names
 * const moduleNode = tree.rootNode.descendantForType('module_instantiation');
 * if (moduleNode) {
 *   console.log('Found module instantiation:');
 *   printNodeStructure(moduleNode, 0, 3, 5);
 * }
 * ```
 *
 * @module debug-utils
 * @since 0.1.0
 */

import { Node as TSNode } from 'web-tree-sitter';

/**
 * Print the structure of a tree-sitter node for debugging purposes.
 *
 * This function provides a hierarchical view of a Tree-sitter node and its children,
 * showing the node types, field names, and text content. It's invaluable for
 * understanding how the Tree-sitter grammar parses OpenSCAD code and for debugging
 * issues in the parsing process.
 *
 * The output includes:
 * - Node type and truncated text content
 * - Named fields (if any) for the node
 * - Hierarchical display of child nodes with proper indentation
 * - Distinction between regular children and named children
 * - Configurable depth and child count limits to manage output size
 *
 * @param node - The Tree-sitter node to inspect and print
 * @param depth - The current depth in the tree (used for indentation, starts at 0)
 * @param maxDepth - The maximum depth to traverse (prevents infinite recursion)
 * @param maxChildren - The maximum number of children to display at each level
 *
 * @example Basic usage
 * ```typescript
 * // Print a node with default settings (depth 3, max 5 children)
 * printNodeStructure(rootNode);
 * ```
 *
 * @example Custom depth and child limits
 * ```typescript
 * // Print with deeper traversal and more children
 * printNodeStructure(rootNode, 0, 5, 10);
 *
 * // Print with shallow traversal for overview
 * printNodeStructure(rootNode, 0, 1, 3);
 * ```
 *
 * @example Debugging specific nodes
 * ```typescript
 * // Find and debug a specific node type
 * const moduleNode = rootNode.descendantForType('module_instantiation');
 * if (moduleNode) {
 *   console.log('Module instantiation structure:');
 *   printNodeStructure(moduleNode, 0, 3, 5);
 * }
 * ```
 *
 * @since 0.1.0
 */
export function printNodeStructure(
  node: TSNode,
  depth: number = 0,
  maxDepth: number = 3,
  maxChildren: number = 5
): void {
  if (!node || depth > maxDepth) {
    return;
  }

  const indent = '  '.repeat(depth);
  console.log(
    `${indent}Node: ${node.type}, Text: "${node.text.substring(0, 30)}${
      node.text.length > 30 ? '...' : ''
    }"`
  );

  // Print field names if available
  const fieldNames =
    node.type === 'ERROR'
      ? []
      : node.childCount > 0
      ? node.children
          .map(child => node.fieldNameForChild(node.children.indexOf(child)))
          .filter(Boolean)
      : [];

  if (fieldNames.length > 0) {
    console.log(`${indent}Fields: ${fieldNames.join(', ')}`);
  }

  // Print children
  const childCount = node.childCount;
  if (childCount > 0) {
    console.log(`${indent}Children (${childCount}):`);

    const childrenToPrint = Math.min(childCount, maxChildren);
    for (let i = 0; i < childrenToPrint; i++) {
      const child = node.child(i);
      if (child) {
        const fieldName = node.fieldNameForChild(i);
        if (fieldName) {
          console.log(`${indent}  Child ${i} (field: ${fieldName}):`);
        } else {
          console.log(`${indent}  Child ${i}:`);
        }
        printNodeStructure(child, depth + 2, maxDepth, maxChildren);
      }
    }

    if (childCount > maxChildren) {
      console.log(`${indent}  ... (${childCount - maxChildren} more children)`);
    }
  }

  // Print named children if different from regular children
  const namedChildCount = node.namedChildCount;
  if (namedChildCount > 0 && namedChildCount !== childCount) {
    console.log(`${indent}Named Children (${namedChildCount}):`);

    const namedChildrenToPrint = Math.min(namedChildCount, maxChildren);
    for (let i = 0; i < namedChildrenToPrint; i++) {
      const child = node.namedChild(i);
      if (child) {
        console.log(`${indent}  Named Child ${i}:`);
        printNodeStructure(child, depth + 2, maxDepth, maxChildren);
      }
    }

    if (namedChildCount > maxChildren) {
      console.log(
        `${indent}  ... (${namedChildCount - maxChildren} more named children)`
      );
    }
  }
}
