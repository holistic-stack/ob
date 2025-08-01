/**
 * @file axis-config.ts
 * @description Unified configuration interfaces and utilities for axis creation
 * Centralizes configuration types to eliminate duplication across axis creators
 */

import { type Color3, Vector3 } from '@babylonjs/core';
import type { AxisColorScheme } from '../../axis-colors/axis-colors';

/**
 * Base configuration for all axis types
 */
export interface BaseAxisConfig {
  readonly name: string;
  readonly origin: Vector3;
  readonly direction: Vector3;
  readonly length: number;
  readonly color: Color3;
  readonly opacity?: number;
}

/**
 * Configuration for line-based axes (solid and dashed)
 */
export interface LineAxisConfig extends BaseAxisConfig {
  readonly type: 'line';
  readonly pixelWidth?: number;
  readonly isDotted?: boolean;
  readonly dashSize?: number;
  readonly gapSize?: number;
  readonly dashNb?: number;
}

/**
 * Configuration for cylinder-based 3D axes
 */
export interface CylinderAxisConfig extends BaseAxisConfig {
  readonly type: 'cylinder';
  readonly diameter: number;
  readonly tessellation?: number;
}

/**
 * Union type for all axis configurations
 */
export type AxisConfig = LineAxisConfig | CylinderAxisConfig;

/**
 * Configuration for creating coordinate axis sets
 */
export interface CoordinateAxesConfig {
  readonly origin?: Vector3;
  readonly length?: number;
  readonly opacity?: number;
  readonly colorScheme?: AxisColorScheme;
  readonly type: 'line' | 'cylinder';

  // Line-specific options
  readonly pixelWidth?: number;
  readonly dashSize?: number;
  readonly gapSize?: number;

  // Cylinder-specific options
  readonly diameter?: number;
  readonly tessellation?: number;
}

/**
 * Standard axis names
 */
export const AXIS_NAMES = {
  X: 'X',
  Y: 'Y',
  Z: 'Z',
} as const;

export type AxisName = keyof typeof AXIS_NAMES;

/**
 * Standard axis directions
 */
export const AXIS_DIRECTIONS: Record<AxisName, Vector3> = {
  X: new Vector3(1, 0, 0),
  Y: new Vector3(0, 1, 0),
  Z: new Vector3(0, 0, 1),
} as const;

/**
 * Default configuration values
 */
export const DEFAULT_AXIS_CONFIG = {
  LENGTH: 1000,
  OPACITY: 1.0,
  PIXEL_WIDTH: 2.0,
  DIAMETER: 0.3,
  TESSELLATION: 8,
  DASH_SIZE: 0.3,
  GAP_SIZE: 1.0,
  DASH_NB: 100,
} as const;

/**
 * Utility class for creating and validating axis configurations
 *
 * @example
 * ```typescript
 * const config = AxisConfigUtils.createLineConfig({
 *   name: 'X',
 *   color: new Color3(1, 0, 0),
 *   length: 100
 * });
 * ```
 */
/**
 * Creates a line axis configuration with defaults
 *
 * @param params - Partial configuration parameters
 * @returns Complete line axis configuration
 */
export function createLineAxisConfig(params: {
  name: string;
  color: Color3;
  origin?: Vector3;
  direction?: Vector3;
  length?: number;
  opacity?: number;
  pixelWidth?: number;
  isDotted?: boolean;
  dashSize?: number;
  gapSize?: number;
}): LineAxisConfig {
  return {
    type: 'line',
    name: params.name,
    origin: params.origin ?? Vector3.Zero(),
    direction: params.direction ?? AXIS_DIRECTIONS[params.name as AxisName] ?? new Vector3(1, 0, 0),
    length: params.length ?? DEFAULT_AXIS_CONFIG.LENGTH,
    color: params.color,
    opacity: params.opacity ?? DEFAULT_AXIS_CONFIG.OPACITY,
    pixelWidth: params.pixelWidth ?? DEFAULT_AXIS_CONFIG.PIXEL_WIDTH,
    isDotted: params.isDotted ?? false,
    dashSize: params.dashSize ?? DEFAULT_AXIS_CONFIG.DASH_SIZE,
    gapSize: params.gapSize ?? DEFAULT_AXIS_CONFIG.GAP_SIZE,
    dashNb: DEFAULT_AXIS_CONFIG.DASH_NB,
  };
}

/**
 * Creates a cylinder axis configuration with defaults
 *
 * @param params - Partial configuration parameters
 * @returns Complete cylinder axis configuration
 */
export function createCylinderAxisConfig(params: {
  name: string;
  color: Color3;
  origin?: Vector3;
  direction?: Vector3;
  length?: number;
  opacity?: number;
  diameter?: number;
  tessellation?: number;
}): CylinderAxisConfig {
  return {
    type: 'cylinder',
    name: params.name,
    origin: params.origin ?? Vector3.Zero(),
    direction: params.direction ?? AXIS_DIRECTIONS[params.name as AxisName] ?? new Vector3(1, 0, 0),
    length: params.length ?? DEFAULT_AXIS_CONFIG.LENGTH,
    color: params.color,
    opacity: params.opacity ?? DEFAULT_AXIS_CONFIG.OPACITY,
    diameter: params.diameter ?? DEFAULT_AXIS_CONFIG.DIAMETER,
    tessellation: params.tessellation ?? DEFAULT_AXIS_CONFIG.TESSELLATION,
  };
}

/**
 * Validates an axis configuration
 *
 * @param config - Configuration to validate
 * @returns True if configuration is valid
 */
export function isValidAxisConfig(config: AxisConfig): boolean {
  if (!config.name || config.name.trim().length === 0) {
    return false;
  }

  if (!config.origin || !config.direction || !config.color) {
    return false;
  }

  if (config.length <= 0 || !Number.isFinite(config.length)) {
    return false;
  }

  if (config.direction.length() === 0) {
    return false;
  }

  if (config.opacity !== undefined && (config.opacity < 0 || config.opacity > 1)) {
    return false;
  }

  // Type-specific validation
  if (config.type === 'line') {
    if (config.pixelWidth !== undefined && config.pixelWidth <= 0) {
      return false;
    }
  } else if (config.type === 'cylinder') {
    if (config.diameter <= 0 || !Number.isFinite(config.diameter)) {
      return false;
    }
    if (config.tessellation !== undefined && config.tessellation < 3) {
      return false;
    }
  }

  return true;
}

/**
 * Creates a standard coordinate axes configuration
 *
 * @param baseConfig - Base configuration for all axes
 * @returns Configuration for creating X, Y, Z axes
 */
export function createCoordinateAxesConfig(baseConfig: CoordinateAxesConfig): CoordinateAxesConfig {
  return {
    origin: Vector3.Zero(),
    length: DEFAULT_AXIS_CONFIG.LENGTH,
    opacity: DEFAULT_AXIS_CONFIG.OPACITY,
    colorScheme: 'STANDARD',
    pixelWidth: DEFAULT_AXIS_CONFIG.PIXEL_WIDTH,
    diameter: DEFAULT_AXIS_CONFIG.DIAMETER,
    tessellation: DEFAULT_AXIS_CONFIG.TESSELLATION,
    dashSize: DEFAULT_AXIS_CONFIG.DASH_SIZE,
    gapSize: DEFAULT_AXIS_CONFIG.GAP_SIZE,
    ...baseConfig,
  };
}
