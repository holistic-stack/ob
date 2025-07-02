/**
 * @file Constant Folding Optimization Pass
 *
 * Implements constant folding optimization to evaluate constant expressions
 * at compile time, reducing runtime computation and improving performance.
 *
 * Following TypeScript 5.8, DRY, and SRP principles.
 */

import { createLogger } from '../../../../shared/services/logger.service.js';
import type { Result } from '../../../../shared/utils/functional/result.js';
import { error, success } from '../../../../shared/utils/functional/result.js';
import type {
  ASTNode,
  BinaryExpressionNode,
  LiteralNode,
  UnaryExpressionNode,
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

const _logger = createLogger('ConstantFoldingPass');

/**
 * Constant folding optimization pass
 * Evaluates constant expressions at compile time
 */
export class ConstantFoldingPass extends OptimizationPass {
  private optimizationsApplied: OptimizationInfo[] = [];
  private errors: OptimizationError[] = [];

  constructor(config: OptimizationConfig, scopeManager?: ScopeManager) {
    super(config, scopeManager);
    this.logger.debug('ConstantFoldingPass initialized');
  }

  /**
   * Get the name of this optimization pass
   */
  getName(): string {
    return 'Constant Folding';
  }

  /**
   * Get the types of optimizations this pass can apply
   */
  getOptimizationTypes(): OptimizationType[] {
    return ['constant_folding'];
  }

  /**
   * Check if this pass should be applied based on configuration
   */
  shouldApply(): boolean {
    return this.config.enableConstantFolding;
  }

  /**
   * Apply constant folding optimization to an AST
   * @param ast - AST nodes to optimize
   * @returns Optimization result
   */
  optimize(ast: ASTNode[]): Result<OptimizationResult, OptimizationError> {
    this.logger.debug(`Starting constant folding optimization on ${ast.length} nodes`);

    try {
      // Reset state
      this.optimizationsApplied = [];
      this.errors = [];

      // Calculate initial statistics
      const statisticsBefore = this.calculateStatistics(ast);

      // Clone AST to avoid modifying original
      const optimizedAST = this.cloneAST(ast);

      // Apply constant folding
      this.foldConstants(optimizedAST);

      // Calculate final statistics
      const statisticsAfter = this.calculateStatistics(optimizedAST);

      const result: OptimizationResult = {
        optimizedAST,
        optimizationsApplied: [...this.optimizationsApplied],
        statisticsBefore,
        statisticsAfter,
        errors: [...this.errors],
      };

      this.logger.debug(
        `Constant folding completed: ${this.optimizationsApplied.length} optimizations applied, ${this.errors.length} errors`
      );

      return success(result);
    } catch (err) {
      const optimizationError = this.createOptimizationError(
        `Constant folding failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
        'CONSTANT_FOLDING_FAILURE'
      );

      this.logger.error(`Constant folding failed: ${optimizationError.message}`);
      return error(optimizationError);
    }
  }

  /**
   * Apply constant folding to AST nodes recursively
   * @param nodes - AST nodes to process
   */
  private foldConstants(nodes: ASTNode[]): void {
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      if (node) {
        nodes[i] = this.foldConstantsInNode(node);
      }
    }
  }

  /**
   * Apply constant folding to a single AST node
   * @param node - AST node to process
   * @returns Optimized node
   */
  private foldConstantsInNode(node: ASTNode): ASTNode {
    // Process children first (bottom-up approach)
    if ('children' in node && Array.isArray(node.children)) {
      this.foldConstants(node.children);
    }
    if ('body' in node && Array.isArray(node.body)) {
      this.foldConstants(node.body);
    }
    if ('body' in node && typeof node.body === 'object' && node.body !== null) {
      const mutableNode = node as { body: ASTNode };
      mutableNode.body = this.foldConstantsInNode(node.body as ASTNode);
    }

    // Process operands for expressions
    if ('left' in node && typeof node.left === 'object' && node.left !== null) {
      const mutableNode = node as { left: ASTNode };
      mutableNode.left = this.foldConstantsInNode(node.left as ASTNode);
    }
    if ('right' in node && typeof node.right === 'object' && node.right !== null) {
      const mutableNode = node as { right: ASTNode };
      mutableNode.right = this.foldConstantsInNode(node.right as ASTNode);
    }
    if ('operand' in node && typeof node.operand === 'object' && node.operand !== null) {
      const mutableNode = node as { operand: ASTNode };
      mutableNode.operand = this.foldConstantsInNode(node.operand as ASTNode);
    }

    // Apply constant folding to this node
    switch (node.type) {
      case 'binary_expression':
        return this.foldBinaryExpression(node as BinaryExpressionNode);
      case 'unary_expression':
        return this.foldUnaryExpression(node as UnaryExpressionNode);
      default:
        return node;
    }
  }

  /**
   * Fold constants in binary expressions
   * @param node - Binary expression node
   * @returns Optimized node (literal if foldable, original if not)
   */
  private foldBinaryExpression(node: BinaryExpressionNode): ASTNode {
    const { left, right, operator } = node;

    // Check if both operands are literals
    if (left.type === 'literal' && right.type === 'literal') {
      const leftLiteral = left as LiteralNode;
      const rightLiteral = right as LiteralNode;

      // Only fold numeric literals
      if (typeof leftLiteral.value === 'number' && typeof rightLiteral.value === 'number') {
        const result = this.evaluateBinaryOperation(
          leftLiteral.value,
          rightLiteral.value,
          operator
        );

        if (result !== null) {
          const foldedNode: LiteralNode = {
            type: 'literal',
            value: result,
            location: node.location || {
              start: { line: 0, column: 0, offset: 0 },
              end: { line: 0, column: 0, offset: 0 },
            },
          };

          // Record the optimization
          this.optimizationsApplied.push(
            this.createOptimizationInfo(
              'constant_folding',
              `Folded binary expression: ${leftLiteral.value} ${operator} ${rightLiteral.value} = ${result}`,
              node.location || {
                start: { line: 0, column: 0, offset: 0 },
                end: { line: 0, column: 0, offset: 0 },
              },
              3, // binary expression + 2 literals
              1, // single literal
              15.0 // Estimated 15% performance gain for eliminating runtime calculation
            )
          );

          this.logger.debug(
            `Folded binary expression: ${leftLiteral.value} ${operator} ${rightLiteral.value} = ${result}`
          );
          return foldedNode;
        }
      }
    }

    return node;
  }

  /**
   * Fold constants in unary expressions
   * @param node - Unary expression node
   * @returns Optimized node (literal if foldable, original if not)
   */
  private foldUnaryExpression(node: UnaryExpressionNode): ASTNode {
    const { operand, operator } = node;

    // Check if operand is a literal
    if (operand.type === 'literal') {
      const literal = operand as LiteralNode;

      // Only fold numeric literals
      if (typeof literal.value === 'number') {
        const result = this.evaluateUnaryOperation(literal.value, operator);

        if (result !== null) {
          const foldedNode: LiteralNode = {
            type: 'literal',
            value: result,
            location: node.location || {
              start: { line: 0, column: 0, offset: 0 },
              end: { line: 0, column: 0, offset: 0 },
            },
          };

          // Record the optimization
          this.optimizationsApplied.push(
            this.createOptimizationInfo(
              'constant_folding',
              `Folded unary expression: ${operator}${literal.value} = ${result}`,
              node.location || {
                start: { line: 0, column: 0, offset: 0 },
                end: { line: 0, column: 0, offset: 0 },
              },
              2, // unary expression + literal
              1, // single literal
              10.0 // Estimated 10% performance gain
            )
          );

          this.logger.debug(`Folded unary expression: ${operator}${literal.value} = ${result}`);
          return foldedNode;
        }
      }
    }

    return node;
  }

  /**
   * Evaluate a binary operation on two numbers
   * @param left - Left operand
   * @param right - Right operand
   * @param operator - Binary operator
   * @returns Result of operation, or null if not evaluable
   */
  private evaluateBinaryOperation(left: number, right: number, operator: string): number | null {
    try {
      switch (operator) {
        case '+':
          return left + right;
        case '-':
          return left - right;
        case '*':
          return left * right;
        case '/':
          if (right === 0) {
            this.errors.push(
              this.createOptimizationError(
                'Division by zero in constant folding',
                'DIVISION_BY_ZERO',
                undefined,
                'warning'
              )
            );
            return null;
          }
          return left / right;
        case '%':
          if (right === 0) {
            this.errors.push(
              this.createOptimizationError(
                'Modulo by zero in constant folding',
                'MODULO_BY_ZERO',
                undefined,
                'warning'
              )
            );
            return null;
          }
          return left % right;
        case '^':
        case '**':
          return left ** right;
        case '==':
          return left === right ? 1 : 0;
        case '!=':
          return left !== right ? 1 : 0;
        case '<':
          return left < right ? 1 : 0;
        case '<=':
          return left <= right ? 1 : 0;
        case '>':
          return left > right ? 1 : 0;
        case '>=':
          return left >= right ? 1 : 0;
        case '&&':
          return left !== 0 && right !== 0 ? 1 : 0;
        case '||':
          return left !== 0 || right !== 0 ? 1 : 0;
        default:
          return null; // Unknown operator
      }
    } catch (err) {
      this.errors.push(
        this.createOptimizationError(
          `Error evaluating binary operation: ${err instanceof Error ? err.message : 'Unknown error'}`,
          'BINARY_OPERATION_ERROR',
          undefined,
          'warning'
        )
      );
      return null;
    }
  }

  /**
   * Evaluate a unary operation on a number
   * @param operand - Operand value
   * @param operator - Unary operator
   * @returns Result of operation, or null if not evaluable
   */
  private evaluateUnaryOperation(operand: number, operator: string): number | null {
    try {
      switch (operator) {
        case '+':
          return +operand;
        case '-':
          return -operand;
        case '!':
          return operand === 0 ? 1 : 0;
        default:
          return null; // Unknown operator
      }
    } catch (err) {
      this.errors.push(
        this.createOptimizationError(
          `Error evaluating unary operation: ${err instanceof Error ? err.message : 'Unknown error'}`,
          'UNARY_OPERATION_ERROR',
          undefined,
          'warning'
        )
      );
      return null;
    }
  }
}
