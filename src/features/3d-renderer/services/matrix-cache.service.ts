/**
 * Matrix Cache Service
 *
 * High-performance caching system for matrix operations with LRU eviction,
 * performance monitoring, and memory management following bulletproof-react service patterns.
 */

import type { Matrix } from 'ml-matrix';
import { createLogger } from '../../../shared/services/logger.service.js';
import type { Result } from '../../../shared/types/result.types.js';
import { error, success } from '../../../shared/utils/functional/result.js';
import {
  ErrorRateMonitor,
  type RetryConfig,
  retryWithBackoff,
} from '../../../shared/utils/resilience/index.js';
import { MATRIX_CONFIG } from '../config/matrix-config.js';
import { TransientFailureError } from '../errors/index.js';
import type {
  MatrixCacheEntry,
  MatrixOperationResult,
  MatrixPerformanceMetrics,
} from '../types/matrix.types.js';
import { matrixUtils } from '../utils/matrix-adapters.js';

const logger = createLogger('MatrixCacheService');

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
  private readonly cache = new Map<string, CacheNode>();
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
    failedOperations: 0,
  };
  private cacheHits = 0;
  private cacheMisses = 0;
  private readonly errorMonitor: ErrorRateMonitor;
  private readonly retryConfig: RetryConfig;
  private abortController: AbortController | null = null;

  constructor(abortSignal?: AbortSignal) {
    logger.init('Initializing matrix cache service with robust error handling');

    // Initialize error rate monitoring
    this.errorMonitor = new ErrorRateMonitor({
      windowSizeMs: 300000, // 5 minutes
      errorThreshold: 20, // 20% threshold
      minSampleSize: 5,
      warningThreshold: 10, // 10%
      enableAutoRecovery: true,
    });

    // Configure retry settings for cache operations
    this.retryConfig = {
      maxAttempts: 3,
      baseDelay: 500, // Start with 500ms for cache operations
      maxDelay: 5000, // Max 5 seconds for cache operations
      exponentialBase: 2,
      jitterPercent: 15,
      abortSignal: abortSignal,
      circuitBreakerThreshold: 5,
      circuitBreakerWindow: 60000, // 1 minute
      shouldRetry: (error, attempt) => {
        // Retry transient failures and memory pressure issues
        return (
          error instanceof TransientFailureError ||
          error.message.includes('memory') ||
          error.message.includes('cache') ||
          attempt < 2
        ); // Always retry at least once
      },
      onRetry: (error, attempt, delay) => {
        logger.debug(
          `Retrying cache operation after ${error.message}, attempt ${attempt}, delay ${delay}ms`
        );
      },
    };

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
    if (!this.tail?.prev || this.tail.prev === this.head) {
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
    return (
      this.currentMemoryUsage + memoryNeeded <= config.memoryLimit &&
      this.cache.size < config.maxCacheSize
    );
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

      logger.debug(`Evicted cache entry: ${evicted.key}`);
    }
  }

  /**
   * Create cache entry for matrix
   */
  private createCacheEntry(
    matrix: Matrix,
    metadata: Record<string, unknown> = {}
  ): MatrixCacheEntry {
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
      metadata,
    };
  }

  /**
   * Get matrix from cache with robust error handling
   */
  get(key: string): Result<Matrix | null, string> {
    const operationType = 'cache-get';

    const performGet = async (): Promise<Matrix | null> => {
      logger.debug(`Cache get: ${key}`);

      // Check for abort signal
      if (this.retryConfig.abortSignal?.aborted) {
        throw new Error('Cache get operation aborted');
      }

      try {
        const node = this.cache.get(key);

        if (!node) {
          this.cacheMisses++;
          logger.debug(`Cache miss: ${key}`);
          return null;
        }

        // Check TTL
        const now = Date.now();
        const age = now - node.entry.timestamp;

        if (age > MATRIX_CONFIG.cache.cacheTTL) {
          logger.debug(`Cache entry expired: ${key}`);
          const deleteResult = this.deleteSync(key);
          if (!deleteResult.success) {
            // TTL cleanup failed, treat as transient issue
            throw new TransientFailureError(
              `Cache TTL cleanup failed: ${deleteResult.error}`,
              'get',
              [0, 0],
              { key, age },
              1000
            );
          }
          this.cacheMisses++;
          return null;
        }

        // Simulate potential memory pressure detection
        if (this.currentMemoryUsage > MATRIX_CONFIG.cache.memoryLimit * 0.95) {
          logger.warn(`Cache memory pressure detected during get: ${key}`);
          // Don't fail the operation, but log the warning
        }

        // Update access information
        try {
          node.entry = {
            ...node.entry,
            accessCount: node.entry.accessCount + 1,
            lastAccessed: now,
          };

          // Move to head (mark as recently used)
          this.moveToHead(node);
          this.cacheHits++;

          logger.debug(`Cache hit: ${key}`);

          // Clone the matrix - this could potentially fail with large matrices
          const clonedMatrix = node.entry.matrix.clone();
          return clonedMatrix;
        } catch (cloneError) {
          // Matrix cloning failed - this could be due to memory pressure
          throw new TransientFailureError(
            `Matrix clone failed during cache get: ${cloneError instanceof Error ? cloneError.message : String(cloneError)}`,
            'get',
            node.entry.matrix ? [node.entry.matrix.rows, node.entry.matrix.columns] : [0, 0],
            { key, memoryUsage: this.currentMemoryUsage },
            2000
          );
        }
      } catch (err) {
        if (err instanceof TransientFailureError) {
          throw err;
        }

        // Convert unexpected errors to TransientFailureError for retry logic
        throw new TransientFailureError(
          `Unexpected cache get error: ${err instanceof Error ? err.message : String(err)}`,
          'get',
          [0, 0],
          { key },
          1500
        );
      }
    };

    // Use synchronous execution but with error monitoring
    try {
      const result = this.cache.get(key);

      if (!result) {
        this.cacheMisses++;
        this.errorMonitor.recordOperation(operationType, true);
        logger.debug(`Cache miss: ${key}`);
        return success(null);
      }

      // Check TTL
      const now = Date.now();
      const age = now - result.entry.timestamp;

      if (age > MATRIX_CONFIG.cache.cacheTTL) {
        logger.debug(`Cache entry expired: ${key}`);
        const deleteResult = this.deleteSync(key);
        if (!deleteResult.success) {
          this.errorMonitor.recordOperation(
            operationType,
            false,
            new TransientFailureError('TTL cleanup failed')
          );
          // Check if this should be treated as warning
          if (
            this.errorMonitor.shouldTreatAsWarning(
              operationType,
              new TransientFailureError('TTL cleanup failed')
            )
          ) {
            logger.warn(`Cache TTL cleanup failed for ${key}, but error rate is acceptable`);
            return success(null); // Graceful degradation
          }
          return error(`Cache TTL cleanup failed: ${deleteResult.error}`);
        }
        this.cacheMisses++;
        this.errorMonitor.recordOperation(operationType, true);
        return success(null);
      }

      // Update access information
      try {
        result.entry = {
          ...result.entry,
          accessCount: result.entry.accessCount + 1,
          lastAccessed: now,
        };

        this.moveToHead(result);
        this.cacheHits++;

        const clonedMatrix = result.entry.matrix.clone();
        this.errorMonitor.recordOperation(operationType, true);
        logger.debug(`Cache hit: ${key}`);
        return success(clonedMatrix);
      } catch (err) {
        const transientError = new TransientFailureError(
          `Matrix clone failed: ${err instanceof Error ? err.message : String(err)}`,
          'get',
          [0, 0],
          { key }
        );

        this.errorMonitor.recordOperation(operationType, false, transientError);

        // Check if this should be treated as warning based on error rate
        if (this.errorMonitor.shouldTreatAsWarning(operationType, transientError)) {
          logger.warn(`Cache get clone failed for ${key}, but error rate is below threshold`);
          return success(null); // Graceful degradation - return cache miss instead of error
        }

        return error(`Cache get failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    } catch (err) {
      const cacheError = err instanceof Error ? err : new Error(String(err));
      this.errorMonitor.recordOperation(operationType, false, cacheError);

      // Check if this should be treated as warning
      if (this.errorMonitor.shouldTreatAsWarning(operationType, cacheError)) {
        logger.warn(
          `Cache get failed for ${key}, but error rate is acceptable: ${cacheError.message}`
        );
        return success(null); // Graceful degradation
      }

      const errorMessage = `Cache get failed: ${cacheError.message}`;
      logger.error(errorMessage);
      return error(errorMessage);
    }
  }

  /**
   * Synchronous delete helper for internal use
   */
  private deleteSync(key: string): Result<boolean, string> {
    try {
      const node = this.cache.get(key);

      if (!node) {
        return success(false);
      }

      this.removeNode(node);
      this.cache.delete(key);
      this.currentMemoryUsage -= node.entry.size;

      logger.debug(`Deleted cache entry: ${key}`);
      return success(true);
    } catch (err) {
      const errorMessage = `Cache delete failed: ${err instanceof Error ? err.message : String(err)}`;
      return error(errorMessage);
    }
  }

  /**
   * Set matrix in cache with robust error handling
   */
  set(key: string, matrix: Matrix, metadata: Record<string, unknown> = {}): Result<void, string> {
    const operationType = 'cache-set';
    logger.debug(`Cache set: ${key}`);

    try {
      // Check for abort signal
      if (this.retryConfig.abortSignal?.aborted) {
        const abortError = new Error('Cache set operation aborted');
        this.errorMonitor.recordOperation(operationType, false, abortError);
        return error('Cache set operation aborted');
      }

      const memoryNeeded = this.calculateMemoryUsage(matrix);

      // Check for potential memory issues early
      if (memoryNeeded > MATRIX_CONFIG.cache.memoryLimit) {
        const memoryError = new TransientFailureError(
          `Matrix too large for cache: ${memoryNeeded} bytes exceeds limit ${MATRIX_CONFIG.cache.memoryLimit}`,
          'multiply',
          [matrix.rows, matrix.columns],
          { key, memoryNeeded },
          2000
        );
        this.errorMonitor.recordOperation(operationType, false, memoryError);

        // Check if this should be treated as warning
        if (this.errorMonitor.shouldTreatAsWarning(operationType, memoryError)) {
          logger.warn(`Matrix too large for cache: ${key}, but error rate is acceptable`);
          return success(undefined); // Graceful degradation - don't cache but don't fail
        }

        return error(`Matrix too large for cache: ${memoryNeeded} bytes exceeds limit`);
      }

      // Check if matrix is cacheable
      if (!MATRIX_CONFIG.cache.enableLRU && this.cache.size >= MATRIX_CONFIG.cache.maxCacheSize) {
        const capacityError = new TransientFailureError(
          'Cache is full and LRU is disabled',
          'multiply',
          [matrix.rows, matrix.columns],
          { key, cacheSize: this.cache.size, maxSize: MATRIX_CONFIG.cache.maxCacheSize },
          1000
        );
        this.errorMonitor.recordOperation(operationType, false, capacityError);

        if (this.errorMonitor.shouldTreatAsWarning(operationType, capacityError)) {
          logger.warn(`Cache full for ${key}, but error rate is acceptable`);
          return success(undefined); // Graceful degradation
        }

        return error('Cache is full and LRU is disabled');
      }

      // Try to evict if necessary
      if (!this.hasSpaceForEntry(memoryNeeded)) {
        try {
          this.evictToMakeSpace(memoryNeeded);
        } catch (evictError) {
          const transientError = new TransientFailureError(
            `Cache eviction failed: ${evictError instanceof Error ? evictError.message : String(evictError)}`,
            'multiply',
            [matrix.rows, matrix.columns],
            { key, memoryNeeded, currentUsage: this.currentMemoryUsage },
            3000
          );
          this.errorMonitor.recordOperation(operationType, false, transientError);

          if (this.errorMonitor.shouldTreatAsWarning(operationType, transientError)) {
            logger.warn(`Cache eviction failed for ${key}, but error rate is acceptable`);
            return success(undefined); // Graceful degradation
          }

          return error(
            `Cache eviction failed: ${evictError instanceof Error ? evictError.message : String(evictError)}`
          );
        }
      }

      // Remove existing entry if present
      if (this.cache.has(key)) {
        const deleteResult = this.deleteSync(key);
        if (!deleteResult.success) {
          const deleteError = new TransientFailureError(
            `Failed to remove existing cache entry: ${deleteResult.error}`,
            'multiply',
            [matrix.rows, matrix.columns],
            { key },
            1500
          );
          this.errorMonitor.recordOperation(operationType, false, deleteError);

          if (this.errorMonitor.shouldTreatAsWarning(operationType, deleteError)) {
            logger.warn(
              `Failed to remove existing cache entry for ${key}, but error rate is acceptable`
            );
            // Continue with operation despite delete failure
          } else {
            return error(`Failed to remove existing cache entry: ${deleteResult.error}`);
          }
        }
      }

      // Create new entry with error handling
      let entry: MatrixCacheEntry;
      try {
        entry = this.createCacheEntry(matrix, metadata);
      } catch (createError) {
        const transientError = new TransientFailureError(
          `Failed to create cache entry: ${createError instanceof Error ? createError.message : String(createError)}`,
          'multiply',
          [matrix.rows, matrix.columns],
          { key },
          2000
        );
        this.errorMonitor.recordOperation(operationType, false, transientError);

        if (this.errorMonitor.shouldTreatAsWarning(operationType, transientError)) {
          logger.warn(`Failed to create cache entry for ${key}, but error rate is acceptable`);
          return success(undefined); // Graceful degradation
        }

        return error(
          `Failed to create cache entry: ${createError instanceof Error ? createError.message : String(createError)}`
        );
      }

      // Add to cache with error handling
      try {
        const node = new CacheNode(key, entry);

        // Add to cache and linked list
        this.cache.set(key, node);
        this.addToHead(node);
        this.currentMemoryUsage += entry.size;

        this.errorMonitor.recordOperation(operationType, true);
        logger.debug(`Cached matrix: ${key} (${entry.size} bytes)`);
        return success(undefined);
      } catch (addError) {
        // If adding failed, clean up any partial state
        try {
          this.cache.delete(key);
        } catch {
          // Ignore cleanup errors
        }

        const transientError = new TransientFailureError(
          `Failed to add to cache: ${addError instanceof Error ? addError.message : String(addError)}`,
          'multiply',
          [matrix.rows, matrix.columns],
          { key },
          2500
        );
        this.errorMonitor.recordOperation(operationType, false, transientError);

        if (this.errorMonitor.shouldTreatAsWarning(operationType, transientError)) {
          logger.warn(`Failed to add to cache for ${key}, but error rate is acceptable`);
          return success(undefined); // Graceful degradation
        }

        return error(
          `Failed to add to cache: ${addError instanceof Error ? addError.message : String(addError)}`
        );
      }
    } catch (err) {
      const cacheError = err instanceof Error ? err : new Error(String(err));
      this.errorMonitor.recordOperation(operationType, false, cacheError);

      // Check if this should be treated as warning
      if (this.errorMonitor.shouldTreatAsWarning(operationType, cacheError)) {
        logger.warn(
          `Cache set failed for ${key}, but error rate is acceptable: ${cacheError.message}`
        );
        return success(undefined); // Graceful degradation
      }

      const errorMessage = `Cache set failed: ${cacheError.message}`;
      logger.error(errorMessage);
      return error(errorMessage);
    }
  }

  /**
   * Delete matrix from cache
   */
  delete(key: string): Result<boolean, string> {
    logger.debug(`Cache delete: ${key}`);

    try {
      const node = this.cache.get(key);

      if (!node) {
        return success(false);
      }

      this.removeNode(node);
      this.cache.delete(key);
      this.currentMemoryUsage -= node.entry.size;

      logger.debug(`Deleted cache entry: ${key}`);
      return success(true);
    } catch (err) {
      const errorMessage = `Cache delete failed: ${err instanceof Error ? err.message : String(err)}`;
      logger.error(errorMessage);
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
    logger.debug('Clearing cache');

    try {
      this.cache.clear();
      this.currentMemoryUsage = 0;
      this.initializeCache();

      logger.debug('Cache cleared');
      return success(undefined);
    } catch (err) {
      const errorMessage = `Cache clear failed: ${err instanceof Error ? err.message : String(err)}`;
      logger.error(errorMessage);
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
      memoryUsage: this.currentMemoryUsage,
    };
  }

  /**
   * Update performance metrics
   */
  updateMetrics(operationResult: MatrixOperationResult): void {
    const newOperationCount = this.performanceMetrics.operationCount + 1;
    const newTotalExecutionTime =
      this.performanceMetrics.totalExecutionTime + operationResult.performance.executionTime;

    const [rows, cols] = operationResult.performance.matrixSize;
    const size = rows * cols;
    const isLargeMatrix = size >= MATRIX_CONFIG.performance.largeMatrixThreshold;

    this.performanceMetrics = {
      ...this.performanceMetrics,
      operationCount: newOperationCount,
      totalExecutionTime: newTotalExecutionTime,
      averageExecutionTime: newTotalExecutionTime / newOperationCount,
      largeMatrixOperations: isLargeMatrix
        ? this.performanceMetrics.largeMatrixOperations + 1
        : this.performanceMetrics.largeMatrixOperations,
    };
  }

  /**
   * Record failed operation
   */
  recordFailure(): void {
    this.performanceMetrics = {
      ...this.performanceMetrics,
      failedOperations: this.performanceMetrics.failedOperations + 1,
    };
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
      utilizationPercent,
    };
  }

  /**
   * Get error monitoring statistics
   */
  getErrorStats(): {
    errorRates: Record<string, any>;
    healthStatus: any;
    recentErrors: any[];
  } {
    return {
      errorRates: this.errorMonitor.getErrorTrends(),
      healthStatus: this.errorMonitor.getHealthStatus(),
      recentErrors: this.errorMonitor.getRecentErrors(),
    };
  }

  /**
   * Reset error monitoring for cache operations
   */
  resetErrorMonitoring(): void {
    this.errorMonitor.resetAllStats();
    logger.info('Cache error monitoring statistics reset');
  }

  /**
   * Check if cache service is healthy based on error rates
   */
  isHealthy(): boolean {
    const healthStatus = this.errorMonitor.getHealthStatus();
    return healthStatus.overall === 'healthy' || healthStatus.overall === 'degraded';
  }

  /**
   * Shutdown the cache service and cleanup resources
   */
  async shutdown(abortSignal?: AbortSignal): Promise<void> {
    logger.info('Shutting down matrix cache service...');

    try {
      // Set abort signal to cancel any ongoing operations
      if (this.abortController) {
        this.abortController.abort();
      }

      // Clear cache with timeout
      const clearResult = this.clear();
      if (!clearResult.success) {
        logger.warn(`Cache clear failed during shutdown: ${clearResult.error}`);
      }

      // Reset error monitoring
      this.errorMonitor.resetAllStats();

      logger.info('Matrix cache service shutdown completed');
    } catch (err) {
      logger.error(
        `Error during cache service shutdown: ${err instanceof Error ? err.message : String(err)}`
      );
      throw err;
    }
  }

  /**
   * Cleanup expired entries
   */
  cleanup(): Result<number, string> {
    logger.debug('Running cache cleanup');

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

      logger.debug(`Cleaned ${cleanedCount} expired entries`);
      return success(cleanedCount);
    } catch (err) {
      const errorMessage = `Cache cleanup failed: ${err instanceof Error ? err.message : String(err)}`;
      logger.error(errorMessage);
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
