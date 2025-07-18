/**
 * @file query-manager.ts
 * @description This file implements the `QueryManager` class, which is responsible for efficiently executing
 * and caching Tree-sitter queries. It serves as a central point for all query operations within the parser,
 * optimizing performance by reusing compiled queries and caching their results.
 *
 * @architectural_decision
 * The `QueryManager` centralizes Tree-sitter query operations, promoting reusability and performance.
 * It uses a `QueryCache` (e.g., `LRUQueryCache`) to store and retrieve query results, significantly reducing
 * redundant computations. The manager also handles the lifecycle of `Query` objects, ensuring they are compiled
 * once and disposed of properly. This design decouples query execution from the rest of the parser, making
 * the system more modular and easier to maintain.
 *
 * @example
 * ```typescript
 * import { QueryManager } from './query-manager';
 * import { LRUQueryCache } from './lru-query-cache';
 * import * as TreeSitter from 'web-tree-sitter';
 *
 * async function demonstrateQueryManager() {
 *   // Assume Tree-sitter is initialized and language loaded
 *   await TreeSitter.Parser.init();
 *   const parser = new TreeSitter.Parser();
 *   const language = await TreeSitter.Language.load('./tree-sitter-openscad.wasm');
 *   parser.setLanguage(language);
 *
 *   const code = 'module foo() { cube(10); }\nfunction bar() = 20;\n';
 *   const tree = parser.parse(code);
 *
 *   const cache = new LRUQueryCache(50); // Cache up to 50 queries
 *   const queryManager = new QueryManager(language, cache);
 *
 *   // Example 1: Execute a query to find all module definitions
 *   const moduleQuery = '(module_definition (name) @module_name)';
 *   const moduleNodes = queryManager.executeQuery(moduleQuery, tree);
 *   console.log('Module Names:', moduleNodes.map(node => node.text)); // Expected: ['foo']
 *
 *   // Example 2: Find all function definitions by type
 *   const functionNodes = queryManager.findNodesByType('function_definition', tree);
 *   console.log('Function Definitions:', functionNodes.map(node => node.text)); // Expected: ['function bar() = 20;']
 *
 *   // Example 3: Execute a query on a specific node (e.g., the root node)
 *   const allIdentifiersQuery = '(identifier) @id';
 *   const identifiers = queryManager.executeQueryOnNode(allIdentifiersQuery, tree.rootNode, code);
 *   console.log('All Identifiers:', identifiers.map(node => node.text)); // Expected: ['foo', 'cube', 'bar']
 *
 *   console.log('Cache Stats:', queryManager.getCacheStats());
 *
 *   queryManager.dispose();
 *   parser.delete();
 *   language.delete();
 * }
 *
 * demonstrateQueryManager();
 * ```
 */

import { type Language, Query, type Tree, type Node as TSNode } from 'web-tree-sitter';
import { LRUQueryCache } from './lru-query-cache.js';
import type { QueryCache } from './query-cache.js';

/**
 * @class QueryManager
 * @description Manages the execution and caching of Tree-sitter queries.
 * It provides methods to execute queries on entire trees or specific nodes, and caches results for performance.
 */
export class QueryManager {
  /**
   * @property {QueryCache} cache - The caching mechanism used to store query results.
   */
  private cache: QueryCache;

  /**
   * @property {Map<string, Query>} queryMap - A map storing compiled Tree-sitter `Query` objects,
   * keyed by their query string, to avoid recompilation.
   */
  private queryMap: Map<string, Query> = new Map();

  /**
   * @constructor
   * @description Creates a new `QueryManager` instance.
   *
   * @param {Language} language - The Tree-sitter `Language` object for the grammar being queried.
   * @param {QueryCache} [cache] - An optional `QueryCache` implementation to use. Defaults to `LRUQueryCache`.
   */
  constructor(
    private language: Language,
    cache?: QueryCache
  ) {
    this.cache = cache ?? new LRUQueryCache();
  }

  /**
   * @method executeQuery
   * @description Executes a Tree-sitter query on an entire `Tree` and returns the matching nodes.
   * Results are cached based on the query string and the source text of the tree.
   *
   * @param {string} queryString - The Tree-sitter query string (e.g., "(function_definition)").
   * @param {Tree} tree - The Tree-sitter `Tree` to query.
   * @returns {TSNode[]} An array of Tree-sitter `Node` objects that match the query.
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
   * @method executeQueryOnNode
   * @description Executes a Tree-sitter query on a specific `TSNode` (and its descendants) and returns the matching nodes.
   * Results are cached based on the query string and the text of the specific node.
   *
   * @param {string} queryString - The Tree-sitter query string.
   * @param {TSNode} node - The Tree-sitter `Node` to query within.
   * @param {string} sourceText - The full source code text (used for cache key generation).
   * @returns {TSNode[]} An array of Tree-sitter `Node` objects that match the query within the given node's scope.
   */
  executeQueryOnNode(queryString: string, node: TSNode, sourceText: string): TSNode[] {
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
      try {
        // Use new Query constructor instead of deprecated language.query()
        query = new Query(this.language, queryString);
        if (query) {
          this.queryMap.set(queryString, query);
        }
      } catch (error) {
        console.error(`[QueryManager.executeQueryOnNode] Error creating query: ${error}`);
        return [];
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
          } else if (capture && typeof capture === 'object' && 'node' in capture) {
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
          console.error(`[QueryManager.executeQueryOnNode] Error executing query: ${_error}`);
        }
      }
    }

    // Cache the results
    this.cache.set(nodeCacheKey, sourceText, results);

    return results;
  }

  /**
   * @method findNodesByType
   * @description Finds all nodes of a specific type within a given Tree-sitter `Tree`.
   * This is a convenience method that internally uses `executeQuery`.
   *
   * @param {string} nodeType - The type of the node to find (e.g., 'function_definition').
   * @param {Tree} tree - The Tree-sitter `Tree` to search within.
   * @returns {TSNode[]} An array of Tree-sitter `Node` objects matching the specified type.
   */
  findNodesByType(nodeType: string, tree: Tree): TSNode[] {
    const queryString = `(${nodeType}) @node`;
    return this.executeQuery(queryString, tree);
  }

  /**
   * @method findNodesByTypes
   * @description Finds all nodes of multiple specified types within a given Tree-sitter `Tree`.
   * This is a convenience method that internally constructs a combined query and uses `executeQuery`.
   *
   * @param {string[]} nodeTypes - An array of node types to find.
   * @param {Tree} tree - The Tree-sitter `Tree` to search within.
   * @returns {TSNode[]} An array of Tree-sitter `Node` objects matching any of the specified types.
   */
  findNodesByTypes(nodeTypes: string[], tree: Tree): TSNode[] {
    const queryString = nodeTypes.map((type) => `(${type}) @node`).join('\n');
    return this.executeQuery(queryString, tree);
  }

  /**
   * @method clearCache
   * @description Clears all cached query results from the internal `QueryCache`.
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * @method getCacheStats
   * @description Retrieves statistics about the query cache usage.
   * @returns {{ hits: number; misses: number; size: number }} An object containing cache hit, miss, and size statistics.
   */
  getCacheStats(): { hits: number; misses: number; size: number } {
    return this.cache.getStats();
  }

  /**
   * @method dispose
   * @description Disposes of all resources managed by the `QueryManager`, including compiled Tree-sitter `Query` objects
   * and clearing the cache. This should be called when the manager is no longer needed to prevent memory leaks.
   */
  dispose(): void {
    // Delete all cached Query objects
    for (const query of this.queryMap.values()) {
      if (query && typeof query.delete === 'function') {
        query.delete();
      }
    }
    this.queryMap.clear();

    // Clear the cache
    this.cache.clear();
  }

  /**
   * @method executeQueryInternal
   * @description Internal method to execute a Tree-sitter query without checking or updating the cache.
   * This method handles the compilation of the query if it's not already compiled and executes it.
   *
   * @param {string} queryString - The Tree-sitter query string.
   * @param {Tree} tree - The Tree-sitter `Tree` to query.
   * @returns {TSNode[]} An array of Tree-sitter `Node` objects that match the query.
   * @private
   */
  private executeQueryInternal(queryString: string, tree: Tree): TSNode[] {
    // Get or create the query
    let query = this.queryMap.get(queryString);
    if (!query) {
      try {
        // Use new Query constructor instead of deprecated language.query()
        query = new Query(this.language, queryString);
        if (query) {
          this.queryMap.set(queryString, query);
        }
      } catch (error) {
        console.error(`[QueryManager.executeQueryInternal] Error creating query: ${error}`);
        return [];
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
          } else if (capture && typeof capture === 'object' && 'node' in capture) {
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
          console.error(`[QueryManager.executeQueryInternal] Error executing query: ${_error}`);
        }
      }
    }

    return results;
  }
}
