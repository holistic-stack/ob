/**
 * Test to print the node types in the OpenSCAD language
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { EnhancedOpenscadParser } from './enhanced-parser.js';
import { TreeCursor } from 'web-tree-sitter';

/**
 * Collects all unique node types from a tree by traversing it depth-first.
 * @param cursor - The tree cursor to traverse
 * @returns Set of all unique node types found in the tree
 */
function collectNodeTypes(cursor: TreeCursor): Set<string> {
  const nodeTypes = new Set<string>();

  function traverseNode(cursor: TreeCursor): void {
    nodeTypes.add(cursor.nodeType);

    if (cursor.gotoFirstChild()) {
      do {
        traverseNode(cursor);
      } while (cursor.gotoNextSibling());
      cursor.gotoParent();
    }
  }

  traverseNode(cursor);
  return nodeTypes;
}

describe('OpenSCAD Node Types', () => {
  let parser: EnhancedOpenscadParser;

  beforeEach(async () => {
    parser = new EnhancedOpenscadParser();
    await parser.init('./tree-sitter-openscad.wasm');
  });

  afterEach(() => {
    parser.dispose();
  });

  it('should print the node types in a simple OpenSCAD program', () => {
    const code = 'cube(10); sphere(5); cylinder(h=10, r=5);';
    const tree = parser.parseCST(code);
    if (!tree) throw new Error('Failed to parse CST');

    // Print the tree structure
    console.log('Tree structure:');
    console.log(tree.rootNode.toString());

    // Collect all node types using the utility function
    const cursor = tree.rootNode.walk();
    const nodeTypes = collectNodeTypes(cursor);

    // Print the node types
    console.log('Node types:');
    console.log(Array.from(nodeTypes).sort().join('\n'));

    // We expect to find some node types
    expect(nodeTypes.size).toBeGreaterThan(0);
  });
});
