/**
 * @file User-Friendly Error Handler Service
 *
 * Provides user-facing error messages with actionable suggestions and
 * context-aware help. Transforms technical errors into understandable
 * messages for end users.
 *
 * @example
 * ```typescript
 * import { UserErrorHandlerService } from './user-error-handler.service';
 *
 * const errorHandler = new UserErrorHandlerService();
 *
 * try {
 *   // Some operation that might fail
 *   await parseOpenSCAD(code);
 * } catch (error) {
 *   const userMessage = errorHandler.handleError(error);
 *   showToUser(userMessage);
 * }
 * ```
 */

import type { Result } from '../../types/result.types';
import type { EnhancedError } from '../../utils/error';
import { createLogger } from '../logger.service';

/**
 * Extended error interface for accessing additional properties
 */
interface ExtendedError extends Error {
  code?: string;
  location?: unknown;
}

const logger = createLogger('UserErrorHandler');

/**
 * User-friendly error message with suggestions
 */
export interface UserErrorMessage {
  readonly title: string;
  readonly message: string;
  readonly severity: 'info' | 'warning' | 'error' | 'critical';
  readonly suggestions: readonly string[];
  readonly helpUrl?: string;
  readonly canRetry: boolean;
  readonly canRecover: boolean;
  readonly technicalDetails?: string;
}

/**
 * Error category for user-friendly handling
 */
export enum ErrorCategory {
  SYNTAX_ERROR = 'syntax_error',
  FEATURE_NOT_SUPPORTED = 'feature_not_supported',
  RENDERING_ERROR = 'rendering_error',
  NETWORK_ERROR = 'network_error',
  BROWSER_COMPATIBILITY = 'browser_compatibility',
  PERFORMANCE_ISSUE = 'performance_issue',
  UNKNOWN_ERROR = 'unknown_error',
}

/**
 * Error pattern for matching and categorizing errors
 */
interface ErrorPattern {
  readonly category: ErrorCategory;
  readonly pattern: RegExp;
  readonly title: string;
  readonly messageTemplate: string;
  readonly suggestions: readonly string[];
  readonly helpUrl?: string;
  readonly canRetry: boolean;
  readonly canRecover: boolean;
}

/**
 * User Error Handler Service
 *
 * Transforms technical errors into user-friendly messages with
 * actionable suggestions and recovery guidance.
 */
export class UserErrorHandlerService {
  private readonly errorPatterns: readonly ErrorPattern[] = [
    // OpenSCAD Syntax Errors
    {
      category: ErrorCategory.SYNTAX_ERROR,
      pattern: /syntax error|unexpected token|missing semicolon/i,
      title: 'Syntax Error in OpenSCAD Code',
      messageTemplate:
        "There's a syntax error in your OpenSCAD code. Please check your code for missing semicolons, brackets, or typos.",
      suggestions: [
        'Check for missing semicolons at the end of statements',
        'Ensure all brackets and parentheses are properly closed',
        'Verify function and module names are spelled correctly',
        'Use the syntax highlighting to identify issues',
      ],
      helpUrl: 'https://openscad.org/documentation.html',
      canRetry: true,
      canRecover: true,
    },

    // Browser Compatibility (check first, more specific)
    {
      category: ErrorCategory.BROWSER_COMPATIBILITY,
      pattern:
        /not supported.*browser|webgl.*not supported|webgl.*not available|gpu.*not supported|webgl not supported/i,
      title: 'Browser Compatibility Issue',
      messageTemplate: "Your browser doesn't support all the features needed for 3D rendering.",
      suggestions: [
        'Use a modern browser (Chrome, Firefox, Safari, or Edge)',
        'Enable hardware acceleration in browser settings',
        'Update your browser to the latest version',
        'Try using a different device',
      ],
      helpUrl: 'https://caniuse.com/webgl',
      canRetry: false,
      canRecover: false,
    },

    // Feature Not Supported
    {
      category: ErrorCategory.FEATURE_NOT_SUPPORTED,
      pattern: /not supported|not implemented|unsupported feature/i,
      title: 'Feature Not Supported',
      messageTemplate: 'This OpenSCAD feature is not yet supported in the web editor.',
      suggestions: [
        'Try using alternative OpenSCAD functions',
        'Check the documentation for supported features',
        'Consider simplifying your model',
        'Use basic primitives and operations',
      ],
      helpUrl: 'https://docs.openscad.org/supported-features',
      canRetry: false,
      canRecover: true,
    },

    // WebGL/Rendering Errors (more general)
    {
      category: ErrorCategory.RENDERING_ERROR,
      pattern: /webgl.*context lost|rendering.*failed|gpu.*error/i,
      title: 'Rendering Error',
      messageTemplate:
        'There was a problem rendering your 3D model. This might be due to graphics driver issues or browser limitations.',
      suggestions: [
        'Try refreshing the page',
        'Update your graphics drivers',
        'Use a different browser (Chrome or Firefox recommended)',
        'Reduce model complexity',
        'Close other browser tabs to free up memory',
      ],
      canRetry: true,
      canRecover: true,
    },

    // Network Errors (more specific pattern first)
    {
      category: ErrorCategory.NETWORK_ERROR,
      pattern: /network|fetch|connection.*timeout|timeout.*connection|connection.*error/i,
      title: 'Network Error',
      messageTemplate:
        'There was a problem connecting to the server. Please check your internet connection.',
      suggestions: [
        'Check your internet connection',
        'Try refreshing the page',
        'Wait a moment and try again',
        'Contact support if the problem persists',
      ],
      canRetry: true,
      canRecover: false,
    },

    // Performance Issues (more general timeout pattern)
    {
      category: ErrorCategory.PERFORMANCE_ISSUE,
      pattern: /too complex|memory|performance|timeout(?!.*connection)/i,
      title: 'Performance Issue',
      messageTemplate: 'Your model is too complex for smooth rendering. Consider simplifying it.',
      suggestions: [
        'Reduce the number of objects in your model',
        'Use lower resolution for curved surfaces',
        'Break complex models into smaller parts',
        'Use simpler geometric shapes where possible',
      ],
      canRetry: true,
      canRecover: true,
    },
  ];

  constructor() {
    logger.init('[INIT] User error handler service initialized');
  }

  /**
   * Handle an error and return user-friendly message
   */
  handleError(error: Error | EnhancedError | unknown): UserErrorMessage {
    logger.debug('[DEBUG] Handling user error:', error);

    try {
      const errorMessage = this.extractErrorMessage(error);
      const category = this.categorizeError(errorMessage);
      const pattern = this.findMatchingPattern(category, errorMessage);

      if (pattern) {
        return this.createUserMessage(pattern, errorMessage, error);
      }

      // Fallback for unknown errors
      return this.createFallbackMessage(errorMessage, error);
    } catch (handlingError) {
      logger.error('[ERROR] Failed to handle user error:', handlingError);
      return this.createCriticalErrorMessage();
    }
  }

  /**
   * Handle error and return Result type
   */
  handleErrorAsResult(error: Error | EnhancedError | unknown): Result<never, UserErrorMessage> {
    const userMessage = this.handleError(error);
    return { success: false, error: userMessage };
  }

  /**
   * Get suggestions for a specific error category
   */
  getSuggestionsForCategory(category: ErrorCategory): readonly string[] {
    const pattern = this.errorPatterns.find((p) => p.category === category);
    return pattern?.suggestions || [];
  }

  /**
   * Check if an error is recoverable
   */
  isRecoverable(error: Error | EnhancedError | unknown): boolean {
    const errorMessage = this.extractErrorMessage(error);
    const category = this.categorizeError(errorMessage);
    const pattern = this.findMatchingPattern(category, errorMessage);
    return pattern?.canRecover ?? true;
  }

  /**
   * Check if an operation can be retried
   */
  canRetry(error: Error | EnhancedError | unknown): boolean {
    const errorMessage = this.extractErrorMessage(error);
    const category = this.categorizeError(errorMessage);
    const pattern = this.findMatchingPattern(category, errorMessage);
    return pattern?.canRetry ?? false;
  }

  /**
   * Extract error message from various error types
   */
  private extractErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    if (typeof error === 'string') {
      return error;
    }

    if (error && typeof error === 'object' && 'message' in error) {
      return String((error as ExtendedError).message);
    }

    return 'An unknown error occurred';
  }

  /**
   * Categorize error based on message content
   */
  private categorizeError(message: string): ErrorCategory {
    for (const pattern of this.errorPatterns) {
      if (pattern.pattern.test(message)) {
        return pattern.category;
      }
    }
    return ErrorCategory.UNKNOWN_ERROR;
  }

  /**
   * Find matching error pattern
   */
  private findMatchingPattern(category: ErrorCategory, message: string): ErrorPattern | null {
    return (
      this.errorPatterns.find((p) => p.category === category && p.pattern.test(message)) || null
    );
  }

  /**
   * Create user-friendly message from pattern
   */
  private createUserMessage(
    pattern: ErrorPattern,
    _originalMessage: string,
    originalError: unknown
  ): UserErrorMessage {
    const severity = this.determineSeverity(pattern.category);
    const technicalDetails = this.extractTechnicalDetails(originalError);

    return {
      title: pattern.title,
      message: pattern.messageTemplate,
      severity,
      suggestions: pattern.suggestions,
      helpUrl: pattern.helpUrl,
      canRetry: pattern.canRetry,
      canRecover: pattern.canRecover,
      technicalDetails,
    };
  }

  /**
   * Create fallback message for unknown errors
   */
  private createFallbackMessage(_message: string, originalError: unknown): UserErrorMessage {
    const technicalDetails = this.extractTechnicalDetails(originalError);

    return {
      title: 'Unexpected Error',
      message:
        'Something unexpected happened. Please try again or contact support if the problem persists.',
      severity: 'error',
      suggestions: [
        'Try refreshing the page',
        'Check your internet connection',
        'Try again in a few moments',
        'Contact support with the technical details below',
      ],
      canRetry: true,
      canRecover: true,
      technicalDetails,
    };
  }

  /**
   * Create critical error message for handler failures
   */
  private createCriticalErrorMessage(): UserErrorMessage {
    return {
      title: 'Critical Error',
      message: 'A critical error occurred in the error handling system. Please refresh the page.',
      severity: 'critical',
      suggestions: [
        'Refresh the page immediately',
        'Clear your browser cache',
        'Try using a different browser',
        'Contact technical support',
      ],
      canRetry: false,
      canRecover: false,
    };
  }

  /**
   * Determine severity based on error category
   */
  private determineSeverity(category: ErrorCategory): UserErrorMessage['severity'] {
    switch (category) {
      case ErrorCategory.SYNTAX_ERROR:
        return 'warning';
      case ErrorCategory.FEATURE_NOT_SUPPORTED:
        return 'info';
      case ErrorCategory.RENDERING_ERROR:
        return 'error';
      case ErrorCategory.BROWSER_COMPATIBILITY:
        return 'critical';
      case ErrorCategory.PERFORMANCE_ISSUE:
        return 'warning';
      case ErrorCategory.NETWORK_ERROR:
        return 'error';
      default:
        return 'error';
    }
  }

  /**
   * Extract technical details for debugging
   */
  private extractTechnicalDetails(error: unknown): string | undefined {
    if (error instanceof Error) {
      const details = [`Error: ${error.name}`, `Message: ${error.message}`];

      if (error.stack) {
        details.push(`Stack: ${error.stack.split('\n').slice(0, 3).join('\n')}`);
      }

      // Enhanced error details
      if ('code' in error) {
        details.push(`Code: ${(error as ExtendedError).code}`);
      }

      if ('location' in error) {
        const location = (error as ExtendedError).location;
        if (location) {
          details.push(`Location: ${JSON.stringify(location)}`);
        }
      }

      return details.join('\n');
    }

    return undefined;
  }

  /**
   * Dispose the service
   */
  dispose(): void {
    logger.debug('[DISPOSE] User error handler service disposed');
  }
}
