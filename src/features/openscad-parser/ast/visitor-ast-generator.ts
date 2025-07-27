/**
 * @file visitor-ast-generator.ts
 * @description This file contains the `VisitorASTGenerator` class, which is the central orchestrator for converting
 * a Tree-sitter Concrete Syntax Tree (CST) into a structured Abstract Syntax Tree (AST) using the Visitor pattern.
 * It coordinates a hierarchy of specialized visitors to handle different parts of the OpenSCAD language.
 *
 * @architectural_decision
 * The AST generation process is designed around a visitor architecture. A `CompositeVisitor` serves as the entry point,
 * routing each node to the appropriate specialized visitor (e.g., `PrimitiveVisitor`, `TransformVisitor`). This separation
 * of concerns makes the system highly modular, maintainable, and extensible.
 *
 * @example
 * ```typescript
 * import { OpenscadParser, SimpleErrorHandler } from '../openscad-parser';
 * import { VisitorASTGenerator } from './visitor-ast-generator';
 * import { Language, Parser, Tree } from 'web-tree-sitter';
 *
 * async function generateAst() {
 *   // 1. Initialize the Tree-sitter parser and load the OpenSCAD language
 *   await Parser.init();
 *   const parser = new Parser();
 *   const openscadLanguage = await Language.load('tree-sitter-openscad.wasm');
 *   parser.setLanguage(openscadLanguage);
 *
 *   // 2. Parse the source code to get a Concrete Syntax Tree (CST)
 *   const sourceCode = 'translate([10, 0, 0]) cube(10);';
 *   const tree: Tree = parser.parse(sourceCode);
 *
 *   // 3. Create an error handler
 *   const errorHandler = new SimpleErrorHandler();
 *
 *   // 4. Instantiate the AST generator with the CST and other dependencies
 *   const generator = new VisitorASTGenerator(tree, sourceCode, openscadLanguage, errorHandler);
 *
 *   // 5. Generate the AST
 *   const ast = generator.generate();
 *
 *   // 6. Log the resulting AST
 *   console.log(JSON.stringify(ast, null, 2));
 *
 *   // 7. Clean up resources
 *   generator.dispose();
 *   parser.delete();
 * }
 *
 * generateAst();
 * ```
 *
 * @integration
 * The `VisitorASTGenerator` is instantiated and used by the `OpenscadParser` class.
 * The `OpenscadParser` is responsible for managing the Tree-sitter parser and language lifecycle,
 * and it passes the necessary dependencies to this generator. The generated AST is then consumed
 * by the application's state management (Zustand) and forwarded to the rendering engine.
 */

import type { Language, Tree } from 'web-tree-sitter';
import type { ErrorHandler } from '../error-handling/index.js';
import type * as ast from './ast-types.js';
import { AssertStatementVisitor } from './visitors/assert-statement-visitor/assert-statement-visitor.js';
import { AssignStatementVisitor } from './visitors/assign-statement-visitor/assign-statement-visitor.js';
import type { ASTVisitor } from './visitors/ast-visitor.js';
import { CompositeVisitor } from './visitors/composite-visitor.js';
import { ControlStructureVisitor } from './visitors/control-structure-visitor.js';
import { CSGVisitor } from './visitors/csg-visitor.js';
import { EchoStatementVisitor } from './visitors/echo-statement-visitor/echo-statement-visitor.js';
import { ExpressionVisitor } from './visitors/expression-visitor.js';
import { FunctionVisitor } from './visitors/function-visitor.js';
import { ModuleVisitor } from './visitors/module-visitor.js';
import { PrimitiveVisitor } from './visitors/primitive-visitor.js';

import { TransformVisitor } from './visitors/transform-visitor.js';
import { VariableVisitor } from './visitors/variable-visitor.js';

/**
 * @class VisitorASTGenerator
 * @description Converts a Tree-sitter CST into an OpenSCAD AST using a visitor-based approach.
 * This class is the main entry point for the AST generation process, orchestrating a set of specialized visitors.
 */
export class VisitorASTGenerator {
  private visitor: ASTVisitor;
  private previousAST: ast.ASTNode[] | null = null;

  /**
   * @constructor
   * @description Initializes a new instance of the `VisitorASTGenerator`, setting up the visitor hierarchy.
   * The constructor establishes a chain of responsibility, where the `CompositeVisitor` acts as the primary visitor,
   * delegating to a collection of specialized visitors.
   *
   * @param {Tree} tree - The Tree-sitter parse tree (CST).
   * @param {string} source - The original OpenSCAD source code.
   * @param {Language} language - The Tree-sitter language definition for OpenSCAD.
   * @param {ErrorHandler} errorHandler - An error handler instance for reporting issues.
   */
  constructor(
    private tree: Tree,
    private source: string,
    private language: Language,
    private errorHandler: ErrorHandler // Added ErrorHandler
  ) {
    // Create a shared variable scope that can be used by multiple visitors
    const sharedVariableScope = new Map<string, ast.ParameterValue>();

    // Verify that the Map was created successfully
    if (!sharedVariableScope || typeof sharedVariableScope.set !== 'function') {
      throw new Error('Failed to create shared variable scope Map');
    }

    // Create a composite visitor that delegates to specialized visitors
    // Create the composite visitor first so we can pass it to visitors that need it
    const expressionVisitor = new ExpressionVisitor(
      this.source,
      this.errorHandler,
      sharedVariableScope
    );
    const transformVisitor = new TransformVisitor(
      this.source,
      new CompositeVisitor([], this.errorHandler),
      this.errorHandler,
      sharedVariableScope
    ); // Added errorHandler, used this.source

    // Create CSG visitor that will be added to composite visitor later
    const csgVisitor = new CSGVisitor(
      this.source,
      undefined,
      this.errorHandler,
      sharedVariableScope
    );

    // Create control structure visitor instance to set composite visitor later
    const controlStructureVisitor = new ControlStructureVisitor(
      this.source,
      this.errorHandler,
      sharedVariableScope
    );

    // Create module visitor instance to set composite visitor later
    const moduleVisitor = new ModuleVisitor(this.source, this.errorHandler, sharedVariableScope);

    const compositeVisitor = new CompositeVisitor(
      [
        new AssignStatementVisitor(this.source, this.errorHandler, sharedVariableScope), // Handle assign statements first
        new AssertStatementVisitor(this.source, this.errorHandler, sharedVariableScope),
        // Module and function definitions must be processed before instantiations
        moduleVisitor, // Process module definitions first
        new FunctionVisitor(this.source, this.errorHandler, sharedVariableScope), // Process function definitions first
        // Control structures must be processed before other visitors to handle if/for/let statements
        controlStructureVisitor,
        // Specialized visitors for module instantiations come after control structure visitors
        new PrimitiveVisitor(this.source, this.errorHandler, sharedVariableScope),
        transformVisitor, // transformVisitor instance already has errorHandler
        csgVisitor, // Use the pre-created CSG visitor
        // General statement visitor comes after specialized visitors
        new EchoStatementVisitor(this.source, this.errorHandler, sharedVariableScope),
        expressionVisitor,
        new VariableVisitor(this.source, this.errorHandler, sharedVariableScope),
      ],
      this.errorHandler
    ); // Added errorHandler

    // Set the composite visitor on the CSG visitor to enable child delegation
    csgVisitor.setCompositeVisitor(compositeVisitor);

    // Set the composite visitor on the Transform visitor to enable child delegation
    transformVisitor.setCompositeVisitor(compositeVisitor);

    // Set the composite visitor on the Control Structure visitor to enable child delegation
    controlStructureVisitor.setCompositeVisitor(compositeVisitor);

    // Set the composite visitor on the Module visitor to enable child delegation
    moduleVisitor.setCompositeVisitor(compositeVisitor);

    // Use the composite visitor as the main visitor
    this.visitor = compositeVisitor;
  }

  /**
   * @method generate
   * @description Generates the AST by traversing the CST from the root node.
   * It delegates the processing of each node to the configured visitor hierarchy.
   *
   * @returns {ast.ASTNode[]} An array of top-level AST nodes representing the OpenSCAD program.
   */
  public generate(): ast.ASTNode[] {
    // Get the root node of the Tree-sitter tree
    const rootNode = this.tree.rootNode;
    if (!rootNode) {
      return [];
    }

    // Visit all named children of the root node to build the AST
    const statements: ast.ASTNode[] = [];
    for (let i = 0; i < rootNode.namedChildCount; i++) {
      const child = rootNode.namedChild(i);
      if (!child) continue;

      // Use the visitor to process the child node
      const astNode = this.visitor.visitNode(child);
      if (astNode) {
        statements.push(astNode);
      }
    }

    return statements;
  }

  /**
   * @method dispose
   * @description Cleans up resources used by the generator.
   */
  public dispose(): void {
    // Clear references
    this.previousAST = null;
  }
}
