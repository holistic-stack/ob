/**
 * @file Expression evaluation visitor for OpenSCAD parser
 *
 * This module implements the ExpressionVisitor class, which specializes in processing
 * OpenSCAD expressions and converting them to structured AST representations. Expressions
 * are fundamental to OpenSCAD's computational model, enabling mathematical calculations,
 * logical operations, and dynamic value generation.
 *
 * The ExpressionVisitor handles:
 * - **Binary Expressions**: Arithmetic (+, -, *, /, %), comparison (==, !=, <, <=, >, >=), and logical (&&, ||) operations
 * - **Unary Expressions**: Negation (-), logical not (!), and other prefix operators
 * - **Conditional Expressions**: Ternary operator (condition ? then : else) for conditional evaluation
 * - **Variable References**: Identifier resolution and variable access
 * - **Literal Values**: Numbers, strings, booleans, vectors, and undefined values
 * - **Array Operations**: Vector/array construction, indexing, and manipulation
 * - **Function Calls**: Function invocation within expression contexts
 * - **Parenthesized Expressions**: Grouping and precedence control
 *
 * Key features:
 * - **Expression Hierarchy Processing**: Handles complex nested expression structures
 * - **Operator Precedence**: Respects mathematical and logical operator precedence
 * - **Type-Safe Evaluation**: Maintains type information throughout expression processing
 * - **Error Recovery**: Graceful handling of malformed expressions with detailed error reporting
 * - **Performance Optimization**: Efficient dispatching and minimal overhead for simple expressions
 * - **Location Tracking**: Preserves source location information for debugging and IDE integration
 *
 * Expression processing patterns:
 * - **Simple Literals**: `42`, `"hello"`, `true`, `[1, 2, 3]` - direct value extraction
 * - **Binary Operations**: `a + b`, `x > y`, `p && q` - operator-based calculations
 * - **Nested Expressions**: `(a + b) * (c - d)` - complex hierarchical evaluation
 * - **Conditional Logic**: `x > 0 ? x : -x` - ternary conditional expressions
 * - **Function Integration**: `sin(angle)`, `len(vector)` - function calls within expressions
 * - **Variable Access**: `myVar`, `dimensions[0]` - identifier and array access
 *
 * The visitor implements a comprehensive dispatching strategy:
 * 1. **Type-Based Routing**: Routes nodes to appropriate handlers based on CST node type
 * 2. **Hierarchical Processing**: Handles expression precedence through recursive evaluation
 * 3. **Error Propagation**: Maintains error context throughout the expression tree
 *
 * @example Basic expression processing
 * ```typescript
 * import { ExpressionVisitor } from './expression-visitor';
 *
 * const visitor = new ExpressionVisitor(sourceCode, errorHandler);
 *
 * // Process arithmetic expression
 * const binaryExpr = visitor.visitBinaryExpression(binaryCST);
 * // Returns: { type: 'expression', expressionType: 'binary', operator: '+', left: ..., right: ... }
 *
 * // Process conditional expression
 * const conditionalExpr = visitor.visitConditionalExpression(conditionalCST);
 * // Returns: { type: 'expression', expressionType: 'conditional', condition: ..., thenBranch: ..., elseBranch: ... }
 * ```
 *
 * @example Complex expression hierarchies
 * ```typescript
 * // For OpenSCAD code: (x + y) * sin(angle) > threshold ? max_value : min_value
 * const complexExpr = visitor.dispatchSpecificExpression(complexCST);
 * // Returns nested expression structure with proper precedence and evaluation order
 *
 * // For vector operations: [x, y, z][index] + offset
 * const vectorExpr = visitor.dispatchSpecificExpression(vectorCST);
 * // Returns expression with array access and arithmetic operation
 * ```
 *
 * @example Error handling and recovery
 * ```typescript
 * const visitor = new ExpressionVisitor(sourceCode, errorHandler);
 *
 * // Process malformed expression
 * const result = visitor.dispatchSpecificExpression(malformedCST);
 *
 * if (!result) {
 *   const errors = errorHandler.getErrors();
 *   console.log('Expression processing errors:', errors);
 * }
 * ```
 *
 * @module expression-visitor
 * @since 0.1.0
 */

import { Node as TSNode } from 'web-tree-sitter';
import * as ast from '../ast-types.js';
import { BaseASTVisitor } from './base-ast-visitor.js';
import { getLocation } from '../utils/location-utils.js';
import { FunctionCallVisitor } from './expression-visitor/function-call-visitor.js';
import { ListComprehensionVisitor } from './expression-visitor/list-comprehension-visitor/list-comprehension-visitor.js';
import { RangeExpressionVisitor } from './expression-visitor/range-expression-visitor/range-expression-visitor.js';
import { ErrorHandler } from '../../error-handling/index.js';
import { findDescendantOfType } from '../utils/node-utils.js';
import { evaluateBinaryExpression } from '../evaluation/binary-expression-evaluator/binary-expression-evaluator.js';
import { ErrorCode } from '../../error-handling/types/error-types.js';

// List of reserved keywords that cannot be used as standalone expressions.
// Note: 'true', 'false', 'undef' are handled by visitLiteral.
// Keywords like 'let' are part of specific expression structures (e.g., LetExpressionNode)
// and are handled by their respective visitors if they appear in valid constructs.
// This list targets keywords that, if parsed as a simple identifier in an expression context, are invalid.
const RESERVED_KEYWORDS_AS_EXPRESSION_BLOCKLIST = new Set([
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
 * Visitor for processing OpenSCAD expressions with comprehensive type support.
 *
 * The ExpressionVisitor extends BaseASTVisitor to provide specialized handling for
 * all types of expressions in OpenSCAD. It follows tree-sitter visitor pattern
 * best practices and adheres to DRY, KISS, and SRP principles by directly handling
 * all expression types without relying on incompatible sub-visitors.
 *
 * This implementation provides:
 * - **Direct Expression Handling**: All expression types processed in a single visitor
 * - **Efficient Dispatching**: Type-based routing to appropriate processing methods
 * - **Error Context Preservation**: Maintains detailed error information throughout processing
 * - **Performance Optimization**: Minimal overhead for simple expressions
 * - **Comprehensive Coverage**: Supports all OpenSCAD expression constructs
 *
 * The visitor maintains a single FunctionCallVisitor dependency for handling function
 * calls within expressions, following the Single Responsibility Principle by keeping
 * only essential dependencies.
 *
 * @class ExpressionVisitor
 * @extends {BaseASTVisitor}
 * @since 0.1.0
 */
export class ExpressionVisitor extends BaseASTVisitor {
  private readonly functionCallVisitor: FunctionCallVisitor;
  private readonly listComprehensionVisitor: ListComprehensionVisitor;
  private readonly rangeExpressionVisitor: RangeExpressionVisitor;

  /**
   * Create a binary expression node from a CST node
   * @param node The binary expression CST node
   * @returns The binary expression AST node, an ErrorNode, or null if the node cannot be processed
   */
  createBinaryExpressionNode(
    node: TSNode
  ): ast.BinaryExpressionNode | ast.ErrorNode | null {
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
          [
            '+',
            '-',
            '*',
            '/',
            '%',
            '==',
            '!=',
            '<',
            '<=',
            '>',
            '>=',
            '&&',
            '||',
          ].includes(child.text) &&
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
        }, Op: ${operatorNode?.text}, Right: ${
          rightNode?.text
        }. CST: ${node.text.substring(0, 50)}`,
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
        leftExpr
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
        rightExpr
      );
      return rightExpr;
    }
    if (!rightExpr) {
      this.errorHandler.handleError(
        new Error(
          `Failed to process right operand (returned null): ${rightNode.text.substring(
            0,
            100
          )}`
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
      left: leftExpr,
      right: rightExpr,
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
   * Constructor for the ExpressionVisitor
   * @param source The source code
   * @param errorHandler The error handler
   */
  constructor(source: string, protected override errorHandler: ErrorHandler) {
    super(source, errorHandler);

    // Initialize specialized visitors
    // This follows SRP by keeping only essential dependencies
    this.functionCallVisitor = new FunctionCallVisitor(this, errorHandler);
    this.listComprehensionVisitor = new ListComprehensionVisitor(
      this,
      errorHandler
    );
    this.rangeExpressionVisitor = new RangeExpressionVisitor(
      this,
      errorHandler
    );
  }

  /**
   * Override visitStatement to only handle expression statements
   * This prevents the ExpressionVisitor from interfering with other statement types
   * that should be handled by specialized visitors (PrimitiveVisitor, TransformVisitor, etc.)
   *
   * @param node The statement node to visit
   * @returns The expression AST node or null if this is not an expression statement
   * @override
   */
  override visitStatement(node: TSNode): ast.ASTNode | null {
    // Only handle statements that contain expression nodes
    // Check for expression_statement, assignment_statement with expressions
    const expressionStatement = node.descendantsOfType(
      'expression_statement'
    )[0];
    if (expressionStatement) {
      // Find the expression within the expression statement
      const expression = expressionStatement.namedChild(0);
      if (expression) {
        return this.dispatchSpecificExpression(expression);
      }
    }

    // Check for assignment statements that contain expressions
    const assignmentStatement = node.descendantsOfType(
      'assignment_statement'
    )[0];
    if (assignmentStatement) {
      // Assignment statements are handled by AssignStatementVisitor, not ExpressionVisitor
      return null;
    }

    // Return null for all other statement types to let specialized visitors handle them
    return null;
  }

  /**
   * Dispatch an expression node to the appropriate handler method
   * @param node The expression node to dispatch
   * @returns The expression AST node or null if the node cannot be processed
   */
  public dispatchSpecificExpression(
    node: TSNode
  ): ast.ExpressionNode | ast.ErrorNode | null {
    this.errorHandler.logInfo(
      `[ExpressionVisitor.dispatchSpecificExpression] Dispatching node type: ${node.type}`
    );

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
      case 'accessor_expression':
        return this.visitAccessorExpression(node);
      case 'primary_expression':
        return this.visitPrimaryExpression(node);
      case 'list_comprehension':
        return this.listComprehensionVisitor.visitListComprehension(node);
      case 'range_expression':
        return this.rangeExpressionVisitor.visitRangeExpression(node);
      case 'module_instantiation':
      case 'call_expression': { // Handle call_expression similar to module_instantiation
        const result = this.functionCallVisitor.visit(node); // visit should return ExpressionNode | ErrorNode | null
        this.errorHandler.logInfo(
          `[ExpressionVisitor.dispatchSpecificExpression] ${
            node.type
          } result: ${
            result
              ? result.type === 'error'
                ? 'ErrorNode'
                : 'ExpressionNode'
              : 'null'
          }`
        );
        return result;
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
   * Create an expression node from a CST node
   * @param node The CST node
   * @returns The expression AST node or null if the node cannot be processed
   */
  createExpressionNode(
    node: TSNode
  ): ast.ExpressionNode | ast.ErrorNode | null {
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
            new Error(
              `Invalid binary expression structure: ${node.text.substring(
                0,
                100
              )}`
            ),
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
              `Failed to process operands in binary expression: ${node.text.substring(
                0,
                100
              )}`
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
        return {
          type: 'expression',
          expressionType: 'binary_expression',
          operator: operatorNode.text as ast.BinaryOperator,
          left: leftExpr, // Cast is safe due to checks above
          right: rightExpr, // Cast is safe due to checks above
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
            new Error(
              `Invalid unary expression structure: ${node.text.substring(
                0,
                100
              )}`
            ),
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
              `Failed to process operand in unary expression: ${node.text.substring(
                0,
                100
              )}`
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
            new Error(
              `Invalid conditional expression structure: ${node.text.substring(
                0,
                100
              )}`
            ),
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

        // At this point, all parts are valid ExpressionNodes
        // Create conditional expression node
        return {
          type: 'expression',
          expressionType: 'conditional',
          condition: conditionExpr, // Cast is safe due to checks above
          thenBranch: thenExpr, // Cast is safe due to checks above
          elseBranch: elseExpr, // Cast is safe due to checks above
          location: getLocation(node),
        };
      }
      case 'parenthesized_expression': {
        // Process parenthesized expression directly
        const innerNode = node.namedChild(0);

        if (!innerNode) {
          this.errorHandler.handleError(
            new Error(
              `Invalid parenthesized expression structure: ${node.text.substring(
                0,
                100
              )}`
            ),
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

        // Return the inner expression with the parenthesized location
        return {
          ...innerExpr,
          location: getLocation(node),
        };
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
        // Handle list comprehension expressions
        return this.listComprehensionVisitor.visitListComprehension(node);
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
   * Visit a binary expression node
   * @param node The binary expression CST node
   * @returns The binary expression AST node or null if the node cannot be processed
   */
  visitBinaryExpression(
    node: TSNode
  ): ast.BinaryExpressionNode | ast.ErrorNode | null {
    return this.createBinaryExpressionNode(node);
  }

  /**
   * Visit a conditional expression node (ternary operator: condition ? consequence : alternative)
   * @param node The conditional expression CST node
   * @returns The conditional expression AST node or null if the node cannot be processed
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

    // Extract the three parts of the conditional expression
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
      condition,
      thenBranch: consequence,
      elseBranch: alternative,
      location: getLocation(node),
    } as ast.ConditionalExpressionNode;
  }

  /**
   * Visit a unary expression node (e.g., -x, !flag)
   * @param node The unary expression CST node
   * @returns The unary expression AST node or null if the node cannot be processed
   */
  visitUnaryExpression(
    node: TSNode
  ): ast.UnaryExpressionNode | ast.ErrorNode | null {
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
        operandExpr
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
      operand: operandExpr,
      prefix: true, // All unary operators in OpenSCAD are prefix operators
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
   * Visit an expression node. This method determines the specific type of expression
   * and dispatches to the appropriate handler method.
   * @param node The expression node to visit (CST node)
   * @returns The expression AST node or null if the node cannot be processed
   */
  override visitExpression(
    node: TSNode
  ): ast.ExpressionNode | ast.ErrorNode | null {
    // Debug: Log the node structure
    this.errorHandler.logInfo(
      `[ExpressionVisitor.visitExpression] Processing expression: ${node.text.substring(
        0,
        30
      )}`,
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
      const accessorExpr = findDescendantOfType(
        unaryExprNode,
        'accessor_expression'
      );
      if (accessorExpr) {
        // Check if this accessor expression has an argument_list (making it a function call)
        const argumentListNode = findDescendantOfType(
          accessorExpr,
          'argument_list'
        );
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

    // Check for conditional expression
    const condExprNode = findDescendantOfType(node, 'conditional_expression');
    if (condExprNode) {
      this.errorHandler.logInfo(
        `[ExpressionVisitor.visitExpression] Found conditional expression: ${condExprNode.text.substring(
          0,
          30
        )}`,
        'ExpressionVisitor.visitExpression',
        condExprNode
      );
      return this.createExpressionNode(condExprNode);
    }

    // Check for parenthesized expression
    const parenExprNode = findDescendantOfType(
      node,
      'parenthesized_expression'
    );
    if (parenExprNode) {
      this.errorHandler.logInfo(
        `[ExpressionVisitor.visitExpression] Found parenthesized expression: ${parenExprNode.text.substring(
          0,
          30
        )}`,
        'ExpressionVisitor.visitExpression',
        parenExprNode
      );
      return this.createExpressionNode(parenExprNode);
    }

    // Check for vector expression
    const vectorExprNode = findDescendantOfType(node, 'vector_expression');
    if (vectorExprNode) {
      this.errorHandler.logInfo(
        `[ExpressionVisitor.visitExpression] Found vector expression: ${vectorExprNode.text.substring(
          0,
          30
        )}`,
        'ExpressionVisitor.visitExpression',
        vectorExprNode
      );
      return this.visitVectorExpression(vectorExprNode);
    }

    // Check for list comprehension
    const listComprehensionNode = findDescendantOfType(
      node,
      'list_comprehension'
    );
    if (listComprehensionNode) {
      this.errorHandler.logInfo(
        `[ExpressionVisitor.visitExpression] Found list comprehension: ${listComprehensionNode.text.substring(
          0,
          30
        )}`,
        'ExpressionVisitor.visitExpression',
        listComprehensionNode
      );
      return this.listComprehensionVisitor.visitListComprehension(
        listComprehensionNode
      );
    }

    // Check for module instantiation (function call)
    const moduleInstantiationNode = findDescendantOfType(
      node,
      'module_instantiation'
    );
    if (moduleInstantiationNode) {
      this.errorHandler.logInfo(
        `[ExpressionVisitor.visitExpression] Found module instantiation (function call): ${moduleInstantiationNode.text.substring(
          0,
          30
        )}`,
        'ExpressionVisitor.visitExpression',
        moduleInstantiationNode
      );
      return this.createExpressionNode(moduleInstantiationNode);
    }

    // Check for identifier (variable reference)
    const identifierNode = findDescendantOfType(node, 'identifier');
    if (identifierNode) {
      this.errorHandler.logInfo(
        `[ExpressionVisitor.visitExpression] Found identifier: ${identifierNode.text}`,
        'ExpressionVisitor.visitExpression',
        identifierNode
      );
      return this.visitIdentifier(identifierNode);
    }

    // Check for literal values
    const literalTypes = [
      'number_literal',
      'string_literal',
      'boolean_literal',
      'undef_literal',
    ];
    for (const literalType of literalTypes) {
      const literalNode = findDescendantOfType(node, literalType);
      if (literalNode) {
        this.errorHandler.logInfo(
          `[ExpressionVisitor.visitExpression] Found literal: ${literalNode.text}`,
          'ExpressionVisitor.visitExpression',
          literalNode
        );
        return this.visitLiteral(literalNode);
      }
    }

    // If we couldn't find a specific expression type, log a warning and return null
    this.errorHandler.logInfo(
      `[ExpressionVisitor.visitExpression] Could not determine expression type: ${node.text.substring(
        0,
        30
      )}`,
      'ExpressionVisitor.visitExpression',
      node
    );
    return null;
  }

  /**
   * Visit an accessor expression node (e.g., obj.prop)
   * @param node The accessor expression node to visit
   * @returns The accessor expression AST node or null if the node cannot be processed
   */
  override visitAccessorExpression(
    node: TSNode
  ): ast.AccessorExpressionNode | ast.ErrorNode | null {
    this.errorHandler.logInfo(
      `[ExpressionVisitor.visitAccessorExpression] Processing accessor expression: ${node.text.substring(
        0,
        50
      )}`,
      'ExpressionVisitor.visitAccessorExpression',
      node
    );

    // Check if this is actually a single expression wrapped in an accessor expression hierarchy node
    if (node.namedChildCount === 1) {
      const child = node.namedChild(0);
      if (child) {
        this.errorHandler.logInfo(
          `[ExpressionVisitor.visitAccessorExpression] Detected single expression wrapped as accessor expression. Delegating to child. Node: "${node.text}", Child: "${child.type}"`,
          'ExpressionVisitor.visitAccessorExpression',
          node
        );
        // Delegate to the child node
        return this.dispatchSpecificExpression(
          child
        ) as ast.AccessorExpressionNode;
      }
    }

    // Get the object and property nodes
    const objectNode = node.namedChild(0);
    const propertyNode = node.namedChild(1);

    if (!objectNode || !propertyNode) {
      this.errorHandler.handleError(
        new Error(
          `Invalid accessor expression structure: ${node.text.substring(
            0,
            100
          )}`
        ),
        'ExpressionVisitor.visitAccessorExpression',
        node
      );
      return null;
    }

    // Process the object
    const objectAST = this.dispatchSpecificExpression(objectNode);
    if (!objectAST) {
      this.errorHandler.handleError(
        new Error(
          `Failed to process object in accessor expression: ${node.text.substring(
            0,
            100
          )}`
        ),
        'ExpressionVisitor.visitAccessorExpression',
        node
      );
      return null;
    }

    // Check for errors or null in the object part before creating accessor expression node
    if (objectAST && objectAST.type === 'error') {
      return objectAST;
    }

    if (!objectAST) {
      this.errorHandler.logError(
        `[ExpressionVisitor.visitAccessorExpression] Missing object for accessor expression. Node: "${node.text}"`,
        'ExpressionVisitor.visitAccessorExpression',
        node
      );
      return {
        type: 'error',
        errorCode: 'MISSING_OBJECT_FOR_ACCESSOR',
        message: `Missing object for accessor expression. CST node text: ${node.text}`,
        originalNodeType: node.type,
        cstNodeText: node.text,
        location: getLocation(node),
      } as ast.ErrorNode;
    }

    // At this point, objectAST is a valid ExpressionNode
    return {
      type: 'expression',
      expressionType: 'accessor',
      object: objectAST, // Cast is safe due to checks above
      property: propertyNode.text,
      location: getLocation(node),
    };
  }

  /**
   * Visit a primary expression node
   * @param node The primary expression node to visit
   * @returns The expression AST node or null if the node cannot be processed
   */
  visitPrimaryExpression(
    node: TSNode
  ): ast.ExpressionNode | ast.ErrorNode | null {
    this.errorHandler.logInfo(
      `[ExpressionVisitor.visitPrimaryExpression] Processing primary expression: ${node.text.substring(
        0,
        50
      )}`,
      'ExpressionVisitor.visitPrimaryExpression',
      node
    );

    // Primary expressions are wrappers around other expressions
    // Find the actual expression inside
    for (let i = 0; i < node.namedChildCount; i++) {
      const child = node.namedChild(i);
      if (child) {
        const expr = this.dispatchSpecificExpression(child);
        if (expr) {
          return expr;
        }
      }
    }

    this.errorHandler.handleError(
      new Error(
        `Failed to process primary expression: ${node.text.substring(0, 100)}`
      ),
      'ExpressionVisitor.visitPrimaryExpression',
      node
    );
    return null;
  }

  /**
   * Visit an identifier node
   * @param node The identifier node to visit
   * @returns The variable node or null if the node cannot be processed
   */
  visitIdentifier(node: TSNode): ast.VariableNode | ast.ErrorNode | null {
    this.errorHandler.logInfo(
      `[ExpressionVisitor.visitIdentifier] Processing identifier: ${node.text}`,
      'ExpressionVisitor.visitIdentifier',
      node
    );

    const identifierName = node.text;

    // Check if the identifier is a reserved keyword that cannot be an expression
    if (RESERVED_KEYWORDS_AS_EXPRESSION_BLOCKLIST.has(identifierName)) {
      const message = `Reserved keyword '${identifierName}' cannot be used as a standalone expression.`;
      this.errorHandler.logError(
        message,
        'ExpressionVisitor.visitIdentifier',
        node
      );
      return {
        type: 'error',
        errorCode: ErrorCode.RESERVED_KEYWORD_AS_EXPRESSION,
        message,
        originalNodeType: node.type,
        cstNodeText: node.text,
        location: getLocation(node),
      } as ast.ErrorNode;
    }

    // Check if the identifier is a special variable (e.g., $fn, $fa, $fs)
    if (identifierName.startsWith('$')) {
      return {
        type: 'expression',
        expressionType: 'variable',
        name: identifierName,
        isSpecialVariable: true, // Mark as special variable
        location: getLocation(node),
      } as ast.VariableNode;
    }

    return {
      type: 'expression',
      expressionType: 'variable',
      name: identifierName,
      // isSpecialVariable will be implicitly undefined for non-special variables
      location: getLocation(node),
    } as ast.VariableNode;
  }

  /**
   * error, an ErrorNode is returned.
   *
   * Only if all assignments and the body expression are processed successfully
   * without errors will a valid LetExpressionNode be returned.
   *
   * @param node The Tree-sitter CST node representing the let expression.
   * @returns An `ast.LetExpressionNode` if parsing is successful,
   *          or an `ast.ErrorNode` if any part of the let expression is invalid.
   */
  override visitLetExpression(
    node: TSNode
  ): ast.LetExpressionNode | ast.ErrorNode {
    this.errorHandler.logInfo(
      `[ExpressionVisitor.visitLetExpression] Processing let expression: ${node.text.substring(
        0,
        80
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

      // Check if the value of the assignment is an ErrorNode
      // Ensure value exists and is an object before checking 'type' property
      if (
        assignmentAst.value &&
        typeof assignmentAst.value === 'object' &&
        'type' in assignmentAst.value &&
        assignmentAst.value.type === 'error'
      ) {
        this.errorHandler.logInfo(
          `[ExpressionVisitor.visitLetExpression] Error in let assignment value for '${assignmentAst.variable}'. Propagating. ErrorCode: LET_ASSIGNMENT_VALUE_ERROR`,
          'ExpressionVisitor.visitLetExpression',
          assignmentAst.value // Log the ErrorNode itself
        );
        // Propagate the error from the assignment's value
        return {
          type: 'error',
          errorCode: ErrorCode.LET_ASSIGNMENT_VALUE_ERROR_PROPAGATED,
          message: `Error in let assignment value for '${assignmentAst.variable}'. Propagating.`,
          location: getLocation(node), // Error location is the whole let expression
          originalNodeType: node.type,
          cstNodeText: node.text,
          cause: assignmentAst.value, // Include the original ErrorNode as cause
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
      const parserError = this.errorHandler.createParserError(
        'No body found in let expression',
        {
          code: ErrorCode.MISSING_LET_BODY,
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
          bodyExpressionAst // Log the full error node
        );
      } else {
        this.errorHandler.logInfo(
          `[ExpressionVisitor.visitLetExpression] dispatchSpecificExpression for body returned ExpressionNode - Type: ${
            bodyExpressionAst.expressionType
          }, CST: ${bodyCstNode.text.substring(0, 100)}`,
          'visitLetExpression.bodyDispatchResult',
          bodyExpressionAst // Log the full expression node
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
        bodyExpressionAst // Log the ErrorNode from body
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
      }, Body Type: ${
        bodyExpressionAst.expressionType ?? bodyExpressionAst.type
      }`,
      'ExpressionVisitor.visitLetExpression'
    );

    return {
      type: 'expression',
      expressionType: 'let_expression',
      assignments: processedAssignments,
      expression: bodyExpressionAst, // bodyExpressionAst is known to be an ExpressionNode here
      location: getLocation(node),
    };
  }
  /**
   * Visit a let assignment node.
   * This method constructs an AST node for a 'let' assignment, which allows
   * defining local variables (assignments) scoped to a body expression.
   *
   * It processes the variable name and the value expression within the assignment.
   * If either the variable name or the value expression fails to parse, or if the
   * value expression results in an error, this method will return null, indicating
   * a failure in processing the assignment.
   *
   * Only if both the variable name and the value expression are processed successfully
   * without errors will a valid AssignmentNode be returned.
   *
   * @param node The Tree-sitter CST node representing the let assignment.
   * @returns The assignment node or null if the node cannot be processed
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
        'ExpressionVisitor.processLetAssignment',
        valueNode
      );
      return null;
    }

    return {
      type: 'assignment',
      variable,
      value,
      location: getLocation(node),
    };
  }

  /**
   * Visit a vector expression node
   * @param node The vector expression node to visit
   * @returns The vector expression AST node or null if the node cannot be processed
   */
  visitVectorExpression(
    node: TSNode
  ): ast.VectorExpressionNode | ast.ErrorNode | null {
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
        if (elementExpr) {
          // elementExpr is a valid ExpressionNode here
          elements.push(elementExpr);
        } else {
          // elementExpr is null, meaning a child node could not be processed
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
   * Visit an array expression node
   * @param node The array expression node to visit
   * @returns The array expression AST node or null if the node cannot be processed
   */
  visitArrayExpression(
    node: TSNode
  ): ast.ArrayExpressionNode | ast.ErrorNode | null {
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
        if (elementExpr) {
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
   * Visit a literal node
   * @param node The literal node to visit
   * @returns The literal AST node or null if the node cannot be processed
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
   * Create an AST node for a function (required by BaseASTVisitor)
   * @param node The function node
   * @param functionName The function name
   * @param args The function arguments
   * @returns The function call AST node or null if not handled
   */
  createASTNodeForFunction(
    node: TSNode,
    functionName: string,
    args: ast.Parameter[]
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
