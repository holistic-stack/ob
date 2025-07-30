/**
 * @file polygon-validator.ts
 * @description Polygon Validator Service for advanced polygon validation and analysis.
 * Provides comprehensive polygon validation including self-intersection detection,
 * winding order validation, and complex polygon analysis.
 *
 * @example
 * ```typescript
 * const validator = new PolygonValidator();
 *
 * // Validate simple polygon
 * const result = validator.validatePolygon({
 *   vertices: [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 5, y: 10 }],
 *   outline: [0, 1, 2],
 *   holes: []
 * });
 *
 * if (result.success) {
 *   const validation = result.data;
 *   console.log(`Polygon valid: ${validation.isValid}`);
 *   console.log(`Self-intersection: ${validation.hasSelfIntersection}`);
 *   console.log(`Winding order: ${validation.windingOrder}`);
 * }
 * ```
 *
 * @author OpenSCAD Babylon Team
 * @version 1.0.0
 * @since 2025-07-29
 */

import type { Result } from '../../../../../shared/types/result.types';
import { isError } from '../../../../../shared/types/result.types';
import { error, success } from '../../../../../shared/utils/functional/result';
import type { Geometry2DGenerationError } from '../../../types/2d-geometry-data';
import type { Vector2 } from '../../../types/geometry-data';

/**
 * Polygon data structure for validation
 */
export interface PolygonData {
  readonly vertices: readonly Vector2[];
  readonly outline: readonly number[];
  readonly holes: readonly (readonly number[])[];
}

/**
 * Winding order enumeration
 */
export type WindingOrder = 'clockwise' | 'counter-clockwise' | 'degenerate';

/**
 * Hole validation result
 */
export interface HoleValidation {
  readonly holeIndex: number;
  readonly isInsideOutline: boolean;
  readonly hasValidWinding: boolean;
  readonly area: number;
}

/**
 * Polygon validation result
 */
export interface PolygonValidationResult {
  readonly isValid: boolean;
  readonly hasSelfIntersection: boolean;
  readonly windingOrder: WindingOrder;
  readonly area: number;
  readonly isDegenerate: boolean;
  readonly hasDuplicateVertices: boolean;
  readonly intersectionPoints: readonly Vector2[];
  readonly hasValidHoles: boolean;
  readonly holeValidation: readonly HoleValidation[];
  readonly hasOverlappingHoles: boolean;
}

/**
 * Polygon validation result type
 */
export type PolygonValidatorResult = Result<PolygonValidationResult, Geometry2DGenerationError>;

/**
 * Polygon Validator Service
 *
 * Provides comprehensive polygon validation including self-intersection detection,
 * winding order validation, and complex polygon analysis.
 */
export class PolygonValidator {
  /**
   * Validate polygon data with comprehensive analysis
   */
  validatePolygon(polygonData: PolygonData): PolygonValidatorResult {
    // Basic parameter validation (outside try-catch for proper error types)
    const paramValidation = this.validateParameters(polygonData);
    if (isError(paramValidation)) {
      return paramValidation;
    }

    try {
      // Perform comprehensive validation
      const validationResult = this.performValidation(polygonData);

      return success(validationResult);
    } catch (err) {
      return error({
        type: 'TESSELLATION_FAILED',
        message: `Polygon validation failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
        details: { polygonData },
      });
    }
  }

  /**
   * Validate basic parameters
   */
  private validateParameters(polygonData: PolygonData): Result<void, Geometry2DGenerationError> {
    const { vertices, outline, holes } = polygonData;

    // Check vertices array
    if (!vertices || vertices.length === 0) {
      return error({
        type: 'INVALID_PARAMETERS',
        message: 'Vertices array is required and cannot be empty',
        details: { polygonData },
      });
    }

    // Check outline indices
    for (let i = 0; i < outline.length; i++) {
      const index = outline[i];
      if (index < 0 || index >= vertices.length) {
        return error({
          type: 'INVALID_PARAMETERS',
          message: `Invalid outline index ${index} at position ${i}`,
          details: { polygonData, invalidIndex: index },
        });
      }
    }

    // Check hole indices
    for (let holeIndex = 0; holeIndex < holes.length; holeIndex++) {
      const hole = holes[holeIndex];
      for (let i = 0; i < hole.length; i++) {
        const index = hole[i];
        if (index < 0 || index >= vertices.length) {
          return error({
            type: 'INVALID_PARAMETERS',
            message: `Invalid hole index ${index} in hole ${holeIndex} at position ${i}`,
            details: { polygonData, holeIndex, invalidIndex: index },
          });
        }
      }
    }

    return success(undefined);
  }

  /**
   * Perform comprehensive polygon validation
   */
  private performValidation(polygonData: PolygonData): PolygonValidationResult {
    const { vertices, outline, holes } = polygonData;

    // Calculate area and winding order
    const area = this.calculatePolygonArea(vertices, outline);
    const windingOrder = this.determineWindingOrder(area);

    // Check for degenerate conditions
    const hasDuplicateVertices = this.checkDuplicateVertices(vertices, outline);
    const isDegenerate = Math.abs(area) < 1e-10 || hasDuplicateVertices;

    // Detect self-intersections
    const intersectionResult = this.detectSelfIntersections(vertices, outline);

    // Validate holes
    const holeValidation = this.validateHoles(vertices, outline, holes);
    const hasOverlappingHoles = this.checkOverlappingHoles(vertices, holes);
    const hasValidHoles =
      holeValidation.every((h) => h.isInsideOutline && h.hasValidWinding) && !hasOverlappingHoles;

    // Determine overall validity
    const isValid =
      !intersectionResult.hasSelfIntersection &&
      !isDegenerate &&
      !hasDuplicateVertices &&
      hasValidHoles &&
      !hasOverlappingHoles;

    return Object.freeze({
      isValid,
      hasSelfIntersection: intersectionResult.hasSelfIntersection,
      windingOrder,
      area: Math.abs(area),
      isDegenerate,
      hasDuplicateVertices,
      intersectionPoints: Object.freeze(intersectionResult.intersectionPoints),
      hasValidHoles,
      holeValidation: Object.freeze(holeValidation),
      hasOverlappingHoles,
    });
  }

  /**
   * Calculate polygon area using shoelace formula
   */
  private calculatePolygonArea(vertices: readonly Vector2[], outline: readonly number[]): number {
    if (outline.length < 3) return 0;

    let area = 0;
    for (let i = 0; i < outline.length; i++) {
      const j = (i + 1) % outline.length;
      const vi = vertices[outline[i]];
      const vj = vertices[outline[j]];
      area += vi.x * vj.y - vj.x * vi.y;
    }
    return area / 2;
  }

  /**
   * Determine winding order from area
   */
  private determineWindingOrder(area: number): WindingOrder {
    if (Math.abs(area) < 1e-10) return 'degenerate';
    return area > 0 ? 'counter-clockwise' : 'clockwise';
  }

  /**
   * Check for duplicate consecutive vertices
   */
  private checkDuplicateVertices(
    vertices: readonly Vector2[],
    outline: readonly number[]
  ): boolean {
    for (let i = 0; i < outline.length; i++) {
      const j = (i + 1) % outline.length;
      const vi = vertices[outline[i]];
      const vj = vertices[outline[j]];

      const dx = vi.x - vj.x;
      const dy = vi.y - vj.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < 1e-10) {
        return true;
      }
    }
    return false;
  }

  /**
   * Detect self-intersections using improved algorithm
   */
  private detectSelfIntersections(
    vertices: readonly Vector2[],
    outline: readonly number[]
  ): { hasSelfIntersection: boolean; intersectionPoints: Vector2[] } {
    const intersectionPoints: Vector2[] = [];

    // Check each edge against every other non-adjacent edge
    for (let i = 0; i < outline.length; i++) {
      const i1 = outline[i];
      const i2 = outline[(i + 1) % outline.length];
      const p1 = vertices[i1];
      const p2 = vertices[i2];

      for (let j = i + 2; j < outline.length; j++) {
        // Skip the last edge when i = 0 to avoid checking edge 0-1 against edge (n-1)-0
        if (i === 0 && j === outline.length - 1) continue;

        const j1 = outline[j];
        const j2 = outline[(j + 1) % outline.length];
        const p3 = vertices[j1];
        const p4 = vertices[j2];

        const intersection = this.lineSegmentIntersection(p1, p2, p3, p4);
        if (intersection) {
          intersectionPoints.push(intersection);
        }
      }
    }

    return {
      hasSelfIntersection: intersectionPoints.length > 0,
      intersectionPoints,
    };
  }

  /**
   * Calculate intersection point between two line segments
   */
  private lineSegmentIntersection(
    p1: Vector2,
    p2: Vector2,
    p3: Vector2,
    p4: Vector2
  ): Vector2 | null {
    const x1 = p1.x,
      y1 = p1.y;
    const x2 = p2.x,
      y2 = p2.y;
    const x3 = p3.x,
      y3 = p3.y;
    const x4 = p4.x,
      y4 = p4.y;

    const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
    if (Math.abs(denom) < 1e-10) {
      return null; // Parallel lines
    }

    const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
    const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;

    // Check if intersection is within both line segments
    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
      return {
        x: x1 + t * (x2 - x1),
        y: y1 + t * (y2 - y1),
      };
    }

    return null;
  }

  /**
   * Validate holes
   */
  private validateHoles(
    vertices: readonly Vector2[],
    outline: readonly number[],
    holes: readonly (readonly number[])[]
  ): HoleValidation[] {
    return holes.map((hole, holeIndex) => {
      const holeArea = this.calculatePolygonArea(vertices, hole);
      const isInsideOutline = this.isPolygonInsidePolygon(vertices, hole, outline);
      // For now, accept any winding order for holes (OpenSCAD is flexible about this)
      const hasValidWinding = true;

      return Object.freeze({
        holeIndex,
        isInsideOutline,
        hasValidWinding,
        area: Math.abs(holeArea),
      });
    });
  }

  /**
   * Check if one polygon is inside another (simplified point-in-polygon test)
   */
  private isPolygonInsidePolygon(
    vertices: readonly Vector2[],
    innerPath: readonly number[],
    outerPath: readonly number[]
  ): boolean {
    // Test if all vertices of inner polygon are inside outer polygon
    for (const vertexIndex of innerPath) {
      const point = vertices[vertexIndex];
      if (!this.isPointInPolygon(point, vertices, outerPath)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Point-in-polygon test using ray casting algorithm
   */
  private isPointInPolygon(
    point: Vector2,
    vertices: readonly Vector2[],
    path: readonly number[]
  ): boolean {
    let inside = false;

    for (let i = 0, j = path.length - 1; i < path.length; j = i++) {
      const vi = vertices[path[i]];
      const vj = vertices[path[j]];

      if (
        vi.y > point.y !== vj.y > point.y &&
        point.x < ((vj.x - vi.x) * (point.y - vi.y)) / (vj.y - vi.y) + vi.x
      ) {
        inside = !inside;
      }
    }

    return inside;
  }

  /**
   * Check for overlapping holes (simplified)
   */
  private checkOverlappingHoles(
    vertices: readonly Vector2[],
    holes: readonly (readonly number[])[]
  ): boolean {
    // For simplicity, check if any hole vertex is inside another hole
    for (let i = 0; i < holes.length; i++) {
      for (let j = i + 1; j < holes.length; j++) {
        const hole1 = holes[i];
        const hole2 = holes[j];

        // Check if any vertex of hole1 is inside hole2
        for (const vertexIndex of hole1) {
          const point = vertices[vertexIndex];
          if (this.isPointInPolygon(point, vertices, hole2)) {
            return true;
          }
        }
      }
    }
    return false;
  }
}
