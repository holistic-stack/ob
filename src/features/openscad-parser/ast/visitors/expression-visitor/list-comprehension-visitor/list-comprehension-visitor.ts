/**
 * @file List Comprehension Visitor for OpenSCAD AST generation
 * 
 * This visitor handles the conversion of Tree-sitter list comprehension nodes
 * into structured AST nodes. It supports both traditional and OpenSCAD syntax
 * variants for list comprehensions.
 * 
 * Supported syntax patterns:
 * - Traditional: [expr for (var = range)]
 * - Traditional with condition: [expr for (var = range) if (condition)]
 * - OpenSCAD: [for (var = range) expr]
 * - OpenSCAD with condition: [for (var = range) if (condition) expr]
 * - OpenSCAD with let: [let (assignments) for (var = range) expr]
 * 
 * @example Traditional syntax
 * ```openscad
 * [x*x for (x = [1:5])]
 * [x for (x = [1:10]) if (x % 2 == 0)]
 * ```
 * 
 * @example OpenSCAD syntax
 * ```openscad
 * [for (x = [1:5]) x*x]
 * [for (x = [1:10]) if (x % 2 == 0) x]
 * [let (a=1) for (x = [1:5]) x+a]
 * ```
 */

import { Node as TSNode } from 'web-tree-sitter';
import { BaseASTVisitor } from '../../base-ast-visitor.js';
import { ErrorHandler } from '../../../../error-handling/index.js';
import { ExpressionVisitor } from '../../expression-visitor.js';
import * as ast from '../../../ast-types.js';
import { getLocation } from '../../../utils/location-utils.js';

/**
 * Visitor for handling list comprehension expressions in OpenSCAD.
 */
export class ListComprehensionVisitor extends BaseASTVisitor {
  constructor(
    protected parentVisitor: ExpressionVisitor,
    protected override errorHandler: ErrorHandler
  ) {
    super('', errorHandler); // Use empty string for source since we get it from parent
  }

  /**
   * Implement the abstract method required by BaseASTVisitor.
   * List comprehensions don't handle function calls directly.
   */
  protected createASTNodeForFunction(
    _node: TSNode,
    _functionName: string,
    _args: ast.Parameter[]
  ): ast.ASTNode | null {
    return null;
  }

  /**
   * Visit a list comprehension node and convert it to an AST node.
   * 
   * This method handles both traditional and OpenSCAD syntax variants:
   * - Traditional: [expr for (var = range) if (condition)]
   * - OpenSCAD: [for (var = range) if (condition) expr]
   * 
   * @param node - The Tree-sitter node representing the list comprehension
   * @returns The list comprehension AST node or null if processing fails
   * 
   * @example Processing traditional syntax
   * ```typescript
   * // For OpenSCAD code: [x*x for (x = [1:5])]
   * const result = visitor.visitListComprehension(node);
   * // Returns: { type: 'expression', expressionType: 'list_comprehension_expression', ... }
   * ```
   */
  visitListComprehension(node: TSNode): ast.ListComprehensionExpressionNode | ast.ErrorNode | null {
    this.errorHandler.logInfo(
      `[ListComprehensionVisitor.visitListComprehension] Processing node: ${node.text.substring(0, 80)}`
    );

    try {
      // Attempt to parse as OpenSCAD-style.
      // This method should return ListComprehensionExpressionNode, ErrorNode, or null (if not OpenSCAD style)
      const openScadResult = this.parseOpenScadStyle(node);

      if (openScadResult && openScadResult.type === 'expression' && openScadResult.expressionType === 'list_comprehension_expression') {
        this.errorHandler.logInfo(
          `[ListComprehensionVisitor.visitListComprehension] Successfully parsed as OpenSCAD style. CST: ${node.text.substring(0,50)}`
        );
        return openScadResult;
      }

      // If openScadResult is an ErrorNode, it implies an error occurred *during* parsing of what seemed like an OpenSCAD LC.
      // In this case, we should propagate this error rather than trying Python style.
      if (openScadResult && openScadResult.type === 'error') {
        this.errorHandler.logWarning(
          `[ListComprehensionVisitor.visitListComprehension] Propagating error from OpenSCAD style parsing. CST: ${node.text.substring(0,50)} Error: ${openScadResult.message}`,
          'visitListComprehension.openScadErrorPropagation'
        );
        return openScadResult;
      }

      // If openScadResult is null, it means it was not recognized as OpenSCAD style. Try Python style.
      if (openScadResult === null) {
        this.errorHandler.logInfo(
          `[ListComprehensionVisitor.visitListComprehension] Not an OpenSCAD style list comprehension, attempting Python style. CST: ${node.text.substring(0,50)}`,
          'visitListComprehension.tryPythonStyle'
        );
        const pythonResult = this.parsePythonStyle(node);
        if (pythonResult && pythonResult.type === 'expression' && pythonResult.expressionType === 'list_comprehension_expression') {
          this.errorHandler.logInfo(
            `[ListComprehensionVisitor.visitListComprehension] Successfully parsed as Python style. CST: ${node.text.substring(0,50)}`,
            'visitListComprehension.pythonSuccess'
          );
          return pythonResult;
        }
        if (pythonResult && pythonResult.type === 'error') {
            this.errorHandler.logWarning(
            `[ListComprehensionVisitor.visitListComprehension] Propagating error from Python style parsing. CST: ${node.text.substring(0,50)} Error: ${pythonResult.message}`,
            'visitListComprehension.pythonErrorPropagation'
            );
            return pythonResult;
        }
      }

      this.errorHandler.logWarning(
        `[ListComprehensionVisitor.visitListComprehension] Node (type: ${node.type}, text: "${node.text.substring(0, 80).replace(/\n/g, '\\n')}") is not a recognized list comprehension. Returning ErrorNode.`,
        'visitListComprehension.notRecognizedAsLC'
      );
      return {
        type: 'error',
        errorCode: 'NODE_NOT_LIST_COMPREHENSION',
        message: `The provided CST node (type: ${node.type}) is not a recognized list comprehension.`,
        location: getLocation(node),
        originalNodeType: node.type,
        cstNodeText: node.text.substring(0, 200), // Limit text length for error object
      };

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.errorHandler.logError(
        `[ListComprehensionVisitor.visitListComprehension] Unexpected error: ${errorMessage}. ErrorCode: VISIT_LIST_COMPREHENSION_UNEXPECTED_ERROR. OriginalError: ${errorMessage}`,
        'VISIT_LIST_COMPREHENSION_UNEXPECTED_ERROR'
      );
      return {
        type: 'error',
        errorCode: 'VISIT_LIST_COMPREHENSION_UNEXPECTED_ERROR',
        message: `Unexpected error processing list comprehension: ${errorMessage}`,
        location: getLocation(node),
        originalNodeType: node.type,
        cstNodeText: node.text,
      };
    }
  }
  /**
   * Parses OpenSCAD-style list comprehensions: [let (assignments)? for (var = range) if (condition)? expr]
   * 
   * This method attempts to identify and parse the components of an OpenSCAD-style
   * list comprehension. It expects a specific order of child nodes:
   * 1. Optional `let_clause`
   * 2. Mandatory `list_comprehension_for`
   * 3. Optional `if_clause`
   * 4. Mandatory body expression (any valid expression node)
   *
   * If the structure deviates, or if essential components are missing, it returns
   * an `ErrorNode` detailing the issue. If the node does not appear to be an
   * OpenSCAD-style list comprehension at all (e.g., missing `for` clause early on),
   * it returns `null` to allow `visitListComprehension` to try Python-style parsing.
   * 
   * @param node - The Tree-sitter node for the list comprehension.
   * @returns An `ast.ListComprehensionExpressionNode` if successful, an `ast.ErrorNode`
   *          if there's a structural issue, or `null` if it's not OpenSCAD style.
   */
  private parseOpenScadStyle(node: TSNode): ast.ListComprehensionExpressionNode | ast.ErrorNode | null {
    this.errorHandler.logInfo(
      `[ListComprehensionVisitor.parseOpenScadStyle] Attempting to parse as OpenSCAD style. CST: ${node.text.substring(0, 80)}`,
      'parseOpenScadStyle.entry'
    );

    // Filter out non-significant children like '[', ']', 'comment', 'ERROR'
    // We are interested in 'let_clause', 'list_comprehension_for', 'if_clause', and the body expression.
    const significantChildren = node.children.filter(
      c => c && c.type !== '[' && c.type !== ']' && c.type !== 'comment' && c.type !== 'ERROR' && c.type !== ','
    );

    if (significantChildren.length === 0) {
      this.errorHandler.logWarning(
        `[ListComprehensionVisitor.parseOpenScadStyle] No significant children found. Not an OpenSCAD style LC. CST: ${node.text.substring(0,80)}`,
        'parseOpenScadStyle.noSignificantChildren'
      );
      return null; // Not an OpenSCAD style LC if no significant children
    }

    let childIndex = 0;
    let letClauseCstNode: TSNode | null = null;
    let forClauseCstNode: TSNode | null = null;
    let bodyExpressionCstNode: TSNode | null = null;

    // 1. Optional let_clause
    if (significantChildren.length > childIndex) {
      const currentChild = significantChildren[childIndex];
      if (currentChild && currentChild.type === 'let_clause') {
        letClauseCstNode = currentChild;
        childIndex++;
        this.errorHandler.logInfo(
          `[ListComprehensionVisitor.parseOpenScadStyle] Found let_clause: ${letClauseCstNode.text.substring(0,50)}`,
          'parseOpenScadStyle.letClauseFound'
        );
      }
    }

    // 2. Mandatory list_comprehension_for
    if (significantChildren.length > childIndex) {
      const currentChildNode = significantChildren[childIndex]; // Guarded access
      if (currentChildNode && currentChildNode.type === 'list_comprehension_for') {
        forClauseCstNode = currentChildNode;
        childIndex++;
        this.errorHandler.logInfo(
          `[ListComprehensionVisitor.parseOpenScadStyle] Found list_comprehension_for: ${forClauseCstNode.text.substring(0,50)}`,
          'parseOpenScadStyle.forClauseFound'
        );
      } else {
        // Expected for_clause, but found something else or null (null unlikely due to filter)
        if (letClauseCstNode) {
          this.errorHandler.logError(
            `[ListComprehensionVisitor.parseOpenScadStyle] 'list_comprehension_for' not found after 'let_clause', or wrong type. CST: ${node.text.substring(0,80)}. ErrorCode: LC_OPENSCAD_STYLE_MISSING_FOR_AFTER_LET`,
            'LC_OPENSCAD_STYLE_MISSING_FOR_AFTER_LET'
          );
          return {
            type: 'error' as const,
            errorCode: 'LC_OPENSCAD_STYLE_MISSING_FOR_AFTER_LET',
            message: `Required 'list_comprehension_for' child node not found or of wrong type after 'let_clause'.`,
            location: getLocation(letClauseCstNode ?? node),
            originalNodeType: node.type,
            cstNodeText: node.text,
          };
        } else {
           this.errorHandler.logInfo(
            `[ListComprehensionVisitor.parseOpenScadStyle] First significant child is not 'list_comprehension_for'. Not OpenSCAD style. CST: ${currentChildNode?.text.substring(0,80)}`,
            'parseOpenScadStyle.notOpenScadStyle'
          );
          return null; // Not OpenSCAD style
        }
      }
    } else {
      // No more children, but for_clause was mandatory.
      if (letClauseCstNode) {
        this.errorHandler.logError(
          `[ListComprehensionVisitor.parseOpenScadStyle] 'list_comprehension_for' not found after 'let_clause' (no more children). CST: ${node.text.substring(0,80)}. ErrorCode: LC_OPENSCAD_STYLE_MISSING_FOR_AFTER_LET_EOF`,
          'LC_OPENSCAD_STYLE_MISSING_FOR_AFTER_LET_EOF'
        );
        return {
          type: 'error' as const,
          errorCode: 'LC_OPENSCAD_STYLE_MISSING_FOR_AFTER_LET_EOF',
          message: `Required 'list_comprehension_for' child node not found after 'let_clause' (end of significant children).`,
          location: getLocation(letClauseCstNode ?? node),
          originalNodeType: node.type,
          cstNodeText: node.text,
        };
      } else {
         this.errorHandler.logInfo(
          `[ListComprehensionVisitor.parseOpenScadStyle] Not enough significant children for 'list_comprehension_for'. Not OpenSCAD style. CST: ${node.text.substring(0,80)}`,
          'parseOpenScadStyle.notOpenScadStyle_EOF'
        );
        return null; // Not OpenSCAD style
      }
    }

    // 3. Check for condition field (grammar uses direct field, not if_clause node)
    const conditionFieldNode = node.childForFieldName('condition');
    if (conditionFieldNode) {
      this.errorHandler.logInfo(
        `[ListComprehensionVisitor.parseOpenScadStyle] Found condition field: ${conditionFieldNode.text.substring(0,50)}`,
        'parseOpenScadStyle.conditionFieldFound'
      );
    }

    // 4. Mandatory body_expression (use expr field from grammar)
    bodyExpressionCstNode = node.childForFieldName('expr');
    if (bodyExpressionCstNode) {
      this.errorHandler.logInfo(
        `[ListComprehensionVisitor.parseOpenScadStyle] Found body_expression: ${bodyExpressionCstNode.text.substring(0,50)}`,
        'parseOpenScadStyle.bodyFound'
      );
    } else {
      this.errorHandler.logError(
        `[ListComprehensionVisitor.parseOpenScadStyle] Missing body expression (expr field). CST: ${node.text.substring(0,80)}. ErrorCode: LC_OPENSCAD_STYLE_MISSING_BODY_EXPRESSION`,
        'LC_OPENSCAD_STYLE_MISSING_BODY_EXPRESSION'
      );
      return {
        type: 'error' as const,
        errorCode: 'LC_OPENSCAD_STYLE_MISSING_BODY_EXPRESSION',
        message: 'Missing body expression (expr field) in OpenSCAD-style list comprehension.',
        location: getLocation(conditionFieldNode ?? forClauseCstNode ?? node), // Best guess for location
        originalNodeType: node.type,
        cstNodeText: node.text,
      };
    }
    
    // At this point, forClauseCstNode and bodyExpressionCstNode are guaranteed to be non-null.
    // letClauseCstNode and conditionFieldNode are optional.

    // Parse let_clause (placeholder for now - not yet supported)
    if (letClauseCstNode) {
      // TODO: Implement let clause parsing when the grammar and AST types support it
      this.errorHandler.logWarning(
        `[ListComprehensionVisitor.parseOpenScadStyle] Let clause found but not yet supported. CST: ${letClauseCstNode.text.substring(0, 50)}`,
        'parseOpenScadStyle.letClauseNotSupported'
      );
    }

    if (!forClauseCstNode) {
      this.errorHandler.logError(
        `[ListComprehensionVisitor.parseOpenScadStyle] Internal error: forClauseCstNode is unexpectedly null before calling extractForClause. This should have been caught earlier. CST: ${node.text.substring(0, 80)}`,
        'LC_OPENSCAD_INTERNAL_NULL_FOR_CLAUSE_PRE_EXTRACT'
      );
      return { 
        type: 'error' as const,
        errorCode: 'LC_OPENSCAD_INTERNAL_NULL_FOR_CLAUSE_PRE_EXTRACT',
        message: 'Internal error: Mandatory for_clause CST node is null before extraction.',
        location: getLocation(node),
        originalNodeType: node.type,
      };
    }

    // Extract for clause
    // forClauseCstNode is guaranteed non-null here due to the check above.
    const forClause = this.extractForClause(forClauseCstNode!); 
    this.errorHandler.logInfo(
      `[ListComprehensionVisitor.parseOpenScadStyle] Extracted forClause. Variable: ${forClause.variable}, Range CST: ${forClauseCstNode!.childForFieldName('range')?.text?.substring(0,50)}, Range AST type: ${forClause.range.type}, Range AST expressionType: ${('expressionType' in forClause.range ? (forClause.range as any).expressionType : 'N/A')}, Range AST errorCode: ${('errorCode' in forClause.range ? (forClause.range as any).errorCode : 'N/A')}`,
      'parseOpenScadStyle.forClauseResult',
      forClause.range
    );

    // Validate forClause.range (Error propagation)
    if (forClause.range.type === 'error') {
      this.errorHandler.logWarning(
        `[ListComprehensionVisitor.parseOpenScadStyle] Error extracting for_clause range. Propagating error. CST: ${forClauseCstNode!.text.substring(0,50)}`,
        'parseOpenScadStyle.extractForClauseErrorPropagation'
      );
      return forClause.range; // Propagate error from extractForClause
    }

    // After this point, forClause.range is guaranteed to be a valid ExpressionNode
    if (!forClause.variable) {
      this.errorHandler.logError(
        `[ListComprehensionVisitor.parseOpenScadStyle] Failed to extract variable from for clause. CST: ${forClauseCstNode!.text.substring(0,80)}. ErrorCode: LC_FOR_CLAUSE_NO_VARIABLE_PROP`,
        'LC_FOR_CLAUSE_NO_VARIABLE_PROP'
      );
      return {
        type: 'error' as const,
        errorCode: 'LC_FOR_CLAUSE_NO_VARIABLE_PROP',
        message: 'Failed to extract variable name from for clause.',
        location: getLocation(forClauseCstNode!),
        originalNodeType: forClauseCstNode!.type,
        cstNodeText: forClauseCstNode!.text,
      };
    }

    // Ensure bodyExpressionCstNode is valid before dispatching
    // bodyExpressionCstNode is guaranteed non-null if we reach here due to earlier checks.
    if (!bodyExpressionCstNode) { 
      this.errorHandler.logError(
        `[ListComprehensionVisitor.parseOpenScadStyle] Mandatory body expression CST node is null before dispatch. This indicates an earlier logic error. CST: ${node.text.substring(0, 80)}`,
        'LC_OPENSCAD_NULL_BODY_EXPRESSION_NODE_PRE_DISPATCH'
      );
      return {
        type: 'error' as const,
        errorCode: 'LC_OPENSCAD_NULL_BODY_EXPRESSION_NODE_PRE_DISPATCH',
        message: 'Internal error: Mandatory body expression CST node was null before dispatching.',
        location: getLocation(node), 
        originalNodeType: node.type,
        cstNodeText: node.text,
      };
    }

    const bodyExpressionAstNode = this.parentVisitor.dispatchSpecificExpression(
      bodyExpressionCstNode 
    );
    this.errorHandler.logInfo(
      `[ListComprehensionVisitor.parseOpenScadStyle] Parsed bodyExpression. Body CST: ${bodyExpressionCstNode?.text?.substring(0,50)}, Body AST type: ${bodyExpressionAstNode?.type}, Body AST expressionType: ${bodyExpressionAstNode && 'expressionType' in bodyExpressionAstNode ? (bodyExpressionAstNode as any).expressionType : 'N/A'}, Body AST errorCode: ${bodyExpressionAstNode && 'errorCode' in bodyExpressionAstNode ? (bodyExpressionAstNode as any).errorCode : 'N/A'}`,
      'parseOpenScadStyle.bodyExpressionResult',
      bodyExpressionAstNode
    );

    // Validate body expression result (Error propagation)
    if (!bodyExpressionAstNode) {
      this.errorHandler.logError(
        `[ListComprehensionVisitor.parseOpenScadStyle] Failed to parse body expression (visitor returned null). CST: ${bodyExpressionCstNode!.text.substring(0,80)}. ErrorCode: LC_BODY_EXPRESSION_UNPARSABLE_NULL`,
        'LC_BODY_EXPRESSION_UNPARSABLE_NULL'
      );
      return {
        type: 'error' as const,
        errorCode: 'LC_BODY_EXPRESSION_UNPARSABLE_NULL',
        message: 'Failed to parse body expression (visitor returned null).',
        location: getLocation(bodyExpressionCstNode!),
        originalNodeType: bodyExpressionCstNode!.type,
        cstNodeText: bodyExpressionCstNode!.text,
      };
    }
    // The `if (bodyExpressionAstNode.type === 'error')` check that follows this block
    // will now correctly reference bodyExpressionAstNode in the proper scope.
    if (bodyExpressionAstNode.type === 'error') {
      this.errorHandler.logError(
        `[ListComprehensionVisitor.parseOpenScadStyle] Error in body expression. Propagating. CST: ${bodyExpressionCstNode.text.substring(0,80)}. ErrorCode: LC_BODY_EXPRESSION_ERROR_PROP`,
        'LC_BODY_EXPRESSION_ERROR_PROP'
      );
      return {
        type: 'error' as const,
        errorCode: 'LC_BODY_EXPRESSION_ERROR_PROP',
        message: 'Error parsing body expression.',
        location: getLocation(bodyExpressionCstNode),
        originalNodeType: bodyExpressionCstNode.type,
        cstNodeText: bodyExpressionCstNode.text,
        cause: bodyExpressionAstNode,
      };
    }

    // Parse condition field (optional)
    let conditionAstNode: ast.ExpressionNode | null = null;
    if (conditionFieldNode) {
      const parsedCondition = this.parentVisitor.dispatchSpecificExpression(conditionFieldNode);
      if (!parsedCondition) {
        this.errorHandler.logError(
          `[ListComprehensionVisitor.parseOpenScadStyle] Failed to parse condition expression (visitor returned null). CST: ${conditionFieldNode.text.substring(0,80)}. ErrorCode: LC_CONDITION_UNPARSABLE_NULL`,
          'LC_CONDITION_UNPARSABLE_NULL'
        );
        return {
          type: 'error' as const,
          errorCode: 'LC_CONDITION_UNPARSABLE_NULL',
          message: 'Failed to parse condition expression (visitor returned null).',
          location: getLocation(conditionFieldNode),
          originalNodeType: conditionFieldNode.type,
          cstNodeText: conditionFieldNode.text,
        };
      }
      if (parsedCondition.type === 'error') {
        this.errorHandler.logError(
          `[ListComprehensionVisitor.parseOpenScadStyle] Error in condition expression. Propagating. CST: ${conditionFieldNode.text.substring(0,80)}. ErrorCode: LC_CONDITION_ERROR_PROP`,
          'LC_CONDITION_ERROR_PROP'
        );
        return {
          type: 'error' as const,
          errorCode: 'LC_CONDITION_ERROR_PROP',
          message: 'Error parsing condition expression.',
          location: getLocation(conditionFieldNode),
          originalNodeType: conditionFieldNode.type,
          cstNodeText: conditionFieldNode.text,
          cause: parsedCondition,
        };
      }
      conditionAstNode = parsedCondition;
    }

    // Construct the AST node
    const resultNode: ast.ListComprehensionExpressionNode = {
      type: 'expression' as const,
      expressionType: 'list_comprehension_expression' as const,
      variable: forClause.variable, // Checked for null/empty and error propagation above
      range: forClause.range,    // Error propagation handled above
      expression: bodyExpressionAstNode, // Checked for null and error propagation above
      location: getLocation(node),
    };

    // Add condition if present
    if (conditionAstNode) {
      resultNode.condition = conditionAstNode;
    }

    // TODO: Implement let assignments support when grammar and AST types are ready
    // Currently letAssignments is always null, so no processing needed

    this.errorHandler.logInfo(
      `[ListComprehensionVisitor.parseOpenScadStyle] Successfully parsed OpenSCAD style list comprehension. Variable: ${resultNode.variable}, Body: ${resultNode.expression.expressionType}`,
      'parseOpenScadStyle.success'
    );
    return resultNode;
  }

  /**
   * Extracts the loop variable and range expression from a 'list_comprehension_for' CST node. (OpenSCAD-style).
   * 
   * @param forClauseNode - The for_clause CST node to process.
   * @returns Object containing the variable name and range expression AST node.
   */
  private extractForClause(forClauseNode: TSNode): { variable: string | null; range: ast.ExpressionNode | ast.ErrorNode } {
    try {
      // Based on grammar.js, forClauseNode is a 'list_comprehension_for' CST node.
      // It directly contains 'iterator' (variable) and 'range' (iterable expression) fields.
      // list_comprehension_for: ($) =>
      //   seq(
      //     'for',
      //     '(',
      //     choice(
      //       seq(field('iterator', $.identifier), '=', field('range', $._non_list_comprehension_value)), // Single assignment
      //       seq($.list_comprehension_assignment, repeat1(seq(',', $.list_comprehension_assignment))) // Multiple assignments
      //     ),
      //     ')'
      //   ),

      // For simplicity, this implementation currently only supports the single assignment form.
      // TODO: Extend to support multiple assignments (e.g., for (a=1, b=2) ...)

      const variableIdentifierNode = forClauseNode.childForFieldName('iterator');
      let variableName: string | null = null;

      if (!variableIdentifierNode) {
        this.errorHandler.logError(
          `[ListComprehensionVisitor.extractForClause] Field 'iterator' (loop variable identifier) not found in list_comprehension_for node. CST: ${forClauseNode.text}. ErrorCode: LC_FOR_CLAUSE_MISSING_ITERATOR_FIELD`
        );
        return {
          variable: null,
          range: { 
            type: 'error' as const,
            errorCode: 'LC_FOR_CLAUSE_MISSING_ITERATOR_FIELD',
            message: "Field 'iterator' (loop variable identifier) not found in list_comprehension_for node.",
            location: getLocation(forClauseNode),
            originalNodeType: forClauseNode.type, // Added missing originalNodeType
            cstNodeText: forClauseNode.text,
          },
        };
      }

      variableName = variableIdentifierNode.text;
      if (variableName === null || variableName.trim() === '') {
        this.errorHandler.logError(
          `[ListComprehensionVisitor.extractForClause] Loop variable identifier node ('iterator') has no text or is empty. CST: ${variableIdentifierNode.text}. ErrorCode: LC_FOR_CLAUSE_ITERATOR_NO_TEXT`
        );
        return {
          variable: null,
          range: { 
            type: 'error' as const,
            errorCode: 'LC_FOR_CLAUSE_ITERATOR_NO_TEXT',
            message: "Loop variable identifier node ('iterator') has no text or is empty.",
            location: getLocation(variableIdentifierNode),
            originalNodeType: variableIdentifierNode.type,
            cstNodeText: variableIdentifierNode.text,
          },
        };
      }

      const rangeExprNode = forClauseNode.childForFieldName('range');
      let rangeAstNode: ast.ExpressionNode | ast.ErrorNode;

      if (rangeExprNode) {
        const parsedRange = this.parentVisitor.dispatchSpecificExpression(rangeExprNode);
        if (parsedRange) {
          rangeAstNode = parsedRange; // Can be ExpressionNode or ErrorNode
        } else {
          this.errorHandler.logError(
            `[ListComprehensionVisitor.extractForClause] parentVisitor.dispatchSpecificExpression returned null for range expression node ('range'). CST: ${rangeExprNode.text}. ErrorCode: LC_FOR_CLAUSE_UNPARSABLE_RANGE_NULL`
          );
          rangeAstNode = { 
            type: 'error' as const,
            errorCode: 'LC_FOR_CLAUSE_UNPARSABLE_RANGE_NULL',
            message: `Failed to parse range expression ('range') (parent visitor returned null): ${rangeExprNode.text}`,
            location: getLocation(rangeExprNode),
            originalNodeType: rangeExprNode.type,
            cstNodeText: rangeExprNode.text,
          };
        }
      } else {
        this.errorHandler.logError(
          `[ListComprehensionVisitor.extractForClause] Field 'range' (for range expression) not found in list_comprehension_for node. CST: ${forClauseNode.text}. ErrorCode: LC_FOR_CLAUSE_MISSING_RANGE_FIELD`
        );
        rangeAstNode = { 
          type: 'error' as const,
          errorCode: 'LC_FOR_CLAUSE_MISSING_RANGE_FIELD',
          message: "Field 'range' (for range expression) not found in list_comprehension_for node.",
          location: getLocation(forClauseNode),
          originalNodeType: forClauseNode.type,
          cstNodeText: forClauseNode.text,
        };
      }
      return { variable: variableName, range: rangeAstNode };
    } catch (error: unknown) { 
      const message = error instanceof Error ? error.message : String(error);
      this.errorHandler.logError(
        `[ListComprehensionVisitor.extractForClause] Unexpected error: ${message}. ErrorCode: LC_EXTRACT_FOR_CLAUSE_UNEXPECTED_ERROR`
      );
      return {
        variable: null,
        range: { 
          type: 'error' as const,
          errorCode: 'LC_EXTRACT_FOR_CLAUSE_UNEXPECTED_ERROR',
          message: `Unexpected error extracting for clause: ${message}`,
          location: getLocation(forClauseNode),
          originalNodeType: forClauseNode.type, // Added missing originalNodeType
          cstNodeText: forClauseNode.text,
        },
      };
    }
  }

  /**
   * Parses Python-style list comprehensions: [expr for var in iterable if condition?]
   * Placeholder implementation.
   * @param node - The Tree-sitter node for the list comprehension.
   * @returns An ast.ListComprehensionExpressionNode if successful, an ast.ErrorNode
   *          if there's a structural issue, or null if it's not Python style.
   */
  private parsePythonStyle(_node: TSNode): ast.ListComprehensionExpressionNode | ast.ErrorNode | null {
    this.errorHandler.logInfo(
      `[ListComprehensionVisitor.parsePythonStyle] Attempting to parse as Python style. CST: ${_node.text.substring(0, 80)}`,
      'parsePythonStyle.entry'
    );
    // TODO: Implement Python-style list comprehension parsing logic.
    // Expected structure: [body_expression, list_comprehension_for_python, optional list_comprehension_if_python]
    this.errorHandler.logWarning(
      `[ListComprehensionVisitor.parsePythonStyle] Python-style list comprehension parsing is not yet implemented. Returning null. CST: ${_node.text.substring(0,80)}`,
      'parsePythonStyle.notImplemented'
    );
    return null;
  }
}
