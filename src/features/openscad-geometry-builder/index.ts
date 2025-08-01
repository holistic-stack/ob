/**
 * @file index.ts
 * @description Main entry point for the OpenSCAD Geometry Builder feature.
 * This feature provides OpenSCAD-compatible geometry generation that replicates
 * desktop OpenSCAD's exact primitive tessellation algorithms.
 *
 * @example
 * ```typescript
 * import { OpenSCADGeometryBuilder } from '@/features/openscad-geometry-builder';
 *
 * // Generate sphere with exact OpenSCAD tessellation
 * const sphereResult = await geometryBuilder.generateSphere(5, 3); // $fn=3
 * if (sphereResult.isOk()) {
 *   const mesh = await babylonBuilder.createPolyhedronMesh(sphereResult.value, scene);
 * }
 * ```
 *
 * @author OpenSCAD Babylon Team
 * @version 1.0.0
 * @since 2025-07-29
 */

// AST and Pipeline Services
export * from './services/ast-converter';
// Core Services
export * from './services/fragment-calculator';
export * from './services/geometry-bridge';
export * from './services/mesh-converter';
export * from './services/pipeline';
// 2D Primitive Generators
export * from './services/primitive-generators/2d-primitives';
// 3D Primitive Generators
export * from './services/primitive-generators/3d-primitives';
// Geometric Functions (Future phases)
export * from './services/primitive-generators/geometric-functions';
export * from './services/primitive-generators/import-primitives';
// Text and Import Generators (Future phases)
export * from './services/primitive-generators/text-primitives';

// Types and Utilities
export * from './types';
export * from './utils';

/**
 * Feature metadata for the OpenSCAD Geometry Builder
 */
export const OPENSCAD_GEOMETRY_BUILDER_FEATURE = {
  name: 'openscad-geometry-builder',
  version: '1.0.0',
  description: 'OpenSCAD-compatible geometry generation with exact tessellation algorithms',
  priority: 'HIGH',
  status: 'IN_DEVELOPMENT',
  phases: {
    'core-infrastructure': 'IN_PROGRESS',
    'essential-3d-primitives': 'PLANNED',
    'essential-2d-primitives': 'PLANNED',
    'advanced-2d-operations': 'PLANNED',
    'text-import-support': 'PLANNED',
    'advanced-geometric-functions': 'PLANNED',
  },
} as const;
