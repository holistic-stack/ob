/**
 * Liquid Glass Button Component
 * 
 * A button component implementing Apple's Liquid Glass design system with
 * glass morphism effects, accessibility features, and multiple variants.
 */

import React, { forwardRef } from 'react';
import {
  clsx,
  generateGlassClasses,
  generateSizeClasses,
  generateVariantClasses,
  generateAccessibleStyles,
  validateGlassConfig,
  type InteractiveComponentProps,
  type ComponentSize,
  type ComponentVariant,
  type GlassConfig,
  type AriaProps,
} from '../shared';

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * Props for the Button component
 */
export interface ButtonProps extends InteractiveComponentProps, AriaProps {
  /** Button content */
  readonly children: React.ReactNode;
  
  /** Button variant */
  readonly variant?: ComponentVariant;
  
  /** Button size */
  readonly size?: ComponentSize;
  
  /** Whether the button is in loading state */
  readonly loading?: boolean;
  
  /** Glass morphism configuration */
  readonly glassConfig?: Partial<GlassConfig>;
  
  /** Whether the button is over a light background */
  readonly overLight?: boolean;
  
  /** Click handler */
  readonly onClick?: () => void;
  
  /** Focus handler */
  readonly onFocus?: () => void;
  
  /** Blur handler */
  readonly onBlur?: () => void;
  
  /** Whether the button is disabled */
  readonly disabled?: boolean;
  
  /** Custom CSS class name */
  readonly className?: string;
  
  /** Custom inline styles */
  readonly style?: React.CSSProperties;
  
  /** Test ID for testing */
  readonly 'data-testid'?: string;
}

// ============================================================================
// Loading Indicator Component
// ============================================================================

/**
 * Loading indicator for button loading state
 */
const LoadingIndicator: React.FC = () => (
  <div
    data-testid="button-loading"
    className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
    role="status"
    aria-label="Loading"
  />
);

// ============================================================================
// Button Component
// ============================================================================

/**
 * Liquid Glass Button component with glass morphism effects
 * 
 * @example
 * ```tsx
 * <Button variant="primary" size="md" onClick={() => console.log('clicked')}>
 *   Click me
 * </Button>
 * ```
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      loading = false,
      glassConfig,
      overLight = true,
      onClick,
      onFocus,
      onBlur,
      disabled = false,
      className,
      style,
      'data-testid': dataTestId,
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
    
    const isDisabled = disabled || loading;
    
    // Validate and merge glass configuration
    const glassConfigResult = validateGlassConfig(glassConfig || {});
    const finalGlassConfig = glassConfigResult.success 
      ? glassConfigResult.data 
      : validateGlassConfig({}).data;

    // ========================================================================
    // Event Handlers
    // ========================================================================
    
    const handleClick = () => {
      if (!isDisabled && onClick) {
        onClick();
      }
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
      if (!isDisabled && (event.key === 'Enter' || event.key === ' ')) {
        event.preventDefault();
        handleClick();
      }
    };

    const handleFocus = () => {
      if (!isDisabled && onFocus) {
        onFocus();
      }
    };

    const handleBlur = () => {
      if (!isDisabled && onBlur) {
        onBlur();
      }
    };

    // ========================================================================
    // Style Generation
    // ========================================================================
    
    const glassClasses = generateGlassClasses(finalGlassConfig, overLight);
    const sizeClasses = generateSizeClasses(size, 'button');
    const variantClasses = generateVariantClasses(variant, overLight);
    
    const buttonClasses = generateAccessibleStyles(
      clsx(
        // Base button styles
        'inline-flex items-center justify-center gap-2',
        'font-medium rounded-lg',
        'transition-all duration-200 ease-in-out',
        'transform-gpu', // Enable GPU acceleration
        
        // Glass morphism effects
        glassClasses,
        
        // Size-specific styles
        sizeClasses,
        
        // Variant-specific styles
        variantClasses,
        
        // State-specific styles
        {
          'opacity-50 cursor-not-allowed': disabled,
          'cursor-wait': loading,
          'hover:scale-105 hover:shadow-lg': !isDisabled,
          'active:scale-95': !isDisabled,
        },
        
        // Custom className
        className
      )
    );

    // ========================================================================
    // Render
    // ========================================================================
    
    return (
      <button
        ref={ref}
        type="button"
        className={buttonClasses}
        style={style}
        disabled={isDisabled}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        data-testid={dataTestId}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-describedby={ariaDescribedBy}
        aria-expanded={ariaExpanded}
        aria-pressed={ariaPressed}
        aria-disabled={isDisabled}
        aria-busy={loading}
        role={role || 'button'}
        {...rest}
      >
        {loading && <LoadingIndicator />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

// ============================================================================
// Default Export
// ============================================================================

export default Button;
