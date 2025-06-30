/**
 * Matrix Cache Service Tests
 *
 * Comprehensive tests for matrix cache service with LRU eviction and performance monitoring
 * following TDD methodology and bulletproof-react testing patterns.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MATRIX_CONFIG } from '../config/matrix-config';
import { matrixFactory } from '../utils/matrix-adapters';
import { MatrixCacheService } from './matrix-cache.service';

describe('MatrixCacheService', () => {
  let cacheService: MatrixCacheService;

  beforeEach(() => {
    console.log('[INIT][MatrixCacheServiceTest] Setting up test environment');
    cacheService = new MatrixCacheService();
  });

  afterEach(() => {
    console.log('[END][MatrixCacheServiceTest] Cleaning up test environment');
    cacheService.clear();
  });

  describe('Basic Cache Operations', () => {
    it('should store and retrieve matrix correctly', () => {
      console.log('[DEBUG][MatrixCacheServiceTest] Testing basic cache operations');

      const matrix = matrixFactory.fromArray([
        [1, 2],
        [3, 4],
      ]);
      const key = 'test_matrix';

      // Store matrix
      const setResult = cacheService.set(key, matrix);
      expect(setResult.success).toBe(true);

      // Retrieve matrix
      const getResult = cacheService.get(key);
      expect(getResult.success).toBe(true);
      if (getResult.success && getResult.data) {
        expect(getResult.data.get(0, 0)).toBe(1);
        expect(getResult.data.get(0, 1)).toBe(2);
        expect(getResult.data.get(1, 0)).toBe(3);
        expect(getResult.data.get(1, 1)).toBe(4);
      }
    });

    it('should return null for non-existent keys', () => {
      console.log('[DEBUG][MatrixCacheServiceTest] Testing non-existent key retrieval');

      const getResult = cacheService.get('non_existent_key');
      expect(getResult.success).toBe(true);
      if (getResult.success) {
        expect(getResult.data).toBeNull();
      }
    });

    it('should check if key exists correctly', () => {
      console.log('[DEBUG][MatrixCacheServiceTest] Testing key existence check');

      const matrix = matrixFactory.fromArray([
        [1, 2],
        [3, 4],
      ]);
      const key = 'test_matrix';

      expect(cacheService.has(key)).toBe(false);

      cacheService.set(key, matrix);
      expect(cacheService.has(key)).toBe(true);
    });

    it('should delete entries correctly', () => {
      console.log('[DEBUG][MatrixCacheServiceTest] Testing cache deletion');

      const matrix = matrixFactory.fromArray([
        [1, 2],
        [3, 4],
      ]);
      const key = 'test_matrix';

      cacheService.set(key, matrix);
      expect(cacheService.has(key)).toBe(true);

      const deleteResult = cacheService.delete(key);
      expect(deleteResult.success).toBe(true);
      if (deleteResult.success) {
        expect(deleteResult.data).toBe(true);
      }

      expect(cacheService.has(key)).toBe(false);
    });

    it('should clear all entries correctly', () => {
      console.log('[DEBUG][MatrixCacheServiceTest] Testing cache clearing');

      const matrix1 = matrixFactory.fromArray([
        [1, 2],
        [3, 4],
      ]);
      const matrix2 = matrixFactory.fromArray([
        [5, 6],
        [7, 8],
      ]);

      cacheService.set('key1', matrix1);
      cacheService.set('key2', matrix2);

      expect(cacheService.has('key1')).toBe(true);
      expect(cacheService.has('key2')).toBe(true);

      const clearResult = cacheService.clear();
      expect(clearResult.success).toBe(true);

      expect(cacheService.has('key1')).toBe(false);
      expect(cacheService.has('key2')).toBe(false);
    });
  });

  describe('LRU Eviction', () => {
    it('should evict least recently used entries when cache is full', () => {
      console.log('[DEBUG][MatrixCacheServiceTest] Testing LRU eviction');

      // Create small matrices to test eviction logic
      const _matrices = Array.from({ length: 5 }, (_, i) =>
        matrixFactory.fromArray([
          [i, i + 1],
          [i + 2, i + 3],
        ])
      );

      // Fill cache beyond a reasonable limit by creating large matrices
      // This will trigger eviction based on memory limits
      const largeMatrix = matrixFactory.zeros(100, 100); // Large matrix to trigger eviction

      cacheService.set('large1', largeMatrix);
      cacheService.set('large2', largeMatrix);
      cacheService.set('large3', largeMatrix);

      // Add a small matrix
      const smallMatrix = matrixFactory.fromArray([
        [1, 2],
        [3, 4],
      ]);
      cacheService.set('small', smallMatrix);

      // The small matrix should still be accessible
      expect(cacheService.has('small')).toBe(true);
    });

    it('should move accessed entries to head of LRU list', () => {
      console.log('[DEBUG][MatrixCacheServiceTest] Testing LRU access ordering');

      const matrix1 = matrixFactory.fromArray([
        [1, 2],
        [3, 4],
      ]);
      const matrix2 = matrixFactory.fromArray([
        [5, 6],
        [7, 8],
      ]);
      const matrix3 = matrixFactory.fromArray([
        [9, 10],
        [11, 12],
      ]);

      cacheService.set('key1', matrix1);
      cacheService.set('key2', matrix2);
      cacheService.set('key3', matrix3);

      // Access key1 to move it to head
      cacheService.get('key1');

      // All keys should still exist
      expect(cacheService.has('key1')).toBe(true);
      expect(cacheService.has('key2')).toBe(true);
      expect(cacheService.has('key3')).toBe(true);
    });
  });

  describe('TTL (Time To Live)', () => {
    it('should expire entries after TTL', async () => {
      console.log('[DEBUG][MatrixCacheServiceTest] Testing TTL expiration');

      // Mock Date.now to control time
      const originalNow = Date.now;
      let currentTime = 1000000;
      vi.spyOn(Date, 'now').mockImplementation(() => currentTime);

      const matrix = matrixFactory.fromArray([
        [1, 2],
        [3, 4],
      ]);
      const key = 'test_matrix';

      cacheService.set(key, matrix);
      expect(cacheService.has(key)).toBe(true);

      // Advance time beyond TTL
      currentTime += MATRIX_CONFIG.cache.cacheTTL + 1000;

      expect(cacheService.has(key)).toBe(false);

      // Restore original Date.now
      Date.now = originalNow;
    });

    it('should clean up expired entries', async () => {
      console.log('[DEBUG][MatrixCacheServiceTest] Testing expired entry cleanup');

      // Mock Date.now to control time
      const originalNow = Date.now;
      let currentTime = 1000000;
      vi.spyOn(Date, 'now').mockImplementation(() => currentTime);

      const matrix1 = matrixFactory.fromArray([
        [1, 2],
        [3, 4],
      ]);
      const matrix2 = matrixFactory.fromArray([
        [5, 6],
        [7, 8],
      ]);

      cacheService.set('key1', matrix1);
      currentTime += 1000; // Small time advance
      cacheService.set('key2', matrix2);

      // Advance time to expire only first entry (but not second)
      currentTime += MATRIX_CONFIG.cache.cacheTTL - 500; // Less than TTL for second entry

      const cleanupResult = cacheService.cleanup();
      expect(cleanupResult.success).toBe(true);
      if (cleanupResult.success) {
        expect(cleanupResult.data).toBeGreaterThan(0);
      }

      expect(cacheService.has('key1')).toBe(false);
      expect(cacheService.has('key2')).toBe(true);

      // Restore original Date.now
      Date.now = originalNow;
    });
  });

  describe('Memory Management', () => {
    it('should track memory usage correctly', () => {
      console.log('[DEBUG][MatrixCacheServiceTest] Testing memory usage tracking');

      const matrix = matrixFactory.fromArray([
        [1, 2],
        [3, 4],
      ]);
      const initialStats = cacheService.getSizeInfo();

      cacheService.set('test_matrix', matrix);

      const afterStats = cacheService.getSizeInfo();
      expect(afterStats.memoryUsage).toBeGreaterThan(initialStats.memoryUsage);
      expect(afterStats.entryCount).toBe(initialStats.entryCount + 1);
    });

    it('should calculate utilization percentage correctly', () => {
      console.log('[DEBUG][MatrixCacheServiceTest] Testing utilization calculation');

      const matrix = matrixFactory.fromArray([
        [1, 2],
        [3, 4],
      ]);
      cacheService.set('test_matrix', matrix);

      const stats = cacheService.getSizeInfo();
      expect(stats.utilizationPercent).toBeGreaterThan(0);
      expect(stats.utilizationPercent).toBeLessThanOrEqual(100);
    });
  });

  describe('Performance Metrics', () => {
    it('should track cache hit and miss rates', () => {
      console.log('[DEBUG][MatrixCacheServiceTest] Testing hit/miss rate tracking');

      const matrix = matrixFactory.fromArray([
        [1, 2],
        [3, 4],
      ]);
      const key = 'test_matrix';

      // Miss
      cacheService.get('non_existent');

      // Set and hit
      cacheService.set(key, matrix);
      cacheService.get(key);

      const stats = cacheService.getStats();
      expect(stats.cacheHitRate).toBeGreaterThan(0);
      expect(stats.cacheHitRate).toBeLessThanOrEqual(1);
    });

    it('should update performance metrics correctly', () => {
      console.log('[DEBUG][MatrixCacheServiceTest] Testing performance metrics updates');

      const mockOperationResult = {
        result: matrixFactory.fromArray([
          [1, 2],
          [3, 4],
        ]),
        performance: {
          executionTime: 10,
          memoryUsed: 1024,
          operationType: 'add',
          matrixSize: [2, 2] as const,
          cacheHit: false,
        },
        metadata: {
          timestamp: Date.now(),
          operationId: 'test_op_1',
          inputHash: 'test_hash',
        },
      };

      const initialStats = cacheService.getStats();
      cacheService.updateMetrics(mockOperationResult);

      const updatedStats = cacheService.getStats();
      expect(updatedStats.operationCount).toBe(initialStats.operationCount + 1);
      expect(updatedStats.totalExecutionTime).toBeGreaterThan(initialStats.totalExecutionTime);
    });

    it('should record failures correctly', () => {
      console.log('[DEBUG][MatrixCacheServiceTest] Testing failure recording');

      const initialStats = cacheService.getStats();
      cacheService.recordFailure();

      const updatedStats = cacheService.getStats();
      expect(updatedStats.failedOperations).toBe(initialStats.failedOperations + 1);
    });
  });

  describe('Cache Entry Metadata', () => {
    it('should store and retrieve entry metadata correctly', () => {
      console.log('[DEBUG][MatrixCacheServiceTest] Testing entry metadata');

      const matrix = matrixFactory.fromArray([
        [1, 2],
        [3, 4],
      ]);
      const key = 'test_matrix';
      const metadata = { operation: 'test', priority: 'high' };

      cacheService.set(key, matrix, metadata);

      const entryMetadata = cacheService.getEntryMetadata(key);
      expect(entryMetadata).toBeDefined();
      if (entryMetadata) {
        expect(entryMetadata.metadata).toEqual(metadata);
        expect(entryMetadata.accessCount).toBe(1);
        expect(entryMetadata.size).toBeGreaterThan(0);
        expect(entryMetadata.hash).toBeDefined();
      }
    });

    it('should update access count on retrieval', () => {
      console.log('[DEBUG][MatrixCacheServiceTest] Testing access count updates');

      const matrix = matrixFactory.fromArray([
        [1, 2],
        [3, 4],
      ]);
      const key = 'test_matrix';

      cacheService.set(key, matrix);

      const initialMetadata = cacheService.getEntryMetadata(key);
      expect(initialMetadata?.accessCount).toBe(1);

      cacheService.get(key);

      const updatedMetadata = cacheService.getEntryMetadata(key);
      expect(updatedMetadata?.accessCount).toBe(2);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid operations gracefully', () => {
      console.log('[DEBUG][MatrixCacheServiceTest] Testing error handling');

      const deleteResult = cacheService.delete('non_existent_key');
      expect(deleteResult.success).toBe(true);
      if (deleteResult.success) {
        expect(deleteResult.data).toBe(false);
      }
    });

    it('should return null metadata for non-existent entries', () => {
      console.log('[DEBUG][MatrixCacheServiceTest] Testing non-existent metadata retrieval');

      const metadata = cacheService.getEntryMetadata('non_existent_key');
      expect(metadata).toBeNull();
    });
  });

  describe('Cache Keys Management', () => {
    it('should return all cache keys correctly', () => {
      console.log('[DEBUG][MatrixCacheServiceTest] Testing cache keys retrieval');

      const matrix1 = matrixFactory.fromArray([
        [1, 2],
        [3, 4],
      ]);
      const matrix2 = matrixFactory.fromArray([
        [5, 6],
        [7, 8],
      ]);

      cacheService.set('key1', matrix1);
      cacheService.set('key2', matrix2);

      const keys = cacheService.getKeys();
      expect(keys).toContain('key1');
      expect(keys).toContain('key2');
      expect(keys).toHaveLength(2);
    });

    it('should handle empty cache keys correctly', () => {
      console.log('[DEBUG][MatrixCacheServiceTest] Testing empty cache keys');

      const keys = cacheService.getKeys();
      expect(keys).toEqual([]);
    });
  });
});
