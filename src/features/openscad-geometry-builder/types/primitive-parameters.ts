/**
 * @file primitive-parameters.ts
 * @description Parameter types for all OpenSCAD primitives following exact desktop specifications.
 * These types ensure type safety and validation for all primitive generation functions.
 *
 * @example
 * ```typescript
 * // Sphere parameters matching OpenSCAD sphere(r=5, $fn=3)
 * const sphereParams: SphereParameters = {
 *   radius: 5,
 *   fn: 3,
 *   fs: 2,
 *   fa: 12
 * };
 *
 * // Cube parameters matching OpenSCAD cube([2,4,6], center=true)
 * const cubeParams: CubeParameters = {
 *   size: { x: 2, y: 4, z: 6 },
 *   center: true
 * };
 * ```
 *
 * @author OpenSCAD Babylon Team
 * @version 1.0.0
 * @since 2025-07-29
 */

import type { Vector2, Vector3 } from './geometry-data';

/**
 * Base fragment parameters for tessellation control
 * Matches OpenSCAD's $fn, $fs, $fa global variables
 */
export interface FragmentParameters {
  /** Number of fragments (overrides $fs and $fa when > 0) */
  readonly fn?: number;

  /** Fragment size in units (minimum arc length) */
  readonly fs?: number;

  /** Fragment angle in degrees (maximum arc angle) */
  readonly fa?: number;
}

/**
 * Default fragment parameters matching OpenSCAD defaults
 */
export const DEFAULT_FRAGMENT_PARAMETERS: FragmentParameters = {
  fn: 0, // Use $fs/$fa calculation
  fs: 2, // 2 units minimum arc length
  fa: 12, // 12 degrees maximum arc angle
} as const;

/**
 * Sphere primitive parameters
 */
export interface SphereParameters extends FragmentParameters {
  /** Sphere radius (mutually exclusive with diameter) */
  readonly radius?: number;

  /** Sphere diameter (takes precedence over radius) */
  readonly diameter?: number;
}

/**
 * Cube primitive parameters
 */
export interface CubeParameters {
  /** Cube size as Vector3 or single number for all dimensions */
  readonly size: Vector3 | number;

  /** Whether to center the cube at origin */
  readonly center: boolean;
}

/**
 * Cylinder primitive parameters
 */
export interface CylinderParameters extends FragmentParameters {
  /** Cylinder height */
  readonly height: number;

  /** Bottom radius (mutually exclusive with diameter) */
  readonly r1?: number;

  /** Top radius (mutually exclusive with diameter) */
  readonly r2?: number;

  /** Uniform radius for both top and bottom */
  readonly r?: number;

  /** Bottom diameter (takes precedence over r1) */
  readonly d1?: number;

  /** Top diameter (takes precedence over r2) */
  readonly d2?: number;

  /** Uniform diameter for both top and bottom */
  readonly d?: number;

  /** Whether to center the cylinder at origin */
  readonly center: boolean;
}

/**
 * Polyhedron primitive parameters
 */
export interface PolyhedronParameters {
  /** Array of 3D points defining vertices */
  readonly points: readonly Vector3[];

  /** Array of face definitions (indices into points array) */
  readonly faces: readonly (readonly number[])[];

  /** Convexity hint for optimization (default: 1) */
  readonly convexity: number;
}

/**
 * Circle primitive parameters
 */
export interface CircleParameters extends FragmentParameters {
  /** Circle radius (mutually exclusive with diameter) */
  readonly radius?: number;

  /** Circle diameter (takes precedence over radius) */
  readonly diameter?: number;
}

/**
 * Square primitive parameters
 */
export interface SquareParameters {
  /** Square size as Vector2 or single number for both dimensions */
  readonly size: Vector2 | number;

  /** Whether to center the square at origin */
  readonly center: boolean;
}

/**
 * Polygon primitive parameters
 */
export interface PolygonParameters {
  /** Array of 2D points defining vertices */
  readonly points: readonly Vector2[];

  /** Optional array of paths for complex polygons with holes */
  readonly paths?: readonly (readonly number[])[];

  /** Convexity hint for optimization (default: 1) */
  readonly convexity: number;
}

// TextParameters is now defined in text-parameters.ts to avoid duplication

/**
 * Import primitive parameters (LOW PRIORITY)
 */
export interface ImportParameters {
  /** File path or URL to import */
  readonly file: string;

  /** Layer to import (for DXF files) */
  readonly layer?: string;

  /** Convexity hint for optimization */
  readonly convexity: number;

  /** Origin point for positioning */
  readonly origin?: Vector2;

  /** Scale factor for imported geometry */
  readonly scale?: number;
}

/**
 * Hull operation parameters (VERY LOW PRIORITY)
 */
export interface HullParameters {
  /** Convexity hint for optimization */
  readonly convexity: number;
}

/**
 * Minkowski operation parameters (VERY LOW PRIORITY)
 */
export interface MinkowskiParameters {
  /** Convexity hint for optimization */
  readonly convexity: number;
}

/**
 * Offset operation parameters (MEDIUM PRIORITY)
 */
export interface OffsetParameters extends FragmentParameters {
  /** Offset radius (positive = outward, negative = inward) */
  readonly r?: number;

  /** Offset delta (alternative to radius) */
  readonly delta?: number;

  /** Use chamfer instead of round corners */
  readonly chamfer: boolean;
}

/**
 * Union type for all primitive parameters
 */
export type PrimitiveParameters =
  | SphereParameters
  | CubeParameters
  | CylinderParameters
  | PolyhedronParameters
  | CircleParameters
  | SquareParameters
  | PolygonParameters
  | TextParameters
  | ImportParameters
  | HullParameters
  | MinkowskiParameters
  | OffsetParameters;

/**
 * Parameter validation utilities
 */
export namespace ParameterValidation {
  /**
   * Validate sphere parameters
   */
  export function validateSphere(params: SphereParameters): string[] {
    const errors: string[] = [];

    if (params.radius === undefined && params.diameter === undefined) {
      errors.push('Either radius or diameter must be specified');
    }

    if (params.radius !== undefined && params.radius <= 0) {
      errors.push('Radius must be positive');
    }

    if (params.diameter !== undefined && params.diameter <= 0) {
      errors.push('Diameter must be positive');
    }

    return errors;
  }

  /**
   * Validate cube parameters
   */
  export function validateCube(params: CubeParameters): string[] {
    const errors: string[] = [];

    if (typeof params.size === 'number') {
      if (params.size <= 0) {
        errors.push('Size must be positive');
      }
    } else if (params.size.x <= 0 || params.size.y <= 0 || params.size.z <= 0) {
      errors.push('All size dimensions must be positive');
    }

    return errors;
  }

  /**
   * Validate cylinder parameters
   */
  export function validateCylinder(params: CylinderParameters): string[] {
    const errors: string[] = [];

    if (params.height <= 0) {
      errors.push('Height must be positive');
    }

    // Check radius/diameter combinations
    const hasR = params.r !== undefined;
    const hasR1R2 = params.r1 !== undefined || params.r2 !== undefined;
    const hasD = params.d !== undefined;
    const hasD1D2 = params.d1 !== undefined || params.d2 !== undefined;

    if (!hasR && !hasR1R2 && !hasD && !hasD1D2) {
      errors.push('Must specify radius or diameter parameters');
    }

    if ((hasR || hasD) && (hasR1R2 || hasD1D2)) {
      errors.push('Cannot mix uniform radius/diameter with r1/r2 or d1/d2');
    }

    return errors;
  }

  /**
   * Validate fragment parameters
   */
  export function validateFragments(params: FragmentParameters): string[] {
    const errors: string[] = [];

    if (params.fn !== undefined && params.fn < 0) {
      errors.push('$fn must be non-negative');
    }

    if (params.fs !== undefined && params.fs <= 0) {
      errors.push('$fs must be positive');
    }

    if (params.fa !== undefined && (params.fa <= 0 || params.fa > 180)) {
      errors.push('$fa must be between 0 and 180 degrees');
    }

    return errors;
  }
}
