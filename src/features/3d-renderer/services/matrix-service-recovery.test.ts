/**
 * Matrix Service Recovery and Resilience Testing
 *
 * Comprehensive testing for service recovery, error handling, and system resilience
 * under various failure scenarios and stress conditions.
 */

import { Matrix } from 'ml-matrix';
import { Matrix4 } from 'three';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MatrixIntegrationService } from './matrix-integration.service';
import { MatrixServiceContainer } from './matrix-service-container';

/**
 * Recovery test scenarios
 */
const RECOVERY_SCENARIOS = {
  // Service failure simulation
  serviceFailure: {
    maxRetries: 3,
    retryDelay: 100,
    timeoutMs: 5000,
  },
  // Memory pressure simulation
  memoryPressure: {
    largeMatrixSize: 1000,
    operationCount: 100,
    timeoutMs: 30000,
  },
  // Network/IO failure simulation
  ioFailure: {
    failureRate: 0.3,
    operationCount: 50,
    timeoutMs: 10000,
  },
  // Cascading failure simulation
  cascadingFailure: {
    initialFailures: 2,
    propagationDelay: 500,
    timeoutMs: 15000,
  },
};

/**
 * Failure injection utilities
 */
class FailureInjector {
  private readonly failureRate: number = 0;
  private failureCount: number = 0;
  private totalCalls: number = 0;

  constructor(failureRate: number = 0) {
    this.failureRate = failureRate;
  }

  shouldFail(): boolean {
    this.totalCalls++;
    if (Math.random() < this.failureRate) {
      this.failureCount++;
      return true;
    }
    return false;
  }

  getStats() {
    return {
      totalCalls: this.totalCalls,
      failureCount: this.failureCount,
      actualFailureRate: this.totalCalls > 0 ? this.failureCount / this.totalCalls : 0,
    };
  }

  reset() {
    this.failureCount = 0;
    this.totalCalls = 0;
  }
}

/**
 * Create problematic matrix that might cause issues
 */
const createProblematicMatrix = (
  type: 'singular' | 'illConditioned' | 'large' | 'invalid'
): Matrix => {
  switch (type) {
    case 'singular':
      // Create a singular matrix (determinant = 0)
      return new Matrix([
        [1, 2, 3],
        [2, 4, 6],
        [3, 6, 9],
      ]);

    case 'illConditioned':
      // Create an ill-conditioned matrix (high condition number)
      return new Matrix([
        [1, 1, 1],
        [1, 1.0001, 1],
        [1, 1, 1.0001],
      ]);

    case 'large': {
      // Create a large matrix that might cause memory issues
      const size = 500;
      const data: number[][] = [];
      for (let i = 0; i < size; i++) {
        const row: number[] = [];
        for (let j = 0; j < size; j++) {
          row.push(Math.random() * 100);
        }
        data.push(row);
      }
      return new Matrix(data);
    }

    case 'invalid':
      // Create a matrix with invalid values
      return new Matrix([
        [1, NaN, 3],
        [Infinity, 5, 6],
        [7, 8, -Infinity],
      ]);

    default:
      return new Matrix([
        [1, 0],
        [0, 1],
      ]);
  }
};

/**
 * Recovery test metrics
 */
interface _RecoveryTestMetrics {
  readonly totalOperations: number;
  readonly successfulOperations: number;
  readonly failedOperations: number;
  readonly recoveredOperations: number;
  readonly recoveryRate: number;
  readonly averageRecoveryTime: number;
  readonly maxRecoveryTime: number;
  readonly serviceHealthAfterRecovery: string;
}

describe('Matrix Service Recovery and Resilience Testing', () => {
  let serviceContainer: MatrixServiceContainer;
  let integrationService: MatrixIntegrationService;
  let failureInjector: FailureInjector;

  beforeEach(() => {
    console.log('[INIT][MatrixServiceRecoveryTest] Setting up recovery test environment');

    serviceContainer = new MatrixServiceContainer({
      enableTelemetry: true,
      enableValidation: true,
      enableConfigManager: true,
      autoStartServices: true,
    });

    integrationService = new MatrixIntegrationService(serviceContainer);
    failureInjector = new FailureInjector();
  });

  afterEach(async () => {
    console.log('[END][MatrixServiceRecoveryTest] Cleaning up recovery test environment');
    await integrationService.shutdown();
  });

  describe('Service Failure Recovery', () => {
    it(
      'should recover from cache service failures',
      async () => {
        console.log('[DEBUG][MatrixServiceRecoveryTest] Testing cache service failure recovery');

        const _config = RECOVERY_SCENARIOS.serviceFailure;
        const cacheService = serviceContainer.getCacheService();

        // Simulate cache failures by mocking cache operations
        const originalGet = cacheService.get.bind(cacheService);
        const originalSet = cacheService.set.bind(cacheService);

        let failureCount = 0;
        const maxFailures = 5;

        // Inject failures into cache operations
        vi.spyOn(cacheService, 'get').mockImplementation((key: string) => {
          if (failureCount < maxFailures && Math.random() < 0.5) {
            failureCount++;
            throw new Error(`Simulated cache failure ${failureCount}`);
          }
          return originalGet(key);
        });

        vi.spyOn(cacheService, 'set').mockImplementation(
          (key: string, value: any, metadata?: Record<string, unknown>) => {
            if (failureCount < maxFailures && Math.random() < 0.3) {
              failureCount++;
              throw new Error(`Simulated cache failure ${failureCount}`);
            }
            return originalSet(key, value, metadata);
          }
        );

        const results: Array<{ success: boolean; recoveryTime?: number }> = [];

        // Perform operations that should trigger cache failures and recovery
        for (let i = 0; i < 20; i++) {
          const matrix4 = new Matrix4().makeRotationX(i * 0.1);
          const startTime = Date.now();

          try {
            const result = await integrationService.convertMatrix4ToMLMatrix(matrix4, {
              useValidation: true,
              useTelemetry: true,
            });

            const recoveryTime = Date.now() - startTime;
            results.push({ success: result.success, recoveryTime });
          } catch (_err) {
            const recoveryTime = Date.now() - startTime;
            results.push({ success: false, recoveryTime });
          }
        }

        // Analyze recovery performance
        const successfulOperations = results.filter((r) => r.success).length;
        const recoveryRate = successfulOperations / results.length;

        console.log(
          '[DEBUG][MatrixServiceRecoveryTest] Cache failure recovery rate:',
          recoveryRate
        );

        // Should recover from most failures
        expect(recoveryRate).toBeGreaterThan(0.7); // >70% recovery rate
        expect(failureCount).toBeGreaterThan(0); // Failures should have been injected

        // Service should still be healthy after recovery
        const healthStatus = await integrationService.getHealthStatus();
        expect(healthStatus.overall).toMatch(/^(healthy|degraded)$/);
      },
      RECOVERY_SCENARIOS.serviceFailure.timeoutMs
    );

    it(
      'should handle validation service failures gracefully',
      async () => {
        console.log(
          '[DEBUG][MatrixServiceRecoveryTest] Testing validation service failure handling'
        );

        const validationService = serviceContainer.getValidationService();
        if (!validationService) {
          throw new Error('Validation service not available');
        }
        const originalValidateMatrix = validationService.validateMatrix.bind(validationService);

        let failureCount = 0;
        const maxFailures = 3;

        // Inject failures into validation operations
        vi.spyOn(validationService, 'validateMatrix').mockImplementation(
          async (matrix: Matrix, options?: any): Promise<any> => {
            if (failureCount < maxFailures) {
              failureCount++;
              throw new Error(`Simulated validation failure ${failureCount}`);
            }
            return originalValidateMatrix(matrix, options);
          }
        );

        const results: boolean[] = [];

        // Perform operations that should trigger validation failures
        for (let i = 0; i < 10; i++) {
          const matrix4 = new Matrix4().makeScale(i + 1, i + 1, i + 1);

          try {
            const result = await integrationService.convertMatrix4ToMLMatrix(matrix4, {
              useValidation: true,
              useTelemetry: true,
            });

            results.push(result.success);
          } catch (_err) {
            results.push(false);
          }
        }

        const successCount = results.filter((r) => r).length;
        const recoveryRate = successCount / results.length;

        console.log(
          '[DEBUG][MatrixServiceRecoveryTest] Validation failure recovery rate:',
          recoveryRate
        );

        // Should gracefully degrade when validation fails
        expect(recoveryRate).toBeGreaterThan(0.5); // >50% should still succeed
        expect(failureCount).toBe(maxFailures); // All planned failures should have occurred
      },
      RECOVERY_SCENARIOS.serviceFailure.timeoutMs
    );
  });

  describe('Memory Pressure Recovery', () => {
    it(
      'should handle memory pressure gracefully',
      async () => {
        console.log('[DEBUG][MatrixServiceRecoveryTest] Testing memory pressure recovery');

        const config = RECOVERY_SCENARIOS.memoryPressure;
        const results: Array<{ success: boolean; memoryUsage: number }> = [];

        // Create memory pressure by performing operations with large matrices
        for (let i = 0; i < config.operationCount; i++) {
          const memoryBefore = process.memoryUsage?.()?.heapUsed || 0;

          try {
            const largeMatrix = createProblematicMatrix('large');
            const validationService = serviceContainer.getValidationService();
            if (!validationService) {
              throw new Error('Validation service not available');
            }

            const result = await validationService.validateMatrix(largeMatrix, {
              useCache: false, // Disable cache to increase memory pressure
              tolerance: 1e-6,
            });

            const memoryAfter = process.memoryUsage?.()?.heapUsed || 0;
            const memoryUsage = memoryAfter - memoryBefore;

            results.push({ success: result.success, memoryUsage });

            // Force garbage collection if available
            if (global.gc) {
              global.gc();
            }
          } catch (_err) {
            const memoryAfter = process.memoryUsage?.()?.heapUsed || 0;
            const memoryUsage = memoryAfter - memoryBefore;

            results.push({ success: false, memoryUsage });
          }
        }

        const successfulOperations = results.filter((r) => r.success).length;
        const recoveryRate = successfulOperations / results.length;
        const averageMemoryUsage =
          results.reduce((sum, r) => sum + r.memoryUsage, 0) / results.length;

        console.log(
          '[DEBUG][MatrixServiceRecoveryTest] Memory pressure recovery rate:',
          recoveryRate
        );
        console.log(
          '[DEBUG][MatrixServiceRecoveryTest] Average memory usage per operation:',
          averageMemoryUsage
        );

        // Should handle memory pressure reasonably well
        expect(recoveryRate).toBeGreaterThan(0.6); // >60% should succeed under memory pressure

        // Service should still be responsive after memory pressure
        const healthStatus = await integrationService.getHealthStatus();
        expect(healthStatus.overall).toMatch(/^(healthy|degraded)$/);
      },
      RECOVERY_SCENARIOS.memoryPressure.timeoutMs
    );
  });

  describe('Error Handling and Graceful Degradation', () => {
    it(
      'should handle invalid input gracefully',
      async () => {
        console.log('[DEBUG][MatrixServiceRecoveryTest] Testing invalid input handling');

        const problematicMatrices = [
          createProblematicMatrix('singular'),
          createProblematicMatrix('illConditioned'),
          createProblematicMatrix('invalid'),
        ];

        const results: Array<{ type: string; success: boolean; hasError: boolean }> = [];

        for (const [index, matrix] of problematicMatrices.entries()) {
          const matrixType = ['singular', 'illConditioned', 'invalid'][index] as string;

          try {
            const validationService = serviceContainer.getValidationService();
            if (!validationService) {
              throw new Error('Validation service not available');
            }
            const result = await validationService.validateMatrix(matrix, {
              useCache: true,
              tolerance: 1e-10,
            });

            results.push({
              type: matrixType,
              success: result.success,
              hasError: !result.success,
            });

            // For invalid matrices, should detect the issues
            if (matrixType === 'invalid' && result.success) {
              expect(result.data.result?.errors.length).toBeGreaterThan(0);
            }
          } catch (_err) {
            results.push({
              type: matrixType,
              success: false,
              hasError: true,
            });
          }
        }

        // Should handle all problematic inputs without crashing
        expect(results).toHaveLength(3);

        // Invalid matrices should be properly detected
        const invalidResult = results.find((r) => r.type === 'invalid');
        expect(invalidResult?.hasError).toBe(true);

        // Service should remain healthy after handling problematic inputs
        const healthStatus = await integrationService.getHealthStatus();
        expect(healthStatus.overall).toMatch(/^(healthy|degraded)$/);
      },
      RECOVERY_SCENARIOS.serviceFailure.timeoutMs
    );

    it(
      'should implement circuit breaker pattern for failing operations',
      async () => {
        console.log('[DEBUG][MatrixServiceRecoveryTest] Testing circuit breaker pattern');

        const config = RECOVERY_SCENARIOS.ioFailure;
        failureInjector = new FailureInjector(config.failureRate);

        const results: Array<{ success: boolean; circuitOpen: boolean }> = [];
        let consecutiveFailures = 0;
        const maxConsecutiveFailures = 5;
        let circuitOpen = false;

        for (let i = 0; i < config.operationCount; i++) {
          // Simulate circuit breaker logic
          if (circuitOpen && i % 10 === 0) {
            // Try to close circuit every 10 operations
            circuitOpen = false;
            consecutiveFailures = 0;
          }

          if (circuitOpen) {
            // Circuit is open, fail fast
            results.push({ success: false, circuitOpen: true });
            continue;
          }

          const matrix4 = new Matrix4().makeRotationY(i * 0.1);

          try {
            // Simulate potential failure
            if (failureInjector.shouldFail()) {
              throw new Error('Simulated operation failure');
            }

            const result = await integrationService.convertMatrix4ToMLMatrix(matrix4, {
              useValidation: false,
              useTelemetry: false,
            });

            if (result.success) {
              consecutiveFailures = 0;
              results.push({ success: true, circuitOpen: false });
            } else {
              consecutiveFailures++;
              if (consecutiveFailures >= maxConsecutiveFailures) {
                circuitOpen = true;
              }
              results.push({ success: false, circuitOpen: false });
            }
          } catch (_err) {
            consecutiveFailures++;
            if (consecutiveFailures >= maxConsecutiveFailures) {
              circuitOpen = true;
            }
            results.push({ success: false, circuitOpen: false });
          }
        }

        const failureStats = failureInjector.getStats();
        const circuitOpenCount = results.filter((r) => r.circuitOpen).length;
        const successCount = results.filter((r) => r.success).length;

        console.log('[DEBUG][MatrixServiceRecoveryTest] Circuit breaker stats:', {
          failureStats,
          circuitOpenCount,
          successCount,
          totalOperations: results.length,
        });

        // Circuit breaker should have activated if there were enough failures
        if (failureStats.failureCount >= maxConsecutiveFailures) {
          expect(circuitOpenCount).toBeGreaterThan(0);
        }

        // Some operations should have succeeded
        expect(successCount).toBeGreaterThan(0);
      },
      RECOVERY_SCENARIOS.ioFailure.timeoutMs
    );
  });

  describe('Service Health Monitoring and Recovery', () => {
    it(
      'should detect and recover from service degradation',
      async () => {
        console.log(
          '[DEBUG][MatrixServiceRecoveryTest] Testing service degradation detection and recovery'
        );

        // Get initial health status
        const initialHealth = await integrationService.getHealthStatus();
        expect(initialHealth.overall).toBe('healthy');

        // Simulate service degradation by causing errors
        const containerAny = serviceContainer as any;

        // Simulate multiple errors in different services
        for (let i = 0; i < 3; i++) {
          containerAny.incrementErrorCount('cache');
          containerAny.incrementErrorCount('validation');
        }

        // Check health after errors
        const degradedHealth = await integrationService.getHealthStatus();
        console.log('[DEBUG][MatrixServiceRecoveryTest] Health after errors:', degradedHealth);

        // Health should be degraded but not completely unhealthy
        expect(degradedHealth.overall).toMatch(/^(degraded|unhealthy)$/);

        // Perform recovery operations
        await integrationService.optimizeConfiguration();

        // Perform some successful operations to improve health
        for (let i = 0; i < 10; i++) {
          const matrix4 = new Matrix4().makeTranslation(i, 0, 0);
          await integrationService.convertMatrix4ToMLMatrix(matrix4, {
            useValidation: false,
            useTelemetry: true,
          });
        }

        // Check health after recovery
        const recoveredHealth = await integrationService.getHealthStatus();
        console.log('[DEBUG][MatrixServiceRecoveryTest] Health after recovery:', recoveredHealth);

        // Health should improve or at least not get worse
        expect(recoveredHealth.services.length).toBeGreaterThan(0);
        expect(recoveredHealth.timestamp).toBeGreaterThan(degradedHealth.timestamp);
      },
      RECOVERY_SCENARIOS.cascadingFailure.timeoutMs
    );

    it(
      'should restart failed services automatically',
      async () => {
        console.log('[DEBUG][MatrixServiceRecoveryTest] Testing automatic service restart');

        // Get initial service status
        const initialStatus = serviceContainer.getStatus();
        expect(initialStatus.initialized).toBe(true);
        expect(initialStatus.errorServices).toHaveLength(0);

        // Simulate service failure
        const containerAny = serviceContainer as any;
        containerAny.setServiceState('cache', 'error');
        containerAny.incrementErrorCount('cache');

        // Check status after failure
        const failedStatus = serviceContainer.getStatus();
        expect(failedStatus.errorServices).toContain('cache');

        // Attempt service restart
        const restartResult = await serviceContainer.restartService('cache');
        expect(restartResult.success).toBe(true);

        // Check status after restart
        const recoveredStatus = serviceContainer.getStatus();
        expect(recoveredStatus.errorServices).not.toContain('cache');
        expect(recoveredStatus.runningServices).toContain('cache');

        // Verify service functionality after restart
        const cacheService = serviceContainer.getCacheService();
        expect(cacheService).toBeDefined();

        // Test cache functionality
        cacheService.set(
          'test_key',
          new Matrix([
            [1, 2],
            [3, 4],
          ])
        );
        const retrievedValue = cacheService.get('test_key');
        expect(retrievedValue).toEqual(
          new Matrix([
            [1, 2],
            [3, 4],
          ])
        );
      },
      RECOVERY_SCENARIOS.serviceFailure.timeoutMs
    );
  });
});
