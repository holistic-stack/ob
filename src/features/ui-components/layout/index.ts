/**
 * Layout Components Export Index
 * 
 * Clean exports for CAD-style Liquid Glass Layout components
 * Following bulletproof-react architecture patterns
 */

// Main layout component
export { AppLayout } from './app-layout';

// Types and interfaces
export type {
  AppLayoutProps,
  HeaderBarProps,
  ToolbarProps,
  FooterBarProps,
  MainBodyProps,
  SplitterProps,
  TabNavigationProps,
  LayoutConfig,
  LayoutState,
  LayoutActions,
  LayoutValidation,
  TabItem,
  ToolbarAction,
  ConsoleMessage,
  ComponentId,
  FileName,
  TabId,
  LayoutResult,
  ValidationResult,
} from './types';

// Default configurations
export {
  DEFAULT_LAYOUT_CONFIG,
  DEFAULT_TAB_ITEMS,
  DEFAULT_TOOLBAR_ACTIONS,
  isValidFileName,
  isValidTabId,
  isValidComponentId,
} from './types';
