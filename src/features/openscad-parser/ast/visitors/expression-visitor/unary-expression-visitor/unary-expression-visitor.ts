import { Node as TSNode } from 'web-tree-sitter';
import * as ast from '../../../ast-types.js';
import { BaseASTVisitor } from '../../base-ast-visitor.js';
import { ErrorHandler } from '../../../../error-handling/index.js';
import { ExpressionVisitor } from '../../expression-visitor.js';
import { getLocation } from '../../../utils/location-utils.js';

export class UnaryExpressionVisitor extends BaseASTVisitor {
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
    // Unary expressions don't handle function calls
    return null;
  }

  visit(node: TSNode): ast.UnaryExpressionNode | ast.ErrorNode | null {
    if (node.type !== 'unary_expression') {
      const error = this.errorHandler.createParserError(
        `Expected 'unary_expression' but got '${node.type}'`,
        {
          line: getLocation(node).start.line,
          column: getLocation(node).start.column,
          nodeType: node.type
        }
      );
      this.errorHandler.report(error);
      return null;
    }
    // Tree-sitter grammar uses 'operator' and 'operand' field names
    const operatorNode = node.childForFieldName('operator');
    const operandNode = node.childForFieldName('operand');

    if (!operatorNode || !operandNode) {
      // WORKAROUND: Check if this is actually a single expression wrapped in a unary expression node
      // This can happen when the grammar creates nested expression hierarchies for precedence
      if (node.namedChildCount === 1) {
        const child = node.namedChild(0);
        if (child) {
          this.errorHandler.logWarning(
            `[UnaryExpressionVisitor] Detected single expression wrapped as unary expression. Delegating to parent visitor. Node: "${node.text}", Child: "${child.type}"`,
            'UnaryExpressionVisitor.visit',
            node
          );
          // Delegate back to the parent visitor to handle this as a regular expression
          const result = this.parentVisitor.visitExpression(child);
          // Return any valid expression result, but only if it's actually a unary expression
          if (result && result.type === 'expression' && 'expressionType' in result && result.expressionType === 'unary') {
            return result as ast.UnaryExpressionNode;
          }
          // If it's not a unary expression, return null to indicate this isn't a unary expression
          return null;
        }
      }

      // If it's not a simple wrapped expression, it's a real error
      const error = this.errorHandler.createParserError(
        `Malformed unary_expression: missing operator or operand. Operator: ${operatorNode}, Operand: ${operandNode}`,
        {
          line: getLocation(node).start.line,
          column: getLocation(node).start.column,
          nodeType: node.type
        }
      );
      this.errorHandler.report(error);
      return null;
    }

    const operator = operatorNode.text;
    // Add type guard for ast.UnaryOperator if necessary

    const operandAST = this.parentVisitor.dispatchSpecificExpression(operandNode);

    // If operand parsing failed (returned null) or resulted in an error node, propagate it.
    if (!operandAST) {
      const error = this.errorHandler.createParserError(
        `Failed to parse operand in unary expression: dispatchSpecificExpression returned null.`,
        {
          line: getLocation(operandNode).start.line,
          column: getLocation(operandNode).start.column,
          nodeType: operandNode.type
        }
      );
      this.errorHandler.report(error);
      // Return a new ErrorNode if dispatchSpecificExpression returned null, to be consistent
      return {
        type: 'error',
        errorCode: 'UNPARSABLE_UNARY_OPERAND_NULL',
        message: `Failed to parse operand for unary expression. CST node text: ${operandNode.text}`,
        originalNodeType: operandNode.type,
        cstNodeText: operandNode.text,
        location: getLocation(operandNode),
      } as ast.ErrorNode;
    }

    // Check if the dispatched expression itself is an ErrorNode
    if (operandAST.type === 'error') {
      // Propagate the ErrorNode directly
      // Optionally, wrap it or add context if needed, but direct propagation is simplest for now
      this.errorHandler.logWarning(
        `[UnaryExpressionVisitor] Operand parsing resulted in an ErrorNode. Propagating error. Node: "${operandNode.text}"`,
        'UnaryExpressionVisitor.visit',
        operandAST
      );
      return operandAST; 
    }

    // At this point, operandAST should be a valid ExpressionNode (not null and not ErrorNode)
    return {
      type: 'expression',
      expressionType: 'unary_expression',
      operator: operator as ast.UnaryOperator, // Cast, assuming grammar aligns
      operand: operandAST, // operandAST is now guaranteed to be a valid ExpressionNode
      prefix: true, // OpenSCAD unary operators are always prefix
      location: getLocation(node),
    } as ast.UnaryExpressionNode;
  }
}
