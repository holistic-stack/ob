/**
 * Visitor for for loop statements
 *
 * This visitor handles for loop statements in OpenSCAD, including:
 * - Basic for loops
 * - For loops with step values
 * - For loops with multiple variables
 *
 * @module lib/openscad-parser/ast/visitors/control-structure-visitor/for-loop-visitor
 */

import { Node as TSNode } from 'web-tree-sitter';
import * as ast from '../../ast-types.js';
import { getLocation } from '../../utils/location-utils.js';
import { ExpressionVisitor } from '../expression-visitor.js';
import { ErrorHandler } from '../../../error-handling/index.js';
import { BaseASTVisitor } from '../base-ast-visitor.js';
import { isExpressionNode as isParameterExpressionNode } from '../../extractors/parameter-extractor.js';
import { defaultLocation, createErrorNodeInternal } from '../../utils/ast-error-utils.js';

function isAstVariableNode(node: ast.ASTNode | null): node is ast.VariableNode {
  // VariableNode extends ExpressionNode, so type is 'expression', and expressionType is 'variable'
  return node !== null && node.type === 'expression' && (node as ast.ExpressionNode).expressionType === 'variable';
}

function isAstExpressionNode(node: ast.ASTNode | null): node is ast.ExpressionNode {
  return node !== null && node.type === 'expression';
} // Added import
// import { StatementVisitor } from '../statement-visitor.js'; // Temporarily commented out

// function createNumericLiteralNode(value: number | boolean | ast.Vector2D | ast.Vector3D | ast.Vector4D, locationNode: TSNode): ast.LiteralNode {
//   return {
//     type: 'expression',
//     expressionType: 'literal',
//     value: value,
//     location: getLocation(locationNode) || defaultLocation
//   } as ast.LiteralNode;
// }

// function createRangeExpressionNode(
//   startNode: ast.ExpressionNode | ast.ErrorNode,
//   endNode: ast.ExpressionNode | ast.ErrorNode,
//   stepNode?: ast.ExpressionNode | ast.ErrorNode,
//   locationCstNode?: TSNode | null
// ): ast.RangeExpressionNode | ast.ErrorNode {
//   if (startNode.type === 'error') {
//     return startNode;
//   }
//   if (endNode.type === 'error') {
//     return endNode;
//   }
//   if (stepNode && stepNode.type === 'error') {
//     return createErrorNodeInternal(
//       locationCstNode || null,
//       'Invalid step in range expression',
//       'E_RANGE_STEP_INVALID',
//       stepNode.originalNodeType,
//       stepNode.cstNodeText,
//       stepNode
//     );
//   }

//   return {
//     type: 'expression',
//     expressionType: 'range_expression',
//     start: startNode as ast.ExpressionNode, 
//     end: endNode as ast.ExpressionNode,     
//     ...(stepNode && { step: stepNode as ast.ExpressionNode }),
//     location: (locationCstNode ? getLocation(locationCstNode) : defaultLocation) || defaultLocation,
//   };
// }

/**
 * Visitor for for loop statements
 */
export class ForLoopVisitor extends BaseASTVisitor {
  private expressionVisitor: ExpressionVisitor;

  constructor(source: string, protected override errorHandler: ErrorHandler) {
    super(source, errorHandler);
    this.expressionVisitor = new ExpressionVisitor(source, this.errorHandler);
  }

  override visitForStatement(node: TSNode): ast.ForLoopNode | ast.ErrorNode | null {
    this.errorHandler.logInfo('[ForLoopVisitor.visitForStatement] Method Enter', 'ForLoopVisitor.visitForStatement: enter', node);

    const loopVariablesAst: (ast.VariableNode | ast.ErrorNode)[] = [];
    const loopRangesAst: (ast.ExpressionNode | ast.ErrorNode)[] = [];
    let bodyCstNode: TSNode | null = null;

    const potentialAssignmentsCstNodes: TSNode[] = [];
    const bodyNodeTypes = [
      'block', 'statement', 'module_call', 'function_call', 'include_statement', 
      'use_statement', 'if_statement', 'for_statement', 'intersection_for_statement', 
      'let_statement', 'assign_statement', 'echo_statement', 'expression_statement', 
      // Add geometry and transform nodes as they can be single statements in a loop body
      'cube', 'sphere', 'cylinder', 'polyhedron', 'polygon', 'circle', 'square', 'text',
      'translate', 'rotate', 'scale', 'resize', 'mirror', 'multmatrix', 'color', 'offset', 'hull', 'minkowski',
      'union', 'difference', 'intersection', 'render', 'linear_extrude', 'rotate_extrude', 'surface'
    ];

    // Separate CST nodes for assignments and potential body
    for (const child of node.namedChildren) {
      if (child && child.type === 'for_assignment') {
        potentialAssignmentsCstNodes.push(child);
      } else if (child && bodyNodeTypes.includes(child.type)) {
        if (child === node.lastNamedChild || !bodyCstNode) {
            // Prefer last named child if it's a body type, otherwise take the first one encountered.
            bodyCstNode = child;
        }
      } else {
        this.errorHandler.logWarning(
          `[ForLoopVisitor.visitForStatement] Encountered unexpected child type '${child?.type}' in for_statement. Text: ${child?.text}`,
          'ForLoopVisitor.visitForStatement: unexpected_child_type',
          child
        );
      }
    }
    
    // If bodyCstNode is still null, and there's a lastNamedChild not used in assignments, it might be the body.
    // This handles cases where the body might not be in bodyNodeTypes explicitly but is the only remaining element.
    if (!bodyCstNode && node.lastNamedChild && !potentialAssignmentsCstNodes.includes(node.lastNamedChild)) {
        const lastChild = node.lastNamedChild;
        // Check if it's not an iterator or range if we are in single assignment mode later
        const iteratorField = node.childForFieldName('iterator');
        const rangeField = node.childForFieldName('range');
        if (lastChild !== iteratorField && lastChild !== rangeField) {
            bodyCstNode = lastChild;
            this.errorHandler.logInfo(
                `[ForLoopVisitor.visitForStatement] Tentatively assigned lastNamedChild '${lastChild.type}' as body.`,
                'ForLoopVisitor.visitForStatement: last_child_as_body',
                lastChild
            );
        }
    }

    if (potentialAssignmentsCstNodes.length > 0) {
      this.errorHandler.logInfo(
        `[ForLoopVisitor.visitForStatement] Found ${potentialAssignmentsCstNodes.length} for_assignment CST nodes.`,
        'ForLoopVisitor.visitForStatement: multiple_assignments_found',
        node
      );
      for (let i = 0; i < potentialAssignmentsCstNodes.length; i++) {
        const child = potentialAssignmentsCstNodes[i];
        if (!child) {
          this.errorHandler.logError(`Null CST child encountered at index ${i} when searching for for_assignment or body.`, 'ForLoopVisitor.visitForStatement: null_child_in_potential_assignments', node);
          continue;
        }
        // Check for for_assignment (which could be multiple)
        if (child.type === 'for_assignment') {
          const iteratorCstNode = child.childForFieldName('iterator');
          const rangeCstNode = child.childForFieldName('range');

          if (!iteratorCstNode || !rangeCstNode) {
            this.errorHandler.logError(
              'Missing iterator or range in for_assignment node.',
              'ForLoopVisitor.visitForStatement: missing_iterator_range_in_for_assignment',
              child
            );
            continue; 
          }

          const iteratorAstNode = this.expressionVisitor.dispatchSpecificExpression(iteratorCstNode);
          const rangeAstNode = this.expressionVisitor.dispatchSpecificExpression(rangeCstNode);

          if (!iteratorAstNode || !rangeAstNode) {
            this.errorHandler.logError(
              'Failed to visit iterator or range AST node from for_assignment.',
              'ForLoopVisitor.visitForStatement: visit_failed_iterator_range_for_assignment',
              child
            );
            continue; 
          }

          if (isAstVariableNode(iteratorAstNode)) {
            loopVariablesAst.push(iteratorAstNode);
          } else {
            this.errorHandler.logError(
              `Expected variable for loop variable, but got ${iteratorAstNode.type}.`,
              'ForLoopVisitor.visitForStatement: non_variable_iterator_for_assignment',
              iteratorCstNode
            );
            // Push an error node as a placeholder or return an error for the whole statement
            loopVariablesAst.push(createErrorNodeInternal(iteratorCstNode, `Expected variable, got ${iteratorAstNode.type}`, 'E_FOR_INVALID_ITERATOR_TYPE', iteratorAstNode.type, iteratorCstNode.text));
          }

          if (isAstExpressionNode(rangeAstNode)) {
            loopRangesAst.push(rangeAstNode);
          } else {
            this.errorHandler.logError(
              `Expected expression for loop range, but got ${rangeAstNode.type}.`,
              'ForLoopVisitor.visitForStatement: non_expression_range_for_assignment',
              rangeCstNode
            );
            loopRangesAst.push(createErrorNodeInternal(rangeCstNode, `Expected expression, got ${rangeAstNode.type}`, 'E_FOR_INVALID_RANGE_TYPE', rangeAstNode.type, rangeCstNode.text));
          }
        }
      }
    } else {
      this.errorHandler.logInfo(
        `[ForLoopVisitor.visitForStatement] No for_assignment CST nodes found, checking for single direct assignment (e.g., for(i=range)).`,
        'ForLoopVisitor.visitForStatement: checking_direct_assignment',
        node
      );
      const iteratorCstNode = node.childForFieldName('iterator');
      const rangeCstNode = node.childForFieldName('range');
      
      // If bodyCstNode is still not identified, try 'body' field or last child again, specific to single assignment structure
      if (!bodyCstNode) {
        const directBodyCstNode = node.childForFieldName('body');
        if (directBodyCstNode) {
            bodyCstNode = directBodyCstNode;
        } else if (node.lastNamedChild && node.lastNamedChild !== iteratorCstNode && node.lastNamedChild !== rangeCstNode) {
            // If 'body' field doesn't exist, and lastNamedChild is not iterator/range, it's likely the body
            bodyCstNode = node.lastNamedChild;
        }
      }

      if (!iteratorCstNode || !rangeCstNode) {
        this.errorHandler.logError(
          `Direct assignment in for_statement is missing iterator or range. Iterator: ${iteratorCstNode?.text}, Range: ${rangeCstNode?.text}`,
          'ForLoopVisitor.visitForStatement: direct_assign_missing_iterator_range',
          node
        );
        return createErrorNodeInternal(node, 'Direct assignment in for_statement is missing iterator or range.', 'E_FOR_DIRECT_ASSIGN_MISSING_PARTS', node.type, node.text);
      }

      const iteratorAstNode = this.expressionVisitor.dispatchSpecificExpression(iteratorCstNode);
      const rangeAstNode = this.expressionVisitor.dispatchSpecificExpression(rangeCstNode);

      if (!iteratorAstNode) {
        this.errorHandler.logError('Failed to visit iterator AST node for direct assignment.', 'ForLoopVisitor.visitForStatement: visit_failed_iterator_direct_assign', iteratorCstNode);
        return createErrorNodeInternal(iteratorCstNode, 'Failed to visit iterator AST node.', 'E_FOR_VISIT_FAIL_ITERATOR', iteratorCstNode?.type, iteratorCstNode?.text);
      }
      if (!rangeAstNode) {
        this.errorHandler.logError('Failed to visit range AST node for direct assignment.', 'ForLoopVisitor.visitForStatement: visit_failed_range_direct_assign', rangeCstNode);
        return createErrorNodeInternal(rangeCstNode, 'Failed to visit range AST node.', 'E_FOR_VISIT_FAIL_RANGE', rangeCstNode?.type, rangeCstNode?.text);
      }

      if (isAstVariableNode(iteratorAstNode)) {
        loopVariablesAst.push(iteratorAstNode);
      } else {
        this.errorHandler.logError(`Expected variable for loop variable (direct assign), got ${iteratorAstNode.type}.`, 'ForLoopVisitor.visitForStatement: non_variable_iterator_direct_assign', iteratorCstNode);
        return createErrorNodeInternal(iteratorCstNode, `Expected variable, got ${iteratorAstNode.type}`, 'E_FOR_INVALID_ITERATOR_TYPE', iteratorAstNode.type, iteratorCstNode?.text);
      }

      if (isAstExpressionNode(rangeAstNode)) {
        loopRangesAst.push(rangeAstNode);
      } else {
        this.errorHandler.logError(`Expected expression for loop range (direct assign), got ${rangeAstNode.type}.`, 'ForLoopVisitor.visitForStatement: non_expression_range_direct_assign', rangeCstNode);
        return createErrorNodeInternal(rangeCstNode, `Expected expression, got ${rangeAstNode.type}`, 'E_FOR_INVALID_RANGE_TYPE', rangeAstNode.type, rangeCstNode?.text);
      }
    }

    if (loopVariablesAst.length === 0) {
      this.errorHandler.logError(`No valid loop assignments found in for_statement. CST Node: ${node.text}`, 'ForLoopVisitor.visitForStatement: no_valid_assignments_found', node);
      return createErrorNodeInternal(node, 'No assignments in for_statement', 'E_FOR_NO_ASSIGNMENTS', node.type, node.text);
    }

    let bodyAstNodes: ast.StatementNode[] = [];
    if (bodyCstNode) {
      // Process body statements using a simple approach to avoid circular dependencies
      if (bodyCstNode.type === 'block') {
        // For block nodes, process each child statement
        const visitedBodyAstNodes = this.processBlockStatements(bodyCstNode);
        if (visitedBodyAstNodes && visitedBodyAstNodes.length > 0) {
          bodyAstNodes = visitedBodyAstNodes.flatMap(stmt => stmt && stmt.type !== 'error' ? [stmt as ast.StatementNode] : []);
          const bodyErrors = visitedBodyAstNodes.filter(stmt => stmt?.type === 'error');
          if (bodyErrors.length > 0) {
            this.errorHandler.logWarning(`Found ${bodyErrors.length} error(s) in for loop body.`, 'ForLoopVisitor.visitForStatement: errors_in_body', bodyCstNode);
          }
        } else {
          this.errorHandler.logWarning('For loop body visitation returned empty or null.', 'ForLoopVisitor.visitForStatement: body_visit_returned_empty', bodyCstNode);
          bodyAstNodes = [];
        }
      } else {
        // For single statement nodes, process directly
        const visitedBodyAstNode = this.processStatement(bodyCstNode);
        if (visitedBodyAstNode) {
          if (visitedBodyAstNode.type !== 'error') {
            bodyAstNodes = [visitedBodyAstNode as ast.StatementNode];
          } else {
            this.errorHandler.logWarning('For loop body statement resulted in an error.', 'ForLoopVisitor.visitForStatement: body_statement_error', bodyCstNode);
            bodyAstNodes = [];
          }
        } else {
          this.errorHandler.logWarning('For loop body statement visitation returned null.', 'ForLoopVisitor.visitForStatement: body_statement_null', bodyCstNode);
          bodyAstNodes = [];
        }
      }
    } else {
      this.errorHandler.logWarning('No body CST node found for for_statement. Assuming empty body.', 'ForLoopVisitor.visitForStatement: no_body_found_assuming_empty', node);
      bodyAstNodes = []; // Empty body is valid
    }

    if (loopVariablesAst.length !== loopRangesAst.length) {
      this.errorHandler.logError(`Internal parsing error: Mismatch between parsed loop variables (${loopVariablesAst.length}) and ranges (${loopRangesAst.length}).`, 'ForLoopVisitor.visitForStatement: variable_range_mismatch', node);
      return createErrorNodeInternal(node, 'Internal error: Mismatch in parsed loop variables and ranges.', 'E_FOR_INTERNAL_VAR_RANGE_MISMATCH');
    }

    const finalLoopAssignments: ast.ForLoopVariable[] = [];
    for (let i = 0; i < loopVariablesAst.length; i++) {
        const variableNode = loopVariablesAst[i];
        const rangeNode = loopRangesAst[i];

        // Explicitly handle potential undefined, though theoretically covered by loop condition and prior checks
        if (typeof variableNode === 'undefined' || typeof rangeNode === 'undefined') {
            this.errorHandler.logError(
                `Internal error: Undefined variable or range encountered at index ${i} during final assembly. Variables: ${loopVariablesAst.length}, Ranges: ${loopRangesAst.length}`,
                'ForLoopVisitor.visitForStatement: undefined_in_final_assembly_loop',
                node
            );
            return createErrorNodeInternal(node, `Internal error: undefined variable/range at index ${i}`, 'E_FOR_INTERNAL_UNDEFINED_FINAL_ASSEMBLY');
        }

        if (variableNode.type === 'error') {
            this.errorHandler.logError('Encountered pre-existing error node for a loop variable.', 'ForLoopVisitor.visitForStatement: error_node_as_variable', node);
            return variableNode; // variableNode is already an ErrorNode
        }
        // At this point, variableNode is guaranteed to be VariableNode

        if (rangeNode.type === 'error') {
            this.errorHandler.logError('Encountered pre-existing error node for a loop range.', 'ForLoopVisitor.visitForStatement: error_node_as_range', node);
            return rangeNode; // rangeNode is already an ErrorNode
        }
        // At this point, rangeNode is guaranteed to be ExpressionNode

        // Now, variableNode is VariableNode and rangeNode is ExpressionNode, matching ast.ForLoopVariable
        // Extract the variable name from the VariableNode
        const variableName = variableNode.name;

        // Extract step from range expression if it exists
        let stepNode: ast.ExpressionNode | ast.ErrorNode | undefined = undefined;
        if (rangeNode.type === 'expression' && rangeNode.expressionType === 'range_expression') {
          const rangeExprNode = rangeNode as ast.RangeExpressionNode;
          if (rangeExprNode.step) {
            stepNode = rangeExprNode.step;
          }
        }

        finalLoopAssignments.push({
          variable: variableName,
          range: rangeNode,
          ...(stepNode && { step: stepNode })
        });
    }

    this.errorHandler.logInfo(`[ForLoopVisitor.visitForStatement] Successfully parsed for_statement. Assignments: ${finalLoopAssignments.length}, Body statements: ${bodyAstNodes.length}`, 'ForLoopVisitor.visitForStatement: success', node);
    return {
      type: 'for_loop',
      variables: finalLoopAssignments,
      body: bodyAstNodes,
      location: getLocation(node),
    };
  }

  /**
   * Process statements in a block node for for loop bodies
   * @param blockNode The block CST node
   * @returns Array of AST statement nodes
   */
  private processBlockStatements(blockNode: TSNode): ast.ASTNode[] {
    const statements: ast.ASTNode[] = [];

    for (let i = 0; i < blockNode.namedChildCount; i++) {
      const child = blockNode.namedChild(i);
      if (child) {
        const statement = this.processStatement(child);
        if (statement) {
          statements.push(statement);
        }
      }
    }

    return statements;
  }

  /**
   * Process a single statement node for for loop bodies
   * @param statementNode The statement CST node
   * @returns AST statement node or null
   */
  private processStatement(statementNode: TSNode): ast.ASTNode | null {
    // Handle different types of statements that can appear in for loop bodies
    switch (statementNode.type) {
      case 'statement':
        // Unwrap statement nodes and process their children
        if (statementNode.namedChildCount > 0) {
          const child = statementNode.namedChild(0);
          if (child) {
            return this.processStatement(child);
          }
        }
        return null;

      case 'module_instantiation':
        // Create a simple module instantiation node for testing
        // In a real implementation, this would use proper argument extraction
        const nameNode = statementNode.childForFieldName('name');
        const functionName = nameNode ? nameNode.text : 'unknown';

        return {
          type: 'module_instantiation',
          name: functionName,
          args: [], // Simplified for now
          children: [], // Simplified for now
          location: getLocation(statementNode),
        } as ast.ModuleInstantiationNode;

      default:
        // For other statement types, create a placeholder
        this.errorHandler.logWarning(
          `Unhandled statement type in for loop body: ${statementNode.type}`,
          'ForLoopVisitor.processStatement: unhandled_statement_type',
          statementNode
        );
        return {
          type: 'expression',
          expressionType: 'literal',
          value: `unhandled_${statementNode.type}`,
          location: getLocation(statementNode),
        } as ast.LiteralNode;
    }
  }

  override createASTNodeForFunction( node: TSNode, functionName: string, args: ast.Parameter[] ): ast.ASTNode | null {
    this.errorHandler.logError(
      `[ForLoopVisitor.createASTNodeForFunction] This method should not be called directly on ForLoopVisitor. Function: ${functionName}`,
      'ForLoopVisitor.createASTNodeForFunction: unexpected_call',
      node
    );
    return createErrorNodeInternal(
      node,
      `ForLoopVisitor does not directly create function call AST nodes for '${functionName}'.`,
      'E_VISITOR_METHOD_MISUSE',
      node.type,
      node.text
    );
  }

  createForNode(node: TSNode, args: ast.Parameter[]): ast.ForLoopNode | ast.ErrorNode | null {
    this.errorHandler.logInfo(
      `[ForLoopVisitor.createForNode] Creating for node with ${args.length} arguments`,
      'ForLoopVisitor.createForNode',
      node
    );
    const variables: ast.ForLoopVariable[] = [];

    if (args.length === 0) {
      this.errorHandler.logWarning('createForNode called with no arguments.', 'ForLoopVisitor.createForNode: no_arguments', node);
      return null;
    }

    for (const arg of args) {
      if (!arg.name) {
        this.errorHandler.logWarning('Argument missing name in createForNode.', 'ForLoopVisitor.createForNode: arg_missing_name', node);
        continue;
      }

      let rangeNode: ast.ExpressionNode | ast.ErrorNode;
      let variableNode: ast.VariableNode | ast.ErrorNode;

      // Process argument name (variable)
      if (typeof arg.name === 'string') {
        this.errorHandler.logWarning(`Parameter name '${arg.name}' is a string in createForNode. Creating synthetic VariableNode.`, 'ForLoopVisitor.createForNode: synthetic_variable_from_string_name', node);
        variableNode = { type: 'expression', expressionType: 'variable', name: arg.name, location: getLocation(node) };
      } else if (isAstVariableNode(arg.name)) {
        variableNode = arg.name;
      } else {
        const argNameType = arg.name && typeof arg.name === 'object' ? (arg.name as ast.VariableNode).type : typeof arg.name;
        this.errorHandler.logError(`Parameter name for for-loop variable is not a VariableNode. Type: ${argNameType}`, 'ForLoopVisitor.createForNode: invalid_param_name_type', node);
        variableNode = createErrorNodeInternal(
          typeof arg.name === 'object' && arg.name !== null && 'cstNode' in arg.name && (arg.name as any).cstNode ? (arg.name as any).cstNode : node, // Try to get more specific CST node
          `Invalid parameter name type: ${argNameType}`,
          'E_INVALID_PARAM_NAME_TYPE',
          String(argNameType) // Ensure argNameType is a string for the error node
        );
      }

      // Process argument value (range)
      if (typeof arg.value === 'object' && arg.value !== null && 'type' in arg.value) {
        const astValueNode = arg.value as ast.ASTNode;
        if (isAstExpressionNode(astValueNode)) {
          rangeNode = astValueNode;
        } else if (astValueNode.type === 'error') {
            rangeNode = astValueNode as ast.ErrorNode;
        } else {
          const unknownTypeString = typeof (astValueNode as any)?.type === 'string' ? (astValueNode as any).type : 'unknown ASTNode subtype';
          const varNameForLog1 = isAstVariableNode(variableNode) ? variableNode.name : 'unknown_or_error_variable';
          this.errorHandler.logError(`Unexpected ASTNode type for argument '${varNameForLog1}' value: ${unknownTypeString}`, 'ForLoopVisitor.createForNode: unexpected_arg_value_type', node);
          rangeNode = createErrorNodeInternal(node, `Unexpected ASTNode type for argument value: ${unknownTypeString}`, 'E_UNEXPECTED_ARG_TYPE', unknownTypeString);
        }
      } else if (typeof arg.value === 'string' || typeof arg.value === 'number' || typeof arg.value === 'boolean') {
        const varNameForLog2 = isAstVariableNode(variableNode) ? variableNode.name : 'unknown_or_error_variable';
        this.errorHandler.logWarning(`Primitive value for argument '${varNameForLog2}' in createForNode requires stubbed literal creation.`, 'ForLoopVisitor.createForNode: stubbed_numeric_literal_primitive', node);
        rangeNode = createErrorNodeInternal(node, `Parsing for primitive literal '${arg.value}' is stubbed.`, 'E_STUBBED_NUMERIC_LITERAL');
      } else if (Array.isArray(arg.value) && arg.value.every(item => typeof item === 'number')) {
        const varNameForLog3 = isAstVariableNode(variableNode) ? variableNode.name : 'unknown_or_error_variable';
        this.errorHandler.logWarning(`Vector value for argument '${varNameForLog3}' in createForNode requires stubbed literal creation.`, 'ForLoopVisitor.createForNode: stubbed_numeric_literal_vector', node);
        rangeNode = createErrorNodeInternal(node, `Parsing for vector literal '[${arg.value.join(', ')}]' is stubbed.`, 'E_STUBBED_NUMERIC_LITERAL_VECTOR');
      } else {
        const varNameForLog4 = isAstVariableNode(variableNode) ? variableNode.name : 'unknown_or_error_variable';
        this.errorHandler.logError(`Unhandled type for argument '${varNameForLog4}' value: ${typeof arg.value}`, 'ForLoopVisitor.createForNode: unhandled_arg_value_type', node);
        rangeNode = createErrorNodeInternal(node, `Unhandled argument value type: ${typeof arg.value}`, 'E_UNHANDLED_ARG_VALUE_TYPE', typeof arg.value);
      }

      if (variableNode.type === 'error') {
        this.errorHandler.logError('Skipping assignment due to error in variable.', 'ForLoopVisitor.createForNode: error_in_variable_skip_push', node);
        // Optionally, add this error variable to a list of errors for this for_loop creation attempt
      } else if (rangeNode.type === 'error') {
        this.errorHandler.logError('Skipping assignment due to error in range.', 'ForLoopVisitor.createForNode: error_in_range_skip_push', node);
        // Optionally, add this error range to a list of errors
      } else {
        // Both variableNode and rangeNode are valid (VariableNode and ExpressionNode respectively)
        // Extract the variable name from the VariableNode
        const variableName = variableNode.name;

        // Extract step from range expression if it exists
        let stepNode: ast.ExpressionNode | ast.ErrorNode | undefined = undefined;
        if (rangeNode.type === 'expression' && rangeNode.expressionType === 'range_expression') {
          const rangeExprNode = rangeNode as ast.RangeExpressionNode;
          if (rangeExprNode.step) {
            stepNode = rangeExprNode.step;
          }
        }

        variables.push({
          variable: variableName,
          range: rangeNode,
          ...(stepNode && { step: stepNode })
        });
      }
    }

    if (variables.some(v => v.range.type === 'error')) {
        this.errorHandler.logError('One or more assignments in createForNode resulted in an error.', 'ForLoopVisitor.createForNode: error_in_assignments', node);
        // Return the first error encountered in the range
        const firstErrorRange = variables.find(v => v.range.type === 'error');
        if (firstErrorRange) return firstErrorRange.range as unknown as ast.ErrorNode;
        // Fallback if error type isn't directly on variable/range but implies failure
        return createErrorNodeInternal(node, 'Failed to process arguments for createForNode due to internal errors.', 'E_FOR_CREATE_NODE_ARG_PROCESSING');
    }

    if (variables.length === 0) {
      this.errorHandler.logError('No valid variables could be processed by createForNode.', 'ForLoopVisitor.createForNode: no_variables_processed', node);
      return null;
    }

    return {
      type: 'for_loop',
      variables,
      body: [], // Placeholder body, as this method is for specific AST constructions
      location: getLocation(node),
    };
  }
}
