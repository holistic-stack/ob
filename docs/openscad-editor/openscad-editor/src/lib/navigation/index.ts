/**
 * @file OpenSCAD Navigation Module
 * 
 * Exports all navigation-related functionality including providers,
 * utilities, and commands for advanced IDE navigation features.
 * 
 * This module provides:
 * - Enhanced navigation provider with AST integration
 * - Advanced symbol search with fuzzy matching
 * - Navigation commands and keyboard shortcuts
 * - Performance optimized with caching and indexing
 * 
 * @example
 * ```typescript
 * import { 
 *   OpenSCADNavigationProvider, 
 *   SymbolSearcher,
 *   registerNavigationCommands 
 * } from '@holistic-stack/openscad-editor/navigation';
 * 
 * // Create navigation provider
 * const navigationProvider = new OpenSCADNavigationProvider(
 *   parserService,
 *   symbolProvider,
 *   positionUtilities
 * );
 * 
 * // Register with Monaco
 * monaco.languages.registerDefinitionProvider('openscad', navigationProvider);
 * monaco.languages.registerReferenceProvider('openscad', navigationProvider);
 * 
 * // Register navigation commands
 * const commands = registerNavigationCommands(editor, navigationProvider);
 * ```
 */

// Core navigation provider
export { OpenSCADNavigationProvider } from './navigation-provider';

// Navigation commands and shortcuts
export { 
  registerNavigationCommands,
  type NavigationCommands 
} from './navigation-commands';

// Advanced symbol search utilities
export { 
  SymbolSearcher,
  createSearchableSymbol,
  DEFAULT_SEARCH_OPTIONS,
  type SearchableSymbol,
  type SearchOptions,
  type SearchResult,
  type SearchStats
} from './symbol-search';

// Re-export types for convenience
export type {
  NavigationContext,
  SymbolLocation,
  NavigationStats
} from './navigation-provider';
