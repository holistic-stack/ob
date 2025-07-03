/**
 * Tests for the QueryCache interface
 */

import { describe, it, expect } from 'vitest';
import { QueryCache } from './query-cache.js';
import { LRUQueryCache } from './lru-query-cache.js';

// Mock the TSNode type
class MockNode {
  constructor(public text: string, public type: string) {}
}

describe('QueryCache', () => {
  let cache: QueryCache;

  beforeEach(() => {
    cache = new LRUQueryCache(10);
  });

  it('should store and retrieve query results', () => {
    const queryString = '(module_definition) @module';
    const sourceText = 'module test() {}';
    const results = [new MockNode('test', 'identifier')] as any[];

    cache.set(queryString, sourceText, results);
    const cachedResults = cache.get(queryString, sourceText);

    expect(cachedResults).toEqual(results);
  });

  it('should return null for non-existent queries', () => {
    const queryString = '(module_definition) @module';
    const sourceText = 'module test() {}';

    const cachedResults = cache.get(queryString, sourceText);

    expect(cachedResults).toBeNull();
  });

  it('should clear the cache', () => {
    const queryString = '(module_definition) @module';
    const sourceText = 'module test() {}';
    const results = [new MockNode('test', 'identifier')] as any[];

    cache.set(queryString, sourceText, results);
    cache.clear();

    const cachedResults = cache.get(queryString, sourceText);

    expect(cachedResults).toBeNull();
    expect(cache.size()).toBe(0);
  });

  it('should track cache statistics', () => {
    const queryString = '(module_definition) @module';
    const sourceText = 'module test() {}';
    const results = [new MockNode('test', 'identifier')] as any[];

    // Set a value
    cache.set(queryString, sourceText, results);

    // Get the value (hit)
    cache.get(queryString, sourceText);

    // Get a non-existent value (miss)
    cache.get('non-existent', sourceText);

    const stats = cache.getStats();

    expect(stats.hits).toBe(1);
    expect(stats.misses).toBe(1);
    expect(stats.size).toBe(1);
  });
});
