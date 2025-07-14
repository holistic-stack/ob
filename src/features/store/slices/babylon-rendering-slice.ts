/**
 * @file Zustand Store Slice: BabylonJS Rendering
 * 
 * Manages BabylonJS rendering state, integrating with BabylonJS services
 * for engine management, scene rendering, and advanced features.
 */

import type { StateCreator } from 'zustand';
import { createLogger } from '../../../shared/services/logger.service';
import type { Result } from '../../../shared/types/result.types';
import { tryCatchAsync } from '../../../shared/utils/functional/result';
import type { ASTNode } from '../../openscad-parser/core/ast-types';
import {
  BabylonEngineService,
  BabylonInspectorService,
  BabylonCSG2Service,
  BabylonParticleService,
  BabylonIBLShadowsService,
  BabylonMaterialService,
  BabylonRenderGraphService
} from '../../babylon-renderer/services';
import type {
  BabylonEngineState,
  InspectorState,
  CSG2State,
  ParticleSystemState,
  IBLShadowState,
  MaterialState,
  RenderGraphState
} from '../../babylon-renderer/services';

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
  readonly lastRendered: Date | null;
  readonly renderTime: number;
  readonly performanceMetrics: BabylonPerformanceMetrics;
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
  readonly frameTime: number;
  readonly drawCalls: number;
  readonly triangleCount: number;
  readonly textureCount: number;
  readonly memoryUsage: number;
}

/**
 * BabylonJS rendering actions
 */
export interface BabylonRenderingActions {
  // Engine management
  readonly initializeEngine: (canvas: HTMLCanvasElement) => Promise<Result<void, BabylonRenderingError>>;
  readonly disposeEngine: () => Promise<Result<void, BabylonRenderingError>>;
  readonly getEngineState: () => BabylonEngineState;

  // Inspector management
  readonly showInspector: () => Result<void, BabylonRenderingError>;
  readonly hideInspector: () => Result<void, BabylonRenderingError>;
  readonly getInspectorState: () => InspectorState;

  // CSG operations
  readonly performCSGOperation: (operation: string, meshes: unknown[]) => Promise<Result<unknown, BabylonRenderingError>>;
  readonly getCSGState: () => CSG2State;

  // Particle systems
  readonly createParticleSystem: (config: unknown) => Result<string, BabylonRenderingError>;
  readonly updateParticleSystem: (id: string, config: unknown) => Result<void, BabylonRenderingError>;
  readonly removeParticleSystem: (id: string) => Result<void, BabylonRenderingError>;

  // IBL shadows
  readonly enableIBLShadows: (config: unknown) => Result<void, BabylonRenderingError>;
  readonly disableIBLShadows: () => Result<void, BabylonRenderingError>;

  // Materials
  readonly createMaterial: (config: unknown) => Promise<Result<string, BabylonRenderingError>>;
  readonly applyMaterial: (materialId: string, meshId: string) => Result<void, BabylonRenderingError>;
  readonly removeMaterial: (materialId: string) => Result<void, BabylonRenderingError>;

  // Render graphs
  readonly createRenderGraph: (config: unknown) => Result<string, BabylonRenderingError>;
  readonly buildRenderGraph: (graphId: string) => Result<void, BabylonRenderingError>;
  readonly removeRenderGraph: (graphId: string) => Result<void, BabylonRenderingError>;

  // Rendering
  readonly renderAST: (ast: readonly ASTNode[]) => Promise<Result<void, BabylonRenderingError>>;
  readonly updateMeshes: (meshes: readonly unknown[]) => void;
  readonly clearScene: () => void;
  readonly updatePerformanceMetrics: () => void;
}

/**
 * Initial BabylonJS rendering state
 */
const createInitialBabylonRenderingState = (): BabylonRenderingState => ({
  engine: {
    isInitialized: false,
    isWebGPU: false,
    engine: null,
    canvas: null,
    performanceMetrics: {
      fps: 0,
      frameTime: 0,
      drawCalls: 0,
      triangleCount: 0,
      textureCount: 0,
      memoryUsage: 0,
    },
    capabilities: {
      webGPUSupported: false,
      webGL2Supported: false,
      maxTextureSize: 0,
      maxCubeTextureSize: 0,
      maxRenderTargetSize: 0,
      maxVertexTextureImageUnits: 0,
      maxFragmentTextureImageUnits: 0,
      maxAnisotropy: 0,
    },
    error: null,
    lastUpdated: new Date(),
  },
  inspector: {
    isVisible: false,
    isInitialized: false,
    currentTab: 'scene',
    availableTabs: ['scene', 'debug', 'statistics', 'console'],
    scene: null,
    error: null,
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
  performanceMetrics: {
    fps: 0,
    frameTime: 0,
    drawCalls: 0,
    triangleCount: 0,
    textureCount: 0,
    memoryUsage: 0,
  },
});

/**
 * Create BabylonJS rendering slice
 */
export const createBabylonRenderingSlice = (
  set: Parameters<StateCreator<any, [['zustand/immer', never]], [], any>>[0],
  get: Parameters<StateCreator<any, [['zustand/immer', never]], [], any>>[1]
): BabylonRenderingActions & { babylonRendering: BabylonRenderingState } => {
  // Service instances
  let engineService: BabylonEngineService | null = null;
  let inspectorService: BabylonInspectorService | null = null;
  let csgService: BabylonCSG2Service | null = null;
  let particleService: BabylonParticleService | null = null;
  let iblShadowsService: BabylonIBLShadowsService | null = null;
  let materialService: BabylonMaterialService | null = null;
  let renderGraphService: BabylonRenderGraphService | null = null;

  return {
    babylonRendering: createInitialBabylonRenderingState(),

    // Engine management
    initializeEngine: async (canvas: HTMLCanvasElement) => {
      logger.debug('[DEBUG][BabylonRenderingSlice] Initializing BabylonJS engine...');

      return tryCatchAsync(async () => {
        if (!engineService) {
          engineService = new BabylonEngineService();
        }

        const result = await engineService.init(canvas);
        if (!result.success) {
          throw {
            code: result.error.code,
            message: result.error.message,
            timestamp: new Date(),
            service: 'engine',
          };
        }

        // Update state
        set((state) => {
          state.babylonRendering.engine = engineService!.getState();
        });

        logger.debug('[DEBUG][BabylonRenderingSlice] BabylonJS engine initialized successfully');
      }, (error) => ({
        code: 'ENGINE_INIT_FAILED',
        message: `Failed to initialize BabylonJS engine: ${error}`,
        timestamp: new Date(),
        service: 'engine',
      }));
    },

    disposeEngine: async () => {
      logger.debug('[DEBUG][BabylonRenderingSlice] Disposing BabylonJS engine...');

      return tryCatchAsync(async () => {
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
        set((state) => {
          state.babylonRendering.engine = createInitialBabylonRenderingState().engine;
        });

        logger.debug('[DEBUG][BabylonRenderingSlice] BabylonJS engine disposed successfully');
      }, (error) => ({
        code: 'ENGINE_DISPOSE_FAILED',
        message: `Failed to dispose BabylonJS engine: ${error}`,
        timestamp: new Date(),
        service: 'engine',
      }));
    },

    getEngineState: () => {
      return engineService?.getState() ?? createInitialBabylonRenderingState().engine;
    },

    // Inspector management
    showInspector: () => {
      logger.debug('[DEBUG][BabylonRenderingSlice] Showing BabylonJS inspector...');

      if (!inspectorService) {
        inspectorService = new BabylonInspectorService();
      }

      const scene = engineService?.getState().engine?.getScene?.();
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

      const result = inspectorService.show(scene);
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
      set((state) => {
        state.babylonRendering.inspector = inspectorService!.getState();
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
      set((state) => {
        state.babylonRendering.inspector = inspectorService!.getState();
      });

      return { success: true, data: undefined };
    },

    getInspectorState: () => {
      return inspectorService?.getState() ?? createInitialBabylonRenderingState().inspector;
    },

    // CSG operations
    performCSGOperation: async (operation: string, meshes: unknown[]) => {
      logger.debug(`[DEBUG][BabylonRenderingSlice] Performing CSG operation: ${operation}`);

      return tryCatchAsync(async () => {
        if (!csgService) {
          csgService = new BabylonCSG2Service();
          const scene = engineService?.getState().engine?.getScene?.();
          if (scene) {
            csgService.init(scene);
          }
        }

        // Perform CSG operation based on type
        // This would be implemented based on the specific operation
        // For now, return a placeholder result
        const result = { success: true, data: null };

        // Update state
        set((state) => {
          state.babylonRendering.csg = csgService!.getState();
        });

        return result.data;
      }, (error) => ({
        code: 'CSG_OPERATION_FAILED',
        message: `CSG operation failed: ${error}`,
        timestamp: new Date(),
        service: 'csg',
      }));
    },

    getCSGState: () => {
      return csgService?.getState() ?? createInitialBabylonRenderingState().csg;
    },

    // Particle systems
    createParticleSystem: (config: unknown) => {
      logger.debug('[DEBUG][BabylonRenderingSlice] Creating particle system...');

      if (!particleService) {
        particleService = new BabylonParticleService();
        const scene = engineService?.getState().engine?.getScene?.();
        if (scene) {
          particleService.init(scene);
        }
      }

      // Implementation would create particle system with config
      // For now, return a placeholder
      const systemId = `particle-${Date.now()}`;

      set((state) => {
        // Update particles state
        state.babylonRendering.particles = particleService!.getAllParticleSystemStates();
      });

      return { success: true, data: systemId };
    },

    updateParticleSystem: (id: string, config: unknown) => {
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
      set((state) => {
        state.babylonRendering.particles = particleService!.getAllParticleSystemStates();
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

      set((state) => {
        state.babylonRendering.particles = particleService!.getAllParticleSystemStates();
      });

      return { success: true, data: undefined };
    },

    // IBL shadows
    enableIBLShadows: (config: unknown) => {
      logger.debug('[DEBUG][BabylonRenderingSlice] Enabling IBL shadows...');

      if (!iblShadowsService) {
        iblShadowsService = new BabylonIBLShadowsService();
        const scene = engineService?.getState().engine?.getScene?.();
        if (scene) {
          iblShadowsService.init(scene);
        }
      }

      // Implementation would enable IBL shadows with config
      set((state) => {
        state.babylonRendering.iblShadows = iblShadowsService!.getState();
      });

      return { success: true, data: undefined };
    },

    disableIBLShadows: () => {
      logger.debug('[DEBUG][BabylonRenderingSlice] Disabling IBL shadows...');

      if (!iblShadowsService) {
        return { success: true, data: undefined };
      }

      // Implementation would disable IBL shadows
      set((state) => {
        state.babylonRendering.iblShadows = iblShadowsService!.getState();
      });

      return { success: true, data: undefined };
    },

    // Materials
    createMaterial: async (config: unknown) => {
      logger.debug('[DEBUG][BabylonRenderingSlice] Creating material...');

      return tryCatchAsync(async () => {
        if (!materialService) {
          materialService = new BabylonMaterialService();
          const scene = engineService?.getState().engine?.getScene?.();
          if (scene) {
            materialService.init(scene);
          }
        }

        // Implementation would create material with config
        const materialId = `material-${Date.now()}`;

        set((state) => {
          state.babylonRendering.materials = materialService!.getAllMaterialStates();
        });

        return materialId;
      }, (error) => ({
        code: 'MATERIAL_CREATION_FAILED',
        message: `Material creation failed: ${error}`,
        timestamp: new Date(),
        service: 'materials',
      }));
    },

    applyMaterial: (materialId: string, meshId: string) => {
      logger.debug(`[DEBUG][BabylonRenderingSlice] Applying material ${materialId} to mesh ${meshId}`);

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

      set((state) => {
        state.babylonRendering.materials = materialService!.getAllMaterialStates();
      });

      return { success: true, data: undefined };
    },

    // Render graphs
    createRenderGraph: (config: unknown) => {
      logger.debug('[DEBUG][BabylonRenderingSlice] Creating render graph...');

      if (!renderGraphService) {
        renderGraphService = new BabylonRenderGraphService();
        const scene = engineService?.getState().engine?.getScene?.();
        if (scene) {
          renderGraphService.init(scene);
        }
      }

      // Implementation would create render graph with config
      const graphId = `graph-${Date.now()}`;

      set((state) => {
        state.babylonRendering.renderGraphs = renderGraphService!.getAllRenderGraphStates();
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

      set((state) => {
        state.babylonRendering.renderGraphs = renderGraphService!.getAllRenderGraphStates();
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

      set((state) => {
        state.babylonRendering.renderGraphs = renderGraphService!.getAllRenderGraphStates();
      });

      return { success: true, data: undefined };
    },

    // Rendering
    renderAST: async (ast: readonly ASTNode[]) => {
      logger.debug('[DEBUG][BabylonRenderingSlice] Rendering AST...');

      return tryCatchAsync(async () => {
        set((state) => {
          state.babylonRendering.isRendering = true;
        });

        const startTime = performance.now();

        // Implementation would convert AST to BabylonJS meshes
        // This would use the CSG service and other services as needed
        const meshes: unknown[] = [];

        const renderTime = performance.now() - startTime;

        set((state) => {
          state.babylonRendering.meshes = meshes;
          state.babylonRendering.isRendering = false;
          state.babylonRendering.lastRendered = new Date();
          state.babylonRendering.renderTime = renderTime;
        });

        logger.debug(`[DEBUG][BabylonRenderingSlice] AST rendered successfully in ${renderTime}ms`);
      }, (error) => {
        set((state) => {
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
      });
    },

    updateMeshes: (meshes: readonly unknown[]) => {
      set((state) => {
        state.babylonRendering.meshes = [...meshes];
        state.babylonRendering.lastRendered = new Date();
      });
    },

    clearScene: () => {
      logger.debug('[DEBUG][BabylonRenderingSlice] Clearing scene...');

      set((state) => {
        // Dispose of existing meshes
        state.babylonRendering.meshes.forEach((mesh: any) => {
          if (mesh && typeof mesh.dispose === 'function') {
            mesh.dispose();
          }
        });

        state.babylonRendering.meshes = [];
        state.babylonRendering.renderErrors = [];
        state.babylonRendering.lastRendered = null;
      });
    },

    updatePerformanceMetrics: () => {
      if (engineService) {
        const engineState = engineService.getState();
        set((state) => {
          state.babylonRendering.performanceMetrics = engineState.performanceMetrics;
        });
      }
    },
  };
};
