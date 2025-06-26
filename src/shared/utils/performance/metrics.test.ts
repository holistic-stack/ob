/**
 * Performance Utilities Test Suite
 * 
 * Tests for performance monitoring utilities following TDD methodology
 * with comprehensive coverage of all performance functions.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  measureTime,
  measureTimeAsync,
  getMemoryUsage,
  validatePerformance,
  createProfiler,
  createPerformanceBudget
} from './metrics';
import type { PerformanceMetrics, PerformanceThresholds } from '../../types/common.types';

describe('Performance Utilities', () => {
  describe('measureTime', () => {
    it('should measure execution time of synchronous functions', () => {
      const slowFunction = () => {
        // Simulate some work
        let sum = 0;
        for (let i = 0; i < 1000; i++) {
          sum += i;
        }
        return sum;
      };

      const { result, duration } = measureTime(slowFunction);

      expect(result).toBe(499500); // Sum of 0 to 999
      expect(duration).toBeGreaterThan(0);
      expect(typeof duration).toBe('number');
    });

    it('should handle functions that throw errors', () => {
      const errorFunction = () => {
        throw new Error('Test error');
      };

      expect(() => measureTime(errorFunction)).toThrow('Test error');
    });
  });

  describe('measureTimeAsync', () => {
    it('should measure execution time of asynchronous functions', async () => {
      const slowAsyncFunction = async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return 'completed';
      };

      const { result, duration } = await measureTimeAsync(slowAsyncFunction);

      expect(result).toBe('completed');
      expect(duration).toBeGreaterThanOrEqual(10);
      expect(typeof duration).toBe('number');
    });

    it('should handle async functions that reject', async () => {
      const errorAsyncFunction = async () => {
        throw new Error('Async test error');
      };

      await expect(measureTimeAsync(errorAsyncFunction)).rejects.toThrow('Async test error');
    });
  });

  describe('getMemoryUsage', () => {
    it('should return a number for memory usage', () => {
      const memoryUsage = getMemoryUsage();
      
      expect(typeof memoryUsage).toBe('number');
      expect(memoryUsage).toBeGreaterThanOrEqual(0);
    });
  });

  describe('validatePerformance', () => {
    const thresholds: PerformanceThresholds = {
      maxRenderTime: 16,
      maxParseTime: 100,
      maxMemoryUsage: 50,
      minFrameRate: 30
    };

    it('should pass validation when all metrics are within thresholds', () => {
      const metrics: PerformanceMetrics = {
        renderTime: 10,
        parseTime: 50,
        memoryUsage: 25,
        frameRate: 60
      };

      const result = validatePerformance(metrics, thresholds);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(metrics);
      }
    });

    it('should fail validation when metrics exceed thresholds', () => {
      const metrics: PerformanceMetrics = {
        renderTime: 20, // Exceeds 16ms
        parseTime: 150, // Exceeds 100ms
        memoryUsage: 75, // Exceeds 50MB
        frameRate: 20   // Below 30fps
      };

      const result = validatePerformance(metrics, thresholds);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.length).toBe(4);
        expect(result.error[0]).toContain('Render time');
        expect(result.error[1]).toContain('Parse time');
        expect(result.error[2]).toContain('Memory usage');
        expect(result.error[3]).toContain('Frame rate');
      }
    });

    it('should handle partial threshold violations', () => {
      const metrics: PerformanceMetrics = {
        renderTime: 20, // Exceeds threshold
        parseTime: 50,  // Within threshold
        memoryUsage: 25, // Within threshold
        frameRate: 60   // Within threshold
      };

      const result = validatePerformance(metrics, thresholds);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.length).toBe(1);
        expect(result.error[0]).toContain('Render time');
      }
    });
  });

  describe('createProfiler', () => {
    it('should create a profiler and measure operations', () => {
      const profiler = createProfiler('test-profiler');

      const result1 = profiler.measure('operation1', () => {
        let sum = 0;
        for (let i = 0; i < 100; i++) {
          sum += i;
        }
        return sum;
      });

      const result2 = profiler.measure('operation2', () => {
        return 'test';
      });

      expect(result1).toBe(4950);
      expect(result2).toBe('test');

      const report = profiler.getReport();
      expect(report.profilerName).toBe('test-profiler');
      expect(report.totalMeasurements).toBe(2);
      expect(report.measurements).toHaveLength(2);
      expect(report.measurements[0].name).toBe('operation1');
      expect(report.measurements[1].name).toBe('operation2');
      expect(report.summary.totalTime).toBeGreaterThan(0);
      expect(report.summary.averageTime).toBeGreaterThan(0);
    });

    it('should measure async operations', async () => {
      const profiler = createProfiler('async-profiler');

      const result = await profiler.measureAsync('async-operation', async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return 'async-result';
      });

      expect(result).toBe('async-result');

      const report = profiler.getReport();
      expect(report.totalMeasurements).toBe(1);
      expect(report.measurements[0].name).toBe('async-operation');
      expect(report.measurements[0].duration).toBeGreaterThanOrEqual(10);
    });

    it('should clear measurements', () => {
      const profiler = createProfiler('clear-test');

      profiler.measure('operation1', () => 'result1');
      profiler.measure('operation2', () => 'result2');

      expect(profiler.getReport().totalMeasurements).toBe(2);

      profiler.clear();

      expect(profiler.getReport().totalMeasurements).toBe(0);
      expect(profiler.getReport().measurements).toHaveLength(0);
    });

    it('should handle empty profiler report', () => {
      const profiler = createProfiler('empty-profiler');
      const report = profiler.getReport();

      expect(report.totalMeasurements).toBe(0);
      expect(report.summary.totalTime).toBe(0);
      expect(report.summary.averageTime).toBe(0);
      expect(report.summary.slowestOperation.name).toBe('none');
    });
  });

  describe('createPerformanceBudget', () => {
    const thresholds: PerformanceThresholds = {
      maxRenderTime: 16,
      maxParseTime: 100,
      maxMemoryUsage: 50,
      minFrameRate: 30
    };

    let budget: ReturnType<typeof createPerformanceBudget>;

    beforeEach(() => {
      budget = createPerformanceBudget(thresholds);
    });

    it('should check render time within budget', () => {
      expect(budget.checkRenderTime(10)).toBe(true);
      expect(budget.checkRenderTime(16)).toBe(true);
      expect(budget.checkRenderTime(20)).toBe(false);

      const violations = budget.getViolations();
      expect(violations).toHaveLength(1);
      expect(violations[0].metric).toBe('renderTime');
      expect(violations[0].value).toBe(20);
    });

    it('should check parse time within budget', () => {
      expect(budget.checkParseTime(50)).toBe(true);
      expect(budget.checkParseTime(100)).toBe(true);
      expect(budget.checkParseTime(150)).toBe(false);

      const violations = budget.getViolations();
      expect(violations).toHaveLength(1);
      expect(violations[0].metric).toBe('parseTime');
    });

    it('should check memory usage within budget', () => {
      expect(budget.checkMemoryUsage(25)).toBe(true);
      expect(budget.checkMemoryUsage(50)).toBe(true);
      expect(budget.checkMemoryUsage(75)).toBe(false);

      const violations = budget.getViolations();
      expect(violations).toHaveLength(1);
      expect(violations[0].metric).toBe('memoryUsage');
    });

    it('should check frame rate within budget', () => {
      expect(budget.checkFrameRate(60)).toBe(true);
      expect(budget.checkFrameRate(30)).toBe(true);
      expect(budget.checkFrameRate(20)).toBe(false);

      const violations = budget.getViolations();
      expect(violations).toHaveLength(1);
      expect(violations[0].metric).toBe('frameRate');
    });

    it('should track multiple violations', () => {
      budget.checkRenderTime(20);
      budget.checkParseTime(150);
      budget.checkMemoryUsage(75);

      const violations = budget.getViolations();
      expect(violations).toHaveLength(3);

      const report = budget.getReport();
      expect(report.totalViolations).toBe(3);
      expect(report.violationsByMetric.renderTime).toBe(1);
      expect(report.violationsByMetric.parseTime).toBe(1);
      expect(report.violationsByMetric.memoryUsage).toBe(1);
    });

    it('should clear violations', () => {
      budget.checkRenderTime(20);
      budget.checkParseTime(150);

      expect(budget.getViolations()).toHaveLength(2);

      budget.clearViolations();

      expect(budget.getViolations()).toHaveLength(0);
      expect(budget.getReport().totalViolations).toBe(0);
    });
  });
});
