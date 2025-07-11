/**
 * Geometry Utilities
 *
 * Pure functions for geometric operations extracted from utility classes
 * following functional programming patterns and bulletproof-react organization.
 *
 * This module contains pure mathematical functions for:
 * - Vertex operations (creation, cloning, interpolation)
 * - Plane operations (creation, validation, transformation)
 * - Polygon operations (creation, validation, splitting)
 * - Spatial operations and geometric calculations
 * - Geometric validation utilities
 *
 * All functions are pure (no side effects) and follow functional programming principles.
 * They integrate with the service layer through dependency injection patterns.
 *
 * @module GeometryUtils
 * @version 1.0.0
 * @since Phase 0 - Architectural Reorganization
 */

import { GEOMETRY_CONFIG } from '../config/geometry-config';
import type { PlaneData, PolygonData, SharedData, VertexData } from '../types/geometry.types';
import { Vector } from './Vector';

// ============================================================================
// VERTEX OPERATIONS
// ============================================================================

/**
 * Vertex utility functions
 *
 * Pure functions for creating, manipulating, and validating vertex data.
 * All functions follow immutable patterns and return new instances.
 */
export const createVertex = (
  pos: Vector,
  normal: Vector,
  uv: Vector,
  color?: Vector
): VertexData => {
  const uvCopy = new Vector().copy(uv);
  uvCopy.z = 0;

  const vertexData: VertexData = {
    pos: new Vector().copy(pos),
    normal: new Vector().copy(normal),
    uv: uvCopy,
  };

  if (color) {
    (vertexData as VertexData & { color: Vector }).color = new Vector().copy(color);
  }

  return vertexData;
};

export const cloneVertex = (vertex: VertexData): VertexData => {
  const result: VertexData = {
    pos: vertex.pos.clone(),
    normal: vertex.normal.clone(),
    uv: vertex.uv.clone(),
  };

  if (vertex.color) {
    (result as VertexData & { color: Vector }).color = vertex.color.clone();
  }

  return result;
};

export const flipVertex = (vertex: VertexData): VertexData => ({
  ...vertex,
  normal: vertex.normal.clone().negate(),
});

export const interpolateVertex = (
  vertex1: VertexData,
  vertex2: VertexData,
  t: number
): VertexData => {
  const result: VertexData = {
    pos: vertex1.pos.clone().lerp(vertex2.pos, t),
    normal: vertex1.normal.clone().lerp(vertex2.normal, t),
    uv: vertex1.uv.clone().lerp(vertex2.uv, t),
  };

  if (vertex1.color && vertex2.color) {
    (result as VertexData & { color: Vector }).color = vertex1.color.clone().lerp(vertex2.color, t);
  }

  return result;
};

// ============================================================================
// PLANE OPERATIONS
// ============================================================================

/**
 * Plane utility functions
 *
 * Pure functions for creating, manipulating, and validating plane data.
 * Planes are used for spatial partitioning and geometric calculations.
 */
export const createPlane = (normal: Vector, w: number): PlaneData => ({
  normal: normal.clone(),
  w,
});

export const createPlaneFromPoints = (a: Vector, b: Vector, c: Vector): PlaneData => {
  const n = new Vector().copy(b).sub(a).cross(new Vector().copy(c).sub(a)).normalize();
  return createPlane(n.clone(), n.dot(a));
};

export const clonePlane = (plane: PlaneData): PlaneData => ({
  normal: plane.normal.clone(),
  w: plane.w,
});

export const flipPlane = (plane: PlaneData): PlaneData => ({
  normal: plane.normal.clone().negate(),
  w: -plane.w,
});

// ============================================================================
// POLYGON OPERATIONS
// ============================================================================

/**
 * Polygon utility functions
 *
 * Pure functions for creating, manipulating, and validating polygon data.
 * Polygons are the fundamental building blocks for CSG operations.
 */
export const createPolygon = (vertices: VertexData[], shared: SharedData): PolygonData => {
  if (vertices.length < 3) {
    throw new Error('Polygon must have at least 3 vertices');
  }

  if (!vertices[0] || !vertices[1] || !vertices[2]) {
    throw new Error('Polygon requires at least 3 vertices');
  }

  const plane = createPlaneFromPoints(vertices[0].pos, vertices[1].pos, vertices[2].pos);

  return {
    vertices: vertices.map(cloneVertex),
    shared,
    plane,
  };
};

export const clonePolygon = (polygon: PolygonData): PolygonData => ({
  vertices: polygon.vertices.map(cloneVertex),
  shared: polygon.shared,
  plane: clonePlane(polygon.plane),
});

export const flipPolygon = (polygon: PolygonData): PolygonData => ({
  vertices: polygon.vertices.slice().reverse().map(flipVertex),
  shared: polygon.shared,
  plane: flipPlane(polygon.plane),
});

// ============================================================================
// GEOMETRIC VALIDATION OPERATIONS
// ============================================================================

/**
 * Geometric validation utility functions
 *
 * Pure functions for validating geometric data and ensuring numerical stability.
 */

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

/**
 * Validation utility functions
 *
 * Pure functions for validating geometric data integrity and consistency.
 * Used throughout the system to ensure data quality and prevent errors.
 */
export const isValidVertex = (vertex: VertexData): boolean => {
  return (
    vertex.pos &&
    vertex.normal &&
    vertex.uv &&
    Number.isFinite(vertex.pos.x) &&
    Number.isFinite(vertex.pos.y) &&
    Number.isFinite(vertex.pos.z) &&
    Number.isFinite(vertex.normal.x) &&
    Number.isFinite(vertex.normal.y) &&
    Number.isFinite(vertex.normal.z)
  );
};

export const isValidPlane = (plane: PlaneData): boolean => {
  return (
    plane.normal &&
    Number.isFinite(plane.w) &&
    Number.isFinite(plane.normal.x) &&
    Number.isFinite(plane.normal.y) &&
    Number.isFinite(plane.normal.z)
  );
};

export const isValidPolygon = (polygon: PolygonData): boolean => {
  return (
    polygon.vertices.length >= 3 &&
    polygon.vertices.every(isValidVertex) &&
    isValidPlane(polygon.plane)
  );
};
