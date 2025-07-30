/**
 * @file parameter-validators.test.ts
 * @description Test suite for parameter validation utilities following TDD methodology.
 * Tests all common validation functions used across OpenSCAD geometry generators.
 *
 * @author OpenSCAD Babylon Team
 * @version 1.0.0
 * @since 2025-07-29
 */

import { describe, expect, it } from 'vitest';
import { isError, isSuccess } from '@/shared/types/result.types';
import {
  validateFaceIndices,
  validateFiniteNumber,
  validateFragmentCount,
  validateHeight,
  validateNonEmptyArray,
  validatePositiveNumber,
  validateRadius,
  validateSizeDimensions,
  validateVertexCoordinates,
} from './parameter-validators';

describe('Parameter Validators', () => {
  describe('validatePositiveNumber', () => {
    it('should accept positive numbers', () => {
      const result = validatePositiveNumber(5, 'test');
      expect(isSuccess(result)).toBe(true);
    });

    it('should accept very small positive numbers', () => {
      const result = validatePositiveNumber(0.001, 'test');
      expect(isSuccess(result)).toBe(true);
    });

    it('should reject zero', () => {
      const result = validatePositiveNumber(0, 'test');
      expect(isError(result)).toBe(true);
      if (isError(result)) {
        expect(result.error.message).toContain('test must be positive');
      }
    });

    it('should reject negative numbers', () => {
      const result = validatePositiveNumber(-5, 'test');
      expect(isError(result)).toBe(true);
      if (isError(result)) {
        expect(result.error.message).toContain('test must be positive');
      }
    });
  });

  describe('validateFiniteNumber', () => {
    it('should accept finite numbers', () => {
      const result = validateFiniteNumber(42, 'test');
      expect(isSuccess(result)).toBe(true);
    });

    it('should accept zero', () => {
      const result = validateFiniteNumber(0, 'test');
      expect(isSuccess(result)).toBe(true);
    });

    it('should reject NaN', () => {
      const result = validateFiniteNumber(NaN, 'test');
      expect(isError(result)).toBe(true);
      if (isError(result)) {
        expect(result.error.message).toContain('test must be a finite number');
      }
    });

    it('should reject Infinity', () => {
      const result = validateFiniteNumber(Infinity, 'test');
      expect(isError(result)).toBe(true);
      if (isError(result)) {
        expect(result.error.message).toContain('test must be a finite number');
      }
    });

    it('should reject negative Infinity', () => {
      const result = validateFiniteNumber(-Infinity, 'test');
      expect(isError(result)).toBe(true);
    });
  });

  describe('validateFragmentCount', () => {
    it('should accept valid fragment counts', () => {
      const result = validateFragmentCount(8);
      expect(isSuccess(result)).toBe(true);
    });

    it('should accept minimum fragment count (3)', () => {
      const result = validateFragmentCount(3);
      expect(isSuccess(result)).toBe(true);
    });

    it('should reject fragment count less than 3', () => {
      const result = validateFragmentCount(2);
      expect(isError(result)).toBe(true);
      if (isError(result)) {
        expect(result.error.message).toContain('Fragments must be at least 3');
      }
    });

    it('should reject non-integer fragment counts', () => {
      const result = validateFragmentCount(3.5);
      expect(isError(result)).toBe(true);
      if (isError(result)) {
        expect(result.error.message).toContain('Fragments must be an integer');
      }
    });
  });

  describe('validateNonEmptyArray', () => {
    it('should accept non-empty arrays', () => {
      const result = validateNonEmptyArray([1, 2, 3], 'test');
      expect(isSuccess(result)).toBe(true);
    });

    it('should reject empty arrays', () => {
      const result = validateNonEmptyArray([], 'test');
      expect(isError(result)).toBe(true);
      if (isError(result)) {
        expect(result.error.message).toContain('test must not be empty');
      }
    });
  });

  describe('validateRadius', () => {
    it('should accept valid radius', () => {
      const result = validateRadius(5);
      expect(isSuccess(result)).toBe(true);
    });

    it('should reject negative radius', () => {
      const result = validateRadius(-5);
      expect(isError(result)).toBe(true);
      if (isError(result)) {
        expect(result.error.message).toContain('Radius must be positive');
      }
    });

    it('should reject zero radius', () => {
      const result = validateRadius(0);
      expect(isError(result)).toBe(true);
      if (isError(result)) {
        expect(result.error.message).toContain('Radius must be positive');
      }
    });

    it('should reject infinite radius', () => {
      const result = validateRadius(Infinity);
      expect(isError(result)).toBe(true);
      if (isError(result)) {
        expect(result.error.message).toContain('finite number');
      }
    });
  });

  describe('validateHeight', () => {
    it('should accept valid height', () => {
      const result = validateHeight(10);
      expect(isSuccess(result)).toBe(true);
    });

    it('should reject negative height', () => {
      const result = validateHeight(-10);
      expect(isError(result)).toBe(true);
      if (isError(result)) {
        expect(result.error.message).toContain('Height must be positive');
      }
    });

    it('should reject zero height', () => {
      const result = validateHeight(0);
      expect(isError(result)).toBe(true);
      if (isError(result)) {
        expect(result.error.message).toContain('Height must be positive');
      }
    });
  });

  describe('validateSizeDimensions', () => {
    it('should accept valid size dimensions', () => {
      const result = validateSizeDimensions({ x: 2, y: 4, z: 6 });
      expect(isSuccess(result)).toBe(true);
    });

    it('should reject negative x dimension', () => {
      const result = validateSizeDimensions({ x: -2, y: 4, z: 6 });
      expect(isError(result)).toBe(true);
      if (isError(result)) {
        expect(result.error.message).toContain('All size dimensions must be positive');
      }
    });

    it('should reject zero y dimension', () => {
      const result = validateSizeDimensions({ x: 2, y: 0, z: 6 });
      expect(isError(result)).toBe(true);
    });

    it('should reject infinite z dimension', () => {
      const result = validateSizeDimensions({ x: 2, y: 4, z: Infinity });
      expect(isError(result)).toBe(true);
      if (isError(result)) {
        expect(result.error.message).toContain('finite number');
      }
    });
  });

  describe('validateVertexCoordinates', () => {
    it('should accept valid 3D coordinates', () => {
      const result = validateVertexCoordinates([1, 2, 3], 0);
      expect(isSuccess(result)).toBe(true);
    });

    it('should reject 2D coordinates', () => {
      const result = validateVertexCoordinates([1, 2], 0);
      expect(isError(result)).toBe(true);
      if (isError(result)) {
        expect(result.error.message).toContain('Vertex 0 must have exactly 3 coordinates');
      }
    });

    it('should reject 4D coordinates', () => {
      const result = validateVertexCoordinates([1, 2, 3, 4], 1);
      expect(isError(result)).toBe(true);
      if (isError(result)) {
        expect(result.error.message).toContain('Vertex 1 must have exactly 3 coordinates');
      }
    });

    it('should reject coordinates with NaN', () => {
      const result = validateVertexCoordinates([1, NaN, 3], 2);
      expect(isError(result)).toBe(true);
      if (isError(result)) {
        expect(result.error.message).toContain('finite number');
      }
    });
  });

  describe('validateFaceIndices', () => {
    it('should accept valid triangle face', () => {
      const result = validateFaceIndices([0, 1, 2], 0, 4);
      expect(isSuccess(result)).toBe(true);
    });

    it('should accept valid quad face', () => {
      const result = validateFaceIndices([0, 1, 2, 3], 0, 4);
      expect(isSuccess(result)).toBe(true);
    });

    it('should reject face with too few vertices', () => {
      const result = validateFaceIndices([0, 1], 0, 4);
      expect(isError(result)).toBe(true);
      if (isError(result)) {
        expect(result.error.message).toContain('Face must have at least 3 vertices');
      }
    });

    it('should reject face with invalid vertex index', () => {
      const result = validateFaceIndices([0, 1, 5], 0, 4);
      expect(isError(result)).toBe(true);
      if (isError(result)) {
        expect(result.error.message).toContain('Face contains invalid vertex index');
      }
    });

    it('should reject face with negative vertex index', () => {
      const result = validateFaceIndices([0, -1, 2], 0, 4);
      expect(isError(result)).toBe(true);
    });

    it('should reject face with duplicate vertex indices', () => {
      const result = validateFaceIndices([0, 1, 1], 0, 4);
      expect(isError(result)).toBe(true);
      if (isError(result)) {
        expect(result.error.message).toContain('Face contains duplicate vertex indices');
      }
    });

    it('should reject face with non-integer index', () => {
      const result = validateFaceIndices([0, 1.5, 2], 0, 4);
      expect(isError(result)).toBe(true);
    });
  });
});
