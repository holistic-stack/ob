/**
 * @file BabylonJS Renderer Type Exports
 *
 * Centralized exports for all BabylonJS renderer type definitions.
 * Following functional programming patterns with immutable data structures.
 */

// BabylonJS-Extended AST types
export type {
  BabylonJSCubeParameters,
  BabylonJSCylinderParameters,
  BabylonJSError,
  BabylonJSParameters,
  BabylonJSSphereParameters,
  BridgeConversionResult,
  NodeGenerationResult,
  NodeValidationResult,
} from './babylon-ast.types';
export {
  BabylonJSCSGType,
  BabylonJSNode,
  BabylonJSNodeType,
  BabylonJSPrimitiveType,
  BabylonJSTransformType,
} from './babylon-ast.types';
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

// Generic Mesh Data types
export type {
  GenericGeometry,
  GenericMaterialConfig,
  GenericMeshCollection,
  GenericMeshData,
  GenericMeshMetadata,
  MaterialConfigBuilder,
  MeshMetadataBuilder,
} from './generic-mesh-data.types';
export {
  DEFAULT_MESH_METADATA,
  isGenericMeshCollection,
  isGenericMeshData,
  MATERIAL_PRESETS,
} from './generic-mesh-data.types';

// Orientation Gizmo types
export type {
  GizmoAnimationConfig,
  GizmoAxis,
  GizmoCameraAnimation,
  GizmoColors,
  GizmoConfig,
  GizmoConfigResult,
  GizmoDisposeResult,
  GizmoError,
  GizmoEventHandlers,
  GizmoFontConfig,
  GizmoId,
  GizmoInitOptions,
  GizmoInitResult,
  GizmoInteractionEvent,
  GizmoInteractionResult,
  GizmoMouseState,
  GizmoState,
  GizmoStateUpdate,
  GizmoUpdateResult,
  GizmoUpdateResult_Type,
  IGizmoService,
} from './orientation-gizmo.types';
export {
  AxisDirection,
  createGizmoId,
  DEFAULT_GIZMO_CONFIG,
  GizmoErrorCode,
  GizmoPosition,
  isSupportedCamera,
} from './orientation-gizmo.types';
