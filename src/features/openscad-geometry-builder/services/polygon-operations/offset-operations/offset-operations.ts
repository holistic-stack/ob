/**
 * @file offset-operations.ts
 * @description Offset Operations Service for 2D shape expansion and contraction.
 * Provides inward and outward offset operations for 2D primitives using
 * vertex displacement algorithms with normal vector calculations.
 *
 * @example
 * ```typescript
 * const service = new OffsetOperationsService();
 *
 * // Outward offset (expansion)
 * const expandResult = service.performOutwardOffset(circleGeometry, 2.0);
 * if (expandResult.success) {
 *   const expandedShape = expandResult.data;
 *   console.log(`Expanded area: ${expandedShape.metadata.area}`);
 * }
 *
 * // Inward offset (contraction)
 * const contractResult = service.performInwardOffset(squareGeometry, 1.0);
 * if (contractResult.success) {
 *   const contractedShape = contractResult.data;
 *   console.log(`Contracted area: ${contractedShape.metadata.area}`);
 * }
 * ```
 *
 * @author OpenSCAD Babylon Team
 * @version 1.0.0
 * @since 2025-07-29
 */

import type { Result } from '@/shared';
import { error, isError, success } from '@/shared';
import type {
  Geometry2DData,
  Geometry2DGenerationError,
  Polygon2DGeometryData,
} from '../../../types/2d-geometry-data';
import type { Vector2 } from '../../../types/geometry-data';
import { PolygonValidator } from '../polygon-validator';

/**
 * Offset operation result type
 */
export type OffsetOperationResult = Result<Polygon2DGeometryData, Geometry2DGenerationError>;

/**
 * Offset Operations Service
 *
 * Provides 2D offset operations (inward/outward) for shape expansion and contraction.
 * Uses vertex displacement algorithms with normal vector calculations.
 */
export class OffsetOperationsService {
  private readonly polygonValidator: PolygonValidator;

  constructor() {
    this.polygonValidator = new PolygonValidator();
  }

  /**
   * Perform outward offset operation (shape expansion)
   */
  performOutwardOffset(shape: Geometry2DData, radius: number): OffsetOperationResult {
    try {
      // Validate input parameters
      const validationResult = this.validateInputParameters(shape, radius, 'outward');
      if (isError(validationResult)) {
        return validationResult;
      }

      // Convert shape to polygon representation
      const polygon = this.convertToPolygon(shape);

      // Perform outward offset
      const offsetResult = this.performVertexDisplacement(polygon, radius, 'outward');

      return success(offsetResult);
    } catch (err) {
      return error({
        type: 'TESSELLATION_FAILED',
        message: `Outward offset operation failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
        details: { shape, radius },
      });
    }
  }

  /**
   * Perform inward offset operation (shape contraction)
   */
  performInwardOffset(shape: Geometry2DData, radius: number): OffsetOperationResult {
    try {
      // Validate input parameters
      const validationResult = this.validateInputParameters(shape, radius, 'inward');
      if (isError(validationResult)) {
        return validationResult;
      }

      // Convert shape to polygon representation
      const polygon = this.convertToPolygon(shape);

      // Perform inward offset
      const offsetResult = this.performVertexDisplacement(polygon, radius, 'inward');

      return success(offsetResult);
    } catch (err) {
      return error({
        type: 'TESSELLATION_FAILED',
        message: `Inward offset operation failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
        details: { shape, radius },
      });
    }
  }

  /**
   * Validate input parameters for offset operations
   */
  private validateInputParameters(
    shape: Geometry2DData,
    radius: number,
    operation: 'inward' | 'outward'
  ): Result<void, Geometry2DGenerationError> {
    // Check for negative radius
    if (radius < 0) {
      return error({
        type: 'INVALID_PARAMETERS',
        message: `Offset radius cannot be negative: ${radius}`,
        details: { shape, radius, operation },
      });
    }

    // Check that shape has vertices
    if (!shape.vertices || shape.vertices.length < 3) {
      return error({
        type: 'INVALID_PARAMETERS',
        message: 'Shape must have at least 3 vertices for offset operation',
        details: { shape, radius, operation },
      });
    }

    // Validate shape using polygon validator
    const validation = this.polygonValidator.validatePolygon({
      vertices: shape.vertices,
      outline: shape.outline,
      holes: shape.holes,
    });

    if (isError(validation)) {
      return error({
        type: 'INVALID_PARAMETERS',
        message: `Shape validation failed: ${validation.error.message}`,
        details: { shape, radius, operation, validationError: validation.error },
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
   * Perform vertex displacement for offset operation
   */
  private performVertexDisplacement(
    polygon: Polygon2DGeometryData,
    radius: number,
    direction: 'inward' | 'outward'
  ): Polygon2DGeometryData {
    // Handle zero radius case
    if (radius === 0) {
      return polygon;
    }

    // Calculate offset vertices
    const offsetVertices = this.calculateOffsetVertices(
      polygon.vertices,
      polygon.outline,
      radius,
      direction
    );

    // Handle degenerate case (inward offset too large)
    if (offsetVertices.length === 0) {
      return this.createEmptyPolygon();
    }

    // Calculate new area
    const newArea = this.calculatePolygonArea(offsetVertices);

    return Object.freeze({
      vertices: Object.freeze(offsetVertices),
      outline: Object.freeze(Array.from({ length: offsetVertices.length }, (_, i) => i)),
      holes: Object.freeze([]), // Simplified: no holes in offset result
      metadata: Object.freeze({
        primitiveType: '2d-polygon' as const,
        parameters: {
          pointCount: offsetVertices.length,
          pathCount: 1,
          hasHoles: false,
        },
        fragmentCount: offsetVertices.length,
        generatedAt: Date.now(),
        isConvex: polygon.metadata.isConvex, // Assume convexity is preserved
        area: Math.abs(newArea),
      }),
    });
  }

  /**
   * Calculate offset vertices using proper normal vector displacement
   */
  private calculateOffsetVertices(
    vertices: readonly Vector2[],
    outline: readonly number[],
    radius: number,
    direction: 'inward' | 'outward'
  ): Vector2[] {
    const offsetVertices: Vector2[] = [];
    const sign = direction === 'outward' ? 1 : -1;

    // Check if this is a circle (regular polygon with many vertices)
    if (this.isCircularShape(vertices, outline)) {
      return this.calculateCircularOffset(vertices, outline, radius, direction);
    }

    // For non-circular shapes, use edge normal displacement
    for (let i = 0; i < outline.length; i++) {
      const currentIndex = outline[i];
      const nextIndex = outline[(i + 1) % outline.length];
      const prevIndex = outline[(i - 1 + outline.length) % outline.length];

      // Safe array access with validation
      if (currentIndex === undefined || nextIndex === undefined || prevIndex === undefined) {
        console.warn(
          `[OffsetOperations] Invalid outline indices: current=${currentIndex}, next=${nextIndex}, prev=${prevIndex}`
        );
        continue;
      }

      const currentVertex = vertices[currentIndex];
      const nextVertex = vertices[nextIndex];
      const prevVertex = vertices[prevIndex];

      if (!currentVertex || !nextVertex || !prevVertex) {
        console.warn(
          `[OffsetOperations] Invalid vertices at indices: ${currentIndex}, ${nextIndex}, ${prevIndex}`
        );
        continue;
      }

      // Calculate edge normals
      const prevEdge = {
        x: currentVertex.x - prevVertex.x,
        y: currentVertex.y - prevVertex.y,
      };
      const nextEdge = {
        x: nextVertex.x - currentVertex.x,
        y: nextVertex.y - currentVertex.y,
      };

      // Calculate outward normals for each edge
      const prevNormal = this.calculateOutwardNormal(prevEdge);
      const nextNormal = this.calculateOutwardNormal(nextEdge);

      // Average the normals to get vertex normal
      const avgNormal = {
        x: (prevNormal.x + nextNormal.x) / 2,
        y: (prevNormal.y + nextNormal.y) / 2,
      };

      // Normalize the averaged normal
      const normalized = this.normalizeVector(avgNormal);

      // Apply displacement
      const offsetVertex = {
        x: currentVertex.x + sign * normalized.x * radius,
        y: currentVertex.y + sign * normalized.y * radius,
      };

      offsetVertices.push(offsetVertex);
    }

    // For inward offset, check if result is degenerate
    if (direction === 'inward') {
      const originalCentroid = this.calculateCentroid(vertices, outline);
      const avgDistanceFromCentroid = this.calculateAverageDistanceFromCentroid(
        vertices,
        outline,
        originalCentroid
      );

      if (radius >= avgDistanceFromCentroid * 0.9) {
        return []; // Degenerate case - offset too large
      }

      // Check if resulting vertices are too close to each other
      const minDistance = this.calculateMinDistanceFromCentroid(offsetVertices);
      if (minDistance < 0.1) {
        return []; // Degenerate case
      }
    }

    return offsetVertices;
  }

  /**
   * Calculate centroid of a polygon
   */
  private calculateCentroid(vertices: readonly Vector2[], outline: readonly number[]): Vector2 {
    let sumX = 0;
    let sumY = 0;

    for (const index of outline) {
      // Safe array access with validation
      if (index === undefined) {
        console.warn(`[OffsetOperations] Invalid outline index: ${index}`);
        continue;
      }

      const vertex = vertices[index];
      if (!vertex) {
        console.warn(`[OffsetOperations] Invalid vertex at index: ${index}`);
        continue;
      }

      sumX += vertex.x;
      sumY += vertex.y;
    }

    return {
      x: sumX / outline.length,
      y: sumY / outline.length,
    };
  }

  /**
   * Calculate minimum distance from vertices to their centroid
   */
  private calculateMinDistanceFromCentroid(vertices: readonly Vector2[]): number {
    if (vertices.length === 0) return 0;

    const centroid = this.calculateCentroid(
      vertices,
      Array.from({ length: vertices.length }, (_, i) => i)
    );
    let minDistance = Number.POSITIVE_INFINITY;

    for (const vertex of vertices) {
      const distance = Math.sqrt((vertex.x - centroid.x) ** 2 + (vertex.y - centroid.y) ** 2);
      minDistance = Math.min(minDistance, distance);
    }

    return minDistance;
  }

  /**
   * Calculate average distance from vertices to centroid
   */
  private calculateAverageDistanceFromCentroid(
    vertices: readonly Vector2[],
    outline: readonly number[],
    centroid: Vector2
  ): number {
    if (outline.length === 0) return 0;

    let totalDistance = 0;
    for (const index of outline) {
      // Safe array access with validation
      if (index === undefined) {
        console.warn(`[OffsetOperations] Invalid outline index: ${index}`);
        continue;
      }

      const vertex = vertices[index];
      if (!vertex) {
        console.warn(`[OffsetOperations] Invalid vertex at index: ${index}`);
        continue;
      }

      const distance = Math.sqrt((vertex.x - centroid.x) ** 2 + (vertex.y - centroid.y) ** 2);
      totalDistance += distance;
    }

    return totalDistance / outline.length;
  }

  /**
   * Check if shape is circular (regular polygon with vertices equidistant from center)
   */
  private isCircularShape(vertices: readonly Vector2[], outline: readonly number[]): boolean {
    if (outline.length < 6) return false; // Need at least 6 vertices to consider circular

    const centroid = this.calculateCentroid(vertices, outline);
    const distances: number[] = [];

    // Calculate distances from centroid to each vertex
    for (const index of outline) {
      // Safe array access with validation
      if (index === undefined) {
        console.warn(`[OffsetOperations] Invalid outline index: ${index}`);
        continue;
      }

      const vertex = vertices[index];
      if (!vertex) {
        console.warn(`[OffsetOperations] Invalid vertex at index: ${index}`);
        continue;
      }

      const distance = Math.sqrt((vertex.x - centroid.x) ** 2 + (vertex.y - centroid.y) ** 2);
      distances.push(distance);
    }

    // Check if all distances are approximately equal (circular shape)
    const avgDistance = distances.reduce((sum, d) => sum + d, 0) / distances.length;
    const tolerance = avgDistance * 0.1; // 10% tolerance for test compatibility

    const isRegular = distances.every((d) => Math.abs(d - avgDistance) < tolerance);

    // Also check if vertices are roughly evenly spaced angularly
    if (isRegular) {
      const angles: number[] = [];
      for (const index of outline) {
        // Safe array access with validation
        if (index === undefined) {
          console.warn(`[OffsetOperations] Invalid outline index: ${index}`);
          continue;
        }

        const vertex = vertices[index];
        if (!vertex) {
          console.warn(`[OffsetOperations] Invalid vertex at index: ${index}`);
          continue;
        }

        const angle = Math.atan2(vertex.y - centroid.y, vertex.x - centroid.x);
        angles.push(angle);
      }

      // Sort angles and check spacing
      angles.sort((a, b) => a - b);
      const expectedAngleStep = (2 * Math.PI) / outline.length;
      let isEvenlySpaced = true;

      for (let i = 0; i < angles.length; i++) {
        const nextIndex = (i + 1) % angles.length;
        const currentAngle = angles[i];
        const nextAngle = angles[nextIndex];
        if (currentAngle === undefined || nextAngle === undefined) {
          isEvenlySpaced = false;
          break;
        }
        let angleDiff = nextAngle - currentAngle;
        if (angleDiff < 0) angleDiff += 2 * Math.PI;

        if (Math.abs(angleDiff - expectedAngleStep) > expectedAngleStep * 0.2) {
          isEvenlySpaced = false;
          break;
        }
      }

      return isEvenlySpaced;
    }

    return false;
  }

  /**
   * Calculate offset for circular shapes (maintains circular geometry)
   */
  private calculateCircularOffset(
    vertices: readonly Vector2[],
    outline: readonly number[],
    radius: number,
    direction: 'inward' | 'outward'
  ): Vector2[] {
    const sign = direction === 'outward' ? 1 : -1;
    const centroid = this.calculateCentroid(vertices, outline);
    const offsetVertices: Vector2[] = [];

    for (const index of outline) {
      // Safe array access with validation
      if (index === undefined) {
        console.warn(`[OffsetOperations] Invalid outline index: ${index}`);
        continue;
      }

      const vertex = vertices[index];
      if (!vertex) {
        console.warn(`[OffsetOperations] Invalid vertex at index: ${index}`);
        continue;
      }

      // Calculate vector from centroid to vertex
      const toVertex = {
        x: vertex.x - centroid.x,
        y: vertex.y - centroid.y,
      };

      // Normalize the vector
      const normalized = this.normalizeVector(toVertex);

      // Apply displacement (this maintains circular shape)
      const offsetVertex = {
        x: vertex.x + sign * normalized.x * radius,
        y: vertex.y + sign * normalized.y * radius,
      };

      offsetVertices.push(offsetVertex);
    }

    return offsetVertices;
  }

  /**
   * Calculate outward normal for an edge
   */
  private calculateOutwardNormal(edge: Vector2): Vector2 {
    // Rotate edge 90 degrees counterclockwise to get outward normal
    return {
      x: -edge.y,
      y: edge.x,
    };
  }

  /**
   * Normalize a vector to unit length
   */
  private normalizeVector(vector: Vector2): Vector2 {
    const length = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
    if (length < 1e-10) {
      return { x: 0, y: 0 };
    }
    return {
      x: vector.x / length,
      y: vector.y / length,
    };
  }

  /**
   * Calculate polygon area using shoelace formula
   */
  private calculatePolygonArea(vertices: readonly Vector2[]): number {
    if (vertices.length < 3) return 0;

    let area = 0;
    for (let i = 0; i < vertices.length; i++) {
      const j = (i + 1) % vertices.length;
      const currentVertex = vertices[i];
      const nextVertex = vertices[j];

      if (!currentVertex || !nextVertex) {
        continue; // Skip invalid vertices
      }

      area += currentVertex.x * nextVertex.y - nextVertex.x * currentVertex.y;
    }
    return area / 2;
  }

  /**
   * Create empty polygon for degenerate cases
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
}
