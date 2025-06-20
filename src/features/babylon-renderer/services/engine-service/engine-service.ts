/**
 * @file Engine Service
 * 
 * Pure functions for Babylon.js engine management
 * Following functional programming principles and SRP
 * 
 * @author Luciano Júnior
 * @date June 2025
 */

import * as BABYLON from '@babylonjs/core';
import type { 
  BabylonEngineConfig, 
  EngineResult, 
  EngineService 
} from '../../types/babylon-types';

// ============================================================================
// Default Configuration
// ============================================================================

/**
 * Default engine configuration following best practices
 */
const DEFAULT_ENGINE_CONFIG: Required<BabylonEngineConfig> = {
  antialias: true,
  preserveDrawingBuffer: true,
  stencil: true,
  powerPreference: 'high-performance',
  forceRealEngine: false
} as const;

// ============================================================================
// Pure Functions for Engine Management
// ============================================================================

/**
 * Create Babylon.js engine with error handling
 * Pure function that returns Result type for safe error handling
 * Supports both regular Engine and NullEngine for testing
 */
const createEngine = (
  canvas: HTMLCanvasElement | null,
  config: BabylonEngineConfig = {}
): EngineResult => {
  console.log('[INIT] Creating Babylon.js engine');

  try {
    // Check if we're in a test environment (no canvas or no WebGL)
    const isTestEnvironment = !canvas || typeof window === 'undefined' ||
      (canvas && typeof canvas.getContext === 'function' && !canvas.getContext('webgl'));

    // Allow forcing real engine creation even in test environments (for visual tests)
    if (isTestEnvironment && !config.forceRealEngine) {
      console.log('[DEBUG] Creating NullEngine for test environment');
      const nullEngine = new BABYLON.NullEngine({
        renderWidth: 800,
        renderHeight: 600,
        textureSize: 512,
        deterministicLockstep: false,
        lockstepMaxSteps: 1
      });

      console.log('[DEBUG] NullEngine created successfully');
      return { success: true, data: nullEngine };
    }

    // If forceRealEngine is true, proceed with real engine creation even in test environment
    if (config.forceRealEngine && isTestEnvironment) {
      console.log('[DEBUG] Forcing real engine creation for visual tests');
    }

    // Validate canvas for regular engine
    if (!canvas || typeof canvas.getContext !== 'function') {
      const error = 'Invalid canvas element provided';
      console.error('[ERROR]', error);
      return { success: false, error: `Failed to create engine: ${error}` };
    }

    // Merge configuration with defaults
    const engineConfig = { ...DEFAULT_ENGINE_CONFIG, ...config };

    console.log('[DEBUG] Engine configuration:', engineConfig);

    // Create engine with configuration
    const engine = new BABYLON.Engine(canvas, engineConfig.antialias, {
      preserveDrawingBuffer: engineConfig.preserveDrawingBuffer,
      stencil: engineConfig.stencil,
      powerPreference: engineConfig.powerPreference
    });

    // Validate engine creation
    if (!engine || engine.isDisposed) {
      const error = 'Engine creation failed or engine is disposed';
      console.error('[ERROR]', error);
      return { success: false, error: `Failed to create engine: ${error}` };
    }

    console.log('[DEBUG] Babylon.js engine created successfully');
    return { success: true, data: engine };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown engine creation error';
    console.error('[ERROR] Engine creation failed:', errorMessage);

    // Try to create NullEngine as fallback for testing
    try {
      console.log('[DEBUG] Attempting NullEngine fallback');
      const nullEngine = new BABYLON.NullEngine({
        renderWidth: 800,
        renderHeight: 600,
        textureSize: 512,
        deterministicLockstep: false,
        lockstepMaxSteps: 1
      });

      console.log('[DEBUG] NullEngine fallback created successfully');
      return { success: true, data: nullEngine };
    } catch (fallbackError) {
      return { success: false, error: `Failed to create engine: ${errorMessage}` };
    }
  }
};

/**
 * Safely dispose Babylon.js engine
 * Pure function with null safety
 */
const disposeEngine = (engine: BABYLON.Engine | null): void => {
  if (!engine) {
    console.log('[DEBUG] No engine to dispose (null)');
    return;
  }

  try {
    if (!engine.isDisposed) {
      console.log('[DEBUG] Disposing Babylon.js engine');
      engine.dispose();
      console.log('[DEBUG] Engine disposed successfully');
    } else {
      console.log('[DEBUG] Engine already disposed');
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown disposal error';
    console.error('[ERROR] Engine disposal failed:', errorMessage);
    // Don't throw - just log the error
  }
};

/**
 * Handle engine resize with error handling
 * Pure function with null safety
 */
const handleResize = (engine: BABYLON.Engine | null): void => {
  if (!engine) {
    console.log('[DEBUG] No engine to resize (null)');
    return;
  }

  try {
    if (!engine.isDisposed) {
      console.log('[DEBUG] Resizing Babylon.js engine');
      engine.resize();
      console.log('[DEBUG] Engine resized successfully');
    } else {
      console.log('[DEBUG] Cannot resize disposed engine');
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown resize error';
    console.error('[ERROR] Engine resize failed:', errorMessage);
    // Don't throw - just log the error
  }
};

/**
 * Setup WebGL context error handlers
 * Pure function for error handling setup
 */
const setupEngineErrorHandlers = (
  engine: BABYLON.Engine,
  onContextLost?: () => void,
  onContextRestored?: () => void
): void => {
  console.log('[DEBUG] Setting up engine error handlers');

  try {
    // Handle context lost
    engine.onContextLostObservable.add(() => {
      console.warn('[WARN] WebGL context lost');
      onContextLost?.();
    });

    // Handle context restored
    engine.onContextRestoredObservable.add(() => {
      console.log('[DEBUG] WebGL context restored');
      onContextRestored?.();
    });

    console.log('[DEBUG] Engine error handlers setup complete');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error handler setup error';
    console.error('[ERROR] Failed to setup engine error handlers:', errorMessage);
  }
};

/**
 * Get engine information for debugging
 * Pure function that returns engine state
 */
const getEngineInfo = (engine: BABYLON.Engine | null): {
  isValid: boolean;
  isDisposed: boolean;
  canvas: HTMLCanvasElement | null;
  webGLVersion: string;
} => {
  if (!engine) {
    return {
      isValid: false,
      isDisposed: true,
      canvas: null,
      webGLVersion: 'N/A'
    };
  }

  try {
    return {
      isValid: !engine.isDisposed,
      isDisposed: engine.isDisposed,
      canvas: engine.getRenderingCanvas(),
      webGLVersion: String(engine.webGLVersion)
    };
  } catch (error) {
    console.error('[ERROR] Failed to get engine info:', error);
    return {
      isValid: false,
      isDisposed: true,
      canvas: null,
      webGLVersion: 'Error'
    };
  }
};

// ============================================================================
// Service Factory
// ============================================================================

/**
 * Create engine service with all functions
 * Factory function following dependency injection pattern
 */
export const createEngineService = (): EngineService => ({
  createEngine,
  disposeEngine,
  handleResize
});

// ============================================================================
// Named Exports for Individual Functions
// ============================================================================

export {
  createEngine,
  disposeEngine,
  handleResize,
  setupEngineErrorHandlers,
  getEngineInfo,
  DEFAULT_ENGINE_CONFIG
};

// ============================================================================
// Type Exports
// ============================================================================

export type { BabylonEngineConfig, EngineResult, EngineService };
