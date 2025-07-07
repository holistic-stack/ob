/**
 * Zustand Store for Three.js Renderer State Management
 *
 * Replaces complex useEffect patterns with stable state management.
 * Eliminates circular dependencies and infinite loops.
 */

import * as THREE from 'three';
import { create } from 'zustand';
import { createLogger } from '../../../shared/services/logger.service.js';
// OperationId removed
import type { CameraConfig as SharedCameraConfig } from '../../../shared/types/common.types.js';
import type { ASTNode } from '../../openscad-parser/types/ast.types.js';
import { convertASTNodeToCSG } from '../services/ast-to-csg-converter/ast-to-csg-converter.js';
import type { Mesh3D, RenderingMetrics, Scene3DConfig } from '../types/renderer.types.js';

const logger = createLogger('ThreeRendererStore');

/**
 * Renderer configuration - compatible with Scene3DConfig
 */
type RendererConfig = Scene3DConfig | Record<string, unknown>;

/**
 * Convert shared CameraConfig to store-specific format
 */
const convertCameraConfig = (camera: SharedCameraConfig): StoreCameraConfig => ({
  position: {
    x: camera.position[0],
    y: camera.position[1],
    z: camera.position[2],
  },
  target: {
    x: camera.target[0],
    y: camera.target[1],
    z: camera.target[2],
  },
  fov: camera.fov,
});

/**
 * Store-specific camera configuration for internal Three.js operations
 */
interface StoreCameraConfig {
  position?: { x: number; y: number; z: number };
  target?: { x: number; y: number; z: number };
  fov?: number;
}

interface ThreeRendererState {
  // Three.js Objects (stable references)
  scene: THREE.Scene | null;
  camera: THREE.PerspectiveCamera | null;
  renderer: THREE.WebGLRenderer | null;

  // Rendering State
  isInitialized: boolean;
  isRendering: boolean;
  error: string | null;

  // Meshes and Metrics
  meshes: Mesh3D[];
  metrics: RenderingMetrics;

  // Actions
  initializeRenderer: (canvas: HTMLCanvasElement, config?: RendererConfig) => void;
  renderAST: (ast: ReadonlyArray<ASTNode>) => Promise<void>;
  clearScene: () => void;
  updateCamera: (config: StoreCameraConfig) => void;
  updateCameraFromShared: (config: SharedCameraConfig) => void;
  resetCamera: () => void;
  takeScreenshot: () => Promise<string>;
  updateMetrics: (newMetrics: Partial<RenderingMetrics>) => void;
  setError: (error: string | null) => void;
  dispose: () => void;
}

const initialMetrics: RenderingMetrics = {
  // PerformanceMetrics
  fps: 60,
  frameTime: 16.67, // 1000/60 fps
  renderTime: 0,
  memoryUsage: 0,
  triangleCount: 0,
  drawCalls: 0,
  // OperationMetrics
  executionTime: 0,
  cpuTime: 0,
  throughput: 0,
  errorRate: 0,
  cacheHitRate: 0,
  // RenderingMetrics specific
  meshCount: 0,
  vertexCount: 0,
  textureMemory: 0,
  bufferMemory: 0,
};

export const useThreeRendererStore = create<ThreeRendererState>((set, get) => ({
  // Initial State
  scene: null,
  camera: null,
  renderer: null,
  isInitialized: false,
  isRendering: false,
  error: null,
  meshes: [],
  metrics: initialMetrics,

  // Initialize Three.js renderer
  initializeRenderer: (canvas: HTMLCanvasElement, _config = {}) => {
    try {
      // Create Three.js objects
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x2c2c2c);

      const camera = new THREE.PerspectiveCamera(75, canvas.width / canvas.height, 0.1, 1000);
      camera.position.set(5, 5, 5);
      camera.lookAt(0, 0, 0);

      const renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
      });
      renderer.setSize(canvas.width, canvas.height);
      renderer.setClearColor(0x2c2c2c, 1);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;

      // Add lights
      const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
      scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(10, 10, 5);
      directionalLight.castShadow = true;
      scene.add(directionalLight);

      set({
        scene,
        camera,
        renderer,
        isInitialized: true,
        error: null,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('[ERROR] Failed to initialize renderer:', errorMessage);
      set({ error: errorMessage, isInitialized: false });
    }
  },

  // Render AST to meshes (stable function - no circular dependencies)
  renderAST: async (ast: ReadonlyArray<ASTNode>) => {
    const { scene, isInitialized } = get();

    if (!isInitialized || !scene) {
      logger.warn('[WARN] Renderer not initialized, skipping AST render');
      return;
    }

    if (ast.length === 0) {
      // Clear scene if AST is empty
      get().clearScene();
      return;
    }

    try {
      set({ isRendering: true, error: null });

      const newMeshes = await (async () => {
        // Clear existing meshes
        const currentMeshes = get().meshes;
        currentMeshes.forEach((meshWrapper) => {
          scene.remove(meshWrapper.mesh);
          meshWrapper.dispose();
        });

        // Render new meshes
        const renderedMeshes: Mesh3D[] = [];

        for (let i = 0; i < ast.length; i++) {
          const node = ast[i];
          if (node) {
            const result = await convertASTNodeToCSG(node, i);
            if (result.success && result.data) {
              renderedMeshes.push(result.data);
            }
          }
        }

        // Add meshes to scene
        renderedMeshes.forEach((meshWrapper) => {
          scene.add(meshWrapper.mesh);
        });

        return renderedMeshes;
      })();

      // Update metrics
      const newMetrics: RenderingMetrics = {
        ...get().metrics,
        meshCount: newMeshes.length,
        triangleCount: newMeshes.reduce((sum, m) => sum + (m.metadata.triangleCount ?? 0), 0),
        vertexCount: newMeshes.reduce((sum, m) => sum + (m.metadata.vertexCount ?? 0), 0),
        drawCalls: newMeshes.length,
        bufferMemory: newMeshes.length * 1024,
        errorRate: 0,
      };

      set({
        meshes: newMeshes,
        metrics: newMetrics,
        isRendering: false,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('[ERROR] Failed to render AST:', errorMessage);
      set({
        error: errorMessage,
        isRendering: false,
        metrics: { ...get().metrics, errorRate: 1 },
      });
    }
  },

  // Clear scene (stable function)
  clearScene: () => {
    const { scene, meshes } = get();

    if (!scene) return;

    // Remove and dispose meshes
    meshes.forEach((meshWrapper) => {
      scene.remove(meshWrapper.mesh);
      meshWrapper.dispose();
    });

    // Update state
    set({
      meshes: [],
      metrics: {
        ...get().metrics,
        meshCount: 0,
        triangleCount: 0,
        vertexCount: 0,
        drawCalls: 0,
      },
    });
  },

  // Update camera configuration
  updateCamera: (config: StoreCameraConfig) => {
    const { camera } = get();
    if (!camera) return;

    if (config.position) {
      camera.position.set(config.position.x, config.position.y, config.position.z);
    }
    if (config.target) {
      camera.lookAt(config.target.x, config.target.y, config.target.z);
    }
    if (config.fov) {
      camera.fov = config.fov;
      camera.updateProjectionMatrix();
    }
  },

  // Update camera from shared CameraConfig format
  updateCameraFromShared: (config: SharedCameraConfig) => {
    const storeConfig = convertCameraConfig(config);
    get().updateCamera(storeConfig);
  },

  // Reset camera to default position
  resetCamera: () => {
    const { camera } = get();
    if (!camera) return;

    camera.position.set(5, 5, 5);
    camera.lookAt(0, 0, 0);
    camera.fov = 75;
    camera.updateProjectionMatrix();
  },

  // Take screenshot
  takeScreenshot: async (): Promise<string> => {
    const { renderer } = get();
    if (!renderer) {
      throw new Error('Renderer not initialized');
    }

    return renderer.domElement.toDataURL('image/png');
  },

  // Update metrics
  updateMetrics: (newMetrics: Partial<RenderingMetrics>) => {
    set({
      metrics: { ...get().metrics, ...newMetrics },
    });
  },

  // Set error
  setError: (error: string | null) => {
    set({ error });
  },

  // Dispose resources
  dispose: () => {
    const { scene, renderer, meshes } = get();

    // Clear meshes
    meshes.forEach((meshWrapper) => {
      if (scene) scene.remove(meshWrapper.mesh);
      meshWrapper.dispose();
    });

    // Dispose renderer
    if (renderer) {
      renderer.dispose();
    }

    set({
      scene: null,
      camera: null,
      renderer: null,
      isInitialized: false,
      meshes: [],
      error: null,
    });
  },
}));
