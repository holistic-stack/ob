/**
 * @file babylon-engine.types.ts
 * @description This file defines the TypeScript interfaces and types for the Babylon.js Engine Management Service.
 * It establishes the contracts for engine initialization, state, performance metrics, and error handling,
 * adhering to functional programming principles with `Result<T, E>` patterns.
 *
 * @architectural_decision
 * - **Strict Typing**: All interfaces and types are defined with `readonly` properties to enforce immutability,
 *   promoting predictable state management and reducing side effects.
 * - **Result Type for Error Handling**: The `EngineResult<T>` type is used consistently for all operations
 *   that might fail, providing explicit success and error states and avoiding traditional `try-catch` blocks
 *   for control flow.
 * - **Branded Types**: `EngineId` is a branded type to enhance type safety and prevent accidental assignment
 *   of plain strings where a specific engine ID is expected.
 * - **Clear Separation**: This file is dedicated solely to type definitions, keeping the service implementation
 *   (`babylon-engine.service.ts`) focused on logic.
 *
 * @example
 * ```typescript
 * // Example of using EngineInitOptions:
 * const options: EngineInitOptions = {
 *   canvas: document.getElementById('renderCanvas') as HTMLCanvasElement,
 *   antialias: true,
 *   enableWebGPU: false,
 * };
 *
 * // Example of handling an EngineResult:
 * const result: EngineResult<Engine> = { success: true, data: myEngine };
 * if (result.success) {
 *   console.log('Engine instance:', result.data);
 * } else {
 *   console.error('Engine error:', result.error.message);
 * }
 * ```
 */

import type { Engine } from '@babylonjs/core';

/**
 * @type EngineId
 * @description A branded type for a unique engine identifier.
 * This helps prevent type mismatches and improves code clarity by explicitly marking strings
 * that are intended to be engine IDs.
 * @example
 * ```typescript
 * const myEngineId: EngineId = 'engine-123' as EngineId;
 * ```
 */
export type EngineId = string & { readonly __brand: 'EngineId' };

/**
 * @interface EngineInitOptions
 * @description Defines the options required to initialize the Babylon.js engine.
 * These options control the rendering capabilities and behavior of the engine.
 * @property {HTMLCanvasElement} canvas - The HTML canvas element where the 3D scene will be rendered.
 * @property {boolean} [antialias] - Optional. Enables or disables antialiasing for smoother edges.
 * @property {boolean} [adaptToDeviceRatio] - Optional. If `true`, the engine will adapt to the device's pixel ratio for high-DPI screens.
 * @property {boolean} [preserveDrawingBuffer] - Optional. If `true`, the drawing buffer will be preserved after rendering, useful for screenshots.
 * @property {boolean} [stencil] - Optional. If `true`, a stencil buffer will be created, enabling advanced rendering techniques.
 * @property {boolean} [loseContextOnDispose] - Optional. If `true`, the WebGL context will be lost when the engine is disposed.
 *   This is particularly useful in development for preventing context accumulation during hot module reloading.
 * @property {boolean} [enableWebGPU] - Optional. If `true`, attempts to use WebGPU instead of WebGL for rendering.
 *
 * @example
 * ```typescript
 * const initOptions: EngineInitOptions = {
 *   canvas: document.getElementById('renderCanvas') as HTMLCanvasElement,
 *   antialias: true,
 *   enableWebGPU: false,
 * };
 * ```
 */
export interface EngineInitOptions {
  readonly canvas: HTMLCanvasElement;
  readonly antialias?: boolean;
  readonly adaptToDeviceRatio?: boolean;
  readonly preserveDrawingBuffer?: boolean;
  readonly stencil?: boolean;
  readonly loseContextOnDispose?: boolean;
  readonly enableWebGPU?: boolean;
}

/**
 * @interface EnginePerformanceMetrics
 * @description Represents the performance metrics collected from the Babylon.js engine.
 * These metrics are crucial for monitoring rendering performance and ensuring the application meets its <16ms frame time targets.
 * @property {number} frameTime - The time taken to render the last frame, in milliseconds.
 * @property {number} fps - Frames per second, indicating the rendering smoothness.
 * @property {number} memoryUsage - Estimated memory usage by the engine, in MB.
 * @property {number} drawCalls - The number of draw calls issued to the GPU per frame.
 * @property {number} triangles - The total number of triangles rendered per frame.
 *
 * @limitations
 * - `memoryUsage`, `drawCalls`, and `triangles` are currently placeholders and may not reflect actual values without deeper engine instrumentation.
 *
 * @example
 * ```typescript
 * const metrics: EnginePerformanceMetrics = {
 *   frameTime: 15.5,
 *   fps: 60,
 *   memoryUsage: 128,
 *   drawCalls: 500,
 *   triangles: 100000,
 * };
 * ```
 */
export interface EnginePerformanceMetrics {
  readonly frameTime: number; // in milliseconds
  readonly fps: number;
  readonly memoryUsage: number; // in MB
  readonly drawCalls: number;
  readonly triangles: number;
}

/**
 * @interface EngineState
 * @description Represents the current state of the Babylon.js engine service.
 * This interface provides a snapshot of the engine's operational status and performance.
 * @property {boolean} isInitialized - `true` if the engine has been successfully initialized; otherwise, `false`.
 * @property {boolean} isDisposed - `true` if the engine has been disposed; otherwise, `false`.
 * @property {Engine | null} engine - The Babylon.js `Engine` instance, or `null` if not initialized or disposed.
 * @property {EnginePerformanceMetrics | null} performanceMetrics - The latest performance metrics, or `null` if not available.
 * @property {EngineError | null} error - The last encountered error, or `null` if no error has occurred.
 *
 * @example
 * ```typescript
 * const currentState: EngineState = {
 *   isInitialized: true,
 *   isDisposed: false,
 *   engine: myBabylonEngine,
 *   performanceMetrics: { frameTime: 16, fps: 60, memoryUsage: 100, drawCalls: 300, triangles: 50000 },
 *   error: null,
 * };
 * ```
 */
export interface EngineState {
  readonly isInitialized: boolean;
  readonly isDisposed: boolean;
  readonly engine: Engine | null;
  readonly performanceMetrics: EnginePerformanceMetrics | null;
  readonly error: EngineError | null;
}

/**
 * @interface EngineError
 * @description Represents a structured error object for Babylon.js engine operations.
 * This provides more detailed information about failures than a simple string.
 * @property {EngineErrorCode} code - A specific error code identifying the type of error.
 * @property {string} message - A human-readable description of the error.
 * @property {unknown} [cause] - Optional. The underlying cause of the error, such as a caught exception or another error object.
 *
 * @example
 * ```typescript
 * const initError: EngineError = {
 *   code: 'ENGINE_INITIALIZATION_FAILED',
 *   message: 'Failed to create WebGL context',
 *   cause: new Error('WebGL not supported'),
 * };
 * ```
 */
export interface EngineError {
  readonly code: EngineErrorCode;
  readonly message: string;
  readonly cause?: unknown;
}

/**
 * @type EngineErrorCode
 * @description Defines a union of possible error codes for engine operations.
 * These codes provide a standardized way to categorize and handle different types of engine failures.
 */
export type EngineErrorCode =
  | 'ENGINE_INITIALIZATION_FAILED'
  | 'WEBGL_CONTEXT_LOST'
  | 'WEBGPU_NOT_SUPPORTED'
  | 'CANVAS_NOT_AVAILABLE'
  | 'ENGINE_ALREADY_INITIALIZED'
  | 'ENGINE_DISPOSAL_FAILED';

/**
 * @type EngineResult
 * @description A discriminated union type representing the result of an engine operation.
 * This pattern (`Result<T, E>`) explicitly indicates whether an operation was successful (`success: true`) and contains data (`data: T`),
 * or failed (`success: false`) and contains an error (`error: EngineError`).
 * @template T - The type of the data returned on success.
 *
 * @example
 * ```typescript
 * // Successful result:
 * const successResult: EngineResult<Engine> = { success: true, data: myEngineInstance };
 *
 * // Failed result:
 * const errorResult: EngineResult<void> = { success: false, error: { code: 'CANVAS_NOT_AVAILABLE', message: 'Canvas missing' } };
 *
 * if (successResult.success) {
 *   console.log(successResult.data); // Access the engine instance
 * } else {
 *   console.log(errorResult.error); // Access the error object
 * }
 * ```
 */
export type EngineResult<T> =
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly error: EngineError };

/**
 * @interface BabylonEngineService
 * @description Defines the contract for the Babylon.js Engine Management Service.
 * This interface specifies the public API for interacting with the engine, promoting consistency and testability.
 * @property {(options: EngineInitOptions) => Promise<EngineResult<Engine>>} init - Initializes the Babylon.js engine asynchronously.
 * @property {() => Promise<EngineResult<void>>} dispose - Disposes of the engine and its resources asynchronously.
 * @property {() => EngineState} getState - Retrieves the current state of the engine service.
 * @property {() => EnginePerformanceMetrics | null} getPerformanceMetrics - Retrieves the latest performance metrics.
 * @property {() => EngineResult<void>} resize - Triggers a resize of the engine's rendering canvas.
 * @property {(callback?: () => void) => EngineResult<void>} startRenderLoop - Starts the engine's render loop, with an optional per-frame callback.
 * @property {() => EngineResult<void>} stopRenderLoop - Stops the engine's render loop.
 *
 * @example
 * ```typescript
 * // An implementation of this interface would provide the concrete logic:
 * class MyEngineService implements BabylonEngineService { /* ... * / }
 *
 * // Usage:
 * const service: BabylonEngineService = createBabylonEngineService();
 * await service.init({ canvas: myCanvas });
 * ```
 */
export interface BabylonEngineService {
  readonly init: (options: EngineInitOptions) => Promise<EngineResult<Engine>>;
  readonly dispose: () => Promise<EngineResult<void>>;
  readonly getState: () => EngineState;
  readonly getPerformanceMetrics: () => EnginePerformanceMetrics | null;
  readonly resize: () => EngineResult<void>;
  readonly startRenderLoop: (callback?: () => void) => EngineResult<void>;
  readonly stopRenderLoop: () => EngineResult<void>;
}

/**
 * @constant DEFAULT_ENGINE_INIT_OPTIONS
 * @description Default initialization options for the Babylon.js engine.
 * These options are optimized for performance and common use cases, and can be overridden by `EngineInitOptions`.
 * @property {boolean} antialias - `true` by default for smoother rendering.
 * @property {boolean} adaptToDeviceRatio - `true` by default to handle high-DPI screens correctly.
 * @property {boolean} preserveDrawingBuffer - `true` by default, useful for capturing frames or post-processing.
 * @property {boolean} stencil - `true` by default, enables stencil buffer for advanced effects.
 * @property {boolean} loseContextOnDispose - `true` by default, crucial for preventing WebGL context accumulation in development environments (e.g., with HMR).
 * @property {boolean} enableWebGPU - `false` by default, as WebGPU support is still evolving and might not be universally available.
 *
 * @example
 * ```typescript
 * // Merging with custom options:
 * const finalOptions = { ...DEFAULT_ENGINE_INIT_OPTIONS, canvas: myCanvas, antialias: false };
 * ```
 */
export const DEFAULT_ENGINE_INIT_OPTIONS: Readonly<Partial<EngineInitOptions>> = {
  antialias: true,
  adaptToDeviceRatio: true,
  preserveDrawingBuffer: true,
  stencil: true,
  loseContextOnDispose: true, // Critical for preventing context accumulation
  enableWebGPU: false, // Conservative default, can be enabled explicitly
} as const;
