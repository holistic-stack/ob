/**
 * @file default-node-handler-registry.ts
 * @description This file implements the `DefaultNodeHandlerRegistry` class, which provides a default
 * implementation of the `NodeHandlerRegistry` interface. It uses a `Map` to efficiently store and
 * retrieve `NodeHandler` functions based on their associated AST node types.
 *
 * @architectural_decision
 * The `DefaultNodeHandlerRegistry` adheres to the Strategy pattern by implementing the `NodeHandlerRegistry` interface.
 * This allows for a flexible and extensible way to manage how different AST node types are processed.
 * Using a `Map` for handler storage provides O(1) average time complexity for lookups, insertions, and deletions,
 * which is crucial for performance in a parser that frequently dispatches nodes to their handlers.
 * This registry is designed to be the primary mechanism for mapping Tree-sitter CST node types to their
 * corresponding AST conversion logic.
 *
 * @example
 * ```typescript
 * import { DefaultNodeHandlerRegistry } from './default-node-handler-registry';
 * import type { NodeHandler } from './node-handler-registry';
 * import * as TreeSitter from 'web-tree-sitter';
 * import { SimpleErrorHandler } from '../../error-handling/simple-error-handler';
 *
 * // Example of a simple node handler for a 'cube' node
 * const cubeHandler: NodeHandler = (node, sourceCode, language, errorHandler) => {
 *   // In a real scenario, you'd extract parameters and create a CubeNode AST object
 *   console.log(`Handling cube node: ${node.text}`);
 *   return { type: 'cube', size: 10 }; // Simplified AST node
 * };
 *
 * // Create a new registry instance
 * const registry = new DefaultNodeHandlerRegistry();
 *
 * // Register the cube handler
 * registry.register('cube', cubeHandler);
 *
 * // Get and use a handler
 * const handler = registry.getHandler('cube');
 * if (handler) {
 *   // Assume a mock Tree-sitter node for 'cube'
 *   const mockNode: TreeSitter.Node = { type: 'cube', text: 'cube(10)' } as TreeSitter.Node;
 *   const errorHandler = new SimpleErrorHandler();
 *   const language = {} as TreeSitter.Language; // Mock language
 *   const astNode = handler(mockNode, 'cube(10);', language, errorHandler);
 *   console.log('Processed AST Node:', astNode);
 * } else {
 *   console.log('No handler found for cube node.');
 * }
 *
 * console.log('Registered Node Types:', registry.getRegisteredNodeTypes()); // Expected: ['cube']
 * console.log('Has handler for sphere?', registry.hasHandler('sphere')); // Expected: false
 * ```
 */

import type { NodeHandler, NodeHandlerRegistry } from './node-handler-registry.js';

/**
 * @class DefaultNodeHandlerRegistry
 * @description A default implementation of the `NodeHandlerRegistry` interface.
 * It uses a `Map` to store `NodeHandler` functions, providing efficient lookup by node type.
 */
export class DefaultNodeHandlerRegistry implements NodeHandlerRegistry {
  /**
   * @property {Map<string, NodeHandler>} handlers - The internal Map that stores the registered node handlers.
   * Keys are Tree-sitter node types (strings), and values are the corresponding `NodeHandler` functions.
   */
  private handlers: Map<string, NodeHandler> = new Map();

  /**
   * @method register
   * @description Registers a `NodeHandler` function for a specific Tree-sitter node type.
   * If a handler for the given node type already exists, it will be overwritten.
   *
   * @param {string} nodeType - The type of the Tree-sitter node (e.g., 'cube', 'translate', 'binary_expression').
   * @param {NodeHandler} handler - The function that will process nodes of the specified type.
   * @throws {Error} If `nodeType` is empty or `handler` is null/undefined.
   */
  register(nodeType: string, handler: NodeHandler): void {
    if (!nodeType) {
      throw new Error('Node type cannot be empty');
    }
    if (!handler) {
      throw new Error('Handler cannot be null or undefined');
    }
    this.handlers.set(nodeType, handler);
  }

  /**
   * @method getHandler
   * @description Retrieves the `NodeHandler` function registered for a given node type.
   *
   * @param {string} nodeType - The type of the Tree-sitter node.
   * @returns {NodeHandler | null} The registered `NodeHandler` function, or `null` if no handler is found for the type.
   */
  getHandler(nodeType: string): NodeHandler | null {
    return this.handlers.get(nodeType) ?? null;
  }

  /**
   * @method hasHandler
   * @description Checks if a `NodeHandler` is registered for the specified node type.
   *
   * @param {string} nodeType - The type of the Tree-sitter node.
   * @returns {boolean} `true` if a handler exists for the node type, `false` otherwise.
   */
  hasHandler(nodeType: string): boolean {
    return this.handlers.has(nodeType);
  }

  /**
   * @method getRegisteredNodeTypes
   * @description Returns an array of all Tree-sitter node types for which a handler is currently registered.
   * @returns {string[]} An array of registered node type strings.
   */
  getRegisteredNodeTypes(): string[] {
    return Array.from(this.handlers.keys());
  }
}
