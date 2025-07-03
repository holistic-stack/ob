/**
 * Recovery strategies for parser errors
 *
 * This module provides strategies for recovering from parser errors,
 * allowing the parser to continue parsing even when errors are encountered.
 *
 * @module lib/openscad-parser/ast/errors/recovery-strategy
 */

import { Node as TSNode } from 'web-tree-sitter';
import { ParserError } from './parser-error.js';
import { SyntaxError } from './syntax-error.js';

/**
 * Interface for error recovery strategies
 */
export interface RecoveryStrategy {
  /**
   * Recover from an error
   *
   * @param node - The node where the error occurred
   * @param error - The error that occurred
   * @returns The recovered node or null if recovery is not possible
   */
  recover(node: TSNode, error: ParserError): TSNode | null;
}

/**
 * Strategy for skipping to the next statement
 */
export class SkipToNextStatementStrategy implements RecoveryStrategy {
  /**
   * Recover from an error by skipping to the next statement
   *
   * @param node - The node where the error occurred
   * @param error - The error that occurred
   * @returns The next statement node or null if no next statement is found
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
 * Strategy for inserting a missing token
 */
export class InsertMissingTokenStrategy implements RecoveryStrategy {
  /**
   * Recover from an error by inserting a missing token
   *
   * @param node - The node where the error occurred
   * @param error - The error that occurred
   * @returns The node after the inserted token or null if insertion is not possible
   */
  recover(node: TSNode, error: ParserError): TSNode | null {
    // This strategy only works for syntax errors
    if (!(error instanceof SyntaxError)) {
      return null;
    }

    // Get the suggestions from the error
    const suggestions = error.suggestions;
    if (!suggestions || suggestions.length === 0 || !suggestions[0]?.replacement) {
      return null;
    }

    // In a real implementation, we would modify the source code and reparse
    // For now, we'll just return the node to continue parsing
    return node;
  }
}

/**
 * Strategy for deleting an unexpected token
 */
export class DeleteExtraTokenStrategy implements RecoveryStrategy {
  /**
   * Recover from an error by deleting an unexpected token
   *
   * @param node - The node where the error occurred
   * @param error - The error that occurred
   * @returns The node after the deleted token or null if deletion is not possible
   */
  recover(node: TSNode, error: ParserError): TSNode | null {
    // This strategy only works for syntax errors
    if (!(error instanceof SyntaxError)) {
      return null;
    }

    // In a real implementation, we would modify the source code and reparse
    // For now, we'll just return the next sibling to continue parsing
    return node.nextSibling;
  }
}

/**
 * Factory for creating recovery strategies
 */
export class RecoveryStrategyFactory {
  /**
   * Create a recovery strategy for an error
   *
   * @param error - The error to recover from
   * @returns A recovery strategy or null if no strategy is available
   */
  static createStrategy(error: ParserError): RecoveryStrategy | null {
    // Choose a strategy based on the error type
    if (error instanceof SyntaxError) {
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
}
