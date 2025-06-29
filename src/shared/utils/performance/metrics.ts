/**
 * Performance Monitoring Utilities
 * 
 * Pure functional utilities for measuring and monitoring application
 * performance following functional programming patterns.
 */

import type { PerformanceMetrics, PerformanceThresholds } from '../../types/common.types';
import type { Result } from '../../types/result.types';
import { success, error } from '../functional/result';

/**
 * Performance measurement utilities
 */
export const measureTime = <T>(fn: () => T): { result: T; duration: number } => {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  return { result, duration: end - start };
};

export const measureTimeAsync = async <T>(fn: () => Promise<T>): Promise<{ result: T; duration: number }> => {
  const start = performance.now();
  const result = await fn();
  const end = performance.now();
  return { result, duration: end - start };
};

/**
 * Memory usage monitoring
 */
export const getMemoryUsage = (): number => {
  if ('memory' in performance) {
    return (performance as unknown as { memory: { usedJSHeapSize: number } }).memory.usedJSHeapSize / (1024 * 1024); // MB
  }
  return 0; // Not available in all browsers
};

/**
 * Frame rate monitoring
 */
export const createFrameRateMonitor = () => {
  let frames = 0;
  let lastTime = performance.now();
  let frameRate = 0;

  const update = () => {
    frames++;
    const currentTime = performance.now();
    
    if (currentTime - lastTime >= 1000) {
      frameRate = Math.round((frames * 1000) / (currentTime - lastTime));
      frames = 0;
      lastTime = currentTime;
    }
    
    requestAnimationFrame(update);
  };

  update();

  return {
    getFrameRate: () => frameRate,
    stop: () => {
      // Frame rate monitoring will stop when update is no longer called
    }
  };
};

/**
 * Performance threshold validation
 */
export const validatePerformance = (
  metrics: PerformanceMetrics,
  thresholds: PerformanceThresholds
): Result<PerformanceMetrics, ReadonlyArray<string>> => {
  const violations: string[] = [];

  if (metrics.renderTime > thresholds.maxRenderTime) {
    violations.push(`Render time ${metrics.renderTime.toFixed(2)}ms exceeds threshold ${thresholds.maxRenderTime}ms`);
  }

  if (metrics.parseTime > thresholds.maxParseTime) {
    violations.push(`Parse time ${metrics.parseTime.toFixed(2)}ms exceeds threshold ${thresholds.maxParseTime}ms`);
  }

  if (metrics.memoryUsage > thresholds.maxMemoryUsage) {
    violations.push(`Memory usage ${metrics.memoryUsage.toFixed(2)}MB exceeds threshold ${thresholds.maxMemoryUsage}MB`);
  }

  if (metrics.frameRate < thresholds.minFrameRate) {
    violations.push(`Frame rate ${metrics.frameRate}fps below threshold ${thresholds.minFrameRate}fps`);
  }

  if (violations.length > 0) {
    return error(Object.freeze(violations));
  }

  return success(metrics);
};

/**
 * Performance profiler for function execution
 */
export const createProfiler = (name: string) => {
  const measurements: Array<{ name: string; duration: number; timestamp: number }> = [];

  return {
    measure: <T>(operationName: string, fn: () => T): T => {
      const { result, duration } = measureTime(fn);
      measurements.push({
        name: operationName,
        duration,
        timestamp: Date.now()
      });
      return result;
    },

    measureAsync: async <T>(operationName: string, fn: () => Promise<T>): Promise<T> => {
      const { result, duration } = await measureTimeAsync(fn);
      measurements.push({
        name: operationName,
        duration,
        timestamp: Date.now()
      });
      return result;
    },

    getReport: () => ({
      profilerName: name,
      totalMeasurements: measurements.length,
      measurements: Object.freeze([...measurements]),
      summary: {
        totalTime: measurements.reduce((sum, m) => sum + m.duration, 0),
        averageTime: measurements.length > 0 
          ? measurements.reduce((sum, m) => sum + m.duration, 0) / measurements.length 
          : 0,
        slowestOperation: measurements.reduce((slowest, current) => 
          current.duration > slowest.duration ? current : slowest, 
          measurements[0] || { name: 'none', duration: 0, timestamp: 0 }
        )
      }
    }),

    clear: () => {
      measurements.length = 0;
    }
  };
};

/**
 * Debounced performance monitoring
 */
export const createDebouncedMonitor = (
  callback: (metrics: PerformanceMetrics) => void,
  intervalMs = 1000
) => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  const frameRateMonitor = createFrameRateMonitor();

  const collectMetrics = (): PerformanceMetrics => ({
    renderTime: 0, // Will be set by specific render operations
    parseTime: 0,  // Will be set by specific parse operations
    memoryUsage: getMemoryUsage(),
    frameRate: frameRateMonitor.getFrameRate()
  });

  const scheduleUpdate = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      const metrics = collectMetrics();
      callback(metrics);
      scheduleUpdate(); // Continue monitoring
    }, intervalMs);
  };

  return {
    start: () => {
      scheduleUpdate();
    },

    stop: () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      frameRateMonitor.stop();
    },

    updateRenderTime: (_renderTime: number) => {
      // This would be called by render operations to update the metric
    },

    updateParseTime: (_parseTime: number) => {
      // This would be called by parse operations to update the metric
    }
  };
};

/**
 * Performance budget utilities
 */
export const createPerformanceBudget = (thresholds: PerformanceThresholds) => {
  const violations: Array<{ metric: string; value: number; threshold: number; timestamp: number }> = [];

  return {
    checkRenderTime: (duration: number): boolean => {
      const withinBudget = duration <= thresholds.maxRenderTime;
      if (!withinBudget) {
        violations.push({
          metric: 'renderTime',
          value: duration,
          threshold: thresholds.maxRenderTime,
          timestamp: Date.now()
        });
      }
      return withinBudget;
    },

    checkParseTime: (duration: number): boolean => {
      const withinBudget = duration <= thresholds.maxParseTime;
      if (!withinBudget) {
        violations.push({
          metric: 'parseTime',
          value: duration,
          threshold: thresholds.maxParseTime,
          timestamp: Date.now()
        });
      }
      return withinBudget;
    },

    checkMemoryUsage: (usage: number): boolean => {
      const withinBudget = usage <= thresholds.maxMemoryUsage;
      if (!withinBudget) {
        violations.push({
          metric: 'memoryUsage',
          value: usage,
          threshold: thresholds.maxMemoryUsage,
          timestamp: Date.now()
        });
      }
      return withinBudget;
    },

    checkFrameRate: (frameRate: number): boolean => {
      const withinBudget = frameRate >= thresholds.minFrameRate;
      if (!withinBudget) {
        violations.push({
          metric: 'frameRate',
          value: frameRate,
          threshold: thresholds.minFrameRate,
          timestamp: Date.now()
        });
      }
      return withinBudget;
    },

    getViolations: () => Object.freeze([...violations]),

    clearViolations: () => {
      violations.length = 0;
    },

    getReport: () => ({
      totalViolations: violations.length,
      violationsByMetric: violations.reduce((acc, violation) => {
        acc[violation.metric] = (acc[violation.metric] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      recentViolations: violations.slice(-10) // Last 10 violations
    })
  };
};

/**
 * WebGL performance monitoring
 */
export const createWebGLMonitor = (gl: WebGLRenderingContext | WebGL2RenderingContext) => {
  return {
    getDrawCalls: () => {
      // This would require WebGL extensions or manual tracking
      return 0;
    },

    getTextureMemory: () => {
      // Estimate based on texture count and sizes
      return 0;
    },

    getBufferMemory: () => {
      // Estimate based on buffer sizes
      return 0;
    },

    checkWebGL2Support: () => {
      return gl instanceof WebGL2RenderingContext;
    },

    getMaxTextureSize: () => {
      return gl.getParameter(gl.MAX_TEXTURE_SIZE);
    },

    getMaxViewportDims: () => {
      return gl.getParameter(gl.MAX_VIEWPORT_DIMS);
    }
  };
};
