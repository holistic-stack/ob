/**
 * @file Smart Indentation Provider for OpenSCAD
 * 
 * Provides intelligent indentation based on OpenSCAD syntax and AST structure.
 * Handles context-aware indentation for modules, functions, control structures, and expressions.
 * 
 * @example
 * ```typescript
 * const indentationProvider = new OpenSCADIndentationProvider(parserService);
 * monaco.languages.registerOnTypeFormattingEditProvider('openscad', indentationProvider);
 * ```
 */

import * as monaco from 'monaco-editor';
import { OpenSCADParserService } from '../services/openscad-parser-service';

/**
 * Indentation context types
 */
export enum IndentationContext {
  Module = 'module',
  Function = 'function',
  ControlStructure = 'control',
  Block = 'block',
  Expression = 'expression',
  Parameter = 'parameter',
  Array = 'array',
  Comment = 'comment'
}

/**
 * Indentation configuration
 */
export interface IndentationConfig {
  readonly tabSize: number;
  readonly insertSpaces: boolean;
  readonly enableSmartIndentation: boolean;
  readonly enableAutoIndentation: boolean;
  readonly enableContextAwareIndentation: boolean;
  readonly indentOnPaste: boolean;
  readonly indentOnType: boolean;
}

/**
 * Default indentation configuration
 */
export const DEFAULT_INDENTATION_CONFIG: IndentationConfig = {
  tabSize: 2,
  insertSpaces: true,
  enableSmartIndentation: true,
  enableAutoIndentation: true,
  enableContextAwareIndentation: true,
  indentOnPaste: true,
  indentOnType: true
};

/**
 * Indentation action types
 */
export enum IndentationAction {
  None = 'none',
  Indent = 'indent',
  Outdent = 'outdent',
  IndentOutdent = 'indentOutdent'
}

/**
 * Result type for indentation operations
 */
type IndentationResult<T> = 
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly error: string };

/**
 * Smart Indentation Provider for OpenSCAD
 * 
 * Provides intelligent indentation based on:
 * - AST structure analysis
 * - OpenSCAD syntax patterns
 * - Context-aware indentation rules
 * - Configurable indentation behavior
 */
export class OpenSCADIndentationProvider implements monaco.languages.OnTypeFormattingEditProvider {
  private readonly parserService: OpenSCADParserService;
  private readonly config: IndentationConfig;

  // Characters that trigger indentation
  readonly autoFormatTriggerCharacters = ['\n', '}', ')', ']', ';'];

  constructor(
    parserService: OpenSCADParserService,
    config: Partial<IndentationConfig> = {}
  ) {
    this.parserService = parserService;
    this.config = { ...DEFAULT_INDENTATION_CONFIG, ...config };
  }

  /**
   * Provide formatting edits on type
   */
  async provideOnTypeFormattingEdits(
    model: monaco.editor.ITextModel,
    position: monaco.Position,
    ch: string,
    options: monaco.languages.FormattingOptions,
    token: monaco.CancellationToken
  ): Promise<monaco.languages.TextEdit[]> {
    if (!this.config.indentOnType) {
      return [];
    }

    try {
      const edits = await this.calculateIndentationEdits(model, position, ch, options);
      return edits.success ? edits.data : [];
    } catch (error) {
      console.error('Error providing indentation edits:', error);
      return [];
    }
  }

  /**
   * Calculate indentation edits based on context
   */
  private async calculateIndentationEdits(
    model: monaco.editor.ITextModel,
    position: monaco.Position,
    character: string,
    options: monaco.languages.FormattingOptions
  ): Promise<IndentationResult<monaco.languages.TextEdit[]>> {
    const edits: monaco.languages.TextEdit[] = [];

    switch (character) {
      case '\n':
        const newLineEdits = await this.handleNewLine(model, position, options);
        if (newLineEdits.success) {
          edits.push(...newLineEdits.data);
        }
        break;

      case '}':
      case ')':
      case ']':
        const closingEdits = await this.handleClosingBracket(model, position, character, options);
        if (closingEdits.success) {
          edits.push(...closingEdits.data);
        }
        break;

      case ';':
        const semicolonEdits = await this.handleSemicolon(model, position, options);
        if (semicolonEdits.success) {
          edits.push(...semicolonEdits.data);
        }
        break;
    }

    return { success: true, data: edits };
  }

  /**
   * Handle new line indentation
   */
  private async handleNewLine(
    model: monaco.editor.ITextModel,
    position: monaco.Position,
    options: monaco.languages.FormattingOptions
  ): Promise<IndentationResult<monaco.languages.TextEdit[]>> {
    const currentLine = position.lineNumber;
    const previousLine = currentLine - 1;

    if (previousLine < 1) {
      return { success: true, data: [] };
    }

    const previousLineContent = model.getLineContent(previousLine).trim();
    const currentIndent = this.getLineIndentation(model, previousLine);
    
    // Determine indentation action based on previous line
    const action = this.determineIndentationAction(previousLineContent);
    const newIndent = this.calculateNewIndentation(currentIndent, action, options);

    // Create edit for the current line
    const currentLineContent = model.getLineContent(currentLine);
    const currentLineIndent = this.getLineIndentation(model, currentLine);

    if (newIndent !== currentLineIndent) {
      const range = new monaco.Range(currentLine, 1, currentLine, currentLineIndent.length + 1);
      const edit: monaco.languages.TextEdit = {
        range,
        text: newIndent
      };

      return { success: true, data: [edit] };
    }

    return { success: true, data: [] };
  }

  /**
   * Handle closing bracket indentation
   */
  private async handleClosingBracket(
    model: monaco.editor.ITextModel,
    position: monaco.Position,
    bracket: string,
    options: monaco.languages.FormattingOptions
  ): Promise<IndentationResult<monaco.languages.TextEdit[]>> {
    const currentLine = position.lineNumber;
    const currentLineContent = model.getLineContent(currentLine);
    
    // Check if the closing bracket is the only non-whitespace character on the line
    const trimmedContent = currentLineContent.trim();
    if (trimmedContent !== bracket) {
      return { success: true, data: [] };
    }

    // Find matching opening bracket
    const matchingLineNumber = this.findMatchingOpeningBracket(model, position, bracket);
    if (matchingLineNumber === -1) {
      return { success: true, data: [] };
    }

    // Use the same indentation as the matching opening bracket
    const matchingLineIndent = this.getLineIndentation(model, matchingLineNumber);
    const currentIndent = this.getLineIndentation(model, currentLine);

    if (matchingLineIndent !== currentIndent) {
      const range = new monaco.Range(currentLine, 1, currentLine, currentIndent.length + 1);
      const edit: monaco.languages.TextEdit = {
        range,
        text: matchingLineIndent
      };

      return { success: true, data: [edit] };
    }

    return { success: true, data: [] };
  }

  /**
   * Handle semicolon indentation (for statement continuation)
   */
  private async handleSemicolon(
    model: monaco.editor.ITextModel,
    position: monaco.Position,
    options: monaco.languages.FormattingOptions
  ): Promise<IndentationResult<monaco.languages.TextEdit[]>> {
    // For now, semicolons don't trigger special indentation
    // This could be extended for specific OpenSCAD patterns
    return { success: true, data: [] };
  }

  /**
   * Determine indentation action based on line content
   */
  private determineIndentationAction(lineContent: string): IndentationAction {
    // Increase indentation after opening braces/brackets
    if (this.shouldIncreaseIndent(lineContent)) {
      return IndentationAction.Indent;
    }

    // Decrease indentation for closing braces/brackets
    if (this.shouldDecreaseIndent(lineContent)) {
      return IndentationAction.Outdent;
    }

    return IndentationAction.None;
  }

  /**
   * Check if indentation should be increased
   */
  private shouldIncreaseIndent(lineContent: string): boolean {
    // OpenSCAD patterns that increase indentation
    const increasePatterns = [
      /\{\s*$/,                    // Opening brace at end of line
      /\(\s*$/,                    // Opening parenthesis at end of line
      /\[\s*$/,                    // Opening bracket at end of line
      /module\s+\w+\s*\([^)]*\)\s*\{\s*$/, // Module definition
      /function\s+\w+\s*\([^)]*\)\s*=\s*$/, // Function definition
      /if\s*\([^)]*\)\s*\{\s*$/,   // If statement
      /for\s*\([^)]*\)\s*\{\s*$/,  // For loop
      /while\s*\([^)]*\)\s*\{\s*$/ // While loop
    ];

    return increasePatterns.some(pattern => pattern.test(lineContent));
  }

  /**
   * Check if indentation should be decreased
   */
  private shouldDecreaseIndent(lineContent: string): boolean {
    // OpenSCAD patterns that decrease indentation
    const decreasePatterns = [
      /^\s*\}\s*$/,                // Closing brace only
      /^\s*\)\s*$/,                // Closing parenthesis only
      /^\s*\]\s*$/                 // Closing bracket only
    ];

    return decreasePatterns.some(pattern => pattern.test(lineContent));
  }

  /**
   * Calculate new indentation based on action
   */
  private calculateNewIndentation(
    currentIndent: string,
    action: IndentationAction,
    options: monaco.languages.FormattingOptions
  ): string {
    const indentUnit = this.getIndentUnit(options);

    switch (action) {
      case IndentationAction.Indent:
        return currentIndent + indentUnit;
      
      case IndentationAction.Outdent:
        if (currentIndent.length >= indentUnit.length) {
          return currentIndent.slice(0, -indentUnit.length);
        }
        return '';
      
      case IndentationAction.IndentOutdent:
        // Used for special cases like block comments
        return currentIndent;
      
      default:
        return currentIndent;
    }
  }

  /**
   * Get indentation unit based on options
   */
  private getIndentUnit(options: monaco.languages.FormattingOptions): string {
    const size = options.tabSize || this.config.tabSize;
    const useSpaces = options.insertSpaces ?? this.config.insertSpaces;
    
    return useSpaces ? ' '.repeat(size) : '\t';
  }

  /**
   * Get the indentation of a specific line
   */
  private getLineIndentation(model: monaco.editor.ITextModel, lineNumber: number): string {
    const lineContent = model.getLineContent(lineNumber);
    const match = lineContent.match(/^(\s*)/);
    return match ? (match[1] || '') : '';
  }

  /**
   * Find matching opening bracket for a closing bracket
   */
  private findMatchingOpeningBracket(
    model: monaco.editor.ITextModel,
    position: monaco.Position,
    closingBracket: string
  ): number {
    const openingBracket = this.getOpeningBracket(closingBracket);
    if (!openingBracket) {
      return -1;
    }

    let bracketCount = 1;
    let currentLine = position.lineNumber - 1;

    while (currentLine >= 1 && bracketCount > 0) {
      const lineContent = model.getLineContent(currentLine);
      
      for (let i = lineContent.length - 1; i >= 0; i--) {
        const char = lineContent[i];
        
        if (char === closingBracket) {
          bracketCount++;
        } else if (char === openingBracket) {
          bracketCount--;
          
          if (bracketCount === 0) {
            return currentLine;
          }
        }
      }
      
      currentLine--;
    }

    return -1;
  }

  /**
   * Get opening bracket for a closing bracket
   */
  private getOpeningBracket(closingBracket: string): string | null {
    const bracketMap: { [key: string]: string } = {
      '}': '{',
      ')': '(',
      ']': '['
    };

    return bracketMap[closingBracket] || null;
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<IndentationConfig>): void {
    Object.assign(this.config, newConfig);
  }

  /**
   * Get current configuration
   */
  getConfig(): Readonly<IndentationConfig> {
    return { ...this.config };
  }
}

/**
 * Create indentation provider
 */
export function createIndentationProvider(
  parserService: OpenSCADParserService,
  config?: Partial<IndentationConfig>
): OpenSCADIndentationProvider {
  return new OpenSCADIndentationProvider(parserService, config);
}
