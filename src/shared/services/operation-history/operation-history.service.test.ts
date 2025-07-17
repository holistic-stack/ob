/**
 * @file Tests for Operation History Service
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  type Operation,
  OperationHistoryService,
  type OperationResult,
} from './operation-history.service';

describe('OperationHistoryService', () => {
  let service: OperationHistoryService;

  beforeEach(() => {
    service = new OperationHistoryService(5); // Small history for testing
  });

  afterEach(() => {
    service.dispose();
  });

  describe('operation execution', () => {
    it('should execute successful operations', async () => {
      const operation: Operation<string> = {
        id: 'test-1',
        name: 'Test Operation',
        timestamp: new Date(),
        execute: async () => 'success',
        rollback: async () => {},
      };

      const result = await service.executeOperation(operation);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('success');
      }

      const history = service.getHistoryState();
      expect(history.operations).toHaveLength(1);
      expect(history.operations[0].success).toBe(true);
      expect(history.operations[0].name).toBe('Test Operation');
    });

    it('should handle failed operations with rollback', async () => {
      const rollbackSpy = vi.fn();
      const operation: Operation<string> = {
        id: 'test-2',
        name: 'Failing Operation',
        timestamp: new Date(),
        execute: async () => {
          throw new Error('Operation failed');
        },
        rollback: rollbackSpy,
      };

      const result = await service.executeOperation(operation);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Operation failed');
      }

      expect(rollbackSpy).toHaveBeenCalledOnce();

      const history = service.getHistoryState();
      expect(history.operations).toHaveLength(1);
      expect(history.operations[0].success).toBe(false);
    });

    it('should handle rollback failures gracefully', async () => {
      const operation: Operation<string> = {
        id: 'test-3',
        name: 'Operation with failing rollback',
        timestamp: new Date(),
        execute: async () => {
          throw new Error('Operation failed');
        },
        rollback: async () => {
          throw new Error('Rollback failed');
        },
      };

      const result = await service.executeOperation(operation);

      expect(result.success).toBe(false);
      // Should still record the operation failure even if rollback fails
      const history = service.getHistoryState();
      expect(history.operations).toHaveLength(1);
      expect(history.operations[0].success).toBe(false);
    });

    it('should skip rollback when autoRollbackOnFailure is false', async () => {
      const rollbackSpy = vi.fn();
      const operation: Operation<string> = {
        id: 'test-4',
        name: 'No rollback operation',
        timestamp: new Date(),
        execute: async () => {
          throw new Error('Operation failed');
        },
        rollback: rollbackSpy,
      };

      await service.executeOperation(operation, {
        autoRollbackOnFailure: false,
      });

      expect(rollbackSpy).not.toHaveBeenCalled();
    });

    it('should skip saving to history when saveToHistory is false', async () => {
      const operation: Operation<string> = {
        id: 'test-5',
        name: 'No history operation',
        timestamp: new Date(),
        execute: async () => 'success',
        rollback: async () => {},
      };

      await service.executeOperation(operation, {
        saveToHistory: false,
      });

      const history = service.getHistoryState();
      expect(history.operations).toHaveLength(0);
    });
  });

  describe('undo/redo functionality', () => {
    beforeEach(async () => {
      // Add some operations to history
      for (let i = 1; i <= 3; i++) {
        const operation: Operation<number> = {
          id: `op-${i}`,
          name: `Operation ${i}`,
          timestamp: new Date(),
          execute: async () => i,
          rollback: async () => {},
        };
        await service.executeOperation(operation);
      }
    });

    it('should check undo/redo availability correctly', () => {
      const history = service.getHistoryState();
      expect(history.canUndo).toBe(true);
      expect(history.canRedo).toBe(false);
      expect(history.currentIndex).toBe(2);
    });

    it('should perform undo operations', async () => {
      expect(service.canUndo()).toBe(true);

      const result = await service.undo();
      expect(result.success).toBe(true);

      const history = service.getHistoryState();
      expect(history.currentIndex).toBe(1);
      expect(history.canUndo).toBe(true);
      expect(history.canRedo).toBe(true);
    });

    it('should perform redo operations', async () => {
      await service.undo();
      expect(service.canRedo()).toBe(true);

      const result = await service.redo();
      expect(result.success).toBe(true);

      const history = service.getHistoryState();
      expect(history.currentIndex).toBe(2);
      expect(history.canRedo).toBe(false);
    });

    it('should handle undo when no operations available', async () => {
      service.clearHistory();

      const result = await service.undo();
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('No operations to undo');
      }
    });

    it('should handle redo when no operations available', async () => {
      const result = await service.redo();
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('No operations to redo');
      }
    });
  });

  describe('transaction execution', () => {
    it('should execute successful transactions', async () => {
      const operations: Operation<number>[] = [
        {
          id: 'tx-op-1',
          name: 'Transaction Op 1',
          timestamp: new Date(),
          execute: async () => 1,
          rollback: async () => {},
        },
        {
          id: 'tx-op-2',
          name: 'Transaction Op 2',
          timestamp: new Date(),
          execute: async () => 2,
          rollback: async () => {},
        },
      ];

      const result = await service.executeTransaction(operations);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([1, 2]);
      }

      const history = service.getHistoryState();
      expect(history.operations).toHaveLength(1);
      expect(history.operations[0].name).toContain('Transaction');
    });

    it('should rollback failed transactions', async () => {
      const rollbackSpies = [vi.fn(), vi.fn()];
      const operations: Operation<number>[] = [
        {
          id: 'tx-op-1',
          name: 'Transaction Op 1',
          timestamp: new Date(),
          execute: async () => 1,
          rollback: rollbackSpies[0],
        },
        {
          id: 'tx-op-2',
          name: 'Transaction Op 2',
          timestamp: new Date(),
          execute: async () => {
            throw new Error('Transaction operation failed');
          },
          rollback: rollbackSpies[1],
        },
      ];

      const result = await service.executeTransaction(operations);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Transaction operation failed');
      }

      // Should rollback the first operation (in reverse order)
      expect(rollbackSpies[0]).toHaveBeenCalledOnce();
      expect(rollbackSpies[1]).not.toHaveBeenCalled();
    });

    it('should handle rollback failures in transactions', async () => {
      const operations: Operation<number>[] = [
        {
          id: 'tx-op-1',
          name: 'Transaction Op 1',
          timestamp: new Date(),
          execute: async () => 1,
          rollback: async () => {
            throw new Error('Rollback failed');
          },
        },
        {
          id: 'tx-op-2',
          name: 'Transaction Op 2',
          timestamp: new Date(),
          execute: async () => {
            throw new Error('Transaction operation failed');
          },
          rollback: async () => {},
        },
      ];

      const result = await service.executeTransaction(operations);

      expect(result.success).toBe(false);
      // Should still complete the transaction rollback even if individual rollbacks fail
    });
  });

  describe('history management', () => {
    it('should limit history size', async () => {
      // Add more operations than the max size (5)
      for (let i = 1; i <= 7; i++) {
        const operation: Operation<number> = {
          id: `op-${i}`,
          name: `Operation ${i}`,
          timestamp: new Date(),
          execute: async () => i,
          rollback: async () => {},
        };
        await service.executeOperation(operation);
      }

      const history = service.getHistoryState();
      expect(history.operations).toHaveLength(5);
      expect(history.maxHistorySize).toBe(5);
      // Should keep the most recent operations
      expect(history.operations[0].name).toBe('Operation 3');
      expect(history.operations[4].name).toBe('Operation 7');
    });

    it('should get operation by ID', async () => {
      const operation: Operation<string> = {
        id: 'findable-op',
        name: 'Findable Operation',
        timestamp: new Date(),
        execute: async () => 'found',
        rollback: async () => {},
      };

      await service.executeOperation(operation);

      const found = service.getOperation('findable-op');
      expect(found).toBeDefined();
      expect(found?.name).toBe('Findable Operation');

      const notFound = service.getOperation('non-existent');
      expect(notFound).toBeNull();
    });

    it('should get recent operations', async () => {
      for (let i = 1; i <= 5; i++) {
        const operation: Operation<number> = {
          id: `recent-${i}`,
          name: `Recent ${i}`,
          timestamp: new Date(),
          execute: async () => i,
          rollback: async () => {},
        };
        await service.executeOperation(operation);
      }

      const recent = service.getRecentOperations(3);
      expect(recent).toHaveLength(3);
      expect(recent[0].name).toBe('Recent 3');
      expect(recent[2].name).toBe('Recent 5');
    });

    it('should get failed operations', async () => {
      const successOp: Operation<string> = {
        id: 'success-op',
        name: 'Success Operation',
        timestamp: new Date(),
        execute: async () => 'success',
        rollback: async () => {},
      };

      const failOp: Operation<string> = {
        id: 'fail-op',
        name: 'Fail Operation',
        timestamp: new Date(),
        execute: async () => {
          throw new Error('Failed');
        },
        rollback: async () => {},
      };

      await service.executeOperation(successOp);
      await service.executeOperation(failOp);

      const failed = service.getFailedOperations();
      expect(failed).toHaveLength(1);
      expect(failed[0].name).toBe('Fail Operation');
      expect(failed[0].success).toBe(false);
    });

    it('should clear history', () => {
      service.clearHistory();

      const history = service.getHistoryState();
      expect(history.operations).toHaveLength(0);
      expect(history.currentIndex).toBe(-1);
      expect(history.canUndo).toBe(false);
      expect(history.canRedo).toBe(false);
    });
  });

  describe('disposal', () => {
    it('should dispose cleanly', () => {
      expect(() => service.dispose()).not.toThrow();

      const history = service.getHistoryState();
      expect(history.operations).toHaveLength(0);
    });
  });
});
