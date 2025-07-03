import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Node as TSNode } from 'web-tree-sitter';

import { UnaryExpressionVisitor } from './unary-expression-visitor.js';
import { ExpressionVisitor } from '../../expression-visitor.js';
import { ErrorHandler } from '../../../../error-handling/index.js';
import { OpenscadParser } from '../../../../openscad-parser.js';

async function getExpressionNode(parser: EnhancedOpenscadParser, code: string): Promise<TSNode | null> {
  const tree = parser.parse(code);
  if (!tree) return null;

  let unaryExprNode: TSNode | null = null;
  function findNode(node: TSNode) {
    if (node.type === 'unary_expression') {
      unaryExprNode = node;
      return;
    }
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (child) {
        findNode(child);
        if (unaryExprNode) return;
      }
    }
  }
  findNode(tree.rootNode);
  return unaryExprNode;
}

describe('UnaryExpressionVisitor', () => {
  let parser: OpenscadParser;
  let errorHandler: ErrorHandler;
  let parentExpressionVisitor: ExpressionVisitor;
  let visitor: UnaryExpressionVisitor;

  beforeEach(async () => {
    // Create a new parser instance before each test
    parser = new OpenscadParser();

    // Initialize the parser
    await parser.init();

    errorHandler = new ErrorHandler();
    parentExpressionVisitor = new ExpressionVisitor('dummy source', errorHandler);
    visitor = new UnaryExpressionVisitor(parentExpressionVisitor, errorHandler);
  });

  afterEach(() => {
    // Clean up after each test
    parser.dispose();
  });

  it('should parse a simple negation expression', async () => {
    const code = 'x = -y;'; // Example: -y
    const tsNode = await getExpressionNode(parser, code);
    expect(tsNode).not.toBeNull();
    if (!tsNode) return;

    const astNode = visitor.visit(tsNode);

    expect(astNode).toEqual({
      type: 'expression',
      expressionType: 'unary_expression',
      operator: '-',
      operand: {
        type: 'expression',
        expressionType: 'variable',
        name: 'y',
        location: expect.anything(),
      },
      prefix: true,
      location: expect.anything(),
    });
    expect(errorHandler.getErrors()).toHaveLength(0);
  });

  it('should parse a simple logical not expression', async () => {
    const code = 'x = !z;'; // Example: !z
    const tsNode = await getExpressionNode(parser, code);
    expect(tsNode).not.toBeNull();
    if (!tsNode) return;

    const astNode = visitor.visit(tsNode);

    expect(astNode).toEqual({
      type: 'expression',
      expressionType: 'unary_expression',
      operator: '!',
      operand: {
        type: 'expression',
        expressionType: 'variable',
        name: 'z',
        location: expect.anything(),
      },
      prefix: true,
      location: expect.anything(),
    });
    expect(errorHandler.getErrors()).toHaveLength(0);
  });

  it('should parse a negation of a function call', async () => {
    const code = 'x = -sin(90);'; // Example: -sin(90)
    const tsNode = await getExpressionNode(parser, code);
    expect(tsNode).not.toBeNull();
    if (!tsNode) return;

    const astNode = visitor.visit(tsNode);

    expect(astNode).toEqual({
      type: 'expression',
      expressionType: 'unary_expression',
      operator: '-',
      operand: {
        type: 'expression',
        expressionType: 'function_call',
        functionName: 'sin',
        args: [
          {
            name: undefined, // Positional arguments have undefined name
            value: {
              type: 'expression',
              expressionType: 'literal',
              value: 90
              // Location is optional on LiteralNode and seems to be missing here
            }
            // No location directly on the Parameter object itself
          },
        ],
        location: expect.anything(), 
      },
      prefix: true,
      location: expect.anything(),
    });
    expect(errorHandler.getErrors()).toHaveLength(0);
  });
});
