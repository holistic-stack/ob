/**
 * @file recovery-strategy.ts
 * @description This file defines interfaces and concrete implementations for error recovery strategies
 * within the OpenSCAD parser. These strategies allow the parser to attempt to continue processing
 * even when syntax errors are encountered, improving resilience and user experience.
 *
 * @architectural_decision
 * The error recovery system is based on the Strategy pattern, where different recovery mechanisms
 * (e.g., skipping to the next statement, inserting missing tokens) are encapsulated in separate classes.
 * This design promotes modularity, extensibility, and testability. A factory function (`createRecoveryStrategy`)
 * is used to dynamically select the most appropriate strategy based on the type of error encountered.
 * This allows for flexible and intelligent error handling without tightly coupling the parser to specific recovery logic.
 */

import type { Node as TSNode } from 'web-tree-sitter';
import { type ParserError } from '../../error-handling/types/error-types.js';
import { OpenSCADSyntaxError } from './syntax-error.js';

/**
 * @interface RecoveryStrategy
 * @description Defines the contract for any error recovery strategy.
 * Implementations of this interface provide a mechanism to attempt to recover from a parsing error.
 */
export interface RecoveryStrategy {
  /**
   * @method recover
   * @description Attempts to recover from a given parser error at a specific CST node.
   *
   * @param {TSNode} node - The Tree-sitter node where the error occurred.
   * @param {ParserError} error - The ParserError instance describing the issue.
   * @returns {TSNode | null} The CST node from which parsing can potentially resume, or null if recovery is not possible.
   */
  recover(node: TSNode, error: ParserError): TSNode | null;
}

/**
 * @class SkipToNextStatementStrategy
 * @description A recovery strategy that attempts to skip the problematic code segment
 * and resume parsing from the next valid statement. This is a common fallback strategy
 * for unrecoverable syntax errors.
 */
export class SkipToNextStatementStrategy implements RecoveryStrategy {
  /**
   * @method recover
   * @description Implements the recovery logic by attempting to find the next statement node
   * in the CST, effectively skipping the erroneous part.
   *
   * @param {TSNode} node - The Tree-sitter node where the error occurred.
   * @param {ParserError} _error - The error that occurred (unused in this strategy).
   * @returns {TSNode | null} The next statement node, or null if no suitable next statement is found.
   *
   * @example
   * Basic usage: If parsing fails at invalid code, this strategy tries to find the next statement node.
   */
  recover(node: TSNode, _error: ParserError): TSNode | null {
    // Start from the current node
    let current: TSNode | null = node;

    // Find the parent statement node
    while (current && current.type !== 'statement') {
      current = current.parent;
    }

    // If we found a statement node, get its next sibling
    if (current) {
      const nextSibling = current.nextSibling;
      if (nextSibling && nextSibling.type === 'statement') {
        return nextSibling;
      }
    }

    // If we couldn't find a next statement, try to find any statement node
    current = node;
    while (current) {
      const nextSibling = current.nextSibling;
      if (nextSibling) {
        if (nextSibling.type === 'statement') {
          return nextSibling;
        }

        // Check if the next sibling has any statement children
        for (let i = 0; i < nextSibling.childCount; i++) {
          const child = nextSibling.child(i);
          if (child && child.type === 'statement') {
            return child;
          }
        }
      }

      // Move up to the parent node
      current = current.parent;
    }

    // If we couldn't find any statement node, return null
    return null;
  }
}

/**
 * @class InsertMissingTokenStrategy
 * @description A recovery strategy that simulates the insertion of a missing token.
 * This strategy is typically used for syntax errors where a token (like a semicolon or parenthesis)
 * is expected but not found.
 *
 * @limitation This implementation does not actually modify the source code or the CST.
 * In a real-world scenario, this strategy would involve modifying the underlying text buffer
 * and triggering a re-parse, or directly manipulating the CST if the parser supports it.
 * Currently, it serves as a placeholder for such functionality.
 */
export class InsertMissingTokenStrategy implements RecoveryStrategy {
  /**
   * @method recover
   * @description Attempts to recover by conceptually inserting a missing token.
   * Currently, it just returns the original node, as actual insertion requires source modification.
   *
   * @param {TSNode} node - The Tree-sitter node where the error occurred.
   * @param {ParserError} error - The error that occurred.
   * @returns {TSNode | null} The original node, or null if the error is not a syntax error with suggestions.
   */
  recover(node: TSNode, error: ParserError): TSNode | null {
    // This strategy only works for syntax errors
    if (!(error instanceof OpenSCADSyntaxError)) {
      return null;
    }

    // Get the suggestions from the error
    const suggestions = error.suggestions;
    if (!suggestions || suggestions.length === 0 || !suggestions[0]) {
      return null;
    }

    // In a real implementation, we would modify the source code and reparse
    // For now, we'll just return the node to continue parsing
    return node;
  }
}

/**
 * @class DeleteExtraTokenStrategy
 * @description A recovery strategy that simulates the deletion of an unexpected or extra token.
 * This is useful for syntax errors caused by extraneous characters or misplaced keywords.
 *
 * @limitation Similar to InsertMissingTokenStrategy, this implementation does not actually
 * modify the source code or the CST. It serves as a conceptual recovery mechanism.
 */
export class DeleteExtraTokenStrategy implements RecoveryStrategy {
  /**
   * @method recover
   * @description Attempts to recover by conceptually deleting an extra token.
   * Currently, it returns the next sibling node, simulating a skip over the erroneous token.
   *
   * @param {TSNode} node - The Tree-sitter node where the error occurred.
   * @param {ParserError} error - The error that occurred.
   * @returns {TSNode | null} The next sibling node, or null if the error is not a syntax error.
   */
  recover(node: TSNode, error: ParserError): TSNode | null {
    // This strategy only works for syntax errors
    if (!(error instanceof OpenSCADSyntaxError)) {
      return null;
    }

    // In a real implementation, we would modify the source code and reparse
    // For now, we'll just return the next sibling to continue parsing
    return node.nextSibling;
  }
}

/**
 * @function createRecoveryStrategy
 * @description A factory function that selects and returns an appropriate RecoveryStrategy
 * based on the type and characteristics of the given ParserError.
 *
 * @param {ParserError} error - The error for which a recovery strategy is needed.
 * @returns {RecoveryStrategy | null} An instance of a RecoveryStrategy if a suitable one is found, otherwise null.
 *
 * @example
 * Basic usage:
 *
 * const missingTokenError = new OpenSCADSyntaxError(
 *   'Missing semicolon', 'MISSING_SEMICOLON', 'cube(10)', { line: 0, column: 8, offset: 8 },
 *   [{ message: 'Add a semicolon', replacement: 'cube(10);' }]
 * );
 * const strategy1 = createRecoveryStrategy(missingTokenError);
 * // strategy1 will be an instance of InsertMissingTokenStrategy
 *
 * const unexpectedTokenError = new OpenSCADSyntaxError(
 *   'Unexpected keyword', 'UNEXPECTED_KEYWORD', 'cube(10) then', { line: 0, column: 9, offset: 9 }
 * );
 * const strategy2 = createRecoveryStrategy(unexpectedTokenError);
 * // strategy2 will be an instance of DeleteExtraTokenStrategy
 */
export function createRecoveryStrategy(error: ParserError): RecoveryStrategy | null {
  // Choose a strategy based on the error type
  if (error instanceof OpenSCADSyntaxError) {
    // Check if the error is a missing token error
    if (error.message.includes('Missing')) {
      return new InsertMissingTokenStrategy();
    }

    // Check if the error is an unexpected token error
    if (error.message.includes('Unexpected')) {
      return new DeleteExtraTokenStrategy();
    }

    // Default to skipping to the next statement
    return new SkipToNextStatementStrategy();
  }

  // No strategy available for other error types
  return null;
}

/**
 * @function createInsertMissingTokenStrategy
 * @description Factory function to create an instance of InsertMissingTokenStrategy.
 * @returns {InsertMissingTokenStrategy} A new InsertMissingTokenStrategy instance.
 */
export function createInsertMissingTokenStrategy(): InsertMissingTokenStrategy {
  return new InsertMissingTokenStrategy();
}

/**
 * @function createDeleteExtraTokenStrategy
 * @description Factory function to create an instance of DeleteExtraTokenStrategy.
 * @returns {DeleteExtraTokenStrategy} A new DeleteExtraTokenStrategy instance.
 */
export function createDeleteExtraTokenStrategy(): DeleteExtraTokenStrategy {
  return new DeleteExtraTokenStrategy();
}

/**
 * @function createSkipToNextStatementStrategy
 * @description Factory function to create an instance of SkipToNextStatementStrategy.
 * @returns {SkipToNextStatementStrategy} A new SkipToNextStatementStrategy instance.
 */
export function createSkipToNextStatementStrategy(): SkipToNextStatementStrategy {
  return new SkipToNextStatementStrategy();
}

/**
 * @function createRecoveryStrategyFactory
 * @description An alias for createRecoveryStrategy, maintaining consistency with factory naming conventions.
 * @param {ParserError} error - The error for which to create a strategy.
 * @returns {RecoveryStrategy | null} An instance of a RecoveryStrategy or null.
 */
export function createRecoveryStrategyFactory(error: ParserError): RecoveryStrategy | null {
  return createRecoveryStrategy(error);
}
