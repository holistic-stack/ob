/**
 * @file polygon-generator.ts
 * @description Polygon Generator Service that replicates OpenSCAD's polygon generation.
 * Generates 2D polygons with points and optional paths parameters compatible with OpenSCAD specifications.
 *
 * @example
 * ```typescript
 * const generator = new PolygonGeneratorService();
 *
 * // Generate simple triangle
 * const result = generator.generatePolygon({
 *   points: [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 5, y: 10 }],
 *   convexity: 1
 * });
 * if (result.success) {
 *   const polygon = result.data;
 *   console.log(`Generated polygon with ${polygon.vertices.length} vertices`);
 * }
 *
 * // Generate polygon with hole
 * const holeResult = generator.generatePolygon({
 *   points: [
 *     { x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }, { x: 0, y: 10 },
 *     { x: 2, y: 2 }, { x: 8, y: 2 }, { x: 8, y: 8 }, { x: 2, y: 8 }
 *   ],
 *   paths: [[0, 1, 2, 3], [4, 5, 6, 7]],
 *   convexity: 1
 * });
 * ```
 *
 * @author OpenSCAD Babylon Team
 * @version 1.0.0
 * @since 2025-07-29
 */

import type { PolygonParameters } from '@/features/openscad-geometry-builder';
import type { Result } from '@/shared';
import { error, isError, success } from '@/shared';
import type {
  Geometry2DGenerationError,
  Polygon2DGeometryData,
} from '../../../../types/2d-geometry-data';
import type { Vector2 } from '../../../../types/geometry-data';

/**
 * Polygon generation result type
 */
export type PolygonResult = Result<Polygon2DGeometryData, Geometry2DGenerationError>;

/**
 * Polygon Generator Service
 *
 * Implements OpenSCAD-compatible polygon generation with points and optional paths parameters.
 * Supports complex polygons with holes following OpenSCAD's path specification.
 */
export class PolygonGeneratorService {
  /**
   * Generate 2D polygon geometry from parameters
   */
  generatePolygon(params: PolygonParameters): PolygonResult {
    try {
      // Validate parameters
      const validationResult = this.validateParameters(params);
      if (isError(validationResult)) {
        return validationResult;
      }

      // Generate polygon geometry
      const geometry = this.generatePolygonGeometry(params);

      return success(geometry);
    } catch (err) {
      return error({
        type: 'TESSELLATION_FAILED',
        message: `Polygon generation failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
        details: { params },
      });
    }
  }

  /**
   * Validate polygon parameters
   */
  private validateParameters(params: PolygonParameters): Result<void, Geometry2DGenerationError> {
    // Check that points array is provided and not empty
    if (!params.points || params.points.length === 0) {
      return error({
        type: 'INVALID_PARAMETERS',
        message: 'Points array is required and cannot be empty',
        details: { params },
      });
    }

    // Check minimum point count
    if (params.points.length < 3) {
      return error({
        type: 'INVALID_PARAMETERS',
        message: 'Polygon must have at least 3 points',
        details: { params, pointCount: params.points.length },
      });
    }

    // Validate convexity parameter
    if (params.convexity < 0) {
      return error({
        type: 'INVALID_PARAMETERS',
        message: 'Convexity must be non-negative',
        details: { params, convexity: params.convexity },
      });
    }

    // Validate paths if provided
    if (params.paths) {
      const pathValidation = this.validatePaths(params.points, params.paths);
      if (isError(pathValidation)) {
        return pathValidation;
      }
    }

    return success(undefined);
  }

  /**
   * Validate paths parameter
   */
  private validatePaths(
    points: readonly Vector2[],
    paths: readonly (readonly number[])[]
  ): Result<void, Geometry2DGenerationError> {
    for (let pathIndex = 0; pathIndex < paths.length; pathIndex++) {
      const path = paths[pathIndex];

      // Validate path exists
      if (!path) {
        return error({
          type: 'INVALID_PARAMETERS',
          message: `Path at index ${pathIndex} is undefined`,
          details: { pathIndex },
        });
      }

      // Check minimum path length
      if (path.length < 3) {
        return error({
          type: 'INVALID_PARAMETERS',
          message: `Path ${pathIndex} must have at least 3 indices`,
          details: { pathIndex, pathLength: path.length },
        });
      }

      // Check that all indices are valid
      for (let i = 0; i < path.length; i++) {
        const index = path[i];

        // Validate index exists and is a number
        if (index === undefined || typeof index !== 'number') {
          return error({
            type: 'INVALID_PARAMETERS',
            message: `Invalid index at position ${i} in path ${pathIndex}`,
            details: { pathIndex, position: i, index },
          });
        }

        if (index < 0 || index >= points.length) {
          return error({
            type: 'INVALID_PARAMETERS',
            message: `Invalid path index ${index} in path ${pathIndex}`,
            details: { pathIndex, invalidIndex: index, pointCount: points.length },
          });
        }
      }
    }

    return success(undefined);
  }

  /**
   * Generate polygon geometry with specified points and paths
   */
  private generatePolygonGeometry(params: PolygonParameters): Polygon2DGeometryData {
    const { points, paths } = params;

    // Copy vertices from points
    const vertices: Vector2[] = points.map((point) => ({ x: point.x, y: point.y }));

    // Determine outline and holes
    let outline: number[];
    let holes: number[][];

    if (paths && paths.length > 0) {
      // Use paths: first path is outline, rest are holes
      const firstPath = paths[0];
      if (!firstPath) {
        throw new Error('[PolygonGenerator] First path is undefined');
      }
      outline = [...firstPath];
      holes = paths.slice(1).map((path) => [...path]);
    } else {
      // No paths: use all points in order as outline
      outline = Array.from({ length: points.length }, (_, i) => i);
      holes = [];
    }

    // Calculate area using shoelace formula
    const area = this.calculatePolygonArea(vertices, outline, holes);

    // Determine convexity (simplified heuristic)
    const isConvex = this.isPolygonConvex(vertices, outline);

    // Create metadata
    const metadata = {
      primitiveType: '2d-polygon' as const,
      parameters: {
        pointCount: points.length,
        pathCount: paths ? paths.length : 1,
        hasHoles: holes.length > 0,
      },
      fragmentCount: vertices.length,
      generatedAt: Date.now(),
      isConvex,
      area,
    };

    return Object.freeze({
      vertices: Object.freeze(vertices),
      outline: Object.freeze(outline),
      holes: Object.freeze(holes.map((hole) => Object.freeze(hole))),
      metadata: Object.freeze(metadata),
    });
  }

  /**
   * Calculate polygon area using shoelace formula, accounting for holes
   */
  private calculatePolygonArea(
    vertices: readonly Vector2[],
    outline: readonly number[],
    holes: readonly (readonly number[])[]
  ): number {
    // Calculate outline area
    const outlineArea = this.calculatePathArea(vertices, outline);

    // Subtract hole areas
    let holeArea = 0;
    for (const hole of holes) {
      holeArea += this.calculatePathArea(vertices, hole);
    }

    return Math.abs(outlineArea) - Math.abs(holeArea);
  }

  /**
   * Calculate area of a single path using shoelace formula
   */
  private calculatePathArea(vertices: readonly Vector2[], path: readonly number[]): number {
    if (path.length < 3) return 0;

    let area = 0;
    for (let i = 0; i < path.length; i++) {
      const j = (i + 1) % path.length;

      // Safe array access with validation
      const pathI = path[i];
      const pathJ = path[j];

      if (pathI === undefined || pathJ === undefined) {
        console.warn(`[PolygonGenerator] Invalid path indices: i=${pathI}, j=${pathJ}`);
        continue;
      }

      const vi = vertices[pathI];
      const vj = vertices[pathJ];

      if (!vi || !vj) {
        console.warn(`[PolygonGenerator] Invalid vertices at indices: ${pathI}, ${pathJ}`);
        continue;
      }

      area += vi.x * vj.y - vj.x * vi.y;
    }
    return area / 2;
  }

  /**
   * Simple convexity check using cross product method
   */
  private isPolygonConvex(vertices: readonly Vector2[], outline: readonly number[]): boolean {
    if (outline.length < 3) return true;

    let sign = 0;
    for (let i = 0; i < outline.length; i++) {
      // Safe array access with validation
      const idx1 = outline[i];
      const idx2 = outline[(i + 1) % outline.length];
      const idx3 = outline[(i + 2) % outline.length];

      if (idx1 === undefined || idx2 === undefined || idx3 === undefined) {
        console.warn(`[PolygonGenerator] Invalid outline indices: ${idx1}, ${idx2}, ${idx3}`);
        continue;
      }

      const p1 = vertices[idx1];
      const p2 = vertices[idx2];
      const p3 = vertices[idx3];

      if (!p1 || !p2 || !p3) {
        console.warn(`[PolygonGenerator] Invalid vertices at indices: ${idx1}, ${idx2}, ${idx3}`);
        continue;
      }

      // Calculate cross product
      const cross = (p2.x - p1.x) * (p3.y - p2.y) - (p2.y - p1.y) * (p3.x - p2.x);

      if (cross !== 0) {
        const currentSign = cross > 0 ? 1 : -1;
        if (sign === 0) {
          sign = currentSign;
        } else if (sign !== currentSign) {
          return false; // Sign change indicates concave polygon
        }
      }
    }

    return true;
  }
}
