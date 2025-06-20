/**
 * Liquid Glass Card Component
 * 
 * A card component implementing Apple's Liquid Glass design system with
 * glass morphism effects, multiple variants, and accessibility features.
 */

import React, { forwardRef } from 'react';
import {
  clsx,
  generateGlassClasses,
  generateAccessibleStyles,
  validateGlassConfig,
  type GlassComponentProps,
  type ElevationLevel,
  type GlassConfig,
  type AriaProps,
} from '../shared';

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * Card variant types
 */
export type CardVariant = 'default' | 'bordered' | 'elevated' | 'interactive';

/**
 * Card padding levels
 */
export type CardPadding = 'none' | 'sm' | 'md' | 'lg' | 'xl';

/**
 * HTML elements that can be used as card containers
 */
export type CardElement = 'div' | 'section' | 'article' | 'aside' | 'main';

/**
 * Props for the Card component
 */
export interface CardProps extends GlassComponentProps, AriaProps {
  /** Card content */
  readonly children: React.ReactNode;
  
  /** Card variant */
  readonly variant?: CardVariant;
  
  /** Elevation level for shadow effects */
  readonly elevation?: ElevationLevel;
  
  /** Padding level */
  readonly padding?: CardPadding;
  
  /** HTML element to render as */
  readonly as?: CardElement;
  
  /** Glass morphism configuration */
  readonly glassConfig?: Partial<GlassConfig>;
  
  /** Whether the card is over a light background */
  readonly overLight?: boolean;
  
  /** Click handler (only works with interactive variant) */
  readonly onClick?: () => void;
  
  /** Focus handler */
  readonly onFocus?: () => void;
  
  /** Blur handler */
  readonly onBlur?: () => void;
  
  /** Custom CSS class name */
  readonly className?: string;
  
  /** Custom inline styles */
  readonly style?: React.CSSProperties;
  
  /** Test ID for testing */
  readonly 'data-testid'?: string;
  
  /** Custom role for accessibility */
  readonly role?: string;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Generates padding classes based on padding level
 */
const generatePaddingClasses = (padding: CardPadding): string => {
  const paddingMap: Record<CardPadding, string> = {
    none: 'p-0',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
    xl: 'p-8',
  };
  
  return paddingMap[padding];
};

/**
 * Generates variant-specific classes
 */
const generateVariantClasses = (variant: CardVariant, overLight: boolean): string => {
  const baseClasses = 'rounded-lg transition-all duration-200 ease-in-out';
  
  switch (variant) {
    case 'bordered':
      return clsx(
        baseClasses,
        'border-2',
        overLight 
          ? 'border-gray-200 bg-white/50' 
          : 'border-gray-700 bg-gray-800/50'
      );
      
    case 'elevated':
      return clsx(
        baseClasses,
        'shadow-lg hover:shadow-xl',
        overLight 
          ? 'bg-white/80 border border-gray-100' 
          : 'bg-gray-800/80 border border-gray-700'
      );
      
    case 'interactive':
      return clsx(
        baseClasses,
        'cursor-pointer',
        'hover:scale-105 hover:shadow-lg',
        'active:scale-95',
        'transform-gpu' // Enable GPU acceleration
      );
      
    case 'default':
    default:
      return baseClasses;
  }
};

/**
 * Generates elevation-specific shadow classes
 */
const generateElevationClasses = (elevation: ElevationLevel): string => {
  const elevationMap: Record<ElevationLevel, string> = {
    low: 'shadow-sm',
    medium: 'shadow-md',
    high: 'shadow-lg',
    floating: 'shadow-2xl',
  };
  
  return elevationMap[elevation];
};

// ============================================================================
// Card Component
// ============================================================================

/**
 * Liquid Glass Card component with glass morphism effects
 * 
 * @example
 * ```tsx
 * <Card variant="interactive" elevation="medium" onClick={() => console.log('clicked')}>
 *   <h2>Card Title</h2>
 *   <p>Card content goes here</p>
 * </Card>
 * ```
 */
export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      children,
      variant = 'default',
      elevation = 'medium',
      padding = 'md',
      as: Element = 'div',
      glassConfig,
      overLight = true,
      onClick,
      onFocus,
      onBlur,
      className,
      style,
      'data-testid': dataTestId = 'card',
      'aria-label': ariaLabel,
      'aria-labelledby': ariaLabelledBy,
      'aria-describedby': ariaDescribedBy,
      'aria-expanded': ariaExpanded,
      'aria-pressed': ariaPressed,
      role,
      ...rest
    },
    ref
  ) => {
    // ========================================================================
    // State and Configuration
    // ========================================================================
    
    const isInteractive = variant === 'interactive';
    
    // Validate and merge glass configuration
    const glassConfigResult = validateGlassConfig(glassConfig || {});
    const finalGlassConfig = glassConfigResult.success 
      ? glassConfigResult.data 
      : validateGlassConfig({}).data;

    // ========================================================================
    // Event Handlers
    // ========================================================================
    
    const handleClick = () => {
      if (isInteractive && onClick) {
        onClick();
      }
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (isInteractive && (event.key === 'Enter' || event.key === ' ')) {
        event.preventDefault();
        handleClick();
      }
    };

    const handleFocus = () => {
      if (isInteractive && onFocus) {
        onFocus();
      }
    };

    const handleBlur = () => {
      if (isInteractive && onBlur) {
        onBlur();
      }
    };

    // ========================================================================
    // Style Generation
    // ========================================================================
    
    const glassClasses = generateGlassClasses(finalGlassConfig, overLight);
    const variantClasses = generateVariantClasses(variant, overLight);
    const paddingClasses = generatePaddingClasses(padding);
    const elevationClasses = generateElevationClasses(elevation);
    
    const cardClasses = generateAccessibleStyles(
      clsx(
        // Base card styles
        'relative overflow-hidden',
        
        // Glass morphism effects (only for default variant)
        variant === 'default' && glassClasses,
        
        // Variant-specific styles
        variantClasses,
        
        // Padding
        paddingClasses,
        
        // Elevation
        elevationClasses,
        
        // Interactive styles
        isInteractive && [
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
          'select-none', // Prevent text selection on interactive cards
        ],
        
        // Custom className
        className
      )
    );

    // ========================================================================
    // Accessibility Props
    // ========================================================================
    
    const accessibilityProps = {
      ...(isInteractive && {
        role: role || 'button',
        tabIndex: 0,
        onKeyDown: handleKeyDown,
        onFocus: handleFocus,
        onBlur: handleBlur,
      }),
      ...(ariaLabel && { 'aria-label': ariaLabel }),
      ...(ariaLabelledBy && { 'aria-labelledby': ariaLabelledBy }),
      ...(ariaDescribedBy && { 'aria-describedby': ariaDescribedBy }),
      ...(ariaExpanded !== undefined && { 'aria-expanded': ariaExpanded }),
      ...(ariaPressed !== undefined && { 'aria-pressed': ariaPressed }),
      ...(role && !isInteractive && { role }),
    };

    // ========================================================================
    // Render
    // ========================================================================
    
    return (
      <Element
        ref={ref}
        className={cardClasses}
        style={style}
        onClick={isInteractive ? handleClick : undefined}
        data-testid={dataTestId}
        {...accessibilityProps}
        {...rest}
      >
        {children}
      </Element>
    );
  }
);

Card.displayName = 'Card';

// ============================================================================
// Default Export
// ============================================================================

export default Card;
