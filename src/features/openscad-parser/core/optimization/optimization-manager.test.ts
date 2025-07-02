/**
 * @file Optimization Manager Tests
 *
 * Comprehensive tests for the optimization manager including
 * multi-pass optimization, performance tracking, and error handling.
 *
 * Following TDD methodology with real implementations.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { createLogger } from '../../../../shared/services/logger.service.js';
import type {
  ASTNode,
  BinaryExpressionNode,
  FunctionDefinitionNode,
  LiteralNode,
  SourceLocation,
} from '../ast-types.js';
import { OptimizationManager } from './optimization-manager.js';
import { DEFAULT_OPTIMIZATION_CONFIG } from './optimization-pass.js';

const logger = createLogger('OptimizationManagerTest');

describe('[INIT][OptimizationManager] Optimization Manager Tests', () => {
  let manager: OptimizationManager;

  beforeEach(() => {
    logger.debug('Setting up optimization manager test');
    manager = new OptimizationManager(DEFAULT_OPTIMIZATION_CONFIG);
  });

  describe('Basic Functionality', () => {
    it('should initialize correctly', () => {
      const availablePasses = manager.getAvailablePasses();

      expect(availablePasses.length).toBeGreaterThan(0);
      expect(availablePasses.some((pass) => pass.name === 'Constant Folding')).toBe(true);
      expect(availablePasses.some((pass) => pass.name === 'Dead Code Elimination')).toBe(true);

      logger.debug('Initialization test completed');
    });

    it('should handle empty AST', () => {
      const result = manager.optimize([]);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.optimizedAST).toHaveLength(0);
        expect(result.data.totalOptimizations).toBe(0);
        expect(result.data.totalErrors).toBe(0);
        expect(result.data.performanceGain).toBe(0);
      }

      logger.debug('Empty AST test completed');
    });

    it('should provide performance metrics', () => {
      const binaryExpr: BinaryExpressionNode = {
        type: 'binary_expression',
        operator: '+',
        left: createLiteral(5),
        right: createLiteral(3),
        location: createTestLocation(),
      };

      const result = manager.optimize([binaryExpr]);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.executionTime).toBeGreaterThan(0);
        expect(result.data.statisticsBefore).toBeDefined();
        expect(result.data.statisticsAfter).toBeDefined();
        expect(result.data.performanceGain).toBeGreaterThanOrEqual(0);
      }

      logger.debug('Performance metrics test completed');
    });
  });

  describe('Multi-Pass Optimization', () => {
    it('should apply constant folding', () => {
      const binaryExpr: BinaryExpressionNode = {
        type: 'binary_expression',
        operator: '+',
        left: createLiteral(10),
        right: createLiteral(20),
        location: createTestLocation(),
      };

      const result = manager.optimize([binaryExpr]);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.optimizedAST).toHaveLength(1);
        expect(result.data.optimizedAST[0]?.type).toBe('literal');
        expect((result.data.optimizedAST[0] as LiteralNode).value).toBe(30);
        expect(result.data.totalOptimizations).toBeGreaterThan(0);
      }

      logger.debug('Constant folding test completed');
    });

    it('should apply dead code elimination', () => {
      const unusedFunction: FunctionDefinitionNode = {
        type: 'function_definition',
        name: 'unused_function',
        parameters: ['x'],
        body: {
          type: 'literal',
          value: 42,
          location: createTestLocation(),
        },
        location: createTestLocation(),
      };

      const result = manager.optimize([unusedFunction]);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.optimizedAST).toHaveLength(0);
        expect(result.data.totalOptimizations).toBeGreaterThan(0);
      }

      logger.debug('Dead code elimination test completed');
    });

    it('should apply multiple optimizations in sequence', () => {
      const unusedFunction: FunctionDefinitionNode = {
        type: 'function_definition',
        name: 'unused_function',
        parameters: ['x'],
        body: {
          type: 'binary_expression',
          operator: '+',
          left: createLiteral(5),
          right: createLiteral(10),
          location: createTestLocation(),
        },
        location: createTestLocation(),
      };

      const constantExpr: BinaryExpressionNode = {
        type: 'binary_expression',
        operator: '*',
        left: createLiteral(3),
        right: createLiteral(4),
        location: createTestLocation(),
      };

      const result = manager.optimize([unusedFunction, constantExpr]);

      expect(result.success).toBe(true);
      if (result.success) {
        // Should have constant folding and dead code elimination
        expect(result.data.optimizedAST).toHaveLength(1); // Only the folded constant
        expect(result.data.optimizedAST[0]?.type).toBe('literal');
        expect((result.data.optimizedAST[0] as LiteralNode).value).toBe(12);
        expect(result.data.totalOptimizations).toBeGreaterThan(1);
      }

      logger.debug('Multiple optimizations test completed');
    });
  });

  describe('Optimization Convergence', () => {
    it('should stop when no more optimizations are possible', () => {
      const simpleNode: LiteralNode = {
        type: 'literal',
        value: 42,
        location: createTestLocation(),
      };

      const result = manager.optimize([simpleNode]);

      expect(result.success).toBe(true);
      if (result.success) {
        // No optimizations should be applied to a simple literal
        expect(result.data.totalOptimizations).toBe(0);
        expect(result.data.optimizedAST).toHaveLength(1);
        expect(result.data.optimizedAST[0]).toEqual(simpleNode);
      }

      logger.debug('Convergence test completed');
    });

    it('should handle iterative optimization', () => {
      // Create a complex expression that can be optimized in multiple passes
      const complexExpr: BinaryExpressionNode = {
        type: 'binary_expression',
        operator: '+',
        left: {
          type: 'binary_expression',
          operator: '*',
          left: createLiteral(2),
          right: createLiteral(3),
          location: createTestLocation(),
        },
        right: {
          type: 'binary_expression',
          operator: '-',
          left: createLiteral(10),
          right: createLiteral(4),
          location: createTestLocation(),
        },
        location: createTestLocation(),
      };

      const result = manager.optimize([complexExpr]);

      expect(result.success).toBe(true);
      if (result.success) {
        // Should fold to a single literal: (2*3) + (10-4) = 6 + 6 = 12
        expect(result.data.optimizedAST).toHaveLength(1);
        expect(result.data.optimizedAST[0]?.type).toBe('literal');
        expect((result.data.optimizedAST[0] as LiteralNode).value).toBe(12);
      }

      logger.debug('Iterative optimization test completed');
    });
  });

  describe('Configuration Handling', () => {
    it('should respect disabled optimizations', () => {
      const disabledConfig = {
        ...DEFAULT_OPTIMIZATION_CONFIG,
        enableConstantFolding: false,
      };

      const managerWithDisabled = new OptimizationManager(disabledConfig);

      const binaryExpr: BinaryExpressionNode = {
        type: 'binary_expression',
        operator: '+',
        left: createLiteral(5),
        right: createLiteral(3),
        location: createTestLocation(),
      };

      const result = managerWithDisabled.optimize([binaryExpr]);

      expect(result.success).toBe(true);
      if (result.success) {
        // Should not fold constants when disabled
        expect(result.data.optimizedAST[0]?.type).toBe('binary_expression');
      }

      logger.debug('Disabled optimization test completed');
    });

    it('should respect maximum pass limit', () => {
      const limitedConfig = {
        ...DEFAULT_OPTIMIZATION_CONFIG,
        maxOptimizationPasses: 1,
      };

      const managerWithLimit = new OptimizationManager(limitedConfig);

      const complexExpr: BinaryExpressionNode = {
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

      const result = managerWithLimit.optimize([complexExpr]);

      expect(result.success).toBe(true);
      if (result.success) {
        // With limited passes, might not fully optimize
        expect(result.data.passResults.length).toBeLessThanOrEqual(2); // At most 2 passes (constant folding + dead code)
      }

      logger.debug('Pass limit test completed');
    });
  });

  describe('Statistics and Reporting', () => {
    it('should provide detailed statistics', () => {
      const mixedAST: ASTNode[] = [
        {
          type: 'binary_expression',
          operator: '+',
          left: createLiteral(1),
          right: createLiteral(2),
          location: createTestLocation(),
        },
        {
          type: 'function_definition',
          name: 'unused_func',
          parameters: [],
          body: createLiteral(42),
          location: createTestLocation(),
        },
        {
          type: 'cube',
          size: 10,
          center: false,
          location: createTestLocation(),
        },
      ];

      const result = manager.optimize(mixedAST);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.statisticsBefore.totalNodes).toBeGreaterThan(0);
        expect(result.data.statisticsAfter.totalNodes).toBeGreaterThan(0);
        expect(result.data.statisticsBefore.totalNodes).toBeGreaterThanOrEqual(
          result.data.statisticsAfter.totalNodes
        );
      }

      logger.debug('Statistics test completed');
    });

    it('should track pass results', () => {
      const binaryExpr: BinaryExpressionNode = {
        type: 'binary_expression',
        operator: '+',
        left: createLiteral(5),
        right: createLiteral(3),
        location: createTestLocation(),
      };

      const result = manager.optimize([binaryExpr]);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.passResults.length).toBeGreaterThan(0);
        expect(result.data.passResults[0]?.optimizationsApplied).toBeDefined();
        expect(result.data.passResults[0]?.errors).toBeDefined();
      }

      logger.debug('Pass results tracking test completed');
    });
  });

  describe('Error Handling', () => {
    it('should handle optimization errors gracefully', () => {
      // This test would require a pass that can fail
      // For now, we test that the manager handles normal cases
      const validAST: ASTNode[] = [createLiteral(42)];

      const result = manager.optimize(validAST);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.totalErrors).toBe(0);
      }

      logger.debug('Error handling test completed');
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
