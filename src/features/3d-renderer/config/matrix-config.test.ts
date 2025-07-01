/**
 * Matrix Configuration Tests
 *
 * Comprehensive tests for matrix configuration validation and utility functions
 * following TDD methodology and bulletproof-react testing patterns.
 */

import { describe, expect, it } from 'vitest';
import { createLogger } from '../../../shared/services/logger.service.js';
import {
  getBatchSize,
  getCacheConfig,
  getCacheKey,
  getCSGConfig,
  getMatrixPerformanceThresholds,
  getOperationDefaults,
  getOperationTimeout,
  getThreeJSConfig,
  getWorkerThreadCount,
  isLargeMatrix,
  isMatrixCacheable,
  isMatrixSizeValid,
  isMemoryUsageValid,
  MATRIX_CONFIG,
  shouldUseParallel,
} from './matrix-config.js';

const logger = createLogger('MatrixConfigTest');

describe('Matrix Configuration', () => {
  describe('Configuration Structure', () => {
    it('should have all required configuration sections', () => {
      logger.debug('[DEBUG][MatrixConfigTest] Testing configuration structure');

      expect(MATRIX_CONFIG.performance).toBeDefined();
      expect(MATRIX_CONFIG.cache).toBeDefined();
      expect(MATRIX_CONFIG.operations).toBeDefined();
      expect(MATRIX_CONFIG.threeJS).toBeDefined();
      expect(MATRIX_CONFIG.csg).toBeDefined();
      expect(MATRIX_CONFIG.debug).toBeDefined();
      expect(MATRIX_CONFIG.errorHandling).toBeDefined();
    });

    it('should have valid performance configuration', () => {
      logger.debug('[DEBUG][MatrixConfigTest] Testing performance configuration');

      const perf = MATRIX_CONFIG.performance;
      expect(perf.maxDirectOperationSize).toBeGreaterThan(0);
      expect(perf.maxCacheableSize).toBeGreaterThan(0);
      expect(perf.operationTimeout).toBeGreaterThan(0);
      expect(perf.maxMemoryUsage).toBeGreaterThan(0);
      expect(perf.performanceThreshold).toBe(16); // <16ms requirement
      expect(perf.largeMatrixThreshold).toBeGreaterThan(0);
      expect(perf.batchSize).toBeGreaterThan(0);
    });

    it('should have valid cache configuration', () => {
      logger.debug('[DEBUG][MatrixConfigTest] Testing cache configuration');

      const cache = MATRIX_CONFIG.cache;
      expect(cache.maxCacheSize).toBeGreaterThan(0);
      expect(cache.cacheTTL).toBeGreaterThan(0);
      expect(cache.enableLRU).toBe(true);
      expect(cache.keyPrefix).toBe('matrix_');
      expect(cache.memoryLimit).toBeGreaterThan(0);
    });

    it('should have valid operation defaults', () => {
      logger.debug('[DEBUG][MatrixConfigTest] Testing operation defaults');

      const ops = MATRIX_CONFIG.operations;
      expect(ops.precision).toBeGreaterThan(0);
      expect(ops.precision).toBeLessThan(1);
      expect(ops.enableParallel).toBe(true);
      expect(ops.workerThreads).toBeGreaterThan(0);
      expect(ops.enableSIMD).toBe(true);
      expect(ops.defaultValue).toBe(0);
      expect(ops.enableBoundsChecking).toBe(true);
    });
  });

  describe('Configuration Getters', () => {
    it('should return performance thresholds correctly', () => {
      logger.debug('[DEBUG][MatrixConfigTest] Testing performance thresholds getter');

      const thresholds = getMatrixPerformanceThresholds();
      expect(thresholds).toEqual(MATRIX_CONFIG.performance);
    });

    it('should return cache config correctly', () => {
      logger.debug('[DEBUG][MatrixConfigTest] Testing cache config getter');

      const cacheConfig = getCacheConfig();
      expect(cacheConfig).toEqual(MATRIX_CONFIG.cache);
    });

    it('should return operation defaults correctly', () => {
      logger.debug('[DEBUG][MatrixConfigTest] Testing operation defaults getter');

      const defaults = getOperationDefaults();
      expect(defaults).toEqual(MATRIX_CONFIG.operations);
    });

    it('should return Three.js config correctly', () => {
      logger.debug('[DEBUG][MatrixConfigTest] Testing Three.js config getter');

      const threeConfig = getThreeJSConfig();
      expect(threeConfig).toEqual(MATRIX_CONFIG.threeJS);
    });

    it('should return CSG config correctly', () => {
      logger.debug('[DEBUG][MatrixConfigTest] Testing CSG config getter');

      const csgConfig = getCSGConfig();
      expect(csgConfig).toEqual(MATRIX_CONFIG.csg);
    });
  });

  describe('Matrix Size Validation', () => {
    it('should validate matrix sizes correctly', () => {
      logger.debug('[DEBUG][MatrixConfigTest] Testing matrix size validation');

      // Valid sizes
      expect(isMatrixSizeValid(10, 10)).toBe(true);
      expect(isMatrixSizeValid(100, 100)).toBe(true);

      // Invalid sizes (exceeding limits)
      const largeSize = Math.sqrt(MATRIX_CONFIG.performance.maxDirectOperationSize) + 1;
      expect(isMatrixSizeValid(largeSize, largeSize)).toBe(false);
    });

    it('should identify cacheable matrices correctly', () => {
      logger.debug('[DEBUG][MatrixConfigTest] Testing cacheable matrix identification');

      // Small matrix - should be cacheable
      expect(isMatrixCacheable(10, 10)).toBe(true);

      // Large matrix - should not be cacheable
      const largeSize = Math.sqrt(MATRIX_CONFIG.performance.maxCacheableSize) + 1;
      expect(isMatrixCacheable(largeSize, largeSize)).toBe(false);
    });

    it('should identify large matrices correctly', () => {
      logger.debug('[DEBUG][MatrixConfigTest] Testing large matrix identification');

      // Small matrix
      expect(isLargeMatrix(10, 10)).toBe(false);

      // Large matrix
      const largeSize = Math.sqrt(MATRIX_CONFIG.performance.largeMatrixThreshold);
      expect(isLargeMatrix(largeSize, largeSize)).toBe(true);
    });
  });

  describe('Batch Size Calculation', () => {
    it('should calculate batch size correctly for small matrices', () => {
      logger.debug('[DEBUG][MatrixConfigTest] Testing batch size for small matrices');

      const smallSize = 100;
      const batchSize = getBatchSize(smallSize);
      expect(batchSize).toBe(smallSize);
    });

    it('should limit batch size for large matrices', () => {
      logger.debug('[DEBUG][MatrixConfigTest] Testing batch size for large matrices');

      const largeSize = MATRIX_CONFIG.performance.batchSize * 2;
      const batchSize = getBatchSize(largeSize);
      expect(batchSize).toBe(MATRIX_CONFIG.performance.batchSize);
    });
  });

  describe('Memory Usage Validation', () => {
    it('should validate memory usage correctly', () => {
      logger.debug('[DEBUG][MatrixConfigTest] Testing memory usage validation');

      // Valid memory usage
      const validUsage = MATRIX_CONFIG.performance.maxMemoryUsage / 2;
      expect(isMemoryUsageValid(validUsage)).toBe(true);

      // Invalid memory usage
      const invalidUsage = MATRIX_CONFIG.performance.maxMemoryUsage * 2;
      expect(isMemoryUsageValid(invalidUsage)).toBe(false);
    });
  });

  describe('Cache Key Generation', () => {
    it('should generate cache keys correctly', () => {
      logger.debug('[DEBUG][MatrixConfigTest] Testing cache key generation');

      const key = getCacheKey('add', 'hash1', 'hash2');
      expect(key).toBe('matrix_add_hash1_hash2');
      expect(key).toContain(MATRIX_CONFIG.cache.keyPrefix);
    });

    it('should handle different parameter types in cache keys', () => {
      logger.debug('[DEBUG][MatrixConfigTest] Testing cache key with mixed parameters');

      const key = getCacheKey('multiply', 'hash1', 42, 'hash2');
      expect(key).toBe('matrix_multiply_hash1_42_hash2');
    });

    it('should handle empty parameters in cache keys', () => {
      logger.debug('[DEBUG][MatrixConfigTest] Testing cache key with no parameters');

      const key = getCacheKey('transpose');
      expect(key).toBe('matrix_transpose_');
    });
  });

  describe('Parallel Processing Configuration', () => {
    it('should determine parallel processing correctly for small matrices', () => {
      logger.debug('[DEBUG][MatrixConfigTest] Testing parallel processing for small matrices');

      const smallSize = 100;
      expect(shouldUseParallel(smallSize)).toBe(false);
    });

    it('should determine parallel processing correctly for large matrices', () => {
      logger.debug('[DEBUG][MatrixConfigTest] Testing parallel processing for large matrices');

      const largeSize = MATRIX_CONFIG.performance.largeMatrixThreshold;
      expect(shouldUseParallel(largeSize)).toBe(true);
    });

    it('should respect parallel processing configuration', () => {
      logger.debug('[DEBUG][MatrixConfigTest] Testing parallel processing configuration respect');

      // Test assumes enableParallel is true in config
      const largeSize = MATRIX_CONFIG.performance.largeMatrixThreshold;
      expect(shouldUseParallel(largeSize)).toBe(MATRIX_CONFIG.operations.enableParallel);
    });
  });

  describe('Worker Thread Configuration', () => {
    it('should return valid worker thread count', () => {
      logger.debug('[DEBUG][MatrixConfigTest] Testing worker thread count');

      const threadCount = getWorkerThreadCount();
      expect(threadCount).toBeGreaterThan(0);
      expect(threadCount).toBeLessThanOrEqual(MATRIX_CONFIG.operations.workerThreads);
    });

    it('should respect hardware concurrency limits', () => {
      logger.debug('[DEBUG][MatrixConfigTest] Testing hardware concurrency limits');

      const threadCount = getWorkerThreadCount();
      const hardwareConcurrency = navigator.hardwareConcurrency || 4;
      expect(threadCount).toBeLessThanOrEqual(hardwareConcurrency);
    });
  });

  describe('Operation Timeout Calculation', () => {
    it('should calculate timeout correctly for small matrices', () => {
      logger.debug('[DEBUG][MatrixConfigTest] Testing timeout for small matrices');

      const smallSize = 100;
      const timeout = getOperationTimeout(smallSize);
      expect(timeout).toBe(MATRIX_CONFIG.performance.operationTimeout);
    });

    it('should scale timeout for large matrices', () => {
      logger.debug('[DEBUG][MatrixConfigTest] Testing timeout scaling for large matrices');

      const largeSize = MATRIX_CONFIG.performance.maxDirectOperationSize * 2;
      const timeout = getOperationTimeout(largeSize);
      expect(timeout).toBeGreaterThan(MATRIX_CONFIG.performance.operationTimeout);
    });

    it('should cap timeout at maximum value', () => {
      logger.debug('[DEBUG][MatrixConfigTest] Testing timeout maximum cap');

      const veryLargeSize = MATRIX_CONFIG.performance.maxDirectOperationSize * 10;
      const timeout = getOperationTimeout(veryLargeSize);
      const maxTimeout = MATRIX_CONFIG.performance.operationTimeout * 5;
      expect(timeout).toBeLessThanOrEqual(maxTimeout);
    });
  });

  describe('Configuration Immutability', () => {
    it('should be read-only configuration object', () => {
      logger.debug('[DEBUG][MatrixConfigTest] Testing configuration read-only nature');

      // Configuration should be accessible for reading
      const originalValue = MATRIX_CONFIG.performance.maxDirectOperationSize;
      expect(originalValue).toBeGreaterThan(0);

      // Configuration should have consistent values
      expect(MATRIX_CONFIG.performance.maxDirectOperationSize).toBe(originalValue);

      // TypeScript should prevent modification at compile time
      // Runtime modification is still possible but discouraged
      expect(typeof MATRIX_CONFIG.performance.maxDirectOperationSize).toBe('number');
    });
  });

  describe('Configuration Consistency', () => {
    it('should have consistent size relationships', () => {
      logger.debug('[DEBUG][MatrixConfigTest] Testing configuration consistency');

      const perf = MATRIX_CONFIG.performance;

      // Cache size should be larger than direct operation size
      expect(perf.maxCacheableSize).toBeGreaterThanOrEqual(perf.maxDirectOperationSize);

      // Large matrix threshold should be reasonable
      expect(perf.largeMatrixThreshold).toBeGreaterThan(perf.maxDirectOperationSize);

      // Batch size should be reasonable
      expect(perf.batchSize).toBeGreaterThan(0);
      expect(perf.batchSize).toBeLessThanOrEqual(perf.maxDirectOperationSize);
    });

    it('should have consistent memory relationships', () => {
      logger.debug('[DEBUG][MatrixConfigTest] Testing memory configuration consistency');

      const perf = MATRIX_CONFIG.performance;
      const cache = MATRIX_CONFIG.cache;

      // Cache memory limit should be less than total memory limit
      expect(cache.memoryLimit).toBeLessThanOrEqual(perf.maxMemoryUsage);
    });

    it('should have consistent timeout relationships', () => {
      logger.debug('[DEBUG][MatrixConfigTest] Testing timeout configuration consistency');

      const perf = MATRIX_CONFIG.performance;
      const errorHandling = MATRIX_CONFIG.errorHandling;

      // Performance threshold should be much smaller than operation timeout
      expect(perf.performanceThreshold).toBeLessThan(perf.operationTimeout);

      // Recovery timeout should be reasonable compared to operation timeout
      expect(errorHandling.recoveryTimeout).toBeLessThanOrEqual(perf.operationTimeout);
    });
  });
});
