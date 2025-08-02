/**
 * @file performance-monitor.util.test.ts
 * @description Tests for reusable performance monitoring utilities following TDD methodology.
 * Tests timing measurements, memory monitoring, performance scoring, and statistics calculation.
 *
 * @author OpenSCAD Babylon Team
 * @version 1.0.0
 * @since 2025-07-30
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  calculateAverageTime,
  calculateHitRate,
  calculateMemoryEfficiencyScore,
  createPerformanceTimer,
  MemoryMonitor,
  measureExecutionTime,
  PerformanceScorer,
  PerformanceTimer,
  StatisticsCalculator,
} from './performance-monitor.util';

describe('PerformanceTimer', () => {
  let timer: PerformanceTimer;
  let currentTime: number;

  beforeEach(() => {
    timer = new PerformanceTimer();
    currentTime = 0;

    // Mock performance.now() using vi.spyOn
    vi.spyOn(performance, 'now').mockImplementation(() => currentTime);

    // Helper to advance mock time
    (global as any).advanceMockTime = (ms: number) => {
      currentTime += ms;
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('timing measurements', () => {
    it('should measure execution time accurately', () => {
      timer.start();
      (global as any).advanceMockTime(100);
      const duration = timer.stop();

      expect(duration).toBeCloseTo(100, 1);
    });

    it('should handle multiple start/stop cycles', () => {
      timer.start();
      (global as any).advanceMockTime(50);
      const duration1 = timer.stop();

      timer.start();
      (global as any).advanceMockTime(75);
      const duration2 = timer.stop();

      expect(duration1).toBeCloseTo(50, 1);
      expect(duration2).toBeCloseTo(75, 1);
    });

    it('should return elapsed time without stopping', () => {
      timer.start();
      (global as any).advanceMockTime(30);
      const elapsed = timer.elapsed();

      expect(elapsed).toBeCloseTo(30, 1);
      expect(timer.isRunning()).toBe(true);
    });

    it('should track running state correctly', () => {
      expect(timer.isRunning()).toBe(false);

      timer.start();
      expect(timer.isRunning()).toBe(true);

      timer.stop();
      expect(timer.isRunning()).toBe(false);
    });

    it('should handle stop without start gracefully', () => {
      const duration = timer.stop();
      expect(duration).toBe(0);
    });

    it('should handle multiple starts without stop', () => {
      timer.start();
      (global as any).advanceMockTime(50);

      timer.start(); // Should reset the timer
      (global as any).advanceMockTime(25);
      const duration = timer.stop();

      expect(duration).toBeCloseTo(25, 1);
    });
  });
});

describe('MemoryMonitor', () => {
  let monitor: MemoryMonitor;

  beforeEach(() => {
    monitor = new MemoryMonitor();

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

  describe('memory usage monitoring', () => {
    it('should get current memory usage in MB', () => {
      const usage = monitor.getCurrentUsageMB();
      expect(usage).toBeCloseTo(50, 1);
    });

    it('should get total memory in MB', () => {
      const total = monitor.getTotalMemoryMB();
      expect(total).toBeCloseTo(100, 1);
    });

    it('should calculate memory usage percentage', () => {
      const percentage = monitor.getUsagePercentage();
      expect(percentage).toBeCloseTo(50, 1);
    });

    it('should determine memory pressure level', () => {
      // Test low pressure (50% usage)
      let pressure = monitor.getMemoryPressure();
      expect(pressure.level).toBe('low');

      // Test medium pressure (70% usage)
      Object.defineProperty(performance, 'memory', {
        value: {
          usedJSHeapSize: 70 * 1024 * 1024,
          totalJSHeapSize: 100 * 1024 * 1024,
          jsHeapSizeLimit: 2 * 1024 * 1024 * 1024,
        },
        configurable: true,
      });
      monitor = new MemoryMonitor();
      pressure = monitor.getMemoryPressure();
      expect(pressure.level).toBe('medium');

      // Test high pressure (85% usage)
      Object.defineProperty(performance, 'memory', {
        value: {
          usedJSHeapSize: 85 * 1024 * 1024,
          totalJSHeapSize: 100 * 1024 * 1024,
          jsHeapSizeLimit: 2 * 1024 * 1024 * 1024,
        },
        configurable: true,
      });
      monitor = new MemoryMonitor();
      pressure = monitor.getMemoryPressure();
      expect(pressure.level).toBe('high');

      // Test critical pressure (95% usage)
      Object.defineProperty(performance, 'memory', {
        value: {
          usedJSHeapSize: 95 * 1024 * 1024,
          totalJSHeapSize: 100 * 1024 * 1024,
          jsHeapSizeLimit: 2 * 1024 * 1024 * 1024,
        },
        configurable: true,
      });
      monitor = new MemoryMonitor();
      pressure = monitor.getMemoryPressure();
      expect(pressure.level).toBe('critical');
    });

    it('should handle missing performance.memory gracefully', () => {
      // Mock a performance object without memory property
      const originalPerformance = global.performance;
      // @ts-expect-error - Testing performance without memory
      // noinspection JSConstantReassignment
      global.performance = { now: performance.now };

      monitor = new MemoryMonitor();
      const usage = monitor.getCurrentUsageMB();
      const pressure = monitor.getMemoryPressure();

      expect(usage).toBe(0);
      expect(pressure.level).toBe('unknown');
      expect(pressure.recommendedAction).toContain('not available');

      // Restore original performance
      // noinspection JSConstantReassignment
      global.performance = originalPerformance;
    });
  });
});

describe('PerformanceScorer', () => {
  let scorer: PerformanceScorer;

  beforeEach(() => {
    scorer = new PerformanceScorer();
  });

  describe('performance scoring', () => {
    it('should calculate performance score correctly', () => {
      // Perfect performance (actual <= target)
      expect(scorer.calculatePerformanceScore(10, 16)).toBe(100);
      expect(scorer.calculatePerformanceScore(16, 16)).toBe(100);

      // Suboptimal performance
      expect(scorer.calculatePerformanceScore(32, 16)).toBe(50);
      expect(scorer.calculatePerformanceScore(24, 16)).toBeCloseTo(66.67, 1);

      // Very poor performance
      expect(scorer.calculatePerformanceScore(1000, 16)).toBeCloseTo(1.6, 1);
    });

    it('should check if performance meets target', () => {
      expect(scorer.meetsPerformanceTarget(10, 16)).toBe(true);
      expect(scorer.meetsPerformanceTarget(16, 16)).toBe(true);
      expect(scorer.meetsPerformanceTarget(20, 16)).toBe(false);
    });

    it('should calculate efficiency score from multiple metrics', () => {
      const metrics = {
        hitRate: 0.8, // 80% hit rate
        memoryPressure: 'low' as const,
        resourceUtilization: 0.6, // 60% utilization
      };

      const score = scorer.calculateEfficiencyScore(metrics);
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });
});

describe('StatisticsCalculator', () => {
  let calculator: StatisticsCalculator;

  beforeEach(() => {
    calculator = new StatisticsCalculator();
  });

  describe('statistics calculation', () => {
    it('should calculate hit rate correctly', () => {
      expect(calculator.calculateHitRate(80, 20)).toBeCloseTo(0.8, 2);
      expect(calculator.calculateHitRate(0, 0)).toBe(0);
      expect(calculator.calculateHitRate(10, 0)).toBe(1);
    });

    it('should calculate average time correctly', () => {
      const times = [10, 20, 30, 40, 50];
      expect(calculator.calculateAverageTime(times)).toBe(30);
      expect(calculator.calculateAverageTime([])).toBe(0);
    });

    it('should calculate oldest entry age correctly', () => {
      const now = Date.now();
      const timestamps = [
        now - 5000, // 5 seconds ago
        now - 10000, // 10 seconds ago
        now - 2000, // 2 seconds ago
      ];

      const oldestAge = calculator.calculateOldestAge(timestamps);
      expect(oldestAge).toBeCloseTo(10000, 100);
    });

    it('should find most accessed item correctly', () => {
      const items = [
        { key: 'item1', accessCount: 5 },
        { key: 'item2', accessCount: 10 },
        { key: 'item3', accessCount: 3 },
      ];

      const mostAccessed = calculator.findMostAccessed(items, 'accessCount');
      expect(mostAccessed?.key).toBe('item2');
    });

    it('should handle empty arrays gracefully', () => {
      expect(calculator.calculateAverageTime([])).toBe(0);
      expect(calculator.calculateOldestAge([])).toBe(0);
      expect(calculator.findMostAccessed([], 'accessCount')).toBeNull();
    });
  });
});

describe('utility functions', () => {
  let currentTime: number;

  beforeEach(() => {
    currentTime = 0;

    // Mock performance.now() using vi.spyOn
    vi.spyOn(performance, 'now').mockImplementation(() => currentTime);

    // Helper to advance mock time
    (global as any).advanceMockTime = (ms: number) => {
      currentTime += ms;
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createPerformanceTimer', () => {
    it('should create a new timer instance', () => {
      const timer = createPerformanceTimer();
      expect(timer).toBeInstanceOf(PerformanceTimer);
    });
  });

  describe('measureExecutionTime', () => {
    it('should measure sync function execution time', async () => {
      const syncFn = () => {
        (global as any).advanceMockTime(50);
        return 'result';
      };

      const { result, executionTime } = await measureExecutionTime(syncFn);

      expect(result).toBe('result');
      expect(executionTime).toBeCloseTo(50, 1);
    });

    it('should measure async function execution time', async () => {
      const asyncFn = async () => {
        (global as any).advanceMockTime(75);
        return 'async result';
      };

      const { result, executionTime } = await measureExecutionTime(asyncFn);

      expect(result).toBe('async result');
      expect(executionTime).toBeCloseTo(75, 1);
    });
  });

  describe('standalone utility functions', () => {
    it('should calculate hit rate correctly', () => {
      expect(calculateHitRate(80, 20)).toBeCloseTo(0.8, 2);
      expect(calculateHitRate(0, 0)).toBe(0);
    });

    it('should calculate average time correctly', () => {
      expect(calculateAverageTime([10, 20, 30])).toBe(20);
      expect(calculateAverageTime([])).toBe(0);
    });

    it('should calculate memory efficiency score', () => {
      const score = calculateMemoryEfficiencyScore(0.8, 'low', 0.6);
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });
});
