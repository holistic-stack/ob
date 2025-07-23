/**
 * @file CSG BabylonJS Node Implementation
 *
 * Implements proper BabylonJS CSG operations for OpenSCAD CSG types.
 * Supports union, difference, and intersection with OpenSCAD-compatible behavior.
 */

import type { AbstractMesh, Mesh, Scene } from '@babylonjs/core';
import { createLogger } from '../../../../shared/services/logger.service';
import { tryCatch, tryCatchAsync } from '../../../../shared/utils/functional/result';

import type { ASTNode, SourceLocation } from '../../../openscad-parser/ast/ast-types';
import {
  type BabylonJSError,
  BabylonJSNode,
  BabylonJSNodeType,
  type NodeGenerationResult,
  type NodeValidationResult,
} from '../../types/babylon-ast.types';
import { BabylonCSG2Service } from '../babylon-csg2-service';

const logger = createLogger('CSGBabylonNode');

/**
 * CSG BabylonJS Node
 *
 * Handles proper CSG operations for OpenSCAD CSG types with
 * accurate parameter mapping and OpenSCAD-compatible behavior.
 */
export class CSGBabylonNode extends BabylonJSNode {
  private readonly csgType: string;
  private readonly childNodes: BabylonJSNode[];
  private readonly csgService: BabylonCSG2Service;

  constructor(
    name: string,
    scene: Scene | null,
    originalOpenscadNode: ASTNode,
    childNodes: BabylonJSNode[] = [],
    sourceLocation?: SourceLocation
  ) {
    super(
      name,
      scene,
      BabylonJSNodeType.Union, // Will be updated based on CSG type
      originalOpenscadNode,
      sourceLocation
    );

    this.csgType = originalOpenscadNode.type;
    this.childNodes = childNodes;
    this.csgService = new BabylonCSG2Service();

    // Initialize CSG service with scene
    if (scene) {
      const initResult = this.csgService.init(scene);
      if (!initResult.success) {
        logger.error(
          `[ERROR][CSGBabylonNode] Failed to initialize CSG service: ${initResult.error.message}`
        );
      }
    }

    logger.debug(`[INIT] Created CSG BabylonJS node for ${this.csgType}`);
  }

  /**
   * Generate BabylonJS mesh with applied CSG operations
   */
  async generateMesh(): Promise<NodeGenerationResult> {
    logger.debug(`[GENERATE] Generating ${this.csgType} CSG operation`);

    return tryCatchAsync(
      async () => {
        if (!this.scene) {
          throw this.createError('NO_SCENE', 'Scene is required for mesh generation');
        }

        if (this.childNodes.length < 2) {
          throw this.createError(
            'INSUFFICIENT_CHILDREN',
            `CSG ${this.csgType} operation requires at least 2 child nodes`
          );
        }

        // Generate child meshes first
        const childMeshes: AbstractMesh[] = [];
        for (const childNode of this.childNodes) {
          const childResult = await childNode.generateMesh();
          if (!childResult.success) {
            throw new Error(`Failed to generate child mesh: ${childResult.error.message}`);
          }
          childMeshes.push(childResult.data);
        }

        // Apply CSG operation to child meshes
        const resultMesh = await this.applyCSGOperation(childMeshes);

        // Set basic properties
        resultMesh.id = `${this.name}_${Date.now()}`;
        resultMesh.name = this.name;

        // Add metadata
        resultMesh.metadata = {
          isCSGOperation: true,
          csgType: this.csgType,
          childCount: childMeshes.length,
          sourceLocation: this.sourceLocation,
          generatedAt: new Date().toISOString(),
        };

        logger.debug(`[GENERATE] Generated ${this.csgType} CSG operation successfully`);
        return resultMesh;
      },
      (error) => {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return this.createError(
          'MESH_GENERATION_FAILED',
          `Failed to generate ${this.csgType} CSG operation: ${errorMessage}`
        );
      }
    );
  }

  /**
   * Apply the appropriate CSG operation based on type
   */
  private async applyCSGOperation(childMeshes: AbstractMesh[]): Promise<AbstractMesh> {
    if (!this.scene) {
      throw new Error('Scene is required');
    }

    // Ensure CSG service is initialized
    if (!this.csgService) {
      throw new Error('CSG service is not initialized');
    }

    // Convert AbstractMesh to Mesh for CSG operations
    const meshes = childMeshes.map((mesh) => {
      // Ensure we have proper Mesh instances for CSG operations
      if (!('geometry' in mesh)) {
        throw new Error(
          `Child mesh ${(mesh as AbstractMesh & { name?: string }).name || 'unknown'} is not a valid Mesh for CSG operations`
        );
      }
      return mesh; // AbstractMesh is sufficient for CSG operations
    });

    switch (this.csgType) {
      case 'union':
        return this.applyUnionOperation(meshes);
      case 'difference':
        return this.applyDifferenceOperation(meshes);
      case 'intersection':
        return this.applyIntersectionOperation(meshes);
      default:
        throw new Error(`Unsupported CSG operation type: ${this.csgType}`);
    }
  }

  /**
   * Apply union operation to multiple meshes
   */
  private async applyUnionOperation(meshes: AbstractMesh[]): Promise<AbstractMesh> {
    return this.executeCSGOperation(
      meshes,
      'UNION',
      async (a, b) => {
        const result = await this.csgService.union(a as Mesh, b as Mesh);
        if (!result.success) {
          throw new Error(result.error.message);
        }
        return result.data.resultMesh;
      },
      'Combined'
    );
  }

  /**
   * Apply difference operation to multiple meshes
   */
  private async applyDifferenceOperation(meshes: AbstractMesh[]): Promise<AbstractMesh> {
    return this.executeCSGOperation(
      meshes,
      'DIFFERENCE',
      async (a, b) => {
        const result = await this.csgService.difference(a as Mesh, b as Mesh);
        if (!result.success) {
          throw new Error(result.error.message);
        }
        return result.data.resultMesh;
      },
      'Subtracted'
    );
  }

  /**
   * Apply intersection operation to multiple meshes
   */
  private async applyIntersectionOperation(meshes: AbstractMesh[]): Promise<AbstractMesh> {
    return this.executeCSGOperation(
      meshes,
      'INTERSECTION',
      async (a, b) => {
        const result = await this.csgService.intersection(a as Mesh, b as Mesh);
        if (!result.success) {
          throw new Error(result.error.message);
        }
        return result.data.resultMesh;
      },
      'Intersected'
    );
  }

  /**
   * Execute CSG operation with error handling (DRY helper)
   */
  private async executeCSGOperation(
    meshes: AbstractMesh[],
    operationType: string,
    operation: (a: AbstractMesh, b: AbstractMesh) => Promise<Mesh>,
    resultPrefix: string
  ): Promise<AbstractMesh> {
    return this.applyCSGOperationToMeshes(meshes, operationType, operation, resultPrefix);
  }

  /**
   * Generic method to apply CSG operations with proper mesh disposal
   * Follows DRY principle by consolidating common CSG operation logic
   */
  private async applyCSGOperationToMeshes(
    meshes: AbstractMesh[],
    operationType: string,
    csgOperation: (a: Mesh, b: Mesh) => Promise<Mesh>,
    actionVerb: string
  ): Promise<AbstractMesh> {
    logger.debug(
      `[${operationType}] Applying ${operationType.toLowerCase()} operation to ${meshes.length} meshes`
    );

    // Validate input
    if (!meshes[0]) {
      throw new Error(`${operationType} operation requires at least one valid mesh`);
    }

    let result = meshes[0];

    // Apply operation to each subsequent mesh
    for (let i = 1; i < meshes.length; i++) {
      const mesh = meshes[i];
      if (!mesh) continue;

      const operationResult = await csgOperation(result as Mesh, mesh as Mesh);

      // The csgOperation now returns Mesh directly (after unwrapping Result)
      // Dispose intermediate meshes to prevent memory leaks and visual artifacts
      this.disposeIntermediateMesh(result, i);
      this.disposeProcessedMesh(mesh);

      result = operationResult;
      logger.debug(
        `[${operationType}] ${actionVerb} mesh ${i} with base, intermediate meshes disposed`
      );
    }

    // Dispose original base mesh if we performed operations
    this.disposeOriginalBaseMesh(meshes, operationType);

    return result;
  }

  /**
   * Dispose intermediate result mesh (follows SRP - single responsibility for mesh disposal)
   */
  private disposeIntermediateMesh(mesh: AbstractMesh, iteration: number): void {
    // Only dispose intermediate results, not the original base mesh
    if (iteration > 1) {
      mesh.dispose();
    }
  }

  /**
   * Dispose processed mesh that's no longer needed (follows SRP)
   */
  private disposeProcessedMesh(mesh: AbstractMesh): void {
    mesh.dispose();
  }

  /**
   * Dispose original base mesh after all operations are complete (follows SRP)
   */
  private disposeOriginalBaseMesh(meshes: AbstractMesh[], operationType: string): void {
    if (meshes.length > 1 && meshes[0]) {
      meshes[0].dispose();
      logger.debug(`[${operationType}] Disposed original base mesh, final result ready`);
    }
  }

  /**
   * Validate the CSG node
   */
  validateNode(): NodeValidationResult {
    return tryCatch(
      () => {
        if (!this.name || this.name.trim() === '') {
          throw this.createError('INVALID_NAME', 'Node name cannot be empty');
        }

        if (!this.csgType) {
          throw this.createError('MISSING_CSG_TYPE', 'CSG type is required');
        }

        if (this.childNodes.length < 2) {
          throw this.createError(
            'INSUFFICIENT_CHILDREN',
            `CSG ${this.csgType} operation requires at least 2 child nodes`
          );
        }

        // Validate all child nodes
        for (const childNode of this.childNodes) {
          const childValidation = childNode.validateNode();
          if (!childValidation.success) {
            throw new Error(`Child node validation failed: ${childValidation.error.message}`);
          }
        }

        logger.debug(`[VALIDATE] CSG node ${this.name} (${this.csgType}) validated successfully`);
      },
      (error) => {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return this.createError('VALIDATION_FAILED', `Node validation failed: ${errorMessage}`);
      }
    );
  }

  /**
   * Clone the CSG node
   */
  clone(): CSGBabylonNode {
    const clonedChildNodes = this.childNodes.map((child) => child.clone());

    const clonedNode = new CSGBabylonNode(
      `${this.name}_clone_${Date.now()}`,
      this.scene,
      this.originalOpenscadNode as ASTNode,
      clonedChildNodes,
      this.sourceLocation
    );

    logger.debug(`[CLONE] Cloned CSG node ${this.name} to ${clonedNode.name}`);
    return clonedNode;
  }

  /**
   * Get debug information specific to CSG nodes
   */
  override getDebugInfo(): Record<string, unknown> {
    return {
      ...super.getDebugInfo(),
      csgType: this.csgType,
      childCount: this.childNodes.length,
      isCSGOperation: true,
      hasCSGService: !!this.csgService,
    };
  }

  /**
   * Create a BabylonJS error specific to this node
   */
  private createError(code: string, message: string): BabylonJSError {
    return {
      code,
      message,
      nodeType: this.nodeType,
      timestamp: new Date(),
      ...(this.sourceLocation && { sourceLocation: this.sourceLocation }),
    };
  }
}
