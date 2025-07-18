/**
 * @file query-cache.ts
 * @description This file defines the `QueryCache` interface, which specifies the contract for any caching mechanism
 * used to store and retrieve Tree-sitter query results. This interface promotes a pluggable caching strategy
 * within the OpenSCAD parser.
 *
 * @architectural_decision
 * The `QueryCache` interface is a key component of the Strategy pattern applied to query caching.
 * By defining a clear interface, different caching implementations (e.g., LRU, FIFO, or no cache) can be
 * used interchangeably without affecting the `QueryManager` or other parts of the parser that rely on caching.
 * This design enhances flexibility, testability, and allows for performance optimizations by choosing the most
 * suitable caching strategy for a given environment or use case.
 *
 * @example
 * ```typescript
 * import type { QueryCache } from './query-cache';
 * import * as TreeSitter from 'web-tree-sitter';
 *
 * // Example of a simple in-memory cache implementing QueryCache
 * class InMemoryQueryCache implements QueryCache {
 *   private cache = new Map<string, TreeSitter.Node[]>();
 *   private _hits = 0;
 *   private _misses = 0;
 *
 *   get(queryString: string, sourceText: string): TreeSitter.Node[] | null {
 *     const key = `${queryString}-${sourceText}`;
 *     if (this.cache.has(key)) {
 *       this._hits++;
 *       return this.cache.get(key)!;
 *     }
 *     this._misses++;
 *     return null;
 *   }
 *
 *   set(queryString: string, sourceText: string, results: TreeSitter.Node[]): void {
 *     const key = `${queryString}-${sourceText}`;
 *     this.cache.set(key, results);
 *   }
 *
 *   clear(): void {
 *     this.cache.clear();
 *     this._hits = 0;
 *     this._misses = 0;
 *   }
 *
 *   size(): number {
 *     return this.cache.size;
 *   }
 *
 *   getStats(): { hits: number; misses: number; size: number } {
 *     return { hits: this._hits, misses: this._misses, size: this.size() };
 *   }
 * }
 *
 * // Usage with a QueryManager (assuming QueryManager accepts QueryCache)
 * // const myCache: QueryCache = new InMemoryQueryCache();
 * // const queryManager = new QueryManager(someTreeSitterLanguage, myCache);
 * ```
 */

import type { Node as TSNode } from 'web-tree-sitter';

/**
 * @interface QueryCache
 * @description Defines the interface for a caching mechanism that stores and retrieves Tree-sitter query results.
 * Implementations of this interface provide a way to optimize query performance by avoiding redundant computations.
 */
export interface QueryCache {
  /**
   * @method get
   * @description Retrieves cached query results for a given query string and source text.
   *
   * @param {string} queryString - The Tree-sitter query string (e.g., "(function_definition)").
   * @param {string} sourceText - The source code text against which the query was executed.
   * @returns {TSNode[] | null} An array of Tree-sitter nodes representing the query results if found in the cache, otherwise `null`.
   */
  get(queryString: string, sourceText: string): TSNode[] | null;

  /**
   * @method set
   * @description Stores query results in the cache for a given query string and source text.
   *
   * @param {string} queryString - The Tree-sitter query string.
   * @param {string} sourceText - The source code text.
   * @param {TSNode[]} results - The array of Tree-sitter nodes to cache.
   */
  set(queryString: string, sourceText: string, results: TSNode[]): void;

  /**
   * @method clear
   * @description Clears all entries from the cache, effectively resetting it.
   */
  clear(): void;

  /**
   * @method size
   * @description Returns the current number of unique query results stored in the cache.
   * @returns {number} The number of cached query results.
   */
  size(): number;

  /**
   * @method getStats
   * @description Provides statistics about the cache's performance, including hit and miss counts.
   * @returns {{ hits: number; misses: number; size: number }} An object containing cache statistics.
   */
  getStats(): { hits: number; misses: number; size: number };
}
