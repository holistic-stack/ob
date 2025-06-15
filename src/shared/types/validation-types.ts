/**
 * @file Validation Types - Runtime Type Checking
 * 
 * Comprehensive validation system with runtime type checking
 * and compile-time type safety. Provides detailed error messages
 * and composable validation functions.
 * 
 * Features:
 * - Runtime type validation with TypeScript integration
 * - Detailed validation error messages
 * - Composable validation functions
 * - Schema-based validation
 * - Custom validator support
 * 
 * @author Luciano Júnior
 * @date June 2025
 */

import type { Result } from './result-types';
import { Ok, Err } from './result-types';

// ============================================================================
// Core Validation Types
// ============================================================================

/**
 * Validation result with detailed error information
 */
export interface ValidationError {
  readonly field: string;
  readonly message: string;
  readonly code: ValidationErrorCode;
  readonly value?: unknown;
  readonly expected?: string;
  readonly context?: Record<string, unknown>;
}

/**
 * Validation error codes for categorization
 */
export type ValidationErrorCode =
  | 'required'
  | 'type_mismatch'
  | 'invalid_format'
  | 'out_of_range'
  | 'too_short'
  | 'too_long'
  | 'invalid_pattern'
  | 'custom_validation'
  | 'unknown';

/**
 * Validation result type
 */
export type ValidationResult<T> = Result<T, ValidationError[]>;

/**
 * Validator function type
 */
export type Validator<T> = (value: unknown) => ValidationResult<T>;

/**
 * Schema definition for object validation
 */
export type Schema<T> = {
  readonly [K in keyof T]: Validator<T[K]>;
};

/**
 * Validation options
 */
export interface ValidationOptions {
  readonly strict?: boolean;
  readonly allowUnknownFields?: boolean;
  readonly stripUnknownFields?: boolean;
  readonly abortEarly?: boolean;
}

// ============================================================================
// Basic Type Validators
// ============================================================================

/**
 * Validate string type
 */
export const string = (field = 'value'): Validator<string> => (value: unknown) => {
  if (typeof value === 'string') {
    return Ok(value);
  }
  return Err([{
    field,
    message: `Expected string, got ${typeof value}`,
    code: 'type_mismatch',
    value,
    expected: 'string'
  }]);
};

/**
 * Validate number type
 */
export const number = (field = 'value'): Validator<number> => (value: unknown) => {
  if (typeof value === 'number' && !isNaN(value)) {
    return Ok(value);
  }
  return Err([{
    field,
    message: `Expected number, got ${typeof value}`,
    code: 'type_mismatch',
    value,
    expected: 'number'
  }]);
};

/**
 * Validate boolean type
 */
export const boolean = (field = 'value'): Validator<boolean> => (value: unknown) => {
  if (typeof value === 'boolean') {
    return Ok(value);
  }
  return Err([{
    field,
    message: `Expected boolean, got ${typeof value}`,
    code: 'type_mismatch',
    value,
    expected: 'boolean'
  }]);
};

/**
 * Validate array type
 */
export const array = <T>(
  itemValidator: Validator<T>,
  field = 'value'
): Validator<T[]> => (value: unknown) => {
  if (!Array.isArray(value)) {
    return Err([{
      field,
      message: `Expected array, got ${typeof value}`,
      code: 'type_mismatch',
      value,
      expected: 'array'
    }]);
  }

  const errors: ValidationError[] = [];
  const validatedItems: T[] = [];

  for (let i = 0; i < value.length; i++) {
    const itemResult = itemValidator(value[i]);
    if (itemResult.success) {
      validatedItems.push(itemResult.data);
    } else {
      errors.push(...itemResult.error.map(err => ({
        ...err,
        field: `${field}[${i}].${err.field}`
      })));
    }
  }

  return errors.length > 0 ? Err(errors) : Ok(validatedItems);
};

/**
 * Validate object type
 */
export const object = <T extends Record<string, unknown>>(
  schema: Schema<T>,
  field = 'value',
  options: ValidationOptions = {}
): Validator<T> => (value: unknown) => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return Err([{
      field,
      message: `Expected object, got ${typeof value}`,
      code: 'type_mismatch',
      value,
      expected: 'object'
    }]);
  }

  const obj = value as Record<string, unknown>;
  const errors: ValidationError[] = [];
  const result: Partial<T> = {};

  // Validate known fields
  for (const [key, validator] of Object.entries(schema)) {
    const fieldResult = validator(obj[key]);
    if (fieldResult.success) {
      (result as any)[key] = fieldResult.data;
    } else {
      errors.push(...fieldResult.error.map(err => ({
        ...err,
        field: `${field}.${key}${err.field !== 'value' ? `.${err.field}` : ''}`
      })));
    }
  }

  // Handle unknown fields
  if (!options.allowUnknownFields) {
    const unknownFields = Object.keys(obj).filter(key => !(key in schema));
    if (unknownFields.length > 0 && !options.stripUnknownFields) {
      errors.push(...unknownFields.map(key => ({
        field: `${field}.${key}`,
        message: `Unknown field: ${key}`,
        code: 'custom_validation' as ValidationErrorCode,
        value: obj[key]
      })));
    }
  }

  // Add unknown fields if allowed
  if (options.allowUnknownFields && !options.stripUnknownFields) {
    const unknownFields = Object.keys(obj).filter(key => !(key in schema));
    for (const key of unknownFields) {
      (result as any)[key] = obj[key];
    }
  }

  return errors.length > 0 ? Err(errors) : Ok(result as T);
};

// ============================================================================
// Constraint Validators
// ============================================================================

/**
 * Validate required field
 */
export const required = <T>(
  validator: Validator<T>,
  field = 'value'
): Validator<T> => (value: unknown) => {
  if (value === null || value === undefined) {
    return Err([{
      field,
      message: 'Field is required',
      code: 'required',
      value
    }]);
  }
  return validator(value);
};

/**
 * Validate optional field
 */
export const optional = <T>(
  validator: Validator<T>,
  field = 'value'
): Validator<T | undefined> => (value: unknown) => {
  if (value === null || value === undefined) {
    return Ok(undefined);
  }
  return validator(value);
};

/**
 * Validate string length constraints
 */
export const stringLength = (
  min?: number,
  max?: number,
  field = 'value'
): Validator<string> => (value: unknown) => {
  const stringResult = string(field)(value);
  if (!stringResult.success) {
    return stringResult;
  }

  const str = stringResult.data;
  const errors: ValidationError[] = [];

  if (min !== undefined && str.length < min) {
    errors.push({
      field,
      message: `String too short. Expected at least ${min} characters, got ${str.length}`,
      code: 'too_short',
      value: str,
      context: { min, actual: str.length }
    });
  }

  if (max !== undefined && str.length > max) {
    errors.push({
      field,
      message: `String too long. Expected at most ${max} characters, got ${str.length}`,
      code: 'too_long',
      value: str,
      context: { max, actual: str.length }
    });
  }

  return errors.length > 0 ? Err(errors) : Ok(str);
};

/**
 * Validate number range constraints
 */
export const numberRange = (
  min?: number,
  max?: number,
  field = 'value'
): Validator<number> => (value: unknown) => {
  const numberResult = number(field)(value);
  if (!numberResult.success) {
    return numberResult;
  }

  const num = numberResult.data;
  const errors: ValidationError[] = [];

  if (min !== undefined && num < min) {
    errors.push({
      field,
      message: `Number too small. Expected at least ${min}, got ${num}`,
      code: 'out_of_range',
      value: num,
      context: { min, actual: num }
    });
  }

  if (max !== undefined && num > max) {
    errors.push({
      field,
      message: `Number too large. Expected at most ${max}, got ${num}`,
      code: 'out_of_range',
      value: num,
      context: { max, actual: num }
    });
  }

  return errors.length > 0 ? Err(errors) : Ok(num);
};

/**
 * Validate string pattern
 */
export const pattern = (
  regex: RegExp,
  message?: string,
  field = 'value'
): Validator<string> => (value: unknown) => {
  const stringResult = string(field)(value);
  if (!stringResult.success) {
    return stringResult;
  }

  const str = stringResult.data;
  if (!regex.test(str)) {
    return Err([{
      field,
      message: message || `String does not match pattern ${regex.source}`,
      code: 'invalid_pattern',
      value: str,
      context: { pattern: regex.source }
    }]);
  }

  return Ok(str);
};

/**
 * Validate enum values
 */
export const oneOf = <T extends readonly unknown[]>(
  values: T,
  field = 'value'
): Validator<T[number]> => (value: unknown) => {
  if (values.includes(value as T[number])) {
    return Ok(value as T[number]);
  }
  return Err([{
    field,
    message: `Value must be one of: ${values.join(', ')}`,
    code: 'invalid_format',
    value,
    expected: values.join(' | ')
  }]);
};

// ============================================================================
// Composite Validators
// ============================================================================

/**
 * Combine multiple validators with AND logic
 */
export const and = <T>(
  validators: Validator<T>[],
  field = 'value'
): Validator<T> => (value: unknown) => {
  for (const validator of validators) {
    const result = validator(value);
    if (!result.success) {
      return result;
    }
  }
  
  // Return the result of the last validator
  return validators[validators.length - 1](value);
};

/**
 * Combine multiple validators with OR logic
 */
export const or = <T>(
  validators: Validator<T>[],
  field = 'value'
): Validator<T> => (value: unknown) => {
  const allErrors: ValidationError[] = [];
  
  for (const validator of validators) {
    const result = validator(value);
    if (result.success) {
      return result;
    }
    allErrors.push(...result.error);
  }
  
  return Err([{
    field,
    message: `Value failed all validation alternatives`,
    code: 'custom_validation',
    value,
    context: { errors: allErrors }
  }]);
};

/**
 * Custom validator function
 */
export const custom = <T>(
  predicate: (value: T) => boolean,
  message: string,
  field = 'value'
): Validator<T> => (value: unknown) => {
  if (predicate(value as T)) {
    return Ok(value as T);
  }
  return Err([{
    field,
    message,
    code: 'custom_validation',
    value
  }]);
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Validate a value against a schema
 */
export const validate = <T>(
  validator: Validator<T>,
  value: unknown
): ValidationResult<T> => {
  return validator(value);
};

/**
 * Create a validator that transforms the value
 */
export const transform = <T, U>(
  validator: Validator<T>,
  transformer: (value: T) => U,
  field = 'value'
): Validator<U> => (value: unknown) => {
  const result = validator(value);
  if (result.success) {
    try {
      return Ok(transformer(result.data));
    } catch (error) {
      return Err([{
        field,
        message: `Transformation failed: ${error}`,
        code: 'custom_validation',
        value: result.data
      }]);
    }
  }
  return result;
};

/**
 * Format validation errors for display
 */
export const formatValidationErrors = (errors: ValidationError[]): string => {
  return errors
    .map(error => `${error.field}: ${error.message}`)
    .join('\n');
};

/**
 * Check if validation result is successful
 */
export const isValidationSuccess = <T>(
  result: ValidationResult<T>
): result is { success: true; data: T } => {
  return result.success;
};

/**
 * Check if validation result has errors
 */
export const isValidationError = <T>(
  result: ValidationResult<T>
): result is { success: false; error: ValidationError[] } => {
  return !result.success;
};

// ============================================================================
// Export All Types and Functions
// ============================================================================

// All functions and types are already exported inline above
