/**
 * @file index.ts
 * @description Barrel exports for OpenSCAD globals slice providing clean API surface
 * for importing slice types, implementation, and utilities.
 */

export { createOpenSCADGlobalsSlice, OPENSCAD_DEFAULTS } from './openscad-globals-slice.js';
export type {
  OpenSCADAnimation,
  OpenSCADDebug,
  OpenSCADGeometryResolution,
  OpenSCADGlobalsActions,
  OpenSCADGlobalsDefaults,
  OpenSCADGlobalsSlice,
  OpenSCADGlobalsState,
  OpenSCADGlobalsValidationError,
  OpenSCADModuleSystem,
  OpenSCADViewport,
  Vector3,
} from './openscad-globals-slice.types.js';
