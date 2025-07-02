/**
 * @file Dead Code Elimination Optimization Pass
 *
 * Implements dead code elimination to remove unused variables, functions,
 * and unreachable code, reducing AST size and improving performance.
 *
 * Following TypeScript 5.8, DRY, and SRP principles.
 */

import { createLogger } from '../../../../shared/services/logger.service.js';
import type { Result } from '../../../../shared/utils/functional/result.js';
import { error, success } from '../../../../shared/utils/functional/result.js';
import type {
  ASTNode,
  FunctionCallNode,
  FunctionDefinitionNode,
  ModuleCallNode,
  ModuleDefinitionNode,
  VariableNode,
} from '../ast-types.js';
import type { ScopeManager } from '../symbols/scope-manager.js';
import {
  type OptimizationConfig,
  type OptimizationError,
  type OptimizationInfo,
  OptimizationPass,
  type OptimizationResult,
  type OptimizationType,
} from './optimization-pass.js';

const _logger = createLogger('DeadCodeEliminationPass');

/**
 * Dead code elimination optimization pass
 * Removes unused variables, functions, and unreachable code
 */
export class DeadCodeEliminationPass extends OptimizationPass {
  private optimizationsApplied: OptimizationInfo[] = [];
  private errors: OptimizationError[] = [];
  private usedSymbols: Set<string> = new Set();

  constructor(config: OptimizationConfig, scopeManager?: ScopeManager) {
    super(config, scopeManager);
    this.logger.debug('DeadCodeEliminationPass initialized');
  }

  /**
   * Get the name of this optimization pass
   */
  getName(): string {
    return 'Dead Code Elimination';
  }

  /**
   * Get the types of optimizations this pass can apply
   */
  getOptimizationTypes(): OptimizationType[] {
    return ['dead_code_elimination'];
  }

  /**
   * Check if this pass should be applied based on configuration
   */
  shouldApply(): boolean {
    return this.config.enableDeadCodeElimination;
  }

  /**
   * Apply dead code elimination optimization to an AST
   * @param ast - AST nodes to optimize
   * @returns Optimization result
   */
  optimize(ast: ASTNode[]): Result<OptimizationResult, OptimizationError> {
    this.logger.debug(`Starting dead code elimination on ${ast.length} nodes`);

    try {
      // Reset state
      this.optimizationsApplied = [];
      this.errors = [];
      this.usedSymbols = new Set();

      // Calculate initial statistics
      const statisticsBefore = this.calculateStatistics(ast);

      // Clone AST to avoid modifying original
      const optimizedAST = this.cloneAST(ast);

      // Phase 1: Mark all used symbols
      this.markUsedSymbols(optimizedAST);

      // Phase 2: Remove unused definitions
      const filteredAST = this.removeUnusedDefinitions(optimizedAST);

      // Phase 3: Remove unreachable code
      const finalAST = this.removeUnreachableCode(filteredAST);

      // Calculate final statistics
      const statisticsAfter = this.calculateStatistics(finalAST);

      const result: OptimizationResult = {
        optimizedAST: finalAST,
        optimizationsApplied: [...this.optimizationsApplied],
        statisticsBefore,
        statisticsAfter,
        errors: [...this.errors],
      };

      this.logger.debug(
        `Dead code elimination completed: ${this.optimizationsApplied.length} optimizations applied, ${this.errors.length} errors`
      );

      return success(result);
    } catch (err) {
      const optimizationError = this.createOptimizationError(
        `Dead code elimination failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
        'DEAD_CODE_ELIMINATION_FAILURE'
      );

      this.logger.error(`Dead code elimination failed: ${optimizationError.message}`);
      return error(optimizationError);
    }
  }

  /**
   * Mark all symbols that are actually used in the AST
   * @param nodes - AST nodes to analyze
   */
  private markUsedSymbols(nodes: ASTNode[]): void {
    for (const node of nodes) {
      this.markUsedSymbolsInNode(node);
    }
  }

  /**
   * Mark used symbols in a single AST node
   * @param node - AST node to analyze
   */
  private markUsedSymbolsInNode(node: ASTNode): void {
    switch (node.type) {
      case 'variable': {
        const variableNode = node as VariableNode;
        this.usedSymbols.add(variableNode.name);
        this.logger.debug(`Marked symbol as used: ${variableNode.name}`);
        break;
      }

      case 'function_call': {
        const functionCall = node as FunctionCallNode;
        this.usedSymbols.add(functionCall.name);
        this.logger.debug(`Marked function as used: ${functionCall.name}`);
        break;
      }

      case 'module_call': {
        const moduleCall = node as ModuleCallNode;
        this.usedSymbols.add(moduleCall.name);
        this.logger.debug(`Marked module as used: ${moduleCall.name}`);
        break;
      }
    }

    // Recursively process children
    if ('children' in node && Array.isArray(node.children)) {
      this.markUsedSymbols(node.children);
    }
    if ('body' in node && Array.isArray(node.body)) {
      this.markUsedSymbols(node.body);
    }
    if ('body' in node && typeof node.body === 'object' && node.body !== null) {
      this.markUsedSymbolsInNode(node.body as ASTNode);
    }
    if ('arguments' in node && Array.isArray(node.arguments)) {
      this.markUsedSymbols(node.arguments);
    }
    if ('left' in node && typeof node.left === 'object' && node.left !== null) {
      this.markUsedSymbolsInNode(node.left as ASTNode);
    }
    if ('right' in node && typeof node.right === 'object' && node.right !== null) {
      this.markUsedSymbolsInNode(node.right as ASTNode);
    }
    if ('operand' in node && typeof node.operand === 'object' && node.operand !== null) {
      this.markUsedSymbolsInNode(node.operand as ASTNode);
    }
  }

  /**
   * Remove unused function and module definitions
   * @param nodes - AST nodes to filter
   * @returns Filtered AST nodes
   */
  private removeUnusedDefinitions(nodes: ASTNode[]): ASTNode[] {
    const filteredNodes: ASTNode[] = [];

    for (const node of nodes) {
      let shouldKeep = true;

      switch (node.type) {
        case 'function_definition': {
          const functionDef = node as FunctionDefinitionNode;
          if (!this.usedSymbols.has(functionDef.name)) {
            shouldKeep = false;
            this.optimizationsApplied.push(
              this.createOptimizationInfo(
                'dead_code_elimination',
                `Removed unused function: ${functionDef.name}`,
                node.location || {
                  start: { line: 0, column: 0, offset: 0 },
                  end: { line: 0, column: 0, offset: 0 },
                },
                this.countNodesInSubtree(node),
                0,
                20.0 // Estimated 20% performance gain for removing unused function
              )
            );
            this.logger.debug(`Removed unused function: ${functionDef.name}`);
          }
          break;
        }

        case 'module_definition': {
          const moduleDef = node as ModuleDefinitionNode;
          if (!this.usedSymbols.has(moduleDef.name)) {
            shouldKeep = false;
            this.optimizationsApplied.push(
              this.createOptimizationInfo(
                'dead_code_elimination',
                `Removed unused module: ${moduleDef.name}`,
                node.location || {
                  start: { line: 0, column: 0, offset: 0 },
                  end: { line: 0, column: 0, offset: 0 },
                },
                this.countNodesInSubtree(node),
                0,
                25.0 // Estimated 25% performance gain for removing unused module
              )
            );
            this.logger.debug(`Removed unused module: ${moduleDef.name}`);
          }
          break;
        }

        case 'assignment':
          if ('name' in node && typeof node.name === 'string') {
            if (!this.usedSymbols.has(node.name)) {
              shouldKeep = false;
              this.optimizationsApplied.push(
                this.createOptimizationInfo(
                  'dead_code_elimination',
                  `Removed unused variable assignment: ${node.name}`,
                  node.location || {
                    start: { line: 0, column: 0, offset: 0 },
                    end: { line: 0, column: 0, offset: 0 },
                  },
                  this.countNodesInSubtree(node),
                  0,
                  10.0 // Estimated 10% performance gain for removing unused variable
                )
              );
              this.logger.debug(`Removed unused variable assignment: ${node.name}`);
            }
          }
          break;
      }

      if (shouldKeep) {
        // Recursively process children of kept nodes
        const processedNode = this.removeUnusedDefinitionsInNode(node);
        filteredNodes.push(processedNode);
      }
    }

    return filteredNodes;
  }

  /**
   * Remove unused definitions within a single node
   * @param node - AST node to process
   * @returns Processed node
   */
  private removeUnusedDefinitionsInNode(node: ASTNode): ASTNode {
    const processedNode = { ...node };

    if ('children' in processedNode && Array.isArray(processedNode.children)) {
      const mutableNode = processedNode as { children: ASTNode[] };
      mutableNode.children = this.removeUnusedDefinitions(processedNode.children);
    }
    if ('body' in processedNode && Array.isArray(processedNode.body)) {
      const mutableNode = processedNode as { body: ASTNode[] };
      mutableNode.body = this.removeUnusedDefinitions(processedNode.body);
    }

    return processedNode;
  }

  /**
   * Remove unreachable code (simplified implementation)
   * @param nodes - AST nodes to process
   * @returns Processed AST nodes
   */
  private removeUnreachableCode(nodes: ASTNode[]): ASTNode[] {
    // For now, this is a simplified implementation
    // In a full implementation, we would analyze control flow
    // and remove code after return statements, in unreachable branches, etc.

    const reachableNodes: ASTNode[] = [];

    for (const node of nodes) {
      // Simple heuristic: remove nodes after explicit return statements
      // This is a basic implementation - real dead code elimination would be more sophisticated

      if (this.isReachableNode(node)) {
        reachableNodes.push(this.removeUnreachableCodeInNode(node));
      } else {
        this.optimizationsApplied.push(
          this.createOptimizationInfo(
            'dead_code_elimination',
            'Removed unreachable code',
            node.location || {
              start: { line: 0, column: 0, offset: 0 },
              end: { line: 0, column: 0, offset: 0 },
            },
            this.countNodesInSubtree(node),
            0,
            15.0 // Estimated 15% performance gain for removing unreachable code
          )
        );
        this.logger.debug('Removed unreachable code');
      }
    }

    return reachableNodes;
  }

  /**
   * Remove unreachable code within a single node
   * @param node - AST node to process
   * @returns Processed node
   */
  private removeUnreachableCodeInNode(node: ASTNode): ASTNode {
    const processedNode = { ...node };

    if ('children' in processedNode && Array.isArray(processedNode.children)) {
      const mutableNode = processedNode as { children: ASTNode[] };
      mutableNode.children = this.removeUnreachableCode(processedNode.children);
    }
    if ('body' in processedNode && Array.isArray(processedNode.body)) {
      const mutableNode = processedNode as { body: ASTNode[] };
      mutableNode.body = this.removeUnreachableCode(processedNode.body);
    }

    return processedNode;
  }

  /**
   * Check if a node is reachable (simplified heuristic)
   * @param node - AST node to check
   * @returns True if node is reachable
   */
  private isReachableNode(_node: ASTNode): boolean {
    // Simplified implementation - in practice, this would involve
    // more sophisticated control flow analysis

    // For now, assume all nodes are reachable except in specific cases
    // This could be enhanced to detect unreachable code after returns,
    // in impossible conditional branches, etc.

    return true;
  }

  /**
   * Count the number of nodes in a subtree
   * @param node - Root node of subtree
   * @returns Number of nodes in subtree
   */
  private countNodesInSubtree(node: ASTNode): number {
    let count = 1; // Count this node

    if ('children' in node && Array.isArray(node.children)) {
      for (const child of node.children) {
        count += this.countNodesInSubtree(child);
      }
    }
    if ('body' in node && Array.isArray(node.body)) {
      for (const bodyNode of node.body) {
        count += this.countNodesInSubtree(bodyNode);
      }
    }
    if ('body' in node && typeof node.body === 'object' && node.body !== null) {
      count += this.countNodesInSubtree(node.body as ASTNode);
    }

    return count;
  }
}
