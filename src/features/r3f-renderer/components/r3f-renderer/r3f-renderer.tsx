/**
 * @file R3FRenderer Component
 * 
 * React Three Fiber renderer component equivalent to BabylonRenderer.
 * Main component responsible for composing all R3F sub-components and managing state.
 * 
 * Features:
 * - Composing all R3F sub-components (Canvas, Controls, Display, Debug)
 * - Managing centralized state for renderer and scene
 * - Coordinating data flow and event handling between components
 * - Providing responsive layout and accessibility features
 * - Handling component lifecycle and resource cleanup
 * 
 * @author OpenSCAD-R3F Pipeline
 * @version 1.0.0
 */

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { R3FCanvas } from '../r3f-canvas/r3f-canvas';
import { R3FSceneControls, type MaterialConfig, type LightingConfig, type CameraConfig, type EnvironmentConfig, type CSGVisualizationMode } from '../r3f-scene-controls/r3f-scene-controls';
import { useOpenSCADR3FIntegration } from '../../../openscad-pipeline';
import type { R3FRendererProps } from '../../types/r3f-types';
import type { PipelineProgress } from '../../../openscad-pipeline/core/pipeline-processor';
import type { ProcessingProgress } from '../../../r3f-csg/types/r3f-csg-types';
import './r3f-renderer.css';

/**
 * Maps PipelineProgress to ProcessingProgress for component compatibility
 */
function mapPipelineToProcessingProgress(progress: PipelineProgress | null): ProcessingProgress | null {
  if (!progress) return null;
  
  // Map pipeline stages to processing stages
  const stageMap: Record<PipelineProgress['stage'], ProcessingProgress['stage']> = {
    'parsing': 'parsing',
    'csg-processing': 'ast-processing', 
    'r3f-generation': 'scene-generation',
    'complete': 'complete'
  };
  
  return {
    stage: stageMap[progress.stage],
    progress: progress.progress,
    message: progress.message,
    timeElapsed: progress.timeElapsed,
    ...(progress.estimatedTimeRemaining !== undefined && { estimatedTimeRemaining: progress.estimatedTimeRemaining })
  } as ProcessingProgress;
}

/**
 * R3FRenderer Component
 * 
 * Main component responsible for:
 * - Composing all R3F sub-components (Canvas, Controls, Display, Debug)
 * - Managing centralized state for renderer and scene
 * - Coordinating data flow and event handling between components
 * - Providing responsive layout and accessibility features
 * - Handling component lifecycle and resource cleanup
 * 
 * @param props - Renderer configuration and event handlers
 * @returns JSX element containing the complete R3F renderer interface
 * 
 * @example
 * ```tsx
 * <R3FRenderer
 *   layout="grid"
 *   showSceneControls={true}
 *   showMeshDisplay={true}
 *   showDebugPanel={true}
 *   onSceneReady={(scene) => console.log('Scene ready:', scene)}
 *   onMeshSelect={(mesh) => console.log('Mesh selected:', mesh)}
 * />
 * ```
 */
export function R3FRenderer({
  canvasConfig,
  sceneConfig,
  cameraConfig,
  layout = 'flex',
  responsive = true,
  showSceneControls = false,
  showMeshDisplay = false,
  showDebugPanel = false,
  onSceneReady,
  onMeshSelect,
  onError,
  astData,
  onASTProcessingStart,
  onASTProcessingComplete: _onASTProcessingComplete,
  onASTProcessingError,
  className = '',
  'aria-label': ariaLabel = 'R3F Renderer',
  ...props
}: R3FRendererProps): React.JSX.Element {
  console.log('[INIT] Initializing R3FRenderer component');

  // State management
  const [renderer, setRenderer] = useState<THREE.WebGLRenderer | null>(null);
  const [scene, setScene] = useState<THREE.Scene | null>(null);
  const [camera, setCamera] = useState<THREE.Camera | null>(null);
  const [meshes, setMeshes] = useState<THREE.Mesh[]>([]);
  const [selectedMesh, setSelectedMesh] = useState<THREE.Mesh | null>(null);
  const [isProcessingAST, setIsProcessingAST] = useState(false);
  const [processingError, setProcessingError] = useState<string | null>(null);

  // OpenSCAD integration state
  const [openscadCode, setOpenscadCode] = useState<string>('cube([10, 10, 10]);');

  // Refs for component lifecycle
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);

  // OpenSCAD Pipeline integration
  const pipeline = useOpenSCADR3FIntegration(openscadCode, {
    autoProcess: false, // Manual processing for better control
    enableLogging: false,
    enableCaching: true,
    enableOptimization: true,
    onMeshesGenerated: (generatedMeshes) => {
      console.log('[DEBUG] Pipeline generated meshes:', generatedMeshes.length);

      if (scene) {
        // Clear existing meshes
        meshes.forEach(mesh => {
          scene.remove(mesh);
          if (mesh.geometry) mesh.geometry.dispose();
          if (mesh.material) {
            if (Array.isArray(mesh.material)) {
              mesh.material.forEach(material => material.dispose());
            } else {
              mesh.material.dispose();
            }
          }
        });

        // Add new meshes
        generatedMeshes.forEach(mesh => {
          scene.add(mesh);
        });

        setMeshes([...generatedMeshes]);
      }
    },
    onProgress: (progress) => {
      console.log('[DEBUG] Pipeline progress:', progress);
    },
    onError: (error) => {
      console.error('[ERROR] Pipeline error:', error);
      setProcessingError(error.message);
    },
    onComplete: (success, metrics) => {
      console.log('[DEBUG] Pipeline complete:', success, metrics);
      setIsProcessingAST(false);
    }
  });

  // Derived state
  const isInitialized = useMemo(() => {
    return renderer && scene;
  }, [renderer, scene]);

  // Callback for renderer ready event
  const handleRendererReady = useCallback((newRenderer: THREE.WebGLRenderer) => {
    console.log('[DEBUG] Renderer ready in R3FRenderer');
    rendererRef.current = newRenderer;
    setRenderer(newRenderer);
  }, []);

  // Callback for scene ready event
  const handleSceneReady = useCallback((newScene: THREE.Scene) => {
    console.log('[DEBUG] Scene ready in R3FRenderer');
    sceneRef.current = newScene;
    setScene(newScene);

    // Find and set the camera
    const sceneCamera = newScene.children.find(child =>
      child instanceof THREE.Camera
    ) as THREE.Camera;
    if (sceneCamera) {
      setCamera(sceneCamera);
    }

    if (onSceneReady) {
      onSceneReady(newScene);
    }
  }, [onSceneReady]);

  // Handle mesh selection
  const handleMeshSelect = useCallback((mesh: THREE.Mesh) => {
    console.log('[DEBUG] Mesh selected:', mesh.name);
    setSelectedMesh(mesh);
    
    if (onMeshSelect) {
      onMeshSelect(mesh);
    }
  }, [onMeshSelect]);

  // Handle mesh deletion
  const handleMeshDelete = useCallback((mesh: THREE.Mesh) => {
    console.log('[DEBUG] Deleting mesh:', mesh.name);
    
    if (scene) {
      scene.remove(mesh);
      
      // Dispose geometry and material
      if (mesh.geometry) {
        mesh.geometry.dispose();
      }
      if (mesh.material) {
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach(material => material.dispose());
        } else {
          mesh.material.dispose();
        }
      }
      
      // Update mesh list
      setMeshes(prevMeshes => prevMeshes.filter(m => m !== mesh));
      
      // Clear selection if deleted mesh was selected
      if (selectedMesh === mesh) {
        setSelectedMesh(null);
      }
    }
  }, [scene, selectedMesh]);

  // Handle mesh visibility toggle
  const handleMeshToggleVisibility = useCallback((mesh: THREE.Mesh) => {
    console.log('[DEBUG] Toggling mesh visibility:', mesh.name);
    mesh.visible = !mesh.visible;
  }, []);

  // Handle wireframe toggle
  const handleWireframeToggle = useCallback(() => {
    console.log('[DEBUG] Toggling wireframe mode');
    
    if (scene) {
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh && object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(material => {
              if ('wireframe' in material) {
                material.wireframe = !material.wireframe;
              }
            });
          } else if ('wireframe' in object.material) {
            object.material.wireframe = !object.material.wireframe;
          }
        }
      });
    }
  }, [scene]);

  // Handle lighting toggle
  const handleLightingToggle = useCallback(() => {
    console.log('[DEBUG] Toggling lighting');
    
    if (scene) {
      const lights = scene.children.filter(child => 
        child instanceof THREE.Light
      ) as THREE.Light[];
      
      lights.forEach(light => {
        light.visible = !light.visible;
      });
    }
  }, [scene]);

  // Handle background color change
  const handleBackgroundColorChange = useCallback((color: string) => {
    console.log('[DEBUG] Changing background color to:', color);

    if (scene) {
      scene.background = new THREE.Color(color);
    }
  }, [scene]);

  // Enhanced scene controls handlers
  const handleMaterialChange = useCallback((config: MaterialConfig) => {
    console.log('[DEBUG] Material configuration changed:', config);

    if (scene) {
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh && object.material) {
          const materials = Array.isArray(object.material) ? object.material : [object.material];

          materials.forEach(material => {
            if (material instanceof THREE.MeshStandardMaterial ||
                material instanceof THREE.MeshPhysicalMaterial) {
              material.wireframe = config.wireframe;
              material.transparent = config.transparent;
              material.opacity = config.opacity;
              material.color.setHex(parseInt(config.color.replace('#', ''), 16));
              material.metalness = config.metalness;
              material.roughness = config.roughness;
              material.emissive.setHex(parseInt(config.emissive.replace('#', ''), 16));
              material.emissiveIntensity = config.emissiveIntensity;
              material.needsUpdate = true;
            }
          });
        }
      });
    }
  }, [scene]);

  const handleLightingChange = useCallback((config: LightingConfig) => {
    console.log('[DEBUG] Lighting configuration changed:', config);

    if (scene) {
      // Remove existing lights
      const existingLights = scene.children.filter(child => child instanceof THREE.Light);
      existingLights.forEach(light => scene.remove(light));

      // Add ambient light
      if (config.enableAmbient) {
        const ambientLight = new THREE.AmbientLight(
          new THREE.Color(config.ambientColor),
          config.ambientIntensity
        );
        scene.add(ambientLight);
      }

      // Add directional light
      if (config.enableDirectional) {
        const directionalLight = new THREE.DirectionalLight(
          new THREE.Color(config.directionalColor),
          config.directionalIntensity
        );
        directionalLight.position.set(...config.directionalPosition);
        directionalLight.castShadow = config.enableShadows;
        scene.add(directionalLight);
      }

      // Add point light
      if (config.enablePoint) {
        const pointLight = new THREE.PointLight(
          new THREE.Color(config.pointColor),
          config.pointIntensity
        );
        pointLight.position.set(...config.pointPosition);
        pointLight.castShadow = config.enableShadows;
        scene.add(pointLight);
      }
    }
  }, [scene]);

  const handleCameraChange = useCallback((config: CameraConfig) => {
    console.log('[DEBUG] Camera configuration changed:', config);

    if (camera && camera instanceof THREE.PerspectiveCamera) {
      camera.position.set(...config.position);
      camera.lookAt(new THREE.Vector3(...config.target));
      camera.fov = config.fov;
      camera.near = config.near;
      camera.far = config.far;
      camera.updateProjectionMatrix();
    }
  }, [camera]);

  // Camera framing functions using the new camera system
  const handleFrameForMeshes = useCallback(() => {
    console.log('[DEBUG] Framing camera for current meshes');

    if (meshes.length > 0) {
      // This would be handled by the R3FCameraControls component
      // The actual implementation is in the camera controls
      console.log('[DEBUG] Requesting frame for', meshes.length, 'meshes');
    }
  }, [meshes]);

  const handleResetCamera = useCallback(() => {
    console.log('[DEBUG] Resetting camera to default position');

    // This would be handled by the R3FCameraControls component
    // The actual implementation is in the camera controls
  }, []);

  const handleEnvironmentChange = useCallback((config: EnvironmentConfig) => {
    console.log('[DEBUG] Environment configuration changed:', config);

    if (scene) {
      // Update background
      scene.background = new THREE.Color(config.background);

      // Handle fog
      if (config.enableFog) {
        scene.fog = new THREE.Fog(
          new THREE.Color(config.fogColor),
          config.fogNear,
          config.fogFar
        );
      } else {
        scene.fog = null;
      }

      // Handle grid (simplified - would need proper grid helper implementation)
      const existingGrid = scene.getObjectByName('scene-grid');
      if (existingGrid) {
        scene.remove(existingGrid);
      }

      if (config.enableGrid) {
        const gridHelper = new THREE.GridHelper(config.gridSize, config.gridDivisions);
        gridHelper.name = 'scene-grid';
        scene.add(gridHelper);
      }

      // Handle axes
      const existingAxes = scene.getObjectByName('scene-axes');
      if (existingAxes) {
        scene.remove(existingAxes);
      }

      if (config.enableAxes) {
        const axesHelper = new THREE.AxesHelper(config.axesSize);
        axesHelper.name = 'scene-axes';
        scene.add(axesHelper);
      }
    }
  }, [scene]);

  const handleCSGModeChange = useCallback((mode: CSGVisualizationMode) => {
    console.log('[DEBUG] CSG visualization mode changed:', mode);

    if (scene) {
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          switch (mode) {
            case 'solid':
              object.visible = true;
              if (object.material && 'wireframe' in object.material) {
                object.material.wireframe = false;
              }
              break;
            case 'wireframe':
              object.visible = true;
              if (object.material && 'wireframe' in object.material) {
                object.material.wireframe = true;
              }
              break;
            case 'transparent':
              object.visible = true;
              if (object.material && 'transparent' in object.material) {
                object.material.transparent = true;
                object.material.opacity = 0.5;
              }
              break;
            case 'exploded':
              // Simplified exploded view - move meshes apart
              object.position.multiplyScalar(1.5);
              break;
            case 'debug':
              // Add debug information (simplified)
              object.visible = true;
              break;
          }
        }
      });
    }
  }, [scene]);

  const handleExportScene = useCallback((format: 'gltf' | 'obj' | 'stl') => {
    console.log('[DEBUG] Exporting scene as:', format);
    // TODO: Implement actual export functionality
    // This would require additional libraries like GLTFExporter, OBJExporter, etc.
    alert(`Export as ${format.toUpperCase()} - Feature coming soon!`);
  }, []);

  const handleResetScene = useCallback(() => {
    console.log('[DEBUG] Resetting scene');

    if (scene) {
      // Remove all meshes
      const meshesToRemove = [...meshes];
      meshesToRemove.forEach(mesh => {
        scene.remove(mesh);
        if (mesh.geometry) mesh.geometry.dispose();
        if (mesh.material) {
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach(material => material.dispose());
          } else {
            mesh.material.dispose();
          }
        }
      });

      setMeshes([]);
      setSelectedMesh(null);

      // Reset camera position if available
      if (camera && camera instanceof THREE.PerspectiveCamera) {
        camera.position.set(15, 15, 15);
        camera.lookAt(0, 0, 0);
      }
    }
  }, [scene, meshes, camera]);

  // OpenSCAD code conversion handler
  const handleOpenSCADConversion = useCallback(async (code: string) => {
    console.log('[DEBUG] Converting OpenSCAD code:', code);
    setIsProcessingAST(true);
    setProcessingError(null);

    if (onASTProcessingStart) {
      onASTProcessingStart();
    }

    try {
      // Update the code and trigger processing
      setOpenscadCode(code);
      await pipeline.processCode(code);

      // The pipeline integration will handle mesh generation through callbacks
      // Processing completion is handled in the pipeline's onComplete callback

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[ERROR] OpenSCAD conversion exception:', errorMessage);
      setProcessingError(errorMessage);
      setIsProcessingAST(false);

      if (onASTProcessingError) {
        onASTProcessingError(errorMessage);
      }

      if (onError) {
        onError(errorMessage);
      }
    }
  }, [pipeline, onASTProcessingStart, onASTProcessingError, onError]);

  // AST processing effect - now handles both AST data and OpenSCAD code
  useEffect(() => {
    if (astData && scene && !isProcessingAST) {
      console.log('[DEBUG] Processing AST data');
      setIsProcessingAST(true);
      setProcessingError(null);

      if (onASTProcessingStart) {
        onASTProcessingStart();
      }

      // Convert AST to OpenSCAD code (simplified approach)
      // In a real implementation, you might want to serialize the AST back to OpenSCAD
      // For now, we'll use a default cube as an example
      const openscadCodeFromAST = 'cube([10, 10, 10]);';

      // Use the OpenSCAD conversion handler
      handleOpenSCADConversion(openscadCodeFromAST).catch(console.error);
    }
  }, [astData, scene, isProcessingAST, handleOpenSCADConversion, onASTProcessingStart]);

  // OpenSCAD code effect - convert when code changes
  useEffect(() => {
    if (openscadCode && scene && !isProcessingAST) {
      console.log('[DEBUG] Auto-converting OpenSCAD code');
      handleOpenSCADConversion(openscadCode).catch(console.error);
    }
  }, [openscadCode, scene, isProcessingAST, handleOpenSCADConversion]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('[DEBUG] R3FRenderer unmounting, cleaning up');
      setRenderer(null);
      setScene(null);
      setMeshes([]);
      setSelectedMesh(null);
    };
  }, []);

  // Combine CSS classes
  const containerClasses = [
    'r3f-renderer',
    `r3f-renderer--${layout}`,
    responsive ? 'r3f-renderer--responsive' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <main
      className={containerClasses}
      role="main"
      aria-label={ariaLabel}
      data-testid="r3f-renderer-container"
      {...props}
    >
      {/* Main Canvas Area */}
      <div className="r3f-renderer__canvas-area">
        <R3FCanvas
          canvasConfig={canvasConfig ?? {}}
          sceneConfig={sceneConfig ?? {}}
          cameraConfig={cameraConfig ?? {}}
          onRendererReady={handleRendererReady}
          onSceneReady={handleSceneReady}
          aria-label="R3F Canvas"
        />
      </div>

      {/* Enhanced Scene Controls Panel */}
      {showSceneControls && (
        <div className="r3f-renderer__controls-area">
          <R3FSceneControls
            scene={scene ?? undefined}
            camera={camera ?? undefined}
            meshes={meshes}
            conversionProgress={mapPipelineToProcessingProgress(pipeline.progress)}
            isProcessing={pipeline.isProcessing}
            onMaterialChange={handleMaterialChange}
            onLightingChange={handleLightingChange}
            onCameraChange={handleCameraChange}
            onEnvironmentChange={handleEnvironmentChange}
            onCSGModeChange={handleCSGModeChange}
            onExportScene={handleExportScene}
            onResetScene={handleResetScene}
          />
        </div>
      )}

      {/* Mesh Display Panel */}
      {showMeshDisplay && (
        <div className="r3f-renderer__mesh-area">
          {/* TODO: Implement R3F Mesh Display component */}
          <div className="placeholder-mesh-display">
            <h3>Mesh Display</h3>
            <div>Meshes: {meshes.length}</div>
            {selectedMesh && <div>Selected: {selectedMesh.name}</div>}
          </div>
        </div>
      )}

      {/* Debug Panel */}
      {showDebugPanel && (
        <div className="r3f-renderer__debug-area">
          {/* TODO: Implement R3F Debug Panel component */}
          <div className="placeholder-debug-panel">
            <h3>Debug Panel</h3>
            <div>Renderer: {renderer ? 'Ready' : 'Not Ready'}</div>
            <div>Scene: {scene ? 'Ready' : 'Not Ready'}</div>
            <div>Processing: {isProcessingAST ? 'Yes' : 'No'}</div>
            {processingError && <div>Error: {processingError}</div>}
          </div>
        </div>
      )}
    </main>
  );
}

// Re-export types for convenience
export type { R3FRendererProps };

// Default export for easier imports
export default R3FRenderer;
