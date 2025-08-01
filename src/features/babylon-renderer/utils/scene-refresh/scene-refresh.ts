/**
 * @file BabylonJS Scene Refresh Utilities
 *
 * Provides utilities for forcing scene and canvas refresh after mesh changes.
 * Essential for ensuring visual updates when meshes are added, removed, or modified.
 *
 * @example
 * ```typescript
 * import { forceSceneRefresh } from './scene-refresh';
 *
 * // After mesh disposal or creation
 * const result = forceSceneRefresh(engine, scene);
 * if (result.success) {
 *   console.log('Scene refreshed successfully');
 * }
 * ```
 */

import type { Engine, Scene } from '@babylonjs/core';
import type { Result } from '@/shared';

/**
 * Error codes for scene refresh operations
 */
export const SceneRefreshErrorCode = {
  INVALID_ENGINE: 'INVALID_ENGINE',
  INVALID_SCENE: 'INVALID_SCENE',
  REFRESH_FAILED: 'REFRESH_FAILED',
} as const;

export type SceneRefreshErrorCode =
  (typeof SceneRefreshErrorCode)[keyof typeof SceneRefreshErrorCode];

/**
 * Scene refresh error type
 */
export interface SceneRefreshError {
  readonly code: SceneRefreshErrorCode;
  readonly message: string;
  readonly timestamp: Date;
}

/**
 * Scene refresh result type
 */
export type SceneRefreshResult = Result<void, SceneRefreshError>;

/**
 * Creates a scene refresh error
 *
 * @param code - Error code
 * @param message - Error message
 * @returns Scene refresh error
 */
const createSceneRefreshError = (
  code: SceneRefreshErrorCode,
  message: string
): SceneRefreshError => ({
  code,
  message,
  timestamp: new Date(),
});

/**
 * Forces engine resize to refresh canvas visually
 *
 * This is the critical method for ensuring canvas updates after mesh changes.
 * The engine.resize() method forces the canvas to refresh its visual state.
 *
 * @param engine - BabylonJS engine instance
 * @returns Result indicating success or failure
 *
 * @example
 * ```typescript
 * const result = forceEngineResize(engine);
 * if (!result.success) {
 *   console.error('Engine resize failed:', result.error.message);
 * }
 * ```
 */
export const forceEngineResize = (engine: Engine): SceneRefreshResult => {
  if (!engine || typeof engine.resize !== 'function') {
    return {
      success: false,
      error: createSceneRefreshError(
        SceneRefreshErrorCode.INVALID_ENGINE,
        'Invalid or missing BabylonJS engine'
      ),
    };
  }

  try {
    engine.resize();
    return { success: true, data: undefined };
  } catch (cause) {
    return {
      success: false,
      error: createSceneRefreshError(
        SceneRefreshErrorCode.REFRESH_FAILED,
        `Failed to resize engine: ${cause instanceof Error ? cause.message : 'Unknown error'}`
      ),
    };
  }
};

/**
 * Resets scene material cache to force material refresh
 *
 * Clears cached materials to ensure they are properly updated after changes.
 * This is important when meshes are disposed and recreated.
 *
 * @param scene - BabylonJS scene instance
 * @returns Result indicating success or failure
 *
 * @example
 * ```typescript
 * const result = resetSceneMaterialCache(scene);
 * if (result.success) {
 *   console.log('Material cache reset');
 * }
 * ```
 */
export const resetSceneMaterialCache = (scene: Scene): SceneRefreshResult => {
  if (!scene) {
    return {
      success: false,
      error: createSceneRefreshError(
        SceneRefreshErrorCode.INVALID_SCENE,
        'Invalid or missing BabylonJS scene'
      ),
    };
  }

  try {
    if (scene.resetCachedMaterial && typeof scene.resetCachedMaterial === 'function') {
      scene.resetCachedMaterial();
    }
    return { success: true, data: undefined };
  } catch (cause) {
    return {
      success: false,
      error: createSceneRefreshError(
        SceneRefreshErrorCode.REFRESH_FAILED,
        `Failed to reset material cache: ${cause instanceof Error ? cause.message : 'Unknown error'}`
      ),
    };
  }
};

/**
 * Marks all scene materials as dirty to force refresh
 *
 * Forces all materials in the scene to be marked as dirty, ensuring they
 * are properly updated on the next render cycle.
 *
 * @param scene - BabylonJS scene instance
 * @returns Result indicating success or failure
 *
 * @example
 * ```typescript
 * const result = markSceneMaterialsAsDirty(scene);
 * if (result.success) {
 *   console.log('Materials marked as dirty');
 * }
 * ```
 */
export const markSceneMaterialsAsDirty = (scene: Scene): SceneRefreshResult => {
  if (!scene) {
    return {
      success: false,
      error: createSceneRefreshError(
        SceneRefreshErrorCode.INVALID_SCENE,
        'Invalid or missing BabylonJS scene'
      ),
    };
  }

  try {
    if (scene.markAllMaterialsAsDirty && typeof scene.markAllMaterialsAsDirty === 'function') {
      scene.markAllMaterialsAsDirty(1); // Mark all materials as dirty with flag 1
    }
    return { success: true, data: undefined };
  } catch (cause) {
    return {
      success: false,
      error: createSceneRefreshError(
        SceneRefreshErrorCode.REFRESH_FAILED,
        `Failed to mark materials as dirty: ${cause instanceof Error ? cause.message : 'Unknown error'}`
      ),
    };
  }
};

/**
 * Forces complete scene refresh after mesh changes
 *
 * Performs comprehensive scene refresh including:
 * - Scene render cycle
 * - Material cache reset
 * - Materials marked as dirty
 * - Engine resize for canvas refresh
 *
 * This should be called after mesh disposal or creation to ensure
 * the scene visually updates correctly.
 *
 * @param engine - BabylonJS engine instance
 * @param scene - BabylonJS scene instance
 * @returns Result indicating success or failure
 *
 * @example
 * ```typescript
 * // After mesh disposal
 * const result = forceSceneRefresh(engine, scene);
 * if (!result.success) {
 *   console.error('Scene refresh failed:', result.error.message);
 * }
 * ```
 */
export const forceSceneRefresh = (engine: Engine, scene: Scene): SceneRefreshResult => {
  // Validate inputs
  if (!engine) {
    return {
      success: false,
      error: createSceneRefreshError(
        SceneRefreshErrorCode.INVALID_ENGINE,
        'Invalid or missing BabylonJS engine'
      ),
    };
  }

  if (!scene) {
    return {
      success: false,
      error: createSceneRefreshError(
        SceneRefreshErrorCode.INVALID_SCENE,
        'Invalid or missing BabylonJS scene'
      ),
    };
  }

  try {
    // Force scene render cycle
    if (scene.render && typeof scene.render === 'function') {
      scene.render();
    }

    // Reset material cache
    const materialCacheResult = resetSceneMaterialCache(scene);
    if (!materialCacheResult.success) {
      return materialCacheResult;
    }

    // Mark materials as dirty
    const materialsDirtyResult = markSceneMaterialsAsDirty(scene);
    if (!materialsDirtyResult.success) {
      return materialsDirtyResult;
    }

    // Force engine resize (critical for canvas refresh)
    const engineResizeResult = forceEngineResize(engine);
    if (!engineResizeResult.success) {
      return engineResizeResult;
    }

    // Final render after resize
    if (scene.render && typeof scene.render === 'function') {
      scene.render();
    }

    return { success: true, data: undefined };
  } catch (cause) {
    return {
      success: false,
      error: createSceneRefreshError(
        SceneRefreshErrorCode.REFRESH_FAILED,
        `Failed to refresh scene: ${cause instanceof Error ? cause.message : 'Unknown error'}`
      ),
    };
  }
};
