/**
 * AST Expression Handlers for Parameter Extraction
 *
 * This module provides handlers for extracting values from various AST node types
 * that are used in parameter extraction for OpenSCAD operations.
 */

import { createLogger } from '../../../../shared/services/logger.service.js';
import type {
  ASTNode,
  BinaryExpressionNode,
  ConditionalExpressionNode,
  ErrorNode,
  ExpressionNode,
  FunctionCallNode,
  IdentifierExpressionNode,
  LiteralNode,
  ModuleParameter,
  ParenthesizedExpressionNode,
  SpecialVariableNode,
  UnaryExpressionNode,
  VectorExpressionNode,
} from '../../../openscad-parser/ast/ast-types.ts';

const logger = createLogger('ASTExpressionHandlers');

interface NodeWithParameters {
  parameters: ModuleParameter[];
}

function _hasTextProperty(node: ASTNode): node is ASTNode & { text: string } {
  return 'text' in node && typeof (node as { text?: string }).text === 'string';
}

function isLiteralNode(node: ASTNode): node is LiteralNode {
  return node.type === 'expression' && (node as ExpressionNode).expressionType === 'literal';
}

function isIdentifierExpressionNode(node: ASTNode): node is IdentifierExpressionNode {
  return node.type === 'expression' && (node as ExpressionNode).expressionType === 'identifier';
}

function isSpecialVariableNode(node: ASTNode): node is SpecialVariableNode {
  return (
    node.type === 'expression' && (node as ExpressionNode).expressionType === 'special_variable'
  );
}

function isBinaryExpressionNode(node: ASTNode): node is BinaryExpressionNode {
  return (
    node.type === 'expression' && (node as ExpressionNode).expressionType === 'binary_expression'
  );
}

function isUnaryExpressionNode(node: ASTNode): node is UnaryExpressionNode {
  return (
    node.type === 'expression' && (node as ExpressionNode).expressionType === 'unary_expression'
  );
}

function isConditionalExpressionNode(node: ASTNode): node is ConditionalExpressionNode {
  return (
    node.type === 'expression' &&
    (node as ExpressionNode).expressionType === 'conditional_expression'
  );
}

function isErrorNode(node: ASTNode): node is ErrorNode {
  return node.type === 'error';
}

function isParenthesizedExpressionNode(node: ASTNode): node is ParenthesizedExpressionNode {
  return (
    node.type === 'expression' &&
    (node as ExpressionNode).expressionType === 'parenthesized_expression'
  );
}

function isVectorExpressionNode(node: ASTNode): node is VectorExpressionNode {
  return (
    node.type === 'expression' && (node as ExpressionNode).expressionType === 'vector_expression'
  );
}

function isFunctionCallNode(node: ASTNode): node is FunctionCallNode {
  return (
    node.type === 'module_instantiation' ||
    (node.type === 'expression' && (node as ExpressionNode).expressionType === 'function_call')
  );
}

function isParameterNode(node: ASTNode): node is ASTNode & { name: string; value: ASTNode } {
  return 'name' in node && 'value' in node && typeof node.name === 'string';
}

function isModuleParameter(param: ModuleParameter): param is ModuleParameter {
  return typeof param.name === 'string';
}

/**
 * Extract a numeric value from an AST node
 */
export function extractValue(node: ASTNode): number | null {
  if (!node) {
    logger.debug('[extractValue] Node is null or undefined');
    return null;
  }

  logger.debug(
    `[extractValue] Processing node type: '${node.type}', expressionType: '${(node as ExpressionNode).expressionType || 'N/A'}', text: '${node.location?.text || 'no text'}'`
  );

  if (isLiteralNode(node)) {
    if (typeof node.value === 'number') {
      return node.value;
    }
    if (typeof node.value === 'string') {
      const numericValue = parseFloat(node.value);
      if (!Number.isNaN(numericValue)) {
        return numericValue;
      }
    }
    return null;
  }

  if (isIdentifierExpressionNode(node)) {
    // Variable reference - for now return 0 as placeholder
    logger.debug(`[extractValue] Identifier '${node.text}' treated as 0`);
    return 0;
  }

  if (isSpecialVariableNode(node)) {
    // Special variables like $t, $fn, etc. - treat as 0
    logger.debug(`[extractValue] Special variable '${node.variable}' treated as 0`);
    return 0;
  }

  if (isBinaryExpressionNode(node)) {
    // Handle simple binary expressions
    return evaluateBinaryExpression(node);
  }

  if (isUnaryExpressionNode(node)) {
    // Handle unary expressions like -5
    return evaluateUnaryExpression(node);
  }

  // For member_expression, we don't have a direct numeric value without evaluation context
  // For now, return 0 as a placeholder.
  if (node.type === 'expression' && (node as ExpressionNode).expressionType === 'accessor') {
    logger.debug(`[extractValue] Member expression treated as 0`);
    return 0;
  }

  if (isFunctionCallNode(node)) {
    // Function calls that return numeric values - for now return 0
    logger.debug(`[extractValue] Function call treated as 0`);
    return 0;
  }

  if (isConditionalExpressionNode(node)) {
    // Conditional expressions - evaluate the true branch for simplicity
    if (node.thenBranch) {
      return extractValue(node.thenBranch);
    }
    return 0;
  }

  if (isErrorNode(node)) {
    // Error nodes - try to extract numbers from text content
    logger.warn(
      `[extractValue] Unhandled node type: 'ERROR', text: '${node.cstNodeText || 'no text'}'`
    );
    if (node.cstNodeText) {
      // Try to extract numbers from error node text
      const numbers = node.cstNodeText.match(/\d+(?:\.\d+)?/g);
      if (numbers && numbers.length > 0) {
        const firstNumber = parseFloat(numbers[0]);
        if (!Number.isNaN(firstNumber)) {
          logger.debug(`[extractValue] Extracted number ${firstNumber} from ERROR node text`);
          return firstNumber;
        }
      }
    }
    return null;
  }

  if (isParenthesizedExpressionNode(node)) {
    // Parenthesized expressions - try direct content extraction as fallback
    if (node.expression) {
      return extractValue(node.expression);
    }
    // Try to extract number from text content as fallback
    if (node.location?.text) {
      const textContent = node.location.text.replace(/[()[\]]/g, '').trim();
      const numValue = parseFloat(textContent);
      if (!Number.isNaN(numValue)) {
        logger.debug(
          `[extractValue] Extracted number ${numValue} from parenthesized text: '${node.location.text}'`
        );
        return numValue;
      }
    }
    logger.warn(`[extractValue] Parenthesized expression missing inner expression`);
    return null;
  }

  // Unknown node types
  logger.warn(
    `[extractValue] Unhandled node type: '${node.type}', text: '${node.location?.text || 'no text'}'`
  );
  return null;
}

/**
 * Evaluate a binary expression node
 */
function evaluateBinaryExpression(node: ASTNode): number | null {
  if (!isBinaryExpressionNode(node)) {
    return null;
  }

  const left = extractValue(node.left);
  const right = extractValue(node.right);

  if (left === null || right === null) {
    return null;
  }

  switch (node.operator) {
    case '+':
      return left + right;
    case '-':
      return left - right;
    case '*':
      return left * right;
    case '/':
      return right !== 0 ? left / right : null;
    case '%':
      return right !== 0 ? left % right : null;
    case '^':
    case '**':
      return left ** right;
    default:
      return null;
  }
}

/**
 * Evaluate a unary expression node
 */
function evaluateUnaryExpression(node: ASTNode): number | null {
  if (!isUnaryExpressionNode(node)) {
    return null;
  }

  const operand = extractValue(node.operand);
  if (operand === null) {
    return null;
  }

  switch (node.operator) {
    case '-':
      return -operand;
    case '+':
      return operand;
    case '!':
      return operand ? 0 : 1;
    default:
      return null;
  }
}

/**
 * Extract a vector from an AST node (for coordinates, sizes, etc.)
 */
export function extractVector(node: ASTNode): [number, number, number] | null {
  if (!node) {
    return null;
  }

  logger.debug(`[extractVector] Processing node type: '${node.type}'`);

  if (isVectorExpressionNode(node)) {
    // Direct vector/array nodes
    if (node.elements && Array.isArray(node.elements)) {
      const elements = node.elements;
      if (elements.length >= 3) {
        const x = extractValue(elements[0] as ASTNode) ?? 0;
        const y = extractValue(elements[1] as ASTNode) ?? 0;
        const z = extractValue(elements[2] as ASTNode) ?? 0;
        return [x, y, z];
      }
    }
    return null;
  }

  if (isParenthesizedExpressionNode(node)) {
    // Vector wrapped in parentheses
    if (node.expression) {
      return extractVector(node.expression);
    }
    // Try to parse vector from text content as fallback
    if (node.location?.text) {
      const vectorMatch = node.location.text.match(
        /\[\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*\]/
      );
      if (vectorMatch?.[1] && vectorMatch[2] && vectorMatch[3]) {
        const x = parseFloat(vectorMatch[1]);
        const y = parseFloat(vectorMatch[2]);
        const z = parseFloat(vectorMatch[3]);
        if (!Number.isNaN(x) && !Number.isNaN(y) && !Number.isNaN(z)) {
          logger.debug(
            `[extractVector] Extracted vector [${x}, ${y}, ${z}] from parenthesized text: '${node.location.text}'`
          );
          return [x, y, z];
        }
      }
    }
    return null;
  }

  if (isErrorNode(node)) {
    // Try to extract vector from ERROR node text
    if (node.cstNodeText) {
      const vectorMatch = node.cstNodeText.match(
        /\[\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*\]/
      );
      if (vectorMatch?.[1] && vectorMatch[2] && vectorMatch[3]) {
        const x = parseFloat(vectorMatch[1]);
        const y = parseFloat(vectorMatch[2]);
        const z = parseFloat(vectorMatch[3]);
        if (!Number.isNaN(x) && !Number.isNaN(y) && !Number.isNaN(z)) {
          logger.debug(
            `[extractVector] Extracted vector [${x}, ${y}, ${z}] from ERROR node text: '${node.cstNodeText}'`
          );
          return [x, y, z];
        }
      }
    }
    return null;
  }

  // Try to extract single value and create a uniform vector
  const value = extractValue(node);
  if (value !== null) {
    return [value, value, value];
  }
  // Try to parse vector from text as final fallback
  if (node.location?.text) {
    const vectorMatch = node.location.text.match(
      /\[\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*\]/
    );
    if (vectorMatch?.[1] && vectorMatch[2] && vectorMatch[3]) {
      const x = parseFloat(vectorMatch[1]);
      const y = parseFloat(vectorMatch[2]);
      const z = parseFloat(vectorMatch[3]);
      if (!Number.isNaN(x) && !Number.isNaN(y) && !Number.isNaN(z)) {
        logger.debug(
          `[extractVector] Extracted vector [${x}, ${y}, ${z}] from text: '${node.location.text}'`
        );
        return [x, y, z];
      }
    }
  }
  return null;
}

/**
 * Extract a boolean value from an AST node
 */
export function extractBoolean(node: ASTNode): boolean | null {
  if (!node) {
    return null;
  }

  if (isLiteralNode(node)) {
    if (typeof node.value === 'boolean') {
      return node.value;
    }
    if (typeof node.value === 'number') {
      // Non-zero numbers are truthy
      return node.value !== 0;
    }
  }
  // For other node types, try to extract a numeric value and convert to boolean
  const value = extractValue(node);
  return value !== null ? value !== 0 : null;
}

/**
 * Extract parameters from a parameter list node
 */
export function extractParameters(node: ASTNode): Record<string, number | null> {
  const params: Record<string, number | null> = {};

  // Check if the node has a 'parameters' property and it's an array
  if ('parameters' in node && Array.isArray((node as NodeWithParameters).parameters)) {
    const parameters = (node as NodeWithParameters).parameters; // Use the new interface

    for (const param of parameters) {
      if (isModuleParameter(param)) {
        const name = param.name;
        let value: number | null = null;

        // param.defaultValue is ParameterValue, which can be ASTNode or primitive
        if (
          typeof param.defaultValue === 'object' &&
          param.defaultValue !== null &&
          'type' in param.defaultValue
        ) {
          // It's an ASTNode
          value = extractValue(param.defaultValue as ASTNode);
        } else if (typeof param.defaultValue === 'number') {
          value = param.defaultValue;
        } else if (typeof param.defaultValue === 'boolean') {
          value = param.defaultValue ? 1 : 0;
        } else if (typeof param.defaultValue === 'string') {
          const numValue = parseFloat(param.defaultValue);
          if (!Number.isNaN(numValue)) {
            value = numValue;
          }
        }

        if (name && value !== null) {
          params[name] = value;
        }
      }
    }
  }

  return params;
}

/**
 * Create default value for a given type
 */
export function createDefaultValue(
  type: 'number' | 'vector' | 'boolean',
  defaultVal?: number | number[] | boolean
): number | number[] | boolean {
  switch (type) {
    case 'number':
      return typeof defaultVal === 'number' ? defaultVal : 1;
    case 'vector':
      if (Array.isArray(defaultVal) && defaultVal.length >= 3) {
        return [defaultVal[0] ?? 1, defaultVal[1] ?? 1, defaultVal[2] ?? 1];
      }
      return [1, 1, 1];
    case 'boolean':
      return typeof defaultVal === 'boolean' ? defaultVal : false;
    default:
      return defaultVal ?? 0; // Fallback for unexpected types
  }
}

/**
 * Evaluate binary expression for simple arithmetic - external API
 */
export function evaluateBinaryExpressionExternal(node: {
  left: ASTNode;
  right: ASTNode;
  operator: string;
}): { success: boolean; value?: number } {
  try {
    const leftValue = extractValue(node.left);
    const rightValue = extractValue(node.right);

    if (leftValue === null || rightValue === null) {
      return { success: false };
    }

    switch (node.operator) {
      case '+':
        return { success: true, value: leftValue + rightValue };
      case '-':
        return { success: true, value: leftValue - rightValue };
      case '*':
        return { success: true, value: leftValue * rightValue };
      case '/':
        if (rightValue === 0) return { success: false };
        return { success: true, value: leftValue / rightValue };
      case '%':
        if (rightValue === 0) return { success: false };
        return { success: true, value: leftValue % rightValue };
      case '^':
      case '**':
        return { success: true, value: leftValue ** rightValue };
      default:
        return { success: false };
    }
  } catch (error) {
    logger.warn(`[evaluateBinaryExpression] Error: ${error}`);
    return { success: false };
  }
}

/**
 * Check if a node represents a function literal
 */
export function isFunctionLiteral(node: ASTNode): boolean {
  return (
    (node.type === 'expression' &&
      (node as ExpressionNode).expressionType === 'function_literal') ||
    node.type === 'function_definition'
  );
}

/**
 * Handle special variable evaluation
 */
export function evaluateSpecialVariable(node: ASTNode): number {
  // Special variables like $t, $fn, $fa, $fs always return 0 for CSG operations
  if (isSpecialVariableNode(node)) {
    logger.debug(`[evaluateSpecialVariable] Special variable '${node.variable}' evaluated as 0`);
  } else {
    logger.warn(`[evaluateSpecialVariable] Node is not a SpecialVariableNode: '${node.type}'`);
  }
  return 0;
}

/**
 * Handle list comprehension evaluation
 */
export function evaluateListComprehension(_node: ASTNode): null {
  // List comprehensions don't evaluate to simple values for CSG operations
  logger.debug(`[evaluateListComprehension] List comprehension ignored for CSG conversion`);
  return null;
}
