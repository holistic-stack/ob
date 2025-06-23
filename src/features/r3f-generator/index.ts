/**
 * @file R3F Generator Feature Index
 * 
 * Clean exports for the R3F generator feature including core generator,
 * types, and utility functions.
 * 
 * @author OpenSCAD-R3F Pipeline
 * @version 1.0.0
 */

// Core generator exports
export { 
  generateR3FFromCSGTree,
  clearGeometryCache,
  getCacheStatistics
} from './core/r3f-generator';

// Type exports
export type {
  R3FGeneratorConfig,
  R3FGenerationResult,
  R3FGenerationError,
  GeneratedGeometry,
  GeneratedMesh,
  GeometryCacheEntry,
  R3FMaterialConfig,
  GeometryParams,
  R3FTransformParams,
  R3FPerformanceMetrics,
  MemoryUsage,
  CacheStatistics,
  BatchProcessingConfig,
  BatchProgress,
  BatchProcessingResult,
  GeometryGenerator,
  MaterialGenerator,
  MeshGenerator,
  CSGOperationProcessor,
  R3FNodeVisitor,
  MeshTransformer,
  SceneOptimizer
} from './types/r3f-generator-types';

// Default configuration exports
export {
  DEFAULT_R3F_CONFIG,
  DEFAULT_GEOMETRY_PARAMS,
  DEFAULT_MATERIAL_CONFIG
} from './types/r3f-generator-types';
