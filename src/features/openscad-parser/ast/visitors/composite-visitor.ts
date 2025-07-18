/**
 * @file composite-visitor.ts
 * @description This file implements the `CompositeVisitor` class, which serves as the central orchestrator
 * for AST generation using the Composite design pattern. The `CompositeVisitor` coordinates
 * multiple specialized visitors, each responsible for handling specific aspects of the
 * OpenSCAD language syntax.
 *
 * @architectural_decision
 * The composite pattern is used here to create a tree structure of visitors. This allows clients
 * to treat individual visitors and compositions of visitors uniformly. The `CompositeVisitor`
 * acts as a router, delegating the processing of a CST node to the first specialized visitor
 * in its collection that can handle that node type. This approach provides several key benefits:
 * - **Modularity**: Each visitor has a single responsibility (e.g., `PrimitiveVisitor` for shapes).
 * - **Extensibility**: New language features can be supported by adding new visitors without changing existing code.
 * - **Chain of Responsibility**: Visitors are tried in a specific order, allowing for a fallback mechanism.
 * - **Centralized Coordination**: The `CompositeVisitor` provides a single point of control for the entire AST generation process.
 *
 * @example
 * ```typescript
 * import { CompositeVisitor } from './composite-visitor';
 * import { PrimitiveVisitor } from './primitive-visitor';
 * import { TransformVisitor } from './transform-visitor';
 * import { ErrorHandler } from '../../error-handling';
 * import { Parser, Language } from 'web-tree-sitter';
 *
 * async function main() {
 *   // 1. Setup parser and get CST
 *   await Parser.init();
 *   const parser = new Parser();
 *   const openscadLanguage = await Language.load('tree-sitter-openscad.wasm');
 *   parser.setLanguage(openscadLanguage);
 *   const sourceCode = 'translate([10, 0, 0]) cube(10);';
 *   const tree = parser.parse(sourceCode);
 *
 *   // 2. Create an error handler
 *   const errorHandler = new ErrorHandler();
 *
 *   // 3. Create specialized visitors
 *   const primitiveVisitor = new PrimitiveVisitor(sourceCode, errorHandler);
 *   const transformVisitor = new TransformVisitor(sourceCode, errorHandler);
 *
 *   // 4. Create a composite visitor
 *   const compositeVisitor = new CompositeVisitor(
 *     [primitiveVisitor, transformVisitor],
 *     errorHandler
 *   );
 *
 *   // 5. Process the root node of the CST
 *   const astNode = compositeVisitor.visitNode(tree.rootNode);
 *   console.log(JSON.stringify(astNode, null, 2));
 *
 *   // 6. Clean up
 *   parser.delete();
 * }
 *
 * main();
 * ```
 *
 * @integration
 * The `CompositeVisitor` is instantiated within the `VisitorASTGenerator`. It is the core component
 * that connects the high-level CST traversal with the low-level, specialized visitors that actually
 * create the AST nodes.
 */

import type { Node as TSNode } from 'web-tree-sitter';
import type { ErrorHandler } from '../../error-handling/index.js'; // Added ErrorHandler import
import type * as ast from '../ast-types.js';
import type { ASTVisitor } from './ast-visitor.js';

/**
 * @class CompositeVisitor
 * @implements {ASTVisitor}
 * @description A composite visitor that implements the visitor pattern and delegates to specialized visitors.
 * It acts as a central coordinator in the AST generation process, examining each node's type and either
 * handling it directly through a type-specific visit method, or delegating to one of its child visitors.
 */
export class CompositeVisitor implements ASTVisitor {
  /**
   * @constructor
   * @description Creates a new CompositeVisitor that delegates to specialized visitors.
   * @param {ASTVisitor[]} visitors - An array of specialized visitors that implement the `ASTVisitor` interface.
   * @param {ErrorHandler} errorHandler - An error handler for reporting issues during AST generation.
   */
  constructor(
    protected visitors: ASTVisitor[],
    protected errorHandler: ErrorHandler // Added errorHandler
  ) {}

  /**
   * @method visitNode
   * @description Visits a CST node and returns the corresponding AST node.
   * This method acts as a router, delegating to more specific `visit` methods based on the node type.
   * If no specific method exists, it delegates to the collection of specialized visitors.
   * @param {TSNode} node - The node to visit.
   * @returns {ast.ASTNode | null} The AST node, or null if the node cannot be processed.
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
   * @method visitChildren
   * @description Visits all children of a node and returns the corresponding AST nodes.
   * @param {TSNode} node - The node whose children to visit.
   * @returns {ast.ASTNode[]} An array of AST nodes.
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
   * @method visitStatement
   * @description Processes a statement node in the OpenSCAD syntax tree.
   * It delegates to specialized visitors that can handle the specific statement type.
   * @param {TSNode} node - The statement Tree-sitter node to process.
   * @returns {ast.ASTNode | null} The corresponding AST node, or null if no visitor can process the statement.
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
   * @method visitBlock
   * @description Processes a block node containing multiple statements.
   * It delegates to `visitChildren` to process each statement in the block sequentially.
   * @param {TSNode} node - The block Tree-sitter node to process.
   * @returns {ast.ASTNode[]} An array of AST nodes representing the statements in the block.
   */
  visitBlock(node: TSNode): ast.ASTNode[] {
    // Delegate to visitChildren to process each statement in the block
    return this.visitChildren(node);
  }

  /**
   * @method visitModuleInstantiation
   * @description Visits and processes a module instantiation node.
   * It delegates the processing to specialized visitors capable of handling
   * different types of module instantiations (primitives, transformations, etc.).
   * @param {TSNode} node - The module_instantiation Tree-sitter node to process.
   * @returns {ast.ASTNode | null} The AST node representing the module instantiation, or null if no visitor can process it.
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
   * @method visitModuleDefinition
   * @description Visits a module definition node.
   * @param {TSNode} node - The module definition node to visit.
   * @returns {ast.ModuleDefinitionNode | null} The module definition AST node or null if the node cannot be processed.
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
   * @method visitFunctionDefinition
   * @description Visits a function definition node.
   * @param {TSNode} node - The function definition node to visit.
   * @returns {ast.FunctionDefinitionNode | null} The function definition AST node or null if the node cannot be processed.
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
   * @method visitIfStatement
   * @description Visits an if statement node.
   * @param {TSNode} node - The if statement node to visit.
   * @returns {ast.IfNode | null} The if AST node or null if the node cannot be processed.
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
   * @method visitForStatement
   * @description Visits a for statement node.
   * @param {TSNode} node - The for statement node to visit.
   * @returns {ast.ForLoopNode | ast.ErrorNode | null} The for loop AST node, error node, or null if the node cannot be processed.
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
   * @method visitLetExpression
   * @description Visits a let expression node.
   * @param {TSNode} node - The let expression node to visit.
   * @returns {ast.LetNode | ast.LetExpressionNode | ast.ErrorNode | null} The let AST node or null if the node cannot be processed.
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
   * @method visitConditionalExpression
   * @description Visits a conditional expression node.
   * @param {TSNode} node - The conditional expression node to visit.
   * @returns {ast.ExpressionNode | ast.ErrorNode | null} The expression AST node or null if the node cannot be processed.
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
   * @method visitAssignmentStatement
   * @description Visits an assignment statement node.
   * @param {TSNode} node - The assignment statement node to visit.
   * @returns {ast.ASTNode | null} The AST node or null if the node cannot be processed.
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
   * @method visitAssertStatement
   * @description Visits an assert statement node.
   * @param {TSNode} node - The assert statement node to visit.
   * @returns {ast.AssertStatementNode | null} The assert statement AST node or null if the node cannot be processed.
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
   * @method visitEchoStatement
   * @description Visits an echo statement node.
   * @param {TSNode} node - The echo statement node to visit.
   * @returns {ast.EchoStatementNode | null} The echo statement AST node or null if the node cannot be processed.
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
   * @method visitExpressionStatement
   * @description Visits an expression statement node.
   * @param {TSNode} node - The expression statement node to visit.
   * @returns {ast.ASTNode | null} The AST node or null if the node cannot be processed.
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
   * @method visitAccessorExpression
   * @description Visits an accessor expression node (function calls like cube(10)).
   * @param {TSNode} node - The accessor expression node to visit.
   * @returns {ast.ASTNode | null} The AST node or null if the node cannot be processed.
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
   * @method visitCallExpression
   * @description Visits a call expression node.
   * @param {TSNode} node - The call expression node to visit.
   * @returns {ast.ASTNode | null} The AST node or null if the node cannot be processed.
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
   * @method visitExpression
   * @description Visits an expression node.
   * @param {TSNode} node - The expression node to visit.
   * @returns {ast.ASTNode | null} The AST node or null if the node cannot be processed.
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
