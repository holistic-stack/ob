/**
 * @file Transformation Visitor Implementation
 *
 * Specialized visitor for handling OpenSCAD transformation nodes (translate, rotate, scale, mirror)
 * Converts tree-sitter CST nodes to typed AST nodes for geometric transformations.
 *
 * Following TypeScript 5.8, DRY, and SRP principles.
 */

import type { Node } from 'web-tree-sitter';
import { createLogger } from '../../../../shared/services/logger.service.js';
import type { ASTNode, MirrorNode, RotateNode, ScaleNode, TranslateNode } from '../ast-types.js';
import { BaseASTVisitor } from '../base-ast-visitor.js';
import type { IErrorHandler } from '../error-handler.interface.js';

const logger = createLogger('TransformationVisitor');

/**
 * Visitor for OpenSCAD transformation operations
 * Handles translate(), rotate(), scale(), and mirror() functions
 */
export class TransformationVisitor extends BaseASTVisitor {
  constructor(source: string, errorHandler: IErrorHandler) {
    super(source, errorHandler);
    logger.debug('TransformationVisitor initialized');
  }

  /**
   * Visit a CST node and convert to transformation AST node if applicable
   * @param node - Tree-sitter CST node
   * @returns Transformation AST node or null if not a transformation
   */
  visitNode(node: Node): ASTNode | null {
    this.logNodeProcessing(node, 'Visiting');

    switch (node.type) {
      case 'function_call':
        return this.visitFunctionCall(node);
      case 'translate':
      case 'rotate':
      case 'scale':
      case 'mirror':
        return this.visitTransformationFunction(node);
      default:
        return null;
    }
  }

  /**
   * Visit a function call node and check if it's a transformation
   * @param node - Function call CST node
   * @returns Transformation AST node or null
   */
  private visitFunctionCall(node: Node): ASTNode | null {
    const nameNode = this.findChildOfType(node, 'identifier');
    if (!nameNode) {
      return null;
    }

    const functionName = this.getNodeText(nameNode);

    switch (functionName) {
      case 'translate':
        return this.visitTranslate(node);
      case 'rotate':
        return this.visitRotate(node);
      case 'scale':
        return this.visitScale(node);
      case 'mirror':
        return this.visitMirror(node);
      default:
        return null;
    }
  }

  /**
   * Visit a transformation function node directly
   * @param node - Transformation function CST node
   * @returns Transformation AST node
   */
  private visitTransformationFunction(node: Node): ASTNode | null {
    switch (node.type) {
      case 'translate':
        return this.visitTranslate(node);
      case 'rotate':
        return this.visitRotate(node);
      case 'scale':
        return this.visitScale(node);
      case 'mirror':
        return this.visitMirror(node);
      default:
        return null;
    }
  }

  /**
   * Visit a translate() function call
   * @param node - Translate function CST node
   * @returns TranslateNode AST node
   */
  private visitTranslate(node: Node): TranslateNode | null {
    logger.debug('Processing translate() transformation');

    const args = this.parseArguments(node);
    const location = this.createSourceLocation(node);
    const children = this.parseChildren(node);

    // Parse vector parameter (required for translate)
    let v: [number, number, number] = [0, 0, 0];
    if (args.v && Array.isArray(args.v) && args.v.length >= 3) {
      v = [
        typeof args.v[0] === 'number' ? args.v[0] : 0,
        typeof args.v[1] === 'number' ? args.v[1] : 0,
        typeof args.v[2] === 'number' ? args.v[2] : 0,
      ];
    }

    const translateNode: TranslateNode = {
      type: 'translate',
      v,
      children,
      location,
    };

    logger.debug(`Created translate node: v=[${v.join(', ')}], children=${children.length}`);
    return translateNode;
  }

  /**
   * Visit a rotate() function call
   * @param node - Rotate function CST node
   * @returns RotateNode AST node
   */
  private visitRotate(node: Node): RotateNode | null {
    logger.debug('Processing rotate() transformation');

    const args = this.parseArguments(node);
    const location = this.createSourceLocation(node);
    const children = this.parseChildren(node);

    // Parse rotation parameter (required for rotate)
    let a: [number, number, number] | number = 0;
    if (typeof args.a === 'number') {
      a = args.a;
    } else if (Array.isArray(args.a) && args.a.length >= 3) {
      a = [
        typeof args.a[0] === 'number' ? args.a[0] : 0,
        typeof args.a[1] === 'number' ? args.a[1] : 0,
        typeof args.a[2] === 'number' ? args.a[2] : 0,
      ];
    }

    // Build rotate node with all properties at once
    const rotateNode: RotateNode = {
      type: 'rotate',
      a,
      children,
      location,
      ...(Array.isArray(args.v) &&
        args.v.length >= 3 && {
          v: [
            typeof args.v[0] === 'number' ? args.v[0] : 0,
            typeof args.v[1] === 'number' ? args.v[1] : 0,
            typeof args.v[2] === 'number' ? args.v[2] : 0,
          ] as [number, number, number],
        }),
    };

    logger.debug(
      `Created rotate node: a=${rotateNode.a}, v=${rotateNode.v}, children=${children.length}`
    );
    return rotateNode;
  }

  /**
   * Visit a scale() function call
   * @param node - Scale function CST node
   * @returns ScaleNode AST node
   */
  private visitScale(node: Node): ScaleNode | null {
    logger.debug('Processing scale() transformation');

    const args = this.parseArguments(node);
    const location = this.createSourceLocation(node);
    const children = this.parseChildren(node);

    // Parse scale parameter (required for scale)
    let v: [number, number, number] | number = 1;
    if (typeof args.v === 'number') {
      v = args.v;
    } else if (Array.isArray(args.v) && args.v.length >= 3) {
      v = [
        typeof args.v[0] === 'number' ? args.v[0] : 1,
        typeof args.v[1] === 'number' ? args.v[1] : 1,
        typeof args.v[2] === 'number' ? args.v[2] : 1,
      ];
    }

    // Build scale node with all properties at once
    const scaleNode: ScaleNode = {
      type: 'scale',
      v,
      children,
      location,
    };

    logger.debug(`Created scale node: v=${scaleNode.v}, children=${children.length}`);
    return scaleNode;
  }

  /**
   * Visit a mirror() function call
   * @param node - Mirror function CST node
   * @returns MirrorNode AST node
   */
  private visitMirror(node: Node): MirrorNode | null {
    logger.debug('Processing mirror() transformation');

    const args = this.parseArguments(node);
    const location = this.createSourceLocation(node);
    const children = this.parseChildren(node);

    // Parse vector parameter (required for mirror)
    let v: [number, number, number] = [1, 0, 0]; // Default mirror plane
    if (args.v && Array.isArray(args.v) && args.v.length >= 3) {
      v = [
        typeof args.v[0] === 'number' ? args.v[0] : 1,
        typeof args.v[1] === 'number' ? args.v[1] : 0,
        typeof args.v[2] === 'number' ? args.v[2] : 0,
      ];
    }

    const mirrorNode: MirrorNode = {
      type: 'mirror',
      v,
      children,
      location,
    };

    logger.debug(`Created mirror node: v=[${v.join(', ')}], children=${children.length}`);
    return mirrorNode;
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
          args.v = value; // First argument is typically the vector
        } else if (i === 1) {
          args.a = value; // Second argument might be angle for rotate
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
   * Parse children nodes from a transformation function
   * @param node - Transformation function CST node
   * @returns Array of child AST nodes (to be processed by other visitors)
   */
  private parseChildren(node: Node): ASTNode[] {
    const children: ASTNode[] = [];

    // In OpenSCAD, the syntax "translate([x,y,z]) object;" means object is a child
    // We need to look for the next sibling node in the parent context
    // For now, we'll look within the current node for child objects

    logger.debug(`Parsing children for transformation node: ${node.type}`);
    logger.debug(`Node has ${node.childCount} children`);

    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (!child) continue;

      logger.debug(
        `Child ${i}: type=${child.type}, text="${this.getNodeText(child).slice(0, 50)}..."`
      );

      // Skip parameter lists, identifiers, and punctuation
      if (
        child.type === 'parameter_list' ||
        child.type === 'identifier' ||
        child.type === '(' ||
        child.type === ')' ||
        child.type === ';'
      ) {
        continue;
      }

      // Process child nodes that represent objects to be transformed
      if (
        child.type === 'function_call' ||
        child.type === 'block_statement' ||
        child.type === 'statement'
      ) {
        // Use a simplified approach to create child nodes
        // In a full implementation, we would delegate to the composite visitor
        if (child.type === 'function_call') {
          const childText = this.getNodeText(child);
          const functionMatch = childText.match(/^([a-zA-Z_][a-zA-Z0-9_]*)/);

          if (functionMatch?.[1]) {
            const functionName = functionMatch[1];
            const childNode: ASTNode = {
              type: 'function_call',
              name: functionName,
              arguments: [],
              location: this.createSourceLocation(child),
              isBuiltIn: ['cube', 'sphere', 'cylinder'].includes(functionName),
            } as any;

            children.push(childNode);
            logger.debug(`Added child function call: ${functionName}`);
          }
        }
      }
    }

    logger.debug(`Parsed ${children.length} children for transformation node`);
    return children;
  }
}
