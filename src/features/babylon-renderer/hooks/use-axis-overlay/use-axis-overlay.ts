/**
 * @file use-axis-overlay.ts
 * @description React hook for managing BabylonJS axis overlay with scale ticks and labels.
 * Integrates with Zustand store for state management and provides automatic cleanup.
 *
 * @example Basic Usage
 * ```typescript
 * const {
 *   service,
 *   isInitialized,
 *   isVisible,
 *   initialize,
 *   setVisibility
 * } = useAxisOverlay();
 *
 * useEffect(() => {
 *   if (scene && camera) {
 *     initialize(scene, camera);
 *   }
 * }, [scene, camera, initialize]);
 * ```
 */

import type { Camera, Scene } from '@babylonjs/core';
import { useCallback, useEffect, useRef } from 'react';
import { createLogger } from '../../../../shared/services/logger.service';
import type { Result } from '../../../../shared/types/result.types';
import { useAppStore } from '../../../store/app-store';
import { createAxisOverlayService } from '../../services/axis-overlay-service';
import type {
  AxisOverlayConfig,
  AxisOverlayError,
  IAxisOverlayService,
} from '../../types/axis-overlay.types';
import { DEFAULT_AXIS_OVERLAY_CONFIG } from '../../types/axis-overlay.types';

const logger = createLogger('useAxisOverlay');

/**
 * Hook return type for axis overlay management
 */
export interface UseAxisOverlayReturn {
  readonly service: IAxisOverlayService | null;
  readonly isInitialized: boolean;
  readonly isVisible: boolean;
  readonly config: AxisOverlayConfig;
  readonly error: AxisOverlayError | null;
  readonly initialize: (scene: Scene, camera: Camera) => Promise<Result<void, AxisOverlayError>>;
  readonly setVisibility: (visible: boolean) => Result<void, AxisOverlayError>;
  readonly updateConfig: (config: Partial<AxisOverlayConfig>) => Result<void, AxisOverlayError>;
  readonly updateDynamicTicks: (cameraDistance: number) => Result<void, AxisOverlayError>;
  readonly dispose: () => Result<void, AxisOverlayError>;
}

/**
 * useAxisOverlay Hook
 *
 * Provides BabylonJS axis overlay management with automatic cleanup and proper disposal.
 * Integrates with Zustand store for reactive state management and follows the established
 * patterns for BabylonJS service integration.
 *
 * Features:
 * - Automatic service cleanup and disposal
 * - React 19 automatic optimization
 * - Result<T,E> error handling patterns
 * - Zustand store integration
 * - Dynamic tick interval updates based on camera distance
 */
export function useAxisOverlay(): UseAxisOverlayReturn {
  const serviceRef = useRef<IAxisOverlayService | null>(null);

  // Zustand store selectors with defensive check
  const axisOverlayState = useAppStore((state) => state.babylonRendering?.axisOverlay);
  const lastRendered = useAppStore((state) => state.babylonRendering?.lastRendered);

  const setAxisOverlayVisibility = useAppStore((state) => state.setAxisOverlayVisibility);
  const updateAxisOverlayConfig = useAppStore((state) => state.updateAxisOverlayConfig);
  const updateAxisOverlayDynamicTicks = useAppStore((state) => state.updateAxisOverlayDynamicTicks);
  const setAxisOverlayError = useAppStore((state) => state.setAxisOverlayError);
  const initializeAxisOverlay = useAppStore((state) => state.initializeAxisOverlay);
  const resetAxisOverlay = useAppStore((state) => state.resetAxisOverlay);

  // Track scene and camera for recreation after AST rendering
  const sceneRef = useRef<Scene | null>(null);
  const cameraRef = useRef<Camera | null>(null);

  /**
   * Initialize axis overlay service
   */
  const initialize = useCallback(
    async (scene: Scene, camera: Camera): Promise<Result<void, AxisOverlayError>> => {
      try {
        logger.init('[INIT][useAxisOverlay] Initializing axis overlay service');

        // Check if axis overlay state is available
        if (!axisOverlayState) {
          const error: AxisOverlayError = {
            type: 'INITIALIZATION_FAILED',
            message: 'Axis overlay state not available in store',
            timestamp: new Date(),
          };
          setAxisOverlayError(error);
          return { success: false, error };
        }

        // Create service if not exists
        if (!serviceRef.current) {
          serviceRef.current = createAxisOverlayService(axisOverlayState.config);
        }

        // Store scene and camera references for recreation after AST rendering
        sceneRef.current = scene;
        cameraRef.current = camera;

        // Initialize the service
        const result = await serviceRef.current.initialize(scene, camera);

        if (!result.success) {
          resetAxisOverlay(); // Reset initialization state on failure
          setAxisOverlayError(result.error);
          logger.error(
            '[ERROR][useAxisOverlay] Service initialization failed:',
            result.error.message
          );
          return result;
        }

        // Update store state
        initializeAxisOverlay();
        setAxisOverlayVisibility(axisOverlayState.config.isVisible);

        logger.debug('[DEBUG][useAxisOverlay] Axis overlay service initialized successfully');
        return { success: true, data: undefined };
      } catch (error) {
        const axisError: AxisOverlayError = {
          type: 'INITIALIZATION_FAILED',
          message: `Hook initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          details: error,
          timestamp: new Date(),
        };

        setAxisOverlayError(axisError);
        logger.error('[ERROR][useAxisOverlay] Hook initialization failed:', axisError.message);

        return { success: false, error: axisError };
      }
    },
    [
      axisOverlayState?.config,
      setAxisOverlayError,
      initializeAxisOverlay,
      setAxisOverlayVisibility,
      resetAxisOverlay,
      axisOverlayState,
    ]
  );

  /**
   * Set axis overlay visibility
   */
  const setVisibility = useCallback(
    (visible: boolean): Result<void, AxisOverlayError> => {
      try {
        if (!serviceRef.current) {
          const error: AxisOverlayError = {
            type: 'INITIALIZATION_FAILED',
            message: 'Service not initialized',
            timestamp: new Date(),
          };
          return { success: false, error };
        }

        const result = serviceRef.current.setVisibility(visible);

        if (result.success) {
          setAxisOverlayVisibility(visible);
          logger.debug(`[DEBUG][useAxisOverlay] Visibility set to: ${visible}`);
        } else {
          setAxisOverlayError(result.error);
        }

        return result;
      } catch (error) {
        const axisError: AxisOverlayError = {
          type: 'RENDER_FAILED',
          message: `Visibility update failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          details: error,
          timestamp: new Date(),
        };

        setAxisOverlayError(axisError);
        return { success: false, error: axisError };
      }
    },
    [setAxisOverlayVisibility, setAxisOverlayError]
  );

  /**
   * Update axis overlay configuration
   */
  const updateConfig = useCallback(
    (config: Partial<AxisOverlayConfig>): Result<void, AxisOverlayError> => {
      try {
        if (!serviceRef.current) {
          const error: AxisOverlayError = {
            type: 'INITIALIZATION_FAILED',
            message: 'Service not initialized',
            timestamp: new Date(),
          };
          return { success: false, error };
        }

        const result = serviceRef.current.updateConfig(config);

        if (result.success) {
          updateAxisOverlayConfig(config);
          logger.debug('[DEBUG][useAxisOverlay] Configuration updated');
        } else {
          setAxisOverlayError(result.error);
        }

        return result;
      } catch (error) {
        const axisError: AxisOverlayError = {
          type: 'CONFIG_INVALID',
          message: `Config update failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          details: error,
          timestamp: new Date(),
        };

        setAxisOverlayError(axisError);
        return { success: false, error: axisError };
      }
    },
    [updateAxisOverlayConfig, setAxisOverlayError]
  );

  /**
   * Update dynamic tick interval based on camera distance
   */
  const updateDynamicTicks = useCallback(
    (cameraDistance: number): Result<void, AxisOverlayError> => {
      try {
        if (!serviceRef.current) {
          const error: AxisOverlayError = {
            type: 'INITIALIZATION_FAILED',
            message: 'Service not initialized',
            timestamp: new Date(),
          };
          return { success: false, error };
        }

        const result = serviceRef.current.updateDynamicTicks(cameraDistance);

        if (result.success) {
          updateAxisOverlayDynamicTicks(cameraDistance);
        } else {
          setAxisOverlayError(result.error);
        }

        return result;
      } catch (error) {
        const axisError: AxisOverlayError = {
          type: 'RENDER_FAILED',
          message: `Dynamic tick update failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          details: error,
          timestamp: new Date(),
        };

        setAxisOverlayError(axisError);
        return { success: false, error: axisError };
      }
    },
    [updateAxisOverlayDynamicTicks, setAxisOverlayError]
  );

  /**
   * Dispose axis overlay service
   */
  const dispose = useCallback((): Result<void, AxisOverlayError> => {
    try {
      logger.debug('[DEBUG][useAxisOverlay] Disposing axis overlay service');

      if (serviceRef.current) {
        const result = serviceRef.current.dispose();
        serviceRef.current = null;

        if (!result.success) {
          setAxisOverlayError(result.error);
          return result;
        }
      }

      // Reset store state
      resetAxisOverlay();

      logger.debug('[DEBUG][useAxisOverlay] Axis overlay service disposed');
      return { success: true, data: undefined };
    } catch (error) {
      const axisError: AxisOverlayError = {
        type: 'RENDER_FAILED',
        message: `Disposal failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: error,
        timestamp: new Date(),
      };

      setAxisOverlayError(axisError);
      return { success: false, error: axisError };
    }
  }, [resetAxisOverlay, setAxisOverlayError]);

  /**
   * Recreate axes after AST rendering completes
   *
   * @description This fixes the issue where AST rendering clears all meshes including axis overlays.
   * The useEffect is triggered only when AST rendering completes (lastRendered changes).
   *
   * @performance Removed axisOverlayState.config dependency to prevent infinite recreation loop.
   * Previously, config changes would trigger axis recreation, which would update config,
   * causing an infinite loop that froze the browser.
   *
   * @see Issue: Infinite loop caused browser freezing with thousands of axis lines created
   */
  useEffect(() => {
    const recreateAxes = async () => {
      // Only recreate if we have stored scene/camera references and service is initialized
      if (!lastRendered || !sceneRef.current || !cameraRef.current || !serviceRef.current) {
        return;
      }

      logger.debug('[DEBUG][useAxisOverlay] AST rendering completed, recreating axes...');

      try {
        // Recreate the axes after AST rendering cleared them
        // Note: Not updating config here to prevent infinite loop
        const result = await serviceRef.current.initialize(sceneRef.current, cameraRef.current);

        if (!result.success) {
          logger.error('[ERROR][useAxisOverlay] Axis recreation failed:', result.error.message);
          setAxisOverlayError(result.error);
        } else {
          logger.debug('[DEBUG][useAxisOverlay] Axes recreated successfully after AST rendering');
        }
      } catch (error) {
        logger.error('[ERROR][useAxisOverlay] Axis recreation error:', error);
      }
    };

    recreateAxes();
  }, [lastRendered, setAxisOverlayError]); // Removed axisOverlayState.config to prevent infinite loop

  /**
   * Cleanup on unmount
   *
   * @description Performs direct cleanup without depending on the dispose callback to prevent
   * infinite loops. The cleanup useEffect should only run on component unmount.
   *
   * @performance Empty dependency array prevents infinite recreation loops that occurred
   * when dispose function was included in dependencies (dispose was recreated on every render).
   *
   * @pattern Direct cleanup pattern - calls service methods directly instead of through
   * memoized callbacks to avoid dependency chain issues.
   */
  useEffect(() => {
    return () => {
      // Direct cleanup without depending on the dispose callback
      try {
        logger.debug(
          '[DEBUG][useAxisOverlay] Component unmounting, disposing axis overlay service'
        );

        if (serviceRef.current) {
          serviceRef.current.dispose();
          serviceRef.current = null;
        }

        // Reset store state
        resetAxisOverlay();
      } catch (error) {
        logger.error('[ERROR][useAxisOverlay] Cleanup error:', error);
      }
    };
  }, []); // Empty dependency array - only run on unmount

  return {
    service: serviceRef.current,
    isInitialized: axisOverlayState?.isInitialized ?? false,
    isVisible: axisOverlayState?.isVisible ?? false,
    config: axisOverlayState?.config ?? DEFAULT_AXIS_OVERLAY_CONFIG,
    error: axisOverlayState?.error ?? null,
    initialize,
    setVisibility,
    updateConfig,
    updateDynamicTicks,
    dispose,
  };
}
