/**
 * @file useR3FScene Hook
 * 
 * React hook equivalent to useBabylonScene that manages R3F scene lifecycle,
 * render loop, and scene configuration with proper cleanup and state management.
 * 
 * @author OpenSCAD-R3F Pipeline
 * @version 1.0.0
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import * as THREE from 'three';
import { createR3FSceneService } from '../../services/scene-service/r3f-scene-service';
import type { 
  R3FSceneConfig, 
  UseR3FSceneReturn 
} from '../../types/r3f-types';

/**
 * Custom hook for managing React Three Fiber scene lifecycle
 * 
 * This hook is a thin wrapper around the R3F scene service, providing:
 * - React state management for scene lifecycle
 * - Automatic cleanup on unmount
 * - Configuration change detection
 * - Render loop management
 * 
 * @param renderer - Three.js WebGL renderer instance
 * @param config - Optional scene configuration
 * @returns Scene state and control functions
 * 
 * @example
 * ```tsx
 * const { scene, isReady, render, dispose } = useR3FScene(renderer, {
 *   enableCamera: true,
 *   enableLighting: true,
 *   backgroundColor: '#2c3e50',
 *   cameraPosition: [10, 10, 10]
 * });
 * ```
 */
export function useR3FScene(
  renderer: THREE.WebGLRenderer | null,
  config: R3FSceneConfig = {}
): UseR3FSceneReturn {
  console.log('[INIT] Initializing R3F scene hook');

  // Create scene service instance (memoized)
  const sceneService = useMemo(() => createR3FSceneService(), []);

  // State management
  const [scene, setScene] = useState<THREE.Scene | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Refs for cleanup and render management
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.Camera | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Memoize configuration to prevent unnecessary re-renders
  const memoizedConfig = useMemo(() => config, [
    config.enableCamera,
    config.enableLighting,
    config.backgroundColor,
    config.cameraPosition?.[0],
    config.cameraPosition?.[1],
    config.cameraPosition?.[2],
    config.cameraTarget?.[0],
    config.cameraTarget?.[1],
    config.cameraTarget?.[2],
    config.ambientLightIntensity,
    config.directionalLightIntensity,
    config.enableGrid,
    config.enableAxes
  ]);

  // Render function
  const render = useCallback(() => {
    if (sceneRef.current && cameraRef.current && renderer) {
      try {
        renderer.render(sceneRef.current, cameraRef.current);
      } catch (error) {
        console.error('[ERROR] Scene render failed:', error);
      }
    }
  }, [renderer]);

  // Start render loop
  const startRenderLoop = useCallback(() => {
    if (animationFrameRef.current) {
      return; // Already running
    }

    const renderLoop = () => {
      render();
      animationFrameRef.current = requestAnimationFrame(renderLoop);
    };

    animationFrameRef.current = requestAnimationFrame(renderLoop);
    console.log('[DEBUG] R3F render loop started');
  }, [render]);

  // Stop render loop
  const stopRenderLoop = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
      console.log('[DEBUG] R3F render loop stopped');
    }
  }, []);

  // Dispose function with cleanup
  const dispose = useCallback(() => {
    console.log('[DEBUG] Disposing R3F scene from hook');

    // Stop render loop
    stopRenderLoop();

    if (sceneRef.current) {
      // Dispose scene using service
      sceneService.disposeScene(sceneRef.current);
      sceneRef.current = null;
      cameraRef.current = null;
    }

    // Reset state
    setScene(null);
    setIsReady(false);
  }, [sceneService, stopRenderLoop]);

  // Scene creation effect
  useEffect(() => {
    console.log('[DEBUG] R3F scene hook effect triggered');

    // Cleanup previous scene if exists
    if (sceneRef.current) {
      dispose();
    }

    // Validate renderer
    if (!renderer) {
      console.log('[DEBUG] Renderer not available');
      setScene(null);
      setIsReady(false);
      return;
    }

    // Create new scene using service
    const result = sceneService.createScene(memoizedConfig);

    if (result.success) {
      const newScene = result.data;
      sceneRef.current = newScene;
      setScene(newScene);

      // Setup camera if enabled
      if (memoizedConfig.enableCamera) {
        const cameraResult = sceneService.setupCamera(newScene, {
          type: 'perspective',
          fov: 75,
          aspect: renderer.domElement.width / renderer.domElement.height || 1,
          near: 0.1,
          far: 1000,
          position: memoizedConfig.cameraPosition || [10, 10, 10],
          target: memoizedConfig.cameraTarget || [0, 0, 0],
          enableControls: true
        });

        if (cameraResult.success) {
          cameraRef.current = cameraResult.data;
          console.log('[DEBUG] Camera setup successful');
        } else {
          console.warn('[WARN] Camera setup failed:', cameraResult.error);
          // Create a default camera as fallback
          const defaultCamera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
          defaultCamera.position.set(10, 10, 10);
          defaultCamera.lookAt(0, 0, 0);
          cameraRef.current = defaultCamera;
        }
      } else {
        // Create a default camera even if disabled for rendering purposes
        const defaultCamera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
        defaultCamera.position.set(10, 10, 10);
        defaultCamera.lookAt(0, 0, 0);
        cameraRef.current = defaultCamera;
      }

      setIsReady(true);

      // Start render loop
      startRenderLoop();

      console.log('[DEBUG] Scene created successfully in hook');
    } else {
      console.error('[ERROR] Scene creation failed in hook:', result.error);
      setScene(null);
      setIsReady(false);
    }

    // Cleanup function
    return () => {
      console.log('[DEBUG] R3F scene hook cleanup');
      stopRenderLoop();
    };
  }, [renderer, memoizedConfig, sceneService, dispose, startRenderLoop, stopRenderLoop]);

  // Handle renderer resize
  useEffect(() => {
    if (renderer && cameraRef.current && cameraRef.current instanceof THREE.PerspectiveCamera) {
      const canvas = renderer.domElement;
      const aspect = canvas.clientWidth / canvas.clientHeight;
      cameraRef.current.aspect = aspect;
      cameraRef.current.updateProjectionMatrix();
    }
  }, [renderer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('[DEBUG] R3F scene hook unmounting, cleaning up');
      dispose();
    };
  }, [dispose]);

  return {
    scene,
    isReady,
    render,
    dispose
  };
}

// Default export for easier imports
export default useR3FScene;
