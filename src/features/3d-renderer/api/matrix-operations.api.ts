/**
 * Matrix Operations API
 *
 * Enhanced public API for matrix operations with clean interface,
 * dependency injection, and backward compatibility following bulletproof-react patterns.
 */

import type { Matrix } from 'ml-matrix';
import { type Matrix3, Matrix4 } from 'three';
import { createLogger } from '../../../shared/services/logger.service.js';
import type { Result } from '../../../shared/types/result.types';
import { error, success } from '../../../shared/utils/functional/result.js';
import {
  type EnhancedMatrixOptions,
  type EnhancedMatrixResult,
  MatrixIntegrationService,
} from '../services/matrix-integration.service.js';
import { matrixServiceContainer } from '../services/matrix-service-container.js';

const logger = createLogger('MatrixOperationsAPI');

/**
 * Matrix operation configuration
 */
export interface MatrixOperationConfig {
  readonly enableTelemetry?: boolean;
  readonly enableValidation?: boolean;
  readonly enableCaching?: boolean;
  readonly enableSVDFallback?: boolean;
  readonly timeoutMs?: number;
  readonly maxRetries?: number;
}

/**
 * Batch operation configuration
 */
export interface BatchOperationConfig extends MatrixOperationConfig {
  readonly continueOnError?: boolean;
  readonly maxConcurrency?: number;
  readonly progressCallback?: (completed: number, total: number) => void;
}

/**
 * Performance metrics for API operations
 */
export interface APIPerformanceMetrics {
  readonly totalOperations: number;
  readonly successfulOperations: number;
  readonly failedOperations: number;
  readonly averageExecutionTime: number;
  readonly totalExecutionTime: number;
  readonly cacheHitRate: number;
  readonly memoryUsage: number;
  readonly lastOperationTime: number;
}

/**
 * API health status
 */
export interface APIHealthStatus {
  readonly status: 'healthy' | 'degraded' | 'unhealthy';
  readonly services: Array<{
    readonly name: string;
    readonly status: 'healthy' | 'unhealthy';
    readonly lastCheck: number;
  }>;
  readonly performance: APIPerformanceMetrics;
  readonly warnings: readonly string[];
  readonly errors: readonly string[];
}

/**
 * Matrix Operations API Interface
 */
export interface MatrixOperationsAPI {
  // Core matrix operations
  convertMatrix4ToMLMatrix(
    matrix4: Matrix4,
    config?: MatrixOperationConfig
  ): Promise<Result<EnhancedMatrixResult<Matrix>, string>>;

  convertMLMatrixToMatrix4(
    matrix: Matrix,
    config?: MatrixOperationConfig
  ): Promise<Result<EnhancedMatrixResult<Matrix>, string>>;

  performRobustInversion(
    matrix: Matrix,
    config?: MatrixOperationConfig
  ): Promise<Result<EnhancedMatrixResult<Matrix>, string>>;

  computeNormalMatrix(
    modelMatrix: Matrix4,
    config?: MatrixOperationConfig
  ): Promise<Result<EnhancedMatrixResult<Matrix3>, string>>;

  // Batch operations
  performBatchConversions<T>(
    operations: Array<() => Promise<Result<EnhancedMatrixResult<T>, string>>>,
    config?: BatchOperationConfig
  ): Promise<Result<EnhancedMatrixResult<T>[], string>>;

  // Validation and analysis
  validateMatrix(
    matrix: Matrix4 | Matrix,
    config?: MatrixOperationConfig
  ): Promise<Result<unknown, string>>;

  analyzeMatrixProperties(
    matrix: Matrix4 | Matrix,
    config?: MatrixOperationConfig
  ): Promise<Result<unknown, string>>;

  // Performance and monitoring
  getPerformanceMetrics(): APIPerformanceMetrics;
  getHealthStatus(): Promise<APIHealthStatus>;
  resetMetrics(): void;

  // Configuration management
  updateConfiguration(config: Partial<MatrixOperationConfig>): Promise<Result<void, string>>;
  optimizeConfiguration(): Promise<Result<void, string>>;

  // Service management
  shutdown(): Promise<void>;
  restart(): Promise<Result<void, string>>;
}

/**
 * Default API configuration
 */
const DEFAULT_API_CONFIG: MatrixOperationConfig = {
  enableTelemetry: true,
  enableValidation: true,
  enableCaching: true,
  enableSVDFallback: true,
  timeoutMs: 10000,
  maxRetries: 3,
};

/**
 * Matrix Operations API Implementation
 */
export class MatrixOperationsAPIImpl implements MatrixOperationsAPI {
  private matrixIntegration!: MatrixIntegrationService;
  private config: MatrixOperationConfig;
  private metrics: APIPerformanceMetrics;

  constructor(config: Partial<MatrixOperationConfig> = {}) {
    logger.init('Initializing matrix operations API');

    this.config = { ...DEFAULT_API_CONFIG, ...config };
    // Use async initialization for thread-safe singleton
    MatrixIntegrationService.getInstance()
      .then((service) => {
        this.matrixIntegration = service;
      })
      .catch((error) => {
        logger.error('Failed to initialize MatrixIntegrationService:', error);
      });
    this.metrics = {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      averageExecutionTime: 0,
      totalExecutionTime: 0,
      cacheHitRate: 0,
      memoryUsage: 0,
      lastOperationTime: 0,
    };
  }

  /**
   * Track operation metrics
   */
  private trackOperation(success: boolean, executionTime: number): void {
    // Create new metrics object since properties are readonly
    this.metrics = {
      ...this.metrics,
      totalOperations: this.metrics.totalOperations + 1,
      totalExecutionTime: this.metrics.totalExecutionTime + executionTime,
      averageExecutionTime:
        (this.metrics.totalExecutionTime + executionTime) / (this.metrics.totalOperations + 1),
      lastOperationTime: Date.now(),
      successfulOperations: success
        ? this.metrics.successfulOperations + 1
        : this.metrics.successfulOperations,
      failedOperations: success ? this.metrics.failedOperations : this.metrics.failedOperations + 1,
    };
  }

  /**
   * Execute operation with metrics tracking
   */
  private async executeWithMetrics<T>(
    operation: () => Promise<Result<T, string>>,
    operationName: string
  ): Promise<Result<T, string>> {
    const startTime = Date.now();

    try {
      logger.debug(`Executing ${operationName}`);
      const result = await operation();

      const executionTime = Date.now() - startTime;
      this.trackOperation(result.success, executionTime);

      if (result.success) {
        logger.debug(`${operationName} completed successfully in ${executionTime}ms`);
      } else {
        logger.warn(`${operationName} failed: ${!result.success ? result.error : 'Unknown error'}`);
      }

      return result;
    } catch (err) {
      const executionTime = Date.now() - startTime;
      this.trackOperation(false, executionTime);

      const errorMessage = `${operationName} failed: ${err instanceof Error ? err.message : String(err)}`;
      logger.error(errorMessage);
      return error(errorMessage);
    }
  }

  /**
   * Convert Matrix4 to ml-matrix
   */
  async convertMatrix4ToMLMatrix(
    matrix4: Matrix4,
    config: MatrixOperationConfig = {}
  ): Promise<Result<EnhancedMatrixResult<Matrix>, string>> {
    const options: EnhancedMatrixOptions = {
      useValidation: config.enableValidation ?? this.config.enableValidation ?? false,
      useTelemetry: config.enableTelemetry ?? this.config.enableTelemetry ?? false,
      enableSVDFallback: config.enableSVDFallback ?? this.config.enableSVDFallback ?? false,
    };

    return this.executeWithMetrics(
      () => this.matrixIntegration.convertMatrix4ToMLMatrix(matrix4, options),
      'convertMatrix4ToMLMatrix'
    );
  }

  /**
   * Convert ml-matrix to Matrix4
   */
  async convertMLMatrixToMatrix4(
    matrix: Matrix,
    config: MatrixOperationConfig = {}
  ): Promise<Result<EnhancedMatrixResult<Matrix>, string>> {
    const options: EnhancedMatrixOptions = {
      useValidation: config.enableValidation ?? this.config.enableValidation ?? false,
      useTelemetry: config.enableTelemetry ?? this.config.enableTelemetry ?? false,
    };

    return this.executeWithMetrics(
      () => this.matrixIntegration.convertMatrix4ToMLMatrix(matrix as unknown as Matrix4, options),
      'convertMatrix4ToMLMatrix'
    );
  }

  /**
   * Perform robust matrix inversion
   */
  async performRobustInversion(
    matrix: Matrix,
    config: MatrixOperationConfig = {}
  ): Promise<Result<EnhancedMatrixResult<Matrix>, string>> {
    const options: EnhancedMatrixOptions = {
      useValidation: config.enableValidation ?? this.config.enableValidation ?? false,
      useTelemetry: config.enableTelemetry ?? this.config.enableTelemetry ?? false,
      enableSVDFallback: config.enableSVDFallback ?? this.config.enableSVDFallback ?? false,
    };

    return this.executeWithMetrics(
      () => this.matrixIntegration.performRobustInversion(matrix, options),
      'performRobustInversion'
    );
  }

  /**
   * Compute normal matrix
   */
  async computeNormalMatrix(
    modelMatrix: Matrix4,
    config: MatrixOperationConfig = {}
  ): Promise<Result<EnhancedMatrixResult<Matrix3>, string>> {
    const options: EnhancedMatrixOptions = {
      useValidation: config.enableValidation ?? this.config.enableValidation ?? false,
      useTelemetry: config.enableTelemetry ?? this.config.enableTelemetry ?? false,
      enableSVDFallback: config.enableSVDFallback ?? this.config.enableSVDFallback ?? false,
    };

    return this.executeWithMetrics(
      () => this.matrixIntegration.computeEnhancedNormalMatrix(modelMatrix, options),
      'computeNormalMatrix'
    );
  }

  /**
   * Perform batch operations
   */
  async performBatchConversions<T>(
    operations: Array<() => Promise<Result<EnhancedMatrixResult<T>, string>>>,
    config: BatchOperationConfig = {}
  ): Promise<Result<EnhancedMatrixResult<T>[], string>> {
    const options: EnhancedMatrixOptions = {
      useValidation: config.enableValidation ?? this.config.enableValidation ?? false,
      useTelemetry: config.enableTelemetry ?? this.config.enableTelemetry ?? false,
      enableSVDFallback: config.enableSVDFallback ?? this.config.enableSVDFallback ?? false,
    };

    return this.executeWithMetrics(
      () =>
        this.matrixIntegration.performBatchOperations(operations, {
          ...options,
          ...config,
        } as EnhancedMatrixOptions),
      'performBatchConversions'
    );
  }

  /**
   * Validate matrix
   */
  async validateMatrix(
    matrix: Matrix4 | Matrix,
    config: MatrixOperationConfig = {}
  ): Promise<Result<unknown, string>> {
    return this.executeWithMetrics(async () => {
      if (matrix instanceof Matrix4) {
        const conversionResult = await this.matrixIntegration.convertMatrix4ToMLMatrix(matrix, {
          useValidation: true,
          useTelemetry: config.enableTelemetry ?? this.config.enableTelemetry ?? false,
        });

        if (conversionResult.success) {
          return success(conversionResult.data.validation);
        } else {
          return error(!conversionResult.success ? conversionResult.error : 'Unknown error');
        }
      } else {
        // For ml-matrix, use validation service directly
        const validationService = matrixServiceContainer.getValidationService();
        if (!validationService) {
          return {
            success: false,
            error: 'Validation service not available',
          } as const;
        }
        return validationService.validateMatrix(matrix);
      }
    }, 'validateMatrix');
  }

  /**
   * Analyze matrix properties
   */
  async analyzeMatrixProperties(
    matrix: Matrix4 | Matrix,
    _config: MatrixOperationConfig = {}
  ): Promise<Result<unknown, string>> {
    return this.executeWithMetrics(async () => {
      const validationService = matrixServiceContainer.getValidationService();

      if (validationService === null) {
        return {
          success: false,
          error: 'Validation service not available',
        } as const;
      }

      // validateMatrix expects Matrix type, not Matrix4
      if (matrix instanceof Matrix4) {
        // Convert Matrix4 to Matrix format for validation
        const conversionResult = await this.matrixIntegration.convertMatrix4ToMLMatrix(matrix, {
          useValidation: false,
          useTelemetry: false,
        });

        if (conversionResult.success) {
          return validationService.validateMatrix(conversionResult.data.result);
        } else {
          return {
            success: false,
            error: !conversionResult.success ? conversionResult.error : 'Unknown error',
          } as const;
        }
      } else {
        return validationService.validateMatrix(matrix);
      }
    }, 'analyzeMatrixProperties');
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): APIPerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Get health status
   */
  async getHealthStatus(): Promise<APIHealthStatus> {
    try {
      const serviceHealth = await this.matrixIntegration.getHealthStatus();

      return {
        status: serviceHealth.overall === 'healthy' ? 'healthy' : 'degraded',
        services: serviceHealth.services.map((service) => ({
          name: service.service,
          status: service.healthy ? 'healthy' : 'unhealthy',
          lastCheck: Date.now(),
        })),
        performance: this.metrics,
        warnings: serviceHealth.recommendations || [],
        errors: [],
      };
    } catch (err) {
      return {
        status: 'unhealthy',
        services: [],
        performance: this.metrics,
        warnings: [],
        errors: [`Health check failed: ${err instanceof Error ? err.message : String(err)}`],
      };
    }
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    logger.debug('Resetting performance metrics');

    this.metrics = {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      averageExecutionTime: 0,
      totalExecutionTime: 0,
      cacheHitRate: 0,
      memoryUsage: 0,
      lastOperationTime: 0,
    };
  }

  /**
   * Update configuration
   */
  async updateConfiguration(config: Partial<MatrixOperationConfig>): Promise<Result<void, string>> {
    try {
      logger.debug('Updating configuration:', config);

      this.config = { ...this.config, ...config };

      // Update underlying service configuration if needed
      const configResult = await this.matrixIntegration.optimizeConfiguration();

      if (configResult.success) {
        return success(undefined);
      } else {
        return error(!configResult.success ? configResult.error : 'Unknown error');
      }
    } catch (err) {
      const errorMessage = `Configuration update failed: ${err instanceof Error ? err.message : String(err)}`;
      logger.error(errorMessage);
      return error(errorMessage);
    }
  }

  /**
   * Optimize configuration
   */
  async optimizeConfiguration(): Promise<Result<void, string>> {
    return this.executeWithMetrics(
      () => this.matrixIntegration.optimizeConfiguration(),
      'optimizeConfiguration'
    );
  }

  /**
   * Shutdown API
   */
  async shutdown(): Promise<void> {
    logger.debug('Shutting down matrix operations API');

    try {
      await this.matrixIntegration.shutdown();
      logger.end('Matrix operations API shutdown complete');
    } catch (err) {
      logger.error('Shutdown error:', err);
    }
  }

  /**
   * Restart API
   */
  async restart(): Promise<Result<void, string>> {
    try {
      logger.debug('Restarting matrix operations API');

      await this.shutdown();
      // Use async initialization for thread-safe singleton
      this.matrixIntegration = await MatrixIntegrationService.getInstance();
      this.resetMetrics();

      return success(undefined);
    } catch (err) {
      const errorMessage = `API restart failed: ${err instanceof Error ? err.message : String(err)}`;
      logger.error(errorMessage);
      return error(errorMessage);
    }
  }
}

/**
 * Create matrix operations API instance
 */
export const createMatrixOperationsAPI = (
  config?: Partial<MatrixOperationConfig>
): MatrixOperationsAPI => {
  return new MatrixOperationsAPIImpl(config);
};

/**
 * Default matrix operations API instance
 */
export const matrixOperationsAPI = createMatrixOperationsAPI();
