/**
 * @file BabylonJS Engine Service Types
 *
 * TypeScript interfaces and types for the BabylonJS Engine Management Service.
 * Follows functional programming patterns with Result<T,E> error handling.
 */

import type { Engine } from '@babylonjs/core';

/**
 * Branded type for Engine ID to prevent mixing with other string types
 */
export type EngineId = string & { readonly __brand: 'EngineId' };

/**
 * Engine initialization options with performance and context management settings
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
 * Engine performance metrics for monitoring <16ms render targets
 */
export interface EnginePerformanceMetrics {
  readonly frameTime: number; // in milliseconds
  readonly fps: number;
  readonly memoryUsage: number; // in MB
  readonly drawCalls: number;
  readonly triangles: number;
}

/**
 * Engine state for reactive updates
 */
export interface EngineState {
  readonly isInitialized: boolean;
  readonly isDisposed: boolean;
  readonly engine: Engine | null;
  readonly performanceMetrics: EnginePerformanceMetrics | null;
  readonly error: EngineError | null;
}

/**
 * Engine-specific error types following Result<T,E> patterns
 */
export interface EngineError {
  readonly code: EngineErrorCode;
  readonly message: string;
  readonly cause?: unknown;
}

/**
 * Engine error codes for structured error handling
 */
export type EngineErrorCode =
  | 'ENGINE_INITIALIZATION_FAILED'
  | 'WEBGL_CONTEXT_LOST'
  | 'WEBGPU_NOT_SUPPORTED'
  | 'CANVAS_NOT_AVAILABLE'
  | 'ENGINE_ALREADY_INITIALIZED'
  | 'ENGINE_DISPOSAL_FAILED';

/**
 * Result type for engine operations
 */
export type EngineResult<T> =
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly error: EngineError };

/**
 * Engine service interface following functional programming principles
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
 * Default engine initialization options optimized for performance
 */
export const DEFAULT_ENGINE_INIT_OPTIONS: Readonly<Partial<EngineInitOptions>> = {
  antialias: true,
  adaptToDeviceRatio: true,
  preserveDrawingBuffer: true,
  stencil: true,
  loseContextOnDispose: true, // Critical for preventing context accumulation
  enableWebGPU: false, // Conservative default, can be enabled explicitly
} as const;
