/**
 * @file Mesh Manager Hook (SRP: Mesh Management Only)
 * 
 * Custom hook following Single Responsibility Principle:
 * - Only manages mesh lifecycle and updates
 * - Handles pipeline result processing
 * - Provides current mesh state and update functions
 * 
 * @author Luciano Júnior
 * @date June 2025
 */

import { useState, useCallback, useMemo as _useMemo } from 'react';
import * as BABYLON from '@babylonjs/core';
import { PipelineResult } from '../../../types/pipeline-types';

interface MeshManagerState {
  currentMesh: BABYLON.Mesh | null;
  updateMesh: (pipelineResult: PipelineResult) => void;
  clearMesh: () => void;
}

/**
 * Hook for managing mesh lifecycle and updates
 * Follows SRP: Only handles mesh creation, updates, and cleanup
 */
export function useMeshManager(scene: BABYLON.Scene | null): MeshManagerState {
  const [currentMesh, setCurrentMesh] = useState<BABYLON.Mesh | null>(null);

  // Create material for mesh (DRY principle - reusable function)
  const createMeshMaterial = useCallback((name: string, scene: BABYLON.Scene): BABYLON.StandardMaterial => {
    console.log('[DEBUG] Creating material for mesh:', name);

    const material = new BABYLON.StandardMaterial(name, scene);

    // Enhanced material properties for better visibility
    material.diffuseColor = new BABYLON.Color3(0.8, 0.6, 0.4); // Orange-brown color
    material.specularColor = new BABYLON.Color3(0.3, 0.3, 0.3); // Increased specular
    material.emissiveColor = new BABYLON.Color3(0.1, 0.1, 0.1); // Slight glow

    // Ensure material is visible from both sides
    material.backFaceCulling = false;

    // Add wireframe option for debugging (can be toggled)
    material.wireframe = false;

    // Store reference for debugging
    (material as any)._debugWireframe = false;

    // Ensure material responds to lighting
    material.disableLighting = false;

    console.log('[DEBUG] Material created with properties:', {
      diffuseColor: material.diffuseColor.toString(),
      specularColor: material.specularColor.toString(),
      emissiveColor: material.emissiveColor.toString(),
      backFaceCulling: material.backFaceCulling,
      wireframe: material.wireframe
    });

    return material;
  }, []);

  // Copy geometry data from source mesh (DRY principle)
  const copyGeometryData = useCallback((sourceMesh: BABYLON.Mesh, targetMesh: BABYLON.Mesh): void => {
    try {
      const positions = sourceMesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
      const normals = sourceMesh.getVerticesData(BABYLON.VertexBuffer.NormalKind);
      const indices = sourceMesh.getIndices();

      if (positions && positions.length > 0) {
        targetMesh.setVerticesData(BABYLON.VertexBuffer.PositionKind, positions);
      }
      if (normals && normals.length > 0) {
        targetMesh.setVerticesData(BABYLON.VertexBuffer.NormalKind, normals);
      }
      if (indices && indices.length > 0) {
        targetMesh.setIndices(indices);
      }
    } catch (geometryError) {
      console.warn('[WARN] Could not copy geometry data:', geometryError);
    }
  }, []);

  // Position camera to view mesh (DRY principle)
  const positionCameraForMesh = useCallback((mesh: BABYLON.Mesh, scene: BABYLON.Scene): void => {
    const camera = scene.activeCamera as BABYLON.ArcRotateCamera;
    if (camera && camera instanceof BABYLON.ArcRotateCamera) {
      console.log('[DEBUG] Positioning camera for mesh:', mesh.name);

      // Calculate mesh center and bounds
      try {
        const boundingInfo = mesh.getBoundingInfo();
        const center = boundingInfo.boundingBox.center;
        const size = boundingInfo.boundingBox.extendSize.length();

        console.log('[DEBUG] Mesh bounds:', {
          center: center.toString(),
          size,
          min: boundingInfo.boundingBox.minimum.toString(),
          max: boundingInfo.boundingBox.maximum.toString()
        });

        // Set camera target to mesh center
        camera.setTarget(center);

        // Calculate optimal camera distance (ensure we can see the whole mesh)
        const optimalRadius = Math.max(size * 3, 15); // Increased multiplier and minimum distance
        camera.radius = optimalRadius;

        // Set camera angles for good viewing
        camera.alpha = -Math.PI / 4; // 45 degrees around Y axis
        camera.beta = Math.PI / 3;   // 60 degrees from horizontal

        console.log('[DEBUG] Camera positioned:', {
          target: center.toString(),
          radius: optimalRadius,
          alpha: camera.alpha,
          beta: camera.beta
        });

      } catch (boundsError) {
        console.warn('[WARN] Could not calculate mesh bounds, using default camera position:', boundsError);
        // Fallback to default position
        camera.setTarget(BABYLON.Vector3.Zero());
        camera.radius = 20; // Increased default distance
        camera.alpha = -Math.PI / 4;
        camera.beta = Math.PI / 3;
      }
    } else {
      console.warn('[WARN] No ArcRotateCamera found for positioning');
    }
  }, []);

  // Clear current mesh (stable function - no dependencies)
  const clearMesh = useCallback(() => {
    setCurrentMesh(prevMesh => {
      if (prevMesh && !prevMesh.isDisposed()) {
        console.log('[DEBUG] Disposing current mesh:', prevMesh.name);
        prevMesh.dispose();
      }
      return null;
    });
  }, []);

  // Update mesh from pipeline result (avoiding useEffect - using event handler pattern)
  const updateMesh = useCallback((pipelineResult: PipelineResult) => {
    if (!pipelineResult?.success || !scene) {
      console.log('[DEBUG] Cannot update mesh: invalid result or scene not ready');
      return;
    }

    console.log('[DEBUG] Processing pipeline result for mesh update');

    try {
      // Clear previous mesh first
      clearMesh();

      if (pipelineResult.value && pipelineResult.value instanceof BABYLON.Mesh) {
        const sourceMesh = pipelineResult.value;

        console.log('[DEBUG] Source mesh details:', {
          name: sourceMesh.name,
          vertices: sourceMesh.getTotalVertices(),
          indices: sourceMesh.getTotalIndices(),
          hasGeometry: sourceMesh.geometry !== null,
          hasMaterial: sourceMesh.material !== null,
          position: sourceMesh.position.toString(),
          scaling: sourceMesh.scaling.toString(),
          isVisible: sourceMesh.isVisible,
          isEnabled: sourceMesh.isEnabled(),
          isReady: sourceMesh.isReady()
        });

        // Ensure mesh is visible and enabled
        sourceMesh.isVisible = true;
        sourceMesh.setEnabled(true);

        // Disable frustum culling to ensure mesh is always rendered
        sourceMesh.alwaysSelectAsActiveMesh = true;

        // Ensure mesh is at origin for proper camera positioning
        if (sourceMesh.position.length() > 0.1) {
          console.log('[DEBUG] Mesh not at origin, centering it');
          sourceMesh.position = BABYLON.Vector3.Zero();
        }

        // Force mesh to be in active meshes list
        const activeMeshes = scene.getActiveMeshes();
        if (activeMeshes.indexOf(sourceMesh) === -1) {
          console.log('[DEBUG] Adding mesh to active meshes list');
          scene.registerBeforeRender(() => {
            const currentActiveMeshes = scene.getActiveMeshes();
            if (currentActiveMeshes.indexOf(sourceMesh) === -1) {
              currentActiveMeshes.push(sourceMesh);
            }
          });
        }

        // Check if the source mesh has the same scene
        if (sourceMesh.getScene() === scene) {
          console.log('[DEBUG] Source mesh is already in target scene, using directly');

          // Ensure the mesh has a material
          if (!sourceMesh.material) {
            const material = createMeshMaterial(`${sourceMesh.name}_material`, scene);
            sourceMesh.material = material;
          }

          // Position camera to view the mesh
          positionCameraForMesh(sourceMesh, scene);

          // Update state
          setCurrentMesh(sourceMesh);
          console.log('[DEBUG] Mesh updated successfully (direct use)');
        } else {
          console.log('[DEBUG] Source mesh from different scene, cloning to target scene');

          // Clone the mesh to our scene
          const clonedMesh = sourceMesh.clone(`${sourceMesh.name}_cloned`, null);
          if (clonedMesh) {
            console.log('[DEBUG] Cloned mesh details:', {
              name: clonedMesh.name,
              vertices: clonedMesh.getTotalVertices(),
              indices: clonedMesh.getTotalIndices(),
              hasGeometry: clonedMesh.geometry !== null,
              position: clonedMesh.position.toString()
            });

            // Ensure the cloned mesh is visible and enabled
            clonedMesh.isVisible = true;
            clonedMesh.setEnabled(true);

            // Disable frustum culling for cloned mesh
            clonedMesh.alwaysSelectAsActiveMesh = true;

            // Ensure mesh is at origin for proper camera positioning
            clonedMesh.position = BABYLON.Vector3.Zero();

            // Force refresh of mesh bounds
            clonedMesh.refreshBoundingInfo();

            // Ensure mesh is in the render list
            clonedMesh.setEnabled(true);
            scene.registerBeforeRender(() => {
              const currentActiveMeshes = scene.getActiveMeshes();
              if (currentActiveMeshes.indexOf(clonedMesh) === -1) {
                currentActiveMeshes.push(clonedMesh);
              }
            });

            // Ensure the cloned mesh has a material
            if (!clonedMesh.material) {
              const material = createMeshMaterial(`${clonedMesh.name}_material`, scene);
              clonedMesh.material = material;
            }

            // Position camera to view the mesh
            positionCameraForMesh(clonedMesh, scene);

            // Update state
            setCurrentMesh(clonedMesh);
            console.log('[DEBUG] Mesh updated successfully (cloned)');
          } else {
            console.error('[ERROR] Failed to clone mesh');
          }
        }
      } else if (pipelineResult.value === null) {
        console.log('[DEBUG] Pipeline result is null (empty geometry)');
        setCurrentMesh(null);
      } else {
        console.warn('[WARN] Pipeline result value is not a Babylon.js mesh:', typeof pipelineResult.value);
      }

    } catch (processingError) {
      console.error('[ERROR] Failed to update mesh:', processingError);
    }
  }, [scene, createMeshMaterial, positionCameraForMesh, clearMesh]);

  return {
    currentMesh,
    updateMesh,
    clearMesh
  };
}
