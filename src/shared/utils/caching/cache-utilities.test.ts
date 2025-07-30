/**
 * @file cache-utilities.test.ts
 * @description Tests for reusable caching utilities following TDD methodology.
 * Tests cache key generation, cache statistics, cache management patterns, and cache entry handling.
 *
 * @author OpenSCAD Babylon Team
 * @version 1.0.0
 * @since 2025-07-30
 */

import { beforeEach, describe, expect, it } from 'vitest';
import {
  CacheEntryManager,
  CacheKeyGenerator,
  CacheLimitsEnforcer,
  CacheStatisticsCalculator,
  calculateCacheHitRate,
  createCacheEntry,
  enforceCacheMemoryLimits,
  generateHashKey,
} from './cache-utilities';

// Mock cache entry for testing
const createMockCacheEntry = (key: string, memoryMB: number = 1, accessCount: number = 0) => ({
  key,
  data: { mockData: `data-${key}` },
  metadata: {
    cacheKey: key,
    createdAt: Date.now() - 1000,
    lastAccessed: Date.now(),
    accessCount,
    estimatedMemoryMB: memoryMB,
    renderTimeMs: 10,
  },
});

describe('CacheKeyGenerator', () => {
  let generator: CacheKeyGenerator;

  beforeEach(() => {
    generator = new CacheKeyGenerator();
  });

  describe('hash-based key generation', () => {
    it('should generate consistent keys for identical objects', () => {
      const obj1 = { type: 'cube', size: [1, 2, 3], id: 'test' };
      const obj2 = { type: 'cube', size: [1, 2, 3], id: 'test' };

      const key1 = generator.generateKey(obj1);
      const key2 = generator.generateKey(obj2);

      expect(key1).toBe(key2);
      expect(key1).toMatch(/^cache_[a-z0-9]+_\d+$/);
    });

    it('should generate different keys for different objects', () => {
      const obj1 = { type: 'cube', size: [1, 2, 3] };
      const obj2 = { type: 'sphere', radius: 5 };

      const key1 = generator.generateKey(obj1);
      const key2 = generator.generateKey(obj2);

      expect(key1).not.toBe(key2);
    });

    it('should handle arrays and nested objects', () => {
      const complexObj = {
        type: 'polygon',
        points: [
          [0, 0],
          [1, 0],
          [1, 1],
        ],
        metadata: { version: 1, flags: ['test'] },
      };

      const key = generator.generateKey(complexObj);
      expect(key).toBeDefined();
      expect(typeof key).toBe('string');
    });

    it('should generate keys with custom prefix', () => {
      const obj = { type: 'cube' };
      const key = generator.generateKey(obj, 'mesh');

      expect(key).toMatch(/^mesh_[a-z0-9]+_\d+$/);
    });

    it('should handle null and undefined values', () => {
      const obj = { type: 'cube', size: null, id: undefined };
      const key = generator.generateKey(obj);

      expect(key).toBeDefined();
      expect(typeof key).toBe('string');
    });
  });

  describe('key validation', () => {
    it('should validate cache key format', () => {
      expect(generator.isValidKey('ast_abc123_5')).toBe(true);
      expect(generator.isValidKey('mesh_xyz789_10')).toBe(true);
      expect(generator.isValidKey('invalid-key')).toBe(false);
      expect(generator.isValidKey('')).toBe(false);
    });
  });
});

describe('CacheStatisticsCalculator', () => {
  let calculator: CacheStatisticsCalculator;

  beforeEach(() => {
    calculator = new CacheStatisticsCalculator();
  });

  describe('hit rate calculation', () => {
    it('should calculate hit rate correctly', () => {
      expect(calculator.calculateHitRate(80, 20)).toBeCloseTo(0.8, 2);
      expect(calculator.calculateHitRate(0, 0)).toBe(0);
      expect(calculator.calculateHitRate(10, 0)).toBe(1);
    });
  });

  describe('cache statistics', () => {
    it('should calculate comprehensive cache statistics', () => {
      const entries = [
        createMockCacheEntry('key1', 2, 5),
        createMockCacheEntry('key2', 3, 10),
        createMockCacheEntry('key3', 1, 2),
      ];

      const stats = calculator.calculateStatistics(entries, 15, 5);

      expect(stats.totalEntries).toBe(3);
      expect(stats.totalMemoryMB).toBe(6);
      expect(stats.hitRate).toBe(0.75); // 15 hits / (15 hits + 5 misses)
      expect(stats.averageRenderTime).toBe(10);
      expect(stats.mostAccessedKey).toBe('key2');
    });

    it('should handle empty cache', () => {
      const stats = calculator.calculateStatistics([], 0, 0);

      expect(stats.totalEntries).toBe(0);
      expect(stats.totalMemoryMB).toBe(0);
      expect(stats.hitRate).toBe(0);
      expect(stats.averageRenderTime).toBe(0);
      expect(stats.mostAccessedKey).toBe('');
    });

    it('should calculate oldest entry age', () => {
      const now = Date.now();
      const entries = [
        {
          ...createMockCacheEntry('key1'),
          metadata: { ...createMockCacheEntry('key1').metadata, createdAt: now - 5000 },
        },
        {
          ...createMockCacheEntry('key2'),
          metadata: { ...createMockCacheEntry('key2').metadata, createdAt: now - 10000 },
        },
      ];

      const stats = calculator.calculateStatistics(entries, 0, 0);
      expect(stats.oldestEntryAge).toBeCloseTo(10000, 100);
    });
  });
});

describe('CacheEntryManager', () => {
  let manager: CacheEntryManager;

  beforeEach(() => {
    manager = new CacheEntryManager();
  });

  describe('cache entry creation', () => {
    it('should create cache entry with metadata', () => {
      const data = { test: 'data' };
      const entry = manager.createEntry('test-key', data, 15.5);

      expect(entry.key).toBe('test-key');
      expect(entry.data).toEqual(data);
      expect(entry.metadata.cacheKey).toBe('test-key');
      expect(entry.metadata.renderTimeMs).toBe(15.5);
      expect(entry.metadata.accessCount).toBe(0);
      expect(entry.metadata.createdAt).toBeCloseTo(Date.now(), 50);
    });

    it('should estimate memory usage for different data types', () => {
      const smallData = { test: 'small' };
      const largeData = { test: 'x'.repeat(10000) };

      const smallEntry = manager.createEntry('small', smallData);
      const largeEntry = manager.createEntry('large', largeData);

      expect(largeEntry.metadata.estimatedMemoryMB).toBeGreaterThan(
        smallEntry.metadata.estimatedMemoryMB
      );
    });
  });

  describe('cache entry updates', () => {
    it('should update access metadata', () => {
      const entry = createMockCacheEntry('test');
      const originalAccessCount = entry.metadata.accessCount;

      const updatedEntry = manager.updateAccessMetadata(entry);

      expect(updatedEntry.metadata.accessCount).toBe(originalAccessCount + 1);
      expect(updatedEntry.metadata.lastAccessed).toBeCloseTo(Date.now(), 100);
    });

    it('should check if entry is expired', () => {
      const now = Date.now();
      const freshEntry = {
        ...createMockCacheEntry('fresh'),
        metadata: { ...createMockCacheEntry('fresh').metadata, createdAt: now - 1000 },
      };
      const expiredEntry = {
        ...createMockCacheEntry('expired'),
        metadata: { ...createMockCacheEntry('expired').metadata, createdAt: now - 10000 },
      };

      expect(manager.isExpired(freshEntry, 5000)).toBe(false);
      expect(manager.isExpired(expiredEntry, 5000)).toBe(true);
    });
  });
});

describe('CacheLimitsEnforcer', () => {
  let enforcer: CacheLimitsEnforcer;

  beforeEach(() => {
    enforcer = new CacheLimitsEnforcer();
  });

  describe('memory limits enforcement', () => {
    it('should identify entries to remove for memory limits', () => {
      const entries = [
        createMockCacheEntry('key1', 5, 1), // 5MB, 1 access
        createMockCacheEntry('key2', 3, 5), // 3MB, 5 accesses
        createMockCacheEntry('key3', 2, 2), // 2MB, 2 accesses
      ];

      const toRemove = enforcer.enforceMemoryLimits(entries, 8); // 8MB limit, total is 10MB

      expect(toRemove.length).toBeGreaterThan(0);
      expect(
        toRemove.reduce((sum, entry) => sum + entry.metadata.estimatedMemoryMB, 0)
      ).toBeGreaterThanOrEqual(2);
    });

    it('should prioritize least recently used entries', () => {
      const now = Date.now();
      const oldEntry = createMockCacheEntry('old', 2);
      const newEntry = createMockCacheEntry('new', 2);

      const entries = [
        { ...oldEntry, metadata: { ...oldEntry.metadata, lastAccessed: now - 5000 } },
        { ...newEntry, metadata: { ...newEntry.metadata, lastAccessed: now - 1000 } },
      ];

      // Total memory: 4MB, limit: 3MB, should remove 1MB+ (at least 1 entry)
      const toRemove = enforcer.enforceMemoryLimits(entries, 3);

      expect(toRemove.length).toBeGreaterThanOrEqual(1);
      if (toRemove.length > 0) {
        expect(toRemove[0].key).toBe('old');
      }
    });
  });

  describe('size limits enforcement', () => {
    it('should identify entries to remove for size limits', () => {
      const entries = [
        createMockCacheEntry('key1'),
        createMockCacheEntry('key2'),
        createMockCacheEntry('key3'),
      ];

      const toRemove = enforcer.enforceSizeLimits(entries, 2); // 2 entry limit

      expect(toRemove.length).toBe(1);
    });
  });

  describe('age-based cleanup', () => {
    it('should identify expired entries', () => {
      const now = Date.now();
      const entries = [
        {
          ...createMockCacheEntry('fresh'),
          metadata: { ...createMockCacheEntry('fresh').metadata, createdAt: now - 1000 },
        },
        {
          ...createMockCacheEntry('expired'),
          metadata: { ...createMockCacheEntry('expired').metadata, createdAt: now - 10000 },
        },
      ];

      const expired = enforcer.findExpiredEntries(entries, 5000); // 5 second max age

      expect(expired.length).toBe(1);
      expect(expired[0].key).toBe('expired');
    });
  });
});

describe('utility functions', () => {
  describe('generateHashKey', () => {
    it('should generate hash key from object', () => {
      const obj = { type: 'cube', size: [1, 2, 3] };
      const key = generateHashKey(obj);

      expect(key).toMatch(/^cache_[a-z0-9]+_\d+$/);
    });

    it('should generate consistent keys', () => {
      const obj = { type: 'cube' };
      const key1 = generateHashKey(obj);
      const key2 = generateHashKey(obj);

      expect(key1).toBe(key2);
    });
  });

  describe('calculateCacheHitRate', () => {
    it('should calculate hit rate correctly', () => {
      expect(calculateCacheHitRate(80, 20)).toBeCloseTo(0.8, 2);
      expect(calculateCacheHitRate(0, 0)).toBe(0);
    });
  });

  describe('createCacheEntry', () => {
    it('should create cache entry with metadata', () => {
      const entry = createCacheEntry('test-key', { data: 'test' }, 10);

      expect(entry.key).toBe('test-key');
      expect(entry.metadata.renderTimeMs).toBe(10);
    });
  });

  describe('enforceCacheMemoryLimits', () => {
    it('should return entries to remove for memory limits', () => {
      const entries = [createMockCacheEntry('key1', 5), createMockCacheEntry('key2', 3)];

      const toRemove = enforceCacheMemoryLimits(entries, 6); // 6MB limit, total is 8MB

      expect(toRemove.length).toBeGreaterThan(0);
    });
  });
});
