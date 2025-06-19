/**
 * @file Material Manager Exports
 * 
 * Barrel export for material manager utilities
 * 
 * @author OpenSCAD-Babylon Pipeline
 * @date June 2025
 */

export {
  createMeshMaterial,
  applyMaterialToMesh,
  applyMaterialsToMeshCollection,
  getMaterialTheme,
  createMaterialFromConfig
} from './material-manager';

export type {
  MaterialResult,
  MaterialApplicationResult
} from './material-manager';
