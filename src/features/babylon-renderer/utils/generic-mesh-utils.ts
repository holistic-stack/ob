/**
 * @file Generic Mesh Utilities
 *
 * Utility functions for working with GenericMeshData, creating materials,
 * and managing metadata. Provides helper functions for common operations.
 */

import { BoundingBox, Matrix, Vector3 } from '@babylonjs/core';
import { createLogger } from '../../../shared/services/logger.service';
import type { Result } from '../../../shared/types/result.types';
import { tryCatch } from '../../../shared/utils/functional/result';
import type { SourceLocation } from '../../openscad-parser/ast/ast-types';
import type {
  GenericGeometry,
  GenericMaterialConfig,
  GenericMeshCollection,
  GenericMeshData,
  GenericMeshMetadata,
  MaterialConfigBuilder,
  MeshMetadataBuilder,
} from '../types/generic-mesh-data.types';
import { DEFAULT_MESH_METADATA, MATERIAL_PRESETS } from '../types/generic-mesh-data.types';

const logger = createLogger('GenericMeshUtils');

/**
 * Error types for mesh utilities
 */
export interface MeshUtilsError {
  readonly code: 'INVALID_GEOMETRY' | 'INVALID_MATERIAL' | 'INVALID_METADATA' | 'CREATION_FAILED';
  readonly message: string;
  readonly details?: Record<string, unknown>;
}

/**
 * Create a GenericMeshData object with validation
 */
export const createGenericMeshData = (
  id: string,
  geometry: GenericGeometry,
  material: GenericMaterialConfig,
  transform: Matrix = Matrix.Identity(),
  metadata: MeshMetadataBuilder
): Result<GenericMeshData, MeshUtilsError> => {
  logger.debug(`[CREATE] Creating generic mesh data for ${id}`);

  return tryCatch(
    () => {
      // Validate inputs
      if (!id || id.trim() === '') {
        throw { code: 'CREATION_FAILED', message: 'Mesh ID cannot be empty' };
      }

      if (!geometry || !geometry.positions || !geometry.indices) {
        throw { code: 'INVALID_GEOMETRY', message: 'Geometry must have positions and indices' };
      }

      if (!material || !material.diffuseColor) {
        throw { code: 'INVALID_MATERIAL', message: 'Material must have diffuseColor' };
      }

      // Create complete metadata
      const completeMetadata: GenericMeshMetadata = {
        ...DEFAULT_MESH_METADATA,
        ...metadata,
        meshId: id,
        lastModified: new Date(),
        lastAccessed: new Date(),
      };

      const meshData: GenericMeshData = {
        id,
        geometry,
        material,
        transform,
        metadata: completeMetadata,
      };

      logger.debug(`[CREATE] Successfully created mesh data for ${id}`);
      return meshData;
    },
    (error) => error as MeshUtilsError
  );
};

/**
 * Create a material configuration from a builder
 */
export const createMaterialConfig = (
  builder: MaterialConfigBuilder
): Result<GenericMaterialConfig, MeshUtilsError> => {
  return tryCatch(
    () => {
      if (!builder.diffuseColor || builder.diffuseColor.length !== 3) {
        throw { code: 'INVALID_MATERIAL', message: 'diffuseColor must be an array of 3 numbers' };
      }

      const material: GenericMaterialConfig = {
        ...MATERIAL_PRESETS.DEFAULT,
        ...builder,
      };

      return material;
    },
    (error) => error as MeshUtilsError
  );
};

/**
 * Create a bounding box from geometry
 */
export const createBoundingBoxFromGeometry = (geometry: GenericGeometry): BoundingBox => {
  const positions = geometry.positions;
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let minZ = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  let maxZ = Number.NEGATIVE_INFINITY;

  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i]!;
    const y = positions[i + 1]!;
    const z = positions[i + 2]!;

    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    minZ = Math.min(minZ, z);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
    maxZ = Math.max(maxZ, z);
  }

  return new BoundingBox(new Vector3(minX, minY, minZ), new Vector3(maxX, maxY, maxZ));
};

/**
 * Calculate surface area from geometry (approximate)
 */
export const calculateSurfaceArea = (geometry: GenericGeometry): number => {
  const positions = geometry.positions;
  const indices = geometry.indices;
  let totalArea = 0;

  for (let i = 0; i < indices.length; i += 3) {
    const i1 = indices[i]! * 3;
    const i2 = indices[i + 1]! * 3;
    const i3 = indices[i + 2]! * 3;

    const v1 = new Vector3(positions[i1]!, positions[i1 + 1]!, positions[i1 + 2]!);
    const v2 = new Vector3(positions[i2]!, positions[i2 + 1]!, positions[i2 + 2]!);
    const v3 = new Vector3(positions[i3]!, positions[i3 + 1]!, positions[i3 + 2]!);

    // Calculate triangle area using cross product
    const edge1 = v2.subtract(v1);
    const edge2 = v3.subtract(v1);
    const cross = Vector3.Cross(edge1, edge2);
    const area = cross.length() * 0.5;

    totalArea += area;
  }

  return totalArea;
};

/**
 * Calculate volume from geometry (approximate, assumes closed mesh)
 */
export const calculateVolume = (geometry: GenericGeometry): number => {
  const positions = geometry.positions;
  const indices = geometry.indices;
  let volume = 0;

  for (let i = 0; i < indices.length; i += 3) {
    const i1 = indices[i]! * 3;
    const i2 = indices[i + 1]! * 3;
    const i3 = indices[i + 2]! * 3;

    const v1 = new Vector3(positions[i1]!, positions[i1 + 1]!, positions[i1 + 2]!);
    const v2 = new Vector3(positions[i2]!, positions[i2 + 1]!, positions[i2 + 2]!);
    const v3 = new Vector3(positions[i3]!, positions[i3 + 1]!, positions[i3 + 2]!);

    // Calculate signed volume of tetrahedron formed by origin and triangle
    const signedVolume = Vector3.Dot(v1, Vector3.Cross(v2, v3)) / 6.0;
    volume += signedVolume;
  }

  return Math.abs(volume);
};

/**
 * Create a mesh collection from multiple meshes
 */
export const createMeshCollection = (
  id: string,
  meshes: readonly GenericMeshData[],
  collectionType:
    | 'csg_result'
    | 'transformation_group'
    | 'extrusion_result'
    | 'control_flow_result',
  sourceLocation?: SourceLocation
): Result<GenericMeshCollection, MeshUtilsError> => {
  return tryCatch(
    () => {
      if (!id || id.trim() === '') {
        throw { code: 'CREATION_FAILED', message: 'Collection ID cannot be empty' };
      }

      if (!meshes || meshes.length === 0) {
        throw { code: 'CREATION_FAILED', message: 'Collection must contain at least one mesh' };
      }

      // Calculate collection metrics
      const totalVertices = meshes.reduce((sum, mesh) => sum + mesh.metadata.vertexCount, 0);
      const totalTriangles = meshes.reduce((sum, mesh) => sum + mesh.metadata.triangleCount, 0);
      const generationTime = meshes.reduce((sum, mesh) => sum + mesh.metadata.generationTime, 0);

      // Calculate combined bounding box
      let minX = Number.POSITIVE_INFINITY;
      let minY = Number.POSITIVE_INFINITY;
      let minZ = Number.POSITIVE_INFINITY;
      let maxX = Number.NEGATIVE_INFINITY;
      let maxY = Number.NEGATIVE_INFINITY;
      let maxZ = Number.NEGATIVE_INFINITY;

      for (const mesh of meshes) {
        const bbox = mesh.metadata.boundingBox;
        minX = Math.min(minX, bbox.minimum.x);
        minY = Math.min(minY, bbox.minimum.y);
        minZ = Math.min(minZ, bbox.minimum.z);
        maxX = Math.max(maxX, bbox.maximum.x);
        maxY = Math.max(maxY, bbox.maximum.y);
        maxZ = Math.max(maxZ, bbox.maximum.z);
      }

      const boundingBox = new BoundingBox(
        new Vector3(minX, minY, minZ),
        new Vector3(maxX, maxY, maxZ)
      );

      const collection: GenericMeshCollection = {
        id,
        meshes,
        metadata: {
          collectionType,
          totalVertices,
          totalTriangles,
          boundingBox,
          generationTime,
          ...(sourceLocation && { sourceLocation }),
        },
      };

      logger.debug(`[COLLECTION] Created mesh collection ${id} with ${meshes.length} meshes`);
      return collection;
    },
    (error) => error as MeshUtilsError
  );
};

/**
 * Apply OpenSCAD modifier to material configuration
 */
export const applyModifierToMaterial = (
  baseMaterial: GenericMaterialConfig,
  modifier: 'disable' | 'show_only' | 'debug' | 'background'
): GenericMaterialConfig => {
  switch (modifier) {
    case 'disable':
      return { ...baseMaterial, ...MATERIAL_PRESETS.DISABLED };
    case 'show_only':
      return { ...baseMaterial, ...MATERIAL_PRESETS.SHOW_ONLY };
    case 'debug':
      return { ...baseMaterial, ...MATERIAL_PRESETS.DEBUG };
    case 'background':
      return { ...baseMaterial, ...MATERIAL_PRESETS.BACKGROUND };
    default:
      return baseMaterial;
  }
};

/**
 * Merge multiple mesh collections into one
 */
export const mergeMeshCollections = (
  id: string,
  collections: readonly GenericMeshCollection[],
  collectionType: 'csg_result' | 'transformation_group' | 'extrusion_result' | 'control_flow_result'
): Result<GenericMeshCollection, MeshUtilsError> => {
  return tryCatch(
    () => {
      if (!collections || collections.length === 0) {
        throw { code: 'CREATION_FAILED', message: 'Must provide at least one collection to merge' };
      }

      // Flatten all meshes from all collections
      const allMeshes = collections.flatMap((collection) => collection.meshes);

      const result = createMeshCollection(id, allMeshes, collectionType);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },
    (error) => error as MeshUtilsError
  );
};

/**
 * Validate GenericMeshData integrity
 */
export const validateMeshData = (meshData: GenericMeshData): Result<boolean, MeshUtilsError> => {
  return tryCatch(
    () => {
      // Check basic structure
      if (!meshData.id || !meshData.geometry || !meshData.material || !meshData.metadata) {
        throw { code: 'INVALID_METADATA', message: 'Missing required mesh data properties' };
      }

      // Check geometry integrity
      const { geometry } = meshData;
      if (!geometry.positions || !geometry.indices) {
        throw { code: 'INVALID_GEOMETRY', message: 'Geometry missing positions or indices' };
      }

      if (geometry.positions.length % 3 !== 0) {
        throw {
          code: 'INVALID_GEOMETRY',
          message: 'Positions array length must be divisible by 3',
        };
      }

      if (geometry.indices.length % 3 !== 0) {
        throw { code: 'INVALID_GEOMETRY', message: 'Indices array length must be divisible by 3' };
      }

      // Check material integrity
      const { material } = meshData;
      if (!material.diffuseColor || material.diffuseColor.length !== 3) {
        throw { code: 'INVALID_MATERIAL', message: 'Material must have valid diffuseColor' };
      }

      if (material.alpha < 0 || material.alpha > 1) {
        throw { code: 'INVALID_MATERIAL', message: 'Material alpha must be between 0 and 1' };
      }

      logger.debug(`[VALIDATE] Mesh data ${meshData.id} is valid`);
      return true;
    },
    (error) => error as MeshUtilsError
  );
};
