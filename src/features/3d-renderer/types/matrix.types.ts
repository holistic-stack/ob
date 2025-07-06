/**
 * Enhanced Matrix Type Definitions
 *
 * Comprehensive type definitions for matrix operations with Three.js integration,
 * branded types for type safety, and performance optimization types.
 */

import { mat3, mat4 } from 'gl-matrix';
import type { Euler, Matrix3, Matrix4, Quaternion, Vector3 } from 'three';

/**
 * Matrix class for compatibility with existing code
 * Uses gl-matrix internally for performance
 */
export class Matrix {
  private data: number[];
  private _rows: number;
  private _columns: number;

  constructor(rows: number, cols: number, data?: number[]) {
    this._rows = rows;
    this._columns = cols;
    const totalSize = rows * cols;

    if (data && data.length >= totalSize) {
      this.data = data.slice(0, totalSize);
    } else {
      this.data = new Array(totalSize).fill(0);
      // Set identity matrix by default for square matrices
      if (rows === cols) {
        for (let i = 0; i < Math.min(rows, cols); i++) {
          this.set(i, i, 1);
        }
      }
    }
  }

  get rows(): number {
    return this._rows;
  }

  get columns(): number {
    return this._columns;
  }

  get length(): number {
    return this.data.length;
  }

  get(row: number, col: number): number {
    if (row < 0 || row >= this._rows || col < 0 || col >= this._columns) {
      return 0;
    }
    // Column-major order: data[col * rows + row]
    return this.data[col * this._rows + row] ?? 0;
  }

  set(row: number, col: number, value: number): void {
    if (row < 0 || row >= this._rows || col < 0 || col >= this._columns) {
      return;
    }
    // Column-major order: data[col * rows + row]
    this.data[col * this._rows + row] = value;
  }

  toArray(): number[] {
    return Array.from(this.data);
  }

  static fromMat4(matrix: mat4): Matrix {
    const result = new Matrix(4, 4);
    for (let i = 0; i < 16; i++) {
      result.data[i] = matrix[i];
    }
    return result;
  }

  static fromMat3(matrix: mat3): Matrix {
    const result = new Matrix(3, 3);
    for (let i = 0; i < 9; i++) {
      result.data[i] = matrix[i];
    }
    return result;
  }

  toMat4(): mat4 {
    if (this._rows !== 4 || this._columns !== 4) {
      throw new Error('Matrix must be 4x4 to convert to mat4');
    }
    const result = mat4.create();
    for (let i = 0; i < 16; i++) {
      result[i] = this.data[i];
    }
    return result;
  }

  toMat3(): mat3 {
    if (this._rows !== 3 || this._columns !== 3) {
      throw new Error('Matrix must be 3x3 to convert to mat3');
    }
    const result = mat3.create();
    for (let i = 0; i < 9; i++) {
      result[i] = this.data[i];
    }
    return result;
  }
}

/**
 * Type alias for compatibility with existing code that expects MLMatrix
 */
export type MLMatrix = Matrix;

/**
 * Branded types for enhanced type safety
 */
export type TransformationMatrix = mat4 & { readonly __brand: 'TransformationMatrix' };
export type RotationMatrix = mat4 & { readonly __brand: 'RotationMatrix' };
export type ScaleMatrix = mat4 & { readonly __brand: 'ScaleMatrix' };
export type ProjectionMatrix = mat4 & { readonly __brand: 'ProjectionMatrix' };
export type ViewMatrix = mat4 & { readonly __brand: 'ViewMatrix' };
export type NormalMatrix = mat3 & { readonly __brand: 'NormalMatrix' };

/**
 * Matrix operation result types with performance metadata
 */
export interface MatrixOperationResult<T = mat4> {
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
  readonly matrix: mat4;
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
  readonly source: mat4;
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
    readonly L: mat4;
    readonly U: mat4;
    readonly P: mat4;
  };
  readonly qr?: {
    readonly Q: mat4;
    readonly R: mat4;
  };
  readonly svd?: {
    readonly U: mat4;
    readonly S: mat4;
    readonly V: mat4;
  };
  readonly eigenvalues?: {
    readonly values: number[];
    readonly vectors: mat4;
  };
  readonly cholesky?: mat4;
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
  readonly fromThreeMatrix3: (matrix: Matrix3) => mat3;
  readonly fromThreeMatrix4: (matrix: Matrix4) => mat4;
  readonly toThreeMatrix3: (matrix: mat3) => Matrix3;
  readonly toThreeMatrix4: (matrix: mat4) => Matrix4;
  readonly fromTransform: (transform: ThreeJSTransformData) => TransformationMatrix;
  readonly toTransform: (matrix: TransformationMatrix) => ThreeJSTransformData;
}

/**
 * Matrix factory types
 */
export interface MatrixFactory {
  readonly identity: () => mat4;
  readonly zeros: () => mat4;
  readonly ones: () => mat4;
  readonly random: (min?: number, max?: number) => mat4;
  readonly diagonal: (values: readonly number[]) => mat4;
  readonly fromArray: (data: readonly number[][], validate?: boolean) => mat4;
  readonly fromVector3: (vector: Vector3) => mat4;
  readonly fromQuaternion: (quaternion: Quaternion) => RotationMatrix;
  readonly fromEuler: (euler: Euler) => RotationMatrix;
}

/**
 * Matrix utility types
 */
export interface MatrixUtils {
  readonly isSquare: (matrix: mat4) => boolean;
  readonly isSymmetric: (matrix: mat4) => boolean;
  readonly isOrthogonal: (matrix: mat4) => boolean;
  readonly isPositiveDefinite: (matrix: mat4) => boolean;
  readonly isSingular: (matrix: mat4) => boolean;
  readonly equals: (a: mat4, b: mat4, tolerance?: number) => boolean;
  readonly hash: (matrix: mat4) => string;
  readonly size: (matrix: mat4) => readonly [number, number];
  readonly memoryUsage: (matrix: mat4) => number;
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

/**
 * Matrix configuration override types
 */
export interface MatrixConfigOverride {
  readonly cache?: Partial<typeof import('../config/matrix-config').MATRIX_CONFIG.cache>;
  readonly operations?: Partial<typeof import('../config/matrix-config').MATRIX_CONFIG.operations>;
}

/**
 * Type guards for matrix types
 */
export const isTransformationMatrix = (matrix: mat4): matrix is TransformationMatrix => {
  return matrix.length === 16;
};

export const isRotationMatrix = (matrix: mat4): matrix is RotationMatrix => {
  return matrix.length === 16;
};

export const isScaleMatrix = (matrix: mat4): matrix is ScaleMatrix => {
  return matrix.length === 16;
};

export const isProjectionMatrix = (matrix: mat4): matrix is ProjectionMatrix => {
  return matrix.length === 16;
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
