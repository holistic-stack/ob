/**
 * LRU (Least Recently Used) implementation of the QueryCache interface
 *
 * This module provides an implementation of the QueryCache interface
 * using an LRU (Least Recently Used) eviction policy.
 *
 * @module lib/openscad-parser/ast/query/lru-query-cache
 */

import { Node as TSNode } from 'web-tree-sitter';
import type { QueryCache } from './query-cache.js';

/**
 * LRU (Least Recently Used) implementation of the QueryCache interface
 */
export class LRUQueryCache implements QueryCache {
  /**
   * The cache of query results
   *
   * The outer map uses a cache key (query string + source hash) as the key
   * and a map of source text to query results as the value.
   */
  private cache: Map<string, TSNode[]> = new Map();

  /**
   * The maximum number of queries to cache
   */
  private maxSize: number;

  /**
   * The number of cache hits
   */
  private hits: number = 0;

  /**
   * The number of cache misses
   */
  private misses: number = 0;

  /**
   * Create a new LRUQueryCache
   * @param maxSize The maximum number of queries to cache (default: 100)
   */
  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }

  /**
   * Get cached query results
   * @param queryString The query string
   * @param sourceText The source text
   * @returns The cached results or null if not found
   */
  get(queryString: string, sourceText: string): TSNode[] | null {
    const cacheKey = this.getCacheKey(queryString, sourceText);
    const results = this.cache.get(cacheKey);

    if (!results) {
      this.misses++;
      return null;
    }

    // Move the entry to the end of the map to mark it as recently used
    this.cache.delete(cacheKey);
    this.cache.set(cacheKey, results);

    this.hits++;
    return results;
  }

  /**
   * Cache query results
   * @param queryString The query string
   * @param sourceText The source text
   * @param results The query results to cache
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
   * Clear the cache
   */
  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Get the number of cached queries
   * @returns The number of cached queries
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Get cache statistics
   * @returns An object with cache statistics
   */
  getStats(): { hits: number; misses: number; size: number } {
    return {
      hits: this.hits,
      misses: this.misses,
      size: this.cache.size,
    };
  }

  /**
   * Get a cache key for a query and source text
   * @param queryString The query string
   * @param sourceText The source text
   * @returns A cache key
   */
  private getCacheKey(queryString: string, sourceText: string): string {
    // Use a hash of the source text to avoid storing the entire text in the key
    const sourceHash = this.hashString(sourceText);
    return `${queryString}:${sourceHash}`;
  }

  /**
   * Hash a string
   * @param str The string to hash
   * @returns A hash of the string
   */
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(16);
  }
}
