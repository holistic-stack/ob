/**
 * @file R3F Camera Controls
 * 
 * Enhanced camera controls component for React Three Fiber providing
 * equivalent functionality to Babylon.js ArcRotateCamera with OrbitControls,
 * camera positioning, framing, and navigation features.
 * 
 * @author OpenSCAD-R3F Pipeline
 * @version 1.0.0
 */

import React, { useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useR3FCamera, type UseR3FCameraConfig } from '../../hooks/use-r3f-camera/use-r3f-camera';
import type { R3FCameraPosition } from '../../services/camera-service/r3f-camera-service';

// ============================================================================
// Component Types
// ============================================================================

/**
 * Camera controls configuration
 */
export interface R3FCameraControlsConfig {
  // OrbitControls settings
  readonly enableZoom?: boolean;
  readonly enablePan?: boolean;
  readonly enableRotate?: boolean;
  readonly autoRotate?: boolean;
  readonly autoRotateSpeed?: number;
  readonly enableDamping?: boolean;
  readonly dampingFactor?: number;
  
  // Distance constraints
  readonly minDistance?: number;
  readonly maxDistance?: number;
  readonly minPolarAngle?: number;
  readonly maxPolarAngle?: number;
  readonly minAzimuthAngle?: number;
  readonly maxAzimuthAngle?: number;
  
  // Target and position
  readonly target?: readonly [number, number, number];
  readonly position?: readonly [number, number, number];
  
  // Advanced features
  readonly enableKeys?: boolean;
  readonly keyPanSpeed?: number;
  readonly enableScreenSpacePanning?: boolean;
  readonly screenSpacePanning?: boolean;
  readonly mouseButtons?: {
    readonly LEFT?: THREE.MOUSE;
    readonly MIDDLE?: THREE.MOUSE;
    readonly RIGHT?: THREE.MOUSE;
  };
  readonly touches?: {
    readonly ONE?: THREE.TOUCH;
    readonly TWO?: THREE.TOUCH;
  };
}

/**
 * Camera controls props
 */
export interface R3FCameraControlsProps extends R3FCameraControlsConfig {
  readonly meshes?: readonly THREE.Mesh[];
  readonly autoFrame?: boolean;
  readonly framePadding?: number;
  readonly onPositionChange?: (position: R3FCameraPosition) => void;
  readonly onControlsReady?: (controls: any) => void;
  readonly onError?: (error: string) => void;
  readonly children?: React.ReactNode;
}

/**
 * Camera controls ref interface
 */
export interface R3FCameraControlsRef {
  readonly frameForMesh: (mesh: THREE.Mesh) => Promise<void>;
  readonly frameForScene: (meshes: readonly THREE.Mesh[]) => Promise<void>;
  readonly resetCamera: () => Promise<void>;
  readonly setPosition: (position: R3FCameraPosition) => Promise<void>;
  readonly getCurrentPosition: () => R3FCameraPosition | null;
  readonly controls: any;
}

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_CONFIG: Required<Omit<R3FCameraControlsConfig, 'target' | 'position' | 'mouseButtons' | 'touches'>> = {
  enableZoom: true,
  enablePan: true,
  enableRotate: true,
  autoRotate: false,
  autoRotateSpeed: 2.0,
  enableDamping: true,
  dampingFactor: 0.05,
  minDistance: 1,
  maxDistance: 100,
  minPolarAngle: 0,
  maxPolarAngle: Math.PI,
  minAzimuthAngle: -Infinity,
  maxAzimuthAngle: Infinity,
  enableKeys: true,
  keyPanSpeed: 7.0,
  enableScreenSpacePanning: true,
  screenSpacePanning: true
};

// ============================================================================
// Component Implementation
// ============================================================================

/**
 * R3F Camera Controls Component
 * 
 * Provides enhanced camera controls with automatic framing, positioning,
 * and navigation features equivalent to Babylon.js ArcRotateCamera.
 * 
 * @param props - Camera controls configuration and callbacks
 * @param ref - Forwarded ref for imperative camera control
 * @returns JSX element containing OrbitControls and camera management
 * 
 * @example
 * ```tsx
 * function Scene({ meshes }) {
 *   const controlsRef = useRef<R3FCameraControlsRef>(null);
 * 
 *   const handleFrameScene = () => {
 *     controlsRef.current?.frameForScene(meshes);
 *   };
 * 
 *   return (
 *     <Canvas>
 *       <R3FCameraControls
 *         ref={controlsRef}
 *         meshes={meshes}
 *         autoFrame={true}
 *         enableDamping={true}
 *         onPositionChange={(pos) => console.log('Camera moved:', pos)}
 *       />
 *       <button onClick={handleFrameScene}>Frame Scene</button>
 *     </Canvas>
 *   );
 * }
 * ```
 */
export const R3FCameraControls = forwardRef<R3FCameraControlsRef, R3FCameraControlsProps>(({
  // OrbitControls configuration
  enableZoom = DEFAULT_CONFIG.enableZoom,
  enablePan = DEFAULT_CONFIG.enablePan,
  enableRotate = DEFAULT_CONFIG.enableRotate,
  autoRotate = DEFAULT_CONFIG.autoRotate,
  autoRotateSpeed = DEFAULT_CONFIG.autoRotateSpeed,
  enableDamping = DEFAULT_CONFIG.enableDamping,
  dampingFactor = DEFAULT_CONFIG.dampingFactor,
  
  // Distance constraints
  minDistance = DEFAULT_CONFIG.minDistance,
  maxDistance = DEFAULT_CONFIG.maxDistance,
  minPolarAngle = DEFAULT_CONFIG.minPolarAngle,
  maxPolarAngle = DEFAULT_CONFIG.maxPolarAngle,
  minAzimuthAngle = DEFAULT_CONFIG.minAzimuthAngle,
  maxAzimuthAngle = DEFAULT_CONFIG.maxAzimuthAngle,
  
  // Target and position
  target = [0, 0, 0],
  position,
  
  // Advanced features
  enableKeys = DEFAULT_CONFIG.enableKeys,
  keyPanSpeed = DEFAULT_CONFIG.keyPanSpeed,
  enableScreenSpacePanning = DEFAULT_CONFIG.enableScreenSpacePanning,
  screenSpacePanning = DEFAULT_CONFIG.screenSpacePanning,
  mouseButtons,
  touches,
  
  // Camera management
  meshes = [],
  autoFrame = false,
  framePadding = 1.5,
  onPositionChange,
  onControlsReady,
  onError,
  children
}, ref) => {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);

  // Camera hook configuration
  const cameraConfig: UseR3FCameraConfig = {
    autoFrame,
    framePadding,
    enableLogging: false,
    ...(onPositionChange && { onPositionChange }),
    ...(onError && { onError })
  };

  // Use R3F camera hook
  const {
    frameForMesh,
    frameForScene,
    resetCamera,
    setPosition,
    getCurrentPosition,
    isReady
  } = useR3FCamera(camera, controlsRef.current, cameraConfig);

  // ========================================================================
  // Camera Position Management
  // ========================================================================

  // Set initial camera position if provided
  useEffect(() => {
    if (position && camera && isReady) {
      const cameraPosition: R3FCameraPosition = {
        position,
        target,
        distance: new THREE.Vector3(...position).distanceTo(new THREE.Vector3(...target)),
        spherical: {
          radius: new THREE.Vector3(...position).distanceTo(new THREE.Vector3(...target)),
          phi: Math.acos((position[1] - target[1]) / new THREE.Vector3(...position).distanceTo(new THREE.Vector3(...target))),
          theta: Math.atan2(position[2] - target[2], position[0] - target[0])
        }
      };
      
      setPosition(cameraPosition).catch(console.error);
    }
  }, [position, target, camera, isReady, setPosition]);

  // Auto-frame meshes when they change
  useEffect(() => {
    if (autoFrame && meshes.length > 0 && isReady) {
      frameForScene(meshes).catch(console.error);
    }
  }, [autoFrame, meshes, isReady, frameForScene]);

  // ========================================================================
  // Controls Event Handlers
  // ========================================================================

  const handleControlsChange = useCallback(() => {
    if (onPositionChange && controlsRef.current) {
      const currentPos = getCurrentPosition();
      if (currentPos) {
        onPositionChange(currentPos);
      }
    }
  }, [onPositionChange, getCurrentPosition]);

  // ========================================================================
  // Imperative API
  // ========================================================================

  useImperativeHandle(ref, () => ({
    frameForMesh: async (mesh: THREE.Mesh) => {
      const result = await frameForMesh(mesh);
      if (!result.success) {
        throw new Error(result.error);
      }
    },
    frameForScene: async (sceneMeshes: readonly THREE.Mesh[]) => {
      const result = await frameForScene(sceneMeshes);
      if (!result.success) {
        throw new Error(result.error);
      }
    },
    resetCamera: async () => {
      const result = await resetCamera();
      if (!result.success) {
        throw new Error(result.error);
      }
    },
    setPosition: async (pos: R3FCameraPosition) => {
      const result = await setPosition(pos);
      if (!result.success) {
        throw new Error(result.error);
      }
    },
    getCurrentPosition,
    controls: controlsRef.current
  }), [frameForMesh, frameForScene, resetCamera, setPosition, getCurrentPosition]);

  // ========================================================================
  // Controls Ready Callback
  // ========================================================================

  useEffect(() => {
    if (controlsRef.current && onControlsReady) {
      onControlsReady(controlsRef.current);
    }
  }, [onControlsReady]);

  // ========================================================================
  // Render
  // ========================================================================

  return (
    <>
      <OrbitControls
        ref={controlsRef}
        target={[...target] as [number, number, number]}
        enableZoom={enableZoom}
        enablePan={enablePan}
        enableRotate={enableRotate}
        autoRotate={autoRotate}
        autoRotateSpeed={autoRotateSpeed}
        enableDamping={enableDamping}
        dampingFactor={dampingFactor}
        minDistance={minDistance}
        maxDistance={maxDistance}
        minPolarAngle={minPolarAngle}
        maxPolarAngle={maxPolarAngle}
        minAzimuthAngle={minAzimuthAngle}
        maxAzimuthAngle={maxAzimuthAngle}
        keyPanSpeed={keyPanSpeed}
        screenSpacePanning={enableScreenSpacePanning}
        {...(mouseButtons && { mouseButtons })}
        {...(touches && { touches })}
        onChange={handleControlsChange}
      />
      {children}
    </>
  );
});

R3FCameraControls.displayName = 'R3FCameraControls';

// ============================================================================
// Default Export
// ============================================================================

export default R3FCameraControls;
