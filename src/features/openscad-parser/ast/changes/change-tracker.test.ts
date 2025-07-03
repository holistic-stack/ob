/**
 * change-tracker.test.ts
 *
 * Tests for the ChangeTracker class.
 *
 * @module lib/openscad-parser/ast/changes/change-tracker.test

 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ChangeTracker } from './change-tracker.js';

describe('ChangeTracker', () => {
  let tracker: ChangeTracker;
  let sourceText: string;

  beforeEach(() => {
    tracker = new ChangeTracker();
    sourceText = 'module test() {\n  cube(10);\n}';
  });

  it('should track changes', () => {
    const change = tracker.trackChange(15, 17, 18, sourceText);

    expect(change).toBeDefined();
    expect(change.startIndex).toBe(15);
    expect(change.oldEndIndex).toBe(17);
    expect(change.newEndIndex).toBe(18);
    expect(change.timestamp).toBeDefined();
  });

  it('should get all changes', () => {
    tracker.trackChange(15, 17, 18, sourceText);
    tracker.trackChange(20, 22, 25, sourceText);

    const changes = tracker.getChanges();

    expect(changes.length).toBe(2);
    expect(changes[0].startIndex).toBe(15);
    expect(changes[1].startIndex).toBe(20);
  });

  it('should get changes since a specific time', () => {
    const change1 = tracker.trackChange(15, 17, 18, sourceText);

    // Wait a bit to ensure different timestamps
    const waitTime = 10;
    const startTime = Date.now();
    while (Date.now() - startTime < waitTime) {
      // Wait
    }

    const _change2 = tracker.trackChange(20, 22, 25, sourceText);

    const changesSince = tracker.getChangesSince(change1.timestamp);

    expect(changesSince.length).toBe(1);
    expect(changesSince[0].startIndex).toBe(20);
  });

  it('should check if a node is affected by changes', () => {
    tracker.trackChange(15, 17, 18, sourceText);

    // Node completely contains the change
    expect(tracker.isNodeAffected(10, 20)).toBe(true);

    // Change completely contains the node
    expect(tracker.isNodeAffected(16, 17)).toBe(true);

    // Change starts within the node
    expect(tracker.isNodeAffected(10, 16)).toBe(true);

    // Change ends within the node
    expect(tracker.isNodeAffected(17, 20)).toBe(true);

    // Node and change don't overlap
    expect(tracker.isNodeAffected(0, 5)).toBe(false);
    expect(tracker.isNodeAffected(25, 30)).toBe(false);
  });

  it('should check if a node is affected by changes since a specific time', () => {
    const change1 = tracker.trackChange(15, 17, 18, sourceText);

    // Wait a bit to ensure different timestamps
    const waitTime = 10;
    const startTime = Date.now();
    while (Date.now() - startTime < waitTime) {
      // Wait
    }

    tracker.trackChange(25, 27, 28, sourceText);

    // Node affected by first change but not second
    expect(tracker.isNodeAffected(10, 20, change1.timestamp)).toBe(false);

    // Node affected by second change but not first
    expect(tracker.isNodeAffected(20, 30, change1.timestamp)).toBe(true);
  });

  it('should clear all changes', () => {
    tracker.trackChange(15, 17, 18, sourceText);
    tracker.trackChange(20, 22, 25, sourceText);

    tracker.clear();

    const changes = tracker.getChanges();

    expect(changes.length).toBe(0);
  });

  it('should convert index to position correctly', () => {
    // Index 15 is at the end of "module test() {" which is on line 0
    const change = tracker.trackChange(15, 17, 18, sourceText);
    expect(change.startPosition.row).toBe(0);
    expect(change.startPosition.column).toBe(15);

    // Index 17 is after the newline, so it's on line 1
    expect(change.oldEndPosition.row).toBe(1);
    expect(change.oldEndPosition.column).toBe(1);

    // Test with different positions
    const change2 = tracker.trackChange(0, 1, 1, sourceText);
    expect(change2.startPosition.row).toBe(0);
    expect(change2.startPosition.column).toBe(0);

    const change3 = tracker.trackChange(
      sourceText.length,
      sourceText.length,
      sourceText.length,
      sourceText
    );
    expect(change3.startPosition.row).toBe(2);
    expect(change3.startPosition.column).toBe(1);
  });

  it('should throw an error for out of bounds index', () => {
    expect(() => {
      tracker.trackChange(
        sourceText.length + 1,
        sourceText.length + 2,
        sourceText.length + 3,
        sourceText
      );
    }).toThrow();
  });
});
