/**
 * @file Progress Service
 *
 * Service for managing progress state across long-running operations.
 * Provides centralized progress tracking, cancellation support, and integration
 * with React components through hooks.
 *
 * @example
 * ```typescript
 * const progressService = new ProgressService();
 *
 * // Start a new operation
 * const operationId = progressService.startOperation({
 *   type: 'parsing',
 *   title: 'Parsing OpenSCAD file',
 *   total: 100
 * });
 *
 * // Update progress
 * progressService.updateProgress(operationId, { current: 50 });
 *
 * // Complete operation
 * progressService.completeOperation(operationId);
 * ```
 */

import { createLogger } from '../../../../shared/services/logger.service';
import type { Result } from '../../../../shared/types/result.types';
import { tryCatch } from '../../../../shared/utils/functional/result';

const logger = createLogger('Progress');

/**
 * Progress operation types
 */
export type ProgressOperationType =
  | 'parsing'
  | 'rendering'
  | 'csg-operation'
  | 'mesh-generation'
  | 'export'
  | 'import'
  | 'generic';

/**
 * Progress stage for multi-phase operations
 */
export interface ProgressStage {
  readonly id: string;
  readonly title: string;
  readonly weight: number; // Relative weight for overall progress calculation
}

/**
 * Progress operation configuration
 */
export interface ProgressOperationConfig {
  readonly type: ProgressOperationType;
  readonly title: string;
  readonly description?: string | undefined;
  readonly total?: number | undefined; // For determinate progress
  readonly stages?: readonly ProgressStage[] | undefined; // For multi-stage operations
  readonly cancellable?: boolean | undefined;
  readonly persistent?: boolean | undefined; // Persist across component re-renders
}

/**
 * Current progress state
 */
export interface ProgressState {
  readonly current: number;
  readonly total: number | undefined;
  readonly percentage: number;
  readonly stage: string | undefined; // Current stage ID
  readonly message: string | undefined; // Current status message
  readonly isIndeterminate: boolean;
  readonly isCompleted: boolean;
  readonly isCancelled: boolean;
  readonly error: string | undefined;
  readonly startTime: Date;
  readonly estimatedTimeRemaining: number | undefined; // In milliseconds
}

/**
 * Progress operation
 */
export interface ProgressOperation {
  readonly id: string;
  readonly config: ProgressOperationConfig;
  readonly state: ProgressState;
  readonly abortController?: AbortController | undefined;
}

/**
 * Progress update data
 */
export interface ProgressUpdate {
  readonly current?: number;
  readonly total?: number;
  readonly stage?: string;
  readonly message?: string;
  readonly error?: string;
}

/**
 * Progress service error
 */
export interface ProgressError {
  readonly code:
    | 'OPERATION_NOT_FOUND'
    | 'INVALID_UPDATE'
    | 'OPERATION_CANCELLED'
    | 'OPERATION_FAILED';
  readonly message: string;
  readonly operationId?: string;
  readonly timestamp: Date;
}

/**
 * Progress event listener
 */
export type ProgressEventListener = (operation: ProgressOperation) => void;

/**
 * Progress Service
 *
 * Manages progress state for long-running operations with support for
 * cancellation, multi-stage operations, and real-time updates.
 */
export class ProgressService {
  private operations = new Map<string, ProgressOperation>();
  private listeners = new Set<ProgressEventListener>();
  private nextOperationId = 1;

  constructor() {
    logger.init('[INIT] Progress service initialized');
  }

  /**
   * Start a new progress operation
   */
  startOperation(config: ProgressOperationConfig): Result<string, ProgressError> {
    return tryCatch(
      () => {
        const operationId = `progress_${this.nextOperationId++}`;
        const abortController = config.cancellable ? new AbortController() : undefined;

        const initialState: ProgressState = {
          current: 0,
          total: config.total,
          percentage: 0,
          stage: undefined,
          message: undefined,
          isIndeterminate: config.total === undefined,
          isCompleted: false,
          isCancelled: false,
          error: undefined,
          startTime: new Date(),
          estimatedTimeRemaining: undefined,
        };

        const operation: ProgressOperation = {
          id: operationId,
          config,
          state: initialState,
          abortController,
        };

        this.operations.set(operationId, operation);
        this.notifyListeners(operation);

        logger.debug(`[START_OPERATION] Started ${config.type} operation: ${operationId}`);
        return operationId;
      },
      (error) => this.createError('OPERATION_FAILED', `Failed to start operation: ${error}`)
    );
  }

  /**
   * Update progress for an operation
   */
  updateProgress(operationId: string, update: ProgressUpdate): Result<void, ProgressError> {
    return tryCatch(
      () => {
        const operation = this.operations.get(operationId);
        if (!operation) {
          throw this.createError(
            'OPERATION_NOT_FOUND',
            `Operation not found: ${operationId}`,
            operationId
          );
        }

        if (operation.state.isCompleted || operation.state.isCancelled) {
          throw this.createError(
            'INVALID_UPDATE',
            `Cannot update completed/cancelled operation: ${operationId}`,
            operationId
          );
        }

        // Calculate new state
        const newCurrent = update.current ?? operation.state.current;
        const newTotal = update.total ?? operation.state.total;
        const newPercentage = newTotal
          ? Math.min(100, Math.max(0, (newCurrent / newTotal) * 100))
          : 0;

        // Calculate estimated time remaining
        const elapsed = Date.now() - operation.state.startTime.getTime();
        const estimatedTimeRemaining =
          newPercentage > 0 && newPercentage < 100
            ? (elapsed / newPercentage) * (100 - newPercentage)
            : undefined;

        const updatedState: ProgressState = {
          ...operation.state,
          current: newCurrent,
          total: newTotal,
          percentage: newPercentage,
          stage: update.stage ?? operation.state.stage,
          message: update.message ?? operation.state.message,
          error: update.error ?? operation.state.error,
          isIndeterminate: newTotal === undefined,
          estimatedTimeRemaining,
        };

        const updatedOperation: ProgressOperation = {
          ...operation,
          state: updatedState,
        };

        this.operations.set(operationId, updatedOperation);
        this.notifyListeners(updatedOperation);

        logger.debug(
          `[UPDATE_PROGRESS] Updated operation ${operationId}: ${newPercentage.toFixed(1)}%`
        );
      },
      (error) =>
        this.createError('INVALID_UPDATE', `Failed to update progress: ${error}`, operationId)
    );
  }

  /**
   * Complete an operation successfully
   */
  completeOperation(operationId: string, message?: string): Result<void, ProgressError> {
    return tryCatch(
      () => {
        const operation = this.operations.get(operationId);
        if (!operation) {
          throw this.createError(
            'OPERATION_NOT_FOUND',
            `Operation not found: ${operationId}`,
            operationId
          );
        }

        const completedState: ProgressState = {
          ...operation.state,
          current: operation.state.total ?? operation.state.current,
          percentage: 100,
          isCompleted: true,
          message: message ?? operation.state.message,
        };

        const completedOperation: ProgressOperation = {
          ...operation,
          state: completedState,
        };

        this.operations.set(operationId, completedOperation);
        this.notifyListeners(completedOperation);

        logger.debug(`[COMPLETE_OPERATION] Completed operation: ${operationId}`);

        // Clean up non-persistent operations after a delay
        if (!operation.config.persistent) {
          setTimeout(() => {
            this.operations.delete(operationId);
          }, 2000);
        }
      },
      (error) =>
        this.createError('OPERATION_FAILED', `Failed to complete operation: ${error}`, operationId)
    );
  }

  /**
   * Cancel an operation
   */
  cancelOperation(operationId: string, reason?: string): Result<void, ProgressError> {
    return tryCatch(
      () => {
        const operation = this.operations.get(operationId);
        if (!operation) {
          throw this.createError(
            'OPERATION_NOT_FOUND',
            `Operation not found: ${operationId}`,
            operationId
          );
        }

        // Abort the operation if it has an abort controller
        if (operation.abortController) {
          operation.abortController.abort(reason);
        }

        const cancelledState: ProgressState = {
          ...operation.state,
          isCancelled: true,
          message: reason ?? 'Operation cancelled',
        };

        const cancelledOperation: ProgressOperation = {
          ...operation,
          state: cancelledState,
        };

        this.operations.set(operationId, cancelledOperation);
        this.notifyListeners(cancelledOperation);

        logger.debug(`[CANCEL_OPERATION] Cancelled operation: ${operationId}`);

        // Clean up cancelled operations after a delay
        setTimeout(() => {
          this.operations.delete(operationId);
        }, 1000);
      },
      (error) =>
        this.createError('OPERATION_CANCELLED', `Failed to cancel operation: ${error}`, operationId)
    );
  }

  /**
   * Get current operation state
   */
  getOperation(operationId: string): ProgressOperation | null {
    return this.operations.get(operationId) || null;
  }

  /**
   * Get all active operations
   */
  getActiveOperations(): readonly ProgressOperation[] {
    return Array.from(this.operations.values()).filter(
      (op) => !op.state.isCompleted && !op.state.isCancelled
    );
  }

  /**
   * Get all operations of a specific type
   */
  getOperationsByType(type: ProgressOperationType): readonly ProgressOperation[] {
    return Array.from(this.operations.values()).filter((op) => op.config.type === type);
  }

  /**
   * Add progress event listener
   */
  addListener(listener: ProgressEventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Remove all listeners and clean up
   */
  dispose(): void {
    // Cancel all active operations
    for (const operation of this.getActiveOperations()) {
      this.cancelOperation(operation.id, 'Service disposed');
    }

    this.operations.clear();
    this.listeners.clear();
    logger.debug('[DISPOSE] Progress service disposed');
  }

  /**
   * Notify all listeners of operation changes
   */
  private notifyListeners(operation: ProgressOperation): void {
    for (const listener of this.listeners) {
      try {
        listener(operation);
      } catch (error) {
        logger.warn(`[NOTIFY_LISTENERS] Listener error: ${error}`);
      }
    }
  }

  /**
   * Create a progress error
   */
  private createError(
    code: ProgressError['code'],
    message: string,
    operationId?: string
  ): ProgressError {
    const error: ProgressError = {
      code,
      message,
      timestamp: new Date(),
    };

    if (operationId !== undefined) {
      (error as ProgressError & { operationId: string }).operationId = operationId;
    }

    return error;
  }
}
