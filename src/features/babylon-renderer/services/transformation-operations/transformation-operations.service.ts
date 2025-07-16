/**
 * @file BabylonJS Transformation Operations Service
 *
 * Service for applying OpenSCAD transformation operations to GenericMeshData.
 * Implements translation, rotation, scale, mirror, matrix, and color operations
 * with OpenSCAD-compatible semantics.
 *
 * @example
 * ```typescript
 * const transformService = new TransformationOperationsService();
 * const translatedMesh = await transformService.translate(meshData, [10, 0, 0]);
 * const rotatedMesh = await transformService.rotate(meshData, [0, 0, 90]);
 * ```
 */

import { Matrix, Vector3 } from '@babylonjs/core';
import { createLogger } from '../../../../shared/services/logger.service';
import type { Result } from '../../../../shared/types/result.types';
import { tryCatchAsync } from '../../../../shared/utils/functional/result';
import type {
  GenericGeometry,
  GenericMaterialConfig,
  GenericMeshData,
  GenericMeshMetadata,
} from '../../types/generic-mesh-data.types';
import { MATERIAL_PRESETS } from '../../types/generic-mesh-data.types';
import { createBoundingBoxFromGeometry } from '../../utils/generic-mesh-utils';

const logger = createLogger('TransformationOperations');

/**
 * OpenSCAD translation parameters
 */
export interface OpenSCADTranslateParams {
  readonly vector: readonly [number, number, number];
}

/**
 * OpenSCAD rotation parameters
 */
export interface OpenSCADRotateParams {
  readonly angle?: number; // Single angle for Z-axis rotation
  readonly vector?: readonly [number, number, number]; // [x, y, z] Euler angles
  readonly axis?: readonly [number, number, number]; // Rotation axis for angle/axis rotation
}

/**
 * OpenSCAD scale parameters
 */
export interface OpenSCADScaleParams {
  readonly factor: number | readonly [number, number, number];
}

/**
 * OpenSCAD mirror parameters
 */
export interface OpenSCADMirrorParams {
  readonly normal: readonly [number, number, number];
}

/**
 * OpenSCAD matrix parameters
 */
export interface OpenSCADMatrixParams {
  readonly matrix: readonly [
    readonly [number, number, number, number],
    readonly [number, number, number, number],
    readonly [number, number, number, number],
    readonly [number, number, number, number],
  ];
}

/**
 * OpenSCAD color parameters
 */
export interface OpenSCADColorParams {
  readonly color:
    | string
    | readonly [number, number, number]
    | readonly [number, number, number, number];
  readonly alpha?: number;
}

/**
 * Transformation operation error
 */
export interface TransformationError {
  readonly code:
    | 'INVALID_PARAMETERS'
    | 'TRANSFORMATION_FAILED'
    | 'GEOMETRY_INVALID'
    | 'MATRIX_INVALID';
  readonly message: string;
  readonly operationType: string;
  readonly timestamp: Date;
  readonly details?: Record<string, unknown>;
}

/**
 * BabylonJS Transformation Operations Service
 *
 * Applies OpenSCAD transformation operations to GenericMeshData with
 * proper parameter handling and OpenSCAD-compatible semantics.
 */
export class TransformationOperationsService {
  constructor() {
    logger.init('[INIT] TransformationOperations service initialized');
  }

  /**
   * Apply translation transformation to mesh data
   */
  async translate(
    meshData: GenericMeshData,
    params: OpenSCADTranslateParams
  ): Promise<Result<GenericMeshData, TransformationError>> {
    logger.debug('[TRANSLATE] Applying translation transformation...');
    const startTime = performance.now();

    return tryCatchAsync(
      async () => {
        // Validate parameters
        if (!params.vector || params.vector.length !== 3) {
          throw this.createError(
            'INVALID_PARAMETERS',
            'translate',
            'Translation vector must have 3 components'
          );
        }

        // Create translation matrix
        const translationMatrix = Matrix.Translation(
          params.vector[0],
          params.vector[1],
          params.vector[2]
        );

        // Apply transformation to geometry
        const transformedGeometry = this.transformGeometry(meshData.geometry, translationMatrix);

        // Create new mesh data with transformed geometry
        const transformedMeshData = this.createTransformedMeshData(
          meshData,
          transformedGeometry,
          'translate',
          params,
          performance.now() - startTime
        );

        logger.debug(
          `[TRANSLATE] Translation applied in ${(performance.now() - startTime).toFixed(2)}ms`
        );
        return transformedMeshData;
      },
      (error) =>
        this.createError('TRANSFORMATION_FAILED', 'translate', `Translation failed: ${error}`)
    );
  }

  /**
   * Apply rotation transformation to mesh data
   */
  async rotate(
    meshData: GenericMeshData,
    params: OpenSCADRotateParams
  ): Promise<Result<GenericMeshData, TransformationError>> {
    logger.debug('[ROTATE] Applying rotation transformation...');
    const startTime = performance.now();

    return tryCatchAsync(
      async () => {
        // Create rotation matrix based on parameters
        const rotationMatrix = this.createRotationMatrix(params);

        // Apply transformation to geometry
        const transformedGeometry = this.transformGeometry(meshData.geometry, rotationMatrix);

        // Create new mesh data with transformed geometry
        const transformedMeshData = this.createTransformedMeshData(
          meshData,
          transformedGeometry,
          'rotate',
          params,
          performance.now() - startTime
        );

        logger.debug(
          `[ROTATE] Rotation applied in ${(performance.now() - startTime).toFixed(2)}ms`
        );
        return transformedMeshData;
      },
      (error) => this.createError('TRANSFORMATION_FAILED', 'rotate', `Rotation failed: ${error}`)
    );
  }

  /**
   * Apply scale transformation to mesh data
   */
  async scale(
    meshData: GenericMeshData,
    params: OpenSCADScaleParams
  ): Promise<Result<GenericMeshData, TransformationError>> {
    logger.debug('[SCALE] Applying scale transformation...');
    const startTime = performance.now();

    return tryCatchAsync(
      async () => {
        // Create scale matrix
        const scaleMatrix = this.createScaleMatrix(params.factor);

        // Apply transformation to geometry
        const transformedGeometry = this.transformGeometry(meshData.geometry, scaleMatrix);

        // Create new mesh data with transformed geometry
        const transformedMeshData = this.createTransformedMeshData(
          meshData,
          transformedGeometry,
          'scale',
          params,
          performance.now() - startTime
        );

        logger.debug(`[SCALE] Scale applied in ${(performance.now() - startTime).toFixed(2)}ms`);
        return transformedMeshData;
      },
      (error) => this.createError('TRANSFORMATION_FAILED', 'scale', `Scale failed: ${error}`)
    );
  }

  /**
   * Apply mirror transformation to mesh data
   */
  async mirror(
    meshData: GenericMeshData,
    params: OpenSCADMirrorParams
  ): Promise<Result<GenericMeshData, TransformationError>> {
    logger.debug('[MIRROR] Applying mirror transformation...');
    const startTime = performance.now();

    return tryCatchAsync(
      async () => {
        // Validate normal vector
        if (!params.normal || params.normal.length !== 3) {
          throw this.createError(
            'INVALID_PARAMETERS',
            'mirror',
            'Mirror normal must have 3 components'
          );
        }

        // Create mirror matrix
        const mirrorMatrix = this.createMirrorMatrix(params.normal);

        // Apply transformation to geometry
        const transformedGeometry = this.transformGeometry(meshData.geometry, mirrorMatrix);

        // Mirror operations may need to flip face winding order
        const correctedGeometry = this.correctWindingOrder(transformedGeometry);

        // Create new mesh data with transformed geometry
        const transformedMeshData = this.createTransformedMeshData(
          meshData,
          correctedGeometry,
          'mirror',
          params,
          performance.now() - startTime
        );

        logger.debug(`[MIRROR] Mirror applied in ${(performance.now() - startTime).toFixed(2)}ms`);
        return transformedMeshData;
      },
      (error) => this.createError('TRANSFORMATION_FAILED', 'mirror', `Mirror failed: ${error}`)
    );
  }

  /**
   * Apply matrix transformation to mesh data
   */
  async multmatrix(
    meshData: GenericMeshData,
    params: OpenSCADMatrixParams
  ): Promise<Result<GenericMeshData, TransformationError>> {
    logger.debug('[MULTMATRIX] Applying matrix transformation...');
    const startTime = performance.now();

    return tryCatchAsync(
      async () => {
        // Validate matrix
        if (!params.matrix || params.matrix.length !== 4) {
          throw this.createError('INVALID_PARAMETERS', 'multmatrix', 'Matrix must be 4x4');
        }

        // Create BabylonJS matrix from OpenSCAD matrix
        const transformMatrix = this.createMatrixFromArray(params.matrix);

        // Apply transformation to geometry
        const transformedGeometry = this.transformGeometry(meshData.geometry, transformMatrix);

        // Create new mesh data with transformed geometry
        const transformedMeshData = this.createTransformedMeshData(
          meshData,
          transformedGeometry,
          'multmatrix',
          params,
          performance.now() - startTime
        );

        logger.debug(
          `[MULTMATRIX] Matrix transformation applied in ${(performance.now() - startTime).toFixed(2)}ms`
        );
        return transformedMeshData;
      },
      (error) =>
        this.createError(
          'TRANSFORMATION_FAILED',
          'multmatrix',
          `Matrix transformation failed: ${error}`
        )
    );
  }

  /**
   * Apply color transformation to mesh data
   */
  async color(
    meshData: GenericMeshData,
    params: OpenSCADColorParams
  ): Promise<Result<GenericMeshData, TransformationError>> {
    logger.debug('[COLOR] Applying color transformation...');
    const startTime = performance.now();

    return tryCatchAsync(
      async () => {
        // Create material configuration from color parameters
        const materialConfig = this.createMaterialFromColor(params);

        // Create new mesh data with updated material
        const coloredMeshData: GenericMeshData = {
          ...meshData,
          material: materialConfig,
          metadata: {
            ...meshData.metadata,
            generationTime: meshData.metadata.generationTime + (performance.now() - startTime),
            lastModified: new Date(),
            transformations: [...meshData.metadata.transformations, 'color'],
            openscadParameters: {
              ...meshData.metadata.openscadParameters,
              color: params,
            },
          },
        };

        logger.debug(`[COLOR] Color applied in ${(performance.now() - startTime).toFixed(2)}ms`);
        return coloredMeshData;
      },
      (error) =>
        this.createError('TRANSFORMATION_FAILED', 'color', `Color transformation failed: ${error}`)
    );
  }

  /**
   * Create rotation matrix from OpenSCAD rotation parameters
   */
  private createRotationMatrix(params: OpenSCADRotateParams): Matrix {
    if (params.angle !== undefined && params.axis !== undefined) {
      // Angle/axis rotation
      const axis = new Vector3(params.axis[0], params.axis[1], params.axis[2]).normalize();
      const angleRad = (params.angle * Math.PI) / 180; // Convert to radians
      return Matrix.RotationAxis(axis, angleRad);
    }

    if (params.vector !== undefined) {
      // Euler angles rotation [x, y, z] in degrees
      const xRad = (params.vector[0] * Math.PI) / 180;
      const yRad = (params.vector[1] * Math.PI) / 180;
      const zRad = (params.vector[2] * Math.PI) / 180;
      return Matrix.RotationYawPitchRoll(yRad, xRad, zRad);
    }

    if (params.angle !== undefined) {
      // Single angle for Z-axis rotation
      const angleRad = (params.angle * Math.PI) / 180;
      return Matrix.RotationZ(angleRad);
    }

    // Default: no rotation
    return Matrix.Identity();
  }

  /**
   * Create scale matrix from scale factor
   */
  private createScaleMatrix(factor: number | readonly [number, number, number]): Matrix {
    if (typeof factor === 'number') {
      // Uniform scaling
      return Matrix.Scaling(factor, factor, factor);
    }
    // Non-uniform scaling
    return Matrix.Scaling(factor[0], factor[1], factor[2]);
  }

  /**
   * Create mirror matrix from normal vector
   */
  private createMirrorMatrix(normal: readonly [number, number, number]): Matrix {
    const n = new Vector3(normal[0], normal[1], normal[2]).normalize();

    // Create reflection matrix: I - 2 * n * n^T
    const values = [
      1 - 2 * n.x * n.x,
      -2 * n.x * n.y,
      -2 * n.x * n.z,
      0,
      -2 * n.y * n.x,
      1 - 2 * n.y * n.y,
      -2 * n.y * n.z,
      0,
      -2 * n.z * n.x,
      -2 * n.z * n.y,
      1 - 2 * n.z * n.z,
      0,
      0,
      0,
      0,
      1,
    ];

    return Matrix.FromArray(values);
  }

  /**
   * Create BabylonJS matrix from OpenSCAD 4x4 matrix array
   */
  private createMatrixFromArray(
    matrixArray: readonly [
      readonly [number, number, number, number],
      readonly [number, number, number, number],
      readonly [number, number, number, number],
      readonly [number, number, number, number],
    ]
  ): Matrix {
    // BabylonJS uses column-major order, OpenSCAD uses row-major
    // Convert from row-major to column-major
    const values = [
      matrixArray[0][0],
      matrixArray[1][0],
      matrixArray[2][0],
      matrixArray[3][0],
      matrixArray[0][1],
      matrixArray[1][1],
      matrixArray[2][1],
      matrixArray[3][1],
      matrixArray[0][2],
      matrixArray[1][2],
      matrixArray[2][2],
      matrixArray[3][2],
      matrixArray[0][3],
      matrixArray[1][3],
      matrixArray[2][3],
      matrixArray[3][3],
    ];

    return Matrix.FromArray(values);
  }

  /**
   * Transform geometry using a transformation matrix
   */
  private transformGeometry(geometry: GenericGeometry, transformMatrix: Matrix): GenericGeometry {
    const positions = new Float32Array(geometry.positions);
    const normals = geometry.normals ? new Float32Array(geometry.normals) : undefined;

    // Transform positions
    for (let i = 0; i < positions.length; i += 3) {
      const vertex = new Vector3(positions[i]!, positions[i + 1]!, positions[i + 2]!);
      const transformedVertex = Vector3.TransformCoordinates(vertex, transformMatrix);
      positions[i] = transformedVertex.x;
      positions[i + 1] = transformedVertex.y;
      positions[i + 2] = transformedVertex.z;
    }

    // Transform normals if they exist
    if (normals) {
      const normalMatrix = transformMatrix.clone();
      normalMatrix.invert();
      normalMatrix.transpose();

      for (let i = 0; i < normals.length; i += 3) {
        const normal = new Vector3(normals[i]!, normals[i + 1]!, normals[i + 2]!);
        const transformedNormal = Vector3.TransformNormal(normal, normalMatrix).normalize();
        normals[i] = transformedNormal.x;
        normals[i + 1] = transformedNormal.y;
        normals[i + 2] = transformedNormal.z;
      }
    }

    // Create new geometry with transformed data
    const transformedGeometry: GenericGeometry = {
      positions,
      indices: new Uint32Array(geometry.indices),
      vertexCount: geometry.vertexCount,
      triangleCount: geometry.triangleCount,
      boundingBox: createBoundingBoxFromGeometry({
        positions,
        indices: geometry.indices,
        vertexCount: geometry.vertexCount,
        triangleCount: geometry.triangleCount,
        boundingBox: geometry.boundingBox,
      }),
      ...(normals && { normals }),
      ...(geometry.uvs && { uvs: new Float32Array(geometry.uvs) }),
      ...(geometry.colors && { colors: new Float32Array(geometry.colors) }),
      ...(geometry.tangents && { tangents: new Float32Array(geometry.tangents) }),
    };

    return transformedGeometry;
  }

  /**
   * Correct winding order after mirror operations
   */
  private correctWindingOrder(geometry: GenericGeometry): GenericGeometry {
    // Mirror operations can flip the winding order of triangles
    // We need to reverse the indices to maintain correct face orientation
    const indices = new Uint32Array(geometry.indices);

    for (let i = 0; i < indices.length; i += 3) {
      // Swap the second and third vertices of each triangle
      const temp = indices[i + 1]!;
      indices[i + 1] = indices[i + 2]!;
      indices[i + 2] = temp;
    }

    return {
      ...geometry,
      indices,
    };
  }

  /**
   * Create material configuration from OpenSCAD color parameters
   */
  private createMaterialFromColor(params: OpenSCADColorParams): GenericMaterialConfig {
    let diffuseColor: readonly [number, number, number];
    let alpha = 1.0;

    if (typeof params.color === 'string') {
      // Handle named colors and hex colors
      diffuseColor = this.parseColorString(params.color);
    } else if (params.color.length === 3) {
      // RGB color
      diffuseColor = [params.color[0], params.color[1], params.color[2]];
    } else if (params.color.length === 4) {
      // RGBA color
      diffuseColor = [params.color[0], params.color[1], params.color[2]];
      alpha = params.color[3];
    } else {
      // Default color
      diffuseColor = [0.8, 0.8, 0.8];
    }

    // Override alpha if explicitly provided
    if (params.alpha !== undefined) {
      alpha = params.alpha;
    }

    return {
      ...MATERIAL_PRESETS.DEFAULT,
      diffuseColor,
      alpha,
      transparent: alpha < 1.0,
    };
  }

  /**
   * Parse color string (named colors or hex)
   */
  private parseColorString(colorString: string): readonly [number, number, number] {
    // Handle hex colors
    if (colorString.startsWith('#')) {
      const hex = colorString.slice(1);
      if (hex.length === 6) {
        const r = parseInt(hex.slice(0, 2), 16) / 255;
        const g = parseInt(hex.slice(2, 4), 16) / 255;
        const b = parseInt(hex.slice(4, 6), 16) / 255;
        return [r, g, b];
      }
    }

    // Handle named colors (basic set)
    const namedColors: Record<string, readonly [number, number, number]> = {
      red: [1, 0, 0],
      green: [0, 1, 0],
      blue: [0, 0, 1],
      yellow: [1, 1, 0],
      cyan: [0, 1, 1],
      magenta: [1, 0, 1],
      white: [1, 1, 1],
      black: [0, 0, 0],
      gray: [0.5, 0.5, 0.5],
      grey: [0.5, 0.5, 0.5],
    };

    return namedColors[colorString.toLowerCase()] || [0.8, 0.8, 0.8];
  }

  /**
   * Create transformed mesh data with updated metadata
   */
  private createTransformedMeshData(
    originalMeshData: GenericMeshData,
    transformedGeometry: GenericGeometry,
    operationType: string,
    params: unknown,
    transformationTime: number
  ): GenericMeshData {
    const metadata: GenericMeshMetadata = {
      ...originalMeshData.metadata,
      vertexCount: transformedGeometry.vertexCount,
      triangleCount: transformedGeometry.triangleCount,
      boundingBox: transformedGeometry.boundingBox,
      generationTime: originalMeshData.metadata.generationTime + transformationTime,
      lastModified: new Date(),
      transformations: [...originalMeshData.metadata.transformations, operationType],
      openscadParameters: {
        ...originalMeshData.metadata.openscadParameters,
        [operationType]: params,
      },
    };

    return {
      ...originalMeshData,
      geometry: transformedGeometry,
      metadata,
    };
  }

  /**
   * Create a transformation error
   */
  private createError(
    code: TransformationError['code'],
    operationType: string,
    message: string,
    details?: Record<string, unknown>
  ): TransformationError {
    const error: TransformationError = {
      code,
      message,
      operationType,
      timestamp: new Date(),
    };

    if (details) {
      (error as any).details = details;
    }

    return error;
  }
}
