/**
 * @file Tests for Material Manager Utilities
 * 
 * Tests for pure functions that handle material creation and application
 * Following TDD principles and functional programming patterns
 * 
 * @author OpenSCAD-Babylon Pipeline
 * @date June 2025
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as BABYLON from '@babylonjs/core';

// Mock BABYLON module
vi.mock('@babylonjs/core', () => ({
  StandardMaterial: vi.fn(),
  Color3: vi.fn(),
  Material: {
    MATERIAL_ALPHABLEND: 2
  }
}));
import {
  createMeshMaterial,
  applyMaterialToMesh,
  applyMaterialsToMeshCollection,
  getMaterialTheme,
  createMaterialFromConfig
} from './material-manager';
import type { 
  MeshMaterialConfig, 
  MaterialTheme, 
  MaterialManagerConfig,
  MeshCollection,
  MeshData
} from '../../types/visual-test-canvas-types';

describe('Material Manager Utilities', () => {
  let mockScene: BABYLON.Scene;
  let mockMesh: BABYLON.Mesh;
  let mockMaterial: BABYLON.StandardMaterial;

  beforeEach(() => {
    // Create mock Babylon.js objects
    mockScene = {
      dispose: vi.fn(),
      isDisposed: false
    } as unknown as BABYLON.Scene;

    mockMesh = {
      name: 'test-mesh',
      material: null,
      dispose: vi.fn()
    } as unknown as BABYLON.Mesh;

    mockMaterial = {
      name: 'test-material',
      diffuseColor: { x: 1, y: 1, z: 1 },
      specularColor: { x: 0.2, y: 0.2, z: 0.2 },
      alpha: 1,
      transparencyMode: 0,
      dispose: vi.fn()
    } as unknown as BABYLON.StandardMaterial;

    // Setup mocks
    (BABYLON.StandardMaterial as any).mockImplementation(() => mockMaterial);
    (BABYLON.Color3 as any).mockImplementation((r: number, g: number, b: number) => ({ x: r, y: g, z: b }));

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('createMeshMaterial', () => {
    it('should create material with default white configuration', () => {
      const result = createMeshMaterial('test-material', mockScene);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(BABYLON.StandardMaterial).toHaveBeenCalledWith('test-material', mockScene);
        expect(BABYLON.Color3).toHaveBeenCalledWith(1, 1, 1); // Default white diffuse
        expect(BABYLON.Color3).toHaveBeenCalledWith(0.2, 0.2, 0.2); // Default specular
      }
    });

    it('should create material with custom configuration', () => {
      const config: MeshMaterialConfig = {
        diffuseColor: [0.5, 0.7, 0.9],
        specularColor: [0.1, 0.1, 0.1],
        alpha: 0.8,
        transparencyMode: 2
      };

      const result = createMeshMaterial('custom-material', mockScene, config);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(BABYLON.Color3).toHaveBeenCalledWith(0.5, 0.7, 0.9);
        expect(BABYLON.Color3).toHaveBeenCalledWith(0.1, 0.1, 0.1);
        expect(mockMaterial.alpha).toBe(0.8);
        expect(mockMaterial.transparencyMode).toBe(2);
      }
    });

    it('should handle material creation errors', () => {
      // Mock constructor to throw error
      (BABYLON.StandardMaterial as any).mockImplementation(() => {
        throw new Error('Material creation failed');
      });

      const result = createMeshMaterial('error-material', mockScene);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Failed to create material');
      }
    });
  });

  describe('applyMaterialToMesh', () => {
    it('should apply material to mesh successfully', () => {
      const result = applyMaterialToMesh(mockMesh, mockMaterial);

      expect(result.success).toBe(true);
      expect(mockMesh.material).toBe(mockMaterial);
    });

    it('should handle null mesh gracefully', () => {
      const result = applyMaterialToMesh(null as any, mockMaterial);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Mesh is null or undefined');
      }
    });

    it('should handle null material gracefully', () => {
      const result = applyMaterialToMesh(mockMesh, null as any);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Material is null or undefined');
      }
    });
  });

  describe('createMaterialFromConfig', () => {
    it('should create material from mesh data configuration', () => {
      const meshData: MeshData = {
        mesh: mockMesh,
        name: 'test-mesh',
        materialConfig: {
          diffuseColor: [0.8, 0.6, 0.4],
          specularColor: [0.3, 0.3, 0.3],
          alpha: 0.9
        }
      };

      const result = createMaterialFromConfig(meshData, mockScene);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(BABYLON.Color3).toHaveBeenCalledWith(0.8, 0.6, 0.4);
        expect(BABYLON.Color3).toHaveBeenCalledWith(0.3, 0.3, 0.3);
        expect(mockMaterial.alpha).toBe(0.9);
      }
    });

    it('should use default configuration when none provided', () => {
      const meshData: MeshData = {
        mesh: mockMesh,
        name: 'test-mesh'
      };

      const result = createMaterialFromConfig(meshData, mockScene);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(BABYLON.Color3).toHaveBeenCalledWith(1, 1, 1); // Default white
      }
    });
  });

  describe('getMaterialTheme', () => {
    it('should return default theme configuration', () => {
      const theme = getMaterialTheme('default');

      expect(theme.mainMeshMaterial).toEqual({
        diffuseColor: [1, 1, 1],
        specularColor: [0.2, 0.2, 0.2]
      });
      expect(theme.referenceMeshMaterial).toEqual({
        diffuseColor: [0.7, 0.7, 0.7],
        specularColor: [0.1, 0.1, 0.1],
        alpha: 0.3,
        transparencyMode: 2
      });
    });

    it('should return high-contrast theme configuration', () => {
      const theme = getMaterialTheme('high-contrast');

      expect(theme.mainMeshMaterial).toEqual({
        diffuseColor: [1, 1, 1],
        specularColor: [0, 0, 0]
      });
      expect(theme.referenceMeshMaterial).toEqual({
        diffuseColor: [0, 0, 0],
        specularColor: [0, 0, 0],
        alpha: 0.5,
        transparencyMode: 2
      });
    });

    it('should return colorful theme configuration', () => {
      const theme = getMaterialTheme('colorful');

      expect(theme.mainMeshMaterial).toEqual({
        diffuseColor: [0.2, 0.8, 1],
        specularColor: [0.3, 0.3, 0.3]
      });
      expect(theme.referenceMeshMaterial).toEqual({
        diffuseColor: [1, 0.5, 0.2],
        specularColor: [0.2, 0.2, 0.2],
        alpha: 0.4,
        transparencyMode: 2
      });
    });

    it('should return monochrome theme configuration', () => {
      const theme = getMaterialTheme('monochrome');

      expect(theme.mainMeshMaterial).toEqual({
        diffuseColor: [0.9, 0.9, 0.9],
        specularColor: [0.1, 0.1, 0.1]
      });
      expect(theme.referenceMeshMaterial).toEqual({
        diffuseColor: [0.5, 0.5, 0.5],
        specularColor: [0.05, 0.05, 0.05],
        alpha: 0.3,
        transparencyMode: 2
      });
    });

    it('should fallback to default for unknown theme', () => {
      const theme = getMaterialTheme('unknown' as MaterialTheme);

      expect(theme.mainMeshMaterial).toEqual({
        diffuseColor: [1, 1, 1],
        specularColor: [0.2, 0.2, 0.2]
      });
    });
  });

  describe('applyMaterialsToMeshCollection', () => {
    it('should apply materials to all meshes in collection', async () => {
      const meshCollection: MeshCollection = {
        mainMeshes: [
          { mesh: mockMesh, name: 'main-1' },
          { mesh: { ...mockMesh, name: 'main-2' } as BABYLON.Mesh, name: 'main-2' }
        ],
        referenceMeshes: [
          { 
            mesh: { ...mockMesh, name: 'ref-1' } as BABYLON.Mesh, 
            name: 'ref-1', 
            isReference: true 
          }
        ]
      };

      const config: MaterialManagerConfig = {
        theme: 'default'
      };

      const result = await applyMaterialsToMeshCollection(meshCollection, mockScene, config);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.appliedCount).toBe(3);
        expect(result.data.failedCount).toBe(0);
      }
    });

    it('should handle material application errors gracefully', async () => {
      // Mock material creation to fail
      (BABYLON.StandardMaterial as any).mockImplementation(() => {
        throw new Error('Material creation failed');
      });

      const meshCollection: MeshCollection = {
        mainMeshes: [{ mesh: mockMesh, name: 'main-1' }],
        referenceMeshes: []
      };

      const result = await applyMaterialsToMeshCollection(meshCollection, mockScene);

      expect(result.success).toBe(true); // Should not fail completely
      if (result.success) {
        expect(result.data.failedCount).toBe(1);
        expect(result.data.appliedCount).toBe(0);
      }
    });
  });
});
