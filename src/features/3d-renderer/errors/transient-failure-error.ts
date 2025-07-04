/**
 * Transient Failure Error
 *
 * Specialized error class for transient failures that can be recovered through retries,
 * with support for exponential backoff and circuit breaker patterns.
 */

import type { MatrixError, MatrixOperation } from '../types/matrix.types.js';

/**
 * Error thrown when transient failures occur that should be retried
 */
export class TransientFailureError extends Error implements MatrixError {
  public readonly code: string;
  public readonly operation: MatrixOperation;
  public readonly matrixSize: readonly [number, number];
  public readonly details: Record<string, unknown>;
  public readonly recoverable: boolean = true;
  public readonly isTransient: boolean = true;
  public readonly retryAfter?: number;
  public readonly maxRetries?: number;

  constructor(
    message: string,
    operation: MatrixOperation = 'multiply',
    matrixSize: readonly [number, number] = [0, 0],
    details: Record<string, unknown> = {},
    retryAfter?: number,
    maxRetries?: number
  ) {
    super(message);
    this.name = 'TransientFailureError';
    this.code = 'TRANSIENT_FAILURE';
    this.operation = operation;
    this.matrixSize = matrixSize;
    this.details = details;
    if (retryAfter !== undefined) {
      this.retryAfter = retryAfter;
    }
    if (maxRetries !== undefined) {
      this.maxRetries = maxRetries;
    }

    // Maintains proper stack trace for where the error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, TransientFailureError);
    }
  }

  /**
   * Creates a TransientFailureError for cache operations
   */
  static cache(
    message: string = 'cache operation failed',
    retryAfter: number = 1000
  ): TransientFailureError {
    return new TransientFailureError(
      `Cache transient failure: ${message}`,
      'multiply',
      [0, 0],
      { type: 'cache', simulated: false },
      retryAfter,
      3
    );
  }

  /**
   * Creates a TransientFailureError for network operations
   */
  static network(
    message: string = 'network operation failed',
    retryAfter: number = 2000
  ): TransientFailureError {
    return new TransientFailureError(
      `Network transient failure: ${message}`,
      'multiply',
      [0, 0],
      { type: 'network', simulated: false },
      retryAfter,
      5
    );
  }

  /**
   * Creates a TransientFailureError for memory pressure
   */
  static memoryPressure(
    message: string = 'memory pressure detected',
    retryAfter: number = 3000
  ): TransientFailureError {
    return new TransientFailureError(
      `Memory pressure transient failure: ${message}`,
      'multiply',
      [0, 0],
      { type: 'memory', simulated: false },
      retryAfter,
      2
    );
  }

  /**
   * Creates a TransientFailureError for validation operations
   */
  static validation(
    message: string = 'validation operation failed',
    retryAfter: number = 500
  ): TransientFailureError {
    return new TransientFailureError(
      `Validation transient failure: ${message}`,
      'validate',
      [0, 0],
      { type: 'validation', simulated: false },
      retryAfter,
      4
    );
  }

  /**
   * Creates a simulated TransientFailureError for testing
   */
  static simulated(
    message: string = 'simulated',
    operation: MatrixOperation = 'multiply'
  ): TransientFailureError {
    return new TransientFailureError(
      `Simulated transient failure: ${message}`,
      operation,
      [0, 0],
      { simulated: true },
      1000,
      3
    );
  }

  /**
   * Creates a JSON-serializable representation of the error
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      operation: this.operation,
      matrixSize: this.matrixSize,
      details: this.details,
      recoverable: this.recoverable,
      isTransient: this.isTransient,
      retryAfter: this.retryAfter,
      maxRetries: this.maxRetries,
      stack: this.stack,
    };
  }

  /**
   * Check if this error should be retried based on attempt count
   */
  shouldRetry(currentAttempt: number): boolean {
    return this.maxRetries ? currentAttempt < this.maxRetries : currentAttempt < 3;
  }

  /**
   * Calculate delay for exponential backoff
   */
  getRetryDelay(attempt: number, baseDelay: number = this.retryAfter || 1000): number {
    // Exponential backoff with jitter
    const exponentialDelay = baseDelay * 2 ** attempt;
    const jitter = Math.random() * 0.1 * exponentialDelay; // 10% jitter
    return Math.min(exponentialDelay + jitter, 30000); // Cap at 30 seconds
  }
}
