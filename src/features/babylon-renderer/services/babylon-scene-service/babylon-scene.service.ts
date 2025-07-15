/**
 * @file BabylonJS Scene Management Service
 *
 * Service for managing BabylonJS scene lifecycle with reactive state management.
 * Implements React 19 concurrent features and proper WebGL state management.
 *
 * @example
 * ```typescript
 * const sceneService = createBabylonSceneService();
 * const result = await sceneService.init({ engine, config });
 * if (result.success) {
 *   console.log('Scene initialized:', result.data);
 * }
 * ```
 */

import type { Camera, Engine, Light, Mesh, Scene } from '@babylonjs/core';
import {
  ArcRotateCamera,
  Scene as BabylonScene,
  Color3,
  Color4,
  DirectionalLight,
  HemisphericLight,
  Vector3,
} from '@babylonjs/core';
import { createLogger } from '../../../../shared/services/logger.service';
import type { Result } from '../../../../shared/types/result.types';

const logger = createLogger('BabylonSceneService');

/**
 * Scene configuration options
 */
export interface BabylonSceneConfig {
  readonly autoClear: boolean;
  readonly autoClearDepthAndStencil: boolean;
  readonly backgroundColor: Color3;
  readonly environmentIntensity: number;
  readonly enablePhysics: boolean;
  readonly enableInspector: boolean;
  readonly imageProcessingEnabled: boolean;
}

/**
 * Camera configuration
 */
export interface SceneCameraConfig {
  readonly type: 'arcRotate' | 'free' | 'universal';
  readonly position: Vector3;
  readonly target: Vector3;
  readonly radius?: number;
  readonly alpha?: number;
  readonly beta?: number;
  readonly fov?: number;
  readonly minZ?: number;
  readonly maxZ?: number;
}

/**
 * Lighting configuration
 */
export interface SceneLightingConfig {
  readonly ambient: {
    readonly enabled: boolean;
    readonly color: Color3;
    readonly intensity: number;
  };
  readonly directional: {
    readonly enabled: boolean;
    readonly color: Color3;
    readonly intensity: number;
    readonly direction: Vector3;
  };
}

/**
 * Scene initialization options
 */
export interface SceneInitOptions {
  readonly engine: Engine;
  readonly config?: Partial<BabylonSceneConfig>;
  readonly camera?: Partial<SceneCameraConfig>;
  readonly lighting?: Partial<SceneLightingConfig>;
  readonly onSceneReady?: (scene: Scene) => void;
  readonly onRenderLoop?: () => void;
}

/**
 * Scene state for reactive management
 */
export interface BabylonSceneState {
  readonly scene: Scene | null;
  readonly isInitialized: boolean;
  readonly isDisposed: boolean;
  readonly cameras: ReadonlyArray<Camera>;
  readonly lights: ReadonlyArray<Light>;
  readonly meshes: ReadonlyArray<Mesh>;
  readonly lastUpdated: Date;
}

/**
 * Scene error types
 */
export interface SceneError {
  readonly code: SceneErrorCode;
  readonly message: string;
  readonly details?: unknown;
  readonly timestamp: Date;
}

export enum SceneErrorCode {
  INITIALIZATION_FAILED = 'INITIALIZATION_FAILED',
  ENGINE_NOT_PROVIDED = 'ENGINE_NOT_PROVIDED',
  SCENE_CREATION_FAILED = 'SCENE_CREATION_FAILED',
  CAMERA_SETUP_FAILED = 'CAMERA_SETUP_FAILED',
  LIGHTING_SETUP_FAILED = 'LIGHTING_SETUP_FAILED',
  DISPOSAL_FAILED = 'DISPOSAL_FAILED',
  UPDATE_FAILED = 'UPDATE_FAILED',
}

/**
 * Scene operation results
 */
export type SceneInitResult = Result<BabylonSceneState, SceneError>;
export type SceneUpdateResult = Result<void, SceneError>;
export type SceneDisposeResult = Result<void, SceneError>;

/**
 * Default scene configuration
 */
const DEFAULT_SCENE_CONFIG: BabylonSceneConfig = {
  autoClear: false,
  autoClearDepthAndStencil: false,
  backgroundColor: new Color3(0.2, 0.2, 0.3),
  environmentIntensity: 1.0,
  enablePhysics: false,
  enableInspector: false,
  imageProcessingEnabled: true,
} as const;

/**
 * Default camera configuration
 */
const DEFAULT_CAMERA_CONFIG: SceneCameraConfig = {
  type: 'arcRotate',
  position: new Vector3(0, 5, -10),
  target: new Vector3(0, 0, 0),
  radius: 10,
  alpha: -Math.PI / 2,
  beta: Math.PI / 2.5,
  fov: Math.PI / 3,
  minZ: 0.1,
  maxZ: 1000,
} as const;

/**
 * Default lighting configuration
 */
const DEFAULT_LIGHTING_CONFIG: SceneLightingConfig = {
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
} as const;

/**
 * BabylonJS Scene Management Service
 *
 * Provides reactive scene lifecycle management with proper cleanup and disposal.
 * Integrates with React 19 concurrent features for smooth user experience.
 */
export interface BabylonSceneService {
  /**
   * Initialize scene with engine and configuration
   */
  init(options: SceneInitOptions): SceneInitResult;

  /**
   * Get current scene state
   */
  getState(): BabylonSceneState;

  /**
   * Update scene configuration
   */
  updateConfig(config: Partial<BabylonSceneConfig>): SceneUpdateResult;

  /**
   * Add mesh to scene
   */
  addMesh(mesh: Mesh): SceneUpdateResult;

  /**
   * Remove mesh from scene
   */
  removeMesh(mesh: Mesh): SceneUpdateResult;

  /**
   * Clear all meshes from scene
   */
  clearMeshes(): SceneUpdateResult;

  /**
   * Dispose scene and cleanup resources
   */
  dispose(): SceneDisposeResult;
}

/**
 * Create BabylonJS Scene Management Service
 *
 * Factory function that creates a new scene service instance with proper state management.
 */
export function createBabylonSceneService(): BabylonSceneService {
  let state: BabylonSceneState = {
    scene: null,
    isInitialized: false,
    isDisposed: false,
    cameras: [],
    lights: [],
    meshes: [],
    lastUpdated: new Date(),
  };

  /**
   * Update internal state
   */
  const updateState = (updates: Partial<BabylonSceneState>): void => {
    state = Object.freeze({
      ...state,
      ...updates,
      lastUpdated: new Date(),
    });
  };

  /**
   * Create error result
   */
  const createError = (code: SceneErrorCode, message: string, details?: unknown): SceneError => ({
    code,
    message,
    details,
    timestamp: new Date(),
  });

  /**
   * Setup camera in scene
   */
  const setupCamera = (scene: Scene, config: SceneCameraConfig): Result<Camera, SceneError> => {
    try {
      logger.debug('[DEBUG][BabylonSceneService] Setting up camera');

      const camera = new ArcRotateCamera(
        'camera',
        config.alpha ?? DEFAULT_CAMERA_CONFIG.alpha ?? -Math.PI / 2,
        config.beta ?? DEFAULT_CAMERA_CONFIG.beta ?? Math.PI / 2.5,
        config.radius ?? DEFAULT_CAMERA_CONFIG.radius ?? 10,
        config.target,
        scene
      );

      camera.position = config.position;
      camera.fov = config.fov ?? DEFAULT_CAMERA_CONFIG.fov ?? Math.PI / 3;
      camera.minZ = config.minZ ?? DEFAULT_CAMERA_CONFIG.minZ ?? 0.1;
      camera.maxZ = config.maxZ ?? DEFAULT_CAMERA_CONFIG.maxZ ?? 1000;

      // Only attach controls if canvas is available (not in NullEngine tests)
      const canvas = scene.getEngine().getRenderingCanvas();
      if (canvas && camera.attachControl) {
        camera.attachControl(true);
      }

      return { success: true, data: camera };
    } catch (error) {
      logger.error('[ERROR][BabylonSceneService] Camera setup failed:', error);
      return {
        success: false,
        error: createError(SceneErrorCode.CAMERA_SETUP_FAILED, 'Failed to setup camera', error),
      };
    }
  };

  /**
   * Setup lighting in scene
   */
  const setupLighting = (
    scene: Scene,
    config: SceneLightingConfig
  ): Result<Light[], SceneError> => {
    try {
      logger.debug('[DEBUG][BabylonSceneService] Setting up lighting');

      const lights: Light[] = [];

      // Ambient light
      if (config.ambient.enabled) {
        const ambientLight = new HemisphericLight('ambientLight', Vector3.Up(), scene);
        ambientLight.diffuse = config.ambient.color;
        ambientLight.intensity = config.ambient.intensity;
        lights.push(ambientLight);
      }

      // Directional light
      if (config.directional.enabled) {
        const directionalLight = new DirectionalLight(
          'directionalLight',
          config.directional.direction,
          scene
        );
        directionalLight.diffuse = config.directional.color;
        directionalLight.intensity = config.directional.intensity;
        lights.push(directionalLight);
      }

      return { success: true, data: lights };
    } catch (error) {
      logger.error('[ERROR][BabylonSceneService] Lighting setup failed:', error);
      return {
        success: false,
        error: createError(SceneErrorCode.LIGHTING_SETUP_FAILED, 'Failed to setup lighting', error),
      };
    }
  };

  const service = {
    init(options: SceneInitOptions): SceneInitResult {
      try {
        logger.init('[INIT][BabylonSceneService] Initializing scene');

        if (!options.engine) {
          return {
            success: false,
            error: createError(
              SceneErrorCode.ENGINE_NOT_PROVIDED,
              'Engine is required for scene initialization'
            ),
          };
        }

        // Merge configurations with defaults
        const config = { ...DEFAULT_SCENE_CONFIG, ...options.config };
        const cameraConfig = { ...DEFAULT_CAMERA_CONFIG, ...options.camera };
        const lightingConfig = { ...DEFAULT_LIGHTING_CONFIG, ...options.lighting };

        // Create scene
        const scene = new BabylonScene(options.engine);

        // Configure scene
        scene.autoClear = config.autoClear;
        scene.autoClearDepthAndStencil = config.autoClearDepthAndStencil;
        scene.clearColor = new Color4(
          config.backgroundColor.r,
          config.backgroundColor.g,
          config.backgroundColor.b,
          1
        );

        // Setup camera
        const cameraResult = setupCamera(scene, cameraConfig);
        if (!cameraResult.success) {
          scene.dispose();
          return { success: false, error: cameraResult.error };
        }

        // Setup lighting
        const lightingResult = setupLighting(scene, lightingConfig);
        if (!lightingResult.success) {
          scene.dispose();
          return { success: false, error: lightingResult.error };
        }

        // Setup render loop
        if (options.onRenderLoop) {
          scene.registerBeforeRender(options.onRenderLoop);
        }

        // Update state
        updateState({
          scene,
          isInitialized: true,
          isDisposed: false,
          cameras: [cameraResult.data],
          lights: lightingResult.data,
          meshes: [],
        });

        // Call ready callback
        options.onSceneReady?.(scene);

        logger.debug('[DEBUG][BabylonSceneService] Scene initialized successfully');

        return { success: true, data: state };
      } catch (error) {
        logger.error('[ERROR][BabylonSceneService] Scene initialization failed:', error);
        return {
          success: false,
          error: createError(
            SceneErrorCode.INITIALIZATION_FAILED,
            'Failed to initialize scene',
            error
          ),
        };
      }
    },

    getState(): BabylonSceneState {
      return state;
    },

    updateConfig(config: Partial<BabylonSceneConfig>): SceneUpdateResult {
      try {
        if (!state.scene || !state.isInitialized) {
          return {
            success: false,
            error: createError(SceneErrorCode.UPDATE_FAILED, 'Scene not initialized'),
          };
        }

        // Update scene configuration
        if (config.backgroundColor) {
          state.scene.clearColor = new Color4(
            config.backgroundColor.r,
            config.backgroundColor.g,
            config.backgroundColor.b,
            1
          );
        }

        if (config.autoClear !== undefined) {
          state.scene.autoClear = config.autoClear;
        }

        if (config.autoClearDepthAndStencil !== undefined) {
          state.scene.autoClearDepthAndStencil = config.autoClearDepthAndStencil;
        }

        updateState({});

        return { success: true, data: undefined };
      } catch (error) {
        logger.error('[ERROR][BabylonSceneService] Config update failed:', error);
        return {
          success: false,
          error: createError(
            SceneErrorCode.UPDATE_FAILED,
            'Failed to update scene configuration',
            error
          ),
        };
      }
    },

    addMesh(mesh: Mesh): SceneUpdateResult {
      try {
        if (!state.scene || !state.isInitialized) {
          return {
            success: false,
            error: createError(SceneErrorCode.UPDATE_FAILED, 'Scene not initialized'),
          };
        }

        updateState({
          meshes: [...state.meshes, mesh],
        });

        return { success: true, data: undefined };
      } catch (error) {
        logger.error('[ERROR][BabylonSceneService] Add mesh failed:', error);
        return {
          success: false,
          error: createError(SceneErrorCode.UPDATE_FAILED, 'Failed to add mesh to scene', error),
        };
      }
    },

    removeMesh(mesh: Mesh): SceneUpdateResult {
      try {
        if (!state.scene || !state.isInitialized) {
          return {
            success: false,
            error: createError(SceneErrorCode.UPDATE_FAILED, 'Scene not initialized'),
          };
        }

        mesh.dispose();

        updateState({
          meshes: state.meshes.filter((m) => m !== mesh),
        });

        return { success: true, data: undefined };
      } catch (error) {
        logger.error('[ERROR][BabylonSceneService] Remove mesh failed:', error);
        return {
          success: false,
          error: createError(
            SceneErrorCode.UPDATE_FAILED,
            'Failed to remove mesh from scene',
            error
          ),
        };
      }
    },

    clearMeshes(): SceneUpdateResult {
      try {
        if (!state.scene || !state.isInitialized) {
          return {
            success: false,
            error: createError(SceneErrorCode.UPDATE_FAILED, 'Scene not initialized'),
          };
        }

        // Dispose all meshes
        state.meshes.forEach((mesh) => {
          try {
            mesh.dispose();
          } catch (error) {
            logger.warn('[WARN][BabylonSceneService] Failed to dispose mesh:', error);
          }
        });

        updateState({
          meshes: [],
        });

        return { success: true, data: undefined };
      } catch (error) {
        logger.error('[ERROR][BabylonSceneService] Clear meshes failed:', error);
        return {
          success: false,
          error: createError(
            SceneErrorCode.UPDATE_FAILED,
            'Failed to clear meshes from scene',
            error
          ),
        };
      }
    },

    dispose(): SceneDisposeResult {
      try {
        logger.debug('[DEBUG][BabylonSceneService] Disposing scene');

        if (state.scene && !state.isDisposed) {
          // Clear meshes first
          const clearResult = service.clearMeshes();
          if (!clearResult.success) {
            logger.warn('[WARN][BabylonSceneService] Failed to clear meshes during disposal');
          }

          // Dispose scene
          state.scene.dispose();
        }

        updateState({
          scene: null,
          isInitialized: false,
          isDisposed: true,
          cameras: [],
          lights: [],
          meshes: [],
        });

        logger.end('[END][BabylonSceneService] Scene disposed successfully');

        return { success: true, data: undefined };
      } catch (error) {
        logger.error('[ERROR][BabylonSceneService] Scene disposal failed:', error);
        return {
          success: false,
          error: createError(SceneErrorCode.DISPOSAL_FAILED, 'Failed to dispose scene', error),
        };
      }
    },
  };

  return service;
}
