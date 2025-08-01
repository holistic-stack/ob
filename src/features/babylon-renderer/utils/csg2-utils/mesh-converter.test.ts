/**
 * @file CSG2 Mesh Converter Tests
 *
 * Tests for CSG2 mesh conversion utilities.
 * Following TDD principles with real BabylonJS implementations using NullEngine.
 */

import * as BABYLON from '@babylonjs/core';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { GenericMeshData } from '@/features/babylon-renderer';
import { DEFAULT_MESH_METADATA, MATERIAL_PRESETS } from '@/features/babylon-renderer';
import {
  convertBabylonMeshToGeneric,
  convertGenericMeshToBabylon,
  DEFAULT_CONVERSION_OPTIONS,
  MeshConversionErrorCode,
  optimizeMeshForCSG,
} from './mesh-converter';

describe('CSG2 Mesh Converter', () => {
  let scene: BABYLON.Scene;
  let engine: BABYLON.NullEngine;
  let mockGenericMeshData: GenericMeshData;

  beforeEach(() => {
    // Create a null engine (headless)
    engine = new BABYLON.NullEngine();

    // Create a real scene
    scene = new BABYLON.Scene(engine);

    mockGenericMeshData = {
      id: 'test-mesh',
      geometry: {
        positions: new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]),
        indices: new Uint32Array([0, 1, 2]),
        normals: new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1]),
        uvs: new Float32Array([0, 0, 1, 0, 0, 1]),
        vertexCount: 3,
        triangleCount: 1,
        boundingBox: new BABYLON.BoundingBox(
          new BABYLON.Vector3(0, 0, 0),
          new BABYLON.Vector3(1, 1, 1)
        ),
      },
      material: MATERIAL_PRESETS.DEFAULT,
      transform: BABYLON.Matrix.Identity(),
      metadata: {
        ...DEFAULT_MESH_METADATA,
        meshId: 'test-mesh',
        name: 'test-mesh',
        nodeType: 'cube',
        vertexCount: 3,
        triangleCount: 1,
        boundingBox: new BABYLON.BoundingBox(
          new BABYLON.Vector3(0, 0, 0),
          new BABYLON.Vector3(1, 1, 1)
        ),
      },
    };
  });

  afterEach(() => {
    // Clean up after each test
    scene?.dispose();
    engine?.dispose();
  });

  describe('convertGenericMeshToBabylon', () => {
    it('should convert generic mesh data to BabylonJS mesh successfully', () => {
      const result = convertGenericMeshToBabylon(mockGenericMeshData, scene);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('test-mesh');
      }
    });

    it('should handle invalid mesh data gracefully', () => {
      const result = convertGenericMeshToBabylon(null as any, scene);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(MeshConversionErrorCode.INVALID_MESH_DATA);
        expect(result.error.message).toContain('Invalid mesh data');
      }
    });

    it('should handle missing scene gracefully', () => {
      const result = convertGenericMeshToBabylon(mockGenericMeshData, null as any);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(MeshConversionErrorCode.INVALID_MESH_DATA);
        expect(result.error.message).toContain('Scene is required');
      }
    });

    it('should handle mesh data without geometry', () => {
      const invalidMeshData = { ...mockGenericMeshData, geometry: null };
      const result = convertGenericMeshToBabylon(invalidMeshData as any, scene);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(MeshConversionErrorCode.INVALID_MESH_DATA);
      }
    });

    it('should handle mesh data without positions', () => {
      const invalidMeshData = {
        ...mockGenericMeshData,
        geometry: { ...(mockGenericMeshData.geometry as any), positions: null },
      };
      const result = convertGenericMeshToBabylon(invalidMeshData as any, scene);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(MeshConversionErrorCode.INVALID_MESH_DATA);
        expect(result.error.message).toContain('positions');
      }
    });

    it('should handle mesh data without indices', () => {
      const invalidMeshData = {
        ...mockGenericMeshData,
        geometry: { ...(mockGenericMeshData.geometry as any), indices: null },
      };
      const result = convertGenericMeshToBabylon(invalidMeshData as any, scene);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(MeshConversionErrorCode.INVALID_MESH_DATA);
        expect(result.error.message).toContain('indices');
      }
    });

    it('should apply conversion options correctly', () => {
      const options = {
        ...DEFAULT_CONVERSION_OPTIONS,
        generateNormals: false,
        optimizeIndices: false,
      };

      const result = convertGenericMeshToBabylon(mockGenericMeshData, scene, options);

      expect(result.success).toBe(true);
      // Verify that the mesh was created successfully with the given options
      if (result.success) {
        expect(result.data).toBeDefined();
        expect(result.data.id).toBe('test-mesh');
      }
    });
  });

  describe('convertBabylonMeshToGeneric', () => {
    it('should convert BabylonJS mesh to generic format successfully', () => {
      // Create a real BabylonJS mesh with geometry
      const mesh = new BABYLON.Mesh('babylon-mesh', scene);
      const vertexData = new BABYLON.VertexData();
      vertexData.positions = [0, 0, 0, 1, 0, 0, 0, 1, 0];
      vertexData.indices = [0, 1, 2];
      vertexData.normals = [0, 0, 1, 0, 0, 1, 0, 0, 1];
      vertexData.uvs = [0, 0, 1, 0, 0, 1];
      vertexData.applyToMesh(mesh);

      const result = convertBabylonMeshToGeneric(mesh);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('babylon-mesh');
        expect(result.data.geometry).toBeDefined();
        expect(result.data.material).toBeDefined();
        expect(result.data.metadata).toBeDefined();
      }
    });

    it('should handle null mesh gracefully', () => {
      const result = convertBabylonMeshToGeneric(null as any);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('INVALID_MESH_DATA');
        expect(result.error.message).toContain('Mesh is required');
      }
    });

    it('should handle mesh without positions', () => {
      // Create a mesh without vertex data
      const mesh = new BABYLON.Mesh('invalid-mesh', scene);

      const result = convertBabylonMeshToGeneric(mesh);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('INVALID_MESH_DATA');
        expect(result.error.message).toContain('positions and indices');
      }
    });

    it('should handle mesh without indices', () => {
      const mesh = new BABYLON.Mesh('testMesh', scene);

      // Set positions only (no indices)
      const positions = new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]);
      mesh.setVerticesData(BABYLON.VertexBuffer.PositionKind, positions);

      // BabylonJS auto-generates indices when positions are set
      // So the conversion should succeed
      const result = convertBabylonMeshToGeneric(mesh);
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.geometry.positions).toHaveLength(9); // 3 vertices * 3 components
        expect(result.data.geometry.indices).toBeDefined();
        expect(result.data.geometry.vertexCount).toBe(3);
      }
    });
  });

  describe('optimizeMeshForCSG', () => {
    it('should optimize mesh successfully', () => {
      // Create a real BabylonJS mesh with proper geometry
      const mesh = new BABYLON.Mesh('optimize-mesh', scene);
      const vertexData = new BABYLON.VertexData();
      vertexData.positions = [0, 0, 0, 1, 0, 0, 0, 1, 0];
      vertexData.indices = [0, 1, 2];
      vertexData.normals = [0, 0, 1, 0, 0, 1, 0, 0, 1];
      vertexData.applyToMesh(mesh);

      const result = optimizeMeshForCSG(mesh);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(mesh);
      }
    });

    it('should apply optimization options correctly', () => {
      // Create a real BabylonJS mesh
      const mesh = new BABYLON.Mesh('optimize-mesh', scene);
      const vertexData = new BABYLON.VertexData();
      vertexData.positions = [0, 0, 0, 1, 0, 0, 0, 1, 0];
      vertexData.indices = [0, 1, 2];
      vertexData.normals = [0, 0, 1, 0, 0, 1, 0, 0, 1];
      vertexData.applyToMesh(mesh);

      const options = {
        ...DEFAULT_CONVERSION_OPTIONS,
        generateNormals: false,
        optimizeIndices: false,
      };

      const result = optimizeMeshForCSG(mesh, options);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(mesh);
      }
    });

    it('should handle validation failure when mesh is not manifold', () => {
      // Create a mesh with invalid geometry (empty arrays)
      const mesh = new BABYLON.Mesh('invalid-mesh', scene);
      const vertexData = new BABYLON.VertexData();
      vertexData.positions = [];
      vertexData.indices = [];
      vertexData.applyToMesh(mesh);

      const result = optimizeMeshForCSG(mesh);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(MeshConversionErrorCode.OPTIMIZATION_FAILED);
        expect(result.error.message).toContain('Failed to optimize mesh');
      }
    });
  });

  describe('DEFAULT_CONVERSION_OPTIONS', () => {
    it('should have correct default values', () => {
      expect(DEFAULT_CONVERSION_OPTIONS.generateNormals).toBe(true);
      expect(DEFAULT_CONVERSION_OPTIONS.generateUVs).toBe(false);
      expect(DEFAULT_CONVERSION_OPTIONS.optimizeIndices).toBe(true);
      expect(DEFAULT_CONVERSION_OPTIONS.validateManifold).toBe(true);
      expect(DEFAULT_CONVERSION_OPTIONS.mergeVertices).toBe(true);
      expect(DEFAULT_CONVERSION_OPTIONS.tolerance).toBe(1e-6);
    });
  });
});
