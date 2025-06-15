/**
 * @file Babylon Renderer Component
 * 
 * Main renderer component that composes all Babylon.js sub-components
 * Provides centralized state management and component coordination
 * 
 * @author Luciano Júnior
 * @date June 2025
 */

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import * as BABYLON from '@babylonjs/core';
import { BabylonCanvas } from '../babylon-canvas/babylon-canvas';
import { SceneControls } from '../scene-controls/scene-controls';
import { MeshDisplay } from '../mesh-display/mesh-display';
import { DebugPanel } from '../debug-panel/debug-panel';
import { useBabylonEngine } from '../../hooks/use-babylon-engine/use-babylon-engine';
import { useBabylonScene } from '../../hooks/use-babylon-scene/use-babylon-scene';
import type { BabylonRendererProps, DebugReport } from '../../types/babylon-types';
import './babylon-renderer.css';

/**
 * BabylonRenderer Component
 * 
 * Main component responsible for:
 * - Composing all Babylon.js sub-components (Canvas, Controls, Display, Debug)
 * - Managing centralized state for engine and scene
 * - Coordinating data flow and event handling between components
 * - Providing responsive layout and accessibility features
 * - Handling component lifecycle and resource cleanup
 * 
 * @param props - Renderer configuration and event handlers
 * @returns JSX element containing the complete Babylon.js renderer interface
 * 
 * @example
 * ```tsx
 * <BabylonRenderer
 *   layout="grid"
 *   showSceneControls={true}
 *   showMeshDisplay={true}
 *   showDebugPanel={true}
 *   onSceneReady={(scene) => console.log('Scene ready:', scene)}
 *   onMeshSelect={(mesh) => console.log('Mesh selected:', mesh)}
 * />
 * ```
 */
export function BabylonRenderer({
  engineConfig,
  sceneConfig,
  layout = 'flex',
  responsive = true,
  showSceneControls = false,
  showMeshDisplay = false,
  showDebugPanel = false,
  sceneControlsConfig = {},
  meshDisplayConfig = {},
  debugPanelConfig = {},
  onSceneChange,
  onMeshSelect,
  onDebugExport,
  onEngineReady,
  onSceneReady,
  onError,
  className = '',
  'aria-label': ariaLabel = 'Babylon Renderer',
  ...props
}: BabylonRendererProps): React.JSX.Element {
  console.log('[INIT] Initializing BabylonRenderer component');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isEngineReady, setIsEngineReady] = useState(false);
  const [isSceneReady, setIsSceneReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Engine management
  const { engine, dispose: disposeEngine } = useBabylonEngine(canvasRef, engineConfig);

  // Scene management
  const { scene, render, dispose: disposeScene } = useBabylonScene(engine, sceneConfig);

  // Derived state
  const isReady = useMemo(() => {
    return isEngineReady && isSceneReady && engine && scene && !scene.isDisposed;
  }, [isEngineReady, isSceneReady, engine, scene]);

  // Effect to track engine readiness
  useEffect(() => {
    if (engine && !engine.isDisposed) {
      console.log('[DEBUG] Engine is ready');
      setIsEngineReady(true);
      if (onEngineReady) {
        onEngineReady(engine);
      }
    } else {
      setIsEngineReady(false);
    }
  }, [engine, onEngineReady]);

  // Effect to track scene readiness
  useEffect(() => {
    if (scene && !scene.isDisposed && scene.isReady()) {
      console.log('[DEBUG] Scene is ready');
      setIsSceneReady(true);
      if (onSceneReady) {
        onSceneReady(scene);
      }
    } else {
      setIsSceneReady(false);
    }
  }, [scene, onSceneReady]);

  // Effect to handle scene changes
  useEffect(() => {
    if (scene && onSceneChange) {
      onSceneChange(scene);
    }
  }, [scene, onSceneChange]);

  // Error handling
  const handleError = useCallback((newError: Error) => {
    console.error('[ERROR] BabylonRenderer error:', newError);
    setError(newError);
    if (onError) {
      onError(newError);
    }
  }, [onError]);

  // Scene controls event handlers
  const handleWireframeToggle = useCallback(() => {
    console.log('[DEBUG] Wireframe toggle requested');
    if (scene && onSceneChange) {
      onSceneChange(scene);
    }
  }, [scene, onSceneChange]);

  const handleCameraReset = useCallback(() => {
    console.log('[DEBUG] Camera reset requested');
    if (scene && onSceneChange) {
      onSceneChange(scene);
    }
  }, [scene, onSceneChange]);

  const handleLightingToggle = useCallback(() => {
    console.log('[DEBUG] Lighting toggle requested');
    if (scene && onSceneChange) {
      onSceneChange(scene);
    }
  }, [scene, onSceneChange]);

  const handleBackgroundColorChange = useCallback((color: string) => {
    console.log('[DEBUG] Background color change requested:', color);
    if (scene && onSceneChange) {
      onSceneChange(scene);
    }
  }, [scene, onSceneChange]);

  // Mesh display event handlers
  const handleMeshSelect = useCallback((mesh: BABYLON.AbstractMesh) => {
    console.log('[DEBUG] Mesh selected:', mesh.name);
    if (onMeshSelect) {
      onMeshSelect(mesh);
    }
  }, [onMeshSelect]);

  const handleMeshDelete = useCallback((mesh: BABYLON.AbstractMesh) => {
    console.log('[DEBUG] Mesh delete requested:', mesh.name);
    if (scene) {
      mesh.dispose();
      if (onSceneChange) {
        onSceneChange(scene);
      }
    }
  }, [scene, onSceneChange]);

  const handleMeshToggleVisibility = useCallback((mesh: BABYLON.AbstractMesh) => {
    console.log('[DEBUG] Mesh visibility toggle requested:', mesh.name);
    mesh.isVisible = !mesh.isVisible;
    if (scene && onSceneChange) {
      onSceneChange(scene);
    }
  }, [scene, onSceneChange]);

  // Debug panel event handlers
  const handleDebugRefresh = useCallback(() => {
    console.log('[DEBUG] Debug refresh requested');
    // Force re-render to refresh debug information
    if (scene && onSceneChange) {
      onSceneChange(scene);
    }
  }, [scene, onSceneChange]);

  const handleDebugExport = useCallback((report: DebugReport) => {
    console.log('[DEBUG] Debug export requested');
    if (onDebugExport) {
      onDebugExport(report);
    }
  }, [onDebugExport]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('[DEBUG] Cleaning up BabylonRenderer');
      disposeScene();
      disposeEngine();
    };
  }, [disposeScene, disposeEngine]);

  // Combine CSS classes
  const containerClasses = [
    'babylon-renderer',
    `babylon-renderer--${layout}`,
    responsive && 'babylon-renderer--responsive',
    error && 'babylon-renderer--error',
    className
  ].filter(Boolean).join(' ');

  // Error boundary rendering
  if (error) {
    return (
      <main
        className={containerClasses}
        role="main"
        aria-label={ariaLabel}
        data-testid="babylon-renderer-container"
        {...props}
      >
        <div className="babylon-renderer__error">
          <h2 className="babylon-renderer__error-title">Rendering Error</h2>
          <p className="babylon-renderer__error-message">{error.message}</p>
          <button
            type="button"
            className="babylon-renderer__error-retry"
            onClick={() => setError(null)}
          >
            Retry
          </button>
        </div>
      </main>
    );
  }

  return (
    <main
      className={containerClasses}
      role="main"
      aria-label={ariaLabel}
      data-testid="babylon-renderer-container"
      {...props}
    >
      {/* Main Canvas Area */}
      <div className="babylon-renderer__canvas-area">
        <BabylonCanvas
          ref={canvasRef}
          engineConfig={engineConfig}
          sceneConfig={sceneConfig}
          aria-label="Babylon Canvas"
        />
      </div>

      {/* Scene Controls Panel */}
      {showSceneControls && (
        <div className="babylon-renderer__controls-area">
          <SceneControls
            scene={scene}
            onWireframeToggle={handleWireframeToggle}
            onCameraReset={handleCameraReset}
            onLightingToggle={handleLightingToggle}
            onBackgroundColorChange={handleBackgroundColorChange}
            {...sceneControlsConfig}
          />
        </div>
      )}

      {/* Mesh Display Panel */}
      {showMeshDisplay && (
        <div className="babylon-renderer__mesh-area">
          <MeshDisplay
            scene={scene}
            onMeshSelect={handleMeshSelect}
            onMeshDelete={handleMeshDelete}
            onMeshToggleVisibility={handleMeshToggleVisibility}
            {...meshDisplayConfig}
          />
        </div>
      )}

      {/* Debug Panel */}
      {showDebugPanel && (
        <div className="babylon-renderer__debug-area">
          <DebugPanel
            scene={scene}
            onRefresh={handleDebugRefresh}
            onExportReport={handleDebugExport}
            {...debugPanelConfig}
          />
        </div>
      )}

      {/* Loading State */}
      {!isReady && !error && (
        <div className="babylon-renderer__loading">
          <div className="babylon-renderer__loading-spinner" />
          <span className="babylon-renderer__loading-text">
            Initializing Babylon.js Renderer...
          </span>
        </div>
      )}
    </main>
  );
}

// Re-export types for convenience
export type { BabylonRendererProps };
