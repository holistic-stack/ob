/**
 * Monaco Code Editor Glass Morphism Styling Utilities
 * 
 * Reusable glass styling utilities following DRY and SRP principles
 * Provides authentic Liquid Glass UI effects for Monaco Editor components
 */

import { clsx } from 'clsx';
import { generateGlassClasses, type GlassConfig } from '../../shared';
import type { ComponentSize, ComponentVariant } from '../../shared/types';

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * Monaco Editor specific glass configuration
 */
export interface MonacoGlassConfig extends GlassConfig {
  readonly editorTheme: 'dark' | 'light';
  readonly enableFocusRing: boolean;
  readonly enableTransitions: boolean;
}

/**
 * Monaco Editor glass styling options
 */
export interface MonacoGlassOptions {
  readonly size?: ComponentSize;
  readonly variant?: ComponentVariant;
  readonly disabled?: boolean;
  readonly readOnly?: boolean;
  readonly hasErrors?: boolean;
  readonly isActive?: boolean;
}

// ============================================================================
// Default Configurations
// ============================================================================

/**
 * Default glass configuration for Monaco Editor
 */
export const DEFAULT_MONACO_GLASS_CONFIG: MonacoGlassConfig = {
  blurIntensity: 'sm',
  opacity: 0.2,
  elevation: 'medium',
  enableDistortion: false,
  enableSpecularHighlights: true,
  editorTheme: 'dark',
  enableFocusRing: true,
  enableTransitions: true,
} as const;

// ============================================================================
// Core Glass Styling Functions
// ============================================================================

/**
 * Generate base glass morphism classes for Monaco Editor container
 * 
 * @param config - Glass configuration options
 * @returns CSS class string with base glass effects
 */
export const generateMonacoBaseGlass = (
  config: Partial<MonacoGlassConfig> = {}
): string => {
  const mergedConfig = { ...DEFAULT_MONACO_GLASS_CONFIG, ...config };
  
  return clsx(
    // Base glass effect - exact requirements
    'bg-black/20',
    'backdrop-blur-sm',
    'border',
    'border-white/50',
    'rounded-lg',
    
    // Positioning and overflow
    'relative',
    'overflow-hidden',
    
    // Complex shadow system - three layers
    'shadow-[inset_0_1px_0px_rgba(255,255,255,0.75),0_0_9px_rgba(0,0,0,0.2),0_3px_8px_rgba(0,0,0,0.15)]'
  );
};

/**
 * Generate gradient pseudo-element classes for refraction effects
 * 
 * @returns CSS class string with gradient pseudo-elements
 */
export const generateMonacoGradientEffects = (): string => {
  return clsx(
    // Before pseudo-element - top-left to bottom-right gradient
    'before:absolute',
    'before:inset-0',
    'before:rounded-lg',
    'before:bg-gradient-to-br',
    'before:from-white/60',
    'before:via-transparent',
    'before:to-transparent',
    'before:opacity-70',
    'before:pointer-events-none',
    
    // After pseudo-element - top-right to bottom-left gradient
    'after:absolute',
    'after:inset-0',
    'after:rounded-lg',
    'after:bg-gradient-to-tl',
    'after:from-white/30',
    'after:via-transparent',
    'after:to-transparent',
    'after:opacity-50',
    'after:pointer-events-none'
  );
};

/**
 * Generate focus and interaction classes
 * 
 * @param config - Glass configuration options
 * @returns CSS class string with focus and interaction effects
 */
export const generateMonacoInteractionEffects = (
  config: Partial<MonacoGlassConfig> = {}
): string => {
  const mergedConfig = { ...DEFAULT_MONACO_GLASS_CONFIG, ...config };
  
  return clsx(
    // Focus ring with glass morphism integration
    mergedConfig.enableFocusRing && [
      'focus-within:ring-2',
      'focus-within:ring-blue-500',
      'focus-within:ring-offset-2',
    ],
    
    // Smooth transitions
    mergedConfig.enableTransitions && [
      'transition-all',
      'duration-200',
      'ease-in-out',
    ]
  );
};

/**
 * Generate content layer classes ensuring proper z-index stacking
 * 
 * @returns CSS class string for content layer
 */
export const generateMonacoContentLayer = (): string => {
  return clsx(
    'relative',
    'z-10',
    'h-full',
    'w-full'
  );
};

// ============================================================================
// Composite Glass Styling Functions
// ============================================================================

/**
 * Generate complete Monaco Editor glass morphism classes
 * 
 * @param config - Glass configuration options
 * @param options - Additional styling options
 * @returns Complete CSS class string with all glass effects
 */
export const generateMonacoGlassClasses = (
  config: Partial<MonacoGlassConfig> = {},
  options: MonacoGlassOptions = {}
): string => {
  const mergedConfig = { ...DEFAULT_MONACO_GLASS_CONFIG, ...config };
  
  return clsx(
    // Base glass morphism
    generateMonacoBaseGlass(mergedConfig),
    
    // Gradient pseudo-elements
    generateMonacoGradientEffects(),
    
    // Focus and interaction effects
    generateMonacoInteractionEffects(mergedConfig),
    
    // State-based modifications
    options.disabled && 'opacity-50 cursor-not-allowed',
    options.readOnly && 'bg-gray-900/20',
    options.hasErrors && 'border-red-500/50 ring-1 ring-red-500/20',
    options.isActive && 'ring-2 ring-blue-500/30'
  );
};

/**
 * Generate glass classes for Monaco Editor status indicators
 * 
 * @param type - Type of status indicator
 * @returns CSS class string for status indicators
 */
export const generateMonacoStatusGlass = (
  type: 'parsing' | 'success' | 'error' | 'warning'
): string => {
  const baseClasses = clsx(
    'backdrop-blur-sm',
    'border',
    'rounded-lg',
    'p-2'
  );
  
  switch (type) {
    case 'parsing':
      return clsx(baseClasses, 'bg-blue-900/80', 'border-blue-500/50');
    case 'success':
      return clsx(baseClasses, 'bg-green-900/80', 'border-green-500/50');
    case 'error':
      return clsx(baseClasses, 'bg-red-900/80', 'border-red-500/50');
    case 'warning':
      return clsx(baseClasses, 'bg-yellow-900/80', 'border-yellow-500/50');
    default:
      return baseClasses;
  }
};

// ============================================================================
// 8px Grid System Utilities
// ============================================================================

/**
 * Generate 8px grid compliant sizing classes
 * 
 * @param size - Component size
 * @returns CSS class string with 8px grid compliant sizing
 */
export const generateMonacoSizing = (size: ComponentSize = 'md'): string => {
  switch (size) {
    case 'xs':
      return clsx('min-h-[32px]'); // 4 * 8px = 32px
    case 'sm':
      return clsx('min-h-[40px]'); // 5 * 8px = 40px
    case 'md':
      return clsx('min-h-[48px]'); // 6 * 8px = 48px (WCAG AA compliant)
    case 'lg':
      return clsx('min-h-[56px]'); // 7 * 8px = 56px
    case 'xl':
      return clsx('min-h-[64px]'); // 8 * 8px = 64px
    default:
      return clsx('min-h-[48px]'); // Default to WCAG AA compliant size
  }
};

// ============================================================================
// Validation and Utilities
// ============================================================================

/**
 * Validate Monaco glass configuration
 * 
 * @param config - Configuration to validate
 * @returns Validation result
 */
export const validateMonacoGlassConfig = (
  config: Partial<MonacoGlassConfig>
): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (config.opacity !== undefined && (config.opacity < 0 || config.opacity > 1)) {
    errors.push('Opacity must be between 0 and 1');
  }
  
  if (config.editorTheme && !['dark', 'light'].includes(config.editorTheme)) {
    errors.push('Editor theme must be "dark" or "light"');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Create Monaco glass configuration with validation
 * 
 * @param config - Configuration options
 * @returns Validated configuration or default
 */
export const createMonacoGlassConfig = (
  config: Partial<MonacoGlassConfig> = {}
): MonacoGlassConfig => {
  const validation = validateMonacoGlassConfig(config);
  
  if (!validation.valid) {
    console.warn('[MonacoGlassStyles] Invalid configuration:', validation.errors);
    return DEFAULT_MONACO_GLASS_CONFIG;
  }
  
  return { ...DEFAULT_MONACO_GLASS_CONFIG, ...config };
};
