/**
 * Matrix Telemetry Service Tests
 *
 * Comprehensive tests for matrix telemetry service with performance tracking,
 * regression detection, and reporting following TDD methodology.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MATRIX_CONFIG } from '../config/matrix-config';
import {
  type MatrixTelemetryDependencies,
  MatrixTelemetryService,
} from './matrix-telemetry.service';

describe('MatrixTelemetryService', () => {
  let service: MatrixTelemetryService;
  let dependencies: MatrixTelemetryDependencies;

  beforeEach(() => {
    console.log('[INIT][MatrixTelemetryServiceTest] Setting up test environment');

    // Setup dependencies
    dependencies = {
      config: MATRIX_CONFIG,
    };

    // Create service with dependencies
    service = new MatrixTelemetryService(dependencies);
  });

  afterEach(() => {
    console.log('[END][MatrixTelemetryServiceTest] Cleaning up test environment');
    service.reset();
  });

  describe('Operation Tracking', () => {
    it('should track successful operations', () => {
      console.log('[DEBUG][MatrixTelemetryServiceTest] Testing successful operation tracking');

      service.trackOperation('add', 5, true, {
        memoryUsage: 1024,
        matrixSize: [3, 3],
        additionalData: { test: true },
      });

      const metrics = service.getPerformanceMetrics();
      expect(metrics.operationCount).toBe(1);
      expect(metrics.totalExecutionTime).toBe(5);
      expect(metrics.averageExecutionTime).toBe(5);
      expect(metrics.failedOperations).toBe(0);
    });

    it('should track failed operations', () => {
      console.log('[DEBUG][MatrixTelemetryServiceTest] Testing failed operation tracking');

      service.trackOperation('inverse', 10, false);

      const metrics = service.getPerformanceMetrics();
      expect(metrics.operationCount).toBe(1);
      expect(metrics.failedOperations).toBe(1);
    });

    it('should track multiple operations', () => {
      console.log('[DEBUG][MatrixTelemetryServiceTest] Testing multiple operation tracking');

      service.trackOperation('add', 2, true);
      service.trackOperation('multiply', 8, true);
      service.trackOperation('transpose', 3, true);
      service.trackOperation('inverse', 15, false);

      const metrics = service.getPerformanceMetrics();
      expect(metrics.operationCount).toBe(4);
      expect(metrics.totalExecutionTime).toBe(13); // Only successful operations
      expect(metrics.averageExecutionTime).toBeCloseTo(4.33, 2);
      expect(metrics.failedOperations).toBe(1);
    });

    it('should track large matrix operations', () => {
      console.log('[DEBUG][MatrixTelemetryServiceTest] Testing large matrix operation tracking');

      const largeSize = Math.ceil(Math.sqrt(MATRIX_CONFIG.performance.largeMatrixThreshold)) + 1;

      service.trackOperation('multiply', 50, true, {
        matrixSize: [largeSize, largeSize],
      });

      const metrics = service.getPerformanceMetrics();
      expect(metrics.largeMatrixOperations).toBe(1);
    });
  });

  describe('Performance Regression Detection', () => {
    it('should detect minor performance regressions', () => {
      console.log('[DEBUG][MatrixTelemetryServiceTest] Testing minor regression detection');

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Track an operation that's 60% slower than baseline (minor regression)
      service.trackOperation('add', 1.6, true); // Baseline is 1ms, so 1.6ms is 60% slower

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[WARN][MatrixTelemetryService] Performance regression detected:'),
        expect.objectContaining({
          operation: 'add',
          severity: 'minor',
        })
      );

      consoleSpy.mockRestore();
    });

    it('should detect moderate performance regressions', () => {
      console.log('[DEBUG][MatrixTelemetryServiceTest] Testing moderate regression detection');

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Track an operation that's 150% slower than baseline (moderate regression)
      service.trackOperation('add', 2.5, true); // Baseline is 1ms, so 2.5ms is 150% slower

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[WARN][MatrixTelemetryService] Performance regression detected:'),
        expect.objectContaining({
          operation: 'add',
          severity: 'moderate',
        })
      );

      consoleSpy.mockRestore();
    });

    it('should detect severe performance regressions', () => {
      console.log('[DEBUG][MatrixTelemetryServiceTest] Testing severe regression detection');

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Track an operation that's 300% slower than baseline (severe regression)
      service.trackOperation('add', 4, true); // Baseline is 1ms, so 4ms is 300% slower

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[WARN][MatrixTelemetryService] Performance regression detected:'),
        expect.objectContaining({
          operation: 'add',
          severity: 'severe',
        })
      );

      consoleSpy.mockRestore();
    });

    it('should not detect regressions for operations within baseline', () => {
      console.log(
        '[DEBUG][MatrixTelemetryServiceTest] Testing no regression for normal operations'
      );

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Track an operation within normal performance range
      service.trackOperation('add', 0.8, true); // Baseline is 1ms, so 0.8ms is faster

      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('Performance regression detected')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Report Generation', () => {
    beforeEach(() => {
      // Setup some test data
      service.trackOperation('add', 2, true, { memoryUsage: 100 });
      service.trackOperation('multiply', 8, true, { memoryUsage: 200 });
      service.trackOperation('transpose', 3, true, { memoryUsage: 150 });
      service.trackOperation('inverse', 15, false, { memoryUsage: 300 });
      service.trackOperation('add', 1.8, true, { memoryUsage: 110 }); // Minor regression
    });

    it('should generate comprehensive telemetry report', () => {
      console.log('[DEBUG][MatrixTelemetryServiceTest] Testing comprehensive report generation');

      const report = service.generateReport();

      expect(report.summary.totalOperations).toBe(5);
      expect(report.summary.successRate).toBe(0.8); // 4 successful out of 5
      expect(report.summary.averageExecutionTime).toBeCloseTo(3.7, 1); // (2+8+3+1.8)/4
      expect(report.summary.memoryUsage).toBe(860); // Sum of all memory usage

      expect(report.operationBreakdown).toHaveProperty('add');
      expect(report.operationBreakdown).toHaveProperty('multiply');
      expect(report.operationBreakdown).toHaveProperty('transpose');
      expect(report.operationBreakdown).toHaveProperty('inverse');

      expect(report.operationBreakdown.add?.count).toBe(2);
      expect(report.operationBreakdown.add?.successRate).toBe(1);
      expect(report.operationBreakdown.inverse?.successRate).toBe(0);
    });

    it('should detect regressions in report period', () => {
      console.log('[DEBUG][MatrixTelemetryServiceTest] Testing regression detection in report');

      const report = service.generateReport();

      expect(report.performanceRegressions.length).toBeGreaterThan(0);
      const addRegression = report.performanceRegressions.find((r) => r.operation === 'add');
      expect(addRegression).toBeDefined();
      expect(addRegression?.severity).toBe('minor');
    });

    it('should generate appropriate recommendations', () => {
      console.log('[DEBUG][MatrixTelemetryServiceTest] Testing recommendation generation');

      const report = service.generateReport();

      expect(report.recommendations.length).toBeGreaterThan(0);
      expect(
        report.recommendations.some((r) => r.includes('regression') || r.includes('failure rate'))
      ).toBe(true);
    });

    it('should analyze performance trends', () => {
      console.log('[DEBUG][MatrixTelemetryServiceTest] Testing trend analysis');

      const report = service.generateReport();

      expect(report.trends).toHaveProperty('executionTimesTrend');
      expect(report.trends).toHaveProperty('memoryUsageTrend');
      expect(report.trends).toHaveProperty('errorRateTrend');

      expect(['improving', 'stable', 'degrading']).toContain(report.trends.executionTimesTrend);
      expect(['improving', 'stable', 'degrading']).toContain(report.trends.memoryUsageTrend);
      expect(['improving', 'stable', 'degrading']).toContain(report.trends.errorRateTrend);
    });

    it('should handle empty time periods', () => {
      console.log('[DEBUG][MatrixTelemetryServiceTest] Testing empty period handling');

      service.reset();
      const report = service.generateReport();

      expect(report.summary.totalOperations).toBe(0);
      expect(report.summary.successRate).toBe(1);
      expect(report.operationBreakdown).toEqual({});
      expect(report.performanceRegressions).toEqual([]);
      expect(report.recommendations).toContain('No operations recorded in this period');
    });

    it('should support custom time ranges', () => {
      console.log('[DEBUG][MatrixTelemetryServiceTest] Testing custom time range reporting');

      const now = Date.now();
      const oneHourAgo = now - 60 * 60 * 1000;

      const report = service.generateReport([oneHourAgo, now]);

      expect(report.summary.reportPeriod).toEqual([oneHourAgo, now]);
      expect(report.summary.totalOperations).toBeGreaterThan(0);
    });
  });

  describe('Performance Metrics', () => {
    it('should calculate accurate performance metrics', () => {
      console.log('[DEBUG][MatrixTelemetryServiceTest] Testing performance metrics calculation');

      service.trackOperation('add', 5, true, { memoryUsage: 100 });
      service.trackOperation('multiply', 10, true, { memoryUsage: 200 });
      service.trackOperation('inverse', 20, false, { memoryUsage: 300 });

      const metrics = service.getPerformanceMetrics();

      expect(metrics.operationCount).toBe(3);
      expect(metrics.totalExecutionTime).toBe(15); // Only successful operations
      expect(metrics.averageExecutionTime).toBe(7.5); // (5+10)/2
      expect(metrics.memoryUsage).toBe(600); // Sum of all memory usage
      expect(metrics.failedOperations).toBe(1);
    });

    it('should handle metrics with no operations', () => {
      console.log('[DEBUG][MatrixTelemetryServiceTest] Testing metrics with no operations');

      const metrics = service.getPerformanceMetrics();

      expect(metrics.operationCount).toBe(0);
      expect(metrics.totalExecutionTime).toBe(0);
      expect(metrics.averageExecutionTime).toBe(0);
      expect(metrics.memoryUsage).toBe(0);
      expect(metrics.failedOperations).toBe(0);
    });
  });

  describe('Data Management', () => {
    it('should maintain history size limit', () => {
      console.log('[DEBUG][MatrixTelemetryServiceTest] Testing history size limit');

      // Track more operations than the history limit (assuming 10000 limit)
      for (let i = 0; i < 15000; i++) {
        service.trackOperation('add', 1, true);
      }

      const metrics = service.getPerformanceMetrics();
      // Should only consider last 1000 operations for metrics
      expect(metrics.operationCount).toBeLessThanOrEqual(1000);
    });

    it('should reset telemetry data', () => {
      console.log('[DEBUG][MatrixTelemetryServiceTest] Testing telemetry reset');

      service.trackOperation('add', 5, true);
      service.trackOperation('multiply', 10, true);

      let metrics = service.getPerformanceMetrics();
      expect(metrics.operationCount).toBe(2);

      service.reset();

      metrics = service.getPerformanceMetrics();
      expect(metrics.operationCount).toBe(0);
      expect(metrics.totalExecutionTime).toBe(0);
    });
  });

  describe('Logging and Debugging', () => {
    it('should log operations when debugging is enabled', () => {
      console.log('[DEBUG][MatrixTelemetryServiceTest] Testing debug logging');

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      // Create service with debug logging enabled
      const debugConfig = {
        ...MATRIX_CONFIG,
        debug: {
          ...MATRIX_CONFIG.debug,
          enablePerformanceLogging: true,
        },
      } as any;

      const debugService = new MatrixTelemetryService({ config: debugConfig });
      debugService.trackOperation('add', 5, true);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[DEBUG][MatrixTelemetryService] add SUCCESS in 5ms')
      );

      consoleSpy.mockRestore();
    });

    it('should not log operations when debugging is disabled', () => {
      console.log('[DEBUG][MatrixTelemetryServiceTest] Testing disabled debug logging');

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      // Create service with debug logging disabled
      const debugConfig = {
        ...MATRIX_CONFIG,
        debug: {
          ...MATRIX_CONFIG.debug,
          enablePerformanceLogging: false,
        },
      } as any;

      const debugService = new MatrixTelemetryService({ config: debugConfig });
      debugService.trackOperation('add', 5, true);

      expect(consoleSpy).not.toHaveBeenCalledWith(expect.stringContaining('add SUCCESS in 5ms'));

      consoleSpy.mockRestore();
    });
  });

  describe('Regression Recommendations', () => {
    it('should provide specific recommendations for different operations', () => {
      console.log('[DEBUG][MatrixTelemetryServiceTest] Testing operation-specific recommendations');

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Test multiply operation regression
      service.trackOperation('multiply', 25, true); // Baseline is 5ms, so 25ms is severe

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Performance regression detected:'),
        expect.objectContaining({
          recommendations: expect.arrayContaining([
            expect.stringContaining('block matrix multiplication'),
          ]),
        })
      );

      consoleSpy.mockRestore();
    });

    it('should provide severity-appropriate recommendations', () => {
      console.log('[DEBUG][MatrixTelemetryServiceTest] Testing severity-based recommendations');

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Test severe regression
      service.trackOperation('inverse', 50, true); // Baseline is 10ms, so 50ms is severe

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Performance regression detected:'),
        expect.objectContaining({
          recommendations: expect.arrayContaining([
            expect.stringContaining('Immediate investigation required'),
          ]),
        })
      );

      consoleSpy.mockRestore();
    });
  });
});
