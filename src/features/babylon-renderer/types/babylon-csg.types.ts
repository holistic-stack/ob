/**
 * @file BabylonJS CSG2 Type Definitions
 *
 * Type definitions for BabylonJS CSG2 operations with Manifold integration.
 * Following functional programming patterns with Result<T,E> error handling.
 */

import type { Mesh } from '@babylonjs/core';
import type { Result } from '../../../shared/types/result.types';

/**
 * CSG2 operation types
 */
export enum CSGOperationType {
  UNION = 'union',
  DIFFERENCE = 'difference',
  INTERSECTION = 'intersection',
}

/**
 * CSG2 operation configuration
 */
export interface CSGOperationConfig {
  readonly operation: CSGOperationType;
  readonly preserveMaterials: boolean;
  readonly optimizeResult: boolean;
  readonly tolerance: number;
  readonly maxIterations: number;
}

/**
 * CSG2 operation input
 */
export interface CSGOperationInput {
  readonly meshA: Mesh;
  readonly meshB: Mesh;
  readonly config: CSGOperationConfig;
}

/**
 * CSG2 operation result
 */
export interface CSGOperationResult {
  readonly resultMesh: Mesh;
  readonly operationType: CSGOperationType;
  readonly operationTime: number;
  readonly triangleCount: number;
  readonly vertexCount: number;
  readonly isOptimized: boolean;
  readonly metadata: CSGOperationMetadata;
}

/**
 * CSG2 operation metadata
 */
export interface CSGOperationMetadata {
  readonly operationId: string;
  readonly timestamp: Date;
  readonly inputMeshIds: ReadonlyArray<string>;
  readonly manifoldVersion: string;
  readonly babylonVersion: string;
  readonly performance: CSGPerformanceMetrics;
}

/**
 * CSG2 performance metrics
 */
export interface CSGPerformanceMetrics {
  readonly preparationTime: number;
  readonly operationTime: number;
  readonly conversionTime: number;
  readonly totalTime: number;
  readonly memoryUsage: number;
}

/**
 * CSG2 error types
 */
export interface CSGError {
  readonly code: CSGErrorCode;
  readonly message: string;
  readonly operation: CSGOperationType;
  readonly details?: unknown;
  readonly timestamp: Date;
}

export enum CSGErrorCode {
  INVALID_MESH = 'INVALID_MESH',
  OPERATION_FAILED = 'OPERATION_FAILED',
  MEMORY_LIMIT_EXCEEDED = 'MEMORY_LIMIT_EXCEEDED',
  TIMEOUT_EXCEEDED = 'TIMEOUT_EXCEEDED',
  CSG_ERROR = 'CSG_ERROR',
}

/**
 * CSG2 service state
 */
export interface CSGServiceState {
  readonly isEnabled: boolean;
  readonly operations: ReadonlyArray<CSGOperationResult>;
  readonly lastOperationTime: number;
  readonly error: CSGError | null;
  readonly lastUpdated: Date;
}

/**
 * CSG2 operation result types
 */
export type CSGUnionResult = Result<CSGOperationResult, CSGError>;
export type CSGDifferenceResult = Result<CSGOperationResult, CSGError>;
export type CSGIntersectionResult = Result<CSGOperationResult, CSGError>;

/**
 * Default CSG2 configuration
 */
export const DEFAULT_CSG_CONFIG: CSGOperationConfig = {
  operation: CSGOperationType.UNION,
  preserveMaterials: true,
  optimizeResult: true,
  tolerance: 1e-6,
  maxIterations: 1000,
} as const;
