/**
 * Matrix Adapters Tests
 *
 * Comprehensive tests for matrix adapter utilities and Three.js integration
 * following TDD methodology and bulletproof-react testing patterns.
 */

import { Euler, Matrix3, Matrix4, Quaternion, Vector3 } from 'three';
import { describe, expect, it } from 'vitest';
import { createLogger } from '../../../shared/services/logger.service.js';
import {
  fromEuler,
  fromQuaternion,
  fromThreeMatrix3,
  fromThreeMatrix4,
  fromVector3,
  matrixAdapter,
  matrixFactory,
  matrixUtils,
  toThreeMatrix3,
  toThreeMatrix4,
} from './matrix-adapters.js';

const logger = createLogger('MatrixAdaptersTest');

describe('Matrix Adapters', () => {
  describe('Three.js Matrix Conversions', () => {
    it('should convert Three.js Matrix3 to ml-matrix correctly', () => {
      logger.debug('[DEBUG][MatrixAdaptersTest] Testing Matrix3 to ml-matrix conversion');

      const threeMatrix = new Matrix3().set(1, 2, 3, 4, 5, 6, 7, 8, 9);

      const result = fromThreeMatrix3(threeMatrix);

      expect(result.success).toBe(true);
      if (result.success) {
        const matrix = result.data;
        expect(matrix.rows).toBe(3);
        expect(matrix.columns).toBe(3);
        expect(matrix.get(0, 0)).toBe(1);
        expect(matrix.get(0, 1)).toBe(2);
        expect(matrix.get(0, 2)).toBe(3);
        expect(matrix.get(1, 0)).toBe(4);
        expect(matrix.get(2, 2)).toBe(9);
      }
    });

    it('should convert Three.js Matrix4 to ml-matrix correctly', () => {
      logger.debug('[DEBUG][MatrixAdaptersTest] Testing Matrix4 to ml-matrix conversion');

      const threeMatrix = new Matrix4().makeTranslation(1, 2, 3);

      const result = fromThreeMatrix4(threeMatrix);

      expect(result.success).toBe(true);
      if (result.success) {
        const matrix = result.data;
        expect(matrix.rows).toBe(4);
        expect(matrix.columns).toBe(4);
        expect(matrix.get(0, 3)).toBeCloseTo(1, 10);
        expect(matrix.get(1, 3)).toBeCloseTo(2, 10);
        expect(matrix.get(2, 3)).toBeCloseTo(3, 10);
        expect(matrix.get(3, 3)).toBeCloseTo(1, 10);
      }
    });

    it('should convert ml-matrix to Three.js Matrix3 correctly', () => {
      logger.debug('[DEBUG][MatrixAdaptersTest] Testing ml-matrix to Matrix3 conversion');

      const matrix = matrixFactory.fromArray([
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9],
      ]);

      const result = toThreeMatrix3(matrix);

      expect(result.success).toBe(true);
      if (result.success) {
        const threeMatrix = result.data;
        expect(threeMatrix.elements[0]).toBe(1);
        expect(threeMatrix.elements[1]).toBe(4);
        expect(threeMatrix.elements[2]).toBe(7);
        expect(threeMatrix.elements[3]).toBe(2);
        expect(threeMatrix.elements[8]).toBe(9);
      }
    });

    it('should convert ml-matrix to Three.js Matrix4 correctly', () => {
      logger.debug('[DEBUG][MatrixAdaptersTest] Testing ml-matrix to Matrix4 conversion');

      const matrix = matrixFactory.identity(4);
      matrix.set(0, 3, 5);
      matrix.set(1, 3, 6);
      matrix.set(2, 3, 7);

      const result = toThreeMatrix4(matrix);

      expect(result.success).toBe(true);
      if (result.success) {
        const threeMatrix = result.data;
        expect(threeMatrix.elements[12]).toBeCloseTo(5, 10);
        expect(threeMatrix.elements[13]).toBeCloseTo(6, 10);
        expect(threeMatrix.elements[14]).toBeCloseTo(7, 10);
        expect(threeMatrix.elements[15]).toBeCloseTo(1, 10);
      }
    });

    it('should handle invalid matrix dimensions', () => {
      logger.debug('[DEBUG][MatrixAdaptersTest] Testing invalid matrix dimensions');

      const invalidMatrix = matrixFactory.fromArray([
        [1, 2],
        [3, 4],
      ]); // 2x2 matrix

      const result = toThreeMatrix4(invalidMatrix);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Matrix must be 4x4');
      }
    });
  });

  describe('Vector and Rotation Conversions', () => {
    it('should convert Vector3 to matrix correctly', () => {
      logger.debug('[DEBUG][MatrixAdaptersTest] Testing Vector3 to matrix conversion');

      const vector = new Vector3(1, 2, 3);

      const result = fromVector3(vector);

      expect(result.success).toBe(true);
      if (result.success) {
        const matrix = result.data;
        expect(matrix.rows).toBe(3);
        expect(matrix.columns).toBe(1);
        expect(matrix.get(0, 0)).toBe(1);
        expect(matrix.get(1, 0)).toBe(2);
        expect(matrix.get(2, 0)).toBe(3);
      }
    });

    it('should convert Quaternion to rotation matrix correctly', () => {
      logger.debug('[DEBUG][MatrixAdaptersTest] Testing Quaternion to rotation matrix conversion');

      const quaternion = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), Math.PI / 2);

      const result = fromQuaternion(quaternion);

      expect(result.success).toBe(true);
      if (result.success) {
        const matrix = result.data;
        expect(matrix.rows).toBe(3);
        expect(matrix.columns).toBe(3);
        // Check if it's approximately a 90-degree Y rotation
        expect(matrix.get(0, 0)).toBeCloseTo(0, 5);
        expect(matrix.get(0, 2)).toBeCloseTo(1, 5);
        expect(matrix.get(2, 0)).toBeCloseTo(-1, 5);
        expect(matrix.get(2, 2)).toBeCloseTo(0, 5);
      }
    });

    it('should convert Euler angles to rotation matrix correctly', () => {
      logger.debug('[DEBUG][MatrixAdaptersTest] Testing Euler to rotation matrix conversion');

      const euler = new Euler(0, Math.PI / 2, 0, 'XYZ');

      const result = fromEuler(euler);

      expect(result.success).toBe(true);
      if (result.success) {
        const matrix = result.data;
        expect(matrix.rows).toBe(3);
        expect(matrix.columns).toBe(3);
        // Check if it's approximately a 90-degree Y rotation
        expect(matrix.get(0, 0)).toBeCloseTo(0, 5);
        expect(matrix.get(0, 2)).toBeCloseTo(1, 5);
        expect(matrix.get(2, 0)).toBeCloseTo(-1, 5);
        expect(matrix.get(2, 2)).toBeCloseTo(0, 5);
      }
    });
  });

  describe('Matrix Factory', () => {
    it('should create identity matrix correctly', () => {
      logger.debug('[DEBUG][MatrixAdaptersTest] Testing identity matrix creation');

      const matrix = matrixFactory.identity(3);

      expect(matrix.rows).toBe(3);
      expect(matrix.columns).toBe(3);
      expect(matrix.get(0, 0)).toBe(1);
      expect(matrix.get(1, 1)).toBe(1);
      expect(matrix.get(2, 2)).toBe(1);
      expect(matrix.get(0, 1)).toBe(0);
      expect(matrix.get(1, 0)).toBe(0);
    });

    it('should create zero matrix correctly', () => {
      logger.debug('[DEBUG][MatrixAdaptersTest] Testing zero matrix creation');

      const matrix = matrixFactory.zeros(2, 3);

      expect(matrix.rows).toBe(2);
      expect(matrix.columns).toBe(3);
      for (let i = 0; i < 2; i++) {
        for (let j = 0; j < 3; j++) {
          expect(matrix.get(i, j)).toBe(0);
        }
      }
    });

    it('should create ones matrix correctly', () => {
      logger.debug('[DEBUG][MatrixAdaptersTest] Testing ones matrix creation');

      const matrix = matrixFactory.ones(2, 2);

      expect(matrix.rows).toBe(2);
      expect(matrix.columns).toBe(2);
      for (let i = 0; i < 2; i++) {
        for (let j = 0; j < 2; j++) {
          expect(matrix.get(i, j)).toBe(1);
        }
      }
    });

    it('should create random matrix correctly', () => {
      logger.debug('[DEBUG][MatrixAdaptersTest] Testing random matrix creation');

      const matrix = matrixFactory.random(3, 3);

      expect(matrix.rows).toBe(3);
      expect(matrix.columns).toBe(3);
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          const value = matrix.get(i, j);
          expect(value).toBeGreaterThanOrEqual(0);
          expect(value).toBeLessThanOrEqual(1);
        }
      }
    });

    it('should create diagonal matrix correctly', () => {
      logger.debug('[DEBUG][MatrixAdaptersTest] Testing diagonal matrix creation');

      const values = [1, 2, 3];
      const matrix = matrixFactory.diagonal(values);

      expect(matrix.rows).toBe(3);
      expect(matrix.columns).toBe(3);
      expect(matrix.get(0, 0)).toBe(1);
      expect(matrix.get(1, 1)).toBe(2);
      expect(matrix.get(2, 2)).toBe(3);
      expect(matrix.get(0, 1)).toBe(0);
      expect(matrix.get(1, 0)).toBe(0);
    });

    it('should create matrix from array correctly', () => {
      logger.debug('[DEBUG][MatrixAdaptersTest] Testing matrix from array creation');

      const data = [
        [1, 2, 3],
        [4, 5, 6],
      ];
      const matrix = matrixFactory.fromArray(data);

      expect(matrix.rows).toBe(2);
      expect(matrix.columns).toBe(3);
      expect(matrix.get(0, 0)).toBe(1);
      expect(matrix.get(0, 2)).toBe(3);
      expect(matrix.get(1, 0)).toBe(4);
      expect(matrix.get(1, 2)).toBe(6);
    });

    it('should validate array data when creating matrix', () => {
      logger.debug('[DEBUG][MatrixAdaptersTest] Testing array validation');

      const invalidData = [
        [1, 2],
        [3, 4, 5],
      ]; // Inconsistent row lengths

      expect(() => matrixFactory.fromArray(invalidData)).toThrow();
    });
  });

  describe('Matrix Utils', () => {
    it('should correctly identify square matrices', () => {
      logger.debug('[DEBUG][MatrixAdaptersTest] Testing square matrix identification');

      const square = matrixFactory.fromArray([
        [1, 2],
        [3, 4],
      ]);
      const nonSquare = matrixFactory.fromArray([
        [1, 2, 3],
        [4, 5, 6],
      ]);

      expect(matrixUtils.isSquare(square)).toBe(true);
      expect(matrixUtils.isSquare(nonSquare)).toBe(false);
    });

    it('should correctly identify symmetric matrices', () => {
      logger.debug('[DEBUG][MatrixAdaptersTest] Testing symmetric matrix identification');

      const symmetric = matrixFactory.fromArray([
        [1, 2],
        [2, 3],
      ]);
      const nonSymmetric = matrixFactory.fromArray([
        [1, 2],
        [3, 4],
      ]);

      expect(matrixUtils.isSymmetric(symmetric)).toBe(true);
      expect(matrixUtils.isSymmetric(nonSymmetric)).toBe(false);
    });

    it('should correctly identify orthogonal matrices', () => {
      logger.debug('[DEBUG][MatrixAdaptersTest] Testing orthogonal matrix identification');

      const identity = matrixFactory.identity(2);
      const nonOrthogonal = matrixFactory.fromArray([
        [1, 2],
        [3, 4],
      ]);

      expect(matrixUtils.isOrthogonal(identity)).toBe(true);
      expect(matrixUtils.isOrthogonal(nonOrthogonal)).toBe(false);
    });

    it('should correctly identify singular matrices', () => {
      logger.debug('[DEBUG][MatrixAdaptersTest] Testing singular matrix identification');

      const singular = matrixFactory.fromArray([
        [0, 0],
        [0, 0],
      ]); // Zero matrix, clearly singular
      const nonSingular = matrixFactory.fromArray([
        [1, 0],
        [0, 1],
      ] as const); // Identity matrix manually created

      expect(matrixUtils.isSingular(singular)).toBe(true);
      expect(matrixUtils.isSingular(nonSingular)).toBe(false);
    });

    it('should compare matrices for equality correctly', () => {
      logger.debug('[DEBUG][MatrixAdaptersTest] Testing matrix equality');

      const a = matrixFactory.fromArray([
        [1, 2],
        [3, 4],
      ]);
      const b = matrixFactory.fromArray([
        [1, 2],
        [3, 4],
      ]);
      const c = matrixFactory.fromArray([
        [1, 2],
        [3, 5],
      ]);

      expect(matrixUtils.equals(a, b)).toBe(true);
      expect(matrixUtils.equals(a, c)).toBe(false);
    });

    it('should calculate matrix hash correctly', () => {
      logger.debug('[DEBUG][MatrixAdaptersTest] Testing matrix hash calculation');

      const matrix = matrixFactory.fromArray([
        [1, 2],
        [3, 4],
      ]);
      const hash = matrixUtils.hash(matrix);

      expect(typeof hash).toBe('string');
      expect(hash.length).toBeGreaterThan(0);
      expect(hash).toContain('2x2');
    });

    it('should calculate matrix size correctly', () => {
      logger.debug('[DEBUG][MatrixAdaptersTest] Testing matrix size calculation');

      const matrix = matrixFactory.fromArray([
        [1, 2, 3],
        [4, 5, 6],
      ]);
      const size = matrixUtils.size(matrix);

      expect(size).toEqual([2, 3]);
    });

    it('should estimate memory usage correctly', () => {
      logger.debug('[DEBUG][MatrixAdaptersTest] Testing memory usage estimation');

      const matrix = matrixFactory.fromArray([
        [1, 2],
        [3, 4],
      ]);
      const memoryUsage = matrixUtils.memoryUsage(matrix);

      expect(typeof memoryUsage).toBe('number');
      expect(memoryUsage).toBeGreaterThan(0);
    });
  });

  describe('Matrix Adapter Interface', () => {
    it('should provide consistent adapter interface', () => {
      logger.debug('[DEBUG][MatrixAdaptersTest] Testing adapter interface consistency');

      const threeMatrix4 = new Matrix4().makeTranslation(1, 2, 3);
      const mlMatrix = matrixAdapter.fromThreeMatrix4(threeMatrix4);
      const backToThree = matrixAdapter.toThreeMatrix4(mlMatrix);

      expect(mlMatrix.rows).toBe(4);
      expect(mlMatrix.columns).toBe(4);
      expect(backToThree.elements[12]).toBeCloseTo(1, 10);
      expect(backToThree.elements[13]).toBeCloseTo(2, 10);
      expect(backToThree.elements[14]).toBeCloseTo(3, 10);
    });

    it('should handle round-trip conversions correctly', () => {
      logger.debug('[DEBUG][MatrixAdaptersTest] Testing round-trip conversions');

      const originalMatrix3 = new Matrix3().set(1, 2, 3, 4, 5, 6, 7, 8, 9);

      const mlMatrix = matrixAdapter.fromThreeMatrix3(originalMatrix3);
      const backToThree = matrixAdapter.toThreeMatrix3(mlMatrix);

      for (let i = 0; i < 9; i++) {
        const originalElement = originalMatrix3.elements[i];
        if (originalElement !== undefined) {
          expect(backToThree.elements[i]).toBeCloseTo(originalElement, 10);
        }
      }
    });
  });
});
