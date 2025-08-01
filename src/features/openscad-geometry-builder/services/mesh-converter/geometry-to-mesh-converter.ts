/**
 * @file geometry-to-mesh-converter.ts
 * @description Geometry to Mesh Converter Service that converts geometry data to BabylonJS meshes.
 * This service centralizes the logic for converting geometry data from primitive generators
 * into BabylonJS meshes using the BabylonMeshBuilderService.
 *
 * @example
 * ```typescript
 * const converter = new GeometryToMeshConverterService();
 *
 * // Convert single geometry to mesh
 * const result = converter.convertGeometryToMesh(sphereGeometry, scene, 'my-sphere');
 * if (result.success) {
 *   const mesh = result.data;
 *   console.log(`Created mesh: ${mesh.name}`);
 * }
 *
 * // Convert multiple geometries to meshes
 * const batchResult = converter.convertGeometryBatchToMeshes(geometries, scene);
 * ```
 *
 * @author OpenSCAD Babylon Team
 * @version 1.0.0
 * @since 2025-07-31
 */

import type { AbstractMesh, Scene as BabylonScene } from '@babylonjs/core';
import { BabylonMeshBuilderService } from '@/features/openscad-geometry-builder';
import { createLogger, error, success } from '@/shared';
import type { Result } from '@/shared';
import type {
  Geometry2DData,
  Geometry3DData,
  GeometryData,
} from '../../geometry-data/types/geometry-data.types';

const logger = createLogger('GeometryToMeshConverterService');

/**
 * Mesh conversion error types
 */
export interface MeshConversionError {
  readonly type: 'UNSUPPORTED_GEOMETRY_TYPE' | 'MESH_CREATION_ERROR' | 'BATCH_CONVERSION_ERROR';
  readonly message: string;
  readonly details?: Record<string, unknown>;
}

/**
 * Mesh conversion result types
 */
export type MeshConversionResult = Result<AbstractMesh, MeshConversionError>;
export type BatchMeshConversionResult = Result<AbstractMesh[], MeshConversionError>;

/**
 * Geometry to Mesh Converter Service
 *
 * Centralizes the conversion of geometry data to BabylonJS meshes using
 * the BabylonMeshBuilderService. Follows SRP by handling only geometry-to-mesh
 * conversion concerns.
 */
export class GeometryToMeshConverterService {
  private readonly meshBuilder: BabylonMeshBuilderService;

  constructor() {
    this.meshBuilder = new BabylonMeshBuilderService();
  }

  /**
   * Convert a single geometry data to BabylonJS mesh
   *
   * @param geometry - The geometry data to convert
   * @param scene - BabylonJS scene to add the mesh to
   * @param name - Optional name for the mesh (auto-generated if not provided)
   * @returns Result containing the created mesh or conversion error
   */
  convertGeometryToMesh(
    geometry: GeometryData,
    scene: BabylonScene,
    name?: string
  ): MeshConversionResult {
    try {
      logger.debug(`[CONVERT_MESH] Converting ${geometry.metadata.primitiveType} geometry to mesh`);

      // Determine if this is 2D or 3D geometry based on primitive type
      const is2D = this.is2DGeometry(geometry);

      if (is2D) {
        return this.convert2DGeometryToMesh(geometry as Geometry2DData, scene, name);
      } else {
        return this.convert3DGeometryToMesh(geometry as Geometry3DData, scene, name);
      }
    } catch (err) {
      return error({
        type: 'MESH_CREATION_ERROR',
        message: `Failed to convert geometry to mesh: ${err instanceof Error ? err.message : String(err)}`,
        details: {
          primitiveType: geometry.metadata.primitiveType,
          vertexCount: geometry.vertices.length,
        },
      });
    }
  }

  /**
   * Convert multiple geometry data to BabylonJS meshes
   *
   * @param geometries - Array of geometry data to convert
   * @param scene - BabylonJS scene to add the meshes to
   * @param namePrefix - Optional prefix for mesh names
   * @returns Result containing array of created meshes or conversion error
   */
  convertGeometryBatchToMeshes(
    geometries: GeometryData[],
    scene: BabylonScene,
    namePrefix?: string
  ): BatchMeshConversionResult {
    try {
      logger.debug(`[CONVERT_BATCH] Converting ${geometries.length} geometries to meshes`);

      const meshes: AbstractMesh[] = [];

      for (let i = 0; i < geometries.length; i++) {
        const geometry = geometries[i];
        const meshName = namePrefix ? `${namePrefix}-${i}` : undefined;

        const result = this.convertGeometryToMesh(geometry, scene, meshName);
        if (!result.success) {
          return error({
            type: 'BATCH_CONVERSION_ERROR',
            message: `Batch mesh conversion failed at geometry ${i} (${geometry.metadata.primitiveType}): ${result.error.message}`,
            details: {
              failedGeometryIndex: i,
              failedGeometryType: geometry.metadata.primitiveType,
              originalError: result.error,
              processedCount: meshes.length,
              totalCount: geometries.length,
            },
          });
        }
        meshes.push(result.data);
      }

      logger.debug(`[CONVERT_BATCH] Successfully converted ${meshes.length} geometries to meshes`);
      return success(meshes);
    } catch (err) {
      return error({
        type: 'BATCH_CONVERSION_ERROR',
        message: `Batch mesh conversion failed: ${err instanceof Error ? err.message : String(err)}`,
        details: { geometryCount: geometries.length },
      });
    }
  }

  /**
   * Convert 2D geometry data to BabylonJS mesh using polygon mesh creation
   */
  private convert2DGeometryToMesh(
    geometry: Geometry2DData,
    scene: BabylonScene,
    name?: string
  ): MeshConversionResult {
    try {
      const result = this.meshBuilder.createPolygonMesh(geometry, scene, name);
      if (!result.success) {
        return error({
          type: 'MESH_CREATION_ERROR',
          message: `2D mesh creation failed: ${result.error.message}`,
          details: {
            primitiveType: geometry.metadata.primitiveType,
            vertexCount: geometry.vertices.length,
            originalError: result.error,
          },
        });
      }

      return success(result.data);
    } catch (err) {
      return error({
        type: 'MESH_CREATION_ERROR',
        message: `2D mesh conversion failed: ${err instanceof Error ? err.message : String(err)}`,
        details: { primitiveType: geometry.metadata.primitiveType },
      });
    }
  }

  /**
   * Convert 3D geometry data to BabylonJS mesh using polyhedron mesh creation
   */
  private convert3DGeometryToMesh(
    geometry: Geometry3DData,
    scene: BabylonScene,
    name?: string
  ): MeshConversionResult {
    try {
      const result = this.meshBuilder.createPolyhedronMesh(geometry, scene, name);
      if (!result.success) {
        return error({
          type: 'MESH_CREATION_ERROR',
          message: `3D mesh creation failed: ${result.error.message}`,
          details: {
            primitiveType: geometry.metadata.primitiveType,
            vertexCount: geometry.vertices.length,
            faceCount: geometry.faces.length,
            originalError: result.error,
          },
        });
      }

      return success(result.data);
    } catch (err) {
      return error({
        type: 'MESH_CREATION_ERROR',
        message: `3D mesh conversion failed: ${err instanceof Error ? err.message : String(err)}`,
        details: { primitiveType: geometry.metadata.primitiveType },
      });
    }
  }

  /**
   * Determine if geometry is 2D based on primitive type
   */
  private is2DGeometry(geometry: GeometryData): boolean {
    const primitiveType = geometry.metadata.primitiveType;

    // 2D primitive types
    const twoDTypes = ['2d-circle', '2d-square', '2d-polygon', '2d-text', '2d-import'];

    return twoDTypes.includes(primitiveType);
  }

  /**
   * Get mesh conversion statistics for debugging
   */
  getMeshConversionStatistics(meshes: AbstractMesh[]): {
    totalMeshes: number;
    totalVertices: number;
    totalIndices: number;
    meshTypes: Record<string, number>;
    averageVerticesPerMesh: number;
    averageIndicesPerMesh: number;
  } {
    const stats = {
      totalMeshes: meshes.length,
      totalVertices: 0,
      totalIndices: 0,
      meshTypes: {} as Record<string, number>,
      averageVerticesPerMesh: 0,
      averageIndicesPerMesh: 0,
    };

    for (const mesh of meshes) {
      stats.totalVertices += mesh.getTotalVertices();
      stats.totalIndices += mesh.getTotalIndices();

      // Count mesh types based on name patterns
      const meshType = this.extractMeshTypeFromName(mesh.name);
      stats.meshTypes[meshType] = (stats.meshTypes[meshType] || 0) + 1;
    }

    if (meshes.length > 0) {
      stats.averageVerticesPerMesh = stats.totalVertices / meshes.length;
      stats.averageIndicesPerMesh = stats.totalIndices / meshes.length;
    }

    return stats;
  }

  /**
   * Extract mesh type from mesh name for statistics
   */
  private extractMeshTypeFromName(name: string): string {
    // Extract primitive type from generated names like "openscad-3d-sphere-123456-1"
    const match = name.match(/openscad-(.+?)-\d+-\d+$/);
    if (match) {
      return match[1];
    }

    // For custom names, try to extract type from common patterns
    if (name.includes('sphere')) return '3d-sphere';
    if (name.includes('cube')) return '3d-cube';
    if (name.includes('cylinder')) return '3d-cylinder';
    if (name.includes('circle')) return '2d-circle';
    if (name.includes('square')) return '2d-square';
    if (name.includes('polygon')) return '2d-polygon';

    return 'unknown';
  }
}
