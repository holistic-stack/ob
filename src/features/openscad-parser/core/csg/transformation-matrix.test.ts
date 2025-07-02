/**
 * @file Transformation Matrix System Tests
 *
 * Comprehensive test suite for the transformation matrix system.
 * Tests proper transformation order, matrix composition, and error handling.
 *
 * Following TDD methodology with real implementations.
 */

import * as THREE from 'three';
import { beforeEach, describe, expect, it } from 'vitest';
import { createLogger } from '../../../../shared/services/logger.service.js';
import { TransformationMatrix, type TransformationParams } from './transformation-matrix.js';

const logger = createLogger('TransformationMatrixTest');

describe('[INIT][TransformationMatrix] Transformation Matrix System Tests', () => {
  beforeEach(() => {
    logger.debug('Setting up transformation matrix test');
  });

  describe('Basic Functionality', () => {
    it('should create identity matrix by default', () => {
      const result = TransformationMatrix.createFromParams({});

      expect(result.success).toBe(true);
      if (result.success) {
        const identity = new THREE.Matrix4().identity();
        expect(result.data.equals(identity)).toBe(true);
      }

      logger.debug('Identity matrix test completed');
    });

    it('should handle empty transformation parameters', () => {
      const params: TransformationParams = {};
      const result = TransformationMatrix.createFromParams(params);

      expect(result.success).toBe(true);
      if (result.success) {
        const identity = new THREE.Matrix4().identity();
        expect(result.data.equals(identity)).toBe(true);
      }

      logger.debug('Empty parameters test completed');
    });
  });

  describe('Individual Transformations', () => {
    it('should apply translation transformation', () => {
      const params: TransformationParams = {
        translation: [10, 20, 30],
      };

      const result = TransformationMatrix.createFromParams(params);

      expect(result.success).toBe(true);
      if (result.success) {
        const expected = new THREE.Matrix4().makeTranslation(10, 20, 30);
        expect(result.data.equals(expected)).toBe(true);
      }

      logger.debug('Translation transformation test completed');
    });

    it('should apply rotation transformation', () => {
      const params: TransformationParams = {
        rotation: [90, 0, 0], // 90 degrees around X-axis
      };

      const result = TransformationMatrix.createFromParams(params);

      expect(result.success).toBe(true);
      if (result.success) {
        const expected = new THREE.Matrix4().makeRotationX(Math.PI / 2);

        // Compare matrices with tolerance for floating point precision
        const tolerance = 1e-10;
        for (let i = 0; i < 16; i++) {
          const resultElement = result.data.elements[i];
          const expectedElement = expected.elements[i];
          if (resultElement !== undefined && expectedElement !== undefined) {
            expect(Math.abs(resultElement - expectedElement)).toBeLessThan(tolerance);
          }
        }
      }

      logger.debug('Rotation transformation test completed');
    });

    it('should apply scale transformation', () => {
      const params: TransformationParams = {
        scale: [2, 3, 4],
      };

      const result = TransformationMatrix.createFromParams(params);

      expect(result.success).toBe(true);
      if (result.success) {
        const expected = new THREE.Matrix4().makeScale(2, 3, 4);
        expect(result.data.equals(expected)).toBe(true);
      }

      logger.debug('Scale transformation test completed');
    });

    it('should apply mirror transformation', () => {
      const params: TransformationParams = {
        mirror: [1, 0, 0], // Mirror across YZ plane
      };

      const result = TransformationMatrix.createFromParams(params);

      expect(result.success).toBe(true);
      if (result.success) {
        // Mirror matrix for X-axis should negate X coordinates
        const testVector = new THREE.Vector3(1, 2, 3);
        testVector.applyMatrix4(result.data);

        expect(testVector.x).toBeCloseTo(-1);
        expect(testVector.y).toBeCloseTo(2);
        expect(testVector.z).toBeCloseTo(3);
      }

      logger.debug('Mirror transformation test completed');
    });
  });

  describe('Transformation Order', () => {
    it('should apply transformations in correct order: scale → rotate → translate', () => {
      const params: TransformationParams = {
        translation: [10, 0, 0],
        rotation: [0, 0, 90], // 90 degrees around Z-axis
        scale: [2, 1, 1],
      };

      const result = TransformationMatrix.createFromParams(params);

      expect(result.success).toBe(true);
      if (result.success) {
        // Test a point to verify transformation order
        const testPoint = new THREE.Vector3(1, 0, 0);
        testPoint.applyMatrix4(result.data);

        // Expected: scale(2,1,1) → rotate(90°Z) → translate(10,0,0)
        // (1,0,0) → (2,0,0) → (0,2,0) → (10,2,0)
        expect(testPoint.x).toBeCloseTo(10);
        expect(testPoint.y).toBeCloseTo(2);
        expect(testPoint.z).toBeCloseTo(0);
      }

      logger.debug('Transformation order test completed');
    });

    it('should handle complex transformation combinations', () => {
      const params: TransformationParams = {
        translation: [5, 10, 15],
        rotation: [45, 30, 60],
        scale: [1.5, 2.0, 0.5],
        mirror: [0, 1, 0], // Mirror across XZ plane
      };

      const result = TransformationMatrix.createFromParams(params);

      expect(result.success).toBe(true);
      if (result.success) {
        // Verify that the matrix is not identity and has reasonable values
        const identity = new THREE.Matrix4().identity();
        expect(result.data.equals(identity)).toBe(false);

        // Check that determinant is reasonable (should be negative due to mirror)
        const det = result.data.determinant();
        expect(det).toBeLessThan(0); // Negative due to mirror transformation
      }

      logger.debug('Complex transformation test completed');
    });
  });

  describe('Error Handling', () => {
    it('should reject zero scale factors', () => {
      const params: TransformationParams = {
        scale: [0, 1, 1], // Zero X scale
      };

      const result = TransformationMatrix.createFromParams(params);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('INVALID_SCALE_FACTORS');
        expect(result.error.message).toContain('Scale factors cannot be zero');
      }

      logger.debug('Zero scale factors test completed');
    });

    it('should reject zero mirror normal', () => {
      const params: TransformationParams = {
        mirror: [0, 0, 0], // Zero vector
      };

      const result = TransformationMatrix.createFromParams(params);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('INVALID_MIRROR_NORMAL');
        expect(result.error.message).toContain('cannot be zero vector');
      }

      logger.debug('Zero mirror normal test completed');
    });
  });

  describe('Matrix Composition', () => {
    it('should compose multiple matrices correctly', () => {
      const matrix1 = new THREE.Matrix4().makeTranslation(5, 0, 0);
      const matrix2 = new THREE.Matrix4().makeScale(2, 2, 2);
      const matrix3 = new THREE.Matrix4().makeRotationZ(Math.PI / 2);

      const composed = TransformationMatrix.compose([matrix1, matrix2, matrix3]);

      // Test a point through the composed transformation
      const testPoint = new THREE.Vector3(1, 0, 0);
      testPoint.applyMatrix4(composed);

      // Verify the composition worked correctly
      expect(composed).toBeInstanceOf(THREE.Matrix4);
      expect(composed.determinant()).not.toBe(0); // Non-singular matrix

      logger.debug('Matrix composition test completed');
    });

    it('should handle empty matrix array', () => {
      const composed = TransformationMatrix.compose([]);

      const identity = new THREE.Matrix4().identity();
      expect(composed.equals(identity)).toBe(true);

      logger.debug('Empty matrix array test completed');
    });
  });

  describe('Mesh Application', () => {
    it('should apply transformation matrix to mesh', () => {
      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const material = new THREE.MeshBasicMaterial();
      const mesh = new THREE.Mesh(geometry, material);

      const matrix = new THREE.Matrix4().makeTranslation(10, 20, 30);
      const result = TransformationMatrix.applyToMesh(mesh, matrix);

      expect(result.success).toBe(true);

      // Verify mesh position was updated
      expect(mesh.position.x).toBeCloseTo(10);
      expect(mesh.position.y).toBeCloseTo(20);
      expect(mesh.position.z).toBeCloseTo(30);

      logger.debug('Mesh application test completed');
    });
  });

  describe('Performance Validation', () => {
    it('should complete matrix operations within performance targets', () => {
      const startTime = performance.now();

      // Create multiple complex transformations
      for (let i = 0; i < 100; i++) {
        const params: TransformationParams = {
          translation: [i, i * 2, i * 3],
          rotation: [i % 360, (i * 2) % 360, (i * 3) % 360],
          scale: [1 + i * 0.1, 1 + i * 0.2, 1 + i * 0.3],
        };

        const result = TransformationMatrix.createFromParams(params);
        expect(result.success).toBe(true);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time (100ms for 100 operations is acceptable)
      expect(duration).toBeLessThan(100);

      logger.debug(`Performance validation completed: ${duration.toFixed(2)}ms for 100 operations`);
    });
  });
});
