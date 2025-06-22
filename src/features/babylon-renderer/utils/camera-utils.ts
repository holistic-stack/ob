/**
 * @file Camera Utilities
 * 
 * Shared utilities for camera operations to eliminate code duplication
 * between camera-service.ts and babylon-renderer.tsx
 * 
 * Follows DRY principle by extracting common camera manipulation patterns
 */

import * as BABYLON from '@babylonjs/core';
import type { 
  CameraPosition, 
  Result
} from '../types/babylon-types';

// ============================================================================
// Camera Validation Utilities
// ============================================================================

/**
 * Validate camera for operations
 * Pure function that checks camera validity
 */
export const validateCamera = (camera: BABYLON.ArcRotateCamera | null | undefined): Result<BABYLON.ArcRotateCamera, string> => {
  if (!camera) {
    return { success: false, error: 'Camera is null or undefined' };
  }
  
  if (camera.isDisposed) {
    return { success: false, error: 'Camera is disposed' };
  }
  
  return { success: true, data: camera };
};

/**
 * Validate mesh for operations
 * Pure function that checks mesh validity
 */
export const validateMesh = (mesh: BABYLON.AbstractMesh | null | undefined): Result<BABYLON.AbstractMesh, string> => {
  if (!mesh) {
    return { success: false, error: 'Mesh is null or undefined' };
  }
  
  if (mesh.isDisposed) {
    return { success: false, error: 'Mesh is disposed' };
  }
  
  return { success: true, data: mesh };
};

/**
 * Validate mesh array for operations
 * Pure function that checks mesh array validity
 */
export const validateMeshArray = (meshes: BABYLON.AbstractMesh[] | null | undefined): Result<BABYLON.AbstractMesh[], string> => {
  if (!meshes) {
    return { success: false, error: 'Mesh array is null or undefined' };
  }
  
  if (!Array.isArray(meshes)) {
    return { success: false, error: 'Meshes parameter is not an array' };
  }
  
  if (meshes.length === 0) {
    return { success: false, error: 'No meshes provided' };
  }
  
  // Filter out invalid meshes
  const validMeshes = meshes.filter(mesh => mesh && !mesh.isDisposed);
  if (validMeshes.length === 0) {
    return { success: false, error: 'No valid meshes found' };
  }
  
  return { success: true, data: validMeshes };
};

// ============================================================================
// Camera Application Utilities
// ============================================================================

/**
 * Apply camera position to ArcRotateCamera
 * Mutates the camera but provides consistent application logic
 */
export const applyCameraPosition = (
  camera: BABYLON.ArcRotateCamera, 
  position: CameraPosition
): Result<void, string> => {
  try {
    const [targetX, targetY, targetZ] = position.target;
    camera.setTarget(new BABYLON.Vector3(targetX, targetY, targetZ));
    camera.alpha = position.alpha;
    camera.beta = position.beta;
    camera.radius = position.radius;
    
    return { success: true, data: undefined };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown camera application error';
    return { success: false, error: `Failed to apply camera position: ${errorMessage}` };
  }
};

// ============================================================================
// Camera Logging Utilities
// ============================================================================

/**
 * Log camera position for debugging
 * Standardized logging format for camera operations
 */
export const logCameraPosition = (
  operation: string,
  camera: BABYLON.ArcRotateCamera,
  additionalInfo?: Record<string, unknown>
): void => {
  // Handle case where getTarget might not be available (e.g., in tests)
  let target;
  try {
    target = camera.getTarget ? camera.getTarget() : { x: 0, y: 0, z: 0 };
  } catch {
    target = { x: 0, y: 0, z: 0 };
  }

  const baseInfo = {
    target,
    alpha: camera.alpha,
    beta: camera.beta,
    radius: camera.radius
  };

  const logInfo = additionalInfo ? { ...baseInfo, ...additionalInfo } : baseInfo;

  console.log(`[CameraService] ${operation}:`, logInfo);
};

/**
 * Log camera operation result
 * Standardized logging for camera operation outcomes
 */
export const logCameraResult = <T>(
  operation: string,
  result: Result<T, string>,
  additionalInfo?: Record<string, unknown>
): void => {
  if (result.success) {
    console.log(`[CameraService] ${operation} completed successfully`, additionalInfo);
  } else {
    console.warn(`[CameraService] ${operation} failed:`, result.error, additionalInfo);
  }
};

// ============================================================================
// Error Handling Utilities
// ============================================================================

/**
 * Create standardized camera operation error
 * Consistent error message formatting
 */
export const createCameraError = (operation: string, error: unknown): string => {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  return `Failed to ${operation}: ${errorMessage}`;
};

/**
 * Wrap camera operation with error handling
 * Higher-order function for consistent error handling
 */
export const withCameraErrorHandling = <T>(
  operation: string,
  fn: () => T
): Result<T, string> => {
  try {
    const result = fn();
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: createCameraError(operation, error) };
  }
};

// ============================================================================
// Camera State Utilities
// ============================================================================

/**
 * Get current camera state
 * Pure function that extracts camera state information
 */
export const getCameraState = (camera: BABYLON.ArcRotateCamera): CameraPosition => {
  const target = camera.getTarget();
  return {
    target: [target.x, target.y, target.z],
    alpha: camera.alpha,
    beta: camera.beta,
    radius: camera.radius
  };
};

/**
 * Compare camera positions for equality
 * Pure function for camera position comparison
 */
export const compareCameraPositions = (
  pos1: CameraPosition, 
  pos2: CameraPosition, 
  tolerance: number = 0.001
): boolean => {
  const targetEqual = pos1.target.every((val, index) => 
    Math.abs(val - pos2.target[index]) < tolerance
  );
  
  return targetEqual &&
    Math.abs(pos1.alpha - pos2.alpha) < tolerance &&
    Math.abs(pos1.beta - pos2.beta) < tolerance &&
    Math.abs(pos1.radius - pos2.radius) < tolerance;
};

// All functions are already exported individually above
