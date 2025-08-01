/**
 * @file axis-errors.ts
 * @description Centralized error handling for 3D axis rendering
 * Follows SRP by handling only error-related functionality
 */

import type { AxisName } from '../axis-constants/axis-constants';

/**
 * Base error interface for all axis-related errors
 */
export interface BaseAxisError {
  readonly code: string;
  readonly message: string;
  readonly timestamp: number;
  readonly context?: Record<string, unknown>;
}

/**
 * Specific error types for different axis operations
 */
export interface AxisCreationError extends BaseAxisError {
  readonly code: 'AXIS_CREATION_ERROR';
  readonly axisName?: AxisName;
  readonly operation: 'create_cylinder' | 'create_lines' | 'create_material' | 'create_shader';
}

export interface AxisConfigurationError extends BaseAxisError {
  readonly code: 'AXIS_CONFIGURATION_ERROR';
  readonly field: string;
  readonly value: unknown;
  readonly expectedType?: string;
}

export interface AxisRenderError extends BaseAxisError {
  readonly code: 'AXIS_RENDER_ERROR';
  readonly renderStage: 'initialization' | 'update' | 'disposal';
}

export interface AxisValidationError extends BaseAxisError {
  readonly code: 'AXIS_VALIDATION_ERROR';
  readonly validationType: 'color' | 'numeric' | 'scene' | 'configuration';
  readonly field?: string;
}

export interface AxisShaderError extends BaseAxisError {
  readonly code: 'AXIS_SHADER_ERROR';
  readonly shaderType: 'vertex' | 'fragment' | 'compilation' | 'linking';
  readonly shaderName?: string;
}

/**
 * Union type for all axis errors
 */
export type AxisError =
  | AxisCreationError
  | AxisConfigurationError
  | AxisRenderError
  | AxisValidationError
  | AxisShaderError;

/**
 * Create an axis creation error
 */
export function createAxisCreationError(
  message: string,
  operation: AxisCreationError['operation'],
  axisName?: AxisName,
  context?: Record<string, unknown>
): AxisCreationError {
  return {
    code: 'AXIS_CREATION_ERROR',
    message,
    timestamp: Date.now(),
    operation,
    ...(axisName !== undefined && { axisName }),
    ...(context !== undefined && { context }),
  };
}

/**
 * Create an axis configuration error
 */
export function createAxisConfigurationError(
  message: string,
  field: string,
  value: unknown,
  expectedType?: string,
  context?: Record<string, unknown>
): AxisConfigurationError {
  return {
    code: 'AXIS_CONFIGURATION_ERROR',
    message,
    timestamp: Date.now(),
    field,
    value,
    ...(expectedType !== undefined && { expectedType }),
    ...(context !== undefined && { context }),
  };
}

/**
 * Create an axis render error
 */
export function createAxisRenderError(
  message: string,
  renderStage: AxisRenderError['renderStage'],
  context?: Record<string, unknown>
): AxisRenderError {
  return {
    code: 'AXIS_RENDER_ERROR',
    message,
    timestamp: Date.now(),
    renderStage,
    ...(context !== undefined && { context }),
  };
}

/**
 * Create an axis validation error
 */
export function createAxisValidationError(
  message: string,
  validationType: AxisValidationError['validationType'],
  field?: string,
  context?: Record<string, unknown>
): AxisValidationError {
  return {
    code: 'AXIS_VALIDATION_ERROR',
    message,
    timestamp: Date.now(),
    validationType,
    ...(field !== undefined && { field }),
    ...(context !== undefined && { context }),
  };
}

/**
 * Create an axis shader error
 */
export function createAxisShaderError(
  message: string,
  shaderType: AxisShaderError['shaderType'],
  shaderName?: string,
  context?: Record<string, unknown>
): AxisShaderError {
  return {
    code: 'AXIS_SHADER_ERROR',
    message,
    timestamp: Date.now(),
    shaderType,
    ...(shaderName !== undefined && { shaderName }),
    ...(context !== undefined && { context }),
  };
}

/**
 * Create a generic axis error from an unknown error
 */
export function createAxisErrorFromUnknown(
  error: unknown,
  operation: string,
  context?: Record<string, unknown>
): AxisRenderError {
  const message = error instanceof Error ? error.message : String(error);
  return createAxisRenderError(
    `Unexpected error during ${operation}: ${message}`,
    'initialization',
    { originalError: error, ...context }
  );
}

/**
 * Error handling utilities
 */
/**
 * Check if an error is an axis error
 */
export function isAxisError(error: unknown): error is AxisError {
  if (
    typeof error !== 'object' ||
    error === null ||
    !('code' in error) ||
    !('message' in error) ||
    !('timestamp' in error)
  ) {
    return false;
  }

  const code = (error as Record<string, unknown>).code;
  return typeof code === 'string' && code.endsWith('_ERROR');
}

/**
 * Check if an error is a specific type of axis error
 */
export function isAxisErrorOfType<T extends AxisError['code']>(
  error: unknown,
  code: T
): error is Extract<AxisError, { code: T }> {
  return isAxisError(error) && error.code === code;
}

/**
 * Format an axis error for logging
 */
export function formatAxisError(error: AxisError): string {
  const timestamp = new Date(error.timestamp).toISOString();
  let details = '';

  switch (error.code) {
    case 'AXIS_CREATION_ERROR':
      details = `operation: ${error.operation}${error.axisName ? `, axis: ${error.axisName}` : ''}`;
      break;
    case 'AXIS_CONFIGURATION_ERROR':
      details = `field: ${error.field}, value: ${JSON.stringify(error.value)}`;
      break;
    case 'AXIS_RENDER_ERROR':
      details = `stage: ${error.renderStage}`;
      break;
    case 'AXIS_VALIDATION_ERROR':
      details = `type: ${error.validationType}${error.field ? `, field: ${error.field}` : ''}`;
      break;
    case 'AXIS_SHADER_ERROR':
      details = `type: ${error.shaderType}${error.shaderName ? `, shader: ${error.shaderName}` : ''}`;
      break;
  }

  return `[${timestamp}] ${error.code}: ${error.message} (${details})`;
}

/**
 * Extract error context for debugging
 */
export function extractAxisErrorContext(error: AxisError): Record<string, unknown> {
  const baseContext = {
    code: error.code,
    timestamp: error.timestamp,
  };

  return {
    ...baseContext,
    ...error.context,
  };
}

/**
 * Create a user-friendly error message
 */
export function getAxisErrorUserFriendlyMessage(error: AxisError): string {
  switch (error.code) {
    case 'AXIS_CREATION_ERROR':
      return `Failed to create 3D axis. Please check your scene configuration.`;
    case 'AXIS_CONFIGURATION_ERROR':
      return `Invalid axis configuration. Please check the ${error.field} setting.`;
    case 'AXIS_RENDER_ERROR':
      return `Failed to render 3D axes. Please try refreshing the view.`;
    case 'AXIS_VALIDATION_ERROR':
      return `Invalid axis settings. Please check your configuration.`;
    case 'AXIS_SHADER_ERROR':
      return `Graphics rendering error. Please check your browser compatibility.`;
    default:
      return `An unexpected error occurred with the 3D axes.`;
  }
}

/**
 * Result type for operations that can fail
 */
export type AxisResult<T> = { success: true; data: T } | { success: false; error: AxisError };

/**
 * Helper functions for creating results
 */
/**
 * Create a successful result
 */
export function createAxisSuccess<T>(data: T): AxisResult<T> {
  return { success: true, data };
}

/**
 * Create a failed result
 */
export function createAxisFailure<T>(error: AxisError): AxisResult<T> {
  return { success: false, error };
}

/**
 * Create a failed result from an unknown error
 */
export function createAxisFailureFromUnknown<T>(
  error: unknown,
  operation: string,
  context?: Record<string, unknown>
): AxisResult<T> {
  return createAxisFailure(createAxisErrorFromUnknown(error, operation, context));
}

/**
 * Check if a result is successful
 */
export function isAxisSuccess<T>(result: AxisResult<T>): result is { success: true; data: T } {
  return result.success;
}

/**
 * Check if a result is a failure
 */
export function isAxisFailure<T>(
  result: AxisResult<T>
): result is { success: false; error: AxisError } {
  return !result.success;
}
