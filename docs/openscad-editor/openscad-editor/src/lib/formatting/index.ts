/**
 * Formatting Module Exports
 * 
 * Centralized exports for all formatting-related functionality
 */

// Core formatting classes
export { ASTFormatter } from './ast-formatter';
export type { FormatResult, FormattedRange } from './ast-formatter';

// Formatting service
export { FormattingService, registerFormattingProvider } from './formatting-service';
export type { FormattingProvider, FormattingServiceConfig } from './formatting-service';

// Formatting rules and options
export { 
  DEFAULT_FORMATTING_OPTIONS, 
  OPENSCAD_FORMATTING_RULES, 
  applyFormattingRules 
} from './formatting-rules';
export type { FormattingOptions, FormattingRule } from './formatting-rules';

// React components
export { default as FormattingConfig } from './formatting-config';
export type { FormattingConfigProps } from './formatting-config';

// Type re-exports for convenience
export type { FormattingOptions as IFormattingOptions } from './formatting-rules';