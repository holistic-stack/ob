/**
 * Matrix Performance Regression Testing Framework
 *
 * Automated performance monitoring and regression detection system for
 * matrix services, providing continuous performance validation and alerting.
 */

import { Matrix } from 'ml-matrix';
import { Euler, Matrix4 } from 'three';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createLogger } from '../../../shared/services/logger.service.js';
import { matrixFactory } from '../utils/matrix-adapters.js';
import { MatrixIntegrationService } from './matrix-integration.service.js';
import { getMatrixServiceContainer, MatrixServiceContainer } from './matrix-service-container.js';

const logger = createLogger('PerformanceRegressionTest');

/**
 * Performance baseline configuration
 */
const PERFORMANCE_BASELINES = {
  // Matrix conversion operations
  matrixConversion: {
    matrix4ToMLMatrix: { baseline: 5, tolerance: 2, maxRegression: 50 }, // ms
    mlMatrixToMatrix4: { baseline: 3, tolerance: 1, maxRegression: 30 },
    normalMatrixComputation: { baseline: 8, tolerance: 3, maxRegression: 40 },
  },
  // Matrix validation operations
  matrixValidation: {
    basicValidation: { baseline: 2, tolerance: 1, maxRegression: 20 },
    numericalStability: { baseline: 10, tolerance: 4, maxRegression: 60 },
    conditionNumber: { baseline: 15, tolerance: 5, maxRegression: 80 },
  },
  // Matrix mathematical operations
  matrixOperations: {
    multiply: { baseline: 5, tolerance: 2, maxRegression: 40 },
    invert: { baseline: 12, tolerance: 4, maxRegression: 70 },
    transpose: { baseline: 1, tolerance: 0.5, maxRegression: 10 },
  },
  // Cache operations
  cacheOperations: {
    get: { baseline: 0.1, tolerance: 0.05, maxRegression: 1 },
    set: { baseline: 0.2, tolerance: 0.1, maxRegression: 2 },
    clear: { baseline: 1, tolerance: 0.5, maxRegression: 5 },
  },
  // Service container operations
  serviceContainer: {
    initialization: { baseline: 50, tolerance: 20, maxRegression: 200 },
    healthCheck: { baseline: 5, tolerance: 2, maxRegression: 25 },
    serviceRestart: { baseline: 30, tolerance: 10, maxRegression: 150 },
  },
};

/**
 * Performance test configuration
 */
const PERFORMANCE_TEST_CONFIG = {
  warmupIterations: 5,
  measurementIterations: 20,
  cooldownMs: 100,
  timeoutMs: 30000,
  regressionThreshold: 0.2, // 20% regression threshold
  significanceLevel: 0.05, // 5% statistical significance
};

/**
 * Performance measurement result
 */
interface PerformanceMeasurement {
  readonly operation: string;
  readonly category: string;
  readonly executionTimes: number[];
  readonly averageTime: number;
  readonly medianTime: number;
  readonly minTime: number;
  readonly maxTime: number;
  readonly standardDeviation: number;
  readonly baseline: number;
  readonly tolerance: number;
  readonly regressionPercent: number;
  readonly isRegression: boolean;
  readonly isSignificant: boolean;
}

/**
 * Performance regression report
 */
interface PerformanceRegressionReport {
  readonly timestamp: number;
  readonly totalTests: number;
  readonly passedTests: number;
  readonly failedTests: number;
  readonly regressionTests: number;
  readonly measurements: PerformanceMeasurement[];
  readonly summary: {
    readonly averageRegression: number;
    readonly maxRegression: number;
    readonly criticalRegressions: string[];
    readonly recommendations: string[];
  };
}

/**
 * Measure operation performance
 */
const measurePerformance = async (
  operation: () => Promise<unknown> | unknown,
  operationName: string,
  category: keyof typeof PERFORMANCE_BASELINES
): Promise<PerformanceMeasurement> => {
  const config = PERFORMANCE_TEST_CONFIG;
  const categoryBaselines = PERFORMANCE_BASELINES[category];
  const baseline = (
    categoryBaselines as Record<
      string,
      { baseline: number; tolerance: number; maxRegression: number } | undefined
    >
  )[operationName];

  if (!baseline) {
    throw new Error(`No baseline found for ${category}.${operationName}`);
  }

  // Type assertion after null check to ensure baseline is defined
  const baselineConfig = baseline as { baseline: number; tolerance: number; maxRegression: number };

  const executionTimes: number[] = [];

  // Warmup iterations
  for (let i = 0; i < config.warmupIterations; i++) {
    await operation();
    await new Promise((resolve) => setTimeout(resolve, 10));
  }

  // Measurement iterations
  for (let i = 0; i < config.measurementIterations; i++) {
    const startTime = performance.now();
    await operation();
    const endTime = performance.now();

    executionTimes.push(endTime - startTime);

    // Cooldown between measurements
    await new Promise((resolve) => setTimeout(resolve, config.cooldownMs));
  }

  // Calculate statistics
  const averageTime = executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length;
  const sortedTimes = [...executionTimes].sort((a, b) => a - b);
  const medianTime =
    sortedTimes.length > 0 ? (sortedTimes[Math.floor(sortedTimes.length / 2)] ?? 0) : 0;
  const minTime = Math.min(...executionTimes);
  const maxTime = Math.max(...executionTimes);

  const variance =
    executionTimes.reduce((sum, time) => sum + (time - averageTime) ** 2, 0) /
    executionTimes.length;
  const standardDeviation = Math.sqrt(variance);

  const regressionPercent =
    ((averageTime - baselineConfig.baseline) / baselineConfig.baseline) * 100;
  const isRegression = regressionPercent > config.regressionThreshold * 100;
  const isSignificant = Math.abs(averageTime - baselineConfig.baseline) > baselineConfig.tolerance;

  return {
    operation: operationName,
    category,
    executionTimes,
    averageTime,
    medianTime,
    minTime,
    maxTime,
    standardDeviation,
    baseline: baselineConfig.baseline,
    tolerance: baselineConfig.tolerance,
    regressionPercent,
    isRegression,
    isSignificant,
  };
};

/**
 * Generate performance regression report
 */
const generateRegressionReport = (
  measurements: PerformanceMeasurement[]
): PerformanceRegressionReport => {
  const totalTests = measurements.length;
  const passedTests = measurements.filter((m) => !m.isRegression).length;
  const failedTests = measurements.filter((m) => m.isRegression && m.isSignificant).length;
  const regressionTests = measurements.filter((m) => m.isRegression).length;

  const regressions = measurements.filter((m) => m.isRegression).map((m) => m.regressionPercent);
  const averageRegression =
    regressions.length > 0 ? regressions.reduce((a, b) => a + b, 0) / regressions.length : 0;
  const maxRegression = regressions.length > 0 ? Math.max(...regressions) : 0;

  const criticalRegressions = measurements
    .filter((m) => m.regressionPercent > 50) // >50% regression is critical
    .map((m) => `${m.category}.${m.operation}: ${m.regressionPercent.toFixed(1)}%`);

  const recommendations: string[] = [];
  if (criticalRegressions.length > 0) {
    recommendations.push(
      'Critical performance regressions detected - immediate investigation required'
    );
  }
  if (averageRegression > 20) {
    recommendations.push('Average regression exceeds 20% - review recent changes');
  }
  if (failedTests > totalTests * 0.3) {
    recommendations.push('More than 30% of tests failed - system-wide performance issue');
  }

  return {
    timestamp: Date.now(),
    totalTests,
    passedTests,
    failedTests,
    regressionTests,
    measurements,
    summary: {
      averageRegression,
      maxRegression,
      criticalRegressions,
      recommendations,
    },
  };
};

describe('Matrix Performance Regression Testing Framework', () => {
  let serviceContainer: MatrixServiceContainer;
  let integrationService: MatrixIntegrationService;
  let performanceMeasurements: PerformanceMeasurement[] = [];

  beforeEach(async () => {
    logger.init('Setting up performance test environment');

    // Reset singleton instances for clean test state
    MatrixServiceContainer.resetInstance();
    MatrixIntegrationService.resetInstance();

    serviceContainer = await getMatrixServiceContainer({
      enableTelemetry: true,
      enableValidation: true,
      enableConfigManager: true,
      autoStartServices: true,
    });

    integrationService = await MatrixIntegrationService.getInstance();
    performanceMeasurements = [];
  });

  afterEach(async () => {
    logger.end('Cleaning up performance test environment');

    // Generate and log performance report
    if (performanceMeasurements.length > 0) {
      const report = generateRegressionReport(performanceMeasurements);
      logger.info('[PERFORMANCE][Report]', JSON.stringify(report, null, 2));

      // Assert no critical regressions
      expect(report.summary.criticalRegressions).toHaveLength(0);
      expect(report.summary.averageRegression).toBeLessThan(50); // <50% average regression
    }

    if (integrationService) {
      await integrationService.shutdown();
    }

    // Reset singleton instances after each test
    MatrixServiceContainer.resetInstance();
    MatrixIntegrationService.resetInstance();
  });

  describe('Matrix Conversion Performance', () => {
    it(
      'should maintain Matrix4 to ml-matrix conversion performance',
      async () => {
        logger.debug(
          '[DEBUG][PerformanceRegressionTest] Testing Matrix4 to ml-matrix conversion performance'
        );

        const testMatrix = new Matrix4().makeRotationFromEuler(
          new Euler(Math.PI / 4, Math.PI / 6, Math.PI / 3, 'XYZ')
        );

        const measurement = await measurePerformance(
          async () => {
            const result = await integrationService.convertMatrix4ToMLMatrix(testMatrix, {
              useValidation: false,
              useTelemetry: false,
            });
            expect(result.success).toBe(true);
            return result;
          },
          'matrix4ToMLMatrix',
          'matrixConversion'
        );

        performanceMeasurements.push(measurement);

        logger.debug('[DEBUG][PerformanceRegressionTest] Matrix4 conversion performance:', {
          average: measurement.averageTime.toFixed(2),
          baseline: measurement.baseline,
          regression: measurement.regressionPercent.toFixed(1),
        });

        // Validate performance against baseline
        expect(measurement.isRegression).toBe(false);
        if (measurement.isSignificant) {
          expect(measurement.averageTime).toBeLessThan(
            measurement.baseline + measurement.tolerance
          );
        }
      },
      PERFORMANCE_TEST_CONFIG.timeoutMs
    );

    it(
      'should maintain normal matrix computation performance',
      async () => {
        logger.debug(
          '[DEBUG][PerformanceRegressionTest] Testing normal matrix computation performance'
        );

        const testMatrix = new Matrix4().makeScale(2, 3, 4);

        const measurement = await measurePerformance(
          async () => {
            const result = await integrationService.convertMatrix4ToMLMatrix(testMatrix, {
              useValidation: true,
              useTelemetry: false,
            });
            expect(result.success).toBe(true);
            return result;
          },
          'normalMatrixComputation',
          'matrixConversion'
        );

        performanceMeasurements.push(measurement);

        // Validate performance
        expect(measurement.isRegression).toBe(false);
      },
      PERFORMANCE_TEST_CONFIG.timeoutMs
    );
  });

  describe('Matrix Validation Performance', () => {
    it(
      'should maintain basic validation performance',
      async () => {
        logger.debug('[DEBUG][PerformanceRegressionTest] Testing basic validation performance');

        const testMatrix = matrixFactory.identity(4);

        const measurement = await measurePerformance(
          async () => {
            const validationService = serviceContainer.getValidationService();
            if (!validationService) {
              throw new Error('Validation service not available');
            }
            const result = await validationService.validateMatrix(testMatrix, {
              useCache: false,
              tolerance: 1e-10,
            });
            expect(result.success).toBe(true);
            return result;
          },
          'basicValidation',
          'matrixValidation'
        );

        performanceMeasurements.push(measurement);

        // Validate performance
        expect(measurement.isRegression).toBe(false);
      },
      PERFORMANCE_TEST_CONFIG.timeoutMs
    );

    it(
      'should maintain numerical stability analysis performance',
      async () => {
        logger.debug('[DEBUG][PerformanceRegressionTest] Testing numerical stability performance');

        const testMatrix = new Matrix([
          [1, 2, 3, 4],
          [5, 6, 7, 8],
          [9, 10, 11, 12],
          [13, 14, 15, 16],
        ]);

        const measurement = await measurePerformance(
          async () => {
            const validationService = serviceContainer.getValidationService();
            if (!validationService) {
              throw new Error('Validation service not available');
            }
            const result = await validationService.validateMatrix(testMatrix, {
              useCache: false,
              tolerance: 1e-6,
            });
            return result;
          },
          'numericalStability',
          'matrixValidation'
        );

        performanceMeasurements.push(measurement);

        // Validate performance
        expect(measurement.isRegression).toBe(false);
      },
      PERFORMANCE_TEST_CONFIG.timeoutMs
    );
  });

  describe('Cache Operations Performance', () => {
    it(
      'should maintain cache get operation performance',
      async () => {
        logger.debug('[DEBUG][PerformanceRegressionTest] Testing cache get performance');

        const cacheService = serviceContainer.getCacheService();
        const testKey = 'performance_test_key';
        const testMatrix = matrixFactory.identity(4);

        // Pre-populate cache
        cacheService.set(testKey, testMatrix);

        const measurement = await measurePerformance(
          () => {
            const result = cacheService.get(testKey);
            expect(result).toEqual(testMatrix);
            return result;
          },
          'get',
          'cacheOperations'
        );

        performanceMeasurements.push(measurement);

        // Validate performance
        expect(measurement.isRegression).toBe(false);
      },
      PERFORMANCE_TEST_CONFIG.timeoutMs
    );

    it(
      'should maintain cache set operation performance',
      async () => {
        logger.debug('[DEBUG][PerformanceRegressionTest] Testing cache set performance');

        const cacheService = serviceContainer.getCacheService();

        const measurement = await measurePerformance(
          () => {
            const key = `perf_test_${Math.random()}`;
            const matrix = matrixFactory.identity(2);
            cacheService.set(key, matrix);
            return matrix;
          },
          'set',
          'cacheOperations'
        );

        performanceMeasurements.push(measurement);

        // Validate performance
        expect(measurement.isRegression).toBe(false);
      },
      PERFORMANCE_TEST_CONFIG.timeoutMs
    );
  });

  describe('Service Container Performance', () => {
    it(
      'should maintain health check performance',
      async () => {
        logger.debug('[DEBUG][PerformanceRegressionTest] Testing health check performance');

        const measurement = await measurePerformance(
          async () => {
            const healthReport = await serviceContainer.performHealthCheck();
            expect(healthReport.overall).toMatch(/^(healthy|degraded|unhealthy)$/);
            return healthReport;
          },
          'healthCheck',
          'serviceContainer'
        );

        performanceMeasurements.push(measurement);

        // Validate performance
        expect(measurement.isRegression).toBe(false);
      },
      PERFORMANCE_TEST_CONFIG.timeoutMs
    );
  });

  describe('End-to-End Performance', () => {
    it(
      'should maintain overall workflow performance',
      async () => {
        logger.debug('[DEBUG][PerformanceRegressionTest] Testing end-to-end workflow performance');

        // This is a composite test that measures overall system performance
        const workflowMeasurements: number[] = [];

        for (let i = 0; i < PERFORMANCE_TEST_CONFIG.measurementIterations; i++) {
          const startTime = performance.now();

          // Simulate complete workflow
          const matrix4 = new Matrix4().makeRotationFromEuler(
            new Euler(i * 0.1, i * 0.2, i * 0.3, 'XYZ')
          );

          const conversionResult = await integrationService.convertMatrix4ToMLMatrix(matrix4, {
            useValidation: true,
            useTelemetry: true,
          });

          expect(conversionResult.success).toBe(true);

          if (conversionResult.success) {
            const _inversionResult = await integrationService.performRobustInversion(
              conversionResult.data.result
            );
            // Inversion might fail for some matrices, that's okay
          }

          const endTime = performance.now();
          workflowMeasurements.push(endTime - startTime);

          await new Promise((resolve) => setTimeout(resolve, 50));
        }

        const averageWorkflowTime =
          workflowMeasurements.reduce((a, b) => a + b, 0) / workflowMeasurements.length;
        const maxWorkflowTime = Math.max(...workflowMeasurements);

        logger.debug('[DEBUG][PerformanceRegressionTest] End-to-end workflow performance:', {
          average: averageWorkflowTime.toFixed(2),
          max: maxWorkflowTime.toFixed(2),
          samples: workflowMeasurements.length,
        });

        // Validate end-to-end performance
        expect(averageWorkflowTime).toBeLessThan(100); // <100ms average
        expect(maxWorkflowTime).toBeLessThan(500); // <500ms max

        // System should still be healthy after intensive operations
        const finalHealth = await integrationService.getHealthStatus();
        expect(finalHealth.overall).toMatch(/^(healthy|degraded)$/);
      },
      PERFORMANCE_TEST_CONFIG.timeoutMs
    );
  });
});
