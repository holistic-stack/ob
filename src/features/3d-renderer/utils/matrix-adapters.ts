/**
 * Matrix Adapter Utilities
 *
 * Utilities for seamless conversion between ml-matrix and Three.js matrices,
 * following functional programming patterns and bulletproof-react organization.
 */

import { CholeskyDecomposition, determinant, Matrix } from 'ml-matrix';
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
 * Convert Three.js Matrix3 to ml-matrix
 */
export const fromThreeMatrix3 = (threeMatrix: Matrix3): Result<Matrix, string> => {
  logger.debug('Converting Three.js Matrix3 to ml-matrix');

  try {
    const elements = threeMatrix.elements;
    const data = [
      [elements[0], elements[3], elements[6]],
      [elements[1], elements[4], elements[7]],
      [elements[2], elements[5], elements[8]],
    ];

    const matrix = new Matrix(data);
    return success(matrix);
  } catch (err) {
    const errorMessage = `Failed to convert Three.js Matrix3: ${err instanceof Error ? err.message : String(err)}`;
    logger.error(errorMessage);
    return error(errorMessage);
  }
};

/**
 * Convert Three.js Matrix4 to ml-matrix
 */
export const fromThreeMatrix4 = (threeMatrix: Matrix4): Result<Matrix, string> => {
  logger.debug('Converting Three.js Matrix4 to ml-matrix');

  try {
    const elements = threeMatrix.elements;
    const data = [
      [elements[0], elements[4], elements[8], elements[12]],
      [elements[1], elements[5], elements[9], elements[13]],
      [elements[2], elements[6], elements[10], elements[14]],
      [elements[3], elements[7], elements[11], elements[15]],
    ];

    const matrix = new Matrix(data);
    return success(matrix);
  } catch (err) {
    const errorMessage = `Failed to convert Three.js Matrix4: ${err instanceof Error ? err.message : String(err)}`;
    logger.error(errorMessage);
    return error(errorMessage);
  }
};

/**
 * Convert ml-matrix to Three.js Matrix3
 */
export const toThreeMatrix3 = (matrix: Matrix): Result<Matrix3, string> => {
  logger.debug('Converting ml-matrix to Three.js Matrix3');

  try {
    if (matrix.rows !== 3 || matrix.columns !== 3) {
      return error(`Matrix must be 3x3, got ${matrix.rows}x${matrix.columns}`);
    }

    const threeMatrix = new Matrix3();
    threeMatrix.set(
      matrix.get(0, 0),
      matrix.get(0, 1),
      matrix.get(0, 2),
      matrix.get(1, 0),
      matrix.get(1, 1),
      matrix.get(1, 2),
      matrix.get(2, 0),
      matrix.get(2, 1),
      matrix.get(2, 2)
    );

    return success(threeMatrix);
  } catch (err) {
    const errorMessage = `Failed to convert to Three.js Matrix3: ${err instanceof Error ? err.message : String(err)}`;
    logger.error(errorMessage);
    return error(errorMessage);
  }
};

/**
 * Convert ml-matrix to Three.js Matrix4
 */
export const toThreeMatrix4 = (matrix: Matrix): Result<Matrix4, string> => {
  logger.debug('Converting ml-matrix to Three.js Matrix4');

  try {
    if (matrix.rows !== 4 || matrix.columns !== 4) {
      return error(`Matrix must be 4x4, got ${matrix.rows}x${matrix.columns}`);
    }

    const threeMatrix = new Matrix4();
    threeMatrix.set(
      matrix.get(0, 0),
      matrix.get(0, 1),
      matrix.get(0, 2),
      matrix.get(0, 3),
      matrix.get(1, 0),
      matrix.get(1, 1),
      matrix.get(1, 2),
      matrix.get(1, 3),
      matrix.get(2, 0),
      matrix.get(2, 1),
      matrix.get(2, 2),
      matrix.get(2, 3),
      matrix.get(3, 0),
      matrix.get(3, 1),
      matrix.get(3, 2),
      matrix.get(3, 3)
    );

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
export const fromVector3 = (vector: Vector3): Result<Matrix, string> => {
  logger.debug('Converting Vector3 to matrix');

  try {
    const data = [[vector.x], [vector.y], [vector.z]];
    const matrix = new Matrix(data);
    return success(matrix);
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
    const matrix3 = new Matrix3().setFromMatrix4(matrix4);

    const matrixResult = fromThreeMatrix3(matrix3);
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
    const matrix3 = new Matrix3().setFromMatrix4(matrix4);

    const matrixResult = fromThreeMatrix3(matrix3);
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
  identity: (size: number): Matrix => {
    logger.debug(`Creating ${size}x${size} identity matrix`);
    return Matrix.eye(size);
  },

  zeros: (rows: number, cols: number): Matrix => {
    logger.debug(`Creating ${rows}x${cols} zero matrix`);
    return Matrix.zeros(rows, cols);
  },

  ones: (rows: number, cols: number): Matrix => {
    logger.debug(`Creating ${rows}x${cols} ones matrix`);
    return Matrix.ones(rows, cols);
  },

  random: (rows: number, cols: number, min = 0, max = 1): Matrix => {
    logger.debug(`Creating ${rows}x${cols} random matrix [${min}, ${max}]`);
    return Matrix.random(rows, cols);
  },

  diagonal: (values: readonly number[]): Matrix => {
    logger.debug(`Creating diagonal matrix with ${values.length} values`);
    return Matrix.diag(values);
  },

  fromArray: (data: readonly number[][], validate = true): Matrix => {
    logger.debug(
      `Creating matrix from array ${data.length}x${data[0]?.length || 0}`
    );

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

    return new Matrix(data);
  },

  fromVector3: (vector: Vector3): Matrix => {
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
  isSquare: (matrix: Matrix): boolean => matrix.rows === matrix.columns,

  isSymmetric: (matrix: Matrix): boolean => {
    if (!matrixUtils.isSquare(matrix)) return false;

    for (let i = 0; i < matrix.rows; i++) {
      for (let j = 0; j < matrix.columns; j++) {
        if (Math.abs(matrix.get(i, j) - matrix.get(j, i)) > MATRIX_CONFIG.operations.precision) {
          return false;
        }
      }
    }
    return true;
  },

  isOrthogonal: (matrix: Matrix): boolean => {
    if (!matrixUtils.isSquare(matrix)) return false;

    try {
      const transpose = matrix.transpose();
      const product = matrix.mmul(transpose);
      const identity = Matrix.eye(matrix.rows);

      return matrixUtils.equals(product, identity);
    } catch {
      return false;
    }
  },

  isPositiveDefinite: (matrix: Matrix): boolean => {
    if (!matrixUtils.isSquare(matrix) || !matrixUtils.isSymmetric(matrix)) return false;

    try {
      // Use Cholesky decomposition test for positive definiteness
      new CholeskyDecomposition(matrix);
      return true;
    } catch {
      return false;
    }
  },

  isSingular: (matrix: Matrix): boolean => {
    if (!matrixUtils.isSquare(matrix)) return true;

    try {
      const det = determinant(matrix);
      return Math.abs(det) < MATRIX_CONFIG.operations.precision;
    } catch {
      return true;
    }
  },

  equals: (a: Matrix, b: Matrix, tolerance = MATRIX_CONFIG.operations.precision): boolean => {
    if (a.rows !== b.rows || a.columns !== b.columns) return false;

    for (let i = 0; i < a.rows; i++) {
      for (let j = 0; j < a.columns; j++) {
        if (Math.abs(a.get(i, j) - b.get(i, j)) > tolerance) {
          return false;
        }
      }
    }
    return true;
  },

  hash: (matrix: Matrix): string => {
    const data = matrix.to2DArray().flat().join(',');
    return `${matrix.rows}x${matrix.columns}_${btoa(data).slice(0, 16)}`;
  },

  size: (matrix: Matrix): readonly [number, number] => [matrix.rows, matrix.columns],

  memoryUsage: (matrix: Matrix): number => {
    // Estimate: 8 bytes per number (Float64) + overhead
    return matrix.rows * matrix.columns * 8 + 64;
  },
};

/**
 * Matrix adapter implementation
 */
export const matrixAdapter: MatrixAdapter = {
  fromThreeMatrix3: (matrix: Matrix3): Matrix => {
    const result = fromThreeMatrix3(matrix);
    if (!result.success) {
      throw new Error(result.error);
    }
    return result.data;
  },

  fromThreeMatrix4: (matrix: Matrix4): Matrix => {
    const result = fromThreeMatrix4(matrix);
    if (!result.success) {
      throw new Error(result.error);
    }
    return result.data;
  },

  toThreeMatrix3: (matrix: Matrix): Matrix3 => {
    const result = toThreeMatrix3(matrix);
    if (!result.success) {
      throw new Error(result.error);
    }
    return result.data;
  },

  toThreeMatrix4: (matrix: Matrix): Matrix4 => {
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

export const matrix4ToMLMatrix = fromThreeMatrix4;
export const mlMatrixToMatrix4 = toThreeMatrix4;
export const matrix3ToMLMatrix = fromThreeMatrix3;
export const mlMatrixToMatrix3 = toThreeMatrix3;
export const createIdentityMatrix = matrixFactory.identity;
export const createZeroMatrix = matrixFactory.zeros;
export const createRandomMatrix = matrixFactory.random;

export const validateMatrixDimensions = (
  matrix: Matrix,
  expectedRows: number,
  expectedCols: number
): boolean => {
  return matrix.rows === expectedRows && matrix.columns === expectedCols;
};

export const isValidMatrix4 = (matrix: Matrix): boolean => {
  return validateMatrixDimensions(matrix, 4, 4);
};

export const isValidMatrix3 = (matrix: Matrix): boolean => {
  return validateMatrixDimensions(matrix, 3, 3);
};
