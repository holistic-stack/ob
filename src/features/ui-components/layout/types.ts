/**
 * Layout Component Types
 * 
 * TypeScript interfaces and types for CAD-style Liquid Glass Layout components
 * Following strict typing requirements with branded types and Result patterns
 */

import type { ReactNode } from 'react';
import type { BaseComponentProps, GlassConfig } from '../shared/types';

// ============================================================================
// Branded Types for Type Safety
// ============================================================================

export type ComponentId = string & { readonly __brand: 'ComponentId' };
export type FileName = string & { readonly __brand: 'FileName' };
export type TabId = string & { readonly __brand: 'TabId' };

// ============================================================================
// Result Types for Error Handling
// ============================================================================

export type LayoutResult<T> = 
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly error: string };

export type ValidationResult = LayoutResult<boolean>;

// ============================================================================
// Layout Configuration Types
// ============================================================================

export interface LayoutConfig {
  readonly enableSplitter: boolean;
  readonly defaultSplitRatio: number;
  readonly minPanelWidth: number;
  readonly enableResponsive: boolean;
}

export interface PanelConfig {
  readonly id: ComponentId;
  readonly width: string;
  readonly minWidth?: string;
  readonly maxWidth?: string;
  readonly resizable: boolean;
}

// ============================================================================
// Tab Navigation Types
// ============================================================================

export interface TabItem {
  readonly id: TabId;
  readonly label: string;
  readonly active: boolean;
  readonly disabled?: boolean;
  readonly icon?: ReactNode;
}

export interface TabNavigationProps extends BaseComponentProps {
  readonly tabs: readonly TabItem[];
  readonly activeTabId: TabId;
  readonly onTabChange: (tabId: TabId) => void;
  readonly glassConfig?: GlassConfig;
}

// ============================================================================
// Header Bar Types
// ============================================================================

export interface HeaderBarProps extends BaseComponentProps {
  readonly fileName: FileName;
  readonly onFileNameChange: (newName: FileName) => void;
  readonly logoContent?: ReactNode;
  readonly userAvatarContent?: ReactNode;
  readonly glassConfig?: GlassConfig;
}

// ============================================================================
// Toolbar Types
// ============================================================================

export interface ToolbarAction {
  readonly id: ComponentId;
  readonly label: string;
  readonly variant: 'primary' | 'secondary' | 'ghost';
  readonly disabled?: boolean;
  readonly loading?: boolean;
  readonly icon?: ReactNode;
  readonly onClick: () => void;
}

export interface ToolbarProps extends BaseComponentProps {
  readonly tabs: readonly TabItem[];
  readonly activeTabId: TabId;
  readonly onTabChange: (tabId: TabId) => void;
  readonly actions: readonly ToolbarAction[];
  readonly glassConfig?: GlassConfig;
}

// ============================================================================
// Footer Bar Types
// ============================================================================

export interface ConsoleMessage {
  readonly id: ComponentId;
  readonly type: 'debug' | 'info' | 'warning' | 'error';
  readonly message: string;
  readonly timestamp: Date;
  readonly source?: string;
}

export interface FooterBarProps extends BaseComponentProps {
  readonly messages: readonly ConsoleMessage[];
  readonly expanded: boolean;
  readonly onToggleExpanded: () => void;
  readonly maxMessages?: number;
  readonly glassConfig?: GlassConfig;
}

// ============================================================================
// Main Layout Types
// ============================================================================

export interface SplitterProps extends BaseComponentProps {
  readonly orientation: 'horizontal' | 'vertical';
  readonly initialPosition: number;
  readonly minPosition: number;
  readonly maxPosition: number;
  readonly onPositionChange: (position: number) => void;
  readonly glassConfig?: GlassConfig;
}

export interface MainBodyProps extends BaseComponentProps {
  readonly leftPanel: ReactNode;
  readonly rightPanel: ReactNode;
  readonly splitterConfig?: Partial<SplitterProps>;
  readonly layoutConfig?: Partial<LayoutConfig>;
}

// ============================================================================
// App Layout Types
// ============================================================================

export interface AppLayoutProps extends BaseComponentProps {
  readonly fileName: FileName;
  readonly onFileNameChange: (newName: FileName) => void;
  readonly onRender: () => void;
  readonly onMoreOptions: () => void;
  readonly headerConfig?: Partial<HeaderBarProps>;
  readonly toolbarConfig?: Partial<ToolbarProps>;
  readonly footerConfig?: Partial<FooterBarProps>;
  readonly layoutConfig?: Partial<LayoutConfig>;
  readonly glassConfig?: GlassConfig;
  readonly children?: ReactNode;
}

// ============================================================================
// Layout State Types
// ============================================================================

export interface LayoutState {
  readonly activeTabId: TabId;
  readonly splitPosition: number;
  readonly footerExpanded: boolean;
  readonly consoleMessages: readonly ConsoleMessage[];
  readonly fileName: FileName;
}

export interface LayoutActions {
  readonly setActiveTab: (tabId: TabId) => void;
  readonly setSplitPosition: (position: number) => void;
  readonly toggleFooter: () => void;
  readonly addConsoleMessage: (message: Omit<ConsoleMessage, 'id' | 'timestamp'>) => void;
  readonly clearConsoleMessages: () => void;
  readonly setFileName: (name: FileName) => void;
}

// ============================================================================
// Validation Types
// ============================================================================

export interface LayoutValidation {
  readonly validateFileName: (name: string) => ValidationResult;
  readonly validateSplitPosition: (position: number) => ValidationResult;
  readonly validateTabId: (tabId: string) => ValidationResult;
  readonly validateLayoutConfig: (config: Partial<LayoutConfig>) => ValidationResult;
}

// ============================================================================
// Default Values
// ============================================================================

export const DEFAULT_LAYOUT_CONFIG: LayoutConfig = {
  enableSplitter: true,
  defaultSplitRatio: 0.5,
  minPanelWidth: 300,
  enableResponsive: true,
} as const;

export const DEFAULT_TAB_ITEMS: readonly TabItem[] = [
  {
    id: 'openscad-code' as TabId,
    label: 'OpenSCAD Code',
    active: true,
  },
  {
    id: 'ast-tree' as TabId,
    label: 'AST Tree Representation',
    active: false,
  },
] as const;

export const DEFAULT_TOOLBAR_ACTIONS: readonly ToolbarAction[] = [
  {
    id: 'render' as ComponentId,
    label: 'Render',
    variant: 'primary',
    onClick: () => {},
  },
  {
    id: 'more-options' as ComponentId,
    label: 'More Options',
    variant: 'secondary',
    onClick: () => {},
  },
] as const;

// ============================================================================
// Type Guards
// ============================================================================

export const isValidFileName = (value: string): value is FileName => {
  return typeof value === 'string' && value.length > 0 && value.length <= 255;
};

export const isValidTabId = (value: string): value is TabId => {
  return typeof value === 'string' && value.length > 0;
};

export const isValidComponentId = (value: string): value is ComponentId => {
  return typeof value === 'string' && value.length > 0;
};
