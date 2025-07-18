/**
 * @file missing-semicolon-strategy.ts
 * @description This file implements a specialized recovery strategy for handling missing semicolon
 * errors in OpenSCAD code. Semicolons are required to terminate statements in OpenSCAD,
 * and missing semicolons are one of the most common syntax errors. This strategy
 * automatically detects and corrects these errors by inserting semicolons at the
 * appropriate locations.
 *
 * @architectural_decision
 * The `MissingSemicolonStrategy` is a concrete implementation of the `RecoveryStrategy`
 * interface. It is designed to be a high-priority strategy, as missing semicolons are a
 * common and easily correctable error. The strategy is context-aware, meaning it will
 * not insert a semicolon in an inappropriate context (e.g., in a comment). This makes
 * the recovery process more robust and less likely to introduce new errors.
 *
 * @example
 * ```typescript
 * import { MissingSemicolonStrategy } from './missing-semicolon-strategy';
 * import { ParserError, ErrorCode, Severity } from '../types/error-types';
 *
 * // 1. Create a new strategy instance
 * const strategy = new MissingSemicolonStrategy();
 *
 * // 2. Create a sample error
 * const error = new ParserError('Missing semicolon', ErrorCode.MISSING_SEMICOLON, Severity.ERROR);
 *
 * // 3. Check if the strategy can handle the error
 * if (strategy.canHandle(error)) {
 *   // 4. Attempt to recover from the error
 *   const originalCode = 'cube(10)';
 *   const recoveredCode = strategy.recover(error, originalCode);
 *
 *   // 5. Log the result
 *   console.log('Recovered code:', recoveredCode);
 *   // Expected output: 'cube(10);'
 * }
 * ```
 *
 * @integration
 * The `MissingSemicolonStrategy` is registered with the `RecoveryStrategyRegistry`.
 * When the `ErrorHandler` attempts to recover from an error, the registry will invoke
 * this strategy if the error is a missing semicolon error. If the strategy is successful,
 * the recovered code is returned to the error handler.
 */

import { ErrorCode, type ParserError } from '../types/error-types.js';
import { BaseRecoveryStrategy } from './recovery-strategy.js';

/**
 * @class MissingSemicolonStrategy
 * @extends {BaseRecoveryStrategy}
 * @description Specialized recovery strategy for automatically fixing missing semicolon errors.
 */
export class MissingSemicolonStrategy extends BaseRecoveryStrategy {
  /**
   * @property {number} priority
   * @description The priority of this strategy. Higher numbers are tried first.
   * @override
   */
  public override readonly priority: number = 50;

  /**
   * @method canHandle
   * @description Determines if this strategy can handle the given error.
   * @param {ParserError} error - The error to check.
   * @returns {boolean} True if this is a missing semicolon error.
   */
  canHandle(error: ParserError): boolean {
    return (
      error.code === ErrorCode.MISSING_SEMICOLON ||
      (error.code === ErrorCode.SYNTAX_ERROR &&
        error.message.toLowerCase().includes('missing semicolon'))
    );
  }

  /**
   * @method recover
   * @description Attempts to recover from a missing semicolon error.
   * @param {ParserError} error - The error to recover from.
   * @param {string} code - The source code where the error occurred.
   * @returns {string | null} The modified source code with the semicolon added, or null if recovery fails.
   */
  recover(error: ParserError, code: string): string | null {
    const position = this.getErrorPosition(error);
    if (!position) return null;

    const { line: lineNumber } = position;
    const lineContent = this.getLine(code, lineNumber);
    if (!lineContent) return null;

    // Skip if the line already ends with a semicolon
    if (lineContent.trimEnd().endsWith(';')) {
      return null;
    }

    // Skip if the line is a comment (starts with // after trimming whitespace)
    const trimmed = lineContent.trimStart();
    if (trimmed.startsWith('//')) {
      return null;
    }

    // Add semicolon at the end of the line
    const trimmedEnd = lineContent.trimEnd();
    const modifiedLine = `${trimmedEnd};`;

    return this.replaceLine(code, lineNumber, modifiedLine);
  }

  /**
   * @method getRecoverySuggestion
   * @description Gets a human-readable description of the recovery action.
   * @param {ParserError} _error - The error being recovered from.
   * @returns {string} A description of the recovery action.
   */
  getRecoverySuggestion(_error: ParserError): string {
    return 'Insert missing semicolon';
  }
}
