/**
 * Enhanced OpenSCAD Completion Provider
 *
 * Provides intelligent code completion for OpenSCAD using advanced AST analysis,
 * Symbol Information API, Position Utilities, and built-in symbol database.
 *
 * Features:
 * - Context-aware completion using Position Utilities
 * - Scope-aware symbol suggestions using Symbol Information API
 * - Parameter hints for functions and modules
 * - Built-in OpenSCAD symbols with documentation
 * - Smart filtering based on completion context
 */

import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { ALL_OPENSCAD_SYMBOLS, OPENSCAD_SNIPPETS, type SymbolInfo } from './openscad-symbols';
import { type OutlineItem, type OpenSCADParserService } from '../services/openscad-parser-service';

// Import real parser APIs for enhanced completion
import {
  OpenSCADSymbolProvider,
  OpenSCADPositionUtilities,
  type SymbolProvider,
  type PositionUtilities,
  type SymbolInfo as ParserSymbolInfo,
  type CompletionContext as ParserCompletionContext,
  type Position,
  type ASTNode
} from '@holistic-stack/openscad-parser';

interface CompletionContext {
  position: monaco.Position;
  model: monaco.editor.ITextModel;
  lineContent: string;
  wordAtPosition: string;
  isInString: boolean;
  isInComment: boolean;
  triggerCharacter?: string | undefined;
  // Enhanced context from Position Utilities
  parserContext?: ParserCompletionContext | undefined;
  availableSymbols: ParserSymbolInfo[];
  contextType: 'module_call' | 'function_call' | 'parameter' | 'expression' | 'statement' | 'assignment' | 'unknown';
  parameterIndex?: number | undefined;
  expectedType?: string | undefined;
}

interface CompletionStats {
  totalSuggestions: number;
  astSymbols: number;
  builtinSymbols: number;
  snippets: number;
  computeTime: number;
}

export class OpenSCADCompletionProvider implements monaco.languages.CompletionItemProvider {
  private parserService: OpenSCADParserService | null = null;
  private symbolProvider: SymbolProvider | null = null;
  private positionUtilities: PositionUtilities | null = null;
  private lastCompletionStats: CompletionStats = {
    totalSuggestions: 0,
    astSymbols: 0,
    builtinSymbols: 0,
    snippets: 0,
    computeTime: 0
  };

  constructor(
    parserService?: OpenSCADParserService,
    symbolProvider?: SymbolProvider,
    positionUtilities?: PositionUtilities
  ) {
    this.parserService = parserService || null;
    this.symbolProvider = symbolProvider || null;
    this.positionUtilities = positionUtilities || null;

    // Initialize real implementations if not provided
    this.initializeRealImplementations();
  }

  /**
   * Initialize real Symbol Provider and Position Utilities implementations
   * This will be called when parser service becomes available
   */
  private initializeRealImplementations(): void {
    // We can't create real implementations without the parser
    // This will be done lazily when the parser service is available
    // For now, just ensure we have the initialization method ready
  }

  /**
   * Initialize real implementations using the parser service
   */
  private initializeWithParserService(): void {
    if (!this.parserService?.isReady()) {
      return;
    }

    try {
      // Get the enhanced parser from the parser service
      const enhancedParser = (this.parserService as any).parser;
      const errorHandler = (this.parserService as any).errorHandler;

      if (!enhancedParser) {
        console.warn('Enhanced parser not available from parser service');
        return;
      }

      // Create real Symbol Provider if not provided
      if (!this.symbolProvider) {
        this.symbolProvider = new OpenSCADSymbolProvider(enhancedParser, errorHandler);
      }

      // Create real Position Utilities if not provided
      if (!this.positionUtilities) {
        // Position Utilities can optionally use Symbol Provider for enhanced context
        this.positionUtilities = new OpenSCADPositionUtilities(this.symbolProvider);
      }
    } catch (error) {
      console.warn('Failed to initialize real parser implementations:', error);
      // Continue with null implementations - will fall back to basic functionality
    }
  }

  triggerCharacters = ['.', '(', '[', ' '];

  async provideCompletionItems(
    model: monaco.editor.ITextModel,
    position: monaco.Position,
    context: monaco.languages.CompletionContext
  ): Promise<monaco.languages.CompletionList> {
    const startTime = performance.now();

    // Initialize real implementations if parser service is available
    this.initializeWithParserService();

    try {
      const completionContext = this.analyzeContext(model, position, context.triggerCharacter);
      const suggestions: monaco.languages.CompletionItem[] = [];

      // Skip completion in strings and comments
      if (completionContext.isInString || completionContext.isInComment) {
        return { suggestions: [] };
      }

      // Get AST-based symbols
      const astSymbols = await this.getASTSymbols(completionContext);
      suggestions.push(...astSymbols);

      // Get built-in OpenSCAD symbols
      const builtinSymbols = this.getBuiltinSymbols(completionContext);
      suggestions.push(...builtinSymbols);

      // Get snippets
      const snippets = this.getSnippets(completionContext);
      suggestions.push(...snippets);

      // Update stats
      const computeTime = performance.now() - startTime;
      this.lastCompletionStats = {
        totalSuggestions: suggestions.length,
        astSymbols: astSymbols.length,
        builtinSymbols: builtinSymbols.length,
        snippets: snippets.length,
        computeTime: Math.round(computeTime * 100) / 100
      };

      // Log completion performance for debugging (consistent with editor package logging style)
      if (process.env['NODE_ENV'] === 'development') {
        console.log(`🔍 Completion: ${suggestions.length} suggestions in ${computeTime.toFixed(2)}ms`);
      }

      return {
        suggestions,
        incomplete: false
      };

    } catch (error) {
      console.error('Completion provider error:', error);
      return { suggestions: [] };
    }
  }

  private analyzeContext(
    model: monaco.editor.ITextModel,
    position: monaco.Position,
    triggerCharacter?: string
  ): CompletionContext {
    const lineContent = model.getLineContent(position.lineNumber);
    const wordInfo = model.getWordAtPosition(position);
    const wordAtPosition = wordInfo?.word || '';

    // Simple heuristics for context detection
    const beforeCursor = lineContent.substring(0, position.column - 1);
    const isInString = this.isInsideString(beforeCursor);
    const isInComment = this.isInsideComment(beforeCursor);

    // Enhanced context analysis using Position Utilities
    let parserContext: ParserCompletionContext | undefined;
    let availableSymbols: ParserSymbolInfo[] | undefined;
    let contextType: CompletionContext['contextType'] = 'unknown';
    let parameterIndex: number | undefined;
    let expectedType: string | undefined;

    // Try to use enhanced parser APIs if available
    if (this.positionUtilities && this.symbolProvider) {
      try {
        // Get the current AST from parser service
        const ast = this.getASTFromParserService();
        if (ast) {
          // Convert Monaco position to parser position (0-based)
          const parserPosition: Position = {
            line: position.lineNumber - 1,
            column: position.column - 1,
            offset: this.calculateOffset(model, position)
          };

          // Get advanced completion context from Position Utilities
          parserContext = this.positionUtilities.getCompletionContext(ast, parserPosition);

          if (parserContext) {
            availableSymbols = parserContext.availableSymbols;
            contextType = parserContext.type;
            parameterIndex = parserContext.parameterIndex;
            expectedType = parserContext.expectedType;
          }

          // Get all symbols from Symbol Provider if not available from context
          if (!availableSymbols) {
            availableSymbols = this.symbolProvider.getSymbols(ast);
          }
        } else {
          // Fallback: try to get symbols without AST (for testing)
          availableSymbols = this.symbolProvider.getSymbols([]);
        }
      } catch (error) {
        console.warn('Error in enhanced context analysis:', error);
        // Fallback: try to get symbols without AST
        try {
          if (this.symbolProvider) {
            availableSymbols = this.symbolProvider.getSymbols([]);
          }
        } catch (fallbackError) {
          console.warn('Fallback symbol retrieval also failed:', fallbackError);
        }
      }
    }

    return {
      position,
      model,
      lineContent,
      wordAtPosition,
      isInString,
      isInComment,
      triggerCharacter,
      parserContext,
      availableSymbols: availableSymbols || [],
      contextType: contextType || 'unknown',
      parameterIndex,
      expectedType
    };
  }

  private isInsideString(text: string): boolean {
    let inString = false;
    let escaped = false;
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      
      if (escaped) {
        escaped = false;
        continue;
      }
      
      if (char === '\\') {
        escaped = true;
        continue;
      }
      
      if (char === '"') {
        inString = !inString;
      }
    }
    
    return inString;
  }

  private isInsideComment(text: string): boolean {
    // Check for single-line comment
    if (text.includes('//')) {
      const commentIndex = text.lastIndexOf('//');
      // Make sure it's not inside a string
      const beforeComment = text.substring(0, commentIndex);
      if (!this.isInsideString(beforeComment)) {
        return true;
      }
    }
    
    // TODO: Add multi-line comment detection
    return false;
  }

  private async getASTSymbols(context: CompletionContext): Promise<monaco.languages.CompletionItem[]> {
    // Use enhanced Symbol Provider if available
    if (context.availableSymbols && context.availableSymbols.length > 0) {
      return this.convertSymbolsToCompletions(context.availableSymbols, context);
    }

    // Try to get symbols using real Symbol Provider
    if (this.symbolProvider && this.parserService?.isReady()) {
      try {
        const ast = this.getASTFromParserService();
        if (ast && ast.length > 0) {
          const symbols = this.symbolProvider.getSymbols(ast);
          return this.convertSymbolsToCompletions(symbols, context);
        }
      } catch (error) {
        console.warn('Error getting symbols from real Symbol Provider:', error);
      }
    }

    // Fallback to parser service outline if parser is ready
    if (this.parserService?.isReady()) {
      try {
        // Get document outline (symbols from AST)
        const outline = this.parserService.getDocumentOutline();
        return this.convertOutlineToCompletions(outline, context);
      } catch (error) {
        console.error('Error getting AST symbols from parser service:', error);
      }
    }

    // If no parser service or it's not ready, return empty array
    return [];
  }

  /**
   * Convert Symbol Provider symbols to Monaco completion items
   */
  private convertSymbolsToCompletions(
    symbols: ParserSymbolInfo[],
    context: CompletionContext
  ): monaco.languages.CompletionItem[] {
    const completions: monaco.languages.CompletionItem[] = [];

    for (const symbol of symbols) {
      // Skip symbols defined after current position (only if location is available)
      if (symbol.loc && symbol.loc.start.line >= context.position.lineNumber - 1) {
        continue;
      }

      // Apply word filtering if there's a word at position
      if (context.wordAtPosition && context.wordAtPosition.length > 0) {
        if (!symbol.name.toLowerCase().startsWith(context.wordAtPosition.toLowerCase())) {
          continue;
        }
      }

      // Filter based on context type
      if (this.shouldIncludeSymbolForContext(symbol, context)) {
        const completion = this.createCompletionFromSymbol(symbol, context);
        if (completion) {
          completions.push(completion);
        }
      }
    }

    return completions;
  }

  private convertOutlineToCompletions(
    outline: OutlineItem[],
    context: CompletionContext
  ): monaco.languages.CompletionItem[] {
    const completions: monaco.languages.CompletionItem[] = [];

    const processOutlineItem = (item: OutlineItem) => {
      // Skip if this symbol is defined after current position
      if (item.range.startLine >= context.position.lineNumber - 1) {
        return;
      }

      const completion: monaco.languages.CompletionItem = {
        label: item.name,
        kind: this.getCompletionKind(item.type),
        detail: `${item.type} (line ${item.range.startLine + 1})`,
        documentation: `User-defined ${item.type}: ${item.name}`,
        insertText: item.name,
        range: {
          startLineNumber: context.position.lineNumber,
          endLineNumber: context.position.lineNumber,
          startColumn: context.position.column - context.wordAtPosition.length,
          endColumn: context.position.column
        },
        sortText: `1_${item.name}` // Prioritize user symbols
      };

      completions.push(completion);

      // Process children recursively
      if (item.children) {
        item.children.forEach(processOutlineItem);
      }
    };

    outline.forEach(processOutlineItem);
    return completions;
  }

  private getBuiltinSymbols(context: CompletionContext): monaco.languages.CompletionItem[] {
    const completions: monaco.languages.CompletionItem[] = [];
    const filter = context.wordAtPosition?.toLowerCase() || '';

    // First pass: try to find symbols that match the filter
    const matchingSymbols: SymbolInfo[] = [];
    const commonSymbols: SymbolInfo[] = [];

    ALL_OPENSCAD_SYMBOLS.forEach(symbol => {
      const shouldFilter = filter.length > 0 && this.shouldFilterSymbol(filter, symbol.name);

      if (!shouldFilter) {
        matchingSymbols.push(symbol);
      }

      // Always collect common symbols as fallback
      if (['cube', 'sphere', 'cylinder', 'translate', 'rotate', 'scale', 'union', 'difference', 'intersection'].includes(symbol.name)) {
        commonSymbols.push(symbol);
      }
    });

    // Use matching symbols if we have any, otherwise use common symbols
    const symbolsToShow = matchingSymbols.length > 0 ? matchingSymbols : commonSymbols;

    symbolsToShow.forEach(symbol => {
      const completion: monaco.languages.CompletionItem = {
        label: symbol.name,
        kind: this.getCompletionKindFromSymbol(symbol),
        detail: `${symbol.type} - ${symbol.category}`,
        documentation: this.createDocumentation(symbol),
        insertText: this.createInsertText(symbol),
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        range: {
          startLineNumber: context.position.lineNumber,
          endLineNumber: context.position.lineNumber,
          startColumn: context.position.column - (context.wordAtPosition?.length || 0),
          endColumn: context.position.column
        },
        sortText: matchingSymbols.includes(symbol) ? `2_${symbol.name}` : `3_${symbol.name}` // Prioritize matching symbols
      };

      completions.push(completion);
    });

    return completions;
  }

  private getSnippets(context: CompletionContext): monaco.languages.CompletionItem[] {
    const completions: monaco.languages.CompletionItem[] = [];
    const filter = context.wordAtPosition.toLowerCase();

    Object.entries(OPENSCAD_SNIPPETS).forEach(([name, snippet]) => {
      // Simple filtering
      if (filter && !name.toLowerCase().startsWith(filter)) {
        return;
      }

      const completion: monaco.languages.CompletionItem = {
        label: name,
        kind: monaco.languages.CompletionItemKind.Snippet,
        detail: 'Snippet',
        documentation: `Code snippet for ${name}`,
        insertText: snippet,
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        range: {
          startLineNumber: context.position.lineNumber,
          endLineNumber: context.position.lineNumber,
          startColumn: context.position.column - context.wordAtPosition.length,
          endColumn: context.position.column
        },
        sortText: `3_${name}` // Lowest priority
      };

      completions.push(completion);
    });

    return completions;
  }

  private getCompletionKind(itemType: string): monaco.languages.CompletionItemKind {
    switch (itemType) {
      case 'module': return monaco.languages.CompletionItemKind.Module;
      case 'function': return monaco.languages.CompletionItemKind.Function;
      case 'variable': return monaco.languages.CompletionItemKind.Variable;
      default: return monaco.languages.CompletionItemKind.Text;
    }
  }

  private getCompletionKindFromSymbol(symbol: SymbolInfo): monaco.languages.CompletionItemKind {
    switch (symbol.type) {
      case 'module': return monaco.languages.CompletionItemKind.Module;
      case 'function': return monaco.languages.CompletionItemKind.Function;
      case 'constant': return monaco.languages.CompletionItemKind.Constant;
      case 'variable': return monaco.languages.CompletionItemKind.Variable;
      default: return monaco.languages.CompletionItemKind.Text;
    }
  }

  private createDocumentation(symbol: SymbolInfo): monaco.IMarkdownString {
    let markdown = `**${symbol.name}** (${symbol.type})\n\n${symbol.description}`;

    if (symbol.parameters && symbol.parameters.length > 0) {
      markdown += '\n\n**Parameters:**\n';
      symbol.parameters.forEach(param => {
        const required = param.required ? '*(required)*' : '*(optional)*';
        const defaultVal = param.defaultValue ? ` = ${param.defaultValue}` : '';
        markdown += `- \`${param.name}\`: ${param.type}${defaultVal} ${required} - ${param.description}\n`;
      });
    }

    if (symbol.returnType) {
      markdown += `\n**Returns:** ${symbol.returnType}`;
    }

    if (symbol.examples && symbol.examples.length > 0) {
      markdown += '\n\n**Examples:**\n```openscad\n';
      symbol.examples.forEach(example => {
        markdown += `${example}\n`;
      });
      markdown += '```';
    }

    return { value: markdown };
  }

  private createInsertText(symbol: SymbolInfo): string {
    if (symbol.type === 'function' && symbol.parameters && symbol.parameters.length > 0) {
      // Create function call with parameter placeholders
      const requiredParams = symbol.parameters.filter(p => p.required);
      if (requiredParams.length > 0) {
        const paramPlaceholders = requiredParams.map((param, index) => 
          `\${${index + 1}:${param.name}}`
        ).join(', ');
        return `${symbol.name}(${paramPlaceholders})`;
      }
    }

    if (symbol.type === 'module' && symbol.parameters && symbol.parameters.length > 0) {
      // Create module call with parameter placeholders
      const requiredParams = symbol.parameters.filter(p => p.required);
      if (requiredParams.length > 0) {
        const paramPlaceholders = requiredParams.map((param, index) => 
          `\${${index + 1}:${param.name}}`
        ).join(', ');
        return `${symbol.name}(${paramPlaceholders})`;
      }
    }

    return symbol.name;
  }

  getLastCompletionStats(): CompletionStats {
    return this.lastCompletionStats;
  }

  setParserService(parserService: OpenSCADParserService): void {
    this.parserService = parserService;
  }

  setSymbolProvider(symbolProvider: SymbolProvider): void {
    this.symbolProvider = symbolProvider;
  }

  setPositionUtilities(positionUtilities: PositionUtilities): void {
    this.positionUtilities = positionUtilities;
  }

  /**
   * Get AST from parser service using the real parser API
   */
  private getASTFromParserService(): ASTNode[] | undefined {
    if (!this.parserService?.isReady()) {
      return undefined;
    }

    try {
      // Get the real AST from the parser service
      const ast = this.parserService.getAST();
      return ast || undefined;
    } catch (error) {
      console.warn('Error getting AST from parser service:', error);
      return undefined;
    }
  }

  /**
   * Calculate character offset from Monaco position
   */
  private calculateOffset(model: monaco.editor.ITextModel, position: monaco.Position): number {
    let offset = 0;
    for (let line = 1; line < position.lineNumber; line++) {
      offset += model.getLineContent(line).length + 1; // +1 for newline
    }
    offset += position.column - 1;
    return offset;
  }

  /**
   * Determine if a symbol should be included based on completion context
   */
  private shouldIncludeSymbolForContext(symbol: ParserSymbolInfo, context: CompletionContext): boolean {
    const symbolKind = symbol.kind;

    // Context-specific filtering
    switch (context.contextType) {
      case 'module_call':
        return symbolKind === 'module';
      case 'function_call':
        return symbolKind === 'function';
      case 'parameter':
        // In parameter context, include variables and parameters
        return ['variable', 'parameter'].includes(symbolKind);
      case 'expression':
        // In expressions, include functions and variables
        return ['function', 'variable', 'constant'].includes(symbolKind);
      case 'statement':
      case 'assignment':
      case 'unknown':
      default:
        // Include all symbols for general contexts
        return true;
    }
  }

  /**
   * Create a Monaco completion item from a parser symbol
   */
  private createCompletionFromSymbol(
    symbol: ParserSymbolInfo,
    context: CompletionContext
  ): monaco.languages.CompletionItem | null {
    const kind = this.getCompletionKindFromParserSymbol(symbol);

    // Create enhanced documentation
    let documentation = symbol.documentation || `${symbol.kind}: ${symbol.name}`;
    if (symbol.parameters && symbol.parameters.length > 0) {
      documentation += '\n\nParameters:\n';
      symbol.parameters.forEach((param: any) => {
        const paramName = param.name || 'unnamed';
        const paramDesc = param.description || 'parameter';
        documentation += `- ${paramName}: ${paramDesc}\n`;
      });
    }

    // Create smart insert text with parameter hints
    const insertText = this.createSmartInsertText(symbol, context);

    return {
      label: symbol.name,
      kind,
      detail: this.createDetailText(symbol),
      documentation: { value: documentation },
      insertText,
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      range: {
        startLineNumber: context.position.lineNumber,
        endLineNumber: context.position.lineNumber,
        startColumn: context.position.column - context.wordAtPosition.length,
        endColumn: context.position.column
      },
      sortText: `1_${symbol.name}` // Prioritize user symbols
    };
  }

  /**
   * Get Monaco completion kind from parser symbol
   */
  private getCompletionKindFromParserSymbol(symbol: ParserSymbolInfo): monaco.languages.CompletionItemKind {
    switch (symbol.kind) {
      case 'module': return monaco.languages.CompletionItemKind.Module;
      case 'function': return monaco.languages.CompletionItemKind.Function;
      case 'variable': return monaco.languages.CompletionItemKind.Variable;
      case 'parameter': return monaco.languages.CompletionItemKind.Variable;
      case 'constant': return monaco.languages.CompletionItemKind.Constant;
      default: return monaco.languages.CompletionItemKind.Text;
    }
  }

  /**
   * Create detail text for completion item
   */
  private createDetailText(symbol: ParserSymbolInfo): string {
    let detail = symbol.kind;
    if (symbol.loc) {
      detail += ` (line ${symbol.loc.start.line + 1})`;
    }
    if (symbol.scope) {
      detail += ` in ${symbol.scope}`;
    }
    return detail;
  }

  /**
   * Create smart insert text with parameter placeholders
   */
  private createSmartInsertText(symbol: ParserSymbolInfo, _context: CompletionContext): string {
    // For functions and modules, add parameter placeholders
    if ((symbol.kind === 'function' || symbol.kind === 'module') && symbol.parameters) {
      const requiredParams = symbol.parameters.filter((p: any) => !p.defaultValue);

      if (requiredParams.length > 0) {
        const paramPlaceholders = requiredParams.map((param: any, index: number) =>
          `\${${index + 1}:${param.name || 'param'}}`
        ).join(', ');
        return `${symbol.name}(${paramPlaceholders})`;
      } else if (symbol.parameters.length > 0) {
        // Has optional parameters
        return `${symbol.name}($1)`;
      } else {
        // No parameters
        return `${symbol.name}()`;
      }
    }

    // For variables and constants, just insert the name
    return symbol.name;
  }

  /**
   * Determine if a symbol should be filtered out based on the current word
   */
  private shouldFilterSymbol(filter: string, symbolName: string): boolean {
    // Don't filter if the filter is a number (like "10")
    if (/^\d+$/.test(filter)) {
      return false;
    }

    // Don't filter if the filter is very short (1-2 characters) unless it's clearly a prefix
    if (filter.length <= 2 && !/^[a-zA-Z_]/.test(filter)) {
      return false;
    }

    // Apply normal prefix filtering for valid identifier-like filters
    return !symbolName.toLowerCase().startsWith(filter.toLowerCase());
  }
}
