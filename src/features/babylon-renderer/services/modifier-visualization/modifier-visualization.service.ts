/**
 * @file Modifier Visualization Service
 *
 * Service for applying OpenSCAD modifier visualizations to BabylonJS meshes.
 * Handles debug (#), background (%), disable (*), and root (!) modifiers.
 *
 * @example
 * ```typescript
 * const modifierService = new ModifierVisualizationService(scene);
 *
 * // Apply debug modifier visualization
 * const result = await modifierService.applyModifier(mesh, {
 *   type: 'debug',
 *   intensity: 1.0,
 *   preserveOriginal: true
 * });
 * ```
 */

import {
  type AbstractMesh,
  Color3,
  CreateLines,
  type LinesMesh,
  Material,
  Mesh,
  type Scene,
  StandardMaterial,
  Vector3,
} from '@babylonjs/core';
import { createLogger } from '../../../../shared/services/logger.service';
import type { Result } from '../../../../shared/types/result.types';
import { tryCatchAsync } from '../../../../shared/utils/functional/result';
import type { ASTNode } from '../../../openscad-parser/ast/ast-types';

const logger = createLogger('ModifierVisualization');

/**
 * OpenSCAD modifier types
 */
export type OpenSCADModifierType = 'debug' | 'background' | 'disable' | 'root';

/**
 * Modifier visualization configuration
 */
export interface ModifierVisualizationConfig {
  readonly type: OpenSCADModifierType;
  readonly intensity?: number;
  readonly preserveOriginal?: boolean;
  readonly color?: Color3;
  readonly wireframeOnly?: boolean;
  readonly transparency?: number;
}

/**
 * Modifier application result
 */
export interface ModifierApplicationResult {
  readonly originalMesh: AbstractMesh;
  readonly modifiedMesh?: AbstractMesh;
  readonly wireframeMesh?: LinesMesh;
  readonly modifierType: OpenSCADModifierType;
  readonly applied: boolean;
}

/**
 * Modifier visualization error
 */
export interface ModifierVisualizationError {
  readonly code:
    | 'INVALID_MODIFIER'
    | 'MESH_NOT_PROVIDED'
    | 'MATERIAL_CREATION_FAILED'
    | 'APPLICATION_FAILED';
  readonly message: string;
  readonly timestamp: Date;
  readonly modifierType?: OpenSCADModifierType;
  readonly details?: Record<string, unknown>;
}

/**
 * Modifier state for tracking applied modifiers
 */
export interface ModifierState {
  readonly meshId: string;
  readonly modifierType: OpenSCADModifierType;
  readonly config: ModifierVisualizationConfig;
  readonly appliedAt: Date;
  readonly originalMaterial?: Material | null;
}

/**
 * Modifier Visualization Service
 *
 * Provides OpenSCAD modifier visualization capabilities for BabylonJS meshes.
 * Handles all four OpenSCAD modifier types with appropriate visual treatments.
 */
export class ModifierVisualizationService {
  private readonly scene: Scene;
  private readonly modifierStates = new Map<string, ModifierState>();
  private readonly modifierMaterials = new Map<string, Material>();

  constructor(scene: Scene) {
    this.scene = scene;
    this.initializeModifierMaterials();
    logger.init('[INIT] ModifierVisualization service initialized');
  }

  /**
   * Apply modifier visualization to a mesh
   */
  async applyModifier(
    mesh: AbstractMesh,
    config: ModifierVisualizationConfig
  ): Promise<Result<ModifierApplicationResult, ModifierVisualizationError>> {
    return tryCatchAsync(
      async () => {
        if (!mesh) {
          throw this.createError('MESH_NOT_PROVIDED', 'Mesh is required for modifier application');
        }

        logger.debug(
          `[APPLY_MODIFIER] Applying ${config.type} modifier to mesh: ${mesh?.name || 'unknown'}`
        );
        const startTime = performance.now();

        // Store original state
        const originalMaterial = mesh.material;

        // Apply modifier based on type
        let result: ModifierApplicationResult;

        switch (config.type) {
          case 'debug':
            result = await this.applyDebugModifier(mesh, config);
            break;
          case 'background':
            result = await this.applyBackgroundModifier(mesh, config);
            break;
          case 'disable':
            result = await this.applyDisableModifier(mesh, config);
            break;
          case 'root':
            result = await this.applyRootModifier(mesh, config);
            break;
          default:
            throw this.createError(
              'INVALID_MODIFIER',
              `Unknown modifier type: ${config.type}`,
              config.type
            );
        }

        // Store modifier state
        this.modifierStates.set(mesh.id, {
          meshId: mesh.id,
          modifierType: config.type,
          config,
          appliedAt: new Date(),
          originalMaterial, // Store even if null
        });

        logger.debug(
          `[APPLY_MODIFIER] Applied ${config.type} modifier in ${(performance.now() - startTime).toFixed(2)}ms`
        );
        return result;
      },
      (error) =>
        this.createError('APPLICATION_FAILED', `Failed to apply modifier: ${error}`, config.type)
    );
  }

  /**
   * Apply debug modifier (#) - wireframe highlighting
   */
  private async applyDebugModifier(
    mesh: AbstractMesh,
    config: ModifierVisualizationConfig
  ): Promise<ModifierApplicationResult> {
    const debugColor = config.color || new Color3(1, 0, 1); // Magenta
    const intensity = config.intensity || 1.0;

    // Create debug material
    const debugMaterial = this.createDebugMaterial(debugColor, intensity);

    let wireframeMesh: LinesMesh | undefined;

    if (mesh instanceof Mesh) {
      // Create wireframe overlay
      wireframeMesh = this.createWireframeOverlay(mesh, debugColor);

      if (!config.wireframeOnly) {
        // Apply debug material to original mesh
        mesh.material = debugMaterial;
      }
    }

    const clonedMesh = config.preserveOriginal ? mesh.clone(`${mesh.name}_debug`, null) : mesh;

    return {
      originalMesh: mesh,
      modifierType: 'debug',
      applied: true,
      ...(clonedMesh && { modifiedMesh: clonedMesh }),
      ...(wireframeMesh && { wireframeMesh }),
    };
  }

  /**
   * Apply background modifier (%) - transparency
   */
  private async applyBackgroundModifier(
    mesh: AbstractMesh,
    config: ModifierVisualizationConfig
  ): Promise<ModifierApplicationResult> {
    const transparency = config.transparency || 0.3;

    // Create transparent material
    const backgroundMaterial = this.createBackgroundMaterial(transparency);
    mesh.material = backgroundMaterial;

    return {
      originalMesh: mesh,
      modifiedMesh: mesh,
      modifierType: 'background',
      applied: true,
    };
  }

  /**
   * Apply disable modifier (*) - hide mesh
   */
  private async applyDisableModifier(
    mesh: AbstractMesh,
    _config: ModifierVisualizationConfig
  ): Promise<ModifierApplicationResult> {
    // Hide the mesh
    mesh.setEnabled(false);
    mesh.isVisible = false;

    return {
      originalMesh: mesh,
      modifiedMesh: mesh,
      modifierType: 'disable',
      applied: true,
    };
  }

  /**
   * Apply root modifier (!) - special highlighting
   */
  private async applyRootModifier(
    mesh: AbstractMesh,
    config: ModifierVisualizationConfig
  ): Promise<ModifierApplicationResult> {
    const rootColor = config.color || new Color3(1, 1, 0); // Yellow
    const intensity = config.intensity || 1.2;

    // Create root highlighting material
    const rootMaterial = this.createRootMaterial(rootColor, intensity);
    mesh.material = rootMaterial;

    // Add outline effect if mesh supports it
    let wireframeMesh: LinesMesh | undefined;
    if (mesh instanceof Mesh) {
      wireframeMesh = this.createWireframeOverlay(mesh, rootColor);
    }

    return {
      originalMesh: mesh,
      modifiedMesh: mesh,
      modifierType: 'root',
      applied: true,
      ...(wireframeMesh && { wireframeMesh }),
    };
  }

  /**
   * Remove modifier from mesh
   */
  async removeModifier(mesh: AbstractMesh): Promise<Result<void, ModifierVisualizationError>> {
    return tryCatchAsync(
      async () => {
        const state = this.modifierStates.get(mesh.id);
        if (!state) {
          logger.debug(`[REMOVE_MODIFIER] No modifier state found for mesh: ${mesh.name}`);
          return;
        }

        // Restore original state (including null)
        mesh.material = state.originalMaterial || null;

        // Re-enable mesh if it was disabled
        if (state.modifierType === 'disable') {
          mesh.setEnabled(true);
          mesh.isVisible = true;
        }

        // Remove wireframe overlays
        const wireframes = this.scene.meshes.filter((m) =>
          m.name.startsWith(`${mesh.name}_wireframe`)
        );
        for (const wireframe of wireframes) {
          wireframe.dispose();
        }

        // Clean up state
        this.modifierStates.delete(mesh.id);

        logger.debug(
          `[REMOVE_MODIFIER] Removed ${state.modifierType} modifier from mesh: ${mesh.name}`
        );
      },
      (error) => this.createError('APPLICATION_FAILED', `Failed to remove modifier: ${error}`)
    );
  }

  /**
   * Detect modifier from AST node
   */
  detectModifierFromAST(astNode: ASTNode): OpenSCADModifierType | null {
    // Check for modifier prefixes in the AST node type as string
    const nodeType = astNode.type as string;

    if (nodeType === 'debug' || nodeType.includes('debug')) {
      return 'debug';
    }
    if (nodeType === 'background' || nodeType.includes('background')) {
      return 'background';
    }
    if (nodeType === 'disable' || nodeType.includes('disable')) {
      return 'disable';
    }
    if (nodeType === 'show_only' || nodeType.includes('show_only')) {
      return 'root';
    }

    return null;
  }

  /**
   * Get modifier state for mesh
   */
  getModifierState(meshId: string): ModifierState | undefined {
    return this.modifierStates.get(meshId);
  }

  /**
   * Get all modifier states
   */
  getAllModifierStates(): ModifierState[] {
    return Array.from(this.modifierStates.values());
  }

  /**
   * Initialize default modifier materials
   */
  private initializeModifierMaterials(): void {
    // Debug material (magenta wireframe)
    const debugMaterial = new StandardMaterial('debug_modifier_material', this.scene);
    debugMaterial.diffuseColor = new Color3(1, 0, 1);
    debugMaterial.emissiveColor = new Color3(0.2, 0, 0.2);
    debugMaterial.wireframe = true;
    this.modifierMaterials.set('debug', debugMaterial);

    // Background material (transparent)
    const backgroundMaterial = new StandardMaterial('background_modifier_material', this.scene);
    backgroundMaterial.diffuseColor = new Color3(0.8, 0.8, 0.8);
    backgroundMaterial.alpha = 0.3;
    backgroundMaterial.transparencyMode = Material.MATERIAL_ALPHABLEND;
    this.modifierMaterials.set('background', backgroundMaterial);

    // Root material (yellow highlight)
    const rootMaterial = new StandardMaterial('root_modifier_material', this.scene);
    rootMaterial.diffuseColor = new Color3(1, 1, 0);
    rootMaterial.emissiveColor = new Color3(0.2, 0.2, 0);
    this.modifierMaterials.set('root', rootMaterial);
  }

  /**
   * Create debug material
   */
  private createDebugMaterial(color: Color3, intensity: number): StandardMaterial {
    const material = new StandardMaterial(`debug_${Date.now()}`, this.scene);
    material.diffuseColor = color;
    material.emissiveColor = color.scale(0.2 * intensity);
    material.wireframe = true;
    return material;
  }

  /**
   * Create background material
   */
  private createBackgroundMaterial(transparency: number): StandardMaterial {
    const material = new StandardMaterial(`background_${Date.now()}`, this.scene);
    material.diffuseColor = new Color3(0.8, 0.8, 0.8);
    material.alpha = 1.0 - transparency;
    material.transparencyMode = Material.MATERIAL_ALPHABLEND;
    return material;
  }

  /**
   * Create root material
   */
  private createRootMaterial(color: Color3, intensity: number): StandardMaterial {
    const material = new StandardMaterial(`root_${Date.now()}`, this.scene);
    material.diffuseColor = color;
    material.emissiveColor = color.scale(0.2 * intensity);
    return material;
  }

  /**
   * Create wireframe overlay
   */
  private createWireframeOverlay(mesh: Mesh, color: Color3): LinesMesh {
    // Get mesh vertices and create wireframe lines
    const positions = mesh.getVerticesData('position');
    const indices = mesh.getIndices();

    if (!positions || !indices) {
      // Fallback: create a simple wireframe
      const lines: Vector3[] = [];
      const wireframe = CreateLines(`${mesh.name}_wireframe`, { points: lines }, this.scene);
      wireframe.color = color;
      wireframe.parent = mesh;
      return wireframe;
    }

    // Create edge lines from mesh geometry
    const lines: Vector3[] = [];
    for (let i = 0; i < indices.length; i += 3) {
      const idx1 = indices[i];
      const idx2 = indices[i + 1];
      const idx3 = indices[i + 2];

      if (idx1 === undefined || idx2 === undefined || idx3 === undefined) {
        continue;
      }

      const i1 = idx1 * 3;
      const i2 = idx2 * 3;
      const i3 = idx3 * 3;

      const v1 = new Vector3(positions[i1], positions[i1 + 1], positions[i1 + 2]);
      const v2 = new Vector3(positions[i2], positions[i2 + 1], positions[i2 + 2]);
      const v3 = new Vector3(positions[i3], positions[i3 + 1], positions[i3 + 2]);

      lines.push(v1, v2, v2, v3, v3, v1);
    }

    const wireframe = CreateLines(`${mesh.name}_wireframe`, { points: lines }, this.scene);
    wireframe.color = color;
    wireframe.parent = mesh;
    return wireframe;
  }

  /**
   * Create a modifier visualization error
   */
  private createError(
    code: ModifierVisualizationError['code'],
    message: string,
    modifierType?: OpenSCADModifierType,
    details?: Record<string, unknown>
  ): ModifierVisualizationError {
    const error: ModifierVisualizationError = {
      code,
      message,
      timestamp: new Date(),
      ...(modifierType && { modifierType }),
      ...(details && { details }),
    };

    return error;
  }

  /**
   * Dispose service and clean up resources
   */
  dispose(): void {
    // Dispose all modifier materials
    for (const material of this.modifierMaterials.values()) {
      material.dispose();
    }
    this.modifierMaterials.clear();
    this.modifierStates.clear();
    logger.debug('[DISPOSE] ModifierVisualization service disposed');
  }
}
