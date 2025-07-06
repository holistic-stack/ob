/**
 * Matrix Operations API
 *
 * Enhanced public API for matrix operations with clean interface,
 * dependency injection, and backward compatibility following bulletproof-react patterns.
 */

import type { mat4 } from 'gl-matrix';
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
import { Matrix } from '../types/matrix.types';

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
  convertMatrix4ToGLMatrix(
    matrix4: Matrix4,
    config?: MatrixOperationConfig
  ): Promise<Result<mat4, string>>;

  convertGLMatrixToMatrix4(
    matrix: mat4,
    config?: MatrixOperationConfig
  ): Promise<Result<Matrix4, string>>;

  performRobustInversion(
    matrix: Matrix,
    config?: MatrixOperationConfig
  ): Promise<Result<Matrix, string>>;

  computeNormalMatrix(
    modelMatrix: Matrix4,
    config?: MatrixOperationConfig
  ): Promise<Result<Matrix3, string>>;

  // Batch operations
  performBatchConversions<T>(
    operations: Array<() => Promise<Result<T, string>>>,
    config?: BatchOperationConfig
  ): Promise<Result<T[], string>>;

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
  private initializationPromise: Promise<void> | null = null;
  private isInitialized = false;
  private matrixCache = new Map<string, Matrix>();
  private readonly maxCacheSize = 50; // Limit cache size to prevent memory leaks

  constructor(config: Partial<MatrixOperationConfig> = {}) {
    logger.init('Initializing matrix operations API');

    this.config = { ...DEFAULT_API_CONFIG, ...config };
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

    // Start async initialization but don't block constructor
    this.initializationPromise = this.initializeAsync();
  }

  /**
   * Async initialization method with timeout protection
   */
  private async initializeAsync(): Promise<void> {
    try {
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Matrix service initialization timeout')), 10000);
      });

      const initPromise = MatrixIntegrationService.getInstance();

      this.matrixIntegration = await Promise.race([initPromise, timeoutPromise]);
      this.isInitialized = true;
      logger.debug('Matrix operations API initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize MatrixIntegrationService:', error);
      // Don't throw - allow API to work in degraded mode
    }
  }

  /**
   * Ensure initialization is complete before operations
   */
  private async ensureInitialized(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    if (this.initializationPromise) {
      await this.initializationPromise;
    }

    if (!this.isInitialized) {
      throw new Error('Matrix operations API not properly initialized');
    }
  }

  /**
   * Pre-allocate matrix for performance optimization
   * Following gl-matrix best practices for memory management
   */
  private createOptimizedMatrix(rows: number, cols: number, cacheKey?: string): Matrix {
    // Check cache first to reuse matrices
    if (cacheKey && this.matrixCache.has(cacheKey)) {
      const cached = this.matrixCache.get(cacheKey);
      if (cached && cached.rows === rows && cached.columns === cols) {
        // Reset matrix values to zero for reuse
        for (let i = 0; i < rows; i++) {
          for (let j = 0; j < cols; j++) {
            cached.set(i, j, 0);
          }
        }
        return cached;
      }
    }

    // Pre-allocate matrix for better performance
    const matrix = new Matrix(rows, cols);

    // Cache for reuse if cache key provided and cache not full
    if (cacheKey && this.matrixCache.size < this.maxCacheSize) {
      this.matrixCache.set(cacheKey, matrix);
    }

    return matrix;
  }

  /**
   * Clear matrix cache to prevent memory leaks
   */
  private clearMatrixCache(): void {
    this.matrixCache.clear();
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
   * Convert EnhancedMatrixResult to Result<T, string>
   */
  private convertEnhancedResult<T>(enhanced: EnhancedMatrixResult<T>): Result<T, string> {
    if (enhanced.success && enhanced.data !== undefined) {
      return success(enhanced.data);
    } else {
      return error(enhanced.error ?? 'Unknown matrix operation error');
    }
  }

  /**
   * Execute operation with metrics tracking
   */
  private async executeWithMetrics<T>(
    operation: () => Promise<Result<T, string>>,
    operationName: string
  ): Promise<Result<T, string>>;
  private async executeWithMetrics<T>(
    operation: () => Promise<EnhancedMatrixResult<T>>,
    operationName: string
  ): Promise<Result<T, string>>;
  private async executeWithMetrics<T>(
    operation: () => Promise<Result<T, string> | EnhancedMatrixResult<T>>,
    operationName: string
  ): Promise<Result<T, string>> {
    const startTime = Date.now();

    try {
      logger.debug(`Executing ${operationName}`);
      const result = await operation();

      const executionTime = Date.now() - startTime;
      this.trackOperation(result.success, executionTime);

      // Check if result is EnhancedMatrixResult or Result<T, string>
      const finalResult =
        'data' in result && 'metadata' in result
          ? this.convertEnhancedResult(result as EnhancedMatrixResult<T>)
          : (result as Result<T, string>);

      if (finalResult.success) {
        logger.debug(`${operationName} completed successfully in ${executionTime}ms`);
      } else {
        logger.warn(`${operationName} failed: ${finalResult.error}`);
      }

      return finalResult;
    } catch (err) {
      const executionTime = Date.now() - startTime;
      this.trackOperation(false, executionTime);

      const errorMessage = `${operationName} failed: ${err instanceof Error ? err.message : String(err)}`;
      logger.error(errorMessage);
      return error(errorMessage);
    }
  }

  /**
   * Convert Matrix4 to gl-matrix
   */
  async convertMatrix4ToGLMatrix(
    matrix4: Matrix4,
    config: MatrixOperationConfig = {}
  ): Promise<Result<mat4, string>> {
    await this.ensureInitialized();

    const options: EnhancedMatrixOptions = {
      useValidation: config.enableValidation ?? this.config.enableValidation ?? false,
      useTelemetry: config.enableTelemetry ?? this.config.enableTelemetry ?? false,
      enableSVDFallback: config.enableSVDFallback ?? this.config.enableSVDFallback ?? false,
    };

    return this.executeWithMetrics(
      () => this.matrixIntegration.convertMatrix4ToGLMatrix(matrix4, options),
      'convertMatrix4ToGLMatrix'
    );
  }

  /**
   * Convert gl-matrix to Matrix4
   */
  async convertGLMatrixToMatrix4(
    matrix: mat4,
    config: MatrixOperationConfig = {}
  ): Promise<Result<Matrix4, string>> {
    await this.ensureInitialized();

    const options: EnhancedMatrixOptions = {
      useValidation: config.enableValidation ?? this.config.enableValidation ?? false,
      useTelemetry: config.enableTelemetry ?? this.config.enableTelemetry ?? false,
    };

    return this.executeWithMetrics(
      () => this.matrixIntegration.convertGLMatrixToMatrix4(matrix, options),
      'convertGLMatrixToMatrix4'
    );
  }

  /**
   * Perform robust matrix inversion
   */
  async performRobustInversion(
    matrix: Matrix,
    _config: MatrixOperationConfig = {}
  ): Promise<Result<Matrix, string>> {
    await this.ensureInitialized();

    return this.executeWithMetrics(
      () => this.matrixIntegration.performRobustInversion(matrix),
      'performRobustInversion'
    );
  }

  /**
   * Compute normal matrix
   */
  async computeNormalMatrix(
    modelMatrix: Matrix4,
    config: MatrixOperationConfig = {}
  ): Promise<Result<Matrix3, string>> {
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
    operations: Array<() => Promise<Result<T, string>>>,
    config: BatchOperationConfig = {}
  ): Promise<Result<T[], string>> {
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
        const conversionResult = await this.matrixIntegration.convertMatrix4ToGLMatrix(matrix, {
          useValidation: true,
          useTelemetry: config.enableTelemetry ?? this.config.enableTelemetry ?? false,
        });

        if (conversionResult.success) {
          return success(conversionResult.data.validation);
        } else {
          return error(!conversionResult.success ? conversionResult.error : 'Unknown error');
        }
      } else {
        // For gl-matrix, use validation service directly
        if (!matrixServiceContainer) {
          return {
            success: false,
            error: 'Matrix service container not available in test environment',
          } as const;
        }

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
      // Handle test environment where matrixServiceContainer might be null
      if (!matrixServiceContainer) {
        return {
          success: false,
          error: 'Matrix service container not available in test environment',
        } as const;
      }

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
        const conversionResult = await this.matrixIntegration.convertMatrix4ToGLMatrix(matrix, {
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
      await this.ensureInitialized();
      const serviceHealth = await this.matrixIntegration.getHealthStatus();

      return {
        status: serviceHealth.overall === 'healthy' ? 'healthy' : 'degraded',
        services: serviceHealth.services.map((service: any) => ({
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
        return error(configResult.error ?? 'Unknown error');
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
      // Clear matrix cache to prevent memory leaks
      this.clearMatrixCache();

      if (this.isInitialized && this.matrixIntegration) {
        await this.matrixIntegration.shutdown();
      }

      // Reset initialization state
      this.isInitialized = false;
      this.initializationPromise = null;

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
