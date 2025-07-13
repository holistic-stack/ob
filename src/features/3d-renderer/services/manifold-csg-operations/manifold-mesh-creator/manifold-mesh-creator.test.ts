/**
 * @file Manifold Mesh Creator Tests
 * @description TDD tests for creating Manifold mesh data from Three.js geometries
 * Following project guidelines: no mocks, real implementations, Result<T,E> patterns
 */

import { BoxGeometry, BufferAttribute, BufferGeometry, SphereGeometry } from 'three';
import { describe, expect, test } from 'vitest';
import {
  createManifoldMeshFromGeometry,
  validateManifoldMeshData,
} from './manifold-mesh-creator';

describe('Manifold Mesh Creator', () => {
  describe('createManifoldMeshFromGeometry', () => {
    test('should create mesh data from BoxGeometry', () => {
      const boxGeometry = new BoxGeometry(1, 1, 1);
      const result = createManifoldMeshFromGeometry(boxGeometry);

      expect(result.success).toBe(true);

      if (result.success) {
        const { numProp, vertProperties, triVerts, runIndex, runOriginalID } = result.data;

        // Verify basic structure
        expect(numProp).toBe(3);
        expect(vertProperties).toBeInstanceOf(Float32Array);
        expect(triVerts).toBeInstanceOf(Uint32Array);
        expect(runIndex).toBeInstanceOf(Uint32Array);
        expect(runOriginalID).toBeInstanceOf(Uint32Array);

        // Verify vertex count (BoxGeometry has 24 vertices)
        expect(vertProperties.length).toBe(72); // 24 vertices × 3 coordinates

        // Verify triangle count (BoxGeometry has 12 triangles)
        expect(triVerts.length).toBe(36); // 12 triangles × 3 vertices

        // Verify run structure (BoxGeometry may have multiple groups)
        expect(runIndex.length).toBeGreaterThanOrEqual(2);
        expect(runIndex[0]).toBe(0);
        expect(runIndex[runIndex.length - 1]).toBe(triVerts.length);
        expect(runOriginalID.length).toBe(runIndex.length - 1);
        expect(runOriginalID[0]).toBe(0);
      }
    });

    test('should create mesh data from SphereGeometry', () => {
      const sphereGeometry = new SphereGeometry(1, 8, 6);
      const result = createManifoldMeshFromGeometry(sphereGeometry);

      expect(result.success).toBe(true);

      if (result.success) {
        const { numProp, vertProperties, triVerts } = result.data;

        expect(numProp).toBe(3);
        expect(vertProperties.length).toBeGreaterThan(0);
        expect(triVerts.length).toBeGreaterThan(0);
        expect(triVerts.length % 3).toBe(0); // Must be triangulated

        // Verify all indices are within valid range
        const vertexCount = vertProperties.length / 3;
        for (let i = 0; i < triVerts.length; i++) {
          expect(triVerts[i]).toBeGreaterThanOrEqual(0);
          expect(triVerts[i]).toBeLessThan(vertexCount);
        }
      }
    });

    test('should handle custom indexed geometry', () => {
      const geometry = new BufferGeometry();

      // Create a simple triangle
      const vertices = new Float32Array([
        0,
        1,
        0, // vertex 0
        -1,
        -1,
        0, // vertex 1
        1,
        -1,
        0, // vertex 2
      ]);

      const indices = new Uint32Array([0, 1, 2]);

      geometry.setAttribute('position', new BufferAttribute(vertices, 3));
      geometry.setIndex(new BufferAttribute(indices, 1));

      const result = createManifoldMeshFromGeometry(geometry);

      expect(result.success).toBe(true);

      if (result.success) {
        const { vertProperties, triVerts } = result.data;

        expect(vertProperties.length).toBe(9); // 3 vertices × 3 coordinates
        expect(triVerts.length).toBe(3); // 1 triangle × 3 vertices
        // Triangle winding is reversed for Manifold compatibility (following BabylonJS pattern)
        expect(Array.from(triVerts)).toEqual([2, 1, 0]);
      }
    });

    test('should fail for geometry without position attribute', () => {
      const emptyGeometry = new BufferGeometry();
      const result = createManifoldMeshFromGeometry(emptyGeometry);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('missing position attribute');
      }
    });

    test('should fail for geometry without indices', () => {
      const geometry = new BufferGeometry();
      const vertices = new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]);
      geometry.setAttribute('position', new BufferAttribute(vertices, 3));
      // No index set

      const result = createManifoldMeshFromGeometry(geometry);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('missing indices');
      }
    });

    test('should fail for non-triangulated geometry', () => {
      const geometry = new BufferGeometry();
      const vertices = new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 1, 0]);
      const indices = new Uint32Array([0, 1, 2, 3, 0]); // 5 indices (not multiple of 3)

      geometry.setAttribute('position', new BufferAttribute(vertices, 3));
      geometry.setIndex(new BufferAttribute(indices, 1));

      const result = createManifoldMeshFromGeometry(geometry);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('multiple of 3');
      }
    });

    test('should handle large geometries within limits', () => {
      // Create a geometry with many vertices but within limits
      const vertexCount = 1000;
      const vertices = new Float32Array(vertexCount * 3);
      const indices = new Uint32Array((vertexCount - 2) * 3); // Triangle fan

      // Fill with valid data
      for (let i = 0; i < vertexCount; i++) {
        vertices[i * 3] = Math.cos((i / vertexCount) * Math.PI * 2);
        vertices[i * 3 + 1] = Math.sin((i / vertexCount) * Math.PI * 2);
        vertices[i * 3 + 2] = 0;
      }

      for (let i = 0; i < vertexCount - 2; i++) {
        indices[i * 3] = 0;
        indices[i * 3 + 1] = i + 1;
        indices[i * 3 + 2] = i + 2;
      }

      const geometry = new BufferGeometry();
      geometry.setAttribute('position', new BufferAttribute(vertices, 3));
      geometry.setIndex(new BufferAttribute(indices, 1));

      const result = createManifoldMeshFromGeometry(geometry);
      expect(result.success).toBe(true);
    });
  });



  describe('validateManifoldMeshData', () => {
    test('should validate correct mesh data', () => {
      const boxGeometry = new BoxGeometry(1, 1, 1);
      const meshResult = createManifoldMeshFromGeometry(boxGeometry);

      expect(meshResult.success).toBe(true);

      if (meshResult.success) {
        const validation = validateManifoldMeshData(meshResult.data);
        expect(validation.success).toBe(true);
      }
    });

    test('should reject invalid numProp', () => {
      const invalidMeshData = {
        numProp: 4, // Should be 3
        vertProperties: new Float32Array([0, 0, 0]),
        triVerts: new Uint32Array([0, 1, 2]),
        runIndex: new Uint32Array([0, 3]),
        runOriginalID: new Uint32Array([0]),
      };

      const validation = validateManifoldMeshData(invalidMeshData);
      expect(validation.success).toBe(false);
      if (!validation.success) {
        expect(validation.error).toContain('Invalid numProp');
      }
    });

    test('should reject invalid vertex properties length', () => {
      const invalidMeshData = {
        numProp: 3,
        vertProperties: new Float32Array([0, 0]), // Not multiple of 3
        triVerts: new Uint32Array([0, 1, 2]),
        runIndex: new Uint32Array([0, 3]),
        runOriginalID: new Uint32Array([0]),
      };

      const validation = validateManifoldMeshData(invalidMeshData);
      expect(validation.success).toBe(false);
      if (!validation.success) {
        expect(validation.error).toContain('Invalid vertProperties length');
      }
    });

    test('should reject out-of-range vertex indices', () => {
      const invalidMeshData = {
        numProp: 3,
        vertProperties: new Float32Array([0, 0, 0, 1, 0, 0]), // 2 vertices
        triVerts: new Uint32Array([0, 1, 3]), // Index 3 is out of range
        runIndex: new Uint32Array([0, 3]),
        runOriginalID: new Uint32Array([0]),
      };

      const validation = validateManifoldMeshData(invalidMeshData);
      expect(validation.success).toBe(false);
      if (!validation.success) {
        expect(validation.error).toContain('Invalid vertex index');
      }
    });

    test('should reject invalid run structure', () => {
      const invalidMeshData = {
        numProp: 3,
        vertProperties: new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]),
        triVerts: new Uint32Array([0, 1, 2]),
        runIndex: new Uint32Array([1, 3]), // Should start with 0
        runOriginalID: new Uint32Array([0]),
      };

      const validation = validateManifoldMeshData(invalidMeshData);
      expect(validation.success).toBe(false);
      if (!validation.success) {
        expect(validation.error).toContain('runIndex must start with 0');
      }
    });
  });
});
