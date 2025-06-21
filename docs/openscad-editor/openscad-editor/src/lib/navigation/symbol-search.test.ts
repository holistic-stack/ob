/**
 * @file Symbol Search Utilities Tests
 * 
 * Comprehensive tests for the enhanced symbol search functionality
 * including fuzzy matching, ranking algorithms, and filtering.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SymbolSearcher, createSearchableSymbol, DEFAULT_SEARCH_OPTIONS } from './symbol-search';

// Test data
const testSymbols = [
  createSearchableSymbol('cube', 'module', { line: 1, column: 0 }, {
    documentation: 'Creates a cube primitive',
    visibility: 'public'
  }),
  createSearchableSymbol('cube_with_hole', 'module', { line: 10, column: 0 }, {
    documentation: 'Creates a cube with a cylindrical hole',
    visibility: 'public'
  }),
  createSearchableSymbol('cylinder', 'module', { line: 20, column: 0 }, {
    documentation: 'Creates a cylinder primitive',
    visibility: 'public'
  }),
  createSearchableSymbol('calculate_volume', 'function', { line: 30, column: 0 }, {
    documentation: 'Calculates volume of a rectangular box',
    visibility: 'public'
  }),
  createSearchableSymbol('size', 'variable', { line: 40, column: 0 }, {
    visibility: 'local'
  }),
  createSearchableSymbol('diameter', 'variable', { line: 41, column: 0 }, {
    visibility: 'local'
  }),
  createSearchableSymbol('PI', 'constant', { line: 50, column: 0 }, {
    documentation: 'Mathematical constant pi',
    visibility: 'public'
  }),
  createSearchableSymbol('_internal_helper', 'function', { line: 60, column: 0 }, {
    visibility: 'private'
  })
];

describe('SymbolSearcher', () => {
  let searcher: SymbolSearcher;

  beforeEach(() => {
    searcher = new SymbolSearcher(testSymbols);
  });

  describe('exact matching', () => {
    it('should find exact matches with highest score', () => {
      const results = searcher.search('cube', { fuzzy: false });
      
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].symbol.name).toBe('cube');
      expect(results[0].matchType).toBe('exact');
      expect(results[0].score).toBe(100);
    });

    it('should be case sensitive when configured', () => {
      const results = searcher.search('CUBE', { 
        fuzzy: false, 
        caseSensitive: true 
      });
      
      expect(results.length).toBe(0);
    });

    it('should be case insensitive by default', () => {
      const results = searcher.search('CUBE', { fuzzy: false });
      
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].symbol.name).toBe('cube');
    });
  });

  describe('prefix matching', () => {
    it('should find prefix matches', () => {
      const results = searcher.search('cube_', { fuzzy: false });
      
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].symbol.name).toBe('cube_with_hole');
      expect(results[0].matchType).toBe('prefix');
      expect(results[0].score).toBe(80);
    });

    it('should prioritize exact over prefix matches', () => {
      const results = searcher.search('cube', { fuzzy: false });
      
      expect(results.length).toBeGreaterThan(1);
      expect(results[0].symbol.name).toBe('cube');
      expect(results[0].matchType).toBe('exact');
      expect(results[1].symbol.name).toBe('cube_with_hole');
      expect(results[1].matchType).toBe('prefix');
    });
  });

  describe('substring matching', () => {
    it('should find substring matches', () => {
      const results = searcher.search('volume', { fuzzy: false });
      
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].symbol.name).toBe('calculate_volume');
      expect(results[0].matchType).toBe('substring');
      expect(results[0].score).toBe(60);
    });

    it('should find matches in the middle of words', () => {
      const results = searcher.search('with', { fuzzy: false });
      
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].symbol.name).toBe('cube_with_hole');
      expect(results[0].matchType).toBe('substring');
    });
  });

  describe('fuzzy matching', () => {
    it('should find fuzzy matches', () => {
      const results = searcher.search('cwh', { fuzzy: true });

      expect(results.length).toBeGreaterThan(0);
      expect(results.some(r => r.symbol.name === 'cube_with_hole')).toBe(true);

      const fuzzyResult = results.find(r => r.symbol.name === 'cube_with_hole');
      expect(fuzzyResult?.matchType).toBe('fuzzy');
      expect(fuzzyResult?.score).toBeGreaterThan(0);
    });

    it('should score consecutive matches higher', () => {
      const results = searcher.search('calc', { fuzzy: true });
      
      const fuzzyResult = results.find(r => r.symbol.name === 'calculate_volume');
      expect(fuzzyResult).toBeDefined();
      expect(fuzzyResult?.score).toBeGreaterThan(20);
    });

    it('should not find fuzzy matches when disabled', () => {
      const results = searcher.search('cwh', { fuzzy: false });

      expect(results.length).toBe(0);
    });
  });

  describe('filtering', () => {
    it('should filter by symbol type', () => {
      const results = searcher.search('', { 
        symbolTypes: ['module'] 
      });
      
      expect(results.length).toBeGreaterThan(0);
      expect(results.every(r => r.symbol.type === 'module')).toBe(true);
    });

    it('should filter by multiple symbol types', () => {
      const results = searcher.search('', { 
        symbolTypes: ['module', 'function'] 
      });
      
      expect(results.length).toBeGreaterThan(0);
      expect(results.every(r => 
        r.symbol.type === 'module' || r.symbol.type === 'function'
      )).toBe(true);
    });

    it('should filter by visibility', () => {
      const results = searcher.search('', { 
        visibilityFilter: ['public'] 
      });
      
      expect(results.length).toBeGreaterThan(0);
      expect(results.every(r => r.symbol.visibility === 'public')).toBe(true);
    });

    it('should respect max results limit', () => {
      const results = searcher.search('', { 
        maxResults: 3 
      });
      
      expect(results.length).toBeLessThanOrEqual(3);
    });
  });

  describe('documentation search', () => {
    it('should search in documentation when enabled', () => {
      const results = searcher.search('primitive', { 
        includeDocumentation: true,
        fuzzy: false 
      });
      
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(r => 
        r.symbol.name === 'cube' || r.symbol.name === 'cylinder'
      )).toBe(true);
    });

    it('should not search in documentation when disabled', () => {
      const results = searcher.search('primitive', { 
        includeDocumentation: false,
        fuzzy: false 
      });
      
      expect(results.length).toBe(0);
    });
  });

  describe('ranking and sorting', () => {
    it('should rank exact matches highest', () => {
      const results = searcher.search('cube');
      
      expect(results[0].symbol.name).toBe('cube');
      expect(results[0].score).toBe(100);
    });

    it('should prioritize modules over other types', () => {
      const results = searcher.search('c', { fuzzy: false });
      
      // Should find both 'cube' (module) and 'calculate_volume' (function)
      const moduleResults = results.filter(r => r.symbol.type === 'module');
      const functionResults = results.filter(r => r.symbol.type === 'function');
      
      if (moduleResults.length > 0 && functionResults.length > 0) {
        const firstModule = results.findIndex(r => r.symbol.type === 'module');
        const firstFunction = results.findIndex(r => r.symbol.type === 'function');
        
        expect(firstModule).toBeLessThan(firstFunction);
      }
    });

    it('should prefer shorter names when scores are equal', () => {
      const results = searcher.search('cube');
      
      // 'cube' should come before 'cube_with_hole'
      const cubeIndex = results.findIndex(r => r.symbol.name === 'cube');
      const cubeWithHoleIndex = results.findIndex(r => r.symbol.name === 'cube_with_hole');
      
      expect(cubeIndex).toBeLessThan(cubeWithHoleIndex);
    });
  });

  describe('statistics', () => {
    it('should track search statistics', () => {
      searcher.search('cube');
      
      const stats = searcher.getLastSearchStats();
      expect(stats.totalSymbols).toBe(testSymbols.length);
      expect(stats.searchTime).toBeGreaterThan(0);
      expect(stats.algorithm).toBeDefined();
    });

    it('should track filtered symbol count', () => {
      searcher.search('cube', { symbolTypes: ['module'] });
      
      const stats = searcher.getLastSearchStats();
      expect(stats.filteredSymbols).toBeLessThanOrEqual(stats.totalSymbols);
    });
  });

  describe('edge cases', () => {
    it('should handle empty query', () => {
      const results = searcher.search('');
      
      expect(results.length).toBe(testSymbols.length);
      expect(results.every(r => r.score === 0)).toBe(true);
    });

    it('should handle query with no matches', () => {
      const results = searcher.search('nonexistent_symbol');
      
      expect(results.length).toBe(0);
    });

    it('should handle special characters in query', () => {
      const results = searcher.search('cube_with_hole');
      
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].symbol.name).toBe('cube_with_hole');
    });
  });
});

describe('createSearchableSymbol', () => {
  it('should create searchable symbol with required fields', () => {
    const symbol = createSearchableSymbol('test', 'module', { line: 1, column: 0 });
    
    expect(symbol.name).toBe('test');
    expect(symbol.type).toBe('module');
    expect(symbol.location.line).toBe(1);
    expect(symbol.location.column).toBe(0);
    expect(symbol.visibility).toBe('public'); // default
  });

  it('should create searchable symbol with optional fields', () => {
    const symbol = createSearchableSymbol('test', 'function', { line: 1, column: 0 }, {
      scope: 'global',
      documentation: 'Test function',
      visibility: 'private'
    });
    
    expect(symbol.scope).toBe('global');
    expect(symbol.documentation).toBe('Test function');
    expect(symbol.visibility).toBe('private');
  });
});

describe('DEFAULT_SEARCH_OPTIONS', () => {
  it('should have sensible defaults', () => {
    expect(DEFAULT_SEARCH_OPTIONS.fuzzy).toBe(true);
    expect(DEFAULT_SEARCH_OPTIONS.caseSensitive).toBe(false);
    expect(DEFAULT_SEARCH_OPTIONS.maxResults).toBe(50);
    expect(DEFAULT_SEARCH_OPTIONS.symbolTypes).toContain('module');
    expect(DEFAULT_SEARCH_OPTIONS.symbolTypes).toContain('function');
  });
});
