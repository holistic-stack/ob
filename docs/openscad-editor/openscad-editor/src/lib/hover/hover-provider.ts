/**
 * @file Enhanced OpenSCAD Hover Provider
 * 
 * Provides rich hover information for OpenSCAD symbols including documentation,
 * type information, parameter details, and usage examples using AST analysis.
 * 
 * Features:
 * - Context-aware hover information using Position Utilities API
 * - Rich symbol documentation with JSDoc parsing
 * - Parameter information and type hints
 * - Usage examples and code snippets
 * - Performance optimized with caching and incremental updates
 * - Functional programming patterns with immutable data structures
 * 
 * @example
 * ```typescript
 * const hoverProvider = new OpenSCADHoverProvider(
 *   parserService,
 *   symbolProvider,
 *   positionUtilities
 * );
 * 
 * // Register with Monaco
 * monaco.languages.registerHoverProvider('openscad', hoverProvider);
 * ```
 */

import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { type OutlineItem, type OpenSCADParserService } from '../services/openscad-parser-service';
import { ALL_OPENSCAD_SYMBOLS, type SymbolInfo } from '../completion/openscad-symbols';

// Enhanced interfaces for hover functionality
// TODO: Import from parser package when available
interface Position {
  readonly line: number;
  readonly column: number;
  readonly offset: number;
}

interface ASTNode {
  readonly type: string;
  readonly [key: string]: any;
}

interface ParserSymbolInfo {
  readonly name: string;
  readonly kind: 'module' | 'function' | 'variable' | 'parameter' | 'constant';
  readonly loc?: {
    readonly start: Position;
    readonly end: Position;
  };
  readonly parameters?: ReadonlyArray<{
    readonly name: string;
    readonly value?: any;
    readonly defaultValue?: any;
    readonly description?: string;
    readonly type?: string;
  }>;
  readonly documentation?: string;
  readonly scope?: string;
  readonly returnType?: string;
  readonly examples?: ReadonlyArray<string>;
}

interface SymbolProvider {
  getSymbols(ast: ASTNode[]): ParserSymbolInfo[];
  getSymbolAtPosition(ast: ASTNode[], position: Position): ParserSymbolInfo | undefined;
  findSymbolDefinition(ast: ASTNode[], symbolName: string): ParserSymbolInfo | undefined;
}

interface PositionUtilities {
  findNodeAt(ast: ASTNode[], position: Position): ASTNode | undefined;
  getNodeRange(node: ASTNode): { start: Position; end: Position };
  getHoverInfo(ast: ASTNode[], position: Position): any | undefined;
  isPositionInRange(position: Position, range: { start: Position; end: Position }): boolean;
}

export interface HoverContext {
  readonly position: monaco.Position;
  readonly model: monaco.editor.ITextModel;
  readonly wordAtPosition: string;
  readonly lineContent: string;
  readonly parserPosition: Position;
  readonly symbolAtPosition?: ParserSymbolInfo;
  readonly nodeAtPosition?: ASTNode;
}

export interface HoverStats {
  readonly lastOperation: string;
  readonly symbolsFound: number;
  readonly hoverTime: number;
  readonly cacheHits: number;
  readonly documentationLength: number;
}

interface HoverOptions {
  readonly includeDocumentation: boolean;
  readonly includeParameters: boolean;
  readonly includeExamples: boolean;
  readonly includeTypeInfo: boolean;
  readonly maxDocumentationLength: number;
  readonly maxExamples: number;
}

/**
 * Enhanced OpenSCAD Hover Provider
 * 
 * Implements Monaco's HoverProvider interface with advanced AST-based
 * hover information and rich documentation display.
 */
export class OpenSCADHoverProvider implements monaco.languages.HoverProvider {

  private parserService: OpenSCADParserService | null = null;
  private symbolProvider: SymbolProvider | null = null;
  private positionUtilities: PositionUtilities | null = null;
  
  // Performance tracking and caching
  private lastHoverStats: HoverStats = {
    lastOperation: '',
    symbolsFound: 0,
    hoverTime: 0,
    cacheHits: 0,
    documentationLength: 0
  };

  // Cache hit counter
  private cacheHitCount = 0;

  // Simple cache for hover information (in a real implementation, use LRU cache)
  private readonly hoverCache = new Map<string, monaco.languages.Hover | null>();
  
  // Default hover options
  private readonly defaultOptions: HoverOptions = {
    includeDocumentation: true,
    includeParameters: true,
    includeExamples: true,
    includeTypeInfo: true,
    maxDocumentationLength: 1000,
    maxExamples: 3
  };

  constructor(
    parserService?: OpenSCADParserService,
    symbolProvider?: SymbolProvider,
    positionUtilities?: PositionUtilities,
    private readonly options: Partial<HoverOptions> = {}
  ) {
    this.parserService = parserService || null;
    this.symbolProvider = symbolProvider || null;
    this.positionUtilities = positionUtilities || null;
  }

  /**
   * Monaco HoverProvider Interface
   * 
   * Provides rich hover information using enhanced AST analysis
   * and Symbol Provider integration for accurate symbol resolution.
   * 
   * @param model - Monaco text model
   * @param position - Cursor position
   * @returns Hover information or null if not available
   */
  async provideHover(
    model: monaco.editor.ITextModel,
    position: monaco.Position
  ): Promise<monaco.languages.Hover | null> {
    const startTime = performance.now();
    
    try {
      const context = await this.analyzeHoverContext(model, position);
      if (!context.wordAtPosition) {
        return null;
      }

      // Check cache first
      const cacheKey = this.createCacheKey(context);
      let hover = this.hoverCache.get(cacheKey);

      if (hover) {
        // Cache hit
        this.cacheHitCount++;
      } else {
        // Generate hover information
        hover = await this.createHoverInformation(context);
        this.hoverCache.set(cacheKey, hover);
      }
      
      const hoverTime = performance.now() - startTime;
      this.updateHoverStats('provide-hover', hover ? 1 : 0, hoverTime, hover);

      return hover;

    } catch (error) {
      console.error('Hover provider error:', error);
      return null;
    }
  }

  /**
   * Analyze hover context using Position Utilities and Symbol Provider
   * 
   * @param model - Monaco text model
   * @param position - Cursor position
   * @returns Enhanced hover context with AST information
   */
  private async analyzeHoverContext(
    model: monaco.editor.ITextModel,
    position: monaco.Position
  ): Promise<HoverContext> {
    const lineContent = model.getLineContent(position.lineNumber);
    const wordInfo = model.getWordAtPosition(position);
    const wordAtPosition = wordInfo?.word || '';

    // Convert Monaco position to parser position (0-based)
    const parserPosition: Position = {
      line: position.lineNumber - 1,
      column: position.column - 1,
      offset: this.calculateOffset(model, position)
    };

    let symbolAtPosition: ParserSymbolInfo | undefined;
    let nodeAtPosition: ASTNode | undefined;

    // Enhanced context analysis using Position Utilities and Symbol Provider
    if (this.symbolProvider && this.positionUtilities && this.parserService?.isReady()) {
      try {
        const ast = this.getASTFromParserService();
        if (ast) {
          // Get symbol at current position
          symbolAtPosition = this.symbolProvider.getSymbolAtPosition(ast, parserPosition);
          
          // Get AST node at position for additional context
          nodeAtPosition = this.positionUtilities.findNodeAt(ast, parserPosition);
        }
      } catch (error) {
        console.warn('Error in hover context analysis:', error);
      }
    }

    return {
      position,
      model,
      wordAtPosition,
      lineContent,
      parserPosition,
      ...(symbolAtPosition && { symbolAtPosition }),
      ...(nodeAtPosition && { nodeAtPosition })
    };
  }

  /**
   * Create rich hover information from context
   * 
   * @param context - Hover context with symbol information
   * @returns Monaco hover object with rich content
   */
  private async createHoverInformation(context: HoverContext): Promise<monaco.languages.Hover | null> {
    // Try enhanced symbol-based hover first
    if (context.symbolAtPosition) {
      return this.createSymbolHover(context.symbolAtPosition, context);
    }

    // Fallback to outline-based hover
    return this.createOutlineBasedHover(context);
  }

  /**
   * Create hover information from symbol data
   * 
   * @param symbol - Parser symbol information
   * @param context - Hover context
   * @returns Rich hover with symbol details
   */
  private createSymbolHover(symbol: ParserSymbolInfo, context: HoverContext): monaco.languages.Hover {
    const options = { ...this.defaultOptions, ...this.options };
    const contents: monaco.IMarkdownString[] = [];

    // Symbol signature
    const signature = this.createSymbolSignature(symbol);
    contents.push({
      value: `\`\`\`openscad\n${signature}\n\`\`\``,
      isTrusted: true
    });

    // Documentation
    if (options.includeDocumentation && symbol.documentation) {
      const documentation = this.formatDocumentation(symbol.documentation, options.maxDocumentationLength);
      contents.push({
        value: documentation,
        isTrusted: true
      });
    }

    // Parameters
    if (options.includeParameters && symbol.parameters && symbol.parameters.length > 0) {
      const parametersDoc = this.createParametersDocumentation(symbol.parameters);
      contents.push({
        value: parametersDoc,
        isTrusted: true
      });
    }

    // Examples
    if (options.includeExamples && symbol.examples && symbol.examples.length > 0) {
      const examplesDoc = this.createExamplesDocumentation(symbol.examples, options.maxExamples);
      contents.push({
        value: examplesDoc,
        isTrusted: true
      });
    }

    // Type information
    if (options.includeTypeInfo && symbol.returnType) {
      contents.push({
        value: `**Returns:** \`${symbol.returnType}\``,
        isTrusted: true
      });
    }

    return {
      contents,
      range: this.createHoverRange(context)
    };
  }

  /**
   * Create fallback hover from outline information
   *
   * @param context - Hover context
   * @returns Basic hover information
   */
  private async createOutlineBasedHover(context: HoverContext): Promise<monaco.languages.Hover | null> {
    // First try to find symbol in document outline
    if (this.parserService?.isReady()) {
      try {
        const outline = this.parserService.getDocumentOutline();
        const symbol = this.findSymbolInOutline(outline, context.wordAtPosition);

        if (symbol) {
          const contents: monaco.IMarkdownString[] = [
            {
              value: `\`\`\`openscad\n${symbol.type} ${symbol.name}\n\`\`\``,
              isTrusted: true
            },
            {
              value: `**Type:** ${symbol.type}  \n**Line:** ${symbol.range.startLine + 1}`,
              isTrusted: true
            }
          ];

          return {
            contents,
            range: this.createHoverRange(context)
          };
        }
      } catch (error) {
        console.error('Error creating outline-based hover:', error);
      }
    }

    // Fallback to built-in OpenSCAD symbols
    return this.createBuiltinSymbolHover(context);
  }

  /**
   * Create hover for built-in OpenSCAD symbols
   *
   * @param context - Hover context
   * @returns Hover information for built-in symbols
   */
  private createBuiltinSymbolHover(context: HoverContext): monaco.languages.Hover | null {
    const builtinSymbol = ALL_OPENSCAD_SYMBOLS.find(
      symbol => symbol.name === context.wordAtPosition
    );

    if (builtinSymbol) {
      const contents: monaco.IMarkdownString[] = [];

      // Symbol signature
      const signature = this.createBuiltinSymbolSignature(builtinSymbol);
      contents.push({
        value: `\`\`\`openscad\n${signature}\n\`\`\``,
        isTrusted: true
      });

      // Description
      contents.push({
        value: `**${builtinSymbol.category}**\n\n${builtinSymbol.description}`,
        isTrusted: true
      });

      // Parameters
      if (builtinSymbol.parameters && builtinSymbol.parameters.length > 0) {
        const parametersDoc = this.createBuiltinParametersDocumentation(builtinSymbol.parameters);
        contents.push({
          value: parametersDoc,
          isTrusted: true
        });
      }

      // Examples
      if (builtinSymbol.examples && builtinSymbol.examples.length > 0) {
        const examplesDoc = this.createExamplesDocumentation(builtinSymbol.examples, 2);
        contents.push({
          value: examplesDoc,
          isTrusted: true
        });
      }

      return {
        contents,
        range: this.createHoverRange(context)
      };
    }

    return null;
  }

  /**
   * Create signature for built-in symbol
   */
  private createBuiltinSymbolSignature(symbol: SymbolInfo): string {
    let signature = `${symbol.type} ${symbol.name}`;

    if (symbol.parameters && symbol.parameters.length > 0) {
      const params = symbol.parameters.map(param => {
        let paramStr = param.name;
        if (param.type) {
          paramStr = `${param.type} ${paramStr}`;
        }
        if (param.defaultValue !== undefined) {
          paramStr += ` = ${param.defaultValue}`;
        }
        return paramStr;
      }).join(', ');

      signature += `(${params})`;
    } else if (symbol.type === 'function' || symbol.type === 'module') {
      signature += '()';
    }

    if (symbol.returnType) {
      signature += ` -> ${symbol.returnType}`;
    }

    return signature;
  }

  /**
   * Create parameters documentation for built-in symbols
   */
  private createBuiltinParametersDocumentation(parameters: SymbolInfo['parameters']): string {
    if (!parameters || parameters.length === 0) {
      return '';
    }

    let doc = '**Parameters:**\n\n';

    for (const param of parameters) {
      doc += `- **${param.name}**`;

      if (param.type) {
        doc += ` (\`${param.type}\`)`;
      }

      if (param.defaultValue !== undefined) {
        doc += ` = \`${param.defaultValue}\``;
      }

      if (param.description) {
        doc += `: ${param.description}`;
      }

      doc += '\n';
    }

    return doc;
  }

  /**
   * Utility methods for hover content generation
   */

  /**
   * Create symbol signature for display
   */
  private createSymbolSignature(symbol: ParserSymbolInfo): string {
    let signature = `${symbol.kind} ${symbol.name}`;

    if (symbol.parameters && symbol.parameters.length > 0) {
      const params = symbol.parameters.map(param => {
        let paramStr = param.name;
        if (param.type) {
          paramStr = `${param.type} ${paramStr}`;
        }
        if (param.defaultValue !== undefined) {
          paramStr += ` = ${param.defaultValue}`;
        }
        return paramStr;
      }).join(', ');

      signature += `(${params})`;
    } else if (symbol.kind === 'function' || symbol.kind === 'module') {
      signature += '()';
    }

    if (symbol.returnType) {
      signature += ` -> ${symbol.returnType}`;
    }

    return signature;
  }

  /**
   * Format documentation text with length limits
   */
  private formatDocumentation(documentation: string, maxLength: number): string {
    let formatted = documentation.trim();

    // Truncate if too long
    if (formatted.length > maxLength) {
      formatted = formatted.substring(0, maxLength - 3) + '...';
    }

    // Parse JSDoc-style comments
    formatted = this.parseJSDocComments(formatted);

    return formatted;
  }

  /**
   * Parse JSDoc-style comments for better formatting
   */
  private parseJSDocComments(text: string): string {
    // Convert @param tags to markdown
    text = text.replace(/@param\s+(\w+)\s+(.+)/g, '**$1**: $2');

    // Convert @returns tags to markdown
    text = text.replace(/@returns?\s+(.+)/g, '**Returns**: $1');

    // Convert @example tags to code blocks
    text = text.replace(/@example\s+([\s\S]*?)(?=@|\n\n|$)/g, '**Example:**\n```openscad\n$1\n```');

    // Convert @see tags to links
    text = text.replace(/@see\s+(.+)/g, '**See**: $1');

    return text;
  }

  /**
   * Create parameters documentation
   */
  private createParametersDocumentation(parameters: ReadonlyArray<NonNullable<ParserSymbolInfo['parameters']>[0]>): string {
    let doc = '**Parameters:**\n\n';

    for (const param of parameters) {
      doc += `- **${param.name}**`;

      if (param.type) {
        doc += ` (\`${param.type}\`)`;
      }

      if (param.defaultValue !== undefined) {
        doc += ` = \`${param.defaultValue}\``;
      }

      if (param.description) {
        doc += `: ${param.description}`;
      }

      doc += '\n';
    }

    return doc;
  }

  /**
   * Create examples documentation
   */
  private createExamplesDocumentation(examples: ReadonlyArray<string>, maxExamples: number): string {
    const limitedExamples = examples.slice(0, maxExamples);
    let doc = '**Examples:**\n\n';

    for (let i = 0; i < limitedExamples.length; i++) {
      const example = limitedExamples[i];
      if (example) {
        doc += `\`\`\`openscad\n${example.trim()}\n\`\`\`\n\n`;
      }
    }

    if (examples.length > maxExamples) {
      doc += `*... and ${examples.length - maxExamples} more examples*\n`;
    }

    return doc.trim();
  }

  /**
   * Create hover range from context
   */
  private createHoverRange(context: HoverContext): monaco.IRange {
    const wordInfo = context.model.getWordAtPosition(context.position);

    if (wordInfo) {
      return new monaco.Range(
        context.position.lineNumber,
        wordInfo.startColumn,
        context.position.lineNumber,
        wordInfo.endColumn
      );
    }

    // Fallback to single character range
    return new monaco.Range(
      context.position.lineNumber,
      context.position.column,
      context.position.lineNumber,
      context.position.column + 1
    );
  }

  /**
   * Find symbol in outline by name
   */
  private findSymbolInOutline(outline: OutlineItem[], symbolName: string): OutlineItem | null {
    for (const item of outline) {
      if (item.name === symbolName) {
        return item;
      }

      if (item.children) {
        const found = this.findSymbolInOutline(item.children, symbolName);
        if (found) {
          return found;
        }
      }
    }
    return null;
  }

  /**
   * Create cache key for hover information
   */
  private createCacheKey(context: HoverContext): string {
    return `hover:${context.wordAtPosition}:${context.parserPosition.line}:${context.parserPosition.column}`;
  }

  /**
   * Calculate character offset from Monaco position
   */
  private calculateOffset(model: monaco.editor.ITextModel, position: monaco.Position): number {
    let offset = 0;
    for (let line = 1; line < position.lineNumber; line++) {
      offset += model.getLineContent(line).length + 1; // +1 for newline
    }
    offset += position.column - 1;
    return offset;
  }

  /**
   * Get AST from parser service
   * TODO: This needs to be implemented based on the actual parser service API
   */
  private getASTFromParserService(): ASTNode[] | undefined {
    // TODO: Implement based on actual parser service API
    return undefined;
  }

  /**
   * Update hover statistics
   */
  private updateHoverStats(
    operation: string,
    symbolsFound: number,
    hoverTime: number,
    hover: monaco.languages.Hover | null
  ): void {
    let documentationLength = 0;
    if (hover?.contents) {
      try {
        for (const content of hover.contents) {
          if (typeof content === 'string') {
            documentationLength += (content as string).length;
          } else if (content && typeof content === 'object' && 'value' in content) {
            const markdownString = content as monaco.IMarkdownString;
            documentationLength += markdownString.value.length;
          }
        }
      } catch (error) {
        // Fallback if there are type issues
        documentationLength = 0;
      }
    }

    this.lastHoverStats = {
      lastOperation: operation,
      symbolsFound,
      hoverTime: Math.round(hoverTime * 100) / 100,
      cacheHits: this.cacheHitCount,
      documentationLength
    };
  }

  /**
   * Clear hover cache
   */
  clearCache(): void {
    this.hoverCache.clear();
    this.cacheHitCount = 0;
  }

  /**
   * Get hover statistics
   */
  getLastHoverStats(): HoverStats {
    return this.lastHoverStats;
  }

  /**
   * Set parser service
   */
  setParserService(parserService: OpenSCADParserService): void {
    this.clearCache();
    this.parserService = parserService;
  }

  /**
   * Set symbol provider
   */
  setSymbolProvider(symbolProvider: SymbolProvider): void {
    this.clearCache();
    this.symbolProvider = symbolProvider;
  }

  /**
   * Set position utilities
   */
  setPositionUtilities(positionUtilities: PositionUtilities): void {
    this.clearCache();
    this.positionUtilities = positionUtilities;
  }
}
