/**
 * @file OpenSCAD to Mesh Wrapper Component
 * 
 * Wrapper component that converts OpenSCAD code to meshes and passes them
 * to the RefactoredVisualTestCanvas component. This maintains backward
 * compatibility with existing test files while using the new prop-based API.
 * 
 * @author OpenSCAD-Babylon Pipeline
 * @date June 2025
 */

import React, { useEffect, useState, useCallback } from 'react';
import { RefactoredVisualTestCanvas } from './refactored-visual-test-canvas';
import { useOpenSCADMeshes } from './hooks/use-openscad-meshes';
import { useBabylonEngine } from '../../hooks/use-babylon-engine/use-babylon-engine';
import { useBabylonScene } from '../../hooks/use-babylon-scene/use-babylon-scene';
import type { 
  VisualTestCanvasProps, 
  MeshCollection,
  VisualTestSceneConfig 
} from './types/visual-test-canvas-types';

/**
 * Props for the OpenSCAD to Mesh Wrapper component
 * Maintains compatibility with the original VisualTestCanvas interface
 */
export interface OpenSCADToMeshWrapperProps {
  /** Test scenario name for identification */
  testName: string;
  
  /** OpenSCAD code to convert to main meshes */
  openscadCode: string;
  
  /** Optional OpenSCAD code for reference meshes */
  referenceOpenscadCode?: string;
  
  /** Canvas width */
  width?: number;
  
  /** Canvas height */
  height?: number;
  
  /** Enable debug logging */
  enableDebugLogging?: boolean;
  
  /** Enable reference object creation */
  enableReferenceObject?: boolean;
  
  /** Callback when rendering is complete */
  onRenderingComplete?: () => void;
  
  /** Callback when meshes are ready */
  onMeshesReady?: (meshes: MeshCollection) => void;
  
  /** Additional props to pass to the canvas */
  [key: string]: any;
}

/**
 * OpenSCADToMeshWrapper Component
 * 
 * Converts OpenSCAD code to meshes and renders them using RefactoredVisualTestCanvas.
 * This component bridges the gap between the old OpenSCAD-based API and the new
 * mesh-based API, allowing existing tests to work without modification.
 * 
 * @param props - Component props with OpenSCAD code and configuration
 * @returns JSX element containing the visual test canvas
 * 
 * @example
 * ```tsx
 * <OpenSCADToMeshWrapper
 *   testName="translate-x"
 *   openscadCode="translate([10, 0, 0]) cube([5, 5, 5]);"
 *   referenceOpenscadCode="cube([5, 5, 5]);"
 *   enableDebugLogging={true}
 *   enableReferenceObject={true}
 * />
 * ```
 */
export function OpenSCADToMeshWrapper({
  testName,
  openscadCode,
  referenceOpenscadCode,
  width = 800,
  height = 600,
  enableDebugLogging = true,
  enableReferenceObject = false,
  onRenderingComplete,
  onMeshesReady,
  ...otherProps
}: OpenSCADToMeshWrapperProps): React.JSX.Element {
  
  // State for canvas element and mesh generation
  const [canvasElement, setCanvasElement] = useState<HTMLCanvasElement | null>(null);
  const [meshesGenerated, setMeshesGenerated] = useState(false);

  // Logging utility
  const log = useCallback((message: string) => {
    if (enableDebugLogging) {
      console.log(`[OPENSCAD-WRAPPER:${testName}] ${message}`);
    }
  }, [enableDebugLogging, testName]);

  log('[INIT] Initializing OpenSCADToMeshWrapper component');

  // Initialize engine and scene for mesh generation
  const { engine, isReady: engineReady } = useBabylonEngine(canvasElement, {
    antialias: true,
    powerPreference: 'high-performance',
    preserveDrawingBuffer: true
  });

  const { scene, isReady: sceneReady } = useBabylonScene(engine, {
    enableCamera: true,
    enableLighting: true,
    backgroundColor: '#000000'
  });

  // Generate meshes from OpenSCAD code
  const { meshes, isLoading, error } = useOpenSCADMeshes({
    scene,
    openscadCode,
    referenceOpenscadCode: enableReferenceObject ? referenceOpenscadCode : undefined,
    enableDebugLogging
  });

  // Visual scene configuration
  const visualSceneConfig: VisualTestSceneConfig = {
    backgroundColor: '#000000', // Black background for contrast
    camera: {
      autoPosition: true,
      type: 'arcRotate'
    },
    lighting: {
      enableDefaultLighting: true,
      ambientIntensity: 0.3,
      directionalIntensity: 0.7
    }
  };

  // Handle mesh generation completion
  useEffect(() => {
    if (meshes && !isLoading && !error && !meshesGenerated) {
      log(`[DEBUG] Meshes generated successfully: ${meshes.mainMeshes.length} main, ${meshes.referenceMeshes.length} reference`);
      setMeshesGenerated(true);
      
      if (onMeshesReady) {
        onMeshesReady(meshes);
      }
    }
  }, [meshes, isLoading, error, meshesGenerated, onMeshesReady, log]);

  // Handle errors
  useEffect(() => {
    if (error) {
      log(`[ERROR] Mesh generation failed: ${error}`);
    }
  }, [error, log]);

  // Enhanced rendering complete callback
  const handleRenderingComplete = useCallback(() => {
    log('[END] Rendering completed successfully');
    if (onRenderingComplete) {
      onRenderingComplete();
    }
  }, [onRenderingComplete, log]);

  // Enhanced meshes ready callback
  const handleMeshesReady = useCallback((readyMeshes: MeshCollection) => {
    log(`[DEBUG] Meshes ready for rendering: ${readyMeshes.mainMeshes.length} main, ${readyMeshes.referenceMeshes.length} reference`);
  }, [log]);

  // Callback ref to capture canvas element for mesh generation
  const canvasRef = useCallback((canvas: HTMLCanvasElement | null) => {
    if (canvas && canvas !== canvasElement) {
      log('[DEBUG] Canvas element captured for mesh generation');
      setCanvasElement(canvas);
    }
  }, [canvasElement, log]);

  // Create a temporary canvas for mesh generation (hidden)
  const tempCanvasProps = {
    ref: canvasRef,
    style: { display: 'none' },
    width: 100,
    height: 100
  };

  return (
    <>
      {/* Hidden canvas for mesh generation */}
      <canvas {...tempCanvasProps} />
      
      {/* Main visual test canvas with generated meshes */}
      <RefactoredVisualTestCanvas
        testName={testName}
        meshes={meshes || undefined}
        visualSceneConfig={visualSceneConfig}
        width={width}
        height={height}
        enableDebugLogging={enableDebugLogging}
        onRenderingComplete={handleRenderingComplete}
        onMeshesReady={handleMeshesReady}
        {...otherProps}
      />
    </>
  );
}
