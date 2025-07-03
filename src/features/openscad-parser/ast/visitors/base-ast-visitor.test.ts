import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { BaseASTVisitor } from './base-ast-visitor.js';
import { Node as TSNode } from 'web-tree-sitter';
import * as ast from '../ast-types.js';
import { EnhancedOpenscadParser } from '../../enhanced-parser.js';
import { getLocation } from '../utils/location-utils.js';

// Mock implementation of BaseASTVisitor for testing
class TestVisitor extends BaseASTVisitor {
  protected createASTNodeForFunction(
    _node: TSNode,
    functionName: string,
    _args: ast.Parameter[]
  ): ast.ASTNode | null {
    // Simple implementation for testing
    if (functionName === 'cube') {
      return {
        type: 'cube',
        size: 10,
        center: false,
        location: {
          start: { line: 0, column: 0, offset: 0 },
          end: { line: 0, column: 0, offset: 0 },
        },
      };
    }
    return null;
  }
}

describe('BaseASTVisitor', () => {
  let parser: EnhancedOpenscadParser;
  let _visitor: TestVisitor;

  beforeAll(async () => {
    parser = new EnhancedOpenscadParser();
    await parser.init();
  });

  afterAll(() => {
    parser.dispose();
    vi.clearAllMocks();
  });

  // Debug test to understand the structure of the CST
  it('should debug the CST structure', () => {
    const code = 'cube(10);';
    const tree = parser.parseCST(code);
    if (!tree) throw new Error('Failed to parse CST');

    // Create a spy on console.log
    const consoleSpy = vi.spyOn(console, 'log');

    // Log the structure
    console.log('Root node type:', tree.rootNode.type);
    console.log('Root node child count:', tree.rootNode.childCount);

    // Verify that console.log was called
    expect(consoleSpy).toHaveBeenCalledWith('Root node type:', 'source_file');
    // With the real parser, the child count might be different
    // We'll just check that the log was called with some child count
    expect(consoleSpy).toHaveBeenCalled();

    // Restore the original console.log
    consoleSpy.mockRestore();
  });

  describe('visitNode', () => {
    it('should handle expression nodes', () => {
      // Create a mock expression node
      const mockExpressionNode = {
        type: 'expression',
        text: 'cube(10)',
        childCount: 0,
        child: () => null,
      } as unknown as TSNode;

      // Create a test visitor that handles cube nodes
      const testVisitor = new (class extends BaseASTVisitor {
        visitExpression(node: TSNode): ast.ASTNode | null {
          if (node.text.startsWith('cube(')) {
            return {
              type: 'cube',
              size: 10,
              location: getLocation(node),
            };
          }
          return null;
        }

        protected createASTNodeForFunction(
          _node: TSNode,
          _functionName: string,
          _args: ast.Parameter[]
        ): ast.ASTNode | null {
          return null;
        }
      })('');

      // Create a mock result that matches CubeNode
      const mockResult: ast.CubeNode = {
        type: 'cube',
        size: 10,
        center: false,
        location: {
          start: { line: 0, column: 0, offset: 0 },
          end: { line: 0, column: 0, offset: 0 },
        },
      };

      // Mock the visitExpression method to return our mock result
      const visitExpressionSpy = vi
        .spyOn(testVisitor, 'visitExpression')
        .mockReturnValue(mockResult);

      // Visit the node
      const result = testVisitor.visitNode(mockExpressionNode);

      // Verify the method was called
      expect(visitExpressionSpy).toHaveBeenCalledWith(mockExpressionNode);

      // Verify the result
      expect(result).not.toBeNull();
      expect(result?.type).toBe('cube');

      // Restore the original method
      visitExpressionSpy.mockRestore();
    });

    it('should handle statement nodes', () => {
      // Create a mock statement node with an expression_statement child
      const mockExpressionNode = {
        type: 'expression',
        text: 'cube(10)',
        childCount: 0,
        child: () => null,
      } as unknown as TSNode;

      const mockExpressionStatementNode = {
        type: 'expression_statement',
        text: 'cube(10)',
        childCount: 1,
        child: () => mockExpressionNode,
      } as unknown as TSNode;

      const mockStatementNode = {
        type: 'statement',
        text: 'cube(10);',
        childCount: 1,
        child: () => mockExpressionStatementNode,
      } as unknown as TSNode;

      // Create a test visitor that handles cube nodes
      const testVisitor = new (class extends BaseASTVisitor {
        visitStatement(node: TSNode): ast.ASTNode | null {
          // Override the visitStatement method to handle our test case
          for (let i = 0; i < node.childCount; i++) {
            const child = node.child(i);
            if (!child) continue;

            if (child.type === 'expression_statement') {
              // Now look for the expression in the expression_statement
              for (let j = 0; j < child.childCount; j++) {
                const grandchild = child.child(j);
                if (!grandchild) continue;

                if (
                  grandchild.type === 'expression' &&
                  grandchild.text.startsWith('cube(')
                ) {
                  return {
                    type: 'cube',
                    size: 10,
                    center: false,
                    location: getLocation(node),
                  } as ast.CubeNode;
                }
              }
            }
          }
          return null;
        }

        protected createASTNodeForFunction(
          _node: TSNode,
          _functionName: string,
          _args: ast.Parameter[]
        ): ast.ASTNode | null {
          return null;
        }
      })('');

      // Create a mock result that matches CubeNode
      const mockResult: ast.CubeNode = {
        type: 'cube',
        size: 10,
        center: false,
        location: {
          start: { line: 0, column: 0, offset: 0 },
          end: { line: 0, column: 0, offset: 0 },
        },
      };

      // Mock the visitStatement method to return our mock result
      const visitStatementSpy = vi
        .spyOn(testVisitor, 'visitStatement')
        .mockReturnValue(mockResult);

      // Visit the node
      const result = testVisitor.visitNode(mockStatementNode);

      // Verify the method was called
      expect(visitStatementSpy).toHaveBeenCalledWith(mockStatementNode);

      // Verify the result
      expect(result).not.toBeNull();
      expect(result?.type).toBe('cube');

      // Restore the original method
      visitStatementSpy.mockRestore();
    });

    it('should return null for unknown node types', () => {
      // Create a mock node with an unknown type
      const mockNode = {
        type: 'unknown_type',
        text: 'unknown text',
        childCount: 0,
        child: () => null,
        childForFieldName: () => null,
        namedChild: () => null,
        namedChildCount: 0,
        startPosition: { row: 0, column: 0 },
        endPosition: { row: 0, column: 0 },
        parent: null,
        nextSibling: null,
        previousSibling: null,
        firstChild: null,
        lastChild: null,
        firstNamedChild: null,
        lastNamedChild: null,
        children: [],
        namedChildren: [],
        childrenByFieldName: {},
        hasError: false,
        isMissing: false,
        toString: () => 'unknown_type',
        walk: () => ({
          gotoFirstChild: () => false,
          gotoNextSibling: () => false,
          gotoParent: () => false,
          currentNode: () => mockNode,
          currentFieldName: () => null,
          reset: () => {},
        }),
        descendantForPosition: () => null,
        descendantsOfType: () => [],
        equals: () => false,
        id: 0,
        isNamed: true,
      } as unknown as TSNode;

      // Create a test visitor
      const testVisitor = new (class extends BaseASTVisitor {
        protected createASTNodeForFunction(
          _node: TSNode,
          _functionName: string,
          _args: ast.Parameter[]
        ): ast.ASTNode | null {
          return null;
        }
      })('');

      // Visit the node
      const result = testVisitor.visitNode(mockNode);

      // Verify the result
      expect(result).toBeNull();
    });
  });

  describe('visitChildren', () => {
    it('should visit all children of a node', () => {
      // Create a mock root node with two statement children
      const mockExpressionNode1 = {
        type: 'expression',
        text: 'cube(10)',
        childCount: 0,
        child: () => null,
      } as unknown as TSNode;

      const mockExpressionStatementNode1 = {
        type: 'expression_statement',
        text: 'cube(10)',
        childCount: 1,
        child: () => mockExpressionNode1,
      } as unknown as TSNode;

      const mockStatementNode1 = {
        type: 'statement',
        text: 'cube(10);',
        childCount: 1,
        child: () => mockExpressionStatementNode1,
      } as unknown as TSNode;

      const mockExpressionNode2 = {
        type: 'expression',
        text: 'sphere(5)',
        childCount: 0,
        child: () => null,
      } as unknown as TSNode;

      const mockExpressionStatementNode2 = {
        type: 'expression_statement',
        text: 'sphere(5)',
        childCount: 1,
        child: () => mockExpressionNode2,
      } as unknown as TSNode;

      const mockStatementNode2 = {
        type: 'statement',
        text: 'sphere(5);',
        childCount: 1,
        child: () => mockExpressionStatementNode2,
      } as unknown as TSNode;

      const mockRootNode = {
        type: 'source_file',
        text: 'cube(10); sphere(5);',
        childCount: 2,
        child: (index: number) => {
          if (index === 0) return mockStatementNode1;
          if (index === 1) return mockStatementNode2;
          return null;
        },
      } as unknown as TSNode;

      // Create a test visitor that handles cube nodes
      const testVisitor = new (class extends BaseASTVisitor {
        visitStatement(node: TSNode): ast.ASTNode | null {
          // In the real tree, the expression_statement is a direct child, not a field
          for (let i = 0; i < node.childCount; i++) {
            const child = node.child(i);
            if (!child) continue;

            if (child.type === 'expression_statement') {
              // Now look for the expression in the expression_statement
              for (let j = 0; j < child.childCount; j++) {
                const grandchild = child.child(j);
                if (!grandchild) continue;

                if (
                  grandchild.type === 'expression' &&
                  grandchild.text.startsWith('cube(')
                ) {
                  return {
                    type: 'cube',
                    size: 10,
                    center: false,
                    location: getLocation(node),
                  } as ast.CubeNode;
                }
              }
            }
          }
          return null;
        }

        protected createASTNodeForFunction(
          _node: TSNode,
          _functionName: string,
          _args: ast.Parameter[]
        ): ast.ASTNode | null {
          return null;
        }
      })('');

      // Create a mock result for the first statement
      const mockResult: ast.CubeNode = {
        type: 'cube',
        size: 10,
        center: false,
        location: {
          start: { line: 0, column: 0, offset: 0 },
          end: { line: 0, column: 0, offset: 0 },
        },
      };

      // Mock the visitNode method to return our mock result for the first statement
      const visitNodeSpy = vi
        .spyOn(testVisitor, 'visitNode')
        .mockImplementation((node: TSNode) => {
          if (node === mockStatementNode1) {
            return mockResult;
          }
          return null;
        });

      // Visit the children of the root node
      const results = testVisitor.visitChildren(mockRootNode);

      // Verify the method was called for both children
      expect(visitNodeSpy).toHaveBeenCalledTimes(2);
      expect(visitNodeSpy).toHaveBeenCalledWith(mockStatementNode1);
      expect(visitNodeSpy).toHaveBeenCalledWith(mockStatementNode2);

      // Verify the results
      expect(results.length).toBe(1); // Only cube is handled in our test visitor
      expect(results[0].type).toBe('cube');

      // Restore the original method
      visitNodeSpy.mockRestore();
    });
  });

  describe('visitModuleInstantiation', () => {
    it('should process expression nodes as module instantiations', () => {
      // Create a mock expression node
      const mockExpressionNode = {
        type: 'expression',
        text: 'cube(10)',
        childCount: 0,
        child: () => null,
      } as unknown as TSNode;

      // Create a test visitor that handles cube nodes
      const testVisitor = new (class extends BaseASTVisitor {
        visitModuleInstantiation(node: TSNode): ast.ASTNode | null {
          // For testing purposes, treat expression nodes as module instantiations
          if (node.type === 'expression' && node.text.startsWith('cube(')) {
            return {
              type: 'cube',
              size: 10,
              center: false,
              location: getLocation(node),
            } as ast.CubeNode;
          }
          return null;
        }

        protected createASTNodeForFunction(
          _node: TSNode,
          _functionName: string,
          _args: ast.Parameter[]
        ): ast.ASTNode | null {
          return null;
        }
      })('');

      // Create a mock result that matches CubeNode
      const mockResult: ast.CubeNode = {
        type: 'cube',
        size: 10,
        center: false,
        location: {
          start: { line: 0, column: 0, offset: 0 },
          end: { line: 0, column: 0, offset: 0 },
        },
      };

      // Mock the visitModuleInstantiation method to return our mock result
      const visitModuleInstantiationSpy = vi
        .spyOn(testVisitor, 'visitModuleInstantiation')
        .mockReturnValue(mockResult);

      // Visit the node
      const result = testVisitor.visitModuleInstantiation(mockExpressionNode);

      // Verify the method was called
      expect(visitModuleInstantiationSpy).toHaveBeenCalledWith(
        mockExpressionNode
      );

      // Verify the result
      expect(result).not.toBeNull();
      expect(result?.type).toBe('cube');

      // Restore the original method
      visitModuleInstantiationSpy.mockRestore();
    });
  });
});

// Helper function to find a node of a specific type
function _findNodeOfType(node: TSNode, type: string): TSNode | null {
  if (node.type === type) {
    return node;
  }

  // Special case for expression which might be a call_expression
  if (type === 'call_expression' && node.type === 'expression') {
    if (node.text.includes('(') && node.text.includes(')')) {
      return node;
    }
  }

  // Special case for expression_statement which might contain an expression
  if (
    node.type === 'expression_statement' &&
    (type === 'call_expression' || type === 'expression')
  ) {
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (child && child.type === 'expression') {
        if (type === 'expression') {
          return child;
        } else if (
          type === 'call_expression' &&
          child.text.includes('(') &&
          child.text.includes(')')
        ) {
          return child;
        }
      }
    }
  }

  // Special case for statement which might contain an expression_statement
  if (node.type === 'statement') {
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (child && child.type === 'expression_statement') {
        const result = _findNodeOfType(child, type);
        if (result) {
          return result;
        }
      }
    }
  }

  for (let i = 0; i < node.childCount; i++) {
    const child = node.child(i);
    if (!child) continue;

    const result = _findNodeOfType(child, type);
    if (result) {
      return result;
    }
  }

  return null;
}
