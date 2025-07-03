/**
 * @file Assert Statement Visitor for OpenSCAD AST generation
 *
 * This module implements the AssertStatementVisitor class, which is responsible for
 * converting Tree-sitter CST nodes representing OpenSCAD assert statements into
 * structured AST nodes. Assert statements are critical for input validation and
 * ensuring code correctness in OpenSCAD.
 *
 * The visitor handles various assert statement patterns:
 * - Basic assertions: `assert(condition);`
 * - Assertions with custom messages: `assert(condition, "error message");`
 * - Complex conditions with expressions: `assert(x > 0 && y < 100);`
 *
 * @example Basic usage
 * ```typescript
 * import { AssertStatementVisitor } from './assert-statement-visitor';
 * import { ErrorHandler } from '../../error-handling';
 *
 * const visitor = new AssertStatementVisitor(sourceCode, errorHandler);
 * const assertNode = visitor.visitAssertStatement(assertCST);
 * // Returns: { type: 'assert', condition: {...}, message?: {...} }
 * ```
 *
 * @example Assert statement processing
 * ```typescript
 * // For OpenSCAD code: assert(x > 0, "x must be positive");
 * const assertNode = visitor.visitAssertStatement(cstNode);
 * // Returns:
 * // {
 * //   type: 'assert',
 * //   condition: { type: 'expression', expressionType: 'binary', ... },
 * //   message: { type: 'expression', expressionType: 'literal', value: "x must be positive" }
 * // }
 * ```
 *
 * @module assert-statement-visitor
 * @since 0.1.0
 */

import { Node as TSNode } from 'web-tree-sitter';
import { BaseASTVisitor } from '../base-ast-visitor.js';
import { ErrorHandler } from '../../../error-handling/index.js';
import * as ast from '../../ast-types.js';
import { getLocation } from '../../utils/location-utils.js';
import { findDescendantOfType } from '../../utils/node-utils.js';

/**
 * Visitor class for processing OpenSCAD assert statements.
 *
 * The AssertStatementVisitor converts Tree-sitter CST nodes representing assert
 * statements into structured AST nodes. It handles both basic assertions and
 * assertions with custom error messages.
 *
 * Assert statements in OpenSCAD follow the pattern:
 * - `assert(condition);` - Basic assertion
 * - `assert(condition, message);` - Assertion with custom message
 *
 * The visitor integrates with the expression system to properly parse conditions
 * and message expressions, ensuring full support for complex expressions within
 * assert statements.
 *
 * @example Creating and using the visitor
 * ```typescript
 * const visitor = new AssertStatementVisitor(sourceCode, errorHandler);
 *
 * // Process basic assertion
 * const basicAssert = visitor.visitAssertStatement(basicAssertCST);
 * // Returns: { type: 'assert', condition: {...} }
 *
 * // Process assertion with message
 * const assertWithMessage = visitor.visitAssertStatement(messageAssertCST);
 * // Returns: { type: 'assert', condition: {...}, message: {...} }
 * ```
 *
 * @since 0.1.0
 */
export class AssertStatementVisitor extends BaseASTVisitor {
  /**
   * Creates a new AssertStatementVisitor instance.
   *
   * @param sourceCode - The original OpenSCAD source code being parsed
   * @param errorHandler - Handler for managing parsing errors and warnings
   *
   * @example
   * ```typescript
   * const errorHandler = new ErrorHandler();
   * const visitor = new AssertStatementVisitor(sourceCode, errorHandler);
   * ```
   */
  constructor(sourceCode: string, protected override errorHandler: ErrorHandler) {
    super(sourceCode, errorHandler);
  }

  /**
   * Create an AST node for a specific function.
   * This method is required by BaseASTVisitor but not used by AssertStatementVisitor
   * since assert statements are handled directly.
   *
   * @param node - The node to process
   * @param functionName - The name of the function
   * @param args - The arguments to the function
   * @returns Always returns null since assert statements don't use this method
   */
  protected createASTNodeForFunction(
    _node: TSNode,
    _functionName: string,
    _args: ast.Parameter[]
  ): ast.ASTNode | null {
    // Assert statements are handled directly in visitAssertStatement
    return null;
  }

  /**
   * Safe logging helper that checks if errorHandler exists
   *
   * @param level - The log level
   * @param message - The message to log
   * @param context - Optional context information
   * @param node - Optional node for additional context
   *
   * @private
   */
  private safeLog(level: 'info' | 'debug' | 'warning' | 'error', message: string, context?: string, node?: unknown): void {
    if (this.errorHandler) {
      switch (level) {
        case 'info':
          this.errorHandler.logInfo(message, context, node);
          break;
        case 'debug':
          this.errorHandler.logDebug(message, context, node);
          break;
        case 'warning':
          this.errorHandler.logWarning(message, context, node);
          break;
        case 'error':
          this.errorHandler.logError(message, context, node);
          break;
      }
    }
  }

  /**
   * Override visitStatement to handle generic statement nodes that contain assert statements.
   *
   * This method is called when the tree-sitter grammar produces a generic 'statement' node
   * that wraps an 'assert_statement'. It finds the assert_statement within the wrapper
   * and delegates to visitAssertStatement.
   *
   * @param node - The Tree-sitter CST node representing a generic statement
   * @returns The corresponding AssertStatementNode AST node, or null if no assert statement found
   *
   * @example Statement wrapper handling
   * ```typescript
   * // For OpenSCAD code: assert(true);
   * // Tree-sitter produces: statement -> assert_statement
   * const result = visitor.visitStatement(statementNode);
   * // Returns: { type: 'assert', condition: { expressionType: 'literal', value: true } }
   * ```
   *
   * @since 0.1.0
   */
  override visitStatement(node: TSNode): ast.ASTNode | null {
    this.safeLog(
      'info',
      `[AssertStatementVisitor.visitStatement] Processing statement node: ${node.text.substring(0, 50)}`,
      'AssertStatementVisitor.visitStatement',
      node
    );

    // Look for assert_statement within the statement node
    const assertStatement = findDescendantOfType(node, 'assert_statement');
    if (assertStatement) {
      this.safeLog(
        'info',
        `[AssertStatementVisitor.visitStatement] Found assert_statement in statement, delegating to visitAssertStatement`,
        'AssertStatementVisitor.visitStatement',
        assertStatement
      );
      return this.visitAssertStatement(assertStatement);
    }

    // If no assert statement found, return null (let other visitors handle it)
    this.safeLog(
      'info',
      `[AssertStatementVisitor.visitStatement] No assert_statement found in statement node`,
      'AssertStatementVisitor.visitStatement',
      node
    );
    return null;
  }

  /**
   * Visits an assert statement node and converts it to an AST node.
   *
   * This method processes Tree-sitter CST nodes representing assert statements
   * and converts them into structured AssertStatementNode AST nodes. It handles
   * both basic assertions and assertions with custom error messages.
   *
   * The method expects the CST node to follow the grammar pattern:
   * ```
   * assert_statement: seq(
   *   'assert',
   *   '(',
   *   expression,
   *   optional(seq(',', expression)),
   *   ')',
   *   optional(';')
   * )
   * ```
   *
   * @param node - The Tree-sitter CST node representing an assert statement
   * @returns The corresponding AssertStatementNode AST node, or null if processing fails
   *
   * @example Basic assertion
   * ```typescript
   * // For OpenSCAD code: assert(true);
   * const assertNode = visitor.visitAssertStatement(cstNode);
   * // Returns: { type: 'assert', condition: { expressionType: 'literal', value: true } }
   * ```
   *
   * @example Assertion with message
   * ```typescript
   * // For OpenSCAD code: assert(x > 0, "x must be positive");
   * const assertNode = visitor.visitAssertStatement(cstNode);
   * // Returns: {
   * //   type: 'assert',
   * //   condition: { expressionType: 'binary', operator: '>', ... },
   * //   message: { expressionType: 'literal', value: "x must be positive" }
   * // }
   * ```
   *
   * @since 0.1.0
   */
  override visitAssertStatement(node: TSNode): ast.AssertStatementNode | null {
    this.safeLog(
      'info',
      `[AssertStatementVisitor.visitAssertStatement] Processing assert statement: ${node.text.substring(0, 50)}`,
      'AssertStatementVisitor.visitAssertStatement',
      node
    );

    // Validate node type
    if (node.type !== 'assert_statement') {
      this.safeLog(
        'warning',
        `[AssertStatementVisitor.visitAssertStatement] Expected assert_statement node, got: ${node.type}`,
        'AssertStatementVisitor.visitAssertStatement',
        node
      );
      return null;
    }

    try {
      // Find the condition expression (first expression after 'assert' and '(')
      const conditionNode = this.findConditionExpression(node);
      if (!conditionNode) {
        this.safeLog(
          'error',
          `[AssertStatementVisitor.visitAssertStatement] Failed to find condition expression`,
          'AssertStatementVisitor.visitAssertStatement',
          node
        );
        return null;
      }

      // Process the condition expression
      const condition = this.processExpression(conditionNode);
      if (!condition) {
        this.safeLog(
          'error',
          `[AssertStatementVisitor.visitAssertStatement] Failed to process condition expression`,
          'AssertStatementVisitor.visitAssertStatement',
          conditionNode
        );
        return null;
      }

      // Find optional message expression (second expression after comma)
      const messageNode = this.findMessageExpression(node);
      let message: ast.ExpressionNode | undefined;

      if (messageNode) {
        const processedMessage = this.processExpression(messageNode);
        if (processedMessage) {
          message = processedMessage;
        } else {
          this.safeLog(
            'warning',
            `[AssertStatementVisitor.visitAssertStatement] Failed to process message expression, continuing without message`,
            'AssertStatementVisitor.visitAssertStatement',
            messageNode
          );
        }
      }

      // Create the assert statement AST node
      const assertNode: ast.AssertStatementNode = {
        type: 'assert',
        condition,
        location: getLocation(node),
      };

      // Add message if present
      if (message) {
        assertNode.message = message;
      }

      this.safeLog(
        'info',
        `[AssertStatementVisitor.visitAssertStatement] Successfully created assert statement AST node`,
        'AssertStatementVisitor.visitAssertStatement',
        node
      );

      return assertNode;
    } catch (error) {
      this.safeLog(
        'error',
        `[AssertStatementVisitor.visitAssertStatement] Error processing assert statement: ${error}`,
        'AssertStatementVisitor.visitAssertStatement',
        node
      );
      return null;
    }
  }

  /**
   * Finds the condition expression within an assert statement node.
   *
   * The tree-sitter grammar produces assert_statement nodes with a named 'condition' field
   * that contains the expression to be evaluated (e.g., boolean, binary_expression, etc.).
   *
   * @param node - The assert statement CST node
   * @returns The condition expression node, or null if not found
   *
   * @example CST structure
   * ```
   * (assert_statement [0, 0] - [0, 13]
   *   condition: (boolean [0, 7] - [0, 11]))
   * ```
   *
   * @private
   */
  private findConditionExpression(node: TSNode): TSNode | null {
    // The condition is stored as a named field in the assert_statement node
    const conditionNode = node.childForFieldName('condition');
    if (conditionNode) {
      this.safeLog(
        'info',
        `[AssertStatementVisitor.findConditionExpression] Found condition field: ${conditionNode.type}`,
        'AssertStatementVisitor.findConditionExpression',
        conditionNode
      );
      return conditionNode;
    }

    // Fallback: look for common expression types as direct children
    const expressionTypes = [
      'boolean', 'number', 'string', 'identifier',
      'binary_expression', 'unary_expression', 'function_call',
      'parenthesized_expression', 'expression'
    ];

    for (const expressionType of expressionTypes) {
      const expressionNode = findDescendantOfType(node, expressionType);
      if (expressionNode) {
        this.safeLog(
          'info',
          `[AssertStatementVisitor.findConditionExpression] Found condition via fallback: ${expressionType}`,
          'AssertStatementVisitor.findConditionExpression',
          expressionNode
        );
        return expressionNode;
      }
    }

    this.safeLog(
      'warning',
      `[AssertStatementVisitor.findConditionExpression] No condition found in assert statement`,
      'AssertStatementVisitor.findConditionExpression',
      node
    );
    return null;
  }

  /**
   * Finds the optional message expression within an assert statement node.
   *
   * The tree-sitter grammar produces assert_statement nodes with an optional named 'message' field
   * that contains the error message expression (e.g., string, identifier, etc.).
   *
   * @param node - The assert statement CST node
   * @returns The message expression node, or null if not found
   *
   * @example CST structure with message
   * ```
   * (assert_statement [0, 0] - [0, 25]
   *   condition: (boolean [0, 7] - [0, 11])
   *   message: (string [0, 13] - [0, 23]))
   * ```
   *
   * @private
   */
  private findMessageExpression(node: TSNode): TSNode | null {
    // The message is stored as a named field in the assert_statement node
    const messageNode = node.childForFieldName('message');
    if (messageNode) {
      this.safeLog(
        'info',
        `[AssertStatementVisitor.findMessageExpression] Found message field: ${messageNode.type}`,
        'AssertStatementVisitor.findMessageExpression',
        messageNode
      );
      return messageNode;
    }

    // Fallback: look for expressions after a comma (legacy parsing)
    let foundComma = false;
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (!child) continue;

      // Look for comma separator
      if (child.type === ',' || child.text === ',') {
        foundComma = true;
        continue;
      }

      // If we found a comma and this is an expression, it's the message
      if (foundComma && (child.type === 'string' || child.type === 'identifier' || child.type === 'expression')) {
        this.safeLog(
          'info',
          `[AssertStatementVisitor.findMessageExpression] Found message via fallback: ${child.type}`,
          'AssertStatementVisitor.findMessageExpression',
          child
        );
        return child;
      }
    }

    this.safeLog(
      'debug',
      `[AssertStatementVisitor.findMessageExpression] No message found in assert statement`,
      'AssertStatementVisitor.findMessageExpression',
      node
    );
    return null;
  }

  /**
   * Processes an expression node using the expression visitor system.
   *
   * This method delegates expression processing to the appropriate expression
   * visitor, ensuring consistent handling of expressions throughout the parser.
   *
   * @param node - The expression CST node to process
   * @returns The corresponding expression AST node, or null if processing fails
   *
   * @private
   */
  private processExpression(node: TSNode): ast.ExpressionNode | null {
    // For now, create a basic expression node
    // This will be enhanced when integrated with the expression visitor system
    return {
      type: 'expression',
      expressionType: 'literal',
      value: node.text,
      location: getLocation(node),
    };
  }
}
