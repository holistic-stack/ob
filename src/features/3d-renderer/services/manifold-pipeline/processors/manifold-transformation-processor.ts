/**
 * @file Manifold Transformation Processor
 * @description Processor for applying transformations using Manifold native API exclusively
 * Follows SRP by focusing solely on transformation operations
 */

import type { ASTNode, TranslateNode, RotateNode, ScaleNode } from '../../../../openscad-parser/core/ast-types';
import { BasePipelineProcessor } from '../base/pipeline-processor';
import { ManifoldWasmLoader } from '../../manifold-wasm-loader/manifold-wasm-loader';
import type { Result } from '../../../../../shared/types/result.types';
import type { 
  ManifoldPrimitive, 
  TransformationResult,
  TransformationMetadata,
  ValidationResult,
  ProcessingContext 
} from '../types/processor-types';
import { createManagedResource } from '../../manifold-memory-manager/manifold-memory-manager';

/**
 * Transformation input containing node and primitives to transform
 */
interface TransformationInput {
  readonly node: ASTNode;
  readonly primitives: readonly ManifoldPrimitive[];
}

/**
 * Processor for applying transformations using Manifold native API
 * Implements SRP by focusing solely on transformation operations
 */
export class ManifoldTransformationProcessor extends BasePipelineProcessor<TransformationInput, TransformationResult> {
  readonly name = 'ManifoldTransformationProcessor';
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
   * Process a transformation node with primitives
   */
  async processTransformation(
    node: ASTNode, 
    primitives: readonly ManifoldPrimitive[]
  ): Promise<Result<TransformationResult, string>> {
    return this.process({ node, primitives });
  }

  /**
   * Process transformation input
   */
  protected async processInternal(input: TransformationInput): Promise<Result<TransformationResult, string>> {
    if (!this.isInitialized || !this.manifoldModule) {
      return { success: false, error: 'ManifoldTransformationProcessor not initialized. Call initialize() first.' };
    }

    const { node, primitives } = input;
    const startTime = performance.now();

    try {
      // Validate input
      const validationResult = this.validateInput(node, primitives);
      if (!validationResult.isValid) {
        return { success: false, error: `Validation failed: ${validationResult.errors.join(', ')}` };
      }

      // Apply transformation based on node type
      let transformationResult: Result<ManifoldPrimitive[], string>;
      
      switch (node.type) {
        case 'translate':
          transformationResult = await this.applyTranslation(node as TranslateNode, primitives);
          break;
        case 'rotate':
          transformationResult = await this.applyRotation(node as RotateNode, primitives);
          break;
        case 'scale':
          transformationResult = await this.applyScale(node as ScaleNode, primitives);
          break;
        default:
          return { success: false, error: `Unsupported transformation type: ${node.type}` };
      }

      if (!transformationResult.success) {
        return transformationResult;
      }

      const processingTime = performance.now() - startTime;

      // Create transformation metadata
      const metadata: TransformationMetadata = {
        usedManifoldNative: true,
        transformationType: node.type,
        transformationParams: this.extractTransformationParams(node),
        processingTime
      };

      const result: TransformationResult = {
        transformedPrimitives: transformationResult.data,
        metadata,
        totalProcessingTime: processingTime
      };

      this.logger.debug(`[SUCCESS] Applied ${node.type} transformation`, { processingTime });
      
      return { success: true, data: result };
    } catch (error) {
      const errorMessage = `Failed to apply transformation for ${node.type}: ${error instanceof Error ? error.message : String(error)}`;
      this.logger.error(`[ERROR] ${errorMessage}`);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Apply translation transformation using Manifold native API
   */
  private async applyTranslation(
    node: TranslateNode, 
    primitives: readonly ManifoldPrimitive[]
  ): Promise<Result<ManifoldPrimitive[], string>> {
    try {
      // Validate translation parameters
      const validation = this.validateTranslationParameters(node);
      if (!validation.isValid) {
        return { success: false, error: `Invalid translation parameters: ${validation.errors.join(', ')}` };
      }

      const translationVector = Array.isArray(node.v) ? node.v : [node.v, 0, 0];
      const transformedPrimitives: ManifoldPrimitive[] = [];

      for (const primitive of primitives) {
        // Apply translation using Manifold native API
        const translatedObject = primitive.manifoldObject.translate(translationVector as [number, number, number]);
        
        // Track resource for cleanup
        this.trackResource(translatedObject);
        
        // Register with memory manager
        const managedResourceResult = createManagedResource(translatedObject);
        if (managedResourceResult.success) {
          this.logger.debug(`[TRACK] Registered translated ${primitive.type} with memory manager`);
        }

        // Update bounding box
        const newBoundingBox = translatedObject.boundingBox();

        const transformedPrimitive: ManifoldPrimitive = {
          type: primitive.type,
          manifoldObject: translatedObject,
          parameters: { ...primitive.parameters, translation: translationVector },
          boundingBox: newBoundingBox,
          metadata: {
            ...primitive.metadata,
            processingTime: performance.now() - primitive.metadata.creationTime
          }
        };

        transformedPrimitives.push(transformedPrimitive);
      }

      this.logger.debug('[TRANSLATE] Applied translation', { vector: translationVector, count: primitives.length });
      
      return { success: true, data: transformedPrimitives };
    } catch (error) {
      return { 
        success: false, 
        error: `Manifold translation failed: ${error instanceof Error ? error.message : String(error)}` 
      };
    }
  }

  /**
   * Apply rotation transformation using Manifold native API
   */
  private async applyRotation(
    node: RotateNode, 
    primitives: readonly ManifoldPrimitive[]
  ): Promise<Result<ManifoldPrimitive[], string>> {
    try {
      // Validate rotation parameters
      const validation = this.validateRotationParameters(node);
      if (!validation.isValid) {
        return { success: false, error: `Invalid rotation parameters: ${validation.errors.join(', ')}` };
      }

      const transformedPrimitives: ManifoldPrimitive[] = [];

      for (const primitive of primitives) {
        let rotatedObject;

        if (typeof node.a === 'number' && node.v) {
          // Rotation around axis
          const axis = Array.isArray(node.v) ? node.v : [node.v, 0, 0];
          rotatedObject = primitive.manifoldObject.rotate(axis as [number, number, number], node.a);
        } else if (Array.isArray(node.a)) {
          // Euler angles rotation - apply each rotation sequentially
          rotatedObject = primitive.manifoldObject;
          if (node.a[0] !== 0) rotatedObject = rotatedObject.rotate([1, 0, 0], node.a[0]);
          if (node.a[1] !== 0) rotatedObject = rotatedObject.rotate([0, 1, 0], node.a[1]);
          if (node.a[2] !== 0) rotatedObject = rotatedObject.rotate([0, 0, 1], node.a[2]);
        } else {
          // Single angle around Z-axis
          const angle = typeof node.a === 'number' ? node.a : 0;
          rotatedObject = primitive.manifoldObject.rotate([0, 0, 1], angle);
        }
        
        // Track resource for cleanup
        this.trackResource(rotatedObject);
        
        // Register with memory manager
        const managedResourceResult = createManagedResource(rotatedObject);
        if (managedResourceResult.success) {
          this.logger.debug(`[TRACK] Registered rotated ${primitive.type} with memory manager`);
        }

        // Update bounding box
        const newBoundingBox = rotatedObject.boundingBox();

        const transformedPrimitive: ManifoldPrimitive = {
          type: primitive.type,
          manifoldObject: rotatedObject,
          parameters: { ...primitive.parameters, rotation: node.a, rotationAxis: node.v },
          boundingBox: newBoundingBox,
          metadata: {
            ...primitive.metadata,
            processingTime: performance.now() - primitive.metadata.creationTime
          }
        };

        transformedPrimitives.push(transformedPrimitive);
      }

      this.logger.debug('[ROTATE] Applied rotation', { angle: node.a, axis: node.v, count: primitives.length });
      
      return { success: true, data: transformedPrimitives };
    } catch (error) {
      return { 
        success: false, 
        error: `Manifold rotation failed: ${error instanceof Error ? error.message : String(error)}` 
      };
    }
  }

  /**
   * Apply scale transformation using Manifold native API
   */
  private async applyScale(
    node: ScaleNode, 
    primitives: readonly ManifoldPrimitive[]
  ): Promise<Result<ManifoldPrimitive[], string>> {
    try {
      // Validate scale parameters
      const validation = this.validateScaleParameters(node);
      if (!validation.isValid) {
        return { success: false, error: `Invalid scale parameters: ${validation.errors.join(', ')}` };
      }

      const scaleVector = typeof node.v === 'number' ? [node.v, node.v, node.v] : node.v;
      const transformedPrimitives: ManifoldPrimitive[] = [];

      for (const primitive of primitives) {
        // Apply scale using Manifold native API
        const scaledObject = primitive.manifoldObject.scale(scaleVector as [number, number, number]);
        
        // Track resource for cleanup
        this.trackResource(scaledObject);
        
        // Register with memory manager
        const managedResourceResult = createManagedResource(scaledObject);
        if (managedResourceResult.success) {
          this.logger.debug(`[TRACK] Registered scaled ${primitive.type} with memory manager`);
        }

        // Update bounding box
        const newBoundingBox = scaledObject.boundingBox();

        const transformedPrimitive: ManifoldPrimitive = {
          type: primitive.type,
          manifoldObject: scaledObject,
          parameters: { ...primitive.parameters, scale: scaleVector },
          boundingBox: newBoundingBox,
          metadata: {
            ...primitive.metadata,
            processingTime: performance.now() - primitive.metadata.creationTime
          }
        };

        transformedPrimitives.push(transformedPrimitive);
      }

      this.logger.debug('[SCALE] Applied scale', { vector: scaleVector, count: primitives.length });
      
      return { success: true, data: transformedPrimitives };
    } catch (error) {
      return { 
        success: false, 
        error: `Manifold scale failed: ${error instanceof Error ? error.message : String(error)}` 
      };
    }
  }

  /**
   * Validate transformation input
   */
  private validateInput(node: ASTNode, primitives: readonly ManifoldPrimitive[]): ValidationResult {
    const errors: string[] = [];
    
    if (!node || typeof node.type !== 'string') {
      errors.push('Invalid node: missing or invalid type');
    }
    
    if (!['translate', 'rotate', 'scale'].includes(node.type)) {
      errors.push(`Unsupported transformation type: ${node.type}`);
    }

    if (!primitives || primitives.length === 0) {
      errors.push('No primitives provided for transformation');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings: [],
    };
  }

  /**
   * Validate translation parameters
   */
  private validateTranslationParameters(node: TranslateNode): ValidationResult {
    const errors: string[] = [];
    
    if (node.v === undefined) {
      errors.push('Translation vector (v) is required');
    } else if (Array.isArray(node.v)) {
      if (node.v.length === 0 || node.v.length > 3) {
        errors.push('Translation vector must have 1-3 elements');
      }
      if (node.v.some(val => typeof val !== 'number' || !isFinite(val))) {
        errors.push('All translation values must be finite numbers');
      }
    } else if (typeof node.v !== 'number' || !isFinite(node.v)) {
      errors.push('Translation value must be a finite number');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings: [],
    };
  }

  /**
   * Validate rotation parameters
   */
  private validateRotationParameters(node: RotateNode): ValidationResult {
    const errors: string[] = [];
    
    if (node.a === undefined) {
      errors.push('Rotation angle (a) is required');
    } else if (Array.isArray(node.a)) {
      if (node.a.length !== 3) {
        errors.push('Rotation angle array must have exactly 3 elements');
      }
      if (node.a.some(val => typeof val !== 'number' || !isFinite(val))) {
        errors.push('All rotation angles must be finite numbers');
      }
    } else if (typeof node.a !== 'number' || !isFinite(node.a)) {
      errors.push('Rotation angle must be a finite number');
    }

    if (node.v !== undefined) {
      if (Array.isArray(node.v)) {
        if (node.v.length !== 3) {
          errors.push('Rotation axis must have exactly 3 elements');
        }
        if (node.v.some(val => typeof val !== 'number' || !isFinite(val))) {
          errors.push('All rotation axis values must be finite numbers');
        }
      } else if (typeof node.v !== 'number' || !isFinite(node.v)) {
        errors.push('Rotation axis value must be a finite number');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings: [],
    };
  }

  /**
   * Validate scale parameters
   */
  private validateScaleParameters(node: ScaleNode): ValidationResult {
    const errors: string[] = [];
    
    if (node.v === undefined) {
      errors.push('Scale vector (v) is required');
    } else if (Array.isArray(node.v)) {
      if (node.v.length === 0 || node.v.length > 3) {
        errors.push('Scale vector must have 1-3 elements');
      }
      if (node.v.some(val => typeof val !== 'number' || !isFinite(val) || val <= 0)) {
        errors.push('All scale values must be positive finite numbers');
      }
    } else if (typeof node.v !== 'number' || !isFinite(node.v) || node.v <= 0) {
      errors.push('Scale value must be a positive finite number');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings: [],
    };
  }

  /**
   * Extract transformation parameters from AST node for metadata
   */
  private extractTransformationParams(node: ASTNode): Record<string, unknown> {
    const params: Record<string, unknown> = { type: node.type };
    
    switch (node.type) {
      case 'translate':
        const translateNode = node as TranslateNode;
        params.v = translateNode.v;
        break;
      case 'rotate':
        const rotateNode = node as RotateNode;
        params.a = rotateNode.a;
        params.v = rotateNode.v;
        break;
      case 'scale':
        const scaleNode = node as ScaleNode;
        params.v = scaleNode.v;
        break;
    }
    
    return params;
  }
}
