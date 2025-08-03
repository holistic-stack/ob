/**
 * @file geometry-utilities.test.ts
 * @description Test suite for geometry utility functions following TDD methodology.
 * Tests all common geometry operations used across OpenSCAD primitive generators.
 *
 * @author OpenSCAD Babylon Team
 * @version 1.0.0
 * @since 2025-07-29
 */

import { describe, expect, it, vi } from 'vitest';
import { isError, isSuccess } from '@/shared/types/result.types';
import {
  calculateBoundingBox,
  calculateCenterPoint,
  calculateFragmentsWithErrorHandling,
  calculateVectorLength,
  convertVertexArraysToVector3,
  createGeometryMetadata,
  generateNormalsFromPositions,
  isApproximatelyEqual,
  isApproximatelyZero,
  normalizeVector3,
  resolveRadiusFromParameters,
} from './geometry-utilities';

describe('Geometry Utilities', () => {
  describe('normalizeVector3', () => {
    it('should normalize unit vectors correctly', () => {
      const result = normalizeVector3({ x: 1, y: 0, z: 0 });
      expect(result.x).toBeCloseTo(1);
      expect(result.y).toBeCloseTo(0);
      expect(result.z).toBeCloseTo(0);
    });

    it('should normalize arbitrary vectors correctly', () => {
      const result = normalizeVector3({ x: 3, y: 4, z: 0 });
      expect(result.x).toBeCloseTo(0.6);
      expect(result.y).toBeCloseTo(0.8);
      expect(result.z).toBeCloseTo(0);
    });

    it('should handle zero vectors', () => {
      const result = normalizeVector3({ x: 0, y: 0, z: 0 });
      expect(result.x).toBe(0);
      expect(result.y).toBe(0);
      expect(result.z).toBe(0);
    });
  });

  describe('calculateVectorLength', () => {
    it('should calculate length of unit vectors', () => {
      const result = calculateVectorLength({ x: 1, y: 0, z: 0 });
      expect(result).toBeCloseTo(1);
    });

    it('should calculate length of arbitrary vectors', () => {
      const result = calculateVectorLength({ x: 3, y: 4, z: 0 });
      expect(result).toBeCloseTo(5);
    });

    it('should return zero for zero vector', () => {
      const result = calculateVectorLength({ x: 0, y: 0, z: 0 });
      expect(result).toBe(0);
    });
  });

  describe('resolveRadiusFromParameters', () => {
    it('should prefer diameter over radius', () => {
      const result = resolveRadiusFromParameters(5, 10);
      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data).toBe(5); // diameter / 2
      }
    });

    it('should use radius when diameter not provided', () => {
      const result = resolveRadiusFromParameters(7, undefined);
      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data).toBe(7);
      }
    });

    it('should return error when neither provided', () => {
      const result = resolveRadiusFromParameters(undefined, undefined);
      expect(isError(result)).toBe(true);
      if (isError(result)) {
        expect(result.error.message).toContain('Either radius or diameter must be specified');
      }
    });
  });

  describe('calculateFragmentsWithErrorHandling', () => {
    it('should return fragments on successful calculation', () => {
      const mockCalculator = {
        calculateFragments: vi.fn().mockReturnValue({ success: true, data: 8 }),
      };

      const result = calculateFragmentsWithErrorHandling(mockCalculator as any, 5, 0, 2, 12);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data).toBe(8);
      }
    });

    it('should propagate calculator errors', () => {
      const mockCalculator = {
        calculateFragments: vi.fn().mockReturnValue({
          success: false,
          error: { message: 'Invalid parameters' },
        }),
      };

      const result = calculateFragmentsWithErrorHandling(mockCalculator as any, 5, 0, 2, 12);

      expect(isError(result)).toBe(true);
      if (isError(result)) {
        expect(result.error.message).toContain('Fragment calculation failed');
      }
    });
  });

  describe('createGeometryMetadata', () => {
    it('should create standard metadata', () => {
      const metadata = createGeometryMetadata('3d-sphere', { radius: 5, fragments: 8 }, true);

      expect(metadata.primitiveType).toBe('3d-sphere');
      expect(metadata.parameters).toEqual({ radius: 5, fragments: 8 });
      expect(metadata.isConvex).toBe(true);
      expect(typeof metadata.generatedAt).toBe('number');
    });

    it('should include additional data', () => {
      const metadata = createGeometryMetadata('3d-cube', { size: { x: 2, y: 4, z: 6 } }, true, {
        customField: 'test',
      });

      expect((metadata as any).customField).toBe('test');
    });
  });

  describe('generateNormalsFromPositions', () => {
    it('should generate normalized normals', () => {
      const vertices = [
        { x: 3, y: 4, z: 0 },
        { x: 0, y: 0, z: 5 },
      ];

      const normals = generateNormalsFromPositions(vertices);

      expect(normals).toHaveLength(2);
      expect(normals[0]).toBeDefined();
      expect(normals[1]).toBeDefined();
      expect(normals[0]?.x).toBeCloseTo(0.6);
      expect(normals[0]?.y).toBeCloseTo(0.8);
      expect(normals[1]?.z).toBeCloseTo(1);
    });

    it('should handle empty array', () => {
      const normals = generateNormalsFromPositions([]);
      expect(normals).toHaveLength(0);
    });
  });

  describe('convertVertexArraysToVector3', () => {
    it('should convert coordinate arrays to Vector3', () => {
      const arrays = [
        [1, 2, 3],
        [4, 5, 6],
      ];

      const vectors = convertVertexArraysToVector3(arrays);

      expect(vectors).toHaveLength(2);
      expect(vectors[0]).toEqual({ x: 1, y: 2, z: 3 });
      expect(vectors[1]).toEqual({ x: 4, y: 5, z: 6 });
    });

    it('should handle empty array', () => {
      const vectors = convertVertexArraysToVector3([]);
      expect(vectors).toHaveLength(0);
    });
  });

  describe('calculateCenterPoint', () => {
    it('should calculate center of vertices', () => {
      const vertices = [
        { x: 0, y: 0, z: 0 },
        { x: 2, y: 2, z: 2 },
      ];

      const center = calculateCenterPoint(vertices);

      expect(center.x).toBeCloseTo(1);
      expect(center.y).toBeCloseTo(1);
      expect(center.z).toBeCloseTo(1);
    });

    it('should return zero for empty array', () => {
      const center = calculateCenterPoint([]);
      expect(center).toEqual({ x: 0, y: 0, z: 0 });
    });
  });

  describe('calculateBoundingBox', () => {
    it('should calculate correct bounding box', () => {
      const vertices = [
        { x: -1, y: 2, z: 0 },
        { x: 3, y: -1, z: 5 },
        { x: 0, y: 0, z: 2 },
      ];

      const bbox = calculateBoundingBox(vertices);

      expect(bbox.min).toEqual({ x: -1, y: -1, z: 0 });
      expect(bbox.max).toEqual({ x: 3, y: 2, z: 5 });
    });

    it('should handle empty array', () => {
      const bbox = calculateBoundingBox([]);
      expect(bbox.min).toEqual({ x: 0, y: 0, z: 0 });
      expect(bbox.max).toEqual({ x: 0, y: 0, z: 0 });
    });
  });

  describe('isApproximatelyZero', () => {
    it('should detect approximately zero values', () => {
      expect(isApproximatelyZero(0)).toBe(true);
      expect(isApproximatelyZero(1e-15)).toBe(true);
      expect(isApproximatelyZero(-1e-15)).toBe(true);
    });

    it('should reject non-zero values', () => {
      expect(isApproximatelyZero(0.1)).toBe(false);
      expect(isApproximatelyZero(-0.1)).toBe(false);
    });

    it('should respect custom tolerance', () => {
      expect(isApproximatelyZero(0.05, 0.1)).toBe(true);
      expect(isApproximatelyZero(0.15, 0.1)).toBe(false);
    });
  });

  describe('isApproximatelyEqual', () => {
    it('should detect approximately equal values', () => {
      expect(isApproximatelyEqual(1.0, 1.0)).toBe(true);
      expect(isApproximatelyEqual(1.0, 1.0 + 1e-15)).toBe(true);
    });

    it('should reject different values', () => {
      expect(isApproximatelyEqual(1.0, 1.1)).toBe(false);
      expect(isApproximatelyEqual(1.0, 0.9)).toBe(false);
    });

    it('should respect custom tolerance', () => {
      expect(isApproximatelyEqual(1.0, 1.05, 0.1)).toBe(true);
      expect(isApproximatelyEqual(1.0, 1.15, 0.1)).toBe(false);
    });
  });
});
