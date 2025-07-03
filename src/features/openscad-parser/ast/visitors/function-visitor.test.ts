import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { FunctionVisitor } from './function-visitor.js';
import { EnhancedOpenscadParser } from '../../enhanced-parser.js';
import { Node as TSNode } from 'web-tree-sitter';
import { ErrorHandler } from '../../error-handling/index.js';

describe('FunctionVisitor', () => {
  let parser: EnhancedOpenscadParser;
  let errorHandler: ErrorHandler;

  beforeAll(async () => {
    parser = new EnhancedOpenscadParser();
    await parser.init();
    errorHandler = new ErrorHandler();
  });

  afterAll(() => {
    parser.dispose();
    vi.clearAllMocks();
  });

  describe('visitFunctionDefinition', () => {
    it('should parse a basic function definition without parameters', async () => {
      const code = `
        function getValue() = 42;
      `;

      // Create a mock function definition node
      const mockNode = {
        type: 'statement',
        text: 'function getValue() = 42;',
        childForFieldName: (name: string) => {
          if (name === 'name') {
            const functionName = 'getValue';
            return {
              text: functionName,
              startIndex: 0,
              endIndex: functionName.length,
              startPosition: { row: 0, column: 0 },
              endPosition: { row: 0, column: functionName.length },
            } as TSNode;
          } else if (name === 'parameters') {
            return null;
          } else if (name === 'expression') {
            return { text: '42' } as TSNode;
          }
          return null;
        },
      } as TSNode;

      const visitor = new FunctionVisitor(code, errorHandler);
      const result = visitor.visitFunctionDefinition(mockNode);

      expect(result).not.toBeNull();
      expect(result?.type).toBe('function_definition');
      expect(result?.name?.name).toBe('getValue');
      expect(result?.name?.type).toBe('expression');
      expect(result?.name?.expressionType).toBe('identifier');
      expect(result?.name?.location).toBeDefined(); // May require mock update
      expect(result?.parameters).toHaveLength(0);
      expect(result?.expression).toBeDefined();
      expect(result?.expression.value).toBe('42');
    });

    it('should parse a function definition with parameters', async () => {
      const code = `
        function add(a, b) = a + b;
      `;

      // Create a mock function definition node
      const mockNode = {
        type: 'statement',
        text: 'function add(a, b) = a + b;',
        childForFieldName: (name: string) => {
          if (name === 'name') {
            const functionName = 'add';
            return {
              text: functionName,
              startIndex: 0,
              endIndex: functionName.length,
              startPosition: { row: 0, column: 0 },
              endPosition: { row: 0, column: functionName.length },
            } as TSNode;
          } else if (name === 'parameters') {
            return { text: 'a, b' } as TSNode;
          } else if (name === 'expression') {
            return { text: 'a + b' } as TSNode;
          }
          return null;
        },
      } as TSNode;

      const visitor = new FunctionVisitor(code, errorHandler);
      const result = visitor.visitFunctionDefinition(mockNode);

      expect(result).not.toBeNull();
      expect(result?.type).toBe('function_definition');
      expect(result?.name?.name).toBe('add');
      expect(result?.name?.type).toBe('expression');
      expect(result?.name?.expressionType).toBe('identifier');
      expect(result?.name?.location).toBeDefined(); // May require mock update
      expect(result?.parameters).toHaveLength(2);
      expect(result?.parameters[0].name).toBe('a');
      expect(result?.parameters[1].name).toBe('b');
      expect(result?.expression).toBeDefined();
      expect(result?.expression.value).toBe('a + b');
    });

    it('should parse a function definition with default parameter values', async () => {
      const code = `
        function add(a=0, b=0) = a + b;
      `;

      // Create a mock function definition node
      const mockNode = {
        type: 'statement',
        text: 'function add(a=0, b=0) = a + b;',
        childForFieldName: (name: string) => {
          if (name === 'name') {
            const functionName = 'add';
            return {
              text: functionName,
              startIndex: 0,
              endIndex: functionName.length,
              startPosition: { row: 0, column: 0 },
              endPosition: { row: 0, column: functionName.length },
            } as TSNode;
          } else if (name === 'parameters') {
            return { text: 'a=0, b=0' } as TSNode;
          } else if (name === 'expression') {
            return { text: 'a + b' } as TSNode;
          }
          return null;
        },
      } as TSNode;

      const visitor = new FunctionVisitor(code, errorHandler);
      const result = visitor.visitFunctionDefinition(mockNode);

      expect(result).not.toBeNull();
      expect(result?.type).toBe('function_definition');
      expect(result?.name?.name).toBe('add');
      expect(result?.name?.type).toBe('expression');
      expect(result?.name?.expressionType).toBe('identifier');
      expect(result?.name?.location).toBeDefined(); // May require mock update
      expect(result?.parameters).toHaveLength(2);
      expect(result?.parameters[0].name).toBe('a');
      expect(result?.parameters[0].defaultValue).toBe(0);
      expect(result?.parameters[1].name).toBe('b');
      expect(result?.parameters[1].defaultValue).toBe(0);
      expect(result?.expression).toBeDefined();
      expect(result?.expression.value).toBe('a + b');
    });

    it('should parse a function definition with mixed parameter types', async () => {
      const code = `
        function createVector(x=0, y=0, z=0) = [x, y, z];
      `;

      // Create a mock function definition node
      const mockNode = {
        type: 'statement',
        text: 'function createVector(x=0, y=0, z=0) = [x, y, z];',
        childForFieldName: (name: string) => {
          if (name === 'name') {
            const functionName = 'createVector';
            return {
              text: functionName,
              startIndex: 0,
              endIndex: functionName.length,
              startPosition: { row: 0, column: 0 },
              endPosition: { row: 0, column: functionName.length },
            } as TSNode;
          } else if (name === 'parameters') {
            return { text: 'x=0, y=0, z=0' } as TSNode;
          } else if (name === 'expression') {
            return { text: '[x, y, z]' } as TSNode;
          }
          return null;
        },
      } as TSNode;

      const visitor = new FunctionVisitor(code, errorHandler);
      const result = visitor.visitFunctionDefinition(mockNode);

      expect(result).not.toBeNull();
      expect(result?.type).toBe('function_definition');
      expect(result?.name?.name).toBe('createVector');
      expect(result?.name?.type).toBe('expression');
      expect(result?.name?.expressionType).toBe('identifier');
      expect(result?.name?.location).toBeDefined(); // May require mock update
      expect(result?.parameters).toHaveLength(3);
      expect(result?.parameters[0].name).toBe('x');
      expect(result?.parameters[0].defaultValue).toBe(0);
      expect(result?.parameters[1].name).toBe('y');
      expect(result?.parameters[1].defaultValue).toBe(0);
      expect(result?.parameters[2].name).toBe('z');
      expect(result?.parameters[2].defaultValue).toBe(0);
      expect(result?.expression).toBeDefined();
      expect(result?.expression.value).toBe('[x, y, z]');
    });
  });

  describe('createFunctionCallNode', () => {
    it('should create a function call node with arguments', async () => {
      const code = `
        add(1, 2);
      `;

      // Create a mock node
      const mockNode = {
        type: 'statement',
        text: 'add(1, 2);',
      } as TSNode;

      const visitor = new FunctionVisitor(code, errorHandler);
      const result = visitor.createFunctionCallNode(mockNode, 'add', [
        {
          name: undefined,
          value: {
            type: 'expression',
            expressionType: 'literal',
            value: 1,
            location: {
              start: { line: 0, column: 0, offset: 0 },
              end: { line: 0, column: 0, offset: 0 },
            },
          },
        },
        {
          name: undefined,
          value: {
            type: 'expression',
            expressionType: 'literal',
            value: 2,
            location: {
              start: { line: 0, column: 0, offset: 0 },
              end: { line: 0, column: 0, offset: 0 },
            },
          },
        },
      ]);

      expect(result).not.toBeNull();
      expect(result.type).toBe('expression');
      expect(result.expressionType).toBe('function_call');
      expect(result.functionName).toBe('add');
      expect(result.args).toHaveLength(2);
    });
  });
});
