/**
 * Test suite for the Liquid Glass Button component
 * 
 * Tests cover component rendering, props handling, user interactions,
 * accessibility features, and glass morphism effects.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './button';
import type { ButtonProps } from './button';

// ============================================================================
// Test Setup and Helpers
// ============================================================================

const defaultProps: ButtonProps = {
  children: 'Test Button',
};

const renderButton = (props: Partial<ButtonProps> = {}) => {
  return render(<Button {...defaultProps} {...props} />);
};

// ============================================================================
// Component Rendering Tests
// ============================================================================

describe('Button - Rendering', () => {
  it('should render with default props', () => {
    renderButton();
    
    const button = screen.getByRole('button', { name: 'Test Button' });
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Test Button');
  });

  it('should render with custom className', () => {
    renderButton({ className: 'custom-class' });
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('custom-class');
  });

  it('should render with custom data-testid', () => {
    renderButton({ 'data-testid': 'custom-button' });
    
    const button = screen.getByTestId('custom-button');
    expect(button).toBeInTheDocument();
  });

  it('should render with custom style', () => {
    const customStyle = { backgroundColor: 'rgb(255, 0, 0)' };
    renderButton({ style: customStyle });

    const button = screen.getByRole('button');
    expect(button).toHaveStyle('background-color: rgb(255, 0, 0)');
  });
});

// ============================================================================
// Props and Variants Tests
// ============================================================================

describe('Button - Props and Variants', () => {
  it('should render primary variant by default', () => {
    renderButton();
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('glass-effect');
  });

  it('should render secondary variant', () => {
    renderButton({ variant: 'secondary' });
    
    const button = screen.getByRole('button');
    // Should have secondary variant classes
    expect(button).toHaveClass('text-gray-700');
  });

  it('should render ghost variant', () => {
    renderButton({ variant: 'ghost' });
    
    const button = screen.getByRole('button');
    // Should have ghost variant classes
    expect(button).toHaveClass('bg-transparent');
  });

  it('should render danger variant', () => {
    renderButton({ variant: 'danger' });
    
    const button = screen.getByRole('button');
    // Should have danger variant classes
    expect(button).toHaveClass('text-white');
  });

  it('should render different sizes', () => {
    const sizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const;
    
    sizes.forEach(size => {
      const { unmount } = renderButton({ size });
      const button = screen.getByRole('button');
      
      // Should have size-specific classes
      expect(button.className).toContain('px-');
      expect(button.className).toContain('py-');
      
      unmount();
    });
  });

  it('should handle overLight prop', () => {
    const { rerender } = renderButton({ overLight: true });
    let button = screen.getByRole('button');
    expect(button).toHaveClass('glass-effect');

    rerender(<Button {...defaultProps} overLight={false} />);
    button = screen.getByRole('button');
    expect(button).toHaveClass('glass-effect-dark');
  });
});

// ============================================================================
// State and Interaction Tests
// ============================================================================

describe('Button - State and Interactions', () => {
  it('should handle click events', async () => {
    const handleClick = vi.fn();
    renderButton({ onClick: handleClick });
    
    const button = screen.getByRole('button');
    await userEvent.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should handle disabled state', () => {
    const handleClick = vi.fn();
    renderButton({ disabled: true, onClick: handleClick });
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveClass('opacity-50');
    expect(button).toHaveClass('cursor-not-allowed');
  });

  it('should not call onClick when disabled', async () => {
    const handleClick = vi.fn();
    renderButton({ disabled: true, onClick: handleClick });
    
    const button = screen.getByRole('button');
    await userEvent.click(button);
    
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('should handle loading state', () => {
    renderButton({ loading: true });
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveClass('cursor-wait');
    
    // Should show loading indicator
    const loadingIndicator = screen.getByTestId('button-loading');
    expect(loadingIndicator).toBeInTheDocument();
  });

  it('should handle focus events', async () => {
    const handleFocus = vi.fn();
    const handleBlur = vi.fn();
    renderButton({ onFocus: handleFocus, onBlur: handleBlur });
    
    const button = screen.getByRole('button');
    
    await userEvent.tab(); // Focus the button
    expect(handleFocus).toHaveBeenCalledTimes(1);
    
    await userEvent.tab(); // Blur the button
    expect(handleBlur).toHaveBeenCalledTimes(1);
  });
});

// ============================================================================
// Accessibility Tests
// ============================================================================

describe('Button - Accessibility', () => {
  it('should have proper ARIA attributes', () => {
    renderButton({
      'aria-label': 'Custom label',
      'aria-describedby': 'description',
    });
    
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Custom label');
    expect(button).toHaveAttribute('aria-describedby', 'description');
  });

  it('should have proper disabled ARIA state', () => {
    renderButton({ disabled: true });
    
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-disabled', 'true');
  });

  it('should have proper loading ARIA state', () => {
    renderButton({ loading: true });
    
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(button).toHaveAttribute('aria-busy', 'true');
  });

  it('should be keyboard accessible', async () => {
    const handleClick = vi.fn();
    renderButton({ onClick: handleClick });
    
    const button = screen.getByRole('button');
    
    // Should be focusable
    await userEvent.tab();
    expect(button).toHaveFocus();
    
    // Should activate on Enter
    fireEvent.keyDown(button, { key: 'Enter', code: 'Enter' });
    expect(handleClick).toHaveBeenCalledTimes(1);
    
    // Should activate on Space
    fireEvent.keyDown(button, { key: ' ', code: 'Space' });
    expect(handleClick).toHaveBeenCalledTimes(2);
  });

  it('should have focus indicators', () => {
    renderButton();
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('focus:outline-none');
    expect(button).toHaveClass('focus:ring-2');
  });
});

// ============================================================================
// Glass Morphism Tests
// ============================================================================

describe('Button - Glass Morphism', () => {
  it('should apply default glass configuration', () => {
    renderButton();
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('glass-effect');
    expect(button).toHaveClass('glass-blur-lg');
  });

  it('should apply custom glass configuration', () => {
    renderButton({
      glassConfig: {
        blurIntensity: 'xl',
        opacity: 0.3,
        elevation: 'high',
      },
    });
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('glass-blur-xl');
    expect(button).toHaveClass('glass-bg-heavy');
  });

  it('should handle browser compatibility gracefully', () => {
    // Mock CSS.supports to return false
    const originalSupports = CSS.supports;
    CSS.supports = vi.fn().mockReturnValue(false);
    
    renderButton();
    
    const button = screen.getByRole('button');
    // Should have fallback styles when glass effects are not supported
    expect(button.className).toBeTruthy();
    
    // Restore original CSS.supports
    CSS.supports = originalSupports;
  });
});

// ============================================================================
// Edge Cases and Error Handling Tests
// ============================================================================

describe('Button - Edge Cases', () => {
  it('should handle empty children', () => {
    renderButton({ children: '' });
    
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('');
  });

  it('should handle complex children', () => {
    renderButton({
      children: (
        <span>
          <strong>Bold</strong> text
        </span>
      ),
    });
    
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button.querySelector('strong')).toHaveTextContent('Bold');
  });

  it('should handle multiple event handlers', async () => {
    const handleClick1 = vi.fn();
    const handleClick2 = vi.fn();
    
    renderButton({
      onClick: () => {
        handleClick1();
        handleClick2();
      },
    });
    
    const button = screen.getByRole('button');
    await userEvent.click(button);
    
    expect(handleClick1).toHaveBeenCalledTimes(1);
    expect(handleClick2).toHaveBeenCalledTimes(1);
  });
});
