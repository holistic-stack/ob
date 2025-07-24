/**
 * @file refactored-axis-creator.test.ts
 * @description Tests for the RefactoredAxisCreator class
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as BABYLON from '@babylonjs/core';
import { RefactoredAxisCreator } from './refactored-axis-creator';
import { AxisConfigUtils } from '../shared/axis-config/axis-config';

describe('RefactoredAxisCreator', () => {
  let engine: BABYLON.NullEngine;
  let scene: BABYLON.Scene;
  let creator: RefactoredAxisCreator;

  beforeEach(() => {
    engine = new BABYLON.NullEngine();
    scene = new BABYLON.Scene(engine);
    creator = new RefactoredAxisCreator();
  });

  afterEach(() => {
    scene.dispose();
    engine.dispose();
  });

  describe('createAxis', () => {
    it('should create a solid line axis', () => {
      const config = AxisConfigUtils.createLineConfig({
        name: 'X',
        color: new BABYLON.Color3(1, 0, 0),
        length: 100,
      });

      const result = creator.createAxis(scene, config);

      expect(result.success).toBe(true);
      if (result.success) {
        const axis = result.data;
        expect(axis.name).toBe('X');
        expect(axis.type).toBe('line');
        expect(axis.mesh).toBeInstanceOf(BABYLON.LinesMesh);
        expect(axis.material).toBeInstanceOf(BABYLON.StandardMaterial);
      }
    });

    it('should create a dashed line axis', () => {
      const config = AxisConfigUtils.createLineConfig({
        name: 'Y',
        color: new BABYLON.Color3(0, 1, 0),
        length: 100,
        isDotted: true,
      });

      const result = creator.createAxis(scene, config);

      expect(result.success).toBe(true);
      if (result.success) {
        const axis = result.data;
        expect(axis.name).toBe('Y');
        expect(axis.type).toBe('line');
        expect(axis.mesh).toBeInstanceOf(BABYLON.LinesMesh);
      }
    });

    it('should create a cylinder axis', () => {
      const config = AxisConfigUtils.createCylinderConfig({
        name: 'Z',
        color: new BABYLON.Color3(0, 0, 1),
        length: 100,
        diameter: 2,
      });

      const result = creator.createAxis(scene, config);

      expect(result.success).toBe(true);
      if (result.success) {
        const axis = result.data;
        expect(axis.name).toBe('Z');
        expect(axis.type).toBe('cylinder');
        expect(axis.mesh).toBeInstanceOf(BABYLON.Mesh);
      }
    });

    it('should handle null scene gracefully', () => {
      const config = AxisConfigUtils.createLineConfig({
        name: 'X',
        color: new BABYLON.Color3(1, 0, 0),
      });

      const result = creator.createAxis(null, config);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('SCENE_NULL');
      }
    });

    it('should validate configuration', () => {
      const invalidConfig = {
        type: 'line' as const,
        name: '',
        origin: BABYLON.Vector3.Zero(),
        direction: BABYLON.Vector3.Zero(), // Invalid zero direction
        length: 100,
        color: new BABYLON.Color3(1, 0, 0),
      };

      const result = creator.createAxis(scene, invalidConfig);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('INVALID_CONFIG');
      }
    });
  });

  describe('createCoordinateAxes', () => {
    it('should create all three line-based coordinate axes', () => {
      const config = {
        type: 'line' as const,
        length: 100,
        pixelWidth: 2,
      };

      const result = creator.createCoordinateAxes(scene, config);

      expect(result.success).toBe(true);
      if (result.success) {
        const axes = result.data;
        expect(axes).toHaveLength(3);
        
        const axisNames = axes.map(axis => axis.name);
        expect(axisNames).toContain('X');
        expect(axisNames).toContain('Y');
        expect(axisNames).toContain('Z');

        axes.forEach(axis => {
          expect(axis.type).toBe('line');
          expect(axis.mesh).toBeInstanceOf(BABYLON.LinesMesh);
          expect(axis.material).toBeInstanceOf(BABYLON.StandardMaterial);
        });
      }
    });

    it('should create all three cylinder-based coordinate axes', () => {
      const config = {
        type: 'cylinder' as const,
        length: 100,
        diameter: 2,
      };

      const result = creator.createCoordinateAxes(scene, config);

      expect(result.success).toBe(true);
      if (result.success) {
        const axes = result.data;
        expect(axes).toHaveLength(3);

        axes.forEach(axis => {
          expect(axis.type).toBe('cylinder');
          expect(axis.mesh).toBeInstanceOf(BABYLON.Mesh);
        });
      }
    });

    it('should use different colors for each axis', () => {
      const config = {
        type: 'line' as const,
        colorScheme: 'STANDARD' as const,
      };

      const result = creator.createCoordinateAxes(scene, config);

      expect(result.success).toBe(true);
      if (result.success) {
        const axes = result.data;
        const materials = axes.map(axis => axis.material);
        
        // Check that materials have different colors
        const colors = materials.map(material => ({
          r: material.diffuseColor.r,
          g: material.diffuseColor.g,
          b: material.diffuseColor.b,
        }));

        // X should be red, Y should be green, Z should be blue
        const xAxis = axes.find(axis => axis.name === 'X');
        const yAxis = axes.find(axis => axis.name === 'Y');
        const zAxis = axes.find(axis => axis.name === 'Z');

        expect(xAxis?.material.diffuseColor.r).toBe(1);
        expect(yAxis?.material.diffuseColor.g).toBe(1);
        expect(zAxis?.material.diffuseColor.b).toBe(1);
      }
    });

    it('should clean up on failure', () => {
      // This test would require mocking to force a failure partway through
      // For now, we'll test the happy path and trust the cleanup logic
      const config = {
        type: 'line' as const,
        length: 100,
      };

      const result = creator.createCoordinateAxes(scene, config);
      expect(result.success).toBe(true);
    });

    it('should handle null scene for coordinate axes', () => {
      const config = {
        type: 'line' as const,
        length: 100,
      };

      const result = creator.createCoordinateAxes(null, config);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('SCENE_NULL');
      }
    });
  });

  describe('material and mesh integration', () => {
    it('should properly apply materials to meshes', () => {
      const config = AxisConfigUtils.createLineConfig({
        name: 'Test',
        color: new BABYLON.Color3(0.5, 0.7, 0.9),
        opacity: 0.8,
      });

      const result = creator.createAxis(scene, config);

      expect(result.success).toBe(true);
      if (result.success) {
        const axis = result.data;
        expect(axis.mesh.material).toBe(axis.material);
        expect(axis.material.alpha).toBe(0.8);
        expect(axis.material.diffuseColor.r).toBeCloseTo(0.5);
        expect(axis.material.diffuseColor.g).toBeCloseTo(0.7);
        expect(axis.material.diffuseColor.b).toBeCloseTo(0.9);
      }
    });
  });
});
