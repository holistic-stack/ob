/**
 * @file fragment-calculator.test.ts
 * @description Test suite for Fragment Calculator Service following TDD methodology.
 * Tests the exact OpenSCAD fragment calculation algorithm from get_fragments_from_r.
 *
 * @example
 * ```typescript
 * // Test $fn=3 returns exactly 3 fragments
 * const result = fragmentCalculator.calculateFragments(5, 3, 2, 12);
 * expect(result.success).toBe(true);
 * expect(result.data).toBe(3);
 * ```
 *
 * @author OpenSCAD Babylon Team
 * @version 1.0.0
 * @since 2025-07-29
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { isError, isSuccess } from '@/shared/types/result.types';
import { FragmentCalculatorService } from './fragment-calculator';

describe('FragmentCalculatorService', () => {
  let fragmentCalculator: FragmentCalculatorService;

  beforeEach(() => {
    fragmentCalculator = new FragmentCalculatorService();
  });

  describe('calculateFragments', () => {
    describe('$fn parameter behavior', () => {
      it('should return exactly $fn when $fn > 0', () => {
        const result = fragmentCalculator.calculateFragments(5, 3, 2, 12);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.data).toBe(3);
        }
      });

      it('should enforce minimum of 3 fragments when $fn > 0', () => {
        const result = fragmentCalculator.calculateFragments(5, 1, 2, 12);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.data).toBe(3);
        }
      });

      it('should handle $fn = 0 and use $fs/$fa calculation', () => {
        // For r=10, fs=2, fa=12: ceil(max(min(360/12, 10*2*PI/2), 5)) = ceil(max(min(30, 31.416), 5)) = ceil(30) = 30
        const result = fragmentCalculator.calculateFragments(10, 0, 2, 12);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.data).toBe(30);
        }
      });
    });

    describe('$fs/$fa calculation behavior', () => {
      it('should calculate fragments using OpenSCAD formula when $fn = 0', () => {
        // Formula: ceil(max(min(360.0 / fa, r * 2 * PI / fs), 5))
        // For r=5, fs=1, fa=30: ceil(max(min(360/30, 5*2*PI/1), 5)) = ceil(max(min(12, 31.416), 5)) = ceil(12) = 12
        const result = fragmentCalculator.calculateFragments(5, 0, 1, 30);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.data).toBe(12);
        }
      });

      it('should enforce minimum of 5 fragments in $fs/$fa mode', () => {
        // Very large fa and fs should still give minimum 5
        const result = fragmentCalculator.calculateFragments(1, 0, 100, 180);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.data).toBe(5);
        }
      });

      it('should be limited by $fa when angle constraint is tighter', () => {
        // Small fa should dominate: r=1, fs=0.1, fa=10: ceil(max(min(360/10, 1*2*PI/0.1), 5)) = ceil(max(min(36, 62.83), 5)) = ceil(36) = 36
        const result = fragmentCalculator.calculateFragments(1, 0, 0.1, 10);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.data).toBe(36);
        }
      });

      it('should be limited by $fs when size constraint is tighter', () => {
        // Small fs should dominate: r=10, fs=1, fa=90: ceil(max(min(360/90, 10*2*PI/1), 5)) = ceil(max(min(4, 62.83), 5)) = ceil(5) = 5
        const result = fragmentCalculator.calculateFragments(10, 0, 1, 90);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.data).toBe(5);
        }
      });
    });

    describe('edge cases and error handling', () => {
      it('should handle very small radius', () => {
        const result = fragmentCalculator.calculateFragments(0.001, 0, 2, 12);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.data).toBe(3); // Should return minimum when radius is too small
        }
      });

      it('should handle zero radius', () => {
        const result = fragmentCalculator.calculateFragments(0, 0, 2, 12);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.data).toBe(3); // Should return minimum
        }
      });

      it('should handle negative radius', () => {
        const result = fragmentCalculator.calculateFragments(-5, 0, 2, 12);

        expect(isError(result)).toBe(true);
        if (isError(result)) {
          expect(result.error.type).toBe('INVALID_PARAMETERS');
          expect(result.error.message).toContain('radius must be non-negative');
        }
      });

      it('should handle infinite $fn', () => {
        const result = fragmentCalculator.calculateFragments(5, Number.POSITIVE_INFINITY, 2, 12);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.data).toBe(3); // Should return minimum when fn is infinite
        }
      });

      it('should handle NaN $fn', () => {
        const result = fragmentCalculator.calculateFragments(5, Number.NaN, 2, 12);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.data).toBe(3); // Should return minimum when fn is NaN
        }
      });

      it('should handle zero $fs', () => {
        const result = fragmentCalculator.calculateFragments(5, 0, 0, 12);

        expect(isError(result)).toBe(true);
        if (isError(result)) {
          expect(result.error.type).toBe('INVALID_PARAMETERS');
          expect(result.error.message).toContain('$fs must be positive');
        }
      });

      it('should handle zero $fa', () => {
        const result = fragmentCalculator.calculateFragments(5, 0, 2, 0);

        expect(isError(result)).toBe(true);
        if (isError(result)) {
          expect(result.error.type).toBe('INVALID_PARAMETERS');
          expect(result.error.message).toContain('$fa must be positive');
        }
      });
    });

    describe('real-world OpenSCAD examples', () => {
      it('should match OpenSCAD default behavior', () => {
        // Default OpenSCAD: $fn=0, $fs=2, $fa=12
        const result = fragmentCalculator.calculateFragments(5, 0, 2, 12);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          // For r=5: ceil(max(min(360/12, 5*2*PI/2), 5)) = ceil(max(min(30, 15.708), 5)) = ceil(15.708) = 16
          expect(result.data).toBe(16);
        }
      });

      it('should handle sphere $fn=3 case (the main issue)', () => {
        const result = fragmentCalculator.calculateFragments(5, 3, 2, 12);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.data).toBe(3);
        }
      });

      it('should handle high-resolution sphere', () => {
        const result = fragmentCalculator.calculateFragments(10, 64, 2, 12);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.data).toBe(64);
        }
      });
    });
  });

  describe('validateParameters', () => {
    it('should validate correct parameters', () => {
      const result = fragmentCalculator.validateParameters(5, 0, 2, 12);

      expect(isSuccess(result)).toBe(true);
    });

    it('should reject negative radius', () => {
      const result = fragmentCalculator.validateParameters(-1, 0, 2, 12);

      expect(isError(result)).toBe(true);
      if (isError(result)) {
        expect(result.error.type).toBe('INVALID_PARAMETERS');
      }
    });

    it('should reject negative $fn', () => {
      const result = fragmentCalculator.validateParameters(5, -1, 2, 12);

      expect(isError(result)).toBe(true);
      if (isError(result)) {
        expect(result.error.type).toBe('INVALID_PARAMETERS');
      }
    });

    it('should reject non-positive $fs', () => {
      const result = fragmentCalculator.validateParameters(5, 0, 0, 12);

      expect(isError(result)).toBe(true);
      if (isError(result)) {
        expect(result.error.type).toBe('INVALID_PARAMETERS');
      }
    });

    it('should reject non-positive $fa', () => {
      const result = fragmentCalculator.validateParameters(5, 0, 2, 0);

      expect(isError(result)).toBe(true);
      if (isError(result)) {
        expect(result.error.type).toBe('INVALID_PARAMETERS');
      }
    });
  });
});
