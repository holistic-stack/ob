/**
 * @file Enhanced Editor Features for OpenSCAD
 * 
 * Exports all enhanced editor features including:
 * - Code folding provider
 * - Bracket matching and auto-closing
 * - Smart indentation provider
 * - Comment toggling commands
 * 
 * @example
 * ```typescript
 * import { createEditorFeaturesService } from './editor-features';
 * 
 * const featuresService = createEditorFeaturesService(parserService);
 * await featuresService.registerWithMonaco(monaco, 'openscad');
 * ```
 */

// Export folding provider
export {
  OpenSCADFoldingProvider,
  OpenSCADFoldingKind,
  DEFAULT_FOLDING_CONFIG,
  createFoldingProvider
} from './folding-provider';

export type {
  OpenSCADFoldingRange,
  FoldingConfig
} from './folding-provider';

// Export bracket matching
export {
  OpenSCADBracketMatchingService,
  DEFAULT_BRACKET_CONFIG,
  OPENSCAD_BRACKET_PAIRS,
  OPENSCAD_AUTO_CLOSING_PAIRS,
  OPENSCAD_SURROUNDING_PAIRS,
  OPENSCAD_COLORIZED_BRACKET_PAIRS,
  createOpenSCADLanguageConfiguration,
  createBracketMatchingService,
  getBracketPair,
  isOpeningBracket,
  isClosingBracket,
  getMatchingBracket
} from './bracket-matching';

export type {
  OpenSCADLanguageConfiguration,
  OpenSCADBracketPair,
  OpenSCADAutoClosingPair,
  OpenSCADSurroundingPair,
  BracketMatchingConfig
} from './bracket-matching';

// Export indentation provider
export {
  OpenSCADIndentationProvider,
  IndentationContext,
  DEFAULT_INDENTATION_CONFIG,
  IndentationAction,
  createIndentationProvider
} from './indentation-provider';

export type {
  IndentationConfig
} from './indentation-provider';

// Export comment commands
export {
  OpenSCADCommentService,
  DEFAULT_COMMENT_CONFIG,
  CommentOperation,
  createCommentService
} from './comment-commands';

export type {
  CommentConfig,
  CommentRange
} from './comment-commands';

import * as monaco from 'monaco-editor';
import { OpenSCADParserService } from '../services/openscad-parser-service';
import { OpenSCADFoldingProvider, DEFAULT_FOLDING_CONFIG } from './folding-provider';
import { OpenSCADBracketMatchingService, DEFAULT_BRACKET_CONFIG } from './bracket-matching';
import { OpenSCADIndentationProvider, DEFAULT_INDENTATION_CONFIG } from './indentation-provider';
import { OpenSCADCommentService, DEFAULT_COMMENT_CONFIG } from './comment-commands';
import type { FoldingConfig } from './folding-provider';
import type { BracketMatchingConfig } from './bracket-matching';
import type { IndentationConfig } from './indentation-provider';
import type { CommentConfig } from './comment-commands';

/**
 * Configuration for all editor features
 */
export interface EditorFeaturesConfig {
  readonly folding?: Partial<FoldingConfig>;
  readonly bracketMatching?: Partial<BracketMatchingConfig>;
  readonly indentation?: Partial<IndentationConfig>;
  readonly comments?: Partial<CommentConfig>;
  readonly enableFolding?: boolean;
  readonly enableBracketMatching?: boolean;
  readonly enableIndentation?: boolean;
  readonly enableComments?: boolean;
}

/**
 * Default configuration for all editor features
 */
export const DEFAULT_EDITOR_FEATURES_CONFIG: Required<EditorFeaturesConfig> = {
  folding: DEFAULT_FOLDING_CONFIG,
  bracketMatching: DEFAULT_BRACKET_CONFIG,
  indentation: DEFAULT_INDENTATION_CONFIG,
  comments: DEFAULT_COMMENT_CONFIG,
  enableFolding: true,
  enableBracketMatching: true,
  enableIndentation: true,
  enableComments: true
};

/**
 * Result type for editor features operations
 */
type EditorFeaturesResult<T> = 
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly error: string };

/**
 * Enhanced Editor Features Service
 * 
 * Coordinates all enhanced editor features:
 * - Code folding with AST awareness
 * - Intelligent bracket matching and auto-closing
 * - Smart indentation based on OpenSCAD syntax
 * - Comment toggling with keyboard shortcuts
 */
export class EditorFeaturesService {
  private readonly parserService: OpenSCADParserService;
  private readonly config: Required<EditorFeaturesConfig>;

  private foldingProvider?: OpenSCADFoldingProvider | undefined;
  private bracketMatchingService?: OpenSCADBracketMatchingService | undefined;
  private indentationProvider?: OpenSCADIndentationProvider | undefined;
  private commentService?: OpenSCADCommentService | undefined;
  
  private disposables: monaco.IDisposable[] = [];

  constructor(
    parserService: OpenSCADParserService,
    config: EditorFeaturesConfig = {}
  ) {
    this.parserService = parserService;
    this.config = { ...DEFAULT_EDITOR_FEATURES_CONFIG, ...config };
  }

  /**
   * Register all enabled features with Monaco editor
   */
  async registerWithMonaco(
    monaco: typeof import('monaco-editor'),
    languageId: string = 'openscad'
  ): Promise<EditorFeaturesResult<void>> {
    try {
      console.log('🚀 Registering enhanced editor features...');

      // Register folding provider
      if (this.config.enableFolding) {
        await this.registerFoldingProvider(monaco, languageId);
      }

      // Register bracket matching
      if (this.config.enableBracketMatching) {
        await this.registerBracketMatching(monaco, languageId);
      }

      // Register indentation provider
      if (this.config.enableIndentation) {
        await this.registerIndentationProvider(monaco, languageId);
      }

      console.log('✅ Enhanced editor features registered successfully');
      return { success: true, data: undefined };
    } catch (error) {
      const errorMessage = `Failed to register editor features: ${error instanceof Error ? error.message : String(error)}`;
      console.error('❌', errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Register comment commands with a specific editor instance
   */
  registerCommentCommands(editor: monaco.editor.IStandaloneCodeEditor): EditorFeaturesResult<void> {
    try {
      if (!this.config.enableComments) {
        return { success: true, data: undefined };
      }

      if (!this.commentService) {
        this.commentService = new OpenSCADCommentService(this.config.comments);
      }

      this.commentService.registerCommands(editor);
      return { success: true, data: undefined };
    } catch (error) {
      const errorMessage = `Failed to register comment commands: ${error instanceof Error ? error.message : String(error)}`;
      console.error('❌', errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Register folding provider
   */
  private async registerFoldingProvider(
    monaco: typeof import('monaco-editor'),
    languageId: string
  ): Promise<void> {
    this.foldingProvider = new OpenSCADFoldingProvider(this.parserService, this.config.folding);
    
    const disposable = monaco.languages.registerFoldingRangeProvider(languageId, this.foldingProvider);
    this.disposables.push(disposable);
    
    console.log('✅ Code folding provider registered');
  }

  /**
   * Register bracket matching
   */
  private async registerBracketMatching(
    monaco: typeof import('monaco-editor'),
    languageId: string
  ): Promise<void> {
    this.bracketMatchingService = new OpenSCADBracketMatchingService(this.config.bracketMatching);
    this.bracketMatchingService.registerWithMonaco(monaco, languageId);
    
    console.log('✅ Bracket matching registered');
  }

  /**
   * Register indentation provider
   */
  private async registerIndentationProvider(
    monaco: typeof import('monaco-editor'),
    languageId: string
  ): Promise<void> {
    this.indentationProvider = new OpenSCADIndentationProvider(this.parserService, this.config.indentation);
    
    const disposable = monaco.languages.registerOnTypeFormattingEditProvider(languageId, this.indentationProvider);
    this.disposables.push(disposable);
    
    console.log('✅ Smart indentation provider registered');
  }

  /**
   * Update configuration for all features
   */
  updateConfig(newConfig: Partial<EditorFeaturesConfig>): void {
    Object.assign(this.config, newConfig);

    // Update individual service configurations
    if (newConfig.folding && this.foldingProvider) {
      this.foldingProvider.updateConfig(newConfig.folding);
    }

    if (newConfig.bracketMatching && this.bracketMatchingService) {
      this.bracketMatchingService.updateConfig(newConfig.bracketMatching);
    }

    if (newConfig.indentation && this.indentationProvider) {
      this.indentationProvider.updateConfig(newConfig.indentation);
    }

    if (newConfig.comments && this.commentService) {
      this.commentService.updateConfig(newConfig.comments);
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): Readonly<Required<EditorFeaturesConfig>> {
    return { ...this.config };
  }

  /**
   * Get individual feature providers
   */
  getProviders() {
    return {
      folding: this.foldingProvider,
      bracketMatching: this.bracketMatchingService,
      indentation: this.indentationProvider,
      comments: this.commentService
    };
  }

  /**
   * Dispose of all resources
   */
  dispose(): void {
    // Dispose Monaco disposables
    this.disposables.forEach(disposable => disposable.dispose());
    this.disposables = [];

    // Dispose individual services
    if (this.bracketMatchingService) {
      this.bracketMatchingService.dispose();
      this.bracketMatchingService = undefined;
    }

    if (this.commentService) {
      this.commentService.dispose();
      this.commentService = undefined;
    }

    // Clear references
    this.foldingProvider = undefined;
    this.indentationProvider = undefined;
  }
}

/**
 * Create editor features service
 */
export function createEditorFeaturesService(
  parserService: OpenSCADParserService,
  config?: EditorFeaturesConfig
): EditorFeaturesService {
  return new EditorFeaturesService(parserService, config);
}

/**
 * Utility function to create all providers individually
 */
export function createAllProviders(
  parserService: OpenSCADParserService,
  config: EditorFeaturesConfig = {}
) {
  const mergedConfig = { ...DEFAULT_EDITOR_FEATURES_CONFIG, ...config };

  return {
    folding: mergedConfig.enableFolding 
      ? new OpenSCADFoldingProvider(parserService, mergedConfig.folding)
      : undefined,
    
    bracketMatching: mergedConfig.enableBracketMatching
      ? new OpenSCADBracketMatchingService(mergedConfig.bracketMatching)
      : undefined,
    
    indentation: mergedConfig.enableIndentation
      ? new OpenSCADIndentationProvider(parserService, mergedConfig.indentation)
      : undefined,
    
    comments: mergedConfig.enableComments
      ? new OpenSCADCommentService(mergedConfig.comments)
      : undefined
  };
}
