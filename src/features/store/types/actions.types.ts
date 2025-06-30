/**
 * Action Type Definitions
 * 
 * Detailed action type definitions for Zustand store operations
 * following functional programming patterns and type safety.
 */

import type { ASTNode } from '@holistic-stack/openscad-parser';
import type * as THREE from 'three';
import type { 
  EditorPosition, 
  EditorSelection, 
  CameraConfig, 
  AppConfig, 
  PerformanceMetrics 
} from '../../../shared/types/common.types';
import type { AsyncResult } from '../../../shared/types/result.types';

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
 * Parsing action payload types
 */
export interface ParseCodePayload {
  readonly code: string;
  readonly options?: {
    readonly enableWarnings?: boolean;
    readonly enableOptimizations?: boolean;
  };
}

export interface AddParsingErrorPayload {
  readonly error: string;
  readonly line?: number;
  readonly column?: number;
}

/**
 * Rendering action payload types
 */
export interface UpdateMeshesPayload {
  readonly meshes: ReadonlyArray<THREE.Mesh>;
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
 * Performance action payload types
 */
export interface UpdateMetricsPayload {
  readonly metrics: PerformanceMetrics;
  readonly timestamp?: Date;
}

export interface RecordParseTimePayload {
  readonly duration: number;
  readonly nodeCount?: number;
  readonly codeLength?: number;
}

export interface RecordRenderTimePayload {
  readonly duration: number;
  readonly meshCount?: number;
  readonly triangleCount?: number;
}

export interface AddPerformanceViolationPayload {
  readonly violation: string;
  readonly metric: 'parseTime' | 'renderTime' | 'memoryUsage' | 'frameRate';
  readonly value: number;
  readonly threshold: number;
}

/**
 * Configuration action payload types
 */
export interface UpdateConfigPayload {
  readonly config: Partial<AppConfig>;
  readonly persist?: boolean;
}

/**
 * Async action result types
 */
export type SaveCodeResult = AsyncResult<void, string>;
export type LoadCodeResult = AsyncResult<void, string>;
export type ParseCodeResult = AsyncResult<ReadonlyArray<ASTNode>, string>;
export type RenderFromASTResult = AsyncResult<ReadonlyArray<THREE.Mesh>, string>;

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
  
  // Performance actions
  readonly updateMetrics: (payload: UpdateMetricsPayload) => void;
  readonly recordParseTime: (payload: RecordParseTimePayload) => void;
  readonly recordRenderTime: (payload: RecordRenderTimePayload) => void;
  readonly addPerformanceViolation: (payload: AddPerformanceViolationPayload) => void;
  
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
