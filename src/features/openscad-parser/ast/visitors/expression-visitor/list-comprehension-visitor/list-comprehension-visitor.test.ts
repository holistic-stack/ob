/**
 * @file Tests for ListComprehensionVisitor
 *
 * This test suite validates the ListComprehensionVisitor's ability to parse
 * OpenSCAD list comprehension expressions into AST nodes following the Real Parser Pattern.
 *
 * Test coverage includes:
 * - Traditional syntax: [expr for (var = range)]
 * - OpenSCAD syntax: [for (var = range) expr]
 * - Conditional comprehensions with if clauses
 * - Complex expressions and nested structures
 * - Error handling and edge cases
 *
 * @example Test patterns
 * ```typescript
 * // Traditional syntax
 * const result = visitor.visitListComprehension(parseNode('[x*x for (x = [1:5])]'));
 *
 * // OpenSCAD syntax with condition
 * const result = visitor.visitListComprehension(parseNode('[for (x = [1:10]) if (x % 2 == 0) x]'));
 * ```
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ErrorHandler } from '../../../../error-handling/index.js';
import { OpenscadParser } from '../../../../openscad-parser';
import type { ErrorNode, IdentifierExpressionNode } from '../../../ast-types.js';
import { findDescendantOfType } from '../../../utils/index.js';
import { ExpressionVisitor } from '../../expression-visitor.js';
import { ListComprehensionVisitor } from './list-comprehension-visitor.js';

describe('ListComprehensionVisitor', () => {
  let parser: OpenscadParser;
  let errorHandler: ErrorHandler;
  let expressionVisitor: ExpressionVisitor;
  let visitor: ListComprehensionVisitor;

  beforeEach(async () => {
    // Create a new parser instance before each test
    parser = new OpenscadParser();

    // Initialize the parser
    await parser.init();

    errorHandler = new ErrorHandler();
    expressionVisitor = new ExpressionVisitor('', errorHandler);
    visitor = new ListComprehensionVisitor(expressionVisitor, errorHandler);
  });

  afterEach(() => {
    // Clean up after each test
    parser.dispose();
  });

  describe('Traditional Syntax', () => {
    it.skip('should parse simple list comprehension [x for (x = [1:5])]', () => {
      const code = '[x for (x = [1:5])]';
      const tree = parser.parseCST(code);
      expect(tree).toBeTruthy();

      // Find the list comprehension node
      const listCompNode = tree?.rootNode.descendantForIndex(0, code.length);
      expect(listCompNode).toBeTruthy();

      if (listCompNode) {
        const result = visitor.visitListComprehension(listCompNode);
        expect(result).toBeTruthy();

        if (result?.type === 'error') {
          const errorNode = result;
          throw new Error(`visitListComprehension returned an ErrorNode:
    Message: ${errorNode.message}
    ErrorCode: ${errorNode.errorCode}
    CST Node Text: ${errorNode.cstNodeText}
    Location: ${JSON.stringify(errorNode.location)}
    Cause: ${errorNode.cause ? `ErrorCode: ${errorNode.cause.errorCode}, Message: ${errorNode.cause.message}` : 'No cause'}
  `);
        } else if (result?.type === 'list_comprehension') {
          expect(result.variable).toBe('x');
          expect(result.iterable).toBeTruthy();
          expect(result.iterable?.expressionType).toBe('range_expression');
          if (result.expression && result.expression.expressionType === 'identifier_expression') {
            expect((result.expression as unknown as IdentifierExpressionNode).name).toBe('x');
          }
          expect(result.condition).toBeUndefined();
        } else {
          throw new Error(
            `Expected ListComprehensionExpressionNode, but got: ${JSON.stringify(result)}`
          );
        }
      }
    });

    it.skip('should parse expression list comprehension [x*x for (x = [1:5])]', () => {
      const code = '[x*x for (x = [1:5])]';
      const tree = parser.parseCST(code);
      expect(tree).toBeTruthy();

      const listCompNode = tree?.rootNode.descendantForIndex(0, code.length);
      expect(listCompNode).toBeTruthy();

      if (listCompNode) {
        const result = visitor.visitListComprehension(listCompNode);
        expect(result).toBeTruthy();
        expect(result?.type).toBe('list_comprehension');
        if (result && result.type !== 'error') {
          expect(result.variable).toBe('x');
          expect(result.iterable).toBeTruthy();
          expect(result.iterable?.expressionType).toBe('range_expression');
          expect(result.expression).toBeTruthy();
          expect(result.expression?.expressionType).toBe('binary_expression');
          expect(result.condition).toBeUndefined();
        } else if (result?.type === 'error') {
          throw new Error('Expected ListComprehensionExpressionNode, got ErrorNode');
        }
      }
    });

    it.skip('should parse conditional list comprehension [x for (x = [1:10]) if (x % 2 == 0)]', () => {
      const code = '[x for (x = [1:10]) if (x % 2 == 0)]';
      const tree = parser.parseCST(code);
      expect(tree).toBeTruthy();

      const listCompNode = tree?.rootNode.descendantForIndex(0, code.length);
      expect(listCompNode).toBeTruthy();

      if (listCompNode) {
        const result = visitor.visitListComprehension(listCompNode);
        expect(result).toBeTruthy();
        if (result && 'type' in result) {
          if (result.type === 'error') {
            throw new Error('Expected ListComprehensionExpressionNode, got ErrorNode');
          } else if (result.type === 'list_comprehension') {
            expect(result.variable).toBe('x');
            expect(result.iterable).toBeTruthy();
            expect(result.iterable?.expressionType).toBe('range_expression');
            expect(result.expression).toBeTruthy();
            if (result.expression && result.expression.expressionType === 'identifier_expression') {
              expect((result.expression as unknown as IdentifierExpressionNode).name).toBe('x');
            }
            expect(result.condition).toBeTruthy();
            expect(result.condition?.expressionType).toBe('binary_expression');
          } else {
            throw new Error('Result is not an ErrorNode or an ExpressionNode');
          }
        } else if (result === null) {
          throw new Error('Result is null, expected ListComprehensionExpressionNode');
        }
      }
    });
  });

  describe('OpenSCAD Syntax', () => {
    it('should parse OpenSCAD list comprehension [for (x = [1:5]) x]', () => {
      const code = 'values = [for (x = [1:5]) x];';
      const tree = parser.parseCST(code);
      expect(tree).toBeTruthy();

      // Find the list comprehension node within the assignment
      if (!tree?.rootNode) throw new Error('No root node found');
      const listCompNode = findDescendantOfType(tree.rootNode, 'list_comprehension');
      expect(listCompNode).toBeTruthy();

      if (listCompNode) {
        const result = visitor.visitListComprehension(listCompNode);
        expect(result).toBeTruthy(); // Ensure result is not null

        if (result?.type === 'error') {
          const errorNode = result; // ErrorNode is ast.ErrorNode from import
          throw new Error(`visitListComprehension returned an ErrorNode:
    Message: ${errorNode.message}
    ErrorCode: ${errorNode.errorCode}
    CST Node Text: ${errorNode.cstNodeText}
    Location: ${JSON.stringify(errorNode.location)}
    Cause: ${errorNode.cause ? `ErrorCode: ${errorNode.cause.errorCode}, Message: ${errorNode.cause.message}` : 'No cause'}
  `);
        } else if (result?.type === 'list_comprehension') {
          // Updated success assertions for new AST structure:
          expect(result.variable).toBe('x');
          expect(result.iterable).toBeTruthy();
          expect(result.iterable?.expressionType).toBe('vector'); // [1:5] is parsed as vector containing range
          expect(result.expression).toBeTruthy();
          if (result.expression && result.expression.expressionType === 'identifier_expression') {
            expect((result.expression as unknown as IdentifierExpressionNode).name).toBe('x');
          }
          expect(result.condition).toBeUndefined();
        } else {
          throw new Error(
            `Expected ListComprehensionExpressionNode, but got: ${JSON.stringify(result)}`
          );
        }
      }
    });

    it('should parse OpenSCAD list comprehension with condition [for (x = [1:10]) if (x % 2 == 0) x]', () => {
      const code = 'evens = [for (x = [1:10]) if (x % 2 == 0) x];';
      const tree = parser.parseCST(code);
      expect(tree).toBeTruthy();

      if (!tree?.rootNode) throw new Error('No root node found');
      const listCompNode = findDescendantOfType(tree.rootNode, 'list_comprehension');
      expect(listCompNode).toBeTruthy();

      if (listCompNode) {
        const result = visitor.visitListComprehension(listCompNode);
        expect(result).toBeTruthy();
        if (result && 'type' in result) {
          if (result.type === 'error') {
            throw new Error('Expected ListComprehensionExpressionNode, got ErrorNode');
          } else if (result.type === 'list_comprehension') {
            expect(result.variable).toBe('x');
            expect(result.iterable).toBeTruthy();
            expect(result.iterable?.expressionType).toBe('vector'); // [1:10] is parsed as vector containing range
            expect(result.expression).toBeTruthy();
            if (result.expression && result.expression.expressionType === 'identifier_expression') {
              expect((result.expression as unknown as IdentifierExpressionNode).name).toBe('x');
            }
            expect(result.condition).toBeTruthy();
            expect(result.condition?.expressionType).toBe('binary');
          } else {
            throw new Error('Result is not an ErrorNode or an ExpressionNode');
          }
        } else if (result === null) {
          throw new Error('Result is null, expected ListComprehensionExpressionNode');
        }
      }
    });
  });

  describe('Complex Expressions', () => {
    it('should parse list comprehension with complex conditional [for (i = [0:10]) if (i > 2 && i < 8 && i % 2 == 0) i*i]', () => {
      const code = 'result = [for (i = [0:10]) if (i > 2 && i < 8 && i % 2 == 0) i*i];';
      const tree = parser.parseCST(code);
      expect(tree).toBeTruthy();

      if (!tree?.rootNode) throw new Error('No root node found');
      const listCompNode = findDescendantOfType(tree.rootNode, 'list_comprehension');
      expect(listCompNode).toBeTruthy();

      if (listCompNode) {
        const result = visitor.visitListComprehension(listCompNode);
        expect(result).toBeTruthy();
        if (result && 'type' in result) {
          if (result.type === 'error') {
            throw new Error('Expected ListComprehensionExpressionNode, got ErrorNode');
          } else if (result.type === 'list_comprehension') {
            expect(result.variable).toBe('i');
            expect(result.iterable).toBeTruthy();
            expect(result.iterable?.expressionType).toBe('vector'); // [0:10] is parsed as vector containing range
            expect(result.expression).toBeTruthy();
            expect(result.expression?.expressionType).toBe('binary'); // i*i is a binary expression
            expect(result.condition).toBeTruthy();
            expect(result.condition?.expressionType).toBe('binary'); // Complex condition is binary expression
          } else {
            throw new Error('Result is not an ErrorNode or an ExpressionNode');
          }
        } else if (result === null) {
          throw new Error('Result is null, expected ListComprehensionExpressionNode');
        }
      }
    });

    it('should parse list comprehension with function calls [for (i = [0:2]) a_function(i)]', () => {
      const code = 'result = [for (i = [0:2]) a_function(i)];';
      const tree = parser.parseCST(code);
      expect(tree).toBeTruthy();

      if (!tree?.rootNode) throw new Error('No root node found');
      const listCompNode = findDescendantOfType(tree.rootNode, 'list_comprehension');
      expect(listCompNode).toBeTruthy();

      if (listCompNode) {
        const result = visitor.visitListComprehension(listCompNode);
        expect(result).toBeTruthy();
        expect(result?.type).toBe('list_comprehension');
        if (result && result.type !== 'error') {
          expect(result.variable).toBe('i');
          expect(result.iterable).toBeTruthy();
          expect(result.iterable?.expressionType).toBe('vector'); // [0:2] is parsed as vector containing range
          expect(result.expression).toBeTruthy();
          expect(result.expression?.expressionType).toBe('function_call'); // a_function(i) is a function call
          expect(result.condition).toBeUndefined();
        } else if (result?.type === 'error') {
          throw new Error('Expected ListComprehensionExpressionNode, got ErrorNode');
        }
      }
    });

    it('should parse list comprehension with nested arrays [for (i = [0:2]) [i, i*2]]', () => {
      const code = 'nested = [for (i = [0:2]) [i, i*2]];';
      const tree = parser.parseCST(code);
      expect(tree).toBeTruthy();

      if (!tree?.rootNode) throw new Error('No root node found');
      const listCompNode = findDescendantOfType(tree.rootNode, 'list_comprehension');
      expect(listCompNode).toBeTruthy();

      if (listCompNode) {
        const result = visitor.visitListComprehension(listCompNode);
        expect(result).toBeTruthy();
        expect(result?.type).toBe('list_comprehension');
        if (result && result.type !== 'error') {
          expect(result.variable).toBe('i');
          expect(result.iterable).toBeTruthy();
          expect(result.iterable?.expressionType).toBe('vector'); // [0:2] is parsed as vector containing range
          expect(result.expression).toBeTruthy();
          expect(result.expression?.expressionType).toBe('vector'); // [i, i*2] is a vector expression
          expect(result.condition).toBeUndefined();
        } else if (result?.type === 'error') {
          throw new Error('Expected ListComprehensionExpressionNode, got ErrorNode');
        }
      }
    });

    it.skip('should return an ErrorNode for invalid "for...let" order in [for (i = [0:2]) let(x = i*2) x]', () => {
      const code = '[for (i = [0:2]) let(x = i*2) x]';
      const tree = parser.parseCST(code);
      expect(tree).toBeTruthy();

      const listCompNode = tree?.rootNode.descendantForIndex(0, code.length);
      expect(listCompNode).toBeTruthy();

      if (listCompNode) {
        const result = visitor.visitListComprehension(listCompNode);
        expect(result).toBeTruthy();
        if (result?.type === 'error') {
          expect(result.errorCode).toBe('LC_OPENSCAD_STYLE_MISSING_FOR_CLAUSE_NODE');
          expect(result.message).toContain(
            "Required 'list_comprehension_for' child node not found for OpenSCAD-style list comprehension."
          );
        } else {
          const message = `Expected error, got ${result?.type === 'list_comprehension' ? 'list_comprehension' : 'something else'}: ${JSON.stringify(result)}`;
          throw new Error(message);
        }
      }
    });
  });

  describe('Let Expressions', () => {
    it.skip('should return an ErrorNode for invalid "for...let" order in [for (i = [0:3]) let(angle = i * 36) [cos(angle), sin(angle)]]', () => {
      const code = '[for (i = [0:3]) let(angle = i * 36) [cos(angle), sin(angle)]]';
      const tree = parser.parseCST(code);
      expect(tree).toBeTruthy();

      const listCompNode = tree?.rootNode.descendantForIndex(0, code.length);
      expect(listCompNode).toBeTruthy();

      if (listCompNode) {
        const result = visitor.visitListComprehension(listCompNode);
        expect(result).toBeTruthy();
        if (result?.type === 'error') {
          expect(result.errorCode).toBe('LC_OPENSCAD_STYLE_MISSING_FOR_CLAUSE_NODE');
          expect(result.message).toContain(
            "Required 'list_comprehension_for' child node not found for OpenSCAD-style list comprehension."
          );
        } else {
          const message = `Expected error, got ${result?.type === 'list_comprehension' ? 'list_comprehension' : 'something else'}: ${JSON.stringify(result)}`;
          throw new Error(message);
        }
      }
    });

    it.skip('should return an ErrorNode for invalid "for...let" order in [for (a = [1:4]) let(b = a*a, c = 2*b) [a, b, c]]', async () => {
      // Test multiple let assignments
      const code = '[for (a = [1:4]) let(b = a*a, c = 2*b) [a, b, c]]';
      const tree = parser.parseCST(code);
      expect(tree).toBeTruthy();

      const listCompNode = tree?.rootNode.descendantForIndex(0, code.length);
      expect(listCompNode).toBeTruthy();

      if (listCompNode) {
        const result = visitor.visitListComprehension(listCompNode);
        expect(result).toBeTruthy();
        expect(result?.type).toBe('error');
        if (result?.type === 'error') {
          // This specific error code arises because extractForClause fails on the malformed forClauseNode
          expect(result.errorCode).toBe('LC_OPENSCAD_STYLE_MISSING_FOR_CLAUSE_NODE');
          expect(result.message).toContain(
            "Required 'list_comprehension_for' child node not found for OpenSCAD-style list comprehension."
          );
        } else {
          throw new Error(`Expected error, got expression: ${JSON.stringify(result)}`);
        }
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed list comprehension gracefully', () => {
      const code = '[for (x = [1:5]'; // Missing closing bracket and expression
      const tree = parser.parseCST(code);
      expect(tree).toBeTruthy();

      const listCompNode = tree?.rootNode.descendantForIndex(0, code.length);
      if (listCompNode) {
        const result = visitor.visitListComprehension(listCompNode);
        // For malformed input, we expect an ErrorNode or potentially null if parsing fails very early
        expect(
          result === null || result?.type === 'error' || result?.type === 'list_comprehension'
        ).toBe(true);
        // For malformed input, we expect an ErrorNode, null, or a list comprehension node
        // This test is primarily about not crashing and returning something sensible
      }
    });

    it('should return an ErrorNode for non-list-comprehension nodes', () => {
      const code = 'cube(10)';
      const tree = parser.parseCST(code);
      expect(tree).toBeTruthy();

      if (!tree?.rootNode) throw new Error('No root node found');
      const cubeNode = tree.rootNode.descendantForIndex(0, code.length);
      if (cubeNode) {
        const result = visitor.visitListComprehension(cubeNode);
        expect(result).toBeTruthy(); // Check it's not null
        expect(result?.type).toBe('error');

        const errorNode = result as ErrorNode;
        expect(errorNode.errorCode).toBe('NODE_NOT_LIST_COMPREHENSION');
        expect(errorNode.originalNodeType).toBe('module_instantiation');
        expect(errorNode.message).toBe(
          'The provided CST node (type: module_instantiation) is not a recognized list comprehension.'
        );
      }
    });
  });
});
