/**
 * Simplified Matrix Operations API
 *
 * Essential ml-matrix operations for 3D transformations and basic matrix math.
 * Simplified without caching, telemetry, or complex infrastructure.
 */

import { inverse, Matrix } from 'ml-matrix';
import { Matrix4 } from 'three';
import type { Result } from '../../../shared/types/result.types';
import { error, success } from '../../../shared/utils/functional/result';

/**
 * Simple result type for matrix operations
 */
export interface SimpleMatrixResult<T = Matrix> {
  result: T;
  executionTime: number;
}

/**
 * Simplified Matrix Operations API
 */
export class MatrixOperationsAPI {
  constructor() {
    // Minimal initialization
  }

  /**
   * Execute operation with basic error handling
   */
  private async executeOperation<T>(
    operationName: string,
    operationFn: () => T
  ): Promise<Result<SimpleMatrixResult<T>, string>> {
    const startTime = Date.now();
    
    try {
      const result = operationFn();
      const executionTime = Date.now() - startTime;
      
      return success({
        result,
        executionTime,
      });
    } catch (err) {
      const errorMessage = `Operation ${operationName} failed: ${err instanceof Error ? err.message : String(err)}`;
      return error(errorMessage);
    }
  }

  /**
   * Basic matrix operations
   */
  async add(a: Matrix, b: Matrix): Promise<Result<SimpleMatrixResult<Matrix>, string>> {
    return this.executeOperation('add', () => a.add(b));
  }

  async subtract(a: Matrix, b: Matrix): Promise<Result<SimpleMatrixResult<Matrix>, string>> {
    return this.executeOperation('subtract', () => a.sub(b));
  }

  async multiply(a: Matrix, b: Matrix): Promise<Result<SimpleMatrixResult<Matrix>, string>> {
    return this.executeOperation('multiply', () => a.mmul(b));
  }

  async transpose(matrix: Matrix): Promise<Result<SimpleMatrixResult<Matrix>, string>> {
    return this.executeOperation('transpose', () => matrix.transpose());
  }

  async inverse(matrix: Matrix): Promise<Result<SimpleMatrixResult<Matrix>, string>> {
    return this.executeOperation('inverse', () => inverse(matrix));
  }

  /**
   * Three.js integration
   */
  async convertMatrix4ToMLMatrix(matrix4: Matrix4): Promise<Result<SimpleMatrixResult<Matrix>, string>> {
    return this.executeOperation('convertMatrix4ToMLMatrix', () => {
      const elements = matrix4.elements;
      // Three.js uses column-major order, convert to row-major for ml-matrix
      return new Matrix([
        [elements[0], elements[4], elements[8], elements[12]],
        [elements[1], elements[5], elements[9], elements[13]],
        [elements[2], elements[6], elements[10], elements[14]],
        [elements[3], elements[7], elements[11], elements[15]],
      ]);
    });
  }

  async convertMLMatrixToMatrix4(matrix: Matrix): Promise<Result<SimpleMatrixResult<Matrix4>, string>> {
    return this.executeOperation('convertMLMatrixToMatrix4', () => {
      if (matrix.rows !== 4 || matrix.columns !== 4) {
        throw new Error('Matrix must be 4x4 for Three.js Matrix4 conversion');
      }
      
      const matrix4 = new Matrix4();
      // Convert from row-major (ml-matrix) to column-major (Three.js)
      matrix4.set(
        matrix.get(0, 0), matrix.get(0, 1), matrix.get(0, 2), matrix.get(0, 3),
        matrix.get(1, 0), matrix.get(1, 1), matrix.get(1, 2), matrix.get(1, 3),
        matrix.get(2, 0), matrix.get(2, 1), matrix.get(2, 2), matrix.get(2, 3),
        matrix.get(3, 0), matrix.get(3, 1), matrix.get(3, 2), matrix.get(3, 3)
      );
      
      return matrix4;
    });
  }

  /**
   * Create transformation matrices
   */
  async createTranslationMatrix(x: number, y: number, z: number): Promise<Result<SimpleMatrixResult<Matrix>, string>> {
    return this.executeOperation('createTranslationMatrix', () => {
      return new Matrix([
        [1, 0, 0, x],
        [0, 1, 0, y],
        [0, 0, 1, z],
        [0, 0, 0, 1],
      ]);
    });
  }

  async createScaleMatrix(x: number, y: number, z: number): Promise<Result<SimpleMatrixResult<Matrix>, string>> {
    return this.executeOperation('createScaleMatrix', () => {
      return new Matrix([
        [x, 0, 0, 0],
        [0, y, 0, 0],
        [0, 0, z, 0],
        [0, 0, 0, 1],
      ]);
    });
  }

  async createRotationMatrixX(angle: number): Promise<Result<SimpleMatrixResult<Matrix>, string>> {
    return this.executeOperation('createRotationMatrixX', () => {
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      return new Matrix([
        [1, 0, 0, 0],
        [0, cos, -sin, 0],
        [0, sin, cos, 0],
        [0, 0, 0, 1],
      ]);
    });
  }

  async createRotationMatrixY(angle: number): Promise<Result<SimpleMatrixResult<Matrix>, string>> {
    return this.executeOperation('createRotationMatrixY', () => {
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      return new Matrix([
        [cos, 0, sin, 0],
        [0, 1, 0, 0],
        [-sin, 0, cos, 0],
        [0, 0, 0, 1],
      ]);
    });
  }

  async createRotationMatrixZ(angle: number): Promise<Result<SimpleMatrixResult<Matrix>, string>> {
    return this.executeOperation('createRotationMatrixZ', () => {
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      return new Matrix([
        [cos, -sin, 0, 0],
        [sin, cos, 0, 0],
        [0, 0, 1, 0],
        [0, 0, 0, 1],
      ]);
    });
  }

  /**
   * Matrix properties
   */
  async determinant(matrix: Matrix): Promise<Result<SimpleMatrixResult<number>, string>> {
    return this.executeOperation('determinant', () => {
      // Simple determinant calculation for 2x2 and 3x3 matrices
      if (matrix.rows === 2 && matrix.columns === 2) {
        return matrix.get(0, 0) * matrix.get(1, 1) - matrix.get(0, 1) * matrix.get(1, 0);
      }
      if (matrix.rows === 3 && matrix.columns === 3) {
        const a = matrix.get(0, 0), b = matrix.get(0, 1), c = matrix.get(0, 2);
        const d = matrix.get(1, 0), e = matrix.get(1, 1), f = matrix.get(1, 2);
        const g = matrix.get(2, 0), h = matrix.get(2, 1), i = matrix.get(2, 2);
        return a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);
      }
      throw new Error('Determinant calculation only supported for 2x2 and 3x3 matrices');
    });
  }

  async trace(matrix: Matrix): Promise<Result<SimpleMatrixResult<number>, string>> {
    return this.executeOperation('trace', () => {
      if (matrix.rows !== matrix.columns) {
        throw new Error('Trace can only be calculated for square matrices');
      }
      let trace = 0;
      for (let i = 0; i < matrix.rows; i++) {
        trace += matrix.get(i, i);
      }
      return trace;
    });
  }

  /**
   * Get basic performance metrics
   */
  getPerformanceMetrics() {
    return {
      operationCount: 0,
      totalExecutionTime: 0,
      averageExecutionTime: 0,
      cacheHitRate: 0, // No caching in simplified version
      memoryUsage: 0,
    };
  }
}
