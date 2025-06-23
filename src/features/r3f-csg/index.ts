/**
 * @file R3F CSG Feature - Public API
 * 
 * This file serves as the public API for the R3F CSG feature, exporting all necessary
 * components, hooks, services, and types for external consumption. This approach
 * simplifies imports for other features and ensures a consistent public interface.
 * 
 * @author OpenSCAD-R3F Pipeline
 * @version 1.0.0
 */

// ===========================================================================
// #region Exports
// ===========================================================================

// ---------------------------------------------------------------------------
// Core Service and Factory
// ---------------------------------------------------------------------------

export { createR3FCSGService } from './services/csg-service/r3f-csg-service';
export { createR3FSceneFactory } from './services/scene-factory/r3f-scene-factory';

// ---------------------------------------------------------------------------
// Main Converter and Hook
// ---------------------------------------------------------------------------

export { createR3FCSGConverter } from './converter/r3f-csg-converter';
export { useR3FCSGConverter } from './hooks/use-r3f-csg-converter';

// ---------------------------------------------------------------------------
// Pipeline Processor
// ---------------------------------------------------------------------------

export { createR3FPipelineProcessor } from './pipeline/processor/r3f-pipeline-processor';

// ---------------------------------------------------------------------------
// Type Exports
// ---------------------------------------------------------------------------

// Export all types from the main type definition file
export * from './types/r3f-csg-types';

// From r3f-csg-converter
export type {
  R3FCSGConverter,
  ConversionResult,
  ConverterState,
  ProcessingProgress,
} from './converter/r3f-csg-converter';

// From use-r3f-csg-converter
export type {
  UseR3FCSGConverterConfig,
  UseR3FCSGConverterReturn,
} from './hooks/use-r3f-csg-converter';

// From r3f-pipeline-processor
export type { R3FPipelineProcessor } from './pipeline/processor/r3f-pipeline-processor';

// From r3f-scene-factory
export type { R3FSceneFactory } from './services/scene-factory/r3f-scene-factory';

// From r3f-csg-service
export type { R3FCSGService } from './services/csg-service/r3f-csg-service';

// From r3f-ast-visitor
export type { R3FASTVisitor } from './openscad/ast-visitor/r3f-ast-visitor';


// #endregion Exports
