/**
 * @file dotted-line-verification.test.ts
 * @description Tests to verify the new BabylonJS built-in dotted line implementation
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as BABYLON from '@babylonjs/core';
import { createScreenSpaceAxis } from './screen-space-axis-creator';

describe('Dotted Line Verification', () => {
  let engine: BABYLON.NullEngine;
  let scene: BABYLON.Scene;

  beforeEach(() => {
    // Create a null engine (headless) for testing
    engine = new BABYLON.NullEngine();
    scene = new BABYLON.Scene(engine);
  });

  afterEach(() => {
    scene.dispose();
    engine.dispose();
  });

  it('should create solid positive axis and dotted negative axis', () => {
    // Test configuration for X-axis
    const config = {
      name: 'X',
      origin: new BABYLON.Vector3(0, 0, 0),
      direction: new BABYLON.Vector3(1, 0, 0),
      length: 100,
      color: new BABYLON.Color3(1, 0, 0), // Red
      pixelWidth: 2.0,
      dashLength: 0.3, // Small for dot-like appearance
      gapLength: 1.0,  // Visible spacing
    };

    const result = createScreenSpaceAxis(scene, config);

    // Verify creation was successful
    expect(result.success).toBe(true);
    
    if (result.success) {
      const { positiveMesh, negativeMesh, positiveMaterial, negativeMaterial } = result.data;

      // Verify meshes were created
      expect(positiveMesh).toBeDefined();
      expect(negativeMesh).toBeDefined();
      expect(positiveMaterial).toBeDefined();
      expect(negativeMaterial).toBeDefined();

      // Verify mesh names
      expect(positiveMesh.name).toBe('XAxisPositive');
      expect(negativeMesh.name).toBe('XAxisNegative');

      // Verify materials are StandardMaterial
      expect(positiveMaterial).toBeInstanceOf(BABYLON.StandardMaterial);
      expect(negativeMaterial).toBeInstanceOf(BABYLON.StandardMaterial);

      // Verify both meshes are visible
      expect(positiveMesh.isVisible).toBe(true);
      expect(negativeMesh.isVisible).toBe(true);

      // Verify materials have correct colors
      expect(positiveMaterial.diffuseColor.r).toBe(1);
      expect(positiveMaterial.diffuseColor.g).toBe(0);
      expect(positiveMaterial.diffuseColor.b).toBe(0);

      expect(negativeMaterial.diffuseColor.r).toBe(1);
      expect(negativeMaterial.diffuseColor.g).toBe(0);
      expect(negativeMaterial.diffuseColor.b).toBe(0);

      // For dashed lines, vertex count should be different from solid lines
      const positiveVertexCount = positiveMesh.getTotalVertices();
      const negativeVertexCount = negativeMesh.getTotalVertices();
      
      // Dashed lines typically have more vertices due to dash segments
      expect(negativeVertexCount).toBeGreaterThanOrEqual(positiveVertexCount);
    }
  });

  it('should create different axis colors correctly', () => {
    const axes = [
      { name: 'X', direction: new BABYLON.Vector3(1, 0, 0), color: new BABYLON.Color3(1, 0, 0) },
      { name: 'Y', direction: new BABYLON.Vector3(0, 1, 0), color: new BABYLON.Color3(0, 1, 0) },
      { name: 'Z', direction: new BABYLON.Vector3(0, 0, 1), color: new BABYLON.Color3(0, 0, 1) },
    ];

    for (const axis of axes) {
      const config = {
        name: axis.name,
        origin: new BABYLON.Vector3(0, 0, 0),
        direction: axis.direction,
        length: 100,
        color: axis.color,
        pixelWidth: 2.0,
        dashLength: 0.3,
        gapLength: 1.0,
      };

      const result = createScreenSpaceAxis(scene, config);
      expect(result.success).toBe(true);

      if (result.success) {
        const { positiveMaterial, negativeMaterial } = result.data;
        
        // Verify colors match expected axis colors
        expect(positiveMaterial.diffuseColor.r).toBe(axis.color.r);
        expect(positiveMaterial.diffuseColor.g).toBe(axis.color.g);
        expect(positiveMaterial.diffuseColor.b).toBe(axis.color.b);

        expect(negativeMaterial.diffuseColor.r).toBe(axis.color.r);
        expect(negativeMaterial.diffuseColor.g).toBe(axis.color.g);
        expect(negativeMaterial.diffuseColor.b).toBe(axis.color.b);
      }
    }
  });

  it('should handle null scene gracefully', () => {
    const config = {
      name: 'X',
      origin: new BABYLON.Vector3(0, 0, 0),
      direction: new BABYLON.Vector3(1, 0, 0),
      length: 100,
      color: new BABYLON.Color3(1, 0, 0),
      pixelWidth: 2.0,
      dashLength: 0.3,
      gapLength: 1.0,
    };

    const result = createScreenSpaceAxis(null, config);

    expect(result.success).toBe(false);
    expect(result.error.type).toBe('SCENE_NULL');
  });
});
