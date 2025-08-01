/**
 * Enhanced Functional Composition Test Suite
 *
 * Tests for enhanced functional programming utilities with tslog integration
 * following TDD methodology with comprehensive coverage.
 */

import { describe, expect, it, vi } from 'vitest';
import {
  asyncPipe,
  composeWithLogging,
  curryWithLogging,
  debounceWithLogging,
  memoizeWithLogging,
  pipeWithLogging,
  retryWithLogging,
  safePipe,
  throttleWithLogging,
} from '@/shared';

describe('Enhanced Functional Composition', () => {
  describe('pipeWithLogging', () => {
    it('should pipe functions with logging', () => {
      const add1 = (x: number) => x + 1;
      const multiply2 = (x: number) => x * 2;
      const subtract3 = (x: number) => x - 3;

      const pipeline = pipeWithLogging(add1, multiply2, subtract3);
      const result = pipeline(5);

      // (5 + 1) * 2 - 3 = 9
      expect(result).toBe(9);
    });

    it('should handle single function', () => {
      const double = (x: number) => x * 2;
      const pipeline = pipeWithLogging(double);

      expect(pipeline(5)).toBe(10);
    });

    it('should handle empty function array', () => {
      const pipeline = pipeWithLogging<number>();
      expect(pipeline(5)).toBe(5);
    });
  });

  describe('safePipe', () => {
    it('should return success result for valid operations', () => {
      const add1 = (x: number) => x + 1;
      const multiply2 = (x: number) => x * 2;

      const pipeline = safePipe(add1, multiply2);
      const result = pipeline(5);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(12); // (5 + 1) * 2
      }
    });

    it('should return error result for throwing operations', () => {
      const add1 = (x: number) => x + 1;
      const throwError = (_x: number): number => {
        throw new Error('Test error');
      };

      const pipeline = safePipe(add1, throwError);
      const result = pipeline(5);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(Error);
      }
    });
  });

  describe('asyncPipe', () => {
    it('should handle async operations successfully', async () => {
      const asyncAdd1 = async (x: number) => x + 1;
      const syncMultiply2 = (x: number) => x * 2;
      const asyncSubtract3 = async (x: number) => x - 3;

      const pipeline = asyncPipe(asyncAdd1, syncMultiply2, asyncSubtract3);
      const result = await pipeline(5);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(9); // (5 + 1) * 2 - 3
      }
    });

    it('should handle async operation errors', async () => {
      const asyncAdd1 = async (x: number) => x + 1;
      const asyncThrowError = async (_x: number): Promise<number> => {
        throw new Error('Async test error');
      };

      const pipeline = asyncPipe(asyncAdd1, asyncThrowError);
      const result = await pipeline(5);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(Error);
      }
    });
  });

  describe('memoizeWithLogging', () => {
    it('should cache function results', () => {
      const expensiveFunction = vi.fn((x: number) => x * x);
      const memoized = memoizeWithLogging(expensiveFunction);

      // First call
      expect(memoized(5)).toBe(25);
      expect(expensiveFunction).toHaveBeenCalledTimes(1);

      // Second call with same argument (should use cache)
      expect(memoized(5)).toBe(25);
      expect(expensiveFunction).toHaveBeenCalledTimes(1);

      // Third call with different argument
      expect(memoized(3)).toBe(9);
      expect(expensiveFunction).toHaveBeenCalledTimes(2);
    });

    it('should use custom key generator', () => {
      const fn = vi.fn((obj: { x: number; y: number }) => obj.x + obj.y);
      const keyGen = (obj: { x: number; y: number }) => `${obj.x}-${obj.y}`;
      const memoized = memoizeWithLogging(fn, keyGen);

      expect(memoized({ x: 1, y: 2 })).toBe(3);
      expect(memoized({ x: 1, y: 2 })).toBe(3);
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe('debounceWithLogging', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should debounce function calls', async () => {
      const fn = vi.fn();
      const debounced = debounceWithLogging(fn, 100);

      debounced();
      debounced();
      debounced();

      expect(fn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(150);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should pass arguments correctly', async () => {
      const fn = vi.fn();
      const debounced = debounceWithLogging(fn, 50);

      debounced('arg1', 'arg2');

      vi.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledWith('arg1', 'arg2');
    });
  });

  describe('throttleWithLogging', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should throttle function calls', async () => {
      const fn = vi.fn();
      const throttled = throttleWithLogging(fn, 100);

      throttled();
      throttled();
      throttled();

      expect(fn).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(150);

      throttled();
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  describe('retryWithLogging', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should succeed on first attempt', async () => {
      const successFn = vi.fn().mockResolvedValue('success');
      const result = await retryWithLogging(successFn, 3);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('success');
      }
      expect(successFn).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and eventually succeed', async () => {
      const failThenSucceed = vi
        .fn()
        .mockRejectedValueOnce(new Error('First failure'))
        .mockRejectedValueOnce(new Error('Second failure'))
        .mockResolvedValue('success');

      // Start the retry operation
      const resultPromise = retryWithLogging(failThenSucceed, 3, 10);

      // Advance timers to allow retry delays to complete
      // First retry delay: 10ms, Second retry delay: 20ms
      vi.advanceTimersByTime(10); // First retry delay
      await vi.runOnlyPendingTimersAsync();
      vi.advanceTimersByTime(20); // Second retry delay
      await vi.runOnlyPendingTimersAsync();

      const result = await resultPromise;

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('success');
      }
      expect(failThenSucceed).toHaveBeenCalledTimes(3);
    });

    it('should fail after max retries', async () => {
      const alwaysFail = vi.fn().mockRejectedValue(new Error('Always fails'));

      // Start the retry operation
      const resultPromise = retryWithLogging(alwaysFail, 2, 10);

      // Advance timers to allow retry delay to complete
      // First retry delay: 10ms (only one retry for maxRetries=2)
      vi.advanceTimersByTime(10);
      await vi.runOnlyPendingTimersAsync();

      const result = await resultPromise;

      expect(result.success).toBe(false);
      expect(alwaysFail).toHaveBeenCalledTimes(2);
    });
  });

  describe('composeWithLogging', () => {
    it('should compose functions right-to-left', () => {
      const add1 = (x: number) => x + 1;
      const multiply2 = (x: number) => x * 2;
      const subtract3 = (x: number) => x - 3;

      const composed = composeWithLogging(subtract3, multiply2, add1);
      const result = composed(5);

      // subtract3(multiply2(add1(5))) = subtract3(multiply2(6)) = subtract3(12) = 9
      expect(result).toBe(9);
    });
  });

  describe('curryWithLogging', () => {
    it('should curry function with three arguments', () => {
      const add = (a: number, b: number, c: number) => a + b + c;
      const curried = curryWithLogging(add);

      expect(curried(1)(2)(3)).toBe(6);
    });
  });
});
