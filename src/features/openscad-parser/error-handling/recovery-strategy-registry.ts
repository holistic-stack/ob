/**
 * @file Error recovery strategy registry for OpenSCAD parser
 *
 * This module implements the RecoveryStrategyRegistry class, which manages a collection
 * of error recovery strategies using the Chain of Responsibility pattern. The registry
 * provides automatic error recovery capabilities for common OpenSCAD syntax errors,
 * enabling graceful handling of malformed code and improved user experience.
 *
 * The recovery system supports:
 * - **Automatic Error Recovery**: Attempts to fix common syntax errors automatically
 * - **Strategy Management**: Registration, unregistration, and organization of recovery strategies
 * - **Chain of Responsibility**: Sequential strategy evaluation until successful recovery
 * - **Human-Readable Suggestions**: User-friendly error correction guidance
 * - **Extensible Architecture**: Support for custom recovery strategies
 * - **Error Classification**: Matching errors to appropriate recovery strategies
 *
 * Key features:
 * - **Default Strategy Set**: Pre-configured strategies for common OpenSCAD errors
 * - **Priority-Based Processing**: Strategies evaluated in registration order
 * - **Graceful Degradation**: Continues to next strategy if current one fails
 * - **Suggestion Generation**: Provides human-readable fix recommendations
 * - **Strategy Introspection**: Query capabilities for strategy management
 * - **Registry Cloning**: Support for creating registry copies with same strategies
 *
 * Built-in recovery strategies:
 * - **Missing Semicolon**: Automatically adds missing semicolons after statements
 * - **Unclosed Brackets**: Closes unmatched brackets, parentheses, and braces
 * - **Unknown Identifiers**: Suggests corrections for misspelled identifiers
 * - **Type Mismatches**: Provides guidance for type-related errors (optional)
 *
 * Recovery process workflow:
 * 1. **Error Classification**: Determine which strategies can handle the error
 * 2. **Strategy Evaluation**: Try each compatible strategy in registration order
 * 3. **Recovery Attempt**: Apply the first successful recovery transformation
 * 4. **Validation**: Ensure the recovered code differs from the original
 * 5. **Fallback**: Return null if no strategy can recover from the error
 *
 * @example Basic registry usage
 * ```typescript
 * import { RecoveryStrategyRegistry } from './recovery-strategy-registry';
 *
 * // Create registry with default strategies
 * const registry = new RecoveryStrategyRegistry();
 *
 * // Attempt automatic recovery
 * const originalCode = 'cube(10) // missing semicolon';
 * const error = new SyntaxError('Expected semicolon');
 *
 * const recoveredCode = registry.attemptRecovery(error, originalCode);
 * if (recoveredCode) {
 *   console.log('Fixed code:', recoveredCode);
 *   // Output: 'cube(10); // missing semicolon'
 * }
 * ```
 *
 * @example Custom strategy registration
 * ```typescript
 * // Create custom recovery strategy
 * class CustomStrategy implements RecoveryStrategy {
 *   canHandle(error: ParserError): boolean {
 *     return error.message.includes('custom error');
 *   }
 *
 *   recover(error: ParserError, code: string): string | null {
 *     // Custom recovery logic
 *     return fixedCode;
 *   }
 *
 *   getRecoverySuggestion(error: ParserError): string {
 *     return 'Apply custom fix for this error type';
 *   }
 * }
 *
 * // Register custom strategy
 * registry.register(new CustomStrategy());
 * ```
 *
 * @example IDE integration with suggestions
 * ```typescript
 * // Get human-readable suggestions for IDE tooltips
 * const suggestions = registry.getRecoverySuggestions(error);
 *
 * // Display in IDE error panel
 * suggestions.forEach(suggestion => {
 *   ide.showQuickFix(suggestion, () => {
 *     const fixed = registry.attemptRecovery(error, code);
 *     if (fixed) editor.replaceText(fixed);
 *   });
 * });
 * ```
 *
 * @module recovery-strategy-registry
 * @since 0.1.0
 */

import { ParserError } from './types/error-types.js';
import type { RecoveryStrategy } from './strategies/recovery-strategy.js';
import { MissingSemicolonStrategy } from './strategies/missing-semicolon-strategy.js';
import { UnclosedBracketStrategy } from './strategies/unclosed-bracket-strategy.js';
import { UnknownIdentifierStrategy } from './strategies/unknown-identifier-strategy.js';
// Note: TypeMismatchStrategy requires TypeChecker dependency, not included by default

/**
 * Registry for managing and applying error recovery strategies.
 *
 * The registry follows a chain of responsibility pattern where strategies
 * are tried in order until one can handle the error.
 *
 * @example
 * ```typescript
 * const registry = new RecoveryStrategyRegistry();
 *
 * // Register a custom strategy
 * registry.register(new CustomRecoveryStrategy());
 *
 * // Attempt recovery
 * const recoveredCode = registry.attemptRecovery(error, originalCode);
 * if (recoveredCode) {
 *   console.log('Recovery successful');
 * }
 * ```
 */
export class RecoveryStrategyRegistry {
  private strategies: RecoveryStrategy[] = [];

  /**
   * Creates a new RecoveryStrategyRegistry with default strategies
   */
  constructor() {
    this.registerDefaultStrategies();
  }

  /**
   * Registers the default recovery strategies
   */
  private registerDefaultStrategies(): void {
    this.register(new MissingSemicolonStrategy());
    this.register(new UnclosedBracketStrategy());
    this.register(new UnknownIdentifierStrategy());
    // Note: TypeMismatchStrategy not included by default due to TypeChecker dependency
  }

  /**
   * Registers a new recovery strategy
   * @param strategy - The recovery strategy to register
   */
  register(strategy: RecoveryStrategy): void {
    if (!this.strategies.includes(strategy)) {
      this.strategies.push(strategy);
    }
  }

  /**
   * Unregisters a recovery strategy
   * @param strategy - The recovery strategy to unregister
   */
  unregister(strategy: RecoveryStrategy): void {
    const index = this.strategies.indexOf(strategy);
    if (index !== -1) {
      this.strategies.splice(index, 1);
    }
  }

  /**
   * Gets all registered strategies
   * @returns Array of registered recovery strategies
   */
  getStrategies(): readonly RecoveryStrategy[] {
    return [...this.strategies];
  }

  /**
   * Clears all registered strategies
   */
  clear(): void {
    this.strategies = [];
  }

  /**
   * Attempts to recover from a parsing error using the registered recovery strategies.
   * 
   * This method implements the Chain of Responsibility pattern, trying each registered
   * strategy in sequence until one successfully recovers from the error. The process:
   * 
   * 1. Iterates through all registered strategies
   * 2. Checks if each strategy can handle the specific error type
   * 3. Attempts recovery with compatible strategies
   * 4. Returns the first successful recovery result
   * 
   * The method prioritizes strategies based on their registration order, so more specific
   * or higher-priority strategies should be registered first.
   * 
   * @param error - The parser error to recover from
   * @param code - The original source code containing the error
   * @returns The recovered/corrected code if successful, null if no strategy could handle the error
   * 
   * @example Missing Semicolon Recovery
   * ```typescript
   * // Original code with missing semicolon
   * const code = 'cube(10) // missing semicolon here\nsphere(5);';
   * const error = new SyntaxError('Expected semicolon', { line: 1, column: 9 });
   * 
   * // Attempt recovery
   * const recoveredCode = registry.attemptRecovery(error, code);
   * // Result: 'cube(10); // missing semicolon here\nsphere(5);'
   * ```
   * 
   * @example Unclosed Bracket Recovery
   * ```typescript
   * // Original code with unclosed bracket
   * const code = 'translate([1,2,3) cube(5);';
   * const error = new SyntaxError('Unclosed bracket', { line: 1, column: 10 });
   * 
   * // Attempt recovery
   * const recoveredCode = registry.attemptRecovery(error, code);
   * // Result: 'translate([1,2,3]) cube(5);'
   * ```
   * 
   * @since 0.1.0
   */
  attemptRecovery(error: ParserError, code: string): string | null {
    for (const strategy of this.strategies) {
      if (strategy.canHandle(error)) {
        try {
          const recoveredCode = strategy.recover(error, code);
          if (recoveredCode && recoveredCode !== code) {
            return recoveredCode;
          }
        } catch (recoveryError) {
          // Strategy failed, continue to next strategy
          console.warn(`Recovery strategy ${strategy.constructor.name} failed:`, recoveryError);
        }
      }
    }
    return null;
  }

  /**
   * Gets human-readable recovery suggestions for a parsing error.
   * 
   * Unlike attemptRecovery which applies the fix automatically, this method collects
   * human-readable suggestions from all compatible strategies. These suggestions can
   * be presented to users in IDE tooltips, error messages, or documentation to help
   * them understand how to fix the error themselves.
   * 
   * The method aggregates suggestions from all strategies that can handle the error,
   * providing multiple potential solutions when available.
   * 
   * @param error - The parser error to get suggestions for
   * @returns Array of human-readable recovery suggestions from applicable strategies
   * 
   * @example Collecting Suggestions
   * ```typescript
   * // For a syntax error with missing semicolon
   * const error = new SyntaxError('Expected semicolon', { line: 10, column: 15 });
   * 
   * // Get suggestions
   * const suggestions = registry.getRecoverySuggestions(error);
   * // Result: ['Add a semicolon (;) at the end of line 10']
   * 
   * // Display to user
   * console.log('Suggested fixes:');
   * suggestions.forEach(suggestion => console.log(`- ${suggestion}`));
   * ```
   * 
   * @example Multiple Suggestions
   * ```typescript
   * // For an ambiguous error that could have multiple solutions
   * const error = new ParserError('Invalid expression', ErrorCode.SYNTAX_ERROR, Severity.ERROR);
   * 
   * // Get all possible suggestions
   * const suggestions = registry.getRecoverySuggestions(error);
   * // Result might include multiple options like:
   * // ['Check for missing operators', 'Ensure balanced parentheses', ...]
   * ```
   * 
   * @since 0.1.0
   */
  getRecoverySuggestions(error: ParserError): string[] {
    const suggestions: string[] = [];

    for (const strategy of this.strategies) {
      if (strategy.canHandle(error)) {
        try {
          const suggestion = strategy.getRecoverySuggestion(error);
          if (suggestion) {
            suggestions.push(suggestion);
          }
        } catch (suggestionError) {
          // Strategy failed to provide suggestion, continue
          console.warn(`Strategy ${strategy.constructor.name} failed to provide suggestion:`, suggestionError);
        }
      }
    }

    return suggestions;
  }

  /**
   * Finds the first strategy that can handle the given error
   * @param error - The error to find a strategy for
   * @returns The first matching strategy, or null if none found
   */
  findStrategy(error: ParserError): RecoveryStrategy | null {
    return this.strategies.find(strategy => strategy.canHandle(error)) || null;
  }

  /**
   * Checks if any strategy can handle the given error
   * @param error - The error to check
   * @returns True if any strategy can handle the error
   */
  canRecover(error: ParserError): boolean {
    return this.strategies.some(strategy => strategy.canHandle(error));
  }

  /**
   * Gets the number of registered strategies
   * @returns The number of registered strategies
   */
  getStrategyCount(): number {
    return this.strategies.length;
  }

  /**
   * Registers multiple strategies at once
   * @param strategies - Array of strategies to register
   */
  registerMultiple(strategies: RecoveryStrategy[]): void {
    strategies.forEach(strategy => this.register(strategy));
  }

  /**
   * Creates a new registry with the same strategies as this one
   * @returns A new registry with copied strategies
   */
  clone(): RecoveryStrategyRegistry {
    const newRegistry = new RecoveryStrategyRegistry();
    newRegistry.clear(); // Remove default strategies
    newRegistry.registerMultiple(this.strategies);
    return newRegistry;
  }
}
