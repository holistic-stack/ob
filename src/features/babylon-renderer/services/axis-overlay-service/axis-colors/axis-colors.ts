/**
 * @file axis-colors.ts
 * @description Centralized color management for 3D axes
 * Follows SRP by handling only color-related functionality
 */

import { Color3 } from '@babylonjs/core';
import { AXIS_NAMES, type AxisName } from '../axis-constants/axis-constants';

/**
 * RGB color tuple type
 */
export type RGBColor = readonly [number, number, number];

/**
 * RGBA color tuple type
 */
export type RGBAColor = readonly [number, number, number, number];

/**
 * Standard axis colors (SketchUp style)
 */
export const STANDARD_AXIS_COLORS: Record<AxisName, RGBColor> = {
  [AXIS_NAMES.X]: [1, 0, 0] as const, // Red
  [AXIS_NAMES.Y]: [0, 1, 0] as const, // Green
  [AXIS_NAMES.Z]: [0, 0, 1] as const, // Blue
} as const;

/**
 * Alternative axis color schemes
 */
export const AXIS_COLOR_SCHEMES = {
  STANDARD: STANDARD_AXIS_COLORS,
  MUTED: {
    [AXIS_NAMES.X]: [0.8, 0.2, 0.2] as const,
    [AXIS_NAMES.Y]: [0.2, 0.8, 0.2] as const,
    [AXIS_NAMES.Z]: [0.2, 0.2, 0.8] as const,
  },
  HIGH_CONTRAST: {
    [AXIS_NAMES.X]: [1, 0.1, 0.1] as const,
    [AXIS_NAMES.Y]: [0.1, 1, 0.1] as const,
    [AXIS_NAMES.Z]: [0.1, 0.1, 1] as const,
  },
  PASTEL: {
    [AXIS_NAMES.X]: [1, 0.7, 0.7] as const,
    [AXIS_NAMES.Y]: [0.7, 1, 0.7] as const,
    [AXIS_NAMES.Z]: [0.7, 0.7, 1] as const,
  },
} as const;

export type AxisColorScheme = keyof typeof AXIS_COLOR_SCHEMES;

/**
 * Convert RGB tuple to Babylon.js Color3
 */
export function rgbToColor3(rgb: RGBColor): Color3 {
  return new Color3(rgb[0], rgb[1], rgb[2]);
}

/**
 * Convert RGBA tuple to Babylon.js Color3 (ignoring alpha)
 */
export function rgbaToColor3(rgba: RGBAColor): Color3 {
  return new Color3(rgba[0], rgba[1], rgba[2]);
}

/**
 * Convert Color3 to RGB tuple
 */
export function color3ToRgb(color: Color3): RGBColor {
  return [color.r, color.g, color.b] as const;
}

/**
 * Get axis color from a scheme
 */
export function getAxisColor(axis: AxisName, scheme: AxisColorScheme = 'STANDARD'): RGBColor {
  return AXIS_COLOR_SCHEMES[scheme][axis];
}

/**
 * Get axis color as Color3
 */
export function getAxisColor3(axis: AxisName, scheme: AxisColorScheme = 'STANDARD'): Color3 {
  const rgb = getAxisColor(axis, scheme);
  return rgbToColor3(rgb);
}

/**
 * Validate RGB color values
 */
export function isValidRgb(rgb: RGBColor): boolean {
  return rgb.every((value) => value >= 0 && value <= 1);
}

/**
 * Validate RGBA color values
 */
export function isValidRgba(rgba: RGBAColor): boolean {
  return rgba.every((value) => value >= 0 && value <= 1);
}

/**
 * Clamp RGB values to valid range [0, 1]
 */
export function clampRgb(rgb: RGBColor): RGBColor {
  return [
    Math.max(0, Math.min(1, rgb[0])),
    Math.max(0, Math.min(1, rgb[1])),
    Math.max(0, Math.min(1, rgb[2])),
  ] as const;
}

/**
 * Clamp RGBA values to valid range [0, 1]
 */
export function clampRgba(rgba: RGBAColor): RGBAColor {
  return [
    Math.max(0, Math.min(1, rgba[0])),
    Math.max(0, Math.min(1, rgba[1])),
    Math.max(0, Math.min(1, rgba[2])),
    Math.max(0, Math.min(1, rgba[3])),
  ] as const;
}

/**
 * Create a dimmed version of a color
 */
export function dimColor(rgb: RGBColor, factor: number = 0.5): RGBColor {
  const clampedFactor = Math.max(0, Math.min(1, factor));
  return [rgb[0] * clampedFactor, rgb[1] * clampedFactor, rgb[2] * clampedFactor] as const;
}

/**
 * Create a brightened version of a color
 */
export function brightenColor(rgb: RGBColor, factor: number = 1.5): RGBColor {
  const clampedFactor = Math.max(1, factor);
  return clampRgb([rgb[0] * clampedFactor, rgb[1] * clampedFactor, rgb[2] * clampedFactor]);
}

/**
 * Get all axis colors from a scheme
 */
export function getAllAxisColors(scheme: AxisColorScheme = 'STANDARD'): Record<AxisName, RGBColor> {
  return AXIS_COLOR_SCHEMES[scheme];
}

/**
 * Get all axis colors as Color3 objects
 */
export function getAllAxisColors3(scheme: AxisColorScheme = 'STANDARD'): Record<AxisName, Color3> {
  const colors = getAllAxisColors(scheme);
  return {
    [AXIS_NAMES.X]: rgbToColor3(colors[AXIS_NAMES.X]),
    [AXIS_NAMES.Y]: rgbToColor3(colors[AXIS_NAMES.Y]),
    [AXIS_NAMES.Z]: rgbToColor3(colors[AXIS_NAMES.Z]),
  };
}

/**
 * Default color configuration
 */
export const DEFAULT_AXIS_COLORS = getAllAxisColors('STANDARD');
export const DEFAULT_AXIS_COLORS_3 = getAllAxisColors3('STANDARD');
