/**
 * Store-Connected Three.js Renderer Component
 *
 * Zustand-centric React component that renders 3D sc    // Trigger rendering through store action
    renderFromAST(ast).then(
      (result: any) => {
        if (result.success) {
          console.log(`[DEBUG][StoreConnectedRenderer] AST rendering successful: ${result.data?.length ?? 0} meshes`);
        } else {
          console.log('[ERROR][StoreConnectedRenderer] AST rendering failed:', result.error);
          addRenderError(result.error);
        }
      },
      (error: any) => {ively through
 * the application store, implementing the proper data flow:
 * OpenSCAD code → Store → AST → Three.js rendering
 */

import React, { useEffect, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { Stats } from '@react-three/drei';

import { useAppStore } from '../../store';
import {
  selectParsingAST,
  selectRenderingCamera,
  selectRenderingState,
  selectPerformanceMetrics,
  selectConfigEnableRealTimeRendering
} from '../../store/selectors';
import { R3FScene } from './r3f-scene';
import type { CameraConfig, RenderingMetrics, Mesh3D } from '../types/renderer.types';
import type { Result } from '../../../shared/types/result.types';
import type * as THREE from 'three';

/**
 * Props for the store-connected renderer
 */
interface StoreConnectedRendererProps {
  readonly className?: string;
  readonly 'data-testid'?: string;
  readonly width?: number;
  readonly height?: number;
}

/**
 * Store-connected Three.js renderer that implements Zustand-only data flow
 */
export const StoreConnectedRenderer: React.FC<StoreConnectedRendererProps> = ({
  className = '',
  'data-testid': testId = 'store-connected-renderer',
  width = 800,
  height = 600
}) => {
  console.log('[INIT][StoreConnectedRenderer] Initializing store-connected 3D renderer');

  // Store selectors - all data comes from Zustand
  const ast = useAppStore(selectParsingAST);
  const camera = useAppStore(selectRenderingCamera);
  const renderingState = useAppStore(selectRenderingState);
  const performanceMetrics = useAppStore(selectPerformanceMetrics);
  const enableRealTimeRendering = useAppStore(selectConfigEnableRealTimeRendering);

  // Store actions - all mutations go through Zustand
  const updateCamera = useAppStore((state) => state.updateCamera);
  const updateMetrics = useAppStore((state) => state.updateMetrics);
  const renderFromAST = useAppStore((state) => state.renderFromAST);
  const addRenderError = useAppStore((state) => state.addRenderError);
  const clearRenderErrors = useAppStore((state) => state.clearRenderErrors);

  /**
   * Handle camera changes - update store
   */
  const handleCameraChange = useCallback((newCamera: CameraConfig) => {
    console.log('[DEBUG][StoreConnectedRenderer] Camera changed, updating store');
    updateCamera(newCamera);
  }, [updateCamera]);

  /**
   * Handle performance metrics updates - update store
   */
  const handlePerformanceUpdate = useCallback((metrics: RenderingMetrics) => {
    console.log('[DEBUG][StoreConnectedRenderer] Performance metrics updated');
    updateMetrics(metrics);
  }, [updateMetrics]);

  /**
   * Handle render completion - update store state
   */
  const handleRenderComplete = useCallback((meshes: ReadonlyArray<Mesh3D>) => {
    console.log(`[DEBUG][StoreConnectedRenderer] Render completed with ${meshes.length} meshes`);

    // Update store with actual mesh data
    useAppStore.setState((state) => {
      state.rendering.meshes = meshes.map(m => m.mesh);
    });

    console.log(`[DEBUG][StoreConnectedRenderer] Updated store with ${meshes.length} meshes`);
  }, []);

  /**
   * Handle render errors - update store
   */
  const handleRenderError = useCallback((error: { message: string }) => {
    console.log('[ERROR][StoreConnectedRenderer] Render error:', error.message);
    addRenderError(error.message);
  }, [addRenderError]);

  /**
   * Effect: Trigger rendering when AST changes (if real-time rendering is enabled)
   */
  useEffect(() => {
    if (!enableRealTimeRendering || !ast || ast.length === 0) {
      return;
    }

    console.log('[DEBUG][StoreConnectedRenderer] AST changed, triggering render');
    clearRenderErrors();
    
    // Trigger rendering through store action
    renderFromAST(ast).then(
      (result: Result<ReadonlyArray<THREE.Mesh>, string>) => {
        if (result.success) {
          console.log(`[DEBUG][StoreConnectedRenderer] AST rendering successful: ${result.data?.length ?? 0} meshes`);
        } else {
          console.log('[ERROR][StoreConnectedRenderer] AST rendering failed:', result.error);
          addRenderError(result.error);
        }
      }
    ).catch((error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.log('[ERROR][StoreConnectedRenderer] AST rendering exception:', errorMessage);
      addRenderError(errorMessage);
    });
  }, [ast, enableRealTimeRendering, renderFromAST, clearRenderErrors, addRenderError]);

  /**
   * Effect: Log store state changes for debugging
   */
  useEffect(() => {
    console.log('[DEBUG][StoreConnectedRenderer] Store state updated:', {
      astNodeCount: ast?.length ?? 0,
      isRendering: renderingState.isRendering,
      meshCount: renderingState.meshes.length,
      errorCount: renderingState.renderErrors.length,
      cameraPosition: camera?.position,
      lastRenderTime: performanceMetrics.renderTime
    });
  }, [ast, renderingState, camera, performanceMetrics]);

  // Default camera configuration
  const defaultCamera: CameraConfig = camera ?? {
    position: [5, 5, 5],
    target: [0, 0, 0]
  };

  return (
    <div 
      className={`store-connected-renderer ${className}`}
      data-testid={testId}
      style={{ width, height }}
    >
      <Canvas
        camera={{
          position: defaultCamera.position,
          fov: 75,
          near: 0.1,
          far: 1000
        }}
        style={{ width: '100%', height: '100%' }}
      >
        {/* R3F Scene component - handles all Three.js rendering */}
        <R3FScene
          astNodes={ast ?? []}
          camera={defaultCamera}
          onCameraChange={handleCameraChange}
          onPerformanceUpdate={handlePerformanceUpdate}
          onRenderComplete={handleRenderComplete}
          onRenderError={handleRenderError}
        />

        {/* Performance stats (if monitoring is enabled) */}
        {process.env.NODE_ENV === 'development' && <Stats />}
      </Canvas>

      {/* Rendering status indicator */}
      {renderingState.isRendering && (
        <div 
          className="absolute top-4 right-4 bg-blue-500 text-white px-3 py-1 rounded"
          data-testid="rendering-indicator"
        >
          Rendering...
        </div>
      )}

      {/* Error display */}
      {renderingState.renderErrors.length > 0 && (
        <div 
          className="absolute bottom-4 left-4 bg-red-500 text-white px-3 py-1 rounded max-w-md"
          data-testid="error-display"
        >
          <div className="font-semibold">Render Errors:</div>
          {renderingState.renderErrors.map((error: string, index: number) => (
            <div key={index} className="text-sm">{error}</div>
          ))}
        </div>
      )}

      {/* Performance metrics display (development only) */}
      {process.env.NODE_ENV === 'development' && (
        <div 
          className="absolute top-4 left-4 bg-gray-800 text-white px-3 py-2 rounded text-sm"
          data-testid="performance-display"
        >
          <div>Render Time: {performanceMetrics.renderTime.toFixed(2)}ms</div>
          <div>Parse Time: {performanceMetrics.parseTime.toFixed(2)}ms</div>
          <div>Memory: {(performanceMetrics.memoryUsage / 1024 / 1024).toFixed(1)}MB</div>
          <div>Meshes: {renderingState.meshes.length}</div>
        </div>
      )}
    </div>
  );
};

export default StoreConnectedRenderer;
