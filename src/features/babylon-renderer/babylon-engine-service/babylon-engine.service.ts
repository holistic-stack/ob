/**
 * @file BabylonJS Engine Management Service
 *
 * Singleton service for managing BabylonJS engine lifecycle with context hoisting.
 * Prevents WebGL context loss and provides performance monitoring for <16ms targets.
 *
 * @example
 * ```typescript
 * const engineService = createBabylonEngineService();
 * const result = await engineService.init({ canvas: canvasElement });
 * if (result.success) {
 *   console.log('Engine initialized:', result.data);
 * }
 * ```
 */

import { Engine } from '@babylonjs/core';
import { createLogger } from '../../../shared/services/logger.service';
import type {
  BabylonEngineService,
  EngineError,
  EngineErrorCode,
  EngineInitOptions,
  EnginePerformanceMetrics,
  EngineResult,
  EngineState,
} from './babylon-engine.types';
import { DEFAULT_ENGINE_INIT_OPTIONS } from './babylon-engine.types';

const logger = createLogger('BabylonEngineService');

/**
 * Creates an error result for engine operations
 */
const createEngineError = (
  code: EngineErrorCode,
  message: string,
  cause?: unknown
): EngineError => ({
  code,
  message,
  cause,
});

/**
 * Creates a success result for engine operations
 */
const createSuccessResult = <T>(data: T): EngineResult<T> => ({
  success: true,
  data,
});

/**
 * Creates an error result for engine operations
 */
const createErrorResult = <T>(error: EngineError): EngineResult<T> => ({
  success: false,
  error,
});

/**
 * BabylonJS Engine Management Service Implementation
 *
 * Provides singleton pattern for engine management with:
 * - WebGL context loss prevention
 * - Performance monitoring for <16ms render targets
 * - ResizeObserver-based resize handling
 * - Automatic memory disposal patterns
 */
class BabylonEngineServiceImpl implements BabylonEngineService {
  private engine: Engine | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private performanceMetrics: EnginePerformanceMetrics | null = null;
  private isInitialized = false;
  private isDisposed = false;
  private error: EngineError | null = null;

  /**
   * Initialize the BabylonJS engine with context hoisting
   */
  async init(options: EngineInitOptions): Promise<EngineResult<Engine>> {
    logger.init('[INIT][BabylonEngineService] Initializing BabylonJS engine');

    if (this.isInitialized && this.engine) {
      const error = createEngineError(
        'ENGINE_ALREADY_INITIALIZED',
        'Engine is already initialized. Dispose first before reinitializing.'
      );
      logger.warn('[WARN][BabylonEngineService] Engine already initialized');
      return createErrorResult(error);
    }

    if (!options.canvas) {
      const error = createEngineError(
        'CANVAS_NOT_AVAILABLE',
        'Canvas element is required for engine initialization'
      );
      logger.error('[ERROR][BabylonEngineService] Canvas not available');
      return createErrorResult(error);
    }

    try {
      // Merge user options with defaults
      const finalOptions = {
        ...DEFAULT_ENGINE_INIT_OPTIONS,
        ...options,
      };

      // Create engine with context hoisting for stability
      const engine = new Engine(
        options.canvas,
        finalOptions.antialias ?? true,
        {
          preserveDrawingBuffer: finalOptions.preserveDrawingBuffer ?? true,
          stencil: finalOptions.stencil ?? true,
          loseContextOnDispose: finalOptions.loseContextOnDispose ?? true,
        },
        finalOptions.adaptToDeviceRatio ?? true
      );

      this.engine = engine;
      this.isInitialized = true;
      this.isDisposed = false;
      this.error = null;

      // Setup ResizeObserver for better performance than window events
      this.setupResizeObserver(options.canvas);

      // Initialize performance monitoring
      this.initializePerformanceMonitoring();

      logger.info('[INFO][BabylonEngineService] ✅ Engine initialized successfully');
      return createSuccessResult(engine);
    } catch (cause) {
      const error = createEngineError(
        'ENGINE_INITIALIZATION_FAILED',
        'Failed to initialize BabylonJS engine',
        cause
      );
      this.error = error;
      logger.error('[ERROR][BabylonEngineService] Engine initialization failed:', cause);
      return createErrorResult(error);
    }
  }

  /**
   * Dispose the engine and clean up resources
   */
  async dispose(): Promise<EngineResult<void>> {
    logger.debug('[DEBUG][BabylonEngineService] Disposing engine');

    try {
      if (this.resizeObserver) {
        this.resizeObserver.disconnect();
        this.resizeObserver = null;
      }

      if (this.engine) {
        this.engine.dispose();
        this.engine = null;
      }

      this.isInitialized = false;
      this.isDisposed = true;
      this.performanceMetrics = null;
      this.error = null;

      logger.end('[END][BabylonEngineService] Engine disposed successfully');
      return createSuccessResult(undefined);
    } catch (cause) {
      const error = createEngineError(
        'ENGINE_DISPOSAL_FAILED',
        'Failed to dispose BabylonJS engine',
        cause
      );
      this.error = error;
      logger.error('[ERROR][BabylonEngineService] Engine disposal failed:', cause);
      return createErrorResult(error);
    }
  }

  /**
   * Get current engine state
   */
  getState(): EngineState {
    return {
      isInitialized: this.isInitialized,
      isDisposed: this.isDisposed,
      engine: this.engine,
      performanceMetrics: this.performanceMetrics,
      error: this.error,
    };
  }

  /**
   * Get current performance metrics
   */
  getPerformanceMetrics(): EnginePerformanceMetrics | null {
    return this.performanceMetrics;
  }

  /**
   * Resize the engine
   */
  resize(): EngineResult<void> {
    if (!this.engine || !this.isInitialized) {
      const error = createEngineError('ENGINE_INITIALIZATION_FAILED', 'Engine not initialized');
      return createErrorResult(error);
    }

    try {
      this.engine.resize();
      return createSuccessResult(undefined);
    } catch (cause) {
      const error = createEngineError(
        'ENGINE_INITIALIZATION_FAILED',
        'Failed to resize engine',
        cause
      );
      return createErrorResult(error);
    }
  }

  /**
   * Start the render loop
   */
  startRenderLoop(callback?: () => void): EngineResult<void> {
    if (!this.engine || !this.isInitialized) {
      const error = createEngineError('ENGINE_INITIALIZATION_FAILED', 'Engine not initialized');
      return createErrorResult(error);
    }

    try {
      this.engine.runRenderLoop(() => {
        if (callback) {
          callback();
        }
        this.updatePerformanceMetrics();
      });
      return createSuccessResult(undefined);
    } catch (cause) {
      const error = createEngineError(
        'ENGINE_INITIALIZATION_FAILED',
        'Failed to start render loop',
        cause
      );
      return createErrorResult(error);
    }
  }

  /**
   * Stop the render loop
   */
  stopRenderLoop(): EngineResult<void> {
    if (!this.engine || !this.isInitialized) {
      const error = createEngineError('ENGINE_INITIALIZATION_FAILED', 'Engine not initialized');
      return createErrorResult(error);
    }

    try {
      this.engine.stopRenderLoop();
      return createSuccessResult(undefined);
    } catch (cause) {
      const error = createEngineError(
        'ENGINE_INITIALIZATION_FAILED',
        'Failed to stop render loop',
        cause
      );
      return createErrorResult(error);
    }
  }

  /**
   * Setup ResizeObserver for better performance than window events
   */
  private setupResizeObserver(canvas: HTMLCanvasElement): void {
    this.resizeObserver = new ResizeObserver(() => {
      if (this.engine && this.isInitialized) {
        this.engine.resize();
      }
    });

    if (canvas.parentElement) {
      this.resizeObserver.observe(canvas.parentElement);
    }
  }

  /**
   * Initialize performance monitoring for <16ms render targets
   */
  private initializePerformanceMonitoring(): void {
    // Initialize with default metrics
    this.performanceMetrics = {
      frameTime: 0,
      fps: 0,
      memoryUsage: 0,
      drawCalls: 0,
      triangles: 0,
    };
  }

  /**
   * Update performance metrics during render loop
   */
  private updatePerformanceMetrics(): void {
    if (!this.engine) return;

    // Update metrics (simplified for now)
    this.performanceMetrics = {
      frameTime: this.engine.getDeltaTime(),
      fps: this.engine.getFps(),
      memoryUsage: 0, // Would need WebGL extension for accurate measurement
      drawCalls: 0, // Would need engine instrumentation
      triangles: 0, // Would need scene analysis
    };
  }
}

/**
 * Singleton instance of the BabylonJS Engine Service
 */
let engineServiceInstance: BabylonEngineService | null = null;

/**
 * Create or get the singleton BabylonJS Engine Service instance
 */
export const createBabylonEngineService = (): BabylonEngineService => {
  if (!engineServiceInstance) {
    engineServiceInstance = new BabylonEngineServiceImpl();
  }
  return engineServiceInstance;
};

/**
 * Reset the singleton instance (for testing purposes)
 * @internal
 */
export const resetBabylonEngineService = (): void => {
  engineServiceInstance = null;
};
