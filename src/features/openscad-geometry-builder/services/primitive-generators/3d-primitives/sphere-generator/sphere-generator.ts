/**
 * @file sphere-generator.ts
 * @description Sphere Generator Service that replicates OpenSCAD's exact ring-based sphere tessellation algorithm.
 * This service fixes the $fn=3 sphere rendering issue by implementing the exact algorithm from OpenSCAD's primitives.cc.
 *
 * @example
 * ```typescript
 * const fragmentCalculator = new FragmentCalculatorService();
 * const sphereGenerator = new SphereGeneratorService(fragmentCalculator);
 *
 * // Generate $fn=3 sphere (fixes the main issue)
 * const result = sphereGenerator.generateSphere(5, 3);
 * if (result.success) {
 *   const sphere = result.data;
 *   console.log(`Generated sphere with ${sphere.vertices.length} vertices`);
 * }
 *
 * // Generate sphere from OpenSCAD parameters
 * const paramResult = sphereGenerator.generateSphereFromParameters({
 *   radius: 5,
 *   fn: 3,
 *   fs: 2,
 *   fa: 12
 * });
 * ```
 *
 * @author OpenSCAD Babylon Team
 * @version 1.0.0
 * @since 2025-07-29
 */

import type { SphereParameters } from '@/features/openscad-geometry-builder';
import type { Result } from '@/shared';
import { error, isError, success } from '@/shared';
import type { GeometryGenerationError, SphereGeometryData } from '../../../../types/geometry-data';
import {
  calculateFragmentsWithErrorHandling,
  createGeometryData,
  createGeometryMetadata,
  normalizeVector3,
  resolveRadiusFromParameters,
} from '../../../../utils/geometry-helpers';
import { OpenSCADTrig } from '../../../../utils/math-helpers';
import { validateFragmentCount, validateRadius } from '../../../../utils/validation-helpers';
import type { FragmentCalculatorService } from '../../../fragment-calculator';
import { GeometryCacheService } from '../../../geometry-cache/geometry-cache.service';

/**
 * Sphere generation result type
 */
export type SphereResult = Result<SphereGeometryData, GeometryGenerationError>;

/**
 * Sphere Generator Service
 *
 * Replicates OpenSCAD's exact sphere generation algorithm from primitives.cc:
 * ```cpp
 * auto num_fragments = Calc::get_fragments_from_r(r, fn, fs, fa);
 * size_t num_rings = (num_fragments + 1) / 2;
 *
 * for (int i = 0; i < num_rings; ++i) {
 *   const double phi = (180.0 * (i + 0.5)) / num_rings;
 *   const double radius = r * sin_degrees(phi);
 *   generate_circle(vertices, radius, r * cos_degrees(phi), num_fragments);
 * }
 * ```
 */
export class SphereGeneratorService {
  private readonly geometryCache: GeometryCacheService;

  constructor(
    private readonly fragmentCalculator: FragmentCalculatorService,
    geometryCache?: GeometryCacheService
  ) {
    this.geometryCache = geometryCache ?? new GeometryCacheService();
  }

  /**
   * Generate sphere geometry with exact OpenSCAD algorithm
   *
   * @param radius - Sphere radius
   * @param fragments - Number of fragments (from fragment calculator)
   * @returns Result containing sphere geometry data or error
   */
  generateSphere(radius: number, fragments: number): SphereResult {
    try {
      // Check cache first
      const cacheKey = this.geometryCache.generateCacheKey('sphere', { radius, fragments });
      const cachedResult = this.geometryCache.getCachedGeometry(cacheKey);

      if (cachedResult.success) {
        return success(cachedResult.data as SphereGeometryData);
      }

      // Validate parameters
      const validationResult = this.validateParameters(radius, fragments);
      if (!validationResult.success) {
        return validationResult as Result<SphereGeometryData, GeometryGenerationError>;
      }

      // Calculate number of rings using OpenSCAD formula
      const numRings = Math.floor((fragments + 1) / 2);

      // Generate vertices and normals for all rings
      const vertices: Array<{ x: number; y: number; z: number }> = [];
      const normals: Array<{ x: number; y: number; z: number }> = [];

      for (let ringIndex = 0; ringIndex < numRings; ringIndex++) {
        // Calculate ring parameters using OpenSCAD formula
        const ringData = OpenSCADTrig.calculateSphereRing(radius, ringIndex, numRings);

        // Generate circle vertices for this ring
        const ringVertices = OpenSCADTrig.generateCircleVertices(
          ringData.ringRadius,
          ringData.z,
          fragments
        );

        // Add vertices and calculate normals
        for (const vertex of ringVertices) {
          vertices.push(vertex);

          // Normal is the normalized position vector for a sphere
          normals.push(normalizeVector3(vertex));
        }
      }

      // Generate faces connecting the rings
      const faces = this.generateSphereFaces(fragments, numRings);

      // Create sphere geometry data using utilities
      const metadata = createGeometryMetadata('3d-sphere', { radius, fragments }, true, {
        fragmentCount: fragments,
      });

      const sphereData = createGeometryData<SphereGeometryData>(vertices, faces, normals, metadata);

      // Cache the generated geometry
      this.geometryCache.cacheGeometry(cacheKey, sphereData);

      return success(sphereData);
    } catch (err) {
      return error({
        type: 'COMPUTATION_ERROR',
        message: `Sphere generation failed: ${err instanceof Error ? err.message : String(err)}`,
        details: { radius, fragments },
      });
    }
  }

  /**
   * Generate sphere from OpenSCAD parameters (radius/diameter + fragment parameters)
   *
   * @param params - OpenSCAD sphere parameters
   * @returns Result containing sphere geometry data or error
   */
  generateSphereFromParameters(params: SphereParameters): SphereResult {
    try {
      // Check cache first using normalized parameters
      const cacheKey = this.geometryCache.generateCacheKey('sphere-params', {
        radius: params.radius,
        diameter: params.diameter,
        fn: params.fn,
        fs: params.fs,
        fa: params.fa,
      });
      const cachedResult = this.geometryCache.getCachedGeometry(cacheKey);

      if (cachedResult.success) {
        return success(cachedResult.data as SphereGeometryData);
      }

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

      // Calculate fragments using fragment calculator with default values
      const fragmentResult = calculateFragmentsWithErrorHandling(
        this.fragmentCalculator,
        radius,
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

      // Generate sphere with calculated fragments
      const sphereResult = this.generateSphere(radius, fragmentResult.data);

      // Cache the result with original parameters for faster lookup
      if (sphereResult.success) {
        this.geometryCache.cacheGeometry(cacheKey, sphereResult.data);
      }

      return sphereResult;
    } catch (err) {
      return error({
        type: 'COMPUTATION_ERROR',
        message: `Sphere parameter processing failed: ${err instanceof Error ? err.message : String(err)}`,
        details: { params },
      });
    }
  }

  /**
   * Validate sphere generation parameters
   */
  private validateParameters(
    radius: number,
    fragments: number
  ): Result<void, GeometryGenerationError> {
    // Validate radius using common validation utility
    const radiusResult = validateRadius(radius);
    if (!radiusResult.success) {
      return radiusResult;
    }

    // Validate fragment count using common validation utility
    const fragmentResult = validateFragmentCount(fragments);
    if (!fragmentResult.success) {
      return fragmentResult;
    }

    return success(undefined);
  }

  /**
   * Generate faces for sphere following exact OpenSCAD algorithm
   * Creates top cap, side faces, and bottom cap like OpenSCAD primitives.cc
   */
  private generateSphereFaces(fragments: number, numRings: number): readonly (readonly number[])[] {
    const faces: number[][] = [];

    // Top cap face using first ring vertices (like OpenSCAD line 211-214)
    const topCapFace: number[] = [];
    for (let i = 0; i < fragments; i++) {
      topCapFace.push(i);
    }
    faces.push(topCapFace);

    // Side faces: Connect adjacent rings with quad faces (like OpenSCAD line 216-225)
    for (let ring = 0; ring < numRings - 1; ring++) {
      for (let fragment = 0; fragment < fragments; fragment++) {
        const currentRingStart = ring * fragments;
        const nextRingStart = (ring + 1) * fragments;
        const nextFragment = (fragment + 1) % fragments;

        // Create quad face following OpenSCAD vertex order
        const face = [
          currentRingStart + nextFragment, // i*num_fragments+(r+1)%num_fragments
          currentRingStart + fragment, // i*num_fragments+r
          nextRingStart + fragment, // (i+1)*num_fragments+r
          nextRingStart + nextFragment, // (i+1)*num_fragments+(r+1)%num_fragments
        ];

        faces.push(face);
      }
    }

    // Bottom cap face using last ring vertices (like OpenSCAD line 227-230)
    const bottomCapFace: number[] = [];
    const lastRingStart = (numRings - 1) * fragments;
    for (let i = 0; i < fragments; i++) {
      // Reverse order for correct winding (like OpenSCAD: num_rings * num_fragments - i - 1)
      bottomCapFace.push(lastRingStart + fragments - i - 1);
    }
    faces.push(bottomCapFace);

    return Object.freeze(faces.map((face) => Object.freeze(face)));
  }

  /**
   * Get sphere generation statistics for debugging
   */
  getSphereStatistics(sphereData: SphereGeometryData): {
    radius: number;
    fragments: number;
    rings: number;
    vertexCount: number;
    faceCount: number;
    triangleCount: number;
    capFaces: number;
    sideFaces: number;
  } {
    const fragments = sphereData.metadata.parameters.fragments;
    const rings = Math.floor((fragments + 1) / 2);

    // Face breakdown: 2 cap faces + (rings-1)*fragments side faces
    const capFaces = 2; // Top and bottom caps
    const sideFaces = (rings - 1) * fragments; // Quad faces between rings
    const totalFaces = capFaces + sideFaces;

    return {
      radius: sphereData.metadata.parameters.radius,
      fragments,
      rings,
      vertexCount: sphereData.vertices.length,
      faceCount: sphereData.faces.length,
      triangleCount: totalFaces, // Each face becomes triangles during tessellation
      capFaces,
      sideFaces,
    };
  }
}
