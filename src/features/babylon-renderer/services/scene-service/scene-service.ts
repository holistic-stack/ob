/**
 * @file Scene Service
 * 
 * Pure functions for Babylon.js scene management
 * Following functional programming principles and SRP
 * 
 * @author Luciano Júnior
 * @date June 2025
 */

import * as BABYLON from '@babylonjs/core';
import type { 
  BabylonSceneConfig, 
  SceneResult, 
  SceneService,
  Result
} from '../../types/babylon-types';

// ============================================================================
// Default Configuration
// ============================================================================

/**
 * Default scene configuration following best practices
 */
const DEFAULT_SCENE_CONFIG: Required<BabylonSceneConfig> = {
  enableCamera: true,
  enableLighting: true,
  backgroundColor: '#2c3e50',
  cameraPosition: [10, 10, 10]
} as const;

// ============================================================================
// Pure Functions for Scene Management
// ============================================================================

/**
 * Create Babylon.js scene with error handling
 * Pure function that returns Result type for safe error handling
 */
const createScene = (
  engine: BABYLON.Engine | null,
  config: BabylonSceneConfig = {}
): SceneResult => {
  console.log('[INIT] Creating Babylon.js scene');
  
  try {
    // Validate engine
    if (!engine) {
      const error = 'Invalid engine provided (null)';
      console.error('[ERROR]', error);
      return { success: false, error: `Failed to create scene: ${error}` };
    }

    if (engine.isDisposed) {
      const error = 'Engine is disposed';
      console.error('[ERROR]', error);
      return { success: false, error: `Failed to create scene: ${error}` };
    }

    // Merge configuration with defaults
    const sceneConfig = { ...DEFAULT_SCENE_CONFIG, ...config };
    
    console.log('[DEBUG] Scene configuration:', sceneConfig);

    // Create scene
    const scene = new BABYLON.Scene(engine);

    // Configure scene background
    const backgroundColor = BABYLON.Color3.FromHexString(sceneConfig.backgroundColor);
    scene.clearColor = new BABYLON.Color4(
      backgroundColor.r,
      backgroundColor.g,
      backgroundColor.b,
      1.0
    );

    console.log('[DEBUG] Scene background color set to:', sceneConfig.backgroundColor);

    // Setup camera if enabled
    if (sceneConfig.enableCamera) {
      const cameraResult = setupCamera(scene, sceneConfig);
      if (!cameraResult.success) {
        console.warn('[WARN] Camera setup failed:', cameraResult.error);
        // Continue without camera - not a fatal error
      }
    }

    // Setup lighting if enabled
    if (sceneConfig.enableLighting) {
      const lightingResult = setupLighting(scene);
      if (!lightingResult.success) {
        console.warn('[WARN] Lighting setup failed:', lightingResult.error);
        // Continue without lighting - not a fatal error
      }
    }

    console.log('[DEBUG] Babylon.js scene created successfully');
    return { success: true, data: scene };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown scene creation error';
    console.error('[ERROR] Scene creation failed:', errorMessage);
    return { success: false, error: `Failed to create scene: ${errorMessage}` };
  }
};

/**
 * Setup ArcRotate camera for the scene
 * Pure function with comprehensive camera configuration
 */
const setupCamera = (
  scene: BABYLON.Scene | null,
  config: BabylonSceneConfig
): Result<BABYLON.ArcRotateCamera, string> => {
  console.log('[DEBUG] Setting up ArcRotate camera');

  try {
    // Validate scene
    if (!scene) {
      const error = 'Invalid scene provided (null)';
      console.error('[ERROR]', error);
      return { success: false, error };
    }

    if (scene.isDisposed) {
      const error = 'Scene is disposed';
      console.error('[ERROR]', error);
      return { success: false, error };
    }

    if (!config.enableCamera) {
      const error = 'Camera setup disabled in configuration';
      console.error('[ERROR]', error);
      return { success: false, error };
    }

    // Create ArcRotate camera
    const camera = new BABYLON.ArcRotateCamera(
      'camera',
      -Math.PI / 4,    // Alpha: 45 degrees around Y axis
      Math.PI / 3,     // Beta: 60 degrees from horizontal
      20,              // Radius: distance from target
      BABYLON.Vector3.Zero(), // Target: center of scene
      scene
    );

    // Enhanced camera controls for better user experience
    camera.inertia = 0.9;
    camera.angularSensibilityX = 1000;
    camera.angularSensibilityY = 1000;
    camera.panningSensibility = 1000;
    camera.wheelPrecision = 50;

    // Set camera limits for better control
    camera.lowerRadiusLimit = 2;   // Minimum zoom distance
    camera.upperRadiusLimit = 100; // Maximum zoom distance
    camera.lowerBetaLimit = 0.1;   // Prevent camera from going below ground
    camera.upperBetaLimit = Math.PI - 0.1; // Prevent camera from flipping

    // Position camera if specified
    if (config.cameraPosition) {
      const [x, y, z] = config.cameraPosition;
      camera.position = new BABYLON.Vector3(x, y, z);
      console.log('[DEBUG] Camera positioned at:', camera.position.toString());
    }

    console.log('[DEBUG] Camera setup complete:', {
      alpha: camera.alpha,
      beta: camera.beta,
      radius: camera.radius,
      target: camera.target.toString()
    });

    return { success: true, data: camera };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown camera setup error';
    console.error('[ERROR] Camera setup failed:', errorMessage);
    return { success: false, error: `Camera setup failed: ${errorMessage}` };
  }
};

/**
 * Setup comprehensive lighting for the scene
 * Pure function that creates ambient, directional, and point lights
 */
const setupLighting = (scene: BABYLON.Scene | null): Result<void, string> => {
  console.log('[DEBUG] Setting up scene lighting');

  try {
    // Validate scene
    if (!scene) {
      const error = 'Invalid scene provided (null)';
      console.error('[ERROR]', error);
      return { success: false, error };
    }

    if (scene.isDisposed) {
      const error = 'Scene is disposed';
      console.error('[ERROR]', error);
      return { success: false, error };
    }

    // Ambient light for overall illumination
    const ambientLight = new BABYLON.HemisphericLight(
      'ambientLight',
      new BABYLON.Vector3(0, 1, 0),
      scene
    );
    ambientLight.intensity = 0.8;
    ambientLight.diffuse = new BABYLON.Color3(1, 1, 1);
    ambientLight.specular = new BABYLON.Color3(1, 1, 1);

    // Directional light for shadows and definition
    const directionalLight = new BABYLON.DirectionalLight(
      'directionalLight',
      new BABYLON.Vector3(-1, -1, -1),
      scene
    );
    directionalLight.intensity = 0.6;
    directionalLight.diffuse = new BABYLON.Color3(1, 1, 1);
    directionalLight.specular = new BABYLON.Color3(1, 1, 1);

    // Additional point light for better illumination
    const pointLight = new BABYLON.PointLight(
      'pointLight',
      new BABYLON.Vector3(10, 10, 10),
      scene
    );
    pointLight.intensity = 0.4;
    pointLight.diffuse = new BABYLON.Color3(1, 1, 1);

    console.log('[DEBUG] Lighting setup complete:', {
      ambientIntensity: ambientLight.intensity,
      directionalIntensity: directionalLight.intensity,
      pointIntensity: pointLight.intensity,
      totalLights: scene.lights.length
    });

    return { success: true, data: undefined };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown lighting setup error';
    console.error('[ERROR] Lighting setup failed:', errorMessage);
    return { success: false, error: `Lighting setup failed: ${errorMessage}` };
  }
};

/**
 * Safely dispose Babylon.js scene
 * Pure function with null safety
 */
const disposeScene = (scene: BABYLON.Scene | null): void => {
  if (!scene) {
    console.log('[DEBUG] No scene to dispose (null)');
    return;
  }

  try {
    if (!scene.isDisposed) {
      console.log('[DEBUG] Disposing Babylon.js scene');
      scene.dispose();
      console.log('[DEBUG] Scene disposed successfully');
    } else {
      console.log('[DEBUG] Scene already disposed');
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown disposal error';
    console.error('[ERROR] Scene disposal failed:', errorMessage);
    // Don't throw - just log the error
  }
};

// ============================================================================
// Service Factory
// ============================================================================

/**
 * Create scene service with all functions
 * Factory function following dependency injection pattern
 */
export const createSceneService = (): SceneService => ({
  createScene,
  setupCamera,
  setupLighting,
  disposeScene
});

// ============================================================================
// Named Exports for Individual Functions
// ============================================================================

export {
  createScene,
  setupCamera,
  setupLighting,
  disposeScene,
  DEFAULT_SCENE_CONFIG
};

// ============================================================================
// Type Exports
// ============================================================================

export type { BabylonSceneConfig, SceneResult, SceneService };
