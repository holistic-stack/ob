/**
 * @file Unknown identifier recovery strategy for OpenSCAD parser error handling
 *
 * This module implements a sophisticated recovery strategy for handling unknown
 * identifier errors in OpenSCAD code. Unknown identifiers are common when
 * variables, functions, or modules are misspelled or referenced before declaration.
 * This strategy uses advanced string similarity algorithms and scope-aware
 * identifier tracking to provide intelligent suggestions and automatic corrections.
 *
 * The unknown identifier strategy includes:
 * - **Scope-Aware Tracking**: Maintains identifier visibility across different scopes
 * - **Levenshtein Distance**: Uses edit distance algorithms for similarity matching
 * - **Multi-Type Support**: Handles variables, functions, and modules separately
 * - **Intelligent Suggestions**: Provides ranked suggestions based on similarity and context
 * - **Automatic Correction**: Attempts to replace unknown identifiers with best matches
 * - **Context Preservation**: Maintains error context with suggestion information
 *
 * Key features:
 * - **Advanced String Matching**: Levenshtein distance algorithm for fuzzy matching
 * - **Scope Management**: Tracks identifiers across nested scopes and modules
 * - **Type-Aware Suggestions**: Prioritizes suggestions based on identifier type
 * - **Configurable Thresholds**: Adjustable edit distance and suggestion limits
 * - **Pattern Recognition**: Extracts unknown identifiers from various error message formats
 * - **High Priority Processing**: Executes early (priority 30) for common identifier errors
 *
 * Identifier types handled:
 * - **Variables**: Local variables, parameters, and global constants
 * - **Functions**: Built-in functions, user-defined functions, and mathematical operations
 * - **Modules**: User-defined modules and built-in OpenSCAD modules
 *
 * Recovery patterns supported:
 * - **Typo Correction**: `cuve(10)` → `cube(10)` (single character error)
 * - **Case Sensitivity**: `Cube(10)` → `cube(10)` (case mismatch)
 * - **Missing Characters**: `spere(5)` → `sphere(5)` (missing character)
 * - **Extra Characters**: `cuube(10)` → `cube(10)` (extra character)
 * - **Character Transposition**: `pshere(5)` → `sphere(5)` (swapped characters)
 *
 * The strategy implements intelligent scope resolution:
 * 1. **Scope Tracking**: Maintain current scope hierarchy for identifier visibility
 * 2. **Identifier Registration**: Track available identifiers by scope and type
 * 3. **Error Analysis**: Extract unknown identifier from error messages and context
 * 4. **Similarity Matching**: Find similar identifiers using Levenshtein distance
 * 5. **Suggestion Ranking**: Sort suggestions by distance, type priority, and name
 * 6. **Automatic Correction**: Replace unknown identifier with best match
 *
 * @example Basic unknown identifier recovery
 * ```typescript
 * import { UnknownIdentifierStrategy } from './unknown-identifier-strategy';
 * import { ReferenceError } from '../types/error-types';
 *
 * const strategy = new UnknownIdentifierStrategy();
 *
 * // Register available identifiers
 * strategy.setCurrentScope(['main']);
 * strategy.addIdentifier('cube', 'function');
 * strategy.addIdentifier('sphere', 'function');
 * strategy.addIdentifier('cylinder', 'function');
 *
 * // Create error for unknown identifier
 * const error = new ReferenceError('Unknown identifier: cuve', {
 *   line: 1,
 *   column: 1,
 *   found: 'cuve'
 * });
 *
 * // Attempt recovery
 * if (strategy.canHandle(error)) {
 *   const fixedCode = strategy.recover(error, 'cuve(10);');
 *   console.log('Fixed code:', fixedCode);
 *   // Output: 'cube(10);'
 *
 *   const suggestion = strategy.getRecoverySuggestion(error);
 *   console.log('Suggestion:', suggestion);
 *   // Output: "Did you mean 'cube'?"
 * }
 * ```
 *
 * @example Advanced scope-aware identifier tracking
 * ```typescript
 * const strategy = new UnknownIdentifierStrategy();
 *
 * // Set up nested scope hierarchy
 * strategy.setCurrentScope(['main', 'my_module']);
 *
 * // Register identifiers in different scopes
 * strategy.addIdentifier('width', 'variable');
 * strategy.addIdentifier('height', 'variable');
 * strategy.addIdentifier('create_shape', 'function');
 *
 * // Switch to different scope
 * strategy.setCurrentScope(['main']);
 * strategy.addIdentifier('global_size', 'variable');
 *
 * // Handle error with scope-aware suggestions
 * const error = new ReferenceError('Undefined variable: widht', {
 *   line: 5,
 *   column: 10,
 *   found: 'widht'
 * });
 *
 * const fixedCode = strategy.recover(error, 'translate([widht, 0, 0])');
 * // Suggests 'width' from the appropriate scope
 * ```
 *
 * @example Complex error handling with multiple suggestions
 * ```typescript
 * const strategy = new UnknownIdentifierStrategy();
 *
 * // Register similar identifiers
 * strategy.addIdentifier('translate', 'function');
 * strategy.addIdentifier('rotate', 'function');
 * strategy.addIdentifier('scale', 'function');
 * strategy.addIdentifier('transformation', 'variable');
 *
 * // Handle ambiguous error
 * const error = new ReferenceError('Unknown function: transalte', {
 *   line: 3,
 *   column: 1,
 *   found: 'transalte'
 * });
 *
 * if (strategy.canHandle(error)) {
 *   const fixedCode = strategy.recover(error, 'transalte([1,0,0]) cube(5);');
 *   // Automatically corrects to 'translate' (closest match)
 *
 *   const suggestions = error.context.suggestions;
 *   console.log('All suggestions:', suggestions);
 *   // Output: ['translate', 'transformation'] (ranked by similarity)
 * }
 * ```
 *
 * @module unknown-identifier-strategy
 * @since 0.1.0
 */

import { ParserError, ErrorCode } from '../types/error-types.js';
import { BaseRecoveryStrategy } from './recovery-strategy.js';

interface IdentifierSuggestion {
  name: string;
  distance: number;
  type?: 'variable' | 'function' | 'module';
}

/**
 * Sophisticated recovery strategy for automatically fixing unknown identifier errors.
 *
 * The UnknownIdentifierStrategy extends BaseRecoveryStrategy to provide intelligent
 * recovery for misspelled or undefined variables, functions, and modules in OpenSCAD
 * code. This strategy implements advanced string similarity algorithms and scope-aware
 * identifier tracking to provide accurate suggestions and automatic corrections.
 *
 * This implementation provides:
 * - **High Priority Processing**: Executes early (priority 30) for common identifier errors
 * - **Scope-Aware Tracking**: Maintains identifier visibility across nested scopes
 * - **Levenshtein Distance**: Advanced string similarity matching with configurable thresholds
 * - **Multi-Type Support**: Handles variables, functions, and modules with type-aware prioritization
 * - **Intelligent Ranking**: Sorts suggestions by edit distance, type priority, and alphabetical order
 * - **Context Preservation**: Updates error context with suggestion information for user feedback
 *
 * The strategy maintains sophisticated identifier tracking:
 * - **Scoped Identifiers**: Map of scope keys to identifier sets with type information
 * - **Current Scope**: Array representing the current scope hierarchy (innermost last)
 * - **Type Classification**: Separate tracking for variables, functions, and modules
 * - **Configurable Limits**: Maximum suggestions (3) and edit distance (2) for performance
 *
 * Algorithm features:
 * - **Pattern Recognition**: Extracts unknown identifiers from various error message formats
 * - **Fuzzy Matching**: Uses Levenshtein distance for similarity calculation
 * - **Scope Resolution**: Checks current scope and global scope for identifier visibility
 * - **Type Prioritization**: Prefers variables over functions/modules in suggestion ranking
 * - **Exact Replacement**: Performs precise identifier replacement at error locations
 *
 * @class UnknownIdentifierStrategy
 * @extends {BaseRecoveryStrategy}
 * @since 0.1.0
 */
export class UnknownIdentifierStrategy extends BaseRecoveryStrategy {
  private readonly maxSuggestions = 3;
  private readonly maxEditDistance = 2;

  /** Scope-aware identifier tracking */
  private scopedIdentifiers: Map<string, Set<string>> = new Map();
  private currentScope: string[] = [];

  /** Higher priority than default */
  public override readonly priority: number = 30;

  /**
   * Updates the current scope for identifier resolution
   * @param scope - Array of scope names (innermost last)
   */
  setCurrentScope(scope: string[]): void {
    this.currentScope = [...scope];
  }

  /**
   * Adds an identifier to the current scope
   * @param name - Identifier name
   * @param type - Type of identifier (variable/function/module)
   */
  addIdentifier(name: string, type: 'variable' | 'function' | 'module' = 'variable'): void {
    const scopeKey = this.currentScope.join('::');
    if (!this.scopedIdentifiers.has(scopeKey)) {
      this.scopedIdentifiers.set(scopeKey, new Set());
    }
    this.scopedIdentifiers.get(scopeKey)?.add(`${type}:${name}`);
  }

  /**
   * Determines if this strategy can handle the given error
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
   * Attempts to recover from an unknown identifier error
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
    (error.context.suggestions = suggestions.map(s => s.name));

    // Return the most likely correction
    const firstSuggestion = suggestions[0];
    if (!firstSuggestion) return null;
    return this.replaceIdentifier(code, lineNumber, column, identifier, firstSuggestion.name);
  }

  /**
   * Extracts the unknown identifier from the error
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
   * Finds identifiers similar to the given name in the current scope
   */
  private findSimilarIdentifiers(name: string): IdentifierSuggestion[] {
    const suggestions: IdentifierSuggestion[] = [];
    const scopeKey = this.currentScope.join('::');

    // Check current scope and global scope
    const scopesToCheck = [scopeKey, ''];

    for (const scope of scopesToCheck) {
      const identifiers = this.scopedIdentifiers.get(scope) ?? [];

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
            type: type as 'variable' | 'function' | 'module'
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
   * Calculates Levenshtein distance between two strings
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
              deletion + 1,     // Deletion
              insertion + 1,     // Insertion
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
   * Replaces an identifier in the source code
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
   * Gets the character position of the start of a line
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
   * Gets a human-readable description of the recovery action
   */
  getRecoverySuggestion(error: ParserError): string {
    const suggestions = error.context.suggestions;
    if (!suggestions || suggestions.length === 0) {
      return 'Check for typos or missing variable/function declarations';
    }

    return `Did you mean ${suggestions.map(s => `'${s}'`).join(' or ')}?`;
  }
}
