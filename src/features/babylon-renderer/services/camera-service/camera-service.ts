/**
 * @file Camera Service
 * 
 * Pure functions for Babylon.js camera positioning and management
 * Provides automatic camera framing for meshes and optimal positioning
 * 
 * @author OpenSCAD-Babylon Pipeline
 * @version 1.0.0
 */

import * as BABYLON from '@babylonjs/core';
import type {
  CameraPosition,
  MeshBounds,
  CameraService,
  Result
} from '../../types/babylon-types';
import {
  validateCamera,
  validateMesh,
  validateMeshArray,
  applyCameraPosition,
  logCameraPosition,
  logCameraResult,
  withCameraErrorHandling
} from '../../utils/camera-utils';

// ============================================================================
// Mesh Bounds Calculation
// ============================================================================

/**
 * Calculate bounding box information for a single mesh
 * Pure function that extracts bounds data
 */
export const calculateMeshBounds = (mesh: BABYLON.AbstractMesh): Result<MeshBounds, string> => {
  try {
    if (!mesh || mesh.isDisposed) {
      return { success: false, error: 'Invalid or disposed mesh' };
    }

    // Force bounding info computation
    mesh.computeWorldMatrix(true);
    const boundingInfo = mesh.getBoundingInfo();
    
    if (!boundingInfo) {
      return { success: false, error: 'No bounding info available for mesh' };
    }

    const boundingBox = boundingInfo.boundingBox;
    const center = boundingBox.center;
    const extendSize = boundingBox.extendSize;
    
    // Calculate size as the maximum extent
    const size = Math.max(extendSize.x, extendSize.y, extendSize.z) * 2;
    
    const bounds: MeshBounds = {
      center: [center.x, center.y, center.z],
      size,
      min: [boundingBox.minimum.x, boundingBox.minimum.y, boundingBox.minimum.z],
      max: [boundingBox.maximum.x, boundingBox.maximum.y, boundingBox.maximum.z]
    };

    return { success: true, data: bounds };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown bounds calculation error';
    return { success: false, error: `Failed to calculate mesh bounds: ${errorMessage}` };
  }
};

/**
 * Calculate combined bounding box for multiple meshes
 * Pure function that finds the overall bounds of a mesh collection
 */
export const calculateSceneBounds = (meshes: BABYLON.AbstractMesh[]): Result<MeshBounds, string> => {
  try {
    if (!meshes || meshes.length === 0) {
      return { success: false, error: 'No meshes provided' };
    }

    // Filter out invalid meshes
    const validMeshes = meshes.filter(mesh => mesh && !mesh.isDisposed);
    if (validMeshes.length === 0) {
      return { success: false, error: 'No valid meshes found' };
    }

    console.log('[CAMERA] Calculating scene bounds for', validMeshes.length, 'meshes');

    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

    // Calculate overall bounds
    for (const mesh of validMeshes) {
      const boundsResult = calculateMeshBounds(mesh);
      if (boundsResult.success) {
        const bounds = boundsResult.data;
        console.log('[CAMERA] Mesh bounds:', {
          meshName: mesh.name,
          center: bounds.center,
          size: bounds.size,
          min: bounds.min,
          max: bounds.max
        });

        minX = Math.min(minX, bounds.min[0]);
        minY = Math.min(minY, bounds.min[1]);
        minZ = Math.min(minZ, bounds.min[2]);
        maxX = Math.max(maxX, bounds.max[0]);
        maxY = Math.max(maxY, bounds.max[1]);
        maxZ = Math.max(maxZ, bounds.max[2]);
      }
    }

    // Calculate center and size
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const centerZ = (minZ + maxZ) / 2;

    const sizeX = maxX - minX;
    const sizeY = maxY - minY;
    const sizeZ = maxZ - minZ;
    const size = Math.max(sizeX, sizeY, sizeZ);

    const sceneBounds: MeshBounds = {
      center: [centerX, centerY, centerZ],
      size,
      min: [minX, minY, minZ],
      max: [maxX, maxY, maxZ]
    };

    console.log('[CAMERA] Final scene bounds:', {
      center: sceneBounds.center,
      size: sceneBounds.size,
      dimensions: [sizeX, sizeY, sizeZ],
      min: sceneBounds.min,
      max: sceneBounds.max
    });

    return { success: true, data: sceneBounds };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown scene bounds calculation error';
    return { success: false, error: `Failed to calculate scene bounds: ${errorMessage}` };
  }
};

// ============================================================================
// Camera Positioning
// ============================================================================

/**
 * Calculate optimal camera position based on mesh bounds
 * Pure function following the patterns from lesson-learned.md
 */
export const calculateOptimalPosition = (bounds: MeshBounds): CameraPosition => {
  const [centerX, centerY, centerZ] = bounds.center;
  const size = bounds.size;

  // Calculate optimal distance based on size with minimum distance
  // Using 6x multiplier with additional padding for better coverage of spread out objects
  const baseDistance = Math.max(size * 6, 30);

  // Add extra padding for safety margin
  const paddedDistance = baseDistance * 1.2;

  // Optimal viewing angles for good perspective
  const alpha = -Math.PI / 4;  // 45 degrees around Y axis
  const beta = Math.PI / 3;    // 60 degrees from horizontal

  console.log('[CAMERA] Calculated optimal position:', {
    bounds,
    originalSize: size,
    baseDistance,
    paddedDistance,
    center: [centerX, centerY, centerZ]
  });

  return {
    target: [centerX, centerY, centerZ],
    radius: paddedDistance,
    alpha,
    beta
  };
};

/**
 * Position camera to frame a single mesh optimally
 * Mutates the camera but returns position info for logging
 */
export const positionCameraForMesh = (
  camera: BABYLON.ArcRotateCamera,
  mesh: BABYLON.AbstractMesh
): Result<CameraPosition, string> => {
  // Validate inputs using shared utilities
  const cameraValidation = validateCamera(camera);
  if (!cameraValidation.success) {
    return cameraValidation;
  }

  const meshValidation = validateMesh(mesh);
  if (!meshValidation.success) {
    return meshValidation;
  }

  // Calculate mesh bounds
  const boundsResult = calculateMeshBounds(mesh);
  if (!boundsResult.success) {
    return { success: false, error: `Failed to calculate bounds: ${boundsResult.error}` };
  }

  // Calculate optimal position
  const position = calculateOptimalPosition(boundsResult.data);

  // Apply position to camera using shared utility
  const applyResult = applyCameraPosition(camera, position);
  if (!applyResult.success) {
    return applyResult;
  }

  // Log result using shared utility
  logCameraPosition('Camera positioned for mesh', camera, {
    meshName: mesh.name
  });

  return { success: true, data: position };
};

/**
 * Position camera to frame multiple meshes optimally
 * Calculates scene bounds and positions camera to show all meshes
 */
export const positionCameraForScene = (
  camera: BABYLON.ArcRotateCamera,
  meshes: BABYLON.AbstractMesh[]
): Result<CameraPosition, string> => {
  // Validate inputs using shared utilities
  const cameraValidation = validateCamera(camera);
  if (!cameraValidation.success) {
    return cameraValidation;
  }

  const meshValidation = validateMeshArray(meshes);
  if (!meshValidation.success) {
    return meshValidation;
  }

  // Calculate scene bounds
  const boundsResult = calculateSceneBounds(meshValidation.data);
  if (!boundsResult.success) {
    return { success: false, error: `Failed to calculate scene bounds: ${boundsResult.error}` };
  }

  // Calculate optimal position
  const position = calculateOptimalPosition(boundsResult.data);

  // Apply position to camera using shared utility
  const applyResult = applyCameraPosition(camera, position);
  if (!applyResult.success) {
    return applyResult;
  }

  // Log result using shared utility
  logCameraPosition('Camera positioned for scene', camera, {
    meshCount: meshValidation.data.length,
    sceneBounds: boundsResult.data
  });

  return { success: true, data: position };
};

/**
 * Reset camera to default position
 * Useful for manual camera reset functionality
 */
export const resetCamera = (camera: BABYLON.ArcRotateCamera): void => {
  const result = withCameraErrorHandling('reset camera', () => {
    // Validate camera using shared utility
    const validation = validateCamera(camera);
    if (!validation.success) {
      console.warn('[CameraService] Cannot reset camera:', validation.error);
      return validation;
    }

    // Define default position
    const defaultPosition: CameraPosition = {
      target: [0, 0, 0],
      alpha: -Math.PI / 4,
      beta: Math.PI / 3,
      radius: 20
    };

    // Apply default position using shared utility
    const applyResult = applyCameraPosition(camera, defaultPosition);
    if (!applyResult.success) {
      return applyResult;
    }

    // Log result using shared utility
    logCameraPosition('Camera reset to default position', camera);

    return { success: true, data: undefined };
  });

  // Log any errors that occurred
  if (!result.success) {
    console.error('[CameraService] Failed to reset camera:', result.error);
  }
};

// ============================================================================
// Service Implementation
// ============================================================================

/**
 * Camera service implementation
 * Provides all camera positioning functionality
 */
export const cameraService: CameraService = {
  positionCameraForMesh,
  resetCamera,
  calculateOptimalPosition
} as const;

// ============================================================================
// Default Export
// ============================================================================

export default cameraService;
