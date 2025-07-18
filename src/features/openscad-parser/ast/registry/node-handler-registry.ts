/**
 * @file node-handler-registry.ts
 * @description This file defines the `NodeHandler` type and the `NodeHandlerRegistry` interface.
 * These are fundamental components for implementing the Visitor pattern in the AST generation process,
 * allowing for a flexible and extensible way to map Tree-sitter CST nodes to their corresponding
 * Abstract Syntax Tree (AST) conversion logic.
 *
 * @architectural_decision
 * The `NodeHandlerRegistry` interface promotes a pluggable architecture for managing node handlers.
 * This means different implementations (e.g., a default registry, a custom registry with specific overrides)
 * can be used interchangeably. The `NodeHandler` type defines the signature for functions responsible
 * for converting a Tree-sitter node into an AST node, ensuring consistency across all handlers.
 * This design decouples the AST generation logic from the specific details of each node's conversion,
 * making the system more modular and easier to extend with new OpenSCAD features.
 *
 * @example
 * ```typescript
 * import type { NodeHandler, NodeHandlerRegistry } from './node-handler-registry';
 * import * as TreeSitter from 'web-tree-sitter';
 * import type * as ast from '../ast-types';
 * import { SimpleErrorHandler } from '../../error-handling/simple-error-handler';
 *
 * // Example of a concrete implementation of NodeHandlerRegistry
 * class CustomRegistry implements NodeHandlerRegistry {
 *   private handlers = new Map<string, NodeHandler>();
 *
 *   register(nodeType: string, handler: NodeHandler): void {
 *     this.handlers.set(nodeType, handler);
 *   }
 *
 *   getHandler(nodeType: string): NodeHandler | null {
 *     return this.handlers.get(nodeType) ?? null;
 *   }
 *
 *   hasHandler(nodeType: string): boolean {
 *     return this.handlers.has(nodeType);
 *   }
 *
 *   getRegisteredNodeTypes(): string[] {
 *     return Array.from(this.handlers.keys());
 *   }
 * }
 *
 * // Example of a NodeHandler for a 'sphere' node
 * const sphereHandler: NodeHandler = (node, sourceCode, language, errorHandler) => {
 *   // In a real scenario, you'd extract radius, $fn, etc., from the node
 *   // and create a proper SphereNode AST object.
 *   console.log(`Processing sphere node: ${node.text}`);
 *   return { type: 'sphere', radius: 10 }; // Simplified AST node
 * };
 *
 * // Usage:
 * const registry = new CustomRegistry();
 * registry.register('sphere', sphereHandler);
 *
 * const mockNode: TreeSitter.Node = { type: 'sphere', text: 'sphere(10)' } as TreeSitter.Node;
 * const errorHandler = new SimpleErrorHandler();
 * const language = {} as TreeSitter.Language; // Mock language
 * const astNode = registry.getHandler('sphere')?.(mockNode, 'sphere(10);', language, errorHandler);
 * console.log('Generated AST Node:', astNode);
 * ```
 */

import type { Language, Node as TSNode } from 'web-tree-sitter';
import type { ErrorHandler } from '../../error-handling/index.js';
import type * as ast from '../ast-types.js';

/**
 * @type NodeHandler
 * @description Defines the signature for a function that converts a Tree-sitter CST node
 * into an Abstract Syntax Tree (AST) node. These functions are responsible for extracting
 * relevant information from the CST node and its children to construct the semantic AST representation.
 *
 * @param {TSNode} node - The Tree-sitter CST node to be processed.
 * @param {string} sourceCode - The complete source code string, useful for extracting node text accurately.
 * @param {Language} language - The Tree-sitter Language object, useful for creating queries.
 * @param {ErrorHandler} errorHandler - An error handler instance for reporting any issues during conversion.
 * @returns {ast.ASTNode | null} The generated AST node, or `null` if the node cannot be converted.
 */
export type NodeHandler = (
  node: TSNode,
  sourceCode: string,
  language: Language,
  errorHandler: ErrorHandler
) => ast.ASTNode | null;

/**
 * @interface NodeHandlerRegistry
 * @description Defines the interface for a registry that manages `NodeHandler` functions.
 * It provides methods for registering, retrieving, and checking for the existence of handlers
 * based on Tree-sitter node types.
 */
export interface NodeHandlerRegistry {
  /**
   * @method register
   * @description Registers a `NodeHandler` function for a specific Tree-sitter node type.
   * If a handler for the given `nodeType` already exists, it will be overwritten.
   *
   * @param {string} nodeType - The type of the Tree-sitter node (e.g., 'cube', 'translate', 'binary_expression').
   * @param {NodeHandler} handler - The function that will process nodes of the specified type.
   */
  register(nodeType: string, handler: NodeHandler): void;

  /**
   * @method getHandler
   * @description Retrieves the `NodeHandler` function registered for a given node type.
   *
   * @param {string} nodeType - The type of the Tree-sitter node.
   * @returns {NodeHandler | null} The registered `NodeHandler` function, or `null` if no handler is found for the type.
   */
  getHandler(nodeType: string): NodeHandler | null;

  /**
   * @method hasHandler
   * @description Checks if a `NodeHandler` is registered for the specified node type.
   *
   * @param {string} nodeType - The type of the Tree-sitter node.
   * @returns {boolean} `true` if a handler exists for the node type, `false` otherwise.
   */
  hasHandler(nodeType: string): boolean;

  /**
   * @method getRegisteredNodeTypes
   * @description Returns an array of all Tree-sitter node types for which a handler is currently registered.
   * @returns {string[]} An array of registered node type strings.
   */
  getRegisteredNodeTypes(): string[];
}
