/**
 * @file BabylonJS Buffer Clearing Utilities
 *
 * Provides utilities for explicit buffer clearing to prevent camera trails and ghosting.
 * Essential for proper BabylonJS rendering when camera movement causes visual artifacts.
 *
 * @example
 * ```typescript
 * import { clearRenderBuffers } from './buffer-clearing';
 *
 * // In render loop
 * engine.runRenderLoop(() => {
 *   if (scene) {
 *     clearRenderBuffers(engine, scene);
 *     scene.render();
 *   }
 * });
 * ```
 */

import type { Engine, Scene } from '@babylonjs/core';
import type { Result } from '../../../../shared/types/result.types';

/**
 * Error codes for buffer clearing operations
 */
export const BufferClearingErrorCode = {
  INVALID_ENGINE: 'INVALID_ENGINE',
  INVALID_SCENE: 'INVALID_SCENE',
  CLEAR_FAILED: 'CLEAR_FAILED',
} as const;

export type BufferClearingErrorCode =
  (typeof BufferClearingErrorCode)[keyof typeof BufferClearingErrorCode];

/**
 * Buffer clearing error type
 */
export interface BufferClearingError {
  readonly code: BufferClearingErrorCode;
  readonly message: string;
  readonly timestamp: Date;
}

/**
 * Buffer clearing result type
 */
export type BufferClearingResult = Result<void, BufferClearingError>;

/**
 * Creates a buffer clearing error
 *
 * @param code - Error code
 * @param message - Error message
 * @returns Buffer clearing error
 */
const createBufferClearingError = (
  code: BufferClearingErrorCode,
  message: string
): BufferClearingError => ({
  code,
  message,
  timestamp: new Date(),
});

/**
 * Clears all render buffers to prevent camera trails and ghosting
 *
 * This function performs explicit buffer clearing which is essential for preventing
 * visual artifacts during camera movement in BabylonJS. It ensures that:
 * - Color buffer is cleared with scene background
 * - Depth buffer is cleared for proper z-testing
 * - Stencil buffer is cleared for proper masking
 *
 * @param engine - BabylonJS engine instance
 * @param scene - BabylonJS scene instance
 * @returns Result indicating success or failure
 *
 * @example
 * ```typescript
 * const result = clearRenderBuffers(engine, scene);
 * if (!result.success) {
 *   console.error('Buffer clearing failed:', result.error.message);
 * }
 * ```
 */
export const clearRenderBuffers = (engine: Engine, scene: Scene): BufferClearingResult => {
  // Validate engine
  if (!engine || typeof engine.clear !== 'function') {
    return {
      success: false,
      error: createBufferClearingError(
        BufferClearingErrorCode.INVALID_ENGINE,
        'Invalid or missing BabylonJS engine'
      ),
    };
  }

  // Validate scene
  if (!scene || !scene.clearColor) {
    return {
      success: false,
      error: createBufferClearingError(
        BufferClearingErrorCode.INVALID_SCENE,
        'Invalid or missing BabylonJS scene'
      ),
    };
  }

  try {
    // Clear all buffers: color (with scene background), depth, and stencil
    engine.clear(scene.clearColor, true, true);

    return { success: true, data: undefined };
  } catch (cause) {
    return {
      success: false,
      error: createBufferClearingError(
        BufferClearingErrorCode.CLEAR_FAILED,
        `Failed to clear render buffers: ${cause instanceof Error ? cause.message : 'Unknown error'}`
      ),
    };
  }
};

/**
 * Ensures scene auto-clear settings are properly configured
 *
 * Forces the scene to use automatic clearing on each frame, which is essential
 * for preventing visual artifacts. This should be called before rendering.
 *
 * @param scene - BabylonJS scene instance
 * @returns Result indicating success or failure
 *
 * @example
 * ```typescript
 * const result = ensureSceneAutoClear(scene);
 * if (result.success) {
 *   scene.render();
 * }
 * ```
 */
export const ensureSceneAutoClear = (scene: Scene): BufferClearingResult => {
  if (!scene) {
    return {
      success: false,
      error: createBufferClearingError(
        BufferClearingErrorCode.INVALID_SCENE,
        'Invalid or missing BabylonJS scene'
      ),
    };
  }

  try {
    // Ensure auto-clear settings are active
    scene.autoClear = true;
    scene.autoClearDepthAndStencil = true;

    return { success: true, data: undefined };
  } catch (cause) {
    return {
      success: false,
      error: createBufferClearingError(
        BufferClearingErrorCode.CLEAR_FAILED,
        `Failed to configure scene auto-clear: ${cause instanceof Error ? cause.message : 'Unknown error'}`
      ),
    };
  }
};

/**
 * Performs complete buffer clearing and scene configuration
 *
 * Combines explicit buffer clearing with scene auto-clear configuration
 * for comprehensive visual artifact prevention.
 *
 * @param engine - BabylonJS engine instance
 * @param scene - BabylonJS scene instance
 * @returns Result indicating success or failure
 *
 * @example
 * ```typescript
 * // In render loop
 * engine.runRenderLoop(() => {
 *   if (scene) {
 *     const clearResult = performCompleteBufferClearing(engine, scene);
 *     if (clearResult.success) {
 *       scene.render();
 *     }
 *   }
 * });
 * ```
 */
export const performCompleteBufferClearing = (
  engine: Engine,
  scene: Scene
): BufferClearingResult => {
  // Ensure scene auto-clear settings
  const autoClearResult = ensureSceneAutoClear(scene);
  if (!autoClearResult.success) {
    return autoClearResult;
  }

  // Clear render buffers
  return clearRenderBuffers(engine, scene);
};
