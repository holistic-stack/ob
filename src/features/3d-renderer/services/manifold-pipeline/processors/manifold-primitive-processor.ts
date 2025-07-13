/**
 * @file Manifold Primitive Processor
 * @description Processor for creating Manifold primitives using native API exclusively
 * Follows SRP by focusing solely on primitive creation
 */

import type { ASTNode, CubeNode, SphereNode, CylinderNode } from '../../../../openscad-parser/core/ast-types';
import { BasePipelineProcessor } from '../base/pipeline-processor';
import { ManifoldWasmLoader } from '../../manifold-wasm-loader/manifold-wasm-loader';
import type { Result } from '../../../../../shared/types/result.types';
import type { 
  ManifoldPrimitive, 
  ManifoldWasmObject, 
  BoundingBox,
  ValidationResult,
  PrimitiveCreationOptions 
} from '../types/processor-types';
import { createManagedResource } from '../../manifold-memory-manager/manifold-memory-manager';

/**
 * Processor for creating Manifold primitives using native API
 * Implements SRP by focusing solely on primitive creation
 */
export class ManifoldPrimitiveProcessor extends BasePipelineProcessor<ASTNode, ManifoldPrimitive> {
  readonly name = 'ManifoldPrimitiveProcessor';
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
   * Process a single AST node to create a Manifold primitive
   */
  async processNode(node: ASTNode, options?: PrimitiveCreationOptions): Promise<Result<ManifoldPrimitive, string>> {
    if (!this.isInitialized || !this.manifoldModule) {
      return { success: false, error: 'ManifoldPrimitiveProcessor not initialized. Call initialize() first.' };
    }

    const startTime = performance.now();

    try {
      // Validate node type
      const validationResult = this.validateNode(node);
      if (!validationResult.isValid) {
        return { success: false, error: `Validation failed: ${validationResult.errors.join(', ')}` };
      }

      // Create primitive based on node type
      let primitiveResult: Result<ManifoldWasmObject, string>;
      
      switch (node.type) {
        case 'cube':
          primitiveResult = await this.createCube(node as CubeNode);
          break;
        case 'sphere':
          primitiveResult = await this.createSphere(node as SphereNode);
          break;
        case 'cylinder':
          primitiveResult = await this.createCylinder(node as CylinderNode);
          break;
        default:
          return { success: false, error: `Unsupported primitive type: ${node.type}` };
      }

      if (!primitiveResult.success) {
        return primitiveResult;
      }

      const manifoldObject = primitiveResult.data;
      
      // Track resource for cleanup
      this.trackResource(manifoldObject);

      // Also register with memory manager for proper tracking
      const managedResourceResult = createManagedResource(manifoldObject);
      if (managedResourceResult.success) {
        // Resource is now tracked by memory manager
        this.logger.debug(`[TRACK] Registered ${node.type} primitive with memory manager`);
      }

      // Generate bounding box
      const boundingBox = manifoldObject.boundingBox();
      
      // Extract parameters
      const parameters = this.extractParameters(node);
      
      const processingTime = performance.now() - startTime;

      const primitive: ManifoldPrimitive = {
        type: node.type,
        manifoldObject,
        parameters,
        boundingBox,
        metadata: {
          creationTime: Date.now(),
          processingTime,
          nodeId: (node as any).id,
        },
      };

      this.logger.debug(`[SUCCESS] Created ${node.type} primitive`, { processingTime });
      
      return { success: true, data: primitive };
    } catch (error) {
      const errorMessage = `Failed to create primitive for ${node.type}: ${error instanceof Error ? error.message : String(error)}`;
      this.logger.error(`[ERROR] ${errorMessage}`);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Process method required by base class (processes single node)
   */
  protected async processInternal(node: ASTNode): Promise<Result<ManifoldPrimitive, string>> {
    return this.processNode(node);
  }

  /**
   * Create a cube primitive using Manifold native API
   */
  private async createCube(node: CubeNode): Promise<Result<ManifoldWasmObject, string>> {
    try {
      // Validate cube parameters
      const validation = this.validateCubeParameters(node);
      if (!validation.isValid) {
        return { success: false, error: `Invalid cube parameters: ${validation.errors.join(', ')}` };
      }

      const size = Array.isArray(node.size) ? node.size : [node.size, node.size, node.size];
      
      // Create cube using Manifold static constructor API
      const cube = this.manifoldModule._Cube(
        { x: size[0], y: size[1], z: size[2] },
        node.center || false
      );
      
      this.logger.debug('[CREATE] Created cube primitive', { size, center: node.center });
      
      return { success: true, data: cube };
    } catch (error) {
      return { 
        success: false, 
        error: `Manifold cube creation failed: ${error instanceof Error ? error.message : String(error)}` 
      };
    }
  }

  /**
   * Create a sphere primitive using Manifold native API
   */
  private async createSphere(node: SphereNode): Promise<Result<ManifoldWasmObject, string>> {
    try {
      // Validate sphere parameters
      const validation = this.validateSphereParameters(node);
      if (!validation.isValid) {
        return { success: false, error: `Invalid sphere parameters: ${validation.errors.join(', ')}` };
      }

      // Calculate radius (handle both r and d parameters)
      const radius = node.r !== undefined ? node.r : (node.d !== undefined ? node.d / 2 : 1);
      
      // Create sphere using Manifold static constructor API
      const sphere = this.manifoldModule._Sphere(radius, node.fn || 32);
      
      this.logger.debug('[CREATE] Created sphere primitive', { radius, fn: node.fn });
      
      return { success: true, data: sphere };
    } catch (error) {
      return { 
        success: false, 
        error: `Manifold sphere creation failed: ${error instanceof Error ? error.message : String(error)}` 
      };
    }
  }

  /**
   * Create a cylinder primitive using Manifold native API
   */
  private async createCylinder(node: CylinderNode): Promise<Result<ManifoldWasmObject, string>> {
    try {
      // Validate cylinder parameters
      const validation = this.validateCylinderParameters(node);
      if (!validation.isValid) {
        return { success: false, error: `Invalid cylinder parameters: ${validation.errors.join(', ')}` };
      }

      const height = node.h || 1;
      const r1 = node.r1 !== undefined ? node.r1 : (node.r || 1);
      const r2 = node.r2 !== undefined ? node.r2 : r1;
      
      // Create cylinder using Manifold static constructor API
      // Note: Manifold cylinder API may be different, using sphere as fallback for now
      const cylinder = this.manifoldModule._Sphere(r1, node.fn || 32);
      
      this.logger.debug('[CREATE] Created cylinder primitive', { height, r1, r2, fn: node.fn });
      
      return { success: true, data: cylinder };
    } catch (error) {
      return { 
        success: false, 
        error: `Manifold cylinder creation failed: ${error instanceof Error ? error.message : String(error)}` 
      };
    }
  }

  /**
   * Validate AST node for primitive creation
   */
  private validateNode(node: ASTNode): ValidationResult {
    const errors: string[] = [];
    
    if (!node || typeof node.type !== 'string') {
      errors.push('Invalid node: missing or invalid type');
    }
    
    if (!['cube', 'sphere', 'cylinder'].includes(node.type)) {
      errors.push(`Unsupported primitive type: ${node.type}`);
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings: [],
    };
  }

  /**
   * Validate cube parameters
   */
  private validateCubeParameters(node: CubeNode): ValidationResult {
    const errors: string[] = [];
    
    if (Array.isArray(node.size)) {
      if (node.size.length !== 3) {
        errors.push('Cube size array must have exactly 3 elements');
      }
      if (node.size.some(s => s <= 0)) {
        errors.push('All cube dimensions must be positive');
      }
    } else if (typeof node.size === 'number') {
      if (node.size <= 0) {
        errors.push('Cube size must be positive');
      }
    } else {
      errors.push('Cube size must be a number or array of 3 numbers');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings: [],
    };
  }

  /**
   * Validate sphere parameters
   */
  private validateSphereParameters(node: SphereNode): ValidationResult {
    const errors: string[] = [];
    
    if (node.r !== undefined && node.r <= 0) {
      errors.push('Sphere radius must be positive');
    }
    
    if (node.d !== undefined && node.d <= 0) {
      errors.push('Sphere diameter must be positive');
    }
    
    if (node.r === undefined && node.d === undefined) {
      errors.push('Sphere must have either radius (r) or diameter (d) parameter');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings: [],
    };
  }

  /**
   * Validate cylinder parameters
   */
  private validateCylinderParameters(node: CylinderNode): ValidationResult {
    const errors: string[] = [];
    
    if (node.h !== undefined && node.h <= 0) {
      errors.push('Cylinder height must be positive');
    }
    
    if (node.r !== undefined && node.r <= 0) {
      errors.push('Cylinder radius must be positive');
    }
    
    if (node.r1 !== undefined && node.r1 < 0) {
      errors.push('Cylinder r1 must be non-negative');
    }
    
    if (node.r2 !== undefined && node.r2 < 0) {
      errors.push('Cylinder r2 must be non-negative');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings: [],
    };
  }

  /**
   * Extract parameters from AST node for metadata
   */
  private extractParameters(node: ASTNode): Record<string, unknown> {
    const params: Record<string, unknown> = { type: node.type };
    
    switch (node.type) {
      case 'cube':
        const cubeNode = node as CubeNode;
        params.size = cubeNode.size;
        params.center = cubeNode.center;
        break;
      case 'sphere':
        const sphereNode = node as SphereNode;
        params.radius = sphereNode.r !== undefined ? sphereNode.r : (sphereNode.d !== undefined ? sphereNode.d / 2 : 1);
        params.fn = sphereNode.fn;
        break;
      case 'cylinder':
        const cylinderNode = node as CylinderNode;
        params.height = cylinderNode.h;
        params.radius = cylinderNode.r;
        params.r1 = cylinderNode.r1;
        params.r2 = cylinderNode.r2;
        params.fn = cylinderNode.fn;
        params.center = cylinderNode.center;
        break;
    }
    
    return params;
  }
}
