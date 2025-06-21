/**
 * @file Diagnostics Module for OpenSCAD Editor
 * 
 * Exports all diagnostic-related functionality including error detection,
 * quick fixes, and diagnostic utilities for the OpenSCAD editor.
 */

export {
  OpenSCADErrorDetectionProvider,
  DiagnosticSeverity,
  DEFAULT_ERROR_DETECTION_CONFIG,
  type OpenSCADDiagnostic,
  type ErrorDetectionConfig,
  type ErrorDetectionResult
} from './error-detection-provider';

export {
  OpenSCADQuickFixProvider,
  QuickFixKind,
  DEFAULT_QUICK_FIX_CONFIG,
  type QuickFixAction,
  type QuickFixConfig,
  type QuickFixResult
} from './quick-fix-provider';

export {
  createDiagnosticsService,
  type DiagnosticsService,
  type DiagnosticsServiceConfig
} from './diagnostics-service';
