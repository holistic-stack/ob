/**
 * @file BabylonJS Services Exports
 *
 * Centralized exports for all BabylonJS services and their types.
 */

export type { BridgeConversionConfig } from './ast-bridge-converter';
// AST Bridge Converter Service
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
// CSG2 Service
export { BabylonCSG2Service, CSG2ErrorCode, DEFAULT_CSG2_CONFIG } from './babylon-csg2-service';
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
export type {
  CADCameraConfig,
  CameraBounds,
  CameraControlError,
} from './camera-control';
// Camera Control Service
export { CameraControlService } from './camera-control';
export type {
  ControlFlowError,
  OpenSCADForLoopParams,
  OpenSCADIfParams,
  OpenSCADIntersectionForParams,
  OpenSCADLetParams,
  VariableContext,
} from './control-flow-operations';
// Control Flow Operations Service
export { ControlFlowOperationsService } from './control-flow-operations';
export type {
  CSGOperationError,
  CSGOperationParams,
} from './csg-operations';
// CSG Operations Service
export { CSGOperationsService } from './csg-operations';
export type {
  DepthPerceptionConfig,
  DepthPerceptionError,
  DepthPerceptionQuality,
  DepthPerceptionSetup,
} from './depth-perception';
// Depth Perception Service
export { DepthPerceptionService } from './depth-perception';
export type {
  ExportConfig,
  ExportError,
  ExportFormat,
  ExportProgressCallback,
  ExportQuality,
  ExportResult,
  UseExportReturn,
} from './export';
// Export Service
// Export Hooks
export {
  cleanupExportServices,
  ExportService,
  useExport,
  useExportStats,
  useQuickExport,
} from './export';
export type {
  ExtrusionError,
  OpenSCADLinearExtrudeParams,
  OpenSCADRotateExtrudeParams,
  Profile2DPoint,
} from './extrusion-operations';
// Extrusion Operations Service
export { ExtrusionOperationsService } from './extrusion-operations';
export type {
  GridAxisConfig,
  GridAxisError,
  GridAxisSetup,
} from './grid-axis';
// Grid and Axis Service
export { GridAxisService } from './grid-axis';
export type {
  ImportError,
  ImportOperationParams,
  IncludeParams,
  STLImportParams,
  SVGImportParams,
  ThreeMFImportParams,
} from './import-operations';
// Import Operations Service
export { ImportOperationsService } from './import-operations';
export type {
  LightingError,
  LightingSetup,
  TechnicalLightingConfig,
} from './lighting';
// Lighting Service
export { LightingService } from './lighting';
export type {
  ModifierApplicationResult,
  ModifierState,
  ModifierVisualizationConfig,
  ModifierVisualizationError,
  OpenSCADModifierType,
} from './modifier-visualization';
// Modifier Visualization Service
export { ModifierVisualizationService } from './modifier-visualization';
export type {
  ModuleExecutionContext,
  ModuleInstantiationContext,
  ModuleSystemError,
  ResolvedModuleDefinition,
} from './module-system';
// Module System Service
export { ModuleSystemService } from './module-system';
export type {
  MaterialFromColorConfig,
  OpenSCADColor,
  OpenSCADMaterialError,
} from './openscad-material';
// OpenSCAD Material Service
export { OPENSCAD_NAMED_COLORS, OpenSCADMaterialService } from './openscad-material';
export type {
  OptimizationConfig,
  OptimizedMeshGenerationOptions,
  OptimizedMeshResult,
} from './optimized-mesh-generator';
// Optimized Mesh Generator Service
export {
  OptimizedMeshGenerationError,
  OptimizedMeshGenerationErrorCode,
  OptimizedMeshGeneratorService,
} from './optimized-mesh-generator';
export type {
  CullingConfig,
  CullingMethod,
  CullingSetupResult,
  CullingStats,
  GeometrySignature,
  InstanceGroup,
  InstancingConfig,
  InstancingSetupResult,
  LODConfig,
  LODQuality,
  LODSetupResult,
  PerformanceMetrics,
  PerformanceOptimizationState,
} from './performance-optimization';
// Performance Optimization Service
export {
  PerformanceOptimizationError,
  PerformanceOptimizationErrorCode,
  PerformanceOptimizationService,
} from './performance-optimization';
export type {
  OpenSCADCubeParams,
  OpenSCADCylinderParams,
  OpenSCADPolyhedronParams,
  OpenSCADSphereParams,
  PrimitiveGenerationError,
} from './primitive-shape-generator';
// Primitive Shape Generator Service
export { PrimitiveShapeGeneratorService } from './primitive-shape-generator';
export type {
  ProgressError,
  ProgressEventListener,
  ProgressOperation,
  ProgressOperationConfig,
  ProgressOperationType,
  ProgressStage,
  ProgressState,
  ProgressUpdate,
  UseProgressReturn,
} from './progress';
// Progress Service
// Progress Hooks
export {
  ProgressService,
  useAsyncProgress,
  useCancellableOperation,
  useOperationProgress,
  useOperationsByType,
  useProgress,
  useProgressStore,
} from './progress';
export type {
  MeshRenderingState,
  RenderingMode,
  RenderingModeConfig,
  RenderingModeError,
  RenderingModeResult,
} from './rendering-mode';
// Rendering Mode Service
export { RenderingModeService } from './rendering-mode';
export type {
  SelectedMeshInfo,
  SelectionConfig,
  SelectionError,
  SelectionEventListener,
  SelectionHighlightType,
  SelectionMode,
  SelectionOptions,
  SelectionState,
  UseSelectionReturn,
} from './selection';
// Selection Service
// Selection Hooks
export {
  cleanupSelectionServices,
  SelectionService,
  useInteractiveSelection,
  useSelection,
  useSelectionShortcuts,
  useSelectionStats,
} from './selection';
export type {
  OpenSCADColorParams,
  OpenSCADMatrixParams,
  OpenSCADMirrorParams,
  OpenSCADRotateParams,
  OpenSCADScaleParams,
  OpenSCADTranslateParams,
  TransformationError,
} from './transformation-operations';
// Transformation Operations Service
export { TransformationOperationsService } from './transformation-operations';
