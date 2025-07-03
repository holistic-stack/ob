import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ExpressionVisitor } from './expression-visitor.js';
import { OpenscadParser } from '../../openscad-parser.js';
import { Node as TSNode } from 'web-tree-sitter';
import * as ast from '../ast-types.js';
import { ErrorHandler } from '../../error-handling/index.js';

describe('ExpressionVisitor', () => {
  let parser: EnhancedOpenscadParser;
  let visitor: ExpressionVisitor;
  let errorHandler: ErrorHandler;

  beforeEach(async () => {
    parser = new EnhancedOpenscadParser();
    await parser.init();
    errorHandler = new ErrorHandler();
    visitor = new ExpressionVisitor('', errorHandler);
  });

  afterEach(() => {
    parser.dispose();
  });


  describe('visitBinaryExpression', () => {
    it('should handle arithmetic binary expressions', async () => {
      // Mock the necessary methods
      vi.spyOn(visitor as any, 'createExpressionNode').mockImplementation(
        (node: any) => {
          if (node.text === '1') {
            return {
              type: 'expression',
              expressionType: 'literal',
              value: 1,
              location: {
                start: { line: 0, column: 0, offset: 0 },
                end: { line: 0, column: 1, offset: 1 },
              },
            } as ast.LiteralNode;
          } else if (node.text === '2') {
            return {
              type: 'expression',
              expressionType: 'literal',
              value: 2,
              location: {
                start: { line: 0, column: 4, offset: 4 },
                end: { line: 0, column: 5, offset: 5 },
              },
            } as ast.LiteralNode;
          }
          return null;
        }
      );

      // Mock the childForFieldName method
      const mockBinaryExprNode = {
        type: 'binary_expression',
        text: '1 + 2',
        startPosition: { row: 0, column: 0 },
        endPosition: { row: 0, column: 5 },
        startIndex: 0,
        endIndex: 5,
        childCount: 3,
        childForFieldName: (name: string) => {
          if (name === 'operator') {
            return { text: '+', type: 'operator' };
          } else if (name === 'left') {
            return { text: '1', type: 'number' };
          } else if (name === 'right') {
            return { text: '2', type: 'number' };
          }
          return null;
        },
        child: (index: number) => {
          if (index === 0) {
            return { text: '1', type: 'number' };
          } else if (index === 1) {
            return { text: '+', type: 'operator' };
          } else if (index === 2) {
            return { text: '2', type: 'number' };
          }
          return null;
        },
      } as unknown as TSNode;

      const result = visitor.visitBinaryExpression(mockBinaryExprNode);

      expect(result).not.toBeNull();
      expect(result?.type).toBe('expression');
      expect(result?.expressionType).toBe('binary');
      expect((result as ast.BinaryExpressionNode).operator).toBe('+');
      expect((result as ast.BinaryExpressionNode).left.expressionType).toBe(
        'literal'
      );
      expect((result as ast.BinaryExpressionNode).left.value).toBe(1);
      expect((result as ast.BinaryExpressionNode).right.expressionType).toBe(
        'literal'
      );
      expect((result as ast.BinaryExpressionNode).right.value).toBe(2);
    });

    it('should handle comparison binary expressions', async () => {
      const _code = 'x > 5;';

      // Mock the necessary methods
      vi.spyOn(visitor as any, 'createExpressionNode').mockImplementation(
        (node: any) => {
          if (node.text === 'x') {
            return {
              type: 'expression',
              expressionType: 'variable',
              name: 'x',
              location: {
                start: { line: 0, column: 0, offset: 0 },
                end: { line: 0, column: 1, offset: 1 },
              },
            } as ast.VariableNode;
          } else if (node.text === '5') {
            return {
              type: 'expression',
              expressionType: 'literal',
              value: 5,
              location: {
                start: { line: 0, column: 4, offset: 4 },
                end: { line: 0, column: 5, offset: 5 },
              },
            } as ast.LiteralNode;
          }
          return null;
        }
      );

      // Mock the childForFieldName method
      const mockBinaryExprNode = {
        type: 'binary_expression',
        text: 'x > 5',
        startPosition: { row: 0, column: 0 },
        endPosition: { row: 0, column: 5 },
        childForFieldName: (name: string) => {
          if (name === 'operator') {
            return { text: '>', type: 'greater' };
          } else if (name === 'left') {
            return { text: 'x', type: 'identifier' };
          } else if (name === 'right') {
            return { text: '5', type: 'number' };
          }
          return null;
        },
        child: (index: number) => {
          if (index === 0) {
            return { text: 'x', type: 'identifier' };
          } else if (index === 1) {
            return { text: '>', type: 'greater' };
          } else if (index === 2) {
            return { text: '5', type: 'number' };
          }
          return null;
        },
        childCount: 3,
      } as unknown as TSNode;

      const result = visitor.visitBinaryExpression(mockBinaryExprNode);

      expect(result).not.toBeNull();
      expect(result?.type).toBe('expression');
      expect(result?.expressionType).toBe('binary');
      expect((result as ast.BinaryExpressionNode).operator).toBe('>');
      expect((result as ast.BinaryExpressionNode).left.expressionType).toBe(
        'variable'
      );
      expect((result as ast.BinaryExpressionNode).left.name).toBe('x');
      expect((result as ast.BinaryExpressionNode).right.expressionType).toBe(
        'literal'
      );
      expect((result as ast.BinaryExpressionNode).right.value).toBe(5);
    });

    it('should handle logical binary expressions', async () => {
      const _code = 'true || false;';

      // Mock the necessary methods
      vi.spyOn(visitor as any, 'createExpressionNode').mockImplementation(
        (node: any) => {
          if (node.text === 'true') {
            return {
              type: 'expression',
              expressionType: 'literal',
              value: true,
              location: {
                start: { line: 0, column: 0, offset: 0 },
                end: { line: 0, column: 4, offset: 4 },
              },
            } as ast.LiteralNode;
          } else if (node.text === 'false') {
            return {
              type: 'expression',
              expressionType: 'literal',
              value: false,
              location: {
                start: { line: 0, column: 9, offset: 9 },
                end: { line: 0, column: 14, offset: 14 },
              },
            } as ast.LiteralNode;
          }
          return null;
        }
      );

      // Mock the childForFieldName method
      const mockBinaryExprNode = {
        type: 'binary_expression',
        text: 'true || false',
        startPosition: { row: 0, column: 0 },
        endPosition: { row: 0, column: 14 },
        childForFieldName: (name: string) => {
          if (name === 'operator') {
            return { text: '||', type: 'pipe_pipe' };
          } else if (name === 'left') {
            return { text: 'true', type: 'true' };
          } else if (name === 'right') {
            return { text: 'false', type: 'false' };
          }
          return null;
        },
        child: (index: number) => {
          if (index === 0) {
            return { text: 'true', type: 'true' };
          } else if (index === 1) {
            return { text: '||', type: 'pipe_pipe' };
          } else if (index === 2) {
            return { text: 'false', type: 'false' };
          }
          return null;
        },
        childCount: 3,
      } as unknown as TSNode;

      const result = visitor.visitBinaryExpression(mockBinaryExprNode);

      expect(result).not.toBeNull();
      expect(result?.type).toBe('expression');
      expect(result?.expressionType).toBe('binary');
      expect((result as ast.BinaryExpressionNode).operator).toBe('||');
      expect((result as ast.BinaryExpressionNode).left.expressionType).toBe(
        'literal'
      );
      expect((result as ast.BinaryExpressionNode).left.value).toBe(true);
      expect((result as ast.BinaryExpressionNode).right.expressionType).toBe(
        'literal'
      );
      expect((result as ast.BinaryExpressionNode).right.value).toBe(false);
    });
  });

  describe('visitUnaryExpression', () => {
    it('should handle negation unary expressions', async () => {
      const _code = '-5;';

      // Mock the necessary methods
      vi.spyOn(visitor as any, 'createExpressionNode').mockImplementation(
        (node: any) => {
          if (node.text === '5') {
            return {
              type: 'expression',
              expressionType: 'literal',
              value: 5,
              location: {
                start: { line: 0, column: 1, offset: 1 },
                end: { line: 0, column: 2, offset: 2 },
              },
            } as ast.LiteralNode;
          }
          return null;
        }
      );

      // Mock the childForFieldName method
      const mockUnaryExprNode = {
        type: 'unary_expression',
        text: '-5',
        startPosition: { row: 0, column: 0 },
        endPosition: { row: 0, column: 2 },
        startIndex: 0,
        endIndex: 2,
        childCount: 2,
        child: (index: number) => {
          if (index === 0) {
            return { text: '-', type: 'minus' } as unknown as TSNode;
          } else if (index === 1) {
            return { text: '5', type: 'number' } as unknown as TSNode;
          }
          return null;
        },
        childForFieldName: (name: string) => {
          if (name === 'operator') {
            return { text: '-', type: 'minus' } as unknown as TSNode;
          } else if (name === 'operand') {
            return { text: '5', type: 'number' } as unknown as TSNode;
          }
          return null;
        },
      } as unknown as TSNode;

      const result = visitor.visitUnaryExpression(mockUnaryExprNode);

      expect(result).not.toBeNull();
      expect(result?.type).toBe('expression');
      expect(result?.expressionType).toBe('unary');
      expect((result as ast.UnaryExpressionNode).operator).toBe('-');
      expect((result as ast.UnaryExpressionNode).operand.expressionType).toBe(
        'literal'
      );
      expect((result as ast.UnaryExpressionNode).operand.value).toBe(5);
    });

    it('should handle logical not unary expressions', async () => {
      const _code = '!true;';

      // Mock the necessary methods
      vi.spyOn(visitor as any, 'createExpressionNode').mockImplementation(
        (node: any) => {
          if (node.text === 'true') {
            return {
              type: 'expression',
              expressionType: 'literal',
              value: true,
              location: {
                start: { line: 0, column: 1, offset: 1 },
                end: { line: 0, column: 5, offset: 5 },
              },
            } as ast.LiteralNode;
          }
          return null;
        }
      );

      // Mock the childForFieldName method
      const mockUnaryExprNode = {
        type: 'unary_expression',
        text: '!true',
        startPosition: { row: 0, column: 0 },
        endPosition: { row: 0, column: 5 },
        startIndex: 0,
        endIndex: 5,
        childCount: 2,
        child: (index: number) => {
          if (index === 0) {
            return { text: '!', type: 'bang' } as unknown as TSNode;
          } else if (index === 1) {
            return { text: 'true', type: 'true' } as unknown as TSNode;
          }
          return null;
        },
        childForFieldName: (name: string) => {
          if (name === 'operator') {
            return { text: '!', type: 'bang' } as unknown as TSNode;
          } else if (name === 'operand') {
            return { text: 'true', type: 'true' } as unknown as TSNode;
          }
          return null;
        },
      } as unknown as TSNode;

      const result = visitor.visitUnaryExpression(mockUnaryExprNode);

      expect(result).not.toBeNull();
      expect(result?.type).toBe('expression');
      expect(result?.expressionType).toBe('unary');
      expect((result as ast.UnaryExpressionNode).operator).toBe('!');
      expect((result as ast.UnaryExpressionNode).operand.expressionType).toBe(
        'literal'
      );
      expect((result as ast.UnaryExpressionNode).operand.value).toBe(true);
    });
  });

  describe('visitConditionalExpression', () => {
    it('should handle ternary conditional expressions', async () => {
      const _code = 'x > 5 ? 10 : 20;';

      // Mock the necessary methods
      vi.spyOn(visitor as any, 'createExpressionNode').mockImplementation(
        (node: any) => {
          if (node.text === 'x > 5') {
            return {
              type: 'expression',
              expressionType: 'binary',
              operator: '>',
              left: {
                type: 'expression',
                expressionType: 'variable',
                name: 'x',
                location: {
                  start: { line: 0, column: 0, offset: 0 },
                  end: { line: 0, column: 1, offset: 1 },
                },
              } as ast.VariableNode,
              right: {
                type: 'expression',
                expressionType: 'literal',
                value: 5,
                location: {
                  start: { line: 0, column: 4, offset: 4 },
                  end: { line: 0, column: 5, offset: 5 },
                },
              } as ast.LiteralNode,
              location: {
                start: { line: 0, column: 0, offset: 0 },
                end: { line: 0, column: 5, offset: 5 },
              },
            } as ast.BinaryExpressionNode;
          } else if (node.text === '10') {
            return {
              type: 'expression',
              expressionType: 'literal',
              value: 10,
              location: {
                start: { line: 0, column: 8, offset: 8 },
                end: { line: 0, column: 10, offset: 10 },
              },
            } as ast.LiteralNode;
          } else if (node.text === '20') {
            return {
              type: 'expression',
              expressionType: 'literal',
              value: 20,
              location: {
                start: { line: 0, column: 13, offset: 13 },
                end: { line: 0, column: 15, offset: 15 },
              },
            } as ast.LiteralNode;
          }
          return null;
        }
      );

      // Mock the childForFieldName method
      const mockConditionalExprNode = {
        type: 'conditional_expression',
        text: 'x > 5 ? 10 : 20',
        startPosition: { row: 0, column: 0 },
        endPosition: { row: 0, column: 15 },
        childCount: 5,
        childForFieldName: (name: string) => {
          if (name === 'condition') {
            return {
              type: 'relational_expression',
              text: 'x > 5',
              childCount: 3,
              childForFieldName: (fieldName: string) => {
                if (fieldName === 'left') {
                  return { type: 'identifier', text: 'x' };
                } else if (fieldName === 'operator') {
                  return { type: '>', text: '>' };
                } else if (fieldName === 'right') {
                  return { type: 'number', text: '5' };
                }
                return null;
              },
              child: (index: number) => {
                if (index === 0) {
                  return { type: 'identifier', text: 'x' };
                } else if (index === 1) {
                  return { type: '>', text: '>' };
                } else if (index === 2) {
                  return { type: 'number', text: '5' };
                }
                return null;
              },
            };
          } else if (name === 'consequence') {
            return { type: 'number', text: '10' };
          } else if (name === 'alternative') {
            return { type: 'number', text: '20' };
          }
          return null;
        },
        child: (index: number) => {
          if (index === 0) {
            return {
              type: 'relational_expression',
              text: 'x > 5',
              childCount: 3,
              childForFieldName: (fieldName: string) => {
                if (fieldName === 'left') {
                  return { type: 'identifier', text: 'x' };
                } else if (fieldName === 'operator') {
                  return { type: '>', text: '>' };
                } else if (fieldName === 'right') {
                  return { type: 'number', text: '5' };
                }
                return null;
              },
              child: (index: number) => {
                if (index === 0) {
                  return { type: 'identifier', text: 'x' };
                } else if (index === 1) {
                  return { type: '>', text: '>' };
                } else if (index === 2) {
                  return { type: 'number', text: '5' };
                }
                return null;
              },
            };
          } else if (index === 1) {
            return { type: 'question', text: '?' };
          } else if (index === 2) {
            return { type: 'number', text: '10' };
          } else if (index === 3) {
            return { type: 'colon', text: ':' };
          } else if (index === 4) {
            return { type: 'number', text: '20' };
          }
          return null;
        },
      } as unknown as TSNode;

      const result = visitor.visitConditionalExpression(
        mockConditionalExprNode
      );

      expect(result).not.toBeNull();
      expect(result?.type).toBe('expression');
      expect(result?.expressionType).toBe('conditional');
      expect(
        (result as ast.ConditionalExpressionNode).condition.expressionType
      ).toBe('binary');
      expect(
        (result as ast.ConditionalExpressionNode).thenBranch.expressionType
      ).toBe('literal');
      expect((result as ast.ConditionalExpressionNode).thenBranch.value).toBe(
        10
      );
      expect(
        (result as ast.ConditionalExpressionNode).elseBranch.expressionType
      ).toBe('literal');
      expect((result as ast.ConditionalExpressionNode).elseBranch.value).toBe(
        20
      );
    });
  });

  describe('visitVariableReference', () => {
    it('should handle variable references', async () => {
      const mockVariableNode = {
        type: 'identifier',
        text: 'myVariable',
        startPosition: { row: 0, column: 0 },
        endPosition: { row: 0, column: 10 },
      } as unknown as TSNode;

      const result = visitor.visitExpression(mockVariableNode);

      expect(result).not.toBeNull();
      expect(result?.type).toBe('expression');
      expect(result?.expressionType).toBe('variable');
      expect((result as ast.VariableNode).name).toBe('myVariable');
    });
  });

  describe('visitLiteral', () => {
    it('should handle number literals', async () => {
      const mockNumberNode = {
        type: 'number_literal',
        text: '42',
        startPosition: { row: 0, column: 0 },
        endPosition: { row: 0, column: 2 },
      } as unknown as TSNode;

      const result = visitor.visitExpression(mockNumberNode);

      expect(result).not.toBeNull();
      expect(result?.type).toBe('expression');
      expect(result?.expressionType).toBe('literal');
      expect((result as ast.LiteralNode).value).toBe(42);
    });

    it('should handle string literals', async () => {
      const mockStringNode = {
        type: 'string_literal',
        text: '"hello"',
        startPosition: { row: 0, column: 0 },
        endPosition: { row: 0, column: 7 },
      } as unknown as TSNode;

      const result = visitor.visitExpression(mockStringNode);

      expect(result).not.toBeNull();
      expect(result?.type).toBe('expression');
      expect(result?.expressionType).toBe('literal');
      expect((result as ast.LiteralNode).value).toBe('hello');
    });

    it('should handle boolean literals', async () => {
      const mockBooleanNode = {
        type: 'boolean_literal',
        text: 'true',
        startPosition: { row: 0, column: 0 },
        endPosition: { row: 0, column: 4 },
      } as unknown as TSNode;

      const result = visitor.visitExpression(mockBooleanNode);

      expect(result).not.toBeNull();
      expect(result?.type).toBe('expression');
      expect(result?.expressionType).toBe('literal');
      expect((result as ast.LiteralNode).value).toBe(true);
    });
  });

  describe('visitArrayExpression', () => {
    it('should handle array expressions', async () => {
      // Mock the necessary methods
      vi.spyOn(visitor as any, 'createExpressionNode').mockImplementation(
        (node: any) => {
          if (node.text === '1') {
            return {
              type: 'expression',
              expressionType: 'literal',
              value: 1,
              location: {
                start: { line: 0, column: 1, offset: 1 },
                end: { line: 0, column: 2, offset: 2 },
              },
            } as ast.LiteralNode;
          } else if (node.text === '2') {
            return {
              type: 'expression',
              expressionType: 'literal',
              value: 2,
              location: {
                start: { line: 0, column: 4, offset: 4 },
                end: { line: 0, column: 5, offset: 5 },
              },
            } as ast.LiteralNode;
          } else if (node.text === '3') {
            return {
              type: 'expression',
              expressionType: 'literal',
              value: 3,
              location: {
                start: { line: 0, column: 7, offset: 7 },
                end: { line: 0, column: 8, offset: 8 },
              },
            } as ast.LiteralNode;
          }
          return null;
        }
      );

      // Mock the array node
      const mockArrayNode = {
        type: 'array_literal',
        text: '[1, 2, 3]',
        startPosition: { row: 0, column: 0 },
        endPosition: { row: 0, column: 9 },
        namedChildCount: 3,
        namedChild: (index: number) => {
          if (index === 0) {
            return { type: 'number', text: '1' };
          } else if (index === 1) {
            return { type: 'number', text: '2' };
          } else if (index === 2) {
            return { type: 'number', text: '3' };
          }
          return null;
        },
      } as unknown as TSNode;

      const result = visitor.visitExpression(mockArrayNode);

      expect(result).not.toBeNull();
      expect(result?.type).toBe('expression');
      expect(result?.expressionType).toBe('array');
      expect((result as ast.ArrayExpressionNode).items.length).toBe(3);
      expect((result as ast.ArrayExpressionNode).items[0].expressionType).toBe(
        'literal'
      );
      expect((result as ast.ArrayExpressionNode).items[0].value).toBe(1);
      expect((result as ast.ArrayExpressionNode).items[1].expressionType).toBe(
        'literal'
      );
      expect((result as ast.ArrayExpressionNode).items[1].value).toBe(2);
      expect((result as ast.ArrayExpressionNode).items[2].expressionType).toBe(
        'literal'
      );
      expect((result as ast.ArrayExpressionNode).items[2].value).toBe(3);
    });
  });

  // Helper function to find a binary expression node in the tree
  function _findBinaryExpressionNode(node: TSNode): TSNode | null {
    if (node.type === 'binary_expression') {
      return node;
    }

    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (!child) continue;

      const result = _findBinaryExpressionNode(child);
      if (result) {
        return result;
      }
    }

    return null;
  }
});
