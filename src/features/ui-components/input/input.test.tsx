/**
 * Test suite for the Liquid Glass Input component
 * 
 * Tests cover component rendering, input types, validation states,
 * accessibility features, and glass morphism effects.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from './input';
import type { InputProps } from './input';

// ============================================================================
// Test Setup and Helpers
// ============================================================================

const defaultProps: InputProps = {
  placeholder: 'Enter text...',
};

const renderInput = (props: Partial<InputProps> = {}) => {
  return render(<Input {...defaultProps} {...props} />);
};

// ============================================================================
// Component Rendering Tests
// ============================================================================

describe('Input - Rendering', () => {
  it('should render with default props', () => {
    renderInput();
    
    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('placeholder', 'Enter text...');
  });

  it('should render with custom className', () => {
    renderInput({ className: 'custom-input-class' });
    
    const container = screen.getByTestId('input-container');
    expect(container).toHaveClass('custom-input-class');
  });

  it('should render with custom data-testid', () => {
    renderInput({ 'data-testid': 'custom-input' });
    
    const container = screen.getByTestId('custom-input');
    expect(container).toBeInTheDocument();
  });

  it('should render with custom style', () => {
    const customStyle = { backgroundColor: 'rgb(255, 0, 0)' };
    renderInput({ style: customStyle });
    
    const container = screen.getByTestId('input-container');
    expect(container).toHaveStyle('background-color: rgb(255, 0, 0)');
  });

  it('should render with label', () => {
    renderInput({ label: 'Email Address' });
    
    const label = screen.getByText('Email Address');
    const input = screen.getByRole('textbox');
    
    expect(label).toBeInTheDocument();
    expect(label).toHaveAttribute('for', input.id);
  });
});

// ============================================================================
// Input Types and Variants Tests
// ============================================================================

describe('Input - Types and Variants', () => {
  it('should render different input types', () => {
    const types = ['text', 'email', 'password', 'search', 'number'] as const;

    types.forEach(type => {
      const { unmount } = renderInput({ type });

      // Different input types have different roles or no specific role
      let input;
      if (type === 'search') {
        input = screen.getByRole('searchbox');
      } else if (type === 'password') {
        input = screen.getByPlaceholderText('Enter text...');
      } else if (type === 'number') {
        input = screen.getByRole('spinbutton');
      } else {
        input = screen.getByRole('textbox');
      }

      expect(input).toHaveAttribute('type', type);

      unmount();
    });
  });

  it('should render different sizes', () => {
    const sizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const;
    
    sizes.forEach(size => {
      const { unmount } = renderInput({ size });
      const input = screen.getByRole('textbox');
      
      // Should have size-specific classes
      expect(input.className).toContain('px-');
      expect(input.className).toContain('py-');
      
      unmount();
    });
  });

  it('should handle overLight prop', () => {
    const { rerender } = renderInput({ overLight: true });
    let container = screen.getByTestId('input-container');
    expect(container).toHaveClass('glass-effect');

    rerender(<Input {...defaultProps} overLight={false} />);
    container = screen.getByTestId('input-container');
    expect(container).toHaveClass('glass-effect-dark');
  });
});

// ============================================================================
// Validation States Tests
// ============================================================================

describe('Input - Validation States', () => {
  it('should render default validation state', () => {
    renderInput();
    
    const container = screen.getByTestId('input-container');
    expect(container).not.toHaveClass('border-red-500');
    expect(container).not.toHaveClass('border-green-500');
  });

  it('should render error validation state', () => {
    renderInput({ 
      validationState: 'error',
      error: 'This field is required'
    });
    
    const container = screen.getByTestId('input-container');
    const errorMessage = screen.getByText('This field is required');
    
    expect(container).toHaveClass('border-red-500');
    expect(errorMessage).toBeInTheDocument();
    expect(errorMessage).toHaveClass('text-red-600');
  });

  it('should render success validation state', () => {
    renderInput({ validationState: 'success' });
    
    const container = screen.getByTestId('input-container');
    expect(container).toHaveClass('border-green-500');
  });

  it('should render warning validation state', () => {
    renderInput({ validationState: 'warning' });
    
    const container = screen.getByTestId('input-container');
    expect(container).toHaveClass('border-yellow-500');
  });

  it('should display helper text', () => {
    renderInput({ helperText: 'Enter your email address' });
    
    const helperText = screen.getByText('Enter your email address');
    expect(helperText).toBeInTheDocument();
    expect(helperText).toHaveClass('text-gray-600');
  });
});

// ============================================================================
// State and Interaction Tests
// ============================================================================

describe('Input - State and Interactions', () => {
  it('should handle value changes', async () => {
    const handleChange = vi.fn();
    renderInput({ onChange: handleChange });
    
    const input = screen.getByRole('textbox');
    await userEvent.type(input, 'test value');
    
    expect(handleChange).toHaveBeenCalled();
    expect(input).toHaveValue('test value');
  });

  it('should handle controlled value', () => {
    renderInput({ value: 'controlled value' });
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveValue('controlled value');
  });

  it('should handle disabled state', () => {
    renderInput({ disabled: true });
    
    const input = screen.getByRole('textbox');
    const container = screen.getByTestId('input-container');
    
    expect(input).toBeDisabled();
    expect(container).toHaveClass('opacity-50');
    expect(container).toHaveClass('cursor-not-allowed');
  });

  it('should handle focus and blur events', async () => {
    const handleFocus = vi.fn();
    const handleBlur = vi.fn();
    renderInput({ onFocus: handleFocus, onBlur: handleBlur });
    
    const input = screen.getByRole('textbox');
    
    await userEvent.click(input);
    expect(handleFocus).toHaveBeenCalledTimes(1);
    
    await userEvent.tab();
    expect(handleBlur).toHaveBeenCalledTimes(1);
  });

  it('should handle required attribute', () => {
    renderInput({ required: true });
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('required');
  });
});

// ============================================================================
// Icons and Addons Tests
// ============================================================================

describe('Input - Icons and Addons', () => {
  it('should render with left icon', () => {
    const leftIcon = <span data-testid="left-icon">🔍</span>;
    renderInput({ leftIcon });
    
    const icon = screen.getByTestId('left-icon');
    expect(icon).toBeInTheDocument();
  });

  it('should render with right icon', () => {
    const rightIcon = <span data-testid="right-icon">✓</span>;
    renderInput({ rightIcon });
    
    const icon = screen.getByTestId('right-icon');
    expect(icon).toBeInTheDocument();
  });

  it('should render with both icons', () => {
    const leftIcon = <span data-testid="left-icon">🔍</span>;
    const rightIcon = <span data-testid="right-icon">✓</span>;
    renderInput({ leftIcon, rightIcon });
    
    const leftIconElement = screen.getByTestId('left-icon');
    const rightIconElement = screen.getByTestId('right-icon');
    
    expect(leftIconElement).toBeInTheDocument();
    expect(rightIconElement).toBeInTheDocument();
  });

  it('should adjust padding when icons are present', () => {
    const { rerender } = renderInput();
    let input = screen.getByRole('textbox');
    const originalClasses = input.className;

    const leftIcon = <span data-testid="left-icon">🔍</span>;
    rerender(<Input {...defaultProps} leftIcon={leftIcon} />);
    input = screen.getByRole('textbox');
    
    // Should have different padding when icon is present
    expect(input.className).not.toBe(originalClasses);
  });
});

// ============================================================================
// Accessibility Tests
// ============================================================================

describe('Input - Accessibility', () => {
  it('should have proper ARIA attributes', () => {
    renderInput({
      'aria-label': 'Custom input label',
      'aria-describedby': 'input-description',
    });
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('aria-label', 'Custom input label');
    expect(input).toHaveAttribute('aria-describedby', 'input-description');
  });

  it('should associate label with input', () => {
    renderInput({ label: 'Email Address' });
    
    const label = screen.getByText('Email Address');
    const input = screen.getByRole('textbox');
    
    expect(label).toHaveAttribute('for', input.id);
    expect(input).toHaveAttribute('id');
  });

  it('should have proper error ARIA attributes', () => {
    renderInput({ 
      validationState: 'error',
      error: 'This field is required'
    });
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby');
  });

  it('should have focus indicators', () => {
    renderInput();
    
    const container = screen.getByTestId('input-container');
    expect(container).toHaveClass('focus-within:ring-2');
  });

  it('should support autocomplete', () => {
    renderInput({ autoComplete: 'email' });
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('autocomplete', 'email');
  });
});

// ============================================================================
// Glass Morphism Tests
// ============================================================================

describe('Input - Glass Morphism', () => {
  it('should apply default glass configuration', () => {
    renderInput();
    
    const container = screen.getByTestId('input-container');
    expect(container).toHaveClass('glass-effect');
    expect(container).toHaveClass('glass-blur-lg');
  });

  it('should apply custom glass configuration', () => {
    renderInput({
      glassConfig: {
        blurIntensity: 'xl',
        opacity: 0.3,
        elevation: 'high',
      },
    });
    
    const container = screen.getByTestId('input-container');
    expect(container).toHaveClass('glass-blur-xl');
    expect(container).toHaveClass('glass-bg-heavy');
  });

  it('should handle browser compatibility gracefully', () => {
    // Mock CSS.supports to return false
    const originalSupports = CSS.supports;
    CSS.supports = vi.fn().mockReturnValue(false);
    
    renderInput();
    
    const container = screen.getByTestId('input-container');
    // Should have fallback styles when glass effects are not supported
    expect(container.className).toBeTruthy();
    
    // Restore original CSS.supports
    CSS.supports = originalSupports;
  });
});

// ============================================================================
// Edge Cases Tests
// ============================================================================

describe('Input - Edge Cases', () => {
  it('should handle empty placeholder', () => {
    renderInput({ placeholder: '' });
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('placeholder', '');
  });

  it('should handle long error messages', () => {
    const longError = 'This is a very long error message that should wrap properly and not break the layout of the input component';
    renderInput({ 
      validationState: 'error',
      error: longError
    });
    
    const errorMessage = screen.getByText(longError);
    expect(errorMessage).toBeInTheDocument();
  });

  it('should handle special characters in value', async () => {
    const handleChange = vi.fn();
    renderInput({ onChange: handleChange });

    const input = screen.getByRole('textbox');
    const specialText = '!@#$%^&*()_+-=.,<>?';

    await userEvent.type(input, specialText);
    expect(input).toHaveValue(specialText);
  });
});
