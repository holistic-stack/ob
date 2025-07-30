/**
 * @file memory-pool.service.test.ts
 * @description Tests for Memory Pool Service following TDD methodology.
 * Tests memory pooling, resource lifecycle management, and memory pressure detection.
 *
 * @author OpenSCAD Babylon Team
 * @version 1.0.0
 * @since 2025-07-30
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { isError, isSuccess } from '../../../../shared/utils/functional/result';
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

  // Set constructor name for proper type detection
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

  // Set constructor name for proper type detection
  Object.defineProperty(texture, 'constructor', {
    value: { name: 'Texture' },
    configurable: true,
  });

  return texture;
};

describe('MemoryPoolService', () => {
  let service: MemoryPoolService;

  beforeEach(() => {
    service = new MemoryPoolService();
    vi.useFakeTimers();

    // Reset performance.memory mock
    Object.defineProperty(performance, 'memory', {
      value: {
        usedJSHeapSize: 50 * 1024 * 1024, // 50MB
        totalJSHeapSize: 100 * 1024 * 1024, // 100MB
        jsHeapSizeLimit: 2 * 1024 * 1024 * 1024, // 2GB
      },
      configurable: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('resource pooling', () => {
    it('should pool mesh resources successfully', () => {
      const mesh = createMockMesh('test-mesh');

      const result = service.poolResource(mesh);

      expect(isSuccess(result)).toBe(true);
      expect(mesh.metadata.pooled).toBe(true);

      const stats = service.getMemoryStatistics();
      expect(stats.pooledResources).toBe(1);
    });

    it('should pool texture resources successfully', () => {
      const texture = createMockTexture('test-texture');

      const result = service.poolResource(texture);

      expect(isSuccess(result)).toBe(true);
      expect(texture.metadata.pooled).toBe(true);

      const stats = service.getMemoryStatistics();
      expect(stats.pooledResources).toBe(1);
    });

    it('should reject already pooled resources', () => {
      const mesh = createMockMesh('test-mesh');
      mesh.metadata.pooled = true;

      const result = service.poolResource(mesh);

      expect(isError(result)).toBe(true);
      if (isError(result)) {
        expect(result.error.message).toContain('already pooled');
      }
    });

    it('should reject disposed resources', () => {
      const mesh = createMockMesh('test-mesh');
      mesh.isDisposed.mockReturnValue(true);

      const result = service.poolResource(mesh);

      expect(isError(result)).toBe(true);
      if (isError(result)) {
        expect(result.error.message).toContain('disposed');
      }
    });
  });

  describe('resource retrieval', () => {
    it('should retrieve pooled mesh by type', () => {
      const mesh1 = createMockMesh('mesh1');
      const mesh2 = createMockMesh('mesh2');

      service.poolResource(mesh1);
      service.poolResource(mesh2);

      const retrieved = service.getPooledResource('Mesh');
      expect(retrieved).toBeDefined();
      expect(retrieved?.metadata.pooled).toBe(false); // Should be unmarked when retrieved
    });

    it('should return null when no resources available', () => {
      const retrieved = service.getPooledResource('Mesh');
      expect(retrieved).toBeNull();
    });

    it('should prioritize least recently used resources', () => {
      const mesh1 = createMockMesh('mesh1');
      const mesh2 = createMockMesh('mesh2');

      service.poolResource(mesh1);

      // Simulate time passing
      vi.advanceTimersByTime(1000);

      service.poolResource(mesh2);

      const retrieved = service.getPooledResource('Mesh');
      expect(retrieved?.name).toBe('mesh1'); // Should get the older one first
    });
  });

  describe('memory pressure detection', () => {
    it('should detect high memory pressure', () => {
      // Mock high memory usage
      Object.defineProperty(performance, 'memory', {
        value: {
          usedJSHeapSize: 180 * 1024 * 1024, // 180MB
          totalJSHeapSize: 200 * 1024 * 1024, // 200MB (90% usage)
          jsHeapSizeLimit: 2 * 1024 * 1024 * 1024,
        },
        configurable: true,
      });

      const pressure = service.getMemoryPressure();
      expect(pressure.level).toBe('critical'); // 90% usage is critical, not high
      expect(pressure.usagePercentage).toBeCloseTo(90, 1);
      expect(pressure.recommendedAction).toContain('cleanup');
    });

    it('should detect medium memory pressure', () => {
      // Mock medium memory usage
      Object.defineProperty(performance, 'memory', {
        value: {
          usedJSHeapSize: 140 * 1024 * 1024, // 140MB
          totalJSHeapSize: 200 * 1024 * 1024, // 200MB (70% usage)
          jsHeapSizeLimit: 2 * 1024 * 1024 * 1024,
        },
        configurable: true,
      });

      const pressure = service.getMemoryPressure();
      expect(pressure.level).toBe('medium');
      expect(pressure.usagePercentage).toBeCloseTo(70, 1);
    });

    it('should detect low memory pressure', () => {
      // Mock low memory usage
      Object.defineProperty(performance, 'memory', {
        value: {
          usedJSHeapSize: 50 * 1024 * 1024, // 50MB
          totalJSHeapSize: 200 * 1024 * 1024, // 200MB (25% usage)
          jsHeapSizeLimit: 2 * 1024 * 1024 * 1024,
        },
        configurable: true,
      });

      const pressure = service.getMemoryPressure();
      expect(pressure.level).toBe('low');
      expect(pressure.usagePercentage).toBeCloseTo(25, 1);
    });
  });

  describe('automatic cleanup', () => {
    it('should perform cleanup when memory pressure is high', async () => {
      // Add some resources to pool
      const meshes = Array.from({ length: 10 }, (_, i) => createMockMesh(`mesh${i}`));
      meshes.forEach((mesh) => service.poolResource(mesh));

      // Mock high memory pressure
      Object.defineProperty(performance, 'memory', {
        value: {
          usedJSHeapSize: 180 * 1024 * 1024,
          totalJSHeapSize: 200 * 1024 * 1024,
          jsHeapSizeLimit: 2 * 1024 * 1024 * 1024,
        },
        configurable: true,
      });

      const initialStats = service.getMemoryStatistics();

      const result = await service.performAutomaticCleanup();

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data.resourcesFreed).toBeGreaterThan(0);
        expect(result.data.memoryFreedMB).toBeGreaterThan(0);
      }

      const finalStats = service.getMemoryStatistics();
      expect(finalStats.pooledResources).toBeLessThan(initialStats.pooledResources);
    });

    it('should not perform cleanup when memory pressure is low', async () => {
      const meshes = Array.from({ length: 5 }, (_, i) => createMockMesh(`mesh${i}`));
      meshes.forEach((mesh) => service.poolResource(mesh));

      const initialStats = service.getMemoryStatistics();

      const result = await service.performAutomaticCleanup();

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data.resourcesFreed).toBe(0);
        expect(result.data.memoryFreedMB).toBe(0);
      }

      const finalStats = service.getMemoryStatistics();
      expect(finalStats.pooledResources).toBe(initialStats.pooledResources);
    });
  });

  describe('memory statistics', () => {
    it('should provide accurate memory statistics', () => {
      const mesh = createMockMesh('test-mesh', 1000);
      const texture = createMockTexture('test-texture', 1024);

      service.poolResource(mesh);
      service.poolResource(texture);

      const stats = service.getMemoryStatistics();

      expect(stats.pooledResources).toBe(2);
      expect(stats.estimatedMemoryMB).toBeGreaterThan(0);
      expect(stats.resourcesByType.Mesh).toBe(1);
      expect(stats.resourcesByType.Texture).toBe(1);
      expect(stats.memoryPressure.level).toBeDefined();
    });

    it('should track memory usage over time', () => {
      const stats1 = service.getMemoryStatistics();

      // Add resources
      const mesh = createMockMesh('test-mesh');
      service.poolResource(mesh);

      const stats2 = service.getMemoryStatistics();

      expect(stats2.pooledResources).toBeGreaterThan(stats1.pooledResources);
      expect(stats2.estimatedMemoryMB).toBeGreaterThan(stats1.estimatedMemoryMB);
    });
  });

  describe('resource lifecycle management', () => {
    it('should properly dispose resources during cleanup', async () => {
      const mesh = createMockMesh('test-mesh');
      service.poolResource(mesh);

      // Force cleanup by mocking high memory pressure
      Object.defineProperty(performance, 'memory', {
        value: {
          usedJSHeapSize: 190 * 1024 * 1024,
          totalJSHeapSize: 200 * 1024 * 1024,
          jsHeapSizeLimit: 2 * 1024 * 1024 * 1024,
        },
        configurable: true,
      });

      await service.performAutomaticCleanup();

      expect(mesh.dispose).toHaveBeenCalled();
    });

    it('should handle disposal errors gracefully', async () => {
      const mesh = createMockMesh('test-mesh');
      mesh.dispose.mockImplementation(() => {
        throw new Error('Disposal failed');
      });

      service.poolResource(mesh);

      // Force cleanup
      Object.defineProperty(performance, 'memory', {
        value: {
          usedJSHeapSize: 190 * 1024 * 1024,
          totalJSHeapSize: 200 * 1024 * 1024,
          jsHeapSizeLimit: 2 * 1024 * 1024 * 1024,
        },
        configurable: true,
      });

      const result = await service.performAutomaticCleanup();

      // Should still succeed despite disposal error
      expect(isSuccess(result)).toBe(true);
    });
  });

  describe('performance optimization', () => {
    it('should handle large numbers of resources efficiently', () => {
      // Create service with higher limits for this test
      const largePoolService = new MemoryPoolService({
        maxPoolSize: 1000,
        maxMemoryMB: 1000,
      });

      const startTime = performance.now();

      // Pool 1000 resources
      const resources = Array.from({ length: 1000 }, (_, i) => createMockMesh(`mesh${i}`));
      resources.forEach((resource) => largePoolService.poolResource(resource));

      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100); // Should complete within 100ms
      expect(largePoolService.getMemoryStatistics().pooledResources).toBe(1000);
    });

    it('should retrieve resources efficiently', () => {
      // Pool many resources
      const resources = Array.from({ length: 100 }, (_, i) => createMockMesh(`mesh${i}`));
      resources.forEach((resource) => service.poolResource(resource));

      const startTime = performance.now();

      // Retrieve 50 resources
      for (let i = 0; i < 50; i++) {
        service.getPooledResource('Mesh');
      }

      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(50); // Should be very fast
    });
  });
});
