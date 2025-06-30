/**
 * Geometry Type Definitions
 *
 * Type definitions for geometric primitives extracted from utility classes
 * following bulletproof-react type organization patterns.
 */

import type { Vector } from '../utils/Vector';

/**
 * Shared data interface for polygons
 * Used for CSG operations and material/surface properties
 */
export interface SharedData {
  readonly color?: Vector;
  readonly material?: string;
  readonly tag?: string;
  readonly id?: string;
  readonly [key: string]: unknown;
}

/**
 * Vertex data interface
 * Extracted from Vertex.ts class definition
 */
export interface VertexData {
  readonly pos: Vector;
  readonly normal: Vector;
  readonly uv: Vector;
  readonly color?: Vector;
}

/**
 * Vertex operations interface
 */
export interface VertexOperations {
  clone(): VertexData;
  flip(): void;
  interpolate(other: VertexData, t: number): VertexData;
}

/**
 * Plane data interface
 * Extracted from Plane.ts class definition
 */
export interface PlaneData {
  readonly normal: Vector;
  readonly w: number;
}

/**
 * Plane operations interface
 */
export interface PlaneOperations {
  clone(): PlaneData;
  flip(): void;
  splitPolygon(
    polygon: PolygonData,
    coplanarFront: PolygonData[],
    coplanarBack: PolygonData[],
    front: PolygonData[],
    back: PolygonData[]
  ): void;
}

/**
 * Polygon data interface
 * Extracted from Polygon.ts class definition
 */
export interface PolygonData {
  readonly vertices: VertexData[];
  readonly shared: SharedData;
  readonly plane: PlaneData;
}

/**
 * Polygon operations interface
 */
export interface PolygonOperations {
  clone(): PolygonData;
  flip(): void;
}

/**
 * BSP Tree Node data interface
 * Extracted from Node.ts class definition
 */
export interface BSPNodeData {
  readonly polygons: PolygonData[];
  readonly plane?: PlaneData;
  readonly front?: BSPNodeData;
  readonly back?: BSPNodeData;
}

/**
 * BSP Tree Node operations interface
 */
export interface BSPNodeOperations {
  clone(): BSPNodeData;
  invert(): void;
  clipPolygons(polygons: PolygonData[]): PolygonData[];
  clipTo(bsp: BSPNodeData): void;
  allPolygons(): PolygonData[];
  build(polygons: PolygonData[]): void;
}

/**
 * Buffer data interfaces for NBuf utilities
 */
export interface BufferData3D {
  readonly array: Float32Array;
  readonly top: number;
}

export interface BufferData2D {
  readonly array: Float32Array;
  readonly top: number;
}

/**
 * Buffer operations interfaces
 */
export interface BufferOperations3D {
  write(v: Vector): void;
}

export interface BufferOperations2D {
  write(v: Vector): void;
}

/**
 * CSG polygon collection interface
 */
export interface CSGData {
  readonly polygons: PolygonData[];
}

/**
 * CSG operations interface
 */
export interface CSGOperations {
  clone(): CSGData;
  toPolygons(): PolygonData[];
  union(csg: CSGData): CSGData;
  subtract(csg: CSGData): CSGData;
  intersect(csg: CSGData): CSGData;
  inverse(): CSGData;
}

/**
 * Geometric primitive types
 */
export type GeometricPrimitive = VertexData | PlaneData | PolygonData | BSPNodeData;

/**
 * Buffer types
 */
export type BufferType = BufferData3D | BufferData2D;

/**
 * Classification types for BSP operations
 */
export type BSPClassification = 'coplanar' | 'front' | 'back' | 'spanning';

/**
 * Type guards for geometric primitives
 */
export const isVertexData = (obj: unknown): obj is VertexData => {
  return Boolean(obj && typeof obj === 'object' && 'pos' in obj && 'normal' in obj && 'uv' in obj);
};

export const isPlaneData = (obj: unknown): obj is PlaneData => {
  return Boolean(obj && typeof obj === 'object' && 'normal' in obj && 'w' in obj);
};

export const isPolygonData = (obj: unknown): obj is PolygonData => {
  return Boolean(obj && typeof obj === 'object' && 'vertices' in obj && 'plane' in obj);
};

export const isBSPNodeData = (obj: unknown): obj is BSPNodeData => {
  return Boolean(obj && typeof obj === 'object' && 'polygons' in obj);
};

/**
 * Utility types for geometric operations
 */
export interface GeometryTransform {
  readonly translation: Vector;
  readonly rotation: Vector;
  readonly scale: Vector;
}

export interface GeometryBounds {
  readonly min: Vector;
  readonly max: Vector;
  readonly center: Vector;
  readonly size: Vector;
}
