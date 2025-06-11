/**
 * @file Modern Babylon.js Renderer Component (React 19)
 *
 * Refactored following modern React patterns and SOLID principles:
 * - SRP: Single responsibility for 3D rendering only
 * - DRY: Reusable hooks and utilities
 * - Minimal useEffect: Derived state and event handlers
 * - Proper separation of concerns
 */
import React, { useRef, useMemo, useEffect } from 'react';
import { BabylonRendererProps } from '../../types/pipeline-types';
import { useBabylonEngine } from './hooks/use-babylon-engine';
import { useBabylonScene } from './hooks/use-babylon-scene';
import { useMeshManager } from './hooks/use-mesh-manager';
import { debugActions } from './utils/debug-controls';
import './babylon-renderer.css';

/**
 * Modern Babylon.js renderer component
 *
 * Follows SRP: Only responsible for coordinating 3D rendering
 * Uses custom hooks for engine, scene, and mesh management
 * Minimal state and effects - leverages derived state patterns
 */
export function BabylonRenderer({
  pipelineResult,
  isProcessing,
  sceneConfig
}: BabylonRendererProps): React.JSX.Element {
  console.log('[INIT] Modern BabylonRenderer rendering with DRY/SRP patterns');

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Memoized configuration (avoiding unnecessary re-renders)
  const config = useMemo(() => ({
    enableCamera: true,
    enableLighting: true,
    backgroundColor: '#2c3e50',
    cameraPosition: [10, 10, 10] as [number, number, number],
    ...sceneConfig
  }), [sceneConfig]);

  // Custom hooks following SRP
  const { engine, isReady: engineReady, error: engineError } = useBabylonEngine(canvasRef.current);
  const { scene, isReady: sceneReady } = useBabylonScene(engine, config);
  const { currentMesh, updateMesh, clearMesh } = useMeshManager(scene);

  // Derived state (avoiding useState where possible)
  const isInitialized = engineReady && sceneReady;
  const error = engineError;

  // Debug controls configuration (derived state)
  const debugConfig = useMemo(() =>
    debugActions.createDebugControlsConfig(scene),
    [scene, currentMesh]
  );

  // Debug control handlers (pure event handlers)
  const handleCreateTestCube = () => {
    if (scene) {
      debugActions.createTestCube(scene);
    }
  };

  const handleDebugScene = () => {
    if (scene) {
      debugActions.logSceneDebugInfo(scene);
    }
  };

  const handleClearScene = () => {
    if (scene) {
      debugActions.clearSceneMeshes(scene);
      clearMesh();
    }
  };

  // Use useEffect for pipeline result updates (proper React pattern)
  useEffect(() => {
    if (pipelineResult && pipelineResult.success && isInitialized) {
      updateMesh(pipelineResult);
    }
  }, [pipelineResult, isInitialized, updateMesh]);

  return (
    <div className="babylon-renderer">
      <div className="renderer-header">
        <h3>Modern 3D Renderer</h3>
        <div className="renderer-status">
          {isProcessing && <span className="status-badge processing" data-testid="status-indicator">Processing...</span>}
          {!isProcessing && pipelineResult?.success && <span className="status-badge success" data-testid="status-indicator">Success</span>}
          {error && <span className="status-badge error" data-testid="status-indicator">Error</span>}
        </div>
      </div>

      <div className="renderer-canvas-container">
        <canvas
          ref={canvasRef}
          className="babylon-canvas"
          width={800}
          height={600}
          aria-label="3D Scene Canvas"
        />

        {error && (
          <div className="renderer-error">
            <span>⚠️ {error}</span>
          </div>
        )}

        {!isInitialized && !error && (
          <div className="renderer-loading">
            <span>⟳ Initializing renderer...</span>
          </div>
        )}
      </div>

      {/* Mesh Information Panel */}
      {currentMesh && (
        <div className="mesh-info-panel" data-testid="mesh-info">
          <h4>Mesh Information</h4>
          <p>Name: <span>{currentMesh.name}</span></p>
          <p>Vertices: <span>{currentMesh.getTotalVertices()}</span></p>
          <p>Indices: <span>{currentMesh.getTotalIndices()}</span></p>
        </div>
      )}

      {/* Performance Metrics Panel */}
      {pipelineResult?.success && pipelineResult.metadata && (
        <div className="performance-metrics" data-testid="performance-metrics">
          <h4>Performance Metrics</h4>
          <p>Parse Time: <span>{pipelineResult.metadata.parseTimeMs}ms</span></p>
          <p>Visit Time: <span>{pipelineResult.metadata.visitTimeMs}ms</span></p>
          <p>Total Time: <span>{pipelineResult.metadata.totalTimeMs}ms</span></p>
          <p>Node Count: <span>{pipelineResult.metadata.nodeCount}</span></p>
          <p>Mesh Count: <span>{pipelineResult.metadata.meshCount}</span></p>
        </div>
      )}

      <div className="debug-controls" style={{ padding: '10px', border: '1px solid #ccc' }}>
        <button
          onClick={handleCreateTestCube}
          disabled={!debugConfig.canCreateTestCube}
          style={{ margin: '5px' }}
        >
          Create Test Cube
        </button>
        <button
          onClick={handleDebugScene}
          disabled={!debugConfig.canDebugScene}
          style={{ margin: '5px' }}
        >
          Debug Scene
        </button>
        <button
          onClick={handleClearScene}
          disabled={!debugConfig.canClearScene}
          style={{ margin: '5px' }}
        >
          Clear Scene
        </button>
      </div>
    </div>
  );
}
