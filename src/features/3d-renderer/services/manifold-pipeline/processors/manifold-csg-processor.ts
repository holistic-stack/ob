/**
 * @file Manifold CSG Processor
 * @description Processor for CSG operations using Manifold native API exclusively
 * Follows SRP by focusing solely on CSG operations (union, difference, intersection)
 */

import type { ASTNode, UnionNode, DifferenceNode, IntersectionNode } from '../../../../openscad-parser/core/ast-types';
import { BasePipelineProcessor } from '../base/pipeline-processor';
import { ManifoldWasmLoader } from '../../manifold-wasm-loader/manifold-wasm-loader';
import type { Result } from '../../../../../shared/types/result.types';
import type { 
  ManifoldPrimitive, 
  CSGOperationResult,
  ValidationResult,
  ProcessingContext 
} from '../types/processor-types';
import { createManagedResource } from '../../manifold-memory-manager/manifold-memory-manager';

/**
 * CSG input containing node and primitives for operation
 */
interface CSGInput {
  readonly node: ASTNode;
  readonly primitives: readonly ManifoldPrimitive[];
}

/**
 * Processor for CSG operations using Manifold native API
 * Implements SRP by focusing solely on CSG operations
 */
export class ManifoldCSGProcessor extends BasePipelineProcessor<CSGInput, CSGOperationResult> {
  readonly name = 'ManifoldCSGProcessor';
  readonly version = '1.0.0';

  private manifoldModule: any = null;
  private wasmLoader: ManifoldWasmLoader;

  constructor() {
    super();
    this.wasmLoader = new ManifoldWasmLoader();
  }

  /**
   * Initialize the processor by loading Manifold WASM module
   */
  protected async initializeInternal(): Promise<Result<void, string>> {
    try {
      this.logger.debug('[INIT] Loading Manifold WASM module');
      
      const loadResult = await this.wasmLoader.load();
      if (!loadResult.success) {
        return { success: false, error: `Failed to load Manifold WASM: ${loadResult.error}` };
      }

      this.manifoldModule = loadResult.data;
      this.logger.debug('[INIT] Manifold WASM module loaded successfully');
      
      return { success: true, data: undefined };
    } catch (error) {
      return { 
        success: false, 
        error: `Manifold WASM initialization failed: ${error instanceof Error ? error.message : String(error)}` 
      };
    }
  }

  /**
   * Process a CSG operation node with primitives
   */
  async processCSGOperation(
    node: ASTNode, 
    primitives: readonly ManifoldPrimitive[]
  ): Promise<Result<CSGOperationResult, string>> {
    return this.process({ node, primitives });
  }

  /**
   * Process CSG input
   */
  protected async processInternal(input: CSGInput): Promise<Result<CSGOperationResult, string>> {
    if (!this.isInitialized || !this.manifoldModule) {
      return { success: false, error: 'ManifoldCSGProcessor not initialized. Call initialize() first.' };
    }

    const { node, primitives } = input;
    const startTime = performance.now();

    try {
      // Validate input
      const validationResult = this.validateInput(node, primitives);
      if (!validationResult.isValid) {
        return { success: false, error: `Validation failed: ${validationResult.errors.join(', ')}` };
      }

      // Perform CSG operation based on node type
      let operationResult: Result<ManifoldPrimitive, string>;
      
      switch (node.type) {
        case 'union':
          operationResult = await this.performUnion(node as UnionNode, primitives);
          break;
        case 'difference':
          operationResult = await this.performDifference(node as DifferenceNode, primitives);
          break;
        case 'intersection':
          operationResult = await this.performIntersection(node as IntersectionNode, primitives);
          break;
        default:
          return { success: false, error: `Unsupported CSG operation type: ${node.type}` };
      }

      if (!operationResult.success) {
        return operationResult;
      }

      const processingTime = performance.now() - startTime;

      const result: CSGOperationResult = {
        resultPrimitive: operationResult.data,
        operationType: node.type as 'union' | 'difference' | 'intersection',
        inputCount: primitives.length,
        processingTime,
        manifoldness: true // Manifold guarantees manifoldness
      };

      this.logger.debug(`[SUCCESS] Performed ${node.type} CSG operation`, { 
        inputCount: primitives.length, 
        processingTime 
      });
      
      return { success: true, data: result };
    } catch (error) {
      const errorMessage = `Failed to perform CSG operation for ${node.type}: ${error instanceof Error ? error.message : String(error)}`;
      this.logger.error(`[ERROR] ${errorMessage}`);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Perform union operation using Manifold native API
   */
  private async performUnion(
    node: UnionNode, 
    primitives: readonly ManifoldPrimitive[]
  ): Promise<Result<ManifoldPrimitive, string>> {
    try {
      if (primitives.length === 0) {
        return { success: false, error: 'Union operation requires at least 1 primitive' };
      }

      if (primitives.length === 1) {
        // Single primitive - return as is
        return { success: true, data: primitives[0] };
      }

      // Start with first primitive and union with all others
      let result = primitives[0].manifoldObject;
      
      for (let i = 1; i < primitives.length; i++) {
        result = result.add(primitives[i].manifoldObject);
      }

      // Track resource for cleanup
      this.trackResource(result);
      
      // Register with memory manager
      const managedResourceResult = createManagedResource(result);
      if (managedResourceResult.success) {
        this.logger.debug(`[TRACK] Registered union result with memory manager`);
      }

      // Update bounding box
      const newBoundingBox = result.boundingBox();

      const resultPrimitive: ManifoldPrimitive = {
        type: 'union',
        manifoldObject: result,
        parameters: { 
          operationType: 'union',
          inputTypes: primitives.map(p => p.type),
          inputCount: primitives.length
        },
        boundingBox: newBoundingBox,
        metadata: {
          creationTime: Date.now(),
          processingTime: performance.now() - Date.now(),
          nodeId: `union-${primitives.length}-primitives`
        }
      };

      this.logger.debug('[UNION] Performed union operation', { inputCount: primitives.length });
      
      return { success: true, data: resultPrimitive };
    } catch (error) {
      return { 
        success: false, 
        error: `Manifold union failed: ${error instanceof Error ? error.message : String(error)}` 
      };
    }
  }

  /**
   * Perform difference operation using Manifold native API
   */
  private async performDifference(
    node: DifferenceNode, 
    primitives: readonly ManifoldPrimitive[]
  ): Promise<Result<ManifoldPrimitive, string>> {
    try {
      if (primitives.length < 2) {
        return { success: false, error: 'Difference operation requires at least 2 primitives' };
      }

      // Start with first primitive and subtract all others
      let result = primitives[0].manifoldObject;
      
      for (let i = 1; i < primitives.length; i++) {
        result = result.subtract(primitives[i].manifoldObject);
      }

      // Track resource for cleanup
      this.trackResource(result);
      
      // Register with memory manager
      const managedResourceResult = createManagedResource(result);
      if (managedResourceResult.success) {
        this.logger.debug(`[TRACK] Registered difference result with memory manager`);
      }

      // Update bounding box
      const newBoundingBox = result.boundingBox();

      const resultPrimitive: ManifoldPrimitive = {
        type: 'difference',
        manifoldObject: result,
        parameters: { 
          operationType: 'difference',
          inputTypes: primitives.map(p => p.type),
          inputCount: primitives.length,
          baseType: primitives[0].type,
          subtractorTypes: primitives.slice(1).map(p => p.type)
        },
        boundingBox: newBoundingBox,
        metadata: {
          creationTime: Date.now(),
          processingTime: performance.now() - Date.now(),
          nodeId: `difference-${primitives.length}-primitives`
        }
      };

      this.logger.debug('[DIFFERENCE] Performed difference operation', { inputCount: primitives.length });
      
      return { success: true, data: resultPrimitive };
    } catch (error) {
      return { 
        success: false, 
        error: `Manifold difference failed: ${error instanceof Error ? error.message : String(error)}` 
      };
    }
  }

  /**
   * Perform intersection operation using Manifold native API
   */
  private async performIntersection(
    node: IntersectionNode, 
    primitives: readonly ManifoldPrimitive[]
  ): Promise<Result<ManifoldPrimitive, string>> {
    try {
      if (primitives.length < 2) {
        return { success: false, error: 'Intersection operation requires at least 2 primitives' };
      }

      // Start with first primitive and intersect with all others
      let result = primitives[0].manifoldObject;
      
      for (let i = 1; i < primitives.length; i++) {
        result = result.intersect(primitives[i].manifoldObject);
      }

      // Track resource for cleanup
      this.trackResource(result);
      
      // Register with memory manager
      const managedResourceResult = createManagedResource(result);
      if (managedResourceResult.success) {
        this.logger.debug(`[TRACK] Registered intersection result with memory manager`);
      }

      // Update bounding box
      const newBoundingBox = result.boundingBox();

      const resultPrimitive: ManifoldPrimitive = {
        type: 'intersection',
        manifoldObject: result,
        parameters: { 
          operationType: 'intersection',
          inputTypes: primitives.map(p => p.type),
          inputCount: primitives.length
        },
        boundingBox: newBoundingBox,
        metadata: {
          creationTime: Date.now(),
          processingTime: performance.now() - Date.now(),
          nodeId: `intersection-${primitives.length}-primitives`
        }
      };

      this.logger.debug('[INTERSECTION] Performed intersection operation', { inputCount: primitives.length });
      
      return { success: true, data: resultPrimitive };
    } catch (error) {
      return { 
        success: false, 
        error: `Manifold intersection failed: ${error instanceof Error ? error.message : String(error)}` 
      };
    }
  }

  /**
   * Validate CSG input
   */
  private validateInput(node: ASTNode, primitives: readonly ManifoldPrimitive[]): ValidationResult {
    const errors: string[] = [];
    
    if (!node || typeof node.type !== 'string') {
      errors.push('Invalid node: missing or invalid type');
    }
    
    if (!['union', 'difference', 'intersection'].includes(node.type)) {
      errors.push(`Unsupported CSG operation type: ${node.type}`);
    }

    if (!primitives || primitives.length === 0) {
      errors.push('No primitives provided for CSG operation');
    }

    // Validate that all primitives have valid manifold objects
    if (primitives.some(p => !p.manifoldObject || typeof p.manifoldObject.add !== 'function')) {
      errors.push('All primitives must have valid Manifold objects');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings: [],
    };
  }
}
