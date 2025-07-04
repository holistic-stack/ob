/**
 * Simplified Matrix Operations Exports
 *
 * Essential matrix operations for 3D transformations and basic matrix math.
 * Simplified without complex infrastructure.
 */

// Core API (simplified)
export { MatrixOperationsAPI } from '../services/matrix-operations.api.js';

// Simple result type
export type { SimpleMatrixResult } from '../services/matrix-operations.api.js';

// Essential ml-matrix re-exports
export { Matrix } from 'ml-matrix';

// Three.js integration
export { Matrix4 } from 'three';

// Result types for error handling
export type { Result } from '../../../shared/types/result.types';
export { error, success } from '../../../shared/utils/functional/result';
