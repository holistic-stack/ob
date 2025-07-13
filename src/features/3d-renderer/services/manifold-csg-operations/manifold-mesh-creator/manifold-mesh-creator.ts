/**
 * @file Manifold Mesh Creator
 * @description Creates Manifold mesh data from Three.js BufferGeometry using official patterns
 *
 * This module follows the Single Responsibility Principle by focusing solely on converting
 * Three.js BufferGeometry to Manifold-compatible mesh format. It implements the exact
 * patterns from the official Manifold library examples.
 *
 * Based on the official three.ts example from the Manifold library:
 * https://github.com/elalish/manifold/blob/master/bindings/wasm/examples/three.ts
 *
 * @example
 * ```typescript
 * import { createManifoldMeshFromGeometry } from './manifold-mesh-creator';
 * import { BoxGeometry } from 'three';
 *
 * const geometry = new BoxGeometry(1, 1, 1);
 * const result = createManifoldMeshFromGeometry(geometry);
 *
 * if (result.success) {
 *   const manifoldObject = new manifoldModule.Manifold(result.data);
 * }
 * ```
 */

import type { BufferGeometry } from 'three';
import type { Result } from '../../../../../shared/types/result.types';

/**
 * Manifold mesh data structure following the official format
 * Based on the Manifold library's Mesh interface
 */
export interface ManifoldMeshData {
  readonly numProp: number; // Number of properties per vertex (3 for position-only)
  readonly vertProperties: Float32Array; // Vertex data (positions)
  readonly triVerts: Uint32Array; // Triangle vertex indices
  readonly runIndex: Uint32Array; // Run boundaries for materials
  readonly runOriginalID: Uint32Array; // Material IDs for runs
}

/**
 * Validates BufferGeometry for Manifold conversion
 *
 * @param geometry - Three.js BufferGeometry to validate
 * @returns Result indicating validation success or specific error
 */
function validateGeometryForManifold(geometry: BufferGeometry): Result<void, string> {
  // Check for position attribute
  const positionAttribute = geometry.getAttribute('position');
  if (!positionAttribute) {
    return { success: false, error: 'Geometry missing position attribute' };
  }

  if (positionAttribute.count === 0) {
    return { success: false, error: 'Geometry has no vertices' };
  }

  // Check for indices (required for manifold meshes)
  const index = geometry.getIndex();
  if (!index || index.count === 0) {
    return {
      success: false,
      error: 'Geometry missing indices (non-indexed geometries not supported)',
    };
  }

  if (index.count % 3 !== 0) {
    return {
      success: false,
      error: 'Index count must be multiple of 3 (triangulated mesh required)',
    };
  }

  // Check for reasonable limits
  if (positionAttribute.count > 100000) {
    return {
      success: false,
      error: `Geometry has too many vertices (${positionAttribute.count}), maximum supported: 100000`,
    };
  }

  const triangleCount = index.count / 3;
  if (triangleCount > 200000) {
    return {
      success: false,
      error: `Geometry has too many triangles (${triangleCount}), maximum supported: 200000`,
    };
  }

  return { success: true, data: undefined };
}

/**
 * Extracts vertex properties from BufferGeometry
 *
 * @param geometry - Three.js BufferGeometry
 * @returns Float32Array of vertex positions
 */
function extractVertexProperties(geometry: BufferGeometry): Float32Array {
  const positionAttribute = geometry.getAttribute('position');
  return positionAttribute.array as Float32Array;
}

/**
 * Extracts triangle vertex indices from BufferGeometry
 *
 * Handles both indexed and non-indexed geometries following the official pattern.
 *
 * @param geometry - Three.js BufferGeometry
 * @returns Uint32Array of triangle vertex indices
 */
function extractTriangleVertices(geometry: BufferGeometry): Uint32Array {
  const index = geometry.getIndex();

  if (index != null) {
    // Indexed geometry - use existing indices
    return new Uint32Array(index.array);
  } else {
    // Non-indexed geometry - generate sequential indices
    const positionAttribute = geometry.getAttribute('position');
    const vertexCount = positionAttribute.count;
    return new Uint32Array(Array.from({ length: vertexCount }, (_, idx) => idx));
  }
}

/**
 * Creates run structure for material handling
 *
 * For single-material meshes, creates a single run covering all triangles.
 * This follows the official pattern from the Manifold examples.
 *
 * @param triangleCount - Number of triangle indices
 * @returns Object containing runIndex and runOriginalID arrays
 */
function createRunStructure(triangleCount: number): {
  runIndex: Uint32Array;
  runOriginalID: Uint32Array;
} {
  // Single run covering all triangles (official pattern)
  const runIndex = new Uint32Array([0, triangleCount]);
  const runOriginalID = new Uint32Array([0]);

  return { runIndex, runOriginalID };
}

/**
 * Creates Manifold mesh data from Three.js BufferGeometry using the official pattern
 *
 * This function implements the exact conversion pattern from the official Manifold
 * three.ts example. It creates a mesh data structure that can be directly passed
 * to the Manifold constructor.
 *
 * @param geometry - Three.js BufferGeometry to convert
 * @returns Result containing Manifold mesh data or error
 *
 * @example
 * ```typescript
 * import { BoxGeometry } from 'three';
 *
 * const geometry = new BoxGeometry(1, 1, 1);
 * const result = createManifoldMeshFromGeometry(geometry);
 *
 * if (result.success) {
 *   console.log('Mesh data:', {
 *     vertices: result.data.vertProperties.length / 3,
 *     triangles: result.data.triVerts.length / 3
 *   });
 * }
 * ```
 */
export function createManifoldMeshFromGeometry(
  geometry: BufferGeometry
): Result<ManifoldMeshData, string> {
  try {
    // Step 1: Validate geometry
    const validation = validateGeometryForManifold(geometry);
    if (!validation.success) {
      return validation;
    }

    // Step 2: Extract vertex properties (positions only)
    const vertProperties = extractVertexProperties(geometry);

    // Step 3: Extract triangle vertex indices
    const triVerts = extractTriangleVertices(geometry);

    // Step 4: Create run structure for materials
    const { runIndex, runOriginalID } = createRunStructure(triVerts.length);

    // Step 5: Create mesh data following official format
    const meshData: ManifoldMeshData = {
      numProp: 3, // Position only (x, y, z)
      vertProperties, // Float32Array of vertex positions
      triVerts, // Uint32Array of triangle indices
      runIndex, // Uint32Array of run boundaries
      runOriginalID, // Uint32Array of material IDs
    };

    return { success: true, data: meshData };
  } catch (error) {
    return {
      success: false,
      error: `Failed to create Manifold mesh: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Creates Manifold mesh data with detailed logging for debugging
 *
 * @param geometry - Three.js BufferGeometry to convert
 * @returns Result containing Manifold mesh data or error
 */
export function createManifoldMeshFromGeometryWithLogging(
  geometry: BufferGeometry
): Result<ManifoldMeshData, string> {
  const result = createManifoldMeshFromGeometry(geometry);

  if (result.success) {
    const { vertProperties, triVerts, runIndex } = result.data;
    console.log('Created Manifold mesh data:', {
      numProp: result.data.numProp,
      vertexCount: vertProperties.length / 3,
      triangleCount: triVerts.length / 3,
      runCount: runIndex.length - 1,
    });
  } else {
    console.error('Failed to create Manifold mesh:', result.error);
  }

  return result;
}

/**
 * Validates that mesh data conforms to Manifold requirements
 *
 * @param meshData - Manifold mesh data to validate
 * @returns Result indicating validation success or error
 */
export function validateManifoldMeshData(meshData: ManifoldMeshData): Result<void, string> {
  const { numProp, vertProperties, triVerts, runIndex, runOriginalID } = meshData;

  // Validate numProp
  if (numProp !== 3) {
    return { success: false, error: `Invalid numProp: expected 3, got ${numProp}` };
  }

  // Validate vertex properties
  if (vertProperties.length === 0 || vertProperties.length % 3 !== 0) {
    return { success: false, error: `Invalid vertProperties length: ${vertProperties.length}` };
  }

  // Validate triangle vertices
  if (triVerts.length === 0 || triVerts.length % 3 !== 0) {
    return { success: false, error: `Invalid triVerts length: ${triVerts.length}` };
  }

  // Validate vertex indices are within range
  const vertexCount = vertProperties.length / 3;
  for (let i = 0; i < triVerts.length; i++) {
    if (triVerts[i] >= vertexCount) {
      return {
        success: false,
        error: `Invalid vertex index ${triVerts[i]} at position ${i}, max allowed: ${vertexCount - 1}`,
      };
    }
  }

  // Validate run structure
  if (runIndex.length < 2) {
    return { success: false, error: 'runIndex must have at least 2 elements' };
  }

  if (runIndex[0] !== 0) {
    return { success: false, error: 'runIndex must start with 0' };
  }

  if (runIndex[runIndex.length - 1] !== triVerts.length) {
    return { success: false, error: 'runIndex must end with triVerts.length' };
  }

  if (runOriginalID.length !== runIndex.length - 1) {
    return { success: false, error: 'runOriginalID length must be runIndex.length - 1' };
  }

  return { success: true, data: undefined };
}
