/**
 * @file Enhanced Error Utilities for Better Developer Experience
 *
 * Provides enhanced error creation and handling utilities with improved
 * source location information, stack traces, and debugging context.
 *
 * @example
 * ```typescript
 * import { createEnhancedError, withSourceLocation } from './enhanced-error';
 *
 * // Create error with enhanced context
 * const error = createEnhancedError({
 *   message: 'Failed to parse OpenSCAD code',
 *   code: 'PARSE_ERROR',
 *   source: 'cube(10);',
 *   location: { line: 1, column: 5 },
 *   context: { operation: 'parsing', file: 'model.scad' }
 * });
 *
 * // Add source location to existing error
 * const enhancedError = withSourceLocation(originalError, {
 *   file: 'src/parser.ts',
 *   function: 'parseAST',
 *   line: 42
 * });
 * ```
 */

import type { Result } from '../functional/result';

/**
 * Source location information for enhanced error reporting
 */
export interface SourceLocation {
  readonly file?: string;
  readonly function?: string;
  readonly line?: number;
  readonly column?: number;
  readonly offset?: number;
}

/**
 * Enhanced error context with debugging information
 */
export interface ErrorContext {
  readonly operation?: string;
  readonly component?: string;
  readonly userId?: string;
  readonly sessionId?: string;
  readonly timestamp?: Date;
  readonly userAgent?: string;
  readonly url?: string;
  readonly additionalData?: Record<string, unknown>;
}

/**
 * Enhanced error configuration
 */
export interface EnhancedErrorConfig {
  readonly message: string;
  readonly code?: string;
  readonly source?: string;
  readonly location?: SourceLocation;
  readonly context?: ErrorContext;
  readonly cause?: Error;
  readonly severity?: 'low' | 'medium' | 'high' | 'critical';
  readonly recoverable?: boolean;
  readonly suggestions?: readonly string[];
}

/**
 * Enhanced error class with improved debugging information
 */
export class EnhancedError extends Error {
  public readonly code: string;
  public readonly source?: string;
  public readonly location?: SourceLocation;
  public readonly context: ErrorContext;
  public readonly severity: 'low' | 'medium' | 'high' | 'critical';
  public readonly recoverable: boolean;
  public readonly suggestions: readonly string[];
  public readonly timestamp: Date;
  public readonly originalStack?: string;

  constructor(config: EnhancedErrorConfig) {
    super(config.message);

    this.name = 'EnhancedError';
    this.code = config.code || 'UNKNOWN_ERROR';
    this.source = config.source;
    this.location = config.location;
    this.context = {
      timestamp: new Date(),
      ...config.context,
    };
    this.severity = config.severity || 'medium';
    this.recoverable = config.recoverable ?? true;
    this.suggestions = config.suggestions || [];
    this.timestamp = new Date();

    // Preserve original stack trace
    this.originalStack = this.stack;

    // Set cause if provided
    if (config.cause) {
      this.cause = config.cause;
    }

    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, EnhancedError);
    }
  }

  /**
   * Get formatted error message with all context information
   */
  getFormattedMessage(): string {
    const parts: string[] = [this.message];

    if (this.code !== 'UNKNOWN_ERROR') {
      parts.push(`[${this.code}]`);
    }

    if (this.location) {
      const locationParts: string[] = [];
      if (this.location.file) locationParts.push(`file: ${this.location.file}`);
      if (this.location.function) locationParts.push(`function: ${this.location.function}`);
      if (this.location.line) locationParts.push(`line: ${this.location.line}`);
      if (this.location.column) locationParts.push(`column: ${this.location.column}`);

      if (locationParts.length > 0) {
        parts.push(`(${locationParts.join(', ')})`);
      }
    }

    if (this.source) {
      parts.push(
        `Source: "${this.source.substring(0, 100)}${this.source.length > 100 ? '...' : ''}"`
      );
    }

    if (this.context.operation) {
      parts.push(`Operation: ${this.context.operation}`);
    }

    if (this.suggestions.length > 0) {
      parts.push(`Suggestions: ${this.suggestions.join(', ')}`);
    }

    return parts.join(' ');
  }

  /**
   * Get debugging information as a structured object
   */
  getDebugInfo(): Record<string, unknown> {
    return {
      message: this.message,
      code: this.code,
      severity: this.severity,
      recoverable: this.recoverable,
      timestamp: this.timestamp.toISOString(),
      location: this.location,
      context: this.context,
      source: this.source,
      suggestions: this.suggestions,
      stack: this.stack,
      originalStack: this.originalStack,
      cause: this.cause
        ? {
            name: this.cause.name,
            message: this.cause.message,
            stack: this.cause.stack,
          }
        : undefined,
    };
  }

  /**
   * Convert to JSON for logging or transmission
   */
  toJSON(): Record<string, unknown> {
    return this.getDebugInfo();
  }
}

/**
 * Create an enhanced error with improved debugging information
 */
export const createEnhancedError = (config: EnhancedErrorConfig): EnhancedError => {
  return new EnhancedError(config);
};

/**
 * Add source location information to an existing error
 */
export const withSourceLocation = (error: Error, location: SourceLocation): EnhancedError => {
  if (error instanceof EnhancedError) {
    return createEnhancedError({
      message: error.message,
      code: error.code,
      source: error.source,
      location: { ...error.location, ...location },
      context: error.context,
      cause: error.cause as Error,
      severity: error.severity,
      recoverable: error.recoverable,
      suggestions: error.suggestions,
    });
  }

  return createEnhancedError({
    message: error.message,
    location,
    cause: error,
  });
};

/**
 * Add operation context to an existing error
 */
export const withContext = (error: Error, context: ErrorContext): EnhancedError => {
  if (error instanceof EnhancedError) {
    return createEnhancedError({
      message: error.message,
      code: error.code,
      source: error.source,
      location: error.location,
      context: { ...error.context, ...context },
      cause: error.cause as Error,
      severity: error.severity,
      recoverable: error.recoverable,
      suggestions: error.suggestions,
    });
  }

  return createEnhancedError({
    message: error.message,
    context,
    cause: error,
  });
};

/**
 * Convert an enhanced error to a Result type
 */
export const errorToResult = <T>(error: EnhancedError): Result<T, EnhancedError> => {
  return { success: false, error };
};

/**
 * Create a Result with an enhanced error
 */
export const createErrorResult = <T>(config: EnhancedErrorConfig): Result<T, EnhancedError> => {
  return errorToResult(createEnhancedError(config));
};

/**
 * Wrap a function to automatically enhance any thrown errors
 */
export const withEnhancedErrors = <T extends readonly unknown[], R>(
  fn: (...args: T) => R,
  location: SourceLocation,
  context?: ErrorContext
) => {
  return (...args: T): R => {
    try {
      return fn(...args);
    } catch (error) {
      const enhancedError = withSourceLocation(error as Error, location);
      if (context) {
        throw withContext(enhancedError, context);
      }
      throw enhancedError;
    }
  };
};

/**
 * Async version of withEnhancedErrors
 */
export const withEnhancedErrorsAsync = <T extends readonly unknown[], R>(
  fn: (...args: T) => Promise<R>,
  location: SourceLocation,
  context?: ErrorContext
) => {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      const enhancedError = withSourceLocation(error as Error, location);
      if (context) {
        throw withContext(enhancedError, context);
      }
      throw enhancedError;
    }
  };
};
