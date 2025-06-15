/**
 * @file Babylon Engine Hook
 * 
 * Refactored React hook for Babylon.js engine management
 * Thin wrapper around engine service following React 19 best practices
 * 
 * @author Luciano Júnior
 * @date June 2025
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import * as BABYLON from '@babylonjs/core';
import { createEngineService } from '../../services/engine-service/engine-service';
import type { 
  BabylonEngineConfig, 
  UseBabylonEngineReturn 
} from '../../types/babylon-types';

/**
 * Custom hook for managing Babylon.js engine lifecycle
 * 
 * This hook is a thin wrapper around the engine service, providing:
 * - React state management for engine lifecycle
 * - Automatic cleanup on unmount
 * - Window resize handling
 * - Configuration change detection
 * 
 * @param canvas - HTML canvas element for engine rendering
 * @param config - Optional engine configuration
 * @returns Engine state and control functions
 * 
 * @example
 * ```tsx
 * const { engine, isReady, error, dispose } = useBabylonEngine(canvasRef.current, {
 *   antialias: true,
 *   powerPreference: 'high-performance'
 * });
 * ```
 */
export function useBabylonEngine(
  canvas: HTMLCanvasElement | null,
  config: BabylonEngineConfig = {}
): UseBabylonEngineReturn {
  console.log('[INIT] Initializing Babylon engine hook');

  // Create engine service instance (memoized)
  const engineService = useMemo(() => createEngineService(), []);

  // State management
  const [engine, setEngine] = useState<BABYLON.Engine | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs for cleanup and resize handling
  const engineRef = useRef<BABYLON.Engine | null>(null);
  const resizeHandlerRef = useRef<(() => void) | null>(null);

  // Memoize configuration to prevent unnecessary re-renders
  const memoizedConfig = useMemo(() => config, [
    config.antialias,
    config.preserveDrawingBuffer,
    config.stencil,
    config.powerPreference
  ]);

  // Dispose function with cleanup
  const dispose = useCallback(() => {
    console.log('[DEBUG] Disposing Babylon engine from hook');

    if (engineRef.current) {
      // Remove resize listener
      if (resizeHandlerRef.current) {
        window.removeEventListener('resize', resizeHandlerRef.current);
        resizeHandlerRef.current = null;
      }

      // Dispose engine using service
      engineService.disposeEngine(engineRef.current);
      engineRef.current = null;
    }

    // Reset state
    setEngine(null);
    setIsReady(false);
    setError(null);
  }, [engineService]);

  // Engine creation effect
  useEffect(() => {
    console.log('[DEBUG] Engine hook effect triggered');

    // Cleanup previous engine if exists
    if (engineRef.current) {
      dispose();
    }

    // Create new engine using service
    const result = engineService.createEngine(canvas, memoizedConfig);

    if (result.success) {
      const newEngine = result.data;
      engineRef.current = newEngine;
      setEngine(newEngine);
      setIsReady(true);
      setError(null);

      // Setup resize handler
      const handleResize = () => {
        if (engineRef.current && !engineRef.current.isDisposed) {
          engineService.handleResize(engineRef.current);
        }
      };

      resizeHandlerRef.current = handleResize;
      window.addEventListener('resize', handleResize);

      console.log('[DEBUG] Engine created successfully in hook');
    } else {
      console.error('[ERROR] Engine creation failed in hook:', result.error);
      setEngine(null);
      setIsReady(false);
      setError(result.error);
    }

    // Cleanup function
    return () => {
      console.log('[DEBUG] Engine hook cleanup');
      dispose();
    };
  }, [canvas, memoizedConfig, engineService, dispose]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('[DEBUG] Engine hook unmounting');
      dispose();
    };
  }, [dispose]);

  return {
    engine,
    isReady,
    error,
    dispose
  };
}

// Re-export types for convenience
export type { BabylonEngineConfig, UseBabylonEngineReturn };
