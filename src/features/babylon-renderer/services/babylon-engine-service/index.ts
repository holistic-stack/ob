/**
 * @file BabylonJS Engine Service Exports
 *
 * Exports for the BabylonJS engine service with WebGPU support.
 */

// Re-export types from babylon-engine.types
export type {
  BabylonEngineConfig,
  BabylonEngineState,
  EngineDisposeResult,
  EngineError,
  EngineInitOptions,
  EngineInitResult,
  EnginePerformanceMetrics,
  EngineUpdateResult,
} from '../../types/babylon-engine.types';
// Re-export enums and constants
export { DEFAULT_ENGINE_CONFIG, EngineErrorCode } from '../../types/babylon-engine.types';
export { BabylonEngineService } from './babylon-engine-service';
