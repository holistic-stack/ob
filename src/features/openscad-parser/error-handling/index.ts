/**
 * @file Comprehensive error handling system for OpenSCAD parser
 *
 * This module provides a complete error handling infrastructure for the OpenSCAD
 * parser, including error detection, classification, recovery strategies, and
 * comprehensive logging capabilities. The error handling system is designed to
 * provide graceful degradation, automatic error recovery, and detailed diagnostic
 * information for both development and production environments.
 *
 * The error handling system includes:
 * - **Error Classification**: Structured error types with detailed context information
 * - **Recovery Strategies**: Automatic error recovery using the Chain of Responsibility pattern
 * - **Logging Infrastructure**: Configurable logging with severity levels and output control
 * - **Error Context**: Detailed source location and context preservation
 * - **Performance Monitoring**: Error statistics and performance metrics
 * - **Development Support**: Rich debugging information and diagnostic capabilities
 *
 * Key components:
 * - **ErrorHandler**: Central error management with configurable recovery strategies
 * - **Logger**: Structured logging system with severity-based filtering
 * - **RecoveryStrategyRegistry**: Automatic error recovery using registered strategies
 * - **Error Types**: Comprehensive error classification and context information
 * - **Recovery Strategies**: Specific strategies for common OpenSCAD syntax errors
 *
 * Error handling features:
 * - **Automatic Recovery**: Attempts to fix common syntax errors automatically
 * - **Graceful Degradation**: Continues parsing when possible despite errors
 * - **Detailed Diagnostics**: Provides comprehensive error context and suggestions
 * - **Performance Optimization**: Efficient error handling with minimal overhead
 * - **Configurable Behavior**: Customizable error handling strategies and logging
 * - **IDE Integration**: Error information suitable for IDE error reporting
 *
 * Supported error categories:
 * - **Syntax Errors**: Missing semicolons, unclosed brackets, malformed expressions
 * - **Semantic Errors**: Unknown identifiers, type mismatches, invalid operations
 * - **Parser Errors**: Tree-sitter parsing failures and CST processing errors
 * - **Recovery Errors**: Errors encountered during automatic error recovery
 * - **System Errors**: Internal parser errors and unexpected conditions
 *
 * @example Basic error handling setup
 * ```typescript
 * import { ErrorHandler, Logger, RecoveryStrategyRegistry } from './error-handling';
 *
 * // Create error handling infrastructure
 * const logger = new Logger({ level: 'INFO', includeTimestamp: true });
 * const recoveryRegistry = new RecoveryStrategyRegistry();
 * const errorHandler = new ErrorHandler({ logger, recoveryRegistry });
 *
 * // Use with parser
 * const parser = new OpenSCADParser(sourceCode, errorHandler);
 * const ast = await parser.generateAST();
 *
 * // Check for errors
 * const errors = errorHandler.getErrors();
 * if (errors.length > 0) {
 *   console.log('Parsing errors:', errors);
 * }
 * ```
 *
 * @example Advanced error recovery configuration
 * ```typescript
 * import {
 *   ErrorHandler,
 *   RecoveryStrategyRegistry,
 *   MissingSemicolonStrategy,
 *   UnclosedBracketStrategy,
 *   UnknownIdentifierStrategy
 * } from './error-handling';
 *
 * // Configure custom recovery strategies
 * const recoveryRegistry = new RecoveryStrategyRegistry();
 * recoveryRegistry.register(new MissingSemicolonStrategy());
 * recoveryRegistry.register(new UnclosedBracketStrategy());
 * recoveryRegistry.register(new UnknownIdentifierStrategy());
 *
 * // Create error handler with custom configuration
 * const errorHandler = new ErrorHandler({
 *   enableRecovery: true,
 *   maxRecoveryAttempts: 3,
 *   recoveryRegistry,
 *   logger: new Logger({ level: 'DEBUG' })
 * });
 * ```
 *
 * @example Production error handling
 * ```typescript
 * import { ErrorHandler, Logger } from './error-handling';
 *
 * // Configure for production environment
 * const productionLogger = new Logger({
 *   level: 'WARNING',
 *   includeTimestamp: true,
 *   includeSeverity: false,
 *   output: (message) => {
 *     // Send to external logging service
 *     ExternalLoggingService.send(message);
 *   }
 * });
 *
 * const errorHandler = new ErrorHandler({
 *   enableRecovery: true,
 *   logger: productionLogger,
 *   onError: (error) => {
 *     // Custom error handling for production
 *     ProductionErrorReporter.report(error);
 *   }
 * });
 * ```
 *
 * @module error-handling
 * @since 0.1.0
 */

// Export error types
export * from './types/error-types.js';

// Export core error handling classes
export { ErrorHandler, type ErrorHandlerOptions } from './error-handler.js';
export { Logger, type LoggerOptions } from './logger.js';
export { RecoveryStrategyRegistry } from './recovery-strategy-registry.js';

// Export recovery strategies
export * from './strategies/recovery-strategy.js';
export * from './strategies/missing-semicolon-strategy.js';
export * from './strategies/unclosed-bracket-strategy.js';
export * from './strategies/unknown-identifier-strategy.js';
// Note: type-mismatch-strategy not exported by default due to TypeChecker dependency
