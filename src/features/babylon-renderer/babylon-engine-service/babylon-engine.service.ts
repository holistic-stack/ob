/**
 * @file babylon-engine.service.ts
 * @description This service provides a singleton pattern for managing the Babylon.js engine lifecycle.
 * It handles engine initialization, disposal, resizing, and performance monitoring.
 * The service is designed to prevent WebGL context loss and ensure optimal rendering performance.
 *
 * @architectural_decision
 * - **Singleton Pattern**: Ensures that only one instance of the Babylon.js engine exists throughout the application's lifecycle.
 *   This is crucial for managing WebGL contexts efficiently and preventing resource conflicts.
 * - **Context Hoisting**: The engine initialization is designed to minimize WebGL context loss, which can be a common issue
 *   in single-page applications, especially during hot module reloading.
 * - **Performance Monitoring**: Integrates basic performance metrics (FPS, frame time) to help achieve and maintain
 *   the target <16ms render times.
 * - **`ResizeObserver`**: Utilizes `ResizeObserver` for efficient canvas resizing, which is more performant and reliable
 *   than traditional `window.onresize` events.
 * - **Result Type for Error Handling**: All public methods return a `EngineResult` (a specialized `Result` type)
 *   to explicitly handle success and error states, promoting robust and predictable error management.
 *
 * @example
 * ```typescript
 * import { createBabylonEngineService } from './features/babylon-renderer/babylon-engine-service';
 *
 * async function setupEngine(canvas: HTMLCanvasElement) {
 *   const engineService = createBabylonEngineService();
 *   const initResult = await engineService.init({ canvas });
 *
 *   if (initResult.success) {
 *     const engine = initResult.data;
 *     console.log('Babylon.js Engine initialized:', engine);
 *     engineService.startRenderLoop(() => {
 *       // Render logic here
 *       engine.getScenes()[0]?.render();
 *     });
 *   } else {
 *     console.error('Failed to initialize engine:', initResult.error.message);
 *   }
 *
 *   // To dispose:
 *   // await engineService.dispose();
 * }
 * ```
 *
 * @diagram
 * ```mermaid
 * graph TD
 *    A[createBabylonEngineService()] --> B{BabylonEngineServiceImpl Singleton};
 *    B -- init(options) --> C{Initialize Engine & Setup ResizeObserver};
 *    C -- Success --> D[EngineResult<Engine> (success)];
 *    C -- Failure --> E[EngineResult<Engine> (error)];
 *    D -- startRenderLoop() --> F[Run Babylon.js Render Loop];
 *    F -- Updates --> G[Performance Metrics];
 *    B -- dispose() --> H[Dispose Engine & Cleanup Resources];
 *    H -- Success --> I[EngineResult<void> (success)];
 *    H -- Failure --> J[EngineResult<void> (error)];
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

/**
 * @constant logger
 * @description Logger instance for the `BabylonEngineService`, providing structured logging for lifecycle events and debugging.
 */
const logger = createLogger('BabylonEngineService');

/**
 * @function createEngineError
 * @description Helper function to create a standardized `EngineError` object.
 * @param {EngineErrorCode} code - A specific error code for categorization.
 * @param {string} message - A human-readable error message.
 * @param {unknown} [cause] - Optional. The underlying cause of the error (e.g., a caught exception).
 * @returns {EngineError} A new `EngineError` object.
 * @example
 * ```typescript
 * const error = createEngineError('CANVAS_NOT_AVAILABLE', 'Canvas element is missing');
 * ```
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
 * @function createSuccessResult
 * @description Helper function to create a successful `EngineResult` object.
 * @template T - The type of the data contained in the success result.
 * @param {T} data - The data to be returned on success.
 * @returns {EngineResult<T>} A new `EngineResult` object indicating success.
 * @example
 * ```typescript
 * const result = createSuccessResult<Engine>(myBabylonEngine);
 * ```
 */
const createSuccessResult = <T>(data: T): EngineResult<T> => ({
  success: true,
  data,
});

/**
 * @function createErrorResult
 * @description Helper function to create a failed `EngineResult` object.
 * @template T - The type of the data that would have been returned on success (used for type inference).
 * @param {EngineError} error - The `EngineError` object describing the failure.
 * @returns {EngineResult<T>} A new `EngineResult` object indicating failure.
 * @example
 * ```typescript
 * const result = createErrorResult<Engine>(createEngineError('INIT_FAILED', 'Engine failed to start'));
 * ```
 */
const createErrorResult = <T>(error: EngineError): EngineResult<T> => ({
  success: false,
  error,
});

/**
 * @class BabylonEngineServiceImpl
 * @implements {BabylonEngineService}
 * @description Concrete implementation of the `BabylonEngineService` interface.
 * This class manages the Babylon.js `Engine` instance, its lifecycle, and associated resources.
 * It is designed to be used as a singleton.
 */
class BabylonEngineServiceImpl implements BabylonEngineService {
  /**
   * @property {Engine | null} engine
   * @private
   * @description The Babylon.js `Engine` instance. `null` if not initialized or disposed.
   */
  private engine: Engine | null = null;

  /**
   * @property {ResizeObserver | null} resizeObserver
   * @private
   * @description The `ResizeObserver` instance used to detect changes in the canvas's parent element size.
   * This allows the engine to automatically resize its rendering buffer.
   */
  private resizeObserver: ResizeObserver | null = null;

  /**
   * @property {EnginePerformanceMetrics | null} performanceMetrics
   * @private
   * @description Stores the latest performance metrics of the engine (e.g., FPS, frame time).
   */
  private performanceMetrics: EnginePerformanceMetrics | null = null;

  /**
   * @property {boolean} isInitialized
   * @private
   * @description Flag indicating whether the engine has been successfully initialized.
   */
  private isInitialized = false;

  /**
   * @property {boolean} isDisposed
   * @private
   * @description Flag indicating whether the engine has been disposed.
   */
  private isDisposed = false;

  /**
   * @property {EngineError | null} error
   * @private
   * @description Stores the last encountered error during engine operations.
   */
  private error: EngineError | null = null;

  /**
   * @method init
   * @description Initializes the Babylon.js engine.
   * This method creates a new `Engine` instance, sets up the `ResizeObserver`,
   * and initializes performance monitoring. It must be called before any rendering operations.
   * @param {EngineInitOptions} options - Configuration options for engine initialization, including the canvas element.
   * @returns {Promise<EngineResult<Engine>>} A promise that resolves to an `EngineResult`,
   *   containing the `Engine` instance on success or an `EngineError` on failure.
   *
   * @limitations
   * - The `EngineInitOptions` are merged with `DEFAULT_ENGINE_INIT_OPTIONS`.
   * - The `canvas` element is a mandatory option.
   *
   * @edge_cases
   * - **Already Initialized**: If `init` is called when the engine is already initialized, it returns a warning.
   * - **Missing Canvas**: If `options.canvas` is not provided, it returns a `CANVAS_NOT_AVAILABLE` error.
   * - **WebGL Context Creation Failure**: Catches errors during `new Engine()` and returns an `ENGINE_INITIALIZATION_FAILED` error.
   *
   * @example
   * ```typescript
   * const canvas = document.getElementById('renderCanvas') as HTMLCanvasElement;
   * const engineService = createBabylonEngineService();
   * const result = await engineService.init({ canvas, antialias: true });
   * if (result.success) {
   *   console.log('Engine ready!');
   * } else {
   *   console.error('Engine init failed:', result.error.message);
   * }
   * ```
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
      const finalOptions = {
        ...DEFAULT_ENGINE_INIT_OPTIONS,
        ...options,
      };

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

      this.setupResizeObserver(options.canvas);
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
   * @method dispose
   * @description Disposes of the Babylon.js engine and cleans up all associated resources,
   * including the `ResizeObserver`.
   * This method should be called when the engine is no longer needed to prevent memory leaks.
   * @returns {Promise<EngineResult<void>>} A promise that resolves to an `EngineResult`,
   *   indicating success or an `EngineError` on failure.
   *
   * @edge_cases
   * - **Already Disposed**: Calling `dispose` on an already disposed engine will not cause issues but might log a warning.
   * - **Error During Disposal**: Catches any errors during `engine.dispose()` and returns an `ENGINE_DISPOSAL_FAILED` error.
   *
   * @example
   * ```typescript
   * const engineService = createBabylonEngineService();
   * // ... initialize and use engine ...
   * const result = await engineService.dispose();
   * if (result.success) {
   *   console.log('Engine disposed!');
   * } else {
   *   console.error('Engine disposal failed:', result.error.message);
   * }
   * ```
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
   * @method getState
   * @description Returns the current state of the Babylon.js engine service.
   * This includes its initialization status, disposal status, the engine instance itself,
   * current performance metrics, and any last encountered error.
   * @returns {EngineState} An object representing the current state of the service.
   * @example
   * ```typescript
   * const engineService = createBabylonEngineService();
   * const state = engineService.getState();
   * console.log('Engine initialized:', state.isInitialized);
   * console.log('Current FPS:', state.performanceMetrics?.fps);
   * ```
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
   * @method getPerformanceMetrics
   * @description Retrieves the latest performance metrics of the Babylon.js engine.
   * @returns {EnginePerformanceMetrics | null} The performance metrics object, or `null` if not available.
   * @example
   * ```typescript
   * const engineService = createBabylonEngineService();
   * const metrics = engineService.getPerformanceMetrics();
   * if (metrics) {
   *   console.log('Frame Time (ms):', metrics.frameTime);
   *   console.log('FPS:', metrics.fps);
   * }
   * ```
   */
  getPerformanceMetrics(): EnginePerformanceMetrics | null {
    return this.performanceMetrics;
  }

  /**
   * @method resize
   * @description Resizes the Babylon.js engine's rendering canvas to match its current container size.
   * This is typically called in response to a `ResizeObserver` event.
   * @returns {EngineResult<void>} An `EngineResult` indicating success or an `EngineError` on failure.
   *
   * @edge_cases
   * - **Not Initialized**: Returns an error if the engine is not initialized.
   * - **Error During Resize**: Catches any errors during `engine.resize()` and returns an error.
   *
   * @example
   * ```typescript
   * const engineService = createBabylonEngineService();
   * // ... after engine is initialized and canvas size changes ...
   * const result = engineService.resize();
   * if (!result.success) {
   *   console.error('Failed to resize engine:', result.error.message);
   * }
   * ```
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
   * @method startRenderLoop
   * @description Starts the Babylon.js render loop. This continuously renders the scene.
   * An optional callback can be provided to execute custom logic on each frame.
   * @param {() => void} [callback] - Optional callback function to execute on each frame before rendering the scene.
   * @returns {EngineResult<void>} An `EngineResult` indicating success or an `EngineError` on failure.
   *
   * @edge_cases
   * - **Not Initialized**: Returns an error if the engine is not initialized.
   * - **Error During Loop Start**: Catches any errors during `engine.runRenderLoop()` and returns an error.
   *
   * @example
   * ```typescript
   * const engineService = createBabylonEngineService();
   * // ... after engine is initialized ...
   * engineService.startRenderLoop(() => {
   *   // Custom per-frame logic here
   *   myScene.render();
   * });
   * ```
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
   * @method stopRenderLoop
   * @description Stops the Babylon.js render loop.
   * @returns {EngineResult<void>} An `EngineResult` indicating success or an `EngineError` on failure.
   *
   * @edge_cases
   * - **Not Initialized**: Returns an error if the engine is not initialized.
   * - **Error During Loop Stop**: Catches any errors during `engine.stopRenderLoop()` and returns an error.
   *
   * @example
   * ```typescript
   * const engineService = createBabylonEngineService();
   * // ... engine is running ...
   * engineService.stopRenderLoop();
   * console.log('Render loop stopped.');
   * ```
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
   * @method setupResizeObserver
   * @private
   * @description Sets up a `ResizeObserver` to monitor the canvas's parent element for size changes.
   * When a resize is detected, it triggers the engine's `resize()` method.
   * This is a more efficient way to handle canvas resizing compared to listening to `window.onresize`.
   * @param {HTMLCanvasElement} canvas - The HTML canvas element associated with the engine.
   * @returns {void}
   *
   * @limitations
   * - Observes the parent element. If the canvas itself changes size without its parent, this won't trigger a resize.
   *
   * @example
   * ```typescript
   * // Internal method, called during engine initialization:
   * this.setupResizeObserver(options.canvas);
   * ```
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
   * @method initializePerformanceMonitoring
   * @private
   * @description Initializes the `performanceMetrics` object with default values.
   * This prepares the service to collect and report engine performance data.
   * @returns {void}
   *
   * @limitations
   * - Currently, `memoryUsage`, `drawCalls`, and `triangles` are initialized to 0.
   *   Accurate measurement of these metrics would require deeper instrumentation of the Babylon.js engine
   *   or WebGL context, which is beyond the scope of this service's current implementation.
   *
   * @example
   * ```typescript
   * // Internal method, called during engine initialization:
   * this.initializePerformanceMonitoring();
   * ```
   */
  private initializePerformanceMonitoring(): void {
    this.performanceMetrics = {
      frameTime: 0,
      fps: 0,
      memoryUsage: 0,
      drawCalls: 0,
      triangles: 0,
    };
  }

  /**
   * @method updatePerformanceMetrics
   * @private
   * @description Updates the `performanceMetrics` object with current frame time and FPS from the engine.
   * This method is called on each frame of the render loop.
   * @returns {void}
   *
   * @limitations
   * - Only `frameTime` and `fps` are currently updated from the Babylon.js engine.
   * - Other metrics (`memoryUsage`, `drawCalls`, `triangles`) remain at their default values.
   *
   * @example
   * ```typescript
   * // Internal method, called within the render loop:
   * this.engine.runRenderLoop(() => {
   *   // ... scene rendering ...
   *   this.updatePerformanceMetrics();
   * });
   * ```
   */
  private updatePerformanceMetrics(): void {
    if (!this.engine) return;

    this.performanceMetrics = {
      frameTime: this.engine.getDeltaTime(),
      fps: this.engine.getFps(),
      memoryUsage: 0,
      drawCalls: 0,
      triangles: 0,
    };
  }
}

/**
 * @global engineServiceInstance
 * @description A global variable to hold the singleton instance of `BabylonEngineServiceImpl`.
 * Initialized to `null` and populated by `createBabylonEngineService`.
 */
let engineServiceInstance: BabylonEngineService | null = null;

/**
 * @function createBabylonEngineService
 * @description Factory function to create or retrieve the singleton instance of `BabylonEngineService`.
 * This is the primary way to access the engine management service throughout the application.
 * @returns {BabylonEngineService} The singleton instance of the Babylon.js engine service.
 * @example
 * ```typescript
 * const engineService = createBabylonEngineService();
 * // Use engineService to initialize, dispose, etc.
 * ```
 */
export const createBabylonEngineService = (): BabylonEngineService => {
  if (!engineServiceInstance) {
    engineServiceInstance = new BabylonEngineServiceImpl();
  }
  return engineServiceInstance;
};

/**
 * @function resetBabylonEngineService
 * @description Resets the singleton instance of `BabylonEngineService`.
 * This function is primarily intended for testing purposes to ensure a clean state between tests.
 * @returns {void}
 * @internal
 * @example
 * ```typescript
 * // In a test setup:
 * afterEach(() => {
 *   resetBabylonEngineService();
 * });
 * ```
 */
export const resetBabylonEngineService = (): void => {
  engineServiceInstance = null;
};
