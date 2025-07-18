/**
 * @file binary-expression.ts
 * @description This file defines the `BinaryExpression` class, which represents a binary operation
 * (e.g., addition, subtraction, comparison, logical AND/OR) in the OpenSCAD Abstract Syntax Tree (AST).
 * It extends the `Expression` base class.
 *
 * @architectural_decision
 * The `BinaryExpression` class encapsulates the structure of a binary operation, holding references
 * to its left and right operands (which are also `Expression` nodes) and the operator itself.
 * This clear structure facilitates recursive evaluation and transformation of expressions.
 * The `accept` method is implemented to support the Visitor pattern, allowing different operations
 * (like evaluation or code generation) to be performed on binary expressions in a decoupled manner.
 *
 * @example
 * ```typescript
 * import { BinaryExpression } from './binary-expression';
 * import { LiteralExpression } from './literal-expression'; // Assuming LiteralExpression exists
 * import { NodeLocation } from '../../../node-location';
 *
 * // Representing the expression: `5 + 3`
 * const location = { /* ... some location data ... * / };
 * const leftOperand = new LiteralExpression(location, 5);
 * const rightOperand = new LiteralExpression(location, 3);
 * const addition = new BinaryExpression(location, leftOperand, '+', rightOperand);
 *
 * console.log(addition.toString()); // Expected: (5 + 3)
 *
 * // Example with a visitor (assuming a simple evaluator visitor)
 * // class ExpressionEvaluatorVisitor {
 * //   visitBinaryExpression(node: BinaryExpression): number {
 * //     const leftVal = node.left.accept(this);
 * //     const rightVal = node.right.accept(this);
 * //     switch (node.operator) {
 * //       case '+': return leftVal + rightVal;
 * //       // ... other operators
 * //       default: return 0;
 * //     }
 * //   }
 * //   // ... other visit methods for LiteralExpression, etc.
 * // }
 * // const evaluator = new ExpressionEvaluatorVisitor();
 * // const result = addition.accept(evaluator);
 * // console.log(result); // Expected: 8
 * ```
 */

import type { NodeLocation } from '../../../node-location.js';
import { Expression } from '../expression.js';

/**
 * @type BinaryOperator
 * @description Defines the set of supported binary operators in OpenSCAD.
 * This includes arithmetic, comparison, and logical operators.
 */
type BinaryOperator =
  | '+'
  | '-'
  | '*'
  | '/'
  | '%' // Arithmetic
  | '=='
  | '!='
  | '<'
  | '<='
  | '>'
  | '>=' // Comparison
  | '&&'; // Logical

/**
 * @class BinaryExpression
 * @description Represents a binary expression in the OpenSCAD AST.
 * A binary expression consists of a left operand, an operator, and a right operand.
 */
export class BinaryExpression extends Expression {
  /**
   * @constructor
   * @description Creates an instance of `BinaryExpression`.
   *
   * @param {NodeLocation} location - The source code location of this expression.
   * @param {Expression} left - The left-hand side operand of the binary expression.
   * @param {BinaryOperator} operator - The operator of the binary expression (e.g., '+', '-', '&&').
   * @param {Expression} right - The right-hand side operand of the binary expression.
   */
  constructor(
    location: NodeLocation,
    public readonly left: Expression,
    public readonly operator: BinaryOperator,
    public readonly right: Expression
  ) {
    super(location);
  }

  /**
   * @method toString
   * @description Returns a string representation of the binary expression.
   * This is useful for debugging and visualizing the AST structure.
   *
   * @returns {string} A string in the format `(left_operand operator right_operand)`.
   */
  override toString(): string {
    return `(${this.left} ${this.operator} ${this.right})`;
  }

  /**
   * @method accept
   * @description Implements the `accept` method of the Visitor pattern for `BinaryExpression`.
   * It calls the `visitBinaryExpression` method on the provided visitor.
   *
   * @template T - The return type of the visitor's `visitBinaryExpression` method.
   * @param {{ visitBinaryExpression(node: BinaryExpression): T }} visitor - The visitor object with a `visitBinaryExpression` method.
   * @returns {T} The result of the visitor's operation on this node.
   */
  accept<T>(visitor: { visitBinaryExpression(node: BinaryExpression): T }): T {
    return visitor.visitBinaryExpression(this);
  }
}
