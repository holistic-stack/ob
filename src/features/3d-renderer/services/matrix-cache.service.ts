/**
 * Matrix Cache Service
 * 
 * High-performance caching system for matrix operations with LRU eviction,
 * performance monitoring, and memory management following bulletproof-react service patterns.
 */

import { Matrix } from 'ml-matrix';
import type { 
  MatrixCacheEntry, 
  MatrixPerformanceMetrics,
  MatrixOperationResult 
} from '../types/matrix.types';
import { MATRIX_CONFIG, getCacheKey } from '../config/matrix-config';
import { matrixUtils } from '../utils/matrix-adapters';
import { success, error } from '../../../shared/utils/functional/result';
import type { Result } from '../../../shared/types/result.types';

/**
 * LRU Cache Node for doubly linked list
 */
class CacheNode {
  constructor(
    public key: string,
    public entry: MatrixCacheEntry,
    public prev: CacheNode | null = null,
    public next: CacheNode | null = null
  ) {}
}

/**
 * Matrix Cache Service with LRU eviction and performance monitoring
 */
export class MatrixCacheService {
  private cache = new Map<string, CacheNode>();
  private head: CacheNode | null = null;
  private tail: CacheNode | null = null;
  private currentMemoryUsage = 0;
  private performanceMetrics: MatrixPerformanceMetrics = {
    operationCount: 0,
    totalExecutionTime: 0,
    averageExecutionTime: 0,
    cacheHitRate: 0,
    memoryUsage: 0,
    largeMatrixOperations: 0,
    failedOperations: 0
  };
  private cacheHits = 0;
  private cacheMisses = 0;

  constructor() {
    console.log('[INIT][MatrixCacheService] Initializing matrix cache service');
    this.initializeCache();
  }

  /**
   * Initialize cache with dummy head and tail nodes
   */
  private initializeCache(): void {
    this.head = new CacheNode('__head__', {} as MatrixCacheEntry);
    this.tail = new CacheNode('__tail__', {} as MatrixCacheEntry);
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }

  /**
   * Add node to head of doubly linked list
   */
  private addToHead(node: CacheNode): void {
    if (!this.head) return;
    
    node.prev = this.head;
    node.next = this.head.next;
    
    if (this.head.next) {
      this.head.next.prev = node;
    }
    this.head.next = node;
  }

  /**
   * Remove node from doubly linked list
   */
  private removeNode(node: CacheNode): void {
    if (node.prev) {
      node.prev.next = node.next;
    }
    if (node.next) {
      node.next.prev = node.prev;
    }
  }

  /**
   * Move node to head (mark as recently used)
   */
  private moveToHead(node: CacheNode): void {
    this.removeNode(node);
    this.addToHead(node);
  }

  /**
   * Remove tail node (least recently used)
   */
  private removeTail(): CacheNode | null {
    if (!this.tail || !this.tail.prev || this.tail.prev === this.head) {
      return null;
    }
    
    const lastNode = this.tail.prev;
    this.removeNode(lastNode);
    return lastNode;
  }

  /**
   * Calculate memory usage for a matrix
   */
  private calculateMemoryUsage(matrix: Matrix): number {
    return matrixUtils.memoryUsage(matrix);
  }

  /**
   * Check if cache has space for new entry
   */
  private hasSpaceForEntry(memoryNeeded: number): boolean {
    const config = MATRIX_CONFIG.cache;
    return (this.currentMemoryUsage + memoryNeeded) <= config.memoryLimit &&
           this.cache.size < config.maxCacheSize;
  }

  /**
   * Evict entries to make space
   */
  private evictToMakeSpace(memoryNeeded: number): void {
    const config = MATRIX_CONFIG.cache;
    
    while (
      (this.currentMemoryUsage + memoryNeeded > config.memoryLimit ||
       this.cache.size >= config.maxCacheSize) &&
      this.cache.size > 0
    ) {
      const evicted = this.removeTail();
      if (!evicted) break;
      
      this.cache.delete(evicted.key);
      this.currentMemoryUsage -= evicted.entry.size;
      
      console.log(`[DEBUG][MatrixCacheService] Evicted cache entry: ${evicted.key}`);
    }
  }

  /**
   * Create cache entry for matrix
   */
  private createCacheEntry(matrix: Matrix, metadata: Record<string, unknown> = {}): MatrixCacheEntry {
    const now = Date.now();
    const size = this.calculateMemoryUsage(matrix);
    const hash = matrixUtils.hash(matrix);
    
    return {
      matrix: matrix.clone(),
      timestamp: now,
      accessCount: 1,
      lastAccessed: now,
      size,
      hash,
      metadata
    };
  }

  /**
   * Get matrix from cache
   */
  get(key: string): Result<Matrix | null, string> {
    console.log(`[DEBUG][MatrixCacheService] Cache get: ${key}`);
    
    try {
      const node = this.cache.get(key);
      
      if (!node) {
        this.cacheMisses++;
        console.log(`[DEBUG][MatrixCacheService] Cache miss: ${key}`);
        return success(null);
      }

      // Check TTL
      const now = Date.now();
      const age = now - node.entry.timestamp;
      
      if (age > MATRIX_CONFIG.cache.cacheTTL) {
        console.log(`[DEBUG][MatrixCacheService] Cache entry expired: ${key}`);
        this.delete(key);
        this.cacheMisses++;
        return success(null);
      }

      // Update access information
      node.entry = {
        ...node.entry,
        accessCount: node.entry.accessCount + 1,
        lastAccessed: now
      };

      // Move to head (mark as recently used)
      this.moveToHead(node);
      this.cacheHits++;
      
      console.log(`[DEBUG][MatrixCacheService] Cache hit: ${key}`);
      return success(node.entry.matrix.clone());
    } catch (err) {
      const errorMessage = `Cache get failed: ${err instanceof Error ? err.message : String(err)}`;
      console.error('[ERROR][MatrixCacheService]', errorMessage);
      return error(errorMessage);
    }
  }

  /**
   * Set matrix in cache
   */
  set(key: string, matrix: Matrix, metadata: Record<string, unknown> = {}): Result<void, string> {
    console.log(`[DEBUG][MatrixCacheService] Cache set: ${key}`);
    
    try {
      const memoryNeeded = this.calculateMemoryUsage(matrix);
      
      // Check if matrix is cacheable
      if (!MATRIX_CONFIG.cache.enableLRU && this.cache.size >= MATRIX_CONFIG.cache.maxCacheSize) {
        return error('Cache is full and LRU is disabled');
      }

      // Evict if necessary
      if (!this.hasSpaceForEntry(memoryNeeded)) {
        this.evictToMakeSpace(memoryNeeded);
      }

      // Remove existing entry if present
      if (this.cache.has(key)) {
        this.delete(key);
      }

      // Create new entry
      const entry = this.createCacheEntry(matrix, metadata);
      const node = new CacheNode(key, entry);
      
      // Add to cache and linked list
      this.cache.set(key, node);
      this.addToHead(node);
      this.currentMemoryUsage += entry.size;
      
      console.log(`[DEBUG][MatrixCacheService] Cached matrix: ${key} (${entry.size} bytes)`);
      return success(undefined);
    } catch (err) {
      const errorMessage = `Cache set failed: ${err instanceof Error ? err.message : String(err)}`;
      console.error('[ERROR][MatrixCacheService]', errorMessage);
      return error(errorMessage);
    }
  }

  /**
   * Delete matrix from cache
   */
  delete(key: string): Result<boolean, string> {
    console.log(`[DEBUG][MatrixCacheService] Cache delete: ${key}`);
    
    try {
      const node = this.cache.get(key);
      
      if (!node) {
        return success(false);
      }

      this.removeNode(node);
      this.cache.delete(key);
      this.currentMemoryUsage -= node.entry.size;
      
      console.log(`[DEBUG][MatrixCacheService] Deleted cache entry: ${key}`);
      return success(true);
    } catch (err) {
      const errorMessage = `Cache delete failed: ${err instanceof Error ? err.message : String(err)}`;
      console.error('[ERROR][MatrixCacheService]', errorMessage);
      return error(errorMessage);
    }
  }

  /**
   * Check if key exists in cache
   */
  has(key: string): boolean {
    const node = this.cache.get(key);
    if (!node) return false;
    
    // Check TTL
    const age = Date.now() - node.entry.timestamp;
    if (age > MATRIX_CONFIG.cache.cacheTTL) {
      this.delete(key);
      return false;
    }
    
    return true;
  }

  /**
   * Clear all cache entries
   */
  clear(): Result<void, string> {
    console.log('[DEBUG][MatrixCacheService] Clearing cache');
    
    try {
      this.cache.clear();
      this.currentMemoryUsage = 0;
      this.initializeCache();
      
      console.log('[DEBUG][MatrixCacheService] Cache cleared');
      return success(undefined);
    } catch (err) {
      const errorMessage = `Cache clear failed: ${err instanceof Error ? err.message : String(err)}`;
      console.error('[ERROR][MatrixCacheService]', errorMessage);
      return error(errorMessage);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): MatrixPerformanceMetrics {
    const totalRequests = this.cacheHits + this.cacheMisses;
    const hitRate = totalRequests > 0 ? this.cacheHits / totalRequests : 0;
    
    return {
      ...this.performanceMetrics,
      cacheHitRate: hitRate,
      memoryUsage: this.currentMemoryUsage
    };
  }

  /**
   * Update performance metrics
   */
  updateMetrics(operationResult: MatrixOperationResult): void {
    this.performanceMetrics.operationCount++;
    this.performanceMetrics.totalExecutionTime += operationResult.performance.executionTime;
    this.performanceMetrics.averageExecutionTime = 
      this.performanceMetrics.totalExecutionTime / this.performanceMetrics.operationCount;
    
    const [rows, cols] = operationResult.performance.matrixSize;
    const size = rows * cols;
    
    if (size >= MATRIX_CONFIG.performance.largeMatrixThreshold) {
      this.performanceMetrics.largeMatrixOperations++;
    }
  }

  /**
   * Record failed operation
   */
  recordFailure(): void {
    this.performanceMetrics.failedOperations++;
  }

  /**
   * Get cache size information
   */
  getSizeInfo(): {
    entryCount: number;
    memoryUsage: number;
    memoryLimit: number;
    utilizationPercent: number;
  } {
    const memoryLimit = MATRIX_CONFIG.cache.memoryLimit;
    const utilizationPercent = (this.currentMemoryUsage / memoryLimit) * 100;
    
    return {
      entryCount: this.cache.size,
      memoryUsage: this.currentMemoryUsage,
      memoryLimit,
      utilizationPercent
    };
  }

  /**
   * Cleanup expired entries
   */
  cleanup(): Result<number, string> {
    console.log('[DEBUG][MatrixCacheService] Running cache cleanup');
    
    try {
      const now = Date.now();
      const ttl = MATRIX_CONFIG.cache.cacheTTL;
      let cleanedCount = 0;
      
      for (const [key, node] of this.cache.entries()) {
        const age = now - node.entry.timestamp;
        if (age > ttl) {
          this.delete(key);
          cleanedCount++;
        }
      }
      
      console.log(`[DEBUG][MatrixCacheService] Cleaned ${cleanedCount} expired entries`);
      return success(cleanedCount);
    } catch (err) {
      const errorMessage = `Cache cleanup failed: ${err instanceof Error ? err.message : String(err)}`;
      console.error('[ERROR][MatrixCacheService]', errorMessage);
      return error(errorMessage);
    }
  }

  /**
   * Get all cache keys
   */
  getKeys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Get cache entry metadata
   */
  getEntryMetadata(key: string): MatrixCacheEntry | null {
    const node = this.cache.get(key);
    return node ? { ...node.entry } : null;
  }
}
