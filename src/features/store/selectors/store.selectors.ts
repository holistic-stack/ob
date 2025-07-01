/**
 * Store Selectors
 *
 * Optimized selectors for Zustand store to prevent unnecessary re-renders
 * following functional programming patterns and memoization.
 */

import { createSelector } from 'reselect';
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
export const selectRenderingState = (state: AppState): RenderingState | undefined =>
  state.rendering;

// Default empty arrays - defined outside to prevent re-creation
const EMPTY_MESHES: ReadonlyArray<unknown> = [];
const EMPTY_ERRORS: ReadonlyArray<unknown> = [];

export const selectRenderingMeshes = (state: AppState) => state.rendering?.meshes ?? EMPTY_MESHES;

export const selectRenderingIsRendering = (state: AppState): boolean =>
  state.rendering?.isRendering ?? false;

export const selectRenderingErrors = (state: AppState) =>
  state.rendering?.renderErrors ?? EMPTY_ERRORS;

export const selectRenderingLastRendered = (state: AppState) =>
  state.rendering?.lastRendered ?? null;

export const selectRenderingTime = (state: AppState): number => state.rendering?.renderTime ?? 0;

export const selectRenderingCamera = (state: AppState) => state.rendering?.camera ?? null;

export const selectRenderingHasErrors = (state: AppState): boolean =>
  (state.rendering?.renderErrors?.length ?? 0) > 0;

export const selectRenderingMeshCount = (state: AppState): number =>
  state.rendering?.meshes?.length ?? 0;

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
  !(state.rendering?.isRendering ?? false) &&
  state.parsing.ast.length > 0 &&
  state.parsing.errors.length === 0 &&
  state.config.enableRealTimeRendering;

export const selectHasUnsavedChanges = (state: AppState): boolean => state.editor.isDirty;

export const selectIsProcessing = (state: AppState): boolean =>
  state.parsing.isLoading || (state.rendering?.isRendering ?? false);

export const selectHasAnyErrors = (state: AppState): boolean =>
  state.parsing.errors.length > 0 || (state.rendering?.renderErrors?.length ?? 0) > 0;

export const selectTotalErrors = (state: AppState): number =>
  state.parsing.errors.length + (state.rendering?.renderErrors?.length ?? 0);

export const selectAllErrors = (state: AppState): ReadonlyArray<string> => [
  ...state.parsing.errors,
  ...(state.rendering?.renderErrors?.map((error) => error.message) ?? []),
];

export const selectLastActivity = createSelector(
  [
    (state: AppState) => state.editor.lastSaved,
    (state: AppState) => state.parsing.lastParsed,
    (state: AppState) => state.rendering?.lastRendered,
    (state: AppState) => state.performance.lastUpdated,
  ],
  (editorLastSaved, parsingLastParsed, renderingLastRendered, performanceLastUpdated) => {
    const dates = [
      editorLastSaved,
      parsingLastParsed,
      renderingLastRendered,
      performanceLastUpdated,
    ].filter((date): date is Date => date !== null);

    return dates.length > 0 ? new Date(Math.max(...dates.map((d) => d.getTime()))) : null;
  }
);

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
  if (state.parsing.errors.length > 0 || (state.rendering?.renderErrors?.length ?? 0) > 0) {
    return 'error';
  }

  if (state.parsing.isLoading || (state.rendering?.isRendering ?? false)) {
    return 'working';
  }

  return 'idle';
};

/**
 * Memoized selectors for complex computations
 */
export const selectEditorStats = createSelector([(state: AppState) => state.editor], (editor) => ({
  codeLength: editor.code.length,
  lineCount: editor.code.split('\n').length,
  wordCount: editor.code.split(/\s+/).filter((word) => word.length > 0).length,
  isDirty: editor.isDirty,
  lastSaved: editor.lastSaved,
}));

export const selectParsingStats = createSelector(
  [(state: AppState) => state.parsing],
  (parsing) => ({
    nodeCount: parsing.ast.length,
    errorCount: parsing.errors.length,
    warningCount: parsing.warnings.length,
    parseTime: parsing.parseTime,
    lastParsed: parsing.lastParsed,
    isLoading: parsing.isLoading,
  })
);

export const selectRenderingStats = createSelector(
  [(state: AppState) => state.rendering],
  (rendering) => ({
    meshCount: rendering?.meshes?.length ?? 0,
    errorCount: rendering?.renderErrors?.length ?? 0,
    renderTime: rendering?.renderTime ?? 0,
    lastRendered: rendering?.lastRendered ?? null,
    isRendering: rendering?.isRendering ?? false,
    camera: rendering?.camera ?? null,
  })
);

export const selectPerformanceStats = createSelector(
  [
    (state: AppState) => state.performance.metrics,
    (state: AppState) => state.performance.violations.length,
    (state: AppState) => state.performance.isMonitoring,
    (state: AppState) => state.performance.lastUpdated,
    selectPerformanceStatus,
  ],
  (metrics, violationCount, isMonitoring, lastUpdated, status) => ({
    ...metrics,
    violationCount,
    isMonitoring,
    lastUpdated,
    status,
  })
);

/**
 * Feature flag selectors
 */
export const selectFeatureFlags = createSelector([(state: AppState) => state.config], (config) => ({
  realTimeParsing: config.enableRealTimeParsing,
  realTimeRendering: config.enableRealTimeRendering,
  autoSave: config.enableAutoSave,
  performanceMetrics: config.performance.enableMetrics,
  webGL2: config.performance.enableWebGL2,
  hardwareAcceleration: config.performance.enableHardwareAcceleration,
}));

/**
 * Debug selectors for development
 */
export const selectDebugInfo = createSelector(
  [
    selectEditorStats,
    selectParsingStats,
    selectRenderingStats,
    selectPerformanceStats,
    selectApplicationStatus,
    selectLastActivity,
    selectFeatureFlags,
  ],
  (
    editorState,
    parsingState,
    renderingState,
    performanceState,
    applicationStatus,
    lastActivity,
    featureFlags
  ) => ({
    editorState,
    parsingState,
    renderingState,
    performanceState,
    applicationStatus,
    lastActivity,
    featureFlags,
  })
);
