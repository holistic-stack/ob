/**
 * @file circle-generator.test.ts
 * @description Comprehensive tests for CircleGeneratorService following TDD methodology.
 * Tests OpenSCAD-compatible circle generation with fragment-based tessellation.
 *
 * @example
 * ```typescript
 * // Test circle with fn=6 (hexagon)
 * const result = generator.generateCircle({ radius: 5, fn: 6 });
 * expect(result.success).toBe(true);
 * expect(result.data.vertices).toHaveLength(6);
 * ```
 *
 * @author OpenSCAD Babylon Team
 * @version 1.0.0
 * @since 2025-07-29
 */

import { beforeEach, describe, expect, it } from 'vitest';
import type { CircleParameters } from '@/features/openscad-geometry-builder';
import { isError, isSuccess } from '@/shared';
import { CircleGeneratorService } from './circle-generator';

describe('CircleGeneratorService', () => {
  let generator: CircleGeneratorService;

  beforeEach(() => {
    generator = new CircleGeneratorService();
  });

  describe('generateCircle', () => {
    describe('parameter validation', () => {
      it('should reject negative radius', () => {
        const params: CircleParameters = { radius: -5 };
        const result = generator.generateCircle(params);

        expect(isError(result)).toBe(true);
        if (isError(result)) {
          expect(result.error.type).toBe('INVALID_PARAMETERS');
          expect(result.error.message).toBe('Radius must be positive');
        }
      });

      it('should reject zero radius', () => {
        const params: CircleParameters = { radius: 0 };
        const result = generator.generateCircle(params);

        expect(isError(result)).toBe(true);
        if (isError(result)) {
          expect(result.error.type).toBe('INVALID_PARAMETERS');
          expect(result.error.message).toBe('Radius must be positive');
        }
      });

      it('should reject negative diameter', () => {
        const params: CircleParameters = { diameter: -10 };
        const result = generator.generateCircle(params);

        expect(isError(result)).toBe(true);
        if (isError(result)) {
          expect(result.error.type).toBe('INVALID_PARAMETERS');
          expect(result.error.message).toBe('Radius must be positive');
        }
      });

      it('should enforce minimum fragments of 3', () => {
        const params: CircleParameters = { radius: 5, fn: 2 };
        const result = generator.generateCircle(params);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.data.vertices).toHaveLength(3); // Minimum enforced
          expect(result.data.metadata.parameters.fragments).toBe(3);
        }
      });

      it('should handle very small radius', () => {
        const params: CircleParameters = { radius: 0.001 };
        const result = generator.generateCircle(params);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.data.metadata.parameters.radius).toBe(0.001);
        }
      });
    });

    describe('radius/diameter handling', () => {
      it('should generate circle from radius parameter', () => {
        const params: CircleParameters = { radius: 5, fn: 6 };
        const result = generator.generateCircle(params);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.data.metadata.parameters.radius).toBe(5);
        }
      });

      it('should generate circle from diameter parameter', () => {
        const params: CircleParameters = { diameter: 10, fn: 6 };
        const result = generator.generateCircle(params);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.data.metadata.parameters.radius).toBe(5);
        }
      });

      it('should prefer diameter over radius when both provided', () => {
        const params: CircleParameters = { radius: 3, diameter: 10, fn: 6 };
        const result = generator.generateCircle(params);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.data.metadata.parameters.radius).toBe(5);
        }
      });
    });

    describe('fragment calculation', () => {
      it('should use fn when provided', () => {
        const params: CircleParameters = { radius: 5, fn: 8 };
        const result = generator.generateCircle(params);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.data.vertices).toHaveLength(8);
          expect(result.data.metadata.parameters.fragments).toBe(8);
        }
      });

      it('should calculate fragments using fragment calculator when fn not provided', () => {
        const params: CircleParameters = { radius: 5, fa: 30, fs: 1 };
        const result = generator.generateCircle(params);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.data.vertices.length).toBeGreaterThanOrEqual(3);
          expect(result.data.metadata.parameters.fragments).toBeGreaterThanOrEqual(3);
        }
      });
    });

    describe('geometry generation', () => {
      it('should generate correct vertex positions for hexagon', () => {
        const params: CircleParameters = { radius: 5, fn: 6 };
        const result = generator.generateCircle(params);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          const { vertices } = result.data;
          expect(vertices).toHaveLength(6);

          // Check first vertex (0°)
          expect(vertices[0].x).toBeCloseTo(5, 5);
          expect(vertices[0].y).toBeCloseTo(0, 5);

          // Check second vertex (60°)
          expect(vertices[1].x).toBeCloseTo(2.5, 5);
          expect(vertices[1].y).toBeCloseTo(4.33, 2);
        }
      });

      it('should generate correct outline indices', () => {
        const params: CircleParameters = { radius: 5, fn: 6 };
        const result = generator.generateCircle(params);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          const { outline } = result.data;
          expect(outline).toEqual([0, 1, 2, 3, 4, 5]);
        }
      });

      it('should have no holes for simple circle', () => {
        const params: CircleParameters = { radius: 5, fn: 6 };
        const result = generator.generateCircle(params);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.data.holes).toEqual([]);
        }
      });

      it('should mark circle as convex', () => {
        const params: CircleParameters = { radius: 5, fn: 6 };
        const result = generator.generateCircle(params);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.data.metadata.isConvex).toBe(true);
        }
      });

      it('should calculate correct area', () => {
        const params: CircleParameters = { radius: 5, fn: 100 };
        const result = generator.generateCircle(params);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          const expectedArea = Math.PI * 5 * 5; // π * r²
          expect(result.data.metadata.area).toBeCloseTo(expectedArea, 0); // Less precision for polygon approximation
        }
      });
    });

    describe('metadata validation', () => {
      it('should set correct primitive type', () => {
        const params: CircleParameters = { radius: 5, fn: 6 };
        const result = generator.generateCircle(params);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.data.metadata.primitiveType).toBe('2d-circle');
        }
      });

      it('should include generation timestamp', () => {
        const params: CircleParameters = { radius: 5, fn: 6 };
        const beforeTime = Date.now();
        const result = generator.generateCircle(params);
        const afterTime = Date.now();

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.data.metadata.generatedAt).toBeGreaterThanOrEqual(beforeTime);
          expect(result.data.metadata.generatedAt).toBeLessThanOrEqual(afterTime);
        }
      });
    });
  });

  describe('performance', () => {
    it('should handle high fragment count efficiently', () => {
      const params: CircleParameters = { radius: 10, fn: 1000 };
      const startTime = performance.now();
      const result = generator.generateCircle(params);
      const endTime = performance.now();

      expect(isSuccess(result)).toBe(true);
      expect(endTime - startTime).toBeLessThan(100); // Should complete in <100ms
      if (isSuccess(result)) {
        expect(result.data.vertices).toHaveLength(1000);
      }
    });
  });
});
