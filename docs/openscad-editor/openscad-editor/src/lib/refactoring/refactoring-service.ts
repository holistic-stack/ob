/**
 * @file Refactoring Service for OpenSCAD Editor
 * 
 * Central service that coordinates all refactoring operations including rename,
 * extract, and organization functionality. Provides a unified interface for
 * Monaco editor integration and manages refactoring provider lifecycle.
 * 
 * Features:
 * - Unified refactoring API
 * - Provider lifecycle management
 * - Monaco editor integration
 * - Refactoring action coordination
 * - Error handling and recovery
 * - Performance optimization
 * 
 * @example
 * ```typescript
 * const refactoringService = new RefactoringService(parserService, symbolProvider);
 * await refactoringService.registerProviders(monaco, 'openscad');
 * 
 * // Get all available refactoring actions
 * const actions = await refactoringService.getAllRefactoringActions(model, selection);
 * ```
 */

import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { type OpenSCADParserService } from '../services/openscad-parser-service';
import {
  type ASTNode,
  type Position,
  type SymbolInfo as ParserSymbolInfo,
  type SymbolProvider as ParserSymbolProvider,
  type PositionUtilities as ParserPositionUtilities
} from '@holistic-stack/openscad-parser';
import { 
  OpenSCADRenameProvider, 
  type RenameConfig 
} from './rename-provider';
import { 
  OpenSCADExtractProvider, 
  type ExtractConfig,
  type ExtractAction 
} from './extract-provider';
import { 
  OpenSCADOrganizationProvider, 
  type OrganizationConfig,
  type OrganizationAction 
} from './organization-provider';

// Enhanced interfaces for refactoring service

interface DependencyAnalyzer {
  analyzeDependencies(ast: ASTNode[]): Map<string, string[]>;
  findCircularDependencies(ast: ASTNode[]): string[][];
  getTopologicalOrder(symbols: ParserSymbolInfo[]): ParserSymbolInfo[];
}

/**
 * Configuration for the refactoring service
 */
export interface RefactoringServiceConfig {
  readonly rename: Partial<RenameConfig>;
  readonly extract: Partial<ExtractConfig>;
  readonly organization: Partial<OrganizationConfig>;
  readonly enableCodeActions: boolean;
  readonly enableQuickFix: boolean;
  readonly enablePreview: boolean;
}

/**
 * Default refactoring service configuration
 */
export const DEFAULT_REFACTORING_CONFIG: RefactoringServiceConfig = {
  rename: {},
  extract: {},
  organization: {},
  enableCodeActions: true,
  enableQuickFix: true,
  enablePreview: true
} as const;

/**
 * Result type for refactoring operations
 */
export type RefactoringResult<T> = 
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly error: string };

/**
 * Combined refactoring action type
 */
export type RefactoringAction = ExtractAction | OrganizationAction;

/**
 * Refactoring context information
 */
export interface RefactoringContext {
  readonly model: monaco.editor.ITextModel;
  readonly selection?: monaco.IRange;
  readonly position?: monaco.Position;
  readonly ast?: ASTNode[];
  readonly symbols?: ParserSymbolInfo[];
}

/**
 * Refactoring Service
 * 
 * Central coordinator for all refactoring operations in the OpenSCAD editor.
 * Manages provider lifecycle and provides unified refactoring API.
 */
export class RefactoringService {
  private readonly parserService: OpenSCADParserService | null = null;
  private readonly symbolProvider: ParserSymbolProvider | null = null;
  private readonly positionUtilities: ParserPositionUtilities | null = null;
  private readonly dependencyAnalyzer: DependencyAnalyzer | null = null;
  private readonly config: RefactoringServiceConfig;

  // Provider instances
  private renameProvider: OpenSCADRenameProvider | null = null;
  private extractProvider: OpenSCADExtractProvider | null = null;
  private organizationProvider: OpenSCADOrganizationProvider | null = null;

  // Monaco disposables for cleanup
  private readonly disposables: monaco.IDisposable[] = [];

  constructor(
    parserService?: OpenSCADParserService,
    symbolProvider?: ParserSymbolProvider,
    positionUtilities?: ParserPositionUtilities,
    dependencyAnalyzer?: DependencyAnalyzer,
    config: Partial<RefactoringServiceConfig> = {}
  ) {
    this.parserService = parserService || null;
    this.symbolProvider = symbolProvider || null;
    this.positionUtilities = positionUtilities || null;
    this.dependencyAnalyzer = dependencyAnalyzer || null;
    this.config = { ...DEFAULT_REFACTORING_CONFIG, ...config };

    this.initializeProviders();
  }

  /**
   * Initialize refactoring providers
   */
  private initializeProviders(): void {
    this.renameProvider = new OpenSCADRenameProvider(
      this.parserService || undefined,
      this.symbolProvider || undefined,
      this.positionUtilities || undefined,
      this.config.rename
    );

    this.extractProvider = new OpenSCADExtractProvider(
      this.parserService || undefined,
      this.symbolProvider as any || undefined,
      this.positionUtilities as any || undefined,
      this.config.extract
    );

    this.organizationProvider = new OpenSCADOrganizationProvider(
      this.parserService || undefined,
      this.symbolProvider as any || undefined,
      this.dependencyAnalyzer || undefined,
      this.config.organization
    );
  }

  /**
   * Register all refactoring providers with Monaco
   */
  async registerProviders(
    monaco: typeof import('monaco-editor/esm/vs/editor/editor.api'),
    languageId: string
  ): Promise<RefactoringResult<void>> {
    try {
      // Register rename provider
      if (this.renameProvider) {
        const renameDisposable = monaco.languages.registerRenameProvider(languageId, this.renameProvider);
        this.disposables.push(renameDisposable);
      }

      // Register code action provider for extract and organization actions
      if (this.config.enableCodeActions && (this.extractProvider || this.organizationProvider)) {
        const codeActionProvider = this.createCodeActionProvider();
        const codeActionDisposable = monaco.languages.registerCodeActionProvider(languageId, codeActionProvider);
        this.disposables.push(codeActionDisposable);
      }

      console.log('🔧 Refactoring providers registered successfully');
      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: `Failed to register refactoring providers: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Get all available refactoring actions for the given context
   */
  async getAllRefactoringActions(
    model: monaco.editor.ITextModel,
    selection?: monaco.IRange
  ): Promise<RefactoringResult<RefactoringAction[]>> {
    try {
      const actions: RefactoringAction[] = [];

      // Get extract actions if selection is provided
      if (selection && this.extractProvider) {
        const extractResult = await this.extractProvider.getExtractActions(model, selection);
        if (extractResult.success) {
          actions.push(...extractResult.data);
        }
      }

      // Get organization actions
      if (this.organizationProvider) {
        const organizationResult = await this.organizationProvider.getOrganizationActions(model);
        if (organizationResult.success) {
          actions.push(...organizationResult.data);
        }
      }

      return { success: true, data: actions };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get refactoring actions: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Execute a refactoring action
   */
  async executeRefactoringAction(
    action: RefactoringAction,
    model: monaco.editor.ITextModel
  ): Promise<RefactoringResult<void>> {
    try {
      // Apply the workspace edit
      const success = await this.applyWorkspaceEdit(action.edit, model);
      
      if (success) {
        console.log(`✅ Refactoring action executed: ${action.title}`);
        return { success: true, data: undefined };
      } else {
        return {
          success: false,
          error: 'Failed to apply workspace edit'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: `Failed to execute refactoring action: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Create Monaco code action provider
   */
  private createCodeActionProvider(): monaco.languages.CodeActionProvider {
    return {
      provideCodeActions: async (
        model: monaco.editor.ITextModel,
        range: monaco.Range,
        context: monaco.languages.CodeActionContext,
        token: monaco.CancellationToken
      ): Promise<monaco.languages.CodeActionList | null> => {
        if (token.isCancellationRequested) {
          return null;
        }

        try {
          const actions: monaco.languages.CodeAction[] = [];

          // Get refactoring actions
          const refactoringResult = await this.getAllRefactoringActions(model, range);
          if (refactoringResult.success) {
            for (const action of refactoringResult.data) {
              const codeAction: monaco.languages.CodeAction = {
                title: action.title,
                kind: this.getCodeActionKind(action),
                edit: action.edit
              };

              if (action.isPreferred) {
                codeAction.isPreferred = action.isPreferred;
              }

              actions.push(codeAction);
            }
          }

          return {
            actions,
            dispose: () => {
              // Cleanup if needed
            }
          };
        } catch (error) {
          console.error('Code action provider error:', error);
          return null;
        }
      }
    };
  }

  /**
   * Get Monaco code action kind for refactoring action
   */
  private getCodeActionKind(action: RefactoringAction): string {
    if ('kind' in action) {
      switch (action.kind) {
        case 'extract.variable':
        case 'extract.function':
        case 'extract.module':
          return 'refactor.extract';
        case 'organize.sort':
        case 'organize.group':
        case 'organize.remove_unused':
        case 'organize.imports':
        case 'organize.full':
          return 'source.organizeImports';
        default:
          return 'refactor';
      }
    }
    return 'refactor';
  }

  /**
   * Apply workspace edit to model
   */
  private async applyWorkspaceEdit(
    edit: monaco.languages.WorkspaceEdit,
    model: monaco.editor.ITextModel
  ): Promise<boolean> {
    try {
      // Filter and sort text edits by position (reverse order to avoid offset issues)
      const textEdits = edit.edits.filter((e): e is monaco.languages.IWorkspaceTextEdit =>
        'textEdit' in e
      );

      const sortedEdits = [...textEdits].sort((a, b) => {
        const aStart = a.textEdit.range.startLineNumber * 1000000 + a.textEdit.range.startColumn;
        const bStart = b.textEdit.range.startLineNumber * 1000000 + b.textEdit.range.startColumn;
        return bStart - aStart; // Reverse order
      });

      // Apply edits
      const operations: monaco.editor.IIdentifiedSingleEditOperation[] = sortedEdits.map(edit => ({
        range: edit.textEdit.range,
        text: edit.textEdit.text,
        forceMoveMarkers: true
      }));

      model.pushEditOperations([], operations, () => null);
      return true;
    } catch (error) {
      console.error('Failed to apply workspace edit:', error);
      return false;
    }
  }

  /**
   * Check if rename is available at position
   */
  async canRename(
    model: monaco.editor.ITextModel,
    position: monaco.Position
  ): Promise<boolean> {
    if (!this.renameProvider) {
      return false;
    }

    try {
      const token = { isCancellationRequested: false } as monaco.CancellationToken;
      const result = await this.renameProvider.prepareRename(model, position, token);
      return result !== null;
    } catch {
      return false;
    }
  }

  /**
   * Get extract actions for selection
   */
  async getExtractActions(
    model: monaco.editor.ITextModel,
    selection: monaco.IRange
  ): Promise<RefactoringResult<ExtractAction[]>> {
    if (!this.extractProvider) {
      return { success: false, error: 'Extract provider not available' };
    }

    return this.extractProvider.getExtractActions(model, selection);
  }

  /**
   * Get organization actions for model
   */
  async getOrganizationActions(
    model: monaco.editor.ITextModel
  ): Promise<RefactoringResult<OrganizationAction[]>> {
    if (!this.organizationProvider) {
      return { success: false, error: 'Organization provider not available' };
    }

    return this.organizationProvider.getOrganizationActions(model);
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<RefactoringServiceConfig>): void {
    Object.assign(this.config, newConfig);
    this.initializeProviders(); // Reinitialize with new config
  }

  /**
   * Dispose of all resources
   */
  dispose(): void {
    // Dispose Monaco registrations
    this.disposables.forEach(disposable => disposable.dispose());
    this.disposables.length = 0;

    // Clear provider references
    this.renameProvider = null;
    this.extractProvider = null;
    this.organizationProvider = null;

    console.log('🧹 Refactoring service disposed');
  }

  /**
   * Get service status
   */
  getStatus(): {
    readonly isReady: boolean;
    readonly providersRegistered: number;
    readonly hasParserService: boolean;
    readonly hasSymbolProvider: boolean;
  } {
    return {
      isReady: this.parserService?.isReady() ?? false,
      providersRegistered: this.disposables.length,
      hasParserService: this.parserService !== null,
      hasSymbolProvider: this.symbolProvider !== null
    };
  }
}
