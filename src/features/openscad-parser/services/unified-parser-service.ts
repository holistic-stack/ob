/**
 * @file Unified OpenSCAD Parser Service
 * 
 * Combines the best features from the reference implementation with our dynamic loading approach.
 * Provides comprehensive OpenSCAD parsing with editor integration features.
 * 
 * Based on reference: docs/openscad-editor/openscad-editor/src/lib/services/openscad-parser-service.ts
 * Enhanced with: Dynamic loading, Result<T,E> patterns, and performance monitoring
 */

import type * as TreeSitter from 'web-tree-sitter';
import { OpenscadParser, SimpleErrorHandler, type ASTNode } from '@holistic-stack/openscad-parser';
import type { AsyncResult } from '../../../shared/types/result.types';
import { success, error, tryCatchAsync } from '../../../shared/utils/functional/result';

/**
 * Enhanced parse error interface with location information
 */
export interface ParseError {
  readonly message: string;
  readonly location: {
    readonly line: number;
    readonly column: number;
  };
  readonly severity: 'error' | 'warning' | 'info';
}

/**
 * Comprehensive parse result with both CST and AST
 */
export interface UnifiedParseResult {
  readonly cst: TreeSitter.Tree | null;
  readonly ast: ReadonlyArray<ASTNode> | null;
  readonly errors: ReadonlyArray<ParseError>;
  readonly success: boolean;
  readonly parseTime: number;
}

/**
 * Document outline item for editor integration
 */
export interface OutlineItem {
  readonly name: string;
  readonly type: 'module' | 'function' | 'variable';
  readonly range: {
    readonly startLine: number;
    readonly startColumn: number;
    readonly endLine: number;
    readonly endColumn: number;
  };
  readonly children?: ReadonlyArray<OutlineItem>;
}

/**
 * Hover information for editor tooltips
 */
export interface HoverInfo {
  readonly contents: ReadonlyArray<string>;
  readonly range: {
    readonly startLine: number;
    readonly startColumn: number;
    readonly endLine: number;
    readonly endColumn: number;
  };
}

/**
 * Position in document
 */
export interface Position {
  readonly line: number;
  readonly column: number;
  readonly offset: number;
}

/**
 * Document symbol for autocomplete and navigation
 */
export interface DocumentSymbol {
  readonly name: string;
  readonly type: string;
  readonly location: {
    readonly line: number;
    readonly column: number;
  };
  readonly documentation?: string;
}

/**
 * Parser service configuration
 */
interface UnifiedParserConfig {
  readonly timeoutMs: number;
  readonly retryAttempts: number;
  readonly enableLogging: boolean;
  readonly enableCaching: boolean;
  readonly maxCacheSize: number;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: UnifiedParserConfig = {
  timeoutMs: 10000,
  retryAttempts: 3,
  enableLogging: true,
  enableCaching: true,
  maxCacheSize: 50
} as const;

/**
 * Parser state tracking
 */
type ParserState = 'uninitialized' | 'initializing' | 'ready' | 'error' | 'disposed';

/**
 * Cache entry for parsed documents
 */
interface CacheEntry {
  readonly result: UnifiedParseResult;
  readonly timestamp: number;
  readonly codeHash: string;
}

/**
 * Unified OpenSCAD Parser Service
 * 
 * Combines dynamic loading with comprehensive parsing features.
 * Maintains document state for efficient editor integration.
 */
export class UnifiedParserService {
  private state: ParserState = 'uninitialized';
  private parser: OpenscadParser | null = null;
  private errorHandler: SimpleErrorHandler;
  private readonly config: UnifiedParserConfig;
  private initPromise: Promise<void> | null = null;
  
  // Document state
  private documentTree: TreeSitter.Tree | null = null;
  private documentAST: ReadonlyArray<ASTNode> | null = null;
  private lastParseErrors: ReadonlyArray<ParseError> = [];
  private lastParseResult: UnifiedParseResult | null = null;
  
  // Caching
  private cache = new Map<string, CacheEntry>();

  constructor(config: Partial<UnifiedParserConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.errorHandler = new SimpleErrorHandler();
    
    if (this.config.enableLogging) {
      console.log('[INIT][UnifiedParserService] Created with config:', this.config);
    }
  }

  /**
   * Get current parser state
   */
  public getState(): ParserState {
    return this.state;
  }

  /**
   * Check if parser is ready
   */
  public isReady(): boolean {
    return this.state === 'ready';
  }

  /**
   * Initialize parser with dynamic loading and timeout
   */
  public async initialize(): Promise<void> {
    if (this.initPromise) {
      return this.initPromise;
    }

    if (this.state === 'ready') {
      return Promise.resolve();
    }

    this.initPromise = this.performInitialization();
    return this.initPromise;
  }

  /**
   * Parse OpenSCAD document with comprehensive result
   */
  public async parseDocument(content: string): AsyncResult<UnifiedParseResult, string> {
    if (this.config.enableLogging) {
      console.log(`[DEBUG][UnifiedParserService] Parse request for ${content.length} characters`);
    }

    return tryCatchAsync(
      async () => {
        // Ensure parser is ready
        await this.ensureReady();

        // Check cache first
        if (this.config.enableCaching) {
          const cached = this.getCachedResult(content);
          if (cached) {
            this.updateDocumentState(cached);
            return cached;
          }
        }

        // Perform parsing
        const startTime = performance.now();
        const result = await this.performParsing(content);
        const parseTime = performance.now() - startTime;

        const finalResult: UnifiedParseResult = {
          ...result,
          parseTime
        };

        // Update document state
        this.updateDocumentState(finalResult);

        // Cache result
        if (this.config.enableCaching) {
          this.cacheResult(content, finalResult);
        }

        if (this.config.enableLogging) {
          console.log(`[DEBUG][UnifiedParserService] Parsed in ${parseTime.toFixed(2)}ms`);
        }

        return finalResult;
      },
      (parseError) => {
        const errorMessage = `Parse failed: ${parseError instanceof Error ? parseError.message : String(parseError)}`;
        if (this.config.enableLogging) {
          console.error('[ERROR][UnifiedParserService]', errorMessage);
        }
        return errorMessage;
      }
    );
  }

  /**
   * Get document outline for editor navigation
   * Note: Basic parser doesn't provide CST, so outline extraction is limited
   */
  public getDocumentOutline(): ReadonlyArray<OutlineItem> {
    // TODO: Implement AST-based outline extraction
    // For now, return empty array since we don't have CST
    return [];
  }

  /**
   * Get hover information for position
   * Note: Basic parser doesn't provide CST, so hover info is limited
   */
  public getHoverInfo(position: Position): HoverInfo | null {
    // TODO: Implement AST-based hover information
    // For now, return null since we don't have CST
    return null;
  }

  /**
   * Get document symbols for autocomplete
   * Note: Basic parser doesn't provide CST, so symbol extraction is limited
   */
  public getDocumentSymbols(): ReadonlyArray<DocumentSymbol> {
    // TODO: Implement AST-based symbol extraction
    // For now, return empty array since we don't have CST
    return [];
  }

  /**
   * Get last parse errors
   */
  public getLastErrors(): ReadonlyArray<ParseError> {
    return this.lastParseErrors;
  }

  /**
   * Get last parsed AST
   */
  public getAST(): ReadonlyArray<ASTNode> | null {
    return this.documentAST;
  }

  /**
   * Get last parse result
   */
  public getLastParseResult(): UnifiedParseResult | null {
    return this.lastParseResult;
  }

  /**
   * Dispose of parser resources
   */
  public dispose(): void {
    if (this.config.enableLogging) {
      console.log('[DEBUG][UnifiedParserService] Disposing resources');
    }

    if (this.parser) {
      this.parser.dispose();
      this.parser = null;
    }

    this.documentTree = null;
    this.documentAST = null;
    this.lastParseErrors = [];
    this.lastParseResult = null;
    this.cache.clear();
    this.state = 'disposed';
    this.initPromise = null;

    if (this.config.enableLogging) {
      console.log('[END][UnifiedParserService] Resources disposed');
    }
  }

  /**
   * Ensure parser is ready, initializing if necessary
   */
  private async ensureReady(): Promise<void> {
    if (this.state === 'ready') {
      return;
    }

    if (this.state === 'error') {
      throw new Error('Parser is in error state');
    }

    await this.initialize();
  }

  /**
   * Perform parser initialization with timeout and retry
   */
  private async performInitialization(): Promise<void> {
    this.state = 'initializing';

    if (this.config.enableLogging) {
      console.log('[INIT][UnifiedParserService] Starting parser initialization');
    }

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        if (this.config.enableLogging) {
          console.log(`[DEBUG][UnifiedParserService] Initialization attempt ${attempt}/${this.config.retryAttempts}`);
        }

        // Use dynamic import with timeout
        const parser = await Promise.race([
          this.loadParserDynamically(),
          this.createTimeoutPromise()
        ]);

        this.parser = parser;
        this.state = 'ready';

        if (this.config.enableLogging) {
          console.log('[END][UnifiedParserService] Parser initialized successfully');
        }

        return;

      } catch (attemptError) {
        lastError = attemptError instanceof Error ? attemptError : new Error(String(attemptError));

        if (this.config.enableLogging) {
          console.warn(`[WARN][UnifiedParserService] Attempt ${attempt} failed:`, lastError.message);
        }

        if (attempt < this.config.retryAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    }

    this.state = 'error';
    const finalError = new Error(
      `Parser initialization failed after ${this.config.retryAttempts} attempts. Last error: ${lastError?.message || 'Unknown error'}`
    );

    if (this.config.enableLogging) {
      console.error('[ERROR][UnifiedParserService]', finalError.message);
    }

    throw finalError;
  }

  /**
   * Load parser using dynamic import
   */
  private async loadParserDynamically(): Promise<OpenscadParser> {
    if (this.config.enableLogging) {
      console.log('[DEBUG][UnifiedParserService] Loading parser with dynamic import');
    }

    // Dynamic import to avoid blocking main thread
    const { OpenscadParser, SimpleErrorHandler } = await import('@holistic-stack/openscad-parser');

    const errorHandler = new SimpleErrorHandler();
    const parser = new OpenscadParser(errorHandler);

    // Initialize the parser (uses automatic WASM loading)
    await parser.init();

    if (this.config.enableLogging) {
      console.log('[DEBUG][UnifiedParserService] Parser loaded and initialized');
    }

    return parser;
  }

  /**
   * Create timeout promise
   */
  private createTimeoutPromise(): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Parser initialization timeout after ${this.config.timeoutMs}ms`));
      }, this.config.timeoutMs);
    });
  }

  /**
   * Perform actual parsing with AST (simplified for basic OpenscadParser)
   */
  private async performParsing(content: string): Promise<UnifiedParseResult> {
    if (!this.parser) {
      throw new Error('Parser not available');
    }

    this.errorHandler.clear();

    // Parse AST directly
    let ast: ReadonlyArray<ASTNode> | null = null;
    try {
      ast = this.parser.parseAST(content);
    } catch (astError) {
      if (this.config.enableLogging) {
        console.warn('[WARN][UnifiedParserService] AST parsing failed:', astError);
      }

      return {
        cst: null,
        ast: null,
        errors: [{
          message: `Failed to parse AST: ${astError instanceof Error ? astError.message : String(astError)}`,
          location: { line: 1, column: 1 },
          severity: 'error'
        }],
        success: false,
        parseTime: 0
      };
    }

    // Collect errors
    const parserErrors = this.errorHandler.getErrors();
    const errors: ParseError[] = parserErrors.map((errorMessage: string) => ({
      message: errorMessage,
      location: { line: 0, column: 0 },
      severity: 'error' as const
    }));

    const success = errors.length === 0 && ast !== null;

    return {
      cst: null, // Basic parser doesn't provide CST
      ast,
      errors: Object.freeze(errors),
      success,
      parseTime: 0 // Will be set by caller
    };
  }

  /**
   * Update internal document state
   */
  private updateDocumentState(result: UnifiedParseResult): void {
    this.documentTree = result.cst;
    this.documentAST = result.ast;
    this.lastParseErrors = result.errors;
    this.lastParseResult = result;
  }

  /**
   * Generate cache key for content
   */
  private generateCacheKey(content: string): string {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return `unified_${Math.abs(hash).toString(36)}`;
  }

  /**
   * Get cached result if available
   */
  private getCachedResult(content: string): UnifiedParseResult | null {
    const key = this.generateCacheKey(content);
    const entry = this.cache.get(key);

    if (entry) {
      // Check if cache entry is still valid (within 5 minutes)
      const maxAge = 5 * 60 * 1000; // 5 minutes
      if (Date.now() - entry.timestamp < maxAge) {
        return entry.result;
      } else {
        this.cache.delete(key);
      }
    }

    return null;
  }

  /**
   * Cache parse result
   */
  private cacheResult(content: string, result: UnifiedParseResult): void {
    const key = this.generateCacheKey(content);

    // Implement LRU eviction if cache is full
    if (this.cache.size >= this.config.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      result,
      timestamp: Date.now(),
      codeHash: key
    });
  }

  /**
   * Check if CST node has errors
   */
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

  /**
   * Extract outline from CST node
   */
  private extractOutlineFromNode(node: TreeSitter.Node, outline: OutlineItem[]): void {
    if (!node) return;

    switch (node.type) {
      case 'module_definition': {
        const moduleName = this.findChildByType(node, 'identifier')?.text;
        if (moduleName) {
          outline.push({
            name: moduleName,
            type: 'module',
            range: this.getNodeRange(node),
            children: []
          });
        }
        break;
      }

      case 'function_definition': {
        const funcName = this.findChildByType(node, 'identifier')?.text;
        if (funcName) {
          outline.push({
            name: funcName,
            type: 'function',
            range: this.getNodeRange(node),
            children: []
          });
        }
        break;
      }

      case 'assignment': {
        const varName = this.findChildByType(node, 'identifier')?.text;
        if (varName) {
          outline.push({
            name: varName,
            type: 'variable',
            range: this.getNodeRange(node),
            children: []
          });
        }
        break;
      }
    }

    // Recursively process child nodes
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (child) {
        this.extractOutlineFromNode(child, outline);
      }
    }
  }

  /**
   * Find child node by type
   */
  private findChildByType(node: TreeSitter.Node, type: string): TreeSitter.Node | null {
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (child && child.type === type) {
        return child;
      }
    }
    return null;
  }

  /**
   * Get node range for outline/hover
   */
  private getNodeRange(node: TreeSitter.Node): OutlineItem['range'] {
    return {
      startLine: node.startPosition.row,
      startColumn: node.startPosition.column,
      endLine: node.endPosition.row,
      endColumn: node.endPosition.column
    };
  }

  /**
   * Get node location for symbols
   */
  private getNodeLocation(node: TreeSitter.Node): DocumentSymbol['location'] {
    return {
      line: node.startPosition.row,
      column: node.startPosition.column
    };
  }

  /**
   * Find node at specific position
   */
  private findNodeAtPosition(node: TreeSitter.Node, position: Position): TreeSitter.Node | null {
    if (!node) {
      return null;
    }

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

      return node;
    }

    return null;
  }

  /**
   * Generate hover information for node
   */
  private generateHoverInfo(node: TreeSitter.Node): HoverInfo | null {
    const contents: string[] = [];

    switch (node.type) {
      case 'module_call': {
        const moduleName = this.findChildByType(node, 'identifier')?.text;
        contents.push(`**Module Call**: ${moduleName ?? 'unknown'}`);
        break;
      }

      case 'function_definition': {
        const funcName = this.findChildByType(node, 'identifier')?.text;
        contents.push(`**Function Definition**: ${funcName ?? 'anonymous'}`);
        break;
      }

      case 'assignment': {
        const varName = this.findChildByType(node, 'identifier')?.text;
        contents.push(`**Variable**: ${varName ?? 'unknown'}`);
        break;
      }

      case 'identifier': {
        contents.push(`**Identifier**: ${node.text}`);
        break;
      }

      default:
        contents.push(`**${node.type}**`);
    }

    if (contents.length === 0) {
      return null;
    }

    return {
      contents: Object.freeze(contents),
      range: this.getNodeRange(node)
    };
  }

  /**
   * Extract symbols from CST node
   */
  private extractSymbolsFromNode(node: TreeSitter.Node, symbols: DocumentSymbol[]): void {
    if (!node) return;

    switch (node.type) {
      case 'module_definition': {
        const moduleName = this.findChildByType(node, 'identifier')?.text;
        if (moduleName) {
          symbols.push({
            name: moduleName,
            type: 'module',
            location: this.getNodeLocation(node),
            documentation: `Module definition: ${moduleName}`
          });
        }
        break;
      }

      case 'function_definition': {
        const funcName = this.findChildByType(node, 'identifier')?.text;
        if (funcName) {
          symbols.push({
            name: funcName,
            type: 'function',
            location: this.getNodeLocation(node),
            documentation: `Function definition: ${funcName}`
          });
        }
        break;
      }

      case 'assignment': {
        const varName = this.findChildByType(node, 'identifier')?.text;
        if (varName) {
          symbols.push({
            name: varName,
            type: 'variable',
            location: this.getNodeLocation(node),
            documentation: `Variable assignment: ${varName}`
          });
        }
        break;
      }
    }

    // Recursively process child nodes
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (child) {
        this.extractSymbolsFromNode(child, symbols);
      }
    }
  }
}

/**
 * Create unified parser service instance
 */
export const createUnifiedParserService = (config?: Partial<UnifiedParserConfig>): UnifiedParserService => {
  return new UnifiedParserService(config);
};

/**
 * Global unified parser service instance
 */
let globalUnifiedService: UnifiedParserService | null = null;

/**
 * Get or create global unified parser service
 */
export const getGlobalUnifiedParserService = (): UnifiedParserService => {
  if (!globalUnifiedService) {
    globalUnifiedService = createUnifiedParserService();
  }
  return globalUnifiedService;
};

/**
 * Dispose global unified parser service
 */
export const disposeGlobalUnifiedParserService = (): void => {
  if (globalUnifiedService) {
    globalUnifiedService.dispose();
    globalUnifiedService = null;
  }
};

/**
 * Parse OpenSCAD code using global unified service (convenience function)
 */
export const parseOpenSCADCodeUnified = async (code: string): AsyncResult<UnifiedParseResult, string> => {
  const service = getGlobalUnifiedParserService();
  return service.parseDocument(code);
};
