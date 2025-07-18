/**
 * @file Optimized Mesh Generator Service
 *
 * Service that integrates performance optimization (LOD) with the existing mesh generation pipeline.
 * Automatically applies LOD optimization to complex meshes based on configurable thresholds.
 *
 * @example
 * ```typescript
 * const generator = new OptimizedMeshGeneratorService(scene);
 * await generator.initialize();
 *
 * const result = await generator.generateOptimizedMesh(astNode, {
 *   enableLOD: true,
 *   complexityThreshold: 1000,
 *   lodQuality: 'medium'
 * });
 * ```
 */

import { type AbstractMesh, Mesh, type Scene } from '@babylonjs/core';
import { createLogger } from '../../../../shared/services/logger.service';
import type { Result } from '../../../../shared/types/result.types';
import { tryCatchAsync } from '../../../../shared/utils/functional/result';
import type { ASTNode, CubeNode, SphereNode, CylinderNode } from '../../../openscad-parser/ast/ast-types';
import type { GenericMeshData } from '../../types/generic-mesh-data.types';
import { CSGOperationsService } from '../csg-operations';
import {
  type LODConfig,
  type LODQuality,
  type PerformanceMetrics,
  PerformanceOptimizationService,
} from '../performance-optimization';
import { PrimitiveShapeGeneratorService } from '../primitive-shape-generator';
import { TransformationOperationsService } from '../transformation-operations';

const logger = createLogger('OptimizedMeshGenerator');

/**
 * Optimization configuration
 */
export interface OptimizationConfig {
  readonly enableLOD: boolean;
  readonly complexityThreshold: number;
  readonly lodQuality: LODQuality;
  readonly lodDistances: readonly number[];
  readonly lodReductionFactors: readonly number[];
  readonly enableCulling: boolean;
  readonly autoOptimize: boolean;
}

/**
 * Mesh generation options
 */
export interface OptimizedMeshGenerationOptions {
  readonly optimization?: Partial<OptimizationConfig>;
  readonly preserveMaterials?: boolean;
  readonly enableCaching?: boolean;
}

/**
 * Optimized mesh generation result
 */
export interface OptimizedMeshResult {
  readonly mesh: AbstractMesh;
  readonly originalComplexity: number;
  readonly optimizedComplexity: number;
  readonly lodApplied: boolean;
  readonly generationTime: number;
  readonly optimizationTime: number;
  readonly performanceGain: number;
}

/**
 * Error codes for optimized mesh generation
 */
export enum OptimizedMeshGenerationErrorCode {
  INITIALIZATION_FAILED = 'INITIALIZATION_FAILED',
  MESH_GENERATION_FAILED = 'MESH_GENERATION_FAILED',
  OPTIMIZATION_FAILED = 'OPTIMIZATION_FAILED',
  INVALID_AST_NODE = 'INVALID_AST_NODE',
  SERVICE_NOT_READY = 'SERVICE_NOT_READY',
}

/**
 * Optimized mesh generation error
 */
export class OptimizedMeshGenerationError extends Error {
  constructor(
    public readonly code: OptimizedMeshGenerationErrorCode,
    message: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'OptimizedMeshGenerationError';
  }
}

/**
 * Default optimization configuration
 */
const DEFAULT_OPTIMIZATION_CONFIG: OptimizationConfig = {
  enableLOD: true,
  complexityThreshold: 1000, // Apply LOD for meshes with >1000 triangles
  lodQuality: 'medium',
  lodDistances: [10, 50, 100],
  lodReductionFactors: [1.0, 0.7, 0.4],
  enableCulling: true,
  autoOptimize: true,
};

/**
 * Optimized Mesh Generator Service
 *
 * Integrates performance optimization with existing mesh generation pipeline.
 * Automatically applies LOD optimization based on mesh complexity and configuration.
 */
export class OptimizedMeshGeneratorService {
  private readonly scene: Scene;
  private primitiveGenerator: PrimitiveShapeGeneratorService | null = null;
  private csgOperations: CSGOperationsService | null = null;
  private transformationOperations: TransformationOperationsService | null = null;
  private performanceOptimization: PerformanceOptimizationService | null = null;
  private isInitialized = false;
  private config: OptimizationConfig;

  constructor(scene: Scene, config: Partial<OptimizationConfig> = {}) {
    this.scene = scene;
    this.config = { ...DEFAULT_OPTIMIZATION_CONFIG, ...config };
    logger.init('[INIT] Optimized mesh generator service initialized');
  }

  /**
   * Initialize the service and all dependencies
   */
  async initialize(): Promise<Result<void, OptimizedMeshGenerationError>> {
    return tryCatchAsync(
      async () => {
        // Initialize primitive generator (no initialize method needed)
        this.primitiveGenerator = new PrimitiveShapeGeneratorService(this.scene);

        // Initialize CSG operations (no initialize method needed)
        this.csgOperations = new CSGOperationsService(this.scene);

        // Initialize transformation operations (no initialize method needed)
        this.transformationOperations = new TransformationOperationsService();

        // Initialize performance optimization
        this.performanceOptimization = new PerformanceOptimizationService(this.scene);
        const perfResult = await this.performanceOptimization.initialize();
        if (!perfResult.success) {
          throw new Error(
            `Performance optimization initialization failed: ${perfResult.error.message}`
          );
        }

        this.isInitialized = true;
        logger.debug('[INIT] All services initialized successfully');
      },
      (error) =>
        this.createError(
          OptimizedMeshGenerationErrorCode.INITIALIZATION_FAILED,
          `Failed to initialize optimized mesh generator: ${error instanceof Error ? error.message : String(error)}`,
          { error }
        )
    );
  }

  /**
   * Generate optimized mesh from AST node
   */
  async generateOptimizedMesh(
    astNode: ASTNode,
    options: OptimizedMeshGenerationOptions = {}
  ): Promise<Result<OptimizedMeshResult, OptimizedMeshGenerationError>> {
    if (!this.isInitialized) {
      return {
        success: false,
        error: this.createError(
          OptimizedMeshGenerationErrorCode.SERVICE_NOT_READY,
          'Service not initialized. Call initialize() first.'
        ),
      };
    }

    const startTime = performance.now();
    const optimizationConfig = { ...this.config, ...options.optimization };

    return tryCatchAsync(
      async () => {
        logger.debug(`[GENERATE] Generating optimized mesh for ${astNode.type} node`);

        // Step 1: Generate base mesh using appropriate service
        const baseMeshResult = await this.generateBaseMesh(astNode, options);
        if (!baseMeshResult.success) {
          throw new Error(`Base mesh generation failed: ${baseMeshResult.error}`);
        }

        const baseMesh = baseMeshResult.data;
        const originalComplexity = this.calculateMeshComplexity(baseMesh);
        const generationTime = performance.now() - startTime;

        // Step 2: Apply optimization if needed
        let optimizedMesh = baseMesh;
        let lodApplied = false;
        let optimizationTime = 0;

        if (
          optimizationConfig.enableLOD &&
          this.shouldApplyOptimization(originalComplexity, optimizationConfig)
        ) {
          const optimizationStartTime = performance.now();
          const optimizationResult = await this.applyOptimization(baseMesh, optimizationConfig);

          if (optimizationResult.success) {
            optimizedMesh = optimizationResult.data;
            lodApplied = true;
            optimizationTime = performance.now() - optimizationStartTime;
            logger.debug(
              `[OPTIMIZE] LOD applied to ${astNode.type} mesh in ${optimizationTime.toFixed(2)}ms`
            );
          } else {
            logger.warn(
              `[OPTIMIZE] Failed to apply LOD to ${astNode.type}: ${optimizationResult.error.message}`
            );
          }
        }

        const optimizedComplexity = this.calculateMeshComplexity(optimizedMesh);
        const performanceGain =
          originalComplexity > 0
            ? (originalComplexity - optimizedComplexity) / originalComplexity
            : 0;

        const result: OptimizedMeshResult = {
          mesh: optimizedMesh,
          originalComplexity,
          optimizedComplexity,
          lodApplied,
          generationTime,
          optimizationTime,
          performanceGain,
        };

        logger.debug(
          `[GENERATE] Optimized mesh generated for ${astNode.type}. ` +
            `Complexity: ${originalComplexity} → ${optimizedComplexity} ` +
            `(${(performanceGain * 100).toFixed(1)}% reduction)`
        );

        return result;
      },
      (error) =>
        this.createError(
          OptimizedMeshGenerationErrorCode.MESH_GENERATION_FAILED,
          `Failed to generate optimized mesh: ${error instanceof Error ? error.message : String(error)}`,
          { astNodeType: astNode?.type || 'unknown', error }
        )
    );
  }

  /**
   * Generate base mesh using appropriate service
   */
  private async generateBaseMesh(
    astNode: ASTNode,
    _options: OptimizedMeshGenerationOptions
  ): Promise<Result<AbstractMesh, string>> {
    if (!this.primitiveGenerator) {
      return { success: false, error: 'Primitive generator not initialized' };
    }

    // For now, handle primitive types
    // TODO: Extend to handle all AST node types
    switch (astNode.type) {
      case 'cube': {
        const cubeNode = astNode as CubeNode;

        // Validate cube parameters
        if (cubeNode.size === null || cubeNode.size === undefined) {
          return { success: false, error: 'Invalid cube size parameter' };
        }

        const params = {
          size: cubeNode.size || [1, 1, 1],
          center: cubeNode.center || false,
        };
        const cubeResult = await this.primitiveGenerator.generateCube(params);
        if (cubeResult.success) {
          return { success: true, data: await this.convertGenericMeshToBabylon(cubeResult.data) };
        }
        return { success: false, error: cubeResult.error.message };
      }

      case 'sphere': {
        const sphereNode = astNode as SphereNode;
        const params = {
          r: sphereNode.radius || sphereNode.r || 1,
          fn: sphereNode.fn || sphereNode.$fn || 16,
        };
        const sphereResult = await this.primitiveGenerator.generateSphere(params);
        if (sphereResult.success) {
          return { success: true, data: await this.convertGenericMeshToBabylon(sphereResult.data) };
        }
        return { success: false, error: sphereResult.error.message };
      }

      case 'cylinder': {
        const cylinderNode = astNode as CylinderNode;
        const params = {
          height: cylinderNode.h || 1,
          radius: cylinderNode.r || 1,
          center: cylinderNode.center || false,
          fn: cylinderNode.fn || cylinderNode.$fn || 16,
        };
        const cylinderResult = await this.primitiveGenerator.generateCylinder(params);
        if (cylinderResult.success) {
          return {
            success: true,
            data: await this.convertGenericMeshToBabylon(cylinderResult.data),
          };
        }
        return { success: false, error: cylinderResult.error.message };
      }

      default:
        return { success: false, error: `Unsupported AST node type: ${astNode.type}` };
    }
  }

  /**
   * Convert GenericMeshData to BabylonJS mesh
   */
  private async convertGenericMeshToBabylon(_genericMesh: GenericMeshData): Promise<AbstractMesh> {
    // TODO: Implement proper conversion from GenericMeshData to BabylonJS mesh
    // For now, create a placeholder mesh
    const { MeshBuilder } = await import('@babylonjs/core');
    return MeshBuilder.CreateBox(`converted_${Date.now()}`, { size: 1 }, this.scene);
  }

  /**
   * Calculate mesh complexity (triangle count)
   */
  private calculateMeshComplexity(mesh: AbstractMesh): number {
    if (mesh instanceof Mesh && mesh.geometry) {
      const indices = mesh.getIndices();
      return indices ? indices.length / 3 : 0;
    }
    return 0;
  }

  /**
   * Determine if optimization should be applied
   */
  private shouldApplyOptimization(complexity: number, config: OptimizationConfig): boolean {
    return config.autoOptimize && complexity > config.complexityThreshold;
  }

  /**
   * Apply LOD optimization to mesh
   */
  private async applyOptimization(
    mesh: AbstractMesh,
    config: OptimizationConfig
  ): Promise<Result<AbstractMesh, OptimizedMeshGenerationError>> {
    if (!this.performanceOptimization || !(mesh instanceof Mesh)) {
      return {
        success: false,
        error: this.createError(
          OptimizedMeshGenerationErrorCode.OPTIMIZATION_FAILED,
          'Performance optimization service not available or invalid mesh type'
        ),
      };
    }

    const lodConfig: LODConfig = {
      distances: config.lodDistances,
      reductionFactors: config.lodReductionFactors,
      enableCulling: config.enableCulling,
      quality: config.lodQuality,
    };

    const result = await this.performanceOptimization.setupLOD(mesh, lodConfig);
    if (result.success) {
      return { success: true, data: result.data.originalMesh };
    }

    return {
      success: false,
      error: this.createError(
        OptimizedMeshGenerationErrorCode.OPTIMIZATION_FAILED,
        `LOD setup failed: ${result.error.message}`
      ),
    };
  }

  /**
   * Get current performance metrics
   */
  getPerformanceMetrics(): PerformanceMetrics | null {
    return this.performanceOptimization?.getPerformanceMetrics() || null;
  }

  /**
   * Update optimization configuration
   */
  updateConfig(config: Partial<OptimizationConfig>): void {
    this.config = { ...this.config, ...config };
    logger.debug('[CONFIG] Optimization configuration updated');
  }

  /**
   * Dispose the service
   */
  dispose(): void {
    // PrimitiveShapeGeneratorService has no dispose method
    this.primitiveGenerator = null;

    // CSGOperationsService has no dispose method
    this.csgOperations = null;

    // TransformationOperationsService has no dispose method
    this.transformationOperations = null;

    // PerformanceOptimizationService has dispose method
    this.performanceOptimization?.dispose();
    this.performanceOptimization = null;

    this.isInitialized = false;
    logger.debug('[DISPOSE] Optimized mesh generator service disposed');
  }

  /**
   * Create an optimized mesh generation error
   */
  private createError(
    code: OptimizedMeshGenerationErrorCode,
    message: string,
    details?: Record<string, unknown>
  ): OptimizedMeshGenerationError {
    return new OptimizedMeshGenerationError(code, message, details);
  }
}
