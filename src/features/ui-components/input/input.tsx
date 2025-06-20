/**
 * Liquid Glass Input Component
 * 
 * An input component implementing Apple's Liquid Glass design system with
 * glass morphism effects, validation states, and accessibility features.
 */

import React, { forwardRef, useId } from 'react';
import {
  clsx,
  generateGlassClasses,
  generateSizeClasses,
  generateAccessibleStyles,
  validateGlassConfig,
  type GlassComponentProps,
  type ComponentSize,
  type ValidationState,
  type GlassConfig,
  type AriaProps,
} from '../shared';

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * Input types supported by the component
 */
export type InputType = 'text' | 'email' | 'password' | 'search' | 'number';

/**
 * Props for the Input component
 */
export interface InputProps extends Omit<GlassComponentProps, 'children'>, AriaProps {
  /** Input type */
  readonly type?: InputType;
  
  /** Input value (controlled) */
  readonly value?: string;
  
  /** Default value (uncontrolled) */
  readonly defaultValue?: string;
  
  /** Placeholder text */
  readonly placeholder?: string;
  
  /** Input size */
  readonly size?: ComponentSize;
  
  /** Validation state */
  readonly validationState?: ValidationState;
  
  /** Error message */
  readonly error?: string;
  
  /** Helper text */
  readonly helperText?: string;
  
  /** Label text */
  readonly label?: string;
  
  /** Whether the input is required */
  readonly required?: boolean;
  
  /** Whether the input is disabled */
  readonly disabled?: boolean;
  
  /** Autocomplete attribute */
  readonly autoComplete?: string;
  
  /** Left icon element */
  readonly leftIcon?: React.ReactNode;
  
  /** Right icon element */
  readonly rightIcon?: React.ReactNode;
  
  /** Glass morphism configuration */
  readonly glassConfig?: Partial<GlassConfig>;
  
  /** Whether the input is over a light background */
  readonly overLight?: boolean;
  
  /** Change handler */
  readonly onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  
  /** Focus handler */
  readonly onFocus?: (event: React.FocusEvent<HTMLInputElement>) => void;
  
  /** Blur handler */
  readonly onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  
  /** Custom CSS class name */
  readonly className?: string;
  
  /** Custom inline styles */
  readonly style?: React.CSSProperties;
  
  /** Test ID for testing */
  readonly 'data-testid'?: string;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Generates validation state classes
 */
const generateValidationClasses = (validationState: ValidationState): string => {
  switch (validationState) {
    case 'error':
      return 'border-red-500 focus-within:ring-red-500';
    case 'success':
      return 'border-green-500 focus-within:ring-green-500';
    case 'warning':
      return 'border-yellow-500 focus-within:ring-yellow-500';
    case 'default':
    default:
      return 'border-gray-300 focus-within:ring-blue-500';
  }
};

/**
 * Generates input padding classes based on size and icons
 */
const generateInputPadding = (
  size: ComponentSize,
  hasLeftIcon: boolean,
  hasRightIcon: boolean
): string => {
  const basePadding = generateSizeClasses(size, 'input');
  
  // Adjust horizontal padding for icons
  let paddingClasses = basePadding;
  
  if (hasLeftIcon) {
    paddingClasses = paddingClasses.replace(/px-\d+/, 'pl-10');
  }
  
  if (hasRightIcon) {
    paddingClasses = paddingClasses.replace(/px-\d+/, 'pr-10');
  }
  
  if (hasLeftIcon && hasRightIcon) {
    paddingClasses = 'pl-10 pr-10 ' + basePadding.replace(/px-\d+\s*/, '');
  }
  
  return paddingClasses;
};

// ============================================================================
// Input Component
// ============================================================================

/**
 * Liquid Glass Input component with glass morphism effects
 * 
 * @example
 * ```tsx
 * <Input
 *   type="email"
 *   label="Email Address"
 *   placeholder="Enter your email"
 *   validationState="error"
 *   error="Please enter a valid email"
 *   onChange={(e) => setValue(e.target.value)}
 * />
 * ```
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      type = 'text',
      value,
      defaultValue,
      placeholder,
      size = 'md',
      validationState = 'default',
      error,
      helperText,
      label,
      required = false,
      disabled = false,
      autoComplete,
      leftIcon,
      rightIcon,
      glassConfig,
      overLight = true,
      onChange,
      onFocus,
      onBlur,
      className,
      style,
      'data-testid': dataTestId = 'input-container',
      'aria-label': ariaLabel,
      'aria-labelledby': ariaLabelledBy,
      'aria-describedby': ariaDescribedBy,
      ...rest
    },
    ref
  ) => {
    // ========================================================================
    // State and Configuration
    // ========================================================================
    
    const inputId = useId();
    const errorId = useId();
    const helperTextId = useId();
    
    const hasLeftIcon = Boolean(leftIcon);
    const hasRightIcon = Boolean(rightIcon);
    const hasError = validationState === 'error' && Boolean(error);
    
    // Validate and merge glass configuration
    const glassConfigResult = validateGlassConfig(glassConfig || {});
    const finalGlassConfig = glassConfigResult.success 
      ? glassConfigResult.data 
      : validateGlassConfig({}).data;

    // ========================================================================
    // Style Generation
    // ========================================================================
    
    const glassClasses = generateGlassClasses(finalGlassConfig, overLight);
    const validationClasses = generateValidationClasses(validationState);
    const inputPaddingClasses = generateInputPadding(size, hasLeftIcon, hasRightIcon);
    
    const containerClasses = generateAccessibleStyles(
      clsx(
        // Base container styles
        'relative',
        'rounded-lg',
        'border',
        'transition-all duration-200 ease-in-out',
        'focus-within:ring-2 focus-within:ring-offset-2',
        
        // Glass morphism effects
        glassClasses,
        
        // Validation state styles
        validationClasses,
        
        // Disabled state
        disabled && 'opacity-50 cursor-not-allowed',
        
        // Custom className
        className
      )
    );

    const inputClasses = clsx(
      // Base input styles
      'w-full',
      'bg-transparent',
      'border-none',
      'outline-none',
      'placeholder-gray-500',
      'text-gray-900',
      
      // Size and padding
      inputPaddingClasses,
      
      // Disabled state
      disabled && 'cursor-not-allowed',
      
      // Dark theme text color
      !overLight && 'text-white placeholder-gray-400'
    );

    const iconClasses = 'absolute top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none';

    // ========================================================================
    // ARIA Attributes
    // ========================================================================
    
    const describedByIds = [
      hasError && errorId,
      helperText && helperTextId,
      ariaDescribedBy,
    ].filter(Boolean).join(' ');

    // ========================================================================
    // Render
    // ========================================================================
    
    return (
      <div className="space-y-1">
        {/* Label */}
        {label && (
          <label
            htmlFor={inputId}
            className={clsx(
              'block text-sm font-medium',
              overLight ? 'text-gray-700' : 'text-gray-200',
              disabled && 'opacity-50'
            )}
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        
        {/* Input Container */}
        <div
          className={containerClasses}
          style={style}
          data-testid={dataTestId}
        >
          {/* Left Icon */}
          {leftIcon && (
            <div className={clsx(iconClasses, 'left-3')}>
              {leftIcon}
            </div>
          )}
          
          {/* Input Element */}
          <input
            ref={ref}
            id={inputId}
            type={type}
            value={value}
            defaultValue={defaultValue}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            autoComplete={autoComplete}
            className={inputClasses}
            onChange={onChange}
            onFocus={onFocus}
            onBlur={onBlur}
            aria-label={ariaLabel}
            aria-labelledby={ariaLabelledBy}
            aria-describedby={describedByIds || undefined}
            aria-invalid={hasError}
            {...rest}
          />
          
          {/* Right Icon */}
          {rightIcon && (
            <div className={clsx(iconClasses, 'right-3')}>
              {rightIcon}
            </div>
          )}
        </div>
        
        {/* Error Message */}
        {hasError && (
          <p
            id={errorId}
            className="text-sm text-red-600"
            role="alert"
          >
            {error}
          </p>
        )}
        
        {/* Helper Text */}
        {helperText && !hasError && (
          <p
            id={helperTextId}
            className={clsx(
              'text-sm',
              overLight ? 'text-gray-600' : 'text-gray-400'
            )}
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

// ============================================================================
// Default Export
// ============================================================================

export default Input;
