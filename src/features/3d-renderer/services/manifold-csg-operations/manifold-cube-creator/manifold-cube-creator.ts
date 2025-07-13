/**
 * @file Manifold-Compliant Cube Creator
 * @description Creates manifold-compliant cube geometries with proper topology for CSG operations
 *
 * This module follows the Single Responsibility Principle by focusing solely on creating
 * manifold-compliant cube geometries. It ensures proper vertex ordering, indexing, and
 * topology that meets the strict requirements of the Manifold library.
 *
 * @example
 * ```typescript
 * import { createManifoldCube } from './manifold-cube-creator';
 *
 * // Create a unit cube
 * const unitCube = createManifoldCube([1, 1, 1]);
 *
 * // Create a rectangular box
 * const box = createManifoldCube([2, 1, 0.5]);
 * ```
 */

import { BufferAttribute, BufferGeometry } from 'three';
import type { Result } from '../../../../../shared/types/result.types';

/**
 * Size specification for a cube geometry
 */
export interface CubeSize {
  readonly width: number;
  readonly height: number;
  readonly depth: number;
}

/**
 * Converts array size to CubeSize interface
 *
 * @param size - Size as array [width, height, depth]
 * @returns CubeSize object
 */
function arrayToCubeSize(size: readonly [number, number, number]): CubeSize {
  return {
    width: size[0],
    height: size[1],
    depth: size[2],
  } as const;
}

/**
 * Validates cube size parameters
 *
 * @param size - Cube size to validate
 * @returns Result indicating validation success or error
 */
function validateCubeSize(size: CubeSize): Result<void, string> {
  if (size.width <= 0 || size.height <= 0 || size.depth <= 0) {
    return {
      success: false,
      error: `Invalid cube size: all dimensions must be positive. Got: ${size.width}x${size.height}x${size.depth}`,
    };
  }

  if (
    !Number.isFinite(size.width) ||
    !Number.isFinite(size.height) ||
    !Number.isFinite(size.depth)
  ) {
    return {
      success: false,
      error: `Invalid cube size: all dimensions must be finite numbers. Got: ${size.width}x${size.height}x${size.depth}`,
    };
  }

  return { success: true, data: undefined };
}

/**
 * Creates vertex positions for a manifold-compliant cube
 *
 * @param size - Cube dimensions
 * @returns Float32Array of vertex positions (8 vertices × 3 coordinates)
 */
function createCubeVertices(size: CubeSize): Float32Array {
  const halfWidth = size.width / 2;
  const halfHeight = size.height / 2;
  const halfDepth = size.depth / 2;

  return new Float32Array([
    // 8 cube vertices with proper ordering for manifold topology
    -halfWidth,
    -halfHeight,
    -halfDepth, // 0: left-bottom-back
    halfWidth,
    -halfHeight,
    -halfDepth, // 1: right-bottom-back
    halfWidth,
    halfHeight,
    -halfDepth, // 2: right-top-back
    -halfWidth,
    halfHeight,
    -halfDepth, // 3: left-top-back
    -halfWidth,
    -halfHeight,
    halfDepth, // 4: left-bottom-front
    halfWidth,
    -halfHeight,
    halfDepth, // 5: right-bottom-front
    halfWidth,
    halfHeight,
    halfDepth, // 6: right-top-front
    -halfWidth,
    halfHeight,
    halfDepth, // 7: left-top-front
  ]);
}

/**
 * Creates triangle indices for a manifold-compliant cube
 *
 * Uses counter-clockwise winding order when viewed from outside the cube.
 * Each face consists of 2 triangles, totaling 12 triangles for the cube.
 *
 * @returns Uint16Array of triangle indices (12 triangles × 3 vertices)
 */
function createCubeIndices(): Uint16Array {
  return new Uint16Array([
    // Back face (looking at -Z, CCW from outside)
    0, 2, 1, 0, 3, 2,
    // Front face (looking at +Z, CCW from outside)
    4, 5, 6, 4, 6, 7,
    // Left face (looking at -X, CCW from outside)
    0, 4, 7, 0, 7, 3,
    // Right face (looking at +X, CCW from outside)
    1, 2, 6, 1, 6, 5,
    // Bottom face (looking at -Y, CCW from outside)
    0, 1, 5, 0, 5, 4,
    // Top face (looking at +Y, CCW from outside)
    3, 7, 6, 3, 6, 2,
  ]);
}

/**
 * Creates a manifold-compliant cube geometry with proper topology
 *
 * This function creates a cube geometry that meets the strict requirements
 * of the Manifold library:
 * - Exactly 8 vertices (no duplicates)
 * - 12 triangles with proper indexing
 * - Counter-clockwise winding order from outside
 * - Proper vertex normals for lighting
 *
 * @param size - Cube dimensions as [width, height, depth]
 * @returns BufferGeometry representing a manifold-compliant cube
 *
 * @example
 * ```typescript
 * // Create a unit cube
 * const cube = createManifoldCube([1, 1, 1]);
 *
 * // Create a rectangular box
 * const box = createManifoldCube([2, 1, 0.5]);
 *
 * // Verify the geometry is properly indexed
 * console.log(cube.getAttribute('position').count); // 8 vertices
 * console.log(cube.getIndex()?.count); // 36 indices (12 triangles × 3)
 * ```
 */
export function createManifoldCube(
  size: readonly [number, number, number] = [1, 1, 1] as const
): BufferGeometry {
  const cubeSize = arrayToCubeSize(size);

  // Validate input parameters
  const validation = validateCubeSize(cubeSize);
  if (!validation.success) {
    throw new Error(`Failed to create manifold cube: ${validation.error}`);
  }

  // Create geometry with proper attributes
  const geometry = new BufferGeometry();

  // Set vertex positions
  const vertices = createCubeVertices(cubeSize);
  geometry.setAttribute('position', new BufferAttribute(vertices, 3));

  // Set triangle indices
  const indices = createCubeIndices();
  geometry.setIndex(new BufferAttribute(indices, 1));

  // Compute vertex normals for proper lighting
  geometry.computeVertexNormals();

  return geometry;
}

/**
 * Creates a manifold-compliant cube geometry with error handling
 *
 * @param size - Cube dimensions as [width, height, depth]
 * @returns Result containing BufferGeometry or error
 */
export function createManifoldCubeSafe(
  size: readonly [number, number, number]
): Result<BufferGeometry, string> {
  try {
    const geometry = createManifoldCube(size);
    return { success: true, data: geometry };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
