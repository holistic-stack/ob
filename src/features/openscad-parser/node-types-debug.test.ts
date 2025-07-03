/**
 * Test to debug the structure of the accessor_expression node
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { EnhancedOpenscadParser } from './enhanced-parser.js';

describe('OpenSCAD Node Types Debug', () => {
  let parser: EnhancedOpenscadParser;

  beforeEach(async () => {
    parser = new EnhancedOpenscadParser();
    await parser.init('./tree-sitter-openscad.wasm');
  });

  afterEach(() => {
    parser.dispose();
  });

  it('should print the structure of the module_instantiation node', () => {
    const code = 'sphere(10);';
    const tree = parser.parseCST(code);
    if (!tree) throw new Error('Failed to parse CST');

    // Print the tree structure
    console.log('Tree structure:');
    console.log(tree.rootNode.toString());

    // Find the module_instantiation node (current grammar uses this instead of accessor_expression)
    const moduleInstantiation = findNodeOfType(
      tree.rootNode,
      'module_instantiation'
    );
    if (!moduleInstantiation)
      throw new Error('Failed to find module_instantiation node');

    // Print the module_instantiation node structure
    console.log('Module instantiation node:');
    console.log(moduleInstantiation.toString());

    // Print the module_instantiation node fields
    console.log('Module instantiation node fields:');
    for (let i = 0; i < moduleInstantiation.namedChildCount; i++) {
      const child = moduleInstantiation.namedChild(i);
      if (child) {
        console.log(`Field ${i}: type=${child.type}, text=${child.text}`);
      }
    }

    // Print the module_instantiation node children
    console.log('Module instantiation node children:');
    for (let i = 0; i < moduleInstantiation.childCount; i++) {
      const child = moduleInstantiation.child(i);
      if (child) {
        console.log(`Child ${i}: type=${child.type}, text=${child.text}`);
      }
    }

    // Try to find the function name (should be the 'name' field)
    const functionName = moduleInstantiation.childForFieldName('name');
    if (functionName) {
      console.log('Function name:', functionName.text);
    }

    // Try to find the arguments (should be the 'arguments' field)
    const arguments_ = moduleInstantiation.childForFieldName('arguments');
    if (arguments_) {
      console.log('Arguments:', arguments_.text);
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
