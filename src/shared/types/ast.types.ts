/**
 * Shared AST Node Types
 *
 * Common interfaces and types for AST node handling across all features.
 * These types ensure consistent structure and eliminate duplication between
 * parser, renderer, and other AST-consuming modules.
 */

import type { Brand } from './result.types.js';

/**
 * Branded types for AST node identification
 */
export type NodeId = Brand<string, 'NodeId'>;
export type NodeType = Brand<string, 'NodeType'>;

/**
 * Base position interface for source code locations
 */
export interface BasePosition {
  readonly line: number;
  readonly column: number;
  readonly offset: number;
}

/**
 * Source location range interface
 */
export interface BaseSourceLocation {
  readonly start: BasePosition;
  readonly end: BasePosition;
  readonly text?: string | undefined;
}

/**
 * Core node interface that all AST nodes must implement
 */
export interface CoreNode {
  readonly type: string;
  readonly location?: BaseSourceLocation;
  readonly id?: NodeId;
}

/**
 * Node with children interface for container nodes
 */
export interface ParentNode extends CoreNode {
  readonly children: ReadonlyArray<CoreNode>;
}

/**
 * Expression node base interface
 */
export interface BaseExpressionNode extends CoreNode {
  readonly expressionType: string;
  readonly value?: unknown;
}

/**
 * Statement node base interface
 */
export interface BaseStatementNode extends CoreNode {
  readonly statementType?: string;
}

/**
 * Error node interface for parsing failures
 */
export interface BaseErrorNode extends CoreNode {
  readonly type: 'error';
  readonly errorCode: string;
  readonly message: string;
  readonly originalNodeType?: string;
  readonly cstNodeText?: string;
  readonly cause?: BaseErrorNode;
}

/**
 * Node metadata interface for tracking and optimization
 */
export interface NodeMetadata {
  readonly nodeId: NodeId;
  readonly nodeType: NodeType;
  readonly depth: number;
  readonly parentId?: NodeId;
  readonly childrenIds: ReadonlyArray<NodeId>;
  readonly size: number; // number of descendant nodes
  readonly complexity: number; // computational complexity score
  readonly isOptimized: boolean;
  readonly lastAccessed: Date;
}

/**
 * Node visitor interface for traversal operations
 */
export interface NodeVisitor<TNode extends CoreNode, TResult> {
  readonly visit: (node: TNode, context?: unknown) => TResult;
  readonly canVisit: (node: CoreNode) => node is TNode;
}

/**
 * Node transformer interface for AST modifications
 */
export interface NodeTransformer<TInput extends CoreNode, TOutput extends CoreNode> {
  readonly transform: (node: TInput, context?: unknown) => TOutput;
  readonly canTransform: (node: CoreNode) => node is TInput;
}

/**
 * Node validator interface for AST validation
 */
export interface NodeValidator<TNode extends CoreNode> {
  readonly validate: (node: TNode) => ReadonlyArray<string>; // returns validation errors
  readonly canValidate: (node: CoreNode) => node is TNode;
}

/**
 * AST traversal context interface
 */
export interface TraversalContext {
  readonly depth: number;
  readonly path: ReadonlyArray<NodeId>;
  readonly parentNode?: CoreNode;
  readonly siblingIndex: number;
  readonly metadata: Record<string, unknown>;
}

/**
 * AST query interface for node searching
 */
export interface ASTQuery<TNode extends CoreNode> {
  readonly predicate: (node: CoreNode, context: TraversalContext) => node is TNode;
  readonly options?: {
    readonly maxDepth?: number;
    readonly maxResults?: number;
    readonly includeChildren?: boolean;
  };
}

/**
 * Node collection interface for managing sets of nodes
 */
export interface NodeCollection<TNode extends CoreNode> {
  readonly nodes: ReadonlyArray<TNode>;
  readonly metadata: ReadonlyArray<NodeMetadata>;
  readonly size: number;
  readonly isEmpty: boolean;
}

/**
 * AST diff operation types
 */
export type DiffOperationType = 'insert' | 'delete' | 'update' | 'move';

/**
 * AST diff operation interface
 */
export interface DiffOperation {
  readonly type: DiffOperationType;
  readonly path: ReadonlyArray<NodeId>;
  readonly oldNode?: CoreNode;
  readonly newNode?: CoreNode;
  readonly position?: number;
}

/**
 * AST diff result interface
 */
export interface ASTDiff {
  readonly operations: ReadonlyArray<DiffOperation>;
  readonly hasChanges: boolean;
  readonly summary: {
    readonly insertions: number;
    readonly deletions: number;
    readonly updates: number;
    readonly moves: number;
  };
}

/**
 * Node serialization interface
 */
export interface NodeSerializer<TNode extends CoreNode, TFormat> {
  readonly serialize: (node: TNode) => TFormat;
  readonly deserialize: (data: TFormat) => TNode;
  readonly canSerialize: (node: CoreNode) => node is TNode;
}

/**
 * AST optimization interface
 */
export interface ASTOptimizer<TNode extends CoreNode> {
  readonly optimize: (node: TNode, context?: unknown) => TNode;
  readonly canOptimize: (node: CoreNode) => node is TNode;
  readonly estimateGain: (node: TNode) => number; // performance improvement score
}

/**
 * Node factory interface for creating nodes
 */
export interface NodeFactory<TNode extends CoreNode> {
  readonly create: (data: Partial<TNode>) => TNode;
  readonly createWithLocation: (data: Partial<TNode>, location: BaseSourceLocation) => TNode;
  readonly clone: (node: TNode) => TNode;
}

/**
 * Type guard utilities for node type checking
 */
export interface NodeTypeGuards {
  readonly isExpression: (node: CoreNode) => node is BaseExpressionNode;
  readonly isStatement: (node: CoreNode) => node is BaseStatementNode;
  readonly isParent: (node: CoreNode) => node is ParentNode;
  readonly isError: (node: CoreNode) => node is BaseErrorNode;
  readonly hasLocation: (node: CoreNode) => boolean;
  readonly hasChildren: (node: CoreNode) => boolean;
}

/**
 * Node utility functions interface
 */
export interface NodeUtils {
  readonly getId: (node: CoreNode) => NodeId;
  readonly getType: (node: CoreNode) => NodeType;
  readonly getDepth: (node: CoreNode, root: CoreNode) => number;
  readonly getPath: (node: CoreNode, root: CoreNode) => ReadonlyArray<NodeId>;
  readonly findParent: (node: CoreNode, root: CoreNode) => CoreNode | null;
  readonly findChildren: (node: CoreNode) => ReadonlyArray<CoreNode>;
  readonly findAncestors: (node: CoreNode, root: CoreNode) => ReadonlyArray<CoreNode>;
  readonly findDescendants: (node: CoreNode) => ReadonlyArray<CoreNode>;
}

/**
 * Generic AST Node type alias for backward compatibility
 * This represents any AST node in the system
 */
export type ASTNode =
  | CoreNode
  | BaseExpressionNode
  | BaseStatementNode
  | ParentNode
  | BaseErrorNode;

/**
 * Type utility to extract the node type from an AST node
 */
export type ExtractNodeType<T extends ASTNode> = T['type'];

/**
 * Type utility to check if a node has children
 */
export type HasChildren<T extends ASTNode> = T extends ParentNode ? true : false;

/**
 * Type utility to get the children type from a parent node
 */
export type ChildrenType<T extends ParentNode> = T['children'][number];
