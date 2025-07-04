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

// Re-export all types from the main AST types module
export * from '../ast/ast-types.js';

// Explicitly re-export the most commonly used types for better IDE support
export type {
  ASTNode,
  StatementNode,
  BaseNode,
  SourceLocation,
  Position,
  Vector3D,
  Vector2D,
  
  // Primitive shapes
  CubeNode,
  SphereNode,
  CylinderNode,
  PolyhedronNode,
  PolygonNode,
  CircleNode,
  SquareNode,
  TextNode,
  
  // Transformations
  TranslateNode,
  RotateNode,
  ScaleNode,
  MirrorNode,
  MultmatrixNode,
  ColorNode,
  
  // CSG operations
  UnionNode,
  DifferenceNode,
  IntersectionNode,
  HullNode,
  MinkowskiNode,
  
  // Extrusions
  LinearExtrudeNode,
  RotateExtrudeNode,
  OffsetNode,
  ResizeNode,
  
  // Control structures
  IfNode,
  ForLoopNode,
  LetNode,
  EachNode,
  
  // Expressions
  ExpressionNode,
  LiteralNode,
  VariableNode,
  FunctionCallNode,
  VectorExpressionNode,
  IndexExpressionNode,
  RangeExpressionNode,
  LetExpressionNode,
  
  // Module system
  ModuleDefinitionNode,
  ModuleInstantiationNode,
  FunctionDefinitionNode,
  
  // Statements
  AssertStatementNode,
  EchoStatementNode,
  AssignStatementNode,
  AssignmentNode,
  
  // Special nodes
  ChildrenNode,
  IdentifierNode,
  ErrorNode,
  SpecialVariableAssignment,
  
  // Type aliases
  BinaryOperator,
  UnaryOperator,
  ParameterValue,
  Parameter,
  ModuleParameter,
  SpecialVariable,
} from '../ast/ast-types.js';
