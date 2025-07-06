/**
 * Performance measurement utilities
 *
 * Provides utilities for measuring execution time and performance metrics
 * following the project's functional programming patterns.
 */

import { createLogger } from '../../services/logger.service.js';

const logger = createLogger('PerformanceMetrics');

/**
 * Measure the execution time of a synchronous function
 */
export const measureTime = <T>(fn: () => T): { result: T; duration: number } => {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  const duration = end - start;

  logger.debug(`Synchronous operation completed in ${duration.toFixed(2)}ms`);

  return { result, duration };
};

/**
 * Measure the execution time of an asynchronous function
 */
export const measureTimeAsync = async <T>(
  fn: () => Promise<T>
): Promise<{ result: T; duration: number }> => {
  const start = performance.now();
  const result = await fn();
  const end = performance.now();
  const duration = end - start;

  logger.debug(`Asynchronous operation completed in ${duration.toFixed(2)}ms`);

  return { result, duration };
};

/**
 * Create a performance-monitored version of a function
 */
export const withPerformanceMonitoring = <TArgs extends readonly unknown[], TReturn>(
  fn: (...args: TArgs) => TReturn,
  functionName?: string
): ((...args: TArgs) => TReturn) => {
  const name = functionName || fn.name || 'anonymous';

  return (...args: TArgs): TReturn => {
    const start = performance.now();
    const result = fn(...args);
    const duration = performance.now() - start;

    logger.debug(`${name} executed in ${duration.toFixed(2)}ms`);

    // Log performance warning if execution time exceeds 16ms (render target)
    if (duration > 16) {
      logger.warn(`Performance warning: ${name} took ${duration.toFixed(2)}ms (>16ms target)`);
    }

    return result;
  };
};

/**
 * Create a performance-monitored version of an async function
 */
export const withAsyncPerformanceMonitoring = <TArgs extends readonly unknown[], TReturn>(
  fn: (...args: TArgs) => Promise<TReturn>,
  functionName?: string
): ((...args: TArgs) => Promise<TReturn>) => {
  const name = functionName || fn.name || 'anonymous';

  return async (...args: TArgs): Promise<TReturn> => {
    const start = performance.now();
    const result = await fn(...args);
    const duration = performance.now() - start;

    logger.debug(`${name} executed in ${duration.toFixed(2)}ms`);

    // Log performance warning if execution time exceeds 16ms (render target)
    if (duration > 16) {
      logger.warn(`Performance warning: ${name} took ${duration.toFixed(2)}ms (>16ms target)`);
    }

    return result;
  };
};

/**
 * Simple performance timer for manual timing
 */
export class PerformanceTimer {
  private startTime: number | null = null;
  private readonly name: string;

  constructor(name: string = 'timer') {
    this.name = name;
  }

  start(): void {
    this.startTime = performance.now();
    logger.debug(`${this.name} timer started`);
  }

  stop(): number {
    if (this.startTime === null) {
      throw new Error(`Timer ${this.name} was not started`);
    }

    const duration = performance.now() - this.startTime;
    this.startTime = null;

    logger.debug(`${this.name} timer stopped: ${duration.toFixed(2)}ms`);

    return duration;
  }

  reset(): void {
    this.startTime = null;
    logger.debug(`${this.name} timer reset`);
  }
}
