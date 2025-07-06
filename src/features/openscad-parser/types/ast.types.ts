/**
 * AST types for OpenSCAD parser
 */

// Re-export TSNode for use throughout the parser
export type { Node as TSNode } from 'web-tree-sitter';

export interface ASTNode {
  readonly type: string;
  readonly location?: SourceLocation;
}

export interface SourceLocation {
  readonly start: Position;
  readonly end: Position;
}

export interface Position {
  readonly line: number;
  readonly column: number;
  readonly offset: number;
}

// Re-export from shared types for backward compatibility
export type {
  CoreNode as BaseNode,
  CoreNode,
  NodeId,
  NodeType,
} from '../../../shared/types/ast.types.js';

// Additional OpenSCAD-specific types can be added here as needed
