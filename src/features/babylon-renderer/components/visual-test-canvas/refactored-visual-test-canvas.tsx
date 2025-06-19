/**
 * @file Refactored Visual Test Canvas Component
 *
 * Refactored canvas component following SRP principles
 * Accepts meshes as props and focuses only on rendering
 * 
 * Features:
 * - Accepts pre-generated meshes as props
 * - Configurable scene settings via props
 * - Material application using material manager utilities
 * - Camera positioning using camera manager utilities
 * - Clean separation of concerns
 * - Comprehensive logging for debugging
 *
 * @author OpenSCAD-Babylon Pipeline
 * @date June 2025
 */

import React, { useEffect, useCallback, useState } from 'react';
import * as BABYLON from '@babylonjs/core';
import { useBabylonEngine } from '../../hooks/use-babylon-engine/use-babylon-engine';
import { useBabylonScene } from '../../hooks/use-babylon-scene/use-babylon-scene';
import type { BabylonCanvasProps } from '../../types/babylon-types';
import { applyMaterialsToMeshCollection } from './utils/material-manager';
import { positionCameraForMeshes } from './utils/camera-manager';
import type { 
  VisualTestCanvasProps,
  MeshCollection,
  VisualTestSceneConfig,
  MaterialManagerConfig,
  CameraManagerConfig
} from './types/visual-test-canvas-types';
import './visual-test-canvas.css';

/**
 * Default visual test scene configuration
 */
const DEFAULT_VISUAL_SCENE_CONFIG: VisualTestSceneConfig = {
  backgroundColor: '#000000', // Black background for better contrast
  camera: {
    autoPosition: true,
    type: 'arcRotate'
  },
  lighting: {
    enableDefaultLighting: true,
    ambientIntensity: 0.3,
    directionalIntensity: 0.7
  }
} as const;

/**
 * Default material manager configuration
 */
const DEFAULT_MATERIAL_CONFIG: MaterialManagerConfig = {
  theme: 'default'
} as const;

/**
 * Default camera manager configuration
 */
const DEFAULT_CAMERA_CONFIG: CameraManagerConfig = {
  autoPosition: true,
  paddingFactor: 3.5,
  minDistance: 5,
  maxDistance: 1000
} as const;

/**
 * RefactoredVisualTestCanvas Component
 * 
 * Specialized canvas for visual regression testing that accepts meshes as props.
 * Focuses only on rendering and scene management, following SRP principles.
 * 
 * @param props - Canvas configuration with mesh data
 * @returns JSX element containing the test canvas
 * 
 * @example
 * ```tsx
 * <RefactoredVisualTestCanvas
 *   testName="cube-basic"
 *   meshes={meshCollection}
 *   visualSceneConfig={{
 *     backgroundColor: '#ffffff',
 *     camera: { autoPosition: true }
 *   }}
 *   width={800}
 *   height={600}
 *   enableDebugLogging={true}
 * />
 * ```
 */
export function RefactoredVisualTestCanvas({
  meshes,
  visualSceneConfig = DEFAULT_VISUAL_SCENE_CONFIG,
  testName = 'visual-test',
  enableDebugLogging = true,
  width = 800,
  height = 600,
  sceneConfig,
  engineConfig,
  onEngineReady,
  onSceneReady,
  onRenderFrame,
  onRenderingComplete,
  onMeshesReady,
  onCameraReady,
  ...canvasProps
}: VisualTestCanvasProps): React.JSX.Element {
  
  // Logging utility
  const log = useCallback((message: string) => {
    if (enableDebugLogging) {
      console.log(`[REFACTORED-VISUAL-TEST:${testName}] ${message}`);
    }
  }, [enableDebugLogging, testName]);

  log('[INIT] Initializing RefactoredVisualTestCanvas component');

  // State management
  const [canvasElement, setCanvasElement] = useState<HTMLCanvasElement | null>(null);
  const [isRenderingComplete, setIsRenderingComplete] = useState(false);
  const [meshesProcessed, setMeshesProcessed] = useState(false);

  // Callback ref to capture canvas element
  const canvasRef = useCallback((canvas: HTMLCanvasElement | null) => {
    if (canvas && canvas !== canvasElement) {
      log('[DEBUG] Canvas element became available');
      setCanvasElement(canvas);
    } else if (!canvas && canvasElement) {
      log('[DEBUG] Canvas element removed');
      setCanvasElement(null);
    }
  }, [canvasElement, log]);

  // Merge scene configurations
  const mergedSceneConfig = {
    enableCamera: true,
    enableLighting: true,
    backgroundColor: visualSceneConfig.backgroundColor || DEFAULT_VISUAL_SCENE_CONFIG.backgroundColor,
    ...sceneConfig
  };

  // Enhanced engine configuration for visual testing
  const testEngineConfig = {
    antialias: true,
    powerPreference: 'high-performance' as const,
    preserveDrawingBuffer: true, // Important for screenshots
    ...engineConfig
  };

  // Initialize engine and scene
  const { engine, isReady: engineReady, error: engineError, dispose: disposeEngine } = useBabylonEngine(
    canvasElement,
    testEngineConfig
  );

  const { scene, isReady: sceneReady, render, dispose: disposeScene } = useBabylonScene(
    engine,
    mergedSceneConfig
  );

  // Derived state
  const isInitialized = engineReady && sceneReady;

  /**
   * Process meshes by applying materials and positioning camera
   */
  const processMeshes = useCallback(async (meshCollection: MeshCollection) => {
    if (!scene || !meshCollection) {
      log('[DEBUG] Skipping mesh processing - no scene or mesh collection');
      return;
    }

    const totalMeshes = meshCollection.mainMeshes.length + meshCollection.referenceMeshes.length;
    if (totalMeshes === 0) {
      log('[DEBUG] Skipping mesh processing - empty mesh collection');
      return;
    }

    log(`[DEBUG] Processing ${totalMeshes} meshes (${meshCollection.mainMeshes.length} main, ${meshCollection.referenceMeshes.length} reference)`);

    try {
      // Apply materials to all meshes
      log('[DEBUG] Applying materials to mesh collection');
      const materialResult = await applyMaterialsToMeshCollection(
        meshCollection,
        scene,
        DEFAULT_MATERIAL_CONFIG
      );

      if (materialResult.success) {
        log(`[DEBUG] Materials applied: ${materialResult.data.appliedCount} successful, ${materialResult.data.failedCount} failed`);
        if (materialResult.data.errors.length > 0) {
          materialResult.data.errors.forEach(error => log(`[WARN] Material error: ${error}`));
        }
      } else {
        log(`[ERROR] Material application failed: ${materialResult.error}`);
      }

      // Position camera for optimal viewing
      if (visualSceneConfig.camera?.autoPosition !== false) {
        log('[DEBUG] Positioning camera for mesh collection');
        const cameraResult = await positionCameraForMeshes(
          meshCollection,
          scene,
          DEFAULT_CAMERA_CONFIG
        );

        if (cameraResult.success) {
          log(`[DEBUG] Camera positioned successfully at distance ${cameraResult.data.radius}`);
          if (onCameraReady && scene.activeCamera) {
            onCameraReady(scene.activeCamera);
          }
        } else {
          log(`[WARN] Camera positioning failed: ${cameraResult.error}`);
        }
      }

      // Notify that meshes are ready
      if (onMeshesReady) {
        log('[DEBUG] Calling onMeshesReady callback');
        onMeshesReady(meshCollection);
      }

      setMeshesProcessed(true);
      log('[DEBUG] Mesh processing completed successfully');

    } catch (error) {
      log(`[ERROR] Exception during mesh processing: ${error}`);
    }
  }, [scene, visualSceneConfig.camera?.autoPosition, onMeshesReady, onCameraReady, log]);

  // Enhanced callback for engine ready event
  useEffect(() => {
    if (engineReady && engine && onEngineReady) {
      log('[DEBUG] Engine ready, calling onEngineReady callback');
      onEngineReady(engine);
    }
  }, [engineReady, engine, onEngineReady, log]);

  // Enhanced callback for scene ready event
  useEffect(() => {
    if (sceneReady && scene && onSceneReady) {
      log('[DEBUG] Scene ready, calling onSceneReady callback');
      onSceneReady(scene);
    }
  }, [sceneReady, scene, onSceneReady, log]);

  // Process meshes when scene is ready and meshes are provided
  useEffect(() => {
    if (isInitialized && scene && meshes && !meshesProcessed) {
      log('[DEBUG] Scene initialized, processing meshes');
      void processMeshes(meshes);
    }
  }, [isInitialized, scene, meshes, meshesProcessed, processMeshes, log]);

  // Complete rendering when meshes are processed or no meshes provided
  useEffect(() => {
    if (isInitialized && scene && (meshesProcessed || !meshes) && !isRenderingComplete) {
      log('[DEBUG] Waiting for scene.executeWhenReady() to ensure all rendering is complete...');
      
      scene.executeWhenReady(() => {
        setIsRenderingComplete(true);
        log('[END] Rendering complete - scene.executeWhenReady() fired');

        if (onRenderingComplete) {
          log('[DEBUG] Calling onRenderingComplete callback');
          onRenderingComplete();
        }
      });
    }
  }, [isInitialized, scene, meshesProcessed, meshes, isRenderingComplete, onRenderingComplete, log]);

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
      log('[DEBUG] Starting Babylon.js render loop');

      engine.runRenderLoop(renderLoop);

      return () => {
        log('[DEBUG] Stopping Babylon.js render loop');
        engine.stopRenderLoop(renderLoop);
      };
    }

    return undefined;
  }, [isInitialized, engine, scene, renderLoop, log]);

  // Debug logging for component status
  useEffect(() => {
    if (enableDebugLogging) {
      log(`[DEBUG] Component Status: ${JSON.stringify({
        canvasElement: !!canvasElement,
        engine: !!engine,
        engineReady,
        engineError,
        scene: !!scene,
        sceneReady,
        isInitialized,
        meshesProvided: !!meshes,
        meshesProcessed,
        isRenderingComplete
      })}`);
    }
  }, [canvasElement, engine, engineReady, engineError, scene, sceneReady, isInitialized, meshes, meshesProcessed, isRenderingComplete, enableDebugLogging, log]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      log('[DEBUG] RefactoredVisualTestCanvas unmounting, cleaning up');
      disposeScene();
      disposeEngine();
    };
  }, [disposeScene, disposeEngine, log]);

  return (
    <canvas
      ref={canvasRef}
      className="visual-test-canvas"
      width={width}
      height={height}
      aria-label={`Visual test canvas for ${testName}`}
      data-testid={`visual-test-canvas-${testName}`}
      data-rendering-complete={isRenderingComplete ? 'true' : 'false'}
      data-meshes-processed={meshesProcessed ? 'true' : 'false'}
      tabIndex={0} // Make canvas focusable for keyboard accessibility
      {...canvasProps}
    />
  );
}
