/**
 * @file axis-overlay.service.ts
 * @description BabylonJS service for rendering 3D axis overlay with scale ticks and labels
 * directly in the 3D viewport using BabylonJS GUI system. Provides visual reference
 * and scale information with dynamic tick spacing based on camera distance.
 *
 * @example Basic Usage
 * ```typescript
 * const service = createAxisOverlayService();
 * await service.initialize(scene, camera);
 * service.setVisibility(true);
 * ```
 */

import {
  type Camera,
  type LinesMesh,
  type Mesh,
  type Scene,
  type StandardMaterial,
  type ShaderMaterial,
  Vector3,
} from '@babylonjs/core';
import { AdvancedDynamicTexture, type TextBlock } from '@babylonjs/gui';
import { createLogger } from '../../../../shared/services/logger.service';
import type { Result } from '../../../../shared/types/result.types';
import type {
  AxisOverlayConfig,
  AxisOverlayError,
  AxisOverlayState,
  IAxisOverlayService,
} from '../../types/axis-overlay.types';
import {
  calculateDynamicTickInterval,
  createAxisOverlayId,
  DEFAULT_AXIS_OVERLAY_CONFIG,
  validateAxisOverlayConfig,
} from '../../types/axis-overlay.types';
import { createScreenSpaceCoordinateAxes } from './axis-creator';

const logger = createLogger('AxisOverlayService');

/**
 * BabylonJS Axis Overlay Service Implementation
 *
 * Renders 3D coordinate axes with graduated tick marks and numeric labels
 * directly in the 3D scene viewport using BabylonJS GUI system.
 */
export class AxisOverlayService implements IAxisOverlayService {
  private _scene: Scene | null = null;
  private _guiTexture: AdvancedDynamicTexture | null = null;
  private _axisLines: (LinesMesh | Mesh)[] = [];
  private _tickLines: LinesMesh[] = [];
  private _labelBlocks: TextBlock[] = [];
  private _materials: (StandardMaterial | ShaderMaterial)[] = [];
  private _state: AxisOverlayState;

  constructor(config: Partial<AxisOverlayConfig> = {}) {
    const configResult = validateAxisOverlayConfig(config);

    this._state = {
      id: createAxisOverlayId('axis-overlay'),
      isInitialized: false,
      isVisible: false,
      config: configResult.success ? configResult.data : DEFAULT_AXIS_OVERLAY_CONFIG,
      currentZoomLevel: 1.0,
      dynamicTickInterval: 1.0,
      lastUpdated: new Date(),
      error: configResult.success ? null : configResult.error,
    };

    logger.init('[INIT][AxisOverlayService] Service created');
  }

  get isInitialized(): boolean {
    return this._state.isInitialized;
  }

  get isVisible(): boolean {
    return this._state.isVisible;
  }

  get config(): AxisOverlayConfig {
    return this._state.config;
  }

  /**
   * Initialize the axis overlay service
   */
  async initialize(scene: Scene, camera: Camera): Promise<Result<void, AxisOverlayError>> {
    try {
      logger.init('[INIT][AxisOverlayService] Initializing axis overlay');

      // Validate inputs
      if (!scene || !camera) {
        const error: AxisOverlayError = {
          type: 'INITIALIZATION_FAILED',
          message: 'Scene and camera are required for initialization',
          timestamp: new Date(),
        };

        this._state = { ...this._state, error };
        return { success: false, error };
      }

      this._scene = scene;

      // Create GUI texture for labels
      this._guiTexture = AdvancedDynamicTexture.CreateFullscreenUI('AxisOverlayGUI', true, scene);

      if (!this._guiTexture) {
        const error: AxisOverlayError = {
          type: 'GUI_CREATION_FAILED',
          message: 'Failed to create GUI texture',
          timestamp: new Date(),
        };

        this._state = { ...this._state, error };
        return { success: false, error };
      }

      // Create axis lines and ticks
      await this._createAxisElements();

      this._state = {
        ...this._state,
        isInitialized: true,
        isVisible: this._state.config.isVisible,
        lastUpdated: new Date(),
        error: null,
      };

      logger.debug('[DEBUG][AxisOverlayService] Axis overlay initialized successfully');
      return { success: true, data: undefined };
    } catch (error) {
      const axisError: AxisOverlayError = {
        type: 'INITIALIZATION_FAILED',
        message: `Initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: error,
        timestamp: new Date(),
      };

      this._state = { ...this._state, error: axisError };
      logger.error('[ERROR][AxisOverlayService] Initialization failed:', axisError.message);

      return { success: false, error: axisError };
    }
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<AxisOverlayConfig>): Result<void, AxisOverlayError> {
    try {
      const configResult = validateAxisOverlayConfig({ ...this._state.config, ...config });

      if (!configResult.success) {
        return { success: false, error: configResult.error };
      }

      this._state = {
        ...this._state,
        config: configResult.data,
        lastUpdated: new Date(),
      };

      // Recreate elements if initialized
      if (this._state.isInitialized) {
        this._disposeElements();
        this._createAxisElements();
      }

      logger.debug('[DEBUG][AxisOverlayService] Configuration updated');
      return { success: true, data: undefined };
    } catch (error) {
      const axisError: AxisOverlayError = {
        type: 'CONFIG_INVALID',
        message: `Config update failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: error,
        timestamp: new Date(),
      };

      this._state = { ...this._state, error: axisError };
      return { success: false, error: axisError };
    }
  }

  /**
   * Set visibility
   */
  setVisibility(visible: boolean): Result<void, AxisOverlayError> {
    try {
      this._state = {
        ...this._state,
        isVisible: visible,
        lastUpdated: new Date(),
      };

      // Update visibility of all elements
      this._updateElementsVisibility(visible);

      logger.debug(`[DEBUG][AxisOverlayService] Visibility set to: ${visible}`);
      return { success: true, data: undefined };
    } catch (error) {
      const axisError: AxisOverlayError = {
        type: 'RENDER_FAILED',
        message: `Visibility update failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: error,
        timestamp: new Date(),
      };

      this._state = { ...this._state, error: axisError };
      return { success: false, error: axisError };
    }
  }

  /**
   * Update dynamic tick interval based on camera distance
   */
  updateDynamicTicks(cameraDistance: number): Result<void, AxisOverlayError> {
    try {
      const newInterval = calculateDynamicTickInterval(
        cameraDistance,
        this._state.config.tickInterval
      );

      this._state = {
        ...this._state,
        currentZoomLevel: cameraDistance,
        dynamicTickInterval: newInterval,
        lastUpdated: new Date(),
      };

      // SketchUp-style axes don't need tick recreation

      return { success: true, data: undefined };
    } catch (error) {
      const axisError: AxisOverlayError = {
        type: 'RENDER_FAILED',
        message: `Dynamic tick update failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: error,
        timestamp: new Date(),
      };

      this._state = { ...this._state, error: axisError };
      return { success: false, error: axisError };
    }
  }

  /**
   * Dispose resources
   */
  dispose(): Result<void, AxisOverlayError> {
    try {
      logger.debug('[DEBUG][AxisOverlayService] Disposing axis overlay');

      this._disposeElements();

      if (this._guiTexture) {
        this._guiTexture.dispose();
        this._guiTexture = null;
      }

      this._scene = null;

      this._state = {
        ...this._state,
        isInitialized: false,
        isVisible: false,
        lastUpdated: new Date(),
      };

      logger.debug('[DEBUG][AxisOverlayService] Axis overlay disposed');
      return { success: true, data: undefined };
    } catch (error) {
      const axisError: AxisOverlayError = {
        type: 'RENDER_FAILED',
        message: `Disposal failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: error,
        timestamp: new Date(),
      };

      this._state = { ...this._state, error: axisError };
      return { success: false, error: axisError };
    }
  }

  /**
   * Get current state
   */
  getState(): AxisOverlayState {
    return { ...this._state };
  }

  /**
   * Create axis elements (lines, ticks, labels)
   */
  private async _createAxisElements(): Promise<void> {
    if (!this._scene) return;

    // Create axis elements using current configuration (SketchUp style)

    // Create axis lines (SketchUp style: solid positive, dotted negative)
    this._createAxisLines();

    // SketchUp style: no tick marks or labels - keep it clean and simple
    // this._createTickMarks();
    // if (this._state.config.showLabels) {
    //   this._createLabels();
    // }
  }

  /**
   * Create SketchUp-style axis lines with solid positive and dotted negative directions
   * using screen-space rendering for constant pixel width
   */
  private _createAxisLines(): void {
    if (!this._scene) return;

    const { position } = this._state.config;
    // Ensure origin is a proper Vector3 object (in case it was deserialized from JSON)
    const origin = new Vector3(
      position.origin.x || 0,
      position.origin.y || 0,
      position.origin.z || 0
    );
    const length = position.axisLength;

    logger.info(
      `[INFO][AxisOverlayService] Creating SketchUp-style axis lines from origin (${origin.x},${origin.y},${origin.z}) with length ${length}`
    );

    // Convert diameter to pixel width (approximate conversion)
    // The diameter was in world units, we convert to a reasonable pixel width
    const pixelWidth = Math.max(1.0, 0.3 * 100);

    // Use the dedicated screen-space axis creator module
    const result = createScreenSpaceCoordinateAxes(this._scene, origin, length, pixelWidth);

    if (!result.success) {
      logger.error(
        `[ERROR][AxisOverlayService] Failed to create coordinate axes: ${result.error.message}`
      );
      return;
    }

    // Store the created meshes and materials
    this._axisLines.push(...result.data.meshes);
    this._materials.push(...result.data.materials);

    logger.info(
      `[INFO][AxisOverlayService] Created ${this._axisLines.length} SketchUp-style axis lines with pixel width: ${pixelWidth}`
    );
  }

  /**
   * Update visibility of all elements
   */
  private _updateElementsVisibility(visible: boolean): void {
    // Update axis lines visibility
    this._axisLines.forEach((line) => {
      line.setEnabled(visible);
    });

    // Update tick lines visibility
    this._tickLines.forEach((tick) => {
      tick.setEnabled(visible);
    });

    // Update label visibility
    this._labelBlocks.forEach((label) => {
      label.isVisible = visible;
    });
  }

  /**
   * Dispose all elements
   */
  private _disposeElements(): void {
    // Dispose axis lines
    this._axisLines.forEach((line) => line.dispose());
    this._axisLines = [];

    // Dispose tick lines
    this._tickLines.forEach((tick) => tick.dispose());
    this._tickLines = [];

    // Dispose labels
    this._labelBlocks.forEach((label) => {
      if (this._guiTexture) {
        this._guiTexture.removeControl(label);
      }
    });
    this._labelBlocks = [];

    // Dispose materials
    this._materials.forEach((material) => material.dispose());
    this._materials = [];
  }
}

/**
 * Factory function to create axis overlay service
 */
export function createAxisOverlayService(config?: Partial<AxisOverlayConfig>): AxisOverlayService {
  return new AxisOverlayService(config);
}
