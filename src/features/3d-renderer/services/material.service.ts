/**
 * Material Service
 *
 * Service for creating and managing Three.js materials with enhanced validation,
 * caching, and performance monitoring following bulletproof-react architecture.
 */

import * as THREE from 'three';
import { createLogger } from '../../../shared/services/logger.service.js';
import type { Result } from '../../../shared/types/result.types.js';
import { error, success, tryCatch } from '../../../shared/utils/functional/result.js';
import type { MaterialConfig } from '../types/renderer.types.js';

const logger = createLogger('MaterialService');

/**
 * Material creation options
 */
export interface MaterialCreationOptions {
  readonly enableCaching?: boolean;
  readonly validateConfig?: boolean;
  readonly enableTelemetry?: boolean;
}

/**
 * Material validation result
 */
export interface MaterialValidationResult {
  readonly isValid: boolean;
  readonly warnings: readonly string[];
  readonly suggestions: readonly string[];
}

/**
 * Material service dependencies
 */
export interface MaterialServiceDependencies {
  readonly enableCaching?: boolean;
  readonly cacheSize?: number;
  readonly enableTelemetry?: boolean;
}

/**
 * Material Service implementation
 */
export class MaterialService {
  private readonly materialCache = new Map<string, THREE.Material>();
  private readonly maxCacheSize: number;
  private readonly enableCaching: boolean;
  private readonly enableTelemetry: boolean;
  private operationCount = 0;

  constructor(deps: MaterialServiceDependencies = {}) {
    logger.init('Initializing Material Service');

    this.enableCaching = deps.enableCaching ?? true;
    this.maxCacheSize = deps.cacheSize ?? 100;
    this.enableTelemetry = deps.enableTelemetry ?? true;
  }

  /**
   * Create Three.js material from configuration with enhanced validation and caching
   */
  createMaterial(
    config: MaterialConfig,
    options: MaterialCreationOptions = {}
  ): Result<THREE.MeshStandardMaterial, string> {
    const startTime = performance.now();

    try {
      logger.debug(`Creating material with color: ${config.color}`);

      // Validate configuration if requested
      if (options.validateConfig) {
        const validation = this.validateMaterialConfig(config);
        if (!validation.isValid) {
          return error(`Invalid material configuration: ${validation.warnings.join(', ')}`);
        }

        if (validation.warnings.length > 0) {
          logger.warn('Material configuration warnings:', validation.warnings);
        }
      }

      // Check cache if enabled
      if (options.enableCaching && this.enableCaching) {
        const cacheKey = this.generateCacheKey(config);
        const cached = this.materialCache.get(cacheKey);
        if (cached && cached instanceof THREE.MeshStandardMaterial) {
          logger.debug('Returning cached material');
          this.trackOperation('createMaterial', performance.now() - startTime, true);
          return success(cached.clone() as THREE.MeshStandardMaterial);
        }
      }

      // Create material
      const material = new THREE.MeshStandardMaterial({
        color: config.color,
        opacity: config.opacity,
        metalness: config.metalness,
        roughness: config.roughness,
        wireframe: config.wireframe,
        transparent: config.transparent || config.opacity < 1,
        side: this.convertSideConfig(config.side),
      });

      // Cache if enabled
      if (options.enableCaching && this.enableCaching) {
        this.cacheResult(config, material);
      }

      this.trackOperation('createMaterial', performance.now() - startTime, true);
      logger.debug('Material created successfully');

      return success(material);
    } catch (err) {
      const errorMessage = `Failed to create material: ${err instanceof Error ? err.message : String(err)}`;
      logger.error(errorMessage);
      this.trackOperation('createMaterial', performance.now() - startTime, false);
      return error(errorMessage);
    }
  }

  /**
   * Create wireframe material
   */
  createWireframeMaterial(
    color: string,
    _options: MaterialCreationOptions = {}
  ): Result<THREE.MeshBasicMaterial, string> {
    return tryCatch(
      () => {
        logger.debug(`Creating wireframe material with color: ${color}`);

        const material = new THREE.MeshBasicMaterial({
          color,
          wireframe: true,
          transparent: true,
          opacity: 0.8,
        });

        return material;
      },
      (err) =>
        `Failed to create wireframe material: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  /**
   * Create transparent material
   */
  createTransparentMaterial(
    color: string,
    opacity: number,
    _options: MaterialCreationOptions = {}
  ): Result<THREE.MeshStandardMaterial, string> {
    return tryCatch(
      () => {
        if (opacity < 0 || opacity > 1) {
          throw new Error('Opacity must be between 0 and 1');
        }

        logger.debug(`Creating transparent material with color: ${color}, opacity: ${opacity}`);

        const material = new THREE.MeshStandardMaterial({
          color,
          opacity,
          transparent: true,
          side: THREE.DoubleSide,
        });

        return material;
      },
      (err) =>
        `Failed to create transparent material: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  /**
   * Validate material configuration
   */
  private validateMaterialConfig(config: MaterialConfig): MaterialValidationResult {
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Validate color
    if (!config.color || typeof config.color !== 'string') {
      warnings.push('Invalid color value');
    }

    // Validate opacity
    if (config.opacity < 0 || config.opacity > 1) {
      warnings.push('Opacity must be between 0 and 1');
    }

    // Validate metalness
    if (config.metalness < 0 || config.metalness > 1) {
      warnings.push('Metalness must be between 0 and 1');
    }

    // Validate roughness
    if (config.roughness < 0 || config.roughness > 1) {
      warnings.push('Roughness must be between 0 and 1');
    }

    // Performance suggestions
    if (config.opacity < 1 && !config.transparent) {
      suggestions.push('Consider setting transparent: true for materials with opacity < 1');
    }

    if (config.metalness > 0.8 && config.roughness > 0.8) {
      suggestions.push('High metalness with high roughness may not look realistic');
    }

    return {
      isValid: warnings.length === 0,
      warnings,
      suggestions,
    };
  }

  /**
   * Convert side configuration to Three.js constant
   */
  private convertSideConfig(side: MaterialConfig['side']): THREE.Side {
    switch (side) {
      case 'front':
        return THREE.FrontSide;
      case 'back':
        return THREE.BackSide;
      default:
        return THREE.DoubleSide;
    }
  }

  /**
   * Generate cache key for material configuration
   */
  private generateCacheKey(config: MaterialConfig): string {
    return JSON.stringify({
      color: config.color,
      opacity: config.opacity,
      metalness: config.metalness,
      roughness: config.roughness,
      wireframe: config.wireframe,
      transparent: config.transparent,
      side: config.side,
    });
  }

  /**
   * Cache material result
   */
  private cacheResult(config: MaterialConfig, material: THREE.Material): void {
    if (this.materialCache.size >= this.maxCacheSize) {
      // Remove oldest entry (simple LRU)
      const firstKey = this.materialCache.keys().next().value;
      if (firstKey) {
        const oldMaterial = this.materialCache.get(firstKey);
        if (oldMaterial) {
          oldMaterial.dispose();
        }
        this.materialCache.delete(firstKey);
      }
    }

    const cacheKey = this.generateCacheKey(config);
    this.materialCache.set(cacheKey, material);
  }

  /**
   * Track operation for telemetry
   */
  private trackOperation(operation: string, duration: number, success: boolean): void {
    if (!this.enableTelemetry) return;

    this.operationCount++;
    logger.debug(
      `Material operation: ${operation}, duration: ${duration.toFixed(2)}ms, success: ${success}`
    );
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): {
    operationCount: number;
    cacheSize: number;
    cacheHitRate: number;
  } {
    return {
      operationCount: this.operationCount,
      cacheSize: this.materialCache.size,
      cacheHitRate: 0, // Would need to track hits/misses for accurate calculation
    };
  }

  /**
   * Clear cache and dispose materials
   */
  clearCache(): void {
    logger.debug('Clearing material cache');

    for (const material of this.materialCache.values()) {
      material.dispose();
    }

    this.materialCache.clear();
  }

  /**
   * Dispose service and cleanup resources
   */
  dispose(): void {
    logger.end('Disposing Material Service');
    this.clearCache();
  }
}

/**
 * Default material service instance
 */
export const materialService = new MaterialService();

/**
 * Legacy function for backward compatibility
 * @deprecated Use MaterialService.createMaterial() instead
 */
export const createMaterial = (config: MaterialConfig): THREE.MeshStandardMaterial => {
  const result = materialService.createMaterial(config);
  if (!result.success) {
    throw new Error(result.error);
  }
  return result.data;
};
