/**
 * @file Object Utilities - Immutable Object Operations
 * 
 * Comprehensive collection of pure functions for object manipulation
 * following functional programming principles. All functions are
 * immutable and return new objects without modifying the original.
 * 
 * Features:
 * - Immutable object operations
 * - Deep cloning and merging
 * - Type-safe property access
 * - Path-based operations
 * - Functional transformations
 * 
 * @author Luciano Júnior
 * @date June 2025
 */

import type { Result, Option } from '../types/result-types';
import { Ok, Err, Some, None } from '../types/result-types';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Deep readonly type for immutable objects
 */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

/**
 * Path type for nested property access
 */
export type Path = readonly (string | number)[];

/**
 * Get type of value at path
 */
export type PathValue<T, P extends Path> = P extends readonly [infer K, ...infer Rest]
  ? K extends keyof T
    ? Rest extends Path
      ? PathValue<T[K], Rest>
      : T[K]
    : never
  : T;

// ============================================================================
// Core Object Operations
// ============================================================================

/**
 * Get a property value safely
 */
export const get = <T, K extends keyof T>(
  obj: T,
  key: K
): Option<T[K]> => {
  if (obj != null && key in obj) {
    return Some(obj[key]);
  }
  return None;
};

/**
 * Get a nested property value using path
 */
export const getPath = <T>(
  obj: T,
  path: Path
): Option<unknown> => {
  let current: any = obj;
  
  for (const key of path) {
    if (current == null || typeof current !== 'object') {
      return None;
    }
    
    if (!(key in current)) {
      return None;
    }
    
    current = current[key];
  }
  
  return Some(current);
};

/**
 * Check if object has property
 */
export const has = <T>(obj: T, key: PropertyKey): boolean => {
  return obj != null && Object.prototype.hasOwnProperty.call(obj, key);
};

/**
 * Check if object has nested property using path
 */
export const hasPath = <T>(obj: T, path: Path): boolean => {
  let current: any = obj;
  
  for (const key of path) {
    if (current == null || typeof current !== 'object') {
      return false;
    }
    
    if (!(key in current)) {
      return false;
    }
    
    current = current[key];
  }
  
  return true;
};

// ============================================================================
// Object Transformation
// ============================================================================

/**
 * Set a property immutably
 */
export const set = <T, K extends keyof T>(
  obj: T,
  key: K,
  value: T[K]
): T => {
  return { ...obj, [key]: value };
};

/**
 * Set a nested property immutably using path
 */
export const setPath = <T>(
  obj: T,
  path: Path,
  value: unknown
): Result<T, string> => {
  if (path.length === 0) {
    return Err('Path cannot be empty');
  }
  
  if (path.length === 1) {
    const [key] = path;
    return Ok({ ...obj, [key]: value } as T);
  }
  
  const [head, ...tail] = path;
  const currentValue = (obj as any)?.[head];
  
  if (currentValue == null || typeof currentValue !== 'object') {
    return Err(`Cannot set path ${path.join('.')} - intermediate value is not an object`);
  }
  
  const nestedResult = setPath(currentValue, tail, value);
  if (!nestedResult.success) {
    return nestedResult;
  }
  
  return Ok({ ...obj, [head]: nestedResult.data } as T);
};

/**
 * Update a property using a function
 */
export const update = <T, K extends keyof T>(
  obj: T,
  key: K,
  updater: (value: T[K]) => T[K]
): T => {
  return { ...obj, [key]: updater(obj[key]) };
};

/**
 * Update a nested property using path and function
 */
export const updatePath = <T>(
  obj: T,
  path: Path,
  updater: (value: unknown) => unknown
): Result<T, string> => {
  const currentValue = getPath(obj, path);
  if (!currentValue.isSome) {
    return Err(`Path ${path.join('.')} does not exist`);
  }
  
  const newValue = updater(currentValue.value);
  return setPath(obj, path, newValue);
};

/**
 * Remove a property immutably
 */
export const omit = <T, K extends keyof T>(
  obj: T,
  ...keys: K[]
): Omit<T, K> => {
  const result = { ...obj };
  for (const key of keys) {
    delete result[key];
  }
  return result;
};

/**
 * Pick specific properties immutably
 */
export const pick = <T, K extends keyof T>(
  obj: T,
  ...keys: K[]
): Pick<T, K> => {
  const result = {} as Pick<T, K>;
  for (const key of keys) {
    if (key in obj) {
      result[key] = obj[key];
    }
  }
  return result;
};

/**
 * Remove a nested property using path
 */
export const removePath = <T>(
  obj: T,
  path: Path
): Result<T, string> => {
  if (path.length === 0) {
    return Err('Path cannot be empty');
  }
  
  if (path.length === 1) {
    const [key] = path;
    const result = { ...obj };
    delete (result as any)[key];
    return Ok(result);
  }
  
  const [head, ...tail] = path;
  const currentValue = (obj as any)?.[head];
  
  if (currentValue == null || typeof currentValue !== 'object') {
    return Err(`Cannot remove path ${path.join('.')} - intermediate value is not an object`);
  }
  
  const nestedResult = removePath(currentValue, tail);
  if (!nestedResult.success) {
    return nestedResult;
  }
  
  return Ok({ ...obj, [head]: nestedResult.data } as T);
};

// ============================================================================
// Object Merging and Cloning
// ============================================================================

/**
 * Shallow merge objects
 */
export const merge = <T extends object, U extends object>(
  obj1: T,
  obj2: U
): T & U => {
  return { ...obj1, ...obj2 };
};

/**
 * Deep merge objects recursively
 */
export const deepMerge = <T extends object, U extends object>(
  obj1: T,
  obj2: U
): T & U => {
  const result = { ...obj1 } as any;
  
  for (const key in obj2) {
    if (Object.prototype.hasOwnProperty.call(obj2, key)) {
      const value1 = result[key];
      const value2 = obj2[key];
      
      if (
        value1 != null &&
        value2 != null &&
        typeof value1 === 'object' &&
        typeof value2 === 'object' &&
        !Array.isArray(value1) &&
        !Array.isArray(value2)
      ) {
        result[key] = deepMerge(value1, value2);
      } else {
        result[key] = value2;
      }
    }
  }
  
  return result;
};

/**
 * Deep clone an object
 */
export const deepClone = <T>(obj: T): T => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as T;
  }
  
  if (obj instanceof Array) {
    return obj.map(item => deepClone(item)) as T;
  }
  
  if (typeof obj === 'object') {
    const cloned = {} as T;
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        cloned[key] = deepClone(obj[key]);
      }
    }
    return cloned;
  }
  
  return obj;
};

// ============================================================================
// Object Transformation and Mapping
// ============================================================================

/**
 * Map over object values
 */
export const mapValues = <T, U>(
  obj: Record<string, T>,
  mapper: (value: T, key: string) => U
): Record<string, U> => {
  const result: Record<string, U> = {};
  for (const [key, value] of Object.entries(obj)) {
    result[key] = mapper(value, key);
  }
  return result;
};

/**
 * Map over object keys
 */
export const mapKeys = <T>(
  obj: Record<string, T>,
  mapper: (key: string, value: T) => string
): Record<string, T> => {
  const result: Record<string, T> = {};
  for (const [key, value] of Object.entries(obj)) {
    const newKey = mapper(key, value);
    result[newKey] = value;
  }
  return result;
};

/**
 * Filter object by predicate
 */
export const filter = <T>(
  obj: Record<string, T>,
  predicate: (value: T, key: string) => boolean
): Record<string, T> => {
  const result: Record<string, T> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (predicate(value, key)) {
      result[key] = value;
    }
  }
  return result;
};

/**
 * Reduce object to a single value
 */
export const reduce = <T, U>(
  obj: Record<string, T>,
  reducer: (acc: U, value: T, key: string) => U,
  initialValue: U
): U => {
  let result = initialValue;
  for (const [key, value] of Object.entries(obj)) {
    result = reducer(result, value, key);
  }
  return result;
};

/**
 * Transform object to array of key-value pairs
 */
export const toPairs = <T>(obj: Record<string, T>): Array<[string, T]> => {
  return Object.entries(obj);
};

/**
 * Transform array of key-value pairs to object
 */
export const fromPairs = <T>(pairs: Array<[string, T]>): Record<string, T> => {
  const result: Record<string, T> = {};
  for (const [key, value] of pairs) {
    result[key] = value;
  }
  return result;
};

/**
 * Invert object (swap keys and values)
 */
export const invert = <T extends string | number>(
  obj: Record<string, T>
): Record<T, string> => {
  const result = {} as Record<T, string>;
  for (const [key, value] of Object.entries(obj)) {
    result[value] = key;
  }
  return result;
};

// ============================================================================
// Object Validation and Comparison
// ============================================================================

/**
 * Check if object is empty
 */
export const isEmpty = (obj: object): boolean => {
  return Object.keys(obj).length === 0;
};

/**
 * Check if object is not empty
 */
export const isNotEmpty = (obj: object): boolean => {
  return Object.keys(obj).length > 0;
};

/**
 * Get object keys as typed array
 */
export const keys = <T extends object>(obj: T): Array<keyof T> => {
  return Object.keys(obj) as Array<keyof T>;
};

/**
 * Get object values as typed array
 */
export const values = <T>(obj: Record<string, T>): T[] => {
  return Object.values(obj);
};

/**
 * Get object entries as typed array
 */
export const entries = <T>(obj: Record<string, T>): Array<[string, T]> => {
  return Object.entries(obj);
};

/**
 * Deep equality comparison
 */
export const deepEquals = <T>(obj1: T, obj2: T): boolean => {
  if (obj1 === obj2) {
    return true;
  }
  
  if (obj1 == null || obj2 == null) {
    return obj1 === obj2;
  }
  
  if (typeof obj1 !== typeof obj2) {
    return false;
  }
  
  if (typeof obj1 !== 'object') {
    return obj1 === obj2;
  }
  
  if (Array.isArray(obj1) !== Array.isArray(obj2)) {
    return false;
  }
  
  if (Array.isArray(obj1) && Array.isArray(obj2)) {
    if (obj1.length !== obj2.length) {
      return false;
    }
    for (let i = 0; i < obj1.length; i++) {
      if (!deepEquals(obj1[i], obj2[i])) {
        return false;
      }
    }
    return true;
  }
  
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  
  if (keys1.length !== keys2.length) {
    return false;
  }
  
  for (const key of keys1) {
    if (!keys2.includes(key)) {
      return false;
    }
    if (!deepEquals((obj1 as any)[key], (obj2 as any)[key])) {
      return false;
    }
  }
  
  return true;
};

/**
 * Check if object matches a pattern
 */
export const matches = <T>(
  obj: T,
  pattern: Partial<T>
): boolean => {
  for (const key in pattern) {
    if (Object.prototype.hasOwnProperty.call(pattern, key)) {
      if ((obj as any)[key] !== pattern[key]) {
        return false;
      }
    }
  }
  return true;
};

// ============================================================================
// Export All Functions
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
  filter,
  reduce,
  toPairs,
  fromPairs,
  invert,
  
  // Validation and comparison
  isEmpty,
  isNotEmpty,
  keys,
  values,
  entries,
  deepEquals,
  matches,
};

export type { DeepReadonly, Path, PathValue };
