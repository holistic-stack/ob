/**
 * @file Placeholder BabylonJS Node Implementation
 *
 * Temporary placeholder implementation for BabylonJS-Extended AST nodes.
 * This will be replaced with proper node type-specific implementations
 * as the Bridge Pattern is fully developed.
 */

import type { AbstractMesh, Scene } from '@babylonjs/core';
import { MeshBuilder, StandardMaterial } from '@babylonjs/core';
import type {
  BabylonJSError,
  NodeGenerationResult,
  NodeValidationResult,
} from '@/features/babylon-renderer/types';
import {
  BabylonJSNode,
  BabylonJSNodeType,
} from '@/features/babylon-renderer/types';
import type { ASTNode, SourceLocation } from '@/features/openscad-parser';
import { createLogger, tryCatch } from '@/shared';

const logger = createLogger('PlaceholderBabylonNode');

/**
 * Placeholder BabylonJS Node
 *
 * Temporary implementation that creates simple placeholder meshes for all OpenSCAD node types.
 * This allows the Bridge Pattern infrastructure to be tested while proper node implementations
 * are developed incrementally.
 */
export class PlaceholderBabylonNode extends BabylonJSNode {
  private readonly openscadNodeType: string;

  constructor(
    name: string,
    scene: Scene | null,
    originalOpenscadNode: ASTNode,
    sourceLocation?: SourceLocation
  ) {
    super(
      name,
      scene,
      BabylonJSNodeType.Cube, // Default to cube for placeholder
      originalOpenscadNode,
      sourceLocation
    );

    this.openscadNodeType = originalOpenscadNode.type;
    logger.debug(`[INIT] Created placeholder BabylonJS node for ${this.openscadNodeType}`);
  }

  /**
   * Generate a placeholder BabylonJS mesh
   *
   * Creates simple geometric shapes based on the OpenSCAD node type.
   * This is a temporary implementation that will be replaced with proper
   * node-specific mesh generation.
   */
  async generateMesh(): Promise<NodeGenerationResult> {
    logger.debug(`[GENERATE] Generating placeholder mesh for ${this.openscadNodeType}`);

    return tryCatch(
      () => {
        if (!this.scene) {
          throw this.createError('NO_SCENE', 'Scene is required for mesh generation');
        }

        const mesh = this.createPlaceholderMesh();

        // Set basic properties
        mesh.id = `${this.name}_${Date.now()}`;
        mesh.name = this.name;

        // Add metadata to identify this as a placeholder
        mesh.metadata = {
          isPlaceholder: true,
          originalNodeType: this.openscadNodeType,
          bridgeNodeType: this.nodeType,
          sourceLocation: this.sourceLocation,
          generatedAt: new Date().toISOString(),
        };

        logger.debug(`[GENERATE] Generated placeholder mesh for ${this.openscadNodeType}`);
        return mesh;
      },
      (error) => this.createError('MESH_GENERATION_FAILED', `Failed to generate mesh: ${error}`)
    );
  }

  /**
   * Create a placeholder mesh based on OpenSCAD node type
   */
  private createPlaceholderMesh(): AbstractMesh {
    const scene = this.scene;
    if (!scene) {
      throw new Error('Scene is required');
    }

    // Create different placeholder shapes based on OpenSCAD node type
    switch (this.openscadNodeType) {
      case 'cube':
        return MeshBuilder.CreateBox(this.name, { size: 1 }, scene);

      case 'sphere':
        return MeshBuilder.CreateSphere(this.name, { diameter: 1 }, scene);

      case 'cylinder':
        return MeshBuilder.CreateCylinder(this.name, { height: 1, diameter: 1 }, scene);

      case 'circle':
        return MeshBuilder.CreateDisc(this.name, { radius: 0.5 }, scene);

      case 'square':
        return MeshBuilder.CreatePlane(this.name, { size: 1 }, scene);

      case 'polygon':
        return MeshBuilder.CreatePlane(this.name, { size: 1 }, scene);

      case 'text':
        // For text, create a simple plane as placeholder
        return MeshBuilder.CreatePlane(this.name, { size: 1 }, scene);

      case 'translate':
      case 'rotate':
      case 'scale':
      case 'mirror':
      case 'color':
        // For transformations, create a small marker cube
        return MeshBuilder.CreateBox(this.name, { size: 0.1 }, scene);

      case 'union':
      case 'difference':
      case 'intersection':
        // For CSG operations, create a compound shape indicator
        return MeshBuilder.CreateSphere(this.name, { diameter: 0.5 }, scene);

      case 'linear_extrude':
      case 'rotate_extrude':
        // For extrusions, create a cylinder as placeholder
        return MeshBuilder.CreateCylinder(this.name, { height: 1, diameter: 0.5 }, scene);

      case 'for_loop':
      case 'if':
      case 'let': {
        // For control flow, create a wireframe box
        const wireframe = MeshBuilder.CreateBox(this.name, { size: 0.2 }, scene);
        // Create a simple material for wireframe
        const material = new StandardMaterial(`${this.name}_material`, scene);
        material.wireframe = true;
        wireframe.material = material;
        return wireframe;
      }

      default:
        // Default placeholder: a small tetrahedron
        return MeshBuilder.CreatePolyhedron(this.name, { type: 0, size: 0.5 }, scene);
    }
  }

  /**
   * Validate the placeholder node
   *
   * Performs basic validation to ensure the node is properly constructed.
   */
  validateNode(): NodeValidationResult {
    return tryCatch(
      () => {
        if (!this.name || this.name.trim() === '') {
          throw this.createError('INVALID_NAME', 'Node name cannot be empty');
        }

        if (!this.originalOpenscadNode) {
          throw this.createError(
            'MISSING_ORIGINAL_NODE',
            'Original OpenSCAD node reference is required'
          );
        }

        if (!this.openscadNodeType) {
          throw this.createError('MISSING_NODE_TYPE', 'OpenSCAD node type is required');
        }

        logger.debug(`[VALIDATE] Placeholder node ${this.name} validated successfully`);
      },
      (error) => this.createError('VALIDATION_FAILED', `Node validation failed: ${error}`)
    );
  }

  /**
   * Clone the placeholder node
   */
  clone(): PlaceholderBabylonNode {
    const clonedNode = new PlaceholderBabylonNode(
      `${this.name}_clone_${Date.now()}`,
      this.scene,
      this.originalOpenscadNode as ASTNode,
      this.sourceLocation
    );

    logger.debug(`[CLONE] Cloned placeholder node ${this.name} to ${clonedNode.name}`);
    return clonedNode;
  }

  /**
   * Get additional debug information specific to placeholder nodes
   */
  override getDebugInfo(): Record<string, unknown> {
    return {
      ...super.getDebugInfo(),
      openscadNodeType: this.openscadNodeType,
      isPlaceholder: true,
      implementationStatus: 'placeholder',
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
