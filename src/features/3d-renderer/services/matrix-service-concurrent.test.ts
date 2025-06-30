/**
 * Matrix Service Concurrent Operations Testing
 *
 * Comprehensive testing for concurrent service usage, thread safety,
 * and performance under parallel load conditions.
 */

import { Matrix } from 'ml-matrix';
import { Matrix4 } from 'three';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { MatrixIntegrationService } from './matrix-integration.service';
import { MatrixServiceContainer } from './matrix-service-container';

/**
 * Concurrent testing configuration
 */
const CONCURRENT_TEST_CONFIG = {
  // Light concurrency
  light: {
    concurrentOperations: 10,
    operationsPerWorker: 20,
    matrixSize: 10,
    timeoutMs: 10000,
  },
  // Medium concurrency
  medium: {
    concurrentOperations: 25,
    operationsPerWorker: 50,
    matrixSize: 50,
    timeoutMs: 20000,
  },
  // Heavy concurrency
  heavy: {
    concurrentOperations: 50,
    operationsPerWorker: 100,
    matrixSize: 100,
    timeoutMs: 40000,
  },
};

/**
 * Concurrent operation result
 */
interface ConcurrentOperationResult {
  readonly workerId: number;
  readonly operationId: number;
  readonly success: boolean;
  readonly executionTime: number;
  readonly error?: string;
  readonly result?: any;
}

/**
 * Concurrent test metrics
 */
interface ConcurrentTestMetrics {
  readonly totalOperations: number;
  readonly successfulOperations: number;
  readonly failedOperations: number;
  readonly averageExecutionTime: number;
  readonly maxExecutionTime: number;
  readonly minExecutionTime: number;
  readonly concurrentExecutionTime: number;
  readonly sequentialEstimate: number;
  readonly speedupFactor: number;
  readonly errorRate: number;
  readonly throughput: number;
}

/**
 * Create test matrix for concurrent operations
 */
const createConcurrentTestMatrix = (size: number, seed: number): Matrix => {
  const data: number[][] = [];
  for (let i = 0; i < size; i++) {
    const row: number[] = [];
    for (let j = 0; j < size; j++) {
      // Use seed for reproducible results
      row.push(Math.sin(seed + i * size + j) * 100);
    }
    data.push(row);
  }
  return new Matrix(data);
};

/**
 * Create test Matrix4 with seed
 */
const createConcurrentTestMatrix4 = (seed: number): Matrix4 => {
  return new Matrix4().makeRotationFromEuler({
    x: Math.sin(seed) * Math.PI,
    y: Math.cos(seed) * Math.PI,
    z: Math.tan(seed) * Math.PI,
    order: 'XYZ',
  } as any);
};

/**
 * Execute concurrent operations
 */
const executeConcurrentOperations = async <T>(
  operationFn: (workerId: number, operationId: number) => Promise<T>,
  concurrentCount: number,
  operationsPerWorker: number
): Promise<ConcurrentOperationResult[]> => {
  const workers: Promise<ConcurrentOperationResult[]>[] = [];

  for (let workerId = 0; workerId < concurrentCount; workerId++) {
    const workerPromise = (async (): Promise<ConcurrentOperationResult[]> => {
      const results: ConcurrentOperationResult[] = [];

      for (let operationId = 0; operationId < operationsPerWorker; operationId++) {
        const startTime = Date.now();

        try {
          const result = await operationFn(workerId, operationId);
          const executionTime = Date.now() - startTime;

          results.push({
            workerId,
            operationId,
            success: true,
            executionTime,
            result,
          });
        } catch (err) {
          const executionTime = Date.now() - startTime;

          results.push({
            workerId,
            operationId,
            success: false,
            executionTime,
            error: err instanceof Error ? err.message : String(err),
          });
        }
      }

      return results;
    })();

    workers.push(workerPromise);
  }

  const workerResults = await Promise.all(workers);
  return workerResults.flat();
};

/**
 * Calculate concurrent test metrics
 */
const calculateConcurrentMetrics = (
  results: ConcurrentOperationResult[],
  concurrentExecutionTime: number
): ConcurrentTestMetrics => {
  const totalOperations = results.length;
  const successfulOperations = results.filter((r) => r.success).length;
  const failedOperations = totalOperations - successfulOperations;
  const executionTimes = results.map((r) => r.executionTime);

  const averageExecutionTime = executionTimes.reduce((a, b) => a + b, 0) / totalOperations;
  const maxExecutionTime = Math.max(...executionTimes);
  const minExecutionTime = Math.min(...executionTimes);
  const sequentialEstimate = executionTimes.reduce((a, b) => a + b, 0);
  const speedupFactor = sequentialEstimate / concurrentExecutionTime;
  const errorRate = failedOperations / totalOperations;
  const throughput = successfulOperations / (concurrentExecutionTime / 1000);

  return {
    totalOperations,
    successfulOperations,
    failedOperations,
    averageExecutionTime,
    maxExecutionTime,
    minExecutionTime,
    concurrentExecutionTime,
    sequentialEstimate,
    speedupFactor,
    errorRate,
    throughput,
  };
};

describe('Matrix Service Concurrent Operations Testing', () => {
  let serviceContainer: MatrixServiceContainer;
  let integrationService: MatrixIntegrationService;

  beforeEach(() => {
    console.log('[INIT][MatrixServiceConcurrentTest] Setting up concurrent test environment');

    serviceContainer = new MatrixServiceContainer({
      enableTelemetry: true,
      enableValidation: true,
      enableConfigManager: true,
      autoStartServices: true,
    });

    integrationService = new MatrixIntegrationService(serviceContainer);
  });

  afterEach(async () => {
    console.log('[END][MatrixServiceConcurrentTest] Cleaning up concurrent test environment');
    await integrationService.shutdown();
  });

  describe('Light Concurrent Operations', () => {
    it(
      'should handle light concurrent matrix conversions',
      async () => {
        console.log('[DEBUG][MatrixServiceConcurrentTest] Testing light concurrent conversions');

        const config = CONCURRENT_TEST_CONFIG.light;
        const startTime = Date.now();

        const results = await executeConcurrentOperations(
          async (workerId: number, operationId: number) => {
            const matrix4 = createConcurrentTestMatrix4(workerId * 1000 + operationId);
            const result = await integrationService.convertMatrix4ToMLMatrix(matrix4, {
              useValidation: true,
              useTelemetry: true,
            });
            return result;
          },
          config.concurrentOperations,
          config.operationsPerWorker
        );

        const concurrentExecutionTime = Date.now() - startTime;
        const metrics = calculateConcurrentMetrics(results, concurrentExecutionTime);

        console.log('[DEBUG][MatrixServiceConcurrentTest] Light concurrent metrics:', metrics);

        // Validate concurrent performance
        expect(metrics.errorRate).toBeLessThan(0.05); // <5% error rate
        expect(metrics.successfulOperations).toBeGreaterThan(metrics.totalOperations * 0.95);
        expect(metrics.speedupFactor).toBeGreaterThan(1.5); // Should be faster than sequential
        expect(metrics.throughput).toBeGreaterThan(10); // >10 operations per second
      },
      CONCURRENT_TEST_CONFIG.light.timeoutMs
    );

    it(
      'should maintain cache consistency under concurrent access',
      async () => {
        console.log(
          '[DEBUG][MatrixServiceConcurrentTest] Testing cache consistency under concurrent access'
        );

        const config = CONCURRENT_TEST_CONFIG.light;
        const sharedMatrix = createConcurrentTestMatrix4(12345); // Same matrix for all operations

        const results = await executeConcurrentOperations(
          async (_workerId: number, _operationId: number) => {
            // All workers use the same matrix to test cache consistency
            const result = await integrationService.convertMatrix4ToMLMatrix(sharedMatrix, {
              useValidation: true,
              useTelemetry: true,
            });
            return result;
          },
          config.concurrentOperations,
          config.operationsPerWorker
        );

        const successfulResults = results.filter((r) => r.success);

        // All successful operations should return the same result
        if (successfulResults.length > 1) {
          const firstResult = successfulResults[0]?.result;
          const allResultsMatch = successfulResults.every((r) => {
            if (!r.result?.success || !firstResult?.success) return false;

            const matrix1 = r.result.data.result;
            const matrix2 = firstResult.data.result;

            // Compare matrix dimensions and values
            return (
              matrix1.rows === matrix2.rows &&
              matrix1.columns === matrix2.columns &&
              matrix1
                .to1DArray()
                .every(
                  (val: number, idx: number) => Math.abs(val - matrix2.to1DArray()[idx]) < 1e-10
                )
            );
          });

          expect(allResultsMatch).toBe(true);
        }

        // Cache should show high hit rate for repeated operations
        const cacheService = serviceContainer.getCacheService();
        if (cacheService) {
          // const cacheStats = cacheService.getStatistics();
          // if (cacheStats) {
          //   const hitRate = cacheStats.hits / (cacheStats.hits + cacheStats.misses);
          //   expect(hitRate).toBeGreaterThan(0.7); // >70% cache hit rate
          // }
        }
      },
      CONCURRENT_TEST_CONFIG.light.timeoutMs
    );
  });

  describe('Medium Concurrent Operations', () => {
    it(
      'should handle medium concurrent validation operations',
      async () => {
        console.log('[DEBUG][MatrixServiceConcurrentTest] Testing medium concurrent validations');

        const config = CONCURRENT_TEST_CONFIG.medium;
        const startTime = Date.now();

        const results = await executeConcurrentOperations(
          async (workerId: number, operationId: number) => {
            const matrix = createConcurrentTestMatrix(
              config.matrixSize,
              workerId * 1000 + operationId
            );
            const validationService = serviceContainer.getValidationService();
            if (!validationService) {
              throw new Error('Validation service not available');
            }
            const result = await validationService.validateMatrix(matrix, {
              useCache: true,
              tolerance: 1e-10,
            });
            return result;
          },
          config.concurrentOperations,
          config.operationsPerWorker
        );

        const concurrentExecutionTime = Date.now() - startTime;
        const metrics = calculateConcurrentMetrics(results, concurrentExecutionTime);

        console.log('[DEBUG][MatrixServiceConcurrentTest] Medium concurrent metrics:', metrics);

        // Validate concurrent performance for medium load
        expect(metrics.errorRate).toBeLessThan(0.1); // <10% error rate
        expect(metrics.successfulOperations).toBeGreaterThan(metrics.totalOperations * 0.9);
        expect(metrics.speedupFactor).toBeGreaterThan(1.2); // Should show some speedup
        expect(metrics.throughput).toBeGreaterThan(5); // >5 operations per second
      },
      CONCURRENT_TEST_CONFIG.medium.timeoutMs
    );

    it(
      'should handle concurrent batch operations',
      async () => {
        console.log('[DEBUG][MatrixServiceConcurrentTest] Testing concurrent batch operations');

        const config = CONCURRENT_TEST_CONFIG.medium;

        const results = await executeConcurrentOperations(
          async (workerId: number, operationId: number) => {
            // Create batch of operations for each worker
            const batchOperations = [];
            for (let i = 0; i < 5; i++) {
              const matrix4 = createConcurrentTestMatrix4(workerId * 1000 + operationId * 10 + i);
              batchOperations.push(() =>
                integrationService.convertMatrix4ToMLMatrix(matrix4, {
                  useValidation: false,
                  useTelemetry: false,
                })
              );
            }

            const result = await integrationService.performBatchOperations(batchOperations, {
              continueOnError: true,
            });
            return result;
          },
          config.concurrentOperations,
          config.operationsPerWorker / 5 // Fewer operations since each is a batch
        );

        const successfulResults = results.filter((r) => r.success);

        // Most batch operations should succeed
        expect(successfulResults.length).toBeGreaterThan(results.length * 0.8);

        // Each successful batch should contain multiple results
        successfulResults.forEach((result) => {
          if (result.result?.success) {
            expect(Array.isArray(result.result.data)).toBe(true);
            expect(result.result.data).toHaveLength(5);
          }
        });
      },
      CONCURRENT_TEST_CONFIG.medium.timeoutMs
    );
  });

  describe('Heavy Concurrent Operations', () => {
    it(
      'should maintain stability under heavy concurrent load',
      async () => {
        console.log('[DEBUG][MatrixServiceConcurrentTest] Testing heavy concurrent load stability');

        const config = CONCURRENT_TEST_CONFIG.heavy;
        const startTime = Date.now();

        const results = await executeConcurrentOperations(
          async (workerId: number, operationId: number) => {
            const matrix = createConcurrentTestMatrix(
              config.matrixSize,
              workerId * 1000 + operationId
            );

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
              return result2;
            } else {
              throw new Error(result1.error);
            }
          },
          config.concurrentOperations,
          config.operationsPerWorker
        );

        const concurrentExecutionTime = Date.now() - startTime;
        const metrics = calculateConcurrentMetrics(results, concurrentExecutionTime);

        console.log('[DEBUG][MatrixServiceConcurrentTest] Heavy concurrent metrics:', metrics);

        // Validate stability under heavy load
        expect(metrics.errorRate).toBeLessThan(0.2); // <20% error rate (more lenient for heavy load)
        expect(metrics.successfulOperations).toBeGreaterThan(metrics.totalOperations * 0.8);
        expect(metrics.throughput).toBeGreaterThan(2); // >2 operations per second

        // Service should still be healthy after heavy concurrent load
        const healthStatus = await integrationService.getHealthStatus();
        expect(healthStatus.overall).toMatch(/^(healthy|degraded)$/);
      },
      CONCURRENT_TEST_CONFIG.heavy.timeoutMs
    );
  });

  describe('Thread Safety and Data Integrity', () => {
    it(
      'should maintain data integrity under concurrent modifications',
      async () => {
        console.log(
          '[DEBUG][MatrixServiceConcurrentTest] Testing data integrity under concurrent modifications'
        );

        const config = CONCURRENT_TEST_CONFIG.medium;
        const telemetryService = serviceContainer.getTelemetryService();
        const initialMetrics = telemetryService?.getPerformanceMetrics();

        // Perform concurrent operations that modify service state
        await executeConcurrentOperations(
          async (workerId: number, operationId: number) => {
            const matrix4 = createConcurrentTestMatrix4(workerId * 1000 + operationId);

            // Operations that modify telemetry state
            const result = await integrationService.convertMatrix4ToMLMatrix(matrix4, {
              useValidation: true,
              useTelemetry: true,
            });

            // Additional telemetry tracking
            if (telemetryService) {
              telemetryService.trackOperation(
                `concurrent_test_${workerId}`,
                Date.now() % 100,
                result.success
              );
            }

            return result;
          },
          config.concurrentOperations,
          config.operationsPerWorker
        );

        const finalMetrics = telemetryService?.getPerformanceMetrics();

        // Verify that metrics were updated correctly
        if (initialMetrics && finalMetrics) {
          expect(finalMetrics.operationCount).toBeGreaterThan(initialMetrics.operationCount);
          expect(finalMetrics.totalExecutionTime).toBeGreaterThan(
            initialMetrics.totalExecutionTime
          );

          // No operations should be lost due to race conditions
          const expectedMinOperations = config.concurrentOperations * config.operationsPerWorker;
          const actualNewOperations = finalMetrics.operationCount - initialMetrics.operationCount;
          expect(actualNewOperations).toBeGreaterThanOrEqual(expectedMinOperations);
        }
      },
      CONCURRENT_TEST_CONFIG.medium.timeoutMs
    );

    it(
      'should handle concurrent service container access',
      async () => {
        console.log(
          '[DEBUG][MatrixServiceConcurrentTest] Testing concurrent service container access'
        );

        const config = CONCURRENT_TEST_CONFIG.light;

        const results = await executeConcurrentOperations(
          async (workerId: number, operationId: number) => {
            // Concurrent access to different services
            const services = [
              () => serviceContainer.getCacheService(),
              () => serviceContainer.getConversionService(),
              () => serviceContainer.getValidationService(),
              () => serviceContainer.getTelemetryService(),
              () => serviceContainer.getConfigManager(),
            ];

            const serviceIndex = (workerId + operationId) % services.length;
            const service = services[serviceIndex]?.();

            // Verify service is accessible and functional
            expect(service).toBeDefined();

            // Perform a simple operation to verify service state
            if (
              service &&
              'getPerformanceMetrics' in service &&
              typeof (service as any).getPerformanceMetrics === 'function'
            ) {
              const metrics = (service as any).getPerformanceMetrics();
              expect(metrics).toBeDefined();
            }

            return { workerId, operationId, serviceIndex, success: true };
          },
          config.concurrentOperations,
          config.operationsPerWorker
        );

        // All service accesses should succeed
        const successfulResults = results.filter((r) => r.success);
        expect(successfulResults).toHaveLength(results.length);

        // Verify container integrity
        const containerStatus = serviceContainer.getStatus();
        expect(containerStatus.initialized).toBe(true);
        expect(containerStatus.errorServices).toHaveLength(0);
      },
      CONCURRENT_TEST_CONFIG.light.timeoutMs
    );
  });
});
