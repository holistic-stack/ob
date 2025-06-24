/**
 * Editor Layout Component
 * 
 * Main layout component for the code editor interface with glass morphism effects.
 * Provides responsive layout structure for file explorer, code editor, visualization, and console panels.
 */

import React, { forwardRef } from 'react';
import {
  clsx,
  generateGlassClasses,
  generateAccessibleStyles,
  type BaseComponentProps,
  type AriaProps,
  type GlassConfig,
} from '../../shared';

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * Layout variant types
 */
export type EditorLayoutVariant = 'default' | 'compact' | 'expanded';

/**
 * Props for the EditorLayout component
 */
export interface EditorLayoutProps extends BaseComponentProps, AriaProps {
  /** Layout content */
  readonly children: React.ReactNode;
  
  /** Layout variant */
  readonly variant?: EditorLayoutVariant;
  
  /** Whether to use responsive layout */
  readonly responsive?: boolean;
  
  /** Glass morphism configuration */
  readonly glassConfig?: Partial<GlassConfig>;
  
  /** Whether the layout is over a light background */
  readonly overLight?: boolean;
  
  /** Custom CSS class name */
  readonly className?: string;
  
  /** Custom inline styles */
  readonly style?: React.CSSProperties;
  
  /** Test ID for testing */
  readonly 'data-testid'?: string;
}

// ============================================================================
// EditorLayout Component
// ============================================================================

/**
 * Editor Layout component with glass morphism effects
 * 
 * @example
 * ```tsx
 * <EditorLayout variant="default" responsive>
 *   <FileExplorer />
 *   <CodeEditor />
 *   <VisualizationPanel />
 *   <ConsolePanel />
 * </EditorLayout>
 * ```
 */
export const EditorLayout = forwardRef<HTMLElement, EditorLayoutProps>(
  (
    {
      children,
      variant = 'default',
      responsive = true,
      glassConfig,
      overLight = false,
      className,
      style,
      'data-testid': dataTestId,
      'aria-label': ariaLabel,
      'aria-labelledby': ariaLabelledBy,
      'aria-describedby': ariaDescribedBy,
      role,
      ...rest
    },
    ref
  ) => {
    // ========================================================================
    // Style Generation
    // ========================================================================
    
    const glassClasses = generateGlassClasses(glassConfig ?? {}, overLight);
    
    const variantClasses = {
      default: 'p-4',
      compact: 'p-2',
      expanded: 'p-6',
    }[variant];
    
    const responsiveClasses = responsive 
      ? 'flex-col lg:flex-row' 
      : 'flex-row';
    
    const layoutClasses = generateAccessibleStyles(
      clsx(
        // Base layout styles
        'min-h-screen w-full flex',
        'relative overflow-hidden',
        
        // Glass morphism effects
        'bg-black/20 backdrop-blur-sm border border-white/50',
        'shadow-[inset_0_1px_0px_rgba(255,255,255,0.75),0_0_9px_rgba(0,0,0,0.2),0_3px_8px_rgba(0,0,0,0.15)]',
        
        // Gradient pseudo-elements for refraction
        'before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/60 before:via-transparent before:to-transparent before:opacity-70 before:pointer-events-none',
        'after:absolute after:inset-0 after:bg-gradient-to-tl after:from-white/30 after:via-transparent after:to-transparent after:opacity-50 after:pointer-events-none',
        
        // Variant-specific styles
        variantClasses,
        
        // Responsive layout
        responsiveClasses,
        
        // Custom className
        className
      )
    );

    // ========================================================================
    // Render
    // ========================================================================
    
    return (
      <main
        ref={ref}
        className={layoutClasses}
        style={style}
        data-testid={dataTestId}
        aria-label={ariaLabel ?? 'Code Editor Interface'}
        aria-labelledby={ariaLabelledBy}
        aria-describedby={ariaDescribedBy}
        role={role ?? 'main'}
        {...rest}
      >
        <div className="relative z-10 w-full h-full flex flex-col lg:flex-row">
          {children}
        </div>
      </main>
    );
  }
);

EditorLayout.displayName = 'EditorLayout';

// ============================================================================
// Default Export
// ============================================================================

export default EditorLayout;
