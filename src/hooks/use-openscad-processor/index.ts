/**
 * @file Pipeline Processor Exports (React 19 SRP Refactored)
 *
 * Modern OpenSCAD processor hook following React 19 best practices:
 * - SRP (Single Responsibility Principle)
 * - TDD, DRY, and KISS principles
 * - Custom hooks with separated concerns
 * - useOptimistic for immediate UI feedback
 * - Real implementations (no mocks)
 *
 * @author Luciano Júnior
 * @date June 2025
 */

// Main hook export - Modern React 19 approach
export { useOpenSCADProcessor } from './use-openscad-processor';
export type {
  OpenSCADProcessorState,
  ProcessedMesh,
  ProcessingStats
} from './use-openscad-processor';
