/**
 * @file primitive-3d-factory.ts
 * @description Unified 3D Primitive Factory Service that provides a convenient API for all 3D primitives.
 * This service acts as a facade over individual generators while maintaining their independence.
 *
 * @example
 * ```typescript
 * const fragmentCalculator = new FragmentCalculatorService();
 * const factory = new Primitive3DFactory(fragmentCalculator);
 *
 * // Generate sphere
 * const sphereResult = factory.generatePrimitive('sphere', {
 *   radius: 5,
 *   fn: 3,
 *   fs: 2,
 *   fa: 12
 * });
 *
 * // Generate cube
 * const cubeResult = factory.generatePrimitive('cube', {
 *   size: { x: 2, y: 4, z: 6 },
 *   center: true
 * });
 *
 * // Generate cylinder
 * const cylinderResult = factory.generatePrimitive('cylinder', {
 *   height: 10,
 *   r1: 5,
 *   r2: 3,
 *   center: false,
 *   fn: 8,
 *   fs: 2,
 *   fa: 12
 * });
 *
 * // Generate polyhedron
 * const polyhedronResult = factory.generatePrimitive('polyhedron', {
 *   points: [[0,0,0], [1,0,0], [0.5,1,0], [0.5,0.5,1]],
 *   faces: [[0,1,2], [0,3,1], [1,3,2], [2,3,0]]
 * });
 * ```
 *
 * @author OpenSCAD Babylon Team
 * @version 1.0.0
 * @since 2025-07-29
 */

import type { Result } from '../../../../../../shared/types/result.types';
import { error, success } from '../../../../../../shared/utils/functional/result';
import type {
  CubeGeometryData,
  CylinderGeometryData,
  GeometryGenerationError,
  PolyhedronGeometryData,
  SphereGeometryData,
} from '../../../../types/geometry-data';
import type {
  CubeParameters,
  CylinderParameters,
  PolyhedronParameters,
  SphereParameters,
} from '../../../../types/primitive-parameters';
import type { FragmentCalculatorService } from '../../../fragment-calculator';
import { CubeGeneratorService } from '../cube-generator';
import { CylinderGeneratorService } from '../cylinder-generator';
import { PolyhedronGeneratorService } from '../polyhedron-generator';
import { SphereGeneratorService } from '../sphere-generator';

/**
 * Union type for all 3D primitive types
 */
export type Primitive3DType = 'sphere' | 'cube' | 'cylinder' | 'polyhedron';

/**
 * Union type for all 3D primitive parameters
 */
export type Primitive3DParameters =
  | SphereParameters
  | CubeParameters
  | CylinderParameters
  | PolyhedronParameters;

/**
 * Union type for all 3D primitive geometry data
 */
export type Primitive3DGeometryData =
  | SphereGeometryData
  | CubeGeometryData
  | CylinderGeometryData
  | PolyhedronGeometryData;

/**
 * 3D primitive generation result type
 */
export type Primitive3DResult = Result<Primitive3DGeometryData, GeometryGenerationError>;

/**
 * Primitive 3D Factory Service
 *
 * Provides a unified interface for generating all types of 3D primitives.
 * Acts as a facade over individual generator services while maintaining their independence.
 */
export class Primitive3DFactory {
  private readonly sphereGenerator: SphereGeneratorService;
  private readonly cubeGenerator: CubeGeneratorService;
  private readonly cylinderGenerator: CylinderGeneratorService;
  private readonly polyhedronGenerator: PolyhedronGeneratorService;

  constructor(fragmentCalculator: FragmentCalculatorService) {
    this.sphereGenerator = new SphereGeneratorService(fragmentCalculator);
    this.cubeGenerator = new CubeGeneratorService();
    this.cylinderGenerator = new CylinderGeneratorService(fragmentCalculator);
    this.polyhedronGenerator = new PolyhedronGeneratorService();
  }

  /**
   * Generate a 3D primitive of the specified type
   *
   * @param type - Type of primitive to generate
   * @param parameters - Parameters specific to the primitive type
   * @returns Result containing primitive geometry data or error
   */
  generatePrimitive(
    type: 'sphere',
    parameters: SphereParameters
  ): Result<SphereGeometryData, GeometryGenerationError>;
  generatePrimitive(
    type: 'cube',
    parameters: CubeParameters
  ): Result<CubeGeometryData, GeometryGenerationError>;
  generatePrimitive(
    type: 'cylinder',
    parameters: CylinderParameters
  ): Result<CylinderGeometryData, GeometryGenerationError>;
  generatePrimitive(
    type: 'polyhedron',
    parameters: PolyhedronParameters
  ): Result<PolyhedronGeometryData, GeometryGenerationError>;
  generatePrimitive(type: Primitive3DType, parameters: Primitive3DParameters): Primitive3DResult {
    try {
      switch (type) {
        case 'sphere':
          return this.sphereGenerator.generateSphereFromParameters(parameters as SphereParameters);

        case 'cube':
          return this.cubeGenerator.generateCubeFromParameters(parameters as CubeParameters);

        case 'cylinder':
          return this.cylinderGenerator.generateCylinderFromParameters(
            parameters as CylinderParameters
          );

        case 'polyhedron':
          return this.polyhedronGenerator.generatePolyhedronFromParameters(
            parameters as PolyhedronParameters
          );

        default:
          return error({
            type: 'INVALID_PARAMETERS',
            message: `Unknown primitive type: ${type}`,
            details: { type, parameters },
          });
      }
    } catch (err) {
      return error({
        type: 'COMPUTATION_ERROR',
        message: `3D primitive factory failed: ${err instanceof Error ? err.message : String(err)}`,
        details: { type, parameters },
      });
    }
  }

  /**
   * Get available primitive types
   */
  getAvailablePrimitiveTypes(): readonly Primitive3DType[] {
    return Object.freeze(['sphere', 'cube', 'cylinder', 'polyhedron']);
  }

  /**
   * Get individual generator services for advanced use cases
   */
  getGenerators(): {
    readonly sphere: SphereGeneratorService;
    readonly cube: CubeGeneratorService;
    readonly cylinder: CylinderGeneratorService;
    readonly polyhedron: PolyhedronGeneratorService;
  } {
    return Object.freeze({
      sphere: this.sphereGenerator,
      cube: this.cubeGenerator,
      cylinder: this.cylinderGenerator,
      polyhedron: this.polyhedronGenerator,
    });
  }

  /**
   * Generate multiple primitives in batch
   *
   * @param requests - Array of primitive generation requests
   * @returns Array of results in the same order as requests
   */
  generateBatch(
    requests: Array<
      | { type: 'sphere'; parameters: SphereParameters; id?: string }
      | { type: 'cube'; parameters: CubeParameters; id?: string }
      | { type: 'cylinder'; parameters: CylinderParameters; id?: string }
      | { type: 'polyhedron'; parameters: PolyhedronParameters; id?: string }
    >
  ): Array<{
    id?: string;
    result: Primitive3DResult;
  }> {
    return requests.map((request) => {
      let result: Primitive3DResult;

      switch (request.type) {
        case 'sphere':
          result = this.generatePrimitive('sphere', request.parameters);
          break;
        case 'cube':
          result = this.generatePrimitive('cube', request.parameters);
          break;
        case 'cylinder':
          result = this.generatePrimitive('cylinder', request.parameters);
          break;
        case 'polyhedron':
          result = this.generatePrimitive('polyhedron', request.parameters);
          break;
        default:
          result = error({
            type: 'INVALID_PARAMETERS',
            message: `Unknown primitive type in batch: ${(request as any).type}`,
            details: { request },
          });
      }

      return {
        id: request.id,
        result,
      };
    });
  }

  /**
   * Get factory statistics for debugging
   */
  getFactoryStatistics(): {
    availablePrimitives: readonly Primitive3DType[];
    generatorCount: number;
    version: string;
  } {
    return {
      availablePrimitives: this.getAvailablePrimitiveTypes(),
      generatorCount: 4,
      version: '1.0.0',
    };
  }
}
