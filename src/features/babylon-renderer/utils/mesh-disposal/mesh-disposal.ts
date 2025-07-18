/**
 * @file BabylonJS Mesh Disposal Utilities
 *
 * Provides utilities for comprehensive mesh disposal to prevent memory leaks
 * and ensure proper cleanup of BabylonJS resources including materials and textures.
 *
 * @example
 * ```typescript
 * import { disposeMeshesComprehensively } from './mesh-disposal';
 *
 * // Clear all meshes from scene
 * const result = disposeMeshesComprehensively(scene);
 * if (result.success) {
 *   console.log(`Disposed ${result.data.meshesDisposed} meshes`);
 * }
 * ```
 */

import type { AbstractMesh, BaseTexture, Material, Scene } from '@babylonjs/core';

// Interface for materials with texture properties
interface MaterialWithTextures extends Material {
  diffuseTexture?: BaseTexture;
  normalTexture?: BaseTexture;
  bumpTexture?: BaseTexture;
  emissiveTexture?: BaseTexture;
  specularTexture?: BaseTexture;
}

import type { Result } from '../../../../shared/types/result.types';

/**
 * Error codes for mesh disposal operations
 */
export const MeshDisposalErrorCode = {
  INVALID_SCENE: 'INVALID_SCENE',
  DISPOSAL_FAILED: 'DISPOSAL_FAILED',
} as const;

export type MeshDisposalErrorCode =
  (typeof MeshDisposalErrorCode)[keyof typeof MeshDisposalErrorCode];

/**
 * Mesh disposal error type
 */
export interface MeshDisposalError {
  readonly code: MeshDisposalErrorCode;
  readonly message: string;
  readonly timestamp: Date;
}

/**
 * Mesh disposal statistics (mutable for internal use)
 */
interface MutableMeshDisposalStats {
  meshesDisposed: number;
  materialsDisposed: number;
  texturesDisposed: number;
  meshesSkipped: number;
}

/**
 * Mesh disposal statistics (readonly for external use)
 */
export interface MeshDisposalStats {
  readonly meshesDisposed: number;
  readonly materialsDisposed: number;
  readonly texturesDisposed: number;
  readonly meshesSkipped: number;
}

/**
 * Mesh disposal result type
 */
export type MeshDisposalResult = Result<MeshDisposalStats, MeshDisposalError>;

/**
 * Creates a mesh disposal error
 *
 * @param code - Error code
 * @param message - Error message
 * @returns Mesh disposal error
 */
const createMeshDisposalError = (
  code: MeshDisposalErrorCode,
  message: string
): MeshDisposalError => ({
  code,
  message,
  timestamp: new Date(),
});

/**
 * Checks if a mesh is a system mesh that should be skipped
 *
 * System meshes include cameras, lights, ground, skybox, and other
 * infrastructure meshes that should not be disposed during scene clearing.
 *
 * @param mesh - BabylonJS mesh to check
 * @returns True if mesh is a system mesh
 *
 * @example
 * ```typescript
 * if (!isSystemMesh(mesh)) {
 *   // Safe to dispose this mesh
 *   mesh.dispose();
 * }
 * ```
 */
export const isSystemMesh = (mesh: AbstractMesh): boolean => {
  if (!mesh) return true;

  const meshName = (mesh.name || '').toLowerCase();
  const meshId = (mesh.id || '').toLowerCase();

  return (
    meshName.includes('camera') ||
    meshName.includes('light') ||
    meshName.includes('ground') ||
    meshName.includes('skybox') ||
    meshId.includes('camera') ||
    meshId.includes('light') ||
    mesh.getClassName?.()?.includes('Camera') ||
    mesh.getClassName?.()?.includes('Light')
  );
};

/**
 * Disposes material and its textures safely
 *
 * Properly disposes a material and all its associated textures
 * to prevent memory leaks.
 *
 * @param material - BabylonJS material to dispose
 * @returns Number of textures disposed
 *
 * @example
 * ```typescript
 * const texturesDisposed = disposeMaterialSafely(mesh.material);
 * console.log(`Disposed ${texturesDisposed} textures`);
 * ```
 */
export const disposeMaterialSafely = (material: Material): number => {
  if (!material) return 0;

  let texturesDisposed = 0;

  try {
    // Dispose common texture types
    const materialWithTextures = material as MaterialWithTextures;

    if (materialWithTextures.diffuseTexture) {
      materialWithTextures.diffuseTexture.dispose();
      texturesDisposed++;
    }

    if (materialWithTextures.normalTexture) {
      materialWithTextures.normalTexture.dispose();
      texturesDisposed++;
    }

    if (materialWithTextures.bumpTexture) {
      materialWithTextures.bumpTexture.dispose();
      texturesDisposed++;
    }

    if (materialWithTextures.emissiveTexture) {
      materialWithTextures.emissiveTexture.dispose();
      texturesDisposed++;
    }

    if (materialWithTextures.specularTexture) {
      materialWithTextures.specularTexture.dispose();
      texturesDisposed++;
    }

    // Dispose the material itself
    material.dispose();
  } catch (_error) {
    // Continue disposal even if individual texture disposal fails
  }

  return texturesDisposed;
};

/**
 * Disposes a single mesh comprehensively
 *
 * Performs complete disposal of a mesh including its materials and textures
 * in the correct order to prevent memory leaks.
 *
 * @param scene - BabylonJS scene containing the mesh
 * @param mesh - BabylonJS mesh to dispose
 * @returns Disposal statistics for this mesh
 *
 * @example
 * ```typescript
 * const stats = disposeMeshComprehensively(scene, mesh);
 * console.log(`Disposed mesh with ${stats.materialsDisposed} materials`);
 * ```
 */
export const disposeMeshComprehensively = (
  scene: Scene,
  mesh: AbstractMesh
): Omit<MeshDisposalStats, 'meshesSkipped'> => {
  const stats = {
    meshesDisposed: 0,
    materialsDisposed: 0,
    texturesDisposed: 0,
  };

  if (!mesh || !scene) return stats;

  try {
    // Step 1: Dispose materials and textures first
    if (mesh.material) {
      const texturesDisposed = disposeMaterialSafely(mesh.material);
      stats.materialsDisposed = 1;
      stats.texturesDisposed = texturesDisposed;
    }

    // Step 2: Remove from scene
    scene.removeMesh(mesh);

    // Step 3: Dispose the mesh (this should dispose geometry too)
    mesh.dispose();
    stats.meshesDisposed = 1;
  } catch (_error) {
    // Continue even if disposal fails for this mesh
  }

  return stats;
};

/**
 * Disposes all non-system meshes from a scene comprehensively
 *
 * Performs comprehensive disposal of all meshes in a scene except system meshes
 * (cameras, lights, etc.). Uses proper disposal order and safe iteration.
 *
 * @param scene - BabylonJS scene to clear
 * @returns Result with disposal statistics or error
 *
 * @example
 * ```typescript
 * const result = disposeMeshesComprehensively(scene);
 * if (result.success) {
 *   console.log(`Disposed ${result.data.meshesDisposed} meshes`);
 *   console.log(`Disposed ${result.data.materialsDisposed} materials`);
 *   console.log(`Disposed ${result.data.texturesDisposed} textures`);
 * }
 * ```
 */
export const disposeMeshesComprehensively = (scene: Scene): MeshDisposalResult => {
  if (!scene) {
    return {
      success: false,
      error: createMeshDisposalError(
        MeshDisposalErrorCode.INVALID_SCENE,
        'Invalid or missing BabylonJS scene'
      ),
    };
  }

  try {
    // Use slice() to avoid iteration issues when modifying the array
    const allMeshes = scene.meshes ? scene.meshes.slice() : [];

    const stats: MutableMeshDisposalStats = {
      meshesDisposed: 0,
      materialsDisposed: 0,
      texturesDisposed: 0,
      meshesSkipped: 0,
    };

    for (const mesh of allMeshes) {
      if (!mesh) continue;

      // Skip system meshes
      if (isSystemMesh(mesh)) {
        stats.meshesSkipped++;
        continue;
      }

      // Dispose mesh comprehensively
      const meshStats = disposeMeshComprehensively(scene, mesh);
      stats.meshesDisposed += meshStats.meshesDisposed;
      stats.materialsDisposed += meshStats.materialsDisposed;
      stats.texturesDisposed += meshStats.texturesDisposed;
    }

    return { success: true, data: stats };
  } catch (cause) {
    return {
      success: false,
      error: createMeshDisposalError(
        MeshDisposalErrorCode.DISPOSAL_FAILED,
        `Failed to dispose meshes: ${cause instanceof Error ? cause.message : 'Unknown error'}`
      ),
    };
  }
};
