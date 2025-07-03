/**
 * @file Simple error handler implementation for OpenSCAD parser
 *
 * This module provides a lightweight, minimal implementation of the error handling system
 * that satisfies the interface requirements expected by the parser visitors while avoiding
 * the complex dependencies and overhead of the full-featured error handling system.
 *
 * The SimpleErrorHandler is designed for:
 * - **Testing Environments**: Lightweight error handling for unit tests and integration tests
 * - **Minimal Deployments**: Simple applications that don't need advanced error recovery
 * - **Development Prototyping**: Quick setup for parser development and experimentation
 * - **Performance-Critical Scenarios**: Minimal overhead error handling for high-performance parsing
 *
 * Key features:
 * - **Lightweight Design**: Minimal memory footprint and processing overhead
 * - **Console Integration**: Direct console output for immediate feedback during development
 * - **Message Collection**: Stores all messages for programmatic access and testing
 * - **Type Safety**: Full TypeScript support with proper error type handling
 * - **Interface Compatibility**: Drop-in replacement for the full ErrorHandler
 * - **Clear Separation**: Distinguishes between info, warning, and error messages
 *
 * The simple error handler provides:
 * - **Information Logging**: Non-critical informational messages
 * - **Warning Handling**: Recoverable issues that don't stop processing
 * - **Error Management**: Critical errors that may halt processing
 * - **Message Retrieval**: Access to collected messages for analysis
 * - **State Management**: Clear and reset functionality for reuse
 *
 * @example Basic usage in tests
 * ```typescript
 * import { SimpleErrorHandler } from './simple-error-handler';
 *
 * const errorHandler = new SimpleErrorHandler();
 *
 * // Use with parser
 * const visitor = new PrimitiveVisitor(sourceCode, errorHandler);
 * const result = visitor.visitNode(node);
 *
 * // Check for issues
 * if (errorHandler.hasErrors()) {
 *   console.log('Errors:', errorHandler.getErrors());
 * }
 * ```
 *
 * @example Development workflow
 * ```typescript
 * const errorHandler = new SimpleErrorHandler();
 *
 * // Process multiple files
 * for (const file of files) {
 *   errorHandler.clear(); // Reset for each file
 *
 *   const parser = new OpenSCADParser(errorHandler);
 *   const result = parser.parse(file);
 *
 *   // Report issues for this file
 *   if (errorHandler.hasWarnings()) {
 *     console.log(`Warnings in ${file}:`, errorHandler.getWarnings());
 *   }
 * }
 * ```
 *
 * @example Testing integration
 * ```typescript
 * describe('Parser Error Handling', () => {
 *   let errorHandler: SimpleErrorHandler;
 *
 *   beforeEach(() => {
 *     errorHandler = new SimpleErrorHandler();
 *   });
 *
 *   it('should handle malformed syntax', () => {
 *     const parser = new OpenSCADParser(errorHandler);
 *     parser.parse('cube('); // Malformed
 *
 *     expect(errorHandler.hasErrors()).toBe(true);
 *     expect(errorHandler.getErrors()).toContain('Syntax error');
 *   });
 * });
 * ```
 *
 * @module simple-error-handler
 * @since 0.1.0
 */

/**
 * Simple error handler interface defining the minimal contract for error handling.
 *
 * This interface provides the essential methods needed by parser visitors and other
 * components for logging and error reporting. It's designed to be lightweight while
 * maintaining compatibility with the full error handling system.
 *
 * @interface IErrorHandler
 * @since 0.1.0
 */
export interface IErrorHandler {
  /**
   * Log an informational message.
   *
   * @param message - The informational message to log
   */
  logInfo(message: string): void;

  /**
   * Log a warning message.
   *
   * @param message - The warning message to log
   */
  logWarning(message: string): void;

  /**
   * Handle an error condition.
   *
   * @param error - The error to handle (Error object or string message)
   */
  handleError(error: Error | string): void;
}

/**
 * Simple error handler implementation providing lightweight error management.
 *
 * This class provides basic error handling functionality without the complex dependencies
 * of the full error handling system. It's designed to be a drop-in replacement that
 * satisfies the interface requirements while maintaining minimal overhead.
 *
 * The implementation features:
 * - **Message Storage**: Collects all messages in memory for programmatic access
 * - **Console Output**: Immediate console logging for development feedback
 * - **Type Distinction**: Separate handling for info, warning, and error messages
 * - **State Management**: Methods to clear state and check for specific message types
 * - **Thread Safety**: Simple synchronous implementation suitable for single-threaded use
 *
 * Memory management:
 * - Messages are stored in arrays and can grow unbounded
 * - Use `clear()` method periodically to prevent memory leaks in long-running processes
 * - Each message type is stored separately for efficient filtering
 *
 * @class SimpleErrorHandler
 * @implements {IErrorHandler}
 * @since 0.1.0
 */
export class SimpleErrorHandler implements IErrorHandler {
  /** Array of collected error messages */
  private errors: string[] = [];

  /** Array of collected warning messages */
  private warnings: string[] = [];

  /** Array of collected informational messages */
  private infos: string[] = [];

  /**
   * Log an informational message.
   *
   * Informational messages are used for non-critical status updates, debugging
   * information, and progress reporting. They don't indicate problems but provide
   * useful context about the parsing process.
   *
   * @param message - The informational message to log
   *
   * @example Logging parser progress
   * ```typescript
   * const handler = new SimpleErrorHandler();
   * handler.logInfo('Starting AST generation for cube primitive');
   * handler.logInfo('Successfully processed 15 nodes');
   * ```
   */
  logInfo(message: string): void {
    this.infos.push(message);
    console.info(`[INFO] ${message}`);
  }

  /**
   * Log a warning message.
   *
   * Warning messages indicate recoverable issues that don't prevent processing
   * from continuing but may result in unexpected behavior or suboptimal output.
   *
   * @param message - The warning message to log
   *
   * @example Logging recoverable issues
   * ```typescript
   * const handler = new SimpleErrorHandler();
   * handler.logWarning('Missing semicolon detected, attempting recovery');
   * handler.logWarning('Unknown parameter "color" ignored in cube()');
   * ```
   */
  logWarning(message: string): void {
    this.warnings.push(message);
    console.warn(`[WARNING] ${message}`);
  }

  /**
   * Handle an error condition.
   *
   * Error handling for critical issues that may prevent successful parsing or
   * result in invalid AST generation. Accepts both Error objects and string
   * messages for flexibility.
   *
   * @param error - The error to handle (Error object or string message)
   *
   * @example Handling different error types
   * ```typescript
   * const handler = new SimpleErrorHandler();
   *
   * // Handle Error objects
   * try {
   *   parser.parse(malformedCode);
   * } catch (error) {
   *   handler.handleError(error);
   * }
   *
   * // Handle string messages
   * handler.handleError('Unexpected token at line 5');
   * ```
   */
  handleError(error: Error | string): void {
    const errorMessage = error instanceof Error ? error.message : error;
    this.errors.push(errorMessage);
    console.error(`[ERROR] ${errorMessage}`);
  }

  /**
   * Get all collected error messages.
   *
   * Returns a copy of the error messages array to prevent external modification
   * of the internal state. Useful for testing, reporting, and post-processing.
   *
   * @returns A copy of all collected error messages
   *
   * @example Retrieving and processing errors
   * ```typescript
   * const handler = new SimpleErrorHandler();
   * // ... parsing operations that may generate errors
   *
   * const errors = handler.getErrors();
   * if (errors.length > 0) {
   *   console.log(`Found ${errors.length} errors:`);
   *   errors.forEach((error, index) => {
   *     console.log(`  ${index + 1}. ${error}`);
   *   });
   * }
   * ```
   */
  getErrors(): string[] {
    return [...this.errors];
  }

  /**
   * Get all collected warning messages.
   *
   * Returns a copy of the warning messages array to prevent external modification
   * of the internal state. Warnings indicate recoverable issues that don't stop processing.
   *
   * @returns A copy of all collected warning messages
   *
   * @example Processing warnings for reporting
   * ```typescript
   * const handler = new SimpleErrorHandler();
   * // ... parsing operations
   *
   * const warnings = handler.getWarnings();
   * if (warnings.length > 0) {
   *   console.log('Warnings encountered:');
   *   warnings.forEach(warning => console.log(`  - ${warning}`));
   * }
   * ```
   */
  getWarnings(): string[] {
    return [...this.warnings];
  }

  /**
   * Get all collected informational messages.
   *
   * Returns a copy of the informational messages array. Info messages provide
   * context about the parsing process and are useful for debugging and monitoring.
   *
   * @returns A copy of all collected informational messages
   *
   * @example Accessing info messages for debugging
   * ```typescript
   * const handler = new SimpleErrorHandler();
   * // ... parsing operations with info logging
   *
   * const infos = handler.getInfos();
   * console.log(`Processing completed with ${infos.length} info messages`);
   * ```
   */
  getInfos(): string[] {
    return [...this.infos];
  }

  /**
   * Clear all collected messages.
   *
   * Resets the error handler state by clearing all stored messages. Useful for
   * reusing the same handler instance across multiple parsing operations or
   * preventing memory leaks in long-running processes.
   *
   * @example Reusing handler across multiple files
   * ```typescript
   * const handler = new SimpleErrorHandler();
   *
   * for (const file of files) {
   *   handler.clear(); // Reset state for each file
   *
   *   const parser = new OpenSCADParser(handler);
   *   parser.parseFile(file);
   *
   *   // Process messages for this file
   *   if (handler.hasErrors()) {
   *     console.log(`Errors in ${file}:`, handler.getErrors());
   *   }
   * }
   * ```
   */
  clear(): void {
    this.errors = [];
    this.warnings = [];
    this.infos = [];
  }

  /**
   * Check if there are any collected error messages.
   *
   * Convenient method to quickly determine if any errors occurred during processing
   * without needing to retrieve and check the length of the errors array.
   *
   * @returns True if there are any error messages, false otherwise
   *
   * @example Quick error checking
   * ```typescript
   * const handler = new SimpleErrorHandler();
   * const parser = new OpenSCADParser(handler);
   *
   * parser.parse(sourceCode);
   *
   * if (handler.hasErrors()) {
   *   console.error('Parsing failed with errors');
   *   return null;
   * }
   *
   * return parser.getAST();
   * ```
   */
  hasErrors(): boolean {
    return this.errors.length > 0;
  }

  /**
   * Check if there are any collected warning messages.
   *
   * Convenient method to quickly determine if any warnings occurred during processing.
   * Warnings don't prevent successful parsing but may indicate issues worth addressing.
   *
   * @returns True if there are any warning messages, false otherwise
   *
   * @example Warning-aware processing
   * ```typescript
   * const handler = new SimpleErrorHandler();
   * const result = parser.parse(sourceCode);
   *
   * if (handler.hasWarnings()) {
   *   console.warn('Parsing completed with warnings');
   *   handler.getWarnings().forEach(warning => console.warn(warning));
   * }
   *
   * return result;
   * ```
   */
  hasWarnings(): boolean {
    return this.warnings.length > 0;
  }
}
