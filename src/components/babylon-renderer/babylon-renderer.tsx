/**
 * @file Clean Babylon.js Renderer Component
 *
 * Minimal renderer component with only essential canvas element
 * and basic Babylon.js engine initialization
 */
import React, { useRef, useMemo, useEffect } from 'react';
import { BabylonRendererProps } from '../../types/pipeline-types';
import { useBabylonEngine } from './hooks/use-babylon-engine';
import { useBabylonScene } from './hooks/use-babylon-scene';
import { useMeshManager } from './hooks/use-mesh-manager';
import './babylon-renderer.css';

/**
 * Clean Babylon.js renderer component
 * Contains only the essential canvas element and basic functionality
 */
export function BabylonRenderer({
  pipelineResult,
  isProcessing,
  sceneConfig
}: BabylonRendererProps): React.JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Memoized configuration
  const config = useMemo(() => ({
    enableCamera: true,
    enableLighting: true,
    backgroundColor: '#2c3e50',
    cameraPosition: [10, 10, 10] as [number, number, number],
    ...sceneConfig
  }), [sceneConfig]);

  // Custom hooks for Babylon.js functionality
  const { engine, isReady: engineReady, error: engineError } = useBabylonEngine(canvasRef);
  const { scene, isReady: sceneReady } = useBabylonScene(engine, config);
  const { updateMesh } = useMeshManager(scene);

  // Derived state
  const isInitialized = engineReady && sceneReady;

  // Debug logging for renderer status
  useEffect(() => {
    console.log('[DEBUG] Babylon Renderer Status:', JSON.stringify({
      canvasRef: !!canvasRef.current,
      engine: !!engine,
      engineReady,
      scene: !!scene,
      sceneReady,
      isInitialized,
      error: engineError
    }));
  }, [engine, engineReady, scene, sceneReady, isInitialized, engineError]);

  // Handle pipeline result updates
  useEffect(() => {
    if (pipelineResult && pipelineResult.success && isInitialized) {
      console.log('[DEBUG] Processing pipeline result...');
      updateMesh(pipelineResult);
    }
  }, [pipelineResult, isInitialized, updateMesh]);
  return (
    <canvas
      ref={canvasRef}
      className="babylon-canvas"
      aria-label="3D Scene Canvas"
    />
  );
}
