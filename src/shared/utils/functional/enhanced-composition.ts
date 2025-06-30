/**
 * Enhanced Functional Composition Utilities
 *
 * Advanced functional programming utilities that leverage tslog for debugging
 * and provide enhanced composition patterns for bulletproof-react architecture.
 */

import { createLogger } from '../../services/logger.service';
import type { Result } from '../../types/result.types';
import { error, success, tryCatch } from './result';

const logger = createLogger('FunctionalComposition');

/**
 * Enhanced pipe function with logging and error handling
 */
export const pipeWithLogging = <T>(...fns: Array<(arg: T) => T>) => {
  return (initialValue: T): T => {
    logger.debug('Starting pipe operation with', fns.length, 'functions');

    return fns.reduce((acc, fn, index) => {
      logger.debug(`Executing function ${index + 1}/${fns.length}`);
      const result = fn(acc);
      logger.debug(`Function ${index + 1} completed`);
      return result;
    }, initialValue);
  };
};

/**
 * Safe pipe function that returns Result<T,E> for error handling
 */
export const safePipe = <T, E = Error>(
  ...fns: Array<(arg: T) => T>
): ((initialValue: T) => Result<T, E>) => {
  return (initialValue: T): Result<T, E> => {
    logger.debug('Starting safe pipe operation with', fns.length, 'functions');

    return tryCatch(() => {
      return fns.reduce((acc, fn, index) => {
        logger.debug(`Executing safe function ${index + 1}/${fns.length}`);
        const result = fn(acc);
        logger.debug(`Safe function ${index + 1} completed successfully`);
        return result;
      }, initialValue);
    }) as Result<T, E>;
  };
};

/**
 * Async pipe function with Result handling
 */
export const asyncPipe = <T, E = Error>(
  ...fns: Array<(arg: T) => Promise<T> | T>
): ((initialValue: T) => Promise<Result<T, E>>) => {
  return async (initialValue: T): Promise<Result<T, E>> => {
    logger.debug('Starting async pipe operation with', fns.length, 'functions');

    try {
      let result = initialValue;

      for (let i = 0; i < fns.length; i++) {
        logger.debug(`Executing async function ${i + 1}/${fns.length}`);
        const fn = fns[i];
        if (fn) {
          result = await fn(result);
          logger.debug(`Async function ${i + 1} completed successfully`);
        }
      }

      logger.debug('Async pipe operation completed successfully');
      return success(result);
    } catch (err) {
      logger.error('Async pipe operation failed:', err);
      return error(err as E);
    }
  };
};

/**
 * Memoization utility with performance logging
 */
export const memoizeWithLogging = <TArgs extends readonly unknown[], TReturn>(
  fn: (...args: TArgs) => TReturn,
  keyGenerator?: (...args: TArgs) => string
): ((...args: TArgs) => TReturn) => {
  const cache = new Map<string, TReturn>();

  return (...args: TArgs): TReturn => {
    const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);

    if (cache.has(key)) {
      logger.debug('Cache hit for memoized function');
      const cachedResult = cache.get(key);
      if (cachedResult !== undefined) {
        return cachedResult;
      }
    }

    logger.debug('Cache miss, executing memoized function');
    const startTime = performance.now();
    const result = fn(...args);
    const executionTime = performance.now() - startTime;

    cache.set(key, result);
    logger.debug(`Memoized function executed in ${executionTime.toFixed(2)}ms`);

    return result;
  };
};

/**
 * Debounced function with enhanced logging
 */
export const debounceWithLogging = <TArgs extends readonly unknown[]>(
  fn: (...args: TArgs) => void,
  delay: number
): ((...args: TArgs) => void) => {
  let timeoutId: NodeJS.Timeout | null = null;
  let callCount = 0;

  return (...args: TArgs): void => {
    callCount++;
    logger.debug(`Debounced function called (${callCount} times), delay: ${delay}ms`);

    if (timeoutId) {
      clearTimeout(timeoutId);
      logger.debug('Previous debounced call cancelled');
    }

    timeoutId = setTimeout(() => {
      logger.debug('Executing debounced function after delay');
      const startTime = performance.now();
      fn(...args);
      const executionTime = performance.now() - startTime;
      logger.debug(`Debounced function executed in ${executionTime.toFixed(2)}ms`);
      callCount = 0;
    }, delay);
  };
};

/**
 * Throttled function with performance monitoring
 */
export const throttleWithLogging = <TArgs extends readonly unknown[]>(
  fn: (...args: TArgs) => void,
  limit: number
): ((...args: TArgs) => void) => {
  let inThrottle = false;
  let callCount = 0;

  return (...args: TArgs): void => {
    callCount++;

    if (!inThrottle) {
      logger.debug(`Executing throttled function (call ${callCount})`);
      const startTime = performance.now();
      fn(...args);
      const executionTime = performance.now() - startTime;
      logger.debug(`Throttled function executed in ${executionTime.toFixed(2)}ms`);

      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
        logger.debug(`Throttle limit reset after ${limit}ms`);
      }, limit);
    } else {
      logger.debug(`Throttled function call ${callCount} skipped (in throttle period)`);
    }
  };
};

/**
 * Retry utility with exponential backoff and logging
 */
export const retryWithLogging = async <T, E = Error>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<Result<T, E>> => {
  logger.debug(`Starting retry operation with max ${maxRetries} retries`);

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logger.debug(`Retry attempt ${attempt}/${maxRetries}`);
      const startTime = performance.now();
      const result = await fn();
      const executionTime = performance.now() - startTime;

      logger.debug(`Retry attempt ${attempt} succeeded in ${executionTime.toFixed(2)}ms`);
      return success(result);
    } catch (err) {
      logger.warn(`Retry attempt ${attempt} failed:`, err);

      if (attempt === maxRetries) {
        logger.error('All retry attempts exhausted');
        return error(err as E);
      }

      const delay = baseDelay * 2 ** (attempt - 1);
      logger.debug(`Waiting ${delay}ms before next retry attempt`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  // This should never be reached, but TypeScript requires it
  return error(new Error('Unexpected retry completion') as E);
};

/**
 * Function composition with performance monitoring
 */
export const composeWithLogging = <T>(...fns: Array<(arg: T) => T>) => {
  return (initialValue: T): T => {
    logger.debug('Starting compose operation with', fns.length, 'functions');
    const startTime = performance.now();

    // Compose applies functions right-to-left
    const result = fns.reduceRight((acc, fn, index) => {
      logger.debug(`Executing composed function ${fns.length - index}/${fns.length}`);
      return fn(acc);
    }, initialValue);

    const executionTime = performance.now() - startTime;
    logger.debug(`Compose operation completed in ${executionTime.toFixed(2)}ms`);

    return result;
  };
};

/**
 * Curried function utility with logging (simplified for type safety)
 */
export const curryWithLogging = <T, U, V, R>(fn: (a: T, b: U, c: V) => R) => {
  return (a: T) => {
    logger.debug('Curried function called with first argument');
    return (b: U) => {
      logger.debug('Curried function called with second argument');
      return (c: V) => {
        logger.debug('All arguments provided, executing curried function');
        return fn(a, b, c);
      };
    };
  };
};

/**
 * Performance monitoring wrapper for any function
 */
export const withPerformanceLogging = <TArgs extends readonly unknown[], TReturn>(
  fn: (...args: TArgs) => TReturn,
  functionName?: string
): ((...args: TArgs) => TReturn) => {
  const name = functionName || fn.name || 'anonymous';

  return (...args: TArgs): TReturn => {
    logger.debug(`Starting performance monitoring for ${name}`);
    const startTime = performance.now();

    const result = fn(...args);

    const executionTime = performance.now() - startTime;
    logger.debug(`${name} executed in ${executionTime.toFixed(2)}ms`);

    // Log performance warning if execution time exceeds 16ms (render target)
    if (executionTime > 16) {
      logger.warn(`Performance warning: ${name} took ${executionTime.toFixed(2)}ms (>16ms target)`);
    }

    return result;
  };
};
