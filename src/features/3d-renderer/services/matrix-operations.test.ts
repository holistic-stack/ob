/**
 * Simplified Matrix Operations API Tests
 *
 * Tests for simplified matrix operations API without complex infrastructure.
 * Following TDD methodology and bulletproof-react testing patterns.
 */

import { Matrix } from 'ml-matrix';
import { Matrix4 } from 'three';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createLogger } from '../../../shared/services/logger.service.js';
import { MatrixOperationsAPI } from './matrix-operations.api.js';

const logger = createLogger('MatrixOperationsTest');

describe('Simplified MatrixOperationsAPI', () => {
  let api: MatrixOperationsAPI;

  beforeEach(() => {
    logger.init('Setting up test environment');
    api = new MatrixOperationsAPI();
  });

  afterEach(() => {
    logger.end('Cleaning up test environment');
    // No cache to clear in simplified version
  });

  describe('Basic Matrix Operations', () => {
    it('should perform matrix addition correctly', async () => {
      logger.debug('Testing matrix addition');

      const a = new Matrix([
        [1, 2],
        [3, 4],
      ]);
      const b = new Matrix([
        [5, 6],
        [7, 8],
      ]);

      const result = await api.add(a, b);

      expect(result.success).toBe(true);
      if (result.success) {
        const expected = [
          [6, 8],
          [10, 12],
        ];
        const actual = result.data.result.to2DArray();
        expect(actual).toEqual(expected);
        expect(result.data.executionTime).toBeGreaterThanOrEqual(0);
      }
    });

    it('should perform matrix multiplication correctly', async () => {
      logger.debug('Testing matrix multiplication');

      const a = new Matrix([
        [1, 2],
        [3, 4],
      ]);
      const b = new Matrix([
        [5, 6],
        [7, 8],
      ]);

      const result = await api.multiply(a, b);

      expect(result.success).toBe(true);
      if (result.success) {
        const expected = [
          [19, 22],
          [43, 50],
        ];
        const actual = result.data.result.to2DArray();
        expect(actual).toEqual(expected);
        expect(result.data.executionTime).toBeGreaterThanOrEqual(0);
      }
    });

    it('should handle matrix transpose correctly', async () => {
      logger.debug('Testing matrix transpose');

      const matrix = new Matrix([
        [1, 2, 3],
        [4, 5, 6],
      ]);

      const result = await api.transpose(matrix);

      expect(result.success).toBe(true);
      if (result.success) {
        const expected = [
          [1, 4],
          [2, 5],
          [3, 6],
        ];
        const actual = result.data.result.to2DArray();
        expect(actual).toEqual(expected);
        expect(result.data.executionTime).toBeGreaterThanOrEqual(0);
      }
    });

    it('should handle matrix subtraction correctly', async () => {
      logger.debug('Testing matrix subtraction');

      const a = new Matrix([
        [5, 6],
        [7, 8],
      ]);
      const b = new Matrix([
        [1, 2],
        [3, 4],
      ]);

      const result = await api.subtract(a, b);

      expect(result.success).toBe(true);
      if (result.success) {
        const expected = [
          [4, 4],
          [4, 4],
        ];
        const actual = result.data.result.to2DArray();
        expect(actual).toEqual(expected);
        expect(result.data.executionTime).toBeGreaterThanOrEqual(0);
      }
    });

    it('should handle matrix inverse correctly', async () => {
      logger.debug('Testing matrix inverse');

      const matrix = new Matrix([
        [1, 2],
        [3, 4],
      ]);

      const result = await api.inverse(matrix);

      expect(result.success).toBe(true);
      if (result.success) {
        // Check that A * A^-1 = I (approximately)
        const identity = matrix.mmul(result.data.result);
        const identityArray = identity.to2DArray();
        
        // Check diagonal elements are close to 1
        expect(identityArray[0][0]).toBeCloseTo(1, 10);
        expect(identityArray[1][1]).toBeCloseTo(1, 10);
        
        // Check off-diagonal elements are close to 0
        expect(identityArray[0][1]).toBeCloseTo(0, 10);
        expect(identityArray[1][0]).toBeCloseTo(0, 10);
        
        expect(result.data.executionTime).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('Three.js Integration', () => {
    it('should convert Matrix4 to ml-matrix correctly', async () => {
      logger.debug('Testing Matrix4 to ml-matrix conversion');

      const matrix4 = new Matrix4().makeTranslation(1, 2, 3);
      const result = await api.convertMatrix4ToMLMatrix(matrix4);

      expect(result.success).toBe(true);
      if (result.success) {
        const mlMatrix = result.data.result;
        expect(mlMatrix.rows).toBe(4);
        expect(mlMatrix.columns).toBe(4);
        
        // Check translation values
        expect(mlMatrix.get(0, 3)).toBeCloseTo(1, 10);
        expect(mlMatrix.get(1, 3)).toBeCloseTo(2, 10);
        expect(mlMatrix.get(2, 3)).toBeCloseTo(3, 10);
        
        expect(result.data.executionTime).toBeGreaterThanOrEqual(0);
      }
    });

    it('should convert ml-matrix to Matrix4 correctly', async () => {
      logger.debug('Testing ml-matrix to Matrix4 conversion');

      const mlMatrix = new Matrix([
        [1, 0, 0, 5],
        [0, 1, 0, 6],
        [0, 0, 1, 7],
        [0, 0, 0, 1],
      ]);

      const result = await api.convertMLMatrixToMatrix4(mlMatrix);

      expect(result.success).toBe(true);
      if (result.success) {
        const matrix4 = result.data.result;

        // Check identity matrix elements
        expect(matrix4.elements[0]).toBeCloseTo(1, 10); // m11
        expect(matrix4.elements[5]).toBeCloseTo(1, 10); // m22
        expect(matrix4.elements[10]).toBeCloseTo(1, 10); // m33
        expect(matrix4.elements[15]).toBeCloseTo(1, 10); // m44

        // Check translation values (Three.js stores translation in elements 12, 13, 14)
        expect(matrix4.elements[12]).toBeCloseTo(5, 10);
        expect(matrix4.elements[13]).toBeCloseTo(6, 10);
        expect(matrix4.elements[14]).toBeCloseTo(7, 10);

        expect(result.data.executionTime).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('Transformation Matrices', () => {
    it('should create translation matrix correctly', async () => {
      logger.debug('Testing translation matrix creation');

      const result = await api.createTranslationMatrix(1, 2, 3);

      expect(result.success).toBe(true);
      if (result.success) {
        const matrix = result.data.result;
        const expected = [
          [1, 0, 0, 1],
          [0, 1, 0, 2],
          [0, 0, 1, 3],
          [0, 0, 0, 1],
        ];
        expect(matrix.to2DArray()).toEqual(expected);
        expect(result.data.executionTime).toBeGreaterThanOrEqual(0);
      }
    });

    it('should create scale matrix correctly', async () => {
      logger.debug('Testing scale matrix creation');

      const result = await api.createScaleMatrix(2, 3, 4);

      expect(result.success).toBe(true);
      if (result.success) {
        const matrix = result.data.result;
        const expected = [
          [2, 0, 0, 0],
          [0, 3, 0, 0],
          [0, 0, 4, 0],
          [0, 0, 0, 1],
        ];
        expect(matrix.to2DArray()).toEqual(expected);
        expect(result.data.executionTime).toBeGreaterThanOrEqual(0);
      }
    });

    it('should create rotation matrix X correctly', async () => {
      logger.debug('Testing rotation matrix X creation');

      const result = await api.createRotationMatrixX(Math.PI / 2);

      expect(result.success).toBe(true);
      if (result.success) {
        const matrix = result.data.result;
        
        // Check key elements (90 degree rotation around X)
        expect(matrix.get(0, 0)).toBeCloseTo(1, 10);
        expect(matrix.get(1, 1)).toBeCloseTo(0, 10);
        expect(matrix.get(1, 2)).toBeCloseTo(-1, 10);
        expect(matrix.get(2, 1)).toBeCloseTo(1, 10);
        expect(matrix.get(2, 2)).toBeCloseTo(0, 10);
        
        expect(result.data.executionTime).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('Matrix Properties', () => {
    it('should calculate determinant for 2x2 matrix', async () => {
      logger.debug('Testing determinant calculation');

      const matrix = new Matrix([
        [1, 2],
        [3, 4],
      ]);

      const result = await api.determinant(matrix);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.result).toBeCloseTo(-2, 10);
        expect(result.data.executionTime).toBeGreaterThanOrEqual(0);
      }
    });

    it('should calculate trace correctly', async () => {
      logger.debug('Testing trace calculation');

      const matrix = new Matrix([
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9],
      ]);

      const result = await api.trace(matrix);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.result).toBe(15); // 1 + 5 + 9
        expect(result.data.executionTime).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('Performance Metrics', () => {
    it('should return basic performance metrics', () => {
      logger.debug('Testing performance metrics');

      const metrics = api.getPerformanceMetrics();

      expect(metrics).toEqual({
        operationCount: 0,
        totalExecutionTime: 0,
        averageExecutionTime: 0,
        cacheHitRate: 0,
        memoryUsage: 0,
      });
    });
  });
});
