import type React from 'react';
/**
 * Common Types for OpenSCAD 3D Visualization Application
 * 
 * Shared type definitions used across all features following
 * functional programming patterns and immutable data structures.
 */

import type { ComponentId, Brand } from './result.types';

/**
 * Application-wide configuration types
 */
export interface AppConfig {
  readonly debounceMs: number;
  readonly enableAutoSave: boolean;
  readonly enableRealTimeParsing: boolean;
  readonly enableRealTimeRendering: boolean;
  readonly theme: 'light' | 'dark' | 'auto';
  readonly performance: PerformanceConfig;
}

export interface PerformanceConfig {
  readonly enableMetrics: boolean;
  readonly maxRenderTime: number;
  readonly enableWebGL2: boolean;
  readonly enableHardwareAcceleration: boolean;
}

/**
 * Editor-related types
 */
export interface EditorPosition {
  readonly line: number;
  readonly column: number;
}

export interface EditorSelection {
  readonly start: number;
  readonly end: number;
}

export interface EditorState {
  readonly code: string;
  readonly cursorPosition: EditorPosition;
  readonly selection: EditorSelection | null;
  readonly isDirty: boolean;
  readonly lastSaved: Date | null;
}

/**
 * 3D Scene types
 */
export interface Camera3D {
  readonly position: readonly [number, number, number];
  readonly target: readonly [number, number, number];
  readonly zoom: number;
}

export interface SceneState {
  readonly isRendering: boolean;
  readonly renderErrors: ReadonlyArray<string>;
  readonly lastRendered: Date | null;
  readonly camera: Camera3D;
}

/**
 * File system types
 */
export type FileId = Brand<string, 'FileId'>;
export type FilePath = Brand<string, 'FilePath'>;

export interface FileInfo {
  readonly id: FileId;
  readonly path: FilePath;
  readonly name: string;
  readonly size: number;
  readonly lastModified: Date;
  readonly type: 'file' | 'directory';
}

/**
 * Event types
 */
export interface BaseEvent {
  readonly timestamp: Date;
  readonly source: ComponentId;
}

export interface CodeChangeEvent extends BaseEvent {
  readonly type: 'code-change';
  readonly code: string;
  readonly position: EditorPosition;
}

export interface ParseEvent extends BaseEvent {
  readonly type: 'parse';
  readonly success: boolean;
  readonly duration: number;
  readonly nodeCount?: number;
}

export interface RenderEvent extends BaseEvent {
  readonly type: 'render';
  readonly success: boolean;
  readonly duration: number;
  readonly meshCount?: number;
}

export type AppEvent = CodeChangeEvent | ParseEvent | RenderEvent;

/**
 * Logging types
 */
export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

export interface LogEntry {
  readonly level: LogLevel;
  readonly message: string;
  readonly timestamp: Date;
  readonly component: string;
  readonly data?: unknown;
}

/**
 * Validation types
 */
export interface ValidationRule<T> {
  readonly name: string;
  readonly validate: (value: T) => string | null;
}

export interface ValidationSchema<T> {
  readonly rules: ReadonlyArray<ValidationRule<T>>;
}

/**
 * API types
 */
export interface ApiResponse<T> {
  readonly data: T;
  readonly status: number;
  readonly headers: Record<string, string>;
}

export interface ApiError {
  readonly status: number;
  readonly message: string;
  readonly code?: string;
  readonly details?: unknown;
}

/**
 * Utility types for React components
 */
export interface BaseComponentProps {
  readonly className?: string;
  readonly 'data-testid'?: string;
  readonly 'aria-label'?: string;
}

export interface InteractiveComponentProps extends BaseComponentProps {
  readonly disabled?: boolean;
  readonly onClick?: () => void;
  readonly onFocus?: () => void;
  readonly onBlur?: () => void;
}

/**
 * Glass morphism component types
 */
export type GlassVariant = 'light' | 'medium' | 'heavy' | 'dark';
export type GlassSize = 'sm' | 'md' | 'lg';

export interface GlassComponentProps extends BaseComponentProps {
  readonly variant?: GlassVariant;
  readonly size?: GlassSize;
}

/**
 * Layout types
 */
export type GridColumns = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

export interface GridLayoutProps extends BaseComponentProps {
  readonly columns?: GridColumns;
  readonly gap?: number;
  readonly children: React.ReactNode;
}

/**
 * Theme types
 */
export interface ThemeColors {
  readonly primary: string;
  readonly secondary: string;
  readonly background: string;
  readonly foreground: string;
  readonly border: string;
  readonly glass: {
    readonly light: string;
    readonly medium: string;
    readonly heavy: string;
    readonly border: string;
  };
}

export interface Theme {
  readonly name: string;
  readonly colors: ThemeColors;
  readonly spacing: Record<string, string>;
  readonly borderRadius: Record<string, string>;
}

/**
 * Performance monitoring types
 */
export interface PerformanceMetrics {
  readonly renderTime: number;
  readonly parseTime: number;
  readonly memoryUsage: number;
  readonly frameRate: number;
}

export interface PerformanceThresholds {
  readonly maxRenderTime: number;
  readonly maxParseTime: number;
  readonly maxMemoryUsage: number;
  readonly minFrameRate: number;
}
