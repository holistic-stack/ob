/**
 * @file OpenSCAD parser with AST generation and error handling
 *
 * This module provides a high-level parser for OpenSCAD code that extends the Tree-sitter
 * parsing with additional capabilities like Abstract Syntax Tree (AST) generation,
 * error reporting, and incremental parsing for editor integration.
 *
 * The parser follows a layered architecture:
 * 1. Tree-sitter provides the low-level syntax parsing (CST)
 * 2. VisitorASTGenerator converts the CST to a structured AST
 * 3. Error handlers collect, format, and report syntax and semantic errors
 *
 * @module openscad-parser/openscad-parser
 * @since 0.1.0
 */

import * as TreeSitter from 'web-tree-sitter';
import { SimpleErrorHandler, type IErrorHandler } from './error-handling/simple-error-handler.js';
import type { ASTNode } from './ast/ast-types.js';
import { VisitorASTGenerator } from './ast/index.js';
import { ErrorHandler } from './error-handling/index.js';





/**
 * OpenSCAD parser with AST generation capabilities and error handling.
 *
 * The OpenscadParser serves as the main entry point for parsing OpenSCAD code and
 * generating structured Abstract Syntax Trees (ASTs). It combines Tree-sitter's powerful
 * parsing capabilities with a visitor-based AST generation system and comprehensive error
 * handling.
 *
 * Key features:
 * - WASM-based Tree-sitter parser for efficient and accurate syntax parsing
 * - Visitor pattern for transforming Concrete Syntax Trees (CSTs) into semantic ASTs
 * - Incremental parsing support for editor integration with better performance
 * - Detailed error reporting with line/column information and formatted messages
 * - Configurable error handling through the IErrorHandler interface
 *
 * The parsing process follows these steps:
 * 1. Initialize the parser by loading the OpenSCAD grammar (init)
 * 2. Parse the source code into a CST (parseCST)
 * 3. Transform the CST into an AST (parseAST)
 * 4. Handle any syntax or semantic errors through the error handler
 *
 * For incremental updates (common in code editors), use the update/updateAST methods
 * to efficiently update only the changed portions of the syntax tree.
 *
 * @example Complete Parser Workflow
 * ```typescript
 * import { OpenscadParser, ConsoleErrorHandler } from '@holistic-stack/openscad-parser';
 *
 * // Setup with custom error handling
 * const errorHandler = new ConsoleErrorHandler();
 * const parser = new OpenscadParser(errorHandler);
 *
 * async function parseOpenSCAD() {
 *   // Initialize the parser with the OpenSCAD grammar
 *   await parser.init('./path/to/tree-sitter-openscad.wasm');
 *
 *   try {
 *     // Parse some OpenSCAD code
 *     const code = 'module test() { cube(10); sphere(5); }';
 *
 *     // Generate the AST
 *     const ast = parser.parseAST(code);
 *
 *     // Process the AST (e.g., code analysis, transformation)
 *     console.log(JSON.stringify(ast, null, 2));
 *
 *     // Later, for incremental updates (e.g., in an editor)
 *     const updatedCode = 'module test() { cube(20); sphere(5); }';
 *     // Only reparse the changed part (the parameter 10 -> 20)
 *     const updatedAst = parser.updateAST(
 *       updatedCode,
 *       code.indexOf('10'),  // start index of change
 *       code.indexOf('10') + 2,  // old end index
 *       code.indexOf('10') + 2 + 1  // new end index (one digit longer)
 *     );
 *   } catch (error) {
 *     console.error('Parsing failed:', error);
 *     // Access collected errors
 *     const errors = errorHandler.getErrors();
 *     errors.forEach(err => console.error(err));
 *   } finally {
 *     // Clean up when done
 *     parser.dispose();
 *   }
 * }
 * ```
 *
 * @since 0.1.0
 */
export class OpenscadParser {
  private parser: TreeSitter.Parser | null = null;
  private language: TreeSitter.Language | null = null;
  private previousTree: TreeSitter.Tree | null = null;
  private errorHandler: IErrorHandler;
  public isInitialized = false;

  /**
   * Creates a new OpenscadParser instance with optional custom error handling.
   *
   * This constructor initializes the parser with either a custom error handler or the default
   * SimpleErrorHandler. The error handler is responsible for collecting, formatting, and
   * reporting errors that occur during parsing or AST generation.
   *
   * Note that calling the constructor only creates the parser instance but does not load
   * the OpenSCAD grammar. You must call the `init()` method before attempting to parse any code.
   *
   * @param errorHandler - Optional custom error handler that implements the IErrorHandler interface.
   *                        If not provided, a SimpleErrorHandler is used by default.
   *
   * @example Default Error Handler
   * ```typescript
   * // Create a parser with the default SimpleErrorHandler
   * const parser = new OpenscadParser();
   * ```
   *
   * @example Custom Error Handler
   * ```typescript
   * // Create a custom error handler for specialized error reporting
   * class CustomErrorHandler implements IErrorHandler {
   *   private errors: string[] = [];
   *
   *   logInfo(message: string): void {
   *     console.log(`[INFO] ${message}`);
   *   }
   *
   *   logWarning(message: string): void {
   *     console.warn(`[WARNING] ${message}`);
   *   }
   *
   *   handleError(error: string | Error): void {
   *     const errorMessage = typeof error === 'string' ? error : error.message;
   *     this.errors.push(errorMessage);
   *     console.error(`[ERROR] ${errorMessage}`);
   *   }
   *
   *   getErrors(): string[] {
   *     return this.errors;
   *   }
   * }
   *
   * // Create a parser with the custom error handler
   * const errorHandler = new CustomErrorHandler();
   * const parser = new OpenscadParser(errorHandler);
   * ```
   *
   * @since 0.1.0
   */
  constructor(errorHandler?: IErrorHandler) {
    this.errorHandler = errorHandler ?? new SimpleErrorHandler();
  }

  /**
   * Initializes the OpenSCAD parser by loading the WASM grammar.
   *
   * @param wasmPath - Path to Tree-sitter WASM binary (default: './tree-sitter-openscad.wasm')
   * @returns Promise<void> that resolves when initialization completes.
   * @throws Error if fetching or parser initialization fails.
   * @example Simple Usage
   * ```ts
   * const parser = new OpenscadParser();
   * await parser.init();
   * ```
   * @example Custom Path Usage
   * ```ts
   * await parser.init('/custom/path/tree-sitter-openscad.wasm');
   * ```
   * @since 0.1.0
   */
  async init(wasmPath = './tree-sitter-openscad.wasm', treeSitterWasmPath = './tree-sitter.wasm'): Promise<void> {
    try {
      this.errorHandler.logInfo('Initializing OpenSCAD parser...');

      // Use the provided wasmPath directly
      const arrayBuffer = await fetch(wasmPath).then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.arrayBuffer();
      });

      const bytes = new Uint8Array(arrayBuffer);

      // Use the provided treeSitterWasmPath directly for tree-sitter.wasm
      const locateFile = (scriptName: string): string => {
        if (scriptName === 'tree-sitter.wasm') {
          return treeSitterWasmPath;
        }
        return scriptName;
      };

      await TreeSitter.Parser.init({
        locateFile,
      });
      this.parser = new TreeSitter.Parser();
      this.language = await TreeSitter.Language.load(bytes);
      this.parser.setLanguage(this.language);
      this.isInitialized = true;

      this.errorHandler.logInfo('OpenSCAD parser initialized successfully');
    } catch (error) {
      const errorMessage = `Failed to initialize parser: ${error}`;
      this.errorHandler.handleError(errorMessage);
      throw new Error(errorMessage);
    }
  }

  /**
   * Parses the OpenSCAD source string into a Concrete Syntax Tree (CST).
   *
   * @param code - OpenSCAD code to parse.
   * @returns Tree-sitter CST or null.
   * @throws Error if parser not initialized or parsing fails.
   * @example Simple Usage
   * ```ts
   * const tree = parser.parseCST('cube(1);');
   * ```
   * @example Error Handling
   * ```ts
   * try {
   *   parser.parseCST('invalid code');
   * } catch (e) { console.error(e); }
   * ```
   */
  parseCST(code: string): TreeSitter.Tree | null {
    if (!this.parser) {
      throw new Error('Parser not initialized');
    }

    try {
      const tree = this.parser.parse(code, this.previousTree);
      this.previousTree = tree;

      // Check for syntax errors
      if (tree && (this.hasErrorNodes(tree.rootNode) || this.hasMissingTokens(tree.rootNode))) {
        const errorDetails = this.formatSyntaxError(code, tree.rootNode);
        this.errorHandler.handleError(errorDetails);
      }

      return tree;
    } catch (error) {
      this.errorHandler.handleError(`Failed to parse code: ${error}`);
      throw error;
    }
  }

  /**
   * Parses the OpenSCAD code into an Abstract Syntax Tree (AST) using the visitor pattern.
   *
   * @param code - OpenSCAD code to generate AST for.
   * @returns Array of ASTNode representing the AST.
   * @throws Error if AST generation fails.
   * @example Simple Usage
   * ```ts
   * const ast = parser.parseAST('cube(1);');
   * ```
   * @example Nested Expressions
   * ```ts
   * const ast = parser.parseAST('translate([1,1,1]) cube(2);');
   * ```
   * @since 0.1.0
   */
  parseAST(code: string): ASTNode[] {
    try {
      this.errorHandler.logInfo('Generating AST from OpenSCAD code...');

      const cst = this.parseCST(code);
      if (!cst) {
        this.errorHandler.logWarning('Failed to generate CST, returning empty AST');
        return [];
      }

      // Create visitor-based AST generator with adapter
      const errorHandlerAdapter = this.createErrorHandlerAdapter();
      const astGenerator = new VisitorASTGenerator(
        cst,
        code,
        this.language,
        errorHandlerAdapter
      );

      // Generate AST using visitor pattern
      const ast = astGenerator.generate();

      this.errorHandler.logInfo(`AST generation completed. Generated ${ast.length} top-level nodes.`);
      return ast;
    } catch (error) {
      this.errorHandler.handleError(`Failed to generate AST: ${error}`);
      throw error;
    }
  }

  /**
   * @deprecated since v0.2.0. Use `parseCST` instead.
   *
   * Alias for parseCST for backward compatibility.
   *
   * @param code - OpenSCAD code to parse.
   * @returns Tree-sitter CST or null.
   * @example
   * ```ts
   * const tree = parser.parse('cube(1);');
   * ```
   */
  parse(code: string): TreeSitter.Tree | null {
    return this.parseCST(code);
  }

  /**
   * Updates the parse tree incrementally for better performance when making small edits to code.
   * 
   * Instead of reparsing the entire file, this method updates only the changed portion
   * of the syntax tree, significantly improving performance for large files.
   * 
   * @param newCode - The updated OpenSCAD code string
   * @param startIndex - The byte index where the edit starts in the original code
   * @param oldEndIndex - The byte index where the edit ends in the original code
   * @param newEndIndex - The byte index where the edit ends in the new code
   * @returns Updated Tree-sitter CST or null if incremental update fails
   * 
   * @example Simple Edit
   * ```ts
   * // Original: "cube(10);"
   * // Change to: "cube(20);"
   * const tree = parser.update("cube(20);", 5, 7, 7);
   * ```
   * 
   * @example Complex Edit
   * ```ts
   * // For more complex edits with position calculations:
   * const oldCode = "cube([10, 10, 10]);";
   * const newCode = "cube([20, 10, 10]);";
   * // Calculate the edit position (append at the end)
   * const startIndex = oldCode.indexOf("10");
   * const oldEndIndex = startIndex + 2; // "10" is 2 chars
   * const newEndIndex = startIndex + 2; // "20" is also 2 chars
   * const tree = parser.update(newCode, startIndex, oldEndIndex, newEndIndex);
   * ```
   * 
   * @since 0.2.0
   */
  update(
    newCode: string,
    startIndex: number,
    oldEndIndex: number,
    newEndIndex: number
  ): TreeSitter.Tree | null {
    if (!this.parser || !this.previousTree) {
      this.errorHandler.logInfo('No previous tree available, parsing from scratch');
      return this.parseCST(newCode);
    }

    try {
      // Create edit object for tree-sitter
      const edit = {
        startIndex,
        oldEndIndex,
        newEndIndex,
        startPosition: this.indexToPosition(newCode, startIndex),
        oldEndPosition: this.indexToPosition(newCode, oldEndIndex),
        newEndPosition: this.indexToPosition(newCode, newEndIndex),
      };

      this.previousTree.edit(edit);
      const newTree = this.parser.parse(newCode, this.previousTree);
      this.previousTree = newTree;

      return newTree;
    } catch (error) {
      this.errorHandler.handleError(`Failed to update parse tree: ${error}`);
      throw error;
    }
  }

  /**
   * Updates the Abstract Syntax Tree (AST) incrementally for improved performance.
   *
   * This method first performs an incremental update of the Concrete Syntax Tree (CST)
   * and then generates a new AST from the updated tree. This approach is much more efficient
   * than regenerating the entire AST for large files when only small changes are made.
   *
   * @param newCode - The updated OpenSCAD code string
   * @param startIndex - The byte index where the edit starts in the original code
   * @param oldEndIndex - The byte index where the edit ends in the original code
   * @param newEndIndex - The byte index where the edit ends in the new code
   * @returns Array of updated AST nodes representing the OpenSCAD program
   * @throws Error if the AST update process fails
   * 
   * @example Simple Parameter Change
   * ```ts
   * // Original: "cube(10);"
   * // Changed to: "cube(20);"
   * const ast = parser.updateAST("cube(20);", 5, 7, 7);
   * // ast will contain the updated node structure
   * ```
   * 
   * @example Adding New Element
   * ```ts
   * const oldCode = "cube(10);";
   * const newCode = "cube(10); sphere(5);";
   * // Calculate the edit position (append at the end)
   * const startIndex = oldCode.length;
   * const oldEndIndex = oldCode.length;
   * const newEndIndex = newCode.length;
   * 
   * const ast = parser.updateAST(newCode, startIndex, oldEndIndex, newEndIndex);
   * // ast now contains both the cube and sphere nodes
   * ```
   * 
   * @since 0.2.0
   */
  updateAST(
    newCode: string,
    startIndex: number,
    oldEndIndex: number,
    newEndIndex: number
  ): ASTNode[] {
    try {
      this.errorHandler.logInfo('Updating AST incrementally...');

      // First update the CST incrementally
      const updatedTree = this.update(newCode, startIndex, oldEndIndex, newEndIndex);

      if (!updatedTree) {
        this.errorHandler.logWarning('Failed to update CST, returning empty AST');
        return [];
      }

      // Generate new AST from updated CST
      const errorHandlerAdapter = this.createErrorHandlerAdapter();
      const astGenerator = new VisitorASTGenerator(
        updatedTree,
        newCode,
        this.language,
        errorHandlerAdapter
      );

      const ast = astGenerator.generate();

      this.errorHandler.logInfo(`AST update completed. Generated ${ast.length} top-level nodes.`);
      return ast;
    } catch (error) {
      this.errorHandler.handleError(`Failed to update AST: ${error}`);
      throw error;
    }
  }

  /**
   * Releases all resources used by the parser instance.
   * 
   * This method should be called when the parser is no longer needed to prevent memory leaks.
   * After calling dispose(), the parser cannot be used until init() is called again.
   * 
   * @returns void
   * 
   * @example
   * ```ts
   * // Clean up parser resources when done
   * const parser = new EnhancedOpenscadParser();
   * await parser.init();
   * 
   * // Use parser...
   * 
   * // When finished:
   * parser.dispose();
   * ```
   * 
   * @example Editor Integration
   * ```ts
   * // In a code editor component's cleanup method:
   * componentWillUnmount() {
   *   if (this.parser) {
   *     this.parser.dispose();
   *     this.parser = null;
   *   }
   * }
   * ```
   * 
   * @since 0.1.0
   */
  dispose(): void {
    try {
      if (this.parser) {
        this.parser.delete();
        this.parser = null;
        this.language = null;
        this.previousTree = null;
        this.isInitialized = false;
        this.errorHandler.logInfo('OpenSCAD parser disposed successfully');
      }
    } catch (error) {
      this.errorHandler.handleError(`Error disposing parser: ${error}`);
    }
  }

  /**
   * Returns the error handler instance used by this parser.
   * 
   * This can be useful for accessing parser errors or configuring error handling behavior.
   * The returned error handler follows the IErrorHandler interface and can be used to
   * retrieve error logs or redirect error output.
   * 
   * @returns The error handler instance
   * 
   * @example Access Error Logs
   * ```ts
   * const parser = new EnhancedOpenscadParser();
   * await parser.init();
   * 
   * // After parsing:
   * const errorHandler = parser.getErrorHandler();
   * const errors = errorHandler.getErrors(); // If implemented by the error handler
   * ```
   * 
   * @example Custom Error Processing
   * ```ts
   * const parser = new EnhancedOpenscadParser();
   * await parser.init();
   * 
   * // Get errors for display in UI
   * try {
   *   parser.parseCST(code);
   * } catch (e) {
   *   const errorHandler = parser.getErrorHandler();
   *   this.displayErrors(errorHandler.getErrors());
   * }
   * ```
   * 
   * @since 0.1.0
   */
  getErrorHandler(): IErrorHandler {
    return this.errorHandler;
  }

  /**
   * Recursively checks if a node or any of its children has an ERROR node type.
   * 
   * This is a helper method used internally by the parser to detect syntax errors
   * in the parsed OpenSCAD code. It traverses the CST to find any nodes marked as errors
   * by the Tree-sitter parser.
   * 
   * @param node - The Tree-sitter node to check for errors
   * @returns true if the node or any of its children is an error node, false otherwise
   * @private
   * @since 0.1.0
   */
  private hasErrorNodes(node: TreeSitter.Node): boolean {
    if (node.type === 'ERROR' || node.isMissing) {
      return true;
    }

    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (child && this.hasErrorNodes(child)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Checks if the parse tree contains MISSING tokens by examining the string representation.
   *
   * Tree-sitter uses MISSING tokens for error recovery when expected tokens are absent.
   * These tokens may not be detectable through the isMissing property in all cases.
   *
   * @param node - The Tree-sitter node to check for MISSING tokens
   * @returns true if the tree contains MISSING tokens, false otherwise
   * @private
   * @since 0.1.0
   */
  private hasMissingTokens(node: TreeSitter.Node): boolean {
    const treeString = node.toString();
    return treeString.includes('MISSING');
  }

  /**
   * Formats a detailed syntax error message with line, column, and visual pointer to the error.
   * 
   * This method creates a user-friendly error message that pinpoints exactly where
   * in the code the syntax error occurred, making it easier for developers to identify
   * and fix parsing issues in their OpenSCAD code.
   * 
   * @param code - The OpenSCAD code string that contains the error
   * @param rootNode - The root node of the parse tree containing error nodes
   * @returns A formatted error message with line, column and visual pointer to the error location
   * @private
   * @since 0.1.0
   */
  private formatSyntaxError(code: string, rootNode: TreeSitter.Node): string {
    const errorNode = this.findFirstErrorNode(rootNode) || this.findFirstMissingToken(rootNode);
    if (!errorNode) {
      return `Syntax error found in parsed code:\n${code}`;
    }

    const lines = code.split('\n');
    const errorLine = errorNode.startPosition.row;
    const errorColumn = errorNode.startPosition.column;

    let errorMessage = `Syntax error at line ${errorLine + 1}, column ${errorColumn + 1}:\n`;

    // Add the problematic line
    if (errorLine < lines.length) {
      errorMessage += `${lines[errorLine]}\n`;
      // Add pointer to error position
      errorMessage += ' '.repeat(errorColumn) + '^';
    }

    return errorMessage;
  }

  /**
   * Recursively searches for the first ERROR node in the parse tree.
   * 
   * This method traverses the Tree-sitter CST depth-first to find the first
   * node with a type of 'ERROR', which indicates a syntax error in the parsed code.
   * The first error node is used to generate precise error messages with location information.
   * 
   * @param node - The Tree-sitter node to begin the search from (typically the root node)
   * @returns The first ERROR node found, or null if no error nodes exist
   * @private
   * @since 0.1.0
   */
  private findFirstErrorNode(node: TreeSitter.Node): TreeSitter.Node | null {
    if (node.type === 'ERROR' || node.isMissing) {
      return node;
    }

    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (child) {
        const errorNode = this.findFirstErrorNode(child);
        if (errorNode) {
          return errorNode;
        }
      }
    }

    return null;
  }

  /**
   * Recursively searches for the first node that represents a MISSING token.
   *
   * This method traverses the Tree-sitter CST to find nodes that contain MISSING tokens
   * in their string representation, which indicates error recovery by the parser.
   *
   * @param node - The Tree-sitter node to begin the search from
   * @returns The first node containing a MISSING token, or null if none found
   * @private
   * @since 0.1.0
   */
  private findFirstMissingToken(node: TreeSitter.Node): TreeSitter.Node | null {
    // Check if this node's string representation contains MISSING
    if (node.toString().includes('MISSING')) {
      // If this node has children, try to find a more specific child with MISSING
      for (let i = 0; i < node.childCount; i++) {
        const child = node.child(i);
        if (child) {
          const missingChild = this.findFirstMissingToken(child);
          if (missingChild) {
            return missingChild;
          }
        }
      }
      // If no child contains MISSING, this node is the one
      return node;
    }

    return null;
  }

  /**
   * Converts a byte index in the source text to a line/column position.
   * 
   * This utility method is used during incremental parsing to convert a character
   * index to the corresponding line and column position. This is necessary because
   * Tree-sitter's edit API requires position objects with row and column properties.
   * 
   * @param text - The source text string
   * @param index - The byte index to convert to a position
   * @returns An object containing row (line) and column numbers (0-based)
   * @private
   * @since 0.2.0
   */
  private indexToPosition(text: string, index: number): { row: number; column: number } {
    let row = 0;
    let column = 0;

    for (let i = 0; i < index && i < text.length; i++) {
      if (text[i] === '\n') {
        row++;
        column = 0;
      } else {
        column++;
      }
    }

    return { row, column };
  }

  /**
   * Create an ErrorHandler adapter from IErrorHandler
   * This allows the enhanced parser to work with the visitor system
   */
  private createErrorHandlerAdapter(): ErrorHandler {
    const adapter = new ErrorHandler({
      throwErrors: false,
      attemptRecovery: false
    });

    // Override the logging methods to delegate to our IErrorHandler
    const originalLogInfo = adapter.logInfo.bind(adapter);
    const originalLogWarning = adapter.logWarning.bind(adapter);
    const originalHandleError = adapter.handleError.bind(adapter);

    adapter.logInfo = (message: string) => {
      this.errorHandler.logInfo(message);
      originalLogInfo(message);
    };

    adapter.logWarning = (message: string) => {
      this.errorHandler.logWarning(message);
      originalLogWarning(message);
    };

    adapter.handleError = (error: Error) => {
      this.errorHandler.handleError(error);
      originalHandleError(error);
    };

    return adapter;
  }
}
