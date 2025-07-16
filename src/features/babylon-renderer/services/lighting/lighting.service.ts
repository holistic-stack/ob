/**
 * @file Lighting Service
 *
 * Service for technical visualization lighting setup optimized for CAD models.
 * Provides consistent, shadow-casting lighting for clear depth perception.
 * 
 * @example
 * ```typescript
 * const lightingService = new LightingService(scene);
 * 
 * // Setup technical lighting
 * const result = await lightingService.setupTechnicalLighting({
 *   enableShadows: true,
 *   ambientIntensity: 0.3,
 *   directionalIntensity: 0.8
 * });
 * ```
 */

import { 
  Scene, 
  DirectionalLight, 
  HemisphericLight,
  ShadowGenerator,
  Vector3, 
  Color3,
  Light,
  Mesh,
  CascadedShadowGenerator
} from '@babylonjs/core';
import { createLogger } from '../../../../shared/services/logger.service';
import type { Result } from '../../../../shared/types/result.types';
import { tryCatch, tryCatchAsync } from '../../../../shared/utils/functional/result';

const logger = createLogger('Lighting');

/**
 * Technical lighting configuration
 */
export interface TechnicalLightingConfig {
  readonly enableShadows?: boolean;
  readonly shadowMapSize?: number;
  readonly ambientIntensity?: number;
  readonly directionalIntensity?: number;
  readonly ambientColor?: Color3;
  readonly directionalColor?: Color3;
  readonly keyLightDirection?: Vector3;
  readonly fillLightDirection?: Vector3;
  readonly fillLightIntensity?: number;
  readonly enableFillLight?: boolean;
  readonly enableHDR?: boolean;
  readonly shadowBias?: number;
  readonly shadowNormalBias?: number;
  readonly cascadedShadows?: boolean;
}

/**
 * Lighting setup result
 */
export interface LightingSetup {
  readonly keyLight: DirectionalLight;
  readonly ambientLight: HemisphericLight;
  readonly fillLight?: DirectionalLight;
  readonly shadowGenerator?: ShadowGenerator | CascadedShadowGenerator;
  readonly lights: readonly Light[];
}

/**
 * Lighting error
 */
export interface LightingError {
  readonly code: 'SETUP_FAILED' | 'SHADOW_SETUP_FAILED' | 'LIGHT_NOT_FOUND' | 'INVALID_PARAMETERS';
  readonly message: string;
  readonly timestamp: Date;
  readonly details?: Record<string, unknown>;
}

/**
 * Lighting Service
 * 
 * Provides technical visualization lighting optimized for CAD models.
 * Handles directional, ambient, and fill lighting with shadow support.
 */
export class LightingService {
  private readonly scene: Scene;
  private lightingSetup: LightingSetup | null = null;

  constructor(scene: Scene) {
    this.scene = scene;
    logger.init('[INIT] Lighting service initialized');
  }

  /**
   * Setup technical lighting for CAD visualization
   */
  async setupTechnicalLighting(
    config: TechnicalLightingConfig = {}
  ): Promise<Result<LightingSetup, LightingError>> {
    logger.debug('[TECHNICAL_LIGHTING] Setting up technical lighting...');
    const startTime = performance.now();

    return tryCatchAsync(
      async () => {
        // Default configuration optimized for technical visualization
        const defaultConfig: Required<TechnicalLightingConfig> = {
          enableShadows: true,
          shadowMapSize: 1024,
          ambientIntensity: 0.3,
          directionalIntensity: 0.8,
          ambientColor: new Color3(0.9, 0.9, 1.0), // Slightly blue ambient
          directionalColor: new Color3(1.0, 0.95, 0.9), // Slightly warm directional
          keyLightDirection: new Vector3(-1, -1, -1).normalize(),
          fillLightDirection: new Vector3(1, -0.5, 0.5).normalize(),
          fillLightIntensity: 0.4,
          enableFillLight: true,
          enableHDR: false,
          shadowBias: 0.00005,
          shadowNormalBias: 0.0,
          cascadedShadows: false,
        };

        const finalConfig = { ...defaultConfig, ...config };

        // Clear existing lights
        this.clearLights();

        // Create ambient light for overall illumination
        const ambientLight = new HemisphericLight('ambientLight', Vector3.Up(), this.scene);
        ambientLight.diffuse = finalConfig.ambientColor;
        ambientLight.intensity = finalConfig.ambientIntensity;

        // Create key directional light (main light source)
        const keyLight = new DirectionalLight('keyLight', finalConfig.keyLightDirection, this.scene);
        keyLight.diffuse = finalConfig.directionalColor;
        keyLight.intensity = finalConfig.directionalIntensity;
        keyLight.position = finalConfig.keyLightDirection.scale(-20); // Position light far away

        const lights: Light[] = [ambientLight, keyLight];
        let fillLight: DirectionalLight | undefined;
        let shadowGenerator: ShadowGenerator | CascadedShadowGenerator | undefined;

        // Create fill light for softer shadows
        if (finalConfig.enableFillLight) {
          fillLight = new DirectionalLight('fillLight', finalConfig.fillLightDirection, this.scene);
          fillLight.diffuse = finalConfig.directionalColor.scale(0.8); // Slightly dimmer
          fillLight.intensity = finalConfig.fillLightIntensity;
          fillLight.position = finalConfig.fillLightDirection.scale(-15);
          lights.push(fillLight);
        }

        // Setup shadows
        if (finalConfig.enableShadows) {
          shadowGenerator = this.setupShadows(keyLight, finalConfig);
        }

        this.lightingSetup = {
          keyLight,
          ambientLight,
          lights,
          ...(fillLight && { fillLight }),
          ...(shadowGenerator && { shadowGenerator }),
        };

        logger.debug(`[TECHNICAL_LIGHTING] Technical lighting setup completed in ${(performance.now() - startTime).toFixed(2)}ms`);
        return this.lightingSetup;
      },
      (error) => this.createError('SETUP_FAILED', `Technical lighting setup failed: ${error}`)
    );
  }

  /**
   * Update lighting intensity
   */
  async updateIntensity(
    ambientIntensity?: number,
    directionalIntensity?: number,
    fillIntensity?: number
  ): Promise<Result<void, LightingError>> {
    logger.debug('[UPDATE_INTENSITY] Updating lighting intensity...');

    return tryCatchAsync(
      async () => {
        if (!this.lightingSetup) {
          throw this.createError('LIGHT_NOT_FOUND', 'Lighting not initialized');
        }

        if (ambientIntensity !== undefined) {
          this.lightingSetup.ambientLight.intensity = ambientIntensity;
        }

        if (directionalIntensity !== undefined) {
          this.lightingSetup.keyLight.intensity = directionalIntensity;
        }

        if (fillIntensity !== undefined && this.lightingSetup.fillLight) {
          this.lightingSetup.fillLight.intensity = fillIntensity;
        }

        logger.debug('[UPDATE_INTENSITY] Lighting intensity updated');
      },
      (error) => this.createError('SETUP_FAILED', `Update intensity failed: ${error}`)
    );
  }

  /**
   * Add mesh to shadow casting
   */
  async addShadowCaster(mesh: Mesh): Promise<Result<void, LightingError>> {
    return tryCatchAsync(
      async () => {
        if (!this.lightingSetup?.shadowGenerator) {
          throw this.createError('SHADOW_SETUP_FAILED', 'Shadow generator not available');
        }

        this.lightingSetup.shadowGenerator.addShadowCaster(mesh);
        logger.debug(`[SHADOW_CASTER] Added mesh ${mesh.name} to shadow casting`);
      },
      (error) => this.createError('SHADOW_SETUP_FAILED', `Add shadow caster failed: ${error}`)
    );
  }

  /**
   * Add mesh to shadow receiving
   */
  async addShadowReceiver(mesh: Mesh): Promise<Result<void, LightingError>> {
    return tryCatchAsync(
      async () => {
        if (!this.lightingSetup?.shadowGenerator) {
          throw this.createError('SHADOW_SETUP_FAILED', 'Shadow generator not available');
        }

        mesh.receiveShadows = true;
        logger.debug(`[SHADOW_RECEIVER] Added mesh ${mesh.name} to shadow receiving`);
      },
      (error) => this.createError('SHADOW_SETUP_FAILED', `Add shadow receiver failed: ${error}`)
    );
  }

  /**
   * Get current lighting setup
   */
  getLightingSetup(): LightingSetup | null {
    return this.lightingSetup;
  }

  /**
   * Setup shadow generation
   */
  private setupShadows(
    light: DirectionalLight, 
    config: Required<TechnicalLightingConfig>
  ): ShadowGenerator | CascadedShadowGenerator {
    let shadowGenerator: ShadowGenerator | CascadedShadowGenerator;

    if (config.cascadedShadows) {
      shadowGenerator = new CascadedShadowGenerator(config.shadowMapSize, light);
      (shadowGenerator as CascadedShadowGenerator).stabilizeCascades = true;
    } else {
      shadowGenerator = new ShadowGenerator(config.shadowMapSize, light);
    }

    // Configure shadow quality
    shadowGenerator.bias = config.shadowBias;
    shadowGenerator.normalBias = config.shadowNormalBias;
    shadowGenerator.usePercentageCloserFiltering = true;
    shadowGenerator.filteringQuality = ShadowGenerator.QUALITY_HIGH;

    return shadowGenerator;
  }

  /**
   * Clear all lights from scene
   */
  private clearLights(): void {
    const lightsToDispose = [...this.scene.lights];
    for (const light of lightsToDispose) {
      light.dispose();
    }
    this.lightingSetup = null;
  }

  /**
   * Create a lighting error
   */
  private createError(
    code: LightingError['code'],
    message: string,
    details?: Record<string, unknown>
  ): LightingError {
    const error: LightingError = {
      code,
      message,
      timestamp: new Date(),
      ...(details && { details }),
    };
    
    return error;
  }

  /**
   * Dispose lighting setup
   */
  dispose(): void {
    this.clearLights();
    logger.debug('[DISPOSE] Lighting service disposed');
  }
}
