/**
 * Three.js Renderer Hook (Refactored with Zustand)
 *
 * Uses Zustand store for state management to eliminate useEffect infinite loops.
 * Provides stable references and actions for Three.js rendering.
 */

import { useCallback, useEffect, useMemo, useRef } from 'react';
import type * as THREE from 'three';

import type { CameraConfig } from '../../../shared/types/common.types.js';
import { tryCatch } from '../../../shared/utils/functional/result.js';
import type { ASTNode } from '../../openscad-parser/core/ast-types.js';
import { selectParsingAST, selectRenderingCamera, useAppStore } from '../../store/index.js';
import { useThreeRendererStore } from '../store/three-renderer.store.js';
import type { Scene3DConfig, UseRendererReturn } from '../types/renderer.types.js';
import { useThreeFrame } from './use-frame.js';

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
  autoRotateSpeed: 1,
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
  maxTriangles: 100000,
};

/**
 * Three.js renderer hook with Zustand store integration
 */
export const useThreeRenderer = (): UseRendererReturn => {
  // Zustand store state and actions
  const {
    scene,
    camera: threeCamera,
    renderer,
    isInitialized,
    isRendering,
    error,
    meshes,
    metrics,
    initializeRenderer: storeInitializeRenderer,
    renderAST: storeRenderAST,
    clearScene: storeClearScene,
    updateCamera: storeUpdateCamera,
    resetCamera: storeResetCamera,
    takeScreenshot: storeTakeScreenshot,
    setError: storeSetError,
    dispose: storeDispose,
  } = useThreeRendererStore();

  // Stable refs for Three.js objects (from Zustand store)
  const sceneRef = useRef<THREE.Scene | null>(scene);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(threeCamera);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(renderer);

  // Update refs when store values change
  sceneRef.current = scene;
  cameraRef.current = threeCamera;
  rendererRef.current = renderer;

  // App store selectors and actions
  const ast = useAppStore(selectParsingAST);
  const cameraConfig = useAppStore(selectRenderingCamera) ?? DEFAULT_CAMERA;
  const config = DEFAULT_CONFIG;

  const updateStoreCamera = useAppStore((state) => state.updateCamera);

  /**
   * Initialize Three.js renderer using Zustand store
   */
  const initializeRenderer = useCallback(
    (canvas?: HTMLCanvasElement) => {
      if (!canvas) {
        // Create a default canvas if none provided
        canvas = document.createElement('canvas');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }

      storeInitializeRenderer(canvas, config);
    },
    [storeInitializeRenderer, config]
  );

  /**
   * Render AST nodes using Zustand store (stable function)
   */
  const renderAST = useCallback(
    async (astNodes: ReadonlyArray<ASTNode>) => {
      await storeRenderAST(astNodes);
    },
    [storeRenderAST]
  );

  /**
   * Clear scene using Zustand store
   */
  const clearScene = useCallback(() => {
    storeClearScene();
  }, [storeClearScene]);

  /**
   * Update camera using Zustand store
   */
  const updateCamera = useCallback(
    (newCamera: CameraConfig) => {
      storeUpdateCamera(newCamera);
      updateStoreCamera(newCamera);
    },
    [storeUpdateCamera, updateStoreCamera]
  );

  /**
   * Reset camera using Zustand store
   */
  const resetCamera = useCallback(() => {
    storeResetCamera();
    updateStoreCamera(DEFAULT_CAMERA);
  }, [storeResetCamera, updateStoreCamera]);

  /**
   * Take screenshot using Zustand store
   */
  const takeScreenshot = useCallback(async (): Promise<string> => {
    return await storeTakeScreenshot();
  }, [storeTakeScreenshot]);

  /**
   * Initialize renderer on mount (no circular dependencies)
   */
  useEffect(() => {
    // Initialize with a default canvas if needed
    const canvas = document.createElement('canvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    initializeRenderer(canvas);

    return () => {
      // Cleanup using Zustand store
      storeDispose();
    };
  }, []); // Empty dependency array - only run once

  /**
   * Render AST when it changes (using useMemo for expensive calculations)
   */
  const processedAST = useMemo(() => {
    return ast.filter((node) => node != null); // Remove null/undefined nodes
  }, [ast]);

  /**
   * Effect to render AST when it changes (no circular dependencies)
   */
  useEffect(() => {
    if (isInitialized && processedAST.length > 0) {
      renderAST(processedAST).catch((err) => {
        storeSetError(`Failed to render AST: ${err instanceof Error ? err.message : String(err)}`);
      });
    } else if (isInitialized && processedAST.length === 0) {
      clearScene();
    }
  }, [isInitialized, processedAST, renderAST, clearScene, storeSetError]); // Only primitive values and stable functions

  /**
   * Update camera when store camera changes (no circular dependencies)
   */
  useEffect(() => {
    if (isInitialized && cameraConfig) {
      updateCamera(cameraConfig);
    }
  }, [cameraConfig, isInitialized, updateCamera]);

  /**
   * Use render loop for continuous updates (replaces complex useEffect patterns)
   */
  useThreeFrame(scene, threeCamera, renderer, (_state, delta) => {
    // Continuous render loop - no dependencies needed
    // This replaces useEffect-based rendering logic
    if (meshes.length > 0) {
      // Optional: Add mesh animations here
      meshes.forEach((meshWrapper) => {
        if (meshWrapper.mesh.rotation) {
          // Example: subtle rotation animation
          meshWrapper.mesh.rotation.y += delta * 0.1;
        }
      });
    }
  });

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
      takeScreenshot,
    },
  };
};

export default useThreeRenderer;
