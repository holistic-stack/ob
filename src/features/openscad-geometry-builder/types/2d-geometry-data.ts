/**
 * @file 2d-geometry-data.ts
 * @description Core geometry data types for 2D primitives following OpenSCAD specifications.
 * These types represent 2D shapes that can be extruded or used as-is for flat rendering.
 *
 * @example
 * ```typescript
 * // Circle geometry data for $fn=6 (hexagon)
 * const circleData: Circle2DGeometryData = {
 *   vertices: [
 *     { x: 5, y: 0 },           // 0°
 *     { x: 2.5, y: 4.33 },      // 60°
 *     { x: -2.5, y: 4.33 },     // 120°
 *     { x: -5, y: 0 },          // 180°
 *     { x: -2.5, y: -4.33 },    // 240°
 *     { x: 2.5, y: -4.33 }      // 300°
 *   ],
 *   outline: [0, 1, 2, 3, 4, 5], // Single outline
 *   holes: [],                   // No holes
 *   metadata: { primitiveType: '2d-circle', ... }
 * };
 * ```
 *
 * @author OpenSCAD Babylon Team
 * @version 1.0.0
 * @since 2025-07-29
 */

import type { Result } from '../../../shared/types/result.types';
import { error, success } from '../../../shared/utils/functional/result';
import type { Vector2 } from './geometry-data';

/**
 * Base geometry data interface for all 2D primitives
 */
export interface Base2DGeometryData {
  /** Array of vertex positions in 2D space */
  readonly vertices: readonly Vector2[];

  /** Main outline as array of vertex indices */
  readonly outline: readonly number[];

  /** Array of hole outlines (each as array of vertex indices) */
  readonly holes: readonly (readonly number[])[];

  /** Metadata about the geometry generation */
  readonly metadata: Geometry2DMetadata;
}

/**
 * Metadata about 2D geometry generation
 */
export interface Geometry2DMetadata {
  /** Type of primitive that generated this geometry */
  readonly primitiveType: '2d-circle' | '2d-square' | '2d-polygon';

  /** Parameters used to generate the geometry */
  readonly parameters: Record<string, unknown>;

  /** Fragment count used for tessellation */
  readonly fragmentCount?: number;

  /** Generation timestamp for caching */
  readonly generatedAt: number;

  /** Whether the shape is convex (optimization hint) */
  readonly isConvex: boolean;

  /** Area of the shape (excluding holes) */
  readonly area: number;
}

/**
 * Circle geometry data with fragment-based tessellation
 */
export interface Circle2DGeometryData extends Base2DGeometryData {
  readonly metadata: Geometry2DMetadata & {
    readonly primitiveType: '2d-circle';
    readonly parameters: {
      readonly radius: number;
      readonly fragments: number;
    };
  };
}

/**
 * Square/Rectangle geometry data
 */
export interface Square2DGeometryData extends Base2DGeometryData {
  readonly metadata: Geometry2DMetadata & {
    readonly primitiveType: '2d-square';
    readonly parameters: {
      readonly size: Vector2;
      readonly center: boolean;
    };
  };
}

/**
 * Polygon geometry data with optional holes
 */
export interface Polygon2DGeometryData extends Base2DGeometryData {
  readonly metadata: Geometry2DMetadata & {
    readonly primitiveType: '2d-polygon';
    readonly parameters: {
      readonly pointCount: number;
      readonly pathCount: number;
      readonly hasHoles: boolean;
    };
  };
}

/**
 * Union type for all 2D geometry data
 */
export type Geometry2DData = Circle2DGeometryData | Square2DGeometryData | Polygon2DGeometryData;

/**
 * Bounding box for 2D geometry optimization
 */
export interface BoundingBox2D {
  readonly min: Vector2;
  readonly max: Vector2;
  readonly center: Vector2;
  readonly size: Vector2;
}

/**
 * Error types for 2D geometry generation
 */
export interface Geometry2DGenerationError {
  readonly type:
    | 'INVALID_PARAMETERS'
    | 'TESSELLATION_FAILED'
    | 'SELF_INTERSECTION'
    | 'INVALID_POLYGON';
  readonly message: string;
  readonly details?: Record<string, unknown>;
}

/**
 * Result type for 2D geometry generation operations
 */
export type Geometry2DResult<T extends Base2DGeometryData> = Result<T, Geometry2DGenerationError>;

/**
 * Utility functions for 2D geometry data manipulation
 */
export namespace Geometry2DUtils {
  /**
   * Calculate bounding box for 2D geometry data
   */
  export function calculateBoundingBox(geometry: Base2DGeometryData): BoundingBox2D {
    if (geometry.vertices.length === 0) {
      const zero = { x: 0, y: 0 };
      return { min: zero, max: zero, center: zero, size: zero };
    }

    let minX = Number.POSITIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;

    for (const vertex of geometry.vertices) {
      minX = Math.min(minX, vertex.x);
      minY = Math.min(minY, vertex.y);
      maxX = Math.max(maxX, vertex.x);
      maxY = Math.max(maxY, vertex.y);
    }

    const min = { x: minX, y: minY };
    const max = { x: maxX, y: maxY };
    const center = {
      x: (minX + maxX) / 2,
      y: (minY + maxY) / 2,
    };
    const size = {
      x: maxX - minX,
      y: maxY - minY,
    };

    return { min, max, center, size };
  }

  /**
   * Calculate area of a 2D polygon using shoelace formula
   */
  export function calculateArea(vertices: readonly Vector2[], outline: readonly number[]): number {
    if (outline.length < 3) return 0;

    let area = 0;
    for (let i = 0; i < outline.length; i++) {
      const j = (i + 1) % outline.length;
      const vi = vertices[outline[i]];
      const vj = vertices[outline[j]];
      area += vi.x * vj.y - vj.x * vi.y;
    }
    return Math.abs(area) / 2;
  }

  /**
   * Check if a polygon is convex
   */
  export function isConvex(vertices: readonly Vector2[], outline: readonly number[]): boolean {
    if (outline.length < 3) return false;

    let sign = 0;
    for (let i = 0; i < outline.length; i++) {
      const p1 = vertices[outline[i]];
      const p2 = vertices[outline[(i + 1) % outline.length]];
      const p3 = vertices[outline[(i + 2) % outline.length]];

      const cross = (p2.x - p1.x) * (p3.y - p2.y) - (p2.y - p1.y) * (p3.x - p2.x);

      if (cross !== 0) {
        if (sign === 0) {
          sign = cross > 0 ? 1 : -1;
        } else if ((cross > 0 ? 1 : -1) !== sign) {
          return false;
        }
      }
    }
    return true;
  }

  /**
   * Validate 2D geometry data integrity
   */
  export function validateGeometry(
    geometry: Base2DGeometryData
  ): Result<void, Geometry2DGenerationError> {
    // Check for empty vertices
    if (geometry.vertices.length === 0) {
      return error({
        type: 'INVALID_PARAMETERS',
        message: 'Geometry must have at least one vertex',
      });
    }

    // Check outline indices validity
    for (const index of geometry.outline) {
      if (index < 0 || index >= geometry.vertices.length) {
        return error({
          type: 'INVALID_PARAMETERS',
          message: `Outline index ${index} is out of bounds for ${geometry.vertices.length} vertices`,
        });
      }
    }

    // Check hole indices validity
    for (const hole of geometry.holes) {
      for (const index of hole) {
        if (index < 0 || index >= geometry.vertices.length) {
          return error({
            type: 'INVALID_PARAMETERS',
            message: `Hole index ${index} is out of bounds for ${geometry.vertices.length} vertices`,
          });
        }
      }
    }

    // Check minimum outline size
    if (geometry.outline.length < 3) {
      return error({
        type: 'INVALID_POLYGON',
        message: 'Outline must have at least 3 vertices',
      });
    }

    return success(undefined);
  }

  /**
   * Convert 2D geometry to 3D at specified Z level
   */
  export function to3D(
    geometry: Base2DGeometryData,
    z: number = 0
  ): {
    vertices: readonly { x: number; y: number; z: number }[];
    faces: readonly (readonly number[])[];
  } {
    const vertices3D = geometry.vertices.map((v) => ({ x: v.x, y: v.y, z }));

    // Create a single face from the outline (assuming it's a simple polygon)
    const faces = [geometry.outline];

    return { vertices: vertices3D, faces };
  }
}
