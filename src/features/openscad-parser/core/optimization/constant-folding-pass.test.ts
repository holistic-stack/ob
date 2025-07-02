/**
 * @file Constant Folding Pass Tests
 *
 * Comprehensive tests for constant folding optimization including
 * binary expressions, unary expressions, and edge cases.
 *
 * Following TDD methodology with real implementations.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { createLogger } from '../../../../shared/services/logger.service.js';
import type {
  BinaryExpressionNode,
  LiteralNode,
  SourceLocation,
  UnaryExpressionNode,
} from '../ast-types.js';
import { ConstantFoldingPass } from './constant-folding-pass.js';
import { DEFAULT_OPTIMIZATION_CONFIG } from './optimization-pass.js';

const logger = createLogger('ConstantFoldingPassTest');

describe('[INIT][ConstantFoldingPass] Constant Folding Tests', () => {
  let pass: ConstantFoldingPass;

  beforeEach(() => {
    logger.debug('Setting up constant folding pass test');
    pass = new ConstantFoldingPass(DEFAULT_OPTIMIZATION_CONFIG);
  });

  describe('Basic Functionality', () => {
    it('should initialize correctly', () => {
      expect(pass.getName()).toBe('Constant Folding');
      expect(pass.getOptimizationTypes()).toContain('constant_folding');
      expect(pass.shouldApply()).toBe(true);

      logger.debug('Initialization test completed');
    });

    it('should handle empty AST', () => {
      const result = pass.optimize([]);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.optimizedAST).toHaveLength(0);
        expect(result.data.optimizationsApplied).toHaveLength(0);
        expect(result.data.errors).toHaveLength(0);
      }

      logger.debug('Empty AST test completed');
    });
  });

  describe('Binary Expression Folding', () => {
    it('should fold addition expressions', () => {
      const binaryExpr: BinaryExpressionNode = {
        type: 'binary_expression',
        operator: '+',
        left: createLiteral(5),
        right: createLiteral(3),
        location: createTestLocation(),
      };

      const result = pass.optimize([binaryExpr]);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.optimizedAST).toHaveLength(1);
        expect(result.data.optimizedAST[0]?.type).toBe('literal');
        expect((result.data.optimizedAST[0] as LiteralNode).value).toBe(8);
        expect(result.data.optimizationsApplied).toHaveLength(1);
        expect(result.data.optimizationsApplied[0]?.type).toBe('constant_folding');
      }

      logger.debug('Addition folding test completed');
    });

    it('should fold subtraction expressions', () => {
      const binaryExpr: BinaryExpressionNode = {
        type: 'binary_expression',
        operator: '-',
        left: createLiteral(10),
        right: createLiteral(4),
        location: createTestLocation(),
      };

      const result = pass.optimize([binaryExpr]);

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data.optimizedAST[0] as LiteralNode).value).toBe(6);
      }

      logger.debug('Subtraction folding test completed');
    });

    it('should fold multiplication expressions', () => {
      const binaryExpr: BinaryExpressionNode = {
        type: 'binary_expression',
        operator: '*',
        left: createLiteral(7),
        right: createLiteral(6),
        location: createTestLocation(),
      };

      const result = pass.optimize([binaryExpr]);

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data.optimizedAST[0] as LiteralNode).value).toBe(42);
      }

      logger.debug('Multiplication folding test completed');
    });

    it('should fold division expressions', () => {
      const binaryExpr: BinaryExpressionNode = {
        type: 'binary_expression',
        operator: '/',
        left: createLiteral(15),
        right: createLiteral(3),
        location: createTestLocation(),
      };

      const result = pass.optimize([binaryExpr]);

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data.optimizedAST[0] as LiteralNode).value).toBe(5);
      }

      logger.debug('Division folding test completed');
    });

    it('should handle division by zero', () => {
      const binaryExpr: BinaryExpressionNode = {
        type: 'binary_expression',
        operator: '/',
        left: createLiteral(10),
        right: createLiteral(0),
        location: createTestLocation(),
      };

      const result = pass.optimize([binaryExpr]);

      expect(result.success).toBe(true);
      if (result.success) {
        // Should not fold division by zero
        expect(result.data.optimizedAST[0]?.type).toBe('binary_expression');
        expect(result.data.errors.length).toBeGreaterThan(0);
        expect(result.data.errors[0]?.code).toBe('DIVISION_BY_ZERO');
      }

      logger.debug('Division by zero test completed');
    });

    it('should fold comparison expressions', () => {
      const binaryExpr: BinaryExpressionNode = {
        type: 'binary_expression',
        operator: '<',
        left: createLiteral(5),
        right: createLiteral(10),
        location: createTestLocation(),
      };

      const result = pass.optimize([binaryExpr]);

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data.optimizedAST[0] as LiteralNode).value).toBe(1); // true
      }

      logger.debug('Comparison folding test completed');
    });

    it('should fold logical expressions', () => {
      const binaryExpr: BinaryExpressionNode = {
        type: 'binary_expression',
        operator: '&&',
        left: createLiteral(1),
        right: createLiteral(0),
        location: createTestLocation(),
      };

      const result = pass.optimize([binaryExpr]);

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data.optimizedAST[0] as LiteralNode).value).toBe(0); // false
      }

      logger.debug('Logical folding test completed');
    });
  });

  describe('Unary Expression Folding', () => {
    it('should fold unary plus expressions', () => {
      const unaryExpr: UnaryExpressionNode = {
        type: 'unary_expression',
        operator: '+',
        operand: createLiteral(42),
        location: createTestLocation(),
      };

      const result = pass.optimize([unaryExpr]);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.optimizedAST[0]?.type).toBe('literal');
        expect((result.data.optimizedAST[0] as LiteralNode).value).toBe(42);
      }

      logger.debug('Unary plus folding test completed');
    });

    it('should fold unary minus expressions', () => {
      const unaryExpr: UnaryExpressionNode = {
        type: 'unary_expression',
        operator: '-',
        operand: createLiteral(15),
        location: createTestLocation(),
      };

      const result = pass.optimize([unaryExpr]);

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data.optimizedAST[0] as LiteralNode).value).toBe(-15);
      }

      logger.debug('Unary minus folding test completed');
    });

    it('should fold logical not expressions', () => {
      const unaryExpr: UnaryExpressionNode = {
        type: 'unary_expression',
        operator: '!',
        operand: createLiteral(0),
        location: createTestLocation(),
      };

      const result = pass.optimize([unaryExpr]);

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data.optimizedAST[0] as LiteralNode).value).toBe(1); // !false = true
      }

      logger.debug('Logical not folding test completed');
    });
  });

  describe('Complex Expressions', () => {
    it('should not fold non-constant expressions', () => {
      const binaryExpr: BinaryExpressionNode = {
        type: 'binary_expression',
        operator: '+',
        left: createLiteral(5),
        right: {
          type: 'variable',
          name: 'x',
          location: createTestLocation(),
        },
        location: createTestLocation(),
      };

      const result = pass.optimize([binaryExpr]);

      expect(result.success).toBe(true);
      if (result.success) {
        // Should not fold because right operand is a variable
        expect(result.data.optimizedAST[0]?.type).toBe('binary_expression');
        expect(result.data.optimizationsApplied).toHaveLength(0);
      }

      logger.debug('Non-constant expression test completed');
    });

    it('should handle nested expressions', () => {
      const nestedExpr: BinaryExpressionNode = {
        type: 'binary_expression',
        operator: '+',
        left: {
          type: 'binary_expression',
          operator: '*',
          left: createLiteral(2),
          right: createLiteral(3),
          location: createTestLocation(),
        },
        right: createLiteral(4),
        location: createTestLocation(),
      };

      const result = pass.optimize([nestedExpr]);

      expect(result.success).toBe(true);
      if (result.success) {
        // Should fold the entire expression: (2 * 3) + 4 = 10
        expect(result.data.optimizedAST[0]?.type).toBe('literal');
        expect((result.data.optimizedAST[0] as LiteralNode).value).toBe(10);
        expect(result.data.optimizationsApplied.length).toBeGreaterThan(0);
      }

      logger.debug('Nested expression test completed');
    });

    it('should handle string literals correctly', () => {
      const binaryExpr: BinaryExpressionNode = {
        type: 'binary_expression',
        operator: '+',
        left: {
          type: 'literal',
          value: 'hello',
          location: createTestLocation(),
        },
        right: createLiteral(5),
        location: createTestLocation(),
      };

      const result = pass.optimize([binaryExpr]);

      expect(result.success).toBe(true);
      if (result.success) {
        // Should not fold because left operand is a string
        expect(result.data.optimizedAST[0]?.type).toBe('binary_expression');
        expect(result.data.optimizationsApplied).toHaveLength(0);
      }

      logger.debug('String literal test completed');
    });
  });

  describe('Error Handling', () => {
    it('should handle unknown operators gracefully', () => {
      const binaryExpr: BinaryExpressionNode = {
        type: 'binary_expression',
        operator: '???', // Unknown operator
        left: createLiteral(5),
        right: createLiteral(3),
        location: createTestLocation(),
      };

      const result = pass.optimize([binaryExpr]);

      expect(result.success).toBe(true);
      if (result.success) {
        // Should not fold unknown operator
        expect(result.data.optimizedAST[0]?.type).toBe('binary_expression');
        expect(result.data.optimizationsApplied).toHaveLength(0);
      }

      logger.debug('Unknown operator test completed');
    });

    it('should preserve source locations', () => {
      const location = {
        start: { line: 5, column: 10, offset: 50 },
        end: { line: 5, column: 20, offset: 60 },
      };

      const binaryExpr: BinaryExpressionNode = {
        type: 'binary_expression',
        operator: '+',
        left: createLiteral(1),
        right: createLiteral(2),
        location,
      };

      const result = pass.optimize([binaryExpr]);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.optimizedAST[0]?.location).toEqual(location);
      }

      logger.debug('Source location preservation test completed');
    });
  });
});

/**
 * Helper function to create a literal node
 */
function createLiteral(value: number): LiteralNode {
  return {
    type: 'literal',
    value,
    location: createTestLocation(),
  };
}

/**
 * Helper function to create test source location
 */
function createTestLocation(): SourceLocation {
  return {
    start: { line: 1, column: 1, offset: 0 },
    end: { line: 1, column: 10, offset: 9 },
  };
}
