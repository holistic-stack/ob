/**
 * Shared Types Index
 *
 * Central export point for all shared type definitions used across
 * the OpenSCAD 3D visualization application.
 */

// Core functional programming types
export * from './functional.types.js';

// Result and error handling types
export * from './result.types.js';

// Common application types
export * from './common.types.js';

// AST node types and interfaces
export * from './ast.types.js';

// Operation and metadata types
export * from './operations.types.js';

// Type utilities and helpers
export * from './utils.js';

// Re-export commonly used types for convenience
export type {
  // Result types
  Result,
  AsyncResult,
  Option,
  ValidationResult,
  ParseResult,
  NetworkResult,
  
  // Common types
  AppConfig,
  EditorState,
  SceneState,
  PerformanceMetrics,
  
  // Branded types
  Brand,
  ComponentId,
  
  // Utility types
  DeepReadonly,
  Immutable,
  Predicate,
  Mapper,
  Reducer,
} from './result.types.js';

export type {
  // AST types
  CoreNode,
  ParentNode,
  BaseExpressionNode,
  BaseStatementNode,
  BaseErrorNode,
  NodeMetadata,
  NodeVisitor,
  NodeTransformer,
  NodeId,
  NodeType,
} from './ast.types.js';

export type {
  // Operation types
  OperationResult,
  AsyncOperationResult,
  OperationMetadata,
  OperationMetrics,
  OperationError,
  OperationId,
  OperationType,
  TransactionId,
  OperationStatus,
  OperationPriority,
  OperationScheduler,
  OperationRegistry,
  OperationFactory,
} from './operations.types.js';
