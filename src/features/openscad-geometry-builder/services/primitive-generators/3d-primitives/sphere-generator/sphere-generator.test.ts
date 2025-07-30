/**
 * @file sphere-generator.test.ts
 * @description Test suite for Sphere Generator Service following TDD methodology.
 * Tests the exact OpenSCAD sphere generation algorithm that fixes the $fn=3 sphere rendering issue.
 *
 * @author OpenSCAD Babylon Team
 * @version 1.0.0
 * @since 2025-07-29
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { isError, isSuccess } from '@/shared/types/result.types';
import {
  createInvalidSphereParameters,
  createSphereTestParameters,
  createSphereTestParametersFn3,
  expectError,
  expectGeometryProperties,
  expectInvalidParametersError,
  expectPerformance,
  expectSuccess,
  expectSuccessfulGeometry,
  expectValidGeometry,
  expectValidMetadata,
  expectValidNormals,
  expectValidVertices,
} from '../../../../test-utilities';
import type { SphereGeometryData } from '../../../../types/geometry-data';
import { FragmentCalculatorService } from '../../../fragment-calculator';
import { SphereGeneratorService } from './sphere-generator';

describe('SphereGeneratorService', () => {
  let sphereGenerator: SphereGeneratorService;
  let fragmentCalculator: FragmentCalculatorService;

  beforeEach(() => {
    fragmentCalculator = new FragmentCalculatorService();
    sphereGenerator = new SphereGeneratorService(fragmentCalculator);
  });

  describe('generateSphere', () => {
    describe('$fn=3 sphere (the main issue)', () => {
      it('should generate sphere with exactly 3 fragments and 2 rings', () => {
        const result = sphereGenerator.generateSphere(5, 3);

        const sphere = expectSuccessfulGeometry(result, {
          vertexCount: 6, // For $fn=3: num_rings = (3 + 1) / 2 = 2 rings, each with 3 vertices
          hasNormals: true,
          hasMetadata: true,
        });

        // Verify metadata
        expectValidMetadata(sphere.metadata, '3d-sphere', ['radius', 'fragments']);
        expect(sphere.metadata.parameters.radius).toBe(5);
        expect(sphere.metadata.parameters.fragments).toBe(3);
        expect(sphere.metadata.fragmentCount).toBe(3);
      });

      it('should generate correct vertex positions for $fn=3 sphere', () => {
        const result = sphereGenerator.generateSphere(5, 3);

        const sphere = expectSuccessfulGeometry(result, { vertexCount: 6 });
        expectValidVertices(sphere.vertices, 6);

        // Ring 0: phi = (180 * 0.5) / 2 = 45°
        // Ring radius = 5 * sin(45°) = 3.535534
        // Ring Z = 5 * cos(45°) = 3.535534

        // Ring 1: phi = (180 * 1.5) / 2 = 135°
        // Ring radius = 5 * sin(135°) = 3.535534
        // Ring Z = 5 * cos(135°) = -3.535534

        // Verify ring 0 vertices (first 3 vertices)
        expect(sphere.vertices[0].z).toBeCloseTo(3.535534, 5);
        expect(sphere.vertices[1].z).toBeCloseTo(3.535534, 5);
        expect(sphere.vertices[2].z).toBeCloseTo(3.535534, 5);

        // Verify ring 1 vertices (last 3 vertices)
        expect(sphere.vertices[3].z).toBeCloseTo(-3.535534, 5);
        expect(sphere.vertices[4].z).toBeCloseTo(-3.535534, 5);
        expect(sphere.vertices[5].z).toBeCloseTo(-3.535534, 5);

        // Verify ring radius for all vertices
        const ringRadius = 3.535534;
        for (let i = 0; i < 6; i++) {
          const vertex = sphere.vertices[i];
          const actualRadius = Math.sqrt(vertex.x * vertex.x + vertex.y * vertex.y);
          expect(actualRadius).toBeCloseTo(ringRadius, 5);
        }
      });

      it('should generate correct face connectivity for $fn=3 sphere', () => {
        const result = sphereGenerator.generateSphere(5, 3);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          const sphere = result.data;

          // For 2 rings with 3 fragments each, we should have 3 quad faces
          // connecting the rings (each quad becomes 2 triangles)
          expect(sphere.faces).toHaveLength(3);

          // Each face should be a quad (4 vertices)
          for (const face of sphere.faces) {
            expect(face).toHaveLength(4);
          }

          // Verify face indices are valid
          for (const face of sphere.faces) {
            for (const index of face) {
              expect(index).toBeGreaterThanOrEqual(0);
              expect(index).toBeLessThan(6);
            }
          }
        }
      });
    });

    describe('standard sphere cases', () => {
      it('should generate sphere with $fn=8', () => {
        const result = sphereGenerator.generateSphere(10, 8);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          const sphere = result.data;

          // For $fn=8: num_rings = (8 + 1) / 2 = 4 rings
          // Each ring has 8 vertices, so total = 32 vertices
          expect(sphere.vertices).toHaveLength(32);
          expect(sphere.normals).toHaveLength(32);
          // 3 connections between 4 rings, each with 8 fragments = 3 * 8 = 24 quad faces
          expect(sphere.faces).toHaveLength(24);
        }
      });

      it('should generate sphere with $fn=6 (even number)', () => {
        const result = sphereGenerator.generateSphere(3, 6);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          const sphere = result.data;

          // For $fn=6: num_rings = (6 + 1) / 2 = 3 rings
          // Each ring has 6 vertices, so total = 18 vertices
          expect(sphere.vertices).toHaveLength(18);
          expect(sphere.normals).toHaveLength(18);
          // 2 connections between 3 rings, each with 6 fragments = 2 * 6 = 12 quad faces
          expect(sphere.faces).toHaveLength(12);
        }
      });

      it('should handle large fragment counts efficiently', async () => {
        const sphere = await expectPerformance(
          () => sphereGenerator.generateSphere(5, 64),
          50, // Should be fast (<50ms)
          'large fragment count sphere generation'
        );

        expectSuccessfulGeometry(sphere, {
          vertexCount: 64 * 32, // For $fn=64: num_rings = (64 + 1) / 2 = 32 rings
          faceCount: 1984, // 31 connections between 32 rings, each with 64 fragments = 31 * 64 = 1984 quad faces
        });
      });
    });

    describe('parameter validation', () => {
      it('should reject negative radius', () => {
        const result = sphereGenerator.generateSphere(-5, 8);
        expectInvalidParametersError(result, 'Radius must be positive');
      });

      it('should reject zero radius', () => {
        const result = sphereGenerator.generateSphere(0, 8);
        expectInvalidParametersError(result, 'Radius must be positive');
      });

      it('should reject fragments less than 3', () => {
        const result = sphereGenerator.generateSphere(5, 2);
        expectInvalidParametersError(result, 'Fragments must be at least 3');
      });

      it('should handle very small radius', () => {
        const result = sphereGenerator.generateSphere(0.001, 8);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          const sphere = result.data;
          expect(sphere.vertices.length).toBeGreaterThan(0);
        }
      });
    });

    describe('geometry properties', () => {
      it('should generate normalized normals', () => {
        const result = sphereGenerator.generateSphere(5, 8);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          const sphere = result.data;

          // All normals should be unit vectors (length ≈ 1)
          for (const normal of sphere.normals) {
            const length = Math.sqrt(
              normal.x * normal.x + normal.y * normal.y + normal.z * normal.z
            );
            expect(length).toBeCloseTo(1, 5);
          }
        }
      });

      it('should generate vertices on sphere surface', () => {
        const radius = 7;
        const result = sphereGenerator.generateSphere(radius, 12);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          const sphere = result.data;

          // All vertices should be at distance 'radius' from origin
          for (const vertex of sphere.vertices) {
            const distance = Math.sqrt(
              vertex.x * vertex.x + vertex.y * vertex.y + vertex.z * vertex.z
            );
            expect(distance).toBeCloseTo(radius, 5);
          }
        }
      });

      it('should mark sphere as convex', () => {
        const result = sphereGenerator.generateSphere(5, 8);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          const sphere = result.data;
          expect(sphere.metadata.isConvex).toBe(true);
        }
      });
    });
  });

  describe('generateSphereFromParameters', () => {
    it('should generate sphere from radius parameter', () => {
      const result = sphereGenerator.generateSphereFromParameters({
        radius: 5,
        fn: 6,
        fs: 2,
        fa: 12,
      });

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        const sphere = result.data;
        expect(sphere.metadata.parameters.radius).toBe(5);
        expect(sphere.metadata.parameters.fragments).toBe(6);
      }
    });

    it('should generate sphere from diameter parameter', () => {
      const result = sphereGenerator.generateSphereFromParameters({
        diameter: 10,
        fn: 8,
        fs: 2,
        fa: 12,
      });

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        const sphere = result.data;
        expect(sphere.metadata.parameters.radius).toBe(5); // diameter/2
        expect(sphere.metadata.parameters.fragments).toBe(8);
      }
    });

    it('should prefer diameter over radius when both provided', () => {
      const result = sphereGenerator.generateSphereFromParameters({
        radius: 3,
        diameter: 10,
        fn: 8,
        fs: 2,
        fa: 12,
      });

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        const sphere = result.data;
        expect(sphere.metadata.parameters.radius).toBe(5); // Uses diameter/2, ignores radius
      }
    });

    it('should calculate fragments using fragment calculator', () => {
      const result = sphereGenerator.generateSphereFromParameters({
        radius: 5,
        fn: 0, // Use $fs/$fa calculation
        fs: 2,
        fa: 12,
      });

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        const sphere = result.data;
        // Should use fragment calculator result (16 for these parameters)
        expect(sphere.metadata.parameters.fragments).toBe(16);
      }
    });
  });
});
