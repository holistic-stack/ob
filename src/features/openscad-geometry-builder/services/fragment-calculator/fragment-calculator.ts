/**
 * @file fragment-calculator.ts
 * @description Fragment Calculator Service that replicates OpenSCAD's exact get_fragments_from_r algorithm.
 * This service calculates the number of fragments for tessellating circles and spheres based on
 * OpenSCAD's $fn, $fs, and $fa parameters.
 *
 * @example
 * ```typescript
 * const calculator = new FragmentCalculatorService();
 *
 * // Calculate fragments for $fn=3 sphere (the main issue)
 * const result = calculator.calculateFragments(5, 3, 2, 12);
 * if (result.success) {
 *   console.log(`Fragments: ${result.data}`); // Output: Fragments: 3
 * }
 *
 * // Calculate fragments using $fs/$fa (default OpenSCAD behavior)
 * const defaultResult = calculator.calculateFragments(5, 0, 2, 12);
 * if (defaultResult.success) {
 *   console.log(`Default fragments: ${defaultResult.data}`); // Output: Default fragments: 16
 * }
 * ```
 *
 * @author OpenSCAD Babylon Team
 * @version 1.0.0
 * @since 2025-07-29
 */

import type { Result } from '../../../../shared/types/result.types';
import { error, success } from '../../../../shared/utils/functional/result';
import { ERROR_MESSAGES, FRAGMENT_CONSTANTS } from '../../constants';

/**
 * Error types for fragment calculation
 */
export interface FragmentCalculationError {
  readonly type: 'INVALID_PARAMETERS' | 'COMPUTATION_ERROR';
  readonly message: string;
  readonly details?: Record<string, unknown>;
}

/**
 * Fragment calculation result type
 */
export type FragmentResult = Result<number, FragmentCalculationError>;

/**
 * Fragment Calculator Service
 *
 * Replicates OpenSCAD's get_fragments_from_r algorithm exactly:
 * ```cpp
 * int Calc::get_fragments_from_r(double r, double fn, double fs, double fa) {
 *   if (r < GRID_FINE || std::isinf(fn) || std::isnan(fn)) return 3;
 *   if (fn > 0.0) return static_cast<int>(fn >= 3 ? fn : 3);
 *   return static_cast<int>(ceil(fmax(fmin(360.0 / fa, r * 2 * M_PI / fs), 5)));
 * }
 * ```
 */
export class FragmentCalculatorService {
  /**
   * Calculate the number of fragments for tessellation using OpenSCAD's exact algorithm
   *
   * @param radius - The radius of the circle/sphere
   * @param fn - $fn parameter (number of fragments, overrides $fs/$fa when > 0)
   * @param fs - $fs parameter (fragment size in units)
   * @param fa - $fa parameter (fragment angle in degrees)
   * @returns Result containing the number of fragments or an error
   */
  calculateFragments(radius: number, fn: number, fs: number, fa: number): FragmentResult {
    // Validate parameters first
    const validationResult = this.validateParameters(radius, fn, fs, fa);
    if (!validationResult.success) {
      return validationResult as Result<number, FragmentCalculationError>;
    }

    try {
      // OpenSCAD algorithm implementation

      // Check for very small radius, infinite fn, or NaN fn
      if (radius < FRAGMENT_CONSTANTS.GRID_FINE || !Number.isFinite(fn) || Number.isNaN(fn)) {
        return success(FRAGMENT_CONSTANTS.MIN_FRAGMENTS);
      }

      // If fn > 0, use fn directly (with minimum of 3)
      if (fn > 0.0) {
        const fragments = Math.floor(
          fn >= FRAGMENT_CONSTANTS.MIN_FRAGMENTS ? fn : FRAGMENT_CONSTANTS.MIN_FRAGMENTS
        );
        return success(fragments);
      }

      // Use $fs/$fa calculation: ceil(max(min(360.0 / fa, r * 2 * PI / fs), 5))
      const angleConstraint = 360.0 / fa;
      const sizeConstraint = (radius * 2 * Math.PI) / fs;
      const minConstraint = Math.min(angleConstraint, sizeConstraint);
      const maxConstraint = Math.max(minConstraint, FRAGMENT_CONSTANTS.MIN_FRAGMENTS_FS_FA);
      const fragments = Math.ceil(maxConstraint);

      return success(fragments);
    } catch (err) {
      return error({
        type: 'COMPUTATION_ERROR',
        message: `Fragment calculation failed: ${err instanceof Error ? err.message : String(err)}`,
        details: { radius, fn, fs, fa },
      });
    }
  }

  /**
   * Validate fragment calculation parameters
   *
   * @param radius - The radius value to validate
   * @param fn - The $fn parameter to validate
   * @param fs - The $fs parameter to validate
   * @param fa - The $fa parameter to validate
   * @returns Result indicating validation success or failure
   */
  validateParameters(
    radius: number,
    fn: number,
    fs: number,
    fa: number
  ): Result<void, FragmentCalculationError> {
    const errors: string[] = [];

    // Validate radius
    if (radius < 0) {
      errors.push('radius must be non-negative');
    }

    if (!Number.isFinite(radius)) {
      errors.push('radius must be a finite number');
    }

    // Validate $fn
    if (fn < 0) {
      errors.push('$fn must be non-negative');
    }

    // Validate $fs (only when $fn = 0, since $fs is ignored when $fn > 0)
    if (fn === 0 && fs <= 0) {
      errors.push('$fs must be positive when $fn = 0');
    }

    if (fn === 0 && !Number.isFinite(fs)) {
      errors.push('$fs must be a finite number');
    }

    // Validate $fa (only when $fn = 0, since $fa is ignored when $fn > 0)
    if (fn === 0 && fa <= 0) {
      errors.push('$fa must be positive when $fn = 0');
    }

    if (fn === 0 && !Number.isFinite(fa)) {
      errors.push('$fa must be a finite number');
    }

    if (fn === 0 && fa > 180) {
      errors.push('$fa must be <= 180 degrees');
    }

    if (errors.length > 0) {
      return error({
        type: 'INVALID_PARAMETERS',
        message: `Invalid fragment parameters: ${errors.join(', ')}`,
        details: { radius, fn, fs, fa, errors },
      });
    }

    return success(undefined);
  }

  /**
   * Get the effective fragment parameters for a given set of inputs
   * This is useful for debugging and understanding which parameters are actually used
   *
   * @param radius - The radius value
   * @param fn - The $fn parameter
   * @param fs - The $fs parameter
   * @param fa - The $fa parameter
   * @returns Object describing which parameters were used and why
   */
  getFragmentationInfo(
    radius: number,
    fn: number,
    fs: number,
    fa: number
  ): {
    fragments: number;
    mode: 'fn' | 'fs-fa' | 'minimum';
    constraint: 'fn' | 'fa' | 'fs' | 'minimum' | 'small-radius';
    calculation: string;
  } {
    const fragmentResult = this.calculateFragments(radius, fn, fs, fa);

    if (!fragmentResult.success) {
      return {
        fragments: 3,
        mode: 'minimum',
        constraint: 'minimum',
        calculation: 'Error in calculation, using minimum',
      };
    }

    const fragments = fragmentResult.data;

    // Determine which mode was used
    if (radius < FRAGMENT_CONSTANTS.GRID_FINE || !Number.isFinite(fn) || Number.isNaN(fn)) {
      return {
        fragments,
        mode: 'minimum',
        constraint: 'small-radius',
        calculation: `radius=${radius} < GRID_FINE or fn is invalid`,
      };
    }

    if (fn > 0) {
      return {
        fragments,
        mode: 'fn',
        constraint: 'fn',
        calculation: `max(${fn}, 3) = ${fragments}`,
      };
    }

    // $fs/$fa mode
    const angleConstraint = 360.0 / fa;
    const sizeConstraint = (radius * 2 * Math.PI) / fs;
    const minConstraint = Math.min(angleConstraint, sizeConstraint);
    const isAngleConstrained = angleConstraint <= sizeConstraint;
    const isMinimumConstrained = minConstraint < FRAGMENT_CONSTANTS.MIN_FRAGMENTS_FS_FA;

    return {
      fragments,
      mode: 'fs-fa',
      constraint: isMinimumConstrained ? 'minimum' : isAngleConstrained ? 'fa' : 'fs',
      calculation: `ceil(max(min(360/${fa}, ${radius}*2*π/${fs}), 5)) = ceil(max(min(${angleConstraint.toFixed(2)}, ${sizeConstraint.toFixed(2)}), 5)) = ${fragments}`,
    };
  }
}
