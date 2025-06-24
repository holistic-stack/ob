/**
 * @file R3F Camera Service Tests
 * 
 * TDD tests for the R3F camera service providing equivalent functionality
 * to Babylon.js camera system. Tests bounds calculation, camera positioning,
 * mesh framing, and camera reset functionality.
 * 
 * @author OpenSCAD-R3F Pipeline
 * @version 1.0.0
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as THREE from 'three';
import {
  calculateMeshBounds,
  calculateSceneBounds,
  calculateOptimalPosition,
  positionCameraForMesh,
  positionCameraForScene,
  resetCamera,
  applyCameraPosition,
  r3fCameraService
} from './r3f-camera-service';

describe('R3F Camera Service', () => {
  let camera: THREE.PerspectiveCamera;
  let mesh: THREE.Mesh;
  let scene: THREE.Scene;

  beforeEach(() => {
    console.log('[DEBUG] Setting up R3F camera service test');
    
    // Create test camera
    camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    camera.position.set(10, 10, 10);
    
    // Create test mesh
    const geometry = new THREE.BoxGeometry(2, 2, 2);
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    mesh = new THREE.Mesh(geometry, material);
    mesh.name = 'test-cube';
    
    // Create test scene
    scene = new THREE.Scene();
    scene.add(mesh);
    
    // Update world matrices
    mesh.updateMatrixWorld();
  });

  afterEach(() => {
    console.log('[DEBUG] Cleaning up R3F camera service test');
    
    // Dispose of geometries and materials
    if (mesh.geometry) mesh.geometry.dispose();
    if (mesh.material && !Array.isArray(mesh.material)) {
      mesh.material.dispose();
    }
  });

  describe('Bounds Calculation', () => {
    it('should calculate mesh bounds correctly', () => {
      console.log('[DEBUG] Testing mesh bounds calculation');

      const result = calculateMeshBounds(mesh);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.center).toEqual([0, 0, 0]);
        expect(result.data.size).toBe(2); // Box geometry size
        expect(result.data.min).toEqual([-1, -1, -1]);
        expect(result.data.max).toEqual([1, 1, 1]);
        expect(result.data.boundingBox).toBeInstanceOf(THREE.Box3);
        expect(result.data.boundingSphere).toBeInstanceOf(THREE.Sphere);
      }
    });

    it('should handle mesh with transform', () => {
      console.log('[DEBUG] Testing mesh bounds with transform');

      // Apply transform to mesh
      mesh.position.set(5, 5, 5);
      mesh.scale.set(2, 2, 2);
      mesh.updateMatrixWorld();

      const result = calculateMeshBounds(mesh);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.center).toEqual([5, 5, 5]);
        expect(result.data.size).toBe(4); // Scaled size
      }
    });

    it('should calculate scene bounds for multiple meshes', () => {
      console.log('[DEBUG] Testing scene bounds calculation');

      // Create second mesh
      const geometry2 = new THREE.SphereGeometry(1);
      const material2 = new THREE.MeshBasicMaterial({ color: 0xff0000 });
      const mesh2 = new THREE.Mesh(geometry2, material2);
      mesh2.position.set(5, 0, 0);
      mesh2.updateMatrixWorld();

      const meshes = [mesh, mesh2];
      const result = calculateSceneBounds(meshes);

      expect(result.success).toBe(true);
      if (result.success) {
        // Should encompass both meshes
        expect(result.data.center[0]).toBeCloseTo(2.5, 1); // Midpoint between 0 and 5
        expect(result.data.size).toBeGreaterThan(2);
      }
    });

    it('should handle invalid mesh input', () => {
      console.log('[DEBUG] Testing invalid mesh handling');

      const result = calculateMeshBounds(null as any);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('null or undefined');
      }
    });

    it('should handle empty meshes array', () => {
      console.log('[DEBUG] Testing empty meshes array');

      const result = calculateSceneBounds([]);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('No meshes provided');
      }
    });
  });

  describe('Camera Positioning', () => {
    it('should calculate optimal camera position', () => {
      console.log('[DEBUG] Testing optimal camera position calculation');

      const bounds = {
        center: [0, 0, 0] as const,
        size: 2,
        min: [-1, -1, -1] as const,
        max: [1, 1, 1] as const,
        boundingBox: new THREE.Box3(),
        boundingSphere: new THREE.Sphere()
      };

      const position = calculateOptimalPosition(bounds, 2.0);

      expect(position.target).toEqual([0, 0, 0]);
      expect(position.distance).toBe(4); // size * padding
      expect(position.position).toHaveLength(3);
      expect(position.spherical.radius).toBe(4);
    });

    it('should apply camera position correctly', () => {
      console.log('[DEBUG] Testing camera position application');

      const position = {
        position: [10, 10, 10] as const,
        target: [0, 0, 0] as const,
        distance: Math.sqrt(300),
        spherical: {
          radius: Math.sqrt(300),
          phi: Math.PI / 4,
          theta: Math.PI / 4
        }
      };

      const result = applyCameraPosition(camera, position);

      expect(result.success).toBe(true);
      expect(camera.position.toArray()).toEqual([10, 10, 10]);
    });

    it('should position camera for mesh', () => {
      console.log('[DEBUG] Testing camera positioning for mesh');

      const result = positionCameraForMesh(camera, mesh);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.target).toEqual([0, 0, 0]);
        expect(result.data.distance).toBeGreaterThan(0);
        expect(camera.position.length()).toBeGreaterThan(0);
      }
    });

    it('should position camera for scene', () => {
      console.log('[DEBUG] Testing camera positioning for scene');

      const meshes = [mesh];
      const result = positionCameraForScene(camera, meshes);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.target).toEqual([0, 0, 0]);
        expect(result.data.distance).toBeGreaterThan(0);
      }
    });

    it('should reset camera to default position', () => {
      console.log('[DEBUG] Testing camera reset');

      // Move camera away from default
      camera.position.set(100, 100, 100);

      const result = resetCamera(camera);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.position).toEqual([15, 15, 15]);
        expect(result.data.target).toEqual([0, 0, 0]);
        expect(camera.position.toArray()).toEqual([15, 15, 15]);
      }
    });

    it('should handle invalid camera input', () => {
      console.log('[DEBUG] Testing invalid camera handling');

      const result = resetCamera(null as any);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('null or undefined');
      }
    });
  });

  describe('Camera Controls Integration', () => {
    it('should work with mock controls', () => {
      console.log('[DEBUG] Testing camera controls integration');

      const mockControls = {
        target: new THREE.Vector3(0, 0, 0),
        object: camera,
        update: vi.fn(),
        reset: vi.fn(),
        saveState: vi.fn(),
        enabled: true
      };

      const position = {
        position: [5, 5, 5] as const,
        target: [1, 1, 1] as const,
        distance: Math.sqrt(48),
        spherical: {
          radius: Math.sqrt(48),
          phi: Math.PI / 4,
          theta: Math.PI / 4
        }
      };

      const result = applyCameraPosition(camera, position, mockControls);

      expect(result.success).toBe(true);
      expect(mockControls.update).toHaveBeenCalled();
      expect(mockControls.target.toArray()).toEqual([1, 1, 1]);
    });

    it('should handle controls without update method', () => {
      console.log('[DEBUG] Testing controls without update method');

      const mockControls = {
        target: new THREE.Vector3(0, 0, 0),
        object: camera,
        enabled: true
      };

      const position = {
        position: [5, 5, 5] as const,
        target: [0, 0, 0] as const,
        distance: Math.sqrt(75),
        spherical: {
          radius: Math.sqrt(75),
          phi: Math.PI / 4,
          theta: Math.PI / 4
        }
      };

      const result = applyCameraPosition(camera, position, mockControls);

      expect(result.success).toBe(true);
      expect(mockControls.target.toArray()).toEqual([0, 0, 0]);
    });
  });

  describe('Service Interface', () => {
    it('should provide complete service interface', () => {
      console.log('[DEBUG] Testing service interface completeness');

      expect(r3fCameraService.calculateMeshBounds).toBeDefined();
      expect(r3fCameraService.calculateSceneBounds).toBeDefined();
      expect(r3fCameraService.calculateOptimalPosition).toBeDefined();
      expect(r3fCameraService.positionCameraForMesh).toBeDefined();
      expect(r3fCameraService.positionCameraForScene).toBeDefined();
      expect(r3fCameraService.resetCamera).toBeDefined();
      expect(r3fCameraService.applyCameraPosition).toBeDefined();
    });

    it('should maintain function consistency', () => {
      console.log('[DEBUG] Testing function consistency');

      // Test that service functions match exported functions
      expect(r3fCameraService.calculateMeshBounds).toBe(calculateMeshBounds);
      expect(r3fCameraService.calculateSceneBounds).toBe(calculateSceneBounds);
      expect(r3fCameraService.calculateOptimalPosition).toBe(calculateOptimalPosition);
      expect(r3fCameraService.positionCameraForMesh).toBe(positionCameraForMesh);
      expect(r3fCameraService.positionCameraForScene).toBe(positionCameraForScene);
      expect(r3fCameraService.resetCamera).toBe(resetCamera);
      expect(r3fCameraService.applyCameraPosition).toBe(applyCameraPosition);
    });
  });

  describe('Error Handling', () => {
    it('should handle geometry computation errors', () => {
      console.log('[DEBUG] Testing geometry computation error handling');

      // Create mesh with invalid geometry
      const invalidMesh = new THREE.Mesh();
      invalidMesh.geometry = null as any;

      const result = calculateMeshBounds(invalidMesh);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('no geometry');
      }
    });

    it('should handle camera positioning errors', () => {
      console.log('[DEBUG] Testing camera positioning error handling');

      // Create invalid camera
      const invalidCamera = {} as THREE.Camera;

      const result = resetCamera(invalidCamera);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Invalid camera type');
      }
    });
  });
});
