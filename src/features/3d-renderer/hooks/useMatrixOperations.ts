/**
 * Matrix Operations Hook
 *
 * React hook for matrix operations with performance tracking, error handling,
 * and integration with the matrix service layer following bulletproof-react patterns.
 */

import type { Matrix } from 'ml-matrix';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Matrix3, Matrix4 } from 'three';
import { createLogger } from '../../../shared/services/logger.service.js';
import type { Result } from '../../../shared/types/result.types.js';
import {
  type EnhancedMatrixOptions,
  type EnhancedMatrixResult,
  MatrixIntegrationService,
} from '../services/matrix-integration.service.js';

const logger = createLogger('useMatrixOperations');

// Additional type definitions for hook interface
interface PerformanceReport {
  readonly operationCount: number;
  readonly averageExecutionTime: number;
  readonly errorRate: number;
  readonly memoryUsage: number;
  readonly totalOperations: number;
  readonly successfulOperations: number;
  readonly failedOperations: number;
  readonly totalExecutionTime: number;
  readonly cacheHitRate: number;
  readonly lastOperationTime: number;
}

interface HealthStatus {
  readonly isHealthy: boolean;
  readonly services: Record<string, boolean>;
  readonly lastCheck: number;
}

interface ServiceStatus {
  readonly initialized: boolean;
  readonly errors: readonly string[];
  readonly lastOperation: number;
  readonly overall?: 'healthy' | 'degraded' | 'unhealthy';
  readonly services?: readonly unknown[];
  readonly timestamp?: number;
  readonly recommendations?: readonly string[];
}

/**
 * Matrix operation status
 */
export type MatrixOperationStatus = 'idle' | 'loading' | 'success' | 'error';

/**
 * Matrix operation result with React state
 */
export interface MatrixOperationState<T> {
  readonly data: T | null;
  readonly status: MatrixOperationStatus;
  readonly error: string | null;
  readonly isLoading: boolean;
  readonly isSuccess: boolean;
  readonly isError: boolean;
  readonly performance?:
    | {
        readonly executionTime: number;
        readonly memoryUsed: number;
        readonly cacheHit: boolean;
      }
    | undefined;
}

/**
 * Matrix operations hook return type
 */
export interface UseMatrixOperationsReturn {
  // Matrix conversion operations
  readonly convertMatrix4ToMLMatrix: (
    matrix4: Matrix4,
    options?: EnhancedMatrixOptions
  ) => Promise<MatrixOperationState<Matrix>>;

  readonly performRobustInversion: (
    matrix: Matrix,
    options?: EnhancedMatrixOptions
  ) => Promise<MatrixOperationState<Matrix>>;

  readonly computeNormalMatrix: (
    modelMatrix: Matrix4,
    options?: EnhancedMatrixOptions
  ) => Promise<MatrixOperationState<Matrix3>>;

  // Batch operations
  readonly performBatchOperations: <T>(
    operations: Array<() => Promise<Result<EnhancedMatrixResult<T>, string>>>,
    options?: EnhancedMatrixOptions & { continueOnError?: boolean }
  ) => Promise<MatrixOperationState<EnhancedMatrixResult<T>[]>>;

  // Performance and health monitoring
  readonly getPerformanceReport: () => PerformanceReport;
  readonly getHealthStatus: () => Promise<HealthStatus | null>;
  readonly optimizeConfiguration: () => Promise<MatrixOperationState<void>>;

  // Service management
  readonly resetServices: () => Promise<void>;
  readonly isServiceHealthy: boolean;
  readonly serviceStatus: ServiceStatus | null;
}

/**
 * Create initial operation state
 */
const _createInitialState = <T>(): MatrixOperationState<T> => ({
  data: null,
  status: 'idle',
  error: null,
  isLoading: false,
  isSuccess: false,
  isError: false,
});

/**
 * Create loading state
 */
const _createLoadingState = <T>(): MatrixOperationState<T> => ({
  data: null,
  status: 'loading',
  error: null,
  isLoading: true,
  isSuccess: false,
  isError: false,
});

/**
 * Create success state
 */
const createSuccessState = <T>(
  data: T,
  performance?: {
    readonly executionTime: number;
    readonly memoryUsed: number;
    readonly cacheHit: boolean;
    readonly operationType?: string;
  }
): MatrixOperationState<T> => ({
  data,
  status: 'success',
  error: null,
  isLoading: false,
  isSuccess: true,
  isError: false,
  performance: performance
    ? {
        executionTime: performance.executionTime,
        memoryUsed: performance.memoryUsed,
        cacheHit: performance.cacheHit,
      }
    : undefined,
});

/**
 * Create error state
 */
const createErrorState = <T>(error: string): MatrixOperationState<T> => ({
  data: null,
  status: 'error',
  error,
  isLoading: false,
  isSuccess: false,
  isError: true,
});

/**
 * Matrix Operations Hook
 */
export const useMatrixOperations = (): UseMatrixOperationsReturn => {
  const matrixIntegrationRef = useRef<MatrixIntegrationService | null>(null);
  const [isServiceHealthy, setIsServiceHealthy] = useState(true);
  const [serviceStatus, setServiceStatus] = useState<ServiceStatus | null>(null);

  // Initialize matrix integration service
  useEffect(() => {
    logger.init('Initializing matrix operations hook');

    const initializeService = async () => {
      try {
        // Use async initialization for thread-safe singleton
        const integrationService = await MatrixIntegrationService.getInstance();
        matrixIntegrationRef.current = integrationService;

        // Check initial health status
        const status = await matrixIntegrationRef.current.getHealthStatus();
        setIsServiceHealthy(status.overall === 'healthy');
        setServiceStatus({
          initialized: true,
          errors: status.recommendations || [],
          lastOperation: Date.now(),
          overall: status.overall,
          services: status.services,
          timestamp: status.timestamp,
          recommendations: status.recommendations,
        });
      } catch (err) {
        logger.error('Failed to initialize matrix integration service:', err);
        setIsServiceHealthy(false);
        setServiceStatus({
          initialized: false,
          errors: [err instanceof Error ? err.message : String(err)],
          lastOperation: Date.now(),
        });
      }
    };

    initializeService();

    return () => {
      logger.end('Cleaning up matrix operations hook');
      if (matrixIntegrationRef.current) {
        matrixIntegrationRef.current.shutdown().catch((err) => {
          logger.error('Failed to shutdown matrix integration service:', err);
        });
      }
    };
  }, []);

  /**
   * Convert Matrix4 to ml-matrix with React state management
   */
  const convertMatrix4ToMLMatrix = useCallback(
    async (
      matrix4: Matrix4,
      options: EnhancedMatrixOptions = {}
    ): Promise<MatrixOperationState<Matrix>> => {
      logger.debug('Converting Matrix4 to ml-matrix');

      if (!matrixIntegrationRef.current) {
        return createErrorState('Matrix integration service not initialized');
      }

      try {
        const result = await matrixIntegrationRef.current.convertMatrix4ToMLMatrix(
          matrix4,
          options
        );

        if (result.success) {
          return createSuccessState(result.data.result, result.data.performance);
        } else {
          return createErrorState(result.error);
        }
      } catch (err) {
        const errorMessage = `Matrix conversion failed: ${err instanceof Error ? err.message : String(err)}`;
        logger.error(errorMessage);
        return createErrorState(errorMessage);
      }
    },
    []
  );

  /**
   * Perform robust matrix inversion with React state management
   */
  const performRobustInversion = useCallback(
    async (
      matrix: Matrix,
      options: EnhancedMatrixOptions = {}
    ): Promise<MatrixOperationState<Matrix>> => {
      logger.debug('Performing robust matrix inversion');

      if (!matrixIntegrationRef.current) {
        return createErrorState('Matrix integration service not initialized');
      }

      try {
        const result = await matrixIntegrationRef.current.performRobustInversion(matrix, options);

        if (result.success) {
          return createSuccessState(result.data.result, result.data.performance);
        } else {
          return createErrorState(result.error);
        }
      } catch (err) {
        const errorMessage = `Matrix inversion failed: ${err instanceof Error ? err.message : String(err)}`;
        logger.error(errorMessage);
        return createErrorState(errorMessage);
      }
    },
    []
  );

  /**
   * Compute normal matrix with React state management
   */
  const computeNormalMatrix = useCallback(
    async (
      modelMatrix: Matrix4,
      options: EnhancedMatrixOptions = {}
    ): Promise<MatrixOperationState<Matrix3>> => {
      logger.debug('Computing normal matrix');

      if (!matrixIntegrationRef.current) {
        return createErrorState('Matrix integration service not initialized');
      }

      try {
        const result = await matrixIntegrationRef.current.computeEnhancedNormalMatrix(
          modelMatrix,
          options
        );

        if (result.success) {
          return createSuccessState(result.data.result, result.data.performance);
        } else {
          return createErrorState(result.error);
        }
      } catch (err) {
        const errorMessage = `Normal matrix computation failed: ${err instanceof Error ? err.message : String(err)}`;
        logger.error(errorMessage);
        return createErrorState(errorMessage);
      }
    },
    []
  );

  /**
   * Perform batch operations with React state management
   */
  const performBatchOperations = useCallback(
    async <T>(
      operations: Array<() => Promise<Result<EnhancedMatrixResult<T>, string>>>,
      options: EnhancedMatrixOptions & { continueOnError?: boolean } = {}
    ): Promise<MatrixOperationState<EnhancedMatrixResult<T>[]>> => {
      logger.debug(`Performing batch operations (${operations.length} operations)`);

      if (!matrixIntegrationRef.current) {
        return createErrorState('Matrix integration service not initialized');
      }

      try {
        const result = await matrixIntegrationRef.current.performBatchOperations(
          operations,
          options
        );

        if (result.success) {
          return createSuccessState(result.data);
        } else {
          return createErrorState(result.error);
        }
      } catch (err) {
        const errorMessage = `Batch operations failed: ${err instanceof Error ? err.message : String(err)}`;
        logger.error(errorMessage);
        return createErrorState(errorMessage);
      }
    },
    []
  );

  /**
   * Get performance report
   */
  const getPerformanceReport = useCallback((): PerformanceReport => {
    logger.debug('Getting performance report');

    if (!matrixIntegrationRef.current) {
      return {
        operationCount: 0,
        averageExecutionTime: 0,
        errorRate: 0,
        memoryUsage: 0,
        totalOperations: 0,
        successfulOperations: 0,
        failedOperations: 0,
        totalExecutionTime: 0,
        cacheHitRate: 0,
        lastOperationTime: 0,
      };
    }

    const report = matrixIntegrationRef.current.getPerformanceReport();

    // Extract data from the service report structure with proper type assertions
    const telemetryData = (report?.telemetry as Record<string, unknown>) ?? {};
    const cacheData = (report?.cache as Record<string, unknown>) ?? {};

    return {
      operationCount: (telemetryData.operationCount as number) ?? 0,
      averageExecutionTime: (telemetryData.averageExecutionTime as number) ?? 0,
      errorRate: (telemetryData.errorRate as number) ?? 0,
      memoryUsage: (telemetryData.memoryUsage as number) ?? 0,
      totalOperations: (telemetryData.totalOperations as number) ?? 0,
      successfulOperations: (telemetryData.successfulOperations as number) ?? 0,
      failedOperations: (telemetryData.failedOperations as number) ?? 0,
      totalExecutionTime: (telemetryData.totalExecutionTime as number) ?? 0,
      cacheHitRate: (cacheData.hitRate as number) ?? 0,
      lastOperationTime: (telemetryData.lastOperationTime as number) ?? 0,
    };
  }, []);

  /**
   * Get health status
   */
  const getHealthStatus = useCallback(async () => {
    logger.debug('Getting health status');

    if (!matrixIntegrationRef.current) {
      return null;
    }

    try {
      const status = await matrixIntegrationRef.current.getHealthStatus();
      setIsServiceHealthy(status.overall === 'healthy');
      setServiceStatus({
        initialized: true,
        errors: status.recommendations || [],
        lastOperation: Date.now(),
        overall: status.overall,
        services: status.services,
        timestamp: status.timestamp,
        recommendations: status.recommendations,
      });

      // Convert ContainerHealthReport to HealthStatus
      const healthStatus: HealthStatus = {
        isHealthy: status.overall === 'healthy',
        services: status.services.reduce(
          (acc, service) => {
            acc[service.service] = service.healthy;
            return acc;
          },
          {} as Record<string, boolean>
        ),
        lastCheck: status.timestamp,
      };

      return healthStatus;
    } catch (err) {
      logger.error('Failed to get health status:', err);
      setIsServiceHealthy(false);
      return null;
    }
  }, []);

  /**
   * Optimize configuration
   */
  const optimizeConfiguration = useCallback(async (): Promise<MatrixOperationState<void>> => {
    logger.debug('Optimizing configuration');

    if (!matrixIntegrationRef.current) {
      return createErrorState('Matrix integration service not initialized');
    }

    try {
      const result = await matrixIntegrationRef.current.optimizeConfiguration();

      if (result.success) {
        return createSuccessState(undefined);
      } else {
        return createErrorState(result.error);
      }
    } catch (err) {
      const errorMessage = `Configuration optimization failed: ${err instanceof Error ? err.message : String(err)}`;
      logger.error(errorMessage);
      return createErrorState(errorMessage);
    }
  }, []);

  /**
   * Reset services
   */
  const resetServices = useCallback(async (): Promise<void> => {
    logger.debug('Resetting services');

    try {
      if (matrixIntegrationRef.current) {
        await matrixIntegrationRef.current.shutdown();
      }

      // Use async initialization for thread-safe singleton
      const integrationService = await MatrixIntegrationService.getInstance();
      matrixIntegrationRef.current = integrationService;

      // Check health after reset
      const status = await matrixIntegrationRef.current.getHealthStatus();
      setIsServiceHealthy(status.overall === 'healthy');
      setServiceStatus({
        initialized: true,
        errors: status.recommendations || [],
        lastOperation: Date.now(),
        overall: status.overall,
        services: status.services,
        timestamp: status.timestamp,
        recommendations: status.recommendations,
      });
    } catch (err) {
      logger.error('Failed to reset services:', err);
      setIsServiceHealthy(false);
    }
  }, []);

  return {
    convertMatrix4ToMLMatrix,
    performRobustInversion,
    computeNormalMatrix,
    performBatchOperations,
    getPerformanceReport,
    getHealthStatus,
    optimizeConfiguration,
    resetServices,
    isServiceHealthy,
    serviceStatus,
  };
};
