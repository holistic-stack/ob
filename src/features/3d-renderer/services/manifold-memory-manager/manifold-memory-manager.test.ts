/**
 * @file Memory Manager Test for Manifold WASM Resources
 * Tests RAII memory management patterns with FinalizationRegistry safety nets
 * Part of Manifold CSG migration - Task 1.6
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Result } from '../../../../shared/types/result.types';
import type {
  ManifoldError,
  ManifoldMemoryStats,
  ManifoldResource,
} from '../manifold-types/manifold-types';

// Import the memory manager (will fail until implemented)
import {
  clearAllResources,
  createManagedResource,
  disableMemoryLeakDetection,
  disposeManagedResource,
  enableMemoryLeakDetection,
  getMemoryStats,
  ManifoldMemoryManager,
} from './manifold-memory-manager';

// Mock WASM object for testing
interface MockWasmObject {
  id: number;
  deleted: boolean;
  delete(): void;
}

const createMockWasmObject = (id: number): MockWasmObject => ({
  id,
  deleted: false,
  delete() {
    this.deleted = true;
  },
});

describe('Manifold Memory Manager', () => {
  let memoryManager: ManifoldMemoryManager;
  let mockWasmObjects: MockWasmObject[];

  beforeEach(() => {
    // This will fail until we implement the memory manager
    memoryManager = new ManifoldMemoryManager();
    mockWasmObjects = [];

    // Clear any existing resources
    clearAllResources();
  });

  afterEach(() => {
    // Clean up all resources after each test
    clearAllResources();
    mockWasmObjects.forEach((obj) => {
      if (!obj.deleted) {
        obj.delete();
      }
    });
    mockWasmObjects = [];
  });

  describe('RAII Resource Management', () => {
    it('should create managed resources with proper branding', () => {
      // This test will fail until we implement createManagedResource
      const mockWasm = createMockWasmObject(1);
      mockWasmObjects.push(mockWasm);

      const managedResult = createManagedResource(mockWasm);
      expect(managedResult.success).toBe(true);

      if (managedResult.success) {
        const managed = managedResult.data;
        expect(managed.__brand).toBe('ManifoldResource');
        expect(managed.resource).toBe(mockWasm);
        expect(managed.disposed).toBe(false);
      }
    });

    it('should track resource allocation in memory stats', () => {
      // This test will fail until we implement memory tracking
      const initialStats = getMemoryStats();
      expect(initialStats.activeResources).toBe(0);

      const mockWasm = createMockWasmObject(1);
      mockWasmObjects.push(mockWasm);

      const managedResult = createManagedResource(mockWasm);
      expect(managedResult.success).toBe(true);

      const statsAfterAllocation = getMemoryStats();
      expect(statsAfterAllocation.activeResources).toBe(1);
      expect(statsAfterAllocation.totalAllocated).toBe(1);
    });

    it('should properly dispose resources and update stats', () => {
      // This test will fail until we implement disposal
      const mockWasm = createMockWasmObject(1);
      mockWasmObjects.push(mockWasm);

      const managedResult = createManagedResource(mockWasm);
      expect(managedResult.success).toBe(true);

      if (managedResult.success) {
        const managed = managedResult.data;

        const disposeResult = disposeManagedResource(managed);
        expect(disposeResult.success).toBe(true);
        expect(mockWasm.deleted).toBe(true);

        const statsAfterDisposal = getMemoryStats();
        expect(statsAfterDisposal.activeResources).toBe(0);
        expect(statsAfterDisposal.totalFreed).toBe(1);
      }
    });

    it('should prevent double disposal', () => {
      // This test will fail until we implement double disposal protection
      const mockWasm = createMockWasmObject(1);
      mockWasmObjects.push(mockWasm);

      const managedResult = createManagedResource(mockWasm);
      expect(managedResult.success).toBe(true);

      if (managedResult.success) {
        const managed = managedResult.data;

        // First disposal should succeed
        const firstDispose = disposeManagedResource(managed);
        expect(firstDispose.success).toBe(true);

        // Second disposal should fail gracefully
        const secondDispose = disposeManagedResource(managed);
        expect(secondDispose.success).toBe(false);
        if (!secondDispose.success) {
          expect(secondDispose.error).toContain('already disposed');
        }
      }
    });
  });

  describe('FinalizationRegistry Safety Nets', () => {
    it('should register resources with FinalizationRegistry', () => {
      // This test will fail until we implement FinalizationRegistry integration
      const mockWasm = createMockWasmObject(1);
      mockWasmObjects.push(mockWasm);

      const managedResult = createManagedResource(mockWasm);
      expect(managedResult.success).toBe(true);

      // We can't directly test FinalizationRegistry behavior in tests,
      // but we can verify the resource is properly registered
      if (managedResult.success) {
        const managed = managedResult.data;
        expect(managed.resource).toBe(mockWasm);

        // The memory manager should have internal tracking
        const stats = getMemoryStats();
        expect(stats.activeResources).toBe(1);
      }
    });

    it('should handle FinalizationRegistry cleanup gracefully', () => {
      // This test verifies that the FinalizationRegistry cleanup doesn't break
      // when resources are properly disposed
      const mockWasm = createMockWasmObject(1);
      mockWasmObjects.push(mockWasm);

      const managedResult = createManagedResource(mockWasm);
      expect(managedResult.success).toBe(true);

      if (managedResult.success) {
        const managed = managedResult.data;

        // Dispose properly
        const disposeResult = disposeManagedResource(managed);
        expect(disposeResult.success).toBe(true);

        // FinalizationRegistry should not cause issues
        // (This is more of a integration test)
        expect(mockWasm.deleted).toBe(true);
      }
    });
  });

  describe('Memory Leak Detection', () => {
    it('should detect memory leaks when enabled', () => {
      // This test will fail until we implement leak detection
      enableMemoryLeakDetection();

      const mockWasm1 = createMockWasmObject(1);
      const mockWasm2 = createMockWasmObject(2);
      mockWasmObjects.push(mockWasm1, mockWasm2);

      // Create resources but don't dispose them
      const managed1 = createManagedResource(mockWasm1);
      const managed2 = createManagedResource(mockWasm2);

      expect(managed1.success).toBe(true);
      expect(managed2.success).toBe(true);

      // Check for leaks
      const stats = getMemoryStats();
      expect(stats.activeResources).toBe(2);

      // Memory leak detection should be active
      // (Implementation will track undisposed resources)
      expect(stats.activeResources).toBeGreaterThan(0);
    });

    it('should not report leaks for properly disposed resources', () => {
      // This test will fail until we implement proper leak detection
      enableMemoryLeakDetection();

      const mockWasm = createMockWasmObject(1);
      mockWasmObjects.push(mockWasm);

      const managedResult = createManagedResource(mockWasm);
      expect(managedResult.success).toBe(true);

      if (managedResult.success) {
        const managed = managedResult.data;

        // Properly dispose
        const disposeResult = disposeManagedResource(managed);
        expect(disposeResult.success).toBe(true);

        // Should not be counted as leak
        const stats = getMemoryStats();
        expect(stats.activeResources).toBe(0);
      }
    });

    it('should allow disabling leak detection', () => {
      // This test will fail until we implement leak detection toggle
      enableMemoryLeakDetection();

      const mockWasm = createMockWasmObject(1);
      mockWasmObjects.push(mockWasm);

      createManagedResource(mockWasm);

      // Disable leak detection
      disableMemoryLeakDetection();

      // Should still track resources but not actively monitor for leaks
      const stats = getMemoryStats();
      expect(stats.activeResources).toBe(1);
    });
  });

  describe('Memory Statistics', () => {
    it('should provide accurate memory statistics', () => {
      // This test will fail until we implement comprehensive stats
      const initialStats = getMemoryStats();
      expect(initialStats).toEqual({
        totalAllocated: 0,
        totalFreed: 0,
        currentUsage: 0,
        peakUsage: 0,
        activeResources: 0,
      });

      // Allocate some resources
      const mockWasm1 = createMockWasmObject(1);
      const mockWasm2 = createMockWasmObject(2);
      mockWasmObjects.push(mockWasm1, mockWasm2);

      createManagedResource(mockWasm1);
      createManagedResource(mockWasm2);

      const statsAfterAllocation = getMemoryStats();
      expect(statsAfterAllocation.totalAllocated).toBe(2);
      expect(statsAfterAllocation.activeResources).toBe(2);
      expect(statsAfterAllocation.currentUsage).toBe(2);
      expect(statsAfterAllocation.peakUsage).toBe(2);
    });

    it('should track peak memory usage correctly', () => {
      // This test will fail until we implement peak tracking
      const mockWasm1 = createMockWasmObject(1);
      const mockWasm2 = createMockWasmObject(2);
      const mockWasm3 = createMockWasmObject(3);
      mockWasmObjects.push(mockWasm1, mockWasm2, mockWasm3);

      // Allocate 3 resources
      const managed1 = createManagedResource(mockWasm1);
      const managed2 = createManagedResource(mockWasm2);
      const managed3 = createManagedResource(mockWasm3);

      let stats = getMemoryStats();
      expect(stats.peakUsage).toBe(3);

      // Dispose 2 resources
      if (managed1.success) disposeManagedResource(managed1.data);
      if (managed2.success) disposeManagedResource(managed2.data);

      stats = getMemoryStats();
      expect(stats.activeResources).toBe(1);
      expect(stats.peakUsage).toBe(3); // Peak should remain 3
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid resource disposal gracefully', () => {
      // This test will fail until we implement error handling
      const invalidResource = {
        resource: null,
        disposed: true,
        __brand: 'ManifoldResource' as const,
      } as ManifoldResource<MockWasmObject>;

      const disposeResult = disposeManagedResource(invalidResource);
      expect(disposeResult.success).toBe(false);
      if (!disposeResult.success) {
        expect(disposeResult.error).toContain('already disposed');
      }
    });

    it('should handle WASM object deletion errors', () => {
      // This test will fail until we implement error handling
      const faultyWasm = {
        id: 999,
        deleted: false,
        delete() {
          throw new Error('WASM deletion failed');
        },
      };

      const managedResult = createManagedResource(faultyWasm);
      expect(managedResult.success).toBe(true);

      if (managedResult.success) {
        const managed = managedResult.data;

        const disposeResult = disposeManagedResource(managed);
        expect(disposeResult.success).toBe(false);
        if (!disposeResult.success) {
          expect(disposeResult.error).toContain('WASM deletion failed');
        }
      }
    });
  });
});
