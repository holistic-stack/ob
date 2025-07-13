/**
 * @file Manifold Transformation Helpers Tests
 * @description TDD tests for enhanced transformation methods using Manifold native API
 * Following project guidelines: no mocks, real implementations, Result<T,E> patterns
 */

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import * as THREE from 'three';
import { convertThreeToManifold } from '../three-manifold-converter/three-manifold-converter';
import {
  translateManifold,
  rotateManifold,
  scaleManifold,
  createTransformationMatrix,
} from './manifold-transformation-helpers';
import type { Result } from '../../../../shared/types/result.types';

describe('ManifoldTransformationHelpers', () => {
  // Following project guidelines: no mocks, real implementations

  describe('translateManifold', () => {
    test('should translate Manifold object using native API', async () => {
      const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
      const manifoldResult = await convertThreeToManifold(cubeGeometry);
      
      expect(manifoldResult.success).toBe(true);
      if (manifoldResult.success) {
        const translationVector = [2, 3, 4] as const;
        const result = translateManifold(manifoldResult.data, translationVector);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toBeDefined();
          expect(typeof result.data.transform).toBe('function');
        }
      }
    });

    test('should handle invalid translation vector', async () => {
      const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
      const manifoldResult = await convertThreeToManifold(cubeGeometry);
      
      expect(manifoldResult.success).toBe(true);
      if (manifoldResult.success) {
        const invalidVector = [1, 2] as any; // Invalid: only 2 components
        const result = translateManifold(manifoldResult.data, invalidVector);

        expect(result.success).toBe(false);
        expect(result.error).toContain('translation vector');
      }
    });
  });

  describe('rotateManifold', () => {
    test('should rotate Manifold object around axis', async () => {
      const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
      const manifoldResult = await convertThreeToManifold(cubeGeometry);
      
      expect(manifoldResult.success).toBe(true);
      if (manifoldResult.success) {
        const axis = [0, 0, 1] as const; // Z-axis
        const angle = Math.PI / 4; // 45 degrees
        const result = rotateManifold(manifoldResult.data, axis, angle);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toBeDefined();
          expect(typeof result.data.transform).toBe('function');
        }
      }
    });

    test('should handle invalid rotation axis', async () => {
      const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
      const manifoldResult = await convertThreeToManifold(cubeGeometry);
      
      expect(manifoldResult.success).toBe(true);
      if (manifoldResult.success) {
        const invalidAxis = [0, 0, 0] as const; // Zero vector
        const angle = Math.PI / 4;
        const result = rotateManifold(manifoldResult.data, invalidAxis, angle);

        expect(result.success).toBe(false);
        expect(result.error).toContain('rotation axis');
      }
    });
  });

  describe('scaleManifold', () => {
    test('should scale Manifold object uniformly', async () => {
      const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
      const manifoldResult = await convertThreeToManifold(cubeGeometry);
      
      expect(manifoldResult.success).toBe(true);
      if (manifoldResult.success) {
        const scaleFactors = [2, 2, 2] as const; // Uniform scaling
        const result = scaleManifold(manifoldResult.data, scaleFactors);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toBeDefined();
          expect(typeof result.data.transform).toBe('function');
        }
      }
    });

    test('should scale Manifold object non-uniformly', async () => {
      const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
      const manifoldResult = await convertThreeToManifold(cubeGeometry);
      
      expect(manifoldResult.success).toBe(true);
      if (manifoldResult.success) {
        const scaleFactors = [2, 1, 0.5] as const; // Non-uniform scaling
        const result = scaleManifold(manifoldResult.data, scaleFactors);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toBeDefined();
        }
      }
    });

    test('should handle invalid scale factors', async () => {
      const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
      const manifoldResult = await convertThreeToManifold(cubeGeometry);
      
      expect(manifoldResult.success).toBe(true);
      if (manifoldResult.success) {
        const invalidFactors = [2, 0, 1] as const; // Zero scale factor
        const result = scaleManifold(manifoldResult.data, invalidFactors);

        expect(result.success).toBe(false);
        expect(result.error).toContain('scale factor');
      }
    });
  });

  describe('createTransformationMatrix', () => {
    test('should create translation matrix', () => {
      const translation = [2, 3, 4] as const;
      const result = createTransformationMatrix({ translation });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(16); // 4x4 matrix
        // Check translation components
        expect(result.data[12]).toBe(2); // X translation
        expect(result.data[13]).toBe(3); // Y translation
        expect(result.data[14]).toBe(4); // Z translation
      }
    });

    test('should create rotation matrix', () => {
      const rotation = { axis: [0, 0, 1] as const, angle: Math.PI / 2 };
      const result = createTransformationMatrix({ rotation });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(16);
        // For 90-degree Z rotation, should have specific pattern
        expect(Math.abs(result.data[0])).toBeCloseTo(0, 5); // cos(90°) ≈ 0
        expect(Math.abs(result.data[1])).toBeCloseTo(1, 5); // sin(90°) ≈ 1
      }
    });

    test('should create scale matrix', () => {
      const scale = [2, 3, 4] as const;
      const result = createTransformationMatrix({ scale });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(16);
        // Check scale components
        expect(result.data[0]).toBe(2);  // X scale
        expect(result.data[5]).toBe(3);  // Y scale
        expect(result.data[10]).toBe(4); // Z scale
      }
    });

    test('should create combined transformation matrix', () => {
      const translation = [1, 2, 3] as const;
      const scale = [2, 2, 2] as const;
      const result = createTransformationMatrix({ translation, scale });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(16);
        // Should combine both transformations
        expect(result.data[0]).toBe(2);  // X scale
        expect(result.data[12]).toBe(1); // X translation
      }
    });
  });

  afterEach(() => {
    // Clean up any Three.js resources
    // Note: Manifold objects should be cleaned up by the caller
  });
});
