/**
 * Function call visitor for handling function calls in expressions
 *
 * This visitor is responsible for extracting function names and arguments from
 * function call nodes in the CST and creating appropriate AST nodes.
 *
 * @module lib/openscad-parser/ast/visitors/expression-visitor/function-call-visitor
 */

import { Node as TSNode } from 'web-tree-sitter';
import { ErrorCode, type ErrorContext } from '../../../error-handling/types/error-types.js';
import * as ast from '../../ast-types.js';
import { BaseASTVisitor } from '../base-ast-visitor.js';
import { getLocation } from '../../utils/location-utils.js';
import { ErrorHandler } from '../../../error-handling/index.js';
import type { IParentExpressionVisitor } from './i-parent-expression-visitor.js';
import { extractArguments } from '../../extractors/argument-extractor.js';

/**
 * Visitor for function calls in expressions
 */
export class FunctionCallVisitor extends BaseASTVisitor {
  /**
   * Create a new FunctionCallVisitor
   * @param parentVisitorOrSource The parent expression visitor or source code (for backward compatibility)
   * @param errorHandler The error handler instance
   */
  constructor(
    parentVisitorOrSource: IParentExpressionVisitor | string | null,
    protected override errorHandler: ErrorHandler
  ) {
    super('', errorHandler); // Source is not needed for this visitor

    if (typeof parentVisitorOrSource === 'string') {
      this.parentVisitor = null;
    } else {
      this.parentVisitor = parentVisitorOrSource;
    }
  }

  private parentVisitor: IParentExpressionVisitor | null;

  /**
   * Visit a node that could be a function call or module instantiation
   * @param node The node to visit
   * @returns The AST node or null if the node cannot be processed
   */
  visit(node: TSNode): ast.FunctionCallNode | ast.ErrorNode {
    let functionNameNode: TSNode | null = null;
    let argsNode: TSNode | null = null;

    if (node.type === 'module_instantiation') {
      functionNameNode = node.childForFieldName('name');
      argsNode = node.childForFieldName('arguments');
      if (!functionNameNode) {
        const message = `[FunctionCallVisitor] Module name node not found for module_instantiation: ${node.text}`;
        this.errorHandler.logError(message);
        return {
          type: 'error',
          errorCode: ErrorCode.MISSING_MODULE_NAME,
          message: `Module name not found for module_instantiation. CST node text: ${node.text}`,
          originalNodeType: node.type,
          cstNodeText: node.text,
          location: getLocation(node),
        } as ast.ErrorNode;
      }
    } else if (node.type === 'call_expression') {
      functionNameNode = node.childForFieldName('function');
      argsNode = node.childForFieldName('arguments');
      if (!functionNameNode) {
        const message = `[FunctionCallVisitor] Function name node not found for call_expression: ${node.text}`;
        this.errorHandler.logError(message);
        return {
          type: 'error',
          errorCode: ErrorCode.MISSING_FUNCTION_NAME,
          message: `Function name not found for call_expression. CST node text: ${node.text}`,
          originalNodeType: node.type,
          cstNodeText: node.text,
          location: getLocation(node),
        } as ast.ErrorNode;
      }
    } else {
      const errorMsg = 'Unexpected node type for function call/module instantiation.';
      this.errorHandler.handleError(this.errorHandler.createSyntaxError(
        `${errorMsg} Expected 'module_instantiation' or 'call_expression', got '${node.type}'.`,
        { cstNode: node, code: ErrorCode.SYNTAX_ERROR, nodeType: node.type }
      ));
      return { 
        type: 'error',
        errorCode: ErrorCode.UNEXPECTED_NODE_TYPE_FOR_FUNCTION_CALL,
        message: `${errorMsg} Expected 'module_instantiation' or 'call_expression', got '${node.type}'. CST node text: ${node.text}`,
        originalNodeType: node.type,
        cstNodeText: node.text,
        location: getLocation(node),
      } as ast.ErrorNode;
    }

    if (!functionNameNode) { // Should be unreachable if above logic is correct
        this.errorHandler.logError(`[FunctionCallVisitor] functionNameNode is unexpectedly null after initial checks. Node type: ${node.type}, Node text: ${node.text}`);
        return {
            type: 'error',
            errorCode: ErrorCode.INTERNAL_ERROR,
            message: `Internal error: functionNameNode is null for node type ${node.type}. CST node text: ${node.text}`,
            originalNodeType: node.type,
            cstNodeText: node.text,
            location: getLocation(node),
        } as ast.ErrorNode;
    }

    const functionName = functionNameNode.text;
    const args: ast.Parameter[] = [];

    if (argsNode) {
      const extractedParams = extractArguments(argsNode, this.errorHandler, this.source);
      // extractArguments returns Parameter[], errors are handled by errorHandler.
      args.push(...extractedParams);
    }
    return this.createASTNodeForFunction(node, functionName, args);
  }

  /**
   * Visit a function call node (old grammar - potentially for fallback or specific test cases)
   * @param node The function call node
   * @returns The AST node or an ErrorNode if processing fails
   */
  public visitFunctionCall(node: TSNode): ast.FunctionCallNode | ast.ErrorNode {
    const functionNode = node.childForFieldName('function');
    const argumentsNode = node.childForFieldName('arguments');

    if (!functionNode) {
      this.errorHandler.handleError(this.errorHandler.createSyntaxError(
        'Function call node missing function.',
        { cstNode: node, code: ErrorCode.SYNTAX_ERROR }
      ));
      return { 
        type: 'error',
        errorCode: ErrorCode.SYNTAX_ERROR,
        message: 'Function call node missing function.',
        originalNodeType: node.type,
        cstNodeText: node.text,
        location: getLocation(node),
      } as ast.ErrorNode;
    }

    // In some older/alternative CST structures, the function itself might be the identifier
    const functionNameNode = functionNode.type === 'identifier' ? functionNode : functionNode.childForFieldName('name');

    if (!functionNameNode) {
      this.errorHandler.handleError(this.errorHandler.createSyntaxError(
        'Function call name not found.',
        { cstNode: node, code: ErrorCode.MISSING_FUNCTION_NAME }
      ));
      return { 
        type: 'error',
        errorCode: ErrorCode.MISSING_FUNCTION_NAME,
        message: 'Function call name not found.',
        originalNodeType: node.type,
        cstNodeText: node.text,
        location: getLocation(node),
      } as ast.ErrorNode;
    }

    const functionName = functionNameNode.text;
    const args: ast.Parameter[] = [];

    if (argumentsNode) {
      const extractedParams = extractArguments(argumentsNode, this.errorHandler, this.source);
      // extractArguments returns Parameter[], errors are handled by errorHandler.
      args.push(...extractedParams);
    }
    return this.createASTNodeForFunction(node, functionName, args);
  }

  /**
   * Create an AST node for a function call
   * @param node The node containing the function call
   * @param functionName The name of the function
   * @param args The arguments to the function
   * @returns The FunctionCallNode or an ErrorNode if essential info is missing
   */
  protected createASTNodeForFunction(
    node: TSNode, // The original CST node for location info
    functionName: string,
    args: ast.Parameter[]
  ): ast.FunctionCallNode { // Note: No longer returns ErrorNode directly, caller should handle
    this.errorHandler.logInfo(
      `[FunctionCallVisitor.createASTNodeForFunction] Processing function: ${functionName}`
    );

    // Special handling for assign function calls - these should be processed as assign statements
    if (functionName === 'assign') {
      this.errorHandler.logInfo(
        `[FunctionCallVisitor.createASTNodeForFunction] Detected assign function call, delegating to assign statement processing`
      );

      // For assign function calls, we need to return null to indicate this visitor cannot handle it
      // The CompositeVisitor will then try other visitors, including AssignStatementVisitor
      return null as any; // This will be handled by the calling visitor chain
    }

    return {
      type: 'expression',
      expressionType: 'function_call',
      functionName: functionName,
      args: args,
      location: getLocation(node),
    } as ast.FunctionCallNode;
  }
}
