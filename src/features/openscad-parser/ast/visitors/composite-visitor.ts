/**
 * @file Composite visitor implementation for OpenSCAD parser
 *
 * This module implements the CompositeVisitor class, which serves as the central orchestrator
 * for AST generation using the Composite design pattern. The CompositeVisitor coordinates
 * multiple specialized visitors, each responsible for handling specific aspects of the
 * OpenSCAD language syntax.
 *
 * The composite pattern provides several key benefits:
 * - **Modular Architecture**: Each visitor focuses on a specific domain (primitives, transforms, etc.)
 * - **Extensibility**: New visitors can be added without modifying existing code
 * - **Chain of Responsibility**: Visitors are tried in sequence until one can handle the node
 * - **Centralized Coordination**: Single point of control for the entire AST generation process
 * - **Error Handling**: Consistent error reporting and logging throughout the process
 *
 * The CompositeVisitor implements a two-tier delegation strategy:
 * 1. **Direct Routing**: Common node types are routed directly to specific methods
 * 2. **Visitor Delegation**: Unknown or specialized nodes are delegated to child visitors
 *
 * Supported visitor types:
 * - **PrimitiveVisitor**: Handles basic shapes (cube, sphere, cylinder, etc.)
 * - **TransformVisitor**: Handles transformations (translate, rotate, scale, etc.)
 * - **CSGVisitor**: Handles CSG operations (union, difference, intersection)
 * - **ModuleVisitor**: Handles module definitions and instantiations
 * - **ControlStructureVisitor**: Handles if/else, for loops, let expressions
 * - **ExpressionVisitor**: Handles mathematical and logical expressions
 * - **VariableVisitor**: Handles variable assignments and references
 *
 * @example Basic usage
 * ```typescript
 * import { CompositeVisitor } from './composite-visitor';
 *
 * // Create specialized visitors
 * const primitiveVisitor = new PrimitiveVisitor(sourceCode, errorHandler);
 * const transformVisitor = new TransformVisitor(sourceCode, compositeVisitor, errorHandler);
 * const csgVisitor = new CSGVisitor(sourceCode, compositeVisitor, errorHandler);
 *
 * // Create composite visitor
 * const compositeVisitor = new CompositeVisitor([
 *   primitiveVisitor,
 *   transformVisitor,
 *   csgVisitor
 * ], errorHandler);
 *
 * // Process AST
 * const astNode = compositeVisitor.visitNode(cstNode);
 * ```
 *
 * @example Error handling integration
 * ```typescript
 * const errorHandler = new ErrorHandler({
 *   throwErrors: false,
 *   minSeverity: Severity.WARNING
 * });
 *
 * const visitor = new CompositeVisitor(visitors, errorHandler);
 * const result = visitor.visitNode(node);
 *
 * if (errorHandler.getErrors().length > 0) {
 *   console.log('Processing errors:', errorHandler.getErrors());
 * }
 * ```
 *
 * @module composite-visitor
 * @since 0.1.0
 */

import type { Node as TSNode } from 'web-tree-sitter';
import type { ErrorHandler } from '../../error-handling/index.js'; // Added ErrorHandler import
import type * as ast from '../ast-types.js';
import type { ASTVisitor } from './ast-visitor.js';

/**
 * A composite visitor that implements the visitor pattern and delegates to specialized visitors.
 *
 * The CompositeVisitor serves as a central coordinator in the AST generation process, implementing
 * the Composite design pattern to organize multiple specialized visitors. It acts as both a router
 * and delegator, examining each node's type and either handling it directly through a type-specific
 * visit method, or delegating to one of its child visitors that can process the node.
 *
 * This approach allows for modular, extensible parsing where each visitor can focus on a specific
 * aspect of the OpenSCAD language (primitives, transformations, expressions, etc.) while the
 * CompositeVisitor handles the orchestration of the parsing process.
 *
 * @class CompositeVisitor
 * @implements {ASTVisitor}
 * @since 0.1.0
 */
export class CompositeVisitor implements ASTVisitor {
  /**
   * Creates a new CompositeVisitor that delegates to specialized visitors.
   *
   * The CompositeVisitor combines multiple specialized visitors, allowing each to focus on
   * a specific part of the OpenSCAD syntax. When a node is encountered, the CompositeVisitor
   * either routes it to a specific visit method based on its type, or tries each of its
   * child visitors in sequence until one can process the node.
   *
   * @param visitors - Array of specialized visitors that implement the ASTVisitor interface
   * @param errorHandler - Error handler for reporting issues during AST generation
   *
   * @example
   * ```ts
   * // Create specialized visitors
   * const primitiveVisitor = new PrimitiveVisitor(source, errorHandler);
   * const transformVisitor = new TransformVisitor(source, compositeVisitor, errorHandler);
   *
   * // Create a composite visitor with the specialized visitors
   * const compositeVisitor = new CompositeVisitor(
   *   [primitiveVisitor, transformVisitor],
   *   errorHandler
   * );
   * ```
   *
   * @since 0.1.0
   */
  constructor(
    protected visitors: ASTVisitor[],
    protected errorHandler: ErrorHandler // Added errorHandler
  ) {}

  /**
   * Visit a node and return the corresponding AST node
   * @param node The node to visit
   * @returns The AST node or null if the node cannot be processed
   */
  visitNode(node: TSNode): ast.ASTNode | null {
    // Route to specific visitor methods based on node type
    switch (node.type) {
      case 'assignment_statement':
        return this.visitAssignmentStatement(node);
      case 'assert_statement':
        return this.visitAssertStatement(node);
      case 'echo_statement':
        return this.visitEchoStatement(node);
      case 'statement':
        return this.visitStatement(node);
      case 'module_instantiation':
        return this.visitModuleInstantiation(node);
      case 'module_definition':
        return this.visitModuleDefinition(node);
      case 'function_definition':
        return this.visitFunctionDefinition(node);
      case 'if_statement':
        return this.visitIfStatement(node);
      case 'for_statement':
        return this.visitForStatement(node);
      case 'let_expression':
        return this.visitLetExpression(node);
      case 'conditional_expression':
        return this.visitConditionalExpression(node);
      case 'expression_statement':
        return this.visitExpressionStatement(node);
      case 'accessor_expression':
        return this.visitAccessorExpression(node);
      case 'call_expression':
        return this.visitCallExpression(node);
      case 'expression':
        return this.visitExpression(node);
      case 'block': {
        // For block nodes, return the first child that produces a result
        const blockResults = this.visitBlock(node);
        return blockResults.length > 0 ? (blockResults[0] ?? null) : null;
      }
      default:
        // For unknown node types, try each visitor in sequence
        for (const visitor of this.visitors) {
          const result = visitor.visitNode(node);
          if (result) {
            return result;
          }
        }
        return null;
    }
  }

  /**
   * Visit all children of a node and return the corresponding AST nodes
   * @param node The node whose children to visit
   * @returns An array of AST nodes
   */
  visitChildren(node: TSNode): ast.ASTNode[] {
    const children: ast.ASTNode[] = [];

    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (!child) continue;

      const astNode = this.visitNode(child);
      if (astNode) {
        children.push(astNode);
      }
    }
    return children;
  }

  /**
   * NOTE: This method is intentionally empty as it's been moved to the dedicated implementation below
   * to avoid duplicates while maintaining method order in the file.
   */

  /**
   * Processes a statement node in the OpenSCAD syntax tree.
   *
   * Statements are the fundamental execution units in OpenSCAD code, including
   * module instantiations, assignments, conditionals, and loops. This method
   * examines the statement node and delegates to specialized visitors that can
   * handle the specific statement type.
   *
   * @param node - The statement Tree-sitter node to process
   * @returns The corresponding AST node, or null if no visitor can process the statement
   *
   * @example Simple Statement
   * ```ts
   * // For a statement like 'cube(10);'
   * const statementNode = tree.rootNode.childForFieldName('statement');
   * const astNode = visitor.visitStatement(statementNode);
   * // Returns a ModuleInstantiationNode with type 'cube'
   * ```
   *
   * @example Complex Statement
   * ```ts
   * // For a complex statement like 'if (x > 10) { cube(x); }'
   * const ifStatementNode = tree.rootNode.childForFieldName('statement');
   * const astNode = visitor.visitStatement(ifStatementNode);
   * // Returns an IfNode with condition and consequent children
   * ```
   *
   * @since 0.1.0
   */
  visitStatement(node: TSNode): ast.ASTNode | null {
    // Try each visitor in sequence
    for (const visitor of this.visitors) {
      const result = visitor.visitStatement(node);
      if (result) {
        return result;
      }
    }
    return null;
  }

  /**
   * Processes a block node containing multiple statements in the OpenSCAD syntax tree.
   *
   * Blocks in OpenSCAD are collections of statements enclosed in curly braces, commonly
   * used in module bodies, if/else bodies, and for loop bodies. This method delegates
   * to visitChildren to process each statement in the block sequentially.
   *
   * @param node - The block Tree-sitter node to process
   * @returns An array of AST nodes representing the statements in the block
   *
   * @example Module Body
   * ```ts
   * // For a module body like 'module test() { cube(10); sphere(5); }'
   * const blockNode = moduleDefNode.childForFieldName('body');
   * const bodyNodes = visitor.visitBlock(blockNode);
   * // Returns an array containing the cube and sphere module instantiation nodes
   * ```
   *
   * @example Empty Block
   * ```ts
   * // For an empty block like 'if(x>0) { }'
   * const emptyBlockNode = ifNode.childForFieldName('consequent');
   * const nodes = visitor.visitBlock(emptyBlockNode);
   * // Returns an empty array []
   * ```
   *
   * @since 0.1.0
   */
  visitBlock(node: TSNode): ast.ASTNode[] {
    // Delegate to visitChildren to process each statement in the block
    return this.visitChildren(node);
  }

  /**
   * Visits and processes a module instantiation node in the OpenSCAD syntax tree.
   *
   * Module instantiations are the core building blocks of OpenSCAD code, representing
   * calls to both built-in modules (like cube, sphere) and user-defined modules.
   * This method delegates the processing to specialized visitors capable of handling
   * different types of module instantiations (primitives, transformations, etc.).
   *
   * @param node - The module_instantiation Tree-sitter node to process
   * @returns The AST node representing the module instantiation, or null if no visitor can process it
   *
   * @example
   * ```ts
   * // For processing a primitive instantiation like 'cube(10);'
   * const moduleNode = tree.rootNode.child(0); // Assuming first child is the module instantiation
   * const astNode = visitor.visitModuleInstantiation(moduleNode);
   * // Returns a ModuleInstantiationNode with type 'cube'
   * ```
   *
   * @example
   * ```ts
   * // For processing a transformation like 'translate([0,0,5]) sphere(10);'
   * const transformNode = tree.rootNode.child(0);
   * const astNode = visitor.visitModuleInstantiation(transformNode);
   * // Returns a TransformNode with a child ModuleInstantiationNode
   * ```
   *
   * @since 0.1.0
   */
  visitModuleInstantiation(node: TSNode): ast.ASTNode | null {
    // Try each visitor in sequence
    for (const visitor of this.visitors) {
      const result = visitor.visitModuleInstantiation(node);
      if (result) {
        return result;
      }
    }
    return null;
  }

  /**
   * Visit a module definition node
   * @param node The module definition node to visit
   * @returns The module definition AST node or null if the node cannot be processed
   */
  visitModuleDefinition(node: TSNode): ast.ModuleDefinitionNode | null {
    // Try each visitor in sequence
    for (const visitor of this.visitors) {
      const result = visitor.visitModuleDefinition(node);
      if (result) {
        return result;
      }
    }
    return null;
  }

  /**
   * Visit a function definition node
   * @param node The function definition node to visit
   * @returns The function definition AST node or null if the node cannot be processed
   */
  visitFunctionDefinition(node: TSNode): ast.FunctionDefinitionNode | null {
    // Try each visitor in sequence
    for (const visitor of this.visitors) {
      const result = visitor.visitFunctionDefinition(node);
      if (result) {
        return result;
      }
    }
    return null;
  }

  /**
   * Visit an if statement node
   * @param node The if statement node to visit
   * @returns The if AST node or null if the node cannot be processed
   */
  visitIfStatement(node: TSNode): ast.IfNode | null {
    // Try each visitor in sequence
    for (const visitor of this.visitors) {
      const result = visitor.visitIfStatement(node);
      if (result) {
        return result;
      }
    }
    return null;
  }

  /**
   * Visit a for statement node
   * @param node The for statement node to visit
   * @returns The for loop AST node, error node, or null if the node cannot be processed
   */
  visitForStatement(node: TSNode): ast.ForLoopNode | ast.ErrorNode | null {
    // Try each visitor in sequence
    for (const visitor of this.visitors) {
      const result = visitor.visitForStatement(node);
      if (result) {
        return result;
      }
    }
    return null;
  }

  /**
   * Visit a let expression node
   * @param node The let expression node to visit
   * @returns The let AST node or null if the node cannot be processed
   */
  visitLetExpression(node: TSNode): ast.LetNode | ast.LetExpressionNode | ast.ErrorNode | null {
    // Try each visitor in sequence
    for (const visitor of this.visitors) {
      const result = visitor.visitLetExpression(node);
      if (result) {
        return result;
      }
    }
    return null;
  }

  /**
   * Visit a conditional expression node
   * @param node The conditional expression node to visit
   * @returns The expression AST node or null if the node cannot be processed
   */
  visitConditionalExpression(node: TSNode): ast.ExpressionNode | ast.ErrorNode | null {
    // Try each visitor in sequence
    for (const visitor of this.visitors) {
      const result = visitor.visitConditionalExpression(node);
      if (result) {
        return result;
      }
    }
    return null;
  }

  /**
   * Visit an assignment statement node
   * @param node The assignment statement node to visit
   * @returns The AST node or null if the node cannot be processed
   */
  visitAssignmentStatement(node: TSNode): ast.ASTNode | null {
    // Try each visitor in sequence
    for (const visitor of this.visitors) {
      const result = visitor.visitAssignmentStatement(node);
      if (result) {
        return result;
      }
    }
    return null;
  }

  /**
   * Visit an assert statement node
   * @param node The assert statement node to visit
   * @returns The assert statement AST node or null if the node cannot be processed
   */
  visitAssertStatement(node: TSNode): ast.AssertStatementNode | null {
    // Try each visitor in sequence
    for (const visitor of this.visitors) {
      const result = visitor.visitAssertStatement(node);
      if (result) {
        return result;
      }
    }
    return null;
  }

  /**
   * Visit an echo statement node
   * @param node The echo statement node to visit
   * @returns The echo statement AST node or null if the node cannot be processed
   */
  visitEchoStatement(node: TSNode): ast.EchoStatementNode | null {
    // Try each visitor in sequence
    for (const visitor of this.visitors) {
      const result = visitor.visitEchoStatement(node);
      if (result) {
        return result;
      }
    }
    return null;
  }

  /**
   * Visit an expression statement node
   * @param node The expression statement node to visit
   * @returns The AST node or null if the node cannot be processed
   */
  visitExpressionStatement(node: TSNode): ast.ASTNode | null {
    // Try each visitor in sequence
    for (const visitor of this.visitors) {
      const result = visitor.visitExpressionStatement(node);
      if (result) {
        return result;
      }
    }
    return null;
  }

  /**
   * Visit an accessor expression node (function calls like cube(10))
   * @param node The accessor expression node to visit
   * @returns The AST node or null if the node cannot be processed
   */
  visitAccessorExpression(node: TSNode): ast.ASTNode | null {
    // Try each visitor in sequence
    for (const visitor of this.visitors) {
      const result = visitor.visitAccessorExpression(node);
      if (result) {
        return result;
      }
    }
    return null;
  }

  /**
   * Visit a call expression node
   * @param node The call expression node to visit
   * @returns The AST node or null if the node cannot be processed
   */
  visitCallExpression(node: TSNode): ast.ASTNode | null {
    // Try each visitor in sequence
    for (const visitor of this.visitors) {
      const result = visitor.visitCallExpression(node);
      if (result) {
        return result;
      }
    }
    return null;
  }

  /**
   * Visit an expression node
   * @param node The expression node to visit
   * @returns The AST node or null if the node cannot be processed
   */
  visitExpression(node: TSNode): ast.ASTNode | null {
    // Try each visitor in sequence
    for (const visitor of this.visitors) {
      const result = visitor.visitExpression(node);
      if (result) {
        return result;
      }
    }
    return null;
  }
}
