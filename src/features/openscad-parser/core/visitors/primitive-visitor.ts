/**
 * @file Primitive Visitor Implementation
 *
 * Specialized visitor for handling OpenSCAD primitive nodes (cube, sphere, cylinder, etc.)
 * Converts tree-sitter CST nodes to typed AST nodes for geometric primitives.
 *
 * Following TypeScript 5.8, DRY, and SRP principles.
 */

import type { Node } from 'web-tree-sitter';
import { createLogger } from '../../../../shared/services/logger.service.js';
import type { ASTNode, CubeNode, CylinderNode, PolyhedronNode, SphereNode } from '../ast-types.js';
import { BaseASTVisitor } from '../base-ast-visitor.js';
import type { IErrorHandler } from '../error-handler.interface.js';

const logger = createLogger('PrimitiveVisitor');

/**
 * Visitor for OpenSCAD primitive geometric shapes
 * Handles cube(), sphere(), cylinder(), polyhedron(), etc.
 */
export class PrimitiveVisitor extends BaseASTVisitor {
  constructor(source: string, errorHandler: IErrorHandler) {
    super(source, errorHandler);
    logger.debug('PrimitiveVisitor initialized');
  }

  /**
   * Visit a CST node and convert to primitive AST node if applicable
   * @param node - Tree-sitter CST node
   * @returns Primitive AST node or null if not a primitive
   */
  visitNode(node: Node): ASTNode | null {
    this.logNodeProcessing(node, 'Visiting');

    switch (node.type) {
      case 'function_call':
        return this.visitFunctionCall(node);
      case 'cube':
      case 'sphere':
      case 'cylinder':
      case 'polyhedron':
        return this.visitPrimitiveFunction(node);
      default:
        return null;
    }
  }

  /**
   * Visit a function call node and check if it's a primitive
   * @param node - Function call CST node
   * @returns Primitive AST node or null
   */
  private visitFunctionCall(node: Node): ASTNode | null {
    const nameNode = this.findChildOfType(node, 'identifier');
    if (!nameNode) {
      return null;
    }

    const functionName = this.getNodeText(nameNode);

    switch (functionName) {
      case 'cube':
        return this.visitCube(node);
      case 'sphere':
        return this.visitSphere(node);
      case 'cylinder':
        return this.visitCylinder(node);
      case 'polyhedron':
        return this.visitPolyhedron(node);
      default:
        return null;
    }
  }

  /**
   * Visit a primitive function node directly
   * @param node - Primitive function CST node
   * @returns Primitive AST node
   */
  private visitPrimitiveFunction(node: Node): ASTNode | null {
    switch (node.type) {
      case 'cube':
        return this.visitCube(node);
      case 'sphere':
        return this.visitSphere(node);
      case 'cylinder':
        return this.visitCylinder(node);
      case 'polyhedron':
        return this.visitPolyhedron(node);
      default:
        return null;
    }
  }

  /**
   * Visit a cube() function call
   * @param node - Cube function CST node
   * @returns CubeNode AST node
   */
  private visitCube(node: Node): CubeNode | null {
    logger.debug('Processing cube() primitive');

    const args = this.parseArguments(node);
    const location = this.createSourceLocation(node);

    // Parse size parameter (can be number or [x,y,z] vector)
    let size: [number, number, number] | number = 1; // Default size
    if (args.size !== undefined) {
      if (Array.isArray(args.size) && args.size.length === 3) {
        size = args.size as [number, number, number];
      } else if (typeof args.size === 'number') {
        size = args.size;
      }
    }

    // Parse center parameter
    const center = typeof args.center === 'boolean' ? args.center : false;

    const cubeNode: CubeNode = {
      type: 'cube',
      size,
      center,
      location,
    };

    logger.debug(`Created cube node: size=${JSON.stringify(size)}, center=${center}`);
    return cubeNode;
  }

  /**
   * Visit a sphere() function call
   * @param node - Sphere function CST node
   * @returns SphereNode AST node
   */
  private visitSphere(node: Node): SphereNode | null {
    logger.debug('Processing sphere() primitive');

    const args = this.parseArguments(node);
    const location = this.createSourceLocation(node);

    // Build sphere node with all properties at once
    const sphereNode: SphereNode = {
      type: 'sphere',
      location,
      ...(typeof args.r === 'number' && { r: args.r }),
      ...(typeof args.radius === 'number' && { radius: args.radius }),
      ...(typeof args.d === 'number' && { d: args.d }),
      ...(typeof args.diameter === 'number' && { diameter: args.diameter }),
      ...(typeof args.fn === 'number' && { fn: args.fn }),
      ...(typeof args.fa === 'number' && { fa: args.fa }),
      ...(typeof args.fs === 'number' && { fs: args.fs }),
    };

    logger.debug(`Created sphere node: r=${sphereNode.r}, d=${sphereNode.d}`);
    return sphereNode;
  }

  /**
   * Visit a cylinder() function call
   * @param node - Cylinder function CST node
   * @returns CylinderNode AST node
   */
  private visitCylinder(node: Node): CylinderNode | null {
    logger.debug('Processing cylinder() primitive');

    const args = this.parseArguments(node);
    const location = this.createSourceLocation(node);

    // Build cylinder node with all properties at once
    // Note: h is required, so provide default if not specified
    const cylinderNode: CylinderNode = {
      type: 'cylinder',
      h: typeof args.h === 'number' ? args.h : typeof args.height === 'number' ? args.height : 1,
      location,
      ...(typeof args.r === 'number' && { r: args.r }),
      ...(typeof args.r1 === 'number' && { r1: args.r1 }),
      ...(typeof args.r2 === 'number' && { r2: args.r2 }),
      ...(typeof args.d === 'number' && { d: args.d }),
      ...(typeof args.d1 === 'number' && { d1: args.d1 }),
      ...(typeof args.d2 === 'number' && { d2: args.d2 }),
      ...(typeof args.center === 'boolean' && { center: args.center }),
      ...(typeof args.fn === 'number' && { fn: args.fn }),
      ...(typeof args.fa === 'number' && { fa: args.fa }),
      ...(typeof args.fs === 'number' && { fs: args.fs }),
    };

    logger.debug(`Created cylinder node: h=${cylinderNode.h}, r=${cylinderNode.r}`);
    return cylinderNode;
  }

  /**
   * Visit a polyhedron() function call
   * @param node - Polyhedron function CST node
   * @returns PolyhedronNode AST node
   */
  private visitPolyhedron(node: Node): PolyhedronNode | null {
    logger.debug('Processing polyhedron() primitive');

    const args = this.parseArguments(node);
    const location = this.createSourceLocation(node);

    // Build polyhedron node with all properties at once
    const polyhedronNode: PolyhedronNode = {
      type: 'polyhedron',
      points: Array.isArray(args.points) ? args.points : [],
      faces: Array.isArray(args.faces) ? args.faces : [],
      location,
      ...(typeof args.convexity === 'number' && { convexity: args.convexity }),
    };

    logger.debug(
      `Created polyhedron node: ${polyhedronNode.points.length} points, ${polyhedronNode.faces.length} faces`
    );
    return polyhedronNode;
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
        // Positional argument - map to appropriate parameter based on position
        const value = this.parseExpression(child);
        if (i === 0) {
          args.size = value; // First argument is typically size/radius
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
}
