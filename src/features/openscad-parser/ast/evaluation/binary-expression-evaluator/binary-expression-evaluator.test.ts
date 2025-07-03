/**
 * Binary Expression Evaluator Tests
 * 
 * This file contains tests for the binary expression evaluator.
 * Following the SRP principle, these tests focus solely on the binary expression
 * evaluation functionality.
 */

import { describe, it, expect } from 'vitest';
import { evaluateBinaryExpression } from './binary-expression-evaluator.js';
import * as ast from '../../ast-types.js';
import { ErrorHandler } from '../../../error-handling/index.js';

describe('BinaryExpressionEvaluator', () => {
  let errorHandler: ErrorHandler;

  beforeEach(() => {
    errorHandler = new ErrorHandler();
  });

  // Helper function to create a literal node
  function createLiteralNode(value: number | boolean): ast.LiteralNode {
    return {
      type: 'expression',
      expressionType: 'literal',
      literalType: typeof value === 'number' ? 'number' : 'boolean',
      value,
      location: undefined
    };
  }

  // Helper function to create a binary expression node
  function createBinaryExpressionNode(
    operator: ast.BinaryOperator,
    left: ast.ExpressionNode,
    right: ast.ExpressionNode
  ): ast.BinaryExpressionNode {
    return {
      type: 'expression',
      expressionType: 'binary',
      operator,
      left,
      right,
      location: undefined
    };
  }

  it('should evaluate addition correctly', () => {
    const leftNode = createLiteralNode(1);
    const rightNode = createLiteralNode(2);
    const binaryNode = createBinaryExpressionNode('+', leftNode, rightNode);

    const result = evaluateBinaryExpression(binaryNode, errorHandler);
    expect(result).toBe(3);
  });

  it('should evaluate subtraction correctly', () => {
    const leftNode = createLiteralNode(5);
    const rightNode = createLiteralNode(2);
    const binaryNode = createBinaryExpressionNode('-', leftNode, rightNode);

    const result = evaluateBinaryExpression(binaryNode, errorHandler);
    expect(result).toBe(3);
  });

  it('should evaluate multiplication correctly', () => {
    const leftNode = createLiteralNode(3);
    const rightNode = createLiteralNode(4);
    const binaryNode = createBinaryExpressionNode('*', leftNode, rightNode);

    const result = evaluateBinaryExpression(binaryNode, errorHandler);
    expect(result).toBe(12);
  });

  it('should evaluate division correctly', () => {
    const leftNode = createLiteralNode(10);
    const rightNode = createLiteralNode(2);
    const binaryNode = createBinaryExpressionNode('/', leftNode, rightNode);

    const result = evaluateBinaryExpression(binaryNode, errorHandler);
    expect(result).toBe(5);
  });

  it('should evaluate modulo correctly', () => {
    const leftNode = createLiteralNode(10);
    const rightNode = createLiteralNode(3);
    const binaryNode = createBinaryExpressionNode('%', leftNode, rightNode);

    const result = evaluateBinaryExpression(binaryNode, errorHandler);
    expect(result).toBe(1);
  });

  it('should evaluate nested binary expressions correctly', () => {
    // Create expression for (1 + 2) * 3
    const innerLeftNode = createLiteralNode(1);
    const innerRightNode = createLiteralNode(2);
    const innerBinaryNode = createBinaryExpressionNode('+', innerLeftNode, innerRightNode);
    
    const outerRightNode = createLiteralNode(3);
    const outerBinaryNode = createBinaryExpressionNode('*', innerBinaryNode, outerRightNode);

    const result = evaluateBinaryExpression(outerBinaryNode, errorHandler);
    expect(result).toBe(9); // (1 + 2) * 3 = 9
  });

  it('should handle comparison operators correctly', () => {
    // Test equal operator
    let binaryNode = createBinaryExpressionNode(
      '==',
      createLiteralNode(5),
      createLiteralNode(5)
    );
    expect(evaluateBinaryExpression(binaryNode, errorHandler)).toBe(true);

    // Test not equal operator
    binaryNode = createBinaryExpressionNode(
      '!=',
      createLiteralNode(5),
      createLiteralNode(3)
    );
    expect(evaluateBinaryExpression(binaryNode, errorHandler)).toBe(true);

    // Test less than operator
    binaryNode = createBinaryExpressionNode(
      '<',
      createLiteralNode(3),
      createLiteralNode(5)
    );
    expect(evaluateBinaryExpression(binaryNode, errorHandler)).toBe(true);

    // Test greater than operator
    binaryNode = createBinaryExpressionNode(
      '>',
      createLiteralNode(5),
      createLiteralNode(3)
    );
    expect(evaluateBinaryExpression(binaryNode, errorHandler)).toBe(true);
  });

  it('should handle logical operators correctly', () => {
    // Test AND operator
    let binaryNode = createBinaryExpressionNode(
      '&&',
      createLiteralNode(true),
      createLiteralNode(true)
    );
    expect(evaluateBinaryExpression(binaryNode, errorHandler)).toBe(true);

    binaryNode = createBinaryExpressionNode(
      '&&',
      createLiteralNode(true),
      createLiteralNode(false)
    );
    expect(evaluateBinaryExpression(binaryNode, errorHandler)).toBe(false);

    // Test OR operator
    binaryNode = createBinaryExpressionNode(
      '||',
      createLiteralNode(false),
      createLiteralNode(true)
    );
    expect(evaluateBinaryExpression(binaryNode, errorHandler)).toBe(true);

    binaryNode = createBinaryExpressionNode(
      '||',
      createLiteralNode(false),
      createLiteralNode(false)
    );
    expect(evaluateBinaryExpression(binaryNode, errorHandler)).toBe(false);
  });

  it('should return null for invalid operand types', () => {
    // Try to add a number and a boolean
    const leftNode = createLiteralNode(5);
    const rightNode = createLiteralNode(true);
    const binaryNode = createBinaryExpressionNode('+', leftNode, rightNode);

    const result = evaluateBinaryExpression(binaryNode, errorHandler);
    expect(result).toBeNull();
  });
});