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
 * - BSP classification and spatial operations
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
import type {
  BSPClassification,
  PlaneData,
  PolygonData,
  SharedData,
  VertexData,
} from '../types/geometry.types';
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
 * Planes are used for BSP tree operations and spatial partitioning.
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
// BSP CLASSIFICATION OPERATIONS
// ============================================================================

/**
 * BSP classification utility functions
 *
 * Pure functions for Binary Space Partitioning operations including
 * point-to-plane classification and polygon splitting algorithms.
 */
export const classifyPointToPlane = (point: Vector, plane: PlaneData): BSPClassification => {
  const { epsilon } = GEOMETRY_CONFIG.precision;
  const { coplanar: _coplanar, front: _front, back: _back } = GEOMETRY_CONFIG.bsp;

  const t = plane.normal.dot(point) - plane.w;

  if (t < -epsilon) return 'back';
  if (t > epsilon) return 'front';
  return 'coplanar';
};

export const classifyPolygonToPlane = (
  polygon: PolygonData,
  plane: PlaneData
): BSPClassification => {
  const { coplanar, front, back, spanning: _spanning } = GEOMETRY_CONFIG.bsp;

  let polygonType = 0;
  const types: number[] = [];

  for (const vertex of polygon.vertices) {
    const classification = classifyPointToPlane(vertex.pos, plane);
    let type: number;

    switch (classification) {
      case 'back':
        type = back;
        break;
      case 'front':
        type = front;
        break;
      case 'coplanar':
        type = coplanar;
        break;
      default:
        type = coplanar;
    }

    polygonType |= type;
    types.push(type);
  }

  if (polygonType === coplanar) return 'coplanar';
  if (polygonType === front) return 'front';
  if (polygonType === back) return 'back';
  return 'spanning';
};

/**
 * Polygon splitting utility function
 */
export const splitPolygonByPlane = (
  polygon: PolygonData,
  plane: PlaneData
): {
  coplanarFront: PolygonData[];
  coplanarBack: PolygonData[];
  front: PolygonData[];
  back: PolygonData[];
} => {
  const { coplanar, front, back, spanning } = GEOMETRY_CONFIG.bsp;
  const { epsilon } = GEOMETRY_CONFIG.precision;

  const coplanarFront: PolygonData[] = [];
  const coplanarBack: PolygonData[] = [];
  const frontPolygons: PolygonData[] = [];
  const backPolygons: PolygonData[] = [];

  // Classify each point
  let polygonType = 0;
  const types: number[] = [];

  for (const vertex of polygon.vertices) {
    const t = plane.normal.dot(vertex.pos) - plane.w;
    const type = t < -epsilon ? back : t > epsilon ? front : coplanar;
    polygonType |= type;
    types.push(type);
  }

  // Handle different cases
  switch (polygonType) {
    case coplanar: {
      const targetArray = plane.normal.dot(polygon.plane.normal) > 0 ? coplanarFront : coplanarBack;
      targetArray.push(polygon);
      break;
    }

    case front:
      frontPolygons.push(polygon);
      break;

    case back:
      backPolygons.push(polygon);
      break;

    case spanning: {
      const f: VertexData[] = [];
      const b: VertexData[] = [];

      for (let i = 0; i < polygon.vertices.length; i++) {
        const j = (i + 1) % polygon.vertices.length;
        const ti = types[i];
        const tj = types[j];
        const vi = polygon.vertices[i];
        const vj = polygon.vertices[j];

        if (!vi || !vj || ti === undefined || tj === undefined) continue;

        if (ti !== back) f.push(vi);
        if (ti !== front) b.push(ti !== back ? cloneVertex(vi) : vi);

        if ((ti | tj) === spanning) {
          const t =
            (plane.w - plane.normal.dot(vi.pos)) /
            plane.normal.dot(new Vector().copy(vj.pos).sub(vi.pos));
          const v = interpolateVertex(vi, vj, t);
          f.push(v);
          b.push(cloneVertex(v));
        }
      }

      if (f.length >= 3) {
        frontPolygons.push(createPolygon(f, polygon.shared));
      }
      if (b.length >= 3) {
        backPolygons.push(createPolygon(b, polygon.shared));
      }
      break;
    }
  }

  return {
    coplanarFront,
    coplanarBack,
    front: frontPolygons,
    back: backPolygons,
  };
};

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
