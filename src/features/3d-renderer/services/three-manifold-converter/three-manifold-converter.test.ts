/**
 * @file Three.js to Manifold Converter Tests
 * @description TDD tests for converting Three.js BufferGeometry to Manifold objects
 * Following project guidelines: no mocks, real implementations, Result<T,E> patterns
 */

import * as THREE from 'three';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import type { Result } from '../../../../shared/types/result.types';
import { convertThreeToManifold } from './three-manifold-converter';

describe('ThreeManifoldConverter', () => {
  // Following project guidelines: no mocks, real implementations

  test('should convert Three.js BoxGeometry to Manifold object', async () => {
    const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);

    const result = await convertThreeToManifold(cubeGeometry);

    if (!result.success) {
      console.log('Conversion failed:', result.error);
    }

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBeDefined();
      expect(typeof result.data.transform).toBe('function');
      expect(typeof result.data._GetMeshJS).toBe('function');
      expect(typeof result.data.add).toBe('function');
    }
  });

  test('should handle invalid geometry gracefully', async () => {
    const invalidGeometry = new THREE.BufferGeometry(); // Empty geometry

    const result = await convertThreeToManifold(invalidGeometry);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('position attribute');
    }
  });

  test('should create a valid Manifold object', async () => {
    const sphereGeometry = new THREE.SphereGeometry(1, 8, 6);

    const result = await convertThreeToManifold(sphereGeometry);

    expect(result.success).toBe(true);
    if (result.success) {
      // For now, just verify the object has the expected methods
      expect(typeof result.data.transform).toBe('function');
      expect(typeof result.data.add).toBe('function');
    }
  });

  test('should handle cleanup properly', async () => {
    const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);

    const result = await convertThreeToManifold(cubeGeometry);

    expect(result.success).toBe(true);
    if (result.success) {
      // Should not throw when cleaning up
      expect(() => result.data.delete()).not.toThrow();
    }
  });

  test('should validate geometry has position attribute', async () => {
    const geometryWithoutPosition = new THREE.BufferGeometry();
    // Don't add position attribute

    const result = await convertThreeToManifold(geometryWithoutPosition);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('position attribute');
    }
  });

  test('should handle geometry with zero vertices', async () => {
    const emptyGeometry = new THREE.BufferGeometry();
    emptyGeometry.setAttribute('position', new THREE.Float32BufferAttribute([], 3));

    const result = await convertThreeToManifold(emptyGeometry);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('no vertices');
    }
  });

  test('should handle indexed geometry correctly', async () => {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    // BoxGeometry is indexed by default
    expect(geometry.getIndex()).not.toBeNull();

    const result = await convertThreeToManifold(geometry);

    expect(result.success).toBe(true);
    if (result.success) {
      // For now, just verify the object is created successfully
      expect(result.data).toBeDefined();
      expect(typeof result.data.transform).toBe('function');
    }
  });

  test('should handle non-indexed geometry correctly', async () => {
    const geometry = new THREE.SphereGeometry(1, 8, 6);
    // Convert to non-indexed
    const nonIndexedGeometry = geometry.toNonIndexed();
    expect(nonIndexedGeometry.getIndex()).toBeNull();

    const result = await convertThreeToManifold(nonIndexedGeometry);

    expect(result.success).toBe(true);
    if (result.success) {
      // For now, just verify the object is created successfully
      expect(result.data).toBeDefined();
      expect(typeof result.data.transform).toBe('function');
    }
  });

  test('should maintain immutability of input geometry', async () => {
    const originalGeometry = new THREE.BoxGeometry(1, 1, 1);
    const originalPositions = originalGeometry.getAttribute('position').array.slice();

    await convertThreeToManifold(originalGeometry);

    // Original geometry should be unchanged
    const currentPositions = originalGeometry.getAttribute('position').array;
    expect(currentPositions).toEqual(originalPositions);
  });

  test('should provide meaningful error messages', async () => {
    const nullGeometry = null as any;

    const result = await convertThreeToManifold(nullGeometry);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('null or undefined');
    }
  });

  // Tests for transformation methods (Step 1.2)
  describe('Transformation Methods', () => {
    test('should support translate transformation', async () => {
      const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
      const result = await convertThreeToManifold(cubeGeometry);

      expect(result.success).toBe(true);
      if (result.success) {
        // Test that transform method exists and can be called
        expect(typeof result.data.transform).toBe('function');

        // For now, just verify the method exists
        // In Step 1.2, we'll add helper methods for translate, rotate, scale
      }
    });

    test('should support matrix transformation', async () => {
      const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
      const result = await convertThreeToManifold(cubeGeometry);

      expect(result.success).toBe(true);
      if (result.success) {
        // Test matrix transformation capability
        const identityMatrix = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

        // This should work with the existing transform method
        const transformedResult = result.data.transform(identityMatrix);
        expect(transformedResult).toBeDefined();
      }
    });
  });

  afterEach(() => {
    // Clean up any Three.js resources
    // Note: Manifold objects should be cleaned up by the caller
  });
});
