/**
 * @file Module Visitor Implementation
 *
 * Specialized visitor for handling OpenSCAD module definitions and module calls
 * Converts tree-sitter CST nodes to typed AST nodes for user-defined modules.
 *
 * Following TypeScript 5.8, DRY, and SRP principles.
 */

import type { Node } from 'web-tree-sitter';
import { createLogger } from '../../../../shared/services/logger.service.js';
import type { ASTNode, LiteralNode, ModuleDefinitionNode, VariableNode } from '../ast-types.js';
import { BaseASTVisitor } from '../base-ast-visitor.js';
import type { IErrorHandler } from '../error-handler.interface.js';

const logger = createLogger('ModuleVisitor');

/**
 * Visitor for OpenSCAD module definitions and module calls
 * Handles module definitions, parameter parsing, and module instantiation
 */
export class ModuleVisitor extends BaseASTVisitor {
  constructor(source: string, errorHandler: IErrorHandler) {
    super(source, errorHandler);
    logger.debug('ModuleVisitor initialized');
  }

  /**
   * Visit a CST node and convert to module AST node if applicable
   * @param node - Tree-sitter CST node
   * @returns Module AST node or null if not a module construct
   */
  visitNode(node: Node): ASTNode | null {
    this.logNodeProcessing(node, 'Visiting');

    switch (node.type) {
      case 'module_definition':
      case 'module_declaration':
        return this.visitModuleDefinition(node);
      case 'module_call':
      case 'module_instantiation':
        return this.visitModuleCall(node);
      case 'function_call':
        // Handle function calls that might be module calls
        return this.visitPotentialModuleCall(node);
      default:
        return null;
    }
  }

  /**
   * Visit a module definition node
   * @param node - Module definition CST node
   * @returns ModuleDefinitionNode AST node
   */
  private visitModuleDefinition(node: Node): ModuleDefinitionNode | null {
    logger.debug('Processing module definition');

    const location = this.createSourceLocation(node);

    // Find module name
    const nameNode = this.findChildOfType(node, 'identifier');
    if (!nameNode) {
      this.errorHandler.logError('Module definition missing name');
      return null;
    }

    const name = this.getNodeText(nameNode);

    // Parse module parameters
    const parameters = this.parseModuleParameters(node);

    // Parse module body
    const body = this.parseModuleBody(node);

    const moduleDefinitionNode: ModuleDefinitionNode = {
      type: 'module_definition',
      name,
      parameters,
      body,
      location,
    };

    logger.debug(`Created module definition: ${name} with ${parameters.length} parameters`);
    return moduleDefinitionNode;
  }

  /**
   * Visit a module call/instantiation node
   * @param node - Module call CST node
   * @returns ASTNode representing the module call
   */
  private visitModuleCall(node: Node): ASTNode | null {
    logger.debug('Processing module call');

    // For module calls, we need to create a generic function call node
    // since the AST types don't have a specific ModuleCallNode
    const location = this.createSourceLocation(node);

    // Find module name
    const nameNode = this.findChildOfType(node, 'identifier');
    if (!nameNode) {
      this.errorHandler.logError('Module call missing name');
      return null;
    }

    const moduleName = this.getNodeText(nameNode);

    // Parse arguments
    const args = this.parseModuleArguments(node);

    // Parse children (for module calls with child objects)
    const _children = this.parseModuleChildren(node);

    // Create a generic AST node for module calls - use variable as placeholder
    // This will be handled by the renderer as a user-defined module
    const moduleCallNode: VariableNode = {
      type: 'variable',
      name: `${moduleName}(${Object.keys(args).join(', ')})`,
      location,
    };

    logger.debug(`Created module call: ${moduleName} with ${Object.keys(args).length} arguments`);
    return moduleCallNode;
  }

  /**
   * Visit a function call that might be a module call
   * @param node - Function call CST node
   * @returns ASTNode if it's a module call, null otherwise
   */
  private visitPotentialModuleCall(node: Node): ASTNode | null {
    // Check if this function call has child objects (indicating it's a module call)
    const hasChildren = this.hasChildObjects(node);

    if (hasChildren) {
      // Treat as module call
      return this.visitModuleCall(node);
    }

    // Not a module call, let other visitors handle it
    return null;
  }

  /**
   * Parse module parameters from a module definition
   * @param node - Module definition CST node
   * @returns Array of parameter names
   */
  private parseModuleParameters(node: Node): string[] {
    const parameters: string[] = [];

    // Find parameter list
    const paramListNode =
      this.findChildOfType(node, 'parameter_list') || this.findChildOfType(node, 'parameters');

    if (!paramListNode) {
      return parameters;
    }

    // Parse each parameter
    for (let i = 0; i < paramListNode.childCount; i++) {
      const child = paramListNode.child(i);
      if (!child) continue;

      if (child.type === 'parameter' || child.type === 'identifier') {
        const paramName = this.getNodeText(child);
        if (paramName && paramName !== ',' && paramName !== '(' && paramName !== ')') {
          parameters.push(paramName);
        }
      }
    }

    return parameters;
  }

  /**
   * Parse module body from a module definition
   * @param node - Module definition CST node
   * @returns Array of body statements as AST nodes
   */
  private parseModuleBody(node: Node): ASTNode[] {
    const body: ASTNode[] = [];

    // Find module body (block statement or single statement)
    const bodyNode =
      this.findChildOfType(node, 'block_statement') ||
      this.findChildOfType(node, 'statement') ||
      this.findChildOfType(node, 'body');

    if (!bodyNode) {
      return body;
    }

    // Parse body statements
    // Note: In a full implementation, this would recursively parse
    // all statements in the module body using the composite visitor
    // For now, we'll create placeholder nodes
    for (let i = 0; i < bodyNode.childCount; i++) {
      const child = bodyNode.child(i);
      if (child && this.isStatementNode(child)) {
        // Create a placeholder node - in practice, this would be
        // processed by the composite visitor
        const placeholderNode: LiteralNode = {
          type: 'literal',
          value: this.getNodeText(child),
          location: this.createSourceLocation(child),
        };
        body.push(placeholderNode);
      }
    }

    return body;
  }

  /**
   * Parse module arguments from a module call
   * @param node - Module call CST node
   * @returns Object with argument name-value pairs
   */
  private parseModuleArguments(node: Node): Record<string, unknown> {
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
        // Positional argument
        const value = this.parseExpression(child);
        args[`arg_${i}`] = value;
      }
    }

    return args;
  }

  /**
   * Parse module children from a module call
   * @param node - Module call CST node
   * @returns Array of child AST nodes
   */
  private parseModuleChildren(node: Node): ASTNode[] {
    const children: ASTNode[] = [];

    // Find child objects (statements that follow the module call)
    // This is complex in OpenSCAD as children can be in various forms
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (child && this.isChildObject(child)) {
        // Create placeholder for child object
        // In practice, this would be processed by the composite visitor
        const childNode: LiteralNode = {
          type: 'literal',
          value: this.getNodeText(child),
          location: this.createSourceLocation(child),
        };
        children.push(childNode);
      }
    }

    return children;
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
   * @returns Parsed value
   */
  private parseExpression(node: Node): unknown {
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
        return this.parseArray(node);
      default:
        // For complex expressions, return the text representation
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
   * Check if a function call has child objects (indicating module call)
   * @param node - Function call CST node
   * @returns True if has child objects
   */
  private hasChildObjects(node: Node): boolean {
    // Look for child objects following the function call
    // This is a simplified check - in practice, this would be more sophisticated
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (child && this.isChildObject(child)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check if a node represents a statement
   * @param node - CST node
   * @returns True if it's a statement node
   */
  private isStatementNode(node: Node): boolean {
    const statementTypes = [
      'expression_statement',
      'assignment_statement',
      'module_call',
      'function_call',
      'block_statement',
      'if_statement',
      'for_statement',
    ];
    return statementTypes.includes(node.type);
  }

  /**
   * Check if a node represents a child object
   * @param node - CST node
   * @returns True if it's a child object
   */
  private isChildObject(node: Node): boolean {
    const childObjectTypes = [
      'cube',
      'sphere',
      'cylinder',
      'polyhedron',
      'translate',
      'rotate',
      'scale',
      'mirror',
      'union',
      'difference',
      'intersection',
      'module_call',
      'function_call',
    ];
    return childObjectTypes.includes(node.type);
  }
}
