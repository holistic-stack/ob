/**
 * @file Processor Types
 * @description Type definitions for Manifold pipeline processors
 * Following strict TypeScript guidelines with no `any` types
 */

import type { ASTNode } from '../../../../openscad-parser/core/ast-types';

/**
 * Bounding box interface
 */
export interface BoundingBox {
  readonly min: { readonly x: number; readonly y: number; readonly z: number };
  readonly max: { readonly x: number; readonly y: number; readonly z: number };
}

/**
 * Manifold WASM object interface (strict typing)
 */
export interface ManifoldWasmObject {
  readonly delete: () => void;
  readonly translate: (vector: readonly [number, number, number]) => ManifoldWasmObject;
  readonly rotate: (axis: readonly [number, number, number], angle: number) => ManifoldWasmObject;
  readonly scale: (factors: readonly [number, number, number]) => ManifoldWasmObject;
  readonly transform: (matrix: readonly number[]) => ManifoldWasmObject;
  readonly getMesh: () => ManifoldMesh;
  readonly boundingBox: () => BoundingBox;
  readonly add: (other: ManifoldWasmObject) => ManifoldWasmObject;
  readonly subtract: (other: ManifoldWasmObject) => ManifoldWasmObject;
  readonly intersect: (other: ManifoldWasmObject) => ManifoldWasmObject;
}

/**
 * Manifold mesh data structure
 */
export interface ManifoldMesh {
  readonly vertPos: readonly number[];
  readonly triVerts: readonly number[];
  readonly numProp: number;
}

/**
 * Manifold primitive with metadata
 */
export interface ManifoldPrimitive {
  readonly type: string;
  readonly manifoldObject: ManifoldWasmObject;
  readonly parameters: Readonly<Record<string, unknown>>;
  readonly boundingBox: BoundingBox;
  readonly metadata: {
    readonly creationTime: number;
    readonly processingTime: number;
    readonly nodeId?: string;
  };
}

/**
 * Primitive factory result containing created primitives
 */
export interface PrimitiveFactoryResult {
  readonly primitives: readonly ManifoldPrimitive[];
  readonly totalCreationTime: number;
  readonly successCount: number;
  readonly failureCount: number;
}

/**
 * Transformation metadata
 */
export interface TransformationMetadata {
  readonly usedManifoldNative: boolean;
  readonly transformationType: string;
  readonly transformationParams: Readonly<Record<string, unknown>>;
  readonly composedTransformations?: readonly string[];
  readonly processingTime: number;
}

/**
 * Transformation result
 */
export interface TransformationResult {
  readonly transformedPrimitives: readonly ManifoldPrimitive[];
  readonly metadata: TransformationMetadata;
  readonly totalProcessingTime: number;
}

/**
 * CSG operation result
 */
export interface CSGOperationResult {
  readonly resultPrimitive: ManifoldPrimitive;
  readonly operationType: 'union' | 'difference' | 'intersection';
  readonly inputCount: number;
  readonly processingTime: number;
  readonly manifoldness: boolean;
}

/**
 * Result of complete pipeline processing
 */
export interface ManifoldPipelineResult {
  readonly geometries: readonly any[]; // Will be Three.js geometries
  readonly manifoldness: boolean;
  readonly processingTime: number;
  readonly operationsPerformed: readonly string[];
  readonly metadata: {
    readonly nodeCount: number;
    readonly pipelineVersion: string;
    readonly timestamp: Date;
  };
}

/**
 * Pipeline result containing final output
 */
export interface ManifoldPipelineResult {
  readonly geometries: readonly ManifoldPrimitive[];
  readonly manifoldness: boolean;
  readonly processingTime: number;
  readonly operationsPerformed: readonly string[];
  readonly metadata: {
    readonly nodeCount: number;
    readonly pipelineVersion: string;
    readonly timestamp: Date;
  };
}

/**
 * Processing context for pipeline operations
 */
export interface ProcessingContext {
  readonly timeout: number;
  readonly enableMetrics: boolean;
  readonly preserveMaterials: boolean;
  readonly optimizeResult: boolean;
  readonly resourceManager: ResourceManager;
}

/**
 * Resource manager interface for tracking WASM objects
 */
export interface ResourceManager {
  track(resource: ManifoldWasmObject): void;
  untrack(resource: ManifoldWasmObject): void;
  getResourceCount(): number;
  disposeAll(): void;
}

/**
 * Validation result for primitive parameters
 */
export interface ValidationResult {
  readonly isValid: boolean;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
}

/**
 * Primitive creation options
 */
export interface PrimitiveCreationOptions {
  readonly enableValidation?: boolean;
  readonly optimizeGeometry?: boolean;
  readonly generateBoundingBox?: boolean;
  readonly trackResources?: boolean;
}
