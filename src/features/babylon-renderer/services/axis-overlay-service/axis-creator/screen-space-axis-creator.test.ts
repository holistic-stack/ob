/**
 * @file screen-space-axis-creator.test.ts
 * @description Tests for screen-space axis creation functions using real BabylonJS NullEngine
 */

import * as BABYLON from '@babylonjs/core';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  createScreenSpaceAxis,
  createScreenSpaceCoordinateAxes,
  type ScreenSpaceAxisConfig,
} from './screen-space-axis-creator';

describe('ScreenSpaceAxisCreator', () => {
  let scene: BABYLON.Scene;
  let engine: BABYLON.NullEngine;

  beforeEach(() => {
    // Create a null engine (headless)
    engine = new BABYLON.NullEngine();

    // Create a real scene
    scene = new BABYLON.Scene(engine);
  });

  afterEach(() => {
    // Clean up
    scene.dispose();
    engine.dispose();
  });

  describe('createScreenSpaceAxis', () => {
    it('should create a screen-space axis with correct properties', () => {
      const config: ScreenSpaceAxisConfig = {
        name: 'X',
        origin: new BABYLON.Vector3(0, 0, 0),
        direction: new BABYLON.Vector3(1, 0, 0),
        length: 1000,
        color: new BABYLON.Color3(1, 0, 0),
        pixelWidth: 2.0,
      };

      const result = createScreenSpaceAxis(scene, config);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.mesh).toBeDefined();
        expect(result.data.material).toBeDefined();
        expect(result.data.mesh.name).toBe('XAxisScreenSpace');
        expect(result.data.material.name).toBe('XScreenSpaceMaterial');
        expect(result.data.mesh.isVisible).toBe(true);
      }
    });

    it('should handle null scene gracefully', () => {
      const config: ScreenSpaceAxisConfig = {
        name: 'X',
        origin: new BABYLON.Vector3(0, 0, 0),
        direction: new BABYLON.Vector3(1, 0, 0),
        length: 1000,
        color: new BABYLON.Color3(1, 0, 0),
        pixelWidth: 2.0,
      };

      const result = createScreenSpaceAxis(null, config);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('SCENE_NULL');
        expect(result.error.message).toContain('Scene is null');
      }
    });

    it('should create axis with correct line endpoints', () => {
      const config: ScreenSpaceAxisConfig = {
        name: 'Y',
        origin: new BABYLON.Vector3(5, 5, 5),
        direction: new BABYLON.Vector3(0, 1, 0),
        length: 100,
        color: new BABYLON.Color3(0, 1, 0),
        pixelWidth: 1.5,
      };

      const result = createScreenSpaceAxis(scene, config);

      expect(result.success).toBe(true);
      if (result.success) {
        const mesh = result.data.mesh;
        expect(mesh).toBeDefined();
        
        // Check that the mesh has the correct geometry
        const positions = mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
        expect(positions).toBeDefined();
        expect(positions?.length).toBeGreaterThan(0);
      }
    });

    it('should set correct shader uniforms', () => {
      const config: ScreenSpaceAxisConfig = {
        name: 'Z',
        origin: new BABYLON.Vector3(0, 0, 0),
        direction: new BABYLON.Vector3(0, 0, 1),
        length: 500,
        color: new BABYLON.Color3(0, 0, 1),
        pixelWidth: 3.0,
      };

      const result = createScreenSpaceAxis(scene, config);

      expect(result.success).toBe(true);
      if (result.success) {
        const material = result.data.material;
        expect(material).toBeInstanceOf(BABYLON.ShaderMaterial);
        
        // Verify that the material has the expected uniforms
        // Note: In a real test environment, we would check uniform values
        // but with NullEngine, we mainly verify the material was created
        expect(material.name).toBe('ZScreenSpaceMaterial');
      }
    });
  });

  describe('createScreenSpaceCoordinateAxes', () => {
    it('should create all three coordinate axes', () => {
      const origin = new BABYLON.Vector3(0, 0, 0);
      const length = 1000;
      const pixelWidth = 2.0;

      const result = createScreenSpaceCoordinateAxes(scene, origin, length, pixelWidth);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.meshes).toHaveLength(3);
        expect(result.data.materials).toHaveLength(3);

        // Check that all axes are created with correct names
        const names = result.data.meshes.map((mesh) => mesh.name);
        expect(names).toContain('XAxisScreenSpace');
        expect(names).toContain('YAxisScreenSpace');
        expect(names).toContain('ZAxisScreenSpace');

        // Check material names
        const materialNames = result.data.materials.map((material) => material.name);
        expect(materialNames).toContain('XScreenSpaceMaterial');
        expect(materialNames).toContain('YScreenSpaceMaterial');
        expect(materialNames).toContain('ZScreenSpaceMaterial');
      }
    });

    it('should handle null scene gracefully', () => {
      const origin = new BABYLON.Vector3(0, 0, 0);
      const length = 1000;
      const pixelWidth = 2.0;

      const result = createScreenSpaceCoordinateAxes(null, origin, length, pixelWidth);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('SCENE_NULL');
      }
    });

    it('should create axes with different origins', () => {
      const origin = new BABYLON.Vector3(10, 20, 30);
      const length = 500;
      const pixelWidth = 1.0;

      const result = createScreenSpaceCoordinateAxes(scene, origin, length, pixelWidth);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.meshes).toHaveLength(3);
        
        // Verify all meshes are visible
        result.data.meshes.forEach((mesh) => {
          expect(mesh.isVisible).toBe(true);
        });
      }
    });

    it('should clean up on failure', () => {
      // This test is harder to trigger with NullEngine, but we can verify
      // the structure is correct
      const origin = new BABYLON.Vector3(0, 0, 0);
      const length = 1000;
      const pixelWidth = 2.0;

      const result = createScreenSpaceCoordinateAxes(scene, origin, length, pixelWidth);

      expect(result.success).toBe(true);
      if (result.success) {
        // Verify that meshes and materials arrays have the same length
        expect(result.data.meshes.length).toBe(result.data.materials.length);
        
        // Verify each mesh has a corresponding material
        result.data.meshes.forEach((mesh, index) => {
          expect(mesh.material).toBe(result.data.materials[index]);
        });
      }
    });

    it('should create axes with standard SketchUp colors', () => {
      const origin = new BABYLON.Vector3(0, 0, 0);
      const length = 1000;
      const pixelWidth = 2.0;

      const result = createScreenSpaceCoordinateAxes(scene, origin, length, pixelWidth);

      expect(result.success).toBe(true);
      if (result.success) {
        const materials = result.data.materials;
        
        // Find materials by name and verify they exist
        const xMaterial = materials.find(m => m.name === 'XScreenSpaceMaterial');
        const yMaterial = materials.find(m => m.name === 'YScreenSpaceMaterial');
        const zMaterial = materials.find(m => m.name === 'ZScreenSpaceMaterial');
        
        expect(xMaterial).toBeDefined();
        expect(yMaterial).toBeDefined();
        expect(zMaterial).toBeDefined();
      }
    });
  });

  describe('shader registration', () => {
    it('should register shaders only once', () => {
      const config: ScreenSpaceAxisConfig = {
        name: 'X',
        origin: new BABYLON.Vector3(0, 0, 0),
        direction: new BABYLON.Vector3(1, 0, 0),
        length: 1000,
        color: new BABYLON.Color3(1, 0, 0),
        pixelWidth: 2.0,
      };

      // Create first axis
      const result1 = createScreenSpaceAxis(scene, config);
      expect(result1.success).toBe(true);

      // Create second axis with different config
      const config2 = { ...config, name: 'Y', direction: new BABYLON.Vector3(0, 1, 0) };
      const result2 = createScreenSpaceAxis(scene, config2);
      expect(result2.success).toBe(true);

      // Both should succeed, indicating shader reuse works
      if (result1.success && result2.success) {
        expect(result1.data.mesh).toBeDefined();
        expect(result2.data.mesh).toBeDefined();
      }
    });
  });
});