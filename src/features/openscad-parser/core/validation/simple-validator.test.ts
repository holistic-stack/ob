/**
 * @file Simple Validator Tests
 *
 * Tests for the simplified AST validation system.
 *
 * Following TDD methodology with real implementations.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { createLogger } from '../../../../shared/services/logger.service.js';
import type { ASTNode, CubeNode, SourceLocation, SphereNode, UnionNode } from '../ast-types.js';
import { SimpleValidator } from './simple-validator.js';

const logger = createLogger('SimpleValidatorTest');

describe('[INIT][SimpleValidator] Simple Validation Tests', () => {
  let validator: SimpleValidator;

  beforeEach(() => {
    logger.debug('Setting up simple validator test');
    validator = new SimpleValidator();
  });

  describe('Basic Validation', () => {
    it('should validate empty AST successfully', () => {
      const result = validator.validateAST([]);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isValid).toBe(true);
        expect(result.data.errors).toHaveLength(0);
        expect(result.data.warnings).toHaveLength(0);
      }

      logger.debug('Empty AST validation test completed');
    });

    it('should validate simple cube successfully', () => {
      const cubeNode: CubeNode = {
        type: 'cube',
        size: 10,
        center: false,
        location: createTestLocation(),
      };

      const result = validator.validateAST([cubeNode]);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isValid).toBe(true);
        expect(result.data.errors).toHaveLength(0);
      }

      logger.debug('Simple cube validation test completed');
    });

    it('should validate sphere with radius successfully', () => {
      const sphereNode: SphereNode = {
        type: 'sphere',
        r: 5,
        location: createTestLocation(),
      };

      const result = validator.validateAST([sphereNode]);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isValid).toBe(true);
        expect(result.data.errors).toHaveLength(0);
      }

      logger.debug('Sphere validation test completed');
    });
  });

  describe('Validation Errors', () => {
    it('should detect invalid cube size', () => {
      const cubeNode = {
        type: 'cube',
        size: -5, // Invalid negative size
        center: false,
        location: createTestLocation(),
      } as CubeNode;

      const result = validator.validateAST([cubeNode]);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isValid).toBe(false);
        expect(result.data.errors).toHaveLength(1);
        expect(result.data.errors[0]?.code).toBe('INVALID_CUBE_SIZE');
        expect(result.data.errors[0]?.message).toContain('positive');
      }

      logger.debug('Invalid cube size validation test completed');
    });

    it('should detect invalid sphere radius', () => {
      const sphereNode = {
        type: 'sphere',
        r: -3, // Invalid negative radius
        location: createTestLocation(),
      } as SphereNode;

      const result = validator.validateAST([sphereNode]);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isValid).toBe(false);
        expect(result.data.errors).toHaveLength(1);
        expect(result.data.errors[0]?.code).toBe('INVALID_SPHERE_RADIUS');
      }

      logger.debug('Invalid sphere radius validation test completed');
    });

    it('should detect invalid cube size vector', () => {
      const cubeNode = {
        type: 'cube',
        size: [10, 20] as unknown as [number, number, number], // Invalid - should have 3 components
        center: false,
        location: createTestLocation(),
      } as CubeNode;

      const result = validator.validateAST([cubeNode]);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isValid).toBe(false);
        expect(result.data.errors).toHaveLength(1);
        expect(result.data.errors[0]?.code).toBe('INVALID_CUBE_SIZE_VECTOR');
      }

      logger.debug('Invalid cube size vector validation test completed');
    });
  });

  describe('CSG Operation Validation', () => {
    it('should validate union operation', () => {
      const unionNode: UnionNode = {
        type: 'union',
        children: [
          {
            type: 'cube',
            size: 10,
            center: false,
            location: createTestLocation(),
          } as CubeNode,
          {
            type: 'sphere',
            r: 5,
            location: createTestLocation(),
          } as SphereNode,
        ],
        location: createTestLocation(),
      };

      const result = validator.validateAST([unionNode]);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isValid).toBe(true);
        expect(result.data.errors).toHaveLength(0);
      }

      logger.debug('Union operation validation test completed');
    });

    it('should warn about empty union', () => {
      const unionNode: UnionNode = {
        type: 'union',
        children: [], // Empty union
        location: createTestLocation(),
      };

      const result = validator.validateAST([unionNode]);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isValid).toBe(true); // Warnings don't make it invalid
        expect(result.data.warnings).toHaveLength(1);
        expect(result.data.warnings[0]?.code).toBe('EMPTY_UNION');
      }

      logger.debug('Empty union warning test completed');
    });
  });

  describe('Complex Validation Scenarios', () => {
    it('should validate complex nested structure', () => {
      const complexAST: ASTNode[] = [
        {
          type: 'difference',
          children: [
            {
              type: 'union',
              children: [
                {
                  type: 'cube',
                  size: [20, 20, 20],
                  center: true,
                  location: createTestLocation(),
                } as CubeNode,
                {
                  type: 'sphere',
                  r: 8,
                  location: createTestLocation(),
                } as SphereNode,
              ],
              location: createTestLocation(),
            } as UnionNode,
          ],
          location: createTestLocation(),
        },
      ];

      const result = validator.validateAST(complexAST);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isValid).toBe(true);
        expect(result.data.errors).toHaveLength(0);
      }

      logger.debug('Complex nested structure validation test completed');
    });

    it('should handle validation errors gracefully', () => {
      // Test with malformed node that might cause exceptions
      const malformedNode = {
        type: 'unknown_type' as 'cube', // Force type for testing
        location: createTestLocation(),
      } as unknown as ASTNode;

      const result = validator.validateAST([malformedNode]);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.warnings).toHaveLength(1);
        expect(result.data.warnings[0]?.code).toBe('UNKNOWN_NODE_TYPE');
      }

      logger.debug('Malformed node validation test completed');
    });
  });

  describe('Error Reporting', () => {
    it('should include source location in errors', () => {
      const cubeNode = {
        type: 'cube',
        size: -5,
        center: false,
        location: {
          start: { line: 1, column: 1, offset: 0 },
          end: { line: 1, column: 10, offset: 9 },
        },
      } as CubeNode;

      const result = validator.validateAST([cubeNode]);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.errors).toHaveLength(1);
        expect(result.data.errors[0]?.location).toBeDefined();
        expect(result.data.errors[0]?.location?.start.line).toBe(1);
        expect(result.data.errors[0]?.location?.start.column).toBe(1);
      }

      logger.debug('Source location error reporting test completed');
    });

    it('should categorize issues by severity', () => {
      const unionNode: UnionNode = {
        type: 'union',
        children: [], // This should generate a warning
        location: createTestLocation(),
      };

      const cubeNode = {
        type: 'cube',
        size: -5, // This should generate an error
        center: false,
        location: createTestLocation(),
      } as CubeNode;

      const result = validator.validateAST([unionNode, cubeNode]);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isValid).toBe(false); // Errors make it invalid
        expect(result.data.errors).toHaveLength(1);
        expect(result.data.warnings).toHaveLength(1);
        expect(result.data.errors[0]?.severity).toBe('error');
        expect(result.data.warnings[0]?.severity).toBe('warning');
      }

      logger.debug('Issue severity categorization test completed');
    });
  });
});

/**
 * Helper function to create test source location
 */
function createTestLocation(): SourceLocation {
  return {
    start: { line: 1, column: 1, offset: 0 },
    end: { line: 1, column: 10, offset: 9 },
  };
}
