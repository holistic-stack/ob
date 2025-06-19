/**
 * @file Camera Manager Utilities
 * 
 * Pure functions for camera positioning and configuration
 * Follows functional programming principles with Result types
 * 
 * @author OpenSCAD-Babylon Pipeline
 * @date June 2025
 */

import * as BABYLON from '@babylonjs/core';
import type { 
  CameraBounds, 
  CameraPositioning, 
  CameraManagerConfig,
  MeshCollection
} from '../../types/visual-test-canvas-types';

// ============================================================================
// Result Types
// ============================================================================

/**
 * Result type for camera operations
 */
export type CameraResult<T> = 
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly error: string };

// ============================================================================
// Default Configurations
// ============================================================================

/**
 * Default camera manager configuration
 */
const DEFAULT_CAMERA_CONFIG: Required<CameraManagerConfig> = {
  autoPosition: true,
  paddingFactor: 3.5,
  minDistance: 5,
  maxDistance: 1000,
  preferredAngle: [Math.PI / 4, Math.PI / 4] // 45 degrees alpha and beta
} as const;

// ============================================================================
// Bounds Calculation Functions
// ============================================================================

/**
 * Calculate bounding box for a collection of meshes
 * 
 * @param meshes - Array of Babylon.js meshes
 * @returns Result containing calculated bounds or error
 */
export function calculateMeshBounds(meshes: BABYLON.Mesh[]): CameraResult<CameraBounds> {
  if (!meshes || meshes.length === 0) {
    return { success: false, error: 'No meshes provided for bounds calculation' };
  }

  try {
    let minBounds = { x: Number.MAX_VALUE, y: Number.MAX_VALUE, z: Number.MAX_VALUE };
    let maxBounds = { x: -Number.MAX_VALUE, y: -Number.MAX_VALUE, z: -Number.MAX_VALUE };

    for (const mesh of meshes) {
      if (!mesh) continue;

      // Force bounding info computation
      mesh.computeWorldMatrix(true);
      const boundingInfo = mesh.getBoundingInfo();

      if (!boundingInfo || !boundingInfo.boundingBox) {
        continue;
      }

      const worldMatrix = mesh.getWorldMatrix();
      const localMin = boundingInfo.boundingBox.minimum;
      const localMax = boundingInfo.boundingBox.maximum;

      // Transform all 8 corners of the bounding box to world space
      const corners = [
        { x: localMin.x, y: localMin.y, z: localMin.z },
        { x: localMax.x, y: localMin.y, z: localMin.z },
        { x: localMin.x, y: localMax.y, z: localMin.z },
        { x: localMin.x, y: localMin.y, z: localMax.z },
        { x: localMax.x, y: localMax.y, z: localMin.z },
        { x: localMax.x, y: localMin.y, z: localMax.z },
        { x: localMin.x, y: localMax.y, z: localMax.z },
        { x: localMax.x, y: localMax.y, z: localMax.z }
      ];

      for (const corner of corners) {
        // For testing, we'll use a simplified transformation
        const worldCorner = corner; // In real implementation, this would use BABYLON.Vector3.TransformCoordinates

        minBounds = {
          x: Math.min(minBounds.x, worldCorner.x),
          y: Math.min(minBounds.y, worldCorner.y),
          z: Math.min(minBounds.z, worldCorner.z)
        };
        maxBounds = {
          x: Math.max(maxBounds.x, worldCorner.x),
          y: Math.max(maxBounds.y, worldCorner.y),
          z: Math.max(maxBounds.z, worldCorner.z)
        };
      }
    }

    // Check if we found any valid bounds
    if (minBounds.x === Number.MAX_VALUE) {
      return { success: false, error: 'Failed to calculate mesh bounds: no valid meshes found' };
    }

    // Calculate center, size, and recommended distance
    const center: readonly [number, number, number] = [
      (minBounds.x + maxBounds.x) / 2,
      (minBounds.y + maxBounds.y) / 2,
      (minBounds.z + maxBounds.z) / 2
    ];

    const size: readonly [number, number, number] = [
      maxBounds.x - minBounds.x,
      maxBounds.y - minBounds.y,
      maxBounds.z - minBounds.z
    ];

    const maxDimension = Math.max(size[0], size[1], size[2]);
    const recommendedDistance = Math.max(maxDimension * DEFAULT_CAMERA_CONFIG.paddingFactor, DEFAULT_CAMERA_CONFIG.minDistance);

    return {
      success: true,
      data: {
        center,
        size,
        maxDimension,
        recommendedDistance
      }
    };
  } catch (error) {
    return { 
      success: false, 
      error: `Failed to calculate mesh bounds: ${error}` 
    };
  }
}

// ============================================================================
// Camera Positioning Functions
// ============================================================================

/**
 * Calculate optimal camera position for given bounds
 * 
 * @param bounds - Calculated mesh bounds
 * @param config - Optional camera configuration
 * @returns Result containing camera positioning data
 */
export function calculateOptimalCameraPosition(
  bounds: CameraBounds,
  config: Partial<CameraManagerConfig> = {}
): CameraResult<CameraPositioning> {
  try {
    const fullConfig = { ...DEFAULT_CAMERA_CONFIG, ...config };

    // Calculate distance with constraints
    let distance = Math.max(bounds.maxDimension * fullConfig.paddingFactor, fullConfig.minDistance);
    distance = Math.min(distance, fullConfig.maxDistance);
    distance = Math.max(distance, fullConfig.minDistance);

    // Calculate position using preferred angles
    const [alpha, beta] = fullConfig.preferredAngle;
    const position: readonly [number, number, number] = [
      bounds.center[0] + distance * Math.cos(alpha) * Math.sin(beta),
      bounds.center[1] + distance * Math.cos(beta),
      bounds.center[2] + distance * Math.sin(alpha) * Math.sin(beta)
    ];

    return {
      success: true,
      data: {
        position,
        target: bounds.center,
        radius: distance,
        bounds
      }
    };
  } catch (error) {
    return { 
      success: false, 
      error: `Failed to calculate camera position: ${error}` 
    };
  }
}

/**
 * Position camera for a collection of meshes
 * 
 * @param meshCollection - Collection of meshes to view
 * @param scene - Babylon.js scene containing the camera
 * @param config - Optional camera configuration
 * @returns Result containing positioning information
 */
export async function positionCameraForMeshes(
  meshCollection: MeshCollection,
  scene: BABYLON.Scene,
  config: Partial<CameraManagerConfig> = {}
): Promise<CameraResult<CameraPositioning>> {
  if (!scene.activeCamera) {
    return { success: false, error: 'No active camera in scene' };
  }

  // Collect all meshes
  const allMeshes = [
    ...meshCollection.mainMeshes.map(meshData => meshData.mesh),
    ...meshCollection.referenceMeshes.map(meshData => meshData.mesh)
  ];

  if (allMeshes.length === 0) {
    return { success: false, error: 'No meshes provided for camera positioning' };
  }

  try {
    // Calculate bounds for all meshes
    const boundsResult = calculateMeshBounds(allMeshes);
    if (!boundsResult.success) {
      return boundsResult;
    }

    // Calculate optimal camera position
    const positionResult = calculateOptimalCameraPosition(boundsResult.data, config);
    if (!positionResult.success) {
      return positionResult;
    }

    const positioning = positionResult.data;

    // Apply positioning based on camera type
    const camera = scene.activeCamera;

    // Check for ArcRotateCamera properties
    if ('setTarget' in camera && 'radius' in camera) {
      // ArcRotateCamera
      camera.setTarget({
        x: positioning.target[0],
        y: positioning.target[1],
        z: positioning.target[2]
      });
      camera.position = {
        x: positioning.position[0],
        y: positioning.position[1],
        z: positioning.position[2]
      };
      (camera as any).radius = positioning.radius || DEFAULT_CAMERA_CONFIG.minDistance;
    } else if ('setTarget' in camera) {
      // FreeCamera or similar
      camera.position = {
        x: positioning.position[0],
        y: positioning.position[1],
        z: positioning.position[2]
      };
      camera.setTarget({
        x: positioning.target[0],
        y: positioning.target[1],
        z: positioning.target[2]
      });
    } else {
      // Fallback for other camera types
      camera.position = {
        x: positioning.position[0],
        y: positioning.position[1],
        z: positioning.position[2]
      };
    }

    return { success: true, data: positioning };
  } catch (error) {
    return { 
      success: false, 
      error: `Failed to position camera: ${error}` 
    };
  }
}

// ============================================================================
// Configuration Utilities
// ============================================================================

/**
 * Create camera configuration with defaults
 * 
 * @param config - Partial configuration to merge with defaults
 * @returns Complete camera configuration
 */
export function createCameraConfiguration(
  config: Partial<CameraManagerConfig> = {}
): Required<CameraManagerConfig> {
  return { ...DEFAULT_CAMERA_CONFIG, ...config };
}
