/**
 * @file OpenSCAD Hover Module
 * 
 * Exports all hover-related functionality including providers,
 * documentation parsing, and utilities for rich hover information.
 * 
 * This module provides:
 * - Enhanced hover provider with AST integration
 * - Advanced documentation parsing with JSDoc support
 * - Rich markdown formatting for Monaco editor
 * - Performance optimized with caching and incremental updates
 * 
 * @example
 * ```typescript
 * import { 
 *   OpenSCADHoverProvider, 
 *   DocumentationParser,
 *   formatDocumentationAsMarkdown 
 * } from '@holistic-stack/openscad-editor/hover';
 * 
 * // Create hover provider
 * const hoverProvider = new OpenSCADHoverProvider(
 *   parserService,
 *   symbolProvider,
 *   positionUtilities
 * );
 * 
 * // Register with Monaco
 * monaco.languages.registerHoverProvider('openscad', hoverProvider);
 * 
 * // Parse documentation
 * const parser = new DocumentationParser();
 * const parsed = parser.parseDocumentation(docString);
 * const markdown = parser.formatAsMarkdown(parsed);
 * ```
 */

// Core hover provider
export { OpenSCADHoverProvider } from './hover-provider';

// Documentation parsing utilities
export { 
  DocumentationParser,
  createDocumentationParser,
  parseDocumentation,
  formatDocumentationAsMarkdown,
  DEFAULT_DOCUMENTATION_OPTIONS,
  type ParsedDocumentation,
  type ParameterDoc,
  type ReturnDoc,
  type ExampleDoc,
  type DocumentationOptions
} from './documentation-parser';

// Re-export types for convenience
export type {
  HoverContext,
  HoverStats
} from './hover-provider';
