/**
 * @file babylon-canvas.types.ts
 * @description This file defines the TypeScript interfaces and types for the `BabylonCanvas` component.
 * It adheres to strict typing standards, utilizing `readonly` properties and `as const` assertions
 * to ensure immutability and type safety for configuration options and component props.
 *
 * @architectural_decision
 * - **Strict Typing**: All interfaces are designed with `readonly` properties to enforce immutability,
 *   which aligns with functional programming principles and helps prevent accidental state mutations.
 * - **Clear Separation**: This file is dedicated solely to type definitions, keeping the component logic
 *   (`babylon-canvas.tsx`) clean and focused.
 * - **Default Options**: Provides `DEFAULT_ENGINE_OPTIONS` and `DEFAULT_SCENE_OPTIONS` as `Readonly` constants,
 *   ensuring that default configurations are immutable and clearly defined.
 *
 * @example
 * ```typescript
 * // Example of using BabylonEngineOptions:
 * const customEngineOptions: BabylonEngineOptions = {
 *   antialias: false,
 *   adaptToDeviceRatio: false,
 * };
 *
 * // Example of using BabylonCanvasProps:
 * const canvasProps: BabylonCanvasProps = {
 *   onSceneReady: (scene) => console.log('Scene is ready'),
 *   engineOptions: customEngineOptions,
 *   className: 'my-custom-canvas',
 * };
 * ```
 */

import type { Engine, Scene } from '@babylonjs/core';
import type { CSSProperties } from 'react';

/**
 * @interface BabylonEngineOptions
 * @description Defines configuration options for initializing the Babylon.js `Engine`.
 * These options control various aspects of the rendering engine's behavior and performance.
 * @property {boolean} [antialias] - Optional. Specifies whether antialiasing should be enabled.
 * @property {boolean} [adaptToDeviceRatio] - Optional. If `true`, the engine will adapt to the device's pixel ratio.
 * @property {boolean} [preserveDrawingBuffer] - Optional. If `true`, the drawing buffer will be preserved after rendering.
 * @property {boolean} [stencil] - Optional. If `true`, a stencil buffer will be created.
 * @property {boolean} [loseContextOnDispose] - Optional. If `true`, the WebGL context will be lost when the engine is disposed.
 *   This is particularly useful in development for preventing context accumulation during hot module reloading.
 *
 * @example
 * ```typescript
 * const engineOpts: BabylonEngineOptions = {
 *   antialias: true,
 *   adaptToDeviceRatio: true,
 *   loseContextOnDispose: true,
 * };
 * ```
 */
export interface BabylonEngineOptions {
  readonly antialias?: boolean;
  readonly adaptToDeviceRatio?: boolean;
  readonly preserveDrawingBuffer?: boolean;
  readonly stencil?: boolean;
  readonly loseContextOnDispose?: boolean;
}

/**
 * @interface BabylonSceneOptions
 * @description Defines configuration options for initializing a Babylon.js `Scene`.
 * These options control the scene's rendering behavior.
 * @property {boolean} [autoClear] - Optional. If `true`, the scene will automatically clear the color buffer before rendering.
 * @property {boolean} [autoClearDepthAndStencil] - Optional. If `true`, the scene will automatically clear the depth and stencil buffers.
 *
 * @example
 * ```typescript
 * const sceneOpts: BabylonSceneOptions = {
 *   autoClear: false,
 *   autoClearDepthAndStencil: false,
 * };
 * ```
 */
export interface BabylonSceneOptions {
  readonly autoClear?: boolean;
  readonly autoClearDepthAndStencil?: boolean;
}

/**
 * @interface BabylonCanvasProps
 * @description Defines the properties (props) accepted by the `BabylonCanvas` React component.
 * These props allow for customization of the canvas appearance and behavior, and provide callbacks
 * for interacting with the Babylon.js engine and scene lifecycle.
 * @property {(scene: Scene) => void} [onSceneReady] - Optional callback function invoked when the Babylon.js `Scene` is ready.
 * @property {(engine: Engine) => void} [onEngineReady] - Optional callback function invoked when the Babylon.js `Engine` is ready.
 * @property {() => void} [onRenderLoop] - Optional callback function invoked on each frame of the Babylon.js render loop.
 * @property {BabylonEngineOptions} [engineOptions] - Optional configuration options for the Babylon.js `Engine`.
 * @property {BabylonSceneOptions} [sceneOptions] - Optional configuration options for the Babylon.js `Scene`.
 * @property {string} [className] - Optional. CSS class names to apply to the `<canvas>` element.
 * @property {CSSProperties} [style] - Optional. Inline CSS styles to apply to the `<canvas>` element.
 * @property {string} [data-testid] - Optional. A `data-testid` attribute for testing purposes.
 * @property {string} [aria-label] - Optional. An `aria-label` attribute for accessibility.
 *
 * @example
 * ```tsx
 * <BabylonCanvas
 *   onSceneReady={(scene) => console.log('Scene ready:', scene)}
 *   onEngineReady={(engine) => console.log('Engine ready:', engine)}
 *   engineOptions={{ antialias: true }}
 *   className="w-full h-full"
 *   data-testid="my-3d-canvas"
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
 * @constant DEFAULT_ENGINE_OPTIONS
 * @description Default engine options for Babylon.js, configured for optimal performance and development experience.
 * These options are applied by default if `engineOptions` are not explicitly provided to `BabylonCanvasProps`.
 * @property {boolean} antialias - `true` by default for smoother edges.
 * @property {boolean} adaptToDeviceRatio - `true` by default to ensure proper scaling on high-DPI screens.
 * @property {boolean} preserveDrawingBuffer - `true` by default, useful for screenshots or post-processing.
 * @property {boolean} stencil - `true` by default, enables stencil buffer for advanced rendering techniques.
 * @property {boolean} loseContextOnDispose - `true` by default, helps prevent WebGL context accumulation issues in development.
 */
export const DEFAULT_ENGINE_OPTIONS: Readonly<BabylonEngineOptions> = {
  antialias: true,
  adaptToDeviceRatio: true,
  preserveDrawingBuffer: true,
  stencil: true,
  loseContextOnDispose: true, // Prevent context accumulation
} as const;

/**
 * @constant DEFAULT_SCENE_OPTIONS
 * @description Default scene options for Babylon.js, configured for optimal performance.
 * These options are applied by default if `sceneOptions` are not explicitly provided to `BabylonCanvasProps`.
 * @property {boolean} autoClear - `false` by default to allow for custom clearing logic or overlays.
 * @property {boolean} autoClearDepthAndStencil - `false` by default, aligning with `autoClear` for manual control.
 */
export const DEFAULT_SCENE_OPTIONS: Readonly<BabylonSceneOptions> = {
  autoClear: false,
  autoClearDepthAndStencil: false,
} as const;
