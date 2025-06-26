/**
 * Three.js Renderer Hook
 * 
 * React hook for Three.js renderer integration with Zustand store,
 * including AST rendering, camera controls, and performance monitoring.
 */

import { useRef, useEffect, useCallback, useState } from 'react';
import * as THREE from 'three';
import type { ASTNode } from '@holistic-stack/openscad-parser';

import type { 
  UseRendererReturn, 
  Scene3DConfig, 
  CameraConfig, 
  Mesh3D, 
  RenderingMetrics,
  RenderingError 
} from '../types/renderer.types';
import {
  useAppStore,
  selectParsingAST,
  selectRenderingCamera,
  selectRenderingState,
  selectPerformanceMetrics
} from '../../store';
import { success, error, tryCatch } from '../../../shared/utils/functional/result';
import { measureTime } from '../../../shared/utils/performance/metrics';
import { renderASTNode } from '../services/primitive-renderer';
import { performCSGOperation, createCSGConfig } from '../services/csg-operations';

/**
 * Default camera configuration
 */
const DEFAULT_CAMERA: CameraConfig = {
  position: [10, 10, 10],
  target: [0, 0, 0],
  zoom: 1,
  fov: 75,
  near: 0.1,
  far: 1000,
  enableControls: true,
  enableAutoRotate: false,
  autoRotateSpeed: 1
};

/**
 * Default scene configuration
 */
const DEFAULT_CONFIG: Scene3DConfig = {
  enableShadows: true,
  enableAntialiasing: true,
  enableWebGL2: true,
  enableHardwareAcceleration: true,
  backgroundColor: '#1a1a1a',
  ambientLightIntensity: 0.4,
  directionalLightIntensity: 0.8,
  maxMeshes: 1000,
  maxTriangles: 100000
};

/**
 * Three.js renderer hook with Zustand store integration
 */
export const useThreeRenderer = (): UseRendererReturn => {
  // Refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  
  // State
  const [isInitialized, setIsInitialized] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [meshes, setMeshes] = useState<ReadonlyArray<Mesh3D>>([]);
  const [metrics, setMetrics] = useState<RenderingMetrics>({
    renderTime: 0,
    parseTime: 0,
    memoryUsage: 0,
    frameRate: 60,
    meshCount: 0,
    triangleCount: 0,
    vertexCount: 0,
    drawCalls: 0,
    textureMemory: 0,
    bufferMemory: 0
  });

  // Store selectors and actions
  const ast = useAppStore(selectParsingAST);
  const camera = useAppStore(selectRenderingCamera) || DEFAULT_CAMERA;
  const renderingState = useAppStore(selectRenderingState);
  const storeMetrics = useAppStore(selectPerformanceMetrics);
  const config = DEFAULT_CONFIG; // Use default config for now
  
  const updateStoreCamera = useAppStore((state) => state.updateCamera);
  const updateStoreMetrics = useAppStore((state) => state.updateMetrics);
  const renderFromAST = useAppStore((state) => state.renderFromAST);
  const markDirty = useAppStore((state) => state.markDirty);

  /**
   * Initialize Three.js scene, camera, and renderer
   */
  const initializeRenderer = useCallback(() => {
    const result = tryCatch(() => {
      // Create scene
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(config.backgroundColor);
      
      // Create camera
      const camera = new THREE.PerspectiveCamera(
        DEFAULT_CAMERA.fov,
        window.innerWidth / window.innerHeight,
        DEFAULT_CAMERA.near,
        DEFAULT_CAMERA.far
      );
      camera.position.set(...DEFAULT_CAMERA.position);
      camera.lookAt(...DEFAULT_CAMERA.target);
      
      // Create renderer
      const renderer = new THREE.WebGLRenderer({
        antialias: config.enableAntialiasing,
        alpha: true,
        powerPreference: config.enableHardwareAcceleration ? 'high-performance' : 'default'
      });
      
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setClearColor(config.backgroundColor);
      renderer.shadowMap.enabled = config.enableShadows;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.outputEncoding = THREE.sRGBEncoding;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      
      // Store references
      sceneRef.current = scene;
      cameraRef.current = camera;
      rendererRef.current = renderer;
      
      setIsInitialized(true);
      setError(null);
      
      console.log('[INIT][useThreeRenderer] Three.js renderer initialized');
      
      return { scene, camera, renderer };
    }, (err) => `Failed to initialize Three.js renderer: ${err instanceof Error ? err.message : String(err)}`);

    if (!result.success) {
      setError(result.error);
      console.error('[ERROR][useThreeRenderer]', result.error);
    }
  }, [config]);

  /**
   * Render AST nodes to Three.js meshes
   */
  const renderAST = useCallback(async (astNodes: ReadonlyArray<ASTNode>) => {
    if (!sceneRef.current || !isInitialized) {
      throw new Error('Renderer not initialized');
    }

    setIsRendering(true);
    setError(null);

    const { result: newMeshes, duration } = await measureTime(async () => {
      // Clear existing meshes
      meshes.forEach(meshWrapper => {
        sceneRef.current?.remove(meshWrapper.mesh);
        meshWrapper.dispose();
      });

      // Render new meshes
      const renderedMeshes: Mesh3D[] = [];
      
      for (let i = 0; i < astNodes.length; i++) {
        const node = astNodes[i];
        const meshResult = renderASTNode(node, i);
        
        if (meshResult.success) {
          sceneRef.current?.add(meshResult.data.mesh);
          renderedMeshes.push(meshResult.data);
        } else {
          console.error(`[ERROR][useThreeRenderer] Failed to render node ${i}:`, meshResult.error);
        }
      }

      return renderedMeshes;
    });

    setMeshes(newMeshes);
    setIsRendering(false);

    // Update performance metrics
    const newMetrics: RenderingMetrics = {
      renderTime: duration,
      parseTime: storeMetrics?.parseTime || 0,
      memoryUsage: 0, // Will be calculated separately
      frameRate: 60, // Will be updated by frame loop
      meshCount: newMeshes.length,
      triangleCount: newMeshes.reduce((sum, m) => sum + m.metadata.triangleCount, 0),
      vertexCount: newMeshes.reduce((sum, m) => sum + m.metadata.vertexCount, 0),
      drawCalls: newMeshes.length,
      textureMemory: 0,
      bufferMemory: newMeshes.length * 1024 // Rough estimate
    };

    setMetrics(newMetrics);
    updateStoreMetrics(newMetrics);
    markDirty();

    console.log(`[DEBUG][useThreeRenderer] Rendered ${newMeshes.length} meshes in ${duration}ms`);
  }, [meshes, isInitialized, storeMetrics, updateStoreMetrics, markDirty]);

  /**
   * Clear all meshes from scene
   */
  const clearScene = useCallback(() => {
    if (!sceneRef.current) return;

    meshes.forEach(meshWrapper => {
      sceneRef.current?.remove(meshWrapper.mesh);
      meshWrapper.dispose();
    });

    setMeshes([]);
    setMetrics(prev => ({ ...prev, meshCount: 0, triangleCount: 0, vertexCount: 0, drawCalls: 0 }));
    
    console.log('[DEBUG][useThreeRenderer] Scene cleared');
  }, [meshes]);

  /**
   * Update camera configuration
   */
  const updateCamera = useCallback((newCamera: CameraConfig) => {
    if (!cameraRef.current) return;

    // Safely handle camera position
    if (newCamera.position && Array.isArray(newCamera.position) && newCamera.position.length === 3) {
      cameraRef.current.position.set(newCamera.position[0], newCamera.position[1], newCamera.position[2]);
    }

    // Safely handle camera target
    if (newCamera.target && Array.isArray(newCamera.target) && newCamera.target.length === 3) {
      cameraRef.current.lookAt(newCamera.target[0], newCamera.target[1], newCamera.target[2]);
    }

    cameraRef.current.fov = newCamera.fov;
    cameraRef.current.near = newCamera.near;
    cameraRef.current.far = newCamera.far;
    cameraRef.current.updateProjectionMatrix();

    updateStoreCamera(newCamera);

    console.log('[DEBUG][useThreeRenderer] Camera updated');
  }, [updateStoreCamera]);

  /**
   * Reset camera to default position
   */
  const resetCamera = useCallback(() => {
    updateCamera(DEFAULT_CAMERA);
  }, [updateCamera]);

  /**
   * Take screenshot of current scene
   */
  const takeScreenshot = useCallback(async (): Promise<string> => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current) {
      throw new Error('Renderer not initialized');
    }

    // Render current frame
    rendererRef.current.render(sceneRef.current, cameraRef.current);
    
    // Get canvas data URL
    const dataURL = rendererRef.current.domElement.toDataURL('image/png');
    
    console.log('[DEBUG][useThreeRenderer] Screenshot captured');
    
    return dataURL;
  }, []);

  /**
   * Initialize renderer on mount
   */
  useEffect(() => {
    initializeRenderer();
    
    return () => {
      // Cleanup on unmount
      clearScene();
      
      if (rendererRef.current) {
        rendererRef.current.dispose();
        rendererRef.current = null;
      }
      
      sceneRef.current = null;
      cameraRef.current = null;
      setIsInitialized(false);
    };
  }, [initializeRenderer, clearScene]);

  /**
   * Render AST when it changes
   */
  useEffect(() => {
    if (isInitialized && ast.length > 0) {
      renderAST(ast).catch(err => {
        setError(`Failed to render AST: ${err instanceof Error ? err.message : String(err)}`);
      });
    } else if (isInitialized && ast.length === 0) {
      clearScene();
    }
  }, [ast, isInitialized, renderAST, clearScene]);

  /**
   * Update camera when store camera changes
   */
  useEffect(() => {
    if (isInitialized && camera) {
      updateCamera(camera);
    }
  }, [camera, isInitialized, updateCamera]);

  return {
    sceneRef,
    cameraRef,
    rendererRef,
    isInitialized,
    isRendering,
    error,
    metrics,
    meshes,
    actions: {
      renderAST,
      clearScene,
      updateCamera,
      resetCamera,
      takeScreenshot
    }
  };
};

export default useThreeRenderer;
