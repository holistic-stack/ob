/**
 * @file primitive-3d-factory.test.ts
 * @description Test suite for 3D Primitive Factory Service following TDD methodology.
 * Tests the unified API for all 3D primitive generation.
 *
 * @author OpenSCAD Babylon Team
 * @version 1.0.0
 * @since 2025-07-29
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { isError, isSuccess } from '@/shared/types/result.types';
import { FragmentCalculatorService } from '../../../fragment-calculator';
import { Primitive3DFactory } from './primitive-3d-factory';

describe('Primitive3DFactory', () => {
  let factory: Primitive3DFactory;
  let fragmentCalculator: FragmentCalculatorService;

  beforeEach(() => {
    fragmentCalculator = new FragmentCalculatorService();
    factory = new Primitive3DFactory(fragmentCalculator);
  });

  describe('generatePrimitive', () => {
    describe('sphere generation', () => {
      it('should generate sphere using factory API', () => {
        const result = factory.generatePrimitive('sphere', {
          radius: 5,
          fn: 8,
          fs: 2,
          fa: 12,
        });

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          const sphere = result.data;
          expect(sphere.metadata.primitiveType).toBe('3d-sphere');
          expect(sphere.metadata.parameters.radius).toBe(5);
          expect(sphere.metadata.parameters.fragments).toBe(8);
        }
      });

      it('should handle $fn=3 sphere (the main issue)', () => {
        const result = factory.generatePrimitive('sphere', {
          radius: 5,
          fn: 3,
          fs: 2,
          fa: 12,
        });

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          const sphere = result.data;
          expect(sphere.metadata.parameters.fragments).toBe(3);
          expect(sphere.vertices).toHaveLength(6); // 2 rings × 3 fragments
        }
      });
    });

    describe('cube generation', () => {
      it('should generate cube using factory API', () => {
        const result = factory.generatePrimitive('cube', {
          size: { x: 2, y: 4, z: 6 },
          center: true,
        });

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          const cube = result.data;
          expect(cube.metadata.primitiveType).toBe('3d-cube');
          expect(cube.metadata.parameters.size).toEqual({ x: 2, y: 4, z: 6 });
          expect(cube.metadata.parameters.center).toBe(true);
          expect(cube.vertices).toHaveLength(8);
        }
      });

      it('should generate uniform cube', () => {
        const result = factory.generatePrimitive('cube', {
          size: 5,
          center: false,
        });

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          const cube = result.data;
          expect(cube.metadata.parameters.size).toEqual({ x: 5, y: 5, z: 5 });
        }
      });
    });

    describe('cylinder generation', () => {
      it('should generate cylinder using factory API', () => {
        const result = factory.generatePrimitive('cylinder', {
          height: 10,
          r1: 5,
          r2: 3,
          center: false,
          fn: 8,
          fs: 2,
          fa: 12,
        });

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          const cylinder = result.data;
          expect(cylinder.metadata.primitiveType).toBe('3d-cylinder');
          expect(cylinder.metadata.parameters.height).toBe(10);
          expect(cylinder.metadata.parameters.r1).toBe(5);
          expect(cylinder.metadata.parameters.r2).toBe(3);
        }
      });

      it('should generate cone (r2=0)', () => {
        const result = factory.generatePrimitive('cylinder', {
          height: 8,
          r1: 4,
          r2: 0,
          center: true,
          fn: 6,
          fs: 2,
          fa: 12,
        });

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          const cylinder = result.data;
          expect(cylinder.metadata.parameters.r2).toBe(0);
        }
      });
    });

    describe('polyhedron generation', () => {
      it('should generate polyhedron using factory API', () => {
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

        const result = factory.generatePrimitive('polyhedron' as const, {
          points: vertices,
          faces: faces,
          convexity: 1,
        });

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          const polyhedron = result.data;
          expect(polyhedron.metadata.primitiveType).toBe('3d-polyhedron');

          // Type guard: check if this is a polyhedron geometry
          if (polyhedron.metadata.primitiveType === '3d-polyhedron') {
            expect(polyhedron.metadata.parameters.vertexCount).toBe(4);
            expect(polyhedron.metadata.parameters.faceCount).toBe(4);
            expect(polyhedron.metadata.parameters.convexity).toBe(1);
          }
        }
      });
    });

    describe('error handling', () => {
      it('should handle invalid primitive type', () => {
        const result = factory.generatePrimitive('invalid' as any, {} as any);

        expect(isError(result)).toBe(true);
        if (isError(result)) {
          expect(result.error.type).toBe('INVALID_PARAMETERS');
          expect(result.error.message).toContain('Unknown primitive type');
        }
      });

      it('should propagate parameter validation errors', () => {
        const result = factory.generatePrimitive('sphere', {
          radius: -5, // Invalid negative radius
          fn: 8,
          fs: 2,
          fa: 12,
        });

        expect(isError(result)).toBe(true);
        if (isError(result)) {
          expect(result.error.type).toBe('INVALID_PARAMETERS');
        }
      });
    });
  });

  describe('getAvailablePrimitiveTypes', () => {
    it('should return all available primitive types', () => {
      const types = factory.getAvailablePrimitiveTypes();

      expect(types).toEqual(['sphere', 'cube', 'cylinder', 'polyhedron']);
      expect(types).toHaveLength(4);
    });
  });

  describe('getGenerators', () => {
    it('should provide access to individual generators', () => {
      const generators = factory.getGenerators();

      expect(generators.sphere).toBeDefined();
      expect(generators.cube).toBeDefined();
      expect(generators.cylinder).toBeDefined();
      expect(generators.polyhedron).toBeDefined();
    });

    it('should allow direct generator usage', () => {
      const generators = factory.getGenerators();

      const result = generators.sphere.generateSphere(5, 8);
      expect(isSuccess(result)).toBe(true);
    });
  });

  describe('generateBatch', () => {
    it('should generate multiple primitives in batch', () => {
      const requests = [
        {
          id: 'sphere1',
          type: 'sphere' as const,
          parameters: { radius: 3, fn: 6, fs: 2, fa: 12 },
        },
        {
          id: 'cube1',
          type: 'cube' as const,
          parameters: { size: 2, center: true },
        },
        {
          type: 'cylinder' as const,
          parameters: { height: 5, r: 2, center: false, fn: 8, fs: 2, fa: 12 },
        },
      ];

      const results = factory.generateBatch(requests);

      expect(results).toHaveLength(3);

      // Check first result (sphere)
      expect(results[0]?.id).toBe('sphere1');
      expect(results[0]?.result).toBeDefined();
      if (results[0]?.result) {
        expect(isSuccess(results[0].result)).toBe(true);
      }

      // Check second result (cube)
      expect(results[1]?.id).toBe('cube1');
      expect(results[1]?.result).toBeDefined();
      if (results[1]?.result) {
        expect(isSuccess(results[1].result)).toBe(true);
      }

      // Check third result (cylinder, no id)
      expect(results[2]?.id).toBeUndefined();
      expect(results[2]?.result).toBeDefined();
      if (results[2]?.result) {
        expect(isSuccess(results[2].result)).toBe(true);
      }
    });

    it('should handle mixed success and failure in batch', () => {
      const requests = [
        {
          id: 'valid',
          type: 'sphere' as const,
          parameters: { radius: 5, fn: 8, fs: 2, fa: 12 },
        },
        {
          id: 'invalid',
          type: 'sphere' as const,
          parameters: { radius: -5, fn: 8, fs: 2, fa: 12 }, // Invalid
        },
      ];

      const results = factory.generateBatch(requests);

      expect(results).toHaveLength(2);
      expect(results[0]?.result).toBeDefined();
      expect(results[1]?.result).toBeDefined();

      if (results[0]?.result && results[1]?.result) {
        expect(isSuccess(results[0].result)).toBe(true);
        expect(isError(results[1].result)).toBe(true);
      }
    });
  });

  describe('getFactoryStatistics', () => {
    it('should return factory statistics', () => {
      const stats = factory.getFactoryStatistics();

      expect(stats.availablePrimitives).toEqual(['sphere', 'cube', 'cylinder', 'polyhedron']);
      expect(stats.generatorCount).toBe(4);
      expect(stats.version).toBe('1.0.0');
    });
  });

  describe('performance', () => {
    it('should handle factory operations efficiently', () => {
      const startTime = performance.now();

      // Generate multiple primitives
      const sphereResult = factory.generatePrimitive('sphere', { radius: 5, fn: 8, fs: 2, fa: 12 });
      const cubeResult = factory.generatePrimitive('cube', { size: 3, center: true });
      const cylinderResult = factory.generatePrimitive('cylinder', {
        height: 6,
        r: 2,
        center: false,
        fn: 8,
        fs: 2,
        fa: 12,
      });

      const endTime = performance.now();

      expect(isSuccess(sphereResult)).toBe(true);
      expect(isSuccess(cubeResult)).toBe(true);
      expect(isSuccess(cylinderResult)).toBe(true);
      expect(endTime - startTime).toBeLessThan(100); // Should be fast (<100ms)
    });
  });
});
