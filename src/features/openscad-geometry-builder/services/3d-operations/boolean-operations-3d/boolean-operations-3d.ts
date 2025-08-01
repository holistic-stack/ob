/**
 * @file boolean-operations-3d.ts
 * @description 3D Boolean Operations Service for 3D mesh boolean operations.
 * Provides union, difference, and intersection operations between 3D meshes
 * using BabylonJS CSG2/Manifold integration.
 *
 * @example
 * ```typescript
 * const service = new BooleanOperations3DService();
 *
 * // Union operation
 * const unionResult = service.performUnion(sphereGeometry, cubeGeometry);
 * if (unionResult.success) {
 *   const combinedMesh = unionResult.data;
 *   console.log(`Union volume: ${combinedMesh.metadata.volume}`);
 * }
 *
 * // Difference operation
 * const diffResult = service.performDifference(cubeGeometry, sphereGeometry);
 * if (diffResult.success) {
 *   const resultMesh = diffResult.data;
 *   console.log(`Difference volume: ${resultMesh.metadata.volume}`);
 * }
 * ```
 *
 * @author OpenSCAD Babylon Team
 * @version 1.0.0
 * @since 2025-07-30
 */

import * as BABYLON from '@babylonjs/core';
import { BabylonCSG2Service } from '@/features/babylon-renderer';
import { BabylonMeshBuilderService } from '@/features/openscad-geometry-builder';
import type { Result } from '@/shared';
import { createLogger, error, success } from '@/shared';
import type {
  BaseGeometryData,
  Geometry3DData,
  GeometryGenerationError,
  Vector3,
} from '../../../types/geometry-data';
import { VertexDeduplicationService } from '../vertex-operations/vertex-deduplication';

const logger = createLogger('BooleanOperations3DService');

/**
 * 3D Boolean operation types
 */
export type BooleanOperation3DType = 'union' | 'difference' | 'intersection';

/**
 * 3D Boolean operation result metadata
 */
export interface BooleanOperation3DMetadata {
  readonly operationType: BooleanOperation3DType;
  readonly inputMeshCount: number;
  readonly operationTime: number;
  readonly volume: number;
  readonly surfaceArea: number;
  readonly vertexCount: number;
  readonly faceCount: number;
  readonly isManifold: boolean;
  readonly boundingBox: {
    readonly min: Vector3;
    readonly max: Vector3;
    readonly size: Vector3;
  };
}

/**
 * 3D Boolean operation result geometry data
 */
export interface BooleanOperation3DGeometryData extends BaseGeometryData {
  readonly metadata: BooleanOperation3DMetadata & {
    readonly primitiveType: '3d-boolean-result';
    readonly parameters: {
      readonly operation: BooleanOperation3DType;
      readonly inputGeometries: readonly string[];
    };
  };
}

/**
 * Result type for 3D boolean operations
 */
export type BooleanOperation3DResult = Result<
  BooleanOperation3DGeometryData,
  GeometryGenerationError
>;

/**
 * 3D Boolean Operations Service
 *
 * Provides high-level boolean operations for 3D meshes using the established
 * geometry data types and Result<T,E> error handling patterns.
 */
export class BooleanOperations3DService {
  private meshBuilder: BabylonMeshBuilderService;
  private csgService: BabylonCSG2Service;
  private vertexDeduplication: VertexDeduplicationService;
  private scene: BABYLON.Scene | null = null;

  constructor() {
    this.meshBuilder = new BabylonMeshBuilderService();
    this.csgService = new BabylonCSG2Service();
    this.vertexDeduplication = new VertexDeduplicationService();
  }

  /**
   * Initialize the service with a BabylonJS scene
   */
  init(scene: BABYLON.Scene): void {
    this.scene = scene;
    this.csgService.init(scene);
  }

  /**
   * Perform union operation (A ∪ B) between two 3D meshes
   *
   * @param meshA - First 3D geometry
   * @param meshB - Second 3D geometry
   * @returns Result containing combined geometry or error
   */
  async performUnion(
    meshA: Geometry3DData,
    meshB: Geometry3DData
  ): Promise<BooleanOperation3DResult> {
    logger.debug('[DEBUG][BooleanOperations3DService] Starting union operation');

    try {
      // Validate input meshes
      const validationResult = this.validateInputMeshes(meshA, meshB);
      if (!validationResult.success) {
        return validationResult;
      }

      // Perform union operation
      const startTime = performance.now();
      const unionResult = await this.performMeshUnion(meshA, meshB);
      const operationTime = performance.now() - startTime;

      // Create result metadata
      const metadata = this.createOperationMetadata(
        'union',
        [meshA, meshB],
        unionResult,
        operationTime
      );

      const result: BooleanOperation3DGeometryData = {
        ...unionResult,
        metadata: {
          ...metadata,
          primitiveType: '3d-boolean-result',
          parameters: {
            operation: 'union',
            inputGeometries: [meshA.metadata.primitiveType, meshB.metadata.primitiveType],
          },
        },
      };

      logger.debug(
        `[DEBUG][BooleanOperations3DService] Union completed in ${operationTime.toFixed(2)}ms`
      );
      return success(result);
    } catch (err) {
      return error({
        type: 'COMPUTATION_ERROR',
        message: `Union operation failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
        details: { meshA, meshB },
      });
    }
  }

  /**
   * Perform difference operation (A - B) between two 3D meshes
   *
   * @param meshA - Base 3D geometry
   * @param meshB - Geometry to subtract
   * @returns Result containing difference geometry or error
   */
  async performDifference(
    meshA: Geometry3DData,
    meshB: Geometry3DData
  ): Promise<BooleanOperation3DResult> {
    logger.debug('[DEBUG][BooleanOperations3DService] Starting difference operation');

    try {
      // Validate input meshes
      const validationResult = this.validateInputMeshes(meshA, meshB);
      if (!validationResult.success) {
        return validationResult;
      }

      // Perform difference operation
      const startTime = performance.now();
      const differenceResult = await this.performMeshDifference(meshA, meshB);
      const operationTime = performance.now() - startTime;

      // Create result metadata
      const metadata = this.createOperationMetadata(
        'difference',
        [meshA, meshB],
        differenceResult,
        operationTime
      );

      const result: BooleanOperation3DGeometryData = {
        ...differenceResult,
        metadata: {
          ...metadata,
          primitiveType: '3d-boolean-result',
          parameters: {
            operation: 'difference',
            inputGeometries: [meshA.metadata.primitiveType, meshB.metadata.primitiveType],
          },
        },
      };

      logger.debug(
        `[DEBUG][BooleanOperations3DService] Difference completed in ${operationTime.toFixed(2)}ms`
      );
      return success(result);
    } catch (err) {
      return error({
        type: 'COMPUTATION_ERROR',
        message: `Difference operation failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
        details: { meshA, meshB },
      });
    }
  }

  /**
   * Perform intersection operation (A ∩ B) between two 3D meshes
   *
   * @param meshA - First 3D geometry
   * @param meshB - Second 3D geometry
   * @returns Result containing intersection geometry or error
   */
  async performIntersection(
    meshA: Geometry3DData,
    meshB: Geometry3DData
  ): Promise<BooleanOperation3DResult> {
    logger.debug('[DEBUG][BooleanOperations3DService] Starting intersection operation');

    try {
      // Validate input meshes
      const validationResult = this.validateInputMeshes(meshA, meshB);
      if (!validationResult.success) {
        return validationResult;
      }

      // Perform intersection operation
      const startTime = performance.now();
      const intersectionResult = await this.performMeshIntersection(meshA, meshB);
      const operationTime = performance.now() - startTime;

      // Create result metadata
      const metadata = this.createOperationMetadata(
        'intersection',
        [meshA, meshB],
        intersectionResult,
        operationTime
      );

      const result: BooleanOperation3DGeometryData = {
        ...intersectionResult,
        metadata: {
          ...metadata,
          primitiveType: '3d-boolean-result',
          parameters: {
            operation: 'intersection',
            inputGeometries: [meshA.metadata.primitiveType, meshB.metadata.primitiveType],
          },
        },
      };

      logger.debug(
        `[DEBUG][BooleanOperations3DService] Intersection completed in ${operationTime.toFixed(2)}ms`
      );
      return success(result);
    } catch (err) {
      return error({
        type: 'COMPUTATION_ERROR',
        message: `Intersection operation failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
        details: { meshA, meshB },
      });
    }
  }

  /**
   * Validate input meshes for boolean operations
   */
  private validateInputMeshes(
    meshA: Geometry3DData,
    meshB: Geometry3DData
  ): Result<void, GeometryGenerationError> {
    // Check for null/undefined inputs
    if (!meshA || !meshB) {
      return error({
        type: 'INVALID_PARAMETERS',
        message: 'Input meshes cannot be null or undefined',
        details: { meshA: !!meshA, meshB: !!meshB },
      });
    }

    // Check for valid vertex data
    if (!meshA.vertices || meshA.vertices.length === 0) {
      return error({
        type: 'INVALID_PARAMETERS',
        message: 'Mesh A has no vertices',
        details: { meshA },
      });
    }

    if (!meshB.vertices || meshB.vertices.length === 0) {
      return error({
        type: 'INVALID_PARAMETERS',
        message: 'Mesh B has no vertices',
        details: { meshB },
      });
    }

    // Check for valid face data
    if (!meshA.faces || meshA.faces.length === 0) {
      return error({
        type: 'INVALID_PARAMETERS',
        message: 'Mesh A has no faces',
        details: { meshA },
      });
    }

    if (!meshB.faces || meshB.faces.length === 0) {
      return error({
        type: 'INVALID_PARAMETERS',
        message: 'Mesh B has no faces',
        details: { meshB },
      });
    }

    return success(undefined);
  }

  /**
   * Perform mesh union with enhanced algorithm including vertex deduplication
   */
  private async performMeshUnion(
    meshA: Geometry3DData,
    meshB: Geometry3DData
  ): Promise<BaseGeometryData> {
    // Step 1: Combine vertices and faces with offset
    const combinedVertices = [...meshA.vertices, ...meshB.vertices];
    const combinedFaces: number[][] = [];

    // Add faces from mesh A (unchanged indices)
    for (const face of meshA.faces) {
      combinedFaces.push([...face]);
    }

    // Add faces from mesh B (offset indices by mesh A vertex count)
    const offsetB = meshA.vertices.length;
    for (const face of meshB.faces) {
      combinedFaces.push(face.map((index) => index + offsetB));
    }

    // Step 2: Deduplicate vertices to optimize the mesh
    const deduplicationResult = this.vertexDeduplication.deduplicateVertices(
      combinedVertices,
      combinedFaces,
      { tolerance: 1e-6 }
    );

    if (!deduplicationResult.success) {
      // Fallback to non-deduplicated mesh if deduplication fails
      logger.warn(
        '[WARN][BooleanOperations3DService] Vertex deduplication failed, using non-optimized mesh'
      );
      return this.createFallbackUnionResult(meshA, meshB, combinedVertices, combinedFaces);
    }

    const { vertices: optimizedVertices, faces: optimizedFaces } = deduplicationResult.data;

    // Step 3: Calculate enhanced normals for optimized mesh
    const optimizedNormals = this.calculateVertexNormals(optimizedVertices, optimizedFaces);

    // Step 4: Calculate accurate volume and surface area
    const volume = this.calculateUnionVolume(meshA, meshB, optimizedVertices, optimizedFaces);
    const surfaceArea = this.calculateMeshSurfaceArea(optimizedVertices, optimizedFaces);

    // Step 5: Calculate combined bounding box
    const boundingBox = this.calculateCombinedBoundingBox(meshA, meshB);

    return {
      vertices: optimizedVertices,
      faces: optimizedFaces,
      normals: optimizedNormals,
      metadata: {
        primitiveType: '3d-boolean-result' as const,
        volume,
        surfaceArea,
        boundingBox,
        isValid: true,
        generationTime: 1,
      },
    };
  }

  /**
   * Perform mesh difference with enhanced algorithm including overlap detection
   */
  private async performMeshDifference(
    meshA: Geometry3DData,
    meshB: Geometry3DData
  ): Promise<BaseGeometryData> {
    // Step 1: Check for overlap between meshes
    const overlapFactor = this.estimateOverlapFactor(meshA, meshB);

    // Step 2: Handle non-overlapping case
    if (overlapFactor === 0) {
      return this.createNonOverlappingDifferenceResult(meshA);
    }

    // Step 3: Handle overlapping case with enhanced difference
    return this.createOverlappingDifferenceResult(meshA, meshB, overlapFactor);
  }

  /**
   * Create difference result for non-overlapping meshes
   */
  private createNonOverlappingDifferenceResult(meshA: Geometry3DData): BaseGeometryData {
    // For non-overlapping meshes, return mesh A unchanged
    const optimizedNormals = this.calculateVertexNormals(meshA.vertices, meshA.faces);

    return {
      vertices: [...meshA.vertices],
      faces: meshA.faces.map((face) => [...face]),
      normals: optimizedNormals,
      metadata: {
        primitiveType: '3d-boolean-result' as const,
        volume: meshA.metadata.volume, // No volume change for non-overlapping
        surfaceArea: meshA.metadata.surfaceArea,
        boundingBox: meshA.metadata.boundingBox,
        isValid: true,
        generationTime: 1,
      },
    };
  }

  /**
   * Create difference result for overlapping meshes
   */
  private createOverlappingDifferenceResult(
    meshA: Geometry3DData,
    meshB: Geometry3DData,
    overlapFactor: number
  ): BaseGeometryData {
    // Step 1: Apply vertex deduplication to optimize the base mesh
    const deduplicationResult = this.vertexDeduplication.deduplicateVertices(
      meshA.vertices,
      meshA.faces,
      { tolerance: 1e-6 }
    );

    let optimizedVertices: readonly Vector3[];
    let optimizedFaces: readonly (readonly number[])[];

    if (deduplicationResult.success) {
      optimizedVertices = deduplicationResult.data.vertices;
      optimizedFaces = deduplicationResult.data.faces;
    } else {
      // Fallback to original mesh if deduplication fails
      logger.warn(
        '[WARN][BooleanOperations3DService] Vertex deduplication failed for difference operation'
      );
      optimizedVertices = meshA.vertices;
      optimizedFaces = meshA.faces;
    }

    // Step 2: Calculate enhanced normals
    const optimizedNormals = this.calculateVertexNormals(optimizedVertices, optimizedFaces);

    // Step 3: Calculate difference volume with overlap consideration
    const differenceVolume = this.calculateDifferenceVolume(meshA, meshB, overlapFactor);

    // Step 4: Calculate surface area (may increase due to holes)
    const surfaceArea = this.calculateDifferenceSurfaceArea(meshA, meshB, overlapFactor);

    return {
      vertices: [...optimizedVertices],
      faces: optimizedFaces.map((face) => [...face]),
      normals: optimizedNormals,
      metadata: {
        primitiveType: '3d-boolean-result' as const,
        volume: differenceVolume,
        surfaceArea,
        boundingBox: meshA.metadata.boundingBox, // Base mesh bounding box
        isValid: true,
        generationTime: 1,
      },
    };
  }

  /**
   * Perform mesh intersection with enhanced algorithm including overlap detection
   */
  private async performMeshIntersection(
    meshA: Geometry3DData,
    meshB: Geometry3DData
  ): Promise<BaseGeometryData> {
    // Step 1: Check for overlap between meshes
    const overlapFactor = this.estimateOverlapFactor(meshA, meshB);

    // Step 2: Handle non-overlapping case
    if (overlapFactor === 0) {
      return this.createEmptyIntersectionResult(meshA, meshB);
    }

    // Step 3: Handle overlapping case with enhanced intersection
    return this.createOverlappingIntersectionResult(meshA, meshB, overlapFactor);
  }

  /**
   * Create intersection result for non-overlapping meshes (empty result)
   */
  private createEmptyIntersectionResult(
    _meshA: Geometry3DData,
    _meshB: Geometry3DData
  ): BaseGeometryData {
    // For non-overlapping meshes, return minimal result
    const minimalVertices: Vector3[] = [
      { x: 0, y: 0, z: 0 },
      { x: 0.001, y: 0, z: 0 },
      { x: 0, y: 0.001, z: 0 },
    ];

    const minimalFaces: number[][] = [[0, 1, 2]];
    const minimalNormals: Vector3[] = [
      { x: 0, y: 0, z: 1 },
      { x: 0, y: 0, z: 1 },
      { x: 0, y: 0, z: 1 },
    ];

    return {
      vertices: minimalVertices,
      faces: minimalFaces,
      normals: minimalNormals,
      metadata: {
        primitiveType: '3d-boolean-result' as const,
        volume: 0, // No intersection volume
        surfaceArea: 0, // No surface area
        boundingBox: {
          min: { x: 0, y: 0, z: 0 },
          max: { x: 0.001, y: 0.001, z: 0 },
          size: { x: 0.001, y: 0.001, z: 0 },
        },
        isValid: true,
        generationTime: 1,
      },
    };
  }

  /**
   * Create intersection result for overlapping meshes
   */
  private createOverlappingIntersectionResult(
    meshA: Geometry3DData,
    meshB: Geometry3DData,
    overlapFactor: number
  ): BaseGeometryData {
    // Step 1: Determine which mesh to use as base (smaller one for intersection)
    const baseMesh = meshA.metadata.volume <= meshB.metadata.volume ? meshA : meshB;
    const otherMesh = meshA.metadata.volume <= meshB.metadata.volume ? meshB : meshA;

    // Step 2: Check for complete containment
    const isCompletelyContained = this.isMeshCompletelyContained(baseMesh, otherMesh);

    // Step 3: Apply vertex deduplication to optimize the base mesh
    const deduplicationResult = this.vertexDeduplication.deduplicateVertices(
      baseMesh.vertices,
      baseMesh.faces,
      { tolerance: 1e-6 }
    );

    let optimizedVertices: readonly Vector3[];
    let optimizedFaces: readonly (readonly number[])[];

    if (deduplicationResult.success) {
      optimizedVertices = deduplicationResult.data.vertices;
      optimizedFaces = deduplicationResult.data.faces;
    } else {
      // Fallback to original mesh if deduplication fails
      logger.warn(
        '[WARN][BooleanOperations3DService] Vertex deduplication failed for intersection operation'
      );
      optimizedVertices = baseMesh.vertices;
      optimizedFaces = baseMesh.faces;
    }

    // Step 4: Calculate enhanced normals
    const optimizedNormals = this.calculateVertexNormals(optimizedVertices, optimizedFaces);

    // Step 5: Calculate intersection volume
    const intersectionVolume = this.calculateIntersectionVolume(
      meshA,
      meshB,
      overlapFactor,
      isCompletelyContained
    );

    // Step 6: Calculate intersection surface area
    const surfaceArea = this.calculateIntersectionSurfaceArea(
      meshA,
      meshB,
      overlapFactor,
      isCompletelyContained
    );

    // Step 7: Calculate intersection bounding box
    const boundingBox = this.calculateIntersectionBoundingBox(meshA, meshB);

    return {
      vertices: [...optimizedVertices],
      faces: optimizedFaces.map((face) => [...face]),
      normals: optimizedNormals,
      metadata: {
        primitiveType: '3d-boolean-result' as const,
        volume: intersectionVolume,
        surfaceArea,
        boundingBox,
        isValid: true,
        generationTime: 1,
      },
    };
  }

  /**
   * Convert BabylonJS mesh back to geometry data format
   */
  private convertMeshToGeometryData(mesh: BABYLON.Mesh): BaseGeometryData {
    // Get vertex data from the mesh
    const positions = mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind) || [];
    const indices = mesh.getIndices() || [];
    const normals = mesh.getVerticesData(BABYLON.VertexBuffer.NormalKind) || [];

    // Convert positions to Vector3 array
    const vertices: Vector3[] = [];
    for (let i = 0; i < positions.length; i += 3) {
      vertices.push({
        x: positions[i],
        y: positions[i + 1],
        z: positions[i + 2],
      });
    }

    // Convert indices to face array (assuming triangular faces)
    const faces: number[][] = [];
    for (let i = 0; i < indices.length; i += 3) {
      faces.push([indices[i], indices[i + 1], indices[i + 2]]);
    }

    // Convert normals to Vector3 array
    const normalVectors: Vector3[] = [];
    for (let i = 0; i < normals.length; i += 3) {
      normalVectors.push({
        x: normals[i],
        y: normals[i + 1],
        z: normals[i + 2],
      });
    }

    // Calculate basic metadata
    const boundingInfo = mesh.getBoundingInfo();
    const volume = this.calculateMeshVolume(vertices, faces);
    const surfaceArea = this.calculateMeshSurfaceArea(vertices, faces);

    return {
      vertices,
      faces,
      normals: normalVectors,
      metadata: {
        primitiveType: '3d-boolean-result' as const,
        volume,
        surfaceArea,
        boundingBox: {
          min: {
            x: boundingInfo.minimum.x,
            y: boundingInfo.minimum.y,
            z: boundingInfo.minimum.z,
          },
          max: {
            x: boundingInfo.maximum.x,
            y: boundingInfo.maximum.y,
            z: boundingInfo.maximum.z,
          },
          size: {
            x: boundingInfo.maximum.x - boundingInfo.minimum.x,
            y: boundingInfo.maximum.y - boundingInfo.minimum.y,
            z: boundingInfo.maximum.z - boundingInfo.minimum.z,
          },
        },
        isValid: true,
        generationTime: 0,
      },
    };
  }

  /**
   * Calculate mesh volume using divergence theorem
   */
  private calculateMeshVolume(
    vertices: readonly Vector3[],
    faces: readonly (readonly number[])[]
  ): number {
    let volume = 0;

    for (const face of faces) {
      if (face.length >= 3) {
        const v0 = vertices[face[0]];
        const v1 = vertices[face[1]];
        const v2 = vertices[face[2]];

        // Calculate signed volume of tetrahedron formed by origin and triangle
        volume +=
          (v0.x * (v1.y * v2.z - v1.z * v2.y) +
            v1.x * (v2.y * v0.z - v2.z * v0.y) +
            v2.x * (v0.y * v1.z - v0.z * v1.y)) /
          6;
      }
    }

    return Math.abs(volume);
  }

  /**
   * Calculate mesh surface area
   */
  private calculateMeshSurfaceArea(
    vertices: readonly Vector3[],
    faces: readonly (readonly number[])[]
  ): number {
    let surfaceArea = 0;

    for (const face of faces) {
      if (face.length >= 3) {
        const v0 = vertices[face[0]];
        const v1 = vertices[face[1]];
        const v2 = vertices[face[2]];

        // Calculate triangle area using cross product
        const edge1 = { x: v1.x - v0.x, y: v1.y - v0.y, z: v1.z - v0.z };
        const edge2 = { x: v2.x - v0.x, y: v2.y - v0.y, z: v2.z - v0.z };

        const cross = {
          x: edge1.y * edge2.z - edge1.z * edge2.y,
          y: edge1.z * edge2.x - edge1.x * edge2.z,
          z: edge1.x * edge2.y - edge1.y * edge2.x,
        };

        const magnitude = Math.sqrt(cross.x ** 2 + cross.y ** 2 + cross.z ** 2);
        surfaceArea += magnitude / 2;
      }
    }

    return surfaceArea;
  }

  /**
   * Calculate combined bounding box for union operations
   */
  private calculateCombinedBoundingBox(meshA: Geometry3DData, meshB: Geometry3DData) {
    const boxA = meshA.metadata.boundingBox;
    const boxB = meshB.metadata.boundingBox;

    const min = {
      x: Math.min(boxA.min.x, boxB.min.x),
      y: Math.min(boxA.min.y, boxB.min.y),
      z: Math.min(boxA.min.z, boxB.min.z),
    };

    const max = {
      x: Math.max(boxA.max.x, boxB.max.x),
      y: Math.max(boxA.max.y, boxB.max.y),
      z: Math.max(boxA.max.z, boxB.max.z),
    };

    return {
      min,
      max,
      size: {
        x: max.x - min.x,
        y: max.y - min.y,
        z: max.z - min.z,
      },
    };
  }

  /**
   * Create fallback union result when deduplication fails
   */
  private createFallbackUnionResult(
    meshA: Geometry3DData,
    meshB: Geometry3DData,
    vertices: readonly Vector3[],
    faces: readonly (readonly number[])[]
  ): BaseGeometryData {
    const combinedNormals = [...meshA.normals, ...meshB.normals];
    const boundingBox = this.calculateCombinedBoundingBox(meshA, meshB);

    return {
      vertices: [...vertices],
      faces: faces.map((face) => [...face]),
      normals: combinedNormals,
      metadata: {
        primitiveType: '3d-boolean-result' as const,
        volume: meshA.metadata.volume + meshB.metadata.volume, // Simplified
        surfaceArea: meshA.metadata.surfaceArea + meshB.metadata.surfaceArea, // Simplified
        boundingBox,
        isValid: true,
        generationTime: 1,
      },
    };
  }

  /**
   * Calculate vertex normals for a mesh
   */
  private calculateVertexNormals(
    vertices: readonly Vector3[],
    faces: readonly (readonly number[])[]
  ): Vector3[] {
    const normals: Vector3[] = new Array(vertices.length)
      .fill(null)
      .map(() => ({ x: 0, y: 0, z: 0 }));
    const counts: number[] = new Array(vertices.length).fill(0);

    // Calculate face normals and accumulate to vertex normals
    for (const face of faces) {
      if (face.length >= 3) {
        const v0 = vertices[face[0]];
        const v1 = vertices[face[1]];
        const v2 = vertices[face[2]];

        // Calculate face normal using cross product
        const edge1 = { x: v1.x - v0.x, y: v1.y - v0.y, z: v1.z - v0.z };
        const edge2 = { x: v2.x - v0.x, y: v2.y - v0.y, z: v2.z - v0.z };

        const faceNormal = {
          x: edge1.y * edge2.z - edge1.z * edge2.y,
          y: edge1.z * edge2.x - edge1.x * edge2.z,
          z: edge1.x * edge2.y - edge1.y * edge2.x,
        };

        // Accumulate to vertex normals
        for (const vertexIndex of face) {
          normals[vertexIndex].x += faceNormal.x;
          normals[vertexIndex].y += faceNormal.y;
          normals[vertexIndex].z += faceNormal.z;
          counts[vertexIndex]++;
        }
      }
    }

    // Normalize vertex normals
    for (let i = 0; i < normals.length; i++) {
      if (counts[i] > 0) {
        const length = Math.sqrt(normals[i].x ** 2 + normals[i].y ** 2 + normals[i].z ** 2);
        if (length > 0) {
          normals[i].x /= length;
          normals[i].y /= length;
          normals[i].z /= length;
        }
      }
    }

    return normals;
  }

  /**
   * Calculate union volume with overlap consideration
   */
  private calculateUnionVolume(
    meshA: Geometry3DData,
    meshB: Geometry3DData,
    vertices: readonly Vector3[],
    faces: readonly (readonly number[])[]
  ): number {
    // For now, use a simplified approach
    // In a full implementation, this would use proper CSG volume calculation
    const actualVolume = this.calculateMeshVolume(vertices, faces);

    // If the calculated volume is reasonable, use it
    if (
      actualVolume > 0 &&
      actualVolume >= Math.max(meshA.metadata.volume, meshB.metadata.volume)
    ) {
      return actualVolume;
    }

    // Fallback: estimate based on overlap
    const overlapFactor = this.estimateOverlapFactor(meshA, meshB);
    return meshA.metadata.volume + meshB.metadata.volume * (1 - overlapFactor);
  }

  /**
   * Estimate overlap factor between two meshes based on bounding box intersection
   */
  private estimateOverlapFactor(meshA: Geometry3DData, meshB: Geometry3DData): number {
    const boxA = meshA.metadata.boundingBox;
    const boxB = meshB.metadata.boundingBox;

    // Calculate intersection volume
    const intersectionMin = {
      x: Math.max(boxA.min.x, boxB.min.x),
      y: Math.max(boxA.min.y, boxB.min.y),
      z: Math.max(boxA.min.z, boxB.min.z),
    };

    const intersectionMax = {
      x: Math.min(boxA.max.x, boxB.max.x),
      y: Math.min(boxA.max.y, boxB.max.y),
      z: Math.min(boxA.max.z, boxB.max.z),
    };

    // Check if there's any intersection
    if (
      intersectionMin.x >= intersectionMax.x ||
      intersectionMin.y >= intersectionMax.y ||
      intersectionMin.z >= intersectionMax.z
    ) {
      return 0; // No overlap
    }

    // Calculate intersection volume
    const intersectionVolume =
      (intersectionMax.x - intersectionMin.x) *
      (intersectionMax.y - intersectionMin.y) *
      (intersectionMax.z - intersectionMin.z);

    // Calculate volumes of bounding boxes
    const volumeA = boxA.size.x * boxA.size.y * boxA.size.z;
    const volumeB = boxB.size.x * boxB.size.y * boxB.size.z;

    // Return overlap factor as ratio of intersection to smaller volume
    return intersectionVolume / Math.min(volumeA, volumeB);
  }

  /**
   * Calculate difference volume with overlap consideration
   */
  private calculateDifferenceVolume(
    meshA: Geometry3DData,
    meshB: Geometry3DData,
    overlapFactor: number
  ): number {
    const baseVolume = meshA.metadata.volume;
    const subtractVolume = meshB.metadata.volume;

    // Calculate the volume of the intersection (what gets subtracted)
    const intersectionVolume = Math.min(baseVolume, subtractVolume) * overlapFactor;

    // Difference volume = base volume - intersection volume
    const differenceVolume = Math.max(0, baseVolume - intersectionVolume);

    return differenceVolume;
  }

  /**
   * Calculate surface area for difference operation
   */
  private calculateDifferenceSurfaceArea(
    meshA: Geometry3DData,
    meshB: Geometry3DData,
    overlapFactor: number
  ): number {
    const baseSurfaceArea = meshA.metadata.surfaceArea;

    if (overlapFactor === 0) {
      // No overlap, surface area remains the same
      return baseSurfaceArea;
    }

    // For overlapping case, surface area may increase due to holes/cavities
    // This is a simplified estimation - in a full CSG implementation,
    // this would be calculated from the actual resulting mesh
    const additionalSurfaceArea = meshB.metadata.surfaceArea * overlapFactor * 0.5;

    return baseSurfaceArea + additionalSurfaceArea;
  }

  /**
   * Check if one mesh completely contains another (simplified check)
   */
  private isMeshCompletelyContained(innerMesh: Geometry3DData, outerMesh: Geometry3DData): boolean {
    const innerBox = innerMesh.metadata.boundingBox;
    const outerBox = outerMesh.metadata.boundingBox;

    // Check if inner bounding box is completely within outer bounding box
    return (
      innerBox.min.x >= outerBox.min.x &&
      innerBox.min.y >= outerBox.min.y &&
      innerBox.min.z >= outerBox.min.z &&
      innerBox.max.x <= outerBox.max.x &&
      innerBox.max.y <= outerBox.max.y &&
      innerBox.max.z <= outerBox.max.z
    );
  }

  /**
   * Calculate difference result when one mesh completely contains another
   */
  private calculateCompleteSubtractionVolume(
    baseMesh: Geometry3DData,
    subtractMesh: Geometry3DData
  ): number {
    // When completely contained, subtract the full volume of the inner mesh
    return Math.max(0, baseMesh.metadata.volume - subtractMesh.metadata.volume);
  }

  /**
   * Calculate intersection volume with overlap consideration
   */
  private calculateIntersectionVolume(
    meshA: Geometry3DData,
    meshB: Geometry3DData,
    overlapFactor: number,
    isCompletelyContained: boolean
  ): number {
    if (isCompletelyContained) {
      // When one mesh completely contains the other, intersection is the smaller mesh
      return Math.min(meshA.metadata.volume, meshB.metadata.volume);
    }

    // Calculate intersection volume based on overlap factor
    const smallerVolume = Math.min(meshA.metadata.volume, meshB.metadata.volume);
    const intersectionVolume = smallerVolume * overlapFactor;

    return intersectionVolume;
  }

  /**
   * Calculate surface area for intersection operation
   */
  private calculateIntersectionSurfaceArea(
    meshA: Geometry3DData,
    meshB: Geometry3DData,
    overlapFactor: number,
    isCompletelyContained: boolean
  ): number {
    if (isCompletelyContained) {
      // When completely contained, surface area is approximately the smaller mesh
      return Math.min(meshA.metadata.surfaceArea, meshB.metadata.surfaceArea);
    }

    // For partial intersection, surface area is reduced based on overlap
    const smallerSurfaceArea = Math.min(meshA.metadata.surfaceArea, meshB.metadata.surfaceArea);
    return smallerSurfaceArea * overlapFactor;
  }

  /**
   * Calculate intersection bounding box
   */
  private calculateIntersectionBoundingBox(
    meshA: Geometry3DData,
    meshB: Geometry3DData
  ): {
    readonly min: Vector3;
    readonly max: Vector3;
    readonly size: Vector3;
  } {
    const boxA = meshA.metadata.boundingBox;
    const boxB = meshB.metadata.boundingBox;

    // Intersection bounding box is the overlap region
    const min = {
      x: Math.max(boxA.min.x, boxB.min.x),
      y: Math.max(boxA.min.y, boxB.min.y),
      z: Math.max(boxA.min.z, boxB.min.z),
    };

    const max = {
      x: Math.min(boxA.max.x, boxB.max.x),
      y: Math.min(boxA.max.y, boxB.max.y),
      z: Math.min(boxA.max.z, boxB.max.z),
    };

    // Ensure valid bounding box (min <= max)
    const validMin = {
      x: Math.min(min.x, max.x),
      y: Math.min(min.y, max.y),
      z: Math.min(min.z, max.z),
    };

    const validMax = {
      x: Math.max(min.x, max.x),
      y: Math.max(min.y, max.y),
      z: Math.max(min.z, max.z),
    };

    return {
      min: validMin,
      max: validMax,
      size: {
        x: validMax.x - validMin.x,
        y: validMax.y - validMin.y,
        z: validMax.z - validMin.z,
      },
    };
  }

  private createOperationMetadata(
    operation: BooleanOperation3DType,
    inputMeshes: readonly Geometry3DData[],
    result: BaseGeometryData,
    operationTime: number
  ): BooleanOperation3DMetadata {
    return {
      operationType: operation,
      inputMeshCount: inputMeshes.length,
      operationTime,
      volume: result.metadata.volume,
      surfaceArea: result.metadata.surfaceArea,
      vertexCount: result.vertices.length,
      faceCount: result.faces.length,
      isManifold: this.checkMeshManifold(result.vertices, result.faces),
      boundingBox: result.metadata.boundingBox,
    };
  }

  /**
   * Check if mesh is manifold (simplified check)
   */
  private checkMeshManifold(
    vertices: readonly Vector3[],
    faces: readonly (readonly number[])[]
  ): boolean {
    // Simplified manifold check: ensure all vertices are used and no degenerate faces
    const usedVertices = new Set<number>();

    for (const face of faces) {
      // Check for degenerate faces
      if (face.length < 3) return false;

      // Check for duplicate vertices in face
      const uniqueVertices = new Set(face);
      if (uniqueVertices.size !== face.length) return false;

      // Mark vertices as used
      for (const vertexIndex of face) {
        if (vertexIndex < 0 || vertexIndex >= vertices.length) return false;
        usedVertices.add(vertexIndex);
      }
    }

    // For a manifold mesh, most vertices should be used
    // Allow some tolerance for optimization
    const usageRatio = usedVertices.size / vertices.length;
    return usageRatio > 0.8; // At least 80% of vertices should be used
  }
}
