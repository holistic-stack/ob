/**
 * @file AST to CSG Conversion Types
 * 
 * Type definitions for the conversion layer that bridges OpenSCAD AST nodes
 * to generic mesh data structures. This layer encapsulates all OpenSCAD-specific
 * knowledge and provides generic interfaces for the rendering layer.
 */

// TODO: Replace with BabylonJS types
// import type { Geometry, Matrix, BoundingBox } from '@babylonjs/core';
import type { Result } from '../../../shared/types/result.types';

/**
 * Generic mesh data structure (no OpenSCAD references)
 * This is what the rendering layer consumes
 */
export interface GenericMeshData {
  readonly id: string;
  readonly geometry: unknown; // TODO: Replace with BabylonJS Geometry
  readonly material: MaterialConfig;
  readonly transform: unknown; // TODO: Replace with BabylonJS Matrix
  readonly metadata: MeshMetadata;
}

/**
 * Material configuration for generic meshes
 */
export interface MaterialConfig {
  readonly color: string;
  readonly metalness: number;
  readonly roughness: number;
  readonly opacity: number;
  readonly transparent: boolean;
  readonly side: 'front' | 'back' | 'double';
  readonly wireframe?: boolean;
}

/**
 * Metadata for generic meshes
 */
export interface MeshMetadata {
  readonly meshId: string;
  readonly triangleCount: number;
  readonly vertexCount: number;
  readonly boundingBox: unknown; // TODO: Replace with BabylonJS BoundingBox
  readonly complexity: number;
  readonly operationTime: number;
  readonly isOptimized: boolean;
  readonly lastAccessed: Date;
}

/**
 * Conversion options for AST to mesh conversion
 */
export interface ConversionOptions {
  readonly preserveMaterials?: boolean;
  readonly optimizeResult?: boolean;
  readonly timeout?: number;
  readonly enableCaching?: boolean;
  readonly maxComplexity?: number;
}

/**
 * Result of AST to mesh conversion
 */
export interface ConversionResult {
  readonly meshes: ReadonlyArray<GenericMeshData>;
  readonly operationTime: number;
  readonly totalVertices: number;
  readonly totalTriangles: number;
  readonly errors: ReadonlyArray<string>;
}

/**
 * Conversion service interface
 */
export interface ASTToMeshConverter {
  readonly initialize: () => Promise<Result<void, string>>;
  readonly convert: (
    ast: ReadonlyArray<unknown>, // Generic AST nodes
    options?: ConversionOptions
  ) => Promise<Result<ConversionResult, string>>;
  readonly convertSingle: (
    node: unknown, // Generic AST node
    options?: ConversionOptions
  ) => Promise<Result<GenericMeshData, string>>;
  readonly dispose: () => void;
}

/**
 * Conversion pipeline configuration
 */
export interface ConversionPipelineConfig {
  readonly enableOptimization: boolean;
  readonly maxConcurrentOperations: number;
  readonly cacheSize: number;
  readonly timeoutMs: number;
  readonly memoryLimitMB: number;
}

/**
 * Conversion error types
 */
export interface ConversionError {
  readonly type: 'geometry' | 'material' | 'transformation' | 'csg' | 'memory';
  readonly message: string;
  readonly nodeType?: string;
  readonly nodeIndex?: number;
  readonly stack?: string;
}

/**
 * Performance metrics for conversion operations
 */
export interface ConversionMetrics {
  readonly totalConversions: number;
  readonly averageTime: number;
  readonly cacheHitRate: number;
  readonly memoryUsage: number;
  readonly errorRate: number;
}
