/**
 * @file Camera Service Tests
 * 
 * Unit tests for camera positioning and management utilities
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as BABYLON from '@babylonjs/core';
import {
  calculateMeshBounds,
  calculateSceneBounds,
  calculateOptimalPosition,
  positionCameraForMesh,
  positionCameraForScene,
  resetCamera
} from './camera-service';

// Mock Babylon.js objects
const createMockMesh = (name: string, center: [number, number, number], size: number) => {
  const mesh = {
    name,
    isDisposed: false,
    computeWorldMatrix: vi.fn(),
    getBoundingInfo: vi.fn(() => ({
      boundingBox: {
        center: new BABYLON.Vector3(center[0], center[1], center[2]),
        extendSize: new BABYLON.Vector3(size/2, size/2, size/2),
        minimum: new BABYLON.Vector3(center[0] - size/2, center[1] - size/2, center[2] - size/2),
        maximum: new BABYLON.Vector3(center[0] + size/2, center[1] + size/2, center[2] + size/2)
      }
    }))
  } as unknown as BABYLON.AbstractMesh;
  
  return mesh;
};

const createMockCamera = () => {
  const camera = {
    isDisposed: false,
    setTarget: vi.fn(),
    alpha: 0,
    beta: 0,
    radius: 0
  } as unknown as BABYLON.ArcRotateCamera;
  
  return camera;
};

describe('Camera Service', () => {
  describe('calculateMeshBounds', () => {
    it('should calculate bounds for a valid mesh', () => {
      const mesh = createMockMesh('test-cube', [0, 0, 0], 10);
      
      const result = calculateMeshBounds(mesh);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.center).toEqual([0, 0, 0]);
        expect(result.data.size).toBe(10);
        expect(result.data.min).toEqual([-5, -5, -5]);
        expect(result.data.max).toEqual([5, 5, 5]);
      }
    });

    it('should handle invalid mesh', () => {
      const result = calculateMeshBounds(null as any);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid or disposed mesh');
    });

    it('should handle disposed mesh', () => {
      const mesh = createMockMesh('disposed', [0, 0, 0], 10);
      mesh.isDisposed = true;
      
      const result = calculateMeshBounds(mesh);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid or disposed mesh');
    });
  });

  describe('calculateSceneBounds', () => {
    it('should calculate combined bounds for multiple meshes', () => {
      const mesh1 = createMockMesh('cube1', [0, 0, 0], 10);
      const mesh2 = createMockMesh('cube2', [20, 0, 0], 6);
      
      const result = calculateSceneBounds([mesh1, mesh2]);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.center[0]).toBe(9); // Actual calculated midpoint
        expect(result.data.center[1]).toBe(0);
        expect(result.data.center[2]).toBe(0);
        expect(result.data.size).toBe(28); // Total span from -5 to 23
      }
    });

    it('should handle empty mesh array', () => {
      const result = calculateSceneBounds([]);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('No meshes provided');
    });

    it('should filter out invalid meshes', () => {
      const validMesh = createMockMesh('valid', [0, 0, 0], 10);
      const invalidMesh = null as any;
      
      const result = calculateSceneBounds([validMesh, invalidMesh]);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.center).toEqual([0, 0, 0]);
      }
    });
  });

  describe('calculateOptimalPosition', () => {
    it('should calculate optimal camera position', () => {
      const bounds = {
        center: [0, 0, 0] as [number, number, number],
        size: 10,
        min: [-5, -5, -5] as [number, number, number],
        max: [5, 5, 5] as [number, number, number]
      };
      
      const position = calculateOptimalPosition(bounds);
      
      expect(position.target).toEqual([0, 0, 0]);
      expect(position.radius).toBe(72); // 10 * 6 * 1.2 = 72
      expect(position.alpha).toBe(-Math.PI / 4);
      expect(position.beta).toBe(Math.PI / 3);
    });

    it('should use minimum distance for small objects', () => {
      const bounds = {
        center: [0, 0, 0] as [number, number, number],
        size: 2, // Very small object
        min: [-1, -1, -1] as [number, number, number],
        max: [1, 1, 1] as [number, number, number]
      };
      
      const position = calculateOptimalPosition(bounds);
      
      expect(position.radius).toBe(36); // Minimum distance: 30 * 1.2 = 36
    });
  });

  describe('positionCameraForMesh', () => {
    it('should position camera for a single mesh', () => {
      const camera = createMockCamera();
      const mesh = createMockMesh('test-cube', [5, 5, 5], 10);
      
      const result = positionCameraForMesh(camera, mesh);
      
      expect(result.success).toBe(true);
      expect(camera.setTarget).toHaveBeenCalledWith(new BABYLON.Vector3(5, 5, 5));
      expect(camera.alpha).toBe(-Math.PI / 4);
      expect(camera.beta).toBe(Math.PI / 3);
      expect(camera.radius).toBe(72);
    });

    it('should handle invalid camera', () => {
      const result = positionCameraForMesh(null as any, createMockMesh('test', [0, 0, 0], 10));

      expect(result.success).toBe(false);
      expect(result.error).toContain('Camera is null or undefined');
    });

    it('should handle invalid mesh', () => {
      const camera = createMockCamera();

      const result = positionCameraForMesh(camera, null as any);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Mesh is null or undefined');
    });
  });

  describe('positionCameraForScene', () => {
    it('should position camera for multiple meshes', () => {
      const camera = createMockCamera();
      const mesh1 = createMockMesh('cube1', [0, 0, 0], 10);
      const mesh2 = createMockMesh('cube2', [20, 0, 0], 6);
      
      const result = positionCameraForScene(camera, [mesh1, mesh2]);
      
      expect(result.success).toBe(true);
      expect(camera.setTarget).toHaveBeenCalledWith(expect.objectContaining({
        _x: 9, // Actual calculated center
        _y: 0,
        _z: 0
      }));
      expect(camera.radius).toBe(201.6); // 28 * 6 * 1.2 = 201.6
    });

    it('should handle empty mesh array', () => {
      const camera = createMockCamera();
      
      const result = positionCameraForScene(camera, []);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('No meshes provided');
    });
  });

  describe('resetCamera', () => {
    it('should reset camera to default position', () => {
      const camera = createMockCamera();
      
      resetCamera(camera);
      
      expect(camera.setTarget).toHaveBeenCalledWith(BABYLON.Vector3.Zero());
      expect(camera.alpha).toBe(-Math.PI / 4);
      expect(camera.beta).toBe(Math.PI / 3);
      expect(camera.radius).toBe(20);
    });

    it('should handle invalid camera gracefully', () => {
      // Should not throw
      expect(() => resetCamera(null as any)).not.toThrow();
    });

    it('should handle disposed camera gracefully', () => {
      const camera = createMockCamera();
      camera.isDisposed = true;
      
      // Should not throw
      expect(() => resetCamera(camera)).not.toThrow();
    });
  });
});
