/**
 * @file useR3FEngine Hook
 * 
 * React hook equivalent to useBabylonEngine that manages R3F renderer lifecycle,
 * canvas integration, resize handling, and configuration changes using React 19 best practices.
 * 
 * @author OpenSCAD-R3F Pipeline
 * @version 1.0.0
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import * as THREE from 'three';
import { createR3FEngineService } from '../../services/engine-service/r3f-engine-service';
import type { 
  R3FEngineConfig, 
  UseR3FEngineReturn 
} from '../../types/r3f-types';

/**
 * Custom hook for managing React Three Fiber renderer lifecycle
 * 
 * This hook is a thin wrapper around the R3F engine service, providing:
 * - React state management for renderer lifecycle
 * - Automatic cleanup on unmount
 * - Window resize handling
 * - Configuration change detection
 * 
 * @param canvas - HTML canvas element for renderer rendering
 * @param config - Optional renderer configuration
 * @returns Renderer state and control functions
 * 
 * @example
 * ```tsx
 * const { renderer, isReady, error, dispose } = useR3FEngine(canvasRef.current, {
 *   antialias: true,
 *   powerPreference: 'high-performance'
 * });
 * ```
 */
export function useR3FEngine(
  canvas: HTMLCanvasElement | null,
  config: R3FEngineConfig = {}
): UseR3FEngineReturn {
  console.log('[INIT] Initializing R3F engine hook');

  // Create engine service instance (memoized)
  const engineService = useMemo(() => createR3FEngineService(), []);

  // State management
  const [renderer, setRenderer] = useState<THREE.WebGLRenderer | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs for cleanup and resize handling
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const resizeHandlerRef = useRef<(() => void) | null>(null);

  // Memoize configuration to prevent unnecessary re-renders
  const memoizedConfig = useMemo(() => config, [
    config.antialias,
    config.alpha,
    config.preserveDrawingBuffer,
    config.stencil,
    config.powerPreference,
    config.shadowMapEnabled,
    config.shadowMapType,
    config.toneMapping,
    config.toneMappingExposure,
    config.outputColorSpace,
    config.forceRealRenderer
  ]);

  // Dispose function with cleanup
  const dispose = useCallback(() => {
    console.log('[DEBUG] Disposing R3F renderer from hook');

    // Remove resize handler
    if (resizeHandlerRef.current) {
      window.removeEventListener('resize', resizeHandlerRef.current);
      resizeHandlerRef.current = null;
    }

    // Dispose renderer using service
    if (rendererRef.current) {
      engineService.disposeRenderer(rendererRef.current);
      rendererRef.current = null;
    }

    // Reset state
    setRenderer(null);
    setIsReady(false);
    setError(null);
  }, [engineService]);

  // Renderer creation effect
  useEffect(() => {
    console.log('[DEBUG] R3F engine hook effect triggered');

    // Cleanup previous renderer if exists
    if (rendererRef.current) {
      dispose();
    }

    // Validate canvas
    if (!canvas) {
      console.log('[DEBUG] Canvas not available');
      setRenderer(null);
      setIsReady(false);
      setError(null);
      return;
    }

    // Create new renderer using service
    const result = engineService.createRenderer(canvas, memoizedConfig);

    if (result.success) {
      const newRenderer = result.data;
      rendererRef.current = newRenderer;
      setRenderer(newRenderer);
      setIsReady(true);
      setError(null);

      // Setup resize handler
      const handleResize = () => {
        if (rendererRef.current) {
          engineService.handleResize(rendererRef.current);
        }
      };

      resizeHandlerRef.current = handleResize;
      window.addEventListener('resize', handleResize);

      // Setup error handlers
      engineService.setupErrorHandlers(
        newRenderer,
        () => {
          console.warn('[WARN] WebGL context lost in R3F renderer');
          setError('WebGL context lost');
        },
        () => {
          console.log('[DEBUG] WebGL context restored in R3F renderer');
          setError(null);
        }
      );

      console.log('[DEBUG] Renderer created successfully in hook');
    } else {
      console.error('[ERROR] Renderer creation failed in hook:', result.error);
      setRenderer(null);
      setIsReady(false);
      setError(result.error);
    }

    // Cleanup function
    return () => {
      console.log('[DEBUG] R3F engine hook cleanup');
      
      // Remove resize handler
      if (resizeHandlerRef.current) {
        window.removeEventListener('resize', resizeHandlerRef.current);
        resizeHandlerRef.current = null;
      }
    };
  }, [canvas, memoizedConfig, engineService, dispose]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('[DEBUG] R3F engine hook unmounting, cleaning up');
      dispose();
    };
  }, [dispose]);

  return {
    renderer,
    isReady,
    error,
    dispose
  };
}

// Default export for easier imports
export default useR3FEngine;
