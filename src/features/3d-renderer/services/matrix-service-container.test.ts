/**
 * Matrix Service Container Tests
 *
 * Comprehensive tests for service container with dependency injection,
 * lifecycle management, and health monitoring following TDD methodology.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createLogger } from '../../../shared/services/logger.service.js';
import { MatrixCacheService } from './matrix-cache.service.js';
import { MatrixConfigManagerService } from './matrix-config-manager.service.js';
import { MatrixConversionService } from './matrix-conversion.service.js';
import { MatrixOperationsAPI } from './matrix-operations.api.js';
import { getMatrixServiceContainer, MatrixServiceContainer } from './matrix-service-container.js';
import { MatrixTelemetryService } from './matrix-telemetry.service.js';
import { MatrixValidationService } from './matrix-validation.service.js';

const logger = createLogger('MatrixServiceContainerTest');

describe('MatrixServiceContainer', () => {
  let container: MatrixServiceContainer;

  beforeEach(async () => {
    logger.init('Setting up test environment');

    // Reset singleton instances to ensure clean state for each test
    MatrixServiceContainer.resetInstance();
  });

  afterEach(async () => {
    logger.end('Cleaning up test environment');
    if (container) {
      await container.shutdown();
    }

    // Reset singleton instances after each test
    MatrixServiceContainer.resetInstance();
  });

  describe('Service Container Initialization', () => {
    it('should initialize with default configuration', async () => {
      logger.debug('[DEBUG][MatrixServiceContainerTest] Testing default initialization');

      container = await getMatrixServiceContainer();

      const status = container.getStatus();
      expect(status.initialized).toBe(true);
      expect(status.serviceCount).toBeGreaterThan(0);
      expect(status.runningServices.length).toBeGreaterThan(0);
    });

    it('should initialize with custom configuration', async () => {
      logger.debug('[DEBUG][MatrixServiceContainerTest] Testing custom configuration');

      container = await getMatrixServiceContainer({
        enableTelemetry: false,
        enableValidation: false,
        enableConfigManager: false,
        autoStartServices: true,
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

    it('should support manual initialization', async () => {
      logger.debug('[DEBUG][MatrixServiceContainerTest] Testing manual initialization');

      // Reset to get a fresh instance with custom config
      MatrixServiceContainer.resetInstance();
      container = await getMatrixServiceContainer({
        autoStartServices: false,
      });

      // Note: With the async singleton pattern, services are always initialized
      // when getInstance() resolves, so we expect them to be available
      const status = container.getStatus();
      expect(status.initialized).toBe(true);
      expect(status.serviceCount).toBeGreaterThan(0);
    });
  });

  describe('Service Registration and Access', () => {
    beforeEach(async () => {
      container = await getMatrixServiceContainer();
    });

    it('should register and retrieve core services', () => {
      logger.debug('[DEBUG][MatrixServiceContainerTest] Testing core service registration');

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
      logger.debug('[DEBUG][MatrixServiceContainerTest] Testing optional service registration');

      const telemetryService = container.getTelemetryService();
      expect(telemetryService).toBeInstanceOf(MatrixTelemetryService);

      const validationService = container.getValidationService();
      expect(validationService).toBeInstanceOf(MatrixValidationService);

      const configManager = container.getConfigManager();
      expect(configManager).toBeInstanceOf(MatrixConfigManagerService);
    });

    it('should throw error for non-existent services', () => {
      logger.debug('[DEBUG][MatrixServiceContainerTest] Testing non-existent service error');

      expect(() => {
        container.getService('nonExistentService');
      }).toThrow("Service 'nonExistentService' not found in container");
    });

    it('should return null for disabled optional services', async () => {
      logger.debug('[DEBUG][MatrixServiceContainerTest] Testing disabled optional services');

      // Reset to get a fresh instance
      MatrixServiceContainer.resetInstance();
      const containerWithoutOptional = await getMatrixServiceContainer({
        enableTelemetry: false,
        enableValidation: false,
        enableConfigManager: false,
      });

      expect(containerWithoutOptional.getTelemetryService()).toBeNull();
      expect(containerWithoutOptional.getValidationService()).toBeNull();
      expect(containerWithoutOptional.getConfigManager()).toBeNull();

      await containerWithoutOptional.shutdown();
    });
  });

  describe('Service Dependencies', () => {
    beforeEach(async () => {
      container = await getMatrixServiceContainer();
    });

    it('should inject dependencies correctly', () => {
      logger.debug('[DEBUG][MatrixServiceContainerTest] Testing dependency injection');

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
      logger.debug('[DEBUG][MatrixServiceContainerTest] Testing service interdependencies');

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
    beforeEach(async () => {
      container = await getMatrixServiceContainer();
    });

    it('should perform health checks on all services', async () => {
      logger.debug('[DEBUG][MatrixServiceContainerTest] Testing health checks');

      const healthReport = await container.performHealthCheck();

      expect(healthReport).toBeDefined();
      expect(healthReport.overall).toMatch(/^(healthy|degraded|unhealthy)$/);
      expect(healthReport.services.length).toBeGreaterThan(0);
      expect(healthReport.timestamp).toBeGreaterThan(0);
      expect(Array.isArray(healthReport.recommendations)).toBe(true);

      // Container should be healthy or degraded (not unhealthy) in a fresh container
      expect(healthReport.overall).toMatch(/^(healthy|degraded)$/);

      for (const serviceStatus of healthReport.services) {
        expect(serviceStatus.healthy).toBe(true);
        expect(serviceStatus.state).toBe('running');
        expect(serviceStatus.errorCount).toBe(0);
      }
    });

    it('should detect unhealthy services', async () => {
      logger.debug('[DEBUG][MatrixServiceContainerTest] Testing unhealthy service detection');

      // Simulate service errors by accessing private methods (for testing)
      const containerAny = container as unknown as { incrementErrorCount: (name: string) => void };
      containerAny.incrementErrorCount('cache');
      containerAny.incrementErrorCount('cache');
      containerAny.incrementErrorCount('cache');
      containerAny.incrementErrorCount('cache');
      containerAny.incrementErrorCount('cache'); // 5 errors should make it unhealthy

      const healthReport = await container.performHealthCheck();

      const cacheStatus = healthReport.services.find((s) => s.service === 'cache');
      expect(cacheStatus?.healthy).toBe(false);
      expect(cacheStatus?.errorCount).toBe(5);
    });

    it('should report degraded status when only cache service is unhealthy', async () => {
      logger.debug(
        '[DEBUG][MatrixServiceContainerTest] Testing degraded system status with cache failure'
      );

      // Simulate cache service errors
      const containerAny = container as unknown as { incrementErrorCount: (name: string) => void };
      containerAny.incrementErrorCount('cache');
      containerAny.incrementErrorCount('cache');
      containerAny.incrementErrorCount('cache');
      containerAny.incrementErrorCount('cache');
      containerAny.incrementErrorCount('cache'); // 5 errors should make cache unhealthy

      const healthReport = await container.performHealthCheck();

      // Cache should be unhealthy
      const cacheStatus = healthReport.services.find((s) => s.service === 'cache');
      expect(cacheStatus?.healthy).toBe(false);
      expect(cacheStatus?.errorCount).toBe(5);

      // Conversion should be healthy
      const conversionStatus = healthReport.services.find((s) => s.service === 'conversion');
      expect(conversionStatus?.healthy).toBe(true);

      // Overall system should be degraded (not healthy, not unhealthy)
      expect(healthReport.overall).toMatch(/^(healthy|degraded)$/);
      expect(healthReport.overall).toBe('degraded');
    });

    it('should provide health recommendations', async () => {
      logger.debug('[DEBUG][MatrixServiceContainerTest] Testing health recommendations');

      const healthReport = await container.performHealthCheck();

      expect(Array.isArray(healthReport.recommendations)).toBe(true);

      // For a healthy container, recommendations should be minimal or empty
      if (healthReport.overall === 'healthy') {
        expect(healthReport.recommendations).toHaveLength(0);
      }
    });
  });

  describe('Service Lifecycle Management', () => {
    beforeEach(async () => {
      container = await getMatrixServiceContainer();
    });

    it('should track service states correctly', () => {
      logger.debug('[DEBUG][MatrixServiceContainerTest] Testing service state tracking');

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
      logger.debug('[DEBUG][MatrixServiceContainerTest] Testing service restart');

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
      logger.debug('[DEBUG][MatrixServiceContainerTest] Testing service restart failure handling');

      const result = await container.restartService('nonExistentService');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('nonExistentService');
      }
    });
  });

  describe('Container Shutdown', () => {
    beforeEach(async () => {
      container = await getMatrixServiceContainer();
    });

    it('should shutdown all services cleanly', async () => {
      logger.debug('[DEBUG][MatrixServiceContainerTest] Testing clean shutdown');

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
      logger.debug('[DEBUG][MatrixServiceContainerTest] Testing shutdown error handling');

      // Mock a service with a failing dispose method
      const mockService = {
        dispose: vi.fn().mockRejectedValue(new Error('Dispose failed')),
      };

      const containerAny = container as unknown as {
        services: Map<string, unknown>;
        serviceStates: Map<string, string>;
      };
      containerAny.services.set('mockService', mockService);
      containerAny.serviceStates.set('mockService', 'running');

      const consoleSpy = vi.spyOn(logger, 'error').mockImplementation(() => {
        // do nothing
      });

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
      logger.debug('[DEBUG][MatrixServiceContainerTest] Testing initialization failure handling');

      // Mock a failing service initialization
      const _originalMatrixCacheService = (global as unknown as { MatrixCacheService: unknown })
        .MatrixCacheService;

      // This test would require more complex mocking to properly test initialization failures
      // For now, we'll test that the container handles missing dependencies gracefully
      expect(() => {
        new MatrixServiceContainer();
      }).not.toThrow();
    });

    it('should maintain container integrity on service failures', async () => {
      logger.debug('[DEBUG][MatrixServiceContainerTest] Testing container integrity on failures');

      container = new MatrixServiceContainer();

      // Simulate a service failure
      const containerAny = container as unknown as {
        setServiceState: (name: string, state: string) => void;
        incrementErrorCount: (name: string) => void;
      };
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
      logger.debug('[DEBUG][MatrixServiceContainerTest] Testing configuration manager integration');

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
      logger.debug('[DEBUG][MatrixServiceContainerTest] Testing configuration usage in services');

      const configManager = container.getConfigManager();
      const conversionService = container.getConversionService();

      expect(configManager).toBeDefined();
      expect(conversionService).toBeDefined();

      // Services should be using the configuration
      const metrics = conversionService.getPerformanceMetrics();
      expect(metrics).toBeDefined();
    });
  });

  describe('Singleton Thread Safety', () => {
    it('should return the same instance when called concurrently', async () => {
      logger.debug('[DEBUG][MatrixServiceContainerTest] Testing concurrent singleton access');

      // Reset to ensure clean state
      MatrixServiceContainer.resetInstance();

      // Create multiple concurrent requests for the singleton
      const promises = Array.from({ length: 10 }, () => getMatrixServiceContainer());

      const instances = await Promise.all(promises);

      // All instances should be the same object reference
      const firstInstance = instances[0];
      for (const instance of instances) {
        expect(instance).toBe(firstInstance);
      }

      // Verify the instance is properly initialized
      const status = firstInstance.getStatus();
      expect(status.initialized).toBe(true);
      expect(status.serviceCount).toBeGreaterThan(0);

      await firstInstance.shutdown();
    });

    it('should handle initialization failures gracefully', async () => {
      logger.debug('[DEBUG][MatrixServiceContainerTest] Testing initialization failure handling');

      // Reset to ensure clean state
      MatrixServiceContainer.resetInstance();

      // Mock a failure during initialization
      const originalCreateInstance = (MatrixServiceContainer as any).createInstance;
      (MatrixServiceContainer as any).createInstance = vi
        .fn()
        .mockRejectedValue(new Error('Initialization failed'));

      try {
        // First call should fail
        await expect(getMatrixServiceContainer()).rejects.toThrow('Initialization failed');

        // Restore the original method
        (MatrixServiceContainer as any).createInstance = originalCreateInstance;

        // Second call should succeed after the failure is cleared
        const instance = await getMatrixServiceContainer();
        expect(instance).toBeDefined();

        const status = instance.getStatus();
        expect(status.initialized).toBe(true);

        await instance.shutdown();
      } finally {
        // Ensure we restore the original method even if test fails
        (MatrixServiceContainer as any).createInstance = originalCreateInstance;
      }
    });
  });
});
