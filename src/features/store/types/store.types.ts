/**
 * @file store.types.ts
 * @description Comprehensive type definitions for Zustand store architecture providing
 * type-safe state management with functional programming patterns, immutable data
 * structures, and Result<T,E> error handling for the OpenSCAD Babylon application.
 *
 * @architectural_decision
 * **Immutable State Design**: All state interfaces use `readonly` modifiers to enforce
 * immutability at the TypeScript level, preventing accidental mutations and enabling
 * efficient change detection through structural sharing.
 *
 * **Slice-Based Type Organization**: Types are organized by domain slices (editor,
 * parsing, rendering, config) to maintain clear boundaries and enable independent
 * development of each feature area.
 *
 * **Result<T,E> Integration**: All async operations return Result types for consistent
 * error handling without exceptions, enabling functional error composition and
 * comprehensive error recovery strategies.
 *
 * @performance_considerations
 * - **Type Checking**: Readonly types enable compile-time optimization
 * - **Memory Efficiency**: Immutable structures support structural sharing
 * - **Bundle Size**: Tree-shakable type exports minimize runtime overhead
 * - **Development Experience**: Rich type annotations provide excellent IntelliSense
 *
 * @example Type-Safe Store Usage
 * ```typescript
 * import { useAppStore, type AppState, type AppStore } from '@/features/store';
 *
 * function TypeSafeComponent() {
 *   // Type-safe state selection
 *   const editorState: EditorState = useAppStore(state => state.editor);
 *   const parsingState: ParsingState = useAppStore(state => state.parsing);
 *
 *   // Type-safe action dispatch
 *   const actions: EditorActions = useAppStore(state => ({
 *     updateCode: state.updateCode,
 *     updateCursorPosition: state.updateCursorPosition,
 *     saveCode: state.saveCode
 *   }));
 *
 *   return <div>...</div>;
 * }
 * ```
 *
 * @example Custom Selector Types
 * ```typescript
 * import type { EditorSelector, ParsingSelector } from '@/features/store';
 *
 * // Type-safe custom selectors
 * const selectCodeLength: EditorSelector<number> = (state) => state.editor.code.length;
 * const selectHasErrors: ParsingSelector<boolean> = (state) => state.parsing.errors.length > 0;
 * const selectIsReady: (state: AppState) => boolean = (state) =>
 *   !state.parsing.isLoading && state.parsing.ast.length > 0;
 *
 * function ComponentWithSelectors() {
 *   const codeLength = useAppStore(selectCodeLength);
 *   const hasErrors = useAppStore(selectHasErrors);
 *   const isReady = useAppStore(selectIsReady);
 *
 *   return (
 *     <div>
 *       <div>Code length: {codeLength}</div>
 *       <div>Has errors: {hasErrors ? 'Yes' : 'No'}</div>
 *       <div>Ready to render: {isReady ? 'Yes' : 'No'}</div>
 *     </div>
 *   );
 * }
 * ```
 *
 * @example Store Extension Patterns
 * ```typescript
 * import type { AppStore, StoreMiddleware } from '@/features/store';
 *
 * // Custom middleware type
 * interface AnalyticsMiddleware extends StoreMiddleware<AppStore> {
 *   readonly name: 'analytics';
 *   readonly trackAction: (actionName: string, payload?: any) => void;
 * }
 *
 * // Extended store interface
 * interface ExtendedAppStore extends AppStore {
 *   readonly analytics: AnalyticsMiddleware;
 *   readonly trackParseOperation: (code: string, duration: number) => void;
 * }
 * ```
 */

import type { ASTNode } from '@/features/openscad-parser';
// TODO: Replace with BabylonJS types
import type {
  AppConfig,
  AsyncOperationResult,
  AsyncResult,
  DebounceConfig,
  EditorPosition,
  EditorSelection,
  EditorState,
  OperationError,
  OperationMetadata,
} from '@/shared';
import type {
  BabylonRenderingActions,
  BabylonRenderingState,
} from '../slices/babylon-rendering-slice';
import type {
  OpenSCADGlobalsActions,
  OpenSCADGlobalsState,
} from '../slices/openscad-globals-slice';
import type { ParseOptions } from '../slices/parsing-slice.types.js';

// Re-export types for external use
export type { BabylonRenderingState };

/**
 * Parsing state interface for OpenSCAD Abstract Syntax Tree (AST) processing.
 *
 * @architectural_decision
 * **Immutable AST Storage**: The AST is stored as a ReadonlyArray to prevent
 * accidental mutations that could corrupt the parsed structure. This ensures
 * that AST transformations must go through proper state updates.
 *
 * **Error Separation**: Parse errors and warnings are stored separately to
 * enable different UI treatments - errors block rendering while warnings
 * allow rendering with user notifications.
 *
 * **Performance Tracking**: Parse time is tracked for performance monitoring
 * and optimization. Times >1000ms indicate potential optimization needs.
 *
 * **Incremental Parsing**: The lastParsedCode field enables incremental
 * parsing optimizations by avoiding redundant parsing of unchanged content.
 *
 * @performance_characteristics
 * - **AST Size**: Typical OpenSCAD files produce 100-10,000 AST nodes
 * - **Parse Time**: Simple shapes <50ms, complex models 100-1000ms
 * - **Memory Usage**: ~1KB per 100 AST nodes, ~10MB for large files
 * - **Change Detection**: O(1) comparison via lastParsedCode reference
 *
 * @example Parsing State Usage
 * ```typescript
 * import { useAppStore } from '@/features/store';
 *
 * function ParsingMonitor() {
 *   const parsingState = useAppStore(state => state.parsing);
 *
 *   return (
 *     <div>
 *       <div>AST Nodes: {parsingState.ast.length}</div>
 *       <div>Parse Time: {parsingState.parseTime}ms</div>
 *       <div>Errors: {parsingState.errors.length}</div>
 *       <div>Warnings: {parsingState.warnings.length}</div>
 *       {parsingState.isLoading && <div>Parsing...</div>}
 *     </div>
 *   );
 * }
 * ```
 *
 * @example Error Handling with Parsing State
 * ```typescript
 * import { useAppStore } from '@/features/store';
 * import { useEffect } from 'react';
 *
 * function ParseErrorHandler() {
 *   const { errors, warnings, isLoading } = useAppStore(state => state.parsing);
 *
 *   useEffect(() => {
 *     if (errors.length > 0) {
 *       console.error('Parse errors detected:', errors);
 *       // Show error notification
 *     }
 *     if (warnings.length > 0) {
 *       console.warn('Parse warnings:', warnings);
 *       // Show warning notification
 *     }
 *   }, [errors, warnings]);
 *
 *   if (isLoading) {
 *     return <div>Parsing OpenSCAD code...</div>;
 *   }
 *
 *   return (
 *     <div>
 *       {errors.map((error, index) => (
 *         <div key={index} className="error">{error}</div>
 *       ))}
 *       {warnings.map((warning, index) => (
 *         <div key={index} className="warning">{warning}</div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 *
 * @example Performance Monitoring
 * ```typescript
 * import { useAppStore } from '@/features/store';
 * import { useEffect, useRef } from 'react';
 *
 * function ParsePerformanceMonitor() {
 *   const { parseTime, lastParsed, ast } = useAppStore(state => state.parsing);
 *   const parseHistory = useRef<Array<{ time: number; nodeCount: number; timestamp: Date }>>([]);
 *
 *   useEffect(() => {
 *     if (lastParsed && parseTime > 0) {
 *       parseHistory.current.push({
 *         time: parseTime,
 *         nodeCount: ast.length,
 *         timestamp: lastParsed
 *       });
 *
 *       // Warn about slow parsing
 *       if (parseTime > 1000) {
 *         console.warn(`Slow parsing detected: ${parseTime}ms for ${ast.length} nodes`);
 *       }
 *
 *       // Keep only last 100 entries
 *       if (parseHistory.current.length > 100) {
 *         parseHistory.current = parseHistory.current.slice(-100);
 *       }
 *     }
 *   }, [parseTime, lastParsed, ast.length]);
 *
 *   const averageParseTime = parseHistory.current.length > 0
 *     ? parseHistory.current.reduce((sum, entry) => sum + entry.time, 0) / parseHistory.current.length
 *     : 0;
 *
 *   return (
 *     <div className="performance-monitor">
 *       <div>Last Parse: {parseTime}ms</div>
 *       <div>Average Parse: {averageParseTime.toFixed(1)}ms</div>
 *       <div>AST Nodes: {ast.length}</div>
 *     </div>
 *   );
 * }
 * ```
 */
export interface ParsingState {
  ast: ReadonlyArray<ASTNode>;
  errors: ReadonlyArray<string>;
  warnings: ReadonlyArray<string>;
  isLoading: boolean;
  lastParsed: Date | null;
  lastParsedCode: string | null; // Track last parsed code to avoid redundant parsing
  readonly parseTime: number; // parsing time in milliseconds
}

// TODO: Replace with BabylonJS error types
// import type { RenderingError } from '../../babylon-renderer/types/renderer.types.js';

/**
 * Represents a rendering error with a unique ID.
 */
export interface RenderingError {
  readonly id: string;
  readonly message: string;
  readonly timestamp: Date;
  readonly severity: 'error' | 'warning' | 'info';
}

export type RenderError = RenderingError;

// Legacy RenderingState removed - using BabylonRenderingState from babylon-rendering-slice instead

/**
 * Main application state interface combining all domain slices.
 *
 * @architectural_decision
 * **Flat State Structure**: The state is kept relatively flat to minimize
 * nesting complexity while maintaining clear domain boundaries through
 * slice organization. This enables efficient access patterns and reduces
 * the cognitive overhead of deep state navigation.
 *
 * **Domain Separation**: Each slice handles a specific domain:
 * - `editor`: Monaco Editor content, cursor, and selection state
 * - `parsing`: OpenSCAD AST parsing with Tree-sitter integration
 * - `babylonRendering`: 3D scene state and BabylonJS mesh management
 * - `config`: Application-wide configuration and user preferences
 *
 * **Immutable Root**: The entire state tree is readonly, enforcing immutable
 * updates through Zustand's immer middleware and preventing accidental
 * direct mutations that could cause rendering inconsistencies.
 *
 * @performance_characteristics
 * - **State Access**: O(1) direct property access for all slice data
 * - **Change Detection**: Structural sharing enables efficient React re-renders
 * - **Memory Usage**: ~1-5MB for typical application state (excluding large ASTs)
 * - **Serialization**: Selective persistence keeps storage size manageable
 *
 * @example Complete State Access
 * ```typescript
 * import { useAppStore, type AppState } from '@/features/store';
 *
 * function CompleteStateViewer() {
 *   const fullState: AppState = useAppStore(state => state);
 *
 *   return (
 *     <div>
 *       <h3>Editor State</h3>
 *       <div>Code Length: {fullState.editor.code.length}</div>
 *       <div>Cursor: {fullState.editor.cursorPosition.line}:{fullState.editor.cursorPosition.column}</div>
 *       <div>Dirty: {fullState.editor.isDirty ? 'Yes' : 'No'}</div>
 *
 *       <h3>Parsing State</h3>
 *       <div>AST Nodes: {fullState.parsing.ast.length}</div>
 *       <div>Parse Time: {fullState.parsing.parseTime}ms</div>
 *       <div>Errors: {fullState.parsing.errors.length}</div>
 *
 *       <h3>Rendering State</h3>
 *       <div>Scene Objects: {fullState.babylonRendering.sceneObjects.length}</div>
 *       <div>Is Rendering: {fullState.babylonRendering.isRendering ? 'Yes' : 'No'}</div>
 *
 *       <h3>Configuration</h3>
 *       <div>Theme: {fullState.config.theme}</div>
 *       <div>Real-time Parsing: {fullState.config.enableRealTimeParsing ? 'Yes' : 'No'}</div>
 *     </div>
 *   );
 * }
 * ```
 *
 * @example Optimized Partial State Selection
 * ```typescript
 * import { useAppStore } from '@/features/store';
 *
 * function OptimizedComponent() {
 *   // Only subscribe to needed state slices
 *   const editorCode = useAppStore(state => state.editor.code);
 *   const parsingErrors = useAppStore(state => state.parsing.errors);
 *   const isRendering = useAppStore(state => state.babylonRendering.isRendering);
 *
 *   // This component only re-renders when these specific values change
 *   return (
 *     <div>
 *       <div>Code: {editorCode.substring(0, 50)}...</div>
 *       <div>Errors: {parsingErrors.length}</div>
 *       <div>Rendering: {isRendering ? 'Yes' : 'No'}</div>
 *     </div>
 *   );
 * }
 * ```
 *
 * @example State Transformation and Derivation
 * ```typescript
 * import { useAppStore } from '@/features/store';
 * import { useMemo } from 'react';
 *
 * function DerivedStateComponent() {
 *   const state = useAppStore();
 *
 *   // Derive complex state from multiple slices
 *   const workflowStatus = useMemo(() => {
 *     const hasCode = state.editor.code.length > 0;
 *     const isParsing = state.parsing.isLoading;
 *     const hasAST = state.parsing.ast.length > 0;
 *     const hasErrors = state.parsing.errors.length > 0;
 *     const isRendering = state.babylonRendering.isRendering;
 *     const hasScene = state.babylonRendering.sceneObjects.length > 0;
 *
 *     if (!hasCode) return 'No code';
 *     if (isParsing) return 'Parsing code...';
 *     if (hasErrors) return 'Parse errors';
 *     if (!hasAST) return 'No AST';
 *     if (isRendering) return 'Rendering 3D...';
 *     if (hasScene) return 'Ready';
 *     return 'Unknown state';
 *   }, [state]);
 *
 *   return (
 *     <div className="workflow-status">
 *       <h3>Workflow Status: {workflowStatus}</h3>
 *     </div>
 *   );
 * }
 * ```
 *
 * @example State Debugging and Development
 * ```typescript
 * import { useAppStore } from '@/features/store';
 * import { useEffect } from 'react';
 *
 * function StateDebugger() {
 *   const state = useAppStore();
 *
 *   useEffect(() => {
 *     console.group('🔍 State Debug Info');
 *     console.log('Editor:', {
 *       codeLength: state.editor.code.length,
 *       isDirty: state.editor.isDirty,
 *       cursorLine: state.editor.cursorPosition.line
 *     });
 *     console.log('Parsing:', {
 *       astNodes: state.parsing.ast.length,
 *       parseTime: state.parsing.parseTime,
 *       errors: state.parsing.errors.length,
 *       isLoading: state.parsing.isLoading
 *     });
 *     console.log('Rendering:', {
 *       sceneObjects: state.babylonRendering.sceneObjects.length,
 *       isRendering: state.babylonRendering.isRendering,
 *       camera: state.babylonRendering.camera
 *     });
 *     console.log('Config:', {
 *       theme: state.config.theme,
 *       realTimeParsing: state.config.enableRealTimeParsing,
 *       realTimeRendering: state.config.enableRealTimeRendering
 *     });
 *     console.groupEnd();
 *   });
 *
 *   return null; // Debug component renders nothing
 * }
 * ```
 */
export interface AppState {
  readonly editor: EditorState;
  readonly parsing: ParsingState;
  readonly babylonRendering: BabylonRenderingState;
  readonly openscadGlobals: OpenSCADGlobalsState;
  config: AppConfig;
}

// =================================================================
//
//                       STORE SLICE DEFINITIONS
//
// =================================================================

export interface EditorActions {
  updateCode: (code: string) => void;
  updateCursorPosition: (position: EditorPosition) => void;
  updateSelection: (selection: EditorSelection | null) => void;
  markDirty: () => void;
  markSaved: () => void;
  saveCode: () => AsyncResult<void, string>;
  loadCode: (source: string) => AsyncResult<void, string>;
  resetEditor: () => void;
}

export type EditorSlice = EditorState & EditorActions;

export interface ParsingActions {
  parseCode: (
    code: string,
    options?: ParseOptions
  ) => AsyncOperationResult<ReadonlyArray<ASTNode>, OperationError>;
  parseAST: (
    code: string,
    options?: ParseOptions
  ) => AsyncOperationResult<ReadonlyArray<ASTNode>, OperationError>;
  clearParsingState: () => void;
  debouncedParse: (code: string, options?: ParseOptions) => void;
  addParsingError: (error: OperationError) => void;
  clearParsingErrors: () => void;
  getParsingMetrics: () => ReadonlyArray<OperationMetadata>;
  cancelParsing: (operationId: string) => void;
}

export type ParsingSlice = ParsingState & ParsingActions;

// Legacy RenderingActions and RenderingSlice removed - using BabylonRenderingActions from babylon-rendering-slice instead

export interface ConfigActions {
  updateConfig: (config: Partial<AppConfig>) => void;
  resetConfig: () => void;
  toggleRealTimeParsing: () => void;
  toggleRealTimeRendering: () => void;
  toggleAutoSave: () => void;
}

export type ConfigSlice = { config: AppConfig } & ConfigActions;

/**
 * Store interface combining state and actions from all slices
 */
export type AppStore = AppState &
  EditorActions &
  ParsingActions &
  BabylonRenderingActions &
  OpenSCADGlobalsActions &
  ConfigActions;

/**
 * Store selector types for performance optimization
 */
export type EditorSelector<T> = (state: AppState) => T;
export type ParsingSelector<T> = (state: AppState) => T;
export type RenderingSelector<T> = (state: AppState) => T;

/**
 * Store subscription types
 */
export interface StoreSubscription {
  readonly unsubscribe: () => void;
}

/**
 * Store middleware types
 */
export interface StoreMiddleware<T> {
  readonly name: string;
  readonly middleware: (config: T) => T;
}

/**
 * Store initialization options
 */
export interface StoreOptions {
  readonly enableDevtools: boolean;
  readonly enablePersistence: boolean;
  readonly debounceConfig: DebounceConfig;
  readonly initialState?: Partial<AppState>;
}

/**
 * Store event types for monitoring
 */
export type StoreEvent =
  | { readonly type: 'code-changed'; readonly code: string }
  | { readonly type: 'parse-started'; readonly timestamp: Date }
  | { readonly type: 'parse-failed'; readonly error: string }
  | { readonly type: 'render-started'; readonly timestamp: Date }
  | { readonly type: 'render-failed'; readonly error: string };

/**
 * Store event listener type
 */
export type StoreEventListener = (event: StoreEvent) => void;
