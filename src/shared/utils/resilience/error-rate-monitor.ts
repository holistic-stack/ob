/**
 * Error Rate Monitor
 *
 * Monitors error rates and converts TransientFailure errors to logged warnings
 * when error rate drops below specified thresholds to improve system resilience.
 */

import { createLogger } from '../../services/logger.service.js';

const logger = createLogger('ErrorRateMonitor');

/**
 * Error rate monitoring configuration
 */
export interface ErrorRateConfig {
  readonly windowSizeMs?: number;
  readonly errorThreshold?: number; // Percentage (0-100)
  readonly minSampleSize?: number;
  readonly warningThreshold?: number; // Percentage (0-100)
  readonly enableAutoRecovery?: boolean;
}

/**
 * Error event for tracking
 */
interface ErrorEvent {
  readonly timestamp: number;
  readonly operationType: string;
  readonly isTransient: boolean;
  readonly errorType: string;
  readonly severity: 'error' | 'warning' | 'info';
}

/**
 * Operation statistics
 */
interface OperationStats {
  readonly totalOperations: number;
  readonly errorCount: number;
  readonly transientErrorCount: number;
  readonly errorRate: number;
  readonly transientErrorRate: number;
  readonly lastUpdateTime: number;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: Required<ErrorRateConfig> = {
  windowSizeMs: 300000, // 5 minutes
  errorThreshold: 20, // 20%
  minSampleSize: 10,
  warningThreshold: 10, // 10%
  enableAutoRecovery: true,
};

/**
 * Error Rate Monitor for tracking and managing error thresholds
 */
export class ErrorRateMonitor {
  private readonly config: Required<ErrorRateConfig>;
  private readonly errorEvents: ErrorEvent[] = [];
  private readonly operationCounts = new Map<
    string,
    { total: number; errors: number; transientErrors: number }
  >();
  private readonly lastCleanup = { timestamp: Date.now() };

  constructor(config: ErrorRateConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    logger.init(`Initializing error rate monitor with ${this.config.errorThreshold}% threshold`);

    // Start periodic cleanup
    this.startPeriodicCleanup();
  }

  /**
   * Record an operation attempt
   */
  recordOperation(operationType: string, success: boolean, error?: Error): void {
    const now = Date.now();
    const counts = this.operationCounts.get(operationType) || {
      total: 0,
      errors: 0,
      transientErrors: 0,
    };

    counts.total++;

    if (!success && error) {
      counts.errors++;

      const isTransient = this.isTransientError(error);
      if (isTransient) {
        counts.transientErrors++;
      }

      // Record error event
      this.errorEvents.push({
        timestamp: now,
        operationType,
        isTransient,
        errorType: error.name || 'UnknownError',
        severity: this.determineSeverity(operationType, error, isTransient),
      });

      // Log based on current error rate
      this.logErrorBasedOnRate(operationType, error, isTransient);
    }

    this.operationCounts.set(operationType, counts);

    // Cleanup old events periodically
    if (now - this.lastCleanup.timestamp > this.config.windowSizeMs / 4) {
      this.cleanupOldEvents();
    }
  }

  /**
   * Get current error rate for an operation type
   */
  getErrorRate(operationType: string): OperationStats {
    const counts = this.operationCounts.get(operationType) || {
      total: 0,
      errors: 0,
      transientErrors: 0,
    };

    const errorRate = counts.total > 0 ? (counts.errors / counts.total) * 100 : 0;
    const transientErrorRate = counts.total > 0 ? (counts.transientErrors / counts.total) * 100 : 0;

    return {
      totalOperations: counts.total,
      errorCount: counts.errors,
      transientErrorCount: counts.transientErrors,
      errorRate,
      transientErrorRate,
      lastUpdateTime: Date.now(),
    };
  }

  /**
   * Get error rate across all operations
   */
  getOverallErrorRate(): OperationStats {
    let totalOps = 0;
    let totalErrors = 0;
    let totalTransientErrors = 0;

    for (const counts of this.operationCounts.values()) {
      totalOps += counts.total;
      totalErrors += counts.errors;
      totalTransientErrors += counts.transientErrors;
    }

    const errorRate = totalOps > 0 ? (totalErrors / totalOps) * 100 : 0;
    const transientErrorRate = totalOps > 0 ? (totalTransientErrors / totalOps) * 100 : 0;

    return {
      totalOperations: totalOps,
      errorCount: totalErrors,
      transientErrorCount: totalTransientErrors,
      errorRate,
      transientErrorRate,
      lastUpdateTime: Date.now(),
    };
  }

  /**
   * Check if error should be treated as warning based on current rate
   */
  shouldTreatAsWarning(operationType: string, error: Error): boolean {
    if (!this.isTransientError(error)) {
      return false;
    }

    const stats = this.getErrorRate(operationType);

    // Need minimum sample size for reliable statistics
    if (stats.totalOperations < this.config.minSampleSize) {
      return false;
    }

    // Convert to warning if error rate is below threshold
    return stats.errorRate < this.config.errorThreshold;
  }

  /**
   * Check if operation is in recovery mode (error rate improving)
   */
  isInRecoveryMode(operationType: string): boolean {
    if (!this.config.enableAutoRecovery) {
      return false;
    }

    const stats = this.getErrorRate(operationType);
    return (
      stats.errorRate < this.config.warningThreshold &&
      stats.totalOperations >= this.config.minSampleSize
    );
  }

  /**
   * Get error trends for monitoring
   */
  getErrorTrends(): Record<string, OperationStats> {
    const trends: Record<string, OperationStats> = {};

    for (const [operationType] of this.operationCounts.entries()) {
      trends[operationType] = this.getErrorRate(operationType);
    }

    return trends;
  }

  /**
   * Reset statistics for an operation type
   */
  resetOperationStats(operationType: string): void {
    this.operationCounts.delete(operationType);

    // Remove error events for this operation type
    const _now = Date.now();
    for (let i = this.errorEvents.length - 1; i >= 0; i--) {
      if (this.errorEvents[i].operationType === operationType) {
        this.errorEvents.splice(i, 1);
      }
    }

    logger.info(`Reset error statistics for operation: ${operationType}`);
  }

  /**
   * Reset all statistics
   */
  resetAllStats(): void {
    this.operationCounts.clear();
    this.errorEvents.length = 0;
    logger.info('Reset all error statistics');
  }

  /**
   * Get recent error events for debugging
   */
  getRecentErrors(operationType?: string, limitMs: number = 60000): ErrorEvent[] {
    const cutoff = Date.now() - limitMs;

    return this.errorEvents
      .filter(
        (event) =>
          event.timestamp >= cutoff &&
          (operationType === undefined || event.operationType === operationType)
      )
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Check if error is transient
   */
  private isTransientError(error: Error): boolean {
    // Check for TransientFailureError
    interface ErrorWithTransientFlag extends Error {
      isTransient?: boolean;
    }
    const errorWithFlag = error as ErrorWithTransientFlag;
    if (error.name === 'TransientFailureError' || errorWithFlag.isTransient) {
      return true;
    }

    // Check for common transient error patterns
    const transientPatterns = [
      /timeout/i,
      /network/i,
      /connection/i,
      /temporary/i,
      /cache.*fail/i,
      /service.*unavailable/i,
      /rate.*limit/i,
      /throttle/i,
      /busy/i,
      /overload/i,
      /memory.*pressure/i,
    ];

    const message = error.message.toLowerCase();
    return transientPatterns.some((pattern) => pattern.test(message));
  }

  /**
   * Determine severity based on current error rate
   */
  private determineSeverity(
    operationType: string,
    _error: Error,
    isTransient: boolean
  ): 'error' | 'warning' | 'info' {
    if (!isTransient) {
      return 'error';
    }

    const stats = this.getErrorRate(operationType);

    if (stats.totalOperations < this.config.minSampleSize) {
      return 'error'; // Not enough data, treat as error
    }

    if (stats.errorRate < this.config.warningThreshold) {
      return 'info'; // Very low error rate, treat as info
    } else if (stats.errorRate < this.config.errorThreshold) {
      return 'warning'; // Below threshold, treat as warning
    } else {
      return 'error'; // Above threshold, treat as error
    }
  }

  /**
   * Log error based on current error rate
   */
  private logErrorBasedOnRate(operationType: string, error: Error, isTransient: boolean): void {
    const severity = this.determineSeverity(operationType, error, isTransient);
    const stats = this.getErrorRate(operationType);

    const message = `${operationType} operation failed: ${error.message}`;
    const context = {
      operationType,
      isTransient,
      errorType: error.name,
      errorRate: stats.errorRate.toFixed(2),
      totalOperations: stats.totalOperations,
      severity,
    };

    switch (severity) {
      case 'error':
        logger.error(message, context);
        break;
      case 'warning':
        logger.warn(message, context);
        break;
      case 'info':
        logger.info(message, context);
        break;
    }
  }

  /**
   * Clean up old error events outside the monitoring window
   */
  private cleanupOldEvents(): void {
    const cutoff = Date.now() - this.config.windowSizeMs;

    // Remove old events
    for (let i = this.errorEvents.length - 1; i >= 0; i--) {
      if (this.errorEvents[i].timestamp < cutoff) {
        this.errorEvents.splice(i, 1);
      }
    }

    this.lastCleanup.timestamp = Date.now();

    if (this.errorEvents.length === 0) {
      // If no recent errors, reset operation counts to prevent stale data
      this.operationCounts.clear();
    }
  }

  /**
   * Start periodic cleanup of old events
   */
  private startPeriodicCleanup(): void {
    const cleanupInterval = this.config.windowSizeMs / 4; // Cleanup every quarter window

    setInterval(() => {
      this.cleanupOldEvents();
    }, cleanupInterval);
  }

  /**
   * Get health status based on error rates
   */
  getHealthStatus(): {
    overall: 'healthy' | 'degraded' | 'unhealthy';
    operations: Array<{
      name: string;
      status: 'healthy' | 'degraded' | 'unhealthy';
      errorRate: number;
      stats: OperationStats;
    }>;
  } {
    const operations = [];
    let overallHealthy = 0;
    let overallDegraded = 0;
    let overallUnhealthy = 0;

    for (const [operationType] of this.operationCounts.entries()) {
      const stats = this.getErrorRate(operationType);

      let status: 'healthy' | 'degraded' | 'unhealthy';
      if (stats.errorRate < this.config.warningThreshold) {
        status = 'healthy';
        overallHealthy++;
      } else if (stats.errorRate < this.config.errorThreshold) {
        status = 'degraded';
        overallDegraded++;
      } else {
        status = 'unhealthy';
        overallUnhealthy++;
      }

      operations.push({
        name: operationType,
        status,
        errorRate: stats.errorRate,
        stats,
      });
    }

    const totalOperations = overallHealthy + overallDegraded + overallUnhealthy;

    let overall: 'healthy' | 'degraded' | 'unhealthy';
    if (totalOperations === 0 || overallUnhealthy === 0) {
      overall = overallDegraded === 0 ? 'healthy' : 'degraded';
    } else {
      overall = 'unhealthy';
    }

    return {
      overall,
      operations,
    };
  }
}
