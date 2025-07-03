/**
 * @file Central error handling system for the OpenSCAD parser
 *
 * This module provides comprehensive error handling capabilities for the OpenSCAD parser,
 * including error collection, reporting, recovery strategies, and logging integration.
 * The ErrorHandler class serves as the central coordinator for all error-related operations
 * throughout the parsing and AST generation process.
 *
 * Key features:
 * - Structured error types with severity levels and context information
 * - Configurable error handling behavior (throw vs collect)
 * - Error recovery strategies for common syntax issues
 * - Integrated logging system with multiple output levels
 * - Type-safe error creation and management
 * - Support for error filtering and analysis
 *
 * The error handling system supports multiple error types:
 * - SyntaxError: Issues with OpenSCAD syntax (missing semicolons, brackets, etc.)
 * - TypeError: Type mismatches and invalid type operations
 * - ValidationError: Semantic validation failures
 * - ReferenceError: Undefined variables or functions
 * - InternalError: Parser implementation issues
 *
 * @example Basic error handling setup
 * ```typescript
 * import { ErrorHandler, Severity } from './error-handler';
 *
 * const errorHandler = new ErrorHandler({
 *   throwErrors: false,        // Collect errors instead of throwing
 *   minSeverity: Severity.WARNING,  // Include warnings and above
 *   attemptRecovery: true,     // Try to recover from errors
 *   includeSource: true        // Include source context in errors
 * });
 *
 * // Use throughout parsing
 * const parser = new EnhancedOpenscadParser(errorHandler);
 * ```
 *
 * @module openscad-parser/error-handling/error-handler
 * @since 0.1.0
 */

import {
  ParserError,
  SyntaxError,
  TypeError,
  ValidationError,
  ReferenceError,
  InternalError,
  Severity,
  ErrorCode,
  type ErrorContext
} from './types/error-types.js';
import { Logger, type LoggerOptions } from './logger.js';
import { RecoveryStrategyRegistry } from './recovery-strategy-registry.js';

/** Configuration options for the ErrorHandler */
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
 * Central error error-handling for managing errors and recovery in the OpenSCAD parser.
 *
 * The ErrorHandler provides:
 * - Error collection and reporting
 * - Error recovery using registered strategies
 * - Configurable error handling behavior
 * - Integration with logging system
 *
 * @example
 * ```typescript
 * const errorHandler = new ErrorHandler({
 *   throwErrors: false,
 *   minSeverity: Severity.WARNING,
 *   attemptRecovery: true
 * });
 *
 * // Create and report an error
 * const error = errorHandler.createSyntaxError('Missing semicolon', {
 *   line: 10,
 *   column: 5
 * });
 *
 * // Attempt recovery
 * const recoveredCode = errorHandler.attemptRecovery(error, originalCode);
 * ```
 */
export class ErrorHandler {
  private errors: ParserError[] = [];
  private recoveryRegistry: RecoveryStrategyRegistry;
  private logger: Logger;

  /** Configuration options for the error error-handling */
  public readonly options: Required<ErrorHandlerOptions>;

  /**
   * Creates a new ErrorHandler
   * @param options - Configuration options
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
   * Creates a generic parser error
   * @param message - Error message
   * @param context - Error context
   * @returns New ParserError instance
   */
  createParserError(message: string, context: ErrorContext = {}): ParserError {
    return new ParserError(message, ErrorCode.INTERNAL_ERROR, Severity.ERROR, context);
  }

  /**
   * Creates a syntax error
   * @param message - Error message
   * @param context - Error context
   * @returns New SyntaxError instance
   */
  createSyntaxError(message: string, context: ErrorContext = {}): SyntaxError {
    return new SyntaxError(message, context);
  }

  /**
   * Creates a type error
   * @param message - Error message
   * @param context - Error context
   * @returns New TypeError instance
   */
  createTypeError(message: string, context: ErrorContext = {}): TypeError {
    return new TypeError(message, context);
  }

  /**
   * Creates a validation error
   * @param message - Error message
   * @param context - Error context
   * @returns New ValidationError instance
   */
  createValidationError(message: string, context: ErrorContext = {}): ValidationError {
    return new ValidationError(message, context);
  }

  /**
   * Creates a reference error
   * @param message - Error message
   * @param context - Error context
   * @returns New ReferenceError instance
   */
  createReferenceError(message: string, context: ErrorContext = {}): ReferenceError {
    return new ReferenceError(message, context);
  }

  /**
   * Creates an internal error
   * @param message - Error message
   * @param context - Error context
   * @returns New InternalError instance
   */
  createInternalError(message: string, context: ErrorContext = {}): InternalError {
    return new InternalError(message, context);
  }

  /**
   * Reports an error to the error-handling
   * @param error - The error to report
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
   * Attempts to recover from an error using registered strategies
   * @param error - The error to recover from
   * @param code - The original source code
   * @returns The recovered code if successful, null otherwise
   */
  attemptRecovery(error: ParserError, code: string): string | null {
    if (!this.options.attemptRecovery) {
      return null;
    }

    this.logger.debug(`Attempting recovery for error: ${error.message}`);

    const recoveredCode = this.recoveryRegistry.attemptRecovery(error, code);

    if (recoveredCode) {
      this.logger.info(`Successfully recovered from error: ${error.message}`);
    } else {
      this.logger.debug(`Could not recover from error: ${error.message}`);
    }

    return recoveredCode;
  }

  /**
   * Gets all collected errors
   * @returns Array of collected errors
   */
  getErrors(): readonly ParserError[] {
    return [...this.errors];
  }

  /**
   * Gets errors filtered by severity level
   * @param minSeverity - Minimum severity level to include
   * @returns Array of filtered errors
   */
  getErrorsBySeverity(minSeverity: Severity): ParserError[] {
    const minLevel = this.getSeverityLevel(minSeverity);
    return this.errors.filter(error => this.getSeverityLevel(error.severity) >= minLevel);
  }

  /**
   * Clears all collected errors
   */
  clearErrors(): void {
    this.errors = [];
  }

  /**
   * Checks if there are any errors
   * @returns True if there are collected errors
   */
  hasErrors(): boolean {
    return this.errors.length > 0;
  }

  /**
   * Checks if there are any critical errors
   * @returns True if there are critical errors
   */
  hasCriticalErrors(): boolean {
    return this.errors.some(error => this.isCriticalError(error));
  }

  /**
   * Gets the recovery strategy registry
   * @returns The recovery strategy registry
   */
  getRecoveryRegistry(): RecoveryStrategyRegistry {
    return this.recoveryRegistry;
  }

  /**
   * Gets the logger instance
   * @returns The logger instance
   */
  getLogger(): Logger {
    return this.logger;
  }

  /**
   * Logs an info message
   * @param message - The message to log
   * @param context - Optional context information
   * @param node - Optional tree-sitter node for additional context
   */
  logInfo(message: string, _context?: string, _node?: any): void {
    this.logger.info(message);
  }

  /**
   * Logs a debug message
   * @param message - The message to log
   * @param context - Optional context information
   * @param node - Optional tree-sitter node for additional context
   */
  logDebug(message: string, _context?: string, _node?: any): void {
    this.logger.debug(message);
  }

  /**
   * Logs a warning message with optional context information.
   * 
   * Warning messages indicate potential issues that might not prevent parsing but
   * could lead to unexpected behavior or AST structure. These warnings are useful for
   * diagnostic purposes and can help identify problematic code patterns.
   * 
   * @param message - The warning message to log
   * @param context - Optional context information (e.g., method name, phase)
   * @param node - Optional tree-sitter node for additional context such as location
   * 
   * @example
   * ```typescript
   * // Log a simple warning
   * errorHandler.logWarning('Deprecated syntax detected');
   * 
   * // Log a warning with context
   * errorHandler.logWarning('Missing parentheses in expression', 'visitExpression');
   * 
   * // Log a warning with both context and node information
   * errorHandler.logWarning(
   *   'Ambiguous operator precedence', 
   *   'ExpressionVisitor.visitBinaryExpression',
   *   node
   * );
   * ```
   * 
   * @since 0.1.0
   */
  logWarning(message: string, _context?: string, _node?: any): void {
    this.logger.warn(message);
  }

  /**
   * Logs an error message with optional context information.
   * 
   * Error messages indicate significant issues that may prevent successful parsing or
   * result in an incomplete/incorrect AST. These errors are critical for understanding
   * parsing failures and should provide clear information about what went wrong and where.
   * 
   * This method should be used instead of console.log/error throughout the parser codebase
   * to ensure consistent error handling and logging.
   * 
   * @param message - The error message to log
   * @param context - Optional context information (e.g., method name, component)
   * @param node - Optional tree-sitter node for additional context such as location
   * 
   * @example
   * ```typescript
   * // Log a simple error
   * errorHandler.logError('Failed to parse expression');
   * 
   * // Log an error with context
   * errorHandler.logError('Invalid parameter type', 'ModuleVisitor.processCube');
   * 
   * // Log an error with both context and node information for location tracking
   * errorHandler.logError(
   *   'Unexpected token in module instantiation', 
   *   'CompositeVisitor.visitModuleInstantiation',
   *   node
   * );
   * ```
   * 
   * @since 0.1.0
   */
  logError(message: string, _context?: string, _node?: any): void {
    this.logger.error(message);
  }

  /**
   * Handles an error by logging it and optionally reporting it to the error collection system.
   * 
   * This method serves as the central error handling mechanism in the parser, providing
   * consistent error processing for both standard JavaScript errors and specialized
   * parser errors. It can optionally convert generic errors to parser-specific errors
   * and adds them to the error collection if appropriate.
   * 
   * The context parameter allows providing information about where the error occurred,
   * which is particularly useful for debugging complex parsing scenarios.
   * 
   * @param error - The error to handle (can be a standard Error or a ParserError)
   * @param context - Optional context information (e.g., class and method where error occurred)
   * @param node - Optional tree-sitter node for additional context such as location information
   * 
   * @example Standard Error
   * ```typescript
   * try {
   *   // Some parsing operation that might fail
   *   processNode(node);
   * } catch (err) {
   *   // Handle any generic error
   *   errorHandler.handleError(err, 'VisitorASTGenerator.generate', node);
   * }
   * ```
   * 
   * @example With Parser Error
   * ```typescript
   * // Creating and handling a specific parser error
   * const syntaxError = errorHandler.createSyntaxError(
   *   'Unexpected closing brace',
   *   { line: 42, column: 10 }
   * );
   * errorHandler.handleError(syntaxError, 'BlockVisitor.processBlock');
   * ```
   * 
   * @since 0.1.0
   */
  handleError(error: Error, context?: string, node?: any): void {
    const message = context ? `${context}: ${error.message}` : error.message;
    this.logger.error(message);
  }

  /**
   * Determines if an error should be collected based on severity
   * @param error - The error to check
   * @returns True if the error should be collected
   */
  private shouldCollectError(error: ParserError): boolean {
    return this.getSeverityLevel(error.severity) >= this.getSeverityLevel(this.options.minSeverity);
  }

  /**
   * Determines if an error is critical and should cause throwing
   * @param error - The error to check
   * @returns True if the error is critical
   */
  private isCriticalError(error: ParserError): boolean {
    return this.getSeverityLevel(error.severity) >= this.getSeverityLevel(Severity.ERROR);
  }

  /**
   * Gets the numeric level for a severity
   * @param severity - The severity to get level for
   * @returns Numeric level for comparison
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
