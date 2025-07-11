/**
 * 3D Renderer Utils - Backward Compatibility Exports
 *
 * Maintains backward compatibility while providing access to reorganized modules
 * following bulletproof-react patterns.
 */

// Re-export config for convenience
export { GEOMETRY_CONFIG } from '../config/geometry-config';
// Backward compatibility for CSG class and legacy utility classes
export { CSG, CSGCoreService, Node, Plane, Polygon, Vertex } from '../services/csg-core.service';
// Material utilities - migrated to MaterialService
// @deprecated Use MaterialService from '../services/material.service' instead
export { createMaterial } from '../services/material.service';
// Re-export types for backward compatibility
export type {
  BSPNodeData,
  BufferType,
  GeometricPrimitive,
  PlaneData,
  PolygonData,
  VertexData,
} from '../types/geometry.types';
export * from './geometry-utils';
export * from './matrix-adapters';
export * from './NBuf';
// Pure utility exports
export * from './Vector';

// Legacy class exports have been removed as part of Manifold CSG migration
// BSP-related exports removed in favor of Manifold 3D implementation
