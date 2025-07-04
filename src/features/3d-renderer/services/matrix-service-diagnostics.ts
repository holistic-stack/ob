/**
 * Matrix Service Diagnostics
 *
 * Comprehensive diagnostic instrumentation using Node.js perf_hooks for 
 * performance profiling and latency analysis of MatrixService operations.
 */

import { PerformanceObserver, performance } from 'perf_hooks';
import { createLogger } from '../../../shared/services/logger.service.js';

const logger = createLogger('MatrixServiceDiagnostics');

/**
 * Performance measurement data
 */
export interface PerformanceMeasurement {
  readonly name: string;
  readonly type: 'bootstrap' | 'validation' | 'telemetry' | 'operation';
  readonly startTime: number;
  readonly endTime: number;
  readonly duration: number;
  readonly timestamp: number;
  readonly metadata?: Record<string, unknown>;
}

/**
 * Latency histogram data
 */
export interface LatencyHistogram {
  readonly operation: string;
  readonly buckets: Map<number, number>; // bucket_ms -> count
  readonly totalSamples: number;
  readonly min: number;
  readonly max: number;
  readonly p50: number;
  readonly p90: number;
  readonly p95: number;
  readonly p99: number;
  readonly mean: number;
  readonly stdDev: number;
}

/**
 * Failure histogram data
 */
export interface FailureHistogram {
  readonly operation: string;
  readonly totalAttempts: number;
  readonly totalFailures: number;
  readonly failureRate: number;
  readonly failuresByType: Map<string, number>;
  readonly failuresByLatency: Map<number, number>; // latency_bucket -> failure_count
}

/**
 * Diagnostic report with histograms and hotspot analysis
 */
export interface DiagnosticReport {
  readonly timestamp: number;
  readonly reportPeriod: readonly [number, number];
  readonly measurements: PerformanceMeasurement[];
  readonly latencyHistograms: Map<string, LatencyHistogram>;
  readonly failureHistograms: Map<string, FailureHistogram>;
  readonly hotspots: readonly {
    readonly operation: string;
    readonly type: string;
    readonly averageLatency: number;
    readonly p99Latency: number;
    readonly failureRate: number;
    readonly severity: 'critical' | 'high' | 'medium' | 'low';
    readonly recommendations: readonly string[];
  }[];
  readonly summary: {
    readonly totalOperations: number;
    readonly averageLatency: number;
    readonly overallFailureRate: number;
    readonly criticalHotspots: number;
    readonly validationLatencyP99: number;
    readonly telemetryLatencyP99: number;
    readonly bootstrapLatency: number;
  };
}

/**
 * Matrix Service Diagnostics with performance hooks instrumentation
 */
export class MatrixServiceDiagnostics {
  private readonly measurements: PerformanceMeasurement[] = [];
  private readonly perfObserver: PerformanceObserver;
  private readonly maxMeasurements = 10000; // Circular buffer
  private readonly latencyBuckets = [1, 5, 10, 25, 50, 100, 250, 500, 1000, 2000, 5000]; // ms
  private isEnabled = false;
  private reportStartTime = Date.now();

  constructor() {
    this.perfObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      for (const entry of entries) {
        this.processPerfEntry(entry);
      }
    });

    logger.init('Matrix service diagnostics initialized');
  }

  /**
   * Enable diagnostic collection
   */
  enable(): void {
    if (this.isEnabled) return;

    this.isEnabled = true;
    this.reportStartTime = Date.now();
    
    // Observe performance marks and measures
    this.perfObserver.observe({ 
      entryTypes: ['mark', 'measure'],
      buffered: true 
    });

    logger.info('Performance diagnostics enabled');
  }

  /**
   * Disable diagnostic collection
   */
  disable(): void {
    if (!this.isEnabled) return;

    this.isEnabled = false;
    this.perfObserver.disconnect();
    
    logger.info('Performance diagnostics disabled');
  }

  /**
   * Process performance entry from Node.js perf_hooks
   */
  private processPerfEntry(entry: any): void {
    if (!this.isEnabled) return;

    const measurement: PerformanceMeasurement = {
      name: entry.name,
      type: this.categorizeOperation(entry.name),
      startTime: entry.startTime,
      endTime: entry.startTime + entry.duration,
      duration: entry.duration,
      timestamp: Date.now(),
      metadata: entry.detail || {}
    };

    this.addMeasurement(measurement);
  }

  /**
   * Categorize operation by name
   */
  private categorizeOperation(name: string): 'bootstrap' | 'validation' | 'telemetry' | 'operation' {
    if (name.includes('bootstrap') || name.includes('initialization') || name.includes('container')) {
      return 'bootstrap';
    }
    if (name.includes('validation') || name.includes('validate')) {
      return 'validation';
    }
    if (name.includes('telemetry') || name.includes('track') || name.includes('counter')) {
      return 'telemetry';
    }
    return 'operation';
  }

  /**
   * Add measurement to circular buffer
   */
  private addMeasurement(measurement: PerformanceMeasurement): void {
    this.measurements.push(measurement);
    
    if (this.measurements.length > this.maxMeasurements) {
      this.measurements.shift();
    }

    // Log critical latencies immediately
    if (measurement.duration > 100) { // >100ms
      logger.warn(`High latency detected: ${measurement.name} took ${measurement.duration.toFixed(2)}ms`);
    }
  }

  /**
   * Start timing an operation
   */
  startTiming(operationName: string, metadata?: Record<string, unknown>): void {
    if (!this.isEnabled) return;
    
    const markName = `${operationName}_start`;
    performance.mark(markName, { detail: metadata });
    
    logger.debug(`Started timing: ${operationName}`);
  }

  /**
   * End timing an operation
   */
  endTiming(operationName: string, metadata?: Record<string, unknown>): number {
    if (!this.isEnabled) return 0;
    
    const startMark = `${operationName}_start`;
    const endMark = `${operationName}_end`;
    const measureName = operationName;
    
    performance.mark(endMark, { detail: metadata });
    
    try {
      performance.measure(measureName, startMark, endMark);
      
      // Get the measurement duration
      const measures = performance.getEntriesByName(measureName, 'measure');
      const latestMeasure = measures[measures.length - 1];
      const duration = latestMeasure ? latestMeasure.duration : 0;
      
      logger.debug(`Ended timing: ${operationName} - ${duration.toFixed(2)}ms`);
      
      // Cleanup marks
      performance.clearMarks(startMark);
      performance.clearMarks(endMark);
      performance.clearMeasures(measureName);
      
      return duration;
    } catch (err) {
      logger.error(`Failed to measure ${operationName}:`, err);
      return 0;
    }
  }

  /**
   * Time an async operation
   */
  async timeOperation<T>(
    operationName: string, 
    operation: () => Promise<T>,
    metadata?: Record<string, unknown>
  ): Promise<{ result: T; duration: number }> {
    this.startTiming(operationName, metadata);
    
    const startTime = performance.now();
    try {
      const result = await operation();
      const duration = this.endTiming(operationName, { 
        ...metadata, 
        success: true 
      });
      
      return { result, duration: duration || (performance.now() - startTime) };
    } catch (error) {
      const duration = this.endTiming(operationName, { 
        ...metadata, 
        success: false, 
        error: error instanceof Error ? error.message : String(error)
      });
      
      // Record failure
      this.recordFailure(operationName, error as Error, duration || (performance.now() - startTime));
      throw error;
    }
  }

  /**
   * Time a synchronous operation
   */
  timeSync<T>(
    operationName: string,
    operation: () => T,
    metadata?: Record<string, unknown>
  ): { result: T; duration: number } {
    this.startTiming(operationName, metadata);
    
    const startTime = performance.now();
    try {
      const result = operation();
      const duration = this.endTiming(operationName, { 
        ...metadata, 
        success: true 
      });
      
      return { result, duration: duration || (performance.now() - startTime) };
    } catch (error) {
      const duration = this.endTiming(operationName, { 
        ...metadata, 
        success: false, 
        error: error instanceof Error ? error.message : String(error)
      });
      
      // Record failure
      this.recordFailure(operationName, error as Error, duration || (performance.now() - startTime));
      throw error;
    }
  }

  /**
   * Record operation failure
   */
  private recordFailure(operationName: string, error: Error, duration: number): void {
    const failureMeasurement: PerformanceMeasurement = {
      name: `${operationName}_failure`,
      type: this.categorizeOperation(operationName),
      startTime: 0,
      endTime: duration,
      duration,
      timestamp: Date.now(),
      metadata: {
        error: error.message,
        errorType: error.constructor.name,
        stack: error.stack?.split('\n').slice(0, 3).join('\n') // Truncated stack
      }
    };

    this.addMeasurement(failureMeasurement);
  }

  /**
   * Calculate latency histogram
   */
  private calculateLatencyHistogram(operationName: string): LatencyHistogram {
    const measurements = this.measurements.filter(m => 
      m.name === operationName && !m.name.includes('_failure')
    );

    if (measurements.length === 0) {
      return {
        operation: operationName,
        buckets: new Map(),
        totalSamples: 0,
        min: 0,
        max: 0,
        p50: 0,
        p90: 0,
        p95: 0,
        p99: 0,
        mean: 0,
        stdDev: 0
      };
    }

    const durations = measurements.map(m => m.duration).sort((a, b) => a - b);
    const buckets = new Map<number, number>();

    // Fill buckets
    for (const bucket of this.latencyBuckets) {
      buckets.set(bucket, 0);
    }

    for (const duration of durations) {
      for (const bucket of this.latencyBuckets) {
        if (duration <= bucket) {
          buckets.set(bucket, (buckets.get(bucket) || 0) + 1);
          break;
        }
      }
    }

    // Calculate percentiles
    const p50 = durations[Math.floor(durations.length * 0.5)] || 0;
    const p90 = durations[Math.floor(durations.length * 0.9)] || 0;
    const p95 = durations[Math.floor(durations.length * 0.95)] || 0;
    const p99 = durations[Math.floor(durations.length * 0.99)] || 0;
    
    const mean = durations.reduce((a, b) => a + b, 0) / durations.length;
    const variance = durations.reduce((sum, duration) => sum + Math.pow(duration - mean, 2), 0) / durations.length;
    const stdDev = Math.sqrt(variance);

    return {
      operation: operationName,
      buckets,
      totalSamples: durations.length,
      min: Math.min(...durations),
      max: Math.max(...durations),
      p50,
      p90,
      p95,
      p99,
      mean,
      stdDev
    };
  }

  /**
   * Calculate failure histogram
   */
  private calculateFailureHistogram(operationName: string): FailureHistogram {
    const allMeasurements = this.measurements.filter(m => 
      m.name === operationName || m.name === `${operationName}_failure`
    );
    
    const failures = this.measurements.filter(m => m.name === `${operationName}_failure`);
    const totalAttempts = allMeasurements.length;
    const totalFailures = failures.length;
    
    const failuresByType = new Map<string, number>();
    const failuresByLatency = new Map<number, number>();

    // Initialize latency buckets
    for (const bucket of this.latencyBuckets) {
      failuresByLatency.set(bucket, 0);
    }

    for (const failure of failures) {
      // Group by error type
      const errorType = (failure.metadata?.errorType as string) || 'Unknown';
      failuresByType.set(errorType, (failuresByType.get(errorType) || 0) + 1);

      // Group by latency bucket
      for (const bucket of this.latencyBuckets) {
        if (failure.duration <= bucket) {
          failuresByLatency.set(bucket, (failuresByLatency.get(bucket) || 0) + 1);
          break;
        }
      }
    }

    return {
      operation: operationName,
      totalAttempts,
      totalFailures,
      failureRate: totalAttempts > 0 ? totalFailures / totalAttempts : 0,
      failuresByType,
      failuresByLatency
    };
  }

  /**
   * Identify performance hotspots
   */
  private identifyHotspots(
    latencyHistograms: Map<string, LatencyHistogram>,
    failureHistograms: Map<string, FailureHistogram>
  ): DiagnosticReport['hotspots'] {
    const hotspots: DiagnosticReport['hotspots'] = [];

    for (const [operation, latencyHist] of latencyHistograms.entries()) {
      const failureHist = failureHistograms.get(operation);
      
      if (latencyHist.totalSamples === 0) continue;

      const averageLatency = latencyHist.mean;
      const p99Latency = latencyHist.p99;
      const failureRate = failureHist?.failureRate || 0;

      let severity: 'critical' | 'high' | 'medium' | 'low' = 'low';
      const recommendations: string[] = [];

      // Determine severity based on latency and failure rate
      if (p99Latency > 100 || failureRate > 0.1) { // >100ms P99 or >10% failure rate
        severity = 'critical';
        recommendations.push('Immediate investigation required - high latency or failure rate');
      } else if (p99Latency > 50 || failureRate > 0.05) { // >50ms P99 or >5% failure rate
        severity = 'high';
        recommendations.push('Performance optimization recommended');
      } else if (p99Latency > 25 || failureRate > 0.01) { // >25ms P99 or >1% failure rate
        severity = 'medium';
        recommendations.push('Monitor closely for performance degradation');
      }

      // Add specific recommendations based on operation type
      if (operation.includes('validation') && p99Latency > 88) {
        recommendations.push('Validation latency exceeds 88ms threshold - review validation algorithms');
        recommendations.push('Consider caching validation results for repeated operations');
      }

      if (operation.includes('telemetry') && averageLatency > 5) {
        recommendations.push('Telemetry operations should be sub-5ms - review counter mutations');
      }

      if (operation.includes('bootstrap') && averageLatency > 100) {
        recommendations.push('Bootstrap taking too long - review service initialization order');
      }

      hotspots.push({
        operation,
        type: this.categorizeOperation(operation),
        averageLatency,
        p99Latency,
        failureRate,
        severity,
        recommendations
      });
    }

    // Sort by severity and latency
    return hotspots.sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
      if (severityDiff !== 0) return severityDiff;
      return b.p99Latency - a.p99Latency;
    });
  }

  /**
   * Generate comprehensive diagnostic report
   */
  generateReport(): DiagnosticReport {
    const reportEndTime = Date.now();
    const relevantMeasurements = this.measurements.filter(m => 
      m.timestamp >= this.reportStartTime && m.timestamp <= reportEndTime
    );

    // Get unique operation names
    const operationNames = [...new Set(relevantMeasurements.map(m => 
      m.name.replace('_failure', '').replace('_start', '').replace('_end', '')
    ))];

    // Calculate histograms
    const latencyHistograms = new Map<string, LatencyHistogram>();
    const failureHistograms = new Map<string, FailureHistogram>();

    for (const operation of operationNames) {
      latencyHistograms.set(operation, this.calculateLatencyHistogram(operation));
      failureHistograms.set(operation, this.calculateFailureHistogram(operation));
    }

    // Identify hotspots
    const hotspots = this.identifyHotspots(latencyHistograms, failureHistograms);

    // Calculate summary statistics
    const totalOperations = relevantMeasurements.filter(m => !m.name.includes('_failure')).length;
    const totalFailures = relevantMeasurements.filter(m => m.name.includes('_failure')).length;
    const overallFailureRate = totalOperations > 0 ? totalFailures / totalOperations : 0;
    
    const allLatencies = relevantMeasurements
      .filter(m => !m.name.includes('_failure'))
      .map(m => m.duration);
    const averageLatency = allLatencies.length > 0 
      ? allLatencies.reduce((a, b) => a + b, 0) / allLatencies.length 
      : 0;

    // Get specific metrics
    const validationHist = latencyHistograms.get('validation') || latencyHistograms.get('validateMatrix');
    const telemetryHist = latencyHistograms.get('telemetry') || latencyHistograms.get('trackOperation');
    const bootstrapHist = latencyHistograms.get('bootstrap') || latencyHistograms.get('initialization');

    const report: DiagnosticReport = {
      timestamp: reportEndTime,
      reportPeriod: [this.reportStartTime, reportEndTime],
      measurements: relevantMeasurements,
      latencyHistograms,
      failureHistograms,
      hotspots,
      summary: {
        totalOperations,
        averageLatency,
        overallFailureRate,
        criticalHotspots: hotspots.filter(h => h.severity === 'critical').length,
        validationLatencyP99: validationHist?.p99 || 0,
        telemetryLatencyP99: telemetryHist?.p99 || 0,
        bootstrapLatency: bootstrapHist?.mean || 0
      }
    };

    logger.info('Diagnostic report generated', {
      measurements: relevantMeasurements.length,
      operations: operationNames.length,
      hotspots: hotspots.length,
      criticalHotspots: report.summary.criticalHotspots
    });

    return report;
  }

  /**
   * Reset diagnostic data
   */
  reset(): void {
    this.measurements.length = 0;
    this.reportStartTime = Date.now();
    performance.clearMarks();
    performance.clearMeasures();
    
    logger.info('Diagnostic data reset');
  }

  /**
   * Get current measurement count
   */
  getMeasurementCount(): number {
    return this.measurements.length;
  }

  /**
   * Export measurements as JSON for external analysis
   */
  exportMeasurements(): string {
    return JSON.stringify({
      timestamp: Date.now(),
      measurements: this.measurements,
      buckets: this.latencyBuckets
    }, null, 2);
  }
}

// Export singleton instance
export const matrixServiceDiagnostics = new MatrixServiceDiagnostics();
