/**
 * @file OpenSCAD Pipeline Store
 * 
 * Zustand store for managing the complete OpenSCAD to R3F pipeline state.
 * Implements Result<T,E> patterns, 300ms debouncing, and comprehensive
 * error handling following functional programming principles.
 * 
 * @author OpenSCAD-R3F Pipeline
 * @version 1.0.0
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { ASTNode } from '@holistic-stack/openscad-parser';
import * as THREE from 'three';
import { 
  processOpenSCADPipeline,
  type PipelineResult,
  type PipelineConfig,
  type PipelineProgress,
  type PipelineError,
  type Result
} from '../core/pipeline-processor';
import type { CSGTree } from '../../csg-processor';
import type { R3FGenerationResult } from '../../r3f-generator';

// ============================================================================
// Store Types
// ============================================================================

/**
 * Pipeline processing status
 */
export type PipelineStatus = 'idle' | 'processing' | 'success' | 'error';

/**
 * Pipeline store state
 */
export interface PipelineState {
  // Current state
  readonly status: PipelineStatus;
  readonly isProcessing: boolean;
  readonly currentCode: string;
  readonly lastProcessedCode: string;
  
  // Pipeline data
  readonly ast: readonly ASTNode[] | null;
  readonly csgTree: CSGTree | null;
  readonly r3fResult: R3FGenerationResult | null;
  readonly meshes: readonly THREE.Mesh[];
  readonly scene: THREE.Scene | null;
  
  // Progress and errors
  readonly progress: PipelineProgress | null;
  readonly errors: readonly PipelineError[];
  readonly warnings: readonly PipelineError[];
  
  // Metrics
  readonly metrics: {
    readonly totalTime: number;
    readonly parsingTime: number;
    readonly csgProcessingTime: number;
    readonly r3fGenerationTime: number;
    readonly nodeCount: number;
    readonly meshCount: number;
    readonly vertexCount: number;
    readonly triangleCount: number;
    readonly memoryUsage: number;
  };
  
  // Configuration
  readonly config: PipelineConfig;
  
  // Debouncing
  readonly debounceTimeout: NodeJS.Timeout | null;
  readonly lastUpdateTime: number;
}

/**
 * Pipeline store actions
 */
export interface PipelineActions {
  // Core actions
  readonly processCode: (code: string, immediate?: boolean) => Promise<Result<PipelineResult, readonly PipelineError[]>>;
  readonly setCode: (code: string) => void;
  readonly setConfig: (config: Partial<PipelineConfig>) => void;
  
  // State management
  readonly clearErrors: () => void;
  readonly clearWarnings: () => void;
  readonly reset: () => void;
  readonly dispose: () => void;
  
  // Utility actions
  readonly retryProcessing: () => Promise<Result<PipelineResult, readonly PipelineError[]>>;
  readonly cancelProcessing: () => void;
}

/**
 * Complete pipeline store interface
 */
export interface PipelineStore extends PipelineState, PipelineActions {}

// ============================================================================
// Default State
// ============================================================================

const DEFAULT_STATE: PipelineState = {
  status: 'idle',
  isProcessing: false,
  currentCode: '',
  lastProcessedCode: '',
  
  ast: null,
  csgTree: null,
  r3fResult: null,
  meshes: [],
  scene: null,
  
  progress: null,
  errors: [],
  warnings: [],
  
  metrics: {
    totalTime: 0,
    parsingTime: 0,
    csgProcessingTime: 0,
    r3fGenerationTime: 0,
    nodeCount: 0,
    meshCount: 0,
    vertexCount: 0,
    triangleCount: 0,
    memoryUsage: 0
  },
  
  config: {
    enableLogging: false,
    enableCaching: true,
    enableOptimization: true,
    timeout: 30000
  },
  
  debounceTimeout: null,
  lastUpdateTime: 0
};

// ============================================================================
// Store Implementation
// ============================================================================

/**
 * OpenSCAD Pipeline Zustand Store
 * 
 * Manages the complete pipeline state with debouncing, error handling,
 * and performance optimization. Follows functional programming principles
 * with immutable state updates and Result<T,E> patterns.
 */
export const usePipelineStore = create<PipelineStore>()(
  subscribeWithSelector((set, get) => ({
    ...DEFAULT_STATE,

    // ========================================================================
    // Core Actions
    // ========================================================================

    processCode: async (code: string, immediate = false): Promise<Result<PipelineResult, readonly PipelineError[]>> => {
      const state = get();
      
      // Clear existing timeout if not immediate
      if (state.debounceTimeout && !immediate) {
        clearTimeout(state.debounceTimeout);
      }

      // If not immediate, set up debounced processing
      if (!immediate) {
        return new Promise((resolve) => {
          const timeoutId = setTimeout(async () => {
            const result = await get().processCode(code, true);
            resolve(result);
          }, 300); // 300ms debouncing

          set(state => ({
            ...state,
            debounceTimeout: timeoutId,
            lastUpdateTime: Date.now()
          }));
        });
      }

      // Immediate processing
      try {
        // Validate input
        if (!code || !code.trim()) {
          set(state => ({
            ...state,
            status: 'idle',
            isProcessing: false,
            currentCode: code,
            ast: null,
            csgTree: null,
            r3fResult: null,
            meshes: [],
            scene: null,
            progress: null,
            errors: [],
            warnings: [],
            debounceTimeout: null
          }));

          return { success: true, data: DEFAULT_STATE as any };
        }

        // Check if code has changed
        if (code === state.lastProcessedCode && state.status === 'success') {
          return { 
            success: true, 
            data: {
              success: true,
              ast: state.ast || [],
              csgTree: state.csgTree,
              r3fResult: state.r3fResult,
              meshes: state.meshes,
              scene: state.scene,
              errors: state.errors,
              warnings: state.warnings,
              metrics: state.metrics
            } as PipelineResult
          };
        }

        // Start processing
        set(state => ({
          ...state,
          status: 'processing',
          isProcessing: true,
          currentCode: code,
          progress: {
            stage: 'parsing',
            progress: 0,
            message: 'Starting pipeline...',
            timeElapsed: 0
          },
          errors: [],
          warnings: [],
          debounceTimeout: null
        }));

        // Process through pipeline
        const result = await processOpenSCADPipeline(
          code,
          state.config,
          // Progress callback
          (progress) => {
            set(state => ({
              ...state,
              progress
            }));
          },
          // Error callback
          (error, stage) => {
            if (state.config.enableLogging) {
              console.warn(`[Pipeline Store] Error in ${stage}:`, error);
            }
          }
        );

        // Update state with results
        set(state => ({
          ...state,
          status: result.success ? 'success' : 'error',
          isProcessing: false,
          lastProcessedCode: code,
          ast: result.ast || null,
          csgTree: result.csgTree || null,
          r3fResult: result.r3fResult || null,
          meshes: result.meshes,
          scene: result.scene || null,
          progress: {
            stage: 'complete',
            progress: 100,
            message: result.success ? 'Pipeline completed successfully' : 'Pipeline completed with errors',
            timeElapsed: result.metrics.totalTime
          },
          errors: result.errors,
          warnings: result.warnings,
          metrics: result.metrics
        }));

        if (result.success) {
          return { success: true, data: result };
        } else {
          return { success: false, error: result.errors };
        }

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown processing error';
        const pipelineError: PipelineError = {
          stage: 'complete',
          message: `Pipeline processing failed: ${errorMessage}`,
          code: 'PROCESSING_ERROR',
          severity: 'error'
        };

        set(state => ({
          ...state,
          status: 'error',
          isProcessing: false,
          progress: null,
          errors: [pipelineError],
          debounceTimeout: null
        }));

        return { success: false, error: [pipelineError] };
      }
    },

    setCode: (code: string) => {
      set(state => ({
        ...state,
        currentCode: code
      }));
    },

    setConfig: (newConfig: Partial<PipelineConfig>) => {
      set(state => ({
        ...state,
        config: { ...state.config, ...newConfig }
      }));
    },

    // ========================================================================
    // State Management Actions
    // ========================================================================

    clearErrors: () => {
      set(state => ({
        ...state,
        errors: []
      }));
    },

    clearWarnings: () => {
      set(state => ({
        ...state,
        warnings: []
      }));
    },

    reset: () => {
      const state = get();
      
      // Clear timeout
      if (state.debounceTimeout) {
        clearTimeout(state.debounceTimeout);
      }

      // Dispose of Three.js resources
      if (state.scene) {
        state.scene.traverse((object) => {
          if (object instanceof THREE.Mesh) {
            if (object.geometry) object.geometry.dispose();
            if (object.material) {
              if (Array.isArray(object.material)) {
                object.material.forEach(mat => mat.dispose());
              } else {
                object.material.dispose();
              }
            }
          }
        });
      }

      set({
        ...DEFAULT_STATE,
        config: state.config // Preserve configuration
      });
    },

    dispose: () => {
      const state = get();
      
      // Clear timeout
      if (state.debounceTimeout) {
        clearTimeout(state.debounceTimeout);
      }

      // Dispose of Three.js resources
      if (state.scene) {
        state.scene.traverse((object) => {
          if (object instanceof THREE.Mesh) {
            if (object.geometry) object.geometry.dispose();
            if (object.material) {
              if (Array.isArray(object.material)) {
                object.material.forEach(mat => mat.dispose());
              } else {
                object.material.dispose();
              }
            }
          }
        });
      }

      set(DEFAULT_STATE);
    },

    // ========================================================================
    // Utility Actions
    // ========================================================================

    retryProcessing: async (): Promise<Result<PipelineResult, readonly PipelineError[]>> => {
      const state = get();
      return get().processCode(state.currentCode, true);
    },

    cancelProcessing: () => {
      const state = get();
      
      if (state.debounceTimeout) {
        clearTimeout(state.debounceTimeout);
      }

      set(state => ({
        ...state,
        status: 'idle',
        isProcessing: false,
        progress: null,
        debounceTimeout: null
      }));
    }
  }))
);

// ============================================================================
// Store Selectors
// ============================================================================

/**
 * Selector for pipeline status
 */
export const selectPipelineStatus = (state: PipelineStore) => state.status;

/**
 * Selector for processing state
 */
export const selectIsProcessing = (state: PipelineStore) => state.isProcessing;

/**
 * Selector for current meshes
 */
export const selectMeshes = (state: PipelineStore) => state.meshes;

/**
 * Selector for current scene
 */
export const selectScene = (state: PipelineStore) => state.scene;

/**
 * Selector for errors
 */
export const selectErrors = (state: PipelineStore) => state.errors;

/**
 * Selector for warnings
 */
export const selectWarnings = (state: PipelineStore) => state.warnings;

/**
 * Selector for progress
 */
export const selectProgress = (state: PipelineStore) => state.progress;

/**
 * Selector for metrics
 */
export const selectMetrics = (state: PipelineStore) => state.metrics;

/**
 * Selector for AST data
 */
export const selectAST = (state: PipelineStore) => state.ast;

/**
 * Selector for CSG tree
 */
export const selectCSGTree = (state: PipelineStore) => state.csgTree;

/**
 * Selector for R3F result
 */
export const selectR3FResult = (state: PipelineStore) => state.r3fResult;

// ============================================================================
// Store Hooks
// ============================================================================

/**
 * Hook for pipeline processing
 */
export const usePipelineProcessing = () => {
  const processCode = usePipelineStore(state => state.processCode);
  const setCode = usePipelineStore(state => state.setCode);
  const isProcessing = usePipelineStore(selectIsProcessing);
  const status = usePipelineStore(selectPipelineStatus);
  const progress = usePipelineStore(selectProgress);
  
  return {
    processCode,
    setCode,
    isProcessing,
    status,
    progress
  };
};

/**
 * Hook for pipeline results
 */
export const usePipelineResults = () => {
  const meshes = usePipelineStore(selectMeshes);
  const scene = usePipelineStore(selectScene);
  const ast = usePipelineStore(selectAST);
  const csgTree = usePipelineStore(selectCSGTree);
  const r3fResult = usePipelineStore(selectR3FResult);
  const metrics = usePipelineStore(selectMetrics);
  
  return {
    meshes,
    scene,
    ast,
    csgTree,
    r3fResult,
    metrics
  };
};

/**
 * Hook for pipeline errors and warnings
 */
export const usePipelineErrors = () => {
  const errors = usePipelineStore(selectErrors);
  const warnings = usePipelineStore(selectWarnings);
  const clearErrors = usePipelineStore(state => state.clearErrors);
  const clearWarnings = usePipelineStore(state => state.clearWarnings);
  
  return {
    errors,
    warnings,
    clearErrors,
    clearWarnings
  };
};

/**
 * Hook for complete pipeline management
 */
export const usePipelineManager = () => {
  const store = usePipelineStore();

  return {
    // State
    status: store.status,
    isProcessing: store.isProcessing,
    currentCode: store.currentCode,
    progress: store.progress,

    // Data
    meshes: store.meshes,
    scene: store.scene,
    ast: store.ast,
    csgTree: store.csgTree,
    r3fResult: store.r3fResult,

    // Errors and metrics
    errors: store.errors,
    warnings: store.warnings,
    metrics: store.metrics,

    // Actions
    processCode: store.processCode,
    setCode: store.setCode,
    setConfig: store.setConfig,
    clearErrors: store.clearErrors,
    clearWarnings: store.clearWarnings,
    reset: store.reset,
    dispose: store.dispose,
    retryProcessing: store.retryProcessing,
    cancelProcessing: store.cancelProcessing
  };
};

// ============================================================================
// Default Export
// ============================================================================

export default usePipelineStore;
