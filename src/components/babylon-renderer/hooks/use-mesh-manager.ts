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
    const material = new BABYLON.StandardMaterial(name, scene);
    material.diffuseColor = new BABYLON.Color3(0.8, 0.6, 0.4);
    material.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);
    material.emissiveColor = new BABYLON.Color3(0.1, 0.1, 0.1);
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
      camera.setTarget(BABYLON.Vector3.Zero());
      camera.radius = 10;
      
      // Optional: Calculate optimal camera position based on mesh bounds
      try {
        const boundingInfo = mesh.getBoundingInfo();
        const size = boundingInfo.boundingBox.extendSize.length();
        if (size > 0) {
          camera.radius = Math.max(size * 2.5, 10);
        }
      } catch (boundsError) {
        console.warn('[WARN] Could not calculate mesh bounds:', boundsError);
      }
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
    if (!pipelineResult?.success || !pipelineResult.value || !scene) {
      console.log('[DEBUG] Cannot update mesh: invalid result or scene not ready');
      return;
    }

    console.log('[DEBUG] Processing pipeline result for mesh update');

    try {
      // Clear previous mesh first
      clearMesh();

      if (pipelineResult.value instanceof BABYLON.Mesh) {
        const sourceMesh = pipelineResult.value;
        
        // Create new mesh in our scene (avoiding WebGL context issues)
        const newMesh = BABYLON.MeshBuilder.CreateBox(
          `pipeline_mesh_${Date.now()}`, 
          { width: 2, height: 2, depth: 2 }, 
          scene
        );

        // Copy geometry data from source mesh
        copyGeometryData(sourceMesh, newMesh);

        // Copy transform properties
        newMesh.position = sourceMesh.position.clone();
        newMesh.rotation = sourceMesh.rotation.clone();
        newMesh.scaling = sourceMesh.scaling.clone();

        // Create and assign material
        const material = createMeshMaterial(`${newMesh.name}_material`, scene);
        newMesh.material = material;

        // Position camera to view the mesh
        positionCameraForMesh(newMesh, scene);

        // Update state
        setCurrentMesh(newMesh);
        console.log('[DEBUG] Mesh updated successfully');
      }

    } catch (processingError) {
      console.error('[ERROR] Failed to update mesh:', processingError);
    }
  }, [scene, copyGeometryData, createMeshMaterial, positionCameraForMesh, clearMesh]);

  return {
    currentMesh,
    updateMesh,
    clearMesh
  };
}
