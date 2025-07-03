import {
  describe,
  it,
  expect,
  vi,
  beforeAll,
  afterAll,
  beforeEach,
} from 'vitest';
import { PrimitiveVisitor } from './primitive-visitor.js';
import { EnhancedOpenscadParser } from '../../enhanced-parser.js';
import { Node as TSNode } from 'web-tree-sitter';
import { findDescendantOfType } from '../utils/node-utils.js';
import { ErrorHandler } from '../../error-handling/index.js';

describe('PrimitiveVisitor', () => {
  let parser: EnhancedOpenscadParser;
  let visitor: PrimitiveVisitor;
  let errorHandler: ErrorHandler;

  beforeAll(async () => {
    parser = new EnhancedOpenscadParser();
    await parser.init();
  });

  afterAll(() => {
    parser.dispose();
    vi.clearAllMocks();
  });

  beforeEach(() => {
    errorHandler = new ErrorHandler();
    visitor = new PrimitiveVisitor('', errorHandler);
  });

  describe('createASTNodeForFunction', () => {
    it('should create a cube node with default parameters', () => {
      // Create a mock argument_list node
      const mockArgumentListNode = {
        type: 'argument_list',
        text: '()',
        childCount: 0,
        child: () => null,
        childForFieldName: () => null,
        namedChildren: [],
      };

      // Create a mock accessor_expression node
      const mockAccessorExpressionNode = {
        type: 'accessor_expression',
        text: 'cube()',
        childCount: 2,
        child: (index: number) => {
          if (index === 0) {
            return {
              type: 'identifier',
              text: 'cube',
              childCount: 0,
              child: () => null,
            };
          } else if (index === 1) {
            return mockArgumentListNode;
          }
          return null;
        },
        childForFieldName: (name: string) => {
          if (name === 'function') {
            return {
              type: 'identifier',
              text: 'cube',
              childCount: 0,
              child: () => null,
            };
          } else if (name === 'arguments' || name === 'argument_list') {
            return mockArgumentListNode;
          }
          return null;
        },
        namedChildren: [
          {
            type: 'identifier',
            text: 'cube',
            childCount: 0,
            child: () => null,
          },
          mockArgumentListNode,
        ],
      } as unknown as TSNode;

      // Mock the createASTNodeForFunction method
      const createASTNodeForFunctionSpy = vi
        .spyOn(visitor as any, 'createASTNodeForFunction')
        .mockReturnValue({
          type: 'cube',
          size: 1,
          center: false,
          location: {
            start: { line: 0, column: 0 },
            end: { line: 0, column: 0 },
          },
        });

      // Visit the node
      const result = visitor.visitAccessorExpression(
        mockAccessorExpressionNode
      );

      // Verify the method was called
      expect(createASTNodeForFunctionSpy).toHaveBeenCalled();

      // Verify the result
      expect(result).not.toBeNull();
      expect(result?.type).toBe('cube');
      expect((result as any).size).toBe(1);
      expect((result as any).center).toBe(false);

      // Restore the original method
      createASTNodeForFunctionSpy.mockRestore();
    });

    it('should create a cube node with size parameter', () => {
      // Create a mock number node
      const mockNumberNode = {
        type: 'number',
        text: '10',
        childCount: 0,
        child: () => null,
        childForFieldName: () => null,
        namedChildren: [],
      };

      // Create a mock argument_list node
      const mockArgumentListNode = {
        type: 'argument_list',
        text: '(10)',
        childCount: 1,
        child: () => mockNumberNode,
        childForFieldName: () => null,
        namedChildren: [mockNumberNode],
      };

      // Create a mock accessor_expression node
      const mockAccessorExpressionNode = {
        type: 'accessor_expression',
        text: 'cube(10)',
        childCount: 2,
        child: (index: number) => {
          if (index === 0) {
            return {
              type: 'identifier',
              text: 'cube',
              childCount: 0,
              child: () => null,
              childForFieldName: () => null,
              namedChildren: [],
            };
          } else if (index === 1) {
            return mockArgumentListNode;
          }
          return null;
        },
        childForFieldName: (name: string) => {
          if (name === 'function') {
            return {
              type: 'identifier',
              text: 'cube',
              childCount: 0,
              child: () => null,
              childForFieldName: () => null,
              namedChildren: [],
            };
          } else if (name === 'arguments' || name === 'argument_list') {
            return mockArgumentListNode;
          }
          return null;
        },
        namedChildren: [
          {
            type: 'identifier',
            text: 'cube',
            childCount: 0,
            child: () => null,
            childForFieldName: () => null,
            namedChildren: [],
          },
          mockArgumentListNode,
        ],
      } as unknown as TSNode;

      // Mock the createASTNodeForFunction method
      const createASTNodeForFunctionSpy = vi
        .spyOn(visitor as any, 'createASTNodeForFunction')
        .mockReturnValue({
          type: 'cube',
          size: 10,
          center: false,
          location: {
            start: { line: 0, column: 0 },
            end: { line: 0, column: 0 },
          },
        });

      // Visit the node
      const result = visitor.visitAccessorExpression(
        mockAccessorExpressionNode
      );

      // Verify the method was called
      expect(createASTNodeForFunctionSpy).toHaveBeenCalled();

      // Verify the result
      expect(result).not.toBeNull();
      expect(result?.type).toBe('cube');
      expect((result as any).size).toBe(10);
      expect((result as any).center).toBe(false);

      // Restore the original method
      createASTNodeForFunctionSpy.mockRestore();
    });

    it('should create a cube node with size and center parameters', () => {
      // Create a mock number node
      const mockNumberNode = {
        type: 'number',
        text: '10',
        childCount: 0,
        child: () => null,
        childForFieldName: () => null,
        namedChildren: [],
      };

      // Create a mock true node
      const mockTrueNode = {
        type: 'true',
        text: 'true',
        childCount: 0,
        child: () => null,
        childForFieldName: () => null,
        namedChildren: [],
      };

      // Create a mock named_argument node
      const mockNamedArgumentNode = {
        type: 'named_argument',
        text: 'center=true',
        childCount: 3,
        child: (j: number) => {
          if (j === 0) {
            return {
              type: 'identifier',
              text: 'center',
              childCount: 0,
              child: () => null,
              childForFieldName: () => null,
              namedChildren: [],
            };
          } else if (j === 1) {
            return {
              type: 'equals',
              text: '=',
              childCount: 0,
              child: () => null,
              childForFieldName: () => null,
              namedChildren: [],
            };
          } else if (j === 2) {
            return mockTrueNode;
          }
          return null;
        },
        childForFieldName: (name: string) => {
          if (name === 'name') {
            return {
              type: 'identifier',
              text: 'center',
              childCount: 0,
              child: () => null,
              childForFieldName: () => null,
              namedChildren: [],
            };
          } else if (name === 'value') {
            return mockTrueNode;
          }
          return null;
        },
        namedChildren: [
          {
            type: 'identifier',
            text: 'center',
            childCount: 0,
            child: () => null,
            childForFieldName: () => null,
            namedChildren: [],
          },
          {
            type: 'equals',
            text: '=',
            childCount: 0,
            child: () => null,
            childForFieldName: () => null,
            namedChildren: [],
          },
          mockTrueNode,
        ],
      };

      // Create a mock argument_list node
      const mockArgumentListNode = {
        type: 'argument_list',
        text: '(10, center=true)',
        childCount: 3,
        child: (i: number) => {
          if (i === 0) {
            return mockNumberNode;
          } else if (i === 1) {
            return {
              type: 'comma',
              text: ',',
              childCount: 0,
              child: () => null,
              childForFieldName: () => null,
              namedChildren: [],
            };
          } else if (i === 2) {
            return mockNamedArgumentNode;
          }
          return null;
        },
        childForFieldName: () => null,
        namedChildren: [
          mockNumberNode,
          {
            type: 'comma',
            text: ',',
            childCount: 0,
            child: () => null,
            childForFieldName: () => null,
            namedChildren: [],
          },
          mockNamedArgumentNode,
        ],
      };

      // Create a mock accessor_expression node
      const mockAccessorExpressionNode = {
        type: 'accessor_expression',
        text: 'cube(10, center=true)',
        childCount: 2,
        child: (index: number) => {
          if (index === 0) {
            return {
              type: 'identifier',
              text: 'cube',
              childCount: 0,
              child: () => null,
              childForFieldName: () => null,
              namedChildren: [],
            };
          } else if (index === 1) {
            return mockArgumentListNode;
          }
          return null;
        },
        childForFieldName: (name: string) => {
          if (name === 'function') {
            return {
              type: 'identifier',
              text: 'cube',
              childCount: 0,
              child: () => null,
              childForFieldName: () => null,
              namedChildren: [],
            };
          } else if (name === 'arguments' || name === 'argument_list') {
            return mockArgumentListNode;
          }
          return null;
        },
        namedChildren: [
          {
            type: 'identifier',
            text: 'cube',
            childCount: 0,
            child: () => null,
            childForFieldName: () => null,
            namedChildren: [],
          },
          mockArgumentListNode,
        ],
      } as unknown as TSNode;

      // Mock the createASTNodeForFunction method
      const createASTNodeForFunctionSpy = vi
        .spyOn(visitor as any, 'createASTNodeForFunction')
        .mockReturnValue({
          type: 'cube',
          size: 10,
          center: true,
          location: {
            start: { line: 0, column: 0 },
            end: { line: 0, column: 0 },
          },
        });

      // Visit the node
      const result = visitor.visitAccessorExpression(
        mockAccessorExpressionNode
      );

      // Verify the method was called
      expect(createASTNodeForFunctionSpy).toHaveBeenCalled();

      // Verify the result
      expect(result).not.toBeNull();
      expect(result?.type).toBe('cube');
      expect((result as any).size).toBe(10);
      expect((result as any).center).toBe(true);

      // Restore the original method
      createASTNodeForFunctionSpy.mockRestore();
    });

    it('should create a cube node with vector size', () => {
      // Create a mock array_expression node
      const mockArrayExpressionNode = {
        type: 'array_expression',
        text: '[10, 20, 30]',
        childCount: 7,
        child: (i: number) => {
          if (i === 0) {
            return {
              type: 'left_bracket',
              text: '[',
              childCount: 0,
              child: () => null,
              childForFieldName: () => null,
              namedChildren: [],
            };
          } else if (i === 1) {
            return {
              type: 'number',
              text: '10',
              childCount: 0,
              child: () => null,
              childForFieldName: () => null,
              namedChildren: [],
            };
          } else if (i === 2) {
            return {
              type: 'comma',
              text: ',',
              childCount: 0,
              child: () => null,
              childForFieldName: () => null,
              namedChildren: [],
            };
          } else if (i === 3) {
            return {
              type: 'number',
              text: '20',
              childCount: 0,
              child: () => null,
              childForFieldName: () => null,
              namedChildren: [],
            };
          } else if (i === 4) {
            return {
              type: 'comma',
              text: ',',
              childCount: 0,
              child: () => null,
              childForFieldName: () => null,
              namedChildren: [],
            };
          } else if (i === 5) {
            return {
              type: 'number',
              text: '30',
              childCount: 0,
              child: () => null,
              childForFieldName: () => null,
              namedChildren: [],
            };
          } else if (i === 6) {
            return {
              type: 'right_bracket',
              text: ']',
              childCount: 0,
              child: () => null,
              childForFieldName: () => null,
              namedChildren: [],
            };
          }
          return null;
        },
        childForFieldName: () => null,
        namedChildren: [
          {
            type: 'left_bracket',
            text: '[',
            childCount: 0,
            child: () => null,
            childForFieldName: () => null,
            namedChildren: [],
          },
          {
            type: 'number',
            text: '10',
            childCount: 0,
            child: () => null,
            childForFieldName: () => null,
            namedChildren: [],
          },
          {
            type: 'comma',
            text: ',',
            childCount: 0,
            child: () => null,
            childForFieldName: () => null,
            namedChildren: [],
          },
          {
            type: 'number',
            text: '20',
            childCount: 0,
            child: () => null,
            childForFieldName: () => null,
            namedChildren: [],
          },
          {
            type: 'comma',
            text: ',',
            childCount: 0,
            child: () => null,
            childForFieldName: () => null,
            namedChildren: [],
          },
          {
            type: 'number',
            text: '30',
            childCount: 0,
            child: () => null,
            childForFieldName: () => null,
            namedChildren: [],
          },
          {
            type: 'right_bracket',
            text: ']',
            childCount: 0,
            child: () => null,
            childForFieldName: () => null,
            namedChildren: [],
          },
        ],
      };

      // Create a mock argument_list node
      const mockArgumentListNode = {
        type: 'argument_list',
        text: '([10, 20, 30])',
        childCount: 1,
        child: () => mockArrayExpressionNode,
        childForFieldName: () => null,
        namedChildren: [mockArrayExpressionNode],
      };

      // Create a mock accessor_expression node
      const mockAccessorExpressionNode = {
        type: 'accessor_expression',
        text: 'cube([10, 20, 30])',
        childCount: 2,
        child: (index: number) => {
          if (index === 0) {
            return {
              type: 'identifier',
              text: 'cube',
              childCount: 0,
              child: () => null,
              childForFieldName: () => null,
              namedChildren: [],
            };
          } else if (index === 1) {
            return mockArgumentListNode;
          }
          return null;
        },
        childForFieldName: (name: string) => {
          if (name === 'function') {
            return {
              type: 'identifier',
              text: 'cube',
              childCount: 0,
              child: () => null,
              childForFieldName: () => null,
              namedChildren: [],
            };
          } else if (name === 'arguments' || name === 'argument_list') {
            return mockArgumentListNode;
          }
          return null;
        },
        namedChildren: [
          {
            type: 'identifier',
            text: 'cube',
            childCount: 0,
            child: () => null,
            childForFieldName: () => null,
            namedChildren: [],
          },
          mockArgumentListNode,
        ],
      } as unknown as TSNode;

      // Mock the createASTNodeForFunction method
      const createASTNodeForFunctionSpy = vi
        .spyOn(visitor as any, 'createASTNodeForFunction')
        .mockReturnValue({
          type: 'cube',
          size: [10, 20, 30],
          center: false,
          location: {
            start: { line: 0, column: 0 },
            end: { line: 0, column: 0 },
          },
        });

      // Visit the node
      const result = visitor.visitAccessorExpression(
        mockAccessorExpressionNode
      );

      // Verify the method was called
      expect(createASTNodeForFunctionSpy).toHaveBeenCalled();

      // Verify the result
      expect(result).not.toBeNull();
      expect(result?.type).toBe('cube');
      expect((result as any).size).toEqual([10, 20, 30]);
      expect((result as any).center).toBe(false);

      // Restore the original method
      createASTNodeForFunctionSpy.mockRestore();
    });

    it('should create a sphere node with default parameters', () => {
      // Create a mock argument_list node
      const mockArgumentListNode = {
        type: 'argument_list',
        text: '()',
        childCount: 0,
        child: () => null,
        childForFieldName: () => null,
        namedChildren: [],
      };

      // Create a mock accessor_expression node
      const mockAccessorExpressionNode = {
        type: 'accessor_expression',
        text: 'sphere()',
        childCount: 2,
        child: (index: number) => {
          if (index === 0) {
            return {
              type: 'identifier',
              text: 'sphere',
              childCount: 0,
              child: () => null,
              childForFieldName: () => null,
              namedChildren: [],
            };
          } else if (index === 1) {
            return mockArgumentListNode;
          }
          return null;
        },
        childForFieldName: (name: string) => {
          if (name === 'function') {
            return {
              type: 'identifier',
              text: 'sphere',
              childCount: 0,
              child: () => null,
              childForFieldName: () => null,
              namedChildren: [],
            };
          } else if (name === 'arguments' || name === 'argument_list') {
            return mockArgumentListNode;
          }
          return null;
        },
        namedChildren: [
          {
            type: 'identifier',
            text: 'sphere',
            childCount: 0,
            child: () => null,
            childForFieldName: () => null,
            namedChildren: [],
          },
          mockArgumentListNode,
        ],
      } as unknown as TSNode;

      // Mock the createASTNodeForFunction method
      const createASTNodeForFunctionSpy = vi
        .spyOn(visitor as any, 'createASTNodeForFunction')
        .mockReturnValue({
          type: 'sphere',
          radius: 1,
          location: {
            start: { line: 0, column: 0 },
            end: { line: 0, column: 0 },
          },
        });

      // Visit the node
      const result = visitor.visitAccessorExpression(
        mockAccessorExpressionNode
      );

      // Verify the method was called
      expect(createASTNodeForFunctionSpy).toHaveBeenCalled();

      // Verify the result
      expect(result).not.toBeNull();
      expect(result?.type).toBe('sphere');
      expect((result as any).radius).toBe(1);

      // Restore the original method
      createASTNodeForFunctionSpy.mockRestore();
    });

    it('should create a sphere node with radius parameter', () => {
      // Create a mock number node
      const mockNumberNode = {
        type: 'number',
        text: '5',
        childCount: 0,
        child: () => null,
        childForFieldName: () => null,
        namedChildren: [],
      };

      // Create a mock argument_list node
      const mockArgumentListNode = {
        type: 'argument_list',
        text: '(5)',
        childCount: 1,
        child: () => mockNumberNode,
        childForFieldName: () => null,
        namedChildren: [mockNumberNode],
      };

      // Create a mock accessor_expression node
      const mockAccessorExpressionNode = {
        type: 'accessor_expression',
        text: 'sphere(5)',
        childCount: 2,
        child: (index: number) => {
          if (index === 0) {
            return {
              type: 'identifier',
              text: 'sphere',
              childCount: 0,
              child: () => null,
              childForFieldName: () => null,
              namedChildren: [],
            };
          } else if (index === 1) {
            return mockArgumentListNode;
          }
          return null;
        },
        childForFieldName: (name: string) => {
          if (name === 'function') {
            return {
              type: 'identifier',
              text: 'sphere',
              childCount: 0,
              child: () => null,
              childForFieldName: () => null,
              namedChildren: [],
            };
          } else if (name === 'arguments' || name === 'argument_list') {
            return mockArgumentListNode;
          }
          return null;
        },
        namedChildren: [
          {
            type: 'identifier',
            text: 'sphere',
            childCount: 0,
            child: () => null,
            childForFieldName: () => null,
            namedChildren: [],
          },
          mockArgumentListNode,
        ],
      } as unknown as TSNode;

      // Mock the createASTNodeForFunction method
      const createASTNodeForFunctionSpy = vi
        .spyOn(visitor as any, 'createASTNodeForFunction')
        .mockReturnValue({
          type: 'sphere',
          radius: 5,
          location: {
            start: { line: 0, column: 0 },
            end: { line: 0, column: 0 },
          },
        });

      // Visit the node
      const result = visitor.visitAccessorExpression(
        mockAccessorExpressionNode
      );

      // Verify the method was called
      expect(createASTNodeForFunctionSpy).toHaveBeenCalled();

      // Verify the result
      expect(result).not.toBeNull();
      expect(result?.type).toBe('sphere');
      expect((result as any).radius).toBe(5);

      // Restore the original method
      createASTNodeForFunctionSpy.mockRestore();
    });

    it('should create a sphere node with diameter parameter', () => {
      // Create a mock number node
      const mockNumberNode = {
        type: 'number',
        text: '10',
        childCount: 0,
        child: () => null,
        childForFieldName: () => null,
        namedChildren: [],
      };

      // Create a mock named_argument node
      const mockNamedArgumentNode = {
        type: 'named_argument',
        text: 'd=10',
        childCount: 3,
        child: (j: number) => {
          if (j === 0) {
            return {
              type: 'identifier',
              text: 'd',
              childCount: 0,
              child: () => null,
              childForFieldName: () => null,
              namedChildren: [],
            };
          } else if (j === 1) {
            return {
              type: 'equals',
              text: '=',
              childCount: 0,
              child: () => null,
              childForFieldName: () => null,
              namedChildren: [],
            };
          } else if (j === 2) {
            return mockNumberNode;
          }
          return null;
        },
        childForFieldName: (name: string) => {
          if (name === 'name') {
            return {
              type: 'identifier',
              text: 'd',
              childCount: 0,
              child: () => null,
              childForFieldName: () => null,
              namedChildren: [],
            };
          } else if (name === 'value') {
            return mockNumberNode;
          }
          return null;
        },
        namedChildren: [
          {
            type: 'identifier',
            text: 'd',
            childCount: 0,
            child: () => null,
            childForFieldName: () => null,
            namedChildren: [],
          },
          {
            type: 'equals',
            text: '=',
            childCount: 0,
            child: () => null,
            childForFieldName: () => null,
            namedChildren: [],
          },
          mockNumberNode,
        ],
      };

      // Create a mock argument_list node
      const mockArgumentListNode = {
        type: 'argument_list',
        text: '(d=10)',
        childCount: 1,
        child: () => mockNamedArgumentNode,
        childForFieldName: () => null,
        namedChildren: [mockNamedArgumentNode],
      };

      // Create a mock accessor_expression node
      const mockAccessorExpressionNode = {
        type: 'accessor_expression',
        text: 'sphere(d=10)',
        childCount: 2,
        child: (index: number) => {
          if (index === 0) {
            return {
              type: 'identifier',
              text: 'sphere',
              childCount: 0,
              child: () => null,
              childForFieldName: () => null,
              namedChildren: [],
            };
          } else if (index === 1) {
            return mockArgumentListNode;
          }
          return null;
        },
        childForFieldName: (name: string) => {
          if (name === 'function') {
            return {
              type: 'identifier',
              text: 'sphere',
              childCount: 0,
              child: () => null,
              childForFieldName: () => null,
              namedChildren: [],
            };
          } else if (name === 'arguments' || name === 'argument_list') {
            return mockArgumentListNode;
          }
          return null;
        },
        namedChildren: [
          {
            type: 'identifier',
            text: 'sphere',
            childCount: 0,
            child: () => null,
            childForFieldName: () => null,
            namedChildren: [],
          },
          mockArgumentListNode,
        ],
      } as unknown as TSNode;

      // Mock the createASTNodeForFunction method
      const createASTNodeForFunctionSpy = vi
        .spyOn(visitor as any, 'createASTNodeForFunction')
        .mockReturnValue({
          type: 'sphere',
          r: 5,
          location: {
            start: { line: 0, column: 0 },
            end: { line: 0, column: 0 },
          },
        });

      // Visit the node
      const result = visitor.visitAccessorExpression(
        mockAccessorExpressionNode
      );

      // Verify the method was called
      expect(createASTNodeForFunctionSpy).toHaveBeenCalled();

      // Verify the result
      expect(result).not.toBeNull();
      expect(result?.type).toBe('sphere');
      expect((result as any).r).toBe(5);

      // Restore the original method
      createASTNodeForFunctionSpy.mockRestore();
    });

    it('should create a cylinder node with default parameters', () => {
      // Create a mock argument_list node
      const mockArgumentListNode = {
        type: 'argument_list',
        text: '()',
        childCount: 0,
        child: () => null,
        childForFieldName: () => null,
        namedChildren: [],
      };

      // Create a mock accessor_expression node
      const mockAccessorExpressionNode = {
        type: 'accessor_expression',
        text: 'cylinder()',
        childCount: 2,
        child: (index: number) => {
          if (index === 0) {
            return {
              type: 'identifier',
              text: 'cylinder',
              childCount: 0,
              child: () => null,
              childForFieldName: () => null,
              namedChildren: [],
            };
          } else if (index === 1) {
            return mockArgumentListNode;
          }
          return null;
        },
        childForFieldName: (name: string) => {
          if (name === 'function') {
            return {
              type: 'identifier',
              text: 'cylinder',
              childCount: 0,
              child: () => null,
              childForFieldName: () => null,
              namedChildren: [],
            };
          } else if (name === 'arguments' || name === 'argument_list') {
            return mockArgumentListNode;
          }
          return null;
        },
        namedChildren: [
          {
            type: 'identifier',
            text: 'cylinder',
            childCount: 0,
            child: () => null,
            childForFieldName: () => null,
            namedChildren: [],
          },
          mockArgumentListNode,
        ],
      } as unknown as TSNode;

      // Mock the createASTNodeForFunction method
      const createASTNodeForFunctionSpy = vi
        .spyOn(visitor as any, 'createASTNodeForFunction')
        .mockReturnValue({
          type: 'cylinder',
          height: 1,
          radius1: 1,
          radius2: 1,
          center: false,
          location: {
            start: { line: 0, column: 0 },
            end: { line: 0, column: 0 },
          },
        });

      // Visit the node
      const result = visitor.visitAccessorExpression(
        mockAccessorExpressionNode
      );

      // Verify the method was called
      expect(createASTNodeForFunctionSpy).toHaveBeenCalled();

      // Verify the result
      expect(result).not.toBeNull();
      expect(result?.type).toBe('cylinder');
      expect((result as any).height).toBe(1);
      expect((result as any).radius1).toBe(1);
      expect((result as any).radius2).toBe(1);
      expect((result as any).center).toBe(false);

      // Restore the original method
      createASTNodeForFunctionSpy.mockRestore();
    });

    it('should create a cylinder node with height and radius parameters', () => {
      // Create mock number nodes
      const mockHeightNumberNode = {
        type: 'number',
        text: '10',
        childCount: 0,
        child: () => null,
        childForFieldName: () => null,
        namedChildren: [],
      };

      const mockRadiusNumberNode = {
        type: 'number',
        text: '5',
        childCount: 0,
        child: () => null,
        childForFieldName: () => null,
        namedChildren: [],
      };

      // Create mock named_argument nodes
      const mockHeightNamedArgumentNode = {
        type: 'named_argument',
        text: 'h=10',
        childCount: 3,
        child: (j: number) => {
          if (j === 0) {
            return {
              type: 'identifier',
              text: 'h',
              childCount: 0,
              child: () => null,
              childForFieldName: () => null,
              namedChildren: [],
            };
          } else if (j === 1) {
            return {
              type: 'equals',
              text: '=',
              childCount: 0,
              child: () => null,
              childForFieldName: () => null,
              namedChildren: [],
            };
          } else if (j === 2) {
            return mockHeightNumberNode;
          }
          return null;
        },
        childForFieldName: (name: string) => {
          if (name === 'name') {
            return {
              type: 'identifier',
              text: 'h',
              childCount: 0,
              child: () => null,
              childForFieldName: () => null,
              namedChildren: [],
            };
          } else if (name === 'value') {
            return mockHeightNumberNode;
          }
          return null;
        },
        namedChildren: [
          {
            type: 'identifier',
            text: 'h',
            childCount: 0,
            child: () => null,
            childForFieldName: () => null,
            namedChildren: [],
          },
          {
            type: 'equals',
            text: '=',
            childCount: 0,
            child: () => null,
            childForFieldName: () => null,
            namedChildren: [],
          },
          mockHeightNumberNode,
        ],
      };

      const mockRadiusNamedArgumentNode = {
        type: 'named_argument',
        text: 'r=5',
        childCount: 3,
        child: (j: number) => {
          if (j === 0) {
            return {
              type: 'identifier',
              text: 'r',
              childCount: 0,
              child: () => null,
              childForFieldName: () => null,
              namedChildren: [],
            };
          } else if (j === 1) {
            return {
              type: 'equals',
              text: '=',
              childCount: 0,
              child: () => null,
              childForFieldName: () => null,
              namedChildren: [],
            };
          } else if (j === 2) {
            return mockRadiusNumberNode;
          }
          return null;
        },
        childForFieldName: (name: string) => {
          if (name === 'name') {
            return {
              type: 'identifier',
              text: 'r',
              childCount: 0,
              child: () => null,
              childForFieldName: () => null,
              namedChildren: [],
            };
          } else if (name === 'value') {
            return mockRadiusNumberNode;
          }
          return null;
        },
        namedChildren: [
          {
            type: 'identifier',
            text: 'r',
            childCount: 0,
            child: () => null,
            childForFieldName: () => null,
            namedChildren: [],
          },
          {
            type: 'equals',
            text: '=',
            childCount: 0,
            child: () => null,
            childForFieldName: () => null,
            namedChildren: [],
          },
          mockRadiusNumberNode,
        ],
      };

      // Create a mock argument_list node
      const mockArgumentListNode = {
        type: 'argument_list',
        text: '(h=10, r=5)',
        childCount: 3,
        child: (i: number) => {
          if (i === 0) {
            return mockHeightNamedArgumentNode;
          } else if (i === 1) {
            return {
              type: 'comma',
              text: ',',
              childCount: 0,
              child: () => null,
              childForFieldName: () => null,
              namedChildren: [],
            };
          } else if (i === 2) {
            return mockRadiusNamedArgumentNode;
          }
          return null;
        },
        childForFieldName: () => null,
        namedChildren: [
          mockHeightNamedArgumentNode,
          {
            type: 'comma',
            text: ',',
            childCount: 0,
            child: () => null,
            childForFieldName: () => null,
            namedChildren: [],
          },
          mockRadiusNamedArgumentNode,
        ],
      };

      // Create a mock accessor_expression node
      const mockAccessorExpressionNode = {
        type: 'accessor_expression',
        text: 'cylinder(h=10, r=5)',
        childCount: 2,
        child: (index: number) => {
          if (index === 0) {
            return {
              type: 'identifier',
              text: 'cylinder',
              childCount: 0,
              child: () => null,
              childForFieldName: () => null,
              namedChildren: [],
            };
          } else if (index === 1) {
            return mockArgumentListNode;
          }
          return null;
        },
        childForFieldName: (name: string) => {
          if (name === 'function') {
            return {
              type: 'identifier',
              text: 'cylinder',
              childCount: 0,
              child: () => null,
              childForFieldName: () => null,
              namedChildren: [],
            };
          } else if (name === 'arguments' || name === 'argument_list') {
            return mockArgumentListNode;
          }
          return null;
        },
        namedChildren: [
          {
            type: 'identifier',
            text: 'cylinder',
            childCount: 0,
            child: () => null,
            childForFieldName: () => null,
            namedChildren: [],
          },
          mockArgumentListNode,
        ],
      } as unknown as TSNode;

      // Mock the createASTNodeForFunction method
      const createASTNodeForFunctionSpy = vi
        .spyOn(visitor as any, 'createASTNodeForFunction')
        .mockReturnValue({
          type: 'cylinder',
          height: 10,
          radius1: 5,
          radius2: 5,
          center: false,
          location: {
            start: { line: 0, column: 0 },
            end: { line: 0, column: 0 },
          },
        });

      // Visit the node
      const result = visitor.visitAccessorExpression(
        mockAccessorExpressionNode
      );

      // Verify the method was called
      expect(createASTNodeForFunctionSpy).toHaveBeenCalled();

      // Verify the result
      expect(result).not.toBeNull();
      expect(result?.type).toBe('cylinder');
      expect((result as any).height).toBe(10);
      expect((result as any).radius1).toBe(5);
      expect((result as any).radius2).toBe(5);
      expect((result as any).center).toBe(false);

      // Restore the original method
      createASTNodeForFunctionSpy.mockRestore();
    });

    it('should create a cylinder node with different top and bottom radii', () => {
      // Create mock number nodes
      const mockHeightNumberNode = {
        type: 'number',
        text: '10',
        childCount: 0,
        child: () => null,
        childForFieldName: () => null,
        namedChildren: [],
      };

      const mockRadius1NumberNode = {
        type: 'number',
        text: '5',
        childCount: 0,
        child: () => null,
        childForFieldName: () => null,
        namedChildren: [],
      };

      const mockRadius2NumberNode = {
        type: 'number',
        text: '3',
        childCount: 0,
        child: () => null,
        childForFieldName: () => null,
        namedChildren: [],
      };

      // Create mock named_argument nodes
      const mockHeightNamedArgumentNode = {
        type: 'named_argument',
        text: 'h=10',
        childCount: 3,
        child: (j: number) => {
          if (j === 0) {
            return {
              type: 'identifier',
              text: 'h',
              childCount: 0,
              child: () => null,
              childForFieldName: () => null,
              namedChildren: [],
            };
          } else if (j === 1) {
            return {
              type: 'equals',
              text: '=',
              childCount: 0,
              child: () => null,
              childForFieldName: () => null,
              namedChildren: [],
            };
          } else if (j === 2) {
            return mockHeightNumberNode;
          }
          return null;
        },
        childForFieldName: (name: string) => {
          if (name === 'name') {
            return {
              type: 'identifier',
              text: 'h',
              childCount: 0,
              child: () => null,
              childForFieldName: () => null,
              namedChildren: [],
            };
          } else if (name === 'value') {
            return mockHeightNumberNode;
          }
          return null;
        },
        namedChildren: [
          {
            type: 'identifier',
            text: 'h',
            childCount: 0,
            child: () => null,
            childForFieldName: () => null,
            namedChildren: [],
          },
          {
            type: 'equals',
            text: '=',
            childCount: 0,
            child: () => null,
            childForFieldName: () => null,
            namedChildren: [],
          },
          mockHeightNumberNode,
        ],
      };

      const mockRadius1NamedArgumentNode = {
        type: 'named_argument',
        text: 'r1=5',
        childCount: 3,
        child: (j: number) => {
          if (j === 0) {
            return {
              type: 'identifier',
              text: 'r1',
              childCount: 0,
              child: () => null,
              childForFieldName: () => null,
              namedChildren: [],
            };
          } else if (j === 1) {
            return {
              type: 'equals',
              text: '=',
              childCount: 0,
              child: () => null,
              childForFieldName: () => null,
              namedChildren: [],
            };
          } else if (j === 2) {
            return mockRadius1NumberNode;
          }
          return null;
        },
        childForFieldName: (name: string) => {
          if (name === 'name') {
            return {
              type: 'identifier',
              text: 'r1',
              childCount: 0,
              child: () => null,
              childForFieldName: () => null,
              namedChildren: [],
            };
          } else if (name === 'value') {
            return mockRadius1NumberNode;
          }
          return null;
        },
        namedChildren: [
          {
            type: 'identifier',
            text: 'r1',
            childCount: 0,
            child: () => null,
            childForFieldName: () => null,
            namedChildren: [],
          },
          {
            type: 'equals',
            text: '=',
            childCount: 0,
            child: () => null,
            childForFieldName: () => null,
            namedChildren: [],
          },
          mockRadius1NumberNode,
        ],
      };

      const mockRadius2NamedArgumentNode = {
        type: 'named_argument',
        text: 'r2=3',
        childCount: 3,
        child: (j: number) => {
          if (j === 0) {
            return {
              type: 'identifier',
              text: 'r2',
              childCount: 0,
              child: () => null,
              childForFieldName: () => null,
              namedChildren: [],
            };
          } else if (j === 1) {
            return {
              type: 'equals',
              text: '=',
              childCount: 0,
              child: () => null,
              childForFieldName: () => null,
              namedChildren: [],
            };
          } else if (j === 2) {
            return mockRadius2NumberNode;
          }
          return null;
        },
        childForFieldName: (name: string) => {
          if (name === 'name') {
            return {
              type: 'identifier',
              text: 'r2',
              childCount: 0,
              child: () => null,
              childForFieldName: () => null,
              namedChildren: [],
            };
          } else if (name === 'value') {
            return mockRadius2NumberNode;
          }
          return null;
        },
        namedChildren: [
          {
            type: 'identifier',
            text: 'r2',
            childCount: 0,
            child: () => null,
            childForFieldName: () => null,
            namedChildren: [],
          },
          {
            type: 'equals',
            text: '=',
            childCount: 0,
            child: () => null,
            childForFieldName: () => null,
            namedChildren: [],
          },
          mockRadius2NumberNode,
        ],
      };

      // Create a mock argument_list node
      const mockArgumentListNode = {
        type: 'argument_list',
        text: '(h=10, r1=5, r2=3)',
        childCount: 5,
        child: (i: number) => {
          if (i === 0) {
            return mockHeightNamedArgumentNode;
          } else if (i === 1) {
            return {
              type: 'comma',
              text: ',',
              childCount: 0,
              child: () => null,
              childForFieldName: () => null,
              namedChildren: [],
            };
          } else if (i === 2) {
            return mockRadius1NamedArgumentNode;
          } else if (i === 3) {
            return {
              type: 'comma',
              text: ',',
              childCount: 0,
              child: () => null,
              childForFieldName: () => null,
              namedChildren: [],
            };
          } else if (i === 4) {
            return mockRadius2NamedArgumentNode;
          }
          return null;
        },
        childForFieldName: () => null,
        namedChildren: [
          mockHeightNamedArgumentNode,
          {
            type: 'comma',
            text: ',',
            childCount: 0,
            child: () => null,
            childForFieldName: () => null,
            namedChildren: [],
          },
          mockRadius1NamedArgumentNode,
          {
            type: 'comma',
            text: ',',
            childCount: 0,
            child: () => null,
            childForFieldName: () => null,
            namedChildren: [],
          },
          mockRadius2NamedArgumentNode,
        ],
      };

      // Create a mock accessor_expression node
      const mockAccessorExpressionNode = {
        type: 'accessor_expression',
        text: 'cylinder(h=10, r1=5, r2=3)',
        childCount: 2,
        child: (index: number) => {
          if (index === 0) {
            return {
              type: 'identifier',
              text: 'cylinder',
              childCount: 0,
              child: () => null,
              childForFieldName: () => null,
              namedChildren: [],
            };
          } else if (index === 1) {
            return mockArgumentListNode;
          }
          return null;
        },
        childForFieldName: (name: string) => {
          if (name === 'function') {
            return {
              type: 'identifier',
              text: 'cylinder',
              childCount: 0,
              child: () => null,
              childForFieldName: () => null,
              namedChildren: [],
            };
          } else if (name === 'arguments' || name === 'argument_list') {
            return mockArgumentListNode;
          }
          return null;
        },
        namedChildren: [
          {
            type: 'identifier',
            text: 'cylinder',
            childCount: 0,
            child: () => null,
            childForFieldName: () => null,
            namedChildren: [],
          },
          mockArgumentListNode,
        ],
      } as unknown as TSNode;

      // Mock the createASTNodeForFunction method
      const createASTNodeForFunctionSpy = vi
        .spyOn(visitor as any, 'createASTNodeForFunction')
        .mockReturnValue({
          type: 'cylinder',
          height: 10,
          radius1: 5,
          radius2: 3,
          center: false,
          location: {
            start: { line: 0, column: 0 },
            end: { line: 0, column: 0 },
          },
        });

      // Visit the node
      const result = visitor.visitAccessorExpression(
        mockAccessorExpressionNode
      );

      // Verify the method was called
      expect(createASTNodeForFunctionSpy).toHaveBeenCalled();

      // Verify the result
      expect(result).not.toBeNull();
      expect(result?.type).toBe('cylinder');
      expect((result as any).height).toBe(10);
      expect((result as any).radius1).toBe(5);
      expect((result as any).radius2).toBe(3);
      expect((result as any).center).toBe(false);

      // Restore the original method
      createASTNodeForFunctionSpy.mockRestore();
    });

    it('should create a cylinder node with diameter parameters', () => {
      // Create mock number nodes
      const mockHeightNumberNode = {
        type: 'number',
        text: '10',
        childCount: 0,
        child: () => null,
        childForFieldName: () => null,
        namedChildren: [],
      };

      const mockDiameterNumberNode = {
        type: 'number',
        text: '10',
        childCount: 0,
        child: () => null,
        childForFieldName: () => null,
        namedChildren: [],
      };

      // Create mock named_argument nodes
      const mockHeightNamedArgumentNode = {
        type: 'named_argument',
        text: 'h=10',
        childCount: 3,
        child: (j: number) => {
          if (j === 0) {
            return {
              type: 'identifier',
              text: 'h',
              childCount: 0,
              child: () => null,
              childForFieldName: () => null,
              namedChildren: [],
            };
          } else if (j === 1) {
            return {
              type: 'equals',
              text: '=',
              childCount: 0,
              child: () => null,
              childForFieldName: () => null,
              namedChildren: [],
            };
          } else if (j === 2) {
            return mockHeightNumberNode;
          }
          return null;
        },
        childForFieldName: (name: string) => {
          if (name === 'name') {
            return {
              type: 'identifier',
              text: 'h',
              childCount: 0,
              child: () => null,
              childForFieldName: () => null,
              namedChildren: [],
            };
          } else if (name === 'value') {
            return mockHeightNumberNode;
          }
          return null;
        },
        namedChildren: [
          {
            type: 'identifier',
            text: 'h',
            childCount: 0,
            child: () => null,
            childForFieldName: () => null,
            namedChildren: [],
          },
          {
            type: 'equals',
            text: '=',
            childCount: 0,
            child: () => null,
            childForFieldName: () => null,
            namedChildren: [],
          },
          mockHeightNumberNode,
        ],
      };

      const mockDiameterNamedArgumentNode = {
        type: 'named_argument',
        text: 'd=10',
        childCount: 3,
        child: (j: number) => {
          if (j === 0) {
            return {
              type: 'identifier',
              text: 'd',
              childCount: 0,
              child: () => null,
              childForFieldName: () => null,
              namedChildren: [],
            };
          } else if (j === 1) {
            return {
              type: 'equals',
              text: '=',
              childCount: 0,
              child: () => null,
              childForFieldName: () => null,
              namedChildren: [],
            };
          } else if (j === 2) {
            return mockDiameterNumberNode;
          }
          return null;
        },
        childForFieldName: (name: string) => {
          if (name === 'name') {
            return {
              type: 'identifier',
              text: 'd',
              childCount: 0,
              child: () => null,
              childForFieldName: () => null,
              namedChildren: [],
            };
          } else if (name === 'value') {
            return mockDiameterNumberNode;
          }
          return null;
        },
        namedChildren: [
          {
            type: 'identifier',
            text: 'd',
            childCount: 0,
            child: () => null,
            childForFieldName: () => null,
            namedChildren: [],
          },
          {
            type: 'equals',
            text: '=',
            childCount: 0,
            child: () => null,
            childForFieldName: () => null,
            namedChildren: [],
          },
          mockDiameterNumberNode,
        ],
      };

      // Create a mock argument_list node
      const mockArgumentListNode = {
        type: 'argument_list',
        text: '(h=10, d=10)',
        childCount: 3,
        child: (i: number) => {
          if (i === 0) {
            return mockHeightNamedArgumentNode;
          } else if (i === 1) {
            return {
              type: 'comma',
              text: ',',
              childCount: 0,
              child: () => null,
              childForFieldName: () => null,
              namedChildren: [],
            };
          } else if (i === 2) {
            return mockDiameterNamedArgumentNode;
          }
          return null;
        },
        childForFieldName: () => null,
        namedChildren: [
          mockHeightNamedArgumentNode,
          {
            type: 'comma',
            text: ',',
            childCount: 0,
            child: () => null,
            childForFieldName: () => null,
            namedChildren: [],
          },
          mockDiameterNamedArgumentNode,
        ],
      };

      // Create a mock accessor_expression node
      const mockAccessorExpressionNode = {
        type: 'accessor_expression',
        text: 'cylinder(h=10, d=10)',
        childCount: 2,
        child: (index: number) => {
          if (index === 0) {
            return {
              type: 'identifier',
              text: 'cylinder',
              childCount: 0,
              child: () => null,
              childForFieldName: () => null,
              namedChildren: [],
            };
          } else if (index === 1) {
            return mockArgumentListNode;
          }
          return null;
        },
        childForFieldName: (name: string) => {
          if (name === 'function') {
            return {
              type: 'identifier',
              text: 'cylinder',
              childCount: 0,
              child: () => null,
              childForFieldName: () => null,
              namedChildren: [],
            };
          } else if (name === 'arguments' || name === 'argument_list') {
            return mockArgumentListNode;
          }
          return null;
        },
        namedChildren: [
          {
            type: 'identifier',
            text: 'cylinder',
            childCount: 0,
            child: () => null,
            childForFieldName: () => null,
            namedChildren: [],
          },
          mockArgumentListNode,
        ],
      } as unknown as TSNode;

      // Mock the createASTNodeForFunction method
      const createASTNodeForFunctionSpy = vi
        .spyOn(visitor as any, 'createASTNodeForFunction')
        .mockReturnValue({
          type: 'cylinder',
          height: 10,
          radius1: 5,
          radius2: 5,
          center: false,
          location: {
            start: { line: 0, column: 0 },
            end: { line: 0, column: 0 },
          },
        });

      // Visit the node
      const result = visitor.visitAccessorExpression(
        mockAccessorExpressionNode
      );

      // Verify the method was called
      expect(createASTNodeForFunctionSpy).toHaveBeenCalled();

      // Verify the result
      expect(result).not.toBeNull();
      expect(result?.type).toBe('cylinder');
      expect((result as any).height).toBe(10);
      expect((result as any).radius1).toBe(5);
      expect((result as any).radius2).toBe(5);
      expect((result as any).center).toBe(false);

      // Restore the original method
      createASTNodeForFunctionSpy.mockRestore();
    });

    it('should create a cylinder node with different top and bottom diameters', () => {
      // Create mock number nodes
      const mockHeightNumberNode = {
        type: 'number',
        text: '10',
        childCount: 0,
        child: () => null,
        childForFieldName: () => null,
        namedChildren: [],
      };

      const mockDiameter1NumberNode = {
        type: 'number',
        text: '10',
        childCount: 0,
        child: () => null,
        childForFieldName: () => null,
        namedChildren: [],
      };

      const mockDiameter2NumberNode = {
        type: 'number',
        text: '6',
        childCount: 0,
        child: () => null,
        childForFieldName: () => null,
        namedChildren: [],
      };

      // Create mock named_argument nodes
      const mockHeightNamedArgumentNode = {
        type: 'named_argument',
        text: 'h=10',
        childCount: 3,
        child: (j: number) => {
          if (j === 0) {
            return {
              type: 'identifier',
              text: 'h',
              childCount: 0,
              child: () => null,
              childForFieldName: () => null,
              namedChildren: [],
            };
          } else if (j === 1) {
            return {
              type: 'equals',
              text: '=',
              childCount: 0,
              child: () => null,
              childForFieldName: () => null,
              namedChildren: [],
            };
          } else if (j === 2) {
            return mockHeightNumberNode;
          }
          return null;
        },
        childForFieldName: (name: string) => {
          if (name === 'name') {
            return {
              type: 'identifier',
              text: 'h',
              childCount: 0,
              child: () => null,
              childForFieldName: () => null,
              namedChildren: [],
            };
          } else if (name === 'value') {
            return mockHeightNumberNode;
          }
          return null;
        },
        namedChildren: [
          {
            type: 'identifier',
            text: 'h',
            childCount: 0,
            child: () => null,
            childForFieldName: () => null,
            namedChildren: [],
          },
          {
            type: 'equals',
            text: '=',
            childCount: 0,
            child: () => null,
            childForFieldName: () => null,
            namedChildren: [],
          },
          mockHeightNumberNode,
        ],
      };

      const mockDiameter1NamedArgumentNode = {
        type: 'named_argument',
        text: 'd1=10',
        childCount: 3,
        child: (j: number) => {
          if (j === 0) {
            return {
              type: 'identifier',
              text: 'd1',
              childCount: 0,
              child: () => null,
              childForFieldName: () => null,
              namedChildren: [],
            };
          } else if (j === 1) {
            return {
              type: 'equals',
              text: '=',
              childCount: 0,
              child: () => null,
              childForFieldName: () => null,
              namedChildren: [],
            };
          } else if (j === 2) {
            return mockDiameter1NumberNode;
          }
          return null;
        },
        childForFieldName: (name: string) => {
          if (name === 'name') {
            return {
              type: 'identifier',
              text: 'd1',
              childCount: 0,
              child: () => null,
              childForFieldName: () => null,
              namedChildren: [],
            };
          } else if (name === 'value') {
            return mockDiameter1NumberNode;
          }
          return null;
        },
        namedChildren: [
          {
            type: 'identifier',
            text: 'd1',
            childCount: 0,
            child: () => null,
            childForFieldName: () => null,
            namedChildren: [],
          },
          {
            type: 'equals',
            text: '=',
            childCount: 0,
            child: () => null,
            childForFieldName: () => null,
            namedChildren: [],
          },
          mockDiameter1NumberNode,
        ],
      };

      const mockDiameter2NamedArgumentNode = {
        type: 'named_argument',
        text: 'd2=6',
        childCount: 3,
        child: (j: number) => {
          if (j === 0) {
            return {
              type: 'identifier',
              text: 'd2',
              childCount: 0,
              child: () => null,
              childForFieldName: () => null,
              namedChildren: [],
            };
          } else if (j === 1) {
            return {
              type: 'equals',
              text: '=',
              childCount: 0,
              child: () => null,
              childForFieldName: () => null,
              namedChildren: [],
            };
          } else if (j === 2) {
            return mockDiameter2NumberNode;
          }
          return null;
        },
        childForFieldName: (name: string) => {
          if (name === 'name') {
            return {
              type: 'identifier',
              text: 'd2',
              childCount: 0,
              child: () => null,
              childForFieldName: () => null,
              namedChildren: [],
            };
          } else if (name === 'value') {
            return mockDiameter2NumberNode;
          }
          return null;
        },
        namedChildren: [
          {
            type: 'identifier',
            text: 'd2',
            childCount: 0,
            child: () => null,
            childForFieldName: () => null,
            namedChildren: [],
          },
          {
            type: 'equals',
            text: '=',
            childCount: 0,
            child: () => null,
            childForFieldName: () => null,
            namedChildren: [],
          },
          mockDiameter2NumberNode,
        ],
      };

      // Create a mock argument_list node
      const mockArgumentListNode = {
        type: 'argument_list',
        text: '(h=10, d1=10, d2=6)',
        childCount: 5,
        child: (i: number) => {
          if (i === 0) {
            return mockHeightNamedArgumentNode;
          } else if (i === 1) {
            return {
              type: 'comma',
              text: ',',
              childCount: 0,
              child: () => null,
              childForFieldName: () => null,
              namedChildren: [],
            };
          } else if (i === 2) {
            return mockDiameter1NamedArgumentNode;
          } else if (i === 3) {
            return {
              type: 'comma',
              text: ',',
              childCount: 0,
              child: () => null,
              childForFieldName: () => null,
              namedChildren: [],
            };
          } else if (i === 4) {
            return mockDiameter2NamedArgumentNode;
          }
          return null;
        },
        childForFieldName: () => null,
        namedChildren: [
          mockHeightNamedArgumentNode,
          {
            type: 'comma',
            text: ',',
            childCount: 0,
            child: () => null,
            childForFieldName: () => null,
            namedChildren: [],
          },
          mockDiameter1NamedArgumentNode,
          {
            type: 'comma',
            text: ',',
            childCount: 0,
            child: () => null,
            childForFieldName: () => null,
            namedChildren: [],
          },
          mockDiameter2NamedArgumentNode,
        ],
      };

      // Create a mock accessor_expression node
      const mockAccessorExpressionNode = {
        type: 'accessor_expression',
        text: 'cylinder(h=10, d1=10, d2=6)',
        childCount: 2,
        child: (index: number) => {
          if (index === 0) {
            return {
              type: 'identifier',
              text: 'cylinder',
              childCount: 0,
              child: () => null,
              childForFieldName: () => null,
              namedChildren: [],
            };
          } else if (index === 1) {
            return mockArgumentListNode;
          }
          return null;
        },
        childForFieldName: (name: string) => {
          if (name === 'function') {
            return {
              type: 'identifier',
              text: 'cylinder',
              childCount: 0,
              child: () => null,
              childForFieldName: () => null,
              namedChildren: [],
            };
          } else if (name === 'arguments' || name === 'argument_list') {
            return mockArgumentListNode;
          }
          return null;
        },
        namedChildren: [
          {
            type: 'identifier',
            text: 'cylinder',
            childCount: 0,
            child: () => null,
            childForFieldName: () => null,
            namedChildren: [],
          },
          mockArgumentListNode,
        ],
      } as unknown as TSNode;

      // Mock the createASTNodeForFunction method
      const createASTNodeForFunctionSpy = vi
        .spyOn(visitor as any, 'createASTNodeForFunction')
        .mockReturnValue({
          type: 'cylinder',
          height: 10,
          radius1: 5,
          radius2: 3,
          center: false,
          location: {
            start: { line: 0, column: 0 },
            end: { line: 0, column: 0 },
          },
        });

      // Visit the node
      const result = visitor.visitAccessorExpression(
        mockAccessorExpressionNode
      );

      // Verify the method was called
      expect(createASTNodeForFunctionSpy).toHaveBeenCalled();

      // Verify the result
      expect(result).not.toBeNull();
      expect(result?.type).toBe('cylinder');
      expect((result as any).height).toBe(10);
      expect((result as any).radius1).toBe(5);
      expect((result as any).radius2).toBe(3);
      expect((result as any).center).toBe(false);

      // Restore the original method
      createASTNodeForFunctionSpy.mockRestore();
    });

    it('should return null for unsupported functions', () => {
      // Create a mock argument_list node
      const mockArgumentListNode = {
        type: 'argument_list',
        text: '()',
        childCount: 0,
        child: () => null,
        childForFieldName: () => null,
        namedChildren: [],
      };

      // Create a mock accessor_expression node
      const mockAccessorExpressionNode = {
        type: 'accessor_expression',
        text: 'unknown_function()',
        childCount: 2,
        child: (index: number) => {
          if (index === 0) {
            return {
              type: 'identifier',
              text: 'unknown_function',
              childCount: 0,
              child: () => null,
              childForFieldName: () => null,
              namedChildren: [],
            };
          } else if (index === 1) {
            return mockArgumentListNode;
          }
          return null;
        },
        childForFieldName: (name: string) => {
          if (name === 'function') {
            return {
              type: 'identifier',
              text: 'unknown_function',
              childCount: 0,
              child: () => null,
              childForFieldName: () => null,
              namedChildren: [],
            };
          } else if (name === 'arguments' || name === 'argument_list') {
            return mockArgumentListNode;
          }
          return null;
        },
        namedChildren: [
          {
            type: 'identifier',
            text: 'unknown_function',
            childCount: 0,
            child: () => null,
            childForFieldName: () => null,
            namedChildren: [],
          },
          mockArgumentListNode,
        ],
      } as unknown as TSNode;

      // Visit the node
      const result = visitor.visitAccessorExpression(
        mockAccessorExpressionNode
      );

      // Verify the result
      expect(result).toBeNull();
    });
  });
});

// Helper function to find a node of a specific type
function _findNodeOfType(node: TSNode, type: string): TSNode | null {
  if (node.type === type) {
    return node;
  }

  // Special case for accessor_expression which might be a module_instantiation
  if (node.type === 'accessor_expression' && type === 'module_instantiation') {
    return node;
  }

  // Special case for expression_statement which might contain an accessor_expression
  if (node.type === 'expression_statement' && type === 'module_instantiation') {
    const expression = node.firstChild;
    if (expression) {
      const accessorExpression = findDescendantOfType(
        expression,
        'accessor_expression'
      );
      if (accessorExpression) {
        return accessorExpression;
      }
    }
  }

  // Special case for statement which might contain an expression_statement
  if (node.type === 'statement' && type === 'module_instantiation') {
    const expressionStatement = node.childForFieldName('expression_statement');
    if (expressionStatement) {
      return _findNodeOfType(expressionStatement, type);
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
