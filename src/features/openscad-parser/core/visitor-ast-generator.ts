/**
 * @file Visitor AST Generator Implementation
 *
 * Main coordinator for converting tree-sitter CST to OpenSCAD AST using
 * the visitor pattern. Manages the overall conversion process and delegates
 * to specialized visitors through the composite visitor.
 *
 * Based on the architecture from docs/openscad-parser/architecture.md
 * Following TypeScript 5.8, DRY, and SRP principles.
 */

import type { Tree } from 'web-tree-sitter';
import { createLogger } from '../../../shared/services/logger.service.js';
import { tryCatch } from '../../../shared/utils/functional/result.js';
import type { ASTNode } from './ast-types.js';
import type { IErrorHandler } from './error-handler.interface.js';
import { CompositeVisitor } from './visitors/composite-visitor.js';

const logger = createLogger('VisitorASTGenerator');

/**
 * Main AST generator that converts CST to AST using visitor pattern
 * Coordinates the overall conversion process and manages visitor delegation
 */
export class VisitorASTGenerator {
  private readonly cst: Tree;
  private readonly source: string;
  private readonly errorHandler: IErrorHandler;
  private readonly compositeVisitor: CompositeVisitor;

  constructor(cst: Tree, source: string, errorHandler: IErrorHandler) {
    this.cst = cst;
    this.source = source;
    this.errorHandler = errorHandler;
    this.compositeVisitor = new CompositeVisitor(source, errorHandler);

    logger.init('VisitorASTGenerator initialized');
  }

  /**
   * Generate AST from the CST using visitor pattern
   * @returns Array of top-level AST nodes
   */
  generate(): ReadonlyArray<ASTNode> {
    logger.debug('Starting CST to AST conversion');

    const result = tryCatch(
      () => {
        // Start from the root node
        const rootNode = this.cst.rootNode;

        if (!rootNode) {
          throw new Error('CST root node is null');
        }

        logger.debug(`Processing CST root node: ${rootNode.type}`);

        // Check for parse errors in the CST
        if (rootNode.hasError) {
          this.errorHandler.logWarning('CST contains parse errors - AST may be incomplete');
          logger.warn('CST has errors, proceeding with partial conversion');
        }

        // Process the root node and its children
        const astNodes = this.processRootNode(rootNode);

        logger.debug(`Generated ${astNodes.length} top-level AST nodes`);
        return astNodes;
      },
      (err) => {
        const errorMessage = `AST generation failed: ${err instanceof Error ? err.message : String(err)}`;
        this.errorHandler.logError(errorMessage);
        logger.error(errorMessage);
        throw err;
      }
    );

    if (!result.success) {
      throw new Error(result.error);
    }

    return result.data;
  }

  /**
   * Process the root node of the CST
   * @param rootNode - Root CST node (typically 'source_file' or 'program')
   * @returns Array of top-level AST nodes
   */
  private processRootNode(rootNode: Tree['rootNode']): ASTNode[] {
    logger.debug(`Processing root node: ${rootNode.type}`);

    // Handle different root node types
    switch (rootNode.type) {
      case 'source_file':
      case 'program':
      case 'module':
        return this.processSourceFile(rootNode);

      case 'ERROR':
        this.errorHandler.logError('Root node is an error node');
        return [];

      default: {
        // Try to process as a single statement
        const astNode = this.compositeVisitor.safeVisitNode(rootNode, 'root');
        return astNode ? [astNode] : [];
      }
    }
  }

  /**
   * Process a source file node (contains multiple statements)
   * @param sourceNode - Source file CST node
   * @returns Array of AST nodes from statements
   */
  private processSourceFile(sourceNode: Tree['rootNode']): ASTNode[] {
    const astNodes: ASTNode[] = [];

    logger.debug(`Processing source file with ${sourceNode.childCount} children`);

    // Process each top-level statement
    for (let i = 0; i < sourceNode.childCount; i++) {
      const child = sourceNode.child(i);
      if (!child) {
        continue;
      }

      // Skip non-semantic nodes
      if (this.isNonSemanticNode(child)) {
        continue;
      }

      logger.debug(`Processing statement ${i}: ${child.type}`);

      // Process the statement
      const astNode = this.processStatement(child);
      if (astNode) {
        astNodes.push(astNode);
      }
    }

    return astNodes;
  }

  /**
   * Process a single statement node
   * @param statementNode - Statement CST node
   * @returns AST node or null if not processable
   */
  private processStatement(statementNode: Tree['rootNode']): ASTNode | null {
    logger.debug(`Processing statement: ${statementNode.type}`);

    // Handle different statement types
    switch (statementNode.type) {
      case 'expression_statement':
        return this.processExpressionStatement(statementNode);

      case 'function_call':
        return this.compositeVisitor.visitStatement(statementNode);

      case 'assignment_statement':
      case 'module_definition':
      case 'function_definition':
        // TODO: Implement when corresponding visitors are added
        logger.debug(`Statement type ${statementNode.type} not yet implemented`);
        return null;

      default:
        // Try generic visitor processing
        return this.compositeVisitor.visitStatement(statementNode);
    }
  }

  /**
   * Process an expression statement (expression followed by semicolon)
   * @param exprStmtNode - Expression statement CST node
   * @returns AST node from the expression
   */
  private processExpressionStatement(exprStmtNode: Tree['rootNode']): ASTNode | null {
    // Find the expression child (skip semicolons and whitespace)
    for (let i = 0; i < exprStmtNode.childCount; i++) {
      const child = exprStmtNode.child(i);
      if (child && !this.isNonSemanticNode(child)) {
        return this.compositeVisitor.visitNode(child);
      }
    }

    return null;
  }

  /**
   * Check if a node is non-semantic (whitespace, comments, punctuation)
   * @param node - CST node to check
   * @returns True if the node should be skipped
   */
  private isNonSemanticNode(node: Tree['rootNode']): boolean {
    const nonSemanticTypes = [
      'comment',
      'line_comment',
      'block_comment',
      'whitespace',
      '\n',
      '\r\n',
      '\t',
      ' ',
      ';',
      ',',
      '(',
      ')',
      '{',
      '}',
      '[',
      ']',
    ];

    return nonSemanticTypes.includes(node.type);
  }

  /**
   * Get statistics about the conversion process
   * @returns Object with conversion statistics
   */
  getConversionStats(): {
    totalCSTNodes: number;
    totalASTNodes: number;
    visitorStats: Record<string, number>;
    hasErrors: boolean;
  } {
    return {
      totalCSTNodes: this.countCSTNodes(this.cst.rootNode),
      totalASTNodes: 0, // TODO: Track during conversion
      visitorStats: this.compositeVisitor.getVisitorStats(),
      hasErrors: this.cst.rootNode.hasError,
    };
  }

  /**
   * Count total number of nodes in the CST
   * @param node - CST node to count from
   * @returns Total number of descendant nodes
   */
  private countCSTNodes(node: Tree['rootNode']): number {
    let count = 1; // Count this node

    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (child) {
        count += this.countCSTNodes(child);
      }
    }

    return count;
  }

  /**
   * Get the composite visitor for external access
   * @returns The composite visitor instance
   */
  getCompositeVisitor(): CompositeVisitor {
    return this.compositeVisitor;
  }

  /**
   * Dispose of resources and cleanup
   */
  dispose(): void {
    this.compositeVisitor.dispose();
    logger.debug('VisitorASTGenerator disposed');
  }
}
