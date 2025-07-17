/**
 * @file Operation History Service
 *
 * Undo/redo functionality and transaction-like operations with
 * automatic rollback capabilities for production resilience.
 */

export type {
  ExecutionOptions,
  HistoryState,
  Operation,
  OperationResult,
} from './operation-history.service';
export { OperationHistoryService } from './operation-history.service';
