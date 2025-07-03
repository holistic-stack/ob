/**
 * @file Control Flow Visitor Implementation
 *
 * Specialized visitor for handling OpenSCAD control flow constructs (if statements, for loops)
 * Converts tree-sitter CST nodes to typed AST nodes for control flow operations.
 *
 * Following TypeScript 5.8, DRY, and SRP principles.
 */

import type { Node } from 'web-tree-sitter';
import { createLogger } from '../../../../shared/services/logger.service.js';
import type { ASTNode, ForStatementNode, IfStatementNode } from '../ast-types.js';
import { BaseASTVisitor } from '../base-ast-visitor.js';
import type { IErrorHandler } from '../error-handler.interface.js';

const logger = createLogger('ControlFlowVisitor');

/**
 * Visitor for OpenSCAD control flow constructs
 * Handles if statements, for loops, and other control flow operations
 */
export class ControlFlowVisitor extends BaseASTVisitor {
  constructor(source: string, errorHandler: IErrorHandler) {
    super(source, errorHandler);
    logger.debug('ControlFlowVisitor initialized');
  }

  /**
   * Visit a CST node and convert to control flow AST node if applicable
   * @param node - Tree-sitter CST node
   * @returns Control flow AST node or null if not a control flow construct
   */
  visitNode(node: Node): ASTNode | null {
    this.logNodeProcessing(node, 'Visiting');

    switch (node.type) {
      case 'if_statement':
        return this.visitIfStatement(node);
      case 'for_statement':
        return this.visitForStatement(node);
      default:
        return null;
    }
  }

  /**
   * Visit an if statement node
   * @param node - If statement CST node
   * @returns IfStatementNode AST node
   */
  private visitIfStatement(node: Node): IfStatementNode | null {
    logger.debug(
      `Processing if statement at ${node.startPosition.row}:${node.startPosition.column}`
    );

    // Find condition, consequence, and optional alternative
    let condition: ASTNode | null = null;
    let consequence: ASTNode | null = null;
    let alternative: ASTNode | null = null;

    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (!child) continue;

      switch (child.type) {
        case 'condition':
        case 'binary_expression':
        case 'identifier':
        case 'number':
          if (!condition) {
            condition = this.visitChildNode(child);
          }
          break;
        case 'block':
        case 'statement':
          if (!consequence) {
            consequence = this.visitChildNode(child);
          } else if (!alternative) {
            alternative = this.visitChildNode(child);
          }
          break;
        case 'else':
          // Skip the 'else' keyword, process the next block
          break;
        default: {
          // Try to process as a generic node
          const childResult = this.visitChildNode(child);
          if (childResult) {
            if (!condition) {
              condition = childResult;
            } else if (!consequence) {
              consequence = childResult;
            } else if (!alternative) {
              alternative = childResult;
            }
          }
          break;
        }
      }
    }

    if (!condition || !consequence) {
      this.errorHandler.logError(
        `If statement missing condition or consequence at ${node.startPosition.row}:${node.startPosition.column}`
      );
      return null;
    }

    const location = this.createSourceLocation(node);
    const ifStatementNode: IfStatementNode = {
      type: 'if_statement',
      condition,
      consequence,
      ...(alternative && { alternative }),
      location,
    };

    logger.debug(
      `Created if statement with condition: ${condition.type}, consequence: ${consequence.type}${alternative ? `, alternative: ${alternative.type}` : ''}`
    );
    return ifStatementNode;
  }

  /**
   * Visit a for statement node
   * @param node - For statement CST node
   * @returns ForStatementNode AST node
   */
  private visitForStatement(node: Node): ForStatementNode | null {
    logger.debug(
      `Processing for statement at ${node.startPosition.row}:${node.startPosition.column}`
    );

    // Find iterator, range, and body
    let iterator: string | null = null;
    let range: ASTNode | null = null;
    let body: ASTNode | null = null;

    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (!child) continue;

      switch (child.type) {
        case 'identifier':
          if (!iterator) {
            iterator = child.text;
          }
          break;
        case 'range_expression':
        case 'vector':
        case 'array':
          if (!range) {
            range = this.visitChildNode(child);
          }
          break;
        case 'block':
        case 'statement':
          if (!body) {
            body = this.visitChildNode(child);
          }
          break;
        case 'assignment': {
          // Handle for (i = range) syntax
          const assignmentResult = this.visitChildNode(child);
          if (assignmentResult && assignmentResult.type === 'assignment') {
            const assignment = assignmentResult as { name: string; value: ASTNode };
            iterator = assignment.name;
            range = assignment.value;
          }
          break;
        }
        default: {
          // Try to process as a generic node
          const childResult = this.visitChildNode(child);
          if (childResult) {
            if (!range) {
              range = childResult;
            } else if (!body) {
              body = childResult;
            }
          }
          break;
        }
      }
    }

    if (!iterator || !range || !body) {
      this.errorHandler.logError(
        `For statement missing iterator, range, or body at ${node.startPosition.row}:${node.startPosition.column}`
      );
      return null;
    }

    const location = this.createSourceLocation(node);
    const forStatementNode: ForStatementNode = {
      type: 'for_statement',
      iterator,
      range,
      body,
      location,
    };

    logger.debug(
      `Created for statement with iterator: ${iterator}, range: ${range.type}, body: ${body.type}`
    );
    return forStatementNode;
  }

  /**
   * Visit a child node using the appropriate visitor
   * @param node - Child CST node
   * @returns AST node or null
   */
  private visitChildNode(node: Node): ASTNode | null {
    // For child nodes, we need to delegate to other visitors
    // This will be handled by the CompositeVisitor when it's integrated
    // For now, create a placeholder that can be processed later

    const location = this.createSourceLocation(node);

    // Handle simple cases directly
    switch (node.type) {
      case 'identifier':
        return {
          type: 'variable',
          name: node.text,
          location,
        };
      case 'number':
        return {
          type: 'literal',
          value: parseFloat(node.text),
          location,
        };
      case 'string':
        return {
          type: 'literal',
          value: node.text.slice(1, -1), // Remove quotes
          location,
        };
      case 'boolean':
        return {
          type: 'literal',
          value: node.text === 'true',
          location,
        };
      default:
        // For complex nodes, create a placeholder that will be resolved later
        return {
          type: 'error',
          message: `Unresolved child node: ${node.type}`,
          location,
        };
    }
  }
}
