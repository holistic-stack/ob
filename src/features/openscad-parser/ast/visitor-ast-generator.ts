/**
 * @file Visitor-based AST generator for OpenSCAD parser
 *
 * This module provides the central orchestrator for converting Tree-sitter Concrete Syntax Trees (CST)
 * into structured Abstract Syntax Trees (AST) using the Visitor pattern. The VisitorASTGenerator
 * coordinates multiple specialized visitors to handle different aspects of the OpenSCAD language.
 *
 * The AST generation process follows a layered architecture:
 * 1. **QueryVisitor**: Entry point that traverses the CST and delegates to appropriate visitors
 * 2. **CompositeVisitor**: Coordinates multiple specialized visitors using chain of responsibility
 * 3. **Specialized Visitors**: Handle specific language constructs (primitives, transforms, CSG, etc.)
 * 4. **AST Nodes**: Structured output representing the semantic meaning of the code
 *
 * Key features:
 * - Modular visitor architecture for extensibility and maintainability
 * - Comprehensive error handling and reporting throughout the generation process
 * - Support for all OpenSCAD language constructs including primitives, transforms, and expressions
 * - Type-safe AST generation with proper TypeScript typing
 * - Incremental parsing support for editor integration
 *
 * @example Basic AST generation
 * ```typescript
 * import { VisitorASTGenerator } from './visitor-ast-generator';
 *
 * // Parse OpenSCAD code with Tree-sitter
 * const tree = parser.parse('cube(10);');
 *
 * // Create AST generator
 * const generator = new VisitorASTGenerator(
 *   tree,
 *   'cube(10);',
 *   openscadLanguage,
 *   errorHandler
 * );
 *
 * // Generate structured AST
 * const ast = generator.generate();
 * // Returns: [{ type: 'cube', size: 10, center: false }]
 * ```
 *
 * @module visitor-ast-generator
 * @since 0.1.0
 */

import { Tree } from 'web-tree-sitter'; // TSNode is not used in this file after removing findChildOfType
import * as ast from './ast-types.js';
import type { ASTVisitor } from './visitors/ast-visitor.js';
import { CompositeVisitor } from './visitors/composite-visitor.js';
import { PrimitiveVisitor } from './visitors/primitive-visitor.js';
import { TransformVisitor } from './visitors/transform-visitor.js';
import { CSGVisitor } from './visitors/csg-visitor.js';
import { ModuleVisitor } from './visitors/module-visitor.js';
import { FunctionVisitor } from './visitors/function-visitor.js';
import { ControlStructureVisitor } from './visitors/control-structure-visitor.js';
import { ExpressionVisitor } from './visitors/expression-visitor.js';
import { VariableVisitor } from './visitors/variable-visitor.js';
import { AssertStatementVisitor } from './visitors/assert-statement-visitor/assert-statement-visitor.js';
import { EchoStatementVisitor } from './visitors/echo-statement-visitor/echo-statement-visitor.js';
import { AssignStatementVisitor } from './visitors/assign-statement-visitor/assign-statement-visitor.js';
import { QueryVisitor } from './visitors/query-visitor.js';
import { ErrorHandler } from '../error-handling/index.js';

// This function is not used in this file
// /**
//  * Find a child node of a specific type
//  * @param node The parent node
//  * @param type The type of child to find
//  * @returns The child node or null if not found
//  */
// function findChildOfType(node: TSNode, type: string): TSNode | null {
//   for (let i = 0; i < node.childCount; i++) {
//     const child = node.child(i);
//     if (child && child.type === type) {
//       return child;
//     }
//   }
//   return null;
// }

/**
 * Converts a Tree-sitter Concrete Syntax Tree (CST) to an OpenSCAD Abstract Syntax Tree (AST)
 * using the visitor pattern.
 * 
 * The VisitorASTGenerator is the central orchestrator in the AST generation process, serving as
 * the bridge between Tree-sitter's low-level parse tree and the high-level semantic AST. It 
 * implements a layered visitor architecture where:
 * 
 * 1. A QueryVisitor provides the entry point for CST traversal
 * 2. A CompositeVisitor delegates to specialized visitors based on node types
 * 3. Type-specific visitors (PrimitiveVisitor, TransformVisitor, etc.) handle particular OpenSCAD constructs
 * 
 * This design provides several benefits:
 * - Separation of concerns: Each visitor focuses on a specific aspect of the language
 * - Extensibility: New language features can be supported by adding new visitors
 * - Maintainability: Changes to one syntax element don't affect the handling of others
 * 
 * The AST generation follows this workflow:
 * ```
 * Tree-sitter CST → QueryVisitor → CompositeVisitor → Specialized Visitors → AST Nodes
 * ```
 * 
 * @example Parsing and AST Generation Flow
 * ```typescript
 * // 1. Parse OpenSCAD code with Tree-sitter
 * const parser = new Parser();
 * parser.setLanguage(openscadLanguage);
 * const tree = parser.parse('cube(10);');
 * 
 * // 2. Create error handler for reporting issues
 * const errorHandler = new ErrorHandler();
 * 
 * // 3. Create the AST generator
 * const generator = new VisitorASTGenerator(
 *   tree,                // Tree-sitter parse tree
 *   'cube(10);',         // Original source code
 *   openscadLanguage,    // Language definition
 *   errorHandler         // Error reporting
 * );
 * 
 * // 4. Generate the AST
 * const ast = generator.generate();
 * 
 * // 5. Use the AST for analysis, transformation, etc.
 * console.log(JSON.stringify(ast, null, 2));
 * ```
 * 
 * @file Defines the VisitorASTGenerator class that serves as the entry point for AST generation
 * @since 0.1.0
 */
export class VisitorASTGenerator {
  private visitor: ASTVisitor;
  private queryVisitor: QueryVisitor;
  private previousAST: ast.ASTNode[] | null = null;

  /**
   * Creates a new VisitorASTGenerator instance and initializes the visitor hierarchy.
   * 
   * This constructor sets up a complex visitor structure where specialized visitors
   * are combined into a composite visitor. The QueryVisitor is used as the main entry point
   * which delegates to the appropriate specialized visitor based on node types.
   *
   * @param tree - The Tree-sitter parse tree (CST) to convert to an AST
   * @param source - The original OpenSCAD source code string
   * @param language - The Tree-sitter language object for OpenSCAD
   * @param errorHandler - Error handler for reporting issues during AST generation
   * 
   * @example
   * ```ts
   * // Create a generator with a parsed Tree-sitter tree
   * const parser = new Parser();
   * parser.setLanguage(openscadLanguage);
   * const tree = parser.parse('cube(10);');
   * 
   * const errorHandler = new ConsoleErrorHandler();
   * const generator = new VisitorASTGenerator(tree, 'cube(10);', openscadLanguage, errorHandler);
   * ```
   * 
   * @since 0.1.0
   */
  constructor(
    private tree: Tree,
    private source: string,
    private language: unknown,
    private errorHandler: ErrorHandler // Added ErrorHandler
  ) {
    // Create a composite visitor that delegates to specialized visitors
    // Create the composite visitor first so we can pass it to visitors that need it
    const compositeVisitor = new CompositeVisitor([], this.errorHandler); // Added errorHandler

    // Order matters here - PrimitiveVisitor should be first to handle primitive shapes
    const transformVisitor = new TransformVisitor(this.source, compositeVisitor, this.errorHandler); // Added errorHandler, used this.source

    // Create expression visitor first since other visitors may depend on it
    const expressionVisitor = new ExpressionVisitor(this.source, this.errorHandler);

    // Add all visitors to the composite visitor
    // Order matters: definition visitors must come before instantiation visitors
    compositeVisitor['visitors'] = [
      new AssignStatementVisitor(this.source, this.errorHandler), // Handle assign statements first
      new AssertStatementVisitor(this.source, this.errorHandler),
      // Module and function definitions must be processed before instantiations
      new ModuleVisitor(this.source, this.errorHandler), // Process module definitions first
      new FunctionVisitor(this.source, this.errorHandler), // Process function definitions first
      // Specialized visitors for module instantiations come after definition visitors
      new PrimitiveVisitor(this.source, this.errorHandler),
      transformVisitor, // transformVisitor instance already has errorHandler
      new CSGVisitor(this.source, this.errorHandler),
      new ControlStructureVisitor(this.source, this.errorHandler),
      // General statement visitor comes after specialized visitors
      new EchoStatementVisitor(this.source, this.errorHandler),
      expressionVisitor,
      new VariableVisitor(this.source, this.errorHandler),
    ];

    // Create a query visitor that uses the composite visitor
    this.queryVisitor = new QueryVisitor(
      this.source,
      this.tree, // Used this.tree
      this.language,
      compositeVisitor,
      this.errorHandler // Added errorHandler
    );

    // Use the query visitor as the main visitor
    this.visitor = this.queryVisitor;
  }

  /**
   * Generates an Abstract Syntax Tree (AST) from the Tree-sitter Concrete Syntax Tree (CST).
   * 
   * This method traverses the CST starting from the root node and delegates the processing
   * of each node to the appropriate visitor. The result is a structured AST that represents
   * the semantic meaning of the OpenSCAD code in a format that's easier to analyze and transform
   * than the raw parse tree.
   *
   * @returns An array of top-level AST nodes representing the OpenSCAD program
   * @throws Error if visitor processing fails during AST generation
   * 
   * @example Simple Program
   * ```ts
   * // For source code: 'cube(10);'
   * const ast = generator.generate();
   * // Returns an array with a single ModuleInstantiationNode for 'cube'
   * ```
   * 
   * @example Complex Program
   * ```ts
   * // For a program with multiple statements
   * const source = `
   *   cube(10);
   *   translate([0, 0, 10]) {
   *     sphere(5);
   *   }
   * `;
   * const generator = new VisitorASTGenerator(tree, source, language, errorHandler);
   * const ast = generator.generate();
   * // Returns an array with multiple AST nodes representing the program structure
   * ```
   * 
   * @since 0.1.0
   */
  public generate(): ast.ASTNode[] {
    // Get the root node of the Tree-sitter tree
    const rootNode = this.tree.rootNode;
    if (!rootNode) {
      this.errorHandler.logWarning('No root node found in CST. Returning empty AST.');
      return [];
    }

    // Root node information for debugging
    this.errorHandler.logInfo(
      `Processing root node of type: ${rootNode.type} with ${rootNode.childCount} children`
    );

    // Visit all children of the root node to build the AST
    const statements: ast.ASTNode[] = [];
    for (let i = 0; i < rootNode.childCount; i++) {
      const child = rootNode.child(i);
      if (!child) continue;

      // Use the visitor to process the child node
      const astNode = this.visitor.visitNode(child);
      if (astNode) {
        statements.push(astNode);
      }
    }

    this.errorHandler.logInfo(`AST generation complete. Created ${statements.length} top-level nodes.`);
    return statements;
  }
}
