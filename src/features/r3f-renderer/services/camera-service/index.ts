/**
 * @file R3F Camera Service Index
 * 
 * Clean exports for the R3F camera service providing equivalent functionality
 * to Babylon.js camera system with bounds calculation, positioning, and framing.
 * 
 * @author OpenSCAD-R3F Pipeline
 * @version 1.0.0
 */

// Service exports
export {
  r3fCameraService,
  calculateMeshBounds,
  calculateSceneBounds,
  calculateOptimalPosition,
  positionCameraForMesh,
  positionCameraForScene,
  resetCamera,
  applyCameraPosition
} from './r3f-camera-service';

// Type exports
export type {
  R3FCameraPosition,
  R3FMeshBounds,
  R3FCameraConfig,
  R3FCameraControls,
  R3FCameraService
} from './r3f-camera-service';
