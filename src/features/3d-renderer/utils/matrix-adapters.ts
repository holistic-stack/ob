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
import type {
  MatrixAdapter,
  MatrixFactory,
  MatrixUtils,
  RotationMatrix,
  ThreeJSTransformData,
  TransformationMatrix,
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
export const toThreeMatrix3 = (matrix: mat3): Result<Matrix3, string> => {
  logger.debug('Converting gl-matrix mat3 to Three.js Matrix3');

  try {
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
export const toThreeMatrix4 = (matrix: mat4): Result<Matrix4, string> => {
  logger.debug('Converting gl-matrix mat4 to Three.js Matrix4');

  try {
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
export const fromQuaternion = (quaternion: Quaternion): Result<RotationMatrix, string> => {
  logger.debug('Converting Quaternion to rotation matrix');

  try {
    const matrix4 = new Matrix4().makeRotationFromQuaternion(quaternion);
    const matrixResult = fromThreeMatrix4(matrix4);
    if (!matrixResult.success) return matrixResult;

    return success(matrixResult.data as RotationMatrix);
  } catch (err) {
    const errorMessage = `Failed to convert Quaternion: ${err instanceof Error ? err.message : String(err)}`;
    logger.error(errorMessage);
    return error(errorMessage);
  }
};

/**
 * Create matrix from Euler angles
 */
export const fromEuler = (euler: Euler): Result<RotationMatrix, string> => {
  logger.debug('Converting Euler to rotation matrix');

  try {
    const matrix4 = new Matrix4().makeRotationFromEuler(euler);
    const matrixResult = fromThreeMatrix4(matrix4);
    if (!matrixResult.success) return matrixResult;

    return success(matrixResult.data as RotationMatrix);
  } catch (err) {
    const errorMessage = `Failed to convert Euler: ${err instanceof Error ? err.message : String(err)}`;
    logger.error(errorMessage);
    return error(errorMessage);
  }
};

/**
 * Matrix factory implementation
 */
export const matrixFactory: MatrixFactory = {
  identity: (): mat4 => {
    logger.debug('Creating 4x4 identity matrix');
    return mat4.create(); // gl-matrix creates identity by default
  },

  zeros: (): mat4 => {
    logger.debug('Creating 4x4 zero matrix');
    const result = mat4.create();
    for (let i = 0; i < 16; i++) {
      result[i] = 0;
    }
    return result;
  },

  ones: (): mat4 => {
    logger.debug('Creating 4x4 ones matrix');
    const result = mat4.create();
    for (let i = 0; i < 16; i++) {
      result[i] = 1;
    }
    return result;
  },

  random: (min = 0, max = 1): mat4 => {
    logger.debug(`Creating 4x4 random matrix [${min}, ${max}]`);
    const result = mat4.create();
    for (let i = 0; i < 16; i++) {
      result[i] = Math.random() * (max - min) + min;
    }
    return result;
  },

  diagonal: (values: readonly number[]): mat4 => {
    logger.debug(`Creating diagonal matrix with ${values.length} values`);
    const result = mat4.create();
    // Set diagonal values (indices 0, 5, 10, 15 for 4x4 matrix)
    if (values.length > 0) result[0] = values[0];
    if (values.length > 1) result[5] = values[1];
    if (values.length > 2) result[10] = values[2];
    if (values.length > 3) result[15] = values[3];
    return result;
  },

  fromArray: (data: readonly number[][], validate = true): mat4 => {
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

    const result = mat4.create();
    // Convert 2D array to flat array in column-major order
    for (let col = 0; col < Math.min(4, data[0]?.length || 0); col++) {
      for (let row = 0; row < Math.min(4, data.length); row++) {
        result[col * 4 + row] = data[row][col] || 0;
      }
    }
    return result;
  },

  fromVector3: (vector: Vector3): mat4 => {
    const result = fromVector3(vector);
    if (!result.success) {
      throw new Error(result.error);
    }
    return result.data;
  },

  fromQuaternion: (quaternion: Quaternion): RotationMatrix => {
    const result = fromQuaternion(quaternion);
    if (!result.success) {
      throw new Error(result.error);
    }
    return result.data;
  },

  fromEuler: (euler: Euler): RotationMatrix => {
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
export const matrixUtils: MatrixUtils = {
  isSquare: (matrix: mat4): boolean => matrix.length === 16, // 4x4 matrix

  isSymmetric: (matrix: mat4): boolean => {
    if (!matrixUtils.isSquare(matrix)) return false;

    // Check if matrix is symmetric (M[i,j] == M[j,i])
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

  isOrthogonal: (matrix: mat4): boolean => {
    if (!matrixUtils.isSquare(matrix)) return false;

    try {
      // For orthogonal matrix: M * M^T = I
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

  isPositiveDefinite: (matrix: mat4): boolean => {
    if (!matrixUtils.isSquare(matrix) || !matrixUtils.isSymmetric(matrix)) return false;

    try {
      // Simplified positive definite test - check if all diagonal elements are positive
      // This is a necessary but not sufficient condition
      for (let i = 0; i < 4; i++) {
        if (matrix[i * 4 + i] <= 0) return false;
      }
      return true;
    } catch {
      return false;
    }
  },

  isSingular: (matrix: mat4): boolean => {
    if (!matrixUtils.isSquare(matrix)) return true;

    try {
      const det = mat4.determinant(matrix);
      return Math.abs(det) < MATRIX_CONFIG.operations.precision;
    } catch {
      return true;
    }
  },

  equals: (a: mat4, b: mat4, tolerance = MATRIX_CONFIG.operations.precision): boolean => {
    if (a.length !== b.length) return false;

    for (let i = 0; i < a.length; i++) {
      if (Math.abs(a[i] - b[i]) > tolerance) {
        return false;
      }
    }
    return true;
  },

  hash: (matrix: mat4): string => {
    const data = Array.from(matrix).join(',');
    return `4x4_${btoa(data).slice(0, 16)}`;
  },

  size: (matrix: mat4): readonly [number, number] => [4, 4],

  memoryUsage: (matrix: mat4): number => {
    // Estimate: 4 bytes per number (Float32) + overhead
    return matrix.length * 4 + 64;
  },
};

/**
 * Matrix adapter implementation
 */
export const matrixAdapter: MatrixAdapter = {
  fromThreeMatrix3: (matrix: Matrix3): mat3 => {
    const result = fromThreeMatrix3(matrix);
    if (!result.success) {
      throw new Error(result.error);
    }
    return result.data;
  },

  fromThreeMatrix4: (matrix: Matrix4): mat4 => {
    const result = fromThreeMatrix4(matrix);
    if (!result.success) {
      throw new Error(result.error);
    }
    return result.data;
  },

  toThreeMatrix3: (matrix: mat3): Matrix3 => {
    const result = toThreeMatrix3(matrix);
    if (!result.success) {
      throw new Error(result.error);
    }
    return result.data;
  },

  toThreeMatrix4: (matrix: mat4): Matrix4 => {
    const result = toThreeMatrix4(matrix);
    if (!result.success) {
      throw new Error(result.error);
    }
    return result.data;
  },

  fromTransform: (transform: ThreeJSTransformData): TransformationMatrix => {
    const result = fromTransform(transform);
    if (!result.success) {
      throw new Error(result.error);
    }
    return result.data;
  },

  toTransform: (matrix: TransformationMatrix): ThreeJSTransformData => {
    const result = toTransform(matrix);
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

export const validateMatrixDimensions = (
  matrix: mat4,
  expectedLength: number
): boolean => {
  return matrix.length === expectedLength;
};

export const isValidMatrix4 = (matrix: mat4): boolean => {
  return validateMatrixDimensions(matrix, 16);
};

export const isValidMatrix3 = (matrix: mat3): boolean => {
  return validateMatrixDimensions(matrix, 9);
};
