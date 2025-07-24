/**
 * @file material-factory.ts
 * @description Factory for creating standardized materials for axis rendering
 * Centralizes material creation logic to eliminate duplication across axis creators
 */

import { Color3, StandardMaterial, type Scene } from '@babylonjs/core';
import type { Result } from '../../../../../../shared/types/result.types';

/**
 * Configuration for creating axis materials
 */
export interface MaterialConfig {
  readonly name: string;
  readonly color: Color3;
  readonly opacity?: number;
  readonly emissiveScale?: number;
  readonly disableLighting?: boolean;
}

/**
 * Error types for material creation
 */
export interface MaterialCreationError {
  readonly type: 'SCENE_NULL' | 'MATERIAL_CREATION_FAILED';
  readonly message: string;
  readonly details?: unknown;
}

/**
 * Factory for creating standardized materials for axis rendering
 * 
 * @example
 * ```typescript
 * const factory = new MaterialFactory();
 * const result = factory.createAxisMaterial(scene, {
 *   name: 'XAxisMaterial',
 *   color: new Color3(1, 0, 0),
 *   opacity: 1.0
 * });
 * ```
 */
export class MaterialFactory {
  /**
   * Creates a standard material for axis rendering
   * 
   * @param scene - BabylonJS scene
   * @param config - Material configuration
   * @returns Result containing the created material or error
   */
  createAxisMaterial(
    scene: Scene | null,
    config: MaterialConfig
  ): Result<StandardMaterial, MaterialCreationError> {
    if (!scene) {
      return {
        success: false,
        error: {
          type: 'SCENE_NULL',
          message: 'Scene is null, cannot create material',
        },
      };
    }

    try {
      const material = new StandardMaterial(config.name, scene);
      
      // Set base color properties
      material.diffuseColor = config.color;
      material.emissiveColor = config.color.scale(config.emissiveScale ?? 0.8);
      material.specularColor = new Color3(1, 1, 1);
      
      // Set opacity
      material.alpha = config.opacity ?? 1.0;
      
      // Disable lighting if requested (common for axis lines)
      if (config.disableLighting) {
        material.disableLighting = true;
      }

      return {
        success: true,
        data: material,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          type: 'MATERIAL_CREATION_FAILED',
          message: `Failed to create material: ${error instanceof Error ? error.message : 'Unknown error'}`,
          details: error,
        },
      };
    }
  }

  /**
   * Creates a material specifically for solid axis lines
   * 
   * @param scene - BabylonJS scene
   * @param name - Material name
   * @param color - Line color
   * @returns Result containing the created material or error
   */
  createSolidLineMaterial(
    scene: Scene | null,
    name: string,
    color: Color3
  ): Result<StandardMaterial, MaterialCreationError> {
    return this.createAxisMaterial(scene, {
      name,
      color,
      opacity: 1.0,
      emissiveScale: 0.8,
      disableLighting: true,
    });
  }

  /**
   * Creates a material specifically for dotted axis lines
   * 
   * @param scene - BabylonJS scene
   * @param name - Material name
   * @param color - Line color
   * @returns Result containing the created material or error
   */
  createDottedLineMaterial(
    scene: Scene | null,
    name: string,
    color: Color3
  ): Result<StandardMaterial, MaterialCreationError> {
    return this.createAxisMaterial(scene, {
      name,
      color,
      opacity: 0.9, // Slightly transparent for dotted effect
      emissiveScale: 0.8,
      disableLighting: true,
    });
  }

  /**
   * Creates a material for 3D cylinder axes
   * 
   * @param scene - BabylonJS scene
   * @param name - Material name
   * @param color - Cylinder color
   * @param opacity - Material opacity
   * @returns Result containing the created material or error
   */
  createCylinderMaterial(
    scene: Scene | null,
    name: string,
    color: Color3,
    opacity: number = 1.0
  ): Result<StandardMaterial, MaterialCreationError> {
    return this.createAxisMaterial(scene, {
      name,
      color,
      opacity,
      emissiveScale: 0.8,
      disableLighting: false, // Keep lighting for 3D appearance
    });
  }
}

/**
 * Default material factory instance
 */
export const defaultMaterialFactory = new MaterialFactory();
