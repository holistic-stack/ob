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
import { PipelineResult, MeshGeometryData } from '../../../types/pipeline-types';

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

  // Create mesh from geometry data (DRY principle)
  const createMeshFromGeometryData = useCallback((geometryData: MeshGeometryData, scene: BABYLON.Scene): BABYLON.Mesh | null => {
    try {
      console.log('[DEBUG] Creating mesh from geometry data:', geometryData.name);

      // Create a new mesh
      const mesh = new BABYLON.Mesh(geometryData.name, scene);

      // Set vertex data
      if (geometryData.positions && geometryData.positions.length > 0) {
        mesh.setVerticesData(BABYLON.VertexBuffer.PositionKind, geometryData.positions);
        console.log('[DEBUG] Set positions:', geometryData.positions.length / 3, 'vertices');
      }

      if (geometryData.normals && geometryData.normals.length > 0) {
        mesh.setVerticesData(BABYLON.VertexBuffer.NormalKind, geometryData.normals);
        console.log('[DEBUG] Set normals:', geometryData.normals.length / 3, 'normals');
      }

      if (geometryData.uvs && geometryData.uvs.length > 0) {
        mesh.setVerticesData(BABYLON.VertexBuffer.UVKind, geometryData.uvs);
        console.log('[DEBUG] Set UVs:', geometryData.uvs.length / 2, 'UV coordinates');
      }

      if (geometryData.indices && geometryData.indices.length > 0) {
        mesh.setIndices(geometryData.indices);
        console.log('[DEBUG] Set indices:', geometryData.indices.length, 'indices');
      }

      // Create and apply material
      const material = createMeshMaterial(`${geometryData.name}_material`, scene);

      // Apply material data if available
      if (geometryData.materialData) {
        material.diffuseColor = new BABYLON.Color3(...geometryData.materialData.diffuseColor);
        material.specularColor = new BABYLON.Color3(...geometryData.materialData.specularColor);
        material.emissiveColor = new BABYLON.Color3(...geometryData.materialData.emissiveColor);
        console.log('[DEBUG] Applied material data from geometry');
      }

      mesh.material = material;

      // Ensure mesh is visible and enabled
      mesh.isVisible = true;
      mesh.setEnabled(true);

      // Position at origin
      mesh.position = BABYLON.Vector3.Zero();

      // Force refresh of mesh bounds
      mesh.refreshBoundingInfo();

      console.log('[DEBUG] Mesh created successfully:', {
        name: mesh.name,
        vertices: mesh.getTotalVertices(),
        indices: mesh.getTotalIndices(),
        hasGeometry: mesh.geometry !== null,
        hasMaterial: mesh.material !== null
      });

      return mesh;
    } catch (geometryError) {
      console.error('[ERROR] Could not create mesh from geometry data:', geometryError);
      return null;
    }
  }, [createMeshMaterial]);

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

  // Update mesh from pipeline result (simplified approach using geometry data)
  const updateMesh = useCallback((pipelineResult: PipelineResult) => {
    if (!pipelineResult?.success || !scene) {
      console.log('[DEBUG] Cannot update mesh: invalid result or scene not ready');
      return;
    }

    console.log('[DEBUG] Processing pipeline result for mesh update');

    try {
      // Clear previous mesh first
      clearMesh();

      // Handle different types of pipeline results
      if (pipelineResult.value === null) {
        console.log('[DEBUG] Pipeline result is null (empty geometry)');
        setCurrentMesh(null);
        return;
      }

      // Check if the result is geometry data (new format)
      if (pipelineResult.value && typeof pipelineResult.value === 'object' && 'positions' in pipelineResult.value) {
        const geometryData = pipelineResult.value as MeshGeometryData;
        console.log('[DEBUG] Processing geometry data:', geometryData.name);

        // Create mesh from geometry data in the target scene
        const newMesh = createMeshFromGeometryData(geometryData, scene);

        if (newMesh) {
          // Position camera to view the mesh
          positionCameraForMesh(newMesh, scene);

          // Update state
          setCurrentMesh(newMesh);
          console.log('[DEBUG] Mesh updated successfully from geometry data');
        } else {
          console.error('[ERROR] Failed to create mesh from geometry data');
        }
      }
      // Handle legacy mesh format (for backward compatibility)
      else if (pipelineResult.value instanceof BABYLON.Mesh) {
        const sourceMesh = pipelineResult.value;
        console.log('[DEBUG] Processing legacy mesh format:', sourceMesh.name);
        console.warn('[WARN] Legacy mesh format detected - this may not render correctly due to scene isolation');

        // Try to use the mesh directly if it's in the same scene
        if (sourceMesh.getScene() === scene) {
          // Ensure the mesh has a material
          if (!sourceMesh.material) {
            const material = createMeshMaterial(`${sourceMesh.name}_material`, scene);
            sourceMesh.material = material;
          }

          // Position camera to view the mesh
          positionCameraForMesh(sourceMesh, scene);

          // Update state
          setCurrentMesh(sourceMesh);
          console.log('[DEBUG] Mesh updated successfully (legacy direct use)');
        } else {
          console.error('[ERROR] Cannot use mesh from different scene - geometry data format required');
        }
      }
      else {
        console.warn('[WARN] Unknown pipeline result format:', typeof pipelineResult.value);
      }

    } catch (processingError) {
      console.error('[ERROR] Failed to update mesh:', processingError);
    }
  }, [scene, createMeshFromGeometryData, positionCameraForMesh, clearMesh]);

  return {
    currentMesh,
    updateMesh,
    clearMesh
  };
}
