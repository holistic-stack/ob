/**
 * Store Type Definitions
 * 
 * Comprehensive type definitions for Zustand store state and actions
 * following functional programming patterns and immutable data structures.
 */

import type { ASTNode } from '@holistic-stack/openscad-parser';
import type * as THREE from 'three';
import type { AsyncResult } from '../../../shared/types/result.types';
import type { 
  EditorState,
  AppConfig,
  PerformanceMetrics,
  EditorPosition,
  EditorSelection,
  Camera3D
} from '../../../shared/types/common.types';

/**
 * Parsing state for OpenSCAD AST processing
 */
export interface ParsingState {
  readonly ast: ReadonlyArray<ASTNode>;
  readonly errors: ReadonlyArray<string>;
  readonly warnings: ReadonlyArray<string>;
  readonly isLoading: boolean;
  readonly lastParsed: Date | null;
  readonly parseTime: number;
}

/**
 * 3D rendering state
 */
export interface RenderingState {
  readonly meshes: ReadonlyArray<THREE.Mesh>;
  readonly isRendering: boolean;
  readonly renderErrors: ReadonlyArray<string>;
  readonly lastRendered: Date | null;
  readonly renderTime: number;
  readonly camera: Camera3D;
}

/**
 * Application performance state
 */
export interface PerformanceState {
  readonly metrics: PerformanceMetrics;
  readonly isMonitoring: boolean;
  readonly violations: ReadonlyArray<string>;
  readonly lastUpdated: Date | null;
}

/**
 * Main application state
 */
export interface AppState {
  readonly editor: EditorState;
  readonly parsing: ParsingState;
  readonly rendering: RenderingState;
  readonly performance: PerformanceState;
  readonly config: AppConfig;
}

/**
 * Editor action types
 */
export interface EditorActions {
  // Code management
  readonly updateCode: (code: string) => void;
  readonly updateCursorPosition: (position: EditorPosition) => void;
  readonly updateSelection: (selection: EditorSelection | null) => void;
  readonly markDirty: () => void;
  readonly markSaved: () => void;
  
  // File operations
  readonly saveCode: () => AsyncResult<void, string>;
  readonly loadCode: (source: string) => AsyncResult<void, string>;
  readonly resetEditor: () => void;
}

/**
 * Parsing action types
 */
export interface ParsingActions {
  // AST parsing operations
  readonly parseCode: (code: string) => AsyncResult<ReadonlyArray<ASTNode>, string>;
  readonly parseAST: (code: string) => AsyncResult<ReadonlyArray<ASTNode>, string>; // Alias for backwards compatibility
  readonly clearParsingState: () => void;
  readonly debouncedParse: (code: string) => void;

  // Error handling
  readonly addParsingError: (error: string) => void;
  readonly clearParsingErrors: () => void;
}

/**
 * Rendering action types
 */
export interface RenderingActions {
  // 3D scene management
  readonly updateMeshes: (meshes: ReadonlyArray<THREE.Mesh>) => void;
  readonly renderFromAST: (ast: ReadonlyArray<ASTNode>) => AsyncResult<ReadonlyArray<THREE.Mesh>, string>;
  readonly clearScene: () => void;
  
  // Camera controls
  readonly updateCamera: (camera: Camera3D) => void;
  readonly resetCamera: () => void;
  
  // Error handling
  readonly addRenderError: (error: string) => void;
  readonly clearRenderErrors: () => void;
}

/**
 * Performance action types
 */
export interface PerformanceActions {
  // Metrics management
  readonly updateMetrics: (metrics: PerformanceMetrics) => void;
  readonly startMonitoring: () => void;
  readonly stopMonitoring: () => void;
  
  // Performance tracking
  readonly recordParseTime: (duration: number) => void;
  readonly recordRenderTime: (duration: number) => void;
  readonly addPerformanceViolation: (violation: string) => void;
  readonly clearPerformanceViolations: () => void;
}

/**
 * Configuration action types
 */
export interface ConfigActions {
  // Configuration management
  readonly updateConfig: (config: Partial<AppConfig>) => void;
  readonly resetConfig: () => void;
  
  // Feature toggles
  readonly toggleRealTimeParsing: () => void;
  readonly toggleRealTimeRendering: () => void;
  readonly toggleAutoSave: () => void;
}

/**
 * Combined actions interface
 */
export type AppActions = EditorActions & 
                        ParsingActions & 
                        RenderingActions & 
                        PerformanceActions & 
                        ConfigActions;

/**
 * Store interface combining state and actions
 */
export type AppStore = AppState & AppActions;

/**
 * Store selector types for performance optimization
 */
export type EditorSelector<T> = (state: AppState) => T;
export type ParsingSelector<T> = (state: AppState) => T;
export type RenderingSelector<T> = (state: AppState) => T;
export type PerformanceSelector<T> = (state: AppState) => T;

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
 * Debounce configuration
 */
export interface DebounceConfig {
  readonly parseDelayMs: number;
  readonly renderDelayMs: number;
  readonly saveDelayMs: number;
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
  | { readonly type: 'parse-completed'; readonly duration: number; readonly nodeCount: number }
  | { readonly type: 'parse-failed'; readonly error: string }
  | { readonly type: 'render-started'; readonly timestamp: Date }
  | { readonly type: 'render-completed'; readonly duration: number; readonly meshCount: number }
  | { readonly type: 'render-failed'; readonly error: string }
  | { readonly type: 'performance-violation'; readonly violation: string };

/**
 * Store event listener type
 */
export type StoreEventListener = (event: StoreEvent) => void;
