/**
 * Result Utility Functions
 * 
 * Pure functional utilities for working with Result<T,E> types
 * following functional programming patterns and immutable data structures.
 */

import type { 
  Result, 
  AsyncResult, 
  Option, 
  ValidationResult,
  NetworkResult,
  NetworkError 
} from '../../types/result.types';

/**
 * Creates a successful Result
 */
export const success = <T, E = Error>(data: T): Result<T, E> => 
  Object.freeze({ success: true, data });

/**
 * Creates an error Result
 */
export const error = <T, E = Error>(err: E): Result<T, E> => 
  Object.freeze({ success: false, error: err });

/**
 * Creates a Some Option
 */
export const some = <T>(value: T): Option<T> => 
  Object.freeze({ some: true, value });

/**
 * Creates a None Option
 */
export const none = <T>(): Option<T> => 
  Object.freeze({ some: false });

/**
 * Maps over a successful Result, leaving errors unchanged
 */
export const map = <T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => U
): Result<U, E> => {
  if (result.success) {
    return success(fn(result.data));
  }
  return result;
};

/**
 * Maps over an error Result, leaving success unchanged
 */
export const mapError = <T, E, F>(
  result: Result<T, E>,
  fn: (error: E) => F
): Result<T, F> => {
  if (!result.success) {
    return error(fn(result.error));
  }
  return result;
};

/**
 * Chains Result operations (flatMap/bind)
 */
export const chain = <T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => Result<U, E>
): Result<U, E> => {
  if (result.success) {
    return fn(result.data);
  }
  return result;
};

/**
 * Async version of map
 */
export const mapAsync = async <T, U, E>(
  result: AsyncResult<T, E>,
  fn: (value: T) => U | Promise<U>
): AsyncResult<U, E> => {
  const resolvedResult = await result;
  if (resolvedResult.success) {
    const mappedValue = await fn(resolvedResult.data);
    return success(mappedValue);
  }
  return resolvedResult;
};

/**
 * Async version of chain
 */
export const chainAsync = async <T, U, E>(
  result: AsyncResult<T, E>,
  fn: (value: T) => AsyncResult<U, E>
): AsyncResult<U, E> => {
  const resolvedResult = await result;
  if (resolvedResult.success) {
    return fn(resolvedResult.data);
  }
  return resolvedResult;
};

/**
 * Unwraps a Result, providing a default value for errors
 */
export const unwrapOr = <T, E>(result: Result<T, E>, defaultValue: T): T => {
  return result.success ? result.data : defaultValue;
};

/**
 * Unwraps a Result, throwing an error if it's an error Result
 */
export const unwrap = <T, E>(result: Result<T, E>): T => {
  if (result.success) {
    return result.data;
  }
  throw new Error(`Attempted to unwrap error Result: ${String(result.error)}`);
};

/**
 * Combines multiple Results into a single Result containing an array
 */
export const combine = <T, E>(results: ReadonlyArray<Result<T, E>>): Result<ReadonlyArray<T>, E> => {
  const values: T[] = [];
  
  for (const result of results) {
    if (!result.success) {
      return result;
    }
    values.push(result.data);
  }
  
  return success(Object.freeze(values));
};

/**
 * Combines multiple Results, collecting all errors
 */
export const combineAll = <T, E>(
  results: ReadonlyArray<Result<T, E>>
): Result<ReadonlyArray<T>, ReadonlyArray<E>> => {
  const values: T[] = [];
  const errors: E[] = [];
  
  for (const result of results) {
    if (result.success) {
      values.push(result.data);
    } else {
      errors.push(result.error);
    }
  }
  
  if (errors.length > 0) {
    return error(Object.freeze(errors));
  }
  
  return success(Object.freeze(values));
};

/**
 * Converts a throwing function to a Result-returning function
 */
export const tryCatch = <T, E = Error>(
  fn: () => T,
  errorMapper?: (error: unknown) => E
): Result<T, E> => {
  try {
    const result = fn();
    return success(result);
  } catch (err) {
    const mappedError = errorMapper ? errorMapper(err) : (err as E);
    return error(mappedError);
  }
};

/**
 * Async version of tryCatch
 */
export const tryCatchAsync = async <T, E = Error>(
  fn: () => Promise<T>,
  errorMapper?: (error: unknown) => E
): AsyncResult<T, E> => {
  try {
    const result = await fn();
    return success(result);
  } catch (err) {
    const mappedError = errorMapper ? errorMapper(err) : (err as E);
    return error(mappedError);
  }
};

/**
 * Filters a Result based on a predicate
 */
export const filter = <T, E>(
  result: Result<T, E>,
  predicate: (value: T) => boolean,
  errorOnFalse: E
): Result<T, E> => {
  if (result.success && predicate(result.data)) {
    return result;
  }
  if (result.success) {
    return error(errorOnFalse);
  }
  return result;
};

/**
 * Converts an Option to a Result
 */
export const optionToResult = <T, E>(option: Option<T>, errorValue: E): Result<T, E> => {
  return option.some ? success(option.value) : error(errorValue);
};

/**
 * Converts a Result to an Option
 */
export const resultToOption = <T, E>(result: Result<T, E>): Option<T> => {
  return result.success ? some(result.data) : none();
};

/**
 * Creates a NetworkResult from a fetch response
 */
export const fromFetchResponse = async <T>(
  response: Response,
  parser: (response: Response) => Promise<T>
): AsyncResult<T, NetworkError> => {
  if (!response.ok) {
    const networkError: NetworkError = {
      status: response.status,
      message: response.statusText || `HTTP ${response.status}`,
      details: { url: response.url }
    };
    return error(networkError);
  }

  return tryCatchAsync(
    () => parser(response),
    (err): NetworkError => ({
      status: response.status,
      message: err instanceof Error ? err.message : String(err),
      details: { parseError: err }
    })
  );
};

/**
 * Validates a value and returns a ValidationResult
 */
export const validate = <T>(
  value: T,
  validators: ReadonlyArray<(value: T) => string | null>
): ValidationResult<T> => {
  const errors: string[] = [];
  
  for (const validator of validators) {
    const error = validator(value);
    if (error !== null) {
      errors.push(error);
    }
  }
  
  if (errors.length > 0) {
    return error(Object.freeze(errors));
  }
  
  return success(value);
};
