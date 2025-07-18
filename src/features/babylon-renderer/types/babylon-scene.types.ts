/**
 * @file BabylonJS Scene Type Definitions
 *
 * Type definitions for BabylonJS scene management and configuration.
 * Following functional programming patterns with immutable data structures.
 */

import type { Camera, Engine, Light, Mesh, Scene } from '@babylonjs/core';
import type { Result } from '../../../shared/types/result.types';
import type { BabylonSceneService } from '../services/babylon-scene-service';

/**
 * Module augmentation to extend BabylonJS Scene interface
 * with custom properties used by our application
 */
declare module '@babylonjs/core' {
  interface Scene {
    /**
     * Custom scene service reference for camera controls and scene management
     */
    _sceneService?: BabylonSceneService;
  }
}

/**
 * BabylonJS scene configuration
 */
export interface BabylonSceneConfig {
  readonly enablePhysics: boolean;
  readonly enableInspector: boolean;
  readonly enableWebGPU: boolean;
  readonly antialias: boolean;
  readonly adaptToDeviceRatio: boolean;
  readonly preserveDrawingBuffer: boolean;
  readonly stencil: boolean;
}

/**
 * Scene initialization options
 */
export interface SceneInitOptions {
  readonly config: BabylonSceneConfig;
  readonly canvas: HTMLCanvasElement;
  readonly onSceneReady?: (scene: Scene) => void;
  readonly onEngineReady?: (engine: Engine) => void;
}

/**
 * Scene state for reactive management
 */
export interface BabylonSceneState {
  readonly scene: Scene | null;
  readonly engine: Engine | null;
  readonly isInitialized: boolean;
  readonly isDisposed: boolean;
  readonly cameras: ReadonlyArray<Camera>;
  readonly lights: ReadonlyArray<Light>;
  readonly meshes: ReadonlyArray<Mesh>;
  readonly lastUpdated: Date;
}

/**
 * Scene operation results
 */
export type SceneInitResult = Result<BabylonSceneState, SceneError>;
export type SceneUpdateResult = Result<void, SceneError>;
export type SceneDisposeResult = Result<void, SceneError>;

/**
 * Scene error types
 */
export interface SceneError {
  readonly code: SceneErrorCode;
  readonly message: string;
  readonly details?: unknown;
  readonly timestamp: Date;
}

export enum SceneErrorCode {
  INITIALIZATION_FAILED = 'INITIALIZATION_FAILED',
  ENGINE_CREATION_FAILED = 'ENGINE_CREATION_FAILED',
  WEBGPU_NOT_SUPPORTED = 'WEBGPU_NOT_SUPPORTED',
  CANVAS_NOT_FOUND = 'CANVAS_NOT_FOUND',
  DISPOSAL_FAILED = 'DISPOSAL_FAILED',
  UPDATE_FAILED = 'UPDATE_FAILED',
}

/**
 * Default scene configuration
 */
export const DEFAULT_SCENE_CONFIG: BabylonSceneConfig = {
  enablePhysics: false,
  enableInspector: false,
  enableWebGPU: true,
  antialias: true,
  adaptToDeviceRatio: true,
  preserveDrawingBuffer: true,
  stencil: true,
} as const;
