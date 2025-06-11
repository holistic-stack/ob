/**
 * @file Modern Babylon.js Renderer Component (React 19)
 * 
 * A React 19 compatible Babylon.js renderer following modern patterns:
 * - Proper resource management and cleanup
 * - Error boundaries for WebGL failures
 * - Optimized render loops and scene management
 * - No external dependencies (pure Babylon.js + React)
 * 
 * @author Luciano Júnior
 * @date June 2025
 */

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import * as BABYLON from '@babylonjs/core';
import { BabylonRendererProps } from '../../types/pipeline-types';
import './babylon-renderer.css';

/**
 * Modern Babylon.js renderer with React 19 patterns
 */
export function BabylonRendererV2({
  pipelineResult,
  isProcessing,
  sceneConfig
}: BabylonRendererProps): React.JSX.Element {
  
  // Refs for Babylon.js objects
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<BABYLON.Engine | null>(null);
  const sceneRef = useRef<BABYLON.Scene | null>(null);
  const renderLoopRef = useRef<(() => void) | null>(null);
  
  // State management
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentMesh, setCurrentMesh] = useState<BABYLON.Mesh | null>(null);

  // Memoized scene configuration
  const config = useMemo(() => ({
    enableCamera: true,
    enableLighting: true,
    backgroundColor: '#2c3e50',
    cameraPosition: [10, 10, 10],
    ...sceneConfig
  }), [sceneConfig]);

  // Error boundary for WebGL failures
  const handleWebGLError = useCallback((error: Error) => {
    console.error('[ERROR] WebGL Error:', error);
    setError(`WebGL Error: ${error.message}`);
    
    // Attempt recovery
    if (engineRef.current && sceneRef.current) {
      try {
        engineRef.current.stopRenderLoop();
        sceneRef.current.dispose();
        engineRef.current.dispose();
      } catch (cleanupError) {
        console.error('[ERROR] Cleanup failed:', cleanupError);
      }
    }
    setIsInitialized(false);
  }, []);

  // Safe render function with error handling
  const safeRender = useCallback(() => {
    if (!sceneRef.current || !engineRef.current) return;
    
    try {
      sceneRef.current.render();
    } catch (renderError) {
      handleWebGLError(renderError as Error);
    }
  }, [handleWebGLError]);

  // Initialize Babylon.js engine and scene
  useEffect(() => {
    if (!canvasRef.current) return;

    console.log('[INIT] Initializing modern Babylon.js renderer');
    
    let engine: BABYLON.Engine | null = null;
    let scene: BABYLON.Scene | null = null;
    
    try {
      // Create engine with error handling
      engine = new BABYLON.Engine(canvasRef.current, true, {
        preserveDrawingBuffer: true,
        stencil: true,
        antialias: true,
        powerPreference: 'high-performance'
      });
      
      // Set up engine error handling
      engine.onContextLostObservable.add(() => {
        console.warn('[WARN] WebGL context lost');
        setError('WebGL context lost - attempting recovery');
      });

      engine.onContextRestoredObservable.add(() => {
        console.log('[DEBUG] WebGL context restored');
        setError(null);
      });

      engineRef.current = engine;

      // Create scene
      scene = new BABYLON.Scene(engine);
      sceneRef.current = scene;

      // Configure scene
      scene.clearColor = new BABYLON.Color4(
        ...BABYLON.Color3.FromHexString(config.backgroundColor).asArray(), 
        1.0
      );

      // Add camera
      if (config.enableCamera) {
        const camera = new BABYLON.ArcRotateCamera(
          'camera',
          -Math.PI / 2,
          Math.PI / 2.5,
          15,
          BABYLON.Vector3.Zero(),
          scene
        );
        
        camera.attachControl(canvasRef.current, true);
        camera.setTarget(BABYLON.Vector3.Zero());
        
        // Smooth camera controls
        camera.inertia = 0.9;
        camera.angularSensibilityX = 1000;
        camera.angularSensibilityY = 1000;
        camera.panningSensibility = 1000;
        camera.wheelPrecision = 50;
      }

      // Add lighting
      if (config.enableLighting) {
        const ambientLight = new BABYLON.HemisphericLight(
          'ambientLight',
          new BABYLON.Vector3(0, 1, 0),
          scene
        );
        ambientLight.intensity = 0.7;

        const directionalLight = new BABYLON.DirectionalLight(
          'directionalLight',
          new BABYLON.Vector3(-1, -1, -1),
          scene
        );
        directionalLight.intensity = 0.5;
      }

      // Optimized render loop
      const renderLoop = () => safeRender();
      renderLoopRef.current = renderLoop;
      engine.runRenderLoop(renderLoop);

      // Handle resize
      const handleResize = () => {
        if (engine && !engine.isDisposed) {
          engine.resize();
        }
      };
      window.addEventListener('resize', handleResize);

      setIsInitialized(true);
      setError(null);
      console.log('[DEBUG] Modern Babylon.js renderer initialized successfully');

      // Cleanup function
      return () => {
        console.log('[DEBUG] Cleaning up Babylon.js resources');
        window.removeEventListener('resize', handleResize);
        
        if (engine && !engine.isDisposed) {
          engine.stopRenderLoop();
          if (scene && !scene.isDisposed) {
            scene.dispose();
          }
          engine.dispose();
        }
        
        engineRef.current = null;
        sceneRef.current = null;
        renderLoopRef.current = null;
      };

    } catch (initError) {
      handleWebGLError(initError as Error);
      return undefined;
    }
  }, [config, safeRender, handleWebGLError]);

  // Handle pipeline result with proper mesh management
  useEffect(() => {
    if (!pipelineResult?.success || !pipelineResult.value || !sceneRef.current || !isInitialized) {
      return;
    }

    console.log('[DEBUG] Processing pipeline result');
    const scene = sceneRef.current;

    try {
      // Clear previous mesh
      if (currentMesh && !currentMesh.isDisposed()) {
        console.log('[DEBUG] Disposing previous mesh:', currentMesh.name);
        currentMesh.dispose();
      }

      if (pipelineResult.value instanceof BABYLON.Mesh) {
        const sourceMesh = pipelineResult.value;
        
        // Create new mesh in our scene to avoid WebGL context issues
        const newMesh = BABYLON.MeshBuilder.CreateBox(
          `pipeline_mesh_${Date.now()}`, 
          { 
            width: 2, 
            height: 2, 
            depth: 2 
          }, 
          scene
        );

        // Copy geometry if available
        if (sourceMesh.geometry) {
          const positions = sourceMesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
          const normals = sourceMesh.getVerticesData(BABYLON.VertexBuffer.NormalKind);
          const indices = sourceMesh.getIndices();

          if (positions && positions.length > 0) {
            newMesh.setVerticesData(BABYLON.VertexBuffer.PositionKind, positions);
          }
          if (normals && normals.length > 0) {
            newMesh.setVerticesData(BABYLON.VertexBuffer.NormalKind, normals);
          }
          if (indices && indices.length > 0) {
            newMesh.setIndices(indices);
          }
        }

        // Create material
        const material = new BABYLON.StandardMaterial(`${newMesh.name}_material`, scene);
        material.diffuseColor = new BABYLON.Color3(0.8, 0.6, 0.4);
        material.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);
        material.emissiveColor = new BABYLON.Color3(0.1, 0.1, 0.1);
        newMesh.material = material;

        // Position camera to view mesh
        const camera = scene.activeCamera as BABYLON.ArcRotateCamera;
        if (camera) {
          camera.setTarget(BABYLON.Vector3.Zero());
          camera.radius = 10;
        }

        setCurrentMesh(newMesh);
        console.log('[DEBUG] Pipeline mesh processed successfully');
      }

    } catch (processingError) {
      console.error('[ERROR] Failed to process pipeline result:', processingError);
      setError(`Processing Error: ${(processingError as Error).message}`);
    }
  }, [pipelineResult, isInitialized, currentMesh]);

  // Debug functions
  const createTestCube = useCallback(() => {
    if (!sceneRef.current) return;

    // Clear previous test cubes
    const testCubes = sceneRef.current.meshes.filter(m => m.name.includes('test_cube'));
    testCubes.forEach(mesh => mesh.dispose());

    // Create new test cube
    const testCube = BABYLON.MeshBuilder.CreateBox('test_cube', { size: 2 }, sceneRef.current);
    const material = new BABYLON.StandardMaterial('test_material', sceneRef.current);
    material.diffuseColor = new BABYLON.Color3(1, 0, 0);
    material.emissiveColor = new BABYLON.Color3(0.2, 0, 0);
    testCube.material = material;

    console.log('[DEBUG] Test cube created');
  }, []);

  const debugScene = useCallback(() => {
    if (!sceneRef.current) return;

    console.log('[DEBUG] Scene info:', {
      meshCount: sceneRef.current.meshes.length,
      meshes: sceneRef.current.meshes.map(m => ({
        name: m.name,
        isVisible: m.isVisible,
        vertices: m.getTotalVertices()
      })),
      isReady: sceneRef.current.isReady(),
      activeCamera: sceneRef.current.activeCamera?.name
    });
  }, []);

  return (
    <div className="babylon-renderer">
      <div className="renderer-header">
        <h3>Modern 3D Renderer</h3>
        <div className="renderer-status">
          {isProcessing && <span className="status-badge processing">Processing...</span>}
          {!isProcessing && pipelineResult?.success && <span className="status-badge success">✓ Ready</span>}
          {error && <span className="status-badge error">✗ Error</span>}
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

      <div className="debug-controls" style={{ padding: '10px', border: '1px solid #ccc' }}>
        <button onClick={createTestCube} style={{ margin: '5px' }}>
          Create Test Cube
        </button>
        <button onClick={debugScene} style={{ margin: '5px' }}>
          Debug Scene
        </button>
      </div>
    </div>
  );
}
