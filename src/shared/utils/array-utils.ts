/**
 * @file Array Utilities - Immutable Array Operations
 * 
 * Comprehensive collection of pure functions for array manipulation
 * following functional programming principles. All functions are
 * immutable and return new arrays without modifying the original.
 * 
 * Features:
 * - Immutable array operations
 * - Type-safe transformations
 * - Performance-optimized implementations
 * - Functional programming patterns
 * - Comprehensive error handling
 * 
 * @author Luciano Júnior
 * @date June 2025
 */

import type { Result, Option } from '../types/result-types';
import { Ok, Err, Some, None } from '../types/result-types';

// ============================================================================
// Core Array Operations
// ============================================================================

/**
 * Safely get an element at a specific index
 */
export const at = <T>(array: readonly T[], index: number): Option<T> => {
  if (index >= 0 && index < array.length) {
    return Some(array[index]);
  }
  return None;
};

/**
 * Get the first element of an array
 */
export const head = <T>(array: readonly T[]): Option<T> => {
  return array.length > 0 ? Some(array[0]) : None;
};

/**
 * Get the last element of an array
 */
export const last = <T>(array: readonly T[]): Option<T> => {
  return array.length > 0 ? Some(array[array.length - 1]) : None;
};

/**
 * Get all elements except the first
 */
export const tail = <T>(array: readonly T[]): readonly T[] => {
  return array.slice(1);
};

/**
 * Get all elements except the last
 */
export const init = <T>(array: readonly T[]): readonly T[] => {
  return array.slice(0, -1);
};

/**
 * Take the first n elements
 */
export const take = <T>(array: readonly T[], n: number): readonly T[] => {
  return array.slice(0, Math.max(0, n));
};

/**
 * Drop the first n elements
 */
export const drop = <T>(array: readonly T[], n: number): readonly T[] => {
  return array.slice(Math.max(0, n));
};

/**
 * Take elements while predicate is true
 */
export const takeWhile = <T>(
  array: readonly T[],
  predicate: (item: T, index: number) => boolean
): readonly T[] => {
  const result: T[] = [];
  for (let i = 0; i < array.length; i++) {
    if (predicate(array[i], i)) {
      result.push(array[i]);
    } else {
      break;
    }
  }
  return result;
};

/**
 * Drop elements while predicate is true
 */
export const dropWhile = <T>(
  array: readonly T[],
  predicate: (item: T, index: number) => boolean
): readonly T[] => {
  let dropCount = 0;
  for (let i = 0; i < array.length; i++) {
    if (predicate(array[i], i)) {
      dropCount++;
    } else {
      break;
    }
  }
  return array.slice(dropCount);
};

// ============================================================================
// Array Transformation
// ============================================================================

/**
 * Immutable append to array
 */
export const append = <T>(array: readonly T[], item: T): readonly T[] => {
  return [...array, item];
};

/**
 * Immutable prepend to array
 */
export const prepend = <T>(array: readonly T[], item: T): readonly T[] => {
  return [item, ...array];
};

/**
 * Immutable insert at index
 */
export const insertAt = <T>(
  array: readonly T[],
  index: number,
  item: T
): Result<readonly T[], string> => {
  if (index < 0 || index > array.length) {
    return Err(`Index ${index} out of bounds for array of length ${array.length}`);
  }
  
  const result = [...array];
  result.splice(index, 0, item);
  return Ok(result);
};

/**
 * Immutable remove at index
 */
export const removeAt = <T>(
  array: readonly T[],
  index: number
): Result<readonly T[], string> => {
  if (index < 0 || index >= array.length) {
    return Err(`Index ${index} out of bounds for array of length ${array.length}`);
  }
  
  return Ok([...array.slice(0, index), ...array.slice(index + 1)]);
};

/**
 * Immutable update at index
 */
export const updateAt = <T>(
  array: readonly T[],
  index: number,
  item: T
): Result<readonly T[], string> => {
  if (index < 0 || index >= array.length) {
    return Err(`Index ${index} out of bounds for array of length ${array.length}`);
  }
  
  const result = [...array];
  result[index] = item;
  return Ok(result);
};

/**
 * Immutable replace all occurrences
 */
export const replace = <T>(
  array: readonly T[],
  oldItem: T,
  newItem: T,
  compareFn?: (a: T, b: T) => boolean
): readonly T[] => {
  const compare = compareFn || ((a, b) => a === b);
  return array.map(item => compare(item, oldItem) ? newItem : item);
};

// ============================================================================
// Array Filtering and Searching
// ============================================================================

/**
 * Find first element matching predicate
 */
export const find = <T>(
  array: readonly T[],
  predicate: (item: T, index: number) => boolean
): Option<T> => {
  for (let i = 0; i < array.length; i++) {
    if (predicate(array[i], i)) {
      return Some(array[i]);
    }
  }
  return None;
};

/**
 * Find index of first element matching predicate
 */
export const findIndex = <T>(
  array: readonly T[],
  predicate: (item: T, index: number) => boolean
): Option<number> => {
  for (let i = 0; i < array.length; i++) {
    if (predicate(array[i], i)) {
      return Some(i);
    }
  }
  return None;
};

/**
 * Find last element matching predicate
 */
export const findLast = <T>(
  array: readonly T[],
  predicate: (item: T, index: number) => boolean
): Option<T> => {
  for (let i = array.length - 1; i >= 0; i--) {
    if (predicate(array[i], i)) {
      return Some(array[i]);
    }
  }
  return None;
};

/**
 * Check if any element matches predicate
 */
export const some = <T>(
  array: readonly T[],
  predicate: (item: T, index: number) => boolean
): boolean => {
  return array.some(predicate);
};

/**
 * Check if all elements match predicate
 */
export const every = <T>(
  array: readonly T[],
  predicate: (item: T, index: number) => boolean
): boolean => {
  return array.every(predicate);
};

/**
 * Count elements matching predicate
 */
export const count = <T>(
  array: readonly T[],
  predicate: (item: T, index: number) => boolean
): number => {
  return array.filter(predicate).length;
};

// ============================================================================
// Array Grouping and Partitioning
// ============================================================================

/**
 * Group array elements by key function
 */
export const groupBy = <T, K extends string | number | symbol>(
  array: readonly T[],
  keyFn: (item: T) => K
): Record<K, T[]> => {
  const groups = {} as Record<K, T[]>;
  
  for (const item of array) {
    const key = keyFn(item);
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(item);
  }
  
  return groups;
};

/**
 * Partition array into two arrays based on predicate
 */
export const partition = <T>(
  array: readonly T[],
  predicate: (item: T, index: number) => boolean
): readonly [readonly T[], readonly T[]] => {
  const truthy: T[] = [];
  const falsy: T[] = [];
  
  for (let i = 0; i < array.length; i++) {
    if (predicate(array[i], i)) {
      truthy.push(array[i]);
    } else {
      falsy.push(array[i]);
    }
  }
  
  return [truthy, falsy];
};

/**
 * Split array into chunks of specified size
 */
export const chunk = <T>(array: readonly T[], size: number): readonly (readonly T[])[] => {
  if (size <= 0) {
    return [];
  }
  
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  
  return chunks;
};

/**
 * Split array at first element matching predicate
 */
export const splitAt = <T>(
  array: readonly T[],
  predicate: (item: T, index: number) => boolean
): readonly [readonly T[], readonly T[]] => {
  const index = findIndex(array, predicate);
  if (index.isSome) {
    return [array.slice(0, index.value), array.slice(index.value)];
  }
  return [array, []];
};

// ============================================================================
// Array Combination
// ============================================================================

/**
 * Concatenate multiple arrays
 */
export const concat = <T>(...arrays: readonly (readonly T[])[]): readonly T[] => {
  return arrays.flat();
};

/**
 * Zip two arrays together
 */
export const zip = <T, U>(
  array1: readonly T[],
  array2: readonly U[]
): readonly (readonly [T, U])[] => {
  const length = Math.min(array1.length, array2.length);
  const result: [T, U][] = [];
  
  for (let i = 0; i < length; i++) {
    result.push([array1[i], array2[i]]);
  }
  
  return result;
};

/**
 * Zip arrays with a combining function
 */
export const zipWith = <T, U, R>(
  array1: readonly T[],
  array2: readonly U[],
  fn: (a: T, b: U, index: number) => R
): readonly R[] => {
  const length = Math.min(array1.length, array2.length);
  const result: R[] = [];
  
  for (let i = 0; i < length; i++) {
    result.push(fn(array1[i], array2[i], i));
  }
  
  return result;
};

/**
 * Interleave elements from two arrays
 */
export const interleave = <T>(
  array1: readonly T[],
  array2: readonly T[]
): readonly T[] => {
  const result: T[] = [];
  const maxLength = Math.max(array1.length, array2.length);
  
  for (let i = 0; i < maxLength; i++) {
    if (i < array1.length) {
      result.push(array1[i]);
    }
    if (i < array2.length) {
      result.push(array2[i]);
    }
  }
  
  return result;
};

// ============================================================================
// Array Deduplication
// ============================================================================

/**
 * Remove duplicate elements (using === comparison)
 */
export const unique = <T>(array: readonly T[]): readonly T[] => {
  return [...new Set(array)];
};

/**
 * Remove duplicate elements using custom comparison
 */
export const uniqueBy = <T, K>(
  array: readonly T[],
  keyFn: (item: T) => K
): readonly T[] => {
  const seen = new Set<K>();
  const result: T[] = [];
  
  for (const item of array) {
    const key = keyFn(item);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(item);
    }
  }
  
  return result;
};

/**
 * Get intersection of two arrays
 */
export const intersection = <T>(
  array1: readonly T[],
  array2: readonly T[]
): readonly T[] => {
  const set2 = new Set(array2);
  return unique(array1.filter(item => set2.has(item)));
};

/**
 * Get difference between two arrays (elements in first but not second)
 */
export const difference = <T>(
  array1: readonly T[],
  array2: readonly T[]
): readonly T[] => {
  const set2 = new Set(array2);
  return array1.filter(item => !set2.has(item));
};

/**
 * Get union of two arrays
 */
export const union = <T>(
  array1: readonly T[],
  array2: readonly T[]
): readonly T[] => {
  return unique([...array1, ...array2]);
};

// ============================================================================
// Array Validation
// ============================================================================

/**
 * Check if array is empty
 */
export const isEmpty = <T>(array: readonly T[]): boolean => {
  return array.length === 0;
};

/**
 * Check if array is not empty
 */
export const isNotEmpty = <T>(array: readonly T[]): boolean => {
  return array.length > 0;
};

/**
 * Check if arrays are equal (shallow comparison)
 */
export const equals = <T>(
  array1: readonly T[],
  array2: readonly T[],
  compareFn?: (a: T, b: T) => boolean
): boolean => {
  if (array1.length !== array2.length) {
    return false;
  }
  
  const compare = compareFn || ((a, b) => a === b);
  
  for (let i = 0; i < array1.length; i++) {
    if (!compare(array1[i], array2[i])) {
      return false;
    }
  }
  
  return true;
};

/**
 * Check if array contains element
 */
export const contains = <T>(
  array: readonly T[],
  item: T,
  compareFn?: (a: T, b: T) => boolean
): boolean => {
  const compare = compareFn || ((a, b) => a === b);
  return array.some(arrayItem => compare(arrayItem, item));
};

// ============================================================================
// Export All Functions
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
  isEmpty,
  isNotEmpty,
  equals,
  contains,
};
