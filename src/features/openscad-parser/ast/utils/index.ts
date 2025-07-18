/**
 * @file index.ts
 * @description This file serves as the barrel export for all utility functions within the AST module.
 * It consolidates and exports various helper functions for AST processing, Tree-sitter node manipulation,
 * location tracking, vector operations, and debugging.
 *
 * @architectural_decision
 * Using a barrel export for utilities provides a single, convenient entry point for accessing a wide range
 * of helper functions. This simplifies imports in other modules and promotes a cleaner, more organized
 * codebase. It also allows for easy management of the public API of the utility functions.
 *
 * @example
 * ```typescript
 * import { getLocation, findDescendantOfType, createVector3D } from './index';
 * import * as TreeSitter from 'web-tree-sitter';
 *
 * // Example: Get location of a Tree-sitter node
 * // Assuming `someNode` is a Tree-sitter Node
 * // const nodeLocation = getLocation(someNode);
 * // console.log(nodeLocation);
 *
 * // Example: Find a descendant node of a specific type
 * // Assuming `rootNode` is a Tree-sitter Tree.rootNode
 * // const functionCallNode = findDescendantOfType(rootNode, 'call_expression');
 * // if (functionCallNode) {
 * //   console.log('Found function call:', functionCallNode.text);
 * // }
 *
 * // Example: Create a 3D vector
 * const vector = createVector3D(1, 2, 3);
 * console.log('Created vector:', vector); // Expected: [1, 2, 3]
 * ```
 */

export * from './ast-evaluator';
export * from './debug-utils';
export * from './location-utils';
export * from './node-utils';
export * from './variable-utils';
export * from './vector-utils';
