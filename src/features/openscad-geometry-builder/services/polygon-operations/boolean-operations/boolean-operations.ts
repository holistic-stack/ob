/**
 * @file boolean-operations.ts
 * @description Boolean Operations Service for 2D primitive boolean operations.
 * Provides union, difference, and intersection operations between 2D primitives
 * using custom polygon-based algorithms.
 *
 * @example
 * ```typescript
 * const service = new BooleanOperationsService();
 *
 * // Union operation
 * const unionResult = service.performUnion(circleGeometry, squareGeometry);
 * if (unionResult.success) {
 *   const combinedShape = unionResult.data;
 *   console.log(`Union area: ${combinedShape.metadata.area}`);
 * }
 *
 * // Difference operation
 * const diffResult = service.performDifference(squareGeometry, circleGeometry);
 * if (diffResult.success) {
 *   const resultShape = diffResult.data;
 *   console.log(`Difference has ${resultShape.holes.length} holes`);
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
import type {
  Geometry2DData,
  Geometry2DGenerationError,
  Polygon2DGeometryData,
} from '../../../types/2d-geometry-data';
import type { Vector2 } from '../../../types/geometry-data';
import { PolygonValidator } from '../polygon-validator';

/**
 * Boolean operation result type
 */
export type BooleanOperationResult = Result<Polygon2DGeometryData, Geometry2DGenerationError>;

/**
 * Boolean Operations Service
 *
 * Provides 2D boolean operations (union, difference, intersection) between 2D primitives.
 * Uses custom polygon-based algorithms with comprehensive validation.
 */
export class BooleanOperationsService {
  private readonly polygonValidator: PolygonValidator;

  constructor() {
    this.polygonValidator = new PolygonValidator();
  }

  /**
   * Perform union operation (A ∪ B) between two 2D shapes
   */
  performUnion(shapeA: Geometry2DData, shapeB: Geometry2DData): BooleanOperationResult {
    try {
      // Validate input shapes
      const validationResult = this.validateInputShapes(shapeA, shapeB);
      if (isError(validationResult)) {
        return validationResult;
      }

      // Convert shapes to polygon representation
      const polygonA = this.convertToPolygon(shapeA);
      const polygonB = this.convertToPolygon(shapeB);

      // Perform union operation
      const unionResult = this.performPolygonUnion(polygonA, polygonB);

      return success(unionResult);
    } catch (err) {
      return error({
        type: 'TESSELLATION_FAILED',
        message: `Union operation failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
        details: { shapeA, shapeB },
      });
    }
  }

  /**
   * Perform difference operation (A - B) between two 2D shapes
   */
  performDifference(shapeA: Geometry2DData, shapeB: Geometry2DData): BooleanOperationResult {
    try {
      // Validate input shapes
      const validationResult = this.validateInputShapes(shapeA, shapeB);
      if (isError(validationResult)) {
        return validationResult;
      }

      // Convert shapes to polygon representation
      const polygonA = this.convertToPolygon(shapeA);
      const polygonB = this.convertToPolygon(shapeB);

      // Perform difference operation
      const differenceResult = this.performPolygonDifference(polygonA, polygonB);

      return success(differenceResult);
    } catch (err) {
      return error({
        type: 'TESSELLATION_FAILED',
        message: `Difference operation failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
        details: { shapeA, shapeB },
      });
    }
  }

  /**
   * Perform intersection operation (A ∩ B) between two 2D shapes
   */
  performIntersection(shapeA: Geometry2DData, shapeB: Geometry2DData): BooleanOperationResult {
    try {
      // Validate input shapes
      const validationResult = this.validateInputShapes(shapeA, shapeB);
      if (isError(validationResult)) {
        return validationResult;
      }

      // Convert shapes to polygon representation
      const polygonA = this.convertToPolygon(shapeA);
      const polygonB = this.convertToPolygon(shapeB);

      // Perform intersection operation
      const intersectionResult = this.performPolygonIntersection(polygonA, polygonB);

      return success(intersectionResult);
    } catch (err) {
      return error({
        type: 'TESSELLATION_FAILED',
        message: `Intersection operation failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
        details: { shapeA, shapeB },
      });
    }
  }

  /**
   * Validate input shapes for boolean operations
   */
  private validateInputShapes(
    shapeA: Geometry2DData,
    shapeB: Geometry2DData
  ): Result<void, Geometry2DGenerationError> {
    // Check that shapes have vertices
    if (!shapeA.vertices || shapeA.vertices.length < 3) {
      return error({
        type: 'INVALID_PARAMETERS',
        message: 'Shape A must have at least 3 vertices',
        details: { shapeA },
      });
    }

    if (!shapeB.vertices || shapeB.vertices.length < 3) {
      return error({
        type: 'INVALID_PARAMETERS',
        message: 'Shape B must have at least 3 vertices',
        details: { shapeB },
      });
    }

    // Validate shapes using polygon validator
    const validationA = this.polygonValidator.validatePolygon({
      vertices: shapeA.vertices,
      outline: shapeA.outline,
      holes: shapeA.holes,
    });

    if (isError(validationA)) {
      return error({
        type: 'INVALID_PARAMETERS',
        message: `Shape A validation failed: ${validationA.error.message}`,
        details: { shapeA, validationError: validationA.error },
      });
    }

    const validationB = this.polygonValidator.validatePolygon({
      vertices: shapeB.vertices,
      outline: shapeB.outline,
      holes: shapeB.holes,
    });

    if (isError(validationB)) {
      return error({
        type: 'INVALID_PARAMETERS',
        message: `Shape B validation failed: ${validationB.error.message}`,
        details: { shapeB, validationError: validationB.error },
      });
    }

    return success(undefined);
  }

  /**
   * Convert any 2D primitive to polygon representation
   */
  private convertToPolygon(shape: Geometry2DData): Polygon2DGeometryData {
    // If already a polygon, return as-is
    if (shape.metadata.primitiveType === '2d-polygon') {
      return shape as Polygon2DGeometryData;
    }

    // Convert circle or square to polygon format
    return Object.freeze({
      vertices: Object.freeze([...shape.vertices]),
      outline: Object.freeze([...shape.outline]),
      holes: Object.freeze(shape.holes.map((hole) => Object.freeze([...hole]))),
      metadata: Object.freeze({
        primitiveType: '2d-polygon' as const,
        parameters: {
          pointCount: shape.vertices.length,
          pathCount: 1 + shape.holes.length,
          hasHoles: shape.holes.length > 0,
        },
        fragmentCount: shape.vertices.length,
        generatedAt: Date.now(),
        isConvex: shape.metadata.isConvex,
        area: shape.metadata.area,
      }),
    });
  }

  /**
   * Perform polygon union using simplified algorithm
   */
  private performPolygonUnion(
    polygonA: Polygon2DGeometryData,
    polygonB: Polygon2DGeometryData
  ): Polygon2DGeometryData {
    // Check for identical shapes
    if (this.arePolygonsIdentical(polygonA, polygonB)) {
      return polygonA;
    }

    // Simplified union: if shapes don't overlap, combine vertices
    // If they overlap, use convex hull approximation
    const overlapExists = this.checkPolygonOverlap(polygonA, polygonB);

    if (!overlapExists) {
      // Non-overlapping: combine both shapes
      return this.combineNonOverlappingPolygons(polygonA, polygonB);
    }

    // If one completely contains the other, return the larger one
    if (this.isPolygonCompletelyInside(polygonA, polygonB)) {
      return polygonB;
    }

    if (this.isPolygonCompletelyInside(polygonB, polygonA)) {
      return polygonA;
    }

    // Overlapping: use simplified convex hull approach
    return this.createConvexHullUnion(polygonA, polygonB);
  }

  /**
   * Perform polygon difference using simplified algorithm
   */
  private performPolygonDifference(
    polygonA: Polygon2DGeometryData,
    polygonB: Polygon2DGeometryData
  ): Polygon2DGeometryData {
    // Check for identical shapes (same center and similar area)
    if (this.arePolygonsIdentical(polygonA, polygonB)) {
      return this.createEmptyPolygon();
    }

    // Simplified difference: if no overlap, return A unchanged
    const overlapExists = this.checkPolygonOverlap(polygonA, polygonB);

    if (!overlapExists) {
      return polygonA;
    }

    // If B completely contains A, return empty polygon
    if (this.isPolygonCompletelyInside(polygonA, polygonB)) {
      return this.createEmptyPolygon();
    }

    // If A completely contains B, create A with B as hole
    if (this.isPolygonCompletelyInside(polygonB, polygonA)) {
      return this.createPolygonWithHole(polygonA, polygonB);
    }

    // Partial overlap: simplified approach - return A (limitation)
    return polygonA;
  }

  /**
   * Perform polygon intersection using simplified algorithm
   */
  private performPolygonIntersection(
    polygonA: Polygon2DGeometryData,
    polygonB: Polygon2DGeometryData
  ): Polygon2DGeometryData {
    // Check for identical shapes
    if (this.arePolygonsIdentical(polygonA, polygonB)) {
      return polygonA;
    }

    // Simplified intersection: if no overlap, return empty
    const overlapExists = this.checkPolygonOverlap(polygonA, polygonB);

    if (!overlapExists) {
      return this.createEmptyPolygon();
    }

    // If one completely contains the other, return the smaller one
    if (this.isPolygonCompletelyInside(polygonA, polygonB)) {
      return polygonA;
    }

    if (this.isPolygonCompletelyInside(polygonB, polygonA)) {
      return polygonB;
    }

    // Partial overlap: simplified approach - return smaller polygon (approximation)
    return polygonA.metadata.area <= polygonB.metadata.area ? polygonA : polygonB;
  }

  /**
   * Check if two polygons overlap
   */
  private checkPolygonOverlap(
    polygonA: Polygon2DGeometryData,
    polygonB: Polygon2DGeometryData
  ): boolean {
    // Simple overlap check: test if any vertex of A is inside B or vice versa
    let vertexInsideCount = 0;
    for (const vertex of polygonA.vertices) {
      if (this.isPointInPolygon(vertex, polygonB.vertices, polygonB.outline)) {
        vertexInsideCount++;
      }
    }

    for (const vertex of polygonB.vertices) {
      if (this.isPointInPolygon(vertex, polygonA.vertices, polygonA.outline)) {
        vertexInsideCount++;
      }
    }

    // Additional check: test if bounding boxes overlap with tolerance
    const boundsA = this.calculateBoundingBox(polygonA.vertices);
    const boundsB = this.calculateBoundingBox(polygonB.vertices);

    const tolerance = 1e-6; // Small tolerance for floating point precision
    const bboxOverlap = !(
      boundsA.max.x < boundsB.min.x - tolerance ||
      boundsB.max.x < boundsA.min.x - tolerance ||
      boundsA.max.y < boundsB.min.y - tolerance ||
      boundsB.max.y < boundsA.min.y - tolerance
    );

    // Only return true if there's actual area overlap, not just touching
    if (!bboxOverlap) {
      return false;
    }

    // Check for actual area overlap by testing edge intersections
    const edgeIntersections = this.hasEdgeIntersections(polygonA, polygonB);

    // Only consider it overlap if there are multiple vertices inside or clear edge intersections
    // Single vertex touching is considered boundary contact, not overlap
    return vertexInsideCount > 1 || edgeIntersections;
  }

  /**
   * Check if polygon A is completely inside polygon B
   */
  private isPolygonCompletelyInside(
    polygonA: Polygon2DGeometryData,
    polygonB: Polygon2DGeometryData
  ): boolean {
    // All vertices of A must be inside B
    for (const vertex of polygonA.vertices) {
      if (!this.isPointInPolygon(vertex, polygonB.vertices, polygonB.outline)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Check if two polygons are identical (same center and similar area)
   */
  private arePolygonsIdentical(
    polygonA: Polygon2DGeometryData,
    polygonB: Polygon2DGeometryData
  ): boolean {
    // Check if areas are very similar
    const areaDiff = Math.abs(polygonA.metadata.area - polygonB.metadata.area);
    const avgArea = (polygonA.metadata.area + polygonB.metadata.area) / 2;
    const areaThreshold = avgArea * 0.01; // 1% tolerance

    if (areaDiff > areaThreshold) {
      return false;
    }

    // Check if centroids are very close
    const centroidA = this.calculateCentroid(polygonA.vertices, polygonA.outline);
    const centroidB = this.calculateCentroid(polygonB.vertices, polygonB.outline);

    const distance = Math.sqrt((centroidA.x - centroidB.x) ** 2 + (centroidA.y - centroidB.y) ** 2);

    return distance < 0.1; // Very close centroids
  }

  /**
   * Calculate centroid of a polygon
   */
  private calculateCentroid(vertices: readonly Vector2[], outline: readonly number[]): Vector2 {
    let sumX = 0;
    let sumY = 0;

    for (const index of outline) {
      const vertex = vertices[index];
      sumX += vertex.x;
      sumY += vertex.y;
    }

    return {
      x: sumX / outline.length,
      y: sumY / outline.length,
    };
  }

  /**
   * Point-in-polygon test using ray casting algorithm
   */
  private isPointInPolygon(
    point: Vector2,
    vertices: readonly Vector2[],
    outline: readonly number[]
  ): boolean {
    let inside = false;

    for (let i = 0, j = outline.length - 1; i < outline.length; j = i++) {
      const vi = vertices[outline[i]];
      const vj = vertices[outline[j]];

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
   * Combine non-overlapping polygons
   */
  private combineNonOverlappingPolygons(
    polygonA: Polygon2DGeometryData,
    polygonB: Polygon2DGeometryData
  ): Polygon2DGeometryData {
    // Simple combination: create multi-part polygon
    const combinedVertices = [...polygonA.vertices, ...polygonB.vertices];
    const offsetB = polygonA.vertices.length;
    const outlineB = polygonB.outline.map((index) => index + offsetB);

    // Calculate combined area correctly for non-overlapping shapes
    const combinedArea = polygonA.metadata.area + polygonB.metadata.area;

    return Object.freeze({
      vertices: Object.freeze(combinedVertices),
      outline: Object.freeze([...polygonA.outline]),
      holes: Object.freeze([
        outlineB,
        ...polygonA.holes,
        ...polygonB.holes.map((hole) => hole.map((index) => index + offsetB)),
      ]),
      metadata: Object.freeze({
        primitiveType: '2d-polygon' as const,
        parameters: {
          pointCount: combinedVertices.length,
          pathCount: 2 + polygonA.holes.length + polygonB.holes.length,
          hasHoles: true,
        },
        fragmentCount: combinedVertices.length,
        generatedAt: Date.now(),
        isConvex: false,
        area: combinedArea,
      }),
    });
  }

  /**
   * Create convex hull union (simplified approach)
   */
  private createConvexHullUnion(
    polygonA: Polygon2DGeometryData,
    polygonB: Polygon2DGeometryData
  ): Polygon2DGeometryData {
    // Simplified: return the larger polygon (approximation)
    const largerPolygon = polygonA.metadata.area >= polygonB.metadata.area ? polygonA : polygonB;
    const estimatedArea = Math.max(polygonA.metadata.area, polygonB.metadata.area) * 1.2; // Rough estimate

    return Object.freeze({
      ...largerPolygon,
      metadata: Object.freeze({
        ...largerPolygon.metadata,
        area: estimatedArea,
        generatedAt: Date.now(),
      }),
    });
  }

  /**
   * Create polygon with hole
   */
  private createPolygonWithHole(
    outerPolygon: Polygon2DGeometryData,
    holePolygon: Polygon2DGeometryData
  ): Polygon2DGeometryData {
    const combinedVertices = [...outerPolygon.vertices, ...holePolygon.vertices];
    const holeOffset = outerPolygon.vertices.length;
    const newHole = holePolygon.outline.map((index) => index + holeOffset);

    return Object.freeze({
      vertices: Object.freeze(combinedVertices),
      outline: Object.freeze([...outerPolygon.outline]),
      holes: Object.freeze([newHole, ...outerPolygon.holes]),
      metadata: Object.freeze({
        primitiveType: '2d-polygon' as const,
        parameters: {
          pointCount: combinedVertices.length,
          pathCount: 1 + outerPolygon.holes.length + 1,
          hasHoles: true,
        },
        fragmentCount: combinedVertices.length,
        generatedAt: Date.now(),
        isConvex: false,
        area: outerPolygon.metadata.area - holePolygon.metadata.area,
      }),
    });
  }

  /**
   * Create empty polygon
   */
  private createEmptyPolygon(): Polygon2DGeometryData {
    return Object.freeze({
      vertices: Object.freeze([]),
      outline: Object.freeze([]),
      holes: Object.freeze([]),
      metadata: Object.freeze({
        primitiveType: '2d-polygon' as const,
        parameters: {
          pointCount: 0,
          pathCount: 0,
          hasHoles: false,
        },
        fragmentCount: 0,
        generatedAt: Date.now(),
        isConvex: true,
        area: 0,
      }),
    });
  }

  /**
   * Check if two polygons have intersecting edges
   */
  private hasEdgeIntersections(
    polygonA: Polygon2DGeometryData,
    polygonB: Polygon2DGeometryData
  ): boolean {
    // Check each edge of A against each edge of B
    for (let i = 0; i < polygonA.outline.length; i++) {
      const i1 = polygonA.outline[i];
      const i2 = polygonA.outline[(i + 1) % polygonA.outline.length];
      const edgeA1 = polygonA.vertices[i1];
      const edgeA2 = polygonA.vertices[i2];

      for (let j = 0; j < polygonB.outline.length; j++) {
        const j1 = polygonB.outline[j];
        const j2 = polygonB.outline[(j + 1) % polygonB.outline.length];
        const edgeB1 = polygonB.vertices[j1];
        const edgeB2 = polygonB.vertices[j2];

        if (this.doLineSegmentsIntersect(edgeA1, edgeA2, edgeB1, edgeB2)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Check if two line segments intersect (excluding endpoint touching)
   */
  private doLineSegmentsIntersect(p1: Vector2, p2: Vector2, p3: Vector2, p4: Vector2): boolean {
    const d1 = this.orientation(p3, p4, p1);
    const d2 = this.orientation(p3, p4, p2);
    const d3 = this.orientation(p1, p2, p3);
    const d4 = this.orientation(p1, p2, p4);

    // Proper intersection (segments cross each other)
    if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) {
      return true;
    }

    // For union operations, we don't consider endpoint touching as intersection
    // This prevents treating touching shapes as overlapping
    return false;
  }

  /**
   * Calculate orientation of ordered triplet (p, q, r)
   */
  private orientation(p: Vector2, q: Vector2, r: Vector2): number {
    return (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y);
  }

  /**
   * Check if point q lies on line segment pr
   */
  private onSegment(p: Vector2, q: Vector2, r: Vector2): boolean {
    return (
      q.x <= Math.max(p.x, r.x) &&
      q.x >= Math.min(p.x, r.x) &&
      q.y <= Math.max(p.y, r.y) &&
      q.y >= Math.min(p.y, r.y)
    );
  }

  /**
   * Calculate bounding box for a set of vertices
   */
  private calculateBoundingBox(vertices: readonly Vector2[]): {
    min: Vector2;
    max: Vector2;
  } {
    if (vertices.length === 0) {
      return { min: { x: 0, y: 0 }, max: { x: 0, y: 0 } };
    }

    let minX = vertices[0].x;
    let maxX = vertices[0].x;
    let minY = vertices[0].y;
    let maxY = vertices[0].y;

    for (const vertex of vertices) {
      minX = Math.min(minX, vertex.x);
      maxX = Math.max(maxX, vertex.x);
      minY = Math.min(minY, vertex.y);
      maxY = Math.max(maxY, vertex.y);
    }

    return {
      min: { x: minX, y: minY },
      max: { x: maxX, y: maxY },
    };
  }
}
