/**
 * Simplified Matrix Operations API
 *
 * Essential gl-matrix operations for 3D transformations and basic matrix math.
 * Simplified without caching, telemetry, or complex infrastructure.
 */

import { mat4 } from 'gl-matrix';
import { Matrix4 } from 'three';
import type { Result } from '../../../shared/types/result.types';
import { error, success } from '../../../shared/utils/functional/result';

/**
 * Simple result type for matrix operations
 */
export interface SimpleMatrixResult<T = mat4> {
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
  async add(a: mat4, b: mat4): Promise<Result<SimpleMatrixResult<mat4>, string>> {
    return this.executeOperation('add', () => {
      const result = mat4.create();
      mat4.add(result, a, b);
      return result;
    });
  }

  async subtract(a: mat4, b: mat4): Promise<Result<SimpleMatrixResult<mat4>, string>> {
    return this.executeOperation('subtract', () => {
      const result = mat4.create();
      mat4.subtract(result, a, b);
      return result;
    });
  }

  async multiply(a: mat4, b: mat4): Promise<Result<SimpleMatrixResult<mat4>, string>> {
    return this.executeOperation('multiply', () => {
      const result = mat4.create();
      mat4.multiply(result, a, b);
      return result;
    });
  }

  async transpose(matrix: mat4): Promise<Result<SimpleMatrixResult<mat4>, string>> {
    return this.executeOperation('transpose', () => {
      const result = mat4.create();
      mat4.transpose(result, matrix);
      return result;
    });
  }

  async inverse(matrix: mat4): Promise<Result<SimpleMatrixResult<mat4>, string>> {
    return this.executeOperation('inverse', () => {
      const result = mat4.create();
      const success = mat4.invert(result, matrix);
      if (!success) {
        throw new Error('Matrix is not invertible');
      }
      return result;
    });
  }

  /**
   * Three.js integration
   */
  async convertMatrix4ToGLMatrix(
    matrix4: Matrix4
  ): Promise<Result<SimpleMatrixResult<mat4>, string>> {
    return this.executeOperation('convertMatrix4ToGLMatrix', () => {
      const result = mat4.create();
      // Three.js and gl-matrix both use column-major order, so direct copy
      const elements = matrix4.elements;
      for (let i = 0; i < 16; i++) {
        result[i] = elements[i] ?? 0;
      }
      return result;
    });
  }

  async convertGLMatrixToMatrix4(
    matrix: mat4
  ): Promise<Result<SimpleMatrixResult<Matrix4>, string>> {
    return this.executeOperation('convertGLMatrixToMatrix4', () => {
      if (matrix.length !== 16) {
        throw new Error('Matrix must be 4x4 for Three.js Matrix4 conversion');
      }

      const matrix4 = new Matrix4();
      // Both gl-matrix and Three.js use column-major order, so direct copy
      matrix4.fromArray(matrix);
      return matrix4;
    });
  }

  /**
   * Create transformation matrices
   */
  async createTranslationMatrix(
    x: number,
    y: number,
    z: number
  ): Promise<Result<SimpleMatrixResult<mat4>, string>> {
    return this.executeOperation('createTranslationMatrix', () => {
      const result = mat4.create();
      mat4.fromTranslation(result, [x, y, z]);
      return result;
    });
  }

  async createScaleMatrix(
    x: number,
    y: number,
    z: number
  ): Promise<Result<SimpleMatrixResult<mat4>, string>> {
    return this.executeOperation('createScaleMatrix', () => {
      const result = mat4.create();
      mat4.fromScaling(result, [x, y, z]);
      return result;
    });
  }

  async createRotationMatrixX(angle: number): Promise<Result<SimpleMatrixResult<mat4>, string>> {
    return this.executeOperation('createRotationMatrixX', () => {
      const result = mat4.create();
      mat4.fromXRotation(result, angle);
      return result;
    });
  }

  async createRotationMatrixY(angle: number): Promise<Result<SimpleMatrixResult<mat4>, string>> {
    return this.executeOperation('createRotationMatrixY', () => {
      const result = mat4.create();
      mat4.fromYRotation(result, angle);
      return result;
    });
  }

  async createRotationMatrixZ(angle: number): Promise<Result<SimpleMatrixResult<mat4>, string>> {
    return this.executeOperation('createRotationMatrixZ', () => {
      const result = mat4.create();
      mat4.fromZRotation(result, angle);
      return result;
    });
  }

  /**
   * Matrix properties
   */
  async determinant(matrix: mat4): Promise<Result<SimpleMatrixResult<number>, string>> {
    return this.executeOperation('determinant', () => {
      return mat4.determinant(matrix);
    });
  }

  async trace(matrix: mat4): Promise<Result<SimpleMatrixResult<number>, string>> {
    return this.executeOperation('trace', () => {
      // Calculate trace (sum of diagonal elements)
      return matrix[0] + matrix[5] + matrix[10] + matrix[15];
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
