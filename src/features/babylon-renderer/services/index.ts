/**
 * @file BabylonJS Services Exports
 *
 * Centralized exports for all BabylonJS services and their types.
 */

export type {
  CSG2Config,
  CSG2DisposeResult,
  CSG2Error,
  CSG2InitResult,
  CSG2OperationResult,
  CSG2State,
} from './babylon-csg2-service';
// CSG2 Service
export { BabylonCSG2Service, CSG2ErrorCode, DEFAULT_CSG2_CONFIG } from './babylon-csg2-service';

// AST Bridge Converter Service
export {
  ASTBridgeConverter,
  DEFAULT_BRIDGE_CONFIG,
  PlaceholderBabylonNode,
  PrimitiveBabylonNode,
  TransformationBabylonNode,
  CSGBabylonNode,
  ControlFlowBabylonNode,
  ExtrusionBabylonNode,
  ModifierBabylonNode,
} from './ast-bridge-converter';
export type { BridgeConversionConfig } from './ast-bridge-converter';

// Primitive Shape Generator Service
export { PrimitiveShapeGeneratorService } from './primitive-shape-generator';
export type {
  OpenSCADCubeParams,
  OpenSCADSphereParams,
  OpenSCADCylinderParams,
  OpenSCADPolyhedronParams,
  PrimitiveGenerationError,
} from './primitive-shape-generator';

// Transformation Operations Service
export { TransformationOperationsService } from './transformation-operations';
export type {
  OpenSCADTranslateParams,
  OpenSCADRotateParams,
  OpenSCADScaleParams,
  OpenSCADMirrorParams,
  OpenSCADMatrixParams,
  OpenSCADColorParams,
  TransformationError,
} from './transformation-operations';

// CSG Operations Service
export { CSGOperationsService } from './csg-operations';
export type {
  CSGOperationParams,
  CSGOperationError,
} from './csg-operations';

// Control Flow Operations Service
export { ControlFlowOperationsService } from './control-flow-operations';
export type {
  OpenSCADForLoopParams,
  OpenSCADIfParams,
  OpenSCADLetParams,
  OpenSCADIntersectionForParams,
  VariableContext,
  ControlFlowError,
} from './control-flow-operations';
export type {
  BabylonEngineConfig,
  BabylonEngineState,
  EngineDisposeResult,
  EngineError,
  EngineInitResult,
  EngineUpdateResult,
} from './babylon-engine-service';
// Engine Service
export {
  BabylonEngineService,
  DEFAULT_ENGINE_CONFIG,
  EngineErrorCode,
} from './babylon-engine-service';
export type {
  IBLShadowApplyResult,
  IBLShadowConfig,
  IBLShadowError,
  IBLShadowInitResult,
  IBLShadowState,
  IBLShadowUpdateResult,
} from './babylon-ibl-shadows-service';
// IBL Shadows Service
export {
  BabylonIBLShadowsService,
  DEFAULT_IBL_SHADOW_CONFIG,
  IBLShadowErrorCode,
} from './babylon-ibl-shadows-service';
export type {
  InspectorConfig,
  InspectorError,
  InspectorHideResult,
  InspectorShowResult,
  InspectorState,
  InspectorTabSwitchResult,
} from './babylon-inspector-service';
// Inspector Service
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
// Material Service
export {
  BabylonMaterialService,
  DEFAULT_PBR_CONFIG,
  MaterialErrorCode,
  MaterialType,
} from './babylon-material-service';
export type {
  ParticleSystemConfig,
  ParticleSystemCreateResult,
  ParticleSystemError,
  ParticleSystemStartResult,
  ParticleSystemState,
  ParticleSystemStopResult,
} from './babylon-particle-service';
// Particle Service
export {
  BabylonParticleService,
  DEFAULT_PARTICLE_CONFIG,
  ParticleSystemErrorCode,
} from './babylon-particle-service';
export type {
  RenderGraphBlockConfig,
  RenderGraphBuildResult,
  RenderGraphConfig,
  RenderGraphConnectionConfig,
  RenderGraphCreateResult,
  RenderGraphError,
  RenderGraphExecuteResult,
  RenderGraphState,
} from './babylon-render-graph-service';
// Render Graph Service
export {
  BabylonRenderGraphService,
  DEFAULT_RENDER_GRAPH_CONFIG,
  RenderGraphBlockType,
  RenderGraphErrorCode,
} from './babylon-render-graph-service';
