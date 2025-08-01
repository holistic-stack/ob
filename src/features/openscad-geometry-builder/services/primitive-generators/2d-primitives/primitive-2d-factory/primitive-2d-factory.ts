/**
 * @file primitive-2d-factory.ts
 * @description Unified 2D Primitive Factory Service that provides a convenient API for all 2D primitives.
 * This service acts as a facade over individual generators while maintaining their independence.
 *
 * @example
 * ```typescript
 * const fragmentCalculator = new FragmentCalculatorService();
 * const factory = new Primitive2DFactory(fragmentCalculator);
 *
 * // Generate circle
 * const circleResult = factory.generatePrimitive('circle', {
 *   radius: 5,
 *   fn: 6,
 *   fs: 2,
 *   fa: 12
 * });
 *
 * // Generate square
 * const squareResult = factory.generatePrimitive('square', {
 *   size: { x: 3, y: 7 },
 *   center: true
 * });
 *
 * // Generate polygon
 * const polygonResult = factory.generatePrimitive('polygon', {
 *   points: [[0,0], [10,0], [5,10]],
 *   convexity: 1
 * });
 * ```
 *
 * @author OpenSCAD Babylon Team
 * @version 1.0.0
 * @since 2025-07-29
 */

import type {
  CircleParameters,
  PolygonParameters,
  SquareParameters,
} from '@/features/openscad-geometry-builder';
import type { Result } from '@/shared';
import { error } from '@/shared';
import type {
  Circle2DGeometryData,
  Geometry2DGenerationError,
  Polygon2DGeometryData,
  Square2DGeometryData,
} from '../../../../types/2d-geometry-data';
import type { FragmentCalculatorService } from '../../../fragment-calculator';
import { CircleGeneratorService } from '../circle-generator';
import { PolygonGeneratorService } from '../polygon-generator';
import { SquareGeneratorService } from '../square-generator';

/**
 * Union type for all 2D primitive types
 */
export type Primitive2DType = 'circle' | 'square' | 'polygon';

/**
 * Union type for all 2D primitive parameters
 */
export type Primitive2DParameters = CircleParameters | SquareParameters | PolygonParameters;

/**
 * Union type for all 2D primitive geometry data
 */
export type Primitive2DGeometryData =
  | Circle2DGeometryData
  | Square2DGeometryData
  | Polygon2DGeometryData;

/**
 * 2D primitive generation result type
 */
export type Primitive2DResult = Result<Primitive2DGeometryData, Geometry2DGenerationError>;

/**
 * Batch primitive generation request
 */
export interface Primitive2DGenerationRequest {
  readonly type: Primitive2DType;
  readonly parameters: Primitive2DParameters;
}

/**
 * Primitive 2D Factory Service
 *
 * Provides a unified interface for generating all types of 2D primitives.
 * Acts as a facade over individual generator services while maintaining their independence.
 */
export class Primitive2DFactory {
  private readonly circleGenerator: CircleGeneratorService;
  private readonly squareGenerator: SquareGeneratorService;
  private readonly polygonGenerator: PolygonGeneratorService;

  constructor(fragmentCalculator: FragmentCalculatorService) {
    this.circleGenerator = new CircleGeneratorService(fragmentCalculator);
    this.squareGenerator = new SquareGeneratorService();
    this.polygonGenerator = new PolygonGeneratorService();
  }

  /**
   * Generate a 2D primitive of the specified type
   *
   * @param type - Type of primitive to generate
   * @param parameters - Parameters specific to the primitive type
   * @returns Result containing primitive geometry data or error
   */
  generatePrimitive(
    type: 'circle',
    parameters: CircleParameters
  ): Result<Circle2DGeometryData, Geometry2DGenerationError>;
  generatePrimitive(
    type: 'square',
    parameters: SquareParameters
  ): Result<Square2DGeometryData, Geometry2DGenerationError>;
  generatePrimitive(
    type: 'polygon',
    parameters: PolygonParameters
  ): Result<Polygon2DGeometryData, Geometry2DGenerationError>;
  generatePrimitive(type: Primitive2DType, parameters: Primitive2DParameters): Primitive2DResult {
    try {
      switch (type) {
        case 'circle':
          return this.circleGenerator.generateCircle(parameters as CircleParameters);

        case 'square':
          return this.squareGenerator.generateSquare(parameters as SquareParameters);

        case 'polygon':
          return this.polygonGenerator.generatePolygon(parameters as PolygonParameters);

        default:
          return error({
            type: 'INVALID_PARAMETERS',
            message: `Unknown primitive type: ${type}`,
            details: { type, parameters },
          });
      }
    } catch (err) {
      return error({
        type: 'TESSELLATION_FAILED',
        message: `2D primitive factory failed: ${err instanceof Error ? err.message : String(err)}`,
        details: { type, parameters },
      });
    }
  }

  /**
   * Get available primitive types
   */
  getAvailablePrimitiveTypes(): readonly Primitive2DType[] {
    return Object.freeze(['circle', 'square', 'polygon']);
  }

  /**
   * Get individual generator services for advanced use cases
   */
  getGenerators(): {
    readonly circle: CircleGeneratorService;
    readonly square: SquareGeneratorService;
    readonly polygon: PolygonGeneratorService;
  } {
    return Object.freeze({
      circle: this.circleGenerator,
      square: this.squareGenerator,
      polygon: this.polygonGenerator,
    });
  }

  /**
   * Generate multiple primitives in batch
   *
   * @param requests - Array of primitive generation requests
   * @returns Array of results corresponding to each request
   */
  generateMultiplePrimitives(
    requests: readonly Primitive2DGenerationRequest[]
  ): readonly Primitive2DResult[] {
    return requests.map((request) => {
      switch (request.type) {
        case 'circle':
          return this.generatePrimitive('circle', request.parameters as CircleParameters);
        case 'square':
          return this.generatePrimitive('square', request.parameters as SquareParameters);
        case 'polygon':
          return this.generatePrimitive('polygon', request.parameters as PolygonParameters);
        default:
          return error({
            type: 'INVALID_PARAMETERS',
            message: `Unknown primitive type in batch request: ${(request as { type: string }).type}`,
            details: { request },
          });
      }
    });
  }

  /**
   * Check if a primitive type is supported
   *
   * @param type - Primitive type to check
   * @returns True if the type is supported
   */
  isPrimitiveTypeSupported(type: string): type is Primitive2DType {
    return this.getAvailablePrimitiveTypes().includes(type as Primitive2DType);
  }

  /**
   * Get factory statistics
   *
   * @returns Object containing factory information
   */
  getFactoryInfo(): {
    readonly supportedTypes: readonly Primitive2DType[];
    readonly generatorCount: number;
    readonly version: string;
  } {
    return Object.freeze({
      supportedTypes: this.getAvailablePrimitiveTypes(),
      generatorCount: 3,
      version: '1.0.0',
    });
  }
}
