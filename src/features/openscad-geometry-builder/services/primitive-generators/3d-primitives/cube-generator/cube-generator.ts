/**
 * @file cube-generator.ts
 * @description Cube Generator Service that replicates OpenSCAD's exact cube generation algorithm.
 * This service generates 8-vertex box geometry with proper center parameter handling.
 *
 * @example
 * ```typescript
 * const cubeGenerator = new CubeGeneratorService();
 *
 * // Generate centered cube
 * const result = cubeGenerator.generateCube({ x: 2, y: 4, z: 6 }, true);
 * if (result.success) {
 *   const cube = result.data;
 *   console.log(`Generated cube with ${cube.vertices.length} vertices`);
 * }
 *
 * // Generate cube from OpenSCAD parameters
 * const paramResult = cubeGenerator.generateCubeFromParameters({
 *   size: { x: 5, y: 5, z: 5 },
 *   center: false
 * });
 * ```
 *
 * @author OpenSCAD Babylon Team
 * @version 1.0.0
 * @since 2025-07-29
 */

import type { Result } from '../../../../../../shared/types/result.types';
import { error, success } from '../../../../../../shared/utils/functional/result';
import type {
  CubeGeometryData,
  GeometryGenerationError,
  Vector3,
} from '../../../../types/geometry-data';
import type { CubeParameters } from '../../../../types/primitive-parameters';
import { createGeometryData, createGeometryMetadata } from '../../../../utils/geometry-helpers';
import { validateSizeDimensions } from '../../../../utils/validation-helpers';

/**
 * Cube generation result type
 */
export type CubeResult = Result<CubeGeometryData, GeometryGenerationError>;

/**
 * Cube Generator Service
 *
 * Replicates OpenSCAD's exact cube generation algorithm from primitives.cc:
 * ```cpp
 * double x1, x2, y1, y2, z1, z2;
 * if (this->center) {
 *   x1 = -this->x / 2; x2 = +this->x / 2;
 *   y1 = -this->y / 2; y2 = +this->y / 2;
 *   z1 = -this->z / 2; z2 = +this->z / 2;
 * } else {
 *   x1 = 0; x2 = this->x;
 *   y1 = 0; y2 = this->y;
 *   z1 = 0; z2 = this->z;
 * }
 * // Creates 8 vertices, 6 faces (quads)
 * ```
 */
export class CubeGeneratorService {
  /**
   * Generate cube geometry with exact OpenSCAD algorithm
   *
   * @param size - Cube size as Vector3 or uniform number
   * @param center - Whether to center the cube at origin
   * @returns Result containing cube geometry data or error
   */
  generateCube(size: Vector3 | number, center: boolean): CubeResult {
    try {
      // Convert size to Vector3 if it's a number
      const cubeSize: Vector3 = typeof size === 'number' ? { x: size, y: size, z: size } : size;

      // Validate parameters
      const validationResult = this.validateParameters(cubeSize);
      if (!validationResult.success) {
        return validationResult as Result<CubeGeometryData, GeometryGenerationError>;
      }

      // Calculate cube bounds using OpenSCAD algorithm
      const bounds = this.calculateCubeBounds(cubeSize, center);

      // Generate 8 vertices for the cube
      const vertices = this.generateCubeVertices(bounds);

      // Generate normals for each vertex
      const normals = this.generateCubeNormals(vertices, bounds);

      // Generate 6 quad faces
      const faces = this.generateCubeFaces();

      // Create cube geometry data using utilities
      const metadata = createGeometryMetadata('3d-cube', { size: cubeSize, center }, true);

      const cubeData = createGeometryData<CubeGeometryData>(vertices, faces, normals, metadata);

      return success(cubeData);
    } catch (err) {
      return error({
        type: 'COMPUTATION_ERROR',
        message: `Cube generation failed: ${err instanceof Error ? err.message : String(err)}`,
        details: { size, center },
      });
    }
  }

  /**
   * Generate cube from OpenSCAD parameters
   *
   * @param params - OpenSCAD cube parameters
   * @returns Result containing cube geometry data or error
   */
  generateCubeFromParameters(params: CubeParameters): CubeResult {
    try {
      return this.generateCube(params.size, params.center);
    } catch (err) {
      return error({
        type: 'COMPUTATION_ERROR',
        message: `Cube parameter processing failed: ${err instanceof Error ? err.message : String(err)}`,
        details: { params },
      });
    }
  }

  /**
   * Validate cube generation parameters
   */
  private validateParameters(size: Vector3): Result<void, GeometryGenerationError> {
    // Use centralized size validation utility
    return validateSizeDimensions(size);
  }

  /**
   * Calculate cube bounds using OpenSCAD algorithm
   */
  private calculateCubeBounds(
    size: Vector3,
    center: boolean
  ): {
    x1: number;
    x2: number;
    y1: number;
    y2: number;
    z1: number;
    z2: number;
  } {
    if (center) {
      // Centered cube: bounds are symmetric around origin
      return {
        x1: -size.x / 2,
        x2: size.x / 2,
        y1: -size.y / 2,
        y2: size.y / 2,
        z1: -size.z / 2,
        z2: size.z / 2,
      };
    } else {
      // Non-centered cube: starts at origin
      return {
        x1: 0,
        x2: size.x,
        y1: 0,
        y2: size.y,
        z1: 0,
        z2: size.z,
      };
    }
  }

  /**
   * Generate 8 vertices for the cube in standard order
   */
  private generateCubeVertices(bounds: {
    x1: number;
    x2: number;
    y1: number;
    y2: number;
    z1: number;
    z2: number;
  }): readonly Vector3[] {
    // Generate vertices in standard order (binary counting pattern)
    return Object.freeze([
      { x: bounds.x1, y: bounds.y1, z: bounds.z1 }, // 0: 000 (min corner)
      { x: bounds.x2, y: bounds.y1, z: bounds.z1 }, // 1: 001 (+x)
      { x: bounds.x2, y: bounds.y2, z: bounds.z1 }, // 2: 011 (+x,+y)
      { x: bounds.x1, y: bounds.y2, z: bounds.z1 }, // 3: 010 (+y)
      { x: bounds.x1, y: bounds.y1, z: bounds.z2 }, // 4: 100 (+z)
      { x: bounds.x2, y: bounds.y1, z: bounds.z2 }, // 5: 101 (+x,+z)
      { x: bounds.x2, y: bounds.y2, z: bounds.z2 }, // 6: 111 (max corner)
      { x: bounds.x1, y: bounds.y2, z: bounds.z2 }, // 7: 110 (+y,+z)
    ]);
  }

  /**
   * Generate normals for cube vertices
   * Each vertex normal points outward from the cube center
   */
  private generateCubeNormals(
    vertices: readonly Vector3[],
    bounds: {
      x1: number;
      x2: number;
      y1: number;
      y2: number;
      z1: number;
      z2: number;
    }
  ): readonly Vector3[] {
    const center = {
      x: (bounds.x1 + bounds.x2) / 2,
      y: (bounds.y1 + bounds.y2) / 2,
      z: (bounds.z1 + bounds.z2) / 2,
    };

    return Object.freeze(
      vertices.map((vertex) => {
        // Calculate direction from center to vertex
        const direction = {
          x: vertex.x - center.x,
          y: vertex.y - center.y,
          z: vertex.z - center.z,
        };

        // Normalize the direction vector
        const length = Math.sqrt(
          direction.x * direction.x + direction.y * direction.y + direction.z * direction.z
        );

        if (length === 0) {
          // Degenerate case: return up vector
          return { x: 0, y: 0, z: 1 };
        }

        return {
          x: direction.x / length,
          y: direction.y / length,
          z: direction.z / length,
        };
      })
    );
  }

  /**
   * Generate 6 quad faces for the cube
   * Faces are ordered: front, back, left, right, bottom, top
   */
  private generateCubeFaces(): readonly (readonly number[])[] {
    // Define faces using vertex indices
    // Each face is a quad with vertices in counter-clockwise order (outward normal)
    return Object.freeze([
      // Front face (z = z1)
      Object.freeze([0, 1, 2, 3]),
      // Back face (z = z2)
      Object.freeze([5, 4, 7, 6]),
      // Left face (x = x1)
      Object.freeze([4, 0, 3, 7]),
      // Right face (x = x2)
      Object.freeze([1, 5, 6, 2]),
      // Bottom face (y = y1)
      Object.freeze([4, 5, 1, 0]),
      // Top face (y = y2)
      Object.freeze([3, 2, 6, 7]),
    ]);
  }

  /**
   * Get cube generation statistics for debugging
   */
  getCubeStatistics(cubeData: CubeGeometryData): {
    size: Vector3;
    center: boolean;
    vertexCount: number;
    faceCount: number;
    triangleCount: number;
    volume: number;
    surfaceArea: number;
  } {
    const size = cubeData.metadata.parameters.size;

    return {
      size,
      center: cubeData.metadata.parameters.center,
      vertexCount: cubeData.vertices.length,
      faceCount: cubeData.faces.length,
      triangleCount: cubeData.faces.length * 2, // Each quad becomes 2 triangles
      volume: size.x * size.y * size.z,
      surfaceArea: 2 * (size.x * size.y + size.y * size.z + size.z * size.x),
    };
  }
}
