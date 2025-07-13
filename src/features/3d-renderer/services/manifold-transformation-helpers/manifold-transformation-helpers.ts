/**
 * @file Manifold Transformation Helpers
 * @description Enhanced transformation methods using Manifold native API
 * Follows SRP: Single responsibility for Manifold transformation operations
 */

import { createLogger } from '../../../../shared/services/logger.service';
import type { Result } from '../../../../shared/types/result.types';
import type { ManifoldWasmObject } from '../three-manifold-converter/three-manifold-converter';

const logger = createLogger('ManifoldTransformationHelpers');

/**
 * Transformation options for creating matrices
 */
interface TransformationOptions {
  readonly translation?: readonly [number, number, number];
  readonly rotation?: {
    readonly axis: readonly [number, number, number];
    readonly angle: number;
  };
  readonly scale?: readonly [number, number, number];
}

/**
 * Translate a Manifold object using native Manifold API
 * Pure function with no side effects
 *
 * @param manifoldObject - Manifold object to translate
 * @param translation - Translation vector [x, y, z]
 * @returns Result with translated Manifold object or error
 *
 * @example
 * ```typescript
 * const result = translateManifold(manifoldObj, [2, 3, 4]);
 * if (result.success) {
 *   const translatedObj = result.data;
 *   // Use translated object...
 *   translatedObj.delete(); // Clean up
 * }
 * ```
 */
export function translateManifold(
  manifoldObject: ManifoldWasmObject,
  translation: readonly [number, number, number]
): Result<ManifoldWasmObject, string> {
  // Input validation
  if (!manifoldObject) {
    return { success: false, error: 'Manifold object is null or undefined' };
  }

  if (!translation || translation.length !== 3) {
    return { success: false, error: 'Invalid translation vector: must have exactly 3 components' };
  }

  if (translation.some(v => !Number.isFinite(v))) {
    return { success: false, error: 'Invalid translation vector: all components must be finite numbers' };
  }

  try {
    // Create translation matrix
    const matrixResult = createTransformationMatrix({ translation });
    if (!matrixResult.success) {
      return { success: false, error: `Failed to create translation matrix: ${matrixResult.error}` };
    }

    // Apply transformation using Manifold's native transform method
    const transformedObject = manifoldObject.transform(matrixResult.data) as ManifoldWasmObject;

    logger.debug('Successfully translated Manifold object', {
      translation: Array.from(translation),
    });

    return { success: true, data: transformedObject };
  } catch (error) {
    const errorMessage = `Manifold translation failed: ${error instanceof Error ? error.message : String(error)}`;
    logger.error(errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Rotate a Manifold object around an axis using native Manifold API
 * Pure function with no side effects
 *
 * @param manifoldObject - Manifold object to rotate
 * @param axis - Rotation axis vector [x, y, z] (will be normalized)
 * @param angle - Rotation angle in radians
 * @returns Result with rotated Manifold object or error
 */
export function rotateManifold(
  manifoldObject: ManifoldWasmObject,
  axis: readonly [number, number, number],
  angle: number
): Result<ManifoldWasmObject, string> {
  // Input validation
  if (!manifoldObject) {
    return { success: false, error: 'Manifold object is null or undefined' };
  }

  if (!axis || axis.length !== 3) {
    return { success: false, error: 'Invalid rotation axis: must have exactly 3 components' };
  }

  if (axis.every(v => v === 0)) {
    return { success: false, error: 'Invalid rotation axis: cannot be zero vector' };
  }

  if (!Number.isFinite(angle)) {
    return { success: false, error: 'Invalid rotation angle: must be a finite number' };
  }

  try {
    // Create rotation matrix
    const matrixResult = createTransformationMatrix({ rotation: { axis, angle } });
    if (!matrixResult.success) {
      return { success: false, error: `Failed to create rotation matrix: ${matrixResult.error}` };
    }

    // Apply transformation using Manifold's native transform method
    const transformedObject = manifoldObject.transform(matrixResult.data) as ManifoldWasmObject;

    logger.debug('Successfully rotated Manifold object', {
      axis: Array.from(axis),
      angle,
    });

    return { success: true, data: transformedObject };
  } catch (error) {
    const errorMessage = `Manifold rotation failed: ${error instanceof Error ? error.message : String(error)}`;
    logger.error(errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Scale a Manifold object using native Manifold API
 * Pure function with no side effects
 *
 * @param manifoldObject - Manifold object to scale
 * @param scale - Scale factors [x, y, z]
 * @returns Result with scaled Manifold object or error
 */
export function scaleManifold(
  manifoldObject: ManifoldWasmObject,
  scale: readonly [number, number, number]
): Result<ManifoldWasmObject, string> {
  // Input validation
  if (!manifoldObject) {
    return { success: false, error: 'Manifold object is null or undefined' };
  }

  if (!scale || scale.length !== 3) {
    return { success: false, error: 'Invalid scale factors: must have exactly 3 components' };
  }

  if (scale.some(v => !Number.isFinite(v) || v === 0)) {
    return { success: false, error: 'Invalid scale factor: all components must be finite non-zero numbers' };
  }

  try {
    // Create scale matrix
    const matrixResult = createTransformationMatrix({ scale });
    if (!matrixResult.success) {
      return { success: false, error: `Failed to create scale matrix: ${matrixResult.error}` };
    }

    // Apply transformation using Manifold's native transform method
    const transformedObject = manifoldObject.transform(matrixResult.data) as ManifoldWasmObject;

    logger.debug('Successfully scaled Manifold object', {
      scale: Array.from(scale),
    });

    return { success: true, data: transformedObject };
  } catch (error) {
    const errorMessage = `Manifold scaling failed: ${error instanceof Error ? error.message : String(error)}`;
    logger.error(errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Create a 4x4 transformation matrix from transformation options
 * Pure function with no side effects
 *
 * @param options - Transformation options (translation, rotation, scale)
 * @returns Result with 4x4 transformation matrix (column-major order)
 */
export function createTransformationMatrix(
  options: TransformationOptions
): Result<readonly number[], string> {
  try {
    // Start with identity matrix (column-major order)
    const matrix = [
      1, 0, 0, 0,  // Column 0
      0, 1, 0, 0,  // Column 1
      0, 0, 1, 0,  // Column 2
      0, 0, 0, 1   // Column 3
    ];

    // Apply scale transformation
    if (options.scale) {
      const [sx, sy, sz] = options.scale;
      matrix[0] *= sx;  // M[0][0]
      matrix[5] *= sy;  // M[1][1]
      matrix[10] *= sz; // M[2][2]
    }

    // Apply rotation transformation
    if (options.rotation) {
      const { axis, angle } = options.rotation;
      const rotationMatrix = createRotationMatrix(axis, angle);
      if (!rotationMatrix.success) {
        return rotationMatrix;
      }
      
      // Multiply current matrix with rotation matrix
      multiplyMatrices(matrix, rotationMatrix.data);
    }

    // Apply translation transformation
    if (options.translation) {
      const [tx, ty, tz] = options.translation;
      matrix[12] = tx; // M[0][3]
      matrix[13] = ty; // M[1][3]
      matrix[14] = tz; // M[2][3]
    }

    return { success: true, data: Object.freeze(matrix) };
  } catch (error) {
    const errorMessage = `Failed to create transformation matrix: ${error instanceof Error ? error.message : String(error)}`;
    logger.error(errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Create a rotation matrix from axis and angle
 * Pure function implementing Rodrigues' rotation formula
 */
function createRotationMatrix(
  axis: readonly [number, number, number],
  angle: number
): Result<number[], string> {
  try {
    // Normalize the axis
    const [x, y, z] = axis;
    const length = Math.sqrt(x * x + y * y + z * z);
    if (length === 0) {
      return { success: false, error: 'Cannot normalize zero-length axis vector' };
    }

    const nx = x / length;
    const ny = y / length;
    const nz = z / length;

    // Rodrigues' rotation formula
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const oneMinusCos = 1 - cos;

    const matrix = [
      cos + nx * nx * oneMinusCos,           ny * nx * oneMinusCos + nz * sin,     nz * nx * oneMinusCos - ny * sin,     0,
      nx * ny * oneMinusCos - nz * sin,     cos + ny * ny * oneMinusCos,           nz * ny * oneMinusCos + nx * sin,     0,
      nx * nz * oneMinusCos + ny * sin,     ny * nz * oneMinusCos - nx * sin,     cos + nz * nz * oneMinusCos,           0,
      0,                                     0,                                     0,                                     1
    ];

    return { success: true, data: matrix };
  } catch (error) {
    return { success: false, error: `Failed to create rotation matrix: ${error}` };
  }
}

/**
 * Multiply two 4x4 matrices in place (modifies the first matrix)
 * Helper function for matrix composition
 */
function multiplyMatrices(a: number[], b: readonly number[]): void {
  const result = new Array(16);
  
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      result[i * 4 + j] = 
        a[i * 4 + 0] * b[0 * 4 + j] +
        a[i * 4 + 1] * b[1 * 4 + j] +
        a[i * 4 + 2] * b[2 * 4 + j] +
        a[i * 4 + 3] * b[3 * 4 + j];
    }
  }
  
  // Copy result back to a
  for (let i = 0; i < 16; i++) {
    a[i] = result[i];
  }
}
