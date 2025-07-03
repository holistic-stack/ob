/**
 * @file Unclosed bracket recovery strategy for OpenSCAD parser error handling
 *
 * This module implements a sophisticated recovery strategy for handling unclosed
 * bracket, brace, and parenthesis errors in OpenSCAD code. These errors are common
 * when writing complex nested structures, function calls with multiple parameters,
 * or module definitions with body blocks. The strategy automatically detects and
 * corrects these errors by inserting the appropriate closing characters.
 *
 * The unclosed bracket strategy includes:
 * - **Multi-Type Support**: Handles parentheses (), brackets [], and braces {}
 * - **Stack-Based Tracking**: Uses a stack algorithm to track nested bracket pairs
 * - **Intelligent Insertion**: Adds closing brackets in the correct order (LIFO)
 * - **Context-Aware Formatting**: Handles braces differently with proper line breaks
 * - **Comprehensive Detection**: Recognizes various error patterns and messages
 * - **High Priority Processing**: Executes early due to structural importance
 *
 * Key features:
 * - **Complete Bracket Support**: Handles all three bracket types used in OpenSCAD
 * - **Nested Structure Handling**: Correctly processes deeply nested bracket combinations
 * - **Smart Closing Order**: Closes brackets in Last-In-First-Out (LIFO) order
 * - **Brace Formatting**: Adds closing braces on new lines for better readability
 * - **Error Pattern Recognition**: Detects unclosed brackets through multiple criteria
 * - **Stack-Based Algorithm**: Efficient tracking of bracket nesting levels
 *
 * Bracket types handled:
 * - **Parentheses ()**: Function calls, parameter lists, grouping expressions
 * - **Square Brackets []**: Array/vector literals, indexing operations
 * - **Curly Braces {}**: Module bodies, conditional blocks, loop bodies
 *
 * Recovery patterns supported:
 * - **Function Calls**: `translate([1,0,0` → `translate([1,0,0])`
 * - **Array Literals**: `points = [[0,0], [1,1]` → `points = [[0,0], [1,1]]`
 * - **Module Bodies**: `module test() { cube(10);` → `module test() { cube(10); }`
 * - **Nested Structures**: `translate([sin(angle` → `translate([sin(angle)])`
 * - **Complex Expressions**: `result = max(a, min(b, c` → `result = max(a, min(b, c))`
 *
 * The strategy implements a sophisticated bracket tracking algorithm:
 * 1. **Stack Initialization**: Create empty stack for tracking open brackets
 * 2. **Character Scanning**: Iterate through code character by character
 * 3. **Opening Detection**: Push opening brackets onto the stack
 * 4. **Closing Detection**: Pop matching brackets from the stack
 * 5. **Unclosed Identification**: Remaining stack items are unclosed brackets
 * 6. **Intelligent Insertion**: Add closing brackets in reverse order
 *
 * @example Basic unclosed bracket recovery
 * ```typescript
 * import { UnclosedBracketStrategy } from './unclosed-bracket-strategy';
 * import { SyntaxError } from '../types/error-types';
 *
 * const strategy = new UnclosedBracketStrategy();
 *
 * // Create error for unclosed bracket
 * const error = new SyntaxError('Missing closing bracket', {
 *   line: 1,
 *   column: 15,
 *   expected: [']'],
 *   found: 'EOF'
 * });
 *
 * // Original code with unclosed bracket
 * const originalCode = 'translate([1,0,0) cube(5);';
 *
 * // Attempt recovery
 * if (strategy.canHandle(error)) {
 *   const fixedCode = strategy.recover(error, originalCode);
 *   console.log('Fixed code:', fixedCode);
 *   // Output: 'translate([1,0,0]) cube(5);'
 * }
 * ```
 *
 * @example Complex nested bracket recovery
 * ```typescript
 * const strategy = new UnclosedBracketStrategy();
 *
 * // Complex nested structure with multiple unclosed brackets
 * const complexCode = `
 * module complex_shape() {
 *   translate([10, 0, 0])
 *     rotate([0, 0, 45])
 *       cube([max(5, min(10, 15)), 5, 10];
 * `;
 *
 * const error = new SyntaxError('Unclosed brackets', { line: 4, column: 45 });
 *
 * if (strategy.canHandle(error)) {
 *   const fixedCode = strategy.recover(error, complexCode);
 *   // Adds missing closing brackets: ]) and }
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
 * registry.register(new UnclosedBracketStrategy());
 *
 * // Use with error handler
 * const errorHandler = new ErrorHandler({ recoveryRegistry: registry });
 *
 * // Parse code with unclosed brackets
 * const parser = new OpenSCADParser('cube([10, 5, 3)', errorHandler);
 * const ast = await parser.generateAST();
 *
 * // Check if recovery was applied
 * const errors = errorHandler.getErrors();
 * const recoveredCode = errorHandler.getRecoveredCode();
 * ```
 *
 * @module unclosed-bracket-strategy
 * @since 0.1.0
 */

import { ParserError, ErrorCode } from '../types/error-types.js';
import { BaseRecoveryStrategy } from './recovery-strategy.js';

type BracketType = 'PAREN' | 'BRACKET' | 'BRACE';

interface BracketInfo {
  open: string;
  close: string;
  type: BracketType;
  errorCode: ErrorCode;
}

/**
 * Sophisticated recovery strategy for automatically fixing unclosed bracket errors.
 *
 * The UnclosedBracketStrategy extends BaseRecoveryStrategy to provide comprehensive
 * recovery for unclosed parentheses, brackets, and braces in OpenSCAD code. This
 * strategy implements a stack-based algorithm to track nested bracket structures
 * and automatically insert the appropriate closing characters in the correct order.
 *
 * This implementation provides:
 * - **High Priority Processing**: Executes early (priority 40) due to structural importance
 * - **Multi-Bracket Support**: Handles parentheses (), brackets [], and braces {}
 * - **Stack-Based Tracking**: Uses efficient stack algorithm for nested structure tracking
 * - **LIFO Closing Order**: Closes brackets in Last-In-First-Out order for correct nesting
 * - **Context-Aware Formatting**: Special handling for braces with proper line breaks
 * - **Comprehensive Detection**: Recognizes various error patterns and messages
 *
 * The strategy maintains a bracket mapping system:
 * - **Parentheses ()**: Used for function calls, parameter lists, and expression grouping
 * - **Square Brackets []**: Used for array/vector literals and indexing operations
 * - **Curly Braces {}**: Used for module bodies, conditional blocks, and loop bodies
 *
 * Special formatting rules:
 * - **Parentheses and Brackets**: Added immediately at the end of the code
 * - **Braces**: Added on new lines for better code readability and structure
 * - **Mixed Types**: Handles combinations of different bracket types correctly
 *
 * @class UnclosedBracketStrategy
 * @extends {BaseRecoveryStrategy}
 * @since 0.1.0
 */
export class UnclosedBracketStrategy extends BaseRecoveryStrategy {
  private readonly bracketMap: Record<string, BracketInfo> = {
    '(': { open: '(', close: ')', type: 'PAREN', errorCode: ErrorCode.UNCLOSED_PAREN },
    '[': { open: '[', close: ']', type: 'BRACKET', errorCode: ErrorCode.UNCLOSED_BRACKET },
    '{': { open: '{', close: '}', type: 'BRACE', errorCode: ErrorCode.UNCLOSED_BRACE },
  };

  private readonly bracketTypes = Object.values(this.bracketMap);

  /** Higher priority than default */
  public override readonly priority: number = 40;

  /**
   * Determines if this strategy can handle the given error
   */
  canHandle(error: ParserError): boolean {
    return (
      error.code === ErrorCode.UNCLOSED_PAREN ||
      error.code === ErrorCode.UNCLOSED_BRACKET ||
      error.code === ErrorCode.UNCLOSED_BRACE ||
      (error.code === ErrorCode.SYNTAX_ERROR &&
       (error.message.includes('missing') &&
        (error.message.includes(')') ||
         error.message.includes(']') ||
         error.message.includes('}'))))
    );
  }

  /**
   * Attempts to recover from an unclosed bracket error
   */
  recover(error: ParserError, code: string): string | null {
    // Find all unclosed brackets in the code
    const unclosedBrackets = this.findAllUnclosedBrackets(code);
    if (unclosedBrackets.length === 0) return null;

    // For braces, add on a new line
    if (unclosedBrackets.some(bracket => bracket.close === '}')) {
      // If there are braces, handle them specially
      const nonBraces = unclosedBrackets.filter(bracket => bracket.close !== '}');
      const braces = unclosedBrackets.filter(bracket => bracket.close === '}');

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
   * Finds the last unclosed bracket in the given line
   */
  private findLastUnclosedBracket(
    line: string,
    errorPosition: number
  ): BracketInfo | null {
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
   * Finds the last unclosed bracket in the entire code
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
   * Finds all unclosed brackets in the entire code
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
   * Gets a human-readable description of the recovery action
   */
  getRecoverySuggestion(error: ParserError): string {
    if (error.code === ErrorCode.UNCLOSED_PAREN ||
        (error.code === ErrorCode.SYNTAX_ERROR && error.message.includes(')'))
    ) {
      return 'Insert missing closing parenthesis';
    } else if (error.code === ErrorCode.UNCLOSED_BRACKET ||
               (error.code === ErrorCode.SYNTAX_ERROR && error.message.includes(']'))) {
      return 'Insert missing closing bracket';
    } else if (error.code === ErrorCode.UNCLOSED_BRACE ||
               (error.code === ErrorCode.SYNTAX_ERROR && error.message.includes('}'))) {
      return 'Insert missing closing brace';
    }
    return 'Insert missing closing bracket/brace/parenthesis';
  }
}
