/**
 * @file vector-operations.ts
 * @description Vector operations utilities for 2D and 3D geometry calculations.
 * Provides pure functional vector operations following OpenSCAD coordinate system conventions.
 *
 * @example
 * ```typescript
 * // 3D vector operations
 * const v1 = { x: 1, y: 2, z: 3 };
 * const v2 = { x: 4, y: 5, z: 6 };
 * const sum = Vector3Utils.add(v1, v2); // { x: 5, y: 7, z: 9 }
 * const cross = Vector3Utils.cross(v1, v2); // Cross product
 *
 * // 2D vector operations
 * const p1 = { x: 1, y: 2 };
 * const p2 = { x: 3, y: 4 };
 * const distance = Vector2Utils.distance(p1, p2); // Euclidean distance
 * ```
 *
 * @author OpenSCAD Babylon Team
 * @version 1.0.0
 * @since 2025-07-29
 */

import type { Vector2, Vector3 } from '../../types/geometry-data';

/**
 * 3D Vector operations following OpenSCAD coordinate system (Z-up, right-handed)
 */
export const Vector3Utils = {
  /**
   * Create a zero vector
   */
  zero(): Vector3 {
    return Object.freeze({ x: 0, y: 0, z: 0 });
  },

  /**
   * Create a unit vector along X axis
   */
  unitX(): Vector3 {
    return Object.freeze({ x: 1, y: 0, z: 0 });
  },

  /**
   * Create a unit vector along Y axis
   */
  unitY(): Vector3 {
    return Object.freeze({ x: 0, y: 1, z: 0 });
  },

  /**
   * Create a unit vector along Z axis (up in OpenSCAD)
   */
  unitZ(): Vector3 {
    return Object.freeze({ x: 0, y: 0, z: 1 });
  },

  /**
   * Add two vectors
   */
  add(a: Vector3, b: Vector3): Vector3 {
    return Object.freeze({
      x: a.x + b.x,
      y: a.y + b.y,
      z: a.z + b.z,
    });
  },

  /**
   * Subtract two vectors (a - b)
   */
  subtract(a: Vector3, b: Vector3): Vector3 {
    return Object.freeze({
      x: a.x - b.x,
      y: a.y - b.y,
      z: a.z - b.z,
    });
  },

  /**
   * Multiply vector by scalar
   */
  scale(v: Vector3, scalar: number): Vector3 {
    return Object.freeze({
      x: v.x * scalar,
      y: v.y * scalar,
      z: v.z * scalar,
    });
  },

  /**
   * Divide vector by scalar
   */
  divide(v: Vector3, scalar: number): Vector3 {
    if (scalar === 0) {
      throw new Error('Cannot divide vector by zero');
    }
    return Vector3Utils.scale(v, 1 / scalar);
  },

  /**
   * Calculate dot product
   */
  dot(a: Vector3, b: Vector3): number {
    return a.x * b.x + a.y * b.y + a.z * b.z;
  },

  /**
   * Calculate cross product (right-handed coordinate system)
   */
  cross(a: Vector3, b: Vector3): Vector3 {
    return Object.freeze({
      x: a.y * b.z - a.z * b.y,
      y: a.z * b.x - a.x * b.z,
      z: a.x * b.y - a.y * b.x,
    });
  },

  /**
   * Calculate vector length (magnitude)
   */
  length(v: Vector3): number {
    return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
  },

  /**
   * Calculate squared length (faster than length when only comparing)
   */
  lengthSquared(v: Vector3): number {
    return v.x * v.x + v.y * v.y + v.z * v.z;
  },

  /**
   * Normalize vector to unit length
   */
  normalize(v: Vector3): Vector3 {
    const len = Vector3Utils.length(v);
    if (len === 0) {
      return Vector3Utils.zero();
    }
    return Vector3Utils.divide(v, len);
  },

  /**
   * Calculate distance between two points
   */
  distance(a: Vector3, b: Vector3): number {
    return Vector3Utils.length(Vector3Utils.subtract(a, b));
  },

  /**
   * Calculate squared distance (faster when only comparing)
   */
  distanceSquared(a: Vector3, b: Vector3): number {
    return Vector3Utils.lengthSquared(Vector3Utils.subtract(a, b));
  },

  /**
   * Linear interpolation between two vectors
   */
  lerp(a: Vector3, b: Vector3, t: number): Vector3 {
    return Object.freeze({
      x: a.x + (b.x - a.x) * t,
      y: a.y + (b.y - a.y) * t,
      z: a.z + (b.z - a.z) * t,
    });
  },

  /**
   * Check if two vectors are approximately equal
   */
  equals(a: Vector3, b: Vector3, tolerance: number = 1e-10): boolean {
    return (
      Math.abs(a.x - b.x) <= tolerance &&
      Math.abs(a.y - b.y) <= tolerance &&
      Math.abs(a.z - b.z) <= tolerance
    );
  },

  /**
   * Negate vector
   */
  negate(v: Vector3): Vector3 {
    return Object.freeze({
      x: -v.x,
      y: -v.y,
      z: -v.z,
    });
  },

  /**
   * Component-wise minimum
   */
  min(a: Vector3, b: Vector3): Vector3 {
    return Object.freeze({
      x: Math.min(a.x, b.x),
      y: Math.min(a.y, b.y),
      z: Math.min(a.z, b.z),
    });
  },

  /**
   * Component-wise maximum
   */
  max(a: Vector3, b: Vector3): Vector3 {
    return Object.freeze({
      x: Math.max(a.x, b.x),
      y: Math.max(a.y, b.y),
      z: Math.max(a.z, b.z),
    });
  },
} as const;

/**
 * 2D Vector operations for 2D primitives and projections
 */
export const Vector2Utils = {
  /**
   * Create a zero vector
   */
  zero(): Vector2 {
    return Object.freeze({ x: 0, y: 0 });
  },

  /**
   * Create a unit vector along X axis
   */
  unitX(): Vector2 {
    return Object.freeze({ x: 1, y: 0 });
  },

  /**
   * Create a unit vector along Y axis
   */
  unitY(): Vector2 {
    return Object.freeze({ x: 0, y: 1 });
  },

  /**
   * Add two vectors
   */
  add(a: Vector2, b: Vector2): Vector2 {
    return Object.freeze({
      x: a.x + b.x,
      y: a.y + b.y,
    });
  },

  /**
   * Subtract two vectors (a - b)
   */
  subtract(a: Vector2, b: Vector2): Vector2 {
    return Object.freeze({
      x: a.x - b.x,
      y: a.y - b.y,
    });
  },

  /**
   * Multiply vector by scalar
   */
  scale(v: Vector2, scalar: number): Vector2 {
    return Object.freeze({
      x: v.x * scalar,
      y: v.y * scalar,
    });
  },

  /**
   * Calculate dot product
   */
  dot(a: Vector2, b: Vector2): number {
    return a.x * b.x + a.y * b.y;
  },

  /**
   * Calculate 2D cross product (returns scalar)
   */
  cross(a: Vector2, b: Vector2): number {
    return a.x * b.y - a.y * b.x;
  },

  /**
   * Calculate vector length
   */
  length(v: Vector2): number {
    return Math.sqrt(v.x * v.x + v.y * v.y);
  },

  /**
   * Calculate squared length
   */
  lengthSquared(v: Vector2): number {
    return v.x * v.x + v.y * v.y;
  },

  /**
   * Normalize vector to unit length
   */
  normalize(v: Vector2): Vector2 {
    const len = Vector2Utils.length(v);
    if (len === 0) {
      return Vector2Utils.zero();
    }
    return Vector2Utils.scale(v, 1 / len);
  },

  /**
   * Calculate distance between two points
   */
  distance(a: Vector2, b: Vector2): number {
    return Vector2Utils.length(Vector2Utils.subtract(a, b));
  },

  /**
   * Linear interpolation between two vectors
   */
  lerp(a: Vector2, b: Vector2, t: number): Vector2 {
    return Object.freeze({
      x: a.x + (b.x - a.x) * t,
      y: a.y + (b.y - a.y) * t,
    });
  },

  /**
   * Check if two vectors are approximately equal
   */
  equals(a: Vector2, b: Vector2, tolerance: number = 1e-10): boolean {
    return Math.abs(a.x - b.x) <= tolerance && Math.abs(a.y - b.y) <= tolerance;
  },

  /**
   * Convert to 3D vector with specified Z coordinate
   */
  to3D(v: Vector2, z: number = 0): Vector3 {
    return Object.freeze({
      x: v.x,
      y: v.y,
      z,
    });
  },
} as const;
