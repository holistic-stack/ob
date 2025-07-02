/**
 * @file Transformation Matrix System
 *
 * Provides sophisticated transformation matrix handling for OpenSCAD AST-to-CSG conversion.
 * Implements proper transformation order (scale → rotate → translate) and matrix composition.
 *
 * Following TypeScript 5.8, DRY, and SRP principles.
 */

import * as THREE from 'three';
import { createLogger } from '../../../../shared/services/logger.service.js';
import type { Result } from '../../../../shared/utils/functional/result.js';
import { error, success } from '../../../../shared/utils/functional/result.js';

const logger = createLogger('TransformationMatrix');

/**
 * Transformation parameters for matrix composition
 */
export interface TransformationParams {
  readonly translation?: readonly [number, number, number];
  readonly rotation?: readonly [number, number, number]; // Euler angles in degrees
  readonly scale?: readonly [number, number, number];
  readonly mirror?: readonly [number, number, number]; // Mirror plane normal
}

/**
 * Transformation matrix error
 */
export interface TransformationError {
  readonly message: string;
  readonly code: string;
  readonly severity: 'error' | 'warning';
}

/**
 * Transformation matrix builder for OpenSCAD operations
 * Handles proper transformation order and matrix composition
 */
export class TransformationMatrix {
  private readonly logger = createLogger('TransformationMatrix');
  private matrix: THREE.Matrix4;

  constructor() {
    this.matrix = new THREE.Matrix4().identity();
    this.logger.debug('TransformationMatrix initialized');
  }

  /**
   * Create a transformation matrix from OpenSCAD parameters
   * Applies transformations in correct order: scale → rotate → translate
   * @param params - Transformation parameters
   * @returns Result with transformation matrix or error
   */
  static createFromParams(
    params: TransformationParams
  ): Result<THREE.Matrix4, TransformationError> {
    try {
      const builder = new TransformationMatrix();

      // Apply transformations in OpenSCAD order: scale → rotate → translate
      if (params.scale) {
        const scaleResult = builder.applyScale(params.scale);
        if (!scaleResult.success) {
          return scaleResult;
        }
      }

      if (params.rotation) {
        const rotateResult = builder.applyRotation(params.rotation);
        if (!rotateResult.success) {
          return rotateResult;
        }
      }

      if (params.translation) {
        const translateResult = builder.applyTranslation(params.translation);
        if (!translateResult.success) {
          return translateResult;
        }
      }

      if (params.mirror) {
        const mirrorResult = builder.applyMirror(params.mirror);
        if (!mirrorResult.success) {
          return mirrorResult;
        }
      }

      logger.debug('Transformation matrix created successfully');
      return success(builder.matrix.clone());
    } catch (err) {
      return error({
        message: `Failed to create transformation matrix: ${err instanceof Error ? err.message : 'Unknown error'}`,
        code: 'TRANSFORMATION_MATRIX_CREATION_FAILURE',
        severity: 'error' as const,
      });
    }
  }

  /**
   * Apply scaling transformation
   * @param scale - Scale factors [x, y, z]
   * @returns Result indicating success or failure
   */
  private applyScale(scale: readonly [number, number, number]): Result<void, TransformationError> {
    try {
      const [x, y, z] = scale;

      // Validate scale factors
      if (x === 0 || y === 0 || z === 0) {
        return error({
          message: `Invalid scale factors: [${x}, ${y}, ${z}]. Scale factors cannot be zero.`,
          code: 'INVALID_SCALE_FACTORS',
          severity: 'error' as const,
        });
      }

      const scaleMatrix = new THREE.Matrix4().makeScale(x, y, z);
      this.matrix.premultiply(scaleMatrix);

      this.logger.debug(`Applied scale transformation: [${x}, ${y}, ${z}]`);
      return success(undefined);
    } catch (err) {
      return error({
        message: `Failed to apply scale transformation: ${err instanceof Error ? err.message : 'Unknown error'}`,
        code: 'SCALE_TRANSFORMATION_FAILURE',
        severity: 'error' as const,
      });
    }
  }

  /**
   * Apply rotation transformation
   * @param rotation - Euler angles in degrees [x, y, z]
   * @returns Result indicating success or failure
   */
  private applyRotation(
    rotation: readonly [number, number, number]
  ): Result<void, TransformationError> {
    try {
      const [x, y, z] = rotation;

      // Convert degrees to radians
      const xRad = (x * Math.PI) / 180;
      const yRad = (y * Math.PI) / 180;
      const zRad = (z * Math.PI) / 180;

      // Create rotation matrix using Euler angles (XYZ order)
      const euler = new THREE.Euler(xRad, yRad, zRad, 'XYZ');
      const rotationMatrix = new THREE.Matrix4().makeRotationFromEuler(euler);
      this.matrix.premultiply(rotationMatrix);

      this.logger.debug(`Applied rotation transformation: [${x}, ${y}, ${z}] degrees`);
      return success(undefined);
    } catch (err) {
      return error({
        message: `Failed to apply rotation transformation: ${err instanceof Error ? err.message : 'Unknown error'}`,
        code: 'ROTATION_TRANSFORMATION_FAILURE',
        severity: 'error' as const,
      });
    }
  }

  /**
   * Apply translation transformation
   * @param translation - Translation vector [x, y, z]
   * @returns Result indicating success or failure
   */
  private applyTranslation(
    translation: readonly [number, number, number]
  ): Result<void, TransformationError> {
    try {
      const [x, y, z] = translation;

      const translationMatrix = new THREE.Matrix4().makeTranslation(x, y, z);
      this.matrix.premultiply(translationMatrix);

      this.logger.debug(`Applied translation transformation: [${x}, ${y}, ${z}]`);
      return success(undefined);
    } catch (err) {
      return error({
        message: `Failed to apply translation transformation: ${err instanceof Error ? err.message : 'Unknown error'}`,
        code: 'TRANSLATION_TRANSFORMATION_FAILURE',
        severity: 'error' as const,
      });
    }
  }

  /**
   * Apply mirror transformation
   * @param normal - Mirror plane normal vector [x, y, z]
   * @returns Result indicating success or failure
   */
  private applyMirror(
    normal: readonly [number, number, number]
  ): Result<void, TransformationError> {
    try {
      const [x, y, z] = normal;

      // Validate normal vector
      const length = Math.sqrt(x * x + y * y + z * z);
      if (length === 0) {
        return error({
          message: 'Invalid mirror normal: cannot be zero vector',
          code: 'INVALID_MIRROR_NORMAL',
          severity: 'error' as const,
        });
      }

      // Normalize the normal vector
      const normalizedX = x / length;
      const normalizedY = y / length;
      const normalizedZ = z / length;

      // Create mirror matrix: I - 2 * n * n^T where n is the normal vector
      const mirrorMatrix = new THREE.Matrix4().set(
        1 - 2 * normalizedX * normalizedX,
        -2 * normalizedX * normalizedY,
        -2 * normalizedX * normalizedZ,
        0,
        -2 * normalizedY * normalizedX,
        1 - 2 * normalizedY * normalizedY,
        -2 * normalizedY * normalizedZ,
        0,
        -2 * normalizedZ * normalizedX,
        -2 * normalizedZ * normalizedY,
        1 - 2 * normalizedZ * normalizedZ,
        0,
        0,
        0,
        0,
        1
      );

      this.matrix.premultiply(mirrorMatrix);

      this.logger.debug(`Applied mirror transformation: normal [${x}, ${y}, ${z}]`);
      return success(undefined);
    } catch (err) {
      return error({
        message: `Failed to apply mirror transformation: ${err instanceof Error ? err.message : 'Unknown error'}`,
        code: 'MIRROR_TRANSFORMATION_FAILURE',
        severity: 'error' as const,
      });
    }
  }

  /**
   * Compose multiple transformation matrices
   * @param matrices - Array of transformation matrices to compose
   * @returns Composed transformation matrix
   */
  static compose(matrices: THREE.Matrix4[]): THREE.Matrix4 {
    const result = new THREE.Matrix4().identity();

    for (const matrix of matrices) {
      result.premultiply(matrix);
    }

    logger.debug(`Composed ${matrices.length} transformation matrices`);
    return result;
  }

  /**
   * Apply transformation matrix to a mesh
   * @param mesh - Three.js mesh to transform
   * @param matrix - Transformation matrix to apply
   * @returns Result indicating success or failure
   */
  static applyToMesh(mesh: THREE.Mesh, matrix: THREE.Matrix4): Result<void, TransformationError> {
    try {
      mesh.applyMatrix4(matrix);
      mesh.updateMatrix();
      mesh.updateMatrixWorld();

      logger.debug('Applied transformation matrix to mesh');
      return success(undefined);
    } catch (err) {
      return error({
        message: `Failed to apply transformation to mesh: ${err instanceof Error ? err.message : 'Unknown error'}`,
        code: 'MESH_TRANSFORMATION_FAILURE',
        severity: 'error' as const,
      });
    }
  }

  /**
   * Get the current transformation matrix
   * @returns Copy of the current transformation matrix
   */
  getMatrix(): THREE.Matrix4 {
    return this.matrix.clone();
  }

  /**
   * Reset the transformation matrix to identity
   */
  reset(): void {
    this.matrix.identity();
    this.logger.debug('Transformation matrix reset to identity');
  }
}
