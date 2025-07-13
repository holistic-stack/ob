/**
 * @file Performance Monitor
 * @description Real-time performance monitoring for Manifold pipeline operations
 * Following project guidelines: Result<T,E> patterns, functional programming, comprehensive logging
 */

import type { Result } from '../../../../../shared/types/result.types';
import { logger } from '../../../../../shared/services/logger.service';

/**
 * Performance metrics for pipeline operations
 */
export interface PerformanceMetrics {
  readonly operationId: string;
  readonly operationType: 'primitive' | 'transformation' | 'csg' | 'pipeline';
  readonly startTime: number;
  readonly endTime: number;
  readonly duration: number;
  readonly nodeCount: number;
  readonly memoryUsage: {
    readonly before: number;
    readonly after: number;
    readonly delta: number;
  };
  readonly success: boolean;
  readonly errorMessage?: string;
}

/**
 * Performance statistics aggregated over time
 */
export interface PerformanceStats {
  readonly totalOperations: number;
  readonly successfulOperations: number;
  readonly failedOperations: number;
  readonly averageDuration: number;
  readonly minDuration: number;
  readonly maxDuration: number;
  readonly p95Duration: number;
  readonly p99Duration: number;
  readonly targetViolations: number; // Operations exceeding 16ms
  readonly memoryEfficiency: {
    readonly averageMemoryDelta: number;
    readonly maxMemoryDelta: number;
    readonly totalMemoryAllocated: number;
  };
}

/**
 * Performance monitoring configuration
 */
export interface PerformanceConfig {
  readonly targetDuration: number; // Target duration in milliseconds (default: 16ms)
  readonly maxHistorySize: number; // Maximum number of metrics to keep in memory
  readonly enableDetailedLogging: boolean;
  readonly enableMemoryTracking: boolean;
}

/**
 * Default performance configuration
 */
const DEFAULT_CONFIG: PerformanceConfig = {
  targetDuration: 16,
  maxHistorySize: 1000,
  enableDetailedLogging: true,
  enableMemoryTracking: true,
} as const;

/**
 * Performance monitor for tracking pipeline operation performance
 * Implements comprehensive performance tracking with <16ms target monitoring
 */
export class PerformanceMonitor {
  private readonly config: PerformanceConfig;
  private readonly metrics: PerformanceMetrics[] = [];
  private readonly activeOperations = new Map<string, {
    readonly startTime: number;
    readonly operationType: PerformanceMetrics['operationType'];
    readonly nodeCount: number;
    readonly memoryBefore: number;
  }>();

  constructor(config: Partial<PerformanceConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    if (this.config.enableDetailedLogging) {
      logger.init('[INIT][PerformanceMonitor] Performance monitoring initialized');
      logger.debug(`[DEBUG][PerformanceMonitor] Target duration: ${this.config.targetDuration}ms`);
    }
  }

  /**
   * Start tracking a performance operation
   * @param operationId Unique identifier for the operation
   * @param operationType Type of operation being tracked
   * @param nodeCount Number of nodes being processed
   * @returns Result indicating success or failure
   */
  startOperation(
    operationId: string,
    operationType: PerformanceMetrics['operationType'],
    nodeCount: number = 1
  ): Result<void, string> {
    try {
      if (this.activeOperations.has(operationId)) {
        const error = `Operation ${operationId} is already being tracked`;
        logger.warn(`[WARN][PerformanceMonitor] ${error}`);
        return { success: false, error };
      }

      const startTime = performance.now();
      const memoryBefore = this.config.enableMemoryTracking ? this.getMemoryUsage() : 0;

      this.activeOperations.set(operationId, {
        startTime,
        operationType,
        nodeCount,
        memoryBefore,
      });

      if (this.config.enableDetailedLogging) {
        logger.debug(`[DEBUG][PerformanceMonitor] Started tracking ${operationType} operation: ${operationId}`);
      }

      return { success: true, data: undefined };
    } catch (error) {
      const errorMessage = `Failed to start operation tracking: ${error}`;
      logger.error(`[ERROR][PerformanceMonitor] ${errorMessage}`);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * End tracking a performance operation
   * @param operationId Unique identifier for the operation
   * @param success Whether the operation succeeded
   * @param errorMessage Optional error message if operation failed
   * @returns Result containing the performance metrics
   */
  endOperation(
    operationId: string,
    success: boolean,
    errorMessage?: string
  ): Result<PerformanceMetrics, string> {
    try {
      const activeOperation = this.activeOperations.get(operationId);
      if (!activeOperation) {
        const error = `Operation ${operationId} is not being tracked`;
        logger.warn(`[WARN][PerformanceMonitor] ${error}`);
        return { success: false, error };
      }

      const endTime = performance.now();
      const duration = endTime - activeOperation.startTime;
      const memoryAfter = this.config.enableMemoryTracking ? this.getMemoryUsage() : 0;

      const metrics: PerformanceMetrics = {
        operationId,
        operationType: activeOperation.operationType,
        startTime: activeOperation.startTime,
        endTime,
        duration,
        nodeCount: activeOperation.nodeCount,
        memoryUsage: {
          before: activeOperation.memoryBefore,
          after: memoryAfter,
          delta: memoryAfter - activeOperation.memoryBefore,
        },
        success,
        errorMessage,
      };

      // Add to metrics history
      this.addMetrics(metrics);

      // Remove from active operations
      this.activeOperations.delete(operationId);

      // Log performance information
      this.logPerformanceMetrics(metrics);

      return { success: true, data: metrics };
    } catch (error) {
      const errorMessage = `Failed to end operation tracking: ${error}`;
      logger.error(`[ERROR][PerformanceMonitor] ${errorMessage}`);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Get current performance statistics
   * @returns Performance statistics aggregated from all tracked operations
   */
  getStats(): PerformanceStats {
    if (this.metrics.length === 0) {
      return {
        totalOperations: 0,
        successfulOperations: 0,
        failedOperations: 0,
        averageDuration: 0,
        minDuration: 0,
        maxDuration: 0,
        p95Duration: 0,
        p99Duration: 0,
        targetViolations: 0,
        memoryEfficiency: {
          averageMemoryDelta: 0,
          maxMemoryDelta: 0,
          totalMemoryAllocated: 0,
        },
      };
    }

    const successfulMetrics = this.metrics.filter(m => m.success);
    const durations = this.metrics.map(m => m.duration).sort((a, b) => a - b);
    const memoryDeltas = this.metrics.map(m => m.memoryUsage.delta);

    return {
      totalOperations: this.metrics.length,
      successfulOperations: successfulMetrics.length,
      failedOperations: this.metrics.length - successfulMetrics.length,
      averageDuration: durations.reduce((sum, d) => sum + d, 0) / durations.length,
      minDuration: durations[0] || 0,
      maxDuration: durations[durations.length - 1] || 0,
      p95Duration: durations[Math.floor(durations.length * 0.95)] || 0,
      p99Duration: durations[Math.floor(durations.length * 0.99)] || 0,
      targetViolations: durations.filter(d => d > this.config.targetDuration).length,
      memoryEfficiency: {
        averageMemoryDelta: memoryDeltas.reduce((sum, d) => sum + d, 0) / memoryDeltas.length,
        maxMemoryDelta: Math.max(...memoryDeltas),
        totalMemoryAllocated: memoryDeltas.filter(d => d > 0).reduce((sum, d) => sum + d, 0),
      },
    };
  }

  /**
   * Clear all performance metrics
   */
  clearMetrics(): void {
    this.metrics.length = 0;
    logger.debug('[DEBUG][PerformanceMonitor] Performance metrics cleared');
  }

  /**
   * Get recent performance metrics
   * @param count Number of recent metrics to return
   * @returns Array of recent performance metrics
   */
  getRecentMetrics(count: number = 10): readonly PerformanceMetrics[] {
    return this.metrics.slice(-count);
  }

  /**
   * Check if performance targets are being met
   * @returns True if recent operations are meeting performance targets
   */
  isPerformanceTargetMet(): boolean {
    const recentMetrics = this.getRecentMetrics(10);
    if (recentMetrics.length === 0) return true;

    const recentViolations = recentMetrics.filter(m => m.duration > this.config.targetDuration).length;
    return recentViolations / recentMetrics.length < 0.1; // Allow 10% violation rate
  }

  /**
   * Add metrics to history with size management
   */
  private addMetrics(metrics: PerformanceMetrics): void {
    this.metrics.push(metrics);

    // Maintain maximum history size
    if (this.metrics.length > this.config.maxHistorySize) {
      this.metrics.splice(0, this.metrics.length - this.config.maxHistorySize);
    }
  }

  /**
   * Log performance metrics with appropriate level based on performance
   */
  private logPerformanceMetrics(metrics: PerformanceMetrics): void {
    if (!this.config.enableDetailedLogging) return;

    const isTargetViolation = metrics.duration > this.config.targetDuration;
    const logLevel = isTargetViolation ? 'warn' : 'debug';
    const targetStatus = isTargetViolation ? 'EXCEEDED' : 'MET';

    logger[logLevel](
      `[${logLevel.toUpperCase()}][PerformanceMonitor] ` +
      `${metrics.operationType} operation ${metrics.operationId}: ` +
      `${metrics.duration.toFixed(2)}ms (target: ${this.config.targetDuration}ms) - ${targetStatus}`
    );

    if (this.config.enableMemoryTracking && metrics.memoryUsage.delta !== 0) {
      logger.debug(
        `[DEBUG][PerformanceMonitor] Memory delta: ${metrics.memoryUsage.delta.toFixed(2)}MB`
      );
    }
  }

  /**
   * Get current memory usage in MB
   */
  private getMemoryUsage(): number {
    if (typeof performance !== 'undefined' && 'memory' in performance) {
      // @ts-expect-error - performance.memory is not in standard types but exists in Chrome
      return (performance.memory?.usedJSHeapSize || 0) / 1024 / 1024;
    }
    return 0;
  }
}
