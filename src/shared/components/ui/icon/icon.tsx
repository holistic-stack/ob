/**
 * @file Icon Component - Reusable UI Atom
 * 
 * A flexible SVG icon component with comprehensive icon library.
 * Supports multiple sizes, colors, and accessibility features.
 * 
 * Features:
 * - Comprehensive icon library with 50+ icons
 * - Multiple sizes (xs, sm, md, lg, xl, 2xl)
 * - Color variants (current, primary, secondary, success, warning, error, muted)
 * - Accessibility support with ARIA labels
 * - Click handling for interactive icons
 * - TypeScript support with icon name validation
 * 
 * @author Luciano Júnior
 * @date June 2025
 */

import React from 'react';
import { iconRegistry } from './icon-registry';
import type { IconProps, IconName, IconSize, IconColor } from './icon-types';
import './icon.css';

/**
 * Icon component implementation
 */
export const Icon: React.FC<IconProps> = ({
  name,
  size = 'md',
  color = 'current',
  className = '',
  style,
  'aria-label': ariaLabel,
  'aria-hidden': ariaHidden,
  'data-testid': testId,
  onClick,
}) => {
  console.log('[INIT] Rendering Icon component', { name, size, color });

  // Get icon definition from registry
  const iconDef = iconRegistry[name];
  
  if (!iconDef) {
    console.error('[ERROR] Icon not found in registry:', name);
    // Return a fallback icon or empty SVG
    return (
      <svg
        className={`icon icon--${size} icon--${color} icon--missing ${className}`}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={style}
        aria-label={ariaLabel || `Missing icon: ${name}`}
        aria-hidden={ariaHidden}
        data-testid={testId}
        onClick={onClick}
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M9,9h6v6H9z" />
      </svg>
    );
  }

  /**
   * Generate CSS classes based on props
   */
  const iconClasses = [
    'icon',
    `icon--${size}`,
    `icon--${color}`,
    onClick && 'icon--interactive',
    className
  ].filter(Boolean).join(' ');

  /**
   * Determine accessibility attributes
   */
  const accessibilityProps = {
    'aria-label': ariaLabel,
    'aria-hidden': ariaHidden ?? (!ariaLabel ? true : undefined),
    role: onClick ? 'button' : undefined,
    tabIndex: onClick ? 0 : undefined,
  };

  /**
   * Handle keyboard interaction for clickable icons
   */
  const handleKeyDown = (event: React.KeyboardEvent<SVGElement>) => {
    if (onClick && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      onClick(event as any);
    }
  };

  console.log('[DEBUG] Icon render state', {
    iconFound: !!iconDef,
    classes: iconClasses,
    isInteractive: !!onClick,
    hasAriaLabel: !!ariaLabel
  });

  /**
   * Render SVG paths
   */
  const renderPaths = () => {
    const { path, filled = false, strokeWidth = 2 } = iconDef;
    
    if (Array.isArray(path)) {
      return path.map((pathData, index) => (
        <path
          key={index}
          d={pathData}
          fill={filled ? 'currentColor' : 'none'}
          stroke={filled ? 'none' : 'currentColor'}
          strokeWidth={filled ? 0 : strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ));
    }
    
    return (
      <path
        d={path}
        fill={filled ? 'currentColor' : 'none'}
        stroke={filled ? 'none' : 'currentColor'}
        strokeWidth={filled ? 0 : strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    );
  };

  return (
    <svg
      className={iconClasses}
      viewBox={iconDef.viewBox}
      style={style}
      data-testid={testId}
      onClick={onClick}
      onKeyDown={onClick ? handleKeyDown : undefined}
      {...accessibilityProps}
    >
      {renderPaths()}
    </svg>
  );
};

/**
 * Export types for external use
 */
export type { IconName, IconSize, IconColor, IconProps };

/**
 * Export icon registry for external access
 */
export { iconRegistry };

/**
 * Default export for convenience
 */
export default Icon;
