/**
 * Performance Monitor Test Suite
 *
 * Tests for performance monitoring utilities with tslog integration
 * following TDD methodology with comprehensive coverage.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import {
  type EnhancedPerformanceMetrics,
  measurePerformance,
  measureSyncPerformance,
  meetsPerformanceTarget,
  PERFORMANCE_THRESHOLDS,
  PerformanceMonitor,
  performanceMonitor,
} from './performance-monitor';

describe('Performance Monitor', () => {
  let monitor: PerformanceMonitor;

  beforeEach(() => {
    monitor = new PerformanceMonitor();
  });

  describe('measureAsync', () => {
    it('should measure async operation performance', async () => {
      const asyncOperation = async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return 'test result';
      };

      const result = await monitor.measureAsync('testAsyncOperation', 'compute', asyncOperation, {
        testData: true,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.data).toBe('test result');
        expect(result.data.metrics.operationName).toBe('testAsyncOperation');
        expect(result.data.metrics.category).toBe('compute');
        expect(result.data.metrics.executionTime).toBeGreaterThan(0);
        expect(result.data.metrics.metadata).toEqual({ testData: true });
      }
    });

    it('should handle async operation errors', async () => {
      const failingOperation = async () => {
        throw new Error('Test error');
      };

      const result = await monitor.measureAsync('failingOperation', 'compute', failingOperation);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Performance measurement failed');
      }
    });
  });

  describe('measure', () => {
    it('should measure sync operation performance', () => {
      const syncOperation = () => {
        // Simulate some work
        let result = 0;
        for (let i = 0; i < 1000; i++) {
          result += i;
        }
        return result;
      };

      const result = monitor.measure('testSyncOperation', 'compute', syncOperation, {
        iterations: 1000,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(typeof result.data.data).toBe('number');
        expect(result.data.metrics.operationName).toBe('testSyncOperation');
        expect(result.data.metrics.category).toBe('compute');
        expect(result.data.metrics.executionTime).toBeGreaterThan(0);
        expect(result.data.metrics.metadata).toEqual({ iterations: 1000 });
      }
    });

    it('should handle sync operation errors', () => {
      const failingOperation = () => {
        throw new Error('Sync test error');
      };

      const result = monitor.measure('failingSyncOperation', 'compute', failingOperation);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Performance measurement failed');
      }
    });
  });

  describe('getSummary', () => {
    beforeEach(async () => {
      // Add some test metrics
      await monitor.measureAsync('operation1', 'render', async () => {
        await new Promise((resolve) => setTimeout(resolve, 5));
        return 'result1';
      });

      await monitor.measureAsync('operation2', 'render', async () => {
        await new Promise((resolve) => setTimeout(resolve, 20)); // Slow operation
        return 'result2';
      });

      monitor.measure('operation3', 'compute', () => 'result3');
    });

    it('should provide summary for all operations', () => {
      const summary = monitor.getSummary();

      expect(summary.count).toBe(3);
      expect(summary.averageTime).toBeGreaterThan(0);
      expect(summary.minTime).toBeGreaterThan(0);
      expect(summary.maxTime).toBeGreaterThan(summary.minTime);
      expect(Array.isArray(summary.slowOperations)).toBe(true);
    });

    it('should provide category-specific summary', () => {
      const renderSummary = monitor.getSummary('render');

      expect(renderSummary.count).toBe(2);
      expect(renderSummary.slowOperations.length).toBeGreaterThan(0); // 20ms operation should be slow
    });

    it('should handle empty metrics', () => {
      const emptyMonitor = new PerformanceMonitor();
      const summary = emptyMonitor.getSummary();

      expect(summary.count).toBe(0);
      expect(summary.averageTime).toBe(0);
      expect(summary.slowOperations).toEqual([]);
    });
  });

  describe('clear', () => {
    it('should clear all metrics', async () => {
      await monitor.measureAsync('operation', 'compute', async () => 'result');

      expect(monitor.getAllMetrics().length).toBe(1);

      monitor.clear();

      expect(monitor.getAllMetrics().length).toBe(0);
    });
  });

  describe('getAllMetrics', () => {
    it('should return readonly array of metrics', async () => {
      await monitor.measureAsync('operation', 'compute', async () => 'result');

      const metrics = monitor.getAllMetrics();

      expect(Array.isArray(metrics)).toBe(true);
      expect(metrics.length).toBe(1);
      expect(Object.isFrozen(metrics)).toBe(true);
    });
  });
});

describe('Global Performance Monitor', () => {
  beforeEach(() => {
    performanceMonitor.clear();
  });

  describe('measurePerformance', () => {
    it('should work with global instance', async () => {
      const result = await measurePerformance('globalAsyncTest', 'io', async () => 'global result');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.data).toBe('global result');
      }
    });
  });

  describe('measureSyncPerformance', () => {
    it('should work with global instance', () => {
      const result = measureSyncPerformance('globalSyncTest', 'ui', () => 'sync global result');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.data).toBe('sync global result');
      }
    });
  });
});

describe('Performance Utilities', () => {
  describe('meetsPerformanceTarget', () => {
    it('should return true for operations within threshold', () => {
      const fastMetrics: EnhancedPerformanceMetrics = {
        executionTime: 10,
        memoryUsage: 1,
        timestamp: Date.now(),
        operationName: 'fastOperation',
        category: 'render',
      };

      expect(meetsPerformanceTarget(fastMetrics)).toBe(true);
    });

    it('should return false for operations exceeding threshold', () => {
      const slowMetrics: EnhancedPerformanceMetrics = {
        executionTime: 50,
        memoryUsage: 1,
        timestamp: Date.now(),
        operationName: 'slowOperation',
        category: 'render', // 16ms threshold
      };

      expect(meetsPerformanceTarget(slowMetrics)).toBe(false);
    });
  });

  describe('PERFORMANCE_THRESHOLDS', () => {
    it('should have appropriate thresholds for each category', () => {
      expect(PERFORMANCE_THRESHOLDS.render).toBe(16); // 60fps
      expect(PERFORMANCE_THRESHOLDS.parse).toBe(100);
      expect(PERFORMANCE_THRESHOLDS.compute).toBe(50);
      expect(PERFORMANCE_THRESHOLDS.io).toBe(200);
      expect(PERFORMANCE_THRESHOLDS.ui).toBe(100);
    });
  });
});

describe('Performance Integration', () => {
  beforeEach(() => {
    performanceMonitor.clear();
  });

  it('should track multiple operations and provide insights', async () => {
    // Simulate various operations
    await measurePerformance('parseAST', 'parse', async () => {
      await new Promise((resolve) => setTimeout(resolve, 30));
      return { nodes: 10 };
    });

    await measurePerformance('renderFrame', 'render', async () => {
      await new Promise((resolve) => setTimeout(resolve, 8));
      return { meshes: 5 };
    });

    measureSyncPerformance('matrixMultiply', 'compute', () => {
      // Simulate matrix computation
      return [
        [1, 2],
        [3, 4],
      ];
    });

    const allSummary = performanceMonitor.getSummary();
    const renderSummary = performanceMonitor.getSummary('render');
    const parseSummary = performanceMonitor.getSummary('parse');

    expect(allSummary.count).toBe(3);
    expect(renderSummary.count).toBe(1);
    expect(parseSummary.count).toBe(1);

    // Render operation should meet target (8ms < 16ms)
    const renderMetrics = performanceMonitor.getAllMetrics().find((m) => m.category === 'render');
    expect(renderMetrics).toBeDefined();
    if (renderMetrics) {
      expect(meetsPerformanceTarget(renderMetrics)).toBe(true);
    }
  });
});
