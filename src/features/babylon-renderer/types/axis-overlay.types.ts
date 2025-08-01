/**
 * @file axis-overlay.types.ts
 * @description Type definitions for 3D axis overlay with scale ticks and labels.
 * Provides visual reference and scale information directly in the 3D viewport.
 *
 * @example Basic Usage
 * ```typescript
 * const config: AxisOverlayConfig = {
 *   isVisible: true,
 *   tickInterval: 1.0,
 *   majorTickCount: 10,
 *   minorTickCount: 5,
 *   fontSize: 12,
 *   opacity: 0.8
 * };
 * ```
 */

import { Color3, Vector3 } from '@babylonjs/core';
import type { Result } from '../../../shared/types/result.types';

/**
 * Axis overlay configuration
 */
export interface AxisOverlayConfig {
  readonly isVisible: boolean;
  readonly showTicks: boolean;
  readonly showLabels: boolean;
  readonly tickInterval: number;
  readonly majorTickCount: number;
  readonly minorTickCount: number;
  readonly fontSize: number;
  readonly fontFamily: string;
  readonly opacity: number;
  readonly colors: AxisOverlayColors;
  readonly units: AxisOverlayUnits;
  readonly position: AxisOverlayPosition;
}

/**
 * Axis overlay color scheme
 */
export interface AxisOverlayColors {
  readonly xAxis: Color3;
  readonly yAxis: Color3;
  readonly zAxis: Color3;
  readonly majorTicks: Color3;
  readonly minorTicks: Color3;
  readonly labels: Color3;
  readonly background: Color3;
}

/**
 * Axis overlay units configuration
 */
export interface AxisOverlayUnits {
  readonly type: 'mm' | 'cm' | 'in' | 'units';
  readonly precision: number;
  readonly showUnitSuffix: boolean;
}

/**
 * Axis overlay position configuration
 */
export interface AxisOverlayPosition {
  readonly origin: Vector3;
  readonly axisLength: number;
  readonly tickLength: number;
  readonly labelOffset: number;
}

/**
 * Axis overlay state
 */
export interface AxisOverlayState {
  readonly id: string;
  readonly isInitialized: boolean;
  readonly isVisible: boolean;
  readonly config: AxisOverlayConfig;
  readonly currentZoomLevel: number;
  readonly dynamicTickInterval: number;
  readonly lastUpdated: Date;
  readonly error: AxisOverlayError | null;
}

/**
 * Axis overlay error types
 */
export interface AxisOverlayError {
  readonly type:
    | 'INITIALIZATION_FAILED'
    | 'RENDER_FAILED'
    | 'CONFIG_INVALID'
    | 'GUI_CREATION_FAILED';
  readonly message: string;
  readonly details?: unknown;
  readonly timestamp: Date;
}

/**
 * Axis overlay service interface
 */
export interface IAxisOverlayService {
  readonly isInitialized: boolean;
  readonly isVisible: boolean;
  readonly config: AxisOverlayConfig;

  /**
   * Initialize the axis overlay service
   */
  initialize(
    scene: import('@babylonjs/core').Scene,
    camera: import('@babylonjs/core').Camera
  ): Promise<Result<void, AxisOverlayError>>;

  /**
   * Update configuration
   */
  updateConfig(config: Partial<AxisOverlayConfig>): Result<void, AxisOverlayError>;

  /**
   * Set visibility
   */
  setVisibility(visible: boolean): Result<void, AxisOverlayError>;

  /**
   * Update dynamic tick interval based on camera distance
   */
  updateDynamicTicks(cameraDistance: number): Result<void, AxisOverlayError>;

  /**
   * Dispose resources
   */
  dispose(): Result<void, AxisOverlayError>;

  /**
   * Get current state
   */
  getState(): AxisOverlayState;
}

/**
 * Default axis overlay configuration
 */
export const DEFAULT_AXIS_OVERLAY_CONFIG: AxisOverlayConfig = {
  isVisible: false, // Hidden by default for cleaner screenshots
  showTicks: false, // SketchUp style: no tick marks
  showLabels: false, // SketchUp style: no labels
  tickInterval: 1.0, // Keep for compatibility but not used
  majorTickCount: 0, // No ticks in SketchUp style
  minorTickCount: 0, // No ticks in SketchUp style
  fontSize: 12, // Keep for compatibility but not used
  fontFamily: 'Arial, sans-serif', // Keep for compatibility but not used
  opacity: 1.0, // Full opacity for clear visibility
  colors: {
    xAxis: new Color3(1, 0, 0), // Red - SketchUp standard
    yAxis: new Color3(0, 1, 0), // Green - SketchUp standard
    zAxis: new Color3(0, 0, 1), // Blue - SketchUp standard
    majorTicks: new Color3(0.8, 0.8, 0.8), // Not used in SketchUp style
    minorTicks: new Color3(0.5, 0.5, 0.5), // Not used in SketchUp style
    labels: new Color3(1, 1, 1), // Not used in SketchUp style
    background: new Color3(0, 0, 0), // Not used in SketchUp style
  },
  units: {
    type: 'units',
    precision: 1,
    showUnitSuffix: false,
  },
  position: {
    origin: new Vector3(0, 0, 0),
    axisLength: 1000, // Long axes extending to infinity
    tickLength: 0.0, // No ticks in SketchUp style
    labelOffset: 0.0, // No labels in SketchUp style
  },
} as const;

/**
 * Create unique axis overlay ID
 */
export function createAxisOverlayId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Validate axis overlay configuration
 */
export function validateAxisOverlayConfig(
  config: Partial<AxisOverlayConfig>
): Result<AxisOverlayConfig, AxisOverlayError> {
  try {
    const validatedConfig: AxisOverlayConfig = {
      ...DEFAULT_AXIS_OVERLAY_CONFIG,
      ...config,
    };

    // Validate numeric values
    if (validatedConfig.tickInterval <= 0) {
      return {
        success: false,
        error: {
          type: 'CONFIG_INVALID',
          message: 'Tick interval must be greater than 0',
          timestamp: new Date(),
        },
      };
    }

    if (validatedConfig.fontSize <= 0) {
      return {
        success: false,
        error: {
          type: 'CONFIG_INVALID',
          message: 'Font size must be greater than 0',
          timestamp: new Date(),
        },
      };
    }

    if (validatedConfig.opacity < 0 || validatedConfig.opacity > 1) {
      return {
        success: false,
        error: {
          type: 'CONFIG_INVALID',
          message: 'Opacity must be between 0 and 1',
          timestamp: new Date(),
        },
      };
    }

    return {
      success: true,
      data: validatedConfig,
    };
  } catch (error) {
    return {
      success: false,
      error: {
        type: 'CONFIG_INVALID',
        message: `Configuration validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: error,
        timestamp: new Date(),
      },
    };
  }
}

/**
 * Calculate dynamic tick interval based on camera distance
 */
export function calculateDynamicTickInterval(
  cameraDistance: number,
  baseInterval: number = 1.0
): number {
  // Handle edge cases
  if (cameraDistance <= 0) {
    return baseInterval;
  }

  // Logarithmic scaling for smooth transitions
  const scale = 10 ** Math.floor(Math.log10(Math.max(cameraDistance / 10, 0.1)));
  return baseInterval * Math.max(scale, 0.1);
}
