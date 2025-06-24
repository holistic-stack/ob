/**
 * @file Use Processing State Hook
 * 
 * Focused hook for managing processing state with optimistic updates.
 * Following Single Responsibility Principle and React 19 patterns.
 * 
 * @author Luciano Júnior
 * @date June 2025
 */

import { useState, useCallback, useRef, useOptimistic, startTransition } from 'react';
import type { PipelineResult } from '../../openscad-pipeline/core/pipeline-processor';
import type { GeneratedMesh as _GeneratedMesh } from '../../r3f-generator/types/r3f-generator-types';

/**
 * Hook state for processing operations
 */
export interface UseProcessingStateState {
  readonly isProcessing: boolean;
  readonly result: PipelineResult | null;
  readonly error: string | null;
  readonly setResult: (result: PipelineResult) => void;
  readonly setError: (error: string | null) => void;
  readonly setProcessing: (processing: boolean) => void;
  readonly resetState: () => void;
  readonly createAbortController: () => AbortController;
  readonly abortCurrentOperation: () => void;
}

/**
 * Hook for managing processing state with optimistic updates
 * 
 * This hook handles all processing state management including
 * optimistic updates for better UX.
 * 
 * @returns Processing state and actions
 */
export function useProcessingState(): UseProcessingStateState {
  const [result, setResult] = useState<PipelineResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // React 19 useOptimistic for immediate UI feedback
  const [isProcessing, setOptimisticProcessing] = useOptimistic(
    false,
    (currentProcessing: boolean, optimisticProcessing: boolean) => {
      console.log('[useProcessingState] 🔄 Optimistic processing update:', optimisticProcessing);
      return optimisticProcessing;
    }
  );

  // Local processing state for immediate feedback
  const [localProcessing, setLocalProcessing] = useState(false);

  // Combined processing state (optimistic + local)
  const finalIsProcessing = isProcessing || localProcessing;

  /**
   * Set processing state with optimistic updates
   * 
   * @param processing - Whether processing is active
   */
  const setProcessing = useCallback((processing: boolean) => {
    console.log('[useProcessingState] 🔄 Setting processing state:', processing);
    
    // Set immediate processing state
    setLocalProcessing(processing);

    // Update optimistic state
    startTransition(() => {
      setOptimisticProcessing(processing);
    });
  }, [setOptimisticProcessing]);

  /**
   * Create a new abort controller for the current operation
   * 
   * @returns New abort controller
   */
  const createAbortController = useCallback((): AbortController => {
    // Cancel any existing operation
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    return abortController;
  }, []);

  /**
   * Abort the current operation
   */
  const abortCurrentOperation = useCallback(() => {
    console.log('[useProcessingState] ⚠️ Aborting current operation...');
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    setProcessing(false);
  }, [setProcessing]);

  /**
   * Reset all processing state
   */
  const resetState = useCallback(() => {
    console.log('[useProcessingState] 🔄 Resetting processing state...');
    
    setResult(null);
    setError(null);
    setProcessing(false);
    
    // Cancel any ongoing processing
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, [setProcessing]);

  return {
    isProcessing: finalIsProcessing,
    result,
    error,
    setResult,
    setError,
    setProcessing,
    resetState,
    createAbortController,
    abortCurrentOperation
  };
}
