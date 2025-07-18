/**
 * @file lru-query-cache.ts
 * @description This file implements an LRU (Least Recently Used) cache for Tree-sitter queries.
 * It stores query results based on the query string and a hash of the source text, ensuring that
 * frequently accessed queries are readily available while older, less used ones are evicted.
 *
 * @architectural_decision
 * The `LRUQueryCache` implements the `QueryCache` interface, adhering to the Strategy pattern.
 * This allows the caching mechanism to be swapped out without affecting the `QueryManager`.
 * The use of an LRU policy is a common and effective strategy for managing cache size and ensuring
 * that the most relevant data remains in memory. Hashing the source text for the cache key prevents
 * storing large strings directly in the map keys, optimizing memory usage.
 *
 * @example
 * ```typescript
 * import { LRUQueryCache } from './lru-query-cache';
 * import * as TreeSitter from 'web-tree-sitter';
 *
 * async function demonstrateLRUCache() {
 *   // Initialize Tree-sitter (assuming it's done elsewhere in the application)
 *   await TreeSitter.Parser.init();
 *
 *   const cache = new LRUQueryCache(2); // Cache size of 2
 *   const queryString1 = '(function_definition)';
 *   const queryString2 = '(variable_declaration)';
 *   const sourceText1 = 'function foo() {}\nfunction bar() {}\n';
 *   const sourceText2 = 'a = 1;\nb = 2;\n';
 *
 *   // First query: cache miss, then set
 *   let result1 = cache.get(queryString1, sourceText1);
 *   console.log('Result 1 (initial get):', result1); // Expected: null
 *   cache.set(queryString1, sourceText1, [/* some TSNode results * /]);
 *   console.log('Cache size after set 1:', cache.size()); // Expected: 1
 *
 *   // Second query: cache miss, then set
 *   let result2 = cache.get(queryString2, sourceText2);
 *   console.log('Result 2 (initial get):', result2); // Expected: null
 *   cache.set(queryString2, sourceText2, [/* some other TSNode results * /]);
 *   console.log('Cache size after set 2:', cache.size()); // Expected: 2
 *
 *   // Access first query again: cache hit, moves to MRU
 *   result1 = cache.get(queryString1, sourceText1);
 *   console.log('Result 1 (second get):', result1); // Expected: [/* some TSNode results * /]
 *   console.log('Cache stats after hit:', cache.getStats()); // Hits: 1, Misses: 2, Size: 2
 *
 *   // Add a third query: cache is full, LRU (queryString2) is evicted
 *   const queryString3 = '(call_expression)';
 *   const sourceText3 = 'foo(); bar();';
 *   cache.set(queryString3, sourceText3, [/* yet more TSNode results * /]);
 *   console.log('Cache size after set 3:', cache.size()); // Expected: 2
 *
 *   // Try to get evicted query: cache miss
 *   result2 = cache.get(queryString2, sourceText2);
 *   console.log('Result 2 (after eviction):', result2); // Expected: null
 *   console.log('Cache stats after miss:', cache.getStats()); // Hits: 1, Misses: 3, Size: 2
 *
 *   cache.clear();
 *   console.log('Cache size after clear:', cache.size()); // Expected: 0
 * }
 *
 * demonstrateLRUCache();
 * ```
 */

import type { Node as TSNode } from 'web-tree-sitter';
import type { QueryCache } from './query-cache.js';

/**
 * @class LRUQueryCache
 * @description Implements a Least Recently Used (LRU) cache for Tree-sitter query results.
 * This cache stores query results and evicts the least recently accessed items when the cache limit is reached.
 */
export class LRUQueryCache implements QueryCache {
  /**
   * @property {Map<string, TSNode[]>} cache - The internal Map used to store cached query results.
   * The key is a combination of the query string and a hash of the source text.
   */
  private cache: Map<string, TSNode[]> = new Map();

  /**
   * @property {number} maxSize - The maximum number of query results that can be stored in the cache.
   */
  private maxSize: number;

  /**
   * @property {number} hits - Counter for cache hits.
   */
  private hits: number = 0;

  /**
   * @property {number} misses - Counter for cache misses.
   */
  private misses: number = 0;

  /**
   * @constructor
   * @description Creates a new `LRUQueryCache` instance.
   * @param {number} [maxSize=100] - The maximum number of queries to cache. Defaults to 100.
   */
  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }

  /**
   * @method get
   * @description Retrieves cached query results for a given query string and source text.
   * If found, the entry is moved to the most recently used position in the cache.
   *
   * @param {string} queryString - The Tree-sitter query string.
   * @param {string} sourceText - The source code text against which the query was run.
   * @returns {TSNode[] | null} The cached query results (an array of Tree-sitter nodes), or `null` if not found.
   */
  get(queryString: string, sourceText: string): TSNode[] | null {
    const cacheKey = this.getCacheKey(queryString, sourceText);
    const results = this.cache.get(cacheKey);

    if (!results) {
      this.misses++;
      return null;
    }

    // Move the entry to the end of the map to mark it as recently used (LRU logic)
    this.cache.delete(cacheKey);
    this.cache.set(cacheKey, results);

    this.hits++;
    return results;
  }

  /**
   * @method set
   * @description Caches query results for a given query string and source text.
   * If the cache is full, the least recently used entry is evicted.
   *
   * @param {string} queryString - The Tree-sitter query string.
   * @param {string} sourceText - The source code text against which the query was run.
   * @param {TSNode[]} results - The query results (an array of Tree-sitter nodes) to cache.
   */
  set(queryString: string, sourceText: string, results: TSNode[]): void {
    const cacheKey = this.getCacheKey(queryString, sourceText);

    // If the cache is full, remove the least recently used entry
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
      }
    }

    // Add the entry to the cache
    this.cache.set(cacheKey, results);
  }

  /**
   * @method clear
   * @description Clears all entries from the cache and resets hit/miss counters.
   */
  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * @method size
   * @description Returns the current number of items stored in the cache.
   * @returns {number} The number of cached queries.
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * @method getStats
   * @description Returns statistics about the cache usage, including hits, misses, and current size.
   * @returns {{ hits: number; misses: number; size: number }} An object containing cache statistics.
   */
  getStats(): { hits: number; misses: number; size: number } {
    return {
      hits: this.hits,
      misses: this.misses,
      size: this.cache.size,
    };
  }

  /**
   * @method getCacheKey
   * @description Generates a unique cache key for a given query string and source text.
   * It uses a hash of the source text to create a compact key.
   *
   * @param {string} queryString - The Tree-sitter query string.
   * @param {string} sourceText - The source code text.
   * @returns {string} A unique string representing the cache key.
   * @private
   */
  private getCacheKey(queryString: string, sourceText: string): string {
    // Use a hash of the source text to avoid storing the entire text in the key
    const sourceHash = this.hashString(sourceText);
    return `${queryString}:${sourceHash}`;
  }

  /**
   * @method hashString
   * @description Generates a simple hash for a given string.
   * This is used to create compact keys for the cache.
   *
   * @param {string} str - The string to hash.
   * @returns {string} A hexadecimal string representation of the hash.
   * @private
   */
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash &= hash; // Convert to 32bit integer
    }
    return hash.toString(16);
  }
}
