/**
 * Enhanced Matrix Type Definitions
 *
 * Comprehensive type definitions for matrix operations with Three.js integration,
 * branded types for type safety, and performance optimization types.
 */

import type { Matrix as MLMatrix } from 'ml-matrix';
import type { Euler, Matrix3, Matrix4, Quaternion, Vector3 } from 'three';

/**
 * Branded types for enhanced type safety
 */
export type TransformationMatrix = MLMatrix & { readonly __brand: 'TransformationMatrix' };
export type RotationMatrix = MLMatrix & { readonly __brand: 'RotationMatrix' };
export type ScaleMatrix = MLMatrix & { readonly __brand: 'ScaleMatrix' };
export type ProjectionMatrix = MLMatrix & { readonly __brand: 'ProjectionMatrix' };
export type ViewMatrix = MLMatrix & { readonly __brand: 'ViewMatrix' };
export type NormalMatrix = MLMatrix & { readonly __brand: 'NormalMatrix' };

/**
 * Matrix operation result types with performance metadata
 */
export interface MatrixOperationResult<T = MLMatrix> {
  readonly result: T;
  readonly performance: {
    readonly executionTime: number;
    readonly memoryUsed: number;
    readonly operationType: string;
    readonly matrixSize: readonly [number, number];
    readonly cacheHit: boolean;
  };
  readonly metadata: {
    readonly timestamp: number;
    readonly operationId: string;
    readonly inputHash: string;
  };
}

/**
 * Matrix cache entry type
 */
export interface MatrixCacheEntry {
  readonly matrix: MLMatrix;
  readonly timestamp: number;
  readonly accessCount: number;
  readonly lastAccessed: number;
  readonly size: number;
  readonly hash: string;
  readonly metadata: Record<string, unknown>;
}

/**
 * Three.js integration types
 */
export interface _ThreeJSMatrixConversion {
  readonly matrix3: Matrix3;
  readonly matrix4: Matrix4;
  readonly source: MLMatrix;
  readonly conversionTime: number;
  readonly cached: boolean;
}

export interface ThreeJSTransformData {
  readonly position: Vector3;
  readonly rotation: Quaternion | Euler;
  readonly scale: Vector3;
  readonly matrix: Matrix4;
  readonly normalMatrix: Matrix3;
}

/**
 * Matrix decomposition types
 */
export interface MatrixDecomposition {
  readonly lu?: {
    readonly L: MLMatrix;
    readonly U: MLMatrix;
    readonly P: MLMatrix;
  };
  readonly qr?: {
    readonly Q: MLMatrix;
    readonly R: MLMatrix;
  };
  readonly svd?: {
    readonly U: MLMatrix;
    readonly S: MLMatrix;
    readonly V: MLMatrix;
  };
  readonly eigenvalues?: {
    readonly values: number[];
    readonly vectors: MLMatrix;
  };
  readonly cholesky?: MLMatrix;
}

/**
 * Matrix operation types
 */
export type MatrixOperation =
  | 'add'
  | 'subtract'
  | 'multiply'
  | 'divide'
  | 'transpose'
  | 'inverse'
  | 'pseudoInverse'
  | 'determinant'
  | 'trace'
  | 'rank'
  | 'eigenvalues'
  | 'eigenvectors'
  | 'lu'
  | 'qr'
  | 'svd'
  | 'cholesky'
  | 'solve'
  | 'norm'
  | 'condition'
  | 'transform'
  | 'rotate'
  | 'scale'
  | 'translate'
  | 'validate'
  | 'get';

/**
 * Matrix validation types
 */
export interface MatrixValidation {
  readonly isValid: boolean;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
  readonly suggestions: readonly string[];
}

/**
 * Performance monitoring types
 */
export interface MatrixPerformanceMetrics {
  readonly operationCount: number;
  readonly totalExecutionTime: number;
  readonly averageExecutionTime: number;
  readonly cacheHitRate: number;
  readonly memoryUsage: number;
  readonly largeMatrixOperations: number;
  readonly failedOperations: number;
}

/**
 * Matrix batch operation types
 */
export interface MatrixBatchOperation<T = MLMatrix> {
  readonly operation: MatrixOperation;
  readonly inputs: readonly T[];
  readonly parameters?: Record<string, unknown>;
  readonly priority: 'low' | 'normal' | 'high';
  readonly timeout?: number;
}

export interface MatrixBatchResult<T = MLMatrix> {
  readonly results: readonly MatrixOperationResult<T>[];
  readonly totalTime: number;
  readonly successCount: number;
  readonly failureCount: number;
  readonly batchId: string;
}

/**
 * Matrix adapter types for Three.js integration
 */
export interface MatrixAdapter {
  readonly fromThreeMatrix3: (matrix: Matrix3) => MLMatrix;
  readonly fromThreeMatrix4: (matrix: Matrix4) => MLMatrix;
  readonly toThreeMatrix3: (matrix: MLMatrix) => Matrix3;
  readonly toThreeMatrix4: (matrix: MLMatrix) => Matrix4;
  readonly fromTransform: (transform: ThreeJSTransformData) => TransformationMatrix;
  readonly toTransform: (matrix: TransformationMatrix) => ThreeJSTransformData;
}

/**
 * Matrix factory types
 */
export interface MatrixFactory {
  readonly identity: (size: number) => MLMatrix;
  readonly zeros: (rows: number, cols: number) => MLMatrix;
  readonly ones: (rows: number, cols: number) => MLMatrix;
  readonly random: (rows: number, cols: number, min?: number, max?: number) => MLMatrix;
  readonly diagonal: (values: readonly number[]) => MLMatrix;
  readonly fromArray: (data: readonly number[][], validate?: boolean) => MLMatrix;
  readonly fromVector3: (vector: Vector3) => MLMatrix;
  readonly fromQuaternion: (quaternion: Quaternion) => RotationMatrix;
  readonly fromEuler: (euler: Euler) => RotationMatrix;
}

/**
 * Matrix utility types
 */
export interface MatrixUtils {
  readonly isSquare: (matrix: MLMatrix) => boolean;
  readonly isSymmetric: (matrix: MLMatrix) => boolean;
  readonly isOrthogonal: (matrix: MLMatrix) => boolean;
  readonly isPositiveDefinite: (matrix: MLMatrix) => boolean;
  readonly isSingular: (matrix: MLMatrix) => boolean;
  readonly equals: (a: MLMatrix, b: MLMatrix, tolerance?: number) => boolean;
  readonly hash: (matrix: MLMatrix) => string;
  readonly size: (matrix: MLMatrix) => readonly [number, number];
  readonly memoryUsage: (matrix: MLMatrix) => number;
}

/**
 * Error types for matrix operations
 */
export interface MatrixError extends Error {
  readonly code: string;
  readonly operation: MatrixOperation;
  readonly matrixSize: readonly [number, number];
  readonly details: Record<string, unknown>;
  readonly recoverable: boolean;
}

/**
 * Matrix validation result with detailed analysis
 */
export interface MatrixValidationResult extends MatrixValidation {
  readonly conditionNumber?: number;
  readonly rank?: number;
  readonly determinant?: number;
  readonly eigenvalues?: number[];
  readonly singularValues?: number[];
  readonly isPositiveDefinite?: boolean;
  readonly isOrthogonal?: boolean;
  readonly isSymmetric?: boolean;
  readonly numericalStability: 'excellent' | 'good' | 'poor' | 'unstable';
  readonly remediationStrategies: readonly string[];
}

/**
 * Interfaces for dependency injection
 */
export type IMatrixCache = MatrixCacheEntry;
export type IMatrixValidator = MatrixValidation;

export interface IMatrixTelemetry {
  trackOperation: (
    operation: string,
    duration: number,
    success: boolean,
    metadata?: Record<string, unknown>
  ) => void;
  generateReport: () => unknown;
}

export interface MatrixConversionOptions {
  useCache?: boolean;
  validateInput?: boolean;
  precision?: number;
  timeout?: number;
}

export interface MatrixOperationDependencies {
  readonly validator?: IMatrixValidator;
  readonly cache?: IMatrixCache;
  readonly telemetry?: IMatrixTelemetry;
}

export interface PerformanceReport {
  readonly metrics: MatrixPerformanceMetrics;
  readonly operationBreakdown: Record<
    string,
    {
      count: number;
      totalTime: number;
      averageTime: number;
      successRate: number;
    }
  >;
}

/**
 * Matrix configuration override types
 */
export interface MatrixConfigOverride {
  readonly performance?: Partial<
    typeof import('../config/matrix-config').MATRIX_CONFIG.performance
  >;
  readonly cache?: Partial<typeof import('../config/matrix-config').MATRIX_CONFIG.cache>;
  readonly operations?: Partial<typeof import('../config/matrix-config').MATRIX_CONFIG.operations>;
}

/**
 * Type guards for matrix types
 */
export const isTransformationMatrix = (matrix: MLMatrix): matrix is TransformationMatrix => {
  return matrix.rows === 4 && matrix.columns === 4;
};

export const isRotationMatrix = (matrix: MLMatrix): matrix is RotationMatrix => {
  return matrix.rows === 3 && matrix.columns === 3;
};

export const isScaleMatrix = (matrix: MLMatrix): matrix is ScaleMatrix => {
  return matrix.rows >= 3 && matrix.columns >= 3;
};

export const isProjectionMatrix = (matrix: MLMatrix): matrix is ProjectionMatrix => {
  return matrix.rows === 4 && matrix.columns === 4;
};

export const isValidMatrixSize = (rows: number, cols: number): boolean => {
  return rows > 0 && cols > 0 && Number.isInteger(rows) && Number.isInteger(cols);
};

export const isMatrixOperationResult = <T>(obj: unknown): obj is MatrixOperationResult<T> => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'result' in obj &&
    'performance' in obj &&
    'metadata' in obj
  );
};

/**
 * Utility types for matrix operations
 */
export type MatrixSize = readonly [rows: number, cols: number];
export type MatrixData = readonly (readonly number[])[];
export type MatrixIndex = readonly [row: number, col: number];

/**
 * Matrix operation context for enhanced debugging
 */
export interface MatrixOperationContext {
  readonly operationId: string;
  readonly operation: MatrixOperation;
  readonly inputs: readonly MLMatrix[];
  readonly parameters: Record<string, unknown>;
  readonly startTime: number;
  readonly timeout: number;
  readonly priority: 'low' | 'normal' | 'high';
  readonly metadata: Record<string, unknown>;
}

export interface MatrixOperationProviderConfig {
  readonly performance?: Partial<
    typeof import('../config/matrix-config').MATRIX_CONFIG.performance
  >;
  readonly cache?: Partial<typeof import('../config/matrix-config').MATRIX_CONFIG.cache>;
  readonly operations?: Partial<typeof import('../config/matrix-config').MATRIX_CONFIG.operations>;
}
