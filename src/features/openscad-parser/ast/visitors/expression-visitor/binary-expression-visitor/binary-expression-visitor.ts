import { Node as TSNode } from 'web-tree-sitter';
import * as ast from '../../../ast-types.js';
import { BaseASTVisitor } from '../../base-ast-visitor.js'; // Assuming this is the correct path
import { ErrorHandler } from '../../../../error-handling/index.js';
import { ExpressionVisitor } from '../../expression-visitor.js'; // Parent visitor
import { getLocation } from '../../../utils/location-utils.js';

export class BinaryExpressionVisitor extends BaseASTVisitor {
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
    // Binary expressions don't handle function calls
    return null;
  }

  visit(node: TSNode): ast.BinaryExpressionNode | ast.ErrorNode | null {
    // Accept all binary expression types from the grammar
    const validBinaryTypes = [
      'binary_expression',
      'logical_or_expression',
      'logical_and_expression',
      'equality_expression',
      'relational_expression',
      'additive_expression',
      'multiplicative_expression',
      'exponentiation_expression'
    ];

    if (!validBinaryTypes.includes(node.type)) {
      const error = this.errorHandler.createParserError(
        `Expected binary expression type but got '${node.type}'`,
        {
          line: getLocation(node).start.line,
          column: getLocation(node).start.column,
          nodeType: node.type
        }
      );
      this.errorHandler.report(error);
      return null;
    }

    // Try field-based access first, then fall back to positional access
    let leftNode = node.childForFieldName('left');
    let operatorNode = node.childForFieldName('operator');
    let rightNode = node.childForFieldName('right');

    // If field-based access fails, use positional access for binary expressions
    // Binary expressions typically have structure: left_operand operator right_operand
    if (!leftNode || !operatorNode || !rightNode) {
      if (node.childCount >= 3) {
        leftNode = node.child(0);
        operatorNode = node.child(1);
        rightNode = node.child(2);
      }
    }

    if (!leftNode || !operatorNode || !rightNode) {
      // WORKAROUND: Check if this is actually a single expression wrapped in a binary expression node
      // This can happen when the grammar creates nested expression hierarchies for precedence
      if (node.namedChildCount === 1) {
        const child = node.namedChild(0);
        if (child) {
          this.errorHandler.logWarning(
            `[BinaryExpressionVisitor] Detected single expression wrapped as binary expression. Delegating to parent visitor. Node: "${node.text}", Child: "${child.type}"`,
            'BinaryExpressionVisitor.visit',
            node
          );
          // Delegate back to the parent visitor to handle this as a regular expression
          const result = this.parentVisitor.visitExpression(child);
          // If the result is a binary expression, return it as such
          if (result && result.type === 'expression' && 'expressionType' in result && result.expressionType === 'binary') {
            return result as ast.BinaryExpressionNode;
          }
          // If it's not a binary expression, this node is not actually a binary expression
          // Return null to indicate this visitor cannot handle this node
          return null;
        }
      }

      // If it's not a simple wrapped expression, it's a real error
      const error = this.errorHandler.createParserError(
        `Malformed binary_expression: missing left, operator, or right child. Left: ${leftNode}, Op: ${operatorNode}, Right: ${rightNode}`,
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
    // Type guard for valid operators if necessary, or let semantic analysis handle it
    // For now, we assume the grammar provides valid operator tokens.

    // Debug: Log operand node details
    this.errorHandler.logInfo(
      `[BinaryExpressionVisitor] Processing operands - Left: ${leftNode.type} "${leftNode.text}", Right: ${rightNode.type} "${rightNode.text}"`,
      'BinaryExpressionVisitor.visit',
      node
    );

    const leftAST = this.parentVisitor.dispatchSpecificExpression(leftNode);
    const rightAST = this.parentVisitor.dispatchSpecificExpression(rightNode);

    // Debug: Log operand results
    this.errorHandler.logInfo(
      `[BinaryExpressionVisitor] Operand results - Left: ${leftAST ? 'success' : 'null'}, Right: ${rightAST ? 'success' : 'null'}`,
      'BinaryExpressionVisitor.visit',
      node
    );

    if (leftAST && leftAST.type === 'error') {
    return leftAST;
  }
  if (rightAST && rightAST.type === 'error') {
    return rightAST;
  }

  if (!leftAST || !rightAST) {
      // Errors in sub-expressions should have been handled by the parentVisitor
      // or its delegates. If they return null, it means a parsing error occurred.
      const error = this.errorHandler.createParserError(
        `Failed to parse operands in binary expression. Left node: ${leftNode.type} "${leftNode.text}" -> ${leftAST}, Right node: ${rightNode.type} "${rightNode.text}" -> ${rightAST}`,
        {
          line: getLocation(node).start.line,
          column: getLocation(node).start.column,
          nodeType: node.type,
          leftType: leftNode.type,
          rightType: rightNode.type
        }
      );
      this.errorHandler.report(error);
      return null;
    }

    return {
      type: 'expression',
      expressionType: 'binary', // Use 'binary' to match test expectations in expression-visitor.test.ts
      operator: operator as ast.BinaryOperator, // Cast, assuming grammar aligns with ast.BinaryOperator
      left: leftAST, // Cast is safe due to checks above
      right: rightAST, // Cast is safe due to checks above
      location: getLocation(node),
    };
  }
}
