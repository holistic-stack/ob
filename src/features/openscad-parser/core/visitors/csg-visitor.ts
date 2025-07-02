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
  CubeNode,
  CylinderNode,
  DifferenceNode,
  FunctionCallNode,
  HullNode,
  IntersectionNode,
  MinkowskiNode,
  SphereNode,
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
      case 'module_instantiation':
        return this.visitModuleInstantiation(node);
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
   * Visit a module instantiation node and check if it's a CSG operation
   * @param node - Module instantiation CST node
   * @returns CSG AST node or null if not a CSG operation
   */
  private visitModuleInstantiation(node: Node): ASTNode | null {
    const nameNode = node.childForFieldName('name');
    if (!nameNode) {
      return null;
    }

    const moduleName = this.getNodeText(nameNode);

    switch (moduleName) {
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
  private parseChildren(node: Node): ASTNode[] {
    const children: ASTNode[] = [];

    // Debug: Log all child node types to understand the structure
    logger.debug(`CSG node has ${node.childCount} children:`);
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (child) {
        logger.debug(`  Child ${i}: ${child.type} (${this.getNodeText(child).slice(0, 20)}...)`);
      }
    }

    // Find the block statement or body that contains the children
    const blockNode = this.findChildOfType(node, 'block_statement') ||
                      this.findChildOfType(node, 'body') ||
                      this.findChildOfType(node, 'statement_list') ||
                      this.findChildOfType(node, 'block');

    if (!blockNode) {
      logger.debug('No block statement found in CSG operation');
      return children;
    }

    logger.debug(`Found block with ${blockNode.childCount} children`);

    // Parse each statement in the block
    for (let i = 0; i < blockNode.childCount; i++) {
      const child = blockNode.child(i);
      if (!child) continue;

      // Skip punctuation and whitespace
      if (child.type === '{' || child.type === '}' || child.type === ';' ||
          child.type === 'comment' || child.type === 'whitespace') {
        continue;
      }

      // Process statement nodes
      if (child.type === 'statement') {
        // Find the actual content inside the statement wrapper
        for (let j = 0; j < child.childCount; j++) {
          const statementContent = child.child(j);
          if (statementContent && this.isValidChildNode(statementContent)) {
            // Delegate to composite visitor to get proper AST node
            const astNode = this.delegateToCompositeVisitor(statementContent);
            if (astNode) {
              children.push(astNode);
            }
          }
        }
      } else if (this.isValidChildNode(child)) {
        // Direct child node (not wrapped in statement)
        const astNode = this.delegateToCompositeVisitor(child);
        if (astNode) {
          children.push(astNode);
        }
      }
    }

    logger.debug(`Parsed ${children.length} children from CSG operation`);
    return children;
  }

  /**
   * Check if a node is a valid child for CSG operations
   * @param node - CST node to check
   * @returns True if it's a valid child node
   */
  private isValidChildNode(node: Node): boolean {
    const validChildTypes = [
      'module_instantiation',  // cube(), sphere(), union(), etc.
      'function_call',         // function calls
      'assignment',            // variable assignments
      'expression_statement',  // expression statements
    ];
    return validChildTypes.includes(node.type);
  }

  /**
   * Delegate a node to the composite visitor for processing
   * @param node - CST node to delegate
   * @returns AST node or null if not handled
   */
  private delegateToCompositeVisitor(node: Node): ASTNode | null {
    // For now, we'll create nodes based on the actual content
    // This is a simplified approach until we have proper visitor delegation

    const location = this.createSourceLocation(node);
    const nodeText = this.getNodeText(node);

    // Extract the function/module name from the node text
    const match = nodeText.match(/^(\w+)\s*\(/);
    const functionName = match ? match[1] : node.type;

    // Create appropriate primitive node types based on the function name
    switch (functionName) {
      case 'cube': {
        const cubeNode: CubeNode = {
          type: 'cube',
          size: [10, 10, 10], // Default size - should be parsed from arguments
          center: false,
          location,
        };
        logger.debug(`Created cube node for: ${nodeText.slice(0, 50)}...`);
        return cubeNode;
      }

      case 'sphere': {
        const sphereNode: SphereNode = {
          type: 'sphere',
          r: 5, // Default radius - should be parsed from arguments
          location,
        };
        logger.debug(`Created sphere node for: ${nodeText.slice(0, 50)}...`);
        return sphereNode;
      }

      case 'cylinder': {
        const cylinderNode: CylinderNode = {
          type: 'cylinder',
          h: 10, // Default height - should be parsed from arguments
          r: 5,  // Default radius - should be parsed from arguments
          center: false,
          location,
        };
        logger.debug(`Created cylinder node for: ${nodeText.slice(0, 50)}...`);
        return cylinderNode;
      }

      default: {
        // For other types, create a generic function call node
        const placeholderNode: FunctionCallNode = {
          type: 'function_call',
          name: functionName,
          arguments: [],
          location,
          isBuiltIn: true,
        };
        logger.debug(`Created placeholder node for ${functionName}: ${nodeText.slice(0, 50)}...`);
        return placeholderNode;
      }
    }
  }
}
