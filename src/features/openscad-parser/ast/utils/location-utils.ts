/**
 * @file Location tracking utilities for OpenSCAD parser
 *
 * This module provides utilities for converting Tree-sitter location information into
 * structured AST location objects. Location tracking is essential for error reporting,
 * IDE integration, syntax highlighting, and debugging features.
 *
 * The location system bridges the gap between Tree-sitter's native position tracking
 * and the AST's structured location format. It handles:
 * - Converting Tree-sitter Point objects to AST Position objects
 * - Extracting complete source location ranges from nodes
 * - Calculating character offsets for precise positioning
 * - Providing fallback locations for test scenarios
 *
 * Key features:
 * - Type-safe conversion between location formats
 * - Support for both line/column and character offset positioning
 * - Robust handling of mock nodes in test environments
 * - Integration with AST node location requirements
 * - Accurate source mapping for error reporting
 *
 * @example Basic location extraction
 * ```typescript
 * import { getLocation, pointToPosition } from './location-utils';
 *
 * // Extract location from a Tree-sitter node
 * const location = getLocation(node);
 * // Returns: { start: { line: 5, column: 10, offset: 120 }, end: { ... } }
 *
 * // Convert Tree-sitter point to AST position
 * const position = pointToPosition(node.startPosition, 120);
 * // Returns: { line: 5, column: 10, offset: 120 }
 * ```
 *
 * @example Error reporting integration
 * ```typescript
 * const location = getLocation(errorNode);
 * const errorMessage = `Syntax error at line ${location.start.line + 1}, column ${location.start.column + 1}`;
 * ```
 *
 * @example IDE integration
 * ```typescript
 * // For syntax highlighting and hover information
 * const nodeLocation = getLocation(identifierNode);
 * const range = {
 *   start: { line: nodeLocation.start.line, character: nodeLocation.start.column },
 *   end: { line: nodeLocation.end.line, character: nodeLocation.end.column }
 * };
 * ```
 *
 * @module location-utils
 * @since 0.1.0
 */

import { Node as TSNode, type Point } from 'web-tree-sitter';
import * as ast from '../ast-types.js';

/**
 * Converts a Tree-sitter Point object to an AST Position object.
 *
 * This function bridges the gap between Tree-sitter's native Point format
 * and the AST's Position format. It preserves line and column information
 * while adding character offset support for precise positioning.
 *
 * The conversion maintains zero-based indexing for both line and column
 * numbers, consistent with Tree-sitter's coordinate system. The offset
 * parameter allows for accurate character-based positioning within the
 * source text.
 *
 * @param point - The Tree-sitter Point object containing row and column
 * @param offset - Optional character offset from the beginning of the source (default: 0)
 * @returns AST Position object with line, column, and offset information
 *
 * @example Basic point conversion
 * ```typescript
 * // Convert Tree-sitter point to AST position
 * const position = pointToPosition(node.startPosition, 150);
 * // Returns: { line: 10, column: 5, offset: 150 }
 * ```
 *
 * @example Error reporting usage
 * ```typescript
 * const errorPosition = pointToPosition(errorNode.startPosition, errorNode.startIndex);
 * console.log(`Error at line ${errorPosition.line + 1}, column ${errorPosition.column + 1}`);
 * ```
 *
 * @example Range calculation
 * ```typescript
 * const startPos = pointToPosition(node.startPosition, node.startIndex);
 * const endPos = pointToPosition(node.endPosition, node.endIndex);
 * const range = { start: startPos, end: endPos };
 * ```
 *
 * @since 0.1.0
 * @category Location Conversion
 */
export function pointToPosition(
  point: Point,
  offset: number = 0
): ast.Position {
  return {
    line: point.row,
    column: point.column,
    offset: offset,
  };
}

/**
 * Extracts complete source location information from a Tree-sitter node.
 *
 * This function creates a comprehensive SourceLocation object that includes both
 * start and end positions for a Tree-sitter node. It handles the conversion from
 * Tree-sitter's native position format to the AST's structured location format,
 * including character offset calculation.
 *
 * The function provides robust handling for different node types:
 * - Real Tree-sitter nodes with complete position information
 * - Mock nodes used in test environments (returns default location)
 * - Nodes with missing position data (graceful fallback)
 *
 * Location information is essential for:
 * - Error reporting with precise source positions
 * - IDE features like go-to-definition and hover
 * - Syntax highlighting and code analysis
 * - Debugging and development tools
 *
 * @param node - The Tree-sitter node to extract location information from
 * @returns Complete SourceLocation object with start and end positions
 *
 * @example Basic location extraction
 * ```typescript
 * // Extract location from a function call node
 * const location = getLocation(cubeNode);
 * // Returns: {
 * //   start: { line: 5, column: 0, offset: 120 },
 * //   end: { line: 5, column: 10, offset: 130 }
 * // }
 * ```
 *
 * @example Error reporting usage
 * ```typescript
 * const location = getLocation(errorNode);
 * const message = `Syntax error at line ${location.start.line + 1}, ` +
 *                `column ${location.start.column + 1}`;
 * console.error(message);
 * ```
 *
 * @example IDE integration
 * ```typescript
 * // Create LSP-compatible range for IDE features
 * const location = getLocation(identifierNode);
 * const lspRange = {
 *   start: { line: location.start.line, character: location.start.column },
 *   end: { line: location.end.line, character: location.end.column }
 * };
 * ```
 *
 * @example Test environment handling
 * ```typescript
 * // Works with both real and mock nodes
 * const realLocation = getLocation(realTreeSitterNode);
 * const testLocation = getLocation(mockNodeForTesting);
 * // Both return valid SourceLocation objects
 * ```
 *
 * @since 0.1.0
 * @category Location Extraction
 */
export function getLocation(node: TSNode): ast.SourceLocation {
  // Check if the node has startPosition and endPosition properties
  // This is needed for mock nodes in tests
  if (node.startPosition && node.endPosition) {
    // Calculate approximate character offsets
    // This is a simplification - in a real implementation, you would need to
    // calculate the actual character offsets based on the source code
    const startOffset = node.startIndex;
    const endOffset = node.endIndex;

    const loc = {
      start: {
        line: node.startPosition.row,
        column: node.startPosition.column,
        offset: startOffset,
      },
      end: {
        line: node.endPosition.row,
        column: node.endPosition.column,
        offset: endOffset,
      },
    };
    return loc;
  }

  // Return a default location for mock nodes  // Fallback
  const fallbackLoc = {
    start: { line: 0, column: 0, offset: 0 },
    end: { line: 0, column: 0, offset: 0 },
  };
  return fallbackLoc;
}
