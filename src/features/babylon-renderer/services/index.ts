/**
 * @file BabylonJS Services Exports
 *
 * Centralized exports for all BabylonJS services and their types.
 */

// Engine Service
export { BabylonEngineService } from './babylon-engine-service';
export type {
  BabylonEngineConfig,
  BabylonEngineState,
  EngineError,
  EngineInitResult,
  EngineDisposeResult,
  EngineUpdateResult,
} from './babylon-engine-service';
export {
  EngineErrorCode,
  DEFAULT_ENGINE_CONFIG
} from './babylon-engine-service';

// Inspector Service
export { BabylonInspectorService } from './babylon-inspector-service';
export type {
  InspectorConfig,
  InspectorState,
  InspectorError,
  InspectorShowResult,
  InspectorHideResult,
  InspectorTabSwitchResult,
} from './babylon-inspector-service';
export {
  InspectorErrorCode,
  DEFAULT_INSPECTOR_CONFIG
} from './babylon-inspector-service';

// CSG2 Service
export { BabylonCSG2Service } from './babylon-csg2-service';
export type {
  CSG2Config,
  CSG2State,
  CSG2Error,
  CSG2OperationResult,
  CSG2InitResult,
  CSG2DisposeResult,
} from './babylon-csg2-service';
export {
  CSG2ErrorCode,
  DEFAULT_CSG2_CONFIG
} from './babylon-csg2-service';

// Particle Service
export { BabylonParticleService } from './babylon-particle-service';
export type {
  ParticleSystemConfig,
  ParticleSystemState,
  ParticleSystemError,
  ParticleSystemCreateResult,
  ParticleSystemStartResult,
  ParticleSystemStopResult,
} from './babylon-particle-service';
export {
  ParticleSystemErrorCode,
  DEFAULT_PARTICLE_CONFIG
} from './babylon-particle-service';

// IBL Shadows Service
export { BabylonIBLShadowsService } from './babylon-ibl-shadows-service';
export type {
  IBLShadowConfig,
  IBLShadowState,
  IBLShadowError,
  IBLShadowInitResult,
  IBLShadowApplyResult,
  IBLShadowUpdateResult,
} from './babylon-ibl-shadows-service';
export {
  IBLShadowErrorCode,
  DEFAULT_IBL_SHADOW_CONFIG
} from './babylon-ibl-shadows-service';

// Material Service
export { BabylonMaterialService } from './babylon-material-service';
export type {
  PBRMaterialConfig,
  PBRClearCoatConfig,
  PBRSheenConfig,
  PBRAnisotropyConfig,
  PBRTextureConfig,
  NodeMaterialConfig,
  MaterialState,
  MaterialError,
  MaterialCreateResult,
  MaterialApplyResult,
  MaterialUpdateResult,
} from './babylon-material-service';
export {
  MaterialType,
  MaterialErrorCode,
  DEFAULT_PBR_CONFIG
} from './babylon-material-service';

// Render Graph Service
export { BabylonRenderGraphService } from './babylon-render-graph-service';
export type {
  RenderGraphConfig,
  RenderGraphBlockConfig,
  RenderGraphConnectionConfig,
  RenderGraphState,
  RenderGraphError,
  RenderGraphCreateResult,
  RenderGraphBuildResult,
  RenderGraphExecuteResult,
} from './babylon-render-graph-service';
export {
  RenderGraphBlockType,
  RenderGraphErrorCode,
  DEFAULT_RENDER_GRAPH_CONFIG
} from './babylon-render-graph-service';
