/**
 * @file R3F Camera Service
 * 
 * React Three Fiber camera service providing equivalent functionality to Babylon.js
 * camera system. Handles camera positioning, mesh framing, bounds calculation,
 * and camera reset functionality with pure functions and Result<T,E> patterns.
 * 
 * @author OpenSCAD-R3F Pipeline
 * @version 1.0.0
 */

import * as THREE from 'three';
import type { Result } from '../../../csg-processor';

// ============================================================================
// Types
// ============================================================================

/**
 * Camera position information equivalent to Babylon.js CameraPosition
 */
export interface R3FCameraPosition {
  readonly position: readonly [number, number, number];
  readonly target: readonly [number, number, number];
  readonly distance: number;
  readonly spherical: {
    readonly radius: number;
    readonly phi: number;    // vertical angle (0 to PI)
    readonly theta: number;  // horizontal angle (0 to 2*PI)
  };
}

/**
 * Mesh bounds information for camera positioning
 */
export interface R3FMeshBounds {
  readonly center: readonly [number, number, number];
  readonly size: number;
  readonly min: readonly [number, number, number];
  readonly max: readonly [number, number, number];
  readonly boundingBox: THREE.Box3;
  readonly boundingSphere: THREE.Sphere;
}

/**
 * Camera configuration for R3F
 */
export interface R3FCameraConfig {
  readonly type?: 'perspective' | 'orthographic';
  readonly fov?: number;
  readonly aspect?: number;
  readonly near?: number;
  readonly far?: number;
  readonly position?: readonly [number, number, number];
  readonly target?: readonly [number, number, number];
}

/**
 * Camera controls reference for manipulation
 */
export interface R3FCameraControls {
  readonly camera: THREE.Camera;
  readonly controls?: {
    readonly target: THREE.Vector3;
    readonly object: THREE.Camera;
    readonly update: () => void;
    readonly reset: () => void;
    readonly saveState: () => void;
    readonly enabled: boolean;
  };
}

/**
 * R3F Camera service interface
 */
export interface R3FCameraService {
  readonly calculateMeshBounds: (mesh: THREE.Mesh) => Result<R3FMeshBounds, string>;
  readonly calculateSceneBounds: (meshes: readonly THREE.Mesh[]) => Result<R3FMeshBounds, string>;
  readonly calculateOptimalPosition: (bounds: R3FMeshBounds, padding?: number) => R3FCameraPosition;
  readonly positionCameraForMesh: (camera: THREE.Camera, mesh: THREE.Mesh, controls?: any) => Result<R3FCameraPosition, string>;
  readonly positionCameraForScene: (camera: THREE.Camera, meshes: readonly THREE.Mesh[], controls?: any) => Result<R3FCameraPosition, string>;
  readonly resetCamera: (camera: THREE.Camera, controls?: any) => Result<R3FCameraPosition, string>;
  readonly applyCameraPosition: (camera: THREE.Camera, position: R3FCameraPosition, controls?: any) => Result<void, string>;
}

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_CAMERA_POSITION: R3FCameraPosition = {
  position: [15, 15, 15],
  target: [0, 0, 0],
  distance: Math.sqrt(15 * 15 + 15 * 15 + 15 * 15),
  spherical: {
    radius: Math.sqrt(15 * 15 + 15 * 15 + 15 * 15),
    phi: Math.acos(15 / Math.sqrt(15 * 15 + 15 * 15 + 15 * 15)),
    theta: Math.atan2(15, 15)
  }
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Create R3F camera error with proper formatting
 */
function createR3FCameraError(message: string, operation: string): string {
  return `[R3F Camera Service] ${operation}: ${message}`;
}

/**
 * Validate Three.js camera
 */
function validateCamera(camera: THREE.Camera): Result<THREE.Camera, string> {
  if (!camera) {
    return { success: false, error: createR3FCameraError('Camera is null or undefined', 'validation') };
  }
  
  if (!(camera instanceof THREE.Camera)) {
    return { success: false, error: createR3FCameraError('Invalid camera type', 'validation') };
  }
  
  return { success: true, data: camera };
}

/**
 * Validate Three.js mesh
 */
function validateMesh(mesh: THREE.Mesh): Result<THREE.Mesh, string> {
  if (!mesh) {
    return { success: false, error: createR3FCameraError('Mesh is null or undefined', 'validation') };
  }
  
  if (!(mesh instanceof THREE.Mesh)) {
    return { success: false, error: createR3FCameraError('Invalid mesh type', 'validation') };
  }
  
  if (!mesh.geometry) {
    return { success: false, error: createR3FCameraError('Mesh has no geometry', 'validation') };
  }
  
  return { success: true, data: mesh };
}

/**
 * Convert spherical coordinates to Cartesian position
 */
function sphericalToCartesian(
  spherical: R3FCameraPosition['spherical'],
  target: readonly [number, number, number]
): readonly [number, number, number] {
  const { radius, phi, theta } = spherical;
  const [tx, ty, tz] = target;
  
  const x = tx + radius * Math.sin(phi) * Math.cos(theta);
  const y = ty + radius * Math.cos(phi);
  const z = tz + radius * Math.sin(phi) * Math.sin(theta);
  
  return [x, y, z];
}

/**
 * Convert Cartesian position to spherical coordinates
 */
function cartesianToSpherical(
  position: readonly [number, number, number],
  target: readonly [number, number, number]
): R3FCameraPosition['spherical'] {
  const [px, py, pz] = position;
  const [tx, ty, tz] = target;
  
  const dx = px - tx;
  const dy = py - ty;
  const dz = pz - tz;
  
  const radius = Math.sqrt(dx * dx + dy * dy + dz * dz);
  const phi = Math.acos(dy / radius);
  const theta = Math.atan2(dz, dx);
  
  return { radius, phi, theta };
}

// ============================================================================
// Bounds Calculation Functions
// ============================================================================

/**
 * Calculate bounds for a single mesh
 */
export function calculateMeshBounds(mesh: THREE.Mesh): Result<R3FMeshBounds, string> {
  try {
    const validation = validateMesh(mesh);
    if (!validation.success) {
      return validation;
    }

    // Ensure geometry has bounding box
    if (!mesh.geometry.boundingBox) {
      mesh.geometry.computeBoundingBox();
    }

    const boundingBox = mesh.geometry.boundingBox!.clone();
    
    // Apply mesh transform to bounding box
    boundingBox.applyMatrix4(mesh.matrixWorld);

    const center = boundingBox.getCenter(new THREE.Vector3());
    const size = boundingBox.getSize(new THREE.Vector3());
    const maxDimension = Math.max(size.x, size.y, size.z);

    // Create bounding sphere
    const boundingSphere = new THREE.Sphere();
    boundingBox.getBoundingSphere(boundingSphere);

    const bounds: R3FMeshBounds = {
      center: [center.x, center.y, center.z],
      size: maxDimension,
      min: [boundingBox.min.x, boundingBox.min.y, boundingBox.min.z],
      max: [boundingBox.max.x, boundingBox.max.y, boundingBox.max.z],
      boundingBox,
      boundingSphere
    };

    return { success: true, data: bounds };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown bounds calculation error';
    return { 
      success: false, 
      error: createR3FCameraError(`Failed to calculate mesh bounds: ${errorMessage}`, 'calculateMeshBounds')
    };
  }
}

/**
 * Calculate bounds for multiple meshes (scene bounds)
 */
export function calculateSceneBounds(meshes: readonly THREE.Mesh[]): Result<R3FMeshBounds, string> {
  try {
    if (!meshes || meshes.length === 0) {
      return { 
        success: false, 
        error: createR3FCameraError('No meshes provided', 'calculateSceneBounds')
      };
    }

    // Validate all meshes
    for (const mesh of meshes) {
      const validation = validateMesh(mesh);
      if (!validation.success) {
        return validation;
      }
    }

    // Calculate combined bounding box
    const combinedBox = new THREE.Box3();
    
    for (const mesh of meshes) {
      if (!mesh.geometry.boundingBox) {
        mesh.geometry.computeBoundingBox();
      }
      
      const meshBox = mesh.geometry.boundingBox!.clone();
      meshBox.applyMatrix4(mesh.matrixWorld);
      combinedBox.union(meshBox);
    }

    const center = combinedBox.getCenter(new THREE.Vector3());
    const size = combinedBox.getSize(new THREE.Vector3());
    const maxDimension = Math.max(size.x, size.y, size.z);

    // Create bounding sphere
    const boundingSphere = new THREE.Sphere();
    combinedBox.getBoundingSphere(boundingSphere);

    const bounds: R3FMeshBounds = {
      center: [center.x, center.y, center.z],
      size: maxDimension,
      min: [combinedBox.min.x, combinedBox.min.y, combinedBox.min.z],
      max: [combinedBox.max.x, combinedBox.max.y, combinedBox.max.z],
      boundingBox: combinedBox,
      boundingSphere
    };

    return { success: true, data: bounds };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown scene bounds calculation error';
    return { 
      success: false, 
      error: createR3FCameraError(`Failed to calculate scene bounds: ${errorMessage}`, 'calculateSceneBounds')
    };
  }
}

// ============================================================================
// Camera Positioning Functions
// ============================================================================

/**
 * Calculate optimal camera position for given bounds
 */
export function calculateOptimalPosition(
  bounds: R3FMeshBounds, 
  padding: number = 1.5
): R3FCameraPosition {
  const [cx, cy, cz] = bounds.center;
  const size = bounds.size;
  
  // Calculate optimal distance based on size and padding
  const distance = size * padding;
  
  // Default viewing angle (45 degrees from each axis)
  const phi = Math.PI / 4;     // 45 degrees from vertical
  const theta = Math.PI / 4;   // 45 degrees from horizontal
  
  const spherical = {
    radius: distance,
    phi,
    theta
  };
  
  const position = sphericalToCartesian(spherical, bounds.center);
  
  return {
    position,
    target: bounds.center,
    distance,
    spherical
  };
}

/**
 * Apply camera position to Three.js camera and controls
 */
export function applyCameraPosition(
  camera: THREE.Camera,
  position: R3FCameraPosition,
  controls?: any
): Result<void, string> {
  try {
    const validation = validateCamera(camera);
    if (!validation.success) {
      return validation;
    }

    const [px, py, pz] = position.position;
    const [tx, ty, tz] = position.target;

    // Set camera position
    camera.position.set(px, py, pz);

    // Set camera target/lookAt
    if (camera instanceof THREE.PerspectiveCamera || camera instanceof THREE.OrthographicCamera) {
      camera.lookAt(tx, ty, tz);
      camera.updateProjectionMatrix();
    }

    // Update controls if provided
    if (controls) {
      if (controls.target) {
        controls.target.set(tx, ty, tz);
      }
      if (controls.update) {
        controls.update();
      }
    }

    return { success: true, data: undefined };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown camera positioning error';
    return {
      success: false,
      error: createR3FCameraError(`Failed to apply camera position: ${errorMessage}`, 'applyCameraPosition')
    };
  }
}

/**
 * Position camera for a single mesh (equivalent to Babylon's positionCameraForMesh)
 */
export function positionCameraForMesh(
  camera: THREE.Camera,
  mesh: THREE.Mesh,
  controls?: any
): Result<R3FCameraPosition, string> {
  try {
    const boundsResult = calculateMeshBounds(mesh);
    if (!boundsResult.success) {
      return boundsResult;
    }

    const optimalPosition = calculateOptimalPosition(boundsResult.data);

    const applyResult = applyCameraPosition(camera, optimalPosition, controls);
    if (!applyResult.success) {
      return applyResult;
    }

    console.log('[R3F Camera Service] Positioned camera for mesh:', {
      meshName: mesh.name || 'unnamed',
      bounds: boundsResult.data,
      position: optimalPosition
    });

    return { success: true, data: optimalPosition };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown mesh positioning error';
    return {
      success: false,
      error: createR3FCameraError(`Failed to position camera for mesh: ${errorMessage}`, 'positionCameraForMesh')
    };
  }
}

/**
 * Position camera for multiple meshes (scene framing)
 */
export function positionCameraForScene(
  camera: THREE.Camera,
  meshes: readonly THREE.Mesh[],
  controls?: any
): Result<R3FCameraPosition, string> {
  try {
    const boundsResult = calculateSceneBounds(meshes);
    if (!boundsResult.success) {
      return boundsResult;
    }

    const optimalPosition = calculateOptimalPosition(boundsResult.data);

    const applyResult = applyCameraPosition(camera, optimalPosition, controls);
    if (!applyResult.success) {
      return applyResult;
    }

    console.log('[R3F Camera Service] Positioned camera for scene:', {
      meshCount: meshes.length,
      bounds: boundsResult.data,
      position: optimalPosition
    });

    return { success: true, data: optimalPosition };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown scene positioning error';
    return {
      success: false,
      error: createR3FCameraError(`Failed to position camera for scene: ${errorMessage}`, 'positionCameraForScene')
    };
  }
}

/**
 * Reset camera to default position (equivalent to Babylon's resetCamera)
 */
export function resetCamera(
  camera: THREE.Camera,
  controls?: any
): Result<R3FCameraPosition, string> {
  try {
    const validation = validateCamera(camera);
    if (!validation.success) {
      return validation;
    }

    const applyResult = applyCameraPosition(camera, DEFAULT_CAMERA_POSITION, controls);
    if (!applyResult.success) {
      return applyResult;
    }

    console.log('[R3F Camera Service] Camera reset to default position:', DEFAULT_CAMERA_POSITION);

    return { success: true, data: DEFAULT_CAMERA_POSITION };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown camera reset error';
    return {
      success: false,
      error: createR3FCameraError(`Failed to reset camera: ${errorMessage}`, 'resetCamera')
    };
  }
}

// ============================================================================
// Service Implementation
// ============================================================================

/**
 * R3F Camera service implementation providing full Babylon.js camera equivalency
 */
export const r3fCameraService: R3FCameraService = {
  calculateMeshBounds,
  calculateSceneBounds,
  calculateOptimalPosition,
  positionCameraForMesh,
  positionCameraForScene,
  resetCamera,
  applyCameraPosition
} as const;

// ============================================================================
// Default Export
// ============================================================================

export default r3fCameraService;
