/**
 * @file R3F Scene Service
 * 
 * React Three Fiber scene service equivalent to Babylon scene service.
 * Manages scene setup, lighting, camera configuration, and scene lifecycle
 * with functional programming patterns and proper error handling.
 * 
 * @author OpenSCAD-R3F Pipeline
 * @version 1.0.0
 */

import * as THREE from 'three';
import type { 
  R3FSceneConfig, 
  R3FCameraConfig,
  R3FSceneService, 
  R3FSceneResult, 
  Result 
} from '../../types/r3f-types';

// ============================================================================
// Default Configuration
// ============================================================================

/**
 * Default scene configuration following best practices
 */
const DEFAULT_SCENE_CONFIG: Required<R3FSceneConfig> = {
  enableCamera: true,
  enableLighting: true,
  backgroundColor: '#2c3e50',
  cameraPosition: [10, 10, 10],
  cameraTarget: [0, 0, 0],
  ambientLightIntensity: 0.4,
  directionalLightIntensity: 1,
  directionalLightPosition: [10, 10, 5],
  enableGrid: true,
  gridSize: 20,
  enableAxes: true,
  fog: {
    color: '#2c3e50',
    near: 50,
    far: 200
  }
} as const;

/**
 * Default camera configuration
 */
const DEFAULT_CAMERA_CONFIG: Required<R3FCameraConfig> = {
  type: 'perspective',
  fov: 75,
  aspect: 1,
  near: 0.1,
  far: 1000,
  position: [10, 10, 10],
  target: [0, 0, 0],
  enableControls: true,
  enableZoom: true,
  enableRotate: true,
  enablePan: true,
  autoRotate: false,
  autoRotateSpeed: 2.0,
  minDistance: 0,
  maxDistance: Infinity,
  minPolarAngle: 0,
  maxPolarAngle: Math.PI,
  dampingFactor: 0.05,
  enableDamping: true,
  controlsConfig: {
    enableDamping: true,
    dampingFactor: 0.05,
    enableZoom: true,
    enableRotate: true,
    enablePan: true,
    autoRotate: false,
    autoRotateSpeed: 2.0
  }
} as const;

// ============================================================================
// Pure Functions for Scene Management
// ============================================================================

/**
 * Create Three.js scene with error handling
 * Pure function that returns Result type for safe error handling
 */
const createScene = (config: R3FSceneConfig = {}): R3FSceneResult => {
  console.log('[INIT] Creating Three.js scene');
  
  try {
    // Merge configuration with defaults
    const sceneConfig = { ...DEFAULT_SCENE_CONFIG, ...config };
    
    console.log('[DEBUG] Scene configuration:', sceneConfig);

    // Create scene
    const scene = new THREE.Scene();

    // Configure scene background
    scene.background = new THREE.Color(sceneConfig.backgroundColor);

    console.log('[DEBUG] Scene background color set to:', sceneConfig.backgroundColor);

    // Setup fog if configured
    if (sceneConfig.fog) {
      scene.fog = new THREE.Fog(
        sceneConfig.fog.color,
        sceneConfig.fog.near,
        sceneConfig.fog.far
      );
      console.log('[DEBUG] Scene fog configured');
    }

    // Setup lighting if enabled
    if (sceneConfig.enableLighting) {
      const lightingResult = setupLighting(scene, sceneConfig);
      if (!lightingResult.success) {
        console.warn('[WARN] Lighting setup failed:', lightingResult.error);
        // Continue without lighting - not a fatal error
      }
    }

    // Setup grid if enabled
    if (sceneConfig.enableGrid) {
      const gridResult = setupGrid(scene, sceneConfig);
      if (!gridResult.success) {
        console.warn('[WARN] Grid setup failed:', gridResult.error);
        // Continue without grid - not a fatal error
      }
    }

    // Setup axes if enabled
    if (sceneConfig.enableAxes) {
      const axesResult = setupAxes(scene);
      if (!axesResult.success) {
        console.warn('[WARN] Axes setup failed:', axesResult.error);
        // Continue without axes - not a fatal error
      }
    }

    console.log('[DEBUG] Three.js scene created successfully');
    return { success: true, data: scene };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown scene creation error';
    console.error('[ERROR] Scene creation failed:', errorMessage);
    return { success: false, error: `Failed to create scene: ${errorMessage}` };
  }
};

/**
 * Setup comprehensive lighting for the scene
 * Pure function that creates ambient, directional, and point lights
 */
const setupLighting = (
  scene: THREE.Scene | null, 
  config: R3FSceneConfig
): Result<void, string> => {
  console.log('[DEBUG] Setting up scene lighting');

  try {
    // Validate scene
    if (!scene) {
      const error = 'Invalid scene provided (null)';
      console.error('[ERROR]', error);
      return { success: false, error };
    }

    // Ambient light for overall illumination
    const ambientLight = new THREE.AmbientLight(0xffffff, config.ambientLightIntensity || 0.4);
    ambientLight.name = 'ambientLight';
    scene.add(ambientLight);

    // Directional light for shadows and definition
    const directionalLight = new THREE.DirectionalLight(
      0xffffff, 
      config.directionalLightIntensity || 1
    );
    
    const lightPos = config.directionalLightPosition || [10, 10, 5];
    directionalLight.position.set(lightPos[0], lightPos[1], lightPos[2]);
    directionalLight.name = 'directionalLight';
    
    // Enable shadows
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 500;
    directionalLight.shadow.camera.left = -50;
    directionalLight.shadow.camera.right = 50;
    directionalLight.shadow.camera.top = 50;
    directionalLight.shadow.camera.bottom = -50;
    
    scene.add(directionalLight);

    // Add a subtle point light for additional illumination
    const pointLight = new THREE.PointLight(0xffffff, 0.5, 100);
    pointLight.position.set(5, 5, 5);
    pointLight.name = 'pointLight';
    scene.add(pointLight);

    console.log('[DEBUG] Scene lighting setup complete');
    return { success: true, data: undefined };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown lighting setup error';
    console.error('[ERROR] Lighting setup failed:', errorMessage);
    return { success: false, error: `Lighting setup failed: ${errorMessage}` };
  }
};

/**
 * Setup camera for the scene
 * Pure function with comprehensive camera configuration
 */
const setupCamera = (
  scene: THREE.Scene | null,
  config: R3FCameraConfig
): Result<THREE.Camera, string> => {
  console.log('[DEBUG] Setting up camera');

  try {
    // Validate scene
    if (!scene) {
      const error = 'Invalid scene provided (null)';
      console.error('[ERROR]', error);
      return { success: false, error };
    }

    // Merge configuration with defaults
    const cameraConfig = { ...DEFAULT_CAMERA_CONFIG, ...config };

    let camera: THREE.Camera;

    if (cameraConfig.type === 'orthographic') {
      // Create orthographic camera
      const frustumSize = 20;
      const aspect = cameraConfig.aspect;
      camera = new THREE.OrthographicCamera(
        frustumSize * aspect / -2,
        frustumSize * aspect / 2,
        frustumSize / 2,
        frustumSize / -2,
        cameraConfig.near,
        cameraConfig.far
      );
    } else {
      // Create perspective camera (default)
      camera = new THREE.PerspectiveCamera(
        cameraConfig.fov,
        cameraConfig.aspect,
        cameraConfig.near,
        cameraConfig.far
      );
    }

    // Set camera position
    const pos = cameraConfig.position;
    camera.position.set(pos[0], pos[1], pos[2]);

    // Set camera target (look at)
    const target = cameraConfig.target;
    camera.lookAt(new THREE.Vector3(target[0], target[1], target[2]));

    camera.name = 'camera';

    console.log('[DEBUG] Camera setup complete');
    return { success: true, data: camera };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown camera setup error';
    console.error('[ERROR] Camera setup failed:', errorMessage);
    return { success: false, error: `Camera setup failed: ${errorMessage}` };
  }
};

/**
 * Setup grid for the scene
 * Pure function that creates a grid helper
 */
const setupGrid = (
  scene: THREE.Scene | null,
  config: R3FSceneConfig
): Result<void, string> => {
  console.log('[DEBUG] Setting up scene grid');

  try {
    // Validate scene
    if (!scene) {
      const error = 'Invalid scene provided (null)';
      console.error('[ERROR]', error);
      return { success: false, error };
    }

    const gridSize = config.gridSize || 20;
    const divisions = gridSize;

    // Create grid helper
    const gridHelper = new THREE.GridHelper(gridSize, divisions, 0x808080, 0xe0e0e0);
    gridHelper.name = 'gridHelper';
    scene.add(gridHelper);

    console.log('[DEBUG] Scene grid setup complete');
    return { success: true, data: undefined };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown grid setup error';
    console.error('[ERROR] Grid setup failed:', errorMessage);
    return { success: false, error: `Grid setup failed: ${errorMessage}` };
  }
};

/**
 * Setup coordinate axes for the scene
 * Pure function that creates axes helper
 */
const setupAxes = (scene: THREE.Scene | null): Result<void, string> => {
  console.log('[DEBUG] Setting up scene axes');

  try {
    // Validate scene
    if (!scene) {
      const error = 'Invalid scene provided (null)';
      console.error('[ERROR]', error);
      return { success: false, error };
    }

    // Create axes helper
    const axesHelper = new THREE.AxesHelper(5);
    axesHelper.name = 'axesHelper';
    scene.add(axesHelper);

    console.log('[DEBUG] Scene axes setup complete');
    return { success: true, data: undefined };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown axes setup error';
    console.error('[ERROR] Axes setup failed:', errorMessage);
    return { success: false, error: `Axes setup failed: ${errorMessage}` };
  }
};

/**
 * Safely dispose Three.js scene
 * Pure function with null safety
 */
const disposeScene = (scene: THREE.Scene | null): void => {
  if (!scene) {
    console.log('[DEBUG] No scene to dispose (null)');
    return;
  }

  try {
    console.log('[DEBUG] Disposing Three.js scene');
    
    // Dispose all objects in the scene
    scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        if (object.geometry) {
          object.geometry.dispose();
        }
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(material => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      }
    });

    // Clear the scene
    scene.clear();
    
    console.log('[DEBUG] Scene disposed successfully');
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
 * Create R3F scene service with all functions
 * Factory function following dependency injection pattern
 */
export const createR3FSceneService = (): R3FSceneService => ({
  createScene,
  disposeScene,
  setupLighting,
  setupCamera
});

// ============================================================================
// Named Exports for Individual Functions
// ============================================================================

export {
  createScene,
  setupLighting,
  setupCamera,
  setupGrid,
  setupAxes,
  disposeScene,
  DEFAULT_SCENE_CONFIG,
  DEFAULT_CAMERA_CONFIG
};
