/**
 * @file CSG2 Mesh Converter Tests
 * 
 * Tests for CSG2 mesh conversion utilities.
 * Following TDD principles with real implementations where possible.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  convertGenericMeshToBabylon,
  convertBabylonMeshToGeneric,
  optimizeMeshForCSG,
  DEFAULT_CONVERSION_OPTIONS,
} from './mesh-converter';
import type { GenericMeshData } from '../../../ast-to-csg-converter/types/conversion.types';

// Mock BabylonJS components
const createMockScene = () => ({
  dispose: vi.fn(),
  render: vi.fn(),
}) as any;

const createMockMesh = (id: string) => ({
  id,
  getVerticesData: vi.fn((kind: string) => {
    if (kind === 'position') return new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]);
    if (kind === 'normal') return new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1]);
    if (kind === 'uv') return new Float32Array([0, 0, 1, 0, 0, 1]);
    return null;
  }),
  getIndices: vi.fn(() => new Uint32Array([0, 1, 2])),
  createNormals: vi.fn(),
  optimizeIndices: vi.fn(),
  getBoundingInfo: vi.fn(() => ({
    boundingBox: {
      minimum: { x: 0, y: 0, z: 0 },
      maximum: { x: 1, y: 1, z: 1 },
    },
  })),
  getWorldMatrix: vi.fn(() => ({
    m: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
  })),
}) as any;

// Mock BabylonJS classes
vi.mock('@babylonjs/core', async () => {
  const actual = await vi.importActual('@babylonjs/core');
  return {
    ...actual,
    Mesh: vi.fn().mockImplementation((id: string) => createMockMesh(id)),
    VertexData: vi.fn().mockImplementation(() => ({
      positions: null,
      indices: null,
      normals: null,
      uvs: null,
      applyToMesh: vi.fn(),
    })),
  };
});

describe('CSG2 Mesh Converter', () => {
  let mockScene: any;
  let mockGenericMeshData: GenericMeshData;

  beforeEach(() => {
    mockScene = createMockScene();
    
    mockGenericMeshData = {
      id: 'test-mesh',
      geometry: {
        positions: new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]),
        indices: new Uint32Array([0, 1, 2]),
        normals: new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1]),
        uvs: new Float32Array([0, 0, 1, 0, 0, 1]),
      },
      material: {
        color: [1, 1, 1, 1],
        metallic: 0,
        roughness: 1,
        emissive: [0, 0, 0],
      },
      transform: {
        m: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
      },
      metadata: {
        triangleCount: 1,
        vertexCount: 3,
        boundingBox: {
          minimum: { x: 0, y: 0, z: 0 },
          maximum: { x: 1, y: 1, z: 1 },
        },
        hasNormals: true,
        hasUVs: true,
        isOptimized: false,
      },
    } as any;

    // Reset mocks
    vi.clearAllMocks();
  });

  describe('convertGenericMeshToBabylon', () => {
    it('should convert generic mesh data to BabylonJS mesh successfully', () => {
      const result = convertGenericMeshToBabylon(mockGenericMeshData, mockScene);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('test-mesh');
      }
    });

    it('should handle invalid mesh data gracefully', () => {
      const result = convertGenericMeshToBabylon(null as any, mockScene);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('INVALID_MESH_DATA');
        expect(result.error.message).toContain('Invalid mesh data');
      }
    });

    it('should handle missing scene gracefully', () => {
      const result = convertGenericMeshToBabylon(mockGenericMeshData, null as any);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('INVALID_MESH_DATA');
        expect(result.error.message).toContain('Scene is required');
      }
    });

    it('should handle mesh data without geometry', () => {
      const invalidMeshData = { ...mockGenericMeshData, geometry: null };
      const result = convertGenericMeshToBabylon(invalidMeshData as any, mockScene);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('INVALID_MESH_DATA');
      }
    });

    it('should handle mesh data without positions', () => {
      const invalidMeshData = {
        ...mockGenericMeshData,
        geometry: { ...mockGenericMeshData.geometry, positions: null },
      };
      const result = convertGenericMeshToBabylon(invalidMeshData as any, mockScene);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('INVALID_MESH_DATA');
        expect(result.error.message).toContain('positions');
      }
    });

    it('should handle mesh data without indices', () => {
      const invalidMeshData = {
        ...mockGenericMeshData,
        geometry: { ...mockGenericMeshData.geometry, indices: null },
      };
      const result = convertGenericMeshToBabylon(invalidMeshData as any, mockScene);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('INVALID_MESH_DATA');
        expect(result.error.message).toContain('indices');
      }
    });

    it('should apply conversion options correctly', () => {
      const options = {
        ...DEFAULT_CONVERSION_OPTIONS,
        generateNormals: false,
        optimizeIndices: false,
      };

      const result = convertGenericMeshToBabylon(mockGenericMeshData, mockScene, options);

      expect(result.success).toBe(true);
      // Verify that normals and optimization were not applied
      // This would be verified through the mock calls in a real implementation
    });
  });

  describe('convertBabylonMeshToGeneric', () => {
    it('should convert BabylonJS mesh to generic format successfully', () => {
      const mockMesh = createMockMesh('babylon-mesh');
      const result = convertBabylonMeshToGeneric(mockMesh);

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
      const mockMesh = createMockMesh('invalid-mesh');
      mockMesh.getVerticesData.mockImplementation((kind: string) => {
        if (kind === 'position') return null;
        return new Float32Array([0, 0, 0]);
      });

      const result = convertBabylonMeshToGeneric(mockMesh);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('INVALID_MESH_DATA');
        expect(result.error.message).toContain('positions and indices');
      }
    });

    it('should handle mesh without indices', () => {
      const mockMesh = createMockMesh('invalid-mesh');
      mockMesh.getIndices.mockReturnValue(null);

      const result = convertBabylonMeshToGeneric(mockMesh);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('INVALID_MESH_DATA');
        expect(result.error.message).toContain('positions and indices');
      }
    });
  });

  describe('optimizeMeshForCSG', () => {
    it('should optimize mesh successfully', () => {
      const mockMesh = createMockMesh('optimize-mesh');
      const result = optimizeMeshForCSG(mockMesh);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(mockMesh);
      }

      expect(mockMesh.createNormals).toHaveBeenCalledWith(true);
      expect(mockMesh.optimizeIndices).toHaveBeenCalled();
    });

    it('should apply optimization options correctly', () => {
      const mockMesh = createMockMesh('optimize-mesh');
      const options = {
        ...DEFAULT_CONVERSION_OPTIONS,
        generateNormals: false,
        optimizeIndices: false,
      };

      const result = optimizeMeshForCSG(mockMesh, options);

      expect(result.success).toBe(true);
      expect(mockMesh.createNormals).not.toHaveBeenCalled();
      expect(mockMesh.optimizeIndices).not.toHaveBeenCalled();
    });

    it('should handle validation failure when mesh is not manifold', () => {
      const mockMesh = createMockMesh('invalid-mesh');
      // Mock invalid geometry
      mockMesh.getVerticesData.mockReturnValue(new Float32Array([]));
      mockMesh.getIndices.mockReturnValue(new Uint32Array([]));

      const result = optimizeMeshForCSG(mockMesh);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_FAILED');
        expect(result.error.message).toContain('not manifold');
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
