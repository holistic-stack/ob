/**
 * @file ast-node.ts
 * @description This file defines the abstract base class for all Abstract Syntax Tree (AST) nodes
 * in the OpenSCAD parser. It establishes a common interface for AST nodes, including source location
 * and a mechanism for implementing the Visitor pattern.
 *
 * @architectural_decision
 * The `AstNode` class serves as the root of the AST hierarchy. By making it an abstract class with a
 * `location` property and an abstract `accept` method, it enforces a consistent structure across all
 * concrete AST node implementations. The `accept` method is a cornerstone of the Visitor pattern,
 * allowing for decoupled operations on the AST (e.g., code generation, analysis) without modifying
 * the node classes themselves. This promotes extensibility and maintainability of the AST.
 *
 * @example
 * ```typescript
 * // Example of a concrete AST node extending AstNode
 * import { AstNode } from './ast-node';
 * import { NodeLocation } from '../../node-location';
 *
 * class CubeNode extends AstNode {
 *   constructor(location: NodeLocation, public size: number) {
 *     super(location);
 *   }
 *
 *   // Implement the accept method for the Visitor pattern
 *   accept<T>(visitor: any): T {
 *     return visitor.visitCubeNode(this);
 *   }
 * }
 *
 * // Usage:
 * const location = { /* ... some location data ... * / };
 * const cube = new CubeNode(location, 10);
 * console.log(cube.location); // Accesses the inherited location property
 * ```
 */

import type { NodeLocation } from '../../node-location.js';

/**
 * @abstract
 * @class AstNode
 * @description The abstract base class for all nodes in the Abstract Syntax Tree (AST).
 * All concrete AST node classes must extend this class.
 */
export abstract class AstNode {
  /**
   * @constructor
   * @description Creates an instance of `AstNode`.
   * @param {NodeLocation} location - The source code location of this AST node.
   */
  constructor(public readonly location: NodeLocation) {}

  /**
   * @method accept
   * @description Implements the `accept` method of the Visitor pattern.
   * This method allows a visitor to process the AST node.
   * Concrete subclasses must implement this method to call the appropriate `visit` method on the visitor.
   *
   * @template T - The return type of the visitor's `visit` method.
   * @param {unknown} visitor - The visitor object that will process this node.
   * @returns {T} The result of the visitor's operation on this node.
   */
  abstract accept<T>(visitor: unknown): T;
}
