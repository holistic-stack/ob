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
// Grid Layout Types
// ============================================================================

/**
 * Props for the GridLayout component
 */
export interface GridLayoutProps {
  readonly className?: string;
  readonly 'data-testid'?: string;
  readonly 'aria-label'?: string;
}

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
