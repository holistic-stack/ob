/**
 * @file Quick Fix Provider for OpenSCAD Editor
 * 
 * Provides intelligent quick fix suggestions and auto-corrections for common
 * OpenSCAD syntax and semantic errors, integrating with Monaco's code actions.
 * 
 * @example
 * ```typescript
 * const quickFixProvider = new OpenSCADQuickFixProvider();
 * 
 * // Register with Monaco
 * monaco.languages.registerCodeActionProvider('openscad', quickFixProvider);
 * 
 * // Get quick fixes for specific errors
 * const actions = await quickFixProvider.provideCodeActions(model, range, context);
 * ```
 */

import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { type OpenSCADDiagnostic } from './error-detection-provider';

/**
 * Types of quick fix actions available
 */
export enum QuickFixKind {
  QuickFix = 'quickfix',
  Refactor = 'refactor',
  Source = 'source',
  SourceOrganizeImports = 'source.organizeImports',
  SourceFixAll = 'source.fixAll'
}

/**
 * Quick fix action definition
 */
export interface QuickFixAction {
  readonly title: string;
  readonly kind: QuickFixKind;
  readonly edit?: monaco.languages.WorkspaceEdit;
  readonly command?: monaco.languages.Command;
  readonly diagnostics?: readonly OpenSCADDiagnostic[];
  readonly isPreferred?: boolean;
  readonly disabled?: {
    readonly reason: string;
  };
}

/**
 * Configuration for quick fix provider
 */
export interface QuickFixConfig {
  readonly enableSyntaxFixes: boolean;
  readonly enableSemanticFixes: boolean;
  readonly enableRefactoring: boolean;
  readonly maxSuggestions: number;
}

/**
 * Default quick fix configuration
 */
export const DEFAULT_QUICK_FIX_CONFIG: QuickFixConfig = {
  enableSyntaxFixes: true,
  enableSemanticFixes: true,
  enableRefactoring: true,
  maxSuggestions: 10
} as const;

/**
 * Result type for quick fix operations
 */
export type QuickFixResult<T> = 
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly error: string };

/**
 * Quick Fix Provider for OpenSCAD
 * 
 * Provides intelligent quick fix suggestions including:
 * - Syntax error corrections (missing semicolons, brackets, etc.)
 * - Common typo fixes for OpenSCAD keywords
 * - Variable and function name suggestions
 * - Code formatting and organization
 * - Refactoring suggestions
 */
export class OpenSCADQuickFixProvider implements monaco.languages.CodeActionProvider {
  private readonly config: QuickFixConfig;

  constructor(config: Partial<QuickFixConfig> = {}) {
    this.config = { ...DEFAULT_QUICK_FIX_CONFIG, ...config };
  }

  /**
   * Provide code actions for the given model and range
   */
  async provideCodeActions(
    model: monaco.editor.ITextModel,
    range: monaco.Range,
    context: monaco.languages.CodeActionContext,
    token: monaco.CancellationToken
  ): Promise<monaco.languages.CodeActionList | null> {
    if (token.isCancellationRequested) {
      return null;
    }

    try {
      const actions: monaco.languages.CodeAction[] = [];

      // Get diagnostics in the current range
      const relevantDiagnostics = context.markers.filter(marker =>
        monaco.Range.areIntersectingOrTouching(range, {
          startLineNumber: marker.startLineNumber,
          startColumn: marker.startColumn,
          endLineNumber: marker.endLineNumber,
          endColumn: marker.endColumn
        })
      );

      // Generate quick fixes for each diagnostic
      for (const diagnostic of relevantDiagnostics) {
        const fixes = await this.generateQuickFixes(model, diagnostic, range);
        if (fixes.success) {
          actions.push(...fixes.data);
        }
      }

      // Add general refactoring actions if enabled
      if (this.config.enableRefactoring) {
        const refactorActions = await this.generateRefactoringActions(model, range);
        if (refactorActions.success) {
          actions.push(...refactorActions.data);
        }
      }

      // Limit the number of suggestions
      const limitedActions = actions.slice(0, this.config.maxSuggestions);

      return {
        actions: limitedActions,
        dispose: () => {
          // Cleanup if needed
        }
      };
    } catch (error) {
      console.error('Error providing code actions:', error);
      return null;
    }
  }

  /**
   * Generate quick fixes for a specific diagnostic
   */
  private async generateQuickFixes(
    model: monaco.editor.ITextModel,
    diagnostic: monaco.editor.IMarkerData,
    range: monaco.Range
  ): Promise<QuickFixResult<monaco.languages.CodeAction[]>> {
    try {
      const actions: monaco.languages.CodeAction[] = [];
      const diagnosticRange = {
        startLineNumber: diagnostic.startLineNumber,
        startColumn: diagnostic.startColumn,
        endLineNumber: diagnostic.endLineNumber,
        endColumn: diagnostic.endColumn
      };

      // Syntax error fixes
      if (this.config.enableSyntaxFixes && diagnostic.source === 'parser') {
        const syntaxFixes = this.generateSyntaxFixes(model, diagnostic, diagnosticRange);
        actions.push(...syntaxFixes);
      }

      // Semantic error fixes
      if (this.config.enableSemanticFixes && diagnostic.source === 'semantic') {
        const semanticFixes = this.generateSemanticFixes(model, diagnostic, diagnosticRange);
        actions.push(...semanticFixes);
      }

      return { success: true, data: actions };
    } catch (error) {
      return {
        success: false,
        error: `Failed to generate quick fixes: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Generate syntax-related quick fixes
   */
  private generateSyntaxFixes(
    model: monaco.editor.ITextModel,
    diagnostic: monaco.editor.IMarkerData,
    range: monaco.IRange
  ): monaco.languages.CodeAction[] {
    const actions: monaco.languages.CodeAction[] = [];
    const message = diagnostic.message.toLowerCase();

    // Missing semicolon
    if (message.includes('missing') && message.includes(';')) {
      actions.push({
        title: 'Add missing semicolon',
        kind: QuickFixKind.QuickFix,
        edit: {
          edits: [{
            resource: model.uri,
            versionId: model.getVersionId(),
            textEdit: {
              range: {
                startLineNumber: range.endLineNumber,
                startColumn: range.endColumn,
                endLineNumber: range.endLineNumber,
                endColumn: range.endColumn
              },
              text: ';'
            }
          }]
        },
        isPreferred: true
      });
    }

    // Missing closing bracket
    if (message.includes('missing') && (message.includes('}') || message.includes(')'))) {
      const closingChar = message.includes('}') ? '}' : ')';
      actions.push({
        title: `Add missing '${closingChar}'`,
        kind: QuickFixKind.QuickFix,
        edit: {
          edits: [{
            resource: model.uri,
            versionId: model.getVersionId(),
            textEdit: {
              range: {
                startLineNumber: range.endLineNumber,
                startColumn: range.endColumn,
                endLineNumber: range.endLineNumber,
                endColumn: range.endColumn
              },
              text: closingChar
            }
          }]
        },
        isPreferred: true
      });
    }

    // Common typos in OpenSCAD keywords
    const currentText = model.getValueInRange(range);
    const typoFixes = this.getTypoFixes(currentText);
    for (const fix of typoFixes) {
      actions.push({
        title: `Change '${currentText}' to '${fix}'`,
        kind: QuickFixKind.QuickFix,
        edit: {
          edits: [{
            resource: model.uri,
            versionId: model.getVersionId(),
            textEdit: {
              range,
              text: fix
            }
          }]
        }
      });
    }

    return actions;
  }

  /**
   * Generate semantic-related quick fixes
   */
  private generateSemanticFixes(
    model: monaco.editor.ITextModel,
    diagnostic: monaco.editor.IMarkerData,
    range: monaco.IRange
  ): monaco.languages.CodeAction[] {
    const actions: monaco.languages.CodeAction[] = [];
    const message = diagnostic.message.toLowerCase();

    // Undefined variable
    if (message.includes('undefined') && message.includes('variable')) {
      const variableName = model.getValueInRange(range);
      actions.push({
        title: `Declare variable '${variableName}'`,
        kind: QuickFixKind.QuickFix,
        edit: {
          edits: [{
            resource: model.uri,
            versionId: model.getVersionId(),
            textEdit: {
              range: {
                startLineNumber: 1,
                startColumn: 1,
                endLineNumber: 1,
                endColumn: 1
              },
              text: `${variableName} = 0; // TODO: Set appropriate value\n`
            }
          }]
        }
      });
    }

    return actions;
  }

  /**
   * Generate refactoring actions
   */
  private async generateRefactoringActions(
    model: monaco.editor.ITextModel,
    range: monaco.Range
  ): Promise<QuickFixResult<monaco.languages.CodeAction[]>> {
    try {
      const actions: monaco.languages.CodeAction[] = [];

      // Extract variable refactoring
      const selectedText = model.getValueInRange(range);
      if (selectedText && selectedText.trim().length > 0 && !selectedText.includes('\n')) {
        actions.push({
          title: `Extract to variable`,
          kind: QuickFixKind.Refactor,
          edit: {
            edits: [{
              resource: model.uri,
              versionId: model.getVersionId(),
              textEdit: {
                range: {
                  startLineNumber: range.startLineNumber,
                  startColumn: 1,
                  endLineNumber: range.startLineNumber,
                  endColumn: 1
                },
                text: `extracted_value = ${selectedText};\n`
              }
            }, {
              resource: model.uri,
              versionId: model.getVersionId(),
              textEdit: {
                range,
                text: 'extracted_value'
              }
            }]
          }
        });
      }

      return { success: true, data: actions };
    } catch (error) {
      return {
        success: false,
        error: `Failed to generate refactoring actions: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Get typo fixes for common OpenSCAD keywords
   */
  private getTypoFixes(text: string): string[] {
    const fixes: string[] = [];
    const lowerText = text.toLowerCase();

    // Common OpenSCAD keyword typos
    const typoMap: Record<string, string[]> = {
      'moduel': ['module'],
      'funciton': ['function'],
      'fucntion': ['function'],
      'lenght': ['length'],
      'widht': ['width'],
      'heigth': ['height'],
      'diamter': ['diameter'],
      'raduis': ['radius'],
      'translat': ['translate'],
      'rotat': ['rotate'],
      'scal': ['scale'],
      'mirro': ['mirror'],
      'linea': ['linear'],
      'extrud': ['extrude'],
      'cylinde': ['cylinder'],
      'spher': ['sphere'],
      'polyhedro': ['polyhedron']
    };

    for (const [typo, corrections] of Object.entries(typoMap)) {
      if (lowerText.includes(typo)) {
        fixes.push(...corrections);
      }
    }

    // Levenshtein distance-based suggestions for OpenSCAD keywords
    const keywords = [
      'module', 'function', 'if', 'else', 'for', 'let', 'each',
      'translate', 'rotate', 'scale', 'mirror', 'resize',
      'linear_extrude', 'rotate_extrude', 'projection',
      'cube', 'sphere', 'cylinder', 'polyhedron', 'polygon',
      'circle', 'square', 'text', 'surface',
      'union', 'difference', 'intersection', 'hull', 'minkowski',
      'offset', 'import', 'include', 'use'
    ];

    for (const keyword of keywords) {
      if (this.levenshteinDistance(lowerText, keyword) <= 2 && lowerText !== keyword) {
        fixes.push(keyword);
      }
    }

    return [...new Set(fixes)]; // Remove duplicates
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(0));

    for (let i = 0; i <= str2.length; i++) {
      matrix[i]![0] = i;
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0]![j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i]![j] = matrix[i - 1]![j - 1]!;
        } else {
          matrix[i]![j] = Math.min(
            matrix[i - 1]![j - 1]! + 1, // substitution
            matrix[i]![j - 1]! + 1,     // insertion
            matrix[i - 1]![j]! + 1      // deletion
          );
        }
      }
    }

    return matrix[str2.length]![str1.length]!;
  }
}
