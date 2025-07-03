/**
 * Cube Extractor Tests
 *
 * This file contains tests for the cube extractor functionality.
 * Following the SRP principle, these tests focus solely on cube extraction.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { EnhancedOpenscadParser } from '../../enhanced-parser.js';
import { ErrorHandler } from '../../error-handling/index.js';
import { extractCubeNode } from './cube-extractor.js';
import { Node as TSNode } from 'web-tree-sitter';

describe('Cube Extractor', () => {
  let parser: EnhancedOpenscadParser;
  let errorHandler: ErrorHandler;

  beforeEach(async () => {
    parser = new EnhancedOpenscadParser();
    await parser.init();
    errorHandler = new ErrorHandler();
  });

  afterEach(() => {
    parser.dispose();
  });

  /**
   * Helper function to find a cube node in the tree
   */
  function findCubeNode(node: TSNode): TSNode | null {
    if ((node.type === 'module_instantiation' || node.type === 'accessor_expression') &&
        node.text.includes('cube')) {
      return node;
    }
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (child) {
        const result = findCubeNode(child);
        if (result) return result;
      }
    }
    return null;
  }

  it('should extract a cube with a numeric size', () => {
    const code = 'cube(5);';
    const tree = parser.parse(code);
    expect(tree).toBeDefined();

    const cubeNode = findCubeNode(tree.rootNode);
    expect(cubeNode).not.toBeNull();

    const cubeAST = extractCubeNode(cubeNode!, errorHandler);
    expect(cubeAST).toBeDefined();
    expect(cubeAST?.size).toBe(5);
  });

  it('should extract a cube with a simple binary expression size', () => {
    const code = 'cube(2 + 3);';
    const tree = parser.parse(code);
    expect(tree).toBeDefined();

    const cubeNode = findCubeNode(tree.rootNode);
    expect(cubeNode).not.toBeNull();

    // Print detailed information about the cube node
    console.log('Cube node type:', cubeNode?.type);
    console.log('Cube node text:', cubeNode?.text);

    // Print the argument structure
    let argsNode: TSNode | null = null;
    for (let i = 0; i < (cubeNode?.childCount || 0); i++) {
      const child = cubeNode?.child(i);
      if (child && (child.type === 'argument_list' || child.type === 'arguments')) {
        argsNode = child;
        console.log(`Found arguments node at index ${i}: ${child.type}`);
        break;
      }
    }

    if (argsNode) {
      console.log('Arguments node type:', argsNode.type);
      console.log('Arguments node text:', argsNode.text);

      for (let i = 0; i < argsNode.childCount; i++) {
        const child = argsNode.child(i);
        if (child) {
          console.log(`Argument child ${i}: ${child.type} - "${child.text}"`);
        }
      }

      // Look for binary expression
      for (let i = 0; i < argsNode.childCount; i++) {
        const child = argsNode.child(i);
        if (child && (child.type === 'binary_expression' ||
                     child.type === 'additive_expression' ||
                     child.type === 'multiplicative_expression')) {
          console.log(`Found binary expression at index ${i}: ${child.type}`);

          const leftNode = child.childForFieldName('left') || child.child(0);
          const operatorNode = child.childForFieldName('operator') || child.child(1);
          const rightNode = child.childForFieldName('right') || child.child(2);

          console.log('Left node:', leftNode?.type, leftNode?.text);
          console.log('Operator node:', operatorNode?.type, operatorNode?.text);
          console.log('Right node:', rightNode?.type, rightNode?.text);
        }
      }
    }

    // Extract the cube and check the result
    const cubeAST = extractCubeNode(cubeNode!, errorHandler);
    console.log('Extracted cube AST:', JSON.stringify(cubeAST, null, 2));
    console.log('Error handler errors:', errorHandler.getErrors());

    expect(cubeAST).toBeDefined();
    expect(cubeAST?.size).toBe(5); // 2 + 3 = 5
  });

  it('should extract a cube with a multiplication expression size', () => {
    const code = 'cube(2 * 3);';
    const tree = parser.parse(code);
    expect(tree).toBeDefined();

    const cubeNode = findCubeNode(tree.rootNode);
    expect(cubeNode).not.toBeNull();

    const cubeAST = extractCubeNode(cubeNode!, errorHandler);
    expect(cubeAST).toBeDefined();
    expect(cubeAST?.size).toBe(6); // 2 * 3 = 6
  });

  it('should extract a cube with a complex expression size', () => {
    const code = 'cube(1 + 2 * 3);';
    const tree = parser.parse(code);
    expect(tree).toBeDefined();

    const cubeNode = findCubeNode(tree.rootNode);
    expect(cubeNode).not.toBeNull();

    const cubeAST = extractCubeNode(cubeNode!, errorHandler);
    expect(cubeAST).toBeDefined();
    expect(cubeAST?.size).toBe(7); // 1 + 2 * 3 = 7
  });

  it('should extract a cube with a vector size', () => {
    const code = 'cube([10, 20, 30]);';
    const tree = parser.parse(code);
    expect(tree).toBeDefined();

    const cubeNode = findCubeNode(tree.rootNode);
    expect(cubeNode).not.toBeNull();

    const cubeAST = extractCubeNode(cubeNode!, errorHandler);
    expect(cubeAST).toBeDefined();
    expect(Array.isArray(cubeAST?.size)).toBe(true);
    expect(cubeAST?.size).toEqual([10, 20, 30]);
  });

  it('should extract a cube with a vector containing expressions', () => {
    const code = 'cube([5 + 5, 10 * 2, 5 * 6]);';
    const tree = parser.parse(code);
    expect(tree).toBeDefined();

    const cubeNode = findCubeNode(tree.rootNode);
    expect(cubeNode).not.toBeNull();

    const cubeAST = extractCubeNode(cubeNode!, errorHandler);
    expect(cubeAST).toBeDefined();
    expect(Array.isArray(cubeAST?.size)).toBe(true);
    expect(cubeAST?.size).toEqual([10, 20, 30]); // [5+5, 10*2, 5*6]
  });
});