/**
 * Matrix Service Load Testing
 *
 * Comprehensive load testing suite for matrix services under various stress conditions,
 * validating performance, memory usage, and service stability under high load.
 */

import { Matrix } from 'ml-matrix';
import { Euler, Matrix4 } from 'three';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createLogger } from '../../../shared/services/logger.service.js';
import { MatrixIntegrationService } from './matrix-integration.service.js';
import { MatrixServiceContainer } from './matrix-service-container.js';

const logger = createLogger('MatrixServiceLoadTest');

/**
 * Load testing configuration
 */
const LOAD_TEST_CONFIG = {
  // Light load testing
  light: {
    operationCount: 100,
    concurrentOperations: 5,
    matrixSize: 10,
    timeoutMs: 5000,
  },
  // Medium load testing
  medium: {
    operationCount: 500,
    concurrentOperations: 20,
    matrixSize: 50,
    timeoutMs: 15000,
  },
  // Heavy load testing
  heavy: {
    operationCount: 1000,
    concurrentOperations: 50,
    matrixSize: 100,
    timeoutMs: 30000,
  },
  // Stress testing
  stress: {
    operationCount: 2000,
    concurrentOperations: 100,
    matrixSize: 200,
    timeoutMs: 60000,
  },
};

/**
 * Performance metrics for load testing
 */
interface LoadTestMetrics {
  readonly totalOperations: number;
  readonly successfulOperations: number;
  readonly failedOperations: number;
  readonly averageExecutionTime: number;
  readonly maxExecutionTime: number;
  readonly minExecutionTime: number;
  readonly operationsPerSecond: number;
  readonly memoryUsage: number;
  readonly cacheHitRate: number;
  readonly errorRate: number;
}

/**
 * Create test matrix of specified size
 */
const createTestMatrix = (size: number): Matrix => {
  const data: number[][] = [];
  for (let i = 0; i < size; i++) {
    const row: number[] = [];
    for (let j = 0; j < size; j++) {
      row.push(Math.random() * 100);
    }
    data.push(row);
  }
  return new Matrix(data);
};

/**
 * Create test Matrix4
 */
const createTestMatrix4 = (): Matrix4 => {
  const euler = new Euler(
    Math.random() * Math.PI,
    Math.random() * Math.PI,
    Math.random() * Math.PI,
    'XYZ'
  );
  return new Matrix4().makeRotationFromEuler(euler);
};

/**
 * Performance interface with memory property for Chrome
 */
interface PerformanceWithMemory extends Performance {
  memory?: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
}

/**
 * Measure memory usage
 */
const measureMemoryUsage = (): number => {
  const perf = performance as PerformanceWithMemory;
  if (typeof performance !== 'undefined' && perf.memory) {
    return perf.memory.usedJSHeapSize;
  }
  return 0;
};

/**
 * Calculate load test metrics
 */
const calculateMetrics = (
  results: Array<{ success: boolean; executionTime: number }>,
  startTime: number,
  endTime: number,
  memoryBefore: number,
  memoryAfter: number,
  cacheHits: number
): LoadTestMetrics => {
  const totalOperations = results.length;
  const successfulOperations = results.filter((r) => r.success).length;
  const failedOperations = totalOperations - successfulOperations;
  const executionTimes = results.map((r) => r.executionTime);

  const averageExecutionTime = executionTimes.reduce((a, b) => a + b, 0) / totalOperations;
  const maxExecutionTime = Math.max(...executionTimes);
  const minExecutionTime = Math.min(...executionTimes);
  const totalTime = endTime - startTime;
  const operationsPerSecond = totalOperations / (totalTime / 1000);
  const memoryUsage = memoryAfter - memoryBefore;
  const cacheHitRate = cacheHits / totalOperations;
  const errorRate = failedOperations / totalOperations;

  return {
    totalOperations,
    successfulOperations,
    failedOperations,
    averageExecutionTime,
    maxExecutionTime,
    minExecutionTime,
    operationsPerSecond,
    memoryUsage,
    cacheHitRate,
    errorRate,
  };
};

describe('Matrix Service Load Testing', () => {
  let serviceContainer: MatrixServiceContainer;
  let integrationService: MatrixIntegrationService;

  beforeEach(() => {
    logger.init('Setting up load test environment');

    serviceContainer = new MatrixServiceContainer({
      enableTelemetry: true,
      enableValidation: true,
      enableConfigManager: true,
      autoStartServices: true,
    });

    integrationService = new MatrixIntegrationService(serviceContainer);
  });

  afterEach(async () => {
    logger.end('Cleaning up load test environment');
    await integrationService.shutdown();
  });

  describe('Light Load Testing', () => {
    it(
      'should handle light load operations efficiently',
      async () => {
        logger.debug('[DEBUG][MatrixServiceLoadTest] Running light load test');

        const config = LOAD_TEST_CONFIG.light;
        const results: Array<{ success: boolean; executionTime: number }> = [];
        const memoryBefore = measureMemoryUsage();
        const startTime = Date.now();

        // Perform sequential operations
        for (let i = 0; i < config.operationCount; i++) {
          const matrix4 = createTestMatrix4();
          const operationStart = Date.now();

          try {
            const result = await integrationService.convertMatrix4ToMLMatrix(matrix4, {
              useValidation: true,
              useTelemetry: true,
            });

            const executionTime = Date.now() - operationStart;
            results.push({ success: result.success, executionTime });

            if (result.success) {
              // Perform additional operation to test chaining
              await integrationService.performRobustInversion(result.data.result);
            }
          } catch (_err) {
            const executionTime = Date.now() - operationStart;
            results.push({ success: false, executionTime });
          }
        }

        const endTime = Date.now();
        const memoryAfter = measureMemoryUsage();
        const _cacheService = serviceContainer.getCacheService();
        // const cacheStats = cacheService.getStatistics();

        const metrics = calculateMetrics(
          results,
          startTime,
          endTime,
          memoryBefore,
          memoryAfter,
          0 // cacheStats.hits
        );

        logger.debug('[DEBUG][MatrixServiceLoadTest] Light load metrics:', metrics);

        // Validate performance requirements
        expect(metrics.errorRate).toBeLessThan(0.01); // <1% error rate
        expect(metrics.averageExecutionTime).toBeLessThan(50); // <50ms average
        expect(metrics.operationsPerSecond).toBeGreaterThan(10); // >10 ops/sec
        expect(metrics.successfulOperations).toBeGreaterThan(config.operationCount * 0.99);
      },
      LOAD_TEST_CONFIG.light.timeoutMs
    );

    it(
      'should maintain cache efficiency under light load',
      async () => {
        logger.debug('[DEBUG][MatrixServiceLoadTest] Testing cache efficiency under light load');

        const config = LOAD_TEST_CONFIG.light;
        const testMatrix = createTestMatrix4();

        // Perform repeated operations with same matrix to test caching
        for (let i = 0; i < config.operationCount; i++) {
          await integrationService.convertMatrix4ToMLMatrix(testMatrix, {
            useValidation: true,
            useTelemetry: true,
          });
        }

        const cacheService = serviceContainer.getCacheService();
        const cacheStats = cacheService.getStats();

        // Cache hit rate should be high for repeated operations
        const hitRate = cacheStats.cacheHitRate;
        expect(hitRate).toBeGreaterThan(0.8); // >80% cache hit rate

        logger.debug('[DEBUG][MatrixServiceLoadTest] Cache hit rate:', hitRate);
      },
      LOAD_TEST_CONFIG.light.timeoutMs
    );
  });

  describe('Medium Load Testing', () => {
    it(
      'should handle medium load with acceptable performance',
      async () => {
        logger.debug('[DEBUG][MatrixServiceLoadTest] Running medium load test');

        const config = LOAD_TEST_CONFIG.medium;
        const results: Array<{ success: boolean; executionTime: number }> = [];
        const memoryBefore = measureMemoryUsage();
        const startTime = Date.now();

        // Perform operations with larger matrices
        for (let i = 0; i < config.operationCount; i++) {
          const matrix = createTestMatrix(config.matrixSize);
          const operationStart = Date.now();

          try {
            const validationService = serviceContainer.getValidationService();
            if (!validationService) {
              throw new Error('Validation service not available');
            }
            const result = await validationService.validateMatrix(matrix, {
              useCache: true,
              tolerance: 1e-10,
            });

            const executionTime = Date.now() - operationStart;
            results.push({ success: result.success, executionTime });
          } catch (_err) {
            const executionTime = Date.now() - operationStart;
            results.push({ success: false, executionTime });
          }
        }

        const endTime = Date.now();
        const memoryAfter = measureMemoryUsage();
        const _cacheService = serviceContainer.getCacheService();
        // const cacheStats = cacheService.getStatistics();

        const metrics = calculateMetrics(
          results,
          startTime,
          endTime,
          memoryBefore,
          memoryAfter,
          0 // cacheStats.hits
        );

        logger.debug('[DEBUG][MatrixServiceLoadTest] Medium load metrics:', metrics);

        // Validate performance requirements for medium load
        expect(metrics.errorRate).toBeLessThan(0.05); // <5% error rate
        expect(metrics.averageExecutionTime).toBeLessThan(100); // <100ms average
        expect(metrics.operationsPerSecond).toBeGreaterThan(5); // >5 ops/sec
        expect(metrics.successfulOperations).toBeGreaterThan(config.operationCount * 0.95);
      },
      LOAD_TEST_CONFIG.medium.timeoutMs
    );
  });

  describe('Heavy Load Testing', () => {
    it(
      'should maintain stability under heavy load',
      async () => {
        logger.debug('[DEBUG][MatrixServiceLoadTest] Running heavy load test');

        const config = LOAD_TEST_CONFIG.heavy;
        const results: Array<{ success: boolean; executionTime: number }> = [];
        const memoryBefore = measureMemoryUsage();
        const startTime = Date.now();

        // Perform intensive operations
        for (let i = 0; i < config.operationCount; i++) {
          const matrix = createTestMatrix(config.matrixSize);
          const operationStart = Date.now();

          try {
            // Perform multiple chained operations
            const conversionService = serviceContainer.getConversionService();
            const result1 = await conversionService.convertMLMatrixToMatrix4(matrix, {
              useCache: true,
              validateInput: true,
            });

            if (result1.success) {
              const result2 = await integrationService.convertMatrix4ToMLMatrix(
                result1.data.result,
                {
                  useValidation: true,
                  useTelemetry: true,
                }
              );

              const executionTime = Date.now() - operationStart;
              results.push({ success: result2.success, executionTime });
            } else {
              const executionTime = Date.now() - operationStart;
              results.push({ success: false, executionTime });
            }
          } catch (_err) {
            const executionTime = Date.now() - operationStart;
            results.push({ success: false, executionTime });
          }
        }

        const endTime = Date.now();
        const memoryAfter = measureMemoryUsage();
        const _cacheService = serviceContainer.getCacheService();
        // const cacheStats = cacheService.getStatistics();

        const metrics = calculateMetrics(
          results,
          startTime,
          endTime,
          memoryBefore,
          memoryAfter,
          0 // cacheStats.hits
        );

        logger.debug('[DEBUG][MatrixServiceLoadTest] Heavy load metrics:', metrics);

        // Validate performance requirements for heavy load
        expect(metrics.errorRate).toBeLessThan(0.1); // <10% error rate
        expect(metrics.averageExecutionTime).toBeLessThan(200); // <200ms average
        expect(metrics.operationsPerSecond).toBeGreaterThan(2); // >2 ops/sec
        expect(metrics.successfulOperations).toBeGreaterThan(config.operationCount * 0.9);

        // Validate service health after heavy load
        const healthStatus = await integrationService.getHealthStatus();
        expect(healthStatus.overall).toMatch(/^(healthy|degraded)$/); // Should not be completely unhealthy
      },
      LOAD_TEST_CONFIG.heavy.timeoutMs
    );
  });

  describe('Memory Management Under Load', () => {
    it(
      'should manage memory efficiently during sustained operations',
      async () => {
        logger.debug('[DEBUG][MatrixServiceLoadTest] Testing memory management under load');

        const config = LOAD_TEST_CONFIG.medium;
        const memorySnapshots: number[] = [];

        // Take initial memory snapshot
        memorySnapshots.push(measureMemoryUsage());

        // Perform sustained operations
        for (let batch = 0; batch < 5; batch++) {
          for (let i = 0; i < config.operationCount / 5; i++) {
            const matrix = createTestMatrix(config.matrixSize);
            await integrationService.convertMatrix4ToMLMatrix(
              new Matrix4().fromArray(matrix.to1DArray().slice(0, 16)),
              { useValidation: false, useTelemetry: false }
            );
          }

          // Force garbage collection if available
          if (global.gc) {
            global.gc();
          }

          // Take memory snapshot
          memorySnapshots.push(measureMemoryUsage());
        }

        logger.debug('[DEBUG][MatrixServiceLoadTest] Memory snapshots:', memorySnapshots);

        // Memory should not grow unbounded
        const initialMemory = memorySnapshots[0] ?? 0;
        const finalMemory = memorySnapshots[memorySnapshots.length - 1] ?? 0;
        const memoryGrowth = finalMemory - initialMemory;

        // Memory growth should be reasonable (less than 50MB for this test)
        expect(memoryGrowth).toBeLessThan(50 * 1024 * 1024);

        // Memory should not continuously increase
        const lastThreeSnapshots = memorySnapshots.slice(-3);
        const isMemoryStabilizing = lastThreeSnapshots.every((snapshot, index) => {
          if (index === 0) return true;
          return Math.abs(snapshot - (lastThreeSnapshots[index - 1] ?? 0)) < 10 * 1024 * 1024; // <10MB variance
        });

        expect(isMemoryStabilizing).toBe(true);
      },
      LOAD_TEST_CONFIG.medium.timeoutMs
    );
  });

  describe('Service Health Under Load', () => {
    it(
      'should maintain service health during load testing',
      async () => {
        logger.debug('[DEBUG][MatrixServiceLoadTest] Testing service health under load');

        const config = LOAD_TEST_CONFIG.medium;

        // Get initial health status
        const initialHealth = await integrationService.getHealthStatus();
        expect(initialHealth.overall).toBe('healthy');

        // Perform load operations
        const operations = [];
        for (let i = 0; i < config.operationCount; i++) {
          const matrix4 = createTestMatrix4();
          operations.push(
            integrationService.convertMatrix4ToMLMatrix(matrix4, {
              useValidation: true,
              useTelemetry: true,
            })
          );
        }

        // Execute operations in batches to avoid overwhelming the system
        const batchSize = 50;
        for (let i = 0; i < operations.length; i += batchSize) {
          const batch = operations.slice(i, i + batchSize);
          await Promise.allSettled(batch);

          // Check health periodically
          const healthStatus = await integrationService.getHealthStatus();
          expect(healthStatus.overall).toMatch(/^(healthy|degraded)$/);
        }

        // Final health check
        const finalHealth = await integrationService.getHealthStatus();
        logger.debug('[DEBUG][MatrixServiceLoadTest] Final health status:', finalHealth);

        // Services should still be functional
        expect(finalHealth.services.length).toBeGreaterThan(0);
        expect(finalHealth.services.every((s) => s.healthy)).toBe(true);
      },
      LOAD_TEST_CONFIG.medium.timeoutMs
    );
  });
});
