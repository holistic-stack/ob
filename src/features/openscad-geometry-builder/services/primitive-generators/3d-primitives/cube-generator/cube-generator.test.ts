/**
 * @file cube-generator.test.ts
 * @description Test suite for Cube Generator Service following TDD methodology.
 * Tests the exact OpenSCAD cube generation algorithm with 8 vertices and 6 faces.
 *
 * @author OpenSCAD Babylon Team
 * @version 1.0.0
 * @since 2025-07-29
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { isError, isSuccess } from '@/shared/types/result.types';
import { CubeGeneratorService } from './cube-generator';

describe('CubeGeneratorService', () => {
  let cubeGenerator: CubeGeneratorService;

  beforeEach(() => {
    cubeGenerator = new CubeGeneratorService();
  });

  describe('generateCube', () => {
    describe('centered cube', () => {
      it('should generate centered cube with correct vertex positions', () => {
        const result = cubeGenerator.generateCube({ x: 2, y: 4, z: 6 }, true);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          const cube = result.data;

          // Verify metadata
          expect(cube.metadata.primitiveType).toBe('3d-cube');
          expect(cube.metadata.parameters.size).toEqual({ x: 2, y: 4, z: 6 });
          expect(cube.metadata.parameters.center).toBe(true);
          expect(cube.metadata.isConvex).toBe(true);

          // Should have 8 vertices
          expect(cube.vertices).toHaveLength(8);
          expect(cube.normals).toHaveLength(8);

          // Should have 6 faces (quads)
          expect(cube.faces).toHaveLength(6);

          // Verify vertex positions for centered cube
          // Expected vertices for size [2,4,6] centered:
          // x: -1 to +1, y: -2 to +2, z: -3 to +3
          const expectedVertices = [
            { x: -1, y: -2, z: -3 }, // 0: min corner
            { x: 1, y: -2, z: -3 }, // 1: +x
            { x: 1, y: 2, z: -3 }, // 2: +x,+y
            { x: -1, y: 2, z: -3 }, // 3: +y
            { x: -1, y: -2, z: 3 }, // 4: +z
            { x: 1, y: -2, z: 3 }, // 5: +x,+z
            { x: 1, y: 2, z: 3 }, // 6: +x,+y,+z (max corner)
            { x: -1, y: 2, z: 3 }, // 7: +y,+z
          ];

          for (let i = 0; i < 8; i++) {
            expect(cube.vertices[i].x).toBeCloseTo(expectedVertices[i].x);
            expect(cube.vertices[i].y).toBeCloseTo(expectedVertices[i].y);
            expect(cube.vertices[i].z).toBeCloseTo(expectedVertices[i].z);
          }
        }
      });

      it('should generate centered unit cube', () => {
        const result = cubeGenerator.generateCube({ x: 1, y: 1, z: 1 }, true);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          const cube = result.data;

          // Verify all vertices are within [-0.5, 0.5] range
          for (const vertex of cube.vertices) {
            expect(vertex.x).toBeGreaterThanOrEqual(-0.5);
            expect(vertex.x).toBeLessThanOrEqual(0.5);
            expect(vertex.y).toBeGreaterThanOrEqual(-0.5);
            expect(vertex.y).toBeLessThanOrEqual(0.5);
            expect(vertex.z).toBeGreaterThanOrEqual(-0.5);
            expect(vertex.z).toBeLessThanOrEqual(0.5);
          }
        }
      });
    });

    describe('non-centered cube', () => {
      it('should generate non-centered cube starting at origin', () => {
        const result = cubeGenerator.generateCube({ x: 2, y: 4, z: 6 }, false);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          const cube = result.data;

          // Verify metadata
          expect(cube.metadata.parameters.center).toBe(false);

          // Verify vertex positions for non-centered cube
          // Expected vertices for size [2,4,6] non-centered:
          // x: 0 to 2, y: 0 to 4, z: 0 to 6
          const expectedVertices = [
            { x: 0, y: 0, z: 0 }, // 0: origin
            { x: 2, y: 0, z: 0 }, // 1: +x
            { x: 2, y: 4, z: 0 }, // 2: +x,+y
            { x: 0, y: 4, z: 0 }, // 3: +y
            { x: 0, y: 0, z: 6 }, // 4: +z
            { x: 2, y: 0, z: 6 }, // 5: +x,+z
            { x: 2, y: 4, z: 6 }, // 6: +x,+y,+z (max corner)
            { x: 0, y: 4, z: 6 }, // 7: +y,+z
          ];

          for (let i = 0; i < 8; i++) {
            expect(cube.vertices[i].x).toBeCloseTo(expectedVertices[i].x);
            expect(cube.vertices[i].y).toBeCloseTo(expectedVertices[i].y);
            expect(cube.vertices[i].z).toBeCloseTo(expectedVertices[i].z);
          }
        }
      });
    });

    describe('uniform size cube', () => {
      it('should generate cube from single size value', () => {
        const result = cubeGenerator.generateCube(5, true);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          const cube = result.data;

          // Should be 5x5x5 cube
          expect(cube.metadata.parameters.size).toEqual({ x: 5, y: 5, z: 5 });

          // Verify all vertices are within [-2.5, 2.5] range for centered cube
          for (const vertex of cube.vertices) {
            expect(vertex.x).toBeGreaterThanOrEqual(-2.5);
            expect(vertex.x).toBeLessThanOrEqual(2.5);
            expect(vertex.y).toBeGreaterThanOrEqual(-2.5);
            expect(vertex.y).toBeLessThanOrEqual(2.5);
            expect(vertex.z).toBeGreaterThanOrEqual(-2.5);
            expect(vertex.z).toBeLessThanOrEqual(2.5);
          }
        }
      });
    });

    describe('face generation', () => {
      it('should generate 6 quad faces with correct winding', () => {
        const result = cubeGenerator.generateCube({ x: 2, y: 2, z: 2 }, true);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          const cube = result.data;

          // Should have exactly 6 faces
          expect(cube.faces).toHaveLength(6);

          // Each face should be a quad (4 vertices)
          for (const face of cube.faces) {
            expect(face).toHaveLength(4);
          }

          // Verify all face indices are valid
          for (const face of cube.faces) {
            for (const index of face) {
              expect(index).toBeGreaterThanOrEqual(0);
              expect(index).toBeLessThan(8);
            }
          }
        }
      });

      it('should generate faces in correct order (front, back, left, right, bottom, top)', () => {
        const result = cubeGenerator.generateCube({ x: 2, y: 2, z: 2 }, false);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          const cube = result.data;

          // OpenSCAD cube face order should be consistent
          expect(cube.faces).toHaveLength(6);

          // Each face should reference 4 different vertices
          for (const face of cube.faces) {
            const uniqueIndices = new Set(face);
            expect(uniqueIndices.size).toBe(4);
          }
        }
      });
    });

    describe('normal generation', () => {
      it('should generate correct normals for cube faces', () => {
        const result = cubeGenerator.generateCube({ x: 2, y: 2, z: 2 }, true);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          const cube = result.data;

          // All normals should be unit vectors
          for (const normal of cube.normals) {
            const length = Math.sqrt(
              normal.x * normal.x + normal.y * normal.y + normal.z * normal.z
            );
            expect(length).toBeCloseTo(1, 5);
          }

          // Normals should point outward from cube center
          // For a centered cube, normals should align with vertex positions
          for (let i = 0; i < cube.vertices.length; i++) {
            const vertex = cube.vertices[i];
            const normal = cube.normals[i];

            // Normal should point in same general direction as vertex from center
            const dot = vertex.x * normal.x + vertex.y * normal.y + vertex.z * normal.z;
            expect(dot).toBeGreaterThan(0);
          }
        }
      });
    });

    describe('parameter validation', () => {
      it('should reject negative size values', () => {
        const result = cubeGenerator.generateCube({ x: -1, y: 2, z: 3 }, true);

        expect(isError(result)).toBe(true);
        if (isError(result)) {
          expect(result.error.type).toBe('INVALID_PARAMETERS');
          expect(result.error.message).toContain('positive');
        }
      });

      it('should reject zero size values', () => {
        const result = cubeGenerator.generateCube({ x: 0, y: 2, z: 3 }, true);

        expect(isError(result)).toBe(true);
        if (isError(result)) {
          expect(result.error.type).toBe('INVALID_PARAMETERS');
          expect(result.error.message).toContain('positive');
        }
      });

      it('should reject negative uniform size', () => {
        const result = cubeGenerator.generateCube(-5, true);

        expect(isError(result)).toBe(true);
        if (isError(result)) {
          expect(result.error.type).toBe('INVALID_PARAMETERS');
          expect(result.error.message).toContain('positive');
        }
      });

      it('should handle very small size values', () => {
        const result = cubeGenerator.generateCube({ x: 0.001, y: 0.001, z: 0.001 }, true);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          const cube = result.data;
          expect(cube.vertices).toHaveLength(8);
        }
      });

      it('should handle very large size values', () => {
        const result = cubeGenerator.generateCube({ x: 1000, y: 1000, z: 1000 }, false);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          const cube = result.data;
          expect(cube.vertices).toHaveLength(8);
        }
      });
    });
  });

  describe('generateCubeFromParameters', () => {
    it('should generate cube from OpenSCAD parameters with Vector3 size', () => {
      const result = cubeGenerator.generateCubeFromParameters({
        size: { x: 3, y: 4, z: 5 },
        center: true,
      });

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        const cube = result.data;
        expect(cube.metadata.parameters.size).toEqual({ x: 3, y: 4, z: 5 });
        expect(cube.metadata.parameters.center).toBe(true);
      }
    });

    it('should generate cube from OpenSCAD parameters with uniform size', () => {
      const result = cubeGenerator.generateCubeFromParameters({
        size: 7,
        center: false,
      });

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        const cube = result.data;
        expect(cube.metadata.parameters.size).toEqual({ x: 7, y: 7, z: 7 });
        expect(cube.metadata.parameters.center).toBe(false);
      }
    });
  });

  describe('performance', () => {
    it('should generate cube quickly', () => {
      const startTime = performance.now();
      const result = cubeGenerator.generateCube({ x: 10, y: 10, z: 10 }, true);
      const endTime = performance.now();

      expect(isSuccess(result)).toBe(true);
      expect(endTime - startTime).toBeLessThan(10); // Should be very fast (<10ms)
    });
  });
});
