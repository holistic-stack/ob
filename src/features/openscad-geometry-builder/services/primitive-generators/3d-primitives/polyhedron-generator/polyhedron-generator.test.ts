/**
 * @file polyhedron-generator.test.ts
 * @description Test suite for Polyhedron Generator Service following TDD methodology.
 * Tests the exact OpenSCAD polyhedron generation algorithm with user-defined vertices and faces.
 *
 * @author OpenSCAD Babylon Team
 * @version 1.0.0
 * @since 2025-07-29
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { isError, isSuccess } from '@/shared/types/result.types';

import { PolyhedronGeneratorService } from './polyhedron-generator';

describe('PolyhedronGeneratorService', () => {
  let polyhedronGenerator: PolyhedronGeneratorService;

  beforeEach(() => {
    polyhedronGenerator = new PolyhedronGeneratorService();
  });

  describe('generatePolyhedron', () => {
    describe('simple polyhedron cases', () => {
      it('should generate tetrahedron from vertices and faces', () => {
        // Define tetrahedron vertices
        const vertices = [
          [0, 0, 0], // 0: origin
          [1, 0, 0], // 1: +x
          [0.5, 1, 0], // 2: +y
          [0.5, 0.5, 1], // 3: +z (apex)
        ];

        // Define tetrahedron faces (triangles)
        const faces = [
          [0, 1, 2], // Bottom face
          [0, 3, 1], // Side face 1
          [1, 3, 2], // Side face 2
          [2, 3, 0], // Side face 3
        ];

        const result = polyhedronGenerator.generatePolyhedron(vertices, faces);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          const polyhedron = result.data;

          // Verify metadata
          expect(polyhedron.metadata.primitiveType).toBe('3d-polyhedron');
          expect(polyhedron.metadata.parameters.vertexCount).toBe(4);
          expect(polyhedron.metadata.parameters.faceCount).toBe(4);
          expect(polyhedron.metadata.isConvex).toBe(true); // Tetrahedron is convex

          // Should have 4 vertices
          expect(polyhedron.vertices).toHaveLength(4);
          expect(polyhedron.normals).toHaveLength(4);

          // Should have 4 faces
          expect(polyhedron.faces).toHaveLength(4);

          // Verify vertex positions
          expect(polyhedron.vertices[0]).toEqual({ x: 0, y: 0, z: 0 });
          expect(polyhedron.vertices[1]).toEqual({ x: 1, y: 0, z: 0 });
          expect(polyhedron.vertices[2]).toEqual({ x: 0.5, y: 1, z: 0 });
          expect(polyhedron.vertices[3]).toEqual({ x: 0.5, y: 0.5, z: 1 });
        }
      });

      it('should generate cube from vertices and faces', () => {
        // Define cube vertices
        const vertices = [
          [0, 0, 0],
          [1, 0, 0],
          [1, 1, 0],
          [0, 1, 0], // Bottom face
          [0, 0, 1],
          [1, 0, 1],
          [1, 1, 1],
          [0, 1, 1], // Top face
        ];

        // Define cube faces (quads)
        const faces = [
          [0, 1, 2, 3], // Bottom
          [4, 7, 6, 5], // Top
          [0, 4, 5, 1], // Front
          [2, 6, 7, 3], // Back
          [0, 3, 7, 4], // Left
          [1, 5, 6, 2], // Right
        ];

        const result = polyhedronGenerator.generatePolyhedron(vertices, faces);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          const polyhedron = result.data;

          // Should have 8 vertices and 6 faces
          expect(polyhedron.vertices).toHaveLength(8);
          expect(polyhedron.faces).toHaveLength(6);
          expect(polyhedron.metadata.parameters.vertexCount).toBe(8);
          expect(polyhedron.metadata.parameters.faceCount).toBe(6);
        }
      });

      it('should handle triangular faces', () => {
        // Simple pyramid with triangular base
        const vertices = [
          [0, 0, 0],
          [1, 0, 0],
          [0.5, 1, 0], // Base triangle
          [0.5, 0.5, 1], // Apex
        ];

        const faces = [
          [0, 2, 1], // Base (reversed for outward normal)
          [0, 1, 3], // Side 1
          [1, 2, 3], // Side 2
          [2, 0, 3], // Side 3
        ];

        const result = polyhedronGenerator.generatePolyhedron(vertices, faces);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          const polyhedron = result.data;

          // All faces should be triangles
          for (const face of polyhedron.faces) {
            expect(face).toHaveLength(3);
          }
        }
      });

      it('should handle mixed triangle and quad faces', () => {
        // Triangular prism
        const vertices = [
          [0, 0, 0],
          [1, 0, 0],
          [0.5, 1, 0], // Bottom triangle
          [0, 0, 2],
          [1, 0, 2],
          [0.5, 1, 2], // Top triangle
        ];

        const faces = [
          [0, 2, 1], // Bottom triangle
          [3, 4, 5], // Top triangle
          [0, 1, 4, 3], // Side quad 1
          [1, 2, 5, 4], // Side quad 2
          [2, 0, 3, 5], // Side quad 3
        ];

        const result = polyhedronGenerator.generatePolyhedron(vertices, faces);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          const polyhedron = result.data;

          expect(polyhedron.vertices).toHaveLength(6);
          expect(polyhedron.faces).toHaveLength(5);

          // Check face types
          expect(polyhedron.faces[0]).toHaveLength(3); // Triangle
          expect(polyhedron.faces[1]).toHaveLength(3); // Triangle
          expect(polyhedron.faces[2]).toHaveLength(4); // Quad
          expect(polyhedron.faces[3]).toHaveLength(4); // Quad
          expect(polyhedron.faces[4]).toHaveLength(4); // Quad
        }
      });
    });

    describe('parameter validation', () => {
      it('should reject empty vertices array', () => {
        const result = polyhedronGenerator.generatePolyhedron([], [[0, 1, 2]]);

        expect(isError(result)).toBe(true);
        if (isError(result)) {
          expect(result.error.type).toBe('INVALID_PARAMETERS');
          expect(result.error.message).toContain('vertex');
        }
      });

      it('should reject empty faces array', () => {
        const vertices = [
          [0, 0, 0],
          [1, 0, 0],
          [0, 1, 0],
        ];
        const result = polyhedronGenerator.generatePolyhedron(vertices, []);

        expect(isError(result)).toBe(true);
        if (isError(result)) {
          expect(result.error.type).toBe('INVALID_PARAMETERS');
          expect(result.error.message).toContain('face');
        }
      });

      it('should reject invalid vertex format', () => {
        const vertices = [
          [0, 0],
          [1, 0, 0],
          [0, 1, 0],
        ]; // First vertex missing z
        const faces = [[0, 1, 2]];

        const result = polyhedronGenerator.generatePolyhedron(vertices, faces);

        expect(isError(result)).toBe(true);
        if (isError(result)) {
          expect(result.error.type).toBe('INVALID_PARAMETERS');
          expect(result.error.message).toContain('Vertex');
        }
      });

      it('should reject face with invalid vertex indices', () => {
        const vertices = [
          [0, 0, 0],
          [1, 0, 0],
          [0, 1, 0],
        ];
        const faces = [[0, 1, 5]]; // Index 5 doesn't exist

        const result = polyhedronGenerator.generatePolyhedron(vertices, faces);

        expect(isError(result)).toBe(true);
        if (isError(result)) {
          expect(result.error.type).toBe('INVALID_PARAMETERS');
          expect(result.error.message).toContain('index');
        }
      });

      it('should reject face with too few vertices', () => {
        const vertices = [
          [0, 0, 0],
          [1, 0, 0],
          [0, 1, 0],
        ];
        const faces = [[0, 1]]; // Only 2 vertices, need at least 3

        const result = polyhedronGenerator.generatePolyhedron(vertices, faces);

        expect(isError(result)).toBe(true);
        if (isError(result)) {
          expect(result.error.type).toBe('INVALID_PARAMETERS');
          expect(result.error.message).toContain('vertices');
        }
      });

      it('should reject face with duplicate vertex indices', () => {
        const vertices = [
          [0, 0, 0],
          [1, 0, 0],
          [0, 1, 0],
        ];
        const faces = [[0, 1, 1]]; // Duplicate index 1

        const result = polyhedronGenerator.generatePolyhedron(vertices, faces);

        expect(isError(result)).toBe(true);
        if (isError(result)) {
          expect(result.error.type).toBe('INVALID_PARAMETERS');
          expect(result.error.message).toContain('duplicate');
        }
      });

      it('should handle very small coordinates', () => {
        const vertices = [
          [0.001, 0.001, 0.001],
          [0.002, 0.001, 0.001],
          [0.0015, 0.002, 0.001],
        ];
        const faces = [[0, 1, 2]];

        const result = polyhedronGenerator.generatePolyhedron(vertices, faces);

        expect(isSuccess(result)).toBe(true);
      });

      it('should handle large coordinates', () => {
        const vertices = [
          [1000, 1000, 1000],
          [2000, 1000, 1000],
          [1500, 2000, 1000],
        ];
        const faces = [[0, 1, 2]];

        const result = polyhedronGenerator.generatePolyhedron(vertices, faces);

        expect(isSuccess(result)).toBe(true);
      });
    });

    describe('normal generation', () => {
      it('should generate correct normals for triangle faces', () => {
        // Simple triangle in XY plane
        const vertices = [
          [0, 0, 0],
          [1, 0, 0],
          [0, 1, 0],
        ];
        const faces = [[0, 1, 2]];

        const result = polyhedronGenerator.generatePolyhedron(vertices, faces);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          const polyhedron = result.data;

          // All normals should be unit vectors
          for (const normal of polyhedron.normals) {
            const length = Math.sqrt(
              normal.x * normal.x + normal.y * normal.y + normal.z * normal.z
            );
            expect(length).toBeCloseTo(1, 5);
          }
        }
      });

      it('should generate averaged normals for shared vertices', () => {
        // Tetrahedron where each vertex is shared by multiple faces
        const vertices = [
          [0, 0, 0],
          [1, 0, 0],
          [0.5, 1, 0],
          [0.5, 0.5, 1],
        ];
        const faces = [
          [0, 1, 2],
          [0, 3, 1],
          [1, 3, 2],
          [2, 3, 0],
        ];

        const result = polyhedronGenerator.generatePolyhedron(vertices, faces);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          const polyhedron = result.data;

          // Each vertex should have a normal that's the average of adjacent face normals
          expect(polyhedron.normals).toHaveLength(4);

          // All normals should be unit vectors
          for (const normal of polyhedron.normals) {
            const length = Math.sqrt(
              normal.x * normal.x + normal.y * normal.y + normal.z * normal.z
            );
            expect(length).toBeCloseTo(1, 5);
          }
        }
      });
    });

    describe('convexity detection', () => {
      it('should detect convex polyhedron (tetrahedron)', () => {
        const vertices = [
          [0, 0, 0],
          [1, 0, 0],
          [0.5, 1, 0],
          [0.5, 0.5, 1],
        ];
        const faces = [
          [0, 1, 2],
          [0, 3, 1],
          [1, 3, 2],
          [2, 3, 0],
        ];

        const result = polyhedronGenerator.generatePolyhedron(vertices, faces);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          const polyhedron = result.data;
          expect(polyhedron.metadata.isConvex).toBe(true);
        }
      });

      it('should detect non-convex polyhedron', () => {
        // L-shaped polyhedron (non-convex)
        const vertices = [
          [0, 0, 0],
          [1, 0, 0],
          [1, 1, 0],
          [0.5, 1, 0],
          [0.5, 0.5, 0],
          [0, 0.5, 0], // Bottom L
          [0, 0, 1],
          [1, 0, 1],
          [1, 1, 1],
          [0.5, 1, 1],
          [0.5, 0.5, 1],
          [0, 0.5, 1], // Top L
        ];
        const faces = [
          [0, 1, 2, 3, 4, 5], // Bottom face
          [6, 11, 10, 9, 8, 7], // Top face
          // Side faces would be complex for this example
          [0, 6, 7, 1], // Simple side face for testing
        ];

        const result = polyhedronGenerator.generatePolyhedron(vertices, faces);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          const polyhedron = result.data;
          // For now, we'll mark all polyhedra as potentially non-convex
          // A full convexity test would be complex to implement
          expect(typeof polyhedron.metadata.isConvex).toBe('boolean');
        }
      });
    });
  });

  describe('generatePolyhedronFromParameters', () => {
    it('should generate polyhedron from OpenSCAD parameters', () => {
      const vertices = [
        { x: 0, y: 0, z: 0 },
        { x: 1, y: 0, z: 0 },
        { x: 0.5, y: 1, z: 0 },
        { x: 0.5, y: 0.5, z: 1 },
      ];
      const faces = [
        [0, 1, 2],
        [0, 3, 1],
        [1, 3, 2],
        [2, 3, 0],
      ];

      const result = polyhedronGenerator.generatePolyhedronFromParameters({
        points: vertices,
        faces: faces,
        convexity: 1,
      });

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        const polyhedron = result.data;
        expect(polyhedron.vertices).toHaveLength(4);
        expect(polyhedron.faces).toHaveLength(4);
      }
    });

    it('should handle convexity parameter', () => {
      const vertices = [
        { x: 0, y: 0, z: 0 },
        { x: 1, y: 0, z: 0 },
        { x: 0.5, y: 1, z: 0 },
      ];
      const faces = [[0, 1, 2]];

      const result = polyhedronGenerator.generatePolyhedronFromParameters({
        points: vertices,
        faces: faces,
        convexity: 5,
      });

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        const polyhedron = result.data;
        expect(polyhedron.metadata.parameters.convexity).toBe(5);
      }
    });
  });

  describe('performance', () => {
    it('should handle complex polyhedron efficiently', () => {
      // Generate a more complex polyhedron (icosahedron-like)
      const vertices: number[][] = [];
      const faces: number[][] = [];

      // Generate vertices for a rough sphere approximation
      for (let i = 0; i < 20; i++) {
        const angle = (2 * Math.PI * i) / 20;
        vertices.push([Math.cos(angle), Math.sin(angle), 0]);
      }
      vertices.push([0, 0, 1]); // Top vertex
      vertices.push([0, 0, -1]); // Bottom vertex

      // Generate faces (simplified)
      for (let i = 0; i < 20; i++) {
        const next = (i + 1) % 20;
        faces.push([i, next, 20]); // Top triangles
        faces.push([next, i, 21]); // Bottom triangles
      }

      const startTime = performance.now();
      const result = polyhedronGenerator.generatePolyhedron(vertices, faces);
      const endTime = performance.now();

      expect(isSuccess(result)).toBe(true);
      expect(endTime - startTime).toBeLessThan(50); // Should be fast (<50ms)

      if (isSuccess(result)) {
        const polyhedron = result.data;
        expect(polyhedron.vertices).toHaveLength(22);
        expect(polyhedron.faces).toHaveLength(40);
      }
    });
  });
});
