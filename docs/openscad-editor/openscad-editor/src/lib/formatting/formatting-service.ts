/**
 * Formatting Service for OpenSCAD Editor
 * 
 * Integrates AST-based formatting with Monaco editor and provides
 * formatting capabilities through the OpenSCAD parser service.
 */

import * as monaco from 'monaco-editor';
import { OpenSCADParserService } from '../services/openscad-parser-service';
import { ASTFormatter, type FormatResult } from './ast-formatter';
import { type FormattingOptions, DEFAULT_FORMATTING_OPTIONS } from './formatting-rules';

export interface FormattingProvider {
  provideDocumentFormattingEdits(
    model: monaco.editor.ITextModel,
    options: monaco.languages.FormattingOptions,
    token: monaco.CancellationToken
  ): Promise<monaco.languages.TextEdit[]>;

  provideDocumentRangeFormattingEdits(
    model: monaco.editor.ITextModel,
    range: monaco.Range,
    options: monaco.languages.FormattingOptions,
    token: monaco.CancellationToken
  ): Promise<monaco.languages.TextEdit[]>;

  provideOnTypeFormattingEdits(
    model: monaco.editor.ITextModel,
    position: monaco.Position,
    ch: string,
    options: monaco.languages.FormattingOptions,
    token: monaco.CancellationToken
  ): Promise<monaco.languages.TextEdit[]>;
}

export interface FormattingServiceConfig {
  formattingOptions?: Partial<FormattingOptions>;
  enableDocumentFormatting?: boolean;
  enableRangeFormatting?: boolean;
  enableOnTypeFormatting?: boolean;
  onTypeFormatTriggers?: string[];
}

/**
 * Service class that provides AST-based formatting for the OpenSCAD editor
 */
export class FormattingService implements FormattingProvider {
  private parserService: OpenSCADParserService;
  private formatter: ASTFormatter;
  private config: Required<FormattingServiceConfig>;

  constructor(
    parserService: OpenSCADParserService,
    config: FormattingServiceConfig = {}
  ) {
    this.parserService = parserService;
    
    // Merge config with defaults
    this.config = {
      formattingOptions: { ...DEFAULT_FORMATTING_OPTIONS, ...config.formattingOptions },
      enableDocumentFormatting: config.enableDocumentFormatting ?? true,
      enableRangeFormatting: config.enableRangeFormatting ?? true,
      enableOnTypeFormatting: config.enableOnTypeFormatting ?? true,
      onTypeFormatTriggers: config.onTypeFormatTriggers ?? [';', '}', '\n']
    };

    this.formatter = new ASTFormatter(this.config.formattingOptions as FormattingOptions);
  }

  /**
   * Provide formatting edits for the entire document
   */
  async provideDocumentFormattingEdits(
    model: monaco.editor.ITextModel,
    options: monaco.languages.FormattingOptions,
    token: monaco.CancellationToken
  ): Promise<monaco.languages.TextEdit[]> {
    if (!this.config.enableDocumentFormatting) {
      return [];
    }

    try {
      // Check if the parser service is ready
      if (!this.parserService.isReady()) {
        console.warn('Parser service not ready for formatting');
        return [];
      }

      // Get the document content
      const sourceText = model.getValue();
      
      // Parse the document to get the AST
      const parseResult = await this.parserService.parseDocument(sourceText);
      
      if (!parseResult.success || !parseResult.ast) {
        console.warn('Failed to parse document for formatting:', parseResult.errors);
        return [];
      }

      // Update formatter options based on Monaco's formatting options
      const formattingOptions = this.mergeFormattingOptions(options);
      this.formatter = new ASTFormatter(formattingOptions);

      // Format the document
      const formatResult = this.formatter.formatDocument(parseResult.ast, sourceText);

      if (!formatResult.success) {
        console.warn('Formatting failed:', formatResult.errors);
        return [];
      }

      // Create Monaco text edit
      if (formatResult.text === sourceText) {
        return []; // No changes needed
      }

      return [{
        range: model.getFullModelRange(),
        text: formatResult.text
      }];

    } catch (error) {
      console.error('Error in document formatting:', error);
      return [];
    }
  }

  /**
   * Provide formatting edits for a specific range
   */
  async provideDocumentRangeFormattingEdits(
    model: monaco.editor.ITextModel,
    range: monaco.Range,
    options: monaco.languages.FormattingOptions,
    token: monaco.CancellationToken
  ): Promise<monaco.languages.TextEdit[]> {
    if (!this.config.enableRangeFormatting) {
      return [];
    }

    try {
      if (!this.parserService.isReady()) {
        console.warn('Parser service not ready for range formatting');
        return [];
      }

      const sourceText = model.getValue();
      const parseResult = await this.parserService.parseDocument(sourceText);
      
      if (!parseResult.success || !parseResult.ast) {
        console.warn('Failed to parse document for range formatting:', parseResult.errors);
        return [];
      }

      // Update formatter options
      const formattingOptions = this.mergeFormattingOptions(options);
      this.formatter = new ASTFormatter(formattingOptions);

      // Format the range (convert 1-based to 0-based)
      const startLine = range.startLineNumber - 1;
      const endLine = range.endLineNumber - 1;
      
      const formatResult = this.formatter.formatRange(
        parseResult.ast, 
        sourceText, 
        startLine, 
        endLine
      );

      if (!formatResult.success || formatResult.text === sourceText) {
        return [];
      }

      return [{
        range: model.getFullModelRange(),
        text: formatResult.text
      }];

    } catch (error) {
      console.error('Error in range formatting:', error);
      return [];
    }
  }

  /**
   * Provide formatting edits triggered by typing specific characters
   */
  async provideOnTypeFormattingEdits(
    model: monaco.editor.ITextModel,
    position: monaco.Position,
    ch: string,
    options: monaco.languages.FormattingOptions,
    token: monaco.CancellationToken
  ): Promise<monaco.languages.TextEdit[]> {
    if (!this.config.enableOnTypeFormatting || !this.config.onTypeFormatTriggers.includes(ch)) {
      return [];
    }

    try {
      if (!this.parserService.isReady()) {
        return [];
      }

      const sourceText = model.getValue();
      const parseResult = await this.parserService.parseDocument(sourceText);
      
      if (!parseResult.success || !parseResult.ast) {
        return [];
      }

      // Update formatter options
      const formattingOptions = this.mergeFormattingOptions(options);
      this.formatter = new ASTFormatter(formattingOptions);

      // For on-type formatting, we'll format the current line and the previous line
      const currentLine = position.lineNumber - 1; // Convert to 0-based
      const startLine = Math.max(0, currentLine - 1);
      const endLine = currentLine;

      const formatResult = this.formatter.formatRange(
        parseResult.ast,
        sourceText,
        startLine,
        endLine
      );

      if (!formatResult.success || formatResult.changes === 0) {
        return [];
      }

      // For on-type formatting, we typically only want to format the affected lines
      const lines = sourceText.split('\n');
      const formattedLines = formatResult.text.split('\n');
      
      const edits: monaco.languages.TextEdit[] = [];
      
      for (let i = startLine; i <= endLine && i < lines.length && i < formattedLines.length; i++) {
        const originalLine = lines[i];
        const formattedLine = formattedLines[i];
        
        if (originalLine !== undefined && formattedLine !== undefined && originalLine !== formattedLine) {
          edits.push({
            range: new monaco.Range(i + 1, 1, i + 1, originalLine.length + 1),
            text: formattedLine
          });
        }
      }

      return edits;

    } catch (error) {
      console.error('Error in on-type formatting:', error);
      return [];
    }
  }

  /**
   * Format document and return the result
   */
  async formatDocument(sourceText: string): Promise<FormatResult> {
    try {
      if (!this.parserService.isReady()) {
        throw new Error('Parser service not ready');
      }

      const parseResult = await this.parserService.parseDocument(sourceText);
      
      if (!parseResult.success || !parseResult.ast) {
        throw new Error('Failed to parse document: ' + parseResult.errors.join(', '));
      }

      return this.formatter.formatDocument(parseResult.ast, sourceText);
    } catch (error) {
      return {
        text: sourceText,
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        changes: 0
      };
    }
  }

  /**
   * Format a range and return the result
   */
  async formatRange(sourceText: string, startLine: number, endLine: number): Promise<FormatResult> {
    try {
      if (!this.parserService.isReady()) {
        throw new Error('Parser service not ready');
      }

      const parseResult = await this.parserService.parseDocument(sourceText);
      
      if (!parseResult.success || !parseResult.ast) {
        throw new Error('Failed to parse document: ' + parseResult.errors.join(', '));
      }

      return this.formatter.formatRange(parseResult.ast, sourceText, startLine, endLine);
    } catch (error) {
      return {
        text: sourceText,
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        changes: 0
      };
    }
  }

  /**
   * Update formatting configuration
   */
  updateConfig(config: Partial<FormattingServiceConfig>): void {
    this.config = { ...this.config, ...config };
    
    if (config.formattingOptions) {
      const newOptions = { ...this.config.formattingOptions, ...config.formattingOptions };
      this.formatter = new ASTFormatter(newOptions as FormattingOptions);
    }
  }

  /**
   * Get current formatting configuration
   */
  getConfig(): FormattingServiceConfig {
    return { ...this.config };
  }

  /**
   * Get on-type formatting trigger characters
   */
  getOnTypeFormattingTriggers(): string[] {
    return this.config.onTypeFormatTriggers;
  }

  // Private helper methods

  private mergeFormattingOptions(monacoOptions: monaco.languages.FormattingOptions): FormattingOptions {
    const merged = { ...this.config.formattingOptions } as FormattingOptions;
    
    // Map Monaco formatting options to our options
    if (monacoOptions.tabSize !== undefined) {
      merged.indentSize = monacoOptions.tabSize;
    }
    
    if (monacoOptions.insertSpaces !== undefined) {
      merged.useSpaces = monacoOptions.insertSpaces;
    }
    
    return merged;
  }
}

/**
 * Register formatting provider with Monaco editor
 */
export function registerFormattingProvider(
  monaco: typeof import('monaco-editor'),
  languageId: string,
  formattingService: FormattingService
): monaco.IDisposable[] {
  const disposables: monaco.IDisposable[] = [];

  // Register document formatting provider
  disposables.push(
    monaco.languages.registerDocumentFormattingEditProvider(languageId, {
      provideDocumentFormattingEdits: formattingService.provideDocumentFormattingEdits.bind(formattingService)
    })
  );

  // Register range formatting provider
  disposables.push(
    monaco.languages.registerDocumentRangeFormattingEditProvider(languageId, {
      provideDocumentRangeFormattingEdits: formattingService.provideDocumentRangeFormattingEdits.bind(formattingService)
    })
  );

  // Register on-type formatting provider
  const triggers = formattingService.getOnTypeFormattingTriggers();
  if (triggers.length > 0) {
    disposables.push(
      monaco.languages.registerOnTypeFormattingEditProvider(languageId, {
        autoFormatTriggerCharacters: triggers,
        provideOnTypeFormattingEdits: formattingService.provideOnTypeFormattingEdits.bind(formattingService)
      })
    );
  }

  return disposables;
}