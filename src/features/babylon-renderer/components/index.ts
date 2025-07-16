/**
 * @file BabylonJS Components Exports
 *
 * Centralized exports for all BabylonJS renderer components.
 * Following SRP principles with co-located tests.
 */

// Scene components (to be implemented)
// export * from './babylon-scene';

// Engine components (to be implemented)
// export * from './babylon-engine';

// Camera components (to be implemented)
// export * from './babylon-camera';

// Store bridge components (to be implemented)
// export * from './store-babylon-bridge';

// Babylon Error Boundary Component
export { BabylonErrorBoundary, useBabylonErrorHandler } from './babylon-error-boundary';
export type {
  BabylonErrorType,
  BabylonErrorDetails,
  BabylonErrorBoundaryState,
  BabylonErrorBoundaryProps,
} from './babylon-error-boundary';

// Progress Bar Component
export { ProgressBar } from './progress-bar';
export type {
  ProgressBarProps,
  ProgressBarSize,
  ProgressBarColor,
} from './progress-bar';

// Selection Info Component
export { SelectionInfo } from './selection-info';
export type {
  SelectionInfoProps,
} from './selection-info';

// Export Dialog Component
export { ExportDialog } from './export-dialog';
export type {
  ExportDialogProps,
} from './export-dialog';
