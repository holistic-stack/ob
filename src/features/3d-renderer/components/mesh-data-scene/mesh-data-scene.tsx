/**
 * @file Mesh Data Scene Component
 *
 * A React Three Fiber scene component that renders generic mesh data
 * without any knowledge of OpenSCAD or AST structures. This component
 * is part of Layer 3 (Generic Rendering) in the architectural separation.
 *
 * Features:
 * - Mesh data rendering (Layer 3: Generic mesh data → Three.js objects)
 * - Optimized lighting for CSG operations
 * - Camera controls and performance monitoring
 * - Material and geometry management
 * - Proper cleanup and disposal
 *
 * @example
 * ```tsx
 * <MeshDataScene
 *   meshes={genericMeshData}
 *   camera={{ position: [5, 5, 5], target: [0, 0, 0] }}
 *   lighting={{ lightIntensity: 1.0, enableShadows: true }}
 * />
 * ```
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { createLogger } from '../../../../shared/services/logger.service';
import type { CameraConfig } from '../../../../shared/types/common.types';
import type { GenericMeshData } from '../../../ast-to-csg-converter/types/conversion.types';
import type { Mesh3D } from '../../types/renderer.types';
import { CSGLighting } from '../csg-lighting';
import { configureRendererForCSG } from '../../services/lighting-fix/csg-lighting-setup';

const logger = createLogger('MeshDataScene');

/**
 * Props for the MeshDataScene component
 *
 * @interface MeshDataSceneProps
 */
export interface MeshDataSceneProps {
  readonly meshes: ReadonlyArray<GenericMeshData>;
  readonly camera: CameraConfig;
  readonly onCameraChange?: (camera: CameraConfig) => void;
  readonly onRenderComplete?: (meshes: ReadonlyArray<Mesh3D>) => void;
  readonly onRenderError?: (error: { message: string }) => void;
  /** Enable wireframe debug mode for better visualization */
  readonly debugWireframe?: boolean;
  /** Enable CSG-optimized shadows */
  readonly enableShadows?: boolean;
  /** Light intensity for CSG rendering */
  readonly lightIntensity?: number;
  /** Ambient light intensity */
  readonly ambientIntensity?: number;
}

/**
 * Generic Scene component that renders mesh data
 * 
 * This component is completely agnostic to OpenSCAD and only works with
 * generic mesh data structures. It provides optimized rendering for
 * CSG operations with proper lighting and material handling.
 */
export const MeshDataScene: React.FC<MeshDataSceneProps> = ({
  meshes,
  camera,
  onCameraChange,
  onRenderComplete,
  onRenderError,
  debugWireframe = false,
  enableShadows = true,
  lightIntensity = 100,
  ambientIntensity = 0.3,
}) => {
  const { scene, gl } = useThree();
  const meshesRef = useRef<Mesh3D[]>([]);
  const [isRendering, setIsRendering] = useState(false);

  logger.debug(`[RENDER] GenericScene received ${meshes.length} meshes`);

  /**
   * Convert generic mesh data to Three.js mesh
   */
  const convertToThreeMesh = useCallback((meshData: GenericMeshData): Mesh3D => {
    // Create Three.js material from generic material config
    const material = new THREE.MeshStandardMaterial({
      color: meshData.material.color,
      metalness: meshData.material.metalness,
      roughness: meshData.material.roughness,
      opacity: meshData.material.opacity,
      transparent: meshData.material.transparent,
      side: meshData.material.side === 'double' ? THREE.DoubleSide : 
            meshData.material.side === 'back' ? THREE.BackSide : THREE.FrontSide,
      wireframe: meshData.material.wireframe || debugWireframe,
    });

    // Create Three.js mesh
    const mesh = new THREE.Mesh(meshData.geometry, material);
    
    // Apply transform
    mesh.applyMatrix4(meshData.transform);
    
    // Configure for CSG operations
    mesh.castShadow = enableShadows;
    mesh.receiveShadow = enableShadows;

    // Create Mesh3D wrapper
    const mesh3D: Mesh3D = {
      mesh,
      metadata: {
        meshId: meshData.metadata.meshId,
        triangleCount: meshData.metadata.triangleCount,
        vertexCount: meshData.metadata.vertexCount,
        boundingBox: meshData.metadata.boundingBox,
        material: 'standard',
        color: meshData.material.color,
        opacity: meshData.material.opacity,
        visible: true,
        // Generic mesh metadata (no OpenSCAD-specific fields)
        depth: 0,
        childrenIds: [],
        size: 1,
        complexity: meshData.metadata.complexity,
        isOptimized: meshData.metadata.isOptimized,
        lastAccessed: meshData.metadata.lastAccessed,
      },
      dispose: () => {
        meshData.geometry.dispose();
        material.dispose();
      },
    };

    return mesh3D;
  }, [debugWireframe, enableShadows]);

  /**
   * Render meshes to the scene
   */
  useEffect(() => {
    const renderMeshes = async () => {
      if (!meshes || !Array.isArray(meshes)) {
        logger.warn('[RENDER] Meshes is undefined or not an array, skipping render');
        setIsRendering(false);
        onRenderComplete?.([]);
        return;
      }

      logger.debug(`[RENDER] Rendering ${meshes.length} generic meshes`);
      setIsRendering(true);

      try {
        // Clear existing meshes
        if (meshesRef.current && Array.isArray(meshesRef.current)) {
          meshesRef.current.forEach((mesh3D) => {
            scene.remove(mesh3D.mesh);
            mesh3D.dispose();
          });
        }
        meshesRef.current = [];

        // For empty meshes, complete immediately
        if (meshes.length === 0) {
          setIsRendering(false);
          onRenderComplete?.([]);
          return;
        }

        // Convert and add new meshes
        const newMeshes: Mesh3D[] = [];
        let hasErrors = false;

        for (let i = 0; i < meshes.length; i++) {
          const meshData = meshes[i];
          if (!meshData) {
            logger.warn(`[RENDER] Skipping undefined mesh at index ${i}`);
            continue;
          }

          try {
            logger.debug(`[RENDER] Converting mesh ${i} (${meshData.id})`);
            
            const mesh3D = convertToThreeMesh(meshData);
            
            // Add to scene
            scene.add(mesh3D.mesh);
            newMeshes.push(mesh3D);
            
            logger.debug(`[RENDER] Successfully added mesh ${i} to scene`);
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger.error(`[ERROR] Failed to render mesh ${i}:`, errorMessage);
            hasErrors = true;
            onRenderError?.({ message: `Failed to render mesh ${i}: ${errorMessage}` });
          }
        }

        // Update meshes reference
        meshesRef.current = newMeshes;
        setIsRendering(false);

        // Report completion
        if (!hasErrors) {
          logger.debug(`[RENDER] Render completed with ${newMeshes.length} meshes`);
          onRenderComplete?.(newMeshes);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error('[ERROR] Failed to render meshes:', errorMessage);
        setIsRendering(false);
        onRenderError?.({ message: errorMessage });
      }
    };

    renderMeshes();
  }, [meshes, scene, onRenderComplete, onRenderError, convertToThreeMesh]);

  // Configure renderer for CSG operations
  useEffect(() => {
    configureRendererForCSG(gl);
  }, [gl]);

  return (
    <>
      {/* CSG-optimized lighting */}
      <CSGLighting
        lightIntensity={lightIntensity}
        enableShadows={enableShadows}
      />
      
      {/* Camera controls would be added here if needed */}
      
      {/* Performance stats in development */}
      {process.env.NODE_ENV === 'development' && isRendering && (
        <mesh>
          <boxGeometry args={[0.1, 0.1, 0.1]} />
          <meshBasicMaterial color="red" />
        </mesh>
      )}
    </>
  );
};
