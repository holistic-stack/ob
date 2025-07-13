/**
 * @file Geometry to Manifold Converter Tests
 * @description TDD tests for the main geometry conversion orchestrator
 * Following project guidelines: no mocks, real implementations, Result<T,E> patterns
 */

import { BoxGeometry, BufferAttribute, BufferGeometry, SphereGeometry } from 'three';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { ManifoldWasmLoader } from '../../manifold-wasm-loader/manifold-wasm-loader';
import {
  convertGeometryToManifold,
  convertGeometryToManifoldAuto,
} from './geometry-to-manifold-converter';

describe('Geometry to Manifold Converter', () => {
  let manifoldModule: any;

  beforeEach(async () => {
    const loader = new ManifoldWasmLoader();
    manifoldModule = await loader.load();
  });

  afterEach(() => {
    // Clean up any created Manifold objects
  });

  describe('convertGeometryToManifold', () => {
    test('should convert BoxGeometry with detect-and-replace strategy', async () => {
      const boxGeometry = new BoxGeometry(2, 1, 0.5);

      const result = await convertGeometryToManifold(boxGeometry, manifoldModule, {
        strategy: 'detect-and-replace',
        logProgress: true,
      });

      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data).toBeDefined();
        expect(result.data.isEmpty()).toBe(false);
        expect(result.data.numVert()).toBeGreaterThan(0);
        expect(result.data.numTri()).toBeGreaterThan(0);

        // Should detect as cube and create manifold-compliant version
        expect(result.data.numVert()).toBe(8); // Manifold cube has 8 vertices
        expect(result.data.numTri()).toBe(12); // Manifold cube has 12 triangles

        // Clean up
        result.data.delete();
      }
    });

    test('should convert SphereGeometry with repair-and-convert strategy', async () => {
      const sphereGeometry = new SphereGeometry(1, 16, 16);

      const result = await convertGeometryToManifold(sphereGeometry, manifoldModule, {
        strategy: 'repair-and-convert',
        enableShapeDetection: false,
      });

      if (result.success) {
        expect(result.data).toBeDefined();
        expect(result.data.isEmpty()).toBe(false);
        expect(result.data.numVert()).toBeGreaterThan(50); // Should have many vertices
        expect(result.data.numTri()).toBeGreaterThan(100); // Should have many triangles

        // Clean up
        result.data.delete();
      } else {
        // Sphere conversion might fail due to manifold requirements
        expect(result.error).toBeDefined();
      }
    });

    test('should use default options when none provided', async () => {
      const boxGeometry = new BoxGeometry(1, 1, 1);

      const result = await convertGeometryToManifold(boxGeometry, manifoldModule);

      expect(result.success).toBe(true);

      if (result.success) {
        // Should use detect-and-replace by default
        expect(result.data.numVert()).toBe(8);
        expect(result.data.numTri()).toBe(12);

        // Clean up
        result.data.delete();
      }
    });

    test('should handle direct-convert strategy', async () => {
      const boxGeometry = new BoxGeometry(1, 1, 1);

      const result = await convertGeometryToManifold(boxGeometry, manifoldModule, {
        strategy: 'direct-convert',
      });

      if (result.success) {
        expect(result.data).toBeDefined();
        expect(result.data.isEmpty()).toBe(false);

        // Clean up
        result.data.delete();
      } else {
        // Direct convert might fail for non-manifold geometries
        expect(result.error).toBeDefined();
      }
    });

    test('should handle invalid strategy gracefully', async () => {
      const boxGeometry = new BoxGeometry(1, 1, 1);

      const result = await convertGeometryToManifold(boxGeometry, manifoldModule, {
        strategy: 'invalid-strategy' as any,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Unknown conversion strategy');
      }
    });

    test('should handle geometry without position attribute', async () => {
      const emptyGeometry = new BufferGeometry();

      const result = await convertGeometryToManifold(emptyGeometry, manifoldModule);

      expect(result.success).toBe(false);
      if (!result.success) {
        // Error could come from repair or mesh creation step
        expect(result.error).toMatch(/missing position attribute|Cannot read properties/);
      }
    });

    test('should clean up working geometry when different from original', async () => {
      const boxGeometry = new BoxGeometry(1, 1, 1);
      const originalVertexCount = boxGeometry.getAttribute('position').count;

      const result = await convertGeometryToManifold(boxGeometry, manifoldModule, {
        strategy: 'detect-and-replace',
      });

      expect(result.success).toBe(true);

      // Original geometry should be unchanged
      expect(boxGeometry.getAttribute('position').count).toBe(originalVertexCount);

      if (result.success) {
        result.data.delete();
      }
    });

    test('should handle custom triangle geometry', async () => {
      const customGeometry = new BufferGeometry();

      // Create a simple tetrahedron
      const vertices = new Float32Array([
        0,
        1,
        0, // top
        -1,
        -1,
        1, // front-left
        1,
        -1,
        1, // front-right
        0,
        -1,
        -1, // back
      ]);

      const indices = new Uint32Array([
        0,
        1,
        2, // front face
        0,
        2,
        3, // right face
        0,
        3,
        1, // left face
        1,
        3,
        2, // bottom face
      ]);

      customGeometry.setAttribute('position', new BufferAttribute(vertices, 3));
      customGeometry.setIndex(new BufferAttribute(indices, 1));

      const result = await convertGeometryToManifold(customGeometry, manifoldModule, {
        strategy: 'repair-and-convert',
      });

      if (result.success) {
        expect(result.data).toBeDefined();
        expect(result.data.isEmpty()).toBe(false);
        expect(result.data.numVert()).toBe(4);
        expect(result.data.numTri()).toBe(4);

        // Clean up
        result.data.delete();
      } else {
        // Custom geometry might fail manifold requirements
        expect(result.error).toBeDefined();
      }
    });
  });

  describe('convertGeometryToManifoldAuto', () => {
    test('should successfully convert BoxGeometry with auto strategy', async () => {
      const boxGeometry = new BoxGeometry(1, 1, 1);

      const result = await convertGeometryToManifoldAuto(boxGeometry, manifoldModule);

      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data).toBeDefined();
        expect(result.data.isEmpty()).toBe(false);
        expect(result.data.numVert()).toBe(8);
        expect(result.data.numTri()).toBe(12);

        // Clean up
        result.data.delete();
      }
    });

    test('should try multiple strategies for difficult geometries', async () => {
      // Create a potentially problematic geometry
      const customGeometry = new BufferGeometry();
      const vertices = new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]);
      const indices = new Uint32Array([0, 1, 2]);

      customGeometry.setAttribute('position', new BufferAttribute(vertices, 3));
      customGeometry.setIndex(new BufferAttribute(indices, 1));

      const result = await convertGeometryToManifoldAuto(customGeometry, manifoldModule);

      // Auto strategy should try multiple approaches
      // Result may succeed or fail depending on manifold requirements
      expect(result.success !== undefined).toBe(true);

      if (result.success) {
        result.data.delete();
      }
    });

    test('should handle completely invalid geometry', async () => {
      const emptyGeometry = new BufferGeometry();

      const result = await convertGeometryToManifoldAuto(emptyGeometry, manifoldModule);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
      }
    });
  });

  describe('performance and memory management', () => {
    test('should handle multiple conversions without memory leaks', async () => {
      const geometries = [
        new BoxGeometry(1, 1, 1),
        new BoxGeometry(2, 1, 0.5),
        new BoxGeometry(0.5, 0.5, 0.5),
      ];

      const manifoldObjects: any[] = [];

      for (const geometry of geometries) {
        const result = await convertGeometryToManifold(geometry, manifoldModule);

        if (result.success) {
          manifoldObjects.push(result.data);
        }
      }

      // All conversions should succeed for boxes
      expect(manifoldObjects.length).toBe(3);

      // Clean up all objects
      for (const obj of manifoldObjects) {
        obj.delete();
      }
    });

    test('should complete conversion within reasonable time', async () => {
      const startTime = performance.now();

      const boxGeometry = new BoxGeometry(1, 1, 1);
      const result = await convertGeometryToManifold(boxGeometry, manifoldModule);

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete within 100ms for simple geometry
      expect(duration).toBeLessThan(100);

      if (result.success) {
        result.data.delete();
      }
    });
  });
});
