/**
 * Shared Types Index
 *
 * Central export point for all shared type definitions used across
 * the OpenSCAD 3D visualization application.
 */

export type {
  BaseErrorNode,
  BaseExpressionNode,
  BaseStatementNode,
  // AST types
  CoreNode,
  NodeId,
  NodeMetadata,
  NodeTransformer,
  NodeType,
  NodeVisitor,
  ParentNode,
} from './ast.types.js';
// AST node types and interfaces
export * from './ast.types.js';

// Common application types
export * from './common.types.js';
// Core functional programming types
export * from './functional.types.js';
export type {
  AsyncOperationResult,
  OperationError,
  OperationFactory,
  OperationId,
  OperationMetadata,
  OperationMetrics,
  OperationPriority,
  OperationRegistry,
  // Operation types
  OperationResult,
  OperationScheduler,
  OperationStatus,
  OperationType,
  TransactionId,
} from './operations.types.js';
// Operation and metadata types
export * from './operations.types.js';

// Re-export commonly used types for convenience
export type {
  // Common types
  AppConfig,
  AsyncResult,
  // Branded types
  Brand,
  ComponentId,
  // Utility types
  DeepReadonly,
  EditorState,
  Immutable,
  Mapper,
  NetworkResult,
  Option,
  ParseResult,
  PerformanceMetrics,
  Predicate,
  Reducer,
  // Result types
  Result,
  SceneState,
  ValidationResult,
} from './result.types.js';
// Result and error handling types
export * from './result.types.js';
// Type utilities and helpers
export * from './utils.js';
