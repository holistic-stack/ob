/**
 * @file render-cache.service.ts
 * @description High-performance render caching service for BabylonJS mesh optimization.
 * Implements intelligent caching strategies to achieve <10ms frame times by avoiding
 * unnecessary mesh regeneration and optimizing render loops.
 *
 * @example
 * ```typescript
 * const cacheService = new RenderCacheService();
 *
 * // Check cache before expensive render operation
 * const cacheKey = cacheService.generateCacheKey(astNodes);
 * const cachedMeshes = cacheService.getCachedMeshes(cacheKey);
 *
 * if (cachedMeshes) {
 *   console.log('Cache hit! Using cached meshes');
 *   return cachedMeshes;
 * }
 *
 * // Perform expensive render and cache result
 * const newMeshes = await renderMeshes(astNodes);
 * cacheService.cacheMeshes(cacheKey, newMeshes);
 * ```
 *
 * @author OpenSCAD Babylon Team
 * @version 1.0.0
 * @since 2025-07-30
 */

import type { AbstractMesh } from '@babylonjs/core';
import type { CleanupResult } from '../memory-management/memory-pool.service';
import type { ASTNode } from '@/features/openscad-parser';
import type { Result } from '@/shared';
import { createLogger, error, success } from '@/shared';
import {
  CacheEntryManager,
  CacheKeyGenerator,
  CacheLimitsEnforcer,
  CacheStatisticsCalculator,
} from '@/shared/utils/caching';

const logger = createLogger('RenderCacheService');

/**
 * Cache entry metadata for performance tracking
 */
export interface CacheEntryMetadata {
  readonly cacheKey: string;
  readonly createdAt: number;
  readonly lastAccessed: number;
  readonly accessCount: number;
  readonly meshCount: number;
  readonly estimatedMemoryMB: number;
  readonly renderTimeMs: number;
}

/**
 * Cache entry containing meshes and metadata
 */
export interface CacheEntry {
  readonly meshes: readonly AbstractMesh[];
  readonly metadata: CacheEntryMetadata;
}

/**
 * Cache statistics for performance monitoring
 */
export interface CacheStatistics {
  readonly totalEntries: number;
  readonly totalMemoryMB: number;
  readonly hitRate: number;
  readonly averageRenderTime: number;
  readonly oldestEntryAge: number;
  readonly mostAccessedKey: string;
}

/**
 * Cache configuration options
 */
export interface CacheConfig {
  readonly maxEntries: number;
  readonly maxMemoryMB: number;
  readonly maxAgeMs: number;
  readonly enableMetrics: boolean;
}

/**
 * Default cache configuration optimized for performance
 */
const DEFAULT_CACHE_CONFIG: CacheConfig = {
  maxEntries: 50,
  maxMemoryMB: 100,
  maxAgeMs: 5 * 60 * 1000, // 5 minutes
  enableMetrics: true,
} as const;

/**
 * High-performance render cache service
 *
 * Provides intelligent caching of BabylonJS meshes to avoid expensive
 * regeneration operations and achieve <10ms frame times.
 */
export class RenderCacheService {
  private cache = new Map<string, CacheEntry>();
  private config: CacheConfig;
  private hitCount = 0;
  private missCount = 0;

  // Shared utilities for cache management
  private keyGenerator = new CacheKeyGenerator();
  private statisticsCalculator = new CacheStatisticsCalculator();
  private entryManager = new CacheEntryManager();
  private limitsEnforcer = new CacheLimitsEnforcer();

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...DEFAULT_CACHE_CONFIG, ...config };
    logger.debug('[DEBUG][RenderCacheService] Initialized with config:', this.config);
  }

  /**
   * Generate a cache key from AST nodes
   *
   * @param astNodes - AST nodes to generate key for
   * @returns Unique cache key string
   */
  generateCacheKey(astNodes: readonly ASTNode[]): string {
    // Create simplified key data for AST nodes
    const keyData = astNodes.map((node) => ({
      type: node.type,
      // Include key properties that affect rendering
      id: 'id' in node ? node.id : undefined,
      parameters: 'parameters' in node ? node.parameters : undefined,
      children: 'children' in node ? node.children?.length : 0,
    }));

    // Use shared cache key generator
    return this.keyGenerator.generateKey(keyData, 'ast');
  }

  /**
   * Get cached meshes for a cache key
   *
   * @param cacheKey - Cache key to lookup
   * @returns Cached meshes or null if not found
   */
  getCachedMeshes(cacheKey: string): readonly AbstractMesh[] | null {
    const entry = this.cache.get(cacheKey);

    if (!entry) {
      this.missCount++;
      logger.debug(`[DEBUG][RenderCacheService] Cache miss for key: ${cacheKey}`);
      return null;
    }

    // Check if entry is expired
    const now = Date.now();
    if (now - entry.metadata.createdAt > this.config.maxAgeMs) {
      logger.debug(`[DEBUG][RenderCacheService] Cache entry expired for key: ${cacheKey}`);
      this.cache.delete(cacheKey);
      this.missCount++;
      return null;
    }

    // Update access metadata using shared utility
    const sharedEntry = this.entryManager.createEntry(
      cacheKey,
      entry.meshes,
      entry.metadata.renderTimeMs
    );
    const updatedSharedEntry = this.entryManager.updateAccessMetadata(sharedEntry);

    const updatedMetadata: CacheEntryMetadata = {
      ...entry.metadata,
      lastAccessed: updatedSharedEntry.metadata.lastAccessed,
      accessCount: updatedSharedEntry.metadata.accessCount,
    };

    this.cache.set(cacheKey, {
      ...entry,
      metadata: updatedMetadata,
    });

    this.hitCount++;
    logger.debug(
      `[DEBUG][RenderCacheService] Cache hit for key: ${cacheKey} (${entry.meshes.length} meshes)`
    );

    return entry.meshes;
  }

  /**
   * Cache meshes with metadata
   *
   * @param cacheKey - Cache key to store under
   * @param meshes - Meshes to cache
   * @param renderTimeMs - Time taken to render these meshes
   * @returns Result indicating success or failure
   */
  cacheMeshes(
    cacheKey: string,
    meshes: readonly AbstractMesh[],
    renderTimeMs: number = 0
  ): Result<void, Error> {
    try {
      // Estimate memory usage (rough approximation)
      const estimatedMemoryMB = this.estimateMemoryUsage(meshes);

      // Check memory limits
      if (estimatedMemoryMB > this.config.maxMemoryMB / 2) {
        logger.warn(
          `[WARN][RenderCacheService] Mesh set too large to cache: ${estimatedMemoryMB}MB`
        );
        return error(new Error(`Mesh set exceeds cache memory limit: ${estimatedMemoryMB}MB`));
      }

      // Create cache entry using shared utility
      const sharedEntry = this.entryManager.createEntry(cacheKey, meshes, renderTimeMs);

      // Adapt to local cache entry format
      const metadata: CacheEntryMetadata = {
        cacheKey: sharedEntry.metadata.cacheKey,
        createdAt: sharedEntry.metadata.createdAt,
        lastAccessed: sharedEntry.metadata.lastAccessed,
        accessCount: sharedEntry.metadata.accessCount,
        meshCount: meshes.length,
        estimatedMemoryMB: sharedEntry.metadata.estimatedMemoryMB,
        renderTimeMs: sharedEntry.metadata.renderTimeMs,
      };

      const entry: CacheEntry = {
        meshes,
        metadata,
      };

      this.cache.set(cacheKey, entry);

      // Ensure cache size limits after adding the entry using shared utilities
      this.enforceSharedLimits();

      logger.debug(
        `[DEBUG][RenderCacheService] Cached ${meshes.length} meshes for key: ${cacheKey} ` +
          `(${estimatedMemoryMB.toFixed(1)}MB, ${renderTimeMs.toFixed(1)}ms render time)`
      );

      return success(undefined);
    } catch (err) {
      return error(
        new Error(`Failed to cache meshes: ${err instanceof Error ? err.message : 'Unknown error'}`)
      );
    }
  }

  /**
   * Clear all cached entries
   */
  clearCache(): void {
    const entryCount = this.cache.size;
    this.cache.clear();
    this.hitCount = 0;
    this.missCount = 0;

    logger.debug(`[DEBUG][RenderCacheService] Cleared cache (${entryCount} entries removed)`);
  }

  /**
   * Get cache statistics for performance monitoring
   */
  /**
   * Perform automatic cleanup of the cache.
   */
  performAutomaticCleanup(): Result<CleanupResult, Error> {
    const startTime = performance.now();
    const pressureBefore = 'low' as const;
    const initialMemory = this.getStatistics().totalMemoryMB;
    const initialCount = this.cache.size;

    this.enforceSharedLimits();

    const finalMemory = this.getStatistics().totalMemoryMB;
    const finalCount = this.cache.size;
    const pressureAfter = 'low' as const;
    const cleanupTimeMs = performance.now() - startTime;

    return success({
      resourcesFreed: initialCount - finalCount,
      memoryFreedMB: initialMemory - finalMemory,
      cleanupTimeMs,
      pressureBefore,
      pressureAfter,
    });
  }

  /**
   * Get cache statistics for performance monitoring
   */
  getStatistics(): CacheStatistics {
    // Convert local cache entries to shared format for statistics calculation
    const sharedEntries = Array.from(this.cache.values()).map((entry) =>
      this.entryManager.createEntry(
        entry.metadata.cacheKey,
        entry.meshes,
        entry.metadata.renderTimeMs
      )
    );

    // Use shared statistics calculator
    const sharedStats = this.statisticsCalculator.calculateStatistics(
      sharedEntries,
      this.hitCount,
      this.missCount
    );

    // Return in local format
    return {
      totalEntries: sharedStats.totalEntries,
      totalMemoryMB: sharedStats.totalMemoryMB,
      hitRate: sharedStats.hitRate,
      averageRenderTime: sharedStats.averageRenderTime,
      oldestEntryAge: sharedStats.oldestEntryAge,
      mostAccessedKey: sharedStats.mostAccessedKey,
    };
  }

  /**
   * Estimate memory usage of mesh array
   */
  private estimateMemoryUsage(meshes: readonly AbstractMesh[]): number {
    // Rough estimation: 1KB per vertex + 0.5KB per face
    let totalVertices = 0;
    let totalFaces = 0;

    for (const mesh of meshes) {
      if (mesh.geometry) {
        const positions = mesh.geometry.getVerticesData('position');
        const indices = mesh.geometry.getIndices();

        if (positions) totalVertices += positions.length / 3;
        if (indices) totalFaces += indices.length / 3;
      }
    }

    return (totalVertices * 1 + totalFaces * 0.5) / 1024; // Convert to MB
  }

  /**
   * Enforce cache limits using shared utilities
   */
  private enforceSharedLimits(): void {
    // Convert local cache entries to shared format
    const sharedEntries = Array.from(this.cache.values()).map((entry) =>
      this.entryManager.createEntry(
        entry.metadata.cacheKey,
        entry.meshes,
        entry.metadata.renderTimeMs
      )
    );

    // Use shared limits enforcer for memory limits
    const memoryToRemove = this.limitsEnforcer.enforceMemoryLimits(
      sharedEntries,
      this.config.maxMemoryMB
    );

    // Use shared limits enforcer for size limits
    const sizeToRemove = this.limitsEnforcer.enforceSizeLimits(
      sharedEntries,
      this.config.maxEntries
    );

    // Combine removal lists (avoid duplicates)
    const allToRemove = new Set([
      ...memoryToRemove.map((entry) => entry.key),
      ...sizeToRemove.map((entry) => entry.key),
    ]);

    // Remove entries from local cache
    let removedCount = 0;
    let removedMemory = 0;

    for (const key of allToRemove) {
      const entry = this.cache.get(key);
      if (entry) {
        this.cache.delete(key);
        removedCount++;
        removedMemory += entry.metadata.estimatedMemoryMB;
      }
    }

    if (removedCount > 0) {
      logger.debug(
        `[DEBUG][RenderCacheService] Enforced cache limits: removed ${removedCount} entries ` +
          `(${removedMemory.toFixed(1)}MB freed)`
      );
    }
  }
}
