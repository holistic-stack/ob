/**
 * Store Type Definitions
 *
 * Comprehensive type definitions for Zustand store state and actions
 * following functional programming patterns and immutable data structures.
 */

import type * as THREE from 'three';
import type {
  AppConfig,
  CameraConfig,
  DebounceConfig,
  EditorPosition,
  EditorSelection,
  EditorState,
} from '../../../shared/types/common.types';
import type { AsyncResult } from '../../../shared/types/result.types.js';
import type { ASTNode } from '../../openscad-parser/core/ast-types.js';

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

import type { RenderingError } from '../../3d-renderer/types/renderer.types.js';

/**
 * Represents a rendering error with a unique ID.
 */
export type RenderError = RenderingError;

/**
 * Re-export RenderingError for convenience
 */
export type { RenderingError };

/**
 * 3D rendering state
 */
export interface RenderingState {
  readonly meshes: ReadonlyArray<THREE.Mesh>;
  readonly isRendering: boolean;
  readonly renderErrors: ReadonlyArray<RenderingError>;
  readonly lastRendered: Date | null;
  readonly renderTime: number;
  readonly camera: CameraConfig;
}



/**
 * Main application state
 */
export interface AppState {
  readonly editor: EditorState;
  readonly parsing: ParsingState;
  readonly rendering?: RenderingState;
  readonly config: AppConfig;
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
  parseCode: (code: string) => AsyncResult<ReadonlyArray<ASTNode>, string>;
  parseAST: (code: string) => AsyncResult<ReadonlyArray<ASTNode>, string>;
  clearParsingState: () => void;
  debouncedParse: (code: string) => void;
  addParsingError: (error: string) => void;
  clearParsingErrors: () => void;
}

export type ParsingSlice = ParsingState & ParsingActions;

export interface RenderingActions {
  updateMeshes: (meshes: ReadonlyArray<THREE.Mesh>) => void;
  renderFromAST: (ast: ReadonlyArray<ASTNode>) => AsyncResult<ReadonlyArray<THREE.Mesh>, string>;
  clearScene: () => void;
  updateCamera: (camera: Partial<CameraConfig>) => void;
  resetCamera: () => void;
  addRenderError: (error: RenderingError) => void;
  clearRenderErrors: () => void;
}

export type RenderingSlice = RenderingState & RenderingActions;



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
  RenderingActions &
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
  | { readonly type: 'parse-completed'; readonly duration: number; readonly nodeCount: number }
  | { readonly type: 'parse-failed'; readonly error: string }
  | { readonly type: 'render-started'; readonly timestamp: Date }
  | { readonly type: 'render-completed'; readonly duration: number; readonly meshCount: number }
  | { readonly type: 'render-failed'; readonly error: string };

/**
 * Store event listener type
 */
export type StoreEventListener = (event: StoreEvent) => void;
