/**
 * @file semantic-error.ts
 * @description This file defines the `SemanticError` class, which extends `ParserError` to represent errors
 * that occur during the semantic analysis phase of parsing. These errors are related to the meaning and validity
 * of the code, rather than its syntax.
 *
 * @architectural_decision
 * By creating a dedicated `SemanticError` class, we can distinguish between syntax errors (which are caught by Tree-sitter)
 * and semantic errors (which require deeper analysis of the AST). This separation allows for more precise error reporting
 * and targeted recovery strategies. The class includes static factory methods for common semantic error types,
 * promoting consistency and ease of use throughout the parser.
 *
 * @example
 * ```typescript
 * import { SemanticError } from './semantic-error';
 * import { ErrorPosition } from './parser-error';
 *
 * const sourceCode = 'a = b;';
 * const errorPos: ErrorPosition = { line: 0, column: 4, offset: 4 };
 *
 * // Example: Undefined variable error
 * const undefinedVarError = SemanticError.undefinedVariable('b', sourceCode, errorPos);
 * console.error(undefinedVarError.getFormattedMessage());
 * // Expected output (formatted):
 * // Undefined variable 'b'
 * //
 * // a = b;
 * //     ^
 * //
 * // Suggestions:
 * // 1. Define the variable 'b' before using it
 * //    Try: b = value; // Define the variable
 *
 * // Example: Type mismatch error
 * const typeMismatchError = SemanticError.typeMismatch('number', 'string', 'x = "hello";', { line: 0, column: 4, offset: 4 });
 * console.error(typeMismatchError.getFormattedMessage());
 *
 * // Example: Invalid parameter error
 * const invalidParamError = SemanticError.invalidParameter('radius', 'cube', 'cube(radius=10);', { line: 0, column: 5, offset: 5 });
 * console.error(invalidParamError.getFormattedMessage());
 * ```
 */

import { type ErrorPosition, type ErrorSuggestion, ParserError } from './parser-error.js';

/**
 * @class SemanticError
 * @description Represents a semantic error found in the OpenSCAD code.
 * These errors are typically related to the meaning of the code, such as undefined variables,
 * type mismatches, or incorrect function/module parameters.
 */
export class SemanticError extends ParserError {
  /**
   * @constructor
   * @description Creates a new instance of `SemanticError`.
   *
   * @param {string} message - A human-readable description of the semantic error.
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
    super(message, 'SEMANTIC_ERROR', source, position, suggestions);
    this.name = 'SemanticError';
  }

  /**
   * @method undefinedVariable
   * @description Creates a `SemanticError` for an undefined variable.
   *
   * @param {string} variableName - The name of the variable that is undefined.
   * @param {string} source - The source code.
   * @param {ErrorPosition} position - The position of the undefined variable.
   * @returns {SemanticError} A `SemanticError` instance configured for an undefined variable.
   */
  public static undefinedVariable(
    variableName: string,
    source: string,
    position: ErrorPosition
  ): SemanticError {
    const message = `Undefined variable '${variableName}'`;
    const suggestions: ErrorSuggestion[] = [
      {
        message: `Define the variable '${variableName}' before using it`,
        replacement: `${variableName} = value; // Define the variable`,
      },
    ];
    return new SemanticError(message, source, position, suggestions);
  }

  /**
   * @method typeMismatch
   * @description Creates a `SemanticError` for a type mismatch.
   *
   * @param {string} expectedType - The type that was expected.
   * @param {string} actualType - The type that was actually received.
   * @param {string} source - The source code.
   * @param {ErrorPosition} position - The position where the type mismatch occurred.
   * @returns {SemanticError} A `SemanticError` instance configured for a type mismatch.
   */
  public static typeMismatch(
    expectedType: string,
    actualType: string,
    source: string,
    position: ErrorPosition
  ): SemanticError {
    const message = `Type mismatch: expected '${expectedType}', got '${actualType}'`;
    const suggestions: ErrorSuggestion[] = [
      {
        message: `Convert the value to '${expectedType}'`,
      },
    ];
    return new SemanticError(message, source, position, suggestions);
  }

  /**
   * @method invalidParameter
   * @description Creates a `SemanticError` for an invalid parameter passed to a module or function.
   *
   * @param {string} paramName - The name of the invalid parameter.
   * @param {string} moduleName - The name of the module or function.
   * @param {string} source - The source code.
   * @param {ErrorPosition} position - The position of the invalid parameter.
   * @returns {SemanticError} A `SemanticError` instance configured for an invalid parameter.
   */
  public static invalidParameter(
    paramName: string,
    moduleName: string,
    source: string,
    position: ErrorPosition
  ): SemanticError {
    const message = `Invalid parameter '${paramName}' for module '${moduleName}'`;
    const suggestions: ErrorSuggestion[] = [
      {
        message: `Check the documentation for valid parameters for '${moduleName}'`,
      },
    ];
    return new SemanticError(message, source, position, suggestions);
  }

  /**
   * @method missingRequiredParameter
   * @description Creates a `SemanticError` for a missing required parameter in a module or function call.
   *
   * @param {string} paramName - The name of the missing required parameter.
   * @param {string} moduleName - The name of the module or function.
   * @param {string} source - The source code.
   * @param {ErrorPosition} position - The position where the parameter is missing.
   * @returns {SemanticError} A `SemanticError` instance configured for a missing required parameter.
   */
  public static missingRequiredParameter(
    paramName: string,
    moduleName: string,
    source: string,
    position: ErrorPosition
  ): SemanticError {
    const message = `Missing required parameter '${paramName}' for module '${moduleName}'`;
    const suggestions: ErrorSuggestion[] = [
      {
        message: `Add the required parameter '${paramName}'`,
        replacement: `${paramName}=value`,
      },
    ];
    return new SemanticError(message, source, position, suggestions);
  }
}
