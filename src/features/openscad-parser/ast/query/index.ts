/**
 * @file index.ts
 * @description This file serves as the barrel export for the query caching and optimization module.
 * It consolidates and exports classes related to caching and managing Tree-sitter queries,
 * which are crucial for improving the performance of AST traversal and data extraction.
 *
 * @architectural_decision
 * Using a barrel export for query-related utilities centralizes their access, making it easier
 * for other parts of the parser to import and utilize caching mechanisms. This promotes code
 * organization and simplifies dependency management within the AST module.
 *
 * @example
 * ```typescript
 * import { QueryManager, LRUQueryCache } from './index';
 *
 * // Example usage of QueryManager and LRUQueryCache
 * // (Actual usage would be within the parser's internal logic)
 * const cache = new LRUQueryCache(100); // Cache up to 100 queries
 * const queryManager = new QueryManager(someTreeSitterLanguage, cache);
 *
 * // Get a query (it will be cached after first retrieval)
 * const query = queryManager.getQuery('(function_definition (name) @name)');
 * ```
 */

export * from './lru-query-cache';
export * from './query-cache';
export * from './query-manager';
