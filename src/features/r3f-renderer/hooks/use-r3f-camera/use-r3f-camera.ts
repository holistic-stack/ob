/**
 * @file R3F Camera Hook
 * 
 * React hook for managing R3F camera positioning and controls.
 * Provides equivalent functionality to Babylon.js camera system with
 * automatic mesh framing, camera reset, and position management.
 * 
 * @author OpenSCAD-R3F Pipeline
 * @version 1.0.0
 */

import { useCallback, useRef, useEffect } from 'react';
import * as THREE from 'three';
import {
  r3fCameraService,
  type R3FCameraPosition,
  type R3FMeshBounds,
  type R3FCameraConfig
} from '../../services/camera-service/r3f-camera-service';
import type { Result } from '../../../csg-processor';

// ============================================================================
// Hook Types
// ============================================================================

/**
 * Camera controls reference interface
 */
export interface CameraControlsRef {
  readonly target: THREE.Vector3;
  readonly object: THREE.Camera;
  readonly update: () => void;
  readonly reset: () => void;
  readonly saveState: () => void;
  readonly enabled: boolean;
}

/**
 * Camera hook configuration
 */
export interface UseR3FCameraConfig {
  readonly autoFrame?: boolean;
  readonly framePadding?: number;
  readonly enableLogging?: boolean;
  readonly onPositionChange?: (position: R3FCameraPosition) => void;
  readonly onError?: (error: string) => void;
}

/**
 * Camera hook return interface
 */
export interface UseR3FCameraReturn {
  // Camera positioning functions
  readonly frameForMesh: (mesh: THREE.Mesh) => Promise<Result<R3FCameraPosition, string>>;
  readonly frameForScene: (meshes: readonly THREE.Mesh[]) => Promise<Result<R3FCameraPosition, string>>;
  readonly resetCamera: () => Promise<Result<R3FCameraPosition, string>>;
  readonly setPosition: (position: R3FCameraPosition) => Promise<Result<void, string>>;
  
  // Bounds calculation
  readonly calculateMeshBounds: (mesh: THREE.Mesh) => Result<R3FMeshBounds, string>;
  readonly calculateSceneBounds: (meshes: readonly THREE.Mesh[]) => Result<R3FMeshBounds, string>;
  
  // Camera state
  readonly getCurrentPosition: () => R3FCameraPosition | null;
  readonly isReady: boolean;
}

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_CONFIG: Required<UseR3FCameraConfig> = {
  autoFrame: false,
  framePadding: 1.5,
  enableLogging: false,
  onPositionChange: () => {},
  onError: () => {}
};

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * R3F Camera Hook
 * 
 * Provides camera positioning and framing functionality equivalent to Babylon.js
 * camera system. Manages camera state, automatic framing, and user interactions.
 * 
 * @param camera - Three.js camera instance
 * @param controls - Camera controls reference (OrbitControls, etc.)
 * @param config - Hook configuration options
 * @returns Camera management functions and state
 * 
 * @example
 * ```tsx
 * function CameraManager({ camera, controls, meshes }) {
 *   const {
 *     frameForScene,
 *     resetCamera,
 *     isReady
 *   } = useR3FCamera(camera, controls, {
 *     autoFrame: true,
 *     enableLogging: true,
 *     onPositionChange: (pos) => console.log('Camera moved:', pos)
 *   });
 * 
 *   useEffect(() => {
 *     if (isReady && meshes.length > 0) {
 *       frameForScene(meshes);
 *     }
 *   }, [isReady, meshes, frameForScene]);
 * 
 *   return (
 *     <div>
 *       <button onClick={resetCamera}>Reset Camera</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useR3FCamera(
  camera: THREE.Camera | null,
  controls: CameraControlsRef | null = null,
  config: UseR3FCameraConfig = {}
): UseR3FCameraReturn {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const currentPositionRef = useRef<R3FCameraPosition | null>(null);

  // ========================================================================
  // Camera State Management
  // ========================================================================

  const isReady = Boolean(camera);

  const getCurrentPosition = useCallback((): R3FCameraPosition | null => {
    if (!camera) return null;

    try {
      const position = camera.position.toArray() as [number, number, number];
      
      // Calculate target from camera direction or controls
      let target: [number, number, number] = [0, 0, 0];
      if (controls?.target) {
        target = controls.target.toArray() as [number, number, number];
      } else {
        // Estimate target from camera direction
        const direction = new THREE.Vector3();
        camera.getWorldDirection(direction);
        const targetVec = camera.position.clone().add(direction.multiplyScalar(10));
        target = targetVec.toArray() as [number, number, number];
      }

      const distance = camera.position.distanceTo(new THREE.Vector3(...target));
      
      // Calculate spherical coordinates
      const spherical = {
        radius: distance,
        phi: Math.acos((position[1] - target[1]) / distance),
        theta: Math.atan2(position[2] - target[2], position[0] - target[0])
      };

      const cameraPosition: R3FCameraPosition = {
        position,
        target,
        distance,
        spherical
      };

      currentPositionRef.current = cameraPosition;
      return cameraPosition;
    } catch (error) {
      if (finalConfig.enableLogging) {
        console.warn('[R3F Camera Hook] Failed to get current position:', error);
      }
      return null;
    }
  }, [camera, controls, finalConfig.enableLogging]);

  // ========================================================================
  // Camera Positioning Functions
  // ========================================================================

  const frameForMesh = useCallback(async (mesh: THREE.Mesh): Promise<Result<R3FCameraPosition, string>> => {
    if (!camera) {
      const error = 'Camera not available';
      finalConfig.onError?.(error);
      return { success: false, error };
    }

    try {
      const result = r3fCameraService.positionCameraForMesh(camera, mesh, controls);
      
      if (result.success) {
        currentPositionRef.current = result.data;
        finalConfig.onPositionChange?.(result.data);
        
        if (finalConfig.enableLogging) {
          console.log('[R3F Camera Hook] Framed mesh:', mesh.name || 'unnamed');
        }
      } else {
        finalConfig.onError?.(result.error);
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown framing error';
      finalConfig.onError?.(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, [camera, controls, finalConfig]);

  const frameForScene = useCallback(async (meshes: readonly THREE.Mesh[]): Promise<Result<R3FCameraPosition, string>> => {
    if (!camera) {
      const error = 'Camera not available';
      finalConfig.onError?.(error);
      return { success: false, error };
    }

    try {
      const result = r3fCameraService.positionCameraForScene(camera, meshes, controls);
      
      if (result.success) {
        currentPositionRef.current = result.data;
        finalConfig.onPositionChange?.(result.data);
        
        if (finalConfig.enableLogging) {
          console.log('[R3F Camera Hook] Framed scene with', meshes.length, 'meshes');
        }
      } else {
        finalConfig.onError?.(result.error);
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown scene framing error';
      finalConfig.onError?.(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, [camera, controls, finalConfig]);

  const resetCamera = useCallback(async (): Promise<Result<R3FCameraPosition, string>> => {
    if (!camera) {
      const error = 'Camera not available';
      finalConfig.onError?.(error);
      return { success: false, error };
    }

    try {
      const result = r3fCameraService.resetCamera(camera, controls);
      
      if (result.success) {
        currentPositionRef.current = result.data;
        finalConfig.onPositionChange?.(result.data);
        
        if (finalConfig.enableLogging) {
          console.log('[R3F Camera Hook] Camera reset to default position');
        }
      } else {
        finalConfig.onError?.(result.error);
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown reset error';
      finalConfig.onError?.(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, [camera, controls, finalConfig]);

  const setPosition = useCallback(async (position: R3FCameraPosition): Promise<Result<void, string>> => {
    if (!camera) {
      const error = 'Camera not available';
      finalConfig.onError?.(error);
      return { success: false, error };
    }

    try {
      const result = r3fCameraService.applyCameraPosition(camera, position, controls);
      
      if (result.success) {
        currentPositionRef.current = position;
        finalConfig.onPositionChange?.(position);
        
        if (finalConfig.enableLogging) {
          console.log('[R3F Camera Hook] Applied camera position:', position);
        }
      } else {
        finalConfig.onError?.(result.error);
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown position setting error';
      finalConfig.onError?.(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, [camera, controls, finalConfig]);

  // ========================================================================
  // Bounds Calculation Functions
  // ========================================================================

  const calculateMeshBounds = useCallback((mesh: THREE.Mesh): Result<R3FMeshBounds, string> => {
    return r3fCameraService.calculateMeshBounds(mesh);
  }, []);

  const calculateSceneBounds = useCallback((meshes: readonly THREE.Mesh[]): Result<R3FMeshBounds, string> => {
    return r3fCameraService.calculateSceneBounds(meshes);
  }, []);

  // ========================================================================
  // Auto-framing Effect
  // ========================================================================

  useEffect(() => {
    if (finalConfig.autoFrame && camera) {
      // Auto-framing logic could be implemented here
      // For now, just update current position
      getCurrentPosition();
    }
  }, [camera, finalConfig.autoFrame, getCurrentPosition]);

  // ========================================================================
  // Return Hook Interface
  // ========================================================================

  return {
    // Camera positioning functions
    frameForMesh,
    frameForScene,
    resetCamera,
    setPosition,
    
    // Bounds calculation
    calculateMeshBounds,
    calculateSceneBounds,
    
    // Camera state
    getCurrentPosition,
    isReady
  };
}

// ============================================================================
// Default Export
// ============================================================================

export default useR3FCamera;
