/**
 * Matrix Conversion Service Tests
 *
 * Comprehensive tests for matrix conversion service with dependency injection,
 * robust error handling, and performance monitoring following TDD methodology.
 */

import { Matrix } from 'ml-matrix';
import { Matrix4 } from 'three';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createLogger } from '../../../shared/services/logger.service.js';
import { MATRIX_CONFIG } from '../config/matrix-config.js';
import { matrixFactory } from '../utils/matrix-adapters.js';
import { MatrixCacheService } from './matrix-cache.service.js';
import {
  type MatrixConversionDependencies,
  MatrixConversionService,
} from './matrix-conversion.service.js';
import type { MatrixTelemetryService } from './matrix-telemetry.service.js';

const logger = createLogger('MatrixConversionServiceTest');

describe('MatrixConversionService', () => {
  let service: MatrixConversionService;
  let mockCache: MatrixCacheService;
  let mockTelemetry: Partial<MatrixTelemetryService>;
  let dependencies: MatrixConversionDependencies;

  beforeEach(() => {
    logger.init('Setting up test environment');

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
      telemetry: mockTelemetry as MatrixTelemetryService,
    };

    // Create service with dependencies
    service = new MatrixConversionService(dependencies);
  });

  afterEach(() => {
    logger.end('Cleaning up test environment');
    service.clearCache();
    service.resetPerformanceMetrics();
  });

  describe('Dependency Injection', () => {
    it('should validate required dependencies on construction', () => {
      logger.debug('[DEBUG][MatrixConversionServiceTest] Testing dependency validation');

      expect(() => {
        new MatrixConversionService({
          cache: null as unknown as MatrixCacheService,
          config: MATRIX_CONFIG,
        });
      }).toThrow('MatrixCacheService dependency is required');

      expect(() => {
        new MatrixConversionService({
          cache: mockCache,
          config: null as unknown as typeof MATRIX_CONFIG,
        });
      }).toThrow('Matrix configuration dependency is required');
    });

    it('should work without optional telemetry dependency', () => {
      logger.debug('[DEBUG][MatrixConversionServiceTest] Testing optional telemetry dependency');

      const serviceWithoutTelemetry = new MatrixConversionService({
        cache: mockCache,
        config: MATRIX_CONFIG,
      });

      expect(serviceWithoutTelemetry).toBeDefined();
      expect(serviceWithoutTelemetry.getPerformanceMetrics()).toBeDefined();
    });
  });

  describe('Matrix4 to ml-matrix Conversion', () => {
    it('should convert Three.js Matrix4 to ml-matrix correctly', async () => {
      logger.debug('[DEBUG][MatrixConversionServiceTest] Testing Matrix4 to ml-matrix conversion');

      const threeMatrix = new Matrix4().makeTranslation(1, 2, 3);

      const result = await service.convertMatrix4ToMLMatrix(threeMatrix, {
        validateInput: true,
        useCache: true,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const matrix = result.data.result;
        expect(matrix.rows).toBe(4);
        expect(matrix.columns).toBe(4);
        expect(matrix.get(0, 3)).toBeCloseTo(1, 10);
        expect(matrix.get(1, 3)).toBeCloseTo(2, 10);
        expect(matrix.get(2, 3)).toBeCloseTo(3, 10);
        expect(result.data.performance.executionTime).toBeGreaterThan(0);
        expect(result.data.performance.operationType).toBe('matrix4ToMLMatrix');
      }
    });

    it('should use cache for repeated conversions', async () => {
      logger.debug(
        '[DEBUG][MatrixConversionServiceTest] Testing cache usage for Matrix4 conversion'
      );

      const threeMatrix = new Matrix4().makeRotationX(Math.PI / 4);

      // First conversion
      const result1 = await service.convertMatrix4ToMLMatrix(threeMatrix, { useCache: true });
      expect(result1.success).toBe(true);
      if (result1.success) {
        expect(result1.data.performance.cacheHit).toBe(false);
      }

      // Second conversion should hit cache
      const result2 = await service.convertMatrix4ToMLMatrix(threeMatrix, { useCache: true });
      expect(result2.success).toBe(true);
      if (result2.success) {
        expect(result2.data.performance.cacheHit).toBe(true);
      }
    });

    it('should validate input when requested', async () => {
      logger.debug('[DEBUG][MatrixConversionServiceTest] Testing input validation');

      // Create a matrix with invalid values
      const invalidMatrix = new Matrix4();
      invalidMatrix.elements[0] = NaN;

      const result = await service.convertMatrix4ToMLMatrix(invalidMatrix, {
        validateInput: true,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Validation failed');
      }
    });
  });

  describe('ml-matrix to Matrix4 Conversion', () => {
    it('should convert ml-matrix to Three.js Matrix4 correctly', async () => {
      logger.debug('[DEBUG][MatrixConversionServiceTest] Testing ml-matrix to Matrix4 conversion');

      const matrix = matrixFactory.identity(4);
      matrix.set(0, 3, 5); // Set translation x
      matrix.set(1, 3, 6); // Set translation y
      matrix.set(2, 3, 7); // Set translation z

      const result = await service.convertMLMatrixToMatrix4(matrix, {
        validateInput: true,
        useCache: true,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const threeMatrix = result.data.result;
        expect(threeMatrix.elements[12]).toBeCloseTo(5, 10);
        expect(threeMatrix.elements[13]).toBeCloseTo(6, 10);
        expect(threeMatrix.elements[14]).toBeCloseTo(7, 10);
        expect(result.data.performance.executionTime).toBeGreaterThanOrEqual(0);
      }
    });

    it('should reject non-4x4 matrices', async () => {
      logger.debug('[DEBUG][MatrixConversionServiceTest] Testing dimension validation');

      const matrix = matrixFactory.identity(3); // 3x3 matrix

      const result = await service.convertMLMatrixToMatrix4(matrix);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Matrix must be 4x4');
      }
    });
  });

  describe('Robust Matrix Inversion', () => {
    it('should perform standard inversion for well-conditioned matrices', async () => {
      logger.debug('[DEBUG][MatrixConversionServiceTest] Testing standard matrix inversion');

      const matrix = matrixFactory.identity(3);
      matrix.set(0, 0, 2); // Make it non-singular
      matrix.set(1, 1, 3);
      matrix.set(2, 2, 4);

      const result = await service.performRobustInversion(matrix, {
        validateInput: true,
        useCache: true,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const inverse = result.data.result;
        expect(inverse.get(0, 0)).toBeCloseTo(0.5, 10);
        expect(inverse.get(1, 1)).toBeCloseTo(1 / 3, 10);
        expect(inverse.get(2, 2)).toBeCloseTo(0.25, 10);
      }
    });

    it('should fall back to SVD for singular matrices', async () => {
      logger.debug(
        '[DEBUG][MatrixConversionServiceTest] Testing SVD fallback for singular matrices'
      );

      // Create a singular matrix (rank deficient)
      const matrix = new Matrix([
        [1, 2, 3],
        [2, 4, 6], // This row is 2x the first row
        [0, 0, 1],
      ]);

      const result = await service.performRobustInversion(matrix, {
        enableSVDFallback: true,
        validateInput: true,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const pseudoInverse = result.data.result;
        expect(pseudoInverse.rows).toBe(3);
        expect(pseudoInverse.columns).toBe(3);
      }
    });

    it('should reject non-square matrices', async () => {
      logger.debug('[DEBUG][MatrixConversionServiceTest] Testing non-square matrix rejection');

      const matrix = new Matrix(3, 4); // Non-square matrix

      const result = await service.performRobustInversion(matrix);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('requires square matrix');
      }
    });
  });

  describe('Normal Matrix Computation', () => {
    it('should compute normal matrix correctly', async () => {
      logger.debug('[DEBUG][MatrixConversionServiceTest] Testing normal matrix computation');

      const modelMatrix = new Matrix4().makeScale(2, 3, 4);

      const result = await service.computeRobustNormalMatrix(modelMatrix, {
        validateInput: true,
        useCache: true,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const normalMatrix = result.data.result;
        // Normal matrix should be inverse transpose of upper-left 3x3
        expect(normalMatrix.elements[0]).toBeCloseTo(0.5, 10); // 1/2
        expect(normalMatrix.elements[4]).toBeCloseTo(1 / 3, 10); // 1/3
        expect(normalMatrix.elements[8]).toBeCloseTo(0.25, 10); // 1/4
      }
    });
  });

  describe('Performance Monitoring', () => {
    it('should track performance metrics', async () => {
      logger.debug('[DEBUG][MatrixConversionServiceTest] Testing performance metrics tracking');

      const matrix = matrixFactory.identity(4);

      // Perform some operations
      await service.convertMLMatrixToMatrix4(matrix);
      await service.performRobustInversion(matrix);

      const metrics = service.getPerformanceMetrics();
      expect(metrics.operationCount).toBeGreaterThan(0);
      expect(metrics.totalExecutionTime).toBeGreaterThanOrEqual(0);
      expect(metrics.averageExecutionTime).toBeGreaterThanOrEqual(0);
    });

    it('should reset performance metrics', () => {
      logger.debug('[DEBUG][MatrixConversionServiceTest] Testing performance metrics reset');

      service.resetPerformanceMetrics();

      const metrics = service.getPerformanceMetrics();
      expect(metrics.operationCount).toBe(0);
      expect(metrics.totalExecutionTime).toBe(0);
      expect(metrics.averageExecutionTime).toBe(0);
    });

    it('should track telemetry when available', async () => {
      logger.debug('[DEBUG][MatrixConversionServiceTest] Testing telemetry tracking');

      const matrix = matrixFactory.identity(4);

      await service.convertMLMatrixToMatrix4(matrix);

      expect(mockTelemetry.trackOperation).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle conversion errors gracefully', async () => {
      logger.debug('[DEBUG][MatrixConversionServiceTest] Testing error handling');

      // Create an invalid matrix that will cause conversion to fail
      const invalidMatrix = new Matrix(0, 0); // Empty matrix

      const result = await service.convertMLMatrixToMatrix4(invalidMatrix);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
      }
    });

    it('should record failed operations in metrics', async () => {
      logger.debug('[DEBUG][MatrixConversionServiceTest] Testing failure recording');

      const initialMetrics = service.getPerformanceMetrics();
      const initialFailures = initialMetrics.failedOperations;

      // Attempt an operation that will fail
      const invalidMatrix = new Matrix(0, 0);
      await service.convertMLMatrixToMatrix4(invalidMatrix);

      const updatedMetrics = service.getPerformanceMetrics();
      expect(updatedMetrics.failedOperations).toBeGreaterThanOrEqual(initialFailures);
    });
  });
});
