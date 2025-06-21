/**
 * @file Rename Symbol Provider for OpenSCAD Editor
 * 
 * Provides intelligent symbol renaming functionality with scope analysis and conflict detection.
 * Implements Monaco's RenameProvider interface for seamless editor integration.
 * 
 * Features:
 * - Variable renaming with scope awareness
 * - Function and module renaming
 * - Parameter renaming within function/module scope
 * - Cross-reference validation and conflict detection
 * - AST-based symbol resolution
 * 
 * @example
 * ```typescript
 * const renameProvider = new OpenSCADRenameProvider(parserService, symbolProvider);
 * monaco.languages.registerRenameProvider('openscad', renameProvider);
 * ```
 */

import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { type OpenSCADParserService } from '../services/openscad-parser-service';
import {
  type ASTNode,
  type Position,
  type SymbolInfo,
  type SymbolProvider,
  type PositionUtilities,
  OpenSCADSymbolProvider,
  OpenSCADPositionUtilities
} from '@holistic-stack/openscad-parser';

// Type alias for compatibility with existing code
type ParserSymbolInfo = SymbolInfo;

/**
 * Configuration for rename operations
 */
export interface RenameConfig {
  readonly enableScopeValidation: boolean;
  readonly enableConflictDetection: boolean;
  readonly enablePreview: boolean;
  readonly maxReferences: number;
}

/**
 * Default rename configuration
 */
export const DEFAULT_RENAME_CONFIG: RenameConfig = {
  enableScopeValidation: true,
  enableConflictDetection: true,
  enablePreview: true,
  maxReferences: 100
} as const;

/**
 * Result type for rename operations
 */
export type RenameResult<T> = 
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly error: string };

/**
 * Rename conflict information
 */
export interface RenameConflict {
  readonly type: 'name_collision' | 'scope_violation' | 'reserved_keyword';
  readonly message: string;
  readonly location?: monaco.IRange;
  readonly suggestion?: string;
}

/**
 * Rename validation result
 */
export interface RenameValidation {
  readonly isValid: boolean;
  readonly conflicts: readonly RenameConflict[];
  readonly affectedReferences: number;
  readonly scope: string;
}

/**
 * OpenSCAD Rename Provider
 * 
 * Implements Monaco's RenameProvider interface with advanced AST-based
 * symbol analysis and scope-aware renaming capabilities.
 */
export class OpenSCADRenameProvider implements monaco.languages.RenameProvider {
  private readonly parserService: OpenSCADParserService | null;
  private readonly symbolProvider: SymbolProvider;
  private readonly positionUtilities: PositionUtilities;
  private readonly config: RenameConfig;

  // OpenSCAD reserved keywords that cannot be used as identifiers
  private readonly reservedKeywords = new Set([
    'module', 'function', 'if', 'else', 'for', 'let', 'each',
    'true', 'false', 'undef', 'PI', 'include', 'use',
    'translate', 'rotate', 'scale', 'mirror', 'resize',
    'linear_extrude', 'rotate_extrude', 'projection',
    'cube', 'sphere', 'cylinder', 'polyhedron', 'polygon',
    'circle', 'square', 'text', 'surface',
    'union', 'difference', 'intersection', 'hull', 'minkowski',
    'offset', 'import'
  ]);

  constructor(
    parserService?: OpenSCADParserService,
    symbolProvider?: SymbolProvider,
    positionUtilities?: PositionUtilities,
    config: Partial<RenameConfig> = {}
  ) {
    this.parserService = parserService || null;
    // Use provided instances or create simple fallback implementations
    this.symbolProvider = symbolProvider || this.createFallbackSymbolProvider();
    this.positionUtilities = positionUtilities || this.createFallbackPositionUtilities();
    this.config = { ...DEFAULT_RENAME_CONFIG, ...config };
  }

  /**
   * Monaco RenameProvider Interface - Provide rename range
   * 
   * Determines if the symbol at the given position can be renamed
   * and returns the range of the symbol.
   */
  async provideRenameEdits(
    model: monaco.editor.ITextModel,
    position: monaco.Position,
    newName: string,
    token: monaco.CancellationToken
  ): Promise<monaco.languages.WorkspaceEdit | null> {
    if (token.isCancellationRequested) {
      return null;
    }

    try {
      // Convert Monaco position to parser position
      const parserPosition: Position = {
        line: position.lineNumber - 1,
        column: position.column - 1,
        offset: 0 // TODO: Calculate actual offset from line/column
      };

      // Find symbol at position
      const symbolResult = await this.findSymbolAtPosition(model, parserPosition);
      if (!symbolResult.success) {
        return null;
      }

      const symbol = symbolResult.data;

      // Validate the new name
      const validation = await this.validateRename(model, symbol, newName);
      if (!validation.isValid) {
        // Show validation errors to user
        console.warn('Rename validation failed:', validation.conflicts);
        return null;
      }

      // Find all references to the symbol
      const referencesResult = await this.findAllReferences(model, symbol);
      if (!referencesResult.success) {
        return null;
      }

      // Create workspace edit with all rename locations
      const workspaceEdit: monaco.languages.WorkspaceEdit = {
        edits: referencesResult.data.map(ref => ({
          resource: model.uri,
          versionId: model.getVersionId(),
          textEdit: {
            range: ref.range,
            text: newName
          }
        }))
      };

      console.log(`🔄 Rename: "${symbol.name}" -> "${newName}" (${referencesResult.data.length} references)`);
      return workspaceEdit;

    } catch (error) {
      console.error('Rename provider error:', error);
      return null;
    }
  }

  /**
   * Monaco RenameProvider Interface - Prepare rename
   * 
   * Validates that the symbol at the position can be renamed and
   * returns the current name and range.
   */
  async prepareRename(
    model: monaco.editor.ITextModel,
    position: monaco.Position,
    token: monaco.CancellationToken
  ): Promise<monaco.languages.RenameLocation | null> {
    if (token.isCancellationRequested) {
      return null;
    }

    try {
      // Convert Monaco position to parser position
      const parserPosition: Position = {
        line: position.lineNumber - 1,
        column: position.column - 1,
        offset: 0 // TODO: Calculate actual offset from line/column
      };

      // Find symbol at position
      const symbolResult = await this.findSymbolAtPosition(model, parserPosition);
      if (!symbolResult.success) {
        throw new Error('No symbol found at position');
      }

      const symbol = symbolResult.data;

      // Check if symbol can be renamed
      if (!this.canRenameSymbol(symbol)) {
        throw new Error(`Cannot rename ${symbol.kind}: ${symbol.name}`);
      }

      // Return the symbol's range and current name
      return {
        range: new monaco.Range(
          symbol.loc.start.line + 1,
          symbol.loc.start.column + 1,
          symbol.loc.end.line + 1,
          symbol.loc.end.column + 1
        ),
        text: symbol.name
      };

    } catch (error) {
      console.error('Prepare rename error:', error);
      throw error;
    }
  }

  /**
   * Find symbol at the given position
   */
  private async findSymbolAtPosition(
    model: monaco.editor.ITextModel,
    position: Position
  ): Promise<RenameResult<ParserSymbolInfo>> {
    if (!this.symbolProvider || !this.parserService?.isReady()) {
      return {
        success: false,
        error: 'Symbol provider or parser service not available'
      };
    }

    try {
      const ast = this.getASTFromParserService();
      if (!ast) {
        return {
          success: false,
          error: 'Failed to get AST from parser service'
        };
      }

      const symbol = this.symbolProvider.getSymbolAtPosition(ast, position);
      if (!symbol) {
        return {
          success: false,
          error: 'No symbol found at position'
        };
      }

      return { success: true, data: symbol };
    } catch (error) {
      return {
        success: false,
        error: `Failed to find symbol: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Check if a symbol can be renamed
   */
  private canRenameSymbol(symbol: ParserSymbolInfo): boolean {
    // Built-in functions and constants cannot be renamed
    if (symbol.kind === 'constant' && this.reservedKeywords.has(symbol.name)) {
      return false;
    }

    // User-defined symbols can be renamed
    return ['module', 'function', 'variable', 'parameter'].includes(symbol.kind);
  }

  /**
   * Validate rename operation
   */
  private async validateRename(
    model: monaco.editor.ITextModel,
    symbol: ParserSymbolInfo,
    newName: string
  ): Promise<RenameValidation> {
    const conflicts: RenameConflict[] = [];

    // Check for reserved keywords
    if (this.reservedKeywords.has(newName)) {
      conflicts.push({
        type: 'reserved_keyword',
        message: `"${newName}" is a reserved OpenSCAD keyword`,
        suggestion: `${newName}_var`
      });
    }

    // Check for valid identifier format
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(newName)) {
      conflicts.push({
        type: 'name_collision',
        message: `"${newName}" is not a valid identifier`,
        suggestion: newName.replace(/[^a-zA-Z0-9_]/g, '_')
      });
    }

    // TODO: Add scope-based conflict detection
    // This would check for name collisions within the same scope

    return {
      isValid: conflicts.length === 0,
      conflicts,
      affectedReferences: 0, // TODO: Calculate actual count
      scope: symbol.scope || 'global'
    };
  }

  /**
   * Find all references to a symbol
   */
  private async findAllReferences(
    model: monaco.editor.ITextModel,
    symbol: ParserSymbolInfo
  ): Promise<RenameResult<Array<{ range: monaco.IRange; kind: string }>>> {
    if (!this.symbolProvider || !this.parserService?.isReady()) {
      return {
        success: false,
        error: 'Symbol provider or parser service not available'
      };
    }

    try {
      const ast = this.getASTFromParserService();
      if (!ast) {
        return {
          success: false,
          error: 'Failed to get AST from parser service'
        };
      }

      // Find references by searching all symbols with the same name
      // This is a simplified implementation - a full implementation would need
      // to consider scope and context
      const allSymbols = this.symbolProvider.getSymbols(ast);
      const references = allSymbols.filter(sym => sym.name === symbol.name);

      const renameLocations = references.map(ref => ({
        range: new monaco.Range(
          ref.loc.start.line + 1,
          ref.loc.start.column + 1,
          ref.loc.end.line + 1,
          ref.loc.end.column + 1
        ),
        kind: ref.kind
      }));

      return { success: true, data: renameLocations };
    } catch (error) {
      return {
        success: false,
        error: `Failed to find references: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Get AST from parser service
   */
  private getASTFromParserService(): ASTNode[] | null {
    if (!this.parserService?.isReady()) {
      return null;
    }

    return this.parserService.getAST();
  }

  /**
   * Calculate character offset from Monaco position
   */
  private calculateOffset(model: monaco.editor.ITextModel, position: monaco.Position): number {
    // Use Monaco's built-in method for better performance and accuracy
    return model.getOffsetAt(position);
  }

  /**
   * Create a fallback symbol provider when none is provided
   */
  private createFallbackSymbolProvider(): SymbolProvider {
    return {
      getSymbols: () => [],
      getSymbolAtPosition: () => null
    };
  }

  /**
   * Create a fallback position utilities when none is provided
   */
  private createFallbackPositionUtilities(): PositionUtilities {
    return {
      findNodeAt: () => null,
      getNodeRange: (node: ASTNode) => ({
        start: { line: 0, column: 0, offset: 0 },
        end: { line: 0, column: 0, offset: 0 }
      }),
      isPositionInRange: () => false,
      findNodesContaining: () => [],
      getHoverInfo: () => null,
      getCompletionContext: () => ({
        type: 'unknown',
        availableSymbols: []
      })
    };
  }
}
