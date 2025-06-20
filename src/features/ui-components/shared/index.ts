/**
 * Shared utilities and types for the Liquid Glass UI component library
 * 
 * This module exports all shared functionality including types, utilities,
 * and constants used across the component library.
 */

// Export all types
export type {
  ComponentSize,
  ComponentVariant,
  ElevationLevel,
  BlurIntensity,
  Result,
  Option,
  ComponentState,
  ValidationState,
  GlassConfig,
  GlassTheme,
  BaseComponentProps,
  GlassComponentProps,
  InteractiveComponentProps,
  AnimationConfig,
  TransitionState,
  AriaProps,
  FocusConfig,
  DeepReadonly,
  ComponentProps,
  PartialBy,
  RequiredBy,
} from './types';

// Export type factory functions
export {
  Ok,
  Err,
  Some,
  None,
  isOk,
  isErr,
  isSome,
  isNone,
} from './types';

// Export all glass utilities
export {
  generateGlassClasses,
  getOpacityLevel,
  generateSizeClasses,
  generateVariantClasses,
  supportsBackdropFilter,
  supportsSVGFilters,
  getFallbackStyles,
  prefersReducedMotion,
  prefersHighContrast,
  generateAccessibleStyles,
  validateGlassConfig,
  DEFAULT_GLASS_CONFIG,
  GLASS_THEMES,
  BLUR_INTENSITY_MAP,
  ELEVATION_MAP,
} from './glass-utils';

// Re-export clsx for convenience
export { clsx } from 'clsx';
