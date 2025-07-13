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
import type { Result } from '../../shared/types/result.types.js';
import type { ASTNode } from './ast/ast-types.js';
import { VisitorASTGenerator } from './ast/index.js';

import { ErrorHandler } from './error-handling/index.js';
import { type IErrorHandler, SimpleErrorHandler } from './error-handling/simple-error-handler.js';

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
  private errorHandler: ErrorHandler;
  private simpleErrorHandler: SimpleErrorHandler;
  private astGenerators: Set<import('./ast/visitor-ast-generator.js').VisitorASTGenerator> =
    new Set();
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
    this.simpleErrorHandler = (errorHandler ?? new SimpleErrorHandler()) as SimpleErrorHandler;

    this.errorHandler = new ErrorHandler({
      throwErrors: false,
      attemptRecovery: false,
    });

    // Override the logging methods to delegate to our SimpleErrorHandler
    this.errorHandler.logInfo = (message: string) => {
      this.simpleErrorHandler.logInfo(message);
    };

    this.errorHandler.logWarning = (message: string) => {
      this.simpleErrorHandler.logWarning(message);
    };

    this.errorHandler.handleError = (error: Error) => {
      this.simpleErrorHandler.handleError(error);
    };
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
  async init(
    wasmPath = './tree-sitter-openscad.wasm',
    treeSitterWasmPath = './tree-sitter.wasm'
  ): Promise<void> {
    try {
      // Use the provided wasmPath directly
      const arrayBuffer = await fetch(wasmPath).then((response) => {
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
    } catch (error) {
      const errorMessage = `Failed to initialize parser: ${error}`;
      this.errorHandler.handleError(new Error(errorMessage));
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
      const tree = this.parser.parse(code, this.previousTree ?? undefined);
      this.previousTree = tree;

      // Check for syntax errors
      if (tree && (this.hasErrorNodes(tree.rootNode) || this.hasMissingTokens(tree.rootNode))) {
        const errorDetails = this.formatSyntaxError(code, tree.rootNode);
        this.errorHandler.handleError(new Error(errorDetails));
      }

      return tree;
    } catch (error) {
      this.errorHandler.handleError(new Error(`Failed to parse code: ${error}`));
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
      const cst = this.parseCST(code);
      if (!cst) {
        return [];
      }

      if (!this.language) {
        throw new Error('Parser language not initialized');
      }
      const astGenerator = new VisitorASTGenerator(cst, code, this.language, this.errorHandler);

      // Track the AST generator for proper cleanup
      this.astGenerators.add(astGenerator);

      // Generate AST using visitor pattern
      const ast = astGenerator.generate();

      // Apply workaround for Tree-sitter grammar limitations
      const finalAst = this.applyGrammarWorkarounds(code, ast);
      return finalAst;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.errorHandler.handleError(new Error(`Failed to generate AST: ${errorMessage}`));
      return [];
    }
  }

  /**
   * Apply workarounds for Tree-sitter grammar limitations.
   *
   * The Tree-sitter OpenSCAD grammar has limitations where transform statements
   * with immediate child primitives (e.g., 'translate([10,0,0]) sphere(10);')
   * are not parsed correctly. This method implements workarounds to handle
   * these cases by parsing the code in multiple ways and reconstructing
   * the correct AST structure.
   *
   * @param code - The original OpenSCAD source code
   * @param initialAST - The AST generated by the standard parsing process
   * @returns Enhanced AST with grammar limitation workarounds applied
   */
  private applyGrammarWorkarounds(code: string, initialAST: ASTNode[]): ASTNode[] {
    try {
      // Check if Tree-sitter has truncated the input by comparing expected vs actual statements
      const expectedStatements = this.countExpectedStatements(code);
      const actualStatements = initialAST.length;
      const hasTruncatedParsing = actualStatements < expectedStatements;

      // If Tree-sitter truncated the input, use line-by-line parsing fallback
      if (hasTruncatedParsing) {
        return this.parseLineByLineFallbackWithStandalonePrimitives(code, initialAST);
      }

      // Check if we need to apply workarounds by looking for incomplete transform nodes
      const hasIncompleteTransforms = initialAST.some(
        (node) =>
          this.isTransformNode(node) &&
          'children' in node &&
          Array.isArray(node.children) &&
          node.children.length === 0
      );

      if (!hasIncompleteTransforms) {
        // No workarounds needed
        return initialAST;
      }

      // Apply the transform-primitive association workaround
      return this.associateTransformsWithPrimitives(code, initialAST);
    } catch (error) {
      // If workarounds fail, return the original AST
      console.error('[ERROR][OpenscadParser] Grammar workaround failed:', error);
      this.errorHandler.handleError(new Error(`Grammar workaround failed: ${error}`));
      return initialAST;
    }
  }

  /**
   * Check if a node is a transform node (translate, rotate, scale, etc.)
   */
  private isTransformNode(node: ASTNode): boolean {
    return ['translate', 'rotate', 'scale', 'mirror', 'multmatrix', 'color', 'offset'].includes(
      node.type
    );
  }

  /**
   * Count the expected number of statements in the code by analyzing semicolons and structure.
   * This helps detect when Tree-sitter has truncated the parsing.
   */
  private countExpectedStatements(code: string): number {
    try {
      console.log('[DEBUG] countExpectedStatements called with code:', code.replace(/\n/g, '\\n'));
      
      // For block statements (union, difference, intersection), count as single statement
      const blockStatementPattern = /^\s*(union|difference|intersection|hull|minkowski)\s*\(.*?\)\s*\{/;
      if (blockStatementPattern.test(code.trim())) {
        console.log('[DEBUG] Detected block statement, returning 1');
        return 1;
      }
      
      // Split by lines and count statements
      const lines = code.split('\n');
      let statementCount = 0;
      let insideBlock = false;
      let braceDepth = 0;

      for (const line of lines) {
        const trimmedLine = line.trim();

        // Skip empty lines and comments
        if (!trimmedLine || trimmedLine.startsWith('//') || trimmedLine.startsWith('/*')) {
          continue;
        }
        
        // Track brace depth to detect if we're inside a block
        for (const char of trimmedLine) {
          if (char === '{') {
            braceDepth++;
            insideBlock = true;
          } else if (char === '}') {
            braceDepth--;
            if (braceDepth === 0) {
              insideBlock = false;
            }
          }
        }

        // Only count top-level statements (not inside blocks)
        if (!insideBlock && braceDepth === 0) {
          // Count statements ending with semicolon
          if (trimmedLine.endsWith(';')) {
            statementCount++;
            console.log('[DEBUG] Counted semicolon statement:', trimmedLine);
          }

          // Count transform statements (even without semicolon)
          if (trimmedLine.match(/^(translate|rotate|scale|mirror|multmatrix|color|offset)\s*\(/)) {
            statementCount++;
            console.log('[DEBUG] Counted transform statement:', trimmedLine);
          }
          
          // Count block statements
          if (trimmedLine.match(/^(union|difference|intersection|hull|minkowski)\s*\(/)) {
            statementCount++;
            console.log('[DEBUG] Counted block statement:', trimmedLine);
          }
        }
      }

      const finalCount = Math.max(statementCount, 1);
      console.log('[DEBUG] Final expected statement count:', finalCount);
      return finalCount; // At least 1 statement expected
    } catch (error) {
      console.warn('[WARN][OpenscadParser] Failed to count expected statements:', error);
      return 1;
    }
  }

  /**
   * Fallback parsing strategy that parses each statement individually when Tree-sitter truncates input.
   * This method splits the code into individual statements and parses each one separately.
   */
  private parseLineByLineFallback(code: string): ASTNode[] {
    try {
      const lines = code.split('\n');
      const allNodes: ASTNode[] = [];
      let currentStatement = '';
      let lineNumber = 0;

      for (const line of lines) {
        const trimmedLine = line.trim();
        lineNumber++;

        // Skip empty lines and comments
        if (!trimmedLine || trimmedLine.startsWith('//') || trimmedLine.startsWith('/*')) {
          continue;
        }

        // Accumulate multi-line statements
        currentStatement += (currentStatement ? '\n' : '') + line;

        // Check if statement is complete
        if (this.isStatementComplete(currentStatement)) {
          console.log(
            `[DEBUG][OpenscadParser] Parsing statement: ${currentStatement.replace(/\n/g, '\\n')}`
          );

          // Parse this individual statement
          const statementNodes = this.parseIndividualStatement(currentStatement, lineNumber - 1);
          allNodes.push(...statementNodes);

          // Reset for next statement
          currentStatement = '';
        }
      }

      // Handle any remaining incomplete statement
      if (currentStatement.trim()) {
        console.log(
          `[DEBUG][OpenscadParser] Parsing final statement: ${currentStatement.replace(/\n/g, '\\n')}`
        );
        const statementNodes = this.parseIndividualStatement(currentStatement, lineNumber);
        allNodes.push(...statementNodes);
      }

      console.log(
        `[DEBUG][OpenscadParser] Line-by-line fallback produced ${allNodes.length} nodes`
      );
      return allNodes;
    } catch (error) {
      console.error('[ERROR][OpenscadParser] Line-by-line fallback failed:', error);
      return [];
    }
  }

  /**
   * Parse code line by line as a fallback when Tree-sitter fails to parse the full code.
   * Preserves standalone primitives from the initial parsing.
   */
  private parseLineByLineFallbackWithStandalonePrimitives(
    code: string,
    initialAST: ASTNode[]
  ): ASTNode[] {
    try {
      // First, collect standalone primitives from the initial AST
      const standalonePrimitives = initialAST.filter(
        (node) => this.isPrimitiveNode(node) && !this.isTransformNode(node)
      );

      const lines = code.split('\n');
      const allNodes: ASTNode[] = [];
      let currentStatement = '';
      let lineNumber = 0;

      for (const line of lines) {
        const trimmedLine = line.trim();
        lineNumber++;

        // Skip empty lines and comments
        if (!trimmedLine || trimmedLine.startsWith('//') || trimmedLine.startsWith('/*')) {
          continue;
        }

        // Accumulate multi-line statements
        currentStatement += (currentStatement ? '\n' : '') + line;

        // Check if statement is complete
        if (this.isStatementComplete(currentStatement)) {
          // Parse this individual statement
          const statementNodes = this.parseIndividualStatement(currentStatement, lineNumber - 1);

          // If this statement failed to parse but looks like a standalone primitive,
          // try to find it in the initial AST
          if (statementNodes.length === 0 && this.looksLikeStandalonePrimitive(currentStatement)) {
            const matchingPrimitive = this.findMatchingPrimitive(
              currentStatement,
              standalonePrimitives
            );
            if (matchingPrimitive) {
              allNodes.push(matchingPrimitive);
            }
          } else {
            allNodes.push(...statementNodes);
          }

          // Reset for next statement
          currentStatement = '';
        }
      }

      // Handle any remaining incomplete statement
      if (currentStatement.trim()) {
        const statementNodes = this.parseIndividualStatement(currentStatement, lineNumber);

        // Check for standalone primitive in final statement too
        if (statementNodes.length === 0 && this.looksLikeStandalonePrimitive(currentStatement)) {
          const matchingPrimitive = this.findMatchingPrimitive(
            currentStatement,
            standalonePrimitives
          );
          if (matchingPrimitive) {
            allNodes.push(matchingPrimitive);
          }
        } else {
          allNodes.push(...statementNodes);
        }
      }
      return allNodes;
    } catch (error) {
      console.error(
        '[ERROR][OpenscadParser] Line-by-line fallback with standalone primitives failed:',
        error
      );
      return [];
    }
  }

  /**
   * Check if a statement is complete (ends with semicolon or is a complete transform block).
   */
  private isStatementComplete(statement: string): boolean {
    const trimmed = statement.trim();

    // Statement ends with semicolon
    if (trimmed.endsWith(';')) {
      return true;
    }

    // Transform statement with child on next line (multi-line pattern)
    const lines = statement.split('\n');
    if (lines.length >= 2) {
      const firstLine = lines[0].trim();
      const hasTransform = firstLine.match(
        /^(translate|rotate|scale|mirror|multmatrix|color|offset)\s*\(/
      );
      const hasChildWithSemicolon = lines.slice(1).some((line) => line.trim().endsWith(';'));

      if (hasTransform && hasChildWithSemicolon) {
        return true;
      }
    }

    return false;
  }

  /**
   * Parse an individual statement using Tree-sitter and apply workarounds.
   */
  private parseIndividualStatement(statement: string, startLine: number): ASTNode[] {
    try {
      // Parse the individual statement
      const cst = this.parseCST(statement);
      if (!cst || !this.language) {
        return [];
      }

      const astGenerator = new VisitorASTGenerator(
        cst,
        statement,
        this.language,
        this.errorHandler
      );
      this.astGenerators.add(astGenerator);

      let nodes = astGenerator.generate();

      // Apply workarounds for this individual statement
      nodes = this.applyStatementLevelWorkarounds(statement, nodes, startLine);

      return nodes;
    } catch (error) {
      console.error('[ERROR][OpenscadParser] Failed to parse individual statement:', error);
      return [];
    }
  }

  /**
   * Apply workarounds at the statement level (without recursion).
   */
  private applyStatementLevelWorkarounds(
    statement: string,
    nodes: ASTNode[],
    startLine: number
  ): ASTNode[] {
    try {
      // Check for incomplete transforms and apply source code analysis
      const enhancedNodes = nodes.map((node) => {
        if (
          this.isTransformNode(node) &&
          'children' in node &&
          Array.isArray(node.children) &&
          node.children.length === 0
        ) {
          // Try to find child primitive in the statement
          const childNode = this.findChildPrimitiveInStatement(statement, node, startLine);
          if (childNode) {
            return {
              ...node,
              children: [childNode],
            };
          }
        }
        return node;
      });

      return enhancedNodes;
    } catch (error) {
      console.error('[ERROR][OpenscadParser] Statement-level workaround failed:', error);
      return nodes;
    }
  }

  /**
   * Find child primitive in a statement using source code analysis.
   */
  private findChildPrimitiveInStatement(
    statement: string,
    transformNode: ASTNode,
    startLine: number
  ): ASTNode | null {
    try {
      const lines = statement.split('\n');

      // Look for primitives in the statement
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const primitiveMatch = line.match(
          /(cube|sphere|cylinder|polyhedron|circle|square|polygon)\s*\(/
        );

        if (primitiveMatch) {
          const primitiveType = primitiveMatch[1];
          const primitiveStart = line.indexOf(primitiveType);

          // Create synthetic primitive node with actual parameters from source code
          return this.createSyntheticPrimitive(primitiveType, startLine + i, primitiveStart, line);
        }
      }

      return null;
    } catch (error) {
      console.error('[ERROR][OpenscadParser] Failed to find child primitive in statement:', error);
      return null;
    }
  }

  /**
   * Create a synthetic primitive node for workarounds with actual parameters from source code.
   */
  private createSyntheticPrimitive(
    primitiveType: string,
    line: number,
    column: number,
    sourceLine?: string
  ): ASTNode {
    const location = {
      start: { line, column, offset: 0 },
      end: { line, column: column + primitiveType.length, offset: primitiveType.length },
    };

    switch (primitiveType) {
      case 'cube':
        return this.createSyntheticCube(location, sourceLine);
      case 'sphere':
        return this.createSyntheticSphere(location, sourceLine);
      case 'cylinder':
        return this.createSyntheticCylinder(location, sourceLine);
      default:
        return {
          type: primitiveType as any,
          location,
        };
    }
  }

  /**
   * Create a synthetic cube node with parameters extracted from source code.
   */
  private createSyntheticCube(location: any, sourceLine?: string): ASTNode {
    let size: number | [number, number, number] = 1; // default (OpenSCAD standard)
    let center = false; // default

    if (sourceLine) {
      try {
        // Extract cube parameters from source line
        // Pattern: cube(size, center=true/false) or cube([x,y,z], center=true/false)
        // Updated regex to handle vector syntax with brackets and commas
        const cubeMatch = sourceLine.match(
          /cube\s*\(\s*(\[[^\]]+\]|[^,)]+)(?:\s*,\s*center\s*=\s*(true|false))?\s*\)/
        );

        if (cubeMatch) {
          const sizeParam = cubeMatch[1].trim();
          const centerParam = cubeMatch[2];

          // Parse size parameter
          if (sizeParam.startsWith('[') && sizeParam.endsWith(']')) {
            // Vector size: [x, y, z]
            const vectorContent = sizeParam.slice(1, -1); // Remove [ and ]
            const components = vectorContent.split(',').map((s) => s.trim());
            if (components.length === 3) {
              const x = parseFloat(components[0] || '0');
              const y = parseFloat(components[1] || '0');
              const z = parseFloat(components[2] || '0');
              if (!isNaN(x) && !isNaN(y) && !isNaN(z)) {
                size = [x, y, z];
              }
            }
          } else {
            // Scalar size
            const scalarSize = parseFloat(sizeParam);
            if (!isNaN(scalarSize)) {
              size = scalarSize;
            } else {
            }
          }

          // Parse center parameter
          if (centerParam) {
            center = centerParam === 'true';
          }
        }
      } catch (error) {
        console.error(
          '[ERROR][OpenscadParser] Failed to parse cube parameters from source line:',
          error
        );
      }
    }

    return {
      type: 'cube',
      size,
      center,
      location,
    };
  }

  /**
   * Create a synthetic sphere node with parameters extracted from source code.
   */
  private createSyntheticSphere(location: any, sourceLine?: string): ASTNode {
    let radius = 5; // default

    if (sourceLine) {
      try {
        // Extract sphere parameters from source line
        // Pattern: sphere(radius) or sphere(r=radius)
        const sphereMatch = sourceLine.match(/sphere\s*\(\s*(?:r\s*=\s*)?([^,)]+)\s*\)/);

        if (sphereMatch && sphereMatch[1]) {
          const radiusParam = sphereMatch[1].trim();
          const parsedRadius = parseFloat(radiusParam);
          if (!isNaN(parsedRadius)) {
            radius = parsedRadius;
          }
        }
      } catch (error) {
        console.error(
          '[ERROR][OpenscadParser] Failed to parse sphere parameters from source line:',
          error
        );
      }
    }

    return {
      type: 'sphere',
      radius,
      location,
    };
  }

  /**
   * Create a synthetic cylinder node with parameters extracted from source code.
   */
  private createSyntheticCylinder(location: any, sourceLine?: string): ASTNode {
    let h = 10; // default height
    let r1 = 5; // default bottom radius
    let r2 = 5; // default top radius
    let center = false; // default

    if (sourceLine) {
      try {
        // Extract cylinder parameters from source line
        // Pattern: cylinder(h=height, r=radius) or cylinder(h=height, r1=r1, r2=r2, center=true/false)
        const cylinderMatch = sourceLine.match(/cylinder\s*\(([^)]+)\)/);

        if (cylinderMatch && cylinderMatch[1]) {
          const params = cylinderMatch[1];

          // Parse height
          const hMatch = params.match(/h\s*=\s*([^,)]+)/);
          if (hMatch && hMatch[1]) {
            const parsedH = parseFloat(hMatch[1].trim());
            if (!isNaN(parsedH)) {
              h = parsedH;
            }
          }

          // Parse radius (single radius)
          const rMatch = params.match(/(?:^|,)\s*r\s*=\s*([^,)]+)/);
          if (rMatch && rMatch[1]) {
            const parsedR = parseFloat(rMatch[1].trim());
            if (!isNaN(parsedR)) {
              r1 = r2 = parsedR;
            }
          } else {
            // Parse r1 and r2 separately
            const r1Match = params.match(/r1\s*=\s*([^,)]+)/);
            if (r1Match && r1Match[1]) {
              const parsedR1 = parseFloat(r1Match[1].trim());
              if (!isNaN(parsedR1)) {
                r1 = parsedR1;
              }
            }

            const r2Match = params.match(/r2\s*=\s*([^,)]+)/);
            if (r2Match && r2Match[1]) {
              const parsedR2 = parseFloat(r2Match[1].trim());
              if (!isNaN(parsedR2)) {
                r2 = parsedR2;
              }
            }
          }

          // Parse center parameter
          const centerMatch = params.match(/center\s*=\s*(true|false)/);
          if (centerMatch && centerMatch[1]) {
            center = centerMatch[1] === 'true';
          }
        }
      } catch (error) {
        console.error(
          '[ERROR][OpenscadParser] Failed to parse cylinder parameters from source line:',
          error
        );
      }
    }

    return {
      type: 'cylinder',
      h,
      r1,
      r2,
      center,
      location,
    };
  }

  /**
   * Associate transform nodes with their child primitives by parsing individual statements.
   *
   * This method works around the Tree-sitter grammar limitation by:
   * 1. Splitting the code into individual statements
   * 2. Parsing each statement separately to capture all primitives
   * 3. Using source location analysis to associate primitives with transforms
   *
   * @param code - The original OpenSCAD source code
   * @param initialAST - The initial AST with incomplete transform nodes
   * @returns Enhanced AST with correct parent-child relationships
   */
  private associateTransformsWithPrimitives(code: string, initialAST: ASTNode[]): ASTNode[] {
    try {
      // Split code into lines and analyze each statement
      const lines = code.split('\n');
      const enhancedAST: ASTNode[] = [];

      for (const node of initialAST) {
        if (
          this.isTransformNode(node) &&
          'children' in node &&
          Array.isArray(node.children) &&
          node.children.length === 0
        ) {
          // This is an incomplete transform node - try to find its child primitive
          const enhancedNode = this.findChildPrimitiveForTransform(node, lines);
          enhancedAST.push(enhancedNode);
        } else {
          // Node is complete, keep as-is
          enhancedAST.push(node);
        }
      }

      return enhancedAST;
    } catch (error) {
      this.errorHandler.handleError(
        new Error(`Failed to associate transforms with primitives: ${error}`)
      );
      return initialAST;
    }
  }

  /**
   * Find the child primitive for a transform node by analyzing the source code.
   *
   * @param transformNode - The transform node that needs a child
   * @param lines - The source code split into lines
   * @returns The transform node with its child primitive (if found)
   */
  private findChildPrimitiveForTransform(transformNode: ASTNode, lines: string[]): ASTNode {
    if (!transformNode.location) {
      return transformNode;
    }

    try {
      // Look for the line containing this transform
      const transformLine = lines[transformNode.location.start.line];
      if (!transformLine) {
        return transformNode;
      }

      // Check if the line contains both transform and primitive (e.g., "translate([10,0,0]) sphere(10);")
      // We need to find the primitive that comes AFTER the transform, not any primitive in the line
      const transformMatch = transformLine.match(/(translate|rotate|scale|mirror)\s*\([^)]+\)/);
      if (transformMatch) {
        const transformEnd = transformMatch.index! + transformMatch[0].length;
        const afterTransform = transformLine.substring(transformEnd);

        const primitiveMatch = afterTransform.match(
          /\s*(cube|sphere|cylinder|polyhedron|circle|square|polygon)\s*\(/
        );
        if (primitiveMatch) {
          const primitiveType = primitiveMatch[1];
          if (!primitiveType) {
            return transformNode;
          }

          // Extract the primitive part that comes after the transform
          const primitiveStart = transformEnd + afterTransform.indexOf(primitiveType);
          const primitivePart = transformLine.substring(primitiveStart);

          // Instead of parsing the primitive part with Tree-sitter (which can fail),
          // use the synthetic primitive creation approach that works reliably
          const syntheticPrimitive = this.createSyntheticPrimitive(
            primitiveType,
            transformNode.location?.start.line || 0,
            primitiveStart,
            primitivePart
          );

          // Add the synthetic primitive as a child of the transform
          const enhancedTransform = { ...transformNode };
          if ('children' in enhancedTransform && Array.isArray(enhancedTransform.children)) {
            enhancedTransform.children = [syntheticPrimitive];
          }
          return enhancedTransform;
        }
      }
    } catch (error) {
      this.errorHandler.handleError(
        new Error(`Failed to find child primitive for transform: ${error}`)
      );
    }

    return transformNode;
  }

  /**
   * Parse OpenSCAD code and return a Result type for better error handling
   */
  parseASTWithResult(code: string): Result<ASTNode[], string> {
    try {
      const cst = this.parseCST(code);
      if (!cst) {
        return { success: false, error: 'Failed to generate CST' };
      }

      if (!this.language) {
        return { success: false, error: 'Parser language not initialized' };
      }
      const astGenerator = new VisitorASTGenerator(cst, code, this.language, this.errorHandler);

      // Track the AST generator for proper cleanup
      this.astGenerators.add(astGenerator);

      // Generate AST using visitor pattern
      const ast = astGenerator.generate();

      // Apply workaround for Tree-sitter grammar limitations
      const workaroundAST = this.applyGrammarWorkarounds(code, ast);
      return { success: true, data: workaroundAST };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.errorHandler.handleError(new Error(`Failed to generate AST: ${errorMessage}`));
      return { success: false, error: errorMessage };
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
      this.errorHandler.handleError(new Error(`Failed to update parse tree: ${error}`));
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
      // First update the CST incrementally
      const updatedTree = this.update(newCode, startIndex, oldEndIndex, newEndIndex);

      if (!updatedTree) {
        return [];
      }

      // Generate new AST from updated CST
      const astGenerator = new VisitorASTGenerator(
        updatedTree,
        newCode,
        this.language,
        this.errorHandler as any
      );

      // Track the AST generator for proper cleanup
      this.astGenerators.add(astGenerator);

      const ast = astGenerator.generate();
      return ast;
    } catch (error) {
      this.errorHandler.handleError(new Error(`Failed to update AST: ${error}`));
      throw error;
    }
  }
  /**
   * Gets the Tree Sitter language object.
   *
   * @returns The Tree Sitter language object or null if not initialized
   * @since 0.1.0
   */
  getLanguage(): TreeSitter.Language | null {
    return this.language;
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
      // Clear previous tree first to break any references
      if (this.previousTree) {
        this.previousTree.delete();
        this.previousTree = null;
      }

      // Dispose all AST generators and their Query objects
      for (const astGenerator of this.astGenerators) {
        if (astGenerator && typeof astGenerator.dispose === 'function') {
          astGenerator.dispose();
        }
      }
      this.astGenerators.clear();

      // Dispose parser instance
      if (this.parser) {
        this.parser.delete();
        this.parser = null;
      }

      // Dispose language instance if it has a delete method (WASM builds)
      if (
        this.language &&
        typeof (this.language as unknown as { delete?: () => void }).delete === 'function'
      ) {
        (this.language as unknown as { delete: () => void }).delete();
      }
      this.language = null;

      // Clear initialization flag
      this.isInitialized = false;

      // Clear error handler if it has cleanup methods
      if (
        this.errorHandler &&
        typeof (this.errorHandler as unknown as { clear?: () => void }).clear === 'function'
      ) {
        (this.errorHandler as unknown as { clear: () => void }).clear();
      }
    } catch (error) {
      this.errorHandler.handleError(new Error(`Error disposing parser: ${error}`));
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
  getErrorHandler(): SimpleErrorHandler {
    return this.simpleErrorHandler;
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
      errorMessage += `${' '.repeat(errorColumn)}^`;
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
   * Check if a statement looks like a standalone primitive (sphere, cube, etc.)
   */
  private looksLikeStandalonePrimitive(statement: string): boolean {
    const trimmed = statement.trim();
    const primitivePattern =
      /^(sphere|cube|cylinder|polyhedron|circle|square|polygon|text|linear_extrude|rotate_extrude|hull|minkowski|offset|projection|surface|import)\s*\(/;
    return primitivePattern.test(trimmed);
  }

  /**
   * Find a matching primitive in the standalone primitives list
   */
  private findMatchingPrimitive(
    statement: string,
    standalonePrimitives: ASTNode[]
  ): ASTNode | null {
    const trimmed = statement.trim();

    // Extract the primitive type from the statement
    const primitiveMatch = trimmed.match(/^(\w+)\s*\(/);
    if (!primitiveMatch) {
      return null;
    }

    const primitiveType = primitiveMatch[1];

    // Find a matching primitive in the list
    return standalonePrimitives.find((node) => node.type === primitiveType) || null;
  }

  /**
   * Check if a node is a primitive node
   */
  private isPrimitiveNode(node: ASTNode): boolean {
    const primitiveTypes = [
      'sphere',
      'cube',
      'cylinder',
      'polyhedron',
      'circle',
      'square',
      'polygon',
      'text',
      'linear_extrude',
      'rotate_extrude',
      'hull',
      'minkowski',
      'offset',
      'projection',
      'surface',
      'import',
    ];
    return primitiveTypes.includes(node.type);
  }

  /**
   * Check if a node is a transform node
   */
  private isTransformNode(node: ASTNode): boolean {
    const transformTypes = [
      'translate',
      'rotate',
      'scale',
      'mirror',
      'multmatrix',
      'color',
      'resize',
    ];
    return transformTypes.includes(node.type);
  }
}
