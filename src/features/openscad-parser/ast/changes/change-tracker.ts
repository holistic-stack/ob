/**
 * @file change-tracker.ts
 * @description This file implements the `ChangeTracker` class, which is responsible for tracking modifications
 * to the source code. This is crucial for enabling incremental parsing, where only the changed portions
 * of the code are re-parsed, leading to significant performance improvements in real-time editing scenarios.
 *
 * @architectural_decision
 * The `ChangeTracker` is designed to store a history of `Change` objects, each representing an edit operation.
 * It provides methods to record new changes, retrieve a list of changes, and determine if a specific code
 * region (like an AST node) has been affected by any changes. This allows the parser to intelligently decide
 * which parts of the syntax tree need to be re-evaluated, rather than re-parsing the entire file on every keystroke.
 *
 * @example
 * ```typescript
 * import { ChangeTracker } from './change-tracker';
 *
 * const tracker = new ChangeTracker();
 * let sourceCode = "cube(10);\nsphere(5);";
 *
 * // Simulate an edit: change 'cube(10);' to 'cube(20);'
 * // Original: cube(10);\nsphere(5);
 * // New:      cube(20);\nsphere(5);
 * const startIndex = 5; // Position of '1' in '10'
 * const oldEndIndex = 7; // Position after '0' in '10'
 * const newEndIndex = 7; // Position after '0' in '20' (same length in this case)
 * sourceCode = "cube(20);\nsphere(5);";
 * tracker.trackChange(startIndex, oldEndIndex, newEndIndex, sourceCode);
 *
 * // Check if a node from the original AST (e.g., sphere(5) which starts at index 10) is affected
 * const isSphereAffected = tracker.isNodeAffected(10, 19); // sphere(5);
 * console.log(`Is sphere affected? ${isSphereAffected}`); // Should be false
 *
 * // Simulate another edit that affects the sphere
 * // Original: cube(20);\nsphere(5);
 * // New:      cube(20);\nsphere(15);
 * const startIndex2 = 17; // Position of '5' in 'sphere(5)'
 * const oldEndIndex2 = 18; // Position after '5'
 * const newEndIndex2 = 19; // Position after '15'
 * sourceCode = "cube(20);\nsphere(15);";
 * tracker.trackChange(startIndex2, oldEndIndex2, newEndIndex2, sourceCode);
 *
 * const isSphereAffectedAgain = tracker.isNodeAffected(10, 20); // sphere(15);
 * console.log(`Is sphere affected now? ${isSphereAffectedAgain}`); // Should be true
 *
 * // Get all changes
 * const allChanges = tracker.getChanges();
 * console.log('All changes:', allChanges);
 *
 * // Clear changes
 * tracker.clear();
 * console.log('Changes after clear:', tracker.getChanges());
 * ```
 */

import type { Edit, Point } from 'web-tree-sitter';

/**
 * @interface Change
 * @description Represents a single modification to the source code, extending Tree-sitter's `Edit` interface.
 * It includes the byte offsets and line/column positions of the change, along with a timestamp.
 *
 * @property {number} startIndex - The byte offset where the change begins.
 * @property {number} oldEndIndex - The byte offset where the old text ended.
 * @property {number} newEndIndex - The byte offset where the new text ends.
 * @property {Point} startPosition - The line and column where the change starts.
 * @property {Point} oldEndPosition - The line and column where the old text ended.
 * @property {Point} newEndPosition - The line and column where the new text ends.
 * @property {number} timestamp - The Unix timestamp (milliseconds) when the change was recorded.
 */
export interface Change extends Edit {
  timestamp: number;
}

/**
 * @class ChangeTracker
 * @description Manages and tracks a history of changes made to the source code.
 * This class is essential for implementing efficient incremental parsing by identifying affected regions.
 */
export class ChangeTracker {
  private changes: Change[] = [];

  /**
   * @method trackChange
   * @description Records a new change to the source code.
   * This method calculates the line and column positions for the change based on the provided indices.
   *
   * @param {number} startIndex - The byte offset where the change starts.
   * @param {number} oldEndIndex - The byte offset where the old text ended.
   * @param {number} newEndIndex - The byte offset where the new text ends.
   * @param {string} text - The complete source text *after* the change has been applied.
   * @returns {Change} The newly created and tracked change object.
   */
  trackChange(startIndex: number, oldEndIndex: number, newEndIndex: number, text: string): Change {
    const change: Change = {
      startIndex,
      oldEndIndex,
      newEndIndex,
      startPosition: this.indexToPosition(text, startIndex),
      oldEndPosition: this.indexToPosition(text, oldEndIndex),
      newEndPosition: this.indexToPosition(text, newEndIndex),
      timestamp: Date.now(),
    };

    this.changes.push(change);
    return change;
  }

  /**
   * @method getChanges
   * @description Retrieves all changes that have been tracked so far.
   * @returns {Change[]} A shallow copy of the array of tracked changes.
   */
  getChanges(): Change[] {
    return [...this.changes];
  }

  /**
   * @method getChangesSince
   * @description Retrieves changes that have occurred since a specific timestamp.
   *
   * @param {number} since - The Unix timestamp (milliseconds) from which to retrieve changes.
   * @returns {Change[]} An array of changes that occurred after the specified timestamp.
   */
  getChangesSince(since: number): Change[] {
    return this.changes.filter((change) => change.timestamp > since);
  }

  /**
   * @method isNodeAffected
   * @description Checks if a given node (defined by its start and end byte indices) has been affected by any tracked changes.
   * A node is considered affected if its range overlaps with any change's range.
   *
   * @param {number} nodeStartIndex - The starting byte offset of the node.
   * @param {number} nodeEndIndex - The ending byte offset of the node.
   * @param {number} [since] - Optional. If provided, only checks against changes that occurred after this timestamp.
   * @returns {boolean} `true` if the node is affected by any relevant changes, `false` otherwise.
   */
  isNodeAffected(nodeStartIndex: number, nodeEndIndex: number, since?: number): boolean {
    const changesToCheck = since ? this.getChangesSince(since) : this.changes;

    return changesToCheck.some((change) => {
      // Check if the change overlaps with the node
      return (
        // Change starts within the node
        (change.startIndex >= nodeStartIndex && change.startIndex <= nodeEndIndex) ||
        // Change ends within the node
        (change.newEndIndex >= nodeStartIndex && change.newEndIndex <= nodeEndIndex) ||
        // Change completely contains the node
        (change.startIndex <= nodeStartIndex && change.newEndIndex >= nodeEndIndex) ||
        // Node completely contains the change
        (nodeStartIndex <= change.startIndex && nodeEndIndex >= change.newEndIndex)
      );
    });
  }

  /**
   * @method clear
   * @description Clears all currently tracked changes from the tracker.
   */
  clear(): void {
    this.changes = [];
  }

  /**
   * @method indexToPosition
   * @description Converts a byte offset within the source text to a `Point` (line and column number).
   * This is a private helper method used internally to populate the `startPosition`, `oldEndPosition`,
   * and `newEndPosition` fields of a `Change` object.
   *
   * @param {string} text - The full source text.
   * @param {number} index - The byte offset to convert.
   * @returns {Point} An object containing the `row` (line number) and `column`.
   * @private
   */
  private indexToPosition(text: string, index: number): Point {
    if (index > text.length) {
      throw new Error(`Index ${index} is out of bounds for text of length ${text.length}`);
    }

    let line = 0;
    let column = 0;

    for (let i = 0; i < index; i++) {
      if (text[i] === '\n') {
        line++;
        column = 0;
      } else {
        column++;
      }
    }

    return { row: line, column };
  }
}
