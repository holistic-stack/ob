/**
 * @file syntax-error.ts
 * @description This file defines the `OpenSCADSyntaxError` class, which extends `ParserError` to represent
 * syntax-specific errors encountered during the parsing of OpenSCAD code. These errors are typically
 * identified by the Tree-sitter parser and relate to violations of the language's grammatical rules.
 *
 * @architectural_decision
 * By creating a specialized `OpenSCADSyntaxError` class, we can provide more granular error reporting
 * and tailored recovery strategies for syntax-related issues. This class includes static factory methods
 * for common syntax error scenarios (e.g., missing tokens, unexpected tokens), ensuring consistency
 * in error message generation and providing actionable suggestions to the user.
 *
 * @example
 * ```typescript
 * import { OpenSCADSyntaxError } from './syntax-error';
 * import { ErrorPosition } from './parser-error';
 *
 * const sourceCode = 'cube(10';
 * const errorPos: ErrorPosition = { line: 0, column: 8, offset: 8 };
 *
 * // Example: Missing semicolon error
 * const missingSemicolonError = OpenSCADSyntaxError.missingSemicolon(sourceCode, errorPos);
 * console.error(missingSemicolonError.getFormattedMessage());
 * // Expected output (formatted):
 * // Missing semicolon
 * //
 * // cube(10
 * //         ^
 * //
 * // Suggestions:
 * // 1. Add a semicolon at the end of the statement
 * //    Try: ;
 *
 * // Example: Unexpected token error
 * const unexpectedTokenError = OpenSCADSyntaxError.unexpectedToken('then', 'else', 'if (true) then', { line: 0, column: 12, offset: 12 });
 * console.error(unexpectedTokenError.getFormattedMessage());
 *
 * // Example: Unmatched token error
 * const unmatchedTokenError = OpenSCADSyntaxError.unmatchedToken('(', ')', 'function foo(a {', { line: 0, column: 15, offset: 15 });
 * console.error(unmatchedTokenError.getFormattedMessage());
 * ```
 */

import { type ErrorPosition, type ErrorSuggestion, ParserError } from './parser-error.js';

/**
 * @class OpenSCADSyntaxError
 * @description Represents a syntax error in OpenSCAD code, extending the base `ParserError`.
 * This class provides specific error codes and suggestions for common syntax issues.
 */
export class OpenSCADSyntaxError extends ParserError {
  /**
   * @constructor
   * @description Creates a new instance of `OpenSCADSyntaxError`.
   *
   * @param {string} message - A human-readable description of the syntax error.
   * @param {string} source - The full source code string where the error occurred.
   * @param {ErrorPosition} position - The precise location of the error in the source code.
   * @param {ErrorSuggestion[]} [suggestions=[]] - An array of suggestions for how to resolve the error.
   */
  constructor(
    message: string,
    source: string,
    position: ErrorPosition,
    suggestions: ErrorSuggestion[] = []
  ) {
    super(message, 'SYNTAX_ERROR', source, position, suggestions);
    this.name = 'SyntaxError';
  }

  /**
   * @method missingToken
   * @description Creates an `OpenSCADSyntaxError` for a missing token.
   *
   * @param {string} tokenName - The name or description of the missing token (e.g., ';', ')').
   * @param {string} source - The source code.
   * @param {ErrorPosition} position - The position where the token is missing.
   * @returns {OpenSCADSyntaxError} A `OpenSCADSyntaxError` instance for a missing token.
   */
  public static missingToken(
    tokenName: string,
    source: string,
    position: ErrorPosition
  ): OpenSCADSyntaxError {
    const message = `Missing ${tokenName}`;
    const suggestions: ErrorSuggestion[] = [
      {
        message: `Add the missing ${tokenName}`,
        replacement: tokenName,
      },
    ];
    return new OpenSCADSyntaxError(message, source, position, suggestions);
  }

  /**
   * @method unexpectedToken
   * @description Creates an `OpenSCADSyntaxError` for an unexpected token encountered during parsing.
   *
   * @param {string} foundToken - The token that was found.
   * @param {string} expectedToken - The token that was expected instead.
   * @param {string} source - The source code.
   * @param {ErrorPosition} position - The position of the unexpected token.
   * @returns {OpenSCADSyntaxError} A `OpenSCADSyntaxError` instance for an unexpected token.
   */
  public static unexpectedToken(
    foundToken: string,
    expectedToken: string,
    source: string,
    position: ErrorPosition
  ): OpenSCADSyntaxError {
    const message = `Unexpected token '${foundToken}', expected '${expectedToken}'`;
    const suggestions: ErrorSuggestion[] = [
      {
        message: `Replace '${foundToken}' with '${expectedToken}'`,
        replacement: expectedToken,
      },
    ];
    return new OpenSCADSyntaxError(message, source, position, suggestions);
  }

  /**
   * @method unmatchedToken
   * @description Creates an `OpenSCADSyntaxError` for an unmatched opening token (e.g., missing closing parenthesis).
   *
   * @param {string} openToken - The opening token (e.g., '(', '{').
   * @param {string} closeToken - The expected closing token (e.g., ')', '}').
   * @param {string} source - The source code.
   * @param {ErrorPosition} position - The position of the unmatched opening token.
   * @returns {OpenSCADSyntaxError} A `OpenSCADSyntaxError` instance for an unmatched token.
   */
  public static unmatchedToken(
    openToken: string,
    closeToken: string,
    source: string,
    position: ErrorPosition
  ): OpenSCADSyntaxError {
    const message = `Unmatched '${openToken}', missing '${closeToken}'`;
    const suggestions: ErrorSuggestion[] = [
      {
        message: `Add the missing '${closeToken}'`,
        replacement: closeToken,
      },
    ];
    return new OpenSCADSyntaxError(message, source, position, suggestions);
  }

  /**
   * @method missingSemicolon
   * @description Creates an `OpenSCADSyntaxError` specifically for a missing semicolon.
   *
   * @param {string} source - The source code.
   * @param {ErrorPosition} position - The position where the semicolon is missing.
   * @returns {OpenSCADSyntaxError} A `OpenSCADSyntaxError` instance for a missing semicolon.
   */
  public static missingSemicolon(source: string, position: ErrorPosition): OpenSCADSyntaxError {
    const message = `Missing semicolon`;
    const suggestions: ErrorSuggestion[] = [
      {
        message: `Add a semicolon at the end of the statement`,
        replacement: ';',
      },
    ];
    return new OpenSCADSyntaxError(message, source, position, suggestions);
  }
}
