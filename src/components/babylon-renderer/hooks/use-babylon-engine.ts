/**
 * @file Babylon Engine Hook (SRP: Engine Management Only)
 * 
 * Custom hook following Single Responsibility Principle:
 * - Only manages Babylon.js engine lifecycle
 * - Handles WebGL context errors and recovery
 * - Provides engine instance and status
 * 
 * @author Luciano Júnior
 * @date June 2025
 */

import { useRef, useState, useCallback, useEffect, RefObject } from 'react';
import * as BABYLON from '@babylonjs/core';

interface BabylonEngineConfig {
  antialias?: boolean;
  preserveDrawingBuffer?: boolean;
  stencil?: boolean;
  powerPreference?: 'default' | 'high-performance' | 'low-power';
}

interface BabylonEngineState {
  engine: BABYLON.Engine | null;
  isReady: boolean;
  error: string | null;
}

/**
 * Hook for managing Babylon.js engine lifecycle
 * Follows SRP: Only handles engine creation, error handling, and cleanup
 */
export function useBabylonEngine(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  config: BabylonEngineConfig = {}
): BabylonEngineState {
  const engineRef = useRef<BABYLON.Engine | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Memoized engine configuration
  const engineConfig = {
    antialias: true,
    preserveDrawingBuffer: true,
    stencil: true,
    powerPreference: 'high-performance' as const,
    ...config
  };

  // WebGL error handler (following React 19 patterns)
  const handleWebGLError = useCallback((errorMessage: string) => {
    console.error('[ERROR] WebGL Error:', errorMessage);
    setError(`WebGL Error: ${errorMessage}`);
    setIsReady(false);
  }, []);

  // Engine initialization effect (minimal useEffect usage)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      setIsReady(false);
      return;
    }

    console.log('[INIT] Creating Babylon.js engine');
    
    try {
      const engine = new BABYLON.Engine(canvas, engineConfig.antialias, {
        preserveDrawingBuffer: engineConfig.preserveDrawingBuffer,
        stencil: engineConfig.stencil,
        powerPreference: engineConfig.powerPreference
      });

      // Set up WebGL context error handling
      engine.onContextLostObservable.add(() => {
        console.warn('[WARN] WebGL context lost');
        handleWebGLError('WebGL context lost - attempting recovery');
      });

      engine.onContextRestoredObservable.add(() => {
        console.log('[DEBUG] WebGL context restored');
        setError(null);
        setIsReady(true);
      });

      // Handle resize
      const handleResize = () => {
        if (engine && !engine.isDisposed) {
          engine.resize();
        }
      };
      window.addEventListener('resize', handleResize);

      engineRef.current = engine;
      setIsReady(true);
      setError(null);
      console.log('[DEBUG] Babylon.js engine created successfully');

      // Cleanup function
      return () => {
        console.log('[DEBUG] Cleaning up Babylon.js engine');
        window.removeEventListener('resize', handleResize);
        
        if (engine && !engine.isDisposed) {
          engine.dispose();
        }
        
        engineRef.current = null;
        setIsReady(false);
      };

    } catch (initError) {
      const errorMessage = initError instanceof Error ? initError.message : 'Engine initialization failed';
      handleWebGLError(errorMessage);
      return undefined;
    }
  }, [canvasRef, engineConfig.antialias, engineConfig.preserveDrawingBuffer, engineConfig.stencil, engineConfig.powerPreference, handleWebGLError]);

  return {
    engine: engineRef.current,
    isReady,
    error
  };
}
