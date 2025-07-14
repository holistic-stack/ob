/**
 * Action Type Definitions
 *
 * Detailed action type definitions for Zustand store operations
 * following functional programming patterns and type safety.
 */

// TODO: Replace with BabylonJS types
import type { CoreNode } from '../../../shared/types/ast.types.js';
import type {
  AppConfig,
  CameraConfig,
  EditorPosition,
  EditorSelection,
} from '../../../shared/types/common.types';
import type {
  AsyncOperationResult,
  OperationError,
} from '../../../shared/types/operations.types.js';
import type { ASTNode } from '../../openscad-parser/core/ast-types.js';

/**
 * Editor action payload types
 */
export interface UpdateCodePayload {
  readonly code: string;
  readonly triggerParsing?: boolean;
}

export interface UpdateCursorPositionPayload {
  readonly position: EditorPosition;
}

export interface UpdateSelectionPayload {
  readonly selection: EditorSelection | null;
}

export interface LoadCodePayload {
  readonly source: string;
  readonly filename?: string;
}

/**
 * Parsing action payload types with operation metadata
 */
export interface ParseCodePayload {
  readonly code: string;
  readonly options?: {
    readonly enableWarnings?: boolean;
    readonly enableOptimizations?: boolean;
    readonly maxDepth?: number;
    readonly timeout?: number;
    readonly preserveComments?: boolean;
    readonly includeMetadata?: boolean;
  };
  readonly operationId?: string;
}

export interface AddParsingErrorPayload {
  readonly error: OperationError;
  readonly operationId?: string;
  readonly context?: Record<string, unknown>;
}

/**
 * Rendering action payload types
 */
export interface UpdateMeshesPayload {
  readonly meshes: ReadonlyArray<import('@babylonjs/core').Mesh>;
  readonly metadata?: {
    readonly nodeCount: number;
    readonly triangleCount: number;
    readonly vertexCount: number;
  };
}

export interface RenderFromASTPayload {
  readonly ast: ReadonlyArray<ASTNode>;
  readonly options?: {
    readonly enableCSG?: boolean;
    readonly enableOptimizations?: boolean;
    readonly maxComplexity?: number;
  };
}

export interface UpdateCameraPayload {
  readonly camera: CameraConfig;
  readonly animate?: boolean;
  readonly duration?: number;
}

export interface AddRenderErrorPayload {
  readonly error: string;
  readonly nodeType?: string;
  readonly nodeIndex?: number;
}

/**
 * Configuration action payload types
 */
export interface UpdateConfigPayload {
  readonly config: Partial<AppConfig>;
  readonly persist?: boolean;
}

/**
 * Async action result types using shared operation types
 */
export type SaveCodeResult = AsyncOperationResult<void, OperationError>;
export type LoadCodeResult = AsyncOperationResult<void, OperationError>;
export type ParseCodeResult = AsyncOperationResult<ReadonlyArray<CoreNode>, OperationError>;
export type RenderFromASTResult = AsyncOperationResult<ReadonlyArray<import('@babylonjs/core').Mesh>, OperationError>;

/**
 * Action creator types for type-safe action dispatch
 */
export interface ActionCreators {
  // Editor actions
  readonly updateCode: (payload: UpdateCodePayload) => void;
  readonly updateCursorPosition: (payload: UpdateCursorPositionPayload) => void;
  readonly updateSelection: (payload: UpdateSelectionPayload) => void;
  readonly loadCode: (payload: LoadCodePayload) => LoadCodeResult;

  // Parsing actions
  readonly parseCode: (payload: ParseCodePayload) => ParseCodeResult;
  readonly addParsingError: (payload: AddParsingErrorPayload) => void;

  // Rendering actions
  readonly updateMeshes: (payload: UpdateMeshesPayload) => void;
  readonly renderFromAST: (payload: RenderFromASTPayload) => RenderFromASTResult;
  readonly updateCamera: (payload: UpdateCameraPayload) => void;
  readonly addRenderError: (payload: AddRenderErrorPayload) => void;

  // Configuration actions
  readonly updateConfig: (payload: UpdateConfigPayload) => void;
}

/**
 * Action validation types
 */
export interface ActionValidator<T> {
  readonly validate: (payload: T) => string | null;
}

/**
 * Action middleware types
 */
export interface ActionMiddleware<T> {
  readonly name: string;
  readonly before?: (payload: T) => T;
  readonly after?: (payload: T, result: unknown) => void;
  readonly onError?: (payload: T, error: Error) => void;
}

/**
 * Batch action types for performance optimization
 */
export interface BatchAction {
  readonly type: string;
  readonly payload: unknown;
}

export interface BatchActionPayload {
  readonly actions: ReadonlyArray<BatchAction>;
  readonly skipValidation?: boolean;
}

/**
 * Undo/Redo action types
 */
export interface UndoableAction {
  readonly type: string;
  readonly payload: unknown;
  readonly undo: () => void;
  readonly redo: () => void;
}

export interface HistoryState {
  readonly past: ReadonlyArray<UndoableAction>;
  readonly present: unknown;
  readonly future: ReadonlyArray<UndoableAction>;
}

/**
 * Store action types for internal use
 */
export type StoreActionType =
  | 'UPDATE_CODE'
  | 'UPDATE_CURSOR_POSITION'
  | 'UPDATE_SELECTION'
  | 'MARK_DIRTY'
  | 'MARK_SAVED'
  | 'LOAD_CODE'
  | 'SAVE_CODE'
  | 'RESET_EDITOR'
  | 'PARSE_CODE'
  | 'CLEAR_PARSING_STATE'
  | 'ADD_PARSING_ERROR'
  | 'CLEAR_PARSING_ERRORS'
  | 'UPDATE_MESHES'
  | 'RENDER_FROM_AST'
  | 'CLEAR_SCENE'
  | 'UPDATE_CAMERA'
  | 'RESET_CAMERA'
  | 'ADD_RENDER_ERROR'
  | 'CLEAR_RENDER_ERRORS'
  | 'UPDATE_METRICS'
  | 'START_MONITORING'
  | 'STOP_MONITORING'
  | 'RECORD_PARSE_TIME'
  | 'RECORD_RENDER_TIME'
  | 'ADD_PERFORMANCE_VIOLATION'
  | 'CLEAR_PERFORMANCE_VIOLATIONS'
  | 'UPDATE_CONFIG'
  | 'RESET_CONFIG'
  | 'TOGGLE_REAL_TIME_PARSING'
  | 'TOGGLE_REAL_TIME_RENDERING'
  | 'TOGGLE_AUTO_SAVE';

/**
 * Action metadata for debugging and monitoring
 */
export interface ActionMetadata {
  readonly type: StoreActionType;
  readonly timestamp: Date;
  readonly duration?: number;
  readonly source?: string;
  readonly userId?: string;
  readonly sessionId?: string;
}
