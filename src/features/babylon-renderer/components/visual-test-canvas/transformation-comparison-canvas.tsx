/**
 * @file Transformation Comparison Canvas Component
 * 
 * Enhanced visual test canvas for transformation testing with side-by-side comparison
 * Displays both original (reference) and transformed objects with visual aids
 * 
 * Features:
 * - Side-by-side comparison layout (reference left, transformed right)
 * - Different materials for visual distinction (gray reference, white transformed)
 * - Scale reference system with grid and unit markers
 * - Text labels for "Original" vs "Transformed" objects
 * - Coordinate axes for spatial reference
 * - Optimal camera positioning for both objects
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
 * Props for TransformationComparisonCanvas component
 */
export interface TransformationComparisonCanvasProps extends Omit<BabylonCanvasProps, 'className'> {
  /** Base OpenSCAD code for the reference object (e.g., "cube([5, 5, 5])") */
  baseOpenscadCode: string;
  /** Transformed OpenSCAD code (e.g., "translate([10, 0, 0]) cube([5, 5, 5])") */
  transformedOpenscadCode: string;
  /** Test scenario name for logging */
  testName?: string;
  /** Whether to enable debug logging */
  enableDebugLogging?: boolean;
  /** Custom canvas dimensions for testing */
  width?: number;
  height?: number;
  /** Separation distance between reference and transformed objects */
  objectSeparation?: number;
}

/**
 * TransformationComparisonCanvas Component
 * 
 * Specialized canvas for transformation visual regression testing.
 * Renders both reference and transformed objects side-by-side with visual aids.
 * 
 * @param props - Canvas configuration for transformation comparison
 * @returns JSX element containing the comparison canvas
 * 
 * @example
 * ```tsx
 * <TransformationComparisonCanvas
 *   testName="translate-x"
 *   baseOpenscadCode="cube([5, 5, 5])"
 *   transformedOpenscadCode="translate([10, 0, 0]) cube([5, 5, 5])"
 *   width={800}
 *   height={600}
 *   enableDebugLogging={true}
 * />
 * ```
 */
export function TransformationComparisonCanvas({
  baseOpenscadCode,
  transformedOpenscadCode,
  testName = 'transformation-test',
  enableDebugLogging = true,
  width = 800,
  height = 600,
  objectSeparation = 25,
  sceneConfig,
  engineConfig,
  onEngineReady,
  onSceneReady,
  onRenderFrame,
  ...canvasProps
}: TransformationComparisonCanvasProps): React.JSX.Element {
  const log = useCallback((message: string) => {
    if (enableDebugLogging) {
      console.log(`[TRANSFORM-TEST:${testName}] ${message}`);
    }
  }, [enableDebugLogging, testName]);

  log('[INIT] Initializing TransformationComparisonCanvas component');

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

  // Enhanced scene configuration for transformation testing
  const testSceneConfig = {
    enableCamera: true,
    enableLighting: true,
    backgroundColor: '#000000', // Black background for better contrast
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

  // Enhanced callback for scene ready event
  useEffect(() => {
    if (sceneReady && scene && onSceneReady) {
      log('[DEBUG] Scene ready, calling onSceneReady callback');
      onSceneReady(scene);
    }
  }, [sceneReady, scene, onSceneReady, log]);

  /**
   * Create reference grid and scale markers
   */
  const createScaleReference = useCallback((scene: BABYLON.Scene) => {
    log('[DEBUG] Creating scale reference system');

    // Create grid lines
    const gridSize = 50;
    const gridSpacing = 5;
    const lines: BABYLON.Vector3[][] = [];

    // Horizontal lines
    for (let i = -gridSize; i <= gridSize; i += gridSpacing) {
      lines.push([
        new BABYLON.Vector3(-gridSize, -15, i),
        new BABYLON.Vector3(gridSize, -15, i)
      ]);
    }

    // Vertical lines
    for (let i = -gridSize; i <= gridSize; i += gridSpacing) {
      lines.push([
        new BABYLON.Vector3(i, -15, -gridSize),
        new BABYLON.Vector3(i, -15, gridSize)
      ]);
    }

    // Create grid mesh
    const grid = BABYLON.MeshBuilder.CreateLineSystem('grid', { lines }, scene);
    grid.color = new BABYLON.Color3(0.3, 0.3, 0.3);

    // Create unit markers at key positions
    const markerPositions = [0, 5, 10, 15, 20];
    markerPositions.forEach(pos => {
      if (pos !== 0) { // Skip origin (handled by axes)
        // Positive X marker
        const markerX = BABYLON.MeshBuilder.CreateSphere(`markerX_${pos}`, { diameter: 0.8 }, scene);
        markerX.position = new BABYLON.Vector3(pos, -14, 0);
        markerX.material = createMarkerMaterial(scene, new BABYLON.Color3(0.8, 0.4, 0.4));

        // Negative X marker
        const markerNegX = BABYLON.MeshBuilder.CreateSphere(`markerNegX_${pos}`, { diameter: 0.8 }, scene);
        markerNegX.position = new BABYLON.Vector3(-pos, -14, 0);
        markerNegX.material = createMarkerMaterial(scene, new BABYLON.Color3(0.6, 0.3, 0.3));

        // Z markers
        const markerZ = BABYLON.MeshBuilder.CreateSphere(`markerZ_${pos}`, { diameter: 0.8 }, scene);
        markerZ.position = new BABYLON.Vector3(0, -14, pos);
        markerZ.material = createMarkerMaterial(scene, new BABYLON.Color3(0.4, 0.4, 0.8));

        const markerNegZ = BABYLON.MeshBuilder.CreateSphere(`markerNegZ_${pos}`, { diameter: 0.8 }, scene);
        markerNegZ.position = new BABYLON.Vector3(0, -14, -pos);
        markerNegZ.material = createMarkerMaterial(scene, new BABYLON.Color3(0.3, 0.3, 0.6));
      }
    });

    return grid;
  }, [log]);

  /**
   * Create marker material
   */
  const createMarkerMaterial = useCallback((scene: BABYLON.Scene, color: BABYLON.Color3) => {
    const material = new BABYLON.StandardMaterial(`markerMaterial_${Math.random()}`, scene);
    material.diffuseColor = color;
    material.emissiveColor = color.scale(0.3);
    material.alpha = 0.7;
    return material;
  }, []);

  /**
   * Create coordinate axes
   */
  const createCoordinateAxes = useCallback((scene: BABYLON.Scene) => {
    log('[DEBUG] Creating coordinate axes');

    const axisLength = 15;
    
    // X-axis (red)
    const xAxis = BABYLON.MeshBuilder.CreateLines('xAxis', {
      points: [BABYLON.Vector3.Zero(), new BABYLON.Vector3(axisLength, 0, 0)]
    }, scene);
    xAxis.color = new BABYLON.Color3(1, 0, 0);

    // Y-axis (green)
    const yAxis = BABYLON.MeshBuilder.CreateLines('yAxis', {
      points: [BABYLON.Vector3.Zero(), new BABYLON.Vector3(0, axisLength, 0)]
    }, scene);
    yAxis.color = new BABYLON.Color3(0, 1, 0);

    // Z-axis (blue)
    const zAxis = BABYLON.MeshBuilder.CreateLines('zAxis', {
      points: [BABYLON.Vector3.Zero(), new BABYLON.Vector3(0, 0, axisLength)]
    }, scene);
    zAxis.color = new BABYLON.Color3(0, 0, 1);

    return { xAxis, yAxis, zAxis };
  }, [log]);

  /**
   * Create text labels for objects
   */
  const createTextLabels = useCallback((scene: BABYLON.Scene, referencePosition: BABYLON.Vector3, transformedPosition: BABYLON.Vector3) => {
    log('[DEBUG] Creating text labels');

    // Create label materials
    const referenceLabelMaterial = new BABYLON.StandardMaterial('referenceLabelMaterial', scene);
    referenceLabelMaterial.diffuseColor = new BABYLON.Color3(0.6, 0.6, 0.6);
    referenceLabelMaterial.emissiveColor = new BABYLON.Color3(0.3, 0.3, 0.3);

    const transformedLabelMaterial = new BABYLON.StandardMaterial('transformedLabelMaterial', scene);
    transformedLabelMaterial.diffuseColor = new BABYLON.Color3(1, 1, 1);
    transformedLabelMaterial.emissiveColor = new BABYLON.Color3(0.4, 0.4, 0.4);

    // Create label indicators using small boxes positioned above objects
    const referenceLabel = BABYLON.MeshBuilder.CreateBox('referenceLabel', { width: 2, height: 0.5, depth: 0.5 }, scene);
    referenceLabel.position = referencePosition.add(new BABYLON.Vector3(0, 10, 0));
    referenceLabel.material = referenceLabelMaterial;

    const transformedLabel = BABYLON.MeshBuilder.CreateBox('transformedLabel', { width: 2, height: 0.5, depth: 0.5 }, scene);
    transformedLabel.position = transformedPosition.add(new BABYLON.Vector3(0, 10, 0));
    transformedLabel.material = transformedLabelMaterial;

    // Create connecting lines from labels to objects
    const referenceLine = BABYLON.MeshBuilder.CreateLines('referenceLine', {
      points: [
        referenceLabel.position.add(new BABYLON.Vector3(0, -0.5, 0)),
        referencePosition.add(new BABYLON.Vector3(0, 5, 0))
      ]
    }, scene);
    referenceLine.color = new BABYLON.Color3(0.6, 0.6, 0.6);

    const transformedLine = BABYLON.MeshBuilder.CreateLines('transformedLine', {
      points: [
        transformedLabel.position.add(new BABYLON.Vector3(0, -0.5, 0)),
        transformedPosition.add(new BABYLON.Vector3(0, 5, 0))
      ]
    }, scene);
    transformedLine.color = new BABYLON.Color3(1, 1, 1);

    return { referenceLabel, transformedLabel, referenceLine, transformedLine };
  }, [log]);

  // Process OpenSCAD code when scene is ready
  useEffect(() => {
    if (isInitialized && scene && baseOpenscadCode && transformedOpenscadCode && !isRenderingComplete) {
      log(`[DEBUG] Processing comparison: base="${baseOpenscadCode}", transformed="${transformedOpenscadCode}"`);

      const processComparison = async () => {
        try {
          log('[INIT] Starting dual OpenSCAD to Babylon.js conversion');

          // Create visual aids first
          createScaleReference(scene);
          createCoordinateAxes(scene);

          // Position reference object on the left
          const referencePosition = new BABYLON.Vector3(-objectSeparation / 2, 0, 0);
          
          // Position transformed object on the right  
          const transformedPosition = new BABYLON.Vector3(objectSeparation / 2, 0, 0);

          // Convert reference object
          log('[DEBUG] Converting reference object');
          const referenceResult = await convertOpenSCADToBabylon(baseOpenscadCode, scene, {
            enableLogging: enableDebugLogging,
            rebuildNormals: true,
            centerMesh: true
          });

          if (referenceResult.success && referenceResult.value) {
            log(`[DEBUG] Reference conversion successful. Generated ${referenceResult.value.length} meshes`);
            
            // Apply gray material to reference meshes and position them
            referenceResult.value.forEach((mesh, index) => {
              if (mesh) {
                const material = new BABYLON.StandardMaterial(`referenceMaterial_${index}`, scene);
                material.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.5); // Gray color
                material.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
                mesh.material = material;
                mesh.position = referencePosition;
                mesh.isVisible = true;
                mesh.setEnabled(true);
                log(`[DEBUG] Applied gray material to reference mesh ${index}`);
              }
            });
          }

          // Convert transformed object
          log('[DEBUG] Converting transformed object');
          const transformedResult = await convertOpenSCADToBabylon(transformedOpenscadCode, scene, {
            enableLogging: enableDebugLogging,
            rebuildNormals: true,
            centerMesh: true
          });

          if (transformedResult.success && transformedResult.value) {
            log(`[DEBUG] Transformed conversion successful. Generated ${transformedResult.value.length} meshes`);
            
            // Apply white material to transformed meshes and position them
            transformedResult.value.forEach((mesh, index) => {
              if (mesh) {
                const material = new BABYLON.StandardMaterial(`transformedMaterial_${index}`, scene);
                material.diffuseColor = new BABYLON.Color3(1, 1, 1); // White color
                material.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);
                mesh.material = material;
                mesh.position = transformedPosition;
                mesh.isVisible = true;
                mesh.setEnabled(true);
                log(`[DEBUG] Applied white material to transformed mesh ${index}`);
              }
            });
          }

          // Create text labels
          createTextLabels(scene, referencePosition, transformedPosition);

          // Position camera to view both objects optimally
          if (scene.activeCamera) {
            log('[DEBUG] Setting up camera for dual-object view');

            // Calculate optimal camera position to view both objects
            const centerPoint = new BABYLON.Vector3(0, 0, 0); // Midpoint between objects
            const viewDistance = Math.max(objectSeparation * 1.5, 40); // Ensure both objects are visible
            const cameraPosition = centerPoint.add(new BABYLON.Vector3(viewDistance, viewDistance * 0.8, viewDistance));

            // Type-safe camera setup
            if (scene.activeCamera instanceof BABYLON.ArcRotateCamera) {
              scene.activeCamera.setTarget(centerPoint);
              scene.activeCamera.position = cameraPosition;
              scene.activeCamera.radius = viewDistance;
            } else if (scene.activeCamera instanceof BABYLON.FreeCamera) {
              scene.activeCamera.position = cameraPosition;
              scene.activeCamera.setTarget(centerPoint);
            } else {
              scene.activeCamera.position = cameraPosition;
            }

            log(`[DEBUG] Camera positioned: center=${centerPoint.toString()}, distance=${viewDistance}, position=${cameraPosition.toString()}`);
          }

          setIsRenderingComplete(true);
          log('[END] Transformation comparison processing complete successfully');
        } catch (error) {
          log(`[ERROR] Exception during comparison processing: ${error}`);
          setIsRenderingComplete(true);
        }
      };

      void processComparison();
    }
  }, [isInitialized, scene, baseOpenscadCode, transformedOpenscadCode, isRenderingComplete, objectSeparation, enableDebugLogging, log, createScaleReference, createCoordinateAxes, createTextLabels]);

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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      log('[DEBUG] TransformationComparisonCanvas unmounting, cleaning up');
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
      aria-label={`Transformation comparison canvas for ${testName}`}
      data-testid={`transformation-comparison-canvas-${testName}`}
      tabIndex={0}
      {...canvasProps}
    />
  );
}
