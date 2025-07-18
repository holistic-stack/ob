/**
 * @file ast-error-utils.ts
 * @description This module provides utility functions for creating and handling AST error nodes.
 * These functions are crucial for robust error reporting within the OpenSCAD parser, allowing
 * the AST to represent parsing failures gracefully.
 *
 * @architectural_decision
 * The `createErrorNodeInternal` function centralizes the creation of `ast.ErrorNode` objects.
 * This ensures consistency in how errors are represented in the AST, including their source location,
 * error code, and descriptive messages. By including the original CST node type and text, it aids
 * in debugging and provides more context for error recovery or reporting to the user.
 * The use of a `defaultLocation` ensures that even when a specific CST node is unavailable,
 * an error node can still be created with a fallback location.
 *
 * @example
 * ```typescript
 * import { createErrorNodeInternal, defaultLocation } from './ast-error-utils';
 * import * as TreeSitter from 'web-tree-sitter';
 * import type * as ast from '../ast-types';
 *
 * // Example 1: Creating an error node with a specific CST node
 * // Assume `mockCSTNode` is a Tree-sitter Node that caused an error
 * const mockCSTNode: TreeSitter.Node = {
 *   type: 'unrecognized_token',
 *   text: 'invalid_syntax',
 *   startPosition: { row: 5, column: 0 },
 *   endPosition: { row: 5, column: 14 },
 *   startIndex: 100,
 *   endIndex: 114,
 * } as TreeSitter.Node;
 *
 * const error1: ast.ErrorNode = createErrorNodeInternal(
 *   mockCSTNode,
 *   'Unexpected token encountered',
 *   'SYNTAX_ERROR',
 *   mockCSTNode.type,
 *   mockCSTNode.text
 * );
 * console.log('Error 1:', error1);
 * // Expected output:
 * // { type: 'error', errorCode: 'SYNTAX_ERROR', message: 'Unexpected token encountered',
 * //   originalNodeType: 'unrecognized_token', cstNodeText: 'invalid_syntax',
 * //   location: { start: { line: 5, column: 0, offset: 100 }, end: { line: 5, column: 14, offset: 114 } } }
 *
 * // Example 2: Creating an error node without a specific CST node (e.g., for a semantic error)
 * const error2: ast.ErrorNode = createErrorNodeInternal(
 *   null,
 *   'Undefined variable reference',
 *   'SEMANTIC_ERROR',
 *   'identifier',
 *   'myUndefinedVar'
 * );
 * console.log('Error 2:', error2);
 * // Expected output:
 * // { type: 'error', errorCode: 'SEMANTIC_ERROR', message: 'Undefined variable reference',
 * //   originalNodeType: 'identifier', cstNodeText: 'myUndefinedVar',
 * //   location: { start: { line: 0, column: 0, offset: 0 }, end: { line: 0, column: 0, offset: 0 } } } (using defaultLocation)
 *
 * // Example 3: Creating an error node with a cause
 * const causeError: ast.ErrorNode = createErrorNodeInternal(
 *   null, 'Inner error', 'INNER_CODE');
 * const error3: ast.ErrorNode = createErrorNodeInternal(
 *   mockCSTNode, 'Outer error', 'OUTER_CODE', undefined, undefined, causeError
 * );
 * console.log('Error 3 (with cause):', error3);
 * ```
 */

import type { Node as TSNode } from 'web-tree-sitter';
import type * as ast from '../ast-types.js';
import { getLocation } from './location-utils.js';

/**
 * @constant defaultLocation
 * @description A default `SourceLocation` object used when a more specific location cannot be determined
 * for an AST node. This ensures that all AST nodes, including error nodes, always have a location property.
 */
export const defaultLocation: ast.SourceLocation = {
  start: { line: 0, column: 0, offset: 0 },
  end: { line: 0, column: 0, offset: 0 },
};

/**
 * @function createErrorNodeInternal
 * @description Creates an `ast.ErrorNode` object, which represents a parsing or semantic error encountered
 * during the AST generation process. This function standardizes the structure of error nodes.
 *
 * @param {TSNode | null} cstNode - The Tree-sitter CST node that caused the error. Can be `null` for errors not directly tied to a CST node.
 * @param {string} message - A human-readable descriptive message for the error.
 * @param {string} errorCode - A unique code identifying the type of error (e.g., 'SYNTAX_ERROR', 'UNDEFINED_VARIABLE').
 * @param {string} [originalNodeType] - The type of the CST node that was being processed when the error occurred, if applicable.
 * @param {string} [cstNodeText] - The text content of the problematic CST node, if available.
 * @param {ast.ErrorNode} [cause] - An optional underlying `ErrorNode` that caused this error, for chaining errors.
 * @returns {ast.ErrorNode} A newly created `ast.ErrorNode` object.
 */
export function createErrorNodeInternal(
  cstNode: TSNode | null,
  message: string,
  errorCode: string,
  originalNodeType?: string,
  cstNodeText?: string,
  cause?: ast.ErrorNode | undefined
): ast.ErrorNode {
  return {
    type: 'error',
    location: cstNode ? getLocation(cstNode) : defaultLocation,
    message,
    errorCode,
    originalNodeType: originalNodeType || cstNode?.type || 'unknown_node_type',
    cstNodeText: cstNodeText || cstNode?.text.substring(0, 80) || '',
    ...(cause && { cause }),
  };
}
