/**
 * Visitor for if-else statements
 *
 * This visitor handles if-else statements in OpenSCAD, including:
 * - Basic if statements
 * - If-else statements
 * - If-else-if-else chains
 *
 * @module lib/openscad-parser/ast/visitors/control-structure-visitor/if-else-visitor
 */

import type { Node as TSNode } from 'web-tree-sitter';
import type { ErrorHandler } from '../../../error-handling/index.js'; // Added ErrorHandler import
import type * as ast from '../../ast-types.js';
import { getLocation } from '../../utils/location-utils.js';
import { findDescendantOfType } from '../../utils/node-utils.js';
import type { ASTVisitor } from '../ast-visitor.js';
import { BaseASTVisitor } from '../base-ast-visitor.js';
import { ExpressionVisitor } from '../expression-visitor.js';

/**
 * Visitor for if-else statements
 */
export class IfElseVisitor extends BaseASTVisitor {
  private expressionVisitor: ExpressionVisitor;
  private compositeVisitor: ASTVisitor | undefined;

  constructor(
    sourceCode: string,
    override errorHandler: ErrorHandler,
    protected override variableScope: Map<string, ast.ParameterValue>
  ) {
    super(sourceCode, errorHandler, variableScope);
    this.expressionVisitor = new ExpressionVisitor(sourceCode, errorHandler, variableScope);
  }

  /**
   * Set the composite visitor for delegating child node processing
   * This is needed to resolve circular dependency issues during visitor creation
   */
  setCompositeVisitor(compositeVisitor: ASTVisitor): void {
    this.compositeVisitor = compositeVisitor;
  }

  protected createASTNodeForFunction(
    node: TSNode,
    functionName: string,
    args: ast.Parameter[]
  ): ast.ASTNode | null {
    if (functionName === 'if') {
      return this.createIfNode(node, args);
    }
    return null;
  }

  /**
   * Visit an if statement node
   * @param node The if statement node to visit
   * @returns The if AST node or null if the node cannot be processed
   */
  override visitIfStatement(node: TSNode): ast.IfNode | null {
    // Extract condition
    const conditionNode = node.childForFieldName('condition');
    if (!conditionNode) {
      // Try to find the condition by child index
      // Based on the node structure, the condition is typically the named child at index 0
      if (node.namedChildCount >= 1) {
        const expressionNode = node.namedChild(0);
        if (expressionNode && expressionNode.type === 'expression') {
          return this.processIfStatement(node, expressionNode);
        }
      }

      // If we still can't find the condition, try looking at the children directly
      if (node.childCount >= 3) {
        // In OpenSCAD grammar, the condition is typically the third child (index 2)
        const possibleConditionNode = node.child(2);
        if (possibleConditionNode && possibleConditionNode.type === 'expression') {
          return this.processIfStatement(node, possibleConditionNode);
        }
      }

      return null;
    }

    return this.processIfStatement(node, conditionNode);
  }

  /**
   * Process an if statement with the given condition node
   * @param node The if statement node
   * @param conditionNode The condition node
   * @returns The if AST node or null if the node cannot be processed
   */
  private processIfStatement(node: TSNode, conditionNode: TSNode): ast.IfNode | null {
    // Use the expression visitor to evaluate the condition
    let condition: ast.ExpressionNode;
    const expressionResult = this.expressionVisitor.visitExpression(conditionNode);

    if (expressionResult && expressionResult.type === 'expression') {
      condition = expressionResult;
    } else {
      // Fallback to a simple literal expression if the expression visitor fails
      condition = {
        type: 'expression',
        expressionType: 'literal',
        value: conditionNode.text,
        location: getLocation(conditionNode),
      };
    }

    // Extract then branch
    // In OpenSCAD grammar, the then branch is typically the named child at index 1
    // or the fourth child (index 4) in the raw children list
    let thenNode = node.childForFieldName('consequence');

    if (!thenNode && node.namedChildCount >= 2) {
      thenNode = node.namedChild(1);
    }

    if (!thenNode && node.childCount >= 5) {
      thenNode = node.child(4);
    }

    if (!thenNode) {
      return null;
    }

    const thenBranch = this.visitBlock(thenNode);

    // Extract else branch if it exists
    // In OpenSCAD grammar, the else branch is typically after the then branch
    let elseNode = node.childForFieldName('alternative');
    if (!elseNode && node.childCount >= 4) {
      // Look for an 'else' keyword followed by a block or another if statement
      for (let i = 3; i < node.childCount; i++) {
        const child = node.child(i);
        if (child && child.type === 'else') {
          // The else branch is the next child
          if (i + 1 < node.childCount) {
            elseNode = node.child(i + 1);
            break;
          }
        }
      }
    }

    let elseBranch: ast.ASTNode[] | undefined;

    if (elseNode) {
      // Check if this is an else-if or a simple else
      const elseIfNode = findDescendantOfType(elseNode, 'if_statement');
      if (elseIfNode) {
        // This is an else-if, so process it as an if statement
        const elseIfResult = this.visitIfStatement(elseIfNode);
        if (elseIfResult) {
          elseBranch = [elseIfResult];
        }
      } else {
        // This is a simple else, so process its block
        elseBranch = this.visitBlock(elseNode);
      }
    }

    return {
      type: 'if',
      condition,
      children: thenBranch,
      location: getLocation(node),
    };
  }

  /**
   * Visit a block node and extract its children
   * @param node The block node to visit
   * @returns An array of AST nodes representing the block's children
   */
  public override visitBlock(node: TSNode): ast.ASTNode[] {
    const result: ast.ASTNode[] = [];

    // Process each child of the block
    for (let i = 0; i < node.namedChildCount; i++) {
      const child = node.namedChildren[i];

      if (child) {
        // Delegate to the composite visitor if available
        if (this.compositeVisitor) {
          const childNode = this.compositeVisitor.visitNode(child);
          if (childNode) {
            result.push(childNode);
          }
        } else {
          // Fallback: create placeholder nodes if no composite visitor is available
          const childNode: ast.ASTNode = {
            type: 'expression' as const,
            expressionType: 'literal',
            value: child.type,
            location: getLocation(child),
          };
          result.push(childNode);
        }
      }
    }

    return result;
  }

  /**
   * Create an if node from a function call
   * @param node The node containing the if statement
   * @param args The arguments to the if statement
   * @returns The if AST node or null if the arguments are invalid
   */
  createIfNode(node: TSNode, args: ast.Parameter[]): ast.IfNode | null {
    // Create condition expression
    let condition: ast.ExpressionNode;

    if (args.length > 0 && args[0]?.value) {
      const firstArg = args[0];
      const argValue = firstArg.value;

      if (
        typeof argValue === 'object' &&
        argValue !== null &&
        !Array.isArray(argValue) &&
        'type' in argValue &&
        argValue.type === 'expression'
      ) {
        // Use the expression directly if it's already an expression node
        condition = argValue;
      } else {
        // Create a literal expression for other value types
        condition = {
          type: 'expression',
          expressionType: 'literal',
          value:
            typeof argValue === 'string' ||
            typeof argValue === 'number' ||
            typeof argValue === 'boolean'
              ? argValue
              : JSON.stringify(argValue),
          location: getLocation(node),
        };
      }
    } else {
      // Default condition for testing
      condition = {
        type: 'expression',
        expressionType: 'literal',
        value: 'true',
        location: getLocation(node),
      };
    }

    return {
      type: 'if',
      condition,
      children: [],
      location: getLocation(node),
    };
  }
}
