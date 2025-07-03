/**
 * Tests for the QueryManager class
 */

import { describe, it, expect, vi } from 'vitest';
import { QueryManager } from './query-manager.js';
import { QueryCache } from './query-cache.js';

// Mock the Tree-sitter types
class MockTree {
  constructor(public rootNode: MockNode) {}
}

class MockNode {
  constructor(public text: string, public type: string) {}
}

class MockMatch {
  constructor(public captures: MockCapture[]) {}
}

class MockCapture {
  constructor(public node: MockNode) {}
}

class MockQuery {
  private matches_: MockMatch[];

  constructor(matches: MockMatch[]) {
    this.matches_ = matches;
  }

  matches(_node: MockNode): MockMatch[] {
    return this.matches_;
  }
}

// Mock the QueryCache
class MockQueryCache implements QueryCache {
  private cache: Map<string, any[]> = new Map();
  private _hits = 0;
  private _misses = 0;

  get(queryString: string, sourceText: string): any[] | null {
    const key = `${queryString}:${sourceText}`;
    const result = this.cache.get(key) ?? null;

    if (result) {
      this._hits++;
    } else {
      this._misses++;
    }

    return result;
  }

  set(queryString: string, sourceText: string, results: any[]): void {
    const key = `${queryString}:${sourceText}`;
    this.cache.set(key, results);
  }

  clear(): void {
    this.cache.clear();
    this._hits = 0;
    this._misses = 0;
  }

  size(): number {
    return this.cache.size;
  }

  getStats(): { hits: number; misses: number; size: number } {
    return {
      hits: this._hits,
      misses: this._misses,
      size: this.cache.size,
    };
  }
}

describe('QueryManager', () => {
  it('should execute a query and cache the results', () => {
    // Create a mock language
    const mockLanguage = {
      query: vi.fn().mockImplementation((_queryString) => {
        const mockQuery = new MockQuery([
          new MockMatch([
            new MockCapture(new MockNode('node1', 'type1')),
            new MockCapture(new MockNode('node2', 'type2')),
          ]),
        ]);
        return mockQuery;
      }),
    };

    // Create a mock cache
    const mockCache = new MockQueryCache();

    // Create a query manager
    const queryManager = new QueryManager(mockLanguage, mockCache);

    // Create a mock tree
    const mockTree = new MockTree(new MockNode('root', 'program'));

    // Execute a query
    const results = queryManager.executeQuery('(type1) @node', mockTree as any);

    // The query should be executed and the results cached
    expect(mockLanguage.query).toHaveBeenCalledWith('(type1) @node');
    expect(results).toHaveLength(2);
    expect(mockCache.size()).toBe(1);

    // Execute the same query again
    queryManager.executeQuery('(type1) @node', mockTree as any);

    // The query should be retrieved from the cache
    expect(mockLanguage.query).toHaveBeenCalledTimes(1);
    expect(mockCache.getStats().hits).toBe(1);
  });

  it('should find nodes by type', () => {
    // Create a mock language
    const mockLanguage = {
      query: vi.fn().mockImplementation((_queryString) => {
        return new MockQuery([
          new MockMatch([
            new MockCapture(new MockNode('node1', 'type1')),
            new MockCapture(new MockNode('node2', 'type1')),
          ]),
        ]);
      }),
    };

    // Create a query manager
    const queryManager = new QueryManager(mockLanguage);

    // Create a mock tree
    const mockTree = new MockTree(new MockNode('root', 'program'));

    // Find nodes by type
    const results = queryManager.findNodesByType('type1', mockTree as any);

    // The query should be executed with the correct query string
    expect(mockLanguage.query).toHaveBeenCalledWith('(type1) @node');
    expect(results).toHaveLength(2);
  });

  it('should clear the cache', () => {
    // Create a mock language
    const mockLanguage = {
      query: vi.fn().mockImplementation((_queryString) => {
        return new MockQuery([
          new MockMatch([new MockCapture(new MockNode('node1', 'type1'))]),
        ]);
      }),
    };

    // Create a mock cache
    const mockCache = new MockQueryCache();

    // Create a query manager
    const queryManager = new QueryManager(mockLanguage, mockCache);

    // Create a mock tree
    const mockTree = new MockTree(new MockNode('root', 'program'));

    // Execute a query
    queryManager.executeQuery('(type1) @node', mockTree as any);

    // The results should be cached
    expect(mockCache.size()).toBe(1);

    // Clear the cache
    queryManager.clearCache();

    // The cache should be empty
    expect(mockCache.size()).toBe(0);
  });

  it('should get cache statistics', () => {
    // Create a mock language
    const mockLanguage = {
      query: vi.fn().mockImplementation((_queryString) => {
        return new MockQuery([
          new MockMatch([new MockCapture(new MockNode('node1', 'type1'))]),
        ]);
      }),
    };

    // Create a mock cache
    const mockCache = new MockQueryCache();

    // Create a query manager
    const queryManager = new QueryManager(mockLanguage, mockCache);

    // Create a mock tree
    const mockTree = new MockTree(new MockNode('root', 'program'));

    // Execute a query
    queryManager.executeQuery('(type1) @node', mockTree as any);

    // Execute the same query again
    queryManager.executeQuery('(type1) @node', mockTree as any);

    // Get the cache statistics
    const stats = queryManager.getCacheStats();

    // The statistics should be correct
    expect(stats.hits).toBe(1);
    expect(stats.misses).toBe(1);
    expect(stats.size).toBe(1);
  });
});
