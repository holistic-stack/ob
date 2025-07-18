/**
 * @file expression.ts
 * @description This file defines the abstract `Expression` class, which serves as the base for all expression-related
 * AST nodes in the OpenSCAD parser. It extends `AstNode` and enforces the implementation of the Visitor pattern's `accept` method.
 *
 * @architectural_decision
 * The `Expression` class provides a common interface for all nodes that represent an evaluable expression in OpenSCAD.
 * By extending `AstNode`, it inherits the `location` property, ensuring that all expressions can be traced back to their
 * source code. The abstract `accept` method ensures that any concrete expression node can be processed by a visitor,
 * allowing for flexible and extensible evaluation and analysis of expressions without modifying the expression classes themselves.
 *
 * @example
 * ```typescript
 * import { Expression } from './expression';
 * import { NodeLocation } from '../../node-location';
 * import type { ASTVisitor } from '../visitors/ast-visitor';
 *
 * // Example of a concrete expression node extending Expression
 * class LiteralExpression extends Expression {
 *   constructor(location: NodeLocation, public value: number | string | boolean) {
 *     super(location);
 *   }
 *
 *   // Concrete implementation of the accept method
 *   accept<T>(visitor: ASTVisitor<T>): T {
 *     // Assuming ASTVisitor has a method like visitLiteralExpression
 *     return visitor.visitLiteralExpression(this);
 *   }
 * }
 *
 * // Usage:
 * const location = { /* ... some location data ... * / };
 * const literal = new LiteralExpression(location, 123);
 * console.log(literal.value); // 123
 * ```
 */

import { AstNode } from './ast-node.js';

/**
 * @abstract
 * @class Expression
 * @description An abstract base class for all expression nodes in the Abstract Syntax Tree (AST).
 * All concrete expression nodes (e.g., literals, binary operations, function calls) must extend this class.
 */
export abstract class Expression extends AstNode {
  /**
   * @method accept
   * @description Implements the `accept` method of the Visitor pattern for expression nodes.
   * Concrete subclasses must implement this method to call the appropriate `visit` method on the visitor,
   * allowing for polymorphic processing of different expression types.
   *
   * @template T - The return type of the visitor's `visit` method.
   * @param {unknown} visitor - The visitor object that will process this expression node.
   * @returns {T} The result of the visitor's operation on this expression node.
   */
  abstract override accept<T>(visitor: unknown): T;
}
