/**
 * @file AST Error Utilities
 *
 * This module provides utility functions for creating and handling AST error nodes.
 *
 * @module lib/openscad-parser/ast/utils/ast-error-utils
 */

import { Node as TSNode } from 'web-tree-sitter';
import * as ast from '../ast-types.js';
import { getLocation } from './location-utils.js';

/**
 * Default source location for AST nodes when a more specific location cannot be determined.
 */
export const defaultLocation: ast.SourceLocation = {
  start: { line: 0, column: 0, offset: 0 },
  end: { line: 0, column: 0, offset: 0 },
};

/**
 * Creates an internal representation of an error AST node.
 *
 * This function is used by visitors to generate consistent error nodes when parsing issues are encountered.
 *
 * @param cstNode - The Tree-sitter CST node that caused the error, or null if not applicable.
 * @param message - A descriptive error message.
 * @param errorCode - A unique code identifying the type of error.
 * @param originalNodeType - The type of the CST node that was being processed, if available.
 * @param cstNodeText - The text content of the CST node, if available.
 * @param cause - An optional underlying error node that caused this error.
 * @returns An `ast.ErrorNode` object representing the error.
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
    location: (cstNode ? getLocation(cstNode) : defaultLocation),
    message,
    errorCode,
    originalNodeType: originalNodeType || cstNode?.type || 'unknown_node_type',
    cstNodeText: cstNodeText || cstNode?.text.substring(0, 80) || '',
    ...(cause && { cause }),
  };
}
