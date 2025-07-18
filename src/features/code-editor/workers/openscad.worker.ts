/**
 * @file openscad.worker.ts
 * @description This Web Worker provides OpenSCAD language support for the Monaco Editor,
 * offering syntax validation, auto-completion, and hover information.
 *
 * @architectural_decision
 * Running language services in a Web Worker offloads computationally intensive tasks
 * from the main UI thread. This prevents the editor from freezing or becoming unresponsive
 * during operations like code validation or complex auto-completion suggestions.
 * The worker communicates with the main thread via `postMessage` and `addEventListener`,
 * ensuring a smooth user experience.
 *
 * @example
 * ```typescript
 * // In your main application thread (e.g., in a Monaco editor setup file):
 * import { configureMonacoEnvironment } from '../config/monaco-vite-config';
 * import { registerOpenSCADLanguage, registerOpenSCADCompletionProvider } from '../services/openscad-language';
 * import * as monaco from 'monaco-editor';
 *
 * // Configure Monaco to use the OpenSCAD worker
 * configureMonacoEnvironment();
 *
 * // Register the language and completion provider
 * registerOpenSCADLanguage(monaco);
 * registerOpenSCADCompletionProvider(monaco);
 *
 * // The worker will be automatically loaded by Monaco when the 'openscad' language is used.
 * ```
 *
 * @integration
 * This worker is loaded by the Monaco Editor when the `openscad` language is set for a model.
 * It exposes methods (`validateCode`, `getCompletions`, `getHoverInfo`) that the Monaco Editor
 * calls to provide language-specific features. The `OpenSCADLanguageService` within the worker
 * performs the actual logic for these features.
 */

import * as monaco from 'monaco-editor';
import { createLogger } from '../../../shared/services/logger.service.js';

// Import OpenSCAD language configuration
import { OPENSCAD_LANGUAGE_CONFIG } from '../services/openscad-language.js';

const logger = createLogger('OpenSCADWorker');

// Global worker context types
interface WorkerContext {
  postMessage: (message: unknown) => void;
  addEventListener: (type: string, listener: (event: unknown) => void) => void;
  importScripts: (...urls: string[]) => void;
  MarkerSeverity: typeof monaco.MarkerSeverity;
  languages: typeof monaco.languages;
}

/**
 * @class OpenSCADWorker
 * @description OpenSCAD language worker implementation.
 * This class acts as the entry point for the Web Worker, handling communication with the main thread
 * and delegating language service requests to `OpenSCADLanguageService`.
 */
export class OpenSCADWorker {
  private readonly _ctx: WorkerContext;
  private readonly _languageService: OpenSCADLanguageService;

  /**
   * @constructor
   * @description Creates a new instance of the `OpenSCADWorker`.
   * @param {WorkerContext} ctx - The Web Worker context.
   */
  constructor(ctx: WorkerContext) {
    this._ctx = ctx;
    this._languageService = new OpenSCADLanguageService();

    logger.init('OpenSCAD language worker initialized');
  }

  /**
   * @method getLanguageService
   * @description Gets the language service instance.
   * @returns {OpenSCADLanguageService} The language service instance.
   */
  getLanguageService(): OpenSCADLanguageService {
    return this._languageService;
  }

  /**
   * @method validateCode
   * @description Validates OpenSCAD code and returns a list of markers (errors, warnings).
   * @param {string} code - The OpenSCAD code to validate.
   * @returns {Promise<monaco.editor.IMarkerData[]>} A promise that resolves with an array of Monaco editor markers.
   */
  async validateCode(code: string): Promise<monaco.editor.IMarkerData[]> {
    try {
      return await this._languageService.validateCode(code);
    } catch (error) {
      logger.error('Code validation failed:', error);
      return [];
    }
  }

  /**
   * @method getCompletions
   * @description Gets completion suggestions for OpenSCAD code at a given position.
   * @param {string} code - The OpenSCAD code.
   * @param {{ line: number; column: number }} position - The cursor position.
   * @returns {Promise<monaco.languages.CompletionItem[]>} A promise that resolves with an array of completion items.
   */
  async getCompletions(
    code: string,
    position: { line: number; column: number }
  ): Promise<monaco.languages.CompletionItem[]> {
    try {
      return await this._languageService.getCompletions(code, position);
    } catch (error) {
      logger.error('Completion failed:', error);
      return [];
    }
  }

  /**
   * @method getHoverInfo
   * @description Gets hover information for OpenSCAD elements at a given position.
   * @param {string} code - The OpenSCAD code.
   * @param {{ line: number; column: number }} position - The cursor position.
   * @returns {Promise<monaco.languages.Hover | null>} A promise that resolves with hover information, or null if none is available.
   */
  async getHoverInfo(
    code: string,
    position: { line: number; column: number }
  ): Promise<monaco.languages.Hover | null> {
    try {
      return await this._languageService.getHoverInfo(code, position);
    } catch (error) {
      logger.error('Hover info failed:', error);
      return null;
    }
  }
}

/**
 * @class OpenSCADLanguageService
 * @description OpenSCAD language service implementation.
 * This class provides the core logic for OpenSCAD language features, including syntax validation,
 * auto-completion, and hover information. It uses the `OPENSCAD_LANGUAGE_CONFIG` to provide
 * accurate suggestions and diagnostics.
 */
class OpenSCADLanguageService {
  private readonly _keywords: Set<string>;
  private readonly _builtinFunctions: Set<string>;
  private readonly _builtinModules: Set<string>;

  /**
   * @constructor
   * @description Creates a new instance of the `OpenSCADLanguageService`.
   */
  constructor() {
    this._keywords = new Set(OPENSCAD_LANGUAGE_CONFIG.keywords);
    this._builtinFunctions = new Set(OPENSCAD_LANGUAGE_CONFIG.builtinFunctions);
    this._builtinModules = new Set(OPENSCAD_LANGUAGE_CONFIG.builtinModules);
  }

  /**
   * @method validateCode
   * @description Validates OpenSCAD code and returns diagnostics.
   * @param {string} code - The OpenSCAD code to validate.
   * @returns {Promise<monaco.editor.IMarkerData[]>} A promise that resolves with an array of Monaco editor markers.
   */
  async validateCode(code: string): Promise<monaco.editor.IMarkerData[]> {
    const markers: monaco.editor.IMarkerData[] = [];
    const lines = code.split('\n');

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex];
      if (!line) continue;

      const lineNumber = lineIndex + 1;

      // Check for syntax errors
      const syntaxErrors = this._validateSyntax(line, lineNumber);
      markers.push(...syntaxErrors);

      // Check for semantic errors
      const semanticErrors = this._validateSemantics(line, lineNumber);
      markers.push(...semanticErrors);
    }

    return markers;
  }

  /**
   * @method getCompletions
   * @description Gets completion suggestions for OpenSCAD.
   * @param {string} _code - The OpenSCAD code.
   * @param {{ line: number; column: number }} position - The cursor position.
   * @returns {Promise<monaco.languages.CompletionItem[]>} A promise that resolves with an array of completion items.
   */
  async getCompletions(
    _code: string,
    position: { line: number; column: number }
  ): Promise<monaco.languages.CompletionItem[]> {
    const completions: monaco.languages.CompletionItem[] = [];

    // Add keyword completions
    this._keywords.forEach((keyword) => {
      completions.push({
        label: keyword,
        kind: monaco.languages.CompletionItemKind.Keyword,
        insertText: keyword,
        range: {
          startLineNumber: position.line,
          endLineNumber: position.line,
          startColumn: position.column,
          endColumn: position.column,
        },
      });
    });

    // Add function completions
    this._builtinFunctions.forEach((func) => {
      completions.push({
        label: func,
        kind: monaco.languages.CompletionItemKind.Function,
        insertText: `${func}()`,
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        range: {
          startLineNumber: position.line,
          endLineNumber: position.line,
          startColumn: position.column,
          endColumn: position.column,
        },
      });
    });

    // Add module completions
    this._builtinModules.forEach((module) => {
      completions.push({
        label: module,
        kind: monaco.languages.CompletionItemKind.Module,
        insertText: `${module}()`,
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        range: {
          startLineNumber: position.line,
          endLineNumber: position.line,
          startColumn: position.column,
          endColumn: position.column,
        },
      });
    });

    // Add constant suggestions
    if (OPENSCAD_LANGUAGE_CONFIG.constants && Array.isArray(OPENSCAD_LANGUAGE_CONFIG.constants)) {
      OPENSCAD_LANGUAGE_CONFIG.constants.forEach((constant) => {
        completions.push({
          label: constant,
          kind: monaco.languages.CompletionItemKind.Constant,
          insertText: constant,
          range: {
            startLineNumber: position.line,
            endLineNumber: position.line,
            startColumn: position.column,
            endColumn: position.column,
          },
        });
      });
    }

    return completions;
  }

  /**
   * @method getHoverInfo
   * @description Gets hover information for OpenSCAD elements.
   * @param {string} code - The OpenSCAD code.
   * @param {{ line: number; column: number }} position - The cursor position.
   * @returns {Promise<monaco.languages.Hover | null>} A promise that resolves with hover information, or null if none is available.
   */
  async getHoverInfo(
    code: string,
    position: { line: number; column: number }
  ): Promise<monaco.languages.Hover | null> {
    const lines = code.split('\n');
    const line = lines[position.line - 1];

    if (!line) return null;

    // Get word at position
    const word = this._getWordAtPosition(line, position.column);
    if (!word) return null;

    // Provide hover info for keywords, functions, and modules
    let hoverText = '';

    if (this._keywords.has(word)) {
      hoverText = `**${word}** (keyword)\n\nOpenSCAD keyword`;
    } else if (this._builtinFunctions.has(word)) {
      hoverText = `**${word}()** (function)\n\nOpenSCAD built-in function`;
    } else if (this._builtinModules.has(word)) {
      hoverText = `**${word}()** (module)\n\nOpenSCAD built-in module`;
    }

    if (hoverText) {
      return {
        range: {
          startLineNumber: position.line,
          endLineNumber: position.line,
          startColumn: position.column - word.length,
          endColumn: position.column,
        },
        contents: [{ value: hoverText }],
      };
    }

    return null;
  }

  /**
   * @method _validateSyntax
   * @description Validates the syntax of a single line of OpenSCAD code.
   * @param {string} line - The line of code to validate.
   * @param {number} lineNumber - The line number.
   * @returns {monaco.editor.IMarkerData[]} An array of Monaco editor markers for syntax errors.
   * @private
   */
  private _validateSyntax(line: string, lineNumber: number): monaco.editor.IMarkerData[] {
    const markers: monaco.editor.IMarkerData[] = [];

    // Check for unmatched brackets
    const brackets = { '(': 0, '[': 0, '{': 0 };
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '(' || char === '[' || char === '{') {
        brackets[char]++;
      } else if (char === ')') {
        brackets['(']--;
      } else if (char === ']') {
        brackets['[']--;
      } else if (char === '}') {
        brackets['{']--;
      }
    }

    // Report unmatched brackets
    Object.entries(brackets).forEach(([bracket, count]) => {
      if (count !== 0) {
        markers.push({
          severity: monaco.MarkerSeverity.Error,
          startLineNumber: lineNumber,
          startColumn: 1,
          endLineNumber: lineNumber,
          endColumn: line.length + 1,
          message: `Unmatched ${bracket === '(' ? 'parenthesis' : bracket === '[' ? 'bracket' : 'brace'}`,
        });
      }
    });

    return markers;
  }

  /**
   * @method _validateSemantics
   * @description Validates the semantics of a single line of OpenSCAD code.
   * @param {string} line - The line of code to validate.
   * @param {number} lineNumber - The line number.
   * @returns {monaco.editor.IMarkerData[]} An array of Monaco editor markers for semantic errors.
   * @private
   */
  private _validateSemantics(line: string, lineNumber: number): monaco.editor.IMarkerData[] {
    const markers: monaco.editor.IMarkerData[] = [];

    // Check for undefined functions/modules
    const wordMatch = line.match(/\b\w+\b/g) ?? [];
    wordMatch.forEach((word) => {
      if (
        word.match(/^[a-z_]/i) &&
        !this._keywords.has(word) &&
        !this._builtinFunctions.has(word) &&
        !this._builtinModules.has(word)
      ) {
        // This could be a user-defined function/module, so just warn
        const wordIndex = line.indexOf(word);
        if (wordIndex !== -1) {
          markers.push({
            severity: monaco.MarkerSeverity.Info,
            startLineNumber: lineNumber,
            startColumn: wordIndex + 1,
            endLineNumber: lineNumber,
            endColumn: wordIndex + word.length + 1,
            message: `'${word}' is not a built-in OpenSCAD function or module`,
          });
        }
      }
    });

    return markers;
  }

  /**
   * @method _getWordAtPosition
   * @description Gets the word at a specific position in a line.
   * @param {string} line - The line of code.
   * @param {number} column - The column number.
   * @returns {string | null} The word at the specified position, or null if no word is found.
   * @private
   */
  private _getWordAtPosition(line: string, column: number): string | null {
    const wordRegex = /\b\w+\b/g;
    let matchResult: RegExpExecArray | null;

    matchResult = wordRegex.exec(line);
    while (matchResult !== null) {
      const start = matchResult.index;
      const end = matchResult.index + matchResult[0].length;

      if (column >= start && column <= end) {
        return matchResult[0];
      }

      matchResult = wordRegex.exec(line);
    }

    return null;
  }
}

/**
 * @constant ctx
 * @description The Web Worker context, cast to `WorkerContext`.
 */
const ctx: WorkerContext = self as unknown as WorkerContext;
/**
 * @constant openscadWorker
 * @description The singleton instance of `OpenSCADWorker`.
 */
const openscadWorker = new OpenSCADWorker(ctx);

// Export worker for Monaco Editor
export default openscadWorker;
