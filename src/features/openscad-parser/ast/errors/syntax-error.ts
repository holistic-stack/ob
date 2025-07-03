/**
 * SyntaxError class for syntax errors in the parser
 *
 * This class represents syntax errors in the OpenSCAD code, such as
 * missing semicolons, unmatched parentheses, etc.
 *
 * @module lib/openscad-parser/ast/errors/syntax-error
 */

import { ParserError, type ErrorPosition, type ErrorSuggestion } from './parser-error.js';

/**
 * SyntaxError class for syntax errors in the parser
 */
export class SyntaxError extends ParserError {
  /**
   * Create a new SyntaxError
   *
   * @param message - The error message
   * @param source - The source code that caused the error
   * @param position - The position in the source code where the error occurred
   * @param suggestions - Suggestions for fixing the error
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
   * Create a missing token error
   *
   * @param tokenName - The name of the missing token
   * @param source - The source code
   * @param position - The position in the source code
   * @returns A SyntaxError for a missing token
   */
  public static missingToken(
    tokenName: string,
    source: string,
    position: ErrorPosition
  ): SyntaxError {
    const message = `Missing ${tokenName}`;
    const suggestions: ErrorSuggestion[] = [
      {
        message: `Add the missing ${tokenName}`,
        replacement: tokenName,
      },
    ];
    return new SyntaxError(message, source, position, suggestions);
  }

  /**
   * Create an unexpected token error
   *
   * @param foundToken - The token that was found
   * @param expectedToken - The token that was expected
   * @param source - The source code
   * @param position - The position in the source code
   * @returns A SyntaxError for an unexpected token
   */
  public static unexpectedToken(
    foundToken: string,
    expectedToken: string,
    source: string,
    position: ErrorPosition
  ): SyntaxError {
    const message = `Unexpected token '${foundToken}', expected '${expectedToken}'`;
    const suggestions: ErrorSuggestion[] = [
      {
        message: `Replace '${foundToken}' with '${expectedToken}'`,
        replacement: expectedToken,
      },
    ];
    return new SyntaxError(message, source, position, suggestions);
  }

  /**
   * Create an unmatched token error
   *
   * @param openToken - The opening token
   * @param closeToken - The closing token
   * @param source - The source code
   * @param position - The position in the source code
   * @returns A SyntaxError for an unmatched token
   */
  public static unmatchedToken(
    openToken: string,
    closeToken: string,
    source: string,
    position: ErrorPosition
  ): SyntaxError {
    const message = `Unmatched '${openToken}', missing '${closeToken}'`;
    const suggestions: ErrorSuggestion[] = [
      {
        message: `Add the missing '${closeToken}'`,
        replacement: closeToken,
      },
    ];
    return new SyntaxError(message, source, position, suggestions);
  }

  /**
   * Create a missing semicolon error
   *
   * @param source - The source code
   * @param position - The position in the source code
   * @returns A SyntaxError for a missing semicolon
   */
  public static missingSemicolon(
    source: string,
    position: ErrorPosition
  ): SyntaxError {
    const message = `Missing semicolon`;
    const suggestions: ErrorSuggestion[] = [
      {
        message: `Add a semicolon at the end of the statement`,
        replacement: ';',
      },
    ];
    return new SyntaxError(message, source, position, suggestions);
  }
}
