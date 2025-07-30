/**
 * @file performance-monitor.util.ts
 * @description Reusable performance monitoring utilities extracted from existing services.
 * Provides timing measurements, memory monitoring, performance scoring, and statistics calculation
 * to eliminate code duplication and improve reusability across the codebase.
 *
 * @example
 * ```typescript
 * // Timing measurements
 * const timer = createPerformanceTimer();
 * timer.start();
 * await someOperation();
 * const duration = timer.stop();
 *
 * // Memory monitoring
 * const monitor = new MemoryMonitor();
 * const pressure = monitor.getMemoryPressure();
 *
 * // Performance scoring
 * const scorer = new PerformanceScorer();
 * const score = scorer.calculatePerformanceScore(actualTime, targetTime);
 *
 * // Statistics calculation
 * const calculator = new StatisticsCalculator();
 * const hitRate = calculator.calculateHitRate(hits, misses);
 * ```
 *
 * @author OpenSCAD Babylon Team
 * @version 1.0.0
 * @since 2025-07-30
 */

/**
 * Memory pressure levels
 */
export type MemoryPressureLevel = 'low' | 'medium' | 'high' | 'critical' | 'unknown';

/**
 * Memory pressure information
 */
export interface MemoryPressureInfo {
  readonly level: MemoryPressureLevel;
  readonly usagePercentage: number;
  readonly usedMB: number;
  readonly totalMB: number;
  readonly recommendedAction: string;
}

/**
 * Performance metrics for efficiency scoring
 */
export interface PerformanceMetrics {
  readonly hitRate: number;
  readonly memoryPressure: MemoryPressureLevel;
  readonly resourceUtilization: number;
}

/**
 * Execution time measurement result
 */
export interface ExecutionTimeResult<T> {
  readonly result: T;
  readonly executionTime: number;
}

/**
 * High-precision performance timer for measuring execution time
 */
export class PerformanceTimer {
  private startTime: number | null = null;

  /**
   * Start timing measurement
   */
  start(): void {
    this.startTime = performance.now();
  }

  /**
   * Stop timing measurement and return duration
   *
   * @returns Duration in milliseconds
   */
  stop(): number {
    if (this.startTime === null) {
      return 0;
    }

    const duration = performance.now() - this.startTime;
    this.startTime = null;
    return duration;
  }

  /**
   * Get elapsed time without stopping the timer
   *
   * @returns Elapsed time in milliseconds
   */
  elapsed(): number {
    if (this.startTime === null) {
      return 0;
    }

    return performance.now() - this.startTime;
  }

  /**
   * Check if timer is currently running
   *
   * @returns True if timer is running
   */
  isRunning(): boolean {
    return this.startTime !== null;
  }
}

/**
 * Memory monitoring utility for tracking memory usage and pressure
 */
export class MemoryMonitor {
  /**
   * Get current memory usage in MB
   *
   * @returns Memory usage in MB
   */
  getCurrentUsageMB(): number {
    if (typeof performance !== 'undefined' && this.hasMemoryAPI()) {
      const memory = this.getMemoryAPI();
      return memory.usedJSHeapSize / (1024 * 1024);
    }
    return 0;
  }

  /**
   * Get total available memory in MB
   *
   * @returns Total memory in MB
   */
  getTotalMemoryMB(): number {
    if (typeof performance !== 'undefined' && this.hasMemoryAPI()) {
      const memory = this.getMemoryAPI();
      return memory.totalJSHeapSize / (1024 * 1024);
    }
    return 0;
  }

  /**
   * Get memory usage percentage
   *
   * @returns Usage percentage (0-100)
   */
  getUsagePercentage(): number {
    const used = this.getCurrentUsageMB();
    const total = this.getTotalMemoryMB();

    if (total === 0) {
      return 0;
    }

    return (used / total) * 100;
  }

  /**
   * Get current memory pressure information
   *
   * @returns Memory pressure details
   */
  getMemoryPressure(): MemoryPressureInfo {
    if (!this.hasMemoryAPI()) {
      return {
        level: 'unknown',
        usagePercentage: 0,
        usedMB: 0,
        totalMB: 0,
        recommendedAction: 'Memory monitoring not available',
      };
    }

    const usedMB = this.getCurrentUsageMB();
    const totalMB = this.getTotalMemoryMB();
    const usagePercentage = this.getUsagePercentage();

    let level: MemoryPressureLevel;
    let recommendedAction: string;

    if (usagePercentage >= 90) {
      level = 'critical';
      recommendedAction = 'Immediate cleanup required - dispose unused resources';
    } else if (usagePercentage >= 80) {
      level = 'high';
      recommendedAction = 'Perform cleanup - free pooled resources';
    } else if (usagePercentage >= 60) {
      level = 'medium';
      recommendedAction = 'Monitor usage - consider cleanup if needed';
    } else {
      level = 'low';
      recommendedAction = 'Memory usage is healthy';
    }

    return {
      level,
      usagePercentage,
      usedMB,
      totalMB,
      recommendedAction,
    };
  }

  /**
   * Check if performance.memory API is available
   */
  private hasMemoryAPI(): boolean {
    return (
      typeof performance !== 'undefined' &&
      (performance as Performance & { memory?: unknown }).memory !== undefined
    );
  }

  /**
   * Get performance.memory API
   */
  private getMemoryAPI(): {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  } {
    return (
      performance as Performance & {
        memory: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number };
      }
    ).memory;
  }
}

/**
 * Performance scoring utility for calculating performance metrics
 */
export class PerformanceScorer {
  /**
   * Calculate performance score (0-100) based on actual vs target time
   *
   * @param actualTime - Actual execution time
   * @param targetTime - Target execution time
   * @returns Performance score (0-100)
   */
  calculatePerformanceScore(actualTime: number, targetTime: number): number {
    if (actualTime <= targetTime) {
      return 100;
    }

    const ratio = targetTime / actualTime;
    const score = ratio * 100;
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Check if performance meets target
   *
   * @param actualTime - Actual execution time
   * @param targetTime - Target execution time
   * @returns True if performance meets target
   */
  meetsPerformanceTarget(actualTime: number, targetTime: number): boolean {
    return actualTime <= targetTime;
  }

  /**
   * Calculate overall efficiency score from multiple metrics
   *
   * @param metrics - Performance metrics
   * @returns Efficiency score (0-100)
   */
  calculateEfficiencyScore(metrics: PerformanceMetrics): number {
    // Base score from hit rate (0-50 points)
    const hitRateScore = metrics.hitRate * 50;

    // Memory pressure score (0-30 points, inverted)
    const pressureScore =
      metrics.memoryPressure === 'low'
        ? 30
        : metrics.memoryPressure === 'medium'
          ? 20
          : metrics.memoryPressure === 'high'
            ? 10
            : 0;

    // Resource utilization score (0-20 points)
    const utilizationScore = Math.min(20, metrics.resourceUtilization * 20);

    return Math.min(100, hitRateScore + pressureScore + utilizationScore);
  }
}

/**
 * Statistics calculation utility for common statistical operations
 */
export class StatisticsCalculator {
  /**
   * Calculate hit rate from hits and misses
   *
   * @param hits - Number of hits
   * @param misses - Number of misses
   * @returns Hit rate (0-1)
   */
  calculateHitRate(hits: number, misses: number): number {
    const total = hits + misses;
    return total > 0 ? hits / total : 0;
  }

  /**
   * Calculate average time from array of times
   *
   * @param times - Array of time values
   * @returns Average time
   */
  calculateAverageTime(times: readonly number[]): number {
    if (times.length === 0) {
      return 0;
    }

    const sum = times.reduce((acc, time) => acc + time, 0);
    return sum / times.length;
  }

  /**
   * Calculate oldest entry age from timestamps
   *
   * @param timestamps - Array of timestamps
   * @returns Oldest age in milliseconds
   */
  calculateOldestAge(timestamps: readonly number[]): number {
    if (timestamps.length === 0) {
      return 0;
    }

    const now = Date.now();
    const ages = timestamps.map((timestamp) => now - timestamp);
    return Math.max(...ages);
  }

  /**
   * Find most accessed item from array
   *
   * @param items - Array of items with access count property
   * @param accessCountProperty - Property name for access count
   * @returns Most accessed item or null
   */
  findMostAccessed<T extends Record<string, unknown>>(
    items: readonly T[],
    accessCountProperty: keyof T
  ): T | null {
    if (items.length === 0) {
      return null;
    }

    return items.reduce((max, item) => {
      const currentCount = item[accessCountProperty] as number;
      const maxCount = max[accessCountProperty] as number;
      return currentCount > maxCount ? item : max;
    });
  }
}

/**
 * Create a new performance timer instance
 *
 * @returns New PerformanceTimer instance
 */
export function createPerformanceTimer(): PerformanceTimer {
  return new PerformanceTimer();
}

/**
 * Measure execution time of a function
 *
 * @param fn - Function to measure
 * @returns Result and execution time
 */
export async function measureExecutionTime<T>(
  fn: () => T | Promise<T>
): Promise<ExecutionTimeResult<T>> {
  const timer = createPerformanceTimer();
  timer.start();
  const result = await fn();
  const executionTime = timer.stop();

  return {
    result,
    executionTime,
  };
}

/**
 * Calculate hit rate from hits and misses (standalone utility)
 *
 * @param hits - Number of hits
 * @param misses - Number of misses
 * @returns Hit rate (0-1)
 */
export function calculateHitRate(hits: number, misses: number): number {
  const calculator = new StatisticsCalculator();
  return calculator.calculateHitRate(hits, misses);
}

/**
 * Calculate average time from array of times (standalone utility)
 *
 * @param times - Array of time values
 * @returns Average time
 */
export function calculateAverageTime(times: readonly number[]): number {
  const calculator = new StatisticsCalculator();
  return calculator.calculateAverageTime(times);
}

/**
 * Calculate memory efficiency score (standalone utility)
 *
 * @param hitRate - Cache hit rate (0-1)
 * @param memoryPressure - Memory pressure level
 * @param resourceUtilization - Resource utilization (0-1)
 * @returns Efficiency score (0-100)
 */
export function calculateMemoryEfficiencyScore(
  hitRate: number,
  memoryPressure: MemoryPressureLevel,
  resourceUtilization: number
): number {
  const scorer = new PerformanceScorer();
  return scorer.calculateEfficiencyScore({
    hitRate,
    memoryPressure,
    resourceUtilization,
  });
}
