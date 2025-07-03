import { Node as TSNode } from 'web-tree-sitter';
import * as ast from '../../ast-types.js';

/**
 * Interface for a parent visitor that can dispatch to specific expression parsing methods.
 * This is used by specialized expression visitors to call back to the main ExpressionVisitor
 * or a similar parent for parsing sub-expressions.
 */
export interface IParentExpressionVisitor {
  /**
   * Dispatches the parsing of a CST node to the appropriate method for handling
   * specific expression types.
   *
   * @param node The CST node representing the expression to parse.
   * @returns An AST ExpressionNode if parsing is successful, an ErrorNode if an error occurs,
   *          or null if the node type is not recognized or cannot be processed as an expression.
   */
  dispatchSpecificExpression(node: TSNode): ast.ExpressionNode | ast.ErrorNode | null;
}
