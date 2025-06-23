/**
 * @file OpenSCAD R3F Integration Hook
 * 
 * React hook that integrates the complete OpenSCAD pipeline with React Three Fiber
 * renderer. Provides seamless data flow from code input to 3D visualization with
 * comprehensive error handling and performance monitoring.
 * 
 * @author OpenSCAD-R3F Pipeline
 * @version 1.0.0
 */

import { useEffect, useCallback, useMemo, useRef } from 'react';
import type * as THREE from 'three';
import { usePipelineManager } from '../stores/pipeline-store';
import type { PipelineConfig, PipelineProgress, PipelineError } from '../core/pipeline-processor';

// ============================================================================
// Hook Types
// ============================================================================

/**
 * Configuration for the OpenSCAD R3F integration
 */
export interface OpenSCADR3FConfig extends PipelineConfig {
  readonly autoProcess?: boolean;
  readonly debounceMs?: number;
  readonly enableAutoUpdate?: boolean;
  readonly onMeshesGenerated?: (meshes: readonly THREE.Mesh[]) => void;
  readonly onSceneReady?: (scene: THREE.Scene) => void;
  readonly onProgress?: (progress: PipelineProgress) => void;
  readonly onError?: (error: PipelineError) => void;
  readonly onComplete?: (success: boolean, metrics: any) => void;
}

/**
 * Result interface for the OpenSCAD R3F integration hook
 */
export interface OpenSCADR3FResult {
  // Processing state
  readonly isProcessing: boolean;
  readonly status: 'idle' | 'processing' | 'success' | 'error';
  readonly progress: PipelineProgress | null;
  
  // Generated data
  readonly meshes: readonly THREE.Mesh[];
  readonly scene: THREE.Scene | null;
  readonly ast: readonly any[] | null;
  readonly csgTree: any | null;
  
  // Error handling
  readonly errors: readonly PipelineError[];
  readonly warnings: readonly PipelineError[];
  readonly hasErrors: boolean;
  readonly hasWarnings: boolean;
  
  // Metrics
  readonly metrics: {
    readonly totalTime: number;
    readonly meshCount: number;
    readonly vertexCount: number;
    readonly triangleCount: number;
    readonly memoryUsage: number;
  };
  
  // Actions
  readonly processCode: (code: string) => Promise<void>;
  readonly retryProcessing: () => Promise<void>;
  readonly clearErrors: () => void;
  readonly clearWarnings: () => void;
  readonly reset: () => void;
  readonly updateConfig: (config: Partial<PipelineConfig>) => void;
}

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_CONFIG: Required<OpenSCADR3FConfig> = {
  autoProcess: true,
  debounceMs: 300,
  enableAutoUpdate: true,
  enableLogging: false,
  enableCaching: true,
  enableOptimization: true,
  timeout: 30000,
  parsingConfig: {
    timeout: 5000,
    maxRetries: 2
  },
  csgConfig: {
    enableValidation: true,
    maxDepth: 50,
    maxNodes: 10000
  },
  r3fConfig: {
    enableCaching: true,
    materialQuality: 'medium',
    enableShadows: true
  }
};

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * OpenSCAD R3F Integration Hook
 * 
 * Provides a complete integration between OpenSCAD code processing and React Three Fiber
 * visualization. Handles the entire pipeline from code input to 3D mesh generation with
 * automatic updates, error handling, and performance monitoring.
 * 
 * @param initialCode - Initial OpenSCAD code to process
 * @param config - Configuration options for the integration
 * @returns Hook result with processing state, generated data, and control functions
 * 
 * @example
 * ```tsx
 * function OpenSCADViewer({ code }: { code: string }) {
 *   const {
 *     isProcessing,
 *     meshes,
 *     scene,
 *     errors,
 *     processCode
 *   } = useOpenSCADR3FIntegration(code, {
 *     autoProcess: true,
 *     enableLogging: true,
 *     onMeshesGenerated: (meshes) => {
 *       console.log('Generated meshes:', meshes);
 *     }
 *   });
 * 
 *   useEffect(() => {
 *     if (code) {
 *       processCode(code);
 *     }
 *   }, [code, processCode]);
 * 
 *   if (isProcessing) return <div>Processing...</div>;
 *   if (errors.length > 0) return <div>Errors: {errors.map(e => e.message).join(', ')}</div>;
 * 
 *   return (
 *     <Canvas>
 *       {meshes.map((mesh, index) => (
 *         <primitive key={index} object={mesh} />
 *       ))}
 *     </Canvas>
 *   );
 * }
 * ```
 */
export function useOpenSCADR3FIntegration(
  initialCode?: string,
  config: OpenSCADR3FConfig = {}
): OpenSCADR3FResult {
  const finalConfig = useMemo(() => ({ ...DEFAULT_CONFIG, ...config }), [config]);
  
  // Pipeline store integration
  const pipeline = usePipelineManager();
  
  // Refs for callback stability
  const callbacksRef = useRef({
    onMeshesGenerated: finalConfig.onMeshesGenerated,
    onSceneReady: finalConfig.onSceneReady,
    onProgress: finalConfig.onProgress,
    onError: finalConfig.onError,
    onComplete: finalConfig.onComplete
  });
  
  // Update callbacks ref when config changes
  useEffect(() => {
    callbacksRef.current = {
      onMeshesGenerated: finalConfig.onMeshesGenerated,
      onSceneReady: finalConfig.onSceneReady,
      onProgress: finalConfig.onProgress,
      onError: finalConfig.onError,
      onComplete: finalConfig.onComplete
    };
  }, [finalConfig]);

  // ========================================================================
  // Configuration Effect
  // ========================================================================

  useEffect(() => {
    pipeline.setConfig({
      enableLogging: finalConfig.enableLogging,
      enableCaching: finalConfig.enableCaching,
      enableOptimization: finalConfig.enableOptimization,
      timeout: finalConfig.timeout,
      parsingConfig: finalConfig.parsingConfig,
      csgConfig: finalConfig.csgConfig,
      r3fConfig: finalConfig.r3fConfig
    });
  }, [pipeline, finalConfig]);

  // ========================================================================
  // Auto-processing Effect
  // ========================================================================

  useEffect(() => {
    if (initialCode && finalConfig.autoProcess && finalConfig.enableAutoUpdate) {
      pipeline.processCode(initialCode, false).catch(console.error);
    }
  }, [initialCode, finalConfig.autoProcess, finalConfig.enableAutoUpdate, pipeline]);

  // ========================================================================
  // Callback Effects
  // ========================================================================

  // Meshes generated callback
  useEffect(() => {
    if (pipeline.meshes.length > 0 && callbacksRef.current.onMeshesGenerated) {
      callbacksRef.current.onMeshesGenerated(pipeline.meshes);
    }
  }, [pipeline.meshes]);

  // Scene ready callback
  useEffect(() => {
    if (pipeline.scene && callbacksRef.current.onSceneReady) {
      callbacksRef.current.onSceneReady(pipeline.scene);
    }
  }, [pipeline.scene]);

  // Progress callback
  useEffect(() => {
    if (pipeline.progress && callbacksRef.current.onProgress) {
      callbacksRef.current.onProgress(pipeline.progress);
    }
  }, [pipeline.progress]);

  // Error callback
  useEffect(() => {
    if (pipeline.errors.length > 0 && callbacksRef.current.onError) {
      const latestError = pipeline.errors[pipeline.errors.length - 1];
      callbacksRef.current.onError(latestError);
    }
  }, [pipeline.errors]);

  // Completion callback
  useEffect(() => {
    if (pipeline.status !== 'processing' && pipeline.status !== 'idle' && callbacksRef.current.onComplete) {
      callbacksRef.current.onComplete(pipeline.status === 'success', pipeline.metrics);
    }
  }, [pipeline.status, pipeline.metrics]);

  // ========================================================================
  // Action Functions
  // ========================================================================

  const processCode = useCallback(async (code: string): Promise<void> => {
    try {
      await pipeline.processCode(code, false);
    } catch (error) {
      if (finalConfig.enableLogging) {
        console.error('[OpenSCAD R3F Integration] Processing failed:', error);
      }
    }
  }, [pipeline, finalConfig.enableLogging]);

  const retryProcessing = useCallback(async (): Promise<void> => {
    try {
      await pipeline.retryProcessing();
    } catch (error) {
      if (finalConfig.enableLogging) {
        console.error('[OpenSCAD R3F Integration] Retry failed:', error);
      }
    }
  }, [pipeline, finalConfig.enableLogging]);

  const updateConfig = useCallback((newConfig: Partial<PipelineConfig>): void => {
    pipeline.setConfig(newConfig);
  }, [pipeline]);

  // ========================================================================
  // Derived State
  // ========================================================================

  const hasErrors = useMemo(() => {
    return pipeline.errors.some(error => error.severity === 'error');
  }, [pipeline.errors]);

  const hasWarnings = useMemo(() => {
    return pipeline.warnings.length > 0;
  }, [pipeline.warnings]);

  // ========================================================================
  // Cleanup Effect
  // ========================================================================

  useEffect(() => {
    return () => {
      // Cleanup is handled by the pipeline store
    };
  }, []);

  // ========================================================================
  // Return Hook Interface
  // ========================================================================

  return {
    // Processing state
    isProcessing: pipeline.isProcessing,
    status: pipeline.status,
    progress: pipeline.progress,
    
    // Generated data
    meshes: pipeline.meshes,
    scene: pipeline.scene,
    ast: pipeline.ast,
    csgTree: pipeline.csgTree,
    
    // Error handling
    errors: pipeline.errors,
    warnings: pipeline.warnings,
    hasErrors,
    hasWarnings,
    
    // Metrics
    metrics: {
      totalTime: pipeline.metrics.totalTime,
      meshCount: pipeline.metrics.meshCount,
      vertexCount: pipeline.metrics.vertexCount,
      triangleCount: pipeline.metrics.triangleCount,
      memoryUsage: pipeline.metrics.memoryUsage
    },
    
    // Actions
    processCode,
    retryProcessing,
    clearErrors: pipeline.clearErrors,
    clearWarnings: pipeline.clearWarnings,
    reset: pipeline.reset,
    updateConfig
  };
}

// ============================================================================
// Hook Variants
// ============================================================================

/**
 * Simplified hook for basic OpenSCAD R3F integration
 */
export function useOpenSCADR3FSimple(code?: string) {
  return useOpenSCADR3FIntegration(code, {
    autoProcess: true,
    enableLogging: false,
    enableAutoUpdate: true
  });
}

/**
 * Hook for OpenSCAD R3F integration with custom callbacks
 */
export function useOpenSCADR3FWithCallbacks(
  code?: string,
  callbacks: {
    onMeshesGenerated?: (meshes: readonly THREE.Mesh[]) => void;
    onProgress?: (progress: PipelineProgress) => void;
    onError?: (error: PipelineError) => void;
  } = {}
) {
  return useOpenSCADR3FIntegration(code, {
    autoProcess: true,
    enableLogging: true,
    enableAutoUpdate: true,
    ...callbacks
  });
}

// ============================================================================
// Default Export
// ============================================================================

export default useOpenSCADR3FIntegration;
