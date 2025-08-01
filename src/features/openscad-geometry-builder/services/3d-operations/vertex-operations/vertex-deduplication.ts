/**
 * @file vertex-deduplication.ts
 * @description Vertex deduplication service for 3D mesh optimization.
 * Provides utilities to remove duplicate vertices and update face indices accordingly.
 *
 * @example
 * ```typescript
 * const service = new VertexDeduplicationService();
 * const result = service.deduplicateVertices(vertices, faces, 0.001);
 * if (result.success) {
 *   console.log(`Reduced from ${vertices.length} to ${result.data.vertices.length} vertices`);
 * }
 * ```
 *
 * @author OpenSCAD Babylon Team
 * @version 1.0.0
 * @since 2025-07-30
 */

import type { Result } from '@/shared';
import { createLogger, error, success } from '@/shared';
import type { GeometryGenerationError, Vector3 } from '../../../types/geometry-data';

const logger = createLogger('VertexDeduplicationService');

/**
 * Vertex deduplication result
 */
export interface VertexDeduplicationResult {
  readonly vertices: readonly Vector3[];
  readonly faces: readonly (readonly number[])[];
  readonly vertexMapping: readonly number[]; // Maps old indices to new indices
  readonly duplicatesRemoved: number;
  readonly compressionRatio: number;
}

/**
 * Vertex deduplication options
 */
export interface VertexDeduplicationOptions {
  readonly tolerance: number; // Distance tolerance for considering vertices identical
  readonly preserveNormals: boolean; // Whether to consider normals in deduplication
  readonly preserveUVs: boolean; // Whether to consider UV coordinates in deduplication
}

/**
 * Default deduplication options
 */
const DEFAULT_DEDUPLICATION_OPTIONS: VertexDeduplicationOptions = {
  tolerance: 1e-6,
  preserveNormals: false,
  preserveUVs: false,
} as const;

/**
 * Vertex Deduplication Service
 *
 * Provides efficient vertex deduplication for 3D meshes using spatial hashing
 * and configurable tolerance levels.
 */
export class VertexDeduplicationService {
  /**
   * Deduplicate vertices in a mesh
   *
   * @param vertices - Array of vertices to deduplicate
   * @param faces - Array of face indices
   * @param options - Deduplication options
   * @returns Result containing deduplicated mesh data
   */
  deduplicateVertices(
    vertices: readonly Vector3[],
    faces: readonly (readonly number[])[],
    options: Partial<VertexDeduplicationOptions> = {}
  ): Result<VertexDeduplicationResult, GeometryGenerationError> {
    logger.debug('[DEBUG][VertexDeduplicationService] Starting vertex deduplication');

    try {
      const opts = { ...DEFAULT_DEDUPLICATION_OPTIONS, ...options };

      // Validate inputs
      if (!vertices || vertices.length === 0) {
        return error({
          type: 'INVALID_PARAMETERS',
          message: 'Vertices array cannot be empty',
          details: { vertexCount: vertices?.length || 0 },
        });
      }

      if (!faces || faces.length === 0) {
        return error({
          type: 'INVALID_PARAMETERS',
          message: 'Faces array cannot be empty',
          details: { faceCount: faces?.length || 0 },
        });
      }

      // Perform deduplication
      const startTime = performance.now();
      const result = this.performDeduplication(vertices, faces, opts);
      const endTime = performance.now();

      logger.debug(
        `[DEBUG][VertexDeduplicationService] Deduplication completed in ${(endTime - startTime).toFixed(2)}ms. ` +
          `Reduced from ${vertices.length} to ${result.vertices.length} vertices ` +
          `(${result.duplicatesRemoved} duplicates removed, ${(result.compressionRatio * 100).toFixed(1)}% compression)`
      );

      return success(result);
    } catch (err) {
      return error({
        type: 'COMPUTATION_ERROR',
        message: `Vertex deduplication failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
        details: { vertices, faces, options },
      });
    }
  }

  /**
   * Perform the actual vertex deduplication using spatial hashing
   */
  private performDeduplication(
    vertices: readonly Vector3[],
    faces: readonly (readonly number[])[],
    options: VertexDeduplicationOptions
  ): VertexDeduplicationResult {
    const uniqueVertices: Vector3[] = [];
    const vertexMapping: number[] = new Array(vertices.length);
    const spatialHash = new Map<string, number>();

    // Build spatial hash for efficient duplicate detection
    for (let i = 0; i < vertices.length; i++) {
      const vertex = vertices[i];
      if (!vertex) continue;

      const hashKey = this.createSpatialHashKey(vertex, options.tolerance);

      const existingIndex = spatialHash.get(hashKey);
      if (existingIndex !== undefined) {
        // Check if vertices are actually close enough (hash collision check)
        const existingVertex = uniqueVertices[existingIndex];
        if (existingVertex && this.areVerticesEqual(vertex, existingVertex, options.tolerance)) {
          vertexMapping[i] = existingIndex;
          continue;
        }
      }

      // Add new unique vertex
      const newIndex = uniqueVertices.length;
      uniqueVertices.push({ ...vertex });
      vertexMapping[i] = newIndex;
      spatialHash.set(hashKey, newIndex);
    }

    // Update face indices to use new vertex mapping
    const updatedFaces: number[][] = [];
    for (const face of faces) {
      if (!face) continue;

      const newFace = face.map((index) => {
        const mappedIndex = vertexMapping[index];
        return mappedIndex !== undefined ? mappedIndex : index;
      });

      // Skip degenerate faces (faces with duplicate vertices after deduplication)
      if (this.isValidFace(newFace)) {
        updatedFaces.push(newFace);
      }
    }

    const duplicatesRemoved = vertices.length - uniqueVertices.length;
    const compressionRatio = duplicatesRemoved / vertices.length;

    return {
      vertices: uniqueVertices,
      faces: updatedFaces,
      vertexMapping,
      duplicatesRemoved,
      compressionRatio,
    };
  }

  /**
   * Create spatial hash key for vertex
   */
  private createSpatialHashKey(vertex: Vector3, tolerance: number): string {
    const scale = 1 / tolerance;
    const x = Math.floor(vertex.x * scale);
    const y = Math.floor(vertex.y * scale);
    const z = Math.floor(vertex.z * scale);
    return `${x},${y},${z}`;
  }

  /**
   * Check if two vertices are equal within tolerance
   */
  private areVerticesEqual(v1: Vector3, v2: Vector3, tolerance: number): boolean {
    return (
      Math.abs(v1.x - v2.x) <= tolerance &&
      Math.abs(v1.y - v2.y) <= tolerance &&
      Math.abs(v1.z - v2.z) <= tolerance
    );
  }

  /**
   * Check if face is valid (no duplicate vertices)
   */
  private isValidFace(face: readonly number[]): boolean {
    const uniqueIndices = new Set(face);
    return uniqueIndices.size === face.length && face.length >= 3;
  }

  /**
   * Get deduplication statistics
   */
  getDeduplicationStats(
    originalVertexCount: number,
    result: VertexDeduplicationResult
  ): {
    readonly originalVertexCount: number;
    readonly finalVertexCount: number;
    readonly duplicatesRemoved: number;
    readonly compressionRatio: number;
    readonly memoryReduction: number;
  } {
    const memoryReduction = (result.duplicatesRemoved * 12) / 1024; // Assuming 12 bytes per vertex (3 floats)

    return {
      originalVertexCount,
      finalVertexCount: result.vertices.length,
      duplicatesRemoved: result.duplicatesRemoved,
      compressionRatio: result.compressionRatio,
      memoryReduction, // KB saved
    };
  }
}
