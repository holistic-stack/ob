/**
 * Test to debug the structure of the argument node
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { EnhancedOpenscadParser } from './enhanced-parser.js';

describe('OpenSCAD Argument Debug', () => {
  let parser: EnhancedOpenscadParser;

  beforeEach(async () => {
    parser = new EnhancedOpenscadParser();
    await parser.init('./tree-sitter-openscad.wasm');
  });

  afterEach(() => {
    parser.dispose();
  });

  it('should print the structure of the argument node', () => {
    const code = 'sphere(d=20);';
    const tree = parser.parseCST(code);
    if (!tree) throw new Error('Failed to parse CST');

    // Print the tree structure
    console.log('Tree structure:');
    console.log(tree.rootNode.toString());

    // Find the argument_list node
    const argumentList = findNodeOfType(tree.rootNode, 'argument_list');
    if (!argumentList) throw new Error('Failed to find argument_list node');

    // Print the argument_list node structure
    console.log('Argument list node:');
    console.log(argumentList.toString());

    // Print the argument_list node fields
    console.log('Argument list node fields:');
    for (let i = 0; i < argumentList.namedChildCount; i++) {
      const child = argumentList.namedChild(i);
      if (child) {
        console.log(`Field ${i}: type=${child.type}, text=${child.text}`);
      }
    }

    // Print the argument_list node children
    console.log('Argument list node children:');
    for (let i = 0; i < argumentList.childCount; i++) {
      const child = argumentList.child(i);
      if (child) {
        console.log(`Child ${i}: type=${child.type}, text=${child.text}`);
      }
    }

    // Find the arguments node
    const arguments_ = findNodeOfType(argumentList, 'arguments');
    if (!arguments_) throw new Error('Failed to find arguments node');

    // Print the arguments node structure
    console.log('Arguments node:');
    console.log(arguments_.toString());

    // Print the arguments node fields
    console.log('Arguments node fields:');
    for (let i = 0; i < arguments_.namedChildCount; i++) {
      const child = arguments_.namedChild(i);
      if (child) {
        console.log(`Field ${i}: type=${child.type}, text=${child.text}`);
      }
    }

    // Print the arguments node children
    console.log('Arguments node children:');
    for (let i = 0; i < arguments_.childCount; i++) {
      const child = arguments_.child(i);
      if (child) {
        console.log(`Child ${i}: type=${child.type}, text=${child.text}`);
      }
    }

    // Find the argument node
    const argument = findNodeOfType(arguments_, 'argument');
    if (!argument) throw new Error('Failed to find argument node');

    // Print the argument node structure
    console.log('Argument node:');
    console.log(argument.toString());

    // Print the argument node fields
    console.log('Argument node fields:');
    for (let i = 0; i < argument.namedChildCount; i++) {
      const child = argument.namedChild(i);
      if (child) {
        console.log(`Field ${i}: type=${child.type}, text=${child.text}`);
      }
    }

    // Print the argument node children
    console.log('Argument node children:');
    for (let i = 0; i < argument.childCount; i++) {
      const child = argument.child(i);
      if (child) {
        console.log(`Child ${i}: type=${child.type}, text=${child.text}`);
      }
    }

    // Expect the test to pass
    expect(true).toBe(true);
  });
});

// Helper function to find a node of a specific type
function findNodeOfType(node: any, type: string): any {
  if (node.type === type) {
    return node;
  }

  for (let i = 0; i < node.childCount; i++) {
    const child = node.child(i);
    if (!child) continue;

    const result = findNodeOfType(child, type);
    if (result) {
      return result;
    }
  }

  return null;
}
