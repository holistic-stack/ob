/**
 * @file BabylonJS Advanced Material Service
 *
 * Service for managing advanced PBR materials with node-based material editor support.
 * Provides comprehensive material creation and management capabilities.
 */

import {
  type AbstractMesh,
  Color3,
  type Material,
  NodeMaterial,
  PBRMaterial,
  type Scene,
  Texture,
  Vector2,
  Vector3,
} from '@babylonjs/core';
import { createLogger } from '../../../../shared/services/logger.service';
import type { Result } from '../../../../shared/types/result.types';
import { tryCatch, tryCatchAsync } from '../../../../shared/utils/functional/result';

const logger = createLogger('BabylonMaterialService');

/**
 * Material types
 */
export enum MaterialType {
  PBR = 'pbr',
  STANDARD = 'standard',
  NODE = 'node',
}

/**
 * PBR material configuration
 */
export interface PBRMaterialConfig {
  readonly name: string;
  readonly baseColor: Color3;
  readonly metallicFactor: number;
  readonly roughnessFactor: number;
  readonly emissiveColor: Color3;
  readonly emissiveIntensity: number;
  readonly normalScale: number;
  readonly occlusionStrength: number;
  readonly alphaCutOff: number;
  readonly transparencyMode: number;
  readonly indexOfRefraction: number;
  readonly clearCoat: PBRClearCoatConfig;
  readonly sheen: PBRSheenConfig;
  readonly anisotropy: PBRAnisotropyConfig;
  readonly textures: PBRTextureConfig;
}

/**
 * PBR clear coat configuration
 */
export interface PBRClearCoatConfig {
  readonly enabled: boolean;
  readonly intensity: number;
  readonly roughness: number;
  readonly indexOfRefraction: number;
  readonly tint: Color3;
}

/**
 * PBR sheen configuration
 */
export interface PBRSheenConfig {
  readonly enabled: boolean;
  readonly intensity: number;
  readonly color: Color3;
  readonly roughness: number;
}

/**
 * PBR anisotropy configuration
 */
export interface PBRAnisotropyConfig {
  readonly enabled: boolean;
  readonly intensity: number;
  readonly direction: Vector3;
}

/**
 * PBR texture configuration
 */
export interface PBRTextureConfig {
  readonly baseColorTexture?: string;
  readonly metallicRoughnessTexture?: string;
  readonly normalTexture?: string;
  readonly emissiveTexture?: string;
  readonly occlusionTexture?: string;
  readonly clearCoatTexture?: string;
  readonly clearCoatNormalTexture?: string;
  readonly sheenTexture?: string;
  readonly anisotropyTexture?: string;
}

/**
 * Node material configuration
 */
export interface NodeMaterialConfig {
  readonly name: string;
  readonly nodeDefinition: string; // JSON string of node graph
  readonly inputs: Record<string, unknown>;
  readonly outputs: Record<string, unknown>;
}

/**
 * Material state
 */
export interface MaterialState {
  readonly id: string;
  readonly name: string;
  readonly type: MaterialType;
  readonly isReady: boolean;
  readonly appliedMeshes: readonly string[];
  readonly lastUpdated: Date;
}

/**
 * Material error types
 */
export interface MaterialError {
  readonly code: MaterialErrorCode;
  readonly message: string;
  readonly details?: unknown;
  readonly timestamp: Date;
}

export enum MaterialErrorCode {
  CREATION_FAILED = 'CREATION_FAILED',
  TEXTURE_LOAD_FAILED = 'TEXTURE_LOAD_FAILED',
  INVALID_CONFIG = 'INVALID_CONFIG',
  SCENE_NOT_PROVIDED = 'SCENE_NOT_PROVIDED',
  MATERIAL_NOT_FOUND = 'MATERIAL_NOT_FOUND',
  NODE_COMPILATION_FAILED = 'NODE_COMPILATION_FAILED',
}

/**
 * Material operation results
 */
export type MaterialCreateResult = Result<Material, MaterialError>;
export type MaterialApplyResult = Result<void, MaterialError>;
export type MaterialUpdateResult = Result<void, MaterialError>;

/**
 * Default PBR material configuration
 */
export const DEFAULT_PBR_CONFIG: PBRMaterialConfig = {
  name: 'default-pbr',
  baseColor: new Color3(1, 1, 1),
  metallicFactor: 0.0,
  roughnessFactor: 1.0,
  emissiveColor: new Color3(0, 0, 0),
  emissiveIntensity: 1.0,
  normalScale: 1.0,
  occlusionStrength: 1.0,
  alphaCutOff: 0.5,
  transparencyMode: 0,
  indexOfRefraction: 1.5,
  clearCoat: {
    enabled: false,
    intensity: 0.0,
    roughness: 0.0,
    indexOfRefraction: 1.5,
    tint: new Color3(1, 1, 1),
  },
  sheen: {
    enabled: false,
    intensity: 0.0,
    color: new Color3(1, 1, 1),
    roughness: 0.0,
  },
  anisotropy: {
    enabled: false,
    intensity: 0.0,
    direction: new Vector3(1, 0, 0),
  },
  textures: {},
} as const;

/**
 * BabylonJS Advanced Material Service
 *
 * Manages advanced PBR and node materials with comprehensive configuration.
 * Follows SRP by focusing solely on material management.
 */
export class BabylonMaterialService {
  private scene: Scene | null = null;
  private materials = new Map<string, Material>();
  private materialStates = new Map<string, MaterialState>();

  constructor() {
    logger.init('[INIT][BabylonMaterialService] Service initialized');
  }

  /**
   * Initialize the material service with a scene
   */
  init(scene: Scene): Result<void, MaterialError> {
    logger.debug('[DEBUG][BabylonMaterialService] Initializing material service...');

    return tryCatch(
      () => {
        if (!scene) {
          throw this.createError(
            MaterialErrorCode.SCENE_NOT_PROVIDED,
            'Scene is required for material management'
          );
        }

        this.scene = scene;
        logger.debug('[DEBUG][BabylonMaterialService] Material service initialized successfully');
      },
      (error) => {
        // If error is already a MaterialError, preserve it
        if (error && typeof error === 'object' && 'code' in error) {
          return error as MaterialError;
        }
        return this.createError(
          MaterialErrorCode.CREATION_FAILED,
          `Failed to initialize material service: ${error}`
        );
      }
    );
  }

  /**
   * Create a PBR material
   */
  async createPBRMaterial(config: PBRMaterialConfig): Promise<MaterialCreateResult> {
    logger.debug(`[DEBUG][BabylonMaterialService] Creating PBR material: ${config.name}`);

    return tryCatchAsync(
      async () => {
        if (!this.scene) {
          throw this.createError(
            MaterialErrorCode.SCENE_NOT_PROVIDED,
            'Scene must be initialized before creating materials'
          );
        }

        const material = new PBRMaterial(config.name, this.scene);

        // Configure basic PBR properties
        material.albedoColor = config.baseColor;
        material.metallic = config.metallicFactor;
        material.roughness = config.roughnessFactor;
        material.emissiveColor = config.emissiveColor;
        material.emissiveIntensity = config.emissiveIntensity;
        material.indexOfRefraction = config.indexOfRefraction;

        // Configure transparency
        material.alphaCutOff = config.alphaCutOff;
        material.transparencyMode = config.transparencyMode;

        // Configure clear coat if enabled
        if (config.clearCoat.enabled) {
          material.clearCoat.isEnabled = true;
          material.clearCoat.intensity = config.clearCoat.intensity;
          material.clearCoat.roughness = config.clearCoat.roughness;
          material.clearCoat.indexOfRefraction = config.clearCoat.indexOfRefraction;
          material.clearCoat.tintColor = config.clearCoat.tint;
        }

        // Configure sheen if enabled
        if (config.sheen.enabled) {
          material.sheen.isEnabled = true;
          material.sheen.intensity = config.sheen.intensity;
          material.sheen.color = config.sheen.color;
          material.sheen.roughness = config.sheen.roughness;
        }

        // Configure anisotropy if enabled
        if (config.anisotropy.enabled) {
          material.anisotropy.isEnabled = true;
          material.anisotropy.intensity = config.anisotropy.intensity;
          material.anisotropy.direction = new Vector2(
            config.anisotropy.direction.x,
            config.anisotropy.direction.y
          );
        }

        // Load textures if provided
        await this.loadPBRTextures(material, config.textures);

        // Store material and state
        this.materials.set(config.name, material);
        this.materialStates.set(config.name, {
          id: config.name,
          name: config.name,
          type: MaterialType.PBR,
          isReady: material.isReady(),
          appliedMeshes: [],
          lastUpdated: new Date(),
        });

        logger.debug(`[DEBUG][BabylonMaterialService] PBR material created: ${config.name}`);
        return material;
      },
      (error) => {
        // If error is already a MaterialError, preserve it
        if (error && typeof error === 'object' && 'code' in error) {
          return error as MaterialError;
        }
        return this.createError(
          MaterialErrorCode.CREATION_FAILED,
          `Failed to create PBR material: ${error}`
        );
      }
    );
  }

  /**
   * Create a node material
   */
  async createNodeMaterial(config: NodeMaterialConfig): Promise<MaterialCreateResult> {
    logger.debug(`[DEBUG][BabylonMaterialService] Creating node material: ${config.name}`);

    return tryCatchAsync(
      async () => {
        if (!this.scene) {
          throw this.createError(
            MaterialErrorCode.SCENE_NOT_PROVIDED,
            'Scene must be initialized before creating materials'
          );
        }

        const material = new NodeMaterial(config.name, this.scene);

        try {
          // Parse and load node definition
          const nodeDefinition = JSON.parse(config.nodeDefinition);
          await material.loadFromSerialization(nodeDefinition);

          // Configure inputs if provided
          for (const [inputName, inputValue] of Object.entries(config.inputs)) {
            const inputBlock = material.getInputBlockByPredicate(
              (block) => block.name === inputName
            );
            if (inputBlock) {
              inputBlock.value = inputValue;
            }
          }

          // Build the material
          material.build();

          // Store material and state
          this.materials.set(config.name, material);
          this.materialStates.set(config.name, {
            id: config.name,
            name: config.name,
            type: MaterialType.NODE,
            isReady: material.isReady(),
            appliedMeshes: [],
            lastUpdated: new Date(),
          });

          logger.debug(`[DEBUG][BabylonMaterialService] Node material created: ${config.name}`);
          return material;
        } catch (error) {
          throw this.createError(
            MaterialErrorCode.NODE_COMPILATION_FAILED,
            `Failed to compile node material: ${error}`
          );
        }
      },
      (error) => {
        // If error is already a MaterialError, preserve it
        if (error && typeof error === 'object' && 'code' in error) {
          return error as MaterialError;
        }
        return this.createError(
          MaterialErrorCode.CREATION_FAILED,
          `Failed to create node material: ${error}`
        );
      }
    );
  }

  /**
   * Apply material to a mesh
   */
  applyToMesh(materialName: string, mesh: AbstractMesh): MaterialApplyResult {
    logger.debug(
      `[DEBUG][BabylonMaterialService] Applying material ${materialName} to mesh: ${mesh.id}`
    );

    return tryCatch(
      () => {
        const material = this.materials.get(materialName);
        if (!material) {
          throw this.createError(
            MaterialErrorCode.MATERIAL_NOT_FOUND,
            `Material not found: ${materialName}`
          );
        }

        mesh.material = material;

        // Update material state
        const state = this.materialStates.get(materialName);
        if (state) {
          const updatedMeshes = [...state.appliedMeshes, mesh.id];
          this.materialStates.set(materialName, {
            ...state,
            appliedMeshes: updatedMeshes,
            lastUpdated: new Date(),
          });
        }

        logger.debug(
          `[DEBUG][BabylonMaterialService] Material applied: ${materialName} to ${mesh.id}`
        );
      },
      (error) => {
        // If error is already a MaterialError, preserve it
        if (error && typeof error === 'object' && 'code' in error) {
          return error as MaterialError;
        }
        return this.createError(
          MaterialErrorCode.CREATION_FAILED,
          `Failed to apply material: ${error}`
        );
      }
    );
  }

  /**
   * Get material by name
   */
  getMaterial(name: string): Material | undefined {
    return this.materials.get(name);
  }

  /**
   * Get material state
   */
  getMaterialState(name: string): MaterialState | undefined {
    return this.materialStates.get(name);
  }

  /**
   * Get all material states
   */
  getAllMaterialStates(): readonly MaterialState[] {
    return Array.from(this.materialStates.values());
  }

  /**
   * Remove a material
   */
  removeMaterial(name: string): Result<void, MaterialError> {
    logger.debug(`[DEBUG][BabylonMaterialService] Removing material: ${name}`);

    return tryCatch(
      () => {
        const material = this.materials.get(name);
        if (!material) {
          throw this.createError(
            MaterialErrorCode.MATERIAL_NOT_FOUND,
            `Material not found: ${name}`
          );
        }

        material.dispose();
        this.materials.delete(name);
        this.materialStates.delete(name);

        logger.debug(`[DEBUG][BabylonMaterialService] Material removed: ${name}`);
      },
      (error) => {
        // If error is already a MaterialError, preserve it
        if (error && typeof error === 'object' && 'code' in error) {
          return error as MaterialError;
        }
        return this.createError(
          MaterialErrorCode.CREATION_FAILED,
          `Failed to remove material: ${error}`
        );
      }
    );
  }

  /**
   * Load PBR textures
   */
  private async loadPBRTextures(material: PBRMaterial, textures: PBRTextureConfig): Promise<void> {
    if (!this.scene) return;

    const texturePromises: Promise<void>[] = [];

    // Load base color texture
    if (textures.baseColorTexture) {
      texturePromises.push(
        this.loadTexture(textures.baseColorTexture).then((texture) => {
          if (texture) material.albedoTexture = texture;
        })
      );
    }

    // Load metallic roughness texture
    if (textures.metallicRoughnessTexture) {
      texturePromises.push(
        this.loadTexture(textures.metallicRoughnessTexture).then((texture) => {
          if (texture) material.metallicTexture = texture;
        })
      );
    }

    // Load normal texture
    if (textures.normalTexture) {
      texturePromises.push(
        this.loadTexture(textures.normalTexture).then((texture) => {
          if (texture) material.bumpTexture = texture;
        })
      );
    }

    // Load emissive texture
    if (textures.emissiveTexture) {
      texturePromises.push(
        this.loadTexture(textures.emissiveTexture).then((texture) => {
          if (texture) material.emissiveTexture = texture;
        })
      );
    }

    // Load occlusion texture
    if (textures.occlusionTexture) {
      texturePromises.push(
        this.loadTexture(textures.occlusionTexture).then((texture) => {
          if (texture) material.ambientTexture = texture;
        })
      );
    }

    await Promise.all(texturePromises);
  }

  /**
   * Load a texture
   */
  private async loadTexture(url: string): Promise<Texture | null> {
    if (!this.scene) return null;

    try {
      const texture = new Texture(url, this.scene);

      // Wait for texture to be ready
      await new Promise<void>((resolve, reject) => {
        if (texture.isReady()) {
          resolve();
        } else {
          texture.onLoadObservable.addOnce(() => resolve());
          // Handle texture loading errors by checking if texture failed to load
          const checkError = () => {
            if (!texture.isReady() && texture.loadingError) {
              reject(new Error('Failed to load texture'));
            }
          };
          setTimeout(checkError, 5000); // Timeout after 5 seconds
        }
      });

      return texture;
    } catch (_error) {
      logger.warn(`[WARN][BabylonMaterialService] Failed to load texture: ${url}`);
      return null;
    }
  }

  /**
   * Create material error
   */
  private createError(code: MaterialErrorCode, message: string, details?: unknown): MaterialError {
    return {
      code,
      message,
      details,
      timestamp: new Date(),
    };
  }

  /**
   * Dispose the material service and clean up all materials
   */
  dispose(): void {
    logger.debug('[DEBUG][BabylonMaterialService] Disposing material service...');

    // Dispose all materials
    for (const [name, material] of this.materials) {
      try {
        material.dispose();
      } catch (error) {
        logger.warn(`[WARN][BabylonMaterialService] Failed to dispose material ${name}: ${error}`);
      }
    }

    this.materials.clear();
    this.materialStates.clear();
    this.scene = null;

    logger.end('[END][BabylonMaterialService] Material service disposed');
  }
}
