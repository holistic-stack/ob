/**
 * @file Debug Controls Utilities (DRY: Reusable Debug Functions)
 * 
 * Utility functions following DRY principle:
 * - Reusable debug functions for 3D scene testing
 * - Centralized debug logic to avoid duplication
 * - Pure functions for better testability
 * 
 * @author Luciano Júnior
 * @date June 2025
 */

import * as BABYLON from '@babylonjs/core';

/**
 * Create a test cube in the scene
 * Pure function - no side effects except scene modification
 */
export function createTestCube(scene: BABYLON.Scene): BABYLON.Mesh {
  console.log('[DEBUG] Creating test cube');

  // Remove any existing test cubes first
  const existingTestCubes = scene.meshes.filter(m => m.name.includes('test_cube'));
  existingTestCubes.forEach(mesh => {
    console.log('[DEBUG] Removing existing test cube:', mesh.name);
    mesh.dispose();
  });

  // Create new test cube
  const testCube = BABYLON.MeshBuilder.CreateBox('test_cube', { size: 2 }, scene);
  
  // Create material
  const material = new BABYLON.StandardMaterial('test_material', scene);
  material.diffuseColor = new BABYLON.Color3(1, 0, 0); // Red
  material.emissiveColor = new BABYLON.Color3(0.2, 0, 0); // Red glow
  testCube.material = material;
  testCube.position = new BABYLON.Vector3(0, 0, 0);

  // Position camera to look at test cube
  const camera = scene.activeCamera as BABYLON.ArcRotateCamera;
  if (camera) {
    camera.setTarget(BABYLON.Vector3.Zero());
    camera.radius = 10;
  }

  console.log('[DEBUG] Test cube created and positioned');
  return testCube;
}

/**
 * Get comprehensive scene debug information
 * Pure function - returns debug data without side effects
 */
export function getSceneDebugInfo(scene: BABYLON.Scene): Record<string, any> {
  return {
    meshCount: scene.meshes.length,
    meshes: scene.meshes.map(m => ({
      name: m.name,
      isVisible: m.isVisible,
      isEnabled: m.isEnabled(),
      vertices: m.getTotalVertices(),
      indices: m.getTotalIndices(),
      position: m.position.asArray(),
      hasGeometry: m.geometry !== null
    })),
    camera: scene.activeCamera?.name,
    cameraPosition: scene.activeCamera?.position.asArray(),
    lights: scene.lights.map(l => ({
      name: l.name,
      type: l.getClassName(),
      intensity: 'intensity' in l ? (l as any).intensity : 'N/A'
    })),
    isReady: scene.isReady(),
    totalVertices: scene.meshes.reduce((total, mesh) => total + mesh.getTotalVertices(), 0),
    totalIndices: scene.meshes.reduce((total, mesh) => total + mesh.getTotalIndices(), 0)
  };
}

/**
 * Log scene debug information to console
 * Side effect function - logs to console
 */
export function logSceneDebugInfo(scene: BABYLON.Scene): void {
  const debugInfo = getSceneDebugInfo(scene);
  console.log('[DEBUG] Scene debug info:', debugInfo);
}

/**
 * Clear all meshes from scene except camera and lights
 * Side effect function - modifies scene
 */
export function clearSceneMeshes(scene: BABYLON.Scene): number {
  console.log('[DEBUG] Clearing all meshes from scene');

  // Remove all meshes except camera and lights
  const meshesToClear = scene.meshes.filter(m =>
    m.name !== 'camera' && !m.name.includes('light')
  );

  const clearedCount = meshesToClear.length;
  
  meshesToClear.forEach(mesh => {
    console.log('[DEBUG] Clearing mesh:', mesh.name);
    mesh.dispose();
  });

  console.log(`[DEBUG] Scene cleared, removed ${clearedCount} meshes`);
  console.log('[DEBUG] Remaining meshes:', scene.meshes.map(m => m.name));
  
  return clearedCount;
}

/**
 * Create debug controls configuration
 * Pure function - returns configuration object
 */
export function createDebugControlsConfig(scene: BABYLON.Scene | null) {
  if (!scene) {
    return {
      canCreateTestCube: false,
      canDebugScene: false,
      canClearScene: false
    };
  }

  return {
    canCreateTestCube: true,
    canDebugScene: true,
    canClearScene: scene.meshes.length > 0,
    meshCount: scene.meshes.length,
    hasTestCube: scene.meshes.some(m => m.name.includes('test_cube'))
  };
}

/**
 * Debug control actions
 * Object containing all debug actions for easy use in components
 */
export const debugActions = {
  createTestCube,
  logSceneDebugInfo,
  clearSceneMeshes,
  getSceneDebugInfo,
  createDebugControlsConfig
} as const;
