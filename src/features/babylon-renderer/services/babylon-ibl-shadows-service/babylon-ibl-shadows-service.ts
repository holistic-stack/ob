/**
 * @file BabylonJS IBL Shadows Service
 *
 * Service for managing Image-Based Lighting (IBL) shadows in BabylonJS 8.0+.
 * Provides comprehensive IBL shadow configuration and management capabilities.
 */

import {
  type AbstractMesh,
  type BaseTexture,
  CubeTexture,
  HDRCubeTexture,
  ImageProcessingConfiguration,
  PBRMaterial,
  type Scene,
  Vector3,
} from '@babylonjs/core';
import { createLogger } from '../../../../shared/services/logger.service';
import type { Result } from '../../../../shared/types/result.types';
import { tryCatch, tryCatchAsync } from '../../../../shared/utils/functional/result';

const logger = createLogger('BabylonIBLShadowsService');

/**
 * IBL shadow configuration
 */
export interface IBLShadowConfig {
  readonly enabled: boolean;
  readonly environmentTextureUrl: string;
  readonly shadowIntensity: number;
  readonly shadowBias: number;
  readonly shadowNormalBias: number;
  readonly shadowRadius: number;
  readonly shadowMapSize: number;
  readonly environmentIntensity: number;
  readonly environmentRotation: Vector3;
  readonly useHDR: boolean;
  readonly generateMipMaps: boolean;
  readonly gammaSpace: boolean;
}

/**
 * IBL shadow state
 */
export interface IBLShadowState {
  readonly isEnabled: boolean;
  readonly environmentTexture: BaseTexture | null;
  readonly affectedMeshes: readonly string[];
  readonly shadowIntensity: number;
  readonly environmentIntensity: number;
  readonly lastUpdated: Date;
}

/**
 * IBL shadow error types
 */
export interface IBLShadowError {
  readonly code: IBLShadowErrorCode;
  readonly message: string;
  readonly details?: unknown;
  readonly timestamp: Date;
}

export enum IBLShadowErrorCode {
  INITIALIZATION_FAILED = 'INITIALIZATION_FAILED',
  TEXTURE_LOAD_FAILED = 'TEXTURE_LOAD_FAILED',
  INVALID_CONFIG = 'INVALID_CONFIG',
  SCENE_NOT_PROVIDED = 'SCENE_NOT_PROVIDED',
  IBL_NOT_SUPPORTED = 'IBL_NOT_SUPPORTED',
  MESH_APPLICATION_FAILED = 'MESH_APPLICATION_FAILED',
}

/**
 * IBL shadow operation results
 */
export type IBLShadowInitResult = Result<void, IBLShadowError>;
export type IBLShadowApplyResult = Result<void, IBLShadowError>;
export type IBLShadowUpdateResult = Result<void, IBLShadowError>;

/**
 * Default IBL shadow configuration
 */
export const DEFAULT_IBL_SHADOW_CONFIG: IBLShadowConfig = {
  enabled: true,
  environmentTextureUrl: '',
  shadowIntensity: 1.0,
  shadowBias: 0.00005,
  shadowNormalBias: 0.0,
  shadowRadius: 4.0,
  shadowMapSize: 1024,
  environmentIntensity: 1.0,
  environmentRotation: new Vector3(0, 0, 0),
  useHDR: true,
  generateMipMaps: true,
  gammaSpace: false,
} as const;

/**
 * BabylonJS IBL Shadows Service
 *
 * Manages Image-Based Lighting shadows with comprehensive configuration.
 * Follows SRP by focusing solely on IBL shadow management.
 */
export class BabylonIBLShadowsService {
  private scene: Scene | null = null;
  private environmentTexture: BaseTexture | null = null;
  private config: IBLShadowConfig;
  private affectedMeshes = new Set<string>();

  constructor(config: IBLShadowConfig = DEFAULT_IBL_SHADOW_CONFIG) {
    this.config = { ...config };
    logger.init('[INIT][BabylonIBLShadowsService] Service initialized');
  }

  /**
   * Initialize the IBL shadows service with a scene
   */
  async init(scene: Scene, config?: Partial<IBLShadowConfig>): Promise<IBLShadowInitResult> {
    logger.debug('[DEBUG][BabylonIBLShadowsService] Initializing IBL shadows service...');

    return tryCatchAsync(
      async () => {
        if (!scene) {
          throw this.createError('SCENE_NOT_PROVIDED', 'Scene is required for IBL shadows');
        }

        // Check if IBL shadows are supported
        if (!this.isIBLShadowsSupported(scene)) {
          throw this.createError(
            'IBL_NOT_SUPPORTED',
            'IBL shadows are not supported in this environment'
          );
        }

        this.scene = scene;

        // Merge configuration if provided
        if (config) {
          this.config = { ...this.config, ...config };
        }

        // Load environment texture if provided
        if (this.config.environmentTextureUrl) {
          await this.loadEnvironmentTexture(this.config.environmentTextureUrl);
        }

        // Configure scene for IBL shadows
        this.configureSceneForIBL();

        logger.debug(
          '[DEBUG][BabylonIBLShadowsService] IBL shadows service initialized successfully'
        );
      },
      (error) => {
        // If error is already an IBLShadowError, preserve it
        if (error && typeof error === 'object' && 'code' in error) {
          return error as IBLShadowError;
        }
        return this.createError(
          'INITIALIZATION_FAILED',
          `Failed to initialize IBL shadows: ${error}`
        );
      }
    );
  }

  /**
   * Load environment texture for IBL
   */
  async loadEnvironmentTexture(textureUrl: string): Promise<Result<BaseTexture, IBLShadowError>> {
    logger.debug(`[DEBUG][BabylonIBLShadowsService] Loading environment texture: ${textureUrl}`);

    return tryCatchAsync(
      async () => {
        if (!this.scene) {
          throw this.createError(
            'SCENE_NOT_PROVIDED',
            'Scene must be initialized before loading textures'
          );
        }

        let texture: BaseTexture;

        if (this.config.useHDR) {
          texture = new HDRCubeTexture(
            textureUrl,
            this.scene,
            512, // size
            false, // noMipmap
            this.config.generateMipMaps,
            this.config.gammaSpace
          );
        } else {
          texture = new CubeTexture(
            textureUrl,
            this.scene,
            null, // extensions
            false, // noMipmap
            null, // files
            undefined, // onLoad
            undefined, // onError
            undefined, // format
            undefined, // prefiltered
            undefined, // forcedExtension
            undefined, // createPolynomials
            undefined, // lodScale
            undefined // lodOffset
          );
        }

        // Wait for texture to be ready
        await new Promise<void>((resolve, reject) => {
          if (texture.isReady()) {
            resolve();
          } else {
            texture.onLoadObservable.addOnce(() => resolve());
            texture.onErrorObservable.addOnce(() => reject(new Error('Failed to load texture')));
          }
        });

        this.environmentTexture = texture;

        // Apply environment texture to scene
        this.scene.environmentTexture = texture;

        // Configure environment rotation
        if (this.config.environmentRotation) {
          this.scene.environmentRotationY = this.config.environmentRotation.y;
        }

        // Configure environment intensity
        this.scene.environmentIntensity = this.config.environmentIntensity;

        logger.debug('[DEBUG][BabylonIBLShadowsService] Environment texture loaded successfully');
        return texture;
      },
      (error) => {
        // If error is already an IBLShadowError, preserve it
        if (error && typeof error === 'object' && 'code' in error) {
          return error as IBLShadowError;
        }
        return this.createError(
          'TEXTURE_LOAD_FAILED',
          `Failed to load environment texture: ${error}`
        );
      }
    );
  }

  /**
   * Apply IBL shadows to a mesh
   */
  applyToMesh(mesh: AbstractMesh): IBLShadowApplyResult {
    logger.debug(`[DEBUG][BabylonIBLShadowsService] Applying IBL shadows to mesh: ${mesh.id}`);

    return tryCatch(
      () => {
        if (!this.scene || !this.environmentTexture) {
          throw this.createError(
            'INVALID_CONFIG',
            'IBL shadows must be initialized before applying to meshes'
          );
        }

        // Ensure mesh has PBR material for IBL shadows
        if (!mesh.material || !(mesh.material instanceof PBRMaterial)) {
          // Create PBR material if needed
          const pbrMaterial = new PBRMaterial(`${mesh.id}_pbr_material`, this.scene);

          // Copy basic properties from existing material if available
          if (mesh.material) {
            // Basic material property copying would go here
            // This is simplified for the example
          }

          mesh.material = pbrMaterial;
        }

        const pbrMaterial = mesh.material as PBRMaterial;

        // Configure PBR material for IBL shadows
        pbrMaterial.environmentTexture = this.environmentTexture;
        pbrMaterial.environmentIntensity = this.config.environmentIntensity;

        // Enable IBL shadows if supported
        if ('enableIBLShadows' in pbrMaterial) {
          (pbrMaterial as any).enableIBLShadows = this.config.enabled;
          (pbrMaterial as any).iblShadowIntensity = this.config.shadowIntensity;
          (pbrMaterial as any).iblShadowBias = this.config.shadowBias;
          (pbrMaterial as any).iblShadowNormalBias = this.config.shadowNormalBias;
          (pbrMaterial as any).iblShadowRadius = this.config.shadowRadius;
        }

        // Track affected mesh
        this.affectedMeshes.add(mesh.id);

        logger.debug(`[DEBUG][BabylonIBLShadowsService] IBL shadows applied to mesh: ${mesh.id}`);
      },
      (error) => {
        // If error is already an IBLShadowError, preserve it
        if (error && typeof error === 'object' && 'code' in error) {
          return error as IBLShadowError;
        }
        return this.createError(
          'MESH_APPLICATION_FAILED',
          `Failed to apply IBL shadows to mesh: ${error}`
        );
      }
    );
  }

  /**
   * Apply IBL shadows to multiple meshes
   */
  applyToMeshes(meshes: AbstractMesh[]): IBLShadowApplyResult {
    logger.debug(
      `[DEBUG][BabylonIBLShadowsService] Applying IBL shadows to ${meshes.length} meshes`
    );

    return tryCatch(
      () => {
        for (const mesh of meshes) {
          const result = this.applyToMesh(mesh);
          if (!result.success) {
            throw result.error;
          }
        }

        logger.debug(
          `[DEBUG][BabylonIBLShadowsService] IBL shadows applied to all meshes successfully`
        );
      },
      (error) => {
        // If error is already an IBLShadowError, preserve it
        if (error && typeof error === 'object' && 'code' in error) {
          return error as IBLShadowError;
        }
        return this.createError(
          'MESH_APPLICATION_FAILED',
          `Failed to apply IBL shadows to meshes: ${error}`
        );
      }
    );
  }

  /**
   * Update IBL shadow configuration
   */
  updateConfig(newConfig: Partial<IBLShadowConfig>): IBLShadowUpdateResult {
    logger.debug('[DEBUG][BabylonIBLShadowsService] Updating IBL shadow configuration...');

    return tryCatch(
      () => {
        this.config = { ...this.config, ...newConfig };

        // Update scene configuration
        if (this.scene) {
          if (newConfig.environmentIntensity !== undefined) {
            this.scene.environmentIntensity = newConfig.environmentIntensity;
          }

          if (newConfig.environmentRotation !== undefined) {
            this.scene.environmentRotationY = newConfig.environmentRotation.y;
          }
        }

        // Update affected meshes if shadow properties changed
        if (this.shouldUpdateMeshes(newConfig)) {
          this.updateAffectedMeshes();
        }

        logger.debug(
          '[DEBUG][BabylonIBLShadowsService] IBL shadow configuration updated successfully'
        );
      },
      (error) =>
        this.createError('INVALID_CONFIG', `Failed to update IBL shadow configuration: ${error}`)
    );
  }

  /**
   * Get current IBL shadow state
   */
  getState(): IBLShadowState {
    return {
      isEnabled: this.config.enabled,
      environmentTexture: this.environmentTexture,
      affectedMeshes: Array.from(this.affectedMeshes),
      shadowIntensity: this.config.shadowIntensity,
      environmentIntensity: this.config.environmentIntensity,
      lastUpdated: new Date(),
    };
  }

  /**
   * Get current configuration
   */
  getConfig(): IBLShadowConfig {
    return { ...this.config };
  }

  /**
   * Check if IBL shadows are supported
   */
  private isIBLShadowsSupported(scene: Scene): boolean {
    // Check if the engine supports IBL shadows
    const engine = scene.getEngine();

    // IBL shadows require WebGL2 or WebGPU
    return engine.webGLVersion >= 2 || engine.isWebGPU;
  }

  /**
   * Configure scene for IBL shadows
   */
  private configureSceneForIBL(): void {
    if (!this.scene) return;

    // Configure image processing for IBL
    const imageProcessing = this.scene.imageProcessingConfiguration;
    if (imageProcessing) {
      imageProcessing.toneMappingEnabled = true;
      imageProcessing.toneMappingType = ImageProcessingConfiguration.TONEMAPPING_ACES;
      imageProcessing.exposure = 1.0;
    }
  }

  /**
   * Check if meshes should be updated based on config changes
   */
  private shouldUpdateMeshes(newConfig: Partial<IBLShadowConfig>): boolean {
    return !!(
      newConfig.shadowIntensity !== undefined ||
      newConfig.shadowBias !== undefined ||
      newConfig.shadowNormalBias !== undefined ||
      newConfig.shadowRadius !== undefined ||
      newConfig.enabled !== undefined
    );
  }

  /**
   * Update all affected meshes with new configuration
   */
  private updateAffectedMeshes(): void {
    if (!this.scene) return;

    for (const meshId of this.affectedMeshes) {
      const mesh = this.scene.getMeshById(meshId);
      if (mesh) {
        this.applyToMesh(mesh);
      }
    }
  }

  /**
   * Create IBL shadow error
   */
  private createError(
    code: IBLShadowErrorCode,
    message: string,
    details?: unknown
  ): IBLShadowError {
    return {
      code,
      message,
      details,
      timestamp: new Date(),
    };
  }

  /**
   * Dispose the IBL shadows service and clean up resources
   */
  dispose(): void {
    logger.debug('[DEBUG][BabylonIBLShadowsService] Disposing IBL shadows service...');

    // Dispose environment texture
    if (this.environmentTexture) {
      this.environmentTexture.dispose();
      this.environmentTexture = null;
    }

    // Clear affected meshes
    this.affectedMeshes.clear();

    // Clear scene reference
    this.scene = null;

    logger.end('[END][BabylonIBLShadowsService] IBL shadows service disposed');
  }
}
