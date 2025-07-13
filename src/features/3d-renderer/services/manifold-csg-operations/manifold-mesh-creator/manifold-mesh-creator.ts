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
 * ⚠️  CRITICAL: After creating a Manifold mesh with this data, you MUST call mesh.merge()
 *
 * From the official Manifold three.ts example:
 * ```typescript
 * const mesh = new Mesh({numProp: 3, vertProperties, triVerts, runIndex, runOriginalID});
 * mesh.merge(); // CRITICAL - this merges vertices with nearly identical positions
 * ```
 *
 * The merge() call is essential because:
 * - GL drivers require duplicate vertices when properties change (UV boundaries, sharp corners)
 * - Manifold needs manifold-compliant topology
 * - This fills in mergeFromVert and mergeToVert vectors automatically
 * - Without merge(), you'll get "Invalid mesh" errors
 */

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
 * Creates run structure for material handling following official pattern
 *
 * Based on the official three.ts example from Manifold library.
 * Creates triangle runs for each group (material) - akin to a draw call.
 *
 * @param geometry - Three.js BufferGeometry to analyze
 * @returns Object containing runIndex and runOriginalID arrays
 */
function createRunStructureFromGroups(geometry: BufferGeometry): {
  runIndex: Uint32Array;
  runOriginalID: Uint32Array;
} {
  // If no groups, create single run covering all triangles
  if (geometry.groups.length === 0) {
    const positionAttribute = geometry.getAttribute('position');
    const triangleCount = geometry.index ? geometry.index.count : (positionAttribute?.count ?? 0);
    return {
      runIndex: new Uint32Array([0, triangleCount]),
      runOriginalID: new Uint32Array([0])
    };
  }

  // Create a triangle run for each group (material) following official pattern
  const starts: number[] = [];
  const originalIDs: number[] = [];

  for (let idx = 0; idx < geometry.groups.length; idx++) {
    const group = geometry.groups[idx];
    if (group) {
      starts.push(group.start);
      originalIDs.push(group.materialIndex ?? 0);
    }
  }

  // List the runs in sequence and sort by start position
  const indices = Array.from(starts.keys());
  indices.sort((a, b) => starts[a]! - starts[b]!);

  // Create runIndex with start positions + final end position
  const sortedStarts = indices.map(i => starts[i]!);
  const totalTriangles = geometry.index ? geometry.index.count : (geometry.getAttribute('position')?.count ?? 0);
  const runIndexArray = [...sortedStarts, totalTriangles];

  const runIndex = new Uint32Array(runIndexArray);
  const runOriginalID = new Uint32Array(indices.map(i => originalIDs[i]!));

  return { runIndex, runOriginalID };
}

/**
 * Creates Manifold mesh data from Three.js BufferGeometry using the official pattern
 *
 * This function implements the exact conversion pattern from the official Manifold
 * three.ts example. It creates a mesh data structure that can be directly passed
 * to the Manifold constructor.
 *
 * Based on: https://github.com/elalish/manifold/blob/master/bindings/wasm/examples/three.ts
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

    // Step 2: Extract vertex properties following official pattern
    // Only using position in this implementation for simplicity
    const positionAttribute = geometry.getAttribute('position');
    if (!positionAttribute) {
      return { success: false, error: 'Geometry missing position attribute' };
    }
    const vertProperties = positionAttribute.array as Float32Array;

    // Step 3: Extract triangle indices following official pattern
    // Manifold only uses indexed geometry, so generate an index if necessary
    const sourceIndices = geometry.index != null ?
      geometry.index.array as Uint32Array :
      new Uint32Array(vertProperties.length / 3).map((_, idx) => idx);

    // Step 3.1: CRITICAL - Reverse triangle winding order for Manifold compatibility
    // Based on BabylonJS CSG2 implementation pattern
    const triVerts = new Uint32Array(sourceIndices.length);
    for (let i = 0; i < sourceIndices.length; i += 3) {
      const v0 = sourceIndices[i];
      const v1 = sourceIndices[i + 1];
      const v2 = sourceIndices[i + 2];

      if (v0 !== undefined && v1 !== undefined && v2 !== undefined) {
        triVerts[i] = v2;     // Reverse triangle order
        triVerts[i + 1] = v1; // Keep middle vertex
        triVerts[i + 2] = v0; // Reverse triangle order
      }
    }

    // Step 4: Create run structure for materials following official pattern
    const { runIndex, runOriginalID } = createRunStructureFromGroups(geometry);

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
    const vertexIndex = triVerts[i];
    if (vertexIndex !== undefined && vertexIndex >= vertexCount) {
      return {
        success: false,
        error: `Invalid vertex index ${vertexIndex} at position ${i}, max allowed: ${vertexCount - 1}`,
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
