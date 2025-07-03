import { Node as TSNode } from 'web-tree-sitter';
import * as ast from '../ast-types.js';

/**
 * Type definition for a node error-handling function
 */
export type NodeHandler = (
  node: TSNode,
  args: ast.Parameter[]
) => ast.ASTNode | null;

/**
 * Interface for a registry of node handlers
 * Provides methods for registering, looking up, and checking for handlers
 */
export interface NodeHandlerRegistry {
  /**
   * Register a error-handling for a specific node type
   * @param nodeType The type of node to handle (e.g., 'cube', 'sphere', 'translate')
   * @param handler The function that handles the node
   */
  register(nodeType: string, handler: NodeHandler): void;

  /**
   * Get a error-handling for a specific node type
   * @param nodeType The type of node to handle
   * @returns The error-handling function or null if not found
   */
  getHandler(nodeType: string): NodeHandler | null;

  /**
   * Check if a error-handling exists for a specific node type
   * @param nodeType The type of node to check
   * @returns True if a error-handling exists, false otherwise
   */
  hasHandler(nodeType: string): boolean;

  /**
   * Get all registered node types
   * @returns An array of registered node types
   */
  getRegisteredNodeTypes(): string[];
}
