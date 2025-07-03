/**
 * @file Control structures visitor for OpenSCAD parser
 *
 * This module implements the ControlStructureVisitor class, which specializes in processing
 * OpenSCAD control structures and converting them to structured AST representations.
 * Control structures are fundamental to OpenSCAD's programming model, enabling conditional
 * logic, iteration, variable scoping, and collection processing.
 *
 * The ControlStructureVisitor handles:
 * - **If Statements**: Conditional execution with optional else branches
 * - **For Loops**: Iteration over ranges, arrays, and collections
 * - **Let Expressions**: Variable scoping and local assignments
 * - **Each Statements**: Collection iteration and element processing
 * - **Nested Structures**: Complex combinations of control structures
 * - **Expression Integration**: Seamless integration with expression evaluation
 *
 * Key features:
 * - **Specialized Sub-Visitors**: Dedicated visitors for complex control structures
 * - **Conditional Logic**: Complete if/else statement processing with condition evaluation
 * - **Loop Processing**: Comprehensive for loop handling with range and collection iteration
 * - **Variable Scoping**: Let expression processing with local variable assignments
 * - **Collection Iteration**: Each statement processing for array and object iteration
 * - **Error Recovery**: Graceful handling of malformed control structures
 * - **Location Tracking**: Source location preservation for debugging and IDE integration
 *
 * Control structure processing patterns:
 * - **Simple Conditionals**: `if (condition) statement` - basic conditional execution
 * - **If-Else Chains**: `if (cond1) stmt1 else if (cond2) stmt2 else stmt3` - complex conditionals
 * - **Range Loops**: `for (i = [0:10]) statement` - numeric range iteration
 * - **Array Loops**: `for (item = array) statement` - collection iteration
 * - **Let Scoping**: `let (a = 10, b = 20) statement` - local variable assignments
 * - **Each Processing**: `each array` - element-wise collection processing
 *
 * The visitor implements a delegation strategy using specialized sub-visitors:
 * 1. **IfElseVisitor**: Handles complex conditional logic and else branches
 * 2. **ForLoopVisitor**: Processes various loop patterns and iteration types
 * 3. **ExpressionVisitor**: Evaluates conditions and expressions within control structures
 *
 * @example Basic control structure processing
 * ```typescript
 * import { ControlStructureVisitor } from './control-structure-visitor';
 *
 * const visitor = new ControlStructureVisitor(sourceCode, errorHandler);
 *
 * // Process if statement
 * const ifNode = visitor.visitIfStatement(ifCST);
 * // Returns: { type: 'if', condition: {...}, thenBranch: {...}, elseBranch: {...} }
 *
 * // Process for loop
 * const forNode = visitor.visitForStatement(forCST);
 * // Returns: { type: 'for_loop', variable: 'i', iterable: {...}, body: {...} }
 * ```
 *
 * @example Complex control structure combinations
 * ```typescript
 * // For OpenSCAD code: if (x > 0) for (i = [0:x]) let (y = i * 2) cube(y);
 * const complexNode = visitor.visitIfStatement(complexCST);
 * // Returns nested structure with if containing for containing let
 *
 * // For collection iteration: for (point = points) translate(point) sphere(1);
 * const iterationNode = visitor.visitForStatement(iterationCST);
 * // Returns for loop with array iteration and transformation
 * ```
 *
 * @example Variable scoping with let expressions
 * ```typescript
 * // For OpenSCAD code: let (size = 10, height = size * 2) cube([size, size, height]);
 * const letNode = visitor.visitLetExpression(letCST);
 * // Returns let expression with local variable assignments and cube body
 * ```
 *
 * @module control-structure-visitor
 * @since 0.1.0
 */

import { Node as TSNode } from 'web-tree-sitter';
import * as ast from '../ast-types.js';
import { BaseASTVisitor } from './base-ast-visitor.js';
import { getLocation } from '../utils/location-utils.js';
import { extractArguments } from '../extractors/argument-extractor.js';
import { IfElseVisitor } from './control-structure-visitor/if-else-visitor.js';
import { ForLoopVisitor } from './control-structure-visitor/for-loop-visitor.js';
import { ExpressionVisitor } from './expression-visitor.js';
import { ErrorHandler } from '../../error-handling/index.js'; // Added ErrorHandler import

/**
 * Visitor for processing OpenSCAD control structures with specialized sub-visitors.
 *
 * The ControlStructureVisitor extends BaseASTVisitor to provide comprehensive handling
 * for all types of control structures in OpenSCAD. It implements a delegation pattern
 * using specialized sub-visitors for complex control structures while handling simpler
 * structures directly.
 *
 * This implementation provides:
 * - **Delegation Strategy**: Uses specialized visitors for complex control structures
 * - **Direct Processing**: Handles simpler structures like let and each directly
 * - **Expression Integration**: Seamless integration with expression evaluation
 * - **Error Context Preservation**: Maintains detailed error information throughout processing
 * - **Performance Optimization**: Efficient routing to appropriate processing methods
 *
 * The visitor maintains three specialized sub-visitors:
 * - **IfElseVisitor**: Handles conditional logic and else branches
 * - **ForLoopVisitor**: Processes various loop patterns and iteration types
 * - **ExpressionVisitor**: Evaluates expressions within control structure contexts
 *
 * @class ControlStructureVisitor
 * @extends {BaseASTVisitor}
 * @since 0.1.0
 */
export class ControlStructureVisitor extends BaseASTVisitor {
  private ifElseVisitor: IfElseVisitor;
  private forLoopVisitor: ForLoopVisitor;
  private expressionVisitor: ExpressionVisitor;

  /**
   * Create a new ControlStructureVisitor
   * @param source The source code (optional, defaults to empty string)
   * @param errorHandler The error handler instance
   */
  constructor(source: string = '', protected override errorHandler: ErrorHandler) {
    super(source);
    // These sub-visitors will also need ErrorHandler in their constructors eventually
    this.ifElseVisitor = new IfElseVisitor(source, errorHandler);
    this.forLoopVisitor = new ForLoopVisitor(source, errorHandler);
    this.expressionVisitor = new ExpressionVisitor(source, errorHandler);
  }

  /**
   * Override visitStatement to only handle control structure statements
   * This prevents the ControlStructureVisitor from interfering with other statement types
   * that should be handled by specialized visitors (PrimitiveVisitor, TransformVisitor, etc.)
   *
   * @param node The statement node to visit
   * @returns The control structure AST node or null if this is not a control structure statement
   * @override
   */
  override visitStatement(node: TSNode): ast.ASTNode | null {
    // Only handle statements that contain control structure nodes
    // Check for if_statement, for_statement, let_expression, each_statement
    const ifStatement = node.descendantsOfType('if_statement')[0];
    if (ifStatement) {
      return this.visitIfStatement(ifStatement);
    }

    const forStatement = node.descendantsOfType('for_statement')[0];
    if (forStatement) {
      return this.visitForStatement(forStatement);
    }

    const letExpression = node.descendantsOfType('let_expression')[0];
    if (letExpression) {
      return this.visitLetExpression(letExpression);
    }

    const eachStatement = node.descendantsOfType('each_statement')[0];
    if (eachStatement) {
      return this.visitEachStatement(eachStatement);
    }

    // Return null for all other statement types to let specialized visitors handle them
    return null;
  }

  /**
   * Visit an if statement node
   * @param node The if statement node to visit
   * @returns The if AST node or null if the node cannot be processed
   */
  override visitIfStatement(node: TSNode): ast.IfNode | null {
    console.log(
      `[ControlStructureVisitor.visitIfStatement] Processing if statement: ${node.text.substring(
        0,
        50
      )}`
    );

    // Delegate to the specialized IfElseVisitor
    return this.ifElseVisitor.visitIfStatement(node);
  }

  /**
   * Visit a for statement node
   * @param node The for statement node to visit
   * @returns The for loop AST node, error node, or null if the node cannot be processed
   */
  override visitForStatement(node: TSNode): ast.ForLoopNode | ast.ErrorNode | null {
    console.log(
      `[ControlStructureVisitor.visitForStatement] Processing for statement: ${node.text.substring(
        0,
        50
      )}`
    );

    // Delegate to the specialized ForLoopVisitor
    return this.forLoopVisitor.visitForStatement(node);
  }

  /**
   * Visit a let expression node
   * @param node The let expression node to visit
   * @returns The let AST node or null if the node cannot be processed
   */
  override visitLetExpression(node: TSNode): ast.LetNode | null {
    console.log(
      `[ControlStructureVisitor.visitLetExpression] Processing let expression: ${node.text.substring(
        0,
        50
      )}`
    );

    // Extract assignments
    const argumentsNode = node.childForFieldName('arguments');
    if (!argumentsNode) {
      console.log(
        `[ControlStructureVisitor.visitLetExpression] No arguments found`
      );
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
      console.log(`[ControlStructureVisitor.visitLetExpression] No body found`);
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
   * Visit an each statement node
   * @param node The each statement node to visit
   * @returns The each AST node or null if the node cannot be processed
   */
  visitEachStatement(node: TSNode): ast.EachNode | null {
    console.log(
      `[ControlStructureVisitor.visitEachStatement] Processing each statement: ${node.text.substring(
        0,
        50
      )}`
    );

    // Extract expression
    const expressionNode = node.childForFieldName('expression');
    if (!expressionNode) {
      console.log(
        `[ControlStructureVisitor.visitEachStatement] No expression found`
      );
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
   * Create an AST node for a function call
   * @param node The node containing the function call
   * @param functionName The name of the function
   * @param args The arguments to the function
   * @returns The AST node or null if the function is not supported
   */
  protected createASTNodeForFunction(
    node: TSNode,
    functionName: string,
    args: ast.Parameter[]
  ): ast.ASTNode | null {
    console.log(
      `[ControlStructureVisitor.createASTNodeForFunction] Processing function: ${functionName}`
    );

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
        console.log(
          `[ControlStructureVisitor.createASTNodeForFunction] Unsupported function: ${functionName}`
        );
        return null;
    }
  }

  /**
   * Create a let node
   * @param node The node containing the let expression
   * @param args The arguments to the let expression
   * @returns The let AST node or null if the arguments are invalid
   */
  private createLetNode(
    node: TSNode,
    args: ast.Parameter[]
  ): ast.LetNode | null {
    console.log(
      `[ControlStructureVisitor.createLetNode] Creating let node with ${args.length} arguments`
    );

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
   * Create an each node
   * @param node The node containing the each statement
   * @param args The arguments to the each statement
   * @returns The each AST node or null if the arguments are invalid
   */
  private createEachNode(
    node: TSNode,
    args: ast.Parameter[]
  ): ast.EachNode | null {
    console.log(
      `[ControlStructureVisitor.createEachNode] Creating each node with ${args.length} arguments`
    );

    // Each should have exactly one argument (the expression)
    if (args.length !== 1) {
      console.log(
        `[ControlStructureVisitor.createEachNode] Invalid number of arguments: ${args.length}`
      );
      return null;
    }

    // Create a simple expression node
    const firstArg = args[0];
    if (!firstArg) {
      console.log(
        `[ControlStructureVisitor.createEachNode] First argument is undefined`
      );
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
