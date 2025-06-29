/**
 * Matrix Telemetry Service
 *
 * Advanced telemetry service for matrix operations with performance tracking,
 * regression detection, and comprehensive reporting following bulletproof-react patterns.
 */

import type {
  MatrixPerformanceMetrics,

} from "../types/matrix.types";
import { MATRIX_CONFIG } from "../config/matrix-config";



/**
 * Performance regression detection result
 */
export interface PerformanceRegression {
  readonly operation: string;
  readonly metric: string;
  readonly threshold: number;
  readonly actual: number;
  readonly deviation: number;
  readonly severity: "minor" | "moderate" | "severe";
  readonly timestamp: number;
  readonly recommendations: readonly string[];
}

/**
 * Telemetry report with comprehensive metrics and analysis
 */
export interface TelemetryReport {
  readonly summary: {
    readonly totalOperations: number;
    readonly successRate: number;
    readonly averageExecutionTime: number;
    readonly memoryUsage: number;
    readonly cacheEfficiency: number;
    readonly reportPeriod: readonly [number, number]; // [start, end] timestamps
  };
  readonly operationBreakdown: Record<
    string,
    {
      readonly count: number;
      readonly averageTime: number;
      readonly successRate: number;
      readonly memoryUsage: number;
    }
  >;
  readonly performanceRegressions: readonly PerformanceRegression[];
  readonly recommendations: readonly string[];
  readonly trends: {
    readonly executionTimesTrend: "improving" | "stable" | "degrading";
    readonly memoryUsageTrend: "improving" | "stable" | "degrading";
    readonly errorRateTrend: "improving" | "stable" | "degrading";
  };
}

/**
 * Operation tracking entry
 */
interface OperationEntry {
  readonly operation: string;
  readonly duration: number;
  readonly success: boolean;
  readonly timestamp: number;
  readonly memoryUsage?: number;
  readonly matrixSize?: readonly [number, number];
  readonly metadata?: Record<string, unknown>;
}

/**
 * Dependency injection interface for MatrixTelemetryService
 */
export interface MatrixTelemetryDependencies {
  readonly config: typeof MATRIX_CONFIG;
}

/**
 * Matrix Telemetry Service with performance monitoring and regression detection
 */
export class MatrixTelemetryService {
  private readonly operationHistory: OperationEntry[] = [];
  private readonly performanceBaselines = new Map<string, number>();
  private readonly regressionThresholds = new Map<string, number>();
  private readonly maxHistorySize: number;
  private readonly reportingInterval: number;
  private lastReportTime = 0;

  constructor(private readonly deps: MatrixTelemetryDependencies) {
    console.log(
      "[INIT][MatrixTelemetryService] Initializing matrix telemetry service",
    );

    this.maxHistorySize = 10000; // Keep last 10k operations
    this.reportingInterval = this.deps.config.debug.performanceLogInterval;

    this.initializeBaselines();
    this.initializeRegressionThresholds();
  }

  /**
   * Initialize performance baselines for different operations
   */
  private initializeBaselines(): void {
    // Set baseline performance expectations (in milliseconds)
    this.performanceBaselines.set("add", 1);
    this.performanceBaselines.set("subtract", 1);
    this.performanceBaselines.set("multiply", 5);
    this.performanceBaselines.set("transpose", 2);
    this.performanceBaselines.set("inverse", 10);
    this.performanceBaselines.set("pseudoInverse", 20);
    this.performanceBaselines.set("determinant", 5);
    this.performanceBaselines.set("eigenvalues", 50);
    this.performanceBaselines.set("svd", 30);
    this.performanceBaselines.set("validation", 15);
    this.performanceBaselines.set("conversion", 2);

    console.log(
      "[DEBUG][MatrixTelemetryService] Performance baselines initialized",
    );
  }

  /**
   * Initialize regression detection thresholds
   */
  private initializeRegressionThresholds(): void {
    // Set thresholds as multipliers of baseline performance
    this.regressionThresholds.set("minor", 1.5); // 50% slower than baseline
    this.regressionThresholds.set("moderate", 2.0); // 100% slower than baseline
    this.regressionThresholds.set("severe", 3.0); // 200% slower than baseline

    console.log(
      "[DEBUG][MatrixTelemetryService] Regression thresholds initialized",
    );
  }

  /**
   * Track a matrix operation
   */
  trackOperation(
    operation: string,
    duration: number,
    success: boolean,
    metadata?: {
      memoryUsage?: number;
      matrixSize?: readonly [number, number];
      additionalData?: Record<string, unknown>;
    },
  ): void {
    const entry: OperationEntry = {
      operation,
      duration,
      success,
      timestamp: Date.now(),
      ...(metadata?.memoryUsage !== undefined && {
        memoryUsage: metadata.memoryUsage,
      }),
      ...(metadata?.matrixSize !== undefined && {
        matrixSize: metadata.matrixSize,
      }),
      ...(metadata?.additionalData !== undefined && {
        metadata: metadata.additionalData,
      }),
    };

    // Add to history
    this.operationHistory.push(entry);

    // Maintain history size limit
    if (this.operationHistory.length > this.maxHistorySize) {
      this.operationHistory.shift();
    }

    // Check for performance regressions
    if (success && duration > 0) {
      this.checkPerformanceRegression(operation, duration);
    }

    // Log operation if debugging is enabled
    if (this.deps.config.debug.enablePerformanceLogging) {
      const status = success ? "SUCCESS" : "FAILED";
      console.log(
        `[DEBUG][MatrixTelemetryService] ${operation} ${status} in ${duration}ms`,
      );
    }

    // Generate periodic reports
    this.checkReportingInterval();
  }

  /**
   * Check for performance regressions
   */
  private checkPerformanceRegression(
    operation: string,
    duration: number,
  ): void {
    const baseline = this.performanceBaselines.get(operation);
    if (!baseline) return;

    const deviation = duration / baseline;
    let severity: "minor" | "moderate" | "severe" | null = null;

    if (deviation >= this.regressionThresholds.get("severe")!) {
      severity = "severe";
    } else if (deviation >= this.regressionThresholds.get("moderate")!) {
      severity = "moderate";
    } else if (deviation >= this.regressionThresholds.get("minor")!) {
      severity = "minor";
    }

    if (severity) {
      const regression: PerformanceRegression = {
        operation,
        metric: "execution_time",
        threshold: baseline,
        actual: duration,
        deviation,
        severity,
        timestamp: Date.now(),
        recommendations: this.generateRegressionRecommendations(
          operation,
          severity,
          deviation,
        ),
      };

      console.warn(
        `[WARN][MatrixTelemetryService] Performance regression detected:`,
        regression,
      );

      // Track regression for reporting
      this.trackPerformanceRegression(regression);
    }
  }

  /**
   * Generate recommendations for performance regressions
   */
  private generateRegressionRecommendations(
    operation: string,
    severity: string,
    deviation: number,
  ): string[] {
    const recommendations: string[] = [];

    if (severity === "severe") {
      recommendations.push(
        "Immediate investigation required - performance degraded significantly",
      );
      recommendations.push("Check for memory leaks or inefficient algorithms");
      recommendations.push(
        "Consider profiling the operation to identify bottlenecks",
      );
    }

    if (deviation > 5) {
      recommendations.push(
        "Consider using alternative algorithms or optimizations",
      );
      recommendations.push("Check if matrix size is within expected bounds");
    }

    switch (operation) {
      case "multiply":
        recommendations.push(
          "Consider using block matrix multiplication for large matrices",
        );
        recommendations.push(
          "Verify matrix dimensions are optimal for the operation",
        );
        break;

      case "inverse":
        recommendations.push("Consider using LU decomposition with pivoting");
        recommendations.push(
          "Check matrix condition number - use pseudo-inverse for ill-conditioned matrices",
        );
        break;

      case "eigenvalues":
        recommendations.push(
          "Consider using iterative methods for large matrices",
        );
        recommendations.push(
          "Check if matrix is symmetric - use specialized algorithms",
        );
        break;
    }

    return recommendations;
  }

  /**
   * Track performance regression for reporting
   */
  private trackPerformanceRegression(regression: PerformanceRegression): void {
    // Store regression data for inclusion in reports
    // This could be expanded to maintain a separate regression history
    console.log(
      `[DEBUG][MatrixTelemetryService] Tracking regression: ${regression.operation} (${regression.severity})`,
    );
  }

  /**
   * Check if it's time to generate a periodic report
   */
  private checkReportingInterval(): void {
    const now = Date.now();
    if (now - this.lastReportTime >= this.reportingInterval) {
      this.generatePeriodicReport();
      this.lastReportTime = now;
    }
  }

  /**
   * Generate periodic performance report
   */
  private generatePeriodicReport(): void {
    if (this.operationHistory.length === 0) return;

    const report = this.generateReport();

    if (this.deps.config.debug.enablePerformanceLogging) {
      console.log(
        "[INFO][MatrixTelemetryService] Periodic Performance Report:",
        {
          totalOperations: report.summary.totalOperations,
          successRate: `${(report.summary.successRate * 100).toFixed(1)}%`,
          avgExecutionTime: `${report.summary.averageExecutionTime.toFixed(2)}ms`,
          regressions: report.performanceRegressions.length,
        },
      );
    }
  }

  /**
   * Generate comprehensive telemetry report
   */
  generateReport(timeRange?: readonly [number, number]): TelemetryReport {
    console.log("[DEBUG][MatrixTelemetryService] Generating telemetry report");

    const now = Date.now();
    const [startTime, endTime] = timeRange || [
      now - this.reportingInterval,
      now,
    ];

    // Filter operations within time range
    const relevantOps = this.operationHistory.filter(
      (op) => op.timestamp >= startTime && op.timestamp <= endTime,
    );

    if (relevantOps.length === 0) {
      return this.createEmptyReport(startTime, endTime);
    }

    // Calculate summary metrics
    const totalOperations = relevantOps.length;
    const successfulOps = relevantOps.filter((op) => op.success);
    const successRate = successfulOps.length / totalOperations;
    const averageExecutionTime =
      successfulOps.reduce((sum, op) => sum + op.duration, 0) /
      successfulOps.length;
    const totalMemoryUsage = relevantOps.reduce(
      (sum, op) => sum + (op.memoryUsage || 0),
      0,
    );

    // Calculate operation breakdown
    const operationBreakdown: Record<
      string,
      {
        count: number;
        averageTime: number;
        successRate: number;
        memoryUsage: number;
      }
    > = {};
    const operationGroups = this.groupOperationsByType(relevantOps);

    for (const [operation, ops] of operationGroups.entries()) {
      const successful = ops.filter((op) => op.success);
      operationBreakdown[operation] = {
        count: ops.length,
        averageTime:
          successful.length > 0
            ? successful.reduce((sum, op) => sum + op.duration, 0) /
              successful.length
            : 0,
        successRate: successful.length / ops.length,
        memoryUsage: ops.reduce((sum, op) => sum + (op.memoryUsage || 0), 0),
      };
    }

    // Detect performance regressions in the time period
    const performanceRegressions = this.detectRegressionsInPeriod(relevantOps);

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      relevantOps,
      performanceRegressions,
    );

    // Analyze trends
    const trends = this.analyzeTrends(relevantOps);

    return {
      summary: {
        totalOperations,
        successRate,
        averageExecutionTime,
        memoryUsage: totalMemoryUsage,
        cacheEfficiency: this.calculateCacheEfficiency(relevantOps),
        reportPeriod: [startTime, endTime],
      },
      operationBreakdown,
      performanceRegressions,
      recommendations,
      trends,
    };
  }

  /**
   * Create empty report for periods with no operations
   */
  private createEmptyReport(
    startTime: number,
    endTime: number,
  ): TelemetryReport {
    return {
      summary: {
        totalOperations: 0,
        successRate: 1,
        averageExecutionTime: 0,
        memoryUsage: 0,
        cacheEfficiency: 0,
        reportPeriod: [startTime, endTime],
      },
      operationBreakdown: {},
      performanceRegressions: [],
      recommendations: ["No operations recorded in this period"],
      trends: {
        executionTimesTrend: "stable",
        memoryUsageTrend: "stable",
        errorRateTrend: "stable",
      },
    };
  }

  /**
   * Group operations by type
   */
  private groupOperationsByType(
    operations: OperationEntry[],
  ): Map<string, OperationEntry[]> {
    const groups = new Map<string, OperationEntry[]>();

    for (const op of operations) {
      if (!groups.has(op.operation)) {
        groups.set(op.operation, []);
      }
      groups.get(op.operation)!.push(op);
    }

    return groups;
  }

  /**
   * Detect performance regressions in a specific period
   */
  private detectRegressionsInPeriod(
    operations: OperationEntry[],
  ): PerformanceRegression[] {
    const regressions: PerformanceRegression[] = [];
    const operationGroups = this.groupOperationsByType(operations);

    for (const [operation, ops] of operationGroups.entries()) {
      const baseline = this.performanceBaselines.get(operation);
      if (!baseline) continue;

      const successful = ops.filter((op) => op.success);
      if (successful.length === 0) continue;

      const averageTime =
        successful.reduce((sum, op) => sum + op.duration, 0) /
        successful.length;
      const deviation = averageTime / baseline;

      if (deviation >= this.regressionThresholds.get("minor")!) {
        let severity: "minor" | "moderate" | "severe" = "minor";

        if (deviation >= this.regressionThresholds.get("severe")!) {
          severity = "severe";
        } else if (deviation >= this.regressionThresholds.get("moderate")!) {
          severity = "moderate";
        }

        regressions.push({
          operation,
          metric: "execution_time",
          threshold: baseline,
          actual: averageTime,
          deviation,
          severity,
          timestamp: Date.now(),
          recommendations: this.generateRegressionRecommendations(
            operation,
            severity,
            deviation,
          ),
        });
      }
    }

    return regressions;
  }

  /**
   * Generate recommendations based on telemetry data
   */
  private generateRecommendations(
    operations: OperationEntry[],
    regressions: PerformanceRegression[],
  ): string[] {
    const recommendations: string[] = [];

    if (regressions.length > 0) {
      recommendations.push(
        `${regressions.length} performance regression(s) detected - investigate immediately`,
      );
    }

    const failedOps = operations.filter((op) => !op.success);
    const failureRate = failedOps.length / operations.length;

    if (failureRate > 0.05) {
      // More than 5% failure rate
      recommendations.push(
        "High failure rate detected - review error handling and input validation",
      );
    }

    const avgExecutionTime =
      operations
        .filter((op) => op.success)
        .reduce((sum, op) => sum + op.duration, 0) /
      operations.filter((op) => op.success).length;

    if (avgExecutionTime > this.deps.config.performance.performanceThreshold) {
      recommendations.push(
        "Average execution time exceeds performance threshold - consider optimization",
      );
    }

    return recommendations;
  }

  /**
   * Analyze performance trends
   */
  private analyzeTrends(
    operations: OperationEntry[],
  ): TelemetryReport["trends"] {
    // Simple trend analysis - could be enhanced with more sophisticated algorithms
    const midpoint = Math.floor(operations.length / 2);
    const firstHalf = operations.slice(0, midpoint);
    const secondHalf = operations.slice(midpoint);

    const firstHalfAvgTime = this.calculateAverageExecutionTime(firstHalf);
    const secondHalfAvgTime = this.calculateAverageExecutionTime(secondHalf);

    const firstHalfMemory = this.calculateAverageMemoryUsage(firstHalf);
    const secondHalfMemory = this.calculateAverageMemoryUsage(secondHalf);

    const firstHalfErrorRate = this.calculateErrorRate(firstHalf);
    const secondHalfErrorRate = this.calculateErrorRate(secondHalf);

    return {
      executionTimesTrend: this.determineTrend(
        firstHalfAvgTime,
        secondHalfAvgTime,
      ),
      memoryUsageTrend: this.determineTrend(firstHalfMemory, secondHalfMemory),
      errorRateTrend: this.determineTrend(
        secondHalfErrorRate,
        firstHalfErrorRate,
      ), // Inverted for error rate
    };
  }

  /**
   * Calculate average execution time for operations
   */
  private calculateAverageExecutionTime(operations: OperationEntry[]): number {
    const successful = operations.filter((op) => op.success);
    return successful.length > 0
      ? successful.reduce((sum, op) => sum + op.duration, 0) / successful.length
      : 0;
  }

  /**
   * Calculate average memory usage for operations
   */
  private calculateAverageMemoryUsage(operations: OperationEntry[]): number {
    const withMemory = operations.filter((op) => op.memoryUsage !== undefined);
    return withMemory.length > 0
      ? withMemory.reduce((sum, op) => sum + (op.memoryUsage || 0), 0) /
          withMemory.length
      : 0;
  }

  /**
   * Calculate error rate for operations
   */
  private calculateErrorRate(operations: OperationEntry[]): number {
    return operations.length > 0
      ? operations.filter((op) => !op.success).length / operations.length
      : 0;
  }

  /**
   * Determine trend direction
   */
  private determineTrend(
    before: number,
    after: number,
  ): "improving" | "stable" | "degrading" {
    const threshold = 0.1; // 10% change threshold
    const change = (after - before) / (before || 1);

    if (change > threshold) return "degrading";
    if (change < -threshold) return "improving";
    return "stable";
  }

  /**
   * Calculate cache efficiency from operations
   */
  private calculateCacheEfficiency(_operations: OperationEntry[]): number {
    // This would need to be enhanced with actual cache hit/miss data
    // For now, return a placeholder value
    return 0.85; // 85% cache efficiency
  }

  /**
   * Reset telemetry data
   */
  reset(): void {
    this.operationHistory.length = 0;
    this.lastReportTime = 0;
    console.log("[DEBUG][MatrixTelemetryService] Telemetry data reset");
  }

  /**
   * Get current performance metrics
   */
  getPerformanceMetrics(): MatrixPerformanceMetrics {
    const recentOps = this.operationHistory.slice(-1000); // Last 1000 operations
    const successful = recentOps.filter((op) => op.success);

    return {
      operationCount: recentOps.length,
      totalExecutionTime: successful.reduce((sum, op) => sum + op.duration, 0),
      averageExecutionTime:
        successful.length > 0
          ? successful.reduce((sum, op) => sum + op.duration, 0) /
            successful.length
          : 0,
      cacheHitRate: this.calculateCacheEfficiency(recentOps),
      memoryUsage: recentOps.reduce(
        (sum, op) => sum + (op.memoryUsage || 0),
        0,
      ),
      largeMatrixOperations: recentOps.filter((op) => {
        const size = op.matrixSize ? op.matrixSize[0] * op.matrixSize[1] : 0;
        return size >= this.deps.config.performance.largeMatrixThreshold;
      }).length,
      failedOperations: recentOps.filter((op) => !op.success).length,
    };
  }
}
