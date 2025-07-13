/**
 * @file Production Monitor
 * @description Production-ready monitoring system for Manifold pipeline operations
 * Following project guidelines: Result<T,E> patterns, functional programming, comprehensive logging
 */

import type { Result } from '../../../../../shared/types/result.types';
import { logger } from '../../../../../shared/services/logger.service';
import type { PerformanceMetrics } from '../performance-monitoring/performance-monitor';

/**
 * Production health status levels
 */
export type HealthStatus = 'healthy' | 'warning' | 'critical' | 'degraded';

/**
 * Production metrics for system health monitoring
 */
export interface ProductionMetrics {
  readonly timestamp: number;
  readonly healthStatus: HealthStatus;
  readonly operationsPerSecond: number;
  readonly averageProcessingTime: number;
  readonly errorRate: number;
  readonly memoryUsage: number;
  readonly activeOperations: number;
  readonly totalOperationsProcessed: number;
  readonly uptime: number;
}

/**
 * Production alert configuration
 */
export interface AlertConfig {
  readonly errorRateThreshold: number; // Error rate threshold (0-1)
  readonly performanceThreshold: number; // Performance threshold in ms
  readonly memoryThreshold: number; // Memory threshold in MB
  readonly operationTimeoutMs: number; // Operation timeout in ms
}

/**
 * Production alert information
 */
export interface ProductionAlert {
  readonly id: string;
  readonly timestamp: number;
  readonly level: 'warning' | 'critical';
  readonly type: 'performance' | 'error_rate' | 'memory' | 'timeout';
  readonly message: string;
  readonly metrics: Partial<ProductionMetrics>;
  readonly resolved: boolean;
}

/**
 * Default production alert configuration
 */
const DEFAULT_ALERT_CONFIG: AlertConfig = {
  errorRateThreshold: 0.1, // 10% error rate
  performanceThreshold: 32, // 32ms (2x target)
  memoryThreshold: 100, // 100MB
  operationTimeoutMs: 5000, // 5 seconds
} as const;

/**
 * Production monitor for comprehensive system health tracking
 * Implements production-grade monitoring with alerting and health status
 */
export class ProductionMonitor {
  private readonly config: AlertConfig;
  private readonly startTime: number;
  private readonly operationHistory: PerformanceMetrics[] = [];
  private readonly alerts: ProductionAlert[] = [];
  private readonly activeOperations = new Set<string>();
  
  private totalOperations = 0;
  private totalErrors = 0;
  private lastMetricsUpdate = 0;

  constructor(config: Partial<AlertConfig> = {}) {
    this.config = { ...DEFAULT_ALERT_CONFIG, ...config };
    this.startTime = Date.now();
    this.lastMetricsUpdate = Date.now();
    
    logger.init('[INIT][ProductionMonitor] Production monitoring initialized');
    logger.debug(`[DEBUG][ProductionMonitor] Alert thresholds: ${JSON.stringify(this.config)}`);
  }

  /**
   * Record a completed operation for monitoring
   * @param metrics Performance metrics from the operation
   * @returns Result indicating success or failure
   */
  recordOperation(metrics: PerformanceMetrics): Result<void, string> {
    try {
      this.operationHistory.push(metrics);
      this.totalOperations++;
      
      if (!metrics.success) {
        this.totalErrors++;
      }

      // Remove from active operations if it was tracked
      this.activeOperations.delete(metrics.operationId);

      // Maintain history size (keep last 1000 operations)
      if (this.operationHistory.length > 1000) {
        this.operationHistory.splice(0, this.operationHistory.length - 1000);
      }

      // Check for alerts
      this.checkAlerts(metrics);

      return { success: true, data: undefined };
    } catch (error) {
      const errorMessage = `Failed to record operation: ${error}`;
      logger.error(`[ERROR][ProductionMonitor] ${errorMessage}`);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Start tracking an active operation
   * @param operationId Unique identifier for the operation
   * @returns Result indicating success or failure
   */
  startOperation(operationId: string): Result<void, string> {
    try {
      if (this.activeOperations.has(operationId)) {
        const error = `Operation ${operationId} is already being tracked`;
        logger.warn(`[WARN][ProductionMonitor] ${error}`);
        return { success: false, error };
      }

      this.activeOperations.add(operationId);
      
      // Set timeout for operation
      setTimeout(() => {
        if (this.activeOperations.has(operationId)) {
          this.handleOperationTimeout(operationId);
        }
      }, this.config.operationTimeoutMs);

      return { success: true, data: undefined };
    } catch (error) {
      const errorMessage = `Failed to start operation tracking: ${error}`;
      logger.error(`[ERROR][ProductionMonitor] ${errorMessage}`);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Get current production metrics
   * @returns Current production health metrics
   */
  getProductionMetrics(): ProductionMetrics {
    const now = Date.now();
    const recentOperations = this.getRecentOperations(60000); // Last minute
    const recentErrors = recentOperations.filter(op => !op.success);
    
    return {
      timestamp: now,
      healthStatus: this.calculateHealthStatus(),
      operationsPerSecond: this.calculateOperationsPerSecond(),
      averageProcessingTime: this.calculateAverageProcessingTime(),
      errorRate: recentOperations.length > 0 ? recentErrors.length / recentOperations.length : 0,
      memoryUsage: this.getMemoryUsage(),
      activeOperations: this.activeOperations.size,
      totalOperationsProcessed: this.totalOperations,
      uptime: now - this.startTime,
    };
  }

  /**
   * Get current health status
   * @returns Current system health status
   */
  getHealthStatus(): HealthStatus {
    return this.calculateHealthStatus();
  }

  /**
   * Get active alerts
   * @returns Array of unresolved alerts
   */
  getActiveAlerts(): readonly ProductionAlert[] {
    return this.alerts.filter(alert => !alert.resolved);
  }

  /**
   * Get all alerts (resolved and unresolved)
   * @returns Array of all alerts
   */
  getAllAlerts(): readonly ProductionAlert[] {
    return [...this.alerts];
  }

  /**
   * Resolve an alert by ID
   * @param alertId Alert ID to resolve
   * @returns Result indicating success or failure
   */
  resolveAlert(alertId: string): Result<void, string> {
    try {
      const alert = this.alerts.find(a => a.id === alertId);
      if (!alert) {
        const error = `Alert ${alertId} not found`;
        return { success: false, error };
      }

      if (alert.resolved) {
        const error = `Alert ${alertId} is already resolved`;
        return { success: false, error };
      }

      // Mark as resolved (alerts are readonly, so we need to update the internal array)
      const alertIndex = this.alerts.findIndex(a => a.id === alertId);
      if (alertIndex >= 0) {
        this.alerts[alertIndex] = { ...alert, resolved: true };
        logger.info(`[INFO][ProductionMonitor] Alert resolved: ${alertId}`);
      }

      return { success: true, data: undefined };
    } catch (error) {
      const errorMessage = `Failed to resolve alert: ${error}`;
      logger.error(`[ERROR][ProductionMonitor] ${errorMessage}`);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Clear all resolved alerts
   * @returns Number of alerts cleared
   */
  clearResolvedAlerts(): number {
    const initialCount = this.alerts.length;
    const unresolvedAlerts = this.alerts.filter(alert => !alert.resolved);
    this.alerts.length = 0;
    this.alerts.push(...unresolvedAlerts);
    
    const clearedCount = initialCount - this.alerts.length;
    if (clearedCount > 0) {
      logger.debug(`[DEBUG][ProductionMonitor] Cleared ${clearedCount} resolved alerts`);
    }
    
    return clearedCount;
  }

  /**
   * Get system uptime in milliseconds
   * @returns Uptime in milliseconds
   */
  getUptime(): number {
    return Date.now() - this.startTime;
  }

  /**
   * Check if system is healthy
   * @returns True if system is healthy
   */
  isHealthy(): boolean {
    const status = this.calculateHealthStatus();
    return status === 'healthy' || status === 'warning';
  }

  /**
   * Get recent operations within specified time window
   */
  private getRecentOperations(timeWindowMs: number): PerformanceMetrics[] {
    const cutoff = Date.now() - timeWindowMs;
    return this.operationHistory.filter(op => op.endTime >= cutoff);
  }

  /**
   * Calculate current health status based on metrics
   */
  private calculateHealthStatus(): HealthStatus {
    const activeAlerts = this.getActiveAlerts();
    const criticalAlerts = activeAlerts.filter(alert => alert.level === 'critical');

    if (criticalAlerts.length > 0) {
      return 'critical';
    }

    if (activeAlerts.length > 0) {
      return 'warning';
    }

    // Check error rate without calling getProductionMetrics to avoid circular dependency
    const recentOperations = this.getRecentOperations(60000);
    const recentErrors = recentOperations.filter(op => !op.success);
    const errorRate = recentOperations.length > 0 ? recentErrors.length / recentOperations.length : 0;

    if (errorRate > this.config.errorRateThreshold * 0.5) {
      return 'degraded';
    }

    return 'healthy';
  }

  /**
   * Calculate operations per second
   */
  private calculateOperationsPerSecond(): number {
    const recentOperations = this.getRecentOperations(60000); // Last minute
    return recentOperations.length / 60; // Operations per second
  }

  /**
   * Calculate average processing time
   */
  private calculateAverageProcessingTime(): number {
    const recentOperations = this.getRecentOperations(300000); // Last 5 minutes
    if (recentOperations.length === 0) return 0;
    
    const totalTime = recentOperations.reduce((sum, op) => sum + op.duration, 0);
    return totalTime / recentOperations.length;
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

  /**
   * Check for alerts based on operation metrics
   */
  private checkAlerts(metrics: PerformanceMetrics): void {
    // Performance alert
    if (metrics.duration > this.config.performanceThreshold) {
      this.createAlert('performance', 'warning', 
        `Operation ${metrics.operationId} exceeded performance threshold: ${metrics.duration}ms`);
    }

    // Error rate alert
    const recentOperations = this.getRecentOperations(60000);
    const recentErrors = recentOperations.filter(op => !op.success);
    const errorRate = recentOperations.length > 0 ? recentErrors.length / recentOperations.length : 0;
    
    if (errorRate > this.config.errorRateThreshold) {
      this.createAlert('error_rate', 'critical',
        `High error rate detected: ${(errorRate * 100).toFixed(1)}%`);
    }

    // Memory alert
    const memoryUsage = this.getMemoryUsage();
    if (memoryUsage > this.config.memoryThreshold) {
      this.createAlert('memory', 'warning',
        `High memory usage detected: ${memoryUsage.toFixed(1)}MB`);
    }
  }

  /**
   * Handle operation timeout
   */
  private handleOperationTimeout(operationId: string): void {
    this.activeOperations.delete(operationId);
    this.createAlert('timeout', 'critical',
      `Operation ${operationId} timed out after ${this.config.operationTimeoutMs}ms`);
  }

  /**
   * Create a new alert
   */
  private createAlert(
    type: ProductionAlert['type'],
    level: ProductionAlert['level'],
    message: string
  ): void {
    const alert: ProductionAlert = {
      id: `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      level,
      type,
      message,
      metrics: this.getProductionMetrics(),
      resolved: false,
    };

    this.alerts.push(alert);
    
    // Log alert
    const logLevel = level === 'critical' ? 'error' : 'warn';
    logger[logLevel](`[${logLevel.toUpperCase()}][ProductionMonitor] Alert: ${message}`);

    // Maintain alert history (keep last 100 alerts)
    if (this.alerts.length > 100) {
      this.alerts.splice(0, this.alerts.length - 100);
    }
  }
}
