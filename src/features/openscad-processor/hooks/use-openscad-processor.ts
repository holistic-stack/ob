/**
 * @file Use OpenSCAD Processor Hook (Refactored)
 * 
 * Main orchestrating hook for OpenSCAD processing following bulletproof-react patterns.
 * This hook composes smaller, focused hooks and services to provide a clean API.
 * 
 * Benefits of this refactoring:
 * - Single Responsibility: Each hook/service has one clear purpose
 * - Open/Closed: Easy to extend without modifying existing code
 * - Dependency Inversion: Uses abstractions (services) instead of concrete implementations
 * - DRY: Pure functions and services are reusable
 * - Testable: Each component can be tested independently
 * 
 * @author Luciano Júnior
 * @date June 2025
 */

import { useCallback, useMemo } from 'react';
import { OpenSCADProcessorState, PipelineConfig } from '../types/processing-types';
import { usePipelineInitialization, usePipelineService } from './use-pipeline-initialization';
import { useProcessingStats } from './use-processing-stats';
import { useProcessingState } from './use-processing-state';
import { createProcessingService } from '../services/processing-service';
import { convertResultToMeshes } from '../utils/geometry-converter';

/**
 * Main OpenSCAD processor hook
 * 
 * This hook orchestrates all OpenSCAD processing functionality by composing
 * smaller, focused hooks and services. It provides the same API as the original
 * hook but with much better separation of concerns.
 * 
 * @param config - Optional pipeline configuration
 * @returns OpenSCAD processor state and actions
 */
export function useOpenSCADProcessor(config?: PipelineConfig): OpenSCADProcessorState {
  console.log('[useOpenSCADProcessor] 🚀 Hook initializing...');

  // ============================================================================
  // HOOK COMPOSITION (Following bulletproof-react patterns)
  // ============================================================================
  
  const pipelineService = usePipelineService(config);
  const { isInitializing, isReady, error: initError, resetPipeline } = usePipelineInitialization(config);
  const { stats, updateStats, resetStats } = useProcessingStats();
  const { 
    isProcessing, 
    result, 
    error: processingError, 
    setResult, 
    setError, 
    setProcessing, 
    resetState,
    createAbortController 
  } = useProcessingState();

  // ============================================================================
  // SERVICE COMPOSITION (Dependency Injection pattern)
  // ============================================================================

  const processingService = useMemo(() => {
    return createProcessingService(pipelineService);
  }, [pipelineService]);

  // ============================================================================
  // DERIVED STATE (Pure computations)
  // ============================================================================

  const meshes = useMemo(() => {
    return result ? convertResultToMeshes(result) : [];
  }, [result]);

  const combinedError = initError || processingError;

  // ============================================================================
  // MAIN PROCESSING FUNCTION (Business Logic)
  // ============================================================================

  /**
   * Process OpenSCAD code
   * 
   * This function orchestrates the entire processing pipeline while
   * maintaining clean separation of concerns.
   */
  const processCode = useCallback(async (code: string): Promise<void> => {
    console.log('[useOpenSCADProcessor] 🔄 processCode called with code length:', code.length);

    // Validation
    if (!code.trim()) {
      console.warn('[useOpenSCADProcessor] Cannot process: empty code');
      return;
    }

    if (!isReady) {
      console.warn('[useOpenSCADProcessor] Cannot process: pipeline not ready');
      return;
    }

    const startTime = Date.now();
    console.log('[useOpenSCADProcessor] 🚀 Starting processing operation');

    // Create abort controller for this operation
    const abortController = createAbortController();
    
    // Set processing state
    setProcessing(true);

    try {
      // Clear previous errors
      setError(null);

      // Process using the service
      const processingResult = await processingService.processCode(code, abortController);

      // Update state with result
      setResult(processingResult);

      // Update statistics
      const processingTime = Date.now() - startTime;
      updateStats(processingTime, processingResult.success);

      console.log(`[useOpenSCADProcessor] ✅ Processing completed in ${processingTime}ms`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown processing error';
      console.error('[useOpenSCADProcessor] ❌ Processing failed:', errorMessage);

      setError(errorMessage);
      
      // Update statistics
      const processingTime = Date.now() - startTime;
      updateStats(processingTime, false);

    } finally {
      // Clear processing state
      setProcessing(false);
      console.log('[useOpenSCADProcessor] Processing operation completed');
    }
  }, [
    isReady, 
    processingService, 
    createAbortController, 
    setProcessing, 
    setError, 
    setResult, 
    updateStats
  ]);

  /**
   * Reset all processor state
   */
  const reset = useCallback(() => {
    console.log('[useOpenSCADProcessor] 🔄 Resetting processor state');
    
    resetState();
    resetStats();
    // Note: We don't reset the pipeline unless explicitly requested
  }, [resetState, resetStats]);

  /**
   * Reset everything including pipeline
   */
  const fullReset = useCallback(() => {
    console.log('[useOpenSCADProcessor] 🔄 Full reset including pipeline');
    
    reset();
    resetPipeline();
  }, [reset, resetPipeline]);

  // ============================================================================
  // RETURN STATE (Clean API)
  // ============================================================================

  return {
    isInitializing,
    isReady,
    isProcessing,
    error: combinedError,
    result,
    meshes,
    stats,
    processCode,
    reset: fullReset
  };
}

// Export the hook as default for backward compatibility
export default useOpenSCADProcessor;
