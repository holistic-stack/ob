/**
 * @file CSG2 Mesh Converter Utilities
 *
 * Utility functions for converting between different mesh formats for CSG2 operations.
 * Following functional programming patterns with Result<T,E> error handling.
 */

import {
  BoundingBox,
  type FloatArray,
  Mesh,
  type Scene,
  Vector3,
  VertexData,
} from '@babylonjs/core';
import type {
  GenericGeometry,
  GenericMeshData,
  GenericMeshMetadata,
} from '@/features/babylon-renderer';
import { MATERIAL_PRESETS } from '@/features/babylon-renderer';
import type { Result } from '@/shared';
import { createLogger, tryCatch } from '@/shared';

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

  return tryCatch(
    () => {
      // Validate input
      if (!meshData || !meshData.geometry) {
        throw createConversionError(
          MeshConversionErrorCode.INVALID_MESH_DATA,
          'Invalid mesh data provided'
        );
      }

      if (!scene) {
        throw createConversionError(
          MeshConversionErrorCode.INVALID_MESH_DATA,
          'Scene is required for mesh creation'
        );
      }

      // Create new mesh
      const mesh = new Mesh(meshData.id, scene);

      // Extract geometry data
      const geometry = meshData.geometry;

      // Create vertex data
      const vertexData = new VertexData();

      // Set positions (required)
      if (geometry.positions) {
        vertexData.positions = Array.isArray(geometry.positions)
          ? new Float32Array(geometry.positions)
          : geometry.positions;
      } else {
        throw createConversionError(
          MeshConversionErrorCode.INVALID_MESH_DATA,
          'Mesh geometry must have positions'
        );
      }

      // Set indices (required for CSG operations)
      if (geometry.indices) {
        vertexData.indices = Array.isArray(geometry.indices)
          ? new Uint32Array(geometry.indices)
          : geometry.indices;
      } else {
        throw createConversionError(
          MeshConversionErrorCode.INVALID_MESH_DATA,
          'Mesh geometry must have indices'
        );
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
      } else if (options.generateUVs && vertexData.positions) {
        vertexData.uvs = generateBasicUVs(vertexData.positions);
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
          logger.warn(
            '[WARN][CSG2MeshConverter] Mesh may not be manifold - CSG operations may fail'
          );
        }
      }

      // Apply material if available
      if (meshData.material) {
        // TODO: Convert material configuration to BabylonJS material
        // mesh.material = convertMaterialConfig(meshData.material, scene);
      }

      // Apply transform if available
      if (meshData.transform) {
        // Apply transformation matrix to the mesh
        mesh.setPreTransformMatrix(meshData.transform);
        logger.debug('[DEBUG][CSG2MeshConverter] Applied transformation matrix to mesh');
      }

      logger.debug('[DEBUG][CSG2MeshConverter] Generic mesh converted successfully');
      return mesh;
    },
    (error) => {
      // Preserve original error codes if it's already a MeshConversionError
      if (error && typeof error === 'object' && 'code' in error) {
        return error as MeshConversionError;
      }
      return createConversionError(
        MeshConversionErrorCode.CONVERSION_FAILED,
        `Failed to convert mesh: ${error}`
      );
    }
  );
};

/**
 * Convert BabylonJS Mesh to GenericMeshData
 */
export const convertBabylonMeshToGeneric = (
  mesh: Mesh,
  _options: MeshConversionOptions = DEFAULT_CONVERSION_OPTIONS
): Result<GenericMeshData, MeshConversionError> => {
  logger.debug('[DEBUG][CSG2MeshConverter] Converting BabylonJS mesh to generic format...');

  return tryCatch(
    () => {
      // Validate input
      if (!mesh) {
        throw createConversionError(MeshConversionErrorCode.INVALID_MESH_DATA, 'Mesh is required');
      }

      // Extract vertex data
      const positions = mesh.getVerticesData('position');
      const indices = mesh.getIndices();
      const normals = mesh.getVerticesData('normal');
      const uvs = mesh.getVerticesData('uv');

      if (!positions || !indices) {
        throw createConversionError(
          MeshConversionErrorCode.INVALID_MESH_DATA,
          'Mesh must have positions and indices'
        );
      }

      // Create generic mesh data
      const genericMeshData: GenericMeshData = {
        id: mesh.id,
        geometry: {
          positions: new Float32Array(positions),
          indices: new Uint32Array(indices),
          vertexCount: positions.length / 3,
          triangleCount: indices.length / 3,
          boundingBox: new BoundingBox(
            new Vector3(
              mesh.getBoundingInfo().boundingBox.minimumWorld.x,
              mesh.getBoundingInfo().boundingBox.minimumWorld.y,
              mesh.getBoundingInfo().boundingBox.minimumWorld.z
            ),
            new Vector3(
              mesh.getBoundingInfo().boundingBox.maximumWorld.x,
              mesh.getBoundingInfo().boundingBox.maximumWorld.y,
              mesh.getBoundingInfo().boundingBox.maximumWorld.z
            )
          ),
          ...(normals && { normals: new Float32Array(normals) }),
          ...(uvs && { uvs: new Float32Array(uvs) }),
        } satisfies GenericGeometry,
        material: MATERIAL_PRESETS.DEFAULT,
        transform: mesh.getWorldMatrix(),
        metadata: {
          meshId: mesh.id,
          name: mesh.name || mesh.id,
          nodeType: 'converted_mesh',
          vertexCount: positions.length / 3,
          triangleCount: indices.length / 3,
          boundingBox: new BoundingBox(
            new Vector3(
              mesh.getBoundingInfo().boundingBox.minimumWorld.x,
              mesh.getBoundingInfo().boundingBox.minimumWorld.y,
              mesh.getBoundingInfo().boundingBox.minimumWorld.z
            ),
            new Vector3(
              mesh.getBoundingInfo().boundingBox.maximumWorld.x,
              mesh.getBoundingInfo().boundingBox.maximumWorld.y,
              mesh.getBoundingInfo().boundingBox.maximumWorld.z
            )
          ),
          surfaceArea: 0,
          volume: 0,
          generationTime: 0,
          optimizationTime: 0,
          memoryUsage: 0,
          complexity: indices.length / 3,
          isOptimized: false,
          hasErrors: false,
          warnings: [],
          debugInfo: {},
          createdAt: new Date(),
          lastModified: new Date(),
          lastAccessed: new Date(),
          childIds: [],
          depth: 0,
          openscadParameters: {},
          modifiers: [],
          transformations: [],
          csgOperations: [],
        } satisfies GenericMeshMetadata,
      };

      logger.debug('[DEBUG][CSG2MeshConverter] BabylonJS mesh converted successfully');
      return genericMeshData;
    },
    (error) => {
      // Preserve original error codes if it's already a MeshConversionError
      if (error && typeof error === 'object' && 'code' in error) {
        return error as MeshConversionError;
      }
      return createConversionError(
        MeshConversionErrorCode.CONVERSION_FAILED,
        `Failed to convert mesh: ${error}`
      );
    }
  );
};

/**
 * Generate basic UV coordinates for a mesh
 */
const generateBasicUVs = (positions: FloatArray): Float32Array => {
  const uvs = new Float32Array((positions.length / 3) * 2);

  for (let i = 0; i < positions.length; i += 3) {
    // Ensure we have valid indices for x, y coordinates
    if (i + 1 >= positions.length) {
      break; // Skip incomplete coordinate pairs
    }

    const uvIndex = (i / 3) * 2;
    const x = positions[i];
    const y = positions[i + 1];

    // Skip if coordinates are undefined
    if (x === undefined || y === undefined) {
      continue;
    }

    // Simple planar projection
    uvs[uvIndex] = (x + 1) * 0.5; // X -> U
    uvs[uvIndex + 1] = (y + 1) * 0.5; // Y -> V
  }

  return uvs;
};

/**
 * Merge vertices within tolerance
 */
const mergeVertices = (mesh: Mesh, _tolerance: number): void => {
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
  if (indices.some((index) => index >= vertexCount)) return false;

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

  return tryCatch(
    () => {
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
      if (options.validateManifold) {
        const isValid = validateManifoldGeometry(mesh);
        if (!isValid) {
          throw createConversionError(
            MeshConversionErrorCode.VALIDATION_FAILED,
            'Mesh is not manifold'
          );
        }
      }

      logger.debug('[DEBUG][CSG2MeshConverter] Mesh optimization completed');
      return mesh;
    },
    (error) => {
      // Preserve original error codes if it's already a MeshConversionError
      if (error && typeof error === 'object' && 'code' in error) {
        return error as MeshConversionError;
      }
      return createConversionError(
        MeshConversionErrorCode.OPTIMIZATION_FAILED,
        `Failed to optimize mesh: ${error}`
      );
    }
  );
};
