/**
 * @file Modifier BabylonJS Node Implementation
 *
 * Implements proper BabylonJS modifier operations for OpenSCAD modifier types.
 * Supports disable (*), show only (!), debug (#), and background (%) modifiers.
 */

import type { AbstractMesh, Scene, StandardMaterial } from '@babylonjs/core';
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

const logger = createLogger('ModifierBabylonNode');

/**
 * Modifier types supported by OpenSCAD
 */
export type ModifierType = 'disable' | 'show_only' | 'debug' | 'background';

/**
 * Modifier BabylonJS Node
 *
 * Handles proper modifier operations for OpenSCAD modifier types with
 * accurate rendering control and OpenSCAD-compatible behavior.
 */
export class ModifierBabylonNode extends BabylonJSNode {
  private readonly modifierType: ModifierType;
  private readonly childNodes: BabylonJSNode[];
  private readonly parameters: Record<string, unknown>;

  constructor(
    name: string,
    scene: Scene | null,
    modifierType: ModifierType,
    originalOpenscadNode: ASTNode,
    childNodes: BabylonJSNode[] = [],
    sourceLocation?: SourceLocation
  ) {
    super(
      name,
      scene,
      BabylonJSNodeType.Disable, // Will be updated based on modifier type
      originalOpenscadNode,
      sourceLocation
    );

    this.modifierType = modifierType;
    this.childNodes = childNodes;
    this.parameters = this.extractParameters(originalOpenscadNode);

    logger.debug(`[INIT] Created modifier BabylonJS node for ${this.modifierType}`);
  }

  /**
   * Generate BabylonJS mesh with applied modifier operations
   */
  async generateMesh(): Promise<NodeGenerationResult> {
    logger.debug(`[GENERATE] Generating ${this.modifierType} modifier operation`);

    return tryCatchAsync(
      async () => {
        if (!this.scene) {
          throw this.createError('NO_SCENE', 'Scene is required for mesh generation');
        }

        if (this.childNodes.length === 0) {
          throw this.createError(
            'NO_CHILDREN',
            `Modifier ${this.modifierType} operation requires at least 1 child node`
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

        // Apply modifier operation to child meshes
        const resultMesh = await this.applyModifierOperation(childMeshes);

        // Set basic properties
        resultMesh.id = `${this.name}_${Date.now()}`;
        resultMesh.name = this.name;

        // Add metadata
        resultMesh.metadata = {
          isModifier: true,
          modifierType: this.modifierType,
          childCount: this.childNodes.length,
          parameters: this.parameters,
          sourceLocation: this.sourceLocation,
          generatedAt: new Date().toISOString(),
        };

        logger.debug(`[GENERATE] Generated ${this.modifierType} modifier operation successfully`);
        return resultMesh;
      },
      (error) => {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return this.createError(
          'MESH_GENERATION_FAILED',
          `Failed to generate ${this.modifierType} modifier: ${errorMessage}`
        );
      }
    );
  }

  /**
   * Apply the appropriate modifier operation based on type
   */
  private async applyModifierOperation(childMeshes: AbstractMesh[]): Promise<AbstractMesh> {
    switch (this.modifierType) {
      case 'disable':
        return this.applyDisableModifier(childMeshes);
      case 'show_only':
        return this.applyShowOnlyModifier(childMeshes);
      case 'debug':
        return this.applyDebugModifier(childMeshes);
      case 'background':
        return this.applyBackgroundModifier(childMeshes);
      default:
        throw new Error(`Unsupported modifier operation type: ${this.modifierType}`);
    }
  }

  /**
   * Apply disable modifier (*) - hide the mesh
   */
  private async applyDisableModifier(childMeshes: AbstractMesh[]): Promise<AbstractMesh> {
    logger.debug('[DISABLE] Applying disable modifier - hiding meshes');

    // Create a parent mesh to hold all children
    const parentMesh = await this.createParentMesh('disable');

    // Disable all child meshes
    for (const childMesh of childMeshes) {
      childMesh.isVisible = false;
      childMesh.setEnabled(false);
      childMesh.parent = parentMesh;
    }

    // Also disable the parent mesh
    parentMesh.isVisible = false;
    parentMesh.setEnabled(false);

    return parentMesh;
  }

  /**
   * Apply show only modifier (!) - show only this mesh, hide others
   */
  private async applyShowOnlyModifier(childMeshes: AbstractMesh[]): Promise<AbstractMesh> {
    logger.debug('[SHOW_ONLY] Applying show only modifier - highlighting meshes');

    // Create a parent mesh to hold all children
    const parentMesh = await this.createParentMesh('show_only');

    // Apply special show-only material to child meshes
    for (const childMesh of childMeshes) {
      const showOnlyMaterial = await this.createShowOnlyMaterial();
      childMesh.material = showOnlyMaterial;
      childMesh.parent = parentMesh;
    }

    // TODO: Implement scene-level logic to hide other meshes
    // This would require scene-level management which is beyond the scope of individual nodes

    return parentMesh;
  }

  /**
   * Apply debug modifier (#) - highlight the mesh for debugging
   */
  private async applyDebugModifier(childMeshes: AbstractMesh[]): Promise<AbstractMesh> {
    logger.debug('[DEBUG] Applying debug modifier - highlighting meshes');

    // Create a parent mesh to hold all children
    const parentMesh = await this.createParentMesh('debug');

    // Apply debug material to child meshes
    for (const childMesh of childMeshes) {
      const debugMaterial = await this.createDebugMaterial();
      childMesh.material = debugMaterial;
      childMesh.parent = parentMesh;
    }

    return parentMesh;
  }

  /**
   * Apply background modifier (%) - make the mesh transparent
   */
  private async applyBackgroundModifier(childMeshes: AbstractMesh[]): Promise<AbstractMesh> {
    logger.debug('[BACKGROUND] Applying background modifier - making meshes transparent');

    // Create a parent mesh to hold all children
    const parentMesh = await this.createParentMesh('background');

    // Apply transparent material to child meshes
    for (const childMesh of childMeshes) {
      const backgroundMaterial = await this.createBackgroundMaterial();
      childMesh.material = backgroundMaterial;
      childMesh.parent = parentMesh;
    }

    return parentMesh;
  }

  /**
   * Create a parent mesh to hold child meshes
   */
  private async createParentMesh(modifierType: string): Promise<AbstractMesh> {
    const { MeshBuilder } = await import('@babylonjs/core');

    // Create an invisible parent mesh
    const parentMesh = MeshBuilder.CreateBox(
      `${this.name}_${modifierType}_parent`,
      { size: 0.001 },
      this.scene!
    );
    parentMesh.isVisible = false;

    return parentMesh;
  }

  /**
   * Create debug material (bright red/yellow for highlighting)
   */
  private async createDebugMaterial(): Promise<StandardMaterial> {
    const { StandardMaterial, Color3 } = await import('@babylonjs/core');

    const material = new StandardMaterial(`${this.name}_debug_material`, this.scene!);
    material.diffuseColor = new Color3(1, 0, 0); // Bright red
    material.emissiveColor = new Color3(0.2, 0, 0); // Slight glow
    material.specularColor = new Color3(0.5, 0.5, 0.5);

    return material;
  }

  /**
   * Create show-only material (bright highlighting)
   */
  private async createShowOnlyMaterial(): Promise<StandardMaterial> {
    const { StandardMaterial, Color3 } = await import('@babylonjs/core');

    const material = new StandardMaterial(`${this.name}_show_only_material`, this.scene!);
    material.diffuseColor = new Color3(1, 1, 0); // Bright yellow
    material.emissiveColor = new Color3(0.3, 0.3, 0); // Yellow glow
    material.specularColor = new Color3(0.8, 0.8, 0.8);

    return material;
  }

  /**
   * Create background material (transparent)
   */
  private async createBackgroundMaterial(): Promise<StandardMaterial> {
    const { StandardMaterial, Color3 } = await import('@babylonjs/core');

    const material = new StandardMaterial(`${this.name}_background_material`, this.scene!);
    material.diffuseColor = new Color3(0.7, 0.7, 0.7); // Light gray
    material.alpha = 0.3; // Transparent
    material.specularColor = new Color3(0.2, 0.2, 0.2);

    return material;
  }

  /**
   * Extract parameters from the original OpenSCAD node
   */
  private extractParameters(node: ASTNode): Record<string, unknown> {
    const params: Record<string, unknown> = {
      type: node.type,
      modifierType: this.modifierType,
    };

    // Modifiers typically don't have additional parameters
    // They just affect rendering behavior

    return params;
  }

  /**
   * Validate the modifier node
   */
  validateNode(): NodeValidationResult {
    return tryCatch(
      () => {
        if (!this.name || this.name.trim() === '') {
          throw this.createError('INVALID_NAME', 'Node name cannot be empty');
        }

        if (!this.modifierType) {
          throw this.createError('MISSING_MODIFIER_TYPE', 'Modifier type is required');
        }

        if (this.childNodes.length === 0) {
          throw this.createError(
            'NO_CHILDREN',
            `Modifier ${this.modifierType} operation requires at least 1 child node`
          );
        }

        // Validate all child nodes
        for (const childNode of this.childNodes) {
          const childValidation = childNode.validateNode();
          if (!childValidation.success) {
            throw new Error(`Child node validation failed: ${childValidation.error.message}`);
          }
        }

        logger.debug(
          `[VALIDATE] Modifier node ${this.name} (${this.modifierType}) validated successfully`
        );
      },
      (error) => {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return this.createError('VALIDATION_FAILED', `Node validation failed: ${errorMessage}`);
      }
    );
  }

  /**
   * Clone the modifier node
   */
  clone(): ModifierBabylonNode {
    const clonedChildNodes = this.childNodes.map((child) => child.clone());

    const clonedNode = new ModifierBabylonNode(
      `${this.name}_clone_${Date.now()}`,
      this.scene,
      this.modifierType,
      this.originalOpenscadNode as ASTNode,
      clonedChildNodes,
      this.sourceLocation
    );

    logger.debug(`[CLONE] Cloned modifier node ${this.name} to ${clonedNode.name}`);
    return clonedNode;
  }

  /**
   * Get debug information specific to modifier nodes
   */
  override getDebugInfo(): Record<string, unknown> {
    return {
      ...super.getDebugInfo(),
      modifierType: this.modifierType,
      parameters: this.parameters,
      childCount: this.childNodes.length,
      isModifier: true,
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
