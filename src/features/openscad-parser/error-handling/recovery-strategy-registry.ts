/**
 * @file recovery-strategy-registry.ts
 * @description This file implements the `RecoveryStrategyRegistry` class, which manages a collection
 * of error recovery strategies using the Chain of Responsibility pattern. The registry
 * provides automatic error recovery capabilities for common OpenSCAD syntax errors,
 * enabling graceful handling of malformed code and improved user experience.
 *
 * @architectural_decision
 * The `RecoveryStrategyRegistry` is a central component of the error handling system.
 * It uses the Chain of Responsibility pattern to decouple the error handler from the
 * individual recovery strategies. This allows for a flexible and extensible system where
 * new recovery strategies can be added without modifying the core error handling logic.
 * The registry maintains a list of strategies and tries each one in sequence until one
 * can successfully handle the error. This approach provides a robust and maintainable
 * solution for error recovery.
 *
 * @example
 * ```typescript
 * import { RecoveryStrategyRegistry } from './recovery-strategy-registry';
 * import { MissingSemicolonStrategy } from './strategies/missing-semicolon-strategy';
 * import { ParserError, ErrorCode, Severity } from './types/error-types';
 *
 * // 1. Create a new registry
 * const registry = new RecoveryStrategyRegistry();
 *
 * // 2. (Optional) Register custom strategies
 * // registry.register(new MyCustomStrategy());
 *
 * // 3. Create a sample error
 * const error = new ParserError('Missing semicolon', ErrorCode.SYNTAX_ERROR, Severity.ERROR);
 *
 * // 4. Attempt to recover from the error
 * const originalCode = 'cube(10)';
 * const recoveredCode = registry.attemptRecovery(error, originalCode);
 *
 * // 5. Log the result
 * if (recoveredCode) {
 *   console.log('Recovered code:', recoveredCode);
 *   // Expected output: 'cube(10);'
 * }
 * ```
 *
 * @integration
 * The `RecoveryStrategyRegistry` is used by the `ErrorHandler` to attempt to recover from
 * parsing errors. When the `ErrorHandler` encounters an error, it can call the `attemptRecovery`
 * method of the registry to see if any of the registered strategies can fix the error.
 * This allows the parser to continue processing the code even if it contains minor syntax errors.
 */

import { MissingSemicolonStrategy } from './strategies/missing-semicolon-strategy.js';
import type { RecoveryStrategy } from './strategies/recovery-strategy.js';
import { UnclosedBracketStrategy } from './strategies/unclosed-bracket-strategy.js';
import { UnknownIdentifierStrategy } from './strategies/unknown-identifier-strategy.js';
import type { ParserError } from './types/error-types.js';
// Note: TypeMismatchStrategy requires TypeChecker dependency, not included by default

/**
 * @class RecoveryStrategyRegistry
 * @description Registry for managing and applying error recovery strategies.
 * The registry follows a Chain of Responsibility pattern where strategies
 * are tried in order until one can handle the error.
 */
export class RecoveryStrategyRegistry {
  private strategies: RecoveryStrategy[] = [];

  /**
   * @constructor
   * @description Creates a new `RecoveryStrategyRegistry` with default strategies.
   */
  constructor() {
    this.registerDefaultStrategies();
  }

  /**
   * @method registerDefaultStrategies
   * @description Registers the default recovery strategies.
   * @private
   */
  private registerDefaultStrategies(): void {
    this.register(new MissingSemicolonStrategy());
    this.register(new UnclosedBracketStrategy());
    this.register(new UnknownIdentifierStrategy());
    // Note: TypeMismatchStrategy not included by default due to TypeChecker dependency
  }

  /**
   * @method register
   * @description Registers a new recovery strategy.
   * @param {RecoveryStrategy} strategy - The recovery strategy to register.
   */
  register(strategy: RecoveryStrategy): void {
    if (!this.strategies.includes(strategy)) {
      this.strategies.push(strategy);
    }
  }

  /**
   * @method unregister
   * @description Unregisters a recovery strategy.
   * @param {RecoveryStrategy} strategy - The recovery strategy to unregister.
   */
  unregister(strategy: RecoveryStrategy): void {
    const index = this.strategies.indexOf(strategy);
    if (index !== -1) {
      this.strategies.splice(index, 1);
    }
  }

  /**
   * @method getStrategies
   * @description Gets all registered strategies.
   * @returns {readonly RecoveryStrategy[]} An array of registered recovery strategies.
   */
  getStrategies(): readonly RecoveryStrategy[] {
    return [...this.strategies];
  }

  /**
   * @method clear
   * @description Clears all registered strategies.
   */
  clear(): void {
    this.strategies = [];
  }

  /**
   * @method attemptRecovery
   * @description Attempts to recover from a parsing error using the registered recovery strategies.
   * This method implements the Chain of Responsibility pattern, trying each registered
   * strategy in sequence until one successfully recovers from the error.
   * @param {ParserError} error - The parser error to recover from.
   * @param {string} code - The original source code containing the error.
   * @returns {string | null} The recovered/corrected code if successful, otherwise null.
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
   * @method getRecoverySuggestions
   * @description Gets human-readable recovery suggestions for a parsing error.
   * This method collects human-readable suggestions from all compatible strategies.
   * @param {ParserError} error - The parser error to get suggestions for.
   * @returns {string[]} An array of human-readable recovery suggestions from applicable strategies.
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
          console.warn(
            `Strategy ${strategy.constructor.name} failed to provide suggestion:`,
            suggestionError
          );
        }
      }
    }

    return suggestions;
  }

  /**
   * @method findStrategy
   * @description Finds the first strategy that can handle the given error.
   * @param {ParserError} error - The error to find a strategy for.
   * @returns {RecoveryStrategy | null} The first matching strategy, or null if none is found.
   */
  findStrategy(error: ParserError): RecoveryStrategy | null {
    return this.strategies.find((strategy) => strategy.canHandle(error)) || null;
  }

  /**
   * @method canRecover
   * @description Checks if any strategy can handle the given error.
   * @param {ParserError} error - The error to check.
   * @returns {boolean} True if any strategy can handle the error.
   */
  canRecover(error: ParserError): boolean {
    return this.strategies.some((strategy) => strategy.canHandle(error));
  }

  /**
   * @method getStrategyCount
   * @description Gets the number of registered strategies.
   * @returns {number} The number of registered strategies.
   */
  getStrategyCount(): number {
    return this.strategies.length;
  }

  /**
   * @method registerMultiple
   * @description Registers multiple strategies at once.
   * @param {RecoveryStrategy[]} strategies - An array of strategies to register.
   */
  registerMultiple(strategies: RecoveryStrategy[]): void {
    strategies.forEach((strategy) => this.register(strategy));
  }

  /**
   * @method clone
   * @description Creates a new registry with the same strategies as this one.
   * @returns {RecoveryStrategyRegistry} A new registry with copied strategies.
   */
  clone(): RecoveryStrategyRegistry {
    const newRegistry = new RecoveryStrategyRegistry();
    newRegistry.clear(); // Remove default strategies
    newRegistry.registerMultiple(this.strategies);
    return newRegistry;
  }
}
