/**
 * @file Missing semicolon recovery strategy for OpenSCAD parser error handling
 *
 * This module implements a specialized recovery strategy for handling missing semicolon
 * errors in OpenSCAD code. Semicolons are required to terminate statements in OpenSCAD,
 * and missing semicolons are one of the most common syntax errors. This strategy
 * automatically detects and corrects these errors by inserting semicolons at the
 * appropriate locations.
 *
 * The missing semicolon strategy includes:
 * - **Error Detection**: Identifies missing semicolon errors through error codes and messages
 * - **Smart Insertion**: Automatically adds semicolons at the end of incomplete statements
 * - **Context Awareness**: Avoids inserting semicolons in inappropriate contexts (comments, etc.)
 * - **Line-Based Processing**: Operates on complete lines to maintain code structure
 * - **Validation Logic**: Ensures semicolons are only added where needed
 * - **High Priority**: Executes early in the recovery chain due to common occurrence
 *
 * Key features:
 * - **Automatic Detection**: Recognizes missing semicolon errors by error code and message content
 * - **Smart Insertion Logic**: Only adds semicolons where they are actually missing
 * - **Comment Awareness**: Skips comment lines to avoid syntax corruption
 * - **Duplicate Prevention**: Avoids adding semicolons to lines that already have them
 * - **Line Preservation**: Maintains original line structure and formatting
 * - **High Priority Processing**: Executes before more complex recovery strategies
 *
 * Recovery patterns handled:
 * - **Statement Termination**: `cube(10)` → `cube(10);`
 * - **Function Calls**: `sphere(5)` → `sphere(5);`
 * - **Module Instantiation**: `translate([1,0,0]) cube(5)` → `translate([1,0,0]) cube(5);`
 * - **Variable Assignments**: `x = 10` → `x = 10;`
 * - **Complex Expressions**: `result = sin(angle) * radius` → `result = sin(angle) * radius;`
 *
 * The strategy implements intelligent filtering:
 * 1. **Error Classification**: Verify the error is related to missing semicolons
 * 2. **Context Analysis**: Check if the line is appropriate for semicolon insertion
 * 3. **Duplicate Detection**: Ensure a semicolon isn't already present
 * 4. **Comment Filtering**: Skip comment lines and other non-executable content
 * 5. **Safe Insertion**: Add semicolon at the end of the line while preserving formatting
 *
 * @example Basic missing semicolon recovery
 * ```typescript
 * import { MissingSemicolonStrategy } from './missing-semicolon-strategy';
 * import { SyntaxError } from '../types/error-types';
 *
 * const strategy = new MissingSemicolonStrategy();
 *
 * // Create error for missing semicolon
 * const error = new SyntaxError('Missing semicolon', {
 *   line: 1,
 *   column: 9,
 *   expected: [';'],
 *   found: 'EOF'
 * });
 *
 * // Original code with missing semicolon
 * const originalCode = 'cube(10)';
 *
 * // Attempt recovery
 * if (strategy.canHandle(error)) {
 *   const fixedCode = strategy.recover(error, originalCode);
 *   console.log('Fixed code:', fixedCode);
 *   // Output: 'cube(10);'
 * }
 * ```
 *
 * @example Complex statement recovery
 * ```typescript
 * const strategy = new MissingSemicolonStrategy();
 *
 * // Complex OpenSCAD statement missing semicolon
 * const complexCode = `
 * translate([10, 0, 0])
 *   rotate([0, 0, 45])
 *     cube([5, 5, 10])
 * sphere(3)`;
 *
 * const error = new SyntaxError('Expected semicolon', { line: 3, column: 20 });
 *
 * if (strategy.canHandle(error)) {
 *   const fixedCode = strategy.recover(error, complexCode);
 *   // Adds semicolon to line 3: 'cube([5, 5, 10]);'
 * }
 * ```
 *
 * @example Strategy integration with error handler
 * ```typescript
 * import { RecoveryStrategyRegistry } from '../recovery-strategy-registry';
 * import { ErrorHandler } from '../error-handler';
 *
 * // Register the strategy
 * const registry = new RecoveryStrategyRegistry();
 * registry.register(new MissingSemicolonStrategy());
 *
 * // Use with error handler
 * const errorHandler = new ErrorHandler({ recoveryRegistry: registry });
 *
 * // Parse code with missing semicolons
 * const parser = new OpenSCADParser('cube(10) sphere(5)', errorHandler);
 * const ast = await parser.generateAST();
 *
 * // Check if recovery was applied
 * const errors = errorHandler.getErrors();
 * const recoveredCode = errorHandler.getRecoveredCode();
 * ```
 *
 * @module missing-semicolon-strategy
 * @since 0.1.0
 */

import { ParserError, ErrorCode } from '../types/error-types.js';
import { BaseRecoveryStrategy } from './recovery-strategy.js';

/**
 * Specialized recovery strategy for automatically fixing missing semicolon errors.
 *
 * The MissingSemicolonStrategy extends BaseRecoveryStrategy to provide targeted
 * recovery for one of the most common OpenSCAD syntax errors: missing statement
 * terminators. This strategy implements intelligent detection and correction
 * logic that can automatically insert semicolons where they are needed while
 * avoiding inappropriate insertions.
 *
 * This implementation provides:
 * - **High Priority Processing**: Executes early (priority 50) due to common occurrence
 * - **Smart Error Detection**: Recognizes missing semicolon errors through multiple criteria
 * - **Context-Aware Insertion**: Only adds semicolons where appropriate
 * - **Line-Based Processing**: Operates on complete lines to maintain code structure
 * - **Validation Logic**: Prevents duplicate semicolons and inappropriate insertions
 *
 * The strategy handles various OpenSCAD constructs:
 * - **Primitive Calls**: `cube(10)`, `sphere(5)`, `cylinder(h=10, r=3)`
 * - **Transform Operations**: `translate([1,0,0])`, `rotate([0,0,45])`
 * - **CSG Operations**: `union()`, `difference()`, `intersection()`
 * - **Variable Assignments**: `x = 10`, `points = [[0,0], [1,1]]`
 * - **Function Calls**: `sin(angle)`, `max(a, b, c)`
 * - **Module Instantiations**: `my_module(param1=value1)`
 *
 * @class MissingSemicolonStrategy
 * @extends {BaseRecoveryStrategy}
 * @since 0.1.0
 */
export class MissingSemicolonStrategy extends BaseRecoveryStrategy {
  /** Higher priority than default */
  public override readonly priority: number = 50;

  /**
   * Determines if this strategy can handle the given error
   * @param error - The error to check
   * @returns true if this is a missing semicolon error
   */
  canHandle(error: ParserError): boolean {
    return (
      error.code === ErrorCode.MISSING_SEMICOLON ||
      (error.code === ErrorCode.SYNTAX_ERROR &&
       error.message.toLowerCase().includes('missing semicolon'))
    );
  }

  /**
   * Attempts to recover from a missing semicolon error
   * @param error - The error to recover from
   * @param code - The source code where the error occurred
   * @returns The modified source code with semicolon added, or null if recovery fails
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
    const modifiedLine = trimmedEnd + ';';

    return this.replaceLine(code, lineNumber, modifiedLine);
  }

  /**
   * Gets a human-readable description of the recovery action
   * @param error - The error being recovered from
   * @returns A description of the recovery action
   */
  getRecoverySuggestion(_error: ParserError): string {
    return 'Insert missing semicolon';
  }
}
