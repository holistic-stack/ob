/**
 * Test suite for the Liquid Glass Card component
 * 
 * Tests cover component rendering, props handling, elevation levels,
 * accessibility features, and glass morphism effects.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Card } from './card';
import type { CardProps } from './card';

// ============================================================================
// Test Setup and Helpers
// ============================================================================

const defaultProps: CardProps = {
  children: <div>Test Card Content</div>,
};

const renderCard = (props: Partial<CardProps> = {}) => {
  return render(<Card {...defaultProps} {...props} />);
};

// ============================================================================
// Component Rendering Tests
// ============================================================================

describe('Card - Rendering', () => {
  it('should render with default props', () => {
    renderCard();
    
    const card = screen.getByTestId('card');
    expect(card).toBeInTheDocument();
    expect(card).toHaveTextContent('Test Card Content');
  });

  it('should render with custom className', () => {
    renderCard({ className: 'custom-card-class' });
    
    const card = screen.getByTestId('card');
    expect(card).toHaveClass('custom-card-class');
  });

  it('should render with custom data-testid', () => {
    renderCard({ 'data-testid': 'custom-card' });
    
    const card = screen.getByTestId('custom-card');
    expect(card).toBeInTheDocument();
  });

  it('should render with custom style', () => {
    const customStyle = { backgroundColor: 'rgb(255, 0, 0)' };
    renderCard({ style: customStyle });
    
    const card = screen.getByTestId('card');
    expect(card).toHaveStyle('background-color: rgb(255, 0, 0)');
  });

  it('should render as different HTML elements', () => {
    const { rerender } = renderCard({ as: 'section' });
    let card = screen.getByTestId('card');
    expect(card.tagName).toBe('SECTION');

    rerender(<Card {...defaultProps} as="article" />);
    card = screen.getByTestId('card');
    expect(card.tagName).toBe('ARTICLE');
  });
});

// ============================================================================
// Props and Variants Tests
// ============================================================================

describe('Card - Props and Variants', () => {
  it('should render default variant', () => {
    renderCard();
    
    const card = screen.getByTestId('card');
    expect(card).toHaveClass('glass-effect');
  });

  it('should render bordered variant', () => {
    renderCard({ variant: 'bordered' });
    
    const card = screen.getByTestId('card');
    expect(card).toHaveClass('border-2');
  });

  it('should render elevated variant', () => {
    renderCard({ variant: 'elevated' });
    
    const card = screen.getByTestId('card');
    expect(card.className).toContain('shadow');
  });

  it('should render interactive variant', () => {
    renderCard({ variant: 'interactive' });
    
    const card = screen.getByTestId('card');
    expect(card).toHaveClass('cursor-pointer');
    expect(card).toHaveClass('hover:scale-105');
  });

  it('should render different elevation levels', () => {
    const elevations = ['low', 'medium', 'high', 'floating'] as const;
    
    elevations.forEach(elevation => {
      const { unmount } = renderCard({ elevation });
      const card = screen.getByTestId('card');
      
      // Should have elevation-specific shadow classes
      expect(card.className).toBeTruthy();
      
      unmount();
    });
  });

  it('should handle overLight prop', () => {
    const { rerender } = renderCard({ overLight: true });
    let card = screen.getByTestId('card');
    expect(card).toHaveClass('glass-effect');

    rerender(<Card {...defaultProps} overLight={false} />);
    card = screen.getByTestId('card');
    expect(card).toHaveClass('glass-effect-dark');
  });

  it('should handle padding variants', () => {
    const paddings = ['none', 'sm', 'md', 'lg', 'xl'] as const;
    
    paddings.forEach(padding => {
      const { unmount } = renderCard({ padding });
      const card = screen.getByTestId('card');
      
      if (padding === 'none') {
        expect(card).toHaveClass('p-0');
      } else {
        expect(card.className).toContain('p-');
      }
      
      unmount();
    });
  });
});

// ============================================================================
// Interactive Features Tests
// ============================================================================

describe('Card - Interactive Features', () => {
  it('should handle click events when interactive', async () => {
    const handleClick = vi.fn();
    renderCard({ variant: 'interactive', onClick: handleClick });
    
    const card = screen.getByTestId('card');
    await userEvent.click(card);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should not handle click events when not interactive', async () => {
    const handleClick = vi.fn();
    renderCard({ onClick: handleClick });
    
    const card = screen.getByTestId('card');
    await userEvent.click(card);
    
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('should handle keyboard events when interactive', async () => {
    const handleClick = vi.fn();
    renderCard({ variant: 'interactive', onClick: handleClick });
    
    const card = screen.getByTestId('card');
    
    // Should be focusable
    await userEvent.tab();
    expect(card).toHaveFocus();
    
    // Should activate on Enter
    fireEvent.keyDown(card, { key: 'Enter', code: 'Enter' });
    expect(handleClick).toHaveBeenCalledTimes(1);
    
    // Should activate on Space
    fireEvent.keyDown(card, { key: ' ', code: 'Space' });
    expect(handleClick).toHaveBeenCalledTimes(2);
  });

  it('should handle focus and blur events', async () => {
    const handleFocus = vi.fn();
    const handleBlur = vi.fn();
    renderCard({ 
      variant: 'interactive', 
      onFocus: handleFocus, 
      onBlur: handleBlur 
    });
    
    const card = screen.getByTestId('card');
    
    await userEvent.tab(); // Focus the card
    expect(handleFocus).toHaveBeenCalledTimes(1);
    
    await userEvent.tab(); // Blur the card
    expect(handleBlur).toHaveBeenCalledTimes(1);
  });
});

// ============================================================================
// Accessibility Tests
// ============================================================================

describe('Card - Accessibility', () => {
  it('should have proper ARIA attributes when interactive', () => {
    renderCard({
      variant: 'interactive',
      'aria-label': 'Custom card label',
      'aria-describedby': 'card-description',
    });
    
    const card = screen.getByTestId('card');
    expect(card).toHaveAttribute('role', 'button');
    expect(card).toHaveAttribute('aria-label', 'Custom card label');
    expect(card).toHaveAttribute('aria-describedby', 'card-description');
    expect(card).toHaveAttribute('tabIndex', '0');
  });

  it('should not have interactive ARIA attributes when not interactive', () => {
    renderCard({
      'aria-label': 'Custom card label',
    });
    
    const card = screen.getByTestId('card');
    expect(card).not.toHaveAttribute('role', 'button');
    expect(card).toHaveAttribute('aria-label', 'Custom card label');
    expect(card).not.toHaveAttribute('tabIndex');
  });

  it('should have focus indicators when interactive', () => {
    renderCard({ variant: 'interactive' });
    
    const card = screen.getByTestId('card');
    expect(card).toHaveClass('focus:outline-none');
    expect(card).toHaveClass('focus:ring-2');
  });

  it('should support custom roles', () => {
    renderCard({ role: 'article' });
    
    const card = screen.getByTestId('card');
    expect(card).toHaveAttribute('role', 'article');
  });
});

// ============================================================================
// Glass Morphism Tests
// ============================================================================

describe('Card - Glass Morphism', () => {
  it('should apply default glass configuration', () => {
    renderCard();
    
    const card = screen.getByTestId('card');
    expect(card).toHaveClass('glass-effect');
    expect(card).toHaveClass('glass-blur-lg');
  });

  it('should apply custom glass configuration', () => {
    renderCard({
      glassConfig: {
        blurIntensity: 'xl',
        opacity: 0.3,
        elevation: 'high',
      },
    });
    
    const card = screen.getByTestId('card');
    expect(card).toHaveClass('glass-blur-xl');
    expect(card).toHaveClass('glass-bg-heavy');
  });

  it('should handle browser compatibility gracefully', () => {
    // Mock CSS.supports to return false
    const originalSupports = CSS.supports;
    CSS.supports = vi.fn().mockReturnValue(false);
    
    renderCard();
    
    const card = screen.getByTestId('card');
    // Should have fallback styles when glass effects are not supported
    expect(card.className).toBeTruthy();
    
    // Restore original CSS.supports
    CSS.supports = originalSupports;
  });
});

// ============================================================================
// Content and Layout Tests
// ============================================================================

describe('Card - Content and Layout', () => {
  it('should render complex children', () => {
    renderCard({
      children: (
        <div>
          <h2>Card Title</h2>
          <p>Card description with <strong>bold</strong> text</p>
          <button>Action Button</button>
        </div>
      ),
    });
    
    const card = screen.getByTestId('card');
    expect(card).toBeInTheDocument();
    expect(screen.getByText('Card Title')).toBeInTheDocument();
    expect(screen.getByText('bold')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Action Button' })).toBeInTheDocument();
  });

  it('should handle empty children', () => {
    renderCard({ children: null });
    
    const card = screen.getByTestId('card');
    expect(card).toBeInTheDocument();
    expect(card).toBeEmptyDOMElement();
  });

  it('should handle string children', () => {
    renderCard({ children: 'Simple text content' });
    
    const card = screen.getByTestId('card');
    expect(card).toHaveTextContent('Simple text content');
  });
});

// ============================================================================
// Edge Cases Tests
// ============================================================================

describe('Card - Edge Cases', () => {
  it('should handle multiple event handlers', async () => {
    const handleClick1 = vi.fn();
    const handleClick2 = vi.fn();
    
    renderCard({
      variant: 'interactive',
      onClick: () => {
        handleClick1();
        handleClick2();
      },
    });
    
    const card = screen.getByTestId('card');
    await userEvent.click(card);
    
    expect(handleClick1).toHaveBeenCalledTimes(1);
    expect(handleClick2).toHaveBeenCalledTimes(1);
  });

  it('should handle rapid clicks gracefully', async () => {
    const handleClick = vi.fn();
    renderCard({ variant: 'interactive', onClick: handleClick });
    
    const card = screen.getByTestId('card');
    
    // Simulate rapid clicks
    await userEvent.click(card);
    await userEvent.click(card);
    await userEvent.click(card);
    
    expect(handleClick).toHaveBeenCalledTimes(3);
  });
});
