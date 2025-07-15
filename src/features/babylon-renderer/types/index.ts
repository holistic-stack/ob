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

// BabylonJS-Extended AST types
export type {
  BabylonJSCubeParameters,
  BabylonJSCylinderParameters,
  BabylonJSError,
  BabylonJSNode,
  BabylonJSParameters,
  BabylonJSSphereParameters,
  BridgeConversionResult,
  NodeGenerationResult,
  NodeValidationResult,
} from './babylon-ast.types';
export {
  BabylonJSCSGType,
  BabylonJSNodeType,
  BabylonJSPrimitiveType,
  BabylonJSTransformType,
} from './babylon-ast.types';

// Generic Mesh Data types
export type {
  GenericGeometry,
  GenericMaterialConfig,
  GenericMeshMetadata,
  GenericMeshData,
  GenericMeshCollection,
  MaterialConfigBuilder,
  MeshMetadataBuilder,
} from './generic-mesh-data.types';
export {
  MATERIAL_PRESETS,
  isGenericMeshData,
  isGenericMeshCollection,
  DEFAULT_MESH_METADATA,
} from './generic-mesh-data.types';
