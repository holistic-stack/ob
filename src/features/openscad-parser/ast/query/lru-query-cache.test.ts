/**
 * Tests for the LRUQueryCache class
 */

import { describe, it, expect } from 'vitest';
import { LRUQueryCache } from './lru-query-cache.js';

// Mock the TSNode type
class MockNode {
  constructor(public text: string, public type: string) {}
}

describe('LRUQueryCache', () => {
  it('should evict the least recently used entry when the cache is full', () => {
    const cache = new LRUQueryCache(2);

    // Add two entries
    cache.set('query1', 'source1', [new MockNode('node1', 'type1')] as any[]);
    cache.set('query2', 'source2', [new MockNode('node2', 'type2')] as any[]);

    // Both entries should be in the cache
    expect(cache.get('query1', 'source1')).not.toBeNull();
    expect(cache.get('query2', 'source2')).not.toBeNull();

    // Add a third entry, which should evict the least recently used entry (query1)
    cache.set('query3', 'source3', [new MockNode('node3', 'type3')] as any[]);

    // query1 should be evicted
    expect(cache.get('query1', 'source1')).toBeNull();

    // query2 and query3 should still be in the cache
    expect(cache.get('query2', 'source2')).not.toBeNull();
    expect(cache.get('query3', 'source3')).not.toBeNull();
  });

  it('should update the LRU order when an entry is accessed', () => {
    const cache = new LRUQueryCache(2);

    // Add two entries
    cache.set('query1', 'source1', [new MockNode('node1', 'type1')] as any[]);
    cache.set('query2', 'source2', [new MockNode('node2', 'type2')] as any[]);

    // Access query1, making query2 the least recently used
    cache.get('query1', 'source1');

    // Add a third entry, which should evict the least recently used entry (query2)
    cache.set('query3', 'source3', [new MockNode('node3', 'type3')] as any[]);

    // query2 should be evicted
    expect(cache.get('query2', 'source2')).toBeNull();

    // query1 and query3 should still be in the cache
    expect(cache.get('query1', 'source1')).not.toBeNull();
    expect(cache.get('query3', 'source3')).not.toBeNull();
  });

  it('should handle hash collisions correctly', () => {
    const cache = new LRUQueryCache();

    // Create two different sources that might hash to the same value
    const source1 = 'a'.repeat(1000);
    const source2 = 'b'.repeat(1000);

    // Add entries with the same query string but different sources
    cache.set('query', source1, [new MockNode('node1', 'type1')] as any[]);
    cache.set('query', source2, [new MockNode('node2', 'type2')] as any[]);

    // Both entries should be retrievable with their respective sources
    const result1 = cache.get('query', source1);
    const result2 = cache.get('query', source2);

    expect(result1).not.toBeNull();
    expect(result2).not.toBeNull();
    expect(result1).not.toEqual(result2);
  });

  it('should return correct cache statistics', () => {
    const cache = new LRUQueryCache();

    // Add an entry
    cache.set('query', 'source', [new MockNode('node', 'type')] as any[]);

    // Get the entry (hit)
    cache.get('query', 'source');

    // Get a non-existent entry (miss)
    cache.get('non-existent', 'source');

    // Get the statistics
    const stats = cache.getStats();

    expect(stats.hits).toBe(1);
    expect(stats.misses).toBe(1);
    expect(stats.size).toBe(1);
  });
});
