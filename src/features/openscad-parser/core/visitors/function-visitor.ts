/**
 * @file Function Visitor Implementation
 *
 * Specialized visitor for handling OpenSCAD function definitions and function calls
 * Converts tree-sitter CST nodes to typed AST nodes for user-defined and built-in functions.
 *
 * Following TypeScript 5.8, DRY, and SRP principles.
 */

import type { Node } from 'web-tree-sitter';
import { createLogger } from '../../../../shared/services/logger.service.js';
import type { ASTNode, FunctionDefinitionNode, LiteralNode, VariableNode } from '../ast-types.js';
import { BaseASTVisitor } from '../base-ast-visitor.js';
import type { IErrorHandler } from '../error-handler.interface.js';

const logger = createLogger('FunctionVisitor');

/**
 * Built-in OpenSCAD functions that should be handled by this visitor
 */
const BUILTIN_FUNCTIONS = new Set([
  // Mathematical functions
  'abs',
  'acos',
  'asin',
  'atan',
  'atan2',
  'ceil',
  'cos',
  'exp',
  'floor',
  'ln',
  'log',
  'max',
  'min',
  'pow',
  'round',
  'sign',
  'sin',
  'sqrt',
  'tan',
  // String functions
  'str',
  'len',
  'search',
  'substr',
  // Vector functions
  'norm',
  'cross',
  'concat',
  // Utility functions
  'echo',
  'assert',
  'is_undef',
  'is_bool',
  'is_num',
  'is_string',
  'is_list',
  // Random functions
  'rands',
  // Lookup functions
  'lookup',
]);

/**
 * Visitor for OpenSCAD function definitions and function calls
 * Handles both user-defined functions and built-in function calls
 */
export class FunctionVisitor extends BaseASTVisitor {
  constructor(source: string, errorHandler: IErrorHandler) {
    super(source, errorHandler);
    logger.debug('FunctionVisitor initialized');
  }

  /**
   * Visit a CST node and convert to function AST node if applicable
   * @param node - Tree-sitter CST node
   * @returns Function AST node or null if not a function construct
   */
  visitNode(node: Node): ASTNode | null {
    this.logNodeProcessing(node, 'Visiting');

    switch (node.type) {
      case 'function_definition':
      case 'function_declaration':
        return this.visitFunctionDefinition(node);
      case 'function_call':
        return this.visitFunctionCall(node);
      case 'call_expression':
        return this.visitCallExpression(node);
      default:
        return null;
    }
  }

  /**
   * Visit a function definition node
   * @param node - Function definition CST node
   * @returns FunctionDefinitionNode AST node
   */
  private visitFunctionDefinition(node: Node): FunctionDefinitionNode | null {
    logger.debug('Processing function definition');

    const location = this.createSourceLocation(node);

    // Find function name
    const nameNode = this.findChildOfType(node, 'identifier');
    if (!nameNode) {
      this.errorHandler.logError('Function definition missing name');
      return null;
    }

    const name = this.getNodeText(nameNode);

    // Parse function parameters
    const parameters = this.parseFunctionParameters(node);

    // Parse function body (expression)
    const body = this.parseFunctionBody(node);

    if (!body) {
      this.errorHandler.logError('Function definition missing body');
      return null;
    }

    const functionDefinitionNode: FunctionDefinitionNode = {
      type: 'function_definition',
      name,
      parameters,
      body,
      location,
    };

    logger.debug(`Created function definition: ${name} with ${parameters.length} parameters`);
    return functionDefinitionNode;
  }

  /**
   * Visit a function call node
   * @param node - Function call CST node
   * @returns ASTNode representing the function call
   */
  private visitFunctionCall(node: Node): ASTNode | null {
    logger.debug('Processing function call');

    const location = this.createSourceLocation(node);

    // Find function name
    const nameNode = this.findChildOfType(node, 'identifier');
    if (!nameNode) {
      this.errorHandler.logError('Function call missing name');
      return null;
    }

    const functionName = this.getNodeText(nameNode);

    // Check if this is a built-in function
    const isBuiltIn = BUILTIN_FUNCTIONS.has(functionName);

    // Parse arguments
    const args = this.parseFunctionArguments(node);

    // Create function call node - use a generic approach since function_call isn't in AST union
    // In practice, this would be handled by creating a proper AST node type
    const functionCallNode: VariableNode = {
      type: 'variable',
      name: `${functionName}(${Object.keys(args).join(', ')})`,
      location,
    };

    logger.debug(
      `Created function call: ${functionName} (built-in: ${isBuiltIn}) with ${Object.keys(args).length} arguments`
    );
    return functionCallNode;
  }

  /**
   * Visit a call expression node (alternative syntax)
   * @param node - Call expression CST node
   * @returns ASTNode representing the function call
   */
  private visitCallExpression(node: Node): ASTNode | null {
    // Delegate to function call handler
    return this.visitFunctionCall(node);
  }

  /**
   * Parse function parameters from a function definition
   * @param node - Function definition CST node
   * @returns Array of parameter names
   */
  private parseFunctionParameters(node: Node): string[] {
    const parameters: string[] = [];

    // Find parameter list
    const paramListNode =
      this.findChildOfType(node, 'parameter_list') ||
      this.findChildOfType(node, 'parameters') ||
      this.findChildOfType(node, 'formal_parameters');

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
      } else if (child.type === 'parameter_declaration') {
        // Handle parameter with default value
        const identifierNode = this.findChildOfType(child, 'identifier');
        if (identifierNode) {
          parameters.push(this.getNodeText(identifierNode));
        }
      }
    }

    return parameters;
  }

  /**
   * Parse function body from a function definition
   * @param node - Function definition CST node
   * @returns Function body as AST node
   */
  private parseFunctionBody(node: Node): ASTNode | null {
    // Find function body (expression)
    const bodyNode =
      this.findChildOfType(node, 'expression') ||
      this.findChildOfType(node, 'return_expression') ||
      this.findChildOfType(node, 'body');

    if (!bodyNode) {
      return null;
    }

    // Parse the expression
    return this.parseExpressionAsASTNode(bodyNode);
  }

  /**
   * Parse function arguments from a function call
   * @param node - Function call CST node
   * @returns Object with argument name-value pairs
   */
  private parseFunctionArguments(node: Node): Record<string, unknown> {
    const args: Record<string, unknown> = {};

    // Find argument list
    const argListNode =
      this.findChildOfType(node, 'argument_list') ||
      this.findChildOfType(node, 'arguments') ||
      this.findChildOfType(node, 'actual_parameters');

    if (!argListNode) {
      return args;
    }

    let positionalIndex = 0;

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
        args[`arg_${positionalIndex}`] = value;
        positionalIndex++;
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
    } else if (node.type === 'argument') {
      // Could be named or positional
      const identifierNode = this.findChildOfType(node, 'identifier');
      const expressionNode = this.findChildOfType(node, 'expression');

      if (identifierNode && expressionNode) {
        // Named argument
        return {
          name: this.getNodeText(identifierNode),
          value: this.parseExpression(expressionNode),
        };
      } else if (expressionNode) {
        // Positional argument - caller should handle naming
        return {
          name: 'positional',
          value: this.parseExpression(expressionNode),
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
      case 'binary_expression':
        return this.parseBinaryExpression(node);
      case 'unary_expression':
        return this.parseUnaryExpression(node);
      case 'function_call':
        // Nested function call
        return {
          type: 'nested_function_call',
          content: this.getNodeText(node),
        };
      default:
        // For complex expressions, return the text representation
        return this.getNodeText(node);
    }
  }

  /**
   * Parse an expression node as an AST node
   * @param node - Expression CST node
   * @returns AST node representation
   */
  private parseExpressionAsASTNode(node: Node): ASTNode {
    const location = this.createSourceLocation(node);

    switch (node.type) {
      case 'number':
      case 'string':
      case 'boolean':
        return {
          type: 'literal',
          value: this.parseExpression(node),
          location,
        } as ASTNode;
      case 'identifier':
        return {
          type: 'variable',
          name: this.getNodeText(node),
          location,
        } as ASTNode;
      case 'binary_expression':
        return this.parseBinaryExpressionAsASTNode(node);
      default: {
        // Generic expression node - use literal as placeholder
        const literalNode: LiteralNode = {
          type: 'literal',
          value: this.getNodeText(node),
          location,
        };
        return literalNode;
      }
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
   * Parse a binary expression
   * @param node - Binary expression CST node
   * @returns Parsed binary expression object
   */
  private parseBinaryExpression(node: Node): unknown {
    const leftNode = this.findChildOfType(node, 'expression');
    const operatorNode = this.findOperatorNode(node);
    const rightNode = this.findRightOperand(node);

    if (leftNode && operatorNode && rightNode) {
      return {
        type: 'binary_expression',
        left: this.parseExpression(leftNode),
        operator: this.getNodeText(operatorNode),
        right: this.parseExpression(rightNode),
      };
    }

    return this.getNodeText(node);
  }

  /**
   * Parse a binary expression as an AST node
   * @param node - Binary expression CST node
   * @returns Binary expression AST node
   */
  private parseBinaryExpressionAsASTNode(node: Node): ASTNode {
    const location = this.createSourceLocation(node);
    const leftNode = this.findChildOfType(node, 'expression');
    const operatorNode = this.findOperatorNode(node);
    const rightNode = this.findRightOperand(node);

    if (leftNode && operatorNode && rightNode) {
      return {
        type: 'binary_expression',
        left: this.parseExpressionAsASTNode(leftNode),
        operator: this.getNodeText(operatorNode),
        right: this.parseExpressionAsASTNode(rightNode),
        location,
      } as ASTNode;
    }

    // Fallback to generic expression - use literal as placeholder
    const literalNode: LiteralNode = {
      type: 'literal',
      value: this.getNodeText(node),
      location,
    };
    return literalNode;
  }

  /**
   * Parse a unary expression
   * @param node - Unary expression CST node
   * @returns Parsed unary expression object
   */
  private parseUnaryExpression(node: Node): unknown {
    const operatorNode = this.findOperatorNode(node);
    const operandNode = this.findChildOfType(node, 'expression');

    if (operatorNode && operandNode) {
      return {
        type: 'unary_expression',
        operator: this.getNodeText(operatorNode),
        operand: this.parseExpression(operandNode),
      };
    }

    return this.getNodeText(node);
  }

  /**
   * Find operator node in an expression
   * @param node - Expression CST node
   * @returns Operator node or null
   */
  private findOperatorNode(node: Node): Node | null {
    const operators = ['+', '-', '*', '/', '%', '==', '!=', '<', '>', '<=', '>=', '&&', '||', '!'];

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
}
