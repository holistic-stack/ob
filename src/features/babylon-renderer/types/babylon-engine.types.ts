/**
 * @file BabylonJS Engine Type Definitions
 * 
 * Type definitions for BabylonJS engine configuration and lifecycle management.
 * Following functional programming patterns with immutable data structures.
 */

import type { Engine, EngineOptions } from '@babylonjs/core';
import type { Result } from '../../../shared/types/result.types';

/**
 * BabylonJS engine configuration
 */
export interface BabylonEngineConfig {
  readonly antialias: boolean;
  readonly adaptToDeviceRatio: boolean;
  readonly preserveDrawingBuffer: boolean;
  readonly stencil: boolean;
  readonly enableWebGPU: boolean;
  readonly enableOfflineSupport: boolean;
  readonly enableInspector: boolean;
  readonly powerPreference: 'default' | 'high-performance' | 'low-power';
  readonly failIfMajorPerformanceCaveat: boolean;
}

/**
 * Engine initialization options
 */
export interface EngineInitOptions {
  readonly canvas: HTMLCanvasElement;
  readonly config: BabylonEngineConfig;
  readonly engineOptions?: EngineOptions;
  readonly onEngineReady?: (engine: Engine) => void;
  readonly onEngineError?: (error: EngineError) => void;
}

/**
 * Engine state for reactive management
 */
export interface BabylonEngineState {
  readonly engine: Engine | null;
  readonly isInitialized: boolean;
  readonly isDisposed: boolean;
  readonly isWebGPU: boolean;
  readonly canvas: HTMLCanvasElement | null;
  readonly fps: number;
  readonly deltaTime: number;
  readonly renderTime: number;
  readonly lastUpdated: Date;
}

/**
 * Engine performance metrics
 */
export interface EnginePerformanceMetrics {
  readonly fps: number;
  readonly deltaTime: number;
  readonly renderTime: number;
  readonly drawCalls: number;
  readonly triangleCount: number;
  readonly memoryUsage: number;
  readonly gpuMemoryUsage: number;
}

/**
 * Engine operation results
 */
export type EngineInitResult = Result<BabylonEngineState, EngineError>;
export type EngineUpdateResult = Result<EnginePerformanceMetrics, EngineError>;
export type EngineDisposeResult = Result<void, EngineError>;

/**
 * Engine error types
 */
export interface EngineError {
  readonly code: EngineErrorCode;
  readonly message: string;
  readonly details?: unknown;
  readonly timestamp: Date;
}

export enum EngineErrorCode {
  INITIALIZATION_FAILED = 'INITIALIZATION_FAILED',
  WEBGL_NOT_SUPPORTED = 'WEBGL_NOT_SUPPORTED',
  WEBGPU_NOT_SUPPORTED = 'WEBGPU_NOT_SUPPORTED',
  CANVAS_NOT_FOUND = 'CANVAS_NOT_FOUND',
  CONTEXT_LOST = 'CONTEXT_LOST',
  DISPOSAL_FAILED = 'DISPOSAL_FAILED',
  RENDER_FAILED = 'RENDER_FAILED',
}

/**
 * Default engine configuration
 */
export const DEFAULT_ENGINE_CONFIG: BabylonEngineConfig = {
  antialias: true,
  adaptToDeviceRatio: true,
  preserveDrawingBuffer: true,
  stencil: true,
  enableWebGPU: true,
  enableOfflineSupport: false,
  enableInspector: false,
  powerPreference: 'high-performance',
  failIfMajorPerformanceCaveat: false,
} as const;
