/**
 * @file OpenSCAD Parser Implementation
 *
 * Custom OpenSCAD parser implementation providing drop-in replacement
 * for @holistic-stack/openscad-parser with proper CSGVisitor delegation fix.
 * Following TypeScript 5.8, DRY, and SRP principles.
 */

import TreeSitter, { type Language, type Node, type Parser, type Tree } from 'web-tree-sitter';
import { createLogger } from '../../../shared/services/logger.service.js';
import { tryCatch, tryCatchAsync } from '../../../shared/utils/functional/result.js';
import type { ASTNode } from './ast-types.js';
import type { IErrorHandler } from './error-handler.interface.js';
import { VisitorASTGenerator } from './visitor-ast-generator.js';

const logger = createLogger('OpenscadParser');

/**
 * OpenSCAD Parser class providing exact API compatibility with @holistic-stack/openscad-parser
 * Uses WASM-based web-tree-sitter for cross-platform compatibility
 */
export class OpenscadParser {
  private parser: Parser | null = null;
  private language: Language | null = null;
  private previousTree: Tree | null = null;
  private isInitialized = false;
  private source = ''; // Store source code for visitor pattern

  /**
   * Create new OpenSCAD parser instance
   * @param errorHandler - Error handler for collecting parse errors
   */
  constructor(private readonly errorHandler: IErrorHandler) {
    logger.init('OpenSCAD parser instance created');
  }

  /**
   * Initialize the parser with WASM-based tree-sitter OpenSCAD language
   * @param wasmPath - Path to OpenSCAD grammar WASM file (default: './tree-sitter-openscad.wasm')
   * @param treeSitterWasmPath - Path to tree-sitter WASM file (default: './tree-sitter.wasm')
   * @returns Promise that resolves when parser is ready
   */
  async init(
    wasmPath = './tree-sitter-openscad.wasm',
    treeSitterWasmPath = './tree-sitter.wasm'
  ): Promise<void> {
    const result = await tryCatchAsync(
      async () => {
        if (this.isInitialized) {
          logger.debug('Parser already initialized');
          return;
        }

        logger.debug('Initializing WASM tree-sitter parser');

        // Load OpenSCAD grammar WASM file
        const arrayBuffer = await fetch(wasmPath).then((response) => {
          if (!response.ok) {
            throw new Error(`Failed to fetch OpenSCAD WASM: HTTP ${response.status}`);
          }
          return response.arrayBuffer();
        });

        const bytes = new Uint8Array(arrayBuffer);

        // Initialize web-tree-sitter with custom locateFile
        const locateFile = (scriptName: string): string => {
          if (scriptName === 'tree-sitter.wasm') {
            return treeSitterWasmPath;
          }
          return scriptName;
        };

        await TreeSitter.Parser.init({ locateFile });

        // Create parser instance and load language
        this.parser = new TreeSitter.Parser();
        this.language = await TreeSitter.Language.load(bytes);
        this.parser.setLanguage(this.language);

        this.isInitialized = true;
        logger.debug('WASM parser initialization completed successfully');
      },
      (err) => {
        const errorMessage = `Failed to initialize WASM parser: ${err instanceof Error ? err.message : String(err)}`;
        this.errorHandler.logError(errorMessage);
        logger.error(errorMessage);
        throw new Error(errorMessage);
      }
    );

    if (!result.success) {
      throw new Error(result.error);
    }
  }

  /**
   * Parse OpenSCAD code to Abstract Syntax Tree
   * @param content - OpenSCAD source code to parse
   * @returns Array of AST nodes
   */
  parseAST(content: string): ReadonlyArray<ASTNode> {
    const result = tryCatch(
      () => {
        this.ensureInitialized();

        logger.debug(`Parsing OpenSCAD content (${content.length} characters)`);

        // Store source code for visitor pattern
        this.source = content;

        // Clear previous errors
        this.errorHandler.clear();

        // Parse to CST first
        const tree = this.parseCST(content);

        // Convert CST to AST
        const ast = this.convertCSTToAST(tree);

        logger.debug(`Successfully parsed ${ast.length} top-level AST nodes`);
        return ast;
      },
      (err) => {
        const errorMessage = `AST parsing failed: ${err instanceof Error ? err.message : String(err)}`;
        this.errorHandler.logError(errorMessage);
        logger.error(errorMessage);
        throw err;
      }
    );

    if (!result.success) {
      throw new Error(result.error);
    }

    return result.data;
  }

  /**
   * Parse OpenSCAD code to Concrete Syntax Tree
   * @param content - OpenSCAD source code to parse
   * @returns Tree-sitter tree
   */
  parseCST(content: string): Tree {
    const result = tryCatch(
      () => {
        this.ensureInitialized();

        if (!this.parser) {
          throw new Error('Parser not available after initialization');
        }

        logger.debug(`Parsing OpenSCAD content to CST (${content.length} characters)`);

        const tree = this.parser.parse(content, this.previousTree);
        this.previousTree = tree;

        if (!tree) {
          throw new Error('Failed to parse content - tree-sitter returned null');
        }

        // Check for syntax errors
        if (tree.rootNode.hasError || this.hasErrorNodes(tree.rootNode)) {
          const errorDetails = this.formatSyntaxError(content, tree.rootNode);
          this.errorHandler.logWarning(`Syntax errors detected: ${errorDetails}`);
          logger.warn('CST contains syntax errors');
        }

        logger.debug('CST parsing completed successfully');
        return tree;
      },
      (err) => {
        const errorMessage = `CST parsing failed: ${err instanceof Error ? err.message : String(err)}`;
        this.errorHandler.logError(errorMessage);
        logger.error(errorMessage);
        throw err;
      }
    );

    if (!result.success) {
      throw new Error(result.error);
    }

    return result.data;
  }

  /**
   * Dispose parser resources and cleanup
   */
  dispose(): void {
    logger.debug('Disposing parser resources');

    if (this.parser) {
      this.parser.delete();
      this.parser = null;
    }

    if (this.previousTree) {
      this.previousTree.delete();
      this.previousTree = null;
    }

    this.language = null;
    this.isInitialized = false;
    this.errorHandler.clear();

    logger.end('Parser disposed successfully');
  }

  /**
   * Check if parser is initialized
   * @returns True if parser is ready for use
   */
  isReady(): boolean {
    return this.isInitialized && this.parser !== null;
  }

  /**
   * Ensure parser is initialized before use
   * @throws Error if parser is not initialized
   */
  private ensureInitialized(): void {
    if (!this.isInitialized || !this.parser) {
      throw new Error('Parser not initialized. Call init() first.');
    }
  }

  /**
   * Convert CST to AST using visitor pattern
   * @param tree - Tree-sitter parse tree
   * @returns Array of AST nodes
   */
  private convertCSTToAST(tree: Tree): ReadonlyArray<ASTNode> {
    logger.debug('Converting CST to AST using visitor pattern');

    const result = tryCatch(
      () => {
        // Create visitor AST generator
        const generator = new VisitorASTGenerator(tree, this.source, this.errorHandler);

        // Generate AST from CST
        const ast = generator.generate();

        // Get conversion statistics
        const stats = generator.getConversionStats();
        logger.debug(
          `CST conversion completed: ${stats.totalCSTNodes} CST nodes → ${ast.length} AST nodes`
        );

        // Cleanup generator
        generator.dispose();

        return ast;
      },
      (err) => {
        const errorMessage = `CST to AST conversion failed: ${err instanceof Error ? err.message : String(err)}`;
        this.errorHandler.logError(errorMessage);
        logger.error(errorMessage);
        throw err;
      }
    );

    if (!result.success) {
      throw new Error(result.error);
    }

    return result.data;
  }

  /**
   * Recursively checks if a node or any of its children has an ERROR node type
   * @param node - The Tree-sitter node to check for errors
   * @returns true if the node or any of its children is an error node
   */
  private hasErrorNodes(node: Node): boolean {
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
   * Formats a detailed syntax error message with line, column, and visual pointer
   * @param code - The OpenSCAD code string that contains the error
   * @param rootNode - The root node of the parse tree containing error nodes
   * @returns A formatted error message with line, column and visual pointer
   */
  private formatSyntaxError(code: string, rootNode: Node): string {
    const errorNode = this.findFirstErrorNode(rootNode);
    if (!errorNode) {
      return `Syntax error found in parsed code`;
    }

    const lines = code.split('\n');
    const errorLine = errorNode.startPosition.row;
    const errorColumn = errorNode.startPosition.column;

    let errorMessage = `Syntax error at line ${errorLine + 1}, column ${errorColumn + 1}`;

    // Add the problematic line if available
    if (errorLine < lines.length) {
      errorMessage += `:\n${lines[errorLine]}\n`;
      // Add pointer to error position
      errorMessage += `${' '.repeat(errorColumn)}^`;
    }

    return errorMessage;
  }

  /**
   * Recursively searches for the first ERROR node in the parse tree
   * @param node - The Tree-sitter node to begin the search from
   * @returns The first ERROR node found, or null if no error nodes exist
   */
  private findFirstErrorNode(node: Node): Node | null {
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
}
