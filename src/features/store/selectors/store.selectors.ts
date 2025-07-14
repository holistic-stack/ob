/**
 * Store Selectors
 *
 * Optimized selectors for Zustand store to prevent unnecessary re-renders
 * following functional programming patterns and memoization.
 *
 * Performance optimizations:
 * - Granular selectors to minimize re-renders
 * - Memoized complex computations with createSelector
 * - Shallow equality checks for object comparisons
 */

import { createSelector } from 'reselect';
// TODO: Replace with BabylonJS mesh types
import type { AppConfig, EditorState } from '../../../shared/types/common.types';
import type { AppState, ParsingState, RenderingError } from '../types/store.types';
import type { BabylonRenderingState } from '../slices/babylon-rendering-slice';
import type { Mesh } from '@babylonjs/core';

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
 * Babylon Rendering selectors
 */
export const selectBabylonRenderingState = (state: AppState): BabylonRenderingState =>
  state.babylonRendering;

// Default empty arrays - defined outside to prevent re-creation
const EMPTY_MESHES: ReadonlyArray<Mesh> = [];
const EMPTY_ERRORS: ReadonlyArray<RenderingError> = [];

export const selectRenderingMeshes = (state: AppState) => state.babylonRendering?.meshes ?? EMPTY_MESHES;

export const selectRenderingIsRendering = (state: AppState): boolean =>
  state.babylonRendering?.isRendering ?? false;

export const selectRenderingErrors = (state: AppState) =>
  state.babylonRendering?.renderErrors ?? EMPTY_ERRORS;

export const selectRenderingLastRendered = (state: AppState) =>
  state.babylonRendering?.lastRendered ?? null;

export const selectRenderingTime = (state: AppState): number => state.babylonRendering?.renderTime ?? 0;

// Camera configuration is handled by BabylonScene component, not in store state
export const selectRenderingCamera = (state: AppState) => null;

export const selectRenderingHasErrors = (state: AppState): boolean =>
  (state.babylonRendering?.renderErrors?.length ?? 0) > 0;

export const selectRenderingMeshCount = (state: AppState): number =>
  state.babylonRendering?.meshes?.length ?? 0;

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
  !(state.babylonRendering?.isRendering ?? false) &&
  state.parsing.ast.length > 0 &&
  state.parsing.errors.length === 0 &&
  state.config.enableRealTimeRendering;

export const selectHasUnsavedChanges = (state: AppState): boolean => state.editor.isDirty;

export const selectIsProcessing = (state: AppState): boolean =>
  state.parsing.isLoading || (state.babylonRendering?.isRendering ?? false);

export const selectHasAnyErrors = (state: AppState): boolean =>
  state.parsing.errors.length > 0 || (state.babylonRendering?.renderErrors?.length ?? 0) > 0;

export const selectTotalErrors = (state: AppState): number =>
  state.parsing.errors.length + (state.babylonRendering?.renderErrors?.length ?? 0);

export const selectAllErrors = (state: AppState): ReadonlyArray<string> => [
  ...state.parsing.errors,
  ...(state.babylonRendering?.renderErrors?.map((error) => error.message) ?? []),
];

export const selectLastActivity = createSelector(
  [
    (state: AppState) => state.editor.lastSaved,
    (state: AppState) => state.parsing.lastParsed,
    (state: AppState) => state.babylonRendering?.lastRendered,
  ],
  (editorLastSaved, parsingLastParsed, renderingLastRendered) => {
    const dates = [editorLastSaved, parsingLastParsed, renderingLastRendered].filter(
      (date): date is Date => date !== null && date !== undefined && date instanceof Date
    );

    return dates.length > 0 ? new Date(Math.max(...dates.map((d) => d.getTime()))) : null;
  }
);

export const selectApplicationStatus = (state: AppState): 'idle' | 'working' | 'error' => {
  if (state.parsing.errors.length > 0 || (state.babylonRendering?.renderErrors?.length ?? 0) > 0) {
    return 'error';
  }

  if (state.parsing.isLoading || (state.babylonRendering?.isRendering ?? false)) {
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

export const selectBabylonRenderingStats = createSelector(
  [(state: AppState) => state.babylonRendering],
  (babylonRendering) => ({
    meshCount: babylonRendering?.meshes?.length ?? 0,
    errorCount: babylonRendering?.renderErrors?.length ?? 0,
    renderTime: babylonRendering?.renderTime ?? 0,
    lastRendered: babylonRendering?.lastRendered ?? null,
    isRendering: babylonRendering?.isRendering ?? false,
    camera: babylonRendering?.camera ?? null,
  })
);

/**
 * Feature flag selectors
 */
export const selectFeatureFlags = createSelector([(state: AppState) => state.config], (config) => ({
  realTimeParsing: config.enableRealTimeParsing,
  realTimeRendering: config.enableRealTimeRendering,
  autoSave: config.enableAutoSave,
}));

/**
 * Debug selectors for development
 */
export const selectDebugInfo = createSelector(
  [
    selectEditorStats,
    selectParsingStats,
    selectRenderingStats,
    selectApplicationStatus,
    selectLastActivity,
    selectFeatureFlags,
  ],
  (editorState, parsingState, renderingState, applicationStatus, lastActivity, featureFlags) => ({
    editorState,
    parsingState,
    renderingState,
    applicationStatus,
    lastActivity,
    featureFlags,
  })
);

/**
 * Performance-optimized selectors for specific use cases
 * These selectors are designed to minimize re-renders by being highly granular
 */

// Optimized selector for code editor performance
export const selectCodeEditorProps = createSelector(
  [selectEditorCode, selectEditorCursorPosition, selectEditorSelection, selectEditorIsDirty],
  (code, cursorPosition, selection, isDirty) => ({
    code,
    cursorPosition,
    selection,
    isDirty,
  })
);

// Optimized selector for 3D viewer performance
export const selectViewerProps = createSelector(
  [
    (state: AppState) => state.babylonRendering?.meshes,
    (state: AppState) => state.babylonRendering?.isRendering,
    (state: AppState) => state.babylonRendering?.camera,
  ],
  (meshes, isRendering, camera) => ({
    meshes: meshes ?? [],
    isRendering: isRendering ?? false,
    camera,
  })
);

// Optimized selector for parsing status
export const selectParsingStatus = createSelector(
  [selectParsingIsLoading, selectParsingHasErrors, selectParsingTime],
  (isLoading, hasErrors, parseTime) => ({
    isLoading,
    hasErrors,
    parseTime,
  })
);

// Optimized selector for babylon rendering status
export const selectBabylonRenderingStatus = createSelector(
  [
    (state: AppState) => state.babylonRendering?.isRendering ?? false,
    selectRenderingHasErrors,
    (state: AppState) => state.babylonRendering?.renderTime ?? 0,
  ],
  (isRendering, hasErrors, renderTime) => ({
    isRendering,
    hasErrors,
    renderTime,
  })
);

// Optimized selector for performance metrics
export const selectPerformanceMetrics = createSelector(
  [selectParsingTime, (state: AppState) => state.babylonRendering?.renderTime ?? 0],
  (parseTime, renderTime) => ({
    parseTime,
    renderTime,
    totalTime: parseTime + renderTime,
    isPerformant: parseTime + renderTime < 50, // Under 50ms is considered performant
  })
);

// Optimized selector for error summary
export const selectErrorSummary = createSelector(
  [selectParsingErrors, (state: AppState) => state.babylonRendering?.renderErrors ?? []],
  (parsingErrors, renderingErrors) => ({
    parsingErrorCount: parsingErrors.length,
    renderingErrorCount: renderingErrors.length,
    totalErrorCount: parsingErrors.length + renderingErrors.length,
    hasAnyErrors: parsingErrors.length > 0 || renderingErrors.length > 0,
  })
);

// Optimized selector for UI state
export const selectUIState = createSelector(
  [selectIsProcessing, selectHasAnyErrors, selectApplicationStatus],
  (isProcessing, hasErrors, status) => ({
    isProcessing,
    hasErrors,
    status,
    canInteract: !isProcessing && status !== 'error',
  })
);
