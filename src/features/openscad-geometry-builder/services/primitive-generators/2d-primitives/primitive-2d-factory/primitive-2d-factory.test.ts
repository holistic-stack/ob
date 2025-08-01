/**
 * @file primitive-2d-factory.test.ts
 * @description Comprehensive tests for Primitive2DFactory following TDD methodology.
 * Tests unified 2D primitive generation API with type safety and performance optimization.
 *
 * @example
 * ```typescript
 * // Test unified API
 * const result = factory.generatePrimitive('circle', {
 *   radius: 5,
 *   fn: 6,
 *   fs: 2,
 *   fa: 12
 * });
 * expect(result.success).toBe(true);
 * expect(result.data.vertices).toHaveLength(6);
 * ```
 *
 * @author OpenSCAD Babylon Team
 * @version 1.0.0
 * @since 2025-07-29
 */

import { beforeEach, describe, expect, it } from 'vitest';
import type {
  CircleParameters,
  PolygonParameters,
  SquareParameters,
} from '@/features/openscad-geometry-builder';
import { isError, isSuccess } from '@/shared';
import { FragmentCalculatorService } from '../../../fragment-calculator';
import { Primitive2DFactory } from './primitive-2d-factory';

describe('Primitive2DFactory', () => {
  let factory: Primitive2DFactory;
  let fragmentCalculator: FragmentCalculatorService;

  beforeEach(() => {
    fragmentCalculator = new FragmentCalculatorService();
    factory = new Primitive2DFactory(fragmentCalculator);
  });

  describe('generatePrimitive', () => {
    describe('circle generation', () => {
      it('should generate circle with radius parameter', () => {
        const params: CircleParameters = {
          radius: 5,
          fn: 6,
          fs: 2,
          fa: 12,
        };
        const result = factory.generatePrimitive('circle', params);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.data.vertices).toHaveLength(6);
          expect(result.data.metadata.primitiveType).toBe('2d-circle');
        }
      });

      it('should generate circle with diameter parameter', () => {
        const params: CircleParameters = {
          diameter: 10,
          fn: 8,
          fs: 2,
          fa: 12,
        };
        const result = factory.generatePrimitive('circle', params);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.data.vertices).toHaveLength(8);
          expect(result.data.metadata.primitiveType).toBe('2d-circle');
        }
      });
    });

    describe('square generation', () => {
      it('should generate square with number size', () => {
        const params: SquareParameters = {
          size: 10,
          center: false,
        };
        const result = factory.generatePrimitive('square', params);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.data.vertices).toHaveLength(4);
          expect(result.data.metadata.primitiveType).toBe('2d-square');
        }
      });

      it('should generate rectangle with Vector2 size', () => {
        const params: SquareParameters = {
          size: { x: 5, y: 10 },
          center: true,
        };
        const result = factory.generatePrimitive('square', params);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.data.vertices).toHaveLength(4);
          expect(result.data.metadata.primitiveType).toBe('2d-square');
        }
      });
    });

    describe('polygon generation', () => {
      it('should generate simple polygon', () => {
        const params: PolygonParameters = {
          points: [
            { x: 0, y: 0 },
            { x: 10, y: 0 },
            { x: 5, y: 10 },
          ],
          convexity: 1,
        };
        const result = factory.generatePrimitive('polygon', params);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.data.vertices).toHaveLength(3);
          expect(result.data.metadata.primitiveType).toBe('2d-polygon');
        }
      });

      it('should generate polygon with holes', () => {
        const params: PolygonParameters = {
          points: [
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
          ],
          paths: [
            [0, 1, 2, 3], // Outer outline
            [4, 5, 6, 7], // Inner hole
          ],
          convexity: 1,
        };
        const result = factory.generatePrimitive('polygon', params);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.data.vertices).toHaveLength(8);
          expect(result.data.holes).toHaveLength(1);
          expect(result.data.metadata.primitiveType).toBe('2d-polygon');
        }
      });
    });

    describe('error handling', () => {
      it('should handle unknown primitive type', () => {
        // @ts-expect-error Testing invalid type
        const result = factory.generatePrimitive('unknown', {});

        expect(isError(result)).toBe(true);
        if (isError(result)) {
          expect(result.error.type).toBe('INVALID_PARAMETERS');
          expect(result.error.message).toContain('Unknown primitive type');
        }
      });

      it('should handle invalid circle parameters', () => {
        const params: CircleParameters = {
          radius: -5, // Invalid negative radius
          fn: 6,
          fs: 2,
          fa: 12,
        };
        const result = factory.generatePrimitive('circle', params);

        expect(isError(result)).toBe(true);
        if (isError(result)) {
          expect(result.error.type).toBe('INVALID_PARAMETERS');
        }
      });

      it('should handle invalid square parameters', () => {
        const params: SquareParameters = {
          size: 0, // Invalid zero size
          center: false,
        };
        const result = factory.generatePrimitive('square', params);

        expect(isError(result)).toBe(true);
        if (isError(result)) {
          expect(result.error.type).toBe('INVALID_PARAMETERS');
        }
      });

      it('should handle invalid polygon parameters', () => {
        const params: PolygonParameters = {
          points: [], // Empty points array
          convexity: 1,
        };
        const result = factory.generatePrimitive('polygon', params);

        expect(isError(result)).toBe(true);
        if (isError(result)) {
          expect(result.error.type).toBe('INVALID_PARAMETERS');
        }
      });
    });
  });

  describe('getAvailablePrimitiveTypes', () => {
    it('should return all available 2D primitive types', () => {
      const types = factory.getAvailablePrimitiveTypes();

      expect(types).toEqual(['circle', 'square', 'polygon']);
      expect(Object.isFrozen(types)).toBe(true);
    });
  });

  describe('getGenerators', () => {
    it('should return individual generator services', () => {
      const generators = factory.getGenerators();

      expect(generators.circle).toBeDefined();
      expect(generators.square).toBeDefined();
      expect(generators.polygon).toBeDefined();
      expect(Object.isFrozen(generators)).toBe(true);
    });

    it('should allow direct access to individual generators', () => {
      const generators = factory.getGenerators();

      const circleResult = generators.circle.generateCircle({ radius: 5, fn: 6, fs: 2, fa: 12 });
      expect(isSuccess(circleResult)).toBe(true);

      const squareResult = generators.square.generateSquare({ size: 10, center: false });
      expect(isSuccess(squareResult)).toBe(true);

      const polygonResult = generators.polygon.generatePolygon({
        points: [
          { x: 0, y: 0 },
          { x: 10, y: 0 },
          { x: 5, y: 10 },
        ],
        convexity: 1,
      });
      expect(isSuccess(polygonResult)).toBe(true);
    });
  });

  describe('generateMultiplePrimitives', () => {
    it('should generate multiple primitives in batch', () => {
      const requests = [
        { type: 'circle' as const, parameters: { radius: 5, fn: 6, fs: 2, fa: 12 } },
        { type: 'square' as const, parameters: { size: 10, center: false } },
        {
          type: 'polygon' as const,
          parameters: {
            points: [
              { x: 0, y: 0 },
              { x: 10, y: 0 },
              { x: 5, y: 10 },
            ],
            convexity: 1,
          },
        },
      ];

      const results = factory.generateMultiplePrimitives(requests);

      expect(results).toHaveLength(3);
      expect(isSuccess(results[0])).toBe(true);
      expect(isSuccess(results[1])).toBe(true);
      expect(isSuccess(results[2])).toBe(true);
    });

    it('should handle mixed success and error results', () => {
      const requests = [
        { type: 'circle' as const, parameters: { radius: 5, fn: 6, fs: 2, fa: 12 } },
        { type: 'square' as const, parameters: { size: -10, center: false } }, // Invalid
        {
          type: 'polygon' as const,
          parameters: {
            points: [
              { x: 0, y: 0 },
              { x: 10, y: 0 },
              { x: 5, y: 10 },
            ],
            convexity: 1,
          },
        },
      ];

      const results = factory.generateMultiplePrimitives(requests);

      expect(results).toHaveLength(3);
      expect(isSuccess(results[0])).toBe(true);
      expect(isError(results[1])).toBe(true);
      expect(isSuccess(results[2])).toBe(true);
    });
  });

  describe('performance', () => {
    it('should handle multiple primitive generation efficiently', () => {
      const startTime = performance.now();

      const requests = Array.from({ length: 10 }, (_, i) => ({
        type: 'circle' as const,
        parameters: { radius: i + 1, fn: 8, fs: 2, fa: 12 },
      }));

      const results = factory.generateMultiplePrimitives(requests);
      const endTime = performance.now();

      expect(results).toHaveLength(10);
      expect(results.every((result) => isSuccess(result))).toBe(true);
      expect(endTime - startTime).toBeLessThan(100); // Should complete in <100ms
    });
  });
});
