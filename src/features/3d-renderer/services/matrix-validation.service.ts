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
import type { MATRIX_CONFIG } from '../config/matrix-config.js';
import type {
  MatrixOperationResult,
  MatrixPerformanceMetrics,
  MatrixValidationResult,
} from '../types/matrix.types.js';
import { matrixUtils } from '../utils/matrix-adapters.js';
import type { MatrixCacheService } from './matrix-cache.service.js';

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

  constructor(private readonly deps: MatrixValidationDependencies) {
    logger.init('Initializing matrix validation service with dependencies');
    this.validateDependencies();
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
   * Validate matrix with comprehensive analysis
   */
  async validateMatrix(
    matrix: Matrix,
    options: MatrixValidationOptions = {}
  ): Promise<Result<MatrixOperationResult<MatrixValidationResult>, string>> {
    const startTime = Date.now();
    const operation = 'matrixValidation';

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
      return success(operationResult);
    } catch (err) {
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
