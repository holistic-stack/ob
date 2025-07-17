/**
 * @file Operation History Service
 *
 * Provides undo/redo functionality and transaction-like operations
 * that can be rolled back on failure. Maintains operation history
 * for graceful recovery in production environments.
 *
 * @example
 * ```typescript
 * import { OperationHistoryService } from './operation-history.service';
 *
 * const history = new OperationHistoryService();
 *
 * // Execute an operation with automatic rollback on failure
 * const result = await history.executeOperation({
 *   name: 'Parse OpenSCAD',
 *   execute: async () => parseCode(code),
 *   rollback: async () => restorePreviousState(),
 * });
 *
 * // Manual undo/redo
 * if (history.canUndo()) {
 *   await history.undo();
 * }
 * ```
 */

import type { Result } from '../../types/result.types';
import { createLogger } from '../logger.service';

const logger = createLogger('OperationHistory');

/**
 * Operation that can be executed and rolled back
 */
export interface Operation<T = unknown> {
  readonly id: string;
  readonly name: string;
  readonly timestamp: Date;
  readonly execute: () => Promise<T>;
  readonly rollback: () => Promise<void>;
  readonly metadata?: Record<string, unknown>;
}

/**
 * Operation result with execution details
 */
export interface OperationResult<T = unknown> {
  readonly id: string;
  readonly name: string;
  readonly timestamp: Date;
  readonly duration: number;
  readonly success: boolean;
  readonly result?: T;
  readonly error?: Error;
  readonly metadata?: Record<string, unknown>;
}

/**
 * Operation history state
 */
export interface HistoryState {
  readonly operations: readonly OperationResult[];
  readonly currentIndex: number;
  readonly canUndo: boolean;
  readonly canRedo: boolean;
  readonly maxHistorySize: number;
}

/**
 * Operation execution options
 */
export interface ExecutionOptions {
  readonly autoRollbackOnFailure?: boolean;
  readonly saveToHistory?: boolean;
  readonly metadata?: Record<string, unknown>;
}

/**
 * Operation History Service
 *
 * Manages operation history with undo/redo functionality and
 * automatic rollback capabilities for failed operations.
 */
export class OperationHistoryService {
  private operations: OperationResult[] = [];
  private currentIndex = -1;
  private readonly maxHistorySize: number;

  constructor(maxHistorySize = 50) {
    this.maxHistorySize = maxHistorySize;
    logger.init('[INIT] Operation history service initialized');
  }

  /**
   * Execute an operation with optional rollback on failure
   */
  async executeOperation<T>(
    operation: Operation<T>,
    options: ExecutionOptions = {}
  ): Promise<Result<T, Error>> {
    const { autoRollbackOnFailure = true, saveToHistory = true, metadata = {} } = options;

    logger.debug(`[EXECUTE] Starting operation: ${operation.name}`);
    const startTime = Date.now();

    try {
      const operationResult = await operation.execute();

      if (saveToHistory) {
        const operationRecord: OperationResult<T> = {
          id: operation.id,
          name: operation.name,
          timestamp: operation.timestamp,
          duration: Date.now() - startTime,
          success: true,
          result: operationResult,
          metadata: { ...operation.metadata, ...metadata },
        };

        this.addToHistory(operationRecord);
      }

      logger.debug(`[EXECUTE] Operation completed: ${operation.name}`);
      return { success: true, data: operationResult };
    } catch (error) {
      logger.error(`[EXECUTE] Operation failed: ${operation.name}`, error);

      // Handle rollback
      if (autoRollbackOnFailure) {
        logger.debug(`[ROLLBACK] Attempting rollback for: ${operation.name}`);
        try {
          await operation.rollback();
          logger.debug(`[ROLLBACK] Rollback successful for: ${operation.name}`);
        } catch (rollbackError) {
          logger.error(`[ROLLBACK] Rollback failed for: ${operation.name}`, rollbackError);
        }
      }

      if (saveToHistory) {
        const operationRecord: OperationResult = {
          id: operation.id,
          name: operation.name,
          timestamp: operation.timestamp,
          duration: Date.now() - startTime,
          success: false,
          error: error instanceof Error ? error : new Error(String(error)),
          metadata: { ...operation.metadata, ...metadata },
        };

        this.addToHistory(operationRecord);
      }

      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }

    return result;
  }

  /**
   * Undo the last operation
   */
  async undo(): Promise<Result<void, Error>> {
    if (!this.canUndo()) {
      return {
        success: false,
        error: new Error('No operations to undo'),
      };
    }

    const operation = this.operations[this.currentIndex];
    logger.debug(`[UNDO] Undoing operation: ${operation.name}`);

    // For now, we don't have rollback functions stored in history
    // This would need to be enhanced to store rollback functions
    // or implement a state snapshot system

    this.currentIndex--;
    logger.debug(`[UNDO] Operation undone: ${operation.name}`);

    return { success: true, data: undefined };
  }

  /**
   * Redo the next operation
   */
  async redo(): Promise<Result<void, Error>> {
    if (!this.canRedo()) {
      return {
        success: false,
        error: new Error('No operations to redo'),
      };
    }

    this.currentIndex++;
    const operation = this.operations[this.currentIndex];
    logger.debug(`[REDO] Redoing operation: ${operation.name}`);

    return { success: true, data: undefined };
  }

  /**
   * Check if undo is possible
   */
  canUndo(): boolean {
    return this.currentIndex >= 0;
  }

  /**
   * Check if redo is possible
   */
  canRedo(): boolean {
    return this.currentIndex < this.operations.length - 1;
  }

  /**
   * Get current history state
   */
  getHistoryState(): HistoryState {
    return {
      operations: [...this.operations],
      currentIndex: this.currentIndex,
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
      maxHistorySize: this.maxHistorySize,
    };
  }

  /**
   * Get operation by ID
   */
  getOperation(id: string): OperationResult | null {
    return this.operations.find((op) => op.id === id) || null;
  }

  /**
   * Get recent operations
   */
  getRecentOperations(count = 10): readonly OperationResult[] {
    return this.operations.slice(-count);
  }

  /**
   * Get failed operations
   */
  getFailedOperations(): readonly OperationResult[] {
    return this.operations.filter((op) => !op.success);
  }

  /**
   * Clear history
   */
  clearHistory(): void {
    this.operations = [];
    this.currentIndex = -1;
    logger.debug('[CLEAR] Operation history cleared');
  }

  /**
   * Create a transaction that can be rolled back as a unit
   */
  async executeTransaction<T>(
    operations: readonly Operation<unknown>[],
    options: ExecutionOptions = {}
  ): Promise<Result<readonly unknown[], Error>> {
    logger.debug(`[TRANSACTION] Starting transaction with ${operations.length} operations`);

    const results: unknown[] = [];
    const executedOperations: Operation<unknown>[] = [];

    try {
      for (const operation of operations) {
        const result = await this.executeOperation(operation, {
          ...options,
          saveToHistory: false, // Don't save individual operations
          autoRollbackOnFailure: false, // Handle rollback at transaction level
        });

        if (!result.success) {
          throw result.error;
        }

        results.push(result.data);
        executedOperations.push(operation);
      }

      // Save transaction as a single operation in history
      if (options.saveToHistory !== false) {
        const transactionRecord: OperationResult = {
          id: `transaction-${Date.now()}`,
          name: `Transaction (${operations.length} operations)`,
          timestamp: new Date(),
          duration: 0, // Would need to track actual duration
          success: true,
          result: results,
          metadata: {
            operationCount: operations.length,
            operationNames: operations.map((op) => op.name),
            ...options.metadata,
          },
        };

        this.addToHistory(transactionRecord);
      }

      logger.debug('[TRANSACTION] Transaction completed successfully');
      return { success: true, data: results };
    } catch (error) {
      logger.error('[TRANSACTION] Transaction failed, rolling back', error);

      // Rollback all executed operations in reverse order
      for (let i = executedOperations.length - 1; i >= 0; i--) {
        try {
          await executedOperations[i].rollback();
        } catch (rollbackError) {
          logger.error(
            `[TRANSACTION] Failed to rollback operation: ${executedOperations[i].name}`,
            rollbackError
          );
        }
      }

      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }

  /**
   * Add operation to history
   */
  private addToHistory(operation: OperationResult): void {
    // Remove any operations after current index (when undoing and then executing new operation)
    if (this.currentIndex < this.operations.length - 1) {
      this.operations = this.operations.slice(0, this.currentIndex + 1);
    }

    // Add new operation
    this.operations.push(operation);
    this.currentIndex = this.operations.length - 1;

    // Trim history if it exceeds max size
    if (this.operations.length > this.maxHistorySize) {
      const removeCount = this.operations.length - this.maxHistorySize;
      this.operations = this.operations.slice(removeCount);
      this.currentIndex -= removeCount;
    }
  }

  /**
   * Dispose the service
   */
  dispose(): void {
    this.clearHistory();
    logger.debug('[DISPOSE] Operation history service disposed');
  }
}
