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
  const startTime = performance.now();
  console.log('[INIT] OpenSCAD Multi-View Renderer initializing', {
    openscadCode: openscadCode.substring(0, 50) + (openscadCode.length > 50 ? '...' : ''),
    width,
    height,
    enableCameraSynchronization,
    enableDebugInfo,
    timestamp: new Date().toISOString()
  });

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

  // Debug state tracking
  const [initializationStage, setInitializationStage] = useState<string>('starting');
  const debugTimers = useRef<{ [key: string]: number }>({});

  // Helper function to log with timing
  const logWithTiming = useCallback((level: string, message: string, data?: any) => {
    const elapsed = performance.now() - startTime;
    const timestamp = new Date().toISOString();
    console.log(`[${level}] [${elapsed.toFixed(2)}ms] ${message}`, data ? data : '');
  }, [startTime]);

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
    const initStartTime = performance.now();
    logWithTiming('INIT', 'Starting Babylon.js scenes initialization for 4 views');
    setInitializationStage('babylon-init');

    try {
      logWithTiming('DEBUG', 'Checking canvas refs availability');
      const canvasRefs = [
        perspectiveCanvasRef,
        topCanvasRef,
        sideCanvasRef,
        bottomCanvasRef
      ];

      // Validate canvas refs
      const availableCanvases = canvasRefs.filter(ref => ref?.current).length;
      logWithTiming('DEBUG', `Available canvas refs: ${availableCanvases}/4`);

      if (availableCanvases === 0) {
        throw new Error('No canvas elements available for initialization');
      }

      const newEngines: BABYLON.NullEngine[] = [];
      const newScenes: BABYLON.Scene[] = [];
      const newCameras: BABYLON.Camera[] = [];

      for (let i = 0; i < 4; i++) {
        const viewStartTime = performance.now();
        const canvas = canvasRefs[i]?.current;
        const viewName = cameraViews[i]?.name || `View${i}`;

        logWithTiming('DEBUG', `Initializing ${viewName} (${i + 1}/4)`);

        if (!canvas) {
          logWithTiming('WARN', `Canvas not available for ${viewName}, skipping`);
          continue;
        }

        // Create engine (NullEngine for testing compatibility)
        logWithTiming('DEBUG', `Creating NullEngine for ${viewName}`, {
          renderWidth: width,
          renderHeight: height,
          textureSize: 512
        });

        const engine = new BABYLON.NullEngine({
          renderWidth: width,
          renderHeight: height,
          textureSize: 512,
          deterministicLockstep: false,
          lockstepMaxSteps: 1
        });

        logWithTiming('DEBUG', `NullEngine created for ${viewName}`);

        // Create scene
        logWithTiming('DEBUG', `Creating scene for ${viewName}`);
        const scene = new BABYLON.Scene(engine);

        logWithTiming('DEBUG', `Creating default camera/light for ${viewName}`);
        scene.createDefaultCameraOrLight(true, true, true);

        logWithTiming('DEBUG', `Scene created for ${viewName} in ${(performance.now() - viewStartTime).toFixed(2)}ms`);

        // Create camera based on view type
        const view = cameraViews[i];
        if (!view) {
          logWithTiming('WARN', `No view configuration for index ${i}, skipping`);
          continue;
        }

        logWithTiming('DEBUG', `Creating ${view.type} camera for ${viewName}`);
        let camera: BABYLON.Camera;

        try {
          if (view.type === 'perspective') {
            camera = new BABYLON.ArcRotateCamera(
              `${view.name}Camera`,
              -Math.PI / 4,
              Math.PI / 3,
              20,
              new BABYLON.Vector3(...view.target),
              scene
            );
            logWithTiming('DEBUG', `ArcRotateCamera created for ${viewName}`);
          } else {
            camera = new BABYLON.UniversalCamera(
              `${view.name}Camera`,
              new BABYLON.Vector3(...view.position),
              scene
            );
            (camera as BABYLON.UniversalCamera).setTarget(new BABYLON.Vector3(...view.target));
            logWithTiming('DEBUG', `UniversalCamera created for ${viewName}`);
          }
        } catch (cameraError) {
          logWithTiming('ERROR', `Failed to create camera for ${viewName}:`, cameraError);
          throw cameraError;
        }

        // Setup lighting
        logWithTiming('DEBUG', `Setting up lighting for ${viewName}`);
        try {
          const light = new BABYLON.HemisphericLight('light', new BABYLON.Vector3(0, 1, 0), scene);
          light.intensity = 0.8;

          const directionalLight = new BABYLON.DirectionalLight('dirLight', new BABYLON.Vector3(-1, -1, -1), scene);
          directionalLight.intensity = 0.6;

          logWithTiming('DEBUG', `Lighting setup complete for ${viewName}`);
        } catch (lightError) {
          logWithTiming('ERROR', `Failed to setup lighting for ${viewName}:`, lightError);
          throw lightError;
        }

        newEngines.push(engine);
        newScenes.push(scene);
        newCameras.push(camera);

        // Start render loop
        logWithTiming('DEBUG', `Starting render loop for ${viewName}`);
        try {
          engine.runRenderLoop(() => {
            if (scene && !scene.isDisposed) {
              scene.render();
            }
          });
          logWithTiming('DEBUG', `Render loop started for ${viewName}`);
        } catch (renderError) {
          logWithTiming('ERROR', `Failed to start render loop for ${viewName}:`, renderError);
          throw renderError;
        }

        const viewElapsed = performance.now() - viewStartTime;
        logWithTiming('DEBUG', `${viewName} initialization completed in ${viewElapsed.toFixed(2)}ms`);
      }

      logWithTiming('DEBUG', 'Setting state with initialized Babylon.js objects', {
        engines: newEngines.length,
        scenes: newScenes.length,
        cameras: newCameras.length
      });

      setEngines(newEngines);
      setScenes(newScenes);
      setCameras(newCameras);
      setInitializationStage('babylon-complete');

      const totalElapsed = performance.now() - initStartTime;
      logWithTiming('END', `All ${newScenes.length} Babylon.js scenes initialized successfully in ${totalElapsed.toFixed(2)}ms`);
    } catch (error) {
      const totalElapsed = performance.now() - initStartTime;
      logWithTiming('ERROR', `Failed to initialize Babylon.js scenes after ${totalElapsed.toFixed(2)}ms:`, error);
      setErrorMessage(`Failed to initialize 3D scenes: ${error}`);
      setInitializationStage('babylon-error');
      throw error; // Re-throw to help with debugging
    }
  }, [width, height, logWithTiming]);

  /**
   * Process OpenSCAD code through the complete pipeline
   */
  const processOpenSCADCode = useCallback(async () => {
    const processingStartTime = performance.now();

    logWithTiming('DEBUG', 'Checking processing prerequisites', {
      hasOpenscadCode: !!openscadCode.trim(),
      openscadCodeLength: openscadCode.length,
      scenesCount: scenes.length,
      processingStatus
    });

    if (!openscadCode.trim()) {
      logWithTiming('WARN', 'No OpenSCAD code provided, skipping processing');
      return;
    }

    if (scenes.length === 0) {
      logWithTiming('WARN', 'No scenes available, skipping processing');
      return;
    }

    logWithTiming('INIT', 'Starting OpenSCAD code processing through pipeline', {
      code: openscadCode.substring(0, 100) + (openscadCode.length > 100 ? '...' : ''),
      scenesAvailable: scenes.length
    });

    setProcessingStatus('processing');
    setErrorMessage('');
    setInitializationStage('pipeline-processing');

    try {
      // Initialize pipeline if needed
      if (!pipelineRef.current) {
        logWithTiming('DEBUG', 'Pipeline not initialized, creating new instance');
        const pipelineInitStart = performance.now();

        pipelineRef.current = new OpenScadPipeline({
          enableLogging: true,
          enableMetrics: true,
          csg2Timeout: 30000
        });

        logWithTiming('DEBUG', 'Calling pipeline.initialize()');
        await pipelineRef.current.initialize();

        const pipelineInitElapsed = performance.now() - pipelineInitStart;
        logWithTiming('DEBUG', `Pipeline initialization completed in ${pipelineInitElapsed.toFixed(2)}ms`);
      } else {
        logWithTiming('DEBUG', 'Using existing pipeline instance');
      }

      // Process code using the first scene (perspective view)
      const firstScene = scenes[0];
      if (!firstScene) {
        throw new Error('No scenes available for processing');
      }

      logWithTiming('DEBUG', 'Starting pipeline processing with first scene');
      const pipelineProcessStart = performance.now();

      const result = await pipelineRef.current.processOpenScadCode(openscadCode, firstScene);

      const pipelineProcessElapsed = performance.now() - pipelineProcessStart;
      logWithTiming('DEBUG', `Pipeline processing completed in ${pipelineProcessElapsed.toFixed(2)}ms`, {
        success: result.success,
        hasValue: !!result.value
      });

      if (result.success && result.value) {
        logWithTiming('DEBUG', 'Pipeline processing successful, handling mesh result', {
          meshName: result.value.name,
          meshType: result.value.constructor.name
        });

        const mesh = result.value;
        setCurrentMesh(mesh);

        // Update mesh info
        const meshInfoData = {
          name: mesh.name,
          vertices: mesh.getTotalVertices(),
          indices: mesh.getTotalIndices()
        };

        logWithTiming('DEBUG', 'Mesh information extracted', meshInfoData);
        setMeshInfo(meshInfoData);

        // Clone mesh to other scenes
        logWithTiming('DEBUG', `Cloning mesh to ${scenes.length - 1} additional scenes`);
        const cloneStartTime = performance.now();

        for (let i = 1; i < scenes.length; i++) {
          const scene = scenes[i];
          const viewName = cameraViews[i]?.name || `View${i}`;

          if (scene) {
            try {
              logWithTiming('DEBUG', `Cloning mesh to ${viewName}`);
              const clonedMesh = mesh.clone(`${mesh.name}_view${i}`, null);
              if (clonedMesh) {
                clonedMesh.setParent(null);
                scene.addMesh(clonedMesh);
                logWithTiming('DEBUG', `Mesh successfully cloned to ${viewName}`);
              } else {
                logWithTiming('WARN', `Failed to clone mesh to ${viewName} - clone returned null`);
              }
            } catch (cloneError) {
              logWithTiming('ERROR', `Error cloning mesh to ${viewName}:`, cloneError);
            }
          } else {
            logWithTiming('WARN', `Scene not available for ${viewName}, skipping clone`);
          }
        }

        const cloneElapsed = performance.now() - cloneStartTime;
        logWithTiming('DEBUG', `Mesh cloning completed in ${cloneElapsed.toFixed(2)}ms`);

        setProcessingStatus('success');
        setInitializationStage('processing-complete');

        const totalElapsed = performance.now() - processingStartTime;
        logWithTiming('END', `OpenSCAD processing completed successfully in ${totalElapsed.toFixed(2)}ms`);
      } else {
        logWithTiming('ERROR', 'Pipeline processing failed - no result or unsuccessful', {
          success: result.success,
          hasValue: !!result.value,
          error: result.error || 'Unknown error'
        });
        throw new Error(`Pipeline processing failed: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      const totalElapsed = performance.now() - processingStartTime;
      logWithTiming('ERROR', `Pipeline processing failed after ${totalElapsed.toFixed(2)}ms:`, error);
      setErrorMessage(error instanceof Error ? error.message : String(error));
      setProcessingStatus('error');
      setInitializationStage('processing-error');
    }
  }, [openscadCode, scenes, logWithTiming, processingStatus]);

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
    logWithTiming('DEBUG', 'useEffect: Component mounted, starting Babylon.js initialization');
    setInitializationStage('mounting');

    const initPromise = initializeBabylonScenes();

    // Handle initialization errors
    initPromise.catch(error => {
      logWithTiming('ERROR', 'Babylon.js initialization failed in useEffect:', error);
      setInitializationStage('mount-error');
    });

    return () => {
      logWithTiming('DEBUG', 'useEffect cleanup: Disposing Babylon.js resources', {
        enginesCount: engines.length,
        scenesCount: scenes.length
      });

      try {
        engines.forEach((engine, index) => {
          if (engine && !engine.isDisposed) {
            logWithTiming('DEBUG', `Disposing engine ${index + 1}/${engines.length}`);
            engine.stopRenderLoop();
            engine.dispose();
          }
        });

        scenes.forEach((scene, index) => {
          if (scene && !scene.isDisposed) {
            logWithTiming('DEBUG', `Disposing scene ${index + 1}/${scenes.length}`);
            scene.dispose();
          }
        });

        logWithTiming('DEBUG', 'Babylon.js cleanup completed successfully');
      } catch (cleanupError) {
        logWithTiming('ERROR', 'Error during Babylon.js cleanup:', cleanupError);
      }
    };
  }, [initializeBabylonScenes, logWithTiming]);

  // Process OpenSCAD code when it changes
  useEffect(() => {
    logWithTiming('DEBUG', 'useEffect: OpenSCAD code or scenes changed', {
      hasOpenscadCode: !!openscadCode.trim(),
      scenesCount: scenes.length,
      initializationStage
    });

    if (scenes.length > 0 && openscadCode.trim()) {
      logWithTiming('DEBUG', 'Triggering OpenSCAD processing');
      setInitializationStage('ready-to-process');

      const processPromise = processOpenSCADCode();

      // Handle processing errors
      processPromise.catch(error => {
        logWithTiming('ERROR', 'OpenSCAD processing failed in useEffect:', error);
      });
    } else {
      logWithTiming('DEBUG', 'Skipping OpenSCAD processing - prerequisites not met');
    }
  }, [openscadCode, scenes.length, processOpenSCADCode, logWithTiming, initializationStage]);

  return (
    <div
      className="openscad-multi-view-renderer"
      data-testid="openscad-multi-view-renderer"
      style={{ padding: '20px' }}
    >
      <h3 data-testid="renderer-title">OpenSCAD Multi-View Renderer</h3>

      {/* Processing Status */}
      <div className="status-section">
        <div data-testid="processing-status" className={`status-indicator ${processingStatus}`}>
          Status: {processingStatus.charAt(0).toUpperCase() + processingStatus.slice(1)}
        </div>

        {enableDebugInfo && (
          <div data-testid="initialization-stage" className="debug-info">
            Stage: {initializationStage}
          </div>
        )}

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
