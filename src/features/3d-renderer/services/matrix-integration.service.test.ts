/**
 * Matrix Integration Service Tests
 *
 * Comprehensive tests for matrix integration service with enhanced operations,
 * validation, telemetry, and CSG integration following TDD methodology.
 */

import { Matrix } from 'ml-matrix';
import { Matrix3, Matrix4 } from 'three';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createLogger } from '../../../shared/services/logger.service.js';
import { matrixFactory } from '../utils/matrix-adapters.js';
import { MatrixIntegrationService } from './matrix-integration.service.js';
import { MatrixServiceContainer } from './matrix-service-container.js';

const logger = createLogger('MatrixIntegrationServiceTest');

describe('MatrixIntegrationService', () => {
  let service: MatrixIntegrationService;
  let serviceContainer: MatrixServiceContainer;

  beforeEach(() => {
    logger.init('Setting up test environment');

    serviceContainer = new MatrixServiceContainer({
      enableTelemetry: true,
      enableValidation: true,
      enableConfigManager: true,
      autoStartServices: true,
    });

    service = new MatrixIntegrationService(serviceContainer);
  });

  afterEach(async () => {
    logger.end('Cleaning up test environment');
    await service.shutdown();
  });

  describe('Enhanced Matrix Conversion', () => {
    it('should perform enhanced Matrix4 to ml-matrix conversion', async () => {
      logger.debug('[DEBUG][MatrixIntegrationServiceTest] Testing enhanced Matrix4 conversion');

      const matrix4 = new Matrix4().makeTranslation(1, 2, 3);

      const result = await service.convertMatrix4ToMLMatrix(matrix4, {
        useValidation: true,
        useTelemetry: true,
        useCache: true,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const enhanced = result.data;

        // Check result
        expect(enhanced.result.rows).toBe(4);
        expect(enhanced.result.columns).toBe(4);
        expect(enhanced.result.get(0, 3)).toBeCloseTo(1, 10);
        expect(enhanced.result.get(1, 3)).toBeCloseTo(2, 10);
        expect(enhanced.result.get(2, 3)).toBeCloseTo(3, 10);

        // Check validation
        expect(enhanced.validation).toBeDefined();
        expect(enhanced.validation?.isValid).toBe(true);

        // Check performance metadata
        expect(enhanced.performance.executionTime).toBeGreaterThan(0);
        expect(enhanced.performance.operationType).toBe('convertMatrix4ToMLMatrix');
        expect(enhanced.performance.memoryUsed).toBeGreaterThan(0);

        // Check metadata
        expect(enhanced.metadata.timestamp).toBeGreaterThan(0);
        expect(enhanced.metadata.operationId).toContain('convertMatrix4ToMLMatrix');
        expect(Array.isArray(enhanced.metadata.warnings)).toBe(true);
      }
    });

    it('should handle conversion with validation warnings', async () => {
      logger.debug(
        '[DEBUG][MatrixIntegrationServiceTest] Testing conversion with validation warnings'
      );

      // Create a large matrix that might trigger warnings
      const largeMatrix = new Matrix4().makeScale(1000, 1000, 1000);

      const result = await service.convertMatrix4ToMLMatrix(largeMatrix, {
        useValidation: true,
        useTelemetry: true,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const enhanced = result.data;
        expect(enhanced.validation).toBeDefined();
        // May have warnings about large values or performance
        expect(Array.isArray(enhanced.metadata.warnings)).toBe(true);
      }
    });

    it('should work without optional services', async () => {
      logger.debug(
        '[DEBUG][MatrixIntegrationServiceTest] Testing conversion without optional services'
      );

      const minimalContainer = new MatrixServiceContainer({
        enableTelemetry: false,
        enableValidation: false,
        enableConfigManager: false,
      });

      const minimalService = new MatrixIntegrationService(minimalContainer);

      const matrix4 = new Matrix4().makeRotationX(Math.PI / 4);

      const result = await minimalService.convertMatrix4ToMLMatrix(matrix4, {
        useValidation: false,
        useTelemetry: false,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.result).toBeDefined();
        expect(result.data.validation).toBeUndefined();
      }

      await minimalService.shutdown();
    });
  });

  describe('Enhanced Matrix Inversion', () => {
    it('should perform robust inversion with validation', async () => {
      logger.debug('[DEBUG][MatrixIntegrationServiceTest] Testing enhanced robust inversion');

      const matrix = matrixFactory.identity(3);
      matrix.set(0, 0, 2);
      matrix.set(1, 1, 3);
      matrix.set(2, 2, 4);

      const result = await service.performRobustInversion(matrix, {
        useValidation: true,
        useTelemetry: true,
        enableSVDFallback: true,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const enhanced = result.data;

        // Check result
        expect(enhanced.result.get(0, 0)).toBeCloseTo(0.5, 10);
        expect(enhanced.result.get(1, 1)).toBeCloseTo(1 / 3, 10);
        expect(enhanced.result.get(2, 2)).toBeCloseTo(0.25, 10);

        // Check validation
        expect(enhanced.validation).toBeDefined();
        expect(enhanced.validation?.isValid).toBe(true);
        expect(enhanced.validation?.numericalStability).toBe('excellent');

        // Check performance
        expect(enhanced.performance.executionTime).toBeGreaterThan(0);
        expect(enhanced.performance.operationType).toBe('performRobustInversion');
      }
    });

    it('should handle singular matrices with SVD fallback', async () => {
      logger.debug(
        '[DEBUG][MatrixIntegrationServiceTest] Testing singular matrix with SVD fallback'
      );

      // Create a singular matrix
      const singularMatrix = new Matrix([
        [1, 2, 3],
        [2, 4, 6], // This row is 2x the first row
        [0, 0, 1],
      ]);

      const result = await service.performRobustInversion(singularMatrix, {
        useValidation: true,
        enableSVDFallback: true,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const enhanced = result.data;

        // Should have validation warnings about singularity
        expect(enhanced.validation?.warnings.length).toBeGreaterThan(0);
        expect(enhanced.validation?.numericalStability).toBe('unstable');
        expect(enhanced.metadata.warnings.some((w) => w.includes('unstable'))).toBe(true);
      }
    });

    it('should fail gracefully for invalid matrices', async () => {
      logger.debug('[DEBUG][MatrixIntegrationServiceTest] Testing invalid matrix handling');

      const invalidMatrix = new Matrix(0, 0); // Empty matrix

      const result = await service.performRobustInversion(invalidMatrix);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
      }
    });
  });

  describe('Enhanced Normal Matrix Computation', () => {
    it('should compute normal matrix with enhanced features', async () => {
      logger.debug(
        '[DEBUG][MatrixIntegrationServiceTest] Testing enhanced normal matrix computation'
      );

      const modelMatrix = new Matrix4().makeScale(2, 3, 4);

      const result = await service.computeEnhancedNormalMatrix(modelMatrix, {
        useValidation: true,
        useTelemetry: true,
        enableSVDFallback: true,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const enhanced = result.data;

        // Check result - normal matrix should be inverse transpose of upper-left 3x3
        expect(enhanced.result.elements[0]).toBeCloseTo(0.5, 10); // 1/2
        expect(enhanced.result.elements[4]).toBeCloseTo(1 / 3, 10); // 1/3
        expect(enhanced.result.elements[8]).toBeCloseTo(0.25, 10); // 1/4

        // Check performance
        expect(enhanced.performance.executionTime).toBeGreaterThan(0);
        expect(enhanced.performance.operationType).toBe('computeEnhancedNormalMatrix');

        // Check metadata
        expect(enhanced.metadata.operationId).toContain('computeEnhancedNormalMatrix');
      }
    });
  });

  describe('Batch Operations', () => {
    it('should perform batch operations successfully', async () => {
      logger.debug('[DEBUG][MatrixIntegrationServiceTest] Testing batch operations');

      const operations = [
        () => service.convertMatrix4ToMLMatrix(new Matrix4().makeTranslation(1, 0, 0)),
        () => service.convertMatrix4ToMLMatrix(new Matrix4().makeTranslation(0, 1, 0)),
        () => service.convertMatrix4ToMLMatrix(new Matrix4().makeTranslation(0, 0, 1)),
      ];

      const result = await service.performBatchOperations(operations, {
        useTelemetry: true,
        continueOnError: false,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(3);

        for (const enhanced of result.data) {
          expect(enhanced.result).toBeDefined();
          expect(enhanced.performance.executionTime).toBeGreaterThan(0);
        }
      }
    });

    it('should handle batch operations with errors', async () => {
      logger.debug('[DEBUG][MatrixIntegrationServiceTest] Testing batch operations with errors');

      const operations = [
        () => service.convertMatrix4ToMLMatrix(new Matrix4().makeTranslation(1, 0, 0)),
        () => Promise.resolve(service.performRobustInversion(new Matrix(0, 0))), // This will fail
        () => service.convertMatrix4ToMLMatrix(new Matrix4().makeTranslation(0, 0, 1)),
      ];

      // Test with continueOnError = false (should stop on first error)
      const result1 = await service.performBatchOperations(operations, {
        continueOnError: false,
      });

      expect(result1.success).toBe(false);

      // Test with continueOnError = true (should continue despite errors)
      const result2 = await service.performBatchOperations(operations, {
        continueOnError: true,
      });

      expect(result2.success).toBe(true);
      if (result2.success) {
        expect(result2.data).toHaveLength(2); // Should have 2 successful operations
      }
    });
  });

  describe('Performance Reporting', () => {
    it('should generate comprehensive performance report', async () => {
      logger.debug('[DEBUG][MatrixIntegrationServiceTest] Testing performance reporting');

      // Perform some operations to generate data
      await service.convertMatrix4ToMLMatrix(new Matrix4().makeTranslation(1, 2, 3));
      await service.performRobustInversion(matrixFactory.identity(3));

      const report = service.getPerformanceReport();

      expect(report).toBeDefined();
      expect(report.telemetry).toBeDefined();
      expect(report.cache).toBeDefined();
      expect(report.validation).toBeDefined();
      expect(report.conversion).toBeDefined();

      // Check telemetry report structure with proper type assertions
      const telemetryReport = report.telemetry as Record<string, unknown>;
      expect(telemetryReport.summary as Record<string, unknown>).toBeDefined();
      expect(telemetryReport.operationBreakdown as Record<string, unknown>).toBeDefined();
      expect(
        typeof ((telemetryReport.summary as Record<string, unknown>).totalOperations as number)
      ).toBe('number');
    });

    it('should handle missing services in performance report', () => {
      logger.debug(
        '[DEBUG][MatrixIntegrationServiceTest] Testing performance report with missing services'
      );

      const minimalContainer = new MatrixServiceContainer({
        enableTelemetry: false,
        enableValidation: false,
      });

      const minimalService = new MatrixIntegrationService(minimalContainer);
      const report = minimalService.getPerformanceReport();

      expect(report).toBeDefined();
      expect(report.telemetry).toBeUndefined();
      expect(report.validation).toBeUndefined();
      expect(report.cache).toBeDefined(); // Cache is always available
    });
  });

  describe('Configuration Optimization', () => {
    it('should optimize configuration based on usage patterns', async () => {
      logger.debug('[DEBUG][MatrixIntegrationServiceTest] Testing configuration optimization');

      // Perform some operations to generate telemetry data
      for (let i = 0; i < 10; i++) {
        await service.convertMatrix4ToMLMatrix(new Matrix4().makeTranslation(i, 0, 0));
      }

      const result = await service.optimizeConfiguration();

      expect(result.success).toBe(true);
    });

    it('should handle optimization without required services', async () => {
      logger.debug(
        '[DEBUG][MatrixIntegrationServiceTest] Testing optimization without required services'
      );

      const minimalContainer = new MatrixServiceContainer({
        enableTelemetry: false,
        enableConfigManager: false,
      });

      const minimalService = new MatrixIntegrationService(minimalContainer);

      const result = await minimalService.optimizeConfiguration();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('not available');
      }

      await minimalService.shutdown();
    });
  });

  describe('Health Monitoring', () => {
    it('should provide health status', async () => {
      logger.debug('[DEBUG][MatrixIntegrationServiceTest] Testing health status');

      const healthStatus = await service.getHealthStatus();

      expect(healthStatus).toBeDefined();
      expect(healthStatus.overall).toMatch(/^(healthy|degraded|unhealthy)$/);
      expect(Array.isArray(healthStatus.services)).toBe(true);
      expect(healthStatus.services.length).toBeGreaterThan(0);
      expect(healthStatus.timestamp).toBeGreaterThan(0);

      // All services should be healthy in a fresh setup
      expect(healthStatus.overall).toBe('healthy');
    });
  });

  describe('Error Handling and Resilience', () => {
    it('should handle service failures gracefully', async () => {
      logger.debug('[DEBUG][MatrixIntegrationServiceTest] Testing service failure handling');

      // Test with invalid input that should trigger error handling
      const invalidMatrix4 = new Matrix4();
      invalidMatrix4.elements[0] = NaN; // Invalid value

      const result = await service.convertMatrix4ToMLMatrix(invalidMatrix4, {
        useValidation: true,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
      }
    });

    it('should maintain operation tracking during errors', async () => {
      logger.debug('[DEBUG][MatrixIntegrationServiceTest] Testing operation tracking during errors');

      const telemetryService = serviceContainer.getTelemetryService();
      const initialMetrics = telemetryService?.getPerformanceMetrics();
      const initialFailures = initialMetrics?.failedOperations || 0;

      // Perform an operation that will fail
      await service.performRobustInversion(new Matrix(0, 0));

      const finalMetrics = telemetryService?.getPerformanceMetrics();
      const finalFailures = finalMetrics?.failedOperations || 0;

      expect(finalFailures).toBeGreaterThan(initialFailures);
    });
  });

  describe('Integration with Existing Systems', () => {
    it('should integrate with existing matrix operations', async () => {
      logger.debug(
        '[DEBUG][MatrixIntegrationServiceTest] Testing integration with existing operations'
      );

      // Test that enhanced operations can work with existing Three.js matrices
      const threeMatrix = new Matrix4().makeRotationY(Math.PI / 2);

      const conversionResult = await service.convertMatrix4ToMLMatrix(threeMatrix);
      expect(conversionResult.success).toBe(true);

      if (conversionResult.success) {
        const mlMatrix = conversionResult.data.result;

        // Test that we can perform operations on the converted matrix
        const inversionResult = await service.performRobustInversion(mlMatrix);
        expect(inversionResult.success).toBe(true);
      }
    });

    it('should maintain compatibility with CSG operations', async () => {
      logger.debug('[DEBUG][MatrixIntegrationServiceTest] Testing CSG operation compatibility');

      // Test normal matrix computation for CSG operations
      const transformMatrix = new Matrix4()
        .makeRotationX(Math.PI / 4)
        .multiply(new Matrix4().makeScale(2, 1, 1));

      const normalResult = await service.computeEnhancedNormalMatrix(transformMatrix);

      expect(normalResult.success).toBe(true);
      if (normalResult.success) {
        const normalMatrix = normalResult.data.result;

        // Normal matrix should be usable for lighting calculations
        expect(normalMatrix).toBeInstanceOf(Matrix3);
        expect(normalMatrix.determinant()).not.toBe(0); // Should be invertible
      }
    });
  });
});
