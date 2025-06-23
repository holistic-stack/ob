/**
 * @file R3FScene Component
 * 
 * React Three Fiber scene component that manages 3D scene content.
 * Provides a container for 3D objects and scene-level configuration.
 * 
 * @author OpenSCAD-R3F Pipeline
 * @version 1.0.0
 */

import React, { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { R3FSceneProps } from '../../types/r3f-types';

/**
 * R3FScene Component
 * 
 * Responsible for:
 * - Managing scene-level configuration
 * - Providing context for child 3D objects
 * - Handling scene updates and lifecycle
 * - Scene-level event handling
 * 
 * @param props - Scene configuration and children
 * @returns JSX element containing the scene content
 * 
 * @example
 * ```tsx
 * <R3FScene config={{ enableLighting: true, backgroundColor: '#2c3e50' }}>
 *   <mesh>
 *     <boxGeometry args={[1, 1, 1]} />
 *     <meshStandardMaterial color="orange" />
 *   </mesh>
 * </R3FScene>
 * ```
 */
export function R3FScene({
  config = {},
  children
}: R3FSceneProps): React.JSX.Element {
  console.log('[INIT] Initializing R3FScene component');

  const { scene, camera, gl } = useThree();
  const sceneRef = useRef<THREE.Group>(null);

  // Default scene configuration
  const defaultConfig = {
    enableLighting: true,
    backgroundColor: '#1a1a1a',
    ambientLightIntensity: 0.4,
    directionalLightIntensity: 1,
    directionalLightPosition: [10, 10, 5] as const,
    enableGrid: true,
    enableAxes: true,
    ...config
  };

  // Scene setup effect
  useEffect(() => {
    console.log('[DEBUG] Setting up R3F scene with config:', defaultConfig);

    // Set background color
    if (defaultConfig.backgroundColor) {
      scene.background = new THREE.Color(defaultConfig.backgroundColor);
    }

    // Configure renderer settings
    gl.shadowMap.enabled = true;
    gl.shadowMap.type = THREE.PCFSoftShadowMap;
    gl.setClearColor(defaultConfig.backgroundColor || '#1a1a1a');

    // Set up tone mapping for better visual quality
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 1;
    gl.outputColorSpace = THREE.SRGBColorSpace;

    console.log('[DEBUG] R3F scene setup complete');

    return () => {
      console.log('[DEBUG] R3F scene cleanup');
    };
  }, [scene, gl, defaultConfig.backgroundColor]);

  // Animation frame callback for scene updates
  useFrame((state, delta) => {
    // Scene-level animations or updates can be added here
    // For example, auto-rotation, camera animations, etc.
    
    // Update scene reference if needed
    if (sceneRef.current) {
      // Scene-level updates
    }
  });

  // Handle scene ready callback
  useEffect(() => {
    if (scene && sceneRef.current) {
      console.log('[DEBUG] R3F scene ready');
      
      // Scene is ready, can notify parent components
      // This could trigger onSceneReady callbacks if needed
    }
  }, [scene]);

  return (
    <group ref={sceneRef} name="r3f-scene-root">
      {children}
    </group>
  );
}

// Default export for easier imports
export default R3FScene;
