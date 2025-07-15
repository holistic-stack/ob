/**
 * @file Use BabylonJS Engine Hook
 *
 * React hook for managing BabylonJS engine lifecycle and state.
 * Provides declarative engine management with React 19 compatibility.
 */

import type { Engine } from '@babylonjs/core';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createLogger } from '../../../../shared/services/logger.service';
import type {
  BabylonEngineConfig,
  BabylonEngineState,
  EngineDisposeResult,
  EngineInitResult,
} from '../../services/babylon-engine-service';
import { BabylonEngineService, EngineErrorCode } from '../../services/babylon-engine-service';
import type {
  EngineError,
  EnginePerformanceMetrics,
  EngineInitOptions as ServiceEngineInitOptions,
} from '../../types/babylon-engine.types';

const logger = createLogger('useBabylonEngine');

/**
 * Engine initialization options
 */
export interface EngineInitOptions {
  readonly enableWebGPU?: boolean;
  readonly antialias?: boolean;
  readonly adaptToDeviceRatio?: boolean;
  readonly powerPreference?: 'default' | 'high-performance' | 'low-power';
  readonly onEngineReady?: (engine: Engine) => void;
  readonly onEngineError?: (error: EngineError) => void;
}

/**
 * Hook return type
 */
export interface UseBabylonEngineReturn {
  readonly engineService: BabylonEngineService | null;
  readonly engineState: BabylonEngineState;
  readonly initializeEngine: (
    canvas: HTMLCanvasElement,
    options?: EngineInitOptions
  ) => Promise<EngineInitResult>;
  readonly disposeEngine: () => Promise<EngineDisposeResult>;
  readonly getPerformanceMetrics: () => EnginePerformanceMetrics;
  readonly isWebGPUSupported: boolean;
  readonly isWebGLSupported: boolean;
}

/**
 * Default engine configuration
 */
const DEFAULT_ENGINE_CONFIG: BabylonEngineConfig = {
  enableWebGPU: true,
  antialias: true,
  adaptToDeviceRatio: true,
  stencil: true,
  powerPreference: 'high-performance',
  enableOfflineSupport: false,
  enableInspector: false,
  preserveDrawingBuffer: false,
  failIfMajorPerformanceCaveat: false,
} as const;

/**
 * Initial engine state
 */
const INITIAL_ENGINE_STATE: BabylonEngineState = {
  isInitialized: false,
  isDisposed: false,
  isWebGPU: false,
  engine: null,
  canvas: null,
  fps: 0,
  deltaTime: 0,
  renderTime: 0,
  performanceMetrics: {
    fps: 0,
    deltaTime: 0,
    renderTime: 0,
    drawCalls: 0,
    triangleCount: 0,
    memoryUsage: 0,
    gpuMemoryUsage: 0,
  },
  error: null,
  lastUpdated: new Date(),
} as const;

/**
 * Use BabylonJS Engine Hook
 *
 * Manages BabylonJS engine lifecycle with React 19 compatibility.
 * Provides declarative engine initialization, disposal, and state management.
 */
export const useBabylonEngine = (): UseBabylonEngineReturn => {
  const [engineState, setEngineState] = useState<BabylonEngineState>(INITIAL_ENGINE_STATE);
  const engineServiceRef = useRef<BabylonEngineService | null>(null);
  const isInitializingRef = useRef(false);

  /**
   * Initialize engine service if not already created
   */
  const getEngineService = useCallback((): BabylonEngineService => {
    if (!engineServiceRef.current) {
      engineServiceRef.current = new BabylonEngineService(DEFAULT_ENGINE_CONFIG);
      logger.debug('[DEBUG][useBabylonEngine] Engine service created');
    }
    return engineServiceRef.current;
  }, []);

  /**
   * Check WebGPU support
   */
  const isWebGPUSupported = useCallback((): boolean => {
    return 'gpu' in navigator && typeof navigator.gpu !== 'undefined';
  }, []);

  /**
   * Check WebGL support
   */
  const isWebGLSupported = useCallback((): boolean => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      return !!gl;
    } catch {
      return false;
    }
  }, []);

  /**
   * Initialize BabylonJS engine
   */
  const initializeEngine = useCallback(
    async (
      canvas: HTMLCanvasElement,
      options: EngineInitOptions = {}
    ): Promise<EngineInitResult> => {
      logger.debug('[DEBUG][useBabylonEngine] Initializing engine...');

      // Prevent multiple simultaneous initializations
      if (isInitializingRef.current) {
        logger.warn('[WARN][useBabylonEngine] Engine initialization already in progress');
        return {
          success: false,
          error: {
            code: EngineErrorCode.INITIALIZATION_FAILED,
            message: 'Engine initialization already in progress',
            timestamp: new Date(),
          },
        };
      }

      isInitializingRef.current = true;

      try {
        const engineService = getEngineService();

        // Merge options with defaults
        const config: BabylonEngineConfig = {
          ...DEFAULT_ENGINE_CONFIG,
          enableWebGPU: options.enableWebGPU ?? DEFAULT_ENGINE_CONFIG.enableWebGPU,
          antialias: options.antialias ?? DEFAULT_ENGINE_CONFIG.antialias,
          adaptToDeviceRatio:
            options.adaptToDeviceRatio ?? DEFAULT_ENGINE_CONFIG.adaptToDeviceRatio,
          powerPreference: options.powerPreference ?? DEFAULT_ENGINE_CONFIG.powerPreference,
        };

        // Initialize engine
        const initOptions: ServiceEngineInitOptions = {
          canvas,
          config,
          ...(options.onEngineReady && { onEngineReady: options.onEngineReady }),
          ...(options.onEngineError && { onEngineError: options.onEngineError }),
        };

        const result = await engineService.init(initOptions);

        if (result.success) {
          // Update state with successful initialization
          const newState = engineService.getState();
          setEngineState(newState);

          // Call success callback
          if (options.onEngineReady && newState.engine) {
            options.onEngineReady(newState.engine);
          }

          logger.debug('[DEBUG][useBabylonEngine] Engine initialized successfully');
        } else {
          // Update state with error
          setEngineState((prev) => ({
            ...prev,
            error: result.error,
            lastUpdated: new Date(),
          }));

          // Call error callback
          if (options.onEngineError) {
            options.onEngineError(result.error);
          }

          logger.error(
            `[ERROR][useBabylonEngine] Engine initialization failed: ${result.error.message}`
          );
        }

        return result;
      } finally {
        isInitializingRef.current = false;
      }
    },
    [getEngineService]
  );

  /**
   * Dispose BabylonJS engine
   */
  const disposeEngine = useCallback(async (): Promise<EngineDisposeResult> => {
    logger.debug('[DEBUG][useBabylonEngine] Disposing engine...');

    if (!engineServiceRef.current) {
      return {
        success: true,
        data: undefined,
      };
    }

    const result = await engineServiceRef.current.dispose();

    if (result.success) {
      // Reset state
      setEngineState(INITIAL_ENGINE_STATE);
      engineServiceRef.current = null;
      logger.debug('[DEBUG][useBabylonEngine] Engine disposed successfully');
    } else {
      logger.error(`[ERROR][useBabylonEngine] Engine disposal failed: ${result.error.message}`);
    }

    return result;
  }, []);

  /**
   * Get performance metrics
   */
  const getPerformanceMetrics = useCallback(() => {
    if (!engineServiceRef.current) {
      return INITIAL_ENGINE_STATE.performanceMetrics;
    }

    const state = engineServiceRef.current.getState();
    return state.performanceMetrics;
  }, []);

  /**
   * Update engine state periodically
   */
  useEffect(() => {
    if (!engineServiceRef.current || !engineState.isInitialized) {
      return;
    }

    const updateInterval = setInterval(() => {
      const newState = engineServiceRef.current?.getState();
      if (newState) {
        setEngineState(newState);
      }
    }, 1000); // Update every second

    return () => {
      clearInterval(updateInterval);
    };
  }, [engineState.isInitialized]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (engineServiceRef.current) {
        const result = engineServiceRef.current.dispose();
        if (!result.success) {
          logger.error(
            `[ERROR][useBabylonEngine] Cleanup disposal failed: ${result.error.message}`
          );
        }
      }
    };
  }, []);

  return {
    engineService: engineServiceRef.current,
    engineState,
    initializeEngine,
    disposeEngine,
    getPerformanceMetrics,
    isWebGPUSupported: isWebGPUSupported(),
    isWebGLSupported: isWebGLSupported(),
  };
};
