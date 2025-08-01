/**
 * @file polygon-generator.test.ts
 * @description Comprehensive tests for PolygonGeneratorService following TDD methodology.
 * Tests OpenSCAD-compatible polygon generation with points and optional paths parameters.
 *
 * @example
 * ```typescript
 * // Test simple triangle
 * const result = generator.generatePolygon({
 *   points: [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 5, y: 10 }],
 *   convexity: 1
 * });
 * expect(result.success).toBe(true);
 * expect(result.data.vertices).toHaveLength(3);
 * ```
 *
 * @author OpenSCAD Babylon Team
 * @version 1.0.0
 * @since 2025-07-29
 */

import { beforeEach, describe, expect, it } from 'vitest';
import type { PolygonParameters } from '@/features/openscad-geometry-builder';
import { isError, isSuccess } from '@/shared';
import { PolygonGeneratorService } from './polygon-generator';

describe('PolygonGeneratorService', () => {
  let generator: PolygonGeneratorService;

  beforeEach(() => {
    generator = new PolygonGeneratorService();
  });

  describe('generatePolygon', () => {
    describe('parameter validation', () => {
      it('should reject empty points array', () => {
        const params: PolygonParameters = { points: [], convexity: 1 };
        const result = generator.generatePolygon(params);

        expect(isError(result)).toBe(true);
        if (isError(result)) {
          expect(result.error.type).toBe('INVALID_PARAMETERS');
          expect(result.error.message).toBe('Points array is required and cannot be empty');
        }
      });

      it('should reject less than 3 points', () => {
        const params: PolygonParameters = {
          points: [
            { x: 0, y: 0 },
            { x: 1, y: 0 },
          ],
          convexity: 1,
        };
        const result = generator.generatePolygon(params);

        expect(isError(result)).toBe(true);
        if (isError(result)) {
          expect(result.error.type).toBe('INVALID_PARAMETERS');
          expect(result.error.message).toContain('at least 3 points');
        }
      });

      it('should reject negative convexity', () => {
        const params: PolygonParameters = {
          points: [
            { x: 0, y: 0 },
            { x: 10, y: 0 },
            { x: 5, y: 10 },
          ],
          convexity: -1,
        };
        const result = generator.generatePolygon(params);

        expect(isError(result)).toBe(true);
        if (isError(result)) {
          expect(result.error.type).toBe('INVALID_PARAMETERS');
          expect(result.error.message).toBe('Convexity must be non-negative');
        }
      });

      it('should reject invalid path indices', () => {
        const params: PolygonParameters = {
          points: [
            { x: 0, y: 0 },
            { x: 10, y: 0 },
            { x: 5, y: 10 },
          ],
          paths: [[0, 1, 5]], // Index 5 doesn't exist
          convexity: 1,
        };
        const result = generator.generatePolygon(params);

        expect(isError(result)).toBe(true);
        if (isError(result)) {
          expect(result.error.type).toBe('INVALID_PARAMETERS');
          expect(result.error.message).toContain('path index');
        }
      });

      it('should reject paths with less than 3 indices', () => {
        const params: PolygonParameters = {
          points: [
            { x: 0, y: 0 },
            { x: 10, y: 0 },
            { x: 5, y: 10 },
          ],
          paths: [[0, 1]], // Only 2 indices
          convexity: 1,
        };
        const result = generator.generatePolygon(params);

        expect(isError(result)).toBe(true);
        if (isError(result)) {
          expect(result.error.type).toBe('INVALID_PARAMETERS');
          expect(result.error.message).toContain('at least 3 indices');
        }
      });
    });

    describe('simple polygon generation (no paths)', () => {
      it('should generate triangle from 3 points', () => {
        const params: PolygonParameters = {
          points: [
            { x: 0, y: 0 },
            { x: 10, y: 0 },
            { x: 5, y: 10 },
          ],
          convexity: 1,
        };
        const result = generator.generatePolygon(params);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.data.vertices).toHaveLength(3);
          expect(result.data.outline).toEqual([0, 1, 2]);
          expect(result.data.holes).toEqual([]);
        }
      });

      it('should generate square from 4 points', () => {
        const params: PolygonParameters = {
          points: [
            { x: 0, y: 0 },
            { x: 10, y: 0 },
            { x: 10, y: 10 },
            { x: 0, y: 10 },
          ],
          convexity: 1,
        };
        const result = generator.generatePolygon(params);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.data.vertices).toHaveLength(4);
          expect(result.data.outline).toEqual([0, 1, 2, 3]);
          expect(result.data.holes).toEqual([]);
        }
      });

      it('should preserve original point coordinates', () => {
        const points = [
          { x: 1.5, y: 2.7 },
          { x: 8.3, y: 1.1 },
          { x: 4.9, y: 9.2 },
        ];
        const params: PolygonParameters = { points, convexity: 1 };
        const result = generator.generatePolygon(params);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.data.vertices[0]).toEqual({ x: 1.5, y: 2.7 });
          expect(result.data.vertices[1]).toEqual({ x: 8.3, y: 1.1 });
          expect(result.data.vertices[2]).toEqual({ x: 4.9, y: 9.2 });
        }
      });
    });

    describe('polygon with paths (outline and holes)', () => {
      it('should generate polygon with single path (explicit outline)', () => {
        const params: PolygonParameters = {
          points: [
            { x: 0, y: 0 },
            { x: 10, y: 0 },
            { x: 5, y: 10 },
          ],
          paths: [[0, 1, 2]],
          convexity: 1,
        };
        const result = generator.generatePolygon(params);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.data.vertices).toHaveLength(3);
          expect(result.data.outline).toEqual([0, 1, 2]);
          expect(result.data.holes).toEqual([]);
        }
      });

      it('should generate polygon with hole (square with square hole)', () => {
        const params: PolygonParameters = {
          points: [
            // Outer square
            { x: 0, y: 0 },
            { x: 10, y: 0 },
            { x: 10, y: 10 },
            { x: 0, y: 10 },
            // Inner square (hole)
            { x: 2, y: 2 },
            { x: 8, y: 2 },
            { x: 8, y: 8 },
            { x: 2, y: 8 },
          ],
          paths: [
            [0, 1, 2, 3], // Outer outline
            [4, 5, 6, 7], // Inner hole
          ],
          convexity: 1,
        };
        const result = generator.generatePolygon(params);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.data.vertices).toHaveLength(8);
          expect(result.data.outline).toEqual([0, 1, 2, 3]);
          expect(result.data.holes).toEqual([[4, 5, 6, 7]]);
        }
      });

      it('should generate polygon with multiple holes', () => {
        const params: PolygonParameters = {
          points: [
            // Outer rectangle
            { x: 0, y: 0 },
            { x: 20, y: 0 },
            { x: 20, y: 10 },
            { x: 0, y: 10 },
            // First hole
            { x: 2, y: 2 },
            { x: 6, y: 2 },
            { x: 6, y: 8 },
            { x: 2, y: 8 },
            // Second hole
            { x: 14, y: 2 },
            { x: 18, y: 2 },
            { x: 18, y: 8 },
            { x: 14, y: 8 },
          ],
          paths: [
            [0, 1, 2, 3], // Outer outline
            [4, 5, 6, 7], // First hole
            [8, 9, 10, 11], // Second hole
          ],
          convexity: 1,
        };
        const result = generator.generatePolygon(params);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.data.vertices).toHaveLength(12);
          expect(result.data.outline).toEqual([0, 1, 2, 3]);
          expect(result.data.holes).toEqual([
            [4, 5, 6, 7],
            [8, 9, 10, 11],
          ]);
        }
      });

      it('should handle non-sequential point indices in paths', () => {
        const params: PolygonParameters = {
          points: [
            { x: 0, y: 0 },
            { x: 10, y: 0 },
            { x: 10, y: 10 },
            { x: 0, y: 10 },
            { x: 5, y: 5 },
          ],
          paths: [[0, 2, 4, 1, 3]], // Non-sequential indices
          convexity: 1,
        };
        const result = generator.generatePolygon(params);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.data.outline).toEqual([0, 2, 4, 1, 3]);
        }
      });
    });

    describe('area calculation', () => {
      it('should calculate correct area for simple triangle', () => {
        const params: PolygonParameters = {
          points: [
            { x: 0, y: 0 },
            { x: 10, y: 0 },
            { x: 5, y: 10 },
          ],
          convexity: 1,
        };
        const result = generator.generatePolygon(params);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          const expectedArea = 50; // 0.5 * base * height = 0.5 * 10 * 10
          expect(result.data.metadata.area).toBeCloseTo(expectedArea, 5);
        }
      });

      it('should calculate correct area for square', () => {
        const params: PolygonParameters = {
          points: [
            { x: 0, y: 0 },
            { x: 10, y: 0 },
            { x: 10, y: 10 },
            { x: 0, y: 10 },
          ],
          convexity: 1,
        };
        const result = generator.generatePolygon(params);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          const expectedArea = 100; // 10 * 10
          expect(result.data.metadata.area).toBeCloseTo(expectedArea, 5);
        }
      });

      it('should calculate correct area for polygon with hole', () => {
        const params: PolygonParameters = {
          points: [
            // Outer 10x10 square
            { x: 0, y: 0 },
            { x: 10, y: 0 },
            { x: 10, y: 10 },
            { x: 0, y: 10 },
            // Inner 4x4 square hole
            { x: 3, y: 3 },
            { x: 7, y: 3 },
            { x: 7, y: 7 },
            { x: 3, y: 7 },
          ],
          paths: [
            [0, 1, 2, 3], // Outer outline (area = 100)
            [4, 5, 6, 7], // Inner hole (area = 16)
          ],
          convexity: 1,
        };
        const result = generator.generatePolygon(params);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          const expectedArea = 100 - 16; // Outer area - hole area = 84
          expect(result.data.metadata.area).toBeCloseTo(expectedArea, 5);
        }
      });
    });

    describe('metadata validation', () => {
      it('should set correct primitive type', () => {
        const params: PolygonParameters = {
          points: [
            { x: 0, y: 0 },
            { x: 10, y: 0 },
            { x: 5, y: 10 },
          ],
          convexity: 1,
        };
        const result = generator.generatePolygon(params);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.data.metadata.primitiveType).toBe('2d-polygon');
        }
      });

      it('should include generation timestamp', () => {
        const params: PolygonParameters = {
          points: [
            { x: 0, y: 0 },
            { x: 10, y: 0 },
            { x: 5, y: 10 },
          ],
          convexity: 1,
        };
        const beforeTime = Date.now();
        const result = generator.generatePolygon(params);
        const afterTime = Date.now();

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.data.metadata.generatedAt).toBeGreaterThanOrEqual(beforeTime);
          expect(result.data.metadata.generatedAt).toBeLessThanOrEqual(afterTime);
        }
      });

      it('should store correct point and path counts', () => {
        const params: PolygonParameters = {
          points: [
            { x: 0, y: 0 },
            { x: 10, y: 0 },
            { x: 10, y: 10 },
            { x: 0, y: 10 },
            { x: 2, y: 2 },
            { x: 8, y: 2 },
            { x: 8, y: 8 },
            { x: 2, y: 8 },
          ],
          paths: [
            [0, 1, 2, 3], // Outline
            [4, 5, 6, 7], // Hole
          ],
          convexity: 1,
        };
        const result = generator.generatePolygon(params);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.data.metadata.parameters.pointCount).toBe(8);
          expect(result.data.metadata.parameters.pathCount).toBe(2);
          expect(result.data.metadata.parameters.hasHoles).toBe(true);
        }
      });

      it('should detect when polygon has no holes', () => {
        const params: PolygonParameters = {
          points: [
            { x: 0, y: 0 },
            { x: 10, y: 0 },
            { x: 5, y: 10 },
          ],
          convexity: 1,
        };
        const result = generator.generatePolygon(params);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.data.metadata.parameters.hasHoles).toBe(false);
        }
      });
    });
  });

  describe('performance', () => {
    it('should handle complex polygons efficiently', () => {
      // Create a polygon with many vertices
      const points = [];
      for (let i = 0; i < 100; i++) {
        const angle = (2 * Math.PI * i) / 100;
        points.push({ x: Math.cos(angle) * 10, y: Math.sin(angle) * 10 });
      }

      const params: PolygonParameters = { points, convexity: 1 };
      const startTime = performance.now();
      const result = generator.generatePolygon(params);
      const endTime = performance.now();

      expect(isSuccess(result)).toBe(true);
      expect(endTime - startTime).toBeLessThan(16); // Should complete in <16ms
      if (isSuccess(result)) {
        expect(result.data.vertices).toHaveLength(100);
      }
    });
  });
});
