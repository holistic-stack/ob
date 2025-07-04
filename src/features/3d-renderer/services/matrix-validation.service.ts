/**
 * Matrix Validation Service
 *
 * Comprehensive matrix analysis and validation service with numerical stability
 * assessment, remediation strategies, and performance monitoring following bulletproof-react patterns.
 */

import type { Matrix } from 'ml-matrix';
import { EigenvalueDecomposition, SingularValueDecomposition } from 'ml-matrix';
import { createLogger } from '../../../shared/services/logger.service.js';
import type { Result } from '../../../shared/types/result.types.js';
import { error, success } from '../../../shared/utils/functional/result.js';
import {
  ErrorRateMonitor,
  type RetryConfig,
  retryWithBackoff,
} from '../../../shared/utils/resilience/index.js';
import type { MATRIX_CONFIG } from '../config/matrix-config.js';
import { TransientFailureError } from '../errors/index.js';
import type {
  MatrixOperationResult,
  MatrixPerformanceMetrics,
  MatrixValidationResult,
} from '../types/matrix.types.js';
import { matrixUtils } from '../utils/matrix-adapters.js';
import type { MatrixCacheService } from './matrix-cache.service.js';
import { matrixServiceDiagnostics } from './matrix-service-diagnostics.js';

const logger = createLogger('MatrixValidationService');

/**
 * Dependency injection interface for MatrixValidationService
 */
export interface MatrixValidationDependencies {
  readonly cache: MatrixCacheService;
  readonly config: typeof MATRIX_CONFIG;
  readonly telemetry?: MatrixTelemetryService;
}

/**
 * Matrix validation options
 */
export interface MatrixValidationOptions {
  readonly useCache?: boolean;
  readonly computeEigenvalues?: boolean;
  readonly computeSVD?: boolean;
  readonly enableDetailedAnalysis?: boolean;
  readonly tolerance?: number;
}

/**
 * Matrix Validation Service with comprehensive analysis capabilities
 */
export class MatrixValidationService {
  private readonly operationCounter = new Map<string, number>();
  private performanceMetrics: MatrixPerformanceMetrics = {
    operationCount: 0,
    totalExecutionTime: 0,
    averageExecutionTime: 0,
    cacheHitRate: 0,
    memoryUsage: 0,
    largeMatrixOperations: 0,
    failedOperations: 0,
  };
  private readonly errorMonitor: ErrorRateMonitor;
  private readonly retryConfig: RetryConfig;
  private abortController: AbortController | null = null;

  constructor(
    private readonly deps: MatrixValidationDependencies,
    abortSignal?: AbortSignal
  ) {
    logger.init('Initializing matrix validation service with robust error handling');
    this.validateDependencies();

    // Initialize error rate monitoring
    this.errorMonitor = new ErrorRateMonitor({
      windowSizeMs: 300000, // 5 minutes
      errorThreshold: 20, // 20% threshold
      minSampleSize: 8,
      warningThreshold: 10, // 10%
      enableAutoRecovery: true,
    });

    // Configure retry settings for validation operations
    this.retryConfig = {
      maxAttempts: 4, // More attempts for validation as it's critical
      baseDelay: 800, // Start with 800ms for validation operations
      maxDelay: 8000, // Max 8 seconds for validation operations
      exponentialBase: 2,
      jitterPercent: 20,
      abortSignal: abortSignal,
      circuitBreakerThreshold: 6,
      circuitBreakerWindow: 90000, // 1.5 minutes
      shouldRetry: (error, attempt) => {
        // Retry transient failures, numerical issues, and memory pressure
        return (
          error instanceof TransientFailureError ||
          error.message.includes('numerical') ||
          error.message.includes('eigenvalue') ||
          error.message.includes('singular') ||
          error.message.includes('memory') ||
          attempt < 2
        ); // Always retry at least once
      },
      onRetry: (error, attempt, delay) => {
        logger.debug(
          `Retrying validation operation after ${error.message}, attempt ${attempt}, delay ${delay}ms`
        );
      },
    };
  }

  /**
   * Validate injected dependencies
   */
  private validateDependencies(): void {
    if (!this.deps.cache) {
      throw new Error('MatrixCacheService dependency is required');
    }
    if (!this.deps.config) {
      throw new Error('Matrix configuration dependency is required');
    }
    logger.debug('Dependencies validated successfully');
  }

  /**
   * Generate unique operation ID
   */
  private generateOperationId(operation: string): string {
    const count = this.operationCounter.get(operation) || 0;
    this.operationCounter.set(operation, count + 1);
    return `${operation}_${Date.now()}_${count}`;
  }

  /**
   * Update performance metrics
   */
  private updatePerformanceMetrics(
    executionTime: number,
    matrixSize: readonly [number, number]
  ): void {
    // Create new metrics object since properties are readonly
    const newOperationCount = this.performanceMetrics.operationCount + 1;
    const newTotalExecutionTime = this.performanceMetrics.totalExecutionTime + executionTime;

    const size = matrixSize[0] * matrixSize[1];
    const isLargeMatrix = size >= this.deps.config.performance.largeMatrixThreshold;

    this.performanceMetrics = {
      ...this.performanceMetrics,
      operationCount: newOperationCount,
      totalExecutionTime: newTotalExecutionTime,
      averageExecutionTime: newTotalExecutionTime / newOperationCount,
      largeMatrixOperations: isLargeMatrix
        ? this.performanceMetrics.largeMatrixOperations + 1
        : this.performanceMetrics.largeMatrixOperations,
    };

    // Update telemetry if available
    if (this.deps.telemetry) {
      this.deps.telemetry.trackOperation('validation', executionTime, true);
    }
  }

  /**
   * Record failed operation
   */
  private recordFailure(operation: string, error: Error): void {
    this.performanceMetrics = {
      ...this.performanceMetrics,
      failedOperations: this.performanceMetrics.failedOperations + 1,
    };

    if (this.deps.telemetry) {
      this.deps.telemetry.trackOperation(operation, 0, false);
    }

    logger.error(`Operation ${operation} failed:`, error);
  }

  /**
   * Validate matrix with robust error handling and retry logic
   */
  async validateMatrix(
    matrix: Matrix,
    options: MatrixValidationOptions = {}
  ): Promise<Result<MatrixOperationResult<MatrixValidationResult>, string>> {
    const operationType = 'matrix-validation';
    const operationId = this.generateOperationId(operationType);
    const startTime = Date.now();

    logger.debug(`Starting matrix validation: ${operationId}`);

    // Wrap the validation operation with retry logic
    const performValidation = async (): Promise<MatrixOperationResult<MatrixValidationResult>> => {
      // Check for abort signal
      if (this.retryConfig.abortSignal?.aborted) {
        throw new Error('Matrix validation operation aborted');
      }

      const validationStartTime = Date.now();

      try {
        // Basic matrix validation
        if (!matrix || matrix.rows === 0 || matrix.columns === 0) {
          throw new TransientFailureError(
            'Invalid matrix: empty or null matrix',
            'validate',
            [0, 0],
            { operationId },
            1000
          );
        }

        // Check for numerical issues early
        const hasNaN = matrix.to2DArray().some((row) => row.some((val) => Number.isNaN(val)));
        const hasInfinite = matrix
          .to2DArray()
          .some((row) => row.some((val) => !Number.isFinite(val)));

        if (hasNaN || hasInfinite) {
          throw new TransientFailureError(
            `Matrix contains invalid values: NaN=${hasNaN}, Infinite=${hasInfinite}`,
            'validate',
            [matrix.rows, matrix.columns],
            { operationId, hasNaN, hasInfinite },
            2000
          );
        }

        // Check cache if enabled
        let cacheHit = false;
        const cacheKey = options.useCache ? `${matrixUtils.hash(matrix)}_validation` : null;

        if (cacheKey && options.useCache !== false) {
          try {
            const cachedResult = this.deps.cache.get(cacheKey);
            if (cachedResult.success && cachedResult.data) {
              cacheHit = true;
              logger.debug(`Validation cache hit: ${operationId}`);

              const executionTime = Date.now() - validationStartTime;
              this.updatePerformanceMetrics(executionTime, [matrix.rows, matrix.columns]);

              return {
                success: true,
                result: cachedResult.data as MatrixValidationResult,
                performance: {
                  executionTime,
                  memoryUsed: 0, // No memory used for cache hit
                  cacheHit: true,
                  matrixSize: [matrix.rows, matrix.columns] as const,
                },
                operationId,
                timestamp: Date.now(),
              };
            }
          } catch (cacheError) {
            // Log cache error but continue with validation
            logger.debug(
              `Cache lookup failed for validation ${operationId}: ${cacheError instanceof Error ? cacheError.message : String(cacheError)}`
            );
          }
        }

        // Perform actual validation
        const validationResult = await this.performMatrixValidation(matrix, options, operationId);

        // Cache the result if enabled and successful
        if (cacheKey && options.useCache !== false && validationResult.success) {
          try {
            this.deps.cache.set(cacheKey, validationResult.result);
          } catch (cacheError) {
            // Log cache error but don't fail the operation
            logger.debug(
              `Failed to cache validation result ${operationId}: ${cacheError instanceof Error ? cacheError.message : String(cacheError)}`
            );
          }
        }

        const executionTime = Date.now() - validationStartTime;
        this.updatePerformanceMetrics(executionTime, [matrix.rows, matrix.columns]);

        return {
          success: validationResult.success,
          result: validationResult.result,
          performance: {
            executionTime,
            memoryUsed: this.estimateMemoryUsage(matrix),
            cacheHit,
            matrixSize: [matrix.rows, matrix.columns] as const,
          },
          operationId,
          timestamp: Date.now(),
        };
      } catch (err) {
        if (err instanceof TransientFailureError) {
          throw err;
        }

        // Convert unexpected validation errors to TransientFailureError
        const message = err instanceof Error ? err.message : String(err);
        throw new TransientFailureError(
          `Matrix validation failed: ${message}`,
          'validate',
          [matrix.rows, matrix.columns],
          { operationId, originalError: message },
          3000
        );
      }
    };

    try {
      // Use retry logic for the validation operation
      const retryResult = await retryWithBackoff(
        performValidation,
        `${operationType}-${operationId}`,
        this.retryConfig
      );

      if (retryResult.success) {
        this.errorMonitor.recordOperation(operationType, true);
        const totalTime = Date.now() - startTime;
        logger.debug(`Matrix validation completed successfully: ${operationId} in ${totalTime}ms`);
        return success(retryResult.data);
      } else {
        const validationError = new Error(retryResult.error);
        this.errorMonitor.recordOperation(operationType, false, validationError);

        // Check if this should be treated as warning based on error rate
        if (this.errorMonitor.shouldTreatAsWarning(operationType, validationError)) {
          logger.warn(
            `Matrix validation failed for ${operationId}, but error rate is acceptable: ${retryResult.error}`
          );

          // Return a degraded but successful result
          return success({
            success: false,
            result: {
              isValid: false,
              errors: [retryResult.error],
              warnings: ['Validation failed but continuing due to acceptable error rate'],
              properties: {
                determinant: null,
                conditionNumber: Infinity,
                rank: null,
                isSymmetric: false,
                isPositiveDefinite: false,
                isOrthogonal: false,
                numericalStability: 'unstable' as const,
              },
              remediationStrategies: ['Consider manual validation or alternative approach'],
            },
            performance: {
              executionTime: Date.now() - startTime,
              memoryUsed: 0,
              cacheHit: false,
              matrixSize: [matrix.rows, matrix.columns] as const,
            },
            operationId,
            timestamp: Date.now(),
          });
        }

        this.recordFailure(operationType, validationError);
        return error(retryResult.error);
      }
    } catch (err) {
      const operationError = err instanceof Error ? err : new Error(String(err));
      this.errorMonitor.recordOperation(operationType, false, operationError);

      // Check if this should be treated as warning
      if (this.errorMonitor.shouldTreatAsWarning(operationType, operationError)) {
        logger.warn(
          `Matrix validation failed for ${operationId}, but error rate is acceptable: ${operationError.message}`
        );

        // Return a degraded but successful result
        return success({
          success: false,
          result: {
            isValid: false,
            errors: [operationError.message],
            warnings: ['Validation failed but continuing due to acceptable error rate'],
            properties: {
              determinant: null,
              conditionNumber: Infinity,
              rank: null,
              isSymmetric: false,
              isPositiveDefinite: false,
              isOrthogonal: false,
              numericalStability: 'unstable' as const,
            },
            remediationStrategies: ['Consider manual validation or alternative approach'],
          },
          performance: {
            executionTime: Date.now() - startTime,
            memoryUsed: 0,
            cacheHit: false,
            matrixSize: [matrix.rows, matrix.columns] as const,
          },
          operationId,
          timestamp: Date.now(),
        });
      }

      this.recordFailure(operationType, operationError);
      const errorMessage = `Matrix validation failed: ${operationError.message}`;
      logger.error(errorMessage);
      return error(errorMessage);
    }
  }

  /**
   * Perform the actual matrix validation logic
   */
  private async performMatrixValidation(
    matrix: Matrix,
    _options: MatrixValidationOptions,
    _operationId: string
  ): Promise<{ success: boolean; result: MatrixValidationResult }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Basic properties
      const isSquare = matrixUtils.isSquare(matrix);
      const isSymmetric = isSquare ? this.isSymmetric(matrix) : false;

      // Compute condition number with error handling
      let conditionNumber: number;
      try {
        conditionNumber = this.computeConditionNumber(matrix);
      } catch (err) {
        conditionNumber = Infinity;
        warnings.push(
          `Failed to compute condition number: ${err instanceof Error ? err.message : String(err)}`
        );
      }

      // Compute determinant for square matrices
      let determinant: number | null = null;
      if (isSquare) {
        try {
          determinant = matrix.det();
        } catch (err) {
          warnings.push(
            `Failed to compute determinant: ${err instanceof Error ? err.message : String(err)}`
          );
        }
      }

      // Assess numerical stability
      const numericalStability = this.assessNumericalStability(
        conditionNumber,
        determinant || undefined
      );

      // Check for common issues
      if (conditionNumber > 1e12) {
        errors.push(
          `Matrix is ill-conditioned (condition number: ${conditionNumber.toExponential(2)})`
        );
      } else if (conditionNumber > 1e6) {
        warnings.push(`Matrix has high condition number: ${conditionNumber.toExponential(2)}`);
      }

      if (determinant !== null && Math.abs(determinant) < 1e-15) {
        errors.push(`Matrix appears to be singular (determinant ≈ 0)`);
      }

      // Generate remediation strategies
      const remediationStrategies = this.generateRemediationStrategies(
        matrix,
        conditionNumber,
        numericalStability,
        isSymmetric,
        false // isPositiveDefinite calculation is complex, skip for now
      );

      const isValid = errors.length === 0;

      return {
        success: true,
        result: {
          isValid,
          errors,
          warnings,
          properties: {
            determinant,
            conditionNumber,
            rank: null, // Rank calculation is expensive, skip unless requested
            isSymmetric,
            isPositiveDefinite: false, // Skip expensive computation for now
            isOrthogonal: false, // Skip expensive computation for now
            numericalStability,
          },
          remediationStrategies,
        },
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      errors.push(`Validation computation failed: ${errorMessage}`);

      return {
        success: true, // Return success with errors to indicate partial completion
        result: {
          isValid: false,
          errors,
          warnings,
          properties: {
            determinant: null,
            conditionNumber: Infinity,
            rank: null,
            isSymmetric: false,
            isPositiveDefinite: false,
            isOrthogonal: false,
            numericalStability: 'unstable' as const,
          },
          remediationStrategies: ['Consider alternative numerical methods'],
        },
      };
    }
  }

  /**
   * Check if matrix is symmetric
   */
  private isSymmetric(matrix: Matrix): boolean {
    if (!matrixUtils.isSquare(matrix)) {
      return false;
    }

    try {
      const tolerance = this.deps.config.operations.precision;
      for (let i = 0; i < matrix.rows; i++) {
        for (let j = 0; j < matrix.columns; j++) {
          if (Math.abs(matrix.get(i, j) - matrix.get(j, i)) > tolerance) {
            return false;
          }
        }
      }
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Estimate memory usage for validation operation
   */
  private estimateMemoryUsage(matrix: Matrix): number {
    // Rough estimate: matrix size + temporary computations
    const baseSize = matrix.rows * matrix.columns * 8; // 8 bytes per number
    const temporarySpace = baseSize * 2; // Assume 2x for temporary calculations
    return baseSize + temporarySpace;
  }

  /**
   * Compute condition number of matrix
   */
  private computeConditionNumber(matrix: Matrix): number {
    try {
      if (!matrixUtils.isSquare(matrix)) {
        // For non-square matrices, use SVD-based condition number
        const svd = new SingularValueDecomposition(matrix);
        const singularValues = svd.diagonal;
        const maxSV = Math.max(...singularValues);
        const minSV = Math.min(...singularValues.filter((sv) => sv > 0));
        return minSV > 0 ? maxSV / minSV : Infinity;
      }

      // For square matrices, use eigenvalue-based condition number
      const eigenDecomp = new EigenvalueDecomposition(matrix);
      const eigenvalues = eigenDecomp.realEigenvalues;
      const maxEigen = Math.max(...eigenvalues.map(Math.abs));
      const minEigen = Math.min(...eigenvalues.map(Math.abs).filter((ev) => ev > 0));

      return minEigen > 0 ? maxEigen / minEigen : Infinity;
    } catch {
      return Infinity;
    }
  }

  /**
   * Assess numerical stability based on matrix properties
   */
  private assessNumericalStability(
    conditionNumber: number,
    _determinant?: number,
    _singularValues?: number[]
  ): 'excellent' | 'good' | 'poor' | 'unstable' {
    const _tolerance = this.deps.config.operations.precision;

    // Check condition number
    if (conditionNumber < 1e3) {
      return 'excellent';
    } else if (conditionNumber < 1e6) {
      return 'good';
    } else if (conditionNumber < 1e12) {
      return 'poor';
    } else {
      return 'unstable';
    }
  }

  /**
   * Generate remediation strategies based on validation results
   */
  private generateRemediationStrategies(
    matrix: Matrix,
    conditionNumber: number,
    stability: string,
    isSymmetric: boolean,
    isPositiveDefinite: boolean
  ): string[] {
    const strategies: string[] = [];

    if (stability === 'unstable' || conditionNumber > 1e12) {
      strategies.push('Use SVD-based pseudo-inverse instead of direct inversion');
      strategies.push('Apply regularization techniques (Tikhonov regularization)');
      strategies.push('Consider iterative refinement methods');
    }

    if (stability === 'poor') {
      strategies.push('Use higher precision arithmetic if available');
      strategies.push('Consider pivoting strategies for decompositions');
    }

    if (!isSymmetric && matrixUtils.isSquare(matrix)) {
      strategies.push('Check if matrix should be symmetric and correct if needed');
    }

    if (!isPositiveDefinite && isSymmetric) {
      strategies.push('Add small diagonal regularization to ensure positive definiteness');
    }

    if (matrixUtils.isSingular(matrix)) {
      strategies.push('Matrix is singular - use pseudo-inverse or add regularization');
      strategies.push('Check for linear dependencies in matrix rows/columns');
    }

    const size = matrix.rows * matrix.columns;
    if (size > this.deps.config.performance.largeMatrixThreshold) {
      strategies.push('Consider block-wise processing for large matrices');
      strategies.push('Use sparse matrix representations if applicable');
    }

    return strategies;
  }

  /**
   * Validate matrix with comprehensive analysis (direct validation without retry logic)
   */
  async validateMatrixDirect(
    matrix: Matrix,
    options: MatrixValidationOptions = {}
  ): Promise<Result<MatrixOperationResult<MatrixValidationResult>, string>> {
    const operation = 'validateMatrix';
    const metadata = {
      matrixSize: [matrix.rows, matrix.columns],
      useCache: options.useCache,
      tolerance: options.tolerance,
      enableDetailedAnalysis: options.enableDetailedAnalysis,
    };

    // Start diagnostic timing
    matrixServiceDiagnostics.startTiming(operation, metadata);

    const startTime = Date.now();

    logger.debug(`Validating matrix ${matrix.rows}x${matrix.columns}`);

    try {
      // Note: Validation results are not cached as the cache interface expects Matrix objects

      const tolerance = options.tolerance || this.deps.config.operations.precision;
      const errors: string[] = [];
      const warnings: string[] = [];
      const suggestions: string[] = [];

      // Basic validation
      if (matrix.rows <= 0 || matrix.columns <= 0) {
        errors.push(`Invalid matrix dimensions: ${matrix.rows}x${matrix.columns}`);
      }

      // Check for invalid values
      for (let i = 0; i < matrix.rows; i++) {
        for (let j = 0; j < matrix.columns; j++) {
          const value = matrix.get(i, j);
          if (!Number.isFinite(value)) {
            errors.push(`Invalid matrix value at [${i}, ${j}]: ${value}`);
          }
        }
      }

      if (errors.length > 0) {
        return error(`Matrix validation failed: ${errors.join(', ')}`);
      }

      // Compute matrix properties
      const isSquare = matrixUtils.isSquare(matrix);
      const isSymmetric = matrixUtils.isSymmetric(matrix);
      const isOrthogonal = matrixUtils.isOrthogonal(matrix);
      const isPositiveDefinite = matrixUtils.isPositiveDefinite(matrix);

      let conditionNumber: number | undefined;
      let rank: number | undefined;
      let determinant: number | undefined;
      let eigenvalues: number[] | undefined;
      let singularValues: number[] | undefined;

      // Compute condition number
      conditionNumber = this.computeConditionNumber(matrix);

      // Compute rank
      try {
        rank = (matrix as unknown as { rank?(): number }).rank?.() ?? 0;
      } catch (err) {
        logger.warn(`Failed to compute rank: ${err}`);
      }

      // Compute determinant for square matrices
      if (isSquare) {
        try {
          determinant = (matrix as unknown as { determinant?(): number }).determinant?.() ?? 0;
        } catch (err) {
          logger.warn(`Failed to compute determinant: ${err}`);
        }
      }

      // Compute eigenvalues if requested and matrix is square
      if (options.computeEigenvalues && isSquare) {
        try {
          const eigenDecomp = new EigenvalueDecomposition(matrix);
          eigenvalues = eigenDecomp.realEigenvalues;
        } catch (err) {
          logger.warn(`Failed to compute eigenvalues: ${err}`);
        }
      }

      // Compute SVD if requested
      if (options.computeSVD) {
        try {
          const svd = new SingularValueDecomposition(matrix);
          singularValues = svd.diagonal;
        } catch (err) {
          logger.warn(`Failed to compute SVD: ${err}`);
        }
      }

      // Assess numerical stability
      const numericalStability = this.assessNumericalStability(
        conditionNumber,
        determinant,
        singularValues
      );

      // Generate remediation strategies
      const remediationStrategies = this.generateRemediationStrategies(
        matrix,
        conditionNumber,
        numericalStability,
        isSymmetric,
        isPositiveDefinite
      );

      // Add warnings based on analysis
      if (numericalStability === 'poor' || numericalStability === 'unstable') {
        warnings.push(
          `Matrix has ${numericalStability} numerical stability (condition number: ${conditionNumber.toExponential(2)})`
        );
      }

      if (isSquare && Math.abs(determinant || 0) < tolerance) {
        warnings.push('Matrix appears to be singular or near-singular');
      }

      const validationResult: MatrixValidationResult = {
        isValid: errors.length === 0,
        errors,
        warnings,
        suggestions,
        conditionNumber,
        rank: rank ?? 0,
        determinant: determinant ?? 0,
        eigenvalues: eigenvalues ?? [],
        singularValues: singularValues ?? [],
        isPositiveDefinite,
        isOrthogonal,
        isSymmetric,
        numericalStability,
        remediationStrategies,
      };

      // Note: Validation results are not cached as the cache interface expects Matrix objects

      const executionTime = Date.now() - startTime;
      this.updatePerformanceMetrics(executionTime, [matrix.rows, matrix.columns]);

      const operationResult: MatrixOperationResult<MatrixValidationResult> = {
        result: validationResult,
        performance: {
          executionTime,
          memoryUsed: matrixUtils.memoryUsage(matrix),
          operationType: operation,
          matrixSize: [matrix.rows, matrix.columns],
          cacheHit: false,
        },
        metadata: {
          timestamp: Date.now(),
          operationId: this.generateOperationId(operation),
          inputHash: matrixUtils.hash(matrix),
        },
      };

      logger.debug(
        `Matrix validation completed in ${executionTime}ms (stability: ${numericalStability})`
      );

      // End diagnostic timing on success
      matrixServiceDiagnostics.endTiming(operation, {
        ...metadata,
        success: true,
        numericalStability,
        executionTime,
      });

      return success(operationResult);
    } catch (err) {
      // End diagnostic timing on failure
      matrixServiceDiagnostics.endTiming(operation, {
        ...metadata,
        success: false,
        error: err instanceof Error ? err.message : String(err),
      });

      this.recordFailure(operation, err as Error);
      return error(`Matrix validation failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): MatrixPerformanceMetrics {
    return { ...this.performanceMetrics };
  }

  /**
   * Reset performance metrics
   */
  resetPerformanceMetrics(): void {
    Object.assign(this.performanceMetrics, {
      operationCount: 0,
      totalExecutionTime: 0,
      averageExecutionTime: 0,
      cacheHitRate: 0,
      memoryUsage: 0,
      largeMatrixOperations: 0,
      failedOperations: 0,
    });
    logger.debug('Performance metrics reset');
  }
}

// Forward declaration for telemetry service
interface MatrixTelemetryService {
  trackOperation(operation: string, duration: number, success: boolean): void;
}
