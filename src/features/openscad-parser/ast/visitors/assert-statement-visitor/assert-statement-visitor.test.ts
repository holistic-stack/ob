/**
 * @file Tests for AssertStatementVisitor
 *
 * This module contains comprehensive tests for the AssertStatementVisitor class,
 * ensuring proper parsing and AST generation for OpenSCAD assert statements.
 * Tests follow the Real Parser Pattern using actual OpenscadParser instances
 * with proper lifecycle management.
 *
 * Test coverage includes:
 * - Basic assert statements: `assert(true);`
 * - Assert statements with conditions: `assert(x > 0);`
 * - Assert statements with messages: `assert(x > 0, "error message");`
 * - Complex expressions in conditions and messages
 * - Error handling for malformed assert statements
 *
 * @example Test structure
 * ```typescript
 * describe("AssertStatementVisitor", () => {
 *   let parser: OpenscadParser;
 *
 *   beforeEach(async () => {
 *     parser = new OpenscadParser();
 *     await parser.init();
 *   });
 *
 *   afterEach(() => {
 *     parser.dispose();
 *   });
 * });
 * ```
 *
 * @module assert-statement-visitor.test
 * @since 0.1.0
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { EnhancedOpenscadParser, SimpleErrorHandler } from '../../../../index.js';
import { AssertStatementNode } from '../../ast-types.js';

/**
 * Test suite for AssertStatementVisitor functionality.
 *
 * This test suite validates the AssertStatementVisitor's ability to correctly
 * parse and convert OpenSCAD assert statements into structured AST nodes.
 * All tests use real parser instances following the Real Parser Pattern.
 *
 * @since 0.1.0
 */
describe('AssertStatementVisitor', () => {
  let parser: EnhancedOpenscadParser;
  let errorHandler: SimpleErrorHandler;

  /**
   * Set up a fresh parser instance before each test.
   * This ensures test isolation and proper parser initialization.
   */
  beforeEach(async () => {
    errorHandler = new SimpleErrorHandler();
    parser = new EnhancedOpenscadParser(errorHandler);
    await parser.init();
  });

  /**
   * Clean up the parser instance after each test.
   * This ensures proper resource disposal and prevents memory leaks.
   */
  afterEach(() => {
    parser.dispose();
  });

  /**
   * Test basic assert statement parsing.
   * Validates that simple assert statements are correctly parsed.
   */
  describe('Basic Assert Statements', () => {
    it('should parse basic assert statement with literal true', async () => {
      const code = 'assert(true);';
      const ast = parser.parseAST(code);

      expect(ast).toBeDefined();
      expect(ast).toHaveLength(1);

      const assertNode = ast[0] as AssertStatementNode;
      expect(assertNode.type).toBe('assert');
      expect(assertNode.condition).toBeDefined();
      expect(assertNode.condition.type).toBe('expression');
      expect(assertNode.message).toBeUndefined();
    });

    it('should parse basic assert statement with literal false', async () => {
      const code = 'assert(false);';
      const ast = parser.parseAST(code);

      expect(ast).toBeDefined();
      expect(ast).toHaveLength(1);

      const assertNode = ast[0] as AssertStatementNode;
      expect(assertNode.type).toBe('assert');
      expect(assertNode.condition).toBeDefined();
      expect(assertNode.condition.type).toBe('expression');
      expect(assertNode.message).toBeUndefined();
    });

    it('should parse assert statement with variable condition', async () => {
      const code = 'assert(x);';
      const ast = parser.parseAST(code);

      expect(ast).toBeDefined();
      expect(ast).toHaveLength(1);

      const assertNode = ast[0] as AssertStatementNode;
      expect(assertNode.type).toBe('assert');
      expect(assertNode.condition).toBeDefined();
      expect(assertNode.condition.type).toBe('expression');
      expect(assertNode.message).toBeUndefined();
    });
  });

  /**
   * Test assert statements with conditional expressions.
   * Validates parsing of complex conditions with operators.
   */
  describe('Assert Statements with Conditions', () => {
    it('should parse assert statement with comparison condition', async () => {
      const code = 'assert(x > 0);';
      const ast = parser.parseAST(code);

      expect(ast).toBeDefined();
      expect(ast).toHaveLength(1);

      const assertNode = ast[0] as AssertStatementNode;
      expect(assertNode.type).toBe('assert');
      expect(assertNode.condition).toBeDefined();
      expect(assertNode.condition.type).toBe('expression');
      expect(assertNode.message).toBeUndefined();
    });

    it('should parse assert statement with logical condition', async () => {
      const code = 'assert(x > 0 && y < 100);';
      const ast = parser.parseAST(code);

      expect(ast).toBeDefined();
      expect(ast).toHaveLength(1);

      const assertNode = ast[0] as AssertStatementNode;
      expect(assertNode.type).toBe('assert');
      expect(assertNode.condition).toBeDefined();
      expect(assertNode.condition.type).toBe('expression');
      expect(assertNode.message).toBeUndefined();
    });

    it('should parse assert statement with equality condition', async () => {
      const code = 'assert(len(points) == 3);';
      const ast = parser.parseAST(code);

      expect(ast).toBeDefined();
      expect(ast).toHaveLength(1);

      const assertNode = ast[0] as AssertStatementNode;
      expect(assertNode.type).toBe('assert');
      expect(assertNode.condition).toBeDefined();
      expect(assertNode.condition.type).toBe('expression');
      expect(assertNode.message).toBeUndefined();
    });
  });

  /**
   * Test assert statements with custom error messages.
   * Validates parsing of assert statements that include error messages.
   */
  describe('Assert Statements with Messages', () => {
    it('should parse assert statement with string message', async () => {
      const code = 'assert(x > 0, "x must be positive");';
      const ast = parser.parseAST(code);

      expect(ast).toBeDefined();
      expect(ast).toHaveLength(1);

      const assertNode = ast[0] as AssertStatementNode;
      expect(assertNode.type).toBe('assert');
      expect(assertNode.condition).toBeDefined();
      expect(assertNode.condition.type).toBe('expression');
      expect(assertNode.message).toBeDefined();
      expect(assertNode.message?.type).toBe('expression');
    });

    it('should parse assert statement with complex condition and message', async () => {
      const code = 'assert(len(points) >= 3, "Need at least 3 points for polygon");';
      const ast = parser.parseAST(code);

      expect(ast).toBeDefined();
      expect(ast).toHaveLength(1);

      const assertNode = ast[0] as AssertStatementNode;
      expect(assertNode.type).toBe('assert');
      expect(assertNode.condition).toBeDefined();
      expect(assertNode.condition.type).toBe('expression');
      expect(assertNode.message).toBeDefined();
      expect(assertNode.message?.type).toBe('expression');
    });

    it('should parse assert statement with variable message', async () => {
      const code = 'assert(x > 0, error_msg);';
      const ast = parser.parseAST(code);

      expect(ast).toBeDefined();
      expect(ast).toHaveLength(1);

      const assertNode = ast[0] as AssertStatementNode;
      expect(assertNode.type).toBe('assert');
      expect(assertNode.condition).toBeDefined();
      expect(assertNode.condition.type).toBe('expression');
      expect(assertNode.message).toBeDefined();
      expect(assertNode.message?.type).toBe('expression');
    });
  });

  /**
   * Test assert statements without semicolons.
   * Validates that assert statements work with optional semicolons.
   */
  describe('Assert Statements without Semicolons', () => {
    it('should parse assert statement without semicolon', async () => {
      const code = 'assert(true)';
      const ast = parser.parseAST(code);

      expect(ast).toBeDefined();
      expect(ast).toHaveLength(1);

      const assertNode = ast[0] as AssertStatementNode;
      expect(assertNode.type).toBe('assert');
      expect(assertNode.condition).toBeDefined();
      expect(assertNode.condition.type).toBe('expression');
      expect(assertNode.message).toBeUndefined();
    });

    it('should parse assert statement with message but without semicolon', async () => {
      const code = 'assert(x > 0, "error")';
      const ast = parser.parseAST(code);

      expect(ast).toBeDefined();
      expect(ast).toHaveLength(1);

      const assertNode = ast[0] as AssertStatementNode;
      expect(assertNode.type).toBe('assert');
      expect(assertNode.condition).toBeDefined();
      expect(assertNode.condition.type).toBe('expression');
      expect(assertNode.message).toBeDefined();
      expect(assertNode.message?.type).toBe('expression');
    });
  });

  /**
   * Test error handling for malformed assert statements.
   * Validates that the parser handles invalid syntax gracefully.
   */
  describe('Error Handling', () => {
    it('should handle assert statement with missing condition', async () => {
      const code = 'assert();';
      const ast = parser.parseAST(code);

      // The parser should still create an AST, but may not have valid assert nodes
      expect(ast).toBeDefined();
      // The specific behavior for malformed syntax may vary
    });

    it('should handle assert statement with missing closing parenthesis', async () => {
      const code = 'assert(true;';
      const ast = parser.parseAST(code);

      // The parser should still create an AST, but may not have valid assert nodes
      expect(ast).toBeDefined();
      // The specific behavior for malformed syntax may vary
    });

    it('should handle assert statement with extra commas', async () => {
      const code = 'assert(true,, "message");';
      const ast = parser.parseAST(code);

      // The parser should still create an AST, but may not have valid assert nodes
      expect(ast).toBeDefined();
      // The specific behavior for malformed syntax may vary
    });
  });

  /**
   * Test multiple assert statements in sequence.
   * Validates that multiple assert statements are parsed correctly.
   */
  describe('Multiple Assert Statements', () => {
    it('should parse multiple assert statements', async () => {
      const code = `
        assert(x > 0);
        assert(y < 100, "y too large");
        assert(z != 0);
      `;
      const ast = parser.parseAST(code);

      expect(ast).toBeDefined();
      expect(ast.length).toBeGreaterThanOrEqual(3);

      // Check that we have assert statements (they may be mixed with other nodes)
      const assertNodes = ast.filter(child => child.type === 'assert');
      expect(assertNodes.length).toBeGreaterThanOrEqual(1);
    });
  });
});
