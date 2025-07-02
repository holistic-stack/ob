/**
 * @file Base AST Visitor Implementation
 *
 * Abstract base class for implementing the visitor pattern to convert
 * tree-sitter CST nodes to OpenSCAD AST nodes. Provides common functionality
 * and structure for all specialized visitors.
 *
 * Based on the architecture from docs/openscad-parser/architecture.md
 * Following TypeScript 5.8, DRY, and SRP principles.
 */

import type { Node } from 'web-tree-sitter';
import { createLogger } from '../../../shared/services/logger.service.js';
import { tryCatch } from '../../../shared/utils/functional/result.js';
import type { ASTNode, SourceLocation } from './ast-types.js';
import type { IErrorHandler } from './error-handler.interface.js';

const logger = createLogger('BaseASTVisitor');

/**
 * Abstract base class for all AST visitors
 * Provides common functionality for converting CST nodes to AST nodes
 */
export abstract class BaseASTVisitor {
  protected readonly source: string;
  protected readonly errorHandler: IErrorHandler;

  constructor(source: string, errorHandler: IErrorHandler) {
    this.source = source;
    this.errorHandler = errorHandler;
    logger.debug(`Created ${this.constructor.name} visitor`);
  }

  /**
   * Main entry point for visiting a CST node
   * @param node - Tree-sitter CST node to visit
   * @returns AST node or null if not handled by this visitor
   */
  abstract visitNode(node: Node): ASTNode | null;

  /**
   * Visit a statement node (top-level constructs)
   * @param node - Tree-sitter CST node representing a statement
   * @returns AST node or null if not a statement handled by this visitor
   */
  visitStatement(node: Node): ASTNode | null {
    logger.debug(`Visiting statement node: ${node.type}`);
    return this.visitNode(node);
  }

  /**
   * Create an AST node for a function call with arguments
   * @param node - Tree-sitter CST node representing the function call
   * @param name - Function name
   * @param args - Parsed arguments
   * @returns AST node or null if not handled
   */
  protected createASTNodeForFunction(
    node: Node,
    name: string,
    _args: Record<string, unknown>
  ): ASTNode | null {
    logger.debug(`Creating AST node for function: ${name}`);

    const _location = this.createSourceLocation(node);

    // This is a template method that should be overridden by specific visitors
    // Each visitor knows how to handle its specific function types
    return null;
  }

  /**
   * Create source location information from a CST node
   * @param node - Tree-sitter CST node
   * @returns Source location object
   */
  protected createSourceLocation(node: Node): SourceLocation {
    return {
      start: {
        line: node.startPosition.row + 1, // Convert to 1-based line numbers
        column: node.startPosition.column + 1, // Convert to 1-based column numbers
        offset: node.startIndex,
      },
      end: {
        line: node.endPosition.row + 1,
        column: node.endPosition.column + 1,
        offset: node.endIndex,
      },
    };
  }

  /**
   * Extract text content from a CST node
   * @param node - Tree-sitter CST node
   * @returns Text content of the node
   */
  protected getNodeText(node: Node): string {
    return this.source.slice(node.startIndex, node.endIndex);
  }

  /**
   * Find child nodes of a specific type
   * @param node - Parent CST node
   * @param type - Type of child nodes to find
   * @returns Array of matching child nodes
   */
  protected findChildrenOfType(node: Node, type: string): Node[] {
    const children: Node[] = [];

    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (child && child.type === type) {
        children.push(child);
      }
    }

    return children;
  }

  /**
   * Find the first child node of a specific type
   * @param node - Parent CST node
   * @param type - Type of child node to find
   * @returns First matching child node or null
   */
  protected findChildOfType(node: Node, type: string): Node | null {
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (child && child.type === type) {
        return child;
      }
    }
    return null;
  }

  /**
   * Parse numeric value from a CST node
   * @param node - CST node containing numeric value
   * @returns Parsed number or NaN if invalid
   */
  protected parseNumber(node: Node): number {
    const text = this.getNodeText(node).trim();
    const value = Number.parseFloat(text);

    if (Number.isNaN(value)) {
      this.errorHandler.logWarning(`Invalid numeric value: ${text}`);
      logger.warn(`Failed to parse number: ${text}`);
    }

    return value;
  }

  /**
   * Parse boolean value from a CST node
   * @param node - CST node containing boolean value
   * @returns Parsed boolean value
   */
  protected parseBoolean(node: Node): boolean {
    const text = this.getNodeText(node).trim().toLowerCase();
    return text === 'true';
  }

  /**
   * Parse string value from a CST node (removes quotes)
   * @param node - CST node containing string value
   * @returns Parsed string value without quotes
   */
  protected parseString(node: Node): string {
    const text = this.getNodeText(node).trim();

    // Remove surrounding quotes if present
    if (
      (text.startsWith('"') && text.endsWith('"')) ||
      (text.startsWith("'") && text.endsWith("'"))
    ) {
      return text.slice(1, -1);
    }

    return text;
  }

  /**
   * Check if a node represents an error in the CST
   * @param node - CST node to check
   * @returns True if the node represents an error
   */
  protected isErrorNode(node: Node): boolean {
    return node.type === 'ERROR' || node.isMissing || node.hasError;
  }

  /**
   * Handle error nodes by creating appropriate error AST nodes
   * @param node - Error CST node
   * @param context - Context description for the error
   * @returns Error AST node
   */
  protected handleErrorNode(node: Node, context: string): ASTNode {
    const errorMessage = `Parse error in ${context}: ${this.getNodeText(node)}`;
    this.errorHandler.logError(errorMessage);
    logger.error(errorMessage);

    return {
      type: 'error',
      message: errorMessage,
      location: this.createSourceLocation(node),
    };
  }

  /**
   * Safe node visiting with error handling
   * @param node - CST node to visit
   * @param context - Context description for error reporting
   * @returns AST node or null, with errors handled gracefully
   */
  safeVisitNode(node: Node, context: string): ASTNode | null {
    const result = tryCatch(
      () => {
        if (this.isErrorNode(node)) {
          return this.handleErrorNode(node, context);
        }

        return this.visitNode(node);
      },
      (err) => {
        const errorMessage = `Error visiting ${context}: ${err instanceof Error ? err.message : String(err)}`;
        this.errorHandler.logError(errorMessage);
        logger.error(errorMessage);

        return this.handleErrorNode(node, context);
      }
    );

    return result.success ? result.data : null;
  }

  /**
   * Get visitor name for logging and debugging
   * @returns Name of the visitor class
   */
  protected getVisitorName(): string {
    return this.constructor.name;
  }

  /**
   * Log debug information about node processing
   * @param node - CST node being processed
   * @param action - Action being performed
   */
  protected logNodeProcessing(node: Node, action: string): void {
    logger.debug(
      `[${this.getVisitorName()}] ${action}: ${node.type} at ${node.startPosition.row}:${node.startPosition.column}`
    );
  }
}
