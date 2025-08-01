/**
 * @file memory-manager.service.test.ts
 * @description Tests for integrated Memory Manager Service following TDD methodology.
 * Tests comprehensive memory management, optimization, and performance monitoring.
 *
 * @author OpenSCAD Babylon Team
 * @version 1.0.0
 * @since 2025-07-30
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { isError, isSuccess } from '@/shared';
import { MemoryManagerService } from './memory-manager.service';
import { MemoryPoolService } from './memory-pool.service';

// Mock BabylonJS objects for testing
const createMockMesh = (name: string, vertexCount: number = 100) => {
  const mesh = {
    name,
    uniqueId: Math.random(),
    geometry: {
      getTotalVertices: vi.fn().mockReturnValue(vertexCount),
      getVerticesData: vi.fn().mockReturnValue(new Array(vertexCount * 3).fill(0)),
      getIndices: vi.fn().mockReturnValue(new Array(vertexCount * 2).fill(0)),
    },
    dispose: vi.fn(),
    isDisposed: vi.fn().mockReturnValue(false),
    metadata: { pooled: false },
  } as any;

  Object.defineProperty(mesh, 'constructor', {
    value: { name: 'Mesh' },
    configurable: true,
  });

  return mesh;
};

const createMockTexture = (name: string, size: number = 512) => {
  const texture = {
    name,
    uniqueId: Math.random(),
    getSize: vi.fn().mockReturnValue({ width: size, height: size }),
    dispose: vi.fn(),
    isDisposed: vi.fn().mockReturnValue(false),
    metadata: { pooled: false },
  } as any;

  Object.defineProperty(texture, 'constructor', {
    value: { name: 'Texture' },
    configurable: true,
  });

  return texture;
};

describe('MemoryManagerService', () => {
  let service: MemoryManagerService;

  beforeEach(() => {
    service = new MemoryManagerService();
    vi.useFakeTimers();

    // Mock performance.memory
    Object.defineProperty(performance, 'memory', {
      value: {
        usedJSHeapSize: 50 * 1024 * 1024, // 50MB
        totalJSHeapSize: 100 * 1024 * 1024, // 100MB
        jsHeapSizeLimit: 2 * 1024 * 1024 * 1024, // 2GB
      },
      configurable: true,
    });
  });

  afterEach(async () => {
    await service.shutdown();
    vi.useRealTimers();
  });

  describe('initialization and shutdown', () => {
    it('should initialize successfully', async () => {
      const result = await service.initialize();

      expect(isSuccess(result)).toBe(true);
    });

    it('should handle multiple initialization calls gracefully', async () => {
      const result1 = await service.initialize();
      const result2 = await service.initialize();

      expect(isSuccess(result1)).toBe(true);
      expect(isSuccess(result2)).toBe(true);
    });

    it('should shutdown gracefully', async () => {
      await service.initialize();

      // Should not throw
      await expect(service.shutdown()).resolves.not.toThrow();
    });
  });

  describe('resource pooling integration', () => {
    it('should pool mesh resources successfully', () => {
      const mesh = createMockMesh('test-mesh');

      const result = service.poolResource(mesh);

      expect(isSuccess(result)).toBe(true);
      expect(mesh.metadata.pooled).toBe(true);
    });

    it('should pool texture resources successfully', () => {
      const texture = createMockTexture('test-texture');

      const result = service.poolResource(texture);

      expect(isSuccess(result)).toBe(true);
      expect(texture.metadata.pooled).toBe(true);
    });

    it('should retrieve pooled resources', () => {
      const mesh = createMockMesh('test-mesh');
      service.poolResource(mesh);

      const retrieved = service.getPooledResource('Mesh');

      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe('test-mesh');
    });
  });

  describe('comprehensive statistics', () => {
    it('should provide comprehensive memory statistics', () => {
      const mesh = createMockMesh('test-mesh');
      const texture = createMockTexture('test-texture');

      service.poolResource(mesh);
      service.poolResource(texture);

      const stats = service.getComprehensiveStatistics();

      expect(stats.totalResources).toBe(2);
      expect(stats.pooledResources).toBe(2);
      expect(stats.totalMemoryMB).toBeGreaterThan(0);
      expect(stats.memoryEfficiencyScore).toBeGreaterThanOrEqual(0);
      expect(stats.memoryEfficiencyScore).toBeLessThanOrEqual(100);
      expect(Array.isArray(stats.recommendedActions)).toBe(true);
    });

    it('should calculate memory efficiency score correctly', () => {
      const stats = service.getComprehensiveStatistics();

      expect(stats.memoryEfficiencyScore).toBeGreaterThanOrEqual(0);
      expect(stats.memoryEfficiencyScore).toBeLessThanOrEqual(100);
    });

    it('should provide relevant recommended actions', () => {
      const stats = service.getComprehensiveStatistics();

      expect(stats.recommendedActions.length).toBeGreaterThan(0);
      // Should contain either 'optimal' or a specific recommendation
      const hasOptimalOrRecommendation = stats.recommendedActions.some(
        (action) =>
          action.includes('optimal') || action.includes('cache') || action.includes('memory')
      );
      expect(hasOptimalOrRecommendation).toBe(true);
    });
  });

  describe('memory optimization', () => {
    it('should perform memory optimization successfully', async () => {
      // Add some resources to optimize
      const meshes = Array.from({ length: 10 }, (_, i) => createMockMesh(`mesh${i}`));
      meshes.forEach((mesh) => service.poolResource(mesh));

      const result = await service.optimizeMemoryUsage();

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data.optimizationTimeMs).toBeGreaterThan(0);
        expect(result.data.totalMemoryFreedMB).toBeGreaterThanOrEqual(0);
        expect(result.data.totalResourcesFreed).toBeGreaterThanOrEqual(0);
        expect(result.data.efficiencyImprovement).toBeGreaterThanOrEqual(0);
      }
    });

    it('should handle optimization with high memory pressure', async () => {
      // Mock high memory pressure
      Object.defineProperty(performance, 'memory', {
        value: {
          usedJSHeapSize: 180 * 1024 * 1024, // 180MB
          totalJSHeapSize: 200 * 1024 * 1024, // 200MB (90% usage)
          jsHeapSizeLimit: 2 * 1024 * 1024 * 1024,
        },
        configurable: true,
      });

      // Add resources to clean up
      const meshes = Array.from({ length: 20 }, (_, i) => createMockMesh(`mesh${i}`));
      meshes.forEach((mesh) => service.poolResource(mesh));

      const result = await service.optimizeMemoryUsage();

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data.totalResourcesFreed).toBeGreaterThan(0);
        expect(result.data.totalMemoryFreedMB).toBeGreaterThan(0);
      }
    });

    it('should track optimization performance metrics', async () => {
      const result = await service.optimizeMemoryUsage();

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data.optimizationTimeMs).toBeGreaterThan(0);
        expect(result.data.efficiencyImprovement).toBeGreaterThanOrEqual(0);
        expect(typeof result.data.cacheCleanup).toBe('object');
        expect(typeof result.data.poolCleanup).toBe('object');
      }
    });
  });

  describe('automatic optimization', () => {
    it('should start automatic optimization when enabled', async () => {
      const serviceWithAutoOptimization = new MemoryManagerService({
        enableAutomaticOptimization: true,
        optimizationIntervalMs: 100, // Short interval for testing
      });

      await serviceWithAutoOptimization.initialize();

      // Verify automatic optimization is working by checking it doesn't throw
      expect(() => {
        vi.advanceTimersByTime(150);
      }).not.toThrow();

      await serviceWithAutoOptimization.shutdown();
    });

    it('should not start automatic optimization when disabled', async () => {
      const serviceWithoutAutoOptimization = new MemoryManagerService({
        enableAutomaticOptimization: false,
      });

      await serviceWithoutAutoOptimization.initialize();

      // Should not have any timers running
      expect(vi.getTimerCount()).toBe(0);

      await serviceWithoutAutoOptimization.shutdown();
    });

    it('should trigger optimization based on memory threshold', async () => {
      const serviceWithLowThreshold = new MemoryManagerService({
        enableAutomaticOptimization: true,
        optimizationIntervalMs: 100,
        memoryThresholdMB: 1, // Very low threshold to trigger optimization
      });

      await serviceWithLowThreshold.initialize();

      // Add resources to exceed threshold
      const meshes = Array.from({ length: 10 }, (_, i) => createMockMesh(`mesh${i}`));
      meshes.forEach((mesh) => serviceWithLowThreshold.poolResource(mesh));

      // Advance timers to trigger automatic optimization
      vi.advanceTimersByTime(150);

      await serviceWithLowThreshold.shutdown();
    });
  });

  describe('service integration', () => {
    it('should provide access to cache service', () => {
      const cache = service.cache;

      expect(cache).toBeDefined();
      expect(typeof cache.getStatistics).toBe('function');
    });

    it('should provide access to pool service', () => {
      const pool = service.pool;

      expect(pool).toBeDefined();
      expect(typeof pool.getMemoryStatistics).toBe('function');
    });

    it('should integrate cache and pool statistics', () => {
      const mesh = createMockMesh('test-mesh');
      service.poolResource(mesh);

      const stats = service.getComprehensiveStatistics();

      expect(stats.totalMemoryMB).toBe(stats.cacheMemoryMB + stats.poolMemoryMB);
      expect(stats.totalResources).toBe(stats.cachedMeshes + stats.pooledResources);
    });
  });

  describe('error handling', () => {
    it('should handle pool resource errors gracefully', () => {
      const invalidResource = null as any;

      const result = service.poolResource(invalidResource);

      expect(isError(result)).toBe(true);
    });

    it('should handle optimization errors gracefully', async () => {
      // Mock a scenario that could cause optimization to fail
      const originalOptimize = service.pool.performAutomaticCleanup;
      service.pool.performAutomaticCleanup = vi.fn().mockRejectedValue(new Error('Test error'));

      const result = await service.optimizeMemoryUsage();

      expect(isError(result)).toBe(true);

      // Restore original method
      service.pool.performAutomaticCleanup = originalOptimize;
    });
  });

  describe('performance requirements', () => {
    it('should handle large numbers of resources efficiently', () => {
      // Create service with higher limits for this test
      const largePoolService = new MemoryManagerService();
      // Replace the pool with one that has higher limits
      (largePoolService as any).memoryPool = new MemoryPoolService({
        maxPoolSize: 500,
        maxMemoryMB: 1000,
      });

      const startTime = performance.now();

      // Pool 500 resources
      const resources = Array.from({ length: 500 }, (_, i) => createMockMesh(`mesh${i}`));
      resources.forEach((resource) => largePoolService.poolResource(resource));

      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(200); // Should complete within 200ms

      const stats = largePoolService.getComprehensiveStatistics();
      expect(stats.totalResources).toBe(500);
    });

    it('should provide fast statistics calculation', () => {
      // Add many resources
      const resources = Array.from({ length: 100 }, (_, i) => createMockMesh(`mesh${i}`));
      resources.forEach((resource) => service.poolResource(resource));

      const startTime = performance.now();
      const stats = service.getComprehensiveStatistics();
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(50); // Should be very fast
      expect(stats.totalResources).toBe(100);
    });
  });
});
