/**
 * @file geometry-assertions.ts
 * @description Test utility functions for geometry validation and assertions.
 * Provides reusable geometry validation functions following DRY, KISS, and SRP principles.
 *
 * @author OpenSCAD Babylon Team
 * @version 1.0.0
 * @since 2025-07-29
 */

import { expect } from 'vitest';
import type { GeometryData, Vector3 } from '../types/geometry-data';

/**
 * Validate that a geometry object has the expected structure
 *
 * @param geometry - Geometry object to validate
 * @param options - Validation options
 */
export function expectValidGeometry(
  geometry: GeometryData,
  options: {
    hasVertices?: boolean;
    hasFaces?: boolean;
    hasNormals?: boolean;
    hasMetadata?: boolean;
    minVertices?: number;
    minFaces?: number;
  } = {}
): void {
  expect(geometry).toBeDefined();
  expect(typeof geometry).toBe('object');

  if (options.hasVertices !== false) {
    expect(geometry.vertices).toBeDefined();
    expect(Array.isArray(geometry.vertices)).toBe(true);

    if (options.minVertices !== undefined) {
      expect(geometry.vertices.length).toBeGreaterThanOrEqual(options.minVertices);
    }
  }

  // Check faces only for 3D geometry
  if (options.hasFaces !== false && 'faces' in geometry) {
    expect(geometry.faces).toBeDefined();
    expect(Array.isArray(geometry.faces)).toBe(true);

    if (options.minFaces !== undefined) {
      expect(geometry.faces.length).toBeGreaterThanOrEqual(options.minFaces);
    }
  }

  // Check normals only for 3D geometry
  if (options.hasNormals !== false && 'normals' in geometry) {
    expect(geometry.normals).toBeDefined();
    expect(Array.isArray(geometry.normals)).toBe(true);
  }

  if (options.hasMetadata !== false) {
    expect(geometry.metadata).toBeDefined();
    expect(typeof geometry.metadata).toBe('object');
  }
}

/**
 * Validate that vertices are valid Vector3 objects
 *
 * @param vertices - Array of vertices to validate
 * @param expectedCount - Optional expected count
 */
export function expectValidVertices(vertices: readonly Vector3[], expectedCount?: number): void {
  expect(Array.isArray(vertices)).toBe(true);

  if (expectedCount !== undefined) {
    expect(vertices).toHaveLength(expectedCount);
  }

  for (let index = 0; index < vertices.length; index++) {
    const vertex = vertices[index];
    expect(vertex, `Vertex at index ${index} should be defined`).toBeDefined();
    if (!vertex) continue; // Type guard for TypeScript
    expect(typeof vertex.x, `Vertex ${index}.x should be a number`).toBe('number');
    expect(typeof vertex.y, `Vertex ${index}.y should be a number`).toBe('number');
    expect(typeof vertex.z, `Vertex ${index}.z should be a number`).toBe('number');

    expect(Number.isFinite(vertex.x), `Vertex ${index}.x should be finite`).toBe(true);
    expect(Number.isFinite(vertex.y), `Vertex ${index}.y should be finite`).toBe(true);
    expect(Number.isFinite(vertex.z), `Vertex ${index}.z should be finite`).toBe(true);
  }
}

/**
 * Validate that faces are valid arrays of vertex indices
 *
 * @param faces - Array of faces to validate
 * @param vertexCount - Number of vertices available for indexing
 * @param expectedCount - Optional expected face count
 */
export function expectValidFaces(
  faces: readonly (readonly number[])[],
  vertexCount: number,
  expectedCount?: number
): void {
  expect(Array.isArray(faces)).toBe(true);

  if (expectedCount !== undefined) {
    expect(faces).toHaveLength(expectedCount);
  }

  for (let faceIndex = 0; faceIndex < faces.length; faceIndex++) {
    const face = faces[faceIndex];
    expect(face, `Face ${faceIndex} should be defined`).toBeDefined();

    if (!face) continue; // Skip undefined faces

    expect(Array.isArray(face), `Face ${faceIndex} should be an array`).toBe(true);
    expect(face.length, `Face ${faceIndex} should have at least 3 vertices`).toBeGreaterThanOrEqual(
      3
    );

    for (let vertexIndex = 0; vertexIndex < face.length; vertexIndex++) {
      const index = face[vertexIndex];
      expect(
        Number.isInteger(index),
        `Face ${faceIndex}, vertex ${vertexIndex} should be an integer`
      ).toBe(true);
      expect(
        index,
        `Face ${faceIndex}, vertex ${vertexIndex} should be >= 0`
      ).toBeGreaterThanOrEqual(0);
      expect(
        index,
        `Face ${faceIndex}, vertex ${vertexIndex} should be < ${vertexCount}`
      ).toBeLessThan(vertexCount);
    }

    // Check for duplicate indices in face
    const uniqueIndices = new Set(face);
    expect(uniqueIndices.size, `Face ${faceIndex} should not have duplicate vertex indices`).toBe(
      face.length
    );
  }
}

/**
 * Validate that normals are valid normalized Vector3 objects
 *
 * @param normals - Array of normals to validate
 * @param expectedCount - Optional expected count
 * @param tolerance - Tolerance for normalization check (default: 1e-6)
 */
export function expectValidNormals(
  normals: readonly Vector3[],
  expectedCount?: number,
  tolerance: number = 1e-6
): void {
  expect(Array.isArray(normals)).toBe(true);

  if (expectedCount !== undefined) {
    expect(normals).toHaveLength(expectedCount);
  }

  for (let index = 0; index < normals.length; index++) {
    const normal = normals[index];
    expect(normal, `Normal at index ${index} should be defined`).toBeDefined();

    if (!normal) continue; // Skip undefined normals

    expect(typeof normal.x, `Normal ${index}.x should be a number`).toBe('number');
    expect(typeof normal.y, `Normal ${index}.y should be a number`).toBe('number');
    expect(typeof normal.z, `Normal ${index}.z should be a number`).toBe('number');

    expect(Number.isFinite(normal.x), `Normal ${index}.x should be finite`).toBe(true);
    expect(Number.isFinite(normal.y), `Normal ${index}.y should be finite`).toBe(true);
    expect(Number.isFinite(normal.z), `Normal ${index}.z should be finite`).toBe(true);

    // Check if normal is approximately unit length (allowing for zero normals)
    const length = Math.sqrt(normal.x * normal.x + normal.y * normal.y + normal.z * normal.z);
    if (length > tolerance) {
      expect(
        Math.abs(length - 1),
        `Normal ${index} should be unit length or zero`
      ).toBeLessThanOrEqual(tolerance);
    }
  }
}

/**
 * Validate that metadata has the expected structure and properties
 *
 * @param metadata - Metadata object to validate
 * @param expectedType - Expected primitive type
 * @param expectedProperties - Expected properties in parameters
 */
export function expectValidMetadata(
  metadata: GeometryData['metadata'],
  expectedType?: string,
  expectedProperties?: string[]
): void {
  expect(metadata).toBeDefined();
  expect(typeof metadata).toBe('object');

  if (expectedType) {
    expect(metadata.primitiveType).toBe(expectedType);
  }

  expect(metadata.parameters).toBeDefined();
  expect(typeof metadata.parameters).toBe('object');

  if (expectedProperties) {
    for (const property of expectedProperties) {
      expect(metadata.parameters).toHaveProperty(property);
    }
  }

  expect(typeof metadata.generatedAt).toBe('number');
  expect(metadata.generatedAt).toBeGreaterThan(0);

  expect(typeof metadata.isConvex).toBe('boolean');
}

/**
 * Validate that a geometry matches expected counts and properties
 *
 * @param geometry - Geometry to validate
 * @param expected - Expected properties
 */
export function expectGeometryProperties(
  geometry: GeometryData,
  expected: {
    vertexCount?: number;
    faceCount?: number;
    normalCount?: number;
    primitiveType?: string;
    isConvex?: boolean;
  }
): void {
  expectValidGeometry(geometry);

  if (expected.vertexCount !== undefined) {
    expect(geometry.vertices).toHaveLength(expected.vertexCount);
  }

  if (expected.faceCount !== undefined && 'faces' in geometry) {
    expect(geometry.faces).toHaveLength(expected.faceCount);
  }

  if (expected.normalCount !== undefined && 'normals' in geometry) {
    expect(geometry.normals).toHaveLength(expected.normalCount);
  }

  if (expected.primitiveType !== undefined) {
    expect(geometry.metadata.primitiveType).toBe(expected.primitiveType);
  }

  if (expected.isConvex !== undefined) {
    expect(geometry.metadata.isConvex).toBe(expected.isConvex);
  }
}

/**
 * Validate that two Vector3 objects are approximately equal
 *
 * @param actual - Actual vector
 * @param expected - Expected vector
 * @param tolerance - Tolerance for comparison (default: 1e-10)
 */
export function expectVector3ToBeCloseTo(
  actual: Vector3,
  expected: Vector3,
  tolerance: number = 1e-10
): void {
  expect(actual.x).toBeCloseTo(expected.x, tolerance);
  expect(actual.y).toBeCloseTo(expected.y, tolerance);
  expect(actual.z).toBeCloseTo(expected.z, tolerance);
}

/**
 * Validate that an array of vertices matches expected positions
 *
 * @param actual - Actual vertices
 * @param expected - Expected vertices
 * @param tolerance - Tolerance for comparison (default: 1e-10)
 */
export function expectVerticestoBeCloseTo(
  actual: readonly Vector3[],
  expected: readonly Vector3[],
  tolerance: number = 1e-10
): void {
  expect(actual).toHaveLength(expected.length);

  for (let i = 0; i < actual.length; i++) {
    const actualVertex = actual[i];
    const expectedVertex = expected[i];

    if (!actualVertex) {
      throw new Error(`Actual vertex at index ${i} is undefined`);
    }
    if (!expectedVertex) {
      throw new Error(`Expected vertex at index ${i} is undefined`);
    }

    expectVector3ToBeCloseTo(actualVertex, expectedVertex, tolerance);
  }
}
