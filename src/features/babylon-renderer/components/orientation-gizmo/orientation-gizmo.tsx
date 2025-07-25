/**
 * @file Orientation Gizmo React Component
 * @description Production-ready React component for 3D orientation gizmo with
 * Zustand store integration, BabylonJS camera controls, and canvas-based rendering.
 * Provides intuitive axis selection and smooth camera animation for 3D navigation.
 *
 * @architectural_decision
 * **Store-Connected Component**: Follows the established pattern of connecting
 * React components to Zustand store for centralized state management:
 * - **Selective Subscriptions**: Only subscribes to relevant gizmo state slices
 * - **Service Integration**: Uses OrientationGizmoService for core functionality
 * - **Lifecycle Management**: Proper initialization and cleanup of resources
 * - **Error Boundaries**: Comprehensive error handling with graceful degradation
 *
 * **Canvas Integration**: Uses HTML5 canvas for 2D overlay rendering over the
 * 3D scene, providing optimal performance and simple implementation compared
 * to WebGL-based approaches.
 *
 * @example Basic Usage
 * ```tsx
 * import { OrientationGizmo } from './orientation-gizmo';
 *
 * function Scene() {
 *   return (
 *     <div className="relative">
 *       <BabylonScene />
 *       <OrientationGizmo
 *         camera={arcRotateCamera}
 *         className="absolute top-4 right-4"
 *         onAxisSelected={(event) => console.log('Axis selected:', event.axis)}
 *       />
 *     </div>
 *   );
 * }
 * ```
 *
 * @example Advanced Configuration
 * ```tsx
 * <OrientationGizmo
 *   camera={camera}
 *   position={GizmoPosition.TOP_LEFT}
 *   config={{
 *     size: 120,
 *     colors: {
 *       x: ['#ff0000', '#cc0000'],
 *       y: ['#00ff00', '#00cc00'],
 *       z: ['#0000ff', '#0000cc'],
 *     },
 *     showSecondary: false,
 *   }}
 *   onAxisSelected={handleAxisSelection}
 *   onError={handleGizmoError}
 * />
 * ```
 *
 * @author OpenSCAD Babylon Team
 * @version 1.0.0
 * @since 2025-07-23
 */

import type { ArcRotateCamera } from '@babylonjs/core';
import { Vector3 } from '@babylonjs/core';
import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createLogger } from '../../../../shared/services/logger.service';
import { useAppStore } from '../../../store/app-store';
import {
  selectGizmoConfig,
  selectGizmoError,
  selectGizmoIsVisible,
  selectGizmoPosition,
  selectGizmoSelectedAxis,
} from '../../../store/selectors/store.selectors';
import { OrientationGizmoService } from '../../services/orientation-gizmo-service/orientation-gizmo.service';
import type {
  AxisDirection,
  GizmoConfig,
  GizmoError,
  GizmoInteractionEvent,
  GizmoPosition,
} from '../../types/orientation-gizmo.types';
import { GizmoErrorCode } from '../../types/orientation-gizmo.types';

const logger = createLogger('OrientationGizmo');

/**
 * Orientation Gizmo component properties interface
 */
export interface OrientationGizmoProps {
  readonly camera: ArcRotateCamera | null;
  readonly className?: string;
  readonly style?: React.CSSProperties;
  readonly position?: GizmoPosition;
  readonly config?: Partial<GizmoConfig>;
  readonly onAxisSelected?: (event: GizmoInteractionEvent) => void;
  readonly onAnimationStart?: (axis: AxisDirection) => void;
  readonly onAnimationComplete?: (axis: AxisDirection) => void;
  readonly onError?: (error: GizmoError) => void;
  readonly onConfigChange?: (config: GizmoConfig) => void;
}

/**
 * Orientation Gizmo React Component
 *
 * Provides interactive 3D orientation visualization with axis selection
 * and camera animation. Integrates with Zustand store for state management
 * and uses OrientationGizmoService for core functionality.
 */
export const OrientationGizmo: React.FC<OrientationGizmoProps> = ({
  camera,
  className = '',
  style,
  position,
  config: propConfig,
  onAxisSelected,
  onAnimationStart,
  onAnimationComplete,
  onError,
  onConfigChange,
}) => {
  // Canvas and service references
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const serviceRef = useRef<OrientationGizmoService | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Local state for component lifecycle
  const [isInitialized, setIsInitialized] = useState(false);
  const [localError, setLocalError] = useState<GizmoError | null>(null);

  // Store subscriptions
  const isVisible = useAppStore(selectGizmoIsVisible);
  const storePosition = useAppStore(selectGizmoPosition);
  const storeConfig = useAppStore(selectGizmoConfig);
  const storeError = useAppStore(selectGizmoError);
  const selectedAxis = useAppStore(selectGizmoSelectedAxis);

  // Store actions
  const {
    setGizmoError,
    setGizmoSelectedAxis,
    setGizmoAnimating,
    updateGizmoConfig,
    initializeGizmo,
  } = useAppStore();

  // Determine effective configuration
  const effectivePosition = position || storePosition;
  const effectiveConfig = propConfig ? { ...storeConfig, ...propConfig } : storeConfig;

  /**
   * Initialize the gizmo service
   */
  const initializeService = useCallback(async () => {
    if (!camera || !canvasRef.current) {
      logger.warn('[WARN][OrientationGizmo] Cannot initialize: missing camera or canvas');
      return;
    }

    try {
      logger.debug('[DEBUG][OrientationGizmo] Initializing gizmo service...');

      const service = new OrientationGizmoService();
      const result = await service.initialize({
        camera,
        canvas: canvasRef.current,
        config: effectiveConfig || undefined,
        position: effectivePosition,
      });

      if (!result.success && result.error) {
        const error = result.error;
        setLocalError(error);
        setGizmoError(error);
        onError?.(error);
        logger.error('[ERROR][OrientationGizmo] Initialization failed:', error.message);
        return;
      }

      serviceRef.current = service;
      setIsInitialized(true);
      setLocalError(null);
      setGizmoError(null);
      initializeGizmo();

      logger.debug('[DEBUG][OrientationGizmo] Gizmo service initialized successfully');
    } catch (error) {
      const gizmoError: GizmoError = {
        code: GizmoErrorCode.INITIALIZATION_FAILED,
        message: `Failed to initialize gizmo: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
        details: { originalError: error },
      };

      setLocalError(gizmoError);
      setGizmoError(gizmoError);
      onError?.(gizmoError);
      logger.error('[ERROR][OrientationGizmo] Initialization error:', gizmoError.message);
    }
  }, [camera, effectiveConfig, effectivePosition, setGizmoError, initializeGizmo, onError]);

  /**
   * Update gizmo rendering in animation loop
   */
  const updateGizmo = useCallback(() => {
    if (!serviceRef.current || !isInitialized) return;

    const result = serviceRef.current.update();
    if (!result.success && result.error) {
      const error = result.error;
      setLocalError(error);
      setGizmoError(error);
      onError?.(error);
      logger.error('[ERROR][OrientationGizmo] Update failed:', error.message);
      return;
    }

    // Update store with interaction state
    if (result.success && result.data.selectedAxis !== selectedAxis) {
      setGizmoSelectedAxis(result.data.selectedAxis);
    }

    // Continue animation loop
    animationFrameRef.current = requestAnimationFrame(updateGizmo);
  }, [isInitialized, selectedAxis, setGizmoError, setGizmoSelectedAxis, onError]);

  /**
   * Handle mouse move events
   */
  const handleMouseMove = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!serviceRef.current || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const mousePosition = new Vector3(event.clientX - rect.left, event.clientY - rect.top, 0);

    serviceRef.current.updateMousePosition(mousePosition);
  }, []);

  /**
   * Handle mouse leave events
   */
  const handleMouseLeave = useCallback(() => {
    if (!serviceRef.current) return;
    serviceRef.current.updateMousePosition(null);
    setGizmoSelectedAxis(null);
  }, [setGizmoSelectedAxis]);

  /**
   * Handle axis selection clicks
   */
  const handleClick = useCallback(
    async (_event: React.MouseEvent<HTMLCanvasElement>) => {
      if (!serviceRef.current || !selectedAxis) return;

      try {
        setGizmoAnimating(true);
        onAnimationStart?.(selectedAxis);

        const result = await serviceRef.current.selectAxis(selectedAxis);

        if (!result.success && result.error) {
          const error = result.error;
          setLocalError(error);
          setGizmoError(error);
          onError?.(error);
          logger.error('[ERROR][OrientationGizmo] Axis selection failed:', error.message);
          return;
        }

        if (result.success) {
          onAxisSelected?.(result.data);
        }
        onAnimationComplete?.(selectedAxis);

        // Animation will complete automatically, reset state after delay
        setTimeout(() => {
          setGizmoAnimating(false);
        }, effectiveConfig?.animation?.animationDuration || 500);

        logger.debug(`[DEBUG][OrientationGizmo] Axis selected: ${selectedAxis}`);
      } catch (error) {
        const gizmoError: GizmoError = {
          code: GizmoErrorCode.INTERACTION_FAILED,
          message: `Axis selection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          timestamp: new Date(),
          details: { axis: selectedAxis, originalError: error },
        };

        setLocalError(gizmoError);
        setGizmoError(gizmoError);
        onError?.(gizmoError);
        setGizmoAnimating(false);
        logger.error('[ERROR][OrientationGizmo] Click handler error:', gizmoError.message);
      }
    },
    [
      selectedAxis,
      effectiveConfig?.animation?.animationDuration,
      setGizmoAnimating,
      setGizmoError,
      onAxisSelected,
      onAnimationStart,
      onAnimationComplete,
      onError,
    ]
  );

  /**
   * Initialize gizmo when camera or canvas becomes available
   */
  useEffect(() => {
    if (camera && canvasRef.current && !isInitialized) {
      initializeService();
    }
  }, [camera, initializeService, isInitialized]);

  /**
   * Start animation loop when initialized
   */
  useEffect(() => {
    if (isInitialized && isVisible) {
      animationFrameRef.current = requestAnimationFrame(updateGizmo);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [isInitialized, isVisible, updateGizmo]);

  /**
   * Update configuration when props change
   */
  useEffect(() => {
    if (serviceRef.current && propConfig) {
      const result = serviceRef.current.updateConfig(propConfig);
      if (result.success) {
        updateGizmoConfig(propConfig);
        onConfigChange?.(result.data);
      }
    }
  }, [propConfig, updateGizmoConfig, onConfigChange]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (serviceRef.current) {
        serviceRef.current.dispose();
      }
    };
  }, []);

  // Don't render if not visible, no camera, or has critical error
  if (
    !isVisible ||
    !camera ||
    (localError && localError.code === 'INITIALIZATION_FAILED') ||
    (storeError && storeError.code === 'INITIALIZATION_FAILED')
  ) {
    return null;
  }

  const canvasSize = effectiveConfig?.size || 90;

  return (
    <div
      className={`gizmo-container ${className}`}
      style={{
        position: 'absolute',
        width: canvasSize,
        height: canvasSize,
        pointerEvents: 'auto',
        zIndex: 1000,
        ...style,
      }}
      data-testid="orientation-gizmo"
    >
      <canvas
        ref={canvasRef}
        width={canvasSize}
        height={canvasSize}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        style={{
          cursor: selectedAxis ? 'pointer' : 'default',
          borderRadius: '60px',
          backgroundColor: 'rgba(255, 255, 255, 0.15)',
        }}
        data-testid="gizmo-canvas"
        aria-label="3D Orientation Gizmo"
        role="button"
        tabIndex={0}
      />

      {/* Error indicator */}
      {((localError && localError.code !== 'INITIALIZATION_FAILED') ||
        (storeError && storeError.code !== 'INITIALIZATION_FAILED')) && (
        <div
          className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full"
          title={`Gizmo Error: ${(localError || storeError)?.message}`}
          data-testid="gizmo-error-indicator"
        />
      )}
    </div>
  );
};
