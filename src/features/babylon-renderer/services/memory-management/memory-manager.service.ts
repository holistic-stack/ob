/**
 * @file memory-manager.service.ts
 * @description Integrated memory management service combining render caching and resource pooling.
 * Provides comprehensive memory optimization with automatic cleanup and performance monitoring
 * to achieve 30% memory usage reduction.
 *
 * @example
 * ```typescript
 * const memoryManager = new MemoryManagerService();
 *
 * // Initialize with render cache integration
 * await memoryManager.initialize();
 *
 * // Monitor memory and perform automatic optimization
 * const optimization = await memoryManager.optimizeMemoryUsage();
 * console.log(`Freed ${optimization.memoryFreedMB}MB`);
 *
 * // Get comprehensive memory statistics
 * const stats = memoryManager.getComprehensiveStatistics();
 * console.log(`Total memory usage: ${stats.totalMemoryMB}MB`);
 * ```
 *
 * @author OpenSCAD Babylon Team
 * @version 1.0.0
 * @since 2025-07-30
 */

import type { AbstractMesh, BaseTexture } from '@babylonjs/core';
import type { Result } from '@/shared';
import { createLogger, error, success } from '@/shared';
import { RenderCacheService } from '../render-cache/render-cache.service';
import {
  type CleanupResult,
  MemoryPoolService,
  type MemoryPressureInfo,
} from './memory-pool.service';

const logger = createLogger('MemoryManagerService');

/**
 * Comprehensive memory statistics combining cache and pool data
 */
export interface ComprehensiveMemoryStatistics {
  readonly totalMemoryMB: number;
  readonly cacheMemoryMB: number;
  readonly poolMemoryMB: number;
  readonly totalResources: number;
  readonly cachedMeshes: number;
  readonly pooledResources: number;
  readonly memoryPressure: MemoryPressureInfo;
  readonly cacheHitRate: number;
  readonly memoryEfficiencyScore: number;
  readonly recommendedActions: readonly string[];
}

/**
 * Memory optimization result
 */
export interface MemoryOptimizationResult {
  readonly cacheCleanup: CleanupResult;
  readonly poolCleanup: CleanupResult;
  readonly totalMemoryFreedMB: number;
  readonly totalResourcesFreed: number;
  readonly optimizationTimeMs: number;
  readonly efficiencyImprovement: number;
}

/**
 * Memory manager configuration
 */
export interface MemoryManagerConfig {
  readonly enableAutomaticOptimization: boolean;
  readonly optimizationIntervalMs: number;
  readonly memoryThresholdMB: number;
  readonly enablePerformanceMonitoring: boolean;
}

/**
 * Default memory manager configuration
 */
const DEFAULT_MEMORY_MANAGER_CONFIG: MemoryManagerConfig = {
  enableAutomaticOptimization: true,
  optimizationIntervalMs: 30000, // 30 seconds
  memoryThresholdMB: 150, // Trigger optimization at 150MB
  enablePerformanceMonitoring: true,
} as const;

/**
 * Integrated Memory Manager Service
 *
 * Combines render caching and resource pooling for comprehensive memory management.
 * Provides automatic optimization, performance monitoring, and intelligent cleanup.
 */
export class MemoryManagerService {
  private renderCache: RenderCacheService;
  private memoryPool: MemoryPoolService;
  private config: MemoryManagerConfig;
  private optimizationTimer?: any;
  private isInitialized = false;

  constructor(config: Partial<MemoryManagerConfig> = {}) {
    this.config = { ...DEFAULT_MEMORY_MANAGER_CONFIG, ...config };
    this.renderCache = new RenderCacheService();
    this.memoryPool = new MemoryPoolService();

    logger.debug('[DEBUG][MemoryManagerService] Initialized with config:', this.config);
  }

  /**
   * Initialize the memory manager with automatic optimization
   *
   * @returns Result indicating success or failure
   */
  async initialize(): Promise<Result<void, Error>> {
    try {
      if (this.isInitialized) {
        return success(undefined);
      }

      // Start automatic optimization if enabled
      if (this.config.enableAutomaticOptimization) {
        this.startAutomaticOptimization();
      }

      this.isInitialized = true;

      logger.debug('[DEBUG][MemoryManagerService] Initialization complete');
      return success(undefined);
    } catch (err) {
      return error(
        new Error(
          `Failed to initialize memory manager: ${err instanceof Error ? err.message : 'Unknown error'}`
        )
      );
    }
  }

  /**
   * Shutdown the memory manager and cleanup resources
   */
  async shutdown(): Promise<void> {
    if (this.optimizationTimer) {
      clearInterval(this.optimizationTimer);
      this.optimizationTimer = undefined;
    }

    // Perform final cleanup
    await this.optimizeMemoryUsage();

    this.renderCache.clearCache();
    this.memoryPool.clearPool();

    this.isInitialized = false;
    logger.debug('[DEBUG][MemoryManagerService] Shutdown complete');
  }

  /**
   * Optimize memory usage by cleaning up cache and pool
   *
   * @returns Optimization result with performance metrics
   */
  async optimizeMemoryUsage(): Promise<Result<MemoryOptimizationResult, Error>> {
    try {
      const startTime = performance.now();
      const initialStats = this.getComprehensiveStatistics();

      // Perform cache cleanup
      const cacheCleanupResult = await this.renderCache.performAutomaticCleanup();

      // Perform pool cleanup
      const poolCleanupResult = await this.memoryPool.performAutomaticCleanup();

      if (!cacheCleanupResult.success) {
        const errorMessage = cacheCleanupResult.error instanceof Error ? cacheCleanupResult.error.message : 'Unknown cache cleanup error';
        return error(new Error(`Cache cleanup failed: ${errorMessage}`));
      }

      if (!poolCleanupResult.success) {
        const errorMessage = poolCleanupResult.error instanceof Error ? poolCleanupResult.error.message : 'Unknown pool cleanup error';
        return error(new Error(`Pool cleanup failed: ${errorMessage}`));
      }

      const finalStats = this.getComprehensiveStatistics();
      const optimizationTimeMs = performance.now() - startTime;

      const totalMemoryFreedMB =
        cacheCleanupResult.data.memoryFreedMB + poolCleanupResult.data.memoryFreedMB;
      const totalResourcesFreed =
        cacheCleanupResult.data.resourcesFreed + poolCleanupResult.data.resourcesFreed;

      // Calculate efficiency improvement
      const initialMemory = initialStats.totalMemoryMB;
      const finalMemory = finalStats.totalMemoryMB;
      const efficiencyImprovement =
        initialMemory > 0 ? ((initialMemory - finalMemory) / initialMemory) * 100 : 0;

      const result: MemoryOptimizationResult = {
        cacheCleanup: cacheCleanupResult.data,
        poolCleanup: poolCleanupResult.data,
        totalMemoryFreedMB,
        totalResourcesFreed,
        optimizationTimeMs,
        efficiencyImprovement,
      };

      logger.debug(
        `[DEBUG][MemoryManagerService] Optimization complete: ${totalMemoryFreedMB.toFixed(1)}MB freed, ` +
          `${totalResourcesFreed} resources freed, ${efficiencyImprovement.toFixed(1)}% efficiency improvement`
      );

      return success(result);
    } catch (err) {
      return error(
        new Error(
          `Memory optimization failed: ${err instanceof Error ? err.message : 'Unknown error'}`
        )
      );
    }
  }

  /**
   * Get comprehensive memory statistics
   *
   * @returns Combined statistics from cache and pool
   */
  getComprehensiveStatistics(): ComprehensiveMemoryStatistics {
    const cacheStats = this.renderCache.getStatistics();
    const poolStats = this.memoryPool.getMemoryStatistics();

    const totalMemoryMB = cacheStats.totalMemoryMB + poolStats.estimatedMemoryMB;
    const totalResources = cacheStats.totalEntries + poolStats.pooledResources;

    // Calculate memory efficiency score (0-100)
    const memoryEfficiencyScore = this.calculateMemoryEfficiencyScore(cacheStats, poolStats);

    // Generate recommended actions
    const recommendedActions = this.generateRecommendedActions(cacheStats, poolStats);

    return {
      totalMemoryMB,
      cacheMemoryMB: cacheStats.totalMemoryMB,
      poolMemoryMB: poolStats.estimatedMemoryMB,
      totalResources,
      cachedMeshes: cacheStats.totalEntries,
      pooledResources: poolStats.pooledResources,
      memoryPressure: poolStats.memoryPressure,
      cacheHitRate: cacheStats.hitRate,
      memoryEfficiencyScore,
      recommendedActions,
    };
  }

  /**
   * Pool a resource for reuse
   *
   * @param resource - Resource to pool
   * @returns Result indicating success or failure
   */
  poolResource(resource: AbstractMesh | BaseTexture): Result<void, Error> {
    return this.memoryPool.poolResource(resource);
  }

  /**
   * Get a pooled resource of the specified type
   *
   * @param resourceType - Type of resource to retrieve
   * @returns Pooled resource or null if none available
   */
  getPooledResource(resourceType: string): AbstractMesh | BaseTexture | null {
    return this.memoryPool.getPooledResource(resourceType);
  }

  /**
   * Access the render cache service
   */
  get cache(): RenderCacheService {
    return this.renderCache;
  }

  /**
   * Access the memory pool service
   */
  get pool(): MemoryPoolService {
    return this.memoryPool;
  }

  /**
   * Start automatic memory optimization
   */
  private startAutomaticOptimization(): void {
    if (this.optimizationTimer) {
      clearInterval(this.optimizationTimer);
    }

    this.optimizationTimer = setInterval(async () => {
      const stats = this.getComprehensiveStatistics();

      // Only optimize if memory usage exceeds threshold or pressure is high
      if (
        stats.totalMemoryMB > this.config.memoryThresholdMB ||
        stats.memoryPressure.level === 'high' ||
        stats.memoryPressure.level === 'critical'
      ) {
        logger.debug(
          `[DEBUG][MemoryManagerService] Automatic optimization triggered: ` +
            `${stats.totalMemoryMB.toFixed(1)}MB usage, ${stats.memoryPressure.level} pressure`
        );

        await this.optimizeMemoryUsage();
      }
    }, this.config.optimizationIntervalMs);

    logger.debug(
      `[DEBUG][MemoryManagerService] Automatic optimization started: ` +
        `${this.config.optimizationIntervalMs}ms interval`
    );
  }

  /**
   * Calculate memory efficiency score
   */
  private calculateMemoryEfficiencyScore(
    cacheStats: { hitRate: number },
    poolStats: { memoryPressure: MemoryPressureInfo; pooledResources: number }
  ): number {
    // Base score from cache hit rate (0-50 points)
    const cacheScore = cacheStats.hitRate * 50;

    // Memory pressure score (0-30 points, inverted)
    const pressureScore =
      poolStats.memoryPressure.level === 'low'
        ? 30
        : poolStats.memoryPressure.level === 'medium'
          ? 20
          : poolStats.memoryPressure.level === 'high'
            ? 10
            : 0;

    // Resource utilization score (0-20 points)
    const utilizationScore = Math.min(20, (poolStats.pooledResources / 50) * 20);

    return Math.min(100, cacheScore + pressureScore + utilizationScore);
  }

  /**
   * Generate recommended actions based on current state
   */
  private generateRecommendedActions(
    cacheStats: { hitRate: number; totalMemoryMB: number },
    poolStats: {
      memoryPressure: MemoryPressureInfo;
      pooledResources: number;
      estimatedMemoryMB: number;
    }
  ): string[] {
    const actions: string[] = [];

    if (poolStats.memoryPressure.level === 'critical') {
      actions.push('Immediate cleanup required - memory pressure critical');
    } else if (poolStats.memoryPressure.level === 'high') {
      actions.push('Perform memory cleanup - high memory pressure detected');
    }

    if (cacheStats.hitRate < 0.5) {
      actions.push('Optimize cache strategy - low hit rate detected');
    }

    if (poolStats.pooledResources > 80) {
      actions.push('Consider reducing pool size - high resource count');
    }

    if (cacheStats.totalMemoryMB + poolStats.estimatedMemoryMB > 200) {
      actions.push('Total memory usage high - consider optimization');
    }

    if (actions.length === 0) {
      actions.push('Memory usage is optimal');
    }

    return actions;
  }
}

// Helper function to check if result is error (for internal use)
function isError<T, E>(result: Result<T, E>): result is { success: false; error: E } {
  return !result.success;
}
