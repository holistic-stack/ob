/**
 * @file Expression Visitor Implementation
 *
 * Specialized visitor for handling OpenSCAD expressions (variables, vectors, binary operations, ranges)
 * Converts tree-sitter CST nodes to typed AST nodes for expressions and values.
 *
 * Following TypeScript 5.8, DRY, and SRP principles.
 */

import type { Node } from 'web-tree-sitter';
import { createLogger } from '../../../../shared/services/logger.service.js';
import type {
  ASTNode,
  AssignmentNode,
  BinaryExpressionNode,
  LiteralNode,
  RangeExpressionNode,
  VariableNode,
  VectorExpressionNode,
} from '../ast-types.js';
import { BaseASTVisitor } from '../base-ast-visitor.js';
import type { IErrorHandler } from '../error-handler.interface.js';

const logger = createLogger('ExpressionVisitor');

/**
 * Visitor for OpenSCAD expressions and values
 * Handles variables, vectors, binary expressions, ranges, and literals
 */
export class ExpressionVisitor extends BaseASTVisitor {
  constructor(source: string, errorHandler: IErrorHandler) {
    super(source, errorHandler);
    logger.debug('ExpressionVisitor initialized');
  }

  /**
   * Visit a CST node and convert to expression AST node if applicable
   * @param node - Tree-sitter CST node
   * @returns Expression AST node or null if not an expression
   */
  visitNode(node: Node): ASTNode | null {
    this.logNodeProcessing(node, 'Visiting');

    switch (node.type) {
      case 'identifier':
        return this.visitIdentifier(node);
      case 'number':
      case 'string':
      case 'boolean':
        return this.visitLiteral(node);
      case 'vector':
      case 'array':
        return this.visitVector(node);
      case 'binary_expression':
        return this.visitBinaryExpression(node);
      case 'range_expression':
        return this.visitRangeExpression(node);
      case 'assignment':
      case 'assignment_statement':
        return this.visitAssignment(node);
      case 'expression':
        return this.visitExpression(node);
      default:
        return null;
    }
  }

  /**
   * Visit an identifier node (variable reference)
   * @param node - Identifier CST node
   * @returns VariableNode AST node
   */
  private visitIdentifier(node: Node): VariableNode | null {
    logger.debug('Processing identifier');

    const name = this.getNodeText(node);
    const location = this.createSourceLocation(node);

    const variableNode: VariableNode = {
      type: 'variable',
      name,
      location,
    };

    logger.debug(`Created variable node: ${name}`);
    return variableNode;
  }

  /**
   * Visit a literal node (number, string, boolean)
   * @param node - Literal CST node
   * @returns LiteralNode AST node
   */
  private visitLiteral(node: Node): LiteralNode | null {
    logger.debug(`Processing literal: ${node.type}`);

    const location = this.createSourceLocation(node);
    let value: string | number | boolean;

    switch (node.type) {
      case 'number':
        value = this.parseNumber(node);
        break;
      case 'string':
        value = this.parseString(node);
        break;
      case 'boolean':
        value = this.parseBoolean(node);
        break;
      default:
        return null;
    }

    const literalNode: LiteralNode = {
      type: 'literal',
      value,
      location,
    };

    logger.debug(`Created literal node: ${typeof value} = ${value}`);
    return literalNode;
  }

  /**
   * Visit a vector/array node
   * @param node - Vector CST node
   * @returns VectorExpressionNode AST node
   */
  private visitVector(node: Node): VectorExpressionNode | null {
    logger.debug('Processing vector/array');

    const location = this.createSourceLocation(node);
    const elements: ASTNode[] = [];

    // Parse vector elements
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (child && child.type === 'expression') {
        const elementNode = this.visitExpression(child);
        if (elementNode) {
          elements.push(elementNode);
        }
      }
    }

    const vectorNode: VectorExpressionNode = {
      type: 'vector',
      elements,
      location,
    };

    logger.debug(`Created vector node with ${elements.length} elements`);
    return vectorNode;
  }

  /**
   * Visit a binary expression node
   * @param node - Binary expression CST node
   * @returns BinaryExpressionNode AST node
   */
  private visitBinaryExpression(node: Node): BinaryExpressionNode | null {
    logger.debug('Processing binary expression');

    const location = this.createSourceLocation(node);

    // Find left operand, operator, and right operand
    const leftNode = this.findChildOfType(node, 'expression');
    const operatorNode = this.findOperatorNode(node);
    const rightNode = this.findRightOperand(node);

    if (!leftNode || !operatorNode || !rightNode) {
      this.errorHandler.logError('Binary expression missing required components');
      return null;
    }

    const leftASTNode = this.visitExpression(leftNode);
    const operator = this.getNodeText(operatorNode);
    const rightASTNode = this.visitExpression(rightNode);

    if (!leftASTNode || !rightASTNode) {
      this.errorHandler.logError('Binary expression operands could not be parsed');
      return null;
    }

    const binaryExpressionNode: BinaryExpressionNode = {
      type: 'binary_expression',
      left: leftASTNode,
      operator,
      right: rightASTNode,
      location,
    };

    logger.debug(`Created binary expression: ${leftASTNode.type} ${operator} ${rightASTNode.type}`);
    return binaryExpressionNode;
  }

  /**
   * Visit a range expression node (e.g., [start:step:end])
   * @param node - Range expression CST node
   * @returns RangeExpressionNode AST node
   */
  private visitRangeExpression(node: Node): RangeExpressionNode | null {
    logger.debug('Processing range expression');

    const location = this.createSourceLocation(node);

    // Parse range components: [start:step:end] or [start:end]
    const components = this.parseRangeComponents(node);

    // Create literal nodes for start, step, and end
    const startNode: LiteralNode = {
      type: 'literal',
      value: components.start,
      location,
    };

    const endNode: LiteralNode = {
      type: 'literal',
      value: components.end,
      location,
    };

    const rangeExpressionNode: RangeExpressionNode = {
      type: 'range',
      start: startNode,
      end: endNode,
      location,
      ...(components.step !== undefined && {
        step: {
          type: 'literal',
          value: components.step,
          location,
        } as LiteralNode,
      }),
    };

    logger.debug(
      `Created range expression: [${components.start}:${components.step ?? ''}:${components.end}]`
    );
    return rangeExpressionNode;
  }

  /**
   * Visit an assignment node
   * @param node - Assignment CST node
   * @returns AssignmentNode AST node
   */
  private visitAssignment(node: Node): AssignmentNode | null {
    logger.debug('Processing assignment');

    const location = this.createSourceLocation(node);

    // Find identifier and value
    const identifierNode = this.findChildOfType(node, 'identifier');
    const valueNode = this.findChildOfType(node, 'expression');

    if (!identifierNode || !valueNode) {
      this.errorHandler.logError('Assignment missing identifier or value');
      return null;
    }

    const name = this.getNodeText(identifierNode);
    const valueASTNode = this.visitExpression(valueNode);

    if (!valueASTNode) {
      this.errorHandler.logError('Assignment value could not be parsed');
      return null;
    }

    const assignmentNode: AssignmentNode = {
      type: 'assignment',
      name,
      value: valueASTNode,
      location,
    };

    logger.debug(`Created assignment: ${name} = ${valueASTNode.type}`);
    return assignmentNode;
  }

  /**
   * Visit a generic expression node
   * @param node - Expression CST node
   * @returns AST node based on expression content
   */
  private visitExpression(node: Node): ASTNode | null {
    // Delegate to specific expression handlers based on child content
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (child) {
        const result = this.visitNode(child);
        if (result) {
          return result;
        }
      }
    }

    return null;
  }

  /**
   * Parse expression value from a CST node
   * @param node - Expression CST node
   * @returns Parsed value
   */
  private parseExpressionValue(node: Node): unknown {
    switch (node.type) {
      case 'number':
        return this.parseNumber(node);
      case 'string':
        return this.parseString(node);
      case 'boolean':
        return this.parseBoolean(node);
      case 'identifier':
        return this.getNodeText(node);
      case 'vector':
      case 'array':
        return this.parseVectorElements(node);
      default:
        // For complex expressions, return the text representation
        return this.getNodeText(node);
    }
  }

  /**
   * Parse vector elements from a vector node
   * @param node - Vector CST node
   * @returns Array of parsed elements
   */
  private parseVectorElements(node: Node): unknown[] {
    const elements: unknown[] = [];

    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (child && child.type === 'expression') {
        elements.push(this.parseExpressionValue(child));
      }
    }

    return elements;
  }

  /**
   * Find operator node in a binary expression
   * @param node - Binary expression CST node
   * @returns Operator node or null
   */
  private findOperatorNode(node: Node): Node | null {
    const operators = ['+', '-', '*', '/', '%', '==', '!=', '<', '>', '<=', '>=', '&&', '||'];

    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (child && operators.includes(child.type)) {
        return child;
      }
    }

    return null;
  }

  /**
   * Find right operand in a binary expression
   * @param node - Binary expression CST node
   * @returns Right operand node or null
   */
  private findRightOperand(node: Node): Node | null {
    // Find the second expression node (right operand)
    let expressionCount = 0;
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (child && child.type === 'expression') {
        expressionCount++;
        if (expressionCount === 2) {
          return child;
        }
      }
    }

    return null;
  }

  /**
   * Parse range components from a range expression
   * @param node - Range expression CST node
   * @returns Range components (start, step, end)
   */
  private parseRangeComponents(node: Node): {
    start: number;
    step?: number;
    end: number;
  } {
    const components: number[] = [];

    // Extract numeric components from range expression
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (child && child.type === 'number') {
        components.push(this.parseNumber(child));
      }
    }

    // Handle different range formats
    if (components.length === 2) {
      // [start:end]
      return { start: components[0] ?? 0, end: components[1] ?? 0 };
    } else if (components.length === 3) {
      // [start:step:end]
      return {
        start: components[0] ?? 0,
        step: components[1] ?? 1,
        end: components[2] ?? 0,
      };
    } else {
      // Default range
      return { start: 0, end: 0 };
    }
  }
}
