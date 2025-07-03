/**
 * Interface for a cache of query results
 *
 * This module defines the interface for caching tree-sitter query results.
 *
 * @module lib/openscad-parser/ast/query/query-cache
 */

import { Node as TSNode } from 'web-tree-sitter';

/**
 * Interface for a cache of query results
 */
export interface QueryCache {
  /**
   * Get cached query results
   * @param queryString The query string
   * @param sourceText The source text
   * @returns The cached results or null if not found
   */
  get(queryString: string, sourceText: string): TSNode[] | null;

  /**
   * Cache query results
   * @param queryString The query string
   * @param sourceText The source text
   * @param results The query results to cache
   */
  set(queryString: string, sourceText: string, results: TSNode[]): void;

  /**
   * Clear the cache
   */
  clear(): void;

  /**
   * Get the number of cached queries
   * @returns The number of cached queries
   */
  size(): number;

  /**
   * Get cache statistics
   * @returns An object with cache statistics
   */
  getStats(): { hits: number; misses: number; size: number };
}
