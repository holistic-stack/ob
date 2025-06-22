/**
 * CAD Viewport Integration Demo
 * 
 * This file demonstrates how to use the integrated CAD viewport features
 * including 3D grid system and navigation cube with the Babylon.js renderer.
 * 
 * @example
 * ```typescript
 * import { createCADViewportDemo } from './cad-viewport-demo';
 * 
 * // Create a scene with CAD viewport features
 * const demo = createCADViewportDemo();
 * const result = demo.createSceneWithCADFeatures(engine);
 * 
 * if (result.success) {
 *   console.log('CAD viewport scene created successfully');
 * }
 * ```
 */

import * as BABYLON from '@babylonjs/core';
import { createSceneService } from '../services/scene-service/scene-service';
import type { BabylonSceneConfig } from '../types/babylon-types';
import type { Result } from '../../../shared/types/result-types';

/**
 * Demo configuration for CAD viewport features
 */
const CAD_VIEWPORT_CONFIG: BabylonSceneConfig = {
  enableCamera: true,
  enableLighting: true,
  backgroundColor: '#2c3e50',
  cameraPosition: [15, 15, 15],
  
  // Professional 3D grid system
  cadGrid: {
    enabled: true,
    size: 30,
    divisions: 30,
    majorLineInterval: 5,
    minorLineColor: '#e0e0e0',
    majorLineColor: '#808080',
    opacity: 0.6,
    position: [0, 0, 0]
  },
  
  // Interactive navigation cube
  cadNavigationCube: {
    enabled: true,
    size: 1.2,
    position: [0.85, 0.85, 0],
    faceLabels: {
      front: 'Front',
      back: 'Back',
      left: 'Left',
      right: 'Right',
      top: 'Top',
      bottom: 'Bottom'
    },
    faceColors: {
      front: '#4CAF50',   // Green
      back: '#F44336',    // Red
      left: '#2196F3',    // Blue
      right: '#FF9800',   // Orange
      top: '#9C27B0',     // Purple
      bottom: '#607D8B'   // Blue Grey
    }
  }
} as const;

/**
 * Minimal configuration for comparison
 */
const MINIMAL_CONFIG: BabylonSceneConfig = {
  enableCamera: true,
  enableLighting: true,
  backgroundColor: '#2c3e50',
  cameraPosition: [10, 10, 10],
  
  // Disable CAD features
  cadGrid: {
    enabled: false
  },
  cadNavigationCube: {
    enabled: false
  }
} as const;

/**
 * CAD Viewport Demo Service
 */
export interface CADViewportDemo {
  readonly createSceneWithCADFeatures: (engine: BABYLON.Engine) => Result<BABYLON.Scene, string>;
  readonly createMinimalScene: (engine: BABYLON.Engine) => Result<BABYLON.Scene, string>;
  readonly addSampleObjects: (scene: BABYLON.Scene) => Result<void, string>;
  readonly demonstrateFeatures: (scene: BABYLON.Scene) => Result<string[], string>;
}

/**
 * Create a scene with full CAD viewport features
 */
const createSceneWithCADFeatures = (engine: BABYLON.Engine): Result<BABYLON.Scene, string> => {
  console.log('[INIT] Creating CAD viewport demo scene');
  
  try {
    const sceneService = createSceneService();
    const result = sceneService.createScene(engine, CAD_VIEWPORT_CONFIG);
    
    if (!result.success) {
      console.error('[ERROR] Failed to create CAD scene:', result.error);
      return { success: false, error: `CAD scene creation failed: ${result.error}` };
    }
    
    console.log('[DEBUG] CAD viewport scene created successfully');
    return { success: true, data: result.data };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown CAD scene creation error';
    console.error('[ERROR] CAD scene creation failed:', errorMessage);
    return { success: false, error: `CAD scene creation failed: ${errorMessage}` };
  }
};

/**
 * Create a minimal scene without CAD features for comparison
 */
const createMinimalScene = (engine: BABYLON.Engine): Result<BABYLON.Scene, string> => {
  console.log('[INIT] Creating minimal demo scene');
  
  try {
    const sceneService = createSceneService();
    const result = sceneService.createScene(engine, MINIMAL_CONFIG);
    
    if (!result.success) {
      console.error('[ERROR] Failed to create minimal scene:', result.error);
      return { success: false, error: `Minimal scene creation failed: ${result.error}` };
    }
    
    console.log('[DEBUG] Minimal scene created successfully');
    return { success: true, data: result.data };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown minimal scene creation error';
    console.error('[ERROR] Minimal scene creation failed:', errorMessage);
    return { success: false, error: `Minimal scene creation failed: ${errorMessage}` };
  }
};

/**
 * Add sample objects to demonstrate the CAD viewport
 */
const addSampleObjects = (scene: BABYLON.Scene): Result<void, string> => {
  console.log('[DEBUG] Adding sample objects to scene');
  
  try {
    // Create sample cube
    const cube = BABYLON.MeshBuilder.CreateBox('sample-cube', { size: 2 }, scene);
    cube.position = new BABYLON.Vector3(-3, 1, 0);
    
    // Create sample sphere
    const sphere = BABYLON.MeshBuilder.CreateSphere('sample-sphere', { diameter: 2 }, scene);
    sphere.position = new BABYLON.Vector3(0, 1, 0);
    
    // Create sample cylinder
    const cylinder = BABYLON.MeshBuilder.CreateCylinder('sample-cylinder', { height: 3, diameter: 1.5 }, scene);
    cylinder.position = new BABYLON.Vector3(3, 1.5, 0);
    
    // Create materials
    const cubeMaterial = new BABYLON.StandardMaterial('cube-material', scene);
    cubeMaterial.diffuseColor = BABYLON.Color3.Red();
    cube.material = cubeMaterial;
    
    const sphereMaterial = new BABYLON.StandardMaterial('sphere-material', scene);
    sphereMaterial.diffuseColor = BABYLON.Color3.Green();
    sphere.material = sphereMaterial;
    
    const cylinderMaterial = new BABYLON.StandardMaterial('cylinder-material', scene);
    cylinderMaterial.diffuseColor = BABYLON.Color3.Blue();
    cylinder.material = cylinderMaterial;
    
    console.log('[DEBUG] Sample objects added successfully');
    return { success: true, data: undefined };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown sample objects creation error';
    console.error('[ERROR] Sample objects creation failed:', errorMessage);
    return { success: false, error: `Sample objects creation failed: ${errorMessage}` };
  }
};

/**
 * Demonstrate CAD viewport features
 */
const demonstrateFeatures = (scene: BABYLON.Scene): Result<string[], string> => {
  console.log('[DEBUG] Demonstrating CAD viewport features');
  
  try {
    const features: string[] = [];
    
    // Check for grid system
    const gridMesh = scene.getMeshByName('cad-grid');
    if (gridMesh) {
      features.push('✅ 3D Grid System: Professional CAD-style grid with major/minor lines');
    } else {
      features.push('❌ 3D Grid System: Not found');
    }
    
    // Check for navigation cube
    const navCube = scene.getMeshByName('navigation-cube');
    if (navCube) {
      features.push('✅ Navigation Cube: Interactive 3D navigation with face labels');
    } else {
      features.push('❌ Navigation Cube: Not found');
    }
    
    // Check camera type
    const camera = scene.activeCamera;
    if (camera && camera instanceof BABYLON.ArcRotateCamera) {
      features.push('✅ CAD Camera: ArcRotate camera with professional controls');
    } else {
      features.push('❌ CAD Camera: Not configured properly');
    }
    
    // Check lighting
    const lights = scene.lights;
    if (lights.length >= 3) {
      features.push('✅ Professional Lighting: Multi-light setup for CAD visualization');
    } else {
      features.push('❌ Professional Lighting: Insufficient lighting setup');
    }
    
    console.log('[DEBUG] CAD viewport features demonstrated');
    return { success: true, data: features };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown feature demonstration error';
    console.error('[ERROR] Feature demonstration failed:', errorMessage);
    return { success: false, error: `Feature demonstration failed: ${errorMessage}` };
  }
};

/**
 * Create CAD viewport demo service
 */
export const createCADViewportDemo = (): CADViewportDemo => ({
  createSceneWithCADFeatures,
  createMinimalScene,
  addSampleObjects,
  demonstrateFeatures
});

/**
 * Export configurations for external use
 */
export {
  CAD_VIEWPORT_CONFIG,
  MINIMAL_CONFIG
};

/**
 * Export individual functions for direct use
 */
export {
  createSceneWithCADFeatures,
  createMinimalScene,
  addSampleObjects,
  demonstrateFeatures
};
