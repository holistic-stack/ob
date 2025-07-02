/**
 * @file AST Optimization Pass Framework
 *
 * Base framework for implementing AST optimization passes including
 * constant folding, dead code elimination, and expression simplification.
 *
 * Following TypeScript 5.8, DRY, and SRP principles.
 */

import { createLogger } from '../../../../shared/services/logger.service.js';
import type { Result } from '../../../../shared/utils/functional/result.js';
import type { ASTNode, SourceLocation } from '../ast-types.js';
import type { ScopeManager } from '../symbols/scope-manager.js';

const _logger = createLogger('OptimizationPass');

/**
 * Optimization pass result
 */
export interface OptimizationResult {
  readonly optimizedAST: ASTNode[];
  readonly optimizationsApplied: OptimizationInfo[];
  readonly statisticsBefore: OptimizationStatistics;
  readonly statisticsAfter: OptimizationStatistics;
  readonly errors: OptimizationError[];
}

/**
 * Information about a specific optimization applied
 */
export interface OptimizationInfo {
  readonly type: OptimizationType;
  readonly description: string;
  readonly location: SourceLocation;
  readonly nodesBefore: number;
  readonly nodesAfter: number;
  readonly estimatedPerformanceGain: number; // Percentage
}

/**
 * Types of optimizations that can be applied
 */
export type OptimizationType =
  | 'constant_folding'
  | 'dead_code_elimination'
  | 'expression_simplification'
  | 'redundant_operation_removal'
  | 'transformation_optimization'
  | 'csg_optimization'
  | 'loop_unrolling'
  | 'inline_expansion';

/**
 * Statistics about the AST before and after optimization
 */
export interface OptimizationStatistics {
  readonly totalNodes: number;
  readonly expressionNodes: number;
  readonly transformationNodes: number;
  readonly csgNodes: number;
  readonly functionCalls: number;
  readonly variables: number;
  readonly constants: number;
  readonly estimatedComplexity: number;
}

/**
 * Optimization error
 */
export interface OptimizationError {
  readonly message: string;
  readonly code: string;
  readonly location?: SourceLocation;
  readonly severity: 'error' | 'warning';
}

/**
 * Configuration for optimization passes
 */
export interface OptimizationConfig {
  readonly enableConstantFolding: boolean;
  readonly enableDeadCodeElimination: boolean;
  readonly enableExpressionSimplification: boolean;
  readonly enableRedundantOperationRemoval: boolean;
  readonly enableTransformationOptimization: boolean;
  readonly enableCSGOptimization: boolean;
  readonly maxOptimizationPasses: number;
  readonly performanceThreshold: number; // Minimum performance gain to apply optimization
  readonly preserveComments: boolean;
  readonly preserveSourceLocations: boolean;
}

/**
 * Default optimization configuration
 */
export const DEFAULT_OPTIMIZATION_CONFIG: OptimizationConfig = {
  enableConstantFolding: true,
  enableDeadCodeElimination: true,
  enableExpressionSimplification: true,
  enableRedundantOperationRemoval: true,
  enableTransformationOptimization: true,
  enableCSGOptimization: true,
  maxOptimizationPasses: 5,
  performanceThreshold: 1.0, // 1% minimum gain
  preserveComments: true,
  preserveSourceLocations: true,
};

/**
 * Abstract base class for optimization passes
 */
export abstract class OptimizationPass {
  protected readonly logger = createLogger(`OptimizationPass:${this.constructor.name}`);
  protected readonly config: OptimizationConfig;
  protected readonly scopeManager?: ScopeManager;

  constructor(
    config: OptimizationConfig = DEFAULT_OPTIMIZATION_CONFIG,
    scopeManager?: ScopeManager
  ) {
    this.config = config;
    if (scopeManager) {
      Object.defineProperty(this, 'scopeManager', { value: scopeManager, writable: false });
    }
    this.logger.debug(`${this.constructor.name} initialized`);
  }

  /**
   * Apply the optimization pass to an AST
   * @param ast - AST nodes to optimize
   * @returns Optimization result
   */
  abstract optimize(ast: ASTNode[]): Result<OptimizationResult, OptimizationError>;

  /**
   * Get the name of this optimization pass
   */
  abstract getName(): string;

  /**
   * Get the types of optimizations this pass can apply
   */
  abstract getOptimizationTypes(): OptimizationType[];

  /**
   * Check if this pass should be applied based on configuration
   */
  abstract shouldApply(): boolean;

  /**
   * Calculate statistics for an AST
   * @param ast - AST nodes to analyze
   * @returns Statistics
   */
  protected calculateStatistics(ast: ASTNode[]): OptimizationStatistics {
    let totalNodes = 0;
    let expressionNodes = 0;
    let transformationNodes = 0;
    let csgNodes = 0;
    let functionCalls = 0;
    let variables = 0;
    let constants = 0;

    const countNodes = (node: ASTNode): void => {
      totalNodes++;

      switch (node.type) {
        case 'binary_expression':
        case 'unary_expression':
        case 'conditional_expression':
          expressionNodes++;
          break;
        case 'translate':
        case 'rotate':
        case 'scale':
        case 'mirror':
          transformationNodes++;
          break;
        case 'union':
        case 'difference':
        case 'intersection':
        case 'hull':
        case 'minkowski':
          csgNodes++;
          break;
        case 'function_call':
          functionCalls++;
          break;
        case 'variable':
          variables++;
          break;
        case 'literal':
          constants++;
          break;
      }

      // Recursively count children
      if ('children' in node && Array.isArray(node.children)) {
        for (const child of node.children) {
          countNodes(child);
        }
      }
      if ('body' in node && Array.isArray(node.body)) {
        for (const bodyNode of node.body) {
          countNodes(bodyNode);
        }
      }
      if ('body' in node && typeof node.body === 'object' && node.body !== null) {
        countNodes(node.body as ASTNode);
      }
    };

    for (const node of ast) {
      countNodes(node);
    }

    // Estimate complexity based on node types and relationships
    const estimatedComplexity =
      totalNodes * 1.0 +
      expressionNodes * 1.5 +
      transformationNodes * 2.0 +
      csgNodes * 3.0 +
      functionCalls * 2.5;

    return {
      totalNodes,
      expressionNodes,
      transformationNodes,
      csgNodes,
      functionCalls,
      variables,
      constants,
      estimatedComplexity,
    };
  }

  /**
   * Create a deep copy of an AST node
   * @param node - Node to copy
   * @returns Deep copy of the node
   */
  protected cloneNode(node: ASTNode): ASTNode {
    // Simple deep clone - in production, might want a more sophisticated approach
    return JSON.parse(JSON.stringify(node)) as ASTNode;
  }

  /**
   * Create a deep copy of an AST
   * @param ast - AST to copy
   * @returns Deep copy of the AST
   */
  protected cloneAST(ast: ASTNode[]): ASTNode[] {
    return ast.map((node) => this.cloneNode(node));
  }

  /**
   * Check if two nodes are equivalent
   * @param a - First node
   * @param b - Second node
   * @returns True if nodes are equivalent
   */
  protected areNodesEquivalent(a: ASTNode, b: ASTNode): boolean {
    // Simple structural comparison - could be enhanced for semantic equivalence
    try {
      return JSON.stringify(a) === JSON.stringify(b);
    } catch {
      return false;
    }
  }

  /**
   * Create an optimization info record
   * @param type - Type of optimization
   * @param description - Description of what was optimized
   * @param location - Source location
   * @param nodesBefore - Number of nodes before optimization
   * @param nodesAfter - Number of nodes after optimization
   * @param estimatedGain - Estimated performance gain percentage
   * @returns Optimization info
   */
  protected createOptimizationInfo(
    type: OptimizationType,
    description: string,
    location: SourceLocation,
    nodesBefore: number,
    nodesAfter: number,
    estimatedGain: number
  ): OptimizationInfo {
    return {
      type,
      description,
      location,
      nodesBefore,
      nodesAfter,
      estimatedPerformanceGain: estimatedGain,
    };
  }

  /**
   * Create an optimization error
   * @param message - Error message
   * @param code - Error code
   * @param location - Source location
   * @param severity - Error severity
   * @returns Optimization error
   */
  protected createOptimizationError(
    message: string,
    code: string,
    location?: SourceLocation,
    severity: 'error' | 'warning' = 'error'
  ): OptimizationError {
    return {
      message,
      code,
      ...(location && { location }),
      severity,
    };
  }
}
