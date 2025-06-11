/**
 * @file Babylon.js Renderer Component
 * 
 * A React component for rendering Babylon.js 3D scenes in a canvas element.
 * Handles scene initialization, camera controls, and mesh display.
 */
import React, { useEffect, useRef, useState } from 'react';
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
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Initialize Babylon.js engine and scene
  useEffect(() => {
    if (!canvasRef.current) {
      console.log('[DEBUG] Canvas not ready yet');
      return;
    }

    console.log('[DEBUG] Initializing Babylon.js engine and scene');
    
    try {
      // Create engine
      const engine = new BABYLON.Engine(canvasRef.current, true, {
        preserveDrawingBuffer: true,
        stencil: true,
      });
      engineRef.current = engine;

      // Create scene
      const scene = new BABYLON.Scene(engine);
      sceneRef.current = scene;

      // Configure scene
      const config = sceneConfig || {
        enableCamera: true,
        enableLighting: true,
        backgroundColor: '#2c3e50',
        cameraPosition: [10, 10, 10]
      };

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

      // Start render loop
      engine.runRenderLoop(() => {
        scene.render();
      });

      // Handle resize
      const handleResize = () => {
        engine.resize();
      };
      window.addEventListener('resize', handleResize);

      setIsInitialized(true);
      setError(null);
      console.log('[DEBUG] Babylon.js initialization completed');

      // Cleanup function
      return () => {
        console.log('[DEBUG] Cleaning up Babylon.js resources');
        window.removeEventListener('resize', handleResize);
        engine.stopRenderLoop();
        scene.dispose();
        engine.dispose();
      };    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to initialize Babylon.js';
      console.error('[ERROR] Babylon.js initialization failed:', error);
      setError(errorMessage);
      setIsInitialized(false);
      return undefined;
    }
  }, [sceneConfig]);

  // Handle pipeline result changes
  useEffect(() => {
    if (!pipelineResult || !sceneRef.current || !isInitialized) {
      return;
    }

    console.log('[DEBUG] Processing pipeline result:', pipelineResult);

    try {
      const scene = sceneRef.current;
      
      // Clear existing meshes (except camera and lights)
      scene.meshes.forEach(mesh => {
        if (mesh.name !== 'camera' && !mesh.name.includes('light')) {
          mesh.dispose();
        }
      });

      if (pipelineResult.success && pipelineResult.value) {
        console.log('[DEBUG] Adding mesh from pipeline result to scene');
        
        // The mesh should already be part of the scene from the pipeline processing
        // But we can ensure it's visible and properly positioned
        if (pipelineResult.value instanceof BABYLON.Mesh) {
          const mesh = pipelineResult.value;
          
          // Ensure the mesh is enabled and visible
          mesh.setEnabled(true);
          mesh.isVisible = true;
          
          // Position the camera to look at the mesh
          const camera = scene.activeCamera as BABYLON.ArcRotateCamera;
          if (camera && camera instanceof BABYLON.ArcRotateCamera) {
            const boundingInfo = mesh.getBoundingInfo();
            const center = boundingInfo.boundingBox.center;
            const size = boundingInfo.boundingBox.extendSize.length();
            
            camera.setTarget(center);
            camera.radius = Math.max(size * 2, 5);
            console.log('[DEBUG] Camera positioned to view mesh');
          }
        }
        
        console.log('[DEBUG] Mesh successfully added to scene');
      } else {
        console.log('[DEBUG] No mesh to display or pipeline result was not successful');
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to process pipeline result';
      console.error('[ERROR] Failed to process pipeline result:', error);
      setError(errorMessage);
    }
  }, [pipelineResult, isInitialized]);

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
      </div>
    </div>
  );
}
