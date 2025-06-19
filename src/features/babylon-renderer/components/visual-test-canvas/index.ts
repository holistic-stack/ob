/**
 * @file Visual Test Canvas Component Exports
 *
 * Central export point for the VisualTestCanvas component and related types
 * Includes both original and refactored components for backward compatibility
 *
 * @author OpenSCAD-Babylon Pipeline
 * @date June 2025
 */

// Original component (maintained for backward compatibility)
export { VisualTestCanvas } from './visual-test-canvas';
export type { VisualTestCanvasProps } from './visual-test-canvas';

// Refactored components following SRP principles
export { RefactoredVisualTestCanvas } from './refactored-visual-test-canvas';
export { OpenSCADToMeshWrapper } from './openscad-to-mesh-wrapper';

// New hooks and utilities
export { useOpenSCADMeshes } from './hooks/use-openscad-meshes';
export * from './utils/material-manager';
export * from './utils/camera-manager';

// Types for the refactored components
export type * from './types/visual-test-canvas-types';

// Other components
export { TransformationComparisonCanvas } from './transformation-comparison-canvas';
export type { TransformationComparisonCanvasProps } from './transformation-comparison-canvas';
