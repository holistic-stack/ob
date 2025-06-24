/**
 * Shared types for the Liquid Glass UI component library
 * 
 * This module defines common types, interfaces, and branded types used across
 * all UI components to ensure type safety and consistency.
 */

import React, { ReactNode, CSSProperties } from 'react';

// ============================================================================
// Branded Types for Type Safety
// ============================================================================

/**
 * Branded type for component sizes to prevent mixing up similar string values
 */
export type ComponentSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/**
 * Branded type for component variants to ensure consistent theming
 */
export type ComponentVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

/**
 * Branded type for elevation levels in glass morphism design
 */
export type ElevationLevel = 'low' | 'medium' | 'high' | 'floating';

/**
 * Branded type for glass blur intensity levels
 */
export type BlurIntensity = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

// ============================================================================
// Result/Either Types for Functional Error Handling
// ============================================================================

/**
 * Result type for operations that can succeed or fail
 * Enables functional error handling without exceptions
 */
export type Result<T, E = Error> =
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly error: E };

/**
 * Option type for values that may or may not exist
 * Safer alternative to null/undefined
 */
export type Option<T> =
  | { readonly some: true; readonly value: T }
  | { readonly some: false };

// ============================================================================
// Component State Types
// ============================================================================

/**
 * Standard component states for interactive elements
 */
export type ComponentState = 'default' | 'hover' | 'active' | 'disabled' | 'loading' | 'focus';

/**
 * Validation states for form components
 */
export type ValidationState = 'default' | 'success' | 'error' | 'warning';

// ============================================================================
// Glass Morphism Configuration
// ============================================================================

/**
 * Configuration for glass morphism effects
 */
export interface GlassConfig {
  readonly blurIntensity: BlurIntensity;
  readonly opacity: number;
  readonly elevation: ElevationLevel;
  readonly enableDistortion: boolean;
  readonly enableSpecularHighlights: boolean;
}

/**
 * Glass theme configuration for light/dark modes
 */
export interface GlassTheme {
  readonly background: string;
  readonly border: string;
  readonly highlight: string;
  readonly shadow: string;
}

// ============================================================================
// Base Component Props
// ============================================================================

/**
 * Base props that all UI components should extend
 */
export interface BaseComponentProps {
  readonly className?: string;
  readonly style?: CSSProperties;
  readonly children?: ReactNode;
  readonly disabled?: boolean;
  readonly 'data-testid'?: string;
}

/**
 * Props for components that support glass morphism effects
 */
export interface GlassComponentProps extends BaseComponentProps {
  readonly variant?: ComponentVariant;
  readonly size?: ComponentSize;
  readonly glassConfig?: Partial<GlassConfig>;
  readonly overLight?: boolean;
}

/**
 * Props for interactive components (buttons, inputs, etc.)
 */
export interface InteractiveComponentProps extends GlassComponentProps {
  readonly onClick?: () => void;
  readonly onFocus?: () => void;
  readonly onBlur?: () => void;
  readonly state?: ComponentState;
}

// ============================================================================
// Animation and Transition Types
// ============================================================================

/**
 * Animation configuration for liquid glass effects
 */
export interface AnimationConfig {
  readonly duration: number;
  readonly easing: string;
  readonly delay?: number;
  readonly respectReducedMotion: boolean;
}

/**
 * Transition states for component animations
 */
export type TransitionState = 'entering' | 'entered' | 'exiting' | 'exited';

// ============================================================================
// Accessibility Types
// ============================================================================

/**
 * ARIA attributes for accessibility compliance
 */
export interface AriaProps {
  readonly 'aria-label'?: string;
  readonly 'aria-labelledby'?: string;
  readonly 'aria-describedby'?: string;
  readonly 'aria-expanded'?: boolean;
  readonly 'aria-pressed'?: boolean;
  readonly 'aria-disabled'?: boolean;
  readonly role?: string;
}

/**
 * Focus management configuration
 */
export interface FocusConfig {
  readonly autoFocus?: boolean;
  readonly focusable?: boolean;
  readonly tabIndex?: number;
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Deep readonly utility type for immutable data structures
 */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

/**
 * Extract component props from a React component type
 */
export type ComponentProps<T> = T extends React.ComponentType<infer P> ? P : never;

/**
 * Make specific properties optional while keeping others required
 */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Make specific properties required while keeping others optional
 */
export type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

// ============================================================================
// Factory Functions for Type Safety
// ============================================================================

/**
 * Creates a successful Result
 */
export const Ok = <T>(data: T): Result<T, never> => ({ success: true, data });

/**
 * Creates a failed Result
 */
export const Err = <E>(error: E): Result<never, E> => ({ success: false, error });

/**
 * Creates a Some Option
 */
export const Some = <T>(value: T): Option<T> => ({ some: true, value });

/**
 * Creates a None Option
 */
export const None = <T>(): Option<T> => ({ some: false });

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard for successful Results
 */
export const isOk = <T, E>(result: Result<T, E>): result is { success: true; data: T } =>
  result.success;

/**
 * Type guard for failed Results
 */
export const isErr = <T, E>(result: Result<T, E>): result is { success: false; error: E } =>
  !result.success;

/**
 * Type guard for Some Options
 */
export const isSome = <T>(option: Option<T>): option is { some: true; value: T } =>
  option.some;

/**
 * Type guard for None Options
 */
export const isNone = <T>(option: Option<T>): option is { some: false } =>
  !option.some;
