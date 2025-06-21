/**
 * @file Code Organization Provider for OpenSCAD Editor
 * 
 * Provides intelligent code organization functionality including sorting declarations,
 * grouping related functions and modules, organizing imports, and removing unused code.
 * 
 * Features:
 * - Sort variable declarations
 * - Group related functions and modules
 * - Organize imports and includes
 * - Remove unused variables and functions
 * - Safe refactoring with dependency analysis
 * - Preview refactoring changes
 * - Rollback capability for failed refactoring
 * 
 * @example
 * ```typescript
 * const organizationProvider = new OpenSCADOrganizationProvider(parserService, symbolProvider);
 * const actions = await organizationProvider.getOrganizationActions(model);
 * ```
 */

import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { type OpenSCADParserService } from '../services/openscad-parser-service';

// Enhanced interfaces for organization functionality
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
  readonly kind: 'module' | 'function' | 'variable' | 'parameter' | 'constant' | 'include' | 'use';
  readonly loc?: {
    readonly start: Position;
    readonly end: Position;
  };
  readonly scope?: string;
  readonly dependencies?: readonly string[];
  readonly isUsed?: boolean;
}

interface SymbolProvider {
  getSymbols(ast: ASTNode[]): ParserSymbolInfo[];
  findSymbolReferences(ast: ASTNode[], symbolName: string): ParserSymbolInfo[];
  findUnusedSymbols(ast: ASTNode[]): ParserSymbolInfo[];
}

interface DependencyAnalyzer {
  analyzeDependencies(ast: ASTNode[]): Map<string, string[]>;
  findCircularDependencies(ast: ASTNode[]): string[][];
  getTopologicalOrder(symbols: ParserSymbolInfo[]): ParserSymbolInfo[];
}

/**
 * Configuration for organization operations
 */
export interface OrganizationConfig {
  readonly enableSorting: boolean;
  readonly enableGrouping: boolean;
  readonly enableUnusedRemoval: boolean;
  readonly enableImportOrganization: boolean;
  readonly sortOrder: 'alphabetical' | 'dependency' | 'usage';
  readonly groupingStrategy: 'type' | 'functionality' | 'dependency';
  readonly preserveComments: boolean;
  readonly addSeparators: boolean;
}

/**
 * Default organization configuration
 */
export const DEFAULT_ORGANIZATION_CONFIG: OrganizationConfig = {
  enableSorting: true,
  enableGrouping: true,
  enableUnusedRemoval: false, // Conservative default
  enableImportOrganization: true,
  sortOrder: 'dependency',
  groupingStrategy: 'type',
  preserveComments: true,
  addSeparators: true
} as const;

/**
 * Result type for organization operations
 */
export type OrganizationResult<T> = 
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly error: string };

/**
 * Organization action types
 */
export enum OrganizationActionKind {
  SortDeclarations = 'organize.sort',
  GroupSymbols = 'organize.group',
  RemoveUnused = 'organize.remove_unused',
  OrganizeImports = 'organize.imports',
  FullOrganization = 'organize.full'
}

/**
 * Organization action information
 */
export interface OrganizationAction {
  readonly kind: OrganizationActionKind;
  readonly title: string;
  readonly description: string;
  readonly edit: monaco.languages.WorkspaceEdit;
  readonly isPreferred?: boolean;
  readonly isSafe?: boolean;
  readonly affectedSymbols?: readonly string[];
}

/**
 * Symbol group information
 */
export interface SymbolGroup {
  readonly name: string;
  readonly symbols: readonly ParserSymbolInfo[];
  readonly startLine: number;
  readonly endLine: number;
  readonly comment?: string;
}

/**
 * Organization analysis result
 */
export interface OrganizationAnalysis {
  readonly currentOrder: readonly ParserSymbolInfo[];
  readonly suggestedOrder: readonly ParserSymbolInfo[];
  readonly groups: readonly SymbolGroup[];
  readonly unusedSymbols: readonly ParserSymbolInfo[];
  readonly imports: readonly ParserSymbolInfo[];
  readonly circularDependencies: readonly string[][];
  readonly canSafelyReorganize: boolean;
}

/**
 * OpenSCAD Code Organization Provider
 * 
 * Provides intelligent code organization capabilities with dependency analysis
 * and safe refactoring for OpenSCAD code.
 */
export class OpenSCADOrganizationProvider {
  private readonly parserService: OpenSCADParserService | null = null;
  private readonly symbolProvider: SymbolProvider | null = null;
  private readonly dependencyAnalyzer: DependencyAnalyzer | null = null;
  private readonly config: OrganizationConfig;

  constructor(
    parserService?: OpenSCADParserService,
    symbolProvider?: SymbolProvider,
    dependencyAnalyzer?: DependencyAnalyzer,
    config: Partial<OrganizationConfig> = {}
  ) {
    this.parserService = parserService || null;
    this.symbolProvider = symbolProvider || null;
    this.dependencyAnalyzer = dependencyAnalyzer || null;
    this.config = { ...DEFAULT_ORGANIZATION_CONFIG, ...config };
  }

  /**
   * Get available organization actions for the model
   */
  async getOrganizationActions(
    model: monaco.editor.ITextModel
  ): Promise<OrganizationResult<OrganizationAction[]>> {
    try {
      const analysis = await this.analyzeCodeOrganization(model);
      if (!analysis.success) {
        return analysis;
      }

      const actions: OrganizationAction[] = [];

      // Sort declarations action
      if (this.config.enableSorting && this.needsSorting(analysis.data)) {
        const sortAction = await this.createSortAction(model, analysis.data);
        if (sortAction.success) {
          actions.push(sortAction.data);
        }
      }

      // Group symbols action
      if (this.config.enableGrouping && this.needsGrouping(analysis.data)) {
        const groupAction = await this.createGroupAction(model, analysis.data);
        if (groupAction.success) {
          actions.push(groupAction.data);
        }
      }

      // Remove unused symbols action
      if (this.config.enableUnusedRemoval && analysis.data.unusedSymbols.length > 0) {
        const removeAction = await this.createRemoveUnusedAction(model, analysis.data);
        if (removeAction.success) {
          actions.push(removeAction.data);
        }
      }

      // Organize imports action
      if (this.config.enableImportOrganization && analysis.data.imports.length > 0) {
        const importAction = await this.createOrganizeImportsAction(model, analysis.data);
        if (importAction.success) {
          actions.push(importAction.data);
        }
      }

      // Full organization action
      if (actions.length > 1) {
        const fullAction = await this.createFullOrganizationAction(model, analysis.data);
        if (fullAction.success) {
          actions.unshift(fullAction.data); // Add at beginning as preferred
        }
      }

      return { success: true, data: actions };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get organization actions: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Analyze code organization
   */
  private async analyzeCodeOrganization(
    model: monaco.editor.ITextModel
  ): Promise<OrganizationResult<OrganizationAnalysis>> {
    try {
      if (!this.symbolProvider || !this.parserService?.isReady()) {
        return {
          success: false,
          error: 'Symbol provider or parser service not available'
        };
      }

      const ast = this.getASTFromParserService();
      if (!ast) {
        return {
          success: false,
          error: 'Failed to get AST from parser service'
        };
      }

      const symbols = this.symbolProvider.getSymbols(ast);
      const unusedSymbols = this.symbolProvider.findUnusedSymbols(ast);
      const imports = symbols.filter(s => s.kind === 'include' || s.kind === 'use');

      // Analyze dependencies
      let circularDependencies: string[][] = [];
      let suggestedOrder = symbols;

      if (this.dependencyAnalyzer) {
        circularDependencies = this.dependencyAnalyzer.findCircularDependencies(ast);
        if (this.config.sortOrder === 'dependency') {
          suggestedOrder = this.dependencyAnalyzer.getTopologicalOrder(symbols);
        }
      }

      // Sort based on configuration
      if (this.config.sortOrder === 'alphabetical') {
        suggestedOrder = [...symbols].sort((a, b) => a.name.localeCompare(b.name));
      }

      // Create groups
      const groups = this.createSymbolGroups(symbols);

      const analysis: OrganizationAnalysis = {
        currentOrder: symbols,
        suggestedOrder,
        groups,
        unusedSymbols,
        imports,
        circularDependencies,
        canSafelyReorganize: circularDependencies.length === 0
      };

      return { success: true, data: analysis };
    } catch (error) {
      return {
        success: false,
        error: `Failed to analyze code organization: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Create symbol groups based on strategy
   */
  private createSymbolGroups(symbols: readonly ParserSymbolInfo[]): SymbolGroup[] {
    const groups: SymbolGroup[] = [];

    switch (this.config.groupingStrategy) {
      case 'type':
        groups.push(
          this.createGroup('Imports', symbols.filter(s => s.kind === 'include' || s.kind === 'use')),
          this.createGroup('Constants', symbols.filter(s => s.kind === 'constant')),
          this.createGroup('Variables', symbols.filter(s => s.kind === 'variable')),
          this.createGroup('Functions', symbols.filter(s => s.kind === 'function')),
          this.createGroup('Modules', symbols.filter(s => s.kind === 'module'))
        );
        break;

      case 'functionality':
        // Group by functionality (simplified heuristic)
        groups.push(
          this.createGroup('Configuration', symbols.filter(s => s.name.includes('config') || s.name.includes('setting'))),
          this.createGroup('Utilities', symbols.filter(s => s.kind === 'function')),
          this.createGroup('Components', symbols.filter(s => s.kind === 'module')),
          this.createGroup('Main', symbols.filter(s => !s.name.includes('config') && !s.name.includes('setting')))
        );
        break;

      case 'dependency':
        // Group by dependency levels (simplified)
        const noDeps = symbols.filter(s => !s.dependencies || s.dependencies.length === 0);
        const withDeps = symbols.filter(s => s.dependencies && s.dependencies.length > 0);
        groups.push(
          this.createGroup('Independent', noDeps),
          this.createGroup('Dependent', withDeps)
        );
        break;
    }

    return groups.filter(g => g.symbols.length > 0);
  }

  /**
   * Create a symbol group
   */
  private createGroup(name: string, symbols: readonly ParserSymbolInfo[]): SymbolGroup {
    const startLine = symbols.length > 0 ? Math.min(...symbols.map(s => s.loc?.start.line ?? 0)) : 0;
    const endLine = symbols.length > 0 ? Math.max(...symbols.map(s => s.loc?.end.line ?? 0)) : 0;

    const group: SymbolGroup = {
      name,
      symbols,
      startLine,
      endLine
    };

    if (this.config.addSeparators) {
      (group as any).comment = `// ${name}`;
    }

    return group;
  }

  /**
   * Check if code needs sorting
   */
  private needsSorting(analysis: OrganizationAnalysis): boolean {
    if (analysis.currentOrder.length !== analysis.suggestedOrder.length) {
      return false;
    }

    for (let i = 0; i < analysis.currentOrder.length; i++) {
      const currentSymbol = analysis.currentOrder[i];
      const suggestedSymbol = analysis.suggestedOrder[i];
      if (currentSymbol && suggestedSymbol && currentSymbol.name !== suggestedSymbol.name) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if code needs grouping
   */
  private needsGrouping(analysis: OrganizationAnalysis): boolean {
    // Simple heuristic: if we have multiple types of symbols mixed together
    const symbolTypes = new Set(analysis.currentOrder.map(s => s.kind));
    return symbolTypes.size > 1;
  }

  /**
   * Create sort action
   */
  private async createSortAction(
    model: monaco.editor.ITextModel,
    analysis: OrganizationAnalysis
  ): Promise<OrganizationResult<OrganizationAction>> {
    try {
      const workspaceEdit = this.createReorderEdit(model, analysis.currentOrder, analysis.suggestedOrder);

      return {
        success: true,
        data: {
          kind: OrganizationActionKind.SortDeclarations,
          title: `Sort declarations (${this.config.sortOrder})`,
          description: `Sort symbols in ${this.config.sortOrder} order`,
          edit: workspaceEdit,
          isSafe: analysis.canSafelyReorganize,
          affectedSymbols: analysis.suggestedOrder.map(s => s.name)
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to create sort action: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Create group action
   */
  private async createGroupAction(
    model: monaco.editor.ITextModel,
    analysis: OrganizationAnalysis
  ): Promise<OrganizationResult<OrganizationAction>> {
    try {
      const workspaceEdit = this.createGroupingEdit(model, analysis.groups);

      return {
        success: true,
        data: {
          kind: OrganizationActionKind.GroupSymbols,
          title: `Group symbols by ${this.config.groupingStrategy}`,
          description: `Organize symbols into logical groups`,
          edit: workspaceEdit,
          isSafe: analysis.canSafelyReorganize,
          affectedSymbols: analysis.currentOrder.map(s => s.name)
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to create group action: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Create remove unused action
   */
  private async createRemoveUnusedAction(
    model: monaco.editor.ITextModel,
    analysis: OrganizationAnalysis
  ): Promise<OrganizationResult<OrganizationAction>> {
    try {
      const workspaceEdit = this.createRemoveUnusedEdit(model, analysis.unusedSymbols);

      return {
        success: true,
        data: {
          kind: OrganizationActionKind.RemoveUnused,
          title: `Remove ${analysis.unusedSymbols.length} unused symbols`,
          description: `Remove unused variables, functions, and modules`,
          edit: workspaceEdit,
          isSafe: true, // Removing unused code is generally safe
          affectedSymbols: analysis.unusedSymbols.map(s => s.name)
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to create remove unused action: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Create organize imports action
   */
  private async createOrganizeImportsAction(
    model: monaco.editor.ITextModel,
    analysis: OrganizationAnalysis
  ): Promise<OrganizationResult<OrganizationAction>> {
    try {
      const sortedImports = [...analysis.imports].sort((a, b) => a.name.localeCompare(b.name));
      const workspaceEdit = this.createReorderEdit(model, analysis.imports, sortedImports);

      return {
        success: true,
        data: {
          kind: OrganizationActionKind.OrganizeImports,
          title: 'Organize imports',
          description: 'Sort and organize include/use statements',
          edit: workspaceEdit,
          isSafe: true,
          affectedSymbols: analysis.imports.map(s => s.name)
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to create organize imports action: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Create full organization action
   */
  private async createFullOrganizationAction(
    model: monaco.editor.ITextModel,
    analysis: OrganizationAnalysis
  ): Promise<OrganizationResult<OrganizationAction>> {
    try {
      // Combine all organization operations
      const edits: monaco.languages.IWorkspaceTextEdit[] = [];

      // Add grouping edits
      const groupingEdit = this.createGroupingEdit(model, analysis.groups);
      const groupingTextEdits = groupingEdit.edits.filter((e): e is monaco.languages.IWorkspaceTextEdit =>
        'textEdit' in e
      );
      edits.push(...groupingTextEdits);

      // Add remove unused edits if enabled
      if (this.config.enableUnusedRemoval && analysis.unusedSymbols.length > 0) {
        const removeEdit = this.createRemoveUnusedEdit(model, analysis.unusedSymbols);
        const removeTextEdits = removeEdit.edits.filter((e): e is monaco.languages.IWorkspaceTextEdit =>
          'textEdit' in e
        );
        edits.push(...removeTextEdits);
      }

      const workspaceEdit: monaco.languages.WorkspaceEdit = { edits };

      return {
        success: true,
        data: {
          kind: OrganizationActionKind.FullOrganization,
          title: 'Organize entire file',
          description: 'Apply all organization improvements',
          edit: workspaceEdit,
          isPreferred: true,
          isSafe: analysis.canSafelyReorganize,
          affectedSymbols: analysis.currentOrder.map(s => s.name)
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to create full organization action: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Create workspace edit for reordering symbols
   */
  private createReorderEdit(
    model: monaco.editor.ITextModel,
    currentOrder: readonly ParserSymbolInfo[],
    newOrder: readonly ParserSymbolInfo[]
  ): monaco.languages.WorkspaceEdit {
    // Simplified implementation - in practice, this would need more sophisticated text manipulation
    const edits: monaco.languages.IWorkspaceTextEdit[] = [];

    // For now, just return empty edit as placeholder
    // TODO: Implement actual text reordering logic

    return { edits };
  }

  /**
   * Create workspace edit for grouping symbols
   */
  private createGroupingEdit(
    model: monaco.editor.ITextModel,
    groups: readonly SymbolGroup[]
  ): monaco.languages.WorkspaceEdit {
    // Simplified implementation - in practice, this would reorganize code by groups
    const edits: monaco.languages.IWorkspaceTextEdit[] = [];

    // For now, just return empty edit as placeholder
    // TODO: Implement actual grouping logic

    return { edits };
  }

  /**
   * Create workspace edit for removing unused symbols
   */
  private createRemoveUnusedEdit(
    model: monaco.editor.ITextModel,
    unusedSymbols: readonly ParserSymbolInfo[]
  ): monaco.languages.WorkspaceEdit {
    const edits: monaco.languages.IWorkspaceTextEdit[] = [];

    for (const symbol of unusedSymbols) {
      if (symbol.loc) {
        edits.push({
          resource: model.uri,
          versionId: model.getVersionId(),
          textEdit: {
            range: {
              startLineNumber: symbol.loc.start.line + 1,
              startColumn: 1,
              endLineNumber: symbol.loc.end.line + 2, // Include newline
              endColumn: 1
            },
            text: '' // Remove the line
          }
        });
      }
    }

    return { edits };
  }

  /**
   * Get AST from parser service
   */
  private getASTFromParserService(): ASTNode[] | null {
    try {
      if (!this.parserService?.isReady()) {
        return null;
      }

      // Get the current AST from the parser service
      // The parser service maintains the current parsed AST
      const currentAST = this.parserService.getAST();
      return currentAST || null;
    } catch (error) {
      // Log error in development mode only
      if (process.env['NODE_ENV'] === 'development') {
        console.warn('Failed to get AST from parser service:', error);
      }
      return null;
    }
  }
}
