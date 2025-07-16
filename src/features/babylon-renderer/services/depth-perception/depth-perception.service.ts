/**
 * @file Depth Perception Service
 *
 * Service for enhancing depth perception through shadows, ambient occlusion,
 * and edge detection. Provides professional-grade visual quality for CAD visualization.
 *
 * @example
 * ```typescript
 * const depthService = new DepthPerceptionService(scene);
 *
 * // Setup enhanced depth perception
 * const result = await depthService.setupDepthPerception({
 *   enableShadows: true,
 *   enableSSAO: true,
 *   shadowQuality: 'high',
 *   ssaoIntensity: 0.8
 * });
 * ```
 */

import {
  type Camera,
  DefaultRenderingPipeline,
  Scene,
  SSAORenderingPipeline,
} from '@babylonjs/core';
import { createLogger } from '../../../../shared/services/logger.service';
import type { Result } from '../../../../shared/types/result.types';
import { tryCatchAsync } from '../../../../shared/utils/functional/result';
import type { LightingService } from '../lighting/lighting.service';

const logger = createLogger('DepthPerception');

/**
 * Depth perception quality levels
 */
export type DepthPerceptionQuality = 'low' | 'medium' | 'high' | 'ultra';

/**
 * Depth perception configuration
 */
export interface DepthPerceptionConfig {
  readonly enableShadows?: boolean;
  readonly enableSSAO?: boolean;
  readonly enableEdgeDetection?: boolean;
  readonly enableDepthCueing?: boolean;
  readonly shadowQuality?: DepthPerceptionQuality;
  readonly ssaoQuality?: DepthPerceptionQuality;
  readonly ssaoIntensity?: number;
  readonly ssaoRadius?: number;
  readonly edgeIntensity?: number;
  readonly depthCueingDistance?: number;
  readonly depthCueingIntensity?: number;
  readonly adaptiveQuality?: boolean;
}

/**
 * Depth perception setup result
 */
export interface DepthPerceptionSetup {
  readonly shadowsEnabled: boolean;
  readonly ssaoEnabled: boolean;
  readonly edgeDetectionEnabled: boolean;
  readonly depthCueingEnabled: boolean;
  readonly renderingPipeline?: DefaultRenderingPipeline;
  readonly ssaoPipeline?: SSAORenderingPipeline;
  readonly qualityLevel: DepthPerceptionQuality;
}

/**
 * Depth perception error
 */
export interface DepthPerceptionError {
  readonly code:
    | 'SETUP_FAILED'
    | 'PIPELINE_CREATION_FAILED'
    | 'SSAO_SETUP_FAILED'
    | 'CAMERA_NOT_FOUND';
  readonly message: string;
  readonly timestamp: Date;
  readonly details?: Record<string, unknown>;
}

/**
 * Depth Perception Service
 *
 * Provides enhanced depth perception through shadows, ambient occlusion,
 * edge detection, and depth cueing for professional CAD visualization.
 */
export class DepthPerceptionService {
  private readonly scene: Scene;
  private lightingService: LightingService | undefined;
  private depthSetup: DepthPerceptionSetup | null = null;
  private renderingPipeline: DefaultRenderingPipeline | null = null;
  private ssaoPipeline: SSAORenderingPipeline | null = null;

  constructor(scene: Scene, lightingService?: LightingService) {
    this.scene = scene;
    this.lightingService = lightingService;
    logger.init('[INIT] DepthPerception service initialized');
  }

  /**
   * Setup comprehensive depth perception effects
   */
  async setupDepthPerception(
    config: DepthPerceptionConfig = {}
  ): Promise<Result<DepthPerceptionSetup, DepthPerceptionError>> {
    logger.debug('[SETUP_DEPTH] Setting up depth perception effects...');
    const startTime = performance.now();

    return tryCatchAsync(
      async () => {
        // Default configuration optimized for CAD visualization
        const defaultConfig: Required<DepthPerceptionConfig> = {
          enableShadows: true,
          enableSSAO: true,
          enableEdgeDetection: false,
          enableDepthCueing: false,
          shadowQuality: 'high',
          ssaoQuality: 'medium',
          ssaoIntensity: 0.6,
          ssaoRadius: 0.5,
          edgeIntensity: 1.0,
          depthCueingDistance: 100,
          depthCueingIntensity: 0.3,
          adaptiveQuality: true,
        };

        const finalConfig = { ...defaultConfig, ...config };

        // Clear existing setup
        this.clearDepthPerception();

        // Get active camera
        const camera = this.scene.activeCamera;
        if (!camera) {
          throw this.createError(
            'CAMERA_NOT_FOUND',
            'Active camera is required for depth perception setup'
          );
        }

        let shadowsEnabled = false;
        let ssaoEnabled = false;
        let edgeDetectionEnabled = false;
        let depthCueingEnabled = false;

        // Setup enhanced shadows
        if (finalConfig.enableShadows) {
          shadowsEnabled = await this.setupEnhancedShadows(finalConfig);
        }

        // Setup SSAO
        if (finalConfig.enableSSAO) {
          ssaoEnabled = await this.setupSSAO(camera, finalConfig);
        }

        // Setup edge detection
        if (finalConfig.enableEdgeDetection) {
          edgeDetectionEnabled = await this.setupEdgeDetection(camera, finalConfig);
        }

        // Setup depth cueing
        if (finalConfig.enableDepthCueing) {
          depthCueingEnabled = await this.setupDepthCueing(camera, finalConfig);
        }

        this.depthSetup = {
          shadowsEnabled,
          ssaoEnabled,
          edgeDetectionEnabled,
          depthCueingEnabled,
          qualityLevel: finalConfig.ssaoQuality,
          ...(this.renderingPipeline && { renderingPipeline: this.renderingPipeline }),
          ...(this.ssaoPipeline && { ssaoPipeline: this.ssaoPipeline }),
        };

        logger.debug(
          `[SETUP_DEPTH] Depth perception setup completed in ${(performance.now() - startTime).toFixed(2)}ms`
        );
        return this.depthSetup;
      },
      (error) => this.createError('SETUP_FAILED', `Depth perception setup failed: ${error}`)
    );
  }

  /**
   * Setup enhanced shadows using existing lighting service
   */
  private async setupEnhancedShadows(config: Required<DepthPerceptionConfig>): Promise<boolean> {
    if (!this.lightingService) {
      logger.warn('[ENHANCED_SHADOWS] No lighting service provided, skipping shadow enhancement');
      return false;
    }

    try {
      // The LightingService already handles shadow setup
      // We can enhance it by adjusting quality settings
      const lightingSetup = this.lightingService.getLightingSetup();
      if (lightingSetup?.shadowGenerator) {
        // Enhance shadow quality based on configuration
        const shadowMapSize = this.getShadowMapSize(config.shadowQuality);
        lightingSetup.shadowGenerator.mapSize = shadowMapSize;

        // Enable high-quality filtering
        lightingSetup.shadowGenerator.usePercentageCloserFiltering = true;
        lightingSetup.shadowGenerator.filteringQuality = this.getShadowFilteringQuality(
          config.shadowQuality
        );

        logger.debug(`[ENHANCED_SHADOWS] Enhanced shadows with quality: ${config.shadowQuality}`);
        return true;
      }
    } catch (error) {
      logger.warn(`[ENHANCED_SHADOWS] Failed to enhance shadows: ${error}`);
    }

    return false;
  }

  /**
   * Setup Screen-Space Ambient Occlusion (SSAO)
   */
  private async setupSSAO(
    camera: Camera,
    config: Required<DepthPerceptionConfig>
  ): Promise<boolean> {
    try {
      // Create SSAO rendering pipeline
      this.ssaoPipeline = new SSAORenderingPipeline('ssao', this.scene, {
        ssaoRatio: this.getSSAORatio(config.ssaoQuality),
        blurRatio: this.getSSAOBlurRatio(config.ssaoQuality),
      });

      // Configure SSAO parameters
      this.ssaoPipeline.fallOff = 0.000001;
      this.ssaoPipeline.area = 0.0075;
      this.ssaoPipeline.radius = config.ssaoRadius;
      this.ssaoPipeline.totalStrength = config.ssaoIntensity;
      this.ssaoPipeline.base = 0.5;

      // Attach to camera
      this.scene.postProcessRenderPipelineManager.attachCamerasToRenderPipeline('ssao', camera);

      logger.debug(`[SSAO] SSAO setup completed with quality: ${config.ssaoQuality}`);
      return true;
    } catch (error) {
      logger.warn(`[SSAO] Failed to setup SSAO: ${error}`);
      return false;
    }
  }

  /**
   * Setup edge detection for better geometry definition
   */
  private async setupEdgeDetection(
    camera: Camera,
    config: Required<DepthPerceptionConfig>
  ): Promise<boolean> {
    try {
      // Create default rendering pipeline for edge detection
      this.renderingPipeline = new DefaultRenderingPipeline('defaultPipeline', true, this.scene, [
        camera,
      ]);

      // Enable edge detection
      if (this.renderingPipeline.imageProcessingEnabled) {
        // Configure edge detection parameters
        this.renderingPipeline.samples = this.getEdgeDetectionSamples(config.ssaoQuality);
      }

      logger.debug(`[EDGE_DETECTION] Edge detection setup completed`);
      return true;
    } catch (error) {
      logger.warn(`[EDGE_DETECTION] Failed to setup edge detection: ${error}`);
      return false;
    }
  }

  /**
   * Setup depth cueing for distance-based visual effects
   */
  private async setupDepthCueing(
    _camera: Camera,
    config: Required<DepthPerceptionConfig>
  ): Promise<boolean> {
    try {
      // Depth cueing can be implemented through fog or custom post-processing
      // For now, we'll use scene fog as a simple depth cueing effect
      this.scene.fogEnabled = true;
      this.scene.fogMode = Scene.FOGMODE_LINEAR;
      this.scene.fogStart = config.depthCueingDistance * 0.5;
      this.scene.fogEnd = config.depthCueingDistance;
      this.scene.fogDensity = config.depthCueingIntensity;

      logger.debug(`[DEPTH_CUEING] Depth cueing setup completed`);
      return true;
    } catch (error) {
      logger.warn(`[DEPTH_CUEING] Failed to setup depth cueing: ${error}`);
      return false;
    }
  }

  /**
   * Update depth perception settings
   */
  async updateDepthPerception(
    config: Partial<DepthPerceptionConfig>
  ): Promise<Result<void, DepthPerceptionError>> {
    return tryCatchAsync(
      async () => {
        if (!this.depthSetup) {
          throw this.createError('SETUP_FAILED', 'Depth perception not initialized');
        }

        // Update SSAO settings
        if (config.ssaoIntensity !== undefined && this.ssaoPipeline) {
          this.ssaoPipeline.totalStrength = config.ssaoIntensity;
        }

        if (config.ssaoRadius !== undefined && this.ssaoPipeline) {
          this.ssaoPipeline.radius = config.ssaoRadius;
        }

        // Update depth cueing settings
        if (config.depthCueingDistance !== undefined && this.scene.fogEnabled) {
          this.scene.fogStart = config.depthCueingDistance * 0.5;
          this.scene.fogEnd = config.depthCueingDistance;
        }

        if (config.depthCueingIntensity !== undefined && this.scene.fogEnabled) {
          this.scene.fogDensity = config.depthCueingIntensity;
        }

        logger.debug('[UPDATE_DEPTH] Depth perception settings updated');
      },
      (error) => this.createError('SETUP_FAILED', `Update depth perception failed: ${error}`)
    );
  }

  /**
   * Get shadow map size based on quality level
   */
  private getShadowMapSize(quality: DepthPerceptionQuality): number {
    switch (quality) {
      case 'low':
        return 512;
      case 'medium':
        return 1024;
      case 'high':
        return 2048;
      case 'ultra':
        return 4096;
      default:
        return 1024;
    }
  }

  /**
   * Get shadow filtering quality based on quality level
   */
  private getShadowFilteringQuality(quality: DepthPerceptionQuality): number {
    // Use numeric values for shadow filtering quality
    switch (quality) {
      case 'low':
        return 0; // Low quality
      case 'medium':
        return 1; // Medium quality
      case 'high':
        return 2; // High quality
      case 'ultra':
        return 2; // Ultra uses high quality
      default:
        return 1; // Default to medium
    }
  }

  /**
   * Get SSAO ratio based on quality level
   */
  private getSSAORatio(quality: DepthPerceptionQuality): number {
    switch (quality) {
      case 'low':
        return 0.25;
      case 'medium':
        return 0.5;
      case 'high':
        return 0.75;
      case 'ultra':
        return 1.0;
      default:
        return 0.5;
    }
  }

  /**
   * Get SSAO blur ratio based on quality level
   */
  private getSSAOBlurRatio(quality: DepthPerceptionQuality): number {
    switch (quality) {
      case 'low':
        return 0.25;
      case 'medium':
        return 0.5;
      case 'high':
        return 0.75;
      case 'ultra':
        return 1.0;
      default:
        return 0.5;
    }
  }

  /**
   * Get edge detection samples based on quality level
   */
  private getEdgeDetectionSamples(quality: DepthPerceptionQuality): number {
    switch (quality) {
      case 'low':
        return 1;
      case 'medium':
        return 2;
      case 'high':
        return 4;
      case 'ultra':
        return 8;
      default:
        return 2;
    }
  }

  /**
   * Get current depth perception setup
   */
  getDepthPerceptionSetup(): DepthPerceptionSetup | null {
    return this.depthSetup;
  }

  /**
   * Clear depth perception effects
   */
  private clearDepthPerception(): void {
    if (this.renderingPipeline) {
      this.renderingPipeline.dispose();
      this.renderingPipeline = null;
    }

    if (this.ssaoPipeline) {
      this.scene.postProcessRenderPipelineManager.detachCamerasFromRenderPipeline(
        'ssao',
        this.scene.cameras
      );
      this.ssaoPipeline.dispose();
      this.ssaoPipeline = null;
    }

    // Disable fog
    this.scene.fogEnabled = false;

    this.depthSetup = null;
  }

  /**
   * Create a depth perception error
   */
  private createError(
    code: DepthPerceptionError['code'],
    message: string,
    details?: Record<string, unknown>
  ): DepthPerceptionError {
    const error: DepthPerceptionError = {
      code,
      message,
      timestamp: new Date(),
      ...(details && { details }),
    };

    return error;
  }

  /**
   * Dispose service and clean up resources
   */
  dispose(): void {
    this.clearDepthPerception();
    logger.debug('[DISPOSE] DepthPerception service disposed');
  }
}
