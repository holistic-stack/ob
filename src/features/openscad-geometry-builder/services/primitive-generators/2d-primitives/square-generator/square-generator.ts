/**
 * @file square-generator.ts
 * @description Square Generator Service that replicates OpenSCAD's square/rectangle generation.
 * Generates 2D squares and rectangles with size and center parameters compatible with OpenSCAD specifications.
 *
 * @example
 * ```typescript
 * const generator = new SquareGeneratorService();
 *
 * // Generate square with size=5, corner at origin
 * const result = generator.generateSquare({ size: 5, center: false });
 * if (result.success) {
 *   const square = result.data;
 *   console.log(`Generated square with ${square.vertices.length} vertices`);
 * }
 *
 * // Generate centered rectangle
 * const rectResult = generator.generateSquare({
 *   size: { x: 6, y: 4 },
 *   center: true
 * });
 * ```
 *
 * @author OpenSCAD Babylon Team
 * @version 1.0.0
 * @since 2025-07-29
 */

import type { SquareParameters } from '@/features/openscad-geometry-builder';
import type { Result } from '@/shared';
import { error, isError, success } from '@/shared';
import type {
  Geometry2DGenerationError,
  Square2DGeometryData,
} from '../../../../types/2d-geometry-data';
import type { Vector2 } from '../../../../types/geometry-data';

/**
 * Square generation result type
 */
export type SquareResult = Result<Square2DGeometryData, Geometry2DGenerationError>;

/**
 * Square Generator Service
 *
 * Implements OpenSCAD-compatible square/rectangle generation with size and center parameters.
 * Supports both single number (square) and Vector2 (rectangle) size specifications.
 */
export class SquareGeneratorService {
  /**
   * Generate 2D square/rectangle geometry from parameters
   */
  generateSquare(params: SquareParameters): SquareResult {
    try {
      // Validate parameters
      const validationResult = this.validateParameters(params);
      if (isError(validationResult)) {
        return validationResult;
      }

      // Normalize size to Vector2
      const size = this.normalizeSize(params.size);

      // Validate normalized size
      const sizeValidation = this.validateSize(size);
      if (isError(sizeValidation)) {
        return sizeValidation;
      }

      // Generate square geometry
      const geometry = this.generateSquareGeometry(size, params.center);

      return success(geometry);
    } catch (err) {
      return error({
        type: 'TESSELLATION_FAILED',
        message: `Square generation failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
        details: { params },
      });
    }
  }

  /**
   * Validate square parameters
   */
  private validateParameters(params: SquareParameters): Result<void, Geometry2DGenerationError> {
    // Check that size is provided
    if (params.size === undefined || params.size === null) {
      return error({
        type: 'INVALID_PARAMETERS',
        message: 'Size parameter is required',
        details: { params },
      });
    }

    // Check that center is provided
    if (params.center === undefined || params.center === null) {
      return error({
        type: 'INVALID_PARAMETERS',
        message: 'Center parameter is required',
        details: { params },
      });
    }

    return success(undefined);
  }

  /**
   * Normalize size parameter to Vector2
   */
  private normalizeSize(size: Vector2 | number): Vector2 {
    if (typeof size === 'number') {
      return { x: size, y: size };
    }
    return size;
  }

  /**
   * Validate size components
   */
  private validateSize(size: Vector2): Result<void, Geometry2DGenerationError> {
    if (size.x <= 0) {
      return error({
        type: 'INVALID_PARAMETERS',
        message: 'Size X component must be positive',
        details: { size },
      });
    }

    if (size.y <= 0) {
      return error({
        type: 'INVALID_PARAMETERS',
        message: 'Size Y component must be positive',
        details: { size },
      });
    }

    return success(undefined);
  }

  /**
   * Generate square geometry with specified size and center positioning
   */
  private generateSquareGeometry(size: Vector2, center: boolean): Square2DGeometryData {
    // Calculate positioning offset
    const offsetX = center ? -size.x / 2 : 0;
    const offsetY = center ? -size.y / 2 : 0;

    // Generate vertices in counter-clockwise order
    const vertices: Vector2[] = [
      { x: offsetX, y: offsetY }, // Bottom-left
      { x: offsetX + size.x, y: offsetY }, // Bottom-right
      { x: offsetX + size.x, y: offsetY + size.y }, // Top-right
      { x: offsetX, y: offsetY + size.y }, // Top-left
    ];

    // Define outline (vertex indices in order)
    const outline: number[] = [0, 1, 2, 3];

    // Calculate area
    const area = size.x * size.y;

    // Create metadata
    const metadata = {
      primitiveType: '2d-square' as const,
      parameters: {
        size: Object.freeze({ ...size }),
        center,
      },
      fragmentCount: 4, // Always 4 vertices for squares/rectangles
      generatedAt: Date.now(),
      isConvex: true, // Squares/rectangles are always convex
      area,
    };

    return Object.freeze({
      vertices: Object.freeze(vertices),
      outline: Object.freeze(outline),
      holes: Object.freeze([]), // Squares have no holes
      metadata: Object.freeze(metadata),
    });
  }
}
