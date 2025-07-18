/**
 * @file ast.types.ts
 * @description This file contains the core type definitions for the Abstract Syntax Tree (AST)
 * used by the OpenSCAD parser. These types provide a structured, semantic representation
 * of the OpenSCAD code, which is essential for all downstream processing, including
 * validation, transformation, and 3D model generation.
 *
 * @architectural_decision
 * The AST types are designed to be a clean, language-agnostic representation of OpenSCAD
 * constructs. They are intentionally kept separate from the Tree-sitter CST nodes to
 * provide a more abstract and easier-to-use interface. The types are also designed to be
 * compatible with the `BabylonJS-Extended AST` described in the `refactory-architecture.md`
 * document, which will allow for a smooth transition to the new rendering engine.
 *
 * @example
 * ```typescript
 * import { ASTNode, SourceLocation, Position } from './ast.types';
 *
 * // Example of a simple AST node
 * const node: ASTNode = {
 *   type: 'cube',
 *   location: {
 *     start: { line: 0, column: 0, offset: 0 },
 *     end: { line: 0, column: 8, offset: 8 },
 *   },
 * };
 * ```
 *
 * @integration
 * These types are used throughout the OpenSCAD parser, from the visitors that generate the
 * AST to the services that consume it. They are the primary data structures that are passed
 * between the different components of the parser and the rendering engine.
 */

// Re-export TSNode for use throughout the parser
export type { Node as TSNode } from 'web-tree-sitter';

/**
 * @interface ASTNode
 * @description The base interface for all AST nodes.
 */
export interface ASTNode {
  readonly type: string;
  readonly location?: SourceLocation;
}

/**
 * @interface SourceLocation
 * @description Represents the location of a node in the source code.
 */
export interface SourceLocation {
  readonly start: Position;
  readonly end: Position;
}

/**
 * @interface Position
 * @description Represents a position in the source code.
 */
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
