/**
 * change-tracker.ts
 *
 * Tracks changes to the source code for incremental parsing.
 *
 * @module lib/openscad-parser/ast/changes/change-tracker

 *
 * @example
 * ```typescript
 * // Create a change tracker
 * const tracker = new ChangeTracker();
 *
 * // Track a change
 * tracker.trackChange(10, 15, 20, sourceCode);
 *
 * // Get all changes
 * const changes = tracker.getChanges();
 *
 * // Check if a node is affected by changes
 * const isAffected = tracker.isNodeAffected(5, 25);
 * ```
 */

import type { Point, Edit } from 'web-tree-sitter';

/**
 * Represents a change to the source code
 */
export interface Change extends Edit {
  /**
   * The timestamp when the change was made
   */
  timestamp: number;
}

/**
 * Tracks changes to the source code for incremental parsing
 */
export class ChangeTracker {
  /**
   * The changes that have been tracked
   */
  private changes: Change[] = [];

  /**
   * Track a change to the source code
   *
   * @param startIndex The index where the change starts
   * @param oldEndIndex The index where the old text ends
   * @param newEndIndex The index where the new text ends
   * @param text The source text after the change
   * @returns The change that was tracked
   */
  trackChange(
    startIndex: number,
    oldEndIndex: number,
    newEndIndex: number,
    text: string
  ): Change {
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
   * Get all changes that have been tracked
   *
   * @returns All changes
   */
  getChanges(): Change[] {
    return [...this.changes];
  }

  /**
   * Get changes that have been tracked since a specific time
   *
   * @param since The timestamp to get changes since
   * @returns Changes since the specified time
   */
  getChangesSince(since: number): Change[] {
    return this.changes.filter(change => change.timestamp > since);
  }

  /**
   * Check if a node is affected by any changes
   *
   * @param nodeStartIndex The start index of the node
   * @param nodeEndIndex The end index of the node
   * @param since Optional timestamp to only check changes since that time
   * @returns True if the node is affected by any changes, false otherwise
   */
  isNodeAffected(
    nodeStartIndex: number,
    nodeEndIndex: number,
    since?: number
  ): boolean {
    const changesToCheck = since ? this.getChangesSince(since) : this.changes;

    return changesToCheck.some(change => {
      // Check if the change overlaps with the node
      return (
        // Change starts within the node
        (change.startIndex >= nodeStartIndex &&
          change.startIndex <= nodeEndIndex) ||
        // Change ends within the node
        (change.newEndIndex >= nodeStartIndex &&
          change.newEndIndex <= nodeEndIndex) ||
        // Change completely contains the node
        (change.startIndex <= nodeStartIndex &&
          change.newEndIndex >= nodeEndIndex) ||
        // Node completely contains the change
        (nodeStartIndex <= change.startIndex &&
          nodeEndIndex >= change.newEndIndex)
      );
    });
  }

  /**
   * Clear all tracked changes
   */
  clear(): void {
    this.changes = [];
  }

  /**
   * Convert an index in the source text to a position (line and column)
   *
   * @param text The source text
   * @param index The index to convert
   * @returns The position (line and column)
   */
  private indexToPosition(text: string, index: number): Point {
    if (index > text.length) {
      throw new Error(
        `Index ${index} is out of bounds for text of length ${text.length}`
      );
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
