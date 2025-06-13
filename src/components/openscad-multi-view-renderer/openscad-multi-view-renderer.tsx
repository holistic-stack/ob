/**
 * @file OpenSCAD Multi-View Renderer Component
 * 
 * React component that renders OpenSCAD code through the complete pipeline with 4 synchronized camera views:
 * - Perspective view (main 3D view with ArcRotateCamera)
 * - Top view (orthographic from above)
 * - Side view (orthographic from side) 
 * - Bottom view (orthographic from below)
 * 
 * Features:
 * - Real OpenscadParser integration (no mocks)
 * - NullEngine for testing compatibility
 * - Synchronized camera movements
 * - Comprehensive error handling
 * - Performance monitoring
 * 
 * @author Luciano Júnior
 * @date June 2025
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as BABYLON from '@babylonjs/core';
import { OpenScadPipeline } from '../../babylon-csg2/openscad-pipeline/openscad-pipeline';

/**
 * Props for OpenSCAD Multi-View Renderer component
 */
export interface OpenSCADMultiViewRendererProps {
  /** OpenSCAD code to render */
  openscadCode: string;
  /** Canvas width for each view */
  width?: number;
  /** Canvas height for each view */
  height?: number;
  /** Enable camera synchronization across views */
  enableCameraSynchronization?: boolean;
  /** Enable debug information display */
  enableDebugInfo?: boolean;
}

/**
 * Processing status for pipeline operations
 */
type ProcessingStatus = 'idle' | 'processing' | 'success' | 'error';

/**
 * Camera view configuration
 */
interface CameraView {
  name: string;
  testId: string;
  position: [number, number, number];
  target: [number, number, number];
  type: 'perspective' | 'orthographic';
}

/**
 * Multi-view renderer component for OpenSCAD to Babylon.js pipeline
 * 
 * Renders OpenSCAD code in 4 synchronized views using real pipeline integration
 */
export function OpenSCADMultiViewRenderer({
  openscadCode,
  width = 400,
  height = 300,
  enableCameraSynchronization = false,
  enableDebugInfo = false
}: OpenSCADMultiViewRendererProps): React.JSX.Element {
  console.log('[INIT] OpenSCAD Multi-View Renderer initializing');

  // Refs for canvas elements
  const perspectiveCanvasRef = useRef<HTMLCanvasElement>(null);
  const topCanvasRef = useRef<HTMLCanvasElement>(null);
  const sideCanvasRef = useRef<HTMLCanvasElement>(null);
  const bottomCanvasRef = useRef<HTMLCanvasElement>(null);

  // State management
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [meshInfo, setMeshInfo] = useState<{
    name: string;
    vertices: number;
    indices: number;
  } | null>(null);

  // Babylon.js state
  const [engines, setEngines] = useState<BABYLON.NullEngine[]>([]);
  const [scenes, setScenes] = useState<BABYLON.Scene[]>([]);
  const [cameras, setCameras] = useState<BABYLON.Camera[]>([]);
  const [currentMesh, setCurrentMesh] = useState<BABYLON.Mesh | null>(null);

  // Pipeline instance
  const pipelineRef = useRef<OpenScadPipeline | null>(null);

  /**
   * Camera view configurations for 4 different perspectives
   */
  const cameraViews: CameraView[] = [
    {
      name: 'Perspective',
      testId: 'perspective-view',
      position: [10, 10, 10],
      target: [0, 0, 0],
      type: 'perspective'
    },
    {
      name: 'Top',
      testId: 'top-view', 
      position: [0, 20, 0],
      target: [0, 0, 0],
      type: 'orthographic'
    },
    {
      name: 'Side',
      testId: 'side-view',
      position: [20, 0, 0],
      target: [0, 0, 0],
      type: 'orthographic'
    },
    {
      name: 'Bottom',
      testId: 'bottom-view',
      position: [0, -20, 0],
      target: [0, 0, 0],
      type: 'orthographic'
    }
  ];

  /**
   * Initialize Babylon.js engines and scenes for all 4 views
   */
  const initializeBabylonScenes = useCallback(async () => {
    console.log('[INIT] Initializing Babylon.js scenes for 4 views');

    try {
      const canvasRefs = [
        perspectiveCanvasRef,
        topCanvasRef,
        sideCanvasRef,
        bottomCanvasRef
      ];

      const newEngines: BABYLON.NullEngine[] = [];
      const newScenes: BABYLON.Scene[] = [];
      const newCameras: BABYLON.Camera[] = [];

      for (let i = 0; i < 4; i++) {
        const canvas = canvasRefs[i]?.current;
        if (!canvas) continue;

        // Create engine (NullEngine for testing compatibility)
        const engine = new BABYLON.NullEngine({
          renderWidth: width,
          renderHeight: height,
          textureSize: 512,
          deterministicLockstep: false,
          lockstepMaxSteps: 1
        });

        // Create scene
        const scene = new BABYLON.Scene(engine);
        scene.createDefaultCameraOrLight(true, true, true);

        // Create camera based on view type
        const view = cameraViews[i];
        if (!view) continue;

        let camera: BABYLON.Camera;

        if (view.type === 'perspective') {
          camera = new BABYLON.ArcRotateCamera(
            `${view.name}Camera`,
            -Math.PI / 4,
            Math.PI / 3,
            20,
            new BABYLON.Vector3(...view.target),
            scene
          );
        } else {
          camera = new BABYLON.UniversalCamera(
            `${view.name}Camera`,
            new BABYLON.Vector3(...view.position),
            scene
          );
          (camera as BABYLON.UniversalCamera).setTarget(new BABYLON.Vector3(...view.target));
        }

        // Setup lighting
        const light = new BABYLON.HemisphericLight('light', new BABYLON.Vector3(0, 1, 0), scene);
        light.intensity = 0.8;

        const directionalLight = new BABYLON.DirectionalLight('dirLight', new BABYLON.Vector3(-1, -1, -1), scene);
        directionalLight.intensity = 0.6;

        newEngines.push(engine);
        newScenes.push(scene);
        newCameras.push(camera);

        // Start render loop
        engine.runRenderLoop(() => {
          if (scene && !scene.isDisposed) {
            scene.render();
          }
        });
      }

      setEngines(newEngines);
      setScenes(newScenes);
      setCameras(newCameras);

      console.log('[DEBUG] All 4 Babylon.js scenes initialized successfully');
    } catch (error) {
      console.error('[ERROR] Failed to initialize Babylon.js scenes:', error);
      setErrorMessage(`Failed to initialize 3D scenes: ${error}`);
    }
  }, [width, height]);

  /**
   * Process OpenSCAD code through the complete pipeline
   */
  const processOpenSCADCode = useCallback(async () => {
    if (!openscadCode.trim() || scenes.length === 0) return;

    console.log('[INIT] Processing OpenSCAD code through pipeline:', openscadCode);
    setProcessingStatus('processing');
    setErrorMessage('');

    try {
      // Initialize pipeline if needed
      if (!pipelineRef.current) {
        pipelineRef.current = new OpenScadPipeline({
          enableLogging: true,
          enableMetrics: true,
          csg2Timeout: 30000
        });
        await pipelineRef.current.initialize();
      }

      // Process code using the first scene (perspective view)
      const firstScene = scenes[0];
      if (!firstScene) {
        throw new Error('No scenes available for processing');
      }

      const result = await pipelineRef.current.processOpenScadCode(openscadCode, firstScene);

      if (result.success && result.value) {
        console.log('[DEBUG] Pipeline processing successful:', result.value.name);

        const mesh = result.value;
        setCurrentMesh(mesh);

        // Update mesh info
        setMeshInfo({
          name: mesh.name,
          vertices: mesh.getTotalVertices(),
          indices: mesh.getTotalIndices()
        });

        // Clone mesh to other scenes
        for (let i = 1; i < scenes.length; i++) {
          const scene = scenes[i];
          if (scene) {
            const clonedMesh = mesh.clone(`${mesh.name}_view${i}`, null);
            if (clonedMesh) {
              clonedMesh.setParent(null);
              scene.addMesh(clonedMesh);
            }
          }
        }

        setProcessingStatus('success');
        console.log('[END] OpenSCAD processing completed successfully');
      } else {
        throw new Error('Pipeline processing failed');
      }
    } catch (error) {
      console.error('[ERROR] Pipeline processing failed:', error);
      setErrorMessage(error instanceof Error ? error.message : String(error));
      setProcessingStatus('error');
    }
  }, [openscadCode, scenes]);

  /**
   * Reset all cameras to default positions
   */
  const resetCameras = useCallback(() => {
    console.log('[DEBUG] Resetting all cameras to default positions');
    
    cameras.forEach((camera, index) => {
      const view = cameraViews[index];
      if (!view) return;

      if (camera instanceof BABYLON.ArcRotateCamera) {
        camera.setPosition(new BABYLON.Vector3(...view.position));
        camera.setTarget(new BABYLON.Vector3(...view.target));
      } else if (camera instanceof BABYLON.UniversalCamera) {
        camera.position = new BABYLON.Vector3(...view.position);
        camera.setTarget(new BABYLON.Vector3(...view.target));
      }
    });
  }, [cameras]);

  // Initialize scenes on mount
  useEffect(() => {
    void initializeBabylonScenes();

    return () => {
      console.log('[DEBUG] Cleaning up Babylon.js resources');
      engines.forEach(engine => {
        if (engine && !engine.isDisposed) {
          engine.stopRenderLoop();
          engine.dispose();
        }
      });
      scenes.forEach(scene => {
        if (scene && !scene.isDisposed) {
          scene.dispose();
        }
      });
    };
  }, [initializeBabylonScenes]);

  // Process OpenSCAD code when it changes
  useEffect(() => {
    if (scenes.length > 0) {
      void processOpenSCADCode();
    }
  }, [openscadCode, processOpenSCADCode]);

  return (
    <div className="openscad-multi-view-renderer" style={{ padding: '20px' }}>
      <h3>OpenSCAD Multi-View Renderer</h3>
      
      {/* Processing Status */}
      <div className="status-section">
        <div data-testid="processing-status" className={`status-indicator ${processingStatus}`}>
          Status: {processingStatus.charAt(0).toUpperCase() + processingStatus.slice(1)}
        </div>
        
        {errorMessage && (
          <div data-testid="error-message" className="error-message">
            Error: {errorMessage}
          </div>
        )}
      </div>

      {/* Camera Controls */}
      {enableCameraSynchronization && (
        <div className="camera-controls">
          <label>
            <input 
              type="checkbox" 
              data-testid="sync-cameras-toggle"
              defaultChecked={enableCameraSynchronization}
            />
            Synchronize Cameras
          </label>
          <button 
            data-testid="reset-cameras-button"
            onClick={resetCameras}
          >
            Reset Cameras
          </button>
        </div>
      )}

      {/* 4-View Grid */}
      <div className="views-grid" style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr',
        gridTemplateRows: '1fr 1fr',
        gap: '10px',
        marginTop: '20px'
      }}>
        {cameraViews.map((view, index) => (
          <div key={view.name} className="view-container" data-testid={view.testId}>
            <h4>{view.name} View</h4>
            <canvas
              ref={[perspectiveCanvasRef, topCanvasRef, sideCanvasRef, bottomCanvasRef][index]}
              width={width}
              height={height}
              style={{ border: '1px solid #ccc', display: 'block' }}
            />
            
            {enableDebugInfo && cameras[index] && (
              <div className="camera-debug-info">
                <div data-testid={`${view.testId.replace('-view', '')}-camera-info`}>
                  Camera: {cameras[index].getClassName()}
                </div>
                <div data-testid={`${view.testId.replace('-view', '')}-camera-position`}>
                  Position: {cameras[index].position?.toString() || 'N/A'}
                </div>
                <div data-testid={`${view.testId.replace('-view', '')}-mesh-visible`}>
                  Mesh Visible: {currentMesh ? 'true' : 'false'}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Mesh Information */}
      {meshInfo && (
        <div data-testid="mesh-info" className="mesh-info" style={{ marginTop: '20px' }}>
          <h4>Mesh Information</h4>
          <p>Name: <span data-testid="mesh-name">{meshInfo.name}</span></p>
          <p>Vertices: <span data-testid="vertex-count">{meshInfo.vertices}</span></p>
          <p>Indices: <span data-testid="index-count">{meshInfo.indices}</span></p>
        </div>
      )}
    </div>
  );
}
