/**
 * @file useBabylonScene Hook
 *
 * React hook for managing BabylonJS scene lifecycle with automatic cleanup.
 * Integrates with the Scene Management Service for proper state management.
 *
 * @example
 * ```typescript
 * const { scene, isReady, initializeScene, dispose } = useBabylonScene();
 *
 * useEffect(() => {
 *   if (engine) {
 *     initializeScene(engine, { backgroundColor: new Color3(0.2, 0.2, 0.3) });
 *   }
 * }, [engine, initializeScene]);
 * ```
 */

import type { Engine, Mesh, Scene } from '@babylonjs/core';
import { Color3, Vector3 } from '@babylonjs/core';
import { useCallback, useRef, useState } from 'react';
import { createLogger } from '../../../../shared/services/logger.service';
import {
  type BabylonSceneService,
  type BabylonSceneState,
  createBabylonSceneService,
  type SceneInitOptions,
} from '../../services/babylon-scene-service';

const logger = createLogger('useBabylonScene');

/**
 * Scene initialization options for the hook
 */
export interface SceneHookInitOptions {
  readonly backgroundColor?: Color3;
  readonly enablePhysics?: boolean;
  readonly enableInspector?: boolean;
  readonly cameraPosition?: Vector3;
  readonly cameraTarget?: Vector3;
  readonly onSceneReady?: (scene: Scene) => void;
  readonly onRenderLoop?: () => void;
}

/**
 * Scene hook return type
 */
export interface UseBabylonSceneReturn {
  readonly scene: Scene | null;
  readonly isReady: boolean;
  readonly isDisposed: boolean;
  readonly initializeScene: (engine: Engine, options?: SceneHookInitOptions) => Promise<boolean>;
  readonly dispose: () => Promise<boolean>;
  readonly addMesh: (mesh: Mesh) => boolean;
  readonly removeMesh: (mesh: Mesh) => boolean;
  readonly clearMeshes: () => boolean;
  readonly getState: () => BabylonSceneState;
}

/**
 * useBabylonScene Hook
 *
 * Provides BabylonJS scene management with automatic cleanup and proper disposal.
 * Integrates with the Scene Management Service for reactive state management.
 *
 * Features:
 * - Automatic scene cleanup and disposal
 * - React 19 automatic optimization
 * - Result<T,E> error handling patterns
 * - Mesh management with proper disposal
 * - Camera and lighting configuration
 */
export function useBabylonScene(): UseBabylonSceneReturn {
  const sceneServiceRef = useRef<BabylonSceneService | null>(null);
  const [state, setState] = useState<BabylonSceneState>({
    scene: null,
    isInitialized: false,
    isDisposed: false,
    cameras: [],
    lights: [],
    meshes: [],
    lastUpdated: new Date(),
  });

  /**
   * Update hook state from service state
   */
  const updateStateFromService = useCallback(() => {
    if (sceneServiceRef.current) {
      const serviceState = sceneServiceRef.current.getState();
      setState(serviceState);
    } else {
      // Reset to default state if no service
      setState({
        scene: null,
        isInitialized: false,
        isDisposed: true,
        cameras: [],
        lights: [],
        meshes: [],
        lastUpdated: new Date(),
      });
    }
  }, []);

  /**
   * Initialize BabylonJS scene
   */
  const initializeScene = useCallback(
    async (engine: Engine, options: SceneHookInitOptions = {}): Promise<boolean> => {
      try {
        logger.init('[INIT][useBabylonScene] Initializing BabylonJS scene');

        // Create scene service if not exists
        if (!sceneServiceRef.current) {
          sceneServiceRef.current = createBabylonSceneService();
        }

        // Convert hook options to service options
        const sceneInitOptions: SceneInitOptions = {
          engine,
          config: {
            autoClear: false,
            autoClearDepthAndStencil: false,
            backgroundColor: options.backgroundColor ?? new Color3(0.2, 0.2, 0.3),
            environmentIntensity: 1.0,
            enablePhysics: options.enablePhysics ?? false,
            enableInspector: options.enableInspector ?? false,
            imageProcessingEnabled: true,
          },
          camera: {
            type: 'arcRotate',
            position: options.cameraPosition ?? new Vector3(0, 5, -10),
            target: options.cameraTarget ?? new Vector3(0, 0, 0),
            radius: 10,
            alpha: -Math.PI / 2,
            beta: Math.PI / 2.5,
            fov: Math.PI / 3,
            minZ: 0.1,
            maxZ: 1000,
          },
          lighting: {
            ambient: {
              enabled: true,
              color: new Color3(0.5, 0.5, 0.5),
              intensity: 0.7,
            },
            directional: {
              enabled: true,
              color: new Color3(1, 1, 1),
              intensity: 1.0,
              direction: new Vector3(-1, -1, -1),
            },
          },
          ...(options.onSceneReady && { onSceneReady: options.onSceneReady }),
          ...(options.onRenderLoop && { onRenderLoop: options.onRenderLoop }),
        };

        // Initialize scene
        const result = sceneServiceRef.current.init(sceneInitOptions);

        if (!result.success) {
          logger.error('[ERROR][useBabylonScene] Scene initialization failed:', result.error);
          updateStateFromService();
          return false;
        }

        updateStateFromService();
        logger.debug('[DEBUG][useBabylonScene] Scene initialized successfully');
        return true;
      } catch (error) {
        logger.error('[ERROR][useBabylonScene] Scene initialization failed:', error);
        updateStateFromService();
        return false;
      }
    },
    [updateStateFromService]
  );

  /**
   * Dispose BabylonJS scene
   */
  const dispose = useCallback(async (): Promise<boolean> => {
    try {
      logger.debug('[DEBUG][useBabylonScene] Disposing BabylonJS scene');

      if (sceneServiceRef.current) {
        const result = sceneServiceRef.current.dispose();

        if (!result.success) {
          logger.error('[ERROR][useBabylonScene] Scene disposal failed:', result.error);
          return false;
        }

        sceneServiceRef.current = null;
      }

      updateStateFromService();
      logger.end('[END][useBabylonScene] Scene disposed successfully');
      return true;
    } catch (error) {
      logger.error('[ERROR][useBabylonScene] Scene disposal failed:', error);
      return false;
    }
  }, [updateStateFromService]);

  /**
   * Add mesh to scene
   */
  const addMesh = useCallback(
    (mesh: Mesh): boolean => {
      try {
        if (!sceneServiceRef.current) {
          logger.warn('[WARN][useBabylonScene] Scene service not initialized');
          return false;
        }

        const result = sceneServiceRef.current.addMesh(mesh);
        updateStateFromService();
        return result.success;
      } catch (error) {
        logger.error('[ERROR][useBabylonScene] Add mesh failed:', error);
        return false;
      }
    },
    [updateStateFromService]
  );

  /**
   * Remove mesh from scene
   */
  const removeMesh = useCallback(
    (mesh: Mesh): boolean => {
      try {
        if (!sceneServiceRef.current) {
          logger.warn('[WARN][useBabylonScene] Scene service not initialized');
          return false;
        }

        const result = sceneServiceRef.current.removeMesh(mesh);
        updateStateFromService();
        return result.success;
      } catch (error) {
        logger.error('[ERROR][useBabylonScene] Remove mesh failed:', error);
        return false;
      }
    },
    [updateStateFromService]
  );

  /**
   * Clear all meshes from scene
   */
  const clearMeshes = useCallback((): boolean => {
    try {
      if (!sceneServiceRef.current) {
        logger.warn('[WARN][useBabylonScene] Scene service not initialized');
        return false;
      }

      const result = sceneServiceRef.current.clearMeshes();
      updateStateFromService();
      return result.success;
    } catch (error) {
      logger.error('[ERROR][useBabylonScene] Clear meshes failed:', error);
      return false;
    }
  }, [updateStateFromService]);

  /**
   * Get current scene state
   */
  const getState = useCallback((): BabylonSceneState => {
    if (sceneServiceRef.current) {
      return sceneServiceRef.current.getState();
    }
    return state;
  }, [state]);

  return {
    scene: state.scene,
    isReady: state.isInitialized,
    isDisposed: state.isDisposed,
    initializeScene,
    dispose,
    addMesh,
    removeMesh,
    clearMeshes,
    getState,
  };
}
