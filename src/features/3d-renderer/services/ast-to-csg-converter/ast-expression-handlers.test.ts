/**
 * @file Tests for missing AST expression type handlers
 *
 * This file tests the newly implemented handlers for expression types that were
 * previously causing failures in the AST to CSG conversion pipeline.
 */

import { describe, expect, it } from 'vitest';
import type {
  BinaryExpressionNode,
  ExpressionNode,
  ListComprehensionExpressionNode,
  ParenthesizedExpressionNode,
  SpecialVariableNode,
} from '../../../openscad-parser/ast/ast-types.js';
import {
  createDefaultValue,
  evaluateBinaryExpression,
  evaluateListComprehension,
  evaluateSpecialVariable,
  tryEvaluateExpression,
} from '../../../openscad-parser/ast/utils/ast-evaluator.js';

// Helper function to create mock location
const createMockLocation = () => ({
  start: { line: 1, column: 1, offset: 0 },
  end: { line: 1, column: 10, offset: 10 },
});

describe('AST Expression Handlers', () => {
  describe('Binary Expression Evaluation', () => {
    it('should evaluate simple addition of literals', () => {
      const binaryExpr: BinaryExpressionNode = {
        type: 'expression',
        expressionType: 'binary_expression',
        operator: '+',
        left: {
          type: 'expression',
          expressionType: 'literal',
          value: 5,
          location: createMockLocation(),
        },
        right: {
          type: 'expression',
          expressionType: 'literal',
          value: 3,
          location: createMockLocation(),
        },
        location: createMockLocation(),
      };

      const result = evaluateBinaryExpression(binaryExpr);
      expect(result.success).toBe(true);
      expect(result.value).toBe(8);
    });

    it('should handle multiplication of literals', () => {
      const binaryExpr: BinaryExpressionNode = {
        type: 'expression',
        expressionType: 'binary_expression',
        operator: '*',
        left: {
          type: 'expression',
          expressionType: 'literal',
          value: 4,
          location: createMockLocation(),
        },
        right: {
          type: 'expression',
          expressionType: 'literal',
          value: 7,
          location: createMockLocation(),
        },
        location: createMockLocation(),
      };

      const result = evaluateBinaryExpression(binaryExpr);
      expect(result.success).toBe(true);
      expect(result.value).toBe(28);
    });

    it('should handle comparison operators', () => {
      const binaryExpr: BinaryExpressionNode = {
        type: 'expression',
        expressionType: 'binary_expression',
        operator: '<',
        left: {
          type: 'expression',
          expressionType: 'literal',
          value: 5,
          location: createMockLocation(),
        },
        right: {
          type: 'expression',
          expressionType: 'literal',
          value: 10,
          location: createMockLocation(),
        },
        location: createMockLocation(),
      };

      const result = evaluateBinaryExpression(binaryExpr);
      expect(result.success).toBe(true);
      expect(result.value).toBe(true);
    });

    it('should fail for non-literal operands', () => {
      const binaryExpr: BinaryExpressionNode = {
        type: 'expression',
        expressionType: 'binary_expression',
        operator: '+',
        left: {
          type: 'expression',
          expressionType: 'variable',
          name: 'x',
          location: createMockLocation(),
        },
        right: {
          type: 'expression',
          expressionType: 'literal',
          value: 3,
          location: createMockLocation(),
        },
        location: createMockLocation(),
      };

      const result = evaluateBinaryExpression(binaryExpr);
      expect(result.success).toBe(false);
    });
  });

  describe('Special Variable Evaluation', () => {
    it('should return 0 for special variables', () => {
      const specialVar: SpecialVariableNode = {
        type: 'expression',
        expressionType: 'special_variable',
        variable: '$fn',
        location: createMockLocation(),
      };

      const result = evaluateSpecialVariable(specialVar);
      expect(result.success).toBe(true);
      expect(result.value).toBe(0);
    });

    it('should handle different special variable types', () => {
      const specialVars: SpecialVariableNode['variable'][] = ['$fa', '$fs', '$t', '$children'];

      for (const varType of specialVars) {
        const specialVar: SpecialVariableNode = {
          type: 'expression',
          expressionType: 'special_variable',
          variable: varType,
          location: createMockLocation(),
        };

        const result = evaluateSpecialVariable(specialVar);
        expect(result.success).toBe(true);
        expect(result.value).toBe(0);
      }
    });
  });

  describe('List Comprehension Evaluation', () => {
    it('should return null for list comprehensions', () => {
      const listComp: ListComprehensionExpressionNode = {
        type: 'expression',
        expressionType: 'list_comprehension_expression',
        variable: 'i',
        range: {
          type: 'expression',
          expressionType: 'literal',
          value: [1, 2, 3],
          location: createMockLocation(),
        },
        expression: {
          type: 'expression',
          expressionType: 'literal',
          value: 'i',
          location: createMockLocation(),
        },
        location: createMockLocation(),
      };

      const result = evaluateListComprehension(listComp);
      expect(result.success).toBe(true);
      expect(result.value).toBe(null);
    });
  });

  describe('Default Value Creation', () => {
    it('should create default numeric value', () => {
      const result = createDefaultValue();
      expect(result.success).toBe(true);
      expect(result.value).toBe(0);
    });

    it('should create custom default value', () => {
      const result = createDefaultValue(42);
      expect(result.success).toBe(true);
      expect(result.value).toBe(42);
    });
  });

  describe('Expression Evaluation Router', () => {
    it('should route literal expressions correctly', () => {
      const literalExpr: ExpressionNode = {
        type: 'expression',
        expressionType: 'literal',
        value: 123,
        location: createMockLocation(),
      };

      const result = tryEvaluateExpression(literalExpr);
      expect(result.success).toBe(true);
      expect(result.value).toBe(123);
    });

    it('should route special variables correctly', () => {
      const specialVar: SpecialVariableNode = {
        type: 'expression',
        expressionType: 'special_variable',
        variable: '$fn',
        location: createMockLocation(),
      };

      const result = tryEvaluateExpression(specialVar);
      expect(result.success).toBe(true);
      expect(result.value).toBe(0);
    });

    it('should handle unknown expression types', () => {
      const unknownExpr: ExpressionNode = {
        type: 'expression',
        expressionType: 'unknown_type' as any,
        location: createMockLocation(),
      };

      const result = tryEvaluateExpression(unknownExpr);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Cannot evaluate expression type: unknown_type');
    });
  });
});
