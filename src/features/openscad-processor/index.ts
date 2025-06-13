/**
 * @file OpenSCAD Processor Feature Entry Point
 * 
 * Main entry point for the OpenSCAD processor feature.
 * Following bulletproof-react architecture patterns.
 * 
 * @author Luciano Júnior
 * @date June 2025
 */

// Main hook (primary export)
export { useOpenSCADProcessor as default } from './hooks/use-openscad-processor';
export { useOpenSCADProcessor } from './hooks/use-openscad-processor';

// Focused hooks (for advanced usage)
export { usePipelineInitialization, usePipelineService } from './hooks/use-pipeline-initialization';
export { useProcessingStats } from './hooks/use-processing-stats';
export { useProcessingState } from './hooks/use-processing-state';

// Services (for testing and advanced usage)
export { PipelineService, getPipelineService, resetPipelineService } from './services/pipeline-service';
export { ProcessingService, createProcessingService } from './services/processing-service';

// Utilities (for testing and advanced usage)
export * from './utils/stats-calculator';
export * from './utils/geometry-converter';

// Types (for TypeScript usage)
export type * from './types/processing-types';
