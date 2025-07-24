/**
 * @file transformation-gizmo.tsx
 * @description React component for BabylonJS transformation gizmos providing position,
 * rotation, and scale manipulation capabilities. Integrates with scene lifecycle and
 * provides observable transformation events for store connectivity.
 *
 * @example Basic Usage
 * ```typescript
 * <TransformationGizmo
 *   scene={babylonScene}
 *   selectedMesh={selectedMesh}
 *   mode="position"
 *   onTransformationComplete={(event) => {
 *     console.log('Mesh transformed:', event);
 *   }}
 * />
 * ```
 *
 * @author OpenSCAD Babylon Team
 * @version 1.0.0
 * @since 2025-07-23
 */

import type { AbstractMesh, Scene } from '@babylonjs/core';
import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createLogger } from '../../../../shared/services/logger.service';
import type {
  GizmoMode,
  TransformationEvent,
  TransformationGizmoConfig,
  TransformationGizmoError,
} from '../../services/transformation-gizmo-service';
import { TransformationGizmoService } from '../../services/transformation-gizmo-service';

const logger = createLogger('TransformationGizmo');

/**
 * Transformation gizmo component props
 */
export interface TransformationGizmoProps {
  /** BabylonJS scene instance */
  readonly scene: Scene | null;
  /** Currently selected mesh to attach gizmo to */
  readonly selectedMesh: AbstractMesh | null;
  /** Current gizmo mode (position, rotation, scale) */
  readonly mode: GizmoMode;
  /** Optional gizmo configuration */
  readonly config?: Partial<TransformationGizmoConfig>;
  /** Callback fired when transformation is completed */
  readonly onTransformationComplete?: (event: TransformationEvent) => void;
  /** Callback fired when gizmo encounters an error */
  readonly onError?: (error: TransformationGizmoError) => void;
  /** Optional CSS class name */
  readonly className?: string;
}

/**
 * TransformationGizmo React component
 *
 * Provides BabylonJS transformation gizmos (position, rotation, scale) with React
 * lifecycle integration. Automatically manages gizmo service initialization,
 * mesh attachment, and mode switching based on props.
 */
export function TransformationGizmo({
  scene,
  selectedMesh,
  mode,
  config,
  onTransformationComplete,
  onError,
  className,
}: TransformationGizmoProps): React.JSX.Element | null {
  const serviceRef = useRef<TransformationGizmoService | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [localError, setLocalError] = useState<TransformationGizmoError | null>(null);

  /**
   * Handle transformation events from the gizmo service
   */
  const handleTransformationEvent = useCallback(
    (event: TransformationEvent) => {
      logger.debug(
        `[DEBUG][TransformationGizmo] Transformation event: ${event.mode} on mesh ${event.mesh.name}`
      );
      onTransformationComplete?.(event);
    },
    [onTransformationComplete]
  );

  /**
   * Handle errors and notify parent component
   */
  const handleError = useCallback(
    (error: TransformationGizmoError) => {
      logger.error(`[ERROR][TransformationGizmo] ${error.message}`);
      setLocalError(error);
      onError?.(error);
    },
    [onError]
  );

  /**
   * Initialize transformation gizmo service when scene becomes available
   */
  useEffect(() => {
    if (!scene) {
      setIsInitialized(false);
      return;
    }

    const initializeService = async () => {
      try {
        logger.init('[INIT][TransformationGizmo] Initializing transformation gizmo service');

        // Create service instance
        const service = new TransformationGizmoService(config);
        serviceRef.current = service;

        // Initialize with scene
        const initResult = await service.initialize(scene);
        if (!initResult.success) {
          handleError(initResult.error);
          return;
        }

        // Setup transformation event listener
        service.onTransformationObservable.add(handleTransformationEvent);

        setIsInitialized(true);
        setLocalError(null);
        logger.debug('[DEBUG][TransformationGizmo] Service initialized successfully');
      } catch (error) {
        const gizmoError: TransformationGizmoError = {
          code: 'INIT_FAILED',
          message: `Failed to initialize transformation gizmo: ${error instanceof Error ? error.message : 'Unknown error'}`,
          timestamp: new Date(),
          details: { originalError: error },
        };
        handleError(gizmoError);
      }
    };

    initializeService();

    // Cleanup on unmount or scene change
    return () => {
      if (serviceRef.current) {
        logger.debug('[DEBUG][TransformationGizmo] Disposing transformation gizmo service');
        serviceRef.current.dispose();
        serviceRef.current = null;
      }
      setIsInitialized(false);
    };
  }, [scene, config, handleTransformationEvent, handleError]);

  /**
   * Attach/detach gizmo when selected mesh changes
   */
  useEffect(() => {
    if (!serviceRef.current || !isInitialized) return;

    if (selectedMesh) {
      logger.debug(`[DEBUG][TransformationGizmo] Attaching gizmo to mesh: ${selectedMesh.name}`);
      const attachResult = serviceRef.current.attachToMesh(selectedMesh);

      if (!attachResult.success) {
        handleError(attachResult.error);
        return;
      }
    } else {
      logger.debug('[DEBUG][TransformationGizmo] Detaching gizmo from mesh');
      const detachResult = serviceRef.current.detach();

      if (!detachResult.success) {
        handleError(detachResult.error);
        return;
      }
    }

    setLocalError(null);
  }, [selectedMesh, isInitialized, handleError]);

  /**
   * Update gizmo mode when mode prop changes
   */
  useEffect(() => {
    if (!serviceRef.current || !isInitialized) return;

    logger.debug(`[DEBUG][TransformationGizmo] Setting gizmo mode to: ${mode}`);
    const modeResult = serviceRef.current.setMode(mode);

    if (!modeResult.success) {
      handleError(modeResult.error);
      return;
    }

    setLocalError(null);
  }, [mode, isInitialized, handleError]);

  /**
   * Log current state for debugging
   */
  useEffect(() => {
    logger.debug(
      `[DEBUG][TransformationGizmo] State - Scene: ${scene ? 'available' : 'null'}, ` +
        `Mesh: ${selectedMesh?.name || 'none'}, Mode: ${mode}, Initialized: ${isInitialized}`
    );
  }, [scene, selectedMesh, mode, isInitialized]);

  // Component renders nothing - gizmos are rendered directly in the 3D scene
  return null;
}

/**
 * Default props for TransformationGizmo component
 */
TransformationGizmo.defaultProps = {
  mode: 'position' as GizmoMode,
  config: undefined,
  onTransformationComplete: undefined,
  onError: undefined,
  className: undefined,
} as const;
