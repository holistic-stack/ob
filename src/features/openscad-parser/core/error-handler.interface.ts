/**
 * @file Error Handler Interface
 *
 * Interface definition for error handling in OpenSCAD parser.
 * Maintains compatibility with existing @holistic-stack/openscad-parser error handling.
 */

/**
 * Error handler interface for parser error collection and reporting
 */
export interface IErrorHandler {
  /**
   * Log an error message
   * @param message - Error message to log
   */
  logError(message: string): void;

  /**
   * Log a warning message
   * @param message - Warning message to log
   */
  logWarning(message: string): void;

  /**
   * Log an informational message
   * @param message - Info message to log
   */
  logInfo(message: string): void;

  /**
   * Get all collected errors
   * @returns Array of error messages
   */
  getErrors(): ReadonlyArray<string>;

  /**
   * Get all collected warnings
   * @returns Array of warning messages
   */
  getWarnings(): ReadonlyArray<string>;

  /**
   * Clear all collected errors and warnings
   */
  clear(): void;
}
