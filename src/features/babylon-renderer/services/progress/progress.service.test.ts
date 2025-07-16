/**
 * @file Progress Service Tests
 *
 * Tests for the ProgressService following TDD principles.
 * Tests operation lifecycle, progress tracking, and cancellation.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  type ProgressOperationConfig,
  ProgressService,
  type ProgressUpdate,
} from './progress.service';

describe('ProgressService', () => {
  let progressService: ProgressService;

  beforeEach(() => {
    progressService = new ProgressService();
    vi.clearAllTimers();
    vi.useFakeTimers();
  });

  afterEach(() => {
    progressService.dispose();
    vi.useRealTimers();
  });

  describe('Operation Lifecycle', () => {
    it('should start a new operation', () => {
      const config: ProgressOperationConfig = {
        type: 'parsing',
        title: 'Test Operation',
        total: 100,
      };

      const result = progressService.startOperation(config);
      expect(result.success).toBe(true);

      if (result.success) {
        const operationId = result.data;
        expect(operationId).toMatch(/^progress_\d+$/);

        const operation = progressService.getOperation(operationId);
        expect(operation).toBeDefined();
        expect(operation?.config.type).toBe('parsing');
        expect(operation?.config.title).toBe('Test Operation');
        expect(operation?.state.current).toBe(0);
        expect(operation?.state.total).toBe(100);
        expect(operation?.state.percentage).toBe(0);
        expect(operation?.state.isCompleted).toBe(false);
        expect(operation?.state.isCancelled).toBe(false);
      }
    });

    it('should start indeterminate operation', () => {
      const config: ProgressOperationConfig = {
        type: 'rendering',
        title: 'Indeterminate Operation',
      };

      const result = progressService.startOperation(config);
      expect(result.success).toBe(true);

      if (result.success) {
        const operation = progressService.getOperation(result.data);
        expect(operation?.state.isIndeterminate).toBe(true);
        expect(operation?.state.total).toBeUndefined();
      }
    });

    it('should start cancellable operation', () => {
      const config: ProgressOperationConfig = {
        type: 'export',
        title: 'Cancellable Operation',
        cancellable: true,
      };

      const result = progressService.startOperation(config);
      expect(result.success).toBe(true);

      if (result.success) {
        const operation = progressService.getOperation(result.data);
        expect(operation?.abortController).toBeDefined();
        expect(operation?.config.cancellable).toBe(true);
      }
    });
  });

  describe('Progress Updates', () => {
    let operationId: string;

    beforeEach(() => {
      const result = progressService.startOperation({
        type: 'parsing',
        title: 'Test Operation',
        total: 100,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        operationId = result.data;
      }
    });

    it('should update progress correctly', () => {
      const update: ProgressUpdate = {
        current: 50,
        message: 'Half way done',
      };

      const result = progressService.updateProgress(operationId, update);
      expect(result.success).toBe(true);

      const operation = progressService.getOperation(operationId);
      expect(operation?.state.current).toBe(50);
      expect(operation?.state.percentage).toBe(50);
      expect(operation?.state.message).toBe('Half way done');
    });

    it('should calculate percentage correctly', () => {
      progressService.updateProgress(operationId, { current: 25 });

      let operation = progressService.getOperation(operationId);
      expect(operation?.state.percentage).toBe(25);

      progressService.updateProgress(operationId, { current: 75 });

      operation = progressService.getOperation(operationId);
      expect(operation?.state.percentage).toBe(75);
    });

    it('should handle total changes', () => {
      progressService.updateProgress(operationId, { current: 50, total: 200 });

      const operation = progressService.getOperation(operationId);
      expect(operation?.state.current).toBe(50);
      expect(operation?.state.total).toBe(200);
      expect(operation?.state.percentage).toBe(25);
    });

    it('should calculate estimated time remaining', () => {
      // Advance time to simulate elapsed time
      vi.advanceTimersByTime(1000);

      progressService.updateProgress(operationId, { current: 25 });

      const operation = progressService.getOperation(operationId);
      expect(operation?.state.estimatedTimeRemaining).toBeDefined();
      expect(operation?.state.estimatedTimeRemaining).toBeGreaterThan(0);
    });

    it('should fail to update non-existent operation', () => {
      const result = progressService.updateProgress('invalid-id', { current: 50 });
      expect(result.success).toBe(false);

      if (!result.success) {
        expect(result.error.code).toBe('INVALID_UPDATE');
      }
    });

    it('should fail to update completed operation', () => {
      progressService.completeOperation(operationId);

      const result = progressService.updateProgress(operationId, { current: 50 });
      expect(result.success).toBe(false);

      if (!result.success) {
        expect(result.error.code).toBe('INVALID_UPDATE');
      }
    });
  });

  describe('Operation Completion', () => {
    let operationId: string;

    beforeEach(() => {
      const result = progressService.startOperation({
        type: 'parsing',
        title: 'Test Operation',
        total: 100,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        operationId = result.data;
      }
    });

    it('should complete operation successfully', () => {
      const result = progressService.completeOperation(operationId, 'Operation finished');
      expect(result.success).toBe(true);

      const operation = progressService.getOperation(operationId);
      expect(operation?.state.isCompleted).toBe(true);
      expect(operation?.state.percentage).toBe(100);
      expect(operation?.state.message).toBe('Operation finished');
    });

    it('should clean up non-persistent operations', () => {
      progressService.completeOperation(operationId);

      // Fast-forward past cleanup delay
      vi.advanceTimersByTime(3000);

      const operation = progressService.getOperation(operationId);
      expect(operation).toBeNull();
    });

    it('should keep persistent operations', () => {
      // Start persistent operation
      const result = progressService.startOperation({
        type: 'parsing',
        title: 'Persistent Operation',
        persistent: true,
      });
      expect(result.success).toBe(true);

      if (result.success) {
        const persistentId = result.data;
        progressService.completeOperation(persistentId);

        // Fast-forward past cleanup delay
        vi.advanceTimersByTime(3000);

        const operation = progressService.getOperation(persistentId);
        expect(operation).toBeDefined();
        expect(operation?.state.isCompleted).toBe(true);
      }
    });
  });

  describe('Operation Cancellation', () => {
    let operationId: string;

    beforeEach(() => {
      const result = progressService.startOperation({
        type: 'export',
        title: 'Cancellable Operation',
        cancellable: true,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        operationId = result.data;
      }
    });

    it('should cancel operation', () => {
      const result = progressService.cancelOperation(operationId, 'User cancelled');
      expect(result.success).toBe(true);

      const operation = progressService.getOperation(operationId);
      expect(operation?.state.isCancelled).toBe(true);
      expect(operation?.state.message).toBe('User cancelled');
    });

    it('should abort controller when cancelling', () => {
      const operation = progressService.getOperation(operationId);
      const abortController = operation?.abortController;
      expect(abortController).toBeDefined();

      const abortSpy = vi.spyOn(abortController!, 'abort');

      progressService.cancelOperation(operationId, 'Test cancellation');

      expect(abortSpy).toHaveBeenCalledWith('Test cancellation');
    });

    it('should clean up cancelled operations', () => {
      progressService.cancelOperation(operationId);

      // Fast-forward past cleanup delay
      vi.advanceTimersByTime(2000);

      const operation = progressService.getOperation(operationId);
      expect(operation).toBeNull();
    });
  });

  describe('Operation Queries', () => {
    let parsingId: string;
    let renderingId: string;

    beforeEach(() => {
      const parsingResult = progressService.startOperation({
        type: 'parsing',
        title: 'Parsing Operation',
      });
      const renderingResult = progressService.startOperation({
        type: 'rendering',
        title: 'Rendering Operation',
      });

      expect(parsingResult.success).toBe(true);
      expect(renderingResult.success).toBe(true);

      if (parsingResult.success) parsingId = parsingResult.data;
      if (renderingResult.success) renderingId = renderingResult.data;
    });

    it('should get active operations', () => {
      const activeOperations = progressService.getActiveOperations();
      expect(activeOperations).toHaveLength(2);
      expect(activeOperations.map((op) => op.id)).toContain(parsingId);
      expect(activeOperations.map((op) => op.id)).toContain(renderingId);
    });

    it('should filter operations by type', () => {
      const parsingOperations = progressService.getOperationsByType('parsing');
      expect(parsingOperations).toHaveLength(1);
      expect(parsingOperations[0].id).toBe(parsingId);

      const renderingOperations = progressService.getOperationsByType('rendering');
      expect(renderingOperations).toHaveLength(1);
      expect(renderingOperations[0].id).toBe(renderingId);

      const exportOperations = progressService.getOperationsByType('export');
      expect(exportOperations).toHaveLength(0);
    });

    it('should exclude completed operations from active list', () => {
      progressService.completeOperation(parsingId);

      const activeOperations = progressService.getActiveOperations();
      expect(activeOperations).toHaveLength(1);
      expect(activeOperations[0].id).toBe(renderingId);
    });
  });

  describe('Event Listeners', () => {
    it('should notify listeners of operation changes', () => {
      const listener = vi.fn();
      const removeListener = progressService.addListener(listener);

      const result = progressService.startOperation({
        type: 'parsing',
        title: 'Test Operation',
      });

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          config: expect.objectContaining({ type: 'parsing' }),
        })
      );

      removeListener();

      if (result.success) {
        progressService.updateProgress(result.data, { current: 50 });
        expect(listener).toHaveBeenCalledTimes(1); // Should not be called after removal
      }
    });

    it('should handle listener errors gracefully', () => {
      const faultyListener = vi.fn(() => {
        throw new Error('Listener error');
      });

      progressService.addListener(faultyListener);

      // Should not throw despite listener error
      expect(() => {
        progressService.startOperation({
          type: 'parsing',
          title: 'Test Operation',
        });
      }).not.toThrow();
    });
  });

  describe('Service Disposal', () => {
    it('should cancel all active operations on dispose', () => {
      const _operation1 = progressService.startOperation({
        type: 'parsing',
        title: 'Operation 1',
        cancellable: true,
      });
      const _operation2 = progressService.startOperation({
        type: 'rendering',
        title: 'Operation 2',
        cancellable: true,
      });

      expect(progressService.getActiveOperations()).toHaveLength(2);

      progressService.dispose();

      expect(progressService.getActiveOperations()).toHaveLength(0);
    });

    it('should clear all listeners on dispose', () => {
      const listener = vi.fn();
      progressService.addListener(listener);

      progressService.dispose();

      // Create new service to test that listeners are cleared
      const newService = new ProgressService();
      newService.startOperation({
        type: 'parsing',
        title: 'Test Operation',
      });

      expect(listener).not.toHaveBeenCalled();
      newService.dispose();
    });
  });
});
