/**
 * @file Enhanced Code Completion Provider
 * @description Advanced code completion provider with context-aware suggestions,
 * parameter hints, and intelligent symbol resolution for OpenSCAD
 * 
 * Features:
 * - Context-aware completion based on cursor position
 * - Built-in OpenSCAD function and module completion
 * - User-defined symbol completion from AST
 * - Parameter hints with documentation
 * - Smart filtering and ranking
 * - Performance optimized with caching
 */

import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import type {
  OpenscadParser,
  SymbolInfo,
  ASTNode,
  Position
} from '@holistic-stack/openscad-parser';

/**
 * Enhanced completion item with additional metadata
 */
export interface EnhancedCompletionItem extends monaco.languages.CompletionItem {
  readonly category: 'builtin' | 'user-defined' | 'keyword' | 'parameter';
  readonly documentation?: string;
  readonly parameters?: readonly string[];
  readonly returnType?: string;
  readonly examples?: readonly string[];
}

/**
 * Completion context information
 */
export interface CompletionContext {
  readonly position: monaco.Position;
  readonly lineText: string;
  readonly wordAtPosition: string;
  readonly isInFunction: boolean;
  readonly isInModule: boolean;
  readonly currentScope: readonly string[];
  readonly availableSymbols: readonly SymbolInfo[];
}

/**
 * Enhanced completion provider configuration
 */
export interface EnhancedCompletionConfig {
  readonly enableBuiltinCompletion: boolean;
  readonly enableUserDefinedCompletion: boolean;
  readonly enableParameterHints: boolean;
  readonly enableDocumentation: boolean;
  readonly maxSuggestions: number;
  readonly debounceMs: number;
}

/**
 * Default configuration for enhanced completion
 */
export const DEFAULT_ENHANCED_COMPLETION_CONFIG: EnhancedCompletionConfig = {
  enableBuiltinCompletion: true,
  enableUserDefinedCompletion: true,
  enableParameterHints: true,
  enableDocumentation: true,
  maxSuggestions: 50,
  debounceMs: 100
} as const;

/**
 * Built-in OpenSCAD functions and modules database
 * Note: range property will be added dynamically during completion
 */
const OPENSCAD_BUILTINS_BASE = [
  // Primitive shapes
  {
    label: 'cube',
    kind: 1, // Function
    insertText: 'cube(${1:size})',
    insertTextRules: 4, // InsertAsSnippet
    category: 'builtin' as const,
    documentation: 'Creates a cube with the specified size',
    parameters: ['size', 'center'],
    examples: ['cube(10)', 'cube([10, 20, 30])', 'cube(10, center=true)']
  },
  {
    label: 'sphere',
    kind: 1, // Function
    insertText: 'sphere(${1:r})',
    insertTextRules: 4, // InsertAsSnippet
    category: 'builtin' as const,
    documentation: 'Creates a sphere with the specified radius',
    parameters: ['r', '$fn', '$fa', '$fs'],
    examples: ['sphere(5)', 'sphere(r=10, $fn=32)']
  },
  {
    label: 'cylinder',
    kind: 1, // Function
    insertText: 'cylinder(${1:h}, ${2:r})',
    insertTextRules: 4, // InsertAsSnippet
    category: 'builtin' as const,
    documentation: 'Creates a cylinder with specified height and radius',
    parameters: ['h', 'r', 'r1', 'r2', 'center', '$fn', '$fa', '$fs'],
    examples: ['cylinder(10, 5)', 'cylinder(h=20, r1=5, r2=3)']
  },
  // Transformations
  {
    label: 'translate',
    kind: 1, // Function
    insertText: 'translate([${1:x}, ${2:y}, ${3:z}])',
    insertTextRules: 4, // InsertAsSnippet
    category: 'builtin' as const,
    documentation: 'Translates (moves) objects by the specified vector',
    parameters: ['v'],
    examples: ['translate([10, 0, 0])', 'translate([x, y, z])']
  },
  {
    label: 'rotate',
    kind: 1, // Function
    insertText: 'rotate([${1:x}, ${2:y}, ${3:z}])',
    insertTextRules: 4, // InsertAsSnippet
    category: 'builtin' as const,
    documentation: 'Rotates objects by the specified angles in degrees',
    parameters: ['a', 'v'],
    examples: ['rotate([0, 0, 45])', 'rotate(a=90, v=[1, 0, 0])']
  },
  {
    label: 'scale',
    kind: 1, // Function
    insertText: 'scale([${1:x}, ${2:y}, ${3:z}])',
    insertTextRules: 4, // InsertAsSnippet
    category: 'builtin' as const,
    documentation: 'Scales objects by the specified factors',
    parameters: ['v'],
    examples: ['scale([2, 1, 1])', 'scale(1.5)']
  },
  // Boolean operations
  {
    label: 'union',
    kind: 1, // Function
    insertText: 'union() {\n\t${1:// objects}\n}',
    insertTextRules: 4, // InsertAsSnippet
    category: 'builtin' as const,
    documentation: 'Creates a union of child objects',
    examples: ['union() { cube(10); sphere(5); }']
  },
  {
    label: 'difference',
    kind: 1, // Function
    insertText: 'difference() {\n\t${1:// objects}\n}',
    insertTextRules: 4, // InsertAsSnippet
    category: 'builtin' as const,
    documentation: 'Subtracts child objects from the first object',
    examples: ['difference() { cube(10); sphere(5); }']
  },
  {
    label: 'intersection',
    kind: 1, // Function
    insertText: 'intersection() {\n\t${1:// objects}\n}',
    insertTextRules: 4, // InsertAsSnippet
    category: 'builtin' as const,
    documentation: 'Creates intersection of child objects',
    examples: ['intersection() { cube(10); sphere(8); }']
  },
  // Control structures
  {
    label: 'for',
    kind: 14, // Keyword
    insertText: 'for (${1:i} = [${2:start}:${3:end}]) {\n\t${4:// code}\n}',
    insertTextRules: 4, // InsertAsSnippet
    category: 'keyword' as const,
    documentation: 'For loop for iterating over ranges or lists',
    examples: ['for (i = [0:10]) { ... }', 'for (item = list) { ... }']
  },
  {
    label: 'if',
    kind: 14, // Keyword
    insertText: 'if (${1:condition}) {\n\t${2:// code}\n}',
    insertTextRules: 4, // InsertAsSnippet
    category: 'keyword' as const,
    documentation: 'Conditional statement',
    examples: ['if (x > 0) { ... }', 'if (condition) { ... } else { ... }']
  }
] as const;

/**
 * Enhanced Code Completion Provider
 *
 * Provides intelligent code completion for OpenSCAD with context awareness,
 * built-in function completion, and user-defined symbol resolution.
 *
 * Fixed: Added triggerCharacters property for Monaco Editor compatibility
 */
export class EnhancedCompletionProvider implements monaco.languages.CompletionItemProvider {
  /**
   * Characters that trigger completion
   * Fixed: Added trigger characters to ensure completion is triggered properly by Monaco Editor
   */
  public readonly triggerCharacters = [
    'c', 's', 'r', 't', 'u', 'm', 'p', 'l', 'i', 'f', // Common OpenSCAD function starts
    '.', '(', '[', ' ', '\n' // Structural triggers
  ];

  private readonly parser: OpenscadParser;
  private readonly config: EnhancedCompletionConfig;
  private currentAST: ASTNode[] = [];
  private availableSymbols: SymbolInfo[] = [];
  private completionCache = new Map<string, readonly EnhancedCompletionItem[]>();

  constructor(
    parser: OpenscadParser,
    config: EnhancedCompletionConfig = DEFAULT_ENHANCED_COMPLETION_CONFIG
  ) {
    this.parser = parser;
    this.config = config;
  }

  /**
   * Update the current AST and symbols for completion context
   */
  public updateAST(ast: ASTNode[], symbols: SymbolInfo[] = []): void {
    this.currentAST = ast;
    this.availableSymbols = symbols;
    this.completionCache.clear(); // Clear cache when AST changes
  }

  /**
   * Provide completion items for the given position
   */
  public async provideCompletionItems(
    model: monaco.editor.ITextModel,
    position: monaco.Position
  ): Promise<monaco.languages.CompletionList> {
    try {
      console.log('🚀 [Enhanced Completion Provider] provideCompletionItems called', {
        position: { line: position.lineNumber, column: position.column },
        lineText: model.getLineContent(position.lineNumber)
      });

      const context = this.analyzeCompletionContext(model, position);
      console.log('🔍 [Enhanced Completion Provider] Context analyzed', {
        wordAtPosition: context.wordAtPosition,
        availableSymbolsCount: context.availableSymbols.length,
        isInFunction: context.isInFunction,
        isInModule: context.isInModule
      });

      const completionItems = await this.generateCompletionItems(context);
      console.log('✅ [Enhanced Completion Provider] Generated completions', {
        totalItems: completionItems.length,
        maxSuggestions: this.config.maxSuggestions,
        items: completionItems.slice(0, 5).map(item => typeof item.label === 'string' ? item.label : item.label.label)
      });

      return {
        suggestions: completionItems.slice(0, this.config.maxSuggestions),
        incomplete: completionItems.length > this.config.maxSuggestions
      };
    } catch (error) {
      console.error('❌ [Enhanced Completion Provider] Error providing completions:', error);
      return { suggestions: [] };
    }
  }

  /**
   * Analyze the completion context at the given position
   */
  private analyzeCompletionContext(
    model: monaco.editor.ITextModel,
    position: monaco.Position
  ): CompletionContext {
    const lineText = model.getLineContent(position.lineNumber);
    const wordInfo = model.getWordAtPosition(position);
    const wordAtPosition = wordInfo?.word || '';

    // Extract available symbols from current state
    const availableSymbols = this.availableSymbols;

    // Determine current scope context
    const currentScope = this.getCurrentScope(model, position);

    return {
      position,
      lineText,
      wordAtPosition,
      isInFunction: this.isInFunctionContext(lineText),
      isInModule: this.isInModuleContext(lineText),
      currentScope,
      availableSymbols
    };
  }

  /**
   * Generate completion items based on context
   */
  private async generateCompletionItems(
    context: CompletionContext
  ): Promise<readonly EnhancedCompletionItem[]> {
    const cacheKey = this.createCacheKey(context);
    
    if (this.completionCache.has(cacheKey)) {
      return this.completionCache.get(cacheKey)!;
    }

    const items: EnhancedCompletionItem[] = [];

    // Add built-in completions
    if (this.config.enableBuiltinCompletion) {
      items.push(...this.getBuiltinCompletions(context));
    }

    // Add user-defined symbol completions
    if (this.config.enableUserDefinedCompletion) {
      items.push(...this.getUserDefinedCompletions(context));
    }

    // Filter and rank completions
    const filteredItems = this.filterAndRankCompletions(items, context);

    this.completionCache.set(cacheKey, filteredItems);
    return filteredItems;
  }

  /**
   * Get built-in OpenSCAD function completions
   */
  private getBuiltinCompletions(context: CompletionContext): readonly EnhancedCompletionItem[] {
    const query = context.wordAtPosition.toLowerCase();

    return OPENSCAD_BUILTINS_BASE
      .filter(item => {
        const label = item.label; // item.label is always string in our case
        // If no query (empty string), show all completions
        // Otherwise, filter by query
        return query === '' || label.toLowerCase().includes(query);
      })
      .map(item => ({
        ...item,
        range: {
          startLineNumber: context.position.lineNumber,
          endLineNumber: context.position.lineNumber,
          startColumn: context.position.column - context.wordAtPosition.length,
          endColumn: context.position.column
        }
      }));
  }

  /**
   * Get user-defined symbol completions from AST
   */
  private getUserDefinedCompletions(context: CompletionContext): readonly EnhancedCompletionItem[] {
    return context.availableSymbols.map(symbol => ({
      label: symbol.name,
      kind: this.getCompletionKind(symbol.kind),
      insertText: this.generateInsertText(symbol),
      insertTextRules: symbol.kind === 'function' || symbol.kind === 'module' ? 4 : 0,
      category: 'user-defined' as const,
      documentation: `User-defined ${symbol.kind}: ${symbol.name}`,
      parameters: (symbol.parameters || []).map(param =>
        typeof param === 'string' ? param : param.name || 'param'
      ),
      range: {
        startLineNumber: context.position.lineNumber,
        endLineNumber: context.position.lineNumber,
        startColumn: context.position.column - context.wordAtPosition.length,
        endColumn: context.position.column
      }
    }));
  }

  /**
   * Filter and rank completion items based on relevance
   */
  private filterAndRankCompletions(
    items: readonly EnhancedCompletionItem[],
    context: CompletionContext
  ): readonly EnhancedCompletionItem[] {
    const query = context.wordAtPosition.toLowerCase();

    return items
      .filter(item => {
        const label = typeof item.label === 'string' ? item.label : item.label.label;
        // If no query (empty string), show all items
        // Otherwise, filter by query
        return query === '' || label.toLowerCase().includes(query);
      })
      .sort((a, b) => {
        const aLabel = typeof a.label === 'string' ? a.label : a.label.label;
        const bLabel = typeof b.label === 'string' ? b.label : b.label.label;

        // If no query, just sort by category and alphabetically
        if (query === '') {
          // Prioritize by category (builtin > user-defined > keyword)
          const categoryOrder = { builtin: 0, 'user-defined': 1, keyword: 2, parameter: 3 };
          const aOrder = categoryOrder[a.category] || 4;
          const bOrder = categoryOrder[b.category] || 4;
          if (aOrder !== bOrder) return aOrder - bOrder;

          // Alphabetical order
          return aLabel.localeCompare(bLabel);
        }

        // Prioritize exact matches
        const aExact = aLabel.toLowerCase().startsWith(query) ? 0 : 1;
        const bExact = bLabel.toLowerCase().startsWith(query) ? 0 : 1;
        if (aExact !== bExact) return aExact - bExact;

        // Prioritize by category (builtin > user-defined > keyword)
        const categoryOrder = { builtin: 0, 'user-defined': 1, keyword: 2, parameter: 3 };
        const aOrder = categoryOrder[a.category] || 4;
        const bOrder = categoryOrder[b.category] || 4;
        if (aOrder !== bOrder) return aOrder - bOrder;

        // Alphabetical order
        return aLabel.localeCompare(bLabel);
      });
  }

  /**
   * Helper methods for context analysis
   */
  private isInFunctionContext(lineText: string): boolean {
    return /function\s+\w+\s*\([^)]*$/.test(lineText);
  }

  private isInModuleContext(lineText: string): boolean {
    return /module\s+\w+\s*\([^)]*$/.test(lineText);
  }

  private getCurrentScope(model: monaco.editor.ITextModel, position: monaco.Position): readonly string[] {
    // Simple scope detection - could be enhanced with AST analysis
    const lines = model.getLinesContent().slice(0, position.lineNumber);
    const scope: string[] = [];
    
    for (const line of lines) {
      const moduleMatch = line.match(/module\s+(\w+)/);
      const functionMatch = line.match(/function\s+(\w+)/);
      
      if (moduleMatch && moduleMatch[1]) scope.push(moduleMatch[1]);
      if (functionMatch && functionMatch[1]) scope.push(functionMatch[1]);
    }
    
    return scope;
  }

  private getCompletionKind(symbolType: string): monaco.languages.CompletionItemKind {
    switch (symbolType) {
      case 'module': return 1; // Function
      case 'function': return 1; // Function
      case 'variable': return 6; // Variable
      case 'parameter': return 6; // Variable
      default: return 18; // Text
    }
  }

  private generateInsertText(symbol: SymbolInfo): string {
    if (symbol.kind === 'function' || symbol.kind === 'module') {
      const params = symbol.parameters || [];
      if (params.length === 0) {
        return `${symbol.name}()`;
      }
      const paramSnippets = params.map((param, index) => {
        const paramName = typeof param === 'string' ? param : param.name || `param${index + 1}`;
        return `\${${index + 1}:${paramName}}`;
      }).join(', ');
      return `${symbol.name}(${paramSnippets})`;
    }
    return symbol.name;
  }

  private createCacheKey(context: CompletionContext): string {
    return `${context.wordAtPosition}-${context.isInFunction}-${context.isInModule}-${context.availableSymbols.length}`;
  }
}

/**
 * Factory function to create enhanced completion provider
 */
export function createEnhancedCompletionProvider(
  parser: OpenscadParser,
  config?: Partial<EnhancedCompletionConfig>
): EnhancedCompletionProvider {
  const finalConfig = { ...DEFAULT_ENHANCED_COMPLETION_CONFIG, ...config };
  return new EnhancedCompletionProvider(parser, finalConfig);
}
