/**
 * AST Expression Handlers for Parameter Extraction
 *
 * This module provides handlers for extracting values from various AST node types
 * that are used in parameter extraction for OpenSCAD operations.
 */

import { createLogger } from '../../../../shared/services/logger.service.js';
import type { ASTNode } from '../../../openscad-parser/ast/ast-types.js';

const logger = createLogger('ASTExpressionHandlers');

/**
 * Extract a numeric value from an AST node
 */
export function extractValue(node: ASTNode): number | null {
  if (!node) {
    logger.debug('[extractValue] Node is null or undefined');
    return null;
  }

  logger.debug(
    `[extractValue] Processing node type: '${node.type}', text: '${node.text || 'no text'}'`
  );

  switch (node.type) {
    case 'number':
    case 'integer':
    case 'float': {
      // Direct numeric literals
      const numericValue = parseFloat(node.text || '0');
      if (!Number.isNaN(numericValue)) {
        return numericValue;
      }
      return null;
    }

    case 'literal':
      // Generic literal node
      if (node.text) {
        const literalValue = parseFloat(node.text);
        if (!Number.isNaN(literalValue)) {
          return literalValue;
        }
      }
      return null;

    case 'identifier':
      // Variable reference - for now return 0 as placeholder
      logger.debug(`[extractValue] Identifier '${node.text}' treated as 0`);
      return 0;

    case 'special_variable':
      // Special variables like $t, $fn, etc. - treat as 0
      logger.debug(`[extractValue] Special variable '${node.text}' treated as 0`);
      return 0;

    case 'binary_expression':
      // Handle simple binary expressions
      return evaluateBinaryExpression(node);

    case 'unary_expression':
      // Handle unary expressions like -5
      return evaluateUnaryExpression(node);

    case 'member_expression':
      // Handle member access like size.x - for now return 0
      logger.debug(`[extractValue] Member expression '${node.text}' treated as 0`);
      return 0;

    case 'function_call':
      // Function calls that return numeric values - for now return 0
      logger.debug(`[extractValue] Function call treated as 0`);
      return 0;

    case 'conditional_expression':
      // Conditional expressions - evaluate the true branch for simplicity
      if ('thenBranch' in node && node.thenBranch) {
        return extractValue(node.thenBranch as ASTNode);
      }
      return 0;

    case 'ERROR':
      // Error nodes - try to extract numbers from text content
      logger.warn(`[extractValue] Unhandled node type: 'ERROR', text: '${node.text || 'no text'}'`);
      if (node.text) {
        // Try to extract numbers from error node text
        const numbers = node.text.match(/\d+(?:\.\d+)?/g);
        if (numbers && numbers.length > 0) {
          const firstNumber = parseFloat(numbers[0]);
          if (!Number.isNaN(firstNumber)) {
            logger.debug(`[extractValue] Extracted number ${firstNumber} from ERROR node text`);
            return firstNumber;
          }
        }
      }
      return null;

    case 'parenthesized_expression':
      // Parenthesized expressions - try direct content extraction as fallback
      if ('expression' in node && node.expression) {
        return extractValue(node.expression as ASTNode);
      }
      // Try to extract number from text content as fallback
      if (node.text) {
        const textContent = node.text.replace(/[()[\]]/g, '').trim();
        const numValue = parseFloat(textContent);
        if (!Number.isNaN(numValue)) {
          logger.debug(
            `[extractValue] Extracted number ${numValue} from parenthesized text: '${node.text}'`
          );
          return numValue;
        }
      }
      logger.warn(`[extractValue] Parenthesized expression missing inner expression`);
      return null;

    default:
      // Unknown node types
      logger.warn(
        `[extractValue] Unhandled node type: '${node.type}', text: '${node.text || 'no text'}'`
      );
      return null;
  }
}

/**
 * Evaluate a binary expression node
 */
function evaluateBinaryExpression(node: ASTNode): number | null {
  if (!('operator' in node) || !('left' in node) || !('right' in node)) {
    return null;
  }

  const left = extractValue(node.left as ASTNode);
  const right = extractValue(node.right as ASTNode);

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
  if (!('operator' in node) || !('operand' in node)) {
    return null;
  }

  const operand = extractValue(node.operand as ASTNode);
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

  switch (node.type) {
    case 'vector':
    case 'list':
    case 'array':
      // Direct vector/array nodes
      if ('elements' in node && Array.isArray(node.elements)) {
        const elements = node.elements as ASTNode[];
        if (elements.length >= 3) {
          const x = extractValue(elements[0]) ?? 0;
          const y = extractValue(elements[1]) ?? 0;
          const z = extractValue(elements[2]) ?? 0;
          return [x, y, z];
        }
      }
      return null;

    case 'parenthesized_expression':
      // Vector wrapped in parentheses
      if ('expression' in node && node.expression) {
        return extractVector(node.expression as ASTNode);
      }
      // Try to parse vector from text content as fallback
      if (node.text) {
        const vectorMatch = node.text.match(/\[\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*\]/);
        if (vectorMatch) {
          const x = parseFloat(vectorMatch[1]);
          const y = parseFloat(vectorMatch[2]);
          const z = parseFloat(vectorMatch[3]);
          if (!Number.isNaN(x) && !Number.isNaN(y) && !Number.isNaN(z)) {
            logger.debug(
              `[extractVector] Extracted vector [${x}, ${y}, ${z}] from parenthesized text: '${node.text}'`
            );
            return [x, y, z];
          }
        }
      }
      return null;

    case 'expression':
      // Handle expression nodes that might contain vectors
      if ('expressionType' in node && node.expressionType === 'vector') {
        if ('elements' in node && Array.isArray(node.elements)) {
          const elements = node.elements as ASTNode[];
          if (elements.length >= 3) {
            const x = extractValue(elements[0]) ?? 0;
            const y = extractValue(elements[1]) ?? 0;
            const z = extractValue(elements[2]) ?? 0;
            return [x, y, z];
          }
        }
      }
      return null;

    case 'ERROR':
      // Try to extract vector from ERROR node text
      if (node.text) {
        const vectorMatch = node.text.match(/\[\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*\]/);
        if (vectorMatch) {
          const x = parseFloat(vectorMatch[1]);
          const y = parseFloat(vectorMatch[2]);
          const z = parseFloat(vectorMatch[3]);
          if (!Number.isNaN(x) && !Number.isNaN(y) && !Number.isNaN(z)) {
            logger.debug(
              `[extractVector] Extracted vector [${x}, ${y}, ${z}] from ERROR node text: '${node.text}'`
            );
            return [x, y, z];
          }
        }
      }
      return null;

    default: {
      // Try to extract single value and create a uniform vector
      const value = extractValue(node);
      if (value !== null) {
        return [value, value, value];
      }
      // Try to parse vector from text as final fallback
      if (node.text) {
        const vectorMatch = node.text.match(/\[\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*\]/);
        if (vectorMatch) {
          const x = parseFloat(vectorMatch[1]);
          const y = parseFloat(vectorMatch[2]);
          const z = parseFloat(vectorMatch[3]);
          if (!Number.isNaN(x) && !Number.isNaN(y) && !Number.isNaN(z)) {
            logger.debug(
              `[extractVector] Extracted vector [${x}, ${y}, ${z}] from text: '${node.text}'`
            );
            return [x, y, z];
          }
        }
      }
      return null;
    }
  }
}

/**
 * Extract a boolean value from an AST node
 */
export function extractBoolean(node: ASTNode): boolean | null {
  if (!node) {
    return null;
  }

  switch (node.type) {
    case 'boolean':
    case 'true':
      return true;
    case 'false':
      return false;
    case 'number':
    case 'integer':
    case 'float': {
      // Non-zero numbers are truthy
      const value = extractValue(node);
      return value !== null ? value !== 0 : null;
    }
    default:
      return null;
  }
}

/**
 * Extract parameters from a parameter list node
 */
export function extractParameters(node: ASTNode): Record<string, any> {
  const params: Record<string, any> = {};

  if (!node || !('parameters' in node)) {
    return params;
  }

  const parameters = node.parameters as ASTNode[];
  if (!Array.isArray(parameters)) {
    return params;
  }

  for (const param of parameters) {
    if ('name' in param && 'value' in param) {
      const name = param.name as string;
      const value = extractValue(param.value as ASTNode);
      if (name && value !== null) {
        params[name] = value;
      }
    }
  }

  return params;
}

/**
 * Create default value for a given type
 */
export function createDefaultValue(type: 'number' | 'vector' | 'boolean', defaultVal?: any): any {
  switch (type) {
    case 'number':
      return typeof defaultVal === 'number' ? defaultVal : 1;
    case 'vector':
      if (Array.isArray(defaultVal) && defaultVal.length >= 3) {
        return [defaultVal[0], defaultVal[1], defaultVal[2]];
      }
      return [1, 1, 1];
    case 'boolean':
      return typeof defaultVal === 'boolean' ? defaultVal : false;
    default:
      return defaultVal;
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
    node.type === 'function' ||
    node.type === 'function_literal' ||
    node.type === 'function_definition' ||
    ('expressionType' in node && node.expressionType === 'function_literal')
  );
}

/**
 * Handle special variable evaluation
 */
export function evaluateSpecialVariable(node: ASTNode): number {
  // Special variables like $t, $fn, $fa, $fs always return 0 for CSG operations
  logger.debug(`[evaluateSpecialVariable] Special variable '${node.text}' evaluated as 0`);
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
