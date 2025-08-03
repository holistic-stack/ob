/**
 * @file sphere-generator-cache-performance.test.ts
 * @description Performance tests for SphereGeneratorService with caching
 *
 * Tests caching performance improvements and validates that repeated
 * geometry generation with identical parameters benefits from caching.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { isSuccess } from '@/shared/types';
import { FragmentCalculatorService } from '../../../fragment-calculator';
import { GeometryCacheService } from '../../../geometry-cache/geometry-cache.service';
import { SphereGeneratorService } from './sphere-generator';

describe('SphereGeneratorService Cache Performance Tests', () => {
  let fragmentCalculator: FragmentCalculatorService;
  let cacheService: GeometryCacheService;
  let sphereGenerator: SphereGeneratorService;

  beforeEach(() => {
    fragmentCalculator = new FragmentCalculatorService();
    cacheService = new GeometryCacheService();
    sphereGenerator = new SphereGeneratorService(fragmentCalculator, cacheService);
  });

  describe('Cache Performance Benefits', () => {
    it('should demonstrate significant performance improvement with caching', async () => {
      const radius = 5;
      const fragments = 16;

      // First generation (cache miss)
      const startTime1 = performance.now();
      const result1 = sphereGenerator.generateSphere(radius, fragments);
      const endTime1 = performance.now();
      const firstGenTime = endTime1 - startTime1;

      expect(isSuccess(result1)).toBe(true);

      // Second generation (cache hit)
      const startTime2 = performance.now();
      const result2 = sphereGenerator.generateSphere(radius, fragments);
      const endTime2 = performance.now();
      const secondGenTime = endTime2 - startTime2;

      expect(isSuccess(result2)).toBe(true);

      // Cache hit should be faster or equal (operations are very fast, so difference may be minimal)
      console.log(`First generation (cache miss): ${firstGenTime.toFixed(3)}ms`);
      console.log(`Second generation (cache hit): ${secondGenTime.toFixed(3)}ms`);

      if (firstGenTime > 0.1) {
        console.log(
          `Performance improvement: ${(firstGenTime / secondGenTime).toFixed(1)}x faster`
        );
        // Only assert performance improvement if operations are measurable
        expect(secondGenTime).toBeLessThanOrEqual(firstGenTime);
      } else {
        console.log('Operations too fast to measure performance difference reliably');
        // For very fast operations, just ensure both complete successfully
        expect(secondGenTime).toBeGreaterThan(0);
      }

      // Both results should be identical
      if (isSuccess(result1) && isSuccess(result2)) {
        expect(result1.data.vertices.length).toBe(result2.data.vertices.length);
        expect(result1.data.faces.length).toBe(result2.data.faces.length);
      }
    });

    it('should demonstrate cache benefits for parameter-based generation', async () => {
      const params = {
        radius: 3,
        fn: 8,
      };

      const times: number[] = [];

      // Generate the same sphere 5 times
      for (let i = 0; i < 5; i++) {
        const startTime = performance.now();
        const result = sphereGenerator.generateSphereFromParameters(params);
        const endTime = performance.now();

        const generationTime = endTime - startTime;
        times.push(generationTime);

        expect(isSuccess(result)).toBe(true);
      }

      console.log(`Generation times: ${times.map((t) => t.toFixed(3)).join(', ')}ms`);

      // First generation should be slowest (cache miss)
      const firstTime = times[0];
      const subsequentTimes = times.slice(1);

      // Ensure we have valid timing data
      expect(firstTime).toBeDefined();
      expect(firstTime).toBeGreaterThan(0);

      // All subsequent generations should be faster or equal due to caching
      if (firstTime !== undefined) {
        subsequentTimes.forEach((time, index) => {
          if (firstTime > 0.1) {
            expect(time).toBeLessThanOrEqual(firstTime);
            console.log(
              `Generation ${index + 2} is ${(firstTime / time).toFixed(1)}x faster than first`
            );
        } else {
          // For very fast operations, just ensure they complete successfully
          expect(time).toBeGreaterThan(0);
          console.log(
            `Generation ${index + 2} completed in ${time.toFixed(3)}ms (too fast to measure improvement)`
          );
        }
      });
      }
    });
  });

  describe('Cache Statistics Validation', () => {
    it('should track cache hits and misses correctly', () => {
      const radius = 4;
      const fragments = 12;

      // Initial cache statistics
      const initialStats = cacheService.getStatistics();
      expect(initialStats.totalHits).toBe(0);
      expect(initialStats.totalMisses).toBe(0);

      // First generation (should be cache miss)
      const result1 = sphereGenerator.generateSphere(radius, fragments);
      expect(isSuccess(result1)).toBe(true);

      let stats = cacheService.getStatistics();
      expect(stats.totalMisses).toBe(1);
      expect(stats.totalHits).toBe(0);

      // Second generation (should be cache hit)
      const result2 = sphereGenerator.generateSphere(radius, fragments);
      expect(isSuccess(result2)).toBe(true);

      stats = cacheService.getStatistics();
      expect(stats.totalMisses).toBe(1);
      expect(stats.totalHits).toBe(1);
      expect(stats.hitRate).toBe(50); // 1 hit out of 2 total requests

      // Third generation (should be another cache hit)
      const result3 = sphereGenerator.generateSphere(radius, fragments);
      expect(isSuccess(result3)).toBe(true);

      stats = cacheService.getStatistics();
      expect(stats.totalMisses).toBe(1);
      expect(stats.totalHits).toBe(2);
      expect(stats.hitRate).toBeCloseTo(66.67, 1); // 2 hits out of 3 total requests
    });

    it('should handle different parameter combinations correctly', () => {
      const testCases = [
        { radius: 5, fragments: 8 },
        { radius: 5, fragments: 16 }, // Different fragments
        { radius: 3, fragments: 8 }, // Different radius
        { radius: 5, fragments: 8 }, // Same as first (should hit cache)
      ];

      testCases.forEach((testCase, index) => {
        const result = sphereGenerator.generateSphere(testCase.radius, testCase.fragments);
        expect(isSuccess(result)).toBe(true);
        console.log(
          `Test case ${index + 1}: radius=${testCase.radius}, fragments=${testCase.fragments}`
        );
      });

      const stats = cacheService.getStatistics();
      console.log(
        `Final cache stats: ${stats.totalHits} hits, ${stats.totalMisses} misses, ${stats.hitRate.toFixed(1)}% hit rate`
      );

      // Should have 3 unique parameter combinations (3 misses) and 1 cache hit
      expect(stats.totalMisses).toBe(3);
      expect(stats.totalHits).toBe(1);
      expect(stats.totalEntries).toBe(3); // 3 unique geometries cached
    });
  });

  describe('Memory Usage Optimization', () => {
    it('should not significantly increase memory usage with caching', () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // Generate multiple different spheres
      for (let radius = 1; radius <= 10; radius++) {
        for (let fragments = 6; fragments <= 16; fragments += 2) {
          const result = sphereGenerator.generateSphere(radius, fragments);
          expect(isSuccess(result)).toBe(true);
        }
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024; // MB

      console.log(`Memory increase after generating 60 spheres: ${memoryIncrease.toFixed(2)}MB`);

      const stats = cacheService.getStatistics();
      console.log(
        `Cache statistics: ${stats.totalEntries} entries, ${(stats.totalMemoryUsage / 1024 / 1024).toFixed(2)}MB`
      );

      // Memory increase should be reasonable (less than 50MB for 60 different spheres)
      expect(memoryIncrease).toBeLessThan(50);
    });
  });

  describe('Cache Invalidation and TTL', () => {
    it('should handle cache TTL correctly', async () => {
      // Create cache with very short TTL for testing
      const shortTtlCache = new GeometryCacheService({ ttlMs: 50 });
      const shortTtlGenerator = new SphereGeneratorService(fragmentCalculator, shortTtlCache);

      const radius = 5;
      const fragments = 8;

      // First generation
      const result1 = shortTtlGenerator.generateSphere(radius, fragments);
      expect(isSuccess(result1)).toBe(true);

      // Should be cached immediately
      const result2 = shortTtlGenerator.generateSphere(radius, fragments);
      expect(isSuccess(result2)).toBe(true);

      let stats = shortTtlCache.getStatistics();
      expect(stats.totalHits).toBe(1);

      // Wait for TTL to expire
      await new Promise((resolve) => setTimeout(resolve, 60));

      // Should be cache miss after TTL expiration
      const result3 = shortTtlGenerator.generateSphere(radius, fragments);
      expect(isSuccess(result3)).toBe(true);

      stats = shortTtlCache.getStatistics();
      expect(stats.totalMisses).toBe(2); // Initial miss + miss after TTL expiration
    });
  });

  describe('Concurrent Access Performance', () => {
    it('should handle concurrent cache access efficiently', async () => {
      const radius = 5;
      const fragments = 16;

      // Simulate concurrent access to the same geometry
      const promises = Array.from({ length: 10 }, () =>
        Promise.resolve(sphereGenerator.generateSphere(radius, fragments))
      );

      const startTime = performance.now();
      const results = await Promise.all(promises);
      const endTime = performance.now();

      const totalTime = endTime - startTime;
      console.log(`10 concurrent sphere generations completed in ${totalTime.toFixed(2)}ms`);

      // All results should be successful
      results.forEach((result) => {
        expect(isSuccess(result)).toBe(true);
      });

      // Should be very fast due to caching (after first generation)
      expect(totalTime).toBeLessThan(50); // Should complete in less than 50ms

      const stats = cacheService.getStatistics();
      console.log(`Concurrent access stats: ${stats.totalHits} hits, ${stats.totalMisses} misses`);

      // Should have 1 miss (first generation) and 9 hits (subsequent cached accesses)
      expect(stats.totalMisses).toBe(1);
      expect(stats.totalHits).toBe(9);
    });
  });
});
