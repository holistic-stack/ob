/**
 * @file index.ts
 * @description This file serves as a barrel file for the `babylon-canvas` module.
 * It re-exports the `BabylonCanvas` component, its associated types (`BabylonCanvasProps`,
 * `BabylonEngineOptions`, `BabylonSceneOptions`), and default configuration options.
 * This provides a single, convenient entry point for consumers of this module.
 *
 * @architectural_decision
 * - **Barrel File**: Simplifies imports for other modules by consolidating exports.
 *   Instead of importing individual components or types from their specific files,
 *   consumers can import everything from this `index.ts` file.
 * - **Encapsulation**: By controlling what is re-exported, this file defines the public API
 *   of the `babylon-canvas` module, hiding internal implementation details.
 *
 * @example
 * ```typescript
 * // Before (without barrel file):
 * import { BabylonCanvas } from './babylon-canvas/babylon-canvas';
 * import type { BabylonCanvasProps } from './babylon-canvas/babylon-canvas.types';
 *
 * // After (with barrel file):
 * import { BabylonCanvas, BabylonCanvasProps } from './babylon-canvas';
 *
 * function MyComponent(props: BabylonCanvasProps) {
 *   return <BabylonCanvas {...props} />;
 * }
 * ```
 */

export { BabylonCanvas } from './babylon-canvas';
export type {
  BabylonCanvasProps,
  BabylonEngineOptions,
  BabylonSceneOptions,
} from './babylon-canvas.types';
export {
  DEFAULT_ENGINE_OPTIONS,
  DEFAULT_SCENE_OPTIONS,
} from './babylon-canvas.types';
