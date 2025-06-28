/**
 * 3D Renderer Feature - Enhanced Exports
 *
 * React Three Fiber integration with three-csg-ts for OpenSCAD
 * 3D visualization, CSG operations, WebGL2 optimization, and
 * enhanced matrix operations with React integration.
 */

// Components
export * from './components';

// Hooks
export * from './hooks';

// Providers
export {
  MatrixOperationProvider,
  useMatrixOperationContext,
  withMatrixOperations,
  MatrixOperationStatus,
} from './providers/MatrixOperationProvider';
export type {
  MatrixOperationProviderConfig,
  MatrixOperationContextValue,
  MatrixOperationProviderProps,
} from './providers/MatrixOperationProvider';

// API Layer
export {
  createMatrixOperationsAPI,
  matrixOperationsAPI,
  MatrixOperationsAPIImpl,
} from './api/matrix-operations.api';
export type {
  MatrixOperationsAPI,
  MatrixOperationConfig as APIMatrixOperationConfig,
  BatchOperationConfig,
  APIPerformanceMetrics,
  APIHealthStatus,
} from './api/matrix-operations.api';

// Development Tools
export * from './dev-tools/MatrixPerformanceProfiler';

// Complete Matrix Operations Bundle
export {
  createMatrixOperationsBundle,
  matrixOperationsBundle,
  createMatrixOperationsDevProvider,
  createMatrixOperationsProdProvider,
  setupMatrixOperations,
} from './exports/matrix-operations.exports';
export type {
  MatrixOperationsBundle,
  MatrixOperationsDevProviderProps,
  MatrixOperationsProdProviderProps,
} from './exports/matrix-operations.exports';

// Services
export * from './services';

// Types
export * from './types';

// Utils
export * from './utils';

// Config
export * from './config';
