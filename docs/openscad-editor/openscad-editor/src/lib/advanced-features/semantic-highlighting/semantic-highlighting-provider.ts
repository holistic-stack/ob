/**
 * @file OpenSCAD Semantic Highlighting Provider
 * @description Provides semantic highlighting for OpenSCAD code using AST analysis
 * to distinguish between different types of symbols (modules, functions, variables, etc.)
 * 
 * Features:
 * - AST-based semantic token analysis
 * - Different highlighting for modules, functions, variables, parameters
 * - Built-in OpenSCAD function recognition
 * - User-defined symbol classification
 * - Performance optimized with caching
 * 
 * @example
 * ```typescript
 * const semanticProvider = new OpenSCADSemanticHighlightingProvider(parserService);
 * monaco.languages.registerDocumentSemanticTokensProvider('openscad', semanticProvider);
 * ```
 */

import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import type { OpenSCADParserService } from '../../services/openscad-parser-service';

// Semantic token types following VS Code standards
export const SEMANTIC_TOKEN_TYPES = [
  'namespace',     // 0 - modules
  'function',      // 1 - functions
  'variable',      // 2 - variables
  'parameter',     // 3 - parameters
  'property',      // 4 - object properties
  'keyword',       // 5 - OpenSCAD keywords
  'number',        // 6 - numeric literals
  'string',        // 7 - string literals
  'comment',       // 8 - comments
  'operator',      // 9 - operators
  'type',          // 10 - built-in types
  'macro'          // 11 - built-in OpenSCAD functions
] as const;

export const SEMANTIC_TOKEN_MODIFIERS = [
  'declaration',   // 0 - symbol declaration
  'definition',    // 1 - symbol definition
  'readonly',      // 2 - constants
  'static',        // 3 - static/global scope
  'deprecated',    // 4 - deprecated symbols
  'modification',  // 5 - symbol modification
  'documentation', // 6 - documentation
  'defaultLibrary' // 7 - built-in library functions
] as const;

interface SemanticToken {
  readonly line: number;
  readonly startChar: number;
  readonly length: number;
  readonly tokenType: number;
  readonly tokenModifiers: number;
}

interface ASTNode {
  readonly type: string;
  readonly text?: string;
  readonly startPosition?: { row: number; column: number };
  readonly endPosition?: { row: number; column: number };
  readonly children?: ASTNode[];
  readonly [key: string]: any;
}

interface SymbolInfo {
  readonly name: string;
  readonly kind: 'module' | 'function' | 'variable' | 'parameter' | 'constant';
  readonly loc?: {
    readonly start: { line: number; column: number };
    readonly end: { line: number; column: number };
  };
}

/**
 * Configuration for semantic highlighting behavior
 */
export interface SemanticHighlightingConfig {
  readonly enableBuiltinHighlighting: boolean;
  readonly enableUserDefinedHighlighting: boolean;
  readonly enableParameterHighlighting: boolean;
  readonly enableCommentHighlighting: boolean;
  readonly cacheResults: boolean;
  readonly maxCacheSize: number;
}

export const DEFAULT_SEMANTIC_CONFIG: SemanticHighlightingConfig = {
  enableBuiltinHighlighting: true,
  enableUserDefinedHighlighting: true,
  enableParameterHighlighting: true,
  enableCommentHighlighting: true,
  cacheResults: true,
  maxCacheSize: 100
};

/**
 * Built-in OpenSCAD functions for semantic highlighting
 */
const BUILTIN_OPENSCAD_FUNCTIONS = new Set([
  // 3D primitives
  'cube', 'sphere', 'cylinder', 'polyhedron',
  // 2D primitives
  'circle', 'square', 'polygon', 'text',
  // Transformations
  'translate', 'rotate', 'scale', 'resize', 'mirror',
  'multmatrix', 'color', 'offset', 'hull', 'minkowski',
  // Boolean operations
  'union', 'difference', 'intersection',
  // Extrusion
  'linear_extrude', 'rotate_extrude',
  // Control structures
  'for', 'if', 'else', 'let', 'assign',
  // Functions
  'echo', 'assert', 'len', 'str', 'chr', 'ord',
  'abs', 'sign', 'sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'atan2',
  'floor', 'ceil', 'round', 'sqrt', 'pow', 'log', 'ln', 'exp',
  'min', 'max', 'norm', 'cross', 'concat', 'lookup',
  // Special variables
  '$fa', '$fs', '$fn', '$t', '$vpr', '$vpt', '$vpd', '$children'
]);

/**
 * OpenSCAD Semantic Highlighting Provider
 * 
 * Implements Monaco's DocumentSemanticTokensProvider interface to provide
 * semantic highlighting based on AST analysis.
 */
export class OpenSCADSemanticHighlightingProvider implements monaco.languages.DocumentSemanticTokensProvider {
  private readonly parserService: OpenSCADParserService | null;
  private readonly config: SemanticHighlightingConfig;
  
  // Performance optimization
  private readonly tokenCache = new Map<string, Uint32Array>();
  private lastDocumentVersion = -1;

  constructor(
    parserService?: OpenSCADParserService,
    config: Partial<SemanticHighlightingConfig> = {}
  ) {
    this.parserService = parserService || null;
    this.config = { ...DEFAULT_SEMANTIC_CONFIG, ...config };
  }

  /**
   * Monaco DocumentSemanticTokensProvider interface
   * 
   * Provides semantic tokens for the entire document based on AST analysis.
   */
  async provideDocumentSemanticTokens(
    model: monaco.editor.ITextModel,
    lastResultId: string | null,
    token: monaco.CancellationToken
  ): Promise<monaco.languages.SemanticTokens | null> {
    if (!this.parserService?.isReady()) {
      return null;
    }

    try {
      const documentVersion = model.getVersionId();
      const cacheKey = `${model.uri.toString()}-${documentVersion}`;

      // Check cache first
      if (this.config.cacheResults && this.tokenCache.has(cacheKey)) {
        return {
          data: this.tokenCache.get(cacheKey)!,
          resultId: cacheKey
        };
      }

      // Get AST from parser service
      const ast = this.getASTFromParserService();
      if (!ast) {
        return null;
      }

      // Extract semantic tokens from AST
      const tokens = this.extractSemanticTokens(ast, model);
      
      // Convert to Monaco format
      const data = this.encodeSemanticTokens(tokens);

      // Cache results
      if (this.config.cacheResults) {
        this.cacheTokens(cacheKey, data);
      }

      return {
        data,
        resultId: cacheKey
      };

    } catch (error) {
      console.warn('Error providing semantic tokens:', error);
      return null;
    }
  }

  /**
   * Monaco DocumentSemanticTokensProvider interface
   *
   * Release semantic tokens when no longer needed (optional cleanup).
   */
  releaseDocumentSemanticTokens(resultId: string | undefined): void {
    // Optional cleanup - remove from cache if needed
    if (this.config.cacheResults && resultId) {
      for (const [key, _] of this.tokenCache.entries()) {
        if (key.endsWith(resultId)) {
          this.tokenCache.delete(key);
          break;
        }
      }
    }
  }

  /**
   * Get legend for semantic token types and modifiers
   */
  getLegend(): monaco.languages.SemanticTokensLegend {
    return {
      tokenTypes: [...SEMANTIC_TOKEN_TYPES],
      tokenModifiers: [...SEMANTIC_TOKEN_MODIFIERS]
    };
  }

  /**
   * Extract semantic tokens from AST
   */
  private extractSemanticTokens(ast: ASTNode[], model: monaco.editor.ITextModel): SemanticToken[] {
    const tokens: SemanticToken[] = [];
    const content = model.getValue();

    // Process each AST node
    for (const node of ast) {
      this.processASTNode(node, tokens, content);
    }

    // Sort tokens by position (required by Monaco)
    tokens.sort((a, b) => {
      if (a.line !== b.line) return a.line - b.line;
      return a.startChar - b.startChar;
    });

    return tokens;
  }

  /**
   * Process a single AST node and extract semantic tokens
   */
  private processASTNode(node: ASTNode, tokens: SemanticToken[], content: string): void {
    if (!node.startPosition || !node.endPosition) {
      // Process children if no position info
      if (node.children) {
        for (const child of node.children) {
          this.processASTNode(child, tokens, content);
        }
      }
      return;
    }

    const line = node.startPosition.row;
    const startChar = node.startPosition.column;
    const endChar = node.endPosition.column;
    const length = endChar - startChar;

    // Skip if invalid range
    if (length <= 0) return;

    // Determine token type and modifiers based on AST node type
    const { tokenType, tokenModifiers } = this.getTokenTypeAndModifiers(node, content);

    if (tokenType !== -1) {
      tokens.push({
        line,
        startChar,
        length,
        tokenType,
        tokenModifiers
      });
    }

    // Process children
    if (node.children) {
      for (const child of node.children) {
        this.processASTNode(child, tokens, content);
      }
    }
  }

  /**
   * Determine token type and modifiers for an AST node
   */
  private getTokenTypeAndModifiers(node: ASTNode, content: string): { tokenType: number; tokenModifiers: number } {
    const nodeText = node.text || '';
    
    // Built-in OpenSCAD functions
    if (this.config.enableBuiltinHighlighting && BUILTIN_OPENSCAD_FUNCTIONS.has(nodeText)) {
      return {
        tokenType: SEMANTIC_TOKEN_TYPES.indexOf('macro'),
        tokenModifiers: 1 << SEMANTIC_TOKEN_MODIFIERS.indexOf('defaultLibrary')
      };
    }

    // Determine based on AST node type
    switch (node.type) {
      case 'module_definition':
        return {
          tokenType: SEMANTIC_TOKEN_TYPES.indexOf('namespace'),
          tokenModifiers: 1 << SEMANTIC_TOKEN_MODIFIERS.indexOf('declaration')
        };

      case 'function_definition':
        return {
          tokenType: SEMANTIC_TOKEN_TYPES.indexOf('function'),
          tokenModifiers: 1 << SEMANTIC_TOKEN_MODIFIERS.indexOf('declaration')
        };

      case 'variable_assignment':
        return {
          tokenType: SEMANTIC_TOKEN_TYPES.indexOf('variable'),
          tokenModifiers: 1 << SEMANTIC_TOKEN_MODIFIERS.indexOf('declaration')
        };

      case 'identifier':
        // Check if it's a built-in function
        if (BUILTIN_OPENSCAD_FUNCTIONS.has(nodeText)) {
          return {
            tokenType: SEMANTIC_TOKEN_TYPES.indexOf('macro'),
            tokenModifiers: 1 << SEMANTIC_TOKEN_MODIFIERS.indexOf('defaultLibrary')
          };
        }
        return {
          tokenType: SEMANTIC_TOKEN_TYPES.indexOf('variable'),
          tokenModifiers: 0
        };

      case 'number':
        return {
          tokenType: SEMANTIC_TOKEN_TYPES.indexOf('number'),
          tokenModifiers: 0
        };

      case 'string':
        return {
          tokenType: SEMANTIC_TOKEN_TYPES.indexOf('string'),
          tokenModifiers: 0
        };

      case 'comment':
        return {
          tokenType: SEMANTIC_TOKEN_TYPES.indexOf('comment'),
          tokenModifiers: 0
        };

      default:
        return { tokenType: -1, tokenModifiers: 0 };
    }
  }

  /**
   * Encode semantic tokens in Monaco's format
   */
  private encodeSemanticTokens(tokens: SemanticToken[]): Uint32Array {
    const data: number[] = [];
    let prevLine = 0;
    let prevChar = 0;

    for (const token of tokens) {
      // Delta encoding as required by Monaco
      const deltaLine = token.line - prevLine;
      const deltaChar = deltaLine === 0 ? token.startChar - prevChar : token.startChar;

      data.push(
        deltaLine,
        deltaChar,
        token.length,
        token.tokenType,
        token.tokenModifiers
      );

      prevLine = token.line;
      prevChar = token.startChar;
    }

    return new Uint32Array(data);
  }

  /**
   * Get AST from parser service
   */
  private getASTFromParserService(): ASTNode[] | null {
    try {
      return (this.parserService as any)?.getAST?.() || null;
    } catch (error) {
      console.warn('Error getting AST from parser service:', error);
      return null;
    }
  }

  /**
   * Cache semantic tokens with size limit
   */
  private cacheTokens(key: string, data: Uint32Array): void {
    if (this.tokenCache.size >= this.config.maxCacheSize) {
      // Remove oldest entry
      const firstKey = this.tokenCache.keys().next().value;
      if (firstKey !== undefined) {
        this.tokenCache.delete(firstKey);
      }
    }
    this.tokenCache.set(key, data);
  }

  /**
   * Clear the token cache
   */
  clearCache(): void {
    this.tokenCache.clear();
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<SemanticHighlightingConfig>): void {
    Object.assign(this.config, newConfig);
    this.clearCache(); // Clear cache when config changes
  }
}

/**
 * Factory function to create semantic highlighting provider
 */
export function createSemanticHighlightingProvider(
  parserService?: OpenSCADParserService,
  config?: Partial<SemanticHighlightingConfig>
): OpenSCADSemanticHighlightingProvider {
  return new OpenSCADSemanticHighlightingProvider(parserService, config);
}
