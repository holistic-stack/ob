/**
 * @file variable-visitor.ts
 * @description This file implements the `VariableVisitor` class, which specializes in processing
 * OpenSCAD variable references and identifier nodes, converting them to structured
 * AST representations. Variables are fundamental to OpenSCAD's programming model,
 * enabling data storage, parameter passing, and dynamic value computation.
 *
 * @architectural_decision
 * The `VariableVisitor` is a focused visitor responsible for handling identifiers that represent
 * variable references. It is a simple but crucial part of the parsing pipeline, as it ensures
 * that variable names are correctly extracted and represented in the AST. This visitor does not
 * handle variable assignments; that is the responsibility of the `AssignStatementVisitor`.
 * This separation of concerns keeps the `VariableVisitor` simple and focused on its core task.
 *
 * @example
 * ```typescript
 * import { VariableVisitor } from './variable-visitor';
 * import { ErrorHandler } from '../../error-handling';
 * import { Parser, Language } from 'web-tree-sitter';
 *
 * async function main() {
 *   // 1. Setup parser and get CST
 *   await Parser.init();
 *   const parser = new Parser();
 *   const openscadLanguage = await Language.load('tree-sitter-openscad.wasm');
 *   parser.setLanguage(openscadLanguage);
 *   const sourceCode = 'my_variable = 10;';
 *   const tree = parser.parse(sourceCode);
 *
 *   // 2. Create an error handler and visitor
 *   const errorHandler = new ErrorHandler();
 *   const variableVisitor = new VariableVisitor(sourceCode, errorHandler, new Map());
 *
 *   // 3. Visit the identifier node
 *   const assignmentNode = tree.rootNode.firstChild!;
 *   const identifierNode = assignmentNode.childForFieldName('name')!;
 *   const astNode = variableVisitor.visitIdentifier(identifierNode);
 *
 *   // 4. Log the result
 *   console.log(JSON.stringify(astNode, null, 2));
 *   // Expected output:
 *   // {
 *   //   "type": "variable",
 *   //   "name": "my_variable",
 *   //   ...
 *   // }
 *
 *   // 5. Clean up
 *   parser.delete();
 * }
 *
 * main();
 * ```
 *
 * @integration
 * The `VariableVisitor` is used by the `CompositeVisitor` to process identifier nodes that are
 * determined to be variable references. It returns a `VariableNode`, which is then used in
 * various expression contexts (e.g., as an operand in a binary expression, or as a parameter
 * to a function call).
 */

import type { Node as TSNode } from 'web-tree-sitter';
import type { ErrorHandler } from '../../error-handling/index.js';
import type * as ast from '../ast-types.js';
import { getLocation } from '../utils/location-utils.js';
import { findDescendantOfType } from '../utils/node-utils.js';
import { BaseASTVisitor } from './base-ast-visitor.js';

/**
 * @class VariableVisitor
 * @extends {BaseASTVisitor}
 * @description Visitor for processing OpenSCAD variable references and identifiers.
 */
export class VariableVisitor extends BaseASTVisitor {
  /**
   * @constructor
   * @description Creates a new `VariableVisitor`.
   * @param {string} source - The source code being parsed.
   * @param {ErrorHandler} errorHandler - The error handler instance.
   * @param {Map<string, ast.ParameterValue>} [variableScope] - The current variable scope.
   */
  constructor(
    source: string,
    protected override errorHandler: ErrorHandler,
    variableScope?: Map<string, ast.ParameterValue>
  ) {
    super(source, errorHandler, variableScope ?? new Map());
  }

  /**
   * @method visitStatement
   * @description Overrides the base `visitStatement` to only handle variable-related statements.
   * @param {TSNode} node - The statement node to visit.
   * @returns {ast.ASTNode | null} The variable AST node, or null if this is not a variable statement.
   * @override
   */
  override visitStatement(node: TSNode): ast.ASTNode | null {
    // Only handle statements that contain variable assignments or references
    // Check for assignment_statement with variable assignments
    const assignmentStatement = findDescendantOfType(node, 'assignment_statement');
    if (assignmentStatement) {
      // Assignment statements are handled by AssignStatementVisitor, not VariableVisitor
      return null;
    }

    // Check for variable_statement (if such a node type exists in the grammar)
    const variableStatement = findDescendantOfType(node, 'variable_statement');
    if (variableStatement) {
      // Process variable statement
      const identifier = findDescendantOfType(variableStatement, 'identifier');
      if (identifier) {
        return this.visitIdentifier(identifier);
      }
    }

    // Return null for all other statement types to let specialized visitors handle them
    return null;
  }

  /**
   * @method createVariableNode
   * @description Creates a variable node from a variable node in the CST.
   * @param {TSNode} node - The variable node from the CST.
   * @returns {ast.VariableNode | null} A variable node for the AST.
   * @private
   */
  createVariableNode(node: TSNode): ast.VariableNode | null {
    this.safeLog(
      'info',
      `[VariableVisitor.createVariableNode] Processing variable node: ${node.text}`,
      'VariableVisitor.createVariableNode',
      node
    );

    try {
      // Extract the variable name from the identifier node
      const identifierNode = findDescendantOfType(node, 'identifier');
      if (!identifierNode) {
        this.safeLog(
          'warning',
          `[VariableVisitor.createVariableNode] No identifier found in variable node: ${node.text}`,
          'VariableVisitor.createVariableNode',
          node
        );
        return null;
      }

      // Create the variable node
      return {
        type: 'variable',
        name: identifierNode.text,
        location: getLocation(node),
      };
    } catch (error) {
      this.errorHandler.handleError(
        error instanceof Error ? error : new Error(String(error)),
        'VariableVisitor.createVariableNode',
        node
      );
      return null;
    }
  }

  /**
   * @method visitVariable
   * @description Visits a variable node in the CST.
   * @param {TSNode} node - The variable node from the CST.
   * @returns {ast.VariableNode | null} A variable node for the AST.
   * @public
   */
  visitVariable(node: TSNode): ast.VariableNode | null {
    this.safeLog(
      'info',
      `[VariableVisitor.visitVariable] Processing variable: ${node.text}`,
      'VariableVisitor.visitVariable',
      node
    );
    return this.createVariableNode(node);
  }

  /**
   * @method visitIdentifier
   * @description Visits an identifier node in the CST.
   * @param {TSNode} node - The identifier node from the CST.
   * @returns {ast.VariableNode | null} A variable node for the AST.
   * @public
   */
  visitIdentifier(node: TSNode): ast.VariableNode | null {
    this.safeLog(
      'info',
      `[VariableVisitor.visitIdentifier] Processing identifier: ${node.text}`,
      'VariableVisitor.visitIdentifier',
      node
    );

    // Create a variable node directly from the identifier
    return {
      type: 'variable',
      name: node.text,
      location: getLocation(node),
    };
  }

  /**
   * @method safeLog
   * @description A safe logging helper that checks if the error handler exists.
   * @param {'info' | 'debug' | 'warning' | 'error'} level - The log level.
   * @param {string} message - The log message.
   * @param {string} [context] - The context of the log message.
   * @param {TSNode | ast.ASTNode} [node] - The node associated with the log message.
   * @private
   */
  private safeLog(
    level: 'info' | 'debug' | 'warning' | 'error',
    message: string,
    context?: string,
    node?: TSNode | ast.ASTNode
  ): void {
    if (this.errorHandler) {
      // Filter to only pass TSNode to logging methods
      const tsNode =
        node && 'type' in node && typeof node.type === 'string' && 'text' in node
          ? (node as TSNode)
          : undefined;

      switch (level) {
        case 'info':
          this.errorHandler.logInfo(message, context, tsNode);
          break;
        case 'debug':
          this.errorHandler.logDebug(message, context, tsNode);
          break;
        case 'warning':
          this.errorHandler.logWarning(message, context, tsNode);
          break;
        case 'error':
          this.errorHandler.logError(message, context, tsNode);
          break;
      }
    }
  }

  /**
   * @method createASTNodeForFunction
   * @description Creates an AST node for a function (required by `BaseASTVisitor`).
   * @param {TSNode} _node - The function node.
   * @param {string} [_functionName] - The function name.
   * @param {ast.Parameter[]} [_args] - The function arguments.
   * @returns {null} Always returns null, as this visitor does not handle functions.
   * @protected
   */
  createASTNodeForFunction(
    _node: TSNode,
    _functionName?: string,
    _args?: ast.Parameter[]
  ): ast.ASTNode | null {
    // VariableVisitor doesn't handle function definitions or calls
    return null;
  }
}
