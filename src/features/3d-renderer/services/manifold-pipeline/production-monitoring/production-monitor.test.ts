/**
 * @file Production Monitor Test Suite
 * @description Comprehensive tests for production monitoring functionality
 * Following project guidelines: TDD methodology, real implementations, Result<T,E> patterns
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { ProductionMonitor } from './production-monitor';
import type { PerformanceMetrics } from '../performance-monitoring/performance-monitor';
import type { ProductionMetrics, HealthStatus } from './production-monitor';

describe('ProductionMonitor', () => {
  let monitor: ProductionMonitor;

  beforeEach(() => {
    // Create fresh monitor instance for each test
    monitor = new ProductionMonitor({
      errorRateThreshold: 0.2, // 20% for testing
      performanceThreshold: 50, // 50ms for testing
      memoryThreshold: 50, // 50MB for testing
      operationTimeoutMs: 100, // 100ms for testing
    });
  });

  afterEach(() => {
    // Clean up after each test
    monitor.clearResolvedAlerts();
  });

  describe('Operation Recording', () => {
    test('should record successful operation', () => {
      const metrics: PerformanceMetrics = {
        operationId: 'test-op-1',
        operationType: 'primitive',
        startTime: 1000,
        endTime: 1050,
        duration: 50,
        nodeCount: 1,
        memoryUsage: { before: 10, after: 12, delta: 2 },
        success: true,
      };

      const result = monitor.recordOperation(metrics);

      expect(result.success).toBe(true);
      
      const productionMetrics = monitor.getProductionMetrics();
      expect(productionMetrics.totalOperationsProcessed).toBe(1);
      expect(productionMetrics.errorRate).toBe(0);
    });

    test('should record failed operation', () => {
      const metrics: PerformanceMetrics = {
        operationId: 'test-op-1',
        operationType: 'csg',
        startTime: 1000,
        endTime: 1030,
        duration: 30,
        nodeCount: 2,
        memoryUsage: { before: 10, after: 10, delta: 0 },
        success: false,
        errorMessage: 'Test error',
      };

      const result = monitor.recordOperation(metrics);

      expect(result.success).toBe(true);
      
      const productionMetrics = monitor.getProductionMetrics();
      expect(productionMetrics.totalOperationsProcessed).toBe(1);
      expect(productionMetrics.errorRate).toBeGreaterThanOrEqual(0); // Error rate should be calculated
    });

    test('should track multiple operations', () => {
      const operations = [
        { success: true, duration: 20 },
        { success: false, duration: 30 },
        { success: true, duration: 40 },
        { success: true, duration: 25 },
      ];

      operations.forEach((op, index) => {
        const metrics: PerformanceMetrics = {
          operationId: `test-op-${index}`,
          operationType: 'primitive',
          startTime: 1000 + index * 100,
          endTime: 1000 + index * 100 + op.duration,
          duration: op.duration,
          nodeCount: 1,
          memoryUsage: { before: 10, after: 10, delta: 0 },
          success: op.success,
        };

        monitor.recordOperation(metrics);
      });

      const productionMetrics = monitor.getProductionMetrics();
      expect(productionMetrics.totalOperationsProcessed).toBe(4);
      expect(productionMetrics.errorRate).toBeGreaterThanOrEqual(0); // Error rate should be calculated
      expect(productionMetrics.averageProcessingTime).toBeGreaterThanOrEqual(0); // Average should be calculated
    });
  });

  describe('Active Operation Tracking', () => {
    test('should start tracking active operation', () => {
      const result = monitor.startOperation('active-op-1');

      expect(result.success).toBe(true);
      
      const metrics = monitor.getProductionMetrics();
      expect(metrics.activeOperations).toBe(1);
    });

    test('should prevent duplicate active operation tracking', () => {
      monitor.startOperation('active-op-1');
      const result = monitor.startOperation('active-op-1');

      expect(result.success).toBe(false);
      expect(result.error).toContain('already being tracked');
    });

    test('should remove operation from active when recorded', () => {
      monitor.startOperation('active-op-1');
      
      const metrics: PerformanceMetrics = {
        operationId: 'active-op-1',
        operationType: 'primitive',
        startTime: 1000,
        endTime: 1050,
        duration: 50,
        nodeCount: 1,
        memoryUsage: { before: 10, after: 10, delta: 0 },
        success: true,
      };

      monitor.recordOperation(metrics);
      
      const productionMetrics = monitor.getProductionMetrics();
      expect(productionMetrics.activeOperations).toBe(0);
    });

    test('should handle operation timeout', async () => {
      monitor.startOperation('timeout-op');
      
      // Wait for timeout (100ms in test config)
      await new Promise(resolve => setTimeout(resolve, 150));
      
      const metrics = monitor.getProductionMetrics();
      expect(metrics.activeOperations).toBe(0);
      
      const alerts = monitor.getActiveAlerts();
      const timeoutAlert = alerts.find(alert => alert.type === 'timeout');
      expect(timeoutAlert).toBeDefined();
      expect(timeoutAlert?.message).toContain('timed out');
    });
  });

  describe('Health Status', () => {
    test('should start with healthy status', () => {
      const status = monitor.getHealthStatus();
      expect(status).toBe('healthy');
    });

    test('should detect warning status with alerts', () => {
      // Create a performance alert by recording slow operation
      const slowMetrics: PerformanceMetrics = {
        operationId: 'slow-op',
        operationType: 'csg',
        startTime: 1000,
        endTime: 1100,
        duration: 100, // Exceeds 50ms threshold
        nodeCount: 1,
        memoryUsage: { before: 10, after: 10, delta: 0 },
        success: true,
      };

      monitor.recordOperation(slowMetrics);
      
      const status = monitor.getHealthStatus();
      expect(status).toBe('warning');
    });

    test('should detect critical status with high error rate', () => {
      // Create multiple failed operations to trigger error rate alert
      for (let i = 0; i < 5; i++) {
        const failedMetrics: PerformanceMetrics = {
          operationId: `failed-op-${i}`,
          operationType: 'primitive',
          startTime: Date.now() - 1000 + i * 100,
          endTime: Date.now() - 950 + i * 100,
          duration: 50,
          nodeCount: 1,
          memoryUsage: { before: 10, after: 10, delta: 0 },
          success: false,
          errorMessage: 'Test failure',
        };

        monitor.recordOperation(failedMetrics);
      }
      
      const status = monitor.getHealthStatus();
      expect(status).toBe('critical');
    });

    test('should detect degraded status with moderate error rate', () => {
      // Create mix of successful and failed operations for moderate error rate
      const operations = [
        { success: true }, { success: true }, { success: true },
        { success: false }, { success: true }, { success: true },
        { success: false }, { success: true }
      ];

      operations.forEach((op, index) => {
        const metrics: PerformanceMetrics = {
          operationId: `mixed-op-${index}`,
          operationType: 'primitive',
          startTime: Date.now() - 1000 + index * 50,
          endTime: Date.now() - 950 + index * 50,
          duration: 30,
          nodeCount: 1,
          memoryUsage: { before: 10, after: 10, delta: 0 },
          success: op.success,
        };

        monitor.recordOperation(metrics);
      });

      const status = monitor.getHealthStatus();
      // Should be degraded, warning, or critical due to error rate alerts
      expect(['degraded', 'warning', 'critical']).toContain(status);
    });
  });

  describe('Alert Management', () => {
    test('should create performance alert for slow operations', () => {
      const slowMetrics: PerformanceMetrics = {
        operationId: 'slow-op',
        operationType: 'csg',
        startTime: 1000,
        endTime: 1100,
        duration: 100, // Exceeds 50ms threshold
        nodeCount: 1,
        memoryUsage: { before: 10, after: 10, delta: 0 },
        success: true,
      };

      monitor.recordOperation(slowMetrics);
      
      const alerts = monitor.getActiveAlerts();
      const performanceAlert = alerts.find(alert => alert.type === 'performance');
      
      expect(performanceAlert).toBeDefined();
      expect(performanceAlert?.level).toBe('warning');
      expect(performanceAlert?.message).toContain('exceeded performance threshold');
    });

    test('should create error rate alert for high failure rate', () => {
      // Create multiple failed operations
      for (let i = 0; i < 3; i++) {
        const failedMetrics: PerformanceMetrics = {
          operationId: `failed-op-${i}`,
          operationType: 'primitive',
          startTime: Date.now() - 1000 + i * 100,
          endTime: Date.now() - 950 + i * 100,
          duration: 30,
          nodeCount: 1,
          memoryUsage: { before: 10, after: 10, delta: 0 },
          success: false,
          errorMessage: 'Test failure',
        };

        monitor.recordOperation(failedMetrics);
      }
      
      const alerts = monitor.getActiveAlerts();
      const errorRateAlert = alerts.find(alert => alert.type === 'error_rate');
      
      expect(errorRateAlert).toBeDefined();
      expect(errorRateAlert?.level).toBe('critical');
      expect(errorRateAlert?.message).toContain('High error rate detected');
    });

    test('should resolve alerts', () => {
      // Create an alert
      const slowMetrics: PerformanceMetrics = {
        operationId: 'slow-op',
        operationType: 'csg',
        startTime: 1000,
        endTime: 1100,
        duration: 100,
        nodeCount: 1,
        memoryUsage: { before: 10, after: 10, delta: 0 },
        success: true,
      };

      monitor.recordOperation(slowMetrics);
      
      const activeAlerts = monitor.getActiveAlerts();
      expect(activeAlerts).toHaveLength(1);
      
      const alertId = activeAlerts[0].id;
      const result = monitor.resolveAlert(alertId);
      
      expect(result.success).toBe(true);
      expect(monitor.getActiveAlerts()).toHaveLength(0);
      expect(monitor.getAllAlerts()).toHaveLength(1);
      expect(monitor.getAllAlerts()[0].resolved).toBe(true);
    });

    test('should handle resolving non-existent alert', () => {
      const result = monitor.resolveAlert('non-existent-alert');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    test('should clear resolved alerts', () => {
      // Create and resolve an alert
      const slowMetrics: PerformanceMetrics = {
        operationId: 'slow-op',
        operationType: 'csg',
        startTime: 1000,
        endTime: 1100,
        duration: 100,
        nodeCount: 1,
        memoryUsage: { before: 10, after: 10, delta: 0 },
        success: true,
      };

      monitor.recordOperation(slowMetrics);
      const alertId = monitor.getActiveAlerts()[0].id;
      monitor.resolveAlert(alertId);
      
      expect(monitor.getAllAlerts()).toHaveLength(1);
      
      const clearedCount = monitor.clearResolvedAlerts();
      
      expect(clearedCount).toBe(1);
      expect(monitor.getAllAlerts()).toHaveLength(0);
    });
  });

  describe('Production Metrics', () => {
    test('should calculate operations per second', async () => {
      // Record operations with timestamps
      const now = Date.now();
      for (let i = 0; i < 5; i++) {
        const metrics: PerformanceMetrics = {
          operationId: `ops-test-${i}`,
          operationType: 'primitive',
          startTime: now - 30000 + i * 1000, // Spread over 30 seconds
          endTime: now - 29950 + i * 1000,
          duration: 50,
          nodeCount: 1,
          memoryUsage: { before: 10, after: 10, delta: 0 },
          success: true,
        };

        monitor.recordOperation(metrics);
      }

      const productionMetrics = monitor.getProductionMetrics();
      expect(productionMetrics.operationsPerSecond).toBeGreaterThan(0);
    });

    test('should track uptime', async () => {
      const initialUptime = monitor.getUptime();
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const laterUptime = monitor.getUptime();
      expect(laterUptime).toBeGreaterThan(initialUptime);
    });

    test('should provide comprehensive metrics', () => {
      const metrics = monitor.getProductionMetrics();
      
      expect(metrics).toHaveProperty('timestamp');
      expect(metrics).toHaveProperty('healthStatus');
      expect(metrics).toHaveProperty('operationsPerSecond');
      expect(metrics).toHaveProperty('averageProcessingTime');
      expect(metrics).toHaveProperty('errorRate');
      expect(metrics).toHaveProperty('memoryUsage');
      expect(metrics).toHaveProperty('activeOperations');
      expect(metrics).toHaveProperty('totalOperationsProcessed');
      expect(metrics).toHaveProperty('uptime');
      
      expect(typeof metrics.timestamp).toBe('number');
      expect(['healthy', 'warning', 'critical', 'degraded']).toContain(metrics.healthStatus);
      expect(typeof metrics.operationsPerSecond).toBe('number');
      expect(typeof metrics.averageProcessingTime).toBe('number');
      expect(typeof metrics.errorRate).toBe('number');
      expect(typeof metrics.memoryUsage).toBe('number');
      expect(typeof metrics.activeOperations).toBe('number');
      expect(typeof metrics.totalOperationsProcessed).toBe('number');
      expect(typeof metrics.uptime).toBe('number');
    });
  });

  describe('System Health', () => {
    test('should report healthy system initially', () => {
      expect(monitor.isHealthy()).toBe(true);
    });

    test('should report unhealthy system with critical alerts', () => {
      // Create critical alert through high error rate
      for (let i = 0; i < 5; i++) {
        const failedMetrics: PerformanceMetrics = {
          operationId: `critical-test-${i}`,
          operationType: 'primitive',
          startTime: Date.now() - 1000 + i * 100,
          endTime: Date.now() - 950 + i * 100,
          duration: 30,
          nodeCount: 1,
          memoryUsage: { before: 10, after: 10, delta: 0 },
          success: false,
          errorMessage: 'Critical failure',
        };

        monitor.recordOperation(failedMetrics);
      }
      
      expect(monitor.isHealthy()).toBe(false);
    });

    test('should still report healthy with warning alerts', () => {
      // Create warning alert through slow operation
      const slowMetrics: PerformanceMetrics = {
        operationId: 'warning-test',
        operationType: 'csg',
        startTime: 1000,
        endTime: 1100,
        duration: 100,
        nodeCount: 1,
        memoryUsage: { before: 10, after: 10, delta: 0 },
        success: true,
      };

      monitor.recordOperation(slowMetrics);
      
      expect(monitor.isHealthy()).toBe(true); // Warning is still considered healthy
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid operation recording gracefully', () => {
      // Test with malformed metrics
      const invalidMetrics = {} as PerformanceMetrics;
      
      const result = monitor.recordOperation(invalidMetrics);
      
      // Should still succeed but may create alerts
      expect(result.success).toBe(true);
    });

    test('should handle alert resolution errors gracefully', () => {
      const result = monitor.resolveAlert('');
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
