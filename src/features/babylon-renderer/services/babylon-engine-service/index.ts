/**
 * @file BabylonJS Engine Service Exports
 * 
 * Exports for the BabylonJS engine service with WebGPU support.
 */

export { BabylonEngineService } from './babylon-engine-service';

// Re-export types from babylon-engine.types
export type {
  BabylonEngineConfig,
  BabylonEngineState,
  EngineInitResult,
  EngineInitOptions,
  EngineUpdateResult,
  EngineDisposeResult,
  EngineError,
  EnginePerformanceMetrics,
} from '../../types/babylon-engine.types';

// Re-export enums and constants
export { EngineErrorCode, DEFAULT_ENGINE_CONFIG } from '../../types/babylon-engine.types';
