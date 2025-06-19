/**
 * @file OpenSCAD Meshes Provider Hook
 * 
 * Custom hook for converting OpenSCAD code to Babylon.js meshes
 * Follows SRP by focusing only on mesh generation and management
 * 
 * @author OpenSCAD-Babylon Pipeline
 * @date June 2025
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import * as BABYLON from '@babylonjs/core';
import { convertOpenSCADToBabylon } from '../../../../../babylon-csg2/conversion/babylon-csg2-converter/babylon-csg2-converter';
import type { 
  UseOpenSCADMeshesProps, 
  UseOpenSCADMeshesReturn, 
  MeshCollection,
  MeshData,
  OpenSCADMeshConfig,
  ReferenceMeshConfig
} from '../../types/visual-test-canvas-types';

/**
 * Default configuration for main mesh conversion
 */
const DEFAULT_MAIN_MESH_CONFIG: OpenSCADMeshConfig = {
  enableLogging: true,
  rebuildNormals: true,
  centerMesh: true
} as const;

/**
 * Default configuration for reference mesh conversion
 */
const DEFAULT_REFERENCE_MESH_CONFIG: ReferenceMeshConfig = {
  enableLogging: true,
  rebuildNormals: true,
  centerMesh: true,
  separationDistance: 15,
  autoPosition: true
} as const;

/**
 * Custom hook for managing OpenSCAD to Babylon.js mesh conversion
 * 
 * This hook handles:
 * - Converting OpenSCAD code to Babylon.js meshes
 * - Creating reference meshes for comparison
 * - Managing loading states and errors
 * - Providing regeneration functionality
 * 
 * @param props - Configuration for mesh generation
 * @returns Mesh collection state and control functions
 * 
 * @example
 * ```tsx
 * const { meshes, isLoading, error, regenerate } = useOpenSCADMeshes({
 *   scene: babylonScene,
 *   openscadCode: 'cube([5, 5, 5]);',
 *   referenceOpenscadCode: 'cube([5, 5, 5]);'
 * });
 * ```
 */
export function useOpenSCADMeshes({
  scene,
  openscadCode,
  referenceOpenscadCode,
  mainMeshConfig = DEFAULT_MAIN_MESH_CONFIG,
  referenceMeshConfig = DEFAULT_REFERENCE_MESH_CONFIG,
  enableDebugLogging = false
}: UseOpenSCADMeshesProps): UseOpenSCADMeshesReturn {
  
  // State management
  const [meshes, setMeshes] = useState<MeshCollection | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Ref to track if component is mounted (for cleanup)
  const isMountedRef = useRef(true);
  
  // Logging utility
  const log = useCallback((message: string) => {
    if (enableDebugLogging) {
      console.log(`[USE-OPENSCAD-MESHES] ${message}`);
    }
  }, [enableDebugLogging]);

  /**
   * Convert OpenSCAD code to mesh data
   */
  const convertToMeshData = useCallback(async (
    code: string,
    config: OpenSCADMeshConfig,
    isReference = false
  ): Promise<MeshData[]> => {
    if (!scene || !code.trim()) {
      return [];
    }

    log(`Converting ${isReference ? 'reference' : 'main'} OpenSCAD code: ${code}`);

    const result = await convertOpenSCADToBabylon(code, scene, config);

    if (result.success && result.value && result.value.length > 0) {
      return result.value.map((mesh, index) => ({
        mesh,
        isReference,
        name: `${isReference ? 'reference' : 'main'}_${index}`,
        materialConfig: isReference ? {
          diffuseColor: [0.7, 0.7, 0.7] as const,
          specularColor: [0.1, 0.1, 0.1] as const,
          alpha: 0.3,
          transparencyMode: BABYLON.Material.MATERIAL_ALPHABLEND
        } : {
          diffuseColor: [1, 1, 1] as const,
          specularColor: [0.2, 0.2, 0.2] as const
        }
      }));
    }

    if (!result.success) {
      throw new Error(result.error);
    }

    return [];
  }, [scene, log]);

  /**
   * Apply ghost positioning to reference meshes
   */
  const applyReferencePositioning = useCallback(async (
    referenceMeshes: MeshData[],
    mainCode: string
  ): Promise<void> => {
    if (!referenceMeshes.length || !referenceMeshConfig.autoPosition) {
      return;
    }

    try {
      // Import utilities dynamically to avoid circular dependencies
      const { detectTransformationType, calculateGhostOffset, DEFAULT_GHOST_CONFIG } = 
        await import('../../utils/ghost-positioning');
      const { applyGhostPositioning } = await import('../../utils/mesh-positioning');

      // Detect transformation type from main code
      const transformation = detectTransformationType(mainCode);
      log(`Detected transformation: ${transformation.type}`);

      // Calculate ghost offset
      const ghostOffset = calculateGhostOffset(transformation, {
        ...DEFAULT_GHOST_CONFIG,
        separationDistance: referenceMeshConfig.separationDistance || DEFAULT_GHOST_CONFIG.separationDistance
      });

      // Apply positioning to reference meshes
      const babylonMeshes = referenceMeshes.map(meshData => meshData.mesh);
      applyGhostPositioning(babylonMeshes, ghostOffset);

      log(`Applied ghost positioning to ${referenceMeshes.length} reference meshes`);
    } catch (error) {
      log(`Warning: Failed to apply reference positioning: ${error}`);
      // Don't throw - positioning failure shouldn't break mesh generation
    }
  }, [referenceMeshConfig, log]);

  /**
   * Generate meshes from OpenSCAD code
   */
  const generateMeshes = useCallback(async (): Promise<void> => {
    if (!scene || !openscadCode?.trim()) {
      log('Skipping mesh generation - no scene or OpenSCAD code');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      log('Starting mesh generation process');

      // Generate main meshes
      const mainMeshes = await convertToMeshData(
        openscadCode,
        mainMeshConfig,
        false
      );

      if (!isMountedRef.current) return; // Component unmounted

      log(`Generated ${mainMeshes.length} main meshes`);

      // Generate reference meshes if reference code provided
      let referenceMeshes: MeshData[] = [];
      if (referenceOpenscadCode?.trim()) {
        try {
          referenceMeshes = await convertToMeshData(
            referenceOpenscadCode,
            referenceMeshConfig,
            true
          );

          if (!isMountedRef.current) return; // Component unmounted

          // Apply ghost positioning to reference meshes
          await applyReferencePositioning(referenceMeshes, openscadCode);

          log(`Generated ${referenceMeshes.length} reference meshes`);
        } catch (referenceError) {
          log(`Warning: Reference mesh generation failed: ${referenceError}`);
          // Continue without reference meshes - this is not a fatal error
        }
      }

      if (!isMountedRef.current) return; // Component unmounted

      // Create mesh collection
      const meshCollection: MeshCollection = {
        mainMeshes,
        referenceMeshes
      };

      setMeshes(meshCollection);
      log('Mesh generation completed successfully');

    } catch (error) {
      if (!isMountedRef.current) return; // Component unmounted

      const errorMessage = `Failed to convert main OpenSCAD code: ${error}`;
      log(`Error: ${errorMessage}`);
      setError(errorMessage);
      setMeshes(null);
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [
    scene,
    openscadCode,
    referenceOpenscadCode,
    mainMeshConfig,
    referenceMeshConfig,
    convertToMeshData,
    applyReferencePositioning,
    log
  ]);

  /**
   * Regenerate meshes (useful for retrying after errors)
   */
  const regenerate = useCallback(() => {
    log('Regenerating meshes');
    void generateMeshes();
  }, [generateMeshes, log]);

  // Generate meshes when dependencies change
  useEffect(() => {
    void generateMeshes();
  }, [generateMeshes]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      log('Hook unmounting, cleaning up');
    };
  }, [log]);

  return {
    meshes,
    isLoading,
    error,
    regenerate
  };
}
