/**
 * @file Simplified Visual Test Canvas Component
 *
 * Specialized canvas component for Playwright visual regression testing with minimal, clean visual aids
 * Provides focused visual testing with only essential comparison elements
 *
 * Features:
 * - Black canvas background with white/colored mesh objects for maximum contrast
 * - Transparent reference object (ghost) showing original position for transformation comparison
 * - Clean, minimal design without cluttering visual elements
 * - Automatic camera positioning for optimal viewing of both objects
 * - Support for OpenSCAD code rendering via pipeline
 * - Comprehensive logging for debugging test failures
 *
 * Visual Style Requirements:
 * - Black canvas background (#000000)
 * - White/colored main mesh objects that are clearly visible
 * - Transparent gray reference object (30% alpha) for comparison
 * - No grid lines, axes, or face markers cluttering the view
 * - Focus purely on transformation effect comparison
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
  /** Whether to show transparent reference object for comparison (simplified visual aids) */
  enableReferenceObject?: boolean;
  /** Reference OpenSCAD code for transparent comparison object */
  referenceOpenscadCode?: string;
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
  enableReferenceObject = true,
  referenceOpenscadCode,
  sceneConfig,
  engineConfig,
  onEngineReady,
  onSceneReady,
  onRenderFrame,
  onRenderingComplete,
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







  /**
   * Create enhanced transparent reference object with smart positioning
   * Shows the original position/shape as a transparent reference, positioned to avoid overlap
   */
  const createTransparentReferenceObject = useCallback(async (scene: BABYLON.Scene, referenceCode: string) => {
    if (!enableReferenceObject || !referenceCode) return;

    log('[DEBUG] Creating enhanced transparent reference object with smart positioning');

    try {
      // Import utilities dynamically to avoid circular dependencies
      const { detectTransformationType, calculateGhostOffset, DEFAULT_GHOST_CONFIG } = await import('./utils/ghost-positioning');
      const { applyGhostPositioning, formatVector3ForLogging } = await import('./utils/mesh-positioning');

      // Detect transformation type from the main OpenSCAD code
      const transformation = detectTransformationType(openscadCode ?? '');
      log(`[DEBUG] Detected transformation: ${transformation.type} with values [${transformation.values.join(', ')}]`);

      // Calculate optimal ghost positioning offset
      const ghostOffset = calculateGhostOffset(transformation, DEFAULT_GHOST_CONFIG);
      log(`[DEBUG] Calculated ghost offset: ${formatVector3ForLogging(ghostOffset)}`);

      // Convert reference OpenSCAD code to Babylon.js meshes
      const result = await convertOpenSCADToBabylon(referenceCode, scene, {
        enableLogging: enableDebugLogging,
        rebuildNormals: true,
        centerMesh: true
      });

      if (result.success && result.value && result.value.length > 0) {
        // Apply ghost positioning to avoid overlap
        applyGhostPositioning(result.value, ghostOffset);
        log(`[DEBUG] Applied ghost positioning to ${result.value.length} reference meshes`);

        result.value.forEach((mesh, index) => {
          if (mesh) {
            // Apply transparent gray material for reference
            const referenceMaterial = new BABYLON.StandardMaterial(`referenceMaterial_${index}`, scene);
            referenceMaterial.diffuseColor = new BABYLON.Color3(0.7, 0.7, 0.7); // Light gray
            referenceMaterial.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1); // Low specular
            referenceMaterial.alpha = 0.3; // Transparent
            referenceMaterial.transparencyMode = BABYLON.Material.MATERIAL_ALPHABLEND;
            mesh.material = referenceMaterial;

            // Ensure mesh is visible
            mesh.isVisible = true;
            mesh.setEnabled(true);

            // Add reference identifier to mesh name
            mesh.name = `reference_${mesh.name}`;

            log(`[DEBUG] Applied transparent reference material to mesh ${index}`);
          }
        });

        log(`[DEBUG] Enhanced transparent reference object created successfully with ${result.value.length} meshes`);
        return result.value;
      } else {
        log(`[ERROR] Failed to create enhanced reference object: conversion was not successful`);
        return null;
      }
    } catch (error) {
      log(`[ERROR] Exception during enhanced reference object creation: ${error}`);
      return null;
    }
  }, [enableReferenceObject, enableDebugLogging, openscadCode, log]);

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
          log('[INIT] Starting simplified OpenSCAD to Babylon.js conversion with reference object');

          // Create transparent reference object (if enabled)
          if (enableReferenceObject && referenceOpenscadCode) {
            log('[DEBUG] Creating transparent reference object for comparison');
            await createTransparentReferenceObject(scene, referenceOpenscadCode);
          }

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

              log(`[DEBUG] Simplified visual test setup complete with ${result.value.length} meshes`);
            }

            // Position camera to view the generated geometry (including reference objects)
            if (scene.activeCamera && result.value && result.value.length > 0) {
              log(`[DEBUG] Setting up enhanced camera for ${result.value.length} meshes and any reference objects`);

              // Get all meshes in the scene (transformed + reference objects)
              const allMeshes = scene.meshes.filter(mesh =>
                mesh.name !== 'ground' &&
                mesh.name !== 'skybox' &&
                mesh.name !== 'BackgroundSkybox' &&
                mesh.name !== 'BackgroundPlane'
              );

              log(`[DEBUG] Found ${allMeshes.length} total meshes in scene for camera positioning`);

              // Calculate bounding box for all meshes (enhanced to include reference objects)
              let minBounds = new BABYLON.Vector3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
              let maxBounds = new BABYLON.Vector3(-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE);

              allMeshes.forEach((mesh, index) => {
                if (mesh) {
                  // Force bounding info computation to ensure it's up to date
                  mesh.computeWorldMatrix(true);
                  // Note: refreshBoundingInfo() is called automatically by getBoundingInfo()

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

              // Position camera at optimal distance and angle (enhanced for transformed + reference objects)
              const cameraDistance = Math.max(maxDimension * 3.5, 20); // Enhanced distance for both objects
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

              log(`[DEBUG] Enhanced camera positioned for ${allMeshes.length} meshes: center=${center.toString()}, distance=${cameraDistance}, position=${cameraPosition.toString()}`);
            }

            // Use Babylon.js executeWhenReady to ensure all rendering is complete
            log('[DEBUG] Waiting for scene.executeWhenReady() to ensure all rendering is complete...');
            scene.executeWhenReady(() => {
              setIsRenderingComplete(true);
              log('[END] OpenSCAD processing complete successfully - scene.executeWhenReady() fired');

              // Call the completion callback to notify tests that rendering is ready
              if (onRenderingComplete) {
                log('[DEBUG] Calling onRenderingComplete callback');
                onRenderingComplete();
              }
            });
          } else {
            log(`[ERROR] OpenSCAD conversion failed: ${result.error}`);

            // Use executeWhenReady even for error scenarios to ensure scene is ready
            log('[DEBUG] Error scenario - waiting for scene.executeWhenReady()...');
            scene.executeWhenReady(() => {
              setIsRenderingComplete(true);
              log('[END] Error fallback rendering complete - scene.executeWhenReady() fired');

              // Call the completion callback even for error scenarios
              if (onRenderingComplete) {
                log('[DEBUG] Calling onRenderingComplete callback for error scenario');
                onRenderingComplete();
              }
            });
          }
        } catch (error) {
          log(`[ERROR] Exception during OpenSCAD processing: ${error}`);

          // Use executeWhenReady even for exception scenarios to ensure scene is ready
          log('[DEBUG] Exception scenario - waiting for scene.executeWhenReady()...');
          scene.executeWhenReady(() => {
            setIsRenderingComplete(true);
            log('[END] Exception fallback rendering complete - scene.executeWhenReady() fired');

            // Call the completion callback even for exception scenarios
            if (onRenderingComplete) {
              log('[DEBUG] Calling onRenderingComplete callback for exception scenario');
              onRenderingComplete();
            }
          });
        }
      };

      void processOpenSCAD();
    }
  }, [isInitialized, scene, openscadCode, isRenderingComplete, enableDebugLogging, enableReferenceObject, referenceOpenscadCode, log, createTransparentReferenceObject]);

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
      data-rendering-complete={isRenderingComplete ? 'true' : 'false'}
      tabIndex={0} // Make canvas focusable for keyboard accessibility
      {...canvasProps}
    />
  );
}

// Types are already exported above
