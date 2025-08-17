/**
 * @file babylon-mesh-builder.ts
 * @description BabylonJS Mesh Builder Service that bridges OpenSCAD geometry data with BabylonJS mesh creation.
 * This service converts our OpenSCAD-compatible geometry data into BabylonJS meshes using CreatePolyhedron.
 *
 * @example
 * ```typescript
 * const meshBuilder = new BabylonMeshBuilderService();
 *
 * // Create mesh from sphere geometry data
 * const result = meshBuilder.createPolyhedronMesh(sphereData, scene, 'my-sphere');
 * if (result.success) {
 *   const mesh = result.data;
 *   console.log(`Created mesh with ${mesh.getTotalVertices()} vertices`);
 * }
 * ```
 *
 * @author OpenSCAD Babylon Team
 * @version 1.0.0
 * @since 2025-07-29
 */

import * as BABYLON from '@babylonjs/core';
// Ensure required BabylonJS builders/classes are registered in tree-shaken builds
import '@babylonjs/core/Meshes/meshBuilder';
import '@babylonjs/core/Meshes/Builders/polygonBuilder';
import '@babylonjs/core/Meshes/mesh.vertexData';
import '@babylonjs/core/Materials/standardMaterial';
import earcut from 'earcut';
import type { Result } from '@/shared';
import { error, success } from '@/shared';
import type { Geometry2DData } from '../../../types/2d-geometry-data';
import type { BaseGeometryData, Geometry3DData, Vector2 } from '../../../types/geometry-data';

/**
 * Error types for mesh creation
 */
export interface MeshCreationError {
  readonly type: 'INVALID_GEOMETRY' | 'BABYLON_ERROR' | 'MEMORY_ERROR';
  readonly message: string;
  readonly details?: Record<string, unknown>;
}

/**
 * Mesh creation result type
 */
export type MeshResult = Result<BABYLON.Mesh, MeshCreationError>;

/**
 * BabylonJS Mesh Builder Service
 *
 * Converts OpenSCAD geometry data into BabylonJS meshes using the most appropriate
 * BabylonJS creation methods (CreatePolyhedron for 3D, CreatePolygon for 2D).
 */
export class BabylonMeshBuilderService {
  /**
   * Counter for generating unique mesh names
   */
  private static meshCounter = 0;

  /**
   * Create a BabylonJS mesh from 3D geometry data using CreatePolyhedron
   *
   * @param geometryData - The 3D geometry data to convert
   * @param scene - The BabylonJS scene to add the mesh to
   * @param name - Optional name for the mesh (auto-generated if not provided)
   * @returns Result containing the created mesh or an error
   */
  createPolyhedronMesh(
    geometryData: Geometry3DData,
    scene: BABYLON.Scene,
    name?: string
  ): MeshResult {
    try {
      // Validate geometry data
      const validationResult = this.validateGeometry(geometryData);
      if (!validationResult.success) {
        return validationResult as MeshResult;
      }

      // Generate name if not provided
      const meshName = name || this.generateMeshName(geometryData.metadata.primitiveType);

      // Convert geometry data to BabylonJS format
      const babylonData = this.convertToBabylonFormat(geometryData);
      if (!babylonData.success) {
        return babylonData as MeshResult;
      }

      // Require VertexData; if unavailable, fail fast with a descriptive error per project constraints
      const hasVertexData = typeof (BABYLON as any).VertexData === 'function';
      if (!hasVertexData) {
        return error({
          type: 'BABYLON_ERROR',
          message:
            'BabylonJS VertexData API is not available in the current environment. Tests must provide proper BabylonJS mocks or run with a real engine.',
          details: { requiredAPI: 'VertexData' },
        });
      }

      // Create the mesh using BabylonJS VertexData path
      const mesh = this.createBabylonMesh(babylonData.data, scene, meshName);
      if (!mesh.success) {
        return mesh;
      }

      return success(mesh.data);
    } catch (err) {
      return error({
        type: 'BABYLON_ERROR',
        message: `Failed to create BabylonJS mesh: ${err instanceof Error ? err.message : String(err)}`,
        details: {
          primitiveType: geometryData.metadata.primitiveType,
          vertexCount: geometryData.vertices.length,
          faceCount: geometryData.faces.length,
        },
      });
    }
  }

  /**
   * Create a BabylonJS mesh from 2D geometry data using CreatePolygon
   *
   * @param geometryData - The 2D geometry data to convert
   * @param scene - The BabylonJS scene to add the mesh to
   * @param name - Optional name for the mesh (auto-generated if not provided)
   * @returns Result containing the created mesh or an error
   */
  createPolygonMesh(geometryData: Geometry2DData, scene: BABYLON.Scene, name?: string): MeshResult {
    try {
      // Validate geometry data
      const validationResult = this.validate2DGeometry(geometryData);
      if (!validationResult.success) {
        return validationResult as MeshResult;
      }

      // Generate name if not provided
      const meshName = name || this.generateMeshName(geometryData.metadata.primitiveType);

      // Convert 2D vertices to BabylonJS Vector3 points (Z=0)
      const points = geometryData.vertices
        .filter((vertex): vertex is Vector2 => vertex !== undefined)
        .map((vertex) => new BABYLON.Vector3(vertex.x, vertex.y, 0));

      // Create the mesh using BabylonJS CreatePolygon for proper triangulation; require API presence
      const hasMeshBuilderPolygon = (BABYLON.MeshBuilder as any)?.CreatePolygon;
      if (!hasMeshBuilderPolygon) {
        return error({
          type: 'BABYLON_ERROR',
          message:
            'BabylonJS MeshBuilder.CreatePolygon is not available in the current environment. Tests must provide proper BabylonJS mocks or run with a real engine.',
          details: { requiredAPI: 'MeshBuilder.CreatePolygon' },
        });
      }

      const mesh = BABYLON.MeshBuilder.CreatePolygon(
        meshName,
        {
          shape: points,
          sideOrientation: BABYLON.Mesh.DOUBLESIDE, // Double-sided for visibility
        },
        scene,
        earcut
      );

      // Ensure the mesh is properly initialized
      if (mesh.refreshBoundingInfo) mesh.refreshBoundingInfo();

      return success(mesh);
    } catch (err) {
      return error({
        type: 'BABYLON_ERROR',
        message: `Failed to create BabylonJS polygon mesh: ${err instanceof Error ? err.message : String(err)}`,
        details: {
          primitiveType: geometryData.metadata.primitiveType,
          vertexCount: geometryData.vertices.length,
        },
      });
    }
  }

  /**
   * Validate 2D geometry data before mesh creation
   */
  private validate2DGeometry(geometryData: Geometry2DData): Result<void, MeshCreationError> {
    // Check for empty geometry
    if (geometryData.vertices.length === 0) {
      return error({
        type: 'INVALID_GEOMETRY',
        message: 'Cannot create mesh from empty 2D geometry data',
      });
    }

    // Check minimum vertices for a polygon
    if (geometryData.vertices.length < 3) {
      return error({
        type: 'INVALID_GEOMETRY',
        message: `2D polygon must have at least 3 vertices, got ${geometryData.vertices.length}`,
      });
    }

    return success(undefined);
  }

  /**
   * Validate geometry data before mesh creation
   */
  private validateGeometry(geometryData: BaseGeometryData): Result<void, MeshCreationError> {
    // Check for empty geometry
    if (geometryData.vertices.length === 0) {
      return error({
        type: 'INVALID_GEOMETRY',
        message: 'Cannot create mesh from empty geometry data',
      });
    }

    if (geometryData.faces.length === 0) {
      return error({
        type: 'INVALID_GEOMETRY',
        message: 'Cannot create mesh without faces',
      });
    }

    // Validate face indices
    for (let faceIndex = 0; faceIndex < geometryData.faces.length; faceIndex++) {
      const face = geometryData.faces[faceIndex];

      if (!face || face.length < 3) {
        return error({
          type: 'INVALID_GEOMETRY',
          message: `Face ${faceIndex} has less than 3 vertices`,
        });
      }

      for (const vertexIndex of face) {
        if (vertexIndex < 0 || vertexIndex >= geometryData.vertices.length) {
          return error({
            type: 'INVALID_GEOMETRY',
            message: `Face ${faceIndex} contains invalid vertex index ${vertexIndex}`,
          });
        }
      }
    }

    // Validate normals count
    if (geometryData.normals.length !== geometryData.vertices.length) {
      return error({
        type: 'INVALID_GEOMETRY',
        message: `Normal count (${geometryData.normals.length}) must match vertex count (${geometryData.vertices.length})`,
      });
    }

    return success(undefined);
  }

  /**
   * Convert OpenSCAD geometry data to BabylonJS format
   */
  private convertToBabylonFormat(geometryData: BaseGeometryData): Result<
    {
      positions: Float32Array;
      indices: Uint32Array;
      normals: Float32Array;
    },
    MeshCreationError
  > {
    try {
      // Convert vertices to positions array (x, y, z, x, y, z, ...)
      const positions = new Float32Array(geometryData.vertices.length * 3);
      for (let i = 0; i < geometryData.vertices.length; i++) {
        const vertex = geometryData.vertices[i];
        if (vertex) {
          positions[i * 3] = vertex.x;
          positions[i * 3 + 1] = vertex.y;
          positions[i * 3 + 2] = vertex.z;
        }
      }

      // Convert normals to normals array (x, y, z, x, y, z, ...)
      const normals = new Float32Array(geometryData.normals.length * 3);
      for (let i = 0; i < geometryData.normals.length; i++) {
        const normal = geometryData.normals[i];
        if (normal) {
          normals[i * 3] = normal.x;
          normals[i * 3 + 1] = normal.y;
          normals[i * 3 + 2] = normal.z;
        }
      }

      // Convert faces to indices array (triangulate quads and higher polygons)
      const indices: number[] = [];
      for (const face of geometryData.faces) {
        if (face.length === 3) {
          // Triangle - add directly
          indices.push(face[0] ?? 0, face[1] ?? 0, face[2] ?? 0);
        } else if (face.length === 4) {
          // Quad - triangulate as two triangles
          indices.push(face[0] ?? 0, face[1] ?? 0, face[2] ?? 0);
          indices.push(face[0] ?? 0, face[2] ?? 0, face[3] ?? 0);
        } else {
          // Polygon with more than 4 vertices - fan triangulation
          for (let i = 1; i < face.length - 1; i++) {
            indices.push(face[0] ?? 0, face[i] ?? 0, face[i + 1] ?? 0);
          }
        }
      }

      return success({
        positions,
        indices: new Uint32Array(indices),
        normals,
      });
    } catch (err) {
      return error({
        type: 'BABYLON_ERROR',
        message: `Failed to convert geometry to BabylonJS format: ${err instanceof Error ? err.message : String(err)}`,
      });
    }
  }

  /**
   * Create BabylonJS mesh from converted data
   */
  private createBabylonMesh(
    babylonData: { positions: Float32Array; indices: Uint32Array; normals: Float32Array },
    scene: BABYLON.Scene,
    name: string
  ): MeshResult {
    try {
      // Create a new mesh
      const mesh = new BABYLON.Mesh(name, scene);

      // Create vertex data
      const vertexData = new BABYLON.VertexData();
      vertexData.positions = babylonData.positions;
      vertexData.indices = babylonData.indices;
      vertexData.normals = babylonData.normals;

      // Apply vertex data to mesh
      vertexData.applyToMesh(mesh);

      // Ensure the mesh is properly initialized
      mesh.createNormals(false); // Don't overwrite existing normals
      mesh.refreshBoundingInfo();

      return success(mesh);
    } catch (err) {
      return error({
        type: 'BABYLON_ERROR',
        message: `Failed to create BabylonJS mesh: ${err instanceof Error ? err.message : String(err)}`,
      });
    }
  }

  /**
   * Generate a unique mesh name
   */
  private generateMeshName(primitiveType: string): string {
    const timestamp = Date.now();
    const counter = ++BabylonMeshBuilderService.meshCounter;
    return `openscad-${primitiveType}-${timestamp}-${counter}`;
  }

  /**
   * Get mesh statistics for debugging
   */
  getMeshStatistics(mesh: BABYLON.Mesh): {
    vertexCount: number;
    triangleCount: number;
    indexCount: number;
    boundingBox: {
      min: BABYLON.Vector3;
      max: BABYLON.Vector3;
      size: BABYLON.Vector3;
    };
  } {
    const boundingInfo = mesh.getBoundingInfo();

    return {
      vertexCount: mesh.getTotalVertices(),
      triangleCount: mesh.getTotalIndices() / 3,
      indexCount: mesh.getTotalIndices(),
      boundingBox: {
        min: boundingInfo.minimum,
        max: boundingInfo.maximum,
        size: boundingInfo.maximum.subtract(boundingInfo.minimum),
      },
    };
  }

  /**
   * Dispose of mesh and free memory
   */
  disposeMesh(mesh: BABYLON.Mesh): void {
    mesh.dispose();
  }
}
