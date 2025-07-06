/**
 * Matrix Adapter Utilities
 *
 * Utilities for seamless conversion between gl-matrix and Three.js matrices,
 * following functional programming patterns and bulletproof-react organization.
 */

import { mat3, mat4 } from 'gl-matrix';
import type { Euler } from 'three';
import { Matrix3, Matrix4, Quaternion, Vector3 } from 'three';
import { createLogger } from '../../../shared/services/logger.service.js';
import type { Result } from '../../../shared/types/result.types.js';
import { error, success } from '../../../shared/utils/functional/result.js';
import { MATRIX_CONFIG } from '../config/matrix-config.js';
import {
  Matrix,
  type ThreeJSTransformData,
  type TransformationMatrix,
} from '../types/matrix.types.js';

const logger = createLogger('MatrixAdapters');

/**
 * Convert Three.js Matrix3 to gl-matrix mat3
 */
export const fromThreeMatrix3 = (threeMatrix: Matrix3): Result<mat3, string> => {
  logger.debug('Converting Three.js Matrix3 to gl-matrix mat3');

  try {
    const result = mat3.create();
    const elements = threeMatrix.elements;

    // Both Three.js Matrix3 and gl-matrix mat3 use column-major order
    for (let i = 0; i < 9; i++) {
      result[i] = elements[i];
    }

    return success(result);
  } catch (err) {
    const errorMessage = `Failed to convert Three.js Matrix3: ${err instanceof Error ? err.message : String(err)}`;
    logger.error(errorMessage);
    return error(errorMessage);
  }
};

/**
 * Convert Three.js Matrix4 to gl-matrix mat4
 */
export const fromThreeMatrix4 = (threeMatrix: Matrix4): Result<mat4, string> => {
  logger.debug('Converting Three.js Matrix4 to gl-matrix mat4');

  try {
    const result = mat4.create();
    const elements = threeMatrix.elements;

    // Both Three.js Matrix4 and gl-matrix mat4 use column-major order
    for (let i = 0; i < 16; i++) {
      result[i] = elements[i];
    }

    return success(result);
  } catch (err) {
    const errorMessage = `Failed to convert Three.js Matrix4: ${err instanceof Error ? err.message : String(err)}`;
    logger.error(errorMessage);
    return error(errorMessage);
  }
};

/**
 * Convert gl-matrix mat3 to Three.js Matrix3
 */
export const toThreeMatrix3 = (matrix: mat3 | Matrix): Result<Matrix3, string> => {
  logger.debug('Converting gl-matrix mat3 to Three.js Matrix3');

  try {
    // Handle Matrix class instances
    if (matrix instanceof Matrix) {
      if (matrix.rows !== 3 || matrix.columns !== 3) {
        return error(`Matrix must be 3x3, got ${matrix.rows}x${matrix.columns}`);
      }
      const threeMatrix = new Matrix3();
      const elements = [];
      for (let col = 0; col < 3; col++) {
        for (let row = 0; row < 3; row++) {
          elements.push(matrix.get(row, col));
        }
      }
      threeMatrix.fromArray(elements);
      return success(threeMatrix);
    }

    // Handle raw mat3 arrays
    if (matrix.length !== 9) {
      return error(`Matrix must be 3x3 (9 elements), got ${matrix.length} elements`);
    }

    const threeMatrix = new Matrix3();
    // Both gl-matrix mat3 and Three.js Matrix3 use column-major order
    threeMatrix.fromArray(matrix);

    return success(threeMatrix);
  } catch (err) {
    const errorMessage = `Failed to convert to Three.js Matrix3: ${err instanceof Error ? err.message : String(err)}`;
    logger.error(errorMessage);
    return error(errorMessage);
  }
};

/**
 * Convert gl-matrix mat4 to Three.js Matrix4
 */
export const toThreeMatrix4 = (matrix: mat4 | Matrix): Result<Matrix4, string> => {
  logger.debug('Converting gl-matrix mat4 to Three.js Matrix4');

  try {
    // Handle Matrix class instances
    if (matrix instanceof Matrix) {
      if (matrix.rows !== 4 || matrix.columns !== 4) {
        return error(`Matrix must be 4x4, got ${matrix.rows}x${matrix.columns}`);
      }
      const threeMatrix = new Matrix4();
      const elements = [];
      for (let col = 0; col < 4; col++) {
        for (let row = 0; row < 4; row++) {
          elements.push(matrix.get(row, col));
        }
      }
      threeMatrix.fromArray(elements);
      return success(threeMatrix);
    }

    // Handle raw mat4 arrays
    if (matrix.length !== 16) {
      return error(`Matrix must be 4x4 (16 elements), got ${matrix.length} elements`);
    }

    const threeMatrix = new Matrix4();
    // Both gl-matrix mat4 and Three.js Matrix4 use column-major order
    threeMatrix.fromArray(matrix);

    return success(threeMatrix);
  } catch (err) {
    const errorMessage = `Failed to convert to Three.js Matrix4: ${err instanceof Error ? err.message : String(err)}`;
    logger.error(errorMessage);
    return error(errorMessage);
  }
};

/**
 * Convert Three.js transform data to transformation matrix
 */
export const fromTransform = (
  transform: ThreeJSTransformData
): Result<TransformationMatrix, string> => {
  logger.debug('Converting Three.js transform to transformation matrix');

  try {
    const matrixResult = fromThreeMatrix4(transform.matrix);
    if (!matrixResult.success) return matrixResult;

    return success(matrixResult.data as TransformationMatrix);
  } catch (err) {
    const errorMessage = `Failed to convert transform: ${err instanceof Error ? err.message : String(err)}`;
    logger.error(errorMessage);
    return error(errorMessage);
  }
};

/**
 * Convert transformation matrix to Three.js transform data
 */
export const toTransform = (matrix: TransformationMatrix): Result<ThreeJSTransformData, string> => {
  logger.debug('Converting transformation matrix to Three.js transform');

  try {
    const threeMatrixResult = toThreeMatrix4(matrix);
    if (!threeMatrixResult.success) return threeMatrixResult;

    const threeMatrix = threeMatrixResult.data;
    const position = new Vector3();
    const quaternion = new Quaternion();
    const scale = new Vector3();

    threeMatrix.decompose(position, quaternion, scale);

    const normalMatrix = new Matrix3().getNormalMatrix(threeMatrix);

    const transform: ThreeJSTransformData = {
      position,
      rotation: quaternion,
      scale,
      matrix: threeMatrix,
      normalMatrix,
    };

    return success(transform);
  } catch (err) {
    const errorMessage = `Failed to convert to transform: ${err instanceof Error ? err.message : String(err)}`;
    logger.error(errorMessage);
    return error(errorMessage);
  }
};

/**
 * Create matrix from Vector3
 */
export const fromVector3 = (vector: Vector3): Result<mat4, string> => {
  logger.debug('Converting Vector3 to matrix');

  try {
    const result = mat4.create();
    // Set translation components in the matrix
    result[12] = vector.x; // m03
    result[13] = vector.y; // m13
    result[14] = vector.z; // m23
    return success(result);
  } catch (err) {
    const errorMessage = `Failed to convert Vector3: ${err instanceof Error ? err.message : String(err)}`;
    logger.error(errorMessage);
    return error(errorMessage);
  }
};

/**
 * Create matrix from Quaternion
 */
export const fromQuaternion = (quaternion: Quaternion): Result<Matrix, string> => {
  logger.debug('Converting Quaternion to rotation matrix');

  try {
    const matrix4 = new Matrix4().makeRotationFromQuaternion(quaternion);
    // Extract 3x3 rotation part
    const matrix3 = new Matrix3().setFromMatrix4(matrix4);
    const elements = matrix3.elements;

    // Create 3x3 Matrix instance
    const result = new Matrix(3, 3);
    for (let col = 0; col < 3; col++) {
      for (let row = 0; row < 3; row++) {
        result.set(row, col, elements[col * 3 + row]);
      }
    }

    return success(result);
  } catch (err) {
    const errorMessage = `Failed to convert Quaternion: ${err instanceof Error ? err.message : String(err)}`;
    logger.error(errorMessage);
    return error(errorMessage);
  }
};

/**
 * Create matrix from Euler angles
 */
export const fromEuler = (euler: Euler): Result<Matrix, string> => {
  logger.debug('Converting Euler to rotation matrix');

  try {
    const matrix4 = new Matrix4().makeRotationFromEuler(euler);
    // Extract 3x3 rotation part
    const matrix3 = new Matrix3().setFromMatrix4(matrix4);
    const elements = matrix3.elements;

    // Create 3x3 Matrix instance
    const result = new Matrix(3, 3);
    for (let col = 0; col < 3; col++) {
      for (let row = 0; row < 3; row++) {
        result.set(row, col, elements[col * 3 + row]);
      }
    }

    return success(result);
  } catch (err) {
    const errorMessage = `Failed to convert Euler: ${err instanceof Error ? err.message : String(err)}`;
    logger.error(errorMessage);
    return error(errorMessage);
  }
};

/**
 * Matrix factory implementation
 */
export const matrixFactory = {
  identity: (size?: number): Matrix => {
    const actualSize = size || 4;
    logger.debug(`Creating ${actualSize}x${actualSize} identity matrix`);
    return new Matrix(actualSize, actualSize); // Constructor creates identity by default
  },

  zeros: (rows?: number, cols?: number): Matrix => {
    const actualRows = rows || 4;
    const actualCols = cols || 4;
    logger.debug(`Creating ${actualRows}x${actualCols} zero matrix`);
    const data = new Array(actualRows * actualCols).fill(0);
    return new Matrix(actualRows, actualCols, data);
  },

  ones: (rows?: number, cols?: number): Matrix => {
    const actualRows = rows || 4;
    const actualCols = cols || 4;
    logger.debug(`Creating ${actualRows}x${actualCols} ones matrix`);
    const data = new Array(actualRows * actualCols).fill(1);
    return new Matrix(actualRows, actualCols, data);
  },

  random: (rows?: number, cols?: number, min = 0, max = 1): Matrix => {
    const actualRows = rows || 4;
    const actualCols = cols || 4;
    logger.debug(`Creating ${actualRows}x${actualCols} random matrix [${min}, ${max}]`);
    const data = [];
    for (let i = 0; i < actualRows * actualCols; i++) {
      data.push(Math.random() * (max - min) + min);
    }
    return new Matrix(actualRows, actualCols, data);
  },

  diagonal: (values: readonly number[]): Matrix => {
    const size = values.length;
    logger.debug(`Creating ${size}x${size} diagonal matrix with ${values.length} values`);
    const result = new Matrix(size, size);
    // Clear identity and set diagonal values
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        result.set(i, j, i === j ? values[i] : 0);
      }
    }
    return result;
  },

  fromArray: (data: readonly number[][], validate = true): Matrix => {
    logger.debug(`Creating matrix from array ${data.length}x${data[0]?.length || 0}`);

    if (validate) {
      if (data.length === 0) {
        throw new Error('Matrix data cannot be empty');
      }

      const cols = data[0]?.length;
      for (const row of data) {
        if (row.length !== cols) {
          throw new Error('All rows must have the same number of columns');
        }
      }
    }

    const rows = data.length;
    const cols = data[0]?.length || 0;
    const result = new Matrix(rows, cols);

    // Set values from 2D array
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        result.set(row, col, data[row][col] || 0);
      }
    }
    return result;
  },

  fromVector3: (vector: Vector3): Matrix => {
    const result = fromVector3(vector);
    if (!result.success) {
      throw new Error(result.error);
    }
    return Matrix.fromMat4(result.data);
  },

  fromQuaternion: (quaternion: Quaternion): Matrix => {
    const result = fromQuaternion(quaternion);
    if (!result.success) {
      throw new Error(result.error);
    }
    return result.data;
  },

  fromEuler: (euler: Euler): Matrix => {
    const result = fromEuler(euler);
    if (!result.success) {
      throw new Error(result.error);
    }
    return result.data;
  },
};

/**
 * Matrix utilities implementation
 */
export const matrixUtils = {
  isSquare: (matrix: Matrix | mat4): boolean => {
    if (matrix instanceof Matrix) {
      return matrix.rows === matrix.columns;
    }
    return matrix.length === 16; // 4x4 matrix for raw mat4
  },

  isSymmetric: (matrix: Matrix | mat4): boolean => {
    if (matrix instanceof Matrix) {
      if (!matrixUtils.isSquare(matrix)) return false;
      const size = matrix.rows;

      // Check if matrix is symmetric (M[i,j] == M[j,i])
      for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
          const mij = matrix.get(i, j);
          const mji = matrix.get(j, i);
          if (Math.abs(mij - mji) > MATRIX_CONFIG.operations.precision) {
            return false;
          }
        }
      }
      return true;
    }

    // Handle raw mat4
    if (!matrixUtils.isSquare(matrix)) return false;

    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        const mij = matrix[j * 4 + i]; // M[i,j] in column-major
        const mji = matrix[i * 4 + j]; // M[j,i] in column-major
        if (Math.abs(mij - mji) > MATRIX_CONFIG.operations.precision) {
          return false;
        }
      }
    }
    return true;
  },

  isOrthogonal: (matrix: Matrix | mat4): boolean => {
    if (!matrixUtils.isSquare(matrix)) return false;

    try {
      if (matrix instanceof Matrix) {
        // For Matrix instances, check if M * M^T = I
        const size = matrix.rows;
        const tolerance = MATRIX_CONFIG.operations.precision;

        for (let i = 0; i < size; i++) {
          for (let j = 0; j < size; j++) {
            let dotProduct = 0;
            for (let k = 0; k < size; k++) {
              dotProduct += matrix.get(i, k) * matrix.get(j, k);
            }
            const expected = i === j ? 1 : 0;
            if (Math.abs(dotProduct - expected) > tolerance) {
              return false;
            }
          }
        }
        return true;
      }

      // For raw mat4: M * M^T = I
      const transpose = mat4.create();
      mat4.transpose(transpose, matrix);

      const product = mat4.create();
      mat4.multiply(product, matrix, transpose);

      const identity = mat4.create(); // Already identity

      return matrixUtils.equals(product, identity);
    } catch {
      return false;
    }
  },

  isPositiveDefinite: (matrix: Matrix | mat4): boolean => {
    if (!matrixUtils.isSquare(matrix) || !matrixUtils.isSymmetric(matrix)) return false;

    try {
      if (matrix instanceof Matrix) {
        // Check if all diagonal elements are positive (necessary but not sufficient)
        for (let i = 0; i < matrix.rows; i++) {
          if (matrix.get(i, i) <= 0) return false;
        }
        return true;
      }

      // For raw mat4
      for (let i = 0; i < 4; i++) {
        if (matrix[i * 4 + i] <= 0) return false;
      }
      return true;
    } catch {
      return false;
    }
  },

  isSingular: (matrix: Matrix | mat4): boolean => {
    if (!matrixUtils.isSquare(matrix)) return true;

    try {
      if (matrix instanceof Matrix) {
        if (matrix.rows === 4) {
          const mat4Data = matrix.toMat4();
          const det = mat4.determinant(mat4Data);
          return Math.abs(det) < MATRIX_CONFIG.operations.precision;
        } else if (matrix.rows === 3) {
          const mat3Data = matrix.toMat3();
          const det = mat3.determinant(mat3Data);
          return Math.abs(det) < MATRIX_CONFIG.operations.precision;
        } else if (matrix.rows === 2) {
          // For 2x2 matrix: det = a*d - b*c
          const a = matrix.get(0, 0);
          const b = matrix.get(0, 1);
          const c = matrix.get(1, 0);
          const d = matrix.get(1, 1);
          const det = a * d - b * c;
          return Math.abs(det) < MATRIX_CONFIG.operations.precision;
        } else {
          // For other sizes, check if any row/column is all zeros (simple singularity test)
          for (let i = 0; i < matrix.rows; i++) {
            let rowAllZero = true;
            for (let j = 0; j < matrix.columns; j++) {
              if (Math.abs(matrix.get(i, j)) >= MATRIX_CONFIG.operations.precision) {
                rowAllZero = false;
                break;
              }
            }
            if (rowAllZero) return true;
          }
          return false;
        }
      }

      if (!(matrix instanceof Matrix)) {
        const det = mat4.determinant(matrix);
        return Math.abs(det) < MATRIX_CONFIG.operations.precision;
      }

      return false;
    } catch {
      return true;
    }
  },

  equals: (
    a: Matrix | mat4,
    b: Matrix | mat4,
    tolerance = MATRIX_CONFIG.operations.precision
  ): boolean => {
    if (a instanceof Matrix && b instanceof Matrix) {
      if (a.rows !== b.rows || a.columns !== b.columns) return false;

      for (let i = 0; i < a.rows; i++) {
        for (let j = 0; j < a.columns; j++) {
          if (Math.abs(a.get(i, j) - b.get(i, j)) > tolerance) {
            return false;
          }
        }
      }
      return true;
    }

    if (!(a instanceof Matrix) && !(b instanceof Matrix)) {
      if (a.length !== b.length) return false;

      for (let i = 0; i < a.length; i++) {
        if (Math.abs(a[i] - b[i]) > tolerance) {
          return false;
        }
      }
      return true;
    }

    // Mixed types - not equal
    return false;
  },

  hash: (matrix: Matrix | mat4): string => {
    if (matrix instanceof Matrix) {
      const data = matrix.toArray().join(',');
      return `${matrix.rows}x${matrix.columns}_${btoa(data).slice(0, 16)}`;
    }

    const data = Array.from(matrix).join(',');
    return `4x4_${btoa(data).slice(0, 16)}`;
  },

  size: (matrix: Matrix | mat4): readonly [number, number] => {
    if (matrix instanceof Matrix) {
      return [matrix.rows, matrix.columns];
    }
    return [4, 4];
  },

  memoryUsage: (matrix: Matrix | mat4): number => {
    if (matrix instanceof Matrix) {
      return matrix.length * 8 + 64; // 8 bytes per number + overhead
    }
    // Estimate: 4 bytes per number (Float32) + overhead
    return matrix.length * 4 + 64;
  },
};

/**
 * Matrix adapter implementation
 */
export const matrixAdapter = {
  fromThreeMatrix3: (matrix: Matrix3): Matrix => {
    const result = fromThreeMatrix3(matrix);
    if (!result.success) {
      throw new Error(result.error);
    }
    return Matrix.fromMat3(result.data);
  },

  fromThreeMatrix4: (matrix: Matrix4): Matrix => {
    const result = fromThreeMatrix4(matrix);
    if (!result.success) {
      throw new Error(result.error);
    }
    return Matrix.fromMat4(result.data);
  },

  toThreeMatrix3: (matrix: Matrix | mat3): Matrix3 => {
    const result = toThreeMatrix3(matrix);
    if (!result.success) {
      throw new Error(result.error);
    }
    return result.data;
  },

  toThreeMatrix4: (matrix: Matrix | mat4): Matrix4 => {
    const result = toThreeMatrix4(matrix);
    if (!result.success) {
      throw new Error(result.error);
    }
    return result.data;
  },

  fromTransform: (transform: ThreeJSTransformData): Matrix => {
    const result = fromTransform(transform);
    if (!result.success) {
      throw new Error(result.error);
    }
    return Matrix.fromMat4(result.data);
  },

  toTransform: (matrix: Matrix | mat4): ThreeJSTransformData => {
    let transformMatrix: mat4;
    if (matrix instanceof Matrix) {
      transformMatrix = matrix.toMat4();
    } else {
      transformMatrix = matrix;
    }

    const result = toTransform(transformMatrix as TransformationMatrix);
    if (!result.success) {
      throw new Error(result.error);
    }
    return result.data;
  },
};

export const matrix4ToGLMatrix = fromThreeMatrix4;
export const glMatrixToMatrix4 = toThreeMatrix4;
export const matrix3ToGLMatrix = fromThreeMatrix3;
export const glMatrixToMatrix3 = toThreeMatrix3;
export const createIdentityMatrix = matrixFactory.identity;
export const createZeroMatrix = matrixFactory.zeros;
export const createRandomMatrix = matrixFactory.random;

export const validateMatrixDimensions = (matrix: mat4, expectedLength: number): boolean => {
  return matrix.length === expectedLength;
};

export const isValidMatrix4 = (matrix: mat4): boolean => {
  return validateMatrixDimensions(matrix, 16);
};

export const isValidMatrix3 = (matrix: mat3): boolean => {
  return validateMatrixDimensions(matrix, 9);
};
