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
  BaseNode,
  BinaryOperator,
  // Primitive shapes
  CubeNode,
  CylinderNode,
  // Expressions and variables
  ExpressionNode,
  MirrorNode,
  Parameter,
  ParameterValue,
  Position,
  RotateNode,
  ScaleNode,
  SourceLocation,
  SphereNode,
  StatementNode,
  // Transformations
  TranslateNode,
  UnaryOperator,
  VariableNode,
} from '../ast/ast-types.js';
// Re-export all types from the main AST types module
export * from '../ast/ast-types.js';
