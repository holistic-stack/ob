/**
 * @file Babylon.js Renderer Component
 * 
 * A React component for rendering Babylon.js 3D scenes in a canvas element.
 * Handles scene initialization, camera controls, and mesh display.
 */
import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import * as BABYLON from '@babylonjs/core';
import { BabylonRendererProps } from '../../types/pipeline-types';
import './babylon-renderer.css';

/**
 * Babylon.js renderer component for displaying 3D scenes
 * 
 * Manages the lifecycle of a Babylon.js engine and scene,
 * renders pipeline results as 3D meshes with proper camera and lighting setup.
 */
export function BabylonRenderer({
  pipelineResult,
  isProcessing,
  sceneConfig
}: BabylonRendererProps): React.JSX.Element {
  console.log('[INIT] BabylonRenderer component rendering');
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<BABYLON.Engine | null>(null);
  const sceneRef = useRef<BABYLON.Scene | null>(null);
  const renderLoopRef = useRef<(() => void) | null>(null);
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
    if (!canvasRef.current) {
      console.log('[DEBUG] Canvas not ready yet');
      return;
    }

    console.log('[DEBUG] Initializing Babylon.js engine and scene');
    
    try {
      // Create engine with enhanced error handling
      const engine = new BABYLON.Engine(canvasRef.current, true, {
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
      const scene = new BABYLON.Scene(engine);
      sceneRef.current = scene;

      // Configure scene using memoized config

      // Set background color
      scene.clearColor = new BABYLON.Color4(...BABYLON.Color3.FromHexString(config.backgroundColor).asArray(), 1.0);

      // Add camera if enabled
      if (config.enableCamera) {
        const camera = new BABYLON.ArcRotateCamera(
          'camera',
          -Math.PI / 2,
          Math.PI / 2.5,
          config.cameraPosition ? 
            Math.sqrt(config.cameraPosition[0]**2 + config.cameraPosition[1]**2 + config.cameraPosition[2]**2) : 
            15,
          new BABYLON.Vector3(0, 0, 0),
          scene
        );
        
        if (config.cameraPosition) {
          camera.position = new BABYLON.Vector3(...config.cameraPosition);
        }
        
        camera.attachControl(canvasRef.current, true);
        console.log('[DEBUG] Camera initialized and attached');
      }

      // Add lighting if enabled
      if (config.enableLighting) {
        // Hemisphere light for ambient lighting
        const ambientLight = new BABYLON.HemisphericLight(
          'ambientLight',
          new BABYLON.Vector3(0, 1, 0),
          scene
        );
        ambientLight.intensity = 0.7;

        // Directional light for shadows and highlights
        const directionalLight = new BABYLON.DirectionalLight(
          'directionalLight',
          new BABYLON.Vector3(-1, -1, -1),
          scene
        );
        directionalLight.intensity = 0.5;
        console.log('[DEBUG] Lighting initialized');
      }

      // Optimized render loop with error handling
      const renderLoop = () => safeRender();
      renderLoopRef.current = renderLoop;
      engine.runRenderLoop(renderLoop);

      // Handle resize
      const handleResize = () => {
        engine.resize();
      };
      window.addEventListener('resize', handleResize);

      setIsInitialized(true);
      setError(null);
      console.log('[DEBUG] Babylon.js initialization completed');

      // Enhanced cleanup function
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
      };    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to initialize Babylon.js';
      console.error('[ERROR] Babylon.js initialization failed:', error);
      setError(errorMessage);
      setIsInitialized(false);
      return undefined;
    }
  }, [config, safeRender, handleWebGLError]);

  // Handle pipeline result with modern patterns
  useEffect(() => {
    if (!pipelineResult?.success || !pipelineResult.value || !sceneRef.current || !isInitialized) {
      return;
    }

    console.log('[DEBUG] Processing pipeline result with modern patterns');
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
        console.log('[DEBUG] Pipeline mesh processed successfully with modern patterns');
      }

    } catch (processingError) {
      console.error('[ERROR] Failed to process pipeline result:', processingError);
      setError(`Processing Error: ${(processingError as Error).message}`);
    }
  }, [pipelineResult, isInitialized, currentMesh]);

  return (
    <div className="babylon-renderer">
      <div className="renderer-header">
        <h3 className="renderer-title">3D Scene</h3>
        <div className="renderer-status">
          {isProcessing && (
            <span className="status-badge processing">
              <span className="spinner" aria-hidden="true">⟳</span>
              Processing...
            </span>
          )}
          {!isProcessing && pipelineResult?.success && (
            <span className="status-badge success">
              ✓ Scene Ready
            </span>
          )}
          {!isProcessing && pipelineResult && !pipelineResult.success && (
            <span className="status-badge error">
              ✗ Processing Error
            </span>
          )}
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
            <span className="error-icon">⚠️</span>
            <span className="error-message">{error}</span>
          </div>
        )}
        
        {!isInitialized && !error && (
          <div className="renderer-loading">
            <span className="loading-spinner">⟳</span>
            <span className="loading-message">Initializing 3D renderer...</span>
          </div>
        )}
      </div>

      {pipelineResult?.success && pipelineResult.metadata && (
        <div className="renderer-metadata">
          <h4 className="metadata-title">Processing Statistics</h4>
          <div className="metadata-grid">
            <div className="metadata-item">
              <span className="metadata-label">Parse Time:</span>
              <span className="metadata-value">{pipelineResult.metadata.parseTimeMs}ms</span>
            </div>
            <div className="metadata-item">
              <span className="metadata-label">Visit Time:</span>
              <span className="metadata-value">{pipelineResult.metadata.visitTimeMs}ms</span>
            </div>
            <div className="metadata-item">
              <span className="metadata-label">Total Time:</span>
              <span className="metadata-value">{pipelineResult.metadata.totalTimeMs}ms</span>
            </div>
            <div className="metadata-item">
              <span className="metadata-label">Nodes:</span>
              <span className="metadata-value">{pipelineResult.metadata.nodeCount}</span>
            </div>
            <div className="metadata-item">
              <span className="metadata-label">Meshes:</span>
              <span className="metadata-value">{pipelineResult.metadata.meshCount}</span>
            </div>
          </div>
        </div>
      )}

      <div className="renderer-controls">
        <div className="controls-info">
          <h5 className="controls-title">Camera Controls:</h5>
          <ul className="controls-list">
            <li><strong>Left Mouse:</strong> Rotate camera</li>
            <li><strong>Right Mouse:</strong> Pan camera</li>
            <li><strong>Mouse Wheel:</strong> Zoom in/out</li>
          </ul>
        </div>

        {/* Debug controls */}
        <div className="debug-controls" style={{ marginTop: '10px', padding: '10px', border: '1px solid #ccc' }}>
          <h5>Debug Controls:</h5>
          <button
            onClick={() => {
              if (sceneRef.current) {
                console.log('[DEBUG] Creating test cube');

                // Remove any existing test cubes first
                const existingTestCubes = sceneRef.current.meshes.filter(m => m.name.includes('test_cube'));
                existingTestCubes.forEach(mesh => {
                  console.log('[DEBUG] Removing existing test cube:', mesh.name);
                  mesh.dispose();
                });

                // Create new test cube
                const testCube = BABYLON.MeshBuilder.CreateBox('test_cube', { size: 2 }, sceneRef.current);
                const material = new BABYLON.StandardMaterial('test_material', sceneRef.current);
                material.diffuseColor = new BABYLON.Color3(1, 0, 0); // Red
                material.emissiveColor = new BABYLON.Color3(0.2, 0, 0); // Red glow
                testCube.material = material;
                testCube.position = new BABYLON.Vector3(0, 0, 0);

                // Position camera to look at test cube
                const camera = sceneRef.current.activeCamera as BABYLON.ArcRotateCamera;
                if (camera) {
                  camera.setTarget(BABYLON.Vector3.Zero());
                  camera.radius = 10;
                }

                console.log('[DEBUG] Test cube created and positioned');
                console.log('[DEBUG] Scene after test cube creation:', sceneRef.current.meshes.map(m => m.name));
              }
            }}
            style={{ padding: '5px 10px', margin: '5px' }}
          >
            Create Test Cube
          </button>

          <button
            onClick={() => {
              if (sceneRef.current) {
                console.log('[DEBUG] Scene debug info:', {
                  meshCount: sceneRef.current.meshes.length,
                  meshes: sceneRef.current.meshes.map(m => ({
                    name: m.name,
                    isVisible: m.isVisible,
                    isEnabled: m.isEnabled(),
                    vertices: m.getTotalVertices(),
                    position: m.position.asArray()
                  })),
                  camera: sceneRef.current.activeCamera?.name,
                  lights: sceneRef.current.lights.map(l => l.name)
                });
              }
            }}
            style={{ padding: '5px 10px', margin: '5px' }}
          >
            Debug Scene
          </button>

          <button
            onClick={() => {
              if (sceneRef.current) {
                console.log('[DEBUG] Clearing all meshes from scene');

                // Remove all meshes except camera and lights
                const meshesToClear = sceneRef.current.meshes.filter(m =>
                  m.name !== 'camera' && !m.name.includes('light')
                );

                meshesToClear.forEach(mesh => {
                  console.log('[DEBUG] Clearing mesh:', mesh.name);
                  mesh.dispose();
                });

                console.log('[DEBUG] Scene cleared, remaining meshes:', sceneRef.current.meshes.map(m => m.name));
              }
            }}
            style={{ padding: '5px 10px', margin: '5px', backgroundColor: '#e74c3c', color: 'white' }}
          >
            Clear Scene
          </button>
        </div>
      </div>
    </div>
  );
}
