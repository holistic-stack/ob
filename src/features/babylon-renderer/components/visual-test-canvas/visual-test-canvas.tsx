/**
 * @file Visual Test Canvas Component
 * 
 * Specialized canvas component for Playwright visual regression testing
 * Provides a clean, full-screen canvas without any UI controls or overlays
 * 
 * Features:
 * - Full-screen canvas optimized for visual testing
 * - No UI controls or overlays that could interfere with screenshots
 * - Automatic camera positioning for optimal viewing
 * - Support for OpenSCAD code rendering via pipeline
 * - Comprehensive logging for debugging test failures
 * 
 * @author OpenSCAD-Babylon Pipeline
 * @date June 2025
 */

import React, { useEffect, useCallback, useState } from 'react';
import * as BABYLON from '@babylonjs/core';
import { useBabylonEngine } from '../../hooks/use-babylon-engine/use-babylon-engine';
import { useBabylonScene } from '../../hooks/use-babylon-scene/use-babylon-scene';
import type { BabylonCanvasProps } from '../../types/babylon-types';
import { convertOpenSCADToBabylon } from '../../../babylon-csg2/conversion/babylon-csg2-converter/babylon-csg2-converter';
import './visual-test-canvas.css';

/**
 * Props for VisualTestCanvas component
 */
export interface VisualTestCanvasProps extends Omit<BabylonCanvasProps, 'className'> {
  /** OpenSCAD code to render for testing */
  openscadCode?: string;
  /** Test scenario name for logging */
  testName?: string;
  /** Whether to enable debug logging */
  enableDebugLogging?: boolean;
  /** Custom canvas dimensions for testing */
  width?: number;
  height?: number;
  /** Callback when rendering is completely finished and ready for screenshots */
  onRenderingComplete?: () => void;
}

/**
 * VisualTestCanvas Component
 * 
 * Specialized canvas for visual regression testing with Playwright.
 * Renders OpenSCAD code in a clean, full-screen canvas without UI controls.
 * 
 * @param props - Canvas configuration optimized for visual testing
 * @returns JSX element containing the test canvas
 * 
 * @example
 * ```tsx
 * <VisualTestCanvas
 *   testName="cube-basic"
 *   openscadCode="cube([10, 10, 10]);"
 *   width={800}
 *   height={600}
 *   enableDebugLogging={true}
 * />
 * ```
 */
export function VisualTestCanvas({
  openscadCode,
  testName = 'visual-test',
  enableDebugLogging = true,
  width = 800,
  height = 600,
  sceneConfig,
  engineConfig,
  onEngineReady,
  onSceneReady,
  onRenderFrame,
  ...canvasProps
}: VisualTestCanvasProps): React.JSX.Element {
  const log = useCallback((message: string) => {
    if (enableDebugLogging) {
      console.log(`[VISUAL-TEST:${testName}] ${message}`);
    }
  }, [enableDebugLogging, testName]);

  log('[INIT] Initializing VisualTestCanvas component');

  const [canvasElement, setCanvasElement] = useState<HTMLCanvasElement | null>(null);
  const [isRenderingComplete, setIsRenderingComplete] = useState(false);

  // Callback ref to capture canvas element when it's created
  const canvasRef = useCallback((canvas: HTMLCanvasElement | null) => {
    if (canvas && canvas !== canvasElement) {
      log('[DEBUG] Canvas element became available, updating state');
      setCanvasElement(canvas);
    } else if (!canvas && canvasElement) {
      log('[DEBUG] Canvas element removed, clearing state');
      setCanvasElement(null);
    }
  }, [canvasElement, log]);

  // Enhanced scene configuration for visual testing
  const testSceneConfig = {
    enableCamera: true,
    enableLighting: true,
    backgroundColor: '#000000', // Black background for better contrast with white meshes
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
    testSceneConfig
  );

  // Derived state
  const isInitialized = engineReady && sceneReady;

  // Enhanced callback for engine ready event
  useEffect(() => {
    if (engineReady && engine && onEngineReady) {
      log('[DEBUG] Engine ready, calling onEngineReady callback');
      onEngineReady(engine);
    }
  }, [engineReady, engine, onEngineReady, log]);

  // Enhanced callback for scene ready event with OpenSCAD processing
  useEffect(() => {
    if (sceneReady && scene && onSceneReady) {
      log('[DEBUG] Scene ready, calling onSceneReady callback');
      onSceneReady(scene);
    }
  }, [sceneReady, scene, onSceneReady, log]);

  // Process OpenSCAD code when scene is ready
  useEffect(() => {
    if (isInitialized && scene && openscadCode && !isRenderingComplete) {
      log(`[DEBUG] Processing OpenSCAD code: ${openscadCode}`);

      const processOpenSCAD = async () => {
        try {
          log('[INIT] Starting OpenSCAD to Babylon.js conversion');

          // Convert OpenSCAD code to Babylon.js meshes
          const result = await convertOpenSCADToBabylon(openscadCode, scene, {
            enableLogging: enableDebugLogging,
            rebuildNormals: true,
            centerMesh: true
          });

          if (result.success) {
            log(`[DEBUG] OpenSCAD conversion successful. Generated ${result.value?.length || 0} meshes`);

            // Apply white material to all meshes for better contrast on black background
            if (result.value && result.value.length > 0) {
              result.value.forEach((mesh, index) => {
                if (mesh) {
                  const material = new BABYLON.StandardMaterial(`whiteMaterial_${index}`, scene);
                  material.diffuseColor = new BABYLON.Color3(1, 1, 1); // White color
                  material.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2); // Low specular for matte look
                  mesh.material = material;

                  // Ensure mesh is visible
                  mesh.isVisible = true;
                  mesh.setEnabled(true);

                  log(`[DEBUG] Applied white material to mesh ${index}`);
                }
              });
            }

            // Position camera to view the generated geometry
            if (scene.activeCamera && result.value && result.value.length > 0) {
              log(`[DEBUG] Setting up camera for ${result.value.length} meshes`);

              // Calculate bounding box for all meshes
              let minBounds = new BABYLON.Vector3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
              let maxBounds = new BABYLON.Vector3(-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE);

              result.value.forEach((mesh, index) => {
                if (mesh) {
                  // Force bounding info computation to ensure it's up to date
                  mesh.computeWorldMatrix(true);
                  mesh.refreshBoundingInfo();

                  const boundingInfo = mesh.getBoundingInfo();
                  const worldMatrix = mesh.getWorldMatrix();

                  // Transform all 8 corners of the local bounding box to world space
                  const localMin = boundingInfo.boundingBox.minimum;
                  const localMax = boundingInfo.boundingBox.maximum;

                  const corners = [
                    new BABYLON.Vector3(localMin.x, localMin.y, localMin.z),
                    new BABYLON.Vector3(localMax.x, localMin.y, localMin.z),
                    new BABYLON.Vector3(localMin.x, localMax.y, localMin.z),
                    new BABYLON.Vector3(localMin.x, localMin.y, localMax.z),
                    new BABYLON.Vector3(localMax.x, localMax.y, localMin.z),
                    new BABYLON.Vector3(localMax.x, localMin.y, localMax.z),
                    new BABYLON.Vector3(localMin.x, localMax.y, localMax.z),
                    new BABYLON.Vector3(localMax.x, localMax.y, localMax.z)
                  ];

                  // Initialize mesh bounds with first corner
                  if (corners.length === 0) return; // Skip if no corners

                  const firstCorner = corners[0] as BABYLON.Vector3; // Safe after length check
                  let meshMinWorld = BABYLON.Vector3.TransformCoordinates(firstCorner, worldMatrix);
                  let meshMaxWorld = meshMinWorld.clone();

                  // Transform all corners and find actual min/max in world space
                  corners.forEach(corner => {
                    const worldCorner = BABYLON.Vector3.TransformCoordinates(corner, worldMatrix);

                    // Update mesh bounds
                    meshMinWorld = BABYLON.Vector3.Minimize(meshMinWorld, worldCorner);
                    meshMaxWorld = BABYLON.Vector3.Maximize(meshMaxWorld, worldCorner);

                    // Update global bounds
                    minBounds = BABYLON.Vector3.Minimize(minBounds, worldCorner);
                    maxBounds = BABYLON.Vector3.Maximize(maxBounds, worldCorner);
                  });

                  log(`[DEBUG] Mesh ${index} world bounds: min=${meshMinWorld.toString()}, max=${meshMaxWorld.toString()}`);
                }
              });

              // Calculate center and size of all geometry
              const center = minBounds.add(maxBounds).scale(0.5);
              const size = maxBounds.subtract(minBounds);
              const maxDimension = Math.max(size.x, size.y, size.z);

              // Position camera at optimal distance and angle (increased multiplier for better view)
              const cameraDistance = Math.max(maxDimension * 4, 15); // Increased distance for transformed objects
              const cameraPosition = center.add(new BABYLON.Vector3(cameraDistance, cameraDistance, cameraDistance));

              // Type-safe camera setup
              if (scene.activeCamera instanceof BABYLON.ArcRotateCamera) {
                scene.activeCamera.setTarget(center);
                scene.activeCamera.position = cameraPosition;
                scene.activeCamera.radius = cameraDistance;
              } else if (scene.activeCamera instanceof BABYLON.FreeCamera) {
                scene.activeCamera.position = cameraPosition;
                scene.activeCamera.setTarget(center);
              } else {
                // Fallback for other camera types
                scene.activeCamera.position = cameraPosition;
              }

              log(`[DEBUG] Camera positioned: center=${center.toString()}, distance=${cameraDistance}, position=${cameraPosition.toString()}`);
            }

            // Wait 4.5 seconds before marking rendering as complete to ensure all rendering is finished
            log('[DEBUG] Waiting 4.5 seconds for rendering to stabilize before completing...');
            await new Promise(resolve => setTimeout(resolve, 4500));

            setIsRenderingComplete(true);
            log('[END] OpenSCAD processing complete successfully after 4.5s wait');
          } else {
            log(`[ERROR] OpenSCAD conversion failed: ${result.error}`);

            // Wait 4.5 seconds even for error scenarios
            log('[DEBUG] Waiting 4.5 seconds for error fallback rendering to stabilize...');
            await new Promise(resolve => setTimeout(resolve, 4500));

            setIsRenderingComplete(true);
            log('[END] Error fallback rendering complete after 4.5s wait');
          }
        } catch (error) {
          log(`[ERROR] Exception during OpenSCAD processing: ${error}`);

          // Wait 4.5 seconds even for exception scenarios
          log('[DEBUG] Waiting 4.5 seconds for exception fallback rendering to stabilize...');
          await new Promise(resolve => setTimeout(resolve, 4500));

          setIsRenderingComplete(true);
          log('[END] Exception fallback rendering complete after 4.5s wait');
        }
      };

      void processOpenSCAD();
    }
  }, [isInitialized, scene, openscadCode, isRenderingComplete, enableDebugLogging, log]);

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
      log(`[DEBUG] VisualTestCanvas Status: ${JSON.stringify({
        canvasElement: !!canvasElement,
        engine: !!engine,
        engineReady,
        engineError,
        scene: !!scene,
        sceneReady,
        isInitialized,
        isRenderingComplete,
        openscadCode: !!openscadCode
      })}`);
    }
  }, [canvasElement, engine, engineReady, engineError, scene, sceneReady, isInitialized, isRenderingComplete, openscadCode, enableDebugLogging, log]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      log('[DEBUG] VisualTestCanvas unmounting, cleaning up');
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
      tabIndex={0} // Make canvas focusable for keyboard accessibility
      {...canvasProps}
    />
  );
}

// Types are already exported above
