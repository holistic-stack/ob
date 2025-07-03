import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Node as TSNode } from 'web-tree-sitter';

import { ParenthesizedExpressionVisitor } from './parenthesized-expression-visitor.js';
import { ExpressionVisitor } from '../../expression-visitor.js';
import { ErrorHandler } from '../../../../error-handling/index.js';
import { OpenscadParser } from '../../../../openscad-parser.js';

async function getExpressionNode(parser: EnhancedOpenscadParser, code: string): Promise<TSNode | null> {
  const tree = parser.parse(code);
  if (!tree) return null;

  let parenExprNode: TSNode | null = null;
  function findNode(node: TSNode) {
    if (node.type === 'parenthesized_expression') {
      parenExprNode = node;
      return;
    }
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (child) {
        findNode(child);
        if (parenExprNode) return;
      }
    }
  }
  findNode(tree.rootNode);
  return parenExprNode;
}

describe('ParenthesizedExpressionVisitor', () => {
  let parser: OpenscadParser;
  let errorHandler: ErrorHandler;
  let parentExpressionVisitor: ExpressionVisitor;
  let visitor: ParenthesizedExpressionVisitor;

  beforeEach(async () => {
    // Create a new parser instance before each test
    parser = new OpenscadParser();

    // Initialize the parser
    await parser.init();

    errorHandler = new ErrorHandler();
    parentExpressionVisitor = new ExpressionVisitor('dummy source', errorHandler);
    visitor = new ParenthesizedExpressionVisitor(parentExpressionVisitor, errorHandler);
  });

  afterEach(() => {
    // Clean up after each test
    parser.dispose();
  });

  it('should parse a simple parenthesized expression (number literal)', async () => {
    const code = 'x = (123);';
    const tsNode = await getExpressionNode(parser, code);
    expect(tsNode).not.toBeNull();
    if (!tsNode) return;

    const astNode = visitor.visit(tsNode);

    // Expect the inner expression's AST node
    expect(astNode).toEqual({
      type: 'expression',
      expressionType: 'literal',
      literalType: 'number',
      value: 123,
      location: expect.anything(), // Location should ideally be of the inner expression
    });
    expect(errorHandler.getErrors()).toHaveLength(0);
  });

  it('should parse a parenthesized binary expression', async () => {
    const code = 'x = (a + b);';
    const tsNode = await getExpressionNode(parser, code);
    expect(tsNode).not.toBeNull();
    if (!tsNode) return;

    const astNode = visitor.visit(tsNode);

    expect(astNode).toEqual({
      type: 'expression',
      expressionType: 'binary',
      operator: '+',
      left: {
        type: 'expression',
        expressionType: 'variable',
        name: 'a',
        location: expect.anything(),
      },
      right: {
        type: 'expression',
        expressionType: 'variable',
        name: 'b',
        location: expect.anything(),
      },
      location: expect.anything(), // Location should ideally be of the inner binary expression
    });
    expect(errorHandler.getErrors()).toHaveLength(0);
  });
});
