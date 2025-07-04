/**
 * Cache Failure Error
 *
 * Specialized error class for matrix cache service failures,
 * following the MatrixError interface and functional error handling patterns.
 */

import type { MatrixError, MatrixOperation } from '../types/matrix.types.js';

/**
 * Error thrown when cache operations fail
 */
export class CacheFailureError extends Error implements MatrixError {
  public readonly code: string;
  public readonly operation: MatrixOperation;
  public readonly matrixSize: readonly [number, number];
  public readonly details: Record<string, unknown>;
  public readonly recoverable: boolean;

  constructor(
    message: string,
    operation: MatrixOperation = 'multiply', // Default operation
    matrixSize: readonly [number, number] = [0, 0],
    details: Record<string, unknown> = {},
    recoverable: boolean = true
  ) {
    super(message);
    this.name = 'CacheFailureError';
    this.code = 'CACHE_FAILURE';
    this.operation = operation;
    this.matrixSize = matrixSize;
    this.details = details;
    this.recoverable = recoverable;

    // Maintains proper stack trace for where the error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CacheFailureError);
    }
  }

  /**
   * Creates a CacheFailureError for a simulated failure
   */
  static simulated(message: string = 'simulated'): CacheFailureError {
    return new CacheFailureError(
      `Cache operation failed: ${message}`,
      'multiply',
      [0, 0],
      { simulated: true },
      true
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
      stack: this.stack,
    };
  }
}
