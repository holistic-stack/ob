/**
 * @file Enhanced Symbol Search Utilities
 * 
 * Provides advanced symbol search functionality with fuzzy matching,
 * ranking algorithms, and filtering capabilities for OpenSCAD navigation.
 * 
 * Features:
 * - Fuzzy string matching with configurable algorithms
 * - Symbol ranking based on relevance and context
 * - Advanced filtering by type, scope, and visibility
 * - Performance optimized with caching and indexing
 * - Functional programming patterns with immutable data
 * 
 * @example
 * ```typescript
 * const searcher = new SymbolSearcher(symbols);
 * const results = searcher.search('cube', {
 *   fuzzy: true,
 *   maxResults: 10,
 *   symbolTypes: ['module', 'function']
 * });
 * ```
 */

// Types for symbol search functionality
export interface SearchableSymbol {
  readonly name: string;
  readonly type: string;
  readonly scope?: string;
  readonly documentation?: string;
  readonly location: {
    readonly line: number;
    readonly column: number;
  };
  readonly visibility: 'public' | 'private' | 'local';
}

export interface SearchOptions {
  readonly fuzzy: boolean;
  readonly caseSensitive: boolean;
  readonly symbolTypes: ReadonlyArray<string>;
  readonly maxResults: number;
  readonly includeDocumentation: boolean;
  readonly scopeFilter?: string;
  readonly visibilityFilter?: ReadonlyArray<'public' | 'private' | 'local'>;
}

export interface SearchResult {
  readonly symbol: SearchableSymbol;
  readonly score: number;
  readonly matchType: 'exact' | 'prefix' | 'substring' | 'fuzzy';
  readonly matchIndices: ReadonlyArray<number>;
}

export interface SearchStats {
  readonly totalSymbols: number;
  readonly filteredSymbols: number;
  readonly searchTime: number;
  readonly algorithm: string;
}

/**
 * Advanced symbol search with multiple matching algorithms
 */
export class SymbolSearcher {
  private readonly symbols: ReadonlyArray<SearchableSymbol>;
  private readonly symbolIndex: Map<string, SearchableSymbol[]>;
  private lastSearchStats: SearchStats;

  constructor(symbols: ReadonlyArray<SearchableSymbol>) {
    this.symbols = symbols;
    this.symbolIndex = this.buildSymbolIndex(symbols);
    this.lastSearchStats = {
      totalSymbols: symbols.length,
      filteredSymbols: 0,
      searchTime: 0,
      algorithm: 'none'
    };
  }

  /**
   * Search symbols with advanced filtering and ranking
   * 
   * @param query - Search query string
   * @param options - Search configuration options
   * @returns Ranked array of search results
   */
  search(query: string, options: Partial<SearchOptions> = {}): SearchResult[] {
    const startTime = performance.now();
    
    const searchOptions: SearchOptions = {
      fuzzy: true,
      caseSensitive: false,
      symbolTypes: ['module', 'function', 'variable', 'constant'],
      maxResults: 50,
      includeDocumentation: false,
      visibilityFilter: ['public', 'private', 'local'],
      ...options
    };

    try {
      // Apply filters first
      const filteredSymbols = this.applyFilters(this.symbols, searchOptions);
      
      // Perform search with selected algorithm
      const results = this.performSearch(query, filteredSymbols, searchOptions);
      
      // Sort by relevance score
      const sortedResults = this.sortByRelevance(results, query);
      
      // Limit results
      const limitedResults = sortedResults.slice(0, searchOptions.maxResults);
      
      const searchTime = performance.now() - startTime;
      this.updateSearchStats(filteredSymbols.length, searchTime, searchOptions);
      
      return limitedResults;
    } catch (_error) {
      // Symbol search error occurred
      return [];
    }
  }

  /**
   * Get search statistics from last search operation
   */
  getLastSearchStats(): SearchStats {
    return this.lastSearchStats;
  }

  /**
   * Build symbol index for faster lookups
   */
  private buildSymbolIndex(symbols: ReadonlyArray<SearchableSymbol>): Map<string, SearchableSymbol[]> {
    const index = new Map<string, SearchableSymbol[]>();
    
    for (const symbol of symbols) {
      // Index by first character for faster prefix searches
      const firstChar = symbol.name.charAt(0).toLowerCase();
      if (!index.has(firstChar)) {
        index.set(firstChar, []);
      }
      index.get(firstChar)!.push(symbol);
      
      // Index by type
      const typeKey = `type:${symbol.type}`;
      if (!index.has(typeKey)) {
        index.set(typeKey, []);
      }
      index.get(typeKey)!.push(symbol);
    }
    
    return index;
  }

  /**
   * Apply filters to symbol list
   */
  private applyFilters(
    symbols: ReadonlyArray<SearchableSymbol>, 
    options: SearchOptions
  ): ReadonlyArray<SearchableSymbol> {
    return symbols.filter(symbol => {
      // Type filter
      if (!options.symbolTypes.includes(symbol.type)) {
        return false;
      }
      
      // Visibility filter
      if (options.visibilityFilter && !options.visibilityFilter.includes(symbol.visibility)) {
        return false;
      }
      
      // Scope filter
      if (options.scopeFilter && symbol.scope !== options.scopeFilter) {
        return false;
      }
      
      return true;
    });
  }

  /**
   * Perform search using selected algorithm
   */
  private performSearch(
    query: string, 
    symbols: ReadonlyArray<SearchableSymbol>, 
    options: SearchOptions
  ): SearchResult[] {
    if (query.length === 0) {
      return symbols.map(symbol => ({
        symbol,
        score: 0,
        matchType: 'exact' as const,
        matchIndices: []
      }));
    }

    const results: SearchResult[] = [];
    const searchQuery = options.caseSensitive ? query : query.toLowerCase();

    for (const symbol of symbols) {
      const symbolName = options.caseSensitive ? symbol.name : symbol.name.toLowerCase();
      
      // Try different matching strategies
      const exactMatch = this.checkExactMatch(symbolName, searchQuery);
      if (exactMatch) {
        results.push({
          symbol,
          score: 100,
          matchType: 'exact',
          matchIndices: [0, query.length - 1]
        });
        continue;
      }

      const prefixMatch = this.checkPrefixMatch(symbolName, searchQuery);
      if (prefixMatch) {
        results.push({
          symbol,
          score: 80,
          matchType: 'prefix',
          matchIndices: [0, query.length - 1]
        });
        continue;
      }

      const substringMatch = this.checkSubstringMatch(symbolName, searchQuery);
      if (substringMatch.found) {
        results.push({
          symbol,
          score: 60,
          matchType: 'substring',
          matchIndices: substringMatch.indices
        });
        continue;
      }

      if (options.fuzzy) {
        const fuzzyMatch = this.checkFuzzyMatch(symbolName, searchQuery);
        if (fuzzyMatch.found) {
          results.push({
            symbol,
            score: fuzzyMatch.score,
            matchType: 'fuzzy',
            matchIndices: fuzzyMatch.indices
          });
        }
      }

      // Search in documentation if enabled
      if (options.includeDocumentation && symbol.documentation) {
        const docText = options.caseSensitive ? symbol.documentation : symbol.documentation.toLowerCase();
        if (docText.includes(searchQuery)) {
          results.push({
            symbol,
            score: 30,
            matchType: 'substring',
            matchIndices: []
          });
        }
      }
    }

    return results;
  }

  /**
   * Check for exact match
   */
  private checkExactMatch(text: string, query: string): boolean {
    return text === query;
  }

  /**
   * Check for prefix match
   */
  private checkPrefixMatch(text: string, query: string): boolean {
    return text.startsWith(query);
  }

  /**
   * Check for substring match
   */
  private checkSubstringMatch(text: string, query: string): { found: boolean; indices: number[] } {
    const index = text.indexOf(query);
    if (index !== -1) {
      return {
        found: true,
        indices: [index, index + query.length - 1]
      };
    }
    return { found: false, indices: [] };
  }

  /**
   * Advanced fuzzy matching with scoring
   */
  private checkFuzzyMatch(text: string, query: string): { found: boolean; score: number; indices: number[] } {
    if (query.length === 0) return { found: true, score: 0, indices: [] };
    if (text.length === 0) return { found: false, score: 0, indices: [] };

    const indices: number[] = [];
    let queryIndex = 0;
    let score = 0;
    let consecutiveMatches = 0;

    for (let textIndex = 0; textIndex < text.length && queryIndex < query.length; textIndex++) {
      if (text[textIndex] === query[queryIndex]) {
        indices.push(textIndex);
        queryIndex++;
        consecutiveMatches++;
        
        // Bonus for consecutive matches
        score += consecutiveMatches * 2;
      } else {
        consecutiveMatches = 0;
      }
    }

    const found = queryIndex === query.length;
    if (found) {
      // Calculate final score based on match quality
      const matchRatio = query.length / text.length;
      const positionBonus = indices.length > 0 ? (text.length - (indices[0] ?? 0)) / text.length : 0;
      score = Math.round(40 * matchRatio + 10 * positionBonus + score);
    }

    return { found, score: Math.min(score, 50), indices };
  }

  /**
   * Sort results by relevance score
   */
  private sortByRelevance(results: SearchResult[], _query: string): SearchResult[] {
    return results.sort((a, b) => {
      // Primary sort by score
      if (a.score !== b.score) {
        return b.score - a.score;
      }
      
      // Secondary sort by symbol type priority
      const typePriority = { module: 3, function: 2, variable: 1, constant: 0 };
      const aPriority = typePriority[a.symbol.type as keyof typeof typePriority] || 0;
      const bPriority = typePriority[b.symbol.type as keyof typeof typePriority] || 0;
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }
      
      // Tertiary sort by name length (shorter names first)
      return a.symbol.name.length - b.symbol.name.length;
    });
  }

  /**
   * Update search statistics
   */
  private updateSearchStats(filteredCount: number, searchTime: number, options: SearchOptions): void {
    this.lastSearchStats = {
      totalSymbols: this.symbols.length,
      filteredSymbols: filteredCount,
      searchTime: Math.round(searchTime * 100) / 100,
      algorithm: options.fuzzy ? 'fuzzy' : 'exact'
    };
  }
}

/**
 * Utility functions for symbol search
 */

/**
 * Create searchable symbol from parser symbol info
 */
export function createSearchableSymbol(
  name: string,
  type: string,
  location: { line: number; column: number },
  options: {
    scope?: string;
    documentation?: string;
    visibility?: 'public' | 'private' | 'local';
  } = {}
): SearchableSymbol {
  return {
    name,
    type,
    location,
    ...(options.scope !== undefined && { scope: options.scope }),
    ...(options.documentation !== undefined && { documentation: options.documentation }),
    visibility: options.visibility || 'public'
  };
}

/**
 * Default search options
 */
export const DEFAULT_SEARCH_OPTIONS: SearchOptions = {
  fuzzy: true,
  caseSensitive: false,
  symbolTypes: ['module', 'function', 'variable', 'constant'],
  maxResults: 50,
  includeDocumentation: false,
  visibilityFilter: ['public', 'private', 'local']
};
