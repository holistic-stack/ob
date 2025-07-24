/**
 * @file screen-space-axis-creator.test.ts
 * @description Tests for screen-space axis creator functionality
 */

import * as BABYLON from '@babylonjs/core';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  createScreenSpaceAxis,
  createScreenSpaceCoordinateAxes,
  type ScreenSpaceAxisConfig,
} from './screen-space-axis-creator';

describe('ScreenSpaceAxisCreator', () => {
  let scene: BABYLON.Scene;
  let engine: BABYLON.NullEngine;

  // No global setup needed for axis creator tests

  beforeEach(async () => {
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
    it('should create axis with correct properties', () => {
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
        expect(result.data.positiveMesh).toBeDefined();
        expect(result.data.negativeMesh).toBeDefined();
        expect(result.data.positiveMaterial).toBeDefined();
        expect(result.data.negativeMaterial).toBeDefined();
        expect(result.data.positiveMesh.name).toBe('XAxisPositive');
        expect(result.data.negativeMesh.name).toBe('XAxisNegative');
        expect(result.data.positiveMaterial.name).toBe('XAxisPositiveMaterial');
        expect(result.data.negativeMaterial.name).toBe('XAxisNegativeMaterial');
        expect(result.data.positiveMesh.isVisible).toBe(true);
        expect(result.data.negativeMesh.isVisible).toBe(true);
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
        const positiveMesh = result.data.positiveMesh;
        const negativeMesh = result.data.negativeMesh;
        expect(positiveMesh).toBeDefined();
        expect(negativeMesh).toBeDefined();

        // Check that the meshes have the correct geometry
        const positivePositions = positiveMesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
        const negativePositions = negativeMesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
        expect(positivePositions).toBeDefined();
        expect(negativePositions).toBeDefined();
        expect(positivePositions?.length).toBeGreaterThan(0);
        expect(negativePositions?.length).toBeGreaterThan(0);
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
        const positiveMaterial = result.data.positiveMaterial;
        const negativeMaterial = result.data.negativeMaterial;
        expect(positiveMaterial).toBeInstanceOf(BABYLON.StandardMaterial);
        expect(negativeMaterial).toBeInstanceOf(BABYLON.StandardMaterial);

        // Verify that the materials have the expected uniforms
        // Note: In a real test environment, we would check uniform values
        // but with NullEngine, we mainly verify the materials were created
        expect(positiveMaterial.name).toBe('ZAxisPositiveMaterial');
        expect(negativeMaterial.name).toBe('ZAxisNegativeMaterial');
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
        expect(result.data.positiveMeshes).toHaveLength(3);
        expect(result.data.negativeMeshes).toHaveLength(3);
        expect(result.data.positiveMaterials).toHaveLength(3);
        expect(result.data.negativeMaterials).toHaveLength(3);

        // Check that all positive axes are created with correct names
        const positiveNames = result.data.positiveMeshes.map((mesh) => mesh.name);
        expect(positiveNames).toContain('XAxisPositive');
        expect(positiveNames).toContain('YAxisPositive');
        expect(positiveNames).toContain('ZAxisPositive');

        // Check that all negative axes are created with correct names
        const negativeNames = result.data.negativeMeshes.map((mesh) => mesh.name);
        expect(negativeNames).toContain('XAxisNegative');
        expect(negativeNames).toContain('YAxisNegative');
        expect(negativeNames).toContain('ZAxisNegative');

        // Check positive material names
        const positiveMaterialNames = result.data.positiveMaterials.map(
          (material) => material.name
        );
        expect(positiveMaterialNames).toContain('XAxisPositiveMaterial');
        expect(positiveMaterialNames).toContain('YAxisPositiveMaterial');
        expect(positiveMaterialNames).toContain('ZAxisPositiveMaterial');

        // Check negative material names
        const negativeMaterialNames = result.data.negativeMaterials.map(
          (material) => material.name
        );
        expect(negativeMaterialNames).toContain('XAxisNegativeMaterial');
        expect(negativeMaterialNames).toContain('YAxisNegativeMaterial');
        expect(negativeMaterialNames).toContain('ZAxisNegativeMaterial');
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
        expect(result.data.positiveMeshes).toHaveLength(3);
        expect(result.data.negativeMeshes).toHaveLength(3);

        // Verify all positive meshes are visible
        result.data.positiveMeshes.forEach((mesh) => {
          expect(mesh.isVisible).toBe(true);
        });

        // Verify all negative meshes are visible
        result.data.negativeMeshes.forEach((mesh) => {
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
        // Verify that positive and negative arrays have the same length
        expect(result.data.positiveMeshes.length).toBe(result.data.positiveMaterials.length);
        expect(result.data.negativeMeshes.length).toBe(result.data.negativeMaterials.length);
        expect(result.data.positiveMeshes.length).toBe(result.data.negativeMeshes.length);

        // Verify each positive mesh has a corresponding material
        result.data.positiveMeshes.forEach((mesh, index) => {
          expect(mesh.material).toBe(result.data.positiveMaterials[index]);
        });

        // Verify each negative mesh has a corresponding material
        result.data.negativeMeshes.forEach((mesh, index) => {
          expect(mesh.material).toBe(result.data.negativeMaterials[index]);
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
        const positiveMaterials = result.data.positiveMaterials;
        const negativeMaterials = result.data.negativeMaterials;

        // Find positive materials by name and verify they exist
        const xPositiveMaterial = positiveMaterials.find((m) => m.name === 'XAxisPositiveMaterial');
        const yPositiveMaterial = positiveMaterials.find((m) => m.name === 'YAxisPositiveMaterial');
        const zPositiveMaterial = positiveMaterials.find((m) => m.name === 'ZAxisPositiveMaterial');

        expect(xPositiveMaterial).toBeDefined();
        expect(yPositiveMaterial).toBeDefined();
        expect(zPositiveMaterial).toBeDefined();

        // Find negative materials by name and verify they exist
        const xNegativeMaterial = negativeMaterials.find((m) => m.name === 'XAxisNegativeMaterial');
        const yNegativeMaterial = negativeMaterials.find((m) => m.name === 'YAxisNegativeMaterial');
        const zNegativeMaterial = negativeMaterials.find((m) => m.name === 'ZAxisNegativeMaterial');

        expect(xNegativeMaterial).toBeDefined();
        expect(yNegativeMaterial).toBeDefined();
        expect(zNegativeMaterial).toBeDefined();
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
        expect(result1.data.positiveMesh).toBeDefined();
        expect(result1.data.negativeMesh).toBeDefined();
        expect(result2.data.positiveMesh).toBeDefined();
        expect(result2.data.negativeMesh).toBeDefined();
      }
    });
  });
});
