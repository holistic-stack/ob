/**
 * @file Tests for Camera Manager Utilities
 * 
 * Tests for pure functions that handle camera positioning and configuration
 * Following TDD principles and functional programming patterns
 * 
 * @author OpenSCAD-Babylon Pipeline
 * @date June 2025
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as BABYLON from '@babylonjs/core';

// Mock BABYLON module
vi.mock('@babylonjs/core', () => ({
  Vector3: {
    TransformCoordinates: vi.fn(),
    Minimize: vi.fn(),
    Maximize: vi.fn()
  },
  ArcRotateCamera: vi.fn(),
  FreeCamera: vi.fn()
}));

import {
  calculateMeshBounds,
  calculateOptimalCameraPosition,
  positionCameraForMeshes,
  createCameraConfiguration
} from './camera-manager';
import type { 
  CameraBounds, 
  CameraPositioning, 
  CameraManagerConfig,
  MeshCollection
} from '../../types/visual-test-canvas-types';

describe('Camera Manager Utilities', () => {
  let mockScene: BABYLON.Scene;
  let mockCamera: BABYLON.ArcRotateCamera;
  let mockMesh: BABYLON.Mesh;

  beforeEach(() => {
    // Create mock Babylon.js objects
    mockScene = {
      dispose: vi.fn(),
      isDisposed: false,
      activeCamera: null
    } as unknown as BABYLON.Scene;

    mockCamera = {
      name: 'test-camera',
      position: { x: 0, y: 0, z: 0 },
      setTarget: vi.fn(),
      radius: 10,
      alpha: 0,
      beta: 0,
      dispose: vi.fn()
    } as unknown as BABYLON.ArcRotateCamera;

    mockMesh = {
      name: 'test-mesh',
      position: { x: 0, y: 0, z: 0 },
      computeWorldMatrix: vi.fn(),
      getBoundingInfo: vi.fn(() => ({
        boundingBox: {
          minimum: { x: -1, y: -1, z: -1 },
          maximum: { x: 1, y: 1, z: 1 }
        }
      })),
      getWorldMatrix: vi.fn(() => ({
        m: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]
      })),
      dispose: vi.fn()
    } as unknown as BABYLON.Mesh;

    // Setup Vector3 mocks
    (BABYLON.Vector3.TransformCoordinates as any).mockImplementation((vector: any) => vector);
    (BABYLON.Vector3.Minimize as any).mockImplementation((a: any, b: any) => ({
      x: Math.min(a.x, b.x),
      y: Math.min(a.y, b.y),
      z: Math.min(a.z, b.z)
    }));
    (BABYLON.Vector3.Maximize as any).mockImplementation((a: any, b: any) => ({
      x: Math.max(a.x, b.x),
      y: Math.max(a.y, b.y),
      z: Math.max(a.z, b.z)
    }));

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('calculateMeshBounds', () => {
    it('should calculate bounds for a single mesh', () => {
      const meshes = [mockMesh];
      const result = calculateMeshBounds(meshes);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.center).toEqual([0, 0, 0]);
        expect(result.data.size).toEqual([2, 2, 2]);
        expect(result.data.maxDimension).toBe(2);
      }
    });

    it('should calculate bounds for multiple meshes', () => {
      const mesh2 = {
        ...mockMesh,
        name: 'mesh-2',
        getBoundingInfo: vi.fn(() => ({
          boundingBox: {
            minimum: { x: 2, y: 2, z: 2 },
            maximum: { x: 4, y: 4, z: 4 }
          }
        }))
      } as unknown as BABYLON.Mesh;

      const meshes = [mockMesh, mesh2];
      const result = calculateMeshBounds(meshes);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.center).toEqual([1.5, 1.5, 1.5]);
        expect(result.data.size).toEqual([5, 5, 5]);
        expect(result.data.maxDimension).toBe(5);
      }
    });

    it('should handle empty mesh array', () => {
      const result = calculateMeshBounds([]);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('No meshes provided for bounds calculation');
      }
    });

    it('should handle meshes with invalid bounding info', () => {
      const invalidMesh = {
        ...mockMesh,
        getBoundingInfo: vi.fn(() => null)
      } as unknown as BABYLON.Mesh;

      const result = calculateMeshBounds([invalidMesh]);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Failed to calculate mesh bounds');
      }
    });
  });

  describe('calculateOptimalCameraPosition', () => {
    it('should calculate optimal position for given bounds', () => {
      const bounds: CameraBounds = {
        center: [0, 0, 0],
        size: [10, 10, 10],
        maxDimension: 10,
        recommendedDistance: 35
      };

      const config: CameraManagerConfig = {
        paddingFactor: 3.5,
        preferredAngle: [Math.PI / 4, Math.PI / 4]
      };

      const result = calculateOptimalCameraPosition(bounds, config);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.target).toEqual([0, 0, 0]);
        expect(result.data.radius).toBe(35);
        expect(result.data.bounds).toBe(bounds);
      }
    });

    it('should use default configuration when none provided', () => {
      const bounds: CameraBounds = {
        center: [5, 5, 5],
        size: [6, 6, 6],
        maxDimension: 6,
        recommendedDistance: 21
      };

      const result = calculateOptimalCameraPosition(bounds);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.target).toEqual([5, 5, 5]);
        expect(result.data.radius).toBeGreaterThan(20); // Should be at least maxDimension * 3.5
      }
    });

    it('should enforce minimum distance', () => {
      const bounds: CameraBounds = {
        center: [0, 0, 0],
        size: [1, 1, 1],
        maxDimension: 1,
        recommendedDistance: 3.5
      };

      const config: CameraManagerConfig = {
        minDistance: 10
      };

      const result = calculateOptimalCameraPosition(bounds, config);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.radius).toBeGreaterThanOrEqual(10);
      }
    });

    it('should enforce maximum distance', () => {
      const bounds: CameraBounds = {
        center: [0, 0, 0],
        size: [100, 100, 100],
        maxDimension: 100,
        recommendedDistance: 350
      };

      const config: CameraManagerConfig = {
        maxDistance: 200
      };

      const result = calculateOptimalCameraPosition(bounds, config);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.radius).toBeLessThanOrEqual(200);
      }
    });
  });

  describe('positionCameraForMeshes', () => {
    it('should position ArcRotateCamera for mesh collection', async () => {
      const meshCollection = {
        mainMeshes: [{ mesh: mockMesh, name: 'main-1' }],
        referenceMeshes: []
      };

      mockScene.activeCamera = mockCamera;

      const result = await positionCameraForMeshes(meshCollection, mockScene);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(mockCamera.setTarget).toHaveBeenCalled();
        expect(result.data.bounds).toBeDefined();
      }
    });

    it('should handle FreeCamera positioning', async () => {
      const freeCamera = {
        name: 'free-camera',
        position: { x: 0, y: 0, z: 0 },
        setTarget: vi.fn(),
        dispose: vi.fn()
      } as unknown as BABYLON.FreeCamera;

      const meshCollection = {
        mainMeshes: [{ mesh: mockMesh, name: 'main-1' }],
        referenceMeshes: []
      };

      mockScene.activeCamera = freeCamera;

      const result = await positionCameraForMeshes(meshCollection, mockScene);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(freeCamera.setTarget).toHaveBeenCalled();
      }
    });

    it('should handle no active camera', async () => {
      const meshCollection = {
        mainMeshes: [{ mesh: mockMesh, name: 'main-1' }],
        referenceMeshes: []
      };

      mockScene.activeCamera = null;

      const result = await positionCameraForMeshes(meshCollection, mockScene);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('No active camera in scene');
      }
    });

    it('should handle empty mesh collection', async () => {
      const meshCollection = {
        mainMeshes: [],
        referenceMeshes: []
      };

      mockScene.activeCamera = mockCamera;

      const result = await positionCameraForMeshes(meshCollection, mockScene);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('No meshes provided for camera positioning');
      }
    });
  });

  describe('createCameraConfiguration', () => {
    it('should create configuration with default values', () => {
      const config = createCameraConfiguration();

      expect(config.autoPosition).toBe(true);
      expect(config.paddingFactor).toBe(3.5);
      expect(config.minDistance).toBe(5);
      expect(config.maxDistance).toBe(1000);
    });

    it('should merge custom configuration with defaults', () => {
      const customConfig = {
        paddingFactor: 5.0,
        minDistance: 10
      };

      const config = createCameraConfiguration(customConfig);

      expect(config.paddingFactor).toBe(5.0);
      expect(config.minDistance).toBe(10);
      expect(config.autoPosition).toBe(true); // Should keep default
      expect(config.maxDistance).toBe(1000); // Should keep default
    });
  });
});
