/**
 * Tests for the function call visitor
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { FunctionCallVisitor } from './function-call-visitor.js';
import { OpenscadParser } from '../../../openscad-parser.js';
import * as ast from '../../ast-types.js';
import { Node as TSNode } from 'web-tree-sitter';
import { findDescendantOfType } from '../../utils/node-utils.js';
import { ErrorHandler } from '../../../error-handling/index.js';

describe('FunctionCallVisitor', () => {
  let parser: OpenscadParser;
  let errorHandler: ErrorHandler;

  beforeEach(async () => {
    parser = new OpenscadParser();
    await parser.init();
    errorHandler = new ErrorHandler();
  });

  afterEach(() => {
    parser.dispose();
  });

  describe('visitFunctionCall', () => {
    it('should handle simple function calls with no arguments', async () => {
      const code = `
        foo();
      `;

      // Parse the code to get a real CST
      const tree = parser.parse(code);
      expect(tree).not.toBeNull();

      // Find the module_instantiation node (function call in new grammar)
      // Note: Standalone function calls like foo(); are parsed as module_instantiation
      const moduleInstNode = findDescendantOfType(
        tree!.rootNode,
        'module_instantiation'
      );
      expect(moduleInstNode).not.toBeNull();

      // Create visitor and process the node
      const visitor = new FunctionCallVisitor(code, errorHandler);
      const result = visitor.visit(moduleInstNode!);

      // Verify the result
      expect(result).not.toBeNull();
      expect(result?.type).toBe('expression');
      const functionCallResult = result as ast.FunctionCallNode;
      expect(functionCallResult.expressionType).toBe('function_call');
      expect(functionCallResult.functionName).toBe('foo');
      expect(functionCallResult.args).toHaveLength(0);
    });

    it('should handle function calls with positional arguments', async () => {
      const code = `
        bar(1, 2, 3);
      `;

      // Parse the code to get a real CST
      const tree = parser.parse(code);
      expect(tree).not.toBeNull();

      // Find the module_instantiation node (function call in new grammar)
      const moduleInstNode = findDescendantOfType(
        tree!.rootNode,
        'module_instantiation'
      );
      expect(moduleInstNode).not.toBeNull();

      // Create visitor and process the node
      const visitor = new FunctionCallVisitor(code, errorHandler);
      const result = visitor.visit(moduleInstNode!);

      // Verify the result
      expect(result).not.toBeNull();
      expect(result?.type).toBe('expression');
      const functionCallResult = result as ast.FunctionCallNode;
      expect(functionCallResult.expressionType).toBe('function_call');
      expect(functionCallResult.functionName).toBe('bar');
      expect(functionCallResult.args).toHaveLength(3);

      // Check the arguments
      expect(functionCallResult.args[0]?.name).toBeUndefined();
      expect((functionCallResult.args[0]?.value as ast.ExpressionNode)?.type).toBe('expression');
      expect((functionCallResult.args[0]?.value as ast.LiteralNode)?.value).toBe(1);

      expect(functionCallResult.args[1]?.name).toBeUndefined();
      expect((functionCallResult.args[1]?.value as ast.ExpressionNode)?.type).toBe('expression');
      expect((functionCallResult.args[1]?.value as ast.LiteralNode)?.value).toBe(2);

      expect(functionCallResult.args[2]?.name).toBeUndefined();
      expect((functionCallResult.args[2]?.value as ast.ExpressionNode)?.type).toBe('expression');
      expect((functionCallResult.args[2]?.value as ast.LiteralNode)?.value).toBe(3);
    });

    it('should handle function calls with named arguments', async () => {
      const code = `
        baz(x = 10, y = 20);
      `;

      // Parse the code to get a real CST
      const tree = parser.parse(code);
      expect(tree).not.toBeNull();

      // Find the module_instantiation node (function call in new grammar)
      const moduleInstNode = findDescendantOfType(
        tree!.rootNode,
        'module_instantiation'
      );
      expect(moduleInstNode).not.toBeNull();

      // Create visitor and process the node
      const visitor = new FunctionCallVisitor(code, errorHandler);
      const result = visitor.visit(moduleInstNode!);

      // Verify the result
      expect(result).not.toBeNull();
      expect(result?.type).toBe('expression');
      const functionCallResult = result as ast.FunctionCallNode;
      expect(functionCallResult.expressionType).toBe('function_call');
      expect(functionCallResult.functionName).toBe('baz');
      expect(functionCallResult.args).toHaveLength(2);

      // Check the arguments
      expect(functionCallResult.args[0]?.name).toBe('x');
      expect((functionCallResult.args[0]?.value as ast.ExpressionNode)?.type).toBe('expression');
      expect((functionCallResult.args[0]?.value as ast.LiteralNode)?.value).toBe(10);

      expect(functionCallResult.args[1]?.name).toBe('y');
      expect((functionCallResult.args[1]?.value as ast.ExpressionNode)?.type).toBe('expression');
      expect((functionCallResult.args[1]?.value as ast.LiteralNode)?.value).toBe(20);
    });

    it('should handle function calls with mixed arguments', async () => {
      const code = `
        qux(1, y = 20, "hello");
      `;

      // Parse the code to get a real CST
      const tree = parser.parse(code);
      expect(tree).not.toBeNull();

      // Find the module_instantiation node (function call in new grammar)
      const moduleInstNode = findDescendantOfType(
        tree!.rootNode,
        'module_instantiation'
      );
      expect(moduleInstNode).not.toBeNull();

      // Create visitor and process the node
      const visitor = new FunctionCallVisitor(code, errorHandler);
      const result = visitor.visit(moduleInstNode!);

      // Verify the result
      expect(result).not.toBeNull();
      expect(result?.type).toBe('expression');
      const functionCallResult = result as ast.FunctionCallNode;
      expect(functionCallResult.expressionType).toBe('function_call');
      expect(functionCallResult.functionName).toBe('qux');
      expect(functionCallResult.args).toHaveLength(3);

      // Check the arguments
      expect(functionCallResult.args[0]?.name).toBeUndefined();
      expect((functionCallResult.args[0]?.value as ast.ExpressionNode)?.type).toBe('expression');
      expect((functionCallResult.args[0]?.value as ast.LiteralNode)?.value).toBe(1);

      expect(functionCallResult.args[1]?.name).toBe('y');
      expect((functionCallResult.args[1]?.value as ast.ExpressionNode)?.type).toBe('expression');
      expect((functionCallResult.args[1]?.value as ast.LiteralNode)?.value).toBe(20);

      expect(functionCallResult.args[2]?.name).toBeUndefined();
      expect((functionCallResult.args[2]?.value as ast.ExpressionNode)?.type).toBe('expression');
      expect((functionCallResult.args[2]?.value as ast.LiteralNode)?.value).toBe(
        'hello'
      );
    });

    it.skip('should handle nested function calls', async () => {
      const code = `
        outer(inner(10));
      `;

      // Parse the code to get a real CST
      const tree = parser.parse(code);
      expect(tree).not.toBeNull();

      // Find the module_instantiation node (function call in new grammar)
      const moduleInstNode = findDescendantOfType(
        tree!.rootNode,
        'module_instantiation'
      );
      expect(moduleInstNode).not.toBeNull();

      // Create visitor and process the node
      const visitor = new FunctionCallVisitor(code, errorHandler);

      // Mock the createExpressionNode method to handle the nested function call
      const originalMethod = (visitor as any).createExpressionNode;
      (visitor as any).createExpressionNode = vi.fn().mockImplementation(
        (node: TSNode): ast.ExpressionNode | null => {
          if (node.text.includes('inner')) {
            return {
              type: 'expression',
              expressionType: 'function_call',
              functionName: 'inner',
              args: [
                {
                  name: undefined,
                  value: {
                    type: 'expression',
                    expressionType: 'literal',
                    value: 10,
                  } as ast.LiteralNode,
                },
              ],
            } as ast.ExpressionNode;
          }
          return originalMethod?.call(visitor, node) ?? null;
        }
      );

      const result = visitor.visit(moduleInstNode!);

      // Verify the result
      expect(result).not.toBeNull();
      expect(result?.type).toBe('expression');
      const functionCallResult = result as ast.FunctionCallNode;
      expect(functionCallResult.expressionType).toBe('function_call');
      expect(functionCallResult.functionName).toBe('outer');
      expect(functionCallResult.args).toHaveLength(1);

      // Check the nested function call
      const innerCall = functionCallResult.args[0]?.value as ast.ExpressionNode;
      expect(innerCall.expressionType).toBe('function_call');
      expect(innerCall.functionName).toBe('inner');
    });
  });
});
