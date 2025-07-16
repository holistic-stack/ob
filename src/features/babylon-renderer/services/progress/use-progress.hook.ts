/**
 * @file Progress Hooks
 *
 * React hooks for managing progress state in components.
 * Provides reactive progress tracking with automatic cleanup.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { startOperation, updateProgress, completeOperation, operations } = useProgress();
 *
 *   const handleLongOperation = async () => {
 *     const operationId = startOperation({
 *       type: 'parsing',
 *       title: 'Parsing file',
 *       total: 100
 *     });
 *
 *     for (let i = 0; i <= 100; i += 10) {
 *       updateProgress(operationId, { current: i });
 *       await new Promise(resolve => setTimeout(resolve, 100));
 *     }
 *
 *     completeOperation(operationId);
 *   };
 *
 *   return (
 *     <div>
 *       {operations.map(op => (
 *         <ProgressBar key={op.id} operation={op} />
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */

import { useCallback, useEffect, useState } from 'react';
import { createLogger } from '../../../../shared/services/logger.service';
import {
  type ProgressOperation,
  type ProgressOperationConfig,
  type ProgressOperationType,
  ProgressService,
  type ProgressUpdate,
} from './progress.service';

const logger = createLogger('ProgressHook');

// Global progress service instance
let globalProgressService: ProgressService | null = null;

/**
 * Get or create the global progress service
 */
function getProgressService(): ProgressService {
  if (!globalProgressService) {
    globalProgressService = new ProgressService();
  }
  return globalProgressService;
}

/**
 * Progress hook return type
 */
export interface UseProgressReturn {
  readonly operations: readonly ProgressOperation[];
  readonly activeOperations: readonly ProgressOperation[];
  readonly startOperation: (config: ProgressOperationConfig) => string | null;
  readonly updateProgress: (operationId: string, update: ProgressUpdate) => boolean;
  readonly completeOperation: (operationId: string, message?: string) => boolean;
  readonly cancelOperation: (operationId: string, reason?: string) => boolean;
  readonly getOperation: (operationId: string) => ProgressOperation | null;
  readonly isOperationActive: (operationId: string) => boolean;
}

/**
 * Main progress hook for managing operations
 */
export const useProgress = (): UseProgressReturn => {
  const [operations, setOperations] = useState<readonly ProgressOperation[]>([]);
  const progressService = getProgressService();

  // Update operations state when progress changes
  useEffect(() => {
    const updateOperations = () => {
      setOperations([...progressService.getActiveOperations()]);
    };

    // Initial load
    updateOperations();

    // Listen for changes
    const removeListener = progressService.addListener(() => {
      updateOperations();
    });

    return removeListener;
  }, [progressService]);

  const startOperation = useCallback(
    (config: ProgressOperationConfig): string | null => {
      const result = progressService.startOperation(config);
      if (result.success) {
        logger.debug(`[START_OPERATION] Started operation: ${result.data}`);
        return result.data;
      } else {
        logger.error(`[START_OPERATION] Failed to start operation: ${result.error.message}`);
        return null;
      }
    },
    [progressService]
  );

  const updateProgress = useCallback(
    (operationId: string, update: ProgressUpdate): boolean => {
      const result = progressService.updateProgress(operationId, update);
      if (!result.success) {
        logger.error(`[UPDATE_PROGRESS] Failed to update progress: ${result.error.message}`);
        return false;
      }
      return true;
    },
    [progressService]
  );

  const completeOperation = useCallback(
    (operationId: string, message?: string): boolean => {
      const result = progressService.completeOperation(operationId, message);
      if (!result.success) {
        logger.error(`[COMPLETE_OPERATION] Failed to complete operation: ${result.error.message}`);
        return false;
      }
      return true;
    },
    [progressService]
  );

  const cancelOperation = useCallback(
    (operationId: string, reason?: string): boolean => {
      const result = progressService.cancelOperation(operationId, reason);
      if (!result.success) {
        logger.error(`[CANCEL_OPERATION] Failed to cancel operation: ${result.error.message}`);
        return false;
      }
      return true;
    },
    [progressService]
  );

  const getOperation = useCallback(
    (operationId: string): ProgressOperation | null => {
      return progressService.getOperation(operationId);
    },
    [progressService]
  );

  const isOperationActive = useCallback(
    (operationId: string): boolean => {
      const operation = progressService.getOperation(operationId);
      return operation ? !operation.state.isCompleted && !operation.state.isCancelled : false;
    },
    [progressService]
  );

  const activeOperations = operations.filter(
    (op) => !op.state.isCompleted && !op.state.isCancelled
  );

  return {
    operations,
    activeOperations,
    startOperation,
    updateProgress,
    completeOperation,
    cancelOperation,
    getOperation,
    isOperationActive,
  };
};

/**
 * Hook for tracking a specific operation
 */
export const useOperationProgress = (operationId: string | null): ProgressOperation | null => {
  const [operation, setOperation] = useState<ProgressOperation | null>(null);
  const progressService = getProgressService();

  useEffect(() => {
    if (!operationId) {
      setOperation(null);
      return;
    }

    const updateOperation = () => {
      const currentOperation = progressService.getOperation(operationId);
      setOperation(currentOperation);
    };

    // Initial load
    updateOperation();

    // Listen for changes
    const removeListener = progressService.addListener((updatedOperation) => {
      if (updatedOperation.id === operationId) {
        setOperation(updatedOperation);
      }
    });

    return removeListener;
  }, [operationId, progressService]);

  return operation;
};

/**
 * Hook for operations of a specific type
 */
export const useOperationsByType = (type: ProgressOperationType): readonly ProgressOperation[] => {
  const [operations, setOperations] = useState<readonly ProgressOperation[]>([]);
  const progressService = getProgressService();

  useEffect(() => {
    const updateOperations = () => {
      setOperations(progressService.getOperationsByType(type));
    };

    // Initial load
    updateOperations();

    // Listen for changes
    const removeListener = progressService.addListener(() => {
      updateOperations();
    });

    return removeListener;
  }, [type, progressService]);

  return operations;
};

/**
 * Hook for cancellable operations with AbortController integration
 */
export const useCancellableOperation = () => {
  const { startOperation, cancelOperation, getOperation } = useProgress();

  const startCancellableOperation = useCallback(
    (
      config: Omit<ProgressOperationConfig, 'cancellable'>,
      onAbort?: () => void
    ): { operationId: string | null; abortController: AbortController | null } => {
      const operationId = startOperation({ ...config, cancellable: true });

      if (!operationId) {
        return { operationId: null, abortController: null };
      }

      const operation = getOperation(operationId);
      const abortController = operation?.abortController || null;

      // Set up abort handler
      if (abortController && onAbort) {
        abortController.signal.addEventListener('abort', onAbort);
      }

      return { operationId, abortController };
    },
    [startOperation, getOperation]
  );

  const cancelWithCleanup = useCallback(
    (operationId: string, reason?: string): boolean => {
      return cancelOperation(operationId, reason);
    },
    [cancelOperation]
  );

  return {
    startCancellableOperation,
    cancelOperation: cancelWithCleanup,
  };
};

/**
 * Hook for automatic progress tracking with async operations
 */
export const useAsyncProgress = () => {
  const { startOperation, updateProgress, completeOperation, cancelOperation } = useProgress();

  const runWithProgress = useCallback(
    async <T>(
      config: ProgressOperationConfig,
      asyncOperation: (
        updateProgress: (update: ProgressUpdate) => void,
        abortSignal?: AbortSignal
      ) => Promise<T>
    ): Promise<T | null> => {
      const operationId = startOperation(config);
      if (!operationId) {
        return null;
      }

      try {
        const operation = getProgressService().getOperation(operationId);
        const abortSignal = operation?.abortController?.signal;

        const progressUpdater = (update: ProgressUpdate) => {
          updateProgress(operationId, update);
        };

        const result = await asyncOperation(progressUpdater, abortSignal);
        completeOperation(operationId, 'Operation completed successfully');
        return result;
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          cancelOperation(operationId, 'Operation was cancelled');
        } else {
          updateProgress(operationId, {
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          completeOperation(operationId, 'Operation failed');
        }
        return null;
      }
    },
    [startOperation, updateProgress, completeOperation, cancelOperation]
  );

  return { runWithProgress };
};

/**
 * Hook for progress state management in Zustand store integration
 */
export const useProgressStore = () => {
  const progressService = getProgressService();

  const getProgressSnapshot = useCallback(() => {
    return {
      operations: [...progressService.getActiveOperations()],
      timestamp: Date.now(),
    };
  }, [progressService]);

  const subscribeToProgress = useCallback(
    (callback: () => void) => {
      return progressService.addListener(callback);
    },
    [progressService]
  );

  return {
    getProgressSnapshot,
    subscribeToProgress,
  };
};
