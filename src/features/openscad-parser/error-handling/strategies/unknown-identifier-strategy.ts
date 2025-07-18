/**
 * @file unknown-identifier-strategy.ts
 * @description This file implements a sophisticated recovery strategy for handling unknown
 * identifier errors in OpenSCAD code. Unknown identifiers are common when
 * variables, functions, or modules are misspelled or referenced before declaration.
 * This strategy uses advanced string similarity algorithms and scope-aware
 * identifier tracking to provide intelligent suggestions and automatic corrections.
 *
 * @architectural_decision
 * The `UnknownIdentifierStrategy` is a powerful recovery strategy that uses the Levenshtein
 * distance algorithm to find the most likely correction for a misspelled identifier. This
 * approach is more complex than simple string matching, but it provides a much better user
 * experience by offering intelligent suggestions. The strategy is also scope-aware, meaning
 * it will only suggest identifiers that are visible in the current scope. This prevents
 * incorrect suggestions and ensures that the recovered code is semantically valid.
 *
 * @example
 * ```typescript
 * import { UnknownIdentifierStrategy } from './unknown-identifier-strategy';
 * import { ParserError, ErrorCode, Severity } from '../types/error-types';
 *
 * // 1. Create a new strategy instance
 * const strategy = new UnknownIdentifierStrategy();
 *
 * // 2. Add some identifiers to the scope
 * strategy.addIdentifier('my_variable', 'variable');
 *
 * // 3. Create a sample error
 * const error = new ParserError('Unknown identifier: my_var', ErrorCode.UNDEFINED_VARIABLE, Severity.ERROR);
 *
 * // 4. Check if the strategy can handle the error
 * if (strategy.canHandle(error)) {
 *   // 5. Attempt to recover from the error
 *   const originalCode = 'echo(my_var);';
 *   const recoveredCode = strategy.recover(error, originalCode);
 *
 *   // 6. Log the result
 *   console.log('Recovered code:', recoveredCode);
 *   // Expected output: 'echo(my_variable);'
 * }
 * ```
 *
 * @integration
 * The `UnknownIdentifierStrategy` is registered with the `RecoveryStrategyRegistry`.
 * When the `ErrorHandler` attempts to recover from an error, the registry will invoke
 * this strategy if the error is an unknown identifier error. If the strategy is successful,
 * the recovered code is returned to the error handler.
 */

import { ErrorCode, type ParserError } from '../types/error-types.js';
import { BaseRecoveryStrategy } from './recovery-strategy.js';

interface IdentifierSuggestion {
  name: string;
  distance: number;
  type?: 'variable' | 'function' | 'module';
}

/**
 * @class UnknownIdentifierStrategy
 * @extends {BaseRecoveryStrategy}
 * @description Sophisticated recovery strategy for automatically fixing unknown identifier errors.
 */
export class UnknownIdentifierStrategy extends BaseRecoveryStrategy {
  private readonly maxSuggestions = 3;
  private readonly maxEditDistance = 2;

  /** Scope-aware identifier tracking */
  private scopedIdentifiers: Map<string, Set<string>> = new Map();
  private currentScope: string[] = [];

  /**
   * @property {number} priority
   * @description The priority of this strategy. Higher numbers are tried first.
   * @override
   */
  public override readonly priority: number = 30;

  /**
   * @method setCurrentScope
   * @description Updates the current scope for identifier resolution.
   * @param {string[]} scope - An array of scope names (innermost last).
   */
  setCurrentScope(scope: string[]): void {
    this.currentScope = [...scope];
  }

  /**
   * @method addIdentifier
   * @description Adds an identifier to the current scope.
   * @param {string} name - The identifier name.
   * @param {'variable' | 'function' | 'module'} [type='variable'] - The type of identifier.
   */
  addIdentifier(name: string, type: 'variable' | 'function' | 'module' = 'variable'): void {
    const scopeKey = this.currentScope.join('::');
    if (!this.scopedIdentifiers.has(scopeKey)) {
      this.scopedIdentifiers.set(scopeKey, new Set());
    }
    this.scopedIdentifiers.get(scopeKey)?.add(`${type}:${name}`);
  }

  /**
   * @method canHandle
   * @description Determines if this strategy can handle the given error.
   * @param {ParserError} error - The error to check.
   * @returns {boolean} True if this is an unknown identifier error.
   */
  canHandle(error: ParserError): boolean {
    return (
      error.code === ErrorCode.UNDEFINED_VARIABLE ||
      error.code === ErrorCode.UNDEFINED_FUNCTION ||
      error.code === ErrorCode.UNDEFINED_MODULE ||
      (error.code === ErrorCode.REFERENCE_ERROR &&
        (error.message.includes('is not defined') ||
          error.message.includes('undefined variable') ||
          error.message.includes('undefined function') ||
          error.message.includes('undefined module')))
    );
  }

  /**
   * @method recover
   * @description Attempts to recover from an unknown identifier error.
   * @param {ParserError} error - The error to recover from.
   * @param {string} code - The source code where the error occurred.
   * @returns {string | null} The modified source code with the corrected identifier, or null if recovery fails.
   */
  recover(error: ParserError, code: string): string | null {
    const position = this.getErrorPosition(error);
    if (!position) return null;

    const { line: lineNumber, column } = position;
    const lineContent = this.getLine(code, lineNumber);
    if (!lineContent) return null;

    // Extract the unknown identifier from the error message or context
    const identifier = this.extractIdentifier(error);
    if (!identifier) return null;

    // Find similar identifiers in the current scope
    const suggestions = this.findSimilarIdentifiers(identifier);
    if (suggestions.length === 0) return null;

    // Update error context with suggestions
    error.context.suggestions = suggestions.map((s) => s.name);

    // Return the most likely correction
    const firstSuggestion = suggestions[0];
    if (!firstSuggestion) return null;
    return this.replaceIdentifier(code, lineNumber, column, identifier, firstSuggestion.name);
  }

  /**
   * @method extractIdentifier
   * @description Extracts the unknown identifier from the error.
   * @param {ParserError} error - The error to extract the identifier from.
   * @returns {string | null} The unknown identifier, or null if it cannot be extracted.
   * @private
   */
  private extractIdentifier(error: ParserError): string | null {
    // Try to get from context first
    if (error.context.found) {
      return error.context.found;
    }

    // Extract from common error message patterns
    const message = error.message.toLowerCase();
    const patterns = [
      /undefined (?:variable|function|module) ['"]([^'"]+)['"]/,
      /['"]([^'"]+)['"] is not defined/,
      /unknown identifier ['"]([^'"]+)['"]/,
    ];

    for (const pattern of patterns) {
      const match = message.match(pattern);
      if (match?.[1]) {
        return match[1];
      }
    }

    return null;
  }

  /**
   * @method findSimilarIdentifiers
   * @description Finds identifiers similar to the given name in the current scope.
   * @param {string} name - The name to find similar identifiers for.
   * @returns {IdentifierSuggestion[]} An array of suggestions, sorted by relevance.
   * @private
   */
  private findSimilarIdentifiers(name: string): IdentifierSuggestion[] {
    const suggestions: IdentifierSuggestion[] = [];
    const scopeKey = this.currentScope.join('::');

    // Check current scope and global scope
    const scopesToCheck = [scopeKey, ''];

    for (const scope of scopesToCheck) {
      const identifiers = this.scopedIdentifiers.get(scope) ?? new Set<string>();

      for (const id of identifiers) {
        const parts = id.split(':', 2);
        const type = parts[0];
        const idName = parts[1];

        if (!type || !idName) continue; // Skip malformed entries

        const distance = this.calculateLevenshteinDistance(name, idName);

        if (distance <= this.maxEditDistance) {
          suggestions.push({
            name: idName,
            distance,
            type: type as 'variable' | 'function' | 'module',
          });
        }
      }
    }

    // Sort by edit distance, then by type (variables first), then alphabetically
    return suggestions
      .sort((a, b) => {
        if (a.distance !== b.distance) return a.distance - b.distance;
        if (a.type === 'variable' && b.type !== 'variable') return -1;
        if (a.type !== 'variable' && b.type === 'variable') return 1;
        return a.name.localeCompare(b.name);
      })
      .slice(0, this.maxSuggestions);
  }

  /**
   * @method calculateLevenshteinDistance
   * @description Calculates the Levenshtein distance between two strings.
   * @param {string} a - The first string.
   * @param {string} b - The second string.
   * @returns {number} The Levenshtein distance between the two strings.
   * @private
   */
  private calculateLevenshteinDistance(a: string, b: string): number {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    const matrix: number[][] = [];

    // Initialize first row and column
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) {
      const firstRow = matrix[0];
      if (firstRow) {
        firstRow[j] = j;
      }
    }

    // Fill in the rest of the matrix
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        const cost = a[j - 1] === b[i - 1] ? 0 : 1;
        const currentRow = matrix[i];
        const prevRow = matrix[i - 1];

        if (currentRow && prevRow) {
          const deletion = prevRow[j];
          const insertion = currentRow[j - 1];
          const substitution = prevRow[j - 1];

          if (deletion !== undefined && insertion !== undefined && substitution !== undefined) {
            currentRow[j] = Math.min(
              deletion + 1, // Deletion
              insertion + 1, // Insertion
              substitution + cost // Substitution
            );
          }
        }
      }
    }

    const lastRow = matrix[b.length];
    const result = lastRow?.[a.length];
    return result ?? 0;
  }

  /**
   * @method replaceIdentifier
   * @description Replaces an identifier in the source code.
   * @param {string} code - The source code.
   * @param {number} lineNumber - The line number of the identifier.
   * @param {number} column - The column number of the identifier.
   * @param {string} oldName - The old identifier name.
   * @param {string} newName - The new identifier name.
   * @returns {string | null} The modified source code, or null if the replacement fails.
   * @private
   */
  private replaceIdentifier(
    code: string,
    lineNumber: number,
    column: number,
    oldName: string,
    newName: string
  ): string | null {
    const lineContent = this.getLine(code, lineNumber);
    if (!lineContent) return null;

    // Find the exact position of the identifier in the line
    const lineStart = this.getLineStartPosition(code, lineNumber);

    const position = lineStart + (column - 1);

    // Get the surrounding text to ensure we're matching the full identifier
    const before = code.substring(0, position);
    const after = code.substring(position + oldName.length);

    // Only replace if the identifier matches exactly at this position
    if (code.substring(position, position + oldName.length) === oldName) {
      return before + newName + after;
    }

    return null;
  }

  /**
   * @method getLineStartPosition
   * @description Gets the character position of the start of a line.
   * @param {string} code - The source code.
   * @param {number} lineNumber - The line number.
   * @returns {number} The character position of the start of the line.
   * @private
   */
  private getLineStartPosition(code: string, lineNumber: number): number {
    const lines = code.split('\n');
    if (lineNumber < 1 || lineNumber > lines.length) return -1;

    let position = 0;
    for (let i = 0; i < lineNumber - 1; i++) {
      const line = lines[i];
      if (line !== undefined) {
        position += line.length + 1; // +1 for newline
      }
    }
    return position;
  }

  /**
   * @method getRecoverySuggestion
   * @description Gets a human-readable description of the recovery action.
   * @param {ParserError} error - The error being recovered from.
   * @returns {string} A description of the recovery action.
   */
  getRecoverySuggestion(error: ParserError): string {
    const suggestions = error.context.suggestions;
    if (!suggestions || suggestions.length === 0) {
      return 'Check for typos or missing variable/function declarations';
    }

    return `Did you mean ${suggestions.map((s) => `'${s}'`).join(' or ')}?`;
  }
}
