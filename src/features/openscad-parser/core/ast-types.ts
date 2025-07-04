/**
 * @file AST Types Re-export Module
 *
 * This module re-exports all AST node types from the main ast-types module
 * to provide a consistent import path for other modules in the codebase.
 * This maintains backward compatibility with existing import statements
 * while centralizing the actual type definitions.
 *
 * @module core/ast-types
 * @since 0.1.0
 */

// Explicitly re-export the most commonly used types for better IDE support
export type {
  ASTNode,
  // Statements
  AssertStatementNode,
  AssignmentNode,
  AssignStatementNode,
  BaseNode,
  // Type aliases
  BinaryOperator,
  // Special nodes
  ChildrenNode,
  CircleNode,
  ColorNode,
  // Primitive shapes
  CubeNode,
  CylinderNode,
  DifferenceNode,
  EachNode,
  EchoStatementNode,
  ErrorNode,
  // Expressions
  ExpressionNode,
  ForLoopNode,
  FunctionCallNode,
  FunctionDefinitionNode,
  HullNode,
  IdentifierNode,
  // Control structures
  IfNode,
  IndexExpressionNode,
  IntersectionNode,
  LetExpressionNode,
  LetNode,
  // Extrusions
  LinearExtrudeNode,
  LiteralNode,
  MinkowskiNode,
  MirrorNode,
  // Module system
  ModuleDefinitionNode,
  ModuleInstantiationNode,
  ModuleParameter,
  MultmatrixNode,
  OffsetNode,
  Parameter,
  ParameterValue,
  PolygonNode,
  PolyhedronNode,
  Position,
  RangeExpressionNode,
  ResizeNode,
  RotateExtrudeNode,
  RotateNode,
  ScaleNode,
  SourceLocation,
  SpecialVariable,
  SpecialVariableAssignment,
  SphereNode,
  SquareNode,
  StatementNode,
  TextNode,
  // Transformations
  TranslateNode,
  UnaryOperator,
  // CSG operations
  UnionNode,
  VariableNode,
  Vector2D,
  Vector3D,
  VectorExpressionNode,
} from '../ast/ast-types.js';
// Re-export all types from the main AST types module
export * from '../ast/ast-types.js';
