/**
 * @file Material Manager Utilities
 * 
 * Pure functions for creating and applying materials to meshes
 * Follows functional programming principles with Result types
 * 
 * @author OpenSCAD-Babylon Pipeline
 * @date June 2025
 */

import * as BABYLON from '@babylonjs/core';
import type { 
  MeshMaterialConfig, 
  MaterialTheme, 
  MaterialManagerConfig,
  MeshCollection,
  MeshData
} from '../../types/visual-test-canvas-types';

// ============================================================================
// Result Types
// ============================================================================

/**
 * Result type for material operations
 */
export type MaterialResult<T> = 
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly error: string };

/**
 * Result of applying materials to a mesh collection
 */
export interface MaterialApplicationResult {
  readonly appliedCount: number;
  readonly failedCount: number;
  readonly errors: readonly string[];
}

// ============================================================================
// Default Configurations
// ============================================================================

/**
 * Default material configuration for main meshes
 */
const DEFAULT_MAIN_MATERIAL: MeshMaterialConfig = {
  diffuseColor: [1, 1, 1], // White
  specularColor: [0.2, 0.2, 0.2] // Low specular
} as const;

/**
 * Default material configuration for reference meshes
 */
const DEFAULT_REFERENCE_MATERIAL: MeshMaterialConfig = {
  diffuseColor: [0.7, 0.7, 0.7], // Light gray
  specularColor: [0.1, 0.1, 0.1], // Very low specular
  alpha: 0.3, // Transparent
  transparencyMode: BABYLON.Material.MATERIAL_ALPHABLEND
} as const;

// ============================================================================
// Material Theme Definitions
// ============================================================================

/**
 * Predefined material themes for different visual testing scenarios
 */
const MATERIAL_THEMES: Record<MaterialTheme, MaterialManagerConfig> = {
  default: {
    mainMeshMaterial: DEFAULT_MAIN_MATERIAL,
    referenceMeshMaterial: DEFAULT_REFERENCE_MATERIAL
  },
  'high-contrast': {
    mainMeshMaterial: {
      diffuseColor: [1, 1, 1], // Pure white
      specularColor: [0, 0, 0] // No specular
    },
    referenceMeshMaterial: {
      diffuseColor: [0, 0, 0], // Pure black
      specularColor: [0, 0, 0], // No specular
      alpha: 0.5,
      transparencyMode: BABYLON.Material.MATERIAL_ALPHABLEND
    }
  },
  colorful: {
    mainMeshMaterial: {
      diffuseColor: [0.2, 0.8, 1], // Bright blue
      specularColor: [0.3, 0.3, 0.3]
    },
    referenceMeshMaterial: {
      diffuseColor: [1, 0.5, 0.2], // Orange
      specularColor: [0.2, 0.2, 0.2],
      alpha: 0.4,
      transparencyMode: BABYLON.Material.MATERIAL_ALPHABLEND
    }
  },
  monochrome: {
    mainMeshMaterial: {
      diffuseColor: [0.9, 0.9, 0.9], // Light gray
      specularColor: [0.1, 0.1, 0.1]
    },
    referenceMeshMaterial: {
      diffuseColor: [0.5, 0.5, 0.5], // Medium gray
      specularColor: [0.05, 0.05, 0.05],
      alpha: 0.3,
      transparencyMode: BABYLON.Material.MATERIAL_ALPHABLEND
    }
  }
} as const;

// ============================================================================
// Core Material Functions
// ============================================================================

/**
 * Create a Babylon.js StandardMaterial with the specified configuration
 * 
 * @param name - Material name
 * @param scene - Babylon.js scene
 * @param config - Optional material configuration
 * @returns Result containing the created material or error
 */
export function createMeshMaterial(
  name: string,
  scene: BABYLON.Scene,
  config: MeshMaterialConfig = DEFAULT_MAIN_MATERIAL
): MaterialResult<BABYLON.StandardMaterial> {
  try {
    const material = new BABYLON.StandardMaterial(name, scene);

    // Apply diffuse color
    material.diffuseColor = new BABYLON.Color3(
      config.diffuseColor[0],
      config.diffuseColor[1],
      config.diffuseColor[2]
    );

    // Apply specular color
    material.specularColor = new BABYLON.Color3(
      config.specularColor[0],
      config.specularColor[1],
      config.specularColor[2]
    );

    // Apply alpha if specified
    if (config.alpha !== undefined) {
      material.alpha = config.alpha;
    }

    // Apply transparency mode if specified
    if (config.transparencyMode !== undefined) {
      material.transparencyMode = config.transparencyMode;
    }

    return { success: true, data: material };
  } catch (error) {
    return { 
      success: false, 
      error: `Failed to create material "${name}": ${error}` 
    };
  }
}

/**
 * Apply a material to a mesh
 * 
 * @param mesh - Target mesh
 * @param material - Material to apply
 * @returns Result indicating success or failure
 */
export function applyMaterialToMesh(
  mesh: BABYLON.Mesh,
  material: BABYLON.StandardMaterial
): MaterialResult<void> {
  if (!mesh) {
    return { success: false, error: 'Mesh is null or undefined' };
  }

  if (!material) {
    return { success: false, error: 'Material is null or undefined' };
  }

  try {
    mesh.material = material;
    return { success: true, data: undefined };
  } catch (error) {
    return { 
      success: false, 
      error: `Failed to apply material to mesh "${mesh.name}": ${error}` 
    };
  }
}

/**
 * Create material from mesh data configuration
 * 
 * @param meshData - Mesh data containing configuration
 * @param scene - Babylon.js scene
 * @returns Result containing the created material or error
 */
export function createMaterialFromConfig(
  meshData: MeshData,
  scene: BABYLON.Scene
): MaterialResult<BABYLON.StandardMaterial> {
  const materialName = `${meshData.name || 'mesh'}_material`;
  const config = meshData.materialConfig || DEFAULT_MAIN_MATERIAL;
  
  return createMeshMaterial(materialName, scene, config);
}

/**
 * Get material theme configuration
 * 
 * @param theme - Theme name
 * @returns Material manager configuration for the theme
 */
export function getMaterialTheme(theme: MaterialTheme): MaterialManagerConfig {
  return MATERIAL_THEMES[theme] || MATERIAL_THEMES.default;
}

// ============================================================================
// Batch Operations
// ============================================================================

/**
 * Apply materials to all meshes in a mesh collection
 * 
 * @param meshCollection - Collection of meshes to process
 * @param scene - Babylon.js scene
 * @param config - Optional material manager configuration
 * @returns Result containing application statistics
 */
export async function applyMaterialsToMeshCollection(
  meshCollection: MeshCollection,
  scene: BABYLON.Scene,
  config: MaterialManagerConfig = {}
): Promise<MaterialResult<MaterialApplicationResult>> {
  const theme = getMaterialTheme(config.theme || 'default');
  const errors: string[] = [];
  let appliedCount = 0;
  let failedCount = 0;

  // Process main meshes
  for (const meshData of meshCollection.mainMeshes) {
    try {
      const materialConfig = meshData.materialConfig || 
                           config.mainMeshMaterial || 
                           theme.mainMeshMaterial;

      const materialResult = createMeshMaterial(
        `${meshData.name || 'main'}_material`,
        scene,
        materialConfig
      );

      if (materialResult.success) {
        const applyResult = applyMaterialToMesh(meshData.mesh, materialResult.data);
        if (applyResult.success) {
          appliedCount++;
        } else {
          failedCount++;
          errors.push(applyResult.error);
        }
      } else {
        failedCount++;
        errors.push(materialResult.error);
      }
    } catch (error) {
      failedCount++;
      errors.push(`Failed to process main mesh "${meshData.name}": ${error}`);
    }
  }

  // Process reference meshes
  for (const meshData of meshCollection.referenceMeshes) {
    try {
      const materialConfig = meshData.materialConfig || 
                           config.referenceMeshMaterial || 
                           theme.referenceMeshMaterial;

      const materialResult = createMeshMaterial(
        `${meshData.name || 'reference'}_material`,
        scene,
        materialConfig
      );

      if (materialResult.success) {
        const applyResult = applyMaterialToMesh(meshData.mesh, materialResult.data);
        if (applyResult.success) {
          appliedCount++;
        } else {
          failedCount++;
          errors.push(applyResult.error);
        }
      } else {
        failedCount++;
        errors.push(materialResult.error);
      }
    } catch (error) {
      failedCount++;
      errors.push(`Failed to process reference mesh "${meshData.name}": ${error}`);
    }
  }

  return {
    success: true,
    data: {
      appliedCount,
      failedCount,
      errors
    }
  };
}
