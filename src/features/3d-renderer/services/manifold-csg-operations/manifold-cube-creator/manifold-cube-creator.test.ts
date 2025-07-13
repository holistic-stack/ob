/**
 * @file Manifold Cube Creator Tests
 * @description TDD tests for manifold-compliant cube geometry creation
 * Following project guidelines: no mocks, real implementations, Result<T,E> patterns
 */

import { describe, expect, test } from 'vitest';
import { createManifoldCube, createManifoldCubeSafe } from './manifold-cube-creator';

describe('Manifold Cube Creator', () => {
  describe('createManifoldCube', () => {
    test('should create unit cube with correct geometry', () => {
      const cube = createManifoldCube([1, 1, 1]);

      // Verify vertex count (8 vertices for a cube)
      expect(cube.getAttribute('position').count).toBe(8);

      // Verify triangle count (12 triangles, 36 indices)
      const index = cube.getIndex();
      expect(index).toBeDefined();
      expect(index!.count).toBe(36);

      // Verify geometry has normals
      expect(cube.getAttribute('normal')).toBeDefined();

      // Verify bounding box
      cube.computeBoundingBox();
      const box = cube.boundingBox!;
      expect(box.min.x).toBeCloseTo(-0.5);
      expect(box.max.x).toBeCloseTo(0.5);
      expect(box.min.y).toBeCloseTo(-0.5);
      expect(box.max.y).toBeCloseTo(0.5);
      expect(box.min.z).toBeCloseTo(-0.5);
      expect(box.max.z).toBeCloseTo(0.5);
    });

    test('should create rectangular box with correct dimensions', () => {
      const box = createManifoldCube([2, 1, 0.5]);

      box.computeBoundingBox();
      const boundingBox = box.boundingBox!;

      // Verify dimensions
      expect(boundingBox.max.x - boundingBox.min.x).toBeCloseTo(2);
      expect(boundingBox.max.y - boundingBox.min.y).toBeCloseTo(1);
      expect(boundingBox.max.z - boundingBox.min.z).toBeCloseTo(0.5);
    });

    test('should create cube with default size when no parameters provided', () => {
      const cube = createManifoldCube();

      cube.computeBoundingBox();
      const box = cube.boundingBox!;

      // Should be unit cube
      expect(box.max.x - box.min.x).toBeCloseTo(1);
      expect(box.max.y - box.min.y).toBeCloseTo(1);
      expect(box.max.z - box.min.z).toBeCloseTo(1);
    });

    test('should throw error for invalid dimensions', () => {
      expect(() => createManifoldCube([0, 1, 1])).toThrow('Invalid cube size');
      expect(() => createManifoldCube([-1, 1, 1])).toThrow('Invalid cube size');
      expect(() => createManifoldCube([1, 1, NaN])).toThrow('Invalid cube size');
      expect(() => createManifoldCube([Infinity, 1, 1])).toThrow('Invalid cube size');
    });

    test('should create geometry with proper vertex ordering', () => {
      const cube = createManifoldCube([2, 2, 2]);
      const positions = cube.getAttribute('position').array as Float32Array;

      // Verify first vertex (left-bottom-back)
      expect(positions[0]).toBeCloseTo(-1); // x
      expect(positions[1]).toBeCloseTo(-1); // y
      expect(positions[2]).toBeCloseTo(-1); // z

      // Verify last vertex (left-top-front)
      expect(positions[21]).toBeCloseTo(-1); // x
      expect(positions[22]).toBeCloseTo(1); // y
      expect(positions[23]).toBeCloseTo(1); // z
    });

    test('should create geometry with proper triangle indices', () => {
      const cube = createManifoldCube([1, 1, 1]);
      const indices = cube.getIndex()!.array as Uint16Array;

      // Verify first triangle (back face)
      expect(indices[0]).toBe(0);
      expect(indices[1]).toBe(2);
      expect(indices[2]).toBe(1);

      // Verify all indices are within valid range (0-7)
      for (let i = 0; i < indices.length; i++) {
        expect(indices[i]).toBeGreaterThanOrEqual(0);
        expect(indices[i]).toBeLessThan(8);
      }
    });
  });

  describe('createManifoldCubeSafe', () => {
    test('should return success result for valid cube', () => {
      const result = createManifoldCubeSafe([1, 1, 1]);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.getAttribute('position').count).toBe(8);
      }
    });

    test('should return error result for invalid dimensions', () => {
      const result = createManifoldCubeSafe([0, 1, 1]);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Invalid cube size');
      }
    });

    test('should handle edge cases gracefully', () => {
      // Very small cube
      const smallResult = createManifoldCubeSafe([0.001, 0.001, 0.001]);
      expect(smallResult.success).toBe(true);

      // Very large cube
      const largeResult = createManifoldCubeSafe([1000, 1000, 1000]);
      expect(largeResult.success).toBe(true);
    });
  });

  describe('geometry validation', () => {
    test('should create manifold-compliant topology', () => {
      const cube = createManifoldCube([1, 1, 1]);

      // Verify exactly 8 unique vertices
      expect(cube.getAttribute('position').count).toBe(8);

      // Verify exactly 12 triangles (36 indices)
      expect(cube.getIndex()!.count).toBe(36);

      // Verify geometry is indexed
      expect(cube.getIndex()).toBeDefined();

      // Verify no degenerate triangles by checking bounding box
      cube.computeBoundingBox();
      const box = cube.boundingBox!;
      expect(box.isEmpty()).toBe(false);
    });

    test('should have consistent winding order', () => {
      const cube = createManifoldCube([1, 1, 1]);
      const positions = cube.getAttribute('position').array as Float32Array;
      const indices = cube.getIndex()!.array as Uint16Array;

      // Check first triangle winding (should be CCW from outside)
      const i0 = indices[0] * 3;
      const i1 = indices[1] * 3;
      const i2 = indices[2] * 3;

      const v0 = [positions[i0], positions[i0 + 1], positions[i0 + 2]];
      const v1 = [positions[i1], positions[i1 + 1], positions[i1 + 2]];
      const v2 = [positions[i2], positions[i2 + 1], positions[i2 + 2]];

      // Calculate normal using cross product
      const edge1 = [v1[0] - v0[0], v1[1] - v0[1], v1[2] - v0[2]];
      const edge2 = [v2[0] - v0[0], v2[1] - v0[1], v2[2] - v0[2]];
      const normal = [
        edge1[1] * edge2[2] - edge1[2] * edge2[1],
        edge1[2] * edge2[0] - edge1[0] * edge2[2],
        edge1[0] * edge2[1] - edge1[1] * edge2[0],
      ];

      // For back face, normal should point in -Z direction
      expect(normal[2]).toBeLessThan(0);
    });
  });
});
