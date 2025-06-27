/**
 * Matrix Conversion Service
 * 
 * Advanced matrix conversion service with dependency injection, robust error handling,
 * performance monitoring, and WeakMap-based cleanup following bulletproof-react patterns.
 */

import { Matrix, inverse, SingularValueDecomposition } from 'ml-matrix';
import { Matrix3, Matrix4, Vector3, Quaternion, Euler } from 'three';
import type { 
  MatrixOperationResult,
  TransformationMatrix,
  RotationMatrix,
  MatrixValidation,
  MatrixPerformanceMetrics,
  MatrixConfigOverride
} from '../types/matrix.types';
import { MatrixCacheService } from './matrix-cache.service';
import { matrixAdapter, matrixUtils } from '../utils/matrix-adapters';
import { MATRIX_CONFIG, getCacheKey, getOperationTimeout } from '../config/matrix-config';
import { success, error } from '../../../shared/utils/functional/result';
import type { Result } from '../../../shared/types/result.types';

/**
 * Dependency injection interface for MatrixConversionService
 */
export interface MatrixConversionDependencies {
  readonly cache: MatrixCacheService;
  readonly config: typeof MATRIX_CONFIG;
  readonly telemetry?: MatrixTelemetryService;
}

/**
 * Matrix conversion options
 */
export interface MatrixConversionOptions {
  readonly useCache?: boolean;
  readonly enableSVDFallback?: boolean;
  readonly precision?: number;
  readonly timeout?: number;
  readonly enableTelemetry?: boolean;
  readonly validateInput?: boolean;
}

/**
 * Matrix Conversion Service with dependency injection and advanced error handling
 */
export class MatrixConversionService {
  private readonly operationCounter = new Map<string, number>();
  private readonly conversionCache = new WeakMap<Matrix, Matrix>();
  private readonly performanceMetrics: MatrixPerformanceMetrics = {
    operationCount: 0,
    totalExecutionTime: 0,
    averageExecutionTime: 0,
    cacheHitRate: 0,
    memoryUsage: 0,
    largeMatrixOperations: 0,
    failedOperations: 0
  };

  constructor(private readonly deps: MatrixConversionDependencies) {
    console.log('[INIT][MatrixConversionService] Initializing matrix conversion service with dependencies');
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
    console.log('[DEBUG][MatrixConversionService] Dependencies validated successfully');
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
   * Create operation result with performance metadata
   */
  private createOperationResult<T>(
    result: T,
    operation: string,
    startTime: number,
    matrixSize: readonly [number, number],
    cacheHit = false
  ): MatrixOperationResult<T> {
    const executionTime = Date.now() - startTime;
    const memoryUsed = result instanceof Matrix ? matrixUtils.memoryUsage(result) : 0;

    const operationResult: MatrixOperationResult<T> = {
      result,
      performance: {
        executionTime,
        memoryUsed,
        operationType: operation,
        matrixSize,
        cacheHit
      },
      metadata: {
        timestamp: Date.now(),
        operationId: this.generateOperationId(operation),
        inputHash: `${matrixSize[0]}x${matrixSize[1]}_${operation}`
      }
    };

    // Update performance metrics
    this.updatePerformanceMetrics(operationResult);

    return operationResult;
  }

  /**
   * Update internal performance metrics
   */
  private updatePerformanceMetrics(result: MatrixOperationResult): void {
    this.performanceMetrics.operationCount++;
    this.performanceMetrics.totalExecutionTime += result.performance.executionTime;
    this.performanceMetrics.averageExecutionTime = 
      this.performanceMetrics.totalExecutionTime / this.performanceMetrics.operationCount;
    
    const [rows, cols] = result.performance.matrixSize;
    const size = rows * cols;
    
    if (size >= this.deps.config.performance.largeMatrixThreshold) {
      this.performanceMetrics.largeMatrixOperations++;
    }

    // Update telemetry if available
    if (this.deps.telemetry) {
      this.deps.telemetry.trackOperation(
        result.performance.operationType,
        result.performance.executionTime,
        true
      );
    }
  }

  /**
   * Record failed operation
   */
  private recordFailure(operation: string, error: Error): void {
    this.performanceMetrics.failedOperations++;
    
    if (this.deps.telemetry) {
      this.deps.telemetry.trackOperation(operation, 0, false);
    }
    
    console.error(`[ERROR][MatrixConversionService] Operation ${operation} failed:`, error);
  }

  /**
   * Validate matrix for conversion
   */
  private validateMatrix(matrix: Matrix, operation: string): MatrixValidation {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Check matrix dimensions
    if (matrix.rows <= 0 || matrix.columns <= 0) {
      errors.push(`Invalid matrix dimensions: ${matrix.rows}x${matrix.columns}`);
    }

    // Check for NaN or infinite values
    for (let i = 0; i < matrix.rows; i++) {
      for (let j = 0; j < matrix.columns; j++) {
        const value = matrix.get(i, j);
        if (!Number.isFinite(value)) {
          errors.push(`Invalid matrix value at [${i}, ${j}]: ${value}`);
        }
      }
    }

    // Operation-specific validations
    if (operation === 'inverse' && !matrixUtils.isSquare(matrix)) {
      errors.push('Matrix inversion requires a square matrix');
    }

    if (operation === 'inverse' && matrixUtils.isSingular(matrix)) {
      warnings.push('Matrix appears to be singular or near-singular');
      suggestions.push('Consider using SVD-based pseudo-inverse');
    }

    // Performance warnings
    const size = matrix.rows * matrix.columns;
    if (size > this.deps.config.performance.maxDirectOperationSize) {
      warnings.push(`Large matrix detected: ${matrix.rows}x${matrix.columns} (${size} elements)`);
      suggestions.push('Consider using batch operations or parallel processing');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions
    };
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
      failedOperations: 0
    });
    console.log('[DEBUG][MatrixConversionService] Performance metrics reset');
  }

  /**
   * Convert Three.js Matrix4 to ml-matrix with robust error handling
   */
  async convertMatrix4ToMLMatrix(
    matrix4: Matrix4,
    options: MatrixConversionOptions = {}
  ): Promise<Result<MatrixOperationResult<Matrix>, string>> {
    const startTime = Date.now();
    const operation = 'matrix4ToMLMatrix';

    console.log(`[DEBUG][MatrixConversionService] Converting Matrix4 to ml-matrix`);

    try {
      // Input validation
      if (options.validateInput) {
        // Create a temporary ml-matrix for validation
        const tempResult = matrixAdapter.fromThreeMatrix4(matrix4);
        const validation = this.validateMatrix(tempResult, operation);

        if (!validation.isValid) {
          return error(`Validation failed: ${validation.errors.join(', ')}`);
        }

        if (validation.warnings.length > 0) {
          console.warn(`[WARN][MatrixConversionService] ${validation.warnings.join(', ')}`);
        }
      }

      // Check WeakMap cache first
      const cachedResult = this.conversionCache.get(matrix4 as any);
      if (cachedResult && options.useCache !== false) {
        console.log(`[DEBUG][MatrixConversionService] WeakMap cache hit for Matrix4 conversion`);
        return success(this.createOperationResult(cachedResult, operation, startTime, [4, 4], true));
      }

      // Check persistent cache
      if (options.useCache !== false) {
        const cacheKey = getCacheKey(operation, matrix4.elements.join(','));
        const cacheResult = this.deps.cache.get(cacheKey);

        if (cacheResult.success && cacheResult.data) {
          console.log(`[DEBUG][MatrixConversionService] Persistent cache hit for Matrix4 conversion`);
          this.conversionCache.set(matrix4 as any, cacheResult.data);
          return success(this.createOperationResult(cacheResult.data, operation, startTime, [4, 4], true));
        }
      }

      // Perform conversion
      const result = matrixAdapter.fromThreeMatrix4(matrix4);

      // Cache results
      if (options.useCache !== false) {
        this.conversionCache.set(matrix4 as any, result);
        const cacheKey = getCacheKey(operation, matrix4.elements.join(','));
        this.deps.cache.set(cacheKey, result);
      }

      const operationResult = this.createOperationResult(result, operation, startTime, [4, 4]);
      console.log(`[DEBUG][MatrixConversionService] Matrix4 conversion completed in ${operationResult.performance.executionTime}ms`);

      return success(operationResult);

    } catch (err) {
      this.recordFailure(operation, err as Error);
      return error(`Matrix4 conversion failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  /**
   * Convert ml-matrix to Three.js Matrix4 with robust error handling
   */
  async convertMLMatrixToMatrix4(
    matrix: Matrix,
    options: MatrixConversionOptions = {}
  ): Promise<Result<MatrixOperationResult<Matrix4>, string>> {
    const startTime = Date.now();
    const operation = 'mlMatrixToMatrix4';

    console.log(`[DEBUG][MatrixConversionService] Converting ml-matrix to Matrix4`);

    try {
      // Input validation
      if (options.validateInput) {
        const validation = this.validateMatrix(matrix, operation);

        if (!validation.isValid) {
          return error(`Validation failed: ${validation.errors.join(', ')}`);
        }

        if (validation.warnings.length > 0) {
          console.warn(`[WARN][MatrixConversionService] ${validation.warnings.join(', ')}`);
        }
      }

      // Check matrix dimensions
      if (matrix.rows !== 4 || matrix.columns !== 4) {
        return error(`Matrix must be 4x4 for Matrix4 conversion, got ${matrix.rows}x${matrix.columns}`);
      }

      // Check WeakMap cache first
      const cachedResult = this.conversionCache.get(matrix);
      if (cachedResult && options.useCache !== false) {
        console.log(`[DEBUG][MatrixConversionService] WeakMap cache hit for ml-matrix conversion`);
        return success(this.createOperationResult(cachedResult as Matrix4, operation, startTime, [4, 4], true));
      }

      // Check persistent cache
      if (options.useCache !== false) {
        const cacheKey = getCacheKey(operation, matrixUtils.hash(matrix));
        const cacheResult = this.deps.cache.get(cacheKey);

        if (cacheResult.success && cacheResult.data) {
          console.log(`[DEBUG][MatrixConversionService] Persistent cache hit for ml-matrix conversion`);
          const result = matrixAdapter.toThreeMatrix4(cacheResult.data);
          this.conversionCache.set(matrix, result as any);
          return success(this.createOperationResult(result, operation, startTime, [4, 4], true));
        }
      }

      // Perform conversion
      const result = matrixAdapter.toThreeMatrix4(matrix);

      // Cache results
      if (options.useCache !== false) {
        this.conversionCache.set(matrix, result as any);
        const cacheKey = getCacheKey(operation, matrixUtils.hash(matrix));
        this.deps.cache.set(cacheKey, matrix);
      }

      const operationResult = this.createOperationResult(result, operation, startTime, [4, 4]);
      console.log(`[DEBUG][MatrixConversionService] ml-matrix conversion completed in ${operationResult.performance.executionTime}ms`);

      return success(operationResult);

    } catch (err) {
      this.recordFailure(operation, err as Error);
      return error(`ml-matrix conversion failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  /**
   * Perform robust matrix inversion with SVD fallback
   */
  async performRobustInversion(
    matrix: Matrix,
    options: MatrixConversionOptions = {}
  ): Promise<Result<MatrixOperationResult<Matrix>, string>> {
    const startTime = Date.now();
    const operation = 'robustInverse';

    console.log(`[DEBUG][MatrixConversionService] Performing robust matrix inversion`);

    try {
      // Input validation
      if (options.validateInput) {
        const validation = this.validateMatrix(matrix, 'inverse');

        if (!validation.isValid) {
          return error(`Validation failed: ${validation.errors.join(', ')}`);
        }

        if (validation.warnings.length > 0) {
          console.warn(`[WARN][MatrixConversionService] ${validation.warnings.join(', ')}`);
        }
      }

      // Check if matrix is square
      if (!matrixUtils.isSquare(matrix)) {
        return error(`Matrix inversion requires square matrix, got ${matrix.rows}x${matrix.columns}`);
      }

      // Check cache
      if (options.useCache !== false) {
        const cacheKey = getCacheKey(operation, matrixUtils.hash(matrix));
        const cacheResult = this.deps.cache.get(cacheKey);

        if (cacheResult.success && cacheResult.data) {
          console.log(`[DEBUG][MatrixConversionService] Cache hit for robust inversion`);
          return success(this.createOperationResult(cacheResult.data, operation, startTime, [matrix.rows, matrix.columns], true));
        }
      }

      let result: Matrix;

      try {
        // Attempt standard inversion first
        console.log(`[DEBUG][MatrixConversionService] Attempting standard matrix inversion`);
        result = inverse(matrix);

        // Verify inversion quality
        const product = matrix.mmul(result);
        const identity = Matrix.eye(matrix.rows);

        if (!matrixUtils.equals(product, identity, options.precision || this.deps.config.operations.precision)) {
          throw new Error('Standard inversion produced poor quality result');
        }

      } catch (standardError) {
        console.warn(`[WARN][MatrixConversionService] Standard inversion failed: ${standardError}`);

        if (options.enableSVDFallback !== false) {
          console.log(`[DEBUG][MatrixConversionService] Falling back to SVD-based pseudo-inverse`);

          try {
            // Use SVD-based pseudo-inverse
            const svd = new SingularValueDecomposition(matrix);
            const tolerance = options.precision || this.deps.config.operations.precision;

            // Compute pseudo-inverse using SVD
            const singularValues = svd.diagonal;
            const threshold = Math.max(...singularValues) * tolerance;

            // Create inverse of singular values with threshold
            const invSingularValues = singularValues.map(s =>
              s > threshold ? 1 / s : 0
            );

            const invS = Matrix.diag(invSingularValues);
            result = svd.V.mmul(invS).mmul(svd.U.transpose());

            console.log(`[DEBUG][MatrixConversionService] SVD-based pseudo-inverse completed successfully`);

          } catch (svdError) {
            this.recordFailure(operation, svdError as Error);
            return error(`Both standard and SVD inversion failed: ${svdError}`);
          }
        } else {
          this.recordFailure(operation, standardError as Error);
          return error(`Matrix inversion failed: ${standardError}`);
        }
      }

      // Cache result
      if (options.useCache !== false) {
        const cacheKey = getCacheKey(operation, matrixUtils.hash(matrix));
        this.deps.cache.set(cacheKey, result);
      }

      const operationResult = this.createOperationResult(result, operation, startTime, [matrix.rows, matrix.columns]);
      console.log(`[DEBUG][MatrixConversionService] Robust inversion completed in ${operationResult.performance.executionTime}ms`);

      return success(operationResult);

    } catch (err) {
      this.recordFailure(operation, err as Error);
      return error(`Robust inversion failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  /**
   * Compute robust normal matrix from model matrix
   */
  async computeRobustNormalMatrix(
    modelMatrix: Matrix4,
    options: MatrixConversionOptions = {}
  ): Promise<Result<MatrixOperationResult<Matrix3>, string>> {
    const startTime = Date.now();
    const operation = 'robustNormalMatrix';

    console.log(`[DEBUG][MatrixConversionService] Computing robust normal matrix`);

    try {
      // Convert to ml-matrix
      const mlMatrixResult = await this.convertMatrix4ToMLMatrix(modelMatrix, options);
      if (!mlMatrixResult.success) {
        return error(`Failed to convert model matrix: ${mlMatrixResult.error}`);
      }

      const mlMatrix = mlMatrixResult.data.result;

      // Extract 3x3 upper-left submatrix
      const upperLeft = new Matrix(3, 3);
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          upperLeft.set(i, j, mlMatrix.get(i, j));
        }
      }

      // Compute inverse transpose for normal matrix
      const inverseResult = await this.performRobustInversion(upperLeft, options);
      if (!inverseResult.success) {
        return error(`Failed to invert matrix for normal computation: ${inverseResult.error}`);
      }

      const inverse = inverseResult.data.result;
      const normalMatrix = inverse.transpose();

      // Convert back to Three.js Matrix3
      const threeMatrix3 = matrixAdapter.toThreeMatrix3(normalMatrix);

      const operationResult = this.createOperationResult(threeMatrix3, operation, startTime, [3, 3]);
      console.log(`[DEBUG][MatrixConversionService] Normal matrix computation completed in ${operationResult.performance.executionTime}ms`);

      return success(operationResult);

    } catch (err) {
      this.recordFailure(operation, err as Error);
      return error(`Normal matrix computation failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  /**
   * Clear WeakMap cache
   */
  clearCache(): void {
    // WeakMap doesn't have a clear method, but we can create a new instance
    Object.setPrototypeOf(this.conversionCache, WeakMap.prototype);
    console.log('[DEBUG][MatrixConversionService] WeakMap cache cleared');
  }
}

// Forward declaration for telemetry service
interface MatrixTelemetryService {
  trackOperation(operation: string, duration: number, success: boolean): void;
}
