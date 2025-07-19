/**
 * @file Tests for AST evaluator handlers
 *
 * Tests for AST expression evaluation handlers that validate successful Result
 * returns following bulletproof-react conventions (real implementations, no mocks).
 * These tests ensure new handlers properly return successful Results.
 */

import { describe, expect, it } from 'vitest';
import type {
  BinaryExpressionNode,
  ExpressionNode,
  ListComprehensionExpressionNode,
  LiteralNode,
  ParenthesizedExpressionNode,
  SpecialVariableNode,
} from '../ast-types.js';
import {
  createDefaultValue,
  evaluateBinaryExpression,
  evaluateListComprehension,
  evaluateParenthesizedExpression,
  evaluateSpecialVariable,
  evaluationError,
  evaluationSuccess,
  extractLiteralValue,
  isFunctionLiteral,
  isLiteralExpression,
  processFunctionLiteral,
  tryEvaluateExpression,
} from './ast-evaluator.js';

// Helper to create mock location
const createLocation = () => ({
  start: { line: 1, column: 1, offset: 0 },
  end: { line: 1, column: 10, offset: 10 },
});

// Helper to create literal expression
const createLiteral = (value: number | string | boolean): LiteralNode => ({
  type: 'expression',
  expressionType: 'literal',
  value,
  location: createLocation(),
});

describe('AST Evaluator Handlers', () => {
  describe('evaluateBinaryExpression handler', () => {
    it('should return successful Result for arithmetic operations', () => {
      const binaryExpr: BinaryExpressionNode = {
        type: 'expression',
        expressionType: 'binary',
        operator: '+',
        left: createLiteral(5),
        right: createLiteral(3),
        location: createLocation(),
      };

      const result = evaluateBinaryExpression(binaryExpr);

      expect(result.success).toBe(true);
      expect(result.value).toBe(8);
      expect(result.error).toBeUndefined();
    });

    it('should return successful Result for multiplication', () => {
      const binaryExpr: BinaryExpressionNode = {
        type: 'expression',
        expressionType: 'binary',
        operator: '*',
        left: createLiteral(4),
        right: createLiteral(7),
        location: createLocation(),
      };

      const result = evaluateBinaryExpression(binaryExpr);

      expect(result.success).toBe(true);
      expect(result.value).toBe(28);
    });

    it('should return successful Result for comparison operations', () => {
      const binaryExpr: BinaryExpressionNode = {
        type: 'expression',
        expressionType: 'binary',
        operator: '<',
        left: createLiteral(5),
        right: createLiteral(10),
        location: createLocation(),
      };

      const result = evaluateBinaryExpression(binaryExpr);

      expect(result.success).toBe(true);
      expect(result.value).toBe(true);
    });

    it('should return successful Result for logical operations', () => {
      const binaryExpr: BinaryExpressionNode = {
        type: 'expression',
        expressionType: 'binary',
        operator: '&&',
        left: createLiteral(1),
        right: createLiteral(1),
        location: createLocation(),
      };

      const result = evaluateBinaryExpression(binaryExpr);

      expect(result.success).toBe(true);
      expect(result.value).toBe(true);
    });

    it('should handle division by zero with error Result', () => {
      const binaryExpr: BinaryExpressionNode = {
        type: 'expression',
        expressionType: 'binary',
        operator: '/',
        left: createLiteral(10),
        right: createLiteral(0),
        location: createLocation(),
      };

      const result = evaluateBinaryExpression(binaryExpr);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Division by zero');
    });
  });

  describe('evaluateSpecialVariable handler', () => {
    it('should return successful Result for $fn variable', () => {
      const specialVar: SpecialVariableNode = {
        type: 'special_variable',
        name: '$fn',
        location: createLocation(),
      };

      const result = evaluateSpecialVariable(specialVar);

      expect(result.success).toBe(true);
      expect(result.value).toBe(0);
    });

    it('should return successful Result for all special variables', () => {
      const specialVars: SpecialVariableNode['name'][] = ['$fa', '$fs', '$t', '$children'];

      for (const varType of specialVars) {
        const specialVar: SpecialVariableNode = {
          type: 'special_variable',
          name: varType,
          location: createLocation(),
        };

        const result = evaluateSpecialVariable(specialVar);

        expect(result.success).toBe(true);
        expect(result.value).toBe(0);
      }
    });
  });

  describe('evaluateListComprehension handler', () => {
    it('should return successful Result for list comprehensions', () => {
      const listComp: ListComprehensionExpressionNode = {
        type: 'list_comprehension',
        variable: 'i',
        iterable: {
          type: 'expression',
          expressionType: 'array',
          items: [createLiteral(1), createLiteral(2), createLiteral(3)],
          location: createLocation(),
        } as ExpressionNode,
        expression: createLiteral('i'),
        location: createLocation(),
      };

      const result = evaluateListComprehension(listComp);

      expect(result.success).toBe(true);
      expect(result.value).toBe(null);
    });
  });

  describe('evaluateParenthesizedExpression handler', () => {
    it('should return error Result indicating delegation needed', () => {
      const parenExpr: ParenthesizedExpressionNode = {
        type: 'parenthesized_expression',
        expression: createLiteral(42),
        location: createLocation(),
      };

      const result = evaluateParenthesizedExpression(parenExpr);

      expect(result.success).toBe(false);
      expect(result.error).toContain('should delegate to inner expression');
    });
  });

  describe('createDefaultValue handler', () => {
    it('should return successful Result with default value', () => {
      const result = createDefaultValue();

      expect(result.success).toBe(true);
      expect(result.value).toBe(0);
    });

    it('should return successful Result with custom value', () => {
      const result = createDefaultValue(42);

      expect(result.success).toBe(true);
      expect(result.value).toBe(42);
    });
  });

  describe('tryEvaluateExpression handler router', () => {
    it('should return successful Result for literal expressions', () => {
      const literalExpr = createLiteral(123);

      const result = tryEvaluateExpression(literalExpr);

      expect(result.success).toBe(true);
      expect(result.value).toBe(123);
    });

    it('should return successful Result for special variables', () => {
      const specialVar: SpecialVariableNode = {
        type: 'special_variable',
        name: '$fn',
        location: createLocation(),
      };

      const result = tryEvaluateExpression(specialVar as unknown as ExpressionNode);

      expect(result.success).toBe(true);
      expect(result.value).toBe(0);
    });

    it('should return successful Result for binary expressions', () => {
      const binaryExpr: BinaryExpressionNode = {
        type: 'expression',
        expressionType: 'binary',
        operator: '+',
        left: createLiteral(2),
        right: createLiteral(3),
        location: createLocation(),
      };

      const result = tryEvaluateExpression(binaryExpr);

      expect(result.success).toBe(true);
      expect(result.value).toBe(5);
    });

    it('should handle unknown expression types with error Result', () => {
      const unknownExpr: ExpressionNode = {
        type: 'expression',
        expressionType: 'unknown_type' as 'unknown_type',
        location: createLocation(),
      };

      const result = tryEvaluateExpression(unknownExpr);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Cannot evaluate expression type: unknown_type');
    });
  });

  describe('utility functions', () => {
    it('should identify literal expressions correctly', () => {
      const literalExpr = createLiteral(42);
      const variableExpr: ExpressionNode = {
        type: 'expression',
        expressionType: 'variable',
        name: 'x',
        location: createLocation(),
      };

      expect(isLiteralExpression(literalExpr)).toBe(true);
      expect(isLiteralExpression(variableExpr)).toBe(false);
    });

    it('should extract literal values correctly', () => {
      expect(extractLiteralValue(createLiteral(42))).toBe(42);
      expect(extractLiteralValue(createLiteral('test'))).toBe('test');
      expect(extractLiteralValue(createLiteral(true))).toBe(true);
    });

    it('should create evaluation results correctly', () => {
      const successResult = evaluationSuccess(42);
      expect(successResult.success).toBe(true);
      expect(successResult.value).toBe(42);

      const errorResult = evaluationError('test error');
      expect(errorResult.success).toBe(false);
      expect(errorResult.error).toBe('test error');
    });

    it('should identify function literals correctly', () => {
      const functionLiteral: ExpressionNode = {
        type: 'expression',
        expressionType: 'function_literal',
        location: createLocation(),
      };

      const functionCall: ExpressionNode = {
        type: 'expression',
        expressionType: 'function_call',
        location: createLocation(),
      };

      const literal = createLiteral(42);

      expect(isFunctionLiteral(functionLiteral)).toBe(true);
      expect(isFunctionLiteral(functionCall)).toBe(true);
      expect(isFunctionLiteral(literal)).toBe(false);
    });

    it('should process function literals with successful Result', () => {
      const functionLiteral: ExpressionNode = {
        type: 'expression',
        expressionType: 'function_literal',
        location: createLocation(),
      };

      const result = processFunctionLiteral(functionLiteral);

      expect(result.success).toBe(true);
      expect(result.value).toBe(null);
    });
  });
});
