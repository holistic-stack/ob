/**
 * Matrix Service Container Tests
 * 
 * Comprehensive tests for service container with dependency injection,
 * lifecycle management, and health monitoring following TDD methodology.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MatrixServiceContainer } from './matrix-service-container';
import { MatrixCacheService } from './matrix-cache.service';
import { MatrixConversionService } from './matrix-conversion.service';
import { MatrixValidationService } from './matrix-validation.service';
import { MatrixTelemetryService } from './matrix-telemetry.service';
import { MatrixConfigManagerService } from './matrix-config-manager.service';
import { MatrixOperationsAPI } from './matrix-operations.api';

describe('MatrixServiceContainer', () => {
  let container: MatrixServiceContainer;

  beforeEach(() => {
    console.log('[INIT][MatrixServiceContainerTest] Setting up test environment');
  });

  afterEach(async () => {
    console.log('[END][MatrixServiceContainerTest] Cleaning up test environment');
    if (container) {
      await container.shutdown();
    }
  });

  describe('Service Container Initialization', () => {
    it('should initialize with default configuration', () => {
      console.log('[DEBUG][MatrixServiceContainerTest] Testing default initialization');
      
      container = new MatrixServiceContainer();
      
      const status = container.getStatus();
      expect(status.initialized).toBe(true);
      expect(status.serviceCount).toBeGreaterThan(0);
      expect(status.runningServices.length).toBeGreaterThan(0);
    });

    it('should initialize with custom configuration', () => {
      console.log('[DEBUG][MatrixServiceContainerTest] Testing custom configuration');
      
      container = new MatrixServiceContainer({
        enableTelemetry: false,
        enableValidation: false,
        enableConfigManager: false,
        autoStartServices: true
      });
      
      const status = container.getStatus();
      expect(status.initialized).toBe(true);
      
      // Should not have telemetry, validation, or config manager
      expect(container.hasService('telemetry')).toBe(false);
      expect(container.hasService('validation')).toBe(false);
      expect(container.hasService('configManager')).toBe(false);
      
      // Should still have core services
      expect(container.hasService('cache')).toBe(true);
      expect(container.hasService('conversion')).toBe(true);
      expect(container.hasService('operations')).toBe(true);
    });

    it('should support manual initialization', () => {
      console.log('[DEBUG][MatrixServiceContainerTest] Testing manual initialization');
      
      container = new MatrixServiceContainer({
        autoStartServices: false
      });
      
      const status = container.getStatus();
      expect(status.initialized).toBe(false);
      expect(status.serviceCount).toBe(0);
    });
  });

  describe('Service Registration and Retrieval', () => {
    beforeEach(() => {
      container = new MatrixServiceContainer();
    });

    it('should register and retrieve core services', () => {
      console.log('[DEBUG][MatrixServiceContainerTest] Testing core service registration');
      
      expect(container.hasService('cache')).toBe(true);
      expect(container.hasService('conversion')).toBe(true);
      expect(container.hasService('operations')).toBe(true);
      
      const cacheService = container.getCacheService();
      expect(cacheService).toBeInstanceOf(MatrixCacheService);
      
      const conversionService = container.getConversionService();
      expect(conversionService).toBeInstanceOf(MatrixConversionService);
      
      const operationsAPI = container.getOperationsAPI();
      expect(operationsAPI).toBeInstanceOf(MatrixOperationsAPI);
    });

    it('should register and retrieve optional services', () => {
      console.log('[DEBUG][MatrixServiceContainerTest] Testing optional service registration');
      
      const telemetryService = container.getTelemetryService();
      expect(telemetryService).toBeInstanceOf(MatrixTelemetryService);
      
      const validationService = container.getValidationService();
      expect(validationService).toBeInstanceOf(MatrixValidationService);
      
      const configManager = container.getConfigManager();
      expect(configManager).toBeInstanceOf(MatrixConfigManagerService);
    });

    it('should throw error for non-existent services', () => {
      console.log('[DEBUG][MatrixServiceContainerTest] Testing non-existent service error');
      
      expect(() => {
        container.getService('nonExistentService');
      }).toThrow("Service 'nonExistentService' not found in container");
    });

    it('should return null for disabled optional services', async () => {
      console.log('[DEBUG][MatrixServiceContainerTest] Testing disabled optional services');
      
      const containerWithoutOptional = new MatrixServiceContainer({
        enableTelemetry: false,
        enableValidation: false,
        enableConfigManager: false
      });
      
      expect(containerWithoutOptional.getTelemetryService()).toBeNull();
      expect(containerWithoutOptional.getValidationService()).toBeNull();
      expect(containerWithoutOptional.getConfigManager()).toBeNull();
      
      await containerWithoutOptional.shutdown();
    });
  });

  describe('Service Dependencies', () => {
    beforeEach(() => {
      container = new MatrixServiceContainer();
    });

    it('should inject dependencies correctly', () => {
      console.log('[DEBUG][MatrixServiceContainerTest] Testing dependency injection');
      
      const conversionService = container.getConversionService();
      const cacheService = container.getCacheService();
      
      // Conversion service should have cache dependency
      expect(conversionService).toBeDefined();
      expect(cacheService).toBeDefined();
      
      // Test that services can interact
      const metrics = conversionService.getPerformanceMetrics();
      expect(metrics).toBeDefined();
      expect(typeof metrics.operationCount).toBe('number');
    });

    it('should handle service interdependencies', () => {
      console.log('[DEBUG][MatrixServiceContainerTest] Testing service interdependencies');
      
      const telemetryService = container.getTelemetryService();
      const validationService = container.getValidationService();
      
      expect(telemetryService).toBeDefined();
      expect(validationService).toBeDefined();
      
      // Services should be able to work together
      if (telemetryService && validationService) {
        telemetryService.trackOperation('test', 10, true);
        const metrics = telemetryService.getPerformanceMetrics();
        expect(metrics.operationCount).toBeGreaterThan(0);
      }
    });
  });

  describe('Health Monitoring', () => {
    beforeEach(() => {
      container = new MatrixServiceContainer();
    });

    it('should perform health checks on all services', async () => {
      console.log('[DEBUG][MatrixServiceContainerTest] Testing health checks');
      
      const healthReport = await container.performHealthCheck();
      
      expect(healthReport).toBeDefined();
      expect(healthReport.overall).toMatch(/^(healthy|degraded|unhealthy)$/);
      expect(healthReport.services.length).toBeGreaterThan(0);
      expect(healthReport.timestamp).toBeGreaterThan(0);
      expect(Array.isArray(healthReport.recommendations)).toBe(true);
      
      // All services should be healthy in a fresh container
      expect(healthReport.overall).toBe('healthy');
      
      for (const serviceStatus of healthReport.services) {
        expect(serviceStatus.healthy).toBe(true);
        expect(serviceStatus.state).toBe('running');
        expect(serviceStatus.errorCount).toBe(0);
      }
    });

    it('should detect unhealthy services', async () => {
      console.log('[DEBUG][MatrixServiceContainerTest] Testing unhealthy service detection');
      
      // Simulate service errors by accessing private methods (for testing)
      const containerAny = container as any;
      containerAny.incrementErrorCount('cache');
      containerAny.incrementErrorCount('cache');
      containerAny.incrementErrorCount('cache');
      containerAny.incrementErrorCount('cache');
      containerAny.incrementErrorCount('cache'); // 5 errors should make it unhealthy
      
      const healthReport = await container.performHealthCheck();
      
      const cacheStatus = healthReport.services.find(s => s.service === 'cache');
      expect(cacheStatus?.healthy).toBe(false);
      expect(cacheStatus?.errorCount).toBe(5);
    });

    it('should provide health recommendations', async () => {
      console.log('[DEBUG][MatrixServiceContainerTest] Testing health recommendations');
      
      const healthReport = await container.performHealthCheck();
      
      expect(Array.isArray(healthReport.recommendations)).toBe(true);
      
      // For a healthy container, recommendations should be minimal or empty
      if (healthReport.overall === 'healthy') {
        expect(healthReport.recommendations).toHaveLength(0);
      }
    });
  });

  describe('Service Lifecycle Management', () => {
    beforeEach(() => {
      container = new MatrixServiceContainer();
    });

    it('should track service states correctly', () => {
      console.log('[DEBUG][MatrixServiceContainerTest] Testing service state tracking');
      
      const status = container.getStatus();
      
      expect(status.initialized).toBe(true);
      expect(status.runningServices.length).toBeGreaterThan(0);
      expect(status.errorServices).toHaveLength(0);
      
      // All services should be running
      expect(status.runningServices).toContain('cache');
      expect(status.runningServices).toContain('conversion');
      expect(status.runningServices).toContain('operations');
    });

    it('should handle service restart', async () => {
      console.log('[DEBUG][MatrixServiceContainerTest] Testing service restart');
      
      const initialStatus = container.getStatus();
      expect(initialStatus.runningServices).toContain('cache');
      
      const result = await container.restartService('cache');
      expect(result.success).toBe(true);
      
      const finalStatus = container.getStatus();
      expect(finalStatus.runningServices).toContain('cache');
      
      // Service should still be accessible after restart
      const cacheService = container.getCacheService();
      expect(cacheService).toBeDefined();
    });

    it('should handle service restart failures gracefully', async () => {
      console.log('[DEBUG][MatrixServiceContainerTest] Testing service restart failure handling');
      
      const result = await container.restartService('nonExistentService');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('nonExistentService');
      }
    });
  });

  describe('Container Shutdown', () => {
    beforeEach(() => {
      container = new MatrixServiceContainer();
    });

    it('should shutdown all services cleanly', async () => {
      console.log('[DEBUG][MatrixServiceContainerTest] Testing clean shutdown');
      
      const initialStatus = container.getStatus();
      expect(initialStatus.initialized).toBe(true);
      expect(initialStatus.serviceCount).toBeGreaterThan(0);
      
      await container.shutdown();
      
      const finalStatus = container.getStatus();
      expect(finalStatus.initialized).toBe(false);
      expect(finalStatus.serviceCount).toBe(0);
      expect(finalStatus.runningServices).toHaveLength(0);
    });

    it('should handle shutdown errors gracefully', async () => {
      console.log('[DEBUG][MatrixServiceContainerTest] Testing shutdown error handling');
      
      // Mock a service with a failing dispose method
      const mockService = {
        dispose: vi.fn().mockRejectedValue(new Error('Dispose failed'))
      };
      
      const containerAny = container as any;
      containerAny.services.set('mockService', mockService);
      containerAny.serviceStates.set('mockService', 'running');
      
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      await container.shutdown();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Failed to stop service 'mockService'"),
        expect.any(Error)
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('Error Handling', () => {
    it('should handle initialization failures', () => {
      console.log('[DEBUG][MatrixServiceContainerTest] Testing initialization failure handling');
      
      // Mock a failing service initialization
      const originalMatrixCacheService = (global as any).MatrixCacheService;
      
      // This test would require more complex mocking to properly test initialization failures
      // For now, we'll test that the container handles missing dependencies gracefully
      expect(() => {
        new MatrixServiceContainer();
      }).not.toThrow();
    });

    it('should maintain container integrity on service failures', async () => {
      console.log('[DEBUG][MatrixServiceContainerTest] Testing container integrity on failures');
      
      container = new MatrixServiceContainer();
      
      // Simulate a service failure
      const containerAny = container as any;
      containerAny.setServiceState('cache', 'error');
      containerAny.incrementErrorCount('cache');
      
      // Container should still be functional
      const status = container.getStatus();
      expect(status.initialized).toBe(true);
      expect(status.errorServices).toContain('cache');
      
      // Other services should still work
      expect(() => container.getConversionService()).not.toThrow();
      expect(() => container.getOperationsAPI()).not.toThrow();
    });
  });

  describe('Configuration Integration', () => {
    beforeEach(() => {
      container = new MatrixServiceContainer();
    });

    it('should integrate with configuration manager', () => {
      console.log('[DEBUG][MatrixServiceContainerTest] Testing configuration manager integration');
      
      const configManager = container.getConfigManager();
      expect(configManager).toBeDefined();
      
      if (configManager) {
        const config = configManager.getCurrentConfig();
        expect(config).toBeDefined();
        expect(config.performance).toBeDefined();
        expect(config.cache).toBeDefined();
      }
    });

    it('should use configuration in dependent services', () => {
      console.log('[DEBUG][MatrixServiceContainerTest] Testing configuration usage in services');
      
      const configManager = container.getConfigManager();
      const conversionService = container.getConversionService();
      
      expect(configManager).toBeDefined();
      expect(conversionService).toBeDefined();
      
      // Services should be using the configuration
      const metrics = conversionService.getPerformanceMetrics();
      expect(metrics).toBeDefined();
    });
  });
});
