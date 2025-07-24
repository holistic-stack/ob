/**
 * @file axis-constants.ts
 * @description Centralized constants for 3D axis rendering
 * Follows SRP by containing only axis-related constants
 */

import { Vector3 } from '@babylonjs/core';

/**
 * Standard axis names
 */
export const AXIS_NAMES = {
  X: 'X',
  Y: 'Y',
  Z: 'Z',
} as const;

export type AxisName = (typeof AXIS_NAMES)[keyof typeof AXIS_NAMES];

/**
 * Standard axis directions as unit vectors
 */
export const AXIS_DIRECTIONS = {
  [AXIS_NAMES.X]: new Vector3(1, 0, 0),
  [AXIS_NAMES.Y]: new Vector3(0, 1, 0),
  [AXIS_NAMES.Z]: new Vector3(0, 0, 1),
} as const;

/**
 * Default axis rendering parameters
 */
export const DEFAULT_AXIS_PARAMS = {
  LENGTH: 1000,
  PIXEL_WIDTH: 2.0,
  CYLINDER_DIAMETER: 0.3,
  TESSELLATION: 8,
  OPACITY: 1.0,
} as const;

/**
 * Screen-space rendering constants
 */
export const SCREEN_SPACE_CONSTANTS = {
  SHADER_NAME: 'screenSpaceAxis',
  MIN_PIXEL_WIDTH: 1.0,
  MAX_PIXEL_WIDTH: 10.0,
  DEFAULT_RESOLUTION: [1920, 1080] as const,
} as const;

/**
 * Axis rotation constants (in radians)
 */
export const AXIS_ROTATIONS = {
  [AXIS_NAMES.X]: { x: 0, y: 0, z: Math.PI / 2 },
  [AXIS_NAMES.Y]: { x: 0, y: 0, z: 0 },
  [AXIS_NAMES.Z]: { x: Math.PI / 2, y: 0, z: 0 },
} as const;

/**
 * Material property constants
 */
export const MATERIAL_CONSTANTS = {
  EMISSIVE_FACTOR: 0.8,
  SPECULAR_COLOR: [1, 1, 1] as const,
  DIFFUSE_INTENSITY: 1.0,
} as const;

/**
 * Mesh naming conventions
 */
export const MESH_NAMES = {
  CYLINDER_SUFFIX: 'AxisFull',
  LINES_SUFFIX: 'AxisScreenSpace',
  MATERIAL_SUFFIX: 'Material',
  SCREEN_SPACE_MATERIAL_SUFFIX: 'ScreenSpaceMaterial',
} as const;

/**
 * Performance and quality constants
 */
export const PERFORMANCE_CONSTANTS = {
  MAX_AXIS_COUNT: 3,
  RENDER_TARGET_FPS: 60,
  MAX_RENDER_TIME_MS: Math.floor(1000 / 60), // 16ms for 60 FPS
} as const;
