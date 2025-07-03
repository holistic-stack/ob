/**
 * SemanticError class for semantic errors in the parser
 *
 * This class represents semantic errors in the OpenSCAD code, such as
 * undefined variables, type mismatches, etc.
 *
 * @module lib/openscad-parser/ast/errors/semantic-error
 */

import { ParserError, type ErrorPosition, type ErrorSuggestion } from './parser-error.js';

/**
 * SemanticError class for semantic errors in the parser
 */
export class SemanticError extends ParserError {
  /**
   * Create a new SemanticError
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
    super(message, 'SEMANTIC_ERROR', source, position, suggestions);
    this.name = 'SemanticError';
  }

  /**
   * Create an undefined variable error
   *
   * @param variableName - The name of the undefined variable
   * @param source - The source code
   * @param position - The position in the source code
   * @returns A SemanticError for an undefined variable
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
   * Create a type mismatch error
   *
   * @param expectedType - The expected type
   * @param actualType - The actual type
   * @param source - The source code
   * @param position - The position in the source code
   * @returns A SemanticError for a type mismatch
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
   * Create an invalid parameter error
   *
   * @param paramName - The name of the invalid parameter
   * @param moduleName - The name of the module
   * @param source - The source code
   * @param position - The position in the source code
   * @returns A SemanticError for an invalid parameter
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
   * Create a missing required parameter error
   *
   * @param paramName - The name of the missing parameter
   * @param moduleName - The name of the module
   * @param source - The source code
   * @param position - The position in the source code
   * @returns A SemanticError for a missing required parameter
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
