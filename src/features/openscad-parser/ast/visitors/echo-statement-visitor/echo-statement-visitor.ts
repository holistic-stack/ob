/**
 * @file EchoStatementVisitor - Visitor for parsing OpenSCAD echo statements
 *
 * This visitor is responsible for parsing OpenSCAD echo statements and converting
 * them into structured AST nodes. Echo statements are used for debugging and
 * output in OpenSCAD scripts.
 *
 */

import type { Node as TSNode } from 'web-tree-sitter';
import type { ErrorHandler } from '@/features/openscad-parser';
import { Logger, Severity } from '@/features/openscad-parser';
import type * as ast from '../../ast-types.js';
import type { EchoStatementNode, ExpressionNode } from '../../ast-types.js';
import { getLocation } from '../../utils/location-utils.js';
import { findDescendantOfType } from '../../utils/node-utils.js';
import { BaseASTVisitor } from '../base-ast-visitor.js';

/**
 * Visitor class for parsing OpenSCAD echo statements
 *
 * The EchoStatementVisitor handles the parsing of echo statements which follow
 * the pattern: `echo(arg1, arg2, ...);`
 *
 * Echo statements can contain:
 * - String literals: `echo("Hello World");`
 * - Variables: `echo(x);`
 * - Multiple arguments: `echo("Value:", x, y);`
 * - Complex expressions: `echo(x + y, sin(45));`
 * - Empty arguments: `echo();`
 *
 * @example Basic usage
 * ```typescript
 * const visitor = new EchoStatementVisitor(sourceCode, errorHandler);
 * const echoNode = visitor.visitEchoStatement(cstNode);
 * ```
 *
 * @since 0.1.0
 */
export class EchoStatementVisitor extends BaseASTVisitor {
  private readonly logger: Logger;

  /**
   * Creates a new EchoStatementVisitor instance
   *
   * @param sourceCode The source code being parsed
   * @param errorHandler The error handler for reporting parsing errors
   */
  constructor(
    sourceCode: string,
    errorHandler: ErrorHandler,
    protected override variableScope: Map<string, ast.ParameterValue>
  ) {
    super(sourceCode, errorHandler, variableScope);
    this.logger = new Logger({ level: Severity.DEBUG });
  }

  /**
   * Override visitStatement to only handle echo statements
   * This prevents the EchoStatementVisitor from interfering with other statement types
   * that should be handled by specialized visitors (PrimitiveVisitor, TransformVisitor, etc.)
   *
   * @param node The statement node to visit
   * @returns The echo statement AST node or null if this is not an echo statement
   * @override
   */
  override visitStatement(node: TSNode): ast.ASTNode | null {
    // Only handle statements that contain echo_statement nodes
    const echoStatement = findDescendantOfType(node, 'echo_statement');
    if (echoStatement) {
      return this.visitEchoStatement(echoStatement);
    }

    // Return null for all other statement types to let specialized visitors handle them
    return null;
  }

  /**
   * Implementation of the abstract createASTNodeForFunction method
   * EchoStatementVisitor doesn't handle function calls, so this always returns null
   *
   * @param node The CST node for the module instantiation
   * @param functionName The name of the function/module called
   * @param args The processed arguments passed to the function/module
   * @returns Always null since EchoStatementVisitor doesn't handle function calls
   * @protected
   */
  protected createASTNodeForFunction(
    _node: TSNode,
    _functionName: string,
    _args: ast.Parameter[]
  ): ast.ASTNode | null {
    // EchoStatementVisitor doesn't handle function calls
    return null;
  }

  /**
   * Visits an echo statement node and converts it to an AST node
   *
   * This method processes echo statements from the CST and creates structured
   * AST nodes with proper argument parsing and error handling.
   *
   * @param node The echo_statement CST node to visit
   * @returns The EchoStatementNode AST node or null if parsing fails
   *
   * @example
   * ```typescript
   * // For: echo("Hello", x, 42);
   * const result = visitor.visitEchoStatement(node);
   * // Returns: {
   * //   type: 'echo',
   * //   arguments: [
   * //     { expressionType: 'literal', value: 'Hello' },
   * //     { expressionType: 'variable', name: 'x' },
   * //     { expressionType: 'literal', value: 42 }
   * //   ]
   * // }
   * ```
   *
   * @override
   */
  override visitEchoStatement(node: TSNode): EchoStatementNode | null {
    this.logger.debug(
      `[EchoStatementVisitor.visitEchoStatement] Processing echo statement: ${node.text.substring(
        0,
        50
      )}`
    );

    try {
      // Validate that this is actually an echo_statement node
      if (node.type !== 'echo_statement') {
        this.logger.warn(
          `[EchoStatementVisitor.visitEchoStatement] Expected echo_statement, got ${node.type}`
        );
        return null;
      }

      // Find the arguments node within the echo statement
      const argumentsNode = findDescendantOfType(node, 'arguments');
      const echoArguments: ExpressionNode[] = [];

      if (argumentsNode) {
        this.logger.debug(
          `[EchoStatementVisitor.visitEchoStatement] Found arguments node with ${argumentsNode.childCount} children`
        );

        // Process each argument in the arguments list
        for (let i = 0; i < argumentsNode.childCount; i++) {
          const child = argumentsNode.child(i);
          if (!child) continue;

          // Skip comma separators and other non-expression nodes
          if (child.type === ',' || child.type === 'comment') {
            continue;
          }

          // Handle argument nodes - they contain the actual expression
          let expressionToProcess = child;

          if (child.type === 'argument') {
            // For argument nodes, get the first child which should be the expression
            const firstChild = child.child(0);
            if (firstChild) {
              expressionToProcess = firstChild;
            }
          }

          // Process the expression argument
          const expressionNode = this.processExpression(expressionToProcess);
          if (expressionNode) {
            echoArguments.push(expressionNode);
          } else {
            this.logger.warn(
              `[EchoStatementVisitor.visitEchoStatement] Failed to process argument: ${child.type} -> ${expressionToProcess.type}`
            );
          }
        }
      } else {
        this.logger.debug(
          `[EchoStatementVisitor.visitEchoStatement] No arguments node found - empty echo statement`
        );
      }

      // Create the echo statement AST node
      const echoStatementNode: EchoStatementNode = {
        type: 'echo_statement',
        arguments: echoArguments,
      };

      this.logger.debug(
        `[EchoStatementVisitor.visitEchoStatement] Successfully created echo statement AST node with ${echoArguments.length} arguments`
      );
      return echoStatementNode;
    } catch (error) {
      this.logger.error(
        `[EchoStatementVisitor.visitEchoStatement] Error processing echo statement: ${error}`
      );
      return null;
    }
  }

  /**
   * Processes an expression node and converts it to an ExpressionNode
   *
   * This method handles the conversion of CST expression nodes to AST expression nodes
   * specifically for echo statement arguments.
   *
   * @param node The CST node representing an expression
   * @returns The ExpressionNode AST node or null if parsing fails
   *
   * @private
   */
  private processExpression(node: TSNode): ExpressionNode | null {
    try {
      // First, try to drill down to the actual content
      const actualNode = this.drillDownToActualExpression(node);

      // Handle basic node types directly (from new grammar structure)
      switch (actualNode.type) {
        case 'string': {
          // Remove quotes from string literals
          const stringValue = actualNode.text.slice(1, -1);
          return {
            type: 'expression',
            expressionType: 'literal',
            value: stringValue,
            dataType: 'string',
          } as ExpressionNode;
        }

        case 'number': {
          const numberValue = parseFloat(actualNode.text);
          return {
            type: 'expression',
            expressionType: 'literal',
            value: numberValue,
            dataType: 'number',
          } as ExpressionNode;
        }

        case 'boolean': {
          const booleanValue = actualNode.text === 'true';
          return {
            type: 'expression',
            expressionType: 'literal',
            value: booleanValue,
            dataType: 'boolean',
          } as ExpressionNode;
        }

        case 'identifier':
          return {
            type: 'expression',
            expressionType: 'variable',
            name: actualNode.text,
          } as ExpressionNode;

        case 'binary_expression':
          // Handle binary expressions (arithmetic, logical, etc.)
          return this.processBinaryExpression(actualNode);

        case 'call_expression':
          // Handle function call expressions using grammar field names
          return this.processCallExpressionWithFields(actualNode);
      }

      // Handle different expression types directly
      if (actualNode.type === 'accessor_expression') {
        // Check if this contains an array_literal child
        const arrayLiteralChild = Array.from({ length: actualNode.childCount }, (_, i) =>
          actualNode.child(i)
        ).find((child) => child?.type === 'array_literal');

        if (arrayLiteralChild) {
          // This is an array literal wrapped in accessor_expression, process it directly
          return this.processArrayLiteral(arrayLiteralChild);
        }

        // Check if this is a function call (has argument_list child)
        const hasArgumentList = Array.from({ length: actualNode.childCount }, (_, i) =>
          actualNode.child(i)
        ).some((child) => child?.type === 'argument_list');

        if (hasArgumentList) {
          // This is a function call, process it as such
          return this.processAccessorExpressionAsFunction(actualNode);
        }

        // For accessor expressions, check if it's a simple variable reference
        const primaryChild = actualNode.child(0);
        if (primaryChild && primaryChild.type === 'primary_expression') {
          const text = primaryChild.text;

          // Check if this primary_expression contains an array literal
          if (text.startsWith('[') && text.endsWith(']')) {
            // This is an array literal, check if the primary_expression has array_literal children
            for (let i = 0; i < primaryChild.childCount; i++) {
              const grandChild = primaryChild.child(i);
              if (grandChild && grandChild.type === 'array_literal') {
                return this.processArrayLiteral(grandChild);
              }
            }
            // If no array_literal child found, process the primary_expression directly
            return this.processPrimaryExpression(primaryChild);
          }

          // Check for boolean literals first (before variable check)
          if (text === 'true' || text === 'false') {
            return {
              type: 'expression',
              expressionType: 'literal',
              value: text === 'true',
              dataType: 'boolean',
            } as ExpressionNode;
          }

          // Check if it's a simple variable (identifier)
          if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(text)) {
            return {
              type: 'expression',
              expressionType: 'variable',
              name: text,
            } as ExpressionNode;
          }
          // Otherwise process as primary expression
          return this.processPrimaryExpression(primaryChild);
        }
      } else if (actualNode.type === 'primary_expression') {
        return this.processPrimaryExpression(actualNode);
      } else if (actualNode.type === 'array_literal') {
        // Handle array literals directly
        return this.processArrayLiteral(actualNode);
      } else if (this.isComplexExpression(actualNode.type)) {
        // Check if this is a multi-child complex expression (actual operation)
        // or a single-child wrapper (should be drilled through)
        if (actualNode.childCount > 1) {
          // Multi-child: actual complex expression
          const complexResult = this.processComplexExpression(actualNode);
          if (complexResult) {
            return complexResult;
          }
        } else if (actualNode.childCount === 1) {
          // Single-child: wrapper expression, drill down
          const child = actualNode.child(0);
          if (child) {
            return this.processExpression(child);
          }
        }

        // Fall back to base visitor
        const result = this.visitExpression(actualNode);
        if (result && 'expressionType' in result) {
          return result as ExpressionNode;
        }
      }

      // For other expression types, try the base visitor
      const result = this.visitExpression(actualNode);
      if (result && 'expressionType' in result) {
        return result as ExpressionNode;
      }

      return null;
    } catch (error) {
      this.logger.warn(
        `[EchoStatementVisitor.processExpression] Failed to process expression ${node.type}: ${error}`
      );
      return null;
    }
  }

  /**
   * Processes complex expressions that the base visitor doesn't handle yet
   *
   * @param node The complex expression CST node
   * @returns The ExpressionNode AST node or null if not handled
   *
   * @private
   */
  private processComplexExpression(node: TSNode): ExpressionNode | null {
    switch (node.type) {
      case 'additive_expression':
      case 'multiplicative_expression':
      case 'exponentiation_expression':
        return this.processBinaryExpression(node);

      case 'call_expression':
        return this.processCallExpression(node);

      case 'vector_expression':
        return this.processVectorExpression(node);

      case 'array_literal':
        return this.processArrayLiteral(node);

      default:
        return null;
    }
  }

  /**
   * Processes binary expressions (arithmetic operations)
   *
   * @param node The binary expression CST node
   * @returns The ExpressionNode AST node or null if processing fails
   *
   * @private
   */
  private processBinaryExpression(node: TSNode): ExpressionNode | null {
    // For a binary expression like "x + y", we expect 3 children: left, operator, right
    if (node.childCount !== 3) {
      return null;
    }

    const leftChild = node.child(0);
    const operatorChild = node.child(1);
    const rightChild = node.child(2);

    if (!leftChild || !operatorChild || !rightChild) {
      return null;
    }

    const operator = operatorChild.text;
    const left = this.processExpression(leftChild);
    const right = this.processExpression(rightChild);

    return {
      type: 'expression',
      expressionType: 'binary_expression',
      operator: operator,
      left: left,
      right: right,
      text: node.text,
    } as ExpressionNode;
  }

  /**
   * Processes function call expressions using grammar field names
   *
   * This method uses the proper field names from the tree-sitter grammar:
   * - field('function', $.identifier) for the function name
   * - field('arguments', $.argument_list) for the arguments
   *
   * @param node The call expression CST node
   * @returns The ExpressionNode AST node or null if processing fails
   *
   * @private
   */
  private processCallExpressionWithFields(node: TSNode): ExpressionNode | null {
    // Extract function name using the 'function' field from grammar
    const functionNode = node.childForFieldName('function');
    const functionName = functionNode ? functionNode.text : 'unknown';

    // Extract arguments using the 'arguments' field from grammar
    const argumentsNode = node.childForFieldName('arguments');
    const args: ExpressionNode[] = [];

    if (argumentsNode) {
      // Process arguments within the argument_list
      for (let i = 0; i < argumentsNode.childCount; i++) {
        const child = argumentsNode.child(i);
        if (!child) continue;

        // Skip punctuation (parentheses, commas)
        if (child.type === '(' || child.type === ')' || child.type === ',') {
          continue;
        }

        // Handle arguments node containing multiple argument children
        if (child.type === 'arguments') {
          for (let j = 0; j < child.childCount; j++) {
            const argChild = child.child(j);
            if (argChild && argChild.type === 'argument') {
              const processedArg = this.processExpression(argChild);
              if (processedArg) {
                args.push(processedArg);
              }
            }
          }
        } else if (child.type === 'argument') {
          // Handle individual argument nodes
          const processedArg = this.processExpression(child);
          if (processedArg) {
            args.push(processedArg);
          }
        }
      }
    }

    return {
      type: 'expression',
      expressionType: 'function_call',
      functionName: functionName,
      args: args.map((arg) => ({ name: undefined, value: arg })), // Convert to Parameter format
      location: getLocation(node),
    } as ExpressionNode;
  }

  /**
   * Processes function call expressions (legacy method)
   *
   * @param node The call expression CST node
   * @returns The ExpressionNode AST node or null if processing fails
   *
   * @private
   */
  private processCallExpression(node: TSNode): ExpressionNode | null {
    // Use the new field-based method
    return this.processCallExpressionWithFields(node);
  }

  /**
   * Processes vector/array expressions
   *
   * @param node The vector expression CST node
   * @returns The ExpressionNode AST node or null if processing fails
   *
   * @private
   */
  private processVectorExpression(node: TSNode): ExpressionNode | null {
    // Vector expressions in echo statements should be treated as arrays for compatibility
    const elements = this.extractVectorElements(node);
    return {
      type: 'expression',
      expressionType: 'array',
      items: elements,
      location: getLocation(node),
    } as ExpressionNode;
  }

  /**
   * Processes accessor expressions that represent function calls
   *
   * @param node The accessor expression CST node representing a function call
   * @returns The ExpressionNode AST node or null if processing fails
   *
   * @private
   */
  private processAccessorExpressionAsFunction(node: TSNode): ExpressionNode | null {
    // Extract function name from the first child (before argument_list)
    let functionName = 'unknown';
    let argumentList: TSNode | null = null;

    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (!child) continue;

      if (child.type === 'argument_list') {
        argumentList = child;
      } else if (i === 0) {
        // First non-argument_list child should be the function name
        functionName = child.text;
      }
    }

    // Extract arguments from the argument_list
    const args: ExpressionNode[] = [];
    if (argumentList) {
      // Process arguments within the argument_list
      for (let i = 0; i < argumentList.childCount; i++) {
        const argChild = argumentList.child(i);
        if (argChild && argChild.type !== '(' && argChild.type !== ')' && argChild.type !== ',') {
          const processedArg = this.processExpression(argChild);
          if (processedArg) {
            args.push(processedArg);
          }
        }
      }
    }

    return {
      type: 'expression',
      expressionType: 'function_call',
      name: functionName,
      arguments: args,
      text: node.text,
    } as ExpressionNode;
  }

  /**
   * Processes array literal expressions
   *
   * @param node The array_literal CST node
   * @returns The ExpressionNode AST node or null if processing fails
   *
   * @private
   */
  private processArrayLiteral(node: TSNode): ExpressionNode | null {
    // Extract elements from the array literal
    const elements: ExpressionNode[] = [];

    // Process all children, skipping brackets and commas
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (child && child.type !== '[' && child.type !== ']' && child.type !== ',') {
        const processedElement = this.processExpression(child);
        if (processedElement) {
          elements.push(processedElement);
        }
      }
    }

    return {
      type: 'expression',
      expressionType: 'array',
      items: elements,
      text: node.text,
    } as ExpressionNode;
  }

  /**
   * Checks if a node type represents a complex expression that should be handled by the base visitor
   *
   * @param nodeType The CST node type to check
   * @returns True if this is a complex expression type
   *
   * @private
   */
  private isComplexExpression(nodeType: string): boolean {
    const complexExpressionTypes = [
      'additive_expression',
      'multiplicative_expression',
      'exponentiation_expression',
      'call_expression',
      'vector_expression',
      'array_literal',
      'binary_expression',
      'unary_expression',
    ];

    return complexExpressionTypes.includes(nodeType);
  }

  /**
   * Drills down through nested expression nodes to find the actual content
   *
   * This method recursively traverses expression wrapper nodes to find the
   * actual expression content (like primary_expression, accessor_expression, etc.)
   *
   * @param node The CST node to drill down from
   * @returns The actual expression node
   *
   * @private
   */
  private drillDownToActualExpression(node: TSNode): TSNode {
    // List of expression wrapper types that we should drill through
    const wrapperTypes = [
      'expression',
      'conditional_expression',
      'logical_or_expression',
      'logical_and_expression',
      'equality_expression',
      'relational_expression',
      'additive_expression',
      'multiplicative_expression',
      'exponentiation_expression',
      'unary_expression',
    ];

    // If this is a wrapper type with a single child, drill down
    if (wrapperTypes.includes(node.type) && node.childCount === 1) {
      const child = node.child(0);
      if (child) {
        return this.drillDownToActualExpression(child);
      }
    }

    // If this is a complex expression with multiple children, it's the actual expression
    if (this.isComplexExpression(node.type) && node.childCount > 1) {
      return node;
    }

    // If this is a generic expression with multiple children, find the non-punctuation child
    if (node.type === 'expression' && node.childCount > 1) {
      for (let i = 0; i < node.childCount; i++) {
        const child = node.child(i);
        if (child && child.type !== '(' && child.type !== ')' && child.type !== ',') {
          return this.drillDownToActualExpression(child);
        }
      }
    }

    // Return the current node if we can't drill down further
    return node;
  }

  /**
   * Processes a primary expression node (literals, identifiers, etc.)
   *
   * @param node The primary expression CST node
   * @returns The ExpressionNode AST node or null if parsing fails
   *
   * @private
   */
  private processPrimaryExpression(node: TSNode): ExpressionNode | null {
    const text = node.text;

    // Handle string literals
    if (text.startsWith('"') && text.endsWith('"')) {
      return {
        type: 'expression',
        expressionType: 'literal',
        value: text.slice(1, -1), // Remove quotes
        dataType: 'string',
      } as ExpressionNode;
    }

    // Handle number literals
    if (/^-?\d+(\.\d+)?$/.test(text)) {
      const value = text.includes('.') ? parseFloat(text) : parseInt(text, 10);
      return {
        type: 'expression',
        expressionType: 'literal',
        value: value,
        dataType: 'number',
      } as ExpressionNode;
    }

    // Handle boolean literals
    if (text === 'true' || text === 'false') {
      return {
        type: 'expression',
        expressionType: 'literal',
        value: text === 'true',
        dataType: 'boolean',
      } as ExpressionNode;
    }

    // Handle identifiers/variables
    if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(text)) {
      return {
        type: 'expression',
        expressionType: 'variable',
        name: text,
      } as ExpressionNode;
    }

    return null;
  }

  /**
   * Placeholder method for function call processing
   * This method is required by the base class but not used in echo statement processing
   *
   * @param node The function call node
   * @param functionName The name of the function
   * @param args The function arguments
   * @returns Always returns null as echo statements don't process function calls directly
   *
   * @private
   */
  protected processFunctionCall(
    _node: TSNode,
    _functionName: string,
    _args: ast.Parameter[]
  ): ast.ASTNode | null {
    // Echo statements don't need special function call processing
    // This is handled by the expression visitor system
    return null;
  }

  /**
   * Extracts the operator from a binary expression node
   *
   * @param node The binary expression CST node
   * @returns The operator string
   *
   * @private
   */
  private extractOperator(node: TSNode): string {
    // Look for operator symbols in the children
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (child && ['+', '-', '*', '/', '^', '%'].includes(child.text)) {
        return child.text;
      }
    }
    return 'unknown';
  }

  /**
   * Extracts an operand from a binary expression node
   *
   * @param node The binary expression CST node
   * @param index The child index to extract
   * @returns The operand as an ExpressionNode
   *
   * @private
   */
  private extractOperand(node: TSNode, index: number): ExpressionNode | null {
    const child = node.child(index);
    if (!child) return null;

    // Recursively process the operand using our expression processing logic
    return this.processExpression(child);
  }

  /**
   * Extracts the function name from a call expression node
   *
   * @param node The call expression CST node
   * @returns The function name
   *
   * @private
   */
  private extractFunctionName(node: TSNode): string {
    // Look for the function name (usually the first child)
    const firstChild = node.child(0);
    return firstChild ? firstChild.text : 'unknown';
  }

  /**
   * Extracts arguments from a call expression node
   *
   * @param node The call expression CST node
   * @returns Array of argument representations
   *
   * @private
   */
  private extractCallArguments(node: TSNode): ast.ExpressionNode[] {
    // For now, return a simple representation
    // In a full implementation, this would parse the arguments properly
    return [
      {
        type: 'expression',
        expressionType: 'literal',
        value: node.text,
        location: getLocation(node),
      } as ast.LiteralNode,
    ];
  }

  /**
   * Extracts elements from a vector expression node
   *
   * @param node The vector expression CST node
   * @returns Array of element representations
   *
   * @private
   */
  private extractVectorElements(node: TSNode): ExpressionNode[] {
    const elements: ExpressionNode[] = [];

    // Process all children, skipping brackets and commas
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (child && child.type !== '[' && child.type !== ']' && child.type !== ',') {
        const processedElement = this.processExpression(child);
        if (processedElement) {
          elements.push(processedElement);
        }
      }
    }

    return elements;
  }
}
