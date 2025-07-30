/**
 * @file geometry-cache.service.test.ts
 * @description Tests for GeometryCacheService
 *
 * Tests caching functionality, performance optimization, and memory management
 * for OpenSCAD Geometry Builder caching system.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { isError, isSuccess } from '@/shared/types';
import type {
  Polygon2DGeometryData,
  Polyhedron3DGeometryData,
} from '../primitive-generators/types';
import { GeometryCacheService } from './geometry-cache.service';

describe('GeometryCacheService', () => {
  let cacheService: GeometryCacheService;

  beforeEach(() => {
    cacheService = new GeometryCacheService();
  });

  describe('Cache Key Generation', () => {
    it('should generate consistent cache keys for identical parameters', () => {
      const params1 = { radius: 5, fn: 8, center: true };
      const params2 = { radius: 5, fn: 8, center: true };

      const key1 = cacheService.generateCacheKey('sphere', params1);
      const key2 = cacheService.generateCacheKey('sphere', params2);

      expect(key1).toBe(key2);
    });

    it('should generate different cache keys for different parameters', () => {
      const params1 = { radius: 5, fn: 8 };
      const params2 = { radius: 5, fn: 16 };

      const key1 = cacheService.generateCacheKey('sphere', params1);
      const key2 = cacheService.generateCacheKey('sphere', params2);

      expect(key1).not.toBe(key2);
    });

    it('should generate different cache keys for different primitive types', () => {
      const params = { size: 5, center: true };

      const sphereKey = cacheService.generateCacheKey('sphere', params);
      const cubeKey = cacheService.generateCacheKey('cube', params);

      expect(sphereKey).not.toBe(cubeKey);
    });

    it('should handle parameter order independence', () => {
      const params1 = { radius: 5, fn: 8, center: true };
      const params2 = { center: true, fn: 8, radius: 5 };

      const key1 = cacheService.generateCacheKey('sphere', params1);
      const key2 = cacheService.generateCacheKey('sphere', params2);

      expect(key1).toBe(key2);
    });
  });

  describe('Cache Operations', () => {
    const mockSphereGeometry: Polyhedron3DGeometryData = {
      vertices: [
        { x: 0, y: 0, z: 1 },
        { x: 1, y: 0, z: 0 },
        { x: 0, y: 1, z: 0 },
        { x: -1, y: 0, z: 0 },
        { x: 0, y: -1, z: 0 },
        { x: 0, y: 0, z: -1 },
      ],
      faces: [
        [0, 1, 2],
        [0, 2, 3],
        [0, 3, 4],
        [0, 4, 1],
        [5, 2, 1],
        [5, 3, 2],
        [5, 4, 3],
        [5, 1, 4],
      ],
      metadata: {
        primitiveType: '3d-polyhedron',
        parameters: { radius: 5, fn: 8 },
        fragmentCount: 8,
        generatedAt: Date.now(),
        isConvex: true,
        volume: 523.6,
        surfaceArea: 314.2,
      },
    };

    it('should cache and retrieve geometry successfully', () => {
      const cacheKey = cacheService.generateCacheKey('sphere', { radius: 5, fn: 8 });

      // Cache the geometry
      const cacheResult = cacheService.cacheGeometry(cacheKey, mockSphereGeometry);
      expect(isSuccess(cacheResult)).toBe(true);

      // Retrieve the geometry
      const retrieveResult = cacheService.getCachedGeometry(cacheKey);
      expect(isSuccess(retrieveResult)).toBe(true);

      if (isSuccess(retrieveResult)) {
        expect(retrieveResult.data).toEqual(mockSphereGeometry);
      }
    });

    it('should return cache miss for non-existent keys', () => {
      const cacheKey = cacheService.generateCacheKey('sphere', { radius: 10, fn: 16 });

      const result = cacheService.getCachedGeometry(cacheKey);
      expect(isError(result)).toBe(true);

      if (isError(result)) {
        expect(result.error.message).toContain('Cache miss');
      }
    });

    it('should track access count correctly', () => {
      const cacheKey = cacheService.generateCacheKey('sphere', { radius: 5, fn: 8 });

      // Cache the geometry
      cacheService.cacheGeometry(cacheKey, mockSphereGeometry);

      // Access multiple times
      for (let i = 0; i < 5; i++) {
        const result = cacheService.getCachedGeometry(cacheKey);
        expect(isSuccess(result)).toBe(true);
      }

      const stats = cacheService.getStatistics();
      expect(stats.totalHits).toBe(5);
      expect(stats.totalMisses).toBe(0);
    });
  });

  describe('Cache Statistics', () => {
    const mockGeometry: Polyhedron3DGeometryData = {
      vertices: [{ x: 0, y: 0, z: 0 }],
      faces: [[0, 0, 0]],
      metadata: {
        primitiveType: '3d-polyhedron',
        parameters: {},
        fragmentCount: 1,
        generatedAt: Date.now(),
        isConvex: true,
        volume: 1,
        surfaceArea: 1,
      },
    };

    it('should provide accurate cache statistics', () => {
      const key1 = cacheService.generateCacheKey('sphere', { radius: 5 });
      const key2 = cacheService.generateCacheKey('cube', { size: 3 });

      // Cache two geometries
      cacheService.cacheGeometry(key1, mockGeometry);
      cacheService.cacheGeometry(key2, mockGeometry);

      // Access one geometry multiple times
      cacheService.getCachedGeometry(key1);
      cacheService.getCachedGeometry(key1);
      cacheService.getCachedGeometry(key1);

      // Try to access non-existent geometry
      const nonExistentKey = cacheService.generateCacheKey('cylinder', { height: 10 });
      cacheService.getCachedGeometry(nonExistentKey);

      const stats = cacheService.getStatistics();

      expect(stats.totalEntries).toBe(2);
      expect(stats.totalHits).toBe(3);
      expect(stats.totalMisses).toBe(1);
      expect(stats.hitRate).toBe(75); // 3 hits out of 4 total requests
      expect(stats.mostAccessedKey).toBe(key1);
    });

    it('should track memory usage', () => {
      const key = cacheService.generateCacheKey('sphere', { radius: 5 });
      cacheService.cacheGeometry(key, mockGeometry);

      const stats = cacheService.getStatistics();
      expect(stats.totalMemoryUsage).toBeGreaterThan(0);
    });
  });

  describe('Cache Limits and Eviction', () => {
    it('should enforce entry count limits', () => {
      // Create cache with small limit
      const limitedCache = new GeometryCacheService({ maxEntries: 3 });

      const mockGeometry: Polyhedron3DGeometryData = {
        vertices: [{ x: 0, y: 0, z: 0 }],
        faces: [[0, 0, 0]],
        metadata: {
          primitiveType: '3d-polyhedron',
          parameters: {},
          fragmentCount: 1,
          generatedAt: Date.now(),
          isConvex: true,
          volume: 1,
          surfaceArea: 1,
        },
      };

      // Add more entries than the limit
      for (let i = 0; i < 5; i++) {
        const key = limitedCache.generateCacheKey('sphere', { radius: i });
        limitedCache.cacheGeometry(key, mockGeometry);
      }

      const stats = limitedCache.getStatistics();
      expect(stats.totalEntries).toBeLessThanOrEqual(3);
    });

    it('should handle TTL expiration', async () => {
      // Create cache with very short TTL
      const shortTtlCache = new GeometryCacheService({ ttlMs: 10 });

      const mockGeometry: Polyhedron3DGeometryData = {
        vertices: [{ x: 0, y: 0, z: 0 }],
        faces: [[0, 0, 0]],
        metadata: {
          primitiveType: '3d-polyhedron',
          parameters: {},
          fragmentCount: 1,
          generatedAt: Date.now(),
          isConvex: true,
          volume: 1,
          surfaceArea: 1,
        },
      };

      const key = shortTtlCache.generateCacheKey('sphere', { radius: 5 });
      shortTtlCache.cacheGeometry(key, mockGeometry);

      // Should be available immediately
      let result = shortTtlCache.getCachedGeometry(key);
      expect(isSuccess(result)).toBe(true);

      // Wait for TTL to expire
      await new Promise((resolve) => setTimeout(resolve, 20));

      // Should be expired now
      result = shortTtlCache.getCachedGeometry(key);
      expect(isError(result)).toBe(true);

      if (isError(result)) {
        expect(result.error.message).toContain('expired');
      }
    });
  });

  describe('Cache Clearing', () => {
    it('should clear all cached entries', () => {
      const mockGeometry: Polyhedron3DGeometryData = {
        vertices: [{ x: 0, y: 0, z: 0 }],
        faces: [[0, 0, 0]],
        metadata: {
          primitiveType: '3d-polyhedron',
          parameters: {},
          fragmentCount: 1,
          generatedAt: Date.now(),
          isConvex: true,
          volume: 1,
          surfaceArea: 1,
        },
      };

      // Add some entries
      for (let i = 0; i < 3; i++) {
        const key = cacheService.generateCacheKey('sphere', { radius: i });
        cacheService.cacheGeometry(key, mockGeometry);
      }

      let stats = cacheService.getStatistics();
      expect(stats.totalEntries).toBe(3);

      // Clear cache
      cacheService.clearCache();

      stats = cacheService.getStatistics();
      expect(stats.totalEntries).toBe(0);
      expect(stats.totalHits).toBe(0);
      expect(stats.totalMisses).toBe(0);
    });
  });

  describe('2D Geometry Caching', () => {
    const mock2DGeometry: Polygon2DGeometryData = {
      vertices: [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 1, y: 1 },
        { x: 0, y: 1 },
      ],
      outline: [0, 1, 2, 3],
      holes: [],
      metadata: {
        primitiveType: '2d-polygon',
        parameters: { size: 1 },
        fragmentCount: 4,
        generatedAt: Date.now(),
        isConvex: true,
        area: 1,
      },
    };

    it('should cache and retrieve 2D geometry successfully', () => {
      const cacheKey = cacheService.generateCacheKey('square', { size: 1 });

      // Cache the geometry
      const cacheResult = cacheService.cacheGeometry(cacheKey, mock2DGeometry);
      expect(isSuccess(cacheResult)).toBe(true);

      // Retrieve the geometry
      const retrieveResult = cacheService.getCachedGeometry(cacheKey);
      expect(isSuccess(retrieveResult)).toBe(true);

      if (isSuccess(retrieveResult)) {
        expect(retrieveResult.data).toEqual(mock2DGeometry);
      }
    });
  });
});
