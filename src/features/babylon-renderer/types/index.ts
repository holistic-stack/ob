/**
 * @file BabylonJS Renderer Type Exports
 * 
 * Centralized exports for all BabylonJS renderer type definitions.
 * Following functional programming patterns with immutable data structures.
 */

// Scene types
export type {
  BabylonSceneConfig,
  SceneInitOptions,
  BabylonSceneState,
  SceneInitResult,
  SceneUpdateResult,
  SceneDisposeResult,
  SceneError,
} from './babylon-scene.types';

export { SceneErrorCode, DEFAULT_SCENE_CONFIG } from './babylon-scene.types';

// Engine types
export type {
  BabylonEngineConfig,
  EngineInitOptions,
  BabylonEngineState,
  EnginePerformanceMetrics,
  EngineInitResult,
  EngineUpdateResult,
  EngineDisposeResult,
  EngineError,
} from './babylon-engine.types';

export { EngineErrorCode, DEFAULT_ENGINE_CONFIG } from './babylon-engine.types';

// CSG types
export type {
  CSGOperationConfig,
  CSGOperationInput,
  CSGOperationResult,
  CSGOperationMetadata,
  CSGPerformanceMetrics,
  CSGError,
  CSGUnionResult,
  CSGDifferenceResult,
  CSGIntersectionResult,
} from './babylon-csg.types';

export { CSGOperationType, CSGErrorCode, DEFAULT_CSG_CONFIG } from './babylon-csg.types';
