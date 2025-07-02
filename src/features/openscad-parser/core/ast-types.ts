/**
 * @file AST Type Definitions
 *
 * TypeScript type definitions for OpenSCAD AST nodes.
 * Maintains exact API compatibility with @holistic-stack/openscad-parser types.
 * Following TypeScript 5.8, DRY, and SRP principles.
 */

/**
 * Source location information for AST nodes
 */
export interface SourceLocation {
  readonly start: {
    readonly line: number;
    readonly column: number;
    readonly offset: number;
  };
  readonly end: {
    readonly line: number;
    readonly column: number;
    readonly offset: number;
  };
}

/**
 * Base interface for all AST nodes
 */
export interface BaseASTNode {
  readonly type: string;
  readonly location?: SourceLocation;
}

/**
 * Cube primitive node
 */
export interface CubeNode extends BaseASTNode {
  readonly type: 'cube';
  readonly size: [number, number, number] | number;
  readonly center?: boolean;
}

/**
 * Sphere primitive node
 */
export interface SphereNode extends BaseASTNode {
  readonly type: 'sphere';
  readonly r?: number;
  readonly radius?: number; // Alias for r for compatibility
  readonly d?: number;
  readonly diameter?: number; // Alias for d for compatibility
  readonly fn?: number;
  readonly fa?: number;
  readonly fs?: number;
}

/**
 * Cylinder primitive node
 */
export interface CylinderNode extends BaseASTNode {
  readonly type: 'cylinder';
  readonly h: number;
  readonly r?: number;
  readonly r1?: number;
  readonly r2?: number;
  readonly d?: number;
  readonly d1?: number;
  readonly d2?: number;
  readonly center?: boolean;
  readonly fn?: number;
  readonly $fn?: number; // OpenSCAD special variable
  readonly fa?: number;
  readonly fs?: number;
}

/**
 * Polyhedron primitive node
 */
export interface PolyhedronNode extends BaseASTNode {
  readonly type: 'polyhedron';
  readonly points: Array<[number, number, number]>;
  readonly faces: Array<Array<number>>;
  readonly convexity?: number;
}

/**
 * Translate transformation node
 */
export interface TranslateNode extends BaseASTNode {
  readonly type: 'translate';
  readonly v: [number, number, number];
  readonly children: Array<ASTNode>;
}

/**
 * Rotate transformation node
 */
export interface RotateNode extends BaseASTNode {
  readonly type: 'rotate';
  readonly a: [number, number, number] | number;
  readonly v?: [number, number, number];
  readonly children: Array<ASTNode>;
}

/**
 * Scale transformation node
 */
export interface ScaleNode extends BaseASTNode {
  readonly type: 'scale';
  readonly v: [number, number, number] | number;
  readonly children: Array<ASTNode>;
}

/**
 * Mirror transformation node
 */
export interface MirrorNode extends BaseASTNode {
  readonly type: 'mirror';
  readonly v: [number, number, number];
  readonly children: Array<ASTNode>;
}

/**
 * Union CSG operation node
 */
export interface UnionNode extends BaseASTNode {
  readonly type: 'union';
  readonly children: Array<ASTNode>;
}

/**
 * Difference CSG operation node
 */
export interface DifferenceNode extends BaseASTNode {
  readonly type: 'difference';
  readonly children: Array<ASTNode>;
}

/**
 * Intersection CSG operation node
 */
export interface IntersectionNode extends BaseASTNode {
  readonly type: 'intersection';
  readonly children: Array<ASTNode>;
}

/**
 * Hull CSG operation node
 */
export interface HullNode extends BaseASTNode {
  readonly type: 'hull';
  readonly children: Array<ASTNode>;
}

/**
 * Minkowski CSG operation node
 */
export interface MinkowskiNode extends BaseASTNode {
  readonly type: 'minkowski';
  readonly children: Array<ASTNode>;
}

/**
 * Literal value node
 */
export interface LiteralNode extends BaseASTNode {
  readonly type: 'literal';
  readonly value: string | number | boolean;
}

/**
 * Variable reference node
 */
export interface VariableNode extends BaseASTNode {
  readonly type: 'variable';
  readonly name: string;
}

/**
 * Vector expression node
 */
export interface VectorExpressionNode extends BaseASTNode {
  readonly type: 'vector';
  readonly elements: Array<ASTNode>;
}

/**
 * Binary expression node
 */
export interface BinaryExpressionNode extends BaseASTNode {
  readonly type: 'binary_expression';
  readonly operator: string;
  readonly left: ASTNode;
  readonly right: ASTNode;
}

/**
 * Range expression node
 */
export interface RangeExpressionNode extends BaseASTNode {
  readonly type: 'range';
  readonly start: ASTNode;
  readonly step?: ASTNode;
  readonly end: ASTNode;
}

/**
 * Unary expression node (e.g., -x, !condition)
 */
export interface UnaryExpressionNode extends BaseASTNode {
  readonly type: 'unary_expression';
  readonly operator: string;
  readonly operand: ASTNode;
}

/**
 * Conditional expression node (e.g., condition ? true_expr : false_expr)
 */
export interface ConditionalExpressionNode extends BaseASTNode {
  readonly type: 'conditional_expression';
  readonly condition: ASTNode;
  readonly trueExpression: ASTNode;
  readonly falseExpression: ASTNode;
}

/**
 * Function call node (e.g., sin(x))
 */
export interface FunctionCallNode extends BaseASTNode {
  readonly type: 'function_call';
  readonly name: string;
  readonly arguments: ASTNode[];
}

/**
 * Module call node (e.g., cube(10))
 */
export interface ModuleCallNode extends BaseASTNode {
  readonly type: 'module_call';
  readonly name: string;
  readonly arguments: ASTNode[];
}

/**
 * Module definition node
 */
export interface ModuleDefinitionNode extends BaseASTNode {
  readonly type: 'module_definition';
  readonly name: string;
  readonly parameters: Array<string>;
  readonly body: Array<ASTNode>;
}

/**
 * Function definition node
 */
export interface FunctionDefinitionNode extends BaseASTNode {
  readonly type: 'function_definition';
  readonly name: string;
  readonly parameters: Array<string>;
  readonly body: ASTNode;
}

/**
 * Assignment statement node
 */
export interface AssignmentNode extends BaseASTNode {
  readonly type: 'assignment';
  readonly name: string;
  readonly value: ASTNode;
}

/**
 * Error node for invalid/unknown constructs
 */
export interface ErrorNode extends BaseASTNode {
  readonly type: 'error';
  readonly message?: string;
  readonly errorCode?: string;
}

/**
 * Rotate extrude node
 */
export interface RotateExtrudeNode extends BaseASTNode {
  readonly type: 'rotate_extrude';
  readonly angle?: number;
  readonly children: Array<ASTNode>;
}

/**
 * Union type for all AST nodes
 */
export type ASTNode =
  | CubeNode
  | SphereNode
  | CylinderNode
  | PolyhedronNode
  | TranslateNode
  | RotateNode
  | ScaleNode
  | MirrorNode
  | UnionNode
  | DifferenceNode
  | IntersectionNode
  | HullNode
  | MinkowskiNode
  | LiteralNode
  | VariableNode
  | VectorExpressionNode
  | BinaryExpressionNode
  | UnaryExpressionNode
  | ConditionalExpressionNode
  | FunctionCallNode
  | ModuleCallNode
  | RangeExpressionNode
  | ModuleDefinitionNode
  | FunctionDefinitionNode
  | AssignmentNode
  | ErrorNode
  | RotateExtrudeNode;

/**
 * Type guards for AST node identification
 */
export const isCubeNode = (node: ASTNode): node is CubeNode => node.type === 'cube';
export const isSphereNode = (node: ASTNode): node is SphereNode => node.type === 'sphere';
export const isCylinderNode = (node: ASTNode): node is CylinderNode => node.type === 'cylinder';
export const isUnionNode = (node: ASTNode): node is UnionNode => node.type === 'union';
export const isDifferenceNode = (node: ASTNode): node is DifferenceNode =>
  node.type === 'difference';
export const isIntersectionNode = (node: ASTNode): node is IntersectionNode =>
  node.type === 'intersection';
export const isTranslateNode = (node: ASTNode): node is TranslateNode => node.type === 'translate';
export const isRotateNode = (node: ASTNode): node is RotateNode => node.type === 'rotate';
export const isScaleNode = (node: ASTNode): node is ScaleNode => node.type === 'scale';

/**
 * Type guard for primitive nodes
 */
export const isPrimitiveNode = (
  node: ASTNode
): node is CubeNode | SphereNode | CylinderNode | PolyhedronNode =>
  ['cube', 'sphere', 'cylinder', 'polyhedron'].includes(node.type);

/**
 * Type guard for transform nodes
 */
export const isTransformNode = (
  node: ASTNode
): node is TranslateNode | RotateNode | ScaleNode | MirrorNode =>
  ['translate', 'rotate', 'scale', 'mirror'].includes(node.type);

/**
 * Type guard for CSG operation nodes
 */
export const isCSGNode = (
  node: ASTNode
): node is UnionNode | DifferenceNode | IntersectionNode | HullNode | MinkowskiNode =>
  ['union', 'difference', 'intersection', 'hull', 'minkowski'].includes(node.type);
