/**
 * @file BabylonCanvas Component Types
 *
 * TypeScript interfaces and types for the BabylonCanvas component.
 * Follows strict typing standards with readonly props and branded types.
 */

import type { Engine, Scene } from '@babylonjs/core';
import type { CSSProperties } from 'react';

/**
 * Engine configuration options for BabylonJS engine initialization
 */
export interface BabylonEngineOptions {
  readonly antialias?: boolean;
  readonly adaptToDeviceRatio?: boolean;
  readonly preserveDrawingBuffer?: boolean;
  readonly stencil?: boolean;
  readonly loseContextOnDispose?: boolean;
}

/**
 * Scene configuration options for BabylonJS scene initialization
 */
export interface BabylonSceneOptions {
  readonly autoClear?: boolean;
  readonly autoClearDepthAndStencil?: boolean;
}

/**
 * Props for the BabylonCanvas component
 *
 * @example
 * ```tsx
 * <BabylonCanvas
 *   onSceneReady={(scene) => console.log('Scene ready:', scene)}
 *   onEngineReady={(engine) => console.log('Engine ready:', engine)}
 *   engineOptions={{ antialias: true }}
 *   className="w-full h-full"
 * />
 * ```
 */
export interface BabylonCanvasProps {
  readonly onSceneReady?: (scene: Scene) => void;
  readonly onEngineReady?: (engine: Engine) => void;
  readonly onRenderLoop?: () => void;
  readonly engineOptions?: BabylonEngineOptions;
  readonly sceneOptions?: BabylonSceneOptions;
  readonly className?: string;
  readonly style?: CSSProperties;
  readonly 'data-testid'?: string;
  readonly 'aria-label'?: string;
}

/**
 * Default engine options following React 19 and performance best practices
 */
export const DEFAULT_ENGINE_OPTIONS: Readonly<BabylonEngineOptions> = {
  antialias: true,
  adaptToDeviceRatio: true,
  preserveDrawingBuffer: true,
  stencil: true,
  loseContextOnDispose: true, // Prevent context accumulation
} as const;

/**
 * Default scene options for optimal performance
 */
export const DEFAULT_SCENE_OPTIONS: Readonly<BabylonSceneOptions> = {
  autoClear: false,
  autoClearDepthAndStencil: false,
} as const;
