/**
 * @file cache-utilities.ts
 * @description Reusable caching utilities extracted from existing services.
 * Provides cache key generation, cache statistics, cache entry management, and cache limits enforcement
 * to eliminate code duplication and improve reusability across the codebase.
 *
 * @example
 * ```typescript
 * // Cache key generation
 * const generator = new CacheKeyGenerator();
 * const key = generator.generateKey(astNodes, 'ast');
 *
 * // Cache statistics
 * const calculator = new CacheStatisticsCalculator();
 * const stats = calculator.calculateStatistics(entries, hits, misses);
 *
 * // Cache entry management
 * const manager = new CacheEntryManager();
 * const entry = manager.createEntry(key, data, renderTime);
 *
 * // Cache limits enforcement
 * const enforcer = new CacheLimitsEnforcer();
 * const toRemove = enforcer.enforceMemoryLimits(entries, maxMemoryMB);
 * ```
 *
 * @author OpenSCAD Babylon Team
 * @version 1.0.0
 * @since 2025-07-30
 */

/**
 * Generic cache entry interface
 */
export interface CacheEntry<T = unknown> {
  readonly key: string;
  readonly data: T;
  readonly metadata: CacheEntryMetadata;
}

/**
 * Cache entry metadata for performance tracking
 */
export interface CacheEntryMetadata {
  readonly cacheKey: string;
  readonly createdAt: number;
  readonly lastAccessed: number;
  readonly accessCount: number;
  readonly estimatedMemoryMB: number;
  readonly renderTimeMs: number;
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
 * Cache key generator for creating consistent, hash-based cache keys
 */
export class CacheKeyGenerator {
  /**
   * Generate a cache key from an object
   *
   * @param obj - Object to generate key for
   * @param prefix - Optional prefix for the key
   * @returns Unique cache key string
   */
  generateKey(obj: unknown, prefix: string = 'cache'): string {
    // Create deterministic string representation
    const keyString = JSON.stringify(obj, this.replacer);

    // Simple hash function for cache key
    let hash = 0;
    for (let i = 0; i < keyString.length; i++) {
      const char = keyString.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash &= hash; // Convert to 32-bit integer
    }

    const objectSize = this.estimateObjectSize(obj);
    return `${prefix}_${Math.abs(hash).toString(36)}_${objectSize}`;
  }

  /**
   * Validate cache key format
   *
   * @param key - Cache key to validate
   * @returns True if key is valid
   */
  isValidKey(key: string): boolean {
    return /^[a-z]+_[a-z0-9]+_\d+$/.test(key);
  }

  /**
   * JSON replacer function for consistent serialization
   */
  private replacer(_key: string, value: unknown): unknown {
    if (value === null || value === undefined) {
      return null;
    }
    if (typeof value === 'object' && Array.isArray(value)) {
      return value.slice().sort();
    }
    return value;
  }

  /**
   * Estimate object size for key generation
   */
  private estimateObjectSize(obj: unknown): number {
    if (obj === null || obj === undefined) return 0;
    if (typeof obj === 'string') return obj.length;
    if (typeof obj === 'number') return 1;
    if (typeof obj === 'boolean') return 1;
    if (Array.isArray(obj)) return obj.length;
    if (typeof obj === 'object') return Object.keys(obj).length;
    return 1;
  }
}

/**
 * Cache statistics calculator for performance monitoring
 */
export class CacheStatisticsCalculator {
  /**
   * Calculate hit rate from hits and misses
   *
   * @param hits - Number of cache hits
   * @param misses - Number of cache misses
   * @returns Hit rate (0-1)
   */
  calculateHitRate(hits: number, misses: number): number {
    const total = hits + misses;
    return total > 0 ? hits / total : 0;
  }

  /**
   * Calculate comprehensive cache statistics
   *
   * @param entries - Cache entries
   * @param hits - Total cache hits
   * @param misses - Total cache misses
   * @returns Cache statistics
   */
  calculateStatistics<T>(
    entries: readonly CacheEntry<T>[],
    hits: number,
    misses: number
  ): CacheStatistics {
    if (entries.length === 0) {
      return {
        totalEntries: 0,
        totalMemoryMB: 0,
        hitRate: 0,
        averageRenderTime: 0,
        oldestEntryAge: 0,
        mostAccessedKey: '',
      };
    }

    const now = Date.now();
    const totalMemoryMB = entries.reduce((sum, entry) => sum + entry.metadata.estimatedMemoryMB, 0);
    const averageRenderTime =
      entries.reduce((sum, entry) => sum + entry.metadata.renderTimeMs, 0) / entries.length;
    const oldestEntryAge = Math.max(...entries.map((entry) => now - entry.metadata.createdAt));

    const mostAccessedEntry = entries.reduce((max, entry) =>
      entry.metadata.accessCount > max.metadata.accessCount ? entry : max
    );

    return {
      totalEntries: entries.length,
      totalMemoryMB,
      hitRate: this.calculateHitRate(hits, misses),
      averageRenderTime,
      oldestEntryAge,
      mostAccessedKey: mostAccessedEntry.key,
    };
  }
}

/**
 * Cache entry manager for creating and updating cache entries
 */
export class CacheEntryManager {
  /**
   * Create a new cache entry with metadata
   *
   * @param key - Cache key
   * @param data - Data to cache
   * @param renderTimeMs - Time taken to generate the data
   * @returns Cache entry with metadata
   */
  createEntry<T>(key: string, data: T, renderTimeMs: number = 0): CacheEntry<T> {
    const now = Date.now();
    const estimatedMemoryMB = this.estimateMemoryUsage(data);

    const metadata: CacheEntryMetadata = {
      cacheKey: key,
      createdAt: now,
      lastAccessed: now,
      accessCount: 0,
      estimatedMemoryMB,
      renderTimeMs,
    };

    return {
      key,
      data,
      metadata,
    };
  }

  /**
   * Update access metadata for cache entry
   *
   * @param entry - Cache entry to update
   * @returns Updated cache entry
   */
  updateAccessMetadata<T>(entry: CacheEntry<T>): CacheEntry<T> {
    const now = Date.now();
    const updatedMetadata: CacheEntryMetadata = {
      ...entry.metadata,
      lastAccessed: now,
      accessCount: entry.metadata.accessCount + 1,
    };

    return {
      ...entry,
      metadata: updatedMetadata,
    };
  }

  /**
   * Check if cache entry is expired
   *
   * @param entry - Cache entry to check
   * @param maxAgeMs - Maximum age in milliseconds
   * @returns True if entry is expired
   */
  isExpired<T>(entry: CacheEntry<T>, maxAgeMs: number): boolean {
    const now = Date.now();
    return now - entry.metadata.createdAt > maxAgeMs;
  }

  /**
   * Estimate memory usage of data
   */
  private estimateMemoryUsage(data: unknown): number {
    if (data === null || data === undefined) return 0;

    try {
      const jsonString = JSON.stringify(data);
      // Rough estimation: 2 bytes per character (UTF-16) + overhead
      return (jsonString.length * 2 + 1024) / (1024 * 1024); // Convert to MB
    } catch {
      // Fallback for non-serializable data
      return 0.1; // 100KB default
    }
  }
}

/**
 * Cache limits enforcer for managing cache size and memory limits
 */
export class CacheLimitsEnforcer {
  /**
   * Enforce memory limits by identifying entries to remove
   *
   * @param entries - Current cache entries
   * @param maxMemoryMB - Maximum memory limit in MB
   * @returns Entries to remove
   */
  enforceMemoryLimits<T>(entries: readonly CacheEntry<T>[], maxMemoryMB: number): CacheEntry<T>[] {
    const totalMemory = entries.reduce((sum, entry) => sum + entry.metadata.estimatedMemoryMB, 0);

    if (totalMemory <= maxMemoryMB) {
      return [];
    }

    const memoryToFree = totalMemory - maxMemoryMB;

    // Sort by last accessed time (oldest first)
    const sortedEntries = [...entries].sort(
      (a, b) => a.metadata.lastAccessed - b.metadata.lastAccessed
    );

    const toRemove: CacheEntry<T>[] = [];
    let freedMemory = 0;

    for (const entry of sortedEntries) {
      if (freedMemory >= memoryToFree) {
        break;
      }
      toRemove.push(entry);
      freedMemory += entry.metadata.estimatedMemoryMB;
    }

    return toRemove;
  }

  /**
   * Enforce size limits by identifying entries to remove
   *
   * @param entries - Current cache entries
   * @param maxEntries - Maximum number of entries
   * @returns Entries to remove
   */
  enforceSizeLimits<T>(entries: readonly CacheEntry<T>[], maxEntries: number): CacheEntry<T>[] {
    if (entries.length <= maxEntries) {
      return [];
    }

    const entriesToRemove = entries.length - maxEntries;

    // Sort by last accessed time (oldest first)
    const sortedEntries = [...entries].sort(
      (a, b) => a.metadata.lastAccessed - b.metadata.lastAccessed
    );

    return sortedEntries.slice(0, entriesToRemove);
  }

  /**
   * Find expired entries
   *
   * @param entries - Current cache entries
   * @param maxAgeMs - Maximum age in milliseconds
   * @returns Expired entries
   */
  findExpiredEntries<T>(entries: readonly CacheEntry<T>[], maxAgeMs: number): CacheEntry<T>[] {
    const now = Date.now();
    return entries.filter((entry) => now - entry.metadata.createdAt > maxAgeMs);
  }
}

/**
 * Generate hash-based cache key from object (standalone utility)
 *
 * @param obj - Object to generate key for
 * @param prefix - Optional prefix for the key
 * @returns Cache key string
 */
export function generateHashKey(obj: unknown, prefix: string = 'cache'): string {
  const generator = new CacheKeyGenerator();
  return generator.generateKey(obj, prefix);
}

/**
 * Calculate cache hit rate (standalone utility)
 *
 * @param hits - Number of cache hits
 * @param misses - Number of cache misses
 * @returns Hit rate (0-1)
 */
export function calculateCacheHitRate(hits: number, misses: number): number {
  const calculator = new CacheStatisticsCalculator();
  return calculator.calculateHitRate(hits, misses);
}

/**
 * Create cache entry with metadata (standalone utility)
 *
 * @param key - Cache key
 * @param data - Data to cache
 * @param renderTimeMs - Time taken to generate the data
 * @returns Cache entry
 */
export function createCacheEntry<T>(key: string, data: T, renderTimeMs: number = 0): CacheEntry<T> {
  const manager = new CacheEntryManager();
  return manager.createEntry(key, data, renderTimeMs);
}

/**
 * Enforce cache memory limits (standalone utility)
 *
 * @param entries - Current cache entries
 * @param maxMemoryMB - Maximum memory limit in MB
 * @returns Entries to remove
 */
export function enforceCacheMemoryLimits<T>(
  entries: readonly CacheEntry<T>[],
  maxMemoryMB: number
): CacheEntry<T>[] {
  const enforcer = new CacheLimitsEnforcer();
  return enforcer.enforceMemoryLimits(entries, maxMemoryMB);
}
