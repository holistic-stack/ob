/**
 * @file BabylonJS Engine Service
 *
 * Service for managing BabylonJS engine lifecycle with WebGPU-first configuration.
 * Implements WebGPU engine with fallback to WebGL2, following functional programming patterns.
 */

import { Engine, WebGPUEngine } from '@babylonjs/core';
import { createLogger } from '../../../../shared/services/logger.service';
import type { Result } from '../../../../shared/types/result.types';
import { tryCatch, tryCatchAsync } from '../../../../shared/utils/functional/result';
import type {
  BabylonEngineConfig,
  BabylonEngineState,
  EngineDisposeResult,
  EngineError,
  EngineErrorCode,
  EngineInitOptions,
  EngineInitResult,
  EnginePerformanceMetrics,
} from '../../types/babylon-engine.types';
import { DEFAULT_ENGINE_CONFIG } from '../../types/babylon-engine.types';

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
          throw this.createError('ENGINE_INITIALIZATION_FAILED', 'Engine already initialized');
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

        throw this.createError(
          'ENGINE_INITIALIZATION_FAILED',
          'Both WebGPU and WebGL2 initialization failed'
        );
      },
      (error) =>
        this.createError('ENGINE_INITIALIZATION_FAILED', `Engine initialization failed: ${error}`)
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
        if (!WebGPUEngine.IsSupported()) {
          throw this.createError('WEBGPU_NOT_SUPPORTED', 'WebGPU is not supported in this browser');
        }

        const webgpuEngine = new WebGPUEngine(this.canvas!, {
          antialias: this.config.antialias,
          adaptToDeviceRatio: this.config.adaptToDeviceRatio,
          powerPreference: this.config.powerPreference,
        });

        await webgpuEngine.initAsync();

        this.engine = webgpuEngine;
        this.setupEngineEvents();

        options.onEngineReady?.(webgpuEngine);

        return webgpuEngine;
      },
      (error) => this.createError('WEBGPU_NOT_SUPPORTED', `WebGPU initialization failed: ${error}`)
    );
  }

  /**
   * Initialize WebGL2 engine
   */
  private async initWebGLEngine(options: EngineInitOptions): Promise<Result<Engine, EngineError>> {
    return tryCatch(
      () => {
        const webglEngine = new Engine(this.canvas!, this.config.antialias, {
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
      (error) => this.createError('WEBGL_NOT_SUPPORTED', `WebGL2 initialization failed: ${error}`)
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
      drawCalls: this.engine.drawCalls,
      triangleCount: this.engine.drawCallsPerfCounter?.current || 0,
      memoryUsage: (performance as any).memory?.usedJSHeapSize || 0,
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
   */
  dispose(): EngineDisposeResult {
    logger.debug('[DEBUG][BabylonEngineService] Disposing engine...');

    return tryCatch(
      () => {
        if (this.engine) {
          this.engine.dispose();
          this.engine = null;
        }

        this.canvas = null;
        this.isDisposed = true;

        logger.end('[END][BabylonEngineService] Engine disposed successfully');
      },
      (error) => this.createError('DISPOSAL_FAILED', `Engine disposal failed: ${error}`)
    );
  }

  /**
   * Create engine state object
   */
  private createEngineState(isWebGPU: boolean): BabylonEngineState {
    return {
      engine: this.engine,
      isInitialized: this.isInitialized(),
      isDisposed: this.isDisposed,
      isWebGPU,
      canvas: this.canvas,
      fps: this.engine?.getFps() || 0,
      deltaTime: this.engine?.getDeltaTime() || 0,
      renderTime: this.engine?.getTimeStep() || 0,
      lastUpdated: new Date(),
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
