/**
 * @file AST Optimization Manager
 *
 * Coordinates multiple optimization passes and manages the optimization
 * pipeline for OpenSCAD ASTs with performance tracking and error handling.
 *
 * Following TypeScript 5.8, DRY, and SRP principles.
 */

import { createLogger } from '../../../../shared/services/logger.service.js';
import type { Result } from '../../../../shared/utils/functional/result.js';
import { error, success } from '../../../../shared/utils/functional/result.js';
import type { ASTNode } from '../ast-types.js';
import type { ScopeManager } from '../symbols/scope-manager.js';
import { ConstantFoldingPass } from './constant-folding-pass.js';
import { DeadCodeEliminationPass } from './dead-code-elimination-pass.js';
import {
  DEFAULT_OPTIMIZATION_CONFIG,
  type OptimizationConfig,
  type OptimizationError,
  type OptimizationPass,
  type OptimizationResult,
  type OptimizationStatistics,
} from './optimization-pass.js';

const _logger = createLogger('OptimizationManager');

/**
 * Comprehensive optimization result from the manager
 */
export interface ComprehensiveOptimizationResult {
  readonly optimizedAST: ASTNode[];
  readonly passResults: OptimizationResult[];
  readonly totalOptimizations: number;
  readonly totalErrors: number;
  readonly statisticsBefore: OptimizationStatistics;
  readonly statisticsAfter: OptimizationStatistics;
  readonly performanceGain: number; // Percentage
  readonly executionTime: number; // Milliseconds
}

/**
 * AST Optimization Manager
 * Coordinates multiple optimization passes and manages the optimization pipeline
 */
export class OptimizationManager {
  private readonly logger = createLogger('OptimizationManager');
  private readonly config: OptimizationConfig;
  private readonly scopeManager?: ScopeManager;
  private readonly passes: OptimizationPass[] = [];

  constructor(
    config: OptimizationConfig = DEFAULT_OPTIMIZATION_CONFIG,
    scopeManager?: ScopeManager
  ) {
    this.config = config;
    if (scopeManager) {
      Object.defineProperty(this, 'scopeManager', { value: scopeManager, writable: false });
    }
    this.initializePasses();
    this.logger.debug('OptimizationManager initialized with configuration');
  }

  /**
   * Initialize optimization passes based on configuration
   */
  private initializePasses(): void {
    // Add passes in order of execution
    // Order matters for optimization effectiveness

    // 1. Constant folding - reduces expression complexity early
    if (this.config.enableConstantFolding) {
      this.passes.push(new ConstantFoldingPass(this.config, this.scopeManager));
    }

    // 2. Dead code elimination - removes unused code after constant folding
    if (this.config.enableDeadCodeElimination) {
      this.passes.push(new DeadCodeEliminationPass(this.config, this.scopeManager));
    }

    // Future passes would be added here:
    // - Expression simplification
    // - Redundant operation removal
    // - Transformation optimization
    // - CSG optimization

    this.logger.debug(`Initialized ${this.passes.length} optimization passes`);
  }

  /**
   * Optimize an AST using all configured optimization passes
   * @param ast - AST nodes to optimize
   * @returns Comprehensive optimization result
   */
  optimize(ast: ASTNode[]): Result<ComprehensiveOptimizationResult, OptimizationError> {
    this.logger.debug(`Starting optimization pipeline on ${ast.length} AST nodes`);
    const startTime = performance.now();

    try {
      // Calculate initial statistics
      const statisticsBefore = this.calculateStatistics(ast);

      let currentAST = [...ast]; // Start with a copy
      const passResults: OptimizationResult[] = [];
      let totalOptimizations = 0;
      let totalErrors = 0;

      // Apply optimization passes iteratively
      for (let iteration = 0; iteration < this.config.maxOptimizationPasses; iteration++) {
        this.logger.debug(`Starting optimization iteration ${iteration + 1}`);

        let anyOptimizationsApplied = false;
        const iterationStartAST = [...currentAST];

        // Apply each pass in sequence
        for (const pass of this.passes) {
          if (!pass.shouldApply()) {
            this.logger.debug(`Skipping pass: ${pass.getName()}`);
            continue;
          }

          this.logger.debug(`Applying pass: ${pass.getName()}`);
          const passResult = pass.optimize(currentAST);

          if (!passResult.success) {
            this.logger.error(`Pass ${pass.getName()} failed: ${passResult.error.message}`);
            return error(passResult.error);
          }

          const result = passResult.data;
          passResults.push(result);
          totalOptimizations += result.optimizationsApplied.length;
          totalErrors += result.errors.length;

          // Check if this pass made any optimizations
          if (result.optimizationsApplied.length > 0) {
            anyOptimizationsApplied = true;
            currentAST = result.optimizedAST;
            this.logger.debug(
              `Pass ${pass.getName()} applied ${result.optimizationsApplied.length} optimizations`
            );
          }

          // Check performance threshold
          const performanceGain = this.calculatePerformanceGain(
            result.statisticsBefore,
            result.statisticsAfter
          );
          if (performanceGain < this.config.performanceThreshold) {
            this.logger.debug(
              `Pass ${pass.getName()} performance gain (${performanceGain.toFixed(2)}%) below threshold`
            );
          }
        }

        // If no optimizations were applied in this iteration, we're done
        if (!anyOptimizationsApplied) {
          this.logger.debug(`No optimizations applied in iteration ${iteration + 1}, stopping`);
          break;
        }

        // Check if AST has converged (no changes)
        if (this.areASTsEquivalent(iterationStartAST, currentAST)) {
          this.logger.debug(`AST converged after iteration ${iteration + 1}, stopping`);
          break;
        }
      }

      // Calculate final statistics
      const statisticsAfter = this.calculateStatistics(currentAST);
      const performanceGain = this.calculatePerformanceGain(statisticsBefore, statisticsAfter);
      const executionTime = performance.now() - startTime;

      const result: ComprehensiveOptimizationResult = {
        optimizedAST: currentAST,
        passResults,
        totalOptimizations,
        totalErrors,
        statisticsBefore,
        statisticsAfter,
        performanceGain,
        executionTime,
      };

      this.logger.debug(
        `Optimization pipeline completed: ${totalOptimizations} optimizations, ${performanceGain.toFixed(2)}% performance gain, ${executionTime.toFixed(2)}ms execution time`
      );

      return success(result);
    } catch (err) {
      const optimizationError: OptimizationError = {
        message: `Optimization pipeline failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
        code: 'OPTIMIZATION_PIPELINE_FAILURE',
        severity: 'error',
      };

      this.logger.error(`Optimization pipeline failed: ${optimizationError.message}`);
      return error(optimizationError);
    }
  }

  /**
   * Get information about available optimization passes
   * @returns Array of pass information
   */
  getAvailablePasses(): Array<{ name: string; types: string[]; enabled: boolean }> {
    return this.passes.map((pass) => ({
      name: pass.getName(),
      types: pass.getOptimizationTypes(),
      enabled: pass.shouldApply(),
    }));
  }

  /**
   * Calculate statistics for an AST
   * @param ast - AST nodes to analyze
   * @returns Statistics
   */
  private calculateStatistics(ast: ASTNode[]): OptimizationStatistics {
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
   * Calculate performance gain between two statistics
   * @param before - Statistics before optimization
   * @param after - Statistics after optimization
   * @returns Performance gain percentage
   */
  private calculatePerformanceGain(
    before: OptimizationStatistics,
    after: OptimizationStatistics
  ): number {
    if (before.estimatedComplexity === 0) return 0;

    const reduction = before.estimatedComplexity - after.estimatedComplexity;
    return (reduction / before.estimatedComplexity) * 100;
  }

  /**
   * Check if two ASTs are equivalent
   * @param a - First AST
   * @param b - Second AST
   * @returns True if ASTs are equivalent
   */
  private areASTsEquivalent(a: ASTNode[], b: ASTNode[]): boolean {
    if (a.length !== b.length) return false;

    try {
      return JSON.stringify(a) === JSON.stringify(b);
    } catch {
      return false;
    }
  }
}
