/**
 * @file test-data-generators.ts
 * @description Test utility functions for generating common test data.
 * Provides reusable test data generators following DRY, KISS, and SRP principles.
 *
 * @author OpenSCAD Babylon Team
 * @version 1.0.0
 * @since 2025-07-29
 */

import { TEST_CONSTANTS } from '../constants';
import type { Vector3 } from '../types/geometry-data';
import type {
  CubeParameters,
  CylinderParameters,
  PolyhedronParameters,
  SphereParameters,
} from '../types/primitive-parameters';

/**
 * Generate standard sphere test parameters
 *
 * @param overrides - Optional parameter overrides
 * @returns Sphere parameters for testing
 */
export function createSphereTestParameters(
  overrides: Partial<SphereParameters> = {}
): SphereParameters {
  return {
    radius: TEST_CONSTANTS.TEST_RADIUS,
    fn: TEST_CONSTANTS.TEST_FRAGMENTS_NORMAL,
    fs: 2,
    fa: 12,
    ...overrides,
  };
}

/**
 * Generate sphere parameters for the critical $fn=3 test case
 *
 * @param radius - Radius for the sphere (default: 5)
 * @returns Sphere parameters for $fn=3 test
 */
export function createSphereTestParametersFn3(radius: number = 5): SphereParameters {
  return {
    radius,
    fn: TEST_CONSTANTS.TEST_FRAGMENTS_FN3,
    fs: 2,
    fa: 12,
  };
}

/**
 * Generate standard cube test parameters
 *
 * @param overrides - Optional parameter overrides
 * @returns Cube parameters for testing
 */
export function createCubeTestParameters(overrides: Partial<CubeParameters> = {}): CubeParameters {
  return {
    size: TEST_CONSTANTS.TEST_CUBE_SIZE,
    center: false,
    ...overrides,
  };
}

/**
 * Generate standard cylinder test parameters
 *
 * @param overrides - Optional parameter overrides
 * @returns Cylinder parameters for testing
 */
export function createCylinderTestParameters(
  overrides: Partial<CylinderParameters> = {}
): CylinderParameters {
  return {
    height: TEST_CONSTANTS.TEST_CYLINDER_HEIGHT,
    r1: TEST_CONSTANTS.TEST_RADIUS,
    r2: TEST_CONSTANTS.TEST_RADIUS,
    center: false,
    fn: TEST_CONSTANTS.TEST_FRAGMENTS_NORMAL,
    fs: 2,
    fa: 12,
    ...overrides,
  };
}

/**
 * Generate cone test parameters (r2 = 0)
 *
 * @param overrides - Optional parameter overrides
 * @returns Cone parameters for testing
 */
export function createConeTestParameters(
  overrides: Partial<CylinderParameters> = {}
): CylinderParameters {
  return createCylinderTestParameters({
    r2: 0,
    ...overrides,
  });
}

/**
 * Generate inverted cone test parameters (r1 = 0)
 *
 * @param overrides - Optional parameter overrides
 * @returns Inverted cone parameters for testing
 */
export function createInvertedConeTestParameters(
  overrides: Partial<CylinderParameters> = {}
): CylinderParameters {
  return createCylinderTestParameters({
    r1: 0,
    ...overrides,
  });
}

/**
 * Generate standard polyhedron test parameters (tetrahedron)
 *
 * @param overrides - Optional parameter overrides
 * @returns Polyhedron parameters for testing
 */
export function createPolyhedronTestParameters(
  overrides: Partial<PolyhedronParameters> = {}
): PolyhedronParameters {
  return {
    points: TEST_CONSTANTS.TEST_TETRAHEDRON_VERTICES,
    faces: TEST_CONSTANTS.TEST_TETRAHEDRON_FACES,
    convexity: 1,
    ...overrides,
  };
}

/**
 * Generate simple cube polyhedron test parameters
 *
 * @returns Polyhedron parameters for a unit cube
 */
export function createCubePolyhedronTestParameters(): PolyhedronParameters {
  return {
    points: [
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 0, z: 0 },
      { x: 1, y: 1, z: 0 },
      { x: 0, y: 1, z: 0 }, // Bottom face
      { x: 0, y: 0, z: 1 },
      { x: 1, y: 0, z: 1 },
      { x: 1, y: 1, z: 1 },
      { x: 0, y: 1, z: 1 }, // Top face
    ],
    faces: [
      [0, 1, 2, 3], // Bottom
      [4, 7, 6, 5], // Top
      [0, 4, 5, 1], // Front
      [2, 6, 7, 3], // Back
      [0, 3, 7, 4], // Left
      [1, 5, 6, 2], // Right
    ],
    convexity: 1,
  };
}

/**
 * Generate invalid parameter test cases for sphere
 *
 * @returns Array of invalid sphere parameter sets with descriptions
 */
export function createInvalidSphereParameters(): Array<{
  params: Partial<SphereParameters>;
  description: string;
  expectedError: string;
}> {
  return [
    {
      params: { radius: -5 },
      description: 'negative radius',
      expectedError: 'Radius must be positive',
    },
    {
      params: { radius: 0 },
      description: 'zero radius',
      expectedError: 'Radius must be positive',
    },
    {
      params: { radius: Number.POSITIVE_INFINITY },
      description: 'infinite radius',
      expectedError: 'finite number',
    },
    {
      params: { radius: 5, fn: 2 },
      description: 'fragments less than 3',
      expectedError: 'Fragments must be at least 3',
    },
    {
      params: { radius: 5, fn: 3.5 },
      description: 'non-integer fragments',
      expectedError: 'Fragments must be an integer',
    },
  ];
}

/**
 * Generate invalid parameter test cases for cube
 *
 * @returns Array of invalid cube parameter sets with descriptions
 */
export function createInvalidCubeParameters(): Array<{
  params: Partial<CubeParameters>;
  description: string;
  expectedError: string;
}> {
  return [
    {
      params: { size: { x: -2, y: 4, z: 6 } },
      description: 'negative x dimension',
      expectedError: 'All size dimensions must be positive',
    },
    {
      params: { size: { x: 2, y: 0, z: 6 } },
      description: 'zero y dimension',
      expectedError: 'All size dimensions must be positive',
    },
    {
      params: { size: { x: 2, y: 4, z: Number.POSITIVE_INFINITY } },
      description: 'infinite z dimension',
      expectedError: 'finite number',
    },
  ];
}

/**
 * Generate invalid parameter test cases for cylinder
 *
 * @returns Array of invalid cylinder parameter sets with descriptions
 */
export function createInvalidCylinderParameters(): Array<{
  params: Partial<CylinderParameters>;
  description: string;
  expectedError: string;
}> {
  return [
    {
      params: { height: -10, r1: 5, r2: 5 },
      description: 'negative height',
      expectedError: 'Height must be positive',
    },
    {
      params: { height: 0, r1: 5, r2: 5 },
      description: 'zero height',
      expectedError: 'Height must be positive',
    },
    {
      params: { height: 10, r1: -5, r2: 5 },
      description: 'negative r1',
      expectedError: 'radii must be non-negative',
    },
    {
      params: { height: 10, r1: 0, r2: 0 },
      description: 'both radii zero',
      expectedError: 'At least one radius must be positive',
    },
    {
      params: { height: 10, r1: 5, r2: 5, fn: 2 },
      description: 'fragments less than 3',
      expectedError: 'Fragments must be at least 3',
    },
  ];
}

/**
 * Generate invalid parameter test cases for polyhedron
 *
 * @returns Array of invalid polyhedron parameter sets with descriptions
 */
export function createInvalidPolyhedronParameters(): Array<{
  params: Partial<PolyhedronParameters>;
  description: string;
  expectedError: string;
}> {
  return [
    {
      params: { points: [], faces: [[0, 1, 2]] },
      description: 'empty vertices',
      expectedError: 'at least one vertex',
    },
    {
      params: { points: [{ x: 0, y: 0, z: 0 }], faces: [] },
      description: 'empty faces',
      expectedError: 'at least one face',
    },
    {
      params: { points: [{ x: 0, y: 0 } as Vector3], faces: [[0, 1, 2]] },
      description: 'invalid vertex coordinates',
      expectedError: 'exactly 3 coordinates',
    },
    {
      params: {
        points: [
          { x: 0, y: 0, z: 0 },
          { x: 1, y: 1, z: 1 },
        ],
        faces: [[0, 1]],
      },
      description: 'face with too few vertices',
      expectedError: 'at least 3 vertices',
    },
    {
      params: {
        points: [
          { x: 0, y: 0, z: 0 },
          { x: 1, y: 1, z: 1 },
        ],
        faces: [[0, 5, 1]],
      },
      description: 'invalid vertex index',
      expectedError: 'invalid vertex index',
    },
    {
      params: {
        points: [
          { x: 0, y: 0, z: 0 },
          { x: 1, y: 1, z: 1 },
        ],
        faces: [[0, 1, 1]],
      },
      description: 'duplicate vertex indices',
      expectedError: 'duplicate vertex indices',
    },
  ];
}

/**
 * Generate performance test data with varying complexity
 *
 * @returns Array of test cases with different complexity levels
 */
export function createPerformanceTestData(): Array<{
  name: string;
  sphereParams: SphereParameters;
  expectedMaxTime: number;
}> {
  return [
    {
      name: 'low complexity ($fn=3)',
      sphereParams: createSphereTestParametersFn3(),
      expectedMaxTime: 10, // ms
    },
    {
      name: 'medium complexity ($fn=8)',
      sphereParams: createSphereTestParameters({ fn: 8 }),
      expectedMaxTime: 20, // ms
    },
    {
      name: 'high complexity ($fn=16)',
      sphereParams: createSphereTestParameters({ fn: 16 }),
      expectedMaxTime: 50, // ms
    },
  ];
}
