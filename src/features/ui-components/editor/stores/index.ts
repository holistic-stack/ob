/**
 * @file Stores Index
 * 
 * Centralized exports for all Zustand stores in the editor feature.
 * Provides clean imports for store hooks and utilities.
 * 
 * @author OpenSCAD-Babylon Pipeline
 * @version 1.0.0
 */

// ============================================================================
// OpenSCAD AST Store Exports
// ============================================================================

export {
  // Main store hook
  useOpenSCADStore,
  
  // Selective subscription hooks
  useOpenSCADCode,
  useOpenSCADAst,
  useOpenSCADErrors,
  useOpenSCADStatus,
  useOpenSCADPerformance,
  useOpenSCADActions,
  
  // Cleanup utilities
  cleanupOpenSCADStore,
  
  // Types
  type OpenSCADState,
  type OpenSCADCode,
  type ASTData,
  type Result,
  type ParseStatus,
  type PerformanceMetrics,
} from './openscad-ast-store';

// ============================================================================
// Re-exports for Backward Compatibility
// ============================================================================

// Re-export commonly used types from AST service for convenience
export type { ParseError, ASTParseResult } from '../code-editor/openscad-ast-service';
export type { ASTNode } from '@holistic-stack/openscad-parser';
