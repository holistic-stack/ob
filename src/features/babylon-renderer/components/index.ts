/**
 * @file BabylonJS Components Exports
 *
 * Centralized exports for BabylonJS renderer components.
 * Following SRP principles with co-located tests.
 */

// Error Boundary Component
export type {
  BabylonErrorBoundaryProps,
  BabylonErrorBoundaryState,
  BabylonErrorDetails,
  BabylonErrorType,
} from './babylon-error-boundary';
export { BabylonErrorBoundary, useBabylonErrorHandler } from './babylon-error-boundary';
// Inspector Component
export type { BabylonInspectorProps } from './babylon-inspector';
export { BabylonInspector } from './babylon-inspector';
// Scene Components
export type { BabylonSceneProps } from './babylon-scene';
export { BabylonScene } from './babylon-scene';

// Camera Controls Component
export type { CameraControlsProps } from './camera-controls';
export { CameraControls } from './camera-controls';

// Store Connected Renderer - Main Component
export type { StoreConnectedRendererProps } from './store-connected-renderer';
export { StoreConnectedRenderer } from './store-connected-renderer';
