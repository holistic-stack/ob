/**
 * 3D Renderer Feature - Enhanced Exports
 *
 * React Three Fiber integration with three-csg-ts for OpenSCAD
 * 3D visualization, CSG operations, WebGL2 optimization, and
 * enhanced matrix operations with React integration.
 */

export type {
  APIHealthStatus,
  APIPerformanceMetrics,
  BatchOperationConfig,
  MatrixOperationConfig as APIMatrixOperationConfig,
  MatrixOperationsAPI,
} from './api/matrix-operations.api';
// API Layer
export {
  createMatrixOperationsAPI,
  MatrixOperationsAPIImpl,
  matrixOperationsAPI,
} from './api/matrix-operations.api';
// Components
export * from './components';
// Config
export * from './config';
// Development Tools
export * from './dev-tools/MatrixPerformanceProfiler';
export type {
  MatrixOperationsBundle,
  MatrixOperationsDevProviderProps,
  MatrixOperationsProdProviderProps,
} from './exports/matrix-operations.exports';
// Complete Matrix Operations Bundle
export {
  createMatrixOperationsBundle,
  createMatrixOperationsDevProvider,
  createMatrixOperationsProdProvider,
  matrixOperationsBundle,
  setupMatrixOperations,
} from './exports/matrix-operations.exports';
// Hooks
export * from './hooks';
export type {
  MatrixOperationContextValue,
  MatrixOperationProviderConfig,
  MatrixOperationProviderProps,
} from './providers/MatrixOperationProvider';
// Providers
export {
  MatrixOperationProvider,
  MatrixOperationStatus,
  useMatrixOperationContext,
  withMatrixOperations,
} from './providers/MatrixOperationProvider';
// Services
export * from './services';
// Types
export * from './types';
// Utils
export * from './utils';
