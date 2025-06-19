/**
 * @file Mesh Positioning Utility Tests
 * 
 * Tests for applying ghost positioning to Babylon.js meshes and calculating
 * combined camera bounds for optimal viewing.
 * 
 * Following TDD, DRY, KISS, and SRP principles:
 * - TDD: Tests written first to define expected behavior
 * - DRY: Reusable mesh positioning logic
 * - KISS: Simple, clear mesh manipulation
 * - SRP: Single responsibility for mesh positioning
 * 
 * @author OpenSCAD-Babylon Pipeline
 * @date June 2025
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { 
  applyGhostPositioning, 
  calculateMeshBounds,
  calculateOptimalCameraPosition,
  type BabylonMesh,
  type BabylonVector3,
  type BabylonBoundingInfo
} from './mesh-positioning';
import type { Vector3D, BoundingBox } from './ghost-positioning';

// Mock Babylon.js types for testing
const createMockVector3 = (x: number, y: number, z: number): BabylonVector3 => ({
  x, y, z
});

const createMockBoundingInfo = (min: Vector3D, max: Vector3D): BabylonBoundingInfo => ({
  boundingBox: {
    minimum: createMockVector3(min.x, min.y, min.z),
    maximum: createMockVector3(max.x, max.y, max.z),
    center: createMockVector3((min.x + max.x) / 2, (min.y + max.y) / 2, (min.z + max.z) / 2)
  }
});

const createMockMesh = (name: string, bounds: { min: Vector3D; max: Vector3D }): BabylonMesh => ({
  name,
  position: createMockVector3(0, 0, 0),
  computeWorldMatrix: vi.fn(),
  refreshBoundingInfo: vi.fn(),
  getBoundingInfo: vi.fn().mockReturnValue(createMockBoundingInfo(bounds.min, bounds.max)),
  getWorldMatrix: vi.fn().mockReturnValue({
    m: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1] // Identity matrix
  })
});

describe('Mesh Positioning Utilities', () => {
  describe('applyGhostPositioning', () => {
    test('should apply offset to ghost meshes', () => {
      const ghostMeshes = [
        createMockMesh('ghost1', { min: { x: -2.5, y: -2.5, z: -2.5 }, max: { x: 2.5, y: 2.5, z: 2.5 } }),
        createMockMesh('ghost2', { min: { x: -1, y: -1, z: -1 }, max: { x: 1, y: 1, z: 1 } })
      ];
      
      const offset: Vector3D = { x: -10, y: -5, z: -3 };
      
      applyGhostPositioning(ghostMeshes, offset);
      
      // Verify that position was set for each mesh
      expect(ghostMeshes[0].position.x).toBe(-10);
      expect(ghostMeshes[0].position.y).toBe(-5);
      expect(ghostMeshes[0].position.z).toBe(-3);
      
      expect(ghostMeshes[1].position.x).toBe(-10);
      expect(ghostMeshes[1].position.y).toBe(-5);
      expect(ghostMeshes[1].position.z).toBe(-3);
    });

    test('should handle empty mesh array', () => {
      const ghostMeshes: BabylonMesh[] = [];
      const offset: Vector3D = { x: -10, y: -5, z: -3 };
      
      // Should not throw error
      expect(() => applyGhostPositioning(ghostMeshes, offset)).not.toThrow();
    });

    test('should handle zero offset', () => {
      const ghostMeshes = [
        createMockMesh('ghost1', { min: { x: -2.5, y: -2.5, z: -2.5 }, max: { x: 2.5, y: 2.5, z: 2.5 } })
      ];
      
      const offset: Vector3D = { x: 0, y: 0, z: 0 };
      
      applyGhostPositioning(ghostMeshes, offset);
      
      expect(ghostMeshes[0].position.x).toBe(0);
      expect(ghostMeshes[0].position.y).toBe(0);
      expect(ghostMeshes[0].position.z).toBe(0);
    });
  });

  describe('calculateMeshBounds', () => {
    test('should calculate bounds for single mesh', () => {
      const meshes = [
        createMockMesh('mesh1', { min: { x: -2.5, y: -2.5, z: -2.5 }, max: { x: 2.5, y: 2.5, z: 2.5 } })
      ];
      
      const bounds = calculateMeshBounds(meshes);
      
      expect(bounds.min.x).toBe(-2.5);
      expect(bounds.min.y).toBe(-2.5);
      expect(bounds.min.z).toBe(-2.5);
      expect(bounds.max.x).toBe(2.5);
      expect(bounds.max.y).toBe(2.5);
      expect(bounds.max.z).toBe(2.5);
    });

    test('should calculate combined bounds for multiple meshes', () => {
      const meshes = [
        createMockMesh('mesh1', { min: { x: -2.5, y: -2.5, z: -2.5 }, max: { x: 2.5, y: 2.5, z: 2.5 } }),
        createMockMesh('mesh2', { min: { x: 5, y: 5, z: 5 }, max: { x: 10, y: 10, z: 10 } })
      ];
      
      const bounds = calculateMeshBounds(meshes);
      
      expect(bounds.min.x).toBe(-2.5);
      expect(bounds.min.y).toBe(-2.5);
      expect(bounds.min.z).toBe(-2.5);
      expect(bounds.max.x).toBe(10);
      expect(bounds.max.y).toBe(10);
      expect(bounds.max.z).toBe(10);
    });

    test('should handle empty mesh array', () => {
      const meshes: BabylonMesh[] = [];
      
      const bounds = calculateMeshBounds(meshes);
      
      // Should return default bounds
      expect(bounds.min.x).toBe(0);
      expect(bounds.min.y).toBe(0);
      expect(bounds.min.z).toBe(0);
      expect(bounds.max.x).toBe(0);
      expect(bounds.max.y).toBe(0);
      expect(bounds.max.z).toBe(0);
    });
  });

  describe('calculateOptimalCameraPosition', () => {
    test('should calculate camera position for combined bounds', () => {
      const combinedBounds: BoundingBox = {
        min: { x: -10, y: -5, z: -3 },
        max: { x: 15, y: 10, z: 8 }
      };
      
      const cameraPosition = calculateOptimalCameraPosition(combinedBounds);
      
      // Camera should be positioned to view all objects
      expect(cameraPosition.center.x).toBe(2.5); // Center between -10 and 15
      expect(cameraPosition.center.y).toBe(2.5); // Center between -5 and 10
      expect(cameraPosition.center.z).toBe(2.5); // Center between -3 and 8
      
      // Distance should be proportional to the largest dimension
      expect(cameraPosition.distance).toBeGreaterThan(0);
      expect(cameraPosition.position.x).toBeGreaterThan(cameraPosition.center.x);
      expect(cameraPosition.position.y).toBeGreaterThan(cameraPosition.center.y);
      expect(cameraPosition.position.z).toBeGreaterThan(cameraPosition.center.z);
    });

    test('should handle small bounds', () => {
      const combinedBounds: BoundingBox = {
        min: { x: -1, y: -1, z: -1 },
        max: { x: 1, y: 1, z: 1 }
      };
      
      const cameraPosition = calculateOptimalCameraPosition(combinedBounds);
      
      // Should have minimum distance for small objects
      expect(cameraPosition.distance).toBeGreaterThan(10); // Minimum distance
    });

    test('should handle zero-size bounds', () => {
      const combinedBounds: BoundingBox = {
        min: { x: 0, y: 0, z: 0 },
        max: { x: 0, y: 0, z: 0 }
      };
      
      const cameraPosition = calculateOptimalCameraPosition(combinedBounds);
      
      // Should handle degenerate case gracefully
      expect(cameraPosition.center.x).toBe(0);
      expect(cameraPosition.center.y).toBe(0);
      expect(cameraPosition.center.z).toBe(0);
      expect(cameraPosition.distance).toBeGreaterThan(0);
    });
  });
});
