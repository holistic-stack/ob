/**
 * OpenSCAD Language Worker
 * 
 * Web Worker for OpenSCAD language support in Monaco Editor,
 * providing syntax validation, auto-completion, and language services.
 */

import type { worker } from 'monaco-editor';

// Import OpenSCAD language configuration
import { 
  OPENSCAD_LANGUAGE_CONFIG,
  MONACO_LANGUAGE_CONFIG,
  MONACO_TOKENIZER 
} from '../services/openscad-language';

/**
 * OpenSCAD language worker implementation
 */
export class OpenSCADWorker implements worker.IWorker {
  private _ctx: worker.IWorkerContext;
  private _languageService: OpenSCADLanguageService;

  constructor(ctx: worker.IWorkerContext) {
    this._ctx = ctx;
    this._languageService = new OpenSCADLanguageService();
    
    console.log('[INIT][OpenSCADWorker] OpenSCAD language worker initialized');
  }

  /**
   * Get language service instance
   */
  getLanguageService(): OpenSCADLanguageService {
    return this._languageService;
  }

  /**
   * Validate OpenSCAD code
   */
  async validateCode(code: string): Promise<worker.IMarkerData[]> {
    try {
      return await this._languageService.validateCode(code);
    } catch (error) {
      console.error('[ERROR][OpenSCADWorker] Code validation failed:', error);
      return [];
    }
  }

  /**
   * Get completion suggestions
   */
  async getCompletions(
    code: string, 
    position: { line: number; column: number }
  ): Promise<worker.languages.CompletionItem[]> {
    try {
      return await this._languageService.getCompletions(code, position);
    } catch (error) {
      console.error('[ERROR][OpenSCADWorker] Completion failed:', error);
      return [];
    }
  }

  /**
   * Get hover information
   */
  async getHoverInfo(
    code: string,
    position: { line: number; column: number }
  ): Promise<worker.languages.Hover | null> {
    try {
      return await this._languageService.getHoverInfo(code, position);
    } catch (error) {
      console.error('[ERROR][OpenSCADWorker] Hover info failed:', error);
      return null;
    }
  }
}

/**
 * OpenSCAD language service implementation
 */
class OpenSCADLanguageService {
  private _keywords: Set<string>;
  private _builtinFunctions: Set<string>;
  private _builtinModules: Set<string>;

  constructor() {
    this._keywords = new Set(OPENSCAD_LANGUAGE_CONFIG.keywords);
    this._builtinFunctions = new Set(OPENSCAD_LANGUAGE_CONFIG.builtinFunctions);
    this._builtinModules = new Set(OPENSCAD_LANGUAGE_CONFIG.builtinModules);
  }

  /**
   * Validate OpenSCAD code and return diagnostics
   */
  async validateCode(code: string): Promise<worker.IMarkerData[]> {
    const markers: worker.IMarkerData[] = [];
    const lines = code.split('\n');

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex];
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
   * Get completion suggestions for OpenSCAD
   */
  async getCompletions(
    code: string,
    position: { line: number; column: number }
  ): Promise<worker.languages.CompletionItem[]> {
    const completions: worker.languages.CompletionItem[] = [];

    // Add keyword completions
    this._keywords.forEach(keyword => {
      completions.push({
        label: keyword,
        kind: worker.languages.CompletionItemKind.Keyword,
        insertText: keyword,
        range: {
          startLineNumber: position.line,
          endLineNumber: position.line,
          startColumn: position.column,
          endColumn: position.column
        }
      });
    });

    // Add function completions
    this._builtinFunctions.forEach(func => {
      completions.push({
        label: func,
        kind: worker.languages.CompletionItemKind.Function,
        insertText: `${func}()`,
        insertTextRules: worker.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        range: {
          startLineNumber: position.line,
          endLineNumber: position.line,
          startColumn: position.column,
          endColumn: position.column
        }
      });
    });

    // Add module completions
    this._builtinModules.forEach(module => {
      completions.push({
        label: module,
        kind: worker.languages.CompletionItemKind.Module,
        insertText: `${module}()`,
        insertTextRules: worker.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        range: {
          startLineNumber: position.line,
          endLineNumber: position.line,
          startColumn: position.column,
          endColumn: position.column
        }
      });
    });

    return completions;
  }

  /**
   * Get hover information for OpenSCAD elements
   */
  async getHoverInfo(
    code: string,
    position: { line: number; column: number }
  ): Promise<worker.languages.Hover | null> {
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
          endColumn: position.column
        },
        contents: [{ value: hoverText }]
      };
    }

    return null;
  }

  /**
   * Validate syntax of a line
   */
  private _validateSyntax(line: string, lineNumber: number): worker.IMarkerData[] {
    const markers: worker.IMarkerData[] = [];

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
          severity: worker.MarkerSeverity.Error,
          startLineNumber: lineNumber,
          startColumn: 1,
          endLineNumber: lineNumber,
          endColumn: line.length + 1,
          message: `Unmatched ${bracket === '(' ? 'parenthesis' : bracket === '[' ? 'bracket' : 'brace'}`
        });
      }
    });

    return markers;
  }

  /**
   * Validate semantics of a line
   */
  private _validateSemantics(line: string, lineNumber: number): worker.IMarkerData[] {
    const markers: worker.IMarkerData[] = [];

    // Check for undefined functions/modules
    const words = line.match(/\b\w+\b/g) || [];
    words.forEach(word => {
      if (word.match(/^[a-z_]/i) && 
          !this._keywords.has(word) && 
          !this._builtinFunctions.has(word) && 
          !this._builtinModules.has(word)) {
        // This could be a user-defined function/module, so just warn
        const wordIndex = line.indexOf(word);
        if (wordIndex !== -1) {
          markers.push({
            severity: worker.MarkerSeverity.Info,
            startLineNumber: lineNumber,
            startColumn: wordIndex + 1,
            endLineNumber: lineNumber,
            endColumn: wordIndex + word.length + 1,
            message: `'${word}' is not a built-in OpenSCAD function or module`
          });
        }
      }
    });

    return markers;
  }

  /**
   * Get word at specific position in line
   */
  private _getWordAtPosition(line: string, column: number): string | null {
    const wordRegex = /\b\w+\b/g;
    let match;
    
    while ((match = wordRegex.exec(line)) !== null) {
      const start = match.index;
      const end = match.index + match[0].length;
      
      if (column >= start && column <= end) {
        return match[0];
      }
    }
    
    return null;
  }
}

/**
 * Create and export worker instance
 */
const ctx: worker.IWorkerContext = self as any;
const worker = new OpenSCADWorker(ctx);

// Export worker for Monaco Editor
export default worker;
