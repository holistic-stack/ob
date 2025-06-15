/**
 * @file Babylon Canvas Component
 * 
 * Core canvas component for Babylon.js rendering
 * Handles engine and scene initialization with proper lifecycle management
 * 
 * @author Luciano Júnior
 * @date June 2025
 */

import React, { useRef, useEffect, useCallback } from 'react';
import { useBabylonEngine } from '../../hooks/use-babylon-engine/use-babylon-engine';
import { useBabylonScene } from '../../hooks/use-babylon-scene/use-babylon-scene';
import type { BabylonCanvasProps } from '../../types/babylon-types';
import './babylon-canvas.css';

/**
 * BabylonCanvas Component
 * 
 * Responsible for:
 * - Rendering the HTML canvas element
 * - Initializing Babylon.js engine and scene
 * - Managing render loop
 * - Providing clean API for 3D rendering
 * 
 * @param props - Canvas configuration and styling props
 * @returns JSX element containing the canvas
 * 
 * @example
 * ```tsx
 * <BabylonCanvas
 *   className="my-canvas"
 *   sceneConfig={{
 *     enableCamera: true,
 *     enableLighting: true,
 *     backgroundColor: '#2c3e50'
 *   }}
 *   engineConfig={{
 *     antialias: true,
 *     powerPreference: 'high-performance'
 *   }}
 * />
 * ```
 */
export function BabylonCanvas({
  className = '',
  sceneConfig,
  engineConfig,
  onEngineReady,
  onSceneReady,
  onRenderFrame,
  'aria-label': ariaLabel = '3D Scene Canvas',
  ...canvasProps
}: BabylonCanvasProps): React.JSX.Element {
  console.log('[INIT] Initializing BabylonCanvas component');

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Initialize engine and scene using our refactored hooks
  const { engine, isReady: engineReady, error: engineError, dispose: disposeEngine } = useBabylonEngine(
    canvasRef.current,
    engineConfig
  );

  const { scene, isReady: sceneReady, render, dispose: disposeScene } = useBabylonScene(
    engine,
    sceneConfig
  );

  // Derived state
  const isInitialized = engineReady && sceneReady;

  // Callback for engine ready event
  useEffect(() => {
    if (engineReady && engine && onEngineReady) {
      console.log('[DEBUG] Engine ready, calling onEngineReady callback');
      onEngineReady(engine);
    }
  }, [engineReady, engine, onEngineReady]);

  // Callback for scene ready event
  useEffect(() => {
    if (sceneReady && scene && onSceneReady) {
      console.log('[DEBUG] Scene ready, calling onSceneReady callback');
      onSceneReady(scene);
    }
  }, [sceneReady, scene, onSceneReady]);

  // Render loop management
  const renderLoop = useCallback(() => {
    if (scene && !scene.isDisposed) {
      render();
      
      if (onRenderFrame) {
        onRenderFrame(scene);
      }
    }
  }, [scene, render, onRenderFrame]);

  // Setup render loop when scene is ready
  useEffect(() => {
    if (isInitialized && engine && scene) {
      console.log('[DEBUG] Starting Babylon.js render loop');
      
      engine.runRenderLoop(renderLoop);
      
      return () => {
        console.log('[DEBUG] Stopping Babylon.js render loop');
        engine.stopRenderLoop(renderLoop);
      };
    }
  }, [isInitialized, engine, scene, renderLoop]);

  // Debug logging for component status
  useEffect(() => {
    console.log('[DEBUG] BabylonCanvas Status:', JSON.stringify({
      canvasRef: !!canvasRef.current,
      engine: !!engine,
      engineReady,
      engineError,
      scene: !!scene,
      sceneReady,
      isInitialized
    }));
  }, [engine, engineReady, engineError, scene, sceneReady, isInitialized]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('[DEBUG] BabylonCanvas unmounting, cleaning up');
      disposeScene();
      disposeEngine();
    };
  }, [disposeScene, disposeEngine]);

  // Combine CSS classes
  const canvasClasses = ['babylon-canvas', className].filter(Boolean).join(' ');

  return (
    <canvas
      ref={canvasRef}
      className={canvasClasses}
      aria-label={ariaLabel}
      {...canvasProps}
    />
  );
}

// Re-export types for convenience
export type { BabylonCanvasProps };
