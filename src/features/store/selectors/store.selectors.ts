/**
 * Store Selectors
 *
 * Optimized selectors for Zustand store to prevent unnecessary re-renders
 * following functional programming patterns and memoization.
 */

import type { AppConfig, EditorState } from '../../../shared/types/common.types';
import type {
  AppState,
  ParsingState,
  PerformanceState,
  RenderingState,
} from '../types/store.types';

/**
 * Editor selectors
 */
export const selectEditorState = (state: AppState): EditorState => state.editor;

export const selectEditorCode = (state: AppState): string => state.editor.code;

export const selectEditorCursorPosition = (state: AppState) => state.editor.cursorPosition;

export const selectEditorSelection = (state: AppState) => state.editor.selection;

export const selectEditorIsDirty = (state: AppState): boolean => state.editor.isDirty;

export const selectEditorLastSaved = (state: AppState) => state.editor.lastSaved;

/**
 * Parsing selectors
 */
export const selectParsingState = (state: AppState): ParsingState => state.parsing;

export const selectParsingAST = (state: AppState) => state.parsing.ast;

export const selectParsingErrors = (state: AppState) => state.parsing.errors;

export const selectParsingWarnings = (state: AppState) => state.parsing.warnings;

export const selectParsingIsLoading = (state: AppState): boolean => state.parsing.isLoading;

export const selectParsingLastParsed = (state: AppState) => state.parsing.lastParsed;

export const selectParsingTime = (state: AppState): number => state.parsing.parseTime;

export const selectParsingHasErrors = (state: AppState): boolean => state.parsing.errors.length > 0;

export const selectParsingHasWarnings = (state: AppState): boolean =>
  state.parsing.warnings.length > 0;

/**
 * Rendering selectors
 */
export const selectRenderingState = (state: AppState): RenderingState => state.rendering;

export const selectRenderingMeshes = (state: AppState) => state.rendering.meshes;

export const selectRenderingIsRendering = (state: AppState): boolean => state.rendering.isRendering;

export const selectRenderingErrors = (state: AppState) => state.rendering.renderErrors;

export const selectRenderingLastRendered = (state: AppState) => state.rendering.lastRendered;

export const selectRenderingTime = (state: AppState): number => state.rendering.renderTime;

export const selectRenderingCamera = (state: AppState) => state.rendering.camera;

export const selectRenderingHasErrors = (state: AppState): boolean =>
  state.rendering.renderErrors.length > 0;

export const selectRenderingMeshCount = (state: AppState): number => state.rendering.meshes.length;

/**
 * Performance selectors
 */
export const selectPerformanceState = (state: AppState): PerformanceState => state.performance;

export const selectPerformanceMetrics = (state: AppState) => state.performance.metrics;

export const selectPerformanceIsMonitoring = (state: AppState): boolean =>
  state.performance.isMonitoring;

export const selectPerformanceViolations = (state: AppState) => state.performance.violations;

export const selectPerformanceLastUpdated = (state: AppState) => state.performance.lastUpdated;

export const selectPerformanceRenderTime = (state: AppState): number =>
  state.performance.metrics.renderTime;

export const selectPerformanceParseTime = (state: AppState): number =>
  state.performance.metrics.parseTime;

export const selectPerformanceMemoryUsage = (state: AppState): number =>
  state.performance.metrics.memoryUsage;

export const selectPerformanceFrameRate = (state: AppState): number =>
  state.performance.metrics.frameRate;

export const selectPerformanceHasViolations = (state: AppState): boolean =>
  state.performance.violations.length > 0;

/**
 * Configuration selectors
 */
export const selectConfig = (state: AppState): AppConfig => state.config;

export const selectConfigDebounceMs = (state: AppState): number => state.config.debounceMs;

export const selectConfigEnableAutoSave = (state: AppState): boolean => state.config.enableAutoSave;

export const selectConfigEnableRealTimeParsing = (state: AppState): boolean =>
  state.config.enableRealTimeParsing;

export const selectConfigEnableRealTimeRendering = (state: AppState): boolean =>
  state.config.enableRealTimeRendering;

export const selectConfigTheme = (state: AppState) => state.config.theme;

export const selectConfigPerformance = (state: AppState) => state.config.performance;

/**
 * Computed selectors (derived state)
 */
export const selectIsCodeEmpty = (state: AppState): boolean =>
  state.editor.code.trim().length === 0;

export const selectCanParse = (state: AppState): boolean =>
  !state.parsing.isLoading &&
  state.editor.code.trim().length > 0 &&
  state.config.enableRealTimeParsing;

export const selectCanRender = (state: AppState): boolean =>
  !state.rendering.isRendering &&
  state.parsing.ast.length > 0 &&
  state.parsing.errors.length === 0 &&
  state.config.enableRealTimeRendering;

export const selectHasUnsavedChanges = (state: AppState): boolean => state.editor.isDirty;

export const selectIsProcessing = (state: AppState): boolean =>
  state.parsing.isLoading || state.rendering.isRendering;

export const selectHasAnyErrors = (state: AppState): boolean =>
  state.parsing.errors.length > 0 || state.rendering.renderErrors.length > 0;

export const selectTotalErrors = (state: AppState): number =>
  state.parsing.errors.length + state.rendering.renderErrors.length;

export const selectAllErrors = (state: AppState): ReadonlyArray<string> => [
  ...state.parsing.errors,
  ...state.rendering.renderErrors.map((error) => error.message),
];

export const selectLastActivity = (state: AppState): Date | null => {
  const dates = [
    state.editor.lastSaved,
    state.parsing.lastParsed,
    state.rendering.lastRendered,
    state.performance.lastUpdated,
  ].filter((date): date is Date => date !== null);

  return dates.length > 0 ? new Date(Math.max(...dates.map((d) => d.getTime()))) : null;
};

export const selectPerformanceStatus = (state: AppState): 'good' | 'warning' | 'critical' => {
  const { renderTime, parseTime, frameRate } = state.performance.metrics;
  const { maxRenderTime } = state.config.performance;

  if (renderTime > maxRenderTime * 2 || parseTime > 200 || frameRate < 30) {
    return 'critical';
  }

  if (renderTime > maxRenderTime || parseTime > 100 || frameRate < 45) {
    return 'warning';
  }

  return 'good';
};

export const selectApplicationStatus = (state: AppState): 'idle' | 'working' | 'error' => {
  if (state.parsing.errors.length > 0 || state.rendering.renderErrors.length > 0) {
    return 'error';
  }

  if (state.parsing.isLoading || state.rendering.isRendering) {
    return 'working';
  }

  return 'idle';
};

/**
 * Memoized selectors for complex computations
 */
export const selectEditorStats = (state: AppState) => ({
  codeLength: state.editor.code.length,
  lineCount: state.editor.code.split('\n').length,
  wordCount: state.editor.code.split(/\s+/).filter((word) => word.length > 0).length,
  isDirty: state.editor.isDirty,
  lastSaved: state.editor.lastSaved,
});

export const selectParsingStats = (state: AppState) => ({
  nodeCount: state.parsing.ast.length,
  errorCount: state.parsing.errors.length,
  warningCount: state.parsing.warnings.length,
  parseTime: state.parsing.parseTime,
  lastParsed: state.parsing.lastParsed,
  isLoading: state.parsing.isLoading,
});

export const selectRenderingStats = (state: AppState) => ({
  meshCount: state.rendering.meshes.length,
  errorCount: state.rendering.renderErrors.length,
  renderTime: state.rendering.renderTime,
  lastRendered: state.rendering.lastRendered,
  isRendering: state.rendering.isRendering,
  camera: state.rendering.camera,
});

export const selectPerformanceStats = (state: AppState) => ({
  ...state.performance.metrics,
  violationCount: state.performance.violations.length,
  isMonitoring: state.performance.isMonitoring,
  lastUpdated: state.performance.lastUpdated,
  status: selectPerformanceStatus(state),
});

/**
 * Feature flag selectors
 */
export const selectFeatureFlags = (state: AppState) => ({
  realTimeParsing: state.config.enableRealTimeParsing,
  realTimeRendering: state.config.enableRealTimeRendering,
  autoSave: state.config.enableAutoSave,
  performanceMetrics: state.config.performance.enableMetrics,
  webGL2: state.config.performance.enableWebGL2,
  hardwareAcceleration: state.config.performance.enableHardwareAcceleration,
});

/**
 * Debug selectors for development
 */
export const selectDebugInfo = (state: AppState) => ({
  editorState: selectEditorStats(state),
  parsingState: selectParsingStats(state),
  renderingState: selectRenderingStats(state),
  performanceState: selectPerformanceStats(state),
  applicationStatus: selectApplicationStatus(state),
  lastActivity: selectLastActivity(state),
  featureFlags: selectFeatureFlags(state),
});
