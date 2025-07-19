/**
 * @file OpenSCAD Material Service
 *
 * Service for converting OpenSCAD color() directives to BabylonJS materials.
 * Handles color inheritance, named colors, and material property mapping.
 *
 * @example
 * ```typescript
 * const materialService = new OpenSCADMaterialService(scene);
 *
 * // Convert OpenSCAD color to material
 * const result = await materialService.createMaterialFromColor({
 *   color: [1, 0, 0, 0.8], // Red with 80% opacity
 *   name: 'red_material'
 * });
 * ```
 */

import {
  Color3,
  Color4,
  Material,
  PBRMaterial,
  type Scene,
  StandardMaterial,
} from '@babylonjs/core';
import { createLogger } from '../../../../shared/services/logger.service';
import type { Result } from '../../../../shared/types/result.types';
import { tryCatch, tryCatchAsync } from '../../../../shared/utils/functional/result';
import type { ColorNode } from '../../../openscad-parser/ast/ast-types';

const logger = createLogger('OpenSCADMaterial');

/**
 * OpenSCAD color specification
 */
export interface OpenSCADColor {
  readonly color:
    | string
    | readonly [number, number, number]
    | readonly [number, number, number, number];
  readonly alpha?: number;
  readonly name?: string;
}

/**
 * Material creation configuration
 */
export interface MaterialFromColorConfig {
  readonly color:
    | string
    | readonly [number, number, number]
    | readonly [number, number, number, number];
  readonly alpha?: number;
  readonly name: string;
  readonly materialType?: 'standard' | 'pbr';
  readonly inheritParent?: boolean;
  readonly parentMaterial?: Material;
}

/**
 * OpenSCAD named colors mapping
 */
export const OPENSCAD_NAMED_COLORS: Record<string, readonly [number, number, number]> = {
  // Basic colors
  red: [1, 0, 0],
  green: [0, 1, 0],
  blue: [0, 0, 1],
  yellow: [1, 1, 0],
  cyan: [0, 1, 1],
  magenta: [1, 0, 1],
  white: [1, 1, 1],
  black: [0, 0, 0],
  gray: [0.5, 0.5, 0.5],
  grey: [0.5, 0.5, 0.5],

  // Extended colors
  orange: [1, 0.5, 0],
  purple: [0.5, 0, 0.5],
  brown: [0.6, 0.3, 0.1],
  pink: [1, 0.75, 0.8],
  lime: [0.5, 1, 0],
  navy: [0, 0, 0.5],
  maroon: [0.5, 0, 0],
  olive: [0.5, 0.5, 0],
  teal: [0, 0.5, 0.5],
  silver: [0.75, 0.75, 0.75],
} as const;

/**
 * Material creation error
 */
export interface OpenSCADMaterialError {
  readonly code:
    | 'INVALID_COLOR'
    | 'MATERIAL_CREATION_FAILED'
    | 'SCENE_NOT_PROVIDED'
    | 'COLOR_PARSING_FAILED';
  readonly message: string;
  readonly timestamp: Date;
  readonly colorValue?: unknown;
  readonly details?: Record<string, unknown>;
}

/**
 * OpenSCAD Material Service
 *
 * Converts OpenSCAD color() directives to BabylonJS materials with proper
 * color handling, transparency, and material inheritance.
 */
export class OpenSCADMaterialService {
  private readonly scene: Scene;
  private readonly materialCache = new Map<string, Material>();

  constructor(scene: Scene) {
    this.scene = scene;
    logger.init('[INIT] OpenSCADMaterial service initialized');
  }

  /**
   * Create material from OpenSCAD color directive
   */
  async createMaterialFromColor(
    config: MaterialFromColorConfig
  ): Promise<Result<Material, OpenSCADMaterialError>> {
    logger.debug(`[CREATE_MATERIAL] Creating material from color: ${JSON.stringify(config.color)}`);
    const startTime = performance.now();

    return tryCatchAsync(
      async () => {
        // Check cache first
        const cacheKey = this.generateCacheKey(config);
        const cachedMaterial = this.materialCache.get(cacheKey);
        if (cachedMaterial) {
          logger.debug(`[CREATE_MATERIAL] Using cached material: ${cacheKey}`);
          return cachedMaterial;
        }

        // Parse color to RGBA
        const rgba = this.parseColorToRGBA(config.color, config.alpha);
        if (!rgba.success) {
          throw rgba.error;
        }

        // Create material based on type
        const material =
          config.materialType === 'pbr'
            ? this.createPBRMaterial(config.name, rgba.data)
            : this.createStandardMaterial(config.name, rgba.data);

        // Handle parent material inheritance
        if (config.inheritParent && config.parentMaterial) {
          this.inheritMaterialProperties(material, config.parentMaterial);
        }

        // Cache the material
        this.materialCache.set(cacheKey, material);

        logger.debug(
          `[CREATE_MATERIAL] Material created in ${(performance.now() - startTime).toFixed(2)}ms`
        );
        return material;
      },
      (error) =>
        this.createError(
          'MATERIAL_CREATION_FAILED',
          `Failed to create material: ${error}`,
          config.color
        )
    );
  }

  /**
   * Create material from ColorNode AST
   */
  async createMaterialFromColorNode(
    colorNode: ColorNode,
    name: string,
    materialType: 'standard' | 'pbr' = 'standard'
  ): Promise<Result<Material, OpenSCADMaterialError>> {
    logger.debug(`[CREATE_FROM_NODE] Creating material from ColorNode: ${name}`);

    return tryCatchAsync(
      async () => {
        const config: MaterialFromColorConfig = {
          color:
            typeof colorNode.c === 'string'
              ? colorNode.c
              : colorNode.c.length === 3
                ? (colorNode.c as unknown as readonly [number, number, number])
                : (colorNode.c as unknown as readonly [number, number, number, number]),
          name,
          materialType,
        };

        const result = await this.createMaterialFromColor(config);
        if (!result.success) {
          throw result.error;
        }

        return result.data;
      },
      (error) =>
        this.createError(
          'MATERIAL_CREATION_FAILED',
          `Failed to create material from ColorNode: ${error}`
        )
    );
  }

  /**
   * Parse OpenSCAD color to RGBA values
   */
  private parseColorToRGBA(
    color: string | readonly [number, number, number] | readonly [number, number, number, number],
    alpha?: number
  ): Result<Color4, OpenSCADMaterialError> {
    return tryCatch(
      () => {
        if (typeof color === 'string') {
          // Handle named colors
          const namedColor = OPENSCAD_NAMED_COLORS[color.toLowerCase()];
          if (!namedColor) {
            throw this.createError('INVALID_COLOR', `Unknown named color: ${color}`, color);
          }
          return new Color4(namedColor[0], namedColor[1], namedColor[2], alpha ?? 1.0);
        }

        if (Array.isArray(color)) {
          if (color.length === 3) {
            // RGB format
            return new Color4(color[0], color[1], color[2], alpha ?? 1.0);
          } else if (color.length === 4) {
            // RGBA format
            return new Color4(color[0], color[1], color[2], color[3]);
          } else {
            throw this.createError(
              'INVALID_COLOR',
              `Invalid color array length: ${color.length}`,
              color
            );
          }
        }

        throw this.createError('INVALID_COLOR', `Invalid color format: ${typeof color}`, color);
      },
      (error) => error as OpenSCADMaterialError
    );
  }

  /**
   * Create standard material with color
   */
  private createStandardMaterial(name: string, color: Color4): StandardMaterial {
    const material = new StandardMaterial(name, this.scene);

    // Set diffuse color (RGB)
    material.diffuseColor = new Color3(color.r, color.g, color.b);

    // Handle transparency
    if (color.a < 1.0) {
      material.alpha = color.a;
      material.transparencyMode = Material.MATERIAL_ALPHABLEND;
    }

    // Set material properties for good CAD visualization
    material.specularColor = new Color3(0.1, 0.1, 0.1);
    material.emissiveColor = new Color3(0, 0, 0);
    material.ambientColor = new Color3(0.1, 0.1, 0.1);

    return material;
  }

  /**
   * Create PBR material with color
   */
  private createPBRMaterial(name: string, color: Color4): PBRMaterial {
    const material = new PBRMaterial(name, this.scene);

    // Set base color (RGBA)
    material.albedoColor = new Color3(color.r, color.g, color.b);

    // Handle transparency
    if (color.a < 1.0) {
      material.alpha = color.a;
      material.transparencyMode = Material.MATERIAL_ALPHABLEND;
    }

    // Set PBR properties for good CAD visualization
    material.metallic = 0.1;
    material.roughness = 0.8;
    material.emissiveColor = new Color3(0, 0, 0);

    return material;
  }

  /**
   * Inherit properties from parent material
   */
  private inheritMaterialProperties(material: Material, parentMaterial: Material): void {
    // Copy common properties that should be inherited
    if (parentMaterial instanceof StandardMaterial && material instanceof StandardMaterial) {
      material.specularColor = parentMaterial.specularColor.clone();
      material.ambientColor = parentMaterial.ambientColor.clone();
    } else if (parentMaterial instanceof PBRMaterial && material instanceof PBRMaterial) {
      material.metallic = parentMaterial.metallic;
      material.roughness = parentMaterial.roughness;
    }
  }

  /**
   * Generate cache key for material
   */
  private generateCacheKey(config: MaterialFromColorConfig): string {
    const colorStr = Array.isArray(config.color) ? config.color.join(',') : config.color;
    return `${config.materialType || 'standard'}_${colorStr}_${config.alpha || 1.0}`;
  }

  /**
   * Get material from cache
   */
  getMaterialFromCache(cacheKey: string): Material | undefined {
    return this.materialCache.get(cacheKey);
  }

  /**
   * Clear material cache
   */
  clearCache(): void {
    this.materialCache.clear();
    logger.debug('[CLEAR_CACHE] Material cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.materialCache.size,
      keys: Array.from(this.materialCache.keys()),
    };
  }

  /**
   * Create an OpenSCAD material error
   */
  private createError(
    code: OpenSCADMaterialError['code'],
    message: string,
    colorValue?: unknown,
    details?: Record<string, unknown>
  ): OpenSCADMaterialError {
    const error: OpenSCADMaterialError = {
      code,
      message,
      timestamp: new Date(),
      ...(colorValue !== undefined && { colorValue }),
      ...(details && { details }),
    };

    return error;
  }

  /**
   * Dispose service and clean up resources
   */
  dispose(): void {
    // Dispose all cached materials
    for (const material of this.materialCache.values()) {
      material.dispose();
    }
    this.materialCache.clear();
    logger.debug('[DISPOSE] OpenSCADMaterial service disposed');
  }
}
