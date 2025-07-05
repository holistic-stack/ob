/**
 * Simplified Matrix Operations API Tests
 *
 * Tests for simplified matrix operations API without complex infrastructure.
 * Following TDD methodology and bulletproof-react testing patterns.
 */

import { mat4 } from 'gl-matrix';
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

      const a = mat4.fromValues(1, 0, 0, 0, 0, 2, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
      const b = mat4.fromValues(5, 0, 0, 0, 0, 6, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);

      const result = await api.add(a, b);

      expect(result.success).toBe(true);
      if (result.success) {
        const resultMatrix = result.data.result;
        expect(resultMatrix[0]).toBe(6); // m00: 1 + 5
        expect(resultMatrix[5]).toBe(8); // m11: 2 + 6
        expect(resultMatrix[10]).toBe(2); // m22: 1 + 1
        expect(resultMatrix[15]).toBe(2); // m33: 1 + 1
        expect(result.data.executionTime).toBeGreaterThanOrEqual(0);
      }
    });

    it('should perform matrix multiplication correctly', async () => {
      logger.debug('Testing matrix multiplication');

      const a = mat4.fromValues(1, 0, 0, 0, 0, 2, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
      const b = mat4.fromValues(2, 0, 0, 0, 0, 3, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);

      const result = await api.multiply(a, b);

      expect(result.success).toBe(true);
      if (result.success) {
        const resultMatrix = result.data.result;
        expect(resultMatrix[0]).toBe(2); // m00: 1 * 2
        expect(resultMatrix[5]).toBe(6); // m11: 2 * 3
        expect(resultMatrix[10]).toBe(1); // m22: 1 * 1
        expect(resultMatrix[15]).toBe(1); // m33: 1 * 1
        expect(result.data.executionTime).toBeGreaterThanOrEqual(0);
      }
    });

    it('should handle matrix transpose correctly', async () => {
      logger.debug('Testing matrix transpose');

      const matrix = mat4.fromValues(1, 4, 0, 0, 2, 5, 0, 0, 3, 6, 0, 0, 0, 0, 0, 1);

      const result = await api.transpose(matrix);

      expect(result.success).toBe(true);
      if (result.success) {
        const resultMatrix = result.data.result;
        // Check transposed values
        expect(resultMatrix[0]).toBe(1); // m00
        expect(resultMatrix[1]).toBe(2); // m01 (was m10)
        expect(resultMatrix[2]).toBe(3); // m02 (was m20)
        expect(resultMatrix[4]).toBe(4); // m10 (was m01)
        expect(resultMatrix[5]).toBe(5); // m11
        expect(resultMatrix[6]).toBe(6); // m12 (was m21)
        expect(result.data.executionTime).toBeGreaterThanOrEqual(0);
      }
    });

    it('should handle matrix subtraction correctly', async () => {
      logger.debug('Testing matrix subtraction');

      const a = mat4.fromValues(5, 0, 0, 0, 0, 6, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
      const b = mat4.fromValues(1, 0, 0, 0, 0, 2, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);

      const result = await api.subtract(a, b);

      expect(result.success).toBe(true);
      if (result.success) {
        const resultMatrix = result.data.result;
        expect(resultMatrix[0]).toBe(4); // m00: 5 - 1
        expect(resultMatrix[5]).toBe(4); // m11: 6 - 2
        expect(resultMatrix[10]).toBe(0); // m22: 1 - 1
        expect(resultMatrix[15]).toBe(0); // m33: 1 - 1
        expect(result.data.executionTime).toBeGreaterThanOrEqual(0);
      }
    });

    it('should handle matrix inverse correctly', async () => {
      logger.debug('Testing matrix inverse');

      const matrix = mat4.fromValues(2, 0, 0, 0, 0, 3, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);

      const result = await api.inverse(matrix);

      expect(result.success).toBe(true);
      if (result.success) {
        const inverseMatrix = result.data.result;

        // Check that the inverse has expected values for a diagonal matrix
        expect(inverseMatrix[0]).toBeCloseTo(0.5, 10); // 1/2
        expect(inverseMatrix[5]).toBeCloseTo(0.333, 2); // 1/3 (approximately)
        expect(inverseMatrix[10]).toBeCloseTo(1, 10); // 1/1
        expect(inverseMatrix[15]).toBeCloseTo(1, 10); // 1/1

        expect(result.data.executionTime).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('Three.js Integration', () => {
    it('should convert Matrix4 to gl-matrix correctly', async () => {
      logger.debug('Testing Matrix4 to gl-matrix conversion');

      const matrix4 = new Matrix4().makeTranslation(1, 2, 3);
      const result = await api.convertMatrix4ToGLMatrix(matrix4);

      expect(result.success).toBe(true);
      if (result.success) {
        const glMatrix = result.data.result;
        expect(glMatrix.length).toBe(16); // 4x4 matrix

        // Check translation values (Three.js uses column-major order)
        expect(glMatrix[12]).toBeCloseTo(1, 10); // Translation X
        expect(glMatrix[13]).toBeCloseTo(2, 10); // Translation Y
        expect(glMatrix[14]).toBeCloseTo(3, 10); // Translation Z

        expect(result.data.executionTime).toBeGreaterThanOrEqual(0);
      }
    });

    it('should convert gl-matrix to Matrix4 correctly', async () => {
      logger.debug('Testing gl-matrix to Matrix4 conversion');

      const glMatrix = mat4.fromValues(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 5, 6, 7, 1);

      const result = await api.convertGLMatrixToMatrix4(glMatrix);

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

        // Check translation values in gl-matrix format (column-major)
        expect(matrix[12]).toBeCloseTo(1, 10); // Translation X
        expect(matrix[13]).toBeCloseTo(2, 10); // Translation Y
        expect(matrix[14]).toBeCloseTo(3, 10); // Translation Z

        // Check identity elements
        expect(matrix[0]).toBeCloseTo(1, 10); // m00
        expect(matrix[5]).toBeCloseTo(1, 10); // m11
        expect(matrix[10]).toBeCloseTo(1, 10); // m22
        expect(matrix[15]).toBeCloseTo(1, 10); // m33

        expect(result.data.executionTime).toBeGreaterThanOrEqual(0);
      }
    });

    it('should create scale matrix correctly', async () => {
      logger.debug('Testing scale matrix creation');

      const result = await api.createScaleMatrix(2, 3, 4);

      expect(result.success).toBe(true);
      if (result.success) {
        const matrix = result.data.result;

        // Check scale values in gl-matrix format (column-major)
        expect(matrix[0]).toBeCloseTo(2, 10); // Scale X
        expect(matrix[5]).toBeCloseTo(3, 10); // Scale Y
        expect(matrix[10]).toBeCloseTo(4, 10); // Scale Z
        expect(matrix[15]).toBeCloseTo(1, 10); // m33

        // Check that other elements are zero
        expect(matrix[1]).toBeCloseTo(0, 10); // m01
        expect(matrix[4]).toBeCloseTo(0, 10); // m10

        expect(result.data.executionTime).toBeGreaterThanOrEqual(0);
      }
    });

    it('should create rotation matrix X correctly', async () => {
      logger.debug('Testing rotation matrix X creation');

      const result = await api.createRotationMatrixX(Math.PI / 2);

      expect(result.success).toBe(true);
      if (result.success) {
        const matrix = result.data.result;

        // Check key elements (90 degree rotation around X) in gl-matrix format
        expect(matrix[0]).toBeCloseTo(1, 10); // m00 - X axis unchanged
        expect(matrix[5]).toBeCloseTo(0, 10); // m11 - cos(90°) = 0
        expect(matrix[6]).toBeCloseTo(-1, 10); // m12 - -sin(90°) = -1
        expect(matrix[9]).toBeCloseTo(1, 10); // m21 - sin(90°) = 1
        expect(matrix[10]).toBeCloseTo(0, 10); // m22 - cos(90°) = 0

        expect(result.data.executionTime).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('Matrix Properties', () => {
    it('should calculate determinant for 4x4 matrix', async () => {
      logger.debug('Testing determinant calculation');

      const matrix = mat4.fromValues(1, 0, 0, 0, 0, 2, 0, 0, 0, 0, 3, 0, 0, 0, 0, 4);

      const result = await api.determinant(matrix);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.result).toBeCloseTo(24, 10); // 1*2*3*4 = 24
        expect(result.data.executionTime).toBeGreaterThanOrEqual(0);
      }
    });

    it('should calculate trace correctly', async () => {
      logger.debug('Testing trace calculation');

      const matrix = mat4.fromValues(1, 0, 0, 0, 0, 5, 0, 0, 0, 0, 9, 0, 0, 0, 0, 4);

      const result = await api.trace(matrix);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.result).toBe(19); // 1 + 5 + 9 + 4
        expect(result.data.executionTime).toBeGreaterThanOrEqual(0);
      }
    });
  });
});
