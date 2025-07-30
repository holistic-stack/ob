/**
 * @file cylinder-generator.test.ts
 * @description Test suite for Cylinder Generator Service following TDD methodology.
 * Tests the exact OpenSCAD cylinder generation algorithm with circular cross-sections and caps.
 *
 * @author OpenSCAD Babylon Team
 * @version 1.0.0
 * @since 2025-07-29
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { isError, isSuccess } from '@/shared/types/result.types';
import type { CylinderGeometryData } from '../../../../types/geometry-data';
import { FragmentCalculatorService } from '../../../fragment-calculator';
import { CylinderGeneratorService } from './cylinder-generator';

describe('CylinderGeneratorService', () => {
  let cylinderGenerator: CylinderGeneratorService;
  let fragmentCalculator: FragmentCalculatorService;

  beforeEach(() => {
    fragmentCalculator = new FragmentCalculatorService();
    cylinderGenerator = new CylinderGeneratorService(fragmentCalculator);
  });

  describe('generateCylinder', () => {
    describe('standard cylinder (r1 = r2)', () => {
      it('should generate cylinder with equal top and bottom radii', () => {
        const result = cylinderGenerator.generateCylinder(10, 5, 5, false, 8);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          const cylinder = result.data;

          // Verify metadata
          expect(cylinder.metadata.primitiveType).toBe('3d-cylinder');
          expect(cylinder.metadata.parameters.height).toBe(10);
          expect(cylinder.metadata.parameters.r1).toBe(5);
          expect(cylinder.metadata.parameters.r2).toBe(5);
          expect(cylinder.metadata.parameters.center).toBe(false);
          expect(cylinder.metadata.parameters.fragments).toBe(8);
          expect(cylinder.metadata.isConvex).toBe(true);

          // Should have vertices for bottom circle + top circle + center points for caps
          // 8 fragments: 8 bottom + 8 top + 2 centers = 18 vertices
          expect(cylinder.vertices).toHaveLength(18);
          expect(cylinder.normals).toHaveLength(18);

          // Should have faces: 8 side quads + 8 bottom triangles + 8 top triangles = 24 faces
          // Side faces: 8 quads, Bottom cap: 8 triangles, Top cap: 8 triangles
          expect(cylinder.faces).toHaveLength(24);
        }
      });

      it('should generate centered cylinder', () => {
        const result = cylinderGenerator.generateCylinder(6, 3, 3, true, 6);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          const cylinder = result.data;

          // Verify centered positioning
          expect(cylinder.metadata.parameters.center).toBe(true);

          // Bottom circle should be at z = -3, top circle at z = +3
          const bottomVertices = cylinder.vertices.slice(0, 6);
          const topVertices = cylinder.vertices.slice(6, 12);

          for (const vertex of bottomVertices) {
            expect(vertex.z).toBeCloseTo(-3);
          }

          for (const vertex of topVertices) {
            expect(vertex.z).toBeCloseTo(3);
          }
        }
      });

      it('should generate non-centered cylinder', () => {
        const result = cylinderGenerator.generateCylinder(8, 4, 4, false, 6);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          const cylinder = result.data;

          // Bottom circle should be at z = 0, top circle at z = 8
          const bottomVertices = cylinder.vertices.slice(0, 6);
          const topVertices = cylinder.vertices.slice(6, 12);

          for (const vertex of bottomVertices) {
            expect(vertex.z).toBeCloseTo(0);
          }

          for (const vertex of topVertices) {
            expect(vertex.z).toBeCloseTo(8);
          }
        }
      });
    });

    describe('cone generation (r2 = 0)', () => {
      it('should generate cone with apex at top', () => {
        const result = cylinderGenerator.generateCylinder(10, 5, 0, false, 8);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          const cylinder = result.data;

          // Should have vertices for bottom circle + apex point + bottom center
          // 8 fragments: 8 bottom + 1 apex + 1 bottom center = 10 vertices
          expect(cylinder.vertices).toHaveLength(10);

          // Verify apex position (should be the last vertex)
          const apexVertex = cylinder.vertices[cylinder.vertices.length - 1];
          expect(apexVertex.x).toBeCloseTo(0);
          expect(apexVertex.y).toBeCloseTo(0);
          expect(apexVertex.z).toBeCloseTo(10);

          // Should have faces: 8 side triangles + 8 bottom triangles = 16 faces
          expect(cylinder.faces).toHaveLength(16);
        }
      });

      it('should generate inverted cone (r1 = 0)', () => {
        const result = cylinderGenerator.generateCylinder(8, 0, 4, false, 6);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          const cylinder = result.data;

          // Should have vertices for top circle + apex point + top center
          // 6 fragments: 6 top + 1 apex + 1 top center = 8 vertices
          expect(cylinder.vertices).toHaveLength(8);

          // Verify apex position at bottom (should be the last vertex)
          const apexVertex = cylinder.vertices[cylinder.vertices.length - 1];
          expect(apexVertex.x).toBeCloseTo(0);
          expect(apexVertex.y).toBeCloseTo(0);
          expect(apexVertex.z).toBeCloseTo(0);

          // Should have faces: 6 side triangles + 6 top triangles = 12 faces
          expect(cylinder.faces).toHaveLength(12);
        }
      });
    });

    describe('truncated cone (r1 ≠ r2)', () => {
      it('should generate truncated cone with different radii', () => {
        const result = cylinderGenerator.generateCylinder(12, 6, 3, false, 8);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          const cylinder = result.data;

          // Should have vertices for both circles + center points
          // 8 fragments: 8 bottom + 8 top + 2 centers = 18 vertices
          expect(cylinder.vertices).toHaveLength(18);

          // Verify bottom circle radius
          const bottomVertices = cylinder.vertices.slice(0, 8);
          for (const vertex of bottomVertices) {
            const radius = Math.sqrt(vertex.x * vertex.x + vertex.y * vertex.y);
            expect(radius).toBeCloseTo(6, 5);
          }

          // Verify top circle radius
          const topVertices = cylinder.vertices.slice(8, 16);
          for (const vertex of topVertices) {
            const radius = Math.sqrt(vertex.x * vertex.x + vertex.y * vertex.y);
            expect(radius).toBeCloseTo(3, 5);
          }

          // Should have faces: 8 side quads + 8 bottom triangles + 8 top triangles = 24 faces
          expect(cylinder.faces).toHaveLength(24);
        }
      });
    });

    describe('fragment count validation', () => {
      it('should handle $fn=3 cylinder', () => {
        const result = cylinderGenerator.generateCylinder(5, 2, 2, true, 3);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          const cylinder = result.data;

          // Should have triangular cross-section
          // 3 fragments: 3 bottom + 3 top + 2 centers = 8 vertices
          expect(cylinder.vertices).toHaveLength(8);

          // Should have faces: 3 side quads + 3 bottom triangles + 3 top triangles = 9 faces
          expect(cylinder.faces).toHaveLength(9);
        }
      });

      it('should handle high fragment count efficiently', () => {
        const startTime = performance.now();
        const result = cylinderGenerator.generateCylinder(10, 5, 5, false, 32);
        const endTime = performance.now();

        expect(isSuccess(result)).toBe(true);
        expect(endTime - startTime).toBeLessThan(50); // Should be fast (<50ms)

        if (isSuccess(result)) {
          const cylinder = result.data;

          // 32 fragments: 32 bottom + 32 top + 2 centers = 66 vertices
          expect(cylinder.vertices).toHaveLength(66);

          // Should have faces: 32 side quads + 32 bottom triangles + 32 top triangles = 96 faces
          expect(cylinder.faces).toHaveLength(96);
        }
      });
    });

    describe('parameter validation', () => {
      it('should reject negative height', () => {
        const result = cylinderGenerator.generateCylinder(-5, 3, 3, false, 8);

        expect(isError(result)).toBe(true);
        if (isError(result)) {
          expect(result.error.type).toBe('INVALID_PARAMETERS');
          expect(result.error.message).toContain('Height must be positive');
        }
      });

      it('should reject negative radii', () => {
        const result = cylinderGenerator.generateCylinder(10, -3, 2, false, 8);

        expect(isError(result)).toBe(true);
        if (isError(result)) {
          expect(result.error.type).toBe('INVALID_PARAMETERS');
          expect(result.error.message).toContain('radii');
        }
      });

      it('should reject both radii being zero', () => {
        const result = cylinderGenerator.generateCylinder(10, 0, 0, false, 8);

        expect(isError(result)).toBe(true);
        if (isError(result)) {
          expect(result.error.type).toBe('INVALID_PARAMETERS');
          expect(result.error.message).toContain('radius');
        }
      });

      it('should reject fragments less than 3', () => {
        const result = cylinderGenerator.generateCylinder(10, 5, 5, false, 2);

        expect(isError(result)).toBe(true);
        if (isError(result)) {
          expect(result.error.type).toBe('INVALID_PARAMETERS');
          expect(result.error.message).toContain('Fragments must be at least 3');
        }
      });

      it('should handle zero height', () => {
        const result = cylinderGenerator.generateCylinder(0, 5, 5, false, 8);

        expect(isError(result)).toBe(true);
        if (isError(result)) {
          expect(result.error.type).toBe('INVALID_PARAMETERS');
          expect(result.error.message).toContain('Height must be positive');
        }
      });
    });

    describe('geometry properties', () => {
      it('should generate normalized normals', () => {
        const result = cylinderGenerator.generateCylinder(10, 5, 3, false, 8);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          const cylinder = result.data;

          // All normals should be unit vectors (length ≈ 1)
          for (const normal of cylinder.normals) {
            const length = Math.sqrt(
              normal.x * normal.x + normal.y * normal.y + normal.z * normal.z
            );
            expect(length).toBeCloseTo(1, 5);
          }
        }
      });

      it('should mark cylinder as convex', () => {
        const result = cylinderGenerator.generateCylinder(8, 4, 4, true, 6);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          const cylinder = result.data;
          expect(cylinder.metadata.isConvex).toBe(true);
        }
      });
    });
  });

  describe('generateCylinderFromParameters', () => {
    it('should generate cylinder from radius parameters', () => {
      const result = cylinderGenerator.generateCylinderFromParameters({
        height: 10,
        r1: 5,
        r2: 3,
        center: true,
        fn: 8,
        fs: 2,
        fa: 12,
      });

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        const cylinder = result.data;
        expect(cylinder.metadata.parameters.height).toBe(10);
        expect(cylinder.metadata.parameters.r1).toBe(5);
        expect(cylinder.metadata.parameters.r2).toBe(3);
        expect(cylinder.metadata.parameters.center).toBe(true);
        expect(cylinder.metadata.parameters.fragments).toBe(8);
      }
    });

    it('should generate cylinder from diameter parameters', () => {
      const result = cylinderGenerator.generateCylinderFromParameters({
        height: 8,
        d1: 10,
        d2: 6,
        center: false,
        fn: 6,
        fs: 2,
        fa: 12,
      });

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        const cylinder = result.data;
        expect(cylinder.metadata.parameters.r1).toBe(5); // d1/2
        expect(cylinder.metadata.parameters.r2).toBe(3); // d2/2
      }
    });

    it('should prefer diameter over radius when both provided', () => {
      const result = cylinderGenerator.generateCylinderFromParameters({
        height: 6,
        r1: 2,
        r2: 1,
        d1: 8,
        d2: 4,
        center: true,
        fn: 8,
        fs: 2,
        fa: 12,
      });

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        const cylinder = result.data;
        expect(cylinder.metadata.parameters.r1).toBe(4); // Uses d1/2, ignores r1
        expect(cylinder.metadata.parameters.r2).toBe(2); // Uses d2/2, ignores r2
      }
    });

    it('should use uniform radius when r is provided', () => {
      const result = cylinderGenerator.generateCylinderFromParameters({
        height: 12,
        r: 6,
        center: false,
        fn: 12,
        fs: 2,
        fa: 12,
      });

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        const cylinder = result.data;
        expect(cylinder.metadata.parameters.r1).toBe(6);
        expect(cylinder.metadata.parameters.r2).toBe(6);
      }
    });

    it('should calculate fragments using fragment calculator', () => {
      const result = cylinderGenerator.generateCylinderFromParameters({
        height: 10,
        r: 5,
        center: true,
        fn: 0, // Use $fs/$fa calculation
        fs: 2,
        fa: 12,
      });

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        const cylinder = result.data;
        // Should use fragment calculator result (16 for these parameters)
        expect(cylinder.metadata.parameters.fragments).toBe(16);
      }
    });
  });
});
