/**
 * @file Concurrent Store Integration Service Tests
 *
 * Tests for the ConcurrentStoreIntegrationService with performance monitoring.
 * Follows TDD approach with real store integration (no mocks for core functionality).
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createAppStore } from '../../../store/app-store';
import type { AppStore } from '../../../store/types/store.types';
import {
  type ConcurrentOperationResult,
  ConcurrentStoreErrorCode,
  ConcurrentStoreIntegrationService,
} from './concurrent-store-integration.service';

// Mock ResizeObserver for tests
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

describe('ConcurrentStoreIntegrationService', () => {
  let service: ConcurrentStoreIntegrationService;
  let store: AppStore;

  beforeEach(() => {
    // Create real store instance (no mocks for core functionality)
    const storeHook = createAppStore({
      enableDevtools: false,
      enablePersistence: false,
      debounceConfig: {
        parseDelayMs: 0,
        renderDelayMs: 0,
        saveDelayMs: 0,
      },
    });

    // Get the store instance from the hook
    store = storeHook.getState() as AppStore;

    service = new ConcurrentStoreIntegrationService(store);
  });

  afterEach(() => {
    service.dispose();
  });

  describe('initialization', () => {
    it('should initialize with store', () => {
      const newService = new ConcurrentStoreIntegrationService(store);
      expect(newService).toBeInstanceOf(ConcurrentStoreIntegrationService);
      newService.dispose();
    });

    it('should initialize without store', () => {
      const newService = new ConcurrentStoreIntegrationService();
      expect(newService).toBeInstanceOf(ConcurrentStoreIntegrationService);
      newService.dispose();
    });

    it('should allow setting store after initialization', () => {
      const newService = new ConcurrentStoreIntegrationService();
      newService.setStore(store);
      expect(newService).toBeInstanceOf(ConcurrentStoreIntegrationService);
      newService.dispose();
    });
  });

  describe('inspector operations', () => {
    it('should show inspector concurrently', async () => {
      const result: ConcurrentOperationResult = await service.showInspectorConcurrent();

      // Store operation may fail due to no scene, but service should handle it gracefully
      expect(result).toBeDefined();
      expect(result.metrics).toBeDefined();
      expect(result.metrics.operationType).toBe('inspector-show');
      expect(result.metrics.duration).toBeGreaterThanOrEqual(0);
    });

    it('should hide inspector concurrently', () => {
      const result: ConcurrentOperationResult = service.hideInspectorConcurrent();

      // Hide operation should succeed even if inspector wasn't shown
      expect(result).toBeDefined();
      expect(result.metrics).toBeDefined();
      expect(result.metrics.operationType).toBe('inspector-hide');
      expect(result.metrics.duration).toBeGreaterThanOrEqual(0);
    });

    it('should handle show inspector without store', async () => {
      const serviceWithoutStore = new ConcurrentStoreIntegrationService();
      const result = await serviceWithoutStore.showInspectorConcurrent();

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe(ConcurrentStoreErrorCode.OPERATION_FAILED);
      expect(result.error?.message).toContain('Store not available');

      serviceWithoutStore.dispose();
    });

    it('should handle hide inspector without store', () => {
      const serviceWithoutStore = new ConcurrentStoreIntegrationService();
      const result = serviceWithoutStore.hideInspectorConcurrent();

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe(ConcurrentStoreErrorCode.OPERATION_FAILED);
      expect(result.error?.message).toContain('Store not available');

      serviceWithoutStore.dispose();
    });
  });

  describe('performance monitoring', () => {
    beforeEach(() => {
      // Clear metrics before each test to avoid interference
      service.clearMetrics();
    });

    it('should record performance metrics', async () => {
      await service.showInspectorConcurrent();
      service.hideInspectorConcurrent();

      const metrics = service.getPerformanceMetrics();
      expect(metrics.length).toBeGreaterThanOrEqual(2);
      expect(metrics.some((m) => m.operationType === 'inspector-show')).toBe(true);
      expect(metrics.some((m) => m.operationType === 'inspector-hide')).toBe(true);
    });

    it('should calculate average operation duration', async () => {
      await service.showInspectorConcurrent();
      service.hideInspectorConcurrent();

      const averageDuration = service.getAverageOperationDuration();
      expect(averageDuration).toBeGreaterThanOrEqual(0);
    });

    it('should calculate average duration for specific operation type', async () => {
      await service.showInspectorConcurrent();
      service.hideInspectorConcurrent();

      const showDuration = service.getAverageOperationDuration('inspector-show');
      const hideDuration = service.getAverageOperationDuration('inspector-hide');

      expect(showDuration).toBeGreaterThanOrEqual(0);
      expect(hideDuration).toBeGreaterThanOrEqual(0);
    });

    it('should check performance targets', async () => {
      await service.showInspectorConcurrent();
      service.hideInspectorConcurrent();

      const isTargetMet = service.isPerformanceTargetMet();
      expect(typeof isTargetMet).toBe('boolean');
    });

    it('should clear metrics', async () => {
      await service.showInspectorConcurrent();
      service.hideInspectorConcurrent();

      expect(service.getPerformanceMetrics().length).toBeGreaterThan(0);

      service.clearMetrics();
      expect(service.getPerformanceMetrics()).toHaveLength(0);
    });

    it('should limit metrics to prevent memory leaks', async () => {
      // Simulate many operations
      for (let i = 0; i < 150; i++) {
        service.hideInspectorConcurrent();
      }

      const metrics = service.getPerformanceMetrics();
      expect(metrics.length).toBeLessThanOrEqual(100);
    });
  });

  describe('error handling', () => {
    it('should handle store errors gracefully', async () => {
      // Mock store to throw error
      const errorStore = {
        showInspector: vi.fn().mockResolvedValue({
          success: false,
          error: { message: 'Test error' },
        }),
      } as unknown as AppStore;

      const errorService = new ConcurrentStoreIntegrationService(errorStore);
      const result = await errorService.showInspectorConcurrent();

      expect(result.success).toBe(false);
      if (result.error?.message) {
        expect(result.error.message).toContain('Test error');
      }
      expect(result.metrics.success).toBe(false);

      errorService.dispose();
    });

    it('should handle synchronous store errors', () => {
      // Mock store to throw error
      const errorStore = {
        hideInspector: vi.fn().mockReturnValue({
          success: false,
          error: { message: 'Sync test error' },
        }),
      } as unknown as AppStore;

      const errorService = new ConcurrentStoreIntegrationService(errorStore);
      const result = errorService.hideInspectorConcurrent();

      expect(result.success).toBe(false);
      if (result.error?.message) {
        expect(result.error.message).toContain('Sync test error');
      }
      expect(result.metrics.success).toBe(false);

      errorService.dispose();
    });
  });

  describe('cleanup', () => {
    it('should dispose properly', () => {
      service.dispose();

      // Should not throw when calling methods after dispose
      expect(() => service.clearMetrics()).not.toThrow();
      expect(() => service.getPerformanceMetrics()).not.toThrow();
    });

    it('should handle multiple dispose calls', () => {
      service.dispose();
      service.dispose();

      // Should not throw
      expect(true).toBe(true);
    });
  });

  describe('concurrent features integration', () => {
    it('should provide metrics for React 19 concurrent features', async () => {
      const result = await service.showInspectorConcurrent();

      expect(result.metrics).toBeDefined();
      if (result.metrics) {
        expect(result.metrics.isPending).toBeDefined();
        expect(result.metrics.isDeferred).toBeDefined();
        expect(typeof result.metrics.isPending).toBe('boolean');
        expect(typeof result.metrics.isDeferred).toBe('boolean');
      }
    });

    it('should mark operations as deferred when exceeding performance threshold', async () => {
      // Mock a slow operation by temporarily increasing threshold
      const originalThreshold = service.getPerformanceThreshold();
      service.setPerformanceThreshold(0); // Make everything exceed threshold

      const result = await service.showInspectorConcurrent();

      expect(result.metrics).toBeDefined();
      if (result.metrics) {
        expect(result.metrics.isDeferred).toBe(true);
      }

      // Restore original threshold
      service.setPerformanceThreshold(originalThreshold);
    });
  });
});
