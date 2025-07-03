/**
 * @file Structured logging system for OpenSCAD parser error handling
 *
 * This module implements a comprehensive logging system designed specifically for the
 * OpenSCAD parser's error handling infrastructure. The Logger class provides structured,
 * configurable logging with severity-based filtering, customizable output formatting,
 * and runtime configuration management.
 *
 * The logging system supports:
 * - **Severity-Based Filtering**: DEBUG, INFO, WARNING, ERROR, and FATAL levels
 * - **Configurable Output**: Console, file, or custom output handlers
 * - **Message Formatting**: Timestamps, severity indicators, and custom formatting
 * - **Runtime Configuration**: Dynamic level changes and enable/disable controls
 * - **Performance Optimization**: Efficient filtering to minimize overhead
 * - **Development Support**: Rich debugging information and diagnostic capabilities
 *
 * Key features:
 * - **Hierarchical Severity Levels**: Numeric comparison for efficient filtering
 * - **Flexible Output Destinations**: Console, files, external services, or custom handlers
 * - **Timestamp Integration**: ISO format timestamps for precise event correlation
 * - **Master Enable/Disable**: Global logging control for production environments
 * - **Zero-Overhead Filtering**: Messages below threshold are filtered before formatting
 * - **Thread-Safe Design**: Safe for concurrent usage in multi-threaded environments
 *
 * Severity level hierarchy (lowest to highest):
 * - **DEBUG (0)**: Detailed diagnostic information for development
 * - **INFO (1)**: General operational information and status updates
 * - **WARNING (2)**: Potential issues that don't prevent operation
 * - **ERROR (3)**: Significant problems that impact functionality
 * - **FATAL (4)**: Critical errors that may cause application termination
 *
 * @example Basic logger setup
 * ```typescript
 * import { Logger, Severity } from './logger';
 *
 * // Create logger with default configuration
 * const logger = new Logger();
 *
 * // Log messages at different severity levels
 * logger.debug('Detailed diagnostic information');
 * logger.info('Parser initialization complete');
 * logger.warn('Deprecated syntax detected');
 * logger.error('Failed to parse expression');
 * logger.fatal('Critical system failure');
 * ```
 *
 * @example Production logger configuration
 * ```typescript
 * // Configure logger for production environment
 * const prodLogger = new Logger({
 *   level: Severity.WARNING,     // Only log warnings and above
 *   includeTimestamp: true,      // Include timestamps for correlation
 *   includeSeverity: false,      // Omit severity to reduce message size
 *   output: (message) => {
 *     // Send to external logging service
 *     ExternalLoggingService.send(message);
 *   }
 * });
 * ```
 *
 * @example Development logger with debugging
 * ```typescript
 * // Configure logger for development with full verbosity
 * const devLogger = new Logger({
 *   level: Severity.DEBUG,       // Log everything including debug messages
 *   includeTimestamp: true,      // Include timestamps for debugging
 *   includeSeverity: true,       // Include severity for context
 *   output: (message) => {
 *     // Output to both console and debug file
 *     console.log(message);
 *     fs.appendFileSync('debug.log', message + '\n');
 *   }
 * });
 * ```
 *
 * @module logger
 * @since 0.1.0
 */

import { Severity } from './types/error-types.js';

/**
 * Configuration options for the Logger instance.
 * 
 * This interface allows for customization of various aspects of logging behavior,
 * including severity level filtering, message formatting, and output destination.
 * All properties are optional and have sensible defaults.
 * 
 * @example Basic Configuration
 * ```typescript
 * // Create a logger with WARNING level and standard console output
 * const options: LoggerOptions = {
 *   level: Severity.WARNING,
 *   includeTimestamp: true,
 *   includeSeverity: true
 * };
 * const logger = new Logger(options);
 * ```
 * 
 * @example Custom Output Handler
 * ```typescript
 * // Create a logger that outputs to a custom handler instead of console
 * const options: LoggerOptions = {
 *   level: Severity.INFO,
 *   output: (message) => {
 *     // Send to a file, remote logging service, or custom handler
 *     FileSystem.appendToLogFile('app.log', message);
 *   }
 * };
 * const logger = new Logger(options);
 * ```
 * 
 * @since 0.1.0
 */
export interface LoggerOptions {
  /** 
   * Minimum severity level to log. Messages with lower severity are filtered out.
   * Defaults to Severity.INFO if not specified.
   */
  level?: Severity;
  
  /** 
   * Whether to include ISO timestamps in log messages (e.g., [2023-05-29T15:30:45.123Z]).
   * Defaults to true if not specified.
   */
  includeTimestamp?: boolean;
  
  /** 
   * Whether to include severity level indicator in log messages (e.g., [ERROR]).
   * Defaults to true if not specified.
   */
  includeSeverity?: boolean;
  
  /** 
   * Custom output function for log messages. Receives the formatted message string.
   * Defaults to console.log if not specified.
   */
  output?: (message: string) => void;
  
  /** 
   * Whether logging is enabled. Can be toggled at runtime using setEnabled().
   * Useful for disabling logs in production or during tests.
   * Defaults to true if not specified.
   */
  enabled?: boolean;
}

/** Severity level numeric values for comparison */
const SEVERITY_LEVELS: Record<Severity, number> = {
  [Severity.DEBUG]: 0,
  [Severity.INFO]: 1,
  [Severity.WARNING]: 2,
  [Severity.ERROR]: 3,
  [Severity.FATAL]: 4,
};

/**
 * Logger class for structured logging with configurable severity levels.
 *
 * @example
 * ```typescript
 * const logger = new Logger({ level: Severity.WARNING });
 * logger.debug('This will not be logged');
 * logger.warn('This will be logged');
 * logger.error('This will be logged');
 * ```
 */
export class Logger {
  private options: Required<LoggerOptions>;

  /**
   * Creates a new Logger instance with the specified configuration options.
   * 
   * The constructor sets up a new logger with either the provided options or default values.
   * Default configuration uses INFO level, includes timestamps and severity indicators,
   * outputs to console.log, and is enabled.
   * 
   * @param options - Configuration options for the logger
   * 
   * @example Default Logger
   * ```typescript
   * // Create a logger with default options
   * const logger = new Logger();
   * // Equivalent to:
   * // new Logger({
   * //   level: Severity.INFO,
   * //   includeTimestamp: true,
   * //   includeSeverity: true,
   * //   output: console.log,
   * //   enabled: true
   * // })
   * ```
   * 
   * @example Custom Logger
   * ```typescript
   * // Create a logger for production use with minimal output
   * const prodLogger = new Logger({
   *   level: Severity.ERROR,  // Only log errors and fatal issues
   *   includeTimestamp: true, // Include timestamps for correlation
   *   includeSeverity: false, // Omit severity to reduce message size
   *   output: (msg) => {
   *     // Send to external logging service
   *     ExternalLoggingService.log(msg);
   *   }
   * });
   * ```
   * 
   * @since 0.1.0
   */
  constructor(options: LoggerOptions = {}) {
    this.options = {
      level: options.level ?? Severity.INFO,
      includeTimestamp: options.includeTimestamp ?? true,
      includeSeverity: options.includeSeverity ?? true,
      output: options.output ?? console.log,
      enabled: options.enabled ?? true,
    };
  }

  /**
   * Sets the minimum severity level for logging.
   * 
   * This method allows dynamically changing the logging threshold at runtime.
   * Only messages with a severity level equal to or higher than the specified level will be logged.
   * 
   * @param level - The minimum severity level to log
   * 
   * @example Increasing Verbosity for Debugging
   * ```typescript
   * // Normal operation uses INFO level
   * const logger = new Logger({ level: Severity.INFO });
   * 
   * // When debugging an issue, temporarily increase verbosity
   * logger.setLevel(Severity.DEBUG);
   * // Now debug messages will be logged
   * ```
   * 
   * @example Reducing Log Noise
   * ```typescript
   * // During high-load operations, reduce logging to only critical issues
   * function startBulkOperation() {
   *   const previousLevel = logger.getLevel();
   *   logger.setLevel(Severity.ERROR);
   *   
   *   // Perform operation...
   *   
   *   // Restore previous level when done
   *   logger.setLevel(previousLevel);
   * }
   * ```
   * 
   * @since 0.1.0
   */
  setLevel(level: Severity): void {
    this.options.level = level;
  }

  /**
   * Gets the current minimum severity level for logging.
   * 
   * This method returns the current severity threshold setting that determines
   * which messages are logged. It's useful for temporarily changing the log level
   * and then restoring it later.
   * 
   * @returns The current minimum severity level
   * 
   * @example Checking Current Level
   * ```typescript
   * // Check if we're in debug mode
   * if (logger.getLevel() === Severity.DEBUG) {
   *   // Perform additional diagnostic steps
   *   runDiagnostics();
   * }
   * ```
   * 
   * @example Save and Restore Level
   * ```typescript
   * // Save current level before changing it
   * const savedLevel = logger.getLevel();
   * 
   * try {
   *   // Temporarily change level for a specific operation
   *   logger.setLevel(Severity.ERROR);
   *   performSensitiveOperation();
   * } finally {
   *   // Restore original level when done
   *   logger.setLevel(savedLevel);
   * }
   * ```
   * 
   * @since 0.1.0
   */
  getLevel(): Severity {
    return this.options.level;
  }

  /**
   * Enables or disables all logging operations.
   * 
   * This method provides a master switch to turn logging on or off without changing
   * other logger settings. When disabled, all logging methods will silently return
   * without producing output, regardless of severity level.
   * 
   * @param enabled - Whether logging should be enabled (true) or disabled (false)
   * 
   * @example Disable During Tests
   * ```typescript
   * // Disable logging during automated tests
   * beforeEach(() => {
   *   logger.setEnabled(false);
   * });
   * 
   * afterEach(() => {
   *   logger.setEnabled(true);
   * });
   * ```
   * 
   * @example Conditional Logging
   * ```typescript
   * // Only enable logging in development environment
   * logger.setEnabled(process.env.NODE_ENV === 'development');
   * 
   * // These logs will only appear in development
   * logger.debug('Development-only debug info');
   * logger.info('Setup complete');
   * ```
   * 
   * @since 0.1.0
   */
  setEnabled(enabled: boolean): void {
    this.options.enabled = enabled;
  }

  /**
   * Checks if logging is currently enabled.
   * 
   * This method returns the current state of the logging system, allowing code to
   * check if logging is active before performing potentially expensive logging-related
   * operations.
   * 
   * @returns Whether logging is currently enabled
   * 
   * @example Skip Expensive Operations
   * ```typescript
   * // Skip expensive string formatting if logging is disabled
   * if (logger.isEnabled() && logger.getLevel() <= Severity.DEBUG) {
   *   const detailedReport = generateExpensiveDebugReport();
   *   logger.debug(`System state: ${detailedReport}`);
   * }
   * ```
   * 
   * @example Conditional Logger Factory
   * ```typescript
   * // Create a child logger that inherits enabled state
   * function createChildLogger(parentLogger, childName) {
   *   const childLogger = new Logger({
   *     level: parentLogger.getLevel(),
   *     enabled: parentLogger.isEnabled(),
   *     // Add child name prefix to all messages
   *     output: (msg) => parentLogger.log(`[${childName}] ${msg}`)
   *   });
   *   return childLogger;
   * }
   * ```
   * 
   * @since 0.1.0
   */
  isEnabled(): boolean {
    return this.options.enabled;
  }

  /**
   * Logs a message at the specified severity level.
   * 
   * This is the core logging method that all severity-specific methods (debug, info, warn, etc.)
   * delegate to. It checks if the message should be logged based on the current severity level,
   * formats the message with timestamp and severity indicators, and outputs it using the
   * configured output function.
   * 
   * @param level - The severity level of the message (DEBUG, INFO, WARNING, ERROR, FATAL)
   * @param message - The message text to log
   * 
   * @example Basic Usage
   * ```typescript
   * // Log a message with INFO severity
   * logger.log(Severity.INFO, 'Parser initialized successfully');
   * ```
   * 
   * @example With Different Severity Levels
   * ```typescript
   * // Different severity levels for different types of messages
   * logger.log(Severity.DEBUG, 'Entering parse method');
   * logger.log(Severity.WARNING, 'Deprecated syntax detected');
   * logger.log(Severity.ERROR, 'Failed to parse expression');
   * ```
   * 
   * @since 0.1.0
   */
  log(level: Severity, message: string): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const formattedMessage = this.formatMessage(level, message);
    this.options.output(formattedMessage);
  }

  /**
   * Logs a message at DEBUG severity level.
   * 
   * Debug messages provide detailed information useful during development and troubleshooting.
   * These messages are typically verbose and only logged when detailed diagnostics are needed.
   * By default, debug messages are not logged unless the severity level is explicitly set to DEBUG.
   * 
   * @param message - The debug message to log
   * 
   * @example Basic Usage
   * ```typescript
   * // Log a simple debug message
   * logger.debug('Entering parseExpression method');
   * ```
   * 
   * @example Structured Debug Information
   * ```typescript
   * // Log structured debug information with object details
   * const nodeDetails = { type: 'expression', position: { line: 10, column: 5 } };
   * logger.debug(`Processing node: ${JSON.stringify(nodeDetails)}`);
   * ```
   * 
   * @since 0.1.0
   */
  debug(message: string): void {
    this.log(Severity.DEBUG, message);
  }

  /**
   * Logs a message at INFO severity level.
   * 
   * Info messages provide general information about the application's operation.
   * These messages are useful for tracking normal program flow and significant events
   * that don't indicate problems. INFO is the default logging level.
   * 
   * @param message - The informational message to log
   * 
   * @example Basic Usage
   * ```typescript
   * // Log a simple information message
   * logger.info('Parser initialized successfully');
   * ```
   * 
   * @example Operation Status
   * ```typescript
   * // Log operational status with metrics
   * const stats = { parseTime: 125, nodeCount: 42 };
   * logger.info(`Completed parsing in ${stats.parseTime}ms with ${stats.nodeCount} nodes`);
   * ```
   * 
   * @since 0.1.0
   */
  info(message: string): void {
    this.log(Severity.INFO, message);
  }

  /**
   * Logs a message at WARNING severity level.
   * 
   * Warning messages indicate potential problems or deprecated features that don't
   * prevent the application from functioning but might lead to unexpected behavior.
   * Warnings should highlight issues that require attention but aren't critical errors.
   * 
   * @param message - The warning message to log
   * 
   * @example Basic Usage
   * ```typescript
   * // Log a simple warning message
   * logger.warn('Deprecated syntax used: assign with $');
   * ```
   * 
   * @example Warning with Context
   * ```typescript
   * // Log a warning with location information
   * const location = { file: 'model.scad', line: 42 };
   * logger.warn(`Potentially inefficient code pattern at ${location.file}:${location.line}`);
   * ```
   * 
   * @since 0.1.0
   */
  warn(message: string): void {
    this.log(Severity.WARNING, message);
  }

  /**
   * Logs a message at ERROR severity level.
   * 
   * Error messages indicate significant problems that prevented an operation from
   * completing successfully. Errors represent failures that impact functionality
   * but don't necessarily cause the entire application to terminate.
   * 
   * @param message - The error message to log
   * 
   * @example Basic Usage
   * ```typescript
   * // Log a simple error message
   * logger.error('Failed to parse expression');
   * ```
   * 
   * @example Error with Exception Details
   * ```typescript
   * // Log an error with exception details
   * try {
   *   // Some operation that might fail
   *   parseNode(complexNode);
   * } catch (e) {
   *   logger.error(`Parsing failed: ${e.message}`);
   * }
   * ```
   * 
   * @since 0.1.0
   */
  error(message: string): void {
    this.log(Severity.ERROR, message);
  }

  /**
   * Logs a message at FATAL severity level.
   * 
   * Fatal messages indicate critical errors that prevent the application from
   * continuing to function at all. These represent the most severe error conditions
   * and typically precede application termination or a catastrophic failure.
   * 
   * @param message - The fatal error message to log
   * 
   * @example Basic Usage
   * ```typescript
   * // Log a simple fatal error message
   * logger.fatal('Critical error: Unable to initialize parser');
   * ```
   * 
   * @example Fatal Error with System State
   * ```typescript
   * // Log a fatal error with system state information
   * const systemState = { memoryUsage: process.memoryUsage().heapUsed, uptime: process.uptime() };
   * logger.fatal(`Parser crashed: Out of memory. System state: ${JSON.stringify(systemState)}`);
   * ```
   * 
   * @since 0.1.0
   */
  fatal(message: string): void {
    this.log(Severity.FATAL, message);
  }

  /**
   * Determines if a message should be logged based on the current logger configuration.
   * 
   * This internal method implements the filtering logic that decides whether a message
   * should be logged based on two criteria:
   * 1. Whether logging is enabled at all
   * 2. Whether the message's severity level meets or exceeds the configured minimum level
   * 
   * The severity level comparison uses numeric values from the SEVERITY_LEVELS mapping,
   * where higher severity levels have higher numeric values.
   * 
   * @param level - The severity level of the message to check
   * @returns True if the message should be logged, false otherwise
   * 
   * @example Internal Implementation
   * ```typescript
   * // Used internally by the log method
   * log(level: Severity, message: string): void {
   *   if (!this.shouldLog(level)) {
   *     return; // Skip logging this message
   *   }
   *   // Continue with formatting and output...
   * }
   * ```
   * 
   * @example Severity Level Comparison
   * ```typescript
   * // With logger.level set to WARNING:
   * shouldLog(Severity.DEBUG)   // Returns false (DEBUG < WARNING)
   * shouldLog(Severity.INFO)    // Returns false (INFO < WARNING)
   * shouldLog(Severity.WARNING) // Returns true  (WARNING >= WARNING)
   * shouldLog(Severity.ERROR)   // Returns true  (ERROR > WARNING)
   * shouldLog(Severity.FATAL)   // Returns true  (FATAL > WARNING)
   * ```
   * 
   * @private
   * @since 0.1.0
   */
  private shouldLog(level: Severity): boolean {
    if (!this.options.enabled) {
      return false;
    }

    return SEVERITY_LEVELS[level] >= SEVERITY_LEVELS[this.options.level];
  }

  /**
   * Formats a log message with timestamp and severity level based on configuration options.
   * 
   * This method prepares log messages for output by adding contextual information such as
   * timestamps and severity level indicators. The specific formatting is controlled by
   * the logger's configuration options.
   * 
   * The formatted message structure follows this pattern:
   * ```
   * [timestamp] [severity] message
   * ```
   * 
   * Where timestamp and severity components are included based on the logger configuration.
   * 
   * @param level - The severity level of the message (DEBUG, INFO, WARNING, ERROR, FATAL)
   * @param message - The original message text to format
   * @returns The formatted message string ready for output
   * 
   * @example Standard Format
   * ```typescript
   * // With default options (includeTimestamp and includeSeverity both true)
   * // formatMessage(Severity.ERROR, 'Parse failed')
   * // Returns: "[2023-05-29T15:30:45.123Z] [ERROR] Parse failed"
   * ```
   * 
   * @example Custom Format
   * ```typescript
   * // With includeTimestamp=false and includeSeverity=true
   * // formatMessage(Severity.WARNING, 'Deprecated syntax')
   * // Returns: "[WARNING] Deprecated syntax"
   * ```
   * 
   * @since 0.1.0
   */
  private formatMessage(level: Severity, message: string): string {
    const parts: string[] = [];

    if (this.options.includeTimestamp) {
      const timestamp = new Date().toISOString();
      parts.push(`[${timestamp}]`);
    }

    if (this.options.includeSeverity) {
      parts.push(`[${level}]`);
    }

    parts.push(message);

    return parts.join(' ');
  }
}
