/**
 * @file Manifold Mesh Format Converter
 * @description Converts between IManifoldMesh format and Manifold constructor-compatible format
 * Following project guidelines: SRP, functional programming, Result<T,E> patterns
 */

import type { Result } from '../../../../shared/types/result.types';
import type { IManifoldMesh } from './manifold-mesh-converter';

/**
 * Manifold constructor-compatible mesh format
 * Based on analysis of working Manifold.getMesh() output
 */
export interface ManifoldCompatibleMesh {
  readonly numProp: number;
  readonly triVerts: Uint32Array;
  readonly vertProperties: Float32Array;
  readonly mergeFromVert: Uint32Array;
  readonly mergeToVert: Uint32Array;
  readonly runIndex: Uint32Array;
  readonly runOriginalID: Uint32Array;
  readonly faceID: Uint32Array;
  readonly halfedgeTangent: Float32Array;
  readonly runTransform: Float32Array;
}

/**
 * Converts IManifoldMesh format to Manifold constructor-compatible format
 * 
 * @param mesh - Input mesh in IManifoldMesh format
 * @returns Result containing converted mesh or error
 * 
 * @example
 * ```typescript
 * const result = convertToManifoldFormat(iManifoldMesh);
 * if (result.success) {
 *   const manifold = new manifoldModule.Manifold(result.data);
 * }
 * ```
 */
export function convertToManifoldFormat(mesh: IManifoldMesh): Result<ManifoldCompatibleMesh, string> {
  try {
    // Validate input mesh
    if (!mesh.vertProperties || !mesh.triVerts) {
      return { success: false, error: 'Invalid mesh: missing vertProperties or triVerts' };
    }

    if (mesh.vertProperties.length === 0 || mesh.triVerts.length === 0) {
      return { success: false, error: 'Invalid mesh: empty vertProperties or triVerts' };
    }

    if (mesh.triVerts.length % 3 !== 0) {
      return { success: false, error: 'Invalid mesh: triVerts length must be multiple of 3' };
    }

    const numVertices = mesh.vertProperties.length / mesh.numProp;
    const numTriangles = mesh.triVerts.length / 3;

    // Create Manifold-compatible mesh format
    const compatibleMesh: ManifoldCompatibleMesh = {
      numProp: mesh.numProp,
      triVerts: new Uint32Array(mesh.triVerts),
      vertProperties: new Float32Array(mesh.vertProperties),
      
      // Initialize required fields that are missing from IManifoldMesh
      // Based on working Manifold mesh analysis:
      mergeFromVert: new Uint32Array(0), // Empty for simple meshes
      mergeToVert: new Uint32Array(0),   // Empty for simple meshes
      
      // runIndex: maps triangles to material runs
      runIndex: mesh.runIndex ? new Uint32Array(mesh.runIndex) : new Uint32Array([0, numTriangles]),
      
      // runOriginalID: material/object IDs
      runOriginalID: mesh.runOriginalID ? new Uint32Array(mesh.runOriginalID) : new Uint32Array([0]),
      
      // faceID: face identifiers (one per triangle)
      faceID: new Uint32Array(Array.from({ length: numTriangles }, (_, i) => i)),
      
      // halfedgeTangent: tangent vectors for edges (empty for simple meshes)
      halfedgeTangent: new Float32Array(0),
      
      // runTransform: transformation matrices (empty for simple meshes)
      runTransform: new Float32Array(0),
    };

    return { success: true, data: compatibleMesh };
  } catch (error) {
    return { 
      success: false, 
      error: `Failed to convert mesh format: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
}

/**
 * Converts Manifold constructor-compatible format back to IManifoldMesh format
 * 
 * @param mesh - Input mesh in Manifold-compatible format
 * @returns Result containing converted mesh or error
 */
export function convertFromManifoldFormat(mesh: ManifoldCompatibleMesh): Result<IManifoldMesh, string> {
  try {
    // Validate input mesh
    if (!mesh.vertProperties || !mesh.triVerts) {
      return { success: false, error: 'Invalid mesh: missing vertProperties or triVerts' };
    }

    // Convert back to IManifoldMesh format
    const iManifoldMesh: IManifoldMesh = {
      numProp: mesh.numProp,
      vertProperties: new Float32Array(mesh.vertProperties),
      triVerts: new Uint32Array(mesh.triVerts),
      runIndex: new Uint32Array(mesh.runIndex),
      runOriginalID: new Uint32Array(mesh.runOriginalID),
      numRun: mesh.runOriginalID.length,
    };

    return { success: true, data: iManifoldMesh };
  } catch (error) {
    return { 
      success: false, 
      error: `Failed to convert from Manifold format: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
}

/**
 * Validates that a mesh is in correct Manifold-compatible format
 * 
 * @param mesh - Mesh to validate
 * @returns Result indicating validation success or error details
 */
export function validateManifoldFormat(mesh: ManifoldCompatibleMesh): Result<void, string> {
  const requiredFields = [
    'numProp', 'triVerts', 'vertProperties', 'mergeFromVert', 'mergeToVert',
    'runIndex', 'runOriginalID', 'faceID', 'halfedgeTangent', 'runTransform'
  ];

  for (const field of requiredFields) {
    if (!(field in mesh)) {
      return { success: false, error: `Missing required field: ${field}` };
    }
  }

  if (mesh.triVerts.length % 3 !== 0) {
    return { success: false, error: 'triVerts length must be multiple of 3' };
  }

  if (mesh.vertProperties.length % mesh.numProp !== 0) {
    return { success: false, error: 'vertProperties length must be multiple of numProp' };
  }

  const numTriangles = mesh.triVerts.length / 3;
  if (mesh.faceID.length !== numTriangles) {
    return { success: false, error: 'faceID length must equal number of triangles' };
  }

  return { success: true, data: undefined };
}
