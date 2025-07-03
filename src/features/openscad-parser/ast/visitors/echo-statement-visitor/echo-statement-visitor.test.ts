/**
 * @file Tests for EchoStatementVisitor
 *
 * This file contains comprehensive tests for the EchoStatementVisitor class,
 * which is responsible for parsing OpenSCAD echo statements and converting
 * them into structured AST nodes.
 *
 * @since 0.1.0
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { EnhancedOpenscadParser, SimpleErrorHandler } from '../../../../index.js';
import type { EchoStatementNode, ExpressionNode } from '../../ast-types.js';

describe('EchoStatementVisitor', () => {
  let parser: EnhancedOpenscadParser;
  let errorHandler: SimpleErrorHandler;

  beforeEach(async () => {
    // Create a new parser instance before each test
    errorHandler = new SimpleErrorHandler();
    parser = new EnhancedOpenscadParser(errorHandler);

    // Initialize the parser
    await parser.init();
  });

  afterEach(() => {
    // Clean up after each test
    parser.dispose();
  });

  describe('Basic Echo Statements', () => {
    it('should parse basic echo statement with string literal', async () => {
      const code = 'echo("Hello World");';
      const ast = parser.parseAST(code);

      expect(ast).toHaveLength(1);
      expect(ast[0].type).toBe('echo');

      const echoNode = ast[0] as EchoStatementNode;
      expect(echoNode.arguments).toHaveLength(1);
      expect(echoNode.arguments[0].expressionType).toBe('literal');
      expect((echoNode.arguments[0] as any).value).toBe('Hello World');
    });

    it('should parse echo statement with number literal', async () => {
      const code = 'echo(42);';
      const ast = parser.parseAST(code);

      expect(ast).toHaveLength(1);
      expect(ast[0].type).toBe('echo');

      const echoNode = ast[0] as EchoStatementNode;
      expect(echoNode.arguments).toHaveLength(1);
      expect(echoNode.arguments[0].expressionType).toBe('literal');
      expect((echoNode.arguments[0] as any).value).toBe(42);
    });

    it('should parse echo statement with boolean literal', async () => {
      const code = 'echo(true);';
      const ast = parser.parseAST(code);

      expect(ast).toHaveLength(1);
      expect(ast[0].type).toBe('echo');

      const echoNode = ast[0] as EchoStatementNode;
      expect(echoNode.arguments).toHaveLength(1);
      expect(echoNode.arguments[0].expressionType).toBe('literal');
      expect((echoNode.arguments[0] as any).value).toBe(true);
    });

    it('should parse echo statement with variable', async () => {
      const code = 'echo(x);';
      const ast = parser.parseAST(code);

      expect(ast).toHaveLength(1);
      expect(ast[0].type).toBe('echo');

      const echoNode = ast[0] as EchoStatementNode;
      expect(echoNode.arguments).toHaveLength(1);
      expect(['variable', 'identifier']).toContain(echoNode.arguments[0].expressionType);
      expect((echoNode.arguments[0] as any).name).toBe('x');
    });
  });

  describe('Multiple Arguments', () => {
    it('should parse echo statement with multiple string arguments', async () => {
      const code = 'echo("Hello", "World");';
      const ast = parser.parseAST(code);

      expect(ast).toHaveLength(1);
      expect(ast[0].type).toBe('echo');

      const echoNode = ast[0] as EchoStatementNode;
      expect(echoNode.arguments).toHaveLength(2);
      expect(echoNode.arguments[0].expressionType).toBe('literal');
      expect((echoNode.arguments[0] as any).value).toBe('Hello');
      expect(echoNode.arguments[1].expressionType).toBe('literal');
      expect((echoNode.arguments[1] as any).value).toBe('World');
    });

    it('should parse echo statement with mixed argument types', async () => {
      const code = 'echo("Value:", x, 42, true);';
      const ast = parser.parseAST(code);

      expect(ast).toHaveLength(1);
      expect(ast[0].type).toBe('echo');

      const echoNode = ast[0] as EchoStatementNode;
      expect(echoNode.arguments).toHaveLength(4);

      // First argument: string
      expect(echoNode.arguments[0].expressionType).toBe('literal');
      expect((echoNode.arguments[0] as any).value).toBe('Value:');

      // Second argument: variable
      expect(['variable', 'identifier']).toContain(echoNode.arguments[1].expressionType);
      expect((echoNode.arguments[1] as any).name).toBe('x');

      // Third argument: number
      expect(echoNode.arguments[2].expressionType).toBe('literal');
      expect((echoNode.arguments[2] as any).value).toBe(42);

      // Fourth argument: boolean
      expect(echoNode.arguments[3].expressionType).toBe('literal');
      expect((echoNode.arguments[3] as any).value).toBe(true);
    });

    it('should parse echo statement with many arguments', async () => {
      const code = 'echo(a, b, c, d, e);';
      const ast = parser.parseAST(code);

      expect(ast).toHaveLength(1);
      expect(ast[0].type).toBe('echo');

      const echoNode = ast[0] as EchoStatementNode;
      expect(echoNode.arguments).toHaveLength(5);

      const expectedNames = ['a', 'b', 'c', 'd', 'e'];
      echoNode.arguments.forEach((arg, index) => {
        expect(['variable', 'identifier']).toContain(arg.expressionType);
        expect((arg).name).toBe(expectedNames[index]);
      });
    });
  });

  describe('Complex Expressions', () => {
    it('should parse echo statement with arithmetic expression', async () => {
      const code = 'echo(x + y);';
      const ast = parser.parseAST(code);

      expect(ast).toHaveLength(1);
      expect(ast[0].type).toBe('echo');

      const echoNode = ast[0] as EchoStatementNode;
      expect(echoNode.arguments).toHaveLength(1);
      expect(['binary', 'binary_expression']).toContain(echoNode.arguments[0].expressionType);

      const binaryExpr = echoNode.arguments[0] as any;
      expect(binaryExpr.operator).toBe('+');
      expect(['variable', 'identifier']).toContain(binaryExpr.left.expressionType);
      expect(binaryExpr.left.name).toBe('x');
      expect(['variable', 'identifier']).toContain(binaryExpr.right.expressionType);
      expect(binaryExpr.right.name).toBe('y');
    });

    it('should parse echo statement with function call', async () => {
      const code = 'echo(sin(45));';
      const ast = parser.parseAST(code);

      expect(ast).toHaveLength(1);
      expect(ast[0].type).toBe('echo');

      const echoNode = ast[0] as EchoStatementNode;
      expect(echoNode.arguments).toHaveLength(1);
      expect(['function_call', 'call_expression']).toContain(echoNode.arguments[0].expressionType);

      const funcCall = echoNode.arguments[0] as any;
      expect(funcCall.name || funcCall.function?.name).toBe('sin');
    });

    it('should parse echo statement with array expression', async () => {
      const code = 'echo([1, 2, 3]);';
      const ast = parser.parseAST(code);

      expect(ast).toHaveLength(1);
      expect(ast[0].type).toBe('echo');

      const echoNode = ast[0] as EchoStatementNode;
      expect(echoNode.arguments).toHaveLength(1);
      expect(['array', 'vector', 'vector_expression']).toContain(echoNode.arguments[0].expressionType);

      const arrayExpr = echoNode.arguments[0] as any;
      const items = arrayExpr.items || arrayExpr.elements;
      expect(items).toHaveLength(3);
    });
  });

  describe('Edge Cases', () => {
    it('should parse empty echo statement', async () => {
      const code = 'echo();';
      const ast = parser.parseAST(code);

      expect(ast).toHaveLength(1);
      expect(ast[0].type).toBe('echo');

      const echoNode = ast[0] as EchoStatementNode;
      expect(echoNode.arguments).toHaveLength(0);
    });

    it('should parse echo statement without semicolon', async () => {
      const code = 'echo("test")';
      const ast = parser.parseAST(code);

      expect(ast).toHaveLength(1);
      expect(ast[0].type).toBe('echo');

      const echoNode = ast[0] as EchoStatementNode;
      expect(echoNode.arguments).toHaveLength(1);
      expect(echoNode.arguments[0].expressionType).toBe('literal');
      expect((echoNode.arguments[0] as any).value).toBe('test');
    });

    it('should parse multiple echo statements', async () => {
      const code = `
        echo("First");
        echo("Second");
        echo("Third");
      `;
      const ast = parser.parseAST(code);

      expect(ast).toHaveLength(3);
      expect(ast[0].type).toBe('echo');
      expect(ast[1].type).toBe('echo');
      expect(ast[2].type).toBe('echo');

      const firstEcho = ast[0] as EchoStatementNode;
      const secondEcho = ast[1] as EchoStatementNode;
      const thirdEcho = ast[2] as EchoStatementNode;

      expect((firstEcho.arguments[0] as any).value).toBe('First');
      expect((secondEcho.arguments[0] as any).value).toBe('Second');
      expect((thirdEcho.arguments[0] as any).value).toBe('Third');
    });
  });

  describe('Error Handling', () => {
    it('should handle echo statement with missing closing parenthesis', async () => {
      const code = 'echo("test";';
      const ast = parser.parseAST(code);

      // Syntax error should result in no parseable AST nodes
      expect(ast).toHaveLength(0);
    });

    it('should handle echo statement with extra commas', async () => {
      const code = 'echo("test",, "value");';
      const ast = parser.parseAST(code);

      // Should parse successfully, handling extra commas gracefully
      expect(ast).toHaveLength(1);
      expect(ast[0].type).toBe('echo');

      const echoNode = ast[0] as EchoStatementNode;
      expect(echoNode.arguments.length).toBeGreaterThanOrEqual(1);
    });
  });
});
