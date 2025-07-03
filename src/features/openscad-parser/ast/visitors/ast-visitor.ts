/**
 * @file AST visitor interface for OpenSCAD parser
 *
 * This module defines the core ASTVisitor interface that establishes the contract for transforming
 * Tree-sitter Concrete Syntax Trees (CST) into structured Abstract Syntax Trees (AST). The visitor
 * pattern provides a clean, extensible architecture for handling different types of OpenSCAD syntax
 * nodes while maintaining separation of concerns.
 *
 * The ASTVisitor interface serves as the foundation for the entire AST generation system:
 * - Defines visit methods for all OpenSCAD syntax constructs
 * - Provides type-safe transformation contracts
 * - Enables modular visitor implementations through composition
 * - Supports extensibility for new language features
 * - Maintains consistent error handling patterns
 *
 * Key architectural principles:
 * - **Single Responsibility**: Each visit method handles one specific node type
 * - **Open/Closed Principle**: New visitors can be added without modifying existing code
 * - **Type Safety**: All transformations are statically typed with proper return types
 * - **Null Safety**: Methods return null for unsupported or malformed nodes
 * - **Composability**: Visitors can be combined using the composite pattern
 *
 * The visitor pattern implementation supports:
 * - Primitive shapes: cube, sphere, cylinder, etc.
 * - Transform operations: translate, rotate, scale, etc.
 * - CSG operations: union, difference, intersection
 * - Control structures: if/else, for loops, let expressions
 * - Module and function definitions
 * - Variable assignments and expressions
 *
 * @example Basic visitor implementation
 * ```typescript
 * class MyVisitor implements ASTVisitor {
 *   visitNode(node: TSNode): ast.ASTNode | null {
 *     switch (node.type) {
 *       case 'module_instantiation':
 *         return this.visitModuleInstantiation(node);
 *       case 'statement':
 *         return this.visitStatement(node);
 *       default:
 *         return null;
 *     }
 *   }
 *
 *   visitModuleInstantiation(node: TSNode): ast.ASTNode | null {
 *     // Transform module instantiation to AST node
 *     return new ModuleInstantiationNode(...);
 *   }
 * }
 * ```
 *
 * @example Visitor composition
 * ```typescript
 * const compositeVisitor = new CompositeVisitor([
 *   new PrimitiveVisitor(),
 *   new TransformVisitor(),
 *   new CSGVisitor()
 * ]);
 *
 * const astNode = compositeVisitor.visitNode(cstNode);
 * ```
 *
 * @module ast-visitor
 * @since 0.1.0
 */

import { Node as TSNode } from 'web-tree-sitter';
import * as ast from '../ast-types.js';

/**
 * Interface defining the visitor pattern contract for transforming a Tree-sitter CST into an OpenSCAD AST.
 *
 * The ASTVisitor interface follows the visitor design pattern, providing specialized visit methods
 * for each type of syntax node in the OpenSCAD language. Implementing classes are responsible for
 * traversing the CST (Concrete Syntax Tree) and generating corresponding AST (Abstract Syntax Tree) nodes.
 *
 * This interface is the foundation of the OpenSCAD parser's AST generation system, allowing
 * for a clean separation between tree traversal logic and node transformation logic.
 *
 * @interface ASTVisitor
 * @since 0.1.0
 */
export interface ASTVisitor {
  // Core visit methods
  /**
   * Visits a Tree-sitter node and transforms it into an appropriate AST node.
   * 
   * This is the primary entry point for the visitor pattern. When a node is visited,
   * the visitor examines the node type and delegates to the appropriate specialized
   * visit method based on the node's syntax type. If the node's type is not recognized
   * or cannot be processed, the method returns null.
   * 
   * @param node - The Tree-sitter syntax node to transform
   * @returns The corresponding AST node, or null if the node cannot be processed
   * 
   * @example
   * ```ts
   * // Visiting a module instantiation node (e.g., 'cube(10);')
   * const tsNode = rootNode.child(0); // Get first child of program
   * const astNode = visitor.visitNode(tsNode);
   * // Returns a ModuleInstantiationNode with type 'cube'
   * ```
   * 
   * @example
   * ```ts
   * // Handling unknown or unsupported nodes
   * const unknownNode = new TSNode(); // Some unrecognized node
   * const result = visitor.visitNode(unknownNode);
   * // Returns null since the node type is not supported
   * ```
   * 
   * @since 0.1.0
   */
  visitNode(node: TSNode): ast.ASTNode | null;

  /**
   * Visits all children of a node and returns an array of the resulting AST nodes.
   * 
   * This method is commonly used when processing block-level constructs like module bodies,
   * if/else blocks, or for loops where multiple statements need to be processed. It iterates
   * through each child of the provided node, calls visitNode() on each one, and collects
   * the non-null results into an array.
   * 
   * @param node - The Tree-sitter node whose children should be visited
   * @returns An array of AST nodes created from the children (empty if no valid children)
   * 
   * @example Block Processing
   * ```ts
   * // Processing a block node containing multiple statements
   * const blockNode = moduleNode.childForFieldName('body');
   * const bodyStatements = visitor.visitChildren(blockNode);
   * // Returns an array of AST nodes for each statement in the block
   * ```
   * 
   * @example Empty Node
   * ```ts
   * // Processing a node with no children or only unsupported children
   * const emptyNode = new TSNode(); // Node with no children
   * const results = visitor.visitChildren(emptyNode);
   * // Returns an empty array []
   * ```
   * 
   * @since 0.1.0
   */
  visitChildren(node: TSNode): ast.ASTNode[];

  // Specific node type visitors
  /**
   * Visit a module instantiation node
   * @param node The module instantiation node to visit
   * @returns The AST node or null if the node cannot be processed
   */
  visitModuleInstantiation(node: TSNode): ast.ASTNode | null;

  /**
   * Visit a statement node
   * @param node The statement node to visit
   * @returns The AST node or null if the node cannot be processed
   */
  visitStatement(node: TSNode): ast.ASTNode | null;

  /**
   * Visit a block node
   * @param node The block node to visit
   * @returns An array of AST nodes
   */
  visitBlock(node: TSNode): ast.ASTNode[];

  /**
   * Visit a module definition node
   * @param node The module definition node to visit
   * @returns The module definition AST node or null if the node cannot be processed
   */
  visitModuleDefinition(node: TSNode): ast.ModuleDefinitionNode | null;

  /**
   * Visit a function definition node
   * @param node The function definition node to visit
   * @returns The function definition AST node or null if the node cannot be processed
   */
  visitFunctionDefinition(node: TSNode): ast.FunctionDefinitionNode | null;

  /**
   * Visit an if statement node
   * @param node The if statement node to visit
   * @returns The if AST node or null if the node cannot be processed
   */
  visitIfStatement(node: TSNode): ast.IfNode | null;

  /**
   * Visit a for statement node
   * @param node The for statement node to visit
   * @returns The for loop AST node or null if the node cannot be processed
   */
  visitForStatement(node: TSNode): ast.ForLoopNode | ast.ErrorNode | null;

  /**
   * Visit a let expression node
   * @param node The let expression node to visit
   * @returns The let AST node or null if the node cannot be processed
   */
  visitLetExpression(node: TSNode): ast.LetNode | ast.LetExpressionNode | ast.ErrorNode | null;

  /**
   * Visit a conditional expression node
   * @param node The conditional expression node to visit
   * @returns The expression AST node or null if the node cannot be processed
   */
  visitConditionalExpression(node: TSNode): ast.ExpressionNode | ast.ErrorNode | null;

  /**
   * Visit an assignment statement node
   * @param node The assignment statement node to visit
   * @returns The AST node or null if the node cannot be processed
   */
  visitAssignmentStatement(node: TSNode): ast.ASTNode | null;

  /**
   * Visit an assert statement node
   * @param node The assert statement node to visit
   * @returns The assert statement AST node or null if the node cannot be processed
   */
  visitAssertStatement(node: TSNode): ast.AssertStatementNode | null;

  /**
   * Visit an echo statement node
   * @param node The echo statement node to visit
   * @returns The echo statement AST node or null if the node cannot be processed
   */
  visitEchoStatement(node: TSNode): ast.EchoStatementNode | null;

  /**
   * Visit an expression statement node
   * @param node The expression statement node to visit
   * @returns The AST node or null if the node cannot be processed
   */
  visitExpressionStatement(node: TSNode): ast.ASTNode | null;

  /**
   * Visit an accessor expression node (function calls like cube(10))
   * @param node The accessor expression node to visit
   * @returns The AST node or null if the node cannot be processed
   */
  visitAccessorExpression(node: TSNode): ast.ASTNode | null;

  /**
   * Visit a call expression node
   * @param node The call expression node to visit
   * @returns The AST node or null if the node cannot be processed
   */
  visitCallExpression(node: TSNode): ast.ASTNode | null;

  /**
   * Visit an expression node
   * @param node The expression node to visit
   * @returns The AST node or null if the node cannot be processed
   */
  visitExpression(node: TSNode): ast.ASTNode | ast.ErrorNode | null;
}
