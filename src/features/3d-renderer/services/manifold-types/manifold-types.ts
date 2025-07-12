/**
 * @file TypeScript types for Manifold 3D integration
 * Provides branded types, interfaces, and utility types for Manifold operations
 * Following bulletproof-react architecture and functional programming principles
 */

import type { Result } from '../../../../shared/types/result.types';

/**
 * Branded type for Manifold mesh data
 * Ensures type safety for mesh operations
 */
export interface ManifoldMesh {
  readonly vertices: Float32Array;
  readonly indices: Uint32Array;
  readonly normals?: Float32Array;
  readonly uvs?: Float32Array;
  readonly __brand: 'ManifoldMesh';
}

/**
 * Branded type for WASM resource management
 * Provides RAII patterns for Manifold WASM objects
 */
export interface ManifoldResource<T extends { delete(): void }> {
  readonly resource: T;
  readonly disposed: boolean;
  readonly __brand: 'ManifoldResource';
}

/**
 * Result type specialized for Manifold operations
 * Integrates with project Result<T,E> patterns
 */
export type ManifoldResult<T> = Result<T, ManifoldError>;

/**
 * Structured error types for Manifold operations
 */
export interface ManifoldError {
  readonly code: ManifoldErrorCode;
  readonly message: string;
  readonly context?: Record<string, unknown>;
}

/**
 * Error codes for Manifold operations
 */
export type ManifoldErrorCode =
  | 'WASM_INIT_FAILED'
  | 'WASM_LOAD_FAILED'
  | 'MESH_INVALID'
  | 'MESH_NOT_MANIFOLD'
  | 'CSG_OPERATION_FAILED'
  | 'MEMORY_ALLOCATION_FAILED'
  | 'RESOURCE_DISPOSED'
  | 'VALIDATION_FAILED'
  | 'CONVERSION_FAILED';

/**
 * CSG operation types supported by Manifold
 */
export type CSGOperationType = 'union' | 'difference' | 'intersection';

/**
 * Configuration for Manifold operations
 */
export interface ManifoldConfig {
  readonly enableOptimization: boolean;
  readonly maxComplexity: number;
  readonly memoryLimit: number;
  readonly precision?: number;
  readonly enableCaching?: boolean;
}

/**
 * Manifold CSG operation definition
 */
export interface ManifoldOperation {
  readonly type: CSGOperationType;
  readonly meshes: readonly ManifoldMesh[];
  readonly config: ManifoldConfig;
}

/**
 * Discriminated union for Manifold primitives
 */
export type ManifoldPrimitive =
  | ManifoldCube
  | ManifoldSphere
  | ManifoldCylinder
  | ManifoldCone
  | ManifoldTorus;

/**
 * Cube primitive definition
 */
export interface ManifoldCube {
  readonly type: 'cube';
  readonly size: readonly [number, number, number];
  readonly center?: boolean;
}

/**
 * Sphere primitive definition
 */
export interface ManifoldSphere {
  readonly type: 'sphere';
  readonly radius: number;
  readonly segments?: number;
  readonly rings?: number;
}

/**
 * Cylinder primitive definition
 */
export interface ManifoldCylinder {
  readonly type: 'cylinder';
  readonly radius: number;
  readonly height: number;
  readonly segments?: number;
  readonly center?: boolean;
}

/**
 * Cone primitive definition
 */
export interface ManifoldCone {
  readonly type: 'cone';
  readonly radiusBottom: number;
  readonly radiusTop: number;
  readonly height: number;
  readonly segments?: number;
  readonly center?: boolean;
}

/**
 * Torus primitive definition
 */
export interface ManifoldTorus {
  readonly type: 'torus';
  readonly majorRadius: number;
  readonly minorRadius: number;
  readonly majorSegments?: number;
  readonly minorSegments?: number;
}

/**
 * 3D transformation definition
 */
export interface ManifoldTransform {
  readonly translate?: readonly [number, number, number];
  readonly rotate?: readonly [number, number, number];
  readonly scale?: readonly [number, number, number];
  readonly matrix?: Float32Array; // 4x4 transformation matrix
}

/**
 * Mesh validation result
 */
export interface ManifoldValidationResult {
  readonly isValid: boolean;
  readonly isManifold: boolean;
  readonly isWatertight: boolean;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
  readonly triangleCount?: number;
  readonly vertexCount?: number;
  readonly boundingBox?: {
    readonly min: readonly [number, number, number];
    readonly max: readonly [number, number, number];
  };
}

/**
 * Performance metrics for Manifold operations
 */
export interface ManifoldPerformanceMetrics {
  readonly operationType: CSGOperationType | 'primitive' | 'transform';
  readonly duration: number; // milliseconds
  readonly memoryUsed: number; // bytes
  readonly triangleCount: number;
  readonly complexity: number;
  readonly timestamp: number;
}

/**
 * Memory usage statistics
 */
export interface ManifoldMemoryStats {
  readonly totalAllocated: number;
  readonly totalFreed: number;
  readonly currentUsage: number;
  readonly peakUsage: number;
  readonly activeResources: number;
}

/**
 * WASM module configuration
 */
export interface ManifoldWasmConfig {
  readonly wasmPath?: string;
  readonly memoryInitial?: number; // Initial memory pages
  readonly memoryMaximum?: number; // Maximum memory pages
  readonly enableThreads?: boolean;
  readonly enableSIMD?: boolean;
}

/**
 * Utility type for extracting primitive type
 */
export type PrimitiveType<T extends ManifoldPrimitive> = T['type'];

/**
 * Utility type for primitive parameters
 */
export type PrimitiveParams<T extends PrimitiveType<ManifoldPrimitive>> = Extract<
  ManifoldPrimitive,
  { type: T }
>;

/**
 * Type guard for ManifoldMesh
 */
export const isManifoldMesh = (value: unknown): value is ManifoldMesh => {
  return (
    typeof value === 'object' &&
    value !== null &&
    '__brand' in value &&
    (value as any).__brand === 'ManifoldMesh' &&
    'vertices' in value &&
    'indices' in value
  );
};

/**
 * Type guard for ManifoldResource
 */
export const isManifoldResource = <T extends { delete(): void }>(
  value: unknown
): value is ManifoldResource<T> => {
  return (
    typeof value === 'object' &&
    value !== null &&
    '__brand' in value &&
    (value as any).__brand === 'ManifoldResource' &&
    'resource' in value &&
    'disposed' in value
  );
};

/**
 * Type guard for CSGOperationType
 */
export const isCSGOperationType = (value: unknown): value is CSGOperationType => {
  return typeof value === 'string' && ['union', 'difference', 'intersection'].includes(value);
};

/**
 * Type guard for ManifoldPrimitive
 */
export const isManifoldPrimitive = (value: unknown): value is ManifoldPrimitive => {
  return (
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    typeof (value as any).type === 'string' &&
    ['cube', 'sphere', 'cylinder', 'cone', 'torus'].includes((value as any).type)
  );
};

/**
 * Utility functions for creating branded types
 */
export const createManifoldMesh = (
  vertices: Float32Array,
  indices: Uint32Array,
  normals?: Float32Array,
  uvs?: Float32Array
): ManifoldMesh => {
  return Object.freeze({
    vertices,
    indices,
    ...(normals && { normals }),
    ...(uvs && { uvs }),
    __brand: 'ManifoldMesh' as const,
  });
};

/**
 * Utility function for creating ManifoldResource
 */
export const createManifoldResource = <T extends { delete(): void }>(
  resource: T
): ManifoldResource<T> => {
  return Object.freeze({
    resource,
    disposed: false,
    __brand: 'ManifoldResource' as const,
  });
};

/**
 * Utility function for creating success results
 */
export const createManifoldSuccess = <T>(data: T): ManifoldResult<T> => {
  return { success: true, data };
};

/**
 * Utility function for creating error results
 */
export const createManifoldError = <T = never>(error: ManifoldError): ManifoldResult<T> => {
  return { success: false, error };
};

/**
 * Type predicate for checking if result is success
 */
export const isManifoldSuccess = <T>(
  result: ManifoldResult<T>
): result is { readonly success: true; readonly data: T } => {
  return result.success === true;
};

/**
 * Type predicate for checking if result is error
 */
export const isManifoldError = <T>(
  result: ManifoldResult<T>
): result is { readonly success: false; readonly error: ManifoldError } => {
  return result.success === false;
};
