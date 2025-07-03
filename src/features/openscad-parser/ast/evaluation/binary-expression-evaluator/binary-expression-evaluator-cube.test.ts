/**
 * Binary Expression Evaluator Cube Tests
 *
 * This file contains tests for binary expression evaluation in cube arguments.
 * Following the SRP principle, these tests focus solely on binary expression
 * evaluation within cube arguments.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { EnhancedOpenscadParser } from '../../../enhanced-parser.js';
import { ErrorHandler } from '../../../error-handling/index.js';
import { extractCubeNode } from '../../extractors/cube-extractor.js';
import { Node as TSNode } from 'web-tree-sitter';

describe('Binary Expression Evaluation in Cube Arguments', () => {
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
   * Helper function to print the tree structure
   */
  function printNodeRecursive(node: TSNode, depth = 0): void {
    const indent = '  '.repeat(depth);
    console.log(`${indent}Node: ${node.type}, Text: "${node.text.replace(/\n/g, '\\n')}"`);

    // Print named children if available
    for (let i = 0; i < node.namedChildCount; i++) {
      const namedChild = node.namedChild(i);
      if (namedChild) {
        console.log(`${indent}  Named child ${i}: ${namedChild.type}, Text: "${namedChild.text.replace(/\n/g, '\\n')}"`);
      }
    }

    // Print all children
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (child) {
        printNodeRecursive(child, depth + 1);
      }
    }
  }

  /**
   * Helper function to find a cube node in the tree
   */
  function findCubeNode(node: TSNode): TSNode | null {
    console.log(`Checking node for cube: ${node.type} - "${node.text.substring(0, 30)}"`);
    if ((node.type === 'module_instantiation' || node.type === 'accessor_expression') &&
        node.text.includes('cube')) {
      console.log(`Found potential cube node: ${node.type}`);
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

  /**
   * Helper function to find a binary expression node in the tree
   */
  function findBinaryExpressionNode(node: TSNode): TSNode | null {
    if (node.type === 'binary_expression' ||
        node.type === 'additive_expression' ||
        node.type === 'multiplicative_expression') {
      console.log(`Found binary expression node: ${node.type}`);
      return node;
    }
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (child) {
        const result = findBinaryExpressionNode(child);
        if (result) return result;
      }
    }
    return null;
  }

  it('should evaluate simple addition in cube arguments', () => {
    const code = 'cube(1 + 2);';
    console.log('Testing binary expression in cube:', code);

    const tree = parser.parse(code);
    console.log('Tree parsed successfully:', !!tree);
    expect(tree).toBeDefined();

    console.log('Full tree structure:');
    printNodeRecursive(tree.rootNode);

    const cubeNode = findCubeNode(tree.rootNode);
    expect(cubeNode).not.toBeNull();
    console.log('Found cube node:', cubeNode?.type, cubeNode?.text);

    // Find the binary expression node inside the cube arguments
    const binaryExprNode = findBinaryExpressionNode(cubeNode!);
    console.log('Binary expression node found in cube arguments:', binaryExprNode ? 'yes' : 'no');

    if (binaryExprNode) {
      console.log('Binary expression node type:', binaryExprNode.type);
      console.log('Binary expression node text:', binaryExprNode.text);

      // Check the left and right operands and operator
      const leftNode = binaryExprNode.childForFieldName('left') || binaryExprNode.child(0);
      const operatorNode = binaryExprNode.childForFieldName('operator') || binaryExprNode.child(1);
      const rightNode = binaryExprNode.childForFieldName('right') || binaryExprNode.child(2);

      console.log('Left node:', leftNode?.type, leftNode?.text);
      console.log('Operator node:', operatorNode?.type, operatorNode?.text);
      console.log('Right node:', rightNode?.type, rightNode?.text);
    }

    // Extract the cube with enhanced expression evaluation
    const cubeAST = extractCubeNode(cubeNode!, errorHandler);
    console.log('Extracted cube AST:', JSON.stringify(cubeAST, null, 2));
    console.log('Error handler errors:', errorHandler.getErrors());

    expect(cubeAST).toBeDefined();

    // Check if the size is correctly evaluated
    if (cubeAST) {
      console.log('Cube size:', cubeAST.size);
      expect(typeof cubeAST.size).toBe('number');
      expect(cubeAST.size).toBe(3); // 1 + 2 = 3
    }
  });

  it('should evaluate multiplication in cube arguments', () => {
    const code = 'cube(2 * 3);';
    console.log('Testing multiplication in cube:', code);

    const tree = parser.parse(code);
    expect(tree).toBeDefined();

    const cubeNode = findCubeNode(tree.rootNode);
    expect(cubeNode).not.toBeNull();

    // Extract the cube with enhanced expression evaluation
    const cubeAST = extractCubeNode(cubeNode!, errorHandler);
    console.log('Extracted cube AST:', JSON.stringify(cubeAST, null, 2));

    expect(cubeAST).toBeDefined();

    // Check if the size is correctly evaluated
    if (cubeAST) {
      expect(typeof cubeAST.size).toBe('number');
      expect(cubeAST.size).toBe(6); // 2 * 3 = 6
    }
  });

  it('should evaluate complex expressions in cube arguments', () => {
    const code = 'cube(1 + 2 * 3);';
    console.log('Testing complex expression in cube:', code);

    const tree = parser.parse(code);
    expect(tree).toBeDefined();

    const cubeNode = findCubeNode(tree.rootNode);
    expect(cubeNode).not.toBeNull();

    // Extract the cube with enhanced expression evaluation
    const cubeAST = extractCubeNode(cubeNode!, errorHandler);
    console.log('Extracted cube AST:', JSON.stringify(cubeAST, null, 2));

    expect(cubeAST).toBeDefined();

    // Check if the size is correctly evaluated
    if (cubeAST) {
      expect(typeof cubeAST.size).toBe('number');
      expect(cubeAST.size).toBe(7); // 1 + 2 * 3 = 7
    }
  });
});