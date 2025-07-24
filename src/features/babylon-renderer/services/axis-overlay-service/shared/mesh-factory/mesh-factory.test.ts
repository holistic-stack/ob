/**
 * @file mesh-factory.test.ts
 * @description Tests for the MeshFactory class
 */

import * as BABYLON from '@babylonjs/core';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { MeshFactory } from './mesh-factory';

describe('MeshFactory', () => {
  let engine: BABYLON.NullEngine;
  let scene: BABYLON.Scene;
  let factory: MeshFactory;

  beforeEach(() => {
    engine = new BABYLON.NullEngine();
    scene = new BABYLON.Scene(engine);
    factory = new MeshFactory();
  });

  afterEach(() => {
    scene.dispose();
    engine.dispose();
  });

  describe('createSolidLine', () => {
    it('should create a solid line mesh with correct properties', () => {
      const config = {
        name: 'TestLine',
        points: [BABYLON.Vector3.Zero(), new BABYLON.Vector3(100, 0, 0)],
      };

      const result = factory.createSolidLine(scene, config);

      expect(result.success).toBe(true);
      if (result.success) {
        const mesh = result.data;
        expect(mesh.name).toBe('TestLine');
        expect(mesh).toBeInstanceOf(BABYLON.LinesMesh);
      }
    });

    it('should handle null scene gracefully', () => {
      const config = {
        name: 'TestLine',
        points: [BABYLON.Vector3.Zero(), new BABYLON.Vector3(100, 0, 0)],
      };

      const result = factory.createSolidLine(null, config);

      expect(result.success).toBe(false);
      if (!result.success && result.error) {
        expect(result.error.type).toBe('SCENE_NULL');
      }
    });

    it('should reject invalid point configurations', () => {
      const config = {
        name: 'TestLine',
        points: [BABYLON.Vector3.Zero()], // Only one point
      };

      const result = factory.createSolidLine(scene, config);

      expect(result.success).toBe(false);
      if (!result.success && result.error) {
        expect(result.error.type).toBe('INVALID_POINTS');
      }
    });
  });

  describe('createDashedLine', () => {
    it('should create a dashed line mesh with default dash properties', () => {
      const config = {
        name: 'TestDashedLine',
        points: [BABYLON.Vector3.Zero(), new BABYLON.Vector3(0, 100, 0)],
      };

      const result = factory.createDashedLine(scene, config);

      expect(result.success).toBe(true);
      if (result.success) {
        const mesh = result.data;
        expect(mesh.name).toBe('TestDashedLine');
        expect(mesh).toBeInstanceOf(BABYLON.LinesMesh);
      }
    });

    it('should create a dashed line with custom dash properties', () => {
      const config = {
        name: 'CustomDashedLine',
        points: [BABYLON.Vector3.Zero(), new BABYLON.Vector3(0, 0, 100)],
        dashSize: 0.5,
        gapSize: 1.5,
        dashNb: 50,
      };

      const result = factory.createDashedLine(scene, config);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('CustomDashedLine');
      }
    });

    it('should handle invalid points for dashed lines', () => {
      const config = {
        name: 'InvalidDashedLine',
        points: [], // No points
      };

      const result = factory.createDashedLine(scene, config);

      expect(result.success).toBe(false);
      if (!result.success && result.error) {
        expect(result.error.type).toBe('INVALID_POINTS');
      }
    });
  });

  describe('createCylinder', () => {
    it('should create a cylinder mesh with correct properties', () => {
      const config = {
        name: 'TestCylinder',
        height: 100,
        diameter: 2,
        tessellation: 16,
      };

      const result = factory.createCylinder(scene, config);

      expect(result.success).toBe(true);
      if (result.success) {
        const mesh = result.data;
        expect(mesh.name).toBe('TestCylinder');
        expect(mesh).toBeInstanceOf(BABYLON.Mesh);
      }
    });

    it('should apply position and rotation when provided', () => {
      const position = new BABYLON.Vector3(10, 20, 30);
      const rotation = new BABYLON.Vector3(0, Math.PI / 2, 0);

      const config = {
        name: 'PositionedCylinder',
        height: 50,
        diameter: 1,
        position,
        rotation,
      };

      const result = factory.createCylinder(scene, config);

      expect(result.success).toBe(true);
      if (result.success) {
        const mesh = result.data;
        expect(mesh.position.x).toBe(10);
        expect(mesh.position.y).toBe(20);
        expect(mesh.position.z).toBe(30);
        expect(mesh.rotation.y).toBeCloseTo(Math.PI / 2);
      }
    });

    it('should use default tessellation when not provided', () => {
      const config = {
        name: 'DefaultCylinder',
        height: 100,
        diameter: 2,
      };

      const result = factory.createCylinder(scene, config);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('DefaultCylinder');
      }
    });

    it('should handle null scene for cylinder creation', () => {
      const config = {
        name: 'TestCylinder',
        height: 100,
        diameter: 2,
      };

      const result = factory.createCylinder(null, config);

      expect(result.success).toBe(false);
      if (!result.success && result.error) {
        expect(result.error.type).toBe('SCENE_NULL');
      }
    });
  });
});
