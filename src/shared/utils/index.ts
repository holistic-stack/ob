/**
 * @file Shared Utils Index
 * 
 * Central export point for all shared utility functions.
 * Provides a clean API for importing utilities throughout the codebase.
 * 
 * @author Luciano Júnior
 * @date June 2025
 */

// ============================================================================
// Array Utilities
// ============================================================================

export {
  // Core operations
  at,
  head,
  last,
  tail,
  init,
  take,
  drop,
  takeWhile,
  dropWhile,
  
  // Transformation
  append,
  prepend,
  insertAt,
  removeAt,
  updateAt,
  replace,
  
  // Filtering and searching
  find,
  findIndex,
  findLast,
  some,
  every,
  count,
  
  // Grouping and partitioning
  groupBy,
  partition,
  chunk,
  splitAt,
  
  // Combination
  concat,
  zip,
  zipWith,
  interleave,
  
  // Deduplication
  unique,
  uniqueBy,
  intersection,
  difference,
  union,
  
  // Validation
  isEmpty as arrayIsEmpty,
  isNotEmpty as arrayIsNotEmpty,
  equals as arrayEquals,
  contains,
} from './array-utils';

// ============================================================================
// Object Utilities
// ============================================================================

export {
  // Core operations
  get,
  getPath,
  has,
  hasPath,
  
  // Transformation
  set,
  setPath,
  update,
  updatePath,
  omit,
  pick,
  removePath,
  
  // Merging and cloning
  merge,
  deepMerge,
  deepClone,
  
  // Mapping and transformation
  mapValues,
  mapKeys,
  filter as filterObject,
  reduce as reduceObject,
  toPairs,
  fromPairs,
  invert,
  
  // Validation and comparison
  isEmpty as objectIsEmpty,
  isNotEmpty as objectIsNotEmpty,
  keys,
  values,
  entries,
  deepEquals,
  matches,
} from './object-utils';

export type { DeepReadonly, Path, PathValue } from './object-utils';

// ============================================================================
// Async Utilities
// ============================================================================

export {
  // Basic utilities
  delay,
  timeout,
  withTimeout,
  promisify,
  
  // Retry logic
  retry,
  retryWithResult,
  
  // Parallel execution
  parallelLimit,
  parallelWithResults,
  parallelFailFast,
  parallelSettled,
  
  // Sequential execution
  sequential,
  sequentialFailFast,
  sequentialSettled,
  
  // Rate limiting and throttling
  rateLimit,
  debounce,
  throttle,
  
  // Utility functions
  toAsync,
  memoizeAsync,
  circuitBreaker,
} from './async-utils';

export type {
  DelayFn,
  RetryOptions,
  TimeoutOptions,
  RateLimitOptions,
} from './async-utils';

// ============================================================================
// Common Utility Patterns
// ============================================================================

/**
 * Identity function - returns the input unchanged
 */
export const identity = <T>(value: T): T => value;

/**
 * Constant function - returns a function that always returns the same value
 */
export const constant = <T>(value: T) => (): T => value;

/**
 * Noop function - does nothing
 */
export const noop = (): void => {};

/**
 * Compose functions from right to left
 */
export const compose = <T>(...fns: Array<(arg: T) => T>) => (value: T): T =>
  fns.reduceRight((acc, fn) => fn(acc), value);

/**
 * Pipe functions from left to right
 */
export const pipe = <T>(value: T, ...fns: Array<(arg: T) => T>): T =>
  fns.reduce((acc, fn) => fn(acc), value);

/**
 * Curry a binary function
 */
export const curry2 = <T, U, R>(fn: (a: T, b: U) => R) =>
  (a: T) => (b: U): R => fn(a, b);

/**
 * Curry a ternary function
 */
export const curry3 = <T, U, V, R>(fn: (a: T, b: U, c: V) => R) =>
  (a: T) => (b: U) => (c: V): R => fn(a, b, c);

/**
 * Flip the arguments of a binary function
 */
export const flip = <T, U, R>(fn: (a: T, b: U) => R) =>
  (b: U, a: T): R => fn(a, b);

/**
 * Partial application
 */
export const partial = <TArgs extends any[], TResult>(
  fn: (...args: TArgs) => TResult,
  ...partialArgs: Partial<TArgs>
) => (...remainingArgs: any[]): TResult =>
  fn(...([...partialArgs, ...remainingArgs] as TArgs));

// ============================================================================
// Type Guards and Validation
// ============================================================================

/**
 * Check if value is null or undefined
 */
export const isNil = (value: unknown): value is null | undefined =>
  value === null || value === undefined;

/**
 * Check if value is not null or undefined
 */
export const isNotNil = <T>(value: T | null | undefined): value is T =>
  value !== null && value !== undefined;

/**
 * Check if value is a string
 */
export const isString = (value: unknown): value is string =>
  typeof value === 'string';

/**
 * Check if value is a number
 */
export const isNumber = (value: unknown): value is number =>
  typeof value === 'number' && !isNaN(value);

/**
 * Check if value is a boolean
 */
export const isBoolean = (value: unknown): value is boolean =>
  typeof value === 'boolean';

/**
 * Check if value is an object (not null, not array)
 */
export const isObject = (value: unknown): value is object =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * Check if value is an array
 */
export const isArray = (value: unknown): value is unknown[] =>
  Array.isArray(value);

/**
 * Check if value is a function
 */
export const isFunction = (value: unknown): value is Function =>
  typeof value === 'function';

/**
 * Check if value is a promise
 */
export const isPromise = (value: unknown): value is Promise<unknown> =>
  value instanceof Promise || (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as any).then === 'function'
  );

/**
 * Check if value is a date
 */
export const isDate = (value: unknown): value is Date =>
  value instanceof Date;

/**
 * Check if value is a valid date
 */
export const isValidDate = (value: unknown): value is Date =>
  isDate(value) && !isNaN(value.getTime());

// ============================================================================
// String Utilities
// ============================================================================

/**
 * Capitalize first letter of string
 */
export const capitalize = (str: string): string =>
  str.charAt(0).toUpperCase() + str.slice(1);

/**
 * Convert string to camelCase
 */
export const camelCase = (str: string): string =>
  str.replace(/[-_\s]+(.)?/g, (_, char) => char ? char.toUpperCase() : '');

/**
 * Convert string to kebab-case
 */
export const kebabCase = (str: string): string =>
  str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();

/**
 * Convert string to snake_case
 */
export const snakeCase = (str: string): string =>
  str.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();

/**
 * Truncate string with ellipsis
 */
export const truncate = (str: string, length: number, suffix = '...'): string =>
  str.length <= length ? str : str.slice(0, length - suffix.length) + suffix;

/**
 * Remove leading and trailing whitespace
 */
export const trim = (str: string): string => str.trim();

/**
 * Check if string is empty or only whitespace
 */
export const isBlank = (str: string): boolean => str.trim().length === 0;

/**
 * Check if string is not empty and not only whitespace
 */
export const isNotBlank = (str: string): boolean => str.trim().length > 0;

// ============================================================================
// Number Utilities
// ============================================================================

/**
 * Clamp number between min and max
 */
export const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

/**
 * Round number to specified decimal places
 */
export const round = (value: number, decimals = 0): number => {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
};

/**
 * Check if number is in range (inclusive)
 */
export const inRange = (value: number, min: number, max: number): boolean =>
  value >= min && value <= max;

/**
 * Generate random number between min and max
 */
export const randomBetween = (min: number, max: number): number =>
  Math.random() * (max - min) + min;

/**
 * Generate random integer between min and max (inclusive)
 */
export const randomInt = (min: number, max: number): number =>
  Math.floor(randomBetween(min, max + 1));

// ============================================================================
// Performance Utilities
// ============================================================================

/**
 * Measure execution time of a function
 */
export const measureTime = <T>(fn: () => T): { result: T; duration: number } => {
  const start = performance.now();
  const result = fn();
  const duration = performance.now() - start;
  return { result, duration };
};

/**
 * Measure execution time of an async function
 */
export const measureTimeAsync = async <T>(
  fn: () => Promise<T>
): Promise<{ result: T; duration: number }> => {
  const start = performance.now();
  const result = await fn();
  const duration = performance.now() - start;
  return { result, duration };
};

/**
 * Create a simple cache with LRU eviction
 */
export const createLRUCache = <K, V>(maxSize: number) => {
  const cache = new Map<K, V>();
  
  return {
    get: (key: K): V | undefined => {
      if (cache.has(key)) {
        const value = cache.get(key)!;
        cache.delete(key);
        cache.set(key, value);
        return value;
      }
      return undefined;
    },
    
    set: (key: K, value: V): void => {
      if (cache.has(key)) {
        cache.delete(key);
      } else if (cache.size >= maxSize) {
        const firstKey = cache.keys().next().value;
        cache.delete(firstKey);
      }
      cache.set(key, value);
    },
    
    has: (key: K): boolean => cache.has(key),
    delete: (key: K): boolean => cache.delete(key),
    clear: (): void => cache.clear(),
    size: (): number => cache.size,
  };
};

// ============================================================================
// Export All Utility Functions
// ============================================================================

export {
  // Functional programming
  identity,
  constant,
  noop,
  compose,
  pipe,
  curry2,
  curry3,
  flip,
  partial,
  
  // Type guards
  isNil,
  isNotNil,
  isString,
  isNumber,
  isBoolean,
  isObject,
  isArray,
  isFunction,
  isPromise,
  isDate,
  isValidDate,
  
  // String utilities
  capitalize,
  camelCase,
  kebabCase,
  snakeCase,
  truncate,
  trim,
  isBlank,
  isNotBlank,
  
  // Number utilities
  clamp,
  round,
  inRange,
  randomBetween,
  randomInt,
  
  // Performance utilities
  measureTime,
  measureTimeAsync,
  createLRUCache,
};
