/**
 * @file Zustand Store Slice: BabylonJS Rendering
 *
 * Manages BabylonJS rendering state, integrating with BabylonJS services
 * for engine management, scene rendering, and advanced features.
 */

import type { Scene } from '@babylonjs/core';
import type { StateCreator } from 'zustand';
import { createLogger } from '../../../shared/services/logger.service';
import type { CameraConfig } from '../../../shared/types/common.types';
import type { Result } from '../../../shared/types/result.types';
import { tryCatchAsync } from '../../../shared/utils/functional/result';
import { ASTBridgeConverter } from '../../babylon-renderer/services/ast-bridge-converter';
import type {
  BabylonEngineState,
  CSG2State,
  IBLShadowState,
  InspectorState,
  MaterialState,
  ParticleSystemState,
  RenderGraphState,
} from '../../babylon-renderer/services';
import {
  BabylonCSG2Service,
  BabylonEngineService,
  BabylonIBLShadowsService,
  BabylonInspectorService,
  BabylonMaterialService,
  BabylonParticleService,
  BabylonRenderGraphService,
  InspectorTab,
} from '../../babylon-renderer/services';
import type { ASTNode } from '../../openscad-parser/core/ast-types';
import { DEFAULT_CAMERA } from '../app-store';

const logger = createLogger('BabylonRenderingSlice');

/**
 * BabylonJS rendering state
 */
export interface BabylonRenderingState {
  readonly engine: BabylonEngineState;
  readonly inspector: InspectorState;
  readonly csg: CSG2State;
  readonly particles: ParticleSystemState[];
  readonly iblShadows: IBLShadowState;
  readonly materials: readonly MaterialState[];
  readonly renderGraphs: readonly RenderGraphState[];
  readonly meshes: readonly unknown[]; // BabylonJS mesh type
  readonly isRendering: boolean;
  readonly renderErrors: readonly BabylonRenderingError[];
  readonly scene: Scene | null; // Reference to the BabylonJS scene
  readonly lastRendered: Date | null;
  readonly renderTime: number;
  readonly performanceMetrics: BabylonPerformanceMetrics;
  readonly camera: CameraConfig;
}

/**
 * BabylonJS rendering error
 */
export interface BabylonRenderingError {
  readonly code: string;
  readonly message: string;
  readonly timestamp: Date;
  readonly service: string;
}

/**
 * BabylonJS performance metrics
 */
export interface BabylonPerformanceMetrics {
  readonly fps: number;
  readonly deltaTime: number;
  readonly renderTime: number;
  readonly drawCalls: number;
  readonly triangleCount: number;
  readonly memoryUsage: number;
  readonly gpuMemoryUsage: number;
}

/**
 * BabylonJS rendering actions
 */
export interface BabylonRenderingActions {
  // Engine management
  readonly initializeEngine: (
    canvas: HTMLCanvasElement
  ) => Promise<Result<void, BabylonRenderingError>>;
  readonly disposeEngine: () => Promise<Result<void, BabylonRenderingError>>;
  readonly getEngineState: () => BabylonEngineState;

  // Inspector management
  readonly showInspector: () => Promise<Result<void, BabylonRenderingError>>;
  readonly hideInspector: () => Result<void, BabylonRenderingError>;
  readonly getInspectorState: () => InspectorState;

  // CSG operations
  readonly performCSGOperation: (
    operation: string,
    meshes: unknown[]
  ) => Promise<Result<unknown, BabylonRenderingError>>;
  readonly getCSGState: () => CSG2State;

  // Particle systems
  readonly createParticleSystem: (config: unknown) => Result<string, BabylonRenderingError>;
  readonly updateParticleSystem: (
    id: string,
    config: unknown
  ) => Result<void, BabylonRenderingError>;
  readonly removeParticleSystem: (id: string) => Result<void, BabylonRenderingError>;

  // IBL shadows
  readonly enableIBLShadows: (config: unknown) => Result<void, BabylonRenderingError>;
  readonly disableIBLShadows: () => Result<void, BabylonRenderingError>;

  // Materials
  readonly createMaterial: (config: unknown) => Promise<Result<string, BabylonRenderingError>>;
  readonly applyMaterial: (
    materialId: string,
    meshId: string
  ) => Result<void, BabylonRenderingError>;
  readonly removeMaterial: (materialId: string) => Result<void, BabylonRenderingError>;

  // Render graphs
  readonly createRenderGraph: (config: unknown) => Result<string, BabylonRenderingError>;
  readonly buildRenderGraph: (graphId: string) => Result<void, BabylonRenderingError>;
  readonly removeRenderGraph: (graphId: string) => Result<void, BabylonRenderingError>;

  // Scene management
  readonly setScene: (scene: Scene | null) => void;

  // Rendering
  readonly renderAST: (ast: readonly ASTNode[]) => Promise<Result<void, BabylonRenderingError>>;
  readonly updateMeshes: (meshes: readonly unknown[]) => void;
  readonly clearScene: () => void;
  readonly updatePerformanceMetrics: () => void;

  // Error management
  readonly addRenderError: (error: { type: string; message: string }) => void;
  readonly clearRenderErrors: () => void;

  // Camera management
  readonly updateCamera: (camera: Partial<CameraConfig>) => void;
  readonly resetCamera: () => void;
}

/**
 * Initial BabylonJS rendering state
 */
export const createInitialBabylonRenderingState = (): BabylonRenderingState => ({
  engine: {
    isInitialized: false,
    isDisposed: false,
    isWebGPU: false,
    engine: null,
    canvas: null,
    fps: 0,
    deltaTime: 0,
    renderTime: 0,
    performanceMetrics: {
      fps: 0,
      deltaTime: 0,
      renderTime: 0,
      drawCalls: 0,
      triangleCount: 0,
      memoryUsage: 0,
      gpuMemoryUsage: 0,
    },
    error: null,
    lastUpdated: new Date(),
  },
  inspector: {
    isVisible: false,
    isEmbedded: false,
    currentTab: InspectorTab.SCENE,
    scene: null,
    lastUpdated: new Date(),
  },
  csg: {
    isEnabled: true,
    operations: [],
    lastOperationTime: 0,
    error: null,
    lastUpdated: new Date(),
  },
  particles: [],
  iblShadows: {
    isEnabled: false,
    environmentTexture: null,
    affectedMeshes: [],
    shadowIntensity: 1.0,
    environmentIntensity: 1.0,
    lastUpdated: new Date(),
  },
  materials: [],
  renderGraphs: [],
  meshes: [],
  isRendering: false,
  renderErrors: [],
  lastRendered: null,
  renderTime: 0,
  scene: null,
  performanceMetrics: {
    fps: 0,
    deltaTime: 0,
    renderTime: 0,
    drawCalls: 0,
    triangleCount: 0,
    memoryUsage: 0,
    gpuMemoryUsage: 0,
  },
  camera: DEFAULT_CAMERA,
});

/**
 * Create BabylonJS rendering slice
 */
export const createBabylonRenderingSlice = (
  set: Parameters<StateCreator<any, [['zustand/immer', never]], [], any>>[0],
  _get: Parameters<StateCreator<any, [['zustand/immer', never]], [], any>>[1]
): BabylonRenderingActions => {
  // Service instances
  let engineService: BabylonEngineService | null = null;
  let inspectorService: BabylonInspectorService | null = null;
  let csgService: BabylonCSG2Service | null = null;
  let particleService: BabylonParticleService | null = null;
  let iblShadowsService: BabylonIBLShadowsService | null = null;
  let materialService: BabylonMaterialService | null = null;
  let renderGraphService: BabylonRenderGraphService | null = null;

  return {
    // Engine management
    initializeEngine: async (canvas: HTMLCanvasElement) => {
      logger.debug('[DEBUG][BabylonRenderingSlice] Initializing BabylonJS engine...');

      return tryCatchAsync(
        async () => {
          if (!engineService) {
            engineService = new BabylonEngineService();
          }

          const result = await engineService.init({
            canvas,
            config: {
              antialias: true,
              adaptToDeviceRatio: true,
              preserveDrawingBuffer: true,
              stencil: true,
              enableWebGPU: true,
              enableOfflineSupport: false,
              enableInspector: false,
              powerPreference: 'high-performance',
              failIfMajorPerformanceCaveat: false,
            },
          });
          if (!result.success) {
            throw {
              code: result.error.code,
              message: result.error.message,
              timestamp: new Date(),
              service: 'engine',
            };
          }

          // Update state
          set((state: any) => {
            state.babylonRendering.engine = engineService?.getState();
          });

          logger.debug('[DEBUG][BabylonRenderingSlice] BabylonJS engine initialized successfully');
        },
        (error) => ({
          code: 'ENGINE_INIT_FAILED',
          message: `Failed to initialize BabylonJS engine: ${error}`,
          timestamp: new Date(),
          service: 'engine',
        })
      );
    },

    disposeEngine: async () => {
      logger.debug('[DEBUG][BabylonRenderingSlice] Disposing BabylonJS engine...');

      return tryCatchAsync(
        async () => {
          if (engineService) {
            const result = await engineService.dispose();
            if (!result.success) {
              throw {
                code: result.error.code,
                message: result.error.message,
                timestamp: new Date(),
                service: 'engine',
              };
            }
            engineService = null;
          }

          // Reset state
          set((state: any) => {
            state.babylonRendering.engine = createInitialBabylonRenderingState().engine;
          });

          logger.debug('[DEBUG][BabylonRenderingSlice] BabylonJS engine disposed successfully');
        },
        (error) => ({
          code: 'ENGINE_DISPOSE_FAILED',
          message: `Failed to dispose BabylonJS engine: ${error}`,
          timestamp: new Date(),
          service: 'engine',
        })
      );
    },

    getEngineState: () => {
      return engineService?.getState() ?? createInitialBabylonRenderingState().engine;
    },

    // Inspector management
    showInspector: async () => {
      logger.debug('[DEBUG][BabylonRenderingSlice] Showing BabylonJS inspector...');

      if (!inspectorService) {
        inspectorService = new BabylonInspectorService();
      }

      const scene = engineService?.getState().engine?.scenes?.[0];
      if (!scene) {
        return {
          success: false,
          error: {
            code: 'SCENE_NOT_AVAILABLE',
            message: 'Scene not available for inspector',
            timestamp: new Date(),
            service: 'inspector',
          },
        };
      }

      const result = await inspectorService.show(scene);
      if (!result.success) {
        return {
          success: false,
          error: {
            code: result.error.code,
            message: result.error.message,
            timestamp: new Date(),
            service: 'inspector',
          },
        };
      }

      // Update state
      set((state: any) => {
        state.babylonRendering.inspector = inspectorService?.getState();
      });

      return { success: true, data: undefined };
    },

    hideInspector: () => {
      logger.debug('[DEBUG][BabylonRenderingSlice] Hiding BabylonJS inspector...');

      if (!inspectorService) {
        return { success: true, data: undefined };
      }

      const result = inspectorService.hide();
      if (!result.success) {
        return {
          success: false,
          error: {
            code: result.error.code,
            message: result.error.message,
            timestamp: new Date(),
            service: 'inspector',
          },
        };
      }

      // Update state
      set((state: any) => {
        state.babylonRendering.inspector = inspectorService?.getState();
      });

      return { success: true, data: undefined };
    },

    getInspectorState: () => {
      return inspectorService?.getState() ?? createInitialBabylonRenderingState().inspector;
    },

    // CSG operations
    performCSGOperation: async (operation: string, _meshes: unknown[]) => {
      logger.debug(`[DEBUG][BabylonRenderingSlice] Performing CSG operation: ${operation}`);

      return tryCatchAsync(
        async () => {
          if (!csgService) {
            csgService = new BabylonCSG2Service();
            const scene = engineService?.getState().engine?.scenes?.[0];
            if (scene) {
              csgService.init(scene);
            }
          }

          // Perform CSG operation based on type
          // This would be implemented based on the specific operation
          // For now, return a placeholder result
          const result = { success: true, data: null };

          // Update state
          set((state: any) => {
            // Update CSG state - service doesn't have getState method
            state.babylonRendering.csg = {
              isEnabled: true,
              operations: [],
              lastOperationTime: 0,
              error: null,
              lastUpdated: new Date(),
            };
          });

          return result.data;
        },
        (error) => ({
          code: 'CSG_OPERATION_FAILED',
          message: `CSG operation failed: ${error}`,
          timestamp: new Date(),
          service: 'csg',
        })
      );
    },

    getCSGState: () => {
      return createInitialBabylonRenderingState().csg;
    },

    // Particle systems
    createParticleSystem: (_config: unknown) => {
      logger.debug('[DEBUG][BabylonRenderingSlice] Creating particle system...');

      if (!particleService) {
        particleService = new BabylonParticleService();
        const scene = engineService?.getState().engine?.scenes?.[0];
        if (scene) {
          particleService.init(scene);
        }
      }

      // Implementation would create particle system with config
      // For now, return a placeholder
      const systemId = `particle-${Date.now()}`;

      set((state: any) => {
        // Update particles state
        state.babylonRendering.particles = particleService?.getAllParticleSystemStates();
      });

      return { success: true, data: systemId };
    },

    updateParticleSystem: (id: string, _config: unknown) => {
      logger.debug(`[DEBUG][BabylonRenderingSlice] Updating particle system: ${id}`);

      if (!particleService) {
        return {
          success: false,
          error: {
            code: 'PARTICLE_SERVICE_NOT_INITIALIZED',
            message: 'Particle service not initialized',
            timestamp: new Date(),
            service: 'particles',
          },
        };
      }

      // Implementation would update particle system
      set((state: any) => {
        state.babylonRendering.particles = particleService?.getAllParticleSystemStates();
      });

      return { success: true, data: undefined };
    },

    removeParticleSystem: (id: string) => {
      logger.debug(`[DEBUG][BabylonRenderingSlice] Removing particle system: ${id}`);

      if (!particleService) {
        return { success: true, data: undefined };
      }

      const result = particleService.removeParticleSystem(id);
      if (!result.success) {
        return {
          success: false,
          error: {
            code: result.error.code,
            message: result.error.message,
            timestamp: new Date(),
            service: 'particles',
          },
        };
      }

      set((state: any) => {
        state.babylonRendering.particles = particleService?.getAllParticleSystemStates();
      });

      return { success: true, data: undefined };
    },

    // IBL shadows
    enableIBLShadows: (_config: unknown) => {
      logger.debug('[DEBUG][BabylonRenderingSlice] Enabling IBL shadows...');

      if (!iblShadowsService) {
        iblShadowsService = new BabylonIBLShadowsService();
        const scene = engineService?.getState().engine?.scenes?.[0];
        if (scene) {
          iblShadowsService.init(scene);
        }
      }

      // Implementation would enable IBL shadows with config
      set((state: any) => {
        state.babylonRendering.iblShadows = iblShadowsService?.getState();
      });

      return { success: true, data: undefined };
    },

    disableIBLShadows: () => {
      logger.debug('[DEBUG][BabylonRenderingSlice] Disabling IBL shadows...');

      if (!iblShadowsService) {
        return { success: true, data: undefined };
      }

      // Implementation would disable IBL shadows
      set((state: any) => {
        state.babylonRendering.iblShadows = iblShadowsService?.getState();
      });

      return { success: true, data: undefined };
    },

    // Materials
    createMaterial: async (_config: unknown) => {
      logger.debug('[DEBUG][BabylonRenderingSlice] Creating material...');

      return tryCatchAsync(
        async () => {
          if (!materialService) {
            materialService = new BabylonMaterialService();
            const scene = engineService?.getState().engine?.scenes?.[0];
            if (scene) {
              materialService.init(scene);
            }
          }

          // Implementation would create material with config
          const materialId = `material-${Date.now()}`;

          set((state: any) => {
            state.babylonRendering.materials = materialService?.getAllMaterialStates();
          });

          return materialId;
        },
        (error) => ({
          code: 'MATERIAL_CREATION_FAILED',
          message: `Material creation failed: ${error}`,
          timestamp: new Date(),
          service: 'materials',
        })
      );
    },

    applyMaterial: (materialId: string, meshId: string) => {
      logger.debug(
        `[DEBUG][BabylonRenderingSlice] Applying material ${materialId} to mesh ${meshId}`
      );

      if (!materialService) {
        return {
          success: false,
          error: {
            code: 'MATERIAL_SERVICE_NOT_INITIALIZED',
            message: 'Material service not initialized',
            timestamp: new Date(),
            service: 'materials',
          },
        };
      }

      // Implementation would apply material to mesh
      return { success: true, data: undefined };
    },

    removeMaterial: (materialId: string) => {
      logger.debug(`[DEBUG][BabylonRenderingSlice] Removing material: ${materialId}`);

      if (!materialService) {
        return { success: true, data: undefined };
      }

      const result = materialService.removeMaterial(materialId);
      if (!result.success) {
        return {
          success: false,
          error: {
            code: result.error.code,
            message: result.error.message,
            timestamp: new Date(),
            service: 'materials',
          },
        };
      }

      set((state: any) => {
        state.babylonRendering.materials = materialService?.getAllMaterialStates();
      });

      return { success: true, data: undefined };
    },

    // Render graphs
    createRenderGraph: (_config: unknown) => {
      logger.debug('[DEBUG][BabylonRenderingSlice] Creating render graph...');

      if (!renderGraphService) {
        renderGraphService = new BabylonRenderGraphService();
        const scene = engineService?.getState().engine?.scenes?.[0];
        if (scene) {
          renderGraphService.init(scene);
        }
      }

      // Implementation would create render graph with config
      const graphId = `graph-${Date.now()}`;

      set((state: any) => {
        state.babylonRendering.renderGraphs = renderGraphService?.getAllRenderGraphStates();
      });

      return { success: true, data: graphId };
    },

    buildRenderGraph: (graphId: string) => {
      logger.debug(`[DEBUG][BabylonRenderingSlice] Building render graph: ${graphId}`);

      if (!renderGraphService) {
        return {
          success: false,
          error: {
            code: 'RENDER_GRAPH_SERVICE_NOT_INITIALIZED',
            message: 'Render graph service not initialized',
            timestamp: new Date(),
            service: 'renderGraphs',
          },
        };
      }

      const result = renderGraphService.buildRenderGraph(graphId);
      if (!result.success) {
        return {
          success: false,
          error: {
            code: result.error.code,
            message: result.error.message,
            timestamp: new Date(),
            service: 'renderGraphs',
          },
        };
      }

      set((state: any) => {
        state.babylonRendering.renderGraphs = renderGraphService?.getAllRenderGraphStates();
      });

      return { success: true, data: undefined };
    },

    removeRenderGraph: (graphId: string) => {
      logger.debug(`[DEBUG][BabylonRenderingSlice] Removing render graph: ${graphId}`);

      if (!renderGraphService) {
        return { success: true, data: undefined };
      }

      const result = renderGraphService.removeRenderGraph(graphId);
      if (!result.success) {
        return {
          success: false,
          error: {
            code: result.error.code,
            message: result.error.message,
            timestamp: new Date(),
            service: 'renderGraphs',
          },
        };
      }

      set((state: any) => {
        state.babylonRendering.renderGraphs = renderGraphService?.getAllRenderGraphStates();
      });

      return { success: true, data: undefined };
    },

    // Scene management
    setScene: (scene: Scene | null) => {
      set((state: any) => {
        state.babylonRendering.scene = scene;
      });
      logger.debug('[DEBUG][BabylonRenderingSlice] Scene reference updated');
    },

    // Rendering
    renderAST: async (ast: readonly ASTNode[]) => {
      console.log(`[DEBUG][BabylonRenderingSlice] renderAST called with ${ast.length} nodes`);
      logger.debug(`[DEBUG][BabylonRenderingSlice] renderAST called with ${ast.length} nodes`);

      const currentState = _get();
      const scene = currentState.babylonRendering.scene;
      logger.debug(`[DEBUG][BabylonRenderingSlice] Scene from state: ${scene ? 'exists' : 'null'}`);

      logger.debug(`[DEBUG][BabylonRenderingSlice] Scene available: ${scene ? 'YES' : 'NO'}`);
      logger.debug(`[DEBUG][BabylonRenderingSlice] Current rendering state: ${currentState.babylonRendering.isRendering ? 'RENDERING' : 'IDLE'}`);
      logger.debug(`[DEBUG][BabylonRenderingSlice] AST nodes: ${ast.map(node => node.type).join(', ')}`);

      if (ast.length > 0 && ast[0]) {
        const firstNode = ast[0];
        logger.debug(`[DEBUG][BabylonRenderingSlice] First AST node details:`, {
          type: firstNode.type,
          hasChildren: 'children' in firstNode && Array.isArray(firstNode.children),
          childCount: 'children' in firstNode && Array.isArray(firstNode.children) ? firstNode.children.length : 0
        });
      }

      if (!scene) {
        const error = {
          code: 'SCENE_NOT_AVAILABLE' as const,
          message: 'BabylonJS scene not available for rendering',
          timestamp: new Date(),
          service: 'rendering' as const,
        };

        set((state: any) => {
          state.babylonRendering.renderErrors = [
            ...state.babylonRendering.renderErrors,
            error,
          ];
        });

        return { success: false, error };
      }

      return tryCatchAsync(
        async () => {
          set((state: any) => {
            state.babylonRendering.isRendering = true;
            state.babylonRendering.renderErrors = []; // Clear previous errors
          });

          const startTime = performance.now();

          // Clear existing meshes
          scene.meshes.forEach((mesh: any) => {
            if (mesh.name !== 'camera' && mesh.name !== 'light') {
              mesh.dispose();
            }
          });

          // Convert AST to BabylonJS meshes using the bridge converter
          logger.debug(`[DEBUG][BabylonRenderingSlice] Converting AST with ${ast.length} nodes to BabylonJS nodes...`);
          const bridgeConverter = new ASTBridgeConverter();
          await bridgeConverter.initialize(scene);

          logger.debug(`[DEBUG][BabylonRenderingSlice] About to call bridgeConverter.convertAST with ${ast.length} AST nodes`);
          const conversionResult = await bridgeConverter.convertAST(ast);
          logger.debug(`[DEBUG][BabylonRenderingSlice] convertAST completed, success: ${conversionResult.success}`);

          if (!conversionResult.success) {
            logger.error(`[ERROR][BabylonRenderingSlice] AST conversion failed: ${conversionResult.error.message}`);
            throw new Error(`AST conversion failed: ${conversionResult.error.message}`);
          }

          const babylonNodes = conversionResult.data;
          logger.debug(`[DEBUG][BabylonRenderingSlice] AST conversion successful - created ${babylonNodes.length} BabylonJS nodes`);
          const renderTime = performance.now() - startTime;

          // CRITICAL FIX: Generate actual BabylonJS meshes from BabylonJSNode objects
          // The ASTBridgeConverter returns BabylonJSNode objects, not actual meshes
          const meshes: any[] = [];
          for (const babylonNode of babylonNodes) {
            const meshResult = await babylonNode.generateMesh();
            if (meshResult.success) {
              const mesh = meshResult.data;
              meshes.push(mesh);

              // CRITICAL: Ensure mesh is part of the scene
              // In BabylonJS, meshes should be automatically added to scene when created with scene parameter
              // But let's verify and log the scene association
              if (mesh.getScene() === scene) {
                logger.debug(`[DEBUG][BabylonRenderingSlice] ✅ Mesh '${mesh.name}' is correctly associated with scene`);
              } else {
                logger.warn(`[WARN][BabylonRenderingSlice] ⚠️ Mesh '${mesh.name}' is NOT associated with scene - fixing...`);
                // Force association if needed (though this shouldn't be necessary)
                if (scene && typeof scene.addMesh === 'function') {
                  scene.addMesh(mesh);
                }
              }

              logger.debug(`[DEBUG][BabylonRenderingSlice] Generated mesh '${mesh.name}' from BabylonJSNode`);
            } else {
              logger.error(`[ERROR][BabylonRenderingSlice] Failed to generate mesh: ${meshResult.error.message}`);
            }
          }

          // Log scene state after mesh generation
          logger.debug(`[DEBUG][BabylonRenderingSlice] Scene now has ${scene.meshes.length} meshes total`);

          set((state: any) => {
            state.babylonRendering.meshes = meshes;
            state.babylonRendering.isRendering = false;
            state.babylonRendering.lastRendered = new Date();
            state.babylonRendering.renderTime = renderTime;
          });

          logger.debug(
            `[DEBUG][BabylonRenderingSlice] AST rendered successfully in ${renderTime.toFixed(2)}ms with ${meshes.length} meshes added to scene`
          );
        },
        (error) => {
          set((state: any) => {
            state.babylonRendering.isRendering = false;
            state.babylonRendering.renderErrors = [
              ...state.babylonRendering.renderErrors,
              {
                code: 'RENDER_FAILED',
                message: `AST rendering failed: ${error}`,
                timestamp: new Date(),
                service: 'rendering',
              },
            ];
          });

          return {
            code: 'RENDER_FAILED',
            message: `AST rendering failed: ${error}`,
            timestamp: new Date(),
            service: 'rendering',
          };
        }
      );
    },

    updateMeshes: (meshes: readonly unknown[]) => {
      set((state: any) => {
        state.babylonRendering.meshes = [...meshes];
        state.babylonRendering.lastRendered = new Date();
      });
    },

    clearScene: () => {
      logger.debug('[DEBUG][BabylonRenderingSlice] Clearing scene...');

      set((state: any) => {
        // Dispose of existing meshes if they exist
        if (state.babylonRendering?.meshes && Array.isArray(state.babylonRendering.meshes)) {
          state.babylonRendering.meshes.forEach((mesh: any) => {
            if (mesh && typeof mesh.dispose === 'function') {
              mesh.dispose();
            }
          });
        }

        // Ensure babylonRendering state exists
        if (!state.babylonRendering) {
          state.babylonRendering = createInitialBabylonRenderingState();
        } else {
          state.babylonRendering.meshes = [];
          state.babylonRendering.renderErrors = [];
          state.babylonRendering.lastRendered = null;
        }
      });
    },

    updatePerformanceMetrics: () => {
      if (engineService) {
        const engineState = engineService.getState();
        set((state: any) => {
          state.babylonRendering.performanceMetrics = engineState.performanceMetrics;
        });
      }
    },

    // Error management
    addRenderError: (error: { type: string; message: string }) => {
      set((state: any) => {
        state.babylonRendering.renderErrors = [
          ...state.babylonRendering.renderErrors,
          {
            code: error.type,
            message: error.message,
            timestamp: new Date(),
            service: 'rendering',
          },
        ];
      });
    },

    clearRenderErrors: () => {
      set((state: any) => {
        state.babylonRendering.renderErrors = [];
      });
    },

    // Camera management
    updateCamera: (camera: Partial<CameraConfig>) => {
      set((state: any) => {
        state.babylonRendering.camera = {
          ...state.babylonRendering.camera,
          ...camera,
        };
      });
    },

    resetCamera: () => {
      set((state: any) => {
        state.babylonRendering.camera = createInitialBabylonRenderingState().camera;
      });
    },
  };
};
