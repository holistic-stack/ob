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
import { createCADGrid } from '../../components/cad-grid/cad-grid';
import { createNavigationCube } from '../../components/navigation-cube/navigation-cube';
import { createEnhancedNavigationCube } from '../../components/enhanced-navigation-cube/enhanced-navigation-cube';
import { createEnhancedCADNavigationCube } from '../../components/gui-navigation-cube/gui-navigation-cube';

// ============================================================================
// Default Configuration
// ============================================================================

/**
 * Default scene configuration following best practices
 */
const DEFAULT_SCENE_CONFIG: BabylonSceneConfig = {
  enableCamera: true,
  enableLighting: true,
  backgroundColor: '#2c3e50',
  // cameraPosition is intentionally omitted to use ArcRotate camera's radius/alpha/beta positioning
  cadGrid: {
    enabled: true,
    size: 20,
    divisions: 20,
    majorLineInterval: 5,
    minorLineColor: '#e0e0e0',
    majorLineColor: '#808080',
    opacity: 0.5,
    position: [0, 0, 0]
  },
  cadNavigationCube: {
    enabled: true,
    size: 1,
    position: [0.8, 0.8, 0],
    faceLabels: {
      front: 'Front',
      back: 'Back',
      left: 'Left',
      right: 'Right',
      top: 'Top',
      bottom: 'Bottom'
    },
    faceColors: {
      front: '#4CAF50',
      back: '#F44336',
      left: '#2196F3',
      right: '#FF9800',
      top: '#9C27B0',
      bottom: '#607D8B'
    }
  }
} as const;

// ============================================================================
// CAD Camera Control Functions
// ============================================================================

/**
 * Standard CAD view definitions
 */
const CAD_STANDARD_VIEWS = {
  front: { alpha: 0, beta: Math.PI / 2, description: 'Front view' },
  back: { alpha: Math.PI, beta: Math.PI / 2, description: 'Back view' },
  left: { alpha: -Math.PI / 2, beta: Math.PI / 2, description: 'Left view' },
  right: { alpha: Math.PI / 2, beta: Math.PI / 2, description: 'Right view' },
  top: { alpha: 0, beta: 0.1, description: 'Top view' },
  bottom: { alpha: 0, beta: Math.PI - 0.1, description: 'Bottom view' },
  isometric: { alpha: -Math.PI / 4, beta: Math.PI / 3, description: 'Isometric view' },
  home: { alpha: -Math.PI / 4, beta: Math.PI / 3, description: 'Home view' }
} as const;

/**
 * Setup professional CAD keyboard shortcuts
 */
const setupCADKeyboardControls = (scene: BABYLON.Scene, camera: BABYLON.ArcRotateCamera): void => {
  console.log('[DEBUG] Setting up CAD keyboard controls');

  scene.actionManager = new BABYLON.ActionManager(scene);

  // Standard view shortcuts
  scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(
    BABYLON.ActionManager.OnKeyDownTrigger,
    (evt) => {
      const key = evt.sourceEvent?.key?.toLowerCase();

      switch (key) {
        case 'f': // Front view
          animateToView(camera, CAD_STANDARD_VIEWS.front);
          break;
        case 'b': // Back view
          animateToView(camera, CAD_STANDARD_VIEWS.back);
          break;
        case 'l': // Left view
          animateToView(camera, CAD_STANDARD_VIEWS.left);
          break;
        case 'r': // Right view
          animateToView(camera, CAD_STANDARD_VIEWS.right);
          break;
        case 't': // Top view
          animateToView(camera, CAD_STANDARD_VIEWS.top);
          break;
        case 'u': // Bottom view (Under)
          animateToView(camera, CAD_STANDARD_VIEWS.bottom);
          break;
        case 'i': // Isometric view
          animateToView(camera, CAD_STANDARD_VIEWS.isometric);
          break;
        case 'h': // Home view
          animateToView(camera, CAD_STANDARD_VIEWS.home);
          break;
        case 'z': // Zoom to fit
          zoomToFitScene(camera, scene);
          break;
      }
    }
  ));

  console.log('[DEBUG] CAD keyboard controls setup complete');
};

/**
 * Setup professional CAD mouse controls
 */
const setupCADMouseControls = (scene: BABYLON.Scene, camera: BABYLON.ArcRotateCamera): void => {
  console.log('[DEBUG] Setting up CAD mouse controls');

  // Middle mouse button for panning
  scene.onPointerObservable.add((pointerInfo) => {
    if (pointerInfo.type === BABYLON.PointerEventTypes.POINTERDOWN) {
      if (pointerInfo.event.button === 1) { // Middle mouse button
        camera.inputs.attached.pointers.buttons = [0, 1, 2]; // Enable middle button
      }
    }
  });

  // Mouse wheel for precise zooming
  scene.onPointerObservable.add((pointerInfo) => {
    if (pointerInfo.type === BABYLON.PointerEventTypes.POINTERWHEEL) {
      const event = pointerInfo.event as WheelEvent;
      const zoomFactor = event.deltaY > 0 ? 1.1 : 0.9;

      // Smooth zoom animation
      const targetRadius = Math.max(
        camera.lowerRadiusLimit || 1,
        Math.min(camera.upperRadiusLimit || 1000, camera.radius * zoomFactor)
      );

      BABYLON.Animation.CreateAndStartAnimation(
        'cameraZoom',
        camera,
        'radius',
        60,
        10, // 0.16 seconds at 60fps
        camera.radius,
        targetRadius,
        BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT,
        new BABYLON.QuadraticEase()
      );
    }
  });

  console.log('[DEBUG] CAD mouse controls setup complete');
};

/**
 * Animate camera to a standard view
 */
const animateToView = (
  camera: BABYLON.ArcRotateCamera,
  view: { alpha: number; beta: number; description: string }
): void => {
  console.log('[DEBUG] Animating to view:', view.description);

  const frameRate = 60;
  const duration = 0.8; // 0.8 seconds
  const totalFrames = Math.round(duration * frameRate);

  // Alpha animation
  BABYLON.Animation.CreateAndStartAnimation(
    'cameraAlpha',
    camera,
    'alpha',
    frameRate,
    totalFrames,
    camera.alpha,
    view.alpha,
    BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT,
    new BABYLON.CubicEase()
  );

  // Beta animation
  BABYLON.Animation.CreateAndStartAnimation(
    'cameraBeta',
    camera,
    'beta',
    frameRate,
    totalFrames,
    camera.beta,
    view.beta,
    BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT,
    new BABYLON.CubicEase()
  );
};

/**
 * Zoom camera to fit all visible meshes in scene
 */
const zoomToFitScene = (camera: BABYLON.ArcRotateCamera, scene: BABYLON.Scene): void => {
  console.log('[DEBUG] Zooming to fit scene');

  const meshes = scene.meshes.filter(mesh =>
    mesh.isVisible &&
    !mesh.isDisposed &&
    mesh.name !== 'cad-grid' &&
    !mesh.name.includes('navigation-cube')
  );

  if (meshes.length === 0) {
    console.log('[DEBUG] No meshes to fit');
    return;
  }

  // Calculate scene bounds
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

  for (const mesh of meshes) {
    mesh.computeWorldMatrix(true);
    const boundingInfo = mesh.getBoundingInfo();
    if (boundingInfo) {
      const min = boundingInfo.boundingBox.minimum;
      const max = boundingInfo.boundingBox.maximum;

      minX = Math.min(minX, min.x);
      minY = Math.min(minY, min.y);
      minZ = Math.min(minZ, min.z);
      maxX = Math.max(maxX, max.x);
      maxY = Math.max(maxY, max.y);
      maxZ = Math.max(maxZ, max.z);
    }
  }

  // Calculate optimal camera position
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  const centerZ = (minZ + maxZ) / 2;

  const sizeX = maxX - minX;
  const sizeY = maxY - minY;
  const sizeZ = maxZ - minZ;
  const maxSize = Math.max(sizeX, sizeY, sizeZ);

  const targetRadius = Math.max(maxSize * 2.5, 10);
  const targetPosition = new BABYLON.Vector3(centerX, centerY, centerZ);

  // Animate to new position
  const frameRate = 60;
  const duration = 1.0; // 1 second
  const totalFrames = Math.round(duration * frameRate);

  // Radius animation
  BABYLON.Animation.CreateAndStartAnimation(
    'cameraRadius',
    camera,
    'radius',
    frameRate,
    totalFrames,
    camera.radius,
    targetRadius,
    BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT,
    new BABYLON.CubicEase()
  );

  // Target animation
  BABYLON.Animation.CreateAndStartAnimation(
    'cameraTarget',
    camera,
    'target',
    frameRate,
    totalFrames,
    camera.getTarget(),
    targetPosition,
    BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT,
    new BABYLON.CubicEase()
  );

  console.log('[DEBUG] Zoom to fit animation started:', {
    meshCount: meshes.length,
    targetRadius,
    targetPosition: targetPosition.toString()
  });
};

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

    // Setup CAD grid if enabled
    if (sceneConfig.cadGrid?.enabled) {
      const gridResult = setupCADGrid(scene, sceneConfig.cadGrid);
      if (!gridResult.success) {
        console.warn('[WARN] CAD grid setup failed:', gridResult.error);
        // Continue without grid - not a fatal error
      }
    }

    // Setup navigation cube if enabled
    if (sceneConfig.cadNavigationCube?.enabled) {
      const cubeResult = setupNavigationCube(scene, sceneConfig.cadNavigationCube);
      if (!cubeResult.success) {
        console.warn('[WARN] Navigation cube setup failed:', cubeResult.error);
        // Continue without navigation cube - not a fatal error
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

    // Create ArcRotate camera with better default positioning for our showcase scene
    const camera = new BABYLON.ArcRotateCamera(
      'camera',
      -Math.PI / 4,    // Alpha: 45 degrees around Y axis
      Math.PI / 3,     // Beta: 60 degrees from horizontal
      60,              // Radius: increased distance for better initial view
      new BABYLON.Vector3(1, 6, 4), // Target: centered on our object layout
      scene
    );

    // Professional CAD-style camera controls
    camera.inertia = 0.85;              // Smooth but responsive
    camera.angularSensibilityX = 800;   // Optimized for CAD navigation
    camera.angularSensibilityY = 800;   // Optimized for CAD navigation
    camera.panningSensibility = 500;    // Professional panning sensitivity
    camera.wheelPrecision = 20;         // Precise zoom control
    camera.pinchPrecision = 20;         // Touch device support

    // Professional CAD camera limits
    camera.lowerRadiusLimit = 1;        // Close inspection capability
    camera.upperRadiusLimit = 1000;     // Large scene support
    camera.lowerBetaLimit = 0.05;       // Prevent camera flip
    camera.upperBetaLimit = Math.PI - 0.05; // Prevent camera flip

    // CAD-style camera behaviors
    camera.checkCollisions = false;     // No collision detection for CAD
    camera.setTarget(BABYLON.Vector3.Zero()); // Default target at origin

    // Position camera if specified
    if (config.cameraPosition) {
      const [x, y, z] = config.cameraPosition;
      camera.position = new BABYLON.Vector3(x, y, z);
      console.log('[DEBUG] Camera positioned at:', camera.position.toString());
    }

    // Attach camera to canvas for user controls and proper updates
    const canvas = scene.getEngine().getRenderingCanvas();
    if (canvas) {
      camera.attachToCanvas(canvas);

      // Setup professional CAD keyboard shortcuts
      setupCADKeyboardControls(scene, camera);

      // Setup professional CAD mouse controls
      setupCADMouseControls(scene, camera);

      console.log('[DEBUG] Camera attached to canvas with CAD controls');
    } else {
      console.warn('[WARN] No canvas available for camera attachment');
    }

    console.log('[DEBUG] Camera setup complete:', {
      alpha: camera.alpha,
      beta: camera.beta,
      radius: camera.radius,
      target: camera.target.toString(),
      attachedToCanvas: !!canvas
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
 * Setup CAD grid for the scene
 * Pure function that creates a professional 3D grid system
 */
const setupCADGrid = (
  scene: BABYLON.Scene | null,
  config: NonNullable<BabylonSceneConfig['cadGrid']>
): Result<void, string> => {
  console.log('[DEBUG] Setting up CAD grid system');

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

    // Create CAD grid with configuration
    const gridResult = createCADGrid(scene, config);
    if (!gridResult.success) {
      console.error('[ERROR] CAD grid creation failed:', gridResult.error);
      return { success: false, error: `CAD grid setup failed: ${gridResult.error}` };
    }

    console.log('[DEBUG] CAD grid setup complete');
    return { success: true, data: undefined };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown CAD grid setup error';
    console.error('[ERROR] CAD grid setup failed:', errorMessage);
    return { success: false, error: `CAD grid setup failed: ${errorMessage}` };
  }
};

/**
 * Setup navigation cube for the scene
 * Pure function that creates an interactive 3D navigation cube
 */
const setupNavigationCube = (
  scene: BABYLON.Scene | null,
  config: NonNullable<BabylonSceneConfig['cadNavigationCube']>
): Result<void, string> => {
  console.log('[DEBUG] Setting up navigation cube');

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

    // Get camera for navigation cube interactions
    const camera = scene.activeCamera as BABYLON.ArcRotateCamera;
    if (!camera) {
      console.warn('[WARN] No active camera found for navigation cube');
      // Continue without camera interaction - not a fatal error
    }

    // Try to create professional CAD navigation cube first (most advanced)
    console.log('[DEBUG] Attempting to create professional CAD navigation cube');
    const cadCubeResult = createEnhancedCADNavigationCube(scene, camera, {
      cubeSize: 120,
      marginPixels: 20,
      showDirectionalControls: true,
      showMiniCubeMenu: true,
      animationDuration: 0.8,
      cornerPosition: 'top-right',
      faceButtonSize: 35,
      controlButtonSize: 25
    });

    if (cadCubeResult.success) {
      console.log('[DEBUG] Professional CAD navigation cube created successfully with',
        cadCubeResult.data.faceButtons.length, 'face buttons,',
        cadCubeResult.data.directionalControls.length, 'directional controls, and',
        cadCubeResult.data.miniCubeMenu.length, 'menu items'
      );
      return { success: true, data: undefined };
    }

    // Fallback to enhanced navigation cube if CAD GUI version fails
    console.warn('[WARN] Professional CAD navigation cube failed, falling back to enhanced version:', cadCubeResult.error);
    const enhancedCubeResult = createEnhancedNavigationCube(scene, camera, {
      size: config.size || 1.5,
      position: config.position || [0.85, 0.85, 0],
      movable: true,
      showDirectionalControls: true,
      showMiniCubeMenu: true,
      animationDuration: 0.8
    });

    if (enhancedCubeResult.success) {
      console.log('[DEBUG] Enhanced navigation cube created successfully with',
        enhancedCubeResult.data.faces.length, 'faces,',
        enhancedCubeResult.data.directionalControls.length, 'directional controls, and',
        enhancedCubeResult.data.miniCubeMenu.length, 'menu items'
      );
      return { success: true, data: undefined };
    }

    // Final fallback to basic navigation cube if enhanced version also fails
    console.warn('[WARN] Enhanced navigation cube also failed, falling back to basic version:', enhancedCubeResult.error);
    const basicCubeResult = createNavigationCube(scene, camera, config);
    if (!basicCubeResult.success) {
      console.error('[ERROR] All navigation cube implementations failed:', basicCubeResult.error);
      return { success: false, error: `Navigation cube setup failed: CAD GUI (${cadCubeResult.error}), Enhanced (${enhancedCubeResult.error}), Basic (${basicCubeResult.error})` };
    }

    console.log('[DEBUG] Basic navigation cube setup complete');
    return { success: true, data: undefined };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown navigation cube setup error';
    console.error('[ERROR] Navigation cube setup failed:', errorMessage);
    return { success: false, error: `Navigation cube setup failed: ${errorMessage}` };
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
  setupCADGrid,
  setupNavigationCube,
  disposeScene
});

// ============================================================================
// Named Exports for Individual Functions
// ============================================================================

export {
  createScene,
  setupCamera,
  setupLighting,
  setupCADGrid,
  setupNavigationCube,
  disposeScene,
  DEFAULT_SCENE_CONFIG
};

// ============================================================================
// Type Exports
// ============================================================================

export type { BabylonSceneConfig, SceneResult, SceneService };
