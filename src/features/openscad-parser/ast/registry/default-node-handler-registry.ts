// These imports are not used directly in this file
// import { Node as TSNode } from 'web-tree-sitter';
// import * as ast from '../ast-types.js';
import type { NodeHandler, NodeHandlerRegistry } from './node-handler-registry.js';

/**
 * Default implementation of the NodeHandlerRegistry interface
 * Uses a Map for O(1) lookup performance
 */
export class DefaultNodeHandlerRegistry implements NodeHandlerRegistry {
  private handlers: Map<string, NodeHandler> = new Map();

  /**
   * Register a error-handling for a specific node type
   * @param nodeType The type of node to handle (e.g., 'cube', 'sphere', 'translate')
   * @param handler The function that handles the node
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
   * Get a error-handling for a specific node type
   * @param nodeType The type of node to handle
   * @returns The error-handling function or null if not found
   */
  getHandler(nodeType: string): NodeHandler | null {
    return this.handlers.get(nodeType) ?? null;
  }

  /**
   * Check if a error-handling exists for a specific node type
   * @param nodeType The type of node to check
   * @returns True if a error-handling exists, false otherwise
   */
  hasHandler(nodeType: string): boolean {
    return this.handlers.has(nodeType);
  }

  /**
   * Get all registered node types
   * @returns An array of registered node types
   */
  getRegisteredNodeTypes(): string[] {
    return Array.from(this.handlers.keys());
  }
}
