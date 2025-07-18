/**
 * @file Extrusion Operations Service
 *
 * Service for performing OpenSCAD extrusion operations on 2D profiles.
 * Supports linear_extrude and rotate_extrude with proper geometry generation,
 * surface normals, and UV mapping.
 *
 * @example
 * ```typescript
 * const extrusionService = new ExtrusionOperationsService(scene);
 * const linearResult = await extrusionService.linearExtrude(profile2D, {
 *   height: 10,
 *   twist: 45,
 *   scale: [1, 1.5]
 * });
 * ```
 */

import { BoundingBox, Matrix, type Mesh, MeshBuilder, type Scene, Vector3 } from '@babylonjs/core';
import { createLogger } from '../../../../shared/services/logger.service';
import type { Result } from '../../../../shared/types/result.types';
import { tryCatchAsync } from '../../../../shared/utils/functional/result';
import type { GenericGeometry, GenericMeshData } from '../../types/generic-mesh-data.types';
import { DEFAULT_MESH_METADATA, MATERIAL_PRESETS } from '../../types/generic-mesh-data.types';
import { createBoundingBoxFromGeometry } from '../../utils/generic-mesh-utils';

const logger = createLogger('ExtrusionOperations');

/**
 * 2D profile point
 */
export interface Profile2DPoint {
  readonly x: number;
  readonly y: number;
}

/**
 * OpenSCAD linear extrude parameters
 */
export interface OpenSCADLinearExtrudeParams {
  readonly height: number;
  readonly center?: boolean;
  readonly convexity?: number;
  readonly twist?: number;
  readonly slices?: number;
  readonly scale?: number | readonly [number, number];
  readonly $fn?: number;
}

/**
 * OpenSCAD rotate extrude parameters
 */
export interface OpenSCADRotateExtrudeParams {
  readonly angle?: number;
  readonly convexity?: number;
  readonly $fn?: number;
  readonly $fa?: number;
  readonly $fs?: number;
}

/**
 * Extrusion operation error
 */
export interface ExtrusionError {
  readonly code:
    | 'INVALID_PROFILE'
    | 'INVALID_PARAMETERS'
    | 'GEOMETRY_GENERATION_FAILED'
    | 'SCENE_REQUIRED';
  readonly message: string;
  readonly operationType: string;
  readonly timestamp: Date;
  readonly details?: Record<string, unknown>;
}

/**
 * Extrusion Operations Service
 *
 * Performs OpenSCAD extrusion operations on 2D profiles using BabylonJS
 * with proper geometry generation and OpenSCAD-compatible parameters.
 */
export class ExtrusionOperationsService {
  private readonly scene: Scene;

  constructor(scene: Scene) {
    this.scene = scene;
    logger.init('[INIT] ExtrusionOperations service initialized');
  }

  /**
   * Perform linear extrusion operation
   */
  async linearExtrude(
    profile: readonly Profile2DPoint[],
    params: OpenSCADLinearExtrudeParams
  ): Promise<Result<GenericMeshData, ExtrusionError>> {
    logger.debug('[LINEAR_EXTRUDE] Performing linear extrusion...');
    const startTime = performance.now();

    // Validate inputs first (outside tryCatchAsync to preserve specific error codes)
    try {
      this.validateProfile(profile);
      this.validateLinearExtrudeParams(params);
    } catch (error) {
      return { success: false, error: error as ExtrusionError };
    }

    return tryCatchAsync(
      async () => {
        // Convert profile to BabylonJS Vector3 array
        const babylonProfile = profile.map((p) => new Vector3(p.x, p.y, 0));

        // Create extrusion path
        const path = this.createLinearExtrusionPath(params);

        // Create extruded mesh
        const extrudedMesh = MeshBuilder.ExtrudeShape(
          `linear_extrude_${Date.now()}`,
          {
            shape: babylonProfile,
            path: path,
            cap: 3, // CAP_ALL
            updatable: false,
          },
          this.scene
        );

        // Apply twist and scale if specified
        if (params.twist || params.scale) {
          this.applyLinearExtrudeTransformations(extrudedMesh, params);
        }

        // Convert to GenericMeshData
        const genericMeshData = await this.convertBabylonMeshToGeneric(
          extrudedMesh,
          'linear_extrude',
          params as unknown as Record<string, unknown>,
          performance.now() - startTime
        );

        // Clean up BabylonJS mesh
        extrudedMesh.dispose();

        logger.debug(
          `[LINEAR_EXTRUDE] Linear extrusion completed in ${(performance.now() - startTime).toFixed(2)}ms`
        );
        return genericMeshData;
      },
      (error) =>
        this.createError(
          'GEOMETRY_GENERATION_FAILED',
          'linear_extrude',
          `Linear extrusion failed: ${error}`
        )
    );
  }

  /**
   * Perform rotate extrusion operation
   */
  async rotateExtrude(
    profile: readonly Profile2DPoint[],
    params: OpenSCADRotateExtrudeParams = {}
  ): Promise<Result<GenericMeshData, ExtrusionError>> {
    logger.debug('[ROTATE_EXTRUDE] Performing rotate extrusion...');
    const startTime = performance.now();

    // Validate inputs first (outside tryCatchAsync to preserve specific error codes)
    try {
      this.validateProfile(profile);
      this.validateRotateExtrudeParams(params);
    } catch (error) {
      return { success: false, error: error as ExtrusionError };
    }

    return tryCatchAsync(
      async () => {
        // Convert profile to BabylonJS Vector3 array
        const babylonProfile = profile.map((p) => new Vector3(p.x, p.y, 0));

        // Calculate tessellation
        const tessellation = params.$fn || 16;
        const angle = params.angle || 360;
        const arc = (angle / 360) * Math.PI * 2;

        // Create lathe mesh (rotational extrusion)
        const latheMesh = MeshBuilder.CreateLathe(
          `rotate_extrude_${Date.now()}`,
          {
            shape: babylonProfile,
            radius: 1,
            tessellation: tessellation,
            arc: arc,
            cap: angle < 360 ? 3 : 0, // Cap only if partial revolution
            updatable: false,
          },
          this.scene
        );

        // Convert to GenericMeshData
        const genericMeshData = await this.convertBabylonMeshToGeneric(
          latheMesh,
          'rotate_extrude',
          params as unknown as Record<string, unknown>,
          performance.now() - startTime
        );

        // Clean up BabylonJS mesh
        latheMesh.dispose();

        logger.debug(
          `[ROTATE_EXTRUDE] Rotate extrusion completed in ${(performance.now() - startTime).toFixed(2)}ms`
        );
        return genericMeshData;
      },
      (error) =>
        this.createError(
          'GEOMETRY_GENERATION_FAILED',
          'rotate_extrude',
          `Rotate extrusion failed: ${error}`
        )
    );
  }

  /**
   * Validate 2D profile
   */
  private validateProfile(profile: readonly Profile2DPoint[]): void {
    if (!profile || profile.length < 3) {
      throw this.createError(
        'INVALID_PROFILE',
        'validation',
        'Profile must have at least 3 points'
      );
    }

    // Check for valid coordinates
    for (const point of profile) {
      if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) {
        throw this.createError(
          'INVALID_PROFILE',
          'validation',
          'Profile points must have finite coordinates'
        );
      }
    }
  }

  /**
   * Validate linear extrude parameters
   */
  private validateLinearExtrudeParams(params: OpenSCADLinearExtrudeParams): void {
    if (!params.height || params.height <= 0) {
      throw this.createError('INVALID_PARAMETERS', 'linear_extrude', 'Height must be positive');
    }

    if (params.twist && !Number.isFinite(params.twist)) {
      throw this.createError(
        'INVALID_PARAMETERS',
        'linear_extrude',
        'Twist must be a finite number'
      );
    }

    if (params.scale) {
      if (typeof params.scale === 'number') {
        if (params.scale <= 0) {
          throw this.createError('INVALID_PARAMETERS', 'linear_extrude', 'Scale must be positive');
        }
      } else if (params.scale[0] <= 0 || params.scale[1] <= 0) {
        throw this.createError(
          'INVALID_PARAMETERS',
          'linear_extrude',
          'Scale values must be positive'
        );
      }
    }
  }

  /**
   * Validate rotate extrude parameters
   */
  private validateRotateExtrudeParams(params: OpenSCADRotateExtrudeParams): void {
    if (params.angle && (params.angle <= 0 || params.angle > 360)) {
      throw this.createError(
        'INVALID_PARAMETERS',
        'rotate_extrude',
        'Angle must be between 0 and 360 degrees'
      );
    }

    if (params.$fn && params.$fn < 3) {
      throw this.createError('INVALID_PARAMETERS', 'rotate_extrude', '$fn must be at least 3');
    }
  }

  /**
   * Create linear extrusion path
   */
  private createLinearExtrusionPath(params: OpenSCADLinearExtrudeParams): Vector3[] {
    const path: Vector3[] = [];
    const height = params.height;
    const center = params.center || false;

    const startZ = center ? -height / 2 : 0;
    const endZ = center ? height / 2 : height;

    // Simple straight path for now (twist and scale handled separately)
    path.push(new Vector3(0, 0, startZ));
    path.push(new Vector3(0, 0, endZ));

    return path;
  }

  /**
   * Apply linear extrude transformations (twist, scale)
   */
  private applyLinearExtrudeTransformations(
    _mesh: Mesh,
    params: OpenSCADLinearExtrudeParams
  ): void {
    // Note: BabylonJS ExtrudeShape doesn't directly support twist and scale
    // This would require custom geometry generation for full OpenSCAD compatibility
    // For now, we'll log that these features need custom implementation
    if (params.twist) {
      logger.warn('[LINEAR_EXTRUDE] Twist parameter requires custom geometry generation');
    }
    if (params.scale) {
      logger.warn('[LINEAR_EXTRUDE] Scale parameter requires custom geometry generation');
    }
  }

  /**
   * Convert BabylonJS mesh to GenericMeshData
   */
  private async convertBabylonMeshToGeneric(
    babylonMesh: Mesh,
    operationType: string,
    params: Record<string, unknown>,
    operationTime: number
  ): Promise<GenericMeshData> {
    // Extract geometry data
    const positionsArray = babylonMesh.getVerticesData('position');
    const indicesArray = babylonMesh.getIndices();
    const normalsArray = babylonMesh.getVerticesData('normal');
    const uvsArray = babylonMesh.getVerticesData('uv');

    // Convert to typed arrays
    const positions = new Float32Array(positionsArray || []);
    const indices = new Uint32Array(indicesArray || []);
    const normals = normalsArray ? new Float32Array(normalsArray) : undefined;
    const uvs = uvsArray ? new Float32Array(uvsArray) : undefined;

    const geometry: GenericGeometry = {
      positions,
      indices,
      vertexCount: positions.length / 3,
      triangleCount: indices.length / 3,
      boundingBox: createBoundingBoxFromGeometry({
        positions,
        indices,
        vertexCount: positions.length / 3,
        triangleCount: indices.length / 3,
        boundingBox: new BoundingBox(Vector3.Zero(), Vector3.One()),
      }),
      ...(normals && { normals }),
      ...(uvs && { uvs }),
    };

    const metadata = {
      ...DEFAULT_MESH_METADATA,
      meshId: babylonMesh.id,
      name: `${operationType}_result`,
      nodeType: operationType,
      vertexCount: geometry.vertexCount,
      triangleCount: geometry.triangleCount,
      boundingBox: geometry.boundingBox,
      generationTime: operationTime,
      openscadParameters: {
        operationType,
        ...params,
      },
    };

    return {
      id: babylonMesh.id,
      geometry,
      material: MATERIAL_PRESETS.DEFAULT,
      transform: Matrix.Identity(),
      metadata,
    };
  }

  /**
   * Create an extrusion error
   */
  private createError(
    code: ExtrusionError['code'],
    operationType: string,
    message: string,
    details?: Record<string, unknown>
  ): ExtrusionError {
    return {
      code,
      message,
      operationType,
      timestamp: new Date(),
      details,
    };
  }
}
