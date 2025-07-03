/**
 * @file AST utilities module exports
 *
 * This module serves as the central export point for all utility functions used in
 * OpenSCAD AST processing and Tree-sitter node manipulation. These utilities provide
 * essential functionality for working with the Concrete Syntax Tree (CST) and
 * generating the Abstract Syntax Tree (AST).
 *
 * The utility system provides:
 * - **Node Utilities**: Tree-sitter node traversal, searching, and manipulation
 * - **Location Utilities**: Source location tracking and mapping for error reporting
 * - **Vector Utilities**: Mathematical operations on 2D/3D vectors and arrays
 * - **Variable Utilities**: Variable name validation and processing
 * - **Debug Utilities**: Development and debugging support for CST inspection
 *
 * Key utility categories:
 * - **Tree Traversal**: Finding nodes by type, navigating parent-child relationships
 * - **Location Tracking**: Mapping AST nodes back to source code positions
 * - **Mathematical Operations**: Vector arithmetic, normalization, and validation
 * - **Name Processing**: Variable and identifier validation and transformation
 * - **Development Support**: Debugging tools for understanding CST structure
 *
 * @example Node utilities usage
 * ```typescript
 * import { findDescendantOfType, getChildrenOfType } from '@holistic-stack/openscad-parser/utils';
 *
 * // Find a specific node type in the tree
 * const identifierNode = findDescendantOfType(rootNode, 'identifier');
 *
 * // Get all children of a specific type
 * const statements = getChildrenOfType(blockNode, 'statement');
 * ```
 *
 * @example Location utilities usage
 * ```typescript
 * import { getLocation, createLocationFromNode } from '@holistic-stack/openscad-parser/utils';
 *
 * // Get source location for error reporting
 * const location = getLocation(node);
 * console.log(`Error at line ${location.start.line}, column ${location.start.column}`);
 * ```
 *
 * @example Vector utilities usage
 * ```typescript
 * import { normalizeVector, isValidVector, createVector3D } from '@holistic-stack/openscad-parser/utils';
 *
 * // Validate and normalize vectors
 * const vector = [10, 20, 30];
 * if (isValidVector(vector)) {
 *   const normalized = normalizeVector(vector);
 *   const vector3D = createVector3D(vector);
 * }
 * ```
 *
 * @example Variable utilities usage
 * ```typescript
 * import { isValidVariableName, normalizeVariableName } from '@holistic-stack/openscad-parser/utils';
 *
 * // Validate variable names
 * if (isValidVariableName('myVariable')) {
 *   const normalized = normalizeVariableName('myVariable');
 * }
 * ```
 *
 * @module utils
 * @since 0.1.0
 */

export * from './location-utils';
export * from './node-utils';
export * from './vector-utils';
export * from './variable-utils';
export * from './debug-utils';
