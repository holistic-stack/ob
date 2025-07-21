/**
 * @file BabylonJS Services Exports
 *
 * Centralized exports for core BabylonJS services and their types.
 */

// Core Services - Actually Used
export type { BridgeConversionConfig } from './ast-bridge-converter';
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
} from './ast-bridge-converter';

export type {
  CSG2Config,
  CSG2DisposeResult,
  CSG2Error,
  CSG2InitResult,
  CSG2OperationResult,
  CSG2State,
} from './babylon-csg2-service';
export { BabylonCSG2Service, CSG2ErrorCode, DEFAULT_CSG2_CONFIG } from './babylon-csg2-service';

export type {
  BabylonEngineConfig,
  BabylonEngineState,
  EngineDisposeResult,
  EngineError,
  EngineInitResult,
  EngineUpdateResult,
} from './babylon-engine-service';
export {
  BabylonEngineService,
  DEFAULT_ENGINE_CONFIG,
  EngineErrorCode,
} from './babylon-engine-service';

export type {
  InspectorConfig,
  InspectorError,
  InspectorHideResult,
  InspectorShowResult,
  InspectorState,
  InspectorTabSwitchResult,
} from './babylon-inspector-service';
export {
  BabylonInspectorService,
  DEFAULT_INSPECTOR_CONFIG,
  InspectorErrorCode,
  InspectorTab,
} from './babylon-inspector-service';

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
} from './babylon-material-service';
export {
  BabylonMaterialService,
  DEFAULT_PBR_CONFIG,
  MaterialErrorCode,
  MaterialType,
} from './babylon-material-service';

export type {
  CADCameraConfig,
  CameraBounds,
  CameraControlError,
} from './camera-control';
export { CameraControlService } from './camera-control';
