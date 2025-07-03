/**
 * Base class for all parser errors
 *
 * This class provides a common interface for all parser errors, including
 * position information, suggestions for fixes, and error codes.
 *
 * @module lib/openscad-parser/ast/errors/parser-error
 */

// Position type is defined locally as ErrorPosition

/**
 * Interface for error position information
 */
export interface ErrorPosition {
  line: number;
  column: number;
  offset: number;
}

/**
 * Interface for error suggestions
 */
export interface ErrorSuggestion {
  message: string;
  replacement?: string;
}

/**
 * Base class for all parser errors
 */
export class ParserError extends Error {
  /**
   * The error code
   */
  public code: string;

  /**
   * The position in the source code where the error occurred
   */
  public position: ErrorPosition | undefined;

  /**
   * The source code that caused the error
   */
  public source: string;

  /**
   * Suggestions for fixing the error
   */
  public suggestions: ErrorSuggestion[];

  /**
   * Additional context about the error
   */
  public context: Record<string, unknown> | undefined;

  /**
   * The original error that caused this error (if any)
   */
  public originalError: Error | undefined;

  /**
   * Create a new ParserError
   *
   * @param message - The error message
   * @param code - The error code
   * @param source - The source code that caused the error
   * @param position - The position in the source code where the error occurred
   * @param suggestions - Suggestions for fixing the error
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
   * Get the source line where the error occurred
   *
   * @returns The source line
   */
  public getSourceLine(): string {
    const lines = this.source.split('\n');
    return lines[this.position?.line ?? 0] ?? '';
  }

  /**
   * Get the error position as a string
   */
  public getPositionString(): string {
    return this.position
      ? `line ${this.position.line + 1}, column ${this.position.column + 1}`
      : 'unknown position';
  }

  /**
   * Get a formatted error message with context
   *
   * @returns A formatted error message with context
   */
  public getFormattedMessage(): string {
    const sourceLine = this.getSourceLine();
    const pointer = ' '.repeat(this.position?.column ?? 0) + '^';

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
   * Convert a tree-sitter position to an ErrorPosition
   *
   * @param position - The tree-sitter position
   * @returns An ErrorPosition
   */
  public static fromTreeSitterPosition(position: {
    row: number;
    column: number;
  }): ErrorPosition {
    return {
      line: position.row,
      column: position.column,
      offset: 0, // Tree-sitter doesn't provide offset directly
    };
  }

  /**
   * Create a ParserError from a tree-sitter node
   *
   * @param message - The error message
   * @param code - The error code
   * @param source - The source code
   * @param node - The tree-sitter node
   * @param suggestions - Suggestions for fixing the error
   * @returns A ParserError
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
