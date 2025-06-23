/**
 * @file R3F Scene Controls Index
 * 
 * Clean exports for the R3F scene controls component and related types.
 * 
 * @author OpenSCAD-R3F Pipeline
 * @version 1.0.0
 */

// Main component export
export { R3FSceneControls } from './r3f-scene-controls';

// Type exports
export type {
  R3FSceneControlsProps,
  MaterialConfig,
  LightingConfig,
  CameraConfig,
  EnvironmentConfig,
  CSGVisualizationMode
} from './r3f-scene-controls';

// Default export
export { R3FSceneControls as default } from './r3f-scene-controls';
