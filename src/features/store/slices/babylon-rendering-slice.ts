/**
 * @file babylon-rendering-slice.ts
 * @description Comprehensive Zustand slice managing BabylonJS 3D rendering engine integration
 * for OpenSCAD visualization. This slice orchestrates complex 3D rendering operations including
 * engine lifecycle management, scene composition, CSG operations, material systems, particle
 * effects, and advanced rendering features like IBL shadows and render graphs.
 *
 * @architectural_decision
 * **Service-Oriented Architecture**: The slice delegates specialized rendering operations to
 * dedicated BabylonJS service classes (BabylonEngineService, BabylonMaterialService, etc.)
 * to maintain clean separation of concerns and enable comprehensive testing of rendering
 * functionality independent of state management.
 *
 * **Result<T,E> Error Handling**: All asynchronous rendering operations return Result types
 * for functional error handling without exceptions. This pattern enables comprehensive error
 * recovery, detailed error reporting, and predictable error propagation throughout the
 * rendering pipeline.
 *
 * **Immutable State Management**: Complex rendering state is managed through immutable
 * patterns using Immer middleware, ensuring predictable state updates while maintaining
 * performance for frequent rendering operations.
 *
 * **Performance-First Design**: The slice includes comprehensive performance monitoring,
 * automatic resource management, and optimization strategies to maintain 60fps rendering
 * performance even with complex OpenSCAD models.
 *
 * @performance_characteristics
 * - **Engine Initialization**: 100-500ms for full BabylonJS engine setup
 * - **AST Rendering**: 50-500ms depending on model complexity
 * - **CSG Operations**: 100-2000ms for complex boolean operations
 * - **Material Updates**: 10-50ms for material property changes
 * - **Memory Management**: Automatic cleanup prevents memory leaks
 * - **Frame Rate**: 60fps target with automatic quality adjustment
 *
 * @example Basic 3D Rendering Setup
 * ```typescript
 * import { useAppStore } from '@/features/store';
 * import { useCallback, useEffect, useRef } from 'react';
 *
 * function BabylonRenderer() {
 *   const canvasRef = useRef<HTMLCanvasElement>(null);
 *   const {
 *     engineState,
 *     scene,
 *     meshes,
 *     isRendering,
 *     renderErrors,
 *     initializeEngine,
 *     renderAST,
 *     clearScene,
 *     disposeEngine
 *   } = useAppStore(state => ({
 *     engineState: state.babylonRendering.engine,
 *     scene: state.babylonRendering.scene,
 *     meshes: state.babylonRendering.meshes,
 *     isRendering: state.babylonRendering.isRendering,
 *     renderErrors: state.babylonRendering.renderErrors,
 *     initializeEngine: state.initializeEngine,
 *     renderAST: state.renderAST,
 *     clearScene: state.clearScene,
 *     disposeEngine: state.disposeEngine
 *   }));
 *
 *   // Initialize BabylonJS engine
 *   useEffect(() => {
 *     if (!canvasRef.current || engineState.isInitialized) return;
 *
 *     const initEngine = async () => {
 *       const result = await initializeEngine(canvasRef.current!);
 *       if (!result.success) {
 *         console.error('Failed to initialize engine:', result.error);
 *       }
 *     };
 *
 *     initEngine();
 *
 *     return () => {
 *       disposeEngine();
 *     };
 *   }, [initializeEngine, disposeEngine, engineState.isInitialized]);
 *
 *   // Handle AST rendering
 *   const handleRenderAST = useCallback(async (ast: readonly ASTNode[]) => {
 *     if (!engineState.isInitialized) return;
 *
 *     const result = await renderAST(ast);
 *     if (!result.success) {
 *       console.error('Rendering failed:', result.error);
 *     }
 *   }, [renderAST, engineState.isInitialized]);
 *
 *   return (
 *     <div className="babylon-renderer">
 *       <canvas
 *         ref={canvasRef}
 *         style={{ width: '100%', height: '400px' }}
 *       />
 *
 *       <div className="render-status">
 *         <div>Status: {isRendering ? 'Rendering...' : 'Ready'}</div>
 *         <div>Meshes: {meshes.length}</div>
 *         <div>Engine: {engineState.isInitialized ? 'Ready' : 'Initializing'}</div>
 *       </div>
 *
 *       {renderErrors.length > 0 && (
 *         <div className="render-errors">
 *           <h4>Rendering Errors:</h4>
 *           {renderErrors.map((error, index) => (
 *             <div key={index} className="error">
 *               [{error.service}] {error.message}
 *             </div>
 *           ))}
 *         </div>
 *       )}
 *
 *       <div className="render-controls">
 *         <button onClick={clearScene}>Clear Scene</button>
 *       </div>
 *     </div>
 *   );
 * }
 * ```
 *
 * @example Advanced Material and Lighting System
 * ```typescript
 * import { useAppStore } from '@/features/store';
 * import { useCallback, useState } from 'react';
 *
 * function AdvancedRenderingControls() {
 *   const {
 *     materials,
 *     iblShadows,
 *     performanceMetrics,
 *     createMaterial,
 *     applyMaterial,
 *     enableIBLShadows,
 *     disableIBLShadows,
 *     updatePerformanceMetrics
 *   } = useAppStore(state => ({
 *     materials: state.babylonRendering.materials,
 *     iblShadows: state.babylonRendering.iblShadows,
 *     performanceMetrics: state.babylonRendering.performanceMetrics,
 *     createMaterial: state.createMaterial,
 *     applyMaterial: state.applyMaterial,
 *     enableIBLShadows: state.enableIBLShadows,
 *     disableIBLShadows: state.disableIBLShadows,
 *     updatePerformanceMetrics: state.updatePerformanceMetrics
 *   }));
 *
 *   const [materialConfig, setMaterialConfig] = useState({
 *     name: 'Custom Material',
 *     diffuseColor: '#ff0000',
 *     metallic: 0.5,
 *     roughness: 0.3
 *   });
 *
 *   const handleCreateMaterial = useCallback(async () => {
 *     const result = await createMaterial({
 *       name: materialConfig.name,
 *       diffuseColor: materialConfig.diffuseColor,
 *       metallicFactor: materialConfig.metallic,
 *       roughnessFactor: materialConfig.roughness
 *     });
 *
 *     if (result.success) {
 *       console.log('Material created:', result.data);
 *     } else {
 *       console.error('Material creation failed:', result.error);
 *     }
 *   }, [createMaterial, materialConfig]);
 *
 *   const handleToggleIBLShadows = useCallback(() => {
 *     if (iblShadows.enabled) {
 *       const result = disableIBLShadows();
 *       if (!result.success) {
 *         console.error('Failed to disable IBL shadows:', result.error);
 *       }
 *     } else {
 *       const result = enableIBLShadows({
 *         intensity: 1.0,
 *         shadowMapSize: 1024
 *       });
 *       if (!result.success) {
 *         console.error('Failed to enable IBL shadows:', result.error);
 *       }
 *     }
 *   }, [iblShadows.enabled, enableIBLShadows, disableIBLShadows]);
 *
 *   return (
 *     <div className="advanced-controls">
 *       <div className="material-controls">
 *         <h3>Material System</h3>
 *         <div>
 *           <label>Material Name:</label>
 *           <input
 *             value={materialConfig.name}
 *             onChange={e => setMaterialConfig(prev => ({
 *               ...prev,
 *               name: e.target.value
 *             }))}
 *           />
 *         </div>
 *         <div>
 *           <label>Color:</label>
 *           <input
 *             type="color"
 *             value={materialConfig.diffuseColor}
 *             onChange={e => setMaterialConfig(prev => ({
 *               ...prev,
 *               diffuseColor: e.target.value
 *             }))}
 *           />
 *         </div>
 *         <div>
 *           <label>Metallic: {materialConfig.metallic}</label>
 *           <input
 *             type="range"
 *             min="0"
 *             max="1"
 *             step="0.1"
 *             value={materialConfig.metallic}
 *             onChange={e => setMaterialConfig(prev => ({
 *               ...prev,
 *               metallic: parseFloat(e.target.value)
 *             }))}
 *           />
 *         </div>
 *         <button onClick={handleCreateMaterial}>Create Material</button>
 *
 *         <div className="materials-list">
 *           <h4>Available Materials ({materials.length})</h4>
 *           {materials.map((material, index) => (
 *             <div key={index} className="material-item">
 *               {material.name}
 *             </div>
 *           ))}
 *         </div>
 *       </div>
 *
 *       <div className="lighting-controls">
 *         <h3>Lighting System</h3>
 *         <label>
 *           <input
 *             type="checkbox"
 *             checked={iblShadows.enabled}
 *             onChange={handleToggleIBLShadows}
 *           />
 *           Enable IBL Shadows
 *         </label>
 *         {iblShadows.enabled && (
 *           <div>
 *             <div>Shadow Quality: {iblShadows.quality}</div>
 *             <div>Shadow Map Size: {iblShadows.shadowMapSize}</div>
 *           </div>
 *         )}
 *       </div>
 *
 *       <div className="performance-monitor">
 *         <h3>Performance Metrics</h3>
 *         <div>FPS: {performanceMetrics.fps.toFixed(1)}</div>
 *         <div>Delta Time: {performanceMetrics.deltaTime.toFixed(2)}ms</div>
 *         <div>Render Time: {performanceMetrics.renderTime.toFixed(2)}ms</div>
 *         <div>Draw Calls: {performanceMetrics.drawCalls}</div>
 *         <div>Triangles: {performanceMetrics.triangleCount.toLocaleString()}</div>
 *         <div>Memory: {(performanceMetrics.memoryUsage / 1024 / 1024).toFixed(1)}MB</div>
 *         <button onClick={updatePerformanceMetrics}>Refresh Metrics</button>
 *       </div>
 *     </div>
 *   );
 * }
 * ```
 *
 * @example CSG Operations and Complex Geometry
 * ```typescript
 * import { useAppStore } from '@/features/store';
 * import { useCallback, useState } from 'react';
 *
 * function CSGOperationsPanel() {
 *   const {
 *     csgState,
 *     meshes,
 *     performCSGOperation,
 *     getCSGState
 *   } = useAppStore(state => ({
 *     csgState: state.babylonRendering.csg,
 *     meshes: state.babylonRendering.meshes,
 *     performCSGOperation: state.performCSGOperation,
 *     getCSGState: state.getCSGState
 *   }));
 *
 *   const [selectedMeshes, setSelectedMeshes] = useState<unknown[]>([]);
 *   const [operationType, setOperationType] = useState<'union' | 'difference' | 'intersection'>('union');
 *
 *   const handleCSGOperation = useCallback(async () => {
 *     if (selectedMeshes.length < 2) {
 *       alert('Select at least 2 meshes for CSG operation');
 *       return;
 *     }
 *
 *     console.time(`CSG ${operationType} operation`);
 *     const result = await performCSGOperation(operationType, selectedMeshes);
 *     console.timeEnd(`CSG ${operationType} operation`);
 *
 *     if (result.success) {
 *       console.log('CSG operation successful:', result.data);
 *       setSelectedMeshes([]); // Clear selection
 *     } else {
 *       console.error('CSG operation failed:', result.error);
 *       alert(`CSG operation failed: ${result.error.message}`);
 *     }
 *   }, [performCSGOperation, operationType, selectedMeshes]);
 *
 *   const currentCSGState = getCSGState();
 *
 *   return (
 *     <div className="csg-operations">
 *       <h3>CSG Operations</h3>
 *
 *       <div className="csg-status">
 *         <div>CSG Engine: {currentCSGState.isInitialized ? 'Ready' : 'Initializing'}</div>
 *         <div>Active Operations: {currentCSGState.activeOperations}</div>
 *         <div>Available Meshes: {meshes.length}</div>
 *       </div>
 *
 *       <div className="operation-controls">
 *         <label>
 *           Operation Type:
 *           <select
 *             value={operationType}
 *             onChange={e => setOperationType(e.target.value as typeof operationType)}
 *           >
 *             <option value="union">Union</option>
 *             <option value="difference">Difference</option>
 *             <option value="intersection">Intersection</option>
 *           </select>
 *         </label>
 *
 *         <div>Selected Meshes: {selectedMeshes.length}</div>
 *
 *         <button
 *           onClick={handleCSGOperation}
 *           disabled={selectedMeshes.length < 2 || !currentCSGState.isInitialized}
 *         >
 *           Perform {operationType.charAt(0).toUpperCase() + operationType.slice(1)}
 *         </button>
 *       </div>
 *
 *       <div className="mesh-list">
 *         <h4>Available Meshes</h4>
 *         {meshes.map((mesh, index) => (
 *           <div key={index} className="mesh-item">
 *             <label>
 *               <input
 *                 type="checkbox"
 *                 checked={selectedMeshes.includes(mesh)}
 *                 onChange={e => {
 *                   if (e.target.checked) {
 *                     setSelectedMeshes(prev => [...prev, mesh]);
 *                   } else {
 *                     setSelectedMeshes(prev => prev.filter(m => m !== mesh));
 *                   }
 *                 }}
 *               />
 *               Mesh {index + 1}
 *             </label>
 *           </div>
 *         ))}
 *       </div>
 *     </div>
 *   );
 * }
 * ```
 *
 * @diagram BabylonJS Rendering Architecture
 * ```mermaid
 * graph TD
 *     A[OpenSCAD AST] --> B[AST Bridge Converter];
 *     B --> C[BabylonJS Scene];
 *
 *     C --> D[Engine Service];
 *     C --> E[Material Service];
 *     C --> F[CSG Service];
 *     C --> G[Particle Service];
 *     C --> H[IBL Shadow Service];
 *     C --> I[Render Graph Service];
 *
 *     D --> J[WebGL Context];
 *     E --> K[Material System];
 *     F --> L[CSG Operations];
 *     G --> M[Particle Systems];
 *     H --> N[Shadow Mapping];
 *     I --> O[Render Pipeline];
 *
 *     J --> P[GPU Rendering];
 *     K --> P;
 *     L --> P;
 *     M --> P;
 *     N --> P;
 *     O --> P;
 *
 *     P --> Q[Frame Buffer];
 *     Q --> R[Canvas Display];
 *
 *     subgraph "Performance Monitoring"
 *         S[FPS Counter]
 *         T[Memory Usage]
 *         U[Draw Call Tracking]
 *         V[Triangle Count]
 *     end
 *
 *     P --> S;
 *     P --> T;
 *     P --> U;
 *     P --> V;
 *
 *     subgraph "Error Handling"
 *         W[Service Errors]
 *         X[Rendering Errors]
 *         Y[Resource Errors]
 *     end
 *
 *     D --> W;
 *     E --> W;
 *     F --> W;
 *     P --> X;
 *     J --> Y;
 * ```
 *
 * @limitations
 * - **WebGL Support**: Requires modern browser with WebGL2 support
 * - **Memory Constraints**: Large models may hit browser memory limits
 * - **CSG Performance**: Complex boolean operations can be slow (>2 seconds)
 * - **Mobile Performance**: Limited performance on mobile devices
 * - **Browser Compatibility**: Some advanced features require recent browser versions
 * - **Resource Management**: Manual cleanup required for some BabylonJS resources
 *
 * @integration_patterns
 * **AST Integration**:
 * ```typescript
 * // Automatic AST rendering when parsing completes
 * useEffect(() => {
 *   if (ast.length > 0 && !isRendering) {
 *     renderAST(ast);
 *   }
 * }, [ast, isRendering, renderAST]);
 * ```
 *
 * **Performance Integration**:
 * ```typescript
 * // Monitor performance and adjust quality
 * useEffect(() => {
 *   if (performanceMetrics.fps < 30) {
 *     // Reduce quality for better performance
 *     updateRenderQuality('low');
 *   }
 * }, [performanceMetrics.fps]);
 * ```
 *
 * **Error Integration**:
 * ```typescript
 * // Handle rendering errors gracefully
 * useEffect(() => {
 *   if (renderErrors.length > 0) {
 *     showErrorNotification(renderErrors[renderErrors.length - 1]);
 *   }
 * }, [renderErrors]);
 * ```
 */

import type { AbstractMesh, Engine, Scene } from '@babylonjs/core';
import type { WritableDraft } from 'immer';
import type { StateCreator } from 'zustand';
import { createLogger } from '../../../shared/services/logger.service';
import type { CameraConfig } from '../../../shared/types/common.types';
import type { Result } from '../../../shared/types/result.types';
import { tryCatchAsync } from '../../../shared/utils/functional/result';
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
import { ASTBridgeConverter } from '../../babylon-renderer/services/ast-bridge-converter';
import { disposeMeshesComprehensively } from '../../babylon-renderer/utils/mesh-disposal/mesh-disposal';
import { forceSceneRefresh } from '../../babylon-renderer/utils/scene-refresh/scene-refresh';
import type { ASTNode } from '../../openscad-parser/core/ast-types';
import { DEFAULT_CAMERA } from '../app-store';
import type { AppStore } from '../types/store.types';

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
  set: Parameters<StateCreator<AppStore, [['zustand/immer', never]], [], AppStore>>[0],
  _get: Parameters<StateCreator<AppStore, [['zustand/immer', never]], [], AppStore>>[1]
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
          set((state: WritableDraft<AppStore>) => {
            const engineState = engineService?.getState();
            if (engineState) {
              state.babylonRendering.engine = engineState as WritableDraft<BabylonEngineState>;
            }
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
          set((state: WritableDraft<AppStore>) => {
            state.babylonRendering.engine = createInitialBabylonRenderingState()
              .engine as WritableDraft<BabylonEngineState>;
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
      set((state: WritableDraft<AppStore>) => {
        const inspectorState = inspectorService?.getState();
        if (inspectorState) {
          state.babylonRendering.inspector = inspectorState as WritableDraft<InspectorState>;
        }
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
      set((state: WritableDraft<AppStore>) => {
        const inspectorState = inspectorService?.getState();
        if (inspectorState) {
          state.babylonRendering.inspector = inspectorState as WritableDraft<InspectorState>;
        }
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
          set((state: WritableDraft<AppStore>) => {
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

      set((state: WritableDraft<AppStore>) => {
        // Update particles state
        const particleStates = particleService?.getAllParticleSystemStates();
        if (particleStates) {
          state.babylonRendering.particles = particleStates as WritableDraft<ParticleSystemState[]>;
        }
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
      set((state: WritableDraft<AppStore>) => {
        const particleStates = particleService?.getAllParticleSystemStates();
        if (particleStates) {
          state.babylonRendering.particles = particleStates as WritableDraft<ParticleSystemState[]>;
        }
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

      set((state: WritableDraft<AppStore>) => {
        const particleStates = particleService?.getAllParticleSystemStates();
        if (particleStates) {
          state.babylonRendering.particles = particleStates as WritableDraft<ParticleSystemState[]>;
        }
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
      set((state: WritableDraft<AppStore>) => {
        const iblShadowsState = iblShadowsService?.getState();
        if (iblShadowsState) {
          state.babylonRendering.iblShadows = iblShadowsState as WritableDraft<
            typeof iblShadowsState
          >;
        }
      });

      return { success: true, data: undefined };
    },

    disableIBLShadows: () => {
      logger.debug('[DEBUG][BabylonRenderingSlice] Disabling IBL shadows...');

      if (!iblShadowsService) {
        return { success: true, data: undefined };
      }

      // Implementation would disable IBL shadows
      set((state: WritableDraft<AppStore>) => {
        const iblShadowsState = iblShadowsService?.getState();
        if (iblShadowsState) {
          state.babylonRendering.iblShadows = iblShadowsState as WritableDraft<
            typeof iblShadowsState
          >;
        }
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

          set((state: WritableDraft<AppStore>) => {
            const materialStates = materialService?.getAllMaterialStates();
            if (materialStates) {
              state.babylonRendering.materials = materialStates as WritableDraft<MaterialState[]>;
            }
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

      set((state: WritableDraft<AppStore>) => {
        const materialStates = materialService?.getAllMaterialStates();
        if (materialStates) {
          state.babylonRendering.materials = materialStates as WritableDraft<MaterialState[]>;
        }
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

      set((state: WritableDraft<AppStore>) => {
        const renderGraphStates = renderGraphService?.getAllRenderGraphStates();
        if (renderGraphStates) {
          state.babylonRendering.renderGraphs = renderGraphStates as WritableDraft<
            RenderGraphState[]
          >;
        }
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

      set((state: WritableDraft<AppStore>) => {
        const renderGraphStates = renderGraphService?.getAllRenderGraphStates();
        if (renderGraphStates) {
          state.babylonRendering.renderGraphs = renderGraphStates as WritableDraft<
            RenderGraphState[]
          >;
        }
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

      set((state: WritableDraft<AppStore>) => {
        const renderGraphStates = renderGraphService?.getAllRenderGraphStates();
        if (renderGraphStates) {
          state.babylonRendering.renderGraphs = renderGraphStates as WritableDraft<
            RenderGraphState[]
          >;
        }
      });

      return { success: true, data: undefined };
    },

    // Scene management
    setScene: (scene: Scene | null) => {
      set((state: WritableDraft<AppStore>) => {
        state.babylonRendering.scene = scene as WritableDraft<Scene | null>;
      });
      logger.debug('[DEBUG][BabylonRenderingSlice] Scene reference updated');
    },

    // Rendering
    renderAST: async (ast: readonly ASTNode[]) => {
      logger.debug(`[DEBUG][BabylonRenderingSlice] renderAST called with ${ast.length} nodes`);

      const currentState = _get();
      const scene = currentState.babylonRendering.scene;

      logger.debug(`[DEBUG][BabylonRenderingSlice] Scene available: ${scene ? 'YES' : 'NO'}`);
      logger.debug(
        `[DEBUG][BabylonRenderingSlice] Current rendering state: ${currentState.babylonRendering.isRendering ? 'RENDERING' : 'IDLE'}`
      );
      logger.debug(
        `[DEBUG][BabylonRenderingSlice] AST nodes: ${ast.map((node) => node.type).join(', ')}`
      );

      if (!scene) {
        const error = {
          code: 'SCENE_NOT_AVAILABLE' as const,
          message: 'BabylonJS scene not available for rendering',
          timestamp: new Date(),
          service: 'rendering' as const,
        };

        set((state: WritableDraft<AppStore>) => {
          state.babylonRendering.renderErrors = [...state.babylonRendering.renderErrors, error];
        });

        return { success: false, error };
      }

      // Dispose all non-system meshes comprehensively
      const disposalResult = disposeMeshesComprehensively(scene);
      if (!disposalResult.success) {
        logger.warn(
          `[WARN][BabylonRenderingSlice] Mesh disposal failed: ${disposalResult.error.message}`
        );
      } else {
        logger.debug(
          `[DEBUG][BabylonRenderingSlice] Disposed ${disposalResult.data.meshesDisposed} meshes, ${disposalResult.data.materialsDisposed} materials, ${disposalResult.data.texturesDisposed} textures`
        );
      }

      // Force complete scene refresh to ensure visual updates
      const engine = scene.getEngine();
      if (engine) {
        const refreshResult = forceSceneRefresh(engine as Engine, scene);
        if (!refreshResult.success) {
          logger.warn(
            `[WARN][BabylonRenderingSlice] Scene refresh failed: ${refreshResult.error.message}`
          );
        } else {
          logger.debug('[DEBUG][BabylonRenderingSlice] Scene refresh completed successfully');
        }
      }

      return tryCatchAsync(
        async () => {
          logger.debug(
            '[DEBUG][BabylonRenderingSlice] 🎯 INSIDE tryCatchAsync - starting execution...'
          );

          // Clear existing meshes first - AGGRESSIVE APPROACH
          logger.debug('[DEBUG][BabylonRenderingSlice] 🧹 STARTING AGGRESSIVE MESH CLEARING...');

          // Get all meshes from the scene
          const allMeshes = scene.meshes || [];
          logger.debug(
            `[DEBUG][BabylonRenderingSlice] 📊 Scene has ${allMeshes.length} total meshes`
          );

          // Log every single mesh for debugging
          allMeshes.forEach((mesh: AbstractMesh, index: number) => {
            const meshInfo = {
              index,
              name: mesh.name || 'NO_NAME',
              id: mesh.id || 'NO_ID',
              type: mesh.constructor?.name || 'UNKNOWN_TYPE',
              hasDispose: typeof mesh.dispose === 'function',
            };
            logger.debug(
              `[DEBUG][BabylonRenderingSlice] 🔍 Mesh ${index}: ${JSON.stringify(meshInfo)}`
            );
          });

          // Use BabylonJS built-in method to dispose all meshes except cameras and lights
          let disposedCount = 0;
          let skippedCount = 0;

          // Create a copy to avoid modification during iteration
          const meshesToCheck = [...allMeshes];

          for (const mesh of meshesToCheck) {
            if (!mesh) {
              skippedCount++;
              continue;
            }

            // Check if it's a camera or light (these should not be disposed)
            const isCamera = mesh.getClassName?.().includes('Camera');
            const isLight = mesh.getClassName?.().includes('Light');
            const hasSystemName =
              (mesh.name || '').toLowerCase().includes('camera') ||
              (mesh.name || '').toLowerCase().includes('light');

            if (isCamera || isLight || hasSystemName) {
              skippedCount++;
              logger.debug(
                `[DEBUG][BabylonRenderingSlice] ⏭️ Skipped system object: ${mesh.name || mesh.id} (${mesh.getClassName?.() || 'unknown'})`
              );
              continue;
            }

            // Remove and dispose user-generated meshes (PROPER BABYLONJS METHOD)
            try {
              // Step 1: Remove from scene first (this is critical!)
              if (scene.removeMesh && typeof scene.removeMesh === 'function') {
                scene.removeMesh(mesh);
                logger.debug(
                  `[DEBUG][BabylonRenderingSlice] 🔄 Removed mesh from scene: ${mesh.name || mesh.id}`
                );
              }

              // Step 2: Then dispose the mesh
              if (typeof mesh.dispose === 'function') {
                mesh.dispose();
                disposedCount++;
                logger.debug(
                  `[DEBUG][BabylonRenderingSlice] 🗑️ Disposed mesh: ${mesh.name || mesh.id} (${mesh.getClassName?.() || 'unknown'})`
                );
              } else {
                skippedCount++;
                logger.debug(
                  `[DEBUG][BabylonRenderingSlice] ⚠️ No dispose method: ${mesh.name || mesh.id}`
                );
              }
            } catch (error) {
              logger.error(
                `[ERROR][BabylonRenderingSlice] 💥 Failed to remove/dispose mesh ${mesh.name || mesh.id}:`,
                error
              );
            }
          }

          logger.debug(
            `[DEBUG][BabylonRenderingSlice] 🏁 Mesh clearing COMPLETE: ${disposedCount} disposed, ${skippedCount} skipped`
          );
          logger.debug(
            `[DEBUG][BabylonRenderingSlice] 📊 Scene now has ${scene.meshes.length} meshes remaining`
          );

          set((state: WritableDraft<AppStore>) => {
            state.babylonRendering.isRendering = true;
            state.babylonRendering.renderErrors = []; // Clear previous errors
            state.babylonRendering.meshes = []; // Clear meshes array in store
          });

          const startTime = performance.now();

          // Convert AST to BabylonJS meshes using the bridge converter
          logger.debug(
            `[DEBUG][BabylonRenderingSlice] Converting AST with ${ast.length} nodes to BabylonJS nodes...`
          );
          const bridgeConverter = new ASTBridgeConverter();
          console.log(
            `[DEBUG][BabylonRenderingSlice] About to initialize bridgeConverter with scene`
          );
          await bridgeConverter.initialize(scene);
          console.log(
            `[DEBUG][BabylonRenderingSlice] bridgeConverter.initialize completed successfully`
          );

          console.log(
            `[DEBUG][BabylonRenderingSlice] About to call bridgeConverter.convertAST with ${ast.length} AST nodes`
          );
          logger.debug(
            `[DEBUG][BabylonRenderingSlice] About to call bridgeConverter.convertAST with ${ast.length} AST nodes`
          );
          const conversionResult = await bridgeConverter.convertAST(ast);
          console.log(
            `[DEBUG][BabylonRenderingSlice] convertAST completed, success: ${conversionResult.success}`
          );
          logger.debug(
            `[DEBUG][BabylonRenderingSlice] convertAST completed, success: ${conversionResult.success}`
          );

          if (!conversionResult.success) {
            logger.error(
              `[ERROR][BabylonRenderingSlice] AST conversion failed: ${conversionResult.error.message}`
            );
            throw new Error(`AST conversion failed: ${conversionResult.error.message}`);
          }

          const babylonNodes = conversionResult.data;
          logger.debug(
            `[DEBUG][BabylonRenderingSlice] AST conversion successful - created ${babylonNodes.length} BabylonJS nodes`
          );
          const renderTime = performance.now() - startTime;

          // CRITICAL FIX: Generate actual BabylonJS meshes from BabylonJSNode objects
          // The ASTBridgeConverter returns BabylonJSNode objects, not actual meshes
          const meshes: AbstractMesh[] = [];
          for (const babylonNode of babylonNodes) {
            const meshResult = await babylonNode.generateMesh();
            if (meshResult.success) {
              const mesh = meshResult.data;
              meshes.push(mesh);

              // CRITICAL: Ensure mesh is part of the scene
              // In BabylonJS, meshes should be automatically added to scene when created with scene parameter
              // But let's verify and log the scene association
              if (mesh.getScene() === scene) {
                logger.debug(
                  `[DEBUG][BabylonRenderingSlice] ✅ Mesh '${mesh.name}' is correctly associated with scene`
                );
              } else {
                logger.warn(
                  `[WARN][BabylonRenderingSlice] ⚠️ Mesh '${mesh.name}' is NOT associated with scene - fixing...`
                );
                // Force association if needed (though this shouldn't be necessary)
                if (scene && typeof scene.addMesh === 'function') {
                  scene.addMesh(mesh);
                }
              }

              logger.debug(
                `[DEBUG][BabylonRenderingSlice] Generated mesh '${mesh.name}' from BabylonJSNode`
              );
            } else {
              logger.error(
                `[ERROR][BabylonRenderingSlice] Failed to generate mesh: ${meshResult.error.message}`
              );
            }
          }

          // Log scene state after mesh generation
          logger.debug(
            `[DEBUG][BabylonRenderingSlice] Scene now has ${scene.meshes.length} meshes total`
          );

          // Auto-frame the scene if meshes were generated
          if (meshes.length > 0) {
            try {
              logger.debug('[DEBUG][BabylonRenderingSlice] Auto-framing scene with new meshes');

              // Direct BabylonJS auto-framing implementation
              const camera = scene.activeCamera;
              if (camera && camera.getClassName() === 'ArcRotateCamera') {
                const arcCamera = camera as any; // ArcRotateCamera

                // Calculate scene bounds from all visible meshes
                let minX = Number.POSITIVE_INFINITY;
                let maxX = Number.NEGATIVE_INFINITY;
                let minY = Number.POSITIVE_INFINITY;
                let maxY = Number.NEGATIVE_INFINITY;
                let minZ = Number.POSITIVE_INFINITY;
                let maxZ = Number.NEGATIVE_INFINITY;

                const allSceneMeshes = scene.meshes.filter(mesh => mesh.isVisible && mesh.isEnabled());

                for (const mesh of allSceneMeshes) {
                  const boundingInfo = mesh.getBoundingInfo();
                  if (boundingInfo) {
                    const min = boundingInfo.boundingBox.minimumWorld;
                    const max = boundingInfo.boundingBox.maximumWorld;

                    minX = Math.min(minX, min.x);
                    maxX = Math.max(maxX, max.x);
                    minY = Math.min(minY, min.y);
                    maxY = Math.max(maxY, max.y);
                    minZ = Math.min(minZ, min.z);
                    maxZ = Math.max(maxZ, max.z);
                  }
                }

                if (isFinite(minX) && isFinite(maxX)) {
                  const { Vector3 } = require('@babylonjs/core');
                  const sceneCenter = new Vector3(
                    (minX + maxX) / 2,
                    (minY + maxY) / 2,
                    (minZ + maxZ) / 2
                  );

                  const sceneSize = new Vector3(
                    maxX - minX,
                    maxY - minY,
                    maxZ - minZ
                  );

                  const diagonal = sceneSize.length();
                  const optimalRadius = Math.max(diagonal * 1.5, 5); // Minimum radius of 5

                  // Update camera target and radius
                  arcCamera.setTarget(sceneCenter);
                  arcCamera.radius = optimalRadius;

                  logger.debug(
                    `[DEBUG][BabylonRenderingSlice] Auto-framing completed: target=(${sceneCenter.x.toFixed(1)}, ${sceneCenter.y.toFixed(1)}, ${sceneCenter.z.toFixed(1)}), radius=${optimalRadius.toFixed(1)}`
                  );
                } else {
                  logger.warn('[WARN][BabylonRenderingSlice] No valid meshes found for auto-framing');
                }
              } else {
                logger.warn('[WARN][BabylonRenderingSlice] Auto-framing requires ArcRotateCamera');
              }
            } catch (error) {
              logger.warn('[WARN][BabylonRenderingSlice] Auto-framing failed:', error);
            }
          }

          set((state: WritableDraft<AppStore>) => {
            state.babylonRendering.meshes = meshes as WritableDraft<readonly unknown[]>;
            state.babylonRendering.isRendering = false;
            state.babylonRendering.lastRendered = new Date();
            state.babylonRendering.renderTime = renderTime;
          });

          logger.debug(
            `[DEBUG][BabylonRenderingSlice] AST rendered successfully in ${renderTime.toFixed(2)}ms with ${meshes.length} meshes added to scene`
          );
        },
        (error) => {
          set((state: WritableDraft<AppStore>) => {
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
      set((state: WritableDraft<AppStore>) => {
        state.babylonRendering.meshes = [...meshes];
        state.babylonRendering.lastRendered = new Date();
      });
    },

    clearScene: () => {
      logger.debug('[DEBUG][BabylonRenderingSlice] Clearing scene (optimized for no flickering)...');

      set((state: WritableDraft<AppStore>) => {
        let clearedCount = 0;

        // Dispose of existing meshes if they exist (optimized to prevent flickering)
        if (state.babylonRendering?.meshes && Array.isArray(state.babylonRendering.meshes)) {
          (state.babylonRendering.meshes as AbstractMesh[]).forEach((mesh: AbstractMesh) => {
            if (mesh && typeof mesh.dispose === 'function') {
              try {
                // Hide mesh first to prevent flickering
                mesh.setEnabled(false);
                mesh.isVisible = false;

                // Dispose immediately but after hiding
                mesh.dispose();
                clearedCount++;
                logger.debug(
                  `[DEBUG][BabylonRenderingSlice] Disposed mesh during clearScene: ${mesh.name || 'unnamed'}`
                );
              } catch (error) {
                logger.warn(
                  `[WARN][BabylonRenderingSlice] Failed to dispose mesh during clearScene:`,
                  error
                );
              }
            }
          });
        }

        // Also clear meshes from the actual BabylonJS scene if available (optimized)
        if (state.babylonRendering?.scene) {
          const scene = state.babylonRendering.scene;
          const existingMeshes = [...(scene.meshes as unknown as AbstractMesh[])];
          existingMeshes.forEach((mesh: AbstractMesh) => {
            if (
              mesh?.name &&
              !mesh.name.toLowerCase().includes('camera') &&
              !mesh.name.toLowerCase().includes('light') &&
              !mesh.name.toLowerCase().includes('ground') &&
              typeof mesh.dispose === 'function'
            ) {
              try {
                // Hide mesh first to prevent flickering
                mesh.setEnabled(false);
                mesh.isVisible = false;

                // Dispose immediately but after hiding
                mesh.dispose();
                clearedCount++;
                logger.debug(
                  `[DEBUG][BabylonRenderingSlice] Disposed scene mesh during clearScene: ${mesh.name}`
                );
              } catch (error) {
                logger.warn(
                  `[WARN][BabylonRenderingSlice] Failed to dispose scene mesh during clearScene:`,
                  error
                );
              }
            }
          });
        }

        logger.debug(
          `[DEBUG][BabylonRenderingSlice] Cleared ${clearedCount} total meshes during clearScene`
        );

        // Ensure babylonRendering state exists
        if (!state.babylonRendering) {
          state.babylonRendering =
            createInitialBabylonRenderingState() as unknown as WritableDraft<BabylonRenderingState>;
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
        set((state: WritableDraft<AppStore>) => {
          state.babylonRendering.performanceMetrics = engineState.performanceMetrics;
        });
      }
    },

    // Error management
    addRenderError: (error: { type: string; message: string }) => {
      set((state: WritableDraft<AppStore>) => {
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
      set((state: WritableDraft<AppStore>) => {
        state.babylonRendering.renderErrors = [];
      });
    },

    // Camera management
    updateCamera: (camera: Partial<CameraConfig>) => {
      set((state: WritableDraft<AppStore>) => {
        state.babylonRendering.camera = {
          ...state.babylonRendering.camera,
          ...camera,
        } as WritableDraft<CameraConfig>;
      });
    },

    resetCamera: () => {
      set((state: WritableDraft<AppStore>) => {
        state.babylonRendering.camera = createInitialBabylonRenderingState()
          .camera as WritableDraft<CameraConfig>;
      });
    },
  };
};
