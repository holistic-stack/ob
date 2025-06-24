/**
 * Glass morphism utility functions for the Liquid Glass UI component library
 * 
 * This module provides pure functions for generating glass effect styles,
 * handling browser compatibility, and managing accessibility features.
 */

import { clsx } from 'clsx';
import type {
  GlassConfig,
  GlassTheme,
  BlurIntensity,
  ElevationLevel,
  ComponentVariant,
  ComponentSize,
  Result,
} from './types';

// ============================================================================
// Constants and Default Configurations
// ============================================================================

/**
 * Default glass morphism configuration
 */
export const DEFAULT_GLASS_CONFIG: GlassConfig = {
  blurIntensity: 'lg',
  opacity: 0.2,
  elevation: 'medium',
  enableDistortion: false,
  enableSpecularHighlights: true,
} as const;

/**
 * Glass themes for light and dark modes
 */
export const GLASS_THEMES: Record<'light' | 'dark', GlassTheme> = {
  light: {
    background: 'rgba(255, 255, 255, 0.2)',
    border: 'rgba(255, 255, 255, 0.3)',
    highlight: 'rgba(255, 255, 255, 0.75)',
    shadow: '0 6px 6px rgba(0, 0, 0, 0.2), 0 0 20px rgba(0, 0, 0, 0.1)',
  },
  dark: {
    background: 'rgba(0, 0, 0, 0.2)',
    border: 'rgba(0, 0, 0, 0.3)',
    highlight: 'rgba(255, 255, 255, 0.2)',
    shadow: '0 6px 6px rgba(255, 255, 255, 0.1), 0 0 20px rgba(255, 255, 255, 0.05)',
  },
} as const;

/**
 * Blur intensity mappings to CSS values
 */
export const BLUR_INTENSITY_MAP: Record<BlurIntensity, string> = {
  xs: '2px',
  sm: '4px',
  md: '12px',
  lg: '20px',
  xl: '40px',
} as const;

/**
 * Elevation level mappings to shadow values
 */
export const ELEVATION_MAP: Record<ElevationLevel, string> = {
  low: '0 2px 4px rgba(0, 0, 0, 0.1)',
  medium: '0 6px 6px rgba(0, 0, 0, 0.2), 0 0 20px rgba(0, 0, 0, 0.1)',
  high: '0 12px 24px rgba(0, 0, 0, 0.3), 0 0 40px rgba(0, 0, 0, 0.15)',
  floating: '0 20px 40px rgba(0, 0, 0, 0.4), 0 0 60px rgba(0, 0, 0, 0.2)',
} as const;

// ============================================================================
// Pure Utility Functions
// ============================================================================

/**
 * Generates glass effect CSS class names based on configuration
 * 
 * @param config - Glass configuration object
 * @param overLight - Whether the glass is over a light background
 * @returns CSS class names for glass effect
 */
export const generateGlassClasses = (
  config: Partial<GlassConfig> = {},
  overLight: boolean = true
): string => {
  const mergedConfig = { ...DEFAULT_GLASS_CONFIG, ...config };
  
  return clsx(
    // Base glass effect
    overLight ? 'glass-effect' : 'glass-effect-dark',
    
    // Blur intensity
    `glass-blur-${mergedConfig.blurIntensity}`,
    
    // Background opacity
    overLight 
      ? `glass-bg-${getOpacityLevel(mergedConfig.opacity)}`
      : `glass-bg-dark-${getOpacityLevel(mergedConfig.opacity)}`,
    
    // Border
    overLight ? 'glass-border' : 'glass-border-dark',
    
    // Conditional features
    mergedConfig.enableDistortion && 'glass-distortion',
    mergedConfig.enableSpecularHighlights && 'glass-specular'
  );
};

/**
 * Converts opacity value to predefined level
 * 
 * @param opacity - Opacity value between 0 and 1
 * @returns Opacity level string
 */
export const getOpacityLevel = (opacity: number): 'light' | 'medium' | 'heavy' => {
  if (opacity <= 0.15) return 'light';
  if (opacity <= 0.25) return 'medium';
  return 'heavy';
};

/**
 * Generates component size classes
 * 
 * @param size - Component size
 * @param componentType - Type of component (button, card, etc.)
 * @returns Size-specific CSS classes
 */
export const generateSizeClasses = (
  size: ComponentSize,
  componentType: string
): string => {
  const sizeMap: Record<ComponentSize, Record<string, string>> = {
    xs: {
      button: 'px-2 py-1 text-xs',
      card: 'p-2',
      input: 'px-2 py-1 text-xs',
      slider: 'h-1',
    },
    sm: {
      button: 'px-3 py-1.5 text-sm',
      card: 'p-3',
      input: 'px-3 py-1.5 text-sm',
      slider: 'h-2',
    },
    md: {
      button: 'px-4 py-2 text-base',
      card: 'p-4',
      input: 'px-4 py-2 text-base',
      slider: 'h-3',
    },
    lg: {
      button: 'px-6 py-3 text-lg',
      card: 'p-6',
      input: 'px-6 py-3 text-lg',
      slider: 'h-4',
    },
    xl: {
      button: 'px-8 py-4 text-xl',
      card: 'p-8',
      input: 'px-8 py-4 text-xl',
      slider: 'h-5',
    },
  };

  return sizeMap[size]?.[componentType] ?? sizeMap[size]?.['button'] ?? sizeMap.md['button'] ?? 'text-sm px-3 py-1.5';
};

/**
 * Generates variant-specific classes
 * 
 * @param variant - Component variant
 * @param overLight - Whether the component is over a light background
 * @returns Variant-specific CSS classes
 */
export const generateVariantClasses = (
  variant: ComponentVariant,
  overLight: boolean = true
): string => {
  const variantMap: Record<ComponentVariant, { light: string; dark: string }> = {
    primary: {
      light: 'text-white bg-blue-500/20 border-blue-300/30 hover:bg-blue-500/30',
      dark: 'text-blue-100 bg-blue-400/20 border-blue-400/30 hover:bg-blue-400/30',
    },
    secondary: {
      light: 'text-gray-700 bg-gray-200/20 border-gray-300/30 hover:bg-gray-200/30',
      dark: 'text-gray-200 bg-gray-600/20 border-gray-500/30 hover:bg-gray-600/30',
    },
    ghost: {
      light: 'text-gray-600 bg-transparent border-transparent hover:bg-gray-100/20',
      dark: 'text-gray-300 bg-transparent border-transparent hover:bg-gray-700/20',
    },
    danger: {
      light: 'text-white bg-red-500/20 border-red-300/30 hover:bg-red-500/30',
      dark: 'text-red-100 bg-red-400/20 border-red-400/30 hover:bg-red-400/30',
    },
  };

  return variantMap[variant][overLight ? 'light' : 'dark'];
};

// ============================================================================
// Browser Compatibility Functions
// ============================================================================

/**
 * Checks if the browser supports backdrop-filter
 * 
 * @returns True if backdrop-filter is supported
 */
export const supportsBackdropFilter = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  return CSS.supports('backdrop-filter', 'blur(1px)') || 
         CSS.supports('-webkit-backdrop-filter', 'blur(1px)');
};

/**
 * Checks if the browser supports SVG filters
 * 
 * @returns True if SVG filters are supported
 */
export const supportsSVGFilters = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
  
  return typeof filter.href !== 'undefined';
};

/**
 * Gets fallback styles for browsers that don't support glass effects
 * 
 * @param overLight - Whether the component is over a light background
 * @returns Fallback CSS classes
 */
export const getFallbackStyles = (overLight: boolean = true): string => {
  return clsx(
    'border border-solid',
    overLight 
      ? 'bg-white/90 border-gray-300 shadow-md'
      : 'bg-gray-800/90 border-gray-600 shadow-lg'
  );
};

// ============================================================================
// Accessibility Functions
// ============================================================================

/**
 * Checks if user prefers reduced motion
 * 
 * @returns True if user prefers reduced motion
 */
export const prefersReducedMotion = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Checks if user prefers high contrast
 * 
 * @returns True if user prefers high contrast
 */
export const prefersHighContrast = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  return window.matchMedia('(prefers-contrast: high)').matches;
};

/**
 * Generates accessibility-compliant styles
 * 
 * @param baseClasses - Base CSS classes
 * @returns Accessibility-enhanced CSS classes
 */
export const generateAccessibleStyles = (baseClasses: string): string => {
  return clsx(
    baseClasses,
    'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
    'transition-all duration-200 ease-in-out',
    prefersReducedMotion() && 'transition-none',
    prefersHighContrast() && 'contrast-more'
  );
};

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validates glass configuration
 * 
 * @param config - Glass configuration to validate
 * @returns Result with validated config or error
 */
export const validateGlassConfig = (config: Partial<GlassConfig>): Result<GlassConfig> => {
  try {
    const validatedConfig: GlassConfig = {
      blurIntensity: config.blurIntensity ?? DEFAULT_GLASS_CONFIG.blurIntensity,
      opacity: Math.max(0, Math.min(1, config.opacity ?? DEFAULT_GLASS_CONFIG.opacity)),
      elevation: config.elevation ?? DEFAULT_GLASS_CONFIG.elevation,
      enableDistortion: config.enableDistortion ?? DEFAULT_GLASS_CONFIG.enableDistortion,
      enableSpecularHighlights: config.enableSpecularHighlights ?? DEFAULT_GLASS_CONFIG.enableSpecularHighlights,
    };

    return { success: true, data: validatedConfig };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error : new Error('Invalid glass configuration') 
    };
  }
};
