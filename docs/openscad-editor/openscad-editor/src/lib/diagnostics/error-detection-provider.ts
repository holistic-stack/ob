/**
 * @file Real-time Error Detection Provider for OpenSCAD Editor
 * 
 * Provides comprehensive error detection and diagnostic capabilities for OpenSCAD code,
 * integrating with Monaco editor's marker system for real-time error highlighting.
 * 
 * @example
 * ```typescript
 * const errorProvider = new OpenSCADErrorDetectionProvider(parserService);
 * await errorProvider.init();
 * 
 * // Detect errors in code
 * const diagnostics = await errorProvider.detectErrors(model, code);
 * errorProvider.updateMarkers(model, diagnostics);
 * ```
 */

import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { type OpenSCADParserService, type ParseResult } from '../services/openscad-parser-service';

/**
 * Diagnostic severity levels matching Monaco's MarkerSeverity
 */
export enum DiagnosticSeverity {
  Error = 8,
  Warning = 4,
  Info = 2,
  Hint = 1
}

/**
 * Enhanced diagnostic information for OpenSCAD code
 */
export interface OpenSCADDiagnostic {
  readonly message: string;
  readonly severity: DiagnosticSeverity;
  readonly range: monaco.IRange;
  readonly source: 'parser' | 'semantic' | 'syntax';
  readonly code?: string | number;
  readonly relatedInformation?: readonly monaco.editor.IRelatedInformation[];
  readonly tags?: readonly monaco.MarkerTag[];
}

/**
 * Configuration options for error detection
 */
export interface ErrorDetectionConfig {
  readonly enableSyntaxErrors: boolean;
  readonly enableSemanticErrors: boolean;
  readonly enableWarnings: boolean;
  readonly enableHints: boolean;
  readonly maxDiagnostics: number;
  readonly debounceMs: number;
}

/**
 * Default configuration for error detection
 */
export const DEFAULT_ERROR_DETECTION_CONFIG: ErrorDetectionConfig = {
  enableSyntaxErrors: true,
  enableSemanticErrors: true,
  enableWarnings: true,
  enableHints: true,
  maxDiagnostics: 100,
  debounceMs: 300
} as const;

/**
 * Result type for error detection operations
 */
export type ErrorDetectionResult<T> = 
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly error: string };

/**
 * Real-time Error Detection Provider for OpenSCAD
 * 
 * Provides comprehensive error detection capabilities including:
 * - Syntax error detection using Tree-sitter parser
 * - Semantic error analysis with AST validation
 * - Real-time marker updates in Monaco editor
 * - Configurable diagnostic levels and filtering
 * - Performance-optimized with debouncing and caching
 */
export class OpenSCADErrorDetectionProvider {
  private readonly parserService: OpenSCADParserService;
  private readonly config: ErrorDetectionConfig;
  private readonly diagnosticsCache = new Map<string, OpenSCADDiagnostic[]>();
  private debounceTimer: NodeJS.Timeout | null = null;
  private isInitialized = false;

  constructor(
    parserService: OpenSCADParserService,
    config: Partial<ErrorDetectionConfig> = {}
  ) {
    this.parserService = parserService;
    this.config = { ...DEFAULT_ERROR_DETECTION_CONFIG, ...config };
  }

  /**
   * Initialize the error detection provider
   */
  async init(): Promise<ErrorDetectionResult<void>> {
    try {
      if (!this.parserService.isReady()) {
        return {
          success: false,
          error: 'Parser service is not ready. Ensure it is initialized before using error detection.'
        };
      }

      this.isInitialized = true;
      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: `Failed to initialize error detection provider: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Detect errors in OpenSCAD code with debouncing
   */
  async detectErrorsDebounced(
    model: monaco.editor.ITextModel,
    code: string
  ): Promise<void> {
    // Clear existing debounce timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    // Set new debounce timer
    this.debounceTimer = setTimeout(async () => {
      const result = await this.detectErrors(model, code);
      if (result.success) {
        this.updateMarkers(model, result.data);
      }
    }, this.config.debounceMs);
  }

  /**
   * Detect errors in OpenSCAD code immediately
   */
  async detectErrors(
    model: monaco.editor.ITextModel,
    code: string
  ): Promise<ErrorDetectionResult<OpenSCADDiagnostic[]>> {
    if (!this.isInitialized) {
      return {
        success: false,
        error: 'Error detection provider not initialized'
      };
    }

    try {
      const modelUri = model.uri.toString();
      
      // Check cache first
      if (this.diagnosticsCache.has(modelUri)) {
        const cached = this.diagnosticsCache.get(modelUri)!;
        return { success: true, data: cached };
      }

      const diagnostics: OpenSCADDiagnostic[] = [];

      // 1. Syntax error detection using parser
      if (this.config.enableSyntaxErrors) {
        const syntaxDiagnostics = await this.detectSyntaxErrors(code);
        if (syntaxDiagnostics.success) {
          diagnostics.push(...syntaxDiagnostics.data);
        } else {
          // If syntax error detection fails, propagate the error
          return syntaxDiagnostics;
        }
      }

      // 2. Semantic error detection using AST analysis
      if (this.config.enableSemanticErrors) {
        const semanticDiagnostics = await this.detectSemanticErrors(code);
        if (semanticDiagnostics.success) {
          diagnostics.push(...semanticDiagnostics.data);
        }
      }

      // 3. Apply diagnostic limits and filtering
      const filteredDiagnostics = this.filterDiagnostics(diagnostics);

      // Cache the results
      this.diagnosticsCache.set(modelUri, filteredDiagnostics);

      return { success: true, data: filteredDiagnostics };
    } catch (error) {
      return {
        success: false,
        error: `Error detection failed: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Update Monaco editor markers with diagnostics
   */
  updateMarkers(
    model: monaco.editor.ITextModel,
    diagnostics: OpenSCADDiagnostic[]
  ): void {
    const markers: monaco.editor.IMarkerData[] = diagnostics.map(diagnostic => {
      const marker: monaco.editor.IMarkerData = {
        severity: diagnostic.severity as unknown as monaco.MarkerSeverity,
        message: diagnostic.message,
        startLineNumber: diagnostic.range.startLineNumber,
        startColumn: diagnostic.range.startColumn,
        endLineNumber: diagnostic.range.endLineNumber,
        endColumn: diagnostic.range.endColumn,
        source: diagnostic.source
      };

      // Only add optional properties if they have valid values
      if (typeof diagnostic.code === 'string') {
        marker.code = diagnostic.code;
      }
      if (diagnostic.relatedInformation) {
        marker.relatedInformation = [...diagnostic.relatedInformation];
      }
      if (diagnostic.tags) {
        marker.tags = [...diagnostic.tags];
      }

      return marker;
    });

    monaco.editor.setModelMarkers(model, 'openscad-diagnostics', markers);
  }

  /**
   * Clear all diagnostics for a model
   */
  clearDiagnostics(model: monaco.editor.ITextModel): void {
    monaco.editor.setModelMarkers(model, 'openscad-diagnostics', []);
    this.diagnosticsCache.delete(model.uri.toString());
  }

  /**
   * Get current diagnostics for a model
   */
  getDiagnostics(model: monaco.editor.ITextModel): OpenSCADDiagnostic[] {
    return this.diagnosticsCache.get(model.uri.toString()) || [];
  }

  /**
   * Check if the provider is ready for use
   */
  isReady(): boolean {
    return this.isInitialized && this.parserService.isReady();
  }

  /**
   * Dispose of the error detection provider
   */
  dispose(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    
    this.diagnosticsCache.clear();
    this.isInitialized = false;
  }

  // Private helper methods

  /**
   * Detect syntax errors using the Tree-sitter parser
   */
  private async detectSyntaxErrors(code: string): Promise<ErrorDetectionResult<OpenSCADDiagnostic[]>> {
    try {
      const parseResult: ParseResult = await this.parserService.parseDocument(code);
      const diagnostics: OpenSCADDiagnostic[] = [];

      for (const error of parseResult.errors) {
        diagnostics.push({
          message: error.message,
          severity: this.mapSeverity(error.severity),
          range: this.createRange(error.location.line, error.location.column),
          source: 'parser',
          code: 'syntax-error'
        });
      }

      return { success: true, data: diagnostics };
    } catch (error) {
      return {
        success: false,
        error: `Syntax error detection failed: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Detect semantic errors using AST analysis
   */
  private async detectSemanticErrors(_code: string): Promise<ErrorDetectionResult<OpenSCADDiagnostic[]>> {
    try {
      // TODO: Implement semantic error detection
      // This would include:
      // - Undefined variable references
      // - Type mismatches
      // - Invalid function calls
      // - Module parameter validation
      
      const diagnostics: OpenSCADDiagnostic[] = [];
      
      // Placeholder for semantic analysis
      // const symbols = this.parserService.getDocumentSymbols();
      // ... semantic validation logic ...

      return { success: true, data: diagnostics };
    } catch (error) {
      return {
        success: false,
        error: `Semantic error detection failed: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Filter diagnostics based on configuration
   */
  private filterDiagnostics(diagnostics: OpenSCADDiagnostic[]): OpenSCADDiagnostic[] {
    let filtered = diagnostics;

    // Filter by severity
    if (!this.config.enableWarnings) {
      filtered = filtered.filter(d => d.severity !== DiagnosticSeverity.Warning);
    }
    if (!this.config.enableHints) {
      filtered = filtered.filter(d => d.severity !== DiagnosticSeverity.Hint);
    }

    // Apply maximum diagnostic limit
    if (filtered.length > this.config.maxDiagnostics) {
      filtered = filtered.slice(0, this.config.maxDiagnostics);
    }

    return filtered;
  }

  /**
   * Map ParseError severity to Monaco DiagnosticSeverity
   */
  private mapSeverity(severity: 'error' | 'warning' | 'info'): DiagnosticSeverity {
    switch (severity) {
      case 'error':
        return DiagnosticSeverity.Error;
      case 'warning':
        return DiagnosticSeverity.Warning;
      case 'info':
        return DiagnosticSeverity.Info;
      default:
        return DiagnosticSeverity.Error;
    }
  }

  /**
   * Create Monaco range from line and column
   */
  private createRange(line: number, column: number): monaco.IRange {
    return {
      startLineNumber: line + 1, // Monaco uses 1-based line numbers
      startColumn: column + 1,   // Monaco uses 1-based column numbers
      endLineNumber: line + 1,
      endColumn: column + 2      // Highlight at least one character
    };
  }
}
