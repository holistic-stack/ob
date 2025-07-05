/**
 * Simplified Matrix Operations Exports
 *
 * Essential matrix operations for 3D transformations and basic matrix math.
 * Simplified without complex infrastructure.
 */

import type React from 'react';

// Essential gl-matrix re-exports
export { mat3, mat4 } from 'gl-matrix';
// Three.js integration
export { Matrix4 } from 'three';
// Result types for error handling
export type { Result } from '../../../shared/types/result.types';
export { error, success } from '../../../shared/utils/functional/result';
// Simple result type
export type { SimpleMatrixResult } from '../services/matrix-operations.api.js';
// Core API (simplified)
export { MatrixOperationsAPI } from '../api/matrix-operations.api.js';

/**
 * Stub exports for compatibility with existing code
 */
export interface MatrixOperationsBundle {
  readonly api: MatrixOperationsAPI;
  readonly version: string;
}

export interface MatrixOperationsDevProviderProps {
  readonly children: React.ReactNode;
  readonly config?: any;
}

export interface MatrixOperationsProdProviderProps {
  readonly children: React.ReactNode;
  readonly config?: any;
}

export function createMatrixOperationsBundle(): MatrixOperationsBundle {
  return {
    api: new MatrixOperationsAPI(),
    version: '1.0.0'
  };
}

export function createMatrixOperationsDevProvider(): React.ComponentType<MatrixOperationsDevProviderProps> {
  return ({ children }) => children as React.ReactElement;
}

export function createMatrixOperationsProdProvider(): React.ComponentType<MatrixOperationsProdProviderProps> {
  return ({ children }) => children as React.ReactElement;
}

export const matrixOperationsBundle = createMatrixOperationsBundle();

export function setupMatrixOperations(): void {
  // Stub implementation
}
