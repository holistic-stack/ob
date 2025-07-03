import { Node as TSNode } from 'web-tree-sitter';
import * as ast from '../../../ast-types.js';
import { BaseASTVisitor } from '../../base-ast-visitor.js';
import { ErrorHandler } from '../../../../error-handling/index.js';
import { ExpressionVisitor } from '../../expression-visitor.js';
import { getLocation } from '../../../utils/location-utils.js';

export class ConditionalExpressionVisitor extends BaseASTVisitor {
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
    // Conditional expressions don't handle function calls
    return null;
  }

  visit(node: TSNode): ast.ConditionalExpressionNode | ast.ErrorNode | null {
    if (node.type !== 'conditional_expression') {
      const error = this.errorHandler.createParserError(
        `Expected 'conditional_expression' but got '${node.type}'`,
        {
          line: getLocation(node).start.line,
          column: getLocation(node).start.column,
          nodeType: node.type
        }
      );
      this.errorHandler.report(error);
      return null;
    }
    const conditionNode = node.childForFieldName('condition');
    const consequenceNode = node.childForFieldName('consequence');
    const alternativeNode = node.childForFieldName('alternative');

    if (!conditionNode || !consequenceNode || !alternativeNode) {
      // WORKAROUND: Check if this is actually a simple literal that was misclassified as conditional_expression
      // This can happen due to grammar issues where simple expressions are incorrectly parsed
      if (node.childCount === 1 && node.namedChildCount === 1) {
        const child = node.namedChild(0);
        if (child) {
          this.errorHandler.logWarning(
            `[ConditionalExpressionVisitor] Detected misclassified literal as conditional_expression. Delegating to parent visitor. Node: "${node.text}", Child: "${child.type}"`,
            'ConditionalExpressionVisitor.visit',
            node
          );
          // Delegate back to the parent visitor to handle this as a regular expression
          const result = this.parentVisitor.visitExpression(child);
          // If the result is a conditional expression, return it; otherwise return null
          if (result && result.type === 'expression' && result.expressionType === 'conditional') {
            return result as ast.ConditionalExpressionNode;
          }
          return null;
        }
      }

      // If it's not a simple misclassified literal, it's a real error
      const error = this.errorHandler.createParserError(
        `Malformed conditional_expression: missing condition, consequence, or alternative.`,
        {
          line: getLocation(node).start.line,
          column: getLocation(node).start.column,
          nodeType: node.type
        }
      );
      this.errorHandler.report(error);
      return null;
    }

    const conditionAST = this.parentVisitor.dispatchSpecificExpression(conditionNode);
    if (conditionAST && conditionAST.type === 'error') {
    return conditionAST;
  }
  if (!conditionAST) {
      const error = this.errorHandler.createParserError(
        `Failed to parse condition in conditional expression.`,
        {
          line: getLocation(conditionNode).start.line,
          column: getLocation(conditionNode).start.column,
          nodeType: conditionNode.type
        }
      );
      this.errorHandler.report(error);
      return null;
    }

    const consequenceAST = this.parentVisitor.dispatchSpecificExpression(consequenceNode);
    if (consequenceAST && consequenceAST.type === 'error') {
    return consequenceAST;
  }
  if (!consequenceAST) {
      const error = this.errorHandler.createParserError(
        `Failed to parse consequence in conditional expression.`,
        {
          line: getLocation(consequenceNode).start.line,
          column: getLocation(consequenceNode).start.column,
          nodeType: consequenceNode.type
        }
      );
      this.errorHandler.report(error);
      return null;
    }

    const alternativeAST = this.parentVisitor.dispatchSpecificExpression(alternativeNode);
    if (alternativeAST && alternativeAST.type === 'error') {
    return alternativeAST;
  }
  if (!alternativeAST) {
      const error = this.errorHandler.createParserError(
        `Failed to parse alternative in conditional expression.`,
        {
          line: getLocation(alternativeNode).start.line,
          column: getLocation(alternativeNode).start.column,
          nodeType: alternativeNode.type
        }
      );
      this.errorHandler.report(error);
      return null;
    }

    return {
      type: 'expression',
      expressionType: 'conditional_expression', 
      condition: conditionAST, 
      thenBranch: consequenceAST, 
      elseBranch: alternativeAST, 
      location: getLocation(node),
    };
  }
}
