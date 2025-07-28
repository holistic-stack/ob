/**
 * @file BabylonJS Services Exports
 *
 * Centralized exports for core BabylonJS services and their types.
 */

// Core Services - Actually Used
export type {
  AxisOverlayConfig,
  AxisOverlayError,
  AxisOverlayState,
  IAxisOverlayService,
} from '../types/axis-overlay.types';
export type { BridgeConversionConfig } from './ast-bridge-converter/index.js';
export {
  ASTBridgeConverter,
  ControlFlowBabylonNode,
  CSGBabylonNode,
  DEFAULT_BRIDGE_CONFIG,
  ExtrusionBabylonNode,
  ModifierBabylonNode,
  PlaceholderBabylonNode,
  PrimitiveBabylonNode,
  TransformationBabylonNode,
} from './ast-bridge-converter/index.js';
export { createAxisOverlayService } from './axis-overlay-service/index.js';

export type {
  CSG2Config,
  CSG2DisposeResult,
  CSG2Error,
  CSG2InitResult,
  CSG2OperationResult,
  CSG2State,
} from './babylon-csg2-service/index.js';
export {
  BabylonCSG2Service,
  CSG2ErrorCode,
  DEFAULT_CSG2_CONFIG,
} from './babylon-csg2-service/index.js';

export type {
  BabylonEngineConfig,
  BabylonEngineState,
  EngineDisposeResult,
  EngineError,
  EngineInitResult,
  EngineUpdateResult,
} from './babylon-engine-service/index.js';
export {
  BabylonEngineService,
  DEFAULT_ENGINE_CONFIG,
  EngineErrorCode,
} from './babylon-engine-service/index.js';

export type {
  InspectorConfig,
  InspectorError,
  InspectorHideResult,
  InspectorShowResult,
  InspectorState,
  InspectorTabSwitchResult,
} from './babylon-inspector-service/index.js';
export {
  BabylonInspectorService,
  DEFAULT_INSPECTOR_CONFIG,
  InspectorErrorCode,
  InspectorTab,
} from './babylon-inspector-service/index.js';

export type {
  MaterialApplyResult,
  MaterialCreateResult,
  MaterialError,
  MaterialState,
  MaterialUpdateResult,
  NodeMaterialConfig,
  PBRAnisotropyConfig,
  PBRClearCoatConfig,
  PBRMaterialConfig,
  PBRSheenConfig,
  PBRTextureConfig,
} from './babylon-material-service/index.js';
export {
  BabylonMaterialService,
  DEFAULT_PBR_CONFIG,
  MaterialErrorCode,
  MaterialType,
} from './babylon-material-service/index.js';

export type {
  CADCameraConfig,
  CameraBounds,
  CameraControlError,
} from './camera-control/index.js';
export { CameraControlService } from './camera-control/index.js';
export type {
  CameraStateChangeEvent,
  CameraStoreSyncConfig,
  CameraStoreSyncError,
  CameraStoreSyncErrorCode,
  CameraStoreSyncMetrics,
  CameraStoreSyncState,
  DEFAULT_CAMERA_STORE_SYNC_CONFIG,
} from './camera-store-sync/index.js';
export { CameraStoreSyncService } from './camera-store-sync/index.js';
export type {
  GizmoMode,
  TransformationEvent,
  TransformationGizmoConfig,
  TransformationGizmoError,
} from './transformation-gizmo-service/index.js';
export {
  DEFAULT_TRANSFORMATION_GIZMO_CONFIG,
  TransformationGizmoService,
} from './transformation-gizmo-service/index.js';
