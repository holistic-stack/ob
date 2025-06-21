/**
 * @file Feature Configuration for OpenSCAD Editor
 *
 * Defines the feature toggle system that allows selective enabling/disabling
 * of editor capabilities for performance optimization and customization.
 */

/**
 * Core editor features that are always available
 */
export interface CoreFeatures {
  /** Basic syntax highlighting using Monaco Monarch tokenizer */
  readonly syntaxHighlighting: boolean;
  /** Basic text editing capabilities */
  readonly basicEditing: boolean;
  /** Cross-platform keyboard shortcuts */
  readonly keyboardShortcuts: boolean;
}

/**
 * Parser-based features that require Tree-sitter parser
 */
export interface ParserFeatures {
  /** Real-time parsing with Tree-sitter */
  readonly realTimeParsing: boolean;
  /** Real-time syntax and semantic error detection */
  readonly errorDetection: boolean;
  /** Document structure outline generation */
  readonly documentOutline: boolean;
  /** Performance monitoring and diagnostics */
  readonly performanceMonitoring: boolean;
}

/**
 * IDE features that build on parser capabilities
 */
export interface IDEFeatures {
  /** Intelligent code completion with context awareness */
  readonly codeCompletion: boolean;
  /** Navigation commands (go-to-definition, find-references) */
  readonly navigationCommands: boolean;
  /** Rich hover information with symbol details */
  readonly hoverInformation: boolean;
  /** Quick fix suggestions for common errors */
  readonly quickFixes: boolean;
  /** Comprehensive diagnostics service */
  readonly diagnostics: boolean;
  /** Parser-based code formatting */
  readonly formatting: boolean;
}

/**
 * Advanced features for power users
 */
export interface AdvancedFeatures {
  /** Code refactoring capabilities */
  readonly refactoring: boolean;
  /** Advanced symbol search and filtering */
  readonly symbolSearch: boolean;
  /** Intelligent code folding */
  readonly folding: boolean;
  /** Enhanced bracket matching */
  readonly bracketMatching: boolean;
  /** Smart indentation */
  readonly smartIndentation: boolean;
  /** Comment toggling commands */
  readonly commentCommands: boolean;
  /** Semantic highlighting based on AST analysis */
  readonly semanticHighlighting: boolean;
}

/**
 * Complete feature configuration for the editor
 */
export interface OpenscadEditorFeatures {
  readonly core: CoreFeatures;
  readonly parser: ParserFeatures;
  readonly ide: IDEFeatures;
  readonly advanced: AdvancedFeatures;
}

/**
 * Performance configuration for feature loading
 */
export interface PerformanceConfig {
  /** Enable lazy loading of optional features */
  readonly lazyLoading: boolean;
  /** Debounce delay for parsing operations (ms) */
  readonly parseDebounceMs: number;
  /** Maximum parse time before timeout (ms) */
  readonly parseTimeoutMs: number;
  /** Enable performance monitoring */
  readonly enableMetrics: boolean;
}

/**
 * Default feature configuration - Basic editor with essential features
 */
export const DEFAULT_FEATURES: OpenscadEditorFeatures = {
  core: {
    syntaxHighlighting: true,
    basicEditing: true,
    keyboardShortcuts: true
  },
  parser: {
    realTimeParsing: false,
    errorDetection: false,
    documentOutline: false,
    performanceMonitoring: false
  },
  ide: {
    codeCompletion: false,
    navigationCommands: false,
    hoverInformation: false,
    quickFixes: false,
    diagnostics: false,
    formatting: false
  },
  advanced: {
    refactoring: false,
    symbolSearch: false,
    folding: false,
    bracketMatching: false,
    smartIndentation: false,
    commentCommands: false,
    semanticHighlighting: false
  }
} as const;

/**
 * Parser-enabled configuration - Includes parsing and basic parser features
 */
export const PARSER_FEATURES: OpenscadEditorFeatures = {
  ...DEFAULT_FEATURES,
  parser: {
    realTimeParsing: true,
    errorDetection: true,
    documentOutline: true,
    performanceMonitoring: true
  }
} as const;

/**
 * IDE configuration - Full IDE experience with all IDE features
 */
export const IDE_FEATURES: OpenscadEditorFeatures = {
  ...PARSER_FEATURES,
  ide: {
    codeCompletion: true,
    navigationCommands: true,
    hoverInformation: true,
    quickFixes: true,
    diagnostics: true,
    formatting: true
  }
} as const;

/**
 * Full configuration - All features enabled for maximum functionality
 */
export const FULL_FEATURES: OpenscadEditorFeatures = {
  ...IDE_FEATURES,
  advanced: {
    refactoring: true,
    symbolSearch: true,
    folding: true,
    bracketMatching: true,
    smartIndentation: true,
    commentCommands: true,
    semanticHighlighting: true
  }
} as const;

/**
 * Default performance configuration
 */
export const DEFAULT_PERFORMANCE: PerformanceConfig = {
  lazyLoading: true,
  parseDebounceMs: 500,
  parseTimeoutMs: 5000,
  enableMetrics: true
} as const;

/**
 * Predefined feature presets for common use cases
 */
export const FEATURE_PRESETS = {
  /** Basic text editor with syntax highlighting */
  BASIC: DEFAULT_FEATURES,
  /** Editor with parser and error detection */
  PARSER: PARSER_FEATURES,
  /** Full IDE experience with IDE features */
  IDE: IDE_FEATURES,
  /** All features enabled */
  FULL: FULL_FEATURES
} as const;

/**
 * Type for feature preset names
 */
export type FeaturePreset = keyof typeof FEATURE_PRESETS;

/**
 * Utility function to check if parser features are required
 */
export function requiresParser(features: OpenscadEditorFeatures): boolean {
  return (
    features.parser.realTimeParsing ||
    features.parser.errorDetection ||
    features.parser.documentOutline ||
    features.ide.codeCompletion ||
    features.ide.navigationCommands ||
    features.ide.hoverInformation ||
    features.ide.quickFixes ||
    features.ide.diagnostics ||
    features.ide.formatting ||
    Object.values(features.advanced).some(enabled => enabled)
  );
}

/**
 * Utility function to check if IDE features are enabled
 */
export function hasIDEFeatures(features: OpenscadEditorFeatures): boolean {
  return Object.values(features.ide).some(enabled => enabled);
}

/**
 * Utility function to check if advanced features are enabled
 */
export function hasAdvancedFeatures(features: OpenscadEditorFeatures): boolean {
  return Object.values(features.advanced).some(enabled => enabled);
}

/**
 * Utility function to merge feature configurations
 */
export function mergeFeatures(
  base: OpenscadEditorFeatures,
  override: Partial<OpenscadEditorFeatures>
): OpenscadEditorFeatures {
  return {
    core: { ...base.core, ...override.core },
    parser: { ...base.parser, ...override.parser },
    ide: { ...base.ide, ...override.ide },
    advanced: { ...base.advanced, ...override.advanced }
  };
}

/**
 * Utility function to create a feature configuration from a preset
 */
export function createFeatureConfig(preset: FeaturePreset): OpenscadEditorFeatures {
  return FEATURE_PRESETS[preset];
}
