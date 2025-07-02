/**
 * @file CSG Operations Visitor Implementation
 *
 * Specialized visitor for handling OpenSCAD CSG (Constructive Solid Geometry) operations
 * Converts tree-sitter CST nodes to typed AST nodes for boolean operations.
 *
 * Following TypeScript 5.8, DRY, and SRP principles.
 */

import type { Node } from 'web-tree-sitter';
import { createLogger } from '../../../../shared/services/logger.service.js';
import type {
  ASTNode,
  DifferenceNode,
  HullNode,
  IntersectionNode,
  MinkowskiNode,
  UnionNode,
} from '../ast-types.js';
import { BaseASTVisitor } from '../base-ast-visitor.js';
import type { IErrorHandler } from '../error-handler.interface.js';

const logger = createLogger('CSGVisitor');

/**
 * Visitor for OpenSCAD CSG (Constructive Solid Geometry) operations
 * Handles union(), difference(), intersection(), hull(), and minkowski() functions
 */
export class CSGVisitor extends BaseASTVisitor {
  constructor(source: string, errorHandler: IErrorHandler) {
    super(source, errorHandler);
    logger.debug('CSGVisitor initialized');
  }

  /**
   * Visit a CST node and convert to CSG AST node if applicable
   * @param node - Tree-sitter CST node
   * @returns CSG AST node or null if not a CSG operation
   */
  visitNode(node: Node): ASTNode | null {
    this.logNodeProcessing(node, 'Visiting');

    switch (node.type) {
      case 'function_call':
        return this.visitFunctionCall(node);
      case 'union':
      case 'difference':
      case 'intersection':
      case 'hull':
      case 'minkowski':
        return this.visitCSGFunction(node);
      default:
        return null;
    }
  }

  /**
   * Visit a function call node and check if it's a CSG operation
   * @param node - Function call CST node
   * @returns CSG AST node or null
   */
  private visitFunctionCall(node: Node): ASTNode | null {
    const nameNode = this.findChildOfType(node, 'identifier');
    if (!nameNode) {
      return null;
    }

    const functionName = this.getNodeText(nameNode);

    switch (functionName) {
      case 'union':
        return this.visitUnion(node);
      case 'difference':
        return this.visitDifference(node);
      case 'intersection':
        return this.visitIntersection(node);
      case 'hull':
        return this.visitHull(node);
      case 'minkowski':
        return this.visitMinkowski(node);
      default:
        return null;
    }
  }

  /**
   * Visit a CSG function node directly
   * @param node - CSG function CST node
   * @returns CSG AST node
   */
  private visitCSGFunction(node: Node): ASTNode | null {
    switch (node.type) {
      case 'union':
        return this.visitUnion(node);
      case 'difference':
        return this.visitDifference(node);
      case 'intersection':
        return this.visitIntersection(node);
      case 'hull':
        return this.visitHull(node);
      case 'minkowski':
        return this.visitMinkowski(node);
      default:
        return null;
    }
  }

  /**
   * Visit a union() function call
   * @param node - Union function CST node
   * @returns UnionNode AST node
   */
  private visitUnion(node: Node): UnionNode | null {
    logger.debug('Processing union() CSG operation');

    const location = this.createSourceLocation(node);
    const children = this.parseChildren(node);

    const unionNode: UnionNode = {
      type: 'union',
      children,
      location,
    };

    logger.debug(`Created union node with ${children.length} children`);
    return unionNode;
  }

  /**
   * Visit a difference() function call
   * @param node - Difference function CST node
   * @returns DifferenceNode AST node
   */
  private visitDifference(node: Node): DifferenceNode | null {
    logger.debug('Processing difference() CSG operation');

    const location = this.createSourceLocation(node);
    const children = this.parseChildren(node);

    const differenceNode: DifferenceNode = {
      type: 'difference',
      children,
      location,
    };

    logger.debug(`Created difference node with ${children.length} children`);
    return differenceNode;
  }

  /**
   * Visit an intersection() function call
   * @param node - Intersection function CST node
   * @returns IntersectionNode AST node
   */
  private visitIntersection(node: Node): IntersectionNode | null {
    logger.debug('Processing intersection() CSG operation');

    const location = this.createSourceLocation(node);
    const children = this.parseChildren(node);

    const intersectionNode: IntersectionNode = {
      type: 'intersection',
      children,
      location,
    };

    logger.debug(`Created intersection node with ${children.length} children`);
    return intersectionNode;
  }

  /**
   * Visit a hull() function call
   * @param node - Hull function CST node
   * @returns HullNode AST node
   */
  private visitHull(node: Node): HullNode | null {
    logger.debug('Processing hull() CSG operation');

    const location = this.createSourceLocation(node);
    const children = this.parseChildren(node);

    const hullNode: HullNode = {
      type: 'hull',
      children,
      location,
    };

    logger.debug(`Created hull node with ${children.length} children`);
    return hullNode;
  }

  /**
   * Visit a minkowski() function call
   * @param node - Minkowski function CST node
   * @returns MinkowskiNode AST node
   */
  private visitMinkowski(node: Node): MinkowskiNode | null {
    logger.debug('Processing minkowski() CSG operation');

    const args = this.parseArguments(node);
    const location = this.createSourceLocation(node);
    const children = this.parseChildren(node);

    // Build minkowski node with all properties at once
    const minkowskiNode: MinkowskiNode = {
      type: 'minkowski',
      children,
      location,
      ...(typeof args.convexity === 'number' && { convexity: args.convexity }),
    };

    logger.debug(`Created minkowski node with ${children.length} children`);
    return minkowskiNode;
  }

  /**
   * Parse function arguments from a CST node
   * @param node - Function call CST node
   * @returns Parsed arguments as key-value pairs
   */
  private parseArguments(node: Node): Record<string, unknown> {
    const args: Record<string, unknown> = {};

    // Find argument list
    const argListNode =
      this.findChildOfType(node, 'argument_list') || this.findChildOfType(node, 'arguments');

    if (!argListNode) {
      return args;
    }

    // Parse each argument
    for (let i = 0; i < argListNode.childCount; i++) {
      const child = argListNode.child(i);
      if (!child) continue;

      if (child.type === 'argument' || child.type === 'named_argument') {
        const parsedArg = this.parseArgument(child);
        if (parsedArg) {
          args[parsedArg.name] = parsedArg.value;
        }
      } else if (child.type === 'expression') {
        // Positional argument - for CSG operations, typically convexity parameter
        const value = this.parseExpression(child);
        if (i === 0 && typeof value === 'number') {
          args.convexity = value;
        }
      }
    }

    return args;
  }

  /**
   * Parse a single argument (named or positional)
   * @param node - Argument CST node
   * @returns Parsed argument with name and value
   */
  private parseArgument(node: Node): { name: string; value: unknown } | null {
    if (node.type === 'named_argument') {
      const nameNode = this.findChildOfType(node, 'identifier');
      const valueNode = this.findChildOfType(node, 'expression');

      if (nameNode && valueNode) {
        return {
          name: this.getNodeText(nameNode),
          value: this.parseExpression(valueNode),
        };
      }
    }

    return null;
  }

  /**
   * Parse an expression node to extract its value
   * @param node - Expression CST node
   * @returns Parsed value (number, boolean, array, etc.)
   */
  private parseExpression(node: Node): unknown {
    switch (node.type) {
      case 'number':
        return this.parseNumber(node);
      case 'boolean':
        return this.parseBoolean(node);
      case 'string':
        return this.parseString(node);
      case 'array':
      case 'vector':
        return this.parseArray(node);
      case 'identifier':
        return this.getNodeText(node); // Variable reference
      default:
        // For complex expressions, return the text for now
        return this.getNodeText(node);
    }
  }

  /**
   * Parse an array/vector expression
   * @param node - Array CST node
   * @returns Parsed array of values
   */
  private parseArray(node: Node): unknown[] {
    const elements: unknown[] = [];

    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (child && child.type === 'expression') {
        elements.push(this.parseExpression(child));
      }
    }

    return elements;
  }

  /**
   * Parse children nodes from a CSG function
   * @param node - CSG function CST node
   * @returns Array of child AST nodes (to be processed by other visitors)
   */
  private parseChildren(_node: Node): ASTNode[] {
    // For now, return empty array - children will be processed by the composite visitor
    // In a full implementation, this would recursively process child nodes
    // but we need to avoid circular dependencies between visitors
    return [];
  }
}
