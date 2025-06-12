/**
 * @file Modern Pipeline Processor Component (React 19)
 * 
 * A React 19 compatible pipeline processor following modern patterns:
 * - React 19 useOptimistic for immediate UI feedback
 * - Functional programming with pure functions
 * - SRP with separated concerns
 * - Custom hooks for state management
 * - Proper error boundaries and recovery
 * 
 * @author Luciano Júnior
 * @date June 2025
 */

import React, { useOptimistic, useCallback, useRef, useEffect, useState, useMemo, startTransition } from 'react';
import * as BABYLON from '@babylonjs/core';
import { OpenScadPipeline } from '../../babylon-csg2/openscad-pipeline/openscad-pipeline';
import { PipelineProcessorProps as BasePipelineProcessorProps, PipelineResult as _PipelineResult, createPipelineSuccess, createPipelineFailure } from '../../types/pipeline-types';

// ============================================================================
// PURE FUNCTIONAL UTILITIES (Following Functional Programming Guidelines)
// ============================================================================

/**
 * Pipeline initialization state - immutable data structure
 */
interface PipelineState {
  readonly status: 'initializing' | 'ready' | 'error';
  readonly pipeline: OpenScadPipeline | null;
  readonly error: string | null;
  readonly initializationTime: number;
}

/**
 * Processing statistics - immutable data structure
 */
interface ProcessingStats {
  readonly totalRuns: number;
  readonly successCount: number;
  readonly errorCount: number;
  readonly averageTime: number;
}

/**
 * Processing operation state for useOptimistic
 */
interface ProcessingOperation {
  readonly id: string;
  readonly code: string;
  readonly status: 'pending' | 'processing' | 'success' | 'error';
  readonly startTime: number;
  readonly result?: _PipelineResult;
  readonly error?: string;
}

/**
 * Pure function to create initial pipeline state
 */
const createInitialPipelineState = (): PipelineState => ({
  status: 'initializing',
  pipeline: null,
  error: null,
  initializationTime: 0
});

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
 * Pure function to create processing operation
 */
const createProcessingOperation = (code: string): ProcessingOperation => ({
  id: `proc_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
  code,
  status: 'pending',
  startTime: Date.now()
});

// ============================================================================
// CUSTOM HOOKS (SRP - Single Responsibility Principle)
// ============================================================================

/**
 * Custom hook for pipeline initialization (SRP: Pipeline Management)
 */
const usePipelineInitialization = () => {
  const [pipelineState, setPipelineState] = useState<PipelineState>(createInitialPipelineState);
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
        setPipelineState(prev => ({ ...prev, status: 'initializing' }));
        
        console.log('[DEBUG] Creating OpenScadPipeline instance...');
        const pipeline = new OpenScadPipeline({
          enableLogging: true,
          enableMetrics: true,
          csg2Timeout: 5000
        });

        console.log('[DEBUG] ✅ Pipeline instance created, initializing...');

        // Initialize the pipeline (required before use)
        const initResult = await pipeline.initialize();
        if (!initResult.success) {
          throw new Error(`Pipeline initialization failed: ${initResult.error}`);
        }

        console.log('[DEBUG] ✅ Pipeline initialized successfully');
        
        const initializationTime = Date.now() - startTime;
        setPipelineState({
          status: 'ready',
          pipeline,
          error: null,
          initializationTime
        });
        
        console.log(`[END] ✅ Pipeline initialized successfully in ${initializationTime}ms`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown initialization error';
        console.error('[ERROR] ❌ Pipeline initialization failed:', errorMessage);
        
        setPipelineState({
          status: 'error',
          pipeline: null,
          error: errorMessage,
          initializationTime: Date.now() - startTime
        });
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
    pipelineState,
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

  return {
    stats,
    updateStats
  };
};

/**
 * Modern pipeline processor with React 19 patterns
 */
interface PipelineProcessorProps extends BasePipelineProcessorProps {
  readonly onProcessingEnd?: () => void;
  readonly autoProcess?: boolean;
}

export function PipelineProcessor({
  openscadCode,
  onResult,
  onProcessingStart,
  onProcessingEnd,
  autoProcess = false
}: PipelineProcessorProps): React.JSX.Element {
  console.log('[DEBUG] 🚀 PipelineProcessor component rendering...');

  // ============================================================================
  // REACT 19 HOOKS AND STATE MANAGEMENT
  // ============================================================================
  
  // Custom hooks for separated concerns
  const { pipelineState } = usePipelineInitialization();
  const { stats, updateStats } = useProcessingStats();
  
  // React 19 useOptimistic for immediate UI feedback
  const [operations, setOptimisticOperations] = useOptimistic<ProcessingOperation[], ProcessingOperation>(
    [],
    (currentOperations, optimisticOperation) => {
      console.log('[DEBUG] 🔄 Optimistic update:', optimisticOperation.status);
      return [...currentOperations.filter(op => op.id !== optimisticOperation.id), optimisticOperation];
    }
  );

  // Local state for UI
  const [lastProcessedCode, setLastProcessedCode] = useState<string>('');
  const abortControllerRef = useRef<AbortController | null>(null);

  // Derived state using useMemo for performance
  const isProcessing = useMemo(() => 
    operations.some(op => op.status === 'processing'), 
    [operations]
  );

  const canProcess = useMemo(() =>
    openscadCode.trim().length > 0 && pipelineState.status === 'ready',
    [openscadCode, pipelineState.status]
  );

  // Debug logging after variables are declared
  console.log('[DEBUG] Pipeline state:', pipelineState.status);
  console.log('[DEBUG] OpenSCAD code length:', openscadCode.length);
  console.log('[DEBUG] Can process:', canProcess);
  console.log('[DEBUG] Is processing:', isProcessing);

  // ============================================================================
  // PURE PROCESSING FUNCTIONS (Functional Programming)
  // ============================================================================

  /**
   * Pure function to process OpenSCAD code
   */
  const processOpenSCADCode = useCallback(async (
    code: string,
    pipeline: OpenScadPipeline,
    operation: ProcessingOperation
  ): Promise<_PipelineResult> => {
    console.log('[INIT] 🔄 Starting OpenSCAD processing...');

    try {
      // Create a dedicated scene for processing
      const engine = new BABYLON.NullEngine();
      const scene = new BABYLON.Scene(engine);
      scene.clearColor = new BABYLON.Color4(0, 0, 0, 0);

      // Process with the pipeline
      const result = await pipeline.processOpenScadCode(code, scene);

      if (result.success) {
        console.log('[DEBUG] ✅ Pipeline processing successful');

        const processingTime = Date.now() - operation.startTime;

        // Return the actual mesh from the pipeline (or null if no mesh was generated)
        const resultMesh = result.value || null;

        if (resultMesh) {
          console.log('[DEBUG] ✅ Mesh generated successfully:', resultMesh.name);
        } else {
          console.log('[DEBUG] ⚠️ No mesh generated (empty result)');
        }

        // Clean up the processing scene after a delay
        setTimeout(() => {
          scene.dispose();
          engine.dispose();
        }, 1000);

        return createPipelineSuccess(resultMesh, {
          parseTimeMs: result.metadata?.parseTimeMs ?? 0,
          visitTimeMs: result.metadata?.visitTimeMs ?? 0,
          totalTimeMs: processingTime,
          nodeCount: result.metadata?.nodeCount ?? 1,
          meshCount: result.metadata?.meshCount ?? (resultMesh ? 1 : 0)
        });
      } else {
        throw new Error(`Processing failed: ${result.error || 'No valid result'}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown processing error';
      console.error('[ERROR] ❌ Pipeline processing failed:', errorMessage);

      const processingTime = Date.now() - operation.startTime;
      return createPipelineFailure<BABYLON.Mesh | null>(errorMessage, {
        parseTimeMs: 0,
        visitTimeMs: 0,
        totalTimeMs: processingTime,
        nodeCount: 0,
        meshCount: 0
      });
    }
  }, []);

  /**
   * Main processing function using React 19 useOptimistic
   */
  const processCode = useCallback(async (code: string): Promise<void> => {
    if (!code.trim() || pipelineState.status !== 'ready' || !pipelineState.pipeline) {
      console.warn('[WARN] Cannot process: empty code or pipeline not ready');
      return;
    }

    // Cancel any ongoing processing
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    // Create operation and start optimistic update
    const operation = createProcessingOperation(code);
    console.log('[INIT] 🚀 Starting processing operation:', operation.id);

    // React 19 useOptimistic - immediate UI feedback (wrapped in startTransition)
    startTransition(() => {
      setOptimisticOperations({ ...operation, status: 'processing' });
    });
    onProcessingStart();

    try {
      // Process using the pure function
      const result = await processOpenSCADCode(code, pipelineState.pipeline, operation);

      // Update optimistic state with success (wrapped in startTransition)
      startTransition(() => {
        setOptimisticOperations({
          ...operation,
          status: 'success',
          result
        });
      });

      // Update statistics
      const processingTime = Date.now() - operation.startTime;
      updateStats(processingTime, result.success);

      // Update last processed code
      setLastProcessedCode(code);

      // Notify parent component
      onResult(result);

      console.log(`[END] ✅ Processing completed successfully in ${processingTime}ms`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown processing error';
      console.error('[ERROR] ❌ Processing failed:', errorMessage);

      // Update optimistic state with error (wrapped in startTransition)
      startTransition(() => {
        setOptimisticOperations({
          ...operation,
          status: 'error',
          error: errorMessage
        });
      });

      // Update statistics
      const processingTime = Date.now() - operation.startTime;
      updateStats(processingTime, false);

      // Create error result
      const errorResult = createPipelineFailure<BABYLON.Mesh | null>(errorMessage, {
        parseTimeMs: 0,
        visitTimeMs: 0,
        totalTimeMs: processingTime,
        nodeCount: 0,
        meshCount: 0
      });

      onResult(errorResult);

    } finally {
      onProcessingEnd?.();
      abortControllerRef.current = null;
      console.log('[END] Processing operation completed');
    }
  }, [pipelineState, processOpenSCADCode, updateStats, onResult, onProcessingStart, onProcessingEnd]);

  // ============================================================================
  // EVENT HANDLERS (React 19 Patterns)
  // ============================================================================

  // Auto-process when code changes (with debouncing)
  useEffect(() => {
    if (autoProcess && openscadCode !== lastProcessedCode && !isProcessing && canProcess) {
      const timeoutId = setTimeout(() => {
        void processCode(openscadCode).catch(error => {
          console.error('[ERROR] Auto-process failed:', error);
        });
      }, 500); // Debounce auto-processing

      return () => clearTimeout(timeoutId);
    }
    return undefined;
  }, [autoProcess, openscadCode, lastProcessedCode, isProcessing, canProcess, processCode]);

  // Manual process handler
  const handleManualProcess = useCallback(() => {
    console.log('[DEBUG] 🔘 Manual process button clicked');
    console.log('[DEBUG] canProcess:', canProcess);
    console.log('[DEBUG] isProcessing:', isProcessing);
    console.log('[DEBUG] openscadCode:', openscadCode);
    console.log('[DEBUG] pipelineState.status:', pipelineState.status);

    if (canProcess && !isProcessing) {
      console.log('[DEBUG] ✅ Starting manual processing...');
      void processCode(openscadCode).catch(error => {
        console.error('[ERROR] Manual process failed:', error);
      });
    } else {
      console.warn('[WARN] Cannot process - conditions not met');
    }
  }, [openscadCode, canProcess, isProcessing, processCode, pipelineState.status]);

  // Cancel processing
  const handleCancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  // ============================================================================
  // RENDER (React 19 JSX)
  // ============================================================================

  return (
    <div className="pipeline-processor">
      <div className="processor-header">
        <h3>React 19 Pipeline Processor</h3>
        <div className="processor-stats">
          <span>Runs: {stats.totalRuns}</span>
          <span>Success: {stats.successCount}</span>
          <span>Errors: {stats.errorCount}</span>
          <span>Avg Time: {Math.round(stats.averageTime)}ms</span>
        </div>
      </div>

      <div className="processor-controls">
        <button
          onClick={handleManualProcess}
          disabled={!canProcess || isProcessing}
          className={`process-button ${isProcessing ? 'processing' : ''}`}
        >
          {isProcessing ? (
            <>
              <span className="spinner">⟳</span>
              Processing...
            </>
          ) : (
            'Process OpenSCAD Code'
          )}
        </button>

        {isProcessing && (
          <button
            onClick={handleCancel}
            className="cancel-button"
          >
            Cancel
          </button>
        )}

        <label className="auto-process-toggle">
          <input
            type="checkbox"
            checked={autoProcess}
            onChange={(e) => {
              // This would need to be passed up to parent component
              console.log('Auto-process toggled:', e.target.checked);
            }}
          />
          Auto-process on code change
        </label>
      </div>

      <div className="processor-status">
        {pipelineState.status === 'initializing' && (
          <div className="status-message warning">
            ⚠️ Pipeline initializing...
          </div>
        )}

        {pipelineState.status === 'error' && (
          <div className="status-message error">
            ❌ Pipeline error: {pipelineState.error}
          </div>
        )}

        {pipelineState.status === 'ready' && !canProcess && (
          <div className="status-message info">
            ℹ️ Enter OpenSCAD code to process
          </div>
        )}

        {lastProcessedCode && (
          <div className="status-message success">
            ✓ Last processed: {lastProcessedCode.substring(0, 50)}...
          </div>
        )}

        {/* React 19 useOptimistic - Show current operations */}
        {operations.length > 0 && (
          <div className="operations-status">
            {operations.map(op => (
              <div key={op.id} className={`operation-status ${op.status}`}>
                {op.status === 'processing' && '🔄 Processing...'}
                {op.status === 'success' && '✅ Success'}
                {op.status === 'error' && `❌ Error: ${op.error}`}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
