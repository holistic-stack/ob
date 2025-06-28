/**
 * Matrix Operations API
 * 
 * Unified API abstraction layer for matrix operations with caching, performance monitoring,
 * and error handling following bulletproof-react service patterns.
 */

import { Matrix, inverse, LuDecomposition, QrDecomposition, EigenvalueDecomposition, CholeskyDecomposition } from 'ml-matrix';
import { Matrix3, Matrix4, Vector3, Quaternion, Euler } from 'three';
import type { 
  MatrixOperation,
  MatrixOperationResult,
  MatrixBatchOperation,
  MatrixBatchResult,
  MatrixDecomposition,
  MatrixValidation,
  TransformationMatrix,
  RotationMatrix,
  ThreeJSTransformData,
  MatrixConfigOverride
} from '../types/matrix.types';
import { MatrixCacheService } from './matrix-cache.service';
import { matrixAdapter, matrixFactory, matrixUtils } from '../utils/matrix-adapters';
import { MATRIX_CONFIG, getCacheKey, isMatrixSizeValid, getOperationTimeout } from '../config/matrix-config';
import { success, error } from '../../../shared/utils/functional/result';
import type { Result } from '../../../shared/types/result.types';

/**
 * Matrix Operations API Service
 */
export class MatrixOperationsAPI {
  private cache: MatrixCacheService;
  private operationCounter = 0;

  constructor() {
    console.log('[INIT][MatrixOperationsAPI] Initializing matrix operations API');
    this.cache = new MatrixCacheService();
  }

  /**
   * Generate unique operation ID
   */
  private generateOperationId(): string {
    return `matrix_op_${Date.now()}_${++this.operationCounter}`;
  }

  /**
   * Create operation result with performance metadata
   */
  private createOperationResult<T = Matrix>(
    result: T,
    operation: MatrixOperation,
    startTime: number,
    matrixSize: readonly [number, number],
    cacheHit = false
  ): MatrixOperationResult<T> {
    const executionTime = Date.now() - startTime;
    const memoryUsed = typeof result === 'object' && result && 'rows' in result && 'columns' in result
      ? matrixUtils.memoryUsage(result as unknown as Matrix)
      : 0;

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
        operationId: this.generateOperationId(),
        inputHash: `${matrixSize[0]}x${matrixSize[1]}_${operation}`
      }
    };

    // Update cache metrics
    this.cache.updateMetrics(operationResult as MatrixOperationResult);

    return operationResult;
  }

  /**
   * Validate matrix operation
   */
  private validateOperation(
    operation: MatrixOperation,
    matrices: Matrix[],
    parameters?: Record<string, unknown>
  ): MatrixValidation {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Check matrix sizes
    for (const matrix of matrices) {
      if (!isMatrixSizeValid(matrix.rows, matrix.columns)) {
        errors.push(`Invalid matrix size: ${matrix.rows}x${matrix.columns}`);
      }

      const size = matrix.rows * matrix.columns;
      if (size > MATRIX_CONFIG.performance.maxDirectOperationSize) {
        warnings.push(`Large matrix detected: ${matrix.rows}x${matrix.columns} (${size} elements)`);
        suggestions.push('Consider using batch operations for large matrices');
      }
    }

    // Operation-specific validations
    switch (operation) {
      case 'multiply':
        if (matrices.length >= 2 && matrices[0] && matrices[1] && matrices[0].columns !== matrices[1].rows) {
          errors.push(`Matrix multiplication dimension mismatch: ${matrices[0].rows}x${matrices[0].columns} × ${matrices[1].rows}x${matrices[1].columns}`);
        }
        break;
      
      case 'inverse':
      case 'determinant':
        if (matrices.length > 0 && matrices[0] && !matrixUtils.isSquare(matrices[0])) {
          errors.push(`Operation ${operation} requires square matrix`);
        }
        break;
      
      case 'eigenvalues':
      case 'eigenvectors':
        if (matrices.length > 0 && matrices[0] && (!matrixUtils.isSquare(matrices[0]) || !matrixUtils.isSymmetric(matrices[0]))) {
          warnings.push('Eigenvalue computation works best with symmetric matrices');
        }
        break;
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions
    };
  }

  /**
   * Execute matrix operation with caching and error handling
   */
  private async executeOperation<T = Matrix>(
    operation: MatrixOperation,
    matrices: Matrix[],
    operationFn: () => T,
    cacheKey?: string,
    timeout?: number
  ): Promise<Result<MatrixOperationResult<T>, string>> {
    const startTime = Date.now();
    const matrixSize: readonly [number, number] = matrices.length > 0 && matrices[0] 
      ? [matrices[0].rows, matrices[0].columns] 
      : [0, 0];

    try {
      // Validate operation
      const validation = this.validateOperation(operation, matrices);
      if (!validation.isValid) {
        return error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // Check cache if key provided
      if (cacheKey) {
        const cachedResult = this.cache.get(cacheKey);
        if (cachedResult.success && cachedResult.data) {
          console.log(`[DEBUG][MatrixOperationsAPI] Cache hit for ${operation}: ${cacheKey}`);
          return success(this.createOperationResult(
            cachedResult.data as T,
            operation,
            startTime,
            matrixSize,
            true
          ));
        }
      }

      // Set timeout
      const operationTimeout = timeout || getOperationTimeout(matrixSize[0] * matrixSize[1]);
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`Operation timeout: ${operation}`)), operationTimeout);
      });

      // Execute operation with timeout
      const result = await Promise.race([
        Promise.resolve(operationFn()),
        timeoutPromise
      ]);

      // Cache result if applicable
      if (cacheKey && result instanceof Matrix) {
        this.cache.set(cacheKey, result);
      }

      const operationResult = this.createOperationResult(result, operation, startTime, matrixSize);
      
      console.log(`[DEBUG][MatrixOperationsAPI] Operation ${operation} completed in ${operationResult.performance.executionTime}ms`);
      return success(operationResult);

    } catch (err) {
      this.cache.recordFailure();
      const errorMessage = `Operation ${operation} failed: ${err instanceof Error ? err.message : String(err)}`;
      console.error('[ERROR][MatrixOperationsAPI]', errorMessage);
      return error(errorMessage);
    }
  }

  /**
   * Basic matrix operations
   */
  async add(a: Matrix, b: Matrix): Promise<Result<MatrixOperationResult<Matrix>, string>> {
    const cacheKey = getCacheKey('add', matrixUtils.hash(a), matrixUtils.hash(b));
    return this.executeOperation('add', [a, b], () => a.add(b), cacheKey);
  }

  async subtract(a: Matrix, b: Matrix): Promise<Result<MatrixOperationResult<Matrix>, string>> {
    const cacheKey = getCacheKey('subtract', matrixUtils.hash(a), matrixUtils.hash(b));
    return this.executeOperation('subtract', [a, b], () => a.sub(b), cacheKey);
  }

  async multiply(a: Matrix, b: Matrix): Promise<Result<MatrixOperationResult<Matrix>, string>> {
    const cacheKey = getCacheKey('multiply', matrixUtils.hash(a), matrixUtils.hash(b));
    return this.executeOperation('multiply', [a, b], () => a.mmul(b), cacheKey);
  }

  async transpose(matrix: Matrix): Promise<Result<MatrixOperationResult<Matrix>, string>> {
    const cacheKey = getCacheKey('transpose', matrixUtils.hash(matrix));
    return this.executeOperation('transpose', [matrix], () => matrix.transpose(), cacheKey);
  }

  async inverse(matrix: Matrix): Promise<Result<MatrixOperationResult<Matrix>, string>> {
    const cacheKey = getCacheKey('inverse', matrixUtils.hash(matrix));
    return this.executeOperation('inverse', [matrix], () => inverse(matrix), cacheKey);
  }

  async pseudoInverse(matrix: Matrix): Promise<Result<MatrixOperationResult<Matrix>, string>> {
    const cacheKey = getCacheKey('pseudoInverse', matrixUtils.hash(matrix));
    return this.executeOperation('pseudoInverse', [matrix], () => {
      // Use ML-Matrix pseudoInverse method with proper type handling
      return (matrix as any).pseudoInverse();
    }, cacheKey);
  }

  /**
   * Matrix properties
   */
  async determinant(matrix: Matrix): Promise<Result<MatrixOperationResult<number>, string>> {
    const cacheKey = getCacheKey('determinant', matrixUtils.hash(matrix));
    return this.executeOperation('determinant', [matrix], () => {
      // Use ML-Matrix determinant method with proper type handling
      return (matrix as any).determinant();
    }, cacheKey);
  }

  async trace(matrix: Matrix): Promise<Result<MatrixOperationResult<number>, string>> {
    const cacheKey = getCacheKey('trace', matrixUtils.hash(matrix));
    return this.executeOperation('trace', [matrix], () => matrix.trace(), cacheKey);
  }

  async rank(matrix: Matrix): Promise<Result<MatrixOperationResult<number>, string>> {
    const cacheKey = getCacheKey('rank', matrixUtils.hash(matrix));
    return this.executeOperation('rank', [matrix], () => {
      // Use ML-Matrix rank method with proper type handling
      return (matrix as any).rank();
    }, cacheKey);
  }

  /**
   * Matrix decompositions
   */
  async decompose(matrix: Matrix): Promise<Result<MatrixOperationResult<MatrixDecomposition>, string>> {
    const cacheKey = getCacheKey('decompose', matrixUtils.hash(matrix));
    
    return this.executeOperation('lu', [matrix], () => {
      const decomposition: any = {}; // Use any to allow property assignment
      
      try {
        if (matrixUtils.isSquare(matrix)) {
          const lu = new LuDecomposition(matrix);
          decomposition.lu = {
            L: lu.lowerTriangularMatrix,
            U: lu.upperTriangularMatrix,
            P: Matrix.diag(lu.pivotPermutationVector)
          };
        }

        const qr = new QrDecomposition(matrix);
        decomposition.qr = {
          Q: qr.orthogonalMatrix,
          R: qr.upperTriangularMatrix
        };

        if (matrix.rows >= matrix.columns) {
          const svd = (matrix as any).svd(); // Use any for svd method
          decomposition.svd = {
            U: svd.U,
            S: Matrix.diag(svd.s),
            V: svd.V
          };
        }

        if (matrixUtils.isSquare(matrix) && matrixUtils.isSymmetric(matrix)) {
          const eigen = new EigenvalueDecomposition(matrix);
          decomposition.eigenvalues = {
            values: eigen.realEigenvalues,
            vectors: eigen.eigenvectorMatrix
          };
        }

        if (matrixUtils.isSquare(matrix) && matrixUtils.isPositiveDefinite(matrix)) {
          const cholesky = new CholeskyDecomposition(matrix);
          decomposition.cholesky = cholesky.lowerTriangularMatrix;
        }
      } catch (err) {
        console.warn(`[WARN][MatrixOperationsAPI] Some decompositions failed: ${err}`);
      }
      
      return decomposition as MatrixDecomposition; // Cast back to proper type
    }, cacheKey);
  }

  /**
   * Three.js integration methods
   */
  async fromThreeMatrix4(threeMatrix: Matrix4): Promise<Result<MatrixOperationResult<Matrix>, string>> {
    const startTime = Date.now();
    
    try {
      const result = matrixAdapter.fromThreeMatrix4(threeMatrix);
      const operationResult = this.createOperationResult(result, 'transform', startTime, [4, 4]);
      return success(operationResult);
    } catch (err) {
      const errorMessage = `Three.js Matrix4 conversion failed: ${err instanceof Error ? err.message : String(err)}`;
      console.error('[ERROR][MatrixOperationsAPI]', errorMessage);
      return error(errorMessage);
    }
  }

  async toThreeMatrix4(matrix: Matrix): Promise<Result<MatrixOperationResult<Matrix4>, string>> {
    const startTime = Date.now();
    
    try {
      const result = matrixAdapter.toThreeMatrix4(matrix);
      const operationResult = this.createOperationResult(result, 'transform', startTime, [matrix.rows, matrix.columns]);
      return success(operationResult);
    } catch (err) {
      const errorMessage = `Three.js Matrix4 conversion failed: ${err instanceof Error ? err.message : String(err)}`;
      console.error('[ERROR][MatrixOperationsAPI]', errorMessage);
      return error(errorMessage);
    }
  }

  async createTransformationMatrix(
    position: Vector3,
    rotation: Quaternion | Euler,
    scale: Vector3
  ): Promise<Result<MatrixOperationResult<TransformationMatrix>, string>> {
    const startTime = Date.now();
    
    try {
      const matrix4 = new Matrix4();
      matrix4.compose(position, rotation instanceof Quaternion ? rotation : new Quaternion().setFromEuler(rotation), scale);
      
      const result = matrixAdapter.fromThreeMatrix4(matrix4) as TransformationMatrix;
      const operationResult = this.createOperationResult(result, 'transform', startTime, [4, 4]);
      return success(operationResult);
    } catch (err) {
      const errorMessage = `Transformation matrix creation failed: ${err instanceof Error ? err.message : String(err)}`;
      console.error('[ERROR][MatrixOperationsAPI]', errorMessage);
      return error(errorMessage);
    }
  }

  /**
   * Batch operations
   */
  async executeBatch(operations: MatrixBatchOperation[]): Promise<Result<MatrixBatchResult, string>> {
    console.log(`[DEBUG][MatrixOperationsAPI] Executing batch of ${operations.length} operations`);
    
    const startTime = Date.now();
    const batchId = this.generateOperationId();
    const results: MatrixOperationResult[] = [];
    let successCount = 0;
    let failureCount = 0;

    try {
      // Sort by priority
      const sortedOps = operations.sort((a, b) => {
        const priority = { high: 3, normal: 2, low: 1 };
        return priority[b.priority] - priority[a.priority];
      });

      for (const op of sortedOps) {
        try {
          // Execute operation based on type
          let result: Result<MatrixOperationResult, string>;
          
          switch (op.operation) {
            case 'add':
              if (op.inputs.length >= 2 && op.inputs[0] && op.inputs[1]) {
                result = await this.add(op.inputs[0], op.inputs[1]);
              } else {
                result = error('Add operation requires 2 matrices');
              }
              break;
            
            case 'multiply':
              if (op.inputs.length >= 2 && op.inputs[0] && op.inputs[1]) {
                result = await this.multiply(op.inputs[0], op.inputs[1]);
              } else {
                result = error('Multiply operation requires 2 matrices');
              }
              break;
            
            case 'transpose':
              if (op.inputs.length >= 1 && op.inputs[0]) {
                result = await this.transpose(op.inputs[0]);
              } else {
                result = error('Transpose operation requires 1 matrix');
              }
              break;
            
            default:
              result = error(`Unsupported batch operation: ${op.operation}`);
          }

          if (result.success) {
            results.push(result.data);
            successCount++;
          } else {
            failureCount++;
            console.error(`[ERROR][MatrixOperationsAPI] Batch operation failed: ${result.error}`);
          }
        } catch (err) {
          failureCount++;
          console.error(`[ERROR][MatrixOperationsAPI] Batch operation error: ${err}`);
        }
      }

      const totalTime = Date.now() - startTime;
      const batchResult: MatrixBatchResult = {
        results,
        totalTime,
        successCount,
        failureCount,
        batchId
      };

      console.log(`[DEBUG][MatrixOperationsAPI] Batch completed: ${successCount} success, ${failureCount} failures in ${totalTime}ms`);
      return success(batchResult);

    } catch (err) {
      const errorMessage = `Batch execution failed: ${err instanceof Error ? err.message : String(err)}`;
      console.error('[ERROR][MatrixOperationsAPI]', errorMessage);
      return error(errorMessage);
    }
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics() {
    return this.cache.getStats();
  }

  /**
   * Clear cache
   */
  clearCache(): Result<void, string> {
    return this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return this.cache.getSizeInfo();
  }
}
