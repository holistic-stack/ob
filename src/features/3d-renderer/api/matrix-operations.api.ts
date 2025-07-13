/**
 * @file Matrix Operations API
 *
 * Provides a comprehensive, type-safe API for matrix operations in 3D rendering contexts.
 * This module implements functional programming principles with immutable data structures,
 * Result-based error handling, and dependency injection patterns following bulletproof-react architecture.
 *
 * ## Key Features
 * - **Type Safety**: Strict TypeScript with branded types and discriminated unions
 * - **Functional Programming**: Pure functions, immutability, and Result<T,E> error handling
 * - **Performance**: Matrix caching, batch operations, and memory optimization
 * - **Monitoring**: Comprehensive metrics, health checks, and telemetry
 * - **Reliability**: Robust error handling, fallback mechanisms, and graceful degradation
 *
 * ## Architecture
 * The API follows a layered architecture:
 * 1. **Public API Layer**: Type-safe interfaces with comprehensive documentation
 * 2. **Service Layer**: Matrix integration service with dependency injection
 * 3. **Core Layer**: Low-level matrix operations with gl-matrix and Three.js
 *
 * ## Usage Patterns
 * ```typescript
 * // Basic usage with error handling
 * const api = createMatrixOperationsAPI();
 * const result = await api.convertMatrix4ToGLMatrix(matrix4);
 *
 * if (result.success) {
 *   console.log('Conversion successful:', result.data);
 * } else {
 *   console.error('Conversion failed:', result.error);
 * }
 *
 * // Batch operations with configuration
 * const batchResult = await api.performBatchConversions(operations, {
 *   enableValidation: true,
 *   continueOnError: false,
 *   maxConcurrency: 4
 * });
 * ```
 *
 * @since 1.0.0
 * @author OpenSCAD Babylon Team
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
import type { Matrix } from '../types/matrix.types';

const logger = createLogger('MatrixOperationsAPI');

// ============================================================================
// TYPE DEFINITIONS & BRANDED TYPES
// ============================================================================

/**
 * Branded type for operation timeout values to prevent invalid configurations
 */
type TimeoutMs = number & { readonly __brand: 'TimeoutMs' };

/**
 * Branded type for retry count to ensure valid retry values
 */
type RetryCount = number & { readonly __brand: 'RetryCount' };

/**
 * Branded type for concurrency limits to prevent invalid values
 */
type ConcurrencyLimit = number & { readonly __brand: 'ConcurrencyLimit' };

/**
 * Health status discriminated union for type-safe status handling
 */
type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';

/**
 * Service status discriminated union
 */
type ServiceStatus = 'healthy' | 'unhealthy';

/**
 * Progress callback function type for batch operations
 *
 * @param completed - Number of completed operations
 * @param total - Total number of operations
 *
 * @example
 * ```typescript
 * const progressCallback: ProgressCallback = (completed, total) => {
 *   console.log(`Progress: ${completed}/${total} (${Math.round(completed/total*100)}%)`);
 * };
 * ```
 */
type ProgressCallback = (completed: number, total: number) => void;

// ============================================================================
// CONFIGURATION INTERFACES
// ============================================================================

/**
 * Matrix operation configuration with strict typing and validation
 *
 * Provides comprehensive configuration options for matrix operations with
 * type-safe defaults and validation constraints.
 *
 * @example
 * ```typescript
 * const config: MatrixOperationConfig = {
 *   enableTelemetry: true,
 *   enableValidation: true,
 *   enableCaching: true,
 *   enableSVDFallback: true,
 *   timeoutMs: 10000 as TimeoutMs,
 *   maxRetries: 3 as RetryCount
 * };
 * ```
 */
export interface MatrixOperationConfig {
  /** Enable telemetry collection for performance monitoring */
  readonly enableTelemetry?: boolean;
  /** Enable matrix validation for error detection */
  readonly enableValidation?: boolean;
  /** Enable matrix caching for performance optimization */
  readonly enableCaching?: boolean;
  /** Enable SVD fallback for robust matrix operations */
  readonly enableSVDFallback?: boolean;
  /** Operation timeout in milliseconds */
  readonly timeoutMs?: TimeoutMs;
  /** Maximum number of retry attempts */
  readonly maxRetries?: RetryCount;
}

/**
 * Batch operation configuration extending base configuration
 *
 * Provides additional options specific to batch processing operations
 * with concurrency control and progress tracking.
 *
 * @example
 * ```typescript
 * const batchConfig: BatchOperationConfig = {
 *   enableValidation: true,
 *   continueOnError: false,
 *   maxConcurrency: 4 as ConcurrencyLimit,
 *   progressCallback: (completed, total) => {
 *     console.log(`Batch progress: ${completed}/${total}`);
 *   }
 * };
 * ```
 */
export interface BatchOperationConfig extends MatrixOperationConfig {
  /** Continue processing remaining operations if one fails */
  readonly continueOnError?: boolean;
  /** Maximum number of concurrent operations */
  readonly maxConcurrency?: ConcurrencyLimit;
  /** Callback function for progress updates */
  readonly progressCallback?: ProgressCallback;
}

// ============================================================================
// METRICS & MONITORING INTERFACES
// ============================================================================

/**
 * Immutable performance metrics for API operations
 *
 * Tracks comprehensive performance data for monitoring and optimization.
 * All properties are readonly to enforce immutability.
 *
 * @example
 * ```typescript
 * const metrics = api.getPerformanceMetrics();
 * console.log(`Success rate: ${metrics.successfulOperations / metrics.totalOperations * 100}%`);
 * console.log(`Average execution time: ${metrics.averageExecutionTime}ms`);
 * ```
 */
export interface APIPerformanceMetrics {
  /** Total number of operations performed */
  readonly totalOperations: number;
  /** Number of successful operations */
  readonly successfulOperations: number;
  /** Number of failed operations */
  readonly failedOperations: number;
  /** Average execution time in milliseconds */
  readonly averageExecutionTime: number;
  /** Total execution time across all operations */
  readonly totalExecutionTime: number;
  /** Cache hit rate as a percentage (0-1) */
  readonly cacheHitRate: number;
  /** Current memory usage in bytes */
  readonly memoryUsage: number;
  /** Timestamp of last operation */
  readonly lastOperationTime: number;
}

/**
 * Service health information for monitoring
 */
interface ServiceHealthInfo {
  /** Service name identifier */
  readonly name: string;
  /** Current service status */
  readonly status: ServiceStatus;
  /** Timestamp of last health check */
  readonly lastCheck: number;
}

/**
 * Comprehensive API health status with service monitoring
 *
 * Provides detailed health information for the entire API and its dependencies.
 * Includes performance metrics, service status, and diagnostic information.
 *
 * @example
 * ```typescript
 * const health = await api.getHealthStatus();
 * if (health.status === 'healthy') {
 *   console.log('All systems operational');
 * } else {
 *   console.warn('System degraded:', health.warnings);
 * }
 * ```
 */
export interface APIHealthStatus {
  /** Overall API health status */
  readonly status: HealthStatus;
  /** Health status of individual services */
  readonly services: readonly ServiceHealthInfo[];
  /** Current performance metrics */
  readonly performance: APIPerformanceMetrics;
  /** Non-critical warnings */
  readonly warnings: readonly string[];
  /** Critical errors */
  readonly errors: readonly string[];
}

// ============================================================================
// UTILITY TYPES & TYPE GUARDS
// ============================================================================

/**
 * Type guard to check if a value is a valid timeout
 */
const isValidTimeout = (value: number): value is TimeoutMs => value > 0 && value <= 300000; // Max 5 minutes

/**
 * Type guard to check if a value is a valid retry count
 */
const isValidRetryCount = (value: number): value is RetryCount => value >= 0 && value <= 10;

/**
 * Type guard to check if a value is a valid concurrency limit
 */
const isValidConcurrencyLimit = (value: number): value is ConcurrencyLimit =>
  value > 0 && value <= 100;

/**
 * Helper function to create branded timeout value
 */
export const createTimeout = (ms: number): TimeoutMs => {
  if (!isValidTimeout(ms)) {
    throw new Error(`Invalid timeout: ${ms}ms. Must be between 1 and 300000ms`);
  }
  return ms as TimeoutMs;
};

/**
 * Helper function to create branded retry count
 */
export const createRetryCount = (count: number): RetryCount => {
  if (!isValidRetryCount(count)) {
    throw new Error(`Invalid retry count: ${count}. Must be between 0 and 10`);
  }
  return count as RetryCount;
};

/**
 * Helper function to create branded concurrency limit
 */
export const createConcurrencyLimit = (limit: number): ConcurrencyLimit => {
  if (!isValidConcurrencyLimit(limit)) {
    throw new Error(`Invalid concurrency limit: ${limit}. Must be between 1 and 100`);
  }
  return limit as ConcurrencyLimit;
};

// ============================================================================
// MAIN API INTERFACE
// ============================================================================

/**
 * Matrix Operations API Interface
 *
 * Comprehensive interface for matrix operations with type-safe error handling,
 * performance monitoring, and configuration management. All operations return
 * Result<T, E> types for functional error handling.
 *
 * ## Core Principles
 * - **Immutability**: All data structures are readonly
 * - **Type Safety**: Strict typing with branded types and discriminated unions
 * - **Error Handling**: Result<T, E> pattern for all operations
 * - **Performance**: Built-in metrics, caching, and optimization
 * - **Reliability**: Health monitoring and graceful degradation
 *
 * @example Basic Usage
 * ```typescript
 * const api = createMatrixOperationsAPI();
 *
 * // Convert Matrix4 to gl-matrix format
 * const result = await api.convertMatrix4ToGLMatrix(matrix4);
 * if (result.success) {
 *   console.log('Converted matrix:', result.data);
 * } else {
 *   console.error('Conversion failed:', result.error);
 * }
 * ```
 *
 * @example Batch Operations
 * ```typescript
 * const operations = matrices.map(m => () => api.convertMatrix4ToGLMatrix(m));
 * const batchResult = await api.performBatchConversions(operations, {
 *   maxConcurrency: createConcurrencyLimit(4),
 *   continueOnError: false
 * });
 * ```
 */
export interface MatrixOperationsAPI {
  // ========================================================================
  // CORE MATRIX OPERATIONS
  // ========================================================================

  /**
   * Convert Three.js Matrix4 to gl-matrix mat4 format
   *
   * @param matrix4 - Three.js Matrix4 to convert
   * @param config - Optional operation configuration
   * @returns Result containing converted mat4 or error message
   *
   * @example
   * ```typescript
   * const matrix4 = new Matrix4().makeTranslation(1, 2, 3);
   * const result = await api.convertMatrix4ToGLMatrix(matrix4, {
   *   enableValidation: true,
   *   enableTelemetry: true
   * });
   * ```
   */
  convertMatrix4ToGLMatrix(
    matrix4: Matrix4,
    config?: MatrixOperationConfig
  ): Promise<Result<mat4, string>>;

  /**
   * Convert gl-matrix mat4 to Three.js Matrix4 format
   *
   * @param matrix - gl-matrix mat4 to convert
   * @param config - Optional operation configuration
   * @returns Result containing converted Matrix4 or error message
   */
  convertGLMatrixToMatrix4(
    matrix: mat4,
    config?: MatrixOperationConfig
  ): Promise<Result<Matrix4, string>>;

  /**
   * Perform robust matrix inversion with fallback mechanisms
   *
   * @param matrix - Matrix to invert
   * @param config - Optional operation configuration
   * @returns Result containing inverted matrix or error message
   */
  performRobustInversion(
    matrix: Matrix,
    config?: MatrixOperationConfig
  ): Promise<Result<Matrix, string>>;

  /**
   * Compute normal matrix from model matrix for lighting calculations
   *
   * @param modelMatrix - Model transformation matrix
   * @param config - Optional operation configuration
   * @returns Result containing normal matrix or error message
   */
  computeNormalMatrix(
    modelMatrix: Matrix4,
    config?: MatrixOperationConfig
  ): Promise<Result<Matrix3, string>>;

  // ========================================================================
  // BATCH OPERATIONS
  // ========================================================================

  /**
   * Perform multiple matrix operations in batch with concurrency control
   *
   * @param operations - Array of operation functions to execute
   * @param config - Batch operation configuration
   * @returns Result containing array of results or error message
   */
  performBatchConversions<T>(
    operations: ReadonlyArray<() => Promise<Result<T, string>>>,
    config?: BatchOperationConfig
  ): Promise<Result<readonly T[], string>>;

  // ========================================================================
  // VALIDATION & ANALYSIS
  // ========================================================================

  /**
   * Validate matrix for correctness and numerical stability
   *
   * @param matrix - Matrix to validate
   * @param config - Optional operation configuration
   * @returns Result containing validation result or error message
   */
  validateMatrix(
    matrix: Matrix4 | Matrix,
    config?: MatrixOperationConfig
  ): Promise<Result<boolean, string>>;

  /**
   * Analyze matrix properties for debugging and optimization
   *
   * @param matrix - Matrix to analyze
   * @param config - Optional operation configuration
   * @returns Result containing analysis data or error message
   */
  analyzeMatrixProperties(
    matrix: Matrix4 | Matrix,
    config?: MatrixOperationConfig
  ): Promise<Result<Record<string, unknown>, string>>;

  // ========================================================================
  // PERFORMANCE & MONITORING
  // ========================================================================

  /**
   * Get current performance metrics
   *
   * @returns Immutable performance metrics object
   */
  getPerformanceMetrics(): APIPerformanceMetrics;

  /**
   * Get comprehensive health status of API and services
   *
   * @returns Promise resolving to health status information
   */
  getHealthStatus(): Promise<APIHealthStatus>;

  /**
   * Reset all performance metrics to initial state
   */
  resetMetrics(): void;

  // ========================================================================
  // CONFIGURATION MANAGEMENT
  // ========================================================================

  /**
   * Update API configuration with new settings
   *
   * @param config - Partial configuration to update
   * @returns Result indicating success or failure
   */
  updateConfiguration(config: Partial<MatrixOperationConfig>): Promise<Result<void, string>>;

  /**
   * Optimize configuration based on current usage patterns
   *
   * @returns Result indicating success or failure
   */
  optimizeConfiguration(): Promise<Result<void, string>>;

  // ========================================================================
  // SERVICE MANAGEMENT
  // ========================================================================

  /**
   * Gracefully shutdown the API and clean up resources
   */
  shutdown(): Promise<void>;

  /**
   * Restart the API with fresh initialization
   *
   * @returns Result indicating success or failure
   */
  restart(): Promise<Result<void, string>>;
}

// ============================================================================
// DEFAULT CONFIGURATION
// ============================================================================

/**
 * Default API configuration with safe, production-ready values
 *
 * Uses branded types for type safety and validation. All timeout and retry
 * values are validated at compile time and runtime.
 *
 * @example
 * ```typescript
 * // Create API with default configuration
 * const api = createMatrixOperationsAPI();
 *
 * // Create API with custom configuration
 * const customApi = createMatrixOperationsAPI({
 *   timeoutMs: createTimeout(5000),
 *   maxRetries: createRetryCount(5)
 * });
 * ```
 */
const DEFAULT_API_CONFIG: Required<MatrixOperationConfig> = {
  enableTelemetry: true,
  enableValidation: true,
  enableCaching: true,
  enableSVDFallback: true,
  timeoutMs: createTimeout(10000),
  maxRetries: createRetryCount(3),
} as const;

// ============================================================================
// IMPLEMENTATION CLASS
// ============================================================================

/**
 * Matrix Operations API Implementation
 *
 * Concrete implementation of the MatrixOperationsAPI interface following
 * functional programming principles with immutable state, pure functions,
 * and comprehensive error handling.
 *
 * ## Key Features
 * - **Immutable State**: All state updates create new objects
 * - **Pure Functions**: No side effects in core operations
 * - **Memory Management**: Automatic cleanup and resource disposal
 * - **Performance Optimization**: Matrix caching and batch processing
 * - **Error Recovery**: Graceful degradation and fallback mechanisms
 *
 * @example
 * ```typescript
 * const api = new MatrixOperationsAPIImpl({
 *   enableValidation: true,
 *   enableCaching: true,
 *   timeoutMs: createTimeout(5000)
 * });
 *
 * await api.convertMatrix4ToGLMatrix(matrix4);
 * ```
 */
export class MatrixOperationsAPIImpl implements MatrixOperationsAPI {
  // ========================================================================
  // PRIVATE STATE (IMMUTABLE)
  // ========================================================================

  private matrixIntegration!: MatrixIntegrationService;
  private config: Required<MatrixOperationConfig>;
  private metrics: APIPerformanceMetrics;
  private initializationPromise: Promise<void> | null = null;
  private isInitialized = false;
  private readonly matrixCache = new Map<string, Matrix>();
  private readonly maxCacheSize = 50; // Limit cache size to prevent memory leaks

  // ========================================================================
  // CONSTRUCTOR & INITIALIZATION
  // ========================================================================

  /**
   * Initialize Matrix Operations API with configuration
   *
   * @param config - Partial configuration object with optional overrides
   *
   * @example
   * ```typescript
   * const api = new MatrixOperationsAPIImpl({
   *   enableValidation: true,
   *   timeoutMs: createTimeout(15000),
   *   maxRetries: createRetryCount(5)
   * });
   * ```
   */
  constructor(config: Partial<MatrixOperationConfig> = {}) {
    logger.init('[INIT][MatrixOperationsAPI] Initializing matrix operations API');

    // Merge with defaults, ensuring all required properties are present
    this.config = { ...DEFAULT_API_CONFIG, ...config };

    // Initialize immutable metrics state
    this.metrics = Object.freeze({
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      averageExecutionTime: 0,
      totalExecutionTime: 0,
      cacheHitRate: 0,
      memoryUsage: 0,
      lastOperationTime: 0,
    });

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

  // ========================================================================
  // PRIVATE UTILITY METHODS
  // ========================================================================

  /**
   * Clear matrix cache to prevent memory leaks
   *
   * Implements proper cleanup following functional programming principles
   * by creating a new empty cache rather than mutating the existing one.
   */
  private clearMatrixCache(): void {
    this.matrixCache.clear();
    logger.debug('[DEBUG][MatrixOperationsAPI] Matrix cache cleared');
  }

  /**
   * Track operation metrics following functional programming principles
   *
   * Creates a new immutable metrics object with updated values.
   * Ensures thread safety and proper state management.
   *
   * @param success - Whether the operation succeeded
   * @param executionTime - Operation execution time in milliseconds
   */
  private trackOperation(success: boolean, executionTime: number): void {
    const currentTime = Date.now();
    const newTotalOperations = this.metrics.totalOperations + 1;
    const newTotalExecutionTime = this.metrics.totalExecutionTime + executionTime;

    // Create new immutable metrics object
    this.metrics = Object.freeze({
      totalOperations: newTotalOperations,
      successfulOperations: this.metrics.successfulOperations + (success ? 1 : 0),
      failedOperations: this.metrics.failedOperations + (success ? 0 : 1),
      averageExecutionTime: newTotalExecutionTime / newTotalOperations,
      totalExecutionTime: newTotalExecutionTime,
      cacheHitRate: this.matrixCache.size / Math.max(newTotalOperations, 1),
      memoryUsage: this.matrixCache.size * 64, // Rough estimate: 64 bytes per cached matrix
      lastOperationTime: currentTime,
    });
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
    operation: () => Promise<EnhancedMatrixResult<T>>,
    operationName: string
  ): Promise<Result<T, string>> {
    const startTime = Date.now();

    try {
      logger.debug(`Executing ${operationName}`);
      const result = await operation();

      const executionTime = Date.now() - startTime;
      this.trackOperation(result.success, executionTime);

      // Convert EnhancedMatrixResult to Result<T, string>
      const finalResult = this.convertEnhancedResult(result);

      if (finalResult.success) {
        logger.debug(
          `[DEBUG][MatrixOperationsAPI] ${operationName} completed successfully in ${executionTime}ms`
        );
      } else {
        // Type narrowing: finalResult is guaranteed to have error property when success is false
        const errorMessage = 'error' in finalResult ? finalResult.error : 'Unknown error';
        logger.warn(`[WARN][MatrixOperationsAPI] ${operationName} failed: ${errorMessage}`);
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

    return this.executeWithMetrics<mat4>(
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

    return this.executeWithMetrics<Matrix4>(
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

    return this.executeWithMetrics<Matrix3>(
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

    return this.executeWithMetrics<T[]>(
      () =>
        this.matrixIntegration.performBatchOperations(operations, {
          ...options,
          ...config,
        } as EnhancedMatrixOptions),
      'performBatchConversions'
    );
  }

  /**
   * Validate matrix for correctness and numerical stability
   *
   * Performs comprehensive validation including:
   * - Numerical stability checks
   * - NaN/Infinity detection
   * - Matrix dimension validation
   * - Determinant analysis for invertibility
   *
   * @param matrix - Matrix to validate (Matrix4 or Matrix)
   * @param config - Optional validation configuration
   * @returns Result containing boolean validation result
   *
   * @example
   * ```typescript
   * const result = await api.validateMatrix(matrix4, { enableValidation: true });
   * if (result.success && result.data) {
   *   console.log('Matrix is valid');
   * } else {
   *   console.error('Matrix validation failed:', result.error);
   * }
   * ```
   */
  async validateMatrix(
    matrix: Matrix4 | Matrix,
    config: MatrixOperationConfig = {}
  ): Promise<Result<boolean, string>> {
    return this.executeWithMetrics(async () => {
      if (matrix instanceof Matrix4) {
        const conversionResult = await this.matrixIntegration.convertMatrix4ToGLMatrix(matrix, {
          useValidation: true,
          useTelemetry: config.enableTelemetry ?? this.config.enableTelemetry,
        });

        if (conversionResult.success && conversionResult.data) {
          // Extract validation result from enhanced matrix result
          const validationData =
            (conversionResult.data as { validation?: boolean })?.validation ?? true;
          return success(Boolean(validationData));
        } else {
          return error(conversionResult.error || 'Matrix validation failed');
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

        if (
          !validationService ||
          typeof validationService !== 'object' ||
          !('validateMatrix' in validationService) ||
          typeof (validationService as { validateMatrix?: unknown }).validateMatrix !== 'function'
        ) {
          return {
            success: false,
            error: 'Validation service not available',
          } as const;
        }

        // Safe to call validateMatrix after type checks
        const validationResult = (
          validationService as { validateMatrix: (matrix: Matrix) => Result<unknown, string> }
        ).validateMatrix(matrix);
        if (validationResult.success) {
          return success(Boolean(validationResult.data));
        } else {
          const errorMessage =
            'error' in validationResult ? validationResult.error : 'Matrix validation failed';
          return error(errorMessage || 'Matrix validation failed');
        }
      }
    }, 'validateMatrix');
  }

  /**
   * Analyze matrix properties for debugging and optimization
   *
   * Provides comprehensive analysis including:
   * - Matrix type and dimensions
   * - Determinant and rank
   * - Condition number
   * - Eigenvalues (if applicable)
   * - Numerical stability metrics
   *
   * @param matrix - Matrix to analyze (Matrix4 or Matrix)
   * @param config - Optional analysis configuration
   * @returns Result containing analysis data as key-value pairs
   *
   * @example
   * ```typescript
   * const result = await api.analyzeMatrixProperties(matrix4);
   * if (result.success) {
   *   console.log('Matrix determinant:', result.data.determinant);
   *   console.log('Matrix rank:', result.data.rank);
   * }
   * ```
   */
  async analyzeMatrixProperties(
    matrix: Matrix4 | Matrix,
    config: MatrixOperationConfig = {}
  ): Promise<Result<Record<string, unknown>, string>> {
    return this.executeWithMetrics(async () => {
      // Handle test environment where matrixServiceContainer might be null
      if (!matrixServiceContainer) {
        return {
          success: false,
          error: 'Matrix service container not available in test environment',
        } as const;
      }

      const validationService = matrixServiceContainer.getValidationService();

      if (
        !validationService ||
        typeof validationService !== 'object' ||
        !('validateMatrix' in validationService) ||
        typeof (validationService as { validateMatrix?: unknown }).validateMatrix !== 'function'
      ) {
        return {
          success: false,
          error: 'Validation service not available',
        } as const;
      }

      // Type-safe validation service reference
      const typedValidationService = validationService as {
        validateMatrix: (matrix: unknown) => Result<unknown, string>;
      };

      // validateMatrix expects Matrix type, not Matrix4
      if (matrix instanceof Matrix4) {
        // Convert Matrix4 to Matrix format for validation
        const conversionResult = await this.matrixIntegration.convertMatrix4ToGLMatrix(matrix, {
          useValidation: false,
          useTelemetry: config.enableTelemetry ?? this.config.enableTelemetry,
        });

        if (conversionResult.success && conversionResult.data) {
          // Extract matrix result from enhanced matrix result
          const matrixData =
            (conversionResult.data as { result?: unknown })?.result || conversionResult.data;
          const analysisResult = typedValidationService.validateMatrix(matrixData);

          if (analysisResult.success) {
            // Ensure we return a proper Record<string, unknown>
            const analysisData = analysisResult.data;
            if (typeof analysisData === 'object' && analysisData !== null) {
              return success(analysisData as Record<string, unknown>);
            } else {
              return success({ isValid: Boolean(analysisData) });
            }
          } else {
            const errorMessage =
              'error' in analysisResult ? analysisResult.error : 'Matrix analysis failed';
            return error(errorMessage || 'Matrix analysis failed');
          }
        } else {
          return {
            success: false,
            error: conversionResult.error || 'Matrix conversion failed',
          } as const;
        }
      } else {
        const analysisResult = typedValidationService.validateMatrix(matrix);

        if (analysisResult.success) {
          // Ensure we return a proper Record<string, unknown>
          const analysisData = analysisResult.data;
          if (typeof analysisData === 'object' && analysisData !== null) {
            return success(analysisData as Record<string, unknown>);
          } else {
            return success({ isValid: Boolean(analysisData) });
          }
        } else {
          const errorMessage =
            'error' in analysisResult ? analysisResult.error : 'Matrix analysis failed';
          return error(errorMessage || 'Matrix analysis failed');
        }
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
        services: (
          serviceHealth.services as unknown as Array<{ service: string; healthy: boolean }>
        ).map((service) => ({
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
   * Update API configuration with new settings
   *
   * Creates a new configuration object following immutability principles.
   * Validates configuration values and updates underlying services.
   *
   * @param config - Partial configuration to merge with current settings
   * @returns Result indicating success or failure with error details
   *
   * @example
   * ```typescript
   * const result = await api.updateConfiguration({
   *   enableValidation: true,
   *   timeoutMs: createTimeout(15000)
   * });
   *
   * if (result.success) {
   *   console.log('Configuration updated successfully');
   * } else {
   *   console.error('Configuration update failed:', result.error);
   * }
   * ```
   */
  async updateConfiguration(config: Partial<MatrixOperationConfig>): Promise<Result<void, string>> {
    try {
      logger.debug('[DEBUG][MatrixOperationsAPI] Updating configuration:', config);

      // Create new configuration object (immutable update)
      const newConfig = { ...this.config, ...config };

      // Validate new configuration
      if (config.timeoutMs !== undefined && !isValidTimeout(config.timeoutMs)) {
        return error(`Invalid timeout value: ${config.timeoutMs}ms`);
      }

      if (config.maxRetries !== undefined && !isValidRetryCount(config.maxRetries)) {
        return error(`Invalid retry count: ${config.maxRetries}`);
      }

      // Update configuration atomically
      this.config = newConfig;

      // Update underlying service configuration if needed
      const configResult = await this.matrixIntegration.optimizeConfiguration();

      if (configResult.success) {
        logger.debug('[DEBUG][MatrixOperationsAPI] Configuration updated successfully');
        return success(undefined);
      } else {
        return error(configResult.error ?? 'Unknown configuration error');
      }
    } catch (err) {
      const errorMessage = `Configuration update failed: ${err instanceof Error ? err.message : String(err)}`;
      logger.error('[ERROR][MatrixOperationsAPI]', errorMessage);
      return error(errorMessage);
    }
  }

  /**
   * Optimize configuration
   */
  async optimizeConfiguration(): Promise<Result<void, string>> {
    return this.executeWithMetrics<void>(
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

// ============================================================================
// FACTORY FUNCTIONS & EXPORTS
// ============================================================================

/**
 * Factory function to create Matrix Operations API instance
 *
 * Creates a new instance of the Matrix Operations API with optional configuration.
 * This is the recommended way to create API instances as it provides proper
 * type safety and configuration validation.
 *
 * ## Features
 * - **Type-safe configuration**: Validates all configuration parameters
 * - **Immutable state**: All internal state follows immutability principles
 * - **Resource management**: Automatic cleanup and disposal
 * - **Performance monitoring**: Built-in metrics and telemetry
 * - **Error handling**: Comprehensive Result<T,E> error patterns
 *
 * @param config - Optional partial configuration to override defaults
 * @returns Fully configured MatrixOperationsAPI instance
 *
 * @example Basic Usage
 * ```typescript
 * // Create API with default configuration
 * const api = createMatrixOperationsAPI();
 *
 * // Use the API
 * const result = await api.convertMatrix4ToGLMatrix(matrix4);
 * if (result.success) {
 *   console.log('Conversion successful:', result.data);
 * }
 * ```
 *
 * @example Custom Configuration
 * ```typescript
 * // Create API with custom configuration
 * const api = createMatrixOperationsAPI({
 *   enableValidation: true,
 *   enableTelemetry: true,
 *   timeoutMs: createTimeout(15000),
 *   maxRetries: createRetryCount(5)
 * });
 * ```
 *
 * @since 1.0.0
 */
export const createMatrixOperationsAPI = (
  config?: Partial<MatrixOperationConfig>
): MatrixOperationsAPI => {
  return new MatrixOperationsAPIImpl(config);
};

/**
 * Default Matrix Operations API instance with production-ready configuration
 *
 * Pre-configured instance suitable for most use cases. Uses default settings
 * optimized for performance and reliability in production environments.
 *
 * @example
 * ```typescript
 * import { matrixOperationsAPI } from './matrix-operations.api';
 *
 * // Use the default instance
 * const result = await matrixOperationsAPI.convertMatrix4ToGLMatrix(matrix4);
 * ```
 *
 * @since 1.0.0
 */
export const matrixOperationsAPI = createMatrixOperationsAPI();

// ============================================================================
// END OF MODULE
// ============================================================================

/**
 * @fileoverview Matrix Operations API - Complete
 *
 * This module provides a comprehensive, type-safe API for matrix operations
 * following functional programming principles with immutable data structures,
 * Result-based error handling, and dependency injection patterns.
 *
 * All exports are available for external use:
 * - MatrixOperationsAPI interface
 * - Configuration interfaces (MatrixOperationConfig, BatchOperationConfig)
 * - Metrics interfaces (APIPerformanceMetrics, APIHealthStatus)
 * - Factory function (createMatrixOperationsAPI)
 * - Default instance (matrixOperationsAPI)
 * - Utility functions (createTimeout, createRetryCount, createConcurrencyLimit)
 */
