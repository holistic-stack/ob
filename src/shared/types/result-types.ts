/**
 * @file Result Types - Functional Error Handling
 * 
 * Comprehensive Result/Either types for functional error handling
 * without exceptions. Provides type-safe error propagation and
 * composable error handling patterns.
 * 
 * Features:
 * - Result<T, E> type for success/error handling
 * - Option<T> type for nullable values
 * - Composable error handling functions
 * - Type-safe error propagation
 * - Functional programming patterns
 * 
 * @author Luciano Júnior
 * @date June 2025
 */

// ============================================================================
// Core Result Type
// ============================================================================

/**
 * Result type for operations that can succeed or fail
 * Replaces throwing exceptions with explicit error handling
 */
export type Result<T, E = Error> =
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly error: E };

/**
 * Success result constructor
 */
export const Ok = <T>(data: T): Result<T, never> => ({
  success: true,
  data,
});

/**
 * Error result constructor
 */
export const Err = <E>(error: E): Result<never, E> => ({
  success: false,
  error,
});

// ============================================================================
// Option Type for Nullable Values
// ============================================================================

/**
 * Option type for values that may or may not exist
 * Replaces null/undefined with explicit optional handling
 */
export type Option<T> =
  | { readonly isSome: true; readonly value: T }
  | { readonly isSome: false };

/**
 * Some value constructor
 */
export const Some = <T>(value: T): Option<T> => ({
  isSome: true,
  value,
});

/**
 * None value constructor
 */
export const None: Option<never> = {
  isSome: false,
};

// ============================================================================
// Result Utility Functions
// ============================================================================

/**
 * Check if result is successful
 */
export const isOk = <T, E>(result: Result<T, E>): result is { success: true; data: T } => {
  return result.success;
};

/**
 * Check if result is an error
 */
export const isErr = <T, E>(result: Result<T, E>): result is { success: false; error: E } => {
  return !result.success;
};

/**
 * Extract data from successful result or throw
 */
export const unwrap = <T, E>(result: Result<T, E>): T => {
  if (result.success) {
    return result.data;
  }
  throw new Error(`Called unwrap on error result: ${result.error}`);
};

/**
 * Extract data from successful result or return default
 */
export const unwrapOr = <T, E>(result: Result<T, E>, defaultValue: T): T => {
  return result.success ? result.data : defaultValue;
};

/**
 * Extract data from successful result or compute default
 */
export const unwrapOrElse = <T, E>(
  result: Result<T, E>,
  fn: (error: E) => T
): T => {
  return result.success ? result.data : fn(result.error);
};

/**
 * Extract error from failed result or throw
 */
export const unwrapErr = <T, E>(result: Result<T, E>): E => {
  if (!result.success) {
    return result.error;
  }
  throw new Error(`Called unwrapErr on success result: ${result.data}`);
};

// ============================================================================
// Result Transformation Functions
// ============================================================================

/**
 * Transform successful result data
 */
export const map = <T, U, E>(
  result: Result<T, E>,
  fn: (data: T) => U
): Result<U, E> => {
  return result.success ? Ok(fn(result.data)) : result;
};

/**
 * Transform error result
 */
export const mapErr = <T, E, F>(
  result: Result<T, E>,
  fn: (error: E) => F
): Result<T, F> => {
  return result.success ? result : Err(fn(result.error));
};

/**
 * Chain result operations (flatMap)
 */
export const flatMap = <T, U, E>(
  result: Result<T, E>,
  fn: (data: T) => Result<U, E>
): Result<U, E> => {
  return result.success ? fn(result.data) : result;
};

/**
 * Chain result operations with different error types
 */
export const flatMapErr = <T, E, F>(
  result: Result<T, E>,
  fn: (error: E) => Result<T, F>
): Result<T, F> => {
  return result.success ? result : fn(result.error);
};

/**
 * Apply function in Result context
 */
export const apply = <T, U, E>(
  resultFn: Result<(data: T) => U, E>,
  resultData: Result<T, E>
): Result<U, E> => {
  if (resultFn.success && resultData.success) {
    return Ok(resultFn.data(resultData.data));
  }
  if (!resultFn.success) {
    return resultFn;
  }
  return resultData;
};

// ============================================================================
// Option Utility Functions
// ============================================================================

/**
 * Check if option has a value
 */
export const isSome = <T>(option: Option<T>): option is { isSome: true; value: T } => {
  return option.isSome;
};

/**
 * Check if option is empty
 */
export const isNone = <T>(option: Option<T>): option is { isSome: false } => {
  return !option.isSome;
};

/**
 * Extract value from option or throw
 */
export const unwrapOption = <T>(option: Option<T>): T => {
  if (option.isSome) {
    return option.value;
  }
  throw new Error('Called unwrap on None option');
};

/**
 * Extract value from option or return default
 */
export const unwrapOptionOr = <T>(option: Option<T>, defaultValue: T): T => {
  return option.isSome ? option.value : defaultValue;
};

/**
 * Extract value from option or compute default
 */
export const unwrapOptionOrElse = <T>(
  option: Option<T>,
  fn: () => T
): T => {
  return option.isSome ? option.value : fn();
};

// ============================================================================
// Option Transformation Functions
// ============================================================================

/**
 * Transform option value
 */
export const mapOption = <T, U>(
  option: Option<T>,
  fn: (value: T) => U
): Option<U> => {
  return option.isSome ? Some(fn(option.value)) : None;
};

/**
 * Chain option operations
 */
export const flatMapOption = <T, U>(
  option: Option<T>,
  fn: (value: T) => Option<U>
): Option<U> => {
  return option.isSome ? fn(option.value) : None;
};

/**
 * Filter option value
 */
export const filterOption = <T>(
  option: Option<T>,
  predicate: (value: T) => boolean
): Option<T> => {
  return option.isSome && predicate(option.value) ? option : None;
};

// ============================================================================
// Conversion Functions
// ============================================================================

/**
 * Convert nullable value to Option
 */
export const fromNullable = <T>(value: T | null | undefined): Option<T> => {
  return value != null ? Some(value) : None;
};

/**
 * Convert Option to nullable value
 */
export const toNullable = <T>(option: Option<T>): T | null => {
  return option.isSome ? option.value : null;
};

/**
 * Convert Result to Option (discards error)
 */
export const resultToOption = <T, E>(result: Result<T, E>): Option<T> => {
  return result.success ? Some(result.data) : None;
};

/**
 * Convert Option to Result
 */
export const optionToResult = <T, E>(
  option: Option<T>,
  error: E
): Result<T, E> => {
  return option.isSome ? Ok(option.value) : Err(error);
};

// ============================================================================
// Async Result Functions
// ============================================================================

/**
 * Async Result type
 */
export type AsyncResult<T, E = Error> = Promise<Result<T, E>>;

/**
 * Create successful async result
 */
export const AsyncOk = <T>(data: T): AsyncResult<T, never> => {
  return Promise.resolve(Ok(data));
};

/**
 * Create error async result
 */
export const AsyncErr = <E>(error: E): AsyncResult<never, E> => {
  return Promise.resolve(Err(error));
};

/**
 * Transform async result data
 */
export const mapAsync = async <T, U, E>(
  asyncResult: AsyncResult<T, E>,
  fn: (data: T) => U | Promise<U>
): AsyncResult<U, E> => {
  const result = await asyncResult;
  if (result.success) {
    const transformed = await fn(result.data);
    return Ok(transformed);
  }
  return result;
};

/**
 * Chain async result operations
 */
export const flatMapAsync = async <T, U, E>(
  asyncResult: AsyncResult<T, E>,
  fn: (data: T) => AsyncResult<U, E>
): AsyncResult<U, E> => {
  const result = await asyncResult;
  return result.success ? fn(result.data) : result;
};

/**
 * Catch promise errors and convert to Result
 */
export const tryCatch = async <T>(
  fn: () => Promise<T>
): AsyncResult<T, Error> => {
  try {
    const data = await fn();
    return Ok(data);
  } catch (error) {
    return Err(error instanceof Error ? error : new Error(String(error)));
  }
};

/**
 * Catch synchronous errors and convert to Result
 */
export const tryCatchSync = <T>(fn: () => T): Result<T, Error> => {
  try {
    const data = fn();
    return Ok(data);
  } catch (error) {
    return Err(error instanceof Error ? error : new Error(String(error)));
  }
};

// ============================================================================
// Combinators
// ============================================================================

/**
 * Combine multiple Results into one (all must succeed)
 */
export const all = <T extends readonly unknown[], E>(
  results: { readonly [K in keyof T]: Result<T[K], E> }
): Result<T, E> => {
  const data: unknown[] = [];
  
  for (const result of results) {
    if (!result.success) {
      return result;
    }
    data.push(result.data);
  }
  
  return Ok(data as T);
};

/**
 * Return first successful Result or last error
 */
export const any = <T, E>(results: readonly Result<T, E>[]): Result<T, E> => {
  let lastError: E | undefined;
  
  for (const result of results) {
    if (result.success) {
      return result;
    }
    lastError = result.error;
  }
  
  return Err(lastError as E);
};

/**
 * Partition Results into successes and errors
 */
export const partition = <T, E>(
  results: readonly Result<T, E>[]
): {
  readonly successes: readonly T[];
  readonly errors: readonly E[];
} => {
  const successes: T[] = [];
  const errors: E[] = [];
  
  for (const result of results) {
    if (result.success) {
      successes.push(result.data);
    } else {
      errors.push(result.error);
    }
  }
  
  return { successes, errors };
};

// ============================================================================
// Pipeline Functions
// ============================================================================

/**
 * Create a pipeline of Result transformations
 */
export const pipe = <T>(value: T) => ({
  map: <U>(fn: (value: T) => U) => pipe(fn(value)),
  flatMap: <U, E>(fn: (value: T) => Result<U, E>) => fn(value),
  filter: (predicate: (value: T) => boolean, error: unknown) =>
    predicate(value) ? Ok(value) : Err(error),
  value: () => value,
});

/**
 * Create a Result pipeline
 */
export const pipeResult = <T, E>(result: Result<T, E>) => ({
  map: <U>(fn: (data: T) => U) => pipeResult(map(result, fn)),
  flatMap: <U>(fn: (data: T) => Result<U, E>) => pipeResult(flatMap(result, fn)),
  mapErr: <F>(fn: (error: E) => F) => pipeResult(mapErr(result, fn)),
  unwrapOr: (defaultValue: T) => unwrapOr(result, defaultValue),
  unwrapOrElse: (fn: (error: E) => T) => unwrapOrElse(result, fn),
  result: () => result,
});

// ============================================================================
// Export All Types and Functions
// ============================================================================

// All functions and types are already exported inline above
