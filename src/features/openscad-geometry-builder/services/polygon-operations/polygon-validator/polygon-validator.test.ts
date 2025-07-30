/**
 * @file polygon-validator.test.ts
 * @description Comprehensive tests for PolygonValidator following TDD methodology.
 * Tests advanced polygon validation including self-intersection detection, winding order validation,
 * and complex polygon analysis.
 *
 * @example
 * ```typescript
 * // Test self-intersection detection
 * const validator = new PolygonValidator();
 * const result = validator.validatePolygon({
 *   vertices: [{ x: 0, y: 0 }, { x: 10, y: 10 }, { x: 10, y: 0 }, { x: 0, y: 10 }],
 *   outline: [0, 1, 2, 3]
 * });
 * expect(result.success).toBe(false);
 * expect(result.error.type).toBe('SELF_INTERSECTION');
 * ```
 *
 * @author OpenSCAD Babylon Team
 * @version 1.0.0
 * @since 2025-07-29
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { isError, isSuccess } from '../../../../../shared/types/result.types';
import type { Vector2 } from '../../../types/geometry-data';
import { PolygonValidator } from './polygon-validator';

describe('PolygonValidator', () => {
  let validator: PolygonValidator;

  beforeEach(() => {
    validator = new PolygonValidator();
  });

  describe('validatePolygon', () => {
    describe('basic validation', () => {
      it('should accept valid simple triangle', () => {
        const polygonData = {
          vertices: [
            { x: 0, y: 0 },
            { x: 10, y: 0 },
            { x: 5, y: 10 },
          ] as Vector2[],
          outline: [0, 1, 2],
          holes: [] as number[][],
        };

        const result = validator.validatePolygon(polygonData);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.data.isValid).toBe(true);
          expect(result.data.hasSelfIntersection).toBe(false);
          expect(result.data.windingOrder).toBe('counter-clockwise');
        }
      });

      it('should accept valid simple square', () => {
        const polygonData = {
          vertices: [
            { x: 0, y: 0 },
            { x: 10, y: 0 },
            { x: 10, y: 10 },
            { x: 0, y: 10 },
          ] as Vector2[],
          outline: [0, 1, 2, 3],
          holes: [] as number[][],
        };

        const result = validator.validatePolygon(polygonData);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.data.isValid).toBe(true);
          expect(result.data.hasSelfIntersection).toBe(false);
          expect(result.data.windingOrder).toBe('counter-clockwise');
        }
      });

      it('should detect clockwise winding order', () => {
        const polygonData = {
          vertices: [
            { x: 0, y: 0 },
            { x: 0, y: 10 },
            { x: 10, y: 10 },
            { x: 10, y: 0 },
          ] as Vector2[],
          outline: [0, 1, 2, 3],
          holes: [] as number[][],
        };

        const result = validator.validatePolygon(polygonData);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.data.isValid).toBe(true);
          expect(result.data.windingOrder).toBe('clockwise');
        }
      });
    });

    describe('self-intersection detection', () => {
      it('should detect simple self-intersection (figure-8)', () => {
        const polygonData = {
          vertices: [
            { x: 0, y: 0 },
            { x: 10, y: 10 },
            { x: 10, y: 0 },
            { x: 0, y: 10 },
          ] as Vector2[],
          outline: [0, 1, 2, 3],
          holes: [] as number[][],
        };

        const result = validator.validatePolygon(polygonData);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.data.isValid).toBe(false);
          expect(result.data.hasSelfIntersection).toBe(true);
          expect(result.data.intersectionPoints).toHaveLength(1);
          expect(result.data.intersectionPoints[0]).toEqual({ x: 5, y: 5 });
        }
      });

      it('should detect complex self-intersection', () => {
        // Create a more complex self-intersecting polygon - a star shape that crosses itself
        const polygonData = {
          vertices: [
            { x: 5, y: 0 }, // Bottom center
            { x: 0, y: 10 }, // Top left
            { x: 10, y: 4 }, // Middle right
            { x: 0, y: 4 }, // Middle left
            { x: 10, y: 10 }, // Top right
          ] as Vector2[],
          outline: [0, 1, 2, 3, 4],
          holes: [] as number[][],
        };

        const result = validator.validatePolygon(polygonData);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.data.isValid).toBe(false);
          expect(result.data.hasSelfIntersection).toBe(true);
          expect(result.data.intersectionPoints.length).toBeGreaterThan(0);
        }
      });

      it('should handle no self-intersection in complex polygon', () => {
        const polygonData = {
          vertices: [
            { x: 0, y: 0 },
            { x: 10, y: 0 },
            { x: 15, y: 5 },
            { x: 10, y: 10 },
            { x: 0, y: 10 },
            { x: -5, y: 5 },
          ] as Vector2[],
          outline: [0, 1, 2, 3, 4, 5],
          holes: [] as number[][],
        };

        const result = validator.validatePolygon(polygonData);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.data.isValid).toBe(true);
          expect(result.data.hasSelfIntersection).toBe(false);
          expect(result.data.intersectionPoints).toHaveLength(0);
        }
      });
    });

    describe('degenerate polygon detection', () => {
      it('should detect zero area polygon (collinear points)', () => {
        const polygonData = {
          vertices: [
            { x: 0, y: 0 },
            { x: 5, y: 0 },
            { x: 10, y: 0 },
          ] as Vector2[],
          outline: [0, 1, 2],
          holes: [] as number[][],
        };

        const result = validator.validatePolygon(polygonData);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.data.isValid).toBe(false);
          expect(result.data.isDegenerate).toBe(true);
          expect(result.data.area).toBeCloseTo(0, 5);
        }
      });

      it('should detect duplicate consecutive vertices', () => {
        const polygonData = {
          vertices: [
            { x: 0, y: 0 },
            { x: 10, y: 0 },
            { x: 10, y: 0 }, // Duplicate
            { x: 5, y: 10 },
          ] as Vector2[],
          outline: [0, 1, 2, 3],
          holes: [] as number[][],
        };

        const result = validator.validatePolygon(polygonData);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.data.isValid).toBe(false);
          expect(result.data.isDegenerate).toBe(true);
          expect(result.data.hasDuplicateVertices).toBe(true);
        }
      });
    });

    describe('polygon with holes validation', () => {
      it('should validate polygon with valid hole', () => {
        const polygonData = {
          vertices: [
            // Outer square
            { x: 0, y: 0 },
            { x: 10, y: 0 },
            { x: 10, y: 10 },
            { x: 0, y: 10 },
            // Inner hole
            { x: 2, y: 2 },
            { x: 8, y: 2 },
            { x: 8, y: 8 },
            { x: 2, y: 8 },
          ] as Vector2[],
          outline: [0, 1, 2, 3],
          holes: [[4, 5, 6, 7]],
        };

        const result = validator.validatePolygon(polygonData);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.data.isValid).toBe(true);
          expect(result.data.hasValidHoles).toBe(true);
          expect(result.data.holeValidation).toHaveLength(1);
          expect(result.data.holeValidation[0].isInsideOutline).toBe(true);
        }
      });

      it('should detect hole outside outline', () => {
        const polygonData = {
          vertices: [
            // Outer square
            { x: 0, y: 0 },
            { x: 10, y: 0 },
            { x: 10, y: 10 },
            { x: 0, y: 10 },
            // Hole outside outline
            { x: 15, y: 15 },
            { x: 20, y: 15 },
            { x: 20, y: 20 },
            { x: 15, y: 20 },
          ] as Vector2[],
          outline: [0, 1, 2, 3],
          holes: [[4, 5, 6, 7]],
        };

        const result = validator.validatePolygon(polygonData);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.data.isValid).toBe(false);
          expect(result.data.hasValidHoles).toBe(false);
          expect(result.data.holeValidation[0].isInsideOutline).toBe(false);
        }
      });

      it('should detect overlapping holes', () => {
        const polygonData = {
          vertices: [
            // Outer square
            { x: 0, y: 0 },
            { x: 20, y: 0 },
            { x: 20, y: 20 },
            { x: 0, y: 20 },
            // First hole
            { x: 2, y: 2 },
            { x: 10, y: 2 },
            { x: 10, y: 10 },
            { x: 2, y: 10 },
            // Overlapping hole
            { x: 8, y: 8 },
            { x: 18, y: 8 },
            { x: 18, y: 18 },
            { x: 8, y: 18 },
          ] as Vector2[],
          outline: [0, 1, 2, 3],
          holes: [
            [4, 5, 6, 7],
            [8, 9, 10, 11],
          ],
        };

        const result = validator.validatePolygon(polygonData);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.data.isValid).toBe(false);
          expect(result.data.hasValidHoles).toBe(false);
          expect(result.data.hasOverlappingHoles).toBe(true);
        }
      });
    });

    describe('error handling', () => {
      it('should handle empty vertices array', () => {
        const polygonData = {
          vertices: [] as Vector2[],
          outline: [],
          holes: [] as number[][],
        };

        const result = validator.validatePolygon(polygonData);

        expect(isError(result)).toBe(true);
        if (isError(result)) {
          expect(result.error.type).toBe('INVALID_PARAMETERS');
          expect(result.error.message).toBe('Vertices array is required and cannot be empty');
        }
      });

      it('should handle invalid outline indices', () => {
        const polygonData = {
          vertices: [
            { x: 0, y: 0 },
            { x: 10, y: 0 },
            { x: 5, y: 10 },
          ] as Vector2[],
          outline: [0, 1, 5], // Index 5 doesn't exist
          holes: [] as number[][],
        };

        const result = validator.validatePolygon(polygonData);

        expect(isError(result)).toBe(true);
        if (isError(result)) {
          expect(result.error.type).toBe('INVALID_PARAMETERS');
          expect(result.error.message).toContain('outline index');
        }
      });
    });
  });

  describe('performance', () => {
    it('should handle complex polygons efficiently', () => {
      // Create a complex polygon with many vertices
      const vertices: Vector2[] = [];
      const outline: number[] = [];

      // Generate a star-like polygon with 100 vertices
      for (let i = 0; i < 100; i++) {
        const angle = (2 * Math.PI * i) / 100;
        const radius = i % 2 === 0 ? 10 : 5; // Alternating radius for star shape
        vertices.push({
          x: Math.cos(angle) * radius,
          y: Math.sin(angle) * radius,
        });
        outline.push(i);
      }

      const polygonData = {
        vertices,
        outline,
        holes: [] as number[][],
      };

      const startTime = performance.now();
      const result = validator.validatePolygon(polygonData);
      const endTime = performance.now();

      expect(isSuccess(result)).toBe(true);
      expect(endTime - startTime).toBeLessThan(100); // Should complete in <100ms
    });
  });
});
