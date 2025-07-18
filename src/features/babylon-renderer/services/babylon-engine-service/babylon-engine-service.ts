/**
 * @file BabylonJS Engine Service
 *
 * Service for managing BabylonJS engine lifecycle with WebGPU-first configuration.
 * Implements WebGPU engine with fallback to WebGL2, following functional programming patterns.
 */

import { Engine, NullEngine, WebGPUEngine } from '@babylonjs/core';
import { createLogger } from '../../../../shared/services/logger.service';
import type { Result } from '../../../../shared/types/result.types';
import { tryCatch, tryCatchAsync } from '../../../../shared/utils/functional/result';
import type {
  BabylonEngineConfig,
  BabylonEngineState,
  EngineDisposeResult,
  EngineError,
  EngineInitOptions,
  EngineInitResult,
  EnginePerformanceMetrics,
} from '../../types/babylon-engine.types';
import { DEFAULT_ENGINE_CONFIG, EngineErrorCode } from '../../types/babylon-engine.types';

const logger = createLogger('BabylonEngineService');

/**
 * BabylonJS Engine Service
 *
 * Manages engine lifecycle with WebGPU-first approach and comprehensive error handling.
 * Follows SRP by focusing solely on engine management.
 */
export class BabylonEngineService {
  private engine: Engine | WebGPUEngine | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private isDisposed = false;
  private config: BabylonEngineConfig;

  constructor(config: BabylonEngineConfig = DEFAULT_ENGINE_CONFIG) {
    this.config = { ...config };
    logger.init('[INIT][BabylonEngineService] Service initialized with WebGPU-first configuration');
  }

  /**
   * Initialize the BabylonJS engine with WebGPU support
   */
  async init(options: EngineInitOptions): Promise<EngineInitResult> {
    logger.debug('[DEBUG][BabylonEngineService] Initializing engine...');

    return tryCatchAsync(
      async () => {
        if (this.engine) {
          throw this.createError(
            EngineErrorCode.INITIALIZATION_FAILED,
            'Engine already initialized'
          );
        }

        this.canvas = options.canvas;

        // Try WebGPU first if enabled
        if (this.config.enableWebGPU) {
          const webgpuResult = await this.initWebGPUEngine(options);
          if (webgpuResult.success) {
            logger.debug('[DEBUG][BabylonEngineService] WebGPU engine initialized successfully');
            return this.createEngineState(true);
          }

          logger.warn(
            '[WARN][BabylonEngineService] WebGPU initialization failed, falling back to WebGL2'
          );
        }

        // Fallback to WebGL2
        const webglResult = await this.initWebGLEngine(options);
        if (webglResult.success) {
          logger.debug('[DEBUG][BabylonEngineService] WebGL2 engine initialized successfully');
          return this.createEngineState(false);
        }

        // Final fallback to NullEngine for test environments (only if canvas is valid)
        if (process.env.NODE_ENV === 'test' && this.canvas) {
          logger.warn('[WARN][BabylonEngineService] Using NullEngine for test environment');
          const nullEngineResult = await this.initNullEngine(options);
          if (nullEngineResult.success) {
            logger.debug('[DEBUG][BabylonEngineService] NullEngine initialized successfully');
            return this.createEngineState(false);
          }
        }

        throw this.createError(
          EngineErrorCode.INITIALIZATION_FAILED,
          'All engine initialization methods failed'
        );
      },
      (error) => {
        // Preserve original error codes if it's already an EngineError
        if (error && typeof error === 'object' && 'code' in error) {
          return error as EngineError;
        }
        return this.createError(
          EngineErrorCode.INITIALIZATION_FAILED,
          `Engine initialization failed: ${error}`
        );
      }
    );
  }

  /**
   * Initialize WebGPU engine
   */
  private async initWebGPUEngine(
    options: EngineInitOptions
  ): Promise<Result<WebGPUEngine, EngineError>> {
    return tryCatchAsync(
      async () => {
        if (!WebGPUEngine.IsSupported) {
          throw this.createError(
            EngineErrorCode.WEBGPU_NOT_SUPPORTED,
            'WebGPU is not supported in this browser'
          );
        }

        if (!this.canvas) {
          throw new Error('Canvas is required for WebGPU engine initialization');
        }
        const webgpuEngine = new WebGPUEngine(this.canvas, {
          antialias: this.config.antialias,
          adaptToDeviceRatio: this.config.adaptToDeviceRatio,
          powerPreference: this.config.powerPreference as GPUPowerPreference,
        });

        await webgpuEngine.initAsync();

        this.engine = webgpuEngine;
        this.setupEngineEvents();

        options.onEngineReady?.(webgpuEngine as unknown as Engine);

        return webgpuEngine;
      },
      (error) =>
        this.createError(
          EngineErrorCode.WEBGPU_NOT_SUPPORTED,
          `WebGPU initialization failed: ${error}`
        )
    );
  }

  /**
   * Initialize WebGL2 engine
   */
  private async initWebGLEngine(options: EngineInitOptions): Promise<Result<Engine, EngineError>> {
    return tryCatch(
      () => {
        if (!this.canvas) {
          throw new Error('Canvas is required for WebGL engine initialization');
        }
        const webglEngine = new Engine(this.canvas, this.config.antialias, {
          preserveDrawingBuffer: this.config.preserveDrawingBuffer,
          stencil: this.config.stencil,
          antialias: this.config.antialias,
          adaptToDeviceRatio: this.config.adaptToDeviceRatio,
          powerPreference: this.config.powerPreference,
          failIfMajorPerformanceCaveat: this.config.failIfMajorPerformanceCaveat,
        });

        this.engine = webglEngine;
        this.setupEngineEvents();

        options.onEngineReady?.(webglEngine);

        return webglEngine;
      },
      (error) =>
        this.createError(
          EngineErrorCode.WEBGL_NOT_SUPPORTED,
          `WebGL2 initialization failed: ${error}`
        )
    );
  }

  /**
   * Initialize NullEngine for test environments
   *
   * @param options - Engine initialization options
   * @returns Result containing the NullEngine or error
   *
   * @example
   * ```typescript
   * const result = await engineService.initNullEngine(options);
   * if (result.success) {
   *   console.log('NullEngine initialized for testing');
   * }
   * ```
   */
  private async initNullEngine(options: EngineInitOptions): Promise<Result<Engine, EngineError>> {
    return tryCatch(
      () => {
        // NullEngine doesn't require a canvas but we'll store the reference
        const nullEngine = new NullEngine({
          renderWidth: 800,
          renderHeight: 600,
          textureSize: 512,
          deterministicLockstep: false,
          lockstepMaxSteps: 4,
        });

        this.engine = nullEngine;
        this.setupEngineEvents();

        options.onEngineReady?.(nullEngine);

        return nullEngine;
      },
      (error) =>
        this.createError(
          EngineErrorCode.INITIALIZATION_FAILED,
          `NullEngine initialization failed: ${error}`
        )
    );
  }

  /**
   * Set up engine event handlers
   */
  private setupEngineEvents(): void {
    if (!this.engine) return;

    // Handle context lost
    this.engine.onContextLostObservable.add(() => {
      logger.error('[ERROR][BabylonEngineService] WebGL context lost');
    });

    // Handle context restored
    this.engine.onContextRestoredObservable.add(() => {
      logger.debug('[DEBUG][BabylonEngineService] WebGL context restored');
    });

    // Handle resize
    window.addEventListener('resize', () => {
      this.engine?.resize();
    });
  }

  /**
   * Get current engine state
   */
  getState(): BabylonEngineState {
    return this.createEngineState(this.isWebGPU());
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): EnginePerformanceMetrics {
    if (!this.engine) {
      return {
        fps: 0,
        deltaTime: 0,
        renderTime: 0,
        drawCalls: 0,
        triangleCount: 0,
        memoryUsage: 0,
        gpuMemoryUsage: 0,
      };
    }

    return {
      fps: this.engine.getFps(),
      deltaTime: this.engine.getDeltaTime(),
      renderTime: this.engine.getTimeStep(),
      drawCalls: (this.engine as { _drawCalls?: { current: number } })._drawCalls?.current || 0,
      triangleCount:
        (this.engine as { drawCallsPerfCounter?: { current: number } }).drawCallsPerfCounter
          ?.current || 0,
      memoryUsage:
        (performance as { memory?: { usedJSHeapSize: number } }).memory?.usedJSHeapSize || 0,
      gpuMemoryUsage: 0, // Not available in current BabylonJS API
    };
  }

  /**
   * Check if engine is using WebGPU
   */
  isWebGPU(): boolean {
    return this.engine instanceof WebGPUEngine;
  }

  /**
   * Check if engine is initialized
   */
  isInitialized(): boolean {
    return this.engine !== null && !this.isDisposed;
  }

  /**
   * Get the engine instance
   */
  getEngine(): Engine | WebGPUEngine | null {
    return this.engine;
  }

  /**
   * Dispose the engine and clean up resources
   *
   * @returns Result indicating success or failure of disposal operation
   *
   * @example
   * ```typescript
   * const engineService = new BabylonEngineService();
   * await engineService.init({ canvas, config });
   *
   * const result = engineService.dispose();
   * if (result.success) {
   *   console.log('Engine disposed successfully');
   * } else {
   *   console.error('Disposal failed:', result.error.message);
   * }
   * ```
   */
  dispose(): EngineDisposeResult {
    logger.debug('[DEBUG][BabylonEngineService] Disposing engine...');

    return tryCatch(
      () => {
        if (this.engine) {
          try {
            // Attempt to dispose the engine, but don't fail if it throws
            this.engine.dispose();
          } catch (engineDisposeError) {
            // Log the error but continue with cleanup
            logger.warn(
              `[WARN][BabylonEngineService] Engine dispose threw error: ${engineDisposeError}`
            );
          }
          this.engine = null;
        }

        this.canvas = null;
        this.isDisposed = true;

        logger.end('[END][BabylonEngineService] Engine disposed successfully');
      },
      (error) =>
        this.createError(EngineErrorCode.DISPOSAL_FAILED, `Engine disposal failed: ${error}`)
    );
  }

  /**
   * Create engine state object
   */
  private createEngineState(isWebGPU: boolean): BabylonEngineState {
    return {
      engine: this.engine as Engine,
      isInitialized: this.isInitialized(),
      isDisposed: this.isDisposed,
      isWebGPU,
      canvas: this.canvas,
      fps: this.engine?.getFps() || 0,
      deltaTime: this.engine?.getDeltaTime() || 0,
      renderTime: this.engine?.getTimeStep() || 0,
      lastUpdated: new Date(),
      error: null,
      performanceMetrics: this.getPerformanceMetrics(),
    };
  }

  /**
   * Create engine error
   */
  private createError(code: EngineErrorCode, message: string, details?: unknown): EngineError {
    return {
      code,
      message,
      details,
      timestamp: new Date(),
    };
  }
}
