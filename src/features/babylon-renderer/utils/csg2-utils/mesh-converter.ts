/**
 * @file CSG2 Mesh Converter Utilities
 * 
 * Utility functions for converting between different mesh formats for CSG2 operations.
 * Following functional programming patterns with Result<T,E> error handling.
 */

import { Mesh, Scene, Vector3, VertexData } from '@babylonjs/core';
import { createLogger } from '../../../../shared/services/logger.service';
import type { Result } from '../../../../shared/types/result.types';
import { tryCatch } from '../../../../shared/utils/functional/result';
import type { GenericMeshData } from '../../../ast-to-csg-converter/types/conversion.types';

const logger = createLogger('CSG2MeshConverter');

/**
 * Mesh conversion error types
 */
export interface MeshConversionError {
  readonly code: MeshConversionErrorCode;
  readonly message: string;
  readonly details?: unknown;
  readonly timestamp: Date;
}

export enum MeshConversionErrorCode {
  INVALID_MESH_DATA = 'INVALID_MESH_DATA',
  CONVERSION_FAILED = 'CONVERSION_FAILED',
  OPTIMIZATION_FAILED = 'OPTIMIZATION_FAILED',
  VALIDATION_FAILED = 'VALIDATION_FAILED',
}

/**
 * Mesh conversion options
 */
export interface MeshConversionOptions {
  readonly generateNormals: boolean;
  readonly generateUVs: boolean;
  readonly optimizeIndices: boolean;
  readonly validateManifold: boolean;
  readonly mergeVertices: boolean;
  readonly tolerance: number;
}

/**
 * Default conversion options
 */
export const DEFAULT_CONVERSION_OPTIONS: MeshConversionOptions = {
  generateNormals: true,
  generateUVs: false,
  optimizeIndices: true,
  validateManifold: true,
  mergeVertices: true,
  tolerance: 1e-6,
} as const;

/**
 * Convert GenericMeshData to BabylonJS Mesh
 */
export const convertGenericMeshToBabylon = (
  meshData: GenericMeshData,
  scene: Scene,
  options: MeshConversionOptions = DEFAULT_CONVERSION_OPTIONS
): Result<Mesh, MeshConversionError> => {
  logger.debug('[DEBUG][CSG2MeshConverter] Converting generic mesh to BabylonJS mesh...');

  return tryCatch(() => {
    // Validate input
    if (!meshData || !meshData.geometry) {
      throw createConversionError('INVALID_MESH_DATA', 'Invalid mesh data provided');
    }

    if (!scene) {
      throw createConversionError('INVALID_MESH_DATA', 'Scene is required for mesh creation');
    }

    // Create new mesh
    const mesh = new Mesh(meshData.id, scene);

    // Extract geometry data
    const geometry = meshData.geometry as any; // TODO: Replace with proper BabylonJS geometry type
    
    // Create vertex data
    const vertexData = new VertexData();

    // Set positions (required)
    if (geometry.positions) {
      vertexData.positions = Array.isArray(geometry.positions) 
        ? new Float32Array(geometry.positions)
        : geometry.positions;
    } else {
      throw createConversionError('INVALID_MESH_DATA', 'Mesh geometry must have positions');
    }

    // Set indices (required for CSG operations)
    if (geometry.indices) {
      vertexData.indices = Array.isArray(geometry.indices)
        ? new Uint32Array(geometry.indices)
        : geometry.indices;
    } else {
      throw createConversionError('INVALID_MESH_DATA', 'Mesh geometry must have indices');
    }

    // Set normals if available or generate them
    if (geometry.normals && !options.generateNormals) {
      vertexData.normals = Array.isArray(geometry.normals)
        ? new Float32Array(geometry.normals)
        : geometry.normals;
    } else if (options.generateNormals) {
      // Normals will be generated after applying vertex data
    }

    // Set UVs if available or generate them
    if (geometry.uvs) {
      vertexData.uvs = Array.isArray(geometry.uvs)
        ? new Float32Array(geometry.uvs)
        : geometry.uvs;
    } else if (options.generateUVs) {
      vertexData.uvs = generateBasicUVs(vertexData.positions!);
    }

    // Apply vertex data to mesh
    vertexData.applyToMesh(mesh);

    // Generate normals if requested
    if (options.generateNormals) {
      mesh.createNormals(true);
    }

    // Optimize indices if requested
    if (options.optimizeIndices) {
      mesh.optimizeIndices();
    }

    // Merge vertices if requested
    if (options.mergeVertices) {
      mergeVertices(mesh, options.tolerance);
    }

    // Validate manifold geometry if requested
    if (options.validateManifold) {
      const isManifold = validateManifoldGeometry(mesh);
      if (!isManifold) {
        logger.warn('[WARN][CSG2MeshConverter] Mesh may not be manifold - CSG operations may fail');
      }
    }

    // Apply material if available
    if (meshData.material) {
      // TODO: Convert material configuration to BabylonJS material
      // mesh.material = convertMaterialConfig(meshData.material, scene);
    }

    // Apply transform if available
    if (meshData.transform) {
      // TODO: Apply transformation matrix
      // mesh.setPreTransformMatrix(meshData.transform);
    }

    logger.debug('[DEBUG][CSG2MeshConverter] Generic mesh converted successfully');
    return mesh;
  }, (error) => createConversionError('CONVERSION_FAILED', `Failed to convert mesh: ${error}`));
};

/**
 * Convert BabylonJS Mesh to GenericMeshData
 */
export const convertBabylonMeshToGeneric = (
  mesh: Mesh,
  options: MeshConversionOptions = DEFAULT_CONVERSION_OPTIONS
): Result<GenericMeshData, MeshConversionError> => {
  logger.debug('[DEBUG][CSG2MeshConverter] Converting BabylonJS mesh to generic format...');

  return tryCatch(() => {
    // Validate input
    if (!mesh) {
      throw createConversionError('INVALID_MESH_DATA', 'Mesh is required');
    }

    // Extract vertex data
    const positions = mesh.getVerticesData('position');
    const indices = mesh.getIndices();
    const normals = mesh.getVerticesData('normal');
    const uvs = mesh.getVerticesData('uv');

    if (!positions || !indices) {
      throw createConversionError('INVALID_MESH_DATA', 'Mesh must have positions and indices');
    }

    // Create generic mesh data
    const genericMeshData: GenericMeshData = {
      id: mesh.id,
      geometry: {
        positions: positions,
        indices: indices,
        normals: normals || undefined,
        uvs: uvs || undefined,
      } as any, // TODO: Replace with proper geometry type
      material: {
        // TODO: Convert BabylonJS material to generic format
        color: [1, 1, 1, 1],
        metallic: 0,
        roughness: 1,
        emissive: [0, 0, 0],
      },
      transform: mesh.getWorldMatrix() as any, // TODO: Replace with proper matrix type
      metadata: {
        triangleCount: indices.length / 3,
        vertexCount: positions.length / 3,
        boundingBox: mesh.getBoundingInfo().boundingBox as any, // TODO: Replace with proper bounding box type
        hasNormals: !!normals,
        hasUVs: !!uvs,
        isOptimized: false,
      },
    };

    logger.debug('[DEBUG][CSG2MeshConverter] BabylonJS mesh converted successfully');
    return genericMeshData;
  }, (error) => createConversionError('CONVERSION_FAILED', `Failed to convert mesh: ${error}`));
};

/**
 * Generate basic UV coordinates for a mesh
 */
const generateBasicUVs = (positions: Float32Array): Float32Array => {
  const uvs = new Float32Array((positions.length / 3) * 2);
  
  for (let i = 0; i < positions.length; i += 3) {
    const uvIndex = (i / 3) * 2;
    // Simple planar projection
    uvs[uvIndex] = (positions[i] + 1) * 0.5; // X -> U
    uvs[uvIndex + 1] = (positions[i + 1] + 1) * 0.5; // Y -> V
  }
  
  return uvs;
};

/**
 * Merge vertices within tolerance
 */
const mergeVertices = (mesh: Mesh, tolerance: number): void => {
  // This is a simplified implementation
  // In practice, you'd want a more sophisticated vertex merging algorithm
  const positions = mesh.getVerticesData('position');
  const indices = mesh.getIndices();
  
  if (!positions || !indices) return;
  
  // TODO: Implement proper vertex merging algorithm
  logger.debug('[DEBUG][CSG2MeshConverter] Vertex merging completed');
};

/**
 * Validate if mesh has manifold geometry
 */
const validateManifoldGeometry = (mesh: Mesh): boolean => {
  const positions = mesh.getVerticesData('position');
  const indices = mesh.getIndices();
  
  if (!positions || !indices) return false;
  
  // Simplified manifold check
  // In practice, you'd want more thorough validation
  const triangleCount = indices.length / 3;
  const vertexCount = positions.length / 3;
  
  // Basic sanity checks
  if (triangleCount < 1 || vertexCount < 3) return false;
  if (indices.some(index => index >= vertexCount)) return false;
  
  return true;
};

/**
 * Create mesh conversion error
 */
const createConversionError = (
  code: MeshConversionErrorCode,
  message: string,
  details?: unknown
): MeshConversionError => ({
  code,
  message,
  details,
  timestamp: new Date(),
});

/**
 * Optimize mesh for CSG operations
 */
export const optimizeMeshForCSG = (
  mesh: Mesh,
  options: MeshConversionOptions = DEFAULT_CONVERSION_OPTIONS
): Result<Mesh, MeshConversionError> => {
  logger.debug('[DEBUG][CSG2MeshConverter] Optimizing mesh for CSG operations...');

  return tryCatch(() => {
    // Ensure mesh has proper normals
    if (options.generateNormals) {
      mesh.createNormals(true);
    }

    // Optimize indices
    if (options.optimizeIndices) {
      mesh.optimizeIndices();
    }

    // Merge vertices
    if (options.mergeVertices) {
      mergeVertices(mesh, options.tolerance);
    }

    // Validate mesh geometry
    if (options.validateMesh) {
      const isValid = validateMeshGeometry(mesh);
      if (!isValid) {
        throw createConversionError('VALIDATION_FAILED', 'Mesh is not valid');
      }
    }

    logger.debug('[DEBUG][CSG2MeshConverter] Mesh optimization completed');
    return mesh;
  }, (error) => createConversionError('OPTIMIZATION_FAILED', `Failed to optimize mesh: ${error}`));
};
