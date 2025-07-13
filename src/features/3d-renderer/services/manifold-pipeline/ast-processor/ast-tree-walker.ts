/**
 * @file AST Tree Walker
 * @description Walks AST trees and applies transformations and CSG operations in correct order
 * Follows SRP by focusing solely on AST traversal and operation orchestration
 */

import type { ASTNode } from '../../../../openscad-parser/core/ast-types';
import { BasePipelineProcessor } from '../base/pipeline-processor';
import type { Result } from '../../../../../shared/types/result.types';
import type { 
  ManifoldPrimitive,
  ProcessingOptions 
} from '../types/processor-types';
import { ManifoldPrimitiveProcessor } from '../processors/manifold-primitive-processor';
import { ManifoldTransformationProcessor } from '../processors/manifold-transformation-processor';
import { ManifoldCSGProcessor } from '../processors/manifold-csg-processor';

/**
 * Tree walker dependencies interface for dependency injection
 */
interface TreeWalkerDependencies {
  readonly primitiveProcessor: ManifoldPrimitiveProcessor;
  readonly transformationProcessor: ManifoldTransformationProcessor;
  readonly csgProcessor: ManifoldCSGProcessor;
}

/**
 * AST tree walker that processes nodes in correct order
 * Implements SRP by focusing solely on AST traversal and operation coordination
 */
export class ASTTreeWalker extends BasePipelineProcessor<ASTNode, ManifoldPrimitive[]> {
  readonly name = 'ASTTreeWalker';
  readonly version = '1.0.0';

  private readonly dependencies: TreeWalkerDependencies;
  private _isInitialized = false;

  constructor(dependencies: TreeWalkerDependencies) {
    super();
    this.dependencies = dependencies;
  }

  /**
   * Check if tree walker is initialized
   */
  get isInitialized(): boolean {
    return this._isInitialized;
  }

  /**
   * Initialize tree walker and all dependencies
   */
  protected async initializeInternal(): Promise<Result<void, string>> {
    try {
      this.logger.debug('[INIT] Initializing AST tree walker');
      
      // Initialize all processors
      const processors = [
        this.dependencies.primitiveProcessor,
        this.dependencies.transformationProcessor,
        this.dependencies.csgProcessor
      ];

      for (const processor of processors) {
        if (!processor.isInitialized) {
          this.logger.debug(`[INIT] Initializing ${processor.name}`);
          const initResult = await processor.initialize();
          if (!initResult.success) {
            return { 
              success: false, 
              error: `Failed to initialize ${processor.name}: ${initResult.error}` 
            };
          }
        }
      }

      this._isInitialized = true;
      this.logger.debug('[INIT] AST tree walker initialized successfully');
      return { success: true, data: undefined };
    } catch (error) {
      return { 
        success: false, 
        error: `Tree walker initialization failed: ${error instanceof Error ? error.message : String(error)}` 
      };
    }
  }

  /**
   * Walk AST tree and process nodes
   */
  async walkAST(
    node: ASTNode, 
    options?: ProcessingOptions
  ): Promise<Result<ManifoldPrimitive[], string>> {
    return this.process(node, options);
  }

  /**
   * Process AST node and its children
   */
  protected async processInternal(
    node: ASTNode,
    options?: ProcessingOptions
  ): Promise<Result<ManifoldPrimitive[], string>> {
    if (!this._isInitialized) {
      return { success: false, error: 'Tree walker not initialized. Call initialize() first.' };
    }

    try {
      this.logger.debug(`[WALK] Processing node type: ${node.type}`);

      // Process based on node type
      if (this.isPrimitiveNode(node)) {
        return this.processPrimitiveNode(node);
      } else if (this.isTransformationNode(node)) {
        return this.processTransformationNode(node);
      } else if (this.isCSGNode(node)) {
        return this.processCSGNode(node);
      } else {
        return { success: false, error: `Unsupported node type: ${node.type}` };
      }
    } catch (error) {
      const errorMessage = `AST processing failed for ${node.type}: ${error instanceof Error ? error.message : String(error)}`;
      this.logger.error(`[ERROR] ${errorMessage}`);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Process primitive node
   */
  private async processPrimitiveNode(node: ASTNode): Promise<Result<ManifoldPrimitive[], string>> {
    const result = await this.dependencies.primitiveProcessor.processNode(node);
    if (!result.success) {
      return { success: false, error: `Primitive processing failed: ${result.error}` };
    }
    return { success: true, data: [result.data] };
  }

  /**
   * Process transformation node
   */
  private async processTransformationNode(node: ASTNode): Promise<Result<ManifoldPrimitive[], string>> {
    // First, process all children
    const childPrimitives: ManifoldPrimitive[] = [];
    
    if ('children' in node && Array.isArray(node.children)) {
      for (const child of node.children) {
        const childResult = await this.walkAST(child);
        if (!childResult.success) {
          return { success: false, error: `Failed to process child node: ${childResult.error}` };
        }
        childPrimitives.push(...childResult.data);
      }
    }

    if (childPrimitives.length === 0) {
      return { success: true, data: [] };
    }

    // Apply transformation to all child primitives
    const transformResult = await this.dependencies.transformationProcessor.processTransformation(node, childPrimitives);
    if (!transformResult.success) {
      return { success: false, error: `Transformation processing failed: ${transformResult.error}` };
    }

    return { success: true, data: transformResult.data.transformedPrimitives };
  }

  /**
   * Process CSG operation node
   */
  private async processCSGNode(node: ASTNode): Promise<Result<ManifoldPrimitive[], string>> {
    // First, process all children
    const childPrimitives: ManifoldPrimitive[] = [];
    
    if ('children' in node && Array.isArray(node.children)) {
      for (const child of node.children) {
        const childResult = await this.walkAST(child);
        if (!childResult.success) {
          return { success: false, error: `Failed to process child node: ${childResult.error}` };
        }
        childPrimitives.push(...childResult.data);
      }
    }

    if (childPrimitives.length === 0) {
      return { success: true, data: [] };
    }

    // Perform CSG operation on child primitives
    const csgResult = await this.dependencies.csgProcessor.processCSGOperation(node, childPrimitives);
    if (!csgResult.success) {
      return { success: false, error: `CSG processing failed: ${csgResult.error}` };
    }

    return { success: true, data: [csgResult.data.resultPrimitive] };
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
   * Clean up tree walker resources
   */
  dispose(): void {
    super.dispose();

    // Dispose all processors
    Object.values(this.dependencies).forEach(processor => {
      if (processor && typeof processor.dispose === 'function') {
        processor.dispose();
      }
    });

    this._isInitialized = false;
    this.logger.debug('[END] AST tree walker disposed');
  }
}
