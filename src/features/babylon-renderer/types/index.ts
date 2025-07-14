/**
 * @file BabylonJS Renderer Type Exports
 *
 * Centralized exports for all BabylonJS renderer type definitions.
 * Following functional programming patterns with immutable data structures.
 */

// CSG types
export type {
  CSGDifferenceResult,
  CSGError,
  CSGIntersectionResult,
  CSGOperationConfig,
  CSGOperationInput,
  CSGOperationMetadata,
  CSGOperationResult,
  CSGPerformanceMetrics,
  CSGUnionResult,
} from './babylon-csg.types';
export { CSGErrorCode, CSGOperationType, DEFAULT_CSG_CONFIG } from './babylon-csg.types';

// Engine types
export type {
  BabylonEngineConfig,
  BabylonEngineState,
  EngineDisposeResult,
  EngineError,
  EngineInitOptions,
  EngineInitResult,
  EnginePerformanceMetrics,
  EngineUpdateResult,
} from './babylon-engine.types';

export { DEFAULT_ENGINE_CONFIG, EngineErrorCode } from './babylon-engine.types';
// Scene types
export type {
  BabylonSceneConfig,
  BabylonSceneState,
  SceneDisposeResult,
  SceneError,
  SceneInitOptions,
  SceneInitResult,
  SceneUpdateResult,
} from './babylon-scene.types';
export { DEFAULT_SCENE_CONFIG, SceneErrorCode } from './babylon-scene.types';
