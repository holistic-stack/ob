/**
 * @file render-cache.service.test.ts
 * @description Tests for Render Cache Service following TDD methodology.
 * Tests caching strategies, performance optimizations, and memory management.
 *
 * @author OpenSCAD Babylon Team
 * @version 1.0.0
 * @since 2025-07-30
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { isError, isSuccess } from '../../../../shared/utils/functional/result';
import type { ASTNode } from '../../../openscad-parser/core/ast-types';
import { RenderCacheService } from './render-cache.service';

// Mock BabylonJS AbstractMesh for testing
const createMockMesh = (name: string, vertexCount: number = 100, faceCount: number = 50) =>
  ({
    name,
    geometry: {
      getVerticesData: vi.fn().mockReturnValue(new Array(vertexCount * 3).fill(0)),
      getIndices: vi.fn().mockReturnValue(new Array(faceCount * 3).fill(0)),
    },
    dispose: vi.fn(),
  }) as any;

// Helper function to create test AST nodes
const createTestASTNode = (type: string, id?: string): ASTNode =>
  ({
    type,
    id,
    parameters: { test: 'value' },
    children: [],
  }) as any;

describe('RenderCacheService', () => {
  let service: RenderCacheService;

  beforeEach(() => {
    service = new RenderCacheService();
  });

  describe('generateCacheKey', () => {
    it('should generate consistent cache keys for identical AST nodes', () => {
      const astNodes = [createTestASTNode('cube', 'cube1'), createTestASTNode('sphere', 'sphere1')];

      const key1 = service.generateCacheKey(astNodes);
      const key2 = service.generateCacheKey(astNodes);

      expect(key1).toBe(key2);
      expect(key1).toMatch(/^ast_[a-z0-9]+_2$/);
    });

    it('should generate different cache keys for different AST nodes', () => {
      const astNodes1 = [createTestASTNode('cube', 'cube1')];
      const astNodes2 = [createTestASTNode('sphere', 'sphere1')];

      const key1 = service.generateCacheKey(astNodes1);
      const key2 = service.generateCacheKey(astNodes2);

      expect(key1).not.toBe(key2);
    });

    it('should include node count in cache key', () => {
      const singleNode = [createTestASTNode('cube')];
      const multipleNodes = [createTestASTNode('cube'), createTestASTNode('sphere')];

      const key1 = service.generateCacheKey(singleNode);
      const key2 = service.generateCacheKey(multipleNodes);

      expect(key1).toContain('_1');
      expect(key2).toContain('_2');
    });

    it('should handle empty AST node arrays', () => {
      const key = service.generateCacheKey([]);
      expect(key).toMatch(/^ast_[a-z0-9]+_0$/);
    });
  });

  describe('getCachedMeshes', () => {
    it('should return null for non-existent cache key', () => {
      const result = service.getCachedMeshes('non-existent-key');
      expect(result).toBeNull();
    });

    it('should return cached meshes for valid cache key', () => {
      const astNodes = [createTestASTNode('cube')];
      const cacheKey = service.generateCacheKey(astNodes);
      const mockMeshes = [createMockMesh('test-mesh')];

      // Cache the meshes first
      const cacheResult = service.cacheMeshes(cacheKey, mockMeshes);
      expect(isSuccess(cacheResult)).toBe(true);

      // Retrieve cached meshes
      const cachedMeshes = service.getCachedMeshes(cacheKey);
      expect(cachedMeshes).toEqual(mockMeshes);
    });

    it('should update access metadata on cache hit', () => {
      const astNodes = [createTestASTNode('cube')];
      const cacheKey = service.generateCacheKey(astNodes);
      const mockMeshes = [createMockMesh('test-mesh')];

      service.cacheMeshes(cacheKey, mockMeshes);

      // First access (1 hit, 0 misses = 100% hit rate)
      service.getCachedMeshes(cacheKey);
      const stats1 = service.getStatistics();

      // Add a miss to change the hit rate
      service.getCachedMeshes('non-existent-key');

      // Second access (2 hits, 1 miss = 66.7% hit rate)
      service.getCachedMeshes(cacheKey);
      const stats2 = service.getStatistics();

      // Hit rate should be different due to the miss
      expect(stats1.hitRate).toBe(1); // 100%
      expect(stats2.hitRate).toBeCloseTo(0.667, 2); // 66.7%
    });

    it('should return null for expired cache entries', () => {
      const shortExpiryService = new RenderCacheService({ maxAgeMs: 10 });
      const astNodes = [createTestASTNode('cube')];
      const cacheKey = shortExpiryService.generateCacheKey(astNodes);
      const mockMeshes = [createMockMesh('test-mesh')];

      shortExpiryService.cacheMeshes(cacheKey, mockMeshes);

      // Wait for expiry
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          const cachedMeshes = shortExpiryService.getCachedMeshes(cacheKey);
          expect(cachedMeshes).toBeNull();
          resolve();
        }, 20);
      });
    });
  });

  describe('cacheMeshes', () => {
    it('should successfully cache meshes', () => {
      const astNodes = [createTestASTNode('cube')];
      const cacheKey = service.generateCacheKey(astNodes);
      const mockMeshes = [createMockMesh('test-mesh')];

      const result = service.cacheMeshes(cacheKey, mockMeshes, 15.5);

      expect(isSuccess(result)).toBe(true);

      const cachedMeshes = service.getCachedMeshes(cacheKey);
      expect(cachedMeshes).toEqual(mockMeshes);
    });

    it('should reject meshes that exceed memory limits', () => {
      const smallMemoryService = new RenderCacheService({ maxMemoryMB: 1 });
      const astNodes = [createTestASTNode('cube')];
      const cacheKey = smallMemoryService.generateCacheKey(astNodes);

      // Create large mesh that exceeds memory limit
      const largeMeshes = [createMockMesh('large-mesh', 100000, 50000)];

      const result = smallMemoryService.cacheMeshes(cacheKey, largeMeshes);

      expect(isError(result)).toBe(true);
      if (isError(result)) {
        expect(result.error.message).toContain('memory limit');
      }
    });

    it('should store render time metadata', () => {
      const astNodes = [createTestASTNode('cube')];
      const cacheKey = service.generateCacheKey(astNodes);
      const mockMeshes = [createMockMesh('test-mesh')];
      const renderTime = 25.7;

      service.cacheMeshes(cacheKey, mockMeshes, renderTime);

      const stats = service.getStatistics();
      expect(stats.averageRenderTime).toBeCloseTo(renderTime, 1);
    });
  });

  describe('clearCache', () => {
    it('should clear all cached entries', () => {
      const astNodes1 = [createTestASTNode('cube')];
      const astNodes2 = [createTestASTNode('sphere')];
      const mockMeshes = [createMockMesh('test-mesh')];

      service.cacheMeshes(service.generateCacheKey(astNodes1), mockMeshes);
      service.cacheMeshes(service.generateCacheKey(astNodes2), mockMeshes);

      expect(service.getStatistics().totalEntries).toBe(2);

      service.clearCache();

      expect(service.getStatistics().totalEntries).toBe(0);
      expect(service.getStatistics().hitRate).toBe(0);
    });
  });

  describe('getStatistics', () => {
    it('should provide accurate cache statistics', () => {
      const astNodes = [createTestASTNode('cube')];
      const cacheKey = service.generateCacheKey(astNodes);
      const mockMeshes = [createMockMesh('test-mesh')];

      // Initially empty
      let stats = service.getStatistics();
      expect(stats.totalEntries).toBe(0);
      expect(stats.hitRate).toBe(0);

      // After caching
      service.cacheMeshes(cacheKey, mockMeshes, 10);
      stats = service.getStatistics();
      expect(stats.totalEntries).toBe(1);
      expect(stats.totalMemoryMB).toBeGreaterThan(0);

      // After cache hit
      service.getCachedMeshes(cacheKey);
      stats = service.getStatistics();
      expect(stats.hitRate).toBe(1);

      // After cache miss
      service.getCachedMeshes('non-existent');
      stats = service.getStatistics();
      expect(stats.hitRate).toBe(0.5);
    });

    it('should track most accessed cache key', () => {
      const astNodes1 = [createTestASTNode('cube')];
      const astNodes2 = [createTestASTNode('sphere')];
      const key1 = service.generateCacheKey(astNodes1);
      const key2 = service.generateCacheKey(astNodes2);
      const mockMeshes = [createMockMesh('test-mesh')];

      service.cacheMeshes(key1, mockMeshes);
      service.cacheMeshes(key2, mockMeshes);

      // Access key1 multiple times
      service.getCachedMeshes(key1);
      service.getCachedMeshes(key1);
      service.getCachedMeshes(key1);

      // Access key2 once
      service.getCachedMeshes(key2);

      const stats = service.getStatistics();
      expect(stats.mostAccessedKey).toBe(key1);
    });
  });

  describe('memory management', () => {
    it('should enforce memory limits by removing old entries', () => {
      const limitedService = new RenderCacheService({
        maxMemoryMB: 0.1, // Very small limit
        maxEntries: 10,
      });

      const mockMeshes = [createMockMesh('test-mesh', 1000, 500)];

      // Add multiple entries that exceed memory limit
      for (let i = 0; i < 5; i++) {
        const astNodes = [createTestASTNode('cube', `cube${i}`)];
        const cacheKey = limitedService.generateCacheKey(astNodes);
        limitedService.cacheMeshes(cacheKey, mockMeshes);
      }

      const stats = limitedService.getStatistics();
      expect(stats.totalEntries).toBeLessThan(5);
      expect(stats.totalMemoryMB).toBeLessThanOrEqual(0.1);
    });

    it('should enforce size limits by removing least recently used entries', () => {
      const limitedService = new RenderCacheService({ maxEntries: 2 });
      const mockMeshes = [createMockMesh('test-mesh')];

      // Add 3 entries (exceeds limit)
      const keys = [];
      for (let i = 0; i < 3; i++) {
        const astNodes = [createTestASTNode('cube', `cube${i}`)];
        const cacheKey = limitedService.generateCacheKey(astNodes);
        keys.push(cacheKey);
        limitedService.cacheMeshes(cacheKey, mockMeshes);
      }

      const stats = limitedService.getStatistics();
      expect(stats.totalEntries).toBe(2);

      // First entry should be removed (LRU)
      const firstEntry = limitedService.getCachedMeshes(keys[0]);
      expect(firstEntry).toBeNull();
    });
  });

  describe('performance optimization', () => {
    it('should provide fast cache key generation', () => {
      const astNodes = Array.from({ length: 100 }, (_, i) => createTestASTNode('cube', `cube${i}`));

      const startTime = performance.now();
      const cacheKey = service.generateCacheKey(astNodes);
      const endTime = performance.now();

      expect(cacheKey).toBeDefined();
      expect(endTime - startTime).toBeLessThan(10); // Should be very fast
    });

    it('should handle large mesh arrays efficiently', () => {
      const astNodes = [createTestASTNode('cube')];
      const cacheKey = service.generateCacheKey(astNodes);
      const largeMeshArray = Array.from({ length: 50 }, (_, i) => createMockMesh(`mesh${i}`));

      const startTime = performance.now();
      const result = service.cacheMeshes(cacheKey, largeMeshArray);
      const endTime = performance.now();

      expect(isSuccess(result)).toBe(true);
      expect(endTime - startTime).toBeLessThan(50); // Should be reasonably fast
    });
  });
});
