/**
 * @file Composite Visitor Implementation
 *
 * Coordinates multiple specialized visitors to convert tree-sitter CST nodes
 * to OpenSCAD AST nodes. Implements the composite pattern to delegate
 * node processing to appropriate specialized visitors.
 *
 * Following TypeScript 5.8, DRY, and SRP principles.
 */

import type { Node } from 'web-tree-sitter';
import { createLogger } from '../../../../shared/services/logger.service.js';
import type { ASTNode } from '../ast-types.js';
import { BaseASTVisitor } from '../base-ast-visitor.js';
import type { IErrorHandler } from '../error-handler.interface.js';
import { CSGVisitor } from './csg-visitor.js';
import { ExpressionVisitor } from './expression-visitor.js';
import { FunctionVisitor } from './function-visitor.js';
import { ModuleVisitor } from './module-visitor.js';
import { PrimitiveVisitor } from './primitive-visitor.js';
import { TransformationVisitor } from './transformation-visitor.js';

const logger = createLogger('CompositeVisitor');

/**
 * Composite visitor that coordinates multiple specialized visitors
 * Delegates node processing to the appropriate visitor based on node type
 */
export class CompositeVisitor extends BaseASTVisitor {
  private readonly visitors: BaseASTVisitor[];
  private readonly primitiveVisitor: PrimitiveVisitor;
  private readonly transformationVisitor: TransformationVisitor;
  private readonly csgVisitor: CSGVisitor;
  private readonly moduleVisitor: ModuleVisitor;
  private readonly functionVisitor: FunctionVisitor;
  private readonly expressionVisitor: ExpressionVisitor;

  constructor(source: string, errorHandler: IErrorHandler) {
    super(source, errorHandler);

    // Initialize specialized visitors
    this.primitiveVisitor = new PrimitiveVisitor(source, errorHandler);
    this.transformationVisitor = new TransformationVisitor(source, errorHandler);
    this.csgVisitor = new CSGVisitor(source, errorHandler);
    this.moduleVisitor = new ModuleVisitor(source, errorHandler);
    this.functionVisitor = new FunctionVisitor(source, errorHandler);
    this.expressionVisitor = new ExpressionVisitor(source, errorHandler);

    // Register all visitors in processing order
    // Order matters: expressions should be processed last as they're most generic
    this.visitors = [
      this.primitiveVisitor,
      this.transformationVisitor,
      this.csgVisitor,
      this.moduleVisitor,
      this.functionVisitor,
      this.expressionVisitor,
    ];

    logger.debug(`CompositeVisitor initialized with ${this.visitors.length} specialized visitors`);
  }

  /**
   * Visit a CST node by delegating to appropriate specialized visitors
   * @param node - Tree-sitter CST node
   * @returns AST node or null if no visitor can handle it
   */
  visitNode(node: Node): ASTNode | null {
    this.logNodeProcessing(node, 'Delegating');

    // Try each visitor in order until one handles the node
    for (const visitor of this.visitors) {
      const result = visitor.visitNode(node);
      if (result !== null) {
        logger.debug(`Node ${node.type} handled by ${visitor.constructor.name}`);
        return result;
      }
    }

    // If no visitor handled the node, log a warning
    this.handleUnhandledNode(node);
    return null;
  }

  /**
   * Visit a statement node by delegating to specialized visitors
   * @param node - Statement CST node
   * @returns AST node or null if no visitor can handle it
   */
  override visitStatement(node: Node): ASTNode | null {
    this.logNodeProcessing(node, 'Delegating statement');

    // Try each visitor's statement handler
    for (const visitor of this.visitors) {
      const result = visitor.visitStatement(node);
      if (result !== null) {
        logger.debug(`Statement ${node.type} handled by ${visitor.constructor.name}`);
        return result;
      }
    }

    // Fall back to regular node visiting
    return this.visitNode(node);
  }

  /**
   * Process multiple CST nodes and return array of AST nodes
   * @param nodes - Array of CST nodes to process
   * @returns Array of AST nodes (excluding nulls)
   */
  visitNodes(nodes: Node[]): ASTNode[] {
    const astNodes: ASTNode[] = [];

    for (const node of nodes) {
      const astNode = this.safeVisitNode(node, `node ${node.type}`);
      if (astNode !== null) {
        astNodes.push(astNode);
      }
    }

    logger.debug(`Processed ${nodes.length} CST nodes, generated ${astNodes.length} AST nodes`);
    return astNodes;
  }

  /**
   * Process all children of a CST node
   * @param parentNode - Parent CST node
   * @returns Array of AST nodes from child processing
   */
  visitChildren(parentNode: Node): ASTNode[] {
    const children: Node[] = [];

    for (let i = 0; i < parentNode.childCount; i++) {
      const child = parentNode.child(i);
      if (child) {
        children.push(child);
      }
    }

    return this.visitNodes(children);
  }

  /**
   * Get statistics about visitor usage
   * @returns Object with visitor statistics
   */
  getVisitorStats(): Record<string, number> {
    const stats: Record<string, number> = {};

    for (const visitor of this.visitors) {
      stats[visitor.constructor.name] = 0; // TODO: Implement usage tracking
    }

    return stats;
  }

  /**
   * Add a new specialized visitor to the composite
   * @param visitor - Specialized visitor to add
   */
  addVisitor(visitor: BaseASTVisitor): void {
    this.visitors.push(visitor);
    logger.debug(`Added ${visitor.constructor.name} to composite visitor`);
  }

  /**
   * Remove a specialized visitor from the composite
   * @param visitorClass - Class of visitor to remove
   * @returns True if visitor was removed, false if not found
   */
  removeVisitor(
    visitorClass: new (source: string, errorHandler: IErrorHandler) => BaseASTVisitor
  ): boolean {
    const index = this.visitors.findIndex((v) => v instanceof visitorClass);
    if (index >= 0) {
      const removed = this.visitors.splice(index, 1)[0];
      if (removed) {
        logger.debug(`Removed ${removed.constructor.name} from composite visitor`);
      }
      return true;
    }
    return false;
  }

  /**
   * Get a specific visitor by class
   * @param visitorClass - Class of visitor to retrieve
   * @returns Visitor instance or null if not found
   */
  getVisitor<T extends BaseASTVisitor>(
    visitorClass: new (source: string, errorHandler: IErrorHandler) => T
  ): T | null {
    const visitor = this.visitors.find((v) => v instanceof visitorClass);
    return (visitor as T) || null;
  }

  /**
   * Handle nodes that no visitor could process
   * @param node - Unhandled CST node
   */
  private handleUnhandledNode(node: Node): void {
    // Skip common non-semantic nodes
    const ignoredTypes = ['comment', 'whitespace', '(', ')', '{', '}', '[', ']', ';', ','];

    if (ignoredTypes.includes(node.type)) {
      return;
    }

    const message = `Unhandled node type: ${node.type} at ${node.startPosition.row}:${node.startPosition.column}`;
    this.errorHandler.logWarning(message);
    logger.warn(message);
  }

  /**
   * Check if any visitor can handle a specific node type
   * @param nodeType - CST node type to check
   * @returns True if any visitor can handle this node type
   */
  canHandle(nodeType: string): boolean {
    // Check if any visitor can handle this node type
    const supportedTypes = this.getSupportedNodeTypes();
    return supportedTypes.includes(nodeType);
  }

  /**
   * Get list of all supported node types across all visitors
   * @returns Array of supported CST node types
   */
  getSupportedNodeTypes(): string[] {
    return [
      // Primitives
      'cube',
      'sphere',
      'cylinder',
      'polyhedron',
      // Transformations
      'translate',
      'rotate',
      'scale',
      'mirror',
      // CSG Operations
      'union',
      'difference',
      'intersection',
      'hull',
      'minkowski',
      // Modules
      'module_definition',
      'module_declaration',
      'module_call',
      'module_instantiation',
      // Functions
      'function_definition',
      'function_declaration',
      'function_call',
      'call_expression',
      // Expressions
      'identifier',
      'number',
      'string',
      'boolean',
      'vector',
      'array',
      'binary_expression',
      'range_expression',
      'assignment',
      'assignment_statement',
      'expression',
    ];
  }

  /**
   * Reset all visitors to initial state
   */
  reset(): void {
    // TODO: Implement visitor state reset if needed
    logger.debug('CompositeVisitor reset');
  }

  /**
   * Dispose of all visitors and cleanup resources
   */
  dispose(): void {
    // TODO: Implement visitor cleanup if needed
    logger.debug('CompositeVisitor disposed');
  }
}
