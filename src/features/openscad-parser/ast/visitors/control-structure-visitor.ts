/**
 * @file control-structure-visitor.ts
 * @description This file implements the `ControlStructureVisitor` class, which specializes in processing
 * OpenSCAD control structures and converting them to structured AST representations.
 * Control structures are fundamental to OpenSCAD's programming model, enabling conditional
 * logic, iteration, and variable scoping.
 *
 * @architectural_decision
 * The `ControlStructureVisitor` is a specialized visitor that handles control flow statements
 * like `if`, `for`, and `let`. It delegates the processing of complex control structures
 * to dedicated sub-visitors (`IfElseVisitor`, `ForLoopVisitor`), promoting a clean separation
 * of concerns. This approach allows the main visitor to focus on identifying control structures,
 * while the sub-visitors handle the specific logic for each type. This makes the codebase
 * more modular, easier to test, and more maintainable.
 *
 * @example
 * ```typescript
 * import { ControlStructureVisitor } from './control-structure-visitor';
 * import { ErrorHandler } from '../../error-handling';
 * import { Parser, Language } from 'web-tree-sitter';
 *
 * async function main() {
 *   // 1. Setup parser and get CST
 *   await Parser.init();
 *   const parser = new Parser();
 *   const openscadLanguage = await Language.load('tree-sitter-openscad.wasm');
 *   parser.setLanguage(openscadLanguage);
 *   const sourceCode = 'if (x > 10) { cube(10); } else { sphere(5); }';
 *   const tree = parser.parse(sourceCode);
 *
 *   // 2. Create an error handler and visitor
 *   const errorHandler = new ErrorHandler();
 *   const controlStructureVisitor = new ControlStructureVisitor(sourceCode, errorHandler);
 *
 *   // 3. Visit the if_statement node
 *   const ifStatementNode = tree.rootNode.firstChild!;
 *   const astNode = controlStructureVisitor.visitIfStatement(ifStatementNode);
 *
 *   // 4. Log the result
 *   console.log(JSON.stringify(astNode, null, 2));
 *   // Expected output:
 *   // {
 *   //   "type": "if",
 *   //   "condition": { ... },
 *   //   "thenBranch": { ... },
 *   //   "elseBranch": { ... }
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
 * The `ControlStructureVisitor` is a key part of the `CompositeVisitor`'s collection of visitors.
 * It is responsible for identifying and processing all control flow statements from the CST.
 * When it encounters a control structure, it delegates to the appropriate sub-visitor to generate
 * the corresponding AST node (e.g., `IfNode`, `ForLoopNode`), which is then included in the final AST.
 */

import type { Node as TSNode } from 'web-tree-sitter';
import type { ErrorHandler } from '../../error-handling/index.js'; // Added ErrorHandler import
import type * as ast from '../ast-types.js';
import { extractArguments } from '../extractors/argument-extractor.js';
import { getLocation } from '../utils/location-utils.js';
import type { ASTVisitor } from './ast-visitor.js';
import { BaseASTVisitor } from './base-ast-visitor.js';
import { ForLoopVisitor } from './control-structure-visitor/for-loop-visitor.js';
import { IfElseVisitor } from './control-structure-visitor/if-else-visitor.js';
import { ExpressionVisitor } from './expression-visitor.js';

/**
 * @class ControlStructureVisitor
 * @extends {BaseASTVisitor}
 * @description Visitor for processing OpenSCAD control structures with specialized sub-visitors.
 */
export class ControlStructureVisitor extends BaseASTVisitor {
  private ifElseVisitor: IfElseVisitor;
  private forLoopVisitor: ForLoopVisitor;
  private expressionVisitor: ExpressionVisitor;
  private compositeVisitor: ASTVisitor | undefined;

  /**
   * @constructor
   * @description Creates a new `ControlStructureVisitor`.
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
    // These sub-visitors will also need ErrorHandler in their constructors eventually
    this.ifElseVisitor = new IfElseVisitor(source, errorHandler, this.variableScope ?? new Map());
    this.forLoopVisitor = new ForLoopVisitor(source, errorHandler, this.variableScope ?? new Map());
    this.expressionVisitor = new ExpressionVisitor(
      source,
      errorHandler,
      this.variableScope ?? new Map()
    );
  }

  /**
   * @method setCompositeVisitor
   * @description Sets the composite visitor for delegating child node processing.
   * This is needed to resolve circular dependency issues during visitor creation.
   * @param {ASTVisitor} compositeVisitor - The composite visitor instance.
   */
  setCompositeVisitor(compositeVisitor: ASTVisitor): void {
    this.compositeVisitor = compositeVisitor;
    // Pass the composite visitor to sub-visitors that need it
    this.ifElseVisitor.setCompositeVisitor(compositeVisitor);
    this.forLoopVisitor.setCompositeVisitor(compositeVisitor);
  }

  /**
   * @method visitModuleInstantiation
   * @description Overrides the base `visitModuleInstantiation` to only handle control structure modules.
   * @param {TSNode} _node - The module instantiation node to visit.
   * @returns {null} Always returns null, as module instantiations are not control structures.
   * @override
   */
  override visitModuleInstantiation(_node: TSNode): ast.ASTNode | null {
    // ControlStructureVisitor only handles control structures (if, for, let, each)
    // Module instantiations are not control structures, so return null
    // to let other visitors handle module instantiations
    return null;
  }

  /**
   * @method visitStatement
   * @description Overrides the base `visitStatement` to only handle control structure statements.
   * @param {TSNode} node - The statement node to visit.
   * @returns {ast.ASTNode | null} The control structure AST node, or null if this is not a control structure statement.
   * @override
   */
  override visitStatement(node: TSNode): ast.ASTNode | null {
    // Only handle statements that directly contain control structure nodes as immediate children
    // Check for if_statement, for_statement, let_expression, each_statement

    // First, check if this statement has exactly one child that is a control structure
    if (node.namedChildCount === 1) {
      const child = node.namedChild(0);
      if (!child) return null;

      if (child.type === 'if_statement') {
        return this.visitIfStatement(child);
      }

      if (child.type === 'for_statement') {
        return this.visitForStatement(child);
      }

      if (child.type === 'let_expression') {
        return this.visitLetExpression(child);
      }

      if (child.type === 'each_statement') {
        return this.visitEachStatement(child);
      }
    }

    // Return null for all other statement types to let specialized visitors handle them
    return null;
  }

  /**
   * @method visitIfStatement
   * @description Visits an if statement node.
   * @param {TSNode} node - The if statement node to visit.
   * @returns {ast.IfNode | null} The if AST node, or null if the node cannot be processed.
   * @override
   */
  override visitIfStatement(node: TSNode): ast.IfNode | null {
    // Delegate to the specialized IfElseVisitor
    return this.ifElseVisitor.visitIfStatement(node);
  }

  /**
   * @method visitForStatement
   * @description Visits a for statement node.
   * @param {TSNode} node - The for statement node to visit.
   * @returns {ast.ForLoopNode | ast.ErrorNode | null} The for loop AST node, an error node, or null if the node cannot be processed.
   * @override
   */
  override visitForStatement(node: TSNode): ast.ForLoopNode | ast.ErrorNode | null {
    // Delegate to the specialized ForLoopVisitor
    return this.forLoopVisitor.visitForStatement(node);
  }

  /**
   * @method visitLetExpression
   * @description Visits a let expression node.
   * @param {TSNode} node - The let expression node to visit.
   * @returns {ast.LetNode | null} The let AST node, or null if the node cannot be processed.
   * @override
   */
  override visitLetExpression(node: TSNode): ast.LetNode | null {
    // Extract assignments
    const argumentsNode = node.childForFieldName('arguments');
    if (!argumentsNode) {
      return null;
    }

    // Extract assignments from the arguments
    const assignments: { [key: string]: ast.ParameterValue } = {};

    // In OpenSCAD, let expressions can have multiple assignments
    // For example: let(a = 10, b = 20)
    const args = extractArguments(argumentsNode);

    for (const arg of args) {
      if (arg.name) {
        assignments[arg.name] = arg.value;
      }
    }

    // Extract body
    const bodyNode = node.childForFieldName('body');
    if (!bodyNode) {
      return null;
    }

    const body = this.visitBlock(bodyNode);

    return {
      type: 'let',
      assignments,
      body,
      location: getLocation(node),
    };
  }

  /**
   * @method visitEachStatement
   * @description Visits an each statement node.
   * @param {TSNode} node - The each statement node to visit.
   * @returns {ast.EachNode | null} The each AST node, or null if the node cannot be processed.
   */
  visitEachStatement(node: TSNode): ast.EachNode | null {
    // TODO: Use ast.EachNode when TS recognizes it
    // Extract expression
    const expressionNode = node.childForFieldName('expression');
    if (!expressionNode) {
      return null;
    }

    // Create a simple expression node
    // In a real implementation, this would use an expression visitor
    const expression: ast.ExpressionNode = {
      type: 'expression',
      expressionType: 'literal',
      value: expressionNode.text,
      location: getLocation(expressionNode),
    };

    return {
      type: 'each',
      expression,
      location: getLocation(node),
    };
  }

  /**
   * @method createASTNodeForFunction
   * @description Creates an AST node for a function call.
   * @param {TSNode} node - The node containing the function call.
   * @param {string} functionName - The name of the function.
   * @param {ast.Parameter[]} args - The arguments to the function.
   * @returns {ast.ASTNode | null} The AST node, or null if the function is not supported.
   * @protected
   */
  protected createASTNodeForFunction(
    node: TSNode,
    functionName: string,
    args: ast.Parameter[]
  ): ast.ASTNode | null {
    // Handle control structure functions
    switch (functionName.trim()) {
      case 'if':
        return this.ifElseVisitor.createIfNode(node, args);
      case 'for':
        return this.forLoopVisitor.createForNode(node, args);
      case 'let':
        return this.createLetNode(node, args);
      case 'each':
        return this.createEachNode(node, args);
      default:
        return null;
    }
  }

  /**
   * @method createLetNode
   * @description Creates a let node.
   * @param {TSNode} node - The node containing the let expression.
   * @param {ast.Parameter[]} args - The arguments to the let expression.
   * @returns {ast.LetNode | null} The let AST node, or null if the arguments are invalid.
   * @private
   */
  private createLetNode(node: TSNode, args: ast.Parameter[]): ast.LetNode | null {
    // Extract assignments from the arguments
    const assignments: { [key: string]: ast.ParameterValue } = {};

    for (const arg of args) {
      if (arg.name) {
        assignments[arg.name] = arg.value;
      }
    }

    // For testing purposes, create an empty body
    return {
      type: 'let',
      assignments,
      body: [],
      location: getLocation(node),
    };
  }

  /**
   * @method createEachNode
   * @description Creates an each node.
   * @param {TSNode} node - The node containing the each statement.
   * @param {ast.Parameter[]} args - The arguments to the each statement.
   * @returns {ast.EachNode | null} The each AST node, or null if the arguments are invalid.
   * @private
   */
  private createEachNode(node: TSNode, args: ast.Parameter[]): ast.EachNode | null {
    // TODO: Use ast.EachNode when TS recognizes it
    // Each should have exactly one argument (the expression)
    if (args.length !== 1) {
      return null;
    }

    // Create a simple expression node
    const firstArg = args[0];
    if (!firstArg) {
      return null;
    }

    const argValue = firstArg.value;
    let expressionValue: string | number | boolean;

    if (
      typeof argValue === 'object' &&
      argValue !== null &&
      !Array.isArray(argValue) &&
      'type' in argValue &&
      argValue.type === 'expression' &&
      'value' in argValue &&
      (typeof argValue.value === 'string' ||
        typeof argValue.value === 'number' ||
        typeof argValue.value === 'boolean')
    ) {
      // Use the expression's value directly if it's a valid type
      expressionValue = argValue.value;
    } else if (
      typeof argValue === 'string' ||
      typeof argValue === 'number' ||
      typeof argValue === 'boolean'
    ) {
      // Use the primitive value directly
      expressionValue = argValue;
    } else {
      // Fallback to string representation
      expressionValue = JSON.stringify(argValue);
    }

    const expression: ast.ExpressionNode = {
      type: 'expression',
      expressionType: 'literal',
      value: expressionValue,
      location: getLocation(node),
    };

    return {
      type: 'each',
      expression,
      location: getLocation(node),
    };
  }
}
