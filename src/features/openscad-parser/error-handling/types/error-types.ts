/**
 * @file Core error types and classification system for OpenSCAD parser
 *
 * This module defines a comprehensive error type system for the OpenSCAD parser,
 * providing structured error classification, detailed context information, and
 * type-safe error handling capabilities. The error system is designed to support
 * both development and production environments with rich diagnostic information
 * and programmatic error handling.
 *
 * The error type system includes:
 * - **Hierarchical Error Classification**: Structured error codes and categories
 * - **Severity-Based Filtering**: Multiple severity levels for different error types
 * - **Rich Context Information**: Detailed error context with source location and suggestions
 * - **Type-Safe Error Handling**: Strong typing for error detection and recovery
 * - **Serialization Support**: JSON-serializable error representations
 * - **Recovery Guidance**: Error classification for automatic recovery strategies
 *
 * Key components:
 * - **Severity Enum**: DEBUG, INFO, WARNING, ERROR, FATAL severity levels
 * - **ErrorCode Enum**: Structured error codes organized by category
 * - **ErrorContext Interface**: Rich context information for error diagnosis
 * - **ParserError Class**: Base error class with comprehensive error information
 * - **Specialized Error Classes**: Domain-specific error types for different error categories
 * - **Type Guards**: Utility functions for error type detection and classification
 *
 * Error classification features:
 * - **Syntax Errors (100-199)**: Missing semicolons, unclosed brackets, malformed syntax
 * - **Type Errors (200-299)**: Type mismatches, invalid operations, type validation failures
 * - **Reference Errors (300-399)**: Undefined variables, functions, and modules
 * - **Validation Errors (400-499)**: Invalid arguments, modifiers, and parameter validation
 * - **Internal Errors (900-999)**: Parser internal errors and unimplemented features
 *
 * Context information includes:
 * - **Source Location**: Line and column numbers with character length
 * - **Code Context**: Source code snippets around the error location
 * - **Diagnostic Information**: Expected vs. found tokens, node types, and suggestions
 * - **Recovery Guidance**: Suggested fixes and links to documentation
 * - **Operation Context**: Detailed information for binary operations and function calls
 *
 * @example Basic error creation and handling
 * ```typescript
 * import { ParserError, ErrorCode, Severity, SyntaxError } from './error-types';
 *
 * // Create a syntax error with context
 * const error = new SyntaxError('Missing semicolon', {
 *   line: 10,
 *   column: 25,
 *   source: 'cube(10)',
 *   suggestion: 'Add semicolon after statement',
 *   expected: [';'],
 *   found: 'EOF'
 * });
 *
 * // Handle error with type checking
 * if (isParserError(error)) {
 *   console.log(error.getFormattedMessage());
 *   console.log('Error code:', error.code);
 *   console.log('Severity:', error.severity);
 * }
 * ```
 *
 * @example Advanced error context and recovery
 * ```typescript
 * import { TypeError, ErrorCode, isRecoverable, isFatal } from './error-types';
 *
 * // Create type error with detailed context
 * const typeError = new TypeError('Type mismatch in binary operation', {
 *   line: 15,
 *   column: 10,
 *   operation: '+',
 *   leftType: 'string',
 *   rightType: 'number',
 *   leftValue: 'hello',
 *   rightValue: 42,
 *   suggestion: 'Convert operands to compatible types'
 * });
 *
 * // Check error recoverability
 * if (isRecoverable(typeError)) {
 *   console.log('Error can be recovered automatically');
 * } else if (isFatal(typeError)) {
 *   console.log('Fatal error - parsing must stop');
 * }
 * ```
 *
 * @example Error serialization and reporting
 * ```typescript
 * import { ParserError, InternalError } from './error-types';
 *
 * // Create internal error
 * const internalError = new InternalError('Unexpected parser state', {
 *   nodeType: 'module_instantiation',
 *   source: 'translate([1,0,0]) cube(5);'
 * });
 *
 * // Serialize for logging or transmission
 * const errorData = internalError.toJSON();
 * console.log('Serialized error:', JSON.stringify(errorData, null, 2));
 *
 * // Format for user display
 * console.log('Formatted message:', internalError.getFormattedMessage());
 * ```
 *
 * @module error-types
 * @since 0.1.0
 */

/** Severity levels for error reporting */
export enum Severity {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  FATAL = 'FATAL',
}

/** Error codes for different types of errors */
export enum ErrorCode {
  // Syntax errors (100-199)
  SYNTAX_ERROR = 'E100',
  UNEXPECTED_TOKEN = 'E101',
  MISSING_SEMICOLON = 'E102',
  UNCLOSED_BRACKET = 'E103',
  UNCLOSED_BRACE = 'E104',
  UNCLOSED_PAREN = 'E105',
  INVALID_CHARACTER = 'E106',
  MISSING_FUNCTION_NAME = 'E107',
  UNEXPECTED_EOF = 'E108',
  UNEXPECTED_NODE_TYPE_FOR_FUNCTION_CALL = 'E109',
  INVALID_ESCAPE_SEQUENCE = 'E110',

  // Type errors (200-299)
  TYPE_ERROR = 'E200',
  TYPE_MISMATCH = 'E201',
  INVALID_OPERATION = 'E202',
  INVALID_TYPE = 'E203',

  // Reference errors (300-399)
  REFERENCE_ERROR = 'E300',
  UNDEFINED_VARIABLE = 'E301',
  UNDEFINED_MODULE = 'E302',
  UNDEFINED_FUNCTION = 'E303',
  MISSING_MODULE_NAME = 'E304',

  // Validation errors (400-499)
  VALIDATION_ERROR = 'E400',
  INVALID_ARGUMENTS = 'E401',
  INVALID_MODIFIER = 'E402',
  INVALID_FUNCTION_CALL_ARGUMENT_TYPE = 'E209',
  RESERVED_KEYWORD_AS_EXPRESSION = 'E210', // Added: For keywords used incorrectly as expressions

  // AST Construction / Semantic Errors (500-599)
  LET_NO_ASSIGNMENTS_FOUND = 'E500',
  LET_ASSIGNMENT_PROCESSING_FAILED = 'E501',
  LET_ASSIGNMENT_VALUE_ERROR_PROPAGATED = 'E502',
  MISSING_LET_BODY = 'E503',
  LET_BODY_EXPRESSION_PARSE_FAILED = 'E504',
  LET_BODY_EXPRESSION_ERROR_PROPAGATED = 'E505',

  // Internal errors (900-999)
  INTERNAL_ERROR = 'E900',
  NOT_IMPLEMENTED = 'E901',
}

import { Node as TSNode } from 'web-tree-sitter';

/** Context information about where an error occurred */
export interface ErrorContext {
  /** The error code */
  code?: ErrorCode;
  /** The CST node where the error occurred */
  cstNode?: TSNode;
  /** 1-based line number where the error occurred */
  line?: number;
  /** 1-based column number where the error occurred */
  column?: number;
  /** Length of the error in characters */
  length?: number;
  /** Source code snippet around the error */
  source?: string;
  /** Type of the node where error occurred */
  nodeType?: string;
  /** Expected token/node types */
  expected?: string[];
  /** What was actually found */
  found?: string;
  /** Suggested fix */
  suggestion?: string;
  /** Link to documentation */
  helpUrl?: string;

  // Additional properties for type mismatch errors
  /** The value that caused the error */
  value?: any;
  /** Location information for the error */
  location?: { line: number; column: number };
  /** Operation that caused the error (for binary operations) */
  operation?: string;
  /** Type of the left operand (for binary operations) */
  leftType?: string;
  /** Type of the right operand (for binary operations) */
  rightType?: string;
  /** Value of the left operand (for binary operations) */
  leftValue?: any;
  /** Value of the right operand (for binary operations) */
  rightValue?: any;
  /** Function name (for function call errors) */
  functionName?: string;
  /** Parameter index (for function call errors) */
  paramIndex?: number;
  /** List of suggestions for unknown identifiers */
  suggestions?: string[];
}

/** Base class for all parser errors */
export class ParserError extends Error {
  /**
   * Creates a new ParserError
   * @param message - Human-readable error message
   * @param code - Error code for programmatic handling
   * @param severity - Severity level of the error
   * @param context - Additional context about the error
   */
  constructor(
    message: string,
    public readonly code: ErrorCode,
    public readonly severity: Severity = Severity.ERROR,
    public readonly context: ErrorContext = {}
  ) {
    super(message);
    this.name = this.constructor.name;

    // Maintains proper stack trace for where the error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Gets a formatted string representation of the error
   * @returns Formatted error message with context
   */
  getFormattedMessage(): string {
    const { line, column } = this.context;
    const location = line !== undefined && column !== undefined
      ? `[${line}:${column}]`
      : '';

    return `${this.severity} ${location} [${this.code}]: ${this.message}`;
  }

  /**
   * Creates a JSON-serializable representation of the error
   * @returns Plain object with error details
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      severity: this.severity,
      context: this.context,
      stack: this.stack,
    };
  }
}

// Specific error types
export class SyntaxError extends ParserError {
  constructor(message: string, context: ErrorContext = {}) {
    super(message, ErrorCode.SYNTAX_ERROR, Severity.ERROR, context);
  }
}

export class TypeError extends ParserError {
  constructor(message: string, context: ErrorContext = {}) {
    super(message, ErrorCode.TYPE_ERROR, Severity.ERROR, context);
  }
}

export class ValidationError extends ParserError {
  constructor(message: string, context: ErrorContext = {}) {
    super(message, ErrorCode.VALIDATION_ERROR, Severity.ERROR, context);
  }
}

export class ReferenceError extends ParserError {
  constructor(message: string, context: ErrorContext = {}) {
    super(message, ErrorCode.REFERENCE_ERROR, Severity.ERROR, context);
  }
}

export class InternalError extends ParserError {
  constructor(message: string, context: ErrorContext = {}) {
    super(message, ErrorCode.INTERNAL_ERROR, Severity.FATAL, {
      ...context,
      helpUrl: 'https://github.com/your-org/openscad-tree-sitter/issues',
    });
  }
}

/** Type guard to check if an error is a ParserError */
export function isParserError(error: unknown): error is ParserError {
  return error instanceof Error &&
         'code' in error &&
         'severity' in error &&
         'context' in error;
}

/** Type guard to check if an error is recoverable */
export function isRecoverable(error: ParserError): boolean {
  return error.severity < Severity.ERROR;
}

/** Type guard to check if an error is fatal */
export function isFatal(error: ParserError): boolean {
  return error.severity === Severity.FATAL;
}
