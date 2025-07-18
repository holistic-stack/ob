/**
 * @file node-location.ts
 * @description This file defines the types and utilities for tracking the source code location of AST nodes.
 * Having precise location information is essential for features like error reporting, syntax highlighting,
 * and providing feedback in the user interface.
 *
 * @architectural_decision
 * A dedicated `NodeLocation` interface is used to standardize how node positions are represented throughout the application.
 * A factory function, `createNodeLocation`, is provided to ensure that location objects are created consistently.
 * This approach improves maintainability and makes it easier to work with node locations.
 */

/**
 * @interface NodeLocation
 * @description Represents the location of a node in the source code, including start and end positions.
 */
export interface NodeLocation {
  /** @property The starting position of the node. */
  readonly start: {
    /** @property The 1-based line number where the node begins. */
    readonly line: number;
    /** @property The 1-based column number where the node begins. */
    readonly column: number;
    /** @property The 0-based character offset from the beginning of the file. */
    readonly offset: number;
  };
  /** @property The ending position of the node. */
  readonly end: {
    /** @property The 1-based line number where the node ends. */
    readonly line: number;
    /** @property The 1-based column number where the node ends. */
    readonly column: number;
    /** @property The 0-based character offset from the beginning of the file. */
    readonly offset: number;
  };
}

/**
 * @function createNodeLocation
 * @description A factory function to create a `NodeLocation` object.
 *
 * @param {number} startLine - The starting line number.
 * @param {number} startColumn - The starting column number.
 * @param {number} startOffset - The starting offset.
 * @param {number} endLine - The ending line number.
 * @param {number} endColumn - The ending column number.
 * @param {number} endOffset - The ending offset.
 * @returns {NodeLocation} The created node location object.
 *
 * @example
 * ```ts
 * const location = createNodeLocation(1, 1, 0, 1, 5, 5);
 * // location represents a node that starts at line 1, column 1 and ends at line 1, column 5.
 * ```
 */
export function createNodeLocation(
  startLine: number,
  startColumn: number,
  startOffset: number,
  endLine: number,
  endColumn: number,
  endOffset: number
): NodeLocation {
  return {
    start: { line: startLine, column: startColumn, offset: startOffset },
    end: { line: endLine, column: endColumn, offset: endOffset },
  };
}
