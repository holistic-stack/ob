/**
 * Retry with Exponential Backoff Utility
 *
 * Robust retry mechanism with exponential backoff, jitter, circuit breaker,
 * and abort signal support for resilient operation handling.
 */

import { createLogger } from '../../services/logger.service.js';
import type { Result } from '../../types/result.types.js';
import { error as createError, success } from '../functional/result.js';

const logger = createLogger('RetryWithBackoff');

/**
 * Configuration for retry operations
 */
export interface RetryConfig {
  readonly maxAttempts?: number;
  readonly baseDelay?: number;
  readonly maxDelay?: number;
  readonly exponentialBase?: number;
  readonly jitterPercent?: number;
  readonly shouldRetry?: (error: Error, attempt: number) => boolean;
  readonly onRetry?: (error: Error, attempt: number, delay: number) => void;
  readonly abortSignal?: AbortSignal;
  readonly circuitBreakerThreshold?: number;
  readonly circuitBreakerWindow?: number;
}

/**
 * Default retry configuration
 */
const DEFAULT_RETRY_CONFIG: Required<
  Pick<
    RetryConfig,
    | 'maxAttempts'
    | 'baseDelay'
    | 'maxDelay'
    | 'exponentialBase'
    | 'jitterPercent'
    | 'circuitBreakerThreshold'
    | 'circuitBreakerWindow'
  >
> = {
  maxAttempts: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  exponentialBase: 2,
  jitterPercent: 10,
  circuitBreakerThreshold: 5,
  circuitBreakerWindow: 60000, // 1 minute
};

/**
 * Circuit breaker state tracking
 */
interface CircuitBreakerState {
  failureCount: number;
  lastFailureTime: number;
  isOpen: boolean;
}

/**
 * Global circuit breaker state per operation type
 */
const circuitBreakers = new Map<string, CircuitBreakerState>();

/**
 * Check if operation is an idempotent operation that can be safely retried
 */
function isIdempotentOperation(operation: string): boolean {
  const idempotentOps = [
    'get',
    'read',
    'fetch',
    'validate',
    'convert',
    'calculate',
    'query',
    'check',
    'analyze',
    'transform',
    'serialize',
  ];
  return idempotentOps.some((op) => operation.toLowerCase().includes(op));
}

/**
 * Check if error is a transient failure that should be retried
 */
function isTransientError(error: Error): boolean {
  // Check for TransientFailureError
  interface ErrorWithTransientFlag extends Error {
    isTransient?: boolean;
  }
  const errorWithFlag = error as ErrorWithTransientFlag;
  if (error.name === 'TransientFailureError' || errorWithFlag.isTransient) {
    return true;
  }

  // Check for common transient error patterns
  const transientPatterns = [
    /timeout/i,
    /network/i,
    /connection/i,
    /temporary/i,
    /cache.*fail/i,
    /service.*unavailable/i,
    /rate.*limit/i,
    /throttle/i,
    /busy/i,
    /overload/i,
    /memory.*pressure/i,
  ];

  const message = error.message.toLowerCase();
  return transientPatterns.some((pattern) => pattern.test(message));
}

/**
 * Calculate delay with exponential backoff and jitter
 */
function calculateDelay(
  attempt: number,
  baseDelay: number,
  exponentialBase: number,
  maxDelay: number,
  jitterPercent: number
): number {
  // Exponential backoff: baseDelay * (exponentialBase ^ attempt)
  const exponentialDelay = baseDelay * exponentialBase ** attempt;

  // Add jitter to prevent thundering herd
  const jitter = exponentialDelay * (jitterPercent / 100) * (Math.random() * 2 - 1);
  const delayWithJitter = exponentialDelay + jitter;

  // Cap at maximum delay
  return Math.min(Math.max(delayWithJitter, 0), maxDelay);
}

/**
 * Check and update circuit breaker state
 */
function checkCircuitBreaker(operationKey: string, config: RetryConfig): boolean {
  const _threshold = config.circuitBreakerThreshold ?? DEFAULT_RETRY_CONFIG.circuitBreakerThreshold;
  const window = config.circuitBreakerWindow ?? DEFAULT_RETRY_CONFIG.circuitBreakerWindow;

  let state = circuitBreakers.get(operationKey);
  if (!state) {
    state = { failureCount: 0, lastFailureTime: 0, isOpen: false };
    circuitBreakers.set(operationKey, state);
  }

  const now = Date.now();

  // Check if circuit breaker window has expired
  if (state.isOpen && now - state.lastFailureTime > window) {
    logger.debug(`Circuit breaker reset for ${operationKey} after ${window}ms`);
    state.isOpen = false;
    state.failureCount = 0;
  }

  return !state.isOpen;
}

/**
 * Record circuit breaker failure
 */
function recordCircuitBreakerFailure(operationKey: string, config: RetryConfig): void {
  const threshold = config.circuitBreakerThreshold ?? DEFAULT_RETRY_CONFIG.circuitBreakerThreshold;

  let state = circuitBreakers.get(operationKey);
  if (!state) {
    state = { failureCount: 0, lastFailureTime: 0, isOpen: false };
    circuitBreakers.set(operationKey, state);
  }

  state.failureCount++;
  state.lastFailureTime = Date.now();

  if (state.failureCount >= threshold) {
    state.isOpen = true;
    logger.warn(`Circuit breaker opened for ${operationKey} after ${state.failureCount} failures`);
  }
}

/**
 * Reset circuit breaker on success
 */
function resetCircuitBreaker(operationKey: string): void {
  const state = circuitBreakers.get(operationKey);
  if (state) {
    state.failureCount = 0;
    state.isOpen = false;
  }
}

/**
 * Sleep with abort signal support
 */
function sleep(ms: number, abortSignal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (abortSignal?.aborted) {
      reject(new Error('Operation aborted'));
      return;
    }

    const timeout = setTimeout(resolve, ms);

    const onAbort = () => {
      clearTimeout(timeout);
      reject(new Error('Operation aborted'));
    };

    abortSignal?.addEventListener('abort', onAbort, { once: true });

    // Clean up event listener when promise resolves
    timeout.unref?.();
  });
}

/**
 * Retry an async operation with exponential backoff
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  operationName: string,
  config: RetryConfig = {}
): Promise<Result<T, string>> {
  const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  const operationKey = operationName;

  // Check if operation should be retried based on type
  const isIdempotent = isIdempotentOperation(operationName);
  if (!isIdempotent) {
    logger.warn(`Operation ${operationName} is not idempotent, retries may have side effects`);
  }

  // Check circuit breaker
  if (!checkCircuitBreaker(operationKey, finalConfig)) {
    return createError(`Circuit breaker is open for operation: ${operationName}`);
  }

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < finalConfig.maxAttempts; attempt++) {
    try {
      // Check abort signal before each attempt
      if (config.abortSignal?.aborted) {
        return createError('Operation aborted');
      }

      logger.debug(
        `Attempting ${operationName}, attempt ${attempt + 1}/${finalConfig.maxAttempts}`
      );

      const result = await operation();

      // Success - reset circuit breaker and return result
      resetCircuitBreaker(operationKey);
      logger.debug(`Operation ${operationName} succeeded on attempt ${attempt + 1}`);

      return success(result);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      lastError = error;

      logger.debug(`Operation ${operationName} failed on attempt ${attempt + 1}: ${error.message}`);

      // Check if this error should be retried
      const shouldRetryDefault = isTransientError(error);
      const shouldRetryCustom = config.shouldRetry?.(error, attempt) ?? shouldRetryDefault;

      const isLastAttempt = attempt === finalConfig.maxAttempts - 1;

      if (!shouldRetryCustom || isLastAttempt) {
        // Record failure for circuit breaker
        recordCircuitBreakerFailure(operationKey, finalConfig);

        if (isLastAttempt) {
          logger.warn(
            `Operation ${operationName} failed after ${finalConfig.maxAttempts} attempts`
          );
        } else {
          logger.debug(
            `Operation ${operationName} failed with non-retryable error: ${error.message}`
          );
        }
        break;
      }

      // Calculate delay for next attempt
      const delay = calculateDelay(
        attempt,
        finalConfig.baseDelay,
        finalConfig.exponentialBase,
        finalConfig.maxDelay,
        finalConfig.jitterPercent
      );

      // Call retry callback if provided
      config.onRetry?.(error, attempt + 1, delay);

      logger.debug(
        `Retrying ${operationName} in ${delay}ms (attempt ${attempt + 2}/${finalConfig.maxAttempts})`
      );

      try {
        await sleep(delay, config.abortSignal);
      } catch (_sleepError) {
        // Sleep was aborted
        return createError('Operation aborted during retry delay');
      }
    }
  }

  const errorMessage = lastError
    ? `Operation ${operationName} failed: ${lastError.message}`
    : `Operation ${operationName} failed with unknown error`;

  return createError(errorMessage);
}

/**
 * Retry a synchronous operation with exponential backoff
 */
export async function retryWithBackoffSync<T>(
  operation: () => T,
  operationName: string,
  config: RetryConfig = {}
): Promise<Result<T, string>> {
  const asyncOperation = async (): Promise<T> => operation();
  return retryWithBackoff(asyncOperation, operationName, config);
}

/**
 * Reset all circuit breakers (useful for testing or emergency recovery)
 */
export function resetAllCircuitBreakers(): void {
  circuitBreakers.clear();
  logger.info('All circuit breakers have been reset');
}

/**
 * Get circuit breaker status for monitoring
 */
export function getCircuitBreakerStatus(): Record<string, CircuitBreakerState> {
  const status: Record<string, CircuitBreakerState> = {};
  for (const [key, state] of circuitBreakers.entries()) {
    status[key] = { ...state };
  }
  return status;
}

/**
 * Wrapper for critical sections with automatic retry logic
 */
export function withRetry<T extends unknown[], R>(
  operation: (...args: T) => Promise<R>,
  operationName: string,
  config: RetryConfig = {}
) {
  return async (...args: T): Promise<Result<R, string>> => {
    return retryWithBackoff(() => operation(...args), operationName, config);
  };
}
