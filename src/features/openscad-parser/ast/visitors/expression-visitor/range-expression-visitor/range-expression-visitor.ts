/**
 * @file Range Expression Visitor for OpenSCAD AST generation
 * 
 * This visitor handles the conversion of Tree-sitter range expression nodes
 * into structured AST nodes. It supports both simple and stepped range expressions
 * commonly used in OpenSCAD for loops and list comprehensions.
 * 
 * Supported syntax patterns:
 * - Simple range: [start:end]
 * - Range with step: [start:step:end]
 * - Expression ranges: [expr1:expr2], [expr1:expr2:expr3]
 * 
 * @example Simple range expressions
 * ```openscad
 * [0:5]        // Simple range from 0 to 5
 * [1:10]       // Simple range from 1 to 10
 * [-5:5]       // Range from -5 to 5
 * ```
 * 
 * @example Range expressions with step
 * ```openscad
 * [0:2:10]     // Range from 0 to 10 with step 2
 * [1:0.5:5]    // Range from 1 to 5 with step 0.5
 * [10:-1:0]    // Reverse range from 10 to 0 with step -1
 * ```
 * 
 * @example Expression ranges
 * ```openscad
 * [x:y]        // Range using variables
 * [func():max] // Range using function calls
 * [a+1:b*2:c]  // Range using complex expressions
 * ```
 */

import { Node as TSNode } from 'web-tree-sitter';
import * as ast from '../../../ast-types.js';
import { BaseASTVisitor } from '../../base-ast-visitor.js';
import { getLocation } from '../../../utils/location-utils.js';
import { ErrorHandler } from '../../../../error-handling/index.js';
import { ExpressionVisitor } from '../../expression-visitor.js'; // Added import

/**
 * Visitor for converting Tree-sitter range expression nodes to AST nodes.
 * 
 * This visitor follows the Single Responsibility Principle by focusing exclusively
 * on range expression parsing. It integrates with the ExpressionVisitor for
 * processing nested expressions within range bounds.
 * 
 * @example Usage in ExpressionVisitor
 * ```typescript
 * const rangeVisitor = new RangeExpressionVisitor(expressionVisitor, errorHandler);
 * const rangeNode = rangeVisitor.visitRangeExpression(cstNode);
 * ```
 */
export class RangeExpressionVisitor extends BaseASTVisitor {

  /**
   * Main entry point for visiting a node with this visitor.
   * It specifically handles 'range_expression' CST nodes by dispatching
   * to `visitRangeExpression`. Other node types will result in an error.
   * @param node The Tree-sitter CST node to visit.
   * @returns An ASTNode (RangeExpressionNode or ErrorNode).
   */
  override visitNode(node: TSNode): ast.ASTNode | null {
    if (node.type === 'range_expression') {
      return this.visitRangeExpression(node);
    }
    this.errorHandler?.logError(
      `[RangeExpressionVisitor.visitNode] Unexpected node type: ${node.type}. Expected 'range_expression'.`,
      'RangeExpressionVisitor.visitNode: unexpected_node_type',
      node
    );
    // Return an ErrorNode, which is a subtype of ASTNode. Null could also be valid if the node is simply ignored.
    return {
      type: 'error',
      errorCode: 'UNEXPECTED_NODE_TYPE_FOR_RANGE_VISITOR',
      message: `RangeExpressionVisitor: Expected 'range_expression', but received '${node.type}'.`,
      originalNodeType: node.type,
      cstNodeText: node.text,
      location: getLocation(node),
    } as ast.ErrorNode;
  }

  /**
   * Parent expression visitor for processing nested expressions
   */
  private parentVisitor: ExpressionVisitor;

  /**
   * Constructor for the RangeExpressionVisitor
   * @param parentVisitor The parent ExpressionVisitor instance for processing nested expressions
   * @param errorHandler The error handler for logging and error management
   */
  constructor(parentVisitor: ExpressionVisitor, errorHandler: ErrorHandler) {
    super('', errorHandler); // Source will be inherited from parent visitor
    this.parentVisitor = parentVisitor;
  }

  /**
   * Implementation of abstract method from BaseASTVisitor.
   * Range expressions are not function calls, so this returns an ErrorNode.
   * @param node The Tree-sitter node
   * @returns Always an ErrorNode for range expressions when called as a function.
   */
  createASTNodeForFunction(node: TSNode): ast.ErrorNode {
    return {
      type: 'error',
      errorCode: 'INVALID_NODE_TYPE_FOR_FUNCTION_CALL',
      message: `RangeExpressionVisitor: Node type ${node.type} cannot be processed as a function call.`,
      originalNodeType: node.type,
      cstNodeText: node.text,
      location: getLocation(node),
    } as ast.ErrorNode;
  }

  /**
   * Visit a range expression node and convert it to an AST node.
   * 
   * This method handles both simple and stepped range expressions:
   * - Simple: [start:end]
   * - Stepped: [start:step:end]
   * 
   * It uses the parent ExpressionVisitor to process the start, step (optional),
   * and end expressions, ensuring that complex expressions within the range
   * are correctly parsed. Returns an ErrorNode if parsing fails at any critical step.
   * 
   * @param node - The Tree-sitter node to visit (must be a range_expression)
   * @returns The range expression AST node or an ErrorNode if parsing fails
   * 
   * @example Input CST for `[var_start : func_step() : 10 + x]`
   * ```
   * (range_expression
   *   "["
   *   start: (identifier)       // Example: var_start can be any expression
   *   ":"
   *   step: (call_expression) // Example: func_step() can be any expression
   *   ":"
   *   end: (binary_expression)  // Example: 10 + x can be any expression
   *   "]"
   * )
   * ```
   */
  visitRangeExpression(node: TSNode): ast.RangeExpressionNode | ast.ErrorNode {
    this.errorHandler?.logInfo(
      `[RangeExpressionVisitor.visitRangeExpression] Processing range expression: ${node.text}`,
      'RangeExpressionVisitor.visitRangeExpression'
    );

    if (node.type !== 'range_expression') {
      this.errorHandler?.logError(
        `[RangeExpressionVisitor.visitRangeExpression] Expected 'range_expression', got '${node.type}'. CST: ${node.text}`,
        'RangeExpressionVisitor.visitRangeExpression: invalid_node_type'
      );
      return {
        type: 'error',
        errorCode: 'INVALID_NODE_TYPE_FOR_RANGE_VISIT',
        message: `RangeExpressionVisitor.visitRangeExpression: Expected 'range_expression', got '${node.type}'.`,
        originalNodeType: node.type,
        cstNodeText: node.text,
        location: getLocation(node),
      };
    }

    const startNode = node.childForFieldName('start');
    const endNode = node.childForFieldName('end');
    const stepNode = node.childForFieldName('step'); // Might be null

    // Validate startNode - only check for truly missing nodes, not nodes with errors
    if (!startNode || startNode.isMissing || startNode.type === 'ERROR') {
      this.errorHandler?.logError(
        `[RangeExpressionVisitor.visitRangeExpression] Invalid or missing 'start' node. CST: ${node.text}`,
        'RangeExpressionVisitor.visitRangeExpression: invalid_start_node'
      );
      return {
        type: 'error',
        errorCode: 'MISSING_RANGE_START',
        message: `Missing start expression in range: ${node.text}.`,
        originalNodeType: node.type,
        cstNodeText: node.text,
        location: getLocation(node),
      };
    }

    // Validate endNode - only check for truly missing nodes, not nodes with errors
    if (!endNode || endNode.isMissing || endNode.type === 'ERROR') {
      this.errorHandler?.logError(
        `[RangeExpressionVisitor.visitRangeExpression] Invalid or missing 'end' node. CST: ${node.text}`,
        'RangeExpressionVisitor.visitRangeExpression: invalid_end_node'
      );
      return {
        type: 'error',
        errorCode: 'MISSING_RANGE_END',
        message: `Missing end expression in range: ${node.text}.`,
        originalNodeType: node.type,
        cstNodeText: node.text,
        location: getLocation(node),
      };
    }

    // Parse start expression
    const startExpressionResult = this.parentVisitor.dispatchSpecificExpression(startNode);
    if (!startExpressionResult) {
      this.errorHandler?.logError(
        `[RangeExpressionVisitor.visitRangeExpression] Failed to parse 'start' expression (null result). CST: ${startNode.text}`,
        'RangeExpressionVisitor.visitRangeExpression: start_expr_null_result'
      );
      return {
        type: 'error',
        errorCode: 'RANGE_START_PARSE_FAILURE',
        message: `Failed to parse start expression in range: ${startNode.text}. Visitor returned null.`,
        originalNodeType: node.type,
        cstNodeText: node.text,
        location: getLocation(node),
      };
    }
    if (startExpressionResult.type === 'error') {
      // Check if the error was due to 'if' keyword (parsed as identifier)
      if (startNode.text === 'if' && startNode.type === 'identifier') {
        this.errorHandler?.logError(
          `[RangeExpressionVisitor.visitRangeExpression] Keyword 'if' used as start expression. CST: ${startNode.text}`,
          'RangeExpressionVisitor.visitRangeExpression: keyword_as_start_expression'
        );
        return {
          type: 'error',
          errorCode: 'E209_INVALID_SYNTAX_IN_RANGE_START',
          message: `Invalid syntax: Reserved keyword '${startNode.text}' cannot be used as a standalone expression. Context: in start of range '${node.text}'.`,
          originalNodeType: node.type, // The overall node being parsed is a range_expression
          cstNodeText: startNode.text,
          location: getLocation(startNode),
        };
      }
      // Original error handling for unparsable start expression
      this.errorHandler?.logError(
        `[RangeExpressionVisitor.visitRangeExpression] 'start' expression parsing returned an error. CST: ${startNode.text}, Error: ${startExpressionResult.message}`,
        'RangeExpressionVisitor.visitRangeExpression: start_expr_is_error'
      );
      return {
        type: 'error',
        errorCode: 'UNPARSABLE_RANGE_START_EXPRESSION',
        message: `Failed to parse start expression '${startNode.text}' in range ${node.text}. Error: ${startExpressionResult.message}`,
        cause: startExpressionResult,
        originalNodeType: node.type,
        cstNodeText: node.text,
        location: getLocation(node),
      };
    }
    const startExpression = startExpressionResult as ast.ExpressionNode;

    // Check for forbidden CST node types in end expression
    const forbiddenEndNodeTypes = ['if_statement', 'for_statement', 'while_statement', 'do_statement', 'module_declaration', 'function_declaration', 'include_statement', 'import_statement', 'use_statement']; // Add other reserved/invalid types as needed
    if (forbiddenEndNodeTypes.includes(endNode.type)) {
      this.errorHandler?.logError(
        `[RangeExpressionVisitor.visitRangeExpression] Forbidden CST node type '${endNode.type}' used as end expression. CST: ${endNode.text}`,
        'RangeExpressionVisitor.visitRangeExpression: forbidden_end_node_type'
      );
      return {
        type: 'error',
        errorCode: 'E210_INVALID_SYNTAX_IN_RANGE_END',
        message: `Invalid syntax: Forbidden node type '${endNode.type}' used as end expression in range: ${node.text}.`,
        originalNodeType: endNode.type,
        cstNodeText: endNode.text,
        location: getLocation(endNode),
      };
    }

    // Parse end expression
    const endExpressionResult = this.parentVisitor.dispatchSpecificExpression(endNode);
    if (!endExpressionResult) {
      this.errorHandler?.logError(
        `[RangeExpressionVisitor.visitRangeExpression] Failed to parse 'end' expression (null result). CST: ${endNode.text}`,
        'RangeExpressionVisitor.visitRangeExpression: end_expr_null_result'
      );
      return {
        type: 'error',
        errorCode: 'RANGE_END_PARSE_FAILURE',
        message: `Failed to parse end expression in range: ${endNode.text}. Visitor returned null.`,
        originalNodeType: node.type,
        cstNodeText: node.text,
        location: getLocation(node),
      };
    }
    if (endExpressionResult.type === 'error') {
      // Check if the error was due to 'if' keyword (parsed as identifier)
      if (endNode.text === 'if' && endNode.type === 'identifier') {
        this.errorHandler?.logError(
          `[RangeExpressionVisitor.visitRangeExpression] Keyword 'if' used as end expression. CST: ${endNode.text}`,
          'RangeExpressionVisitor.visitRangeExpression: keyword_as_end_expression'
        );
        return {
          type: 'error',
          errorCode: 'E211_INVALID_SYNTAX_IN_RANGE_END',
          message: `Invalid syntax: Reserved keyword '${endNode.text}' cannot be used as a standalone expression. Context: in end of range '${node.text}'.`,
          originalNodeType: node.type, // The overall node being parsed is a range_expression
          cstNodeText: endNode.text,
          location: getLocation(endNode),
        };
      }
      // Original error handling for unparsable end expression
      this.errorHandler?.logError(
        `[RangeExpressionVisitor.visitRangeExpression] 'end' expression parsing returned an error. CST: ${endNode.text}, Error: ${endExpressionResult.message}`,
        'RangeExpressionVisitor.visitRangeExpression: end_expr_is_error'
      );
      return {
        type: 'error',
        errorCode: 'UNPARSABLE_RANGE_END_EXPRESSION',
        message: `Failed to parse end expression '${endNode.text}' in range ${node.text}. Error: ${endExpressionResult.message}`,
        cause: endExpressionResult,
        originalNodeType: node.type,
        cstNodeText: node.text,
        location: getLocation(node),
      };
    }
    const endExpression = endExpressionResult as ast.ExpressionNode;

    // Parse step expression (if present and valid)
    let stepExpression: ast.ExpressionNode | undefined = undefined;
    if (stepNode) {
      if (stepNode.isMissing || stepNode.type === 'ERROR') {
        this.errorHandler?.logError(
          `[RangeExpressionVisitor.visitRangeExpression] Invalid or missing 'step' node. CST: ${stepNode.text}`,
          'RangeExpressionVisitor.visitRangeExpression: invalid_step_node'
        );
        return {
          type: 'error',
          errorCode: 'INVALID_RANGE_STEP',
          message: `Invalid step expression in range: ${stepNode.text}.`,
          originalNodeType: node.type,
          cstNodeText: node.text,
          location: getLocation(node),
        };
      }

      // Check for forbidden CST node types in step expression
      const forbiddenStepNodeTypes = ['if_statement', 'for_statement', 'while_statement', 'do_statement', 'module_declaration', 'function_declaration', 'include_statement', 'import_statement', 'use_statement']; // Add other reserved/invalid types as needed
      if (forbiddenStepNodeTypes.includes(stepNode.type)) {
        this.errorHandler?.logError(
          `[RangeExpressionVisitor.visitRangeExpression] Forbidden CST node type '${stepNode.type}' used as step expression. CST: ${stepNode.text}`,
          'RangeExpressionVisitor.visitRangeExpression: forbidden_step_node_type'
        );
        return {
          type: 'error',
          errorCode: 'E211_INVALID_SYNTAX_IN_RANGE_STEP',
          message: `Invalid syntax: Forbidden node type '${stepNode.type}' used as step expression in range: ${node.text}.`,
          originalNodeType: stepNode.type,
          cstNodeText: stepNode.text,
          location: getLocation(stepNode),
        };
      }

      const stepExpressionResult = this.parentVisitor.dispatchSpecificExpression(stepNode);
      if (!stepExpressionResult) {
        this.errorHandler?.logError(
          `[RangeExpressionVisitor.visitRangeExpression] Failed to parse 'step' expression (null result). CST: ${stepNode.text}`,
          'RangeExpressionVisitor.visitRangeExpression: step_expr_null_result'
        );
        return {
          type: 'error',
          errorCode: 'RANGE_STEP_PARSE_FAILURE',
          message: `Failed to parse step expression in range: ${stepNode.text}. Visitor returned null.`,
          originalNodeType: node.type,
          cstNodeText: node.text,
          location: getLocation(node),
        };
      }
      if (stepExpressionResult.type === 'error') {
        // Check if the error was due to 'if' keyword (parsed as identifier)
        if (stepNode.text === 'if' && stepNode.type === 'identifier') {
          this.errorHandler?.logError(
            `[RangeExpressionVisitor.visitRangeExpression] Keyword 'if' used as step expression. CST: ${stepNode.text}`,
            'RangeExpressionVisitor.visitRangeExpression: keyword_as_step_expression'
          );
          return {
            type: 'error',
            errorCode: 'E210_INVALID_SYNTAX_IN_RANGE_STEP',
            message: `Invalid syntax: Reserved keyword '${stepNode.text}' cannot be used as a standalone expression. Context: in step of range '${node.text}'.`,
            originalNodeType: node.type, // The overall node being parsed is a range_expression
            cstNodeText: stepNode.text,
            location: getLocation(stepNode),
          };
        }
        // Original error handling for unparsable step expression
        this.errorHandler?.logError(
          `[RangeExpressionVisitor.visitRangeExpression] 'step' expression parsing returned an error. CST: ${stepNode.text}, Error: ${stepExpressionResult.message}`,
          'RangeExpressionVisitor.visitRangeExpression: step_expr_is_error'
        );
        return {
          type: 'error',
          errorCode: 'UNPARSABLE_RANGE_STEP_EXPRESSION',
          message: `Unable to parse step expression in range: ${stepNode.text}. Error: ${stepExpressionResult.message}`,
          originalNodeType: stepNode.type,
          cstNodeText: stepNode.text,
          location: getLocation(node),
        };
      }
      stepExpression = stepExpressionResult as ast.ExpressionNode;
    }

    // All parts are valid, create the RangeExpressionNode
    const rangeExpressionNode: ast.RangeExpressionNode = {
      type: 'expression',
      expressionType: 'range_expression',
      start: startExpression,
      end: endExpression,
      location: getLocation(node)
    };

    if (stepExpression !== undefined) {
      rangeExpressionNode.step = stepExpression;
    }

    return rangeExpressionNode;
  }
}
