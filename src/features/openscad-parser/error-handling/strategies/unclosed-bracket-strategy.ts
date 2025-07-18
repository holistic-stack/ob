/**
 * @file unclosed-bracket-strategy.ts
 * @description This file implements a sophisticated recovery strategy for handling unclosed
 * bracket, brace, and parenthesis errors in OpenSCAD code. These errors are common
 * when writing complex nested structures, function calls with multiple parameters,
 * or module definitions with body blocks. The strategy automatically detects and
 * corrects these errors by inserting the appropriate closing characters.
 *
 * @architectural_decision
 * The `UnclosedBracketStrategy` is a stateful recovery strategy that uses a stack to track
 * the nesting of brackets. This is a more complex approach than the `MissingSemicolonStrategy`,
 * but it is necessary to correctly handle nested structures. The strategy is designed to be
 * robust and to handle a variety of different bracket types and nesting levels. It also
 * includes special formatting for braces to ensure that the recovered code is readable.
 *
 * @example
 * ```typescript
 * import { UnclosedBracketStrategy } from './unclosed-bracket-strategy';
 * import { ParserError, ErrorCode, Severity } from '../types/error-types';
 *
 * // 1. Create a new strategy instance
 * const strategy = new UnclosedBracketStrategy();
 *
 * // 2. Create a sample error
 * const error = new ParserError('Unclosed bracket', ErrorCode.UNCLOSED_BRACKET, Severity.ERROR);
 *
 * // 3. Check if the strategy can handle the error
 * if (strategy.canHandle(error)) {
 *   // 4. Attempt to recover from the error
 *   const originalCode = 'translate([10, 0, 0';
 *   const recoveredCode = strategy.recover(error, originalCode);
 *
 *   // 5. Log the result
 *   console.log('Recovered code:', recoveredCode);
 *   // Expected output: 'translate([10, 0, 0])'
 * }
 * ```
 *
 * @integration
 * The `UnclosedBracketStrategy` is registered with the `RecoveryStrategyRegistry`.
 * When the `ErrorHandler` attempts to recover from an error, the registry will invoke
 * this strategy if the error is an unclosed bracket error. If the strategy is successful,
 * the recovered code is returned to the error handler.
 */

import { ErrorCode, type ParserError } from '../types/error-types.js';
import { BaseRecoveryStrategy } from './recovery-strategy.js';

type BracketType = 'PAREN' | 'BRACKET' | 'BRACE';

interface BracketInfo {
  open: string;
  close: string;
  type: BracketType;
  errorCode: ErrorCode;
}

/**
 * @class UnclosedBracketStrategy
 * @extends {BaseRecoveryStrategy}
 * @description Sophisticated recovery strategy for automatically fixing unclosed bracket errors.
 */
export class UnclosedBracketStrategy extends BaseRecoveryStrategy {
  private readonly bracketMap: Record<string, BracketInfo> = {
    '(': { open: '(', close: ')', type: 'PAREN', errorCode: ErrorCode.UNCLOSED_PAREN },
    '[': { open: '[', close: ']', type: 'BRACKET', errorCode: ErrorCode.UNCLOSED_BRACKET },
    '{': { open: '{', close: '}', type: 'BRACE', errorCode: ErrorCode.UNCLOSED_BRACE },
  };

  private readonly bracketTypes = Object.values(this.bracketMap);

  /**
   * @property {number} priority
   * @description The priority of this strategy. Higher numbers are tried first.
   * @override
   */
  public override readonly priority: number = 40;

  /**
   * @method canHandle
   * @description Determines if this strategy can handle the given error.
   * @param {ParserError} error - The error to check.
   * @returns {boolean} True if this is an unclosed bracket error.
   */
  canHandle(error: ParserError): boolean {
    return (
      error.code === ErrorCode.UNCLOSED_PAREN ||
      error.code === ErrorCode.UNCLOSED_BRACKET ||
      error.code === ErrorCode.UNCLOSED_BRACE ||
      (error.code === ErrorCode.SYNTAX_ERROR &&
        error.message.includes('missing') &&
        (error.message.includes(')') || error.message.includes(']') || error.message.includes('}')))
    );
  }

  /**
   * @method recover
   * @description Attempts to recover from an unclosed bracket error.
   * @param {ParserError} _error - The error to recover from.
   * @param {string} code - The source code where the error occurred.
   * @returns {string | null} The modified source code with the closing bracket(s) added, or null if recovery fails.
   */
  recover(_error: ParserError, code: string): string | null {
    // Find all unclosed brackets in the code
    const unclosedBrackets = this.findAllUnclosedBrackets(code);
    if (unclosedBrackets.length === 0) return null;

    // For braces, add on a new line
    if (unclosedBrackets.some((bracket) => bracket.close === '}')) {
      // If there are braces, handle them specially
      const nonBraces = unclosedBrackets.filter((bracket) => bracket.close !== '}');
      const braces = unclosedBrackets.filter((bracket) => bracket.close === '}');

      let result = code;
      // Add non-brace brackets at the end in reverse order
      for (let i = nonBraces.length - 1; i >= 0; i--) {
        const bracket = nonBraces[i];
        if (bracket) {
          result += bracket.close;
        }
      }
      // Add braces on new lines
      for (const _bracket of braces) {
        result += '\n}';
      }
      return result;
    }

    // For brackets and parentheses, append all missing brackets at the end
    // Close brackets in reverse order (LIFO - Last In, First Out)
    let result = code;
    for (let i = unclosedBrackets.length - 1; i >= 0; i--) {
      const bracket = unclosedBrackets[i];
      if (bracket) {
        result += bracket.close;
      }
    }
    return result;
  }

  /**
   * @method findLastUnclosedBracket
   * @description Finds the last unclosed bracket in the given line.
   * @param {string} line - The line to scan.
   * @param {number} errorPosition - The position of the error in the line.
   * @returns {BracketInfo | null} The last unclosed bracket, or null if none is found.
   * @private
   */
  private findLastUnclosedBracket(line: string, errorPosition: number): BracketInfo | null {
    const stack: BracketInfo[] = [];

    // Scan the line up to the error position
    for (let i = 0; i <= Math.min(errorPosition, line.length - 1); i++) {
      const char = line[i];
      if (char === undefined) continue;
      const bracket = this.bracketMap[char];

      if (bracket) {
        // Found an opening bracket
        stack.push(bracket);
      } else {
        // Check for closing brackets
        for (const bracketType of this.bracketTypes) {
          if (char === bracketType.close) {
            // If the top of the stack matches, pop it
            const topBracket = stack[stack.length - 1];
            if (stack.length > 0 && topBracket && topBracket.close === char) {
              stack.pop();
            }
            break;
          }
        }
      }
    }

    // Return the last unclosed bracket, if any
    const lastBracket = stack[stack.length - 1];
    return lastBracket ?? null;
  }

  /**
   * @method findLastUnclosedBracketInCode
   * @description Finds the last unclosed bracket in the entire code.
   * @param {string} code - The code to scan.
   * @returns {BracketInfo | null} The last unclosed bracket, or null if none is found.
   * @private
   */
  private findLastUnclosedBracketInCode(code: string): BracketInfo | null {
    const stack: BracketInfo[] = [];

    // Scan the entire code
    for (let i = 0; i < code.length; i++) {
      const char = code[i];
      if (char === undefined) continue;
      const bracket = this.bracketMap[char];

      if (bracket) {
        // Found an opening bracket
        stack.push(bracket);
      } else {
        // Check for closing brackets
        for (const bracketType of this.bracketTypes) {
          if (char === bracketType.close) {
            // If the top of the stack matches, pop it
            const topBracket = stack[stack.length - 1];
            if (stack.length > 0 && topBracket && topBracket.close === char) {
              stack.pop();
            }
            break;
          }
        }
      }
    }

    // Return the last unclosed bracket, if any
    const lastBracket = stack[stack.length - 1];
    return lastBracket ?? null;
  }

  /**
   * @method findAllUnclosedBrackets
   * @description Finds all unclosed brackets in the entire code.
   * @param {string} code - The code to scan.
   * @returns {BracketInfo[]} An array of all unclosed brackets.
   * @private
   */
  private findAllUnclosedBrackets(code: string): BracketInfo[] {
    const stack: BracketInfo[] = [];

    // Scan the entire code
    for (let i = 0; i < code.length; i++) {
      const char = code[i];
      if (char === undefined) continue;
      const bracket = this.bracketMap[char];

      if (bracket) {
        // Found an opening bracket
        stack.push(bracket);
      } else {
        // Check for closing brackets
        for (const bracketType of this.bracketTypes) {
          if (char === bracketType.close) {
            // If the top of the stack matches, pop it
            const topBracket = stack[stack.length - 1];
            if (stack.length > 0 && topBracket && topBracket.close === char) {
              stack.pop();
            }
            break;
          }
        }
      }
    }

    // Return all unclosed brackets
    return stack;
  }

  /**
   * @method getRecoverySuggestion
   * @description Gets a human-readable description of the recovery action.
   * @param {ParserError} error - The error being recovered from.
   * @returns {string} A description of the recovery action.
   */
  getRecoverySuggestion(error: ParserError): string {
    if (
      error.code === ErrorCode.UNCLOSED_PAREN ||
      (error.code === ErrorCode.SYNTAX_ERROR && error.message.includes(')'))
    ) {
      return 'Insert missing closing parenthesis';
    } else if (
      error.code === ErrorCode.UNCLOSED_BRACKET ||
      (error.code === ErrorCode.SYNTAX_ERROR && error.message.includes(']'))
    ) {
      return 'Insert missing closing bracket';
    } else if (
      error.code === ErrorCode.UNCLOSED_BRACE ||
      (error.code === ErrorCode.SYNTAX_ERROR && error.message.includes('}'))
    ) {
      return 'Insert missing closing brace';
    }
    return 'Insert missing closing bracket/brace/parenthesis';
  }
}
