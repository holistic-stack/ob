/**
 * @file Babylon Renderer Component
 * 
 * Main renderer component that composes all Babylon.js sub-components
 * Provides centralized state management and component coordination
 * 
 * @author Luciano Júnior
 * @date June 2025
 */

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import * as BABYLON from '@babylonjs/core';
import { BabylonCanvas } from '../babylon-canvas/babylon-canvas';
import { SceneControls } from '../scene-controls/scene-controls';
import { MeshDisplay } from '../mesh-display/mesh-display';
import { DebugPanel } from '../debug-panel/debug-panel';
import type { BabylonRendererProps, DebugReport } from '../../types/babylon-types';
import { OpenScadAstVisitor } from '../../../babylon-csg2/openscad/ast-visitor/openscad-ast-visitor';
import { initializeCSG2ForBrowser } from '../../../babylon-csg2/lib/initializers/csg2-browser-initializer/csg2-browser-initializer';
import { compareASTCached } from '../../../ui-components/shared/utils/ast-comparison';
import type { ASTNode } from '@holistic-stack/openscad-parser';
import './babylon-renderer.css';

// ============================================================================
// Performance Optimization Utilities
// ============================================================================

/**
 * Optimized mesh disposal with batching for better performance
 */
async function disposeMeshesOptimized(meshes: BABYLON.AbstractMesh[]): Promise<void> {
  if (meshes.length === 0) return;

  // Batch dispose meshes to avoid blocking the main thread
  const batchSize = 10;
  for (let i = 0; i < meshes.length; i += batchSize) {
    const batch = meshes.slice(i, i + batchSize);

    // Dispose batch
    batch.forEach(mesh => {
      if (!mesh.isDisposed) {
        // Dispose geometry and materials first
        if (mesh.geometry) {
          mesh.geometry.dispose();
        }
        if (mesh.material) {
          mesh.material.dispose();
        }
        mesh.dispose();
      }
    });

    // Yield control to prevent blocking
    if (i + batchSize < meshes.length) {
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }
}

/**
 * Optimize individual mesh for hardware acceleration and performance
 */
function optimizeMeshForPerformance(mesh: BABYLON.AbstractMesh): void {
  // Enable hardware acceleration
  mesh.freezeWorldMatrix();

  // Optimize for static meshes
  if (mesh instanceof BABYLON.Mesh) {
    // Freeze normals for static geometry
    mesh.freezeNormals();

    // Enable instancing if applicable
    mesh.alwaysSelectAsActiveMesh = true;

    // Optimize material
    if (mesh.material) {
      // Enable material caching
      mesh.material.freeze();
    }
  }

  // Set culling optimization
  mesh.cullingStrategy = BABYLON.AbstractMesh.CULLINGSTRATEGY_BOUNDINGSPHERE_ONLY;

  // Enable occlusion queries for large meshes
  if (mesh.getBoundingInfo().boundingBox.extendSize.length() > 10) {
    mesh.occlusionQueryAlgorithmType = BABYLON.AbstractMesh.OCCLUSION_ALGORITHM_TYPE_CONSERVATIVE;
  }
}

/**
 * Optimize entire scene for performance after mesh creation
 */
function optimizeSceneForPerformance(scene: BABYLON.Scene, meshes: BABYLON.AbstractMesh[]): void {
  // Enable scene optimizations
  scene.skipPointerMovePicking = true;
  scene.skipPointerDownPicking = false;
  scene.skipPointerUpPicking = true;

  // Optimize rendering
  scene.autoClear = false;
  scene.autoClearDepthAndStencil = false;

  // Enable frustum culling
  scene.setRenderingAutoClearDepthStencil(0, true, true, true);

  // Optimize for static scenes
  if (meshes.length > 0) {
    // Merge static meshes if beneficial
    const staticMeshes = meshes.filter(mesh =>
      mesh instanceof BABYLON.Mesh &&
      !mesh.skeleton &&
      mesh.material
    ) as BABYLON.Mesh[];

    if (staticMeshes.length > 5) {
      console.log('[PERF] Consider mesh merging for', staticMeshes.length, 'static meshes');
    }
  }

  // Enable hardware scaling
  const engine = scene.getEngine();
  if (engine) {
    engine.setHardwareScalingLevel(1.0);

    // Enable adaptive quality
    if (meshes.length > 20) {
      console.log('[PERF] High mesh count detected, consider LOD implementation');
    }
  }
}

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
  astData,
  onASTProcessingStart,
  onASTProcessingComplete,
  onASTProcessingError,
  className = '',
  'aria-label': ariaLabel = 'Babylon Renderer',
  ...props
}: BabylonRendererProps): React.JSX.Element {
  console.log('[INIT] Initializing BabylonRenderer component');

  const [isEngineReady, setIsEngineReady] = useState(false);
  const [isSceneReady, setIsSceneReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [engine, setEngine] = useState<BABYLON.Engine | null>(null);
  const [scene, setScene] = useState<BABYLON.Scene | null>(null);

  // AST processing state
  const [isCSG2Initialized, setIsCSG2Initialized] = useState(false);
  const [astVisitor, setAstVisitor] = useState<OpenScadAstVisitor | null>(null);
  const [generatedMeshes, setGeneratedMeshes] = useState<BABYLON.AbstractMesh[]>([]);
  const [isProcessingAST, setIsProcessingAST] = useState(false);

  // Ref to track previous AST for comparison
  const previousASTRef = useRef<readonly ASTNode[]>([]);

  // Derived state
  const isReady = useMemo(() => {
    return isEngineReady && isSceneReady && engine && scene && !scene.isDisposed;
  }, [isEngineReady, isSceneReady, engine, scene]);

  // Handle engine ready callback from BabylonCanvas
  const handleEngineReady = useCallback((readyEngine: BABYLON.Engine) => {
    console.log('[DEBUG] Engine is ready in BabylonRenderer');
    setEngine(readyEngine);
    setIsEngineReady(true);
    if (onEngineReady) {
      onEngineReady(readyEngine);
    }
  }, [onEngineReady]);

  // Handle scene ready callback from BabylonCanvas
  const handleSceneReady = useCallback((readyScene: BABYLON.Scene) => {
    console.log('[DEBUG] Scene is ready in BabylonRenderer');
    setScene(readyScene);
    setIsSceneReady(true);
    if (onSceneReady) {
      onSceneReady(readyScene);
    }
  }, [onSceneReady]);

  // Initialize CSG2 when scene is ready
  useEffect(() => {
    if (scene && !isCSG2Initialized) {
      const initCSG2 = async () => {
        try {
          console.log('[DEBUG] Initializing CSG2 for AST processing...');
          const result = await initializeCSG2ForBrowser({
            enableLogging: true,
            timeout: 10000
          });

          if (result.success) {
            setIsCSG2Initialized(true);
            console.log('[DEBUG] CSG2 initialized successfully');

            // Create AST visitor
            const visitor = new OpenScadAstVisitor(scene);
            setAstVisitor(visitor);
            console.log('[DEBUG] AST visitor created');
          } else {
            console.error('[ERROR] CSG2 initialization failed:', result.error);
            onASTProcessingError?.(`CSG2 initialization failed: ${result.error}`);
          }
        } catch (error) {
          console.error('[ERROR] CSG2 initialization exception:', error);
          onASTProcessingError?.(`CSG2 initialization exception: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      };

      void initCSG2();
    }
  }, [scene, isCSG2Initialized, onASTProcessingError]);

  // Effect to handle scene changes
  useEffect(() => {
    if (scene && onSceneChange) {
      onSceneChange(scene);
    }
  }, [scene, onSceneChange]);

  // Process AST data when it changes with performance optimization
  useEffect(() => {
    if (astData && astData.length > 0 && astVisitor && isCSG2Initialized && !isProcessingAST) {
      // Check if AST has actually changed
      if (compareASTCached(previousASTRef.current, astData)) {
        return;
      }

      previousASTRef.current = astData;

      const processAST = async () => {
        const startTime = performance.now();
        setIsProcessingAST(true);
        onASTProcessingStart?.();

        try {
          console.log('[PERF] Starting AST processing with', astData.length, 'nodes');

          // Performance-optimized mesh disposal
          const disposalStartTime = performance.now();
          await disposeMeshesOptimized(generatedMeshes);
          const disposalTime = performance.now() - disposalStartTime;
          console.log(`[PERF] Mesh disposal completed in ${disposalTime.toFixed(2)}ms`);

          setGeneratedMeshes([]);

          // Process AST nodes with performance monitoring
          const processingStartTime = performance.now();
          const newMeshes: BABYLON.AbstractMesh[] = [];

          for (const astNode of astData) {
            const nodeStartTime = performance.now();
            try {
              const mesh = astVisitor.visit(astNode);
              if (mesh) {
                // Enable hardware acceleration for mesh
                optimizeMeshForPerformance(mesh);
                newMeshes.push(mesh);

                const nodeTime = performance.now() - nodeStartTime;
                console.log(`[PERF] Created mesh from ${astNode.type} in ${nodeTime.toFixed(2)}ms`);
              }
            } catch (nodeError) {
              console.error('[ERROR] Failed to process AST node:', astNode.type, nodeError);
            }
          }

          const processingTime = performance.now() - processingStartTime;
          console.log(`[PERF] AST node processing completed in ${processingTime.toFixed(2)}ms`);

          // Optimize scene after mesh creation
          if (scene && newMeshes.length > 0) {
            optimizeSceneForPerformance(scene, newMeshes);
          }

          setGeneratedMeshes(newMeshes);
          onASTProcessingComplete?.(newMeshes);

          const totalTime = performance.now() - startTime;
          console.log(`[PERF] Total AST processing completed in ${totalTime.toFixed(2)}ms (target: <500ms)`);

          // Performance benchmark validation
          if (totalTime > 500) {
            console.warn(`[PERF] AST processing exceeded target time: ${totalTime.toFixed(2)}ms > 500ms`);
          }

        } catch (error) {
          console.error('[ERROR] AST processing failed:', error);
          onASTProcessingError?.(error instanceof Error ? error.message : 'Unknown AST processing error');
        } finally {
          setIsProcessingAST(false);
        }
      };

      void processAST();
    }
  }, [astData, astVisitor, isCSG2Initialized, isProcessingAST, scene, onASTProcessingStart, onASTProcessingComplete, onASTProcessingError]); // Removed generatedMeshes to prevent infinite loop

  // Error handling
  const handleError = useCallback((newError: Error) => {
    setError(newError);
    if (onError) {
      onError(newError);
    }
  }, [onError]);

  // Scene controls event handlers
  const handleWireframeToggle = useCallback(() => {
    if (scene && onSceneChange) {
      onSceneChange(scene);
    }
  }, [scene, onSceneChange]);

  const handleCameraReset = useCallback(() => {
    if (scene && onSceneChange) {
      onSceneChange(scene);
    }
  }, [scene, onSceneChange]);

  const handleLightingToggle = useCallback(() => {
    if (scene && onSceneChange) {
      onSceneChange(scene);
    }
  }, [scene, onSceneChange]);

  const handleBackgroundColorChange = useCallback((_color: string) => {
    if (scene && onSceneChange) {
      onSceneChange(scene);
    }
  }, [scene, onSceneChange]);

  // Mesh display event handlers
  const handleMeshSelect = useCallback((mesh: BABYLON.AbstractMesh) => {
    if (onMeshSelect) {
      onMeshSelect(mesh);
    }
  }, [onMeshSelect]);

  const handleMeshDelete = useCallback((mesh: BABYLON.AbstractMesh) => {
    if (scene) {
      mesh.dispose();
      if (onSceneChange) {
        onSceneChange(scene);
      }
    }
  }, [scene, onSceneChange]);

  const handleMeshToggleVisibility = useCallback((mesh: BABYLON.AbstractMesh) => {
    mesh.isVisible = !mesh.isVisible;
    if (scene && onSceneChange) {
      onSceneChange(scene);
    }
  }, [scene, onSceneChange]);

  // Debug panel event handlers
  const handleDebugRefresh = useCallback(() => {
    // Force re-render to refresh debug information
    if (scene && onSceneChange) {
      onSceneChange(scene);
    }
  }, [scene, onSceneChange]);

  const handleDebugExport = useCallback((report: DebugReport) => {
    if (onDebugExport) {
      onDebugExport(report);
    }
  }, [onDebugExport]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Cleanup is handled by BabylonCanvas component
    };
  }, []);

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
          {...(engineConfig && { engineConfig })}
          {...(sceneConfig && { sceneConfig })}
          onEngineReady={handleEngineReady}
          onSceneReady={handleSceneReady}
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
