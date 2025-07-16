/**
 * @file Enhanced Error Utilities
 * 
 * Comprehensive error handling utilities with improved debugging information,
 * source location tracking, and developer experience enhancements.
 */

export {
  EnhancedError,
  createEnhancedError,
  withSourceLocation,
  withContext,
  errorToResult,
  createErrorResult,
  withEnhancedErrors,
  withEnhancedErrorsAsync,
} from './enhanced-error';

export type {
  SourceLocation,
  ErrorContext,
  EnhancedErrorConfig,
} from './enhanced-error';
