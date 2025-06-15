/**
 * @file State Types - Discriminated Unions for State Management
 * 
 * Comprehensive state management types using discriminated unions
 * for type-safe state transitions and exhaustive checking.
 * 
 * Features:
 * - Discriminated unions for all async operations
 * - Type-safe state transitions
 * - Exhaustive checking with TypeScript
 * - Error state management
 * - Loading state patterns
 * 
 * @author Luciano Júnior
 * @date June 2025
 */

import type { 
  EngineId, 
  SceneId, 
  MeshId, 
  MaterialId,
  ParseSessionId,
  Milliseconds 
} from './branded-types';

// ============================================================================
// Core Async State Patterns
// ============================================================================

/**
 * Generic async state with discriminated union
 */
export type AsyncState<T, E = string> =
  | { readonly status: 'idle' }
  | { readonly status: 'loading'; readonly startTime: Milliseconds }
  | { readonly status: 'success'; readonly data: T; readonly completedAt: Milliseconds }
  | { readonly status: 'error'; readonly error: E; readonly failedAt: Milliseconds };

/**
 * Resource state with additional metadata
 */
export type ResourceState<T, E = string> =
  | { readonly status: 'uninitialized' }
  | { readonly status: 'initializing'; readonly progress?: number }
  | { readonly status: 'ready'; readonly data: T; readonly lastUpdated: Milliseconds }
  | { readonly status: 'updating'; readonly currentData: T; readonly progress?: number }
  | { readonly status: 'error'; readonly error: E; readonly retryCount: number }
  | { readonly status: 'disposed' };

/**
 * Operation state for long-running processes
 */
export type OperationState<T, E = string> =
  | { readonly status: 'pending' }
  | { readonly status: 'running'; readonly progress: number; readonly stage: string }
  | { readonly status: 'completed'; readonly result: T; readonly duration: Milliseconds }
  | { readonly status: 'failed'; readonly error: E; readonly stage: string }
  | { readonly status: 'cancelled'; readonly reason: string };

// ============================================================================
// Engine State Management
// ============================================================================

/**
 * Babylon.js engine state with lifecycle management
 */
export type EngineState =
  | { 
      readonly status: 'uninitialized';
    }
  | { 
      readonly status: 'initializing';
      readonly engineId: EngineId;
      readonly config: unknown;
    }
  | { 
      readonly status: 'ready';
      readonly engineId: EngineId;
      readonly engine: unknown; // BABYLON.Engine
      readonly capabilities: EngineCapabilities;
      readonly createdAt: Milliseconds;
    }
  | { 
      readonly status: 'error';
      readonly engineId?: EngineId;
      readonly error: EngineError;
      readonly retryCount: number;
    }
  | { 
      readonly status: 'disposing';
      readonly engineId: EngineId;
    }
  | { 
      readonly status: 'disposed';
      readonly engineId: EngineId;
      readonly disposedAt: Milliseconds;
    };

/**
 * Engine capabilities information
 */
export interface EngineCapabilities {
  readonly webGLVersion: string;
  readonly maxTextureSize: number;
  readonly maxVertexTextureImageUnits: number;
  readonly maxFragmentTextureImageUnits: number;
  readonly supportsInstancedArrays: boolean;
  readonly supportsVertexArrayObjects: boolean;
  readonly supportsFloatTextures: boolean;
}

/**
 * Engine error types
 */
export type EngineError =
  | { readonly type: 'initialization_failed'; readonly message: string; readonly cause?: Error }
  | { readonly type: 'webgl_not_supported'; readonly message: string }
  | { readonly type: 'context_lost'; readonly message: string }
  | { readonly type: 'disposal_failed'; readonly message: string; readonly cause?: Error }
  | { readonly type: 'unknown'; readonly message: string; readonly cause?: Error };

// ============================================================================
// Scene State Management
// ============================================================================

/**
 * Babylon.js scene state with comprehensive lifecycle
 */
export type SceneState =
  | { 
      readonly status: 'uninitialized';
    }
  | { 
      readonly status: 'creating';
      readonly sceneId: SceneId;
      readonly engineId: EngineId;
      readonly config: unknown;
    }
  | { 
      readonly status: 'ready';
      readonly sceneId: SceneId;
      readonly engineId: EngineId;
      readonly scene: unknown; // BABYLON.Scene
      readonly metadata: SceneMetadata;
      readonly createdAt: Milliseconds;
    }
  | { 
      readonly status: 'updating';
      readonly sceneId: SceneId;
      readonly scene: unknown;
      readonly updateType: SceneUpdateType;
    }
  | { 
      readonly status: 'error';
      readonly sceneId?: SceneId;
      readonly engineId?: EngineId;
      readonly error: SceneError;
    }
  | { 
      readonly status: 'disposing';
      readonly sceneId: SceneId;
    }
  | { 
      readonly status: 'disposed';
      readonly sceneId: SceneId;
      readonly disposedAt: Milliseconds;
    };

/**
 * Scene metadata information
 */
export interface SceneMetadata {
  readonly meshCount: number;
  readonly lightCount: number;
  readonly cameraCount: number;
  readonly materialCount: number;
  readonly textureCount: number;
  readonly renderTargetCount: number;
  readonly lastRenderTime: Milliseconds;
  readonly frameRate: number;
}

/**
 * Scene update types
 */
export type SceneUpdateType =
  | 'mesh_added'
  | 'mesh_removed'
  | 'mesh_updated'
  | 'material_changed'
  | 'lighting_changed'
  | 'camera_moved'
  | 'background_changed';

/**
 * Scene error types
 */
export type SceneError =
  | { readonly type: 'creation_failed'; readonly message: string; readonly cause?: Error }
  | { readonly type: 'engine_not_ready'; readonly message: string }
  | { readonly type: 'update_failed'; readonly message: string; readonly updateType: SceneUpdateType }
  | { readonly type: 'disposal_failed'; readonly message: string; readonly cause?: Error }
  | { readonly type: 'unknown'; readonly message: string; readonly cause?: Error };

// ============================================================================
// Mesh State Management
// ============================================================================

/**
 * Mesh state with geometry and material tracking
 */
export type MeshState =
  | { 
      readonly status: 'uninitialized';
    }
  | { 
      readonly status: 'creating';
      readonly meshId: MeshId;
      readonly sceneId: SceneId;
      readonly geometryData: unknown;
    }
  | { 
      readonly status: 'ready';
      readonly meshId: MeshId;
      readonly sceneId: SceneId;
      readonly mesh: unknown; // BABYLON.Mesh
      readonly geometry: MeshGeometry;
      readonly material?: MaterialId;
      readonly createdAt: Milliseconds;
    }
  | { 
      readonly status: 'updating';
      readonly meshId: MeshId;
      readonly mesh: unknown;
      readonly updateType: MeshUpdateType;
      readonly progress?: number;
    }
  | { 
      readonly status: 'error';
      readonly meshId?: MeshId;
      readonly sceneId?: SceneId;
      readonly error: MeshError;
    }
  | { 
      readonly status: 'disposing';
      readonly meshId: MeshId;
    }
  | { 
      readonly status: 'disposed';
      readonly meshId: MeshId;
      readonly disposedAt: Milliseconds;
    };

/**
 * Mesh geometry information
 */
export interface MeshGeometry {
  readonly vertexCount: number;
  readonly indexCount: number;
  readonly triangleCount: number;
  readonly hasNormals: boolean;
  readonly hasUVs: boolean;
  readonly hasColors: boolean;
  readonly boundingBox: BoundingBox;
}

/**
 * Bounding box information
 */
export interface BoundingBox {
  readonly min: readonly [number, number, number];
  readonly max: readonly [number, number, number];
  readonly center: readonly [number, number, number];
  readonly size: readonly [number, number, number];
}

/**
 * Mesh update types
 */
export type MeshUpdateType =
  | 'geometry_changed'
  | 'material_changed'
  | 'position_changed'
  | 'rotation_changed'
  | 'scale_changed'
  | 'visibility_changed'
  | 'properties_changed';

/**
 * Mesh error types
 */
export type MeshError =
  | { readonly type: 'creation_failed'; readonly message: string; readonly cause?: Error }
  | { readonly type: 'invalid_geometry'; readonly message: string; readonly details: string[] }
  | { readonly type: 'scene_not_ready'; readonly message: string }
  | { readonly type: 'update_failed'; readonly message: string; readonly updateType: MeshUpdateType }
  | { readonly type: 'disposal_failed'; readonly message: string; readonly cause?: Error }
  | { readonly type: 'unknown'; readonly message: string; readonly cause?: Error };

// ============================================================================
// OpenSCAD Pipeline State
// ============================================================================

/**
 * OpenSCAD parsing state
 */
export type ParseState =
  | { 
      readonly status: 'idle';
    }
  | { 
      readonly status: 'parsing';
      readonly sessionId: ParseSessionId;
      readonly source: string;
      readonly progress: number;
      readonly stage: ParseStage;
    }
  | { 
      readonly status: 'success';
      readonly sessionId: ParseSessionId;
      readonly ast: unknown; // AST data
      readonly duration: Milliseconds;
      readonly nodeCount: number;
    }
  | { 
      readonly status: 'error';
      readonly sessionId?: ParseSessionId;
      readonly error: ParseError;
      readonly source?: string;
    };

/**
 * Parse stages
 */
export type ParseStage =
  | 'lexical_analysis'
  | 'syntax_analysis'
  | 'semantic_analysis'
  | 'ast_generation'
  | 'validation';

/**
 * Parse error types
 */
export type ParseError =
  | { readonly type: 'syntax_error'; readonly message: string; readonly line: number; readonly column: number }
  | { readonly type: 'semantic_error'; readonly message: string; readonly context: string }
  | { readonly type: 'validation_error'; readonly message: string; readonly violations: string[] }
  | { readonly type: 'timeout'; readonly message: string; readonly duration: Milliseconds }
  | { readonly type: 'unknown'; readonly message: string; readonly cause?: Error };

/**
 * CSG operation state
 */
export type CSGState =
  | { 
      readonly status: 'idle';
    }
  | { 
      readonly status: 'processing';
      readonly operationId: string;
      readonly operation: CSGOperation;
      readonly progress: number;
    }
  | { 
      readonly status: 'success';
      readonly operationId: string;
      readonly result: unknown; // CSG result
      readonly duration: Milliseconds;
    }
  | { 
      readonly status: 'error';
      readonly operationId?: string;
      readonly error: CSGError;
    };

/**
 * CSG operation types
 */
export type CSGOperation =
  | 'union'
  | 'intersection'
  | 'difference'
  | 'hull'
  | 'minkowski'
  | 'extrude'
  | 'revolve';

/**
 * CSG error types
 */
export type CSGError =
  | { readonly type: 'invalid_geometry'; readonly message: string }
  | { readonly type: 'operation_failed'; readonly message: string; readonly operation: CSGOperation }
  | { readonly type: 'memory_limit'; readonly message: string }
  | { readonly type: 'timeout'; readonly message: string; readonly duration: Milliseconds }
  | { readonly type: 'unknown'; readonly message: string; readonly cause?: Error };

// ============================================================================
// Application State
// ============================================================================

/**
 * Overall application state
 */
export interface ApplicationState {
  readonly engine: EngineState;
  readonly scene: SceneState;
  readonly meshes: Record<string, MeshState>;
  readonly parsing: ParseState;
  readonly csg: CSGState;
  readonly ui: UIState;
}

/**
 * UI state management
 */
export type UIState =
  | { 
      readonly status: 'initializing';
    }
  | { 
      readonly status: 'ready';
      readonly activeView: ViewType;
      readonly sidebarOpen: boolean;
      readonly debugPanelOpen: boolean;
      readonly theme: ThemeType;
    }
  | { 
      readonly status: 'error';
      readonly error: string;
    };

/**
 * View types
 */
export type ViewType =
  | '3d_renderer'
  | 'ui_components'
  | 'code_editor'
  | 'debug_panel';

/**
 * Theme types
 */
export type ThemeType =
  | 'light'
  | 'dark'
  | 'auto';

// ============================================================================
// State Transition Helpers
// ============================================================================

/**
 * Extract the status from any state type
 */
export type StateStatus<T> = T extends { readonly status: infer S } ? S : never;

/**
 * Extract the data from a success state
 */
export type StateData<T> = T extends { readonly status: 'success'; readonly data: infer D } 
  ? D 
  : T extends { readonly status: 'ready'; readonly data: infer D }
  ? D
  : never;

/**
 * Extract the error from an error state
 */
export type StateError<T> = T extends { readonly status: 'error'; readonly error: infer E } 
  ? E 
  : never;

/**
 * Check if state is in a loading/processing state
 */
export type IsLoadingState<T> = T extends 
  | { readonly status: 'loading' }
  | { readonly status: 'initializing' }
  | { readonly status: 'creating' }
  | { readonly status: 'updating' }
  | { readonly status: 'processing' }
  | { readonly status: 'running' }
  | { readonly status: 'parsing' }
  ? true 
  : false;

/**
 * Check if state is in a success/ready state
 */
export type IsSuccessState<T> = T extends 
  | { readonly status: 'success' }
  | { readonly status: 'ready' }
  | { readonly status: 'completed' }
  ? true 
  : false;

/**
 * Check if state is in an error state
 */
export type IsErrorState<T> = T extends 
  | { readonly status: 'error' }
  | { readonly status: 'failed' }
  ? true 
  : false;

// ============================================================================
// Export All Types
// ============================================================================

export type {
  AsyncState,
  ResourceState,
  OperationState,
  EngineState,
  EngineCapabilities,
  EngineError,
  SceneState,
  SceneMetadata,
  SceneUpdateType,
  SceneError,
  MeshState,
  MeshGeometry,
  BoundingBox,
  MeshUpdateType,
  MeshError,
  ParseState,
  ParseStage,
  ParseError,
  CSGState,
  CSGOperation,
  CSGError,
  ApplicationState,
  UIState,
  ViewType,
  ThemeType,
  StateStatus,
  StateData,
  StateError,
  IsLoadingState,
  IsSuccessState,
  IsErrorState,
};
