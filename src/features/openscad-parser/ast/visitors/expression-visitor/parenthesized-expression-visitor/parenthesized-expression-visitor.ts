import { Node as TSNode } from 'web-tree-sitter';
import * as ast from '../../../ast-types.js';
import { BaseASTVisitor } from '../../base-ast-visitor.js';
import { ErrorHandler } from '../../../../error-handling/index.js';
import { ExpressionVisitor } from '../../expression-visitor.js';
import { getLocation } from '../../../utils/location-utils.js';

export class ParenthesizedExpressionVisitor extends BaseASTVisitor {
  constructor(
    protected parentVisitor: ExpressionVisitor,
    protected override errorHandler: ErrorHandler
  ) {
    super('', errorHandler); // Use empty string for source since we get it from parent
  }

  // Implement the abstract method required by BaseASTVisitor
  protected createASTNodeForFunction(
    _node: TSNode,
    _functionName: string,
    _args: ast.Parameter[]
  ): ast.ASTNode | null {
    // Parenthesized expressions don't handle function calls
    return null;
  }

  visit(node: TSNode): ast.ExpressionNode | ast.ErrorNode | null { // Returns the inner expression's AST node
    if (node.type !== 'parenthesized_expression') {
      const error = this.errorHandler.createParserError(
        `Expected 'parenthesized_expression' but got '${node.type}'`,
        {
          line: getLocation(node).start.line,
          column: getLocation(node).start.column,
          nodeType: node.type
        }
      );
      this.errorHandler.report(error);
      return null;
    }
    // The Tree-sitter grammar for parenthesized_expression should have a child
    // that is the actual expression. Common field names are 'expression' or 'inner'.
    // If it's an unnamed child, we might need to iterate or use node.namedChild(0).
    const innerExpressionNode = node.childForFieldName('expression') || node.namedChild(0);

    if (!innerExpressionNode) {
      const error = this.errorHandler.createParserError(
        `Malformed parenthesized_expression: missing inner expression.`,
        {
          line: getLocation(node).start.line,
          column: getLocation(node).start.column,
          nodeType: node.type
        }
      );
      this.errorHandler.report(error);
      return null;
    }

    // Visit the inner expression and return its AST node directly.
    // The location information will be from the inner expression.

    // If the inner expression is a generic 'expression' node, we need to find the actual content
    if (innerExpressionNode.type === 'expression') {
      // Look for the actual content within the expression node
      for (let i = 0; i < innerExpressionNode.namedChildCount; i++) {
        const child = innerExpressionNode.namedChild(i);
        if (child) {
          const result = this.parentVisitor.dispatchSpecificExpression(child);
          if (result) {
            return result;
          }
        }
      }
      // If no named children worked, try the first child
      const firstChild = innerExpressionNode.child(0);
      if (firstChild) {
        return this.parentVisitor.dispatchSpecificExpression(firstChild);
      }
    }

    // For non-expression nodes, dispatch directly
    return this.parentVisitor.dispatchSpecificExpression(innerExpressionNode);
  }
}
