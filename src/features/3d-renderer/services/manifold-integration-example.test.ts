/**
 * @file Manifold Integration Example
 * @description Demonstrates how the new Three.js to Manifold converter and transformation helpers work together
 * This serves as both a test and documentation for the completed Phase 1 utilities
 */

import * as THREE from 'three';
import { describe, expect, test } from 'vitest';
import {
  rotateManifold,
  scaleManifold,
  translateManifold,
} from './manifold-transformation-helpers/manifold-transformation-helpers';
import { convertThreeToManifold } from './three-manifold-converter/three-manifold-converter';

describe('Manifold Integration Example', () => {
  test('should demonstrate complete Three.js to Manifold workflow', async () => {
    // Step 1: Create a Three.js geometry
    const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);

    // Step 2: Convert to Manifold object
    const manifoldResult = await convertThreeToManifold(cubeGeometry);
    expect(manifoldResult.success).toBe(true);

    if (manifoldResult.success) {
      let currentManifold = manifoldResult.data;

      // Step 3: Apply transformations using helper functions

      // Translate the cube
      const translateResult = translateManifold(currentManifold, [2, 3, 4]);
      expect(translateResult.success).toBe(true);
      if (translateResult.success) {
        currentManifold = translateResult.data;
      }

      // Scale the cube
      const scaleResult = scaleManifold(currentManifold, [2, 1, 0.5]);
      expect(scaleResult.success).toBe(true);
      if (scaleResult.success) {
        currentManifold = scaleResult.data;
      }

      // Rotate the cube around Z-axis
      const rotateResult = rotateManifold(currentManifold, [0, 0, 1], Math.PI / 4);
      expect(rotateResult.success).toBe(true);
      if (rotateResult.success) {
        currentManifold = rotateResult.data;
      }

      // Step 4: Verify the final object has expected methods
      expect(typeof currentManifold.add).toBe('function');
      expect(typeof currentManifold.subtract).toBe('function');
      expect(typeof currentManifold.intersect).toBe('function');
      expect(typeof currentManifold.transform).toBe('function');

      // This demonstrates that the transformed object is ready for CSG operations
      console.log(
        '✅ Successfully created and transformed Manifold object ready for CSG operations'
      );
    }
  });

  test('should handle error cases gracefully', async () => {
    // Test error handling in the workflow
    const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
    const manifoldResult = await convertThreeToManifold(cubeGeometry);

    expect(manifoldResult.success).toBe(true);
    if (manifoldResult.success) {
      // Test invalid transformation
      const invalidTranslateResult = translateManifold(manifoldResult.data, [1, 2] as any);
      expect(invalidTranslateResult.success).toBe(false);
      expect(invalidTranslateResult.error).toContain('translation vector');

      // Test invalid rotation
      const invalidRotateResult = rotateManifold(manifoldResult.data, [0, 0, 0], Math.PI);
      expect(invalidRotateResult.success).toBe(false);
      expect(invalidRotateResult.error).toContain('rotation axis');

      // Test invalid scale
      const invalidScaleResult = scaleManifold(manifoldResult.data, [1, 0, 1]);
      expect(invalidScaleResult.success).toBe(false);
      expect(invalidScaleResult.error).toContain('scale factor');
    }
  });

  test('should demonstrate performance with complex geometry', async () => {
    // Test with more complex geometry
    const sphereGeometry = new THREE.SphereGeometry(1, 32, 16); // Higher resolution

    const startTime = performance.now();

    const manifoldResult = await convertThreeToManifold(sphereGeometry);
    expect(manifoldResult.success).toBe(true);

    if (manifoldResult.success) {
      // Apply multiple transformations
      const translateResult = translateManifold(manifoldResult.data, [1, 1, 1]);
      expect(translateResult.success).toBe(true);

      if (translateResult.success) {
        const scaleResult = scaleManifold(translateResult.data, [1.5, 1.5, 1.5]);
        expect(scaleResult.success).toBe(true);
      }
    }

    const endTime = performance.now();
    const processingTime = endTime - startTime;

    // Should complete within reasonable time (adjust threshold as needed)
    expect(processingTime).toBeLessThan(1000); // 1 second

    console.log(`✅ Complex geometry processing completed in ${processingTime.toFixed(2)}ms`);
  });
});
