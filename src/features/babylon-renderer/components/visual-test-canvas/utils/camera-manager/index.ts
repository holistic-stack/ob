/**
 * @file Camera Manager Exports
 * 
 * Barrel export for camera manager utilities
 * 
 * @author OpenSCAD-Babylon Pipeline
 * @date June 2025
 */

export {
  calculateMeshBounds,
  calculateOptimalCameraPosition,
  positionCameraForMeshes,
  createCameraConfiguration
} from './camera-manager';

export type {
  CameraResult
} from './camera-manager';
