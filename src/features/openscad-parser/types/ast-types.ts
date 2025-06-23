/**
 * @file OpenSCAD AST Types
 * 
 * Type definitions for OpenSCAD Abstract Syntax Tree nodes.
 * Re-exports types from @holistic-stack/openscad-parser with additional
 * pipeline-specific types and utilities.
 * 
 * @author OpenSCAD-R3F Pipeline
 * @version 1.0.0
 */

import * as Parser from '@holistic-stack/openscad-parser';

// ============================================================================
// Re-exported and Aliased Parser Types
// ============================================================================

export type ASTNode = Parser.ASTNode;
export type StatementNode = Parser.StatementNode;
export type ExpressionNode = Parser.ExpressionNode;
export type CubeNode = Parser.CubeNode;
export type SphereNode = Parser.SphereNode;
export type CylinderNode = Parser.CylinderNode;
export type PolyhedronNode = Parser.PolyhedronNode;
export type TranslateNode = Parser.TranslateNode;
export type RotateNode = Parser.RotateNode;
export type ScaleNode = Parser.ScaleNode;
export type MirrorNode = Parser.MirrorNode;
export type UnionNode = Parser.UnionNode;
export type DifferenceNode = Parser.DifferenceNode;
export type IntersectionNode = Parser.IntersectionNode;
export type ModuleDefinitionNode = Parser.ModuleDefinitionNode;
export type FunctionDefinitionNode = Parser.FunctionDefinitionNode;
export type FunctionCallNode = Parser.FunctionCallNode;
export type IfNode = Parser.IfNode;
export type VariableNode = Parser.VariableNode;
export type LiteralNode = Parser.LiteralNode;
export type BinaryOperationNode = Parser.BinaryOperator;
export type UnaryOperationNode = Parser.UnaryOperator;
export type Vector3 = Parser.Vector3D;
export type Vector2 = Parser.Vector2D;
export type NodeLocation = Parser.NodeLocation;
export type ParameterNode = Parser.Parameter;


// ============================================================================
// Pipeline-Specific Types
// ============================================================================

/**
 * Result type for functional programming patterns
 */
export type Result<T, E = string> = 
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly error: E };

/**
 * Parse error with location information
 */
export interface ParseError {
  readonly message: string;
  readonly location: {
    readonly line: number;
    readonly column: number;
    readonly startIndex?: number;
    readonly endIndex?: number;
  };
  readonly severity: 'error' | 'warning' | 'info';
  readonly code?: string;
}

/**
 * Parse result containing AST and errors
 */
export interface ParseResult {
  readonly ast: readonly ASTNode[];
  readonly errors: readonly ParseError[];
  readonly success: boolean;
  readonly parseTime: number;
  readonly cacheHit?: boolean;
}

/**
 * Parser configuration options
 */
export interface ParserConfig {
  readonly enableLogging?: boolean;
  readonly timeout?: number;
  readonly enableCaching?: boolean;
  readonly maxCacheSize?: number;
  readonly enableValidation?: boolean;
}

/**
 * Parser state for hooks
 */
export interface ParserState {
  readonly isInitialized: boolean;
  readonly isParsing: boolean;
  readonly ast: readonly ASTNode[] | null;
  readonly errors: readonly ParseError[];
  readonly parseTime: number;
  readonly cacheStats: {
    readonly hits: number;
    readonly misses: number;
    readonly size: number;
  };
}

/**
 * Parser actions for hooks
 */
export interface ParserActions {
  readonly parseCode: (code: string, options?: ParserConfig) => Promise<Result<readonly ASTNode[], readonly ParseError[]>>;
  readonly clearCache: () => void;
  readonly reset: () => void;
  readonly dispose: () => void;
}

/**
 * Complete parser hook interface
 */
export interface UseOpenSCADParserResult extends ParserState, ParserActions {
  readonly astData: readonly ASTNode[] | null;
  readonly parseErrors: readonly ParseError[];
  readonly isReady: boolean;
}

// ============================================================================
// Type Guards and Utilities
// ============================================================================

/**
 * Type guard to check if a node is a primitive node
 */
export function isPrimitiveNode(node: ASTNode): node is CubeNode | SphereNode | CylinderNode | PolyhedronNode {
  return node.type === 'cube' || 
         node.type === 'sphere' || 
         node.type === 'cylinder' || 
         node.type === 'polyhedron';
}

/**
 * Type guard to check if a node is a transform node
 */
export function isTransformNode(node: ASTNode): node is TranslateNode | RotateNode | ScaleNode | MirrorNode {
  return node.type === 'translate' || 
         node.type === 'rotate' || 
         node.type === 'scale' || 
         node.type === 'mirror';
}

/**
 * Type guard to check if a node is a CSG operation node
 */
export function isCSGNode(node: ASTNode): node is UnionNode | DifferenceNode | IntersectionNode {
  return node.type === 'union' || 
         node.type === 'difference' || 
         node.type === 'intersection';
}

/**
 * Type guard to check if a node is a module-related node
 */
export function isModuleNode(node: ASTNode): node is ModuleDefinitionNode {
  return node.type === 'module_definition';
}

/**
 * Extract all primitive nodes from an AST
 */
export function extractPrimitiveNodes(ast: readonly ASTNode[]): readonly (CubeNode | SphereNode | CylinderNode | PolyhedronNode)[] {
  const primitives: (CubeNode | SphereNode | CylinderNode | PolyhedronNode)[] = [];
  
  function traverse(nodes: readonly ASTNode[]) {
    for (const node of nodes) {
      if (isPrimitiveNode(node)) {
        primitives.push(node);
      }
      
      // Recursively traverse children
      if ('children' in node && Array.isArray(node.children)) {
        traverse(node.children);
      }
    }
  }
  
  traverse(ast);
  return Object.freeze(primitives);
}

/**
 * Extract all CSG operations from an AST
 */
export function extractCSGOperations(ast: readonly ASTNode[]): readonly (UnionNode | DifferenceNode | IntersectionNode)[] {
  const operations: (UnionNode | DifferenceNode | IntersectionNode)[] = [];
  
  function traverse(nodes: readonly ASTNode[]) {
    for (const node of nodes) {
      if (isCSGNode(node)) {
        operations.push(node);
      }
      
      // Recursively traverse children
      if ('children' in node && Array.isArray(node.children)) {
        traverse(node.children);
      }
    }
  }
  
  traverse(ast);
  return Object.freeze(operations);
}

/**
 * Count nodes by type in an AST
 */
export function countNodesByType(ast: readonly ASTNode[]): Record<string, number> {
  const counts: Record<string, number> = {};
  
  function traverse(nodes: readonly ASTNode[]) {
    for (const node of nodes) {
      counts[node.type] = (counts[node.type] || 0) + 1;
      
      // Recursively traverse children
      if ('children' in node && Array.isArray(node.children)) {
        traverse(node.children);
      }
    }
  }
  
  traverse(ast);
  return counts;
}

/**
 * Calculate AST depth
 */
export function calculateASTDepth(ast: readonly ASTNode[]): number {
  let maxDepth = 0;
  
  function traverse(nodes: readonly ASTNode[], depth: number) {
    maxDepth = Math.max(maxDepth, depth);
    
    for (const node of nodes) {
      if ('children' in node && Array.isArray(node.children)) {
        traverse(node.children, depth + 1);
      }
    }
  }
  
  traverse(ast, 1);
  return maxDepth;
}

/**
 * Validate AST structure
 */
export function validateAST(ast: readonly ASTNode[]): Result<true, readonly ParseError[]> {
  const errors: ParseError[] = [];
  
  function traverse(nodes: readonly ASTNode[], path: string = 'root') {
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      if (!node) continue; // Skip undefined nodes
      const nodePath = `${path}[${i}]`;
      
      // Check required properties
      if (!node.type) {
        errors.push({
          message: `Node missing required 'type' property`,
          location: { line: 0, column: 0 },
          severity: 'error',
          code: 'MISSING_TYPE'
        });
      }
      
      // Validate children if present
      if ('children' in node && Array.isArray(node.children)) {
        traverse(node.children, `${nodePath}.children`);
      }
    }
  }
  
  traverse(ast);
  
  if (errors.length > 0) {
    return { success: false, error: errors };
  }
  
  return { success: true, data: true };
}
