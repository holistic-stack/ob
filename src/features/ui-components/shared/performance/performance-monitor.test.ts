/**
 * Performance Monitor Tests
 * 
 * Comprehensive test suite for the performance monitoring utilities
 * following TDD methodology and functional programming patterns.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  PerformanceMonitor,
  globalPerformanceMonitor,
  measurePerformance,
  measureSyncPerformance,
  PERFORMANCE_TARGETS,
  type PerformanceMetrics,
  type PerformanceReport
} from './performance-monitor';

describe('PerformanceMonitor', () => {
  let monitor: PerformanceMonitor;

  beforeEach(() => {
    monitor = new PerformanceMonitor();
    vi.clearAllMocks();
  });

  describe('timing operations', () => {
    it('should start and end timing correctly', () => {
      // Arrange
      const operation = 'test_operation';

      // Act
      monitor.startTiming(operation);
      const metrics = monitor.endTiming(operation);

      // Assert
      expect(metrics).toBeDefined();
      expect(metrics?.operation).toBe(operation);
      expect(metrics?.duration).toBeGreaterThan(0);
      expect(typeof metrics?.withinTarget).toBe('boolean');
    });

    it('should return null for unknown operation', () => {
      // Act
      const metrics = monitor.endTiming('unknown_operation');

      // Assert
      expect(metrics).toBeNull();
    });

    it('should calculate duration correctly', () => {
      // Arrange
      const operation = 'duration_test';
      const startTime = performance.now();

      // Act
      monitor.startTiming(operation);
      // Simulate some work
      const endTime = performance.now();
      const metrics = monitor.endTiming(operation);

      // Assert
      expect(metrics?.duration).toBeGreaterThanOrEqual(0);
      expect(metrics?.startTime).toBeLessThanOrEqual(endTime);
      expect(metrics?.endTime).toBeGreaterThanOrEqual(startTime);
    });
  });

  describe('target validation', () => {
    it('should validate AST parsing target correctly', () => {
      // Arrange
      const operation = 'ast_parsing';
      monitor.startTiming(operation);

      // Act
      const metrics = monitor.endTiming(operation);

      // Assert
      expect(metrics?.target).toBe(PERFORMANCE_TARGETS.AST_PARSING);
    });

    it('should validate CSG2 conversion target correctly', () => {
      // Arrange
      const operation = 'csg2_conversion';
      monitor.startTiming(operation);

      // Act
      const metrics = monitor.endTiming(operation);

      // Assert
      expect(metrics?.target).toBe(PERFORMANCE_TARGETS.CSG2_CONVERSION);
    });

    it('should validate mesh creation target correctly', () => {
      // Arrange
      const operation = 'mesh_creation';
      monitor.startTiming(operation);

      // Act
      const metrics = monitor.endTiming(operation);

      // Assert
      expect(metrics?.target).toBe(PERFORMANCE_TARGETS.MESH_CREATION);
    });

    it('should use default target for unknown operations', () => {
      // Arrange
      const operation = 'unknown_operation';
      monitor.startTiming(operation);

      // Act
      const metrics = monitor.endTiming(operation);

      // Assert
      expect(metrics?.target).toBe(PERFORMANCE_TARGETS.TOTAL_PIPELINE);
    });
  });

  describe('report generation', () => {
    it('should generate empty report when no metrics', () => {
      // Act
      const report = monitor.generateReport();

      // Assert
      expect(report.totalDuration).toBe(0);
      expect(report.metrics).toHaveLength(0);
      expect(report.overallScore).toBe(0);
      expect(report.recommendations).toContain('No performance data available');
    });

    it('should generate report with metrics', () => {
      // Arrange
      monitor.startTiming('test_op1');
      monitor.endTiming('test_op1');
      monitor.startTiming('test_op2');
      monitor.endTiming('test_op2');

      // Act
      const report = monitor.generateReport();

      // Assert
      expect(report.metrics).toHaveLength(2);
      expect(report.totalDuration).toBeGreaterThan(0);
      expect(report.overallScore).toBeGreaterThanOrEqual(0);
      expect(report.overallScore).toBeLessThanOrEqual(100);
      expect(Array.isArray(report.recommendations)).toBe(true);
    });

    it('should calculate overall score correctly', () => {
      // Arrange - Create metrics that should pass targets
      const fastOperation = 'ast_parsing';
      monitor.startTiming(fastOperation);
      // Simulate very fast operation
      const metrics = monitor.endTiming(fastOperation);
      
      // Manually set a fast duration for testing
      if (metrics) {
        (metrics as any).duration = 50; // Well under 300ms target
        (metrics as any).withinTarget = true;
      }

      // Act
      const report = monitor.generateReport();

      // Assert
      expect(report.overallScore).toBeGreaterThan(0);
    });
  });

  describe('metrics filtering and analysis', () => {
    it('should filter metrics by operation', () => {
      // Arrange
      monitor.startTiming('operation_a');
      monitor.endTiming('operation_a');
      monitor.startTiming('operation_b');
      monitor.endTiming('operation_b');
      monitor.startTiming('operation_a');
      monitor.endTiming('operation_a');

      // Act
      const operationAMetrics = monitor.getMetricsForOperation('operation_a');
      const operationBMetrics = monitor.getMetricsForOperation('operation_b');

      // Assert
      expect(operationAMetrics).toHaveLength(2);
      expect(operationBMetrics).toHaveLength(1);
    });

    it('should calculate average duration correctly', () => {
      // Arrange
      const operation = 'test_operation';
      monitor.startTiming(operation);
      monitor.endTiming(operation);
      monitor.startTiming(operation);
      monitor.endTiming(operation);

      // Act
      const average = monitor.getAverageDuration(operation);

      // Assert
      expect(average).toBeGreaterThan(0);
      expect(typeof average).toBe('number');
    });

    it('should return 0 average for unknown operation', () => {
      // Act
      const average = monitor.getAverageDuration('unknown_operation');

      // Assert
      expect(average).toBe(0);
    });
  });

  describe('cleanup', () => {
    it('should clear all metrics', () => {
      // Arrange
      monitor.startTiming('test_op');
      monitor.endTiming('test_op');

      // Act
      monitor.clearMetrics();
      const report = monitor.generateReport();

      // Assert
      expect(report.metrics).toHaveLength(0);
      expect(report.totalDuration).toBe(0);
    });
  });
});

describe('utility functions', () => {
  describe('measurePerformance', () => {
    it('should measure async function performance', async () => {
      // Arrange
      const testFunction = async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return 'test_result';
      };

      // Act
      const { result, metrics } = await measurePerformance('async_test', testFunction);

      // Assert
      expect(result).toBe('test_result');
      expect(metrics).toBeDefined();
      expect(metrics?.operation).toBe('async_test');
      expect(metrics?.duration).toBeGreaterThan(0);
    });

    it('should handle async function errors', async () => {
      // Arrange
      const errorFunction = async () => {
        throw new Error('Test error');
      };

      // Act & Assert
      await expect(measurePerformance('error_test', errorFunction)).rejects.toThrow('Test error');
    });
  });

  describe('measureSyncPerformance', () => {
    it('should measure sync function performance', () => {
      // Arrange
      const testFunction = () => {
        // Simulate some work
        let sum = 0;
        for (let i = 0; i < 1000; i++) {
          sum += i;
        }
        return sum;
      };

      // Act
      const { result, metrics } = measureSyncPerformance('sync_test', testFunction);

      // Assert
      expect(result).toBe(499500); // Sum of 0 to 999
      expect(metrics).toBeDefined();
      expect(metrics?.operation).toBe('sync_test');
      expect(metrics?.duration).toBeGreaterThan(0);
    });

    it('should handle sync function errors', () => {
      // Arrange
      const errorFunction = () => {
        throw new Error('Sync test error');
      };

      // Act & Assert
      expect(() => measureSyncPerformance('sync_error_test', errorFunction)).toThrow('Sync test error');
    });
  });
});

describe('global performance monitor', () => {
  it('should be available as singleton', () => {
    expect(globalPerformanceMonitor).toBeDefined();
    expect(globalPerformanceMonitor).toBeInstanceOf(PerformanceMonitor);
  });

  it('should maintain state across calls', () => {
    // Arrange
    globalPerformanceMonitor.clearMetrics();

    // Act
    globalPerformanceMonitor.startTiming('global_test');
    globalPerformanceMonitor.endTiming('global_test');
    const report = globalPerformanceMonitor.generateReport();

    // Assert
    expect(report.metrics).toHaveLength(1);
    expect(report.metrics[0].operation).toBe('global_test');
  });
});

describe('performance targets', () => {
  it('should have correct target values', () => {
    expect(PERFORMANCE_TARGETS.AST_PARSING).toBe(300);
    expect(PERFORMANCE_TARGETS.CSG2_CONVERSION).toBe(500);
    expect(PERFORMANCE_TARGETS.MESH_CREATION).toBe(200);
    expect(PERFORMANCE_TARGETS.SCENE_RENDERING).toBe(16);
    expect(PERFORMANCE_TARGETS.TOTAL_PIPELINE).toBe(1000);
  });
});
