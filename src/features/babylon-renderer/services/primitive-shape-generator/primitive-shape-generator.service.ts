/**
 * @file BabylonJS Primitive Shape Generator Service
 *
 * Service for generating BabylonJS meshes from OpenSCAD primitive parameters.
 * Implements OpenSCAD-compatible parameter handling and outputs GenericMeshData.
 *
 * @example
 * ```typescript
 * const generator = new PrimitiveShapeGeneratorService(scene);
 * const cubeResult = await generator.generateCube({
 *   size: [10, 10, 10],
 *   center: false
 * });
 * ```
 */

import { BoundingBox, Matrix, MeshBuilder, type Scene, Vector3 } from '@babylonjs/core';
import { createLogger } from '../../../../shared/services/logger.service';
import type { Result } from '../../../../shared/types/result.types';
import { tryCatchAsync } from '../../../../shared/utils/functional/result';
import type {
  GenericGeometry,
  GenericMeshData,
  GenericMeshMetadata,
} from '../../types/generic-mesh-data.types';
import { DEFAULT_MESH_METADATA, MATERIAL_PRESETS } from '../../types/generic-mesh-data.types';
import { createBoundingBoxFromGeometry } from '../../utils/generic-mesh-utils';

const logger = createLogger('PrimitiveShapeGenerator');

/**
 * OpenSCAD cube parameters
 */
export interface OpenSCADCubeParams {
  readonly size: number | readonly [number, number, number];
  readonly center: boolean;
}

/**
 * OpenSCAD sphere parameters
 */
export interface OpenSCADSphereParams {
  readonly radius?: number;
  readonly diameter?: number;
  readonly fn?: number; // Fragment number
  readonly fa?: number; // Fragment angle
  readonly fs?: number; // Fragment size
}

/**
 * OpenSCAD cylinder parameters
 */
export interface OpenSCADCylinderParams {
  readonly height: number;
  readonly radius?: number;
  readonly radius1?: number;
  readonly radius2?: number;
  readonly diameter?: number;
  readonly diameter1?: number;
  readonly diameter2?: number;
  readonly center: boolean;
  readonly fn?: number;
  readonly fa?: number;
  readonly fs?: number;
}

/**
 * OpenSCAD polyhedron parameters
 */
export interface OpenSCADPolyhedronParams {
  readonly points: readonly (readonly [number, number, number])[];
  readonly faces: readonly (readonly number[])[];
  readonly convexity?: number;
}

/**
 * Primitive generation error
 */
export interface PrimitiveGenerationError {
  readonly code:
    | 'INVALID_PARAMETERS'
    | 'MESH_GENERATION_FAILED'
    | 'SCENE_REQUIRED'
    | 'GEOMETRY_CONVERSION_FAILED';
  readonly message: string;
  readonly primitiveType: string;
  readonly timestamp: Date;
  readonly details?: Record<string, unknown>;
}

/**
 * BabylonJS Primitive Shape Generator Service
 *
 * Generates BabylonJS meshes from OpenSCAD primitive parameters with
 * proper parameter handling and GenericMeshData output.
 */
export class PrimitiveShapeGeneratorService {
  private readonly scene: Scene;

  constructor(scene: Scene) {
    this.scene = scene;
    logger.init('[INIT] PrimitiveShapeGenerator service initialized');
  }

  /**
   * Generate cube mesh with OpenSCAD-compatible parameters
   */
  async generateCube(
    params: OpenSCADCubeParams
  ): Promise<Result<GenericMeshData, PrimitiveGenerationError>> {
    logger.debug('[GENERATE] Generating cube mesh...');
    const startTime = performance.now();

    return tryCatchAsync(
      async () => {
        // Validate parameters
        if (!params.size) {
          throw this.createError('INVALID_PARAMETERS', 'cube', 'Size parameter is required');
        }

        // Convert size to Vector3
        const sizeVector = this.convertSizeToVector3(params.size);

        // Create BabylonJS box
        const babylonMesh = MeshBuilder.CreateBox(
          `cube_${Date.now()}`,
          {
            width: sizeVector.x,
            height: sizeVector.y,
            depth: sizeVector.z,
            updatable: false,
          },
          this.scene
        );

        // Handle OpenSCAD center parameter
        if (!params.center) {
          // OpenSCAD default: cube positioned at corner (0,0,0) to (size,size,size)
          // BabylonJS default: cube centered at origin
          // Translate to match OpenSCAD behavior
          babylonMesh.position = new Vector3(sizeVector.x / 2, sizeVector.y / 2, sizeVector.z / 2);
        }

        // Convert to GenericMeshData
        const genericMeshData = await this.convertBabylonMeshToGeneric(
          babylonMesh,
          'cube',
          params,
          performance.now() - startTime
        );

        // Clean up BabylonJS mesh (we only need the data)
        babylonMesh.dispose();

        logger.debug(
          `[GENERATE] Cube generated in ${(performance.now() - startTime).toFixed(2)}ms`
        );
        return genericMeshData;
      },
      (error) =>
        this.createError('MESH_GENERATION_FAILED', 'cube', `Failed to generate cube: ${error}`)
    );
  }

  /**
   * Generate sphere mesh with OpenSCAD fragment control
   */
  async generateSphere(
    params: OpenSCADSphereParams
  ): Promise<Result<GenericMeshData, PrimitiveGenerationError>> {
    logger.debug('[GENERATE] Generating sphere mesh...');
    const startTime = performance.now();

    return tryCatchAsync(
      async () => {
        // Calculate radius from radius or diameter
        const radius = this.calculateSphereRadius(params);
        if (radius <= 0) {
          throw this.createError('INVALID_PARAMETERS', 'sphere', 'Radius must be positive');
        }

        // Calculate tessellation based on OpenSCAD fragment parameters
        const tessellation = this.calculateFragmentTessellation(
          radius,
          params.fn,
          params.fa,
          params.fs
        );

        // Create BabylonJS sphere
        const babylonMesh = MeshBuilder.CreateSphere(
          `sphere_${Date.now()}`,
          {
            diameter: radius * 2,
            segments: tessellation,
            updatable: false,
          },
          this.scene
        );

        // Convert to GenericMeshData
        const genericMeshData = await this.convertBabylonMeshToGeneric(
          babylonMesh,
          'sphere',
          params,
          performance.now() - startTime
        );

        // Clean up BabylonJS mesh
        babylonMesh.dispose();

        logger.debug(
          `[GENERATE] Sphere generated in ${(performance.now() - startTime).toFixed(2)}ms`
        );
        return genericMeshData;
      },
      (error) =>
        this.createError('MESH_GENERATION_FAILED', 'sphere', `Failed to generate sphere: ${error}`)
    );
  }

  /**
   * Generate cylinder mesh with OpenSCAD radius variants
   */
  async generateCylinder(
    params: OpenSCADCylinderParams
  ): Promise<Result<GenericMeshData, PrimitiveGenerationError>> {
    logger.debug('[GENERATE] Generating cylinder mesh...');
    const startTime = performance.now();

    return tryCatchAsync(
      async () => {
        // Validate height
        if (params.height <= 0) {
          throw this.createError('INVALID_PARAMETERS', 'cylinder', 'Height must be positive');
        }

        // Calculate radii from various parameter combinations
        const { topRadius, bottomRadius } = this.calculateCylinderRadii(params);

        // Calculate tessellation
        const tessellation = this.calculateFragmentTessellation(
          Math.max(topRadius, bottomRadius),
          params.fn,
          params.fa,
          params.fs
        );

        // Create BabylonJS cylinder
        const babylonMesh = MeshBuilder.CreateCylinder(
          `cylinder_${Date.now()}`,
          {
            height: params.height,
            diameterTop: topRadius * 2,
            diameterBottom: bottomRadius * 2,
            tessellation: tessellation,
            updatable: false,
          },
          this.scene
        );

        // Handle OpenSCAD center parameter
        if (!params.center) {
          // OpenSCAD default: cylinder base at z=0, extends to z=height
          // BabylonJS default: cylinder centered at origin
          babylonMesh.position.y = params.height / 2;
        }

        // Convert to GenericMeshData
        const genericMeshData = await this.convertBabylonMeshToGeneric(
          babylonMesh,
          'cylinder',
          params,
          performance.now() - startTime
        );

        // Clean up BabylonJS mesh
        babylonMesh.dispose();

        logger.debug(
          `[GENERATE] Cylinder generated in ${(performance.now() - startTime).toFixed(2)}ms`
        );
        return genericMeshData;
      },
      (error) =>
        this.createError(
          'MESH_GENERATION_FAILED',
          'cylinder',
          `Failed to generate cylinder: ${error}`
        )
    );
  }

  /**
   * Convert size parameter to Vector3
   */
  private convertSizeToVector3(size: number | readonly [number, number, number]): Vector3 {
    if (typeof size === 'number') {
      return new Vector3(size, size, size);
    }
    return new Vector3(size[0], size[1], size[2]);
  }

  /**
   * Calculate sphere radius from parameters
   */
  private calculateSphereRadius(params: OpenSCADSphereParams): number {
    if (params.radius !== undefined) {
      return params.radius;
    }
    if (params.diameter !== undefined) {
      return params.diameter / 2;
    }
    return 1; // Default radius
  }

  /**
   * Calculate cylinder radii from various parameter combinations
   */
  private calculateCylinderRadii(params: OpenSCADCylinderParams): {
    topRadius: number;
    bottomRadius: number;
  } {
    // Handle radius1/radius2 (top/bottom)
    if (params.radius1 !== undefined || params.radius2 !== undefined) {
      return {
        bottomRadius: params.radius1 ?? params.radius ?? 1,
        topRadius: params.radius2 ?? params.radius ?? 1,
      };
    }

    // Handle diameter1/diameter2
    if (params.diameter1 !== undefined || params.diameter2 !== undefined) {
      return {
        bottomRadius: (params.diameter1 ?? params.diameter ?? 2) / 2,
        topRadius: (params.diameter2 ?? params.diameter ?? 2) / 2,
      };
    }

    // Handle single radius or diameter
    if (params.radius !== undefined) {
      return { topRadius: params.radius, bottomRadius: params.radius };
    }
    if (params.diameter !== undefined) {
      const radius = params.diameter / 2;
      return { topRadius: radius, bottomRadius: radius };
    }

    // Default
    return { topRadius: 1, bottomRadius: 1 };
  }

  /**
   * Calculate tessellation based on OpenSCAD fragment parameters
   */
  private calculateFragmentTessellation(
    radius: number,
    fn?: number,
    fa?: number,
    fs?: number
  ): number {
    // If $fn is specified, use it directly
    if (fn !== undefined && fn > 0) {
      return Math.max(3, Math.floor(fn));
    }

    // Calculate based on $fa (fragment angle) and $fs (fragment size)
    const fragmentAngle = fa ?? 12; // Default $fa = 12 degrees
    const fragmentSize = fs ?? 2; // Default $fs = 2 units

    // Calculate segments based on fragment angle
    const segmentsFromAngle = Math.ceil(360 / fragmentAngle);

    // Calculate segments based on fragment size
    const circumference = 2 * Math.PI * radius;
    const segmentsFromSize = Math.ceil(circumference / fragmentSize);

    // Use the larger of the two (more detailed)
    const segments = Math.max(segmentsFromAngle, segmentsFromSize);

    // Clamp to reasonable bounds
    return Math.max(3, Math.min(segments, 100));
  }

  /**
   * Convert BabylonJS mesh to GenericMeshData
   */
  private async convertBabylonMeshToGeneric(
    babylonMesh: any,
    primitiveType: string,
    params: unknown,
    generationTime: number
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

    const metadata: GenericMeshMetadata = {
      ...DEFAULT_MESH_METADATA,
      meshId: babylonMesh.id,
      name: babylonMesh.name,
      nodeType: primitiveType,
      vertexCount: geometry.vertexCount,
      triangleCount: geometry.triangleCount,
      boundingBox: geometry.boundingBox,
      generationTime,
      openscadParameters: params as Record<string, unknown>,
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
   * Create a primitive generation error
   */
  private createError(
    code: PrimitiveGenerationError['code'],
    primitiveType: string,
    message: string,
    details?: Record<string, unknown>
  ): PrimitiveGenerationError {
    const error: PrimitiveGenerationError = {
      code,
      message,
      primitiveType,
      timestamp: new Date(),
    };

    if (details) {
      (error as any).details = details;
    }

    return error;
  }
}
