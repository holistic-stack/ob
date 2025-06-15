/**
 * @file Shared UI Components Index
 * 
 * Central export point for all shared UI components.
 * Provides a clean API for importing components throughout the application.
 * 
 * @author Luciano Júnior
 * @date June 2025
 */

// Button components
export { Button, ButtonGroup } from './button/button';
export type { ButtonProps, ButtonVariant, ButtonSize } from './button/button';

// Icon components
export { Icon, iconRegistry } from './icon/icon';
export type { IconProps, IconName, IconSize, IconColor } from './icon/icon-types';

// Loading components
export { LoadingSpinner } from './loading-spinner/loading-spinner';
export type { LoadingSpinnerProps, LoadingSpinnerVariant, LoadingSpinnerSize } from './loading-spinner/loading-spinner';

// Re-export all types for convenience
export type {
  // Button types
  ButtonVariant,
  ButtonSize,
  ButtonProps,
  
  // Icon types
  IconName,
  IconSize,
  IconColor,
  IconProps,
  
  // Loading spinner types
  LoadingSpinnerVariant,
  LoadingSpinnerSize,
  LoadingSpinnerProps,
};
