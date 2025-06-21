/**
 * OpenSCAD Parser Service
 *
 * Provides AST parsing and analysis capabilities for the OpenSCAD editor.
 * Integrates the openscad-parser package with Monaco editor features.
 */

import type * as TreeSitter from 'web-tree-sitter';
import { EnhancedOpenscadParser, SimpleErrorHandler, type ASTNode } from '@holistic-stack/openscad-parser';

// Simple error interface for our service
export interface ParseError {
  message: string;
  location: {
    line: number;
    column: number;
  };
  severity: 'error' | 'warning' | 'info';
}

export interface ParseResult {
  ast: TreeSitter.Tree | null;
  errors: ParseError[];
  success: boolean;
}

export interface OutlineItem {
  name: string;
  type: 'module' | 'function' | 'variable';
  range: {
    startLine: number;
    startColumn: number;
    endLine: number;
    endColumn: number;
  };
  children?: OutlineItem[];
}

export interface HoverInfo {
  contents: string[];
  range: {
    startLine: number;
    startColumn: number;
    endLine: number;
    endColumn: number;
  };
}

export interface Position {
  line: number;
  column: number;
}

export interface DocumentSymbol {
  name: string;
  type: string;
  location: {
    line: number;
    column: number;
  };
  documentation?: string;
}

/**
 * Service class for parsing OpenSCAD code and providing AST-based features
 */
export class OpenSCADParserService {
  private parser: EnhancedOpenscadParser | null = null;
  private errorHandler: SimpleErrorHandler;
  private documentTree: TreeSitter.Tree | null = null;
  private documentAST: ASTNode[] | null = null;
  private lastParseErrors: ParseError[] = [];
  private isInitialized = false;

  constructor() {
    this.errorHandler = new SimpleErrorHandler();
  }

  /**
   * Initialize the parser service
   */
  async init(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Initializing OpenSCAD parser service...

      // Create and initialize the enhanced parser
      this.parser = new EnhancedOpenscadParser(this.errorHandler);
      // Provide explicit paths to WASM files
      // In test environment, these will be mocked by setupTest.ts
      // In production, these should be served from the public directory
      const openscadWasmPath = 'tree-sitter-openscad.wasm';
      const treeSitterWasmPath = 'tree-sitter.wasm';
      await this.parser.init(openscadWasmPath, treeSitterWasmPath);

      this.isInitialized = true;
      // OpenSCAD parser service initialized successfully
    } catch (error) {
      // Failed to initialize OpenSCAD parser
      throw new Error(`Parser initialization failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Parse OpenSCAD document and return tree with errors
   */
  async parseDocument(content: string): Promise<ParseResult> {
    this.documentAST = null; // Clear previous AST
    this.documentTree = null; // Clear previous CST

    if (!this.parser || !this.isInitialized) {
      const errorMsg = 'Parser not initialized. Call init() first.';
      // Parser not initialized error
      // Populate errors for consistency, though an exception is thrown
      this.lastParseErrors = [{
        message: errorMsg,
        location: { line: 1, column: 1 },
        severity: 'error',
      }];
      throw new Error(errorMsg);
    }

    try {
      // Parsing OpenSCAD document...
      this.errorHandler.clear();

      const tree = this.parser.parseCST(content);

      if (!tree) {
        // Parser returned null tree - this indicates a critical parser failure
        this.lastParseErrors = [
          {
            message: 'Failed to parse document - parser returned null tree.',
            location: { line: 1, column: 1 },
            severity: 'error',
          },
        ];
        return {
          ast: null, // CST is null
          errors: this.lastParseErrors,
          success: false,
        };
      }

      // CST parsing was successful
      this.documentTree = tree;
      // Now, attempt to generate AST
      this.documentAST = this.parser.parseAST(content); // parseAST itself handles errors internally or throws

      const parserErrors = this.errorHandler.getErrors();
      this.lastParseErrors = parserErrors.map((errorMessage: string) => ({
        message: errorMessage,
        location: {
          line: 0,
          column: 0,
        },
        severity: 'error' as const,
      }));

      const hasCSTErrors = this.hasErrors(tree.rootNode);
      // Document parsed. CST Errors: ${hasCSTErrors}, AST Errors (from handler): ${this.lastParseErrors.length}

      return {
        ast: tree, // Return CST as 'ast' for ParseResult compatibility
        errors: this.lastParseErrors,
        success: !hasCSTErrors && this.lastParseErrors.length === 0, // Success if no CST errors AND no AST errors from handler
      };

    } catch (error) {
      // Error during parsing or AST generation
      this.documentAST = null; // Ensure AST is null on error
      this.lastParseErrors = [
        {
          message: `Parsing failed: ${error instanceof Error ? error.message : String(error)}`,
          location: { line: 1, column: 1 },
          severity: 'error',
        },
      ];
      return {
        ast: null, // CST is also likely null or invalid
        errors: this.lastParseErrors,
        success: false,
      };
    }
  }

  /**
   * Extract document outline from the current tree
   */
  getDocumentOutline(): OutlineItem[] {
    if (!this.documentTree) {
      return [];
    }

    const outline: OutlineItem[] = [];

    try {
      // Walk the tree to extract outline items
      this.extractOutlineFromNode(this.documentTree.rootNode, outline);
    } catch (_error) {
      // Error extracting outline
    }

    return outline;
  }

  /**
   * Get hover information for a specific position
   */
  getHoverInfo(position: Position): HoverInfo | null {
    if (!this.documentTree) {
      return null;
    }

    try {
      // Find the tree node at the given position
      const node = this.findNodeAtPosition(
        this.documentTree.rootNode,
        position
      );

      if (!node) {
        return null;
      }

      // Generate hover information based on node type
      return this.generateHoverInfo(node);
    } catch (_error) {
      // Error generating hover info
      return null;
    }
  }

  /**
   * Extract all document symbols
   */
  getDocumentSymbols(): DocumentSymbol[] {
    if (!this.documentTree) {
      return [];
    }

    const symbols: DocumentSymbol[] = [];

    try {
      this.extractSymbolsFromNode(this.documentTree.rootNode, symbols);
    } catch (_error) {
      // Error extracting symbols
    }

    return symbols;
  }

  /**
   * Get the last parse errors
   */
  getLastErrors(): ParseError[] {
    return this.lastParseErrors;
  }

  /**
   * Check if the service is ready for use
   */
  isReady(): boolean {
    return this.isInitialized && this.parser !== null;
  }

  /**
   * Dispose of the parser service
   */
  dispose(): void {
    if (this.parser) {
      this.parser.dispose();
      this.parser = null;
    }
    this.documentTree = null;
    this.documentAST = null;
    this.lastParseErrors = [];
    this.isInitialized = false;
    // OpenSCAD parser service disposed
  }

  /**
   * Get the last parsed Abstract Syntax Tree (AST)
   */
  getAST(): ASTNode[] | null {
    return this.documentAST;
  }

  // Private helper methods

  private hasErrors(node: TreeSitter.Node): boolean {
    if (node.type === 'ERROR' || node.hasError) {
      return true;
    }

    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (child && this.hasErrors(child)) {
        return true;
      }
    }

    return false;
  }

  private extractOutlineFromNode(
    node: TreeSitter.Node,
    outline: OutlineItem[]
  ): void {
    if (!node) return;

    // Extract different types of outline items
    switch (node.type) {
      case 'module_definition':
        const moduleName = this.findChildByType(node, 'identifier')?.text;
        if (moduleName) {
          outline.push({
            name: moduleName,
            type: 'module',
            range: this.getNodeRange(node),
            children: [],
          });
        }
        break;

      case 'function_definition':
        const funcName = this.findChildByType(node, 'identifier')?.text;
        if (funcName) {
          outline.push({
            name: funcName,
            type: 'function',
            range: this.getNodeRange(node),
            children: [],
          });
        }
        break;

      case 'assignment':
        const varName = this.findChildByType(node, 'identifier')?.text;
        if (varName) {
          outline.push({
            name: varName,
            type: 'variable',
            range: this.getNodeRange(node),
            children: [],
          });
        }
        break;
    }

    // Recursively process child nodes
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (child) {
        this.extractOutlineFromNode(child, outline);
      }
    }
  }

  private findNodeAtPosition(
    node: TreeSitter.Node,
    position: Position
  ): TreeSitter.Node | null {
    if (!node) {
      return null;
    }

    // Check if position is within this node's range
    const start = node.startPosition;
    const end = node.endPosition;

    if (position.line >= start.row && position.line <= end.row) {
      if (position.line === start.row && position.column < start.column) {
        return null;
      }
      if (position.line === end.row && position.column > end.column) {
        return null;
      }

      // Check children first for more specific matches
      for (let i = 0; i < node.childCount; i++) {
        const child = node.child(i);
        if (child) {
          const childMatch = this.findNodeAtPosition(child, position);
          if (childMatch) {
            return childMatch;
          }
        }
      }

      // Return this node if no more specific child match found
      return node;
    }

    return null;
  }

  private generateHoverInfo(node: TreeSitter.Node): HoverInfo | null {
    const contents: string[] = [];

    switch (node.type) {
      case 'module_call':
        const moduleName = this.findChildByType(node, 'identifier')?.text;
        contents.push(`**Module Call**: ${moduleName || 'unknown'}`);
        break;

      case 'function_definition':
        const funcName = this.findChildByType(node, 'identifier')?.text;
        contents.push(`**Function Definition**: ${funcName || 'anonymous'}`);
        break;

      case 'assignment':
        const varName = this.findChildByType(node, 'identifier')?.text;
        contents.push(`**Variable**: ${varName || 'unknown'}`);
        break;

      case 'identifier':
        contents.push(`**Identifier**: ${node.text}`);
        break;

      default:
        contents.push(`**${node.type}**`);
    }

    if (contents.length === 0) {
      return null;
    }

    return {
      contents,
      range: this.getNodeRange(node),
    };
  }

  private extractSymbolsFromNode(
    node: TreeSitter.Node,
    symbols: DocumentSymbol[]
  ): void {
    if (!node) return;

    // Extract symbol information
    switch (node.type) {
      case 'module_definition':
        const moduleName = this.findChildByType(node, 'identifier')?.text;
        if (moduleName) {
          symbols.push({
            name: moduleName,
            type: 'module',
            location: this.getNodeLocation(node),
            documentation: `Module definition: ${moduleName}`,
          });
        }
        break;

      case 'function_definition':
        const funcName = this.findChildByType(node, 'identifier')?.text;
        if (funcName) {
          symbols.push({
            name: funcName,
            type: 'function',
            location: this.getNodeLocation(node),
            documentation: `Function definition: ${funcName}`,
          });
        }
        break;

      case 'assignment':
        const varName = this.findChildByType(node, 'identifier')?.text;
        if (varName) {
          symbols.push({
            name: varName,
            type: 'variable',
            location: this.getNodeLocation(node),
            documentation: `Variable assignment: ${varName}`,
          });
        }
        break;
    }

    // Recursively process child nodes
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (child) {
        this.extractSymbolsFromNode(child, symbols);
      }
    }
  }

  private findChildByType(
    node: TreeSitter.Node,
    type: string
  ): TreeSitter.Node | null {
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (child && child.type === type) {
        return child;
      }
    }
    return null;
  }

  private getNodeRange(node: TreeSitter.Node): OutlineItem['range'] {
    return {
      startLine: node.startPosition.row,
      startColumn: node.startPosition.column,
      endLine: node.endPosition.row,
      endColumn: node.endPosition.column,
    };
  }

  private getNodeLocation(node: TreeSitter.Node): DocumentSymbol['location'] {
    return {
      line: node.startPosition.row,
      column: node.startPosition.column,
    };
  }
}

