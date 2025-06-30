/**
 * Matrix Validation Service Tests
 *
 * Comprehensive tests for matrix validation service with numerical analysis,
 * stability assessment, and remediation strategies following TDD methodology.
 */

import { Matrix } from 'ml-matrix';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MATRIX_CONFIG } from '../config/matrix-config';
import { matrixFactory } from '../utils/matrix-adapters';
import { MatrixCacheService } from './matrix-cache.service';
import {
  type MatrixValidationDependencies,
  MatrixValidationService,
} from './matrix-validation.service';

describe('MatrixValidationService', () => {
  let service: MatrixValidationService;
  let mockCache: MatrixCacheService;
  let mockTelemetry: any;
  let dependencies: MatrixValidationDependencies;

  beforeEach(() => {
    console.log('[INIT][MatrixValidationServiceTest] Setting up test environment');

    // Create real cache service for testing
    mockCache = new MatrixCacheService();

    // Create mock telemetry service
    mockTelemetry = {
      trackOperation: vi.fn(),
    };

    // Setup dependencies
    dependencies = {
      cache: mockCache,
      config: MATRIX_CONFIG,
      telemetry: mockTelemetry,
    };

    // Create service with dependencies
    service = new MatrixValidationService(dependencies);
  });

  afterEach(() => {
    console.log('[END][MatrixValidationServiceTest] Cleaning up test environment');
    service.resetPerformanceMetrics();
  });

  describe('Dependency Injection', () => {
    it('should validate required dependencies on construction', () => {
      console.log('[DEBUG][MatrixValidationServiceTest] Testing dependency validation');

      expect(() => {
        new MatrixValidationService({
          cache: null as any,
          config: MATRIX_CONFIG,
        });
      }).toThrow('MatrixCacheService dependency is required');

      expect(() => {
        new MatrixValidationService({
          cache: mockCache,
          config: null as any,
        });
      }).toThrow('Matrix configuration dependency is required');
    });

    it('should work without optional telemetry dependency', () => {
      console.log('[DEBUG][MatrixValidationServiceTest] Testing optional telemetry dependency');

      const serviceWithoutTelemetry = new MatrixValidationService({
        cache: mockCache,
        config: MATRIX_CONFIG,
      });

      expect(serviceWithoutTelemetry).toBeDefined();
      expect(serviceWithoutTelemetry.getPerformanceMetrics()).toBeDefined();
    });
  });

  describe('Basic Matrix Validation', () => {
    it('should validate well-conditioned identity matrix', async () => {
      console.log('[DEBUG][MatrixValidationServiceTest] Testing identity matrix validation');

      const matrix = matrixFactory.identity(3);

      const result = await service.validateMatrix(matrix, {
        computeEigenvalues: true,
        computeSVD: true,
        enableDetailedAnalysis: true,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const validation = result.data.result;
        expect(validation.isValid).toBe(true);
        expect(validation.numericalStability).toBe('excellent');
        expect(validation.conditionNumber).toBeCloseTo(1, 5);
        expect(validation.isOrthogonal).toBe(true);
        expect(validation.isSymmetric).toBe(true);
        expect(validation.isPositiveDefinite).toBe(true);
        expect(validation.determinant).toBeCloseTo(1, 10);
        expect(validation.rank).toBe(3);
      }
    });

    it('should detect invalid matrix dimensions', async () => {
      console.log('[DEBUG][MatrixValidationServiceTest] Testing invalid matrix dimensions');

      const matrix = new Matrix(0, 0); // Invalid dimensions

      const result = await service.validateMatrix(matrix);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Invalid matrix dimensions');
      }
    });

    it('should detect NaN and infinite values', async () => {
      console.log('[DEBUG][MatrixValidationServiceTest] Testing NaN/infinite value detection');

      const matrix = matrixFactory.identity(3);
      matrix.set(0, 0, NaN);
      matrix.set(1, 1, Infinity);

      const result = await service.validateMatrix(matrix);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Invalid matrix value');
      }
    });
  });

  describe('Numerical Stability Assessment', () => {
    it('should assess excellent stability for well-conditioned matrices', async () => {
      console.log('[DEBUG][MatrixValidationServiceTest] Testing excellent stability assessment');

      const matrix = matrixFactory.diagonal([1, 2, 3]); // Well-conditioned

      const result = await service.validateMatrix(matrix);

      expect(result.success).toBe(true);
      if (result.success) {
        const validation = result.data.result;
        expect(validation.numericalStability).toBe('excellent');
        expect(validation.conditionNumber).toBeLessThan(1000);
      }
    });

    it('should assess poor stability for ill-conditioned matrices', async () => {
      console.log('[DEBUG][MatrixValidationServiceTest] Testing poor stability assessment');

      // Create an ill-conditioned matrix
      const matrix = new Matrix([
        [1, 1, 1],
        [1, 1.0001, 1],
        [1, 1, 1.0001],
      ]);

      const result = await service.validateMatrix(matrix);

      expect(result.success).toBe(true);
      if (result.success) {
        const validation = result.data.result;
        expect(['poor', 'unstable']).toContain(validation.numericalStability);
        expect(validation.conditionNumber).toBeGreaterThan(1000);
      }
    });

    it('should detect singular matrices', async () => {
      console.log('[DEBUG][MatrixValidationServiceTest] Testing singular matrix detection');

      // Create a singular matrix (rank deficient)
      const matrix = new Matrix([
        [1, 2, 3],
        [2, 4, 6], // This row is 2x the first row
        [3, 6, 9], // This row is 3x the first row
      ]);

      const result = await service.validateMatrix(matrix);

      expect(result.success).toBe(true);
      if (result.success) {
        const validation = result.data.result;
        expect(validation.numericalStability).toBe('unstable');
        expect(validation.rank).toBeLessThan(3);
        expect(Math.abs(validation.determinant || 0)).toBeLessThan(1e-10);
        expect(validation.warnings.some((w) => w.includes('singular'))).toBe(true);
      }
    });
  });

  describe('Matrix Property Analysis', () => {
    it('should correctly identify symmetric matrices', async () => {
      console.log('[DEBUG][MatrixValidationServiceTest] Testing symmetric matrix identification');

      const matrix = new Matrix([
        [1, 2, 3],
        [2, 4, 5],
        [3, 5, 6],
      ]);

      const result = await service.validateMatrix(matrix);

      expect(result.success).toBe(true);
      if (result.success) {
        const validation = result.data.result;
        expect(validation.isSymmetric).toBe(true);
      }
    });

    it('should correctly identify orthogonal matrices', async () => {
      console.log('[DEBUG][MatrixValidationServiceTest] Testing orthogonal matrix identification');

      // Create a rotation matrix (orthogonal)
      const angle = Math.PI / 4;
      const matrix = new Matrix([
        [Math.cos(angle), -Math.sin(angle)],
        [Math.sin(angle), Math.cos(angle)],
      ]);

      const result = await service.validateMatrix(matrix);

      expect(result.success).toBe(true);
      if (result.success) {
        const validation = result.data.result;
        expect(validation.isOrthogonal).toBe(true);
      }
    });

    it('should correctly identify positive definite matrices', async () => {
      console.log(
        '[DEBUG][MatrixValidationServiceTest] Testing positive definite matrix identification'
      );

      // Create a positive definite matrix
      const matrix = new Matrix([
        [2, 1],
        [1, 2],
      ]);

      const result = await service.validateMatrix(matrix);

      expect(result.success).toBe(true);
      if (result.success) {
        const validation = result.data.result;
        expect(validation.isPositiveDefinite).toBe(true);
        expect(validation.isSymmetric).toBe(true);
      }
    });
  });

  describe('Eigenvalue and SVD Analysis', () => {
    it('should compute eigenvalues when requested', async () => {
      console.log('[DEBUG][MatrixValidationServiceTest] Testing eigenvalue computation');

      const matrix = matrixFactory.diagonal([1, 2, 3]);

      const result = await service.validateMatrix(matrix, {
        computeEigenvalues: true,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const validation = result.data.result;
        expect(validation.eigenvalues).toBeDefined();
        expect(validation.eigenvalues).toHaveLength(3);
        // For diagonal matrix, eigenvalues should be the diagonal elements
        expect(validation.eigenvalues?.sort()).toEqual([1, 2, 3]);
      }
    });

    it('should compute singular values when requested', async () => {
      console.log('[DEBUG][MatrixValidationServiceTest] Testing SVD computation');

      const matrix = matrixFactory.diagonal([3, 2, 1]);

      const result = await service.validateMatrix(matrix, {
        computeSVD: true,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const validation = result.data.result;
        expect(validation.singularValues).toBeDefined();
        expect(validation.singularValues).toHaveLength(3);
        // Singular values should be in descending order
        const sortedSV = validation.singularValues?.slice().sort((a, b) => b - a);
        expect(sortedSV).toEqual([3, 2, 1]);
      }
    });
  });

  describe('Remediation Strategies', () => {
    it('should suggest SVD for unstable matrices', async () => {
      console.log('[DEBUG][MatrixValidationServiceTest] Testing SVD remediation suggestion');

      // Create a very ill-conditioned matrix
      const matrix = new Matrix([
        [1, 1],
        [1, 1.000000001], // Nearly singular
      ]);

      const result = await service.validateMatrix(matrix);

      expect(result.success).toBe(true);
      if (result.success) {
        const validation = result.data.result;
        expect(
          validation.remediationStrategies.some((s) => s.includes('SVD-based pseudo-inverse'))
        ).toBe(true);
      }
    });

    it('should suggest regularization for singular matrices', async () => {
      console.log('[DEBUG][MatrixValidationServiceTest] Testing regularization suggestion');

      const matrix = new Matrix([
        [1, 2],
        [2, 4], // Singular matrix
      ]);

      const result = await service.validateMatrix(matrix);

      expect(result.success).toBe(true);
      if (result.success) {
        const validation = result.data.result;
        expect(validation.remediationStrategies.some((s) => s.includes('regularization'))).toBe(
          true
        );
      }
    });

    it('should suggest block processing for large matrices', async () => {
      console.log(
        '[DEBUG][MatrixValidationServiceTest] Testing large matrix processing suggestion'
      );

      // Create a large matrix (exceeding threshold)
      const size = Math.ceil(Math.sqrt(MATRIX_CONFIG.performance.largeMatrixThreshold)) + 1;
      const matrix = matrixFactory.identity(size);

      const result = await service.validateMatrix(matrix);

      expect(result.success).toBe(true);
      if (result.success) {
        const validation = result.data.result;
        expect(
          validation.remediationStrategies.some((s) => s.includes('block-wise processing'))
        ).toBe(true);
      }
    });
  });

  describe('Caching and Performance', () => {
    it('should use cache for repeated validations', async () => {
      console.log('[DEBUG][MatrixValidationServiceTest] Testing cache usage');

      const matrix = matrixFactory.identity(3);

      // First validation
      const result1 = await service.validateMatrix(matrix, { useCache: true });
      expect(result1.success).toBe(true);
      if (result1.success) {
        expect(result1.data.performance.cacheHit).toBe(false);
      }

      // Second validation should hit cache
      const result2 = await service.validateMatrix(matrix, { useCache: true });
      expect(result2.success).toBe(true);
      if (result2.success) {
        expect(result2.data.performance.cacheHit).toBe(true);
      }
    });

    it('should track performance metrics', async () => {
      console.log('[DEBUG][MatrixValidationServiceTest] Testing performance metrics');

      const matrix = matrixFactory.identity(3);

      await service.validateMatrix(matrix);

      const metrics = service.getPerformanceMetrics();
      expect(metrics.operationCount).toBeGreaterThan(0);
      expect(metrics.totalExecutionTime).toBeGreaterThan(0);
      expect(metrics.averageExecutionTime).toBeGreaterThan(0);
    });

    it('should track telemetry when available', async () => {
      console.log('[DEBUG][MatrixValidationServiceTest] Testing telemetry tracking');

      const matrix = matrixFactory.identity(3);

      await service.validateMatrix(matrix);

      expect(mockTelemetry.trackOperation).toHaveBeenCalledWith(
        'validation',
        expect.any(Number),
        true
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle validation errors gracefully', async () => {
      console.log('[DEBUG][MatrixValidationServiceTest] Testing error handling');

      const matrix = new Matrix(0, 0); // Invalid matrix

      const result = await service.validateMatrix(matrix);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
      }
    });

    it('should record failed operations in metrics', async () => {
      console.log('[DEBUG][MatrixValidationServiceTest] Testing failure recording');

      const initialMetrics = service.getPerformanceMetrics();
      const initialFailures = initialMetrics.failedOperations;

      // Attempt validation that will fail
      const invalidMatrix = new Matrix(0, 0);
      await service.validateMatrix(invalidMatrix);

      const updatedMetrics = service.getPerformanceMetrics();
      expect(updatedMetrics.failedOperations).toBe(initialFailures + 1);
    });
  });
});
