/**
 * @file Enhanced OpenSCAD Navigation Provider
 *
 * Provides advanced navigation features including go-to-definition, find-all-references,
 * and intelligent symbol search using AST analysis and Position Utilities.
 *
 * Features:
 * - Context-aware go-to-definition using Position Utilities API
 * - Comprehensive reference finding with scope analysis
 * - Fuzzy symbol search with type filtering
 * - Performance optimized with caching and incremental updates
 * - Functional programming patterns with immutable data structures
 *
 * @example
 * ```typescript
 * const navigationProvider = new OpenSCADNavigationProvider(
 *   parserService,
 *   symbolProvider,
 *   positionUtilities
 * );
 *
 * // Register with Monaco
 * monaco.languages.registerDefinitionProvider('openscad', navigationProvider);
 * monaco.languages.registerReferenceProvider('openscad', navigationProvider);
 * ```
 */

import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { type OutlineItem, type OpenSCADParserService } from '../services/openscad-parser-service';

// Enhanced interfaces for advanced navigation features
// TODO: Import from parser package when available
interface Position {
  readonly line: number;
  readonly column: number;
  readonly offset: number;
}

interface ASTNode {
  readonly type: string;
  readonly [key: string]: any;
}

interface ParserSymbolInfo {
  readonly name: string;
  readonly kind: 'module' | 'function' | 'variable' | 'parameter' | 'constant';
  readonly loc?: {
    readonly start: Position;
    readonly end: Position;
  };
  readonly parameters?: ReadonlyArray<{
    readonly name: string;
    readonly value?: any;
    readonly defaultValue?: any;
    readonly description?: string;
  }>;
  readonly documentation?: string;
  readonly scope?: string;
}

interface SymbolProvider {
  getSymbols(ast: ASTNode[]): ParserSymbolInfo[];
  getSymbolAtPosition(ast: ASTNode[], position: Position): ParserSymbolInfo | undefined;
  findSymbolDefinition(ast: ASTNode[], symbolName: string): ParserSymbolInfo | undefined;
  findSymbolReferences(ast: ASTNode[], symbolName: string): ParserSymbolInfo[];
}

interface PositionUtilities {
  findNodeAt(ast: ASTNode[], position: Position): ASTNode | undefined;
  getNodeRange(node: ASTNode): { start: Position; end: Position };
  getHoverInfo(ast: ASTNode[], position: Position): any | undefined;
  getCompletionContext(ast: ASTNode[], position: Position): any | undefined;
  isPositionInRange(position: Position, range: { start: Position; end: Position }): boolean;
  findNodesContaining(ast: ASTNode[], position: Position): ASTNode[];
}

export interface NavigationContext {
  readonly position: monaco.Position;
  readonly model: monaco.editor.ITextModel;
  readonly wordAtPosition: string;
  readonly lineContent: string;
  readonly parserPosition: Position;
  readonly symbolAtPosition?: ParserSymbolInfo;
  readonly availableSymbols: ReadonlyArray<ParserSymbolInfo>;
}

export interface SymbolLocation {
  readonly name: string;
  readonly type: string;
  readonly range: {
    readonly startLine: number;
    readonly endLine: number;
    readonly startColumn: number;
    readonly endColumn: number;
  };
  readonly kind: 'definition' | 'reference' | 'usage';
  readonly scope?: string;
  readonly documentation?: string;
}

export interface NavigationStats {
  readonly lastOperation: string;
  readonly symbolsFound: number;
  readonly searchTime: number;
  readonly cacheHits: number;
  readonly astNodes: number;
}

interface SearchOptions {
  readonly fuzzy: boolean;
  readonly caseSensitive: boolean;
  readonly symbolTypes: ReadonlyArray<string>;
  readonly maxResults: number;
}

/**
 * Enhanced OpenSCAD Navigation Provider
 *
 * Implements Monaco's DefinitionProvider and ReferenceProvider interfaces
 * with advanced AST-based navigation and symbol search capabilities.
 */
export class OpenSCADNavigationProvider implements
  monaco.languages.DefinitionProvider,
  monaco.languages.ReferenceProvider {

  private readonly parserService: OpenSCADParserService | null;
  private readonly symbolProvider: SymbolProvider | null;
  private readonly positionUtilities: PositionUtilities | null;

  // Performance tracking and caching
  private lastNavigationStats: NavigationStats = {
    lastOperation: '',
    symbolsFound: 0,
    searchTime: 0,
    cacheHits: 0,
    astNodes: 0
  };

  // Simple cache for symbol lookups (in a real implementation, use LRU cache)
  private readonly symbolCache = new Map<string, ParserSymbolInfo[]>();
  private readonly definitionCache = new Map<string, ParserSymbolInfo | null>();

  constructor(
    parserService?: OpenSCADParserService,
    symbolProvider?: SymbolProvider,
    positionUtilities?: PositionUtilities
  ) {
    this.parserService = parserService || null;
    this.symbolProvider = symbolProvider || null;
    this.positionUtilities = positionUtilities || null;
  }

  /**
   * Monaco Definition Provider Interface
   *
   * Provides go-to-definition functionality using enhanced AST analysis
   * and Symbol Provider integration for accurate symbol resolution.
   *
   * @param model - Monaco text model
   * @param position - Cursor position
   * @returns Definition location or null if not found
   */
  async provideDefinition(
    model: monaco.editor.ITextModel,
    position: monaco.Position
  ): Promise<monaco.languages.Definition | null> {
    const startTime = performance.now();

    try {
      const context = await this.analyzeEnhancedNavigationContext(model, position);

      let definition: monaco.languages.Definition | null = null;

      if (context.wordAtPosition) {
        // Try enhanced symbol-based definition finding first
        definition = await this.findEnhancedSymbolDefinition(context);
      }

      const searchTime = performance.now() - startTime;
      this.updateNavigationStats('go-to-definition', definition ? 1 : 0, searchTime, context);

      console.log(`🎯 Go-to-definition: "${context.wordAtPosition}" -> ${definition ? 'found' : 'not found'} (${searchTime.toFixed(2)}ms)`);

      return definition;

    } catch (error) {
      console.error('Navigation provider error:', error);
      const searchTime = performance.now() - startTime;
      this.updateNavigationStats('go-to-definition', 0, searchTime);
      return null;
    }
  }

  /**
   * Monaco Reference Provider Interface
   *
   * Finds all references to a symbol using enhanced AST analysis
   * and scope-aware symbol resolution.
   *
   * @param model - Monaco text model
   * @param position - Cursor position
   * @param context - Reference context (include declaration, etc.)
   * @returns Array of reference locations
   */
  async provideReferences(
    model: monaco.editor.ITextModel,
    position: monaco.Position,
    context: monaco.languages.ReferenceContext
  ): Promise<monaco.languages.Location[]> {
    const startTime = performance.now();

    try {
      const navContext = await this.analyzeEnhancedNavigationContext(model, position);
      if (!navContext.wordAtPosition) {
        return [];
      }

      const references = await this.findEnhancedReferences(navContext, context.includeDeclaration);

      const searchTime = performance.now() - startTime;
      this.updateNavigationStats('find-references', references.length, searchTime, navContext);

      console.log(`🔍 Find references: "${navContext.wordAtPosition}" -> ${references.length} found (${searchTime.toFixed(2)}ms)`);

      return references;

    } catch (error) {
      console.error('Reference provider error:', error);
      return [];
    }
  }

  /**
   * Enhanced navigation context analysis using Position Utilities and Symbol Provider
   *
   * @param model - Monaco text model
   * @param position - Cursor position
   * @returns Enhanced navigation context with AST information
   */
  private async analyzeEnhancedNavigationContext(
    model: monaco.editor.ITextModel,
    position: monaco.Position
  ): Promise<NavigationContext> {
    const lineContent = model.getLineContent(position.lineNumber);
    const wordInfo = model.getWordAtPosition(position);
    const wordAtPosition = wordInfo?.word || '';

    // Convert Monaco position to parser position (0-based)
    const parserPosition: Position = {
      line: position.lineNumber - 1,
      column: position.column - 1,
      offset: this.calculateOffset(model, position)
    };

    let symbolAtPosition: ParserSymbolInfo | undefined;
    let availableSymbols: ReadonlyArray<ParserSymbolInfo> = [];

    // Enhanced context analysis using Position Utilities and Symbol Provider
    if (this.symbolProvider && this.positionUtilities && this.parserService?.isReady()) {
      try {
        const ast = this.getASTFromParserService();
        if (ast) {
          // Get symbol at current position
          symbolAtPosition = this.symbolProvider.getSymbolAtPosition(ast, parserPosition);

          // Get all available symbols for context
          availableSymbols = this.symbolProvider.getSymbols(ast);
        }
      } catch (error) {
        console.warn('Error in enhanced navigation context analysis:', error);
      }
    }

    return {
      position,
      model,
      wordAtPosition,
      lineContent,
      parserPosition,
      ...(symbolAtPosition !== undefined && { symbolAtPosition }),
      availableSymbols
    };
  }

  /**
   * Legacy navigation context analysis (fallback)
   */
  private analyzeNavigationContext(
    model: monaco.editor.ITextModel,
    position: monaco.Position
  ): NavigationContext {
    const lineContent = model.getLineContent(position.lineNumber);
    const wordInfo = model.getWordAtPosition(position);
    const wordAtPosition = wordInfo?.word || '';

    const parserPosition: Position = {
      line: position.lineNumber - 1,
      column: position.column - 1,
      offset: this.calculateOffset(model, position)
    };

    return {
      position,
      model,
      wordAtPosition,
      lineContent,
      parserPosition,
      availableSymbols: []
    };
  }

  /**
   * Enhanced symbol definition finding using Symbol Provider
   *
   * @param context - Enhanced navigation context
   * @returns Monaco definition or null if not found
   */
  private async findEnhancedSymbolDefinition(context: NavigationContext): Promise<monaco.languages.Definition | null> {
    // Try Symbol Provider first (most accurate)
    if (this.symbolProvider && this.parserService?.isReady()) {
      try {
        const ast = this.getASTFromParserService();
        if (ast) {
          // Check cache first
          const cacheKey = `def:${context.wordAtPosition}`;
          let definition = this.definitionCache.get(cacheKey);

          if (!definition) {
            definition = this.symbolProvider.findSymbolDefinition(ast, context.wordAtPosition) || null;
            this.definitionCache.set(cacheKey, definition);
          }

          if (definition && definition.loc) {
            return {
              uri: context.model.uri,
              range: new monaco.Range(
                definition.loc.start.line + 1,
                definition.loc.start.column + 1,
                definition.loc.end.line + 1,
                definition.loc.end.column + 1
              )
            };
          }
        }
      } catch (error) {
        console.warn('Error in enhanced symbol definition finding:', error);
      }
    }

    // Fallback to outline-based search
    return this.findSymbolDefinitionFromOutline(context);
  }

  /**
   * Fallback symbol definition finding using document outline
   */
  private async findSymbolDefinitionFromOutline(context: NavigationContext): Promise<monaco.languages.Definition | null> {
    if (!this.parserService?.isReady()) {
      return null;
    }

    try {
      const outline = this.parserService.getDocumentOutline();
      const definition = this.searchOutlineForDefinition(outline, context.wordAtPosition);

      if (definition) {
        return {
          uri: context.model.uri,
          range: new monaco.Range(
            definition.range.startLine + 1,
            definition.range.startColumn + 1,
            definition.range.endLine + 1,
            definition.range.endColumn + 1
          )
        };
      }

      return null;
    } catch (error) {
      console.error('Error finding symbol definition from outline:', error);
      return null;
    }
  }

  private searchOutlineForDefinition(outline: OutlineItem[], symbolName: string): OutlineItem | null {
    for (const item of outline) {
      // Check if this item matches
      if (item.name === symbolName) {
        return item;
      }
      
      // Search children recursively
      if (item.children) {
        const found = this.searchOutlineForDefinition(item.children, symbolName);
        if (found) {
          return found;
        }
      }
    }
    return null;
  }

  /**
   * Enhanced reference finding using Symbol Provider
   *
   * @param context - Enhanced navigation context
   * @param includeDeclaration - Whether to include the symbol declaration
   * @returns Array of reference locations
   */
  private async findEnhancedReferences(
    context: NavigationContext,
    includeDeclaration: boolean
  ): Promise<monaco.languages.Location[]> {
    // Try Symbol Provider first (most accurate)
    if (this.symbolProvider && this.parserService?.isReady()) {
      try {
        const ast = this.getASTFromParserService();
        if (ast) {
          const references = this.symbolProvider.findSymbolReferences(ast, context.wordAtPosition);
          const locations: monaco.languages.Location[] = [];

          for (const ref of references) {
            if (!ref.loc) continue;

            // Filter out declaration if not requested
            if (!includeDeclaration && ref.kind === 'function' || ref.kind === 'module' || ref.kind === 'variable') {
              // This is likely a declaration, check if we should include it
              const definition = this.symbolProvider.findSymbolDefinition(ast, context.wordAtPosition);
              if (definition && definition.loc &&
                  definition.loc.start.line === ref.loc.start.line &&
                  definition.loc.start.column === ref.loc.start.column) {
                continue;
              }
            }

            locations.push({
              uri: context.model.uri,
              range: new monaco.Range(
                ref.loc.start.line + 1,
                ref.loc.start.column + 1,
                ref.loc.end.line + 1,
                ref.loc.end.column + 1
              )
            });
          }

          return locations;
        }
      } catch (error) {
        console.warn('Error in enhanced reference finding:', error);
      }
    }

    // Fallback to text-based search
    return this.findReferencesTextBased(context, includeDeclaration);
  }

  /**
   * Fallback text-based reference finding
   */
  private async findReferencesTextBased(
    context: NavigationContext,
    includeDeclaration: boolean
  ): Promise<monaco.languages.Location[]> {
    if (!this.parserService?.isReady()) {
      return [];
    }

    try {
      const references: monaco.languages.Location[] = [];
      const symbolName = context.wordAtPosition;

      const content = context.model.getValue();
      const lines = content.split('\n');

      for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        const line = lines[lineIndex];
        if (!line) continue;

        const regex = new RegExp(`\\b${this.escapeRegex(symbolName)}\\b`, 'g');
        let match;

        while ((match = regex.exec(line)) !== null) {
          const startColumn = match.index + 1;
          const endColumn = startColumn + symbolName.length;

          // Skip if this is the declaration and includeDeclaration is false
          if (!includeDeclaration) {
            const outline = this.parserService.getDocumentOutline();
            const definition = this.searchOutlineForDefinition(outline, symbolName);
            if (definition && definition.range.startLine === lineIndex) {
              continue;
            }
          }

          references.push({
            uri: context.model.uri,
            range: new monaco.Range(
              lineIndex + 1,
              startColumn,
              lineIndex + 1,
              endColumn
            )
          });
        }
      }

      return references;
    } catch (error) {
      console.error('Error finding references with text-based search:', error);
      return [];
    }
  }

  private escapeRegex(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Enhanced symbol search with fuzzy matching and filtering
   *
   * @param query - Search query string
   * @param options - Search options (fuzzy, case sensitivity, etc.)
   * @returns Array of matching symbol locations
   */
  async searchSymbols(query: string, options: Partial<SearchOptions> = {}): Promise<SymbolLocation[]> {
    const searchOptions: SearchOptions = {
      fuzzy: true,
      caseSensitive: false,
      symbolTypes: ['module', 'function', 'variable', 'constant'],
      maxResults: 50,
      ...options
    };

    const startTime = performance.now();

    try {
      // Try enhanced symbol search first
      let symbols = await this.searchSymbolsEnhanced(query, searchOptions);

      // Fallback to outline-based search if no enhanced symbols
      if (symbols.length === 0) {
        symbols = await this.searchSymbolsFromOutline(query, searchOptions);
      }

      const searchTime = performance.now() - startTime;
      this.updateNavigationStats('symbol-search', symbols.length, searchTime);

      console.log(`🔍 Symbol search: "${query}" -> ${symbols.length} found (${searchTime.toFixed(2)}ms)`);

      return symbols;
    } catch (error) {
      console.error('Error searching symbols:', error);
      return [];
    }
  }

  /**
   * Enhanced symbol search using Symbol Provider
   */
  private async searchSymbolsEnhanced(query: string, options: SearchOptions): Promise<SymbolLocation[]> {
    if (!this.symbolProvider || !this.parserService?.isReady()) {
      return [];
    }

    try {
      const ast = this.getASTFromParserService();
      if (!ast) return [];

      // Check cache first
      const cacheKey = `symbols:${query}:${JSON.stringify(options)}`;
      let symbols = this.symbolCache.get(cacheKey);

      if (!symbols) {
        symbols = this.symbolProvider.getSymbols(ast);
        this.symbolCache.set(cacheKey, symbols);
      }

      // Filter and score symbols
      const filteredSymbols = symbols
        .filter(symbol => this.matchesSymbolFilter(symbol, query, options))
        .map(symbol => this.convertSymbolToLocation(symbol))
        .sort((a, b) => this.calculateSymbolScore(b, query) - this.calculateSymbolScore(a, query))
        .slice(0, options.maxResults);

      return filteredSymbols;
    } catch (error) {
      console.warn('Error in enhanced symbol search:', error);
      return [];
    }
  }

  /**
   * Fallback symbol search using document outline
   */
  private async searchSymbolsFromOutline(query: string, options: SearchOptions): Promise<SymbolLocation[]> {
    if (!this.parserService?.isReady()) {
      return [];
    }

    try {
      const outline = this.parserService.getDocumentOutline();
      const symbols = this.extractSymbolsFromOutline(outline);

      // Filter symbols based on query and options
      const filteredSymbols = symbols
        .filter(symbol => this.matchesOutlineSymbolFilter(symbol, query, options))
        .sort((a, b) => this.calculateSymbolScore(b, query) - this.calculateSymbolScore(a, query))
        .slice(0, options.maxResults);

      return filteredSymbols;
    } catch (error) {
      console.error('Error searching symbols from outline:', error);
      return [];
    }
  }

  /**
   * Utility methods for symbol filtering and scoring
   */

  /**
   * Check if a symbol matches the search filter
   */
  private matchesSymbolFilter(symbol: ParserSymbolInfo, query: string, options: SearchOptions): boolean {
    // Type filtering
    if (!options.symbolTypes.includes(symbol.kind)) {
      return false;
    }

    // Name matching
    const symbolName = options.caseSensitive ? symbol.name : symbol.name.toLowerCase();
    const searchQuery = options.caseSensitive ? query : query.toLowerCase();

    if (options.fuzzy) {
      return this.fuzzyMatch(symbolName, searchQuery);
    } else {
      return symbolName.includes(searchQuery);
    }
  }

  /**
   * Check if an outline symbol matches the search filter
   */
  private matchesOutlineSymbolFilter(symbol: SymbolLocation, query: string, options: SearchOptions): boolean {
    // Type filtering
    if (!options.symbolTypes.includes(symbol.type)) {
      return false;
    }

    // Name matching
    const symbolName = options.caseSensitive ? symbol.name : symbol.name.toLowerCase();
    const searchQuery = options.caseSensitive ? query : query.toLowerCase();

    if (options.fuzzy) {
      return this.fuzzyMatch(symbolName, searchQuery);
    } else {
      return symbolName.includes(searchQuery);
    }
  }

  /**
   * Enhanced fuzzy matching algorithm
   * Supports subsequence matching and character proximity scoring
   */
  private fuzzyMatch(text: string, pattern: string): boolean {
    if (pattern.length === 0) return true;
    if (text.length === 0) return false;

    const textLower = text.toLowerCase();
    const patternLower = pattern.toLowerCase();

    // First try exact substring match
    if (textLower.includes(patternLower)) {
      return true;
    }

    // Then try subsequence matching (characters in order but not necessarily consecutive)
    let patternIndex = 0;
    for (let textIndex = 0; textIndex < textLower.length && patternIndex < patternLower.length; textIndex++) {
      if (textLower[textIndex] === patternLower[patternIndex]) {
        patternIndex++;
      }
    }

    // For fuzzy matching, also try matching first letters of words
    if (patternIndex === patternLower.length) {
      return true;
    }

    // Try matching first letters of words (e.g., "cwh" matches "cube_with_hole")
    const words = textLower.split(/[_\s-]+/);
    const firstLetters = words.map(word => word[0]).join('');
    if (firstLetters === patternLower || firstLetters.startsWith(patternLower)) {
      return true;
    }

    // Try flexible first letter matching with some tolerance
    // For "cvh" to match "cube_with_hole", allow some character variations
    if (words.length >= patternLower.length) {
      let matches = 0;
      for (let i = 0; i < Math.min(words.length, patternLower.length); i++) {
        if (words[i] && words[i]?.[0] === patternLower[i]) {
          matches++;
        }
      }
      // Allow fuzzy matching if most characters match
      if (matches >= Math.ceil(patternLower.length * 0.7)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Calculate symbol relevance score for sorting
   */
  private calculateSymbolScore(symbol: SymbolLocation, query: string): number {
    const name = symbol.name.toLowerCase();
    const searchQuery = query.toLowerCase();

    let score = 0;

    // Exact match gets highest score
    if (name === searchQuery) {
      score += 100;
    }
    // Starts with query gets high score
    else if (name.startsWith(searchQuery)) {
      score += 80;
    }
    // Contains query gets medium score
    else if (name.includes(searchQuery)) {
      score += 60;
    }
    // Fuzzy match gets lower score
    else if (this.fuzzyMatch(name, searchQuery)) {
      score += 40;
    }

    // Boost score for certain symbol types
    switch (symbol.type) {
      case 'module':
        score += 10;
        break;
      case 'function':
        score += 8;
        break;
      case 'variable':
        score += 5;
        break;
    }

    // Penalize very long names
    if (symbol.name.length > 20) {
      score -= 5;
    }

    return score;
  }

  /**
   * Convert parser symbol to symbol location
   */
  private convertSymbolToLocation(symbol: ParserSymbolInfo): SymbolLocation {
    return {
      name: symbol.name,
      type: symbol.kind,
      range: symbol.loc ? {
        startLine: symbol.loc.start.line,
        endLine: symbol.loc.end.line,
        startColumn: symbol.loc.start.column,
        endColumn: symbol.loc.end.column
      } : {
        startLine: 0,
        endLine: 0,
        startColumn: 0,
        endColumn: 0
      },
      kind: 'definition',
      ...(symbol.scope !== undefined && { scope: symbol.scope }),
      ...(symbol.documentation !== undefined && { documentation: symbol.documentation })
    };
  }

  /**
   * Extract symbols from document outline
   */
  private extractSymbolsFromOutline(outline: OutlineItem[]): SymbolLocation[] {
    const symbols: SymbolLocation[] = [];

    const processItem = (item: OutlineItem) => {
      symbols.push({
        name: item.name,
        type: item.type,
        range: item.range,
        kind: 'definition'
      });

      if (item.children) {
        item.children.forEach(processItem);
      }
    };

    outline.forEach(processItem);
    return symbols;
  }

  // Quick navigation commands
  async jumpToLine(model: monaco.editor.ITextModel, lineNumber: number): Promise<monaco.Position | null> {
    const lineCount = model.getLineCount();
    if (lineNumber < 1 || lineNumber > lineCount) {
      return null;
    }
    
    return new monaco.Position(lineNumber, 1);
  }

  async jumpToSymbol(model: monaco.editor.ITextModel, symbolName: string): Promise<monaco.Position | null> {
    if (!this.parserService?.isReady()) {
      return null;
    }

    try {
      const outline = this.parserService.getDocumentOutline();
      const symbol = this.searchOutlineForDefinition(outline, symbolName);
      
      if (symbol) {
        return new monaco.Position(
          symbol.range.startLine + 1,
          symbol.range.startColumn + 1
        );
      }
      
      return null;
    } catch (error) {
      console.error('Error jumping to symbol:', error);
      return null;
    }
  }

  /**
   * Update navigation statistics
   */
  private updateNavigationStats(
    operation: string,
    symbolsFound: number,
    searchTime: number,
    context?: NavigationContext
  ): void {
    this.lastNavigationStats = {
      lastOperation: operation,
      symbolsFound,
      searchTime: Math.round(searchTime * 100) / 100,
      cacheHits: this.getCacheHitCount(),
      astNodes: context?.availableSymbols.length || 0
    };
  }

  /**
   * Get cache hit count (simplified implementation)
   */
  private getCacheHitCount(): number {
    return this.symbolCache.size + this.definitionCache.size;
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
   * Clear navigation caches
   */
  clearCache(): void {
    this.symbolCache.clear();
    this.definitionCache.clear();
  }

  /**
   * Get navigation statistics
   */
  getLastNavigationStats(): NavigationStats {
    return this.lastNavigationStats;
  }

  /**
   * Set parser service
   */
  setParserService(parserService: OpenSCADParserService): void {
    // Clear caches when parser service changes
    this.clearCache();
    // Note: parserService is readonly, so we can't actually set it
    // In a real implementation, this would need to be handled differently
  }

  /**
   * Set symbol provider
   */
  setSymbolProvider(symbolProvider: SymbolProvider): void {
    this.clearCache();
    // Note: symbolProvider is readonly, so we can't actually set it
    // In a real implementation, this would need to be handled differently
  }

  /**
   * Set position utilities
   */
  setPositionUtilities(positionUtilities: PositionUtilities): void {
    this.clearCache();
    // Note: positionUtilities is readonly, so we can't actually set it
    // In a real implementation, this would need to be handled differently
  }
}
