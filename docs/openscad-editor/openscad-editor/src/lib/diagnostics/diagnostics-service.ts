/**
 * @file Diagnostics Service for OpenSCAD Editor
 * 
 * Coordinates error detection, quick fixes, and diagnostic management for the
 * OpenSCAD editor, providing a unified interface for all diagnostic features.
 * 
 * @example
 * ```typescript
 * const diagnosticsService = createDiagnosticsService(parserService);
 * await diagnosticsService.init();
 * 
 * // Register with Monaco editor
 * diagnosticsService.registerWithMonaco(monaco);
 * 
 * // Enable real-time diagnostics
 * diagnosticsService.enableRealTimeDiagnostics(model);
 * ```
 */

import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { type OpenSCADParserService } from '../services/openscad-parser-service';
import {
  OpenSCADErrorDetectionProvider,
  type ErrorDetectionConfig,
  type OpenSCADDiagnostic,
  type ErrorDetectionResult
} from './error-detection-provider';
import {
  OpenSCADQuickFixProvider,
  type QuickFixConfig
} from './quick-fix-provider';

/**
 * Configuration for the diagnostics service
 */
export interface DiagnosticsServiceConfig {
  readonly errorDetection: Partial<ErrorDetectionConfig>;
  readonly quickFix: Partial<QuickFixConfig>;
  readonly enableRealTime: boolean;
  readonly languageId: string;
}

/**
 * Default diagnostics service configuration
 */
export const DEFAULT_DIAGNOSTICS_CONFIG: DiagnosticsServiceConfig = {
  errorDetection: {},
  quickFix: {},
  enableRealTime: true,
  languageId: 'openscad'
} as const;

/**
 * Diagnostics Service for OpenSCAD
 * 
 * Provides comprehensive diagnostic capabilities including:
 * - Real-time error detection and highlighting
 * - Quick fix suggestions and auto-corrections
 * - Monaco editor integration
 * - Performance-optimized diagnostic updates
 * - Configurable diagnostic levels and behaviors
 */
export interface DiagnosticsService {
  /**
   * Initialize the diagnostics service
   */
  init(): Promise<ErrorDetectionResult<void>>;

  /**
   * Register diagnostic providers with Monaco editor
   */
  registerWithMonaco(monaco: typeof import('monaco-editor')): void;

  /**
   * Enable real-time diagnostics for a model
   */
  enableRealTimeDiagnostics(model: monaco.editor.ITextModel): void;

  /**
   * Disable real-time diagnostics for a model
   */
  disableRealTimeDiagnostics(model: monaco.editor.ITextModel): void;

  /**
   * Manually trigger diagnostics for a model
   */
  triggerDiagnostics(model: monaco.editor.ITextModel): Promise<ErrorDetectionResult<OpenSCADDiagnostic[]>>;

  /**
   * Clear all diagnostics for a model
   */
  clearDiagnostics(model: monaco.editor.ITextModel): void;

  /**
   * Get current diagnostics for a model
   */
  getDiagnostics(model: monaco.editor.ITextModel): OpenSCADDiagnostic[];

  /**
   * Check if the service is ready for use
   */
  isReady(): boolean;

  /**
   * Dispose of the diagnostics service
   */
  dispose(): void;
}

/**
 * Implementation of the DiagnosticsService interface
 */
class DiagnosticsServiceImpl implements DiagnosticsService {
  private readonly parserService: OpenSCADParserService;
  private readonly config: DiagnosticsServiceConfig;
  private readonly errorDetectionProvider: OpenSCADErrorDetectionProvider;
  private readonly quickFixProvider: OpenSCADQuickFixProvider;
  private readonly modelListeners = new Map<string, monaco.IDisposable>();
  private isInitialized = false;

  constructor(
    parserService: OpenSCADParserService,
    config: Partial<DiagnosticsServiceConfig> = {}
  ) {
    this.parserService = parserService;
    this.config = { ...DEFAULT_DIAGNOSTICS_CONFIG, ...config };
    
    this.errorDetectionProvider = new OpenSCADErrorDetectionProvider(
      parserService,
      this.config.errorDetection
    );
    
    this.quickFixProvider = new OpenSCADQuickFixProvider(
      this.config.quickFix
    );
  }

  async init(): Promise<ErrorDetectionResult<void>> {
    try {
      if (this.isInitialized) {
        return { success: true, data: undefined };
      }

      // Initialize error detection provider
      const initResult = await this.errorDetectionProvider.init();
      if (!initResult.success) {
        return initResult;
      }

      this.isInitialized = true;
      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: `Failed to initialize diagnostics service: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  registerWithMonaco(monacoInstance: typeof import('monaco-editor')): void {
    if (!this.isInitialized) {
      throw new Error('Diagnostics service not initialized. Call init() first.');
    }

    // Register quick fix provider
    monacoInstance.languages.registerCodeActionProvider(
      this.config.languageId,
      this.quickFixProvider
    );

    console.log(`✅ Diagnostics service registered for language: ${this.config.languageId}`);
  }

  enableRealTimeDiagnostics(model: monaco.editor.ITextModel): void {
    if (!this.isInitialized) {
      throw new Error('Diagnostics service not initialized. Call init() first.');
    }

    const modelUri = model.uri.toString();

    // Avoid duplicate listeners
    if (this.modelListeners.has(modelUri)) {
      return;
    }

    // Create content change listener
    const listener = model.onDidChangeContent(async () => {
      if (this.config.enableRealTime) {
        const code = model.getValue();
        await this.errorDetectionProvider.detectErrorsDebounced(model, code);
      }
    });

    this.modelListeners.set(modelUri, listener);

    // Trigger initial diagnostics
    this.triggerDiagnostics(model);

    console.log(`✅ Real-time diagnostics enabled for model: ${modelUri}`);
  }

  disableRealTimeDiagnostics(model: monaco.editor.ITextModel): void {
    const modelUri = model.uri.toString();
    const listener = this.modelListeners.get(modelUri);

    if (listener) {
      listener.dispose();
      this.modelListeners.delete(modelUri);
      console.log(`✅ Real-time diagnostics disabled for model: ${modelUri}`);
    }

    // Clear diagnostics when disabling
    this.clearDiagnostics(model);
  }

  async triggerDiagnostics(model: monaco.editor.ITextModel): Promise<ErrorDetectionResult<OpenSCADDiagnostic[]>> {
    if (!this.isInitialized) {
      return {
        success: false,
        error: 'Diagnostics service not initialized'
      };
    }

    try {
      const code = model.getValue();
      const result = await this.errorDetectionProvider.detectErrors(model, code);
      
      if (result.success) {
        this.errorDetectionProvider.updateMarkers(model, result.data);
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: `Failed to trigger diagnostics: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  clearDiagnostics(model: monaco.editor.ITextModel): void {
    this.errorDetectionProvider.clearDiagnostics(model);
  }

  getDiagnostics(model: monaco.editor.ITextModel): OpenSCADDiagnostic[] {
    return this.errorDetectionProvider.getDiagnostics(model);
  }

  isReady(): boolean {
    return this.isInitialized && this.errorDetectionProvider.isReady();
  }

  dispose(): void {
    // Dispose all model listeners
    for (const listener of this.modelListeners.values()) {
      listener.dispose();
    }
    this.modelListeners.clear();

    // Dispose providers
    this.errorDetectionProvider.dispose();

    this.isInitialized = false;
    console.log('✅ Diagnostics service disposed');
  }
}

/**
 * Factory function to create a diagnostics service
 */
export function createDiagnosticsService(
  parserService: OpenSCADParserService,
  config: Partial<DiagnosticsServiceConfig> = {}
): DiagnosticsService {
  return new DiagnosticsServiceImpl(parserService, config);
}
