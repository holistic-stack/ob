/**
 * @file circle-generator.ts
 * @description Circle Generator Service that replicates OpenSCAD's circle tessellation algorithm.
 * Generates 2D circles with fragment-based tessellation compatible with OpenSCAD specifications.
 *
 * @example
 * ```typescript
 * const generator = new CircleGeneratorService();
 *
 * // Generate circle with $fn=6 (hexagon)
 * const result = generator.generateCircle({ radius: 5, $fn: 6 });
 * if (result.success) {
 *   const circle = result.data;
 *   console.log(`Generated circle with ${circle.vertices.length} vertices`);
 * }
 *
 * // Generate circle with automatic fragment calculation
 * const autoResult = generator.generateCircle({
 *   radius: 10,
 *   fa: 12,
 *   fs: 2
 * });
 * ```
 *
 * @author OpenSCAD Babylon Team
 * @version 1.0.0
 * @since 2025-07-29
 */

import type { CircleParameters } from '@/features/openscad-geometry-builder';
import type { Result } from '@/shared';
import { error, isError, success } from '@/shared';
import type { Vector2 } from '../../../../types';
import type {
  Circle2DGeometryData,
  Geometry2DGenerationError,
} from '../../../../types/2d-geometry-data';
import { resolveRadiusFromParameters } from '../../../../utils/geometry-helpers';
import { cosDegrees, sinDegrees } from '../../../../utils/math-helpers';
import { validateFragmentCount, validateRadius } from '../../../../utils/validation-helpers';
import { FragmentCalculatorService } from '../../../fragment-calculator';

/**
 * Circle generation result type
 */
export type CircleResult = Result<Circle2DGeometryData, Geometry2DGenerationError>;

/**
 * Circle Generator Service
 *
 * Implements OpenSCAD-compatible circle generation with fragment-based tessellation.
 * Supports both radius and diameter parameters with automatic fragment calculation.
 */
export class CircleGeneratorService {
  private readonly fragmentCalculator: FragmentCalculatorService;

  constructor(fragmentCalculator?: FragmentCalculatorService) {
    this.fragmentCalculator = fragmentCalculator || new FragmentCalculatorService();
  }
  /**
   * Generate 2D circle geometry from parameters
   */
  generateCircle(params: CircleParameters): CircleResult {
    try {
      // Determine radius (diameter takes precedence over radius)
      const radiusResult = resolveRadiusFromParameters(params.radius, params.diameter);
      if (isError(radiusResult)) {
        return error({
          type: 'INVALID_PARAMETERS',
          message: radiusResult.error.message,
          details: { params },
        });
      }
      const radius = radiusResult.data;

      // Validate radius
      const radiusValidation = validateRadius(radius);
      if (isError(radiusValidation)) {
        return error({
          type: 'INVALID_PARAMETERS',
          message: radiusValidation.error.message,
          details: { params, radius },
        });
      }

      // Calculate fragments using fragment calculator
      const fragmentResult = this.calculateFragments(radius, params.fn, params.fs, params.fa);

      if (isError(fragmentResult)) {
        return error({
          type: 'INVALID_PARAMETERS',
          message: fragmentResult.error.message,
          details: { params },
        });
      }

      const fragments = fragmentResult.data;

      // Validate fragment count
      const fragmentValidation = validateFragmentCount(fragments);
      if (isError(fragmentValidation)) {
        return error({
          type: 'INVALID_PARAMETERS',
          message: fragmentValidation.error.message,
          details: { params, fragments },
        });
      }

      // Generate circle geometry
      const geometry = this.generateCircleGeometry(radius, fragments);

      return success(geometry);
    } catch (err) {
      return error({
        type: 'TESSELLATION_FAILED',
        message: `Circle generation failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
        details: { params },
      });
    }
  }

  /**
   * Generate circle geometry with specified radius and fragment count
   */
  private generateCircleGeometry(radius: number, fragments: number): Circle2DGeometryData {
    // Generate vertices around the circle
    const vertices: Vector2[] = [];
    const outline: number[] = [];

    for (let i = 0; i < fragments; i++) {
      const angle = (360 * i) / fragments; // Degrees
      const x = radius * cosDegrees(angle);
      const y = radius * sinDegrees(angle);

      vertices.push({ x, y });
      outline.push(i);
    }

    // Calculate area using shoelace formula
    const area = this.calculateCircleArea(vertices, outline);

    // Create metadata
    const metadata = {
      primitiveType: '2d-circle' as const,
      parameters: {
        radius,
        fragments,
      },
      fragmentCount: fragments,
      generatedAt: Date.now(),
      isConvex: true, // Circles are always convex
      area,
    };

    return Object.freeze({
      vertices: Object.freeze(vertices),
      outline: Object.freeze(outline),
      holes: Object.freeze([]), // Circles have no holes
      metadata: Object.freeze(metadata),
    });
  }

  /**
   * Calculate circle area using shoelace formula
   */
  private calculateCircleArea(vertices: readonly Vector2[], outline: readonly number[]): number {
    if (outline.length < 3) return 0;

    let area = 0;
    for (let i = 0; i < outline.length; i++) {
      const j = (i + 1) % outline.length;
      const iIndex = outline[i];
      const jIndex = outline[j];

      if (iIndex === undefined || jIndex === undefined) {
        continue; // Skip invalid indices
      }

      const vi = vertices[iIndex];
      const vj = vertices[jIndex];

      if (!vi || !vj) {
        continue; // Skip if vertices don't exist
      }

      area += vi.x * vj.y - vj.x * vi.y;
    }
    return Math.abs(area) / 2;
  }

  /**
   * Calculate fragments using fragment calculator
   */
  private calculateFragments(
    radius: number,
    fn?: number,
    fs?: number,
    fa?: number
  ): Result<number, Geometry2DGenerationError> {
    try {
      const fragmentResult = this.fragmentCalculator.calculateFragments(
        radius,
        fn || 0,
        fs || 2,
        fa || 12
      );

      if (isError(fragmentResult)) {
        return error({
          type: 'INVALID_PARAMETERS',
          message: fragmentResult.error.message,
          details: { radius, fn, fs, fa },
        });
      }

      return success(fragmentResult.data);
    } catch (err) {
      return error({
        type: 'INVALID_PARAMETERS',
        message: `Fragment calculation failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
        details: { radius, fn, fs, fa },
      });
    }
  }
}
