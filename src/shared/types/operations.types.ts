/**
 * Shared Operation Types
 *
 * Common interfaces and types for operation results, metadata, and patterns
 * used across all features. These types ensure consistent operation handling
 * and eliminate duplication between different modules.
 */

import type { AsyncResult, Brand, Result } from './result.types.js';

/**
 * Branded types for operation identification
 */
export type OperationId = Brand<string, 'OperationId'>;
export type OperationType = Brand<string, 'OperationType'>;
export type TransactionId = Brand<string, 'TransactionId'>;

/**
 * Operation status enumeration
 */
export type OperationStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'timeout';

/**
 * Operation priority levels
 */
export type OperationPriority = 'low' | 'normal' | 'high' | 'critical';

/**
 * Base operation metadata interface
 */
export interface OperationMetadata {
  readonly id: OperationId;
  readonly type: OperationType;
  readonly status: OperationStatus;
  readonly priority: OperationPriority;
  readonly startTime: Date;
  readonly endTime?: Date;
  readonly duration?: number; // milliseconds
  readonly retryCount: number;
  readonly maxRetries: number;
  readonly tags: ReadonlyArray<string>;
  readonly context: Record<string, unknown>;
}

/**
 * Operation error details interface
 */
export interface OperationError {
  readonly code: string;
  readonly message: string;
  readonly details?: Record<string, unknown>;
  readonly stack?: string;
  readonly timestamp: Date;
  readonly recoverable: boolean;
  readonly retryAfter?: number; // milliseconds
  readonly cause?: OperationError;
}

/**
 * Operation metrics interface for performance monitoring
 */
export interface OperationMetrics {
  readonly executionTime: number; // milliseconds
  readonly memoryUsage: number; // bytes
  readonly cpuTime?: number; // milliseconds
  readonly throughput?: number; // operations per second
  readonly errorRate?: number; // 0-1
  readonly cacheHitRate?: number; // 0-1
  readonly networkLatency?: number; // milliseconds
  readonly queueTime?: number; // milliseconds
  readonly customMetrics?: Record<string, number>;
}

/**
 * Enhanced result type with operation metadata
 */
export type OperationResult<T, E = OperationError> = Result<
  { readonly data: T; readonly metadata: OperationMetadata; readonly metrics?: OperationMetrics },
  { readonly error: E; readonly metadata: OperationMetadata; readonly metrics?: OperationMetrics }
>;

/**
 * Async operation result type
 */
export type AsyncOperationResult<T, E = OperationError> = AsyncResult<
  { readonly data: T; readonly metadata: OperationMetadata; readonly metrics?: OperationMetrics },
  { readonly error: E; readonly metadata: OperationMetadata; readonly metrics?: OperationMetrics }
>;

/**
 * Batch operation interface
 */
export interface BatchOperation<TInput, TOutput, TError = OperationError> {
  readonly id: OperationId;
  readonly input: TInput;
  readonly operation: (input: TInput) => OperationResult<TOutput, TError>;
  readonly dependencies?: ReadonlyArray<OperationId>;
  readonly timeout?: number; // milliseconds
}

/**
 * Batch operation result interface
 */
export interface BatchOperationResult<TOutput, TError = OperationError> {
  readonly operationId: OperationId;
  readonly result: OperationResult<TOutput, TError>;
  readonly completedAt: Date;
}

/**
 * Transaction interface for grouped operations
 */
export interface OperationTransaction {
  readonly id: TransactionId;
  readonly operations: ReadonlyArray<OperationId>;
  readonly status: OperationStatus;
  readonly startTime: Date;
  readonly endTime?: Date;
  readonly rollbackData?: Record<string, unknown>;
  readonly isolation: 'read_uncommitted' | 'read_committed' | 'repeatable_read' | 'serializable';
}

/**
 * Operation configuration interface
 */
export interface OperationConfig {
  readonly timeout?: number; // milliseconds
  readonly retries?: number;
  readonly retryDelay?: number; // milliseconds
  readonly retryBackoff?: 'linear' | 'exponential' | 'constant';
  readonly circuit?: {
    readonly failureThreshold: number;
    readonly recoveryTimeout: number; // milliseconds
    readonly halfOpenMaxCalls: number;
  };
  readonly cache?: {
    readonly ttl: number; // milliseconds
    readonly maxSize: number;
    readonly strategy: 'lru' | 'fifo' | 'lfu';
  };
  readonly metrics?: {
    readonly enabled: boolean;
    readonly sampleRate: number; // 0-1
    readonly detailLevel: 'basic' | 'detailed' | 'verbose';
  };
}

/**
 * Operation context interface for execution environment
 */
export interface OperationContext {
  readonly requestId: string;
  readonly userId?: string;
  readonly sessionId?: string;
  readonly traceId?: string;
  readonly parentOperationId?: OperationId;
  readonly startTime: Date;
  readonly timeout?: Date;
  readonly cancellationToken?: AbortSignal;
  readonly metadata: Record<string, unknown>;
}

/**
 * Operation observer interface for monitoring
 */
export interface OperationObserver {
  readonly onStart?: (metadata: OperationMetadata, context: OperationContext) => void;
  readonly onProgress?: (metadata: OperationMetadata, progress: number) => void;
  readonly onComplete?: (metadata: OperationMetadata, metrics: OperationMetrics) => void;
  readonly onError?: (metadata: OperationMetadata, error: OperationError) => void;
  readonly onCancel?: (metadata: OperationMetadata) => void;
}

/**
 * Operation scheduler interface
 */
export interface OperationScheduler {
  readonly schedule: <T, E>(
    operation: () => OperationResult<T, E>,
    config?: OperationConfig
  ) => Promise<OperationResult<T, E>>;
  readonly scheduleAsync: <T, E>(
    operation: () => AsyncOperationResult<T, E>,
    config?: OperationConfig
  ) => AsyncOperationResult<T, E>;
  readonly scheduleBatch: <TInput, TOutput, TError>(
    operations: ReadonlyArray<BatchOperation<TInput, TOutput, TError>>,
    config?: OperationConfig
  ) => Promise<ReadonlyArray<BatchOperationResult<TOutput, TError>>>;
  readonly cancel: (operationId: OperationId) => Result<void, OperationError>;
  readonly getStatus: (operationId: OperationId) => Result<OperationMetadata, OperationError>;
}

/**
 * Operation registry interface for tracking operations
 */
export interface OperationRegistry {
  readonly register: (metadata: OperationMetadata) => Result<void, OperationError>;
  readonly unregister: (operationId: OperationId) => Result<void, OperationError>;
  readonly get: (operationId: OperationId) => Result<OperationMetadata, OperationError>;
  readonly list: (
    filter?: Partial<OperationMetadata>
  ) => Result<ReadonlyArray<OperationMetadata>, OperationError>;
  readonly clear: () => Result<void, OperationError>;
}

/**
 * Parsing operation types
 */
export interface ParseOperation<TInput, TOutput> {
  readonly input: TInput;
  readonly options?: {
    readonly enableWarnings?: boolean;
    readonly enableOptimizations?: boolean;
    readonly maxDepth?: number;
    readonly timeout?: number;
  };
  readonly parser: (input: TInput, options?: unknown) => OperationResult<TOutput, OperationError>;
}

/**
 * Rendering operation types
 */
export interface RenderOperation<TInput, TOutput> {
  readonly input: TInput;
  readonly options?: {
    readonly enableCSG?: boolean;
    readonly enableOptimizations?: boolean;
    readonly maxComplexity?: number;
    readonly quality?: 'low' | 'medium' | 'high';
    readonly timeout?: number;
  };
  readonly renderer: (input: TInput, options?: unknown) => OperationResult<TOutput, OperationError>;
}

/**
 * Validation operation types
 */
export interface ValidationOperation<TInput> {
  readonly input: TInput;
  readonly rules: ReadonlyArray<{
    readonly name: string;
    readonly validate: (input: TInput) => string | null;
  }>;
  readonly options?: {
    readonly stopOnFirstError?: boolean;
    readonly includeWarnings?: boolean;
  };
}

/**
 * Transformation operation types
 */
export interface TransformOperation<TInput, TOutput> {
  readonly input: TInput;
  readonly transformer: (input: TInput) => OperationResult<TOutput, OperationError>;
  readonly options?: {
    readonly preserveMetadata?: boolean;
    readonly enableOptimizations?: boolean;
  };
}

/**
 * Cache operation types
 */
export interface CacheOperation<TKey, TValue> {
  readonly key: TKey;
  readonly value?: TValue;
  readonly ttl?: number; // milliseconds
  readonly tags?: ReadonlyArray<string>;
}

/**
 * IO operation types
 */
export interface IOOperation<TData> {
  readonly path: string;
  readonly data?: TData;
  readonly options?: {
    readonly encoding?: string;
    readonly mode?: string;
    readonly flag?: string;
    readonly timeout?: number;
  };
}

/**
 * Network operation types
 */
export interface NetworkOperation<TRequest, _TResponse> {
  readonly url: string;
  readonly method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  readonly data?: TRequest;
  readonly headers?: Record<string, string>;
  readonly options?: {
    readonly timeout?: number;
    readonly retries?: number;
    readonly compression?: boolean;
    readonly cache?: boolean;
  };
}

/**
 * Operation factory interface
 */
export interface OperationFactory {
  readonly createParse: <TInput, TOutput>(
    config: ParseOperation<TInput, TOutput>
  ) => (input: TInput) => OperationResult<TOutput, OperationError>;

  readonly createRender: <TInput, TOutput>(
    config: RenderOperation<TInput, TOutput>
  ) => (input: TInput) => OperationResult<TOutput, OperationError>;

  readonly createValidation: <TInput>(
    config: ValidationOperation<TInput>
  ) => (input: TInput) => OperationResult<ReadonlyArray<string>, OperationError>;

  readonly createTransform: <TInput, TOutput>(
    config: TransformOperation<TInput, TOutput>
  ) => (input: TInput) => OperationResult<TOutput, OperationError>;
}

/**
 * Type guards for operation results
 */
export const isOperationSuccess = <T, E>(
  result: OperationResult<T, E>
): result is Extract<OperationResult<T, E>, { readonly success: true }> => {
  return result.success === true;
};

export const isOperationError = <T, E>(
  result: OperationResult<T, E>
): result is Extract<OperationResult<T, E>, { readonly success: false }> => {
  return result.success === false;
};

/**
 * Operation status type guards
 */
export const isOperationPending = (status: OperationStatus): status is 'pending' =>
  status === 'pending';
export const isOperationRunning = (status: OperationStatus): status is 'running' =>
  status === 'running';
export const isOperationCompleted = (status: OperationStatus): status is 'completed' =>
  status === 'completed';
export const isOperationFailed = (status: OperationStatus): status is 'failed' =>
  status === 'failed';
export const isOperationCancelled = (status: OperationStatus): status is 'cancelled' =>
  status === 'cancelled';
