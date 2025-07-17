/**
 * @file Enhanced Error Utilities
 *
 * Comprehensive error handling utilities with improved debugging information,
 * source location tracking, and developer experience enhancements.
 */

export type {
  EnhancedErrorConfig,
  ErrorContext,
  SourceLocation,
} from './enhanced-error';
export {
  createEnhancedError,
  createErrorResult,
  EnhancedError,
  errorToResult,
  withContext,
  withEnhancedErrors,
  withEnhancedErrorsAsync,
  withSourceLocation,
} from './enhanced-error';
