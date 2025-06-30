/**
 * Performance Monitoring Utilities with Enhanced Logging
 *
 * Leverages tslog structured data for comprehensive performance monitoring
 * and optimization in the OpenSCAD 3D visualization application.
 */

import { createLogger } from '../../services/logger.service';
import type { Result } from '../../types/result.types';
import { error, success } from '../functional/result';

const logger = createLogger('PerformanceMonitor');

/**
 * Enhanced performance metrics interface with detailed operation tracking
 */
export interface EnhancedPerformanceMetrics {
  readonly executionTime: number;
  readonly memoryUsage: number;
  readonly timestamp: number;
  readonly operationName: string;
  readonly category: 'render' | 'parse' | 'compute' | 'io' | 'ui';
  readonly metadata?: Record<string, unknown>;
}

/**
 * Performance thresholds for different operation categories
 */
export const PERFORMANCE_THRESHOLDS = {
  render: 16, // 60fps target
  parse: 100, // AST parsing should be under 100ms
  compute: 50, // Matrix operations should be under 50ms
  io: 200, // File operations should be under 200ms
  ui: 100, // UI interactions should be under 100ms
} as const;

/**
 * Performance monitoring class with enhanced logging
 */
export class PerformanceMonitor {
  private metrics: EnhancedPerformanceMetrics[] = [];
  private readonly maxMetrics = 1000; // Keep last 1000 metrics

  /**
   * Measure execution time of a function with enhanced logging
   */
  async measureAsync<T>(
    operationName: string,
    category: EnhancedPerformanceMetrics['category'],
    fn: () => Promise<T>,
    metadata?: Record<string, unknown>
  ): Promise<Result<{ data: T; metrics: EnhancedPerformanceMetrics }, string>> {
    logger.debug(`Starting performance measurement for ${operationName}`);

    const startTime = performance.now();
    const startMemory = this.getMemoryUsage();

    try {
      const result = await fn();
      const endTime = performance.now();
      const endMemory = this.getMemoryUsage();

      const metrics: EnhancedPerformanceMetrics = {
        executionTime: endTime - startTime,
        memoryUsage: endMemory - startMemory,
        timestamp: Date.now(),
        operationName,
        category,
        ...(metadata && { metadata }),
      };

      this.recordMetrics(metrics);
      this.logPerformanceResult(metrics);

      return success({ data: result, metrics });
    } catch (err) {
      const endTime = performance.now();
      const executionTime = endTime - startTime;

      logger.error(`Performance measurement failed for ${operationName}:`, err);
      logger.debug(`Failed operation took ${executionTime.toFixed(2)}ms`);

      return error(
        `Performance measurement failed: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  /**
   * Measure execution time of a synchronous function
   */
  measure<T>(
    operationName: string,
    category: EnhancedPerformanceMetrics['category'],
    fn: () => T,
    metadata?: Record<string, unknown>
  ): Result<{ data: T; metrics: EnhancedPerformanceMetrics }, string> {
    logger.debug(`Starting sync performance measurement for ${operationName}`);

    const startTime = performance.now();
    const startMemory = this.getMemoryUsage();

    try {
      const result = fn();
      const endTime = performance.now();
      const endMemory = this.getMemoryUsage();

      const metrics: EnhancedPerformanceMetrics = {
        executionTime: endTime - startTime,
        memoryUsage: endMemory - startMemory,
        timestamp: Date.now(),
        operationName,
        category,
        ...(metadata && { metadata }),
      };

      this.recordMetrics(metrics);
      this.logPerformanceResult(metrics);

      return success({ data: result, metrics });
    } catch (err) {
      const endTime = performance.now();
      const executionTime = endTime - startTime;

      logger.error(`Sync performance measurement failed for ${operationName}:`, err);
      logger.debug(`Failed operation took ${executionTime.toFixed(2)}ms`);

      return error(
        `Performance measurement failed: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  /**
   * Create a performance decorator for methods
   */
  createDecorator(operationName: string, category: EnhancedPerformanceMetrics['category']) {
    return <T extends (...args: unknown[]) => unknown>(
      target: unknown,
      propertyKey: string,
      descriptor: TypedPropertyDescriptor<T>
    ) => {
      const originalMethod = descriptor.value;
      if (!originalMethod) return;

      descriptor.value = ((...args: unknown[]) => {
        const result = this.measure(
          `${operationName}.${propertyKey}`,
          category,
          () => originalMethod.apply(target, args),
          { args: args.length }
        );

        if (result.success) {
          return result.data.data;
        }
        throw new Error(result.error);
      }) as T;
    };
  }

  /**
   * Get performance summary for a category
   */
  getSummary(category?: EnhancedPerformanceMetrics['category']): {
    count: number;
    averageTime: number;
    minTime: number;
    maxTime: number;
    totalMemoryDelta: number;
    slowOperations: EnhancedPerformanceMetrics[];
  } {
    const filteredMetrics = category
      ? this.metrics.filter((m) => m.category === category)
      : this.metrics;

    if (filteredMetrics.length === 0) {
      return {
        count: 0,
        averageTime: 0,
        minTime: 0,
        maxTime: 0,
        totalMemoryDelta: 0,
        slowOperations: [],
      };
    }

    const executionTimes = filteredMetrics.map((m) => m.executionTime);
    const threshold = category ? PERFORMANCE_THRESHOLDS[category] : 100;

    const summary = {
      count: filteredMetrics.length,
      averageTime: executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length,
      minTime: Math.min(...executionTimes),
      maxTime: Math.max(...executionTimes),
      totalMemoryDelta: filteredMetrics.reduce((sum, m) => sum + m.memoryUsage, 0),
      slowOperations: filteredMetrics.filter((m) => m.executionTime > threshold),
    };

    logger.debug('Performance summary generated:', {
      category: category || 'all',
      ...summary,
    });

    return summary;
  }

  /**
   * Clear all recorded metrics
   */
  clear(): void {
    logger.debug(`Clearing ${this.metrics.length} performance metrics`);
    this.metrics = [];
  }

  /**
   * Get all metrics for analysis
   */
  getAllMetrics(): readonly EnhancedPerformanceMetrics[] {
    return Object.freeze([...this.metrics]);
  }

  /**
   * Record metrics and manage storage
   */
  private recordMetrics(metrics: EnhancedPerformanceMetrics): void {
    this.metrics.push(metrics);

    // Keep only the most recent metrics
    if (this.metrics.length > this.maxMetrics) {
      const removed = this.metrics.splice(0, this.metrics.length - this.maxMetrics);
      logger.debug(`Removed ${removed.length} old performance metrics`);
    }
  }

  /**
   * Log performance results with appropriate level
   */
  private logPerformanceResult(metrics: EnhancedPerformanceMetrics): void {
    const threshold = PERFORMANCE_THRESHOLDS[metrics.category];
    const isSlowOperation = metrics.executionTime > threshold;

    const logData = {
      operation: metrics.operationName,
      category: metrics.category,
      executionTime: `${metrics.executionTime.toFixed(2)}ms`,
      memoryDelta: `${metrics.memoryUsage.toFixed(2)}MB`,
      threshold: `${threshold}ms`,
      metadata: metrics.metadata,
    };

    if (isSlowOperation) {
      logger.warn(`Slow operation detected (>${threshold}ms):`, logData);
    } else {
      logger.debug('Performance measurement completed:', logData);
    }
  }

  /**
   * Get current memory usage (approximation)
   */
  private getMemoryUsage(): number {
    if ('memory' in performance) {
      const memory = (performance as unknown as { memory: { usedJSHeapSize: number } }).memory;
      return memory.usedJSHeapSize / 1024 / 1024; // Convert to MB
    }
    return 0; // Fallback if memory API not available
  }
}

/**
 * Global performance monitor instance
 */
export const performanceMonitor = new PerformanceMonitor();

/**
 * Convenience function for measuring async operations
 */
export const measurePerformance = performanceMonitor.measureAsync.bind(performanceMonitor);

/**
 * Convenience function for measuring sync operations
 */
export const measureSyncPerformance = performanceMonitor.measure.bind(performanceMonitor);

/**
 * Performance decorator for class methods
 */
export const PerformanceDecorator = (
  operationName: string,
  category: EnhancedPerformanceMetrics['category']
) => performanceMonitor.createDecorator(operationName, category);

/**
 * Utility to check if operation meets performance targets
 */
export const meetsPerformanceTarget = (metrics: EnhancedPerformanceMetrics): boolean => {
  const threshold = PERFORMANCE_THRESHOLDS[metrics.category];
  return metrics.executionTime <= threshold;
};
