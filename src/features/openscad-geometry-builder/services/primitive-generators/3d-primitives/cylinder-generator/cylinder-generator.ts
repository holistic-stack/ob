/**
 * @file cylinder-generator.ts
 * @description Cylinder Generator Service that replicates OpenSCAD's exact cylinder generation algorithm.
 * This service generates cylinders, cones, and truncated cones with circular cross-sections and caps.
 *
 * @example
 * ```typescript
 * const fragmentCalculator = new FragmentCalculatorService();
 * const cylinderGenerator = new CylinderGeneratorService(fragmentCalculator);
 *
 * // Generate standard cylinder
 * const result = cylinderGenerator.generateCylinder(10, 5, 5, false, 8);
 * if (result.success) {
 *   const cylinder = result.data;
 *   console.log(`Generated cylinder with ${cylinder.vertices.length} vertices`);
 * }
 *
 * // Generate cone (r2 = 0)
 * const coneResult = cylinderGenerator.generateCylinder(10, 5, 0, true, 8);
 *
 * // Generate from OpenSCAD parameters
 * const paramResult = cylinderGenerator.generateCylinderFromParameters({
 *   height: 10,
 *   r1: 5,
 *   r2: 3,
 *   center: true,
 *   fn: 8,
 *   fs: 2,
 *   fa: 12
 * });
 * ```
 *
 * @author OpenSCAD Babylon Team
 * @version 1.0.0
 * @since 2025-07-29
 */

import type { CylinderParameters } from '@/features/openscad-geometry-builder';
import type { Result } from '@/shared';
import { error, isError, success } from '@/shared';
import type {
  CylinderGeometryData,
  GeometryGenerationError,
  Vector3,
} from '../../../../types/geometry-data';
import {
  calculateFragmentsWithErrorHandling,
  createGeometryData,
  createGeometryMetadata,
} from '../../../../utils/geometry-helpers';
import { OpenSCADTrig } from '../../../../utils/math-helpers';
import { validateFragmentCount, validateHeight } from '../../../../utils/validation-helpers';
import type { FragmentCalculatorService } from '../../../fragment-calculator';

/**
 * Cylinder generation result type
 */
export type CylinderResult = Result<CylinderGeometryData, GeometryGenerationError>;

/**
 * Cylinder Generator Service
 *
 * Replicates OpenSCAD's exact cylinder generation algorithm from primitives.cc:
 * ```cpp
 * auto num_fragments = Calc::get_fragments_from_r(max(r1, r2), fn, fs, fa);
 *
 * // Generate bottom circle at z1
 * if (r1 > 0) generate_circle(vertices, r1, z1, num_fragments);
 *
 * // Generate top circle at z2
 * if (r2 > 0) generate_circle(vertices, r2, z2, num_fragments);
 *
 * // Generate side faces connecting circles
 * // Generate caps if needed
 * ```
 */
export class CylinderGeneratorService {
  constructor(private readonly fragmentCalculator: FragmentCalculatorService) {}

  /**
   * Generate cylinder geometry with exact OpenSCAD algorithm
   *
   * @param height - Cylinder height
   * @param r1 - Bottom radius
   * @param r2 - Top radius
   * @param center - Whether to center the cylinder at origin
   * @param fragments - Number of fragments (from fragment calculator)
   * @returns Result containing cylinder geometry data or error
   */
  generateCylinder(
    height: number,
    r1: number,
    r2: number,
    center: boolean,
    fragments: number
  ): CylinderResult {
    try {
      // Validate parameters
      const validationResult = this.validateParameters(height, r1, r2, fragments);
      if (!validationResult.success) {
        return validationResult as Result<CylinderGeometryData, GeometryGenerationError>;
      }

      // Calculate Z positions
      const z1 = center ? -height / 2 : 0;
      const z2 = center ? height / 2 : height;

      // Generate vertices and normals
      const { vertices, normals } = this.generateCylinderVertices(r1, r2, z1, z2, fragments);

      // Generate faces
      const faces = this.generateCylinderFaces(r1, r2, fragments);

      // Create cylinder geometry data using utilities
      const metadata = createGeometryMetadata(
        '3d-cylinder',
        { height, r1, r2, center, fragments },
        true
      );

      const cylinderData = createGeometryData<CylinderGeometryData>(
        vertices,
        faces,
        normals,
        metadata
      );

      return success(cylinderData);
    } catch (err) {
      return error({
        type: 'COMPUTATION_ERROR',
        message: `Cylinder generation failed: ${err instanceof Error ? err.message : String(err)}`,
        details: { height, r1, r2, center, fragments },
      });
    }
  }

  /**
   * Generate cylinder from OpenSCAD parameters
   *
   * @param params - OpenSCAD cylinder parameters
   * @returns Result containing cylinder geometry data or error
   */
  generateCylinderFromParameters(params: CylinderParameters): CylinderResult {
    try {
      // Determine radii (diameter takes precedence over radius)
      let r1: number, r2: number;

      if (params.d1 !== undefined || params.d2 !== undefined) {
        // Use diameter parameters
        r1 = (params.d1 ?? params.d2 ?? 0) / 2;
        r2 = (params.d2 ?? params.d1 ?? 0) / 2;
      } else if (params.d !== undefined) {
        // Use uniform diameter
        r1 = r2 = params.d / 2;
      } else if (params.r !== undefined) {
        // Use uniform radius
        r1 = r2 = params.r;
      } else if (params.r1 !== undefined || params.r2 !== undefined) {
        // Use individual radii
        r1 = params.r1 ?? params.r2 ?? 0;
        r2 = params.r2 ?? params.r1 ?? 0;
      } else {
        return error({
          type: 'INVALID_PARAMETERS',
          message: 'Either radius (r/r1/r2) or diameter (d/d1/d2) must be specified',
        });
      }

      // Calculate fragments using fragment calculator with default values
      const maxRadius = Math.max(r1, r2);
      const fragmentResult = calculateFragmentsWithErrorHandling(
        this.fragmentCalculator,
        maxRadius,
        params.fn ?? 0, // Default to 0 (use fs/fa calculation)
        params.fs ?? 2, // Default fragment size
        params.fa ?? 12 // Default fragment angle
      );

      if (isError(fragmentResult)) {
        return error({
          type: 'INVALID_PARAMETERS',
          message: fragmentResult.error.message,
          details: { params },
        });
      }

      // Generate cylinder with calculated fragments
      return this.generateCylinder(params.height, r1, r2, params.center, fragmentResult.data);
    } catch (err) {
      return error({
        type: 'COMPUTATION_ERROR',
        message: `Cylinder parameter processing failed: ${err instanceof Error ? err.message : String(err)}`,
        details: { params },
      });
    }
  }

  /**
   * Validate cylinder generation parameters
   */
  private validateParameters(
    height: number,
    r1: number,
    r2: number,
    fragments: number
  ): Result<void, GeometryGenerationError> {
    // Validate height using common validation utility
    const heightResult = validateHeight(height);
    if (!heightResult.success) {
      return heightResult;
    }

    // Validate radii (special cylinder logic: both can be 0, but not both)
    if (r1 < 0 || r2 < 0) {
      return error({
        type: 'INVALID_PARAMETERS',
        message: 'Cylinder radii must be non-negative',
      });
    }

    if (r1 === 0 && r2 === 0) {
      return error({
        type: 'INVALID_PARAMETERS',
        message: 'At least one radius must be positive',
      });
    }

    // Validate fragment count using common validation utility
    const fragmentResult = validateFragmentCount(fragments);
    if (!fragmentResult.success) {
      return fragmentResult;
    }

    return success(undefined);
  }

  /**
   * Generate vertices and normals for cylinder
   */
  private generateCylinderVertices(
    r1: number,
    r2: number,
    z1: number,
    z2: number,
    fragments: number
  ): { vertices: Vector3[]; normals: Vector3[] } {
    const vertices: Vector3[] = [];
    const normals: Vector3[] = [];

    // Generate circle vertices and side normals
    this.addCircleVertices(vertices, normals, r1, z1, fragments);
    this.addCircleVertices(vertices, normals, r2, z2, fragments);

    // Add center points and apex points
    this.addCenterAndApexPoints(vertices, normals, r1, r2, z1, z2);

    return { vertices, normals };
  }

  /**
   * Add circle vertices and corresponding side normals
   */
  private addCircleVertices(
    vertices: Vector3[],
    normals: Vector3[],
    radius: number,
    z: number,
    fragments: number
  ): void {
    if (radius <= 0) return;

    const circleVertices = OpenSCADTrig.generateCircleVertices(radius, z, fragments);
    vertices.push(...circleVertices);

    // Generate side normals for the circle
    for (let i = 0; i < fragments; i++) {
      const angle = (2 * Math.PI * i) / fragments;
      normals.push({
        x: Math.cos(angle),
        y: Math.sin(angle),
        z: 0,
      });
    }
  }

  /**
   * Add center points for caps and apex points for cones
   */
  private addCenterAndApexPoints(
    vertices: Vector3[],
    normals: Vector3[],
    r1: number,
    r2: number,
    z1: number,
    z2: number
  ): void {
    // Add center points for caps
    if (r1 > 0) {
      vertices.push({ x: 0, y: 0, z: z1 });
      normals.push({ x: 0, y: 0, z: -1 }); // Bottom normal points down
    }

    if (r2 > 0) {
      vertices.push({ x: 0, y: 0, z: z2 });
      normals.push({ x: 0, y: 0, z: 1 }); // Top normal points up
    }

    // Add apex points for cone cases
    if (r1 === 0) {
      vertices.push({ x: 0, y: 0, z: z1 });
      normals.push({ x: 0, y: 0, z: -1 });
    }

    if (r2 === 0) {
      vertices.push({ x: 0, y: 0, z: z2 });
      normals.push({ x: 0, y: 0, z: 1 });
    }
  }

  /**
   * Generate faces for cylinder
   */
  private generateCylinderFaces(r1: number, r2: number, fragments: number): (readonly number[])[] {
    const faces: number[][] = [];

    // Generate side faces based on cylinder type
    this.addSideFaces(faces, r1, r2, fragments);

    // Generate cap faces
    this.addCapFaces(faces, r1, r2, fragments);

    return faces.map((face) => Object.freeze(face));
  }

  /**
   * Add side faces for cylinder (quads for cylinder/truncated cone, triangles for cones)
   */
  private addSideFaces(faces: number[][], r1: number, r2: number, fragments: number): void {
    if (r1 > 0 && r2 > 0) {
      // Standard cylinder or truncated cone: connect two circles with quads
      this.addCylinderSideFaces(faces, fragments);
    } else if (r1 > 0) {
      // Cone with apex at top: connect bottom circle to apex
      this.addConeToApexFaces(faces, fragments, fragments + 1);
    } else if (r2 > 0) {
      // Inverted cone with apex at bottom: connect top circle to apex
      this.addInvertedConeToApexFaces(faces, fragments, fragments + 1);
    }
  }

  /**
   * Add quad faces connecting bottom and top circles for standard cylinder
   */
  private addCylinderSideFaces(faces: number[][], fragments: number): void {
    for (let i = 0; i < fragments; i++) {
      const next = (i + 1) % fragments;

      // Quad face connecting bottom and top circles
      faces.push([
        i, // Bottom current
        next, // Bottom next
        fragments + next, // Top next
        fragments + i, // Top current
      ]);
    }
  }

  /**
   * Add triangle faces connecting circle to apex for cone
   */
  private addConeToApexFaces(faces: number[][], fragments: number, apexIndex: number): void {
    for (let i = 0; i < fragments; i++) {
      const next = (i + 1) % fragments;
      faces.push([i, next, apexIndex]);
    }
  }

  /**
   * Add triangle faces connecting circle to apex for inverted cone
   */
  private addInvertedConeToApexFaces(
    faces: number[][],
    fragments: number,
    apexIndex: number
  ): void {
    for (let i = 0; i < fragments; i++) {
      const next = (i + 1) % fragments;
      faces.push([next, i, apexIndex]);
    }
  }

  /**
   * Add cap faces (bottom and top)
   */
  private addCapFaces(faces: number[][], r1: number, r2: number, fragments: number): void {
    // Bottom cap
    if (r1 > 0) {
      const bottomCenterIndex = r2 > 0 ? fragments * 2 : fragments;
      this.addCapTriangles(faces, fragments, bottomCenterIndex, 0, false);
    }

    // Top cap
    if (r2 > 0) {
      const topCenterIndex = r1 > 0 ? fragments * 2 + 1 : fragments;
      const topOffset = r1 > 0 ? fragments : 0;
      this.addCapTriangles(faces, fragments, topCenterIndex, topOffset, true);
    }
  }

  /**
   * Add triangular faces for a cap (bottom or top)
   */
  private addCapTriangles(
    faces: number[][],
    fragments: number,
    centerIndex: number,
    offset: number,
    isTopCap: boolean
  ): void {
    for (let i = 0; i < fragments; i++) {
      const next = (i + 1) % fragments;

      if (isTopCap) {
        faces.push([centerIndex, offset + i, offset + next]);
      } else {
        faces.push([centerIndex, next, i]);
      }
    }
  }

  /**
   * Get cylinder generation statistics for debugging
   */
  getCylinderStatistics(cylinderData: CylinderGeometryData): {
    height: number;
    r1: number;
    r2: number;
    center: boolean;
    fragments: number;
    vertexCount: number;
    faceCount: number;
    triangleCount: number;
    volume: number;
    type: 'cylinder' | 'cone' | 'truncated-cone';
  } {
    const { height, r1, r2, fragments } = cylinderData.metadata.parameters;

    let type: 'cylinder' | 'cone' | 'truncated-cone';
    if (r1 === r2) {
      type = 'cylinder';
    } else if (r1 === 0 || r2 === 0) {
      type = 'cone';
    } else {
      type = 'truncated-cone';
    }

    // Calculate volume using truncated cone formula
    const volume = (Math.PI * height * (r1 * r1 + r1 * r2 + r2 * r2)) / 3;

    return {
      height,
      r1,
      r2,
      center: cylinderData.metadata.parameters.center,
      fragments,
      vertexCount: cylinderData.vertices.length,
      faceCount: cylinderData.faces.length,
      triangleCount: cylinderData.faces.reduce((sum, face) => sum + (face.length - 2), 0),
      volume,
      type,
    };
  }
}
