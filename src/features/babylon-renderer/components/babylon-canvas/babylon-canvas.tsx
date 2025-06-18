/**
 * @file Babylon Canvas Component
 *
 * Core canvas component for Babylon.js rendering
 * Handles engine and scene initialization with proper lifecycle management
 *
 * Features:
 * - Clean canvas rendering without UI controls (perfect for visual testing)
 * - Proper engine and scene lifecycle management
 * - Support for both development and testing environments
 * - Comprehensive logging for debugging
 *
 * @author Luciano Júnior
 * @date June 2025
 */

import React, { useEffect, useCallback, useState } from 'react';
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

  const [canvasElement, setCanvasElement] = useState<HTMLCanvasElement | null>(null);

  // Callback ref to capture canvas element when it's created
  const canvasRef = useCallback((canvas: HTMLCanvasElement | null) => {
    if (canvas && canvas !== canvasElement) {
      console.log('[DEBUG] Canvas element became available, updating state');
      setCanvasElement(canvas);
    } else if (!canvas && canvasElement) {
      console.log('[DEBUG] Canvas element removed, clearing state');
      setCanvasElement(null);
    }
  }, [canvasElement]);

  // Initialize engine and scene using our refactored hooks
  const { engine, isReady: engineReady, error: engineError, dispose: disposeEngine } = useBabylonEngine(
    canvasElement,
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

    // Return undefined for cases where condition is not met
    return undefined;
  }, [isInitialized, engine, scene, renderLoop]);

  // Debug logging for component status
  useEffect(() => {
    console.log('[DEBUG] BabylonCanvas Status:', JSON.stringify({
      canvasElement: !!canvasElement,
      engine: !!engine,
      engineReady,
      engineError,
      scene: !!scene,
      sceneReady,
      isInitialized
    }));
  }, [canvasElement, engine, engineReady, engineError, scene, sceneReady, isInitialized]);

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
