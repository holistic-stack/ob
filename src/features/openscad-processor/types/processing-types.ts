/**
 * @file Processing Types
 * 
 * Feature-specific types for OpenSCAD processing.
 * Following bulletproof-react architecture patterns.
 * 
 * @author Luciano Júnior
 * @date June 2025
 */

import type { PipelineResult } from '../../openscad-pipeline/core/pipeline-processor';
import type { GeneratedMesh } from '../../r3f-generator/types/r3f-generator-types';

/**
 * Processing statistics - immutable data structure
 */
export interface ProcessingStats {
  readonly totalRuns: number;
  readonly successCount: number;
  readonly errorCount: number;
  readonly averageTime: number;
}

/**
 * Mesh data structure for Babylon.js integration
 */
export interface ProcessedMesh {
  readonly name: string;
  readonly positions: Float32Array | null;
  readonly normals: Float32Array | null;
  readonly indices: Uint16Array | null;
  readonly uvs: Float32Array | null;
  readonly materialData: {
    readonly diffuseColor: readonly [number, number, number];
    readonly specularColor: readonly [number, number, number];
    readonly emissiveColor: readonly [number, number, number];
  } | null;
}

/**
 * Pipeline configuration options
 */
export interface PipelineConfig {
  readonly enableLogging: boolean;
  readonly enableMetrics: boolean;
  readonly csg2Timeout: number;
}

/**
 * Pipeline initialization result
 */
export interface PipelineInitializationResult {
  readonly success: boolean;
  readonly error?: string;
  readonly pipeline?: any; // Will be typed properly when we extract the pipeline service
}

/**
 * Main hook state interface
 */
export interface OpenSCADProcessorState {
  readonly isInitializing: boolean;
  readonly isReady: boolean;
  readonly isProcessing: boolean;
  readonly error: string | null;
  readonly result: PipelineResult | null;
  readonly meshes: readonly ProcessedMesh[];
  readonly stats: ProcessingStats;
  readonly processCode: (code: string) => Promise<void>;
  readonly reset: () => void;
}

/**
 * Processing operation context
 */
export interface ProcessingContext {
  readonly code: string;
  readonly abortController: AbortController;
  readonly startTime: number;
}
