/**
 * @file parser-error.ts
 * @description This file defines the base `ParserError` class, which serves as the foundation for all custom error types
 * within the OpenSCAD parser. It provides a standardized structure for error reporting, including source code position,
 * error codes, and suggestions for resolution.
 *
 * @architectural_decision
 * By extending the native `Error` class, `ParserError` maintains compatibility with standard JavaScript error handling
 * mechanisms while adding domain-specific properties crucial for a parser. The inclusion of `ErrorPosition` and
 * `ErrorSuggestion` interfaces ensures that error messages are not only informative but also actionable, guiding
 * developers to quickly identify and fix issues in their OpenSCAD code. The `captureStackTrace` ensures proper stack
 * trace reporting for debugging.
 *
 * @example
 * ```typescript
 * import { ParserError, type ErrorPosition, type ErrorSuggestion } from './parser-error';
 *
 * try {
 *   throw new ParserError(
 *     'Unexpected token',
 *     'SYNTAX_001',
 *     'cube(10',
 *     { line: 0, column: 8, offset: 8 },
 *     [{ message: 'Missing closing parenthesis', replacement: 'cube(10);' }]
 *   );
 * } catch (error) {
 *   if (error instanceof ParserError) {
 *     console.error('Parser Error:', error.message);
 *     console.error('Code:', error.code);
 *     console.error('Position:', error.getPositionString());
 *     console.error('Formatted Message:\n', error.getFormattedMessage());
 *   }
 * }
 * ```
 */

/**
 * @interface ErrorPosition
 * @description Defines the precise location of an error within the source code.
 *
 * @property {number} line - The 0-based line number where the error occurred.
 * @property {number} column - The 0-based column number within the line where the error occurred.
 * @property {number} offset - The 0-based character offset from the beginning of the file where the error occurred.
 */
export interface ErrorPosition {
  line: number;
  column: number;
  offset: number;
}

/**
 * @interface ErrorSuggestion
 * @description Provides a suggestion for how to resolve an error, optionally including a code replacement.
 *
 * @property {string} message - A human-readable message describing the suggestion.
 * @property {string} [replacement] - An optional string that can be used to automatically fix the error.
 */
export interface ErrorSuggestion {
  message: string;
  replacement?: string;
}

/**
 * @class ParserError
 * @description Base class for all errors encountered during the parsing process.
 * It extends the native `Error` class and adds properties for detailed error reporting.
 */
export class ParserError extends Error {
  /**
   * @property {string} code - A unique error code (e.g., 'SYNTAX_ERROR', 'UNDEFINED_VARIABLE').
   */
  public code: string;

  /**
   * @property {ErrorPosition | undefined} position - The exact location in the source code where the error occurred.
   */
  public position: ErrorPosition | undefined;

  /**
   * @property {string} source - The full source code string in which the error was found.
   */
  public source: string;

  /**
   * @property {ErrorSuggestion[]} suggestions - An array of suggestions to help the user fix the error.
   */
  public suggestions: ErrorSuggestion[];

  /**
   * @property {Record<string, unknown> | undefined} context - Additional arbitrary context data related to the error.
   */
  public context: Record<string, unknown> | undefined;

  /**
   * @property {Error | undefined} originalError - The underlying original error that caused this `ParserError`, if any.
   */
  public originalError: Error | undefined;

  /**
   * @constructor
   * @description Creates an instance of `ParserError`.
   *
   * @param {string} message - A human-readable description of the error.
   * @param {string} [code='PARSER_ERROR'] - The error code.
   * @param {string} [source=''] - The source code where the error occurred.
   * @param {ErrorPosition} [position] - The position of the error.
   * @param {ErrorSuggestion[]} [suggestions=[]] - An array of suggestions for fixing the error.
   * @param {Record<string, unknown>} [context] - Additional context for the error.
   * @param {Error} [originalError] - The original error that caused this `ParserError`.
   */
  constructor(
    message: string,
    code: string = 'PARSER_ERROR',
    source: string = '',
    position?: ErrorPosition,
    suggestions: ErrorSuggestion[] = [],
    context?: Record<string, unknown>,
    originalError?: Error
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.position = position;
    this.source = source;
    this.suggestions = suggestions;
    this.context = context;
    this.originalError = originalError;

    // Maintain proper stack trace in V8 (Node.js and Chrome)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    } else {
      this.stack = new Error(message).stack ?? '';
    }
  }

  /**
   * @method getSourceLine
   * @description Retrieves the specific line of source code where the error is located.
   *
   * @returns {string} The source code line, or an empty string if the position is invalid.
   */
  public getSourceLine(): string {
    const lines = this.source.split('\n');
    return lines[this.position?.line ?? 0] ?? '';
  }

  /**
   * @method getPositionString
   * @description Returns a human-readable string representation of the error's position.
   *
   * @returns {string} A string like "line X, column Y" or "unknown position".
   */
  public getPositionString(): string {
    return this.position
      ? `line ${this.position.line + 1}, column ${this.position.column + 1}`
      : 'unknown position';
  }

  /**
   * @method getFormattedMessage
   * @description Generates a comprehensive, multi-line error message including the source line,
   * a pointer to the exact error column, and any provided suggestions.
   *
   * @returns {string} A formatted string ready for display in logs or UI.
   */
  public getFormattedMessage(): string {
    const sourceLine = this.getSourceLine();
    const pointer = `${' '.repeat(this.position?.column ?? 0)}^`;

    let message = `${this.message}\n\n`;
    message += `${sourceLine}\n`;
    message += `${pointer}\n\n`;

    if (this.suggestions.length > 0) {
      message += 'Suggestions:\n';
      this.suggestions.forEach((suggestion, index) => {
        message += `${index + 1}. ${suggestion.message}\n`;
        if (suggestion.replacement) {
          message += `   Try: ${suggestion.replacement}\n`;
        }
      });
    }

    return message;
  }

  /**
   * @method fromTreeSitterPosition
   * @description Converts a Tree-sitter `Point` object into an `ErrorPosition` object.
   *
   * @param {{ row: number; column: number }} position - The Tree-sitter position object.
   * @returns {ErrorPosition} The converted error position.
   */
  public static fromTreeSitterPosition(position: { row: number; column: number }): ErrorPosition {
    return {
      line: position.row,
      column: position.column,
      offset: 0, // Tree-sitter doesn't provide offset directly
    };
  }

  /**
   * @method fromNode
   * @description Creates a `ParserError` instance directly from a Tree-sitter node.
   * This is a convenience method for generating errors with precise location information.
   *
   * @param {string} message - The error message.
   * @param {string} code - The error code.
   * @param {string} source - The full source code.
   * @param {{ startPosition: { row: number; column: number } }} node - The Tree-sitter node where the error occurred.
   * @param {ErrorSuggestion[]} [suggestions=[]] - Optional suggestions for fixing the error.
   * @returns {ParserError} A new `ParserError` instance.
   */
  public static fromNode(
    message: string,
    code: string,
    source: string,
    node: { startPosition: { row: number; column: number } },
    suggestions: ErrorSuggestion[] = []
  ): ParserError {
    const position = ParserError.fromTreeSitterPosition(node.startPosition);
    return new ParserError(message, code, source, position, suggestions);
  }
}
