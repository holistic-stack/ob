/**
 * @file Babylon Scene Hook
 * 
 * Refactored React hook for Babylon.js scene management
 * Thin wrapper around scene service following React 19 best practices
 * 
 * @author Luciano Júnior
 * @date June 2025
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import * as BABYLON from '@babylonjs/core';
import { createSceneService } from '../../services/scene-service/scene-service';
import type { 
  BabylonSceneConfig, 
  UseBabylonSceneReturn 
} from '../../types/babylon-types';

/**
 * Custom hook for managing Babylon.js scene lifecycle
 * 
 * This hook is a thin wrapper around the scene service, providing:
 * - React state management for scene lifecycle
 * - Automatic cleanup on unmount
 * - Configuration change detection
 * - Render loop management
 * 
 * @param engine - Babylon.js engine instance
 * @param config - Optional scene configuration
 * @returns Scene state and control functions
 * 
 * @example
 * ```tsx
 * const { scene, isReady, render, dispose } = useBabylonScene(engine, {
 *   enableCamera: true,
 *   enableLighting: true,
 *   backgroundColor: '#2c3e50',
 *   cameraPosition: [10, 10, 10]
 * });
 * ```
 */
export function useBabylonScene(
  engine: BABYLON.Engine | null,
  config: BabylonSceneConfig = {}
): UseBabylonSceneReturn {
  console.log('[INIT] Initializing Babylon scene hook');

  // Create scene service instance (memoized)
  const sceneService = useMemo(() => createSceneService(), []);

  // State management
  const [scene, setScene] = useState<BABYLON.Scene | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Refs for cleanup and render management
  const sceneRef = useRef<BABYLON.Scene | null>(null);
  const renderLoopRef = useRef<(() => void) | null>(null);

  // Memoize configuration to prevent unnecessary re-renders
  const memoizedConfig = useMemo(() => config, [
    config.enableCamera,
    config.enableLighting,
    config.backgroundColor,
    config.cameraPosition?.[0],
    config.cameraPosition?.[1],
    config.cameraPosition?.[2]
  ]);

  // Render function
  const render = useCallback(() => {
    if (sceneRef.current && !sceneRef.current.isDisposed) {
      try {
        sceneRef.current.render();
      } catch (error) {
        console.error('[ERROR] Scene render failed:', error);
      }
    }
  }, []);

  // Dispose function with cleanup
  const dispose = useCallback(() => {
    console.log('[DEBUG] Disposing Babylon scene from hook');

    if (sceneRef.current) {
      // Stop render loop if running
      if (renderLoopRef.current) {
        sceneRef.current.getEngine().stopRenderLoop(renderLoopRef.current);
        renderLoopRef.current = null;
      }

      // Dispose scene using service
      sceneService.disposeScene(sceneRef.current);
      sceneRef.current = null;
    }

    // Reset state
    setScene(null);
    setIsReady(false);
  }, [sceneService]);

  // Scene creation effect
  useEffect(() => {
    console.log('[DEBUG] Scene hook effect triggered');

    // Cleanup previous scene if exists
    if (sceneRef.current) {
      dispose();
    }

    // Validate engine
    if (!engine || engine.isDisposed) {
      console.log('[DEBUG] Engine not available or disposed');
      setScene(null);
      setIsReady(false);
      return;
    }

    // Create new scene using service
    const result = sceneService.createScene(engine, memoizedConfig);

    if (result.success) {
      const newScene = result.data;
      sceneRef.current = newScene;
      setScene(newScene);
      setIsReady(true);

      console.log('[DEBUG] Scene created successfully in hook');
    } else {
      console.error('[ERROR] Scene creation failed in hook:', result.error);
      setScene(null);
      setIsReady(false);
    }

    // Cleanup function
    return () => {
      console.log('[DEBUG] Scene hook cleanup');
      dispose();
    };
  }, [engine, memoizedConfig, sceneService, dispose]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('[DEBUG] Scene hook unmounting');
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

// Re-export types for convenience
export type { BabylonSceneConfig, UseBabylonSceneReturn };
