/**
 * @file Operation History Service
 * 
 * Undo/redo functionality and transaction-like operations with
 * automatic rollback capabilities for production resilience.
 */

export { OperationHistoryService } from './operation-history.service';
export type {
  Operation,
  OperationResult,
  HistoryState,
  ExecutionOptions,
} from './operation-history.service';
