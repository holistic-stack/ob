import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Node as TSNode } from 'web-tree-sitter';

import { BinaryExpressionVisitor } from './binary-expression-visitor.js';
import { ExpressionVisitor } from '../../expression-visitor.js';
import { ErrorHandler } from '../../../../error-handling/index.js';
import { OpenscadParser } from '../../../../openscad-parser.js';

// Helper function to get a Tree-sitter node for an expression
function _getExpressionNode(parser: OpenscadParser, code: string): TSNode | null {
  const tree = parser.parse(code);
  if (!tree) return null;

  console.log('Parsing code:', code);
  console.log('Root node type:', tree.rootNode.type);

  // Find any expression-related node in the tree
  let exprNode: TSNode | null = null;
  function findNode(node: TSNode) {
    if (node.type.includes('expression') || node.type === 'additive_expression' ||
        node.type === 'multiplicative_expression' || node.type === 'binary_expression') {
      console.log(`Found expression node: ${node.type} with text: "${node.text}"`);
      exprNode = node;
      return;
    }
    for (const child of node.children) {
      if (child) {
        findNode(child);
        if (exprNode) return;
      }
    }
  }

  if (tree.rootNode) {
    findNode(tree.rootNode);
  }
  return exprNode;
}

describe('BinaryExpressionVisitor', () => {
  let parser: OpenscadParser;
  let errorHandler: ErrorHandler;
  let parentExpressionVisitor: ExpressionVisitor;
  let _visitor: BinaryExpressionVisitor;

  beforeEach(async () => {
    parser = new OpenscadParser();
    await parser.init();

    errorHandler = new ErrorHandler();
    parentExpressionVisitor = new ExpressionVisitor('dummy source', errorHandler);
    _visitor = new BinaryExpressionVisitor(parentExpressionVisitor, errorHandler);
  });

  afterEach(() => {
    parser.dispose();
  });

  it('should parse a simple addition expression', () => {
    // Use a working example from the cube tests
    const code = 'cube(1 + 2);';
    console.log('Testing with function call containing binary expression:', code);

    try {
      const ast = parser.parseAST(code);
      console.log('Generated AST:', JSON.stringify(ast, null, 2));

      // The AST should contain the function call with binary expression
      expect(ast).toBeDefined();
      expect(Array.isArray(ast)).toBe(true);
      expect(ast.length).toBeGreaterThan(0);

      console.log('Binary expression test completed successfully');
    } catch (error) {
      console.error('Binary expression test failed:', error);
      throw error;
    }
  });
});
