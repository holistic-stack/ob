/**
 * @file simplified-axis-overlay.service.ts
 * @description Simplified axis overlay service using unified architecture
 * Follows SRP by delegating specific responsibilities to specialized services
 */

import type { Scene } from '@babylonjs/core';
import { Vector3 } from '@babylonjs/core';
import type { AxisColorScheme } from './axis-colors/axis-colors';
import { DEFAULT_AXIS_PARAMS, SCREEN_SPACE_CONSTANTS } from './axis-constants/axis-constants';
import {
  AxisConfigHelpers,
  type AxisCreationResult,
  defaultAxisCreator,
} from './axis-creator/unified-axis-creator';
import {
  type AxisError,
  AxisErrorFactory,
  type AxisResult,
  AxisResultUtils,
} from './axis-errors/axis-errors';
import { AxisValidationUtils, type ValidationOptions } from './axis-validation/axis-validation';

/**
 * Simplified configuration for axis overlay
 */
export interface SimplifiedAxisConfig {
  readonly visible?: boolean;
  readonly pixelWidth?: number;
  readonly length?: number;
  readonly opacity?: number;
  readonly colorScheme?: AxisColorScheme;
  readonly origin?: Vector3;
  readonly resolution?: readonly [number, number];
}

/**
 * State of the axis overlay
 */
export interface AxisOverlayState {
  readonly initialized: boolean;
  readonly visible: boolean;
  readonly config: SimplifiedAxisConfig;
  readonly axisCount: number;
  readonly lastError?: AxisError;
}

/**
 * Lifecycle management service
 */
class AxisLifecycleService {
  private axes: AxisCreationResult[] = [];
  private scene: Scene | null = null;
  private initialized = false;

  /**
   * Initialize the axis overlay
   */
  initialize(scene: Scene, config: SimplifiedAxisConfig): AxisResult<AxisCreationResult[]> {
    try {
      // Validate scene
      const sceneResult = AxisValidationUtils.validateScene(scene);
      if (!AxisResultUtils.isSuccess(sceneResult)) {
        return sceneResult;
      }

      // Validate and sanitize configuration
      const configResult = this.validateConfig(config);
      if (!AxisResultUtils.isSuccess(configResult)) {
        return configResult;
      }

      // Dispose existing axes if any
      this.dispose();

      // Create axes
      const axesResult = this.createAxes(scene, configResult.data);
      if (!AxisResultUtils.isSuccess(axesResult)) {
        return axesResult;
      }

      this.scene = scene;
      this.axes = axesResult.data;
      this.initialized = true;

      return AxisResultUtils.success(this.axes);
    } catch (error) {
      return AxisResultUtils.failureFromUnknown(error, 'axis overlay initialization', { config });
    }
  }

  /**
   * Update the axis configuration
   */
  updateConfig(config: SimplifiedAxisConfig): AxisResult<void> {
    if (!this.initialized || !this.scene) {
      return AxisResultUtils.failure(
        AxisErrorFactory.createRenderError('Axis overlay not initialized', 'update')
      );
    }

    try {
      // Validate configuration
      const configResult = this.validateConfig(config);
      if (!AxisResultUtils.isSuccess(configResult)) {
        return configResult;
      }

      // Recreate axes with new configuration
      const axesResult = this.createAxes(this.scene, configResult.data);
      if (!AxisResultUtils.isSuccess(axesResult)) {
        return axesResult;
      }

      // Dispose old axes and update
      this.disposeAxes();
      this.axes = axesResult.data;

      return AxisResultUtils.success(undefined);
    } catch (error) {
      return AxisResultUtils.failureFromUnknown(error, 'axis configuration update', { config });
    }
  }

  /**
   * Dispose all resources
   */
  dispose(): void {
    this.disposeAxes();
    this.scene = null;
    this.initialized = false;
  }

  /**
   * Get current axes
   */
  getAxes(): readonly AxisCreationResult[] {
    return [...this.axes];
  }

  /**
   * Check if initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  private validateConfig(config: SimplifiedAxisConfig): AxisResult<SimplifiedAxisConfig> {
    const validationOptions: ValidationOptions = {
      strict: false,
      allowZero: false,
    };

    // Validate individual properties if present
    if (config.pixelWidth !== undefined) {
      const result = AxisValidationUtils.validatePixelWidth(config.pixelWidth, validationOptions);
      if (!AxisResultUtils.isSuccess(result)) {
        return result;
      }
    }

    if (config.opacity !== undefined) {
      const result = AxisValidationUtils.validateOpacity(config.opacity, validationOptions);
      if (!AxisResultUtils.isSuccess(result)) {
        return result;
      }
    }

    if (config.length !== undefined) {
      const result = AxisValidationUtils.validateAxisLength(config.length, validationOptions);
      if (!AxisResultUtils.isSuccess(result)) {
        return result;
      }
    }

    if (config.resolution !== undefined) {
      const result = AxisValidationUtils.validateResolution(config.resolution);
      if (!AxisResultUtils.isSuccess(result)) {
        return result;
      }
    }

    return AxisResultUtils.success(config);
  }

  private createAxes(scene: Scene, config: SimplifiedAxisConfig): AxisResult<AxisCreationResult[]> {
    const baseConfig = AxisConfigHelpers.createSketchUpScreenSpaceConfig(
      config.origin || Vector3.Zero(),
      config.length || DEFAULT_AXIS_PARAMS.LENGTH,
      config.pixelWidth || DEFAULT_AXIS_PARAMS.PIXEL_WIDTH,
      config.resolution || SCREEN_SPACE_CONSTANTS.DEFAULT_RESOLUTION
    );

    // Override opacity if provided
    const finalConfig = {
      ...baseConfig,
      opacity: config.opacity || DEFAULT_AXIS_PARAMS.OPACITY,
    };

    return defaultAxisCreator.createScreenSpaceCoordinateAxes(
      finalConfig,
      scene,
      config.colorScheme || 'STANDARD'
    );
  }

  private disposeAxes(): void {
    this.axes.forEach((axis) => {
      try {
        if (axis.mesh && typeof axis.mesh.dispose === 'function') {
          axis.mesh.dispose();
        }
        if (axis.material && typeof axis.material.dispose === 'function') {
          axis.material.dispose();
        }
      } catch (_error) {
        // Ignore disposal errors
      }
    });
    this.axes = [];
  }
}

/**
 * Visibility management service
 */
class AxisVisibilityService {
  private visible = true;

  /**
   * Set visibility of all axes
   */
  setVisibility(axes: readonly AxisCreationResult[], visible: boolean): AxisResult<void> {
    try {
      axes.forEach((axis) => {
        if (axis.mesh && 'setEnabled' in axis.mesh) {
          (axis.mesh as { setEnabled: (enabled: boolean) => void }).setEnabled(visible);
        }
      });

      this.visible = visible;
      return AxisResultUtils.success(undefined);
    } catch (error) {
      return AxisResultUtils.failureFromUnknown(error, 'visibility update', { visible });
    }
  }

  /**
   * Get current visibility state
   */
  isVisible(): boolean {
    return this.visible;
  }

  /**
   * Toggle visibility
   */
  toggle(axes: readonly AxisCreationResult[]): AxisResult<boolean> {
    const newVisibility = !this.visible;
    const result = this.setVisibility(axes, newVisibility);

    if (AxisResultUtils.isSuccess(result)) {
      return AxisResultUtils.success(newVisibility);
    }

    return result;
  }
}

/**
 * Simplified axis overlay service interface
 */
export interface ISimplifiedAxisOverlayService {
  initialize(scene: Scene, config?: SimplifiedAxisConfig): AxisResult<void>;
  updateConfig(config: SimplifiedAxisConfig): AxisResult<void>;
  setVisibility(visible: boolean): AxisResult<void>;
  toggleVisibility(): AxisResult<boolean>;
  dispose(): void;
  getState(): AxisOverlayState;
}

/**
 * Simplified axis overlay service implementation
 */
export class SimplifiedAxisOverlayService implements ISimplifiedAxisOverlayService {
  private lifecycleService = new AxisLifecycleService();
  private visibilityService = new AxisVisibilityService();
  private currentConfig: SimplifiedAxisConfig = {};
  private lastError?: AxisError;

  /**
   * Initialize the axis overlay with optional configuration
   */
  initialize(scene: Scene, config: SimplifiedAxisConfig = {}): AxisResult<void> {
    const result = this.lifecycleService.initialize(scene, config);

    if (AxisResultUtils.isSuccess(result)) {
      this.currentConfig = config;
      this.lastError = undefined;

      // Set initial visibility
      if (config.visible !== undefined) {
        this.visibilityService.setVisibility(result.data, config.visible);
      }

      return AxisResultUtils.success(undefined);
    } else {
      this.lastError = result.error;
      return AxisResultUtils.failure(result.error);
    }
  }

  /**
   * Update the axis configuration
   */
  updateConfig(config: SimplifiedAxisConfig): AxisResult<void> {
    const result = this.lifecycleService.updateConfig(config);

    if (AxisResultUtils.isSuccess(result)) {
      this.currentConfig = { ...this.currentConfig, ...config };
      this.lastError = undefined;

      // Update visibility if specified
      if (config.visible !== undefined) {
        const axes = this.lifecycleService.getAxes();
        this.visibilityService.setVisibility(axes, config.visible);
      }

      return AxisResultUtils.success(undefined);
    } else {
      this.lastError = result.error;
      return result;
    }
  }

  /**
   * Set visibility of the axis overlay
   */
  setVisibility(visible: boolean): AxisResult<void> {
    const axes = this.lifecycleService.getAxes();
    const result = this.visibilityService.setVisibility(axes, visible);

    if (AxisResultUtils.isSuccess(result)) {
      this.currentConfig = { ...this.currentConfig, visible };
      this.lastError = undefined;
    } else {
      this.lastError = result.error;
    }

    return result;
  }

  /**
   * Toggle visibility of the axis overlay
   */
  toggleVisibility(): AxisResult<boolean> {
    const axes = this.lifecycleService.getAxes();
    const result = this.visibilityService.toggle(axes);

    if (AxisResultUtils.isSuccess(result)) {
      this.currentConfig = { ...this.currentConfig, visible: result.data };
      this.lastError = undefined;
    } else {
      this.lastError = result.error;
    }

    return result;
  }

  /**
   * Dispose all resources
   */
  dispose(): void {
    this.lifecycleService.dispose();
    this.currentConfig = {};
    this.lastError = undefined;
  }

  /**
   * Get current state of the axis overlay
   */
  getState(): AxisOverlayState {
    const axes = this.lifecycleService.getAxes();

    const baseState = {
      initialized: this.lifecycleService.isInitialized(),
      visible: this.visibilityService.isVisible(),
      config: { ...this.currentConfig },
      axisCount: axes.length,
    };

    return this.lastError ? { ...baseState, lastError: this.lastError } : baseState;
  }
}

/**
 * Default configuration for SketchUp-style axes
 */
export const DEFAULT_SKETCHUP_CONFIG: SimplifiedAxisConfig = {
  visible: true,
  pixelWidth: DEFAULT_AXIS_PARAMS.PIXEL_WIDTH,
  length: DEFAULT_AXIS_PARAMS.LENGTH,
  opacity: DEFAULT_AXIS_PARAMS.OPACITY,
  colorScheme: 'STANDARD',
  origin: Vector3.Zero(),
  resolution: SCREEN_SPACE_CONSTANTS.DEFAULT_RESOLUTION,
} as const;

/**
 * Factory function to create a new simplified axis overlay service
 */
export function createSimplifiedAxisOverlayService(): ISimplifiedAxisOverlayService {
  return new SimplifiedAxisOverlayService();
}

/**
 * Default service instance
 */
export const defaultSimplifiedAxisOverlayService = createSimplifiedAxisOverlayService();
