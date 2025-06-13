/**
 * @file Use Pipeline Initialization Hook
 * 
 * Focused hook for managing pipeline initialization state.
 * Following Single Responsibility Principle.
 * 
 * @author Luciano Júnior
 * @date June 2025
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { PipelineService, getPipelineService } from '../services/pipeline-service';
import { PipelineConfig } from '../types/processing-types';

/**
 * Hook state for pipeline initialization
 */
export interface UsePipelineInitializationState {
  readonly isInitializing: boolean;
  readonly isReady: boolean;
  readonly error: string | null;
  readonly initializePipeline: () => Promise<void>;
  readonly resetPipeline: () => void;
}

/**
 * Hook for managing pipeline initialization
 * 
 * This hook encapsulates all pipeline initialization logic,
 * providing a clean interface for components.
 * 
 * @param config - Optional pipeline configuration
 * @returns Pipeline initialization state and actions
 */
export function usePipelineInitialization(
  config?: PipelineConfig
): UsePipelineInitializationState {
  const [isInitializing, setIsInitializing] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Keep a reference to the pipeline service
  const pipelineServiceRef = useRef<PipelineService | null>(null);
  const initializationRef = useRef<Promise<void> | null>(null);

  /**
   * Get or create pipeline service instance
   */
  const getPipelineServiceInstance = useCallback(() => {
    if (!pipelineServiceRef.current) {
      pipelineServiceRef.current = getPipelineService(config);
    }
    return pipelineServiceRef.current;
  }, [config]);

  /**
   * Initialize the pipeline
   */
  const initializePipeline = useCallback(async (): Promise<void> => {
    console.log('[usePipelineInitialization] 🚀 Starting pipeline initialization...');
    
    // Prevent multiple simultaneous initializations
    if (initializationRef.current) {
      console.log('[usePipelineInitialization] Pipeline initialization already in progress');
      return initializationRef.current;
    }

    const initPromise = (async () => {
      try {
        setIsInitializing(true);
        setError(null);
        
        const pipelineService = getPipelineServiceInstance();
        const initResult = await pipelineService.initialize();

        if (initResult.success) {
          setIsReady(true);
          console.log('[usePipelineInitialization] ✅ Pipeline initialized successfully');
        } else {
          throw new Error(initResult.error || 'Unknown initialization error');
        }
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown initialization error';
        console.error('[usePipelineInitialization] ❌ Pipeline initialization failed:', errorMessage);
        
        setError(errorMessage);
        setIsReady(false);
      } finally {
        setIsInitializing(false);
        initializationRef.current = null;
      }
    })();

    initializationRef.current = initPromise;
    return initPromise;
  }, [getPipelineServiceInstance]);

  /**
   * Reset the pipeline
   */
  const resetPipeline = useCallback(() => {
    console.log('[usePipelineInitialization] 🔄 Resetting pipeline...');
    
    const pipelineService = getPipelineServiceInstance();
    pipelineService.reset();
    
    setIsReady(false);
    setError(null);
    setIsInitializing(false);
    
    // Cancel any ongoing initialization
    if (initializationRef.current) {
      initializationRef.current = Promise.resolve();
    }
  }, [getPipelineServiceInstance]);

  // Initialize on mount
  useEffect(() => {
    void initializePipeline();
  }, [initializePipeline]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (initializationRef.current) {
        initializationRef.current = Promise.resolve();
      }
    };
  }, []);

  return {
    isInitializing,
    isReady,
    error,
    initializePipeline,
    resetPipeline
  };
}

/**
 * Get the pipeline service instance (for use by other hooks)
 * 
 * @param config - Optional configuration
 * @returns Pipeline service instance
 */
export const usePipelineService = (config?: PipelineConfig): PipelineService => {
  const pipelineServiceRef = useRef<PipelineService | null>(null);

  if (!pipelineServiceRef.current) {
    pipelineServiceRef.current = getPipelineService(config);
  }

  return pipelineServiceRef.current;
};
