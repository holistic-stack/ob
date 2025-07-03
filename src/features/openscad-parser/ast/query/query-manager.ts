/**
 * Manager for executing and caching tree-sitter queries
 *
 * This module provides a manager for executing and caching tree-sitter queries.
 *
 * @module lib/openscad-parser/ast/query/query-manager
 */

import { Tree, Query, Node as TSNode, Language } from 'web-tree-sitter';
import type { QueryCache } from './query-cache.js';
import { LRUQueryCache } from './lru-query-cache.js';

/**
 * Manager for executing and caching tree-sitter queries
 */
export class QueryManager {
  /**
   * The cache of query results
   */
  private cache: QueryCache;

  /**
   * The map of query strings to compiled queries
   */
  private queryMap: Map<string, Query> = new Map();

  /**
   * Create a new QueryManager
   * @param language The tree-sitter language
   * @param cache The query cache to use (default: new LRUQueryCache())
   */
  constructor(private language: Language, cache?: QueryCache) {
    this.cache = cache ?? new LRUQueryCache();
  }

  /**
   * Execute a query on a tree
   * @param queryString The query string
   * @param tree The tree to query
   * @returns The query results
   */
  executeQuery(queryString: string, tree: Tree): TSNode[] {
    const sourceText = tree.rootNode.text;

    // Check cache first
    const cachedResults = this.cache.get(queryString, sourceText);
    if (cachedResults) {
      return cachedResults;
    }

    // Execute the query
    const results = this.executeQueryInternal(queryString, tree);

    // Cache the results
    this.cache.set(queryString, sourceText, results);

    return results;
  }

  /**
   * Execute a query on a specific node
   * @param queryString The query string
   * @param node The node to query
   * @param sourceText The source text (for caching)
   * @returns The query results
   */
  executeQueryOnNode(
    queryString: string,
    node: TSNode,
    sourceText: string
  ): TSNode[] {
    // Create a cache key for the node
    const nodeText = node.text;
    const nodeCacheKey = `${queryString}:${nodeText}`;

    // Check cache first
    const cachedResults = this.cache.get(nodeCacheKey, sourceText);
    if (cachedResults) {
      return cachedResults;
    }

    // Get or create the query
    let query = this.queryMap.get(queryString);
    if (!query) {
      // Use new Query constructor instead of deprecated language.query()
      query = new Query(this.language, queryString);
      if (query) {
        this.queryMap.set(queryString, query);
      }
    }

    // Execute the query
    const results: TSNode[] = [];
    if (query) {
      try {
        // Try the new API first (captures method)
        const captures = query.captures(node);
        for (const capture of captures) {
          // Handle different API formats
          if (Array.isArray(capture)) {
            results.push(capture[1]); // New API format: [pattern, node]
          } else if (
            capture &&
            typeof capture === 'object' &&
            'node' in capture
          ) {
            results.push(capture.node); // Old API format: { node, ... }
          }
        }
      } catch (_error) {
        try {
          // Fallback to the old API (matches method)
          const matches = query.matches(node);
          for (const match of matches) {
            for (const capture of match.captures) {
              results.push(capture.node);
            }
          }
        } catch (_error) {
          console.error(
            `[QueryManager.executeQueryOnNode] Error executing query: ${_error}`
          );
        }
      }
    }

    // Cache the results
    this.cache.set(nodeCacheKey, sourceText, results);

    return results;
  }

  /**
   * Find nodes by type in a tree
   * @param nodeType The node type to find
   * @param tree The tree to search
   * @returns The nodes of the specified type
   */
  findNodesByType(nodeType: string, tree: Tree): TSNode[] {
    const queryString = `(${nodeType}) @node`;
    return this.executeQuery(queryString, tree);
  }

  /**
   * Find nodes by multiple types in a tree
   * @param nodeTypes The node types to find
   * @param tree The tree to search
   * @returns The nodes of the specified types
   */
  findNodesByTypes(nodeTypes: string[], tree: Tree): TSNode[] {
    const queryString = nodeTypes.map(type => `(${type}) @node`).join('\n');
    return this.executeQuery(queryString, tree);
  }

  /**
   * Clear the cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   * @returns An object with cache statistics
   */
  getCacheStats(): { hits: number; misses: number; size: number } {
    return this.cache.getStats();
  }

  /**
   * Execute a query on a tree without using the cache
   * @param queryString The query string
   * @param tree The tree to query
   * @returns The query results
   */
  private executeQueryInternal(queryString: string, tree: Tree): TSNode[] {
    // Get or create the query
    let query = this.queryMap.get(queryString);
    if (!query) {
      // Use new Query constructor instead of deprecated language.query()
      query = new Query(this.language, queryString);
      if (query) {
        this.queryMap.set(queryString, query);
      }
    }

    // Execute the query
    const results: TSNode[] = [];
    if (query) {
      try {
        // Try the new API first (captures method)
        const captures = query.captures(tree.rootNode);
        for (const capture of captures) {
          // Handle different API formats
          if (Array.isArray(capture)) {
            results.push(capture[1]); // New API format: [pattern, node]
          } else if (
            capture &&
            typeof capture === 'object' &&
            'node' in capture
          ) {
            results.push(capture.node); // Old API format: { node, ... }
          }
        }
      } catch (_error) {
        try {
          // Fallback to the old API (matches method)
          const matches = query.matches(tree.rootNode);
          for (const match of matches) {
            for (const capture of match.captures) {
              results.push(capture.node);
            }
          }
        } catch (_error) {
          console.error(
            `[QueryManager.executeQueryInternal] Error executing query: ${_error}`
          );
        }
      }
    }

    return results;
  }
}
