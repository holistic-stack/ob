/**
 * Result<T,E> Type System for Functional Error Handling
 * 
 * Provides type-safe error handling patterns following functional programming
 * principles with immutable data structures and explicit error states.
 */

/**
 * Result type for functional error handling
 * Represents either a successful value or an error state
 */
export type Result<T, E = Error> = 
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly error: E };

/**
 * Async Result type for Promise-based operations
 */
export type AsyncResult<T, E = Error> = Promise<Result<T, E>>;

/**
 * Option type for nullable values
 * Represents either a value or nothing (null/undefined)
 */
export type Option<T> = 
  | { readonly some: true; readonly value: T }
  | { readonly some: false };

/**
 * Validation Result type for form validation and data validation
 */
export type ValidationResult<T> = Result<T, ReadonlyArray<string>>;

/**
 * Parse Result type for parsing operations
 */
export type ParseResult<T> = Result<T, string>;

/**
 * Network Result type for API operations
 */
export interface NetworkError {
  readonly status: number;
  readonly message: string;
  readonly details?: unknown;
}

export type NetworkResult<T> = Result<T, NetworkError>;

/**
 * File Operation Result type
 */
export interface FileError {
  readonly code: string;
  readonly message: string;
  readonly path?: string;
}

export type FileResult<T> = Result<T, FileError>;

/**
 * Type guards for Result types
 */
export const isSuccess = <T, E>(result: Result<T, E>): result is { readonly success: true; readonly data: T } => {
  return result.success === true;
};

export const isError = <T, E>(result: Result<T, E>): result is { readonly success: false; readonly error: E } => {
  return result.success === false;
};

/**
 * Type guards for Option types
 */
export const isSome = <T>(option: Option<T>): option is { readonly some: true; readonly value: T } => {
  return option.some === true;
};

export const isNone = <T>(option: Option<T>): option is { readonly some: false } => {
  return option.some === false;
};

/**
 * Branded types for domain safety
 */
export type ComponentId = string & { readonly __brand: 'ComponentId' };
export type UserId = string & { readonly __brand: 'UserId' };
export type SessionId = string & { readonly __brand: 'SessionId' };

/**
 * Utility type for creating branded types
 */
export type Brand<T, B> = T & { readonly __brand: B };

/**
 * Utility type for readonly arrays
 */
export type ReadonlyNonEmptyArray<T> = readonly [T, ...T[]];

/**
 * Utility type for deep readonly
 */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends (infer U)[]
    ? ReadonlyArray<DeepReadonly<U>>
    : T[P] extends object
    ? DeepReadonly<T[P]>
    : T[P];
};

/**
 * Async utility type for function types  
 */
export type AsyncPureFunction<TArgs extends readonly unknown[], TReturn> = 
  (...args: TArgs) => Promise<TReturn>;

/**
 * Utility type for event handlers
 */
export type EventHandler<T = void> = () => T;
export type EventHandlerWithPayload<TPayload, TReturn = void> = (payload: TPayload) => TReturn;
