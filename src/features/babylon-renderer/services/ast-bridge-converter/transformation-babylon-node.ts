/**
 * @file Transformation BabylonJS Node Implementation
 *
 * Implements proper BabylonJS transformation application for OpenSCAD transformation types.
 * Supports translate, rotate, scale, mirror, and color with OpenSCAD-compatible parameters.
 */

import type { AbstractMesh, Matrix, Scene, Vector3 } from '@babylonjs/core';
import {
  Matrix as BabylonMatrix,
  Vector3 as BabylonVector3,
  Color3,
  StandardMaterial,
} from '@babylonjs/core';
import { createLogger } from '../../../../shared/services/logger.service';
import { tryCatch, tryCatchAsync } from '../../../../shared/utils/functional/result';

import type {
  ASTNode,
  ColorNode,
  MirrorNode,
  RotateNode,
  ScaleNode,
  SourceLocation,
  TranslateNode,
} from '../../../openscad-parser/ast/ast-types';
import {
  type BabylonJSError,
  BabylonJSNode,
  BabylonJSNodeType,
  type NodeGenerationResult,
  type NodeValidationResult,
} from '../../types/babylon-ast.types';

const logger = createLogger('TransformationBabylonNode');

/**
 * Transformation BabylonJS Node
 *
 * Handles proper transformation application for OpenSCAD transformation types with
 * accurate parameter mapping and OpenSCAD-compatible behavior.
 */
export class TransformationBabylonNode extends BabylonJSNode {
  private readonly transformationType: string;
  private readonly parameters: Record<string, unknown>;
  private readonly childNodes: BabylonJSNode[];

  constructor(
    name: string,
    scene: Scene | null,
    originalOpenscadNode: ASTNode,
    childNodes: BabylonJSNode[] = [],
    sourceLocation?: SourceLocation
  ) {
    // Map transformation type to correct BabylonJS node type
    const nodeType = TransformationBabylonNode.mapTransformationTypeToNodeType(
      originalOpenscadNode.type
    );

    super(name, scene, nodeType, originalOpenscadNode, sourceLocation);

    this.transformationType = originalOpenscadNode.type;
    this.parameters = this.extractParameters(originalOpenscadNode);
    this.childNodes = childNodes;

    logger.debug(
      `[INIT] Created transformation BabylonJS node for ${this.transformationType} (${nodeType})`
    );
  }

  /**
   * Map OpenSCAD transformation type to BabylonJS node type
   */
  private static mapTransformationTypeToNodeType(transformationType: string): BabylonJSNodeType {
    switch (transformationType) {
      case 'translate':
        return BabylonJSNodeType.Translate;
      case 'rotate':
        return BabylonJSNodeType.Rotate;
      case 'scale':
        return BabylonJSNodeType.Scale;
      case 'mirror':
        return BabylonJSNodeType.Mirror;
      case 'color':
        return BabylonJSNodeType.Color;
      default:
        logger.warn(
          `[INIT] Unknown transformation type: ${transformationType}, defaulting to Translate`
        );
        return BabylonJSNodeType.Translate;
    }
  }

  /**
   * Generate BabylonJS mesh with applied transformations
   */
  async generateMesh(): Promise<NodeGenerationResult> {
    logger.debug(`[GENERATE] Generating ${this.transformationType} transformation`);

    return tryCatchAsync(
      async () => {
        if (!this.scene) {
          throw this.createError('NO_SCENE', 'Scene is required for mesh generation');
        }

        // Generate child meshes first
        logger.debug(
          `[GENERATE] Generating ${this.childNodes.length} child nodes for ${this.transformationType}`
        );
        const childMeshes: AbstractMesh[] = [];
        for (const childNode of this.childNodes) {
          logger.debug(
            `[GENERATE] Generating child mesh for node: ${childNode.name} (${childNode.nodeType})`
          );
          const childResult = await childNode.generateMesh();
          if (!childResult.success) {
            logger.error(
              `[GENERATE] Failed to generate child mesh for ${childNode.name}: ${childResult.error.message}`
            );
            throw new Error(`Failed to generate child mesh: ${childResult.error.message}`);
          }
          logger.debug(`[GENERATE] Successfully generated child mesh: ${childResult.data.name}`);
          childMeshes.push(childResult.data);
        }

        logger.debug(
          `[GENERATE] Generated ${childMeshes.length} child meshes, applying ${this.transformationType} transformation`
        );

        // Apply transformation to child meshes
        const transformedMesh = this.applyTransformation(childMeshes);

        // Set basic properties
        transformedMesh.id = `${this.name}_${Date.now()}`;
        transformedMesh.name = this.name;

        // Add metadata
        transformedMesh.metadata = {
          isTransformation: true,
          transformationType: this.transformationType,
          parameters: this.parameters,
          childCount: childMeshes.length,
          sourceLocation: this.sourceLocation,
          generatedAt: new Date().toISOString(),
        };

        logger.debug(`[GENERATE] Generated ${this.transformationType} transformation successfully`);
        return transformedMesh;
      },
      (error) => {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return this.createError(
          'MESH_GENERATION_FAILED',
          `Failed to generate ${this.transformationType} transformation: ${errorMessage}`
        );
      }
    );
  }

  /**
   * Apply the appropriate transformation based on type
   */
  private applyTransformation(childMeshes: AbstractMesh[]): AbstractMesh {
    if (!this.scene) {
      throw new Error('Scene is required');
    }

    logger.debug(
      `[APPLY_TRANSFORM] Applying transformation type: ${this.transformationType} to ${childMeshes.length} child meshes`
    );

    switch (this.transformationType) {
      case 'translate':
        return this.applyTranslateTransformation(childMeshes);
      case 'rotate':
        return this.applyRotateTransformation(childMeshes);
      case 'scale':
        return this.applyScaleTransformation(childMeshes);
      case 'mirror':
        return this.applyMirrorTransformation(childMeshes);
      case 'color':
        return this.applyColorTransformation(childMeshes);
      default:
        throw new Error(`Unsupported transformation type: ${this.transformationType}`);
    }
  }

  /**
   * Apply translate transformation with OpenSCAD-compatible parameters
   */
  private applyTranslateTransformation(childMeshes: AbstractMesh[]): AbstractMesh {
    const translation = this.extractTranslationVector();

    logger.debug(
      `[TRANSLATE] Applying translation [${translation.x}, ${translation.y}, ${translation.z}] to ${childMeshes.length} child meshes`
    );

    // Apply translation directly to each child mesh
    this.applyDirectTransformation(childMeshes, (mesh) => {
      mesh.position = mesh.position.add(translation);
    });

    return this.createTransformationContainer(childMeshes, 'translate');
  }

  /**
   * Apply rotate transformation with OpenSCAD-compatible parameters
   */
  private applyRotateTransformation(childMeshes: AbstractMesh[]): AbstractMesh {
    const rotation = this.extractRotationAngles();

    logger.debug(
      `[ROTATE] Applying rotation [${rotation.x}, ${rotation.y}, ${rotation.z}] degrees to ${childMeshes.length} child meshes`
    );

    // Convert degrees to radians
    const rotationRadians = new BabylonVector3(
      (rotation.x * Math.PI) / 180,
      (rotation.y * Math.PI) / 180,
      (rotation.z * Math.PI) / 180
    );

    // Apply rotation directly to each child mesh
    this.applyDirectTransformation(childMeshes, (mesh) => {
      mesh.rotation = mesh.rotation.add(rotationRadians);
    });

    return this.createTransformationContainer(childMeshes, 'rotate');
  }

  /**
   * Apply scale transformation with OpenSCAD-compatible parameters
   */
  private applyScaleTransformation(childMeshes: AbstractMesh[]): AbstractMesh {
    const scale = this.extractScaleVector();
    return this.createParentBasedTransformation(childMeshes, 'scale', (parent) => {
      parent.scaling = scale;
    });
  }

  /**
   * Apply mirror transformation with OpenSCAD-compatible parameters
   */
  private applyMirrorTransformation(childMeshes: AbstractMesh[]): AbstractMesh {
    const normal = this.extractMirrorNormal();
    const mirrorMatrix = this.createMirrorMatrix(normal);

    return this.createParentBasedTransformation(childMeshes, 'mirror', (parent) => {
      parent.setPreTransformMatrix(mirrorMatrix);
    });
  }

  /**
   * Apply color transformation with OpenSCAD-compatible parameters
   */
  private applyColorTransformation(childMeshes: AbstractMesh[]): AbstractMesh {
    const color = this.extractColor();
    const alpha = this.extractAlpha();

    return this.createParentBasedTransformation(childMeshes, 'color', (_parent) => {
      // Apply color to all child meshes
      for (const childMesh of childMeshes) {
        const material = new StandardMaterial(`${childMesh.name}_colored`, this.scene || undefined);
        material.diffuseColor = color;
        material.alpha = alpha;
        childMesh.material = material;
      }
    });
  }

  /**
   * Extract translation vector from parameters
   */
  private extractTranslationVector(): Vector3 {
    const translateNode = this.originalOpenscadNode as TranslateNode;
    const translation = translateNode.v; // Use 'v' property

    if (Array.isArray(translation) && translation.length >= 3) {
      return new BabylonVector3(
        typeof translation[0] === 'number' ? translation[0] : 0,
        typeof translation[1] === 'number' ? translation[1] : 0,
        typeof translation[2] === 'number' ? translation[2] : 0
      );
    }

    return new BabylonVector3(0, 0, 0); // Default translation
  }

  /**
   * Extract rotation angles from parameters
   */
  private extractRotationAngles(): Vector3 {
    const rotateNode = this.originalOpenscadNode as {
      v?: number[] | number;
      a?: number[] | number;
    };

    // Try 'v' property first (this is where the rotation values are stored)
    let rotation = rotateNode.v;

    // Fallback to 'a' property if 'v' is not available
    if (!rotation) {
      rotation = rotateNode.a;
    }

    if (Array.isArray(rotation) && rotation.length >= 3) {
      return new BabylonVector3(
        typeof rotation[0] === 'number' ? rotation[0] : 0,
        typeof rotation[1] === 'number' ? rotation[1] : 0,
        typeof rotation[2] === 'number' ? rotation[2] : 0
      );
    }

    if (typeof rotation === 'number') {
      // Single angle rotation around Z-axis (OpenSCAD default)
      return new BabylonVector3(0, 0, rotation);
    }

    return new BabylonVector3(0, 0, 0); // Default rotation
  }

  /**
   * Extract scale vector from parameters
   */
  private extractScaleVector(): Vector3 {
    const scaleNode = this.originalOpenscadNode as ScaleNode;
    const scale = scaleNode.v; // Use 'v' property

    if (Array.isArray(scale) && scale.length >= 3) {
      return new BabylonVector3(
        typeof scale[0] === 'number' ? scale[0] : 1,
        typeof scale[1] === 'number' ? scale[1] : 1,
        typeof scale[2] === 'number' ? scale[2] : 1
      );
    }

    if (typeof scale === 'number') {
      // Uniform scaling
      return new BabylonVector3(scale, scale, scale);
    }

    return new BabylonVector3(1, 1, 1); // Default scale
  }

  /**
   * Extract mirror normal vector from parameters
   */
  private extractMirrorNormal(): Vector3 {
    const mirrorNode = this.originalOpenscadNode as MirrorNode;
    const normal = mirrorNode.v; // Use 'v' property instead of 'normal'

    if (Array.isArray(normal) && normal.length >= 3) {
      return new BabylonVector3(
        typeof normal[0] === 'number' ? normal[0] : 0,
        typeof normal[1] === 'number' ? normal[1] : 0,
        typeof normal[2] === 'number' ? normal[2] : 1
      );
    }

    return new BabylonVector3(0, 0, 1); // Default normal (Z-axis)
  }

  /**
   * Extract color from parameters
   */
  private extractColor(): Color3 {
    const colorNode = this.originalOpenscadNode as ColorNode;
    const color = colorNode.c; // Use 'c' property instead of 'color'

    if (Array.isArray(color) && color.length >= 3) {
      return new Color3(
        typeof color[0] === 'number' ? color[0] : 1,
        typeof color[1] === 'number' ? color[1] : 1,
        typeof color[2] === 'number' ? color[2] : 1
      );
    }

    return new Color3(1, 1, 1); // Default color (white)
  }

  /**
   * Extract alpha (transparency) from parameters
   */
  private extractAlpha(): number {
    const colorNode = this.originalOpenscadNode as ColorNode;
    const color = colorNode.c; // Use 'c' property instead of 'color'

    if (Array.isArray(color) && color.length >= 4) {
      return typeof color[3] === 'number' ? color[3] : 1;
    }

    return 1; // Default alpha (opaque)
  }

  /**
   * Apply transformation directly to each child mesh (DRY helper)
   */
  private applyDirectTransformation(
    childMeshes: AbstractMesh[],
    transformFn: (mesh: AbstractMesh) => void
  ): void {
    for (const childMesh of childMeshes) {
      transformFn(childMesh);
    }
  }

  /**
   * Create transformation container for multiple children (DRY helper)
   */
  private createTransformationContainer(
    childMeshes: AbstractMesh[],
    transformationType: string
  ): AbstractMesh {
    // If there's only one child, return it directly
    if (childMeshes.length === 1 && childMeshes[0]) {
      return childMeshes[0];
    }

    // For multiple children, create a parent group
    const { TransformNode, MeshBuilder } = require('@babylonjs/core');
    const parentNode = new TransformNode(`${this.name}_transform`, this.scene);

    // Parent all child meshes to the transform node
    for (const childMesh of childMeshes) {
      childMesh.parent = parentNode;
    }

    // Create an invisible container mesh
    const containerMesh = MeshBuilder.CreateBox(
      `${this.name}_container`,
      { size: 0.001 },
      this.scene
    );
    containerMesh.isVisible = false;
    containerMesh.parent = parentNode;

    // Store metadata
    containerMesh.metadata = {
      ...containerMesh.metadata,
      transformedChildren: childMeshes,
      isTransformationContainer: true,
      hasMultipleChildren: true,
      transformationType,
    };

    logger.debug(
      `[${transformationType.toUpperCase()}] Created transformation container with ${childMeshes.length} children`
    );

    return containerMesh;
  }

  /**
   * Create parent-based transformation (DRY helper for scale, mirror, color)
   */
  private createParentBasedTransformation(
    childMeshes: AbstractMesh[],
    transformationType: string,
    applyTransform: (parent: AbstractMesh) => void
  ): AbstractMesh {
    const { MeshBuilder } = require('@babylonjs/core');
    const parentMesh = MeshBuilder.CreateBox(`${this.name}_parent`, { size: 0.001 }, this.scene);
    parentMesh.isVisible = false;

    // Apply the specific transformation to parent
    applyTransform(parentMesh);

    // Parent all child meshes
    for (const childMesh of childMeshes) {
      childMesh.parent = parentMesh;
    }

    // Add metadata
    parentMesh.metadata = {
      ...parentMesh.metadata,
      transformationType,
      childCount: childMeshes.length,
    };

    return parentMesh;
  }

  /**
   * Create mirror matrix for reflection across a plane
   */
  private createMirrorMatrix(normal: Vector3): Matrix {
    // Normalize the normal vector
    const n = normal.normalize();

    // Create reflection matrix: I - 2 * n * n^T
    const matrix = BabylonMatrix.Identity();

    matrix.setRowFromFloats(0, 1 - 2 * n.x * n.x, -2 * n.x * n.y, -2 * n.x * n.z, 0);
    matrix.setRowFromFloats(1, -2 * n.y * n.x, 1 - 2 * n.y * n.y, -2 * n.y * n.z, 0);
    matrix.setRowFromFloats(2, -2 * n.z * n.x, -2 * n.z * n.y, 1 - 2 * n.z * n.z, 0);
    matrix.setRowFromFloats(3, 0, 0, 0, 1);

    return matrix;
  }

  /**
   * Extract parameters from the original OpenSCAD node
   */
  private extractParameters(node: ASTNode): Record<string, unknown> {
    const params: Record<string, unknown> = { type: node.type };

    switch (node.type) {
      case 'translate': {
        const translateNode = node as TranslateNode;
        params.v = translateNode.v; // Use 'v' property
        break;
      }
      case 'rotate': {
        const rotateNode = node as RotateNode;
        params.a = rotateNode.a; // Use 'a' property for angle
        params.v = rotateNode.v; // Use 'v' property for axis
        break;
      }
      case 'scale': {
        const scaleNode = node as ScaleNode;
        params.v = scaleNode.v; // Use 'v' property
        break;
      }
      case 'mirror': {
        const mirrorNode = node as MirrorNode;
        params.v = mirrorNode.v; // Use 'v' property
        break;
      }
      case 'color': {
        const colorNode = node as ColorNode;
        params.c = colorNode.c; // Use 'c' property
        break;
      }
    }

    return params;
  }

  /**
   * Validate the transformation node
   */
  validateNode(): NodeValidationResult {
    return tryCatch(
      () => {
        if (!this.name || this.name.trim() === '') {
          throw this.createError('INVALID_NAME', 'Node name cannot be empty');
        }

        if (!this.transformationType) {
          throw this.createError('MISSING_TRANSFORMATION_TYPE', 'Transformation type is required');
        }

        // Validate type-specific parameters
        this.validateTransformationParameters();

        logger.debug(
          `[VALIDATE] Transformation node ${this.name} (${this.transformationType}) validated successfully`
        );
      },
      (error) => {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return this.createError('VALIDATION_FAILED', `Node validation failed: ${errorMessage}`);
      }
    );
  }

  /**
   * Validate transformation-specific parameters
   */
  private validateTransformationParameters(): void {
    switch (this.transformationType) {
      case 'translate':
        // Translation validation logic
        break;
      case 'rotate':
        // Rotation validation logic
        break;
      case 'scale': {
        const scale = this.extractScaleVector();
        if (scale.x === 0 || scale.y === 0 || scale.z === 0) {
          throw new Error('Scale factors cannot be zero');
        }
        break;
      }
      case 'mirror': {
        const normal = this.extractMirrorNormal();
        if (normal.length() === 0) {
          throw new Error('Mirror normal vector cannot be zero');
        }
        break;
      }
      case 'color':
        // Color validation logic
        break;
    }
  }

  /**
   * Clone the transformation node
   */
  clone(): TransformationBabylonNode {
    const clonedChildNodes = this.childNodes.map((child) => child.clone());

    const clonedNode = new TransformationBabylonNode(
      `${this.name}_clone_${Date.now()}`,
      this.scene,
      this.originalOpenscadNode as ASTNode,
      clonedChildNodes,
      this.sourceLocation
    );

    logger.debug(`[CLONE] Cloned transformation node ${this.name} to ${clonedNode.name}`);
    return clonedNode;
  }

  /**
   * Get debug information specific to transformation nodes
   */
  override getDebugInfo(): Record<string, unknown> {
    return {
      ...super.getDebugInfo(),
      transformationType: this.transformationType,
      parameters: this.parameters,
      childCount: this.childNodes.length,
      isTransformation: true,
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
