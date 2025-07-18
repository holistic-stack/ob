/**
 * @file babylon-engine.service.test.ts
 * @description Comprehensive test suite for the `BabylonEngineService`.
 * These tests ensure the service correctly initializes, manages, and disposes of the Babylon.js engine,
 * handles various lifecycle events, and provides performance metrics.
 * The tests utilize a mocked Babylon.js `NullEngine` for headless testing, adhering to TDD principles.
 *
 * @architectural_decision
 * - **Mocked Babylon.js Engine**: The core Babylon.js `Engine` is mocked to use a `NullEngine`-like behavior.
 *   This allows for fast, headless testing without requiring a full WebGL context, which is crucial for CI/CD environments.
 * - **Singleton Reset**: The `resetBabylonEngineService()` is called in `beforeEach` and `afterEach` to ensure
 *   a fresh singleton instance for each test, preventing test contamination.
 * - **Canvas Mocking**: A mock `HTMLCanvasElement` is created and appended to the `document.body` for each test,
 *   simulating a real DOM environment for the engine to attach to.
 * - **Result Type Validation**: Tests explicitly check the `success` and `error` properties of the `EngineResult` type,
 *   ensuring robust error handling and clear test outcomes.
 *
 * @limitations
 * - The mocked Babylon.js engine is simplified and does not cover all edge cases of a real WebGL engine.
 *   Complex rendering behaviors or WebGL-specific issues cannot be fully tested here.
 * - Performance metrics are mocked or simplified; real performance testing would require a live browser environment.
 *
 * @example
 * ```typescript
 * // Example of initializing the engine and checking its state:
 * it('should initialize engine successfully with valid canvas', async () => {
 *   const options: EngineInitOptions = { canvas: mockCanvas };
 *   const result = await engineService.init(options);
 *   expect(result.success).toBe(true);
 *   expect(engineService.getState().isInitialized).toBe(true);
 * });
 *
 * // Example of testing error handling for missing canvas:
 * it('should fail initialization without canvas', async () => {
 *   const result = await engineService.init({ canvas: null as any });
 *   expect(result.success).toBe(false);
 *   expect(result.error.code).toBe('CANVAS_NOT_AVAILABLE');
 * });
 * ```
 *
 * @diagram
 * ```mermaid
 * graph TD
 *    A[Test Suite: BabylonEngineService] --> B[beforeEach: Reset Singleton & Create Mock Canvas];
 *    B --> C[Initialization Tests];
 *    C --> C1[Successful Init];
 *    C --> C2[Failed Init (No Canvas)];
 *    C --> C3[Double Init Prevention];
 *    C --> D[Disposal Tests];
 *    D --> D1[Successful Dispose];
 *    D --> D2[Dispose Uninitialized];
 *    D --> E[State Management Tests];
 *    E --> E1[Initial State];
 *    E --> E2[State After Init];
 *    E --> F[Performance Monitoring Tests];
 *    F --> F1[Metrics After Init];
 *    F --> F2[Null Metrics When Uninitialized];
 *    F --> G[Render Loop Management Tests];
 *    G --> G1[Start Loop];
 *    G --> G2[Stop Loop];
 *    G --> G3[Fail Start Without Init];
 *    G --> H[Resize Handling Tests];
 *    H --> H1[Successful Resize];
 *    H --> H2[Fail Resize Without Init];
 *    H --> I[afterEach: Dispose Engine & Remove Canvas];
 * ```
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createBabylonEngineService, resetBabylonEngineService } from './babylon-engine.service';
import type { BabylonEngineService, EngineInitOptions } from './babylon-engine.types';

/**
 * @mock ResizeObserver
 * @description Mocks the global `ResizeObserver` to prevent errors in the JSDOM environment
 * and to control its behavior during tests. This ensures that the engine's resize logic
 * can be tested without a real browser layout engine.
 */
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

/**
 * @mock logger.service
 * @description Mocks the `logger.service` to prevent actual console output during tests.
 * This keeps the test output clean and allows for spying on logger calls if necessary.
 */
vi.mock('../../../shared/services/logger.service', () => ({
  createLogger: () => ({
    init: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    end: vi.fn(),
  }),
}));

/**
 * @mock @babylonjs/core
 * @description Mocks the `Engine` constructor from `@babylonjs/core` to simulate a `NullEngine`.
 * This allows for headless testing of the `BabylonEngineService` without requiring a WebGL context.
 * The mock provides essential methods like `dispose`, `resize`, `runRenderLoop`, `stopRenderLoop`,
 * `getDeltaTime`, and `getFps` with predictable return values.
 */
vi.mock('@babylonjs/core', async () => {
  const actual = await vi.importActual('@babylonjs/core');
  return {
    ...actual,
    Engine: vi.fn().mockImplementation(() => {
      return {
        dispose: vi.fn(),
        resize: vi.fn(),
        runRenderLoop: vi.fn(),
        stopRenderLoop: vi.fn(),
        getDeltaTime: vi.fn().mockReturnValue(16.67),
        getFps: vi.fn().mockReturnValue(60),
      };
    }),
  };
});

describe('BabylonEngineService', () => {
  /**
   * @property {BabylonEngineService} engineService
   * @description The instance of the `BabylonEngineService` under test.
   */
  let engineService: BabylonEngineService;

  /**
   * @property {HTMLCanvasElement} mockCanvas
   * @description A mocked HTML canvas element used for engine initialization.
   */
  let mockCanvas: HTMLCanvasElement;

  /**
   * @hook beforeEach
   * @description Sets up the testing environment before each test.
   * It resets the singleton `BabylonEngineService` instance, creates a new mock canvas element,
   * and appends it to the document body to simulate a real DOM environment.
   */
  beforeEach(async () => {
    resetBabylonEngineService();
    engineService = createBabylonEngineService();
    mockCanvas = document.createElement('canvas');
    document.body.appendChild(mockCanvas);
  });

  /**
   * @hook afterEach
   * @description Cleans up resources after each test.
   * It disposes of the `engineService`, removes the mock canvas from the DOM, and resets the singleton.
   */
  afterEach(async () => {
    await engineService.dispose();
    document.body.removeChild(mockCanvas);
    resetBabylonEngineService();
  });

  /**
   * @section Initialization Tests
   * @description Tests related to the initialization process of the `BabylonEngineService`.
   */
  describe('initialization', () => {
    /**
     * @test should initialize engine successfully with valid canvas
     * @description Verifies that the engine initializes successfully when provided with a valid canvas element.
     * It checks the `success` property of the `EngineResult` and the internal state of the service.
     */
    it('should initialize engine successfully with valid canvas', async () => {
      const options: EngineInitOptions = {
        canvas: mockCanvas,
        antialias: true,
      };

      const result = await engineService.init(options);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeDefined();
      }

      const state = engineService.getState();
      expect(state.isInitialized).toBe(true);
      expect(state.engine).toBeDefined();
      expect(state.error).toBeNull();
    });

    /**
     * @test should fail initialization without canvas
     * @description Ensures that initialization fails gracefully when no canvas element is provided,
     * returning a specific error code and message.
     * @edge_cases
     * - Missing required parameter: `canvas` is a mandatory option for engine initialization.
     */
    it('should fail initialization without canvas', async () => {
      const options: EngineInitOptions = {
        canvas: null as any,
      };

      const result = await engineService.init(options);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('CANVAS_NOT_AVAILABLE');
        expect(result.error.message).toContain('Canvas element is required');
      }
    });

    /**
     * @test should prevent double initialization
     * @description Verifies that attempting to initialize the engine multiple times without disposing it first
     * results in a specific error, enforcing the singleton pattern.
     * @edge_cases
     * - Idempotency violation: The `init` method is not idempotent if called consecutively without `dispose`.
     */
    it('should prevent double initialization', async () => {
      const options: EngineInitOptions = {
        canvas: mockCanvas,
      };

      const firstResult = await engineService.init(options);
      expect(firstResult.success).toBe(true);

      const secondResult = await engineService.init(options);
      expect(secondResult.success).toBe(false);
      if (!secondResult.success) {
        expect(secondResult.error.code).toBe('ENGINE_ALREADY_INITIALIZED');
      }
    });

    /**
     * @test should use default options when not provided
     * @description Confirms that the engine service uses its default initialization options
     * when specific options are not explicitly provided during `init`.
     */
    it('should use default options when not provided', async () => {
      const options: EngineInitOptions = {
        canvas: mockCanvas,
      };

      const result = await engineService.init(options);

      expect(result.success).toBe(true);
      const state = engineService.getState();
      expect(state.isInitialized).toBe(true);
    });
  });

  /**
   * @section Disposal Tests
   * @description Tests related to the disposal and cleanup of the `BabylonEngineService`.
   */
  describe('disposal', () => {
    /**
     * @test should dispose engine successfully
     * @description Verifies that the engine and its associated resources are disposed correctly,
     * and the service's state reflects the disposed status.
     */
    it('should dispose engine successfully', async () => {
      const options: EngineInitOptions = {
        canvas: mockCanvas,
      };

      await engineService.init(options);
      const disposeResult = await engineService.dispose();

      expect(disposeResult.success).toBe(true);

      const state = engineService.getState();
      expect(state.isInitialized).toBe(false);
      expect(state.isDisposed).toBe(true);
      expect(state.engine).toBeNull();
    });

    /**
     * @test should handle disposal of uninitialized engine
     * @description Ensures that calling `dispose()` on an engine service that has not been initialized
     * does not throw an error and correctly updates the `isDisposed` state.
     */
    it('should handle disposal of uninitialized engine', async () => {
      const result = await engineService.dispose();

      expect(result.success).toBe(true);
      const state = engineService.getState();
      expect(state.isDisposed).toBe(true);
    });
  });

  /**
   * @section State Management Tests
   * @description Tests for verifying the internal state of the `BabylonEngineService`.
   */
  describe('state management', () => {
    /**
     * @test should return correct initial state
     * @description Checks that the `getState()` method returns the expected initial state
     * before any operations have been performed.
     */
    it('should return correct initial state', () => {
      const state = engineService.getState();

      expect(state.isInitialized).toBe(false);
      expect(state.isDisposed).toBe(false);
      expect(state.engine).toBeNull();
      expect(state.performanceMetrics).toBeNull();
      expect(state.error).toBeNull();
    });

    /**
     * @test should update state after initialization
     * @description Verifies that the service's state is correctly updated after a successful initialization,
     * reflecting that the engine is initialized and performance metrics are available.
     */
    it('should update state after initialization', async () => {
      const options: EngineInitOptions = {
        canvas: mockCanvas,
      };

      await engineService.init(options);
      const state = engineService.getState();

      expect(state.isInitialized).toBe(true);
      expect(state.engine).toBeDefined();
      expect(state.performanceMetrics).toBeDefined();
    });
  });

  /**
   * @section Performance Monitoring Tests
   * @description Tests for the engine's performance metrics reporting.
   */
  describe('performance monitoring', () => {
    /**
     * @test should provide performance metrics after initialization
     * @description Ensures that `getPerformanceMetrics()` returns a defined object with numeric properties
     * after the engine has been initialized, indicating that performance monitoring is active.
     */
    it('should provide performance metrics after initialization', async () => {
      const options: EngineInitOptions = {
        canvas: mockCanvas,
      };

      await engineService.init(options);
      const metrics = engineService.getPerformanceMetrics();

      expect(metrics).toBeDefined();
      if (metrics) {
        expect(typeof metrics.frameTime).toBe('number');
        expect(typeof metrics.fps).toBe('number');
        expect(typeof metrics.memoryUsage).toBe('number');
        expect(typeof metrics.drawCalls).toBe('number');
        expect(typeof metrics.triangles).toBe('number');
      }
    });

    /**
     * @test should return null metrics when not initialized
     * @description Confirms that `getPerformanceMetrics()` returns `null` when the engine has not been initialized,
     * as no metrics would be available.
     */
    it('should return null metrics when not initialized', () => {
      const metrics = engineService.getPerformanceMetrics();
      expect(metrics).toBeNull();
    });
  });

  /**
   * @section Render Loop Management Tests
   * @description Tests for starting and stopping the Babylon.js render loop.
   */
  describe('render loop management', () => {
    /**
     * @test should start render loop successfully
     * @description Verifies that `startRenderLoop()` successfully initiates the engine's render loop.
     */
    it('should start render loop successfully', async () => {
      const options: EngineInitOptions = {
        canvas: mockCanvas,
      };

      await engineService.init(options);
      const result = engineService.startRenderLoop();

      expect(result.success).toBe(true);
    });

    /**
     * @test should stop render loop successfully
     * @description Ensures that `stopRenderLoop()` successfully halts the engine's render loop.
     */
    it('should stop render loop successfully', async () => {
      const options: EngineInitOptions = {
        canvas: mockCanvas,
      };

      await engineService.init(options);
      engineService.startRenderLoop();
      const result = engineService.stopRenderLoop();

      expect(result.success).toBe(true);
    });

    /**
     * @test should fail to start render loop without initialization
     * @description Confirms that attempting to start the render loop before the engine is initialized
     * results in a specific error.
     */
    it('should fail to start render loop without initialization', () => {
      const result = engineService.startRenderLoop();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('ENGINE_INITIALIZATION_FAILED');
      }
    });
  });

  /**
   * @section Resize Handling Tests
   * @description Tests for the engine's ability to resize its rendering buffer.
   */
  describe('resize handling', () => {
    /**
     * @test should resize engine successfully
     * @description Verifies that `resize()` successfully triggers the engine's internal resize mechanism.
     */
    it('should resize engine successfully', async () => {
      const options: EngineInitOptions = {
        canvas: mockCanvas,
      };

      await engineService.init(options);
      const result = engineService.resize();

      expect(result.success).toBe(true);
    });

    /**
     * @test should fail to resize without initialization
     * @description Confirms that attempting to resize the engine before it is initialized
     * results in a specific error.
     */
    it('should fail to resize without initialization', () => {
      const result = engineService.resize();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('ENGINE_INITIALIZATION_FAILED');
      }
    });
  });
});
