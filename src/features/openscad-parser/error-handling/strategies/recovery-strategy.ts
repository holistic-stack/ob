/**
 * @file Base recovery strategy interface and implementation for OpenSCAD parser error handling
 *
 * This module defines the foundational architecture for automatic error recovery in the
 * OpenSCAD parser. It provides the base interface and abstract implementation that all
 * recovery strategies must follow, enabling a pluggable system for handling different
 * types of parsing errors through the Strategy design pattern.
 *
 * The recovery strategy system includes:
 * - **Strategy Interface**: Common contract for all recovery strategy implementations
 * - **Base Implementation**: Abstract class with utility methods for common operations
 * - **Error Classification**: Methods for determining which errors can be handled
 * - **Code Modification**: Utilities for safely modifying source code to fix errors
 * - **Position Management**: Precise location handling for error correction
 * - **Recovery Guidance**: Human-readable suggestions for manual error correction
 *
 * Key components:
 * - **RecoveryStrategy Interface**: Defines the contract for error recovery implementations
 * - **BaseRecoveryStrategy Class**: Provides common functionality and utility methods
 * - **Position Utilities**: Methods for extracting and working with error locations
 * - **Code Manipulation**: Safe methods for inserting and replacing text in source code
 * - **Priority System**: Configurable priority ordering for strategy execution
 *
 * Recovery strategy features:
 * - **Automatic Error Correction**: Attempts to fix common syntax errors automatically
 * - **Strategy Pattern**: Pluggable architecture for different error types
 * - **Position-Aware Corrections**: Precise text insertion and replacement at error locations
 * - **Safe Code Modification**: Robust handling of source code manipulation
 * - **Human-Readable Suggestions**: User-friendly error correction guidance
 * - **Priority-Based Execution**: Configurable ordering of recovery attempts
 *
 * Supported recovery patterns:
 * - **Missing Punctuation**: Automatic insertion of semicolons, commas, and brackets
 * - **Unclosed Constructs**: Detection and closure of unmatched brackets, braces, and parentheses
 * - **Unknown Identifiers**: Suggestions for misspelled variables, functions, and modules
 * - **Type Mismatches**: Guidance for resolving type-related errors
 * - **Syntax Corrections**: Automatic fixes for common OpenSCAD syntax mistakes
 *
 * The strategy system implements a Chain of Responsibility pattern:
 * 1. **Error Classification**: Each strategy determines if it can handle the error
 * 2. **Recovery Attempt**: The first compatible strategy attempts automatic correction
 * 3. **Validation**: Ensure the corrected code is different from the original
 * 4. **Fallback**: Return null if no strategy can handle the error
 *
 * @example Basic strategy implementation
 * ```typescript
 * import { BaseRecoveryStrategy, ParserError } from './recovery-strategy';
 *
 * class CustomRecoveryStrategy extends BaseRecoveryStrategy {
 *   canHandle(error: ParserError): boolean {
 *     return error.code === 'E102' && error.message.includes('semicolon');
 *   }
 *
 *   recover(error: ParserError, code: string): string | null {
 *     const position = this.getErrorPosition(error);
 *     if (!position) return null;
 *
 *     return this.insertAtPosition(code, position.line, position.column, ';');
 *   }
 *
 *   getRecoverySuggestion(error: ParserError): string {
 *     return 'Add a semicolon at the end of the statement';
 *   }
 * }
 * ```
 *
 * @example Strategy registration and usage
 * ```typescript
 * import { RecoveryStrategyRegistry } from '../recovery-strategy-registry';
 *
 * // Register custom strategy
 * const registry = new RecoveryStrategyRegistry();
 * registry.register(new CustomRecoveryStrategy());
 *
 * // Attempt recovery
 * const originalCode = 'cube(10) sphere(5)'; // Missing semicolon
 * const error = new SyntaxError('Expected semicolon');
 *
 * const recoveredCode = registry.attemptRecovery(error, originalCode);
 * if (recoveredCode) {
 *   console.log('Fixed code:', recoveredCode);
 *   // Output: 'cube(10); sphere(5)'
 * }
 * ```
 *
 * @example Advanced error handling with position information
 * ```typescript
 * class AdvancedStrategy extends BaseRecoveryStrategy {
 *   recover(error: ParserError, code: string): string | null {
 *     const position = this.getErrorPosition(error);
 *     if (!position) return null;
 *
 *     // Get the problematic line
 *     const line = this.getLine(code, position.line);
 *     if (!line) return null;
 *
 *     // Analyze and fix the line
 *     const fixedLine = this.analyzeAndFix(line, position.column);
 *     if (!fixedLine) return null;
 *
 *     // Replace the entire line
 *     return this.replaceLine(code, position.line, fixedLine);
 *   }
 * }
 * ```
 *
 * @module recovery-strategy
 * @since 0.1.0
 */

import { ParserError } from '../types/error-types.js';

/**
 * Interface that all error recovery strategies must implement.
 * 
 * Recovery strategies follow the Strategy design pattern and are responsible for
 * analyzing specific types of parsing errors and providing corrections or suggestions
 * to help users fix their OpenSCAD code. Each strategy specializes in a particular
 * error type, such as missing semicolons, unclosed brackets, or unknown identifiers.
 * 
 * Recovery strategies are registered with the RecoveryStrategyRegistry and are tried
 * in sequence when an error occurs, with each strategy determining if it can handle
 * the specific error type.
 * 
 * @example Implementing a Custom Strategy
 * ```typescript
 * class MissingOperatorStrategy implements RecoveryStrategy {
 *   canHandle(error: ParserError): boolean {
 *     // Check if this is an operator-related syntax error
 *     return error instanceof SyntaxError && 
 *            error.message.includes('expected operator');
 *   }
 * 
 *   recover(error: ParserError, code: string): string | null {
 *     // Implementation to insert the missing operator
 *     const position = this.getErrorPosition(error);
 *     if (!position) return null;
 *     
 *     // Insert a '+' operator at the error position
 *     return this.insertAtPosition(code, position.line, position.column, '+');
 *   }
 * 
 *   getRecoverySuggestion(error: ParserError): string {
 *     return 'Add a missing operator (such as +, -, *, or /) between values';
 *   }
 * }
 * ```
 * 
 * @since 0.1.0
 */
export interface RecoveryStrategy {
  /**
   * Determines if this strategy can handle the given error
   * @param error - The error to check
   * @returns true if this strategy can handle the error
   */
  canHandle(error: ParserError): boolean;

  /**
   * Attempts to recover from the error by modifying the source code
   * @param error - The error to recover from
   * @param code - The source code where the error occurred
   * @returns The modified source code, or null if recovery is not possible
   */
  recover(error: ParserError, code: string): string | null;

  /**
   * Gets a human-readable description of the recovery action
   * @param error - The error being recovered from
   * @returns A description of the recovery action
   */
  getRecoverySuggestion(error: ParserError): string;
}

/**
 * Base class for recovery strategies that provides common utility methods and implements
 * the RecoveryStrategy interface.
 * 
 * This class serves as a foundation for specific recovery strategies, providing helper
 * methods for common operations such as:
 * - Extracting error position information
 * - Manipulating source code lines
 * - Inserting and replacing text at specific positions
 * 
 * Concrete recovery strategies should extend this class and implement the abstract
 * methods according to their specific error handling logic.
 * 
 * @example Extending BaseRecoveryStrategy
 * ```typescript
 * class MissingSemicolonStrategy extends BaseRecoveryStrategy {
 *   canHandle(error: ParserError): boolean {
 *     return error instanceof SyntaxError && 
 *            error.message.includes('Expected ";"');
 *   }
 * 
 *   recover(error: ParserError, code: string): string | null {
 *     const position = this.getErrorPosition(error);
 *     if (!position) return null;
 *     
 *     // Insert a semicolon at the error position
 *     return this.insertAtPosition(code, position.line, position.column, ';');
 *   }
 * 
 *   getRecoverySuggestion(error: ParserError): string {
 *     const position = this.getErrorPosition(error);
 *     if (!position) return 'Add a missing semicolon';
 *     
 *     return `Add a semicolon (;) at line ${position.line}, column ${position.column}`;
 *   }
 * }
 * ```
 * 
 * @since 0.1.0
 */
export abstract class BaseRecoveryStrategy implements RecoveryStrategy {
  /**
   * The priority of this strategy (lower numbers run first)
   */
  public readonly priority: number = 100;

  /**
   * Determines if this strategy can handle the given error
   * @param error - The error to check
   * @returns true if this strategy can handle the error
   */
  abstract canHandle(error: ParserError): boolean;

  /**
   * Attempts to recover from the error by modifying the source code
   * @param error - The error to recover from
   * @param code - The source code where the error occurred
   * @returns The modified source code, or null if recovery is not possible
   */
  abstract recover(error: ParserError, code: string): string | null;

  /**
   * Gets a human-readable description of the recovery action
   * @param error - The error being recovered from
   * @returns A description of the recovery action
   */
  abstract getRecoverySuggestion(error: ParserError): string;

  /**
   * Extracts the line and column position information from an error's context.
   * 
   * This utility method simplifies accessing position information from parser errors,
   * which is essential for locating where in the source code the error occurred.
   * The position information is used by recovery strategies to insert or replace
   * text at the correct location.
   * 
   * @param error - The parser error to extract position information from
   * @returns An object with line and column numbers (both 1-based), or null if position information is not available
   * 
   * @example
   * ```typescript
   * // Extract position from an error
   * const position = this.getErrorPosition(error);
   * if (position) {
   *   console.log(`Error at line ${position.line}, column ${position.column}`);
   *   // Use position information for recovery
   *   return this.insertAtPosition(code, position.line, position.column, ';');
   * }
   * ```
   * 
   * @since 0.1.0
   */
  protected getErrorPosition(error: ParserError): { line: number; column: number } | null {
    const { line, column } = error.context;
    return line !== undefined && column !== undefined
      ? { line, column }
      : null;
  }

  /**
   * Gets a specific line from the source code
   * @param code - The source code
   * @param lineNumber - The 1-based line number to get
   * @returns The line content, or null if out of bounds
   */
  protected getLine(code: string, lineNumber: number): string | null {
    const lines = code.split('\n');
    return lineNumber > 0 && lineNumber <= lines.length
      ? lines[lineNumber - 1] ?? null
      : null;
  }

  /**
   * Replaces a line in the source code
   * @param code - The source code
   * @param lineNumber - The 1-based line number to replace
   * @param newLine - The new line content
   * @returns The modified source code
   */
  protected replaceLine(code: string, lineNumber: number, newLine: string): string {
    const lines = code.split('\n');
    if (lineNumber > 0 && lineNumber <= lines.length) {
      lines[lineNumber - 1] = newLine;
    }
    return lines.join('\n');
  }

  /**
   * Inserts text at a specific position in the source code.
   * 
   * This is one of the primary methods used by recovery strategies to correct errors.
   * It allows precise insertion of missing elements (semicolons, brackets, operators, etc.)
   * at the exact position where they are needed.
   * 
   * The method splits the code into lines, identifies the target line, and then
   * inserts the text at the specified column position within that line.
   * 
   * @param code - The original source code as a string
   * @param line - The 1-based line number where text should be inserted
   * @param column - The 1-based column number where text should be inserted
   * @param text - The text to insert at the specified position
   * @returns The modified source code with the text inserted
   * 
   * @example Missing Semicolon
   * ```typescript
   * // Original code: 'cube(10) sphere(5);'
   * // Error at line 1, column 9 (after 'cube(10)')
   * const fixedCode = this.insertAtPosition(code, 1, 9, ';');
   * // Result: 'cube(10); sphere(5);'
   * ```
   * 
   * @example Missing Closing Bracket
   * ```typescript
   * // Original code: 'translate([1,2,3) cube(5);'
   * // Error at line 1, column 17 (after '[1,2,3')
   * const fixedCode = this.insertAtPosition(code, 1, 17, ']');
   * // Result: 'translate([1,2,3]) cube(5);'
   * ```
   * 
   * @since 0.1.0
   */
  protected insertAtPosition(code: string, line: number, column: number, text: string): string {
    const lines = code.split('\n');
    if (line < 1 || line > lines.length) return code;

    const lineContent = lines[line - 1];
    if (lineContent === undefined) return code;

    const before = lineContent.slice(0, column - 1);
    const after = lineContent.slice(column - 1);

    lines[line - 1] = before + text + after;
    return lines.join('\n');
  }
}
