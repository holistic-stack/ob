/**
 * 3D Renderer Utils - Backward Compatibility Exports
 *
 * Maintains backward compatibility while providing access to reorganized modules
 * following bulletproof-react patterns.
 */

// Backward compatibility for CSG class and legacy utility classes
export { CSG, CSGCoreService, Vertex, Plane, Polygon, Node } from '../services/csg-core.service';

// Pure utility exports
export * from './Vector';
export * from './NBuf';
export * from './geometry-utils';
export * from './matrix-adapters';

// Re-export types for backward compatibility
export type {
  VertexData,
  PlaneData,
  PolygonData,
  BSPNodeData,
  GeometricPrimitive,
  BufferType
} from '../types/geometry.types';

// Re-export config for convenience
export { GEOMETRY_CONFIG } from '../config/geometry-config';

// Legacy class exports - these will be removed in future versions
// Use the new service-based approach instead

// @deprecated - These classes have been moved to services
// Use the new service-based approach instead
export { BSPTreeNode } from '../services/bsp-tree.service';
