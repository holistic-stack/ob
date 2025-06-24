/**
 * @file useR3FCSGConverter Hook
 * 
 * React hook for the R3F CSG converter that provides a convenient interface
 * for converting OpenSCAD code to React Three Fiber components within React components.
 * 
 * Features:
 * - React 19 best practices with proper state management
 * - Automatic resource cleanup on unmount
 * - Progress tracking and error handling
 * - Caching and performance optimization
 * - TypeScript strict mode compliance
 * - Functional programming patterns
 * 
 * @author OpenSCAD-R3F Pipeline
 * @version 1.0.0
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { createR3FCSGConverter, type R3FCSGConverter, type R3FCSGConverterConfig, type ConversionResult, type ConverterState, type ProcessingProgress } from '../converter/r3f-csg-converter';
import type { Result } from '../types/r3f-csg-types';

// ============================================================================
// Hook Configuration and Types
// ============================================================================

/**
 * Configuration for the useR3FCSGConverter hook
 */
export interface UseR3FCSGConverterConfig extends R3FCSGConverterConfig {
  readonly autoConvert?: boolean;
  readonly debounceMs?: number;
  readonly retryOnError?: boolean;
  readonly maxRetries?: number;
}

/**
 * Hook return type
 */
export interface UseR3FCSGConverterReturn {
  // Conversion functions
  readonly convertToR3F: (code: string) => Promise<ConversionResult>;
  readonly convertToJSX: (code: string, componentName?: string) => Promise<Result<string, string>>;
  
  // State
  readonly isProcessing: boolean;
  readonly progress: ProcessingProgress | null;
  readonly error: string | null;
  readonly result: ConversionResult | null;
  readonly state: ConverterState;
  
  // Statistics and management
  readonly statistics: {
    readonly conversionCount: number;
    readonly cacheHitRate: number;
    readonly cacheSize: number;
  };
  
  // Control functions
  readonly clearCache: () => void;
  readonly clearError: () => void;
  readonly clearResult: () => void;
  readonly reset: () => void;
}

/**
 * Default hook configuration
 */
const DEFAULT_HOOK_CONFIG: Required<UseR3FCSGConverterConfig> = {
  // Converter config
  pipelineConfig: {
    enableCaching: true,
    enableOptimization: true,
    enableLogging: false,
    enableProgressTracking: true
  },
  enableReactComponents: true,
  enablePerformanceMonitoring: true,
  enableProgressTracking: true,
  enableCaching: true,
  enableLogging: false,
  canvasConfig: {
    camera: {
      position: [10, 10, 10],
      fov: 75,
      near: 0.1,
      far: 1000
    },
    shadows: true,
    antialias: true,
    alpha: false,
    preserveDrawingBuffer: false,
    powerPreference: 'high-performance'
  },
  sceneConfig: {
    backgroundColor: '#2c3e50',
    showAxes: true,
    showGrid: true,
    enableStats: false,
  },
  controlsConfig: {
    enableOrbitControls: true,
    enableZoom: true,
    enablePan: true,
    enableRotate: true,
    autoRotate: false,
    autoRotateSpeed: 1
  },
  
  // Hook-specific config
  autoConvert: false,
  debounceMs: 500,
  retryOnError: true,
  maxRetries: 3
} as const;

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * React hook for R3F CSG conversion
 * 
 * Provides a convenient interface for converting OpenSCAD code to React Three Fiber
 * components within React components, with automatic resource management and
 * comprehensive state tracking.
 * 
 * @param config - Hook configuration options
 * @returns Hook interface with conversion functions and state
 * 
 * @example
 * ```tsx
 * function OpenSCADViewer() {
 *   const {
 *     convertToR3F,
 *     isProcessing,
 *     progress,
 *     error,
 *     result
 *   } = useR3FCSGConverter({
 *     enableCaching: true,
 *     autoConvert: true
 *   });
 * 
 *   const [code, setCode] = useState('cube([10, 10, 10]);');
 * 
 *   useEffect(() => {
 *     convertToR3F(code);
 *   }, [code, convertToR3F]);
 * 
 *   if (isProcessing) {
 *     return <div>Processing... {progress?.progress}%</div>;
 *   }
 * 
 *   if (error) {
 *     return <div>Error: {error}</div>;
 *   }
 * 
 *   if (result?.success) {
 *     const { CanvasComponent } = result.data!;
 *     return <CanvasComponent />;
 *   }
 * 
 *   return <div>No result</div>;
 * }
 * ```
 */
export function useR3FCSGConverter(
  config: UseR3FCSGConverterConfig = {}
): UseR3FCSGConverterReturn {
  // Merge configuration with defaults
  const mergedConfig = { ...DEFAULT_HOOK_CONFIG, ...config };
  
  // Refs for stable references
  const converterRef = useRef<R3FCSGConverter | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryCountRef = useRef<number>(0);
  
  // State management
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<ProcessingProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [state, setState] = useState<ConverterState>({
    isProcessing: false,
    conversionCount: 0,
    cacheHits: 0,
    cacheMisses: 0
  });
  const [statistics, setStatistics] = useState({
    conversionCount: 0,
    cacheHitRate: 0,
    cacheSize: 0
  });

  // Initialize converter
  useEffect(() => {
    console.log('[DEBUG] Initializing R3F CSG converter hook');
    
    converterRef.current = createR3FCSGConverter(mergedConfig);
    
    return () => {
      console.log('[DEBUG] Cleaning up R3F CSG converter hook');
      
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      
      if (converterRef.current) {
        converterRef.current.dispose();
        converterRef.current = null;
      }
    };
  }, []); // Empty dependency array - only initialize once

  // Update statistics when state changes
  useEffect(() => {
    if (converterRef.current) {
      const stats = converterRef.current.getStatistics();
      setStatistics(stats);
    }
  }, [state]);

  // Progress callback
  const handleProgress = useCallback((progressData: ProcessingProgress) => {
    setProgress(progressData);
    setIsProcessing(progressData.stage !== 'complete');
  }, []);

  // Error callback
  const handleError = useCallback((errorMessage: string, stage: string) => {
    console.error(`[ERROR] Conversion failed at stage ${stage}:`, errorMessage);
    setError(`${stage}: ${errorMessage}`);
    setIsProcessing(false);
  }, []);

  // Convert to R3F with retry logic
  const convertToR3F = useCallback(async (code: string): Promise<ConversionResult> => {
    if (!converterRef.current) {
      const errorResult: ConversionResult = {
        success: false,
        error: 'Converter not initialized'
      };
      setError(errorResult.error!);
      return errorResult;
    }

    // Clear previous state
    setError(null);
    setResult(null);
    setProgress(null);
    setIsProcessing(true);
    retryCountRef.current = 0;

    const attemptConversion = async (): Promise<ConversionResult> => {
      try {
        const conversionResult = await converterRef.current!.convertToR3F(
          code,
          handleProgress,
          handleError
        );

        if (conversionResult.success) {
          setResult(conversionResult);
          setState(converterRef.current!.getState());
          retryCountRef.current = 0;
          return conversionResult;
        } else {
          // Handle retry logic
          if (mergedConfig.retryOnError && retryCountRef.current < mergedConfig.maxRetries) {
            retryCountRef.current++;
            console.log(`[DEBUG] Retrying conversion (attempt ${retryCountRef.current}/${mergedConfig.maxRetries})`);
            
            // Exponential backoff
            const delay = Math.pow(2, retryCountRef.current - 1) * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
            
            return attemptConversion();
          } else {
            setError(conversionResult.error!);
            setState(converterRef.current!.getState());
            return conversionResult;
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown conversion error';
        const errorResult: ConversionResult = {
          success: false,
          error: errorMessage
        };
        
        setError(errorMessage);
        setState(converterRef.current!.getState());
        return errorResult;
      } finally {
        setIsProcessing(false);
      }
    };

    return attemptConversion();
  }, [handleProgress, handleError, mergedConfig.retryOnError, mergedConfig.maxRetries]);

  // Convert to JSX
  const convertToJSX = useCallback(async (
    code: string,
    componentName?: string
  ): Promise<Result<string, string>> => {
    if (!converterRef.current) {
      return {
        success: false,
        error: 'Converter not initialized'
      };
    }

    try {
      setError(null);
      setIsProcessing(true);

      const result = await converterRef.current.convertToJSX(code, componentName);
      
      setState(converterRef.current.getState());
      
      if (!result.success) {
        setError(result.error);
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown JSX conversion error';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setIsProcessing(false);
    }
  }, []);

  // Control functions
  const clearCache = useCallback(() => {
    if (converterRef.current) {
      converterRef.current.clearCache();
      setState(converterRef.current.getState());
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearResult = useCallback(() => {
    setResult(null);
    setProgress(null);
  }, []);

  const reset = useCallback(() => {
    setError(null);
    setResult(null);
    setProgress(null);
    setIsProcessing(false);
    retryCountRef.current = 0;
    
    if (converterRef.current) {
      converterRef.current.clearCache();
      setState(converterRef.current.getState());
    }
  }, []);

  // Debounced conversion for auto-convert mode
  const debouncedConvert = useCallback((code: string): Promise<ConversionResult> => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    return new Promise((resolve) => {
      debounceTimerRef.current = setTimeout(() => {
        resolve(convertToR3F(code));
      }, mergedConfig.debounceMs);
    });
  }, [convertToR3F, mergedConfig.debounceMs]);

  return {
    // Conversion functions
    convertToR3F: mergedConfig.autoConvert ? debouncedConvert : convertToR3F,
    convertToJSX,
    
    // State
    isProcessing,
    progress,
    error,
    result,
    state,
    
    // Statistics
    statistics,
    
    // Control functions
    clearCache,
    clearError,
    clearResult,
    reset
  };
}

// ============================================================================
// Hook Variants
// ============================================================================

/**
 * Simplified hook for basic OpenSCAD to R3F conversion
 * 
 * @param code - OpenSCAD code to convert
 * @param config - Optional configuration
 * @returns Simplified hook interface
 */
export function useOpenSCADToR3F(
  code: string,
  config?: UseR3FCSGConverterConfig
) {
  const converter = useR3FCSGConverter({
    ...config,
    autoConvert: true
  });

  // Auto-convert when code changes
  useEffect(() => {
    if (code && code.trim().length > 0) {
      converter.convertToR3F(code);
    }
  }, [code, converter.convertToR3F]);

  return {
    isLoading: converter.isProcessing,
    progress: converter.progress,
    error: converter.error,
    CanvasComponent: converter.result?.success ? converter.result.data?.CanvasComponent : null,
    SceneComponent: converter.result?.success ? converter.result.data?.SceneComponent : null,
    scene: converter.result?.success ? converter.result.data?.scene : null,
    meshes: converter.result?.success ? converter.result.data?.meshes : null,
    metrics: converter.result?.success ? converter.result.data?.metrics : null,
    retry: () => converter.convertToR3F(code),
    reset: converter.reset
  };
}

/**
 * Hook for JSX generation from OpenSCAD code
 * 
 * @param code - OpenSCAD code to convert
 * @param componentName - Name for the generated component
 * @param config - Optional configuration
 * @returns JSX generation hook interface
 */
export function useOpenSCADToJSX(
  code: string,
  componentName: string = 'OpenSCADScene',
  config?: UseR3FCSGConverterConfig
) {
  const converter = useR3FCSGConverter(config);
  const [jsx, setJSX] = useState<string | null>(null);

  // Auto-convert when code changes
  useEffect(() => {
    if (code && code.trim().length > 0) {
      converter.convertToJSX(code, componentName).then(result => {
        if (result.success) {
          setJSX(result.data);
        } else {
          setJSX(null);
        }
      });
    }
  }, [code, componentName, converter.convertToJSX]);

  return {
    jsx,
    isLoading: converter.isProcessing,
    error: converter.error,
    retry: () => converter.convertToJSX(code, componentName),
    reset: () => {
      setJSX(null);
      converter.reset();
    }
  };
}

// Default export
export default useR3FCSGConverter;
