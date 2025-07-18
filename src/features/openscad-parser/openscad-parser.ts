/**
 * @file openscad-parser.ts
 * @description This file contains the main `OpenscadParser` class, which is responsible for parsing OpenSCAD code,
 * generating an Abstract Syntax Tree (AST), and handling errors. It integrates the Tree-sitter parsing library
 * with a custom visitor-based AST generator to provide a comprehensive parsing solution.
 *
 * @architectural_decision
 * The parser is designed as a class to encapsulate its state, including the Tree-sitter parser instance,
 * the loaded language grammar, and the error handler. This makes it easier to manage the parser's lifecycle,
 * from initialization to disposal. The parser uses a cold parsing approach (parsing the entire code on each change)
 * to ensure maximum reliability, which is a trade-off for performance in favor of correctness.
 * It also includes several workarounds to handle limitations in the Tree-sitter grammar for OpenSCAD.
 */

import * as TreeSitter from 'web-tree-sitter';
import type { Result } from '../../shared/types/result.types.js';
import type { ASTNode, SourceLocation } from './ast/ast-types.js';
import { VisitorASTGenerator } from './ast/index.js';

import { ErrorHandler } from './error-handling/index.js';
import { type IErrorHandler, SimpleErrorHandler } from './error-handling/simple-error-handler.js';

/**
 * @class OpenscadParser
 * @description A high-level parser for OpenSCAD code that generates a structured AST and handles errors.
 * It combines Tree-sitter for CST parsing with a visitor pattern for AST generation.
 *
 * @example
 * ```typescript
 * import { OpenscadParser, SimpleErrorHandler } from './openscad-parser';
 *
 * const errorHandler = new SimpleErrorHandler();
 * const parser = new OpenscadParser(errorHandler);
 *
 * async function main() {
 *   await parser.init();
 *   const ast = parser.parseAST('cube(10);');
 *   console.log(ast);
 *   parser.dispose();
 * }
 *
 * main();
 * ```
 */
export class OpenscadParser {
  private parser: TreeSitter.Parser | null = null;
  private language: TreeSitter.Language | null = null;
  private errorHandler: ErrorHandler;
  private simpleErrorHandler: SimpleErrorHandler;
  private astGenerators: Set<import('./ast/visitor-ast-generator.js').VisitorASTGenerator> =
    new Set();
  public isInitialized = false;

  /**
   * @constructor
   * @description Creates a new instance of the OpenscadParser.
   * @param {IErrorHandler} [errorHandler] - An optional custom error handler. If not provided, a `SimpleErrorHandler` is used.
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
   * @method init
   * @description Initializes the parser by loading the OpenSCAD grammar from a WASM file.
   * This method must be called before any parsing can be done.
   *
   * @param {string} [wasmPath='./tree-sitter-openscad.wasm'] - The path to the Tree-sitter OpenSCAD WASM grammar file.
   * @param {string} [treeSitterWasmPath='./tree-sitter.wasm'] - The path to the main Tree-sitter WASM file.
   * @returns {Promise<void>} A promise that resolves when the parser is initialized.
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
   * @method parseCST
   * @description Parses the given OpenSCAD code into a Concrete Syntax Tree (CST).
   *
   * @param {string} code - The OpenSCAD code to parse.
   * @returns {TreeSitter.Tree | null} The parsed CST, or null if parsing fails.
   */
  parseCST(code: string): TreeSitter.Tree | null {
    if (!this.parser) {
      throw new Error('Parser not initialized');
    }

    try {
      // Use cold parsing only for maximum reliability
      const tree = this.parser.parse(code, undefined);

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
   * @method parseAST
   * @description Parses the OpenSCAD code and generates an Abstract Syntax Tree (AST).
   * This is the primary method for obtaining a structured representation of the code.
   *
   * @param {string} code - The OpenSCAD code to parse.
   * @returns {ASTNode[]} An array of AST nodes representing the parsed code.
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
   * @method applyGrammarWorkarounds
   * @description Applies workarounds for known limitations in the Tree-sitter OpenSCAD grammar.
   * This method is crucial for correctly parsing certain language constructs that the grammar struggles with.
   *
   * @param {string} code - The original OpenSCAD source code.
   * @param {ASTNode[]} initialAST - The initial AST generated from the CST.
   * @returns {ASTNode[]} The enhanced AST with workarounds applied.
   * @private
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
   * @method isTransformNode
   * @description Checks if a given AST node is a transformation node (e.g., translate, rotate).
   * @param {ASTNode} node - The AST node to check.
   * @returns {boolean} True if the node is a transform node, false otherwise.
   * @private
   */
  private isTransformNode(node: ASTNode): boolean {
    return ['translate', 'rotate', 'scale', 'mirror', 'multmatrix', 'color', 'offset'].includes(
      node.type
    );
  }

  /**
   * @method countExpectedStatements
   * @description Counts the expected number of statements in the code to detect parsing truncation by Tree-sitter.
   * @param {string} code - The OpenSCAD code.
   * @returns {number} The expected number of statements.
   * @private
   */
  private countExpectedStatements(code: string): number {
    try {
      console.log('[DEBUG] countExpectedStatements called with code:', code.replace(/\n/g, '\\n'));

      // For block statements (union, difference, intersection), count as single statement
      const blockStatementPattern =
        /^\s*(union|difference|intersection|hull|minkowski)\s*\(.*\?\)\s*\{/;
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
   * @method parseLineByLineFallback
   * @description A fallback parsing strategy that parses the code line by line.
   * This is used when Tree-sitter fails to parse the entire code block correctly.
   * @param {string} code - The OpenSCAD code.
   * @returns {ASTNode[]} An array of AST nodes parsed from the code.
   * @private
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
   * @method parseLineByLineFallbackWithStandalonePrimitives
   * @description A more advanced line-by-line fallback that preserves standalone primitives from the initial parse.
   * @param {string} code - The OpenSCAD code.
   * @param {ASTNode[]} initialAST - The initial (potentially truncated) AST.
   * @returns {ASTNode[]} The reconstructed AST.
   * @private
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
   * @method isStatementComplete
   * @description Checks if a given string forms a complete OpenSCAD statement.
   * @param {string} statement - The statement to check.
   * @returns {boolean} True if the statement is complete.
   * @private
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
      const firstLine = lines[0]?.trim() ?? '';
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
   * @method parseIndividualStatement
   * @description Parses a single OpenSCAD statement.
   * @param {string} statement - The statement to parse.
   * @param {number} startLine - The starting line number of the statement in the original code.
   * @returns {ASTNode[]} An array of AST nodes for the statement.
   * @private
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
   * @method applyStatementLevelWorkarounds
   * @description Applies grammar workarounds to a single statement's AST.
   * @param {string} statement - The source code of the statement.
   * @param {ASTNode[]} nodes - The AST nodes of the statement.
   * @param {number} startLine - The starting line number.
   * @returns {ASTNode[]} The enhanced AST for the statement.
   * @private
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
   * @method findChildPrimitiveInStatement
   * @description Finds a child primitive within a statement string for a given transform node.
   * @param {string} statement - The statement's source code.
   * @param {ASTNode} _transformNode - The transform node.
   * @param {number} startLine - The starting line number.
   * @returns {ASTNode | null} The found primitive node, or null.
   * @private
   */
  private findChildPrimitiveInStatement(
    statement: string,
    _transformNode: ASTNode,
    startLine: number
  ): ASTNode | null {
    try {
      const lines = statement.split('\n');

      // Look for primitives in the statement
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!line) continue;

        const primitiveMatch = line.match(
          /(cube|sphere|cylinder|polyhedron|circle|square|polygon)\s*\(/
        );

        if (primitiveMatch) {
          const primitiveType = primitiveMatch[1];
          if (!primitiveType) continue;

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
   * @method createSyntheticPrimitive
   * @description Creates a synthetic AST node for a primitive, extracting parameters from the source code.
   * This is a core part of the grammar workaround.
   * @param {string} primitiveType - The type of the primitive (e.g., 'cube', 'sphere').
   * @param {number} line - The line number.
   * @param {number} column - The column number.
   * @param {string} [sourceLine] - The source code line containing the primitive.
   * @returns {ASTNode} The synthetic AST node.
   * @private
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
          type: primitiveType as string,
          location,
        };
    }
  }

  /**
   * @method createSyntheticCube
   * @description Creates a synthetic cube node with parameters extracted from the source line.
   * @param {SourceLocation} location - The location of the node.
   * @param {string} [sourceLine] - The source line.
   * @returns {ASTNode} The synthetic cube node.
   * @private
   */
  private createSyntheticCube(location: SourceLocation, sourceLine?: string): ASTNode {
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
          const sizeParam = cubeMatch[1]?.trim() ?? '';
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
              if (!Number.isNaN(x) && !Number.isNaN(y) && !Number.isNaN(z)) {
                size = [x, y, z];
              }
            }
          } else {
            // Scalar size
            const scalarSize = parseFloat(sizeParam);
            if (!Number.isNaN(scalarSize)) {
              size = scalarSize;
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
   * @method createSyntheticSphere
   * @description Creates a synthetic sphere node with parameters extracted from the source line.
   * @param {SourceLocation} location - The location of the node.
   * @param {string} [sourceLine] - The source line.
   * @returns {ASTNode} The synthetic sphere node.
   * @private
   */
  private createSyntheticSphere(location: SourceLocation, sourceLine?: string): ASTNode {
    let radius = 5; // default

    if (sourceLine) {
      try {
        // Extract sphere parameters from source line
        // Pattern: sphere(radius) or sphere(r=radius)
        const sphereMatch = sourceLine.match(/sphere\s*\(\s*(?:r\s*=\s*)?([^,)]+)\s*\)/);

        if (sphereMatch?.[1]) {
          const radiusParam = sphereMatch[1].trim();
          const parsedRadius = parseFloat(radiusParam);
          if (!Number.isNaN(parsedRadius)) {
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
   * @method createSyntheticCylinder
   * @description Creates a synthetic cylinder node with parameters extracted from the source line.
   * @param {SourceLocation} location - The location of the node.
   * @param {string} [sourceLine] - The source line.
   * @returns {ASTNode} The synthetic cylinder node.
   * @private
   */
  private createSyntheticCylinder(location: SourceLocation, sourceLine?: string): ASTNode {
    let h = 10; // default height
    let r1 = 5; // default bottom radius
    let r2 = 5; // default top radius
    let center = false; // default

    if (sourceLine) {
      try {
        // Extract cylinder parameters from source line
        // Pattern: cylinder(h=height, r=radius) or cylinder(h=height, r1=r1, r2=r2, center=true/false)
        const cylinderMatch = sourceLine.match(/cylinder\s*\(([^)]+)\)/);

        if (cylinderMatch?.[1]) {
          const params = cylinderMatch[1];

          // Parse height
          const hMatch = params.match(/h\s*=\s*([^,)]+)/);
          if (hMatch?.[1]) {
            const parsedH = parseFloat(hMatch[1].trim());
            if (!Number.isNaN(parsedH)) {
              h = parsedH;
            }
          }

          // Parse radius (single radius)
          const rMatch = params.match(/(?:^|,)\s*r\s*=\s*([^,)]+)/);
          if (rMatch?.[1]) {
            const parsedR = parseFloat(rMatch[1].trim());
            if (!Number.isNaN(parsedR)) {
              r1 = r2 = parsedR;
            }
          } else {
            // Parse r1 and r2 separately
            const r1Match = params.match(/r1\s*=\s*([^,)]+)/);
            if (r1Match?.[1]) {
              const parsedR1 = parseFloat(r1Match[1].trim());
              if (!Number.isNaN(parsedR1)) {
                r1 = parsedR1;
              }
            }

            const r2Match = params.match(/r2\s*=\s*([^,)]+)/);
            if (r2Match?.[1]) {
              const parsedR2 = parseFloat(r2Match[1].trim());
              if (!Number.isNaN(parsedR2)) {
                r2 = parsedR2;
              }
            }
          }

          // Parse center parameter
          const centerMatch = params.match(/center\s*=\s*(true|false)/);
          if (centerMatch?.[1]) {
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
   * @method associateTransformsWithPrimitives
   * @description Associates transform nodes with their child primitives by analyzing the source code.
   * This is a key workaround for grammar limitations.
   * @param {string} code - The OpenSCAD source code.
   * @param {ASTNode[]} initialAST - The initial AST.
   * @returns {ASTNode[]} The enhanced AST.
   * @private
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
   * @method findChildPrimitiveForTransform
   * @description Finds the child primitive for a transform node by analyzing the source code.
   * @param {ASTNode} transformNode - The transform node.
   * @param {string[]} lines - The source code lines.
   * @returns {ASTNode} The transform node, potentially with its child attached.
   * @private
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
   * @method parse
   * @description Asynchronously parses OpenSCAD code and returns a `Result` object.
   * @param {string} code - The OpenSCAD code.
   * @returns {Promise<Result<{ body: ASTNode[] }, string>>} A result object containing the AST or an error.
   */
  async parse(code: string): Promise<Result<{ body: ASTNode[] }, string>> {
    try {
      const astResult = this.parseASTWithResult(code);

      if (!astResult.success) {
        return { success: false, error: astResult.error };
      }

      return {
        success: true,
        data: { body: astResult.data },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * @method parseASTWithResult
   * @description Parses OpenSCAD code and returns a `Result` object, suitable for functional error handling.
   * @param {string} code - The OpenSCAD code.
   * @returns {Result<ASTNode[], string>} A result object containing the AST or an error message.
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
   * @method getLanguage
   * @description Returns the loaded Tree-sitter language object.
   * @returns {TreeSitter.Language | null} The language object, or null if not initialized.
   */
  getLanguage(): TreeSitter.Language | null {
    return this.language;
  }

  /**
   * @method dispose
   * @description Releases all resources used by the parser instance, preventing memory leaks.
   * After calling `dispose`, the parser must be re-initialized before use.
   */
  dispose(): void {
    try {
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
   * @method getErrorHandler
   * @description Returns the error handler instance used by the parser.
   * @returns {SimpleErrorHandler} The error handler instance.
   */
  getErrorHandler(): SimpleErrorHandler {
    return this.simpleErrorHandler;
  }

  /**
   * @method hasErrorNodes
   * @description Recursively checks if a CST node or any of its descendants is an error node.
   * @param {TreeSitter.Node} node - The node to check.
   * @returns {boolean} True if an error node is found.
   * @private
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
   * @method hasMissingTokens
   * @description Checks if the string representation of a CST node contains missing tokens.
   * @param {TreeSitter.Node} node - The node to check.
   * @returns {boolean} True if missing tokens are found.
   * @private
   */
  private hasMissingTokens(node: TreeSitter.Node): boolean {
    const treeString = node.toString();
    return treeString.includes('MISSING');
  }

  /**
   * @method formatSyntaxError
   * @description Formats a user-friendly syntax error message with code context.
   * @param {string} code - The source code.
   * @param {TreeSitter.Node} rootNode - The root node of the CST.
   * @returns {string} The formatted error message.
   * @private
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
   * @method findFirstErrorNode
   * @description Recursively finds the first error node in the CST.
   * @param {TreeSitter.Node} node - The node to start the search from.
   * @returns {TreeSitter.Node | null} The first error node found, or null.
   * @private
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
   * @method findFirstMissingToken
   * @description Recursively finds the first node representing a missing token.
   * @param {TreeSitter.Node} node - The node to start the search from.
   * @returns {TreeSitter.Node | null} The first node with a missing token, or null.
   * @private
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
   * @method looksLikeStandalonePrimitive
   * @description Checks if a statement appears to be a standalone primitive.
   * @param {string} statement - The statement to check.
   * @returns {boolean} True if it looks like a standalone primitive.
   * @private
   */
  private looksLikeStandalonePrimitive(statement: string): boolean {
    const trimmed = statement.trim();
    const primitivePattern =
      /^(sphere|cube|cylinder|polyhedron|circle|square|polygon|text|linear_extrude|rotate_extrude|hull|minkowski|offset|projection|surface|import)\s*\(/;
    return primitivePattern.test(trimmed);
  }

  /**
   * @method findMatchingPrimitive
   * @description Finds a matching primitive from a list of standalone primitives.
   * @param {string} statement - The statement containing the primitive.
   * @param {ASTNode[]} standalonePrimitives - The list of available primitives.
   * @returns {ASTNode | null} The matching primitive node, or null.
   * @private
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
   * @method isPrimitiveNode
   * @description Checks if an AST node is a primitive type.
   * @param {ASTNode} node - The node to check.
   * @returns {boolean} True if the node is a primitive.
   * @private
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
}
