/**
 * @file square-generator.test.ts
 * @description Comprehensive tests for SquareGeneratorService following TDD methodology.
 * Tests OpenSCAD-compatible square/rectangle generation with size and center parameters.
 *
 * @example
 * ```typescript
 * // Test square with size=5, center=false
 * const result = generator.generateSquare({ size: 5, center: false });
 * expect(result.success).toBe(true);
 * expect(result.data.vertices).toHaveLength(4);
 * ```
 *
 * @author OpenSCAD Babylon Team
 * @version 1.0.0
 * @since 2025-07-29
 */

import { beforeEach, describe, expect, it } from 'vitest';
import type { SquareParameters } from '@/features/openscad-geometry-builder';
import { isError, isSuccess } from '@/shared';
import { SquareGeneratorService } from './square-generator';

describe('SquareGeneratorService', () => {
  let generator: SquareGeneratorService;

  beforeEach(() => {
    generator = new SquareGeneratorService();
  });

  describe('generateSquare', () => {
    describe('parameter validation', () => {
      it('should reject negative size number', () => {
        const params: SquareParameters = { size: -5, center: false };
        const result = generator.generateSquare(params);

        expect(isError(result)).toBe(true);
        if (isError(result)) {
          expect(result.error.type).toBe('INVALID_PARAMETERS');
          expect(result.error.message).toContain('positive');
        }
      });

      it('should reject zero size number', () => {
        const params: SquareParameters = { size: 0, center: false };
        const result = generator.generateSquare(params);

        expect(isError(result)).toBe(true);
        if (isError(result)) {
          expect(result.error.type).toBe('INVALID_PARAMETERS');
          expect(result.error.message).toContain('positive');
        }
      });

      it('should reject negative size vector components', () => {
        const params: SquareParameters = { size: { x: -5, y: 3 }, center: false };
        const result = generator.generateSquare(params);

        expect(isError(result)).toBe(true);
        if (isError(result)) {
          expect(result.error.type).toBe('INVALID_PARAMETERS');
          expect(result.error.message).toContain('positive');
        }
      });

      it('should reject zero size vector components', () => {
        const params: SquareParameters = { size: { x: 5, y: 0 }, center: false };
        const result = generator.generateSquare(params);

        expect(isError(result)).toBe(true);
        if (isError(result)) {
          expect(result.error.type).toBe('INVALID_PARAMETERS');
          expect(result.error.message).toContain('positive');
        }
      });

      it('should handle very small positive sizes', () => {
        const params: SquareParameters = { size: 0.001, center: false };
        const result = generator.generateSquare(params);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.data.metadata.parameters.size.x).toBe(0.001);
          expect(result.data.metadata.parameters.size.y).toBe(0.001);
        }
      });
    });

    describe('size parameter handling', () => {
      it('should generate square from number size', () => {
        const params: SquareParameters = { size: 5, center: false };
        const result = generator.generateSquare(params);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.data.metadata.parameters.size.x).toBe(5);
          expect(result.data.metadata.parameters.size.y).toBe(5);
        }
      });

      it('should generate rectangle from Vector2 size', () => {
        const params: SquareParameters = { size: { x: 3, y: 7 }, center: false };
        const result = generator.generateSquare(params);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.data.metadata.parameters.size.x).toBe(3);
          expect(result.data.metadata.parameters.size.y).toBe(7);
        }
      });
    });

    describe('center parameter handling', () => {
      it('should position square at origin corner when center=false', () => {
        const params: SquareParameters = { size: 4, center: false };
        const result = generator.generateSquare(params);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          const { vertices } = result.data;
          expect(vertices).toHaveLength(4);

          // Corner at origin: (0,0), (4,0), (4,4), (0,4)
          expect(vertices[0]).toEqual({ x: 0, y: 0 });
          expect(vertices[1]).toEqual({ x: 4, y: 0 });
          expect(vertices[2]).toEqual({ x: 4, y: 4 });
          expect(vertices[3]).toEqual({ x: 0, y: 4 });
        }
      });

      it('should position square centered at origin when center=true', () => {
        const params: SquareParameters = { size: 4, center: true };
        const result = generator.generateSquare(params);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          const { vertices } = result.data;
          expect(vertices).toHaveLength(4);

          // Centered: (-2,-2), (2,-2), (2,2), (-2,2)
          expect(vertices[0]).toEqual({ x: -2, y: -2 });
          expect(vertices[1]).toEqual({ x: 2, y: -2 });
          expect(vertices[2]).toEqual({ x: 2, y: 2 });
          expect(vertices[3]).toEqual({ x: -2, y: 2 });
        }
      });

      it('should position rectangle correctly with center=true', () => {
        const params: SquareParameters = { size: { x: 6, y: 4 }, center: true };
        const result = generator.generateSquare(params);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          const { vertices } = result.data;
          expect(vertices).toHaveLength(4);

          // Centered rectangle: (-3,-2), (3,-2), (3,2), (-3,2)
          expect(vertices[0]).toEqual({ x: -3, y: -2 });
          expect(vertices[1]).toEqual({ x: 3, y: -2 });
          expect(vertices[2]).toEqual({ x: 3, y: 2 });
          expect(vertices[3]).toEqual({ x: -3, y: 2 });
        }
      });
    });

    describe('geometry generation', () => {
      it('should generate correct outline indices', () => {
        const params: SquareParameters = { size: 5, center: false };
        const result = generator.generateSquare(params);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          const { outline } = result.data;
          expect(outline).toEqual([0, 1, 2, 3]);
        }
      });

      it('should have no holes for simple square', () => {
        const params: SquareParameters = { size: 5, center: false };
        const result = generator.generateSquare(params);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.data.holes).toEqual([]);
        }
      });

      it('should mark square as convex', () => {
        const params: SquareParameters = { size: 5, center: false };
        const result = generator.generateSquare(params);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.data.metadata.isConvex).toBe(true);
        }
      });

      it('should calculate correct area', () => {
        const params: SquareParameters = { size: { x: 3, y: 4 }, center: false };
        const result = generator.generateSquare(params);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          const expectedArea = 3 * 4; // width * height
          expect(result.data.metadata.area).toBe(expectedArea);
        }
      });
    });

    describe('metadata validation', () => {
      it('should set correct primitive type', () => {
        const params: SquareParameters = { size: 5, center: false };
        const result = generator.generateSquare(params);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.data.metadata.primitiveType).toBe('2d-square');
        }
      });

      it('should include generation timestamp', () => {
        const params: SquareParameters = { size: 5, center: false };
        const beforeTime = Date.now();
        const result = generator.generateSquare(params);
        const afterTime = Date.now();

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.data.metadata.generatedAt).toBeGreaterThanOrEqual(beforeTime);
          expect(result.data.metadata.generatedAt).toBeLessThanOrEqual(afterTime);
        }
      });

      it('should store center parameter in metadata', () => {
        const params: SquareParameters = { size: 5, center: true };
        const result = generator.generateSquare(params);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.data.metadata.parameters.center).toBe(true);
        }
      });
    });
  });

  describe('performance', () => {
    it('should handle large squares efficiently', () => {
      const params: SquareParameters = { size: 1000, center: false };
      const startTime = performance.now();
      const result = generator.generateSquare(params);
      const endTime = performance.now();

      expect(isSuccess(result)).toBe(true);
      expect(endTime - startTime).toBeLessThan(16); // Should complete in <16ms
      if (isSuccess(result)) {
        expect(result.data.vertices).toHaveLength(4);
      }
    });
  });
});
