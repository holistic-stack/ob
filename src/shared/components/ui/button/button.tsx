/**
 * @file Button Component - Reusable UI Atom
 * 
 * A flexible, accessible button component following atomic design principles.
 * Supports multiple variants, sizes, states, and loading indicators.
 * 
 * Features:
 * - Multiple variants (primary, secondary, danger, ghost)
 * - Different sizes (small, medium, large)
 * - Loading states with spinner
 * - Disabled states
 * - Icon support (left/right)
 * - Full accessibility (ARIA, keyboard navigation)
 * - TypeScript generics for flexible event handling
 * 
 * @author Luciano Júnior
 * @date June 2025
 */

import React, { forwardRef } from 'react';
import { LoadingSpinner } from '../loading-spinner/loading-spinner';
import { Icon } from '../icon/icon';
import type { IconName } from '../icon/icon-types';
import './button.css';

/**
 * Button variant types for different visual styles
 */
export type ButtonVariant = 
  | 'primary'     // Main action button (blue background)
  | 'secondary'   // Secondary action (outlined)
  | 'danger'      // Destructive action (red)
  | 'ghost'       // Minimal styling (transparent)
  | 'link';       // Text-only link style

/**
 * Button size options
 */
export type ButtonSize = 
  | 'small'       // Compact button (28px height)
  | 'medium'      // Default button (36px height)
  | 'large';      // Prominent button (44px height)

/**
 * Button component props with generic event handler
 */
export interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> {
  /** Visual variant of the button */
  variant?: ButtonVariant;
  
  /** Size of the button */
  size?: ButtonSize;
  
  /** Whether the button is in loading state */
  loading?: boolean;
  
  /** Icon to display on the left side */
  leftIcon?: IconName;
  
  /** Icon to display on the right side */
  rightIcon?: IconName;
  
  /** Whether the button should take full width */
  fullWidth?: boolean;
  
  /** Custom click handler with proper typing */
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void | Promise<void>;
  
  /** Children content (text or elements) */
  children: React.ReactNode;
  
  /** Additional CSS classes */
  className?: string;
  
  /** Test ID for testing */
  'data-testid'?: string;
}

/**
 * Button component implementation with forwardRef for proper ref handling
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'medium',
      loading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      onClick,
      children,
      className = '',
      disabled,
      type = 'button',
      'data-testid': testId,
      ...rest
    },
    ref
  ) => {
    console.log('[INIT] Rendering Button component', { variant, size, loading, disabled });

    /**
     * Handle button click with loading state management
     */
    const handleClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
      if (loading || disabled || !onClick) {
        console.log('[DEBUG] Button click ignored', { loading, disabled, hasOnClick: !!onClick });
        return;
      }

      try {
        console.log('[DEBUG] Button click triggered');
        await onClick(event);
        console.log('[DEBUG] Button click completed successfully');
      } catch (error) {
        console.error('[ERROR] Button click failed:', error);
        // Allow error to propagate to error boundaries
        throw error;
      }
    };

    /**
     * Generate CSS classes based on props
     */
    const buttonClasses = [
      'button',
      `button--${variant}`,
      `button--${size}`,
      fullWidth && 'button--full-width',
      loading && 'button--loading',
      disabled && 'button--disabled',
      className
    ].filter(Boolean).join(' ');

    /**
     * Determine if button should be disabled
     */
    const isDisabled = disabled || loading;

    console.log('[DEBUG] Button render state', {
      classes: buttonClasses,
      isDisabled,
      hasLeftIcon: !!leftIcon,
      hasRightIcon: !!rightIcon
    });

    return (
      <button
        ref={ref}
        type={type}
        className={buttonClasses}
        disabled={isDisabled}
        onClick={handleClick}
        data-testid={testId}
        aria-busy={loading}
        aria-disabled={isDisabled}
        {...rest}
      >
        {/* Left icon */}
        {leftIcon && !loading && (
          <Icon
            name={leftIcon}
            className="button__icon button__icon--left"
            aria-hidden={true}
          />
        )}
        
        {/* Loading spinner */}
        {loading && (
          <LoadingSpinner 
            size={size === 'small' ? 'small' : 'medium'}
            className="button__spinner"
            aria-label="Loading"
          />
        )}
        
        {/* Button content */}
        <span className="button__content">
          {children}
        </span>
        
        {/* Right icon */}
        {rightIcon && !loading && (
          <Icon
            name={rightIcon}
            className="button__icon button__icon--right"
            aria-hidden={true}
          />
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

/**
 * Button compound components for common patterns
 */
export const ButtonGroup = ({ 
  children, 
  className = '',
  'data-testid': testId,
  ...rest 
}: {
  children: React.ReactNode;
  className?: string;
  'data-testid'?: string;
} & React.HTMLAttributes<HTMLDivElement>) => {
  console.log('[INIT] Rendering ButtonGroup component');
  
  return (
    <div 
      className={`button-group ${className}`}
      data-testid={testId}
      role="group"
      {...rest}
    >
      {children}
    </div>
  );
};

ButtonGroup.displayName = 'ButtonGroup';

/**
 * Types are exported inline above where they are defined
 */

/**
 * Default export for convenience
 */
export default Button;
