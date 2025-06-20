/**
 * @file Loading Spinner Component - Reusable UI Atom
 * 
 * A flexible loading spinner component with multiple variants and sizes.
 * Provides visual feedback for loading states with accessibility support.
 * 
 * Features:
 * - Multiple variants (dots, bars, circle, pulse)
 * - Different sizes (small, medium, large)
 * - Customizable colors
 * - Accessibility with ARIA labels
 * - CSS animations with reduced motion support
 * 
 * @author Luciano Júnior
 * @date June 2025
 */

import React from 'react';
import './loading-spinner.css';

/**
 * Loading spinner variant types
 */
export type LoadingSpinnerVariant = 
  | 'dots'      // Three bouncing dots
  | 'bars'      // Three scaling bars
  | 'circle'    // Rotating circle
  | 'pulse';    // Pulsing circle

/**
 * Loading spinner size options
 */
export type LoadingSpinnerSize = 
  | 'small'     // 16px
  | 'medium'    // 24px
  | 'large';    // 32px

/**
 * Loading spinner component props
 */
export interface LoadingSpinnerProps {
  /** Visual variant of the spinner */
  variant?: LoadingSpinnerVariant;
  
  /** Size of the spinner */
  size?: LoadingSpinnerSize;
  
  /** Custom color for the spinner */
  color?: string;
  
  /** Additional CSS classes */
  className?: string;
  
  /** Accessible label for screen readers */
  'aria-label'?: string;
  
  /** Test ID for testing */
  'data-testid'?: string;
}

/**
 * Loading Spinner component implementation
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  variant = 'circle',
  size = 'medium',
  color,
  className = '',
  'aria-label': ariaLabel = 'Loading',
  'data-testid': testId,
}) => {
  console.log('[INIT] Rendering LoadingSpinner component', { variant, size, color });

  /**
   * Generate CSS classes based on props
   */
  const spinnerClasses = [
    'loading-spinner',
    `loading-spinner--${variant}`,
    `loading-spinner--${size}`,
    className
  ].filter(Boolean).join(' ');

  /**
   * Custom style for color override
   */
  const customStyle = color ? { '--spinner-color': color } as React.CSSProperties : undefined;

  console.log('[DEBUG] LoadingSpinner render state', {
    classes: spinnerClasses,
    hasCustomColor: !!color,
    ariaLabel
  });

  /**
   * Render different spinner variants
   */
  const renderSpinner = () => {
    switch (variant) {
      case 'dots':
        return (
          <div className="loading-spinner__dots">
            <div className="loading-spinner__dot" />
            <div className="loading-spinner__dot" />
            <div className="loading-spinner__dot" />
          </div>
        );

      case 'bars':
        return (
          <div className="loading-spinner__bars">
            <div className="loading-spinner__bar" />
            <div className="loading-spinner__bar" />
            <div className="loading-spinner__bar" />
          </div>
        );

      case 'circle':
        return (
          <div className="loading-spinner__circle">
            <svg viewBox="0 0 24 24" className="loading-spinner__svg">
              <circle
                cx="12"
                cy="12"
                r="10"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray="31.416"
                strokeDashoffset="31.416"
                className="loading-spinner__circle-path"
              />
            </svg>
          </div>
        );

      case 'pulse':
        return (
          <div className="loading-spinner__pulse">
            <div className="loading-spinner__pulse-circle" />
          </div>
        );

      default:
        console.warn('[WARN] Unknown spinner variant:', variant);
        return (
          <div className="loading-spinner__circle">
            <svg viewBox="0 0 24 24" className="loading-spinner__svg">
              <circle
                cx="12"
                cy="12"
                r="10"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray="31.416"
                strokeDashoffset="31.416"
                className="loading-spinner__circle-path"
              />
            </svg>
          </div>
        );
    }
  };

  return (
    <div
      className={spinnerClasses}
      style={customStyle}
      role="status"
      aria-label={ariaLabel}
      aria-live="polite"
      data-testid={testId}
    >
      {renderSpinner()}
      {/* Hidden text for screen readers */}
      <span className="loading-spinner__sr-only">{ariaLabel}</span>
    </div>
  );
};

/**
 * Types are exported inline above where they are defined
 */

/**
 * Default export for convenience
 */
export default LoadingSpinner;
