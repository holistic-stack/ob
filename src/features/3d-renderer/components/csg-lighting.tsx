/**
 * CSG-optimized lighting component for React Three Fiber
 * 
 * Based on research from three-csg-ts working examples, this component provides
 * the specific lighting setup needed to properly visualize CSG difference operations.
 * 
 * Key features:
 * - Two SpotLights positioned at opposite angles for interior illumination
 * - High intensity (100) for proper visibility of interior surfaces
 * - Shadow casting enabled for depth perception
 * - Ambient light to ensure no surfaces are completely dark
 */

import React from 'react';
import { useThree } from '@react-three/fiber';
import { useEffect } from 'react';
import { 
  createCSGLighting, 
  configureRendererForCSG, 
  type CSGLightingConfig 
} from '../services/lighting-fix/csg-lighting-setup';

/**
 * Props for CSG lighting component
 */
export interface CSGLightingProps {
  /** Enable shadow casting (default: true) */
  enableShadows?: boolean;
  /** Light intensity for SpotLights (default: 100) */
  lightIntensity?: number;
  /** Ambient light intensity (default: 0.3) */
  ambientIntensity?: number;
  /** Shadow map size (default: 1024) */
  shadowMapSize?: number;
  /** Whether to replace existing lights (default: true) */
  replaceExistingLights?: boolean;
}

/**
 * CSG Lighting Component
 * 
 * This component sets up the specific lighting configuration needed for
 * proper visualization of CSG difference operations. It replaces the
 * default React Three Fiber lighting with CSG-optimized lighting.
 * 
 * Usage:
 * ```tsx
 * <Canvas>
 *   <CSGLighting />
 *   // ... your CSG meshes
 * </Canvas>
 * ```
 */
export const CSGLighting: React.FC<CSGLightingProps> = ({
  enableShadows = true,
  lightIntensity = 100,
  ambientIntensity = 0.3,
  shadowMapSize = 1024,
  replaceExistingLights = true,
}) => {
  const { scene, gl } = useThree();

  useEffect(() => {
    console.log('🔆 CSGLighting: Setting up CSG-optimized lighting');
    
    // Configure renderer for CSG operations
    configureRendererForCSG(gl);
    
    // Remove existing lights if requested
    if (replaceExistingLights) {
      const existingLights = scene.children.filter(child => child.type.includes('Light'));
      existingLights.forEach(light => {
        console.log(`🔆 CSGLighting: Removing existing ${light.type}`);
        scene.remove(light);
      });
    }
    
    // Create CSG-optimized lighting
    const config: CSGLightingConfig = {
      enableShadows,
      lightIntensity,
      ambientIntensity,
      shadowMapSize,
    };
    
    const lights = createCSGLighting(config);
    
    // Add lights to scene
    lights.forEach((light, index) => {
      console.log(`🔆 CSGLighting: Adding ${light.type} ${index + 1} with intensity ${light.intensity}`);
      scene.add(light);
    });
    
    console.log(`🔆 CSGLighting: Setup complete - ${lights.length} lights added`);
    console.log('🔆 CSGLighting: Renderer configured for CSG operations');
    
    // Cleanup function
    return () => {
      console.log('🔆 CSGLighting: Cleaning up CSG lights');
      lights.forEach(light => {
        scene.remove(light);
      });
    };
  }, [scene, gl, enableShadows, lightIntensity, ambientIntensity, shadowMapSize, replaceExistingLights]);

  // This component doesn't render any JSX - it only manages Three.js objects
  return null;
};

/**
 * CSG Lighting with JSX declarative syntax (alternative approach)
 * 
 * This version uses React Three Fiber's declarative JSX syntax instead of
 * imperative Three.js object management. Use this if you prefer JSX.
 */
export const CSGLightingJSX: React.FC<CSGLightingProps> = ({
  enableShadows = true,
  lightIntensity = 100,
  ambientIntensity = 0.3,
  shadowMapSize = 1024,
}) => {
  const { gl } = useThree();

  useEffect(() => {
    console.log('🔆 CSGLightingJSX: Configuring renderer for CSG operations');
    configureRendererForCSG(gl);
  }, [gl]);

  return (
    <>
      {/* SpotLight 1: Positioned at (2.5, 5, 5) - matches working example */}
      <spotLight
        position={[2.5, 5, 5]}
        intensity={lightIntensity}
        angle={Math.PI / 4}
        penumbra={0.5}
        castShadow={enableShadows}
        shadow-mapSize-width={shadowMapSize}
        shadow-mapSize-height={shadowMapSize}
        shadow-camera-near={0.5}
        shadow-camera-far={20}
      />
      
      {/* SpotLight 2: Positioned at (-2.5, 5, 5) - opposite angle for interior illumination */}
      <spotLight
        position={[-2.5, 5, 5]}
        intensity={lightIntensity}
        angle={Math.PI / 4}
        penumbra={0.5}
        castShadow={enableShadows}
        shadow-mapSize-width={shadowMapSize}
        shadow-mapSize-height={shadowMapSize}
        shadow-camera-near={0.5}
        shadow-camera-far={20}
      />
      
      {/* Ambient light: Critical for interior surface visibility */}
      <ambientLight intensity={ambientIntensity} />
    </>
  );
};

/**
 * Hook to enable CSG lighting in any React Three Fiber scene
 * 
 * This hook provides a programmatic way to enable CSG lighting
 * without adding a component to your JSX.
 * 
 * @param config - CSG lighting configuration
 * @returns Object with lighting control functions
 */
export const useCSGLighting = (config: CSGLightingConfig = {}) => {
  const { scene, gl } = useThree();

  const enableCSGLighting = React.useCallback(() => {
    console.log('🔆 useCSGLighting: Enabling CSG lighting');
    
    // Configure renderer
    configureRendererForCSG(gl);
    
    // Create and add lights
    const lights = createCSGLighting(config);
    lights.forEach(light => scene.add(light));
    
    return lights;
  }, [scene, gl, config]);

  const disableCSGLighting = React.useCallback(() => {
    console.log('🔆 useCSGLighting: Disabling CSG lighting');
    
    // Remove CSG lights (SpotLights and AmbientLights added by CSG setup)
    const csgLights = scene.children.filter(child => 
      child.type === 'SpotLight' || 
      (child.type === 'AmbientLight' && (child as any).intensity === (config.ambientIntensity ?? 0.3))
    );
    
    csgLights.forEach(light => scene.remove(light));
  }, [scene, config.ambientIntensity]);

  return {
    enableCSGLighting,
    disableCSGLighting,
  };
};

export default CSGLighting;
