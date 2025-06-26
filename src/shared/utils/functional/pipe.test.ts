/**
 * Function Composition Utilities Test Suite
 * 
 * Tests for pipe, compose, and other functional utilities
 * following TDD methodology with comprehensive coverage.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  pipe,
  compose,
  curry,
  partial,
  identity,
  constant,
  flip,
  memoize,
  debounce,
  throttle,
  once,
  tap,
  when,
  unless,
  prop,
  path,
  head,
  tail,
  last,
  init,
  take,
  drop,
  reverse
} from './pipe';

describe('Function Composition Utilities', () => {
  describe('pipe', () => {
    it('should compose functions left to right', () => {
      const add1 = (x: number) => x + 1;
      const multiply2 = (x: number) => x * 2;
      const subtract3 = (x: number) => x - 3;
      
      const composed = pipe(add1, multiply2, subtract3);
      const result = composed(5);
      
      // (5 + 1) * 2 - 3 = 9
      expect(result).toBe(9);
    });

    it('should work with single function', () => {
      const add1 = (x: number) => x + 1;
      const composed = pipe(add1);
      
      expect(composed(5)).toBe(6);
    });
  });

  describe('compose', () => {
    it('should compose functions right to left', () => {
      const add1 = (x: number) => x + 1;
      const multiply2 = (x: number) => x * 2;
      const subtract3 = (x: number) => x - 3;
      
      const composed = compose(subtract3, multiply2, add1);
      const result = composed(5);
      
      // (5 + 1) * 2 - 3 = 9
      expect(result).toBe(9);
    });
  });

  describe('curry', () => {
    it('should curry a binary function', () => {
      const add = (a: number, b: number) => a + b;
      const curriedAdd = curry(add);
      
      expect(curriedAdd(5)(3)).toBe(8);
    });

    it('should curry a ternary function', () => {
      const add3 = (a: number, b: number, c: number) => a + b + c;
      const curriedAdd3 = curry(add3);
      
      expect(curriedAdd3(1)(2)(3)).toBe(6);
    });
  });

  describe('partial', () => {
    it('should partially apply arguments', () => {
      const add3 = (a: number, b: number, c: number) => a + b + c;
      const add5AndSomething = partial(add3, 5);
      
      expect(add5AndSomething(3, 2)).toBe(10);
    });
  });

  describe('identity', () => {
    it('should return the same value', () => {
      expect(identity(42)).toBe(42);
      expect(identity('test')).toBe('test');
      expect(identity(null)).toBe(null);
    });
  });

  describe('constant', () => {
    it('should return a function that always returns the same value', () => {
      const always42 = constant(42);
      
      expect(always42()).toBe(42);
      expect(always42()).toBe(42);
    });
  });

  describe('flip', () => {
    it('should reverse argument order', () => {
      const subtract = (a: number, b: number) => a - b;
      const flippedSubtract = flip(subtract);
      
      expect(subtract(10, 3)).toBe(7);
      expect(flippedSubtract(3, 10)).toBe(7);
    });
  });

  describe('memoize', () => {
    it('should cache function results', () => {
      const expensiveFunction = vi.fn((x: number) => x * x);
      const memoized = memoize(expensiveFunction);
      
      expect(memoized(5)).toBe(25);
      expect(memoized(5)).toBe(25);
      expect(expensiveFunction).toHaveBeenCalledTimes(1);
    });

    it('should use custom key function', () => {
      const fn = vi.fn((obj: { id: number; name: string }) => obj.id * 2);
      const memoized = memoize(fn, (obj) => obj.id.toString());
      
      memoized({ id: 1, name: 'first' });
      memoized({ id: 1, name: 'second' }); // Different object, same id
      
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe('debounce', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    it('should delay function execution', () => {
      const fn = vi.fn();
      const debounced = debounce(fn, 100);
      
      debounced();
      expect(fn).not.toHaveBeenCalled();
      
      vi.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should reset delay on subsequent calls', () => {
      const fn = vi.fn();
      const debounced = debounce(fn, 100);
      
      debounced();
      vi.advanceTimersByTime(50);
      debounced(); // Reset timer
      vi.advanceTimersByTime(50);
      expect(fn).not.toHaveBeenCalled();
      
      vi.advanceTimersByTime(50);
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe('throttle', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    it('should limit function calls', () => {
      const fn = vi.fn();
      const throttled = throttle(fn, 100);
      
      throttled();
      throttled();
      throttled();
      
      expect(fn).toHaveBeenCalledTimes(1);
      
      vi.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  describe('once', () => {
    it('should call function only once', () => {
      const fn = vi.fn(() => 42);
      const onceFunction = once(fn);
      
      expect(onceFunction()).toBe(42);
      expect(onceFunction()).toBe(42);
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe('tap', () => {
    it('should execute side effect and return original value', () => {
      const sideEffect = vi.fn();
      const tapped = tap(sideEffect);
      
      const result = tapped(42);
      
      expect(result).toBe(42);
      expect(sideEffect).toHaveBeenCalledWith(42);
    });
  });

  describe('when', () => {
    it('should apply function when predicate is true', () => {
      const isEven = (x: number) => x % 2 === 0;
      const double = (x: number) => x * 2;
      const conditionalDouble = when(isEven, double);
      
      expect(conditionalDouble(4)).toBe(8);
      expect(conditionalDouble(5)).toBe(5);
    });
  });

  describe('unless', () => {
    it('should apply function when predicate is false', () => {
      const isEven = (x: number) => x % 2 === 0;
      const double = (x: number) => x * 2;
      const conditionalDouble = unless(isEven, double);
      
      expect(conditionalDouble(4)).toBe(4);
      expect(conditionalDouble(5)).toBe(10);
    });
  });

  describe('prop', () => {
    it('should extract property from object', () => {
      const obj = { name: 'John', age: 30 };
      const getName = prop('name');
      
      expect(getName(obj)).toBe('John');
    });
  });

  describe('path', () => {
    it('should extract nested property', () => {
      const obj = { user: { profile: { name: 'John' } } };
      const getName = path(['user', 'profile', 'name']);
      
      expect(getName(obj)).toBe('John');
    });

    it('should return undefined for missing path', () => {
      const obj = { user: {} };
      const getName = path(['user', 'profile', 'name']);
      
      expect(getName(obj)).toBeUndefined();
    });
  });

  describe('Array utilities', () => {
    const testArray = [1, 2, 3, 4, 5];

    describe('head', () => {
      it('should return first element', () => {
        expect(head(testArray)).toBe(1);
        expect(head([])).toBeUndefined();
      });
    });

    describe('tail', () => {
      it('should return all but first element', () => {
        expect(tail(testArray)).toEqual([2, 3, 4, 5]);
        expect(tail([1])).toEqual([]);
      });
    });

    describe('last', () => {
      it('should return last element', () => {
        expect(last(testArray)).toBe(5);
        expect(last([])).toBeUndefined();
      });
    });

    describe('init', () => {
      it('should return all but last element', () => {
        expect(init(testArray)).toEqual([1, 2, 3, 4]);
        expect(init([1])).toEqual([]);
      });
    });

    describe('take', () => {
      it('should take first n elements', () => {
        expect(take(3)(testArray)).toEqual([1, 2, 3]);
        expect(take(0)(testArray)).toEqual([]);
      });
    });

    describe('drop', () => {
      it('should drop first n elements', () => {
        expect(drop(2)(testArray)).toEqual([3, 4, 5]);
        expect(drop(0)(testArray)).toEqual(testArray);
      });
    });

    describe('reverse', () => {
      it('should reverse array', () => {
        expect(reverse(testArray)).toEqual([5, 4, 3, 2, 1]);
        expect(reverse([])).toEqual([]);
      });
    });
  });
});
