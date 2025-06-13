/**
 * @file useOpenSCADProcessor Hook (React 19 SRP)
 * 
 * Custom hook for processing OpenSCAD code and returning Babylon meshes.
 * Follows React 19 SRP best practices with separated concerns:
 * - Pipeline management
 * - Code processing
 * - Statistics tracking
 * - Mesh creation
 * - Optimistic UI updates
 * 
 * @author Luciano Júnior
 * @date June 2025
 */

import { useState, useCallback, useRef, useEffect, useMemo, useOptimistic, startTransition } from 'react';
import { OpenScadPipeline } from '../../babylon-csg2/openscad-pipeline/openscad-pipeline';
import { PipelineResult, MeshGeometryData, PipelineMetadata, createPipelineSuccess, createPipelineFailure } from '../../types/pipeline-types';

// ============================================================================
// PURE FUNCTIONAL UTILITIES (DRY Principle)
// ============================================================================

/**
 * Processing statistics - immutable data structure
 */
export interface ProcessingStats {
  readonly totalRuns: number;
  readonly successCount: number;
  readonly errorCount: number;
  readonly averageTime: number;
}

/**
 * Mesh data structure for Babylon.js integration
 */
export interface ProcessedMesh {
  readonly name: string;
  readonly positions: Float32Array | null;
  readonly normals: Float32Array | null;
  readonly indices: Uint16Array | null;
  readonly uvs: Float32Array | null;
  readonly materialData: {
    readonly diffuseColor: readonly [number, number, number];
    readonly specularColor: readonly [number, number, number];
    readonly emissiveColor: readonly [number, number, number];
  } | null;
}

/**
 * Hook state interface
 */
export interface OpenSCADProcessorState {
  readonly isInitializing: boolean;
  readonly isReady: boolean;
  readonly isProcessing: boolean;
  readonly error: string | null;
  readonly result: PipelineResult<MeshGeometryData | MeshGeometryData[]> | null;
  readonly meshes: readonly ProcessedMesh[];
  readonly stats: ProcessingStats;
  readonly processCode: (code: string) => Promise<void>;
  readonly reset: () => void;
}

/**
 * Pure function to create initial processing stats
 */
const createInitialStats = (): ProcessingStats => ({
  totalRuns: 0,
  successCount: 0,
  errorCount: 0,
  averageTime: 0
});

/**
 * Pure function to update processing stats
 */
const updateProcessingStats = (
  stats: ProcessingStats,
  processingTime: number,
  success: boolean
): ProcessingStats => ({
  totalRuns: stats.totalRuns + 1,
  successCount: stats.successCount + (success ? 1 : 0),
  errorCount: stats.errorCount + (success ? 0 : 1),
  averageTime: (stats.averageTime * stats.totalRuns + processingTime) / (stats.totalRuns + 1)
});

/**
 * Pure function to convert geometry data to processed mesh
 */
const convertGeometryToMesh = (geometryData: MeshGeometryData): ProcessedMesh => ({
  name: geometryData.name,
  positions: geometryData.positions ? new Float32Array(geometryData.positions) : null,
  normals: geometryData.normals ? new Float32Array(geometryData.normals) : null,
  indices: geometryData.indices ? new Uint16Array(geometryData.indices) : null,
  uvs: geometryData.uvs ? new Float32Array(geometryData.uvs) : null,
  materialData: geometryData.materialData
});

/**
 * Pure function to convert result to meshes array
 */
const convertResultToMeshes = (result: PipelineResult<MeshGeometryData | MeshGeometryData[]>): readonly ProcessedMesh[] => {
  if (!result.success || !result.value) {
    return [];
  }

  if (Array.isArray(result.value)) {
    return result.value.map(convertGeometryToMesh);
  }

  return [convertGeometryToMesh(result.value)];
};

// ============================================================================
// CUSTOM HOOKS (SRP - Single Responsibility Principle)
// ============================================================================

/**
 * Custom hook for pipeline initialization (SRP: Pipeline Management)
 */
const usePipelineInitialization = () => {
  const [isInitializing, setIsInitializing] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pipeline, setPipeline] = useState<OpenScadPipeline | null>(null);
  const initializationRef = useRef<Promise<void> | null>(null);

  const initializePipeline = useCallback(async (): Promise<void> => {
    console.log('[INIT] 🚀 Starting pipeline initialization...');
    
    // Prevent multiple simultaneous initializations
    if (initializationRef.current) {
      console.log('[DEBUG] Pipeline initialization already in progress');
      return initializationRef.current;
    }

    const startTime = Date.now();
    
    const initPromise = (async () => {
      try {
        setIsInitializing(true);
        setError(null);
        
        console.log('[DEBUG] Creating OpenScadPipeline instance...');
        const pipelineInstance = new OpenScadPipeline({
          enableLogging: true,
          enableMetrics: true,
          csg2Timeout: 5000
        });

        console.log('[DEBUG] ✅ Pipeline instance created, initializing...');

        // Initialize the pipeline (required before use)
        const initResult = await pipelineInstance.initialize();
        if (!initResult.success) {
          throw new Error(`Pipeline initialization failed: ${initResult.error}`);
        }

        console.log('[DEBUG] ✅ Pipeline initialized successfully');
        
        const initializationTime = Date.now() - startTime;
        setPipeline(pipelineInstance);
        setIsReady(true);
        setIsInitializing(false);
        
        console.log(`[END] ✅ Pipeline initialized successfully in ${initializationTime}ms`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown initialization error';
        console.error('[ERROR] ❌ Pipeline initialization failed:', errorMessage);
        
        setError(errorMessage);
        setIsReady(false);
        setIsInitializing(false);
      } finally {
        initializationRef.current = null;
      }
    })();

    initializationRef.current = initPromise;
    return initPromise;
  }, []);

  // Initialize on mount
  useEffect(() => {
    void initializePipeline();
  }, [initializePipeline]);

  return {
    isInitializing,
    isReady,
    error,
    pipeline,
    initializePipeline
  };
};

/**
 * Custom hook for processing statistics (SRP: Statistics Management)
 */
const useProcessingStats = () => {
  const [stats, setStats] = useState<ProcessingStats>(createInitialStats);

  const updateStats = useCallback((processingTime: number, success: boolean) => {
    setStats(prev => updateProcessingStats(prev, processingTime, success));
  }, []);

  const resetStats = useCallback(() => {
    setStats(createInitialStats());
  }, []);

  return {
    stats,
    updateStats,
    resetStats
  };
};

/**
 * Main OpenSCAD processor hook
 */
export function useOpenSCADProcessor(): OpenSCADProcessorState {
  console.log('[DEBUG] 🚀 useOpenSCADProcessor hook initializing...');

  // ============================================================================
  // HOOK COMPOSITION (SRP)
  // ============================================================================
  
  const { isInitializing, isReady, error: initError, pipeline } = usePipelineInitialization();
  const { stats, updateStats, resetStats } = useProcessingStats();
  
  // ============================================================================
  // LOCAL STATE
  // ============================================================================
  
  const [result, setResult] = useState<PipelineResult<MeshGeometryData | MeshGeometryData[]> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // React 19 useOptimistic for immediate UI feedback
  const [isProcessing, setOptimisticProcessing] = useOptimistic(
    false,
    (currentProcessing: boolean, optimisticProcessing: boolean) => {
      console.log('[DEBUG] 🔄 Optimistic processing update:', optimisticProcessing);
      return optimisticProcessing;
    }
  );

  // Local processing state for immediate feedback
  const [localProcessing, setLocalProcessing] = useState(false);

  // ============================================================================
  // DERIVED STATE
  // ============================================================================

  const meshes = useMemo(() => {
    return result ? convertResultToMeshes(result) : [];
  }, [result]);

  const combinedError = initError || error;

  // Combined processing state (optimistic + local)
  const finalIsProcessing = isProcessing || localProcessing;

  // ============================================================================
  // PROCESSING FUNCTIONS
  // ============================================================================

  /**
   * Pure function to process OpenSCAD code
   */
  const processOpenSCADCode = useCallback(async (
    code: string,
    pipelineInstance: OpenScadPipeline
  ): Promise<PipelineResult<MeshGeometryData | MeshGeometryData[]>> => {
    console.log('[INIT] 🔄 Starting OpenSCAD processing...');

    try {
      // Process with the pipeline
      const result = await pipelineInstance.processOpenScadCodeToGeometry(code);

      if (result.success) {
        console.log('[DEBUG] ✅ Pipeline processing successful');
        return result;
      } else {
        throw new Error(`Processing failed: ${result.error || 'No valid result'}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown processing error';
      console.error('[ERROR] ❌ Pipeline processing failed:', errorMessage);

      return createPipelineFailure<MeshGeometryData | MeshGeometryData[]>(errorMessage);
    }
  }, []);

  /**
   * Main processing function
   */
  const processCode = useCallback(async (code: string): Promise<void> => {
    console.log('[DEBUG] 🔄 processCode called with code length:', code.length);

    if (!code.trim()) {
      console.warn('[WARN] Cannot process: empty code');
      return;
    }

    if (!isReady || !pipeline) {
      console.warn('[WARN] Cannot process: pipeline not ready');
      return;
    }

    // Cancel any ongoing processing
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    const startTime = Date.now();
    console.log('[INIT] 🚀 Starting processing operation');

    // Set immediate processing state
    setLocalProcessing(true);

    // React 19 useOptimistic - immediate UI feedback
    startTransition(() => {
      setOptimisticProcessing(true);
    });

    try {
      // Clear previous errors
      setError(null);

      // Process using the pure function
      const processingResult = await processOpenSCADCode(code, pipeline);

      // Update state with result
      setResult(processingResult);

      // Update statistics
      const processingTime = Date.now() - startTime;
      updateStats(processingTime, processingResult.success);

      console.log(`[END] ✅ Processing completed in ${processingTime}ms`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown processing error';
      console.error('[ERROR] ❌ Processing failed:', errorMessage);

      setError(errorMessage);
      
      // Update statistics
      const processingTime = Date.now() - startTime;
      updateStats(processingTime, false);

      // Create error result
      const errorResult = createPipelineFailure<MeshGeometryData | MeshGeometryData[]>(errorMessage);
      setResult(errorResult);

    } finally {
      // Clear processing states
      setLocalProcessing(false);

      // Update optimistic state
      startTransition(() => {
        setOptimisticProcessing(false);
      });

      abortControllerRef.current = null;
      console.log('[END] Processing operation completed');
    }
  }, [isReady, pipeline, processOpenSCADCode, updateStats]);

  /**
   * Reset function
   */
  const reset = useCallback(() => {
    console.log('[DEBUG] 🔄 Resetting processor state');
    
    setResult(null);
    setError(null);
    resetStats();
    
    // Cancel any ongoing processing
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, [resetStats]);

  return {
    isInitializing,
    isReady,
    isProcessing: finalIsProcessing,
    error: combinedError,
    result,
    meshes,
    stats,
    processCode,
    reset
  };
}
