/**
 * Layout Components Export Index
 *
 * Clean exports for CAD-style Liquid Glass Layout components
 * Following bulletproof-react architecture patterns
 */

// ============================================================================
// Current Layout Components (v2.0.0+)
// ============================================================================

// Main layout component - 12-column grid layout
export { GridLayout } from './grid-layout';

// ============================================================================
// Deprecated Components (Removed in v2.0.0)
// ============================================================================

// Legacy layout component (deprecated - use GridLayout instead)
// AppLayout has been removed. Use GridLayout for new implementations.
// export { AppLayout } from './app-layout'; // REMOVED in v2.0.0

// ============================================================================
// Type Exports
// ============================================================================

export type {
  // Current GridLayout types
  GridLayoutProps,

  // Active layout types
  MainBodyProps,
  SplitterProps,
  TabNavigationProps,
  LayoutConfig,
  TabItem,
  ToolbarAction,
  ConsoleMessage,
  ComponentId,
  FileName,
  TabId,
  LayoutResult,
  ValidationResult,
} from './types';

// Type guards and validation functions
export {
  isValidFileName,
  isValidTabId,
  isValidComponentId,
} from './types';
