/**
 * Function Composition Utilities
 *
 * Pure functional utilities for composing functions using pipe and compose
 * patterns following functional programming principles.
 */

import type { Pipe } from '../../types/functional.types';

/**
 * Pipe function for left-to-right function composition
 * Allows chaining functions in a readable, sequential manner
 */
export const pipe: Pipe =
  (...fns: Array<(value: unknown) => unknown>) =>
  (value: unknown) =>
    fns.reduce((acc, fn) => fn(acc), value);

export const compose: Pipe =
  (...fns: Array<(value: unknown) => unknown>) =>
  (value: unknown) =>
    fns.reduceRight((acc, fn) => fn(acc), value);

/**
 * Curry function to convert multi-argument functions to curried form
 */
type Curried<A extends readonly unknown[], R> = A extends readonly [infer Arg, ...infer Rest]
  ? (arg: Arg) => Curried<Rest, R>
  : R;

export const curry = <A extends readonly unknown[], R>(fn: (...args: A) => R): Curried<A, R> => {
  const curried = (...args: readonly unknown[]): unknown => {
    if (args.length >= fn.length) {
      return fn(...(args as A));
    }
    return (...nextArgs: readonly unknown[]) => curried(...args, ...nextArgs);
  };
  return curried as Curried<A, R>;
};

/**
 * Partial application utility
 */
export const partial = <T extends readonly unknown[], U extends readonly unknown[], R>(
  fn: (...args: [...T, ...U]) => R,
  ...partialArgs: T
) => {
  return (...remainingArgs: U): R => {
    return fn(...partialArgs, ...remainingArgs);
  };
};

/**
 * Identity function - returns its argument unchanged
 */
export const identity = <T>(value: T): T => value;

/**
 * Constant function - returns a function that always returns the same value
 */
export const constant =
  <T>(value: T) =>
  (): T =>
    value;

/**
 * Flip function - reverses the order of arguments for a binary function
 */
export const flip = <T, U, V>(fn: (a: T, b: U) => V) => {
  return (b: U, a: T): V => fn(a, b);
};

/**
 * Memoization utility for pure functions
 */
export const memoize = <T extends readonly unknown[], R>(
  fn: (...args: T) => R,
  keyFn?: (...args: T) => string
): ((...args: T) => R) => {
  const cache = new Map<string, R>();

  return (...args: T): R => {
    const key = keyFn ? keyFn(...args) : JSON.stringify(args);

    if (cache.has(key)) {
      const cachedValue = cache.get(key);
      if (cachedValue !== undefined) {
        return cachedValue;
      }
    }

    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
};

/**
 * Debounce utility for function calls
 */
export const debounce = <T extends readonly unknown[]>(
  fn: (...args: T) => void,
  delayMs: number
): ((...args: T) => void) => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: T): void => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = null;
    }, delayMs);
  };
};

/**
 * Throttle utility for function calls
 */
export const throttle = <T extends readonly unknown[]>(
  fn: (...args: T) => void,
  delayMs: number
): ((...args: T) => void) => {
  let lastCallTime = 0;
  let _timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: T): void => {
    const now = Date.now();

    if (now - lastCallTime >= delayMs) {
      lastCallTime = now;
      fn(...args);
    } else {
      _timeoutId ??= setTimeout(
        () => {
          lastCallTime = Date.now();
          fn(...args);
          _timeoutId = null;
        },
        delayMs - (now - lastCallTime)
      );
    }
  };
};

/**
 * Once utility - ensures a function is called only once
 */
export const once = <T extends readonly unknown[], R>(
  fn: (...args: T) => R
): ((...args: T) => R | undefined) => {
  let called = false;
  let result: R;

  return (...args: T): R | undefined => {
    if (!called) {
      called = true;
      result = fn(...args);
      return result;
    }
    return result;
  };
};

/**
 * Tap utility - executes a side effect and returns the original value
 */
export const tap = <T>(sideEffect: (value: T) => void) => {
  return (value: T): T => {
    sideEffect(value);
    return value;
  };
};

/**
 * Trace utility - logs a value and returns it (useful for debugging pipes)
 */
export const trace = <T>(label?: string) => {
  return (value: T): T => {
    console.log(label ? `${label}:` : 'Trace:', value);
    return value;
  };
};

/**
 * Conditional execution utility
 */
export const when = <T>(predicate: (value: T) => boolean, fn: (value: T) => T) => {
  return (value: T): T => {
    return predicate(value) ? fn(value) : value;
  };
};

/**
 * Unless utility - opposite of when
 */
export const unless = <T>(predicate: (value: T) => boolean, fn: (value: T) => T) => {
  return (value: T): T => {
    return predicate(value) ? value : fn(value);
  };
};

/**
 * Safe property access utility
 */
export const prop = <T, K extends keyof T>(key: K) => {
  return (obj: T): T[K] => obj[key];
};

/**
 * Safe nested property access utility
 */
export const path = <T>(keys: ReadonlyArray<string | number>) => {
  return (obj: T): unknown => {
    return keys.reduce((current: unknown, key) => {
      if (typeof current === 'object' && current !== null && key in current) {
        return (current as Record<string | number, unknown>)[key];
      }
      return undefined;
    }, obj);
  };
};

/**
 * Array utilities for functional programming
 */
export const head = <T>(array: ReadonlyArray<T>): T | undefined => array[0];
export const tail = <T>(array: ReadonlyArray<T>): ReadonlyArray<T> => array.slice(1);
export const last = <T>(array: ReadonlyArray<T>): T | undefined => array[array.length - 1];
export const init = <T>(array: ReadonlyArray<T>): ReadonlyArray<T> => array.slice(0, -1);

/**
 * Functional array operations
 */
export const take = <T>(count: number) => {
  return (array: ReadonlyArray<T>): ReadonlyArray<T> => array.slice(0, count);
};

export const drop = <T>(count: number) => {
  return (array: ReadonlyArray<T>): ReadonlyArray<T> => array.slice(count);
};

export const reverse = <T>(array: ReadonlyArray<T>): ReadonlyArray<T> => {
  return [...array].reverse();
};
