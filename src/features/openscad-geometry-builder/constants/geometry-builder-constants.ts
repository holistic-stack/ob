/**
 * @file geometry-builder-constants.ts
 * @description Centralized constants for OpenSCAD Geometry Builder feature.
 * Consolidates all magic numbers, performance thresholds, and configuration values.
 *
 * @author OpenSCAD Babylon Team
 * @version 1.0.0
 * @since 2025-07-29
 */

import { OPENSCAD_GLOBALS } from '../../../shared/constants/openscad-globals/openscad-globals.constants';
import type { Vector3 } from '../types/geometry-data';

/**
 * Fragment calculation constants
 */
export const FRAGMENT_CONSTANTS = Object.freeze({
  /**
   * OpenSCAD's GRID_FINE constant (very small value for radius comparison)
   */
  GRID_FINE: 0.01,

  /**
   * Minimum number of fragments (OpenSCAD constraint)
   */
  MIN_FRAGMENTS: 3,

  /**
   * Minimum number of fragments for $fs/$fa mode (OpenSCAD constraint)
   */
  MIN_FRAGMENTS_FS_FA: 5,

  /**
   * Maximum reasonable fragments for performance
   */
  MAX_FRAGMENTS: 1000,

  /**
   * Default fragment parameters (from shared constants)
   */
  DEFAULT_FN: OPENSCAD_GLOBALS.DEFAULT_FN,
  DEFAULT_FA: OPENSCAD_GLOBALS.DEFAULT_FA,
  DEFAULT_FS: OPENSCAD_GLOBALS.DEFAULT_FS,
} as const);

/**
 * Performance thresholds for geometry generation
 */
export const PERFORMANCE_CONSTANTS = Object.freeze({
  /**
   * Maximum time for simple operations (ms)
   */
  SIMPLE_OPERATION_TIMEOUT: 10,

  /**
   * Maximum time for complex operations (ms)
   */
  COMPLEX_OPERATION_TIMEOUT: 50,

  /**
   * Maximum time for batch operations (ms)
   */
  BATCH_OPERATION_TIMEOUT: 100,

  /**
   * Maximum vertices for real-time generation
   */
  MAX_REALTIME_VERTICES: 10000,

  /**
   * Maximum faces for real-time generation
   */
  MAX_REALTIME_FACES: 20000,
} as const);

/**
 * Validation constants
 */
export const VALIDATION_CONSTANTS = Object.freeze({
  /**
   * Minimum positive value for dimensions
   */
  MIN_POSITIVE_VALUE: Number.EPSILON,

  /**
   * Maximum reasonable dimension value
   */
  MAX_DIMENSION_VALUE: 1e6,

  /**
   * Tolerance for floating point comparisons
   */
  FLOAT_TOLERANCE: 1e-10,

  /**
   * Maximum number of vertices in a face
   */
  MAX_FACE_VERTICES: 1000,
} as const);

/**
 * Geometry generation constants
 */
export const GEOMETRY_CONSTANTS = Object.freeze({
  /**
   * Default convexity value for polyhedra
   */
  DEFAULT_CONVEXITY: 1,

  /**
   * Minimum vertices for a valid face
   */
  MIN_FACE_VERTICES: 3,

  /**
   * Default normal vector for degenerate cases
   */
  DEFAULT_NORMAL: Object.freeze({ x: 0, y: 0, z: 1 }),

  /**
   * Coordinate precision for vertex comparison
   */
  VERTEX_PRECISION: 5,
} as const);

/**
 * Error message constants
 */
export const ERROR_MESSAGES = Object.freeze({
  INVALID_RADIUS: 'Radius must be positive',
  INVALID_FRAGMENTS: 'Fragments must be at least 3',
  INVALID_HEIGHT: 'Height must be positive',
  INVALID_SIZE: 'All size dimensions must be positive',
  INVALID_VERTEX: 'Vertex must have exactly 3 coordinates [x, y, z]',
  INVALID_FACE: 'Face must have at least 3 vertices',
  INVALID_VERTEX_INDEX: 'Face contains invalid vertex index',
  DUPLICATE_VERTEX_INDEX: 'Face contains duplicate vertex indices',
  EMPTY_VERTICES: 'Must have at least one vertex',
  EMPTY_FACES: 'Must have at least one face',
  COMPUTATION_ERROR: 'Geometry generation failed',
  UNKNOWN_PRIMITIVE_TYPE: 'Unknown primitive type',
} as const);

/**
 * Test constants for consistent testing
 */
export const TEST_CONSTANTS = Object.freeze({
  /**
   * Standard test radius
   */
  TEST_RADIUS: 5,

  /**
   * Standard test fragments for $fn=3 case
   */
  TEST_FRAGMENTS_FN3: 3,

  /**
   * Standard test fragments for normal case
   */
  TEST_FRAGMENTS_NORMAL: 8,

  /**
   * Standard test size for cubes
   */
  TEST_CUBE_SIZE: Object.freeze({ x: 2, y: 4, z: 6 }),

  /**
   * Standard test height for cylinders
   */
  TEST_CYLINDER_HEIGHT: 10,

  /**
   * Test tetrahedron vertices
   */
  TEST_TETRAHEDRON_VERTICES: Object.freeze([
    { x: 0, y: 0, z: 0 },
    { x: 1, y: 0, z: 0 },
    { x: 0.5, y: 1, z: 0 },
    { x: 0.5, y: 0.5, z: 1 },
  ] as readonly Vector3[]),

  /**
   * Test tetrahedron faces
   */
  TEST_TETRAHEDRON_FACES: Object.freeze([
    [0, 1, 2],
    [0, 3, 1],
    [1, 3, 2],
    [2, 3, 0],
  ]),
} as const);

/**
 * Type definitions for constants
 */
export type FragmentConstants = typeof FRAGMENT_CONSTANTS;
export type PerformanceConstants = typeof PERFORMANCE_CONSTANTS;
export type ValidationConstants = typeof VALIDATION_CONSTANTS;
export type GeometryConstants = typeof GEOMETRY_CONSTANTS;
export type ErrorMessages = typeof ERROR_MESSAGES;
export type TestConstants = typeof TEST_CONSTANTS;
