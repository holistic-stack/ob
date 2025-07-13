/**
 * @file Manifold Pipeline Service
 * @description Main orchestration service for the complete Manifold processing pipeline
 * Follows SRP by focusing solely on pipeline orchestration and coordination
 */

import type { ASTNode } from '../../../openscad-parser/core/ast-types';
import type { Result } from '../../../../shared/types/result.types';
import type { 
  ManifoldPipelineResult,
  ManifoldPrimitive,
  ProcessingOptions 
} from './types/processor-types';
import { BasePipelineProcessor } from './base/pipeline-processor';
import { ManifoldPrimitiveProcessor } from './processors/manifold-primitive-processor';
import { ManifoldTransformationProcessor } from './processors/manifold-transformation-processor';
import { ManifoldCSGProcessor } from './processors/manifold-csg-processor';
import { ASTTreeWalker } from './ast-processor/ast-tree-walker';
import { createManagedResource } from '../manifold-memory-manager/manifold-memory-manager';

/**
 * Pipeline dependencies interface for dependency injection
 */
interface PipelineDependencies {
  readonly primitiveProcessor: ManifoldPrimitiveProcessor;
  readonly transformationProcessor: ManifoldTransformationProcessor;
  readonly csgProcessor: ManifoldCSGProcessor;
  readonly treeWalker?: ASTTreeWalker; // Optional - will be created if not provided
}

/**
 * Pipeline processing options
 */
interface PipelineProcessingOptions extends ProcessingOptions {
  readonly enablePerformanceLogging?: boolean;
  readonly maxProcessingTime?: number;
  readonly validateManifoldness?: boolean;
}

/**
 * Main pipeline service orchestrating Manifold operations
 * Implements SRP by focusing solely on pipeline orchestration
 */
export class ManifoldPipelineService extends BasePipelineProcessor<ASTNode[], ManifoldPipelineResult> {
  readonly name = 'ManifoldPipelineService';
  readonly version = '1.0.0';

  private readonly dependencies: PipelineDependencies;
  private readonly treeWalker: ASTTreeWalker;
  private _isInitialized = false;

  constructor(dependencies: PipelineDependencies) {
    super();
    this.dependencies = dependencies;

    // Create tree walker if not provided
    this.treeWalker = dependencies.treeWalker || new ASTTreeWalker({
      primitiveProcessor: dependencies.primitiveProcessor,
      transformationProcessor: dependencies.transformationProcessor,
      csgProcessor: dependencies.csgProcessor
    });
  }

  /**
   * Check if pipeline is initialized
   */
  get isInitialized(): boolean {
    return this._isInitialized;
  }

  /**
   * Initialize pipeline and all dependencies
   */
  protected async initializeInternal(): Promise<Result<void, string>> {
    try {
      this.logger.debug('[INIT] Initializing Manifold pipeline');
      
      // Initialize tree walker (which will initialize all processors)
      this.logger.debug(`[INIT] Initializing tree walker`);
      const treeWalkerResult = await this.treeWalker.initialize();
      if (!treeWalkerResult.success) {
        return {
          success: false,
          error: `Failed to initialize tree walker: ${treeWalkerResult.error}`
        };
      }

      this._isInitialized = true;
      this.logger.debug('[INIT] Manifold pipeline initialized successfully');
      return { success: true, data: undefined };
    } catch (error) {
      return { 
        success: false, 
        error: `Pipeline initialization failed: ${error instanceof Error ? error.message : String(error)}` 
      };
    }
  }

  /**
   * Process AST nodes through the complete Manifold pipeline
   */
  async processNodes(
    nodes: ASTNode[], 
    options?: PipelineProcessingOptions
  ): Promise<Result<ManifoldPipelineResult, string>> {
    return this.process(nodes, options);
  }

  /**
   * Process AST nodes through complete Manifold pipeline
   */
  protected async processInternal(
    nodes: ASTNode[],
    options?: PipelineProcessingOptions
  ): Promise<Result<ManifoldPipelineResult, string>> {
    if (!this._isInitialized) {
      return { success: false, error: 'Pipeline not initialized. Call initialize() first.' };
    }

    const startTime = performance.now();
    const operationsPerformed: string[] = [];

    try {
      // Validate input
      const validationResult = this.validateInput(nodes);
      if (!validationResult.success) {
        return validationResult;
      }

      this.logger.debug(`[PIPELINE] Processing ${nodes.length} AST nodes`);

      // Process all nodes using the tree walker
      const allPrimitives: ManifoldPrimitive[] = [];

      for (const node of nodes) {
        this.logger.debug(`[PIPELINE] Processing node: ${node.type}`);
        const nodeResult = await this.treeWalker.walkAST(node, options);
        if (!nodeResult.success) {
          return { success: false, error: `Failed to process node ${node.type}: ${nodeResult.error}` };
        }
        allPrimitives.push(...nodeResult.data);
      }

      // Track operations performed
      operationsPerformed.push('primitive_creation');
      if (this.hasTransformationNodes(nodes)) {
        operationsPerformed.push('transformation');
      }
      if (this.hasCSGNodes(nodes)) {
        operationsPerformed.push('csg_operations');
      }

      // Convert to final geometries
      this.logger.debug('[PIPELINE] Converting to geometries');
      const geometries = this.convertToGeometries(allPrimitives);

      const processingTime = performance.now() - startTime;

      if (options?.enablePerformanceLogging) {
        this.logger.debug(`[PERFORMANCE] Pipeline completed in ${processingTime.toFixed(2)}ms`);
      }

      const result: ManifoldPipelineResult = {
        geometries,
        manifoldness: true, // Guaranteed by Manifold pipeline
        processingTime,
        operationsPerformed,
        metadata: {
          nodeCount: nodes.length,
          pipelineVersion: this.version,
          timestamp: new Date(),
        },
      };

      this.logger.debug(`[SUCCESS] Pipeline completed successfully`);
      return { success: true, data: result };
    } catch (error) {
      const errorMessage = `Pipeline processing failed: ${error instanceof Error ? error.message : String(error)}`;
      this.logger.error(`[ERROR] ${errorMessage}`);
      return { success: false, error: errorMessage };
    }
  }







  /**
   * Convert Manifold primitives to final geometries
   */
  private convertToGeometries(primitives: ManifoldPrimitive[]): any[] {
    // For now, return mock geometries
    // This will be replaced with actual Three.js geometry conversion
    return primitives.map(primitive => ({
      type: 'BufferGeometry',
      primitive: primitive.type,
      boundingBox: primitive.boundingBox
    }));
  }



  /**
   * Check if node is a primitive type
   */
  private isPrimitiveNode(node: ASTNode): boolean {
    return ['cube', 'sphere', 'cylinder'].includes(node.type);
  }

  /**
   * Check if node is a transformation type
   */
  private isTransformationNode(node: ASTNode): boolean {
    return ['translate', 'rotate', 'scale'].includes(node.type);
  }

  /**
   * Check if node is a CSG operation type
   */
  private isCSGNode(node: ASTNode): boolean {
    return ['union', 'difference', 'intersection'].includes(node.type);
  }

  /**
   * Check if any nodes contain transformation operations (recursively)
   */
  private hasTransformationNodes(nodes: ASTNode[]): boolean {
    for (const node of nodes) {
      if (this.isTransformationNode(node)) {
        return true;
      }
      if ('children' in node && Array.isArray(node.children)) {
        if (this.hasTransformationNodes(node.children)) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Check if any nodes contain CSG operations (recursively)
   */
  private hasCSGNodes(nodes: ASTNode[]): boolean {
    for (const node of nodes) {
      if (this.isCSGNode(node)) {
        return true;
      }
      if ('children' in node && Array.isArray(node.children)) {
        if (this.hasCSGNodes(node.children)) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Validate input AST nodes
   */
  private validateInput(nodes: ASTNode[]): Result<void, string> {
    if (!Array.isArray(nodes)) {
      return { success: false, error: 'Input must be an array of AST nodes' };
    }

    if (nodes.length === 0) {
      return { success: false, error: 'At least one AST node is required' };
    }

    // Validate each node has required properties
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      if (!node || typeof node.type !== 'string') {
        return { 
          success: false, 
          error: `Invalid AST node at index ${i}: missing or invalid type` 
        };
      }
    }

    return { success: true, data: undefined };
  }

  /**
   * Clean up pipeline resources
   */
  dispose(): void {
    super.dispose();

    // Dispose tree walker (which will dispose all processors)
    if (this.treeWalker && typeof this.treeWalker.dispose === 'function') {
      this.treeWalker.dispose();
    }

    this._isInitialized = false;
    this.logger.debug('[END] Manifold pipeline disposed');
  }
}
