/**
 * @file Material Service
 * 
 * Pure functions for Babylon.js material management
 * Following functional programming principles and SRP
 * 
 * @author Luciano Júnior
 * @date June 2025
 */

import * as BABYLON from '@babylonjs/core';
import type { 
  MaterialConfig, 
  MaterialData,
  MaterialResult, 
  MaterialService 
} from '../../types/babylon-types';

// ============================================================================
// Default Configuration
// ============================================================================

/**
 * Default material configuration following best practices
 */
const DEFAULT_MATERIAL_CONFIG: Required<MaterialConfig> = {
  diffuseColor: [0.8, 0.6, 0.4], // Orange-brown color for good visibility
  specularColor: [0.3, 0.3, 0.3], // Moderate specular reflection
  emissiveColor: [0.1, 0.1, 0.1], // Slight glow for better visibility
  backFaceCulling: false, // Show both sides of faces
  wireframe: false, // Solid rendering by default
  disableLighting: false // Enable lighting by default
} as const;

// ============================================================================
// Pure Functions for Material Management
// ============================================================================

/**
 * Create Babylon.js StandardMaterial with error handling
 * Pure function that returns Result type for safe error handling
 */
const createMaterial = (
  name: string,
  scene: BABYLON.Scene | null,
  config: MaterialConfig = {}
): MaterialResult => {
  console.log('[INIT] Creating Babylon.js material:', name);
  
  try {
    // Validate inputs
    if (!name || name.trim().length === 0) {
      const error = 'Invalid material name provided (empty)';
      console.error('[ERROR]', error);
      return { success: false, error: `Failed to create material: ${error}` };
    }

    if (!scene) {
      const error = 'Invalid scene provided (null)';
      console.error('[ERROR]', error);
      return { success: false, error: `Failed to create material: ${error}` };
    }

    if (scene.isDisposed) {
      const error = 'Scene is disposed';
      console.error('[ERROR]', error);
      return { success: false, error: `Failed to create material: ${error}` };
    }

    // Merge configuration with defaults
    const materialConfig = { ...DEFAULT_MATERIAL_CONFIG, ...config };
    
    console.log('[DEBUG] Material configuration:', materialConfig);

    // Create StandardMaterial
    const material = new BABYLON.StandardMaterial(name, scene);

    // Apply color properties
    material.diffuseColor = new BABYLON.Color3(...materialConfig.diffuseColor);
    material.specularColor = new BABYLON.Color3(...materialConfig.specularColor);
    material.emissiveColor = new BABYLON.Color3(...materialConfig.emissiveColor);

    // Apply rendering properties
    material.backFaceCulling = materialConfig.backFaceCulling;
    material.wireframe = materialConfig.wireframe;
    material.disableLighting = materialConfig.disableLighting;

    // Store debug information for wireframe toggling
    (material as any)._debugWireframe = materialConfig.wireframe;

    console.log('[DEBUG] Material created with properties:', {
      name: material.name,
      diffuseColor: material.diffuseColor.toString(),
      specularColor: material.specularColor.toString(),
      emissiveColor: material.emissiveColor.toString(),
      backFaceCulling: material.backFaceCulling,
      wireframe: material.wireframe,
      disableLighting: material.disableLighting
    });

    return { success: true, data: material };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown material creation error';
    console.error('[ERROR] Material creation failed:', errorMessage);
    return { success: false, error: `Failed to create material: ${errorMessage}` };
  }
};

/**
 * Apply material data to existing StandardMaterial
 * Pure function with null safety and error handling
 */
const applyMaterialData = (
  material: BABYLON.StandardMaterial | null,
  data: MaterialData
): void => {
  if (!material) {
    console.log('[DEBUG] No material to apply data to (null)');
    return;
  }

  try {
    if (material.isDisposed) {
      console.log('[DEBUG] Cannot apply data to disposed material');
      return;
    }

    console.log('[DEBUG] Applying material data:', data);

    // Apply color data
    material.diffuseColor = new BABYLON.Color3(...data.diffuseColor);
    material.specularColor = new BABYLON.Color3(...data.specularColor);
    material.emissiveColor = new BABYLON.Color3(...data.emissiveColor);

    console.log('[DEBUG] Material data applied successfully:', {
      diffuseColor: material.diffuseColor.toString(),
      specularColor: material.specularColor.toString(),
      emissiveColor: material.emissiveColor.toString()
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown material data application error';
    console.error('[ERROR] Material data application failed:', errorMessage);
    // Don't throw - just log the error
  }
};

/**
 * Toggle wireframe mode on StandardMaterial
 * Pure function with null safety and state tracking
 */
const toggleWireframe = (material: BABYLON.StandardMaterial | null): void => {
  if (!material) {
    console.log('[DEBUG] No material to toggle wireframe (null)');
    return;
  }

  try {
    if (material.isDisposed) {
      console.log('[DEBUG] Cannot toggle wireframe on disposed material');
      return;
    }

    const previousWireframe = material.wireframe;
    material.wireframe = !material.wireframe;

    // Update debug tracking
    (material as any)._debugWireframe = material.wireframe;

    console.log('[DEBUG] Wireframe toggled:', {
      materialName: material.name,
      previousState: previousWireframe,
      newState: material.wireframe
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown wireframe toggle error';
    console.error('[ERROR] Wireframe toggle failed:', errorMessage);
    // Don't throw - just log the error
  }
};

/**
 * Get material information for debugging
 * Pure function that returns material state
 */
const getMaterialInfo = (material: BABYLON.StandardMaterial | null): {
  isValid: boolean;
  isDisposed: boolean;
  name: string;
  wireframe: boolean;
  backFaceCulling: boolean;
  disableLighting: boolean;
  colors: {
    diffuse: string;
    specular: string;
    emissive: string;
  };
} => {
  if (!material) {
    return {
      isValid: false,
      isDisposed: true,
      name: 'N/A',
      wireframe: false,
      backFaceCulling: false,
      disableLighting: false,
      colors: {
        diffuse: 'N/A',
        specular: 'N/A',
        emissive: 'N/A'
      }
    };
  }

  try {
    return {
      isValid: !material.isDisposed,
      isDisposed: material.isDisposed,
      name: material.name,
      wireframe: material.wireframe,
      backFaceCulling: material.backFaceCulling,
      disableLighting: material.disableLighting,
      colors: {
        diffuse: material.diffuseColor.toString(),
        specular: material.specularColor.toString(),
        emissive: material.emissiveColor.toString()
      }
    };
  } catch (error) {
    console.error('[ERROR] Failed to get material info:', error);
    return {
      isValid: false,
      isDisposed: true,
      name: 'Error',
      wireframe: false,
      backFaceCulling: false,
      disableLighting: false,
      colors: {
        diffuse: 'Error',
        specular: 'Error',
        emissive: 'Error'
      }
    };
  }
};

/**
 * Clone material to another scene
 * Pure function for cross-scene material copying
 */
const cloneMaterial = (
  sourceMaterial: BABYLON.StandardMaterial | null,
  targetScene: BABYLON.Scene | null,
  newName?: string
): MaterialResult => {
  console.log('[DEBUG] Cloning material to target scene');

  try {
    if (!sourceMaterial) {
      const error = 'Invalid source material (null)';
      console.error('[ERROR]', error);
      return { success: false, error };
    }

    if (!targetScene) {
      const error = 'Invalid target scene (null)';
      console.error('[ERROR]', error);
      return { success: false, error };
    }

    if (sourceMaterial.isDisposed) {
      const error = 'Source material is disposed';
      console.error('[ERROR]', error);
      return { success: false, error };
    }

    if (targetScene.isDisposed) {
      const error = 'Target scene is disposed';
      console.error('[ERROR]', error);
      return { success: false, error };
    }

    const clonedName = newName || `${sourceMaterial.name}_clone`;
    const clonedMaterial = sourceMaterial.clone(clonedName);
    
    if (clonedMaterial && targetScene !== sourceMaterial.getScene()) {
      // Move to target scene if different
      clonedMaterial.getScene().removeMaterial(clonedMaterial);
      targetScene.addMaterial(clonedMaterial);
    }

    console.log('[DEBUG] Material cloned successfully:', clonedName);
    return { success: true, data: clonedMaterial as BABYLON.StandardMaterial };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown material cloning error';
    console.error('[ERROR] Material cloning failed:', errorMessage);
    return { success: false, error: `Material cloning failed: ${errorMessage}` };
  }
};

// ============================================================================
// Service Factory
// ============================================================================

/**
 * Create material service with all functions
 * Factory function following dependency injection pattern
 */
export const createMaterialService = (): MaterialService => ({
  createMaterial,
  applyMaterialData,
  toggleWireframe
});

// ============================================================================
// Named Exports for Individual Functions
// ============================================================================

export {
  createMaterial,
  applyMaterialData,
  toggleWireframe,
  getMaterialInfo,
  cloneMaterial,
  DEFAULT_MATERIAL_CONFIG
};

// ============================================================================
// Type Exports
// ============================================================================

export type { MaterialConfig, MaterialData, MaterialResult, MaterialService };
