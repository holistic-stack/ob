/**
 * @file geometry-cache.service.ts
 * @description High-performance geometry caching service for OpenSCAD Geometry Builder.
 * Implements intelligent caching strategies to avoid redundant geometry generation
 * for identical parameters, optimizing performance for repeated primitive creation.
 *
 * @example
 * ```typescript
 * const cacheService = new GeometryCacheService();
 *
 * // Check cache before expensive geometry generation
 * const cacheKey = cacheService.generateCacheKey('sphere', { radius: 5, fn: 8 });
 * const cachedGeometry = cacheService.getCachedGeometry(cacheKey);
 *
 * if (cachedGeometry) {
 *   console.log('Cache hit! Using cached geometry');
 *   return cachedGeometry;
 * }
 *
 * // Perform expensive generation and cache result
 * const newGeometry = await generateGeometry(parameters);
 * cacheService.cacheGeometry(cacheKey, newGeometry);
 * ```
 *
 * @author OpenSCAD Babylon Team
 * @version 1.0.0
 * @since 2025-07-30
 */

import { createLogger } from '@/shared/services/logger.service';
import type { Result } from '@/shared/types/result.types';
import { error, success } from '@/shared/utils/functional/result';
import type {
  Polygon2DGeometryData,
  Polyhedron3DGeometryData,
} from '../primitive-generators/types';

const logger = createLogger('GeometryCacheService');

/**
 * Cache entry metadata for performance tracking
 */
export interface GeometryCacheEntry {
  readonly cacheKey: string;
  readonly geometry: Polyhedron3DGeometryData | Polygon2DGeometryData;
  readonly createdAt: number;
  readonly lastAccessed: number;
  readonly accessCount: number;
  readonly memorySize: number; // Estimated memory usage in bytes
}

/**
 * Cache statistics for monitoring and optimization
 */
export interface GeometryCacheStatistics {
  readonly totalEntries: number;
  readonly totalMemoryUsage: number; // Total memory usage in bytes
  readonly hitRate: number; // Cache hit rate as percentage
  readonly totalHits: number;
  readonly totalMisses: number;
  readonly mostAccessedKey: string | null;
  readonly oldestEntry: string | null;
  readonly newestEntry: string | null;
}

/**
 * Configuration options for geometry cache
 */
export interface GeometryCacheConfig {
  readonly maxEntries: number;
  readonly maxMemoryMB: number;
  readonly ttlMs: number; // Time to live in milliseconds
}

/**
 * Default cache configuration optimized for OpenSCAD geometry
 */
const DEFAULT_CACHE_CONFIG: GeometryCacheConfig = {
  maxEntries: 1000, // Maximum number of cached geometries
  maxMemoryMB: 100, // Maximum memory usage (100MB)
  ttlMs: 5 * 60 * 1000, // 5 minutes TTL
};

/**
 * High-performance geometry caching service for OpenSCAD Geometry Builder
 */
export class GeometryCacheService {
  private readonly cache = new Map<string, GeometryCacheEntry>();
  private readonly config: GeometryCacheConfig;
  private hitCount = 0;
  private missCount = 0;

  constructor(config: Partial<GeometryCacheConfig> = {}) {
    this.config = { ...DEFAULT_CACHE_CONFIG, ...config };
    logger.init('[INIT] GeometryCacheService initialized with config:', this.config);
  }

  /**
   * Generate cache key for geometry parameters
   */
  generateCacheKey(primitiveType: string, parameters: Record<string, unknown>): string {
    // Sort parameters for consistent key generation
    const sortedParams = Object.keys(parameters)
      .sort()
      .reduce(
        (sorted, key) => {
          sorted[key] = parameters[key];
          return sorted;
        },
        {} as Record<string, unknown>
      );

    const paramString = JSON.stringify(sortedParams);
    return `${primitiveType}:${paramString}`;
  }

  /**
   * Get cached geometry if available
   */
  getCachedGeometry(
    cacheKey: string
  ): Result<Polyhedron3DGeometryData | Polygon2DGeometryData, Error> {
    const entry = this.cache.get(cacheKey);

    if (!entry) {
      this.missCount++;
      logger.debug(`[CACHE_MISS] Key: ${cacheKey}`);
      return error(new Error('Cache miss'));
    }

    // Check TTL
    const now = Date.now();
    if (now - entry.createdAt > this.config.ttlMs) {
      this.cache.delete(cacheKey);
      this.missCount++;
      logger.debug(`[CACHE_EXPIRED] Key: ${cacheKey}`);
      return error(new Error('Cache entry expired'));
    }

    // Update access metadata
    const updatedEntry: GeometryCacheEntry = {
      ...entry,
      lastAccessed: now,
      accessCount: entry.accessCount + 1,
    };
    this.cache.set(cacheKey, updatedEntry);

    this.hitCount++;
    logger.debug(`[CACHE_HIT] Key: ${cacheKey}, Access count: ${updatedEntry.accessCount}`);

    return success(entry.geometry);
  }

  /**
   * Cache geometry data
   */
  cacheGeometry(
    cacheKey: string,
    geometry: Polyhedron3DGeometryData | Polygon2DGeometryData
  ): Result<void, Error> {
    try {
      const now = Date.now();
      const memorySize = this.estimateMemorySize(geometry);

      const entry: GeometryCacheEntry = {
        cacheKey,
        geometry: Object.freeze(geometry), // Ensure immutability
        createdAt: now,
        lastAccessed: now,
        accessCount: 0,
        memorySize,
      };

      // Check if we need to enforce limits before adding
      this.enforceLimits(memorySize);

      this.cache.set(cacheKey, entry);

      logger.debug(`[CACHE_STORE] Key: ${cacheKey}, Memory: ${(memorySize / 1024).toFixed(2)}KB`);

      return success(undefined);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error(`[CACHE_ERROR] Failed to cache geometry: ${errorMessage}`);
      return error(new Error(`Failed to cache geometry: ${errorMessage}`));
    }
  }

  /**
   * Clear all cached entries
   */
  clearCache(): void {
    const entriesCleared = this.cache.size;
    this.cache.clear();
    this.hitCount = 0;
    this.missCount = 0;

    logger.info(`[CACHE_CLEAR] Cleared ${entriesCleared} entries`);
  }

  /**
   * Get cache statistics
   */
  getStatistics(): GeometryCacheStatistics {
    const entries = Array.from(this.cache.values());
    const totalMemoryUsage = entries.reduce((sum, entry) => sum + entry.memorySize, 0);
    const totalRequests = this.hitCount + this.missCount;
    const hitRate = totalRequests > 0 ? (this.hitCount / totalRequests) * 100 : 0;

    // Find most accessed entry
    const mostAccessed = entries.reduce(
      (max, entry) => (entry.accessCount > (max?.accessCount ?? 0) ? entry : max),
      null as GeometryCacheEntry | null
    );

    // Find oldest and newest entries
    const oldest = entries.reduce(
      (min, entry) => (entry.createdAt < (min?.createdAt ?? Infinity) ? entry : min),
      null as GeometryCacheEntry | null
    );

    const newest = entries.reduce(
      (max, entry) => (entry.createdAt > (max?.createdAt ?? 0) ? entry : max),
      null as GeometryCacheEntry | null
    );

    return {
      totalEntries: this.cache.size,
      totalMemoryUsage,
      hitRate,
      totalHits: this.hitCount,
      totalMisses: this.missCount,
      mostAccessedKey: mostAccessed?.cacheKey ?? null,
      oldestEntry: oldest?.cacheKey ?? null,
      newestEntry: newest?.cacheKey ?? null,
    };
  }

  /**
   * Enforce cache limits by removing entries
   */
  private enforceLimits(newEntrySize: number): void {
    // Check memory limit
    const currentMemory = Array.from(this.cache.values()).reduce(
      (sum, entry) => sum + entry.memorySize,
      0
    );

    const maxMemoryBytes = this.config.maxMemoryMB * 1024 * 1024;

    if (currentMemory + newEntrySize > maxMemoryBytes) {
      this.evictLeastRecentlyUsed();
    }

    // Check entry count limit
    if (this.cache.size >= this.config.maxEntries) {
      this.evictLeastRecentlyUsed();
    }
  }

  /**
   * Evict least recently used entries
   */
  private evictLeastRecentlyUsed(): void {
    const entries = Array.from(this.cache.entries());

    // Sort by last accessed time (oldest first)
    entries.sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed);

    // Remove oldest 25% of entries
    const entriesToRemove = Math.max(1, Math.floor(entries.length * 0.25));

    for (let i = 0; i < entriesToRemove; i++) {
      const [key] = entries[i];
      this.cache.delete(key);
      logger.debug(`[CACHE_EVICT] Removed LRU entry: ${key}`);
    }
  }

  /**
   * Estimate memory size of geometry data
   */
  private estimateMemorySize(geometry: Polyhedron3DGeometryData | Polygon2DGeometryData): number {
    // Rough estimation based on data structure
    const baseSize = 1000; // Base overhead

    if ('vertices' in geometry && 'faces' in geometry) {
      // 3D geometry
      const vertexSize = geometry.vertices.length * 3 * 8; // 3 floats per vertex, 8 bytes per float
      const faceSize = geometry.faces.length * 3 * 4; // 3 indices per face, 4 bytes per index
      return baseSize + vertexSize + faceSize;
    } else if ('vertices' in geometry && 'outline' in geometry) {
      // 2D geometry
      const vertexSize = geometry.vertices.length * 2 * 8; // 2 floats per vertex, 8 bytes per float
      const outlineSize = geometry.outline.length * 4; // 4 bytes per index
      const holesSize = geometry.holes.reduce((sum, hole) => sum + hole.length * 4, 0);
      return baseSize + vertexSize + outlineSize + holesSize;
    }

    return baseSize;
  }
}
