/**
 * @file simple-error-handler.ts
 * @description This file provides a lightweight, minimal implementation of the error handling system
 * that satisfies the interface requirements expected by the parser visitors while avoiding
 * the complex dependencies and overhead of the full-featured error handling system.
 *
 * @architectural_decision
 * The `SimpleErrorHandler` is designed as a lightweight alternative to the full `ErrorHandler`.
 * It is intended for use in scenarios where advanced error recovery and complex logging are not
 * required, such as in unit tests or in performance-critical sections of the code. This class
 * provides a minimal implementation of the `IErrorHandler` interface, ensuring that it can be
 * used as a drop-in replacement for the full `ErrorHandler` without breaking the parser's
 * visitor pattern.
 *
 * @example
 * ```typescript
 * import { SimpleErrorHandler } from './simple-error-handler';
 *
 * // 1. Create a new simple error handler instance
 * const errorHandler = new SimpleErrorHandler();
 *
 * // 2. Use the error handler to log messages
 * errorHandler.logInfo('Parsing started.');
 * errorHandler.logWarning('Using a deprecated feature.');
 * errorHandler.handleError(new Error('An unexpected error occurred.'));
 *
 * // 3. Retrieve the collected messages
 * console.log('Infos:', errorHandler.getInfos());
 * console.log('Warnings:', errorHandler.getWarnings());
 * console.log('Errors:', errorHandler.getErrors());
 * ```
 *
 * @integration
 * The `SimpleErrorHandler` can be passed to the `OpenscadParser` constructor in place of the
 * full `ErrorHandler`. This is useful for testing purposes, as it allows for easy inspection
 * of the errors, warnings, and info messages that are generated during parsing.
 */

/**
 * @interface IErrorHandler
 * @description Simple error handler interface defining the minimal contract for error handling.
 * This interface provides the essential methods needed by parser visitors and other
 * components for logging and error reporting.
 */
export interface IErrorHandler {
  /**
   * @method logInfo
   * @description Logs an informational message.
   * @param {string} message - The informational message to log.
   */
  logInfo(message: string): void;

  /**
   * @method logWarning
   * @description Logs a warning message.
   * @param {string} message - The warning message to log.
   */
  logWarning(message: string): void;

  /**
   * @method handleError
   * @description Handles an error condition.
   * @param {Error | string} error - The error to handle.
   */
  handleError(error: Error | string): void;
}

/**
 * @class SimpleErrorHandler
 * @implements {IErrorHandler}
 * @description Simple error handler implementation providing lightweight error management.
 */
export class SimpleErrorHandler implements IErrorHandler {
  /**
   * @property {string[]} errors
   * @description An array of collected error messages.
   * @private
   */
  private errors: string[] = [];

  /**
   * @property {string[]} warnings
   * @description An array of collected warning messages.
   * @private
   */
  private warnings: string[] = [];

  /**
   * @property {string[]} infos
   * @description An array of collected informational messages.
   * @private
   */
  private infos: string[] = [];

  /**
   * @method logInfo
   * @description Logs an informational message.
   * @param {string} message - The informational message to log.
   */
  logInfo(message: string): void {
    this.infos.push(message);
  }

  /**
   * @method logWarning
   * @description Logs a warning message.
   * @param {string} message - The warning message to log.
   */
  logWarning(message: string): void {
    this.warnings.push(message);
  }

  /**
   * @method handleError
   * @description Handles an error condition.
   * @param {Error | string} error - The error to handle.
   * @param {boolean} [suppressConsoleOutput=false] - Whether to suppress console output.
   */
  handleError(error: Error | string, suppressConsoleOutput = false): void {
    const errorMessage = error instanceof Error ? error.message : error;
    this.errors.push(errorMessage);

    if (!suppressConsoleOutput) {
      console.error(`[ERROR] ${errorMessage}`);
    }
  }

  /**
   * @method getErrors
   * @description Gets all collected error messages.
   * @returns {string[]} A copy of all collected error messages.
   */
  getErrors(): string[] {
    return [...this.errors];
  }

  /**
   * @method getWarnings
   * @description Gets all collected warning messages.
   * @returns {string[]} A copy of all collected warning messages.
   */
  getWarnings(): string[] {
    return [...this.warnings];
  }

  /**
   * @method getInfos
   * @description Gets all collected informational messages.
   * @returns {string[]} A copy of all collected informational messages.
   */
  getInfos(): string[] {
    return [...this.infos];
  }

  /**
   * @method clear
   * @description Clears all collected messages.
   */
  clear(): void {
    this.errors = [];
    this.warnings = [];
    this.infos = [];
  }

  /**
   * @method hasErrors
   * @description Checks if there are any collected error messages.
   * @returns {boolean} True if there are any error messages, false otherwise.
   */
  hasErrors(): boolean {
    return this.errors.length > 0;
  }

  /**
   * @method hasWarnings
   * @description Checks if there are any collected warning messages.
   * @returns {boolean} True if there are any warning messages, false otherwise.
   */
  hasWarnings(): boolean {
    return this.warnings.length > 0;
  }
}
