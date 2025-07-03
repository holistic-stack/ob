/**
 * @file Query-based visitor for OpenSCAD parser with CST search capabilities
 *
 * This module implements the QueryVisitor class, which combines the power of
 * tree-sitter queries with the visitor pattern to provide advanced CST search
 * and processing capabilities. The QueryVisitor acts as a decorator around other
 * visitors, adding query-based node discovery while delegating actual processing
 * to specialized visitor implementations.
 *
 * The QueryVisitor handles:
 * - **Query-Based Node Discovery**: Advanced CST search using tree-sitter queries
 * - **Visitor Delegation**: Seamless integration with existing visitor implementations
 * - **Performance Optimization**: Query result caching for improved performance
 * - **Flexible Search Patterns**: Support for complex node selection criteria
 * - **Batch Processing**: Efficient processing of multiple node types simultaneously
 * - **Cache Management**: Query result caching with statistics and cache control
 *
 * Key features:
 * - **Tree-Sitter Query Integration**: Full support for tree-sitter query syntax
 * - **Visitor Pattern Compatibility**: Works with any existing visitor implementation
 * - **Query Result Caching**: Automatic caching of query results for performance
 * - **Flexible Node Selection**: Support for single and multiple node type queries
 * - **Custom Query Execution**: Direct query string execution for advanced use cases
 * - **Performance Monitoring**: Cache statistics and performance metrics
 *
 * Query processing patterns:
 * - **Type-Based Queries**: `findNodesByType('cube')` - find all nodes of specific type
 * - **Multi-Type Queries**: `findNodesByTypes(['cube', 'sphere'])` - find multiple types
 * - **Custom Queries**: `executeQuery('(cube) @cube')` - execute custom tree-sitter queries
 * - **Scoped Queries**: `executeQueryOnNode(query, node)` - query within specific node scope
 * - **Batch Processing**: Process multiple query results efficiently
 *
 * The visitor implements a delegation strategy:
 * 1. **Query Execution**: Use QueryManager to find nodes matching criteria
 * 2. **Result Processing**: Delegate found nodes to the wrapped visitor
 * 3. **Cache Management**: Maintain query result cache for performance
 * 4. **Statistics Tracking**: Monitor cache performance and query efficiency
 *
 * @example Basic query visitor usage
 * ```typescript
 * import { QueryVisitor } from './query-visitor';
 * import { PrimitiveVisitor } from './primitive-visitor';
 *
 * const primitiveVisitor = new PrimitiveVisitor(sourceCode, errorHandler);
 * const queryVisitor = new QueryVisitor(sourceCode, tree, language, primitiveVisitor, errorHandler);
 *
 * // Find all cube nodes in the tree
 * const cubeNodes = queryVisitor.findNodesByType('cube');
 *
 * // Process each cube node
 * const cubeASTs = cubeNodes.map(node => queryVisitor.visitNode(node));
 * ```
 *
 * @example Advanced query operations
 * ```typescript
 * // Find multiple primitive types
 * const primitiveNodes = queryVisitor.findNodesByTypes(['cube', 'sphere', 'cylinder']);
 *
 * // Execute custom tree-sitter query
 * const transformNodes = queryVisitor.executeQuery(`
 *   (module_instantiation
 *     name: (identifier) @name
 *     (#match? @name "translate|rotate|scale"))
 * `);
 *
 * // Query within specific scope
 * const childNodes = queryVisitor.executeQueryOnNode('(cube) @cube', parentNode);
 * ```
 *
 * @example Performance monitoring and cache management
 * ```typescript
 * // Get cache performance statistics
 * const stats = queryVisitor.getQueryCacheStats();
 * console.log(`Cache hits: ${stats.hits}, misses: ${stats.misses}, size: ${stats.size}`);
 *
 * // Clear cache when needed
 * queryVisitor.clearQueryCache();
 *
 * // Monitor query performance
 * const startTime = performance.now();
 * const results = queryVisitor.findNodesByType('module_instantiation');
 * const queryTime = performance.now() - startTime;
 * ```
 *
 * @module query-visitor
 * @since 0.1.0
 */

import { Node as TSNode, Tree } from 'web-tree-sitter';
import * as ast from '../ast-types.js';
import type { ASTVisitor } from './ast-visitor.js';
import { BaseASTVisitor } from './base-ast-visitor.js';
import { QueryManager } from '../query/query-manager.js';
import { ErrorHandler } from '../../error-handling/index.js';

/**
 * Query-based visitor that combines tree-sitter queries with visitor pattern delegation.
 *
 * The QueryVisitor extends BaseASTVisitor to provide advanced CST search capabilities
 * while maintaining compatibility with existing visitor implementations. It acts as a
 * decorator that adds query functionality to any visitor, enabling efficient node
 * discovery and batch processing operations.
 *
 * This implementation provides:
 * - **Decorator Pattern**: Wraps existing visitors with query capabilities
 * - **Query Manager Integration**: Leverages QueryManager for efficient CST searches
 * - **Performance Optimization**: Automatic query result caching and statistics
 * - **Flexible Delegation**: Seamless integration with any visitor implementation
 * - **Advanced Search**: Support for complex tree-sitter query patterns
 *
 * The visitor maintains three core components:
 * - **QueryManager**: Handles query execution and result caching
 * - **Delegate Visitor**: The wrapped visitor that performs actual AST processing
 * - **Tree Reference**: The tree-sitter tree for query execution
 *
 * @class QueryVisitor
 * @extends {BaseASTVisitor}
 * @since 0.1.0
 */
export class QueryVisitor extends BaseASTVisitor {
  /**
   * The query manager
   */
  private queryManager: QueryManager;

  /**
   * The tree-sitter tree
   */
  private tree: Tree;

  /**
   * Create a new QueryVisitor
   * @param source The source code
   * @param tree The tree-sitter tree
   * @param language The tree-sitter language
   * @param delegate The visitor to delegate to
   * @param errorHandler The error handler
   */
  constructor(
    source: string,
    tree: Tree,
    language: any,
    private delegate: ASTVisitor,
    errorHandler: ErrorHandler
  ) {
    super(source, errorHandler);
    this.tree = tree;
    this.queryManager = new QueryManager(language);
  }

  /**
   * Visit a node and return the corresponding AST node
   * @param node The node to visit
   * @returns The AST node or null if the node cannot be processed
   */
  override visitNode(node: TSNode): ast.ASTNode | null {
    // Delegate to the delegate visitor
    return this.delegate.visitNode(node);
  }

  /**
   * Find all nodes of a specific type in the tree
   * @param nodeType The node type to find
   * @returns An array of nodes of the specified type
   */
  findNodesByType(nodeType: string): TSNode[] {
    return this.queryManager.findNodesByType(nodeType, this.tree);
  }

  /**
   * Find all nodes of specific types in the tree
   * @param nodeTypes The node types to find
   * @returns An array of nodes of the specified types
   */
  findNodesByTypes(nodeTypes: string[]): TSNode[] {
    return this.queryManager.findNodesByTypes(nodeTypes, this.tree);
  }

  /**
   * Execute a query on the tree
   * @param queryString The query string
   * @returns The query results
   */
  executeQuery(queryString: string): TSNode[] {
    return this.queryManager.executeQuery(queryString, this.tree);
  }

  /**
   * Execute a query on a specific node
   * @param queryString The query string
   * @param node The node to query
   * @returns The query results
   */
  executeQueryOnNode(queryString: string, node: TSNode): TSNode[] {
    return this.queryManager.executeQueryOnNode(queryString, node, this.source);
  }

  /**
   * Clear the query cache
   */
  clearQueryCache(): void {
    this.queryManager.clearCache();
  }

  /**
   * Get query cache statistics
   * @returns An object with cache statistics
   */
  getQueryCacheStats(): { hits: number; misses: number; size: number } {
    return this.queryManager.getCacheStats();
  }

  /**
   * Create an AST node for a specific function
   * @param node The node to process
   * @param functionName The name of the function
   * @param args The arguments to the function
   * @returns The AST node or null if the function is not supported
   */
  protected createASTNodeForFunction(
    node: TSNode,
    functionName: string,
    args: ast.Parameter[]
  ): ast.ASTNode | null {
    // Delegate to the delegate visitor
    if (this.delegate instanceof BaseASTVisitor) {
      return (this.delegate as any).createASTNodeForFunction(
        node,
        functionName,
        args
      );
    }
    return null;
  }
}
