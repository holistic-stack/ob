/**
 * @file error-handler.ts
 * @description This file provides a comprehensive error handling system for the OpenSCAD parser,
 * including error collection, reporting, recovery strategies, and logging integration.
 * The `ErrorHandler` class serves as the central coordinator for all error-related operations
 * throughout the parsing and AST generation process.
 *
 * @architectural_decision
 * The error handling system is designed to be robust and flexible. It uses a class-based approach
 * to encapsulate the error state and configuration. The system supports different error severity
 * levels, allowing for fine-grained control over error reporting. It also includes a mechanism
 * for error recovery, which can be extended with custom strategies. This design ensures that the
 * parser can gracefully handle errors and provide meaningful feedback to the user.
 *
 * @example
 * ```typescript
 * import { ErrorHandler, Severity } from './error-handler';
 *
 * // 1. Create a new error handler instance
 * const errorHandler = new ErrorHandler({
 *   throwErrors: false,        // Collect errors instead of throwing
 *   minSeverity: Severity.WARNING,  // Include warnings and above
 *   attemptRecovery: true,     // Try to recover from errors
 *   includeSource: true        // Include source context in errors
 * });
 *
 * // 2. Use the error handler throughout the parsing process
 * try {
 *   // Some parsing operation that might fail
 *   throw new Error('Something went wrong');
 * } catch (error) {
 *   errorHandler.handleError(error as Error, 'MyParser.parse');
 * }
 *
 * // 3. Get the collected errors
 * const errors = errorHandler.getErrors();
 * console.log(errors);
 * ```
 *
 * @integration
 * The `ErrorHandler` is instantiated in the `OpenscadParser` and passed down to all the
 * visitors. This ensures that all parts of the parser have access to a single, consistent
 * error handling mechanism. The collected errors can then be used to display feedback to the
 * user in the UI.
 */

import type { Node as TSNode } from 'web-tree-sitter';
import { Logger, type LoggerOptions } from './logger.js';
import { RecoveryStrategyRegistry } from './recovery-strategy-registry.js';
import {
  ReferenceError as CustomReferenceError,
  SyntaxError as CustomSyntaxError,
  TypeError as CustomTypeError,
  ErrorCode,
  type ErrorContext,
  InternalError as InternalParserError,
  ParserError,
  Severity,
  ValidationError,
} from './types/error-types.js';

/**
 * @interface ErrorHandlerOptions
 * @description Configuration options for the `ErrorHandler`.
 */
export interface ErrorHandlerOptions {
  /** Whether to throw errors immediately when they occur */
  throwErrors?: boolean;
  /** Minimum severity level for errors to be considered critical */
  minSeverity?: Severity;
  /** Whether to include source code in error context */
  includeSource?: boolean;
  /** Whether to attempt error recovery */
  attemptRecovery?: boolean;
  /** Logger configuration options */
  loggerOptions?: LoggerOptions;
}

/**
 * @class ErrorHandler
 * @description Central error handler for managing errors and recovery in the OpenSCAD parser.
 */
export class ErrorHandler {
  private errors: ParserError[] = [];
  private recoveryRegistry: RecoveryStrategyRegistry;
  private logger: Logger;

  /** Configuration options for the error error-handling */
  public readonly options: Required<ErrorHandlerOptions>;

  /**
   * @constructor
   * @description Creates a new `ErrorHandler`.
   * @param {ErrorHandlerOptions} [options] - Configuration options.
   */
  constructor(options: ErrorHandlerOptions = {}) {
    this.options = {
      throwErrors: options.throwErrors ?? true,
      minSeverity: options.minSeverity ?? Severity.ERROR,
      includeSource: options.includeSource ?? true,
      attemptRecovery: options.attemptRecovery ?? false,
      loggerOptions: options.loggerOptions ?? {},
    };

    this.logger = new Logger(this.options.loggerOptions);
    this.recoveryRegistry = new RecoveryStrategyRegistry();
  }

  /**
   * @method createParserError
   * @description Creates a generic parser error.
   * @param {string} message - The error message.
   * @param {ErrorContext} [context] - The error context.
   * @returns {ParserError} A new `ParserError` instance.
   */
  createParserError(message: string, context: ErrorContext = {}): ParserError {
    return new ParserError(message, ErrorCode.INTERNAL_ERROR, Severity.ERROR, context);
  }

  /**
   * @method createSyntaxError
   * @description Creates a syntax error.
   * @param {string} message - The error message.
   * @param {ErrorContext} [context] - The error context.
   * @returns {CustomSyntaxError} A new `SyntaxError` instance.
   */
  createSyntaxError(message: string, context: ErrorContext = {}): CustomSyntaxError {
    return new CustomSyntaxError(message, context);
  }

  /**
   * @method createTypeError
   * @description Creates a type error.
   * @param {string} message - The error message.
   * @param {ErrorContext} [context] - The error context.
   * @returns {CustomTypeError} A new `TypeError` instance.
   */
  createTypeError(message: string, context: ErrorContext = {}): CustomTypeError {
    return new CustomTypeError(message, context);
  }

  /**
   * @method createValidationError
   * @description Creates a validation error.
   * @param {string} message - The error message.
   * @param {ErrorContext} [context] - The error context.
   * @returns {ValidationError} A new `ValidationError` instance.
   */
  createValidationError(message: string, context: ErrorContext = {}): ValidationError {
    return new ValidationError(message, context);
  }

  /**
   * @method createReferenceError
   * @description Creates a reference error.
   * @param {string} message - The error message.
   * @param {ErrorContext} [context] - The error context.
   * @returns {CustomReferenceError} A new `ReferenceError` instance.
   */
  createReferenceError(message: string, context: ErrorContext = {}): CustomReferenceError {
    return new CustomReferenceError(message, context);
  }

  /**
   * @method createInternalError
   * @description Creates an internal error.
   * @param {string} message - The error message.
   * @param {ErrorContext} [context] - The error context.
   * @returns {InternalParserError} A new `InternalError` instance.
   */
  createInternalError(message: string, context: ErrorContext = {}): InternalParserError {
    return new InternalParserError(message, context);
  }

  /**
   * @method report
   * @description Reports an error to the error handler.
   * @param {ParserError} error - The error to report.
   */
  report(error: ParserError): void {
    // Only collect errors that meet the minimum severity threshold
    if (this.shouldCollectError(error)) {
      this.errors.push(error);
      this.logger.log(error.severity, error.getFormattedMessage());
    }

    // Throw error if configured to do so and error is critical
    if (this.options.throwErrors && this.isCriticalError(error)) {
      throw error;
    }
  }

  /**
   * @method attemptRecovery
   * @description Attempts to recover from an error using registered strategies.
   * @param {ParserError} error - The error to recover from.
   * @param {string} code - The original source code.
   * @returns {string | null} The recovered code if successful, otherwise null.
   */
  attemptRecovery(error: ParserError, code: string): string | null {
    if (!this.options.attemptRecovery) {
      return null;
    }

    const recoveredCode = this.recoveryRegistry.attemptRecovery(error, code);

    if (recoveredCode) {
      // Successfully recovered from error
    } else {
      // Could not recover from error
    }

    return recoveredCode;
  }

  /**
   * @method getErrors
   * @description Gets all collected errors.
   * @returns {readonly ParserError[]} An array of collected errors.
   */
  getErrors(): readonly ParserError[] {
    return [...this.errors];
  }

  /**
   * @method getErrorsBySeverity
   * @description Gets errors filtered by severity level.
   * @param {Severity} minSeverity - The minimum severity level to include.
   * @returns {ParserError[]} An array of filtered errors.
   */
  getErrorsBySeverity(minSeverity: Severity): ParserError[] {
    const minLevel = this.getSeverityLevel(minSeverity);
    return this.errors.filter((error) => this.getSeverityLevel(error.severity) >= minLevel);
  }

  /**
   * @method clearErrors
   * @description Clears all collected errors.
   */
  clearErrors(): void {
    this.errors = [];
  }

  /**
   * @method hasErrors
   * @description Checks if there are any errors.
   * @returns {boolean} True if there are collected errors.
   */
  hasErrors(): boolean {
    return this.errors.length > 0;
  }

  /**
   * @method hasCriticalErrors
   * @description Checks if there are any critical errors.
   * @returns {boolean} True if there are critical errors.
   */
  hasCriticalErrors(): boolean {
    return this.errors.some((error) => this.isCriticalError(error));
  }

  /**
   * @method getRecoveryRegistry
   * @description Gets the recovery strategy registry.
   * @returns {RecoveryStrategyRegistry} The recovery strategy registry.
   */
  getRecoveryRegistry(): RecoveryStrategyRegistry {
    return this.recoveryRegistry;
  }

  /**
   * @method getLogger
   * @description Gets the logger instance.
   * @returns {Logger} The logger instance.
   */
  getLogger(): Logger {
    return this.logger;
  }

  /**
   * @method logInfo
   * @description Logs an info message.
   * @param {string} _message - The message to log.
   * @param {string} [_context] - Optional context information.
   * @param {TSNode} [_node] - Optional tree-sitter node for additional context.
   */
  logInfo(_message: string, _context?: string, _node?: TSNode): void {
    // Info logging removed
  }

  /**
   * @method logDebug
   * @description Logs a debug message.
   * @param {string} _message - The message to log.
   * @param {string} [_context] - Optional context information.
   * @param {TSNode} [_node] - Optional tree-sitter node for additional context.
   */
  logDebug(_message: string, _context?: string, _node?: TSNode): void {
    // Debug logging removed
  }

  /**
   * @method logWarning
   * @description Logs a warning message with optional context information.
   * @param {string} _message - The warning message to log.
   * @param {string} [_context] - Optional context information (e.g., method name, phase).
   * @param {TSNode} [_node] - Optional tree-sitter node for additional context such as location.
   */
  logWarning(_message: string, _context?: string, _node?: TSNode): void {
    // Warning logging removed
  }

  /**
   * @method logError
   * @description Logs an error message with optional context information.
   * @param {string} message - The error message to log.
   * @param {string} [_context] - Optional context information (e.g., method name, component).
   * @param {TSNode} [_node] - Optional tree-sitter node for additional context such as location.
   */
  logError(message: string, _context?: string, _node?: TSNode): void {
    this.logger.error(message);
  }

  /**
   * @method handleError
   * @description Handles an error by logging it and optionally reporting it to the error collection system.
   * @param {Error} error - The error to handle (can be a standard `Error` or a `ParserError`).
   * @param {string} [context] - Optional context information (e.g., class and method where error occurred).
   * @param {TSNode} [_node] - Optional tree-sitter node for additional context such as location information.
   */
  handleError(error: Error, context?: string, _node?: TSNode): void {
    const message = context ? `${context}: ${error.message}` : error.message;
    this.logger.error(message);
  }

  /**
   * @method shouldCollectError
   * @description Determines if an error should be collected based on severity.
   * @param {ParserError} error - The error to check.
   * @returns {boolean} True if the error should be collected.
   * @private
   */
  private shouldCollectError(error: ParserError): boolean {
    return this.getSeverityLevel(error.severity) >= this.getSeverityLevel(this.options.minSeverity);
  }

  /**
   * @method isCriticalError
   * @description Determines if an error is critical and should cause throwing.
   * @param {ParserError} error - The error to check.
   * @returns {boolean} True if the error is critical.
   * @private
   */
  private isCriticalError(error: ParserError): boolean {
    return this.getSeverityLevel(error.severity) >= this.getSeverityLevel(Severity.ERROR);
  }

  /**
   * @method getSeverityLevel
   * @description Gets the numeric level for a severity.
   * @param {Severity} severity - The severity to get the level for.
   * @returns {number} The numeric level for comparison.
   * @private
   */
  private getSeverityLevel(severity: Severity): number {
    const levels: Record<Severity, number> = {
      [Severity.DEBUG]: 0,
      [Severity.INFO]: 1,
      [Severity.WARNING]: 2,
      [Severity.ERROR]: 3,
      [Severity.FATAL]: 4,
    };
    return levels[severity] ?? 0;
  }
}
