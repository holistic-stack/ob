/**
 * @file Simple Error Handler Implementation
 *
 * Simple implementation of IErrorHandler interface for collecting
 * and managing parser errors, warnings, and info messages.
 * Maintains API compatibility with @holistic-stack/openscad-parser.
 */

import { createLogger } from '../../../shared/services/logger.service.js';
import type { IErrorHandler } from './error-handler.interface.js';

const logger = createLogger('SimpleErrorHandler');

/**
 * Simple error handler implementation for parser error collection
 */
export class SimpleErrorHandler implements IErrorHandler {
  private readonly errors: string[] = [];
  private readonly warnings: string[] = [];
  private readonly infoMessages: string[] = [];

  /**
   * Log an error message
   * @param message - Error message to log
   */
  logError(message: string): void {
    this.errors.push(message);
    logger.error(message);
  }

  /**
   * Log a warning message
   * @param message - Warning message to log
   */
  logWarning(message: string): void {
    this.warnings.push(message);
    logger.warn(message);
  }

  /**
   * Log an informational message
   * @param message - Info message to log
   */
  logInfo(message: string): void {
    this.infoMessages.push(message);
    logger.debug(message);
  }

  /**
   * Get all collected errors
   * @returns Array of error messages
   */
  getErrors(): ReadonlyArray<string> {
    return Object.freeze([...this.errors]);
  }

  /**
   * Get all collected warnings
   * @returns Array of warning messages
   */
  getWarnings(): ReadonlyArray<string> {
    return Object.freeze([...this.warnings]);
  }

  /**
   * Get all collected info messages
   * @returns Array of info messages
   */
  getInfoMessages(): ReadonlyArray<string> {
    return Object.freeze([...this.infoMessages]);
  }

  /**
   * Clear all collected errors, warnings, and info messages
   */
  clear(): void {
    this.errors.length = 0;
    this.warnings.length = 0;
    this.infoMessages.length = 0;
    logger.debug('Error handler cleared');
  }

  /**
   * Get total count of all messages
   * @returns Total message count
   */
  getTotalMessageCount(): number {
    return this.errors.length + this.warnings.length + this.infoMessages.length;
  }

  /**
   * Check if there are any errors
   * @returns True if errors exist
   */
  hasErrors(): boolean {
    return this.errors.length > 0;
  }

  /**
   * Check if there are any warnings
   * @returns True if warnings exist
   */
  hasWarnings(): boolean {
    return this.warnings.length > 0;
  }
}
