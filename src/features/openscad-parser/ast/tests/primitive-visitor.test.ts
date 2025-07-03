import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PrimitiveVisitor } from '../visitors/primitive-visitor.js';
import { Node as TSNode } from 'web-tree-sitter';
import * as ast from '../ast-types.js';
import { ErrorHandler } from '../../error-handling/index.js';
import { EnhancedOpenscadParser } from '../../enhanced-parser.js';

// Create a test class that extends PrimitiveVisitor to expose the private methods
class TestPrimitiveVisitor extends PrimitiveVisitor {
  public testCreateCubeNode(
    node: TSNode,
    args: ast.Parameter[]
  ): ast.CubeNode | null {
    // @ts-expect-error - Accessing private method for testing
    return this.createCubeNode(node, args);
  }
}

// Mock the TSNode for testing
const createMockNode = (text: string): TSNode => {
  const mockNode = {
    text,
    tree: {
      rootNode: {
        text,
      },
    },
  } as unknown as TSNode;

  return mockNode;
};

// Create a mock ErrorHandler for testing
const mockErrorHandler = new ErrorHandler();

describe('PrimitiveVisitor', () => {
  let parser: EnhancedOpenscadParser;

  beforeEach(async () => {
    // Create a new parser instance before each test
    parser = new EnhancedOpenscadParser();

    // Initialize the parser
    await parser.init();
  });

  afterEach(() => {
    // Clean up after each test
    parser.dispose();
  });

  describe('createCubeNode', () => {
    it('should create a cube node with size parameter', () => {
      // Create a mock node
      const mockNode = createMockNode('cube(10);');

      // Create a mock visitor with source code
      const visitor = new TestPrimitiveVisitor('cube(10);', mockErrorHandler);

      // Create mock arguments
      const args: ast.Parameter[] = [
        {
          value: {
            type: 'expression',
            expressionType: 'literal',
            value: 10,
            location: {
              start: { line: 1, column: 5, offset: 5 },
              end: { line: 1, column: 7, offset: 7 },
            },
          },
        },
      ];

      // Call the method
      const result = visitor.testCreateCubeNode(mockNode, args);

      // Verify the result
      expect(result).toBeDefined();
      expect(result?.type).toBe('cube');
      expect(result?.size).toBe(10);
      expect(result?.center).toBe(false);
    });

    it('should create a cube node with center parameter', () => {
      // Create a mock node
      const mockNode = createMockNode('cube(10, center=true);');

      // Create a mock visitor with source code
      const visitor = new TestPrimitiveVisitor('cube(10, center=true);', mockErrorHandler);

      // Create mock arguments
      const args: ast.Parameter[] = [
        {
          value: {
            type: 'expression',
            expressionType: 'literal',
            value: 10,
            location: {
              start: { line: 1, column: 5, offset: 5 },
              end: { line: 1, column: 7, offset: 7 },
            },
          },
        },
        {
          name: 'center',
          value: {
            type: 'expression',
            expressionType: 'literal',
            value: true,
            location: {
              start: { line: 1, column: 15, offset: 15 },
              end: { line: 1, column: 19, offset: 19 },
            },
          },
        },
      ];

      // Call the method
      const result = visitor.testCreateCubeNode(mockNode, args);

      // Verify the result
      expect(result).toBeDefined();
      expect(result?.type).toBe('cube');
      expect(result?.size).toBe(10);
      expect(result?.center).toBe(true);
    });

    it('should create a cube node with named size parameter', () => {
      // Create a mock node
      const mockNode = createMockNode('cube(size=10);');

      // Create a mock visitor with source code
      const visitor = new TestPrimitiveVisitor('cube(size=10);', mockErrorHandler);

      // Create mock arguments
      const args: ast.Parameter[] = [
        {
          name: 'size',
          value: {
            type: 'expression',
            expressionType: 'literal',
            value: 10,
            location: {
              start: { line: 1, column: 10, offset: 10 },
              end: { line: 1, column: 12, offset: 12 },
            },
          },
        },
      ];

      // Call the method
      const result = visitor.testCreateCubeNode(mockNode, args);

      // Verify the result
      expect(result).toBeDefined();
      expect(result?.type).toBe('cube');
      expect(result?.size).toBe(10);
      expect(result?.center).toBe(false);
    });

    it('should create a cube node with vector size parameter', () => {
      // Create a mock node
      const mockNode = createMockNode('cube([10, 20, 30]);');

      // Create a mock visitor with source code
      const visitor = new TestPrimitiveVisitor('cube([10, 20, 30]);', mockErrorHandler);

      // Create mock arguments
      const args: ast.Parameter[] = [
        {
          value: {
            type: 'expression',
            expressionType: 'array',
            items: [
              {
                type: 'expression',
                expressionType: 'literal',
                value: 10,
                location: {
                  start: { line: 1, column: 6, offset: 6 },
                  end: { line: 1, column: 8, offset: 8 },
                },
              },
              {
                type: 'expression',
                expressionType: 'literal',
                value: 20,
                location: {
                  start: { line: 1, column: 10, offset: 10 },
                  end: { line: 1, column: 12, offset: 12 },
                },
              },
              {
                type: 'expression',
                expressionType: 'literal',
                value: 30,
                location: {
                  start: { line: 1, column: 14, offset: 14 },
                  end: { line: 1, column: 16, offset: 16 },
                },
              },
            ],
            location: {
              start: { line: 1, column: 5, offset: 5 },
              end: { line: 1, column: 17, offset: 17 },
            },
          },
        },
      ];

      // Call the method
      const result = visitor.testCreateCubeNode(mockNode, args);

      // Verify the result
      expect(result).toBeDefined();
      expect(result?.type).toBe('cube');
      expect(result?.size).toEqual([10, 20, 30]);
      expect(result?.center).toBe(false);
    });

    it('should create a cube node with default parameters when no arguments are provided', () => {
      // Create a mock node
      const mockNode = createMockNode('cube();');

      // Create a mock visitor with source code
      const visitor = new TestPrimitiveVisitor('cube();', mockErrorHandler);

      // Create mock arguments
      const args: ast.Parameter[] = [];

      // Call the method
      const result = visitor.testCreateCubeNode(mockNode, args);

      // Verify the result
      expect(result).toBeDefined();
      expect(result?.type).toBe('cube');
      expect(result?.size).toBe(1);
      expect(result?.center).toBe(false);
    });
  });
});
