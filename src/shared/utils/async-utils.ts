/**
 * @file Async Utilities - Promise and Async Operation Helpers
 * 
 * Comprehensive collection of utilities for handling asynchronous operations
 * with proper error handling, timeouts, retries, and functional patterns.
 * 
 * Features:
 * - Promise utilities with timeout and retry logic
 * - Async operation composition and chaining
 * - Rate limiting and throttling
 * - Parallel and sequential execution patterns
 * - Error handling and recovery strategies
 * 
 * @author Luciano Júnior
 * @date June 2025
 */

import type { Result, AsyncResult } from '../types/result-types';
import { Ok, Err, tryCatch } from '../types/result-types';

// ============================================================================
// Core Async Types
// ============================================================================

/**
 * Delay function type
 */
export type DelayFn = (ms: number) => Promise<void>;

/**
 * Retry options
 */
export interface RetryOptions {
  readonly maxAttempts: number;
  readonly delay: number;
  readonly backoffMultiplier?: number;
  readonly maxDelay?: number;
  readonly shouldRetry?: (error: Error, attempt: number) => boolean;
}

/**
 * Timeout options
 */
export interface TimeoutOptions {
  readonly timeoutMs: number;
  readonly timeoutMessage?: string;
}

/**
 * Rate limit options
 */
export interface RateLimitOptions {
  readonly maxConcurrent: number;
  readonly intervalMs: number;
  readonly maxPerInterval: number;
}

// ============================================================================
// Basic Async Utilities
// ============================================================================

/**
 * Create a delay promise
 */
export const delay: DelayFn = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Create a timeout promise that rejects
 */
export const timeout = (ms: number, message = 'Operation timed out'): Promise<never> => {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(message)), ms);
  });
};

/**
 * Add timeout to any promise
 */
export const withTimeout = <T>(
  promise: Promise<T>,
  options: TimeoutOptions
): Promise<T> => {
  const { timeoutMs, timeoutMessage = `Operation timed out after ${timeoutMs}ms` } = options;
  
  return Promise.race([
    promise,
    timeout(timeoutMs, timeoutMessage)
  ]);
};

/**
 * Convert callback-style function to promise
 */
export const promisify = <TArgs extends any[], TResult>(
  fn: (...args: [...TArgs, (error: Error | null, result?: TResult) => void]) => void
) => {
  return (...args: TArgs): Promise<TResult> => {
    return new Promise((resolve, reject) => {
      fn(...args, (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result!);
        }
      });
    });
  };
};

// ============================================================================
// Retry Logic
// ============================================================================

/**
 * Retry an async operation with exponential backoff
 */
export const retry = async <T>(
  operation: () => Promise<T>,
  options: RetryOptions
): Promise<T> => {
  const {
    maxAttempts,
    delay: initialDelay,
    backoffMultiplier = 2,
    maxDelay = 30000,
    shouldRetry = () => true
  } = options;

  let lastError: Error;
  let currentDelay = initialDelay;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`[DEBUG] Retry attempt ${attempt}/${maxAttempts}`);
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      console.log(`[DEBUG] Attempt ${attempt} failed:`, lastError.message);

      if (attempt === maxAttempts || !shouldRetry(lastError, attempt)) {
        break;
      }

      console.log(`[DEBUG] Waiting ${currentDelay}ms before retry`);
      await delay(currentDelay);
      
      currentDelay = Math.min(currentDelay * backoffMultiplier, maxDelay);
    }
  }

  throw lastError!;
};

/**
 * Retry with Result type (no exceptions)
 */
export const retryWithResult = async <T>(
  operation: () => AsyncResult<T>,
  options: RetryOptions
): AsyncResult<T> => {
  const {
    maxAttempts,
    delay: initialDelay,
    backoffMultiplier = 2,
    maxDelay = 30000,
    shouldRetry = () => true
  } = options;

  let lastError: Error;
  let currentDelay = initialDelay;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.log(`[DEBUG] Retry attempt ${attempt}/${maxAttempts}`);
    
    const result = await operation();
    
    if (result.success) {
      return result;
    }

    lastError = result.error instanceof Error ? result.error : new Error(String(result.error));
    console.log(`[DEBUG] Attempt ${attempt} failed:`, lastError.message);

    if (attempt === maxAttempts || !shouldRetry(lastError, attempt)) {
      break;
    }

    console.log(`[DEBUG] Waiting ${currentDelay}ms before retry`);
    await delay(currentDelay);
    
    currentDelay = Math.min(currentDelay * backoffMultiplier, maxDelay);
  }

  return Err(lastError!);
};

// ============================================================================
// Parallel Execution
// ============================================================================

/**
 * Execute promises in parallel with concurrency limit
 */
export const parallelLimit = async <T>(
  operations: Array<() => Promise<T>>,
  limit: number
): Promise<T[]> => {
  if (limit <= 0) {
    throw new Error('Concurrency limit must be greater than 0');
  }

  const results: T[] = [];
  const executing: Promise<void>[] = [];

  for (let i = 0; i < operations.length; i++) {
    const operation = operations[i];
    
    const promise = operation().then(result => {
      results[i] = result;
    });

    executing.push(promise);

    if (executing.length >= limit) {
      await Promise.race(executing);
      executing.splice(executing.findIndex(p => p === promise), 1);
    }
  }

  await Promise.all(executing);
  return results;
};

/**
 * Execute operations in parallel and collect results with Result type
 */
export const parallelWithResults = async <T>(
  operations: Array<() => AsyncResult<T>>
): Promise<{ successes: T[]; errors: Error[] }> => {
  const results = await Promise.all(operations.map(op => op()));
  
  const successes: T[] = [];
  const errors: Error[] = [];

  for (const result of results) {
    if (result.success) {
      successes.push(result.data);
    } else {
      errors.push(result.error instanceof Error ? result.error : new Error(String(result.error)));
    }
  }

  return { successes, errors };
};

/**
 * Execute operations in parallel, fail fast on first error
 */
export const parallelFailFast = async <T>(
  operations: Array<() => Promise<T>>
): Promise<T[]> => {
  return Promise.all(operations.map(op => op()));
};

/**
 * Execute operations in parallel, continue on errors
 */
export const parallelSettled = async <T>(
  operations: Array<() => Promise<T>>
): Promise<Array<{ status: 'fulfilled'; value: T } | { status: 'rejected'; reason: Error }>> => {
  const promises = operations.map(op => op());
  const results = await Promise.allSettled(promises);
  
  return results.map(result => ({
    status: result.status,
    ...(result.status === 'fulfilled' 
      ? { value: result.value }
      : { reason: result.reason instanceof Error ? result.reason : new Error(String(result.reason)) }
    )
  }));
};

// ============================================================================
// Sequential Execution
// ============================================================================

/**
 * Execute operations sequentially
 */
export const sequential = async <T>(
  operations: Array<() => Promise<T>>
): Promise<T[]> => {
  const results: T[] = [];
  
  for (const operation of operations) {
    const result = await operation();
    results.push(result);
  }
  
  return results;
};

/**
 * Execute operations sequentially with early termination on error
 */
export const sequentialFailFast = async <T>(
  operations: Array<() => AsyncResult<T>>
): AsyncResult<T[]> => {
  const results: T[] = [];
  
  for (const operation of operations) {
    const result = await operation();
    
    if (!result.success) {
      return result;
    }
    
    results.push(result.data);
  }
  
  return Ok(results);
};

/**
 * Execute operations sequentially, collecting all results
 */
export const sequentialSettled = async <T>(
  operations: Array<() => AsyncResult<T>>
): Promise<{ successes: T[]; errors: Error[] }> => {
  const successes: T[] = [];
  const errors: Error[] = [];
  
  for (const operation of operations) {
    const result = await operation();
    
    if (result.success) {
      successes.push(result.data);
    } else {
      errors.push(result.error instanceof Error ? result.error : new Error(String(result.error)));
    }
  }
  
  return { successes, errors };
};

// ============================================================================
// Rate Limiting and Throttling
// ============================================================================

/**
 * Create a rate-limited function
 */
export const rateLimit = <TArgs extends any[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  options: RateLimitOptions
): ((...args: TArgs) => Promise<TResult>) => {
  const { maxConcurrent, intervalMs, maxPerInterval } = options;
  
  let currentConcurrent = 0;
  let intervalCount = 0;
  let intervalStart = Date.now();
  const queue: Array<{
    args: TArgs;
    resolve: (value: TResult) => void;
    reject: (error: Error) => void;
  }> = [];

  const processQueue = async () => {
    if (queue.length === 0 || currentConcurrent >= maxConcurrent) {
      return;
    }

    const now = Date.now();
    if (now - intervalStart >= intervalMs) {
      intervalStart = now;
      intervalCount = 0;
    }

    if (intervalCount >= maxPerInterval) {
      const waitTime = intervalMs - (now - intervalStart);
      await delay(waitTime);
      return processQueue();
    }

    const { args, resolve, reject } = queue.shift()!;
    currentConcurrent++;
    intervalCount++;

    try {
      const result = await fn(...args);
      resolve(result);
    } catch (error) {
      reject(error instanceof Error ? error : new Error(String(error)));
    } finally {
      currentConcurrent--;
      processQueue();
    }
  };

  return (...args: TArgs): Promise<TResult> => {
    return new Promise((resolve, reject) => {
      queue.push({ args, resolve, reject });
      processQueue();
    });
  };
};

/**
 * Create a debounced async function
 */
export const debounce = <TArgs extends any[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  delayMs: number
): ((...args: TArgs) => Promise<TResult>) => {
  let timeoutId: NodeJS.Timeout | null = null;
  let latestResolve: ((value: TResult) => void) | null = null;
  let latestReject: ((error: Error) => void) | null = null;

  return (...args: TArgs): Promise<TResult> => {
    return new Promise((resolve, reject) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      latestResolve = resolve;
      latestReject = reject;

      timeoutId = setTimeout(async () => {
        try {
          const result = await fn(...args);
          latestResolve?.(result);
        } catch (error) {
          latestReject?.(error instanceof Error ? error : new Error(String(error)));
        }
      }, delayMs);
    });
  };
};

/**
 * Create a throttled async function
 */
export const throttle = <TArgs extends any[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  intervalMs: number
): ((...args: TArgs) => Promise<TResult>) => {
  let lastExecution = 0;
  let pendingPromise: Promise<TResult> | null = null;

  return (...args: TArgs): Promise<TResult> => {
    const now = Date.now();
    
    if (pendingPromise) {
      return pendingPromise;
    }

    if (now - lastExecution >= intervalMs) {
      lastExecution = now;
      pendingPromise = fn(...args);
      
      pendingPromise.finally(() => {
        pendingPromise = null;
      });
      
      return pendingPromise;
    }

    const waitTime = intervalMs - (now - lastExecution);
    pendingPromise = delay(waitTime).then(() => {
      lastExecution = Date.now();
      return fn(...args);
    });

    pendingPromise.finally(() => {
      pendingPromise = null;
    });

    return pendingPromise;
  };
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Convert a synchronous function to async
 */
export const toAsync = <TArgs extends any[], TResult>(
  fn: (...args: TArgs) => TResult
): ((...args: TArgs) => Promise<TResult>) => {
  return async (...args: TArgs): Promise<TResult> => {
    return fn(...args);
  };
};

/**
 * Memoize an async function
 */
export const memoizeAsync = <TArgs extends any[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  keyFn?: (...args: TArgs) => string
): ((...args: TArgs) => Promise<TResult>) => {
  const cache = new Map<string, Promise<TResult>>();
  const getKey = keyFn || ((...args) => JSON.stringify(args));

  return (...args: TArgs): Promise<TResult> => {
    const key = getKey(...args);
    
    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const promise = fn(...args);
    cache.set(key, promise);

    promise.catch(() => {
      cache.delete(key);
    });

    return promise;
  };
};

/**
 * Create a circuit breaker for async operations
 */
export const circuitBreaker = <TArgs extends any[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  options: {
    failureThreshold: number;
    resetTimeoutMs: number;
    monitoringPeriodMs: number;
  }
): ((...args: TArgs) => Promise<TResult>) => {
  const { failureThreshold, resetTimeoutMs, monitoringPeriodMs } = options;
  
  let state: 'closed' | 'open' | 'half-open' = 'closed';
  let failureCount = 0;
  let lastFailureTime = 0;
  let successCount = 0;

  return async (...args: TArgs): Promise<TResult> => {
    const now = Date.now();

    if (state === 'open') {
      if (now - lastFailureTime >= resetTimeoutMs) {
        state = 'half-open';
        successCount = 0;
      } else {
        throw new Error('Circuit breaker is open');
      }
    }

    try {
      const result = await fn(...args);
      
      if (state === 'half-open') {
        successCount++;
        if (successCount >= 3) {
          state = 'closed';
          failureCount = 0;
        }
      } else {
        failureCount = 0;
      }
      
      return result;
    } catch (error) {
      failureCount++;
      lastFailureTime = now;
      
      if (failureCount >= failureThreshold) {
        state = 'open';
      }
      
      throw error;
    }
  };
};

// ============================================================================
// All functions are exported individually above using 'export const'
// ============================================================================

// All types are exported inline above where they are defined
