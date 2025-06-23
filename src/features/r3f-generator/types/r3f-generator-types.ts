/**
 * @file R3F Generator Types
 * 
 * Type definitions for React Three Fiber component generation from CSG trees.
 * Defines interfaces for geometry generation, material application, and
 * performance optimization.
 * 
 * @author OpenSCAD-R3F Pipeline
 * @version 1.0.0
 */

import type * as THREE from 'three';
import type { CSGTree, CSGTreeNode, CSGMaterial, Vector3, Result } from '../../csg-processor';

// ============================================================================
// Core R3F Generation Types
// ============================================================================

/**
 * R3F generation configuration
 */
export interface R3FGeneratorConfig {
  readonly enableCaching?: boolean;
  readonly enableOptimization?: boolean;
  readonly enableLogging?: boolean;
  readonly maxCacheSize?: number;
  readonly geometryPrecision?: number;
  readonly materialQuality?: 'low' | 'medium' | 'high';
  readonly enableShadows?: boolean;
  readonly enableWireframe?: boolean;
}

/**
 * Generated Three.js geometry with metadata
 */
export interface GeneratedGeometry {
  readonly geometry: THREE.BufferGeometry;
  readonly material: THREE.Material;
  readonly metadata: {
    readonly nodeId: string;
    readonly nodeType: string;
    readonly vertexCount: number;
    readonly triangleCount: number;
    readonly generationTime: number;
    readonly cached: boolean;
  };
}

/**
 * Generated Three.js mesh with CSG context
 */
export interface GeneratedMesh {
  readonly mesh: THREE.Mesh;
  readonly nodeId: string;
  readonly nodeType: string;
  readonly transform?: THREE.Matrix4;
  readonly metadata: {
    readonly vertexCount: number;
    readonly triangleCount: number;
    readonly generationTime: number;
    readonly memoryUsage: number;
  };
}

/**
 * R3F scene generation result
 */
export interface R3FGenerationResult {
  readonly success: boolean;
  readonly meshes: readonly GeneratedMesh[];
  readonly scene?: THREE.Scene;
  readonly errors: readonly R3FGenerationError[];
  readonly warnings: readonly R3FGenerationError[];
  readonly metrics: {
    readonly totalMeshes: number;
    readonly totalVertices: number;
    readonly totalTriangles: number;
    readonly generationTime: number;
    readonly memoryUsage: number;
    readonly cacheHitRate: number;
  };
}

/**
 * R3F generation error
 */
export interface R3FGenerationError {
  readonly message: string;
  readonly code: string;
  readonly severity: 'error' | 'warning' | 'info';
  readonly nodeId?: string;
  readonly nodeType?: string;
}

/**
 * Geometry cache entry
 */
export interface GeometryCacheEntry {
  readonly geometry: THREE.BufferGeometry;
  readonly material: THREE.Material;
  readonly timestamp: number;
  readonly accessCount: number;
  readonly memoryUsage: number;
}

/**
 * Material configuration for R3F generation
 */
export interface R3FMaterialConfig extends CSGMaterial {
  readonly castShadow?: boolean;
  readonly receiveShadow?: boolean;
  readonly transparent?: boolean;
  readonly side?: THREE.Side;
  readonly alphaTest?: number;
  readonly depthWrite?: boolean;
  readonly depthTest?: boolean;
}

/**
 * Geometry generation parameters
 */
export interface GeometryParams {
  readonly segments?: number;
  readonly detail?: number;
  readonly precision?: number;
  readonly optimize?: boolean;
  readonly mergeVertices?: boolean;
  readonly computeNormals?: boolean;
  readonly computeTangents?: boolean;
}

/**
 * Transform parameters for R3F generation
 */
export interface R3FTransformParams {
  readonly position?: Vector3;
  readonly rotation?: Vector3;
  readonly scale?: Vector3;
  readonly matrix?: readonly number[];
  readonly pivot?: Vector3;
}

// ============================================================================
// Generator Function Types
// ============================================================================

/**
 * Geometry generator function type
 */
export type GeometryGenerator<T extends CSGTreeNode = CSGTreeNode> = (
  node: T,
  params: GeometryParams,
  config: R3FGeneratorConfig
) => Result<THREE.BufferGeometry, R3FGenerationError>;

/**
 * Material generator function type
 */
export type MaterialGenerator = (
  materialConfig: R3FMaterialConfig,
  config: R3FGeneratorConfig
) => Result<THREE.Material, R3FGenerationError>;

/**
 * Mesh generator function type
 */
export type MeshGenerator = (
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  transform?: R3FTransformParams
) => Result<THREE.Mesh, R3FGenerationError>;

/**
 * CSG operation processor function type
 */
export type CSGOperationProcessor = (
  operation: string,
  meshes: readonly THREE.Mesh[],
  config: R3FGeneratorConfig
) => Result<THREE.Mesh, R3FGenerationError>;

// ============================================================================
// Performance and Optimization Types
// ============================================================================

/**
 * Performance metrics for R3F generation
 */
export interface R3FPerformanceMetrics {
  readonly geometryGeneration: number;
  readonly materialGeneration: number;
  readonly meshGeneration: number;
  readonly csgOperations: number;
  readonly sceneAssembly: number;
  readonly totalTime: number;
  readonly memoryPeak: number;
  readonly cacheOperations: {
    readonly hits: number;
    readonly misses: number;
    readonly evictions: number;
  };
}

/**
 * Memory usage tracking
 */
export interface MemoryUsage {
  readonly geometries: number;
  readonly materials: number;
  readonly textures: number;
  readonly total: number;
}

/**
 * Cache statistics
 */
export interface CacheStatistics {
  readonly size: number;
  readonly maxSize: number;
  readonly hitRate: number;
  readonly evictionCount: number;
  readonly memoryUsage: number;
}

// ============================================================================
// Batch Processing Types
// ============================================================================

/**
 * Batch processing configuration
 */
export interface BatchProcessingConfig {
  readonly batchSize?: number;
  readonly enableParallel?: boolean;
  readonly maxConcurrency?: number;
  readonly enableProgressTracking?: boolean;
}

/**
 * Batch processing progress
 */
export interface BatchProgress {
  readonly processed: number;
  readonly total: number;
  readonly currentBatch: number;
  readonly totalBatches: number;
  readonly estimatedTimeRemaining: number;
  readonly currentOperation: string;
}

/**
 * Batch processing result
 */
export interface BatchProcessingResult {
  readonly success: boolean;
  readonly results: readonly R3FGenerationResult[];
  readonly errors: readonly R3FGenerationError[];
  readonly metrics: {
    readonly totalProcessed: number;
    readonly totalTime: number;
    readonly averageTimePerItem: number;
    readonly throughput: number;
  };
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Node visitor for R3F generation
 */
export type R3FNodeVisitor<T = GeneratedMesh> = (
  node: CSGTreeNode,
  depth: number,
  path: readonly number[]
) => Promise<T | null>;

/**
 * Mesh transformer function type
 */
export type MeshTransformer = (mesh: THREE.Mesh, node: CSGTreeNode) => THREE.Mesh;

/**
 * Scene optimizer function type
 */
export type SceneOptimizer = (scene: THREE.Scene, config: R3FGeneratorConfig) => THREE.Scene;

// ============================================================================
// Default Configurations
// ============================================================================

/**
 * Default R3F generator configuration
 */
export const DEFAULT_R3F_CONFIG: Required<R3FGeneratorConfig> = {
  enableCaching: true,
  enableOptimization: true,
  enableLogging: false,
  maxCacheSize: 100,
  geometryPrecision: 0.001,
  materialQuality: 'medium',
  enableShadows: true,
  enableWireframe: false
} as const;

/**
 * Default geometry parameters
 */
export const DEFAULT_GEOMETRY_PARAMS: Required<GeometryParams> = {
  segments: 32,
  detail: 2,
  precision: 0.001,
  optimize: true,
  mergeVertices: true,
  computeNormals: true,
  computeTangents: false
} as const;

/**
 * Default material configuration
 */
export const DEFAULT_MATERIAL_CONFIG: Required<R3FMaterialConfig> = {
  color: { r: 0.3, g: 0.5, b: 0.8, a: 1.0 },
  opacity: 1.0,
  metalness: 0.1,
  roughness: 0.4,
  wireframe: false,
  castShadow: true,
  receiveShadow: true,
  transparent: false,
  side: 2, // THREE.DoubleSide
  alphaTest: 0.0,
  depthWrite: true,
  depthTest: true
} as const;
