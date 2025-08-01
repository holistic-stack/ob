/**
 * @file expression-visitor.ts
 * @description This file implements the `ExpressionVisitor` class, which specializes in processing
 * OpenSCAD expressions and converting them to structured AST representations. Expressions
 * are fundamental to OpenSCAD's computational model, enabling mathematical calculations,
 * logical operations, and dynamic value generation.
 *
 * @architectural_decision
 * The `ExpressionVisitor` is a specialized visitor that handles all expression-related nodes.
 * It is designed to be self-contained, processing a wide variety of expression types, including
 * binary, unary, conditional, and literal expressions. This visitor is a critical part of the
 * parsing pipeline, as expressions can appear in many different contexts (e.g., as parameters,
 * in assignments, in control flow statements). The visitor uses a dispatching mechanism to
 * route each expression type to the appropriate handler method, ensuring that the code is
 * modular and easy to maintain.
 *
 * @example
 * ```typescript
 * import { ExpressionVisitor } from './expression-visitor';
 * import { ErrorHandler } from '../../error-handling';
 * import { Parser, Language } from 'web-tree-sitter';
 *
 * async function main() {
 *   // 1. Setup parser and get CST
 *   await Parser.init();
 *   const parser = new Parser();
 *   const openscadLanguage = await Language.load('tree-sitter-openscad.wasm');
 *   parser.setLanguage(openscadLanguage);
 *   const sourceCode = 'a = (1 + 2) * 3;';
 *   const tree = parser.parse(sourceCode);
 *
 *   // 2. Create an error handler and visitor
 *   const errorHandler = new ErrorHandler();
 *   const expressionVisitor = new ExpressionVisitor(sourceCode, errorHandler);
 *
 *   // 3. Visit the expression node
 *   const assignmentNode = tree.rootNode.firstChild!;
 *   const expressionCSTNode = assignmentNode.childForFieldName('value')!;
 *   const astNode = expressionVisitor.visitExpression(expressionCSTNode);
 *
 *   // 4. Log the result
 *   console.log(JSON.stringify(astNode, null, 2));
 *   // Expected output for the expression part:
 *   // {
 *   //   "type": "expression",
 *   //   "expressionType": "binary",
 *   //   "operator": "*",
 *   //   "left": { ... }, // represents (1 + 2)
 *   //   "right": { ... } // represents 3
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
 * The `ExpressionVisitor` is a core component of the `CompositeVisitor`. It is responsible for
 * processing any expression nodes that are encountered during the CST traversal. The `CompositeVisitor`
 * delegates to this visitor when it finds an expression, and the `ExpressionVisitor` returns
 * a structured `ExpressionNode` that represents the parsed expression.
 */

import type { Node as TSNode } from 'web-tree-sitter';
import { ErrorCode } from '@/features/openscad-parser';
import { RangeExpressionVisitor } from '@/features/openscad-parser/ast/visitors/expression-visitor';
import type { ErrorHandler } from '../../error-handling/index.js';
import type * as ast from '../ast-types.js';
import { getLocation } from '../utils/location-utils.js';
import { findDescendantOfType } from '../utils/node-utils.js';
import { BaseASTVisitor } from './base-ast-visitor.js';
import { FunctionCallVisitor } from './expression-visitor/function-call-visitor.js';

// List of reserved keywords that cannot be used as standalone expressions.
// Note: 'true', 'false', 'undef' are handled by visitLiteral.
// Keywords like 'let' are part of specific expression structures (e.g., LetExpressionNode)
// and are handled by their respective visitors if they appear in valid constructs.
// This list targets keywords that, if parsed as a simple identifier in an expression context, are invalid.
const _RESERVED_KEYWORDS_AS_EXPRESSION_BLOCKLIST = new Set([
  'if',
  'else',
  'for',
  'module',
  'function',
  'include',
  'use',
  'echo', // echo() is a call, echo; is not a valid expression value
  'assert', // assert() is a call, assert; is not a valid expression value
  // 'let', // let(...) is an expression, but 'let' alone is not.
  // 'assign', // assign(...) is an expression, but 'assign' alone is not.
  // Consider adding other statement-starting keywords if they can be mistakenly parsed as identifiers in expressions.
]);

/**
 * @class ExpressionVisitor
 * @extends {BaseASTVisitor}
 * @description Visitor for processing OpenSCAD expressions with comprehensive type support.
 */
export class ExpressionVisitor extends BaseASTVisitor {
  public override variableScope: Map<string, ast.ParameterValue> = new Map();
  private readonly functionCallVisitor: FunctionCallVisitor;

  private readonly rangeExpressionVisitor: RangeExpressionVisitor;

  /**
   * @constructor
   * @description Creates a new `ExpressionVisitor`.
   * @param {string} source - The source code being parsed.
   * @param {ErrorHandler} errorHandler - The error handler instance.
   * @param {Map<string, ast.ParameterValue>} [variableScope] - The current variable scope.
   */
  constructor(
    source: string,
    protected override errorHandler: ErrorHandler,
    variableScope?: Map<string, ast.ParameterValue>
  ) {
    super(source, errorHandler, variableScope || new Map());

    // Initialize specialized visitors
    // This follows SRP by keeping only essential dependencies
    this.functionCallVisitor = new FunctionCallVisitor(this, errorHandler);

    this.rangeExpressionVisitor = new RangeExpressionVisitor(this, errorHandler);
  }

  /**
   * @method createBinaryExpressionNode
   * @description Creates a binary expression node from a CST node.
   * @param {TSNode} node - The binary expression CST node.
   * @returns {ast.BinaryExpressionNode | ast.ErrorNode | null} The binary expression AST node, an ErrorNode, or null if the node cannot be processed.
   * @private
   */
  createBinaryExpressionNode(node: TSNode): ast.BinaryExpressionNode | ast.ErrorNode | null {
    this.errorHandler.logInfo(
      `[ExpressionVisitor.createBinaryExpressionNode] Creating binary expression node for: ${
        node.type
      } - "${node.text.substring(0, 30)}"`,
      'ExpressionVisitor.createBinaryExpressionNode',
      node
    );

    // Check if this is actually a single expression wrapped in a binary expression hierarchy node
    if (node.namedChildCount === 1) {
      const child = node.namedChild(0);
      if (child) {
        this.errorHandler.logInfo(
          `[ExpressionVisitor.createBinaryExpressionNode] Detected single expression wrapped as binary expression. Delegating to child. Node: "${node.text}", Child: "${child.type}"`,
          'ExpressionVisitor.createBinaryExpressionNode',
          node
        );
        const result = this.dispatchSpecificExpression(child);
        // If the child is a binary expression or an error, return it directly.
        // Otherwise, this isn't the binary expression we're trying to create here.
        if (
          result &&
          (result.type === 'error' ||
            (result.type === 'expression' &&
              (result as ast.BinaryExpressionNode).expressionType === 'binary'))
        ) {
          return result as ast.BinaryExpressionNode | ast.ErrorNode;
        }
        this.errorHandler.logInfo(
          `[ExpressionVisitor.createBinaryExpressionNode] Single child was not a binary expression or error. Node: "${node.text}", Child: "${child.type}". Returning null.`,
          'ExpressionVisitor.createBinaryExpressionNode',
          node
        );
        return null;
      }
    }

    let leftNode: TSNode | null = null;
    let operatorNode: TSNode | null = null;
    let rightNode: TSNode | null = null;

    // Prefer named children for clarity and grammar alignment
    if (
      node.childForFieldName('left') &&
      node.childForFieldName('operator') &&
      node.childForFieldName('right')
    ) {
      leftNode = node.childForFieldName('left');
      operatorNode = node.childForFieldName('operator');
      rightNode = node.childForFieldName('right');
    } else if (node.childCount >= 3) {
      // Fallback for older grammar or non-standard binary structures
      leftNode = node.child(0);
      // Attempt to find the operator; this is less robust than named fields
      // Iterate between the first and last child to find a potential operator
      for (let i = 1; i < node.childCount - 1; i++) {
        const child = node.child(i);
        if (
          child &&
          ['+', '-', '*', '/', '%', '==', '!=', '<', '<=', '>', '>=', '&&', '||'].includes(
            child.text
          ) &&
          child.isNamed // isNamed check helps filter out anonymous punctuation
        ) {
          operatorNode = child;
          // Assuming the child immediately after the operator is the right operand if not using named fields
          // This part is tricky if there are multiple children between left and operator or operator and right.
          // For a simple L-O-R structure, child(2) or child(node.childCount -1) might be right.
          // If operator is child(i), then rightNode might be child(i+1) up to child(node.childCount-1)
          // The original code used node.child(2) if named fields failed. This is ambiguous if op isn't child(1).
          // For now, let's assume rightNode is the last child if we are in this fallback.
          break; // Take the first valid operator found
        }
      }
      rightNode = node.child(node.childCount - 1); // Fallback: assume last child is right operand
    }

    this.errorHandler.logInfo(
      `[ExpressionVisitor.createBinaryExpressionNode] Found nodes: left=${leftNode?.text}, op=${operatorNode?.text}, right=${rightNode?.text}`,
      'ExpressionVisitor.createBinaryExpressionNode',
      node
    );

    if (!leftNode || !rightNode || !operatorNode) {
      const message = `Invalid binary expression structure: Missing left, right, or operator. CST Node: ${node.text.substring(
        0,
        100
      )}`;
      this.errorHandler.handleError(
        new Error(message),
        'ExpressionVisitor.createBinaryExpressionNode',
        node
      );
      return {
        type: 'error',
        errorCode: 'INVALID_BINARY_EXPRESSION_STRUCTURE',
        message: `Invalid binary expression structure. Left: ${
          leftNode?.text
        }, Op: ${operatorNode?.text}, Right: ${rightNode?.text}. CST: ${node.text.substring(0, 50)}`,
        originalNodeType: node.type,
        cstNodeText: node.text,
        location: getLocation(node),
      } as ast.ErrorNode;
    }

    const leftExpr = this.dispatchSpecificExpression(leftNode);
    if (leftExpr && leftExpr.type === 'error') {
      this.errorHandler.logWarning(
        `[ExpressionVisitor.createBinaryExpressionNode] Left operand is an ErrorNode. Propagating. Node: ${leftNode.text}`,
        'ExpressionVisitor.createBinaryExpressionNode',
        leftNode
      );
      return leftExpr;
    }
    if (!leftExpr) {
      this.errorHandler.logError(
        `[ExpressionVisitor.createBinaryExpressionNode] Failed to process left operand (returned null): ${leftNode.text.substring(
          0,
          100
        )}. ErrorCode: UNPARSABLE_BINARY_OPERAND_LEFT_NULL`,
        'ExpressionVisitor.createBinaryExpressionNode',
        leftNode
      );
      return {
        type: 'error',
        errorCode: 'UNPARSABLE_BINARY_OPERAND_LEFT_NULL',
        message: `Failed to parse left operand. CST: ${leftNode.text}`,
        originalNodeType: leftNode.type,
        cstNodeText: leftNode.text,
        location: getLocation(leftNode),
      } as ast.ErrorNode;
    }

    const rightExpr = this.dispatchSpecificExpression(rightNode);
    if (rightExpr && rightExpr.type === 'error') {
      this.errorHandler.logWarning(
        `[ExpressionVisitor.createBinaryExpressionNode] Right operand is an ErrorNode. Propagating. Node: ${rightNode.text}`,
        'ExpressionVisitor.createBinaryExpressionNode',
        rightNode
      );
      return rightExpr;
    }
    if (!rightExpr) {
      this.errorHandler.handleError(
        new Error(
          `Failed to process right operand (returned null): ${rightNode.text.substring(0, 100)}`
        ),
        'ExpressionVisitor.createBinaryExpressionNode',
        rightNode
      );
      return {
        type: 'error',
        errorCode: 'UNPARSABLE_BINARY_OPERAND_RIGHT_NULL',
        message: `Failed to parse right operand. CST: ${rightNode.text}`,
        originalNodeType: rightNode.type,
        cstNodeText: rightNode.text,
        location: getLocation(rightNode),
      } as ast.ErrorNode;
    }

    const binaryExprNode: ast.BinaryExpressionNode = {
      type: 'expression',
      expressionType: 'binary',
      operator: operatorNode.text as ast.BinaryOperator,
      left: leftExpr as ast.ExpressionNode,
      right: rightExpr as ast.ExpressionNode,
      location: getLocation(node),
    };

    this.errorHandler.logInfo(
      `[ExpressionVisitor.createBinaryExpressionNode] Created binary expression node: ${JSON.stringify(
        binaryExprNode,
        null,
        2
      )}`,
      'ExpressionVisitor.createBinaryExpressionNode',
      node
    );
    return binaryExprNode;
  }

  /**
   * @method visitStatement
   * @description Overrides the base `visitStatement` to only handle expression statements.
   * @param {TSNode} node - The statement node to visit.
   * @returns {ast.ASTNode | null} The expression AST node, or null if this is not an expression statement.
   * @override
   */
  override visitStatement(node: TSNode): ast.ASTNode | null {
    // Only handle statements that contain expression nodes
    // Check for expression_statement, assignment_statement with expressions
    const expressionStatement = node.descendantsOfType('expression_statement')[0];
    if (expressionStatement) {
      // Find the expression within the expression statement
      const expression = expressionStatement.namedChild(0);
      if (expression) {
        return this.dispatchSpecificExpression(expression);
      }
    }

    // Check for assignment statements that contain expressions
    const assignmentStatement = node.descendantsOfType('assignment_statement')[0];
    if (assignmentStatement) {
      // Assignment statements are handled by AssignStatementVisitor, not ExpressionVisitor
      return null;
    }

    // Return null for all other statement types to let specialized visitors handle them
    return null;
  }

  /**
   * @method isExpressionNode
   * @description Type guard to check if an AST node is an expression node.
   * @param {ast.ASTNode} node - The AST node to check.
   * @returns {boolean} True if the node is an `ExpressionNode`.
   * @private
   */
  private isExpressionNode(node: ast.ASTNode): node is ast.ExpressionNode {
    return node.type === 'expression' && 'expressionType' in node;
  }

  /**
   * @method isErrorNode
   * @description Type guard to check if an AST node is an error node.
   * @param {ast.ASTNode} node - The AST node to check.
   * @returns {boolean} True if the node is an `ErrorNode`.
   * @private
   */
  private isErrorNode(node: ast.ASTNode): node is ast.ErrorNode {
    return node.type === 'error';
  }

  /**
   * @method dispatchSpecificExpression
   * @description Dispatches an expression node to the appropriate handler method.
   * @param {TSNode} node - The expression node to dispatch.
   * @returns {ast.ExpressionNode | ast.ErrorNode | null} The expression AST node, an error node, or null if the node cannot be processed.
   * @public
   */
  public dispatchSpecificExpression(node: TSNode): ast.ExpressionNode | ast.ErrorNode | null {
    // Check for binary expression types first
    // Note: Grammar refactoring unified all binary expressions under 'binary_expression'
    const binaryExpressionTypes = ['binary_expression'];

    if (binaryExpressionTypes.includes(node.type)) {
      this.errorHandler.logInfo(
        `[ExpressionVisitor.dispatchSpecificExpression] Handling binary expression type: ${node.type}`,
        'ExpressionVisitor.dispatchSpecificExpression',
        node
      );
      return this.createBinaryExpressionNode(node);
    }

    switch (node.type) {
      case 'expression':
        return this.visitExpression(node);
      case 'identifier':
        return this.visitIdentifier(node);
      case 'number_literal':
      case 'number': // Handle both number_literal and number node types
      case 'string_literal':
      case 'string': // Handle both string_literal and string node types
      case 'boolean_literal':
      case 'boolean': // Handle both boolean_literal and boolean node types
      case 'true': // Handle true literal node type
      case 'false': // Handle false literal node type
      case 'undef_literal':
      case 'undef': // Handle both undef_literal and undef node types
        return this.visitLiteral(node);
      case 'unary_expression':
        return this.visitUnaryExpression(node);
      case 'vector_expression':
        return this.visitVectorExpression(node);
      case 'array_expression':
      case 'array_literal':
        return this.visitArrayExpression(node);
      case 'accessor_expression': {
        const result = this.visitAccessorExpression(node);
        // Filter to only return ExpressionNode or ErrorNode
        if (result && (this.isExpressionNode(result) || result.type === 'error')) {
          return result as ast.ExpressionNode | ast.ErrorNode;
        }
        // If it's not an expression, return null
        return null;
      }
      case 'primary_expression': {
        // Handle primary expressions by delegating to child nodes
        const child = node.namedChild(0);
        if (child) {
          return this.dispatchSpecificExpression(child);
        }
        return null;
      }
      case 'list_comprehension':
        // List comprehension not supported yet
        return {
          type: 'error',
          errorCode: 'UNSUPPORTED_LIST_COMPREHENSION',
          message: 'List comprehension expressions are not yet supported',
          originalNodeType: node.type,
          cstNodeText: node.text,
          location: getLocation(node),
        } as ast.ErrorNode;
      case 'range_expression':
        return this.rangeExpressionVisitor.visitRangeExpression(node);
      case 'module_instantiation':
      case 'call_expression': {
        // Handle call_expression similar to module_instantiation
        const result = this.functionCallVisitor.visit(node); // visit should return ExpressionNode | ErrorNode | null
        this.errorHandler.logInfo(
          `[ExpressionVisitor.dispatchSpecificExpression] ${node.type} result: ${
            result ? (result.type === 'error' ? 'ErrorNode' : 'ExpressionNode') : 'null'
          }`
        );
        // Filter result to ensure it's an expression or error node
        if (result && (this.isExpressionNode(result) || this.isErrorNode(result))) {
          return result;
        }
        return null;
      }
      case 'let_expression':
        return this.visitLetExpression(node);
      case 'conditional_expression':
        return this.visitConditionalExpression(node);
      default:
        return this.createExpressionNode(node);
    }
  }

  /**
   * @method visitIdentifier
   * @description Visits an identifier node in the CST.
   * @param {TSNode} node - The identifier node from the CST.
   * @returns {ast.IdentifierNode | ast.ErrorNode | null} An identifier node for the AST, or an error node if the identifier is a reserved keyword.
   * @public
   */
  visitIdentifier(node: TSNode): ast.IdentifierNode | ast.ErrorNode | null {
    this.errorHandler.logInfo(
      `[ExpressionVisitor.visitIdentifier] Processing identifier: ${node.text}`,
      'ExpressionVisitor.visitIdentifier',
      node
    );

    // Check if the identifier is a reserved keyword
    const reservedKeywords = ['if', 'else', 'for', 'while', 'module', 'function', 'include', 'use'];
    if (reservedKeywords.includes(node.text)) {
      this.errorHandler.logError(
        `[ExpressionVisitor.visitIdentifier] Reserved keyword '${node.text}' used as an identifier`,
        'ExpressionVisitor.visitIdentifier',
        node
      );
      return {
        type: 'error',
        errorCode: `RESERVED_KEYWORD_${node.text.toUpperCase()}`,
        message: `Reserved keyword '${node.text}' cannot be used as a variable name`,
        originalNodeType: node.type,
        cstNodeText: node.text,
        location: getLocation(node),
      };
    }

    // Create an identifier node directly from the identifier
    return {
      type: 'expression',
      expressionType: 'identifier',
      name: node.text,
      location: getLocation(node),
    };
  }

  /**
   * @method createExpressionNode
   * @description Creates an expression node from a CST node.
   * @param {TSNode} node - The CST node.
   * @returns {ast.ExpressionNode | ast.ErrorNode | null} The expression AST node, or null if the node cannot be processed.
   * @private
   */
  createExpressionNode(node: TSNode): ast.ExpressionNode | ast.ErrorNode | null {
    this.errorHandler.logInfo(
      `[ExpressionVisitor.createExpressionNode] Creating expression node for type: ${node.type}`,
      'ExpressionVisitor.createExpressionNode',
      node
    );

    // Handle specific expression types
    switch (node.type) {
      case 'binary_expression': {
        // Note: Grammar refactoring unified all binary expressions under 'binary_expression'
        // Process binary expression directly
        const leftNode = node.namedChild(0);
        const rightNode = node.namedChild(2);
        const operatorNode = node.namedChild(1);

        if (!leftNode || !rightNode || !operatorNode) {
          this.errorHandler.handleError(
            new Error(`Invalid binary expression structure: ${node.text.substring(0, 100)}`),
            'ExpressionVisitor.createExpressionNode',
            node
          );
          return null;
        }

        // Process left and right operands
        const leftExpr = this.dispatchSpecificExpression(leftNode);
        const rightExpr = this.dispatchSpecificExpression(rightNode);

        if (!leftExpr || !rightExpr) {
          this.errorHandler.handleError(
            new Error(
              `Failed to process operands in binary expression: ${node.text.substring(0, 100)}`
            ),
            'ExpressionVisitor.createExpressionNode',
            node
          );
          return null;
        }

        // Check for errors or null in operands before creating binary expression node
        if (leftExpr && leftExpr.type === 'error') {
          return leftExpr;
        }
        if (rightExpr && rightExpr.type === 'error') {
          return rightExpr;
        }

        if (!leftExpr) {
          this.errorHandler.logError(
            `[ExpressionVisitor.createExpressionNode] Missing left operand for binary expression. Node: "${node.text}"`,
            'ExpressionVisitor.createExpressionNode',
            node
          );
          return {
            type: 'error',
            errorCode: 'MISSING_LEFT_OPERAND',
            message: `Missing left operand for binary expression. CST node text: ${node.text}`,
            originalNodeType: node.type,
            cstNodeText: node.text,
            location: getLocation(node),
          } as ast.ErrorNode;
        }

        if (!rightExpr) {
          this.errorHandler.logError(
            `[ExpressionVisitor.createExpressionNode] Missing right operand for binary expression. Node: "${node.text}"`,
            'ExpressionVisitor.createExpressionNode',
            node
          );
          return {
            type: 'error',
            errorCode: 'MISSING_RIGHT_OPERAND',
            message: `Missing right operand for binary expression. CST node text: ${node.text}`,
            originalNodeType: node.type,
            cstNodeText: node.text,
            location: getLocation(node),
          } as ast.ErrorNode;
        }

        // At this point, leftExpr and rightExpr are valid ExpressionNodes
        // Ensure both operands are expression nodes (not error nodes)
        if (!this.isExpressionNode(leftExpr) || !this.isExpressionNode(rightExpr)) {
          return {
            type: 'error',
            errorCode: 'INVALID_BINARY_OPERANDS',
            message: `Binary expression operands must be expression nodes. Left: ${leftExpr?.type}, Right: ${rightExpr?.type}`,
            originalNodeType: node.type,
            cstNodeText: node.text,
            location: getLocation(node),
          } as ast.ErrorNode;
        }

        return {
          type: 'expression',
          expressionType: 'binary_expression',
          operator: operatorNode.text as ast.BinaryOperator,
          left: leftExpr,
          right: rightExpr,
          location: getLocation(node),
        };
      }
      case 'unary_expression': {
        // Check if this is actually a single expression wrapped in a unary expression hierarchy node
        if (node.namedChildCount === 1) {
          const child = node.namedChild(0);
          if (child) {
            this.errorHandler.logInfo(
              `[ExpressionVisitor.createExpressionNode] Detected single expression wrapped as unary expression. Delegating to child. Node: "${node.text}", Child: "${child.type}"`,
              'ExpressionVisitor.createExpressionNode',
              node
            );
            // Delegate to the child node
            return this.dispatchSpecificExpression(child);
          }
        }

        // Process unary expression directly
        const operandNode = node.child(1);
        const operatorNode = node.child(0);

        if (!operandNode || !operatorNode) {
          this.errorHandler.handleError(
            new Error(`Invalid unary expression structure: ${node.text.substring(0, 100)}`),
            'ExpressionVisitor.createExpressionNode',
            node
          );
          return null;
        }

        // Process operand
        const operandExpr = this.dispatchSpecificExpression(operandNode);

        if (!operandExpr) {
          this.errorHandler.handleError(
            new Error(
              `Failed to process operand in unary expression: ${node.text.substring(0, 100)}`
            ),
            'ExpressionVisitor.createExpressionNode',
            node
          );
          return null;
        }

        // Create unary expression node
        return {
          type: 'expression',
          expressionType: 'unary',
          operator: operatorNode.text as ast.UnaryOperator,
          operand: operandExpr,
          prefix: true, // All unary operators in OpenSCAD are prefix operators
          location: getLocation(node),
        } as ast.UnaryExpressionNode;
      }
      case 'conditional_expression': {
        // Check if this is actually a single expression wrapped in a conditional expression hierarchy node
        if (node.namedChildCount === 1) {
          const child = node.namedChild(0);
          if (child) {
            this.errorHandler.logInfo(
              `[ExpressionVisitor.createExpressionNode] Detected single expression wrapped as conditional expression. Delegating to child. Node: "${node.text}", Child: "${child.type}"`,
              'ExpressionVisitor.createExpressionNode',
              node
            );
            // Delegate to the child node
            return this.dispatchSpecificExpression(child);
          }
        }

        // Process conditional expression directly
        const conditionNode = node.namedChild(0);
        const thenNode = node.namedChild(2);
        const elseNode = node.namedChild(4);

        if (!conditionNode || !thenNode || !elseNode) {
          this.errorHandler.handleError(
            new Error(`Invalid conditional expression structure: ${node.text.substring(0, 100)}`),
            'ExpressionVisitor.createExpressionNode',
            node
          );
          return null;
        }

        // Process condition, then, and else expressions
        const conditionExpr = this.dispatchSpecificExpression(conditionNode);
        const thenExpr = this.dispatchSpecificExpression(thenNode);
        const elseExpr = this.dispatchSpecificExpression(elseNode);

        if (conditionExpr && conditionExpr.type === 'error') {
          return conditionExpr;
        }
        if (thenExpr && thenExpr.type === 'error') {
          return thenExpr;
        }
        if (elseExpr && elseExpr.type === 'error') {
          return elseExpr;
        }

        if (!conditionExpr) {
          this.errorHandler.logError(
            `[ExpressionVisitor.createExpressionNode] Missing condition in conditional expression. Node: "${node.text}"`,
            'ExpressionVisitor.createExpressionNode',
            node
          );
          return {
            type: 'error',
            errorCode: 'MISSING_CONDITION_EXPRESSION',
            message: `Missing condition in conditional expression. CST node text: ${node.text}`,
            originalNodeType: node.type,
            cstNodeText: node.text,
            location: getLocation(node),
          } as ast.ErrorNode;
        }
        if (!thenExpr) {
          this.errorHandler.logError(
            `[ExpressionVisitor.createExpressionNode] Missing 'then' branch in conditional expression. Node: "${node.text}"`,
            'ExpressionVisitor.createExpressionNode',
            node
          );
          return {
            type: 'error',
            errorCode: 'MISSING_THEN_BRANCH_EXPRESSION',
            message: `Missing 'then' branch in conditional expression. CST node text: ${node.text}`,
            originalNodeType: node.type,
            cstNodeText: node.text,
            location: getLocation(node),
          } as ast.ErrorNode;
        }
        if (!elseExpr) {
          this.errorHandler.logError(
            `[ExpressionVisitor.createExpressionNode] Missing 'else' branch in conditional expression. Node: "${node.text}"`,
            'ExpressionVisitor.createExpressionNode',
            node
          );
          return {
            type: 'error',
            errorCode: 'MISSING_ELSE_BRANCH_EXPRESSION',
            message: `Missing 'else' branch in conditional expression. CST node text: ${node.text}`,
            originalNodeType: node.type,
            cstNodeText: node.text,
            location: getLocation(node),
          } as ast.ErrorNode;
        }

        // Ensure all parts are expression nodes (not error nodes)
        if (
          !this.isExpressionNode(conditionExpr) ||
          !this.isExpressionNode(thenExpr) ||
          !this.isExpressionNode(elseExpr)
        ) {
          return {
            type: 'error',
            errorCode: 'INVALID_CONDITIONAL_OPERANDS',
            message: `Conditional expression operands must be expression nodes. Condition: ${conditionExpr?.type}, Then: ${thenExpr?.type}, Else: ${elseExpr?.type}`,
            originalNodeType: node.type,
            cstNodeText: node.text,
            location: getLocation(node),
          } as ast.ErrorNode;
        }

        // Create conditional expression node
        return {
          type: 'expression',
          expressionType: 'conditional',
          condition: conditionExpr,
          thenBranch: thenExpr,
          elseBranch: elseExpr,
          location: getLocation(node),
        };
      }
      case 'parenthesized_expression': {
        // Process parenthesized expression directly
        const innerNode = node.namedChild(0);

        if (!innerNode) {
          this.errorHandler.handleError(
            new Error(`Invalid parenthesized expression structure: ${node.text.substring(0, 100)}`),
            'ExpressionVisitor.createExpressionNode',
            node
          );
          return null;
        }

        // Process inner expression
        const innerExpr = this.dispatchSpecificExpression(innerNode);

        if (!innerExpr) {
          this.errorHandler.handleError(
            new Error(
              `Failed to process inner expression in parenthesized expression: ${node.text.substring(
                0,
                100
              )}`
            ),
            'ExpressionVisitor.createExpressionNode',
            node
          );
          return null;
        }

        // Ensure inner expression is an expression or error node
        if (this.isExpressionNode(innerExpr) || this.isErrorNode(innerExpr)) {
          // Return the inner expression with the parenthesized location
          return {
            ...innerExpr,
            location: getLocation(node),
          };
        }

        // If inner expression is not compatible, return error
        return {
          type: 'error',
          errorCode: 'INVALID_PARENTHESIZED_EXPRESSION',
          message: `Parenthesized expression contains invalid inner expression type: ${(innerExpr as { type?: string })?.type ?? 'unknown'}`,
          originalNodeType: node.type,
          cstNodeText: node.text,
          location: getLocation(node),
        } as ast.ErrorNode;
      }
      case 'function_call': {
        // Convert function call to expression node for expression contexts
        const functionCall = this.functionCallVisitor.visitFunctionCall(
          node
        ) as ast.FunctionCallNode;
        if (functionCall) {
          // Create an expression wrapper for the function call
          return {
            type: 'expression',
            expressionType: 'function_call',
            functionName: functionCall.functionName,
            args: functionCall.args,
            location: functionCall.location,
          } as ast.ExpressionNode;
        }
        return null;
      }
      case 'list_comprehension':
        // List comprehension not supported yet
        return {
          type: 'error',
          errorCode: 'UNSUPPORTED_LIST_COMPREHENSION',
          message: 'List comprehension expressions are not yet supported',
          originalNodeType: node.type,
          cstNodeText: node.text,
          location: getLocation(node),
        } as ast.ErrorNode;
      case 'range_expression':
        // Handle range expressions
        return this.rangeExpressionVisitor.visitRangeExpression(node);
      case 'let_expression':
        // Handle let expressions
        return this.visitLetExpression(node);
      default:
        this.errorHandler.logInfo(
          `[ExpressionVisitor.createExpressionNode] Unhandled expression type: ${node.type}`,
          'ExpressionVisitor.createExpressionNode',
          node
        );
        return null;
    }
  }

  /**
   * @method visitBinaryExpression
   * @description Visits a binary expression node.
   * @param {TSNode} node - The binary expression CST node.
   * @returns {ast.BinaryExpressionNode | ast.ErrorNode | null} The binary expression AST node, or null if the node cannot be processed.
   * @public
   */
  visitBinaryExpression(node: TSNode): ast.BinaryExpressionNode | ast.ErrorNode | null {
    return this.createBinaryExpressionNode(node);
  }

  /**
   * @method visitConditionalExpression
   * @description Visits a conditional expression node (ternary operator: `condition ? consequence : alternative`).
   * @param {TSNode} node - The conditional expression CST node.
   * @returns {ast.ConditionalExpressionNode | ast.ErrorNode | null} The conditional expression AST node, or null if the node cannot be processed.
   * @override
   */
  override visitConditionalExpression(
    node: TSNode
  ): ast.ConditionalExpressionNode | ast.ErrorNode | null {
    if (node.type !== 'conditional_expression') {
      this.errorHandler.logError(
        `Expected conditional_expression node, got ${node.type}`,
        'ExpressionVisitor.visitConditionalExpression',
        node
      );
      return null;
    }

    // Extract the parts of the conditional expression
    const conditionNode = node.childForFieldName('condition');
    const consequenceNode = node.childForFieldName('consequence');
    const alternativeNode = node.childForFieldName('alternative');

    if (!conditionNode || !consequenceNode || !alternativeNode) {
      this.errorHandler.logError(
        'Conditional expression missing required fields (condition, consequence, alternative)',
        'ExpressionVisitor.visitConditionalExpression',
        node
      );
      return null;
    }

    // Process each part
    const condition = this.dispatchSpecificExpression(conditionNode);
    const consequence = this.dispatchSpecificExpression(consequenceNode);
    const alternative = this.dispatchSpecificExpression(alternativeNode);

    if (!condition || !consequence || !alternative) {
      this.errorHandler.logError(
        'Failed to process conditional expression components',
        'ExpressionVisitor.visitConditionalExpression',
        node
      );
      return null;
    }

    return {
      type: 'expression',
      expressionType: 'conditional',
      condition: condition as ast.ExpressionNode,
      thenBranch: consequence as ast.ExpressionNode,
      elseBranch: alternative as ast.ExpressionNode,
      location: getLocation(node),
    } as ast.ConditionalExpressionNode;
  }

  /**
   * @method visitUnaryExpression
   * @description Visits a unary expression node (e.g., `-x`, `!flag`).
   * @param {TSNode} node - The unary expression CST node.
   * @returns {ast.UnaryExpressionNode | ast.ErrorNode | null} The unary expression AST node, or null if the node cannot be processed.
   * @public
   */
  visitUnaryExpression(node: TSNode): ast.UnaryExpressionNode | ast.ErrorNode | null {
    this.errorHandler.logInfo(
      `[ExpressionVisitor.visitUnaryExpression] Processing unary expression: ${node.text.substring(
        0,
        50
      )}`,
      'ExpressionVisitor.visitUnaryExpression',
      node
    );

    // Check if this is actually a single expression wrapped in a unary expression hierarchy node
    if (node.namedChildCount === 1) {
      const child = node.namedChild(0);
      if (child) {
        this.errorHandler.logInfo(
          `[ExpressionVisitor.visitUnaryExpression] Detected single expression wrapped as unary expression. Delegating to child. Node: "${node.text}", Child: "${child.type}"`,
          'ExpressionVisitor.visitUnaryExpression',
          node
        );
        // Delegate to the child node
        const result = this.dispatchSpecificExpression(child);
        // If the child is a unary expression or an error, return it directly.
        // Otherwise, this isn't the unary expression we're trying to create here.
        if (
          result &&
          (result.type === 'error' ||
            (result.type === 'expression' &&
              (result as ast.UnaryExpressionNode).expressionType === 'unary'))
        ) {
          return result as ast.UnaryExpressionNode | ast.ErrorNode;
        }
        this.errorHandler.logInfo(
          `[ExpressionVisitor.visitUnaryExpression] Single child was not a unary expression or error. Node: "${node.text}", Child: "${child.type}". Returning null.`,
          'ExpressionVisitor.visitUnaryExpression',
          node
        );
        return null;
      }
    }

    // Process unary expression directly
    const operatorNode = node.child(0);
    const operandNode = node.child(1);

    if (!operatorNode || !operandNode) {
      const message = `Invalid unary expression structure: Missing operator or operand. CST Node: ${node.text.substring(
        0,
        100
      )}`;
      this.errorHandler.handleError(
        new Error(message),
        'ExpressionVisitor.visitUnaryExpression',
        node
      );
      return {
        type: 'error',
        errorCode: 'INVALID_UNARY_EXPRESSION_STRUCTURE',
        message: `Invalid unary expression structure. Operator: ${
          operatorNode?.text
        }, Operand: ${operandNode?.text}. CST: ${node.text.substring(0, 50)}`,
        originalNodeType: node.type,
        cstNodeText: node.text,
        location: getLocation(node),
      } as ast.ErrorNode;
    }

    // Process operand
    const operandExpr = this.dispatchSpecificExpression(operandNode);
    if (operandExpr && operandExpr.type === 'error') {
      this.errorHandler.logWarning(
        `[ExpressionVisitor.visitUnaryExpression] Operand is an ErrorNode. Propagating. Node: ${operandNode.text}`,
        'ExpressionVisitor.visitUnaryExpression',
        operandNode
      );
      return operandExpr;
    }
    if (!operandExpr) {
      this.errorHandler.logError(
        `[ExpressionVisitor.visitUnaryExpression] Failed to process operand (returned null): ${operandNode.text.substring(
          0,
          100
        )}. ErrorCode: UNPARSABLE_UNARY_OPERAND_NULL`,
        'ExpressionVisitor.visitUnaryExpression',
        operandNode
      );
      return {
        type: 'error',
        errorCode: 'UNPARSABLE_UNARY_OPERAND_NULL',
        message: `Failed to parse unary operand. CST: ${operandNode.text}`,
        originalNodeType: operandNode.type,
        cstNodeText: operandNode.text,
        location: getLocation(operandNode),
      } as ast.ErrorNode;
    }

    // Create unary expression node
    const unaryExprNode: ast.UnaryExpressionNode = {
      type: 'expression',
      expressionType: 'unary',
      operator: operatorNode.text as ast.UnaryOperator,
      operand: operandExpr as ast.ExpressionNode,
      location: getLocation(node),
    };

    this.errorHandler.logInfo(
      `[ExpressionVisitor.visitUnaryExpression] Created unary expression node: ${JSON.stringify(
        unaryExprNode,
        null,
        2
      )}`,
      'ExpressionVisitor.visitUnaryExpression',
      node
    );
    return unaryExprNode;
  }

  /**
   * @method visitExpression
   * @description Visits an expression node. This method determines the specific type of expression
   * and dispatches to the appropriate handler method.
   * @param {TSNode} node - The expression node to visit (CST node).
   * @returns {ast.ExpressionNode | ast.ErrorNode | null} The expression AST node, or null if the node cannot be processed.
   * @override
   */
  override visitExpression(node: TSNode): ast.ExpressionNode | ast.ErrorNode | null {
    // Debug: Log the node structure
    this.errorHandler.logInfo(
      `[ExpressionVisitor.visitExpression] Processing expression: ${node.text.substring(0, 30)}`,
      'ExpressionVisitor.visitExpression',
      node
    );

    // If the node itself is a specific expression type, use it directly
    if (node.type !== 'expression') {
      this.errorHandler.logInfo(
        `[ExpressionVisitor.visitExpression] Node is a specific type: ${node.type}`,
        'ExpressionVisitor.visitExpression',
        node
      );
      return this.dispatchSpecificExpression(node);
    }

    // Check for let expression first (before other checks)
    const letExprNode = findDescendantOfType(node, 'let_expression');
    if (letExprNode) {
      this.errorHandler.logInfo(
        `[ExpressionVisitor.visitExpression] Found let expression: ${letExprNode.text.substring(
          0,
          30
        )}`,
        'ExpressionVisitor.visitExpression',
        letExprNode
      );
      return this.visitLetExpression(letExprNode);
    }

    // Check for binary expression
    const binaryExprNode = findDescendantOfType(node, 'binary_expression');
    if (binaryExprNode) {
      this.errorHandler.logInfo(
        `[ExpressionVisitor.visitExpression] Found binary expression: ${binaryExprNode.text.substring(
          0,
          30
        )}`,
        'ExpressionVisitor.visitExpression',
        binaryExprNode
      );
      return this.createExpressionNode(binaryExprNode);
    }

    // Check for unary expression, but be more selective about function call detection
    const unaryExprNode = findDescendantOfType(node, 'unary_expression');
    if (unaryExprNode) {
      // Check if this unary expression contains an accessor_expression
      const accessorExpr = findDescendantOfType(unaryExprNode, 'accessor_expression');
      if (accessorExpr) {
        // Check if this accessor expression has an argument_list (making it a function call)
        const argumentListNode = findDescendantOfType(accessorExpr, 'argument_list');
        if (argumentListNode) {
          // Check if this is a direct function call (not an array containing function calls)
          // If the unary expression starts with '[', it's likely an array containing function calls
          const nodeText = unaryExprNode.text.trim();
          if (nodeText.startsWith('[') && nodeText.endsWith(']')) {
            // This is an array that contains function calls - we should process it
            this.errorHandler.logInfo(
              `[ExpressionVisitor.visitExpression] Found array containing function calls: ${unaryExprNode.text.substring(
                0,
                30
              )}. Processing as array.`,
              'ExpressionVisitor.visitExpression',
              unaryExprNode
            );
          } else {
            // This is a direct function call like sphere(), cube(), etc.
            // Don't handle it here - let specialized visitors handle it
            this.errorHandler.logInfo(
              `[ExpressionVisitor.visitExpression] Found direct function call: ${unaryExprNode.text.substring(
                0,
                30
              )}. Skipping to let specialized visitors handle it.`,
              'ExpressionVisitor.visitExpression',
              unaryExprNode
            );
            return null;
          }
        } else {
          // This is just a simple expression wrapped in accessor_expression (like a number or variable)
          // Continue processing it as a unary expression
          this.errorHandler.logInfo(
            `[ExpressionVisitor.visitExpression] Found unary expression with accessor_expression (not a function call): ${unaryExprNode.text.substring(
              0,
              30
            )}. Processing as unary expression.`,
            'ExpressionVisitor.visitExpression',
            unaryExprNode
          );
        }
      }

      this.errorHandler.logInfo(
        `[ExpressionVisitor.visitExpression] Found unary expression: ${unaryExprNode.text.substring(
          0,
          30
        )}`,
        'ExpressionVisitor.visitExpression',
        unaryExprNode
      );
      return this.createExpressionNode(unaryExprNode);
    }

    return null;
  }

  /**
   * @method visitLetExpression
   * @description Visits a let expression node.
   * This method constructs an AST node for a 'let' expression, which allows
   * defining local variables (assignments) scoped to a body expression.
   * @param {TSNode} node - The Tree-sitter CST node representing the let expression.
   * @returns {ast.LetExpressionNode | ast.ErrorNode | null} The let expression node, or an error node if processing fails.
   * @override
   */
  override visitLetExpression(node: TSNode): ast.LetExpressionNode | ast.ErrorNode | null {
    this.errorHandler.logInfo(
      `[ExpressionVisitor.visitLetExpression] Processing let expression: ${node.text.substring(
        0,
        100
      )}`,
      'ExpressionVisitor.visitLetExpression',
      node
    );

    const processedAssignments: ast.AssignmentNode[] = [];
    // In OpenSCAD grammar, let_assignment nodes are direct children of let_expression
    const letAssignmentCstNodes: TSNode[] = node.children.filter(
      (c): c is TSNode => c !== null && c.type === 'let_assignment'
    );

    if (letAssignmentCstNodes.length === 0) {
      this.errorHandler.logInfo(
        `[ExpressionVisitor.visitLetExpression] No assignments found in let expression. CST: ${node.text}. ErrorCode: NO_ASSIGNMENTS_IN_LET_EXPRESSION`,
        'ExpressionVisitor.visitLetExpression',
        node
      );
      const parserError = this.errorHandler.createParserError(
        'No assignments found in let expression',
        {
          code: ErrorCode.LET_NO_ASSIGNMENTS_FOUND,
          line: getLocation(node).start.line,
          column: getLocation(node).start.column,
          nodeType: node.type,
          source: node.text,
        }
      );
      return {
        type: 'error',
        errorCode: parserError.code,
        message: parserError.message,
        location: getLocation(node),
        originalNodeType: parserError.context.nodeType ?? '',
        cstNodeText: parserError.context.source ?? '',
      };
    }

    for (const assignCstNode of letAssignmentCstNodes) {
      // assignCstNode is guaranteed to be non-null here due to the filter predicate.
      const assignmentAst = this.processLetAssignment(assignCstNode);

      if (!assignmentAst) {
        // processLetAssignment returning null means a structural issue in the assignment CST itself.
        this.errorHandler.logInfo(
          `[ExpressionVisitor.visitLetExpression] Failed to process let_assignment CST node (null return): ${assignCstNode.text}. ErrorCode: LET_ASSIGNMENT_PROCESSING_FAILED`,
          'ExpressionVisitor.visitLetExpression',
          assignCstNode
        );
        const parserError = this.errorHandler.createParserError(
          `Failed to process an assignment structure within let expression: ${assignCstNode.text}`,
          {
            code: ErrorCode.LET_ASSIGNMENT_PROCESSING_FAILED,
            line: getLocation(assignCstNode).start.line,
            column: getLocation(assignCstNode).start.column,
            nodeType: assignCstNode.type,
            source: assignCstNode.text,
          }
        );
        return {
          type: 'error',
          errorCode: parserError.code,
          message: parserError.message,
          location: getLocation(assignCstNode),
          originalNodeType: parserError.context.nodeType ?? '',
          cstNodeText: parserError.context.source ?? '',
        };
      }

      // At this point, assignmentAst is a valid AssignmentNode and its .value is a valid ExpressionNode
      processedAssignments.push(assignmentAst);
    }

    // Extract and process the body expression
    const bodyCstNode = node.childForFieldName('body');

    if (bodyCstNode) {
      this.errorHandler.logInfo(
        `[ExpressionVisitor.visitLetExpression] bodyCstNode - Type: ${
          bodyCstNode.type
        }, Text: ${bodyCstNode.text.substring(0, 100)}`,
        'visitLetExpression.bodyCstNode'
      );
    } else {
      this.errorHandler.logInfo(
        `[ExpressionVisitor.visitLetExpression] bodyCstNode is null (immediately after retrieval).`,
        'visitLetExpression.bodyCstNode'
      );
    }

    if (!bodyCstNode) {
      this.errorHandler.logInfo(
        `[ExpressionVisitor.visitLetExpression] No body found in let expression. CST: ${node.text}. ErrorCode: MISSING_LET_BODY`,
        'ExpressionVisitor.visitLetExpression',
        node
      );
      const parserError = this.errorHandler.createParserError('No body found in let expression', {
        code: ErrorCode.LET_NO_ASSIGNMENTS_FOUND,
        line: getLocation(node).start.line,
        column: getLocation(node).start.column,
        nodeType: node.type,
        source: node.text,
      });
      return {
        type: 'error',
        errorCode: parserError.code,
        message: parserError.message,
        location: getLocation(node),
        originalNodeType: parserError.context.nodeType ?? '',
        cstNodeText: parserError.context.source ?? '',
      };
    }

    this.errorHandler.logInfo(
      `[ExpressionVisitor.visitLetExpression] Calling dispatchSpecificExpression for bodyCstNode (Type: ${
        bodyCstNode.type
      }, Text: ${bodyCstNode.text.substring(0, 50)})`,
      'visitLetExpression.bodyDispatchCall'
    );
    const bodyExpressionAst = this.dispatchSpecificExpression(bodyCstNode);

    if (bodyExpressionAst) {
      if (bodyExpressionAst.type === 'error') {
        this.errorHandler.logInfo(
          `[ExpressionVisitor.visitLetExpression] dispatchSpecificExpression for body returned ErrorNode - Code: ${
            bodyExpressionAst.errorCode
          }, Message: ${bodyExpressionAst.message.substring(
            0,
            100
          )}, CST: ${bodyCstNode.text.substring(0, 100)}`,
          'visitLetExpression.bodyDispatchResult',
          bodyCstNode
        );
      } else {
        this.errorHandler.logInfo(
          `[ExpressionVisitor.visitLetExpression] dispatchSpecificExpression for body returned ExpressionNode - Type: ${
            (bodyExpressionAst as ast.ExpressionNode).expressionType
          }, CST: ${bodyCstNode.text.substring(0, 100)}`,
          'visitLetExpression.bodyDispatchResult',
          bodyCstNode
        );
      }
    } else {
      this.errorHandler.logInfo(
        `[ExpressionVisitor.visitLetExpression] dispatchSpecificExpression for body returned null for CST: ${bodyCstNode.text.substring(
          0,
          100
        )}.`,
        'visitLetExpression.bodyDispatchResult'
      );
    }

    if (!bodyExpressionAst) {
      this.errorHandler.logInfo(
        `[ExpressionVisitor.visitLetExpression] Failed to process body expression (dispatchSpecificExpression returned null). CST: ${bodyCstNode.text}. ErrorCode: LET_BODY_PROCESSING_FAILED_NULL`,
        'ExpressionVisitor.visitLetExpression',
        bodyCstNode
      );
      const parserError = this.errorHandler.createParserError(
        'Failed to process body expression in let expression (returned null)',
        {
          code: ErrorCode.LET_BODY_EXPRESSION_PARSE_FAILED,
          line: getLocation(bodyCstNode).start.line,
          column: getLocation(bodyCstNode).start.column,
          nodeType: bodyCstNode.type,
          source: bodyCstNode.text,
        }
      );
      return {
        type: 'error',
        errorCode: parserError.code,
        message: parserError.message,
        location: getLocation(bodyCstNode),
        originalNodeType: parserError.context.nodeType ?? '',
        cstNodeText: parserError.context.source ?? '',
      };
    }

    if (bodyExpressionAst.type === 'error') {
      this.errorHandler.logInfo(
        `[ExpressionVisitor.visitLetExpression] Error in let expression body. Propagating. ErrorCode: LET_BODY_ERROR_PROPAGATED`,
        'ExpressionVisitor.visitLetExpression',
        node
      );
      // Propagate the error from the body expression
      return {
        type: 'error',
        errorCode: ErrorCode.LET_BODY_EXPRESSION_ERROR_PROPAGATED,
        message: `Error in let body expression. Propagating.`,
        location: getLocation(bodyCstNode), // Location of the body that erred
        originalNodeType: bodyCstNode.type,
        cstNodeText: bodyCstNode.text,
        cause: bodyExpressionAst, // Include the original ErrorNode as cause
      };
    }

    // If we reach here, all assignments are valid, and bodyExpressionAst is a valid ExpressionNode.
    this.errorHandler.logInfo(
      `[ExpressionVisitor.visitLetExpression] Successfully processed let expression. Assignments: ${
        processedAssignments.length
      }, Body Type: ${bodyExpressionAst.type}`,
      'ExpressionVisitor.visitLetExpression'
    );

    return {
      type: 'expression',
      expressionType: 'let_expression',
      assignments: processedAssignments,
      expression: bodyExpressionAst as ast.ExpressionNode, // bodyExpressionAst is known to be an ExpressionNode here
      location: getLocation(node),
    };
  }

  /**
   * @method processLetAssignment
   * @description Visits a let assignment node.
   * @param {TSNode} node - The Tree-sitter CST node representing the let assignment.
   * @returns {ast.AssignmentNode | null} The assignment node, or null if the node cannot be processed.
   * @private
   */
  private processLetAssignment(node: TSNode): ast.AssignmentNode | null {
    this.errorHandler.logInfo(
      `[ExpressionVisitor.processLetAssignment] Processing let assignment: ${node.text}`,
      'ExpressionVisitor.processLetAssignment',
      node
    );

    // Extract variable name
    const nameNode = node.childForFieldName('name');
    if (!nameNode) {
      this.errorHandler.logInfo(
        `[ExpressionVisitor.processLetAssignment] No name found in let assignment`,
        'ExpressionVisitor.processLetAssignment',
        node
      );
      return null;
    }

    const variable: ast.IdentifierNode = {
      type: 'expression',
      expressionType: 'identifier',
      name: nameNode.text,
      location: getLocation(nameNode),
    };

    // Extract value expression
    const valueNode = node.childForFieldName('value');
    if (!valueNode) {
      this.errorHandler.logInfo(
        `[ExpressionVisitor.processLetAssignment] No value found in let assignment`,
        'ExpressionVisitor.processLetAssignment',
        node
      );
      return null;
    }

    const value = this.visitExpression(valueNode);
    if (!value) {
      this.errorHandler.logInfo(
        `[ExpressionVisitor.processLetAssignment] Failed to process value expression`,
        'ExpressionVisitor.processLetExpression',
        valueNode
      );
      return null;
    }

    // Check if the value is an ErrorNode
    if (value.type === 'error') {
      this.errorHandler.logInfo(
        `[ExpressionVisitor.processLetAssignment] Value expression resulted in error`,
        'ExpressionVisitor.processLetExpression',
        valueNode
      );
      return null;
    }

    // Add the assignment to the variable scope
    if (value && 'value' in value) {
      this.variableScope.set(variable.name, value.value);
    }

    return {
      type: 'assignment',
      variable,
      value: value as ast.ExpressionNode, // Safe cast since we checked it's not an ErrorNode
      location: getLocation(node),
    };
  }

  /**
   * @method visitVectorExpression
   * @description Visits a vector expression node.
   * @param {TSNode} node - The vector expression node to visit.
   * @returns {ast.VectorExpressionNode | ast.ErrorNode | null} The vector expression AST node, or null if the node cannot be processed.
   * @public
   */
  visitVectorExpression(node: TSNode): ast.VectorExpressionNode | ast.ErrorNode | null {
    this.errorHandler.logInfo(
      `[ExpressionVisitor.visitVectorExpression] Processing vector expression: ${node.text.substring(
        0,
        50
      )}`,
      'ExpressionVisitor.visitVectorExpression',
      node
    );

    // Process all elements in the vector
    const elements: ast.ExpressionNode[] = [];
    for (let i = 0; i < node.namedChildCount; i++) {
      const elementNode = node.namedChild(i);
      if (elementNode) {
        const elementExpr = this.dispatchSpecificExpression(elementNode);
        if (elementExpr && elementExpr.type === 'error') {
          // Propagate the error from the element
          return elementExpr;
        }
        if (elementExpr && this.isExpressionNode(elementExpr)) {
          // elementExpr is a valid ExpressionNode here
          elements.push(elementExpr);
        } else {
          // elementExpr is null or not an expression node, meaning a child node could not be processed as an expression
          this.errorHandler.logInfo(
            `[ExpressionVisitor.visitVectorExpression] Failed to process vector element at index ${i}: ${elementNode.text}. Element resolved to null.`,
            'ExpressionVisitor.visitVectorExpression',
            elementNode
          );
          return {
            type: 'error',
            errorCode: 'INVALID_VECTOR_ELEMENT',
            message: `Failed to process vector element at index ${i}: ${elementNode.text}. Element resolved to null.`,
            originalNodeType: node.type, // Or elementNode.type if more specific
            cstNodeText: node.text, // Or elementNode.text
            location: getLocation(elementNode),
          } as ast.ErrorNode;
        }
      }
    }

    // Create the vector expression node
    return {
      type: 'expression',
      expressionType: 'vector',
      elements,
      location: getLocation(node),
    };
  }

  /**
   * @method visitArrayExpression
   * @description Visits an array expression node.
   * @param {TSNode} node - The array expression node to visit.
   * @returns {ast.ArrayExpressionNode | ast.ErrorNode | null} The array expression AST node, or null if the node cannot be processed.
   * @public
   */
  visitArrayExpression(node: TSNode): ast.ArrayExpressionNode | ast.ErrorNode | null {
    this.errorHandler.logInfo(
      `[ExpressionVisitor.visitArrayExpression] Processing array expression: ${node.text.substring(
        0,
        50
      )}`,
      'ExpressionVisitor.visitArrayExpression',
      node
    );

    // Process all elements in the array
    const elements: ast.ExpressionNode[] = [];
    for (let i = 0; i < node.namedChildCount; i++) {
      const elementNode = node.namedChild(i);
      if (elementNode) {
        const elementExpr = this.dispatchSpecificExpression(elementNode);
        if (elementExpr && elementExpr.type === 'error') {
          // Propagate the error from the element
          return elementExpr;
        }
        if (elementExpr && this.isExpressionNode(elementExpr)) {
          // elementExpr is a valid ExpressionNode here
          elements.push(elementExpr);
        } else {
          // elementExpr is null, meaning a child node could not be processed
          this.errorHandler.logInfo(
            `[ExpressionVisitor.visitArrayExpression] Failed to process array element at index ${i}: ${elementNode.text}. Element resolved to null.`,
            'ExpressionVisitor.visitArrayExpression',
            elementNode
          );
          return {
            type: 'error',
            errorCode: 'INVALID_ARRAY_ELEMENT',
            message: `Failed to process array element at index ${i}: ${elementNode.text}. Element resolved to null.`,
            originalNodeType: node.type, // Or elementNode.type if more specific
            cstNodeText: node.text, // Or elementNode.text
            location: getLocation(elementNode),
          } as ast.ErrorNode;
        }
      }
    }

    // Create the array expression node
    return {
      type: 'expression',
      expressionType: 'array',
      items: elements, // Using 'items' instead of 'elements' to match the type definition
      location: getLocation(node),
    } as ast.ArrayExpressionNode;
  }

  /**
   * @method visitLiteral
   * @description Visits a literal node.
   * @param {TSNode} node - The literal node to visit.
   * @returns {ast.LiteralNode | ast.ErrorNode | null} The literal AST node, or null if the node cannot be processed.
   * @public
   */
  visitLiteral(node: TSNode): ast.LiteralNode | ast.ErrorNode | null {
    this.errorHandler.logInfo(
      `[ExpressionVisitor.visitLiteral] Processing literal: ${node.text}`,
      'ExpressionVisitor.visitLiteral',
      node
    );

    let value: number | string | boolean = ''; // Default to empty string
    let literalType: 'number' | 'string' | 'boolean' | 'undef' = 'string'; // Default to string

    // Determine the value and type based on the node type
    switch (node.type) {
      case 'number_literal':
      case 'number': // Handle both number_literal and number node types
        value = parseFloat(node.text);
        literalType = 'number';
        break;
      case 'string_literal':
      case 'string': {
        // Handle both string_literal and string node types
        // Remove quotes from string literals if they exist
        const text = node.text;
        if (text.startsWith('"') && text.endsWith('"')) {
          value = text.substring(1, text.length - 1);
        } else {
          value = text;
        }
        literalType = 'string';
        break;
      }
      case 'boolean_literal':
      case 'boolean': // Handle both boolean_literal and boolean node types
      case 'true': // Handle true literal node type
      case 'false': // Handle false literal node type
        value = node.text === 'true';
        literalType = 'boolean';
        break;
      case 'undef_literal':
      case 'undef': // Handle both undef_literal and undef node types
        value = 'undef';
        literalType = 'undef';
        break;
      default:
        // For unknown literal types, use the text as is
        value = node.text;
        break;
    }

    return {
      type: 'expression',
      expressionType: 'literal',
      literalType,
      value,
      location: getLocation(node),
    } as ast.LiteralNode;
  }

  /**
   * @method createASTNodeForFunction
   * @description Creates an AST node for a function (required by `BaseASTVisitor`).
   * @param {TSNode} node - The function node.
   * @param {string} _functionName - The function name.
   * @param {ast.Parameter[]} _args - The function arguments.
   * @returns {ast.ASTNode | null} The function call AST node, or null if not handled.
   * @protected
   * @override
   */
  protected override createASTNodeForFunction(
    node: TSNode,
    _functionName: string,
    _args: ast.Parameter[]
  ): ast.ASTNode | null {
    this.errorHandler.logWarning(
      `[ExpressionVisitor.createASTNodeForFunction] This method should not be directly called on ExpressionVisitor. Function definitions are not expressions. Offending node: ${
        node.type
      } '${node.text.substring(0, 30)}...'`,
      'ExpressionVisitor.createASTNodeForFunction',
      node
    );
    // ExpressionVisitor does not directly create AST nodes for function definitions.
    // Function calls are handled by FunctionCallVisitor.
    // If this method is called, it's likely a misrouted call or a misunderstanding of visitor responsibilities.
    return null;
  }
}
