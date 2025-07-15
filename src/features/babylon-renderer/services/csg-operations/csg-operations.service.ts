/**
 * @file CSG Operations Service
 *
 * Service for performing CSG operations on GenericMeshData objects.
 * Integrates with BabylonJS CSG2 service while maintaining GenericMeshData interface.
 *
 * @example
 * ```typescript
 * const csgService = new CSGOperationsService(scene);
 * const unionResult = await csgService.union([meshA, meshB]);
 * const differenceResult = await csgService.difference(meshA, meshB);
 * ```
 */

import { Matrix, Mesh, MeshBuilder, type Scene } from '@babylonjs/core';
import { createLogger } from '../../../../shared/services/logger.service';
import type { Result } from '../../../../shared/types/result.types';
import { tryCatch, tryCatchAsync } from '../../../../shared/utils/functional/result';
import type {
  GenericGeometry,
  GenericMeshCollection,
  GenericMeshData,
} from '../../types/generic-mesh-data.types';
import { DEFAULT_MESH_METADATA, MATERIAL_PRESETS } from '../../types/generic-mesh-data.types';
import {
  createBoundingBoxFromGeometry,
  createMeshCollection,
} from '../../utils/generic-mesh-utils';
import { BabylonCSG2Service } from '../babylon-csg2-service';

const logger = createLogger('CSGOperations');

/**
 * CSG operation parameters
 */
export interface CSGOperationParams {
  readonly preserveMaterials?: boolean;
  readonly optimizeResult?: boolean;
  readonly tolerance?: number;
  readonly maxIterations?: number;
}

/**
 * CSG operation error
 */
export interface CSGOperationError {
  readonly code:
    | 'INVALID_MESHES'
    | 'OPERATION_FAILED'
    | 'SCENE_REQUIRED'
    | 'GEOMETRY_INVALID'
    | 'NO_INTERSECTION';
  readonly message: string;
  readonly operationType: string;
  readonly timestamp: Date;
  readonly details?: Record<string, unknown>;
}

/**
 * CSG Operations Service
 *
 * Performs CSG operations on GenericMeshData objects using BabylonJS CSG2
 * with proper error handling and performance optimization.
 */
export class CSGOperationsService {
  private readonly scene: Scene;
  private readonly csgService: BabylonCSG2Service;

  constructor(scene: Scene) {
    this.scene = scene;
    this.csgService = new BabylonCSG2Service();

    // Initialize the CSG service with the scene
    const initResult = this.csgService.init(scene);
    if (!initResult.success) {
      logger.error(`[ERROR] Failed to initialize CSG service: ${initResult.error.message}`);
    }

    logger.init('[INIT] CSGOperations service initialized');
  }

  /**
   * Perform union operation on multiple meshes
   */
  async union(
    meshes: readonly GenericMeshData[],
    params: CSGOperationParams = {}
  ): Promise<Result<GenericMeshData, CSGOperationError>> {
    logger.debug('[UNION] Performing union operation...');
    const startTime = performance.now();

    return tryCatchAsync(
      async () => {
        // Validate input
        if (!meshes || meshes.length < 2) {
          throw this.createError('INVALID_MESHES', 'union', 'Union requires at least 2 meshes');
        }

        // Convert GenericMeshData to BabylonJS meshes
        const babylonMeshes = await Promise.all(
          meshes.map((meshData) => this.convertGenericMeshToBabylon(meshData))
        );

        // Perform union operations sequentially
        let resultMesh = babylonMeshes[0]!;
        for (let i = 1; i < babylonMeshes.length; i++) {
          const unionResult = await this.csgService.union(resultMesh, babylonMeshes[i]!);
          if (!unionResult.success) {
            throw new Error(`Union operation failed: ${unionResult.error.message}`);
          }

          // Clean up intermediate mesh
          if (resultMesh !== babylonMeshes[0]) {
            resultMesh.dispose();
          }
          resultMesh = unionResult.data.resultMesh;
        }

        // Convert result back to GenericMeshData
        const genericResult = await this.convertBabylonMeshToGeneric(
          resultMesh,
          'union',
          meshes,
          performance.now() - startTime
        );

        // Clean up BabylonJS meshes
        babylonMeshes.forEach((mesh) => mesh.dispose());
        resultMesh.dispose();

        logger.debug(
          `[UNION] Union operation completed in ${(performance.now() - startTime).toFixed(2)}ms`
        );
        return genericResult;
      },
      (error) => this.createError('OPERATION_FAILED', 'union', `Union operation failed: ${error}`)
    );
  }

  /**
   * Perform difference operation (subtract meshB from meshA)
   */
  async difference(
    meshA: GenericMeshData,
    meshB: GenericMeshData,
    params: CSGOperationParams = {}
  ): Promise<Result<GenericMeshData, CSGOperationError>> {
    logger.debug('[DIFFERENCE] Performing difference operation...');
    const startTime = performance.now();

    return tryCatchAsync(
      async () => {
        // Convert GenericMeshData to BabylonJS meshes
        const babylonMeshA = await this.convertGenericMeshToBabylon(meshA);
        const babylonMeshB = await this.convertGenericMeshToBabylon(meshB);

        // Perform difference operation
        const differenceResult = await this.csgService.difference(babylonMeshA, babylonMeshB);
        if (!differenceResult.success) {
          throw new Error(`Difference operation failed: ${differenceResult.error.message}`);
        }

        // Convert result back to GenericMeshData
        const genericResult = await this.convertBabylonMeshToGeneric(
          differenceResult.data.resultMesh,
          'difference',
          [meshA, meshB],
          performance.now() - startTime
        );

        // Clean up BabylonJS meshes
        babylonMeshA.dispose();
        babylonMeshB.dispose();
        differenceResult.data.resultMesh.dispose();

        logger.debug(
          `[DIFFERENCE] Difference operation completed in ${(performance.now() - startTime).toFixed(2)}ms`
        );
        return genericResult;
      },
      (error) =>
        this.createError('OPERATION_FAILED', 'difference', `Difference operation failed: ${error}`)
    );
  }

  /**
   * Perform intersection operation (find overlapping geometry)
   */
  async intersection(
    meshA: GenericMeshData,
    meshB: GenericMeshData,
    params: CSGOperationParams = {}
  ): Promise<Result<GenericMeshData, CSGOperationError>> {
    logger.debug('[INTERSECTION] Performing intersection operation...');
    const startTime = performance.now();

    return tryCatchAsync(
      async () => {
        // Convert GenericMeshData to BabylonJS meshes
        const babylonMeshA = await this.convertGenericMeshToBabylon(meshA);
        const babylonMeshB = await this.convertGenericMeshToBabylon(meshB);

        // Perform intersection operation
        const intersectionResult = await this.csgService.intersection(babylonMeshA, babylonMeshB);
        if (!intersectionResult.success) {
          throw new Error(`Intersection operation failed: ${intersectionResult.error.message}`);
        }

        // Check if intersection produced valid geometry
        const resultMesh = intersectionResult.data.resultMesh;
        if (!resultMesh || intersectionResult.data.triangleCount === 0) {
          throw this.createError(
            'NO_INTERSECTION',
            'intersection',
            'No intersection found between meshes'
          );
        }

        // Convert result back to GenericMeshData
        const genericResult = await this.convertBabylonMeshToGeneric(
          resultMesh,
          'intersection',
          [meshA, meshB],
          performance.now() - startTime
        );

        // Clean up BabylonJS meshes
        babylonMeshA.dispose();
        babylonMeshB.dispose();
        resultMesh.dispose();

        logger.debug(
          `[INTERSECTION] Intersection operation completed in ${(performance.now() - startTime).toFixed(2)}ms`
        );
        return genericResult;
      },
      (error) =>
        this.createError(
          'OPERATION_FAILED',
          'intersection',
          `Intersection operation failed: ${error}`
        )
    );
  }

  /**
   * Convert GenericMeshData to BabylonJS Mesh
   */
  private async convertGenericMeshToBabylon(meshData: GenericMeshData): Promise<Mesh> {
    const mesh = new Mesh(`csg_temp_${Date.now()}`, this.scene);

    // Set vertex data
    mesh.setVerticesData('position', meshData.geometry.positions);
    mesh.setIndices(Array.from(meshData.geometry.indices));

    if (meshData.geometry.normals) {
      mesh.setVerticesData('normal', meshData.geometry.normals);
    }

    if (meshData.geometry.uvs) {
      mesh.setVerticesData('uv', meshData.geometry.uvs);
    }

    // Apply transform
    mesh.setPreTransformMatrix(meshData.transform);

    return mesh;
  }

  /**
   * Convert BabylonJS Mesh to GenericMeshData
   */
  private async convertBabylonMeshToGeneric(
    babylonMesh: Mesh,
    operationType: string,
    inputMeshes: readonly GenericMeshData[],
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
        boundingBox: inputMeshes[0]!.geometry.boundingBox,
      }),
      ...(normals && { normals }),
      ...(uvs && { uvs }),
    };

    // Merge materials from input meshes (use first mesh's material as base)
    const baseMaterial = inputMeshes[0]!.material;

    // Create metadata combining information from input meshes
    const totalVertices = inputMeshes.reduce((sum, mesh) => sum + mesh.metadata.vertexCount, 0);
    const totalTriangles = inputMeshes.reduce((sum, mesh) => sum + mesh.metadata.triangleCount, 0);
    const totalGenerationTime = inputMeshes.reduce(
      (sum, mesh) => sum + mesh.metadata.generationTime,
      0
    );

    const metadata = {
      ...DEFAULT_MESH_METADATA,
      meshId: babylonMesh.id,
      name: `${operationType}_result`,
      nodeType: operationType,
      vertexCount: geometry.vertexCount,
      triangleCount: geometry.triangleCount,
      boundingBox: geometry.boundingBox,
      generationTime: totalGenerationTime + operationTime,
      csgOperations: [...inputMeshes[0]!.metadata.csgOperations, operationType],
      openscadParameters: {
        operationType,
        inputMeshCount: inputMeshes.length,
        inputVertices: totalVertices,
        inputTriangles: totalTriangles,
      },
    };

    return {
      id: babylonMesh.id,
      geometry,
      material: baseMaterial,
      transform: Matrix.Identity(),
      metadata,
    };
  }

  /**
   * Create a CSG operation error
   */
  private createError(
    code: CSGOperationError['code'],
    operationType: string,
    message: string,
    details?: Record<string, unknown>
  ): CSGOperationError {
    const error: CSGOperationError = {
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
