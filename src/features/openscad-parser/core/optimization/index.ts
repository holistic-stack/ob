/**
 * @file AST Optimization Module Index
 *
 * Exports all optimization classes, types, and utilities for OpenSCAD AST optimization.
 * Provides a comprehensive optimization system with constant folding, dead code elimination,
 * and extensible optimization pass framework.
 *
 * Following TypeScript 5.8, DRY, and SRP principles.
 */

/**
 * Re-export commonly used types for convenience
 */
export type {
  ASTNode,
  BinaryExpressionNode,
  ConditionalExpressionNode,
  FunctionCallNode,
  LiteralNode,
  ModuleCallNode,
  SourceLocation,
  UnaryExpressionNode,
} from '../ast-types.js';

// Optimization passes
export { ConstantFoldingPass } from './constant-folding-pass.js';
export { DeadCodeEliminationPass } from './dead-code-elimination-pass.js';

// Optimization manager
export {
  type ComprehensiveOptimizationResult,
  OptimizationManager,
} from './optimization-manager.js';
// Core optimization framework
export {
  DEFAULT_OPTIMIZATION_CONFIG,
  type OptimizationConfig,
  type OptimizationError,
  type OptimizationInfo,
  OptimizationPass,
  type OptimizationResult,
  type OptimizationStatistics,
  type OptimizationType,
} from './optimization-pass.js';

// End of exports
