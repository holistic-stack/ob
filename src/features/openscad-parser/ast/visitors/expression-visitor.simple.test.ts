import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { OpenscadParser } from '../../openscad-parser.js';
import { ExpressionVisitor } from './expression-visitor.js';
import { Node as TSNode } from 'web-tree-sitter';
import * as ast from '../ast-types.js';
import { ErrorHandler } from '../../error-handling/index.js';

describe('ExpressionVisitor Simple Tests', () => {
  let parser: OpenscadParser;
  let errorHandler: ErrorHandler;
  let visitor: ExpressionVisitor;

  beforeEach(async () => {
    parser = new OpenscadParser();
    await parser.init();
    errorHandler = new ErrorHandler();
    visitor = new ExpressionVisitor('', errorHandler);
  });

  afterEach(() => {
    parser.dispose();
  });

  it('should handle a simple binary expression', async () => {
    // Use a working pattern like other tests - binary expression inside function call
    const code = 'cube(1 + 2);';
    const tree = parser.parseCST(code);
    expect(tree).not.toBeNull();

    // Log the structure of the tree
    console.log('Root node type:', tree!.rootNode.type);
    console.log('Root node text:', tree!.rootNode.text);
    console.log('Root node child count:', tree!.rootNode.childCount);

    // Find the function call node (cube) - it's a module_instantiation in OpenSCAD
    const functionCallNode = findNodeOfType(
      tree!.rootNode,
      'module_instantiation'
    );
    expect(functionCallNode).not.toBeNull();

    if (functionCallNode) {
      // Find the binary expression node within the function arguments
      const binaryExpressionNode = findNodeOfType(functionCallNode, 'additive_expression') ||
                                   findNodeOfType(functionCallNode, 'binary_expression');
      expect(binaryExpressionNode).not.toBeNull();

      if (binaryExpressionNode) {
        // Process the binary expression directly
        const result = visitor.visitExpression(binaryExpressionNode);

        expect(result).not.toBeNull();
        expect(result?.type).toBe('expression');
        expect((result as ast.ExpressionNode).expressionType).toBe('binary');

        const binaryExpr = result as ast.BinaryExpressionNode;
        expect(binaryExpr.operator).toBe('+');
        expect(binaryExpr.left.expressionType).toBe('literal');
        expect((binaryExpr.left as ast.LiteralNode).value).toBe(1);
        expect(binaryExpr.right.expressionType).toBe('literal');
        expect((binaryExpr.right as ast.LiteralNode).value).toBe(2);
      }
    }
  });

  // Helper function to find a node of a specific type in the tree
  function findNodeOfType(node: TSNode, type: string): TSNode | null {
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

  // Helper function to print node structure for debugging
  function printNodeStructure(node: TSNode, depth: number): void {
    const indent = '  '.repeat(depth);
    console.log(`${indent}${node.type}: "${node.text}"`);
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (child) {
        printNodeStructure(child, depth + 1);
      }
    }
  }
});
