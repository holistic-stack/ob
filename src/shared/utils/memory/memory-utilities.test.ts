/**
 * @file memory-utilities.test.ts
 * @description Tests for reusable memory management utilities following TDD methodology.
 * Tests memory pressure detection, resource size estimation, memory statistics calculation, and memory monitoring patterns.
 *
 * @author OpenSCAD Babylon Team
 * @version 1.0.0
 * @since 2025-07-30
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  calculateMemoryEfficiencyScore,
  detectMemoryPressure,
  estimateResourceSize,
  generateMemoryRecommendations,
  MemoryMonitor,
  MemoryPressureDetector,
  MemoryStatisticsCalculator,
  ResourceLifecycleManager,
  ResourceSizeEstimator,
} from './memory-utilities';

// Mock resource for testing
const createMockResource = (type: string, size: number = 1000) => ({
  type,
  id: `${type}-${Math.random()}`,
  metadata: { estimatedSizeMB: size / (1024 * 1024) },
  dispose: vi.fn(),
  geometry:
    type === 'mesh'
      ? {
          getVerticesData: vi.fn(() => new Float32Array(size)),
          getIndices: vi.fn(() => new Uint32Array(size / 4)),
        }
      : undefined,
  getSize:
    type === 'texture'
      ? vi.fn(() => ({ width: Math.sqrt(size), height: Math.sqrt(size) }))
      : undefined,
});

// Mock performance.memory for testing
const mockPerformanceMemory = (usedMB: number, totalMB: number) => {
  Object.defineProperty(performance, 'memory', {
    value: {
      usedJSHeapSize: usedMB * 1024 * 1024,
      totalJSHeapSize: totalMB * 1024 * 1024,
      jsHeapSizeLimit: 2 * 1024 * 1024 * 1024,
    },
    configurable: true,
  });
};

describe('MemoryPressureDetector', () => {
  let detector: MemoryPressureDetector;

  beforeEach(() => {
    detector = new MemoryPressureDetector();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('memory pressure detection', () => {
    it('should detect critical memory pressure (90%+)', () => {
      mockPerformanceMemory(180, 200); // 90% usage

      const pressure = detector.detectPressure();

      expect(pressure.level).toBe('critical');
      expect(pressure.usagePercentage).toBeCloseTo(90, 1);
      expect(pressure.recommendedAction).toContain('Immediate cleanup');
    });

    it('should detect high memory pressure (80-89%)', () => {
      mockPerformanceMemory(160, 200); // 80% usage

      const pressure = detector.detectPressure();

      expect(pressure.level).toBe('high');
      expect(pressure.usagePercentage).toBeCloseTo(80, 1);
      expect(pressure.recommendedAction).toContain('Perform cleanup');
    });

    it('should detect medium memory pressure (60-79%)', () => {
      mockPerformanceMemory(140, 200); // 70% usage

      const pressure = detector.detectPressure();

      expect(pressure.level).toBe('medium');
      expect(pressure.usagePercentage).toBeCloseTo(70, 1);
      expect(pressure.recommendedAction).toContain('Monitor usage');
    });

    it('should detect low memory pressure (<60%)', () => {
      mockPerformanceMemory(100, 200); // 50% usage

      const pressure = detector.detectPressure();

      expect(pressure.level).toBe('low');
      expect(pressure.usagePercentage).toBeCloseTo(50, 1);
      expect(pressure.recommendedAction).toContain('healthy');
    });

    it('should handle missing performance.memory gracefully', () => {
      // Remove performance.memory
      Object.defineProperty(performance, 'memory', {
        value: undefined,
        configurable: true,
      });

      const pressure = detector.detectPressure();

      expect(pressure.level).toBe('unknown');
      expect(pressure.usagePercentage).toBe(0);
      expect(pressure.recommendedAction).toContain('not available');
    });
  });

  describe('pressure level classification', () => {
    it('should classify pressure levels correctly', () => {
      expect(detector.classifyPressureLevel(95)).toBe('critical');
      expect(detector.classifyPressureLevel(85)).toBe('high');
      expect(detector.classifyPressureLevel(70)).toBe('medium');
      expect(detector.classifyPressureLevel(50)).toBe('low');
    });

    it('should generate appropriate recommendations', () => {
      expect(detector.generateRecommendation('critical')).toContain('Immediate cleanup');
      expect(detector.generateRecommendation('high')).toContain('Perform cleanup');
      expect(detector.generateRecommendation('medium')).toContain('Monitor usage');
      expect(detector.generateRecommendation('low')).toContain('healthy');
    });
  });
});

describe('ResourceSizeEstimator', () => {
  let estimator: ResourceSizeEstimator;

  beforeEach(() => {
    estimator = new ResourceSizeEstimator();
  });

  describe('mesh size estimation', () => {
    it('should estimate mesh size from geometry data', () => {
      const mesh = createMockResource('mesh', 4000); // 4000 vertices

      const sizeMB = estimator.estimateSize(mesh);

      expect(sizeMB).toBeGreaterThan(0);
      expect(sizeMB).toBeLessThan(1); // Should be reasonable for test data
    });

    it('should handle mesh without geometry', () => {
      const mesh = { type: 'mesh', id: 'test' };

      const sizeMB = estimator.estimateSize(mesh);

      expect(sizeMB).toBe(0.1); // Default fallback
    });
  });

  describe('texture size estimation', () => {
    it('should estimate texture size from dimensions', () => {
      const texture = createMockResource('texture', 1024); // 32x32 texture

      const sizeMB = estimator.estimateSize(texture);

      expect(sizeMB).toBeGreaterThan(0);
      expect(sizeMB).toBeLessThan(1); // Should be reasonable for test data
    });

    it('should handle texture without size method', () => {
      const texture = { type: 'texture', id: 'test' };

      const sizeMB = estimator.estimateSize(texture);

      expect(sizeMB).toBe(0.1); // Default fallback
    });
  });

  describe('generic resource estimation', () => {
    it('should estimate size from metadata if available', () => {
      const resource = {
        type: 'generic',
        metadata: { estimatedSizeMB: 2.5 },
      };

      const sizeMB = estimator.estimateSize(resource);

      expect(sizeMB).toBe(2.5);
    });

    it('should use default size for unknown resources', () => {
      const resource = { type: 'unknown' };

      const sizeMB = estimator.estimateSize(resource);

      expect(sizeMB).toBe(0.1); // Default fallback
    });
  });

  describe('batch size estimation', () => {
    it('should estimate total size for multiple resources', () => {
      const resources = [
        createMockResource('mesh', 2000),
        createMockResource('texture', 1024),
        { type: 'generic', metadata: { estimatedSizeMB: 1.5 } },
      ];

      const totalSizeMB = estimator.estimateBatchSize(resources);

      expect(totalSizeMB).toBeGreaterThan(1.5); // At least the generic resource
    });
  });
});

describe('MemoryStatisticsCalculator', () => {
  let calculator: MemoryStatisticsCalculator;

  beforeEach(() => {
    calculator = new MemoryStatisticsCalculator();
  });

  describe('efficiency score calculation', () => {
    it('should calculate memory efficiency score', () => {
      const cacheStats = { hitRate: 0.8, totalMemoryMB: 50 };
      const poolStats = { memoryPressure: { level: 'low' as const }, estimatedMemoryMB: 30 };

      const score = calculator.calculateEfficiencyScore(cacheStats, poolStats);

      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should penalize high memory pressure', () => {
      const cacheStats = { hitRate: 0.8, totalMemoryMB: 50 };
      const lowPressureStats = { memoryPressure: { level: 'low' as const }, estimatedMemoryMB: 30 };
      const highPressureStats = {
        memoryPressure: { level: 'critical' as const },
        estimatedMemoryMB: 30,
      };

      const lowScore = calculator.calculateEfficiencyScore(cacheStats, lowPressureStats);
      const highScore = calculator.calculateEfficiencyScore(cacheStats, highPressureStats);

      expect(lowScore).toBeGreaterThan(highScore);
    });

    it('should reward high cache hit rates', () => {
      const lowHitStats = { hitRate: 0.3, totalMemoryMB: 50 };
      const highHitStats = { hitRate: 0.9, totalMemoryMB: 50 };
      const poolStats = { memoryPressure: { level: 'low' as const }, estimatedMemoryMB: 30 };

      const lowScore = calculator.calculateEfficiencyScore(lowHitStats, poolStats);
      const highScore = calculator.calculateEfficiencyScore(highHitStats, poolStats);

      expect(highScore).toBeGreaterThan(lowScore);
    });
  });

  describe('memory recommendations', () => {
    it('should generate recommendations for critical pressure', () => {
      const cacheStats = { hitRate: 0.8, totalMemoryMB: 50 };
      const poolStats = {
        memoryPressure: { level: 'critical' as const },
        pooledResources: 50,
        estimatedMemoryMB: 100,
      };

      const recommendations = calculator.generateRecommendations(cacheStats, poolStats);

      expect(recommendations).toContain('Immediate cleanup required - memory pressure critical');
    });

    it('should recommend cache optimization for low hit rates', () => {
      const cacheStats = { hitRate: 0.3, totalMemoryMB: 50 };
      const poolStats = {
        memoryPressure: { level: 'low' as const },
        pooledResources: 20,
        estimatedMemoryMB: 30,
      };

      const recommendations = calculator.generateRecommendations(cacheStats, poolStats);

      expect(recommendations).toContain('Optimize cache strategy - low hit rate detected');
    });

    it('should recommend pool size reduction for high resource counts', () => {
      const cacheStats = { hitRate: 0.8, totalMemoryMB: 50 };
      const poolStats = {
        memoryPressure: { level: 'low' as const },
        pooledResources: 100,
        estimatedMemoryMB: 30,
      };

      const recommendations = calculator.generateRecommendations(cacheStats, poolStats);

      expect(recommendations).toContain('Consider reducing pool size - high resource count');
    });
  });
});

describe('MemoryMonitor', () => {
  let monitor: MemoryMonitor;

  beforeEach(() => {
    monitor = new MemoryMonitor();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('real-time monitoring', () => {
    it('should track memory usage over time', () => {
      mockPerformanceMemory(100, 200);

      const snapshot1 = monitor.takeSnapshot();

      mockPerformanceMemory(150, 200);

      const snapshot2 = monitor.takeSnapshot();

      expect(snapshot1.usagePercentage).toBeCloseTo(50, 1);
      expect(snapshot2.usagePercentage).toBeCloseTo(75, 1);
    });

    it('should calculate memory usage trends', () => {
      mockPerformanceMemory(100, 200);
      monitor.takeSnapshot();

      mockPerformanceMemory(120, 200);
      monitor.takeSnapshot();

      mockPerformanceMemory(140, 200);
      monitor.takeSnapshot();

      const trend = monitor.getUsageTrend();
      expect(trend).toBe('increasing');
    });

    it('should detect memory leaks', () => {
      // Simulate increasing memory usage
      for (let i = 0; i < 5; i++) {
        mockPerformanceMemory(100 + i * 20, 200);
        monitor.takeSnapshot();
      }

      const leakDetected = monitor.detectMemoryLeak();
      expect(leakDetected).toBe(true);
    });
  });
});

describe('ResourceLifecycleManager', () => {
  let manager: ResourceLifecycleManager;

  beforeEach(() => {
    manager = new ResourceLifecycleManager();
  });

  describe('resource tracking', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should track resource creation and disposal', () => {
      const resource = createMockResource('mesh');

      manager.trackResource(resource);
      expect(manager.getTrackedResourceCount()).toBe(1);

      manager.disposeResource(resource.id);
      expect(manager.getTrackedResourceCount()).toBe(0);
    });

    it('should identify resources for cleanup', () => {
      const oldResource = createMockResource('mesh');
      const newResource = createMockResource('texture');

      manager.trackResource(oldResource);

      // Simulate time passing
      vi.advanceTimersByTime(10000);

      manager.trackResource(newResource);

      const candidates = manager.getCleanupCandidates(5000); // 5 second threshold
      expect(candidates).toContain(oldResource.id);
      expect(candidates).not.toContain(newResource.id);
    });
  });
});

describe('utility functions', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('detectMemoryPressure', () => {
    it('should detect memory pressure using standalone function', () => {
      mockPerformanceMemory(160, 200);

      const pressure = detectMemoryPressure();

      expect(pressure.level).toBe('high');
      expect(pressure.usagePercentage).toBeCloseTo(80, 1);
    });
  });

  describe('estimateResourceSize', () => {
    it('should estimate resource size using standalone function', () => {
      const resource = createMockResource('mesh', 2000);

      const sizeMB = estimateResourceSize(resource);

      expect(sizeMB).toBeGreaterThan(0);
    });
  });

  describe('calculateMemoryEfficiencyScore', () => {
    it('should calculate efficiency score using standalone function', () => {
      const cacheStats = { hitRate: 0.8, totalMemoryMB: 50 };
      const poolStats = { memoryPressure: { level: 'low' as const }, estimatedMemoryMB: 30 };

      const score = calculateMemoryEfficiencyScore(cacheStats, poolStats);

      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  describe('generateMemoryRecommendations', () => {
    it('should generate recommendations using standalone function', () => {
      const cacheStats = { hitRate: 0.3, totalMemoryMB: 50 };
      const poolStats = {
        memoryPressure: { level: 'high' as const },
        pooledResources: 100,
        estimatedMemoryMB: 80,
      };

      const recommendations = generateMemoryRecommendations(cacheStats, poolStats);

      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBeGreaterThan(0);
    });
  });
});
