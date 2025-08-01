/**
 * @file geometry-utilities.ts
 * @description Common geometry utility functions for OpenSCAD primitive generators.
 * Provides reusable functions following DRY, KISS, and SRP principles.
 *
 * @author OpenSCAD Babylon Team
 * @version 1.0.0
 * @since 2025-07-29
 */

import type { Result } from '@/shared';
import { error, isError, success } from '@/shared';
import type { FragmentCalculatorService } from '../../services/fragment-calculator';
import type { GeometryGenerationError, Vector3 } from '../../types/geometry-data';
import { Vector3Utils } from '../math-helpers';

/**
 * Normalize a 3D vector to unit length
 * Reusable alternative to manual normalization calculations
 *
 * @param vector - Vector to normalize
 * @returns Normalized vector or zero vector if input has zero length
 */
export function normalizeVector3(vector: Vector3): Vector3 {
  return Vector3Utils.normalize(vector);
}

/**
 * Calculate vector length using optimized Vector3Utils
 *
 * @param vector - Vector to measure
 * @returns Vector length
 */
export function calculateVectorLength(vector: Vector3): number {
  return Vector3Utils.length(vector);
}

/**
 * Resolve radius from OpenSCAD parameters (diameter takes precedence)
 * Common pattern used in sphere and cylinder generators
 *
 * @param radiusParam - Radius parameter (optional)
 * @param diameterParam - Diameter parameter (optional)
 * @returns Result containing resolved radius or error
 */
export function resolveRadiusFromParameters(
  radiusParam?: number,
  diameterParam?: number
): Result<number, GeometryGenerationError> {
  if (diameterParam !== undefined) {
    return success(diameterParam / 2);
  }

  if (radiusParam !== undefined) {
    return success(radiusParam);
  }

  return error({
    type: 'INVALID_PARAMETERS',
    message: 'Either radius or diameter must be specified',
  });
}

/**
 * Calculate fragments using fragment calculator with error handling
 * Common pattern used across sphere and cylinder generators
 *
 * @param fragmentCalculator - Fragment calculator service
 * @param radius - Radius for fragment calculation
 * @param fn - Fragment number parameter
 * @param fs - Fragment size parameter
 * @param fa - Fragment angle parameter
 * @returns Result containing calculated fragments or error
 */
export function calculateFragmentsWithErrorHandling(
  fragmentCalculator: FragmentCalculatorService,
  radius: number,
  fn: number,
  fs: number,
  fa: number
): Result<number, GeometryGenerationError> {
  const fragmentResult = fragmentCalculator.calculateFragments(radius, fn, fs, fa);

  if (isError(fragmentResult)) {
    return error({
      type: 'INVALID_PARAMETERS',
      message: `Fragment calculation failed: ${fragmentResult.error.message}`,
    });
  }

  return success(fragmentResult.data);
}

/**
 * Create standard geometry metadata
 * Common pattern used across all generators
 *
 * @param primitiveType - Type of primitive (e.g., '3d-sphere')
 * @param parameters - Primitive-specific parameters
 * @param isConvex - Whether the geometry is convex
 * @param additionalData - Additional metadata fields
 * @returns Frozen metadata object
 */
export function createGeometryMetadata(
  primitiveType: string,
  parameters: Record<string, unknown>,
  isConvex: boolean = true,
  additionalData: Record<string, unknown> = {}
) {
  return Object.freeze({
    primitiveType,
    parameters: Object.freeze(parameters),
    generatedAt: Date.now(),
    isConvex,
    ...additionalData,
  });
}

/**
 * Create standard geometry data structure
 * Common pattern used across all generators
 *
 * @param vertices - Array of vertices
 * @param faces - Array of faces
 * @param normals - Array of normals
 * @param metadata - Geometry metadata
 * @returns Frozen geometry data object
 */
export function createGeometryData<T>(
  vertices: readonly Vector3[],
  faces: readonly (readonly number[])[],
  normals: readonly Vector3[],
  metadata: Record<string, unknown>
): T {
  return Object.freeze({
    vertices: Object.freeze(vertices),
    faces: Object.freeze(faces),
    normals: Object.freeze(normals),
    metadata: Object.freeze(metadata),
  }) as T;
}

/**
 * Generate normals for vertices by normalizing position vectors
 * Common pattern for spherical and cylindrical surfaces
 *
 * @param vertices - Array of vertices
 * @returns Array of normalized normal vectors
 */
export function generateNormalsFromPositions(vertices: readonly Vector3[]): readonly Vector3[] {
  return vertices.map((vertex) => normalizeVector3(vertex));
}

/**
 * Convert array of number arrays to Vector3 objects
 * Common pattern in polyhedron generator
 *
 * @param vertexArrays - Array of [x, y, z] coordinate arrays
 * @returns Array of Vector3 objects
 */
export function convertVertexArraysToVector3(
  vertexArrays: readonly (readonly number[])[]
): readonly Vector3[] {
  return vertexArrays.map((vertex) =>
    Object.freeze({
      x: vertex[0],
      y: vertex[1],
      z: vertex[2],
    })
  );
}

/**
 * Calculate center point of a set of vertices
 * Useful for centering operations and bounds calculations
 *
 * @param vertices - Array of vertices
 * @returns Center point as Vector3
 */
export function calculateCenterPoint(vertices: readonly Vector3[]): Vector3 {
  if (vertices.length === 0) {
    return Vector3Utils.zero();
  }

  const sum = vertices.reduce((acc, vertex) => Vector3Utils.add(acc, vertex), Vector3Utils.zero());

  return Vector3Utils.divide(sum, vertices.length);
}

/**
 * Calculate bounding box of vertices
 * Useful for bounds calculations and optimization
 *
 * @param vertices - Array of vertices
 * @returns Bounding box with min and max points
 */
export function calculateBoundingBox(vertices: readonly Vector3[]): {
  min: Vector3;
  max: Vector3;
} {
  if (vertices.length === 0) {
    const zero = Vector3Utils.zero();
    return { min: zero, max: zero };
  }

  let min = vertices[0];
  let max = vertices[0];

  for (const vertex of vertices) {
    min = Vector3Utils.min(min, vertex);
    max = Vector3Utils.max(max, vertex);
  }

  return { min, max };
}

/**
 * Check if a number is approximately zero within tolerance
 * Useful for geometric calculations and comparisons
 *
 * @param value - Number to check
 * @param tolerance - Tolerance for comparison (default: 1e-10)
 * @returns True if value is approximately zero
 */
export function isApproximatelyZero(value: number, tolerance: number = 1e-10): boolean {
  return Math.abs(value) <= tolerance;
}

/**
 * Check if two numbers are approximately equal within tolerance
 * Useful for geometric calculations and comparisons
 *
 * @param a - First number
 * @param b - Second number
 * @param tolerance - Tolerance for comparison (default: 1e-10)
 * @returns True if numbers are approximately equal
 */
export function isApproximatelyEqual(a: number, b: number, tolerance: number = 1e-10): boolean {
  return Math.abs(a - b) <= tolerance;
}
