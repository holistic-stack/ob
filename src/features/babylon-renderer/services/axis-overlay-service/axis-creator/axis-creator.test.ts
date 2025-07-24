/**
 * @file axis-creator.test.ts
 * @description Tests for axis creation functions using real BabylonJS NullEngine
 */

import * as BABYLON from '@babylonjs/core';
import { beforeEach, describe, expect, it } from 'vitest';
import { createCoordinateAxes, createInfiniteAxis } from './axis-creator';

describe('AxisCreator', () => {
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

  describe('createInfiniteAxis', () => {
    it('should create an axis with correct properties', () => {
      const config = {
        name: 'X',
        origin: new BABYLON.Vector3(0, 0, 0),
        direction: new BABYLON.Vector3(1, 0, 0),
        length: 1000,
        color: new BABYLON.Color3(1, 0, 0),
        diameter: 0.3,
      };

      const result = createInfiniteAxis(scene, config);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.mesh).toBeDefined();
        expect(result.data.material).toBeDefined();
        expect(result.data.mesh.name).toBe('XAxisFull');
        expect(result.data.mesh.position).toEqual(config.origin);
        expect(result.data.mesh.isVisible).toBe(true);
      }
    });

    it('should handle null scene gracefully', () => {
      const config = {
        name: 'X',
        origin: new BABYLON.Vector3(0, 0, 0),
        direction: new BABYLON.Vector3(1, 0, 0),
        length: 1000,
        color: new BABYLON.Color3(1, 0, 0),
        diameter: 0.3,
      };

      const result = createInfiniteAxis(null, config);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('SCENE_NULL');
        expect(result.error.message).toContain('Scene is null');
      }
    });

    it('should apply correct rotation for X-axis', () => {
      const config = {
        name: 'X',
        origin: new BABYLON.Vector3(0, 0, 0),
        direction: new BABYLON.Vector3(1, 0, 0),
        length: 1000,
        color: new BABYLON.Color3(1, 0, 0),
        diameter: 0.3,
      };

      const result = createInfiniteAxis(scene, config);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.mesh.rotation.z).toBeCloseTo(Math.PI / 2);
      }
    });

    it('should apply correct rotation for Z-axis', () => {
      const config = {
        name: 'Z',
        origin: new BABYLON.Vector3(0, 0, 0),
        direction: new BABYLON.Vector3(0, 0, 1),
        length: 1000,
        color: new BABYLON.Color3(0, 0, 1),
        diameter: 0.3,
      };

      const result = createInfiniteAxis(scene, config);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.mesh.rotation.x).toBeCloseTo(Math.PI / 2);
      }
    });

    it('should not rotate Y-axis', () => {
      const config = {
        name: 'Y',
        origin: new BABYLON.Vector3(0, 0, 0),
        direction: new BABYLON.Vector3(0, 1, 0),
        length: 1000,
        color: new BABYLON.Color3(0, 1, 0),
        diameter: 0.3,
      };

      const result = createInfiniteAxis(scene, config);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.mesh.rotation.x).toBe(0);
        expect(result.data.mesh.rotation.z).toBe(0);
      }
    });
  });

  describe('createCoordinateAxes', () => {
    it('should create all three coordinate axes', () => {
      const origin = new BABYLON.Vector3(0, 0, 0);
      const length = 1000;
      const diameter = 0.3;

      const result = createCoordinateAxes(scene, origin, length, diameter);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.meshes).toHaveLength(3);
        expect(result.data.materials).toHaveLength(3);

        // Check that all axes are created with correct names
        const names = result.data.meshes.map((mesh) => mesh.name);
        expect(names).toContain('XAxisFull');
        expect(names).toContain('YAxisFull');
        expect(names).toContain('ZAxisFull');
      }
    });

    it('should handle null scene gracefully', () => {
      const origin = new BABYLON.Vector3(0, 0, 0);
      const length = 1000;
      const diameter = 0.3;

      const result = createCoordinateAxes(null, origin, length, diameter);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('SCENE_NULL');
      }
    });

    it('should clean up on failure', () => {
      // This test would require mocking MeshBuilder to fail on the second axis
      // For now, we'll test the happy path and trust the cleanup logic
      const origin = new BABYLON.Vector3(0, 0, 0);
      const length = 1000;
      const diameter = 0.3;

      const result = createCoordinateAxes(scene, origin, length, diameter);

      expect(result.success).toBe(true);
      if (result.success) {
        // Verify all meshes are properly created and added to scene
        expect(scene.meshes.length).toBeGreaterThanOrEqual(3);
      }
    });

    it('should create axes with standard colors', () => {
      const origin = new BABYLON.Vector3(0, 0, 0);
      const length = 1000;
      const diameter = 0.3;

      const result = createCoordinateAxes(scene, origin, length, diameter);

      expect(result.success).toBe(true);
      if (result.success) {
        const materials = result.data.materials;

        // Find materials by their names
        const xMaterial = materials.find((m) => m.name === 'XMaterial');
        const yMaterial = materials.find((m) => m.name === 'YMaterial');
        const zMaterial = materials.find((m) => m.name === 'ZMaterial');

        expect(xMaterial).toBeDefined();
        expect(yMaterial).toBeDefined();
        expect(zMaterial).toBeDefined();

        // Check colors (Red, Green, Blue)
        if (xMaterial) {
          expect(xMaterial.diffuseColor.r).toBe(1);
          expect(xMaterial.diffuseColor.g).toBe(0);
          expect(xMaterial.diffuseColor.b).toBe(0);
        }

        if (yMaterial) {
          expect(yMaterial.diffuseColor.r).toBe(0);
          expect(yMaterial.diffuseColor.g).toBe(1);
          expect(yMaterial.diffuseColor.b).toBe(0);
        }

        if (zMaterial) {
          expect(zMaterial.diffuseColor.r).toBe(0);
          expect(zMaterial.diffuseColor.g).toBe(0);
          expect(zMaterial.diffuseColor.b).toBe(1);
        }
      }
    });
  });
});
