/**
 * @file babylon-renderer/index.ts
 * @description BabylonJS 3D rendering system for OpenSCAD AST visualization.
 * Provides mesh generation and scene management with production-ready performance.
 */

// Components: Re-exports all React components related to the Babylon.js renderer.
export * from './components';

// Hooks: Re-exports all custom React hooks for interacting with the Babylon.js engine and scene.
export * from './hooks';

// Services: Re-exports all service classes that encapsulate Babylon.js logic and operations.
export * from './services';

// Types: Core type definitions for the Babylon.js renderer
// Note: Explicitly exclude EngineInitOptions to avoid conflict with hooks export
export type {
  BabylonEngineConfig,
  BabylonEngineState,
  BabylonJSCubeParameters,
  BabylonJSCylinderParameters,
  BabylonJSError,
  BabylonJSNode,
  BabylonJSParameters,
  BabylonJSSphereParameters,
  BabylonSceneConfig,
  BabylonSceneState,
  BridgeConversionResult,
  CSGDifferenceResult,
  CSGError,
  CSGIntersectionResult,
  CSGOperationConfig,
  CSGOperationInput,
  CSGOperationMetadata,
  CSGOperationResult,
  CSGPerformanceMetrics,
  CSGUnionResult,
  EngineDisposeResult,
  EngineError,
  EngineInitResult,
  EnginePerformanceMetrics,
  EngineUpdateResult,
  GenericGeometry,
  GenericMaterialConfig,
  GenericMeshCollection,
  GenericMeshData,
  GenericMeshMetadata,
  MaterialConfigBuilder,
  MeshMetadataBuilder,
  NodeGenerationResult,
  NodeValidationResult,
  SceneDisposeResult,
  SceneError,
  SceneInitOptions,
  SceneInitResult,
  SceneUpdateResult,
} from './types';
export {
  BabylonJSCSGType,
  BabylonJSNodeType,
  BabylonJSPrimitiveType,
  BabylonJSTransformType,
  CSGErrorCode,
  CSGOperationType,
  DEFAULT_CSG_CONFIG,
  DEFAULT_ENGINE_CONFIG,
  DEFAULT_MESH_METADATA,
  DEFAULT_SCENE_CONFIG,
  EngineErrorCode,
  isGenericMeshCollection,
  isGenericMeshData,
  MATERIAL_PRESETS,
  SceneErrorCode,
} from './types';

// Utils: Utility functions for Babylon.js rendering
export * from './utils';
