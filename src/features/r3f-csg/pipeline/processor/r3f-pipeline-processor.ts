/**
 * @file R3F Pipeline Processor
 * 
 * React Three Fiber pipeline processor that orchestrates the complete
 * OpenSCAD → AST → CSG → R3F workflow, integrating all services and
 * providing real-time processing capabilities.
 * 
 * Features:
 * - Complete pipeline orchestration from OpenSCAD code to R3F scene
 * - Real-time processing with progress tracking
 * - Comprehensive error handling and recovery
 * - Performance monitoring and optimization
 * - Resource management and cleanup
 * - Caching and incremental updates
 * 
 * @author OpenSCAD-R3F Pipeline
 * @version 1.0.0
 */

import * as THREE from 'three';
// Note: Using mock parser for now - will be replaced with actual parser integration
import type { ASTNode } from '@holistic-stack/openscad-parser';
import { createR3FASTVisitor } from '../../openscad/ast-visitor/r3f-ast-visitor';
import { createR3FSceneFactory } from '../../services/scene-factory/r3f-scene-factory';
import type {
  Result,
  R3FASTVisitorConfig as _R3FASTVisitorConfig,
  ProcessingMetrics,
  ProcessingProgress,
  ASTProcessingResult,
  R3FPipelineConfig,
  SceneFactoryConfig as _SceneFactoryConfig
} from '../../types/r3f-csg-types';

// ============================================================================
// Pipeline Configuration
// ============================================================================

/**
 * Pipeline processing result
 */
export type PipelineResult = Result<
  {
    scene: THREE.Scene;
    camera?: THREE.Camera;
    meshes: THREE.Mesh[];
    metrics: ProcessingMetrics;
  },
  string
>;

/**
 * Pipeline processing progress
 */


/**
 * Pipeline processing context
 */
export interface ProcessingContext {
  readonly startTime: number;
  readonly openscadCode: string;
  readonly config: Required<R3FPipelineConfig>;
  readonly onProgress?: (progress: ProcessingProgress) => void;
  readonly onError?: (error: string, stage: string) => void;
}

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_PIPELINE_CONFIG: Required<R3FPipelineConfig> = {
  astVisitorConfig: {
    enableCSG: true,
    enableCaching: true,
    enableOptimization: true,
    maxRecursionDepth: 20,
    defaultMaterial: { type: 'standard', color: 0xffffff },
    geometryPrecision: 0.001,
    enableLogging: true
  },
  sceneFactoryConfig: {
    enableLighting: true,
    enableShadows: true,
    enableFog: false,
    enableGrid: true,
    enableAxes: true,
    backgroundColor: '#2c3e50',
    ambientLightIntensity: 0.4,
    directionalLightIntensity: 1.0,
    pointLightIntensity: 0.5,
    fogNear: 50,
    fogFar: 200,
    gridSize: 20,
    axesSize: 5,
    enableOptimization: true,
    enableLogging: true
  },
  enableCaching: true,
  enableOptimization: true,
  enableLogging: true,
  processingTimeout: 60000, // 60 seconds
  maxRetries: 3,
  enableProgressTracking: true
} as const;

// ============================================================================
// R3F Pipeline Processor Implementation
// ============================================================================

/**
 * React Three Fiber pipeline processor
 * 
 * Orchestrates the complete OpenSCAD → AST → CSG → R3F workflow,
 * providing real-time processing capabilities with comprehensive
 * error handling and performance monitoring.
 */
export class R3FPipelineProcessor {
  private readonly config: Required<R3FPipelineConfig>;
  private readonly processingCache = new Map<string, PipelineResult>();
  private readonly disposables: Set<THREE.Object3D> = new Set();

  constructor(config: R3FPipelineConfig = {}) {
    console.log('[INIT] Creating R3F Pipeline Processor');
    
    this.config = { ...DEFAULT_PIPELINE_CONFIG, ...config };

    if (this.config.enableLogging) {
      console.log('[DEBUG] R3F Pipeline Processor configuration:', this.config);
    }
  }

  /**
   * Process OpenSCAD code through the complete pipeline
   */
  public async processOpenSCAD(
    openscadCode: string,
    onProgress?: (progress: ProcessingProgress) => void,
    onError?: (error: string, stage: string) => void
  ): Promise<PipelineResult> {
    const startTime = performance.now();
    
    if (this.config.enableLogging) {
      console.log('[DEBUG] Starting OpenSCAD pipeline processing');
    }

    // Create processing context
    const context: ProcessingContext = {
      startTime,
      openscadCode,
      config: this.config,
      ...(onProgress && { onProgress }),
      ...(onError && { onError })
    };

    try {
      // Check cache if enabled
      if (this.config.enableCaching) {
        const cacheKey = this.generateCacheKey(openscadCode);
        const cachedResult = this.processingCache.get(cacheKey);
        if (cachedResult) {
          if (this.config.enableLogging) {
            console.log('[DEBUG] Cache hit for OpenSCAD processing');
          }
          this.reportProgress(context, 'complete', 100, 'Retrieved from cache');
          return cachedResult;
        }
      }

      // Stage 1: Parse OpenSCAD code to AST
      this.reportProgress(context, 'parsing', 10, 'Parsing OpenSCAD code...');
      const astResult = await this.parseOpenSCAD(openscadCode, context);
      if (!astResult.success) {
        return astResult;
      }

      // Stage 2: Process AST to meshes
      this.reportProgress(context, 'ast-processing', 30, 'Processing AST nodes...');
      const meshResult = await this.processAST(astResult.data, context);
      if (!meshResult.success) {
        return meshResult;
      }

      // Stage 3: Generate scene from meshes
      this.reportProgress(context, 'scene-generation', 70, 'Generating 3D scene...');
      const sceneResult = await this.generateScene(meshResult.data, context);
      if (!sceneResult.success) {
        return sceneResult;
      }

      // Stage 4: Optimization (if enabled)
      if (this.config.enableOptimization) {
        this.reportProgress(context, 'optimization', 90, 'Optimizing scene...');
        await this.optimizeResult(sceneResult.data, context);
      }

      // Complete processing
      const processingTime = performance.now() - startTime;
      const metrics: ProcessingMetrics = {
        totalNodes: 0, // Will be updated by AST visitor
        processedNodes: meshResult.data.length,
        failedNodes: 0,
        processingTime,
        memoryUsage: this.estimateMemoryUsage(sceneResult.data.scene),
        cacheHits: 0,
        cacheMisses: 1
      };

      const result: PipelineResult = {
        success: true,
        data: {
          scene: sceneResult.data.scene,
          ...(sceneResult.data.camera && { camera: sceneResult.data.camera }),
          meshes: meshResult.data,
          metrics
        }
      };

      // Cache result if enabled
      if (this.config.enableCaching) {
        const cacheKey = this.generateCacheKey(openscadCode);
        this.processingCache.set(cacheKey, result);
      }

      // Track for disposal
      this.disposables.add(sceneResult.data.scene);

      this.reportProgress(context, 'complete', 100, `Processing complete in ${processingTime.toFixed(2)}ms`);

      if (this.config.enableLogging) {
        console.log('[DEBUG] OpenSCAD pipeline processing completed successfully');
      }

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown pipeline error';
      const processingTime = performance.now() - startTime;
      
      if (this.config.enableLogging) {
        console.error('[ERROR] Pipeline processing failed:', errorMessage);
      }

      if (onError) {
        onError(errorMessage, 'pipeline');
      }

      return { 
        success: false, 
        error: `Pipeline processing failed after ${processingTime.toFixed(2)}ms: ${errorMessage}` 
      };
    }
  }

  /**
   * Process OpenSCAD code with retry logic
   */
  public async processWithRetry(
    openscadCode: string,
    onProgress?: (progress: ProcessingProgress) => void,
    onError?: (error: string, stage: string) => void
  ): Promise<PipelineResult> {
    let lastError = '';
    const maxRetries = this.config.maxRetries ?? 3;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      if (this.config.enableLogging) {
        console.log(`[DEBUG] Processing attempt ${attempt}/${maxRetries}`);
      }

      try {
        const result = await this.processOpenSCAD(openscadCode, onProgress, onError);

        if (result.success) {
          return result;
        }

        lastError = result.error;

        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt - 1) * 1000; // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Unknown retry error';

        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt - 1) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    return {
      success: false,
      error: `Processing failed after ${maxRetries} attempts. Last error: ${lastError}`,
    };
  }

  /**
   * Clear processing cache
   */
  public clearCache(): void {
    if (this.config.enableLogging) {
      console.log('[DEBUG] Clearing pipeline processing cache');
    }

    this.processingCache.clear();
  }

  /**
   * Get cache statistics
   */
  public getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.processingCache.size,
      keys: Array.from(this.processingCache.keys())
    };
  }

  /**
   * Dispose all resources
   */
  public dispose(): void {
    if (this.config.enableLogging) {
      console.log('[DEBUG] Disposing R3F Pipeline Processor');
    }

    // Dispose tracked scenes
    this.disposables.forEach(object => {
      if (object instanceof THREE.Scene) {
        object.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            if (child.geometry) {
              child.geometry.dispose();
            }
            if (child.material) {
              if (Array.isArray(child.material)) {
                child.material.forEach(material => material.dispose());
              } else {
                child.material.dispose();
              }
            }
          }
        });
        object.clear();
      }
    });

    // Clear caches
    this.clearCache();
    this.disposables.clear();

    if (this.config.enableLogging) {
      console.log('[DEBUG] R3F Pipeline Processor disposed successfully');
    }
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private async parseOpenSCAD(
    openscadCode: string,
    context: ProcessingContext
  ): Promise<Result<ASTNode, string>> {
    try {
      if (this.config.enableLogging) {
        console.log('[DEBUG] Parsing OpenSCAD code');
      }

      // Parse OpenSCAD code to AST (mock implementation for now)
      const ast: ASTNode = {
        type: 'cube',
        size: [1, 1, 1],
        location: { start: { line: 1, column: 1, offset: 0 }, end: { line: 1, column: 10, offset: 10 } }
      };

      if (!ast) {
        const error = 'Failed to parse OpenSCAD code';
        if (context.onError) {
          context.onError(error, 'parsing');
        }
        return { success: false, error };
      }

      if (this.config.enableLogging) {
        console.log('[DEBUG] OpenSCAD parsing completed successfully');
      }

      return { success: true, data: ast };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown parsing error';
      if (this.config.enableLogging) {
        console.error('[ERROR] OpenSCAD parsing failed:', errorMessage);
      }
      
      if (context.onError) {
        context.onError(errorMessage, 'parsing');
      }
      
      return { success: false, error: `Parsing failed: ${errorMessage}` };
    }
  }

  private async processAST(
    ast: ASTNode,
    context: ProcessingContext
  ): Promise<ASTProcessingResult> {
    try {
      if (this.config.enableLogging) {
        console.log('[DEBUG] Processing AST with R3F visitor');
      }

      // Create AST visitor
      const visitor = createR3FASTVisitor(this.config.astVisitorConfig);

      try {
        // Process AST node
        const result = visitor.visit(ast);
        
        if (!result.success) {
          return { success: false, error: result.error };
        }

        // Return array of meshes
        const meshes = [result.data];

        if (this.config.enableLogging) {
          console.log('[DEBUG] AST processing completed, generated', meshes.length, 'meshes');
        }

        return { success: true, data: meshes };

      } finally {
        // Always dispose visitor
        visitor.dispose();
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown AST processing error';
      if (this.config.enableLogging) {
        console.error('[ERROR] AST processing failed:', errorMessage);
      }
      
      if (context.onError) {
        context.onError(errorMessage, 'ast-processing');
      }
      
      return { success: false, error: `AST processing failed: ${errorMessage}` };
    }
  }

  private async generateScene(
    meshes: THREE.Mesh[],
    context: ProcessingContext
  ): Promise<Result<{scene: THREE.Scene, camera?: THREE.Camera}, string>> {
    try {
      if (this.config.enableLogging) {
        console.log('[DEBUG] Generating scene from', meshes.length, 'meshes');
      }

      // Create scene factory
      const sceneFactory = createR3FSceneFactory(this.config.sceneFactoryConfig);

      try {
        // Generate scene with camera
        const result = sceneFactory.createSceneWithCamera(meshes);
        
        if (!result.success) {
          return result;
        }

        if (this.config.enableLogging) {
          console.log('[DEBUG] Scene generation completed successfully');
        }

        return result;

      } finally {
        // Scene factory doesn't need explicit disposal as it doesn't hold long-term resources
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown scene generation error';
      if (this.config.enableLogging) {
        console.error('[ERROR] Scene generation failed:', errorMessage);
      }
      
      if (context.onError) {
        context.onError(errorMessage, 'scene-generation');
      }
      
      return { success: false, error: `Scene generation failed: ${errorMessage}` };
    }
  }

  private async optimizeResult(
    sceneData: {scene: THREE.Scene, camera?: THREE.Camera},
    _context: ProcessingContext
  ): Promise<void> {
    try {
      if (this.config.enableLogging) {
        console.log('[DEBUG] Optimizing scene');
      }

      // Optimize scene geometries
      sceneData.scene.traverse((object) => {
        if (object instanceof THREE.Mesh && object.geometry) {
          // Compute normals if not present
          if (!object.geometry.attributes.normal) {
            object.geometry.computeVertexNormals();
          }

          // Compute bounding box and sphere
          object.geometry.computeBoundingBox();
          object.geometry.computeBoundingSphere();
        }
      });

      if (this.config.enableLogging) {
        console.log('[DEBUG] Scene optimization completed');
      }

    } catch (error) {
      if (this.config.enableLogging) {
        console.warn('[WARN] Scene optimization failed:', error);
      }
      // Don't fail the pipeline for optimization errors
    }
  }

  private reportProgress(
    context: ProcessingContext,
    stage: ProcessingProgress['stage'],
    progress: number,
    message: string
  ): void {
    if (!this.config.enableProgressTracking || !context.onProgress) {
      return;
    }

    const timeElapsed = performance.now() - context.startTime;
    const estimatedTimeRemaining = progress > 0 ? (timeElapsed / progress) * (100 - progress) : undefined;

    context.onProgress({
      stage,
      progress,
      message,
      timeElapsed,
      ...(estimatedTimeRemaining !== undefined && { estimatedTimeRemaining })
    });
  }

  private generateCacheKey(openscadCode: string): string {
    // Simple hash function for caching
    let hash = 0;
    for (let i = 0; i < openscadCode.length; i++) {
      const char = openscadCode.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `openscad_${hash.toString(36)}`;
  }

  private estimateMemoryUsage(scene: THREE.Scene): number {
    let memoryEstimate = 0;

    scene.traverse((object) => {
      if (object instanceof THREE.Mesh && object.geometry) {
        const positions = object.geometry.attributes.position;
        if (positions) {
          memoryEstimate += positions.count * 12; // 3 floats * 4 bytes
        }
      }
    });

    return memoryEstimate;
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create a new R3F pipeline processor instance
 */
export function createR3FPipelineProcessor(config?: R3FPipelineConfig): R3FPipelineProcessor {
  return new R3FPipelineProcessor(config);
}

// Default export
export default R3FPipelineProcessor;
