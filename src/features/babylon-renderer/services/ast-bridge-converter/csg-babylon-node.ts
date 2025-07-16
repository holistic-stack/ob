/**
 * @file CSG BabylonJS Node Implementation
 *
 * Implements proper BabylonJS CSG operations for OpenSCAD CSG types.
 * Supports union, difference, and intersection with OpenSCAD-compatible behavior.
 */

import type { AbstractMesh, Scene } from '@babylonjs/core';
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
      this.csgService.init(scene);
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

    // Convert AbstractMesh to Mesh for CSG operations
    const meshes = childMeshes.map((mesh) => {
      // Ensure we have proper Mesh instances for CSG operations
      if (!('geometry' in mesh)) {
        throw new Error(
          `Child mesh ${(mesh as any).name || 'unknown'} is not a valid Mesh for CSG operations`
        );
      }
      return mesh as any; // Type assertion for CSG operations
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
  private async applyUnionOperation(meshes: any[]): Promise<AbstractMesh> {
    logger.debug(`[UNION] Applying union operation to ${meshes.length} meshes`);

    // Start with the first mesh
    let result = meshes[0];

    // Union with each subsequent mesh
    for (let i = 1; i < meshes.length; i++) {
      const unionResult = await this.csgService.union(result, meshes[i]);

      if (!unionResult.success) {
        throw new Error(`Union operation failed: ${unionResult.error.message}`);
      }

      result = unionResult.data.resultMesh;
    }

    return result;
  }

  /**
   * Apply difference operation to multiple meshes
   */
  private async applyDifferenceOperation(meshes: any[]): Promise<AbstractMesh> {
    logger.debug(`[DIFFERENCE] Applying difference operation to ${meshes.length} meshes`);

    // Start with the first mesh
    let result = meshes[0];

    // Subtract each subsequent mesh
    for (let i = 1; i < meshes.length; i++) {
      const differenceResult = await this.csgService.difference(result, meshes[i]);

      if (!differenceResult.success) {
        throw new Error(`Difference operation failed: ${differenceResult.error.message}`);
      }

      result = differenceResult.data.resultMesh;
    }

    return result;
  }

  /**
   * Apply intersection operation to multiple meshes
   */
  private async applyIntersectionOperation(meshes: any[]): Promise<AbstractMesh> {
    logger.debug(`[INTERSECTION] Applying intersection operation to ${meshes.length} meshes`);

    // Start with the first mesh
    let result = meshes[0];

    // Intersect with each subsequent mesh
    for (let i = 1; i < meshes.length; i++) {
      const intersectionResult = await this.csgService.intersection(result, meshes[i]);

      if (!intersectionResult.success) {
        throw new Error(`Intersection operation failed: ${intersectionResult.error.message}`);
      }

      result = intersectionResult.data.resultMesh;
    }

    return result;
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
    const error: BabylonJSError = {
      code,
      message,
      nodeType: this.nodeType,
      timestamp: new Date(),
    };

    if (this.sourceLocation) {
      (error as any).sourceLocation = this.sourceLocation;
    }

    return error;
  }
}
