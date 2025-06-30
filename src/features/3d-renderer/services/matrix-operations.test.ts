/**
 * Matrix Operations API Tests
 *
 * Comprehensive tests for matrix operations API validation and integration testing
 * following TDD methodology and bulletproof-react testing patterns.
 */

import { Matrix4, Quaternion, Vector3 } from 'three';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { matrixFactory, matrixUtils } from '../utils/matrix-adapters';
import { MatrixOperationsAPI } from './matrix-operations.api';

describe('MatrixOperationsAPI', () => {
  let api: MatrixOperationsAPI;

  beforeEach(() => {
    console.log('[INIT][MatrixOperationsTest] Setting up test environment');
    api = new MatrixOperationsAPI();
  });

  afterEach(() => {
    console.log('[END][MatrixOperationsTest] Cleaning up test environment');
    api.clearCache();
  });

  describe('Basic Matrix Operations', () => {
    it('should perform matrix addition correctly', async () => {
      console.log('[DEBUG][MatrixOperationsTest] Testing matrix addition');

      const a = matrixFactory.fromArray([
        [1, 2],
        [3, 4],
      ]);
      const b = matrixFactory.fromArray([
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
        expect(result.data.performance.operationType).toBe('add');
        expect(result.data.performance.executionTime).toBeGreaterThan(0);
      }
    });

    it('should perform matrix multiplication correctly', async () => {
      console.log('[DEBUG][MatrixOperationsTest] Testing matrix multiplication');

      const a = matrixFactory.fromArray([
        [1, 2],
        [3, 4],
      ]);
      const b = matrixFactory.fromArray([
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
        expect(result.data.performance.operationType).toBe('multiply');
      }
    });

    it('should handle matrix transpose correctly', async () => {
      console.log('[DEBUG][MatrixOperationsTest] Testing matrix transpose');

      const matrix = matrixFactory.fromArray([
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
      }
    });

    it('should calculate matrix inverse correctly', async () => {
      console.log('[DEBUG][MatrixOperationsTest] Testing matrix inverse');

      const matrix = matrixFactory.fromArray([
        [2, 1],
        [1, 1],
      ]);

      const result = await api.inverse(matrix);

      expect(result.success).toBe(true);
      if (result.success) {
        const inverse = result.data.result;
        const product = matrix.mmul(inverse);
        const identity = matrixFactory.identity(2);

        // Check if product is approximately identity matrix
        expect(matrixUtils.equals(product, identity, 1e-10)).toBe(true);
      }
    });
  });

  describe('Matrix Properties', () => {
    it('should calculate determinant correctly', async () => {
      console.log('[DEBUG][MatrixOperationsTest] Testing determinant calculation');

      const matrix = matrixFactory.fromArray([
        [2, 1],
        [1, 1],
      ]);

      const result = await api.determinant(matrix);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.result).toBeCloseTo(1, 10);
      }
    });

    it('should calculate trace correctly', async () => {
      console.log('[DEBUG][MatrixOperationsTest] Testing trace calculation');

      const matrix = matrixFactory.fromArray([
        [1, 2],
        [3, 4],
      ]);

      const result = await api.trace(matrix);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.result).toBe(5); // 1 + 4
      }
    });

    it('should calculate rank correctly', async () => {
      console.log('[DEBUG][MatrixOperationsTest] Testing rank calculation');

      const matrix = matrixFactory.fromArray([
        [1, 2],
        [2, 4],
      ]); // Rank 1 matrix

      const result = await api.rank(matrix);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.result).toBe(1);
      }
    });
  });

  describe('Three.js Integration', () => {
    it('should convert Three.js Matrix4 to ml-matrix correctly', async () => {
      console.log('[DEBUG][MatrixOperationsTest] Testing Three.js Matrix4 conversion');

      const threeMatrix = new Matrix4().makeTranslation(1, 2, 3);

      const result = await api.fromThreeMatrix4(threeMatrix);

      expect(result.success).toBe(true);
      if (result.success) {
        const matrix = result.data.result;
        expect(matrix.rows).toBe(4);
        expect(matrix.columns).toBe(4);
        expect(matrix.get(0, 3)).toBeCloseTo(1, 10);
        expect(matrix.get(1, 3)).toBeCloseTo(2, 10);
        expect(matrix.get(2, 3)).toBeCloseTo(3, 10);
      }
    });

    it('should convert ml-matrix to Three.js Matrix4 correctly', async () => {
      console.log('[DEBUG][MatrixOperationsTest] Testing ml-matrix to Three.js conversion');

      const matrix = matrixFactory.identity(4);
      matrix.set(0, 3, 5); // Set translation x
      matrix.set(1, 3, 6); // Set translation y
      matrix.set(2, 3, 7); // Set translation z

      const result = await api.toThreeMatrix4(matrix);

      expect(result.success).toBe(true);
      if (result.success) {
        const threeMatrix = result.data.result;
        expect(threeMatrix.elements[12]).toBeCloseTo(5, 10);
        expect(threeMatrix.elements[13]).toBeCloseTo(6, 10);
        expect(threeMatrix.elements[14]).toBeCloseTo(7, 10);
      }
    });

    it('should create transformation matrix correctly', async () => {
      console.log('[DEBUG][MatrixOperationsTest] Testing transformation matrix creation');

      const position = new Vector3(1, 2, 3);
      const rotation = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), Math.PI / 4);
      const scale = new Vector3(2, 2, 2);

      const result = await api.createTransformationMatrix(position, rotation, scale);

      expect(result.success).toBe(true);
      if (result.success) {
        const matrix = result.data.result;
        expect(matrix.rows).toBe(4);
        expect(matrix.columns).toBe(4);
        expect(matrix.get(0, 3)).toBeCloseTo(1, 10);
        expect(matrix.get(1, 3)).toBeCloseTo(2, 10);
        expect(matrix.get(2, 3)).toBeCloseTo(3, 10);
      }
    });
  });

  describe('Matrix Decomposition', () => {
    it('should perform matrix decomposition correctly', async () => {
      console.log('[DEBUG][MatrixOperationsTest] Testing matrix decomposition');

      const matrix = matrixFactory.fromArray([
        [4, 2, 1],
        [2, 5, 3],
        [1, 3, 6],
      ]);

      const result = await api.decompose(matrix);

      expect(result.success).toBe(true);
      if (result.success) {
        const decomposition = result.data.result;

        // Check LU decomposition
        expect(decomposition.lu).toBeDefined();
        if (decomposition.lu) {
          expect(decomposition.lu.L).toBeDefined();
          expect(decomposition.lu.U).toBeDefined();
          expect(decomposition.lu.P).toBeDefined();
        }

        // Check QR decomposition
        expect(decomposition.qr).toBeDefined();
        if (decomposition.qr) {
          expect(decomposition.qr.Q).toBeDefined();
          expect(decomposition.qr.R).toBeDefined();
        }

        // Check eigenvalues for symmetric matrix
        expect(decomposition.eigenvalues).toBeDefined();
        if (decomposition.eigenvalues) {
          expect(decomposition.eigenvalues.values).toBeDefined();
          expect(decomposition.eigenvalues.vectors).toBeDefined();
        }
      }
    });
  });

  describe('Batch Operations', () => {
    it('should execute batch operations correctly', async () => {
      console.log('[DEBUG][MatrixOperationsTest] Testing batch operations');

      const a = matrixFactory.fromArray([
        [1, 2],
        [3, 4],
      ]);
      const b = matrixFactory.fromArray([
        [5, 6],
        [7, 8],
      ]);
      const c = matrixFactory.fromArray([
        [2, 0],
        [0, 2],
      ]);

      const operations = [
        {
          operation: 'add' as const,
          inputs: [a, b],
          priority: 'normal' as const,
        },
        {
          operation: 'multiply' as const,
          inputs: [a, c],
          priority: 'high' as const,
        },
        {
          operation: 'transpose' as const,
          inputs: [a],
          priority: 'low' as const,
        },
      ];

      const result = await api.executeBatch(operations);

      expect(result.success).toBe(true);
      if (result.success) {
        const batchResult = result.data;
        expect(batchResult.successCount).toBe(3);
        expect(batchResult.failureCount).toBe(0);
        expect(batchResult.results).toHaveLength(3);
        expect(batchResult.totalTime).toBeGreaterThan(0);
      }
    });
  });

  describe('Caching and Performance', () => {
    it('should cache matrix operations correctly', async () => {
      console.log('[DEBUG][MatrixOperationsTest] Testing matrix operation caching');

      const a = matrixFactory.fromArray([
        [1, 2],
        [3, 4],
      ]);
      const b = matrixFactory.fromArray([
        [5, 6],
        [7, 8],
      ]);

      // First operation - should not be cached
      const result1 = await api.add(a, b);
      expect(result1.success).toBe(true);
      if (result1.success) {
        expect(result1.data.performance.cacheHit).toBe(false);
      }

      // Second operation - should be cached
      const result2 = await api.add(a, b);
      expect(result2.success).toBe(true);
      if (result2.success) {
        expect(result2.data.performance.cacheHit).toBe(true);
      }
    });

    it('should provide performance metrics', () => {
      console.log('[DEBUG][MatrixOperationsTest] Testing performance metrics');

      const metrics = api.getPerformanceMetrics();

      expect(metrics).toBeDefined();
      expect(typeof metrics.operationCount).toBe('number');
      expect(typeof metrics.totalExecutionTime).toBe('number');
      expect(typeof metrics.cacheHitRate).toBe('number');
      expect(typeof metrics.memoryUsage).toBe('number');
    });

    it('should provide cache statistics', () => {
      console.log('[DEBUG][MatrixOperationsTest] Testing cache statistics');

      const stats = api.getCacheStats();

      expect(stats).toBeDefined();
      expect(typeof stats.entryCount).toBe('number');
      expect(typeof stats.memoryUsage).toBe('number');
      expect(typeof stats.memoryLimit).toBe('number');
      expect(typeof stats.utilizationPercent).toBe('number');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid matrix operations gracefully', async () => {
      console.log('[DEBUG][MatrixOperationsTest] Testing error handling');

      const a = matrixFactory.fromArray([[1, 2]]); // 1x2 matrix
      const _b = matrixFactory.fromArray([[3], [4]]); // 2x1 matrix
      const c = matrixFactory.fromArray([[5, 6]]); // 1x2 matrix

      // This should fail due to dimension mismatch
      const result = await api.multiply(a, c);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('dimension mismatch');
      }
    });

    it('should handle singular matrix inverse gracefully', async () => {
      console.log('[DEBUG][MatrixOperationsTest] Testing singular matrix handling');

      const singularMatrix = matrixFactory.fromArray([
        [1, 2],
        [2, 4],
      ]); // Singular matrix

      const result = await api.inverse(singularMatrix);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toMatch(/singular|not invertible|failed/i);
      }
    });
  });
});
