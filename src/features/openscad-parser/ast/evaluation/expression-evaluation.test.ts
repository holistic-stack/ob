import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { EnhancedOpenscadParser } from '../../enhanced-parser.js';
import { ErrorHandler } from '../../error-handling/index.js';
import { extractCubeNode } from '../extractors/cube-extractor.js';

describe('Enhanced Expression Evaluation', () => {
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
  
  // Add a simple test to verify binary expression node creation
  it('should create a binary expression node', () => {
    const code = 'x = 1 + 2;';
    console.log('Testing simple binary expression:', code);
    
    const tree = parser.parse(code);
    expect(tree).toBeDefined();
    
    // Find the binary expression node
    function findBinaryExpressionNode(node: any): any {
      console.log(`Checking node: ${node.type} - "${node.text}"`);
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
    
    const binaryExprNode = findBinaryExpressionNode(tree.rootNode);
    console.log('Binary expression node search result:', binaryExprNode);
    expect(binaryExprNode).not.toBeNull();
    
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
      
      expect(leftNode).not.toBeNull();
      expect(operatorNode).not.toBeNull();
      expect(rightNode).not.toBeNull();
      
      expect(leftNode?.text).toBe('1');
      expect(operatorNode?.text).toBe('+');
      expect(rightNode?.text).toBe('2');
    }
  });

  it('should evaluate binary expressions in cube arguments', () => {
    const code = 'cube(1 + 2);';
    console.log('Testing binary expression in cube:', code);

    const tree = parser.parse(code);
    console.log('Tree parsed successfully:', !!tree);
    expect(tree).toBeDefined();
    console.log('Tree root node type:', tree.rootNode.type);
    console.log('Tree root node text:', tree.rootNode.text);
    
    // Let's print the entire tree structure for debugging
    function printNodeRecursive(node: any, depth = 0) {
      const indent = '  '.repeat(depth);
      console.log(`${indent}Node: ${node.type}, Text: "${node.text.replace(/\n/g, '\\n')}"`);
      for (let i = 0; i < node.childCount; i++) {
        const child = node.child(i);
        if (child) {
          printNodeRecursive(child, depth + 1);
        }
      }
    }
    
    console.log('Full tree structure:');
    printNodeRecursive(tree.rootNode);

    // Find the cube function call
    function findCubeNode(node: any): any {
      console.log(`Checking node: ${node.type} - "${node.text}"`);
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

    const cubeNode = findCubeNode(tree.rootNode);
    console.log('Cube node search result:', cubeNode);
    expect(cubeNode).not.toBeNull();

    console.log('Found cube node:', cubeNode.type, cubeNode.text);

    // Extract the cube with enhanced expression evaluation
    const cubeAST = extractCubeNode(cubeNode, errorHandler);

    console.log('Extracted cube AST:', JSON.stringify(cubeAST, null, 2));
    console.log('Error handler errors:', errorHandler.getErrors());

    expect(cubeAST).toBeDefined();
    expect(cubeAST?.size).toBe(3); // 1 + 2 = 3
  });

  it('should evaluate complex binary expressions', () => {
    const code = 'cube(2 * 3 + 1);';
    console.log('Testing complex binary expression in cube:', code);

    const tree = parser.parse(code);
    expect(tree).toBeDefined();

    // Find the cube function call
    function findCubeNode(node: any): any {
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

    const cubeNode = findCubeNode(tree.rootNode);
    expect(cubeNode).not.toBeNull();

    console.log('Found cube node:', cubeNode.type, cubeNode.text);

    // Extract the cube with enhanced expression evaluation
    const cubeAST = extractCubeNode(cubeNode, errorHandler);

    console.log('Extracted cube AST:', JSON.stringify(cubeAST, null, 2));
    console.log('Error handler errors:', errorHandler.getErrors());

    expect(cubeAST).toBeDefined();
    expect(cubeAST?.size).toBe(7); // 2 * 3 + 1 = 7
  });

  it('should handle simple numbers without expression evaluation', () => {
    const code = 'cube(5);';
    console.log('Testing simple number in cube:', code);

    const tree = parser.parse(code);
    expect(tree).toBeDefined();

    // Find the cube function call
    function findCubeNode(node: any): any {
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

    const cubeNode = findCubeNode(tree.rootNode);
    expect(cubeNode).not.toBeNull();

    console.log('Found cube node:', cubeNode.type, cubeNode.text);

    // Extract the cube with enhanced expression evaluation
    const cubeAST = extractCubeNode(cubeNode, errorHandler);

    console.log('Extracted cube AST:', JSON.stringify(cubeAST, null, 2));
    console.log('Error handler errors:', errorHandler.getErrors());

    expect(cubeAST).toBeDefined();
    expect(cubeAST?.size).toBe(5); // Simple number
  });
});
