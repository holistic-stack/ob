/**
 * @file OpenSCAD Pipeline Processor
 * 
 * Unified pipeline that orchestrates the complete flow from OpenSCAD code
 * to React Three Fiber visualization. Integrates AST parsing, CSG processing,
 * and R3F generation with comprehensive error handling and performance monitoring.
 * 
 * @author OpenSCAD-R3F Pipeline
 * @version 1.0.0
 */

import type { ASTNode } from '@holistic-stack/openscad-parser';
import { parseOpenSCADCodeCached, type ParseError } from '../../ui-components/editor/code-editor/openscad-ast-service';
import { processASTToCSGTree, type CSGTree, type CSGError } from '../../csg-processor';
import { generateR3FFromCSGTree, type R3FGenerationResult, type R3FGenerationError } from '../../r3f-generator';
import type * as THREE from 'three';

// ============================================================================
// Pipeline Types
// ============================================================================

/**
 * Result type for functional programming patterns
 */
export type Result<T, E = string> = 
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly error: E };

/**
 * Pipeline stage identifier
 */
export type PipelineStage = 'parsing' | 'csg-processing' | 'r3f-generation' | 'complete';

/**
 * Pipeline progress information
 */
export interface PipelineProgress {
  readonly stage: PipelineStage;
  readonly progress: number; // 0-100
  readonly message: string;
  readonly timeElapsed: number;
  readonly estimatedTimeRemaining?: number;
}

/**
 * Pipeline error with stage context
 */
export interface PipelineError {
  readonly stage: PipelineStage;
  readonly message: string;
  readonly code: string;
  readonly severity: 'error' | 'warning' | 'info';
  readonly sourceError?: ParseError | CSGError | R3FGenerationError;
}

/**
 * Pipeline configuration
 */
export interface PipelineConfig {
  readonly enableLogging?: boolean;
  readonly enableCaching?: boolean;
  readonly enableOptimization?: boolean;
  readonly timeout?: number;
  readonly parsingConfig?: {
    readonly timeout?: number;
    readonly maxRetries?: number;
  };
  readonly csgConfig?: {
    readonly enableValidation?: boolean;
    readonly maxDepth?: number;
    readonly maxNodes?: number;
  };
  readonly r3fConfig?: {
    readonly enableCaching?: boolean;
    readonly materialQuality?: 'low' | 'medium' | 'high';
    readonly enableShadows?: boolean;
  };
}

/**
 * Pipeline metrics
 */
export interface PipelineMetrics {
  readonly totalTime: number;
  readonly parsingTime: number;
  readonly csgProcessingTime: number;
  readonly r3fGenerationTime: number;
  readonly nodeCount: number;
  readonly meshCount: number;
  readonly vertexCount: number;
  readonly triangleCount: number;
  readonly memoryUsage: number;
}

/**
 * Pipeline result containing all generated data
 */
export interface PipelineResult {
  readonly success: boolean;
  readonly ast: readonly ASTNode[] | undefined;
  readonly csgTree: CSGTree | undefined;
  readonly r3fResult: R3FGenerationResult | undefined;
  readonly meshes: readonly THREE.Mesh[];
  readonly scene: THREE.Scene | undefined;
  readonly errors: readonly PipelineError[];
  readonly warnings: readonly PipelineError[];
  readonly metrics: PipelineMetrics;
}

/**
 * Pipeline progress callback
 */
export type ProgressCallback = (progress: PipelineProgress) => void;

/**
 * Pipeline error callback
 */
export type ErrorCallback = (error: PipelineError, stage: PipelineStage) => void;

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_CONFIG: Required<PipelineConfig> = {
  enableLogging: false,
  enableCaching: true,
  enableOptimization: true,
  timeout: 30000, // 30 seconds
  parsingConfig: {
    timeout: 5000,
    maxRetries: 2
  },
  csgConfig: {
    enableValidation: true,
    maxDepth: 50,
    maxNodes: 10000
  },
  r3fConfig: {
    enableCaching: true,
    materialQuality: 'medium',
    enableShadows: true
  }
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Create pipeline error from source error
 */
function createPipelineError(
  stage: PipelineStage,
  message: string,
  code: string,
  severity: 'error' | 'warning' | 'info' = 'error',
  sourceError?: ParseError | CSGError | R3FGenerationError
): PipelineError {
  return {
    stage,
    message,
    code,
    severity,
    ...(sourceError && { sourceError })
  } as PipelineError;
}

/**
 * Convert parse errors to pipeline errors
 */
function convertParseErrors(parseErrors: readonly ParseError[]): readonly PipelineError[] {
  return parseErrors.map(error => createPipelineError(
    'parsing',
    error.message,
    'PARSE_ERROR',
    error.severity,
    error
  ));
}

/**
 * Convert CSG errors to pipeline errors
 */
function convertCSGErrors(csgErrors: readonly CSGError[]): readonly PipelineError[] {
  return csgErrors.map(error => createPipelineError(
    'csg-processing',
    error.message,
    error.code,
    error.severity,
    error
  ));
}

/**
 * Convert R3F errors to pipeline errors
 */
function convertR3FErrors(r3fErrors: readonly R3FGenerationError[]): readonly PipelineError[] {
  return r3fErrors.map(error => createPipelineError(
    'r3f-generation',
    error.message,
    error.code,
    error.severity,
    error
  ));
}

// ============================================================================
// Main Pipeline Function
// ============================================================================

/**
 * Process OpenSCAD code through the complete pipeline
 * 
 * @param code - OpenSCAD source code to process
 * @param config - Pipeline configuration options
 * @param onProgress - Optional progress callback
 * @param onError - Optional error callback
 * @returns Promise resolving to pipeline result
 */
export async function processOpenSCADPipeline(
  code: string,
  config: PipelineConfig = {},
  onProgress?: ProgressCallback,
  onError?: ErrorCallback
): Promise<PipelineResult> {
  const startTime = performance.now();
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const errors: PipelineError[] = [];
  const warnings: PipelineError[] = [];

  if (finalConfig.enableLogging) {
    console.log('[Pipeline] Starting OpenSCAD processing pipeline...');
  }

  // Initialize metrics
  let parsingTime = 0;
  let csgProcessingTime = 0;
  let r3fGenerationTime = 0;
  let ast: readonly ASTNode[] = [];
  let csgTree: CSGTree | undefined;
  let r3fResult: R3FGenerationResult | undefined;

  try {
    // ========================================================================
    // Stage 1: Parse OpenSCAD Code to AST
    // ========================================================================
    
    onProgress?.({
      stage: 'parsing',
      progress: 10,
      message: 'Parsing OpenSCAD code...',
      timeElapsed: performance.now() - startTime
    });

    const parseStartTime = performance.now();
    const parseResult = await parseOpenSCADCodeCached(code, {
      enableLogging: finalConfig.enableLogging,
      ...finalConfig.parsingConfig
    });
    parsingTime = performance.now() - parseStartTime;

    if (!parseResult.success) {
      const parseErrors = convertParseErrors(parseResult.errors);
      errors.push(...parseErrors);
      
      if (onError) {
        parseErrors.forEach(error => onError(error, 'parsing'));
      }

      return {
        success: false,
        ast: undefined,
        csgTree: undefined,
        r3fResult: undefined,
        scene: undefined,
        meshes: [],
        errors,
        warnings,
        metrics: {
          totalTime: performance.now() - startTime,
          parsingTime,
          csgProcessingTime: 0,
          r3fGenerationTime: 0,
          nodeCount: 0,
          meshCount: 0,
          vertexCount: 0,
          triangleCount: 0,
          memoryUsage: 0
        }
      };
    }

    ast = parseResult.ast;

    onProgress?.({
      stage: 'parsing',
      progress: 30,
      message: `Parsed ${ast.length} AST nodes`,
      timeElapsed: performance.now() - startTime
    });

    // ========================================================================
    // Stage 2: Convert AST to CSG Tree
    // ========================================================================

    onProgress?.({
      stage: 'csg-processing',
      progress: 40,
      message: 'Processing CSG operations...',
      timeElapsed: performance.now() - startTime
    });

    const csgStartTime = performance.now();
    const csgResult = processASTToCSGTree(ast, {
      enableLogging: finalConfig.enableLogging,
      enableOptimization: finalConfig.enableOptimization,
      enableValidation: finalConfig.csgConfig.enableValidation,
      maxDepth: finalConfig.csgConfig.maxDepth,
      maxNodes: finalConfig.csgConfig.maxNodes
    });
    csgProcessingTime = performance.now() - csgStartTime;

    if (!csgResult.success) {
      const csgErrors = convertCSGErrors(csgResult.errors);
      errors.push(...csgErrors);
      
      if (onError) {
        csgErrors.forEach(error => onError(error, 'csg-processing'));
      }
    }

    if (csgResult.warnings.length > 0) {
      const csgWarnings = convertCSGErrors(csgResult.warnings);
      warnings.push(...csgWarnings);
    }

    csgTree = csgResult.tree;

    onProgress?.({
      stage: 'csg-processing',
      progress: 60,
      message: `Generated CSG tree with ${csgTree?.metadata.nodeCount ?? 0} nodes`,
      timeElapsed: performance.now() - startTime
    });

    // ========================================================================
    // Stage 3: Generate R3F Components
    // ========================================================================

    if (csgTree) {
      onProgress?.({
        stage: 'r3f-generation',
        progress: 70,
        message: 'Generating 3D meshes...',
        timeElapsed: performance.now() - startTime
      });

      const r3fStartTime = performance.now();
      r3fResult = await generateR3FFromCSGTree(csgTree, {
        enableLogging: finalConfig.enableLogging,
        enableCaching: finalConfig.r3fConfig.enableCaching,
        enableOptimization: finalConfig.enableOptimization,
        materialQuality: finalConfig.r3fConfig.materialQuality,
        enableShadows: finalConfig.r3fConfig.enableShadows
      });
      r3fGenerationTime = performance.now() - r3fStartTime;

      if (!r3fResult.success) {
        const r3fErrors = convertR3FErrors(r3fResult.errors);
        errors.push(...r3fErrors);
        
        if (onError) {
          r3fErrors.forEach(error => onError(error, 'r3f-generation'));
        }
      }

      if (r3fResult.warnings.length > 0) {
        const r3fWarnings = convertR3FErrors(r3fResult.warnings);
        warnings.push(...r3fWarnings);
      }

      onProgress?.({
        stage: 'r3f-generation',
        progress: 90,
        message: `Generated ${r3fResult.meshes.length} meshes`,
        timeElapsed: performance.now() - startTime
      });
    }

    // ========================================================================
    // Stage 4: Complete Pipeline
    // ========================================================================

    const totalTime = performance.now() - startTime;
    const meshes = r3fResult?.meshes.map(gm => gm.mesh) ?? [];
    const scene = r3fResult?.scene;

    onProgress?.({
      stage: 'complete',
      progress: 100,
      message: `Pipeline completed successfully`,
      timeElapsed: totalTime
    });

    if (finalConfig.enableLogging) {
      console.log(`[Pipeline] Processing completed in ${totalTime.toFixed(2)}ms`);
      console.log(`[Pipeline] Generated ${meshes.length} meshes from ${ast.length} AST nodes`);
    }

    return {
      success: errors.filter(e => e.severity === 'error').length === 0,
      ast,
      csgTree,
      r3fResult,
      meshes,
      scene,
      errors,
      warnings,
      metrics: {
        totalTime,
        parsingTime,
        csgProcessingTime,
        r3fGenerationTime,
        nodeCount: ast.length,
        meshCount: meshes.length,
        vertexCount: r3fResult?.metrics.totalVertices ?? 0,
        triangleCount: r3fResult?.metrics.totalTriangles ?? 0,
        memoryUsage: r3fResult?.metrics.memoryUsage ?? 0
      }
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown pipeline error';
    const totalTime = performance.now() - startTime;

    const pipelineError = createPipelineError(
      'complete',
      `Pipeline failed: ${errorMessage}`,
      'PIPELINE_ERROR'
    );

    errors.push(pipelineError);

    if (onError) {
      onError(pipelineError, 'complete');
    }

    return {
      success: false,
      ast: undefined,
      csgTree: undefined,
      r3fResult: undefined,
      scene: undefined,
      meshes: [],
      errors,
      warnings,
      metrics: {
        totalTime,
        parsingTime,
        csgProcessingTime,
        r3fGenerationTime,
        nodeCount: 0,
        meshCount: 0,
        vertexCount: 0,
        triangleCount: 0,
        memoryUsage: 0
      }
    };
  }
}

// ============================================================================
// Default Export
// ============================================================================

export default processOpenSCADPipeline;
