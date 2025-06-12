/**
 * @file Pipeline type definitions for React components
 * 
 * Type definitions for the OpenSCAD to Babylon.js pipeline testing interface.
 * Follows functional programming patterns with Result types for error handling.
 */
import type { ASTNode as _ASTNode } from '@holistic-stack/openscad-parser';
import type { Scene, Mesh, Nullable, FloatArray, IndicesArray } from '@babylonjs/core';

/**
 * Geometry data extracted from a mesh for cross-scene transfer
 */
export interface MeshGeometryData {
  readonly name: string;
  readonly positions: Nullable<FloatArray>;
  readonly normals: Nullable<FloatArray>;
  readonly indices: Nullable<IndicesArray>;
  readonly uvs: Nullable<FloatArray>;
  readonly materialData: {
    readonly diffuseColor: readonly [number, number, number];
    readonly specularColor: readonly [number, number, number];
    readonly emissiveColor: readonly [number, number, number];
  } | null;
}

/**
 * Result type for pipeline operations following functional programming patterns
 * Updated to support geometry data transfer instead of direct mesh transfer
 */
export type PipelineResult<T = MeshGeometryData | Mesh | Scene | null, E = string> =
  | { readonly success: true; readonly value: T; readonly metadata?: PipelineMetadata }
  | { readonly success: false; readonly error: E; readonly details?: unknown };

/**
 * Pipeline execution metadata for monitoring and debugging
 */
export interface PipelineMetadata {
  readonly parseTimeMs: number;
  readonly visitTimeMs: number;
  readonly totalTimeMs: number;
  readonly nodeCount: number;
  readonly meshCount: number;
}

/**
 * Pipeline stage information for progress tracking
 */
export interface PipelineStage {
  readonly name: string;
  readonly status: 'pending' | 'processing' | 'completed' | 'error';
  readonly message?: string;
  readonly duration?: number;
}

/**
 * Complete pipeline execution state
 */
export interface PipelineState {
  readonly stages: readonly PipelineStage[];
  readonly currentStage: number;
  readonly isProcessing: boolean;
  readonly error?: string;
}

/**
 * OpenSCAD input validation result
 */
export type OpenSCADValidationResult = 
  | { readonly valid: true }
  | { readonly valid: false; readonly errors: readonly string[] };

/**
 * Babylon.js scene configuration
 */
export interface SceneConfig {
  readonly enableCamera: boolean;
  readonly enableLighting: boolean;
  readonly backgroundColor: string;
  readonly cameraPosition?: readonly [number, number, number];
}

/**
 * Component props for error display
 */
export interface ErrorDisplayProps {
  readonly error: string;
  readonly onClear: () => void;
  readonly details?: unknown;
}

/**
 * Component props for OpenSCAD input
 */
export interface OpenSCADInputProps {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly disabled?: boolean;
  readonly onValidate?: (result: OpenSCADValidationResult) => void;
}

/**
 * Component props for pipeline processor
 */
export interface PipelineProcessorProps {
  readonly openscadCode: string;
  readonly onResult: (result: PipelineResult) => void;
  readonly onProcessingStart: () => void;
  readonly disabled?: boolean;
  readonly onStageChange?: (stages: readonly PipelineStage[]) => void;
}

/**
 * Component props for Babylon renderer
 */
export interface BabylonRendererProps {
  readonly pipelineResult: PipelineResult | null;
  readonly isProcessing: boolean;
  readonly sceneConfig?: SceneConfig;
}

/**
 * Helper function to create successful pipeline result
 */
export function createPipelineSuccess<T>(value: T, metadata?: PipelineMetadata): PipelineResult<T> {
  return metadata 
    ? Object.freeze({ success: true, value, metadata })
    : Object.freeze({ success: true, value });
}

/**
 * Helper function to create failed pipeline result
 */
export function createPipelineFailure<T>(error: string, details?: unknown): PipelineResult<T> {
  return Object.freeze({ success: false, error, details });
}
