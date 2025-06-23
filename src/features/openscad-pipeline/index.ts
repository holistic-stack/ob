/**
 * @file OpenSCAD Pipeline Feature Index
 * 
 * Clean exports for the complete OpenSCAD to R3F pipeline including
 * core processor, Zustand store, React hooks, and type definitions.
 * 
 * @author OpenSCAD-R3F Pipeline
 * @version 1.0.0
 */

// Core processor exports
export { 
  processOpenSCADPipeline
} from './core/pipeline-processor';

// Store exports
export { 
  usePipelineStore,
  usePipelineProcessing,
  usePipelineResults,
  usePipelineErrors,
  usePipelineManager,
  selectPipelineStatus,
  selectIsProcessing,
  selectMeshes,
  selectScene,
  selectErrors,
  selectWarnings,
  selectProgress,
  selectMetrics,
  selectAST,
  selectCSGTree,
  selectR3FResult
} from './stores/pipeline-store';

// Hook exports
export {
  useOpenSCADR3FIntegration,
  useOpenSCADR3FSimple,
  useOpenSCADR3FWithCallbacks
} from './hooks/use-openscad-r3f-integration';

// Type exports
export type {
  PipelineResult,
  PipelineConfig,
  PipelineProgress,
  PipelineError,
  PipelineStage,
  ProgressCallback,
  ErrorCallback,
  Result
} from './core/pipeline-processor';

export type {
  PipelineState,
  PipelineActions,
  PipelineStore,
  PipelineStatus
} from './stores/pipeline-store';

export type {
  OpenSCADR3FConfig,
  OpenSCADR3FResult
} from './hooks/use-openscad-r3f-integration';
